/* eslint-disable no-console */

const TEAM_CODE_HINT_STORAGE_KEY = 'agentTown:teamCodeHint';
const WALLET_IDENTITY_HINT_STORAGE_KEY = 'agentTown:walletIdentityHint';
const WALLET_RECOVERY_KEY_STORAGE_KEY = 'agentTown:walletRecoveryKey';
const WALLET_STORAGE_KEY = 'agentTownWallet';
const HOUSE_ECONOMY_STREAM_ID_STORAGE_KEY = 'agentTown:houseEconomy:streamId';
const WALLET_IDENTITY_EVM_HEADER = 'x-wallet-evm-address';
const WALLET_IDENTITY_SOLANA_HEADER = 'x-wallet-solana-address';
const WALLET_RECOVERY_INTENT_HEADER = 'x-wallet-recovery-intent';

function readTeamCodeHint() {
  try {
    return String(localStorage.getItem(TEAM_CODE_HINT_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

function saveTeamCodeHint(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (!/^TEAM-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(raw)) return;
  try {
    localStorage.setItem(TEAM_CODE_HINT_STORAGE_KEY, raw);
  } catch {
    // ignore storage errors
  }
}

function normalizeEvmAddress(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  return /^0x[a-fA-F0-9]{40}$/.test(raw) ? raw.toLowerCase() : '';
}

function normalizeSolanaAddress(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  return /^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(raw) ? raw : '';
}

function readWalletIdentityHint() {
  try {
    const raw = localStorage.getItem(WALLET_IDENTITY_HINT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const cacheRaw = localStorage.getItem(WALLET_STORAGE_KEY);
    const cached = cacheRaw ? JSON.parse(cacheRaw) : {};
    return {
      evm: normalizeEvmAddress(parsed?.evm || parsed?.evmAddress || ''),
      solana: normalizeSolanaAddress(parsed?.solana || parsed?.solanaAddress || cached?.address || '')
    };
  } catch {
    return { evm: '', solana: '' };
  }
}

function readWalletRecoveryKey() {
  try {
    const raw = String(localStorage.getItem(WALLET_RECOVERY_KEY_STORAGE_KEY) || '').trim().toLowerCase();
    return /^wrk_[a-f0-9]{64}$/.test(raw) ? raw : '';
  } catch {
    return '';
  }
}

function saveWalletRecoveryKey(value) {
  const key = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!/^wrk_[a-f0-9]{64}$/.test(key)) return;
  try {
    localStorage.setItem(WALLET_RECOVERY_KEY_STORAGE_KEY, key);
  } catch {
    // ignore storage errors
  }
}

function collectWalletIdentitiesFromClient() {
  const out = [];
  const seen = new Set();
  const add = (chain, address) => {
    const normalizedChain = chain === 'evm' ? 'evm' : chain === 'solana' ? 'solana' : '';
    if (!normalizedChain) return;
    const normalizedAddress = normalizedChain === 'evm'
      ? normalizeEvmAddress(address)
      : normalizeSolanaAddress(address);
    if (!normalizedAddress) return;
    const key = `${normalizedChain}:${normalizedAddress}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ chain: normalizedChain, address: normalizedAddress });
  };

  const walletIdentityHint = readWalletIdentityHint();
  if (walletIdentityHint.solana) add('solana', walletIdentityHint.solana);
  if (walletIdentityHint.evm) add('evm', walletIdentityHint.evm);
  if (typeof walletAddr === 'string' && walletAddr) add('solana', walletAddr);

  try {
    const cacheRaw = localStorage.getItem(WALLET_STORAGE_KEY);
    const cached = cacheRaw ? JSON.parse(cacheRaw) : null;
    if (cached && typeof cached.address === 'string') add('solana', cached.address);
  } catch {
    // ignore malformed cache
  }

  if (walletClient && typeof walletClient.getAddress === 'function') {
    try {
      add('solana', walletClient.getAddress({ chain: 'solana' }));
    } catch {
      // ignore unavailable wallet state
    }
    try {
      add('evm', walletClient.getAddress({ chain: 'evm' }));
    } catch {
      // ignore unavailable wallet state
    }
  }

  return out;
}

async function api(url, opts = {}) {
  const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
  const walletIdentities = collectWalletIdentitiesFromClient();
  const walletRecoveryKey = readWalletRecoveryKey();
  if (
    typeof walletAddr === 'string'
    && walletAddr
    && headers[WALLET_IDENTITY_SOLANA_HEADER] === undefined
  ) {
    headers[WALLET_IDENTITY_SOLANA_HEADER] = walletAddr;
  }
  for (const { chain, address } of walletIdentities) {
    if (chain === 'evm' && headers[WALLET_IDENTITY_EVM_HEADER] === undefined) {
      headers[WALLET_IDENTITY_EVM_HEADER] = address;
      continue;
    }
    if (chain === 'solana' && headers[WALLET_IDENTITY_SOLANA_HEADER] === undefined) {
      headers[WALLET_IDENTITY_SOLANA_HEADER] = address;
    }
  }
  if (
    walletRecoveryKey
    && headers['x-wallet-recovery-key'] === undefined
    && headers['X-Wallet-Recovery-Key'] === undefined
  ) {
    headers['x-wallet-recovery-key'] = walletRecoveryKey;
  }
  if (
    walletRecoveryKey
    && headers[WALLET_RECOVERY_INTENT_HEADER] === undefined
    && headers['X-Wallet-Recovery-Intent'] === undefined
  ) {
    headers[WALLET_RECOVERY_INTENT_HEADER] = '1';
  }
  const teamCodeHint = readTeamCodeHint();
  if (
    teamCodeHint
    && headers['x-team-code-hint'] === undefined
    && headers['X-Team-Code-Hint'] === undefined
  ) {
    headers['x-team-code-hint'] = teamCodeHint;
  }
  const res = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    ...opts,
    headers
  });
  const data = await res.json().catch(() => ({}));
  if (typeof data?.teamCode === 'string') {
    saveTeamCodeHint(data.teamCode);
  }
  if (typeof data?.walletRecoveryKey === 'string') {
    saveWalletRecoveryKey(data.walletRecoveryKey);
  }
  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP_${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function el(id) {
  return document.getElementById(id);
}

function setStatus(msg) {
  el('status').textContent = msg || '';
}

const ERROR_MESSAGES = {
  AG0_SDK_NOT_BUNDLED: 'ERC-8004 minting is disabled until the local Agent0 SDK bundle is built.',
  AG0_SDK_LOAD_FAILED: 'Unable to load the local Agent0 SDK bundle. Run: npm run build:agent0-sdk'
};

function setError(msg) {
  const node = el('error');
  if (!node) return;
  if (!msg) {
    node.textContent = '';
    return;
  }
  node.textContent = ERROR_MESSAGES[msg] || msg;
}

function readHouseEconomyStreamId() {
  try {
    return String(localStorage.getItem(HOUSE_ECONOMY_STREAM_ID_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

function saveHouseEconomyStreamId(value) {
  const streamId = String(value || '').trim();
  try {
    if (!streamId) {
      localStorage.removeItem(HOUSE_ECONOMY_STREAM_ID_STORAGE_KEY);
      return;
    }
    localStorage.setItem(HOUSE_ECONOMY_STREAM_ID_STORAGE_KEY, streamId);
  } catch {
    // ignore storage errors
  }
}

function setHouseEconomyStatus(msg) {
  const node = el('houseEconomyStatus');
  if (node) node.textContent = msg || '';
}

function setHouseEconomyError(msg) {
  const node = el('houseEconomyError');
  if (node) node.textContent = msg || '';
}

function setHouseEconomyExpandState(data = null) {
  const btn = el('houseEconomyExpandBtn');
  if (!btn) return;
  const footprint = data?.footprint || null;
  const nextCost = Number(footprint?.nextExpansionCostOil || 0);
  const balance = Number(data?.oilBalance?.balance || 0);
  if (!footprint?.canExpand || nextCost <= 0) {
    btn.textContent = 'Footprint maxed';
    btn.disabled = true;
    return;
  }
  btn.textContent = `Expand footprint (${nextCost} OIL)`;
  btn.disabled = !(currentHouseId() && KauthKey && walletAddr && balance >= nextCost);
}

function renderHouseEconomySummary(data = null) {
  const node = el('houseEconomySummary');
  if (!node) return;
  const footprint = data?.footprint || null;
  const verification = data?.verification || null;
  const oilBalance = data?.oilBalance && typeof data.oilBalance.balance === 'number'
    ? Number(data.oilBalance.balance || 0)
    : null;
  const walletSubject = String(data?.walletSubject || walletAddr || '').trim();
  const lines = [
    `House: ${data?.houseId || verification?.houseId || currentHouseId() || 'pending'}`,
    `Wallet: ${verification?.address || walletSubject || 'pending'}`,
    `OIL balance: ${oilBalance == null ? 'pending' : oilBalance}`,
  ];
  if (footprint) {
    lines.push(`Footprint: ${Number(footprint.tiles || 1)}/${Number(footprint.maxTiles || 1)} tiles`);
    if (footprint.canExpand && Number(footprint.nextExpansionCostOil || 0) > 0) {
      lines.push(`Next expansion: ${Number(footprint.nextExpansionCostOil || 0)} OIL`);
    } else {
      lines.push('Footprint is at the current maximum size.');
    }
  } else {
    lines.push('Footprint: unlock this house to inspect the current size.');
  }
  if (verification) {
    lines.push(`Verified stake: ${verification.streamId || 'pending'} (${verification.tokenSymbol || '$AGENTTOWN'})`);
    lines.push(`Verified amount: ${String(verification.verifiedAmountAtomic || '0')} atomic`);
  } else {
    lines.push('No verified Streamflow lock is bound to this house wallet yet.');
  }
  node.textContent = lines.join('\n');
}

function describeHouseEconomyError(error) {
  const code = String(error?.data?.error?.code || error?.message || '').trim();
  if (code === 'WALLET_SUBJECT_REQUIRED' || code === 'SOLANA_WALLET_REQUIRED') {
    return 'Connect the staked house wallet to inspect OIL.';
  }
  if (code === 'HOUSE_REQUIRED') {
    return 'Attach this wallet session to a house before verifying a Streamflow lock.';
  }
  if (code === 'HOUSE_AUTH_NOT_READY' || code === 'HOUSE_AUTH_REQUIRED') {
    return 'Unlock this house before spending OIL.';
  }
  if (code === 'OIL_BALANCE_TOO_LOW') {
    const required = Number(error?.data?.requiredOil || 0);
    const balance = Number(error?.data?.balance || 0);
    if (required > 0 || balance >= 0) {
      return `Not enough OIL for the next footprint expansion (${balance}/${required}).`;
    }
    return 'Not enough OIL for the next footprint expansion.';
  }
  if (code === 'HOUSE_FOOTPRINT_MAXED') {
    return 'This house is already at the current maximum footprint.';
  }
  if (code === 'STREAMFLOW_STAKE_BOUND_TO_OTHER_HOUSE') {
    return 'The connected staked wallet is verified for a different house.';
  }
  return String(error?.data?.error?.message || code || 'Unable to load house economy state.');
}

async function refreshHouseEconomyPanel({ preserveStatus = false } = {}) {
  setHouseEconomyError('');
  const houseId = currentHouseId();
  if (!houseId) {
    renderHouseEconomySummary({
      houseId: null,
      walletSubject: walletAddr || '',
      footprint: null,
      oilBalance: null,
      verification: null,
    });
    setHouseEconomyExpandState(null);
    if (!preserveStatus) setHouseEconomyStatus('Open a house to inspect the bound stake, OIL balance, and footprint.');
    return;
  }
  if (!KauthKey) {
    try {
      const payload = walletAddr ? await api('/api/oil/balance') : {};
      const data = payload?.data || payload || {};
      renderHouseEconomySummary({
        houseId,
        walletSubject: data?.walletSubject || walletAddr || '',
        verification: data?.verification || null,
        oilBalance: data?.oilBalance || null,
        footprint: null,
      });
      setHouseEconomyExpandState(null);
      if (!preserveStatus) {
        setHouseEconomyStatus(
          data?.verification
            ? 'Verified lock detected. Unlock this house to spend OIL on footprint growth.'
            : 'Unlock this house to inspect footprint details. Verify the staked wallet in Centaur Poker to start OIL accrual.'
        );
      }
    } catch (error) {
      renderHouseEconomySummary({
        houseId,
        walletSubject: walletAddr || '',
        footprint: null,
        oilBalance: null,
        verification: null,
      });
      setHouseEconomyExpandState(null);
      if (!preserveStatus) setHouseEconomyStatus('Unlock this house to inspect the bound stake, OIL balance, and footprint.');
      setHouseEconomyError(describeHouseEconomyError(error));
    }
    return;
  }
  try {
    const payload = await houseApi(houseId, `/api/house/${encodeURIComponent(houseId)}/economy`);
    const data = payload?.economy || payload?.data || payload || {};
    if (data?.verification?.streamId) {
      saveHouseEconomyStreamId(data.verification.streamId);
    }
    renderHouseEconomySummary(data);
    setHouseEconomyExpandState(data);
    if (!preserveStatus) {
      setHouseEconomyStatus(
        data?.verification
          ? 'Verified Streamflow lock is active for this house wallet. OIL can fund Centaur Poker or footprint growth.'
          : 'No verified lock yet. Use Centaur Poker to verify the staked wallet and start OIL accrual.'
      );
    }
  } catch (error) {
    renderHouseEconomySummary(null);
    setHouseEconomyExpandState(null);
    if (!preserveStatus) setHouseEconomyStatus('');
    setHouseEconomyError(describeHouseEconomyError(error));
  }
}

function setPublicMediaError(msg) {
  const node = el('publicUploadError');
  if (node) node.textContent = msg || '';
}

function setPublicMediaStatus(msg) {
  const node = el('publicUploadStatus');
  if (!node) return;
  node.textContent = msg || 'Saved';
  node.style.display = msg ? 'inline-flex' : 'none';
}

function setPublicMediaEnabled(enabled) {
  const prompt = el('publicPrompt');
  const file = el('publicImage');
  const upload = el('publicUploadBtn');
  const clear = el('publicClearBtn');
  if (prompt) prompt.disabled = !enabled;
  if (file) file.disabled = !enabled;
  if (upload) upload.disabled = !enabled || !currentPublicImageUrl();
  if (clear) clear.disabled = !enabled || !(publicMedia && publicMedia.imageUrl);
  if (!enabled) {
    setPublicMediaStatus('');
    setPublicMediaError('');
  }
}

function setAgentStateStatus(msg) {
  const node = el('agentStateStatus');
  if (node) node.textContent = msg || '';
}

function setAgentStateError(msg) {
  const node = el('agentStateError');
  if (node) node.textContent = msg || '';
}

function setMindConfigStatus(msg) {
  const node = el('llmLine');
  if (!node) return;
  node.textContent = msg || '';
  node.style.color = 'var(--muted)';
}

function setMindConfigError(msg) {
  const node = el('llmLine');
  if (!node) return;
  node.textContent = msg || '';
  node.style.color = msg ? 'var(--bad)' : 'var(--muted)';
}

function renderPublicMediaPreview({ imageUrl, prompt, pending }) {
  const preview = el('publicPreview');
  const img = el('publicPreviewImg');
  const label = el('publicPreviewLabel');
  const text = el('publicPreviewPrompt');
  if (!preview || !img || !label || !text) return;
  if (!imageUrl) {
    preview.classList.add('is-hidden');
    img.src = '';
    text.textContent = '';
    return;
  }
  preview.classList.remove('is-hidden');
  label.textContent = pending ? 'Preview (not saved)' : 'Current public image';
  img.src = imageUrl;
  img.alt = prompt ? `Public image: ${prompt}` : 'Public house image';
  img.style.display = 'block';
  text.textContent = prompt || '';
}

const SHARE_CACHE_KEY = 'agentTownShareCache';
const HOUSE_AUTH_CACHE_PREFIX = 'agentTownHouseAuth:';
const SHARE_COPY_LABEL = 'Copy share link';
const AGENT_COPY_LABEL = 'Copy agent message';
const TOKEN_MINT = 'CZRsbB6BrHsAmGKeoxyfwzCyhttXvhfEukXCWnseBAGS';
const PATH_STORAGE_KEY = 'agentTownStartRole';
const LEGACY_PATH_STORAGE_KEY = 'agentTownPathMode';
const TOKEN_ERROR_KEY = 'agentTownTokenError';
const SIGNUP_COMPLETE_AT_KEY = 'agentTownSignupCompleteAt';
const PUBLIC_MEDIA_MAX_BYTES = 1024 * 1024;
const PUBLIC_MEDIA_PROMPT_MAX = 280;
const PUBLIC_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const AUTO_LOCK_MS = null;
const ERC8004_IDENTITY_CACHE_PREFIX = 'agentTownErc8004Identity:';
const ERC8004_DEFAULT_IDENTITY_REGISTRY = '0x8004a818bfb912233c491871b3d84c89a494bd9e';
const ERC8004_IDENTITY_REGISTRY_BY_CHAIN = Object.freeze({
  1: ERC8004_DEFAULT_IDENTITY_REGISTRY,
  11155111: ERC8004_DEFAULT_IDENTITY_REGISTRY
});
const AGENT0_SDK_ESM_URL = '/vendor/agent0-sdk.mjs';
const OPENCLAW_DB_NAME = 'openclaw-lite';
const OPENCLAW_DB_VERSION = 1;
const AGENT_STATE_KIND = 'openclaw-lite-state';
const AGENT_STATE_SCHEMA = 'openclaw-lite-state@1';
const AGENT_STATE_OPENCLAW_EXPORT_KIND = 'openclaw-lite-export';
const AGENT_STATE_SEALED_KIND = 'openclaw-lite-state-sealed';
const AGENT_STATE_SEALED_SCHEMA = 'openclaw-lite-state-sealed@1';
const AGENT_STATE_ZIP_KIND = 'openclaw-lite-state-zip';
const AGENT_STATE_ZIP_SCHEMA = 'openclaw-lite-state-zip@1';
const AGENT_STATE_MAX_BYTES = 8 * 1024 * 1024;
const AGENT_STATE_MAX_META_RECORDS = 2048;
const AGENT_STATE_MAX_VFS_RECORDS = 20000;
const AGENT_STATE_MAX_CHECKPOINT_RECORDS = 5000;
const AGENT0_SDK_BUILD_HINT = 'Run: npm run build:agent0-sdk';
const MIND_DEFAULT_PROVIDER = 'openai';
const MIND_DEFAULT_MODEL = 'gpt-4o-mini';
const MIND_AUTH_API_KEY = 'api-key';
const MIND_AUTH_OAUTH = 'oauth-json';
const MIND_MODEL_OPTIONS_BY_PROVIDER = Object.freeze({
  openai: Object.freeze(['gpt-5.1-codex', 'gpt-4o', 'gpt-4o-mini']),
  ollama: Object.freeze(['gpt-oss:20b', 'gpt-oss:120b', 'llama3.3', 'llama3.2:latest', 'qwen2.5:7b']),
  'openai-codex': Object.freeze(['gpt-5.3-codex', 'gpt-5-codex']),
  anthropic: Object.freeze(['claude-opus-4-6', 'claude-3-5-sonnet-20240620', 'claude-3-5-haiku-20241022']),
  openrouter: Object.freeze(['anthropic/claude-sonnet-4-5']),
  litellm: Object.freeze(['claude-opus-4-6']),
  'amazon-bedrock': Object.freeze(['us.anthropic.claude-opus-4-6-v1:0']),
  'vercel-ai-gateway': Object.freeze(['anthropic/claude-opus-4.6']),
  moonshot: Object.freeze(['kimi-k2.5', 'kimi-k2-0905-preview', 'kimi-k2-turbo-preview', 'kimi-k2-thinking', 'kimi-k2-thinking-turbo']),
  'kimi-coding': Object.freeze(['k2p5']),
  minimax: Object.freeze(['MiniMax-M2.1', 'MiniMax-M2.1-lightning']),
  opencode: Object.freeze(['claude-opus-4-6']),
  zai: Object.freeze(['glm-5']),
  glm: Object.freeze(['glm-5']),
  synthetic: Object.freeze(['hf:MiniMaxAI/MiniMax-M2.1', 'hf:moonshotai/Kimi-K2-Thinking', 'hf:zai-org/GLM-4.7']),
  qianfan: Object.freeze(['model-id']),
  'qwen-portal': Object.freeze(['coder-model', 'vision-model']),
  qwen: Object.freeze(['coder-model', 'vision-model']),
  together: Object.freeze(['moonshotai/Kimi-K2.5']),
  'cloudflare-ai-gateway': Object.freeze(['claude-sonnet-4-5']),
  xiaomi: Object.freeze(['mimo-v2-flash']),
  venice: Object.freeze(['llama-3.3-70b', 'claude-opus-45', 'venice-uncensored', 'qwen3-vl-235b-a22b', 'qwen3-coder-480b-a35b-instruct']),
  huggingface: Object.freeze(['Qwen/Qwen3-235B-A22B-Instruct-2507', 'meta-llama/Llama-3.3-70B-Instruct', 'openai/gpt-oss-120b']),
  vllm: Object.freeze(['your-model-id']),
  nvidia: Object.freeze(['model-id']),
  google: Object.freeze(['gemini-1.5-flash', 'gemini-1.5-pro']),
  groq: Object.freeze(['llama3-8b-8192', 'llama3-70b-8192']),
  'test-local': Object.freeze(['deterministic'])
});
const MIND_PROVIDER_ALIASES = Object.freeze({
  glm: 'zai',
  qwen: 'qwen-portal'
});
const MIND_OPENAI_CODEX_OAUTH_PROVIDERS = new Set(['openai', 'openai-codex']);
const MIND_OPENAI_CODEX_OAUTH_MESSAGE_TYPE = 'agenttown:openai-codex-oauth-callback';
let mindOpenAiCodexOAuthAttempt = null;
let mindOpenAiCodexOAuthPollTimer = null;
let mindOpenAiCodexOAuthExchangeInFlight = false;
let mindOpenAiCodexOAuthMessageListenerBound = false;

function isErc8004AdvancedEnabled() {
  const params = new URLSearchParams(window.location.search);
  return params.get('erc8004') === '1' || params.get('advanced') === '1';
}

function erc8004IdentityStorageKey(houseId) {
  return `${ERC8004_IDENTITY_CACHE_PREFIX}${houseId}`;
}

function normalizeEvmAddressClient(value) {
  if (typeof value !== 'string') return null;
  const clean = value.trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(clean)) return null;
  return clean;
}

function parseEip155AgentRegistry(value) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  const match = clean.match(/^eip155:(\d+):(0x[a-fA-F0-9]{40})$/);
  if (!match) return null;
  const chainId = Number(match[1]);
  const identityRegistry = normalizeEvmAddressClient(match[2]);
  if (!Number.isInteger(chainId) || chainId < 1 || !identityRegistry) return null;
  return { chainId, identityRegistry };
}

function resolveErc8004IdentityRegistry(chainId, ...candidates) {
  for (const candidate of candidates) {
    const normalized = normalizeEvmAddressClient(candidate);
    if (normalized) return normalized;
  }
  const fallback = ERC8004_IDENTITY_REGISTRY_BY_CHAIN[chainId];
  const normalizedFallback = normalizeEvmAddressClient(fallback);
  return normalizedFallback || null;
}

function parseMintedAgentIdentity(rawAgentId, fallbackChainId) {
  if (typeof rawAgentId === 'string' && rawAgentId.trim()) {
    const parseNonNegativeIntegerString = (value) => {
      const text = String(value || '').trim();
      if (!/^\d+$/.test(text)) return null;
      const parsed = Number.parseInt(text, 10);
      return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
    };
    const parsed = parseAgent0Erc8004Id(rawAgentId.trim());
    if (parsed) {
      const tokenId = parseNonNegativeIntegerString(parsed.id);
      const chainId = Number.isInteger(parsed.chainId) && parsed.chainId > 0 ? parsed.chainId : fallbackChainId;
      if (Number.isInteger(tokenId) && tokenId >= 0 && Number.isInteger(chainId) && chainId > 0) {
        return {
          chainId,
          agentId: tokenId,
          erc8004Id: `${chainId}:${tokenId}`
        };
      }
    }
    const numericOnly = parseNonNegativeIntegerString(rawAgentId);
    if (Number.isInteger(numericOnly) && numericOnly >= 0 && Number.isInteger(fallbackChainId) && fallbackChainId > 0) {
      return {
        chainId: fallbackChainId,
        agentId: numericOnly,
        erc8004Id: `${fallbackChainId}:${numericOnly}`
      };
    }
    return null;
  }
  if (Number.isInteger(rawAgentId) && rawAgentId >= 0 && Number.isInteger(fallbackChainId) && fallbackChainId > 0) {
    return {
      chainId: fallbackChainId,
      agentId: rawAgentId,
      erc8004Id: `${fallbackChainId}:${rawAgentId}`
    };
  }
  return null;
}

function loadStoredErc8004Identity(houseId) {
  if (!houseId) return null;
  try {
    const raw = localStorage.getItem(erc8004IdentityStorageKey(houseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const agentId = typeof parsed.agentId === 'string' ? parsed.agentId.trim() : '';
    const regId = typeof parsed.regId === 'string' ? parsed.regId.trim() : '';
    if (!agentId) return null;
    return {
      type: parsed.type === 'erc8004_identity' ? parsed.type : 'erc8004_identity',
      regId: regId || null,
      agentId,
      createdAtMs: Number(parsed.createdAtMs || Date.now())
    };
  } catch {
    return null;
  }
}

function saveStoredErc8004Identity(houseId, value) {
  if (!houseId || !value) return;
  try {
    localStorage.setItem(
      erc8004IdentityStorageKey(houseId),
      JSON.stringify({
        type: 'erc8004_identity',
        regId: value.regId || null,
        agentId: value.agentId || null,
        createdAtMs: Number(value.createdAtMs || Date.now())
      })
    );
  } catch {
    // ignore storage errors
  }
}

function buildErc8004RegistrationDraftPayload({ houseId }) {
  const origin = window.location.origin;
  const houseUrl = `${origin}/house?house=${encodeURIComponent(houseId)}`;
  return {
    context: { kind: 'house', houseId },
    entityType: 'house',
    name: `Agent Town House ${houseId.slice(0, 10)}`,
    description: `E2EE shared house in Agent Town. houseId=${houseId}.`,
    image: `${origin}/brand-kit/default_user_avatar.png`,
    services: [
      { name: 'web', endpoint: houseUrl }
    ]
  };
}

function restoreStoredErc8004IdentityForHouse(houseId) {
  const stored = loadStoredErc8004Identity(houseId);
  if (!stored || !stored.agentId) return;
  humanErc8004Id = stored.agentId;
  humanErc8004RegId = stored.regId || null;
  const anchorInput = el('anchorErc8004Id');
  if (anchorInput && !anchorInput.value) anchorInput.value = stored.agentId;
  const status = el('erc8004MintStatus');
  if (status) status.textContent = `Minted identity: ${stored.agentId}`;
}

async function loadAgent0Sdk(statusNode) {
  if (window.__AG0_SDK_MOCK) return window.__AG0_SDK_MOCK;

  try {
    const localMod = await import(AGENT0_SDK_ESM_URL);
    if (!localMod || localMod.AG0_SDK_BUNDLED === false) {
      throw new Error('AG0_SDK_NOT_BUNDLED');
    }
    return localMod;
  } catch {
    if (statusNode) statusNode.textContent = AGENT0_SDK_BUILD_HINT;
    throw new Error('AG0_SDK_NOT_BUNDLED');
  }
}

// --- base64 helpers ---
function b64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function unb64(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function unb64Safe(str) {
  try {
    return unb64(str);
  } catch {
    return null;
  }
}

function houseAuthCacheKey(houseId) {
  return `${HOUSE_AUTH_CACHE_PREFIX}${houseId}`;
}

function getHouseAuthMemoryStore() {
  if (!window.__agentTownHouseAuthMemory || typeof window.__agentTownHouseAuthMemory !== 'object') {
    window.__agentTownHouseAuthMemory = Object.create(null);
  }
  return window.__agentTownHouseAuthMemory;
}

function cacheHouseAuthBytes(houseId, keyBytes) {
  if (!houseId || !keyBytes || !keyBytes.length) return;
  try {
    const store = getHouseAuthMemoryStore();
    store[houseAuthCacheKey(houseId)] = b64(keyBytes);
  } catch {
    // ignore storage errors
  }
}

function clearHouseAuthCache(houseId) {
  if (!houseId) return;
  try {
    const store = getHouseAuthMemoryStore();
    delete store[houseAuthCacheKey(houseId)];
  } catch {
    // ignore storage errors
  }
}

function clearAllHouseAuthCache() {
  try {
    const store = getHouseAuthMemoryStore();
    for (const key of Object.keys(store)) {
      if (!key.startsWith(HOUSE_AUTH_CACHE_PREFIX)) continue;
      delete store[key];
    }
  } catch {
    // ignore storage errors
  }
}

let openClawDbPromise = null;
let llmConfigLibraryPromise = null;
let agentStateBusy = false;
let liteGatewayPromise = null;

function setAgentStateControlsEnabled(enabled) {
  const canUse = !!enabled && !agentStateBusy;
  const saveBtn = el('saveAgentStateBtn');
  const restoreBtn = el('restoreAgentStateBtn');
  const downloadBtn = el('downloadAgentStateBtn');
  const uploadBtn = el('uploadAgentStateBtn');
  const uploadInput = el('uploadAgentStateInput');
  const llmProvider = el('llmProviderSelect');
  const llmModel = el('llmModelIdInput');
  const llmAuthMode = el('llmAuthModeSelect');
  const llmOauth = el('llmOauthProfileInput');
  const llmCredential = el('llmKeyInput');
  const llmBaseUrl = el('llmBaseUrlInput');
  const llmThinking = el('llmThinkingInput');
  const llmUseProxy = el('llmUseProxyInput');
  const llmOauthLaunch = el('llmOauthLaunchBtn');
  const llmOauthComplete = el('llmOauthCompleteBtn');
  const llmSave = el('llmSaveBtn');
  const llmClear = el('llmClearBtn');
  if (saveBtn) saveBtn.disabled = !canUse;
  if (restoreBtn) restoreBtn.disabled = !canUse;
  if (downloadBtn) downloadBtn.disabled = !canUse;
  if (uploadBtn) uploadBtn.disabled = !canUse;
  if (uploadInput) uploadInput.disabled = !canUse;
  if (llmProvider) llmProvider.disabled = !canUse;
  if (llmModel) llmModel.disabled = !canUse;
  if (llmAuthMode) llmAuthMode.disabled = !canUse;
  if (llmOauth) llmOauth.disabled = !canUse;
  if (llmCredential) llmCredential.disabled = !canUse;
  if (llmBaseUrl) llmBaseUrl.disabled = !canUse;
  if (llmThinking) llmThinking.disabled = !canUse;
  if (llmUseProxy) llmUseProxy.disabled = !canUse;
  if (llmOauthLaunch) llmOauthLaunch.disabled = !canUse;
  if (llmOauthComplete) llmOauthComplete.disabled = !canUse;
  if (llmSave) llmSave.disabled = !canUse;
  if (llmClear) llmClear.disabled = !canUse;
  if (!enabled && !agentStateBusy) {
    setAgentStateStatus('');
    setAgentStateError('');
    setMindConfigStatus('');
    setMindConfigError('');
  }
}

function setAgentStateBusy(busy) {
  agentStateBusy = !!busy;
  setAgentStateControlsEnabled(unlocked);
}

async function loadLiteLlmLibrary() {
  if (!llmConfigLibraryPromise) {
    llmConfigLibraryPromise = import('/openclaw-lite/llm-config-library.js');
  }
  return llmConfigLibraryPromise;
}

async function loadLiteGateway() {
  if (!liteGatewayPromise) {
    liteGatewayPromise = import('/openclaw-lite/gateway.js')
      .then((mod) => mod?.default || mod)
      .then(async (gatewayOrPromise) => {
        if (gatewayOrPromise && typeof gatewayOrPromise.then === 'function') {
          return await gatewayOrPromise;
        }
        return gatewayOrPromise;
      })
      .catch(() => null);
  }
  return liteGatewayPromise;
}

function defaultProviderApi(provider) {
  const p = String(provider || '').trim();
  if (p === 'openai' || p === 'ollama') return 'openai-completions';
  return '';
}

function defaultProviderBaseUrl(provider) {
  const p = String(provider || '').trim();
  if (p === 'openai') return new URL('/api/llm/openai/v1', window.location.origin).toString();
  if (p === 'ollama') return 'http://127.0.0.1:11434/v1';
  return '';
}

function normalizeThinkingLevel(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return '';
  if (v === 'minimal' || v === 'low' || v === 'medium' || v === 'high' || v === 'xhigh') return v;
  return '';
}

function buildGatewayLlmPayload(config) {
  const provider = String(config?.provider || MIND_DEFAULT_PROVIDER).trim() || MIND_DEFAULT_PROVIDER;
  const model = String(config?.model || MIND_DEFAULT_MODEL).trim() || MIND_DEFAULT_MODEL;
  const modelRef = String(config?.modelRef || `${provider}/${model}`).trim() || `${provider}/${model}`;
  const credential = String(config?.credential || '').trim();
  const overrideApi = String(el('llmApiInput')?.value || '').trim();
  const overrideBaseUrl = String(el('llmBaseUrlInput')?.value || '').trim();
  const useProxy = el('llmUseProxyInput') ? el('llmUseProxyInput').checked !== false : true;
  return {
    type: 'gateway.command.setLlmConfig',
    apiKey: credential,
    api: overrideApi || defaultProviderApi(provider),
    provider,
    modelRef,
    modelId: model,
    baseUrl: overrideBaseUrl || defaultProviderBaseUrl(provider),
    reasoning: normalizeThinkingLevel(el('llmThinkingInput')?.value),
    useProxy
  };
}

async function activateMindConfig(config) {
  const provider = String(config?.provider || '').trim();
  const model = String(config?.model || '').trim();
  const modelRef = String(config?.modelRef || (provider && model ? `${provider}/${model}` : '')).trim();
  const credential = String(config?.credential || '').trim();
  if (!provider || !model || !modelRef || !credential) return;

  const gateway = await loadLiteGateway();
  if (gateway && typeof gateway.send === 'function') {
    gateway.send(buildGatewayLlmPayload({
      provider,
      model,
      modelRef,
      credential
    }));
  }
}

async function deactivateMindConfig() {
  const gateway = await loadLiteGateway();
  if (gateway && typeof gateway.send === 'function') {
    gateway.send({
      type: 'gateway.command.setLlmConfig',
      apiKey: '',
      api: '',
      provider: '',
      modelRef: '',
      modelId: '',
      baseUrl: '',
      reasoning: '',
      useProxy: true
    });
  }
}

function idbReqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IDB_REQUEST_FAILED'));
  });
}

function idbTxDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IDB_TX_FAILED'));
    tx.onabort = () => reject(tx.error || new Error('IDB_TX_ABORTED'));
  });
}

function openOpenClawDb() {
  if (openClawDbPromise) return openClawDbPromise;
  openClawDbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(OPENCLAW_DB_NAME, OPENCLAW_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('checkpoints')) {
        const s = db.createObjectStore('checkpoints', { keyPath: 'checkpointId' });
        s.createIndex('by_house_createdAtMs', ['houseId', 'createdAtMs'], { unique: false });
      }
      if (!db.objectStoreNames.contains('vfs')) {
        db.createObjectStore('vfs', { keyPath: 'path' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IDB_OPEN_FAILED'));
  });
  return openClawDbPromise;
}

async function idbGetAll(storeName) {
  const db = await openOpenClawDb();
  const tx = db.transaction([storeName], 'readonly');
  const req = tx.objectStore(storeName).getAll();
  const rows = await idbReqToPromise(req);
  await idbTxDone(tx);
  return Array.isArray(rows) ? rows : [];
}

async function idbPutMetaRecords(entries) {
  const db = await openOpenClawDb();
  const tx = db.transaction(['meta'], 'readwrite');
  const store = tx.objectStore('meta');
  for (const entry of entries || []) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const key = typeof entry[0] === 'string' ? entry[0].trim() : '';
    if (!key) continue;
    store.put({ key, value: cloneJsonSafe(entry[1]) });
  }
  await idbTxDone(tx);
}

function parseModelRef(modelRef, fallbackProvider = MIND_DEFAULT_PROVIDER, fallbackModelId = MIND_DEFAULT_MODEL) {
  const ref = String(modelRef || '').trim();
  if (!ref) {
    return {
      provider: fallbackProvider,
      modelId: fallbackModelId,
      modelRef: `${fallbackProvider}/${fallbackModelId}`
    };
  }
  const slash = ref.indexOf('/');
  if (slash > 0) {
    const provider = ref.slice(0, slash).trim();
    const modelId = ref.slice(slash + 1).trim();
    if (provider && modelId) {
      return { provider, modelId, modelRef: `${provider}/${modelId}` };
    }
  }
  return {
    provider: fallbackProvider,
    modelId: ref,
    modelRef: `${fallbackProvider}/${ref}`
  };
}

function normalizeMindAuthMode(mode) {
  return String(mode || '').trim() === MIND_AUTH_OAUTH ? MIND_AUTH_OAUTH : MIND_AUTH_API_KEY;
}

function getSupportedMindModels(provider) {
  const raw = String(provider || '').trim();
  const key = MIND_MODEL_OPTIONS_BY_PROVIDER[raw] ? raw : (MIND_PROVIDER_ALIASES[raw] || raw);
  const options = MIND_MODEL_OPTIONS_BY_PROVIDER[key];
  return Array.isArray(options) ? [...options] : [];
}

function replaceSelectOptions(select, values) {
  if (!select || select.tagName !== 'SELECT') return;
  select.innerHTML = '';
  for (const value of values || []) {
    const next = String(value || '').trim();
    if (!next) continue;
    const option = document.createElement('option');
    option.value = next;
    option.textContent = next;
    select.appendChild(option);
  }
}

function ensureSelectOption(select, value, label) {
  if (!select || select.tagName !== 'SELECT') return;
  const next = String(value || '').trim();
  if (!next) return;
  const exists = Array.from(select.options).some((opt) => String(opt.value || '').trim() === next);
  if (exists) return;
  const option = document.createElement('option');
  option.value = next;
  option.textContent = String(label || next);
  option.dataset.injected = 'true';
  select.appendChild(option);
}

function applyMindProviderSelection(preferredProvider) {
  const providerSelect = el('llmProviderSelect');
  const selected = String(preferredProvider || providerSelect?.value || MIND_DEFAULT_PROVIDER).trim() || MIND_DEFAULT_PROVIDER;
  if (!providerSelect) return selected;
  if (providerSelect.tagName === 'SELECT') {
    const providers = Object.keys(MIND_MODEL_OPTIONS_BY_PROVIDER);
    replaceSelectOptions(providerSelect, providers);
    providerSelect.value = providers.includes(selected) ? selected : MIND_DEFAULT_PROVIDER;
    return String(providerSelect.value || MIND_DEFAULT_PROVIDER).trim() || MIND_DEFAULT_PROVIDER;
  }
  providerSelect.value = selected;
  return selected;
}

function applyMindModelSelection(provider, preferredModel) {
  const modelSelect = el('llmModelIdInput');
  const fallbackModel = getDefaultLlmModelForProvider(provider);
  const selected = String(preferredModel || modelSelect?.value || '').trim();
  if (!modelSelect) return selected || fallbackModel;
  if (modelSelect.tagName === 'SELECT') {
    const models = getSupportedMindModels(provider);
    const baseOptions = models.length ? models : [fallbackModel];
    replaceSelectOptions(modelSelect, baseOptions);
    const resolved = baseOptions.includes(selected) ? selected : (baseOptions[0] || fallbackModel);
    modelSelect.value = resolved;
    return String(modelSelect.value || fallbackModel).trim() || fallbackModel;
  }
  if (selected) {
    modelSelect.value = selected;
    return selected;
  }
  modelSelect.value = fallbackModel;
  return fallbackModel;
}

function applyMindProviderModelSelection(provider, model) {
  const selectedProvider = applyMindProviderSelection(provider);
  const selectedModel = applyMindModelSelection(selectedProvider, model);
  return { provider: selectedProvider, model: selectedModel };
}

function updateMindOauthLaunchUi() {
  const launchBtn = el('llmOauthLaunchBtn');
  const completeBtn = el('llmOauthCompleteBtn');
  if (!launchBtn) return;
  const provider = String(el('llmProviderSelect')?.value || MIND_DEFAULT_PROVIDER).trim() || MIND_DEFAULT_PROVIDER;
  const mode = normalizeMindAuthMode(el('llmAuthModeSelect')?.value);
  const supported = MIND_OPENAI_CODEX_OAUTH_PROVIDERS.has(provider.toLowerCase());
  launchBtn.style.display = mode === MIND_AUTH_OAUTH ? 'inline-flex' : 'none';
  launchBtn.disabled = !supported;
  launchBtn.title = supported
    ? 'Start OpenAI PKCE OAuth in a new tab.'
    : 'OAuth launch is available for OpenAI providers only.';
  if (completeBtn) {
    completeBtn.style.display = mode === MIND_AUTH_OAUTH ? 'inline-flex' : 'none';
    completeBtn.disabled = !supported;
    completeBtn.title = supported
      ? 'Complete OAuth using pasted callback URL/code.'
      : 'OAuth completion is available for OpenAI providers only.';
  }
}

function stopMindOpenAiCodexOAuthPoll() {
  if (!mindOpenAiCodexOAuthPollTimer) return;
  clearInterval(mindOpenAiCodexOAuthPollTimer);
  mindOpenAiCodexOAuthPollTimer = null;
}

function bindMindOpenAiCodexOAuthMessageListener() {
  if (mindOpenAiCodexOAuthMessageListenerBound) return;
  mindOpenAiCodexOAuthMessageListenerBound = true;
  window.addEventListener('message', async (event) => {
    const payload = event?.data;
    if (!payload || typeof payload !== 'object') return;
    if (String(payload.type || '') !== MIND_OPENAI_CODEX_OAUTH_MESSAGE_TYPE) return;
    const incomingState = String(payload.state || '').trim();
    const incomingCode = String(payload.code || '').trim();
    const incomingError = String(payload.error || '').trim();
    if (!incomingState || incomingError) return;
    const activeState = String(mindOpenAiCodexOAuthAttempt?.state || '').trim();
    if (activeState && incomingState === activeState) {
      await completeMindOpenAiCodexOAuthFromUi({ callbackInput: '' });
      return;
    }
    if (incomingCode) {
      await completeMindOpenAiCodexOAuthFromUi({ callbackInput: `${incomingCode}#${incomingState}` });
    }
  });
}

async function exchangeMindOpenAiCodexOAuthAttempt({ attemptId, callbackInput = '' }) {
  const payload = {};
  if (attemptId) payload.attemptId = String(attemptId).trim();
  if (callbackInput) payload.callbackInput = callbackInput;
  return await api('/api/agent/lite/llm/oauth/openai-codex/exchange', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

function hydrateMindUiFromOAuthCredential(credential) {
  const access = String(credential?.access || '').trim();
  if (!access) throw new Error('TOKEN_RESPONSE_INVALID');
  const keyInput = el('llmKeyInput');
  const oauthInput = el('llmOauthProfileInput');
  const authMode = el('llmAuthModeSelect');
  if (authMode) {
    authMode.value = MIND_AUTH_OAUTH;
    setMindAuthModeUi(MIND_AUTH_OAUTH);
  }
  if (keyInput) keyInput.value = access;
  if (oauthInput) {
    oauthInput.value = JSON.stringify({
      provider: 'openai-codex',
      access,
      refresh: String(credential?.refresh || ''),
      expires: Number(credential?.expires || 0),
      accountId: String(credential?.accountId || '')
    }, null, 2);
  }
  syncMindModelRefFromInputs();
}

async function completeMindOpenAiCodexOAuthFromUi({ callbackInput = '' } = {}) {
  if (mindOpenAiCodexOAuthExchangeInFlight) return;
  mindOpenAiCodexOAuthExchangeInFlight = true;
  try {
    const provider = String(el('llmProviderSelect')?.value || MIND_DEFAULT_PROVIDER).trim().toLowerCase();
    if (!MIND_OPENAI_CODEX_OAUTH_PROVIDERS.has(provider)) {
      throw new Error('OAuth completion is available for OpenAI providers only.');
    }
    const normalizedInput = String(callbackInput || '').trim();
    const attemptId = String(mindOpenAiCodexOAuthAttempt?.attemptId || '').trim();
    if (!attemptId && !normalizedInput) {
      throw new Error('Start OAuth first.');
    }
    const result = await exchangeMindOpenAiCodexOAuthAttempt({
      attemptId,
      callbackInput: normalizedInput
    });
    const returnedAttemptId = String(result?.attempt?.id || '').trim();
    const returnedState = String(result?.attempt?.state || '').trim();
    if (returnedAttemptId) {
      mindOpenAiCodexOAuthAttempt = {
        attemptId: returnedAttemptId,
        state: returnedState || String(mindOpenAiCodexOAuthAttempt?.state || '').trim(),
        startedAtMs: Date.now()
      };
    }
    const credential = result?.credential || result?.oauthProfile || null;
    if (!credential) throw new Error('TOKEN_RESPONSE_INVALID');
    hydrateMindUiFromOAuthCredential(credential);
    stopMindOpenAiCodexOAuthPoll();
    mindOpenAiCodexOAuthAttempt = null;
    setMindConfigStatus('OAuth exchange complete. Click Connect Brain.');
    setMindConfigError('');
  } catch (err) {
    const code = String(err?.message || '').trim();
    if (code === 'CODE_PENDING') {
      setMindConfigStatus('Waiting for OAuth callback. Finish sign-in, then click Complete OAuth again.');
      setMindConfigError('');
      return;
    }
    setMindConfigError(`OAuth exchange failed: ${code || 'OAUTH_EXCHANGE_FAILED'}`);
    throw err;
  } finally {
    mindOpenAiCodexOAuthExchangeInFlight = false;
  }
}

function startMindOpenAiCodexOAuthPoll() {
  stopMindOpenAiCodexOAuthPoll();
  mindOpenAiCodexOAuthPollTimer = setInterval(async () => {
    try {
      await completeMindOpenAiCodexOAuthFromUi({ callbackInput: '' });
    } catch (err) {
      if (String(err?.message || '').trim() === 'CODE_PENDING') return;
      stopMindOpenAiCodexOAuthPoll();
    }
  }, 1500);
}

async function launchMindOauthInNewTab() {
  const provider = String(el('llmProviderSelect')?.value || MIND_DEFAULT_PROVIDER).trim().toLowerCase();
  if (!MIND_OPENAI_CODEX_OAUTH_PROVIDERS.has(provider)) {
    setMindConfigError('OAuth launch is available for OpenAI providers only.');
    return;
  }
  bindMindOpenAiCodexOAuthMessageListener();
  const started = await api('/api/agent/lite/llm/oauth/openai-codex/start', {
    method: 'POST',
    body: JSON.stringify({ provider, originator: 'portal-claw-lite-house' })
  });
  const authorizeUrl = String(started?.authorizeUrl || '').trim();
  const attemptId = String(started?.attemptId || '').trim();
  const state = String(started?.state || '').trim();
  if (!authorizeUrl || !attemptId || !state) {
    throw new Error('OAUTH_START_FAILED');
  }
  mindOpenAiCodexOAuthAttempt = { attemptId, state, startedAtMs: Date.now() };
  const popup = window.open(authorizeUrl, '_blank', 'noopener,noreferrer');
  if (!popup) throw new Error('POPUP_BLOCKED');
  setMindConfigStatus('OAuth started. Complete sign-in in the popup. Then use Complete OAuth if needed.');
  setMindConfigError('');
  startMindOpenAiCodexOAuthPoll();
}

function getDefaultLlmModelForProvider(provider) {
  const supported = getSupportedMindModels(provider);
  if (supported.length > 0) return supported[0];
  return MIND_DEFAULT_MODEL;
}

function mapMindConfigError(error) {
  const msg = String(error?.message || error || '');
  if (msg === 'MISSING_LLM_PROVIDER') return 'Enter a provider.';
  if (msg === 'MISSING_LLM_MODEL') return 'Enter a model.';
  if (msg === 'MISSING_LLM_CREDENTIAL') return 'Enter an API key or OAuth token.';
  if (msg === 'MISSING_OAUTH_PROFILE_JSON') return 'Paste an OAuth profile JSON or token.';
  if (msg === 'INVALID_OAUTH_PROFILE_JSON') return 'Invalid OAuth profile/token format.';
  if (msg === 'NO_OAUTH_ACCESS_TOKEN_FOUND') return 'No access token found in OAuth profile JSON.';
  if (msg === 'UNSUPPORTED_OPENAI_ID_TOKEN') {
    return 'OpenAI id_token callback URLs are not valid model credentials. Use an API key or OAuth profile with an access token.';
  }
  if (msg === 'IDB_OPEN_FAILED') return 'Local OpenClaw state is unavailable.';
  return msg || 'Mind configuration failed.';
}

function setMindAuthModeUi(mode) {
  const normalized = normalizeMindAuthMode(mode);
  const authMode = el('llmAuthModeSelect');
  const oauthInput = el('llmOauthProfileInput');
  const oauthHint = el('llmOauthProfileHint');
  const keyInput = el('llmKeyInput');
  if (authMode) authMode.value = normalized;
  if (oauthInput) oauthInput.style.display = normalized === MIND_AUTH_OAUTH ? 'block' : 'none';
  if (keyInput) {
    keyInput.placeholder = normalized === MIND_AUTH_OAUTH
      ? 'Optional override token (usually auto-derived from OAuth input)'
      : 'LLM API key (stored locally)';
  }
  if (oauthHint) {
    oauthHint.textContent = normalized === MIND_AUTH_OAUTH
      ? 'Use Start OAuth for PKCE exchange, or paste an OAuth profile/access token (id_token callback URLs are not supported).'
      : '';
  }
  updateMindOauthLaunchUi();
}

function syncMindModelRefFromInputs() {
  const providerInput = el('llmProviderSelect');
  const modelInput = el('llmModelIdInput');
  const modelRefInput = el('llmModelRefInput');
  if (!providerInput || !modelInput || !modelRefInput) return;
  const providerRaw = String(providerInput.value || MIND_DEFAULT_PROVIDER).trim() || MIND_DEFAULT_PROVIDER;
  const provider = MIND_PROVIDER_ALIASES[providerRaw] || providerRaw;
  const model = String(modelInput.value || '').trim();
  modelRefInput.value = model ? `${provider}/${model}` : '';
}

function getAccessTokenFromProfileValue(value) {
  if (!value || typeof value !== 'object') return '';
  const direct = typeof value.access === 'string'
    ? value.access.trim()
    : typeof value.access_token === 'string'
      ? value.access_token.trim()
      : typeof value.accessToken === 'string'
        ? value.accessToken.trim()
        : typeof value.id_token === 'string'
          ? value.id_token.trim()
          : typeof value.idToken === 'string'
            ? value.idToken.trim()
            : '';
  return direct;
}

function getOAuthProviderAliases(providerHint) {
  const normalized = String(providerHint || '').trim().toLowerCase();
  if (!normalized) return [];
  const aliases = new Set([normalized]);
  if (normalized === 'openai-codex') {
    aliases.add('openai');
    aliases.add('chatgpt');
  }
  if (normalized === 'openai') {
    aliases.add('openai-codex');
    aliases.add('chatgpt');
  }
  return [...aliases];
}

function providerAliasMatches(aliasSet, rawName) {
  if (!aliasSet || !aliasSet.size) return true;
  const normalized = String(rawName || '').trim().toLowerCase();
  if (!normalized) return false;
  if (aliasSet.has(normalized)) return true;
  const prefix = normalized.match(/^[a-z0-9_-]+/);
  if (prefix && aliasSet.has(prefix[0])) return true;
  return false;
}

function decodeMaybeUriComponent(value) {
  const text = String(value || '').trim();
  if (!text || !text.includes('%')) return text;
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function normalizeTokenCandidate(value) {
  const text = String(value || '').trim().replace(/^['"]+|['"]+$/g, '');
  if (!text) return '';
  return text.replace(/^bearer\s+/i, '').trim();
}

function isLikelyJwtToken(value) {
  return /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(String(value || ''));
}

function isLikelyOpaqueOAuthToken(value) {
  return /^[A-Za-z0-9._~-]{24,}$/.test(String(value || ''));
}

function parseJwtPayloadUnsafe(token) {
  const raw = String(token || '').trim();
  if (!isLikelyJwtToken(raw)) return null;
  const parts = raw.split('.');
  if (parts.length !== 3) return null;
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function isLikelyOpenAiIdToken(token) {
  const payload = parseJwtPayloadUnsafe(token);
  if (!payload || typeof payload !== 'object') return false;
  const issuer = String(payload.iss || '').trim();
  const hasAtHash = typeof payload.at_hash === 'string' && payload.at_hash.length > 0;
  return issuer === 'https://auth.openai.com' && hasAtHash;
}

function validateOAuthCredentialForProvider({ provider, credential }) {
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  const token = String(credential || '').trim();
  if (!token || !isLikelyJwtToken(token)) return '';
  if (!isLikelyOpenAiIdToken(token)) return '';
  if (normalizedProvider === 'openai' || normalizedProvider === 'openai-codex') {
    return 'UNSUPPORTED_OPENAI_ID_TOKEN';
  }
  return '';
}

function collectOAuthCandidatesFromUrl(rawUrl) {
  let parsed = null;
  try {
    parsed = new URL(String(rawUrl || '').trim());
  } catch {
    return [];
  }

  const out = [];
  const seen = new Set();
  const pushCandidate = (value) => {
    const normalized = normalizeTokenCandidate(value);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
    const decoded = decodeMaybeUriComponent(normalized);
    if (decoded && decoded !== normalized && !seen.has(decoded)) {
      seen.add(decoded);
      out.push(decoded);
    }
  };

  const readParams = (params) => {
    for (const [rawKey, rawValue] of params.entries()) {
      const key = String(rawKey || '').trim().toLowerCase();
      const value = String(rawValue || '').trim();
      if (!key || !value) continue;
      const include = key === 'access'
        || key === 'access_token'
        || key === 'token'
        || key === 'oauth_token'
        || key === 'id_token'
        || key === 'auth'
        || key === 'profile'
        || key === 'credentials'
        || key.includes('token');
      if (!include) continue;
      pushCandidate(value);
    }
  };

  readParams(parsed.searchParams);

  const hashRaw = String(parsed.hash || '').replace(/^#/, '').trim();
  if (hashRaw) {
    const hashQuery = hashRaw.startsWith('?') ? hashRaw.slice(1) : hashRaw;
    readParams(new URLSearchParams(hashQuery));
  }

  return out;
}

function extractOAuthTokenFromProfileMap(profileMap, providerHint) {
  if (!profileMap || typeof profileMap !== 'object') return '';
  if (Array.isArray(profileMap)) {
    for (const item of profileMap) {
      const token = extractOAuthTokenFromProfileMap(item, providerHint);
      if (token) return token;
    }
    return '';
  }
  const aliasSet = new Set(getOAuthProviderAliases(providerHint));
  const direct = getAccessTokenFromProfileValue(profileMap);
  if (direct) return direct;

  for (const alias of aliasSet) {
    if (!alias) continue;
    if (profileMap[alias]) {
      const directProfile = getAccessTokenFromProfileValue(profileMap[alias]);
      if (directProfile) return directProfile;
    }
  }

  for (const key of Object.keys(profileMap)) {
    const profile = profileMap[key];
    const profileToken = getAccessTokenFromProfileValue(profile);
    const profileProvider = String(profile?.provider || profile?.type || key || '').trim().toLowerCase();
    if (!profileToken) continue;
    if (providerAliasMatches(aliasSet, profileProvider) || providerAliasMatches(aliasSet, key)) {
      return profileToken;
    }
  }
  return '';
}

function extractOAuthAccessTokenFromObject(parsed, providerHint) {
  const candidates = [];
  if (parsed && typeof parsed === 'object') {
    candidates.push(parsed);
    if (parsed.profiles && typeof parsed.profiles === 'object') candidates.push(parsed.profiles);
    if (parsed.auth && parsed.auth.profiles && typeof parsed.auth.profiles === 'object') candidates.push(parsed.auth.profiles);
    if (parsed.profile && typeof parsed.profile === 'object') candidates.push(parsed.profile);
    if (parsed.providerProfiles && typeof parsed.providerProfiles === 'object') candidates.push(parsed.providerProfiles);
  }
  for (const candidate of candidates) {
    const token = extractOAuthTokenFromProfileMap(candidate, providerHint);
    if (token) return token;
  }
  const direct = getAccessTokenFromProfileValue(parsed);
  if (direct) return direct;
  return '';
}

function extractOAuthAccessToken(raw, providerHint) {
  const text = String(raw || '').trim();
  if (!text) return { ok: false, error: 'MISSING_OAUTH_PROFILE_JSON' };

  const directToken = normalizeTokenCandidate(text);
  if (isLikelyJwtToken(directToken) || isLikelyOpaqueOAuthToken(directToken)) {
    return { ok: true, token: directToken };
  }

  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      const token = extractOAuthAccessTokenFromObject(parsed, providerHint);
      return token
        ? { ok: true, token }
        : { ok: false, error: 'NO_OAUTH_ACCESS_TOKEN_FOUND' };
    } catch {
      return { ok: false, error: 'INVALID_OAUTH_PROFILE_JSON' };
    }
  }

  const decodedText = decodeMaybeUriComponent(text);
  if (decodedText && decodedText !== text) {
    const decodedDirectToken = normalizeTokenCandidate(decodedText);
    if (isLikelyJwtToken(decodedDirectToken) || isLikelyOpaqueOAuthToken(decodedDirectToken)) {
      return { ok: true, token: decodedDirectToken };
    }
    if (decodedText.startsWith('{')) {
      try {
        const parsed = JSON.parse(decodedText);
        const token = extractOAuthAccessTokenFromObject(parsed, providerHint);
        if (token) return { ok: true, token };
      } catch {
        // continue
      }
    }
  }

  const urlCandidates = collectOAuthCandidatesFromUrl(text);
  for (const candidate of urlCandidates) {
    if (isLikelyJwtToken(candidate) || isLikelyOpaqueOAuthToken(candidate)) {
      return { ok: true, token: candidate };
    }
    if (candidate.startsWith('{')) {
      try {
        const parsed = JSON.parse(candidate);
        const token = extractOAuthAccessTokenFromObject(parsed, providerHint);
        if (token) return { ok: true, token };
      } catch {
        // continue
      }
    }
  }

  if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(text)) {
    return { ok: false, error: 'NO_OAUTH_ACCESS_TOKEN_FOUND' };
  }
  return { ok: false, error: 'INVALID_OAUTH_PROFILE_JSON' };
}

function applyMindConfigToInputs(config) {
  const providerInput = el('llmProviderSelect');
  const modelInput = el('llmModelIdInput');
  const modelRefInput = el('llmModelRefInput');
  const keyInput = el('llmKeyInput');
  const oauthInput = el('llmOauthProfileInput');
  const selected = applyMindProviderModelSelection(
    config?.provider || MIND_DEFAULT_PROVIDER,
    config?.model || MIND_DEFAULT_MODEL
  );
  if (providerInput) providerInput.value = selected.provider;
  if (modelInput) modelInput.value = selected.model;
  setMindAuthModeUi(config?.authMode || MIND_AUTH_API_KEY);
  if (modelRefInput) {
    const resolved = parseModelRef(
      config?.modelRef || `${selected.provider}/${selected.model}`,
      selected.provider,
      selected.model
    );
    modelRefInput.value = resolved.modelRef;
  }
  if (keyInput) keyInput.value = config?.authMode === MIND_AUTH_OAUTH ? '' : (config?.credential || '');
  if (oauthInput) oauthInput.value = config?.authMode === MIND_AUTH_OAUTH ? (config?.credential || '') : '';
  syncMindModelRefFromInputs();
}

async function readLocalMindConfig() {
  const lib = await loadLiteLlmLibrary();
  const localCfg = await lib.loadLlmConfig();
  const providerRaw = typeof localCfg?.provider === 'string' ? localCfg.provider.trim() : '';
  const modelRaw = typeof localCfg?.model === 'string' ? localCfg.model.trim() : '';
  const modelRefRaw = typeof localCfg?.modelRef === 'string' ? localCfg.modelRef.trim() : '';
  const credential = typeof localCfg?.apiKey === 'string' ? localCfg.apiKey : '';
  const authMode = normalizeMindAuthMode(localCfg?.authMode);
  const parsed = parseModelRef(
    modelRefRaw || `${providerRaw || MIND_DEFAULT_PROVIDER}/${modelRaw || MIND_DEFAULT_MODEL}`,
    providerRaw || MIND_DEFAULT_PROVIDER,
    modelRaw || MIND_DEFAULT_MODEL
  );
  const provider = providerRaw || parsed.provider || MIND_DEFAULT_PROVIDER;
  const model = modelRaw || parsed.modelId || MIND_DEFAULT_MODEL;
  const modelRef = modelRefRaw || parsed.modelRef;
  return {
    configured: !!(provider && model && credential && localCfg?.configured),
    provider,
    model,
    modelRef,
    credential,
    authMode
  };
}

async function hydrateMindConfigFromLocal({ silent = false } = {}) {
  const config = await readLocalMindConfig();
  applyMindConfigToInputs(config);
  if (config.configured) {
    await activateMindConfig(config);
  } else {
    await deactivateMindConfig();
  }
  if (!silent) {
    if (config.configured) {
      setMindConfigStatus(`Mind loaded: ${config.provider}/${config.model}.`);
    } else {
      setMindConfigStatus('Mind not configured yet.');
    }
  }
  setMindConfigError('');
  return config;
}

function resolveMindConfigFromInputs() {
  const providerRaw = String(el('llmProviderSelect')?.value || MIND_DEFAULT_PROVIDER).trim() || MIND_DEFAULT_PROVIDER;
  const providerInput = MIND_PROVIDER_ALIASES[providerRaw] || providerRaw;
  const modelInput = String(el('llmModelIdInput')?.value || '').trim();
  const authMode = normalizeMindAuthMode(el('llmAuthModeSelect')?.value);
  const keyRaw = String(el('llmKeyInput')?.value || '').trim();
  const oauthInput = String(el('llmOauthProfileInput')?.value || '').trim();
  if (!providerInput) throw new Error('MISSING_LLM_PROVIDER');
  if (!modelInput) throw new Error('MISSING_LLM_MODEL');
  const parsed = parseModelRef(
    `${providerInput}/${modelInput || getDefaultLlmModelForProvider(providerInput)}`,
    providerInput,
    modelInput || getDefaultLlmModelForProvider(providerInput)
  );

  const keyParsed = extractOAuthAccessToken(keyRaw, providerInput);
  const keyCredential = keyParsed.ok ? String(keyParsed.token || '').trim() : keyRaw;
  let credential = keyCredential;
  let oauthError = '';
  if (authMode === MIND_AUTH_OAUTH) {
    const token = extractOAuthAccessToken(oauthInput, providerInput);
    oauthError = oauthInput && !token.ok ? String(token.error || 'INVALID_OAUTH_PROFILE_JSON') : '';
    const parsedCredential = token.ok ? String(token.token || '').trim() : '';
    credential = keyCredential || parsedCredential;
  } else if (!credential && oauthInput) {
    const token = extractOAuthAccessToken(oauthInput, providerInput);
    if (token.ok) credential = String(token.token || '').trim();
  }
  if (!credential) throw new Error(oauthError || 'MISSING_LLM_CREDENTIAL');

  const tokenValidationError = validateOAuthCredentialForProvider({
    provider: parsed.provider,
    credential,
  });
  if (tokenValidationError) throw new Error(tokenValidationError);

  const modelRefInput = el('llmModelRefInput');
  if (modelRefInput) modelRefInput.value = parsed.modelRef;

  return {
    provider: parsed.provider,
    model: parsed.modelId,
    modelRef: parsed.modelRef,
    credential,
    authMode
  };
}

async function saveMindConfigToLocal({ silent = false } = {}) {
  const config = resolveMindConfigFromInputs();
  const lib = await loadLiteLlmLibrary();
  await lib.saveLlmConfig({
    provider: config.provider,
    model: config.model,
    apiKey: config.credential,
    authMode: config.authMode
  });
  if (house?.houseId) {
    await idbPutMetaRecords([['houseId', house.houseId]]);
  }
  await activateMindConfig(config);
  if (!silent) setMindConfigStatus(`Mind saved: ${config.provider}/${config.model}.`);
  setMindConfigError('');
  return config;
}

async function persistMindConfigDraftIfPresent() {
  const credential = String(el('llmKeyInput')?.value || '').trim();
  const oauth = String(el('llmOauthProfileInput')?.value || '').trim();
  if (!credential && !oauth) return false;
  await saveMindConfigToLocal({ silent: true });
  return true;
}

async function clearMindConfigFromLocal() {
  mindOpenAiCodexOAuthAttempt = null;
  stopMindOpenAiCodexOAuthPoll();
  const lib = await loadLiteLlmLibrary();
  await lib.clearLlmConfig();
  applyMindConfigToInputs({
    provider: MIND_DEFAULT_PROVIDER,
    model: MIND_DEFAULT_MODEL,
    credential: '',
    authMode: MIND_AUTH_API_KEY
  });
  await deactivateMindConfig();
  setMindConfigStatus('Mind config cleared.');
  setMindConfigError('');
}

function isRecordObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function cloneJsonSafe(value) {
  if (value === undefined) return null;
  try {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) return null;
    return JSON.parse(encoded);
  } catch {
    return null;
  }
}

function normalizeAgentStateMetaRecords(records) {
  if (!Array.isArray(records)) throw new Error('INVALID_AGENT_STATE');
  if (records.length > AGENT_STATE_MAX_META_RECORDS) throw new Error('AGENT_STATE_TOO_LARGE');
  const out = [];
  const seen = new Set();
  for (const item of records) {
    if (!isRecordObject(item)) continue;
    const key = typeof item.key === 'string' ? item.key.trim() : '';
    if (!key || key.length > 256 || seen.has(key)) continue;
    seen.add(key);
    out.push({ key, value: cloneJsonSafe(item.value) });
  }
  return out;
}

function normalizeAgentStateVfsRecords(records) {
  if (!Array.isArray(records)) throw new Error('INVALID_AGENT_STATE');
  if (records.length > AGENT_STATE_MAX_VFS_RECORDS) throw new Error('AGENT_STATE_TOO_LARGE');
  const out = [];
  const seen = new Set();
  for (const item of records) {
    if (!isRecordObject(item)) continue;
    const path = typeof item.path === 'string' ? item.path.trim() : '';
    const dataB64 = typeof item.dataB64 === 'string' ? item.dataB64.trim() : '';
    if (!path || path.length > 1024 || !dataB64 || seen.has(path)) continue;
    seen.add(path);
    const updatedAtMs = Number(item.updatedAtMs);
    out.push({
      path,
      updatedAtMs: Number.isFinite(updatedAtMs) ? Math.max(0, Math.floor(updatedAtMs)) : Date.now(),
      dataB64
    });
  }
  return out;
}

function normalizeAgentStateCheckpoints(records) {
  if (!Array.isArray(records)) throw new Error('INVALID_AGENT_STATE');
  if (records.length > AGENT_STATE_MAX_CHECKPOINT_RECORDS) throw new Error('AGENT_STATE_TOO_LARGE');
  const out = [];
  const seen = new Set();
  for (const item of records) {
    if (!isRecordObject(item)) continue;
    const checkpointId = typeof item.checkpointId === 'string' ? item.checkpointId.trim() : '';
    if (!checkpointId || checkpointId.length > 256 || seen.has(checkpointId)) continue;
    const cloned = cloneJsonSafe(item);
    if (!isRecordObject(cloned)) continue;
    cloned.checkpointId = checkpointId;
    seen.add(checkpointId);
    out.push(cloned);
  }
  return out;
}

function normalizeAgentStateSnapshot(raw) {
  if (!isRecordObject(raw)) throw new Error('INVALID_AGENT_STATE');
  const stores = raw.stores;
  if (!isRecordObject(stores)) throw new Error('INVALID_AGENT_STATE');

  return {
    v: 1,
    kind: AGENT_STATE_KIND,
    schema: AGENT_STATE_SCHEMA,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt.trim() ? raw.createdAt.trim() : new Date().toISOString(),
    stores: {
      meta: normalizeAgentStateMetaRecords(stores.meta || []),
      vfs: normalizeAgentStateVfsRecords(stores.vfs || []),
      checkpoints: normalizeAgentStateCheckpoints(stores.checkpoints || [])
    }
  };
}

function normalizeSealedAgentStateSnapshot(raw) {
  if (!isRecordObject(raw)) throw new Error('INVALID_AGENT_STATE');
  const ciphertext = raw.ciphertext;
  if (!isRecordObject(ciphertext)) throw new Error('INVALID_AGENT_STATE');
  const iv = typeof ciphertext.iv === 'string' ? ciphertext.iv.trim() : '';
  const ct = typeof ciphertext.ct === 'string' ? ciphertext.ct.trim() : '';
  const alg = typeof ciphertext.alg === 'string' ? ciphertext.alg.trim() : 'AES-GCM';
  const houseId = typeof raw.houseId === 'string' ? raw.houseId.trim() : '';
  if (!iv || !ct || alg !== 'AES-GCM') throw new Error('INVALID_AGENT_STATE');
  if (!unb64Safe(iv) || !unb64Safe(ct)) throw new Error('INVALID_AGENT_STATE');
  return {
    v: 1,
    kind: AGENT_STATE_SEALED_KIND,
    schema: AGENT_STATE_SEALED_SCHEMA,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt.trim() ? raw.createdAt.trim() : new Date().toISOString(),
    houseId: houseId || null,
    ciphertext: { alg: 'AES-GCM', iv, ct }
  };
}

function isSealedAgentStateSnapshot(snapshot) {
  return !!(snapshot && snapshot.kind === AGENT_STATE_SEALED_KIND && isRecordObject(snapshot.ciphertext));
}

async function deriveAgentStateSealKey(Kroot) {
  const info = new TextEncoder().encode('elizatown-agent-state-seal-v1');
  const salt = new Uint8Array([]);
  const baseKey = await crypto.subtle.importKey('raw', Kroot, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function sealAgentStateSnapshot(snapshot, expectedHouseId) {
  if (!KrootBytes) throw new Error('HOUSE_KEY_NOT_READY');
  const normalized = normalizeAgentStateSnapshot(snapshot);
  assertSnapshotMatchesHouse(normalized, expectedHouseId);
  const key = await deriveAgentStateSealKey(KrootBytes);
  const aad = new TextEncoder().encode(`house=${expectedHouseId || ''}`);
  const pt = new TextEncoder().encode(JSON.stringify(normalized));
  const enc = await aesGcmEncrypt(key, pt, aad);
  return {
    v: 1,
    kind: AGENT_STATE_SEALED_KIND,
    schema: AGENT_STATE_SEALED_SCHEMA,
    createdAt: new Date().toISOString(),
    houseId: expectedHouseId || null,
    ciphertext: {
      alg: 'AES-GCM',
      iv: b64(enc.iv),
      ct: b64(enc.ct)
    }
  };
}

async function resolveSnapshotForLocalImport(rawSnapshot, expectedHouseId) {
  if (!isRecordObject(rawSnapshot)) throw new Error('INVALID_AGENT_STATE');
  if (isSealedAgentStateSnapshot(rawSnapshot)) {
    if (!KrootBytes) throw new Error('HOUSE_KEY_NOT_READY');
    const sealed = normalizeSealedAgentStateSnapshot(rawSnapshot);
    if (expectedHouseId && sealed.houseId && sealed.houseId !== expectedHouseId) {
      throw new Error('AGENT_STATE_HOUSE_MISMATCH');
    }
    const key = await deriveAgentStateSealKey(KrootBytes);
    const aadHouseId = sealed.houseId || expectedHouseId || '';
    const aad = new TextEncoder().encode(`house=${aadHouseId}`);
    const iv = unb64Safe(sealed.ciphertext.iv);
    const ct = unb64Safe(sealed.ciphertext.ct);
    if (!iv || !ct) throw new Error('INVALID_AGENT_STATE');
    let pt;
    try {
      pt = await aesGcmDecrypt(key, iv, ct, aad);
    } catch {
      throw new Error('INVALID_AGENT_STATE');
    }
    let parsed;
    try {
      parsed = JSON.parse(new TextDecoder().decode(pt));
    } catch {
      throw new Error('INVALID_AGENT_STATE');
    }
    const normalized = normalizeAgentStateSnapshot(parsed);
    assertSnapshotMatchesHouse(normalized, expectedHouseId);
    return normalized;
  }
  const normalized = normalizeAgentStateSnapshot(rawSnapshot);
  assertSnapshotMatchesHouse(normalized, expectedHouseId);
  return normalized;
}

function snapshotByteLength(snapshot) {
  return new TextEncoder().encode(JSON.stringify(snapshot)).length;
}

function sanitizeZipRelativePath(pathValue) {
  const normalized = String(pathValue || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('\0')) return null;
  const parts = normalized.split('/').filter(Boolean);
  if (!parts.length) return null;
  if (parts.some((part) => part === '.' || part === '..')) return null;
  return parts.join('/');
}

async function parseStoredZip(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array([]);
  if (data.length < 22) throw new Error('INVALID_AGENT_STATE');
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  let eocdOffset = -1;
  const minOffset = Math.max(0, data.length - (22 + 0xffff));
  for (let i = data.length - 22; i >= minOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error('INVALID_AGENT_STATE');

  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralOffset = view.getUint32(eocdOffset + 16, true);
  const decoder = new TextDecoder();
  const out = new Map();
  let cursor = centralOffset;

  for (let i = 0; i < entryCount; i++) {
    if (cursor + 46 > data.length || view.getUint32(cursor, true) !== 0x02014b50) {
      throw new Error('INVALID_AGENT_STATE');
    }
    const compression = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLen = view.getUint16(cursor + 28, true);
    const extraLen = view.getUint16(cursor + 30, true);
    const commentLen = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const nameStart = cursor + 46;
    const nameEnd = nameStart + nameLen;
    if (nameEnd > data.length) throw new Error('INVALID_AGENT_STATE');
    const name = decoder.decode(data.subarray(nameStart, nameEnd));

    if (compression !== 0) throw new Error('UNSUPPORTED_ZIP_COMPRESSION');
    if (localOffset + 30 > data.length || view.getUint32(localOffset, true) !== 0x04034b50) {
      throw new Error('INVALID_AGENT_STATE');
    }
    const localNameLen = view.getUint16(localOffset + 26, true);
    const localExtraLen = view.getUint16(localOffset + 28, true);
    const fileStart = localOffset + 30 + localNameLen + localExtraLen;
    const fileEnd = fileStart + compressedSize;
    if (fileEnd > data.length) throw new Error('INVALID_AGENT_STATE');
    const fileBytes = data.subarray(fileStart, fileEnd);
    if (fileBytes.length !== uncompressedSize) throw new Error('INVALID_AGENT_STATE');
    out.set(name, new Uint8Array(fileBytes));

    cursor += 46 + nameLen + extraLen + commentLen;
  }

  return out;
}

function textBytes(text) {
  return new TextEncoder().encode(String(text || ''));
}

function bytesToText(bytes) {
  return new TextDecoder().decode(bytes || new Uint8Array([]));
}

function parseJsonBytes(bytes) {
  try {
    return JSON.parse(bytesToText(bytes));
  } catch {
    throw new Error('INVALID_AGENT_STATE');
  }
}

function isZipFile(file) {
  const name = String(file?.name || '').toLowerCase();
  const type = String(file?.type || '').toLowerCase();
  return name.endsWith('.zip') || type === 'application/zip' || type === 'application/x-zip-compressed';
}

async function readFileAsBytes(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result || new ArrayBuffer(0)));
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
    reader.readAsArrayBuffer(file);
  });
}

async function parseZipBackupToSnapshot(bytes, expectedHouseId = null) {
  const files = await parseStoredZip(bytes);
  const openClawManifestBytes = files.get('manifest.json');
  if (openClawManifestBytes) {
    const manifest = parseJsonBytes(openClawManifestBytes);
    if (!isRecordObject(manifest)) throw new Error('INVALID_AGENT_STATE');
    if (manifest.v !== 1 || manifest.kind !== AGENT_STATE_OPENCLAW_EXPORT_KIND) {
      throw new Error('INVALID_AGENT_STATE');
    }
    const manifestCreatedAtMs = Number(manifest.createdAtMs);
    const fallbackUpdatedAtMs = Number.isFinite(manifestCreatedAtMs)
      ? Math.max(0, Math.floor(manifestCreatedAtMs))
      : Date.now();
    const vfs = [];
    for (const [fileName, fileBytes] of files.entries()) {
      const safePath = sanitizeZipRelativePath(fileName);
      if (!safePath || safePath === 'manifest.json') continue;
      vfs.push({
        path: safePath,
        updatedAtMs: fallbackUpdatedAtMs,
        dataB64: b64(fileBytes)
      });
    }
    return normalizeAgentStateSnapshot({
      v: 1,
      kind: AGENT_STATE_KIND,
      schema: AGENT_STATE_SCHEMA,
      createdAt: new Date().toISOString(),
      stores: {
        meta: expectedHouseId ? [{ key: 'houseId', value: expectedHouseId }] : [],
        vfs,
        checkpoints: []
      }
    });
  }

  const manifestBytes = files.get('agent-state-manifest.json');
  const metaBytes = files.get('meta.json');
  const checkpointsBytes = files.get('checkpoints.json');
  const vfsIndexBytes = files.get('vfs-index.json');
  if (!manifestBytes || !metaBytes || !checkpointsBytes || !vfsIndexBytes) throw new Error('INVALID_AGENT_STATE');

  const manifest = parseJsonBytes(manifestBytes);
  if (!isRecordObject(manifest)) throw new Error('INVALID_AGENT_STATE');
  const manifestKind = typeof manifest.kind === 'string' ? manifest.kind.trim() : '';
  const manifestSchema = typeof manifest.schema === 'string' ? manifest.schema.trim() : '';
  if (manifestKind !== AGENT_STATE_ZIP_KIND || manifestSchema !== AGENT_STATE_ZIP_SCHEMA) {
    throw new Error('INVALID_AGENT_STATE');
  }
  const manifestHouseId = typeof manifest.houseId === 'string' ? manifest.houseId.trim() : '';
  if (expectedHouseId && manifestHouseId && manifestHouseId !== expectedHouseId) {
    throw new Error('AGENT_STATE_HOUSE_MISMATCH');
  }

  const meta = parseJsonBytes(metaBytes);
  const checkpoints = parseJsonBytes(checkpointsBytes);
  const vfsIndex = parseJsonBytes(vfsIndexBytes);
  if (!Array.isArray(vfsIndex)) throw new Error('INVALID_AGENT_STATE');

  const vfs = [];
  for (const row of vfsIndex) {
    if (!isRecordObject(row)) continue;
    const safePath = sanitizeZipRelativePath(row.path);
    if (!safePath) continue;
    const fileBytes = files.get(`vfs/${safePath}`);
    if (!fileBytes) throw new Error('INVALID_AGENT_STATE');
    const updatedAtMs = Number(row.updatedAtMs);
    vfs.push({
      path: safePath,
      updatedAtMs: Number.isFinite(updatedAtMs) ? Math.max(0, Math.floor(updatedAtMs)) : Date.now(),
      dataB64: b64(fileBytes)
    });
  }

  return normalizeAgentStateSnapshot({
    v: 1,
    kind: AGENT_STATE_KIND,
    schema: AGENT_STATE_SCHEMA,
    createdAt: new Date().toISOString(),
    stores: {
      meta: Array.isArray(meta) ? meta : [],
      vfs,
      checkpoints: Array.isArray(checkpoints) ? checkpoints : []
    }
  });
}

function extractSnapshotHouseId(snapshot) {
  if (!isRecordObject(snapshot)) return null;
  const list = Array.isArray(snapshot?.stores?.meta) ? snapshot.stores.meta : [];
  const record = list.find((entry) => isRecordObject(entry) && entry.key === 'houseId');
  const houseId = typeof record?.value === 'string' ? record.value.trim() : '';
  return houseId || null;
}

function assertSnapshotMatchesHouse(snapshot, expectedHouseId) {
  const snapshotHouseId = extractSnapshotHouseId(snapshot);
  if (expectedHouseId && snapshotHouseId && snapshotHouseId !== expectedHouseId) {
    throw new Error('AGENT_STATE_HOUSE_MISMATCH');
  }
}

async function exportLocalAgentStateSnapshot() {
  const [metaRows, vfsRows, checkpointRows] = await Promise.all([
    idbGetAll('meta'),
    idbGetAll('vfs'),
    idbGetAll('checkpoints')
  ]);
  const snapshot = normalizeAgentStateSnapshot({
    v: 1,
    kind: AGENT_STATE_KIND,
    schema: AGENT_STATE_SCHEMA,
    createdAt: new Date().toISOString(),
    stores: {
      meta: metaRows,
      vfs: vfsRows,
      checkpoints: checkpointRows
    }
  });
  const sizeBytes = snapshotByteLength(snapshot);
  if (sizeBytes > AGENT_STATE_MAX_BYTES) throw new Error('AGENT_STATE_TOO_LARGE');
  return { snapshot, sizeBytes };
}

async function replaceLocalAgentStateSnapshot(snapshot) {
  const normalized = normalizeAgentStateSnapshot(snapshot);
  const sizeBytes = snapshotByteLength(normalized);
  if (sizeBytes > AGENT_STATE_MAX_BYTES) throw new Error('AGENT_STATE_TOO_LARGE');

  const db = await openOpenClawDb();
  const tx = db.transaction(['meta', 'vfs', 'checkpoints'], 'readwrite');
  tx.objectStore('meta').clear();
  tx.objectStore('vfs').clear();
  tx.objectStore('checkpoints').clear();
  for (const row of normalized.stores.meta) tx.objectStore('meta').put(row);
  for (const row of normalized.stores.vfs) tx.objectStore('vfs').put(row);
  for (const row of normalized.stores.checkpoints) tx.objectStore('checkpoints').put(row);
  await idbTxDone(tx);
  return { snapshot: normalized, sizeBytes };
}

async function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
    reader.readAsText(file);
  });
}

function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${Math.floor(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function mapAgentStateError(error) {
  const msg = String(error?.message || error || '');
  if (!msg) return 'Agent state operation failed.';
  if (msg === 'LOCKED') return 'Unlock the house first.';
  if (msg === 'RUNTIME_NOT_READY') return 'Local OpenClaw runtime is not ready yet. Try again in a moment.';
  if (msg === 'HOUSE_KEY_NOT_READY') return 'House key is not ready. Unlock again.';
  if (msg === 'INVALID_AGENT_STATE') return 'Invalid agent backup format.';
  if (msg === 'AGENT_STATE_TOO_LARGE') return 'Agent backup is too large.';
  if (msg === 'AGENT_STATE_HOUSE_MISMATCH') return 'Backup belongs to a different house.';
  if (msg === 'UNSUPPORTED_ZIP_COMPRESSION') return 'Unsupported zip compression. Use a backup exported from this page.';
  if (msg === 'NOT_FOUND') return 'House not found.';
  if (msg === 'FILE_READ_FAILED') return 'Failed to read backup file.';
  return msg;
}

async function getHouseAgentStateSnapshot(houseId) {
  const data = await houseApi(houseId, `/api/house/${encodeURIComponent(houseId)}/agent-state`);
  return {
    snapshot: data?.agentState || null,
    updatedAt: data?.updatedAt || null,
    sizeBytes: Number(data?.sizeBytes || 0) || 0
  };
}

async function putHouseAgentStateSnapshot(houseId, snapshot) {
  const body = JSON.stringify({ snapshot });
  return houseApi(
    houseId,
    `/api/house/${encodeURIComponent(houseId)}/agent-state`,
    { method: 'POST', body }
  );
}


// --- base58 (minimal) ---
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Encode(bytes) {
  // Adapted minimal implementation.
  if (!bytes || bytes.length === 0) return '';
  const digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = '';
  // leading zeros
  for (let k = 0; k < bytes.length && bytes[k] === 0; k++) out += '1';
  for (let q = digits.length - 1; q >= 0; q--) out += B58[digits[q]];
  return out;
}

// --- crypto primitives ---
async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(digest);
}

// (Publish convergence) Ceremony-only houses.
// We store only a wallet-wrapped K_root for recovery; wallet signature is still the UX gate.

async function aesGcmEncrypt(key, plaintextBytes, aadBytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aadBytes || new Uint8Array([]) },
    key,
    plaintextBytes
  );
  return { iv: new Uint8Array(iv), ct: new Uint8Array(ct) };
}

async function aesGcmDecrypt(key, ivBytes, ctBytes, aadBytes) {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes, additionalData: aadBytes || new Uint8Array([]) },
    key,
    ctBytes
  );
  return new Uint8Array(pt);
}

async function deriveHouseAuthKey(Kroot) {
  const info = new TextEncoder().encode('elizatown-house-auth-v1');
  const salt = new Uint8Array([]);
  const baseKey = await crypto.subtle.importKey('raw', Kroot, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    baseKey,
    256
  );
  return new Uint8Array(bits);
}

async function bodyHashB64(body) {
  const bytes = body ? new TextEncoder().encode(body) : new Uint8Array([]);
  const digest = await sha256(bytes);
  return b64(digest);
}

async function houseAuthHeaders(houseId, method, url, body) {
  if (!KauthKey) throw new Error('HOUSE_AUTH_NOT_READY');
  const ts = String(Date.now());
  const path = new URL(url, window.location.origin).pathname;
  const bodyHash = await bodyHashB64(body || '');
  const msg = `${houseId}.${ts}.${method}.${path}.${bodyHash}`;
  const sig = await crypto.subtle.sign('HMAC', KauthKey, new TextEncoder().encode(msg));
  const auth = b64(new Uint8Array(sig));
  return { 'x-house-ts': ts, 'x-house-auth': auth };
}

async function houseApi(houseId, url, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const body = typeof opts.body === 'string' ? opts.body : '';
  const headers = await houseAuthHeaders(houseId, method, url, body);
  return api(url, {
    ...opts,
    headers: { ...(opts.headers || {}), ...headers }
  });
}

// --- wallet ---
const walletClient = window.initWalletClient ? window.initWalletClient() : null;
let walletAddr = null;
let walletHouseId = null;
let publicMedia = null;
let pendingPublicImage = null;

function houseIdFromSearch() {
  return new URLSearchParams(window.location.search).get('house');
}

function resolvedInboxHouseId() {
  return (house && house.houseId) || houseIdFromSearch() || walletHouseId || null;
}

function syncInboxNavLink() {
  const inboxNav = el('inboxNavLink');
  if (!inboxNav) return;
  const targetHouseId = resolvedInboxHouseId();
  if (!targetHouseId) {
    inboxNav.classList.add('is-hidden');
    inboxNav.href = '#';
    return;
  }
  inboxNav.href = `/inbox/${encodeURIComponent(targetHouseId)}`;
  inboxNav.classList.remove('is-hidden');
}

function updateWalletUI() {
  const connected = !!walletAddr;
  const btn = el('connectWalletBtn');
  if (btn) {
    btn.textContent = connected ? 'Disconnect wallet' : 'Connect wallet';
    btn.setAttribute('aria-pressed', connected ? 'true' : 'false');
  }
  const addr = el('walletAddr');
  if (addr) addr.textContent = connected ? walletAddr : '—';
  void refreshHouseEconomyPanel();
}

function loadWalletCache() {
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.address !== 'string') return null;
    return data;
  } catch {
    return null;
  }
}

function saveWalletCache() {
  try {
    if (!walletAddr) {
      localStorage.removeItem(WALLET_STORAGE_KEY);
      return;
    }
    const payload = {
      address: walletAddr,
      houseId: walletHouseId || null
    };
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

function clearWalletCache() {
  try {
    localStorage.removeItem(WALLET_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

let walletEventBindings = null;
function walletAddressFromEvent(next) {
  if (!next) return null;
  if (typeof next === 'string') return next || null;
  if (next.publicKey && typeof next.publicKey.toString === 'function') {
    const addr = next.publicKey.toString();
    return typeof addr === 'string' && addr ? addr : null;
  }
  if (typeof next.toString === 'function') {
    const addr = next.toString();
    if (typeof addr === 'string' && addr && addr !== '[object Object]') return addr;
  }
  return null;
}

function bindWalletEvents() {
  if (!walletClient) return;
  if (walletEventBindings) return;

  const onDisconnect = () => {
    // Wallet disconnected outside the app.
    disconnectWallet({ fromProvider: true, resetSession: unlocked }).catch(() => {});
  };
  const onAccountChanged = (next) => {
    const nextAddr = walletAddressFromEvent(next);
    if (!nextAddr) {
      disconnectWallet({ fromProvider: true, resetSession: unlocked }).catch(() => {});
      return;
    }
    if (walletAddr && walletAddr !== nextAddr) {
      walletAddr = nextAddr;
      walletHouseId = null;
      updateWalletUI();
      saveWalletCache();
      syncInboxNavLink();
      if (unlocked) {
        // Switching accounts should lock immediately; the unlock UX is per-wallet.
        wipeKeys();
        setStatus('Locked (wallet account changed).');
      }
    }
  };

  walletClient.on('disconnect', onDisconnect);
  walletClient.on('accountChanged', onAccountChanged);
  walletEventBindings = { onDisconnect, onAccountChanged };
}

function unbindWalletEvents() {
  if (!walletEventBindings) return;
  const { onDisconnect, onAccountChanged } = walletEventBindings;
  if (walletClient) {
    walletClient.off('disconnect', onDisconnect);
    walletClient.off('accountChanged', onAccountChanged);
  }
  walletEventBindings = null;
}

async function connectWallet({ silent = false } = {}) {
  if (!walletClient) throw new Error('NO_SOLANA_WALLET');
  const previousAddr = walletAddr;
  const connected = await walletClient.connect({ chain: 'solana', silent: !!silent });
  bindWalletEvents();
  walletAddr = connected?.address || walletClient.getAddress({ chain: 'solana' }) || null;
  if (!walletAddr) throw new Error('NO_SOLANA_PUBKEY');
  if (previousAddr && previousAddr !== walletAddr) {
    walletHouseId = null;
  }
  if (!walletHouseId) {
    const cached = loadWalletCache();
    if (cached && cached.address === walletAddr && cached.houseId) {
      walletHouseId = cached.houseId;
    }
  }

  updateWalletUI();
  saveWalletCache();
  syncInboxNavLink();
}

function clearClientFlowState() {
  try {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(PATH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_PATH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_ERROR_KEY);
    localStorage.removeItem(SIGNUP_COMPLETE_AT_KEY);
    localStorage.removeItem(SHARE_CACHE_KEY);
  } catch {
    // ignore
  }
  try {
    clearAllHouseAuthCache();
  } catch {
    // ignore
  }
}

async function resetSessionAndGoHome() {
  try {
    await api('/api/session/reset', { method: 'POST', body: JSON.stringify({}) });
  } catch (e) {
    console.warn('session reset failed', e);
  }
  clearClientFlowState();
  window.location.replace('/');
}

async function disconnectWallet({ fromProvider = false, resetSession = false } = {}) {
  if (!fromProvider && walletClient) {
    try {
      await walletClient.disconnect({ chain: 'solana' });
    } catch {
      // ignore disconnect errors; we still clear local state
    }
  }
  unbindWalletEvents();
  walletAddr = null;
  walletHouseId = null;
  updateWalletUI();
  clearWalletCache();
  syncInboxNavLink();

  // If the house was unlocked, disconnecting the wallet should also lock.
  // This avoids "sticky" unlocked state on shared devices.
  if (unlocked) {
    wipeKeys();
    setStatus('Locked (wallet disconnected).');
    if (resetSession) {
      await resetSessionAndGoHome();
    }
  }
}

async function signMessage(message) {
  await signMessageBytes(message);
}

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
  if (leadingZeros) {
    return new Uint8Array(Array(leadingZeros).fill(0).concat(bytes));
  }
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
      // ignore
    }
  }
  return null;
}

async function signMessageBytes(message) {
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  if (!walletClient) throw new Error('NO_SOLANA_WALLET');
  return walletClient.signMessage({ chain: 'solana', message });
}

async function verifyTokenOwnershipForShare() {
  if (!walletAddr) {
    await connectWallet();
  }
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  const nonceResp = await api('/api/token/nonce');
  const msg = buildTokenCheckMessage({ address: walletAddr, nonce: nonceResp.nonce });
  const sigBytes = await signMessageBytes(msg);
  const result = await api('/api/token/verify', {
    method: 'POST',
    body: JSON.stringify({
      address: walletAddr,
      nonce: nonceResp.nonce,
      signature: b64(sigBytes)
    })
  });
  if (!result?.eligible) throw new Error('NO_TOKEN');
  return result;
}

function buildUnlockMessage({ housePubKey, nonce, origin }) {
  return [
    'ElizaTown House Unlock',
    `housePubKey: ${housePubKey}`,
    `origin: ${origin}`,
    `nonce: ${nonce}`
  ].join('\n');
}

function buildWalletLookupMessage({ address, nonce, houseId }) {
  const parts = ['ElizaTown House Lookup', `address: ${address}`, `nonce: ${nonce}`];
  if (houseId) parts.push(`houseId: ${houseId}`);
  return parts.join('\n');
}

function buildTokenCheckMessage({ address, nonce }) {
  return ['ElizaTown Token Check', `address: ${address}`, `CA: ${TOKEN_MINT}`, `nonce: ${nonce}`].join('\n');
}

function buildKeyWrapMessage({ houseId, origin }) {
  const parts = ['ElizaTown House Key Wrap', `houseId: ${houseId}`];
  if (origin) parts.push(`origin: ${origin}`);
  return parts.join('\n');
}

async function lookupWalletHouseId() {
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  const nonceResp = await api('/api/wallet/nonce');
  const lookupMsg = buildWalletLookupMessage({ address: walletAddr, nonce: nonceResp.nonce, houseId: null });
  const lookupSig = await signMessageBytes(lookupMsg);
  const lookup = await api('/api/wallet/lookup', {
    method: 'POST',
    body: JSON.stringify({
      address: walletAddr,
      nonce: nonceResp.nonce,
      signature: b64(lookupSig)
    })
  });
  if (lookup?.houseId) {
    walletHouseId = lookup.houseId;
    saveWalletCache();
    syncInboxNavLink();
    return lookup.houseId;
  }
  return null;
}

async function restoreWalletConnection({ houseIdFromUrl } = {}) {
  const cached = loadWalletCache();
  if (!cached || !cached.address) return;
  try {
    await connectWallet({ silent: true });
  } catch {
    clearWalletCache();
    updateWalletUI();
    syncInboxNavLink();
    return;
  }
  if (cached.address !== walletAddr) {
    walletHouseId = null;
    saveWalletCache();
    syncInboxNavLink();
    return;
  }
  if (!houseIdFromUrl && cached.houseId) {
    walletHouseId = cached.houseId;
  }
  setStatus('Wallet connected.');
  saveWalletCache();
  syncInboxNavLink();
}

let unlocked = false;
let house = null; // { houseId, housePubKey, nonce }
let KrootBytes = null; // Uint8Array (memory only)
let Kenc = null; // CryptoKey for house log encryption
let KauthBytes = null; // Uint8Array (memory only)
let KauthKey = null; // CryptoKey for HMAC auth
let autoLockTimer = null;

// Phase 3: store minted ERC-8004 ids in memory + browser storage (per-house).
let humanErc8004Id = null;
let humanErc8004RegId = null;
let agentErc8004Id = null;

function randomNonce(prefix = 'n_') {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `${prefix}${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`;
}

function buildAnchorLinkMessage({ houseId, erc8004Id, origin, nonce, createdAtMs }) {
  // Human-readable, stable message for EVM signature.
  return [
    'AgentTown Anchor Link',
    `houseId: ${houseId}`,
    `erc8004Id: ${erc8004Id}`,
    `origin: ${origin}`,
    `nonce: ${nonce}`,
    `createdAtMs: ${createdAtMs}`
  ].join('\n');
}

async function signEvmMessage(message) {
  if (!walletClient) throw new Error('NO_EVM_WALLET');
  const connected = await walletClient.connect({ chain: 'evm' });
  const signer = connected?.address || walletClient.getAddress({ chain: 'evm' }) || null;
  if (!signer) throw new Error('NO_EVM_ACCOUNT');
  const sig = await walletClient.signMessage({ chain: 'evm', message, address: signer });
  const chainId = await walletClient.getChainId({ chain: 'evm' });
  return { signer, signature: sig, chainId };
}

async function appendVaultObject({ type = 'anchor', body }) {
  if (!unlocked || !house || !Kenc) throw new Error('LOCKED');
  armAutoLock();

  const payload = {
    v: 1,
    id: `e_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    ts: Date.now(),
    author: 'human',
    type,
    body
  };

  const pt = new TextEncoder().encode(JSON.stringify(payload));
  const aad = new TextEncoder().encode(`house=${house.houseId}`);
  const enc = await aesGcmEncrypt(Kenc, pt, aad);
  const ciphertext = { alg: 'AES-GCM', iv: b64(enc.iv), ct: b64(enc.ct) };

  const url = `/api/house/${encodeURIComponent(house.houseId)}/append`;
  const reqBody = JSON.stringify({ ciphertext, author: 'human' });
  await houseApi(house.houseId, url, { method: 'POST', body: reqBody });
}

async function linkErc8004AnchorToVault(erc8004Id) {
  if (!unlocked || !house) throw new Error('LOCKED');
  const clean = (erc8004Id || '').trim();
  if (!clean) throw new Error('ERC8004_ID_REQUIRED');

  const discoverable = !!el('anchorDiscoverable')?.checked;

  setAnchorError('');
  setAnchorStatus('Requesting signature…');

  const createdAtMs = Date.now();
  // Use a server-issued nonce if we are publishing to a server directory (prevents replay).
  let nonce = randomNonce('a_');
  if (discoverable) {
    try {
      const n = await api('/api/anchors/nonce');
      if (n && n.nonce) nonce = String(n.nonce);
    } catch {
      // fallback to random nonce
    }
  }

  const msg = buildAnchorLinkMessage({
    houseId: house.houseId,
    erc8004Id: clean,
    origin: window.location.origin,
    nonce,
    createdAtMs
  });

  const { signer, signature, chainId } = await signEvmMessage(msg);

  setAnchorStatus('Saving to encrypted vault…');
  await appendVaultObject({
    type: 'anchor',
    body: {
      kind: 'anchor.link.v1',
      createdAtMs,
      nonce,
      origin: window.location.origin,
      anchor: {
        kind: 'erc8004',
        // Store exactly what Agent0 returns (includes chain id in the string).
        erc8004Id: clean,
        // Also store the wallet chainId for debugging/UX grouping.
        chainId
      },
      proof: {
        kind: 'eip191.personal_sign',
        signer,
        message: msg,
        signature
      },
      publish: {
        discoverable
      }
    }
  });

  if (discoverable) {
    setAnchorStatus('Publishing mapping…');
    await api('/api/anchors/register', {
      method: 'POST',
      body: JSON.stringify({
        houseId: house.houseId,
        erc8004Id: clean,
        createdAtMs,
        nonce,
        signer,
        signature,
        chainId,
        origin: window.location.origin
      })
    });
  }

  setAnchorStatus(discoverable ? 'Linked + published.' : 'Linked.');
  setTimeout(() => setAnchorStatus(''), 1200);
  await refreshEntries();
}

function buildHouseDescriptor(currentHouseId) {
  const origin = window.location.origin;
  return {
    v: 1,
    kind: 'agent-town-house',
    house: {
      id: currentHouseId,
      pub: currentHouseId,
      // Phase 1: placeholder mailbox list (PDA not yet deployed)
      mailboxes: [
        {
          chain: 'solana',
          kind: 'pda',
          status: 'placeholder',
          note: 'Placeholder only. This mailbox is not live messaging infrastructure yet.',
          address: 'PDA_TODO',
          program: 'PROGRAM_TODO'
        }
      ]
    },
    endpoints: {
      meta: `${origin}/api/house/${encodeURIComponent(currentHouseId)}/meta`,
      log: `${origin}/api/house/${encodeURIComponent(currentHouseId)}/log`,
      append: `${origin}/api/house/${encodeURIComponent(currentHouseId)}/append`
    },
    ui: {
      houseUrl: `${origin}/house?house=${encodeURIComponent(currentHouseId)}`
    }
  };
}

function buildErc8004Statement(currentHouseId) {
  return {
    v: 1,
    kind: 'erc8004.link_house',
    housePubKey: currentHouseId,
    // human wallet used for unlock (Solana in Phase 1)
    human: walletAddr || null,
    // phase 2/3: fill in agent + human ERC-8004 identity ids once minted
    humanErc8004: humanErc8004Id,
    humanErc8004RegId,
    agentErc8004: agentErc8004Id,
    origin: window.location.origin,
    createdAtMs: Date.now()
  };
}

async function mintErc8004Identity() {
  const status = el('erc8004MintStatus');
  if (status) status.textContent = '';

  if (!walletClient) throw new Error('NO_EVM_WALLET');
  const evmProvider = walletClient.getProvider({ chain: 'evm' });
  if (!evmProvider) throw new Error('NO_EVM_WALLET');
  const houseId = house?.houseId || new URLSearchParams(window.location.search).get('house');
  if (!houseId) throw new Error('NO_HOUSE_ID');

  const chain = el('erc8004Chain')?.value || 'sepolia';
  const chainId = chain === 'mainnet' ? 1 : 11155111;

  if (chain === 'mainnet') {
    const ok = confirm('Mint on Ethereum mainnet? This will cost real gas.');
    if (!ok) return;
  }

  // Prefer a locally hosted Agent0 SDK bundle; allow a CDN fallback with confirmation.
  // For e2e tests we allow injecting a mock via window.__AG0_SDK_MOCK.
  const mod = await loadAgent0Sdk(status);

  const SDKClass = mod.SDK;
  if (typeof SDKClass !== 'function') throw new Error('AG0_SDK_LOAD_FAILED');

  // Ensure wallet is connected
  const connected = await walletClient.connect({ chain: 'evm' });
  const owner = connected?.address || walletClient.getAddress({ chain: 'evm' }) || null;
  if (!owner) throw new Error('NO_EVM_ACCOUNT');

  // Best-effort chain switch
  const currentChainId = await walletClient.getChainId({ chain: 'evm' });
  if (currentChainId !== chainId) {
    try {
      await walletClient.switchChain({ chain: 'evm', chainId });
    } catch {
      throw new Error('WRONG_CHAIN');
    }
  }

  // Cheap-ish default RPCs (reads only). Writes go via the wallet provider.
  // If these ever flake, we can swap to Alchemy/Infura env-config later.
  const rpcUrl = chainId === 1 ? 'https://eth.llamarpc.com' : 'https://rpc.ankr.com/eth_sepolia';

  const sdk = new SDKClass({
    chainId,
    rpcUrl,
    walletProvider: evmProvider
  });

  const draftPayload = buildErc8004RegistrationDraftPayload({ houseId });
  if (status) status.textContent = 'Creating ERC-8004 registration draft…';
  const draft = await api('/api/erc8004/registration/draft', {
    method: 'POST',
    body: JSON.stringify(draftPayload)
  });
  const regId = typeof draft?.regId === 'string' ? draft.regId.trim() : '';
  const tokenUri = typeof draft?.tokenUri === 'string' ? draft.tokenUri.trim() : '';
  const completionToken = typeof draft?.completionToken === 'string' ? draft.completionToken.trim() : '';
  if (!regId || !tokenUri || !completionToken) throw new Error('ERC8004_DRAFT_FAILED');

  const agent = sdk.createAgent(draftPayload.name, draftPayload.description, draftPayload.image);
  try {
    agent.setEntityType?.('house');
  } catch {
    // optional in older SDK versions
  }

  // Attach context metadata for consumers that read SDK metadata.
  try {
    agent.setMetadata?.({ houseId, origin: window.location.origin });
  } catch {
    // ignore - metadata support may vary by SDK version
  }

  if (status) status.textContent = `Submitting ERC-8004 registration on ${chain}…`;
  const tx = await agent.registerHTTP(tokenUri);

  const txHash = tx?.hash;
  if (status) {
    status.textContent = txHash ? `Submitted: ${txHash}` : 'Submitted.';
  }

  if (typeof tx?.waitConfirmed !== 'function') throw new Error('MINT_CONFIRMATION_UNAVAILABLE');
  if (status) status.textContent = 'Waiting for confirmation…';

  const { result } = await tx.waitConfirmed();
  const registryFromUri = parseEip155AgentRegistry(result?.agentRegistry);
  const chainIdFromResult = Number(result?.chainId);
  const resolvedChainId = registryFromUri?.chainId
    || (Number.isInteger(chainIdFromResult) && chainIdFromResult > 0 ? chainIdFromResult : chainId);
  const parsedIdentity = parseMintedAgentIdentity(result?.agentId, resolvedChainId);
  if (!parsedIdentity) throw new Error('INVALID_AGENT_ID');

  const identityRegistry = resolveErc8004IdentityRegistry(
    parsedIdentity.chainId,
    registryFromUri?.identityRegistry,
    result?.identityRegistry
  );
  if (!identityRegistry) throw new Error('INVALID_IDENTITY_REGISTRY');

  await api('/api/erc8004/registration/complete', {
    method: 'POST',
    body: JSON.stringify({
      regId,
      completionToken,
      onchain: {
        namespace: 'eip155',
        chainId: parsedIdentity.chainId,
        identityRegistry,
        agentId: parsedIdentity.agentId
      }
    })
  });

  humanErc8004Id = parsedIdentity.erc8004Id;
  humanErc8004RegId = regId;
  saveStoredErc8004Identity(houseId, {
    type: 'erc8004_identity',
    regId,
    agentId: humanErc8004Id,
    createdAtMs: Date.now()
  });

  // If we haven't unlocked yet, still re-render using the URL houseId.
  renderDescriptorUI((house && house.houseId) ? house.houseId : houseId);

  // Prefill anchor link input for convenience.
  const anchorInput = el('anchorErc8004Id');
  if (anchorInput && !anchorInput.value) anchorInput.value = String(humanErc8004Id);
  if (status) status.textContent = `Minted identity: ${humanErc8004Id}`;
}

function renderDescriptorUI(currentHouseId) {
  const descriptor = buildHouseDescriptor(currentHouseId);
  const json = JSON.stringify(descriptor, null, 2);

  const d = el('descriptor');
  if (d) d.value = json;

  const stmt = buildErc8004Statement(currentHouseId);
  const s = el('erc8004');
  if (s) s.value = JSON.stringify(stmt, null, 2);

  const qrEl = el('qr');
  if (qrEl && typeof qrcode === 'function') {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(json, 'Byte');
      qr.make();
      qrEl.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 2, scalable: true, alt: 'House descriptor QR' });
    } catch (e) {
      qrEl.textContent = `QR render failed: ${e.message}`;
    }
  }
}

function clearDescriptorUI() {
  const qrEl = el('qr');
  if (qrEl) qrEl.innerHTML = '';
  const d = el('descriptor');
  if (d) d.value = '';
  const e = el('erc8004');
  if (e) e.value = '';
}

function armAutoLock() {
  if (!AUTO_LOCK_MS) return;
  if (autoLockTimer) clearTimeout(autoLockTimer);
  autoLockTimer = setTimeout(() => {
    wipeKeys();
    setStatus('Locked (inactive).');
  }, AUTO_LOCK_MS);
}

function setPanelVisible(panelId, visible) {
  const panel = el(panelId);
  if (!panel) return;
  panel.classList.toggle('is-hidden', !visible);
}

let descriptorOpen = false;
let erc8004Open = false;

function setDescriptorOpen(open) {
  descriptorOpen = !!open;
  setPanelVisible('descriptorPanel', descriptorOpen);
  const btn = el('toggleDescriptorBtn');
  if (btn) {
    btn.textContent = descriptorOpen ? 'Hide house QR' : 'Show house QR';
    btn.setAttribute('aria-pressed', descriptorOpen ? 'true' : 'false');
  }
  if (unlocked) armAutoLock();
}

function setErc8004Open(open) {
  erc8004Open = !!open;
  const advancedEnabled = isErc8004AdvancedEnabled();
  const show = advancedEnabled && erc8004Open;
  setPanelVisible('erc8004Panel', show);
  setPanelVisible('anchorsPanel', show);
  const btn = el('toggleErc8004Btn');
  if (btn) {
    btn.textContent = erc8004Open ? 'Hide ERC-8004' : 'Show ERC-8004';
    btn.setAttribute('aria-pressed', erc8004Open ? 'true' : 'false');
  }
  if (unlocked) armAutoLock();
}

function setHousePanelButtonsEnabled(enabled) {
  const descBtn = el('toggleDescriptorBtn');
  const ercBtn = el('toggleErc8004Btn');
  const advancedEnabled = isErc8004AdvancedEnabled();
  if (descBtn) descBtn.disabled = !enabled;
  if (ercBtn) {
    ercBtn.classList.toggle('is-hidden', !advancedEnabled);
    ercBtn.disabled = !enabled || !advancedEnabled;
  }
  setPublicMediaEnabled(enabled);
  setAgentStateControlsEnabled(enabled);
  if (!enabled) {
    setDescriptorOpen(false);
    setErc8004Open(false);
  }
}

function setUnlockButtonState(isUnlocked) {
  const btn = el('unlockBtn');
  if (!btn) return;
  btn.textContent = isUnlocked ? 'Unlocked' : 'Sign to unlock';
  btn.disabled = !!isUnlocked;
}

async function initKeysFromKroot(Kroot) {
  KrootBytes = Kroot;
  Kenc = await deriveHouseEncKey(KrootBytes);
  KauthBytes = await deriveHouseAuthKey(KrootBytes);
  KauthKey = await crypto.subtle.importKey('raw', KauthBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function recoverHouseKeyWithWallet(houseId) {
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  setStatus('Recovering house key…');
  const primaryWrapMsg = buildKeyWrapMessage({ houseId });
  const primaryWrapSig = await signMessageBytes(primaryWrapMsg);
  const lookup = await api('/api/wallet/lookup', {
    method: 'POST',
    body: JSON.stringify({
      address: walletAddr,
      signature: b64(primaryWrapSig),
      houseId
    })
  });
  if (!lookup?.keyWrap || !lookup.keyWrap.iv || !lookup.keyWrap.ct) return false;
  if (lookup.keyWrap.alg && lookup.keyWrap.alg !== 'AES-GCM') throw new Error('INVALID_KEY_WRAP');

  async function decryptWithSignature(sigBytes) {
    const wrapKeyBytes = await sha256(sigBytes);
    const wrapKey = await crypto.subtle.importKey('raw', wrapKeyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
    return aesGcmDecrypt(wrapKey, unb64(lookup.keyWrap.iv), unb64(lookup.keyWrap.ct));
  }

  async function decryptWithMessage(wrapMsg) {
    const wrapSig = await signMessageBytes(wrapMsg);
    return decryptWithSignature(wrapSig);
  }

  let kroot = null;
  let lastErr = null;
  try {
    kroot = await decryptWithSignature(primaryWrapSig);
  } catch (e) {
    lastErr = e;
  }

  const attempts = [];
  const currentOrigin = window.location.origin;
  if (currentOrigin) {
    attempts.push(buildKeyWrapMessage({ houseId, origin: currentOrigin }));
    const url = new URL(currentOrigin);
    const portSuffix = url.port ? `:${url.port}` : '';
    if (url.hostname === 'localhost') {
      attempts.push(buildKeyWrapMessage({ houseId, origin: `${url.protocol}//127.0.0.1${portSuffix}` }));
    } else if (url.hostname === '127.0.0.1') {
      attempts.push(buildKeyWrapMessage({ houseId, origin: `${url.protocol}//localhost${portSuffix}` }));
    }
  }

  if (!kroot) {
    for (const msg of attempts) {
      try {
        kroot = await decryptWithMessage(msg);
        break;
      } catch (e) {
        lastErr = e;
        setStatus('Retrying key recovery…');
      }
    }
  }
  if (!kroot) {
    throw new Error(lastErr?.message || 'KEY_WRAP_DECRYPT_FAILED');
  }
  const houseIdBytes = await sha256(kroot);
  const derivedHouseId = base58Encode(houseIdBytes);
  if (derivedHouseId !== houseId) throw new Error('HOUSE_ID_MISMATCH');
  await initKeysFromKroot(kroot);
  return true;
}

function wipeKeys() {
  const prevHouseId = house?.houseId || null;
  unlocked = false;
  house = null;
  humanErc8004Id = null;
  humanErc8004RegId = null;
  KrootBytes = null;
  Kenc = null;
  KauthBytes = null;
  KauthKey = null;
  clearHouseAuthCache(prevHouseId);
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
  }
  publicMedia = null;
  pendingPublicImage = null;
  el('entries').textContent = '';
  applyMindConfigToInputs({
    provider: MIND_DEFAULT_PROVIDER,
    model: MIND_DEFAULT_MODEL,
    credential: '',
    authMode: MIND_AUTH_API_KEY
  });
  clearDescriptorUI();
  const anchorInput = el('anchorErc8004Id');
  if (anchorInput) anchorInput.value = '';
  const mintStatus = el('erc8004MintStatus');
  if (mintStatus) mintStatus.textContent = '';
  renderPublicMediaPreview({ imageUrl: null, prompt: '', pending: false });
  setHousePanelButtonsEnabled(false);
  setUnlockButtonState(false);
  syncInboxNavLink();
}

async function deriveHouseEncKey(Kroot) {
  const info = new TextEncoder().encode('elizatown-house-enc-v1');
  const salt = new Uint8Array([]);
  const baseKey = await crypto.subtle.importKey('raw', Kroot, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Ceremony-only publish: house creation happens on /create.

async function unlockExistingHouse(houseId) {
  setError('');
  setStatus('Unlocking house…');
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');

  const recoveredOk = await recoverHouseKeyWithWallet(houseId);
  if (!recoveredOk) throw new Error('KEY_RECOVERY_REQUIRED');
  const recovered = true;

  const meta = await houseApi(houseId, `/api/house/${encodeURIComponent(houseId)}/meta`);
  const { housePubKey, nonce, keyMode } = meta;

  if (keyMode && keyMode !== 'ceremony') throw new Error('CEREMONY_ONLY');

  // UX gate: require a wallet signature each session.
  const msg = buildUnlockMessage({ housePubKey, nonce, origin: window.location.origin });
  await signMessage(msg);

  house = { houseId, housePubKey, nonce };
  unlocked = true;
  walletHouseId = house.houseId;
  saveWalletCache();
  cacheHouseAuthBytes(house.houseId, KauthBytes);
  syncInboxNavLink();
  setStatus(recovered ? 'Unlocked (wallet recovery).' : 'Unlocked.');
  setUnlockButtonState(true);
  armAutoLock();

  restoreStoredErc8004IdentityForHouse(house.houseId);
  renderDescriptorUI(house.houseId);
  setHousePanelButtonsEnabled(true);
  setDescriptorOpen(false);
  setErc8004Open(false);
  await refreshHouseEconomyPanel();
  await refreshEntries();
  await loadPublicMedia();
  try {
    await restoreAgentStateFromHouse({ silent: true });
  } catch (err) {
    setAgentStateError(mapAgentStateError(err));
  }
  try {
    await hydrateMindConfigFromLocal({ silent: true });
  } catch (err) {
    setMindConfigError(mapMindConfigError(err));
  }
}

async function restoreAgentStateFromHouse({ silent = false } = {}) {
  if (!unlocked || !house) throw new Error('LOCKED');
  const { snapshot, sizeBytes, updatedAt } = await getHouseAgentStateSnapshot(house.houseId);
  if (!snapshot) {
    if (!silent) setAgentStateStatus('No saved agent state found in this house.');
    return { restored: false, sizeBytes: 0 };
  }
  const plainSnapshot = await resolveSnapshotForLocalImport(snapshot, house.houseId);
  const imported = await replaceLocalAgentStateSnapshot(plainSnapshot);
  await hydrateMindConfigFromLocal({ silent });
  const label = updatedAt ? `from ${new Date(updatedAt).toLocaleString()}` : 'from house';
  setAgentStateStatus(`Agent state restored ${label} (${formatBytes(sizeBytes || imported.sizeBytes)}).`);
  setAgentStateError('');
  return { restored: true, sizeBytes: sizeBytes || imported.sizeBytes };
}

async function saveAgentStateToHouse() {
  if (!unlocked || !house) throw new Error('LOCKED');
  await persistMindConfigDraftIfPresent();
  const exported = await exportLocalAgentStateSnapshot();
  assertSnapshotMatchesHouse(exported.snapshot, house.houseId);
  const sealed = await sealAgentStateSnapshot(exported.snapshot, house.houseId);
  const response = await putHouseAgentStateSnapshot(house.houseId, sealed);
  const when = response?.updatedAt ? new Date(response.updatedAt).toLocaleString() : 'now';
  setAgentStateStatus(`Saved encrypted agent state to house (${formatBytes(exported.sizeBytes)} at ${when}).`);
  setAgentStateError('');
  return exported;
}

async function downloadAgentStateBackup() {
  if (!unlocked || !house) throw new Error('LOCKED');
  await persistMindConfigDraftIfPresent();
  const exported = await exportLocalAgentStateSnapshot();
  assertSnapshotMatchesHouse(exported.snapshot, house.houseId);
  const gateway = await loadLiteGateway();
  if (!gateway || typeof gateway.send !== 'function') throw new Error('RUNTIME_NOT_READY');
  gateway.send({ type: 'gateway.command.exportZip' });
  setAgentStateStatus('Downloaded OpenClaw-compatible ZIP from local runtime.');
  setAgentStateError('');
  return { format: AGENT_STATE_OPENCLAW_EXPORT_KIND };
}

async function uploadAgentStateBackup(file) {
  if (!unlocked || !house) throw new Error('LOCKED');
  if (!file) throw new Error('INVALID_AGENT_STATE');
  if (file.size > AGENT_STATE_MAX_BYTES) throw new Error('AGENT_STATE_TOO_LARGE');
  let sourceSnapshot;
  if (isZipFile(file)) {
    const bytes = await readFileAsBytes(file);
    sourceSnapshot = await parseZipBackupToSnapshot(bytes, house.houseId);
  } else {
    const raw = await readTextFile(file);
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('INVALID_AGENT_STATE');
    }
    sourceSnapshot = parsed;
  }
  const plainSnapshot = await resolveSnapshotForLocalImport(sourceSnapshot, house.houseId);
  const imported = await replaceLocalAgentStateSnapshot(plainSnapshot);
  await hydrateMindConfigFromLocal({ silent: true });
  const sealed = await sealAgentStateSnapshot(imported.snapshot, house.houseId);
  await putHouseAgentStateSnapshot(house.houseId, sealed);
  setAgentStateStatus(`Uploaded and replaced agent state (${formatBytes(imported.sizeBytes)}).`);
  setAgentStateError('');
  return imported;
}

async function appendEntry() {
  if (!unlocked || !house || !Kenc) throw new Error('LOCKED');
  armAutoLock();
  const type = el('entryType').value;
  const text = el('entryText').value;
  const payload = {
    v: 1,
    id: `e_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    ts: Date.now(),
    author: 'human',
    type,
    body: { text }
  };
  const pt = new TextEncoder().encode(JSON.stringify(payload));
  const aad = new TextEncoder().encode(`house=${house.houseId}`);
  const enc = await aesGcmEncrypt(Kenc, pt, aad);
  const ciphertext = { alg: 'AES-GCM', iv: b64(enc.iv), ct: b64(enc.ct) };

  const url = `/api/house/${encodeURIComponent(house.houseId)}/append`;
  const body = JSON.stringify({ ciphertext, author: 'human' });
  await houseApi(house.houseId, url, { method: 'POST', body });

  el('entryText').value = '';
  await refreshEntries();
}

function setAnchorStatus(msg) {
  const s = el('anchorStatus');
  if (s) s.textContent = msg || '';
}
function setAnchorError(msg) {
  const e = el('anchorError');
  if (e) e.textContent = msg || '';
}

function parseAgent0Erc8004Id(str) {
  // Agent0 currently returns `chainId:agentId` (e.g. "11155111:123").
  if (!str || typeof str !== 'string') return null;
  const m = str.trim().match(/^(\d+):(.+)$/);
  if (!m) return null;
  return { chainId: Number(m[1]), id: m[2] };
}

function renderAnchors(anchorLinks) {
  const mainEl = el('anchorsMainnet');
  const devEl = el('anchorsDevnet');
  if (!mainEl || !devEl) return;

  const main = [];
  const dev = [];

  for (const a of anchorLinks) {
    const pub = a.discoverable ? ' · discoverable' : '';
    const label = `${a.erc8004Id}${a.signer ? ` (signer ${a.signer.slice(0, 6)}…${a.signer.slice(-4)})` : ''}${pub}`;
    const parsed = parseAgent0Erc8004Id(a.erc8004Id);
    const chainId = parsed?.chainId ?? a.chainId ?? null;
    // classification: 1 = Ethereum mainnet, 11155111 = Sepolia
    if (chainId === 1) main.push(`Ethereum: ${label}`);
    else if (chainId === 11155111) dev.push(`Sepolia: ${label}`);
    else if (chainId) dev.push(`Chain ${chainId}: ${label}`);
    else dev.push(label);
  }

  mainEl.textContent = main.length ? main.join('\n') : '—';
  devEl.textContent = dev.length ? dev.join('\n') : '—';
}

async function refreshEntries() {
  if (!unlocked || !house || !Kenc) return;
  const data = await houseApi(house.houseId, `/api/house/${encodeURIComponent(house.houseId)}/log`);
  const aad = new TextEncoder().encode(`house=${house.houseId}`);
  const lines = [];
  const anchorLinks = [];

  for (const entry of data.entries || []) {
    try {
      const iv = unb64(entry.ciphertext.iv);
      const ct = unb64(entry.ciphertext.ct);
      const pt = await aesGcmDecrypt(Kenc, iv, ct, aad);
      const obj = JSON.parse(new TextDecoder().decode(pt));

      const bodyText = obj.body?.text ?? (obj.body ? JSON.stringify(obj.body) : '');
      lines.push(`[${new Date(obj.ts).toLocaleString()}] (${obj.author}) ${obj.type}: ${bodyText}`);

      const b = obj.body || null;
      if (b && b.kind === 'anchor.link.v1' && b.anchor?.kind === 'erc8004' && typeof b.anchor?.erc8004Id === 'string') {
        anchorLinks.push({
          erc8004Id: b.anchor.erc8004Id,
          signer: b.proof?.signer || null,
          chainId: b.anchor?.chainId || null,
          discoverable: !!b.publish?.discoverable
        });
      }
    } catch (e) {
      lines.push(`[decrypt failed] ${e.message}`);
    }
  }

  el('entries').textContent = lines.join('\n\n');
  renderAnchors(anchorLinks);
}

async function loadPublicMedia() {
  if (!house) return;
  try {
    const data = await houseApi(house.houseId, `/api/house/${encodeURIComponent(house.houseId)}/public-media`);
    publicMedia = data.publicMedia || null;
    const prompt = publicMedia?.prompt || '';
    const promptEl = el('publicPrompt');
    if (promptEl) {
      promptEl.value = prompt;
      promptEl.setAttribute('maxlength', String(PUBLIC_MEDIA_PROMPT_MAX));
    }
    pendingPublicImage = null;
    refreshPublicPreview();
    setPublicMediaEnabled(true);
  } catch (e) {
    setPublicMediaError(e.message);
  }
}

async function submitPublicMedia() {
  if (!unlocked || !house) throw new Error('LOCKED');
  armAutoLock();
  const promptInput = el('publicPrompt');
  const prompt = promptInput ? promptInput.value.trim() : '';
  const imageUrl = currentPublicImageUrl();
  if (!imageUrl) throw new Error('PUBLIC_IMAGE_REQUIRED');
  if (!prompt) throw new Error('PUBLIC_PROMPT_REQUIRED');

  const body = { prompt };
  if (pendingPublicImage) body.image = pendingPublicImage;

  setPublicMediaStatus('Saving…');
  const res = await houseApi(
    house.houseId,
    `/api/house/${encodeURIComponent(house.houseId)}/public-media`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  publicMedia = res.publicMedia || null;
  pendingPublicImage = null;
  const fileEl = el('publicImage');
  if (fileEl) fileEl.value = '';
  setPublicMediaStatus('Saved');
  setTimeout(() => setPublicMediaStatus(''), 1200);
  refreshPublicPreview();
  setPublicMediaEnabled(true);
}

async function clearPublicMedia() {
  if (!unlocked || !house) throw new Error('LOCKED');
  armAutoLock();
  setPublicMediaStatus('Clearing…');
  const res = await houseApi(
    house.houseId,
    `/api/house/${encodeURIComponent(house.houseId)}/public-media`,
    { method: 'POST', body: JSON.stringify({ clear: true }) }
  );
  publicMedia = res.publicMedia || null;
  pendingPublicImage = null;
  const promptEl = el('publicPrompt');
  if (promptEl) promptEl.value = '';
  const fileEl = el('publicImage');
  if (fileEl) fileEl.value = '';
  setPublicMediaStatus('');
  refreshPublicPreview();
  setPublicMediaEnabled(true);
}

function loadShareCache() {
  try {
    const raw = localStorage.getItem(SHARE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.shareId !== 'string') return null;
    const houseId = currentHouseId();
    if (houseId && parsed.houseId && parsed.houseId !== houseId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveShareCache(payload) {
  try {
    const houseId = payload.houseId || currentHouseId();
    const next = { ...payload, houseId: houseId || null };
    localStorage.setItem(SHARE_CACHE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

function clearShareCache() {
  try {
    localStorage.removeItem(SHARE_CACHE_KEY);
  } catch {
    // ignore storage errors
  }
}

function currentHouseId() {
  const fromUrl = new URLSearchParams(window.location.search).get('house');
  if (fromUrl) return fromUrl;
  const idEl = el('houseId');
  const fromEl = idEl ? idEl.textContent : '';
  if (fromEl && fromEl !== '—') return fromEl;
  return null;
}

function toAbsoluteUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return new URL(path, window.location.origin).toString();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
    reader.readAsDataURL(file);
  });
}

function currentPublicImageUrl() {
  return pendingPublicImage || publicMedia?.imageUrl || null;
}

function refreshPublicPreview() {
  const prompt = el('publicPrompt')?.value?.trim() || '';
  renderPublicMediaPreview({
    imageUrl: currentPublicImageUrl(),
    prompt,
    pending: !!pendingPublicImage
  });
}

async function copyToClipboard(text, btn, label) {
  if (!text || !btn) return;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'Copied ✓';
    setTimeout(() => {
      btn.textContent = label;
    }, 1200);
  } catch {
    alert(text);
  }
}

async function initSharePanel() {
  const createBtn = el('createShareBtn');
  if (!createBtn) return;
  const shareStatus = el('shareStatus');
  const shareLinks = el('shareLinks');
  const shareAgentDot = el('shareAgentDot');
  const shareAgentStatusText = el('shareAgentStatusText');
  const shareAgentDotActive = el('shareAgentDotActive');
  const shareAgentStatusTextActive = el('shareAgentStatusTextActive');
  const shareRequirement = el('shareRequirement');
  const sharePressRow = el('sharePressRow');
  const shareHumanPress = el('shareHumanPress');
  const shareAgentPress = el('shareAgentPress');
  const shareAgentMsg = el('shareAgentMsg');
  const copyAgentBtn = el('copyAgentMsg');
  const shareError = el('shareError');
  const sharePublicEl = el('sharePublic');
  const openShareLink = el('openShareLink');
  const copyShareBtn = el('copyShareLink');
  const shareSetup = el('shareSetup');
  const shareActive = el('shareActive');
  const shareHumanPost = el('shareHumanPost');
  const shareAgentPost = el('shareAgentPost');
  const saveSharePosts = el('saveSharePosts');
  const sharePostsStatus = el('sharePostsStatus');
  const sharePostsError = el('sharePostsError');

  let sharePublicUrl = null;
  let agentMessage = '';
  let lastState = null;
  let teamCode = null;
  let tokenMode = false;
  let shareIdForPosts = null;
  let sharePostsLoadedFor = null;
  let sharePostRecord = null;
  let shareLookupHouseId = null;

  if (createBtn) createBtn.disabled = true;

  function setShareError(msg) {
    if (shareError) shareError.textContent = msg || '';
  }

  function setShareRequirement(msg) {
    if (shareRequirement) shareRequirement.textContent = msg || '';
  }

  function setSharePanelMode(hasShare) {
    if (shareSetup) shareSetup.classList.toggle('is-hidden', hasShare);
    if (shareActive) shareActive.classList.toggle('is-hidden', !hasShare);
    if (!hasShare) {
      setSharePostsStatus('');
      setSharePostsError('');
    }
  }

  function setSharePostsStatus(msg) {
    if (!sharePostsStatus) return;
    sharePostsStatus.textContent = msg || 'Saved';
    sharePostsStatus.style.display = msg ? 'inline-flex' : 'none';
  }

  function setSharePostsError(msg) {
    if (sharePostsError) sharePostsError.textContent = msg || '';
  }

  function isValidHttpUrl(value) {
    if (!value) return true;
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function updateSharePostInputs(state) {
    const nextHuman = state?.human?.xPostUrl ?? sharePostRecord?.xPostUrl ?? '';
    const nextAgent = state?.agent?.posts?.moltbookUrl ?? sharePostRecord?.agentPosts?.moltbookUrl ?? '';
    if (shareHumanPost && document.activeElement !== shareHumanPost && shareHumanPost.value !== nextHuman) {
      shareHumanPost.value = nextHuman;
    }
    if (shareAgentPost && document.activeElement !== shareAgentPost && shareAgentPost.value !== nextAgent) {
      shareAgentPost.value = nextAgent;
    }
  }

  async function hydrateSharePostsFromShare(shareId) {
    if (!shareId || shareId === sharePostsLoadedFor) return;
    sharePostsLoadedFor = shareId;
    try {
      const r = await api(`/api/share/${encodeURIComponent(shareId)}`);
      sharePostRecord = r.share || null;
      updateSharePostInputs(lastState);
    } catch (e) {
      if (e.message === 'NOT_FOUND') {
        sharePostRecord = null;
        shareIdForPosts = null;
        sharePostsLoadedFor = null;
        clearShareCache();
        setSharePostsError('Share not found. Regenerate the share link.');
        setSharePanelMode(false);
      }
    }
  }

  async function hydrateShareIdFromHouse(houseId) {
    if (!houseId || shareIdForPosts || shareLookupHouseId === houseId) return;
    shareLookupHouseId = houseId;
    try {
      const r = await api(`/api/share/by-house/${encodeURIComponent(houseId)}`);
      if (!r.shareId) return;
      shareIdForPosts = r.shareId;
      const payload = { shareId: r.shareId, sharePath: r.sharePath, houseId };
      saveShareCache(payload);
      updateShareLinks(payload);
    } catch (e) {
      if (e.message === 'NOT_FOUND') {
        shareLookupHouseId = null;
      }
    }
  }

  function resolveShareIdForPosts() {
    if (shareIdForPosts) return shareIdForPosts;
    const cached = loadShareCache();
    if (cached?.shareId) return cached.shareId;
    if (sharePublicUrl) {
      try {
        const url = new URL(sharePublicUrl);
        const parts = url.pathname.split('/').filter(Boolean);
        return parts[0] === 's' ? parts[1] || null : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  function updateAgentStatus(connected, name) {
    if (shareAgentDot && shareAgentStatusText) {
      shareAgentDot.className = `dot ${connected ? 'good' : ''}`;
      shareAgentStatusText.textContent = connected
        ? `Agent connected${name ? `: ${name}` : ''}`
        : 'Agent not connected';
    }
    if (shareAgentDotActive && shareAgentStatusTextActive) {
      shareAgentDotActive.className = `dot ${connected ? 'good' : ''}`;
      shareAgentStatusTextActive.textContent = connected
        ? `Agent connected${name ? `: ${name}` : ''}`
        : 'Agent not connected';
    }
  }

  function updateAgentMessage() {
    if (!shareAgentMsg) return;
    const hid = currentHouseId();
    const origin = window.location.origin;
    agentMessage = hid
      ? `Read ${origin}/skill.md and reconnect to house: ${hid}`
      : `Read ${origin}/skill.md and reconnect to house: <houseId>`;
    shareAgentMsg.textContent = agentMessage;
  }

  function updateRequirementFromState(state) {
    if (!state) {
      setShareRequirement('Share links require a co-op house ceremony and agent approval so referrals stay attributable.');
      return;
    }
    if (state.share?.id) {
      setShareRequirement('Share link is active. New signups from it count as referrals.');
      return;
    }
    if (state.signup?.mode === 'token' || state.signup?.mode === 'claim') {
      setShareRequirement('Token holder flow: generate a share link (no agent approval required).');
      return;
    }
    if (!state.houseId) {
      setShareRequirement('Finish the co-op house ceremony first (needs the agent reveal).');
      return;
    }
    const approval = state.shareApproval || {};
    const humanPressed = approval.human === true;
    const agentPressed = approval.agent === true || state.agent?.connected;
    if (humanPressed && agentPressed) {
      setShareRequirement('Both approved. Generate the share link.');
      return;
    }
    if (humanPressed && !agentPressed) {
      setShareRequirement('Waiting on agent approval. Ask them to reconnect to this house.');
      return;
    }
    if (!humanPressed && agentPressed) {
      setShareRequirement('Agent approved. Press Generate share link to approve and create it.');
      return;
    }
    setShareRequirement('Press Generate share link, then have your agent reconnect to approve.');
  }

  function updatePressStatus(state) {
    if (!sharePressRow || !shareHumanPress || !shareAgentPress) return;
    const approval = state?.shareApproval || {};
    const humanPressed = approval.human === true;
    const agentPressed = approval.agent === true || state?.agent?.connected;
    shareHumanPress.textContent = `Human pressed: ${humanPressed ? 'yes' : 'no'}`;
    shareAgentPress.textContent = `Agent pressed: ${agentPressed ? 'yes' : 'no'}`;
  }

  function updateShareLinks({ shareId, sharePath }) {
    const resolvedSharePath = sharePath || (shareId ? `/s/${shareId}` : null);
    sharePublicUrl = toAbsoluteUrl(resolvedSharePath);
    if (shareId) {
      shareIdForPosts = shareId;
      hydrateSharePostsFromShare(shareId);
    }

    if (sharePublicUrl && sharePublicEl && openShareLink && shareLinks) {
      sharePublicEl.textContent = sharePublicUrl;
      openShareLink.href = sharePublicUrl;
      shareLinks.classList.remove('is-hidden');
    }

    if (sharePublicUrl) {
      setSharePanelMode(true);
    }
  }

  function applyState(state) {
    lastState = state;
    teamCode = state?.teamCode || teamCode;
    tokenMode = state?.signup?.mode === 'token' || state?.signup?.mode === 'claim';
    if (state?.share?.id) shareIdForPosts = state.share.id;
    updateAgentStatus(!!state?.agent?.connected, state?.agent?.name || null);
    updatePressStatus(state);
    updateRequirementFromState(state);
    updateAgentMessage();
    document.querySelectorAll('.share-agent-only').forEach((node) => {
      node.classList.toggle('is-hidden', tokenMode);
    });
    updateSharePostInputs(state);
    if (createBtn && state) {
      const eligible = !!state.houseId && !state.share?.id && !shareIdForPosts;
      createBtn.disabled = !eligible;
    }
    const shareId = state?.share?.id || shareIdForPosts || null;
    if (shareId) {
      const cached = loadShareCache();
      const payload = {
        shareId,
        sharePath: `/s/${shareId}`,
        houseId: cached && cached.shareId === shareId ? cached.houseId : currentHouseId()
      };
      updateShareLinks(payload);
      if (!state?.share?.id && shareIdForPosts) {
        setShareRequirement('Share link is active (recovered from house).');
      }
    } else {
      setSharePanelMode(false);
      hydrateShareIdFromHouse(state?.houseId || currentHouseId());
    }
  }

  if (copyShareBtn) {
    copyShareBtn.textContent = SHARE_COPY_LABEL;
    copyShareBtn.addEventListener('click', () => copyToClipboard(sharePublicUrl, copyShareBtn, SHARE_COPY_LABEL));
  }

  if (copyAgentBtn) {
    copyAgentBtn.textContent = AGENT_COPY_LABEL;
    copyAgentBtn.addEventListener('click', () => copyToClipboard(agentMessage, copyAgentBtn, AGENT_COPY_LABEL));
  }

  if (saveSharePosts) {
    saveSharePosts.addEventListener('click', async () => {
      setSharePostsError('');
      const humanUrl = shareHumanPost ? shareHumanPost.value.trim() : '';
      const agentUrl = shareAgentPost ? shareAgentPost.value.trim() : '';
      if (shareHumanPost && !isValidHttpUrl(humanUrl)) {
        setSharePostsError('Enter a valid X post URL (http/https).');
        return;
      }
      if (shareAgentPost && !tokenMode && !isValidHttpUrl(agentUrl)) {
        setSharePostsError('Enter a valid Moltbook URL (http/https).');
        return;
      }
      if (saveSharePosts) saveSharePosts.disabled = true;
      setSharePostsStatus('Saving…');
      try {
        const houseId = currentHouseId();
        if (houseId && KauthKey) {
          const r = await houseApi(houseId, `/api/house/${encodeURIComponent(houseId)}/posts`, {
            method: 'POST',
            body: JSON.stringify({
              xPostUrl: humanUrl,
              moltbookUrl: tokenMode ? null : agentUrl
            })
          });
          if (r?.shareId) {
            shareIdForPosts = r.shareId;
            updateShareLinks({ shareId: r.shareId, sharePath: r.sharePath, houseId });
            await hydrateSharePostsFromShare(r.shareId);
          }
          setSharePostsStatus('Saved');
          setTimeout(() => setSharePostsStatus(''), 1200);
          return;
        }

        const shareId = resolveShareIdForPosts();
        if (shareId) shareIdForPosts = shareId;
        if (shareHumanPost) {
          await api('/api/human/posts', {
            method: 'POST',
            body: JSON.stringify({ xPostUrl: humanUrl, shareId: shareIdForPosts })
          });
        }
        if (shareAgentPost && !tokenMode && agentUrl) {
          if (!teamCode) throw new Error('TEAM_CODE_MISSING');
          await api('/api/agent/posts', { method: 'POST', body: JSON.stringify({ teamCode, moltbookUrl: agentUrl }) });
        }
        if (shareIdForPosts) {
          await hydrateSharePostsFromShare(shareIdForPosts);
        }
        setSharePostsStatus('Saved');
        setTimeout(() => setSharePostsStatus(''), 1200);
      } catch (e) {
        const msg = e.message === 'TEAM_CODE_MISSING'
          ? 'Team code missing. Refresh the page and try again.'
          : e.message === 'SHARE_NOT_FOUND'
            ? 'Share not found for this session. Regenerate the share link.'
          : e.message === 'NOT_FOUND'
            ? 'Share not found for this house. Generate a share link first.'
          : e.message === 'HTTP_404'
            ? 'Missing /api/human/posts. Restart the server and try again.'
          : e.message === 'INVALID_URL'
            ? 'Enter a valid URL (http/https).'
            : e.message;
        setSharePostsError(msg);
        setSharePostsStatus('');
      } finally {
        if (saveSharePosts) saveSharePosts.disabled = false;
      }
    });
  }

  createBtn.addEventListener('click', async () => {
    setShareError('');
    if (shareStatus) shareStatus.style.display = 'inline-flex';
    createBtn.disabled = true;
    try {
      const houseId = currentHouseId();
      if (houseId) {
        try {
          const existing = await api(`/api/share/by-house/${encodeURIComponent(houseId)}`);
          if (existing?.shareId) {
            const payload = { shareId: existing.shareId, sharePath: existing.sharePath, houseId };
            saveShareCache(payload);
            updateShareLinks(payload);
            setShareRequirement('Share link is active. New signups from it count as referrals.');
            return;
          }
        } catch (e) {
          if (e.message !== 'NOT_FOUND' && e.message !== 'HTTP_404') throw e;
        }
      }

      if (houseId && KauthKey) {
        const r = await houseApi(houseId, `/api/house/${encodeURIComponent(houseId)}/share`, { method: 'POST' });
        const payload = { shareId: r.shareId, sharePath: r.sharePath, houseId };
        saveShareCache(payload);
        updateShareLinks(payload);
        setShareRequirement('Share link is active. New signups from it count as referrals.');
        return;
      }

      if (lastState?.signup?.mode === 'token') {
        await verifyTokenOwnershipForShare();
      }
      const r = await api('/api/share/create', { method: 'POST' });
      const payload = { shareId: r.shareId, sharePath: r.sharePath, houseId };
      saveShareCache(payload);
      updateShareLinks(payload);
      setShareRequirement('Share link is active. New signups from it count as referrals.');
    } catch (e) {
      const msg = e.message === 'AGENT_REQUIRED'
        ? 'Agent approval required. Ask your agent to reconnect to this house.'
        : e.message === 'HOUSE_NOT_READY'
          ? 'Finish the co-op house ceremony first.'
          : e.message === 'CEREMONY_INCOMPLETE'
            ? (KauthKey ? 'Share is unlocked, but ceremony state is missing. Refresh and try again.'
              : 'Waiting for agent ceremony exchange to complete.')
        : e.message === 'NO_TOKEN'
          ? 'No $ELIZATOWN found in this wallet.'
          : e.message === 'TOKEN_CHECK_REQUIRED'
            ? 'Verify your wallet to continue.'
            : e.message === 'TOKEN_ADDRESS_MISMATCH'
              ? 'Connect the same wallet used to create this house.'
              : e.message === 'ADDRESS_MISMATCH'
                ? 'Connect the same wallet used to create this house.'
                : e.message === 'BAD_SIGNATURE'
                  ? 'Wallet signature failed.'
                    : e.message === 'SIGNATURE_FORMAT'
                    ? 'Wallet signature failed.'
                    : e.message === 'NO_SOLANA_WALLET'
                      ? 'No Privy-connected Solana wallet found.'
                      : e.message === 'NO_SOLANA_SIGN'
                        ? 'Wallet does not support message signing.'
        : e.message === 'EMPTY_CANVAS'
          ? 'Add at least one pixel before generating a share link.'
          : e.message === 'STORE_FULL'
            ? 'Share limit reached. Try again later.'
            : e.message;
      setShareError(msg);
      if (e.message === 'AGENT_REQUIRED') {
        setShareRequirement('Ask your agent to reconnect to this house to approve sharing.');
      }
    } finally {
      if (shareStatus) shareStatus.style.display = 'none';
      createBtn.disabled = false;
    }
  });

  updateAgentMessage();
  setSharePanelMode(false);
  try {
    const state = await api('/api/state');
    applyState(state);
  } catch {
    updateRequirementFromState(null);
  }
  updatePressStatus(null);
  const cached = loadShareCache();
  if (cached && cached.shareId) {
    shareIdForPosts = cached.shareId;
    hydrateSharePostsFromShare(cached.shareId);
    updateShareLinks(cached);
  } else {
    hydrateShareIdFromHouse(currentHouseId());
  }
  const poll = async () => {
    try {
      const state = await api('/api/state');
      applyState(state);
    } catch {
      // ignore
    } finally {
      setTimeout(poll, 1200);
    }
  };
  poll();
}

async function init() {
  // If URL has ?house=<id>, auto-fill and try unlock.
  const params = new URLSearchParams(window.location.search);
  const houseId = params.get('house');

  el('connectWalletBtn').addEventListener('click', async () => {
    setError('');
    try {
      if (walletAddr) {
        const wasUnlocked = unlocked;
        await disconnectWallet({ resetSession: wasUnlocked });
        if (!wasUnlocked) setStatus('Wallet disconnected.');
        return;
      }
      await connectWallet();
      setStatus('Wallet connected.');
    } catch (e) {
      setError(
        e.message === 'NO_SOLANA_WALLET'
          ? 'No Privy-connected Solana wallet found.'
          : e.message === 'NO_SOLANA_SIGN'
            ? 'Wallet does not support message signing.'
            : e.message
      );
    }
  });

  el('unlockBtn').addEventListener('click', async () => {
    setError('');
    try {
      const urlHouseId = new URLSearchParams(window.location.search).get('house');
      let rid = urlHouseId || walletHouseId;
      if (!rid) {
        rid = await lookupWalletHouseId();
      }
      if (!rid || rid === '—') throw new Error('NO_HOUSE_ID');
      await unlockExistingHouse(rid);
    } catch (e) {
      setError(e.message);
    }
  });

  const houseEconomyExpandBtn = el('houseEconomyExpandBtn');
  if (houseEconomyExpandBtn) {
    houseEconomyExpandBtn.addEventListener('click', async () => {
      const houseId = currentHouseId();
      if (!houseId || !KauthKey) {
        setHouseEconomyError('Unlock this house before spending OIL.');
        return;
      }
      setHouseEconomyError('');
      setHouseEconomyStatus('Expanding house footprint...');
      try {
        const payload = await houseApi(
          houseId,
          `/api/house/${encodeURIComponent(houseId)}/economy/footprint/expand`,
          {
            method: 'POST',
            body: JSON.stringify({}),
          }
        );
        const data = payload?.economy || payload?.data || payload || {};
        renderHouseEconomySummary(data);
        setHouseEconomyExpandState(data);
        setHouseEconomyStatus(`Footprint expanded to ${Number(data?.footprint?.tiles || 0)} tiles.`);
      } catch (error) {
        setHouseEconomyStatus('');
        setHouseEconomyError(describeHouseEconomyError(error));
        await refreshHouseEconomyPanel({ preserveStatus: true });
      }
    });
  }

  el('toggleDescriptorBtn').addEventListener('click', () => {
    if (!unlocked) return;
    setDescriptorOpen(!descriptorOpen);
  });

  el('toggleErc8004Btn').addEventListener('click', () => {
    if (!unlocked) return;
    setErc8004Open(!erc8004Open);
  });

  // Ceremony-only publish: no on-page "create house" button.

  el('appendBtn').addEventListener('click', async () => {
    setError('');
    try {
      await appendEntry();
    } catch (e) {
      setError(e.message);
    }
  });

  el('lockBtn').addEventListener('click', () => {
    wipeKeys();
    setStatus('Locked (key wiped from memory).');
  });

  const saveAgentStateBtn = el('saveAgentStateBtn');
  if (saveAgentStateBtn) {
    saveAgentStateBtn.addEventListener('click', async () => {
      setAgentStateError('');
      setAgentStateBusy(true);
      try {
        await saveAgentStateToHouse();
      } catch (err) {
        setAgentStateError(mapAgentStateError(err));
      } finally {
        setAgentStateBusy(false);
      }
    });
  }

  const restoreAgentStateBtn = el('restoreAgentStateBtn');
  if (restoreAgentStateBtn) {
    restoreAgentStateBtn.addEventListener('click', async () => {
      setAgentStateError('');
      setAgentStateBusy(true);
      try {
        await restoreAgentStateFromHouse({ silent: false });
      } catch (err) {
        setAgentStateError(mapAgentStateError(err));
      } finally {
        setAgentStateBusy(false);
      }
    });
  }

  const downloadAgentStateBtn = el('downloadAgentStateBtn');
  if (downloadAgentStateBtn) {
    downloadAgentStateBtn.addEventListener('click', async () => {
      setAgentStateError('');
      setAgentStateBusy(true);
      try {
        await downloadAgentStateBackup();
      } catch (err) {
        setAgentStateError(mapAgentStateError(err));
      } finally {
        setAgentStateBusy(false);
      }
    });
  }

  const uploadAgentStateBtn = el('uploadAgentStateBtn');
  const uploadAgentStateInput = el('uploadAgentStateInput');
  if (uploadAgentStateBtn && uploadAgentStateInput) {
    uploadAgentStateBtn.addEventListener('click', () => {
      if (uploadAgentStateBtn.disabled) return;
      uploadAgentStateInput.click();
    });
    uploadAgentStateInput.addEventListener('change', async () => {
      const file = uploadAgentStateInput.files && uploadAgentStateInput.files[0];
      uploadAgentStateInput.value = '';
      if (!file) return;
      setAgentStateError('');
      setAgentStateBusy(true);
      try {
        await uploadAgentStateBackup(file);
      } catch (err) {
        setAgentStateError(mapAgentStateError(err));
      } finally {
        setAgentStateBusy(false);
      }
    });
  }

  const llmProviderInput = el('llmProviderSelect');
  const llmModelInput = el('llmModelIdInput');
  const llmAuthModeInput = el('llmAuthModeSelect');
  const llmOauthInput = el('llmOauthProfileInput');
  const llmOauthLaunchBtn = el('llmOauthLaunchBtn');
  const llmOauthCompleteBtn = el('llmOauthCompleteBtn');
  if (llmProviderInput && llmModelInput) {
    const selected = applyMindProviderModelSelection(
      llmProviderInput.value || MIND_DEFAULT_PROVIDER,
      llmModelInput.value || MIND_DEFAULT_MODEL
    );
    llmProviderInput.value = selected.provider;
    llmModelInput.value = selected.model;
  }
  if (llmProviderInput) {
    llmProviderInput.addEventListener('change', () => {
      const provider = applyMindProviderSelection(llmProviderInput.value || MIND_DEFAULT_PROVIDER);
      if (llmModelInput) applyMindModelSelection(provider, llmModelInput.value || '');
      syncMindModelRefFromInputs();
      setMindAuthModeUi(llmAuthModeInput?.value);
    });
  }
  if (llmModelInput) {
    if (llmModelInput.tagName === 'SELECT') {
      llmModelInput.addEventListener('change', () => syncMindModelRefFromInputs());
    } else {
      llmModelInput.addEventListener('input', () => syncMindModelRefFromInputs());
    }
  }
  if (llmAuthModeInput) {
    llmAuthModeInput.addEventListener('change', () => {
      setMindAuthModeUi(llmAuthModeInput.value);
      syncMindModelRefFromInputs();
    });
  }
  if (llmOauthInput) {
    llmOauthInput.addEventListener('input', () => syncMindModelRefFromInputs());
  }
  if (llmOauthLaunchBtn) {
    llmOauthLaunchBtn.addEventListener('click', async () => {
      try {
        await launchMindOauthInNewTab();
      } catch (err) {
        const msg = String(err?.message || 'OAUTH_START_FAILED');
        if (msg === 'POPUP_BLOCKED') {
          setMindConfigError('Popup blocked. Allow popups and retry OAuth launch.');
          return;
        }
        setMindConfigError(`OAuth start failed: ${msg}`);
      }
    });
  }
  if (llmOauthCompleteBtn) {
    llmOauthCompleteBtn.addEventListener('click', async () => {
      const callbackInput = String(el('llmOauthProfileInput')?.value || '').trim();
      try {
        await completeMindOpenAiCodexOAuthFromUi({ callbackInput });
      } catch (err) {
        const msg = String(err?.message || '').trim();
        if (msg === 'CODE_PENDING') {
          setMindConfigStatus('Waiting for OAuth callback. Finish sign-in, then click Complete OAuth again.');
          setMindConfigError('');
        }
      }
    });
  }
  setMindAuthModeUi(llmAuthModeInput?.value);
  syncMindModelRefFromInputs();

  const saveMindConfigBtn = el('llmSaveBtn');
  if (saveMindConfigBtn) {
    saveMindConfigBtn.addEventListener('click', async () => {
      setMindConfigError('');
      setAgentStateBusy(true);
      try {
        await saveMindConfigToLocal();
      } catch (err) {
        setMindConfigError(mapMindConfigError(err));
      } finally {
        setAgentStateBusy(false);
      }
    });
  }

  const clearMindConfigBtn = el('llmClearBtn');
  if (clearMindConfigBtn) {
    clearMindConfigBtn.addEventListener('click', async () => {
      setMindConfigError('');
      setAgentStateBusy(true);
      try {
        await clearMindConfigFromLocal();
      } catch (err) {
        setMindConfigError(mapMindConfigError(err));
      } finally {
        setAgentStateBusy(false);
      }
    });
  }

  el('copyDescriptorBtn').addEventListener('click', async () => {
    setError('');
    try {
      const txt = el('descriptor').value;
      await navigator.clipboard.writeText(txt);
      el('copyDescriptorBtn').textContent = 'Copied ✓';
      setTimeout(() => (el('copyDescriptorBtn').textContent = 'Copy descriptor'), 1200);
    } catch {
      // fallback
      alert(el('descriptor').value);
    }
  });

  el('copyErc8004Btn').addEventListener('click', async () => {
    setError('');
    try {
      const txt = el('erc8004').value;
      await navigator.clipboard.writeText(txt);
      el('copyErc8004Btn').textContent = 'Copied ✓';
      setTimeout(() => (el('copyErc8004Btn').textContent = 'Copy ERC-8004 statement'), 1200);
    } catch {
      alert(el('erc8004').value);
    }
  });

  el('mintErc8004Btn').addEventListener('click', async () => {
    setError('');
    try {
      await mintErc8004Identity();
    } catch (e) {
      setError(e.message);
    }
  });

  const linkAnchorBtn = el('linkAnchorBtn');
  if (linkAnchorBtn) {
    linkAnchorBtn.addEventListener('click', async () => {
      setAnchorError('');
      try {
        const id = el('anchorErc8004Id')?.value || '';
        await linkErc8004AnchorToVault(id);
      } catch (e) {
        setAnchorStatus('');
        setAnchorError(e.message);
      }
    });
  }

  const publicImage = el('publicImage');
  if (publicImage) {
    publicImage.addEventListener('change', async (evt) => {
      setPublicMediaError('');
      setPublicMediaStatus('');
      const file = evt.target.files && evt.target.files[0];
      if (!file) {
        pendingPublicImage = null;
        refreshPublicPreview();
        setPublicMediaEnabled(true);
        return;
      }
      if (!PUBLIC_MEDIA_TYPES.has(file.type)) {
        pendingPublicImage = null;
        publicImage.value = '';
        setPublicMediaError('Unsupported file type. Use PNG, JPG, or WebP.');
        setPublicMediaEnabled(true);
        return;
      }
      if (file.size > PUBLIC_MEDIA_MAX_BYTES) {
        pendingPublicImage = null;
        publicImage.value = '';
        setPublicMediaError('Image too large. Max 1 MB.');
        setPublicMediaEnabled(true);
        return;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        pendingPublicImage = dataUrl;
        refreshPublicPreview();
        setPublicMediaEnabled(true);
      } catch (e) {
        pendingPublicImage = null;
        setPublicMediaError(e.message);
        setPublicMediaEnabled(true);
      }
    });
  }

  const publicPrompt = el('publicPrompt');
  if (publicPrompt) {
    publicPrompt.addEventListener('input', () => {
      setPublicMediaStatus('');
      setPublicMediaError('');
      refreshPublicPreview();
    });
  }

  const publicUploadBtn = el('publicUploadBtn');
  if (publicUploadBtn) {
    publicUploadBtn.addEventListener('click', async () => {
      setPublicMediaError('');
      try {
        await submitPublicMedia();
      } catch (e) {
        setPublicMediaStatus('');
        setPublicMediaError(e.message);
      }
    });
  }

  const publicClearBtn = el('publicClearBtn');
  if (publicClearBtn) {
    publicClearBtn.addEventListener('click', async () => {
      setPublicMediaError('');
      try {
        await clearPublicMedia();
      } catch (e) {
        setPublicMediaStatus('');
        setPublicMediaError(e.message);
      }
    });
  }

  initSharePanel();
  updateWalletUI();
  applyMindConfigToInputs({
    provider: MIND_DEFAULT_PROVIDER,
    model: MIND_DEFAULT_MODEL,
    credential: '',
    authMode: MIND_AUTH_API_KEY
  });
  setHousePanelButtonsEnabled(false);
  syncInboxNavLink();
  setStatus('Ready. Connect wallet, then create or unlock a house.');
  void refreshHouseEconomyPanel();
  restoreWalletConnection({ houseIdFromUrl: !!houseId });
}

init().catch((e) => {
  console.error(e);
  setError(e.message);
});
