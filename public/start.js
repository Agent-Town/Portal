function setStatus(msg, isError = false) {
  const statusNode = document.getElementById('startStatus');
  if (!statusNode) return;
  statusNode.textContent = msg || '';
  statusNode.style.color = isError ? 'var(--bad-strong)' : 'var(--muted)';
}

let cachedPrivyConfig = null;
let autoRedirecting = false;
const START_PRIVY_SESSION_CHECK_TIMEOUT_MS = 8000;
const START_PRIVY_LOGIN_TIMEOUT_MS = 60000;
const START_PRIVY_WALLET_WARMUP_TIMEOUT_MS = 15000;

function getArrivalRoot() {
  const node = document.getElementById('zhcArrivalRoot');
  return node && typeof node === 'object' ? node : null;
}

function setArrivalOverlayState(state) {
  const node = getArrivalRoot();
  if (!node) return;
  const next = String(state || 'ready').trim() || 'ready';
  node.dataset.zhcOverlayState = next;
}

function setArrivalBlocker(blockerKey) {
  const node = getArrivalRoot();
  if (!node) return;
  const next = String(blockerKey || '').trim();
  if (!next) {
    node.removeAttribute('data-zhc-blocker-key');
    return;
  }
  node.setAttribute('data-zhc-blocker-key', next);
}

function setArrivalNextUnlock(nextUnlock) {
  const node = getArrivalRoot();
  if (!node) return;
  const next = String(nextUnlock || '').trim();
  if (!next) {
    node.removeAttribute('data-zhc-next-unlock');
    return;
  }
  node.setAttribute('data-zhc-next-unlock', next);
}

function createStartError(code, detail = '') {
  const resolvedCode = String(code || 'START_ERROR').trim() || 'START_ERROR';
  const resolvedDetail = String(detail || '').trim();
  const err = new Error(resolvedDetail || resolvedCode);
  err.code = resolvedCode;
  if (resolvedDetail) err.detail = resolvedDetail;
  return err;
}

function getStartErrorCode(err) {
  const code = err && typeof err.code === 'string' ? err.code.trim() : '';
  if (code) return code;
  const message = err && typeof err.message === 'string' ? err.message.trim() : '';
  if (/^PRIVY_[A-Z0-9_]+$/.test(message)) return message;
  return '';
}

function explainPrivyError(err) {
  const code = getStartErrorCode(err);
  const status = Number(err && (err.status || err.statusCode || err?.cause?.status || 0)) || 0;
  const detail = String(
    (err && (err.detail || err.message || err?.cause?.message || err?.cause?.detail || '')) || ''
  ).toLowerCase();

  if (code === 'PRIVY_LOGIN_CANCELLED') return 'Login cancelled.';
  if (code === 'PRIVY_WALLET_CREATE_FAILED') return 'Could not create/connect the Privy wallet. Try again.';
  if (detail.includes('invalid nativeappid') || detail.includes('invalid_native_app_id')) {
    return 'Privy rejected your app/client ID. Verify PRIVY_APP_ID and remove PRIVY_CLIENT_ID unless it is a web app client.';
  }
  if ((code === 'PRIVY_EMAIL_SEND_FAILED' || code === 'PRIVY_EMAIL_CODE_FAILED') && status === 403) {
    return 'Privy rejected this request (403). Check App ID/Client ID, allowed domain, and enabled email auth.';
  }
  if (code === 'PRIVY_LOGIN_TIMEOUT') return 'Privy login took too long. Try again.';
  if (code === 'PRIVY_SESSION_CHECK_TIMEOUT') return 'Privy session check took too long. Reload and try again.';
  if (code === 'PRIVY_BRIDGE_INIT_FAILED' || code === 'PRIVY_BRIDGE_MISSING') {
    return 'Privy SDK failed to initialize. Disable blockers, allow third-party cookies for auth.privy.io, and reload.';
  }
  if (code === 'PRIVY_EMAIL_SEND_FAILED') return 'Could not send the Privy code email. Check your Privy email auth setup.';
  if (code === 'PRIVY_EMAIL_CODE_FAILED') return 'Could not verify the code. Please try again.';
  if (code === 'PRIVY_GUEST_LOGIN_FAILED') return 'Privy guest login failed. Check app configuration.';
  if (status === 403) return 'Privy request denied (403). Check credentials and origin/domain allowlist.';
  return 'Could not complete Privy login.';
}

async function fetchPrivyConfig() {
  const res = await fetch('/api/privy/config', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store'
  });
  if (!res.ok) return null;
  return res.json();
}

async function getCachedPrivyConfig() {
  if (cachedPrivyConfig) return cachedPrivyConfig;
  cachedPrivyConfig = await fetchPrivyConfig();
  return cachedPrivyConfig;
}

function createLoginUi() {
  const box = document.getElementById('privyAuthBox');
  const help = document.getElementById('privyAuthHelp');
  const emailForm = document.getElementById('privyEmailForm');
  const emailInput = document.getElementById('privyEmailInput');
  const codeForm = document.getElementById('privyCodeForm');
  const codeInput = document.getElementById('privyCodeInput');
  const cancelBtn = document.getElementById('privyAuthCancelBtn');

  if (!box || !help || !emailForm || !emailInput || !codeForm || !codeInput || !cancelBtn) {
    return null;
  }

  if (emailForm.dataset.preventNativeSubmit !== '1') {
    const preventNativeSubmit = (evt) => evt.preventDefault();
    emailForm.addEventListener('submit', preventNativeSubmit);
    codeForm.addEventListener('submit', preventNativeSubmit);
    emailForm.dataset.preventNativeSubmit = '1';
  }

  const pendingRejecters = new Set();
  let emailPromise = null;
  let codePromise = null;

  function showEmailStep(message) {
    box.classList.remove('is-hidden');
    emailForm.classList.remove('is-hidden');
    codeForm.classList.add('is-hidden');
    help.textContent = message || 'Enter your email to receive a one-time code.';
    setTimeout(() => {
      emailInput.focus();
    }, 0);
  }

  function showCodeStep(email, message) {
    box.classList.remove('is-hidden');
    emailForm.classList.add('is-hidden');
    codeForm.classList.remove('is-hidden');
    help.textContent = message || `Enter the code sent to ${email}.`;
    setTimeout(() => {
      codeInput.focus();
    }, 0);
  }

  function hide() {
    box.classList.add('is-hidden');
    help.textContent = 'Enter your email to receive a one-time code.';
    emailForm.classList.remove('is-hidden');
    codeForm.classList.add('is-hidden');
    codeInput.value = '';
  }

  function cancelPending(reason = 'PRIVY_LOGIN_CANCELLED') {
    const err = createStartError(reason);
    for (const rejecter of [...pendingRejecters]) {
      rejecter(err);
    }
    pendingRejecters.clear();
  }

  function waitForFormSubmit(form, input, { onShow, onResolve }) {
    return new Promise((resolve, reject) => {
      let settled = false;

      const finishResolve = (value) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      };

      const finishReject = (err) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err);
      };

      const rejecter = (err) => {
        finishReject(err instanceof Error ? err : createStartError('PRIVY_LOGIN_CANCELLED'));
      };

      const onCancel = () => {
        rejecter(createStartError('PRIVY_LOGIN_CANCELLED'));
      };

      const onSubmit = (evt) => {
        evt.preventDefault();
        const value = String(input.value || '').trim();
        if (!value) return;
        try {
          finishResolve(onResolve(value));
        } catch (err) {
          rejecter(err);
        }
      };

      const cleanup = () => {
        form.removeEventListener('submit', onSubmit);
        cancelBtn.removeEventListener('click', onCancel);
        pendingRejecters.delete(rejecter);
      };

      pendingRejecters.add(rejecter);
      cancelBtn.addEventListener('click', onCancel);
      form.addEventListener('submit', onSubmit);
      onShow();
    });
  }

  function requestEmail() {
    if (emailPromise) return emailPromise;
    emailPromise = waitForFormSubmit(emailForm, emailInput, {
      onShow: () => showEmailStep(),
      onResolve: (email) => {
        emailInput.value = email;
        return email;
      }
    });
    return emailPromise;
  }

  function requestCode(email) {
    if (codePromise) return codePromise;
    codePromise = waitForFormSubmit(codeForm, codeInput, {
      onShow: () => showCodeStep(email),
      onResolve: (code) => code
    });
    return codePromise;
  }

  return {
    primeEmailStep: () => {
      requestEmail().catch(() => { });
    },
    requestEmail: () => requestEmail(),
    requestCode: ({ email }) => requestCode(email),
    notifyCodeSent: ({ email }) => {
      codePromise = null;
      showCodeStep(email, `Code sent to ${email}. Enter it below.`);
    },
    close: () => {
      cancelPending();
      emailPromise = null;
      codePromise = null;
      hide();
    },
    resetForRetry: () => {
      cancelPending();
      emailPromise = null;
      codePromise = null;
      requestEmail().catch(() => { });
    }
  };
}

function setEntryButtonsDisabled(disabled) {
  const enterBtn = document.getElementById('enterBtn');
  if (enterBtn) enterBtn.disabled = !!disabled;
}

function getPrivyBridge() {
  const bridge = window.__PRIVY_WALLET_BRIDGE__;
  return bridge && typeof bridge === 'object' ? bridge : null;
}

function createStartTimeoutError(code) {
  return createStartError(code);
}

function withStartTimeout(promise, timeoutMs, code) {
  const ms = Number(timeoutMs);
  if (!Number.isFinite(ms) || ms <= 0) return promise;
  let timer = null;
  return Promise.race([
    Promise.resolve(promise).finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(createStartTimeoutError(code)), ms);
    }),
  ]);
}

function extractPrivyWarmupAddress(value) {
  if (!value) return null;
  const direct = typeof value === 'string' ? value.trim() : '';
  if (direct) return direct;
  if (typeof value?.address === 'string' && value.address.trim()) return value.address.trim();
  if (typeof value?.publicKey === 'string' && value.publicKey.trim()) return value.publicKey.trim();
  if (typeof value?.wallet?.address === 'string' && value.wallet.address.trim()) return value.wallet.address.trim();
  if (value?.publicKey && typeof value.publicKey.toString === 'function') {
    const out = String(value.publicKey.toString() || '').trim();
    if (out) return out;
  }
  return null;
}

async function warmPrivyWalletChain(chain, {
  silent = true,
  timeoutMs = START_PRIVY_WALLET_WARMUP_TIMEOUT_MS,
} = {}) {
  const bridge = getPrivyBridge();
  const methodName = chain === 'evm' ? 'connectEvm' : 'connectSolana';
  if (!bridge || typeof bridge[methodName] !== 'function') {
    return {
      chain,
      supported: false,
      ok: true,
      skipped: true,
      address: null,
      error: null,
    };
  }
  try {
    const result = await withStartTimeout(
      bridge[methodName]({ silent: !!silent }),
      timeoutMs,
      `PRIVY_${String(chain || '').toUpperCase()}_WARMUP_TIMEOUT`
    );
    const address = extractPrivyWarmupAddress(result);
    return {
      chain,
      supported: true,
      ok: !!address,
      skipped: false,
      address: address || null,
      error: address ? null : 'PRIVY_WALLET_NO_ADDRESS',
    };
  } catch (err) {
    return {
      chain,
      supported: true,
      ok: false,
      skipped: false,
      address: null,
      error: String(err?.code || err?.message || 'PRIVY_WALLET_WARMUP_FAILED'),
    };
  }
}

async function preparePrivyWalletEntry({
  silent = true,
  timeoutMs = START_PRIVY_WALLET_WARMUP_TIMEOUT_MS,
} = {}) {
  const [solana, evm] = await Promise.all([
    warmPrivyWalletChain('solana', { silent, timeoutMs }),
    warmPrivyWalletChain('evm', { silent, timeoutMs }),
  ]);
  const supported = [solana, evm].filter((entry) => entry.supported);
  return {
    ready: supported.every((entry) => entry.ok),
    supportedCount: supported.length,
    successCount: supported.filter((entry) => entry.ok).length,
    results: { solana, evm },
  };
}

function appPathFromConfig(cfg) {
  return cfg && typeof cfg.appPath === 'string' && cfg.appPath ? cfg.appPath : '/app';
}

async function maybeAutoSkipStart() {
  const pathname = window.location.pathname;
  if (pathname !== '/' && pathname !== '/start') return;
  if (autoRedirecting) return;

  const cfg = await getCachedPrivyConfig();
  const appPath = appPathFromConfig(cfg);

  if (!cfg || cfg.enabled !== true) {
    if (pathname === '/') {
      setArrivalOverlayState('success_feedback');
      autoRedirecting = true;
      window.location.replace(appPath);
    }
    return;
  }

  if (typeof window.ensurePrivyLogin !== 'function') return;

  try {
    const alreadySignedIn = await withStartTimeout(
      window.ensurePrivyLogin({ interactive: false, requireSession: true }),
      START_PRIVY_SESSION_CHECK_TIMEOUT_MS,
      'PRIVY_SESSION_CHECK_TIMEOUT'
    );
    if (!alreadySignedIn) return;
    setArrivalOverlayState('loading');
    await preparePrivyWalletEntry({ silent: true });
    setArrivalOverlayState('success_feedback');
    autoRedirecting = true;
    window.location.replace(appPath);
  } catch {
    setArrivalOverlayState('ready');
    // no-op; allow manual entry
  }
}

async function handleEnter() {
  setEntryButtonsDisabled(true);
  setArrivalOverlayState('loading');
  setArrivalBlocker(null);
  setArrivalNextUnlock('first_worker');

  const loginUi = createLoginUi();
  try {
    const cfg = await getCachedPrivyConfig();
    const appPath = appPathFromConfig(cfg);

    if (!cfg || cfg.enabled !== true) {
      setArrivalOverlayState('success_feedback');
      window.location.assign(appPath);
      return;
    }

    const hasEnsurePrivy = typeof window.ensurePrivyLogin === 'function';
    if (!hasEnsurePrivy) {
      throw createStartError('PRIVY_BRIDGE_INIT_FAILED');
    }

    setStatus('Connecting to Privy...');
    let alreadySignedIn = false;
    try {
      alreadySignedIn = !!(await withStartTimeout(
        window.ensurePrivyLogin({ interactive: false }),
        START_PRIVY_SESSION_CHECK_TIMEOUT_MS,
        'PRIVY_SESSION_CHECK_TIMEOUT'
      ));
    } catch (err) {
      // Silent check should never block interactive login.
      console.warn('silent privy login check failed; falling back to interactive login', err);
      alreadySignedIn = false;
    }
    if (alreadySignedIn) {
      setStatus('Finalizing Privy wallets...');
      await preparePrivyWalletEntry({ silent: true });
      if (loginUi && typeof loginUi.close === 'function') loginUi.close();
      setArrivalOverlayState('success_feedback');
      setStatus('Success. Entering Agent Town...');
      window.location.assign(appPath);
      return;
    }

    if (loginUi && typeof loginUi.primeEmailStep === 'function') {
      loginUi.primeEmailStep();
    }

    let transientFailures = 0;
    while (true) {
      try {
        setArrivalOverlayState('loading');
        setStatus('Connecting to Privy...');
        const ok = await window.ensurePrivyLogin({ interactive: true, loginUi });
        if (!ok) {
          throw createStartError('PRIVY_LOGIN_FAILED');
        }

        setStatus('Finalizing Privy wallets...');
        const warmup = await preparePrivyWalletEntry({ silent: false });

        if (loginUi && typeof loginUi.close === 'function') loginUi.close();
        setArrivalOverlayState('success_feedback');
        setStatus(
          warmup.ready || warmup.supportedCount === 0
            ? 'Success. Entering Agent Town...'
            : 'Privy login succeeded. Finishing wallet setup in Agent Town...'
        );
        window.location.assign(appPath);
        return;
      } catch (err) {
        console.error('Privy login failed', err);
        const errCode = getStartErrorCode(err);
        if (errCode === 'PRIVY_LOGIN_CANCELLED') {
          if (loginUi && typeof loginUi.close === 'function') loginUi.close();
          setArrivalOverlayState('recoverable_error');
          setArrivalBlocker('needs_auth');
          setStatus(explainPrivyError(err), true);
          break;
        }

        setArrivalOverlayState('recoverable_error');
        setArrivalBlocker('needs_auth');
        setStatus(explainPrivyError(err), true);
        if (loginUi && typeof loginUi.resetForRetry === 'function') {
          loginUi.resetForRetry();
        }

        const retryable = errCode === 'PRIVY_EMAIL_SEND_FAILED'
          || errCode === 'PRIVY_EMAIL_CODE_FAILED'
          || errCode === 'PRIVY_LOGIN_FAILED';
        if (!retryable) break;
        transientFailures += 1;
        if (transientFailures >= 3) break;
      }
    }
  } catch (err) {
    console.error('Privy login failed', err);
    setArrivalOverlayState('fatal_error');
    setArrivalBlocker('needs_auth');
    setStatus(explainPrivyError(err), true);
  } finally {
    if (!autoRedirecting) {
      const overlay = getArrivalRoot()?.dataset?.zhcOverlayState || '';
      if (overlay === 'loading') setArrivalOverlayState('ready');
    }
    setEntryButtonsDisabled(false);
  }
}

function maybeCanonicalizePrivyLoopbackHost() {
  const host = String(window.location.hostname || '').trim().toLowerCase();
  if (host !== '127.0.0.1' && host !== '::1' && host !== '[::1]') return false;
  const port = window.location.port ? `:${window.location.port}` : '';
  const next = `http://localhost${port}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(next);
  return true;
}

function boot() {
  if (maybeCanonicalizePrivyLoopbackHost()) return;

  setArrivalOverlayState('ready');
  setArrivalBlocker(null);
  setArrivalNextUnlock('first_worker');
  maybeAutoSkipStart().catch(() => { });

  const enterBtn = document.getElementById('enterBtn');
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      handleEnter();
    });
  }
}

boot();
