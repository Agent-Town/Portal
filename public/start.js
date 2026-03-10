const ExperienceProfiles = window.AgentTownExperienceProfiles || null;
const ExperienceRuntime = window.AgentTownExperienceRuntime || null;
const I18n = window.AgentTownI18n || null;

let cachedPrivyConfig = null;
let autoRedirecting = false;
let currentExperiencePreference = null;
let currentBootstrap = null;
const walletClient = window.initWalletClient ? window.initWalletClient() : null;

function tStart(key, vars = {}) {
  const locale = currentExperiencePreference?.locale || 'en';
  if (!I18n || typeof I18n.t !== 'function') return key;
  return I18n.t(key, vars, locale);
}

function setStatus(msg, isError = false) {
  const statusNode = document.getElementById('startStatus');
  if (!statusNode) return;
  statusNode.textContent = msg || '';
  statusNode.style.color = isError ? 'var(--bad-strong)' : 'var(--muted)';
}

function hasExplicitExperiencePreference() {
  return currentExperiencePreference?.source === 'user';
}

function setEntryButtonsDisabled(disabled) {
  const enterBtn = document.getElementById('enterBtn');
  if (!enterBtn) return;
  enterBtn.disabled = !!disabled || !hasExplicitExperiencePreference();
}

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

function updateHeroMedia() {
  const frame = document.getElementById('startVideoFrame');
  const poster = document.getElementById('startHeroPoster');
  if (!frame || !poster) return;
  const mainlandSafe = currentExperiencePreference?.mediaPolicy === 'mainland-safe';
  const fallbackSrc = 'https://www.youtube.com/embed/ZW7tUUZqhdY?rel=0';
  if (mainlandSafe) {
    if (!frame.dataset.src && frame.getAttribute('src')) {
      frame.dataset.src = frame.getAttribute('src');
    }
    frame.classList.add('is-hidden');
    frame.setAttribute('hidden', 'hidden');
    frame.removeAttribute('src');
    poster.classList.remove('is-hidden');
  } else {
    poster.classList.add('is-hidden');
    frame.classList.remove('is-hidden');
    frame.removeAttribute('hidden');
    if (!frame.getAttribute('src')) {
      frame.setAttribute('src', frame.dataset.src || fallbackSrc);
    }
  }
}

function updatePreferenceSelectionUi() {
  const globalBtn = document.getElementById('startPresetGlobalBtn');
  const cnBtn = document.getElementById('startPresetCnBtn');
  const currentNode = document.getElementById('startPreferenceCurrent');
  const currentPresetId = String(currentExperiencePreference?.presetId || '').trim();
  if (globalBtn) globalBtn.classList.toggle('is-selected', currentPresetId === 'global-default');
  if (cnBtn) cnBtn.classList.toggle('is-selected', currentPresetId === 'cn-mainland');
  if (currentNode) {
    if (hasExplicitExperiencePreference() && ExperienceProfiles) {
      const preset = ExperienceProfiles.getPreset(currentPresetId);
      currentNode.textContent = tStart('start.pref.current', { label: preset.label });
    } else {
      currentNode.textContent = '';
    }
  }
  setEntryButtonsDisabled(false);
}

function applyStartCopy() {
  const authTitle = document.querySelector('.startAuthTitle');
  const authHelp = document.getElementById('privyAuthHelp');
  const emailLabel = document.querySelector('label[for="privyEmailInput"]');
  const emailInput = document.getElementById('privyEmailInput');
  const sendBtn = document.querySelector('#privyEmailForm button[type="submit"]');
  const codeLabel = document.querySelector('label[for="privyCodeInput"]');
  const codeInput = document.getElementById('privyCodeInput');
  const verifyBtn = document.querySelector('#privyCodeForm button[type="submit"]');
  const cancelBtn = document.getElementById('privyAuthCancelBtn');
  const prefTitle = document.getElementById('startPreferenceTitle');
  const prefHelp = document.getElementById('startPreferenceHelp');
  const globalLabel = document.getElementById('startPresetGlobalLabel');
  const globalHelp = document.getElementById('startPresetGlobalHelp');
  const cnLabel = document.getElementById('startPresetCnLabel');
  const cnHelp = document.getElementById('startPresetCnHelp');
  const title = document.querySelector('.startTitle');
  const enterBtn = document.getElementById('enterBtn');
  const warning = document.querySelector('.startWarning');
  const heroPoster = document.getElementById('startHeroPoster');
  const heroFrame = document.getElementById('startVideoFrame');

  if (authTitle) authTitle.textContent = tStart('start.auth.title');
  if (authHelp && !authHelp.dataset.dynamic) authHelp.textContent = tStart('start.auth.help.email');
  if (emailLabel) emailLabel.textContent = tStart('start.auth.email');
  if (emailInput) emailInput.placeholder = 'you@example.com';
  if (sendBtn) sendBtn.textContent = tStart('start.auth.send');
  if (codeLabel) codeLabel.textContent = tStart('start.auth.code');
  if (codeInput) codeInput.placeholder = '123456';
  if (verifyBtn) verifyBtn.textContent = tStart('start.auth.verify');
  if (cancelBtn) cancelBtn.textContent = tStart('start.auth.cancel');
  if (prefTitle) prefTitle.textContent = tStart('start.pref.title');
  if (prefHelp) prefHelp.textContent = tStart('start.pref.help');
  if (globalLabel) globalLabel.textContent = tStart('start.pref.global.label');
  if (globalHelp) globalHelp.textContent = tStart('start.pref.global.help');
  if (cnLabel) cnLabel.textContent = tStart('start.pref.cn.label');
  if (cnHelp) cnHelp.textContent = tStart('start.pref.cn.help');
  if (title) title.textContent = tStart('start.title');
  if (enterBtn) enterBtn.textContent = tStart('start.enter');
  if (warning) warning.textContent = tStart('start.warning');
  if (heroPoster) heroPoster.alt = tStart('start.hero.alt');
  if (heroFrame) heroFrame.title = tStart('start.hero.alt');

  updateHeroMedia();
  updatePreferenceSelectionUi();
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

async function bootstrapExperiencePreference() {
  if (!ExperienceRuntime || typeof ExperienceRuntime.bootstrap !== 'function') return null;
  const bootstrap = await ExperienceRuntime.bootstrap();
  const preserveExplicitChoice = currentExperiencePreference?.source === 'user';
  currentBootstrap = bootstrap;
  if (preserveExplicitChoice) {
    currentBootstrap = {
      ...bootstrap,
      current: currentExperiencePreference,
      hasLocalChoice: true,
      hasSessionChoice: true,
      hasExplicitChoice: true
    };
    currentExperiencePreference = ExperienceRuntime.applyDocumentPreference(currentExperiencePreference);
  } else {
    currentExperiencePreference = ExperienceRuntime.applyDocumentPreference(currentBootstrap.current);
  }
  applyStartCopy();
  return currentBootstrap;
}

async function selectExperiencePreset(presetId) {
  if (!ExperienceRuntime || typeof ExperienceRuntime.setPreference !== 'function') return;
  currentExperiencePreference = await ExperienceRuntime.setPreference(presetId);
  currentExperiencePreference = ExperienceRuntime.applyDocumentPreference(currentExperiencePreference);
  currentBootstrap = {
    ...(currentBootstrap || {}),
    current: currentExperiencePreference,
    hasLocalChoice: true,
    hasSessionChoice: true,
    hasExplicitChoice: true
  };
  applyStartCopy();
  setStatus('');
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
    help.dataset.dynamic = '1';
    help.textContent = message || tStart('start.auth.help.email');
    setTimeout(() => {
      emailInput.focus();
    }, 0);
  }

  function showCodeStep(email, message) {
    box.classList.remove('is-hidden');
    emailForm.classList.add('is-hidden');
    codeForm.classList.remove('is-hidden');
    help.dataset.dynamic = '1';
    help.textContent = message || tStart('start.auth.help.code', { email });
    setTimeout(() => {
      codeInput.focus();
    }, 0);
  }

  function hide() {
    box.classList.add('is-hidden');
    help.dataset.dynamic = '';
    help.textContent = tStart('start.auth.help.email');
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
      requestEmail().catch(() => { });
    },
    requestEmail: () => requestEmail(),
    requestCode: ({ email }) => requestCode(email),
    notifyCodeSent: ({ email }) => {
      codePromise = null;
      showCodeStep(email, tStart('start.auth.help.sent', { email }));
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

  const bootstrap = currentBootstrap || await bootstrapExperiencePreference();
  if (!bootstrap?.hasExplicitChoice) return;

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

    const res = await fetch('/api/onboarding/status', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (res.ok) {
      const { step } = await res.json();
      if (step > 1) {
        autoRedirecting = true;
        window.location.replace(appPath);
      }
    }
  } catch {
    // no-op; allow manual entry
  }
}

async function handleEnter() {
  if (!hasExplicitExperiencePreference()) {
    setStatus(tStart('start.status.select_preset'), true);
    setEntryButtonsDisabled(false);
    return;
  }

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

    setStatus(tStart('start.status.connecting_privy'));
    let alreadySignedIn = false;
    try {
      alreadySignedIn = !!(await window.ensurePrivyLogin({ interactive: false }));
    } catch (err) {
      console.warn('silent privy login check failed; falling back to interactive login', err);
      alreadySignedIn = false;
    }
    if (alreadySignedIn) {
      if (privyBridgeSupportsSolanaConnect()) {
        ensurePrivyWallet({ silent: true }).catch(() => false);
      }
      if (loginUi && typeof loginUi.close === 'function') loginUi.close();
      setStatus(tStart('start.status.entering'));
      window.location.assign(appPath);
      return;
    }

    if (loginUi && typeof loginUi.primeEmailStep === 'function') {
      loginUi.primeEmailStep();
    }

    let transientFailures = 0;
    while (true) {
      try {
        setStatus(tStart('start.status.connecting_privy'));
        const ok = await window.ensurePrivyLogin({ interactive: true, loginUi });
        if (!ok) {
          const out = new Error('PRIVY_LOGIN_FAILED');
          out.code = 'PRIVY_LOGIN_FAILED';
          throw out;
        }

        if (privyBridgeSupportsSolanaConnect()) {
          ensurePrivyWallet({ silent: true }).catch(() => false);
        }

        if (loginUi && typeof loginUi.close === 'function') loginUi.close();
        setStatus(tStart('start.status.entering'));
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

function bindPreferenceButtons() {
  const buttons = Array.from(document.querySelectorAll('[data-preset-id]'));
  for (const button of buttons) {
    if (button.dataset.bound === '1') continue;
    button.dataset.bound = '1';
    button.addEventListener('click', async () => {
      const presetId = String(button.getAttribute('data-preset-id') || '').trim();
      if (!presetId) return;
      try {
        await selectExperiencePreset(presetId);
      } catch (err) {
        setStatus(String(err?.message || 'Could not save path selection.'), true);
      }
    });
  }
}

async function boot() {
  if (maybeCanonicalizePrivyLoopbackHost()) return;

  bindPreferenceButtons();
  await bootstrapExperiencePreference().catch(() => null);
  await maybeAutoSkipStart().catch(() => { });

  const enterBtn = document.getElementById('enterBtn');
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      handleEnter();
    });
  }
}

boot();
