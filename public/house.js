/* eslint-disable no-console */

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

function setStatus(msg) {
  el('status').textContent = msg || '';
}

const ERROR_MESSAGES = {
  AG0_SDK_NOT_BUNDLED: 'ERC-8004 minting is disabled until the Agent0 SDK is bundled.',
  AG0_SDK_LOAD_FAILED: 'Unable to load the Agent0 SDK. Check your network or try again.'
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
const AGENT0_SDK_ESM_URL = '/vendor/agent0-sdk.mjs';
const AGENT0_SDK_CDN_URL = 'https://esm.sh/agent0-sdk@1.4.2?bundle';
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
const MIND_OAUTH_START_URL_BY_PROVIDER = Object.freeze({
  openai: 'https://chatgpt.com/auth/login',
  'openai-codex': 'https://chatgpt.com/auth/login'
});

async function loadAgent0Sdk(statusNode) {
  if (window.__AG0_SDK_MOCK) return window.__AG0_SDK_MOCK;

  let localMod = null;
  try {
    localMod = await import(AGENT0_SDK_ESM_URL);
  } catch {
    localMod = null;
  }

  if (!localMod || localMod.AG0_SDK_BUNDLED === false) {
    const ok = confirm('Agent0 SDK is not bundled locally. Load it from the official CDN for this mint?');
    if (!ok) throw new Error('AG0_SDK_NOT_BUNDLED');
    if (statusNode) statusNode.textContent = 'Loading Agent0 SDK…';
    return await import(AGENT0_SDK_CDN_URL);
  }

  return localMod;
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

function cacheHouseAuthBytes(houseId, keyBytes) {
  if (!houseId || !keyBytes || !keyBytes.length) return;
  try {
    sessionStorage.setItem(houseAuthCacheKey(houseId), b64(keyBytes));
  } catch {
    // ignore storage errors
  }
}

function clearHouseAuthCache(houseId) {
  if (!houseId) return;
  try {
    sessionStorage.removeItem(houseAuthCacheKey(houseId));
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

function getMindOauthLaunchUrl(provider) {
  const key = String(provider || '').trim().toLowerCase();
  return MIND_OAUTH_START_URL_BY_PROVIDER[key] || '';
}

function updateMindOauthLaunchUi() {
  const launchBtn = el('llmOauthLaunchBtn');
  if (!launchBtn) return;
  const provider = String(el('llmProviderSelect')?.value || MIND_DEFAULT_PROVIDER).trim() || MIND_DEFAULT_PROVIDER;
  const mode = normalizeMindAuthMode(el('llmAuthModeSelect')?.value);
  const url = getMindOauthLaunchUrl(provider);
  launchBtn.dataset.oauthUrl = url;
  launchBtn.style.display = mode === MIND_AUTH_OAUTH ? 'inline-flex' : 'none';
  launchBtn.disabled = !url;
  launchBtn.title = url
    ? 'Open OAuth sign-in in a new tab.'
    : 'OAuth launch is available for OpenAI providers only.';
}

function launchMindOauthInNewTab() {
  const launchBtn = el('llmOauthLaunchBtn');
  if (!launchBtn) return;
  const url = String(launchBtn.dataset.oauthUrl || '').trim();
  if (!url) {
    setMindConfigError('OAuth launch is available for OpenAI providers only.');
    return;
  }
  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (!popup) {
    setMindConfigError('Popup blocked. Allow popups and retry OAuth launch.');
  }
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
  if (msg === 'MISSING_OAUTH_PROFILE_JSON') return 'Paste an OAuth profile JSON, callback URL, or token.';
  if (msg === 'INVALID_OAUTH_PROFILE_JSON') return 'Invalid OAuth profile/token format.';
  if (msg === 'NO_OAUTH_ACCESS_TOKEN_FOUND') return 'No access token found in OAuth profile JSON.';
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
      ? 'Use "Sign in with ChatGPT" (subscription) and paste callback URL, auth JSON, or token here.'
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
  const keyInput = String(el('llmKeyInput')?.value || '').trim();
  const oauthInput = String(el('llmOauthProfileInput')?.value || '').trim();
  if (!providerInput) throw new Error('MISSING_LLM_PROVIDER');
  if (!modelInput) throw new Error('MISSING_LLM_MODEL');
  const parsed = parseModelRef(
    `${providerInput}/${modelInput || getDefaultLlmModelForProvider(providerInput)}`,
    providerInput,
    modelInput || getDefaultLlmModelForProvider(providerInput)
  );

  let credential = keyInput;
  let oauthError = '';
  if (authMode === MIND_AUTH_OAUTH) {
    const token = extractOAuthAccessToken(oauthInput, providerInput);
    oauthError = oauthInput && !token.ok ? String(token.error || 'INVALID_OAUTH_PROFILE_JSON') : '';
    const parsedCredential = token.ok ? String(token.token || '').trim() : '';
    credential = keyInput || parsedCredential;
  }
  if (!credential) throw new Error(oauthError || 'MISSING_LLM_CREDENTIAL');

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
let wallet = null;
let walletAddr = null;
let walletHouseId = null;
const WALLET_STORAGE_KEY = 'agentTownWallet';
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
function bindWalletEvents() {
  if (!wallet || typeof wallet.on !== 'function') return;
  if (walletEventBindings && walletEventBindings.wallet === wallet) return;

  unbindWalletEvents();

  const onDisconnect = () => {
    // Wallet disconnected outside the app (extension UI, etc).
    disconnectWallet({ fromProvider: true, resetSession: unlocked }).catch(() => {});
  };
  const onAccountChanged = (publicKey) => {
    const nextAddr = publicKey && typeof publicKey.toString === 'function' ? publicKey.toString() : null;
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

  wallet.on('disconnect', onDisconnect);
  wallet.on('accountChanged', onAccountChanged);
  walletEventBindings = { wallet, onDisconnect, onAccountChanged };
}

function unbindWalletEvents() {
  if (!walletEventBindings) return;
  const { wallet: boundWallet, onDisconnect, onAccountChanged } = walletEventBindings;
  const off =
    typeof boundWallet.off === 'function'
      ? boundWallet.off.bind(boundWallet)
      : typeof boundWallet.removeListener === 'function'
        ? boundWallet.removeListener.bind(boundWallet)
        : null;
  if (off) {
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
  }
  walletEventBindings = null;
}

async function connectWallet({ silent = false } = {}) {
  // Accept any Solana wallet adapter injected as `window.solana` that supports
  // `connect()` and `signMessage()` (Phantom, Solflare, Backpack, etc.).
  if (!window.solana) throw new Error('NO_SOLANA_WALLET');
  if (typeof window.solana.connect !== 'function') throw new Error('NO_SOLANA_WALLET');
  if (typeof window.solana.signMessage !== 'function') throw new Error('NO_SOLANA_SIGN');
  const previousAddr = walletAddr;
  let resp = null;
  if (window.solana.isConnected && window.solana.publicKey) {
    wallet = window.solana;
  } else {
    const opts = silent ? { onlyIfTrusted: true } : undefined;
    resp = await window.solana.connect(opts);
    wallet = window.solana;
  }
  bindWalletEvents();

  const pk = resp?.publicKey || wallet?.publicKey;
  walletAddr = pk && typeof pk.toString === 'function' ? pk.toString() : null;
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
    // Clear any cached house auth keys for this origin.
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      if (key.startsWith(HOUSE_AUTH_CACHE_PREFIX)) sessionStorage.removeItem(key);
    }
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
  if (!fromProvider && wallet && typeof wallet.disconnect === 'function') {
    try {
      await wallet.disconnect();
    } catch {
      // ignore disconnect errors; we still clear local state
    }
  }
  unbindWalletEvents();
  wallet = null;
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
  if (!wallet) throw new Error('WALLET_NOT_CONNECTED');
  const msgBytes = new TextEncoder().encode(message);
  const resp = await wallet.signMessage(msgBytes, 'utf8');
  const sigBytes = resp?.signature || resp;
  const sigArr = normalizeSignatureBytes(sigBytes);
  if (!sigArr) throw new Error('SIGNATURE_FORMAT');
  return sigArr;
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
  if (!wallet || !walletAddr) throw new Error('WALLET_NOT_CONNECTED');
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

// Phase 3: store minted ERC-8004 ids locally (not persisted yet)
let humanErc8004Id = null;
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
  if (!window.ethereum) throw new Error('NO_EVM_WALLET');
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const signer = Array.isArray(accounts) && accounts.length ? accounts[0] : null;
  if (!signer) throw new Error('NO_EVM_ACCOUNT');
  // personal_sign expects [data, address]
  const sig = await window.ethereum.request({
    method: 'personal_sign',
    params: [message, signer]
  });
  const chainHex = await window.ethereum.request({ method: 'eth_chainId' });
  const chainId = parseInt(chainHex, 16);
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
    agentErc8004: agentErc8004Id,
    origin: window.location.origin,
    createdAtMs: Date.now()
  };
}

async function mintErc8004Identity() {
  const status = el('erc8004MintStatus');
  if (status) status.textContent = '';

  if (!window.ethereum) throw new Error('NO_EVM_WALLET');
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
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const owner = Array.isArray(accounts) && accounts.length ? accounts[0] : null;
  if (!owner) throw new Error('NO_EVM_ACCOUNT');

  // Best-effort chain switch
  const currentChainHex = await window.ethereum.request({ method: 'eth_chainId' });
  const currentChainId = parseInt(currentChainHex, 16);
  if (currentChainId !== chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
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
    walletProvider: window.ethereum
  });

  const agentName = `Agent Town House ${houseId.slice(0, 10)}`;
  const agentDesc = `E2EE shared house in Agent Town. houseId=${houseId}.`;

  const agent = sdk.createAgent(agentName, agentDesc);

  // Attach some metadata to make it discoverable off-chain later.
  try {
    agent.setMetadata?.({ houseId, origin: window.location.origin });
  } catch {
    // ignore - metadata support may vary by SDK version
  }

  if (status) status.textContent = `Submitting ERC-8004 registration on ${chain}…`;

  // NOTE: We register with an empty URI for now (no hosted registration JSON yet).
  // The SDK will still mint the identity and return the agentId once confirmed.
  const tx = await agent.registerHTTP('');

  const txHash = tx?.hash;
  const explorerBase = chainId === 1 ? 'https://etherscan.io/tx/' : 'https://sepolia.etherscan.io/tx/';
  if (status) {
    status.textContent = txHash ? `Submitted: ${txHash}` : 'Submitted.';
  }

  // Wait for confirmation and then update the ERC-8004 statement.
  if (typeof tx?.waitConfirmed === 'function') {
    if (status) status.textContent = 'Waiting for confirmation…';
    const { result } = await tx.waitConfirmed();
    const agentId = result?.agentId;
    if (agentId) {
      humanErc8004Id = agentId;
      // If we haven't unlocked yet, still re-render the statement using the URL houseId
      renderDescriptorUI((house && house.houseId) ? house.houseId : houseId);
      // Prefill anchor link input for convenience.
      const anchorInput = el('anchorErc8004Id');
      if (anchorInput && !anchorInput.value) anchorInput.value = String(agentId);
      if (status) status.textContent = `Minted identity: ${agentId}`;
    } else {
      if (status) status.textContent = 'Confirmed (no agentId returned).';
    }
  }
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
  setPanelVisible('erc8004Panel', erc8004Open);
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
  if (descBtn) descBtn.disabled = !enabled;
  if (ercBtn) ercBtn.disabled = !enabled;
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

  renderDescriptorUI(house.houseId);
  setHousePanelButtonsEnabled(true);
  setDescriptorOpen(false);
  setErc8004Open(false);
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
    if (state.signup?.mode === 'token') {
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
    tokenMode = state?.signup?.mode === 'token';
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
                      ? 'No Solana wallet found (need Phantom/Solflare).'
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
          ? 'No Solana wallet found (need Phantom/Solflare).'
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
    llmOauthLaunchBtn.addEventListener('click', () => launchMindOauthInNewTab());
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
  restoreWalletConnection({ houseIdFromUrl: !!houseId });
}

init().catch((e) => {
  console.error(e);
  setError(e.message);
});
