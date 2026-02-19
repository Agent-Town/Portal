function setStatus(msg, isError = false) {
  const statusNode = document.getElementById('startStatus');
  if (!statusNode) return;
  statusNode.textContent = msg || '';
  statusNode.style.color = isError ? 'var(--bad-strong)' : 'var(--muted)';
}

let cachedPrivyConfig = null;
let autoRedirecting = false;
const walletClient = window.initWalletClient ? window.initWalletClient() : null;

function explainPrivyError(err) {
  const code = err && typeof err.code === 'string' ? err.code : '';
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
    const err = new Error(reason);
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
        finishReject(err instanceof Error ? err : new Error('PRIVY_LOGIN_CANCELLED'));
      };

      const onCancel = () => {
        rejecter(new Error('PRIVY_LOGIN_CANCELLED'));
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
      requestEmail().catch(() => {});
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
      requestEmail().catch(() => {});
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

function privyBridgeSupportsSolanaConnect() {
  const bridge = getPrivyBridge();
  return !!(bridge && typeof bridge.connectSolana === 'function');
}

async function ensurePrivyWallet({ silent = true } = {}) {
  if (walletClient && typeof walletClient.connect === 'function') {
    try {
      const connected = await walletClient.connect({ chain: 'solana', silent: !!silent });
      const addr = connected?.address || walletClient.getAddress({ chain: 'solana' }) || null;
      if (addr) return true;
    } catch {
      // Fall through to direct Privy bridge connect.
    }
  }

  const bridge = getPrivyBridge();
  if (!bridge || typeof bridge.connectSolana !== 'function') return false;
  try {
    const connected = await bridge.connectSolana({ silent: !!silent });
    const addr = connected?.address || null;
    return !!addr;
  } catch {
    return false;
  }
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
      autoRedirecting = true;
      window.location.replace(appPath);
    }
    return;
  }

  if (typeof window.ensurePrivyLogin !== 'function') return;

  try {
    const alreadySignedIn = await window.ensurePrivyLogin({ interactive: false });
    if (!alreadySignedIn) return;
    autoRedirecting = true;
    window.location.replace(appPath);
  } catch {
    // no-op; allow manual entry
  }
}

async function handleEnter() {
  setEntryButtonsDisabled(true);

  const loginUi = createLoginUi();
  try {
    const cfg = await getCachedPrivyConfig();
    const appPath = appPathFromConfig(cfg);

    if (!cfg || cfg.enabled !== true) {
      window.location.assign(appPath);
      return;
    }

    const hasEnsurePrivy = typeof window.ensurePrivyLogin === 'function';
    if (!hasEnsurePrivy) {
      const out = new Error('PRIVY_BRIDGE_INIT_FAILED');
      out.code = 'PRIVY_BRIDGE_INIT_FAILED';
      throw out;
    }

    setStatus('Connecting to Privy...');
    let alreadySignedIn = false;
    try {
      alreadySignedIn = !!(await window.ensurePrivyLogin({ interactive: false }));
    } catch (err) {
      // Silent check should never block interactive login.
      console.warn('silent privy login check failed; falling back to interactive login', err);
      alreadySignedIn = false;
    }
    if (alreadySignedIn) {
      if (privyBridgeSupportsSolanaConnect()) {
        ensurePrivyWallet({ silent: true }).catch(() => false);
      }
      if (loginUi && typeof loginUi.close === 'function') loginUi.close();
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
        setStatus('Connecting to Privy...');
        const ok = await window.ensurePrivyLogin({ interactive: true, loginUi });
        if (!ok) {
          const out = new Error('PRIVY_LOGIN_FAILED');
          out.code = 'PRIVY_LOGIN_FAILED';
          throw out;
        }

        // Wallet provisioning can lag/fail transiently; do not block app entry on /start.
        if (privyBridgeSupportsSolanaConnect()) {
          ensurePrivyWallet({ silent: true }).catch(() => false);
        }

        if (loginUi && typeof loginUi.close === 'function') loginUi.close();
        setStatus('Success. Entering Agent Town...');
        window.location.assign(appPath);
        return;
      } catch (err) {
        console.error('Privy login failed', err);
        const errCode = (err && typeof err.code === 'string' && err.code)
          || (err && typeof err.message === 'string' && err.message)
          || '';
        if (errCode === 'PRIVY_LOGIN_CANCELLED') {
          if (loginUi && typeof loginUi.close === 'function') loginUi.close();
          setStatus(explainPrivyError(err), true);
          break;
        }

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
    setStatus(explainPrivyError(err), true);
  } finally {
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
  maybeAutoSkipStart().catch(() => {});

  const enterBtn = document.getElementById('enterBtn');
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      handleEnter();
    });
  }
}

boot();
