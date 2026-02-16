/* eslint-disable no-console */

(function initPrivyBridgeBootstrap() {
  const DEFAULT_PRIVY_SDK_MODULE_URL = 'https://esm.sh/@privy-io/js-sdk-core@0.60.0?bundle';

  let cachedConfig = null;
  let configPromise = null;
  let scriptLoadPromise = null;
  let bridgeInstallPromise = null;
  let sdkModulePromise = null;
  let defaultBridgePromise = null;

  function parseBool(value, fallback = false) {
    if (value === undefined || value === null || String(value).trim() === '') return !!fallback;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') return true;
    if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') return false;
    return !!fallback;
  }

  function hasBridge() {
    return !!window.__PRIVY_WALLET_BRIDGE__;
  }

  function getFactory() {
    if (typeof window.__PRIVY_BRIDGE_FACTORY__ === 'function') return window.__PRIVY_BRIDGE_FACTORY__;
    if (typeof window.createPrivyWalletBridge === 'function') return window.createPrivyWalletBridge;
    return null;
  }

  function bytesToBase64(bytes) {
    if (!(bytes instanceof Uint8Array)) return '';
    let out = '';
    for (const b of bytes) out += String.fromCharCode(b);
    return btoa(out);
  }

  function bytesToBase58(bytes) {
    if (!(bytes instanceof Uint8Array) || bytes.length === 0) return '';
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = 0n;
    for (const b of bytes) num = (num << 8n) + BigInt(b);

    let out = '';
    while (num > 0n) {
      const idx = Number(num % 58n);
      out = alphabet[idx] + out;
      num /= 58n;
    }

    let leadingZeros = 0;
    for (let i = 0; i < bytes.length && bytes[i] === 0; i += 1) leadingZeros += 1;
    if (leadingZeros > 0) out = '1'.repeat(leadingZeros) + out;
    return out || '1';
  }

  function base64ToBytes(input) {
    if (!input || typeof input !== 'string') return null;
    try {
      const bin = atob(input);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
      return out;
    } catch {
      return null;
    }
  }

  function hexToBytes(input) {
    if (!input || typeof input !== 'string') return null;
    const normalized = input.startsWith('0x') ? input.slice(2) : input;
    if (!normalized || normalized.length % 2 !== 0 || /[^a-fA-F0-9]/.test(normalized)) return null;
    const out = new Uint8Array(normalized.length / 2);
    for (let i = 0; i < normalized.length; i += 2) {
      out[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
    }
    return out;
  }

  function normalizeBytes(value) {
    if (value instanceof Uint8Array) return value;
    if (Array.isArray(value)) return new Uint8Array(value);
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer);
    if (typeof value === 'string') {
      const b64 = base64ToBytes(value);
      if (b64) return b64;
      const hex = hexToBytes(value);
      if (hex) return hex;
    }
    return null;
  }

  function textBytes(value) {
    return new TextEncoder().encode(String(value || ''));
  }

  function normalizeAddress(value) {
    if (!value) return null;
    if (typeof value === 'string') return value.trim() || null;
    if (typeof value.address === 'string') return value.address.trim() || null;
    if (typeof value.public_key === 'string') return value.public_key.trim() || null;
    if (typeof value.publicKey === 'string') return value.publicKey.trim() || null;
    return null;
  }

  async function requestPrivyEmail(loginUi) {
    if (loginUi && typeof loginUi.requestEmail === 'function') {
      const emailFromUi = await loginUi.requestEmail();
      const trimmedUi = typeof emailFromUi === 'string' ? emailFromUi.trim() : '';
      if (!trimmedUi) throw new Error('PRIVY_LOGIN_CANCELLED');
      return trimmedUi;
    }

    const email = window.prompt('Enter your email to continue with Privy:');
    const trimmed = typeof email === 'string' ? email.trim() : '';
    if (!trimmed) throw new Error('PRIVY_LOGIN_CANCELLED');
    return trimmed;
  }

  async function requestPrivyCode(loginUi, email) {
    if (loginUi && typeof loginUi.requestCode === 'function') {
      const codeFromUi = await loginUi.requestCode({ email });
      const trimmedUi = typeof codeFromUi === 'string' ? codeFromUi.trim() : '';
      if (!trimmedUi) throw new Error('PRIVY_LOGIN_CANCELLED');
      return trimmedUi;
    }

    const code = window.prompt(`Enter the code sent to ${email}:`);
    const trimmed = typeof code === 'string' ? code.trim() : '';
    if (!trimmed) throw new Error('PRIVY_LOGIN_CANCELLED');
    return trimmed;
  }

  function buildPrivyError(code, err) {
    const status = Number(err?.status || err?.statusCode || err?.response?.status || err?.cause?.status || 0) || 0;
    const detail = err?.message ? String(err.message) : '';
    const out = new Error(code);
    out.code = code;
    if (status > 0) out.status = status;
    if (detail) out.detail = detail;
    if (err) out.cause = err;
    return out;
  }

  function errorContains(err, needle) {
    const n = String(needle || '').trim().toLowerCase();
    if (!n) return false;
    const haystack = [
      err?.message,
      err?.code,
      err?.detail,
      err?.error?.message,
      err?.error?.code,
      err?.cause?.message,
      err?.cause?.code
    ]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase())
      .join(' | ');
    return haystack.includes(n);
  }

  function isInvalidNativeAppIdError(err) {
    return errorContains(err, 'invalid nativeappid') || errorContains(err, 'invalid_native_app_id');
  }

  async function loadScriptOnce(src) {
    const url = typeof src === 'string' ? src.trim() : '';
    if (!url) return;
    if (scriptLoadPromise) return scriptLoadPromise;
    scriptLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-privy-sdk="1"][src="${url}"]`);
      if (existing) {
        if (existing.dataset.loaded === '1') {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('PRIVY_SDK_LOAD_FAILED')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.defer = true;
      script.dataset.privySdk = '1';
      script.addEventListener(
        'load',
        () => {
          script.dataset.loaded = '1';
          resolve();
        },
        { once: true }
      );
      script.addEventListener('error', () => reject(new Error('PRIVY_SDK_LOAD_FAILED')), { once: true });
      document.head.appendChild(script);
    });
    return scriptLoadPromise;
  }

  async function fetchPrivyConfig() {
    if (cachedConfig) return cachedConfig;
    if (configPromise) return configPromise;
    configPromise = fetch('/api/privy/config', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store'
    })
      .then(async (resp) => {
        if (!resp.ok) return null;
        const payload = await resp.json();
        if (!payload || payload.ok !== true || payload.enabled !== true) return null;
        const cfg = payload.config;
        if (!cfg || typeof cfg !== 'object') return null;
        cachedConfig = cfg;
        window.__PRIVY_CONFIG__ = cfg;
        window.dispatchEvent(new CustomEvent('privy:config', { detail: { config: cfg } }));
        return cfg;
      })
      .catch(() => null)
      .finally(() => {
        configPromise = null;
      });
    return configPromise;
  }

  async function loadPrivyModule(config) {
    if (window.__PRIVY_SDK_MODULE__) return window.__PRIVY_SDK_MODULE__;
    if (sdkModulePromise) return sdkModulePromise;
    const url = (config && typeof config.sdkModuleUrl === 'string' && config.sdkModuleUrl.trim())
      || DEFAULT_PRIVY_SDK_MODULE_URL;
    sdkModulePromise = import(url)
      .then((mod) => {
        window.__PRIVY_SDK_MODULE__ = mod;
        return mod;
      })
      .finally(() => {
        sdkModulePromise = null;
      });
    return sdkModulePromise;
  }

  function buildLoginOptions() {
    return {
      embedded: {
        ethereum: { createOnLogin: 'users-without-wallets' },
        solana: { createOnLogin: 'users-without-wallets' }
      }
    };
  }

  async function createDefaultPrivyBridge(config) {
    const sdk = await loadPrivyModule(config);
    const Privy = sdk.default;
    if (!Privy) throw new Error('PRIVY_SDK_MISSING_DEFAULT_EXPORT');

    let client = null;
    const storage = sdk.LocalStorage ? new sdk.LocalStorage() : null;

    async function initializeClient({ includeClientId = true } = {}) {
      const next = new Privy({
        appId: config.appId,
        ...(includeClientId && config.clientId ? { clientId: config.clientId } : {}),
        ...(storage ? { storage } : {})
      });
      await next.initialize();
      client = next;
      return next;
    }

    await initializeClient({ includeClientId: true });

    const state = {
      client,
      usingClientId: !!config.clientId,
      sdk,
      user: null,
      solanaAccount: null,
      solanaProvider: null,
      evmAccount: null,
      evmProvider: null
    };

    async function downgradeClientIdIfNeeded(err) {
      if (!state.usingClientId) return false;
      if (!isInvalidNativeAppIdError(err)) return false;
      try {
        await initializeClient({ includeClientId: false });
        state.client = client;
        state.usingClientId = false;
        state.user = null;
        state.solanaAccount = null;
        state.solanaProvider = null;
        state.evmAccount = null;
        state.evmProvider = null;
        return true;
      } catch {
        return false;
      }
    }

    function pickSolanaAccount(user) {
      if (!user) return null;
      if (typeof sdk.getUserEmbeddedSolanaWallet === 'function') {
        const one = sdk.getUserEmbeddedSolanaWallet(user);
        if (one) return one;
      }
      if (typeof sdk.getAllUserEmbeddedSolanaWallets === 'function') {
        const all = sdk.getAllUserEmbeddedSolanaWallets(user);
        if (Array.isArray(all) && all.length) return all[0];
      }
      return null;
    }

    function pickEvmAccount(user) {
      if (!user) return null;
      if (typeof sdk.getUserEmbeddedEthereumWallet === 'function') {
        const one = sdk.getUserEmbeddedEthereumWallet(user);
        if (one) return one;
      }
      if (typeof sdk.getAllUserEmbeddedEthereumWallets === 'function') {
        const all = sdk.getAllUserEmbeddedEthereumWallets(user);
        if (Array.isArray(all) && all.length) return all[0];
      }
      return null;
    }

    async function refreshUser() {
      try {
        const out = await client.user.get();
        state.user = out?.user || null;
      } catch {
        state.user = null;
      }
      return state.user;
    }

    async function loginInteractive({ preferred = 'solana', loginUi = null } = {}) {
      const method = String(config.loginMethod || 'email').trim().toLowerCase();
      if (method === 'guest') {
        try {
          const out = await client.auth.guest.create(buildLoginOptions(preferred));
          state.user = out?.user || null;
          return state.user;
        } catch (err) {
          throw buildPrivyError('PRIVY_GUEST_LOGIN_FAILED', err);
        }
      }

      const email = await requestPrivyEmail(loginUi);
      try {
        await client.auth.email.sendCode(email);
        if (loginUi && typeof loginUi.notifyCodeSent === 'function') {
          loginUi.notifyCodeSent({ email });
        }
      } catch (err) {
        const downgraded = await downgradeClientIdIfNeeded(err);
        if (downgraded) {
          try {
            await client.auth.email.sendCode(email);
            if (loginUi && typeof loginUi.notifyCodeSent === 'function') {
              loginUi.notifyCodeSent({ email });
            }
          } catch (retryErr) {
            throw buildPrivyError('PRIVY_EMAIL_SEND_FAILED', retryErr);
          }
        } else {
          throw buildPrivyError('PRIVY_EMAIL_SEND_FAILED', err);
        }
      }
      const code = await requestPrivyCode(loginUi, email);
      let out;
      try {
        out = await client.auth.email.loginWithCode(
          email,
          code,
          'login-or-sign-up',
          buildLoginOptions(preferred)
        );
      } catch (err) {
        throw buildPrivyError('PRIVY_EMAIL_CODE_FAILED', err);
      }
      state.user = out?.user || null;
      return state.user;
    }

    async function ensureLoggedIn({ interactive = true, preferred = 'solana', loginUi = null } = {}) {
      const current = state.user || (await refreshUser());
      if (current) return current;
      if (!interactive) return null;
      return loginInteractive({ preferred, loginUi });
    }

    async function ensureSolanaProvider({ interactive = true } = {}) {
      const user = await ensureLoggedIn({ interactive, preferred: 'solana' });
      if (!user) throw new Error('PRIVY_LOGIN_REQUIRED');

      let account = pickSolanaAccount(user);
      if (!account && interactive) {
        const created = await client.embeddedWallet.createSolana();
        state.user = created?.user || state.user;
        account = pickSolanaAccount(state.user);
      }
      if (!account) throw new Error('NO_SOLANA_WALLET');

      if (state.solanaProvider && state.solanaAccount?.address === account.address) {
        return { account: state.solanaAccount, provider: state.solanaProvider };
      }

      if (typeof sdk.getEntropyDetailsFromAccount !== 'function') throw new Error('PRIVY_ENTROPY_HELPER_MISSING');
      const entropy = sdk.getEntropyDetailsFromAccount(account);
      const provider = await client.embeddedWallet.getSolanaProvider(
        account,
        entropy.entropyId,
        entropy.entropyIdVerifier
      );

      state.solanaAccount = account;
      state.solanaProvider = provider;
      return { account, provider };
    }

    async function ensureEvmProvider({ interactive = true } = {}) {
      const user = await ensureLoggedIn({ interactive, preferred: 'evm' });
      if (!user) throw new Error('PRIVY_LOGIN_REQUIRED');

      let account = pickEvmAccount(user);
      if (!account && interactive) {
        const maybeSolana = pickSolanaAccount(user);
        const created = await client.embeddedWallet.create({
          ...(maybeSolana ? { solanaAccount: maybeSolana } : {})
        });
        state.user = created?.user || state.user;
        account = pickEvmAccount(state.user);
      }
      if (!account) throw new Error('NO_EVM_WALLET');

      if (state.evmProvider && state.evmAccount?.address === account.address) {
        return { account: state.evmAccount, provider: state.evmProvider };
      }

      if (typeof sdk.getEntropyDetailsFromAccount !== 'function') throw new Error('PRIVY_ENTROPY_HELPER_MISSING');
      const entropy = sdk.getEntropyDetailsFromAccount(account);
      const provider = await client.embeddedWallet.getEthereumProvider({
        wallet: account,
        entropyId: entropy.entropyId,
        entropyIdVerifier: entropy.entropyIdVerifier
      });

      state.evmAccount = account;
      state.evmProvider = provider;
      return { account, provider };
    }

    return {
      ensureLoggedIn,
      connectSolana: async ({ silent = false } = {}) => {
        const { account, provider } = await ensureSolanaProvider({ interactive: !silent });
        const address = normalizeAddress(account.public_key || account.address || null);
        if (!address) throw new Error('NO_SOLANA_PUBKEY');
        return { address, provider };
      },
      disconnectSolana: async () => {
        try {
          await client.auth.logout();
        } catch {
          // ignore logout errors; still clear local bridge state
        }
        state.user = null;
        state.solanaAccount = null;
        state.solanaProvider = null;
        state.evmAccount = null;
        state.evmProvider = null;
      },
      signSolanaMessage: async ({ message = '', bytes = null } = {}) => {
        const { provider } = await ensureSolanaProvider({ interactive: true });
        const msgBytes = normalizeBytes(bytes) || textBytes(message);
        const resp = await provider.request({
          method: 'signMessage',
          params: { message: bytesToBase64(msgBytes) }
        });
        const sig = normalizeBytes(resp?.signature || resp);
        if (!sig) throw new Error('SIGNATURE_FORMAT');
        return { signature: sig };
      },
      connectEvm: async () => {
        const { account, provider } = await ensureEvmProvider({ interactive: true });
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const address = normalizeAddress(Array.isArray(accounts) && accounts.length ? accounts[0] : account.address);
        if (!address) throw new Error('NO_EVM_ACCOUNT');
        return { address, provider };
      },
      disconnectEvm: async () => {
        try {
          await client.auth.logout();
        } catch {
          // ignore logout errors; still clear local bridge state
        }
        state.user = null;
        state.solanaAccount = null;
        state.solanaProvider = null;
        state.evmAccount = null;
        state.evmProvider = null;
      },
      signEvmMessage: async ({ message = '', address = null } = {}) => {
        const { account, provider } = await ensureEvmProvider({ interactive: true });
        const signer = normalizeAddress(address || account.address);
        if (!signer) throw new Error('NO_EVM_ACCOUNT');
        const signature = await provider.request({
          method: 'personal_sign',
          params: [String(message || ''), signer]
        });
        if (typeof signature !== 'string' || !signature) throw new Error('SIGNATURE_FORMAT');
        return { signature };
      },
      getEvmProvider: () => state.evmProvider || null,
      getEvmChainId: async () => {
        const { provider } = await ensureEvmProvider({ interactive: false });
        if (!provider) throw new Error('NO_EVM_WALLET');
        const chainHex = await provider.request({ method: 'eth_chainId' });
        if (typeof chainHex !== 'string') throw new Error('INVALID_CHAIN');
        return parseInt(chainHex, 16);
      },
      switchEvmChain: async ({ chainId }) => {
        const target = Number(chainId);
        if (!Number.isFinite(target) || target <= 0) throw new Error('INVALID_CHAIN');
        const { provider } = await ensureEvmProvider({ interactive: true });
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${target.toString(16)}` }]
        });
      }
    };
  }

  async function installBridge(factory, config) {
    if (hasBridge()) return true;

    if (typeof factory === 'function') {
      const maybeBridge = await factory(config);
      if (maybeBridge && typeof maybeBridge === 'object') {
        window.__PRIVY_WALLET_BRIDGE__ = maybeBridge;
        return true;
      }
    }

    if (!parseBool(config.enableDefaultBridge, true)) return false;
    if (defaultBridgePromise) return defaultBridgePromise;
    defaultBridgePromise = createDefaultPrivyBridge(config)
      .then((bridge) => {
        if (bridge && typeof bridge === 'object') {
          window.__PRIVY_WALLET_BRIDGE__ = bridge;
          return true;
        }
        return false;
      })
      .catch((err) => {
        console.warn('default privy bridge failed', err);
        return false;
      })
      .finally(() => {
        defaultBridgePromise = null;
      });
    return defaultBridgePromise;
  }

  async function bootstrapPrivyBridge() {
    if (hasBridge()) return true;
    if (bridgeInstallPromise) return bridgeInstallPromise;

    bridgeInstallPromise = (async () => {
      const config = await fetchPrivyConfig();
      if (!config) return false;

      if (config.sdkScriptUrl) {
        await loadScriptOnce(config.sdkScriptUrl);
      }

      const factory = getFactory();
      return installBridge(factory, config);
    })()
      .catch((err) => {
        console.warn('privy bootstrap failed', err);
        return false;
      })
      .finally(() => {
        bridgeInstallPromise = null;
      });

    return bridgeInstallPromise;
  }

  window.installPrivyBridge = async function installPrivyBridge(factory) {
    const config = await fetchPrivyConfig();
    if (!config) return false;
    return installBridge(factory, config);
  };

  window.ensurePrivyLogin = async function ensurePrivyLogin(options = {}) {
    const interactive = !(options && options.interactive === false);
    const loginUi = options && options.loginUi ? options.loginUi : null;
    const ready = await bootstrapPrivyBridge();
    if (!ready) return false;

    const bridge = window.__PRIVY_WALLET_BRIDGE__;
    if (!bridge || typeof bridge !== 'object') return false;

    if (typeof bridge.ensureLoggedIn === 'function') {
      const user = await bridge.ensureLoggedIn({ interactive, preferred: 'solana', loginUi });
      return !!user;
    }

    if (!interactive) return false;

    if (typeof bridge.connectSolana === 'function') {
      await bridge.connectSolana({ silent: false });
      return true;
    }

    return false;
  };

  window.ensurePrivyWalletLogin = async function ensurePrivyWalletLogin(options = {}) {
    return window.ensurePrivyLogin(options);
  };

  bootstrapPrivyBridge();
})();
