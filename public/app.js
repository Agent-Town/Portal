const TEAM_CODE_HINT_STORAGE_KEY = 'agentTown:teamCodeHint';
const WALLET_IDENTITY_HINT_STORAGE_KEY = 'agentTown:walletIdentityHint';
const WALLET_RECOVERY_KEY_STORAGE_KEY = 'agentTown:walletRecoveryKey';
const WALLET_IDENTITY_EVM_HEADER = 'x-wallet-evm-address';
const WALLET_IDENTITY_SOLANA_HEADER = 'x-wallet-solana-address';
const WALLET_RECOVERY_INTENT_HEADER = 'x-wallet-recovery-intent';
const WALLET_RECOVERY_INTENT_MAX_ATTEMPTS = 3;

const ONBOARDING_STEP_TOWNHALL = 'townhall_profile';
const ONBOARDING_STEP_BRAIN = 'brain';
const ONBOARDING_STEP_SIGIL = 'sigil';
const ONBOARDING_STEP_CEREMONY = 'ceremony';
const ONBOARDING_STEP_DONE = 'done';
const ExperienceProfiles = window.AgentTownExperienceProfiles || null;
const ExperienceRuntime = window.AgentTownExperienceRuntime || null;
const AppI18n = window.AgentTownI18n || null;
const LlmCatalog = window.AgentTownLlmCatalog || null;

function normalizeOnboardingStep(value) {
  switch (String(value || '').trim()) {
    case ONBOARDING_STEP_TOWNHALL:
    case ONBOARDING_STEP_BRAIN:
    case ONBOARDING_STEP_SIGIL:
    case ONBOARDING_STEP_CEREMONY:
    case ONBOARDING_STEP_DONE:
      return String(value).trim();
    default:
      return '';
  }
}

function getOnboardingStep(state) {
  const onboarding = state?.onboarding || {};
  if (onboarding.required !== true) return ONBOARDING_STEP_DONE;

  const explicitStep = normalizeOnboardingStep(onboarding.step);
  if (explicitStep) return explicitStep;

  if (onboarding.registrationComplete !== true) return ONBOARDING_STEP_TOWNHALL;
  if (!isTownhallBrainConfigured(state)) return ONBOARDING_STEP_BRAIN;
  if (!state?.signup?.complete) return ONBOARDING_STEP_SIGIL;
  if (state?.houseId) return ONBOARDING_STEP_DONE;
  return ONBOARDING_STEP_CEREMONY;
}

const ONBOARDING_STEPPER_STEPS = [
  { id: ONBOARDING_STEP_TOWNHALL, labelKey: 'stepper.townhall', num: 1 },
  { id: ONBOARDING_STEP_BRAIN, labelKey: 'stepper.brain', num: 2 },
  { id: ONBOARDING_STEP_SIGIL, labelKey: 'stepper.sigil', num: 3 },
  { id: ONBOARDING_STEP_CEREMONY, labelKey: 'stepper.ceremony', num: 4 }
];

function renderOnboardingStepper(currentStep) {
  const body = el('districtModalBody');
  if (!body) return;
  if (!onboardingRequired(lastState)) {
    const existing = body.querySelector('.onboarding-stepper');
    if (existing) existing.remove();
    return;
  }

  let container = body.querySelector('.onboarding-stepper');
  if (!container) {
    container = document.createElement('div');
    container.className = 'onboarding-stepper';
    body.insertBefore(container, body.firstChild);
  }
  container.innerHTML = '';

  const stepIndex = ONBOARDING_STEPPER_STEPS.findIndex(s => s.id === currentStep);

  for (let i = 0; i < ONBOARDING_STEPPER_STEPS.length; i++) {
    if (i > 0) {
      const line = document.createElement('div');
      line.className = 'onboarding-stepper-line';
      if (i <= stepIndex) line.classList.add('is-complete');
      container.appendChild(line);
    }
    const step = ONBOARDING_STEPPER_STEPS[i];
    const node = document.createElement('div');
    node.className = 'onboarding-stepper-node';
    node.setAttribute('data-testid', `stepper-step-${step.id}`);
    if (i === stepIndex) node.classList.add('is-active');
    else if (i < stepIndex) node.classList.add('is-complete');

    const circle = document.createElement('div');
    circle.className = 'onboarding-stepper-circle';
    circle.textContent = i < stepIndex ? '\u2713' : String(step.num);
    node.appendChild(circle);

    const label = document.createElement('div');
    label.className = 'onboarding-stepper-label';
    label.textContent = tApp(step.labelKey);
    node.appendChild(label);

    container.appendChild(node);
  }
}

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

function clearWalletRecoveryKey() {
  try {
    localStorage.removeItem(WALLET_RECOVERY_KEY_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

function readWalletIdentityHint() {
  try {
    const raw = localStorage.getItem(WALLET_IDENTITY_HINT_STORAGE_KEY);
    if (!raw) return { evm: '', solana: '' };
    const parsed = JSON.parse(raw);
    const evm = normalizeEvmAddress(parsed?.evm || parsed?.evmAddress || '') || '';
    const solana = normalizeSolanaAddress(parsed?.solana || parsed?.solanaAddress || '') || '';
    return { evm, solana };
  } catch {
    return { evm: '', solana: '' };
  }
}

function saveWalletIdentityHint(identity = {}) {
  const current = readWalletIdentityHint();
  const evm = normalizeEvmAddress(identity?.evm || identity?.evmAddress || current.evm || '') || '';
  const solana = normalizeSolanaAddress(identity?.solana || identity?.solanaAddress || current.solana || '') || '';
  try {
    if (!evm && !solana) {
      localStorage.removeItem(WALLET_IDENTITY_HINT_STORAGE_KEY);
      return;
    }
    localStorage.setItem(WALLET_IDENTITY_HINT_STORAGE_KEY, JSON.stringify({
      evm: evm || null,
      solana: solana || null
    }));
  } catch {
    // ignore storage errors
  }
}

function clearWalletIdentityHint() {
  try {
    localStorage.removeItem(WALLET_IDENTITY_HINT_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

async function api(url, opts = {}) {
  const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
  const walletIdentities = getWalletIdentitiesForHeaders();
  for (const { chain, address } of walletIdentities) {
    if (chain === 'evm' && headers[WALLET_IDENTITY_EVM_HEADER] === undefined) {
      headers[WALLET_IDENTITY_EVM_HEADER] = address;
      continue;
    }
    if (chain === 'solana' && headers[WALLET_IDENTITY_SOLANA_HEADER] === undefined) {
      headers[WALLET_IDENTITY_SOLANA_HEADER] = address;
    }
  }
  const teamCodeHint = readTeamCodeHint();
  const walletRecoveryKey = readWalletRecoveryKey();
  if (!teamCodeHint && walletRecoveryIntentAttempts < WALLET_RECOVERY_INTENT_MAX_ATTEMPTS) {
    walletRecoveryIntentAttempts = WALLET_RECOVERY_INTENT_MAX_ATTEMPTS;
  }
  if (
    walletRecoveryKey
    && headers['x-wallet-recovery-key'] === undefined
    && headers['X-Wallet-Recovery-Key'] === undefined
  ) {
    headers['x-wallet-recovery-key'] = walletRecoveryKey;
  }
  let sentWalletRecoveryIntent = false;
  if (
    walletRecoveryIntentAttempts > 0
    && headers[WALLET_RECOVERY_INTENT_HEADER] === undefined
    && headers['X-Wallet-Recovery-Intent'] === undefined
  ) {
    headers[WALLET_RECOVERY_INTENT_HEADER] = '1';
    sentWalletRecoveryIntent = true;
  }
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
  if (sentWalletRecoveryIntent && walletRecoveryIntentAttempts > 0) {
    walletRecoveryIntentAttempts -= 1;
  }
  if (data?.onboarding?.registrationComplete === true) {
    walletRecoveryIntentAttempts = 0;
  }
  if (typeof data?.teamCode === 'string') {
    saveTeamCodeHint(data.teamCode);
  }
  if (typeof data?.walletRecoveryKey === 'string') {
    const incomingWalletRecoveryKey = String(data.walletRecoveryKey || '').trim().toLowerCase();
    const currentWalletRecoveryKey = readWalletRecoveryKey();
    const isSessionResetCall = typeof url === 'string' && /\/api\/session\/reset(?:$|[?#])/.test(url);
    const shouldPreserveCurrentWalletRecoveryKey = (
      !!currentWalletRecoveryKey
      && currentWalletRecoveryKey !== incomingWalletRecoveryKey
      && walletRecoveryIntentAttempts > 0
      && data?.onboarding?.registrationComplete !== true
      && !isSessionResetCall
    );
    if (!shouldPreserveCurrentWalletRecoveryKey) {
      saveWalletRecoveryKey(incomingWalletRecoveryKey);
    }
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

  if (walletAddr) add('solana', walletAddr);

  const cachedWallet = loadWalletCache();
  if (cachedWallet && typeof cachedWallet.address === 'string') {
    add('solana', cachedWallet.address);
  }

  const walletIdentityHint = readWalletIdentityHint();
  if (walletIdentityHint.solana) add('solana', walletIdentityHint.solana);
  if (walletIdentityHint.evm) add('evm', walletIdentityHint.evm);

  if (appWalletClient && typeof appWalletClient.getAddress === 'function') {
    try {
      add('solana', appWalletClient.getAddress({ chain: 'solana' }));
    } catch {
      // ignore malformed wallet state
    }
    try {
      add('evm', appWalletClient.getAddress({ chain: 'evm' }));
    } catch {
      // ignore malformed wallet state
    }
  }

  return out;
}

function getWalletIdentitiesForHeaders() {
  return collectWalletIdentitiesFromClient();
}

function getWalletIdentitiesForTownhallRegistration() {
  const identities = collectWalletIdentitiesFromClient();
  const out = {};
  for (const { chain, address } of identities) {
    out[chain] = address;
  }
  return out;
}

function el(id) {
  const modal = document.getElementById('districtModalBody');
  if (modal && !modal.closest('.is-hidden')) {
    const internal = modal.querySelector('#' + id);
    if (internal) return internal;
  }
  return document.getElementById(id);
}

function normalizeExperiencePreferenceClient(value) {
  if (ExperienceProfiles && typeof ExperienceProfiles.normalizePreference === 'function') {
    return ExperienceProfiles.normalizePreference(
      value && typeof value === 'object' ? value : { presetId: ExperienceProfiles.DEFAULT_PRESET_ID },
      {
        source: value?.source || 'server-default'
      }
    );
  }
  return value || {
    presetId: 'global-default',
    locale: 'en',
    market: 'global',
    providerPolicy: 'global-default',
    sharePolicy: 'x-moltbook',
    mediaPolicy: 'youtube',
    agentPolicy: 'default',
    selectedAt: new Date().toISOString(),
    source: 'server-default'
  };
}

function getCurrentExperiencePreference() {
  return normalizeExperiencePreferenceClient(currentExperiencePreference || lastState?.experiencePreference || null);
}

function tApp(key, vars = {}) {
  const preference = getCurrentExperiencePreference();
  if (!AppI18n || typeof AppI18n.t !== 'function') return key;
  return AppI18n.t(key, vars, preference.locale || 'en');
}

function isMainlandFriendlyExperience(preference = getCurrentExperiencePreference()) {
  return String(preference?.presetId || '') === 'cn-mainland'
    || String(preference?.providerPolicy || '') === 'cn-mainland';
}

function buildExperienceRuntimeContext(state = lastState) {
  return {
    origin: window.location.origin,
    teamCode: String(state?.teamCode || ''),
    houseId: String(state?.houseId || ''),
    experiencePreference: getCurrentExperiencePreference()
  };
}

const HATCH_VISIBILITY_KEY = 'openclawLite:hatchVisible';
const AGENT_PANEL_MINIMIZED_KEY = 'agentTown:panel:minimized';
const AGENT_PANEL_DEBUG_VISIBLE_KEY = 'agentTown:panel:debugVisible';
const AGENT_PANEL_ZOOM_STEP_KEY = 'agentTown:panel:zoomStep';
const AGENT_PANEL_ZOOM_STEP_DEFAULT = 0;
const AGENT_PANEL_ZOOM_STEP_MIN = -2;
const AGENT_PANEL_ZOOM_STEP_MAX = 4;
const AGENT_PANEL_ZOOM_SCALE_STEP = 0.1;

let elements = [];
let lastState = null;
let currentExperiencePreference = null;
let wallet = null;
let walletAddr = null;
let walletRecoveryIntentAttempts = 0;
let redirecting = false;
let agentDockAutoExpandedOnce = false;
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
  reasoning: '',
  useProxy: true,
  credential: '',
  apiKeySet: false
});
let localLiteLlm = { ...DEFAULT_LOCAL_LITE_LLM };
const DEFAULT_LITE_SKILL_STATE = Object.freeze({
  status: 'idle',
  sourceUrl: null,
  activeSkillPath: null,
  lastError: null,
  lastImportedAtMs: null
});
let liteSkillState = { ...DEFAULT_LITE_SKILL_STATE };
let liteRuntimeState = {};
let liteSkillSyncPromise = null;
let liteSkillLastSyncAtMs = 0;
let liteSkillAutoImportPromise = null;
let liteSkillAutoImportTeamCode = '';
let liteSkillLoopTimer = null;
let liteSkillLoopInFlight = false;
let liteSkillLoopBackoffMs = 1000;
let liteSkillLoopLastRunAtMs = 0;
let liteSkillLoopTeamCode = '';
let liteSkillLoopPauseReason = '';
let liteSkillLoopLastErrorFingerprint = '';
let liteSkillLoopLastErrorAtMs = 0;
let townPanelUnlocked = false;
let pendingHumanSigilSelection = null;
let openAiCodexOAuthAttempt = null;
let openAiCodexOAuthPollTimer = null;
let openAiCodexOAuthExchangeInFlight = false;
let openAiCodexOAuthMessageListenerBound = false;
const OPENROUTER_OAUTH_MESSAGE_TYPE = 'agenttown:openrouter-oauth-callback';
let openRouterOAuthAttempt = null;
let openRouterOAuthPollTimer = null;
let openRouterOAuthExchangeInFlight = false;
let openRouterOAuthMessageListenerBound = false;
const AGENT_DEBUG_REFRESH_MS = 2200;
const AGENT_DEBUG_EVENT_LIMIT = 160;
const AGENT_DEBUG_TRAFFIC_LIMIT = 220;
const AGENT_DEBUG_TRAFFIC_LINE_MAX = 1600;
const AGENT_DEBUG_TRAFFIC_RENDER_LIMIT = 90;
let agentDebugActiveTab = 'tools';
let agentDebugRefreshTimer = null;
let agentDebugRefreshInFlight = false;
let agentDebugRefreshQueued = false;
const agentDebugEvents = [];
const agentDebugTraffic = [];
let agentDebugTrafficFilter = 'all';
let agentDebugTrafficMuteDepth = 0;
let agentPanelLayoutObserver = null;
let agentPanelLayoutResizeBound = false;
let agentPanelLayoutDeferredSyncBound = false;
let trainerScriptLoadPromise = null;
let skillActionPluginCache = {
  activeSkillPath: '',
  sourceUrl: '',
  parserVersion: '',
  actions: [],
  usage: null,
  loadedAtMs: 0,
};
let trainerNamespacePluginCache = {
  enabled: false,
  tools: [],
  diagnostics: null,
  loadedAtMs: 0,
};
function safeSetText(elementId, value, fallback = '') {
  const node = el(elementId);
  if (!node) return null;
  node.textContent = value == null ? fallback : value;
  return node;
}

function readTextContent(elementId, fallback = '') {
  const node = el(elementId);
  return node && typeof node.textContent === 'string' ? node.textContent : fallback;
}

function safeSetClassList(node, className, add) {
  if (!node || !node.classList) return;
  node.classList.toggle(className, add);
}

let appPrivyConfig = null;

const appWalletClient = window.initWalletClient ? window.initWalletClient() : null;
let walletHouseId = null;
let walletRecovered = false;
const WALLET_STORAGE_KEY = 'agentTownWallet';
const PATH_STORAGE_KEY = 'agentTownStartRole';
const TOKEN_ERROR_KEY = 'agentTownTokenError';
const SIGNUP_COMPLETE_AT_KEY = 'agentTownSignupCompleteAt';
const SHARE_CACHE_KEY = 'agentTownShareCache';
const TOKEN_MINT = 'CZRsbB6BrHsAmGKeoxyfwzCyhttXvhfEukXCWnseBAGS';
const TOWNHALL_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const TOWNHALL_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const DEFAULT_EVM_ERC8004_IDENTITY_REGISTRY = '0x8004a818bfb912233c491871b3d84c89a494bd9e';
const ERC8004_REGISTER_SELECTOR = '8ea42286';
const ERC721_TRANSFER_TOPIC0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const DEFAULT_SOLANA_WEB3_MODULE_URL = 'https://esm.sh/@solana/web3.js@1.98.4?bundle';
const SPONSORED_EVM_TX_TIMEOUT_MS = 180000;
const SPONSORED_EVM_TX_POLL_MS = 1800;
const SOLANA_WEB3_MODULE_FALLBACK_URLS = [
  DEFAULT_SOLANA_WEB3_MODULE_URL,
  'https://cdn.jsdelivr.net/npm/@solana/web3.js@1.98.4/+esm',
  'https://cdn.skypack.dev/@solana/web3.js@1.98.4'
];
// Single path: every session uses the in-browser worker agent.
let pathMode = 'coop';
let activeDistrict = 'house';
const districtViews = {
  house: { title: 'Plan Wagons', viewPath: '/views/house.html' },
  atlas: { title: 'Atlas Depot', viewPath: '/atlas?embed=1' },
  townhall: { title: 'Town Hall', viewPath: '/views/townhall.html' },
  saloon: { title: 'Saloon', viewPath: '/views/saloon.html' },
  pony: { title: 'Pony Express', viewPath: '/views/pony.html' },
  leaderboard: { title: 'Town Board', viewPath: '/views/leaderboard.html' },
  brain: { title: 'Connect Brain', viewPath: '/views/brain.html' },
  sigil: { title: 'Sigil Test', viewPath: '/views/sigil.html' },
  ceremony: { title: 'Create House Key', viewPath: '/create?embed=1' }
};

function setNodeText(id, key, vars = {}) {
  const node = el(id);
  if (node) node.textContent = tApp(key, vars);
}

function setNodePlaceholder(id, key) {
  const node = el(id);
  if (node) node.placeholder = tApp(key);
}

function setNodeTitle(id, key, vars = {}) {
  const node = el(id);
  if (node) node.title = tApp(key, vars);
}

function setNodeAriaLabel(id, key, vars = {}) {
  const node = el(id);
  if (node) node.setAttribute('aria-label', tApp(key, vars));
}

function formatBrainSavedLocalStatus(provider, model) {
  return tApp('brain.status.saved_local', {
    provider: String(provider || 'provider'),
    model: String(model || 'model')
  });
}

function formatBrainConfigFailedStatus(message) {
  return tApp('brain.error.config_failed', { message: String(message || 'UNKNOWN') });
}

function formatBrainClearFailedStatus(message) {
  return tApp('brain.error.clear_failed', { message: String(message || 'UNKNOWN') });
}

function formatHatchRuntimeFailedStatus(message) {
  return tApp('hatch.status.runtime_failed', { message: String(message || 'UNKNOWN') });
}

function formatHatchAgentConnectFailedStatus(message) {
  return tApp('hatch.status.agent_connect_failed', { message: String(message || 'UNKNOWN') });
}

function formatShareCardUnavailableStatus(message) {
  return tApp('townhall.share_card.unavailable', { message: String(message || 'UNKNOWN_ERROR') });
}

function getAgentTrafficFilterLabel(value) {
  const normalized = normalizeAgentTrafficFilter(value);
  if (normalized === 'in') return tApp('agent.panel.debug.filter_in');
  if (normalized === 'out') return tApp('agent.panel.debug.filter_out');
  return tApp('agent.panel.debug.filter_all');
}

function formatDebugValue(value, fallbackKey = 'agent.panel.debug.none') {
  const text = String(value ?? '').trim();
  return text || tApp(fallbackKey);
}

function formatDebugListLabel(labelKey, values, vars = {}) {
  return formatDebugList(tApp(labelKey, vars), values);
}

function formatMintChainLabel(chain = 'evm') {
  return String(chain || '').trim().toLowerCase() === 'solana'
    ? tApp('mint.chain.solana')
    : tApp('mint.chain.sepolia');
}

function formatMintCodeFallback(chain = 'evm', message = '') {
  return tApp('mint.error.failed_with_code', {
    chain: formatMintChainLabel(chain),
    message: String(message || 'UNKNOWN_ERROR')
  });
}

function refreshDistrictViewTitles() {
  districtViews.brain.title = tApp('brain.title');
  districtViews.sigil.title = tApp('sigil.title');
}

function applyExperiencePreferenceToUi() {
  const preference = getCurrentExperiencePreference();
  if (ExperienceRuntime && typeof ExperienceRuntime.applyDocumentPreference === 'function') {
    ExperienceRuntime.applyDocumentPreference(preference);
  }
  refreshDistrictViewTitles();

  setNodeText('townHallGateHint', 'townhall.gate_hint');
  setNodeText('townhallHumanTitle', 'townhall.human.title');
  setNodeText('townhallHumanHelp', 'townhall.human.help');
  setNodeText('townhallHumanNameLabel', 'townhall.human.name');
  setNodePlaceholder('townhallHumanName', 'townhall.human.name_placeholder');
  setNodeText('townhallHumanAvatarLabel', 'townhall.human.avatar');
  setNodeText('townhallHumanPromptLabel', 'townhall.prompt');
  setNodeText('townhallHumanPromptHelp', 'townhall.prompt.help');
  setNodePlaceholder('townhallHumanPrompt', 'townhall.prompt.placeholder');
  setNodeText('townhallHumanImageLabel', 'townhall.upload');
  setNodeText('townhallHumanSubmitBtn', 'townhall.submit');
  setNodeText('townhallAgentTitle', 'townhall.agent.title');
  setNodeText('townhallAgentHelp', 'townhall.agent.help');
  setNodeText('townhallAgentNameLabel', 'townhall.agent.name');
  setNodePlaceholder('townhallAgentName', 'townhall.agent.name_placeholder');
  setNodeText('townhallAgentAvatarLabel', 'townhall.agent.avatar');
  setNodeText('townhallAgentPromptLabel', 'townhall.prompt');
  setNodeText('townhallAgentPromptHelp', 'townhall.prompt.help');
  setNodePlaceholder('townhallAgentPrompt', 'townhall.prompt.placeholder');
  setNodeText('townhallAgentImageLabel', 'townhall.upload');
  setNodeText('townhallAgentBackBtn', 'townhall.back');
  setNodeText('townhallAgentSubmitBtn', 'townhall.submit');
  setNodeText('townhallProcessingTitle', 'townhall.processing.title');
  setNodeText('townhallMintUserEvmLabel', 'townhall.processing.user_evm');
  setNodeText('townhallMintUserSolanaLabel', 'townhall.processing.user_solana');
  setNodeText('townhallMintAgentEvmLabel', 'townhall.processing.agent_evm');
  setNodeText('townhallMintAgentSolanaLabel', 'townhall.processing.agent_solana');
  setNodeText('townhallRegisterBtn', 'townhall.retry');
  setNodeText('townhallContinueBtn', 'townhall.continue_sigil');
  setNodeText('townhallSinglePathTitle', 'townhall.single_path.title');
  setNodeText('townhallSinglePathHelp', 'townhall.single_path.help');
  setNodeText('townhallPathTitle', 'townhall.path.title');
  setNodeText('townhallPathHelp', 'townhall.path.help');
  setNodeText('townhallWalletPrefix', 'townhall.wallet_prefix');
  setNodeText('pathHumanBtn', 'townhall.path.human');
  setNodeText('pathCoopBtn', 'townhall.path.coop');
  setNodeText('pathAgentBtn', 'townhall.path.agent');
  setNodeText('tokenVerifyBtn', 'common.check_wallet');
  setNodeText('townhallTokenTitle', 'townhall.token.title');
  setNodeText('townhallTokenHelp', 'townhall.token.help');
  setNodeText('tokenCreateLink', 'townhall.token.create_house');
  setNodeText('tokenStatusText', 'townhall.token.waiting');
  setNodeText('reconnectTitle', 'townhall.reconnect.title');
  setNodeText('reconnectIntro', 'townhall.reconnect.help');
  setNodeText('copyHouse', 'townhall.copy_house');
  setNodeText('houseSnippet', 'townhall.house_snippet');
  setNodeText('openHouseLink', 'townhall.open_house');
  setNodeText('openShareCardBtn', 'townhall.open_share_card_preview');
  setNodeText('sigilWorkerStepTitle', 'sigil.worker_step');
  setNodeText('step1Intro', 'sigil.worker_help');
  setNodeText('connectWalletBtn', 'sigil.connect_wallet');
  setNodeText('hatchWalletCheckBtn', 'common.check_wallet');
  setNodeText('workerReconnectBtn', 'sigil.reconnect_worker');
  setNodeText('sigilHeading', 'sigil.heading');
  setNodeText('sigilHelp', 'sigil.help');
  setNodeText('sigilModalTitle', 'sigil.title');
  setNodeText('sigilModalHeading', 'sigil.title');
  setNodeText('sigilModalIntro', 'sigil.modal_intro');
  setNodeText('sigilModalHelp', 'sigil.help');
  setNodeText('openBtn', 'sigil.open');
  setNodeText('openWaiting', 'sigil.waiting');
  setNodeText('matchDetail', 'sigil.match_detail');
  setNodeText('brainPanelTitle', 'brain.title');
  setNodeText('brainPanelHelp', 'brain.help');
  setNodeText('brainProviderLabel', 'brain.provider');
  setNodeText('brainModelLabel', 'brain.model');
  setNodeText('brainAuthLabel', 'brain.auth');
  setNodeText('brainAuthOauthOption', 'brain.auth_option.oauth');
  setNodeText('brainOauthLabel', 'brain.oauth');
  setNodeText('brainApiKeyLabel', 'brain.api_key');
  setNodeText('brainAdvancedSummary', 'brain.advanced');
  setNodeText('brainBaseUrlLabel', 'brain.base_url');
  setNodeText('brainThinkingLabel', 'brain.thinking');
  setNodeText('brainUseProxyLabel', 'brain.use_proxy');
  setNodeText('brainContinueBtn', 'brain.continue');
  setNodePlaceholder('llmOauthProfileInput', 'brain.oauth.placeholder');
  setNodePlaceholder('llmKeyInput', 'brain.api_key.placeholder');
  setNodeText('agentPanelTitle', 'agent.panel.title');
  setNodePlaceholder('chatInput', 'agent.panel.chat_placeholder');
  setNodeText('sendChatBtn', 'agent.panel.send');
  setNodeText('newSessionBtn', 'agent.panel.new_session');
  setNodeText('agentOpenTrainerBtn', 'agent.panel.trainer');
  setNodeText('approvalsHeader', 'agent.panel.approvals');
  setNodeText('agentLogsHeader', 'agent.panel.system_logs');
  setNodeText('agentDebugTabTools', 'agent.panel.debug.tools');
  setNodeText('agentDebugTabSkill', 'agent.panel.debug.skill');
  setNodeText('agentDebugTabTraffic', 'agent.panel.debug.traffic');
  setNodeText('agentDebugTabBrain', 'agent.panel.debug.brain');
  setNodeText('agentDebugTabSession', 'agent.panel.debug.session');
  setNodeText('agentDebugRefreshBtn', 'agent.panel.debug.refresh');
  setNodeText('agentTrafficFilterAllBtn', 'agent.panel.debug.filter_all');
  setNodeText('agentTrafficFilterInBtn', 'agent.panel.debug.filter_in');
  setNodeText('agentTrafficFilterOutBtn', 'agent.panel.debug.filter_out');
  setNodeTitle('agentDebugToggleBtn', 'agent.panel.debug.toggle');
  setNodeAriaLabel('agentDebugToggleBtn', 'agent.panel.debug.toggle');
  setNodeTitle('agentPanelZoomOutBtn', 'agent.panel.debug.zoom_out');
  setNodeAriaLabel('agentPanelZoomOutBtn', 'agent.panel.debug.zoom_out');
  setNodeTitle('agentPanelZoomInBtn', 'agent.panel.debug.zoom_in');
  setNodeAriaLabel('agentPanelZoomInBtn', 'agent.panel.debug.zoom_in');
  setNodeTitle('minimizeChatBtn', 'agent.panel.debug.minimize');
  setNodeAriaLabel('minimizeChatBtn', 'agent.panel.debug.minimize');
  const agentStatus = el('agentStatus');
  if (agentStatus) {
    const current = String(agentStatus.textContent || '').trim();
    if (!current || current === 'Idle' || current === tApp('agent.panel.status.idle')) {
      agentStatus.textContent = tApp('agent.panel.status.idle');
    }
  }
  setNodeText('leaderboardPanelTitle', 'leaderboard.title');
  setNodeText('leaderboardPanelHelp', 'leaderboard.help');
  setNodeText('leaderboardSignupsLabel', 'leaderboard.signups');
  setNodeText('leaderboardTeamsLabel', 'leaderboard.public_teams');
  setNodeText('leaderboardReferralsLabel', 'leaderboard.referrals');
  setNodeText('townBoardEmpty', 'leaderboard.empty');
  setNodeText('leaderboardOpenLink', 'leaderboard.open');
  setNodeText('ponyPanelTitle', 'pony.title');
  setNodeText('ponyPanelHelp', 'pony.help');
  setNodeText('ponyInboxLink', 'pony.open_inbox');
  setNodeText('ponyTownBoardLink', 'pony.town_board');
  setNodeText('ponyComposeOpenBtn', 'pony.compose_open');
  setNodeText('ponyInboxHint', 'pony.compose_hint');
  setNodeText('ponyComposeToLabel', 'pony.compose.to');
  setNodeText('ponyComposeSubjectLabel', 'pony.compose.subject');
  setNodeText('ponyComposeDraftLabel', 'pony.compose.draft');
  setNodePlaceholder('ponyComposeToInput', 'pony.compose.to_placeholder');
  setNodePlaceholder('ponyComposeSubjectInput', 'pony.compose.subject_placeholder');
  setNodePlaceholder('ponyComposeDraftInput', 'pony.compose.draft_placeholder');
  setNodeText('ponyComposeCloseBtn', 'pony.compose.close');
  setNodeText('saloonPanelTitle', 'saloon.title');
  setNodeText('saloonPanelHelp', 'saloon.help');
  setNodeText('saloonItem1', 'saloon.item1');
  setNodeText('saloonItem2', 'saloon.item2');
  setNodeText('saloonItem3', 'saloon.item3');

  const customizeButtons = ['townhallHumanCustomizeBtn', 'townhallAgentCustomizeBtn'];
  for (const id of customizeButtons) {
    setNodeText(id, 'townhall.customize');
  }

  const providerWarning = el('llmProviderWarning');
  if (providerWarning) {
    const provider = String(el('llmProviderSelect')?.value || '').trim();
    const message = getLlmProviderWarningText(provider, preference);
    providerWarning.textContent = message || '';
  }
}

async function bootstrapExperiencePreferenceForApp() {
  if (!ExperienceRuntime || typeof ExperienceRuntime.bootstrap !== 'function') return null;
  const bootstrap = await ExperienceRuntime.bootstrap({ fetchImpl: fetch.bind(window) });
  currentExperiencePreference = normalizeExperiencePreferenceClient(bootstrap.current);
  applyExperiencePreferenceToUi();
  return bootstrap;
}
const districtViewCache = new Map();
let currentDistrict = null;
let lastDistrictLoad = 0;
let townBoardPollTimer = null;
let touchPrimedDistrict = null;
let touchPrimedAt = 0;
let suppressDistrictClickUntil = 0;
const TOUCH_PRIME_WINDOW_MS = 1500;
const TOUCH_CLICK_SUPPRESS_MS = 700;
const isTownHub = !!document.getElementById('districtMap') && !!document.getElementById('districtModalBackdrop');
const popupDistrictByPath = {
  '/leaderboard': 'leaderboard',
  '/wall': 'leaderboard',
  '/house': 'house'
};
const EXPERIENCE_UI_MODAL_NAMES = new Set(['atlas', 'pony', 'townhall', 'saloon', 'leaderboard', 'house', 'brain', 'sigil']);
const EXPERIENCE_UI_CONFIRMATION_REQUIRED_TOOLS = new Set(['agent_town_ui_publish_post']);
const EXPERIENCE_INTENT_TRACE_LIMIT = 200;
const experienceIntentTrace = [];
let experienceIntentAtlasState = {
  query: '',
  family: '',
  searchType: 'keyword'
};
let experienceIntentPonyState = {
  composeOpen: false,
  toHouseId: '',
  subject: '',
  draft: ''
};
let pendingTownhallHumanImage = null;
let pendingTownhallAgentImage = null;
let townhallMintConfig = null;
let townhallMintConfigPromise = null;
const townhallModuleCache = new Map();

function b64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function loadPrivyConfigForApp() {
  if (appPrivyConfig !== null) return appPrivyConfig;
  try {
    const resp = await fetch('/api/privy/config', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (!resp.ok) {
      appPrivyConfig = { ok: false, enabled: false, appPath: '/app' };
      return appPrivyConfig;
    }
    const payload = await resp.json().catch(() => null);
    const enabled = payload && payload.enabled === true;
    appPrivyConfig = {
      ok: payload?.ok === true,
      enabled,
      appPath: payload?.appPath || '/app'
    };
    return appPrivyConfig;
  } catch {
    appPrivyConfig = { ok: false, enabled: false, appPath: '/app' };
    return appPrivyConfig;
  }
}

async function ensurePrivyAuthenticatedForHub() {
  if (!isTownHub) return true;

  const cfg = await loadPrivyConfigForApp();
  if (!cfg || cfg.enabled !== true) return true;
  if (typeof window.ensurePrivyLogin !== 'function') return false;

  try {
    const isLoggedIn = await window.ensurePrivyLogin({ interactive: false });
    if (!isLoggedIn) return false;
  } catch {
    return false;
  }

  if (appWalletClient) {
    try {
      await connectWallet({ silent: true });
    } catch {
      // no-op; wallet actions will surface specific errors when needed.
    }
  }

  updateWalletUI();
  return true;
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

function setWalletStatus(msg, isError = false) {
  const elStatus = el('walletStatus');
  if (!elStatus) return;
  if (!msg || !isError) {
    elStatus.textContent = '';
    elStatus.style.display = 'none';
    return;
  }
  elStatus.style.display = 'block';
  elStatus.textContent = msg;
  elStatus.style.color = 'var(--bad)';
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

function setHatchStatus(text) {
  const status = el('hatchStatus');
  if (!status) return;
  status.textContent = text || '';
}

function updateWalletUI() {
  const btn = el('connectWalletBtn');
  if (btn) {
    btn.textContent = walletAddr ? tApp('common.disconnect_wallet') : tApp('common.connect_wallet');
    btn.setAttribute('aria-pressed', walletAddr ? 'true' : 'false');
  }
  const addr = el('walletAddr');
  if (addr) addr.textContent = walletAddr || '—';
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
  if (!appWalletClient) return;
  if (walletEventBindings) return;

  const onDisconnect = () => {
    // Wallet disconnected outside the app.
    disconnectWallet({ fromProvider: true })
      .then(() => maybeResetAfterWalletDisconnect())
      .catch(() => { });
  };
  const onAccountChanged = (next) => {
    const nextAddr = walletAddressFromEvent(next);
    if (!nextAddr) {
      disconnectWallet({ fromProvider: true }).catch(() => { });
      return;
    }
    if (walletAddr && walletAddr !== nextAddr) {
      walletAddr = nextAddr;
      walletHouseId = null;
      walletRecovered = false;
      updateWalletUI();
      saveWalletCache();
      if (lastState) updateUI(lastState);
    }
  };

  appWalletClient.on('disconnect', onDisconnect);
  appWalletClient.on('accountChanged', onAccountChanged);
  walletEventBindings = { onDisconnect, onAccountChanged };
}

function unbindWalletEvents() {
  if (!walletEventBindings) return;
  const { onDisconnect, onAccountChanged } = walletEventBindings;
  if (appWalletClient) {
    appWalletClient.off('disconnect', onDisconnect);
    appWalletClient.off('accountChanged', onAccountChanged);
  }
  walletEventBindings = null;
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

function loadPathMode() {
  return 'coop';
}

function savePathMode(_mode) {
  try {
    localStorage.setItem(PATH_STORAGE_KEY, 'coop');
  } catch {
    // ignore storage errors
  }
}

function loadTokenError() {
  try {
    const msg = localStorage.getItem(TOKEN_ERROR_KEY);
    if (msg) localStorage.removeItem(TOKEN_ERROR_KEY);
    return msg || null;
  } catch {
    return null;
  }
}

function setTokenError(msg) {
  const tokenError = el('tokenError');
  if (tokenError) tokenError.textContent = msg || '';
}

function updatePathButtons() {
  pathMode = 'coop';
}

function setPathMode(_mode, { persist = true, refresh = true } = {}) {
  pathMode = 'coop';
  if (persist) savePathMode('coop');
  updatePathButtons();
  if (refresh && lastState) updateUI(lastState);
}

function onboardingRequired(state) {
  return !!state?.onboarding?.required;
}

function isTownhallRegistrationComplete(state) {
  return state?.onboarding?.registrationComplete === true;
}

function isTownhallGateLocked(state) {
  if (!isTownHub) return false;
  if (!state) return false;
  return onboardingRequired(state) && getOnboardingStep(state) === ONBOARDING_STEP_TOWNHALL;
}

function isTownhallBrainConfigured(state) {
  if (onboardingRequired(state)) return !!state?.lite?.llmConfigured;
  return !!(state?.lite?.llmConfigured || isLocalLiteLlmConfigured());
}

function getTownHubDistrictGateReason(state) {
  if (!isTownHub) return null;
  const step = getOnboardingStep(state);
  if (step === ONBOARDING_STEP_TOWNHALL) return 'onboarding';
  if (step === ONBOARDING_STEP_BRAIN) return 'brain';
  if (step === ONBOARDING_STEP_SIGIL) return 'sigil';
  if (step === ONBOARDING_STEP_CEREMONY) return 'ceremony';
  return null;
}

function isTownHubDistrictGateLocked(state) {
  return !!getTownHubDistrictGateReason(state);
}

function getTownHubDistrictGateStatusText() {
  const reason = getTownHubDistrictGateReason(lastState);
  if (reason === 'onboarding') return tApp('townhall.gate_hint');
  if (reason === 'brain') return tApp('brain.help');
  if (reason === 'sigil') return tApp('sigil.match_detail');
  if (reason === 'ceremony') return tApp('ceremony.gate_hint');
  return '';
}

function canUseTownhallSigilFlow(state) {
  if (!onboardingRequired(state)) return true;
  const step = getOnboardingStep(state);
  return (
    (step === ONBOARDING_STEP_SIGIL || step === ONBOARDING_STEP_CEREMONY || step === ONBOARDING_STEP_DONE)
    && isAnyAgentConnected(state)
    && isTownhallBrainConfigured(state)
  );
}

function applyDistrictHotspotLocks(state) {
  if (!isTownHub) return;
  const gateLocked = isTownHubDistrictGateLocked(state);
  document.querySelectorAll('.townDistrictHotspot[data-district]').forEach((hotspot) => {
    const district = normalizeDistrict(hotspot.getAttribute('data-district') || 'house');
    const blocked = gateLocked && district !== 'townhall';
    hotspot.classList.toggle('is-locked', blocked);
    hotspot.setAttribute('aria-disabled', blocked ? 'true' : 'false');
  });
}

function districtStatusText(district) {
  const statusText = getTownHubDistrictGateStatusText();
  if (statusText) {
    return tApp('district.status.locked', { status: statusText });
  }
  if (!district) return tApp('district.status.select');
  if (district === 'atlas') return tApp('district.status.atlas');
  if (district === 'townhall') return tApp('district.status.townhall');
  if (district === 'saloon') return tApp('district.status.saloon');
  if (district === 'pony') return tApp('district.status.pony');
  if (district === 'leaderboard') return tApp('district.status.leaderboard');
  return tApp('district.status.house');
}

function setActiveDistrict(district) {
  const next = district === 'atlas' || district === 'townhall' || district === 'saloon' || district === 'pony' || district === 'leaderboard' || district === 'house'
    ? district
    : null;
  activeDistrict = next;

  document.querySelectorAll('.townDistrictHotspot[data-district]').forEach((hotspot) => {
    const isActive = hotspot.getAttribute('data-district') === next;
    hotspot.classList.toggle('is-active', isActive);
    hotspot.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  const status = el('townSceneStatus');
  if (status) status.textContent = districtStatusText(next);
}

function normalizeDistrict(district) {
  return district === 'atlas'
    || district === 'townhall'
    || district === 'saloon'
    || district === 'pony'
    || district === 'leaderboard'
    || district === 'brain'
    || district === 'sigil'
    || district === 'ceremony'
    || district === 'house'
    ? district
    : 'house';
}

function explicitDistrictFromInput(district) {
  return district === 'atlas'
    || district === 'townhall'
    || district === 'saloon'
    || district === 'pony'
    || district === 'leaderboard'
    || district === 'brain'
    || district === 'sigil'
    || district === 'house'
    ? district
    : null;
}

function clearTouchDistrictPrime() {
  touchPrimedDistrict = null;
  touchPrimedAt = 0;
}

function clearDistrictSelection() {
  clearTouchDistrictPrime();
  setActiveDistrict(null);
}

function bindDistrictMapInteractions() {
  if (!isTownHub) return;

  const hotspots = document.querySelectorAll('.townDistrictHotspot[data-district]');
  hotspots.forEach((hotspot) => {
    const district = normalizeDistrict(hotspot.getAttribute('data-district') || 'house');

    hotspot.addEventListener('pointerenter', (ev) => {
      if (ev.pointerType === 'touch') return;
      hotspot.classList.add('is-hovered');
    });

    hotspot.addEventListener('pointerleave', () => {
      hotspot.classList.remove('is-hovered');
    });

    hotspot.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType !== 'touch') {
        clearTouchDistrictPrime();
        return;
      }

      if (isTownHubDistrictGateLocked(lastState) && district !== 'townhall') {
        setActiveDistrict('townhall');
        ev.preventDefault();
        return;
      }

      suppressDistrictClickUntil = Date.now() + TOUCH_CLICK_SUPPRESS_MS;
      const now = Date.now();
      const isSecondTap = touchPrimedDistrict === district && (now - touchPrimedAt) <= TOUCH_PRIME_WINDOW_MS;

      if (isSecondTap) {
        clearTouchDistrictPrime();
        ev.preventDefault();
        showDistrict(district);
        return;
      }

      touchPrimedDistrict = district;
      touchPrimedAt = now;
      setActiveDistrict(district);
      ev.preventDefault();
    });

    hotspot.addEventListener('click', () => {
      if (isTownHubDistrictGateLocked(lastState) && district !== 'townhall') {
        setActiveDistrict('townhall');
        return;
      }
      if (Date.now() <= suppressDistrictClickUntil) {
        return;
      }
      clearTouchDistrictPrime();
      showDistrict(district);
    });
  });

  document.addEventListener('pointerdown', (ev) => {
    if (isTownhallGateLocked(lastState)) return;
    const districtHotspot = ev.target && ev.target.closest ? ev.target.closest('.townDistrictHotspot[data-district]') : null;
    if (!districtHotspot) {
      clearDistrictSelection();
    }
  });
}

function clearTownBoardPoll() {
  if (townBoardPollTimer) {
    clearTimeout(townBoardPollTimer);
    townBoardPollTimer = null;
  }
}

function formatPublicHandle(value) {
  if (!value) return '—';
  const trimmed = String(value).trim();
  if (!trimmed) return '—';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function resolveSharePathFromState(state) {
  const shareId = typeof state?.share?.id === 'string' ? state.share.id.trim() : '';
  if (shareId) return `/s/${encodeURIComponent(shareId)}`;
  const sharePath = typeof state?.share?.sharePath === 'string' ? state.share.sharePath.trim() : '';
  if (sharePath.startsWith('/s/')) return sharePath;
  return '';
}

async function lookupSharePathByHouse(houseId) {
  const normalized = String(houseId || '').trim();
  if (!normalized) return '';
  try {
    const response = await api(`/api/share/by-house/${encodeURIComponent(normalized)}`);
    const sharePath = typeof response?.sharePath === 'string' ? response.sharePath.trim() : '';
    return sharePath.startsWith('/s/') ? sharePath : '';
  } catch (err) {
    if (Number(err?.status || 0) === 404) return '';
    throw err;
  }
}

function routeToShareCard(sharePath) {
  const normalized = String(sharePath || '').trim();
  if (!normalized) return;
  const resolved = routeToPopupMode(normalized);
  if (resolved?.mode === 'frame') {
    openRouteInModalFrame(resolved.url, resolved.title || 'Share Card');
    return;
  }
  if (resolved?.mode === 'district') {
    showDistrict(resolved.district);
    return;
  }
  if (resolved?.mode === 'leave' && resolved.url) {
    hideDistrict();
    window.location.assign(resolved.url);
    return;
  }
  hideDistrict();
  window.location.assign(normalized);
}

function renderTownBoard(data) {
  const signups = el('townBoardSignups');
  const teams = el('townBoardTeams');
  const referrals = el('townBoardReferrals');
  const list = el('townBoardList');
  const empty = el('townBoardEmpty');
  if (!signups || !teams || !referrals || !list || !empty) return;

  signups.textContent = String(data?.signups ?? '—');
  teams.textContent = String((data?.teams || []).length);
  referrals.textContent = String(data?.referralsTotal ?? '—');

  const publicTeams = Array.isArray(data?.teams) ? data.teams : [];
  list.innerHTML = '';

  if (!publicTeams.length) {
    empty.classList.remove('is-hidden');
    return;
  }

  empty.classList.add('is-hidden');
  publicTeams.forEach((team) => {
    const card = document.createElement('div');
    card.className = 'card';
    const title = document.createElement('div');
    const heading = document.createElement('strong');
    heading.textContent = `Team ${team.shareId || '—'}`;
    title.appendChild(heading);
    card.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.appendChild(document.createTextNode(`Referrals: ${team.referrals || 0}`));
    if (team.createdAt) {
      meta.appendChild(document.createTextNode(` • Created: ${team.createdAt}`));
    }
    if (team.humanHandle || team.agentName || team.publicMedia?.prompt) {
      meta.appendChild(document.createTextNode(' • '));
      const human = team.humanHandle ? formatPublicHandle(team.humanHandle) : '';
      const agent = team.agentName ? `agent: ${team.agentName}` : '';
      const parts = [];
      if (human) parts.push(`human: ${human}`);
      if (agent) parts.push(agent);
      const label = parts.length ? parts.join(' • ') : '';
      meta.appendChild(document.createTextNode(label || ''));
    }
    card.appendChild(meta);

    if (team.publicMedia?.imageUrl) {
      const media = document.createElement('div');
      media.className = 'public-media';
      const img = document.createElement('img');
      img.src = team.publicMedia.imageUrl;
      img.alt = team.publicMedia.prompt ? `Public image: ${team.publicMedia.prompt}` : 'Public house image';
      img.loading = 'lazy';
      media.appendChild(img);
      if (team.publicMedia.prompt) {
        const caption = document.createElement('div');
        caption.className = 'small';
        caption.textContent = team.publicMedia.prompt;
        media.appendChild(caption);
      }
      card.appendChild(media);
    }

    const links = document.createElement('div');
    links.className = 'kv';

    const share = document.createElement('a');
    share.className = 'btn';
    if (team.shareId) {
      share.href = `/s/${team.shareId}`;
      share.textContent = 'Open share';
    } else {
      share.textContent = 'Share unavailable';
      share.href = '#';
      share.classList.add('is-hidden');
    }
    links.appendChild(share);

    if (team.publicMedia?.imageUrl && team.shareId) {
      const mediaBtn = document.createElement('a');
      mediaBtn.className = 'btn';
      mediaBtn.href = `/s/${team.shareId}`;
      mediaBtn.textContent = 'View public media';
      links.appendChild(mediaBtn);
    }
    card.appendChild(links);
    list.appendChild(card);
  });
}

function scheduleTownBoardPoll() {
  clearTownBoardPoll();
  const loadOnce = async () => {
    if (currentDistrict !== 'leaderboard' || !isTownHub) return;
    try {
      const data = await api('/api/leaderboard');
      if (currentDistrict === 'leaderboard') {
        renderTownBoard(data);
      }
    } catch {
      // ignore polling failures
    }
    if (currentDistrict === 'leaderboard') {
      townBoardPollTimer = setTimeout(loadOnce, 2000);
    }
  };
  loadOnce();
}

function setModalBusy(isBusy) {
  const body = el('districtModalBody');
  if (!body) return;
  safeSetClassList(body, 'is-loading', isBusy);
}

async function loadDistrictView(district) {
  const safeDistrict = normalizeDistrict(district);
  if (!districtViewCache.has(safeDistrict)) {
    const source = districtViews[safeDistrict]?.viewPath;
    if (!source) {
      throw new Error(`Missing view for district: ${safeDistrict}`);
    }
    const resp = await fetch(source);
    if (!resp.ok) {
      throw new Error(`HTTP_${resp.status}`);
    }
    const text = await resp.text();
    districtViewCache.set(safeDistrict, text);
  }
  return districtViewCache.get(safeDistrict);
}

const townhallDraftFieldIds = [
  'townhallHumanName',
  'townhallAgentName',
  'townhallHumanPrompt',
  'townhallAgentPrompt'
];

const townhallMintSteps = [
  { key: 'userEvm', role: 'user', chain: 'evm', statusId: 'townhallMintUserEvmStatus' },
  { key: 'userSolana', role: 'user', chain: 'solana', statusId: 'townhallMintUserSolanaStatus' },
  { key: 'agentEvm', role: 'agent', chain: 'evm', statusId: 'townhallMintAgentEvmStatus' },
  { key: 'agentSolana', role: 'agent', chain: 'solana', statusId: 'townhallMintAgentSolanaStatus' }
];

function createEmptyTownhallMintDraft() {
  return {
    user: {
      evm: { id: '', chain: 'sepolia', txHash: '' },
      solana: { id: '', cluster: 'devnet', txSig: '' }
    },
    agent: {
      evm: { id: '', chain: 'sepolia', txHash: '' },
      solana: { id: '', cluster: 'devnet', txSig: '' }
    }
  };
}

function cloneTownhallMintDraft(value) {
  if (!value || typeof value !== 'object') return createEmptyTownhallMintDraft();
  return JSON.parse(JSON.stringify(value));
}

function normalizeTownhallMintDraftFromOnboarding(onboarding) {
  const out = createEmptyTownhallMintDraft();
  const erc = onboarding?.erc8004 && typeof onboarding.erc8004 === 'object' ? onboarding.erc8004 : {};
  const userEvm = erc?.user?.evm && typeof erc.user.evm === 'object' ? erc.user.evm : {};
  const userSolana = erc?.user?.solana && typeof erc.user.solana === 'object' ? erc.user.solana : {};
  const agentEvm = erc?.agent?.evm && typeof erc.agent.evm === 'object' ? erc.agent.evm : {};
  const agentSolana = erc?.agent?.solana && typeof erc.agent.solana === 'object' ? erc.agent.solana : {};

  out.user.evm.id = typeof userEvm.id === 'string' ? userEvm.id : '';
  out.user.evm.chain = typeof userEvm.chain === 'string' && userEvm.chain.trim() ? userEvm.chain : 'sepolia';
  out.user.evm.txHash = typeof userEvm.txHash === 'string' ? userEvm.txHash : '';
  out.user.solana.id = typeof userSolana.id === 'string' ? userSolana.id : '';
  out.user.solana.cluster = typeof userSolana.cluster === 'string' && userSolana.cluster.trim()
    ? userSolana.cluster
    : 'devnet';
  out.user.solana.txSig = typeof userSolana.txSig === 'string' ? userSolana.txSig : '';

  out.agent.evm.id = typeof agentEvm.id === 'string' ? agentEvm.id : '';
  out.agent.evm.chain = typeof agentEvm.chain === 'string' && agentEvm.chain.trim()
    ? agentEvm.chain
    : 'sepolia';
  out.agent.evm.txHash = typeof agentEvm.txHash === 'string' ? agentEvm.txHash : '';

  out.agent.solana.id = typeof agentSolana.id === 'string' ? agentSolana.id : '';
  out.agent.solana.cluster = typeof agentSolana.cluster === 'string' && agentSolana.cluster.trim()
    ? agentSolana.cluster
    : 'devnet';
  out.agent.solana.txSig = typeof agentSolana.txSig === 'string' ? agentSolana.txSig : '';

  return out;
}

function hasTownhallMintIdentity(draft, role, chain) {
  if (!draft || typeof draft !== 'object') return false;
  const id = draft?.[role]?.[chain]?.id;
  return typeof id === 'string' && !!id.trim();
}

function setTownhallMintStepStatus(step, kind) {
  const node = el(step.statusId);
  if (!node) return;
  if (kind === 'running') {
    node.textContent = tApp('townhall.mint.running');
    node.style.color = 'var(--accent)';
    return;
  }
  if (kind === 'done') {
    node.textContent = tApp('townhall.mint.done');
    node.style.color = 'var(--good)';
    return;
  }
  if (kind === 'error') {
    node.textContent = tApp('townhall.mint.error');
    node.style.color = 'var(--bad)';
    return;
  }
  node.textContent = tApp('townhall.mint.pending');
  node.style.color = 'var(--muted)';
}

function syncTownhallMintChecklist(draft, { activeStep = null, errorStep = null } = {}) {
  const safeDraft = draft && typeof draft === 'object' ? draft : createEmptyTownhallMintDraft();
  let doneCount = 0;
  for (const step of townhallMintSteps) {
    let kind = 'pending';
    if (errorStep && step.key === errorStep) {
      kind = 'error';
    } else if (activeStep && step.key === activeStep) {
      kind = 'running';
    } else if (hasTownhallMintIdentity(safeDraft, step.role, step.chain)) {
      kind = 'done';
    }
    setTownhallMintStepStatus(step, kind);
    const pill = el(step.statusId);
    if (pill) pill.setAttribute('data-mint-status', kind);
    if (kind === 'done') doneCount++;
  }
  const bar = el('townhallMintProgressBar');
  if (bar) bar.style.width = `${(doneCount / townhallMintSteps.length) * 100}%`;
}

let townhallMintDraft = createEmptyTownhallMintDraft();
let townhallMintDraftDirty = false;
let townhallMintInFlight = false;
let townhallMintLastErrorStep = null;
let townhallStoryStep = 'human';
let townhallHumanCustomizeOpen = false;
let townhallAgentCustomizeOpen = false;
let townhallAwaitingContinue = false;
let townhallSigilUnlockedByContinue = false;
let townhallRegistrationCompletedOnce = false;

function setTownhallStoryStep(step) {
  const next = step === 'agent' || step === 'processing' ? step : 'human';
  townhallStoryStep = next;
  const humanStep = el('townhallStepHuman');
  const agentStep = el('townhallStepAgent');
  const processingStep = el('townhallStepProcessing');
  if (humanStep) humanStep.classList.toggle('is-hidden', next !== 'human');
  if (agentStep) agentStep.classList.toggle('is-hidden', next !== 'agent');
  if (processingStep) processingStep.classList.toggle('is-hidden', next !== 'processing');
}

function setTownhallCustomizeOpen(kind, open) {
  const isHuman = kind === 'human';
  const panel = el(isHuman ? 'townhallHumanCustomize' : 'townhallAgentCustomize');
  const btn = el(isHuman ? 'townhallHumanCustomizeBtn' : 'townhallAgentCustomizeBtn');
  if (panel) panel.classList.toggle('is-hidden', !open);
  if (btn) {
    btn.textContent = open ? tApp('townhall.customize_hide') : tApp('townhall.customize');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (isHuman) {
    townhallHumanCustomizeOpen = open;
  } else {
    townhallAgentCustomizeOpen = open;
  }
}

function getTownhallDraftFieldNodes() {
  return townhallDraftFieldIds
    .map((id) => el(id))
    .filter(Boolean);
}

function markTownhallFieldDirty(inputEl) {
  if (!inputEl || !inputEl.dataset) return;
  inputEl.dataset.townhallDirty = '1';
}

function clearTownhallDraftDirtyFlags() {
  for (const input of getTownhallDraftFieldNodes()) {
    input.dataset.townhallDirty = '0';
  }
}

function bindTownhallDraftField(inputEl) {
  if (!inputEl || inputEl.dataset.townhallDraftBound === '1') return;
  inputEl.dataset.townhallDraftBound = '1';
  const markDirty = () => markTownhallFieldDirty(inputEl);
  inputEl.addEventListener('input', markDirty);
  inputEl.addEventListener('change', markDirty);
}

function syncTownhallInputValue(inputEl, nextValue) {
  if (!inputEl) return;
  const isFocused = document.activeElement === inputEl;
  const isDirty = inputEl.dataset.townhallDirty === '1';
  if (!isFocused && !isDirty) {
    const normalized = nextValue == null ? '' : String(nextValue);
    if (inputEl.value !== normalized) inputEl.value = normalized;
    inputEl.dataset.townhallDirty = '0';
  }
}

function normalizeTownhallMintConfig(payload) {
  const mint = payload?.mint && typeof payload.mint === 'object' ? payload.mint : {};
  const evm = mint.evm && typeof mint.evm === 'object' ? mint.evm : {};
  const solana = mint.solana && typeof mint.solana === 'object' ? mint.solana : {};
  const chainId = Number(evm.chainId || 11155111);
  const contractAddress = normalizeEvmAddress(evm.contractAddress || DEFAULT_EVM_ERC8004_IDENTITY_REGISTRY);
  return {
    enabled: mint.enabled === true,
    pinataEnabled: mint.pinataEnabled === true,
    evm: {
      enabled: evm.enabled === true,
      chainId: Number.isFinite(chainId) && chainId > 0 ? Math.floor(chainId) : 11155111,
      network: typeof evm.network === 'string' && evm.network.trim() ? evm.network.trim() : 'sepolia',
      rpcUrl: typeof evm.rpcUrl === 'string' && evm.rpcUrl.trim() ? evm.rpcUrl.trim() : '',
      contractAddress: contractAddress || DEFAULT_EVM_ERC8004_IDENTITY_REGISTRY
    },
    solana: {
      enabled: solana.enabled === true,
      cluster: typeof solana.cluster === 'string' && solana.cluster.trim() ? solana.cluster.trim() : 'devnet',
      rpcUrl: typeof solana.rpcUrl === 'string' && solana.rpcUrl.trim() ? solana.rpcUrl.trim() : 'https://api.devnet.solana.com',
      web3ModuleUrl: typeof solana.web3ModuleUrl === 'string' && solana.web3ModuleUrl.trim()
        ? solana.web3ModuleUrl.trim()
        : DEFAULT_SOLANA_WEB3_MODULE_URL,
      sponsorSendEnabled: solana.sponsorSendEnabled === true,
      sponsorFeePayer: typeof solana.sponsorFeePayer === 'string' && solana.sponsorFeePayer.trim()
        ? solana.sponsorFeePayer.trim()
        : null,
      sponsorSendError: typeof solana.sponsorSendError === 'string' && solana.sponsorSendError.trim()
        ? solana.sponsorSendError.trim()
        : null
    }
  };
}

function fallbackTownhallMintConfig() {
  return normalizeTownhallMintConfig({ mint: {} });
}

async function ensureTownhallMintConfig({ force = false } = {}) {
  if (!force && townhallMintConfig) return townhallMintConfig;
  if (!force && townhallMintConfigPromise) return townhallMintConfigPromise;

  townhallMintConfigPromise = api('/api/townhall/mint/config')
    .then((resp) => {
      townhallMintConfig = normalizeTownhallMintConfig(resp);
      return townhallMintConfig;
    })
    .catch(() => {
      townhallMintConfig = fallbackTownhallMintConfig();
      return townhallMintConfig;
    })
    .finally(() => {
      townhallMintConfigPromise = null;
    });
  return townhallMintConfigPromise;
}

function applyTownhallMintConfig(config) {
  const cfg = config || fallbackTownhallMintConfig();
  const registerBtn = el('townhallRegisterBtn');
  const allChainsReady = cfg.evm.enabled && cfg.solana.enabled;
  if (registerBtn) {
    registerBtn.disabled = townhallMintInFlight || !allChainsReady;
    registerBtn.title = allChainsReady ? '' : tApp('townhall.mint.error.all_chains_required');
    registerBtn.textContent = townhallMintInFlight ? tApp('townhall.mint.processing') : tApp('townhall.retry');
  }
  const continueBtn = el('townhallContinueBtn');
  if (continueBtn && townhallMintInFlight) continueBtn.disabled = true;
}

function collectTownhallProfilePayload() {
  const payload = {
    humanName: (el('townhallHumanName')?.value || '').trim(),
    agentName: (el('townhallAgentName')?.value || '').trim(),
    humanAvatar: {
      prompt: (el('townhallHumanPrompt')?.value || '').trim()
    },
    agentAvatar: {
      prompt: (el('townhallAgentPrompt')?.value || '').trim()
    }
  };
  if (pendingTownhallHumanImage) payload.humanAvatar.image = pendingTownhallHumanImage;
  if (pendingTownhallAgentImage) payload.agentAvatar.image = pendingTownhallAgentImage;
  return payload;
}

function knownMintErrorMessage(err, chain = 'evm') {
  const code = String(err?.message || err || '').trim();
  const chainLabel = formatMintChainLabel(chain);
  const assetLabel = String(chain || '').trim().toLowerCase() === 'solana' ? 'SOL' : 'ETH';
  if (!code) return tApp('mint.error.failed_no_code', { chain: chainLabel });
  const lowerCode = code.toLowerCase();
  if (
    lowerCode.includes('wallet proxy not initialized')
    || lowerCode.includes('embedded_wallet_proxy_not_initialized')
    || lowerCode.includes('wallet_proxy_not_initialized')
  ) {
    return tApp('mint.error.wallet_proxy_not_initialized');
  }
  if (code === 'MINT_ALL_CHAINS_NOT_ENABLED') return tApp('mint.error.all_chains_not_enabled');
  if (code === 'INVALID_MINT_SUBJECT') return tApp('mint.error.invalid_subject');
  if (code === 'MINT_DISABLED') return tApp('mint.error.disabled');
  if (code === 'PINATA_NOT_CONFIGURED') return tApp('mint.error.pinata_not_configured');
  if (code === 'PINATA_UPLOAD_FAILED') {
    const detailRaw = String(err?.data?.detail || err?.detail || '').trim();
    const detail = detailRaw.toUpperCase();
    if (detail.includes('NO_SCOPES_FOUND')) {
      return tApp('mint.error.pinata_scopes_missing');
    }
    if (detail.includes('UNAUTHORIZED') || detail.includes('FORBIDDEN') || err?.status === 401 || err?.status === 403) {
      return tApp('mint.error.pinata_rejected');
    }
    return detailRaw
      ? tApp('mint.error.ipfs_upload_failed_detail', { detail: detailRaw })
      : tApp('mint.error.ipfs_upload_failed');
  }
  if (code === 'MINT_EVM_NOT_CONFIGURED' || code === 'MINT_SOLANA_NOT_CONFIGURED') {
    return tApp('mint.error.chain_not_configured', { chain: chainLabel });
  }
  if (code === 'MINT_EVM_CONTRACT_NOT_CONFIGURED') return tApp('mint.error.evm_contract_not_configured');
  if (code === 'INVALID_EVM_ADDRESS') return tApp('mint.error.invalid_evm_address');
  if (code === 'MISSING_HUMAN_NAME') return tApp('mint.error.missing_name', { role: tApp('townhall.path.human') });
  if (code === 'MISSING_AGENT_NAME') return tApp('mint.error.missing_name', { role: tApp('townhall.path.agent') });
  if (code === 'MISSING_HUMAN_AVATAR_PROMPT') {
    return tApp('mint.error.missing_avatar_prompt', { role: tApp('townhall.path.human') });
  }
  if (code === 'MISSING_AGENT_AVATAR_PROMPT') {
    return tApp('mint.error.missing_avatar_prompt', { role: tApp('townhall.path.agent') });
  }
  if (code === 'INVALID_TOWNHALL_IMAGE' || code === 'TOWNHALL_IMAGE_TOO_LARGE') {
    return tApp('mint.error.invalid_townhall_image');
  }
  if (code === 'NO_EVM_WALLET' || code === 'NO_EVM_ACCOUNT') return tApp('mint.error.evm_wallet_required');
  if (code === 'NO_EVM_PROVIDER') return tApp('mint.error.evm_provider_unavailable');
  if (code === 'EVM_CHAIN_SWITCH_FAILED') return tApp('mint.error.switch_sepolia');
  if (code === 'EVM_ACCOUNT_MISMATCH') return tApp('mint.error.evm_account_mismatch');
  if (code === 'NO_SOLANA_WALLET' || code === 'NO_SOLANA_PUBKEY') return tApp('mint.error.solana_wallet_required');
  if (code === 'MISSING_SOLANA_ADDRESS') return tApp('mint.error.solana_address_required');
  if (code === 'MISSING_SOLANA_ASSET_PUBKEY') return tApp('mint.error.solana_asset_key_prepare');
  if (code === 'INVALID_SOLANA_ASSET_PUBKEY') return tApp('mint.error.solana_asset_key_invalid');
  if (code === 'SOLANA_SIGNER_MISMATCH') return tApp('mint.error.solana_signer_mismatch');
  if (code === 'SOLANA_PREPARE_SIGNED') return tApp('mint.error.solana_prepare_unsigned_required');
  if (code === 'SOLANA_PREPARE_FAILED') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    return detailRaw
      ? tApp('mint.error.solana_prepare_failed_detail', { detail: detailRaw })
      : tApp('mint.error.solana_prepare_failed');
  }
  if (code === 'SOLANA_SPONSOR_NOT_CONFIGURED') {
    return tApp('mint.error.solana_sponsor_not_configured');
  }
  if (code === 'SOLANA_SPONSOR_SECRET_INVALID') {
    return tApp('mint.error.solana_sponsor_secret_invalid');
  }
  if (code === 'INVALID_SOLANA_SPONSORED_TX') return tApp('mint.error.invalid_sponsored_tx');
  if (code === 'SOLANA_SPONSORED_WALLET_SIGNATURE_MISSING') {
    return tApp('mint.error.wallet_signature_missing');
  }
  if (code === 'SOLANA_SPONSORED_ASSET_SIGNATURE_MISSING') {
    return tApp('mint.error.asset_signature_missing');
  }
  if (code === 'SOLANA_SPONSORED_TX_NOT_PREPARED') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    return detailRaw
      ? tApp('mint.error.sponsored_tx_not_prepared_detail', { detail: detailRaw })
      : tApp('mint.error.sponsored_tx_not_prepared');
  }
  if (code === 'SOLANA_SPONSORED_FEEPAYER_NOT_SIGNER') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    return detailRaw
      ? tApp('mint.error.fee_payer_not_signer_detail', { detail: detailRaw })
      : tApp('mint.error.fee_payer_not_signer');
  }
  if (code === 'SOLANA_SPONSOR_FEEPAYER_MATCHES_WALLET') {
    return tApp('mint.error.fee_payer_matches_wallet');
  }
  if (code === 'SOLANA_SPONSOR_FEEPAYER_UNFUNDED') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    return detailRaw
      ? tApp('mint.error.fee_payer_unfunded_detail', { detail: detailRaw })
      : tApp('mint.error.fee_payer_unfunded');
  }
  if (code === 'SOLANA_SPONSORED_OWNER_UNFUNDED') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    return detailRaw
      ? tApp('mint.error.owner_unfunded_detail', { detail: detailRaw })
      : tApp('mint.error.owner_unfunded');
  }
  if (code === 'SOLANA_SIGN_TX_UNSUPPORTED') {
    return tApp('mint.error.solana_sign_unsupported');
  }
  if (code === 'SOLANA_SPONSOR_SEND_FAILED') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    return detailRaw
      ? tApp('mint.error.sponsor_send_failed_detail', { detail: detailRaw })
      : tApp('mint.error.sponsor_send_failed');
  }
  if (code === 'SOLANA_WEB3_UNAVAILABLE') return tApp('mint.error.solana_web3_unavailable');
  if (code === 'SOLANA_TX_SEND_FAILED' || code === 'SOLANA_TX_SEND_UNSUPPORTED') {
    return tApp('mint.error.solana_tx_send_failed');
  }
  if (code === 'MINT_EVM_FAILED') return tApp('mint.error.evm_prepare_failed');
  if (code === 'PRIVY_SOLANA_SPONSORED_TX_UNAVAILABLE') {
    return tApp('mint.error.privy_sponsored_unavailable', {
      chain: formatMintChainLabel('solana'),
      extra: tApp('mint.error.privy_sponsored_unavailable_solana_extra')
    });
  }
  if (code === 'PRIVY_SPONSORED_TX_TEE_REQUIRED') {
    return tApp('mint.error.privy_tee_required');
  }
  if (code === 'PRIVY_SPONSORED_TX_UNAVAILABLE') {
    return tApp('mint.error.privy_sponsored_unavailable', {
      chain: formatMintChainLabel('evm'),
      extra: tApp('mint.error.privy_sponsored_unavailable_evm_extra')
    });
  }
  if (code === 'INVALID_PRIVY_WALLET_ID') {
    return tApp('mint.error.privy_wallet_id_missing', { chain: chainLabel });
  }
  if (code === 'PRIVY_WALLET_RPC_SIGN_UNAVAILABLE') {
    return tApp('mint.error.privy_signer_unavailable', { chain: chainLabel });
  }
  if (code === 'PRIVY_WALLET_RPC_SIGNING_PAYLOAD_MISSING') {
    return tApp('mint.error.invalid_sponsored_payload');
  }
  if (code === 'PRIVY_WALLET_RPC_SIGN_FAILED') {
    const detail = String(err?.detail || err?.cause?.message || '').trim();
    return detail
      ? tApp('mint.error.privy_sign_failed_detail', { chain: chainLabel, detail })
      : tApp('mint.error.privy_sign_failed', { chain: chainLabel });
  }
  if (code === 'PRIVY_WALLET_RPC_RELAY_FAILED') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    const detail = detailRaw.toLowerCase();
    if (detail.includes('does not support the method')) {
      return tApp('mint.error.privy_execution_mode_unsupported', { chain: chainLabel });
    }
    if (
      detail.includes('insufficient funds')
      || detail.includes('exceeds the balance of the account')
      || detail.includes('total cost (gas * gas fee + value)')
    ) {
      return tApp('mint.error.privy_insufficient_funds', { chain: chainLabel, asset: assetLabel });
    }
    return detailRaw
      ? tApp('mint.error.privy_relay_failed_detail', { detail: detailRaw })
      : tApp('mint.error.privy_relay_failed');
  }
  if (code.startsWith('INVALID_PRIVY_WALLET_RPC_')) {
    return tApp('mint.error.invalid_sponsored_payload');
  }
  if (code === 'PRIVY_SOLANA_SPONSORED_TX_NO_RESULT') {
    return tApp('mint.error.privy_no_result', { chain: formatMintChainLabel('solana') });
  }
  if (code === 'PRIVY_SPONSORED_TX_NO_RESULT') {
    return tApp('mint.error.privy_no_result', { chain: formatMintChainLabel('evm') });
  }
  if (code === 'MINT_EVM_SPONSORED_NO_HANDLE') return tApp('mint.error.evm_no_handle');
  if (code === 'PRIVY_SERVER_AUTH_NOT_CONFIGURED') {
    return tApp('mint.error.privy_server_auth_missing');
  }
  if (code === 'PRIVY_TRANSACTION_STATUS_UNAVAILABLE') return tApp('mint.error.privy_tx_status_unavailable');
  if (code === 'MINT_EVM_SPONSORED_FAILED') return tApp('mint.error.evm_sponsored_failed');
  if (code === 'MINT_EVM_SPONSORED_TIMEOUT') return tApp('mint.error.evm_sponsored_timeout');
  if (code === 'MINT_EVM_REVERTED') return tApp('mint.error.evm_reverted');
  if (code === 'MINT_EVM_RECEIPT_TIMEOUT') return tApp('mint.error.evm_receipt_timeout');
  if (code === 'MINT_EVM_NO_AGENT_ID') return tApp('mint.error.evm_no_agent_id');
  if (code === 'MINT_SOLANA_NO_SIGNATURE') return tApp('mint.error.solana_no_signature');
  const lower = code.toLowerCase();
  if (
    lower.includes('attempt to debit an account but found no record of a prior credit')
    || lower.includes('did not pass signature verification')
  ) {
    return tApp('mint.error.solana_pre_execution_failed');
  }
  if (lower.includes('insufficient funds for rent')) {
    return String(chain || '').trim().toLowerCase() === 'solana'
      ? tApp('mint.error.insufficient_funds_rent_solana')
      : tApp('mint.error.insufficient_funds_evm', { asset: assetLabel });
  }
  if (
    lower.includes('insufficient funds')
    || lower.includes('exceeds the balance of the account')
    || lower.includes('total cost (gas * gas fee + value)')
  ) {
    return String(chain || '').trim().toLowerCase() === 'solana'
      ? tApp('mint.error.insufficient_funds_solana')
      : tApp('mint.error.insufficient_funds_evm', { asset: assetLabel });
  }
  if (lower.includes('user rejected') || lower.includes('rejected') || lower.includes('denied')) {
    return tApp('mint.error.wallet_rejected');
  }
  return formatMintCodeFallback(chain, code);
}

function isPrivyWalletProxyInitError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return msg.includes('wallet proxy not initialized')
    || msg.includes('embedded wallet proxy not initialized')
    || msg.includes('embedded_wallet_proxy_not_initialized')
    || msg.includes('wallet_proxy_not_initialized');
}

function inferMintErrorChain(err, fallback = 'evm') {
  const lower = String(err?.message || err || '').toLowerCase();
  if (lower.includes('solana')) return 'solana';
  if (lower.includes('sepolia') || lower.includes('evm') || lower.includes('ethereum')) return 'evm';
  return fallback === 'solana' ? 'solana' : 'evm';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function forcePrivyWalletReady({ interactive = true } = {}) {
  if (typeof window.ensurePrivyWalletLogin === 'function') {
    try {
      await window.ensurePrivyWalletLogin({ interactive: !!interactive });
    } catch {
      // ignore and let caller retry/throw
    }
  }

  const bridge = window.__PRIVY_WALLET_BRIDGE__;
  if (bridge && typeof bridge.resetWalletProxies === 'function') {
    try {
      await bridge.resetWalletProxies({ refreshUserState: false });
    } catch {
      // ignore and continue; reconnect calls below can still succeed
    }
  }
  if (bridge && typeof bridge.ensureLoggedIn === 'function') {
    try {
      await bridge.ensureLoggedIn({ interactive: false, preferred: 'solana' });
    } catch {
      // ignore and continue; wallet methods below may still succeed
    }
  }
  if (bridge && typeof bridge.connectSolana === 'function') {
    try {
      await bridge.connectSolana({ silent: !interactive });
    } catch {
      // ignore and let caller retry/throw
    }
  }
  if (bridge && typeof bridge.connectEvm === 'function') {
    try {
      await bridge.connectEvm();
    } catch {
      // ignore and let caller retry/throw
    }
  }

  await sleep(220);
}

async function withPrivyProxyRetry(task, { maxAttempts = 4, onRetry = null } = {}) {
  const attempts = Number.isFinite(Number(maxAttempts)) ? Math.max(1, Math.floor(maxAttempts)) : 4;
  let lastErr = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await task();
    } catch (err) {
      lastErr = err;
      if (!isPrivyWalletProxyInitError(err)) throw err;
      await forcePrivyWalletReady({ interactive: i === 0 });
      if (i >= 1 && typeof window.resetPrivyBridge === 'function') {
        try {
          await window.resetPrivyBridge({ hard: i >= 2 });
        } catch {
          // ignore reset failures and continue retry flow
        }
      }
      if (typeof onRetry === 'function') {
        try {
          await onRetry({ attempt: i + 1, error: err });
        } catch {
          // ignore retry hook errors and continue retrying
        }
      }
      if (i < attempts - 1) {
        await sleep(180 * (i + 1));
      }
    }
  }
  throw lastErr || new Error('PRIVY_WALLET_PROXY_NOT_READY');
}

async function loadTownhallModule(url) {
  const key = String(url || '').trim();
  if (!key) throw new Error('MISSING_MODULE_URL');
  if (!townhallModuleCache.has(key)) {
    townhallModuleCache.set(
      key,
      import(/* @vite-ignore */ key).catch((err) => {
        townhallModuleCache.delete(key);
        throw err;
      })
    );
  }
  return townhallModuleCache.get(key);
}

function townhallModuleMocksEnabled() {
  const host = typeof window.location?.hostname === 'string' ? window.location.hostname : '';
  const localHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)$/i.test(host);
  return localHost && window.__TOWNHALL_TEST_MOCKS_ENABLED__ === true;
}

async function loadSolanaWeb3(moduleUrl) {
  if (townhallModuleMocksEnabled() && window.__SOLANA_WEB3_MOCK && typeof window.__SOLANA_WEB3_MOCK === 'object') {
    return window.__SOLANA_WEB3_MOCK;
  }
  const configured = typeof moduleUrl === 'string' && moduleUrl.trim() ? moduleUrl.trim() : '';
  const candidates = [...new Set([configured, ...SOLANA_WEB3_MODULE_FALLBACK_URLS].filter(Boolean))];
  let lastErr = null;
  for (const url of candidates) {
    try {
      const mod = await loadTownhallModule(url);
      if (mod && typeof mod === 'object') return mod;
      lastErr = new Error('SOLANA_WEB3_INVALID_MODULE');
    } catch (err) {
      lastErr = err;
    }
  }
  const out = new Error('SOLANA_WEB3_UNAVAILABLE');
  if (lastErr) out.detail = String(lastErr?.message || lastErr);
  throw out;
}

async function ensureEvmMintWallet(config) {
  if (!appWalletClient) throw new Error('NO_EVM_WALLET');
  const connected = await withPrivyProxyRetry(() => appWalletClient.connect({ chain: 'evm' }));
  const address = connected?.address || appWalletClient.getAddress({ chain: 'evm' }) || null;
  const normalizedAddress = normalizeEvmAddress(address || '');
  if (!normalizedAddress) throw new Error('NO_EVM_ACCOUNT');
  saveWalletIdentityHint({ evm: normalizedAddress });
  let provider = connected?.provider || appWalletClient.getProvider({ chain: 'evm' });
  const refreshProvider = async () => {
    const refreshed = await appWalletClient.connect({ chain: 'evm' });
    const next = refreshed?.provider || appWalletClient.getProvider({ chain: 'evm' });
    if (next) provider = next;
    return provider;
  };
  const targetChainId = Number(config?.evm?.chainId || 11155111);
  if (Number.isFinite(targetChainId) && targetChainId > 0) {
    try {
      const currentChainId = await withPrivyProxyRetry(
        () => appWalletClient.getChainId({ chain: 'evm' }),
        { onRetry: refreshProvider }
      );
      if (currentChainId !== targetChainId) {
        await withPrivyProxyRetry(
          () => appWalletClient.switchChain({ chain: 'evm', chainId: targetChainId }),
          { onRetry: refreshProvider }
        );
      }
    } catch {
      throw new Error('EVM_CHAIN_SWITCH_FAILED');
    }
  }
  if (!provider) throw new Error('NO_EVM_PROVIDER');
  try {
    const accounts = await withPrivyProxyRetry(
      () => provider.request({ method: 'eth_requestAccounts' }),
      { onRetry: refreshProvider }
    );
    const primary = Array.isArray(accounts) && accounts.length ? normalizeEvmAddress(accounts[0]) : null;
    if (!primary || primary !== normalizedAddress) {
      throw new Error('EVM_ACCOUNT_MISMATCH');
    }
  } catch (err) {
    if (String(err?.message || '') === 'EVM_ACCOUNT_MISMATCH') throw err;
    throw new Error('EVM_ACCOUNT_MISMATCH');
  }
  const executionMode = typeof connected?.executionMode === 'string' && connected.executionMode.trim()
    ? connected.executionMode.trim().toLowerCase()
    : null;
  const isUnifiedWallet = typeof connected?.isUnifiedWallet === 'boolean'
    ? connected.isUnifiedWallet
    : null;
  return {
    address: normalizedAddress,
    provider,
    refreshProvider,
    executionMode,
    isUnifiedWallet
  };
}

async function ensureSolanaMintWallet(config) {
  if (!appWalletClient) throw new Error('NO_SOLANA_WALLET');
  const connected = await withPrivyProxyRetry(() => appWalletClient.connect({ chain: 'solana', silent: false }));
  const address = connected?.address || appWalletClient.getAddress({ chain: 'solana' }) || walletAddr || null;
  const normalizedAddress = normalizeSolanaAddress(address || '');
  if (!normalizedAddress) throw new Error('MISSING_SOLANA_ADDRESS');

  if (walletAddr !== normalizedAddress) {
    walletAddr = normalizedAddress;
    updateWalletUI();
    saveWalletCache();
  }
  saveWalletIdentityHint({ solana: normalizedAddress });

  let provider = connected?.provider || appWalletClient.getProvider({ chain: 'solana' });
  const refreshProvider = async () => {
    const refreshed = await appWalletClient.connect({ chain: 'solana', silent: false });
    const next = refreshed?.provider || appWalletClient.getProvider({ chain: 'solana' });
    if (next) provider = next;
    return provider;
  };
  if (!provider && window.__PRIVY_WALLET_BRIDGE__ && typeof window.__PRIVY_WALLET_BRIDGE__.connectSolana === 'function') {
    const out = await withPrivyProxyRetry(() => window.__PRIVY_WALLET_BRIDGE__.connectSolana({ silent: false }));
    provider = out?.provider || out?.wallet || null;
  }
  if (!provider) throw new Error('SOLANA_TX_SEND_UNSUPPORTED');

  const web3 = await loadSolanaWeb3(config?.solana?.web3ModuleUrl);
  if (!web3?.Keypair || !web3?.Transaction || !web3?.Connection) {
    throw new Error('SOLANA_WEB3_UNAVAILABLE');
  }
  return { address: normalizedAddress, provider, web3, refreshProvider };
}

function base58Encode(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) return '';
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (let i = 0; i < bytes.length; i++) {
    num = (num << 8n) + BigInt(bytes[i]);
  }
  let out = '';
  while (num > 0n) {
    const idx = Number(num % 58n);
    out = alphabet[idx] + out;
    num /= 58n;
  }
  let leading = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) leading += 1;
  if (leading > 0) out = `${'1'.repeat(leading)}${out}`;
  return out || '1';
}

function normalizeSolanaTxSignature(value) {
  const normalizeRef = (raw) => {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed || /\s/.test(trimmed)) return null;
    if (trimmed.length > 256) return null;
    return trimmed;
  };
  if (!value) return null;
  if (typeof value === 'string') return normalizeRef(value);
  const direct = normalizeRef(
    value.signature
    || value.hash
    || value.transactionSignature
    || value.txSig
    || value.txHash
    || value?.data?.signature
    || value?.data?.hash
    || value?.data?.transactionSignature
  );
  if (direct) return direct;
  if (value.signature instanceof Uint8Array) return base58Encode(value.signature);
  if (value instanceof Uint8Array) return base58Encode(value);
  if (Array.isArray(value)) return base58Encode(new Uint8Array(value));
  return null;
}

function normalizeEvmAddress(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

function normalizeSolanaAddress(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/\s/.test(trimmed)) return null;
  if (trimmed.length < 16 || trimmed.length > 128) return null;
  return trimmed;
}

function bytesToBase64(bytes) {
  if (!(bytes instanceof Uint8Array)) return '';
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]);
  return btoa(out);
}

function decodeBase64Bytes(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('INVALID_PREPARED_TRANSACTION');
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function deserializePreparedSolanaTransactionBytes({ txBytes, web3 }) {
  if (!web3?.Transaction || typeof web3.Transaction.from !== 'function') {
    throw new Error('SOLANA_WEB3_TRANSACTION_UNAVAILABLE');
  }
  try {
    const transaction = web3.Transaction.from(txBytes);
    if (!transaction) throw new Error('INVALID_PREPARED_TRANSACTION');
    return transaction;
  } catch {
    throw new Error('INVALID_PREPARED_TRANSACTION');
  }
}

function decodePreparedSolanaTransaction({ preparedTx, web3 }) {
  const txBytes = decodeBase64Bytes(preparedTx);
  return {
    tx: deserializePreparedSolanaTransactionBytes({ txBytes, web3 }),
    txBytes
  };
}

function prepareSolanaTransactionForClientSigning({ txBytes, web3, signerKeypairs = [] }) {
  const tx = deserializePreparedSolanaTransactionBytes({ txBytes, web3 });
  const signers = Array.isArray(signerKeypairs)
    ? signerKeypairs.filter((entry) => entry && entry.publicKey && entry.secretKey)
    : [];
  if (!signers.length) return tx;
  if (typeof tx.partialSign !== 'function') throw new Error('SOLANA_PARTIAL_SIGN_UNSUPPORTED');
  tx.partialSign(...signers);
  return tx;
}

function serializeSolanaTransactionForRpc(tx) {
  if (!tx || typeof tx.serialize !== 'function') throw new Error('SOLANA_TX_SERIALIZE_FAILED');
  const raw = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
  let bytes = null;
  if (raw instanceof Uint8Array) bytes = raw;
  else if (raw instanceof ArrayBuffer) bytes = new Uint8Array(raw);
  else if (ArrayBuffer.isView(raw)) bytes = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) throw new Error('SOLANA_TX_SERIALIZE_FAILED');
  return bytesToBase64(bytes);
}

async function sendPreparedSolanaTransaction({
  provider,
  preparedTx,
  rpcUrl,
  web3,
  refreshProvider = null,
  signerKeypairs = [],
  sponsorSendEnabled = false,
  sponsorWalletAddress = null,
  sponsorAssetPubkey = null
}) {
  let activeProvider = provider && typeof provider === 'object' ? provider : null;
  const { txBytes } = decodePreparedSolanaTransaction({ preparedTx, web3 });
  const conn = new web3.Connection(rpcUrl || 'https://api.devnet.solana.com', 'confirmed');
  const makeTx = () => prepareSolanaTransactionForClientSigning({ txBytes, web3, signerKeypairs });
  const tryRefreshProvider = async () => {
    if (typeof refreshProvider === 'function') {
      try {
        const refreshed = await refreshProvider();
        if (refreshed) activeProvider = refreshed;
      } catch {
        // ignore; fallback to bridge connect below
      }
    }
    if ((!activeProvider || typeof activeProvider.request !== 'function')
      && window.__PRIVY_WALLET_BRIDGE__
      && typeof window.__PRIVY_WALLET_BRIDGE__.connectSolana === 'function') {
      try {
        const out = await window.__PRIVY_WALLET_BRIDGE__.connectSolana({ silent: false });
        const refreshed = out?.provider || out?.wallet || null;
        if (refreshed) activeProvider = refreshed;
      } catch {
        // ignore and continue; caller handles unsupported path
      }
    }
    return activeProvider;
  };

  const normalizeSignedTx = (value) => {
    if (!value || typeof value !== 'object') return null;
    if (typeof value.serialize === 'function') return value;
    if (value.signedTransaction && typeof value.signedTransaction.serialize === 'function') {
      return value.signedTransaction;
    }
    if (value.transaction && typeof value.transaction.serialize === 'function') {
      return value.transaction;
    }
    return null;
  };

  const signPreparedTxWithProvider = async () => {
    if (activeProvider && typeof activeProvider.request === 'function') {
      try {
        const signTx = makeTx();
        const signedOut = await withPrivyProxyRetry(
          () => activeProvider.request({
            method: 'signTransaction',
            params: { transaction: signTx }
          }),
          { onRetry: tryRefreshProvider }
        );
        const signedTx = normalizeSignedTx(signedOut);
        if (signedTx) return signedTx;
      } catch {
        // try next provider shape
      }
    }

    if (activeProvider && typeof activeProvider.signTransaction === 'function') {
      try {
        const signTx = makeTx();
        const signedOut = await withPrivyProxyRetry(
          () => activeProvider.signTransaction(signTx),
          { onRetry: tryRefreshProvider }
        );
        const signedTx = normalizeSignedTx(signedOut);
        if (signedTx) return signedTx;
      } catch {
        // fall through
      }
    }
    return null;
  };

  if (sponsorSendEnabled) {
    const signedTx = await signPreparedTxWithProvider();
    if (!signedTx) throw new Error('SOLANA_SIGN_TX_UNSUPPORTED');
    const transaction = serializeSolanaTransactionForRpc(signedTx);
    const relayOut = await api('/api/townhall/mint/solana/sponsor-send', {
      method: 'POST',
      body: JSON.stringify({
        transaction,
        ...(typeof sponsorWalletAddress === 'string' && sponsorWalletAddress.trim()
          ? { walletAddress: sponsorWalletAddress.trim() }
          : {}),
        ...(typeof sponsorAssetPubkey === 'string' && sponsorAssetPubkey.trim()
          ? { assetPubkey: sponsorAssetPubkey.trim() }
          : {})
      })
    });
    const sig = normalizeSolanaTxSignature(
      relayOut?.signature
      || relayOut?.txSig
      || relayOut?.solana?.signature
      || relayOut
    );
    if (sig) return sig;
    throw new Error('SOLANA_SPONSOR_SEND_FAILED');
  }

  if (activeProvider && typeof activeProvider.request === 'function') {
    const signAndSendAttempts = [
      { method: 'signAndSendTransaction', includeConnection: true, includeOptions: true },
      { method: 'signAndSendTransaction', includeConnection: true, includeOptions: false },
      { method: 'solana_signAndSendTransaction', includeConnection: true, includeOptions: true }
    ];
    for (const attempt of signAndSendAttempts) {
      try {
        const params = { transaction: makeTx() };
        if (attempt.includeConnection) params.connection = conn;
        if (attempt.includeOptions) params.options = { skipPreflight: false };
        const out = await withPrivyProxyRetry(
          () => activeProvider.request({ method: attempt.method, params }),
          { onRetry: tryRefreshProvider }
        );
        const sig = normalizeSolanaTxSignature(out);
        if (sig) return sig;
      } catch {
        // try next shape
      }
    }

    try {
      const signedTx = await signPreparedTxWithProvider();
      if (signedTx && typeof signedTx.serialize === 'function') {
        const raw = signedTx.serialize();
        const sig = await conn.sendRawTransaction(raw, { skipPreflight: false });
        await conn.confirmTransaction(sig, 'confirmed');
        return sig;
      }
    } catch {
      // fall through to non-request provider APIs
    }
  }

  if (activeProvider && typeof activeProvider.signAndSendTransaction === 'function') {
    const signAndSendTx = makeTx();
    const out = await withPrivyProxyRetry(
      () => activeProvider.signAndSendTransaction(signAndSendTx),
      { onRetry: tryRefreshProvider }
    );
    const sig = normalizeSolanaTxSignature(out);
    if (sig) return sig;
  }

  if (activeProvider && typeof activeProvider.signTransaction === 'function') {
    const signTx = makeTx();
    const signed = await withPrivyProxyRetry(
      () => activeProvider.signTransaction(signTx),
      { onRetry: tryRefreshProvider }
    );
    const raw = signed && typeof signed.serialize === 'function' ? signed.serialize() : signed;
    if (raw) {
      const sig = await conn.sendRawTransaction(raw, { skipPreflight: false });
      await conn.confirmTransaction(sig, 'confirmed');
      return sig;
    }
  }

  throw new Error('SOLANA_TX_SEND_UNSUPPORTED');
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

function parseSponsoredEvmSendResult(value) {
  const hash = normalizeEvmTxHash(
    value?.txHash
    || value?.transactionHash
    || value?.transaction_hash
    || value?.hash
    || value?.result?.txHash
    || value?.result?.transactionHash
    || value?.result?.transaction_hash
    || value?.result?.hash
    || value?.data?.txHash
    || value?.data?.transactionHash
    || value?.data?.transaction_hash
    || value?.data?.hash
    || value
  );
  const transactionId = normalizePrivyTransactionId(
    value?.transactionId
    || value?.transaction_id
    || value?.result?.transactionId
    || value?.result?.transaction_id
    || value?.data?.transactionId
    || value?.data?.transaction_id
  );
  const userOperationHash = normalizeEvmTxHash(
    value?.userOperationHash
    || value?.user_operation_hash
    || value?.result?.userOperationHash
    || value?.result?.user_operation_hash
    || value?.data?.userOperationHash
    || value?.data?.user_operation_hash
  );
  return { hash, transactionId, userOperationHash };
}

function isPrivySponsoredFailureStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized.includes('fail')
    || normalized.includes('revert')
    || normalized.includes('cancel')
    || normalized.includes('dropped')
    || normalized.includes('expired')
    || normalized.includes('error')
    || normalized.includes('reject')
  );
}

async function fetchPrivySponsoredEvmStatus(transactionId) {
  const id = normalizePrivyTransactionId(transactionId);
  if (!id) throw new Error('MINT_EVM_SPONSORED_NO_HANDLE');
  const payload = await api(`/api/privy/transactions/${encodeURIComponent(id)}`, {
    method: 'GET'
  });
  const tx = payload?.transaction && typeof payload.transaction === 'object'
    ? payload.transaction
    : payload;
  const hash = normalizeEvmTxHash(
    tx?.transactionHash
    || tx?.transaction_hash
    || tx?.hash
    || tx?.txHash
  );
  const status = typeof tx?.status === 'string' ? tx.status.trim().toLowerCase() : '';
  return { hash, status };
}

async function waitForSponsoredEvmTransactionHash({
  wallet,
  transactionId = null,
  userOperationHash = null,
  timeoutMs = SPONSORED_EVM_TX_TIMEOUT_MS,
  pollMs = SPONSORED_EVM_TX_POLL_MS
}) {
  let activeProvider = wallet?.provider || null;
  const txId = normalizePrivyTransactionId(transactionId);
  const opHash = normalizeEvmTxHash(userOperationHash || '');
  if (!txId && !opHash) throw new Error('MINT_EVM_SPONSORED_NO_HANDLE');

  const refreshProvider = async () => {
    if (typeof wallet?.refreshProvider === 'function') {
      try {
        const refreshed = await wallet.refreshProvider();
        if (refreshed && typeof refreshed.request === 'function') {
          activeProvider = refreshed;
        }
      } catch {
        // ignore refresh errors; status polling can still continue
      }
    }
    return activeProvider;
  };

  const startedAt = Date.now();
  let lastStatus = '';
  while (Date.now() - startedAt < timeoutMs) {
    if (txId) {
      try {
        const status = await fetchPrivySponsoredEvmStatus(txId);
        if (status.hash) return status.hash;
        if (status.status) {
          lastStatus = status.status;
          if (isPrivySponsoredFailureStatus(status.status)) {
            const failed = new Error('MINT_EVM_SPONSORED_FAILED');
            failed.detail = status.status;
            throw failed;
          }
        }
      } catch (err) {
        const code = String(err?.message || err || '');
        if (code === 'PRIVY_SERVER_AUTH_NOT_CONFIGURED' && !opHash) throw err;
        if (code === 'PRIVY_TRANSACTION_STATUS_UNAVAILABLE' && !opHash) throw err;
      }
    }

    if (opHash) {
      if (!activeProvider || typeof activeProvider.request !== 'function') {
        await refreshProvider();
      }
      if (activeProvider && typeof activeProvider.request === 'function') {
        try {
          const raw = await withPrivyProxyRetry(
            () => activeProvider.request({
              method: 'eth_getUserOperationReceipt',
              params: [opHash]
            }),
            { onRetry: refreshProvider }
          );
          const receipt = raw?.result?.receipt || raw?.receipt || raw?.result || raw;
          const hash = normalizeEvmTxHash(
            receipt?.transactionHash
            || receipt?.transaction_hash
            || raw?.result?.transactionHash
            || raw?.transactionHash
          );
          if (hash) return hash;
        } catch {
          // Some providers do not implement eth_getUserOperationReceipt.
        }
      }
    }

    await sleep(pollMs);
  }

  const timeout = new Error('MINT_EVM_SPONSORED_TIMEOUT');
  if (lastStatus) timeout.detail = lastStatus;
  throw timeout;
}

function uint256Hex(value) {
  const big = BigInt(value);
  if (big < 0n) throw new Error('MINT_EVM_FAILED');
  return big.toString(16).padStart(64, '0');
}

function bytesToHex(bytes) {
  if (!(bytes instanceof Uint8Array)) return '';
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

function toEvmChainHex(chainId) {
  const numeric = Number(chainId);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return `0x${Math.floor(numeric).toString(16)}`;
}

function encodeEvmErc8004RegisterCall(tokenUri) {
  const uri = String(tokenUri || '');
  const uriBytes = new TextEncoder().encode(uri);
  const paddedBytesLen = Math.ceil(uriBytes.length / 32) * 32;
  const headTokenUriOffset = uint256Hex(64);
  const headMetadataOffset = uint256Hex(64 + 32 + paddedBytesLen);
  const uriLength = uint256Hex(uriBytes.length);
  const uriData = bytesToHex(uriBytes).padEnd(paddedBytesLen * 2, '0');
  const metadataEntriesLength = uint256Hex(0);
  return `0x${ERC8004_REGISTER_SELECTOR}${headTokenUriOffset}${headMetadataOffset}${uriLength}${uriData}${metadataEntriesLength}`;
}

function parseErc8004AgentIdFromEvmReceipt({ receipt, chainId, contractAddress }) {
  const logs = Array.isArray(receipt?.logs) ? receipt.logs : [];
  const expectedContract = normalizeEvmAddress(contractAddress || '');
  const resolvedChainId = Number.isFinite(Number(chainId)) && Number(chainId) > 0
    ? Math.floor(Number(chainId))
    : 11155111;

  for (const log of logs) {
    const logAddress = normalizeEvmAddress(log?.address || '');
    if (expectedContract && logAddress && logAddress !== expectedContract) continue;
    const topics = Array.isArray(log?.topics) ? log.topics : [];
    if (topics.length < 4) continue;
    if (String(topics[0] || '').toLowerCase() !== ERC721_TRANSFER_TOPIC0) continue;
    const tokenTopic = String(topics[3] || '').trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(tokenTopic)) continue;
    const tokenId = BigInt(tokenTopic).toString(10);
    return `${resolvedChainId}:${tokenId}`;
  }

  return null;
}

function isEvmReceiptSuccess(receipt) {
  const status = receipt?.status;
  if (status === null || status === undefined) return true;
  if (typeof status === 'number') return status > 0;
  if (typeof status === 'bigint') return status > 0n;
  if (typeof status === 'string') {
    const trimmed = status.trim().toLowerCase();
    if (trimmed === '0x1' || trimmed === '0x01' || trimmed === '1') return true;
    if (trimmed === '0x0' || trimmed === '0x00' || trimmed === '0') return false;
    if (/^0x[0-9a-f]+$/.test(trimmed)) return BigInt(trimmed) > 0n;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return numeric > 0;
  }
  return true;
}

async function sendPreparedEvmTransaction({ wallet, chainId, to, data }) {
  let activeProvider = wallet?.provider || null;
  const numericChainId = Number(chainId);
  const caip2 = Number.isFinite(numericChainId) && numericChainId > 0
    ? `eip155:${Math.floor(numericChainId)}`
    : null;
  const executionMode = typeof wallet?.executionMode === 'string'
    ? wallet.executionMode.trim().toLowerCase()
    : '';
  const requiresTeeSponsoredPath = executionMode === 'on-device' || wallet?.isUnifiedWallet === false;
  const tx = {
    from: wallet.address,
    to,
    data
  };

  if (requiresTeeSponsoredPath) {
    const err = new Error('PRIVY_SPONSORED_TX_TEE_REQUIRED');
    err.detail = 'Privy EVM sponsorship requires a TEE/unified wallet, but this wallet is still using on-device execution.';
    throw err;
  }

  const refreshProvider = async () => {
    if (typeof wallet?.refreshProvider === 'function') {
      try {
        const refreshed = await wallet.refreshProvider();
        if (refreshed && typeof refreshed.request === 'function') {
          activeProvider = refreshed;
        }
      } catch {
        // ignore refresh errors and keep retrying with existing provider
      }
    }
    return activeProvider;
  };

  const bridge = window.__PRIVY_WALLET_BRIDGE__;
  if (bridge && typeof bridge.sendEvmTransaction === 'function') {
    const out = await withPrivyProxyRetry(
      () => bridge.sendEvmTransaction({
        transaction: tx,
        sponsor: true,
        ...(caip2 ? { caip2 } : {}),
        ...(Number.isFinite(numericChainId) && numericChainId > 0 ? { chainId: Math.floor(numericChainId) } : {})
      }),
      { onRetry: refreshProvider }
    );
    const sponsored = parseSponsoredEvmSendResult(out);
    if (sponsored.hash) return sponsored.hash;
    if (sponsored.transactionId || sponsored.userOperationHash) {
      return waitForSponsoredEvmTransactionHash({
        wallet,
        transactionId: sponsored.transactionId,
        userOperationHash: sponsored.userOperationHash
      });
    }
    throw new Error('PRIVY_SPONSORED_TX_NO_RESULT');
  }

  throw new Error('PRIVY_SPONSORED_TX_UNAVAILABLE');
}

async function waitForEvmTransactionReceipt({ wallet, txHash, timeoutMs = 120000, pollMs = 1500 }) {
  let activeProvider = wallet?.provider || null;
  const startedAt = Date.now();

  const refreshProvider = async () => {
    if (typeof wallet?.refreshProvider === 'function') {
      try {
        const refreshed = await wallet.refreshProvider();
        if (refreshed && typeof refreshed.request === 'function') {
          activeProvider = refreshed;
        }
      } catch {
        // ignore refresh errors and keep retrying with existing provider
      }
    }
    return activeProvider;
  };

  while (Date.now() - startedAt < timeoutMs) {
    if (activeProvider && typeof activeProvider.request === 'function') {
      const raw = await withPrivyProxyRetry(
        () => activeProvider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        }),
        { onRetry: refreshProvider }
      );
      const receipt = raw && typeof raw === 'object' && raw.result && typeof raw.result === 'object'
        ? raw.result
        : raw;
      if (receipt && typeof receipt === 'object') return receipt;
    } else {
      await refreshProvider();
    }
    await sleep(pollMs);
  }

  throw new Error('MINT_EVM_RECEIPT_TIMEOUT');
}

function setTownhallMintDraftRecord(role, chain, record) {
  if (!townhallMintDraft || typeof townhallMintDraft !== 'object') {
    townhallMintDraft = createEmptyTownhallMintDraft();
  }
  if (!townhallMintDraft[role] || typeof townhallMintDraft[role] !== 'object') {
    townhallMintDraft[role] = {};
  }
  townhallMintDraft[role][chain] = {
    ...(townhallMintDraft[role][chain] || {}),
    ...(record || {})
  };
  townhallMintDraftDirty = true;
}

async function mintTownhallEvmIdentity({ subject, profile, config, wallet }) {
  const safeSubject = subject === 'human' ? 'human' : 'agent';
  const prepared = await api('/api/townhall/mint/evm/prepare', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress: wallet.address,
      subject: safeSubject,
      profile
    })
  });
  if (!prepared?.tokenUri) throw new Error('MINT_EVM_FAILED');
  const chainId = Number(prepared?.evm?.chainId || config?.evm?.chainId || 11155111);
  const contractAddress = normalizeEvmAddress(
    prepared?.evm?.contractAddress || config?.evm?.contractAddress || DEFAULT_EVM_ERC8004_IDENTITY_REGISTRY
  );
  if (!contractAddress) throw new Error('MINT_EVM_CONTRACT_NOT_CONFIGURED');
  const data = encodeEvmErc8004RegisterCall(prepared.tokenUri);
  const txHash = await sendPreparedEvmTransaction({
    wallet,
    chainId,
    to: contractAddress,
    data
  });
  const receipt = await waitForEvmTransactionReceipt({ wallet, txHash });
  if (!isEvmReceiptSuccess(receipt)) throw new Error('MINT_EVM_REVERTED');
  const mintedAgentId = parseErc8004AgentIdFromEvmReceipt({
    receipt,
    chainId,
    contractAddress
  });
  if (!mintedAgentId) throw new Error('MINT_EVM_NO_AGENT_ID');
  const confirmedTxHash = normalizeEvmTxHash(receipt?.transactionHash || txHash) || txHash;
  return {
    id: mintedAgentId,
    txHash: confirmedTxHash
  };
}

async function mintTownhallSolanaIdentity({ subject, profile, config, wallet }) {
  const safeSubject = subject === 'human' ? 'human' : 'agent';
  const assetKeypair = wallet.web3.Keypair.generate();
  const assetPubkey = assetKeypair.publicKey.toBase58();
  const prepared = await api('/api/townhall/mint/solana/prepare', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress: wallet.address,
      assetPubkey,
      subject: safeSubject,
      profile
    })
  });

  const preparedSigner = normalizeSolanaAddress(prepared?.prepared?.signer || '');
  const expectedSigner = normalizeSolanaAddress(wallet.address || '');
  if (!preparedSigner || !expectedSigner || preparedSigner !== expectedSigner) {
    throw new Error('SOLANA_SIGNER_MISMATCH');
  }
  if (prepared?.prepared?.signed === true) {
    throw new Error('SOLANA_PREPARE_SIGNED');
  }
  const preparedTx = prepared?.prepared?.transaction;
  if (!preparedTx || typeof preparedTx !== 'string') throw new Error('SOLANA_PREPARE_FAILED');
  const preparedAssetPubkey = normalizeSolanaAddress(prepared?.solana?.assetPubkey || assetPubkey) || assetPubkey;
  const canUseMockFallback = townhallModuleMocksEnabled();
  if (!canUseMockFallback && config?.solana?.sponsorSendEnabled !== true) {
    throw new Error(config?.solana?.sponsorSendError || 'SOLANA_SPONSOR_NOT_CONFIGURED');
  }

  const txSig = await sendPreparedSolanaTransaction({
    provider: wallet.provider,
    refreshProvider: wallet.refreshProvider,
    preparedTx,
    rpcUrl: config?.solana?.rpcUrl,
    web3: wallet.web3,
    signerKeypairs: [assetKeypair],
    sponsorSendEnabled: config?.solana?.sponsorSendEnabled === true,
    sponsorWalletAddress: wallet.address,
    sponsorAssetPubkey: preparedAssetPubkey
  });
  if (!txSig) throw new Error('MINT_SOLANA_NO_SIGNATURE');

  return {
    id: prepared.erc8004Id || `solana:${preparedAssetPubkey}`,
    txSig
  };
}

async function runTownhallMintStep(stepKey, action) {
  const step = townhallMintSteps.find((entry) => entry.key === stepKey);
  if (!step) throw new Error('MINT_STEP_NOT_FOUND');
  townhallMintLastErrorStep = null;
  syncTownhallMintChecklist(townhallMintDraft, { activeStep: step.key });
  try {
    const out = await action();
    syncTownhallMintChecklist(townhallMintDraft);
    return out;
  } catch (err) {
    townhallMintLastErrorStep = step.key;
    syncTownhallMintChecklist(townhallMintDraft, { errorStep: step.key });
    throw new Error(knownMintErrorMessage(err, step.chain));
  }
}

function collectRejectedTownhallMintMessages(results) {
  const out = [];
  const seen = new Set();
  for (const result of results) {
    if (result?.status !== 'rejected') continue;
    const reason = result.reason;
    const message = reason instanceof Error
      ? String(reason.message || '').trim()
      : String(reason || '').trim();
    if (!message) continue;
    const key = message.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(message);
  }
  return out;
}

function combineRejectedTownhallMintErrors(results) {
  const messages = collectRejectedTownhallMintMessages(results);
  if (!messages.length) return null;
  if (messages.length === 1) return new Error(messages[0]);
  return new Error(messages.map((message, index) => (index === 0 ? message : `Also: ${message}`)).join(' '));
}

function setTownhallRegisterFeedback(message = '', isError = false) {
  const status = el('townhallRegisterStatus');
  const error = el('townhallRegisterError');
  if (status) status.textContent = isError ? '' : message;
  if (error) error.textContent = isError ? message : '';
}

function setTownhallAvatarPreview(kind, imageUrl) {
  const isHuman = kind === 'human';
  const wrap = el(isHuman ? 'townhallHumanPreview' : 'townhallAgentPreview');
  const img = el(isHuman ? 'townhallHumanPreviewImg' : 'townhallAgentPreviewImg');
  if (!wrap || !img) return;
  if (!imageUrl) {
    wrap.classList.add('is-hidden');
    img.src = '';
    return;
  }
  wrap.classList.remove('is-hidden');
  img.src = imageUrl;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const out = typeof reader.result === 'string' ? reader.result : '';
      if (!out) {
        reject(new Error('FILE_READ_FAILED'));
        return;
      }
      resolve(out);
    };
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
    reader.readAsDataURL(file);
  });
}

async function onTownhallImageChanged(kind, inputEl) {
  const file = inputEl && inputEl.files && inputEl.files[0] ? inputEl.files[0] : null;
  if (!file) return;
  if (!TOWNHALL_IMAGE_TYPES.has(file.type)) {
    setTownhallRegisterFeedback(tApp('townhall.feedback.avatar_type'), true);
    return;
  }
  if (file.size > TOWNHALL_IMAGE_MAX_BYTES) {
    setTownhallRegisterFeedback(tApp('townhall.feedback.avatar_size'), true);
    return;
  }
  const dataUrl = await readFileAsDataUrl(file);
  if (kind === 'human') pendingTownhallHumanImage = dataUrl;
  else pendingTownhallAgentImage = dataUrl;
  setTownhallAvatarPreview(kind, dataUrl);
  setTownhallRegisterFeedback('');
}

async function submitTownhallRegistration() {
  const profile = collectTownhallProfilePayload();
  const draft = cloneTownhallMintDraft(townhallMintDraft);

  const payload = {
    profile,
    erc8004: {
      user: {
        evm: {
          id: (draft?.user?.evm?.id || '').trim(),
          chain: draft?.user?.evm?.chain || 'sepolia',
          txHash: (draft?.user?.evm?.txHash || '').trim() || null
        },
        solana: {
          id: (draft?.user?.solana?.id || '').trim(),
          cluster: draft?.user?.solana?.cluster || 'devnet',
          txSig: (draft?.user?.solana?.txSig || '').trim() || null
        }
      },
      agent: {
        evm: {
          id: (draft?.agent?.evm?.id || '').trim(),
          chain: draft?.agent?.evm?.chain || 'sepolia',
          txHash: (draft?.agent?.evm?.txHash || '').trim() || null
        },
        solana: {
          id: (draft?.agent?.solana?.id || '').trim(),
          cluster: draft?.agent?.solana?.cluster || 'devnet',
          txSig: (draft?.agent?.solana?.txSig || '').trim() || null
        }
      }
    }
  };

  if (pendingTownhallHumanImage) {
    payload.profile.humanAvatar.image = pendingTownhallHumanImage;
  }
  if (pendingTownhallAgentImage) {
    payload.profile.agentAvatar.image = pendingTownhallAgentImage;
  }
  const walletIdentity = getWalletIdentitiesForTownhallRegistration();
  if (walletIdentity && (walletIdentity.evm || walletIdentity.solana)) {
    payload.wallet = walletIdentity;
  }

  setTownhallRegisterFeedback(tApp('townhall.feedback.saving'));

  try {
    const out = await api('/api/townhall/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    pendingTownhallHumanImage = null;
    pendingTownhallAgentImage = null;
    clearTownhallDraftDirtyFlags();
    townhallMintDraft = normalizeTownhallMintDraftFromOnboarding(out?.onboarding || null);
    townhallMintDraftDirty = false;
    townhallMintLastErrorStep = null;
    syncTownhallMintChecklist(townhallMintDraft);
    setTownhallRegisterFeedback(tApp('townhall.feedback.saved_continue'));
    if (lastState) {
      updateUI({ ...lastState, onboarding: out.onboarding || lastState.onboarding });
    }
    return out;
  } catch (e) {
    const message = e?.message === 'MISSING_HUMAN_NAME'
      ? tApp('townhall.feedback.missing_human_name')
      : e?.message === 'MISSING_AGENT_NAME'
        ? tApp('townhall.feedback.missing_agent_name')
        : e?.message === 'MISSING_HUMAN_AVATAR_PROMPT'
          ? tApp('townhall.feedback.missing_human_prompt')
          : e?.message === 'MISSING_AGENT_AVATAR_PROMPT'
            ? tApp('townhall.feedback.missing_agent_prompt')
            : e?.message === 'MISSING_ERC8004_USER_EVM_ID'
              ? tApp('townhall.feedback.missing_user_evm_id')
              : e?.message === 'MISSING_ERC8004_USER_SOLANA_ID'
                ? tApp('townhall.feedback.missing_user_solana_id')
                : e?.message === 'MISSING_ERC8004_AGENT_EVM_ID'
                  ? tApp('townhall.feedback.missing_agent_evm_id')
                  : e?.message === 'MISSING_ERC8004_AGENT_SOLANA_ID'
                    ? tApp('townhall.feedback.missing_agent_solana_id')
                    : e?.message === 'TOWNHALL_IMAGE_TOO_LARGE'
                      ? tApp('townhall.feedback.avatar_size')
                      : e?.message === 'INVALID_TOWNHALL_IMAGE'
                        ? tApp('townhall.feedback.invalid_image')
                        : tApp('townhall.feedback.registration_failed', { message: e.message });
    setTownhallRegisterFeedback(message, true);
    throw new Error(message);
  } finally {
    const cfg = townhallMintConfig || fallbackTownhallMintConfig();
    applyTownhallMintConfig(cfg);
  }
}

async function mintAllTownhallIdentitiesAndRegister() {
  if (townhallMintInFlight) return;
  townhallMintInFlight = true;
  townhallMintLastErrorStep = null;
  setTownhallStoryStep('processing');
  const registerBtn = el('townhallRegisterBtn');
  if (registerBtn) registerBtn.disabled = true;
  setTownhallRegisterFeedback(tApp('townhall.feedback.checking_mint'));
  syncTownhallMintChecklist(townhallMintDraft);

  try {
    const config = await ensureTownhallMintConfig();
    applyTownhallMintConfig(config);
    if (!config?.evm?.enabled || !config?.solana?.enabled) throw new Error('MINT_ALL_CHAINS_NOT_ENABLED');

    const profile = collectTownhallProfilePayload();
    setTownhallRegisterFeedback(tApp('townhall.feedback.preparing_wallets'));
    let evmWallet;
    let solanaWallet;
    try {
      await forcePrivyWalletReady();
      evmWallet = await ensureEvmMintWallet(config);
      solanaWallet = await ensureSolanaMintWallet(config);
    } catch (walletErr) {
      const chain = inferMintErrorChain(walletErr, 'evm');
      throw new Error(knownMintErrorMessage(walletErr, chain));
    }

    const mintUserEvm = async () => {
      const userEvm = await runTownhallMintStep('userEvm', () => mintTownhallEvmIdentity({
        subject: 'human',
        profile,
        config,
        wallet: evmWallet
      }));
      setTownhallMintDraftRecord('user', 'evm', {
        id: userEvm.id,
        chain: config?.evm?.network || 'sepolia',
        txHash: userEvm.txHash || ''
      });
      syncTownhallMintChecklist(townhallMintDraft);
      return userEvm;
    };

    const mintUserSolana = async () => {
      const userSolana = await runTownhallMintStep('userSolana', () => mintTownhallSolanaIdentity({
        subject: 'human',
        profile,
        config,
        wallet: solanaWallet
      }));
      setTownhallMintDraftRecord('user', 'solana', {
        id: userSolana.id,
        cluster: config?.solana?.cluster || 'devnet',
        txSig: userSolana.txSig || ''
      });
      syncTownhallMintChecklist(townhallMintDraft);
      return userSolana;
    };

    const mintAgentEvm = async () => {
      const agentEvm = await runTownhallMintStep('agentEvm', () => mintTownhallEvmIdentity({
        subject: 'agent',
        profile,
        config,
        wallet: evmWallet
      }));
      setTownhallMintDraftRecord('agent', 'evm', {
        id: agentEvm.id,
        chain: config?.evm?.network || 'sepolia',
        txHash: agentEvm.txHash || ''
      });
      syncTownhallMintChecklist(townhallMintDraft);
      return agentEvm;
    };

    const mintAgentSolana = async () => {
      const agentSolana = await runTownhallMintStep('agentSolana', () => mintTownhallSolanaIdentity({
        subject: 'agent',
        profile,
        config,
        wallet: solanaWallet
      }));
      setTownhallMintDraftRecord('agent', 'solana', {
        id: agentSolana.id,
        cluster: config?.solana?.cluster || 'devnet',
        txSig: agentSolana.txSig || ''
      });
      syncTownhallMintChecklist(townhallMintDraft);
      return agentSolana;
    };

    setTownhallRegisterFeedback(tApp('townhall.feedback.user_registering'));
    const userMintResults = await Promise.allSettled([mintUserEvm(), mintUserSolana()]);
    const userMintError = combineRejectedTownhallMintErrors(userMintResults);
    if (userMintError) throw userMintError;

    setTownhallRegisterFeedback(tApp('townhall.feedback.agent_registering'));
    const agentMintResults = await Promise.allSettled([mintAgentEvm(), mintAgentSolana()]);
    const agentMintError = combineRejectedTownhallMintErrors(agentMintResults);
    if (agentMintError) throw agentMintError;

    setTownhallRegisterFeedback(tApp('townhall.feedback.saving'));
    await submitTownhallRegistration();
    townhallMintLastErrorStep = null;
    setTownhallRegisterFeedback(tApp('townhall.feedback.registration_complete_continue'));

    // Auto-advance to brain district after successful registration
    const nextStep = lastState ? getOnboardingStep(lastState) : null;
    if (nextStep === ONBOARDING_STEP_BRAIN) {
      setTimeout(() => showDistrict('brain'), 600);
    }
  } catch (err) {
    townhallSigilUnlockedByContinue = false;
    const raw = String(err?.message || err || 'Mint failed.');
    const msg = isPrivyWalletProxyInitError(err)
      ? knownMintErrorMessage(err, inferMintErrorChain(err, 'evm'))
      : raw;
    setTownhallRegisterFeedback(msg, true);
  } finally {
    townhallMintInFlight = false;
    const cfg = townhallMintConfig || fallbackTownhallMintConfig();
    applyTownhallMintConfig(cfg);
  }
}

function bindTownhallNameValidation() {
  const fields = [
    { inputId: 'townhallHumanName', countId: 'townhallHumanNameCount', errorId: 'townhallHumanNameError' },
    { inputId: 'townhallAgentName', countId: 'townhallAgentNameCount', errorId: 'townhallAgentNameError' }
  ];
  for (const f of fields) {
    const input = el(f.inputId);
    if (!input || input.dataset.validationBound) continue;
    input.dataset.validationBound = 'true';
    const countEl = el(f.countId);
    const errorEl = el(f.errorId);
    const maxLen = 48;
    const updateCount = () => {
      const len = (input.value || '').length;
      if (countEl) {
        countEl.textContent = `${len} / ${maxLen}`;
        countEl.classList.toggle('is-over', len > maxLen);
      }
    };
    updateCount();
    input.addEventListener('input', updateCount);
    input.addEventListener('blur', () => {
      if (!errorEl) return;
      const val = (input.value || '').trim();
      if (!val) errorEl.textContent = tApp('townhall.validation.name_required');
      else if (val.length > maxLen) errorEl.textContent = tApp('townhall.validation.name_too_long');
      else errorEl.textContent = '';
    });
    input.addEventListener('input', () => {
      if (errorEl) errorEl.textContent = '';
    });
  }
}

function bindTownhallRegistrationControls() {
  for (const input of getTownhallDraftFieldNodes()) bindTownhallDraftField(input);
  bindTownhallNameValidation();

  const requireName = (kind) => {
    const isHuman = kind === 'human';
    const input = el(isHuman ? 'townhallHumanName' : 'townhallAgentName');
    const value = (input?.value || '').trim();
    if (value) return true;
    setTownhallRegisterFeedback(
      isHuman ? tApp('townhall.feedback.enter_human_name') : tApp('townhall.feedback.enter_agent_name'),
      true
    );
    if (input) input.focus();
    return false;
  };

  const requireAvatarPrompt = (kind) => {
    const isHuman = kind === 'human';
    const input = el(isHuman ? 'townhallHumanPrompt' : 'townhallAgentPrompt');
    const value = (input?.value || '').trim();
    if (value) return true;
    setTownhallCustomizeOpen(kind, true);
    setTownhallRegisterFeedback(
      isHuman ? tApp('townhall.feedback.add_human_prompt') : tApp('townhall.feedback.add_agent_prompt'),
      true
    );
    if (input) input.focus();
    return false;
  };

  const humanSubmitBtn = el('townhallHumanSubmitBtn');
  if (humanSubmitBtn && humanSubmitBtn.dataset.bound !== '1') {
    humanSubmitBtn.dataset.bound = '1';
    humanSubmitBtn.addEventListener('click', () => {
      if (!requireName('human')) return;
      if (!requireAvatarPrompt('human')) return;
      setTownhallRegisterFeedback('');
      setTownhallStoryStep('agent');
    });
  }

  const agentBackBtn = el('townhallAgentBackBtn');
  if (agentBackBtn && agentBackBtn.dataset.bound !== '1') {
    agentBackBtn.dataset.bound = '1';
    agentBackBtn.addEventListener('click', () => {
      setTownhallRegisterFeedback('');
      setTownhallStoryStep('human');
    });
  }

  const agentSubmitBtn = el('townhallAgentSubmitBtn');
  if (agentSubmitBtn && agentSubmitBtn.dataset.bound !== '1') {
    agentSubmitBtn.dataset.bound = '1';
    agentSubmitBtn.addEventListener('click', () => {
      if (!requireName('human')) return;
      if (!requireAvatarPrompt('human')) return;
      if (!requireName('agent')) return;
      if (!requireAvatarPrompt('agent')) return;
      townhallAwaitingContinue = true;
      townhallSigilUnlockedByContinue = false;
      setTownhallStoryStep('processing');
      setTownhallRegisterFeedback(tApp('townhall.feedback.processing'));
      mintAllTownhallIdentitiesAndRegister();
    });
  }

  const continueBtn = el('townhallContinueBtn');
  if (continueBtn && continueBtn.dataset.bound !== '1') {
    continueBtn.dataset.bound = '1';
    continueBtn.addEventListener('click', () => {
      if (continueBtn.disabled) return;
      townhallAwaitingContinue = false;
      townhallSigilUnlockedByContinue = true;
      setTownhallRegisterFeedback(tApp('townhall.feedback.continue_sigil'));
      if (lastState) syncTownhallRegistrationUI(lastState);
      const sigilFlow = el('townhallSigilFlow');
      if (sigilFlow && !sigilFlow.classList.contains('is-hidden')) {
        sigilFlow.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  const registerBtn = el('townhallRegisterBtn');
  if (registerBtn && registerBtn.dataset.bound !== '1') {
    registerBtn.dataset.bound = '1';
    registerBtn.addEventListener('click', () => {
      if (!requireName('human')) return;
      if (!requireAvatarPrompt('human')) return;
      if (!requireName('agent')) return;
      if (!requireAvatarPrompt('agent')) return;
      townhallAwaitingContinue = true;
      townhallSigilUnlockedByContinue = false;
      mintAllTownhallIdentitiesAndRegister();
    });
  }

  const humanCustomizeBtn = el('townhallHumanCustomizeBtn');
  if (humanCustomizeBtn && humanCustomizeBtn.dataset.bound !== '1') {
    humanCustomizeBtn.dataset.bound = '1';
    humanCustomizeBtn.addEventListener('click', () => {
      setTownhallCustomizeOpen('human', !townhallHumanCustomizeOpen);
    });
  }

  const agentCustomizeBtn = el('townhallAgentCustomizeBtn');
  if (agentCustomizeBtn && agentCustomizeBtn.dataset.bound !== '1') {
    agentCustomizeBtn.dataset.bound = '1';
    agentCustomizeBtn.addEventListener('click', () => {
      setTownhallCustomizeOpen('agent', !townhallAgentCustomizeOpen);
    });
  }

  const humanImageInput = el('townhallHumanImage');
  if (humanImageInput && humanImageInput.dataset.bound !== '1') {
    humanImageInput.dataset.bound = '1';
    humanImageInput.addEventListener('change', () => {
      onTownhallImageChanged('human', humanImageInput).catch((e) => {
        setTownhallRegisterFeedback(tApp('townhall.feedback.avatar_upload_failed', { message: e.message }), true);
      });
    });
  }

  const agentImageInput = el('townhallAgentImage');
  if (agentImageInput && agentImageInput.dataset.bound !== '1') {
    agentImageInput.dataset.bound = '1';
    agentImageInput.addEventListener('change', () => {
      onTownhallImageChanged('agent', agentImageInput).catch((e) => {
        setTownhallRegisterFeedback(tApp('townhall.feedback.avatar_upload_failed', { message: e.message }), true);
      });
    });
  }

  ensureTownhallMintConfig()
    .then((cfg) => {
      applyTownhallMintConfig(cfg);
    })
    .catch(() => {
      applyTownhallMintConfig(fallbackTownhallMintConfig());
    });
}

function syncTownhallRegistrationUI(state) {
  const panel = el('townhallRegisterPanel');
  if (!panel) return;

  const onboarding = state?.onboarding || {};
  const profile = onboarding.profile || {};
  const humanAvatar = profile.humanAvatar || {};
  const agentAvatar = profile.agentAvatar || {};
  const onboardingStep = getOnboardingStep(state);
  const required = onboardingRequired(state);
  const registrationComplete = isTownhallRegistrationComplete(state);
  const isBrainConfigured = isTownhallBrainConfigured(state);
  const isWorkerConnected = isAnyAgentConnected(state);
  const canShowRegistrationPanel = !required || onboardingStep === ONBOARDING_STEP_TOWNHALL || onboardingStep === ONBOARDING_STEP_BRAIN;
  const shouldShowSigilForOnboarding = onboardingStep === ONBOARDING_STEP_SIGIL
    || onboardingStep === ONBOARDING_STEP_CEREMONY
    || onboardingStep === ONBOARDING_STEP_DONE;
  const justCompletedRegistration = required && onboardingStep === ONBOARDING_STEP_BRAIN && !townhallRegistrationCompletedOnce;
  if (!required || onboardingStep === ONBOARDING_STEP_TOWNHALL) {
    townhallRegistrationCompletedOnce = false;
  } else {
    townhallRegistrationCompletedOnce = true;
  }

  const humanNameInput = el('townhallHumanName');
  syncTownhallInputValue(humanNameInput, profile.humanName || '');
  const agentNameInput = el('townhallAgentName');
  syncTownhallInputValue(agentNameInput, profile.agentName || '');

  const humanPromptInput = el('townhallHumanPrompt');
  syncTownhallInputValue(humanPromptInput, humanAvatar.prompt || '');
  const agentPromptInput = el('townhallAgentPrompt');
  syncTownhallInputValue(agentPromptInput, agentAvatar.prompt || '');

  const onboardingMint = normalizeTownhallMintDraftFromOnboarding(onboarding);
  if (!townhallMintDraftDirty || registrationComplete) {
    townhallMintDraft = onboardingMint;
    townhallMintDraftDirty = false;
  }
  if (!townhallMintInFlight) {
    if (townhallMintLastErrorStep && !registrationComplete) {
      syncTownhallMintChecklist(townhallMintDraft, { errorStep: townhallMintLastErrorStep });
    } else {
      syncTownhallMintChecklist(townhallMintDraft);
    }
  }

  const humanImage = pendingTownhallHumanImage || humanAvatar.image || null;
  const agentImage = pendingTownhallAgentImage || agentAvatar.image || null;
  setTownhallAvatarPreview('human', humanImage);
  setTownhallAvatarPreview('agent', agentImage);
  setTownhallCustomizeOpen('human', townhallHumanCustomizeOpen);
  setTownhallCustomizeOpen('agent', townhallAgentCustomizeOpen);

  if (!required || shouldShowSigilForOnboarding) {
    townhallSigilUnlockedByContinue = true;
  } else if (!registrationComplete || !isBrainConfigured || !isWorkerConnected || townhallAwaitingContinue) {
    townhallSigilUnlockedByContinue = false;
  }

  if (registrationComplete || townhallMintInFlight || townhallAwaitingContinue || townhallStoryStep === 'processing') {
    setTownhallStoryStep('processing');
  } else if (townhallStoryStep !== 'agent') {
    setTownhallStoryStep('human');
  }

  const registerState = el('townhallRegisterState');
  if (registerState) {
    registerState.textContent = registrationComplete
      ? tApp('townhall.registered')
      : tApp('townhall.not_registered');
  }

  const continueBtn = el('townhallContinueBtn');
  if (continueBtn) {
    const canContinue = (
      registrationComplete
      && (
        onboardingStep === ONBOARDING_STEP_BRAIN
        || onboardingStep === ONBOARDING_STEP_SIGIL
        || !required
      )
      && isBrainConfigured
      && !townhallMintInFlight
    );
    continueBtn.disabled = !canContinue;
  }

  const gateHint = el('townHallGateHint');
  if (gateHint) {
    if (onboardingStep === ONBOARDING_STEP_BRAIN && !isBrainConfigured) {
      gateHint.textContent = tApp('townhall.gate.brain_required');
    } else if (onboardingStep === ONBOARDING_STEP_BRAIN && isBrainConfigured && !isWorkerConnected) {
      gateHint.textContent = tApp('townhall.gate.waiting_worker');
    } else if (onboardingStep === ONBOARDING_STEP_BRAIN) {
      gateHint.textContent = tApp('townhall.gate.open_sigil');
    } else if (registrationComplete) {
      gateHint.textContent = tApp('townhall.gate.registration_complete');
    } else if (required) {
      gateHint.textContent = tApp('townhall.gate.complete_onboarding');
    } else {
      gateHint.textContent = tApp('townhall.gate.optional');
    }
  }

  const canUseSigil = canUseTownhallSigilFlow(state);
  const showSigil = shouldShowSigilForOnboarding
    || (canUseSigil && (townhallSigilUnlockedByContinue || !required));
  const sigilFlow = el('townhallSigilFlow');
  if (sigilFlow) sigilFlow.classList.toggle('is-hidden', !showSigil);
  panel.classList.toggle('is-hidden', required && !canShowRegistrationPanel && showSigil);

  if (justCompletedRegistration && !townhallMintInFlight) {
    townhallAwaitingContinue = false;
    townhallSigilUnlockedByContinue = false;
    hideDistrict();
  }

  bindTownhallRegistrationControls();
}

function bindBrainDistrictControls() {
  const continueBtn = el('brainContinueBtn');
  if (continueBtn) {
    const state = lastState && typeof lastState === 'object' ? lastState : null;
    const isBrainConfigured = state ? isTownhallBrainConfigured(state) : false;
    const isWorkerConnected = state ? isAnyAgentConnected(state) : false;
    const isReady =
      isBrainConfigured &&
      isWorkerConnected;

    continueBtn.disabled = !isReady;
    continueBtn.onclick = () => {
      hideDistrict();
      if (typeof syncTownhallGate === 'function' && lastState) {
        syncTownhallGate(lastState);
      }
    };
  }
  bindBrainTierControls();
}

function bindTownDistrictControls() {
  if (lastState) syncTownhallRegistrationUI(lastState);
  bindBrainDistrictControls();
  bindPonyComposeControls();

  const connectWalletBtn = el('connectWalletBtn');
  if (connectWalletBtn) {
    connectWalletBtn.onclick = async () => {
      connectWalletBtn.disabled = true;
      setWalletStatus('');
      try {
        if (walletAddr) {
          await disconnectWallet();
          await maybeResetAfterWalletDisconnect();
        } else {
          await connectWalletAndLookup();
        }
      } catch (e) {
        const msg = e.message === 'NO_SOLANA_WALLET'
          ? tApp('wallet.error.no_solana_wallet')
          : e.message === 'NO_SOLANA_SIGN'
            ? tApp('wallet.error.no_solana_sign')
            : e.message === 'BAD_SIGNATURE'
              ? tApp('wallet.error.bad_signature')
              : e.message;
        setWalletStatus(msg, true);
      } finally {
        connectWalletBtn.disabled = false;
        updateWalletUI();
      }
    };
  }

  const hatchWalletCheckBtn = el('hatchWalletCheckBtn');
  if (hatchWalletCheckBtn) {
    hatchWalletCheckBtn.onclick = async () => {
      hatchWalletCheckBtn.disabled = true;
      try {
        await runWalletProfileCheck();
      } finally {
        hatchWalletCheckBtn.disabled = false;
        updateWalletUI();
      }
    };
  }

  const workerReconnectBtn = el('workerReconnectBtn');
  if (workerReconnectBtn) {
    workerReconnectBtn.onclick = async () => {
      workerReconnectBtn.disabled = true;
      setTownhallRegisterFeedback(tApp('townhall.feedback.worker_reconnecting'));
      try {
        await connectLiteAgent();
        requestHomeSkillStep('worker-reconnect');
      } catch (e) {
        setTownhallRegisterFeedback(tApp('townhall.feedback.worker_reconnect_failed', {
          message: String(e?.message || e || 'UNKNOWN_ERROR')
        }), true);
      } finally {
        workerReconnectBtn.disabled = false;
      }
    };
  }

  const tokenVerifyBtn = el('tokenVerifyBtn');
  if (tokenVerifyBtn) {
    tokenVerifyBtn.onclick = async () => {
      setTokenError('');
      setTokenStatus({ active: true, good: false, text: tApp('token.status.checking') });
      tokenVerifyBtn.disabled = true;
      try {
        const result = await verifyTokenOwnership();
        if (result?.eligible) {
          setTokenStatus({ active: true, good: true, text: tApp('token.status.verified') });
        } else {
          setTokenStatus({ active: true, good: false, text: tApp('token.status.not_found') });
        }
      } catch (e) {
        const msg = e.message === 'ALREADY_SIGNED_UP'
          ? tApp('token.error.already_signed_up')
          : e.message === 'BAD_SIGNATURE'
            ? tApp('token.error.bad_signature')
            : e.message === 'SIGNATURE_FORMAT'
              ? tApp('token.error.bad_signature')
              : e.message === 'RPC_UNAVAILABLE'
                ? 'Token check is unavailable. Try again.'
                : e.message === 'NO_SOLANA_WALLET'
                  ? tApp('wallet.error.no_solana_wallet')
                  : e.message === 'NO_SOLANA_SIGN'
                    ? tApp('wallet.error.no_solana_sign')
                    : e.message;
        setTokenError(msg);
        setTokenStatus({ active: true, good: false, text: tApp('token.status.failed') });
      } finally {
        tokenVerifyBtn.disabled = false;
      }
    };
  }

  const copyHouse = el('copyHouse');
  if (copyHouse) {
    copyHouse.onclick = async () => {
      const msg = readTextContent('houseSnippet');
      try {
        await navigator.clipboard.writeText(msg);
        copyHouse.textContent = tApp('common.copied');
        setTimeout(() => (copyHouse.textContent = tApp('townhall.copy_house')), 1200);
      } catch {
        alert(msg);
      }
    };
  }

  const openShareCardBtn = el('openShareCardBtn');
  const shareCardStatus = el('shareCardStatus');
  if (openShareCardBtn) {
    openShareCardBtn.onclick = async () => {
      openShareCardBtn.disabled = true;
      if (shareCardStatus) shareCardStatus.textContent = tApp('townhall.share_card.resolving');
      try {
        let sharePath = resolveSharePathFromState(lastState);
        const houseId = String(lastState?.houseId || walletHouseId || '').trim();
        if (!sharePath && houseId) {
          sharePath = await lookupSharePathByHouse(houseId);
        }
        if (!sharePath) {
          sharePath = '/s/sh_missing';
          if (shareCardStatus) {
            shareCardStatus.textContent = tApp('townhall.share_card.placeholder_notice');
          }
        } else if (shareCardStatus) {
          shareCardStatus.textContent = '';
        }
        routeToShareCard(sharePath);
      } catch (err) {
        if (shareCardStatus) {
          shareCardStatus.textContent = formatShareCardUnavailableStatus(err?.message || 'UNKNOWN_ERROR');
        }
      } finally {
        openShareCardBtn.disabled = false;
      }
    };
  }

  const openBtn = el('openBtn');
  if (openBtn) {
    openBtn.onclick = async () => {
      const openError = safeSetText('openError');
      const openWaiting = el('openWaiting');
      if (openError) openError.textContent = '';
      try {
        const result = await api('/api/human/open/press', {
          method: 'POST',
          body: JSON.stringify({})
        });
        if (result?.nextUrl) {
          const resolved = routeToPopupMode(result.nextUrl);
          if (resolved?.mode === 'district') {
            await showDistrict(resolved.district);
            return;
          }
          if (resolved?.mode === 'frame') {
            openRouteInModalFrame(resolved.url, resolved.title || 'Ceremony');
            return;
          }
          window.location.assign(resolved?.url || result.nextUrl);
          return;
        }
        if (openWaiting) openWaiting.style.display = 'inline-flex';
        requestHomeSkillStep('human-action');
      } catch (e) {
        if (openError) openError.textContent = `Error: ${e.message}`;
      }
    };
  }
}

function isBlankOrModifierClick(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function routeHasSameOrigin(rawHref) {
  try {
    const url = new URL(rawHref, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

function resolveDistrictRoute(rawHref) {
  try {
    const url = new URL(rawHref, window.location.href);
    if (url.origin !== window.location.origin) return null;
    const path = url.pathname;
    if (popupDistrictByPath[path]) {
      return { mode: 'district', district: popupDistrictByPath[path] };
    }
    return null;
  } catch {
    return null;
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

function loadAgentPanelDebugVisible() {
  try {
    const raw = localStorage.getItem(AGENT_PANEL_DEBUG_VISIBLE_KEY);
    if (raw === null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}

function normalizeAgentPanelZoomStep(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return AGENT_PANEL_ZOOM_STEP_DEFAULT;
  const rounded = Math.round(n);
  return Math.max(AGENT_PANEL_ZOOM_STEP_MIN, Math.min(AGENT_PANEL_ZOOM_STEP_MAX, rounded));
}

function agentPanelScaleFromZoomStep(step) {
  const normalized = normalizeAgentPanelZoomStep(step);
  const scale = 1 + normalized * AGENT_PANEL_ZOOM_SCALE_STEP;
  return Number(scale.toFixed(2));
}

function loadAgentPanelZoomStep() {
  try {
    const raw = localStorage.getItem(AGENT_PANEL_ZOOM_STEP_KEY);
    if (raw === null) return AGENT_PANEL_ZOOM_STEP_DEFAULT;
    return normalizeAgentPanelZoomStep(raw);
  } catch {
    return AGENT_PANEL_ZOOM_STEP_DEFAULT;
  }
}

function getTrainerModalBackdrop() {
  return document.getElementById('trainerModalBackdrop');
}

function isTrainerModalOpen() {
  const backdrop = getTrainerModalBackdrop();
  return !!backdrop && !backdrop.classList.contains('is-hidden');
}

function setTrainerModalOpen(open) {
  const backdrop = getTrainerModalBackdrop();
  if (!backdrop) return;
  const nextOpen = open === true;
  backdrop.classList.toggle('is-hidden', !nextOpen);
  backdrop.setAttribute('aria-hidden', nextOpen ? 'false' : 'true');
  document.body.classList.toggle('trainer-modal-open', nextOpen);
}

async function ensureTrainerScriptLoaded() {
  if (window.__agentTownTrainerScriptLoaded === true) return;
  if (!trainerScriptLoadPromise) {
    trainerScriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/trainer.js?v=20260222d';
      script.async = true;
      script.dataset.agentTownTrainer = '1';
      script.addEventListener('load', () => {
        window.__agentTownTrainerScriptLoaded = true;
        resolve();
      }, { once: true });
      script.addEventListener('error', () => {
        trainerScriptLoadPromise = null;
        reject(new Error('TRAINER_SCRIPT_LOAD_FAILED'));
      }, { once: true });
      document.body.appendChild(script);
    });
  }
  return trainerScriptLoadPromise;
}

async function openTrainerModal() {
  const backdrop = getTrainerModalBackdrop();
  if (!isTownHub || !backdrop) {
    window.location.assign('/trainer');
    return;
  }

  setTrainerModalOpen(true);

  const statusLine = document.getElementById('trainerStatusLine');
  if (statusLine && statusLine.textContent.includes('failed')) {
    statusLine.textContent = tApp('trainer.status.loading');
    statusLine.style.color = 'var(--muted)';
  }

  try {
    await initGateway();
    await ensureTrainerScriptLoaded();
  } catch (err) {
    if (statusLine) {
      statusLine.textContent = tApp('trainer.status.failed', { message: err?.message || 'UNKNOWN' });
      statusLine.style.color = 'var(--bad)';
    }
  }
}

function closeTrainerModal() {
  setTrainerModalOpen(false);
}

function bindTrainerModalInteractions() {
  const backdrop = getTrainerModalBackdrop();
  if (!backdrop || backdrop.dataset.bound === '1') return;
  backdrop.dataset.bound = '1';

  const closeBtn = document.getElementById('trainerModalClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeTrainerModal();
    });
  }

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) closeTrainerModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!isTrainerModalOpen()) return;
    event.preventDefault();
    closeTrainerModal();
  });

  window.openExperienceTrainerModal = () => openTrainerModal();
  window.closeExperienceTrainerModal = () => closeTrainerModal();
}

function routeToPopupMode(rawHref) {
  let parsed;
  try {
    parsed = new URL(rawHref, window.location.href);
  } catch {
    return null;
  }
  if (parsed.origin !== window.location.origin) return null;

  const route = resolveDistrictRoute(parsed.pathname);
  if (route) return route;

  const path = parsed.pathname;
  if (path === '/app' || path === '/') {
    return { mode: 'leave', url: parsed.pathname };
  }
  if (path === '/start') {
    return { mode: 'leave', url: '/start' };
  }
  if (path === '/inbox' || path.startsWith('/inbox/')) {
    return {
      mode: 'frame',
      url: `${parsed.pathname}${parsed.search}${parsed.hash}`,
      title: 'Inbox'
    };
  }
  if (path === '/create') {
    const params = new URLSearchParams(parsed.search || '');
    params.set('embed', '1');
    const embedUrl = `${parsed.pathname}${params.toString() ? `?${params.toString()}` : ''}${parsed.hash}`;
    return {
      mode: 'frame',
      url: embedUrl,
      title: 'Ceremony'
    };
  }
  if (path === '/claim-wallet' || path === '/claim') {
    return {
      mode: 'frame',
      url: path === '/claim' ? '/claim' : '/claim-wallet',
      title: 'Claim'
    };
  }
  if (path === '/atlas') {
    const params = new URLSearchParams(parsed.search || '');
    params.set('embed', '1');
    const embedUrl = `${parsed.pathname}${params.toString() ? `?${params.toString()}` : ''}${parsed.hash}`;
    return {
      mode: 'frame',
      url: embedUrl,
      title: 'Atlas Depot'
    };
  }
  if (path === '/wall') {
    return { mode: 'district', district: 'leaderboard' };
  }
  if (path.startsWith('/s/')) {
    const params = new URLSearchParams(parsed.search || '');
    params.set('embed', '1');
    const embedUrl = `${parsed.pathname}${params.toString() ? `?${params.toString()}` : ''}${parsed.hash}`;
    return {
      mode: 'frame',
      url: embedUrl,
      title: 'Share Card'
    };
  }

  if (path === '/house') {
    return { mode: 'district', district: 'house' };
  }
  if (path === '/trainer') {
    return isTownHub
      ? { mode: 'trainer' }
      : { mode: 'leave', url: '/trainer' };
  }

  return {
    mode: 'leave',
    url: `${parsed.pathname}${parsed.search}${parsed.hash}`
  };
}

function saveAgentPanelMinimized(minimized) {
  try {
    localStorage.setItem(AGENT_PANEL_MINIMIZED_KEY, minimized ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}

function saveAgentPanelDebugVisible(visible) {
  try {
    localStorage.setItem(AGENT_PANEL_DEBUG_VISIBLE_KEY, visible ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}

function saveAgentPanelZoomStep(step) {
  try {
    const normalized = normalizeAgentPanelZoomStep(step);
    localStorage.setItem(AGENT_PANEL_ZOOM_STEP_KEY, String(normalized));
  } catch {
    // ignore storage errors
  }
}

function syncAgentPanelLayout(panel = null) {
  const root = document.documentElement;
  const body = document.body;
  const dock = panel || el('agentSidebar');
  if (!root || !body) return;
  if (!dock || dock.classList.contains('is-hidden')) {
    root.style.setProperty('--agent-panel-page-inset', '0px');
    body.classList.remove('agent-panel-expanded');
    return;
  }
  const insetPx = Math.max(0, Math.round(dock.getBoundingClientRect().height || 0));
  root.style.setProperty('--agent-panel-page-inset', `${insetPx}px`);
  body.classList.toggle('agent-panel-expanded', !dock.classList.contains('minimized'));
}

function scheduleAgentPanelLayoutSync(panel = null) {
  const dock = panel || el('agentSidebar');
  if (!dock) return;
  const run = () => syncAgentPanelLayout(dock);
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(run);
    return;
  }
  setTimeout(run, 0);
}

function bindAgentPanelLayout(panel) {
  if (!panel) return;
  syncAgentPanelLayout(panel);
  scheduleAgentPanelLayoutSync(panel);
  if (typeof ResizeObserver === 'function') {
    if (!agentPanelLayoutObserver) {
      agentPanelLayoutObserver = new ResizeObserver(() => {
        syncAgentPanelLayout(panel);
      });
    } else {
      agentPanelLayoutObserver.disconnect();
    }
    agentPanelLayoutObserver.observe(panel);
  }
  if (!agentPanelLayoutResizeBound) {
    agentPanelLayoutResizeBound = true;
    window.addEventListener('resize', () => {
      syncAgentPanelLayout(panel);
    });
  }
  if (!agentPanelLayoutDeferredSyncBound) {
    agentPanelLayoutDeferredSyncBound = true;
    window.addEventListener('load', () => {
      scheduleAgentPanelLayoutSync(panel);
    }, { once: true });
    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
      document.fonts.ready
        .then(() => {
          scheduleAgentPanelLayoutSync(panel);
        })
        .catch(() => {});
    }
  }
}

function setOpenError(text) {
  const node = el('openError');
  if (!node) return;
  node.textContent = text || '';
}

function setLiteLlmStatus(text) {
  const value = text || '';
  const legacy = el('liteLlmStatus');
  if (legacy) legacy.textContent = value;
  const agent = el('agentLlmLine');
  if (agent) agent.textContent = value;
}

function safeJsonParse(raw, fallback = null) {
  try {
    return JSON.parse(String(raw || ''));
  } catch {
    return fallback;
  }
}

function decodePromptXml(text) {
  return String(text || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, '\'')
    .replace(/&amp;/g, '&');
}

function parseAvailableSkills(skillsPrompt) {
  const prompt = String(skillsPrompt || '');
  if (!prompt) return [];
  const out = [];
  const skillRegex = /<skill>\s*<name>([\s\S]*?)<\/name>\s*<description>([\s\S]*?)<\/description>\s*<location>([\s\S]*?)<\/location>\s*<\/skill>/gi;
  let match = null;
  while ((match = skillRegex.exec(prompt)) !== null) {
    const name = decodePromptXml(match[1]).trim();
    const description = decodePromptXml(match[2]).trim();
    const location = decodePromptXml(match[3]).trim();
    out.push({ name, description, location });
  }
  return out;
}

function getSkillActionsPlugin() {
  return window.AgentTownSkillActionsPlugin || null;
}

function getTrainerNamespacePlugin() {
  return window.AgentTownTrainerNamespacePlugin || null;
}

async function readActiveSkillTextForPlugin(gatewayApi, debugApi, skillSnapshot) {
  if (!debugApi || typeof debugApi.workspaceReadFile !== 'function') return '';
  const activeSkillPath = String(skillSnapshot?.activeSkillPath || '').trim();
  if (!activeSkillPath) return '';
  const readEnvelope = await debugApi.workspaceReadFile({ path: activeSkillPath }).catch(() => null);
  const readData = readEnvelope?.ok === true ? (readEnvelope.data || null) : null;
  return typeof readData?.content === 'string' ? readData.content : '';
}

function getRuntimeContextForPlugin(runtimeState = null) {
  const stateObj = runtimeState && typeof runtimeState === 'object' ? runtimeState : lastState;
  return {
    origin: window.location.origin,
    teamCode: String(stateObj?.teamCode || '').trim() || null,
    houseId: String(stateObj?.houseId || '').trim() || null,
  };
}

function parseTranscriptDumpForPlugin(rawDump) {
  const parsed = safeJsonParse(rawDump, null);
  if (Array.isArray(parsed)) return parsed;
  const lines = String(rawDump || '').split(/\r?\n/).filter((line) => line.trim().length > 0);
  const out = [];
  for (const line of lines) {
    const row = safeJsonParse(line, null);
    if (row && typeof row === 'object') out.push(row);
  }
  return out;
}

async function refreshSkillActionPluginCache(gatewayApi, debugApi, skillSnapshot = null) {
  const plugin = getSkillActionsPlugin();
  if (!plugin || typeof plugin.compileSkillActions !== 'function') {
    skillActionPluginCache = {
      activeSkillPath: '',
      sourceUrl: '',
      parserVersion: '',
      actions: [],
      usage: null,
      loadedAtMs: Date.now(),
    };
    return skillActionPluginCache;
  }

  const snapshotEnvelope = skillSnapshot || (gatewayApi && typeof gatewayApi.skillState === 'function'
    ? await gatewayApi.skillState().catch(() => null)
    : null);
  const snapshot = snapshotEnvelope?.data || snapshotEnvelope || null;
  const activeSkillPath = String(snapshot?.activeSkillPath || '').trim();
  const sourceUrl = String(snapshot?.sourceUrl || '').trim();
  const skillText = await readActiveSkillTextForPlugin(gatewayApi, debugApi, snapshot);
  const compiled = plugin.compileSkillActions(skillText || '', { source: 'agent-debug-plugin' }) || { actions: [] };
  const actions = Array.isArray(compiled?.actions) ? compiled.actions : [];

  let usage = null;
  if (typeof plugin.summarizeTranscriptUsage === 'function' && debugApi && typeof debugApi.getTranscriptDump === 'function') {
    const rawDump = await debugApi.getTranscriptDump().catch(() => '[]');
    const transcript = parseTranscriptDumpForPlugin(rawDump);
    usage = plugin.summarizeTranscriptUsage(transcript, actions, getRuntimeContextForPlugin(lastState));
  }

  skillActionPluginCache = {
    activeSkillPath,
    sourceUrl,
    parserVersion: String(compiled?.parserVersion || ''),
    source: String(compiled?.source || 'none'),
    errors: Array.isArray(compiled?.errors) ? compiled.errors : [],
    actions,
    usage,
    loadedAtMs: Date.now(),
  };
  return skillActionPluginCache;
}

function buildSkillActionQuickRefForChat(userText) {
  const plugin = getSkillActionsPlugin();
  if (!plugin || typeof plugin.buildActionQuickRef !== 'function') return '';
  const actions = Array.isArray(skillActionPluginCache?.actions) ? skillActionPluginCache.actions : [];
  if (!actions.length) return '';
  return plugin.buildActionQuickRef(actions, userText, 6);
}

async function refreshTrainerNamespacePluginCache(runtimeState = null) {
  const plugin = getTrainerNamespacePlugin();
  if (!plugin || typeof plugin.resolveEnabled !== 'function' || typeof plugin.listTools !== 'function') {
    trainerNamespacePluginCache = {
      enabled: false,
      tools: [],
      diagnostics: null,
      loadedAtMs: Date.now(),
    };
    return trainerNamespacePluginCache;
  }
  const stateObj = runtimeState && typeof runtimeState === 'object' ? runtimeState : lastState;
  const runtimeFlag = stateObj?.featureFlags && typeof stateObj.featureFlags === 'object'
    ? stateObj.featureFlags.trainerNamespace
    : null;
  const enabled = plugin.resolveEnabled({
    runtimeFeatureFlag: runtimeFlag,
    locationSearch: window.location.search,
  }) === true;
  const tools = enabled ? plugin.listTools({ includeAliases: false }) : [];
  const diagnostics = enabled && typeof plugin.getDiagnostics === 'function'
    ? plugin.getDiagnostics({})
    : null;
  trainerNamespacePluginCache = {
    enabled,
    tools: Array.isArray(tools) ? tools : [],
    diagnostics: diagnostics && typeof diagnostics === 'object' ? diagnostics : null,
    loadedAtMs: Date.now(),
  };
  return trainerNamespacePluginCache;
}

function buildTrainerNamespaceQuickRefForChat(userText) {
  const plugin = getTrainerNamespacePlugin();
  if (!plugin || typeof plugin.buildQuickRef !== 'function') return '';
  const tools = Array.isArray(trainerNamespacePluginCache?.tools) ? trainerNamespacePluginCache.tools : [];
  if (!tools.length) return '';
  return plugin.buildQuickRef(tools, userText, 6);
}

function pushAgentDebugEvent(text) {
  const line = String(text || '').trim();
  if (!line) return;
  const stamp = new Date().toISOString();
  agentDebugEvents.push(`[${stamp}] ${line}`);
  if (agentDebugEvents.length > AGENT_DEBUG_EVENT_LIMIT) {
    agentDebugEvents.splice(0, agentDebugEvents.length - AGENT_DEBUG_EVENT_LIMIT);
  }
}

function extractSafeUrlFromEventTarget(linkEl) {
  if (!linkEl) return '';
  if (linkEl.getAttribute('target') === '_blank') return null;
  if (linkEl.hasAttribute('download')) return null;
  const href = linkEl.getAttribute('href');
  if (!href || href.startsWith('javascript:') || href.startsWith('#')) return null;
  if (!routeHasSameOrigin(href)) return null;
  return href;
}

function onDistrictModalLinkClick(ev) {
  const anchor = ev.target && ev.target.closest ? ev.target.closest('a') : null;
  if (!anchor) return;
  if (isBlankOrModifierClick(ev)) return;
  const safeHref = extractSafeUrlFromEventTarget(anchor);
  if (!safeHref) return;
  const resolved = routeToPopupMode(safeHref);
  if (!resolved) return;
  ev.preventDefault();
  if (resolved.mode === 'district') {
    showDistrict(resolved.district);
    return;
  }
  if (resolved.mode === 'trainer') {
    openTrainerModal().catch(() => { });
    return;
  }
  if (resolved.mode === 'leave') {
    hideDistrict();
    window.location.assign(resolved.url);
    return;
  }
  if (resolved.mode === 'frame') {
    openRouteInModalFrame(resolved.url, resolved.title);
    return;
  }
}

function setDistrictModalMode(mode) {
  const modal = document.querySelector('#districtModalBackdrop .districtModal');
  if (!modal) return;
  modal.classList.toggle('is-district', mode === 'district');
  modal.classList.toggle('is-frame', mode === 'frame');
}

const districtModalThemeByDistrict = {
  house: 'house',
  atlas: 'atlas',
  townhall: 'townhall',
  saloon: 'saloon',
  pony: 'pony',
  leaderboard: 'leaderboard',
  brain: 'trainer',
  sigil: 'share'
};

function setDistrictModalTheme(theme) {
  const modal = document.querySelector('#districtModalBackdrop .districtModal');
  if (!modal) return;
  if (!theme) {
    modal.removeAttribute('data-theme');
    return;
  }
  modal.setAttribute('data-theme', theme);
}

function inferDistrictModalThemeFromUrl(url) {
  let parsed;
  try {
    parsed = new URL(url, window.location.href);
  } catch {
    return 'house';
  }
  const path = parsed.pathname || '';
  if (path === '/atlas') return 'atlas';
  if (path === '/wall' || path === '/leaderboard') return 'leaderboard';
  if (path === '/house') return 'house';
  if (path === '/create' || path === '/claim' || path === '/claim-wallet' || path === '/trainer') return 'trainer';
  if (path === '/pony' || path === '/inbox' || path.startsWith('/inbox/')) return 'pony';
  if (path === '/townhall') return 'townhall';
  if (path.startsWith('/s/')) return 'share';
  return 'house';
}

function isPlainRecord(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function truncateIntentTraceText(value, max = 180) {
  const text = String(value || '');
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function sanitizeIntentTraceParams(value, depth = 0) {
  if (depth > 2) return '[max-depth]';
  if (value == null) return value;
  if (typeof value === 'string') return truncateIntentTraceText(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 12).map((entry) => sanitizeIntentTraceParams(entry, depth + 1));
  if (!isPlainRecord(value)) return String(value);
  const out = {};
  for (const [key, rawVal] of Object.entries(value).slice(0, 24)) {
    out[key] = sanitizeIntentTraceParams(rawVal, depth + 1);
  }
  return out;
}

function pushExperienceIntentTraceEvent({ source = 'runtime', tool = '', params = {}, envelope = null }) {
  const safeEnvelope = isPlainRecord(envelope) ? envelope : {};
  const errorObj = isPlainRecord(safeEnvelope.error) ? safeEnvelope.error : null;
  experienceIntentTrace.push({
    atMs: Date.now(),
    source: String(source || 'runtime'),
    tool: String(tool || ''),
    ok: safeEnvelope.ok === true,
    applied: safeEnvelope.applied === true,
    errorCode: errorObj ? String(errorObj.code || '') : null,
    params: sanitizeIntentTraceParams(params)
  });
  if (experienceIntentTrace.length > EXPERIENCE_INTENT_TRACE_LIMIT) {
    experienceIntentTrace.splice(0, experienceIntentTrace.length - EXPERIENCE_INTENT_TRACE_LIMIT);
  }
}

function getExperienceIntentTraceSnapshot() {
  return { events: experienceIntentTrace.slice() };
}

function readDistrictModalSnapshot() {
  const backdrop = el('districtModalBackdrop');
  const title = el('districtModalTitle');
  const isOpen = !!backdrop && !backdrop.classList.contains('is-hidden') && backdrop.getAttribute('aria-hidden') !== 'true';
  return {
    open: isOpen,
    title: title ? String(title.textContent || '').trim() : ''
  };
}

function buildExperienceIntentStateSnapshot(overrides = {}) {
  const workerConnected = lastState?.agent?.connected === true;
  const teamCode = typeof lastState?.teamCode === 'string' ? lastState.teamCode : '';
  const base = {
    path: window.location.pathname,
    activeDistrict: String(activeDistrict || currentDistrict || ''),
    modal: readDistrictModalSnapshot(),
    worker: {
      connected: workerConnected,
      teamCode
    },
    atlas: {
      query: String(experienceIntentAtlasState.query || ''),
      family: String(experienceIntentAtlasState.family || ''),
      searchType: String(experienceIntentAtlasState.searchType || 'keyword')
    },
    pony: {
      composeOpen: experienceIntentPonyState.composeOpen === true,
      composeTo: String(experienceIntentPonyState.toHouseId || ''),
      subject: String(experienceIntentPonyState.subject || '')
    }
  };
  if (!isPlainRecord(overrides)) return base;
  return {
    ...base,
    ...overrides,
    modal: isPlainRecord(overrides.modal) ? { ...base.modal, ...overrides.modal } : base.modal,
    worker: isPlainRecord(overrides.worker) ? { ...base.worker, ...overrides.worker } : base.worker,
    atlas: isPlainRecord(overrides.atlas) ? { ...base.atlas, ...overrides.atlas } : base.atlas,
    pony: isPlainRecord(overrides.pony) ? { ...base.pony, ...overrides.pony } : base.pony
  };
}

function makeExperienceIntentEnvelope({ ok = false, applied = false, stateSnapshot = null, error = null } = {}) {
  return {
    ok: ok === true,
    applied: applied === true,
    stateSnapshot: stateSnapshot && typeof stateSnapshot === 'object'
      ? stateSnapshot
      : buildExperienceIntentStateSnapshot(),
    error: error ? {
      code: String(error.code || 'UI_INTENT_INTERNAL'),
      message: String(error.message || error.code || 'UI intent failed')
    } : null
  };
}

function invalidExperienceParam(message) {
  return makeExperienceIntentEnvelope({
    ok: false,
    applied: false,
    error: {
      code: 'UI_INTENT_INVALID_PARAM',
      message
    }
  });
}

function normalizeExperienceSearchType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'semantic') return 'semantic';
  return 'keyword';
}

function isSafeExperienceToken(value, { allowEmpty = false, maxLen = 72 } = {}) {
  const text = String(value || '').trim();
  if (!text) return allowEmpty;
  if (text.length > maxLen) return false;
  return /^[a-zA-Z0-9:_\-./ ]+$/.test(text);
}

function setPonyComposePanelOpen(open) {
  const panel = el('ponyComposePanel');
  if (!panel) return false;
  const isOpen = open === true;
  panel.classList.toggle('is-hidden', !isOpen);
  panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  return true;
}

function bindPonyComposeControls() {
  const openBtn = el('ponyComposeOpenBtn');
  if (openBtn && openBtn.dataset.bound !== '1') {
    openBtn.dataset.bound = '1';
    openBtn.addEventListener('click', () => {
      setPonyComposePanelOpen(true);
      experienceIntentPonyState.composeOpen = true;
    });
  }
  const closeBtn = el('ponyComposeCloseBtn');
  if (closeBtn && closeBtn.dataset.bound !== '1') {
    closeBtn.dataset.bound = '1';
    closeBtn.addEventListener('click', () => {
      setPonyComposePanelOpen(false);
      experienceIntentPonyState.composeOpen = false;
    });
  }
}

function applyPonyComposePrefill({ toHouseId = '', subject = '', draft = '' } = {}) {
  const toInput = el('ponyComposeToInput');
  const subjectInput = el('ponyComposeSubjectInput');
  const draftInput = el('ponyComposeDraftInput');
  if (!toInput || !subjectInput || !draftInput) return false;
  toInput.value = String(toHouseId || '');
  subjectInput.value = String(subject || '');
  draftInput.value = String(draft || '');
  setPonyComposePanelOpen(true);
  experienceIntentPonyState = {
    composeOpen: true,
    toHouseId: toInput.value,
    subject: subjectInput.value,
    draft: draftInput.value
  };
  return true;
}

async function waitForDistrictModalOpen(timeoutMs = 2500) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const modal = readDistrictModalSnapshot();
    if (modal.open) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return readDistrictModalSnapshot().open;
}

async function waitForDistrictModalFrame(timeoutMs = 4500) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const frame = document.querySelector('#districtModalBody iframe.districtFrame');
    if (frame) {
      try {
        const doc = frame.contentDocument || frame.contentWindow?.document;
        if (doc && doc.readyState === 'complete') return frame;
      } catch {
        return frame;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return document.querySelector('#districtModalBody iframe.districtFrame');
}

function prefillAtlasFrameInputs(frame, { q = '', family = '', searchType = 'keyword' } = {}) {
  if (!frame) return;
  let doc = null;
  try {
    doc = frame.contentDocument || frame.contentWindow?.document || null;
  } catch {
    doc = null;
  }
  if (!doc) return;
  const qInput = doc.getElementById('atlasSearch');
  const familySelect = doc.getElementById('atlasChainFamily');
  const searchTypeSelect = doc.getElementById('atlasSearchType');
  if (qInput) qInput.value = String(q || '');
  if (familySelect) familySelect.value = String(family || '');
  if (searchTypeSelect) searchTypeSelect.value = String(searchType || 'keyword');
}

async function stabilizeAtlasFrameInputs(frame, values, timeoutMs = 1200) {
  const targetQ = String(values?.q || '');
  const targetFamily = String(values?.family || '');
  const targetSearchType = String(values?.searchType || 'keyword');
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    prefillAtlasFrameInputs(frame, values);
    let doc = null;
    try {
      doc = frame?.contentDocument || frame?.contentWindow?.document || null;
    } catch {
      doc = null;
    }
    const qInput = doc ? doc.getElementById('atlasSearch') : null;
    const familySelect = doc ? doc.getElementById('atlasChainFamily') : null;
    const searchTypeSelect = doc ? doc.getElementById('atlasSearchType') : null;
    const qOk = !qInput || String(qInput.value || '') === targetQ;
    const familyOk = !familySelect || String(familySelect.value || '') === targetFamily;
    const searchTypeOk = !searchTypeSelect || String(searchTypeSelect.value || '') === targetSearchType;
    if (qOk && familyOk && searchTypeOk) return;
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  prefillAtlasFrameInputs(frame, values);
}

function validateStrictKeys(payload, allowedKeys) {
  if (!isPlainRecord(payload)) return false;
  for (const key of Object.keys(payload)) {
    if (!allowedKeys.has(key)) return false;
  }
  return true;
}

async function runExperienceUiOpenModal(rawParams) {
  if (!validateStrictKeys(rawParams, new Set(['modal', 'params']))) {
    return invalidExperienceParam('open_modal accepts only { modal, params }');
  }
  if ('selector' in rawParams || 'html' in rawParams) {
    return invalidExperienceParam('selector/html payloads are not allowed');
  }
  const modal = String(rawParams.modal || '').trim().toLowerCase();
  if (!EXPERIENCE_UI_MODAL_NAMES.has(modal)) {
    return invalidExperienceParam('modal must be one of atlas|pony|townhall|saloon|leaderboard|house|brain|sigil');
  }
  const params = rawParams.params;
  if (params != null && !isPlainRecord(params)) {
    return invalidExperienceParam('params must be an object');
  }
  if (isPlainRecord(params) && ('selector' in params || 'html' in params)) {
    return invalidExperienceParam('selector/html payloads are not allowed');
  }
  await showDistrict(modal);
  if (modal === 'pony') {
    bindPonyComposeControls();
    setPonyComposePanelOpen(false);
    experienceIntentPonyState.composeOpen = false;
  }
  await waitForDistrictModalOpen();
  return makeExperienceIntentEnvelope({
    ok: true,
    applied: true
  });
}

async function runExperienceUiAtlasSearch(rawParams) {
  if (!validateStrictKeys(rawParams, new Set(['q', 'family', 'searchType']))) {
    return invalidExperienceParam('atlas_search accepts only { q, family, searchType }');
  }
  const q = String(rawParams.q || '').trim();
  if (q.length > 180) return invalidExperienceParam('q exceeds max length 180');
  if (!isSafeExperienceToken(q, { allowEmpty: true, maxLen: 180 })) {
    return invalidExperienceParam('q contains unsupported characters');
  }
  const family = String(rawParams.family || '').trim().toLowerCase();
  if (!isSafeExperienceToken(family, { allowEmpty: true, maxLen: 64 })) {
    return invalidExperienceParam('family contains unsupported characters');
  }
  const searchTypeRaw = String(rawParams.searchType || 'keyword').trim().toLowerCase();
  if (searchTypeRaw !== 'keyword' && searchTypeRaw !== 'semantic') {
    return invalidExperienceParam('searchType must be keyword or semantic');
  }
  const searchType = normalizeExperienceSearchType(searchTypeRaw);
  const params = new URLSearchParams();
  params.set('embed', '1');
  params.set('searchType', searchType);
  if (q) params.set('q', q);
  if (family) params.set('family', family);

  setActiveDistrict('atlas');
  currentDistrict = 'atlas';
  openRouteInModalFrame(`/atlas?${params.toString()}`, 'Atlas Depot');
  experienceIntentAtlasState = { query: q, family, searchType };
  await waitForDistrictModalOpen();
  const atlasFrame = await waitForDistrictModalFrame();
  await stabilizeAtlasFrameInputs(atlasFrame, { q, family, searchType });
  return makeExperienceIntentEnvelope({
    ok: true,
    applied: true,
    stateSnapshot: buildExperienceIntentStateSnapshot({
      atlas: {
        query: q,
        family,
        searchType
      }
    })
  });
}

async function runExperienceUiPonyCompose(rawParams) {
  if (!validateStrictKeys(rawParams, new Set(['toHouseId', 'subject', 'draft']))) {
    return invalidExperienceParam('pony_compose accepts only { toHouseId, subject, draft }');
  }
  const toHouseId = String(rawParams.toHouseId || '').trim();
  const subject = String(rawParams.subject || '').trim();
  const draft = String(rawParams.draft || '');
  if (!isSafeExperienceToken(toHouseId, { allowEmpty: true, maxLen: 120 })) {
    return invalidExperienceParam('toHouseId contains unsupported characters');
  }
  if (!isSafeExperienceToken(subject, { allowEmpty: true, maxLen: 180 })) {
    return invalidExperienceParam('subject contains unsupported characters');
  }
  if (draft.length > 6000) {
    return invalidExperienceParam('draft exceeds max length 6000');
  }

  await showDistrict('pony');
  bindPonyComposeControls();
  const applied = applyPonyComposePrefill({ toHouseId, subject, draft });
  if (!applied) {
    return makeExperienceIntentEnvelope({
      ok: false,
      applied: false,
      error: {
        code: 'UI_INTENT_UNAVAILABLE',
        message: 'Pony compose panel is unavailable'
      }
    });
  }
  await waitForDistrictModalOpen();
  return makeExperienceIntentEnvelope({
    ok: true,
    applied: true,
    stateSnapshot: buildExperienceIntentStateSnapshot({
      pony: {
        composeOpen: true,
        composeTo: toHouseId,
        subject
      }
    })
  });
}

async function dispatchExperienceIntent(tool, rawParams = {}, options = {}) {
  const toolName = String(tool || '').trim();
  const params = isPlainRecord(rawParams) ? rawParams : {};
  const source = String(options?.source || 'runtime');

  if (!isTownHub) {
    const unavailable = makeExperienceIntentEnvelope({
      ok: false,
      applied: false,
      error: {
        code: 'UI_INTENT_UNAVAILABLE',
        message: 'Town hub modal runtime is unavailable on this route'
      }
    });
    pushExperienceIntentTraceEvent({ source, tool: toolName, params, envelope: unavailable });
    return unavailable;
  }

  let envelope = null;
  try {
    if (EXPERIENCE_UI_CONFIRMATION_REQUIRED_TOOLS.has(toolName)) {
      envelope = makeExperienceIntentEnvelope({
        ok: false,
        applied: false,
        error: {
          code: 'CONFIRMATION_REQUIRED',
          message: `${toolName} requires explicit approval token`
        }
      });
    } else if (toolName === 'agent_town_ui_open_modal') {
      envelope = await runExperienceUiOpenModal(params);
    } else if (toolName === 'agent_town_ui_atlas_search') {
      envelope = await runExperienceUiAtlasSearch(params);
    } else if (toolName === 'agent_town_ui_pony_compose') {
      envelope = await runExperienceUiPonyCompose(params);
    } else {
      envelope = makeExperienceIntentEnvelope({
        ok: false,
        applied: false,
        error: {
          code: 'UI_INTENT_UNKNOWN',
          message: `Unknown intent tool: ${toolName || '(empty)'}`,
        }
      });
    }
  } catch (err) {
    envelope = makeExperienceIntentEnvelope({
      ok: false,
      applied: false,
      error: {
        code: 'UI_INTENT_INTERNAL',
        message: String(err?.message || err || 'UI intent failed')
      }
    });
  }

  pushExperienceIntentTraceEvent({ source, tool: toolName, params, envelope });
  return envelope;
}

window.AgentTownExperienceIntent = {
  dispatch: dispatchExperienceIntent,
  getTrace: getExperienceIntentTraceSnapshot,
  clearTrace: () => {
    experienceIntentTrace.length = 0;
    return { ok: true };
  }
};

function openRouteInModalFrame(url, title) {
  if (!isTownHub) return;

  const body = el('districtModalBody');
  const backdrop = el('districtModalBackdrop');
  const modalTitle = el('districtModalTitle');
  const safeTitle = title || 'District detail';
  const loadId = ++lastDistrictLoad;
  currentDistrict = null;
  clearTownBoardPoll();
  setDistrictModalMode('frame');
  setDistrictModalTheme(inferDistrictModalThemeFromUrl(url));

  if (body) {
    if (modalTitle) modalTitle.textContent = safeTitle;
    body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'districtFrameWrap';
    const frame = document.createElement('iframe');
    frame.className = 'districtFrame';
    frame.title = safeTitle;
    frame.loading = 'eager';
    frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    frame.src = url;
    wrap.appendChild(frame);
    body.appendChild(wrap);
    setModalBusy(true);
    frame.addEventListener('load', () => {
      if (loadId !== lastDistrictLoad) return;
      setModalBusy(false);
    });
    frame.addEventListener('error', () => {
      if (loadId !== lastDistrictLoad) return;
      setModalBusy(false);
      body.innerHTML = '<p class="small" style="color: var(--bad)">Could not load this page.</p>';
    });
    if (backdrop) backdrop.classList.remove('is-hidden');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('district-modal-open');
  }
}

async function showDistrict(district) {
  if (!isTownHub) return;

  const safeDistrict = normalizeDistrict(district);
  if (isTownHubDistrictGateLocked(lastState) && safeDistrict !== 'townhall') {
    const gateReason = getTownHubDistrictGateReason(lastState);
    const gateAllowed = (gateReason === 'brain' && safeDistrict === 'brain')
      || (gateReason === 'sigil' && safeDistrict === 'sigil')
      || (gateReason === 'ceremony' && safeDistrict === 'ceremony');
    if (!gateAllowed) {
      setActiveDistrict('townhall');
      const statusText = getTownHubDistrictGateStatusText();
      const status = el('townSceneStatus');
      if (status && statusText) status.textContent = `Locked: ${statusText}`;
      return;
    }
  }
  const currentLoad = ++lastDistrictLoad;
  currentDistrict = safeDistrict;
  setActiveDistrict(safeDistrict);

  if (safeDistrict === 'atlas') {
    openRouteInModalFrame('/atlas?embed=1', 'Atlas Depot');
    return;
  }

  if (safeDistrict === 'ceremony') {
    openRouteInModalFrame('/create?embed=1', tApp('ceremony.title'));
    renderOnboardingStepper(getOnboardingStep(lastState));
    return;
  }

  const modal = el('districtModalBackdrop');
  const body = el('districtModalBody');
  const title = el('districtModalTitle');
  const cfg = districtViews[safeDistrict] || districtViews.house;
  setDistrictModalMode('district');
  setDistrictModalTheme(districtModalThemeByDistrict[safeDistrict] || 'house');

  if (title) title.textContent = cfg.title;
  if (modal) modal.classList.remove('is-closing');
  if (modal) modal.classList.remove('is-hidden');
  if (modal) modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('district-modal-open');
  setModalBusy(true);

  try {
    const html = await loadDistrictView(safeDistrict);
    if (lastDistrictLoad !== currentLoad) return;
    if (body) {
      body.innerHTML = html;
      if (body.classList.contains('is-loading')) body.classList.remove('is-loading');
    }
    renderOnboardingStepper(getOnboardingStep(lastState));
    if (safeDistrict === 'brain') {
      try {
        let localCfg = getLocalLiteLlm();
        if (!localCfg?.loaded) {
          localCfg = setLocalLiteLlm(await readLocalLiteLlmConfig());
        }
        applyLocalLiteLlmToInputs(localCfg);
      } catch (err) {
        console.warn('brain district llm hydrate skipped', err);
      }
    }
    if (lastState) {
      updateUI(lastState);
    }
    setModalBusy(false);
    bindTownDistrictControls();
    if (safeDistrict === 'leaderboard') {
      scheduleTownBoardPoll();
    } else {
      clearTownBoardPoll();
    }
  } catch (e) {
    if (lastDistrictLoad !== currentLoad) return;
    if (body) {
      body.classList.remove('is-loading');
      body.innerHTML = `<p class="small" style="color: var(--bad)">${tApp('district.error.load_failed', {
        message: String(e?.message || e || 'UNKNOWN_ERROR')
      })}</p>`;
    }
    console.warn('Failed to load district view', e);
  }
}

function hideDistrictImmediate() {
  const modal = el('districtModalBackdrop');
  if (modal) modal.classList.remove('is-closing');
  currentDistrict = null;
  lastDistrictLoad += 1;
  clearTouchDistrictPrime();
  setDistrictModalMode('district');
  setDistrictModalTheme(null);
  if (modal) modal.classList.add('is-hidden');
  if (modal) modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('district-modal-open');
  const body = el('districtModalBody');
  if (body) {
    body.innerHTML = '';
    body.classList.remove('is-loading');
  }
  clearTownBoardPoll();
}

function hideDistrict() {
  if (isTownhallGateLocked(lastState)) return;
  const modal = el('districtModalBackdrop');
  if (modal && !modal.classList.contains('is-hidden') && !modal.classList.contains('is-closing')) {
    modal.classList.add('is-closing');
    const finishHide = () => {
      if (!modal.classList.contains('is-closing')) return;
      modal.classList.remove('is-closing');
      hideDistrictImmediate();
    };
    modal.addEventListener('animationend', finishHide, { once: true });
    setTimeout(() => {
      if (modal.classList.contains('is-closing')) finishHide();
    }, 200);
    return;
  }
  hideDistrictImmediate();
}

function updateTownHubLinks(houseId) {
  const targetHousePath = houseId ? `/house?house=${encodeURIComponent(houseId)}` : '/house';
  const targetInboxPath = houseId ? `/inbox/${encodeURIComponent(houseId)}` : '#';

  const townHallHouseLink = el('townHallHouseLink');
  if (townHallHouseLink) townHallHouseLink.href = targetHousePath;

  const townHallStatus = el('townHallStatus');
  if (townHallStatus) {
    townHallStatus.textContent = houseId
      ? tApp('townhall.status.house_ready', { houseId })
      : tApp('townhall.status.house_needed');
  }

  const ponyInboxLink = el('ponyInboxLink');
  if (ponyInboxLink) {
    ponyInboxLink.href = targetInboxPath;
    ponyInboxLink.setAttribute('aria-disabled', houseId ? 'false' : 'true');
  }

  const ponyInboxHint = el('ponyInboxHint');
  if (ponyInboxHint) {
    ponyInboxHint.textContent = houseId
      ? tApp('pony.inbox.ready', { houseId })
      : tApp('pony.compose_hint');
  }
}

function agentDebugEventsTail(max = 20) {
  return agentDebugEvents.slice(Math.max(0, agentDebugEvents.length - max));
}

function maskTrafficSecret(raw) {
  const text = String(raw || '');
  if (!text) return '[redacted]';
  if (text.length <= 8) return '[redacted]';
  return `${text.slice(0, 4)}…${text.slice(-3)} [redacted]`;
}

function redactTrafficString(value) {
  const text = String(value || '');
  if (!text) return text;
  if (/bearer\s+[A-Za-z0-9._~+/=-]{10,}/i.test(text)) {
    return text.replace(/bearer\s+([A-Za-z0-9._~+/=-]{10,})/gi, (_m, token) => `Bearer ${maskTrafficSecret(token)}`);
  }
  if (/^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(text.trim())) {
    return maskTrafficSecret(text.trim());
  }
  if (/sk-[A-Za-z0-9_-]{10,}/i.test(text)) {
    return text.replace(/sk-[A-Za-z0-9_-]{10,}/gi, (match) => maskTrafficSecret(match));
  }
  return text;
}

function sanitizeAgentTrafficValue(value, depth = 0, seen = new WeakSet()) {
  if (value === null || value === undefined) return value;
  if (depth > 4) return '[max-depth]';
  const type = typeof value;
  if (type === 'string') {
    const redacted = redactTrafficString(value);
    if (redacted.length <= 360) return redacted;
    return `${redacted.slice(0, 360)}…(truncated ${redacted.length - 360} chars)`;
  }
  if (type === 'number' || type === 'boolean') return value;
  if (type === 'bigint') return String(value);
  if (type === 'function' || type === 'symbol' || type === 'undefined') return String(value);

  if (Array.isArray(value)) {
    const slice = value.slice(0, 30).map((entry) => sanitizeAgentTrafficValue(entry, depth + 1, seen));
    if (value.length > slice.length) {
      slice.push(`[${value.length - slice.length} more]`);
    }
    return slice;
  }

  if (type === 'object') {
    if (value instanceof Date) return value.toISOString();
    if (seen.has(value)) return '[circular]';
    seen.add(value);

    const out = {};
    const entries = Object.entries(value);
    const maxKeys = Math.min(entries.length, 40);
    for (let i = 0; i < maxKeys; i += 1) {
      const [rawKey, rawVal] = entries[i];
      const key = String(rawKey || '');
      if (!key) continue;
      if (/(api[_-]?key|token|secret|password|credential|authorization)/i.test(key)) {
        out[key] = maskTrafficSecret(rawVal);
        continue;
      }
      out[key] = sanitizeAgentTrafficValue(rawVal, depth + 1, seen);
    }
    if (entries.length > maxKeys) {
      out.__truncatedKeys = entries.length - maxKeys;
    }
    return out;
  }

  return `[${type}]`;
}

function normalizeAgentTrafficFilter(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'in' || raw === 'incoming') return 'in';
  if (raw === 'out' || raw === 'outgoing') return 'out';
  return 'all';
}

async function connectWallet({ silent = false } = {}) {
  if (!appWalletClient) throw new Error('NO_SOLANA_WALLET');
  const previousAddr = walletAddr;
  const connected = await appWalletClient.connect({ chain: 'solana', silent: !!silent });
  bindWalletEvents();
  walletAddr = connected?.address || appWalletClient.getAddress({ chain: 'solana' }) || null;
  if (!walletAddr) throw new Error('NO_SOLANA_PUBKEY');
  if (previousAddr && previousAddr !== walletAddr) {
    walletHouseId = null;
    walletRecovered = false;
  }
  if (!walletHouseId) {
    const cached = loadWalletCache();
    if (cached && cached.address === walletAddr && cached.houseId) {
      walletHouseId = cached.houseId;
    }
  }
  updateWalletUI();
  saveWalletCache();
  if (lastState) {
    updateUI(lastState);
  }
}

async function disconnectWallet({ fromProvider = false } = {}) {
  if (!fromProvider && appWalletClient) {
    try {
      await appWalletClient.disconnect({ chain: 'solana' });
    } catch {
      // ignore disconnect errors; we still clear local state
    }
  }
  unbindWalletEvents();
  walletAddr = null;
  walletHouseId = null;
  walletRecovered = false;
  updateWalletUI();
  clearWalletCache();
  clearWalletIdentityHint();
  walletRecoveryIntentAttempts = 0;
  if (lastState) updateUI(lastState);
  if (fromProvider) {
    return;
  }
}

async function resetSessionAndReload() {
  try {
    await api('/api/session/reset', { method: 'POST', body: JSON.stringify({}) });
  } catch (e) {
    console.warn('session reset failed', e);
  }
  walletRecoveryIntentAttempts = 0;
  clearClientFlowState();
  // Full reload so we pick up the new `et_session` cookie.
  window.location.replace('/');
}

async function maybeResetAfterWalletDisconnect() {
  // Auto-reset when this session is carrying identity-bound progress.
  // This includes:
  // - existing house session (shared-device safety)
  // - token-verified human flow on the landing page
  const shouldResetForState = (st) => !!(
    st && (
      st.houseId
      || (st.signup?.complete && (st.signup?.mode === 'token' || st.signup?.mode === 'claim'))
    )
  );
  if (!shouldResetForState(lastState)) return;
  await resetSessionAndReload();
}

function pushAgentDebugTraffic(direction, channel, payload, options = {}) {
  const ignoreMute = options && options.ignoreMute === true;
  if (!ignoreMute && agentDebugTrafficMuteDepth > 0) return;
  const dir = String(direction || '').trim().toLowerCase() === 'in' ? 'IN' : 'OUT';
  const target = String(channel || '').trim() || 'unknown';
  const stamp = new Date().toISOString();
  let payloadValue = null;
  let payloadText = '';
  if (payload !== undefined) {
    try {
      payloadValue = sanitizeAgentTrafficValue(payload);
      payloadText = JSON.stringify(payloadValue);
    } catch {
      payloadValue = String(payload);
      payloadText = String(payload);
    }
    if (payloadText.length > AGENT_DEBUG_TRAFFIC_LINE_MAX) {
      payloadText = `${payloadText.slice(0, AGENT_DEBUG_TRAFFIC_LINE_MAX)}…`;
    }
  }
  let line = `[${stamp}] ${dir} ${target}${payloadText ? ` ${payloadText}` : ''}`;
  if (line.length > AGENT_DEBUG_TRAFFIC_LINE_MAX) {
    line = `${line.slice(0, AGENT_DEBUG_TRAFFIC_LINE_MAX)}…`;
  }
  agentDebugTraffic.push({
    stamp,
    direction: dir,
    channel: target,
    payload: payloadValue,
    payloadText,
    line,
  });
  if (agentDebugTraffic.length > AGENT_DEBUG_TRAFFIC_LIMIT) {
    agentDebugTraffic.splice(0, agentDebugTraffic.length - AGENT_DEBUG_TRAFFIC_LIMIT);
  }
}

async function lookupWalletHouse(houseIdOverride = null) {
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  if (!appWalletClient) throw new Error('NO_SOLANA_WALLET');
  const nonceResp = await api('/api/wallet/nonce');
  const msg = buildWalletLookupMessage({
    address: walletAddr,
    nonce: nonceResp.nonce,
    houseId: houseIdOverride || null
  });
  const sigArr = await appWalletClient.signMessage({ chain: 'solana', message: msg });
  const signature = b64(sigArr);
  const body = {
    address: walletAddr,
    nonce: nonceResp.nonce,
    signature
  };
  if (houseIdOverride) body.houseId = houseIdOverride;
  const lookup = await api('/api/wallet/lookup', { method: 'POST', body: JSON.stringify(body) });
  return lookup;
}

async function connectWalletAndLookup({ silent = false } = {}) {
  await connectWallet({ silent });
  setWalletStatus(tApp('common.wallet_checking_houses'));
  const lookup = await lookupWalletHouse();
  if (lookup.houseId) {
    walletHouseId = lookup.houseId;
    walletRecovered = true;
    setWalletStatus(tApp('common.wallet_house_found'));
    if (lastState) updateUI({ ...lastState, houseId: lookup.houseId });
  } else {
    walletHouseId = null;
    walletRecovered = false;
    setWalletStatus(tApp('common.wallet_no_houses'));
    if (lastState) updateUI({ ...lastState, houseId: null });
  }
}

function agentDebugTrafficTail(max = 60) {
  return agentDebugTraffic.slice(Math.max(0, agentDebugTraffic.length - max));
}

async function verifyTokenOwnership() {
  if (!walletAddr) {
    await connectWallet();
  }
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  if (!appWalletClient) throw new Error('NO_SOLANA_WALLET');
  const nonceResp = await api('/api/token/nonce');
  const msg = buildTokenCheckMessage({ address: walletAddr, nonce: nonceResp.nonce });
  const sigArr = await appWalletClient.signMessage({ chain: 'solana', message: msg });
  const signature = b64(sigArr);
  const result = await api('/api/token/verify', {
    method: 'POST',
    body: JSON.stringify({ address: walletAddr, nonce: nonceResp.nonce, signature })
  });
  return result;
}

function updateAgentStatus(dotId, textId, connected, name) {
  const dot = el(dotId);
  const text = el(textId);
  if (!dot || !text) return;
  dot.className = `dot ${connected ? 'good' : ''}`;
  text.textContent = connected
    ? tApp('agent.status.connected', { suffix: name ? `: ${name}` : '' })
    : tApp('agent.status.disconnected');
}

async function restoreWalletConnection() {
  const cached = loadWalletCache();
  if (!cached || !cached.address) return;
  try {
    await connectWallet({ silent: true });
  } catch {
    clearWalletCache();
    updateWalletUI();
    return;
  }
  if (cached.houseId) {
    walletHouseId = cached.houseId;
    walletRecovered = true;
    if (lastState) updateUI({ ...lastState, houseId: cached.houseId });
  }
  setWalletStatus(tApp('common.wallet_connected'));
  saveWalletCache();
}

function setAgentTrafficFilter(value) {
  agentDebugTrafficFilter = normalizeAgentTrafficFilter(value);
  const buttons = Array.from(document.querySelectorAll('[data-traffic-filter]'));
  for (const btn of buttons) {
    const current = normalizeAgentTrafficFilter(btn?.dataset?.trafficFilter || '');
    const active = current === agentDebugTrafficFilter;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

function matchesAgentTrafficFilter(entry) {
  const mode = normalizeAgentTrafficFilter(agentDebugTrafficFilter);
  if (mode === 'all') return true;
  const dir = String(entry?.direction || '').trim().toLowerCase();
  return dir === mode;
}

function renderAgentTrafficCards(nowIso) {
  const list = el('agentDebugTraffic');
  const meta = el('agentDebugTrafficMeta');
  if (!list) return;

  const filtered = agentDebugTraffic.filter((entry) => matchesAgentTrafficFilter(entry));
  const tail = filtered.slice(Math.max(0, filtered.length - AGENT_DEBUG_TRAFFIC_RENDER_LIMIT));
  const visible = tail.slice().reverse();
  const modeLabel = getAgentTrafficFilterLabel(agentDebugTrafficFilter);

  if (meta) {
    meta.textContent = tApp('agent.panel.debug.traffic_meta', {
      refreshedAt: nowIso,
      filter: modeLabel,
      shown: visible.length,
      total: filtered.length
    });
  }

  list.innerHTML = '';
  if (!visible.length) {
    const empty = document.createElement('div');
    empty.className = 'agent-traffic-empty';
    empty.textContent = tApp('agent.panel.debug.no_traffic');
    list.appendChild(empty);
    return;
  }

  for (const entry of visible) {
    const stamp = String(entry?.stamp || '');
    const direction = String(entry?.direction || 'OUT').trim().toUpperCase() === 'IN' ? 'IN' : 'OUT';
    const channel = String(entry?.channel || 'unknown');
    const payloadText = String(entry?.payloadText || '').trim();
    const summary = `${direction} ${channel}`;
    const card = document.createElement('article');
    card.className = 'agent-traffic-card';
    card.dataset.direction = direction;
    card.dataset.stamp = stamp;
    card.dataset.epochMs = String(Date.parse(stamp) || 0);

    const header = document.createElement('div');
    header.className = 'agent-traffic-card-header';

    const badges = document.createElement('div');
    badges.className = 'agent-traffic-card-badges';

    const dirNode = document.createElement('span');
    dirNode.className = `agent-traffic-dir ${direction.toLowerCase()}`;
    dirNode.textContent = direction;

    const channelNode = document.createElement('span');
    channelNode.className = 'agent-traffic-channel';
    channelNode.textContent = channel;

    badges.appendChild(dirNode);
    badges.appendChild(channelNode);

    const timeNode = document.createElement('span');
    timeNode.className = 'agent-traffic-time';
    timeNode.textContent = stamp;

    header.appendChild(badges);
    header.appendChild(timeNode);

    const summaryNode = document.createElement('div');
    summaryNode.className = 'agent-traffic-summary';
    summaryNode.textContent = summary;

    card.appendChild(header);
    card.appendChild(summaryNode);

    if (payloadText) {
      const payloadNode = document.createElement('pre');
      payloadNode.className = 'agent-traffic-payload';
      payloadNode.textContent = payloadText;
      card.appendChild(payloadNode);
    }

    list.appendChild(card);
  }
}

function renderSigils(state) {
  const grid = el('sigilGrid');
  if (!grid) return;
  grid.innerHTML = '';

  // Add explainer above grid if not already present
  let explainer = grid.previousElementSibling;
  if (!explainer || !explainer.classList.contains('sigil-explainer')) {
    explainer = document.createElement('div');
    explainer.className = 'sigil-explainer small';
    explainer.textContent = tApp('sigil.explainer');
    grid.parentNode.insertBefore(explainer, grid);
  }

  const confirmedHumanSel = typeof state?.human?.selected === 'string' && state.human.selected
    ? state.human.selected
    : null;
  if (confirmedHumanSel) pendingHumanSigilSelection = null;
  const humanSel = confirmedHumanSel || pendingHumanSigilSelection || null;
  const agentSel = state?.agent?.selected || null;

  for (const item of elements) {
    const btn = document.createElement('button');
    btn.className = 'btn sigil';
    btn.type = 'button';
    btn.setAttribute('data-testid', `sigil-${item.id}`);
    btn.dataset.elementId = item.id;

    if (item.icon) {
      const iconDiv = document.createElement('div');
      iconDiv.className = 'sigilIcon';
      iconDiv.setAttribute('aria-hidden', 'true');
      iconDiv.textContent = item.icon;
      btn.appendChild(iconDiv);
    }

    const nameSpan = document.createElement('div');
    nameSpan.className = 'name';
    nameSpan.textContent = item.label;
    btn.appendChild(nameSpan);

    const picks = document.createElement('div');
    picks.className = 'sigil-picks';

    const you = document.createElement('div');
    you.className = 'pill';
    you.textContent = humanSel === item.id ? tApp('sigil.pick_you') : '';

    const agent = document.createElement('div');
    agent.className = 'pill';
    agent.textContent = agentSel === item.id ? tApp('sigil.pick_agent') : '';

    picks.appendChild(you);
    picks.appendChild(agent);
    btn.appendChild(picks);

    if (humanSel === item.id || agentSel === item.id) {
      btn.classList.add('selected');
    }

    btn.addEventListener('click', async () => {
      setOpenError('');
      pendingHumanSigilSelection = item.id;
      if (lastState) renderSigils(lastState);
      try {
        const resp = await api('/api/human/select', {
          method: 'POST',
          body: JSON.stringify({ elementId: item.id })
        });
        if (resp?.humanSelected && lastState) {
          lastState = {
            ...lastState,
            human: { ...(lastState.human || {}), selected: resp.humanSelected },
            match: resp.match || lastState.match
          };
        }
        pendingHumanSigilSelection = null;
        if (lastState) {
          renderSigils(lastState);
          updateMatchUi(lastState);
        }
        requestHomeSkillStep('human-action');
      } catch (e) {
        pendingHumanSigilSelection = null;
        if (lastState) renderSigils(lastState);
        setOpenError(tApp('sigil.error.select_failed', { message: e.message }));
      }
    });

    grid.appendChild(btn);
  }
}

async function withAgentTrafficMuted(task) {
  agentDebugTrafficMuteDepth += 1;
  try {
    return await task();
  } finally {
    agentDebugTrafficMuteDepth = Math.max(0, agentDebugTrafficMuteDepth - 1);
  }
}

async function withDebugTimeout(task, fallback = null, timeoutMs = 8000) {
  let timeoutId = null;
  const wrappedTask = typeof task === 'function' ? task() : task;
  try {
    return await Promise.race([
      Promise.resolve(wrappedTask),
      new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), Math.max(1, Number(timeoutMs) || 8000));
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function setAgentDebugText(id, text) {
  const node = el(id);
  if (!node) return;
  node.textContent = String(text || '');
}

function instrumentGatewayTraffic(gatewayApi) {
  if (!gatewayApi || typeof gatewayApi !== 'object') return gatewayApi;
  if (gatewayApi.__agentDebugTrafficInstrumented === true) return gatewayApi;
  Object.defineProperty(gatewayApi, '__agentDebugTrafficInstrumented', {
    value: true,
    writable: false,
    configurable: false,
    enumerable: false,
  });

  const wrapCall = (channel, fn) => {
    const forceRecord = channel === 'gateway.send';
    return (...args) => {
      pushAgentDebugTraffic('out', channel, args.length <= 1 ? args[0] : { args }, { ignoreMute: forceRecord });
      try {
        const value = fn(...args);
        if (value && typeof value.then === 'function') {
          return value.then((result) => {
            pushAgentDebugTraffic('in', `${channel}.result`, result, { ignoreMute: forceRecord });
            return result;
          }).catch((error) => {
            pushAgentDebugTraffic('in', `${channel}.error`, {
              message: String(error?.message || error || 'UNKNOWN_ERROR'),
            }, { ignoreMute: forceRecord });
            throw error;
          });
        }
        pushAgentDebugTraffic('in', `${channel}.result`, value, { ignoreMute: forceRecord });
        return value;
      } catch (error) {
        pushAgentDebugTraffic('in', `${channel}.error`, {
          message: String(error?.message || error || 'UNKNOWN_ERROR'),
        }, { ignoreMute: forceRecord });
        throw error;
      }
    };
  };

  if (typeof gatewayApi.send === 'function') {
    gatewayApi.send = wrapCall('gateway.send', gatewayApi.send.bind(gatewayApi));
  }

  for (const [name, value] of Object.entries(gatewayApi)) {
    if (name === 'send' || name === 'on') continue;
    if (name.startsWith('__')) continue;
    if (typeof value !== 'function') continue;
    gatewayApi[name] = wrapCall(`gateway.${name}`, value.bind(gatewayApi));
  }

  return gatewayApi;
}

function setAgentDebugTab(tab) {
  const next = ['tools', 'skill', 'session', 'traffic', 'brain'].includes(String(tab || '')) ? String(tab) : 'tools';
  agentDebugActiveTab = next;

  const tabs = Array.from(document.querySelectorAll('[data-debug-tab]'));
  for (const btn of tabs) {
    const active = String(btn?.dataset?.debugTab || '') === next;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  }

  const panels = Array.from(document.querySelectorAll('[data-debug-panel]'));
  for (const panel of panels) {
    const active = String(panel?.dataset?.debugPanel || '') === next;
    panel.classList.toggle('is-hidden', !active);
  }

  if (next === 'session') {
    const node = el('agentDebugSession');
    if (node && !String(node.textContent || '').trim()) {
      node.textContent = tApp('agent.panel.debug.loading_session');
    }
  }
}

function formatDebugList(prefix, values) {
  const items = Array.isArray(values) ? values : [];
  if (!items.length) return `${prefix}: (none)`;
  return `${prefix}:\n${items.map((item) => `- ${item}`).join('\n')}`;
}

function getLitePermissionPolicyState() {
  const snapshot = liteRuntimeState && typeof liteRuntimeState === 'object' ? liteRuntimeState : {};
  const policy = snapshot.policy && typeof snapshot.policy === 'object' ? snapshot.policy : {};
  const permissions = Array.isArray(policy.permissions) ? policy.permissions : [];
  const originsByPermission = policy.originsByPermission && typeof policy.originsByPermission === 'object'
    ? policy.originsByPermission
    : {};
  const risk = policy.risk && typeof policy.risk === 'object' ? policy.risk : {};
  return {
    mode: String(policy.mode || 'legacy-allow'),
    permissions,
    originsByPermission,
    risk: {
      level: String(risk.level || 'unknown'),
      rationale: String(risk.rationale || ''),
    },
    source: policy.source && typeof policy.source === 'object' ? policy.source : null,
    lastError: typeof policy.lastError === 'string' && policy.lastError ? policy.lastError : null,
  };
}

function formatPermissionPolicyPermissionList(policyState) {
  const permissions = Array.isArray(policyState?.permissions) ? policyState.permissions : [];
  return permissions.map((entry) => {
    const id = String(entry?.id || '').trim();
    const constraints = entry?.constraints && typeof entry.constraints === 'object' ? entry.constraints : {};
    const origins = Array.isArray(constraints.origins) ? constraints.origins : [];
    const originSuffix = origins.length ? ` origins=${origins.join(',')}` : '';
    return `${id}${originSuffix}`;
  });
}

function formatPermissionPolicyOriginAllowlist(policyState) {
  const out = [];
  const byPermission = policyState?.originsByPermission && typeof policyState.originsByPermission === 'object'
    ? policyState.originsByPermission
    : {};
  for (const [permissionId, originsRaw] of Object.entries(byPermission)) {
    const origins = Array.isArray(originsRaw)
      ? originsRaw.map((value) => String(value || '').trim()).filter(Boolean)
      : [];
    if (!origins.length) continue;
    out.push(`${String(permissionId || '')}: ${origins.join(', ')}`);
  }
  return out;
}

async function refreshAgentDebugPanels(reason = 'poll') {
  const toolsPane = el('agentDebugTools');
  const skillPane = el('agentDebugSkill');
  const sessionPane = el('agentDebugSession');
  const trafficPane = el('agentDebugTraffic');
  if (!toolsPane && !skillPane && !sessionPane && !trafficPane) return;

  if (agentDebugRefreshInFlight) {
    agentDebugRefreshQueued = true;
    return;
  }
  agentDebugRefreshInFlight = true;

  try {
    const gatewayApi = await withDebugTimeout(() => initGateway(), null, 6000);
    const debugApi = window.__openclawLiteTest || null;
    const nowIso = new Date().toISOString();
    const shouldLoadSession =
      reason === 'manual'
      || reason === 'tab-session'
      || agentDebugActiveTab === 'session'
      || !sessionPane?.textContent;

    const runtimeStateInput = lastState && typeof lastState === 'object' ? lastState : null;
    const runtimeContextInput = buildExperienceRuntimeContext(lastState);

    const transcriptToolStatsPromise = debugApi && typeof debugApi.getTranscriptToolStats === 'function'
      ? withDebugTimeout(() => withAgentTrafficMuted(async () => {
        return await debugApi.getTranscriptToolStats().catch(() => null);
      }), null, 5000)
      : Promise.resolve(null);

    const toolRegistryPromise = debugApi && typeof debugApi.getToolRegistryInfo === 'function'
      ? withDebugTimeout(() => withAgentTrafficMuted(async () => {
        return await debugApi.getToolRegistryInfo().catch(() => null);
      }), null, 5000)
      : Promise.resolve(null);

    const skillSnapshotPromise = gatewayApi && typeof gatewayApi.skillState === 'function'
      ? withDebugTimeout(() => withAgentTrafficMuted(async () => {
        return await gatewayApi.skillState().catch(() => null);
      }), null, 6000)
      : Promise.resolve(null);

    const promptPreviewPromise = gatewayApi && typeof gatewayApi.systemPromptPreview === 'function'
      ? withDebugTimeout(() => withAgentTrafficMuted(async () => {
        return await gatewayApi.systemPromptPreview().catch(() => null);
      }), null, 6000)
      : Promise.resolve(null);

    const trainerNamespaceStatePromise = withDebugTimeout(() => withAgentTrafficMuted(async () => {
      return await refreshTrainerNamespacePluginCache(lastState).catch(() => null);
    }), null, 5000);

    const workerSessionContextPromise = gatewayApi && typeof gatewayApi.runtimeSessionContext === 'function'
      ? withDebugTimeout(() => withAgentTrafficMuted(async () => {
        return await gatewayApi.runtimeSessionContext({
          runtimeContext: runtimeContextInput,
          runtimeState: runtimeStateInput,
        });
      }), null, 7000)
      : Promise.resolve(null);

    const transcriptPromise = shouldLoadSession && debugApi && typeof debugApi.getTranscriptDump === 'function'
      ? withDebugTimeout(() => withAgentTrafficMuted(async () => {
        return await debugApi.getTranscriptDump().catch(() => '[]');
      }), '[]', 6000)
      : Promise.resolve(null);

    const [
      transcriptToolStats,
      toolRegistry,
      skillSnapshotEnvelope,
      promptPreviewEnvelope,
      trainerNamespaceState,
      workerSessionContextEnvelope,
      transcriptRaw,
    ] = await Promise.all([
      transcriptToolStatsPromise,
      toolRegistryPromise,
      skillSnapshotPromise,
      promptPreviewPromise,
      trainerNamespaceStatePromise,
      workerSessionContextPromise,
      transcriptPromise,
    ]);

    const skillSnapshot = skillSnapshotEnvelope?.data || skillSnapshotEnvelope || null;
    const promptPreview = promptPreviewEnvelope?.data || promptPreviewEnvelope || null;

    const availableSkills = parseAvailableSkills(promptPreview?.skillsPrompt || '');
    const contextPaths = Array.isArray(promptPreview?.contextFilePaths) ? promptPreview.contextFilePaths : [];
    const importedPaths = Array.isArray(skillSnapshot?.importedPaths) ? skillSnapshot.importedPaths : [];
    const importedFiles = Array.isArray(skillSnapshot?.importedFiles) ? skillSnapshot.importedFiles : [];
    const skillActionPluginState = await withDebugTimeout(() => withAgentTrafficMuted(async () => {
      return await refreshSkillActionPluginCache(gatewayApi, debugApi, skillSnapshot).catch(() => null);
    }), null, 7000);
    const pluginActions = Array.isArray(skillActionPluginState?.actions) ? skillActionPluginState.actions : [];
    const workerToolNames = Array.isArray(toolRegistry?.names) ? toolRegistry.names : [];
    const workerToolNameSet = new Set(workerToolNames.map((name) => String(name || '').trim()).filter(Boolean));
    const pluginActionToolNames = pluginActions.map((action) => `skill_action.${action.id}`);
    const pluginActionAddonToolNames = pluginActionToolNames.filter((name) => !workerToolNameSet.has(name));
    const pluginUsage = skillActionPluginState?.usage || null;
    const trainerNamespaceTools = Array.isArray(trainerNamespaceState?.tools) ? trainerNamespaceState.tools : [];
    const trainerNamespaceToolNames = trainerNamespaceTools
      .map((row) => String(row?.name || '').trim())
      .filter(Boolean);
    const trainerNamespaceAddonToolNames = trainerNamespaceToolNames.filter((name) => !workerToolNameSet.has(name));
    const trainerNamespaceDiagnostics = trainerNamespaceState?.diagnostics && typeof trainerNamespaceState.diagnostics === 'object'
      ? trainerNamespaceState.diagnostics
      : null;
    const trainerBudgetPerTurnRemaining = trainerNamespaceDiagnostics?.budgetRemaining?.perTurn?.remaining;
    const trainerBudgetPerMinuteRemaining = trainerNamespaceDiagnostics?.budgetRemaining?.perMinute?.remaining;
    const trainerPendingApprovals = Array.isArray(trainerNamespaceDiagnostics?.pendingApprovals)
      ? trainerNamespaceDiagnostics.pendingApprovals.length
      : 0;
    const trainerRecentBlockCodes = Array.isArray(trainerNamespaceDiagnostics?.recentBlockCodes)
      ? trainerNamespaceDiagnostics.recentBlockCodes
      : [];
    const permissionPolicyState = getLitePermissionPolicyState();
    const permissionPolicyPermissionLines = formatPermissionPolicyPermissionList(permissionPolicyState);
    const permissionPolicyOriginLines = formatPermissionPolicyOriginAllowlist(permissionPolicyState);

    const toolsLines = [
      tApp('agent.panel.debug.refreshed', { refreshedAt: nowIso }),
      tApp('agent.panel.debug.reason', { reason }),
      tApp('agent.panel.debug.tools_count', { count: Number(toolRegistry?.count || workerToolNames.length) }),
      tApp('agent.panel.debug.skill_action_tools_count', { count: pluginActionAddonToolNames.length }),
      tApp('agent.panel.debug.trainer_tools_count', { count: trainerNamespaceAddonToolNames.length }),
      tApp('agent.panel.debug.trainer_budget_per_turn', {
        value: trainerBudgetPerTurnRemaining === null || trainerBudgetPerTurnRemaining === undefined
          ? tApp('agent.panel.debug.na')
          : trainerBudgetPerTurnRemaining
      }),
      tApp('agent.panel.debug.trainer_budget_per_minute', {
        value: trainerBudgetPerMinuteRemaining === null || trainerBudgetPerMinuteRemaining === undefined
          ? tApp('agent.panel.debug.na')
          : trainerBudgetPerMinuteRemaining
      }),
      formatDebugListLabel('agent.panel.debug.list.tools', workerToolNames),
      formatDebugListLabel('agent.panel.debug.list.skill_action_tools', pluginActionAddonToolNames.slice(0, 60)),
      formatDebugListLabel('agent.panel.debug.list.trainer_tools', trainerNamespaceAddonToolNames.slice(0, 60)),
      '',
      tApp('agent.panel.debug.dispatch_path', {
        value: formatDebugValue(toolRegistry?.dispatchPath, 'agent.panel.debug.unknown')
      }),
      tApp('agent.panel.debug.active_tab', { value: agentDebugActiveTab }),
      '',
      tApp('agent.panel.debug.recent_worker_events'),
      ...agentDebugEventsTail(20),
    ];
    setAgentDebugText('agentDebugTools', toolsLines.filter(Boolean).join('\n'));

    const skillLines = [
      tApp('agent.panel.debug.refreshed', { refreshedAt: nowIso }),
      tApp('agent.panel.debug.skill_import_status', {
        value: formatDebugValue(skillSnapshot?.status, 'agent.panel.debug.unknown')
      }),
      tApp('agent.panel.debug.source_url', {
        value: formatDebugValue(skillSnapshot?.sourceUrl)
      }),
      tApp('agent.panel.debug.active_skill_path', {
        value: formatDebugValue(skillSnapshot?.activeSkillPath)
      }),
      tApp('agent.panel.debug.last_error', {
        value: formatDebugValue(skillSnapshot?.lastError)
      }),
      tApp('agent.panel.debug.imported_paths_count', { count: importedPaths.length }),
      tApp('agent.panel.debug.imported_files_count', { count: importedFiles.length }),
      '',
      tApp('agent.panel.debug.permission_mode', { value: permissionPolicyState.mode }),
      tApp('agent.panel.debug.permission_risk_level', { value: permissionPolicyState.risk.level }),
      tApp('agent.panel.debug.permission_rationale', {
        value: permissionPolicyState.risk.rationale || tApp('agent.panel.debug.none')
      }),
      tApp('agent.panel.debug.permission_source', {
        value: permissionPolicyState.source ? String(permissionPolicyState.source.kind || tApp('agent.panel.debug.unknown')) : tApp('agent.panel.debug.none')
      }),
      tApp('agent.panel.debug.permission_error', {
        value: permissionPolicyState.lastError || tApp('agent.panel.debug.none')
      }),
      formatDebugListLabel('agent.panel.debug.list.declared_permissions', permissionPolicyPermissionLines),
      formatDebugListLabel('agent.panel.debug.list.origin_allowlist', permissionPolicyOriginLines),
      '',
      formatDebugListLabel('agent.panel.debug.list.imported_paths', importedPaths.slice(0, 40)),
      '',
      tApp('agent.panel.debug.skills_extracted', { count: availableSkills.length }),
      ...availableSkills.map((entry, idx) => `${idx + 1}. ${entry.name} @ ${entry.location}\n   ${entry.description}`),
      '',
      tApp('agent.panel.debug.skill_actions_extracted', { count: pluginActions.length }),
      tApp('agent.panel.debug.skill_action_parser', {
        value: formatDebugValue(skillActionPluginState?.parserVersion, 'agent.panel.debug.unknown')
      }),
      tApp('agent.panel.debug.skill_action_source', {
        value: formatDebugValue(skillActionPluginState?.source)
      }),
      ...pluginActions.slice(0, 30).map((entry, idx) => {
        const method = String(entry?.request?.method || 'GET');
        const urlTemplate = String(entry?.request?.urlTemplate || '');
        const source = String(entry?.source || 'inferred');
        const confidence = Number(entry?.confidence || 0);
        return `${idx + 1}. ${entry.id} [${source}, c=${confidence.toFixed(2)}] ${method} ${urlTemplate}`;
      }),
      '',
      tApp('agent.panel.debug.trainer_namespace_enabled', {
        value: trainerNamespaceState?.enabled === true ? tApp('share.yes') : tApp('share.no')
      }),
      tApp('agent.panel.debug.trainer_namespace_tools', { count: trainerNamespaceToolNames.length }),
      tApp('agent.panel.debug.trainer_pending_approvals', { count: trainerPendingApprovals }),
      tApp('agent.panel.debug.trainer_recent_block_codes', { count: trainerRecentBlockCodes.length }),
      ...trainerNamespaceToolNames.map((name, idx) => `${idx + 1}. ${name}`),
      ...(trainerRecentBlockCodes.slice(0, 8).map((row, idx) => {
        const code = String(row?.code || '');
        const tool = String(row?.tool || '');
        return tApp('agent.panel.debug.block_item', {
          index: idx + 1,
          code: code || tApp('agent.panel.debug.none'),
          tool: tool || tApp('agent.panel.debug.unknown')
        });
      })),
      '',
      formatDebugListLabel('agent.panel.debug.list.prompt_context_files', contextPaths),
      '',
      tApp('agent.panel.debug.recent_worker_events'),
      ...agentDebugEventsTail(16),
    ];
    setAgentDebugText('agentDebugSkill', skillLines.filter(Boolean).join('\n'));

    const workerSessionContext = workerSessionContextEnvelope?.data || workerSessionContextEnvelope || null;
    const workerSessionContextError = gatewayApi && typeof gatewayApi.runtimeSessionContext === 'function'
      ? (workerSessionContext ? null : 'RUNTIME_SESSION_CONTEXT_TIMEOUT')
      : 'RUNTIME_SESSION_CONTEXT_UNAVAILABLE';
    const transcript = shouldLoadSession ? safeJsonParse(transcriptRaw, []) : null;

    const sessionHeader = {
      refreshedAt: nowIso,
      reason,
      experiencePreference: getCurrentExperiencePreference(),
      runtimeState: {
        teamCode: String(lastState?.teamCode || ''),
        houseId: String(lastState?.houseId || ''),
        step: String(lastState?.experience?.step || ''),
        nextAgentAction: String(lastState?.experience?.nextAgentAction || ''),
      },
      skillState: {
        status: String(skillSnapshot?.status || ''),
        sourceUrl: String(skillSnapshot?.sourceUrl || ''),
        activeSkillPath: String(skillSnapshot?.activeSkillPath || ''),
      },
      skillActionsPlugin: {
        parserVersion: String(skillActionPluginState?.parserVersion || ''),
        source: String(skillActionPluginState?.source || ''),
        actionCount: pluginActions.length,
        notUsedActions: Array.isArray(pluginUsage?.notUsedActions) ? pluginUsage.notUsedActions : [],
        reasonCodes: Array.isArray(pluginUsage?.reasonCodes) ? pluginUsage.reasonCodes : [],
      },
      trainerNamespacePlugin: {
        enabled: trainerNamespaceState?.enabled === true,
        toolCount: trainerNamespaceToolNames.length,
        tools: trainerNamespaceToolNames,
        tierPolicy: trainerNamespaceDiagnostics?.tierPolicy || null,
        budgetRemaining: trainerNamespaceDiagnostics?.budgetRemaining || null,
        pendingApprovals: Array.isArray(trainerNamespaceDiagnostics?.pendingApprovals)
          ? trainerNamespaceDiagnostics.pendingApprovals
          : [],
        recentBlockCodes: trainerRecentBlockCodes,
      },
      permissionPolicy: permissionPolicyState,
      promptContextFiles: contextPaths,
      promptSkillsCount: availableSkills.length,
      transcriptItems: Array.isArray(transcript) ? transcript.length : null,
      transcriptIntegrity: {
        toolResultCount: Number(transcriptToolStats?.toolResultCount || 0),
        orphanToolResults: Number(transcriptToolStats?.orphanToolResults || 0),
        duplicateToolResults: Number(transcriptToolStats?.duplicateToolResults || 0),
        displacedToolResults: Number(transcriptToolStats?.displacedToolResults || 0),
      },
      workerSessionContext: {
        sessionId: String(workerSessionContext?.sessionId || ''),
        generatedAtMs: Number.isFinite(Number(workerSessionContext?.generatedAtMs))
          ? Number(workerSessionContext.generatedAtMs)
          : null,
        lastLlmSource: String(workerSessionContext?.lastLlmInput?.source || ''),
        promptTextChars: Number.isFinite(Number(workerSessionContext?.lastLlmInput?.promptTextChars))
          ? Number(workerSessionContext.lastLlmInput.promptTextChars)
          : 0,
      },
      workerSessionContextError: workerSessionContextError || null,
    };

    const sessionLines = [
      JSON.stringify(sessionHeader, null, 2),
      '',
      tApp('agent.panel.debug.recent_worker_events'),
      ...agentDebugEventsTail(25),
      '',
      tApp('agent.panel.debug.transcript_integrity_heading'),
      JSON.stringify({
        toolResultCount: Number(transcriptToolStats?.toolResultCount || 0),
        orphanToolResults: Number(transcriptToolStats?.orphanToolResults || 0),
        duplicateToolResults: Number(transcriptToolStats?.duplicateToolResults || 0),
        displacedToolResults: Number(transcriptToolStats?.displacedToolResults || 0),
      }, null, 2),
      '',
      tApp('agent.panel.debug.worker_session_context_heading'),
      workerSessionContext ? JSON.stringify(workerSessionContext, null, 2) : tApp('agent.panel.debug.unavailable'),
      workerSessionContextError
        ? `\n${tApp('agent.panel.debug.worker_session_context_warning', { message: workerSessionContextError })}`
        : '',
      '',
      tApp('agent.panel.debug.skill_action_plugin_diagnostics'),
      JSON.stringify({
        parserVersion: String(skillActionPluginState?.parserVersion || ''),
        source: String(skillActionPluginState?.source || ''),
        actionCount: pluginActions.length,
        actionTools: pluginActionToolNames,
        usage: pluginUsage,
      }, null, 2),
      '',
      tApp('agent.panel.debug.trainer_namespace_plugin_diagnostics'),
      JSON.stringify({
        enabled: trainerNamespaceState?.enabled === true,
        toolCount: trainerNamespaceToolNames.length,
        tools: trainerNamespaceToolNames,
        tierPolicy: trainerNamespaceDiagnostics?.tierPolicy || null,
        budgetRemaining: trainerNamespaceDiagnostics?.budgetRemaining || null,
        pendingApprovals: Array.isArray(trainerNamespaceDiagnostics?.pendingApprovals)
          ? trainerNamespaceDiagnostics.pendingApprovals
          : [],
        recentBlockCodes: trainerRecentBlockCodes,
      }, null, 2),
      '',
      tApp('agent.panel.debug.permission_policy_diagnostics'),
      JSON.stringify(permissionPolicyState, null, 2),
      '',
      tApp('agent.panel.debug.transcript_dump'),
      Array.isArray(transcript)
        ? JSON.stringify(transcript, null, 2)
        : tApp('agent.panel.debug.refresh_to_load_transcript'),
      '',
      tApp('agent.panel.debug.system_prompt_preview'),
      String(promptPreview?.systemPrompt || tApp('agent.panel.debug.unavailable')),
    ];
    setAgentDebugText('agentDebugSession', sessionLines.join('\n'));

    renderAgentTrafficCards(nowIso);
  } catch (err) {
    const message = String(err?.message || err || 'DEBUG_REFRESH_FAILED');
    const nowIso = new Date().toISOString();
    const fallbackLines = [
      tApp('agent.panel.debug.refreshed', { refreshedAt: nowIso }),
      tApp('agent.panel.debug.reason', { reason }),
      '',
      tApp('agent.panel.debug.refresh_failed', { message }),
      '',
      tApp('agent.panel.debug.refresh_hint'),
    ];
    setAgentDebugText('agentDebugTools', fallbackLines.join('\n'));
    setAgentDebugText('agentDebugSkill', fallbackLines.join('\n'));
    setAgentDebugText('agentDebugSession', fallbackLines.join('\n'));
  } finally {
    agentDebugRefreshInFlight = false;
    if (agentDebugRefreshQueued) {
      agentDebugRefreshQueued = false;
      refreshAgentDebugPanels('queued').catch(() => { });
    }
  }
}

function syncTownhallGate(state) {
  if (!isTownHub) return;
  const gateReason = getTownHubDistrictGateReason(state);
  const gateLocked = !!gateReason;
  const onboardingLocked = gateReason === 'onboarding';
  applyDistrictHotspotLocks(state);

  const closeBtn = el('districtModalClose');
  if (closeBtn) {
    closeBtn.classList.toggle('is-hidden', onboardingLocked);
    closeBtn.disabled = onboardingLocked;
  }

  if (!gateLocked) return;

  const statusText = getTownHubDistrictGateStatusText();
  const status = el('townSceneStatus');
  if (status && statusText) status.textContent = statusText;

  const backdrop = el('districtModalBackdrop');
  const modalHidden = !backdrop || backdrop.classList.contains('is-hidden');
  if (onboardingLocked && (currentDistrict !== 'townhall' || modalHidden)) {
    showDistrict('townhall');
  } else if (gateReason === 'brain' && currentDistrict !== 'brain' && modalHidden) {
    showDistrict('brain');
  } else if (gateReason === 'sigil' && currentDistrict !== 'sigil' && modalHidden) {
    showDistrict('sigil');
  } else if (gateReason === 'ceremony' && currentDistrict !== 'ceremony' && modalHidden) {
    showDistrict('ceremony');
  }

  renderOnboardingStepper(getOnboardingStep(state));

  if (!agentDockAutoExpandedOnce && (gateReason === 'brain' || gateReason === 'sigil' || gateReason === 'ceremony')) {
    agentDockAutoExpandedOnce = true;
    const dock = el('agentSidebar');
    if (dock && dock.classList.contains('minimized')) {
      dock.classList.remove('minimized');
      dock.classList.add('dock-attention');
      if (typeof syncAgentPanelLayout === 'function') syncAgentPanelLayout(dock);
      document.body.classList.add('agent-panel-expanded');
      setTimeout(() => dock.classList.remove('dock-attention'), 5000);
    }
  }
}

function toggleAgentOnly(showAgentOnly) {
  const agentMode = !!showAgentOnly;
  const nodes = Array.from(document.querySelectorAll('.agent-only'));
  for (const node of nodes) {
    node.classList.toggle('is-hidden', !agentMode);
  }
}

function setReconnectMode({ houseReady = false, role = 'human' } = {}) {
  const hasHouse = !!houseReady;
  const roleMode = String(role || '').trim().toLowerCase();
  const isAgentMode = roleMode === 'agent' || roleMode === 'coop';
  const showCoopPanels = !hasHouse;

  const reconnectPanel = el('reconnectPanel');
  const step1Panel = el('step1Panel');
  const step2Panel = el('step2Panel');
  const stepDivider = el('stepDivider');

  if (reconnectPanel) reconnectPanel.classList.toggle('is-hidden', !hasHouse);
  if (step1Panel) step1Panel.classList.toggle('is-hidden', !showCoopPanels);
  if (step2Panel) step2Panel.classList.toggle('is-hidden', !showCoopPanels);
  if (stepDivider) stepDivider.classList.toggle('is-hidden', !showCoopPanels);
  toggleAgentOnly(isAgentMode);
}

async function updateUI(state) {
  lastState = state;
  currentExperiencePreference = normalizeExperiencePreferenceClient(state?.experiencePreference || currentExperiencePreference);
  applyExperiencePreferenceToUi();

  const houseId = state.houseId || walletHouseId || null;
  const signupMode = state.signup?.mode || (state.signup?.complete ? 'agent' : null);

  // Counts (optional on index)
  safeSetText('signupCount', String(state.stats?.signups ?? '—'));

  // Team code (fallback for older servers that still send pairCode)
  const teamCode = state.teamCode || state.pairCode || '…';
  safeSetText('teamCode', teamCode);
  const origin = window.location.origin;

  const houseNavLink = el('houseNavLink');
  if (houseNavLink) {
    if (houseId) {
      houseNavLink.classList.remove('is-hidden');
      houseNavLink.href = `/house?house=${encodeURIComponent(houseId)}`;
    } else {
      houseNavLink.classList.add('is-hidden');
      houseNavLink.href = '/house';
    }
  }
  updateTownHubLinks(houseId);
  syncTownhallRegistrationUI(state);
  syncTownhallGate(state);

  updatePathButtons();

  // Agent status
  const connected = !!state.agent?.connected;
  updateAgentStatus('agentDot', 'agentStatusText', connected, state.agent?.name || null);
  updateAgentStatus('agentDotHouse', 'agentStatusTextHouse', connected, state.agent?.name || null);

  setReconnectMode({ houseReady: !!houseId, role: 'coop' });
  toggleAgentOnly(true);
  updateLiteAgentStatus(state);
  initStep2Listener();
  initAdvancedLlmUi();
  initAgentLlmUi();
  syncAgentLlmUiFromPrimary();

  if (houseId) {
    if (walletRecovered) {
      safeSetText('reconnectTitle', tApp('townhall.reconnect.title'));
      safeSetText('reconnectIntro', tApp('townhall.reconnect.help'));
    } else {
      safeSetText('reconnectTitle', tApp('townhall.reconnect.title'));
      safeSetText('reconnectIntro', tApp('townhall.reconnect.help'));
    }
    safeSetText('houseSnippet', tApp('townhall.house_snippet.team', { teamCode }));
    const openHouseLink = el('openHouseLink');
    if (openHouseLink) openHouseLink.href = `/house?house=${encodeURIComponent(houseId)}`;
  }

  const openShareCardBtn = el('openShareCardBtn');
  const shareCardStatus = el('shareCardStatus');
  if (openShareCardBtn) {
    const sharePath = resolveSharePathFromState(state);
    openShareCardBtn.textContent = sharePath
      ? tApp('townhall.open_share_card')
      : tApp('townhall.open_share_card_preview');
    openShareCardBtn.disabled = !houseId;
  }
  if (shareCardStatus && !houseId) {
    shareCardStatus.textContent = '';
  }
  const matched = !!state.match?.matched;
  const matchState = el('matchState');
  if (matchState) {
    matchState.textContent = matched ? tApp('sigil.unlocked') : tApp('sigil.locked');
    matchState.className = `state ${matched ? 'good' : 'bad'}`;
  }

  safeSetText('matchDetail', matched
    ? tApp('sigil.matched_detail', { elementId: state.match?.elementId || '' })
    : tApp('sigil.match_detail')
  );

  const openBtn = el('openBtn');
  if (openBtn) openBtn.disabled = !matched || (!!state.signup?.complete && signupMode === 'agent');

  const complete = !!state.signup?.complete && signupMode === 'agent';
  const openReady = el('openReady');
  if (openReady) {
    openReady.style.display = complete ? 'inline-flex' : 'none';
    openReady.innerHTML = `${tApp('sigil.open_ready_prefix')} <a href="/create">${tApp('sigil.open_ready_ceremony')}</a> · <a href="/house">${tApp('sigil.open_ready_house')}</a>`;
  }

  const waiting = !!state.human?.openPressed && !complete;
  const waitingNode = el('openWaiting');
  if (waitingNode) waitingNode.style.display = waiting ? 'inline-flex' : 'none';

  // Sigils
  renderSigils(state);
  scheduleAgentDebugRefresh('state');
}

function scheduleAgentDebugRefresh(reason = 'event') {
  refreshAgentDebugPanels(reason).catch(() => { });
}

function startAgentDebugRefreshLoop() {
  if (agentDebugRefreshTimer) return;
  agentDebugRefreshTimer = setInterval(() => {
    if (document.hidden) return;
    refreshAgentDebugPanels('poll').catch(() => { });
  }, AGENT_DEBUG_REFRESH_MS);
}

function setLocalLiteLlm(config) {
  const provider = typeof config?.provider === 'string' ? config.provider.trim() : '';
  const model = typeof config?.model === 'string' ? config.model.trim() : '';
  const modelRef = typeof config?.modelRef === 'string' ? config.modelRef.trim() : '';
  const authMode = String(config?.authMode || '').trim() === 'oauth-json' ? 'oauth-json' : 'api-key';
  const reasoning = normalizeThinkingLevel(config?.reasoning);
  const useProxy = config?.useProxy !== false;
  const credential = typeof config?.credential === 'string' ? config.credential : '';
  const configured = !!(config?.configured && provider && model && credential);

  localLiteLlm = {
    loaded: config?.loaded === false ? false : true,
    configured,
    provider: provider || null,
    model: model || null,
    modelRef: modelRef || (provider && model ? `${provider}/${model}` : null),
    authMode,
    reasoning,
    useProxy,
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

function normalizeLiteSkillStatus(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'loading' || raw === 'ready' || raw === 'failed') return raw;
  return 'idle';
}

function normalizeLiteSkillState(raw) {
  const src = raw && typeof raw === 'object'
    ? (raw.data && typeof raw.data === 'object' ? raw.data : raw)
    : {};
  const status = normalizeLiteSkillStatus(src.status);
  const sourceUrl = typeof src.sourceUrl === 'string' && src.sourceUrl ? src.sourceUrl : null;
  const activeSkillPath = typeof src.activeSkillPath === 'string' && src.activeSkillPath ? src.activeSkillPath : null;
  const lastError = typeof src.lastError === 'string' && src.lastError ? src.lastError : null;
  const lastImportedAtMs = Number.isFinite(Number(src.lastImportedAtMs))
    ? Number(src.lastImportedAtMs)
    : null;
  return {
    status,
    sourceUrl,
    activeSkillPath,
    lastError,
    lastImportedAtMs
  };
}

function setLiteSkillState(next) {
  liteSkillState = normalizeLiteSkillState(next);
  return liteSkillState;
}

function getLiteSkillState() {
  return liteSkillState;
}

function isLiteSkillReady() {
  const skill = getLiteSkillState();
  return skill.status === 'ready' && !!skill.activeSkillPath;
}

function isTrustedDefaultSkill(skill = {}) {
  if (skill.status !== 'ready' || !skill.activeSkillPath) return false;
  const sourceUrlRaw = String(skill.sourceUrl || '').trim();
  if (!sourceUrlRaw) return false;
  try {
    const sourceUrl = new URL(sourceUrlRaw, window.location.origin);
    return sourceUrl.origin === window.location.origin && sourceUrl.pathname === '/skill.md';
  } catch {
    return false;
  }
}

function isLiteAgentActive(state) {
  if (!isAnyAgentConnected(state)) return false;
  if (!isVendorLite(state)) return true;
  if (!isLocalLiteLlmConfigured()) return false;
  return getLiteSkillState().status !== 'failed';
}

function liteState(state) {
  if (!state || typeof state !== 'object' || !state.lite || typeof state.lite !== 'object') return {};
  return state.lite;
}

const OPENAI_CODEX_OAUTH_PROVIDERS = new Set(['openai', 'openai-codex']);
const OPENAI_CODEX_OAUTH_MESSAGE_TYPE = 'agenttown:openai-codex-oauth-callback';

function getSupportedLlmModels(provider) {
  if (LlmCatalog && typeof LlmCatalog.getSupportedModels === 'function') {
    return LlmCatalog.getSupportedModels(provider);
  }
  return [];
}

function getOrderedLlmProviders() {
  if (LlmCatalog && typeof LlmCatalog.getProviderOrder === 'function') {
    return LlmCatalog.getProviderOrder(getCurrentExperiencePreference());
  }
  return ['openai'];
}

function getDefaultLlmProviderForExperience() {
  if (LlmCatalog && typeof LlmCatalog.getDefaultProvider === 'function') {
    return LlmCatalog.getDefaultProvider(getCurrentExperiencePreference());
  }
  return 'openai';
}

function getLlmProviderWarningText(provider, preference = getCurrentExperiencePreference()) {
  const normalizedProvider = LlmCatalog && typeof LlmCatalog.normalizeProvider === 'function'
    ? (LlmCatalog.normalizeProvider(provider) || String(provider || '').trim())
    : String(provider || '').trim();
  if (LlmCatalog && typeof LlmCatalog.hasTemplateModels === 'function' && LlmCatalog.hasTemplateModels(normalizedProvider)) {
    return tApp('brain.warning.provider_model_template', { provider: normalizedProvider });
  }
  const message = LlmCatalog && typeof LlmCatalog.getProviderWarning === 'function'
    ? LlmCatalog.getProviderWarning(provider, preference)
    : '';
  if (!message) return '';
  if (String(preference?.presetId || '') === 'cn-mainland') {
    return tApp('brain.warning.cn_openai');
  }
  return message;
}

function updateLlmProviderWarning() {
  const warningNode = el('llmProviderWarning');
  if (!warningNode) return;
  const provider = String(el('llmProviderSelect')?.value || '').trim();
  const message = getLlmProviderWarningText(provider, getCurrentExperiencePreference());
  warningNode.textContent = message || '';
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
  const fallbackProvider = getDefaultLlmProviderForExperience();
  const selected = String(preferredProvider || providerSelect?.value || fallbackProvider).trim() || fallbackProvider;
  if (!providerSelect) return selected;
  if (providerSelect.tagName === 'SELECT') {
    const providers = getOrderedLlmProviders();
    replaceSelectOptions(providerSelect, providers);
    providerSelect.value = providers.includes(selected) ? selected : fallbackProvider;
    updateLlmProviderWarning();
    return String(providerSelect.value || fallbackProvider).trim() || fallbackProvider;
  }
  providerSelect.value = selected;
  updateLlmProviderWarning();
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
    updateLlmProviderWarning();
    return String(modelSelect.value || fallbackModel).trim() || fallbackModel;
  }
  if (selected) {
    modelSelect.value = selected;
    updateLlmProviderWarning();
    return selected;
  }
  modelSelect.value = fallbackModel;
  updateLlmProviderWarning();
  return fallbackModel;
}

function applyLlmProviderModelSelection(provider, model) {
  const selectedProvider = applyLlmProviderSelection(provider);
  const selectedModel = applyLlmModelSelection(selectedProvider, model);
  return { provider: selectedProvider, model: selectedModel };
}

function updateLlmOauthLaunchUi() {
  const launchBtn = el('llmOauthLaunchBtn');
  const completeBtn = el('llmOauthCompleteBtn');
  if (!launchBtn) return;
  const fallbackProvider = getDefaultLlmProviderForExperience();
  const provider = String(el('llmProviderSelect')?.value || fallbackProvider).trim() || fallbackProvider;
  const mode = readLlmAuthMode();
  const supported = OPENAI_CODEX_OAUTH_PROVIDERS.has(provider.toLowerCase());
  launchBtn.style.display = mode === 'oauth-json' ? 'inline-flex' : 'none';
  launchBtn.disabled = !supported;
  launchBtn.title = supported
    ? tApp('brain.oauth.start_title')
    : tApp('brain.oauth.start_title_disabled');
  if (completeBtn) {
    completeBtn.style.display = mode === 'oauth-json' ? 'inline-flex' : 'none';
    completeBtn.disabled = !supported;
    completeBtn.title = supported
      ? tApp('brain.oauth.complete_title')
      : tApp('brain.oauth.complete_title_disabled');
  }
}

function stopOpenAiCodexOAuthPoll() {
  if (!openAiCodexOAuthPollTimer) return;
  clearInterval(openAiCodexOAuthPollTimer);
  openAiCodexOAuthPollTimer = null;
}

function bindOpenAiCodexOAuthMessageListener() {
  if (openAiCodexOAuthMessageListenerBound) return;
  openAiCodexOAuthMessageListenerBound = true;
  window.addEventListener('message', async (event) => {
    const payload = event?.data;
    if (!payload || typeof payload !== 'object') return;
    if (String(payload.type || '') !== OPENAI_CODEX_OAUTH_MESSAGE_TYPE) return;
    const incomingState = String(payload.state || '').trim();
    const incomingCode = String(payload.code || '').trim();
    const incomingError = String(payload.error || '').trim();
    if (!incomingState || incomingError) return;
    const activeState = String(openAiCodexOAuthAttempt?.state || '').trim();
    if (activeState && incomingState === activeState) {
      await completeOpenAiCodexOAuthFromUi({ callbackInput: '' });
      return;
    }
    if (incomingCode) {
      await completeOpenAiCodexOAuthFromUi({ callbackInput: `${incomingCode}#${incomingState}` });
    }
  });
}

async function exchangeOpenAiCodexOAuthAttempt({ attemptId, callbackInput = '' }) {
  const payload = {};
  if (attemptId) payload.attemptId = String(attemptId).trim();
  if (callbackInput) payload.callbackInput = callbackInput;
  const result = await api('/api/agent/lite/llm/oauth/openai-codex/exchange', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return result;
}

async function hydrateUiFromOpenAiCodexCredential(credential) {
  const access = String(credential?.access || '').trim();
  if (!access) throw new Error('TOKEN_RESPONSE_INVALID');
  const keyInput = el('llmKeyInput');
  const oauthInput = el('llmOauthProfileInput');
  const authModeSel = el('llmAuthModeSelect');
  if (authModeSel) {
    authModeSel.value = 'oauth-json';
    setLlmAuthModeUI('oauth-json');
  }
  if (keyInput) keyInput.value = access;
  if (oauthInput) {
    oauthInput.value = JSON.stringify({
      provider: 'openai-codex',
      access: access,
      refresh: String(credential?.refresh || ''),
      expires: Number(credential?.expires || 0),
      accountId: String(credential?.accountId || '')
    }, null, 2);
  }
  syncModelRefFromInputs();
  syncAgentLlmUiFromPrimary();
}

async function completeOpenAiCodexOAuthFromUi({ callbackInput = '' } = {}) {
  if (openAiCodexOAuthExchangeInFlight) return;
  openAiCodexOAuthExchangeInFlight = true;
  try {
    const provider = String(el('llmProviderSelect')?.value || getDefaultLlmProviderForExperience()).trim().toLowerCase();
    if (!OPENAI_CODEX_OAUTH_PROVIDERS.has(provider)) {
      throw new Error('OAUTH_ONLY_OPENAI');
    }
    const normalizedInput = String(callbackInput || '').trim();
    const attemptId = String(openAiCodexOAuthAttempt?.attemptId || '').trim();
    if (!attemptId && !normalizedInput) {
      throw new Error('START_OAUTH_FIRST');
    }
    const result = await exchangeOpenAiCodexOAuthAttempt({
      attemptId,
      callbackInput: normalizedInput
    });
    const returnedAttemptId = String(result?.attempt?.id || '').trim();
    const returnedState = String(result?.attempt?.state || '').trim();
    if (returnedAttemptId) {
      openAiCodexOAuthAttempt = {
        attemptId: returnedAttemptId,
        state: returnedState || String(openAiCodexOAuthAttempt?.state || '').trim(),
        startedAtMs: Date.now()
      };
    }
    const credential = result?.credential || result?.oauthProfile || null;
    if (!credential) throw new Error('TOKEN_RESPONSE_INVALID');
    await hydrateUiFromOpenAiCodexCredential(credential);
    stopOpenAiCodexOAuthPoll();
    setLiteLlmStatus(tApp('brain.status.oauth_complete'));
    setAgentLlmStatus(tApp('brain.status.oauth_complete'));
    openAiCodexOAuthAttempt = null;
  } catch (err) {
    const code = String(err?.message || '').trim();
    if (code === 'CODE_PENDING') {
      setLiteLlmStatus(tApp('brain.status.oauth_waiting'));
      setAgentLlmStatus(tApp('brain.status.oauth_waiting_short'));
      return;
    }
    const msg = code || 'OAUTH_EXCHANGE_FAILED';
    const localized = tApp('brain.error.oauth_exchange_failed', { message: msg });
    setLiteLlmStatus(localized);
    setAgentLlmStatus(localized);
    if (code !== 'CODE_PENDING') {
      appendAgentLog(localized);
    }
    throw err;
  } finally {
    openAiCodexOAuthExchangeInFlight = false;
  }
}

function startOpenAiCodexOAuthPoll() {
  stopOpenAiCodexOAuthPoll();
  openAiCodexOAuthPollTimer = setInterval(async () => {
    try {
      await completeOpenAiCodexOAuthFromUi({ callbackInput: '' });
    } catch (err) {
      const code = String(err?.message || '').trim();
      if (code === 'CODE_PENDING') return;
      stopOpenAiCodexOAuthPoll();
    }
  }, 1500);
}

async function launchLlmOauthInNewTab() {
  const provider = String(el('llmProviderSelect')?.value || getDefaultLlmProviderForExperience()).trim().toLowerCase();
  if (!OPENAI_CODEX_OAUTH_PROVIDERS.has(provider)) {
    setLiteLlmStatus(tApp('brain.error.oauth_only_openai'));
    return;
  }
  bindOpenAiCodexOAuthMessageListener();

  const started = await api('/api/agent/lite/llm/oauth/openai-codex/start', {
    method: 'POST',
    body: JSON.stringify({ provider, originator: 'portal-claw-lite' })
  });
  const authorizeUrl = String(started?.authorizeUrl || '').trim();
  const attemptId = String(started?.attemptId || '').trim();
  const state = String(started?.state || '').trim();
  if (!authorizeUrl || !attemptId || !state) {
    throw new Error('OAUTH_START_FAILED');
  }

  openAiCodexOAuthAttempt = { attemptId, state, startedAtMs: Date.now() };
  const popup = window.open(authorizeUrl, '_blank', 'noopener,noreferrer');
  if (!popup) {
    throw new Error('POPUP_BLOCKED');
  }
  setLiteLlmStatus(tApp('brain.status.oauth_started'));
  setAgentLlmStatus(tApp('brain.status.oauth_started_short'));
  startOpenAiCodexOAuthPoll();
}

// --- OpenRouter OAuth flow ---

function stopOpenRouterOAuthPoll() {
  if (!openRouterOAuthPollTimer) return;
  clearInterval(openRouterOAuthPollTimer);
  openRouterOAuthPollTimer = null;
}

// --- Ceremony embed completion listener ---
let ceremonyCompleteListenerBound = false;
function bindCeremonyCompleteListener() {
  if (ceremonyCompleteListenerBound) return;
  ceremonyCompleteListenerBound = true;
  window.addEventListener('message', async (event) => {
    const payload = event?.data;
    if (!payload || typeof payload !== 'object') return;
    if (String(payload.type || '') !== 'agenttown:ceremony-complete') return;
    const houseId = String(payload.houseId || '').trim();
    if (!houseId) return;
    try {
      const state = await api('/api/state');
      updateUI(state);
    } catch (err) {
      console.warn('ceremony complete state refresh failed', err);
    }
    hideDistrictImmediate();
  });
}

function bindOpenRouterOAuthMessageListener() {
  if (openRouterOAuthMessageListenerBound) return;
  openRouterOAuthMessageListenerBound = true;
  window.addEventListener('message', async (event) => {
    const payload = event?.data;
    if (!payload || typeof payload !== 'object') return;
    if (String(payload.type || '') !== OPENROUTER_OAUTH_MESSAGE_TYPE) return;
    const incomingState = String(payload.state || '').trim();
    const incomingError = String(payload.error || '').trim();
    if (!incomingState || incomingError) return;
    const activeState = String(openRouterOAuthAttempt?.state || '').trim();
    if (activeState && incomingState === activeState) {
      await completeOpenRouterOAuthFromUi();
    }
  });
}

async function exchangeOpenRouterOAuthAttempt({ attemptId }) {
  const result = await api('/api/agent/lite/llm/oauth/openrouter/exchange', {
    method: 'POST',
    body: JSON.stringify({ attemptId: String(attemptId).trim() })
  });
  return result;
}

async function autoConfigureBrainFromOpenRouter(credential) {
  const apiKey = String(credential?.apiKey || '').trim();
  if (!apiKey) throw new Error('TOKEN_RESPONSE_INVALID');

  const defaultModel = LlmCatalog && typeof LlmCatalog.getDefaultFreeOpenRouterModel === 'function'
    ? LlmCatalog.getDefaultFreeOpenRouterModel()
    : 'openrouter/hunter-alpha';

  const config = {
    provider: 'openrouter',
    model: defaultModel,
    credential: apiKey,
    authMode: 'api-key',
    reasoning: '',
    useProxy: true,
    modelRef: `openrouter/${defaultModel}`
  };

  const lib = await loadLiteLlmLibrary();
  await lib.saveLlmConfig({
    provider: config.provider,
    model: config.model,
    apiKey: config.credential,
    authMode: config.authMode,
    reasoning: config.reasoning,
    useProxy: config.useProxy
  });

  const localCfg = setLocalLiteLlm({
    loaded: true,
    configured: true,
    provider: config.provider,
    model: config.model,
    modelRef: config.modelRef,
    credential: config.credential,
    authMode: config.authMode,
    reasoning: config.reasoning,
    useProxy: config.useProxy,
    apiKeySet: true
  });
  clearLiteSkillLoopPause();
  await applyGatewayLlmConfig(localCfg);

  if (runtimeBridge && isVendorLite(lastState)) {
    try {
      await ensureVendorRuntimeBridge(lastState);
      await runtimeBridge.setLlmConfig({
        provider: config.provider,
        model: config.model,
        apiKey: config.credential
      });
    } catch (err) {
      console.warn('runtime bridge llm sync failed after OpenRouter OAuth', err);
    }
  }

  await new Promise(r => setTimeout(r, 300));
  if (lastState) updateUI(lastState);
}

async function completeOpenRouterOAuthFromUi() {
  if (openRouterOAuthExchangeInFlight) return;
  openRouterOAuthExchangeInFlight = true;
  const statusEl = el('openRouterOAuthStatus');
  try {
    const attemptId = String(openRouterOAuthAttempt?.attemptId || '').trim();
    if (!attemptId) throw new Error('START_OAUTH_FIRST');

    const result = await exchangeOpenRouterOAuthAttempt({ attemptId });
    const credential = result?.credential || null;
    if (!credential) throw new Error('TOKEN_RESPONSE_INVALID');

    stopOpenRouterOAuthPoll();
    await autoConfigureBrainFromOpenRouter(credential);

    if (statusEl) statusEl.textContent = tApp('brain.tier.free.status.complete');
    const continueBtn = el('brainContinueBtn');
    if (continueBtn) continueBtn.disabled = false;
    openRouterOAuthAttempt = null;
  } catch (err) {
    const code = String(err?.message || '').trim();
    if (code === 'CODE_PENDING') {
      if (statusEl) statusEl.textContent = tApp('brain.tier.free.status.started');
      return;
    }
    if (statusEl) statusEl.textContent = tApp('brain.tier.free.status.failed', { message: code || 'OAUTH_EXCHANGE_FAILED' });
    throw err;
  } finally {
    openRouterOAuthExchangeInFlight = false;
  }
}

function startOpenRouterOAuthPoll() {
  stopOpenRouterOAuthPoll();
  openRouterOAuthPollTimer = setInterval(async () => {
    try {
      await completeOpenRouterOAuthFromUi();
    } catch (err) {
      const code = String(err?.message || '').trim();
      if (code === 'CODE_PENDING') return;
      stopOpenRouterOAuthPoll();
    }
  }, 1500);
}

async function launchOpenRouterOAuthInNewTab() {
  bindOpenRouterOAuthMessageListener();
  const statusEl = el('openRouterOAuthStatus');

  const started = await api('/api/agent/lite/llm/oauth/openrouter/start', {
    method: 'POST',
    body: JSON.stringify({})
  });
  const authorizeUrl = String(started?.authorizeUrl || '').trim();
  const attemptId = String(started?.attemptId || '').trim();
  const state = String(started?.state || '').trim();
  if (!authorizeUrl || !attemptId || !state) {
    throw new Error('OAUTH_START_FAILED');
  }

  openRouterOAuthAttempt = { attemptId, state, startedAtMs: Date.now() };
  const popup = window.open(authorizeUrl, '_blank', 'noopener,noreferrer');
  if (!popup) {
    throw new Error('POPUP_BLOCKED');
  }
  if (statusEl) statusEl.textContent = tApp('brain.tier.free.status.started');
  startOpenRouterOAuthPoll();
}

function bindBrainTierControls() {
  const oauthBtn = el('openRouterOAuthBtn');
  if (oauthBtn) {
    oauthBtn.onclick = async () => {
      oauthBtn.disabled = true;
      const statusEl = el('openRouterOAuthStatus');
      try {
        await launchOpenRouterOAuthInNewTab();
      } catch (err) {
        const code = String(err?.message || '').trim();
        const msg = code === 'POPUP_BLOCKED'
          ? tApp('brain.error.popup_blocked')
          : tApp('brain.tier.free.status.failed', { message: code || 'UNKNOWN' });
        if (statusEl) statusEl.textContent = msg;
      } finally {
        oauthBtn.disabled = false;
      }
    };
  }

  const ollamaBtn = el('brainOllamaBtn');
  if (ollamaBtn) {
    ollamaBtn.onclick = () => {
      const details = el('brainTierApiKeyDetails');
      if (details) details.open = true;
      const providerSel = el('llmProviderSelect');
      if (providerSel) {
        const selected = applyLlmProviderModelSelection('ollama', getDefaultLlmModelForProvider('ollama'));
        providerSel.value = selected.provider;
        const modelInput = el('llmModelIdInput');
        if (modelInput) modelInput.value = selected.model;
        syncModelRefFromInputs();
      }
    };
  }

  // Auto-open tier 2 if config already exists (for test compatibility)
  const localCfg = getLocalLiteLlm();
  if (localCfg?.configured) {
    const details = el('brainTierApiKeyDetails');
    if (details) details.open = true;
  }
}

function getDefaultLlmModelForProvider(provider) {
  if (LlmCatalog && typeof LlmCatalog.getDefaultModel === 'function') {
    return LlmCatalog.getDefaultModel(provider);
  }
  return 'gpt-4o-mini';
}

function defaultProviderApi(provider) {
  if (LlmCatalog && typeof LlmCatalog.defaultProviderApi === 'function') {
    return LlmCatalog.defaultProviderApi(provider);
  }
  const normalized = String(provider || '').trim();
  return normalized === 'openai' || normalized === 'ollama' ? 'openai-completions' : '';
}

function defaultProviderBaseUrl(provider) {
  if (LlmCatalog && typeof LlmCatalog.defaultProviderBaseUrl === 'function') {
    return LlmCatalog.defaultProviderBaseUrl(provider, window.location.origin);
  }
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
      ? tApp('brain.oauth.override_placeholder')
      : tApp('brain.api_key.placeholder.full');
  }
  if (oauthHint) {
    oauthHint.textContent = authMode === 'oauth-json'
      ? tApp('brain.oauth.hint')
      : '';
  }
  updateLlmOauthLaunchUi();
}

function resolveLlmModelRefFromInputs(provider, model) {
  const fallbackProvider = getDefaultLlmProviderForExperience();
  const providerInput = String(provider || fallbackProvider).trim();
  const normalizedProvider = LlmCatalog && typeof LlmCatalog.normalizeProvider === 'function'
    ? (LlmCatalog.normalizeProvider(providerInput) || providerInput || fallbackProvider)
    : (providerInput || fallbackProvider);
  const modelTrim = String(model || '').trim();

  if (normalizedProvider === 'custom') {
    return parseModelRefFromText(modelTrim || 'gpt-4o-mini', fallbackProvider, 'gpt-4o-mini');
  }

  const resolvedModel = modelTrim || getDefaultLlmModelForProvider(normalizedProvider);
  return {
    provider: normalizedProvider,
    modelId: resolvedModel,
    modelRef: `${normalizedProvider}/${resolvedModel}`
  };
}

function parseModelRefFromText(text, fallbackProvider = getDefaultLlmProviderForExperience(), fallbackModelId = 'gpt-4o-mini') {
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
      : typeof value.accessToken === 'string' ? value.accessToken.trim()
        : typeof value.id_token === 'string' ? value.id_token.trim()
          : typeof value.idToken === 'string' ? value.idToken.trim() : '';
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
    return tApp('brain.error.unsupported_id_token');
  }
  return '';
}

function mapLlmCredentialError(code) {
  const normalized = String(code || '').trim();
  if (normalized === 'MISSING_OAUTH_PROFILE_JSON') return tApp('brain.error.missing_oauth_profile');
  if (normalized === 'INVALID_OAUTH_PROFILE_JSON') return tApp('brain.error.invalid_oauth_profile');
  if (normalized === 'NO_OAUTH_ACCESS_TOKEN_FOUND') return tApp('brain.error.no_oauth_access_token');
  return normalized;
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

  const fallbackProvider = getDefaultLlmProviderForExperience();
  const provider = String(providerSel?.value || fallbackProvider).trim() || fallbackProvider;
  const modelText = String(modelInput?.value || '').trim();
  const mode = readLlmAuthMode();

  const parsedModel = resolveLlmModelRefFromInputs(provider, modelText);
  const manualRaw = String(keyInput?.value || '').trim();
  const manualParsed = extractOAuthAccessToken(manualRaw, provider);
  const manualCredential = manualParsed.ok
    ? String(manualParsed.token || '').trim()
    : manualRaw;
  let credential = manualCredential;
  let oauthError = '';

  if (mode === 'oauth-json') {
    const oauthText = String(oauthInput?.value || '').trim();
    const token = extractOAuthAccessToken(oauthText, provider);
    oauthError = oauthText && !token.ok ? String(token.error || 'INVALID_OAUTH_PROFILE_JSON') : '';
    const parsedCredential = token.ok ? String(token.token || '').trim() : '';
    credential = manualCredential || parsedCredential;
  } else if (!credential) {
    const oauthText = String(oauthInput?.value || '').trim();
    if (oauthText) {
      const token = extractOAuthAccessToken(oauthText, provider);
      if (token.ok) {
        credential = String(token.token || '').trim();
      }
    }
  }

  if (!credential) {
    const msg = mode === 'oauth-json'
      ? (mapLlmCredentialError(oauthError) || tApp('brain.error.no_oauth_access_token'))
      : tApp('brain.error.missing_api_key_with_model', {
        credentialLabel: provider === 'openai-codex'
          ? tApp('brain.credential.api_key_or_oauth')
          : tApp('brain.credential.api_key'),
        provider: parsedModel.provider,
        model: parsedModel.modelId
      });
    throw new Error(msg);
  }

  const tokenValidationError = validateOAuthCredentialForProvider({
    provider: parsedModel.provider,
    credential,
  });
  if (tokenValidationError) {
    throw new Error(tokenValidationError);
  }

  return {
    provider: parsedModel.provider,
    model: parsedModel.modelId,
    modelRef: parsedModel.modelRef,
    authMode: mode,
    reasoning: normalizeThinkingLevel(el('llmThinkingInput')?.value),
    useProxy: el('llmUseProxyInput') ? el('llmUseProxyInput').checked !== false : true,
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
  const useProxy = el('llmUseProxyInput')
    ? el('llmUseProxyInput').checked !== false
    : config?.useProxy !== false;
  const reasoning = normalizeThinkingLevel(el('llmThinkingInput')?.value || config?.reasoning);
  return {
    type: 'gateway.command.setLlmConfig',
    apiKey: credential,
    api: apiOverride || defaultProviderApi(provider),
    provider,
    modelRef,
    modelId: model,
    baseUrl: baseUrlOverride || defaultProviderBaseUrl(provider),
    reasoning,
    useProxy
  };
}

async function applyGatewayLlmConfig(config) {
  const gatewayApi = await loadLiteGateway();
  if (!gatewayApi || typeof gatewayApi.send !== 'function') return;
  gatewayApi.send(buildGatewayLlmPayload(config));
}

async function refreshLiteSkillState({ force = false } = {}) {
  const now = Date.now();
  if (!force && now - liteSkillLastSyncAtMs < 1200) return getLiteSkillState();
  if (liteSkillSyncPromise) return liteSkillSyncPromise;

  liteSkillSyncPromise = (async () => {
    const gatewayApi = await initGateway();
    if (!gatewayApi || typeof gatewayApi.skillState !== 'function') {
      return getLiteSkillState();
    }
    const snapshot = await gatewayApi.skillState();
    liteSkillLastSyncAtMs = Date.now();
    return setLiteSkillState(snapshot);
  })();

  try {
    return await liteSkillSyncPromise;
  } catch {
    return getLiteSkillState();
  } finally {
    liteSkillSyncPromise = null;
  }
}

async function ensureDefaultLiteSkillImported(state) {
  if (!isVendorLite(state)) return;
  if (!isAnyAgentConnected(state)) return;
  const teamCode = String(state?.teamCode || '').trim();
  if (!teamCode) return;

  const skill = await refreshLiteSkillState({ force: false });
  if (isTrustedDefaultSkill(skill)) {
    liteSkillAutoImportTeamCode = teamCode;
    return;
  }
  if (skill.status === 'loading') return;
  if (liteSkillAutoImportTeamCode === teamCode) return;
  if (liteSkillAutoImportPromise) return;

  liteSkillAutoImportTeamCode = teamCode;
  liteSkillAutoImportPromise = (async () => {
    const gatewayApi = await initGateway();
    if (!gatewayApi || typeof gatewayApi.visitExperience !== 'function') return;
    const visit = await gatewayApi.visitExperience({ url: '/skill.md' });
    if (visit?.ok !== true) {
      const msg = String(visit?.error?.message || visit?.error?.code || 'VISIT_FAILED');
      appendAgentLog(`Default skill import failed: ${msg}`);
      await refreshLiteSkillState({ force: true });
      return;
    }
    appendAgentLog('Default skill imported: /skill.md');
    await refreshLiteSkillState({ force: true });
  })()
    .catch((err) => {
      appendAgentLog(`Default skill import failed: ${err?.message || 'VISIT_FAILED'}`);
    })
    .finally(() => {
      liteSkillAutoImportPromise = null;
    });

  return liteSkillAutoImportPromise;
}

function clearLiteSkillLoopTimer() {
  if (!liteSkillLoopTimer) return;
  clearTimeout(liteSkillLoopTimer);
  liteSkillLoopTimer = null;
}

function clearLiteSkillLoopPause() {
  liteSkillLoopPauseReason = '';
  liteSkillLoopLastErrorFingerprint = '';
  liteSkillLoopLastErrorAtMs = 0;
}

function pauseLiteSkillLoop(reason, message) {
  const nextReason = String(reason || '').trim();
  if (!nextReason) return;
  liteSkillLoopPauseReason = nextReason;
  clearLiteSkillLoopTimer();
  appendAgentLog(`Home skill loop paused: ${String(message || 'update brain config to continue')}`);
}

function appendHomeSkillLoopError(reason, message) {
  const stamp = Date.now();
  const normalizedReason = String(reason || '').trim();
  const normalizedMessage = String(message || '').trim() || 'EXPERIENCE_RUN_FAILED';
  const fingerprint = `${normalizedReason}|${normalizedMessage}`;
  if (fingerprint === liteSkillLoopLastErrorFingerprint && stamp - liteSkillLoopLastErrorAtMs < 20_000) {
    return;
  }
  liteSkillLoopLastErrorFingerprint = fingerprint;
  liteSkillLoopLastErrorAtMs = stamp;
  appendAgentLog(`Home skill step failed (${normalizedReason || 'state'}): ${normalizedMessage}`);
}

function shouldRunHomeSkillLoop(state) {
  if (window.location.pathname !== '/') return false;
  if (!isVendorLite(state)) return false;
  if (!isLocalLiteLlmConfigured()) return false;
  if (!isAnyAgentConnected(state)) return false;
  if (liteSkillLoopPauseReason) return false;
  if (state?.signup?.complete && state?.signup?.mode === 'agent') return false;
  return true;
}

function homeSkillPrompt(state = {}) {
  const step = String(state?.experience?.step || '').trim();
  const nextAgentAction = String(state?.experience?.nextAgentAction || '').trim();
  const prompt = [
    'Read workspace/SKILL.md and execute exactly the next required safe step for this Agent Town home-page co-op flow.',
    'Primary goal: complete signup by mirroring human sigil selection and pressing Open after the human.',
    'Use runtime session context values for origin/teamCode/houseId exactly as provided.',
    'Start from the current experience state and perform at most one safe step per turn.',
    'If experience.step is "mirror_sigil", mirror human.selected via /api/agent/select.',
    'If experience.step is "press_open", call /api/agent/open/press exactly once.',
    'Use tools only; avoid asking the human for teamCode/houseId when already provided in runtime context.',
    'If waiting for the human, stop after one safe check/action.'
  ];
  if (step) prompt.push(`Runtime hint: experience.step=${step}`);
  if (nextAgentAction) prompt.push(`Runtime hint: experience.nextAgentAction=${nextAgentAction}`);
  return prompt.join('\n');
}

function requestHomeSkillStep(reason = 'state') {
  if (!shouldRunHomeSkillLoop(lastState)) {
    clearLiteSkillLoopTimer();
    return;
  }
  const urgent = reason === 'human-action' || reason === 'team-change';
  if (liteSkillLoopTimer && !urgent) return;
  if (liteSkillLoopTimer && urgent) {
    clearLiteSkillLoopTimer();
  }
  const minGapMs = 900;
  const elapsed = Date.now() - liteSkillLoopLastRunAtMs;
  const waitMs = urgent
    ? Math.max(0, minGapMs - elapsed)
    : Math.max(0, minGapMs - elapsed, liteSkillLoopBackoffMs);
  liteSkillLoopTimer = setTimeout(() => {
    liteSkillLoopTimer = null;
    runHomeSkillStep(reason).catch(() => { });
  }, waitMs);
}

async function runHomeSkillStep(reason = 'state') {
  if (liteSkillLoopInFlight) return;
  if (!shouldRunHomeSkillLoop(lastState)) return;

  liteSkillLoopInFlight = true;
  liteSkillLoopLastRunAtMs = Date.now();
  try {
    const gatewayApi = await initGateway();
    if (!gatewayApi || typeof gatewayApi.experienceRun !== 'function') {
      throw new Error('GATEWAY_NOT_READY');
    }

    await ensureDefaultLiteSkillImported(lastState);
    const skill = await refreshLiteSkillState({ force: false });
    if (!isTrustedDefaultSkill(skill)) {
      liteSkillLoopBackoffMs = Math.min(5000, Math.max(1200, liteSkillLoopBackoffMs + 300));
      return;
    }

    const run = await gatewayApi.experienceRun({
      prompt: homeSkillPrompt(lastState),
      timeoutMs: 60_000,
      recordToTranscript: false,
      emitChat: false,
      runtimeContext: buildExperienceRuntimeContext(lastState),
      runtimeState: lastState
    });
    if (run?.ok === false) {
      const msg = String(run?.error?.message || run?.error?.code || 'EXPERIENCE_RUN_FAILED');
      throw new Error(msg);
    }
    liteSkillLoopBackoffMs = 1000;
    liteSkillLoopLastErrorFingerprint = '';
    liteSkillLoopLastErrorAtMs = 0;
  } catch (err) {
    const msg = String(err?.message || 'EXPERIENCE_RUN_FAILED');
    if (/could not parse your authentication token/i.test(msg) || /failed to extract accountid from token/i.test(msg)) {
      pauseLiteSkillLoop('llm-auth', tApp('brain.status.token_rejected'));
      setLiteLlmStatus(tApp('brain.status.token_rejected'));
      return;
    }
    appendHomeSkillLoopError(reason, msg);
    liteSkillLoopBackoffMs = Math.min(5000, Math.max(1500, liteSkillLoopBackoffMs + 700));
  } finally {
    liteSkillLoopInFlight = false;
    if (shouldRunHomeSkillLoop(lastState)) {
      requestHomeSkillStep('loop');
    } else {
      clearLiteSkillLoopTimer();
    }
  }
}

function updateLiteAgentStatus(state) {
  const dot = el('liteAgentDot');
  const text = el('liteAgentStatus');
  if (!dot || !text) return;
  const lite = liteState(state);
  const failed = typeof lite.lastError === 'string' && lite.lastError;
  const liteConnected = isLiteConnected(state);
  const liteActive = isLiteAgentActive(state);
  dot.className = `dot ${liteActive ? 'good' : ''}`;
  if (failed) {
    text.textContent = tApp('agent.runtime.error', { message: lite.lastError });
  } else if (isVendorLite(state) && isAnyAgentConnected(state) && !isLocalLiteLlmConfigured()) {
    text.textContent = tApp('agent.runtime.connected_configure_brain');
  } else if (isVendorLite(state) && isAnyAgentConnected(state)) {
    text.textContent = liteActive
      ? tApp('agent.runtime.connected_openclaw')
      : tApp('agent.runtime.connected_openclaw_import_failed');
  } else if (isAnyAgentConnected(state) && state?.agent?.source === 'external') {
    text.textContent = tApp('agent.runtime.external_connected');
  } else if (liteConnected && isVendorLite(state) && !liteActive) {
    text.textContent = tApp('agent.runtime.connected_openclaw_import_failed');
  } else {
    text.textContent = liteConnected ? tApp('agent.runtime.connected_openclaw') : tApp('agent.runtime.offline');
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
  const experienceStep = typeof state?.experience?.step === 'string'
    ? state.experience.step.trim()
    : '';
  const hasExperienceProgress = !!experienceStep
    && experienceStep !== 'wait_connect'
    && experienceStep !== 'connect_agent';
  const hasFlowProgress = !!(
    hasExperienceProgress ||
    state?.human?.selected ||
    state?.agent?.selected ||
    state?.match?.matched ||
    state?.human?.openPressed ||
    state?.agent?.openPressed ||
    state?.signup?.complete
  );
  if (!vendor) {
    townPanelUnlocked = false;
  } else if (hasFlowProgress) {
    townPanelUnlocked = true;
  } else if (!isLocalLiteLlmConfigured() && localLiteLlm.loaded) {
    townPanelUnlocked = false;
  } else if (isAnyAgentConnected(state) || !!state?.signup?.complete) {
    townPanelUnlocked = true;
  }
  const vendorNeedsSetup = vendor && !townPanelUnlocked;
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
  syncAgentPanelLayout(sidebar);
}

async function checkWalletStep() {
  if (pendingWalletCheck) return;
  const step1 = el('step1');
  const step2 = el('step2');
  const walletStatus = el('walletStatus');
  const walletBtn = el('hatchWalletCheckBtn');

  pendingWalletCheck = true;
  if (walletBtn) walletBtn.disabled = true;
  if (walletStatus) walletStatus.textContent = tApp('hatch.status.wallet_checking');

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
      statusOverride = tApp('hatch.status.house_found_redirect');
      if (walletStatus) walletStatus.textContent = statusOverride;
      window.location.href = `/house?house=${encodeURIComponent(lookup.houseId)}`;
      return;
    }

    // No house found - Proceed to Step 2 (LLM Config)
    if (walletStatus) {
      walletStatus.textContent = tApp('hatch.status.wallet_verified_brain');
      walletStatus.style.color = 'var(--good)';
    }
    unlockStep2();

    statusOverride = tApp('hatch.status.no_house_continue');
    setHatchStatus(statusOverride);

  } catch (e) {
    const raw = String(e?.message || '').trim();
    const hasConnectedWallet = !!walletAddr;
    const msg = raw === 'NO_SOLANA_WALLET'
      ? tApp('wallet.error.no_solana_wallet_short')
      : raw === 'NO_SOLANA_SIGN'
        ? tApp('wallet.error.no_solana_sign_short')
        : raw === 'USER_REJECTED'
          ? tApp('wallet.error.user_rejected')
          : raw.includes('USER_REJECTED')
            ? tApp('wallet.error.user_rejected')
            : hasConnectedWallet
              ? tApp('hatch.status.wallet_lookup_skipped')
              : tApp('hatch.status.wallet_check_failed');
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
    statusOverride = tApp('hatch.status.configure_brain_before_connect');
    setHatchStatus(statusOverride);
    return;
  }
  if (isVendorLite(lastState)) {
    const booted = await bootstrapVendorRuntime();
    if (!booted) {
      if (!String(statusOverride || '').startsWith(tApp('hatch.status.runtime_failed_prefix'))) {
        statusOverride = tApp('hatch.status.runtime_starting');
      }
      setHatchStatus(statusOverride);
      applyVisibility(lastState);
      return;
    }
  }
  pendingLiteConnect = true;
  setHatchStatus(tApp('hatch.status.connecting_openclaw'));
  try {
    await api('/api/agent/lite/connect', {
      method: 'POST',
      body: JSON.stringify({})
    });
    statusOverride = '';
  } catch (e) {
    statusOverride = formatHatchAgentConnectFailedStatus(e.message);
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
      const runtimeWorkerRaw = manifest?.entrypoints?.runtimeWorker;
      const runtimeWorkerPath =
        typeof runtimeWorkerRaw === 'string' &&
          runtimeWorkerRaw.startsWith('/openclaw-lite/') &&
          !runtimeWorkerRaw.startsWith('node:')
          ? runtimeWorkerRaw
          : '/openclaw-lite/runtime-worker.js';
      fetch(runtimeWorkerPath, {
        credentials: 'include',
        cache: 'no-store'
      }).catch(() => null);
      if (lastState) {
        await ensureVendorRuntimeBridge(lastState);
      }
      runtimeBootstrapDone = true;
      setLiteLlmStatus(tApp('brain.status.runtime_ready'));
      return true;
    } catch (e) {
      runtimeBootstrapDone = false;
      const msg = e?.message || 'RUNTIME_BOOT_FAILED';
      statusOverride = formatHatchRuntimeFailedStatus(msg);
      setHatchStatus(statusOverride);
      setLiteLlmStatus(tApp('brain.status.runtime_failed', { message: msg }));
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
  const initialized = applyLlmProviderModelSelection(providerSel.value || getDefaultLlmProviderForExperience(), modelInput.value || '');
  providerSel.value = initialized.provider;
  modelInput.value = initialized.model;

  const updateRef = () => {
    syncModelRefFromInputs();
  };

  providerSel.addEventListener('change', () => {
    const selectedProvider = applyLlmProviderSelection(providerSel.value || getDefaultLlmProviderForExperience());
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
    oauthLaunchBtn.addEventListener('click', async () => {
      try {
        await launchLlmOauthInNewTab();
      } catch (err) {
        const msg = String(err?.message || 'OAUTH_START_FAILED');
        if (msg === 'POPUP_BLOCKED') {
          setLiteLlmStatus(tApp('brain.error.popup_blocked'));
          return;
        }
        setLiteLlmStatus(tApp('brain.error.oauth_start_failed', { message: msg }));
      }
    });
  }
  const oauthCompleteBtn = el('llmOauthCompleteBtn');
  if (oauthCompleteBtn && !oauthCompleteBtn.dataset.listening) {
    oauthCompleteBtn.dataset.listening = 'true';
    oauthCompleteBtn.addEventListener('click', async () => {
      const callbackInput = String(el('llmOauthProfileInput')?.value || '').trim();
      try {
        await completeOpenAiCodexOAuthFromUi({ callbackInput });
      } catch (err) {
        const msg = String(err?.message || 'OAUTH_EXCHANGE_FAILED');
        if (msg === 'CODE_PENDING') {
          setLiteLlmStatus(tApp('brain.status.oauth_waiting'));
        }
      }
    });
  }
  setLlmAuthModeUI(readLlmAuthMode());
  syncModelRefFromInputs();
}

function syncModelRefFromInputs() {
  const providerSel = el('llmProviderSelect');
  const modelInput = el('llmModelIdInput');
  const refInput = el('llmModelRefInput');
  if (!providerSel || !modelInput || !refInput) return;
  const p = String(providerSel.value || getDefaultLlmProviderForExperience()).trim();
  const m = String(modelInput.value || '').trim();
  const resolved = resolveLlmModelRefFromInputs(p, m);
  refInput.value = m ? resolved.modelRef : '';
}

function copySelectOptions(fromSelect, toSelect) {
  if (!fromSelect || !toSelect) return;
  if (fromSelect.tagName !== 'SELECT' || toSelect.tagName !== 'SELECT') return;
  const current = String(toSelect.value || '').trim();
  toSelect.innerHTML = '';
  for (const opt of Array.from(fromSelect.options || [])) {
    const next = document.createElement('option');
    next.value = String(opt.value || '');
    next.textContent = String(opt.textContent || opt.value || '');
    toSelect.appendChild(next);
  }
  if (current) {
    ensureSelectOption(toSelect, current, current);
    toSelect.value = current;
  }
}

function setAgentLlmStatus(text) {
  const node = el('agentLlmLine');
  if (!node) return;
  node.textContent = text || '';
}

function readAgentLlmAuthMode() {
  const raw = String(el('agentLlmAuthModeSelect')?.value || '').trim();
  return raw === 'oauth-json' ? 'oauth-json' : 'api-key';
}

function updateAgentLlmOauthLaunchUi() {
  const launchBtn = el('agentLlmOauthLaunchBtn');
  const completeBtn = el('agentLlmOauthCompleteBtn');
  if (!launchBtn) return;
  const fallbackProvider = getDefaultLlmProviderForExperience();
  const provider = String(el('agentLlmProviderSelect')?.value || fallbackProvider).trim() || fallbackProvider;
  const mode = readAgentLlmAuthMode();
  const supported = OPENAI_CODEX_OAUTH_PROVIDERS.has(provider.toLowerCase());
  launchBtn.style.display = mode === 'oauth-json' ? 'inline-flex' : 'none';
  launchBtn.disabled = !supported;
  launchBtn.title = supported
    ? tApp('brain.oauth.start_title')
    : tApp('brain.oauth.start_title_disabled');
  if (completeBtn) {
    completeBtn.style.display = mode === 'oauth-json' ? 'inline-flex' : 'none';
    completeBtn.disabled = !supported;
    completeBtn.title = supported
      ? tApp('brain.oauth.complete_title')
      : tApp('brain.oauth.complete_title_disabled');
  }
}

function setAgentLlmAuthModeUI(mode) {
  const authMode = mode === 'oauth-json' ? 'oauth-json' : 'api-key';
  const authModeSelect = el('agentLlmAuthModeSelect');
  const oauthInput = el('agentLlmOauthProfileInput');
  const keyInput = el('agentLlmKeyInput');
  if (authModeSelect) authModeSelect.value = authMode;
  if (oauthInput) oauthInput.style.display = authMode === 'oauth-json' ? 'block' : 'none';
  if (keyInput) {
    keyInput.placeholder = authMode === 'oauth-json'
      ? tApp('brain.oauth.override_placeholder')
      : tApp('brain.api_key.placeholder.full');
  }
  updateAgentLlmOauthLaunchUi();
}

function syncAgentLlmUiFromPrimary() {
  const providerSel = el('llmProviderSelect');
  const modelInput = el('llmModelIdInput');
  const authModeSel = el('llmAuthModeSelect');
  const thinkingInput = el('llmThinkingInput');
  const keyInput = el('llmKeyInput');
  const oauthInput = el('llmOauthProfileInput');
  const status = el('llmLine');

  const agentProviderSel = el('agentLlmProviderSelect');
  const agentModelInput = el('agentLlmModelIdInput');
  const agentAuthModeSel = el('agentLlmAuthModeSelect');
  const agentThinkingInput = el('agentLlmThinkingInput');
  const agentKeyInput = el('agentLlmKeyInput');
  const agentOauthInput = el('agentLlmOauthProfileInput');

  copySelectOptions(providerSel, agentProviderSel);
  copySelectOptions(modelInput, agentModelInput);
  copySelectOptions(authModeSel, agentAuthModeSel);
  copySelectOptions(thinkingInput, agentThinkingInput);

  if (agentProviderSel && providerSel) {
    ensureSelectOption(agentProviderSel, providerSel.value, providerSel.value);
    agentProviderSel.value = providerSel.value;
  }
  if (agentModelInput && modelInput) {
    ensureSelectOption(agentModelInput, modelInput.value, modelInput.value);
    agentModelInput.value = modelInput.value;
  }
  if (agentAuthModeSel && authModeSel) {
    ensureSelectOption(agentAuthModeSel, authModeSel.value, authModeSel.value);
    agentAuthModeSel.value = authModeSel.value;
  }
  if (agentThinkingInput && thinkingInput) {
    ensureSelectOption(agentThinkingInput, thinkingInput.value, thinkingInput.value);
    agentThinkingInput.value = thinkingInput.value;
  }
  if (agentKeyInput && keyInput) agentKeyInput.value = keyInput.value || '';
  if (agentOauthInput && oauthInput) agentOauthInput.value = oauthInput.value || '';
  setAgentLlmAuthModeUI(readAgentLlmAuthMode());
  setAgentLlmStatus(status?.textContent || el('liteLlmStatus')?.textContent || '');
}

function syncPrimaryLlmUiFromAgent() {
  const providerSel = el('llmProviderSelect');
  const modelInput = el('llmModelIdInput');
  const authModeSel = el('llmAuthModeSelect');
  const thinkingInput = el('llmThinkingInput');
  const keyInput = el('llmKeyInput');
  const oauthInput = el('llmOauthProfileInput');

  const agentProviderSel = el('agentLlmProviderSelect');
  const agentModelInput = el('agentLlmModelIdInput');
  const agentAuthModeSel = el('agentLlmAuthModeSelect');
  const agentThinkingInput = el('agentLlmThinkingInput');
  const agentKeyInput = el('agentLlmKeyInput');
  const agentOauthInput = el('agentLlmOauthProfileInput');

  if (providerSel && agentProviderSel) {
    const nextProvider = String(agentProviderSel.value || '').trim();
    if (nextProvider) {
      ensureSelectOption(providerSel, nextProvider, nextProvider);
      providerSel.value = nextProvider;
      providerSel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  if (modelInput && agentModelInput) {
    const nextModel = String(agentModelInput.value || '').trim();
    if (nextModel) {
      ensureSelectOption(modelInput, nextModel, nextModel);
      modelInput.value = nextModel;
      if (modelInput.tagName === 'SELECT') {
        modelInput.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        modelInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }
  if (authModeSel && agentAuthModeSel) {
    authModeSel.value = readAgentLlmAuthMode();
    authModeSel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (thinkingInput && agentThinkingInput) {
    ensureSelectOption(thinkingInput, agentThinkingInput.value, agentThinkingInput.value);
    thinkingInput.value = agentThinkingInput.value;
  }
  if (keyInput && agentKeyInput) keyInput.value = agentKeyInput.value || '';
  if (oauthInput && agentOauthInput) oauthInput.value = agentOauthInput.value || '';
  syncModelRefFromInputs();
}

function initAgentLlmUi() {
  const panel = el('agentMindPanel');
  if (!panel || panel.dataset.listening === '1') return;
  panel.dataset.listening = '1';

  const providerSel = el('agentLlmProviderSelect');
  const modelInput = el('agentLlmModelIdInput');
  const authModeSel = el('agentLlmAuthModeSelect');
  const thinkingInput = el('agentLlmThinkingInput');
  const keyInput = el('agentLlmKeyInput');
  const oauthInput = el('agentLlmOauthProfileInput');
  const oauthLaunchBtn = el('agentLlmOauthLaunchBtn');
  const oauthCompleteBtn = el('agentLlmOauthCompleteBtn');
  const saveBtn = el('agentLlmSaveBtn');
  const clearBtn = el('agentLlmClearBtn');

  const syncBoth = () => {
    syncPrimaryLlmUiFromAgent();
    syncAgentLlmUiFromPrimary();
  };

  if (providerSel) {
    providerSel.addEventListener('change', () => {
      syncBoth();
      updateAgentLlmOauthLaunchUi();
    });
  }
  if (modelInput) {
    const event = modelInput.tagName === 'SELECT' ? 'change' : 'input';
    modelInput.addEventListener(event, () => syncBoth());
  }
  if (authModeSel) {
    authModeSel.addEventListener('change', () => {
      setAgentLlmAuthModeUI(readAgentLlmAuthMode());
      syncBoth();
    });
  }
  if (thinkingInput) {
    thinkingInput.addEventListener('change', () => syncPrimaryLlmUiFromAgent());
  }
  if (keyInput) {
    keyInput.addEventListener('input', () => syncPrimaryLlmUiFromAgent());
  }
  if (oauthInput) {
    oauthInput.addEventListener('input', () => syncPrimaryLlmUiFromAgent());
  }
  if (oauthLaunchBtn) {
    oauthLaunchBtn.addEventListener('click', async () => {
      syncPrimaryLlmUiFromAgent();
      try {
        await launchLlmOauthInNewTab();
      } catch (err) {
        const msg = String(err?.message || 'OAUTH_START_FAILED');
        if (msg === 'POPUP_BLOCKED') {
          setAgentLlmStatus(tApp('brain.error.popup_blocked'));
          return;
        }
        setAgentLlmStatus(tApp('brain.error.oauth_start_failed', { message: msg }));
      }
    });
  }
  if (oauthCompleteBtn) {
    oauthCompleteBtn.addEventListener('click', async () => {
      syncPrimaryLlmUiFromAgent();
      const callbackInput = String(el('llmOauthProfileInput')?.value || '').trim();
      try {
        await completeOpenAiCodexOAuthFromUi({ callbackInput });
      } catch (err) {
        const msg = String(err?.message || 'OAUTH_EXCHANGE_FAILED');
        if (msg === 'CODE_PENDING') {
          setAgentLlmStatus(tApp('brain.status.oauth_waiting'));
        }
      }
    });
  }
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      syncPrimaryLlmUiFromAgent();
      const primarySave = el('llmSaveBtn');
      if (!primarySave) {
        setAgentLlmStatus(tApp('brain.error.form_unavailable'));
        return;
      }
      setLiteLlmStatus(tApp('brain.status.configuring'));
      primarySave.click();
      setTimeout(() => syncAgentLlmUiFromPrimary(), 80);
      setTimeout(() => syncAgentLlmUiFromPrimary(), 600);
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      await clearLiteLlmConfig();
      syncAgentLlmUiFromPrimary();
    });
  }

  syncAgentLlmUiFromPrimary();
}

async function readLocalLiteLlmConfig() {
  const lib = await loadLiteLlmLibrary();
  const localCfg = await lib.loadLlmConfig();
  const providerRaw = typeof localCfg?.provider === 'string' ? localCfg.provider.trim() : '';
  const modelRaw = typeof localCfg?.model === 'string' ? localCfg.model.trim() : '';
  const modelRefRaw = typeof localCfg?.modelRef === 'string' ? localCfg.modelRef.trim() : '';
  const reasoning = normalizeThinkingLevel(localCfg?.reasoning);
  const useProxy = localCfg?.useProxy !== false;
  const defaultProvider = providerRaw || getDefaultLlmProviderForExperience();
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
    reasoning,
    useProxy,
    apiKeySet: !!credential
  };
}

function applyLocalLiteLlmToInputs(config) {
  const providerSel = el('llmProviderSelect');
  const modelInput = el('llmModelIdInput');
  const keyInput = el('llmKeyInput');
  const authModeSel = el('llmAuthModeSelect');
  const oauthInput = el('llmOauthProfileInput');
  const thinkingInput = el('llmThinkingInput');
  const useProxyInput = el('llmUseProxyInput');
  const mode = config?.authMode === 'oauth-json' ? 'oauth-json' : 'api-key';
  const reasoning = normalizeThinkingLevel(config?.reasoning);

  if (providerSel && modelInput) {
    const selected = applyLlmProviderModelSelection(config?.provider || getDefaultLlmProviderForExperience(), config?.model || '');
    providerSel.value = selected.provider;
    modelInput.value = selected.model;
  }
  if (thinkingInput) {
    if (reasoning) ensureSelectOption(thinkingInput, reasoning, reasoning);
    thinkingInput.value = reasoning || '';
  }
  if (useProxyInput) useProxyInput.checked = config?.useProxy !== false;
  if (keyInput) keyInput.value = mode === 'api-key' ? config?.credential || '' : '';
  if (authModeSel) setLlmAuthModeUI(mode);
  if (oauthInput) {
    if (mode === 'oauth-json') {
      oauthInput.value = config?.credential || '';
      oauthInput.placeholder = tApp('brain.placeholder.oauth_session');
    } else {
      oauthInput.value = '';
      oauthInput.placeholder = tApp('brain.placeholder.oauth_mode');
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
      setLiteLlmStatus(formatBrainSavedLocalStatus(localCfg.provider, localCfg.model));
    } else {
      setLiteLlmStatus(tApp('brain.status.not_configured'));
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
      if (status) status.textContent = tApp('brain.error.form_missing_fields');
      return;
    }

    if (status) status.textContent = tApp('brain.status.configuring');
    setAgentLlmStatus(tApp('brain.status.configuring'));
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
        authMode: config.authMode,
        reasoning: config.reasoning,
        useProxy: config.useProxy
      });

      const localCfg = setLocalLiteLlm({
        loaded: true,
        configured: true,
        provider: config.provider,
        model: config.model,
        modelRef: config.modelRef,
        credential: config.credential,
        authMode: config.authMode,
        reasoning: config.reasoning,
        useProxy: config.useProxy,
        apiKeySet: true
      });
      clearLiteSkillLoopPause();
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

      // Signal the server that brain is configured so onboarding step advances.
      // Never send provider, model, or key details — those stay local only.
      try {
        const serverSync = await api('/api/agent/lite/llm/config', {
          method: 'PUT',
          body: JSON.stringify({ hasCredential: true })
        });
        if (serverSync?.ok) {
          const freshState = await api('/api/state');
          if (freshState?.ok) lastState = freshState;
        }
      } catch (syncErr) {
        console.warn('server brain signal failed (brain still saved locally)', syncErr);
      }

      if (status) status.textContent = tApp('brain.status.configured');
      setAgentLlmStatus(tApp('brain.status.configured'));
      setLiteLlmStatus(formatBrainSavedLocalStatus(config.provider, config.model));
      if (lastState) updateUI(lastState);

      const step2 = el('step2');
      if (step2) {
        step2.classList.add('done');
        step2.classList.remove('active');
      }
      setHatchStatus(tApp('hatch.status.brain_connected_connecting_agent'));
      if (isVendorLite(lastState)) {
        const booted = await bootstrapVendorRuntime();
        if (booted) {
          await connectLiteAgent();
        } else {
          setHatchStatus(tApp('hatch.status.brain_configured_runtime_boot_failed'));
        }
      }

      // Refresh state and re-bind brain controls so Continue enables
      try {
        const freshState = await api('/api/state');
        if (freshState?.ok) {
          lastState = freshState;
          updateUI(lastState);
        }
      } catch (_) { /* state refresh best-effort */ }
      bindBrainDistrictControls();
    } catch (e) {
      const failed = formatBrainConfigFailedStatus(e.message);
      if (status) status.textContent = failed;
      setAgentLlmStatus(failed);
      setHatchStatus(failed);
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
  openAiCodexOAuthAttempt = null;
  stopOpenAiCodexOAuthPoll();
  openRouterOAuthAttempt = null;
  stopOpenRouterOAuthPoll();
  clearBtn.disabled = true;
  setLiteLlmStatus(tApp('brain.status.clearing'));
  try {
    const lib = await loadLiteLlmLibrary();
    await lib.clearLlmConfig();
    setLocalLiteLlm({
      loaded: true,
      configured: false,
      provider: null,
      model: null,
      modelRef: null,
      reasoning: '',
      useProxy: true,
      credential: '',
      authMode: 'api-key',
      apiKeySet: false
    });
    clearLiteSkillLoopPause();
    await applyGatewayLlmConfig({ configured: false });
    if (authModeSel) {
      authModeSel.value = 'api-key';
      setLlmAuthModeUI('api-key');
    }
    if (providerInput && modelInput) {
      const fallbackProvider = getDefaultLlmProviderForExperience();
      const selected = applyLlmProviderModelSelection(fallbackProvider, getDefaultLlmModelForProvider(fallbackProvider));
      providerInput.value = selected.provider;
      modelInput.value = selected.model;
    }
    if (keyInput) keyInput.value = '';
    if (modelRefInput) {
      const resolved = resolveLlmModelRefFromInputs(providerInput?.value || getDefaultLlmProviderForExperience(), modelInput?.value || '');
      modelRefInput.value = resolved.modelRef;
    }
    if (oauthInput) oauthInput.value = '';
    const thinkingInput = el('llmThinkingInput');
    if (thinkingInput) thinkingInput.value = '';
    const useProxyInput = el('llmUseProxyInput');
    if (useProxyInput) useProxyInput.checked = true;
    if (runtimeBridge && isVendorLite(lastState)) {
      await ensureVendorRuntimeBridge(lastState);
      await runtimeBridge.setLlmConfig({ provider: '', model: '', apiKey: '' });
    }
    statusOverride = tApp('brain.status.cleared_local');
    setLiteLlmStatus(tApp('brain.status.not_configured'));
    if (lastState) updateUI(lastState);
  } catch (e) {
    statusOverride = formatBrainClearFailedStatus(e.message);
    setLiteLlmStatus(statusOverride);
  } finally {
    pendingLlmClear = false;
    clearBtn.disabled = false;
    setHatchStatus(statusOverride);
  }
}

function renderSigilsLegacy(state) {
  const grid = el('sigilGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const confirmedHumanSel = typeof state?.human?.selected === 'string' && state.human.selected
    ? state.human.selected
    : null;
  if (confirmedHumanSel) pendingHumanSigilSelection = null;
  const humanSel = confirmedHumanSel || pendingHumanSigilSelection || null;
  const agentSel = state?.agent?.selected || null;

  for (const item of elements) {
    const btn = document.createElement('button');
    btn.className = 'btn sigil';
    btn.type = 'button';
    btn.setAttribute('data-testid', `sigil-${item.id}`);
    btn.dataset.elementId = item.id;

    if (item.icon) {
      const iconDiv = document.createElement('div');
      iconDiv.className = 'sigilIcon';
      iconDiv.setAttribute('aria-hidden', 'true');
      iconDiv.textContent = item.icon;
      btn.appendChild(iconDiv);
    }

    const nameSpan = document.createElement('div');
    nameSpan.className = 'name';
    nameSpan.textContent = item.label;
    btn.appendChild(nameSpan);

    const picks = document.createElement('div');
    picks.className = 'sigil-picks';

    const you = document.createElement('div');
    you.className = 'pill';
    you.textContent = humanSel === item.id ? tApp('sigil.pick_you') : '';

    const agent = document.createElement('div');
    agent.className = 'pill';
    agent.textContent = agentSel === item.id ? tApp('sigil.pick_agent') : '';

    picks.appendChild(you);
    picks.appendChild(agent);
    btn.appendChild(picks);

    if (humanSel === item.id || agentSel === item.id) {
      btn.classList.add('selected');
    }

    btn.addEventListener('click', async () => {
      setOpenError('');
      pendingHumanSigilSelection = item.id;
      if (lastState) renderSigils(lastState);
      try {
        const resp = await api('/api/human/select', {
          method: 'POST',
          body: JSON.stringify({ elementId: item.id })
        });
        if (resp?.humanSelected && lastState) {
          lastState = {
            ...lastState,
            human: { ...(lastState.human || {}), selected: resp.humanSelected },
            match: resp.match || lastState.match
          };
        }
        pendingHumanSigilSelection = null;
        if (lastState) {
          renderSigils(lastState);
          updateMatchUi(lastState);
        }
        requestHomeSkillStep('human-action');
      } catch (e) {
        pendingHumanSigilSelection = null;
        if (lastState) renderSigils(lastState);
        setOpenError(tApp('sigil.error.select_failed', { message: e.message }));
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
    matchState.textContent = matched ? tApp('sigil.unlocked') : tApp('sigil.locked');
    matchState.className = `state ${matched ? 'good' : 'bad'}`;
  }
  if (matchDetail) {
    matchDetail.textContent = matched
      ? `Matched on "${state.match.elementId}". Press Open.`
      : tApp('sigil.match_detail');
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
  const debugBtn = document.getElementById('agentDebugToggleBtn');
  const zoomOutBtn = document.getElementById('agentPanelZoomOutBtn');
  const zoomInBtn = document.getElementById('agentPanelZoomInBtn');
  const dock = document.getElementById('agentSidebar');
  const header = dock ? dock.querySelector('.sidebar-header') : null;

  if (dock && header && btn) {
    let zoomStep = AGENT_PANEL_ZOOM_STEP_DEFAULT;

    const applyPanelZoom = (nextStep, { persist = true } = {}) => {
      const normalized = normalizeAgentPanelZoomStep(nextStep);
      const scale = agentPanelScaleFromZoomStep(normalized);
      zoomStep = normalized;
      dock.style.setProperty('--agent-panel-zoom', String(scale));
      dock.style.setProperty('--agent-panel-text-scale', String(scale));
      dock.setAttribute('data-panel-zoom-step', String(normalized));
      if (persist) saveAgentPanelZoomStep(normalized);

      const percent = Math.round(scale * 100);
      if (zoomOutBtn) {
        zoomOutBtn.disabled = normalized <= AGENT_PANEL_ZOOM_STEP_MIN;
        const zoomOutTitle = tApp('agent.panel.debug.zoom_out_percent', { percent });
        zoomOutBtn.title = zoomOutTitle;
        zoomOutBtn.setAttribute('aria-label', zoomOutTitle);
      }
      if (zoomInBtn) {
        zoomInBtn.disabled = normalized >= AGENT_PANEL_ZOOM_STEP_MAX;
        const zoomInTitle = tApp('agent.panel.debug.zoom_in_percent', { percent });
        zoomInBtn.title = zoomInTitle;
        zoomInBtn.setAttribute('aria-label', zoomInTitle);
      }

      syncAgentPanelLayout(dock);
      scheduleAgentPanelLayoutSync(dock);
      return normalized;
    };

    const applyMinimized = (minimized) => {
      dock.classList.toggle('minimized', minimized);
      btn.textContent = minimized ? '□' : '_';
      const nextTitle = minimized ? tApp('agent.panel.debug.expand') : tApp('agent.panel.debug.minimize');
      btn.title = nextTitle;
      btn.setAttribute('aria-label', nextTitle);
      saveAgentPanelMinimized(minimized);
      syncAgentPanelLayout(dock);
      scheduleAgentPanelLayoutSync(dock);
    };

    const applyDebugVisible = (visible) => {
      if (!debugBtn) return;
      dock.classList.toggle('debug-collapsed', !visible);
      debugBtn.setAttribute('aria-expanded', visible ? 'true' : 'false');
      debugBtn.title = visible ? tApp('agent.panel.debug.hide') : tApp('agent.panel.debug.show');
      saveAgentPanelDebugVisible(visible);
      syncAgentPanelLayout(dock);
      scheduleAgentPanelLayoutSync(dock);
      if (visible) {
        scheduleAgentDebugRefresh('debug-open');
      }
    };

    applyMinimized(loadAgentPanelMinimized());
    if (debugBtn) {
      applyDebugVisible(loadAgentPanelDebugVisible());
    }
    applyPanelZoom(loadAgentPanelZoomStep(), { persist: false });
    bindAgentPanelLayout(dock);

    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      applyMinimized(!dock.classList.contains('minimized'));
    });

    if (debugBtn) {
      debugBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        applyDebugVisible(dock.classList.contains('debug-collapsed'));
      });
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        applyPanelZoom(zoomStep - 1);
      });
    }
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        applyPanelZoom(zoomStep + 1);
      });
    }

    header.addEventListener('click', (event) => {
      if (event.target && event.target.closest('button')) return;
      applyMinimized(!dock.classList.contains('minimized'));
    });
  }
});

function updateUILegacy(state) {
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
  initAgentLlmUi();
  syncAgentLlmUiFromPrimary();

  // --- New Flow UI Updates ---
  // --- New Flow UI Updates ---
  const step1 = el('step1');
  const step2 = el('step2');
  const agentReveal = el('agentReveal');
  const agentConnected = isAnyAgentConnected(state);
  const lite = liteState(state);
  const vendor = isVendorLite(state);
  if (vendor) {
    refreshLiteSkillState().catch(() => { });
    if (agentConnected) {
      ensureDefaultLiteSkillImported(state).catch(() => { });
      requestHomeSkillStep('state');
    }
  }
  if (!shouldRunHomeSkillLoop(state)) {
    clearLiteSkillLoopTimer();
    liteSkillLoopTeamCode = '';
  } else {
    const currentTeamCode = String(state?.teamCode || '').trim();
    if (currentTeamCode && currentTeamCode !== liteSkillLoopTeamCode) {
      liteSkillLoopTeamCode = currentTeamCode;
      liteSkillLoopBackoffMs = 1000;
      requestHomeSkillStep('team-change');
    }
  }
  const liteActive = isLiteAgentActive(state);

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
      setOpenError(tApp('agent.panel.log.runtime_bridge_failed', { message: e.message }));
    });
    if (lite.lastError) {
      setLiteLlmStatus(tApp('brain.status.runtime_failed', { message: lite.lastError }));
    } else if (localLlm.configured) {
      setLiteLlmStatus(formatBrainSavedLocalStatus(localLlm.provider || 'provider', localLlm.model || 'model'));
    } else {
      setLiteLlmStatus(tApp('brain.status.not_configured'));
    }
  }

  if (statusOverride === tApp('hatch.status.runtime_starting') && runtimeBootstrapDone) {
    statusOverride = '';
  }

  if (statusOverride) {
    setHatchStatus(statusOverride);
  } else if (vendor && lite.lastError) {
    setHatchStatus(formatHatchRuntimeFailedStatus(lite.lastError));
  } else if (vendor && !localLlm.configured) {
    setHatchStatus(tApp('hatch.status.configure_llm'));
  } else if (vendor && localLlm.configured && !agentConnected) {
    setHatchStatus(runtimeBootstrapDone ? tApp('hatch.status.brain_saved_connecting_agent') : tApp('hatch.status.starting_local_runtime'));
  } else if (vendor && agentConnected && !liteActive) {
    setHatchStatus(tApp('hatch.status.agent_connected_import_failed'));
  } else if (agentConnected) {
    setHatchStatus(tApp('hatch.status.agent_ready'));
  } else if (walletAddr) {
    setHatchStatus(tApp('hatch.status.wallet_connected_continue'));
  } else {
    setHatchStatus(tApp('hatch.status.choose_sign_in'));
  }

  const townNode = el('townPanel');
  const townVisible = !!townNode && !townNode.classList.contains('is-hidden');
  if (townVisible || agentConnected || !!state?.signup?.complete) {
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
    instrumentGatewayTraffic(gateway);

    // Subscribe to agent events
    gateway.on('message', (msg) => {
      pushAgentDebugTraffic('in', 'worker.chat.append', {
        role: String(msg?.role || ''),
        text: String(msg?.text || ''),
      });
      const role = String(msg?.role || '').toLowerCase();
      if (role && role !== 'assistant') return;
      // Logic fix: accept empty strings as valid content/thinking
      const text = (typeof msg.text === 'string') ? msg.text : JSON.stringify(msg);
      appendChatMessage('agent', text);
    });
    gateway.on('log', (entry) => {
      pushAgentDebugTraffic('in', 'worker.log.append', entry || {});
      appendAgentLog(`[${entry.level}] ${entry.message}`);
    });
    gateway.on('status', (status) => {
      const elStatus = el('agentStatus');
      if (elStatus) elStatus.textContent = status;
      pushAgentDebugTraffic('in', 'worker.runtime.status', { status: String(status || '') });
      pushAgentDebugEvent(`status: ${status}`);
      scheduleAgentDebugRefresh('status');
    });
    gateway.on('state', (runtimeState) => {
      const snapshot = runtimeState && typeof runtimeState === 'object' ? runtimeState : {};
      liteRuntimeState = snapshot;
      const policy = snapshot?.policy && typeof snapshot.policy === 'object' ? snapshot.policy : {};
      const policyRisk = policy?.risk && typeof policy.risk === 'object' ? policy.risk : {};
      pushAgentDebugTraffic('in', 'worker.state.update', {
        step: String(snapshot?.experience?.step || ''),
        nextAgentAction: String(snapshot?.experience?.nextAgentAction || ''),
        humanSelected: String(snapshot?.human?.selected || ''),
        agentSelected: String(snapshot?.agent?.selected || ''),
        matched: !!snapshot?.match?.matched,
        permissionPolicyMode: String(policy?.mode || ''),
        permissionRiskLevel: String(policyRisk?.level || ''),
        permissionCount: Array.isArray(policy?.permissions) ? policy.permissions.length : 0,
      });
      if (runtimeState && typeof runtimeState === 'object' && runtimeState.skill) {
        setLiteSkillState(runtimeState.skill);
        updateLiteAgentStatus(lastState);
        if (!statusOverride && isVendorLite(lastState) && isAnyAgentConnected(lastState)) {
          setHatchStatus(isLiteAgentActive(lastState)
            ? tApp('hatch.status.agent_ready')
            : tApp('hatch.status.agent_connected_import_failed'));
        }
      }
      scheduleAgentDebugRefresh('state');
    });

    return gateway;
  } catch (e) {
    console.error('Failed to load gateway:', e);
    appendAgentLog(tApp('agent.panel.log.gateway_load_failed', { message: e.message }));
    return null;
  }
}

function appendChatMessage(role, text) {
  const box = el('chatTranscript');
  if (!box) {
    scheduleAgentDebugRefresh('chat');
    return;
  }

  const div = document.createElement('div');
  div.className = `chat-message ${role}`;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  scheduleAgentDebugRefresh('chat');
}

function appendAgentLog(text) {
  pushAgentDebugEvent(text);
  const box = el('agentLogs');
  if (!box) {
    scheduleAgentDebugRefresh('log');
    return;
  }

  const div = document.createElement('div');
  div.textContent = `> ${text}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  scheduleAgentDebugRefresh('log');
}

async function handleVisit() {
  const selector = el('experienceSelector');
  const url = selector ? selector.value : '';
  if (!url) {
    appendAgentLog(tApp('agent.panel.log.select_valid_experience'));
    return;
  }

  appendChatMessage('system', tApp('agent.panel.message.navigating', { url }));
  if (!gateway) await initGateway();

  try {
    // Send navigation/fetch command to agent
    // Depending on agent capability, this might be a 'tool' execution or a hard navigation
    // For now, we ask the agent to "visit" it.
    await gateway.send({ type: 'command', command: 'visit', url });
    appendAgentLog(tApp('agent.panel.log.visit_sent', { url }));
    await refreshLiteSkillState({ force: true });
  } catch (e) {
    appendAgentLog(tApp('agent.panel.log.visit_failed', { message: e.message }));
    await refreshLiteSkillState({ force: true });
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
    let outgoingText = text;
    if (isVendorLite(lastState)) {
      await ensureDefaultLiteSkillImported(lastState);
      await refreshLiteSkillState({ force: false });
      await refreshSkillActionPluginCache(gateway, window.__openclawLiteTest || null).catch(() => null);
      await refreshTrainerNamespacePluginCache(lastState).catch(() => null);
      const quickRef = buildSkillActionQuickRefForChat(text);
      const trainerQuickRef = buildTrainerNamespaceQuickRefForChat(text);
      if (quickRef) {
        outgoingText = `${text}\n\n${quickRef}\nUse these action definitions when selecting http_request calls.`;
      }
      if (trainerQuickRef) {
        outgoingText = `${outgoingText}\n\n${trainerQuickRef}\nUse trainer namespace tools for diagnostics before claiming completion.`;
      }
    }
    await gateway.send({
      type: 'chat',
      text: outgoingText,
      runtimeContext: buildExperienceRuntimeContext(lastState),
      runtimeState: lastState && typeof lastState === 'object' ? lastState : null
    });
  } catch (e) {
    appendChatMessage('system', tApp('agent.panel.message.failed_to_send', { message: e.message }));
  }
}

function readCurrentTeamCodeFromState() {
  const value = String(lastState?.teamCode || '').trim();
  if (!/^TEAM-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(value)) return '';
  return value;
}

async function handleNewSession() {
  const btn = el('newSessionBtn');
  if (btn) btn.disabled = true;

  try {
    if (!gateway) await initGateway();
    if (!gateway) throw new Error(tApp('agent.panel.message.gateway_unavailable'));

    if (typeof gateway.clearTranscript === 'function') {
      await gateway.clearTranscript({ rotateSession: true, keepBootMessage: false });
    } else if (window.__openclawLiteTest && typeof window.__openclawLiteTest.clearTranscript === 'function') {
      await window.__openclawLiteTest.clearTranscript({ rotateSession: true, keepBootMessage: false });
    } else {
      throw new Error('Transcript reset is not available.');
    }

    const box = el('chatTranscript');
    if (box) box.innerHTML = '';
    appendChatMessage('system', tApp('agent.panel.message.new_session_started'));
    appendAgentLog(tApp('agent.panel.log.new_session_started'));
  } catch (e) {
    const msg = e?.message || 'UNKNOWN';
    const failure = tApp('agent.panel.message.new_session_failed', { message: msg });
    appendChatMessage('system', failure);
    appendAgentLog(failure);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function setupAgentDebugInterface() {
  const tabs = Array.from(document.querySelectorAll('[data-debug-tab]'));
  if (!tabs.length) return;

  for (const btn of tabs) {
    if (btn.dataset.bound === '1') continue;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const tab = String(btn.dataset.debugTab || '').trim();
      setAgentDebugTab(tab || 'tools');
      scheduleAgentDebugRefresh(tab === 'session' ? 'tab-session' : 'tab-change');
    });
  }

  const refreshBtn = el('agentDebugRefreshBtn');
  if (refreshBtn && refreshBtn.dataset.bound !== '1') {
    refreshBtn.dataset.bound = '1';
    refreshBtn.addEventListener('click', () => {
      scheduleAgentDebugRefresh('manual');
    });
  }

  const filterButtons = Array.from(document.querySelectorAll('[data-traffic-filter]'));
  for (const btn of filterButtons) {
    if (btn.dataset.bound === '1') continue;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const value = String(btn?.dataset?.trafficFilter || '').trim();
      setAgentTrafficFilter(value);
      scheduleAgentDebugRefresh('traffic-filter');
    });
  }

  setAgentTrafficFilter(agentDebugTrafficFilter);
  setAgentDebugTab(agentDebugActiveTab);
  startAgentDebugRefreshLoop();
  scheduleAgentDebugRefresh('init');
}

function setupAgentInterface() {
  const visitBtn = el('visitBtn');
  const sendBtn = el('sendChatBtn');
  const newSessionBtn = el('newSessionBtn');
  const openTrainerBtn = el('agentOpenTrainerBtn');
  const chatInput = el('chatInput');

  if (visitBtn) visitBtn.addEventListener('click', handleVisit);
  if (sendBtn) sendBtn.addEventListener('click', handleChat);
  if (newSessionBtn) newSessionBtn.addEventListener('click', () => {
    handleNewSession().catch(() => { });
  });
  if (openTrainerBtn) {
    openTrainerBtn.addEventListener('click', () => {
      openTrainerModal().catch(() => {
        window.location.assign('/trainer');
      });
    });
  }
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleChat();
    });
  }

  setupAgentDebugInterface();
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

async function bootstrapInitialRouteState() {
  await bootstrapExperiencePreferenceForApp().catch(() => null);

  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    try {
      await api('/api/referral', { method: 'POST', body: JSON.stringify({ shareId: ref }) });
    } catch {
      // ignore invalid referral
    }
    params.delete('ref');
    const qs = params.toString();
    const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }

  const tokenErr = loadTokenError();
  const districtParam = params.get('district');
  const pathDistrict = popupDistrictByPath[window.location.pathname] || null;
  const explicitDistrict = explicitDistrictFromInput(districtParam) || explicitDistrictFromInput(pathDistrict);
  pathMode = loadPathMode();
  const initialDistrict = explicitDistrict;
  activeDistrict = initialDistrict;
  updatePathButtons();
  setActiveDistrict(initialDistrict);

  if (isTownHub) {
    bindDistrictMapInteractions();
    bindTrainerModalInteractions();

    const closeBtn = el('districtModalClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => hideDistrict());
    }

    const backdrop = el('districtModalBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (ev) => {
        if (ev.target === backdrop) hideDistrict();
      });
    }

    const modalBody = el('districtModalBody');
    if (modalBody) {
      modalBody.addEventListener('click', onDistrictModalLinkClick);
    }
  }

  const canRun = await ensurePrivyAuthenticatedForHub();
  if (!canRun) {
    if (window.location.pathname === '/app') {
      window.location.replace('/start');
    }
    return;
  }

  await restoreWalletConnection();

  try {
    const session = await api('/api/session');
    elements = Array.isArray(session?.elements) ? session.elements : [];
    updateUI({
      teamCode: session.teamCode,
      elements,
      agent: { connected: false },
      human: {},
      match: { matched: false },
      signup: { complete: false, mode: null },
      share: { id: null },
      experiencePreference: session.experiencePreference || currentExperiencePreference,
      onboarding: session.onboarding || {
        required: false,
        registrationComplete: true,
        step: ONBOARDING_STEP_DONE
      },
      stats: session.stats
    });

    if (walletRecoveryIntentAttempts > 0 && session?.onboarding?.registrationComplete !== true) {
      try {
        const recovered = await api('/api/session');
        if (recovered && typeof recovered === 'object') {
          elements = Array.isArray(recovered?.elements) ? recovered.elements : elements;
          updateUI({
            teamCode: recovered.teamCode || session.teamCode,
            elements,
            agent: { connected: false },
            human: {},
            match: { matched: false },
            signup: { complete: false, mode: null },
            share: { id: null },
            experiencePreference: recovered.experiencePreference || session.experiencePreference || currentExperiencePreference,
            onboarding: recovered.onboarding || session.onboarding || {
              required: false,
              registrationComplete: true,
              step: ONBOARDING_STEP_DONE
            },
            stats: recovered.stats || session.stats
          });
        }
      } catch {
        // best-effort recovery pass
      }
    }
  } catch {
    // continue with the full /api/state load below
  }

  if (isTownHub && initialDistrict) {
    await showDistrict(activeDistrict);
  }

  if (tokenErr) {
    setTokenError(tokenErr);
  }

  updateWalletUI();
}

async function init() {
  await bootstrapInitialRouteState();
  bindCeremonyCompleteListener();

  // Keep agent/debug controls interactive even if runtime bootstrap stalls.
  setupAgentInterface();

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
        requestHomeSkillStep('human-action');
      } catch (e) {
        setOpenError(tApp('sigil.error.open_failed', { message: e.message }));
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
    bootstrapVendorRuntime()
      .then(() => restoreLiteLlmConfigFromLocalIfNeeded(initial))
      .catch((error) => {
        console.warn('vendor runtime bootstrap failed during init', error);
      });
  }

  // Do not auto-load server-side Codex profile credentials. Users configure LLM credentials themselves.
  poll();
}

init().catch((e) => {
  console.error(e);
  setHatchStatus(tApp('hatch.status.init_failed', { message: e.message }));
});
