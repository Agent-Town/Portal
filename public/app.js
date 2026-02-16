async function api(url, opts = {}) {
  const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
  const res = await fetch(url, {
    credentials: 'include',
    ...opts,
    headers
  });
  const data = await res.json().catch(() => ({}));
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

const HATCH_VISIBILITY_KEY = 'openclawLite:hatchVisible';
const AGENT_PANEL_MINIMIZED_KEY = 'agentTown:panel:minimized';

let elements = [];
let lastState = null;
let wallet = null;
let walletAddr = null;
let redirecting = false;
let pendingWalletCheck = false;
let pendingLiteConnect = false;
let pendingLlmSave = false;
let pendingLlmClear = false;
let pendingRuntimeBootstrap = false;
let runtimeBootstrapPromise = null;
let statusOverride = '';
let runtimeBootstrapDone = false;
let llmRestoreAttempted = false;
let llmLibraryPromise = null;
let runtimeBridgeInitKey = '';
const runtimeBridge = window.OpenClawLiteRuntimeBridge || null;
let liteGatewayPromise = null;
const DEFAULT_LOCAL_LITE_LLM = Object.freeze({
  loaded: false,
  configured: false,
  provider: null,
  model: null,
  modelRef: null,
  authMode: 'api-key',
  credential: '',
  apiKeySet: false
});
let localLiteLlm = { ...DEFAULT_LOCAL_LITE_LLM };

function b64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
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

function buildWalletLookupMessage({ address, nonce, houseId }) {
  const parts = ['ElizaTown House Lookup', `address: ${address}`, `nonce: ${nonce}`];
  if (houseId) parts.push(`houseId: ${houseId}`);
  return parts.join('\n');
}

function loadHatchVisible() {
  try {
    return localStorage.getItem(HATCH_VISIBILITY_KEY) === '1';
  } catch {
    return false;
  }
}

function setHatchVisible(value) {
  const on = !!value;
  try {
    localStorage.setItem(HATCH_VISIBILITY_KEY, on ? '1' : '0');
  } catch {
    // ignore storage errors
  }
  applyVisibility(lastState);
}

function loadAgentPanelMinimized() {
  try {
    const raw = localStorage.getItem(AGENT_PANEL_MINIMIZED_KEY);
    if (raw === null) return true;
    return raw !== '0';
  } catch {
    return true;
  }
}

function saveAgentPanelMinimized(minimized) {
  try {
    localStorage.setItem(AGENT_PANEL_MINIMIZED_KEY, minimized ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}

function setHatchStatus(text) {
  const status = el('hatchStatus');
  if (!status) return;
  status.textContent = text || '';
}

function setOpenError(text) {
  const node = el('openError');
  if (!node) return;
  node.textContent = text || '';
}

function setLiteLlmStatus(text) {
  const node = el('liteLlmStatus');
  if (!node) return;
  node.textContent = text || '';
}

function setLocalLiteLlm(config) {
  const provider = typeof config?.provider === 'string' ? config.provider.trim() : '';
  const model = typeof config?.model === 'string' ? config.model.trim() : '';
  const modelRef = typeof config?.modelRef === 'string' ? config.modelRef.trim() : '';
  const authMode = String(config?.authMode || '').trim() === 'oauth-json' ? 'oauth-json' : 'api-key';
  const credential = typeof config?.credential === 'string' ? config.credential : '';
  const configured = !!(config?.configured && provider && model && credential);

  localLiteLlm = {
    loaded: config?.loaded === false ? false : true,
    configured,
    provider: provider || null,
    model: model || null,
    modelRef: modelRef || (provider && model ? `${provider}/${model}` : null),
    authMode,
    credential,
    apiKeySet: !!(credential || config?.apiKeySet)
  };
  return localLiteLlm;
}

function getLocalLiteLlm() {
  return localLiteLlm;
}

function isLocalLiteLlmConfigured() {
  return !!getLocalLiteLlm().configured;
}

function liteState(state) {
  if (!state || typeof state !== 'object' || !state.lite || typeof state.lite !== 'object') return {};
  return state.lite;
}

const LLM_MODEL_OPTIONS_BY_PROVIDER = Object.freeze({
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

const LLM_PROVIDER_ALIASES = Object.freeze({
  glm: 'zai',
  qwen: 'qwen-portal'
});

const OAUTH_START_URL_BY_PROVIDER = Object.freeze({
  openai: 'https://chatgpt.com/auth/login',
  'openai-codex': 'https://chatgpt.com/auth/login'
});

function getSupportedLlmModels(provider) {
  const raw = String(provider || '').trim();
  const key = LLM_MODEL_OPTIONS_BY_PROVIDER[raw] ? raw : (LLM_PROVIDER_ALIASES[raw] || raw);
  const options = LLM_MODEL_OPTIONS_BY_PROVIDER[key];
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

function applyLlmProviderSelection(preferredProvider) {
  const providerSelect = el('llmProviderSelect');
  const fallbackProvider = 'openai';
  const selected = String(preferredProvider || providerSelect?.value || fallbackProvider).trim() || fallbackProvider;
  if (!providerSelect) return selected;
  if (providerSelect.tagName === 'SELECT') {
    const providers = Object.keys(LLM_MODEL_OPTIONS_BY_PROVIDER);
    replaceSelectOptions(providerSelect, providers);
    providerSelect.value = providers.includes(selected) ? selected : fallbackProvider;
    return String(providerSelect.value || fallbackProvider).trim() || fallbackProvider;
  }
  providerSelect.value = selected;
  return selected;
}

function applyLlmModelSelection(provider, preferredModel) {
  const modelSelect = el('llmModelIdInput');
  const fallbackModel = getDefaultLlmModelForProvider(provider);
  const selected = String(preferredModel || modelSelect?.value || '').trim();
  if (!modelSelect) return selected || fallbackModel;
  if (modelSelect.tagName === 'SELECT') {
    const models = getSupportedLlmModels(provider);
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

function applyLlmProviderModelSelection(provider, model) {
  const selectedProvider = applyLlmProviderSelection(provider);
  const selectedModel = applyLlmModelSelection(selectedProvider, model);
  return { provider: selectedProvider, model: selectedModel };
}

function getLlmOauthLaunchUrl(provider) {
  const key = String(provider || '').trim().toLowerCase();
  return OAUTH_START_URL_BY_PROVIDER[key] || '';
}

function updateLlmOauthLaunchUi() {
  const launchBtn = el('llmOauthLaunchBtn');
  if (!launchBtn) return;
  const provider = String(el('llmProviderSelect')?.value || 'openai').trim() || 'openai';
  const mode = readLlmAuthMode();
  const url = getLlmOauthLaunchUrl(provider);
  launchBtn.dataset.oauthUrl = url;
  launchBtn.style.display = mode === 'oauth-json' ? 'inline-flex' : 'none';
  launchBtn.disabled = !url;
  launchBtn.title = url
    ? 'Open OAuth sign-in in a new tab.'
    : 'OAuth launch is available for OpenAI providers only.';
}

function launchLlmOauthInNewTab() {
  const launchBtn = el('llmOauthLaunchBtn');
  if (!launchBtn) return;
  const url = String(launchBtn.dataset.oauthUrl || '').trim();
  const status = el('llmLine');
  if (!url) {
    if (status) status.textContent = 'OAuth launch is available for OpenAI providers only.';
    return;
  }
  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (!popup && status) {
    status.textContent = 'Popup blocked. Allow popups and retry OAuth launch.';
  }
}

function getDefaultLlmModelForProvider(provider) {
  const supported = getSupportedLlmModels(provider);
  if (supported.length > 0) return supported[0];
  return 'gpt-4o-mini';
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

function readLlmAuthMode() {
  const authModeSelect = el('llmAuthModeSelect');
  const mode = String(authModeSelect?.value || '').trim();
  return mode === 'oauth-json' ? 'oauth-json' : 'api-key';
}

function setLlmAuthModeUI(mode) {
  const authMode = mode === 'oauth-json' ? 'oauth-json' : 'api-key';
  const authModeSelect = el('llmAuthModeSelect');
  const oauthInput = el('llmOauthProfileInput');
  const oauthHint = el('llmOauthProfileHint');
  const keyInput = el('llmKeyInput');

  if (authModeSelect) authModeSelect.value = authMode;
  if (oauthInput) oauthInput.style.display = authMode === 'oauth-json' ? 'block' : 'none';
  if (keyInput) {
    keyInput.placeholder = authMode === 'oauth-json'
      ? 'Optional override token (usually auto-derived from OAuth input)'
      : 'LLM API key (stored locally)';
  }
  if (oauthHint) {
    oauthHint.textContent = authMode === 'oauth-json'
      ? 'Use "Sign in with ChatGPT" (subscription) and paste callback URL, auth JSON, or token here.'
      : '';
  }
  updateLlmOauthLaunchUi();
}

function resolveLlmModelRefFromInputs(provider, model) {
  const providerInput = String(provider || 'openai').trim();
  const normalizedProvider = LLM_PROVIDER_ALIASES[providerInput] || providerInput || 'openai';
  const modelTrim = String(model || '').trim();

  if (normalizedProvider === 'custom') {
    return parseModelRefFromText(modelTrim || 'gpt-4o-mini', 'openai', 'gpt-4o-mini');
  }

  const resolvedModel = modelTrim || getDefaultLlmModelForProvider(normalizedProvider);
  return {
    provider: normalizedProvider,
    modelId: resolvedModel,
    modelRef: `${normalizedProvider}/${resolvedModel}`
  };
}

function parseModelRefFromText(text, fallbackProvider = 'openai', fallbackModelId = 'gpt-4o-mini') {
  const ref = String(text || '').trim();
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

function getAccessTokenFromProfileValue(value) {
  if (!value || typeof value !== 'object') return '';
  const direct = typeof value.access === 'string' ? value.access.trim()
    : typeof value.access_token === 'string' ? value.access_token.trim()
      : typeof value.accessToken === 'string' ? value.accessToken.trim() : '';
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
    if (alias && profileMap[alias]) {
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
  if (!text) {
    return { ok: false, error: 'MISSING_OAUTH_PROFILE_JSON' };
  }

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

function resolveLlmConfigFromUi() {
  const providerSel = el('llmProviderSelect');
  const modelInput = el('llmModelIdInput');
  const modelRefInput = el('llmModelRefInput');
  const keyInput = el('llmKeyInput');
  const oauthInput = el('llmOauthProfileInput');

  const provider = String(providerSel?.value || 'openai').trim() || 'openai';
  const modelText = String(modelInput?.value || '').trim();
  const mode = readLlmAuthMode();

  const parsedModel = resolveLlmModelRefFromInputs(provider, modelText);
  const manualCredential = String(keyInput?.value || '').trim();
  let credential = manualCredential;
  let oauthError = '';

  if (mode === 'oauth-json') {
    const oauthText = String(oauthInput?.value || '').trim();
    const token = extractOAuthAccessToken(oauthText, provider);
    oauthError = oauthText && !token.ok ? String(token.error || 'INVALID_OAUTH_PROFILE_JSON') : '';
    const parsedCredential = token.ok ? String(token.token || '').trim() : '';
    credential = manualCredential || parsedCredential;
  }

  if (!credential) {
    const msg = mode === 'oauth-json'
      ? (oauthError || 'No access token found in OAuth profile JSON.')
      : `Missing ${provider === 'openai-codex' ? 'API key or OAuth token' : 'API key'} for ${parsedModel.provider}/${parsedModel.modelId}.`;
    throw new Error(msg);
  }

  return {
    provider: parsedModel.provider,
    model: parsedModel.modelId,
    modelRef: parsedModel.modelRef,
    authMode: mode,
    credential
  };
}

function isVendorLite(state) {
  return liteState(state).driver === 'vendor';
}

function isLiteConnected(state) {
  const connected = !!(state?.agent?.connected && state?.agent?.source === 'openclaw-lite');
  if (!connected) return false;
  if (isVendorLite(state) && !isLocalLiteLlmConfigured()) return false;
  return true;
}

function isAnyAgentConnected(state) {
  return !!state?.agent?.connected;
}

async function ensureVendorRuntimeBridge(state) {
  if (!runtimeBridge) return;
  if (!isVendorLite(state)) return;
  const teamCode = String(state?.teamCode || '').trim();
  if (!teamCode) return;

  const nextKey = `${teamCode}:vendor`;
  if (runtimeBridgeInitKey && runtimeBridgeInitKey !== nextKey) {
    runtimeBridge.dispose();
    runtimeBridgeInitKey = '';
  }
  if (runtimeBridgeInitKey === nextKey) return;

  await runtimeBridge.init({
    driver: 'vendor',
    teamCode
  });
  runtimeBridgeInitKey = nextKey;
}

async function loadLiteLlmLibrary() {
  if (!llmLibraryPromise) {
    llmLibraryPromise = import('/openclaw-lite/llm-config-library.js');
  }
  return llmLibraryPromise;
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
      .catch((err) => {
        console.warn('failed to load lite gateway', err);
        return null;
      });
  }
  return liteGatewayPromise;
}

function buildGatewayLlmPayload(config) {
  const provider = String(config?.provider || '').trim();
  const model = String(config?.model || '').trim();
  const modelRef = String(config?.modelRef || (provider && model ? `${provider}/${model}` : '')).trim();
  const credential = String(config?.credential || '').trim();

  if (!provider || !model || !modelRef || !credential) {
    return {
      type: 'gateway.command.setLlmConfig',
      apiKey: '',
      api: '',
      provider: '',
      modelRef: '',
      modelId: '',
      baseUrl: '',
      reasoning: '',
      useProxy: true
    };
  }

  const apiOverride = String(el('llmApiInput')?.value || '').trim();
  const baseUrlOverride = String(el('llmBaseUrlInput')?.value || '').trim();
  const useProxy = el('llmUseProxyInput') ? el('llmUseProxyInput').checked !== false : true;
  return {
    type: 'gateway.command.setLlmConfig',
    apiKey: credential,
    api: apiOverride || defaultProviderApi(provider),
    provider,
    modelRef,
    modelId: model,
    baseUrl: baseUrlOverride || defaultProviderBaseUrl(provider),
    reasoning: normalizeThinkingLevel(el('llmThinkingInput')?.value),
    useProxy
  };
}

async function applyGatewayLlmConfig(config) {
  const gatewayApi = await loadLiteGateway();
  if (!gatewayApi || typeof gatewayApi.send !== 'function') return;
  gatewayApi.send(buildGatewayLlmPayload(config));
}

function updateLiteAgentStatus(state) {
  const dot = el('liteAgentDot');
  const text = el('liteAgentStatus');
  if (!dot || !text) return;
  const lite = liteState(state);
  const failed = typeof lite.lastError === 'string' && lite.lastError;
  const liteConnected = isLiteConnected(state);
  dot.className = `dot ${liteConnected ? 'good' : ''}`;
  if (failed) {
    text.textContent = `OpenClaw Lite error: ${lite.lastError}`;
  } else if (isAnyAgentConnected(state) && state?.agent?.source === 'external') {
    text.textContent = 'External agent connected';
  } else {
    text.textContent = liteConnected ? 'Agent connected: OpenClaw Lite' : 'Agent offline';
  }
}

// Replaced by new implementation below
function applyVisibility(state) {
  const welcomePanel = el('welcomePanel');
  const hatchPanel = el('hatchPanel');
  const townPanel = el('townPanel');
  const sidebar = el('agentSidebar');
  const visible = loadHatchVisible();
  const vendor = isVendorLite(state);
  const liteConnected = isLiteConnected(state);
  const vendorNeedsSetup = vendor && (!isLocalLiteLlmConfigured() || !liteConnected);
  const onboardingComplete = vendor
    ? !vendorNeedsSetup
    : isAnyAgentConnected(state);

  const browserActive = el('browserPanel') && !el('browserPanel').classList.contains('is-hidden');

  if (welcomePanel) {
    const showWelcomePanel = !visible && !onboardingComplete;
    welcomePanel.classList.toggle('is-hidden', !showWelcomePanel);
  }

  if (hatchPanel) {
    const showHatchPanel = visible && !onboardingComplete;
    hatchPanel.classList.toggle('is-hidden', !showHatchPanel);
  }

  if (townPanel) {
    if (browserActive) {
      townPanel.classList.add('is-hidden');
    } else {
      const showTownPanel = onboardingComplete;
      townPanel.classList.toggle('is-hidden', !showTownPanel);
    }
  }

  // Keep the Agent panel available on every page/state.
  if (sidebar) sidebar.classList.remove('is-hidden');
}

async function connectWallet() {
  if (!window.solana) throw new Error('NO_SOLANA_WALLET');
  if (typeof window.solana.connect !== 'function') throw new Error('NO_SOLANA_WALLET');
  if (typeof window.solana.signMessage !== 'function') throw new Error('NO_SOLANA_SIGN');

  let resp = null;
  if (window.solana.isConnected && window.solana.publicKey) {
    wallet = window.solana;
  } else {
    resp = await window.solana.connect();
    wallet = window.solana;
  }
  const pk = resp?.publicKey || wallet?.publicKey;
  walletAddr = pk && typeof pk.toString === 'function' ? pk.toString() : null;
  if (!walletAddr) throw new Error('NO_SOLANA_PUBKEY');
  return walletAddr;
}

async function signWalletMessage(message) {
  if (!wallet) throw new Error('WALLET_NOT_CONNECTED');
  const msgBytes = new TextEncoder().encode(message);
  const resp = await wallet.signMessage(msgBytes, 'utf8');
  const sigBytes = resp?.signature || resp;
  const sigArr = normalizeSignatureBytes(sigBytes);
  if (!sigArr) throw new Error('SIGNATURE_FORMAT');
  return b64(sigArr);
}

async function lookupWalletHouse() {
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  const nonceResp = await api('/api/wallet/nonce');
  const msg = buildWalletLookupMessage({
    address: walletAddr,
    nonce: nonceResp.nonce,
    houseId: null
  });
  const signature = await signWalletMessage(msg);
  return api('/api/wallet/lookup', {
    method: 'POST',
    body: JSON.stringify({
      address: walletAddr,
      nonce: nonceResp.nonce,
      signature
    })
  });
}

async function checkWalletStep() {
  if (pendingWalletCheck) return;
  const step1 = el('step1');
  const step2 = el('step2');
  const walletStatus = el('walletStatus');
  const walletBtn = el('hatchWalletCheckBtn');

  pendingWalletCheck = true;
  if (walletBtn) walletBtn.disabled = true;
  if (walletStatus) walletStatus.textContent = 'Checking wallet...';

  const unlockStep2 = () => {
    if (step1) step1.classList.add('done');
    if (step2) {
      step2.classList.remove('disabled');
      step2.classList.add('active');
    }
    const providerInput = el('llmProviderSelect');
    if (providerInput) setTimeout(() => providerInput.focus(), 100);
  };

  try {
    await connectWallet();
    let lookup = null;
    try {
      lookup = await lookupWalletHouse();
    } catch (lookupErr) {
      const code = String(lookupErr?.message || '').trim();
      if (code === 'NONCE_MISMATCH') {
        lookup = await lookupWalletHouse();
      } else {
        throw lookupErr;
      }
    }
    if (lookup?.houseId) {
      statusOverride = 'House found! Redirecting...';
      if (walletStatus) walletStatus.textContent = statusOverride;
      window.location.href = `/house?house=${encodeURIComponent(lookup.houseId)}`;
      return;
    }

    // No house found - Proceed to Step 2 (LLM Config)
    if (walletStatus) {
      walletStatus.textContent = 'Wallet verified. Configure brain.';
      walletStatus.style.color = 'var(--good)';
    }
    unlockStep2();

    statusOverride = 'No existing house found. Continue setting up your OpenClaw Lite agent.';
    setHatchStatus(statusOverride);

  } catch (e) {
    const raw = String(e?.message || '').trim();
    const hasConnectedWallet = !!walletAddr;
    const msg = raw === 'NO_SOLANA_WALLET'
      ? 'No Solana wallet found.'
      : raw === 'NO_SOLANA_SIGN'
        ? 'Wallet cannot sign messages.'
        : raw === 'USER_REJECTED'
          ? 'Wallet signature was cancelled.'
          : raw.includes('USER_REJECTED')
            ? 'Wallet signature was cancelled.'
            : hasConnectedWallet
              ? 'Wallet connected. Lookup skipped. Configure brain to continue.'
              : 'Wallet check failed.';
    if (walletStatus) {
      walletStatus.textContent = msg;
      walletStatus.style.color = hasConnectedWallet ? 'var(--muted)' : 'var(--bad)';
    }
    if (hasConnectedWallet) {
      unlockStep2();
    }
    statusOverride = msg;
    setHatchStatus(statusOverride);
  } finally {
    pendingWalletCheck = false;
    if (walletBtn) walletBtn.disabled = false;
  }
}

// Kept for backward compat / direct calls if needed
async function runWalletProfileCheck() {
  await checkWalletStep();
}

async function connectLiteAgent() {
  if (pendingLiteConnect) return;
  if (isVendorLite(lastState) && !isLocalLiteLlmConfigured()) {
    statusOverride = 'Configure your local brain settings before connecting OpenClaw Lite.';
    setHatchStatus(statusOverride);
    return;
  }
  if (isVendorLite(lastState)) {
    const booted = await bootstrapVendorRuntime();
    if (!booted) {
      if (!String(statusOverride || '').startsWith('OpenClaw Lite runtime failed:')) {
        statusOverride = 'OpenClaw Lite runtime is starting…';
      }
      setHatchStatus(statusOverride);
      applyVisibility(lastState);
      return;
    }
  }
  pendingLiteConnect = true;
  setHatchStatus('Connecting OpenClaw Lite…');
  try {
    await api('/api/agent/lite/connect', {
      method: 'POST',
      body: JSON.stringify({})
    });
    statusOverride = 'OpenClaw Lite connected.';
  } catch (e) {
    statusOverride = `Agent connect failed: ${e.message}`;
  } finally {
    pendingLiteConnect = false;
    setHatchStatus(statusOverride);
    applyVisibility(lastState);
  }
}

async function bootstrapVendorRuntime() {
  if (runtimeBootstrapPromise) return runtimeBootstrapPromise;
  if (!isVendorLite(lastState)) return false;
  if (runtimeBootstrapDone) return true;

  runtimeBootstrapPromise = (async () => {
    pendingRuntimeBootstrap = true;
    try {
      const manifestResp = await fetch('/openclaw-lite/manifest.json', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!manifestResp.ok) throw new Error(`MANIFEST_HTTP_${manifestResp.status}`);
      const manifest = await manifestResp.json().catch(() => ({}));
      const runtimeWorkerPath = String(manifest?.entrypoints?.runtimeWorker || '/openclaw-lite/runtime-worker.js');
      fetch(runtimeWorkerPath, {
        credentials: 'include',
        cache: 'no-store'
      }).catch(() => null);
      if (lastState) {
        await ensureVendorRuntimeBridge(lastState);
      }
      runtimeBootstrapDone = true;
      setLiteLlmStatus('Runtime ready. Configure provider, model, and API key.');
      return true;
    } catch (e) {
      runtimeBootstrapDone = false;
      const msg = e?.message || 'RUNTIME_BOOT_FAILED';
      statusOverride = `OpenClaw Lite runtime failed: ${msg}`;
      setHatchStatus(statusOverride);
      setLiteLlmStatus(`Runtime failed: ${msg}`);
      return false;
    } finally {
      pendingRuntimeBootstrap = false;
      runtimeBootstrapPromise = null;
    }
  })();

  return runtimeBootstrapPromise;
}


function initAdvancedLlmUi() {
  const providerSel = el('llmProviderSelect');
  const modelInput = el('llmModelIdInput');
  const refInput = el('llmModelRefInput');
  const authModeSel = el('llmAuthModeSelect');
  const oauthInput = el('llmOauthProfileInput');
  const oauthLaunchBtn = el('llmOauthLaunchBtn');

  if (!providerSel || !modelInput || !refInput) return;
  if (providerSel.dataset.listening) return;
  providerSel.dataset.listening = 'true';
  const initialized = applyLlmProviderModelSelection(providerSel.value || 'openai', modelInput.value || '');
  providerSel.value = initialized.provider;
  modelInput.value = initialized.model;

  const updateRef = () => {
    syncModelRefFromInputs();
  };

  providerSel.addEventListener('change', () => {
    const selectedProvider = applyLlmProviderSelection(providerSel.value || 'openai');
    applyLlmModelSelection(selectedProvider, modelInput.value || '');
    updateRef();
    setLlmAuthModeUI(readLlmAuthMode());
  });

  if (modelInput.tagName === 'SELECT') {
    modelInput.addEventListener('change', updateRef);
  } else {
    modelInput.addEventListener('input', updateRef);
  }
  if (authModeSel && !authModeSel.dataset.listening) {
    authModeSel.dataset.listening = 'true';
    authModeSel.addEventListener('change', () => {
      setLlmAuthModeUI(readLlmAuthMode());
      syncModelRefFromInputs();
    });
  }
  if (oauthInput && !oauthInput.dataset.listening) {
    oauthInput.dataset.listening = 'true';
    oauthInput.addEventListener('input', () => syncModelRefFromInputs());
  }
  if (oauthLaunchBtn && !oauthLaunchBtn.dataset.listening) {
    oauthLaunchBtn.dataset.listening = 'true';
    oauthLaunchBtn.addEventListener('click', () => launchLlmOauthInNewTab());
  }
  setLlmAuthModeUI(readLlmAuthMode());
  syncModelRefFromInputs();
}

function syncModelRefFromInputs() {
  const providerSel = el('llmProviderSelect');
  const modelInput = el('llmModelIdInput');
  const refInput = el('llmModelRefInput');
  if (!providerSel || !modelInput || !refInput) return;
  const p = String(providerSel.value || 'openai').trim();
  const m = String(modelInput.value || '').trim();
  const resolved = resolveLlmModelRefFromInputs(p, m);
  refInput.value = m ? resolved.modelRef : '';
}

async function readLocalLiteLlmConfig() {
  const lib = await loadLiteLlmLibrary();
  const localCfg = await lib.loadLlmConfig();
  const providerRaw = typeof localCfg?.provider === 'string' ? localCfg.provider.trim() : '';
  const modelRaw = typeof localCfg?.model === 'string' ? localCfg.model.trim() : '';
  const modelRefRaw = typeof localCfg?.modelRef === 'string' ? localCfg.modelRef.trim() : '';
  const defaultProvider = providerRaw || 'openai';
  const defaultModel = modelRaw || getDefaultLlmModelForProvider(defaultProvider);
  const parsed = parseModelRefFromText(
    modelRefRaw || `${defaultProvider}/${defaultModel}`,
    defaultProvider,
    defaultModel
  );
  const provider = providerRaw || parsed.provider || defaultProvider;
  const model = modelRaw || parsed.modelId || defaultModel;
  const modelRef = modelRefRaw || parsed.modelRef || `${provider}/${model}`;
  const credential = typeof localCfg?.apiKey === 'string' ? localCfg.apiKey : '';
  const authMode = String(localCfg?.authMode || '').trim() === 'oauth-json' ? 'oauth-json' : 'api-key';
  return {
    loaded: true,
    configured: !!(localCfg?.configured && provider && model && credential),
    provider,
    model,
    modelRef,
    credential,
    authMode,
    apiKeySet: !!credential
  };
}

function applyLocalLiteLlmToInputs(config) {
  const providerSel = el('llmProviderSelect');
  const modelInput = el('llmModelIdInput');
  const keyInput = el('llmKeyInput');
  const authModeSel = el('llmAuthModeSelect');
  const oauthInput = el('llmOauthProfileInput');
  const mode = config?.authMode === 'oauth-json' ? 'oauth-json' : 'api-key';

  if (providerSel && modelInput) {
    const selected = applyLlmProviderModelSelection(config?.provider || 'openai', config?.model || '');
    providerSel.value = selected.provider;
    modelInput.value = selected.model;
  }
  if (keyInput) keyInput.value = mode === 'api-key' ? config?.credential || '' : '';
  if (authModeSel) setLlmAuthModeUI(mode);
  if (oauthInput) {
    if (mode === 'oauth-json') {
      oauthInput.value = config?.credential || '';
      oauthInput.placeholder = 'OAuth profile JSON/token used to derive this session credential.';
    } else {
      oauthInput.value = '';
      oauthInput.placeholder = 'Paste OpenAI/OAuth profile JSON (or raw token) for OAuth mode.';
    }
  }
  syncModelRefFromInputs();
}

async function restoreLiteLlmConfigFromLocalIfNeeded(state) {
  if (!isVendorLite(state)) return;
  if (llmRestoreAttempted) return;

  llmRestoreAttempted = true;
  try {
    const localCfg = setLocalLiteLlm(await readLocalLiteLlmConfig());
    applyLocalLiteLlmToInputs(localCfg);

    await applyGatewayLlmConfig(localCfg);
    if (runtimeBridge) {
      await ensureVendorRuntimeBridge(state);
      await runtimeBridge.setLlmConfig({
        provider: localCfg.configured ? localCfg.provider : '',
        model: localCfg.configured ? localCfg.model : '',
        apiKey: localCfg.configured ? localCfg.credential || '' : ''
      });
    }
    if (localCfg.configured) {
      setLiteLlmStatus(`Brain saved locally: ${localCfg.provider}/${localCfg.model}. Auto-restored on return.`);
    } else {
      setLiteLlmStatus('Not configured. Save provider, model, and API key.');
    }
    if (lastState) updateUI(lastState);
  } catch (e) {
    console.warn('local LLM restore skipped', e);
  }
}

// Replaces legacy saveLiteLlmConfig with gateway supervision
function initStep2Listener() {
  const btn = el('llmSaveBtn');
  if (!btn || btn.dataset.listening) return;
  btn.dataset.listening = 'true';

  btn.addEventListener('click', async () => {
    // Persist the LLM mind config locally and apply it to active local runtimes.
    const status = el('llmLine');
    const providerSel = el('llmProviderSelect');
    const modelInput = el('llmModelIdInput');
    const modelRefInput = el('llmModelRefInput');
    const keyInput = el('llmKeyInput');
    const oauthInput = el('llmOauthProfileInput');
    const authModeSel = el('llmAuthModeSelect');
    const clearBtn = el('llmClearBtn');

    if (!providerSel || !modelInput || !modelRefInput || !keyInput) {
      if (status) status.textContent = 'LLM form missing fields.';
      return;
    }

    if (status) status.textContent = 'Configuring brain...';
    if (clearBtn) clearBtn.disabled = true;
    btn.disabled = true;

    try {
      const config = resolveLlmConfigFromUi();
      keyInput.value = config.credential;
      if (modelRefInput) modelRefInput.value = config.modelRef;
      if (authModeSel) setLlmAuthModeUI(config.authMode);
      if (authModeSel) authModeSel.value = config.authMode;
      if (oauthInput && config.authMode !== 'oauth-json') oauthInput.value = '';

      const lib = await loadLiteLlmLibrary();
      await lib.saveLlmConfig({
        provider: config.provider,
        model: config.model,
        apiKey: config.credential,
        authMode: config.authMode
      });

      const localCfg = setLocalLiteLlm({
        loaded: true,
        configured: true,
        provider: config.provider,
        model: config.model,
        modelRef: config.modelRef,
        credential: config.credential,
        authMode: config.authMode,
        apiKeySet: true
      });
      await applyGatewayLlmConfig(localCfg);

      // Ensure runtime worker inherits local config for the current tab session.
      if (runtimeBridge && isVendorLite(lastState)) {
        try {
          await ensureVendorRuntimeBridge(lastState);
          await runtimeBridge.setLlmConfig({
            provider: config.provider,
            model: config.model,
            apiKey: config.credential
          });
        } catch (err) {
          console.warn('runtime bridge llm sync failed', err);
        }
      }

      await new Promise(r => setTimeout(r, 300));
      status.textContent = 'Brain configured.';
      setLiteLlmStatus(`Brain saved locally: ${config.provider}/${config.model}. Auto-restored on return.`);
      if (lastState) updateUI(lastState);

      const step2 = el('step2');
      if (step2) {
        step2.classList.add('done');
        step2.classList.remove('active');
      }
      setHatchStatus('Brain connected. Connecting agent...');
      if (isVendorLite(lastState)) {
        const booted = await bootstrapVendorRuntime();
        if (booted) {
          await connectLiteAgent();
        } else {
          setHatchStatus('Brain configured locally. Runtime boot failed.');
        }
      }
    } catch (e) {
      if (status) status.textContent = `Brain config failed: ${e.message}`;
      setHatchStatus(`Brain config failed: ${e.message}`);
      if (e) console.error('LLM config failed', e);
    } finally {
      if (clearBtn) clearBtn.disabled = false;
      btn.disabled = false;
    }
  });
}

function saveLiteLlmConfig() {
  // No-op, managed by gateway.js + initStep2Listener
}

async function clearLiteLlmConfig() {
  if (pendingLlmClear) return;
  const providerInput = el('llmProviderSelect');
  const modelInput = el('llmModelIdInput');
  const keyInput = el('llmKeyInput');
  const modelRefInput = el('llmModelRefInput');
  const authModeSel = el('llmAuthModeSelect');
  const oauthInput = el('llmOauthProfileInput');
  const clearBtn = el('llmClearBtn');
  if (!clearBtn) return;

  pendingLlmClear = true;
  clearBtn.disabled = true;
  setLiteLlmStatus('Clearing LLM configuration…');
  try {
    const lib = await loadLiteLlmLibrary();
    await lib.clearLlmConfig();
    setLocalLiteLlm({
      loaded: true,
      configured: false,
      provider: null,
      model: null,
      modelRef: null,
      credential: '',
      authMode: 'api-key',
      apiKeySet: false
    });
    await applyGatewayLlmConfig({ configured: false });
    if (authModeSel) {
      authModeSel.value = 'api-key';
      setLlmAuthModeUI('api-key');
    }
    if (providerInput && modelInput) {
      const selected = applyLlmProviderModelSelection('openai', getDefaultLlmModelForProvider('openai'));
      providerInput.value = selected.provider;
      modelInput.value = selected.model;
    }
    if (keyInput) keyInput.value = '';
    if (modelRefInput) {
      const resolved = resolveLlmModelRefFromInputs(providerInput?.value || 'openai', modelInput?.value || '');
      modelRefInput.value = resolved.modelRef;
    }
    if (oauthInput) oauthInput.value = '';
    if (runtimeBridge && isVendorLite(lastState)) {
      await ensureVendorRuntimeBridge(lastState);
      await runtimeBridge.setLlmConfig({ provider: '', model: '', apiKey: '' });
    }
    statusOverride = 'OpenClaw Lite LLM config cleared.';
    setLiteLlmStatus('Not configured. Save provider, model, and API key.');
    if (lastState) updateUI(lastState);
  } catch (e) {
    statusOverride = `LLM clear failed: ${e.message}`;
    setLiteLlmStatus(`LLM clear failed: ${e.message}`);
  } finally {
    pendingLlmClear = false;
    clearBtn.disabled = false;
    setHatchStatus(statusOverride);
  }
}

async function triggerVendorAgentSelect(elementId) {
  if (!isVendorLite(lastState)) return;
  if (!isLiteConnected(lastState)) return;
  const teamCode = String(lastState?.teamCode || '').trim();
  if (!teamCode) return;
  if (!runtimeBridge) throw new Error('RUNTIME_BRIDGE_MISSING');
  await ensureVendorRuntimeBridge(lastState);
  await runtimeBridge.selectSigil({ teamCode, elementId });
}

async function triggerVendorAgentOpenPress() {
  if (!isVendorLite(lastState)) return null;
  if (!isLiteConnected(lastState)) return null;
  const teamCode = String(lastState?.teamCode || '').trim();
  if (!teamCode) return null;
  if (!runtimeBridge) throw new Error('RUNTIME_BRIDGE_MISSING');
  await ensureVendorRuntimeBridge(lastState);
  return runtimeBridge.pressOpen({ teamCode });
}

function renderSigils(state) {
  const grid = el('sigilGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const humanSel = state?.human?.selected || null;
  const agentSel = state?.agent?.selected || null;

  for (const item of elements) {
    const btn = document.createElement('button');
    btn.className = 'btn sigil';
    btn.type = 'button';
    btn.setAttribute('data-testid', `sigil-${item.id}`);
    btn.dataset.elementId = item.id;

    const left = document.createElement('div');
    const icon = item.icon ? `<span class="sigilIcon" aria-hidden="true">${item.icon}</span>` : '';
    left.innerHTML = `<div class="name">${icon}<span>${item.label}</span></div><div class="hint">click to pick</div>`;

    const right = document.createElement('div');
    right.style.display = 'grid';
    right.style.gap = '6px';
    right.style.justifyItems = 'end';

    const you = document.createElement('div');
    you.className = 'pill';
    you.style.padding = '4px 8px';
    you.textContent = humanSel === item.id ? 'you' : '';

    const agent = document.createElement('div');
    agent.className = 'pill';
    agent.style.padding = '4px 8px';
    agent.textContent = agentSel === item.id ? 'agent' : '';

    right.appendChild(you);
    right.appendChild(agent);
    btn.appendChild(left);
    btn.appendChild(right);

    if (humanSel === item.id || agentSel === item.id) {
      btn.classList.add('selected');
    }

    btn.addEventListener('click', async () => {
      setOpenError('');
      try {
        await api('/api/human/select', {
          method: 'POST',
          body: JSON.stringify({ elementId: item.id })
        });
        if (isVendorLite(lastState)) {
          triggerVendorAgentSelect(item.id).catch((e) => {
            setOpenError(`Agent select failed: ${e.message}`);
          });
        }
      } catch (e) {
        setOpenError(`Select failed: ${e.message}`);
      }
    });

    grid.appendChild(btn);
  }
}

function updateMatchUi(state) {
  const matched = !!state?.match?.matched;
  const matchState = el('matchState');
  const matchDetail = el('matchDetail');
  const openBtn = el('openBtn');
  const openWaiting = el('openWaiting');
  const complete = !!state?.signup?.complete && state?.signup?.mode === 'agent';

  if (matchState) {
    matchState.textContent = matched ? 'UNLOCKED' : 'LOCKED';
    matchState.className = `state ${matched ? 'good' : 'bad'}`;
  }
  if (matchDetail) {
    matchDetail.textContent = matched
      ? `Matched on "${state.match.elementId}". Press Open.`
      : 'Pick the same sigil to unlock.';
  }
  if (openBtn) {
    openBtn.disabled = !matched || complete;
  }
  if (openWaiting) {
    const waiting = !!state?.human?.openPressed && !complete;
    openWaiting.style.display = waiting ? 'inline-flex' : 'none';
  }
}

function renderAgentReveal(state) {
  const container = el('agentReveal');
  if (!container) return;

  // Clean container
  container.innerHTML = '';

  const agentId = state?.agent?.id || '???';
  const name = state?.agent?.name || `Agent #${agentId}`;

  // Create reveal card
  const card = document.createElement('div');
  card.className = 'agent-card';
  card.style.textAlign = 'center';

  // Use local placeholder to avoid CSP issues with external DiceBear API
  // const imgUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${agentId}&backgroundColor=1a1a1a`;
  const imgUrl = '/logo.jpg'; // Fallback to local logo

  card.innerHTML = `
    <div style="width: 120px; height: 120px; margin: 0 auto 16px; border-radius: 12px; overflow: hidden; border: 4px solid #f2c874; box-shadow: 0 0 20px rgba(242, 200, 116, 0.3);">
      <img src="${imgUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
    <h3 style="margin: 0; color: var(--text); font-size: 20px;">${name}</h3>
    ${agentId && agentId !== '???' ? `<div class="pill" style="margin-top: 8px;">ID: ${agentId}</div>` : ''}
  `;

  container.appendChild(card);
}

async function renderCanvas(state) {
  const cvs = el('mainCanvas');
  if (!cvs) return;
  // Fetch image
  try {
    const res = await api(`/api/agent/canvas/image?teamCode=${state.teamCode}`);
    if (res.image) {
      const img = new Image();
      img.onload = () => {
        const ctx = cvs.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
      };
      img.src = res.image;
    }
  } catch (e) {
    // ignore
  }

  // Paint listener
  if (!cvs.dataset.listening) {
    cvs.dataset.listening = 'true';
    cvs.addEventListener('click', async (e) => {
      const rect = cvs.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / (rect.width / 16));
      const y = Math.floor((e.clientY - rect.top) / (rect.height / 16));
      const color = 2; // red default
      await api('/api/human/canvas/paint', {
        method: 'POST',
        body: JSON.stringify({ x, y, color })
      });
      renderCanvas(lastState);
    });
  }
}

function renderCeremony(state) {
  const kv = el('ceremonyKv');
  if (!kv) return;
  const status = el('ceremonyStatus');
  if (status) status.classList.remove('is-hidden');

  if (!state.houseId) {
    kv.innerHTML = `<div>Waiting for ceremony completion...</div>`;
  } else {
    kv.innerHTML = `<div>House Created: ${state.houseId}</div>`;
  }
}

// --- Dock Minimize Logic ---
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('minimizeChatBtn');
  const dock = document.getElementById('agentSidebar');
  const header = document.querySelector('.sidebar-header');

  if (dock && header && btn) {
    dock.classList.toggle('minimized', loadAgentPanelMinimized());
    btn.textContent = dock.classList.contains('minimized') ? '□' : '_';

    header.addEventListener('click', () => {
      // Toggle minimize
      dock.classList.toggle('minimized');
      const isMin = dock.classList.contains('minimized');
      saveAgentPanelMinimized(isMin);
      btn.textContent = isMin ? '□' : '_';
    });
  }
});

function updateUI(state) {
  lastState = state;
  elements = Array.isArray(state?.elements) ? state.elements : elements;
  if (!isVendorLite(state)) {
    runtimeBootstrapDone = false;
    runtimeBootstrapPromise = null;
    pendingRuntimeBootstrap = false;
    llmRestoreAttempted = false;
    if (runtimeBridge && runtimeBridgeInitKey) {
      runtimeBridge.dispose();
      runtimeBridgeInitKey = '';
    }
  }

  const teamCode = state?.teamCode || '…';
  const teamCodeNode = el('teamCode');
  if (teamCodeNode) teamCodeNode.textContent = teamCode;
  const teamCodeResult = el('teamCodeResult');
  if (teamCodeResult) teamCodeResult.classList.add('is-hidden');
  const localLlm = getLocalLiteLlm();

  applyVisibility(state);
  updateLiteAgentStatus(state);
  initStep2Listener();
  initAdvancedLlmUi();

  // --- New Flow UI Updates ---
  // --- New Flow UI Updates ---
  const step1 = el('step1');
  const step2 = el('step2');
  const agentReveal = el('agentReveal');
  const agentConnected = isAnyAgentConnected(state);
  const lite = liteState(state);
  const vendor = isVendorLite(state);

    if (step1) {
      if (agentConnected || walletAddr || localLlm.configured) {
        step1.classList.add('done');
      } else {
        step1.classList.remove('done');
    }
  }

  if (agentConnected) {
    if (step2) {
      const needsBrainAfterConnect = vendor && !localLlm.configured;
      step2.classList.remove('disabled');
      if (needsBrainAfterConnect) {
        step2.classList.add('active');
        step2.classList.remove('done');
      } else {
        step2.classList.remove('active');
        step2.classList.add('done');
      }
    }
    if (agentReveal) {
      agentReveal.classList.remove('is-hidden');
      renderAgentReveal(state);
    }
  } else {
    if (step2) {
      step2.classList.remove('disabled');
      if (localLlm.configured) {
        step2.classList.add('done');
        step2.classList.remove('active');
      } else {
        step2.classList.remove('done');
        step2.classList.add('active');
      }
    }
    if (agentReveal) {
      agentReveal.classList.add('is-hidden');
    }
  }

  if (vendor) {
    ensureVendorRuntimeBridge(state).catch((e) => {
      setOpenError(`Runtime bridge failed: ${e.message}`);
    });
    if (lite.lastError) {
      setLiteLlmStatus(`Runtime failed: ${lite.lastError}`);
    } else if (localLlm.configured) {
      setLiteLlmStatus(`Brain saved locally: ${localLlm.provider || 'provider'}/${localLlm.model || 'model'}. Auto-restored on return.`);
    } else {
      setLiteLlmStatus('Not configured. Save provider, model, and API key.');
    }
  }

  if (statusOverride === 'OpenClaw Lite runtime is starting…' && runtimeBootstrapDone) {
    statusOverride = '';
  }

  if (statusOverride) {
    setHatchStatus(statusOverride);
  } else if (vendor && lite.lastError) {
    setHatchStatus(`OpenClaw Lite runtime failed: ${lite.lastError}`);
  } else if (vendor && !localLlm.configured) {
    setHatchStatus('Configure LLM to continue.');
  } else if (vendor && localLlm.configured && !agentConnected) {
    setHatchStatus(runtimeBootstrapDone ? 'Brain saved. Connecting agent…' : 'Starting local runtime…');
  } else if (agentConnected) {
    setHatchStatus('Agent ready.');
  } else if (walletAddr) {
    setHatchStatus('Wallet connected. Continue setup.');
  } else {
    setHatchStatus('Choose sign in or sign up to continue.');
  }

  if (agentConnected || !!state?.signup?.complete) {
    renderSigils(state);
    renderCanvas(state);
    renderCeremony(state);
    updateMatchUi(state);
  }

  if (vendor && !runtimeBootstrapDone) {
    bootstrapVendorRuntime().catch(() => { });
  }
  if (vendor && (!localLlm.loaded || !localLlm.configured)) {
    restoreLiteLlmConfigFromLocalIfNeeded(state).catch(() => { });
  }
  if (!agentConnected && !pendingLiteConnect) {
    if (vendor) {
      if (localLlm.configured && runtimeBootstrapDone) {
        connectLiteAgent().catch(() => { });
      }
    } else {
      connectLiteAgent().catch(() => { });
    }
  }

  const hasHouseId = typeof state?.houseId === 'string' && state.houseId.trim().length > 0;
  const isHomePath = window.location.pathname === '/';
  if (isHomePath && state?.signup?.complete && state?.signup?.mode === 'agent' && !hasHouseId && !redirecting) {
    redirecting = true;
    window.location.href = '/create';
  }
}

// --- Agent Layout Logic ---

let gateway = null;

async function initGateway() {
  if (gateway) return gateway;
  try {
    // Dynamic import of the gateway module
    const module = await import('/openclaw-lite/gateway.js');
    gateway = module.default || module;
    if (gateway instanceof Promise) {
      gateway = await gateway;
    }

    // Subscribe to agent events
    gateway.on('message', (msg) => {
      const role = String(msg?.role || '').toLowerCase();
      if (role && role !== 'assistant') return;
      // Logic fix: accept empty strings as valid content/thinking
      const text = (typeof msg.text === 'string') ? msg.text : JSON.stringify(msg);
      appendChatMessage('agent', text);
    });
    gateway.on('log', (entry) => {
      appendAgentLog(`[${entry.level}] ${entry.message}`);
    });
    gateway.on('status', (status) => {
      const elStatus = el('agentStatus');
      if (elStatus) elStatus.textContent = status;
    });

    return gateway;
  } catch (e) {
    console.error('Failed to load gateway:', e);
    appendAgentLog(`Error: Failed to load agent gateway. ${e.message}`);
    return null;
  }
}

function appendChatMessage(role, text) {
  const box = el('chatTranscript');
  if (!box) return;

  const div = document.createElement('div');
  div.className = `chat-message ${role}`;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function appendAgentLog(text) {
  const box = el('agentLogs');
  if (!box) return;

  const div = document.createElement('div');
  div.textContent = `> ${text}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function handleVisit() {
  const selector = el('experienceSelector');
  const url = selector ? selector.value : '';
  if (!url) {
    appendAgentLog('Please select a valid experience.');
    return;
  }

  appendChatMessage('system', `Navigating agent to ${url}...`);
  if (!gateway) await initGateway();

  try {
    // Send navigation/fetch command to agent
    // Depending on agent capability, this might be a 'tool' execution or a hard navigation
    // For now, we ask the agent to "visit" it.
    await gateway.send({ type: 'command', command: 'visit', url });
    appendAgentLog(`Sent visit command for ${url}`);
  } catch (e) {
    appendAgentLog(`Visit failed: ${e.message}`);
  }
}

async function handleChat() {
  const input = el('chatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  appendChatMessage('user', text);

  if (!gateway) await initGateway();
  try {
    await gateway.send({ type: 'chat', text });
  } catch (e) {
    appendChatMessage('system', `Failed to send: ${e.message}`);
  }
}

async function handleNewSession() {
  const btn = el('newSessionBtn');
  if (btn) btn.disabled = true;

  try {
    if (!gateway) await initGateway();
    if (!gateway) throw new Error('Gateway unavailable.');

    if (typeof gateway.clearTranscript === 'function') {
      await gateway.clearTranscript({ rotateSession: true, keepBootMessage: false });
    } else if (window.__openclawLiteTest && typeof window.__openclawLiteTest.clearTranscript === 'function') {
      await window.__openclawLiteTest.clearTranscript({ rotateSession: true, keepBootMessage: false });
    } else {
      throw new Error('Transcript reset is not available.');
    }

    const box = el('chatTranscript');
    if (box) box.innerHTML = '';
    appendChatMessage('system', 'New session started.');
    appendAgentLog('Started new session (worker transcript cleared).');
  } catch (e) {
    const msg = e?.message || 'UNKNOWN';
    appendChatMessage('system', `New session failed: ${msg}`);
    appendAgentLog(`New session failed: ${msg}`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function setupAgentInterface() {
  const visitBtn = el('visitBtn');
  const sendBtn = el('sendChatBtn');
  const newSessionBtn = el('newSessionBtn');
  const chatInput = el('chatInput');

  if (visitBtn) visitBtn.addEventListener('click', handleVisit);
  if (sendBtn) sendBtn.addEventListener('click', handleChat);
  if (newSessionBtn) newSessionBtn.addEventListener('click', () => {
    handleNewSession().catch(() => { });
  });
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleChat();
    });
  }
}

// --------------------------

async function poll() {
  try {
    const state = await api('/api/state');
    updateUI(state);
  } catch (e) {
    console.warn('state poll failed', e);
  } finally {
    setTimeout(poll, 700);
  }
}

async function init() {
  const enterBtn = el('enterBtn');
  const connectWalletHeroBtn = el('connectWalletHeroBtn');
  const authSigninBtn = el('authSigninBtn');
  const authSignupBtn = el('authSignupBtn');
  const hatchWalletCheckBtn = el('hatchWalletCheckBtn');
  const liteAgentConnectBtn = el('liteAgentConnectBtn');
  const liteLlmSaveBtn = el('liteLlmSaveBtn');
  const liteLlmClearBtn = el('liteLlmClearBtn');
  const llmClearBtn = el('llmClearBtn');
  const uploadCoreBtn = el('uploadCoreBtn');
  const coreUploadInput = el('coreUploadInput');
  const openBtn = el('openBtn');

  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      setHatchVisible(true);
      statusOverride = 'Continue setup.';
      setHatchStatus(statusOverride);
    });
  }

  if (connectWalletHeroBtn) {
    connectWalletHeroBtn.addEventListener('click', async () => {
      setHatchVisible(true);
      await runWalletProfileCheck();
    });
  }

  if (authSigninBtn) {
    authSigninBtn.addEventListener('click', () => {
      setHatchVisible(true);
      statusOverride = 'Sign in selected. Continue setup.';
      setHatchStatus(statusOverride);
    });
  }

  if (authSignupBtn) {
    authSignupBtn.addEventListener('click', () => {
      setHatchVisible(true);
      statusOverride = 'Sign up selected. Continue setup.';
      setHatchStatus(statusOverride);
    });
  }

  if (hatchWalletCheckBtn) {
    hatchWalletCheckBtn.addEventListener('click', async () => {
      setHatchVisible(true);
      await runWalletProfileCheck();
    });
  }

  if (liteAgentConnectBtn) {
    liteAgentConnectBtn.addEventListener('click', async () => {
      await connectLiteAgent();
    });
  }

  if (liteLlmSaveBtn) {
    liteLlmSaveBtn.addEventListener('click', async () => {
      await saveLiteLlmConfig();
    });
  }

  if (liteLlmClearBtn) {
    liteLlmClearBtn.addEventListener('click', async () => {
      await clearLiteLlmConfig();
    });
  }

  if (llmClearBtn) {
    llmClearBtn.addEventListener('click', async () => {
      await clearLiteLlmConfig();
    });
  }

  if (uploadCoreBtn && coreUploadInput) {
    uploadCoreBtn.addEventListener('click', () => {
      coreUploadInput.click();
    });
  }

  if (openBtn) {
    openBtn.addEventListener('click', async () => {
      setOpenError('');
      const openWaiting = el('openWaiting');
      try {
        const result = await api('/api/human/open/press', {
          method: 'POST',
          body: JSON.stringify({})
        });
        if (result?.nextUrl) {
          window.location.href = result.nextUrl;
          return;
        }
        if (openWaiting) openWaiting.style.display = 'inline-flex';
        if (isVendorLite(lastState)) {
          const agentResult = await triggerVendorAgentOpenPress();
          if (agentResult?.nextUrl) {
            window.location.href = agentResult.nextUrl;
          }
        }
      } catch (e) {
        setOpenError(`Open failed: ${e.message}`);
      }
    });
  }


  const initial = await api('/api/state');
  elements = Array.isArray(initial?.elements) ? initial.elements : [];
  if (loadHatchVisible() || isAnyAgentConnected(initial) || isLocalLiteLlmConfigured()) {
    setHatchVisible(true);
  }
  try {
    const localCfg = setLocalLiteLlm(await readLocalLiteLlmConfig());
    applyLocalLiteLlmToInputs(localCfg);
  } catch (e) {
    console.warn('local LLM preload failed', e);
  }
  updateUI(initial);
  if (isVendorLite(initial)) {
    await bootstrapVendorRuntime();
    await restoreLiteLlmConfigFromLocalIfNeeded(initial);
  }

  // Do not auto-load server-side Codex profile credentials. Users configure LLM credentials themselves.

  setupAgentInterface();
  poll();
}

init().catch((e) => {
  console.error(e);
  setHatchStatus(`Init failed: ${e.message}`);
});
