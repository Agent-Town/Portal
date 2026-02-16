function setStatus(msg, isError = false) {
  const statusNode = document.getElementById('startStatus');
  if (!statusNode) return;
  statusNode.textContent = msg || '';
  statusNode.style.color = isError ? 'var(--bad-strong)' : 'var(--muted)';
}

function setTeamCode(value) {
  const node = document.getElementById('startTeamCode');
  if (!node) return;
  node.textContent = value || '…';
}

function setStateHint(value) {
  const node = document.getElementById('startStateHint');
  if (!node) return;
  node.textContent = value || '';
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

async function fetchStartSessionContext() {
  const [sessionResp, stateResp] = await Promise.all([
    fetch('/api/session', { method: 'GET', credentials: 'include', cache: 'no-store' }).catch(() => null),
    fetch('/api/state', { method: 'GET', credentials: 'include', cache: 'no-store' }).catch(() => null)
  ]);

  let teamCode = null;
  let houseId = null;
  let signupComplete = false;

  if (sessionResp && sessionResp.ok) {
    const payload = await sessionResp.json().catch(() => ({}));
    teamCode = payload?.teamCode || null;
  }
  if (stateResp && stateResp.ok) {
    const payload = await stateResp.json().catch(() => ({}));
    houseId = payload?.houseId || null;
    signupComplete = !!payload?.signup?.complete;
  }

  return { teamCode, houseId, signupComplete };
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

  function waitForFormSubmit(form, input, { onShow, onResolve }) {
    return new Promise((resolve, reject) => {
      const onCancel = () => {
        cleanup();
        reject(new Error('PRIVY_LOGIN_CANCELLED'));
      };

      const onSubmit = (evt) => {
        evt.preventDefault();
        const value = String(input.value || '').trim();
        if (!value) return;
        cleanup();
        resolve(onResolve(value));
      };

      const cleanup = () => {
        form.removeEventListener('submit', onSubmit);
        cancelBtn.removeEventListener('click', onCancel);
      };

      cancelBtn.addEventListener('click', onCancel);
      form.addEventListener('submit', onSubmit);
      onShow();
    });
  }

  return {
    requestEmail: () =>
      waitForFormSubmit(emailForm, emailInput, {
        onShow: () => showEmailStep(),
        onResolve: (email) => {
          emailInput.value = email;
          return email;
        }
      }),
    requestCode: ({ email }) =>
      waitForFormSubmit(codeForm, codeInput, {
        onShow: () => showCodeStep(email),
        onResolve: (code) => code
      }),
    notifyCodeSent: ({ email }) => {
      showCodeStep(email, `Code sent to ${email}. Enter it below.`);
    },
    close: () => {
      hide();
    }
  };
}

function setEntryButtonsDisabled(disabled) {
  const enterBtn = document.getElementById('enterBtn');
  if (enterBtn) enterBtn.disabled = !!disabled;
}

function privyBridgeSupportsSolanaConnect() {
  const bridge = window.__PRIVY_WALLET_BRIDGE__;
  return !!(bridge && typeof bridge.connectSolana === 'function');
}

async function ensurePrivyWallet({ silent = true } = {}) {
  if (!walletClient) return false;
  if (!privyBridgeSupportsSolanaConnect()) return false;
  try {
    const connected = await walletClient.connect({ chain: 'solana', silent: !!silent });
    const addr = connected?.address || walletClient.getAddress({ chain: 'solana' }) || null;
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
    const walletReady = await ensurePrivyWallet({ silent: true });
    if (!walletReady) return;
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

    setStatus('Connecting to Privy...');
    const ok = typeof window.ensurePrivyLogin === 'function'
      ? await window.ensurePrivyLogin({ interactive: true, loginUi })
      : false;

    if (!ok) throw new Error('PRIVY_LOGIN_FAILED');

    if (privyBridgeSupportsSolanaConnect()) {
      setStatus('Preparing wallet...');
      const walletReady = await ensurePrivyWallet({ silent: false });
      if (!walletReady) throw new Error('PRIVY_WALLET_CREATE_FAILED');
    }

    if (loginUi && typeof loginUi.close === 'function') loginUi.close();
    setStatus('Success. Entering Agent Town...');
    window.location.assign(appPath);
  } catch (err) {
    console.error('Privy login failed', err);
    if (loginUi && typeof loginUi.close === 'function') loginUi.close();
    setStatus(explainPrivyError(err), true);
    setEntryButtonsDisabled(false);
  }
}

async function hydrateStartSessionContext() {
  try {
    const context = await fetchStartSessionContext();
    setTeamCode(context.teamCode || '…');

    if (context.houseId) {
      setStateHint(`Returning house detected: ${context.houseId}`);
      return;
    }
    if (context.signupComplete) {
      setStateHint('Session already completed onboarding. Enter town to continue.');
      return;
    }
    setStateHint('Use this session to continue your co-op unlock flow.');
  } catch {
    setTeamCode('…');
    setStateHint('Session state unavailable. You can still enter town.');
  }
}

function boot() {
  hydrateStartSessionContext().catch(() => {});
  maybeAutoSkipStart().catch(() => {});

  const enterBtn = document.getElementById('enterBtn');
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      handleEnter();
    });
  }
}

boot();
