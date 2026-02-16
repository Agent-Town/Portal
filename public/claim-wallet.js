(function () {
  function api(path, opts = {}) {
    return fetch(path, {
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts
    }).then(async (res) => {
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const err = (json && json.error) || `HTTP_${res.status}`;
        throw new Error(err);
      }
      return json;
    });
  }

  function el(id) {
    return document.getElementById(id);
  }

  function bytesToHex(bytes) {
    if (!bytes || !bytes.length) return '0x';
    let out = '0x';
    for (let i = 0; i < bytes.length; i += 1) {
      out += bytes[i].toString(16).padStart(2, '0');
    }
    return out;
  }

  function bytesToBase64(bytes) {
    if (!bytes || !bytes.length) return '';
    let out = '';
    for (let i = 0; i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]);
    return btoa(out);
  }

  function inferClaimChain(agentId) {
    const raw = typeof agentId === 'string' ? agentId.trim() : '';
    if (!raw) return null;
    if (/^solana:/i.test(raw)) return 'solana';
    if (/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(raw)) return 'solana';
    return 'evm';
  }

  function setWalletStatus(message) {
    const status = el('walletStatus');
    if (status) status.textContent = message;
  }

  function setError(message) {
    const out = el('claimError');
    if (out) out.textContent = message ? String(message) : '';
  }

  function setConnectButtonLabel(claimChain) {
    const btn = el('connectWalletBtn');
    if (!btn) return;
    if (claimChain === 'solana') {
      btn.textContent = 'Connect Solana wallet';
      return;
    }
    btn.textContent = 'Connect EVM wallet';
  }

  let connectedAddress = '';
  let connectedChain = null;
  let claimContext = {
    inputAgentId: '',
    canonicalAgentId: '',
    claimChain: null,
    nonce: null,
    message: ''
  };

  async function connectWallet() {
    try {
      setError('');
      const chain = claimContext.claimChain || inferClaimChain(el('erc8004AgentId')?.value || '') || 'evm';

      if (chain === 'solana') {
        const provider = window.solana;
        if (!provider || typeof provider.connect !== 'function') {
          throw new Error('No Solana wallet detected (Phantom or compatible).');
        }
        const connected = await provider.connect();
        const addr = (connected && connected.publicKey && typeof connected.publicKey.toString === 'function'
          ? connected.publicKey.toString()
          : provider.publicKey && typeof provider.publicKey.toString === 'function'
            ? provider.publicKey.toString()
            : '');
        if (!addr) throw new Error('No Solana account returned.');
        connectedAddress = String(addr).trim();
        connectedChain = 'solana';
      } else {
        if (!window.ethereum || typeof window.ethereum.request !== 'function') {
          throw new Error('No EVM wallet detected (MetaMask or compatible).');
        }
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const addr = Array.isArray(accounts) && typeof accounts[0] === 'string'
          ? accounts[0].trim()
          : '';
        if (!addr) throw new Error('No EVM account returned.');
        connectedAddress = addr;
        connectedChain = 'evm';
      }

      setWalletStatus(`Connected (${connectedChain}): ${connectedAddress}`);
    } catch (e) {
      setError(e.message || String(e));
      setWalletStatus('No wallet connected.');
      connectedAddress = '';
      connectedChain = null;
    }
  }

  async function getNonce() {
    const agentId = el('erc8004AgentId')?.value.trim();
    const out = el('erc8004Out');
    try {
      setError('');
      if (!agentId) throw new Error('Please enter your agent ID first.');
      const j = await api(`/api/claim/erc8004/nonce?agentId=${encodeURIComponent(agentId)}`);
      claimContext = {
        inputAgentId: agentId,
        canonicalAgentId: typeof j.agentId === 'string' && j.agentId.trim() ? j.agentId.trim() : agentId,
        claimChain: j.claimChain || inferClaimChain(agentId) || 'evm',
        nonce: j.nonce || null,
        message: typeof j.message === 'string' && j.message ? j.message : ''
      };
      setConnectButtonLabel(claimContext.claimChain);

      if (connectedChain && connectedChain !== claimContext.claimChain) {
        connectedAddress = '';
        connectedChain = null;
        setWalletStatus('Wallet type changed for this claim. Reconnect the correct wallet.');
      }

      if (out) out.textContent = JSON.stringify(j, null, 2);
    } catch (e) {
      if (out) out.textContent = String(e.message || e);
      setError(String(e.message || e));
      claimContext.nonce = null;
      claimContext.message = '';
    }
  }

  async function signAndVerify() {
    const out = el('erc8004VerifyOut');
    try {
      setError('');
      if (!claimContext.inputAgentId) throw new Error('Please enter your agent ID first.');
      if (!claimContext.nonce) throw new Error('Request a nonce first.');
      if (!claimContext.message) throw new Error('Claim message missing. Request a nonce again.');
      if (!connectedAddress || !connectedChain) throw new Error('Connect your wallet first.');
      if (connectedChain !== claimContext.claimChain) {
        throw new Error(`Connected wallet is ${connectedChain}; claim requires ${claimContext.claimChain}.`);
      }

      let signature = '';
      if (claimContext.claimChain === 'solana') {
        const provider = window.solana;
        if (!provider || typeof provider.signMessage !== 'function') {
          throw new Error('No Solana wallet available for signing.');
        }
        const msgBytes = new TextEncoder().encode(claimContext.message);
        const outSig = await provider.signMessage(msgBytes, 'utf8');
        const sig = outSig && outSig.signature ? Uint8Array.from(outSig.signature) : null;
        if (!sig || !sig.length) throw new Error('No signature returned.');
        signature = bytesToBase64(sig);
      } else {
        if (!window.ethereum || typeof window.ethereum.request !== 'function') {
          throw new Error('No EVM wallet available for signing.');
        }
        const hexMessage = bytesToHex(new TextEncoder().encode(claimContext.message));
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [hexMessage, connectedAddress]
        });
      }

      if (typeof signature !== 'string' || !signature.trim()) throw new Error('No signature returned.');

      const j = await api('/api/claim/erc8004/verify', {
        method: 'POST',
        body: JSON.stringify({
          agentId: claimContext.canonicalAgentId,
          nonce: claimContext.nonce,
          signature,
          address: connectedAddress,
          coop: false
        })
      });
      if (out) out.textContent = JSON.stringify(j, null, 2);
      if (j.nextUrl) window.location.href = j.nextUrl;
    } catch (e) {
      if (out) out.textContent = String(e.message || e);
      setError(String(e.message || e));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setConnectButtonLabel('evm');
    const connectBtn = el('connectWalletBtn');
    const nonceBtn = el('erc8004GetNonce');
    const verifyBtn = el('erc8004Verify');
    if (connectBtn) connectBtn.addEventListener('click', connectWallet);
    if (nonceBtn) nonceBtn.addEventListener('click', getNonce);
    if (verifyBtn) verifyBtn.addEventListener('click', signAndVerify);
  });
})();
