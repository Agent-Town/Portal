/* eslint-disable no-console */

(function initPrivyBridgeBootstrap() {
  const DEFAULT_PRIVY_SDK_MODULE_URL = 'https://cdn.jsdelivr.net/npm/@privy-io/js-sdk-core@0.60.0/+esm';
  const FALLBACK_PRIVY_SDK_MODULE_URLS = [
    'https://esm.sh/@privy-io/js-sdk-core@0.60.0?bundle',
    'https://cdn.jsdelivr.net/npm/@privy-io/js-sdk-core@0.60.0/+esm',
    'https://cdn.skypack.dev/@privy-io/js-sdk-core@0.60.0'
  ];

  let cachedConfig = null;
  let configPromise = null;
  let scriptLoadPromise = null;
  let bridgeInstallPromise = null;
  let sdkModulePromise = null;
  let defaultBridgePromise = null;
  let lastBootstrapError = null;

  function parseBool(value, fallback = false) {
    if (value === undefined || value === null || String(value).trim() === '') return !!fallback;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') return true;
    if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') return false;
    return !!fallback;
  }

  function normalizePrivyLoginMethod(value, fallback = 'email') {
    const tokens = String(value || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    for (const token of tokens) {
      if (token === 'email' || token === 'guest') return token;
    }
    return fallback;
  }

  const TEST_PRIVY_STORAGE_KEY = 'agentTown:privy:test-guest:v1';
  const TEST_PRIVY_SOLANA_ADDRESS = 'So11111111111111111111111111111111111111112';
  const TEST_PRIVY_EVM_ADDRESS = '0x1111111111111111111111111111111111111111';
  const TEST_PRIVY_EVM_CHAIN_ID = '0xaa36a7';

  function shouldUseDeterministicTestBridge(config) {
    return parseBool(config?.testMode, false)
      && normalizePrivyLoginMethod(config?.loginMethod || 'email', 'email') === 'guest';
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

  function readDeterministicTestGuestUser() {
    try {
      const raw = localStorage.getItem(TEST_PRIVY_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  function writeDeterministicTestGuestUser(user) {
    try {
      if (!user) {
        localStorage.removeItem(TEST_PRIVY_STORAGE_KEY);
        return;
      }
      localStorage.setItem(TEST_PRIVY_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore storage failures in deterministic test bridge
    }
  }

  async function deterministicBytes(label, value, length = 32) {
    const normalizedLength = Number.isFinite(Number(length)) ? Math.max(1, Math.floor(length)) : 32;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value || {});
    const out = new Uint8Array(normalizedLength);
    let offset = 0;
    let counter = 0;
    while (offset < normalizedLength) {
      const seed = textBytes(`${String(label || 'seed')}:${counter}:${serialized}`);
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', seed));
      const chunk = digest.subarray(0, Math.min(digest.length, normalizedLength - offset));
      out.set(chunk, offset);
      offset += chunk.length;
      counter += 1;
    }
    return out;
  }

  async function deterministicHex(label, value, length = 32) {
    const bytes = await deterministicBytes(label, value, length);
    return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
  }

  function createDeterministicTestGuestUser() {
    return {
      id: 'privy:test:guest',
      linkedAccounts: [
        { chain: 'solana', address: TEST_PRIVY_SOLANA_ADDRESS },
        { chain: 'evm', address: TEST_PRIVY_EVM_ADDRESS }
      ],
      wallets: [
        { chain: 'solana', address: TEST_PRIVY_SOLANA_ADDRESS },
        { chain: 'evm', address: TEST_PRIVY_EVM_ADDRESS }
      ]
    };
  }

  async function bindDeterministicTestWallet(config, chain, address) {
    const resetToken = typeof config?.testResetToken === 'string' ? config.testResetToken.trim() : '';
    if (!resetToken) return false;
    try {
      const resp = await fetch('/__test__/session/bind-wallet', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
          'x-test-reset': resetToken
        },
        body: JSON.stringify({ chain, address })
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  function normalizeAddress(value) {
    if (!value) return null;
    if (typeof value === 'string') return value.trim() || null;
    if (typeof value.address === 'string') return value.address.trim() || null;
    if (typeof value.public_key === 'string') return value.public_key.trim() || null;
    if (typeof value.publicKey === 'string') return value.publicKey.trim() || null;
    return null;
  }

  function parseJsonSafe(input) {
    if (!input || typeof input !== 'string') return {};
    try {
      const parsed = JSON.parse(input);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  async function postJson(url, payload) {
    const resp = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    const raw = await resp.text();
    const data = parseJsonSafe(raw);
    if (!resp.ok || data?.ok === false) {
      const code = typeof data?.error === 'string' && data.error.trim()
        ? data.error.trim()
        : 'PRIVY_WALLET_RPC_FAILED';
      const err = new Error(code);
      err.status = resp.status;
      if (typeof data?.detail === 'string' && data.detail.trim()) err.detail = data.detail.trim();
      if (data && typeof data === 'object') err.data = data;
      throw err;
    }
    return data;
  }

  function toPrivyRpcHex(value) {
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value < 0 || Math.floor(value) !== value) return null;
      return `0x${BigInt(value).toString(16)}`;
    }
    if (typeof value === 'bigint') {
      if (value < 0n) return null;
      return `0x${value.toString(16)}`;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^0x[0-9a-fA-F]+$/.test(trimmed)) return trimmed;
    if (/^[0-9]+$/.test(trimmed)) {
      try {
        return `0x${BigInt(trimmed).toString(16)}`;
      } catch {
        return null;
      }
    }
    return null;
  }

  function bridgeUserFromAddress(chain, address) {
    const normalizedChain = chain === 'evm' ? 'evm' : 'solana';
    const normalizedAddress = normalizeAddress(address);
    if (!normalizedAddress) return null;
    return {
      id: `${normalizedChain}:${normalizedAddress}`,
      wallets: [{ chain: normalizedChain, address: normalizedAddress }]
    };
  }

  async function probeCustomBridgeUser(bridge, { interactive = false, preferred = 'solana' } = {}) {
    if (!bridge || typeof bridge !== 'object') return null;

    if (bridge.user && typeof bridge.user === 'object') {
      return bridge.user;
    }
    if (typeof bridge.getUser === 'function') {
      try {
        const user = await bridge.getUser();
        if (user && typeof user === 'object') return user;
      } catch {
        // ignore bridge-specific getUser failures and continue probing
      }
    }
    if (bridge.isLoggedIn === true) {
      return { id: 'bridge-user' };
    }

    const directSolanaAddress = normalizeAddress(bridge.solanaAddress || bridge.solana || bridge.publicKey || null);
    if (directSolanaAddress) return bridgeUserFromAddress('solana', directSolanaAddress);
    const directEvmAddress = normalizeAddress(bridge.evmAddress || bridge.evm || bridge.address || null);
    if (directEvmAddress) return bridgeUserFromAddress('evm', directEvmAddress);

    const tryConnect = async (methodName, chain, params) => {
      if (typeof bridge[methodName] !== 'function') return null;
      try {
        const out = await bridge[methodName](params);
        const address = normalizeAddress(out?.address || out?.publicKey || out?.wallet?.address || out);
        return bridgeUserFromAddress(chain, address);
      } catch {
        return null;
      }
    };

    const orderedChains = preferred === 'evm'
      ? [
          ['connectEvm', 'evm', interactive ? {} : { silent: true }],
          ['connectSolana', 'solana', interactive ? { silent: false } : { silent: true }]
        ]
      : [
          ['connectSolana', 'solana', interactive ? { silent: false } : { silent: true }],
          ['connectEvm', 'evm', interactive ? {} : { silent: true }]
        ];

    for (const [methodName, chain, params] of orderedChains) {
      const user = await tryConnect(methodName, chain, params);
      if (user) return user;
    }
    return null;
  }

  function toPrivyRpcData(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return /^0x[0-9a-fA-F]*$/.test(trimmed) ? trimmed : null;
  }

  function toPrivyWalletRpcTransaction(tx) {
    const from = normalizeAddress(tx?.from || '');
    const to = normalizeAddress(tx?.to || '');
    const data = toPrivyRpcData(tx?.data || '');
    if (!from || !to || !data) throw new Error('INVALID_PRIVY_WALLET_RPC_TX');
    const out = { from, to, data };
    const optionalHexFields = [
      ['nonce', tx?.nonce],
      ['chain_id', tx?.chain_id != null ? tx.chain_id : tx?.chainId],
      ['value', tx?.value],
      ['gas_limit', tx?.gas_limit != null ? tx.gas_limit : tx?.gasLimit != null ? tx.gasLimit : tx?.gas],
      ['gas_price', tx?.gas_price != null ? tx.gas_price : tx?.gasPrice],
      ['max_fee_per_gas', tx?.max_fee_per_gas != null ? tx.max_fee_per_gas : tx?.maxFeePerGas],
      ['max_priority_fee_per_gas', tx?.max_priority_fee_per_gas != null ? tx.max_priority_fee_per_gas : tx?.maxPriorityFeePerGas],
      ['type', tx?.type]
    ];
    for (const [key, raw] of optionalHexFields) {
      const value = toPrivyRpcHex(raw);
      if (value) out[key] = value;
    }
    return out;
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
    }).catch((err) => {
      scriptLoadPromise = null;
      throw err;
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
    const configuredUrl = config && typeof config.sdkModuleUrl === 'string' && config.sdkModuleUrl.trim()
      ? config.sdkModuleUrl.trim()
      : '';
    const candidates = [
      ...(configuredUrl ? [configuredUrl] : []),
      DEFAULT_PRIVY_SDK_MODULE_URL,
      ...FALLBACK_PRIVY_SDK_MODULE_URLS
    ];
    const deduped = [...new Set(candidates.filter(Boolean))];
    sdkModulePromise = (async () => {
      let lastErr = null;
      for (const url of deduped) {
        try {
          const mod = await import(url);
          window.__PRIVY_SDK_MODULE__ = mod;
          return mod;
        } catch (err) {
          lastErr = err;
          console.warn('privy sdk module import failed', { url, err });
        }
      }
      throw lastErr || new Error('PRIVY_SDK_MODULE_LOAD_FAILED');
    })().finally(() => {
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

  async function createDeterministicTestPrivyBridge(config) {
    const state = {
      user: readDeterministicTestGuestUser(),
      solanaProvider: null,
      evmProvider: null,
    };

    const syncState = () => {
      state.user = readDeterministicTestGuestUser();
      return state.user;
    };

    const storeUser = (user) => {
      state.user = user && typeof user === 'object' ? user : null;
      writeDeterministicTestGuestUser(state.user);
      return state.user;
    };

    const clearState = () => {
      state.solanaProvider = null;
      state.evmProvider = null;
      storeUser(null);
    };

    const makeSolanaProvider = () => {
      if (state.solanaProvider) return state.solanaProvider;
      const publicKey = {
        toString() {
          return TEST_PRIVY_SOLANA_ADDRESS;
        },
        toBase58() {
          return TEST_PRIVY_SOLANA_ADDRESS;
        }
      };
      state.solanaProvider = {
        publicKey,
        isConnected: true,
        on() {},
        off() {},
        async connect() {
          return { publicKey };
        },
        async disconnect() {
          return true;
        },
        async signMessage(messageBytes) {
          const normalized = normalizeBytes(messageBytes) || textBytes(String(messageBytes || ''));
          return {
            signature: await deterministicBytes('privy-test-solana-sign', {
              address: TEST_PRIVY_SOLANA_ADDRESS,
              message: bytesToBase64(normalized)
            }, 64)
          };
        },
        async request({ method = '', params = {} } = {}) {
          if (method === 'connect') return { publicKey };
          if (method === 'signMessage') {
            const messageBytes = normalizeBytes(params?.message) || textBytes(String(params?.message || ''));
            return {
              signature: await deterministicBytes('privy-test-solana-sign', {
                address: TEST_PRIVY_SOLANA_ADDRESS,
                message: bytesToBase64(messageBytes)
              }, 64)
            };
          }
          if (method === 'getAccounts') {
            return [{ address: TEST_PRIVY_SOLANA_ADDRESS, public_key: TEST_PRIVY_SOLANA_ADDRESS }];
          }
          throw new Error(`UNSUPPORTED_SOLANA_METHOD:${method}`);
        }
      };
      return state.solanaProvider;
    };

    const makeEvmProvider = () => {
      if (state.evmProvider) return state.evmProvider;
      state.evmProvider = {
        on() {},
        off() {},
        async request({ method = '', params = [] } = {}) {
          if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
            return [TEST_PRIVY_EVM_ADDRESS];
          }
          if (method === 'eth_chainId') {
            return TEST_PRIVY_EVM_CHAIN_ID;
          }
          if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') {
            return null;
          }
          if (method === 'personal_sign') {
            const message = Array.isArray(params) ? String(params[0] || '') : '';
            return deterministicHex('privy-test-evm-sign', {
              address: TEST_PRIVY_EVM_ADDRESS,
              message
            }, 65);
          }
          if (method === 'eth_sendTransaction') {
            const transaction = Array.isArray(params) ? params[0] || {} : {};
            return deterministicHex('privy-test-evm-send', transaction, 32);
          }
          throw new Error(`UNSUPPORTED_EVM_METHOD:${method}`);
        }
      };
      return state.evmProvider;
    };

    const ensureLoggedIn = async ({ interactive = true } = {}) => {
      const current = state.user || syncState();
      if (current) return current;
      if (!interactive) return null;
      const created = createDeterministicTestGuestUser();
      storeUser(created);
      await bindDeterministicTestWallet(config, 'solana', TEST_PRIVY_SOLANA_ADDRESS);
      await bindDeterministicTestWallet(config, 'evm', TEST_PRIVY_EVM_ADDRESS);
      return created;
    };

    return {
      get user() {
        return state.user || syncState();
      },
      get isLoggedIn() {
        return !!(state.user || syncState());
      },
      async getUser() {
        return state.user || syncState();
      },
      ensureLoggedIn,
      connectSolana: async ({ silent = false } = {}) => {
        const user = await ensureLoggedIn({ interactive: !silent });
        if (!user) throw new Error('NO_SOLANA_WALLET');
        await bindDeterministicTestWallet(config, 'solana', TEST_PRIVY_SOLANA_ADDRESS);
        const provider = makeSolanaProvider();
        return { address: TEST_PRIVY_SOLANA_ADDRESS, provider, wallet: provider };
      },
      disconnectSolana: async () => {
        clearState();
        return true;
      },
      signSolanaMessage: async ({ message = '', bytes = null } = {}) => {
        await ensureLoggedIn({ interactive: true });
        const normalized = normalizeBytes(bytes) || textBytes(message);
        return {
          signature: await deterministicBytes('privy-test-solana-sign', {
            address: TEST_PRIVY_SOLANA_ADDRESS,
            message: bytesToBase64(normalized)
          }, 64)
        };
      },
      sendSolanaTransaction: async ({ transaction = '' } = {}) => {
        await ensureLoggedIn({ interactive: true });
        return {
          hash: bytesToBase58(await deterministicBytes('privy-test-solana-tx', transaction, 32)),
          transactionId: bytesToBase58(await deterministicBytes('privy-test-solana-tx-id', transaction, 32))
        };
      },
      connectEvm: async ({ silent = false } = {}) => {
        const user = await ensureLoggedIn({ interactive: !silent });
        if (!user) throw new Error('NO_EVM_WALLET');
        await bindDeterministicTestWallet(config, 'evm', TEST_PRIVY_EVM_ADDRESS);
        const provider = makeEvmProvider();
        return {
          address: TEST_PRIVY_EVM_ADDRESS,
          provider,
          wallet: { provider, refreshProvider: async () => provider },
          executionMode: 'tee',
          isUnifiedWallet: true
        };
      },
      disconnectEvm: async () => {
        clearState();
        return true;
      },
      signEvmMessage: async ({ message = '', address = null } = {}) => {
        await ensureLoggedIn({ interactive: true });
        return {
          signature: await deterministicHex('privy-test-evm-sign', {
            address: normalizeAddress(address) || TEST_PRIVY_EVM_ADDRESS,
            message: String(message || '')
          }, 65)
        };
      },
      sendEvmTransaction: async ({ transaction = {} } = {}) => {
        await ensureLoggedIn({ interactive: true });
        const hash = await deterministicHex('privy-test-evm-send', transaction, 32);
        return {
          hash,
          transactionHash: hash,
          userOperationHash: hash
        };
      },
      resetWalletProxies: async () => true,
    };
  }

  async function createDefaultPrivyBridge(config) {
    const sdk = await loadPrivyModule(config);
    const Privy = sdk.default;
    if (!Privy) throw new Error('PRIVY_SDK_MISSING_DEFAULT_EXPORT');

    let client = null;
    const storage = sdk.LocalStorage ? new sdk.LocalStorage() : null;
    const proxyState = {
      iframe: null,
      listener: null,
      url: '',
      mounted: false
    };

    function unmountEmbeddedWalletProxy() {
      if (proxyState.listener) {
        window.removeEventListener('message', proxyState.listener);
        proxyState.listener = null;
      }
      if (proxyState.iframe && proxyState.iframe.parentNode) {
        proxyState.iframe.parentNode.removeChild(proxyState.iframe);
      }
      proxyState.iframe = null;
      proxyState.url = '';
      proxyState.mounted = false;
    }

    async function ensureEmbeddedWalletProxy({ force = false } = {}) {
      const embeddedWallet = client?.embeddedWallet;
      const getURL = embeddedWallet && typeof embeddedWallet.getURL === 'function'
        ? embeddedWallet.getURL.bind(embeddedWallet)
        : embeddedWallet && typeof embeddedWallet.getUrl === 'function'
          ? embeddedWallet.getUrl.bind(embeddedWallet)
          : null;
      const onMessage = embeddedWallet && typeof embeddedWallet.onMessage === 'function'
        ? embeddedWallet.onMessage.bind(embeddedWallet)
        : null;
      const setMessagePoster = client && typeof client.setMessagePoster === 'function'
        ? client.setMessagePoster.bind(client)
        : null;

      if (!getURL || !onMessage || !setMessagePoster) return false;

      let url = '';
      try {
        url = String(await getURL()).trim();
      } catch {
        url = '';
      }
      if (!url) return false;

      if (!force && proxyState.mounted && proxyState.iframe && proxyState.url === url) {
        return true;
      }

      unmountEmbeddedWalletProxy();

      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.title = 'Privy wallet proxy';
      iframe.tabIndex = -1;
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.border = '0';
      (document.body || document.documentElement).appendChild(iframe);

      await new Promise((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        iframe.addEventListener('load', done, { once: true });
        setTimeout(done, 1200);
      });

      setMessagePoster({
        postMessage: (message, targetOrigin = '*') => {
          const win = iframe.contentWindow;
          if (!win) return;
          win.postMessage(message, targetOrigin || '*');
        }
      });

      const listener = (event) => {
        if (!event) return;
        const win = iframe.contentWindow;
        if (win && event.source !== win) return;
        try {
          onMessage(event.data);
        } catch {
          // ignore malformed proxy messages
        }
      };
      window.addEventListener('message', listener);

      proxyState.iframe = iframe;
      proxyState.listener = listener;
      proxyState.url = url;
      proxyState.mounted = true;
      return true;
    }

    async function initializeClient({ includeClientId = true } = {}) {
      const next = new Privy({
        appId: config.appId,
        ...(includeClientId && config.clientId ? { clientId: config.clientId } : {}),
        ...(storage ? { storage } : {})
      });
      await next.initialize();
      client = next;
      await ensureEmbeddedWalletProxy({ force: true });
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

    async function downgradeClientIdForWalletProxyIfNeeded(err) {
      if (!state.usingClientId) return false;
      if (!errorContains(err, 'wallet proxy not initialized')
        && !errorContains(err, 'embedded wallet proxy not initialized')
        && !errorContains(err, 'embedded_wallet_proxy_not_initialized')
        && !errorContains(err, 'wallet_proxy_not_initialized')) {
        return false;
      }
      try {
        await initializeClient({ includeClientId: false });
        state.client = client;
        state.usingClientId = false;
        state.user = null;
        state.solanaAccount = null;
        state.solanaProvider = null;
        state.evmAccount = null;
        state.evmProvider = null;
        await refreshUser();
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

    function isUnifiedWalletAccount(account) {
      if (!account || typeof account !== 'object') return false;
      if (sdk && typeof sdk.isUnifiedWallet === 'function') {
        try {
          return sdk.isUnifiedWallet(account) === true;
        } catch {
          return false;
        }
      }
      return account.recovery_method === 'privy-v2';
    }

    function getWalletExecutionMeta(account) {
      if (!account || typeof account !== 'object') {
        return { executionMode: null, isUnifiedWallet: null };
      }
      const isUnifiedWallet = isUnifiedWalletAccount(account);
      return {
        executionMode: isUnifiedWallet ? 'tee' : 'on-device',
        isUnifiedWallet
      };
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
      const method = normalizePrivyLoginMethod(config.loginMethod || 'email', 'email');
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

    function isWalletProxyInitError(err) {
      return errorContains(err, 'wallet proxy not initialized')
        || errorContains(err, 'embedded wallet proxy not initialized')
        || errorContains(err, 'embedded_wallet_proxy_not_initialized')
        || errorContains(err, 'wallet_proxy_not_initialized');
    }

    function clearWalletProxyCache({ chain = null } = {}) {
      const target = chain && typeof chain === 'string' ? chain.trim().toLowerCase() : '';
      if (!target || target === 'solana' || target === 'all') {
        state.solanaAccount = null;
        state.solanaProvider = null;
      }
      if (!target || target === 'evm' || target === 'ethereum' || target === 'all') {
        state.evmAccount = null;
        state.evmProvider = null;
      }
    }

    function wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function ensureSolanaProvider({ interactive = true, refreshProvider = false } = {}) {
      await ensureEmbeddedWalletProxy({ force: refreshProvider });
      const user = await ensureLoggedIn({ interactive, preferred: 'solana' });
      if (!user) throw new Error('PRIVY_LOGIN_REQUIRED');

      let account = pickSolanaAccount(user);
      if (!account && interactive) {
        const created = await client.embeddedWallet.createSolana();
        state.user = created?.user || state.user;
        account = pickSolanaAccount(state.user);
      }
      if (!account) throw new Error('NO_SOLANA_WALLET');

      if (!refreshProvider && state.solanaProvider && state.solanaAccount?.address === account.address) {
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

    async function ensureEvmProvider({ interactive = true, refreshProvider = false } = {}) {
      await ensureEmbeddedWalletProxy({ force: refreshProvider });
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

      if (!refreshProvider && state.evmProvider && state.evmAccount?.address === account.address) {
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

    function normalizeEvmTxHash(value) {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) return null;
      return trimmed;
    }

    function normalizePrivyTransactionId(value) {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }

    function normalizeSolanaTxHash(value) {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      if (/\s/.test(trimmed)) return null;
      if (!/^[1-9A-HJ-NP-Za-km-z]{16,128}$/.test(trimmed)) return null;
      return trimmed;
    }

    function parseSponsoredEvmSendResult(raw) {
      return {
        hash: normalizeEvmTxHash(
          raw?.data?.transaction_hash
          || raw?.data?.transactionHash
          || raw?.data?.hash
          || raw?.transactionHash
          || raw?.hash
          || raw
        ),
        transactionId: normalizePrivyTransactionId(
          raw?.data?.transaction_id
          || raw?.data?.transactionId
          || raw?.transaction_id
          || raw?.transactionId
        ),
        userOperationHash: normalizeEvmTxHash(
          raw?.data?.user_operation_hash
          || raw?.data?.userOperationHash
          || raw?.user_operation_hash
          || raw?.userOperationHash
        )
      };
    }

    function parseSponsoredSolanaSendResult(raw) {
      return {
        hash: normalizeSolanaTxHash(
          raw?.data?.hash
          || raw?.data?.signature
          || raw?.data?.transactionSignature
          || raw?.hash
          || raw?.signature
          || raw?.transactionSignature
          || raw
        ),
        transactionId: normalizePrivyTransactionId(
          raw?.data?.transaction_id
          || raw?.data?.transactionId
          || raw?.transaction_id
          || raw?.transactionId
        )
      };
    }

    function normalizePrivyRpcBase64(value) {
      if (typeof value !== 'string') throw new Error('INVALID_PRIVY_WALLET_RPC_SOLANA_TX');
      const trimmed = value.trim();
      if (!trimmed) throw new Error('INVALID_PRIVY_WALLET_RPC_SOLANA_TX');
      if (!/^[A-Za-z0-9+/=_-]+$/.test(trimmed)) throw new Error('INVALID_PRIVY_WALLET_RPC_SOLANA_TX');
      const normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/');
      const pad = normalized.length % 4;
      const padded = pad === 0 ? normalized : `${normalized}${'='.repeat(4 - pad)}`;
      const bytes = base64ToBytes(padded);
      if (!(bytes instanceof Uint8Array) || bytes.length === 0) {
        throw new Error('INVALID_PRIVY_WALLET_RPC_SOLANA_TX');
      }
      return padded;
    }

    function normalizeSolanaRpcEncoding(value) {
      if (value == null) return 'base64';
      const trimmed = typeof value === 'string' ? value.trim().toLowerCase() : '';
      if (!trimmed) return 'base64';
      if (trimmed !== 'base64') throw new Error('INVALID_PRIVY_WALLET_RPC_SOLANA_ENCODING');
      return trimmed;
    }

    async function sendSponsoredEvmViaServerRelay({ walletId, tx, caip2 = null } = {}) {
      const normalizedWalletId = typeof walletId === 'string' ? walletId.trim() : '';
      if (!normalizedWalletId) throw new Error('INVALID_PRIVY_WALLET_ID');
      if (!sdk || typeof sdk.generateAuthorizationSignature !== 'function') {
        throw new Error('PRIVY_WALLET_RPC_SIGN_UNAVAILABLE');
      }
      if (!client || !client.embeddedWallet || typeof client.embeddedWallet.signWithUserSigner !== 'function') {
        throw new Error('PRIVY_WALLET_RPC_SIGN_UNAVAILABLE');
      }

      const prepareOut = await postJson('/api/privy/wallet-rpc/prepare', {
        walletId: normalizedWalletId,
        body: {
          chain_type: 'ethereum',
          method: 'eth_sendTransaction',
          params: {
            transaction: toPrivyWalletRpcTransaction(tx)
          },
          sponsor: true,
          ...(typeof caip2 === 'string' && caip2.trim() ? { caip2: caip2.trim() } : {})
        }
      });
      const signingPayload = prepareOut?.signingPayload && typeof prepareOut.signingPayload === 'object'
        ? prepareOut.signingPayload
        : null;
      const body = prepareOut?.body && typeof prepareOut.body === 'object'
        ? prepareOut.body
        : null;
      if (!signingPayload || !body) throw new Error('PRIVY_WALLET_RPC_SIGNING_PAYLOAD_MISSING');

      let signature = '';
      try {
        const signed = await sdk.generateAuthorizationSignature(
          client.embeddedWallet.signWithUserSigner.bind(client.embeddedWallet),
          signingPayload
        );
        signature = typeof signed?.signature === 'string' ? signed.signature.trim() : '';
      } catch (err) {
        const out = new Error('PRIVY_WALLET_RPC_SIGN_FAILED');
        const detail = typeof err?.message === 'string' ? err.message.trim() : '';
        if (detail) out.detail = detail;
        out.cause = err;
        throw out;
      }
      if (!signature) throw new Error('PRIVY_WALLET_RPC_SIGN_FAILED');

      const relayOut = await postJson('/api/privy/wallet-rpc/relay', {
        walletId: normalizedWalletId,
        body,
        signature
      });
      return relayOut?.result && typeof relayOut.result === 'object' ? relayOut.result : relayOut;
    }

    async function sendSponsoredSolanaViaServerRelay({
      walletId,
      transaction,
      caip2 = null,
      encoding = 'base64'
    } = {}) {
      const normalizedWalletId = typeof walletId === 'string' ? walletId.trim() : '';
      if (!normalizedWalletId) throw new Error('INVALID_PRIVY_WALLET_ID');
      if (!sdk || typeof sdk.generateAuthorizationSignature !== 'function') {
        throw new Error('PRIVY_WALLET_RPC_SIGN_UNAVAILABLE');
      }
      if (!client || !client.embeddedWallet || typeof client.embeddedWallet.signWithUserSigner !== 'function') {
        throw new Error('PRIVY_WALLET_RPC_SIGN_UNAVAILABLE');
      }

      const txBase64 = normalizePrivyRpcBase64(transaction);
      const normalizedEncoding = normalizeSolanaRpcEncoding(encoding);
      const normalizedCaip2 = typeof caip2 === 'string' && caip2.trim() ? caip2.trim() : '';

      const prepareOut = await postJson('/api/privy/wallet-rpc/prepare', {
        walletId: normalizedWalletId,
        body: {
          method: 'signAndSendTransaction',
          params: {
            transaction: txBase64,
            encoding: normalizedEncoding
          },
          sponsor: true,
          ...(normalizedCaip2 ? { caip2: normalizedCaip2 } : {})
        }
      });
      const signingPayload = prepareOut?.signingPayload && typeof prepareOut.signingPayload === 'object'
        ? prepareOut.signingPayload
        : null;
      const body = prepareOut?.body && typeof prepareOut.body === 'object'
        ? prepareOut.body
        : null;
      if (!signingPayload || !body) throw new Error('PRIVY_WALLET_RPC_SIGNING_PAYLOAD_MISSING');

      let signature = '';
      try {
        const signed = await sdk.generateAuthorizationSignature(
          client.embeddedWallet.signWithUserSigner.bind(client.embeddedWallet),
          signingPayload
        );
        signature = typeof signed?.signature === 'string' ? signed.signature.trim() : '';
      } catch (err) {
        const out = new Error('PRIVY_WALLET_RPC_SIGN_FAILED');
        const detail = typeof err?.message === 'string' ? err.message.trim() : '';
        if (detail) out.detail = detail;
        out.cause = err;
        throw out;
      }
      if (!signature) throw new Error('PRIVY_WALLET_RPC_SIGN_FAILED');

      const relayOut = await postJson('/api/privy/wallet-rpc/relay', {
        walletId: normalizedWalletId,
        body,
        signature
      });
      return relayOut?.result && typeof relayOut.result === 'object' ? relayOut.result : relayOut;
    }

    function isUnsupportedEvmMethodError(err, method) {
      const requestedMethod = typeof method === 'string' ? method.trim().toLowerCase() : '';
      if (!requestedMethod) return false;
      return (
        (errorContains(err, 'does not support the method') && errorContains(err, requestedMethod))
        || errorContains(err, 'unsupported method')
      );
    }

    return {
      ensureLoggedIn,
      connectSolana: async ({ silent = false } = {}) => {
        const interactive = !silent;
        let lastErr = null;
        for (let attempt = 0; attempt < 4; attempt += 1) {
          try {
            const { account, provider } = await ensureSolanaProvider({
              interactive,
              refreshProvider: attempt > 0
            });
            const address = normalizeAddress(account.public_key || account.address || null);
            if (!address) throw new Error('NO_SOLANA_PUBKEY');
            return { address, provider };
          } catch (err) {
            lastErr = err;
            if (!isWalletProxyInitError(err) || attempt >= 3) throw err;
            const downgraded = await downgradeClientIdForWalletProxyIfNeeded(err);
            if (downgraded) {
              clearWalletProxyCache({ chain: 'all' });
              continue;
            }
            clearWalletProxyCache({ chain: 'solana' });
            await wait(180 * (attempt + 1));
          }
        }
        throw lastErr || new Error('EMBEDDED_WALLET_PROXY_NOT_INITIALIZED');
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
        unmountEmbeddedWalletProxy();
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
      sendSolanaTransaction: async ({
        transaction = '',
        sponsor = true,
        caip2 = null,
        encoding = 'base64'
      } = {}) => {
        let lastErr = null;
        for (let attempt = 0; attempt < 4; attempt += 1) {
          try {
            const { account } = await ensureSolanaProvider({
              interactive: true,
              refreshProvider: attempt > 0
            });
            const txBase64 = normalizePrivyRpcBase64(transaction);
            const normalizedEncoding = normalizeSolanaRpcEncoding(encoding);
            const normalizedWalletId = typeof account?.id === 'string' ? account.id.trim() : '';
            const normalizedCaip2 = typeof caip2 === 'string' && caip2.trim() ? caip2.trim() : '';

            if (sponsor === true) {
              let rpcErr = null;

              if (
                sdk
                && typeof sdk.rpc === 'function'
                && client
                && typeof client.fetchPrivyRoute === 'function'
                && typeof client.getCompiledPath === 'function'
                && client.app
                && typeof client.app.appId === 'string'
                && client.embeddedWallet
                && typeof client.embeddedWallet.signWithUserSigner === 'function'
                && normalizedWalletId
              ) {
                try {
                  const rpcOut = await sdk.rpc(
                    client,
                    client.embeddedWallet.signWithUserSigner.bind(client.embeddedWallet),
                    {
                      wallet_id: normalizedWalletId,
                      chain_type: 'solana',
                      method: 'signAndSendTransaction',
                      params: { transaction: txBase64, encoding: normalizedEncoding },
                      sponsor: true,
                      ...(normalizedCaip2 ? { caip2: normalizedCaip2 } : {})
                    }
                  );
                  const sponsored = parseSponsoredSolanaSendResult(rpcOut);
                  if (sponsored.hash || sponsored.transactionId) {
                    return {
                      hash: sponsored.hash,
                      transactionId: sponsored.transactionId,
                      result: rpcOut
                    };
                  }
                } catch (err) {
                  rpcErr = err;
                  console.warn('privy sdk solana rpc send failed; trying server relay fallback', err);
                }
              }

              try {
                const relayOut = await sendSponsoredSolanaViaServerRelay({
                  walletId: normalizedWalletId,
                  transaction: txBase64,
                  encoding: normalizedEncoding,
                  ...(normalizedCaip2 ? { caip2: normalizedCaip2 } : {})
                });
                const sponsored = parseSponsoredSolanaSendResult(relayOut);
                if (sponsored.hash || sponsored.transactionId) {
                  return {
                    hash: sponsored.hash,
                    transactionId: sponsored.transactionId,
                    result: relayOut
                  };
                }
                throw new Error('PRIVY_SOLANA_SPONSORED_TX_NO_RESULT');
              } catch (relayErr) {
                if (rpcErr && !relayErr.cause) relayErr.cause = rpcErr;
                throw relayErr;
              }
            }

            throw new Error('PRIVY_SOLANA_SPONSORED_TX_UNAVAILABLE');
          } catch (err) {
            lastErr = err;
            if (!isWalletProxyInitError(err) || attempt >= 3) throw err;
            const downgraded = await downgradeClientIdForWalletProxyIfNeeded(err);
            if (downgraded) {
              clearWalletProxyCache({ chain: 'all' });
              continue;
            }
            clearWalletProxyCache({ chain: 'solana' });
            await wait(180 * (attempt + 1));
          }
        }
        throw lastErr || new Error('EMBEDDED_WALLET_PROXY_NOT_INITIALIZED');
      },
      connectEvm: async () => {
        let lastErr = null;
        for (let attempt = 0; attempt < 4; attempt += 1) {
          try {
            const { account, provider } = await ensureEvmProvider({
              interactive: true,
              refreshProvider: attempt > 0
            });
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const address = normalizeAddress(Array.isArray(accounts) && accounts.length ? accounts[0] : account.address);
            if (!address) throw new Error('NO_EVM_ACCOUNT');
            return {
              address,
              provider,
              ...getWalletExecutionMeta(account)
            };
          } catch (err) {
            lastErr = err;
            if (!isWalletProxyInitError(err) || attempt >= 3) throw err;
            const downgraded = await downgradeClientIdForWalletProxyIfNeeded(err);
            if (downgraded) {
              clearWalletProxyCache({ chain: 'all' });
              continue;
            }
            clearWalletProxyCache({ chain: 'evm' });
            await wait(180 * (attempt + 1));
          }
        }
        throw lastErr || new Error('EMBEDDED_WALLET_PROXY_NOT_INITIALIZED');
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
        unmountEmbeddedWalletProxy();
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
      sendEvmTransaction: async ({ transaction = {}, sponsor = true, caip2 = null, chainId = null } = {}) => {
        let lastErr = null;
        for (let attempt = 0; attempt < 4; attempt += 1) {
          try {
            const { account, provider } = await ensureEvmProvider({
              interactive: true,
              refreshProvider: attempt > 0
            });
            const signer = normalizeAddress(transaction?.from || account.address);
            if (!signer) throw new Error('NO_EVM_ACCOUNT');
            const tx = {
              ...(transaction && typeof transaction === 'object' ? transaction : {}),
              from: signer
            };
            const sponsoredTx = { ...tx };
            if (Object.prototype.hasOwnProperty.call(sponsoredTx, 'chainId')) delete sponsoredTx.chainId;
            if (Object.prototype.hasOwnProperty.call(sponsoredTx, 'chain_id')) delete sponsoredTx.chain_id;
            const numericChainId = Number(chainId);
            const resolvedCaip2 = typeof caip2 === 'string' && caip2.trim()
              ? caip2.trim()
              : Number.isFinite(numericChainId) && numericChainId > 0
                ? `eip155:${Math.floor(numericChainId)}`
                : null;

            if (sponsor === true) {
              const normalizedWalletId = typeof account?.id === 'string' ? account.id.trim() : '';
              let rpcErr = null;

              if (
                sdk
                && typeof sdk.rpc === 'function'
                && client
                && typeof client.fetchPrivyRoute === 'function'
                && typeof client.getCompiledPath === 'function'
                && client.app
                && typeof client.app.appId === 'string'
                && client.embeddedWallet
                && typeof client.embeddedWallet.signWithUserSigner === 'function'
                && normalizedWalletId
              ) {
                try {
                  const rpcOut = await sdk.rpc(
                    client,
                    client.embeddedWallet.signWithUserSigner.bind(client.embeddedWallet),
                    {
                      wallet_id: normalizedWalletId,
                      chain_type: 'ethereum',
                      method: 'eth_sendTransaction',
                      params: { transaction: sponsoredTx },
                      sponsor: true,
                      ...(resolvedCaip2 ? { caip2: resolvedCaip2 } : {})
                    }
                  );
                  const sponsored = parseSponsoredEvmSendResult(rpcOut);
                  if (sponsored.hash || sponsored.transactionId || sponsored.userOperationHash) {
                    return {
                      hash: sponsored.hash,
                      transactionId: sponsored.transactionId,
                      userOperationHash: sponsored.userOperationHash,
                      result: rpcOut
                    };
                  }
                } catch (err) {
                  rpcErr = err;
                  if (!isUnsupportedEvmMethodError(err, 'eth_sendTransaction')) {
                    console.warn('privy sdk rpc send failed; trying server relay fallback', err);
                  }
                }
              }

              try {
                const relayOut = await sendSponsoredEvmViaServerRelay({
                  walletId: normalizedWalletId,
                  tx: sponsoredTx,
                  ...(resolvedCaip2 ? { caip2: resolvedCaip2 } : {})
                });
                const sponsored = parseSponsoredEvmSendResult(relayOut);
                if (sponsored.hash || sponsored.transactionId || sponsored.userOperationHash) {
                  return {
                    hash: sponsored.hash,
                    transactionId: sponsored.transactionId,
                    userOperationHash: sponsored.userOperationHash,
                    result: relayOut
                  };
                }
                throw new Error('PRIVY_SPONSORED_TX_NO_RESULT');
              } catch (relayErr) {
                if (rpcErr && !relayErr.cause) relayErr.cause = rpcErr;
                throw relayErr;
              }
            }

            const out = await provider.request({
              method: 'eth_sendTransaction',
              params: [tx]
            });
            const hash = normalizeEvmTxHash(out?.txHash || out?.transactionHash || out?.hash || out);
            if (hash) return { hash, result: out };
            throw new Error('MINT_EVM_FAILED');
          } catch (err) {
            lastErr = err;
            if (!isWalletProxyInitError(err) || attempt >= 3) throw err;
            const downgraded = await downgradeClientIdForWalletProxyIfNeeded(err);
            if (downgraded) {
              clearWalletProxyCache({ chain: 'all' });
              continue;
            }
            clearWalletProxyCache({ chain: 'evm' });
            await wait(180 * (attempt + 1));
          }
        }
        throw lastErr || new Error('EMBEDDED_WALLET_PROXY_NOT_INITIALIZED');
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
      },
      getDebugState: () => ({
        hasUser: !!state.user,
        hasEvmAccount: !!state.evmAccount,
        hasEvmProvider: !!state.evmProvider,
        hasSolanaAccount: !!state.solanaAccount,
        hasSolanaProvider: !!state.solanaProvider,
        proxyMounted: proxyState.mounted,
        proxyUrl: proxyState.url || null
      }),
      resetWalletProxies: async ({ chain = null, refreshUserState = false, hard = false } = {}) => {
        clearWalletProxyCache({ chain });
        if (hard) {
          unmountEmbeddedWalletProxy();
          await ensureEmbeddedWalletProxy({ force: true });
        }
        if (refreshUserState) {
          await refreshUser();
        }
        return true;
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

    if (shouldUseDeterministicTestBridge(config)) {
      const bridge = await createDeterministicTestPrivyBridge(config);
      if (bridge && typeof bridge === 'object') {
        window.__PRIVY_WALLET_BRIDGE__ = bridge;
        lastBootstrapError = null;
        return true;
      }
      return false;
    }

    if (!parseBool(config.enableDefaultBridge, true)) return false;
    if (defaultBridgePromise) return defaultBridgePromise;
    defaultBridgePromise = createDefaultPrivyBridge(config)
      .then((bridge) => {
        if (bridge && typeof bridge === 'object') {
          window.__PRIVY_WALLET_BRIDGE__ = bridge;
          lastBootstrapError = null;
          return true;
        }
        return false;
      })
      .catch((err) => {
        lastBootstrapError = err;
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

      if (!shouldUseDeterministicTestBridge(config) && config.sdkScriptUrl) {
        try {
          await loadScriptOnce(config.sdkScriptUrl);
        } catch (err) {
          console.warn('privy sdk script load failed; continuing with module fallback', err);
        }
      }

      const factory = getFactory();
      return installBridge(factory, config);
    })()
      .catch((err) => {
        lastBootstrapError = err;
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
    if (!ready) {
      const out = new Error('PRIVY_BRIDGE_INIT_FAILED');
      out.code = 'PRIVY_BRIDGE_INIT_FAILED';
      if (lastBootstrapError) out.cause = lastBootstrapError;
      throw out;
    }

    const bridge = window.__PRIVY_WALLET_BRIDGE__;
    if (!bridge || typeof bridge !== 'object') {
      const out = new Error('PRIVY_BRIDGE_MISSING');
      out.code = 'PRIVY_BRIDGE_MISSING';
      throw out;
    }

    if (typeof bridge.ensureLoggedIn === 'function') {
      const user = await bridge.ensureLoggedIn({ interactive, preferred: 'solana', loginUi });
      return !!user;
    }

    const fallbackUser = await probeCustomBridgeUser(bridge, { interactive, preferred: 'solana' });
    if (fallbackUser) return true;

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

  window.resetPrivyBridge = async function resetPrivyBridge(options = {}) {
    const hard = !!(options && options.hard === true);
    const bridge = window.__PRIVY_WALLET_BRIDGE__;
    if (bridge && typeof bridge === 'object') {
      if (typeof bridge.disconnectEvm === 'function') {
        try {
          await bridge.disconnectEvm();
        } catch {
          // ignore
        }
      }
      if (typeof bridge.disconnectSolana === 'function') {
        try {
          await bridge.disconnectSolana();
        } catch {
          // ignore
        }
      }
    }
    window.__PRIVY_WALLET_BRIDGE__ = null;
    bridgeInstallPromise = null;
    defaultBridgePromise = null;
    if (hard) {
      sdkModulePromise = null;
      scriptLoadPromise = null;
      window.__PRIVY_SDK_MODULE__ = null;
    }
    return bootstrapPrivyBridge();
  };

  window.__getPrivyBootstrapState = function getPrivyBootstrapState() {
    return {
      hasBridge: hasBridge(),
      hasConfig: !!cachedConfig,
      lastBootstrapError: lastBootstrapError ? String(lastBootstrapError?.message || lastBootstrapError) : null
    };
  };

  bootstrapPrivyBridge();
})();
