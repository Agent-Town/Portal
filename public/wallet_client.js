/* eslint-disable no-console */

(function initAgentTownWalletClientGlobal() {
  const CHAIN_SOLANA = 'solana';
  const CHAIN_EVM = 'evm';

  function base58Decode(str) {
    if (!str || typeof str !== 'string') return null;
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = 0n;
    for (const ch of str) {
      const idx = alphabet.indexOf(ch);
      if (idx < 0) return null;
      num = num * 58n + BigInt(idx);
    }
    const bytes = [];
    while (num > 0n) {
      bytes.push(Number(num & 0xffn));
      num >>= 8n;
    }
    bytes.reverse();
    let leadingZeros = 0;
    for (let i = 0; i < str.length && str[i] === '1'; i++) leadingZeros++;
    if (leadingZeros) return new Uint8Array(Array(leadingZeros).fill(0).concat(bytes));
    return new Uint8Array(bytes);
  }

  function normalizeSignatureBytes(sig) {
    if (sig instanceof Uint8Array) return sig;
    if (sig instanceof ArrayBuffer) return new Uint8Array(sig);
    if (ArrayBuffer.isView(sig)) return new Uint8Array(sig.buffer);
    if (Array.isArray(sig)) return new Uint8Array(sig);
    if (typeof sig === 'string') {
      const b58 = base58Decode(sig);
      if (b58 && b58.length === 64) return b58;
      try {
        const bin = atob(sig);
        if (bin.length === 64) return Uint8Array.from(bin, (c) => c.charCodeAt(0));
      } catch {
        // ignore invalid base64
      }
    }
    return null;
  }

  function extractAddress(value) {
    if (!value) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || null;
    }
    if (value.publicKey && typeof value.publicKey.toString === 'function') {
      const addr = value.publicKey.toString();
      return typeof addr === 'string' && addr ? addr : null;
    }
    if (typeof value.toString === 'function') {
      const addr = value.toString();
      return typeof addr === 'string' && addr && addr !== '[object Object]' ? addr : null;
    }
    return null;
  }

  class AgentTownWalletClient {
    constructor() {
      this.solanaAddress = null;
      this.solanaProvider = null;
      this.solanaUnsub = null;
      this.evmAddress = null;
      this.evmProvider = null;
      this.events = {
        disconnect: new Set(),
        accountChanged: new Set()
      };
    }

    _bridge() {
      return window.__PRIVY_WALLET_BRIDGE__ || null;
    }

    _emit(event, payload) {
      const listeners = this.events[event];
      if (!listeners || !listeners.size) return;
      for (const handler of listeners) {
        try {
          handler(payload);
        } catch (e) {
          console.warn('wallet event handler failed', e);
        }
      }
    }

    _bindSolanaProvider(provider) {
      if (!provider || typeof provider !== 'object') return;
      if (this.solanaUnsub) {
        this.solanaUnsub();
        this.solanaUnsub = null;
      }

      const on = typeof provider.on === 'function' ? provider.on.bind(provider) : null;
      const off =
        typeof provider.off === 'function'
          ? provider.off.bind(provider)
          : typeof provider.removeListener === 'function'
            ? provider.removeListener.bind(provider)
            : null;
      if (!on || !off) {
        this.solanaProvider = provider;
        return;
      }

      const onDisconnect = () => {
        this.solanaAddress = null;
        this._emit('disconnect');
      };
      const onAccountChanged = (next) => {
        const addr = extractAddress(next);
        if (!addr) {
          this.solanaAddress = null;
          this._emit('disconnect');
          return;
        }
        this.solanaAddress = addr;
        this._emit('accountChanged', addr);
      };

      try {
        on('disconnect', onDisconnect);
      } catch {
        // ignore
      }
      try {
        on('accountChanged', onAccountChanged);
      } catch {
        // ignore
      }

      this.solanaProvider = provider;
      this.solanaUnsub = () => {
        try {
          off('disconnect', onDisconnect);
        } catch {
          // ignore
        }
        try {
          off('accountChanged', onAccountChanged);
        } catch {
          // ignore
        }
      };
    }

    on(event, handler) {
      if (!this.events[event] || typeof handler !== 'function') return;
      this.events[event].add(handler);
    }

    off(event, handler) {
      if (!this.events[event] || typeof handler !== 'function') return;
      this.events[event].delete(handler);
    }

    async connect({ chain = CHAIN_SOLANA, silent = false } = {}) {
      if (chain === CHAIN_SOLANA) return this._connectSolana({ silent });
      if (chain === CHAIN_EVM) return this._connectEvm();
      throw new Error('UNSUPPORTED_CHAIN');
    }

    async disconnect({ chain = CHAIN_SOLANA } = {}) {
      if (chain === CHAIN_SOLANA) return this._disconnectSolana();
      if (chain === CHAIN_EVM) return this._disconnectEvm();
      throw new Error('UNSUPPORTED_CHAIN');
    }

    getAddress({ chain = CHAIN_SOLANA } = {}) {
      if (chain === CHAIN_SOLANA) return this.solanaAddress || null;
      if (chain === CHAIN_EVM) return this.evmAddress || null;
      throw new Error('UNSUPPORTED_CHAIN');
    }

    async signMessage({ chain = CHAIN_SOLANA, message = '', address = null } = {}) {
      if (chain === CHAIN_SOLANA) return this._signSolanaMessage(message);
      if (chain === CHAIN_EVM) return this._signEvmPersonalMessage(message, address);
      throw new Error('UNSUPPORTED_CHAIN');
    }

    async getChainId({ chain = CHAIN_EVM } = {}) {
      if (chain !== CHAIN_EVM) throw new Error('UNSUPPORTED_CHAIN');
      const bridge = this._bridge();
      if (bridge && typeof bridge.getEvmChainId === 'function') {
        const cid = await bridge.getEvmChainId();
        const n = Number(cid);
        if (Number.isFinite(n) && n > 0) return n;
      }
      const provider = await this._getEvmProvider();
      const chainHex = await provider.request({ method: 'eth_chainId' });
      return parseInt(chainHex, 16);
    }

    async switchChain({ chain = CHAIN_EVM, chainId } = {}) {
      if (chain !== CHAIN_EVM) throw new Error('UNSUPPORTED_CHAIN');
      const target = Number(chainId);
      if (!Number.isFinite(target) || target <= 0) throw new Error('INVALID_CHAIN');
      const bridge = this._bridge();
      if (bridge && typeof bridge.switchEvmChain === 'function') {
        await bridge.switchEvmChain({ chainId: target });
        return;
      }
      const provider = await this._getEvmProvider();
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${target.toString(16)}` }]
      });
    }

    getProvider({ chain = CHAIN_EVM } = {}) {
      if (chain !== CHAIN_EVM) throw new Error('UNSUPPORTED_CHAIN');
      if (this.evmProvider) return this.evmProvider;
      const bridge = this._bridge();
      if (bridge && typeof bridge.getEvmProvider === 'function') {
        const provider = bridge.getEvmProvider();
        if (provider) {
          this.evmProvider = provider;
          return provider;
        }
      }
      return null;
    }

    async _connectSolana({ silent }) {
      const bridge = this._bridge();
      if (bridge && typeof bridge.connectSolana === 'function') {
        const out = await bridge.connectSolana({ silent: !!silent });
        const address = extractAddress(out?.address || out?.publicKey || out);
        if (!address) throw new Error('NO_SOLANA_PUBKEY');
        this.solanaAddress = address;
        this._bindSolanaProvider(out?.wallet || out?.provider || null);
        return { chain: CHAIN_SOLANA, address };
      }
      throw new Error('NO_SOLANA_WALLET');
    }

    async _disconnectSolana() {
      const bridge = this._bridge();
      if (bridge && typeof bridge.disconnectSolana === 'function') {
        await bridge.disconnectSolana();
      }
      if (this.solanaUnsub) {
        this.solanaUnsub();
        this.solanaUnsub = null;
      }
      this.solanaProvider = null;
      this.solanaAddress = null;
    }

    async _signSolanaMessage(message) {
      const msgBytes = new TextEncoder().encode(String(message || ''));
      const bridge = this._bridge();

      if (bridge && typeof bridge.signSolanaMessage === 'function') {
        const out = await bridge.signSolanaMessage({ message: String(message || ''), bytes: msgBytes });
        const sig = normalizeSignatureBytes(out?.signature || out);
        if (!sig) throw new Error('SIGNATURE_FORMAT');
        return sig;
      }
      throw new Error('NO_SOLANA_SIGN');
    }

    async _getEvmProvider() {
      const provider = this.getProvider({ chain: CHAIN_EVM });
      if (!provider || typeof provider.request !== 'function') throw new Error('NO_EVM_WALLET');
      return provider;
    }

    async _connectEvm() {
      const bridge = this._bridge();
      if (bridge && typeof bridge.connectEvm === 'function') {
        const out = await bridge.connectEvm();
        const address = extractAddress(out?.address || out?.account || out?.signer || out);
        if (!address) throw new Error('NO_EVM_ACCOUNT');
        this.evmAddress = address;
        if (out?.provider) this.evmProvider = out.provider;
        return { chain: CHAIN_EVM, address };
      }
      throw new Error('NO_EVM_WALLET');
    }

    async _disconnectEvm() {
      const bridge = this._bridge();
      if (bridge && typeof bridge.disconnectEvm === 'function') {
        await bridge.disconnectEvm();
      }
      this.evmAddress = null;
      this.evmProvider = null;
    }

    async _signEvmPersonalMessage(message, address) {
      const bridge = this._bridge();
      if (bridge && typeof bridge.signEvmMessage === 'function') {
        const out = await bridge.signEvmMessage({ message: String(message || ''), address: address || this.evmAddress });
        const sig = typeof out?.signature === 'string' ? out.signature : typeof out === 'string' ? out : null;
        if (!sig) throw new Error('SIGNATURE_FORMAT');
        return sig;
      }

      const provider = await this._getEvmProvider();
      let signer = address || this.evmAddress;
      if (!signer) {
        const conn = await this._connectEvm();
        signer = conn.address;
      }
      const sig = await provider.request({
        method: 'personal_sign',
        params: [String(message || ''), signer]
      });
      if (typeof sig !== 'string' || !sig) throw new Error('SIGNATURE_FORMAT');
      return sig;
    }
  }

  function initWalletClient() {
    if (!window.__AGENT_TOWN_WALLET_CLIENT__) {
      window.__AGENT_TOWN_WALLET_CLIENT__ = new AgentTownWalletClient();
    }
    return window.__AGENT_TOWN_WALLET_CLIENT__;
  }

  window.initWalletClient = initWalletClient;
})();
