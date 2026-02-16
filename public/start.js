function setStatus(msg, isError = false) {
  const el = document.getElementById('startStatus');
  if (!el) return;
  el.textContent = msg || '';
  el.style.color = isError ? 'var(--bad-strong)' : 'var(--muted)';
}

let cachedPrivyConfig = null;

function explainPrivyError(err) {
  const code = err && typeof err.code === 'string' ? err.code : '';
  const status = Number(err && (err.status || err.statusCode || err?.cause?.status || 0)) || 0;
  const detail = String(
    (err && (err.detail || err.message || err?.cause?.message || err?.cause?.detail || '')) || ''
  ).toLowerCase();

  if (code === 'PRIVY_LOGIN_CANCELLED') return 'Login cancelled.';
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

async function maybeAutoSkipStart() {
  // Skip the start screen only for the default entry path
  // when Privy is already logged in.
  if (window.location.pathname !== '/') return;

  const cfg = await getCachedPrivyConfig();
  const appPath = cfg && typeof cfg.appPath === 'string' && cfg.appPath ? cfg.appPath : '/app';

  if (!cfg || cfg.enabled !== true) {
    window.location.replace(appPath);
    return;
  }

  if (typeof window.ensurePrivyLogin !== 'function') return;

  try {
    const alreadySignedIn = await window.ensurePrivyLogin({ interactive: false });
    if (alreadySignedIn) {
      window.location.replace(appPath);
    }
  } catch {
    // no-op; let user continue manually
  }
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

async function handleEnter() {
  setEntryButtonsDisabled(true);

  const loginUi = createLoginUi();
  try {
    const cfg = await getCachedPrivyConfig();
    const appPath = cfg && typeof cfg.appPath === 'string' && cfg.appPath ? cfg.appPath : '/app';

    if (!cfg || cfg.enabled !== true) {
      window.location.assign(appPath);
      return;
    }

    let ok = false;
    setStatus('Connecting to Privy...');
    ok = typeof window.ensurePrivyLogin === 'function'
      ? await window.ensurePrivyLogin({ interactive: true, loginUi })
      : false;

    if (!ok) throw new Error('PRIVY_LOGIN_FAILED');

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

function boot() {
  maybeAutoSkipStart().catch(() => {});

  const enterBtn = document.getElementById('enterBtn');
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      handleEnter();
    });
  }
}

boot();
