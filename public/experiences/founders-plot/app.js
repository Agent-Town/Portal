(function foundersPlotBootstrap() {
  const TEAM_CODE_HINT_STORAGE_KEY = 'agentTown:teamCodeHint';
  const BRAIN_HARNESS_POLICY_STORAGE_KEY = 'foundersPlot:testBrainHarnessPolicy';
  const OPENAI_CODEX_OAUTH_MESSAGE_TYPE = 'agenttown:openai-codex-oauth-callback';
  const FOUNDERS_FEATURE_FLAGS_PARAM = (() => {
    try {
      return String(new URLSearchParams(window.location.search || '').get('foundersFeatureFlags') || '').trim();
    } catch {
      return '';
    }
  })();
  const BUILDING_LABELS = {
    HQ: 'Headquarters',
    LUMBER_CAMP: 'Lumber Camp',
    FARM_PLOT: 'Farm Plot',
    QUARRY: 'Quarry',
    WORKSHOP: 'Workshop',
    MARKET_STALL: 'Market Stall'
  };
  const BUILDING_UNLOCK_LEVELS = {
    LUMBER_CAMP: 1,
    FARM_PLOT: 2,
    QUARRY: 3,
    WORKSHOP: 4,
    MARKET_STALL: 5
  };
  const UPGRADE_CAPS = {
    HQ: 5,
    LUMBER_CAMP: 2,
    FARM_PLOT: 2,
    QUARRY: 2,
    WORKSHOP: 2,
    MARKET_STALL: 2
  };
  const BOARD_ORDER = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 }
  ];
  const FUTURE_DRAWER_FEATURES = {
    settlements: 'FEATURE_FOUNDERS_V25_SECOND_SETTLEMENT',
    operating: 'FEATURE_FOUNDERS_V30_OPERATING_MODEL',
    creator: 'FEATURE_FOUNDERS_V45_CREATOR_BUILDINGS'
  };

  let currentState = null;
  let selectedKey = '';
  let activeDrawer = '';
  let pollTimer = null;
  let pendingAction = false;
  let gatewayPromise = null;
  let llmLibraryPromise = null;
  let brainVaultLibraryPromise = null;
  let assetManifestPromise = null;
  let assetMap = {};
  let effectsController = null;
  let currentScene = null;
  let sceneActionRegistry = new Map();
  let viewportSyncTimer = null;
  let manualForemanActingUntilMs = 0;
  let currentPlotCard = null;
  let currentPostcard = null;
  let currentOperatingStyleCard = null;
  let foremanRuntimeToken = '';
  let localForemanRuntimeId = '';
  let lastActionTargetObjectId = '';
  let lastRenderedHqLevel = 0;
  let openAiCodexOAuthAttempt = null;
  let openAiCodexOAuthPollTimer = null;
  let openAiCodexOAuthExchangeInFlight = false;
  let openAiCodexOAuthMessageListenerBound = false;
  let sharedBrainStatus = {
    loaded: false,
    configured: false,
    provider: '',
    model: '',
    modelRef: '',
    apiKeySet: false,
    quality: 'none',
    realReady: false,
    previewOnly: false
  };
  let brainVaultStatus = {
    loaded: false,
    available: false,
    scope: null,
    vault: null,
    error: ''
  };
  let analyticsEvents = [];
  const analyticsSeen = new Set();
  let brainHarnessPolicy = loadBrainHarnessPolicy();
  let workerSchedulerStatus = {
    active: false,
    taskKind: 'COLLECT_READY_OUTPUTS',
    tickRunning: false,
    nextRunAtMs: 0,
    lastRunAtMs: 0,
    lastStatus: 'STOPPED',
    lastErrorCode: '',
    consecutiveErrors: 0,
    hasToken: false,
    lastStopReason: ''
  };
  const FOREMAN_PACK_DOCS = [
    { key: 'heartbeat', url: '/experiences/founders-plot/heartbeat.md', workspaceName: 'heartbeat.md' },
    { key: 'tools', url: '/experiences/founders-plot/tools.md', workspaceName: 'tools.md' },
    { key: 'goals', url: '/experiences/founders-plot/goals.md', workspaceName: 'goals.md' },
    { key: 'safety', url: '/experiences/founders-plot/safety.md', workspaceName: 'safety.md' }
  ];

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
      // ignore
    }
  }

  async function initGateway() {
    if (window.__openclawLiteTest) return window.__openclawLiteTest;
    if (!gatewayPromise) {
      gatewayPromise = import('/openclaw-lite/gateway.js').then((module) => module.default || module);
    }
    return gatewayPromise;
  }

  async function loadLiteLlmLibrary() {
    if (!llmLibraryPromise) {
      llmLibraryPromise = import('/openclaw-lite/llm-config-library.js');
    }
    return llmLibraryPromise;
  }

  async function loadBrainVaultLibrary() {
    if (!brainVaultLibraryPromise) {
      brainVaultLibraryPromise = import('/openclaw-lite/brain-vault-library.js');
    }
    return brainVaultLibraryPromise;
  }

  function defaultBrainModel(provider = '') {
    const normalized = String(provider || '').trim().toLowerCase();
    if (normalized === 'openrouter') return 'nvidia/nemotron-3-super-120b-a12b:free';
    if (normalized === 'ollama') return 'llama3.2';
    if (normalized === 'openai-codex') return 'gpt-5.3-codex';
    return 'gpt-4o-mini';
  }

  function normalizeSharedBrainStatus(config = null) {
    const provider = String(config?.provider || '').trim();
    const model = String(config?.model || '').trim();
    const modelRef = String(config?.modelRef || (provider && model ? `${provider}/${model}` : '')).trim();
    const apiKeySet = config?.apiKeySet === true || !!String(config?.apiKey || config?.credential || '').trim();
    const configured = config?.configured === true && !!provider && !!model && apiKeySet;
    const quality = typeof window.AgentTownAccess?.classifyBrainQuality === 'function'
      ? window.AgentTownAccess.classifyBrainQuality({
          configured,
          provider,
          model,
          modelRef,
          apiKeySet
        })
      : configured
        ? 'real'
        : 'none';
    const realReady = quality === 'real' || (quality === 'test' && brainHarnessPolicy.allowTestBrainForRealClover === true);
    return {
      loaded: true,
      configured,
      provider,
      model,
      modelRef,
      apiKeySet,
      quality,
      realReady,
      previewOnly: configured && !realReady
    };
  }

  function loadBrainHarnessPolicy() {
    try {
      const raw = window.sessionStorage?.getItem(BRAIN_HARNESS_POLICY_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return {
        allowTestBrainForRealClover: parsed?.allowTestBrainForRealClover === true
      };
    } catch {
      return {
        allowTestBrainForRealClover: false
      };
    }
  }

  function saveBrainHarnessPolicy(policy = {}) {
    try {
      window.sessionStorage?.setItem(BRAIN_HARNESS_POLICY_STORAGE_KEY, JSON.stringify({
        allowTestBrainForRealClover: policy?.allowTestBrainForRealClover === true
      }));
    } catch {
      // Test-only persistence should never affect normal gameplay if unavailable.
    }
  }

  async function refreshSharedBrainStatus({ render = false } = {}) {
    const lib = await loadLiteLlmLibrary().catch(() => null);
    if (!lib || typeof lib.loadLlmConfig !== 'function') {
      sharedBrainStatus = normalizeSharedBrainStatus(null);
      return sharedBrainStatus;
    }
    sharedBrainStatus = normalizeSharedBrainStatus(await lib.loadLlmConfig().catch(() => null));
    if (render) renderAll();
    return sharedBrainStatus;
  }

  async function refreshBrainVaultStatus({ render = false } = {}) {
    const lib = await loadBrainVaultLibrary().catch(() => null);
    if (!lib || typeof lib.getBrainVaultStatus !== 'function') {
      brainVaultStatus = { loaded: true, available: false, scope: null, vault: null, error: 'unavailable' };
      return brainVaultStatus;
    }
    try {
      const payload = await lib.getBrainVaultStatus();
      brainVaultStatus = {
        loaded: true,
        available: payload?.vault?.available === true,
        scope: payload?.scope || null,
        vault: payload?.vault || null,
        error: ''
      };
    } catch (error) {
      brainVaultStatus = {
        loaded: true,
        available: false,
        scope: null,
        vault: null,
        error: String(error?.message || 'BRAIN_VAULT_STATUS_FAILED')
      };
    }
    if (render) renderAll();
    return brainVaultStatus;
  }

  function stopFoundersChatGptLoginPoll() {
    if (!openAiCodexOAuthPollTimer) return;
    clearInterval(openAiCodexOAuthPollTimer);
    openAiCodexOAuthPollTimer = null;
  }

  function setFoundersChatGptStatus(message = '') {
    const status = document.getElementById('foundersChatGptLoginStatus');
    if (status) status.textContent = String(message || '');
  }

  async function saveOpenAiCodexCredentialForClover(credential = {}) {
    const access = String(credential?.access || credential?.access_token || '').trim();
    if (!access) throw new Error('TOKEN_RESPONSE_INVALID');
    const model = defaultBrainModel('openai-codex');
    const lib = await loadLiteLlmLibrary();
    if (!lib || typeof lib.saveLlmConfig !== 'function') throw new Error('BRAIN_CONFIG_UNAVAILABLE');
    await lib.saveLlmConfig({
      provider: 'openai-codex',
      model,
      apiKey: access,
      authMode: 'oauth-json',
      useProxy: true
    });
    await refreshSharedBrainStatus({ render: false });
    await stopWorkerScheduler('BRAIN_CONFIG_CHANGED').catch(() => null);
    foremanRuntimeToken = '';
    localForemanRuntimeId = '';
    await loadState().catch(() => null);
    renderAll();
    return sharedBrainStatus;
  }

  async function exchangeFoundersChatGptLogin({ attemptId = '', callbackInput = '' } = {}) {
    const payload = {};
    const safeAttemptId = String(attemptId || '').trim();
    const safeCallbackInput = String(callbackInput || '').trim();
    if (safeAttemptId) payload.attemptId = safeAttemptId;
    if (safeCallbackInput) payload.callbackInput = safeCallbackInput;
    return await api('/api/agent/lite/llm/oauth/openai-codex/exchange', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async function completeFoundersChatGptLogin({ callbackInput = '' } = {}) {
    if (openAiCodexOAuthExchangeInFlight) return null;
    openAiCodexOAuthExchangeInFlight = true;
    try {
      const attemptId = String(openAiCodexOAuthAttempt?.attemptId || '').trim();
      const normalizedInput = String(callbackInput || '').trim();
      if (!attemptId && !normalizedInput) throw new Error('START_CHATGPT_LOGIN_FIRST');
      const result = await exchangeFoundersChatGptLogin({ attemptId, callbackInput: normalizedInput });
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
      await saveOpenAiCodexCredentialForClover(credential);
      stopFoundersChatGptLoginPoll();
      openAiCodexOAuthAttempt = null;
      setFoundersChatGptStatus('ChatGPT is connected. Start Clover when you want Foreman help.');
      setStatusLine('ChatGPT connected. Clover can now use approved Foreman tools when started.');
      return result;
    } catch (error) {
      const code = String(error?.message || '').trim();
      if (code === 'CODE_PENDING') {
        setFoundersChatGptStatus('Finish ChatGPT login in the new tab. Clover will connect when it returns.');
        return null;
      }
      const message = code === 'START_CHATGPT_LOGIN_FIRST'
        ? 'Start ChatGPT login first.'
        : `Could not finish ChatGPT login: ${code || 'UNKNOWN'}`;
      setFoundersChatGptStatus(message);
      throw error;
    } finally {
      openAiCodexOAuthExchangeInFlight = false;
    }
  }

  function startFoundersChatGptLoginPoll() {
    stopFoundersChatGptLoginPoll();
    openAiCodexOAuthPollTimer = setInterval(async () => {
      try {
        await completeFoundersChatGptLogin({ callbackInput: '' });
      } catch (error) {
        if (String(error?.message || '') === 'CODE_PENDING') return;
        stopFoundersChatGptLoginPoll();
      }
    }, 1500);
  }

  function bindFoundersChatGptLoginMessageListener() {
    if (openAiCodexOAuthMessageListenerBound) return;
    openAiCodexOAuthMessageListenerBound = true;
    window.addEventListener('message', async (event) => {
      const payload = event?.data;
      if (!payload || typeof payload !== 'object') return;
      if (String(payload.type || '') !== OPENAI_CODEX_OAUTH_MESSAGE_TYPE) return;
      const incomingState = String(payload.state || '').trim();
      const incomingCode = String(payload.code || '').trim();
      const incomingError = String(payload.error || '').trim();
      if (incomingError) {
        setFoundersChatGptStatus(`ChatGPT login was not completed: ${incomingError}`);
        return;
      }
      const activeState = String(openAiCodexOAuthAttempt?.state || '').trim();
      if (incomingState && activeState && incomingState === activeState) {
        await completeFoundersChatGptLogin({ callbackInput: '' }).catch(() => null);
        return;
      }
      if (incomingCode) {
        await completeFoundersChatGptLogin({ callbackInput: `${incomingCode}#${incomingState}` }).catch(() => null);
      }
    });
  }

  async function launchFoundersChatGptLogin() {
    bindFoundersChatGptLoginMessageListener();
    const started = await api('/api/agent/lite/llm/oauth/openai-codex/start', {
      method: 'POST',
      body: JSON.stringify({ provider: 'openai-codex', originator: 'founders-plot-clover' })
    });
    const authorizeUrl = String(started?.authorizeUrl || '').trim();
    const attemptId = String(started?.attemptId || '').trim();
    const state = String(started?.state || '').trim();
    if (!authorizeUrl || !attemptId || !state) throw new Error('CHATGPT_LOGIN_START_FAILED');
    openAiCodexOAuthAttempt = { attemptId, state, startedAtMs: Date.now() };
    const popup = window.open(authorizeUrl, '_blank', 'noopener,noreferrer');
    if (!popup) throw new Error('POPUP_BLOCKED');
    setFoundersChatGptStatus('Finish ChatGPT login in the new tab. Clover will connect when it returns.');
    setStatusLine('ChatGPT login started. Finish it in the new tab.');
    startFoundersChatGptLoginPoll();
    return started;
  }

  function isBrainConfiguredForForeman() {
    return sharedBrainStatus.configured === true;
  }

  function isRealBrainReadyForForeman() {
    return sharedBrainStatus.realReady === true;
  }

  function buildFoundersAccessState(state = stateData()) {
    const runtimeLocal = localForemanRuntimeStatus(state?.foreman?.runtime || {});
    const builder = window.AgentTownAccess?.buildAccessState;
    if (typeof builder === 'function') {
      return builder({
        authenticated: true,
        state: state || {},
        brainConfigured: isBrainConfiguredForForeman(),
        runtimeReady: runtimeLocal.actionable === true,
        provider: sharedBrainStatus.provider || null,
        model: sharedBrainStatus.model || null,
        modelRef: sharedBrainStatus.modelRef || null,
        apiKeySet: sharedBrainStatus.apiKeySet === true,
        allowTestBrainForRealClover: brainHarnessPolicy.allowTestBrainForRealClover === true
      });
    }
    const realReady = isRealBrainReadyForForeman();
    return {
      foundersPlot: {
        playable: true,
        mode: realReady && runtimeLocal.actionable
          ? 'REAL_CLOVER'
          : isBrainConfiguredForForeman()
            ? 'PREVIEW_CLOVER'
            : 'MANUAL_FOUNDER'
      },
      brain: {
        configured: isBrainConfiguredForForeman(),
        quality: sharedBrainStatus.quality || 'none',
        realReady,
        previewOnly: isBrainConfiguredForForeman() && !realReady,
        runtimeReady: runtimeLocal.actionable === true,
        requiredForRealForeman: true
      },
      clover: {
        guideAvailable: true,
        previewAvailable: isBrainConfiguredForForeman(),
        realForemanAvailable: realReady && runtimeLocal.actionable === true,
        schedulerEnabled: realReady && runtimeLocal.actionable === true,
        disabledReason: !isBrainConfiguredForForeman()
          ? 'BRAIN_REQUIRED'
          : !realReady
            ? 'REAL_BRAIN_REQUIRED'
            : 'RUNTIME_NOT_READY'
      },
      townHall: {
        complete: false,
        recommended: Number(state?.plot?.hqLevel || 0) >= 2
      }
    };
  }

  async function loadAssetManifest() {
    if (!assetManifestPromise) {
      assetManifestPromise = fetch('/experiences/founders-plot/assets/asset-manifest.json', {
        credentials: 'include',
        cache: 'no-store'
      }).then(async (response) => {
        if (!response.ok) throw new Error(`HTTP_${response.status}`);
        const manifest = await response.json().catch(() => null);
        const entries = Array.isArray(manifest?.assets) ? manifest.assets : [];
        assetMap = Object.fromEntries(entries.map((entry) => [String(entry?.id || ''), entry]));
        return manifest;
      }).catch(() => {
        assetMap = {};
        return null;
      });
    }
    return assetManifestPromise;
  }

  async function apiText(url, opts = {}) {
    const response = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      ...opts
    });
    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }
    return await response.text();
  }

  async function api(url, opts = {}) {
    const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
    const teamCodeHint = readTeamCodeHint();
    if (teamCodeHint && headers['x-team-code-hint'] === undefined) {
      headers['x-team-code-hint'] = teamCodeHint;
    }
    if (FOUNDERS_FEATURE_FLAGS_PARAM && headers['x-founders-plot-feature-flags'] === undefined) {
      headers['x-founders-plot-feature-flags'] = FOUNDERS_FEATURE_FLAGS_PARAM;
    }
    const response = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      ...opts,
      headers
    });
    const data = await response.json().catch(() => ({}));
    if (typeof data?.teamCode === 'string') {
      saveTeamCodeHint(data.teamCode);
    }
    if (!response.ok || data?.ok === false) {
      const error = new Error(String(data?.error?.code || data?.error || `HTTP_${response.status}`));
      error.payload = data;
      throw error;
    }
    return data;
  }

  async function foremanApi(url, opts = {}) {
    const headers = {
      ...(opts.headers || {}),
      authorization: `Bearer ${foremanRuntimeToken}`
    };
    return api(url, { ...opts, headers });
  }

  function unwrapGatewayResult(result) {
    if (result && typeof result === 'object' && result.ok === true && result.data && typeof result.data === 'object') {
      return result.data;
    }
    return result && typeof result === 'object' ? result : null;
  }

  function resolveGatewayControlApi(gateway) {
    if (window.__openclawLiteTest && typeof window.__openclawLiteTest === 'object') {
      return window.__openclawLiteTest;
    }
    return gateway && typeof gateway === 'object' ? gateway : null;
  }

  function defaultProviderApi(provider) {
    const normalized = String(provider || '').trim().toLowerCase();
    if (normalized === 'openai' || normalized === 'openrouter' || normalized === 'ollama') {
      return 'openai-completions';
    }
    if (normalized === 'openai-codex') return 'openai-codex-responses';
    return '';
  }

  function defaultProviderBaseUrl(provider) {
    const normalized = String(provider || '').trim().toLowerCase();
    if (normalized === 'openai') {
      return new URL('/api/llm/openai/v1', window.location.origin).toString();
    }
    if (normalized === 'openrouter') {
      return 'https://openrouter.ai/api/v1';
    }
    if (normalized === 'ollama') {
      return 'http://127.0.0.1:11434/v1';
    }
    return '';
  }

  async function syncSharedLlmConfigToGateway(gateway) {
    const control = resolveGatewayControlApi(gateway);
    if (!control || typeof control.setLlmConfig !== 'function') return null;
    const lib = await loadLiteLlmLibrary().catch(() => null);
    if (!lib || typeof lib.loadLlmConfig !== 'function') return null;
    const config = await lib.loadLlmConfig().catch(() => null);
    if (!config?.configured) return null;
    const provider = String(config.provider || '').trim();
    const model = String(config.model || '').trim();
    const modelRef = String(config.modelRef || (provider && model ? `${provider}/${model}` : '')).trim();
    const apiKey = String(config.apiKey || '').trim();
    if (!provider || !model || !modelRef || !apiKey) return null;
    return await control.setLlmConfig({
      provider,
      modelRef,
      modelId: model,
      apiKey,
      api: defaultProviderApi(provider),
      baseUrl: defaultProviderBaseUrl(provider),
      reasoning: String(config.reasoning || '').trim(),
      useProxy: config.useProxy !== false
    });
  }

  async function mirrorForemanPackDocToWorker(gateway, { siteRoot = '', workspaceName = '', content = '' } = {}) {
    const control = resolveGatewayControlApi(gateway);
    const normalizedName = String(workspaceName || '').trim();
    const normalizedContent = typeof content === 'string' ? content : '';
    if (!control || typeof control.workspaceWriteFile !== 'function' || !normalizedName || !normalizedContent.trim()) {
      return false;
    }
    const normalizedSiteRoot = String(siteRoot || '').trim();
    const targets = new Set([`workspace/${normalizedName}`]);
    if (normalizedSiteRoot.startsWith('workspace/skills/')) {
      targets.add(`${normalizedSiteRoot.replace(/\/+$/, '')}/${normalizedName}`);
    }
    for (const path of targets) {
      await control.workspaceWriteFile({ path, content: normalizedContent });
    }
    return true;
  }

  async function syncForemanPackDocsToWorker(gateway) {
    const packState = {
      heartbeatLoaded: false,
      toolsLoaded: false,
      goalsLoaded: false,
      safetyLoaded: false
    };
    if (!gateway) return packState;
    const control = resolveGatewayControlApi(gateway);
    const skillState = control && typeof control.skillState === 'function'
      ? await control.skillState().catch(() => null)
      : null;
    const skillData = unwrapGatewayResult(skillState);
    const siteRoot = String(skillData?.siteRoot || '').trim();

    const results = await Promise.all(FOREMAN_PACK_DOCS.map(async (doc) => {
      try {
        const text = await apiText(doc.url);
        const loaded = typeof text === 'string' && text.trim().length > 0;
        if (loaded) {
          await mirrorForemanPackDocToWorker(gateway, {
            siteRoot,
            workspaceName: doc.workspaceName,
            content: text
          });
        }
        return [doc.key, loaded];
      } catch {
        return [doc.key, false];
      }
    }));

    for (const [key, loaded] of results) {
      packState[`${key}Loaded`] = loaded === true;
    }
    return packState;
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function htmlEscape(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function prettyGoalOwner(owner) {
    switch (String(owner || '').toLowerCase()) {
      case 'approval':
        return 'Needs your say-so';
      case 'contract_ready':
      case 'contract_progress':
        return 'Active contract';
      case 'landmark':
        return 'Town square';
      case 'identity':
        return 'Town style';
      case 'receipt':
        return 'Latest receipt';
      case 'optimization':
        return 'Town stability';
      default:
        return 'Tutorial';
    }
  }

  function prettyStandingOrder(order) {
    return String(order || '').toUpperCase() === 'BOLD_FOUNDER' ? 'Bold Founder' : 'Careful Steward';
  }

  function standingOrderSummary(order) {
    return String(order || '').toUpperCase() === 'BOLD_FOUNDER'
      ? 'Push growth when the move is still safe.'
      : 'Protect supplies and ask before spending.';
  }

  function doctrineRuleLabel(ruleId) {
    switch (String(ruleId || '').trim().toUpperCase()) {
      case 'PREFER_RESERVES':
        return 'Prefer reserves';
      case 'PREFER_SPEED':
        return 'Prefer speed';
      case 'ASK_BEFORE_SPENDING':
        return 'Ask before spending';
      case 'FINISH_ACTIVE_CONTRACTS_FIRST':
        return 'Finish contracts first';
      default:
        return 'Clover preference';
    }
  }

  function specialistRoleLabel(roleId) {
    switch (String(roleId || '').trim().toUpperCase()) {
      case 'BUILDER_FOREMAN':
        return 'Builder Foreman';
      case 'QUARTERMASTER':
        return 'Quartermaster';
      default:
        return 'Specialist';
    }
  }

  function specialistDomainLabel(domainId) {
    switch (String(domainId || '').trim().toLowerCase()) {
      case 'construction':
        return 'Construction';
      case 'supplies':
        return 'Supplies';
      case 'contracts':
        return 'Contracts';
      case 'public_works':
        return 'Public Works';
      default:
        return 'Unassigned';
    }
  }

  function specialistToolSummary(domain = {}) {
    const domainId = String(domain.domainId || '').trim().toLowerCase();
    if (domainId === 'construction') return 'Placement and upgrades';
    if (domainId === 'supplies') return 'Queues and collection';
    if (domainId === 'contracts') return 'Accept and turn in';
    if (domainId === 'public_works') return 'Square and civic work';
    return domain.summary || 'Bounded lane';
  }

  function brainModeLabel(access = buildFoundersAccessState()) {
    const mode = String(access?.foundersPlot?.mode || '').toUpperCase();
    if (mode === 'OFFICIAL_TOWN') return 'Official Founder';
    if (mode === 'REAL_CLOVER') return 'Real Clover Foreman';
    if (mode === 'PREVIEW_CLOVER') return 'Preview Clover';
    return 'Manual Founder Mode';
  }

  function brainModeCopy(access = buildFoundersAccessState()) {
    const mode = String(access?.foundersPlot?.mode || '').toUpperCase();
    if (mode === 'OFFICIAL_TOWN') {
      return 'Your town identity is set. Clover can use your configured Brain when enabled.';
    }
    if (mode === 'REAL_CLOVER') {
      return 'Clover is ready. Your Brain is connected, and Clover can act through approved tools.';
    }
    if (mode === 'PREVIEW_CLOVER') {
      return 'Preview guidance is available. Real Clover actions require a production Brain.';
    }
    return 'You can build manually now. Clover will guide the basics. Connect a Brain when you want Clover to reason and act as your Foreman.';
  }

  function townHallInviteCopy(state = stateData()) {
    const access = buildFoundersAccessState(state);
    if (access?.townHall?.complete === true || access?.townHall?.recommended !== true) return '';
    return 'Your settlement is growing. Visit Town Hall to set your public role.';
  }

  function renderBrainVaultRestoreCard() {
    if (sharedBrainStatus.configured === true || brainVaultStatus.available !== true) return '';
    const metadata = brainVaultStatus.vault?.metadata || {};
    const label = metadata.label || 'Saved Brain vault';
    return `
      <div class="foundersBrainVaultRestore" data-testid="brain-vault-restore-prompt">
        <div>
          <strong>Restore saved Brain</strong>
          <div class="small">${htmlEscape(label)} is available for this account. Unlock it before Clover can use it.</div>
        </div>
        <button class="btn primary small" type="button" id="foundersBrainVaultRestoreBtn" data-testid="brain-vault-restore">Unlock</button>
      </div>
    `;
  }

  function renderBrainQuickConnectCard() {
    const provider = sharedBrainStatus.provider || 'openrouter';
    const model = sharedBrainStatus.model || defaultBrainModel(provider);
    return `
      <div class="foundersBrainQuickConnect" data-testid="brain-quick-connect-sheet">
        <div class="foundersLabel">Brain Quick Connect</div>
        <strong>Connect a Brain</strong>
        <div class="small">Let Clover reason about your town and help with approved actions.</div>
        <div class="foundersBrainLoginPath" data-testid="brain-chatgpt-login-card">
          <div>
            <strong>Use your ChatGPT subscription</strong>
            <div class="small">Log in once, then Clover can use this Brain for approved Foreman actions.</div>
          </div>
          <div class="foundersInlineButtons">
            <button class="btn primary small" type="button" id="foundersChatGptLoginBtn" data-testid="brain-chatgpt-login">Log in with ChatGPT</button>
            <button class="btn small" type="button" id="foundersChatGptCompleteBtn" data-testid="brain-chatgpt-complete">Check login</button>
          </div>
          <div class="small" id="foundersChatGptLoginStatus" data-testid="brain-chatgpt-status"></div>
        </div>
        <div class="foundersBrainQuickDivider"><span>or use another Brain</span></div>
        <div class="foundersBrainQuickFields">
          <label class="small" for="foundersBrainProvider">Provider</label>
          <select id="foundersBrainProvider" data-testid="brain-quick-provider">
            <option value="openrouter" ${provider === 'openrouter' ? 'selected' : ''}>OpenRouter</option>
            <option value="openai" ${provider === 'openai' ? 'selected' : ''}>OpenAI</option>
            <option value="openai-codex" ${provider === 'openai-codex' ? 'selected' : ''}>ChatGPT</option>
            <option value="ollama" ${provider === 'ollama' ? 'selected' : ''}>Ollama</option>
          </select>
          <label class="small" for="foundersBrainModel">Model</label>
          <input id="foundersBrainModel" data-testid="brain-quick-model" type="text" value="${htmlEscape(model)}" />
          <label class="small" for="foundersBrainKey">Local key</label>
          <input id="foundersBrainKey" data-testid="brain-quick-key" type="password" autocomplete="off" placeholder="Stored only in this browser" />
          <label class="small" for="foundersBrainVaultPassphrase">Vault passphrase</label>
          <input id="foundersBrainVaultPassphrase" data-testid="brain-vault-passphrase" type="password" autocomplete="off" placeholder="Unlock or save vault" />
        </div>
        <div class="foundersInlineButtons">
          <button class="btn primary small" type="button" id="foundersBrainSaveBtn" data-testid="brain-quick-save">Save Brain</button>
          <button class="btn small" type="button" id="foundersBrainVaultSaveBtn" data-testid="brain-vault-save" ${sharedBrainStatus.configured ? '' : 'disabled'}>Save Vault</button>
          <a class="btn small" href="/app?district=brain&entry=brain-settings" target="_top" rel="noopener">Full settings</a>
        </div>
        ${renderBrainVaultRestoreCard()}
        <div class="small" id="foundersBrainQuickStatus" data-testid="brain-quick-status"></div>
      </div>
    `;
  }

  function renderBrainVaultSaveCard() {
    const metadata = brainVaultStatus.vault?.metadata || {};
    const savedLabel = brainVaultStatus.available === true
      ? `Saved vault: ${metadata.label || 'Brain vault'}`
      : 'No saved vault for this account yet.';
    return `
      <div class="foundersBrainQuickConnect" data-testid="brain-vault-save-sheet">
        <div class="foundersLabel">Brain Vault</div>
        <strong>Save this Brain for account restore</strong>
        <div class="small">${htmlEscape(savedLabel)}</div>
        <div class="foundersBrainQuickFields">
          <label class="small" for="foundersBrainVaultPassphrase">Vault passphrase</label>
          <input id="foundersBrainVaultPassphrase" data-testid="brain-vault-passphrase" type="password" autocomplete="off" placeholder="Required to unlock later" />
        </div>
        <div class="foundersInlineButtons">
          <button class="btn small" type="button" id="foundersBrainVaultSaveBtn" data-testid="brain-vault-save">Save Vault</button>
        </div>
        <div class="small" id="foundersBrainQuickStatus" data-testid="brain-quick-status"></div>
      </div>
    `;
  }

  function bindBrainQuickConnectCard(root = document) {
    const providerSelect = root.querySelector('#foundersBrainProvider');
    const modelInput = root.querySelector('#foundersBrainModel');
    const keyInput = root.querySelector('#foundersBrainKey');
    const vaultPassphraseInput = root.querySelector('#foundersBrainVaultPassphrase');
    const saveBtn = root.querySelector('#foundersBrainSaveBtn');
    const vaultSaveBtn = root.querySelector('#foundersBrainVaultSaveBtn');
    const vaultRestoreBtn = root.querySelector('#foundersBrainVaultRestoreBtn');
    const status = root.querySelector('#foundersBrainQuickStatus');
    const chatGptBtn = root.querySelector('#foundersChatGptLoginBtn');
    const chatGptCompleteBtn = root.querySelector('#foundersChatGptCompleteBtn');
    const chatGptStatus = root.querySelector('#foundersChatGptLoginStatus');
    if (chatGptBtn && chatGptBtn.dataset.bound !== '1') {
      chatGptBtn.dataset.bound = '1';
      chatGptBtn.addEventListener('click', async () => {
        chatGptBtn.disabled = true;
        if (chatGptStatus) chatGptStatus.textContent = 'Opening ChatGPT login...';
        try {
          await launchFoundersChatGptLogin();
        } catch (error) {
          const code = String(error?.message || 'UNKNOWN');
          if (chatGptStatus) {
            chatGptStatus.textContent = code === 'POPUP_BLOCKED'
              ? 'Your browser blocked the login tab. Allow popups and try again.'
              : `Could not start ChatGPT login: ${code}`;
          }
        } finally {
          chatGptBtn.disabled = false;
        }
      });
    }
    if (chatGptCompleteBtn && chatGptCompleteBtn.dataset.bound !== '1') {
      chatGptCompleteBtn.dataset.bound = '1';
      chatGptCompleteBtn.addEventListener('click', async () => {
        chatGptCompleteBtn.disabled = true;
        if (chatGptStatus) chatGptStatus.textContent = 'Checking ChatGPT login...';
        try {
          await completeFoundersChatGptLogin({ callbackInput: '' });
        } catch {
          // Player-facing status is already set by the login helper.
        } finally {
          chatGptCompleteBtn.disabled = false;
        }
      });
    }
    if (vaultSaveBtn && vaultSaveBtn.dataset.bound !== '1') {
      vaultSaveBtn.dataset.bound = '1';
      vaultSaveBtn.addEventListener('click', async () => {
        const passphrase = String(vaultPassphraseInput?.value || '');
        vaultSaveBtn.disabled = true;
        if (status) status.textContent = 'Saving encrypted Brain vault...';
        try {
          const lib = await loadBrainVaultLibrary();
          if (!lib || typeof lib.backupCurrentBrainVault !== 'function') throw new Error('BRAIN_VAULT_UNAVAILABLE');
          await lib.backupCurrentBrainVault(passphrase, {
            agentBackup: {
              schemaVersion: 1,
              agentName: 'Clover',
              packRefs: ['skill.md', 'heartbeat.md', 'tools.md', 'goals.md'],
              checkpointSummary: 'Founders Plot Foreman setup can be restored after account recovery.',
              safeSettings: {
                foremanMode: brainModeLabel()
              }
            }
          });
          await refreshBrainVaultStatus({ render: false });
          if (status) status.textContent = 'Encrypted Brain vault saved. Keep the passphrase to unlock it on another browser.';
        } catch (error) {
          if (status) status.textContent = `Could not save vault: ${String(error?.message || 'UNKNOWN')}`;
        } finally {
          vaultSaveBtn.disabled = sharedBrainStatus.configured !== true;
        }
      });
    }
    if (vaultRestoreBtn && vaultRestoreBtn.dataset.bound !== '1') {
      vaultRestoreBtn.dataset.bound = '1';
      vaultRestoreBtn.addEventListener('click', async () => {
        const passphrase = String(vaultPassphraseInput?.value || '');
        vaultRestoreBtn.disabled = true;
        if (status) status.textContent = 'Unlocking Brain vault...';
        try {
          const lib = await loadBrainVaultLibrary();
          if (!lib || typeof lib.restoreBrainVault !== 'function') throw new Error('BRAIN_VAULT_UNAVAILABLE');
          await lib.restoreBrainVault(passphrase, { confirm: true });
          await refreshSharedBrainStatus({ render: false });
          await refreshBrainVaultStatus({ render: false });
          await stopWorkerScheduler('BRAIN_CONFIG_CHANGED').catch(() => null);
          foremanRuntimeToken = '';
          localForemanRuntimeId = '';
          await loadState().catch(() => null);
          setStatusLine('Brain vault unlocked. Start Clover when you want Foreman help.');
          renderAll();
        } catch (error) {
          if (status) status.textContent = `Could not unlock vault: ${String(error?.message || 'UNKNOWN')}`;
        } finally {
          vaultRestoreBtn.disabled = false;
        }
      });
    }
    if (providerSelect && modelInput && providerSelect.dataset.bound !== '1') {
      providerSelect.dataset.bound = '1';
      providerSelect.addEventListener('change', () => {
        const nextProvider = String(providerSelect.value || '').trim();
        if (!String(modelInput.value || '').trim()) {
          modelInput.value = defaultBrainModel(nextProvider);
        }
      });
    }
    if (!saveBtn || saveBtn.dataset.bound === '1') return;
    saveBtn.dataset.bound = '1';
    saveBtn.addEventListener('click', async () => {
      const provider = String(providerSelect?.value || '').trim();
      const model = String(modelInput?.value || '').trim() || defaultBrainModel(provider);
      const apiKey = String(keyInput?.value || '').trim();
      if (!provider || !model || !apiKey) {
        if (status) status.textContent = 'Add a provider, model, and local key to connect a Brain.';
        return;
      }
      saveBtn.disabled = true;
      if (status) status.textContent = 'Saving Brain locally...';
      try {
        const lib = await loadLiteLlmLibrary();
        if (!lib || typeof lib.saveLlmConfig !== 'function') throw new Error('BRAIN_CONFIG_UNAVAILABLE');
        await lib.saveLlmConfig({ provider, model, apiKey, authMode: 'api-key' });
        await refreshSharedBrainStatus({ render: false });
        await refreshBrainVaultStatus({ render: false });
        if (sharedBrainStatus.realReady === true) {
          if (status) status.textContent = 'Brain connected. Clover can now use approved Foreman tools when started.';
          setStatusLine('Brain connected. Start Clover when you want Foreman help.');
        } else {
          if (status) status.textContent = 'Preview Brain saved. You can keep playing manually; Real Clover needs a production Brain.';
          setStatusLine('Preview Brain saved. Manual play stays available.');
        }
        await stopWorkerScheduler('BRAIN_CONFIG_CHANGED').catch(() => null);
        foremanRuntimeToken = '';
        localForemanRuntimeId = '';
        await loadState().catch(() => null);
        renderAll();
      } catch (error) {
        if (status) status.textContent = `Could not save Brain: ${String(error?.message || 'UNKNOWN')}`;
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  function prettyContractStatus(status) {
    return String(status || '')
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (match) => match.toUpperCase());
  }

  function formatResourceList(values = {}) {
    const order = ['wood', 'stone', 'food', 'coin', 'townXp'];
    const labels = {
      wood: 'wood',
      stone: 'stone',
      food: 'food',
      coin: 'coin',
      townXp: 'Town XP'
    };
    return order
      .filter((key) => Number(values?.[key] || 0) > 0)
      .map((key) => `${Number(values[key])} ${labels[key]}`)
      .join(', ');
  }

  function contractRequesterDisplay(contract) {
    return String(contract?.requesterSnapshot?.displayName || contract?.requester || 'Town request');
  }

  function contractInstitutionDisplay(contract) {
    return String(contract?.requesterSnapshot?.institution || contract?.institution || 'Founders Plot');
  }

  function formatSignalDelta(values = {}) {
    const labels = {
      depotReadiness: 'Depot Readiness',
      marketConfidence: 'Market Confidence',
      neighborGoodwill: 'Neighbor Goodwill',
      publicCharm: 'Public Charm'
    };
    return ['depotReadiness', 'marketConfidence', 'neighborGoodwill', 'publicCharm']
      .filter((key) => Number(values?.[key] || 0) !== 0)
      .map((key) => `${Number(values[key]) > 0 ? '+' : ''}${Number(values[key])} ${labels[key]}`)
      .join(', ');
  }

  function canAffordResources(state, cost = {}) {
    const inventory = state?.plot?.inventory || {};
    return ['wood', 'stone', 'food', 'coin'].every((key) => Number(cost?.[key] || 0) <= Number(inventory?.[key] || 0));
  }

  function missingResources(state, cost = {}) {
    const inventory = state?.plot?.inventory || {};
    return ['wood', 'stone', 'food', 'coin'].reduce((missing, key) => {
      const need = Number(cost?.[key] || 0);
      const have = Number(inventory?.[key] || 0);
      if (need > have) missing[key] = need - have;
      return missing;
    }, {});
  }

  function normalizedBuildingCatalog(state) {
    const catalog = Array.isArray(state?.unlocks?.buildingCatalog) ? state.unlocks.buildingCatalog : [];
    if (catalog.length > 0) {
      return catalog
        .filter((entry) => entry?.type && entry.type !== 'HQ')
        .map((entry) => {
          const buildCost = entry.buildCost && typeof entry.buildCost === 'object' ? entry.buildCost : {};
          const missing = entry.missing && typeof entry.missing === 'object'
            ? entry.missing
            : missingResources(state, buildCost);
          const unlocked = entry.unlocked === true;
          return {
            type: String(entry.type),
            label: String(entry.label || BUILDING_LABELS[entry.type] || entry.type),
            unlockLevel: Number(entry.unlockLevel || BUILDING_UNLOCK_LEVELS[entry.type] || 1),
            buildCost,
            unlocked,
            affordable: unlocked && entry.affordable !== false && Object.keys(missing).length === 0,
            missing
          };
        });
    }

    const unlockedTypes = new Set(Array.isArray(state?.unlocks?.buildingTypes) ? state.unlocks.buildingTypes : []);
    const hqLevel = Number(state?.plot?.hqLevel || state?.progress?.currentLevel || 1);
    return Object.keys(BUILDING_LABELS)
      .filter((type) => type !== 'HQ')
      .map((type) => {
        const unlockLevel = BUILDING_UNLOCK_LEVELS[type] || 1;
        const unlocked = unlockedTypes.has(type) || hqLevel >= unlockLevel;
        return {
          type,
          label: BUILDING_LABELS[type] || type,
          unlockLevel,
          buildCost: {},
          unlocked,
          affordable: unlocked,
          missing: {}
        };
      });
  }

  function buildingCatalogEntry(state, type) {
    const safeType = String(type || '');
    return normalizedBuildingCatalog(state).find((entry) => entry.type === safeType) || {
      type: safeType,
      label: BUILDING_LABELS[safeType] || safeType,
      unlockLevel: BUILDING_UNLOCK_LEVELS[safeType] || 1,
      buildCost: {},
      unlocked: (state?.unlocks?.buildingTypes || []).includes(safeType),
      affordable: true,
      missing: {}
    };
  }

  function visibleBuildCatalog(state, { includeNextLocked = false } = {}) {
    const catalog = normalizedBuildingCatalog(state);
    const visible = catalog.filter((entry) => entry.unlocked);
    if (includeNextLocked) {
      const nextLocked = catalog.find((entry) => !entry.unlocked);
      if (nextLocked) visible.push(nextLocked);
    }
    return visible;
  }

  function buildingCostText(entry) {
    const text = formatResourceList(entry?.buildCost || {});
    return text ? `Cost ${text}` : 'Free build';
  }

  function buildingBlockedText(entry) {
    if (!entry?.unlocked) return `Unlocks at HQ ${Number(entry?.unlockLevel || 1)}`;
    const missingText = formatResourceList(entry?.missing || {});
    return missingText ? `Needs ${missingText}` : '';
  }

  function buildingActionDetail(entry) {
    return buildingBlockedText(entry) || buildingCostText(entry);
  }

  function formatOpportunityReward(option = {}) {
    const parts = [];
    const townXp = Number(option?.reward?.townXp || 0);
    const resourceText = formatResourceList(option?.reward?.resources || {});
    const signalText = formatSignalDelta(option?.signalDelta || {});
    if (townXp > 0) parts.push(`+${townXp} Town XP`);
    if (resourceText) parts.push(`+${resourceText}`);
    if (signalText) parts.push(signalText);
    return parts.join('; ');
  }

  function formatScenarioReward(scenario = {}) {
    const reward = scenario?.reward || {};
    const parts = [];
    const townXp = Number(reward?.townXp || 0);
    const resourceText = formatResourceList(reward?.resources || {});
    const signalText = formatSignalDelta(reward?.signalDelta || {});
    if (townXp > 0) parts.push(`+${townXp} Town XP`);
    if (resourceText) parts.push(`+${resourceText}`);
    if (signalText) parts.push(signalText);
    return parts.join('; ');
  }

  function scenarioProgressText(scenario = {}) {
    return `${Number(scenario?.completedTasks || 0)} / ${Number(scenario?.minCompletedTasks || 0)} prep tasks`;
  }

  function formatCloverTradeoff(option = {}) {
    const pro = String(option?.cloverTradeoff?.pro || '').trim();
    const con = String(option?.cloverTradeoff?.con || '').trim();
    if (pro && con) return `Clover: ${pro} Tradeoff: ${con}`;
    if (pro) return `Clover: ${pro}`;
    if (con) return `Tradeoff: ${con}`;
    return '';
  }

  function formatContractRequirements(contract) {
    const requirements = contract?.requirements || {};
    const buildingRequirements = Array.isArray(requirements.buildings) ? requirements.buildings : [];
    if (buildingRequirements.length > 0) {
      return buildingRequirements
        .map((entry) => `Build ${Number(entry?.minCount || 1)} ${BUILDING_LABELS[entry?.buildingType] || entry?.buildingType}.`)
        .join(' ');
    }
    const resourceText = formatResourceList(requirements.resources || requirements);
    return resourceText ? `Deliver ${resourceText}.` : 'No listed requirement.';
  }

  function formatContractRewards(contract) {
    const rewards = contract?.rewards || {};
    const rewardText = formatResourceList(rewards.resources || rewards);
    const signalText = formatSignalDelta(rewards.signalDelta || {});
    const parts = [];
    if (rewardText) parts.push(`Rewards: ${rewardText}.`);
    if (Number(rewards.townXp || 0) > 0) parts.push(`Adds ${Number(rewards.townXp)} Town XP.`);
    if (signalText) parts.push(`Town change: ${signalText}.`);
    return parts.length > 0 ? parts.join(' ') : 'No listed reward.';
  }

  function teachingCorrectionLabel(correction) {
    switch (String(correction || '').trim().toUpperCase()) {
      case 'DO_THIS_AGAIN':
        return 'Do this again';
      case 'ASK_ME_FIRST':
        return 'Ask me first';
      case 'PREFER_RESERVES':
        return 'Prefer reserves';
      case 'PREFER_SPEED':
        return 'Prefer speed';
      default:
        return 'No teaching preference yet';
    }
  }

  function signalBandLabel(band) {
    switch (String(band || '').toUpperCase()) {
      case 'LOW':
        return 'Low';
      case 'STRONG':
        return 'Strong';
      default:
        return 'Steady';
    }
  }

  function signalList(state) {
    const townSignals = state?.townSignals || {};
    const labels = townSignals.labels || {};
    const bands = townSignals.bands || {};
    return ['depotReadiness', 'marketConfidence', 'neighborGoodwill', 'publicCharm'].map((key) => ({
      key,
      label: labels[key] || key,
      value: Number(townSignals[key] || 0),
      band: String(bands[key] || 'STEADY')
    }));
  }

  function foremanStatusMeta(status) {
    switch (String(status || 'NOT_STARTED').toUpperCase()) {
      case 'BOOTING':
        return { label: 'Foreman saddling up', tone: 'good' };
      case 'OBSERVING':
        return { label: 'Foreman watching', tone: 'good' };
      case 'THINKING':
        return { label: 'Foreman thinking', tone: 'good' };
      case 'WAITING_FOR_PERMISSION':
        return { label: 'Needs your say-so', tone: 'warn' };
      case 'ACTING':
        return { label: 'Foreman working', tone: 'good' };
      case 'PAUSED':
        return { label: 'Foreman paused', tone: 'warn' };
      case 'STALE':
        return { label: 'Foreman lost the trail', tone: 'warn' };
      case 'ERROR':
        return { label: 'Foreman needs help', tone: 'warn' };
      default:
        return { label: 'Foreman not started', tone: 'warn' };
    }
  }

  function formatDuration(endsAt) {
    const remainingMs = Math.max(0, Number(endsAt || 0) - Date.now());
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes <= 0) return `${seconds}s`;
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }

  function stateData() {
    return currentState && currentState.state ? currentState.state : null;
  }

  function normalizeWorkerSchedulerStatus(value = {}) {
    return {
      active: value?.active === true,
      taskKind: String(value?.taskKind || 'COLLECT_READY_OUTPUTS'),
      tickRunning: value?.tickRunning === true,
      nextRunAtMs: Number(value?.nextRunAtMs || 0),
      lastRunAtMs: Number(value?.lastRunAtMs || 0),
      lastStatus: String(value?.lastStatus || 'STOPPED'),
      lastErrorCode: String(value?.lastErrorCode || ''),
      consecutiveErrors: Number(value?.consecutiveErrors || 0),
      hasToken: value?.hasToken === true,
      lastStopReason: String(value?.lastStopReason || '')
    };
  }

  function localForemanRuntimeStatus(serverRuntime = {}) {
    const serverRuntimeId = String(serverRuntime?.runtimeId || '');
    const localRuntimeId = String(localForemanRuntimeId || '');
    const hasServerRuntime = !!serverRuntimeId;
    const hasLocalToken = !!foremanRuntimeToken && localRuntimeId === serverRuntimeId;
    const serverStatus = String(serverRuntime?.status || 'NOT_STARTED').toUpperCase();
    const expiresAt = Number(serverRuntime?.expiresAt || 0);
    const expired = expiresAt > 0 && expiresAt <= Date.now();
    const serverHealthy = ['BOOTING', 'OBSERVING', 'THINKING', 'ACTING'].includes(serverStatus) && !expired;
    const needsRestart = hasServerRuntime && ((!hasLocalToken && serverHealthy) || expired);
    const actionable = hasServerRuntime && hasLocalToken && serverHealthy;
    return {
      hasServerRuntime,
      hasLocalToken,
      expired,
      expiresAt,
      needsRestart,
      actionable,
      serverStatus,
      serverRuntimeId,
      localRuntimeId
    };
  }

  function findBuilding(buildingId) {
    return stateData()?.buildings?.find((building) => building.buildingId === buildingId) || null;
  }

  function findSelected() {
    const state = stateData();
    if (!state) return null;
    if (selectedKey === 'hq') {
      return state.buildings.find((building) => building.type === 'HQ') || null;
    }
    if (selectedKey.startsWith('building:')) {
      return findBuilding(selectedKey.slice('building:'.length));
    }
    return null;
  }

  function emptyPadFromSelection() {
    const state = stateData();
    if (!state) return null;
    if (selectedKey.startsWith('pad:')) {
      const [xText, yText] = selectedKey.slice('pad:'.length).split(',');
      const x = Number(xText);
      const y = Number(yText);
      return state.pads.find((pad) => pad.x === x && pad.y === y && !pad.occupied) || null;
    }
    return null;
  }

  function firstEmptyPad() {
    return stateData()?.pads?.find((pad) => !pad.occupied) || null;
  }

  function buildingTypeForId(buildingId) {
    return findBuilding(buildingId)?.type || '';
  }

  function objectIdForBuildingId(buildingId) {
    const state = stateData();
    const building = findBuilding(buildingId);
    if (!building) return '';
    if (String(building.type || '').toUpperCase() === 'HQ') return 'HQ';
    const sameTypeCount = Array.isArray(state?.buildings)
      ? state.buildings.filter((entry) => String(entry?.type || '') === String(building.type || '')).length
      : 0;
    return sameTypeCount > 1 && building.buildingId
      ? `${building.type}:${building.buildingId}`
      : String(buildingTypeForId(buildingId) || '');
  }

  function objectIdForCandidateId(candidateId) {
    const raw = String(candidateId || '');
    if (!raw) return '';
    if (raw.startsWith('collect:')) return objectIdForBuildingId(raw.slice('collect:'.length));
    return '';
  }

  function setLastActionTarget(objectId) {
    lastActionTargetObjectId = String(objectId || '');
  }

  function roadmapFeatureEnabled(featureKey = '', state = stateData()) {
    if (!featureKey) return true;
    return state?.featureFlags?.[featureKey] === true;
  }

  function drawerFeatureEnabled(drawerKey = '', state = stateData()) {
    return roadmapFeatureEnabled(FUTURE_DRAWER_FEATURES[String(drawerKey || '')] || '', state);
  }

  function analyticsEnabled() {
    return typeof window !== 'undefined';
  }

  function trackedEventCount(name = '') {
    return analyticsEvents.filter((event) => event.name === name).length;
  }

  function trackFoundersEvent(name = '', payload = {}, options = {}) {
    const eventName = String(name || '').trim();
    if (!eventName || !analyticsEnabled()) return null;
    const seenKey = options.key ? `${eventName}:${String(options.key || '')}` : options.once === true ? eventName : '';
    if (seenKey && analyticsSeen.has(seenKey)) return null;
    if (seenKey) analyticsSeen.add(seenKey);
    const event = {
      name: eventName,
      atMs: Date.now(),
      plotId: String(stateData()?.plot?.plotId || ''),
      hqLevel: Number(stateData()?.plot?.hqLevel || stateData()?.progress?.currentLevel || 1),
      ...payload
    };
    analyticsEvents = [...analyticsEvents, event].slice(-80);
    window.__foundersPlotAnalytics = analyticsEvents;
    try {
      window.localStorage?.setItem('foundersPlot:localAnalyticsEvents', JSON.stringify(analyticsEvents));
    } catch {
      // Local analytics are best-effort only.
    }
    return event;
  }

  function trackContractAccepted(contractId = '') {
    const id = String(contractId || '').trim();
    if (!id) return null;
    const event = trackFoundersEvent('founders.contract_offer_chosen', {
      contractId: id,
      count: trackedEventCount('founders.contract_offer_chosen') + 1
    }, { key: id });
    const completedCount = Array.isArray(stateData()?.contracts?.completed) ? stateData().contracts.completed.length : 0;
    if (event && (trackedEventCount('founders.contract_offer_chosen') >= 2 || completedCount >= 1)) {
      trackFoundersEvent('founders.second_contract_chosen', { contractId: id }, { once: true });
    }
    return event;
  }

  function trackContractCompleted(contractId = '') {
    const id = String(contractId || '').trim();
    if (!id) return null;
    return trackFoundersEvent('founders.contract_completed', { contractId: id }, { key: id });
  }

  function resetAnalyticsForTest() {
    analyticsEvents = [];
    analyticsSeen.clear();
    if (typeof window !== 'undefined') window.__foundersPlotAnalytics = analyticsEvents;
  }

  function maybeTrackStateAnalytics(state) {
    if (!state) return;
    const params = new URLSearchParams(window.location.search || '');
    if (params.get('entry') === 'play-first' || params.get('presentation') === 'fullscreen' || params.get('embed') === '1') {
      trackFoundersEvent('founders.entered_play_first', {
        entry: params.get('entry') || '',
        presentation: params.get('presentation') || '',
        embed: params.get('embed') || ''
      }, { once: true });
    }
    const buildings = Array.isArray(state.buildings) ? state.buildings : [];
    if (buildings.some((building) => String(building?.type || '').toUpperCase() !== 'HQ')) {
      trackFoundersEvent('founders.first_building_placed', {}, { once: true });
    }
    const contracts = state.contracts || {};
    if ((Array.isArray(contracts.offers) && contracts.offers.length > 0) || contracts.activeContract) {
      trackFoundersEvent('founders.first_contract_viewed', {}, { once: true });
    }
    if (contracts.recommendation || state?.foreman?.recommendation || state?.foreman?.companionAdvice?.recommendation) {
      trackFoundersEvent('founders.clover_advice_seen', {}, { once: true });
    }
    if (contracts.activeContract?.contractId) {
      trackContractAccepted(contracts.activeContract.contractId);
    }
    const completedContracts = Array.isArray(contracts.completed) ? contracts.completed : [];
    for (const contract of completedContracts) {
      trackContractCompleted(contract?.contractId);
    }
  }

  function setActionTargetFromTool(toolName, args = {}) {
    switch (String(toolName || '')) {
      case 'et.plot.place_building':
        setLastActionTarget(String(args.type || ''));
        return;
      case 'et.plot.queue_job':
      case 'et.plot.collect_outputs':
      case 'et.plot.set_priority':
        setLastActionTarget(objectIdForBuildingId(args.buildingId));
        return;
      case 'et.plot.upgrade_building':
        setLastActionTarget(args.buildingId ? objectIdForBuildingId(args.buildingId) : 'HQ');
        return;
      case 'et.plot.town.upgrade_landmark':
      case 'et.plot.town.set_identity':
      case 'et.plot.town.resolve_opportunity':
        setLastActionTarget('PUBLIC_SQUARE');
        return;
      case 'et.plot.settlements.launch_expedition':
      case 'et.plot.settlements.focus':
      case 'et.plot.settlements.complete_founding_task':
      case 'et.plot.regional.open_supply_route':
      case 'et.plot.regional.transfer_supply_route':
      case 'et.plot.regional.accept_contract':
      case 'et.plot.regional.turn_in_contract':
        setLastActionTarget('GOVERNOR_LEDGER');
        return;
      case 'et.plot.operating_model.choose_charter':
      case 'et.plot.operating_model.unlock_capability':
      case 'et.plot.operating_model.refresh_contracts':
        setLastActionTarget('PUBLIC_SQUARE');
        return;
      case 'et.plot.creator.install_building':
      case 'et.plot.creator.disable_building':
      case 'et.plot.creator.remove_building':
      case 'et.creator.notice_kiosk.post_notice':
        setLastActionTarget('CREATOR_NOTICE_KIOSK');
        return;
      case 'et.foreman.specialists.assign':
      case 'et.foreman.specialists.pause':
      case 'et.foreman.specialists.review_recommendation':
        setLastActionTarget('FOREMAN_HUT');
        return;
      case 'et.plot.claim_reward':
        setLastActionTarget('PUBLIC_SQUARE');
        return;
      default:
        setLastActionTarget('');
    }
  }

  function currentDecisionTargetObjectId(state) {
    return objectIdForCandidateId(state?.foreman?.lastDecision?.chosenCandidateId || '');
  }

  function selectionExists(state) {
    if (!state) return false;
    if (selectedKey === 'hq') return true;
    if (selectedKey.startsWith('building:')) return !!findSelected();
    if (selectedKey.startsWith('pad:')) return !!emptyPadFromSelection();
    return false;
  }

  function openDrawer(drawerKey, options = {}) {
    activeDrawer = String(drawerKey || '');
    if (!activeDrawer) return;
    if (!drawerFeatureEnabled(activeDrawer)) {
      activeDrawer = '';
      return;
    }
    if (options.clearSelection !== false) {
      selectedKey = '';
    }
    if (activeDrawer === 'recap') {
      trackFoundersEvent('founders.morning_brief_opened', {}, { once: true });
      loadRecap().catch(() => {});
    }
    renderAll();
  }

  function applyScenePick(pick = {}) {
    const drawerKey = String(pick?.drawerKey || '').trim();
    if (drawerKey) {
      openDrawer(drawerKey);
      return true;
    }
    const nextSelection = String(pick?.selectionKey || '').trim();
    if (nextSelection) {
      selectedKey = nextSelection;
      activeDrawer = '';
      renderAll();
      return true;
    }
    const gridCellId = String(pick?.gridCellId || '').trim();
    if (gridCellId) {
      setStatusLine(pick?.locked ? 'That grid cell is not ready for building yet.' : 'Choose a highlighted plot space to build.');
      return true;
    }
    return false;
  }

  function scenePickFromNode(button, source = 'scene-dom-hook') {
    if (!(button instanceof HTMLElement)) return null;
    return {
      objectId: String(button.getAttribute('data-scene-object-id') || ''),
      selectionKey: String(button.getAttribute('data-selection-key') || ''),
      drawerKey: String(button.getAttribute('data-drawer-key') || ''),
      worldObjectId: String(button.getAttribute('data-world-object') || ''),
      testId: String(button.getAttribute('data-testid') || ''),
      source,
      activation: true,
      atMs: Date.now()
    };
  }

  function bindThreeScenePick(node) {
    if (!(node instanceof HTMLElement) || node.dataset.threePickBound === '1') return;
    node.dataset.threePickBound = '1';
    node.addEventListener('founders:three-pick', (event) => {
      const pick = event?.detail || null;
      if (!pick || pick.activation !== true) return;
      applyScenePick(pick);
    });
  }

  function closeDrawer() {
    activeDrawer = '';
    renderAll();
  }

  function focusPanel(id) {
    const node = document.getElementById(id);
    if (!node) return;
    const drawerById = {
      contractBoard: 'contracts',
      approvalsList: 'approvals',
      recapList: 'recap',
      journalList: 'journal',
      signalsPanel: 'signals'
    };
    const drawerKey = drawerById[id] || '';
    if (drawerKey) {
      openDrawer(drawerKey, { clearSelection: false });
      requestAnimationFrame(() => {
        const nextNode = document.getElementById(id);
        nextNode?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function setStatusLine(text) {
    setText('plotStatusLine', text);
  }

  function setQuestStatus(text) {
    setText('questStatusLine', text);
  }

  function clampSceneCoordinate(value, fallback = 0.5) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(0.08, Math.min(0.92, numeric));
  }

  function queueSummary(state) {
    const jobs = Array.isArray(state?.jobs) ? state.jobs.filter((job) => job.status === 'RUNNING') : [];
    if (jobs.length === 0) return 'No active jobs.';
    if (jobs.length === 1) {
      const building = findBuilding(jobs[0].buildingId);
      return `${BUILDING_LABELS[building?.type] || 'Building'} finishes in ${formatDuration(jobs[0].endsAt)}.`;
    }
    return `${jobs.length} jobs running across the plot.`;
  }

  function inventoryRows(state) {
    const next = state?.progress?.next || null;
    return [
      { key: 'wood', label: 'Wood', value: state?.plot?.inventory?.wood ?? 0, cap: state?.plot?.storageCaps?.wood ?? 0 },
      { key: 'stone', label: 'Stone', value: state?.plot?.inventory?.stone ?? 0, cap: state?.plot?.storageCaps?.stone ?? 0 },
      { key: 'food', label: 'Food', value: state?.plot?.inventory?.food ?? 0, cap: state?.plot?.storageCaps?.food ?? 0 },
      { key: 'coin', label: 'Coin', value: state?.plot?.inventory?.coin ?? 0, cap: null },
      { key: 'xp', label: 'Town XP', value: state?.plot?.townXp ?? 0, cap: next?.xpRequired ?? null }
    ];
  }

  function renderInventory(state) {
    const node = document.getElementById('inventoryStrip');
    if (!node) return;
    const shortLabel = (key) => {
      if (key === 'wood') return 'W';
      if (key === 'stone') return 'S';
      if (key === 'food') return 'F';
      if (key === 'coin') return 'C';
      if (key === 'xp') return 'XP';
      return String(key || '').slice(0, 2).toUpperCase();
    };
    node.innerHTML = inventoryRows(state).map((item) => {
      const meta = item.cap != null ? `${item.value} / ${item.cap}` : String(item.value);
      return `
        <div class="foundersInventoryItem" data-testid="inventory-${item.key}" aria-label="${htmlEscape(`${item.label} ${meta}`)}">
          <div class="foundersLabel">${htmlEscape(item.label)}</div>
          <div class="foundersInventoryShort" aria-hidden="true">${htmlEscape(shortLabel(item.key))}</div>
          <strong>${htmlEscape(meta)}</strong>
        </div>
      `;
    }).join('');
  }

  function renderBoard(state) {
    const node = document.getElementById('plotBoard');
    if (!node) return;
    const stageContainer = node.closest('[data-testid="founders-plot-stage"]');
    if (stageContainer instanceof HTMLElement) {
      stageContainer.dataset.activeDrawer = activeDrawer || '';
    }
    const sceneApi = window.FoundersPlotSceneState;
    const renderApi = window.FoundersPlotSceneRender;
    if (!sceneApi || !renderApi || typeof sceneApi.createSceneState !== 'function' || typeof renderApi.renderPlotStage !== 'function') {
      currentScene = null;
      node.innerHTML = '<div class="foundersEmptyState">Loading the town surface…</div>';
      return;
    }

    const scene = sceneApi.createSceneState(state, {
      selectedKey,
      activeDrawer,
      viewportWidth: window.innerWidth,
      localForemanRuntimeStatus: localForemanRuntimeStatus(state?.foreman?.runtime || {}),
      workerSchedulerStatus,
      manualForemanActing: Date.now() < manualForemanActingUntilMs,
      lastActionTargetObjectId: lastActionTargetObjectId || currentDecisionTargetObjectId(state)
    });
    currentScene = scene;
    renderApi.renderPlotStage(node, scene, { assetMap });
    bindThreeScenePick(node);
    renderSceneActionControls(node, state, scene);

    const drawerTray = document.getElementById('drawerTray');
    if (drawerTray && typeof renderApi.renderDrawerTray === 'function') {
      renderApi.renderDrawerTray(drawerTray, scene);
      const townHallInvite = townHallInviteCopy(state);
      if (townHallInvite) {
        const inviteButton = document.createElement('button');
        inviteButton.className = 'foundersTrayButton foundersTrayButton--official';
        inviteButton.type = 'button';
        inviteButton.setAttribute('data-testid', 'townhall-official-invite');
        inviteButton.innerHTML = `
          <span class="foundersTrayIcon foundersTrayIcon--official" aria-hidden="true"></span>
          <span class="foundersTrayLabel">Make it official</span>
        `;
        inviteButton.title = townHallInvite;
        inviteButton.addEventListener('click', () => {
          window.top.location.href = '/app?district=townhall&entry=make-official';
        });
        drawerTray.appendChild(inviteButton);
      }
      drawerTray.querySelectorAll('[data-drawer-trigger]').forEach((button) => {
        button.addEventListener('click', () => {
          const nextDrawer = button.getAttribute('data-drawer-trigger') || '';
          if (nextDrawer) {
            openDrawer(nextDrawer);
          }
        });
      });
    }

    node.querySelectorAll('[data-scene-object-id]').forEach((button) => {
      button.addEventListener('click', () => {
        applyScenePick(scenePickFromNode(button));
      });
    });

    const effectsLayer = document.getElementById('foundersEffectsLayer');
    if (!effectsController && window.FoundersPlotEffects?.createEffectsController) {
      effectsController = window.FoundersPlotEffects.createEffectsController();
    }
    effectsController?.sync({
      layerNode: effectsLayer,
      stageNode: node,
      nextState: state,
      scene
    });
  }

  function syncViewportScenePolicy() {
    if (!currentState?.state) return;
    if (viewportSyncTimer) {
      clearTimeout(viewportSyncTimer);
      viewportSyncTimer = null;
    }
    viewportSyncTimer = setTimeout(() => {
      viewportSyncTimer = null;
      renderAll();
    }, 80);
  }

  function actionButton(label, onClick, testId, disabled = false) {
    const button = document.createElement('button');
    button.className = 'btn small';
    button.type = 'button';
    button.textContent = label;
    if (testId) button.setAttribute('data-testid', testId);
    button.disabled = disabled || pendingAction;
    button.addEventListener('click', onClick);
    return button;
  }

  function sceneObject(scene, objectId) {
    return Array.isArray(scene?.objects)
      ? scene.objects.find((object) => String(object?.id || '') === String(objectId || '')) || null
      : null;
  }

  function padFromObjectId(state, objectId) {
    const raw = String(objectId || '');
    if (!raw.startsWith('PAD:')) return null;
    const [xText, yText] = raw.slice('PAD:'.length).split(',');
    const x = Number(xText);
    const y = Number(yText);
    return Array.isArray(state?.pads)
      ? state.pads.find((pad) => Number(pad?.x) === x && Number(pad?.y) === y && pad.occupied === false) || null
      : null;
  }

  function actionSafeId(value) {
    return String(value || 'action').replace(/[^a-z0-9_-]+/ig, '-').replace(/^-+|-+$/g, '') || 'action';
  }

  function addSceneAction(actions, action) {
    if (!action?.id || !action?.label || !action?.objectId) return;
    if (actions.some((entry) => entry.id === action.id)) return;
    actions.push(action);
  }

  function selectedBuildingForScene(scene, state) {
    const selectedObjectId = String(scene?.selectedObjectId || '');
    if (!selectedObjectId || selectedObjectId.startsWith('PAD:')) return null;
    const selectedObject = Array.isArray(scene?.objects)
      ? scene.objects.find((object) => String(object?.id || '') === selectedObjectId && String(object?.selectionKey || '').startsWith('building:')) || null
      : null;
    if (selectedObject) {
      const buildingId = String(selectedObject.selectionKey || '').slice('building:'.length);
      return Array.isArray(state?.buildings)
        ? state.buildings.find((building) => String(building?.buildingId || '') === buildingId) || null
        : null;
    }
    if (selectedObjectId === 'HQ') {
      return Array.isArray(state?.buildings) ? state.buildings.find((building) => building?.type === 'HQ') || null : null;
    }
    return Array.isArray(state?.buildings)
      ? state.buildings.find((building) => String(building?.type || '') === selectedObjectId || String(building?.buildingId || '') === selectedObjectId) || null
      : null;
  }

  function buildSceneActions(state, scene) {
    const actions = [];
    const selectedObjectId = String(scene?.selectedObjectId || '');
    const selectedPad = padFromObjectId(state, selectedObjectId);
    const selectedBuilding = selectedBuildingForScene(scene, state);
    const goalAction = state?.currentGoal?.primaryAction && typeof state.currentGoal.primaryAction === 'object'
      ? state.currentGoal.primaryAction
      : (state?.quest?.primaryAction && typeof state.quest.primaryAction === 'object' ? state.quest.primaryAction : null);
    const goalTargetId = String(scene?.currentGoal?.targetObjectId || '');
    const activeOpportunity = state?.townOpportunity?.active || null;
    const scenariosEnabled = roadmapFeatureEnabled('FEATURE_FOUNDERS_V16_SCENARIOS', state);
    const identityEnabled = roadmapFeatureEnabled('FEATURE_FOUNDERS_V17_TOWN_IDENTITY', state);
    const activeScenario = scenariosEnabled ? state?.scenarios?.active || null : null;
    const scenarioOffers = scenariosEnabled && Array.isArray(state?.scenarios?.offers) ? state.scenarios.offers : [];
    const publicSquare = state?.landmarks?.publicSquare || {};
    const publicSquareStyles = identityEnabled && Array.isArray(publicSquare.availableStyles) ? publicSquare.availableStyles : [];

    if (selectedPad) {
      for (const entry of visibleBuildCatalog(state)) {
        const disabledReason = buildingBlockedText(entry);
        addSceneAction(actions, {
          id: `place:${entry.type}:${selectedPad.x}:${selectedPad.y}`,
          kind: 'place',
          objectId: selectedObjectId,
          label: `Place ${entry.label}`,
          detail: buildingActionDetail(entry),
          disabledReason,
          buildingType: entry.type,
          x: selectedPad.x,
          y: selectedPad.y,
          testId: `founders-scene-action-place-${actionSafeId(entry.type)}`,
          disabled: disabledReason !== ''
        });
      }
      return actions;
    }

    if (activeScenario?.scenarioId) {
      const tasks = Array.isArray(activeScenario.tasks) ? activeScenario.tasks : [];
      for (const task of tasks.filter((entry) => entry.completed !== true)) {
        addSceneAction(actions, {
          id: `scenario-task:${task.taskId}`,
          kind: 'scenario-task',
          objectId: 'SCENARIO_SITE',
          label: task.label || 'Prep task',
          detail: formatResourceList(task.cost || {}) || 'No cost',
          advice: task.body || '',
          scenarioId: activeScenario.scenarioId,
          taskId: task.taskId,
          testId: `founders-scene-action-scenario-task-${actionSafeId(task.taskId)}`,
          disabled: !canAffordResources(state, task.cost || {})
        });
      }
      if (actions.length > 0) return actions;
    }

    if (!activeScenario && scenarioOffers.length > 0) {
      const offer = scenarioOffers[0];
      addSceneAction(actions, {
        id: `scenario-start:${offer.scenarioId}`,
        kind: 'scenario-start',
        objectId: 'SCENARIO_SITE',
        label: `Start ${offer.title || 'scenario'}`,
        detail: formatScenarioReward(offer) || 'Civic project',
        advice: offer.body || '',
        scenarioId: offer.scenarioId,
        testId: `founders-scene-action-scenario-start-${actionSafeId(offer.scenarioId)}`
      });
      return actions;
    }

    if (activeOpportunity?.opportunityId) {
      for (const option of Array.isArray(activeOpportunity.options) ? activeOpportunity.options : []) {
        addSceneAction(actions, {
          id: `town-option:${option.optionId}`,
          kind: 'town-option',
          objectId: 'PUBLIC_SQUARE',
          label: option.label || 'Choose town play',
          detail: formatOpportunityReward(option) || formatResourceList(option.cost || {}),
          advice: formatCloverTradeoff(option),
          opportunityId: activeOpportunity.opportunityId,
          optionId: option.optionId,
          testId: `founders-scene-action-town-option-${actionSafeId(option.optionId)}`,
          disabled: !canAffordResources(state, option.cost || {})
        });
      }
      return actions;
    }

    if (selectedObjectId === 'PUBLIC_SQUARE' && Number(publicSquare.level || 0) > 0 && publicSquareStyles.length > 0) {
      for (const style of publicSquareStyles) {
        addSceneAction(actions, {
          id: `town-style:${style.styleId}`,
          kind: 'town-style',
          objectId: 'PUBLIC_SQUARE',
          label: style.label || 'Town style',
          detail: style.ornament || 'Cosmetic',
          advice: style.body || 'Cosmetic only',
          styleId: style.styleId,
          testId: `founders-scene-action-town-style-${actionSafeId(style.styleId)}`,
          disabled: String(publicSquare.styleId || '') === String(style.styleId || '')
        });
      }
      addSceneAction(actions, {
        id: 'plot-card-generate',
        kind: 'plot-card',
        objectId: 'PUBLIC_SQUARE',
        label: 'Generate plot card',
        detail: publicSquare.styleLabel || 'Town card',
        testId: 'founders-scene-action-plot-card'
      });
      addSceneAction(actions, {
        id: 'postcard-capture',
        kind: 'postcard',
        objectId: 'PUBLIC_SQUARE',
        label: 'Capture postcard',
        detail: publicSquare.styleLabel || 'Town camera',
        testId: 'founders-scene-action-postcard'
      });
      return actions;
    }

    if (selectedBuilding) {
      const runningJob = selectedBuilding.runningJob || null;
      const completedJobs = Array.isArray(selectedBuilding.completedJobs) ? selectedBuilding.completedJobs : [];
      const selectedSceneObject = String(selectedBuilding.type || selectedObjectId);
      if (completedJobs.length > 0) {
        addSceneAction(actions, {
          id: `collect:${selectedBuilding.buildingId}`,
          kind: 'collect',
          objectId: selectedSceneObject,
          label: 'Collect outputs',
          detail: BUILDING_LABELS[selectedBuilding.type] || selectedBuilding.type,
          buildingId: selectedBuilding.buildingId,
          testId: 'founders-scene-action-collect'
        });
      } else if (!runningJob && selectedBuilding.type !== 'HQ' && selectedBuilding.state === 'READY') {
        addSceneAction(actions, {
          id: `queue:${selectedBuilding.buildingId}`,
          kind: 'queue',
          objectId: selectedSceneObject,
          label: selectedBuilding.type === 'MARKET_STALL' ? 'Queue market sale' : 'Queue job',
          detail: BUILDING_LABELS[selectedBuilding.type] || selectedBuilding.type,
          buildingId: selectedBuilding.buildingId,
          testId: 'founders-scene-action-queue'
        });
      }
      if (!runningJob && (UPGRADE_CAPS[selectedBuilding.type] || 1) > Number(selectedBuilding.level || 1)) {
        addSceneAction(actions, {
          id: `upgrade:${selectedBuilding.buildingId}`,
          kind: 'upgrade',
          objectId: selectedSceneObject,
          label: selectedBuilding.type === 'HQ' ? 'Upgrade Headquarters' : 'Upgrade building',
          detail: `Level ${selectedBuilding.level || 1}`,
          buildingId: selectedBuilding.type === 'HQ' ? '' : selectedBuilding.buildingId,
          testId: 'founders-scene-action-upgrade'
        });
      }
      return actions;
    }

    if (goalAction && goalTargetId) {
      if (goalAction.type === 'PLACE_BUILDING') {
        const pad = padFromObjectId(state, goalTargetId);
        if (pad) {
          const entry = buildingCatalogEntry(state, goalAction.buildingType);
          const disabledReason = buildingBlockedText(entry);
          addSceneAction(actions, {
            id: `goal-place:${goalAction.buildingType}:${pad.x}:${pad.y}`,
            kind: 'place',
            objectId: goalTargetId,
            label: `Place ${entry.label}`,
            detail: buildingActionDetail(entry),
            disabledReason,
            buildingType: goalAction.buildingType,
            x: pad.x,
            y: pad.y,
            testId: `founders-scene-action-place-${actionSafeId(goalAction.buildingType)}`,
            disabled: disabledReason !== ''
          });
        }
      } else if (goalAction.type === 'QUEUE_JOB' && goalAction.buildingId) {
        const building = findBuilding(goalAction.buildingId);
        addSceneAction(actions, {
          id: `goal-queue:${goalAction.buildingId}`,
          kind: 'queue',
          objectId: goalTargetId,
          label: 'Queue job',
          detail: BUILDING_LABELS[building?.type] || 'Building',
          buildingId: goalAction.buildingId,
          testId: 'founders-scene-action-queue'
        });
      } else if (goalAction.type === 'COLLECT_OUTPUTS' && goalAction.buildingId) {
        const building = findBuilding(goalAction.buildingId);
        addSceneAction(actions, {
          id: `goal-collect:${goalAction.buildingId}`,
          kind: 'collect',
          objectId: goalTargetId,
          label: 'Collect outputs',
          detail: BUILDING_LABELS[building?.type] || 'Building',
          buildingId: goalAction.buildingId,
          testId: 'founders-scene-action-collect'
        });
      } else if (goalAction.type === 'UPGRADE_HQ' || goalAction.type === 'UPGRADE_BUILDING') {
        addSceneAction(actions, {
          id: `goal-upgrade:${goalAction.buildingId || 'hq'}`,
          kind: 'upgrade',
          objectId: goalTargetId,
          label: goalAction.buildingId ? 'Upgrade building' : 'Upgrade Headquarters',
          detail: scene?.currentGoal?.targetLabel || '',
          buildingId: goalAction.buildingId || '',
          testId: 'founders-scene-action-upgrade'
        });
      } else if (goalAction.type === 'UPGRADE_LANDMARK') {
        addSceneAction(actions, {
          id: `goal-landmark:${goalAction.landmarkId}`,
          kind: 'landmark',
          objectId: goalTargetId,
          label: 'Raise the Welcome Sign',
          detail: 'Public Square',
          landmarkId: goalAction.landmarkId,
          testId: 'founders-scene-action-landmark'
        });
      } else if (goalAction.type === 'VIEW_CONTRACT_BOARD') {
        addSceneAction(actions, {
          id: 'goal-open-contract-board',
          kind: 'drawer',
          objectId: 'CONTRACT_BOARD',
          label: 'Open Contract Board',
          detail: 'Town requests',
          drawerKey: 'contracts',
          testId: 'founders-scene-action-open-contract-board'
        });
      } else if (goalAction.type === 'START_SCENARIO') {
        addSceneAction(actions, {
          id: `goal-start-scenario:${goalAction.scenarioId}`,
          kind: 'scenario-start',
          objectId: 'SCENARIO_SITE',
          label: 'Start civic project',
          detail: 'Public Square',
          scenarioId: goalAction.scenarioId,
          testId: 'founders-scene-action-scenario-start'
        });
      } else if (goalAction.type === 'CONTRIBUTE_SCENARIO') {
        addSceneAction(actions, {
          id: `goal-scenario-task:${goalAction.taskId}`,
          kind: 'scenario-task',
          objectId: 'SCENARIO_SITE',
          label: 'Prep civic project',
          detail: 'Public Square',
          scenarioId: goalAction.scenarioId,
          taskId: goalAction.taskId,
          testId: 'founders-scene-action-scenario-task'
        });
      } else if (goalAction.type === 'VIEW_SCENARIO_BOARD') {
        addSceneAction(actions, {
          id: 'goal-open-scenario-board',
          kind: 'drawer',
          objectId: 'SCENARIO_SITE',
          label: 'Open civic project',
          detail: 'Public Square',
          drawerKey: 'signals',
          testId: 'founders-scene-action-open-scenario-board'
        });
      } else if (goalAction.type === 'VIEW_TOWN_IDENTITY') {
        addSceneAction(actions, {
          id: 'goal-open-town-style',
          kind: 'drawer',
          objectId: 'PUBLIC_SQUARE',
          label: 'Choose square style',
          detail: 'Public Square',
          drawerKey: 'signals',
          testId: 'founders-scene-action-open-town-style'
        });
      }
    }

    return actions;
  }

  function renderSceneActionControls(stageNode, state, scene) {
    sceneActionRegistry = new Map();
    if (!(stageNode instanceof HTMLElement)) return;
    const actions = buildSceneActions(state, scene);
    if (actions.length === 0) return;
    const anchorObject = sceneObject(scene, actions[0].objectId) || sceneObject(scene, scene?.currentGoal?.targetObjectId) || null;
    if (!anchorObject) return;
    const layer = document.createElement('div');
    layer.className = 'at-fp-sceneActions';
    layer.dataset.testid = 'founders-scene-actions';
    layer.setAttribute('data-testid', 'founders-scene-actions');
    layer.setAttribute('data-anchor-object-id', anchorObject.id || '');
    layer.style.setProperty('--fp-action-x', String(clampSceneCoordinate(anchorObject.x, 0.5)));
    layer.style.setProperty('--fp-action-y', String(clampSceneCoordinate(anchorObject.y, 0.5)));
    const kicker = document.createElement('div');
    kicker.className = 'at-fp-sceneActionsKicker';
    kicker.textContent = anchorObject.label || 'Scene action';
    layer.appendChild(kicker);
    const row = document.createElement('div');
    row.className = 'at-fp-sceneActionsRow';
    actions.slice(0, 4).forEach((action) => {
      sceneActionRegistry.set(action.id, action);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'at-fp-sceneActionButton';
      button.disabled = pendingAction || action.disabled === true;
      button.setAttribute('data-scene-action-id', action.id);
      button.setAttribute('data-scene-action-kind', action.kind);
      button.setAttribute('data-testid', action.testId || `founders-scene-action-${actionSafeId(action.id)}`);
      if (action.advice) {
        button.setAttribute('data-has-advice', 'true');
        button.setAttribute('data-clover-advice', action.advice);
      }
      button.innerHTML = `
        <span>${htmlEscape(action.label)}</span>
        ${action.detail ? `<small>${htmlEscape(action.detail)}</small>` : ''}
        ${action.advice ? `<small class="at-fp-sceneActionAdvice">${htmlEscape(action.advice)}</small>` : ''}
      `;
      row.appendChild(button);
    });
    layer.appendChild(row);
    stageNode.appendChild(layer);
    row.querySelectorAll('[data-scene-action-id]').forEach((button) => {
      button.addEventListener('click', async () => {
        const action = sceneActionRegistry.get(button.getAttribute('data-scene-action-id') || '');
        if (!action || button.hasAttribute('disabled')) return;
        try {
          await executeSceneAction(action);
        } catch {
          // status line already updated
        }
      });
    });
  }

  async function executeSceneAction(action) {
    if (!action) return;
    if (action.kind === 'place') {
      selectedKey = `pad:${action.x},${action.y}`;
      await runTool('et.plot.place_building', {
        type: action.buildingType,
        x: action.x,
        y: action.y,
        idempotencyKey: `scene-place:${action.buildingType}:${action.x}:${action.y}:${Date.now()}`
      });
      selectedKey = '';
      renderAll();
      return;
    }
    if (action.kind === 'queue') {
      await runTool('et.plot.queue_job', {
        buildingId: action.buildingId,
        idempotencyKey: `scene-queue:${action.buildingId}:${Date.now()}`
      });
      return;
    }
    if (action.kind === 'collect') {
      await runTool('et.plot.collect_outputs', {
        buildingId: action.buildingId,
        idempotencyKey: `scene-collect:${action.buildingId}:${Date.now()}`
      });
      return;
    }
    if (action.kind === 'upgrade') {
      await runTool('et.plot.upgrade_building', {
        buildingId: action.buildingId || undefined,
        idempotencyKey: `scene-upgrade:${action.buildingId || 'hq'}:${Date.now()}`
      });
      return;
    }
    if (action.kind === 'landmark') {
      await runTool('et.plot.town.upgrade_landmark', {
        landmarkId: action.landmarkId,
        idempotencyKey: `scene-landmark:${action.landmarkId}:${Date.now()}`
      });
      return;
    }
    if (action.kind === 'town-option') {
      await resolveTownOpportunity(action.opportunityId, action.optionId);
      return;
    }
    if (action.kind === 'scenario-start') {
      await startCivicScenario(action.scenarioId);
      return;
    }
    if (action.kind === 'scenario-task') {
      await contributeCivicScenario(action.scenarioId, action.taskId);
      return;
    }
    if (action.kind === 'town-style') {
      await setTownIdentityStyle(action.styleId);
      return;
    }
    if (action.kind === 'plot-card') {
      await generatePlotCard();
      return;
    }
    if (action.kind === 'postcard') {
      await capturePostcard();
      return;
    }
    if (action.kind === 'drawer' && action.drawerKey) {
      openDrawer(action.drawerKey, { clearSelection: false });
      if (action.objectId) setLastActionTarget(action.objectId);
      setStatusLine(action.label || 'Opened scene panel.');
    }
  }

  async function runTool(name, args = {}, actor = 'HUMAN') {
    setActionTargetFromTool(name, args || {});
    pendingAction = true;
    setStatusLine(`Running ${name}…`);
    try {
      const response = await api(`/api/founders-plot/tool/${encodeURIComponent(name)}`, {
        method: 'POST',
        body: JSON.stringify({
          actor,
          ...args
        })
      });
      if (response?.data?.state) {
        currentState = { ok: true, state: response.data.state };
      } else {
        await loadState();
      }
      if (name === 'et.plot.place_building') {
        trackFoundersEvent('founders.first_building_placed', {
          buildingType: String(args?.type || '')
        }, { once: true });
      }
      setStatusLine(`${name} complete.`);
      renderAll();
      return response;
    } catch (error) {
      const details = error?.payload?.error?.details || {};
      const detailText = details && Object.keys(details).length > 0 ? ` ${JSON.stringify(details)}` : '';
      setStatusLine(`${name} failed: ${error.message}.${detailText}`);
      throw error;
    } finally {
      pendingAction = false;
      renderAll();
    }
  }

  async function updatePolicy(key, value) {
    setLastActionTarget('FOREMAN_HUT');
    pendingAction = true;
    setStatusLine(`Updating ${key}…`);
    try {
      const response = await api('/api/founders-plot/policy', {
        method: 'POST',
        body: JSON.stringify({ key, value })
      });
      currentState = { ok: true, state: response.state };
      setStatusLine(`${key} updated.`);
      renderAll();
      return response;
    } catch (error) {
      setStatusLine(`Could not update ${key}: ${error.message}.`);
      throw error;
    } finally {
      pendingAction = false;
      renderAll();
    }
  }

  async function resolveApproval(approvalId, decision) {
    setLastActionTarget('FOREMAN_HUT');
    pendingAction = true;
    setStatusLine(`${decision === 'approve' ? 'Approving' : 'Rejecting'} request…`);
    try {
      const response = await api(`/api/founders-plot/approvals/${encodeURIComponent(approvalId)}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ decision })
      });
      currentState = { ok: true, state: response.state };
      setStatusLine(`Approval ${decision}d.`);
      renderAll();
      return response;
    } catch (error) {
      setStatusLine(`Approval update failed: ${error.message}.`);
      throw error;
    } finally {
      pendingAction = false;
      renderAll();
    }
  }

  async function claimReward(rewardKey) {
    setLastActionTarget('PUBLIC_SQUARE');
    return runTool('et.plot.claim_reward', {
      rewardKey,
      idempotencyKey: `claim:${rewardKey}:${Date.now()}`
    });
  }

  async function resolveTownOpportunity(opportunityId, optionId) {
    setLastActionTarget('PUBLIC_SQUARE');
    return runTool('et.plot.town.resolve_opportunity', {
      opportunityId,
      optionId,
      idempotencyKey: `town-opportunity:${opportunityId}:${optionId}:${Date.now()}`
    });
  }

  async function startCivicScenario(scenarioId) {
    setLastActionTarget('SCENARIO_SITE');
    return runTool('et.plot.scenarios.start', {
      scenarioId,
      idempotencyKey: `scenario-start:${scenarioId}:${Date.now()}`
    });
  }

  async function contributeCivicScenario(scenarioId, taskId) {
    setLastActionTarget('SCENARIO_SITE');
    return runTool('et.plot.scenarios.contribute', {
      scenarioId,
      taskId,
      idempotencyKey: `scenario-task:${scenarioId}:${taskId}:${Date.now()}`
    });
  }

  async function setTownIdentityStyle(styleId) {
    setLastActionTarget('PUBLIC_SQUARE');
    return runTool('et.plot.town.set_identity', {
      landmarkId: 'public_square_welcome_sign',
      styleId,
      idempotencyKey: `town-identity:${styleId}:${Date.now()}`
    });
  }

  async function generatePlotCard() {
    setLastActionTarget('PUBLIC_SQUARE');
    pendingAction = true;
    setStatusLine('Generating plot card...');
    try {
      const response = await api('/api/founders-plot/plot-card');
      currentPlotCard = response?.card || null;
      setStatusLine(currentPlotCard ? 'Plot card ready.' : 'Plot card could not be generated.');
      renderAll();
      return currentPlotCard;
    } catch (error) {
      setStatusLine(`Could not generate plot card: ${error.message}.`);
      throw error;
    } finally {
      pendingAction = false;
      renderAll();
    }
  }

  async function capturePostcard() {
    setLastActionTarget('PUBLIC_SQUARE');
    pendingAction = true;
    setStatusLine('Capturing postcard...');
    try {
      const canvas = document.querySelector('#plotBoard canvas');
      const imageDataUrl = canvas && typeof canvas.toDataURL === 'function'
        ? canvas.toDataURL('image/png')
        : '';
      const response = await api('/api/founders-plot/postcard', {
        method: 'POST',
        body: JSON.stringify({
          focusObjectId: 'PUBLIC_SQUARE',
          idempotencyKey: `postcard:${Date.now()}`
        })
      });
      currentPostcard = {
        ...(response?.postcard || {}),
        imageDataUrl: String(imageDataUrl || '')
      };
      if (response?.state) {
        currentState = { ok: true, state: response.state };
      } else {
        await loadState();
      }
      setStatusLine(currentPostcard?.captureId ? 'Postcard captured.' : 'Postcard could not be captured.');
      renderAll();
      return currentPostcard;
    } catch (error) {
      setStatusLine(`Could not capture postcard: ${error.message}.`);
      throw error;
    } finally {
      pendingAction = false;
      renderAll();
    }
  }

  async function generateOperatingStyleCard() {
    setLastActionTarget('GOVERNOR_LEDGER');
    pendingAction = true;
    setStatusLine('Preparing operating style...');
    try {
      const response = await api('/api/founders-plot/operating-style-card');
      currentOperatingStyleCard = response?.card || null;
      setStatusLine(currentOperatingStyleCard ? 'Operating style ready.' : 'Operating style could not be prepared.');
      renderAll();
      return currentOperatingStyleCard;
    } catch (error) {
      setStatusLine(`Could not prepare operating style: ${error.message}.`);
      throw error;
    } finally {
      pendingAction = false;
      renderAll();
    }
  }

  async function setStandingOrder(standingOrder) {
    setLastActionTarget('FOREMAN_HUT');
    return runTool('et.foreman.policy.set_standing_order', {
      standingOrder,
      idempotencyKey: `standing-order:${standingOrder}:${Date.now()}`
    });
  }

  async function acceptContract(contractId) {
    setLastActionTarget('CONTRACT_BOARD');
    pendingAction = true;
    setStatusLine('Accepting contract…');
    try {
      const response = await api('/api/founders-plot/contracts/accept', {
        method: 'POST',
        body: JSON.stringify({
          contractId,
          idempotencyKey: `contract-accept:${contractId}:${Date.now()}`
        })
      });
      currentState = { ok: true, state: response.state };
      trackContractAccepted(contractId);
      setStatusLine('Contract accepted.');
      renderAll();
      return response;
    } catch (error) {
      setStatusLine(`Could not accept contract: ${error.message}.`);
      throw error;
    } finally {
      pendingAction = false;
      renderAll();
    }
  }

  async function turnInContract(contractId) {
    setLastActionTarget('CONTRACT_BOARD');
    pendingAction = true;
    setStatusLine('Turning in contract…');
    try {
      const response = await api('/api/founders-plot/contracts/turn-in', {
        method: 'POST',
        body: JSON.stringify({
          contractId,
          idempotencyKey: `contract-turn-in:${contractId}:${Date.now()}`
        })
      });
      currentState = { ok: true, state: response.state };
      trackContractCompleted(contractId);
      setStatusLine('Contract turned in.');
      renderAll();
      return response;
    } catch (error) {
      setStatusLine(`Could not turn in contract: ${error.message}.`);
      throw error;
    } finally {
      pendingAction = false;
      renderAll();
    }
  }

  function buildTypeButtons(container, state, pad) {
    const row = document.createElement('div');
    row.className = 'foundersBuildOptions';
    for (const entry of visibleBuildCatalog(state, { includeNextLocked: true })) {
      const disabledReason = buildingBlockedText(entry);
      const button = document.createElement('button');
      button.className = 'btn small foundersBuildTypeButton';
      button.type = 'button';
      button.disabled = pendingAction || disabledReason !== '';
      button.setAttribute('data-testid', `place-${entry.type.toLowerCase()}`);
      button.setAttribute('aria-label', `${entry.label}. ${buildingActionDetail(entry)}`);
      if (disabledReason) button.title = disabledReason;
      button.innerHTML = `
        <span>Place ${htmlEscape(entry.label)}</span>
        <small>${htmlEscape(buildingActionDetail(entry))}</small>
      `;
      button.addEventListener('click', async () => {
        if (button.disabled) return;
        await runTool('et.plot.place_building', {
          type: entry.type,
          x: pad.x,
          y: pad.y,
          idempotencyKey: `place:${entry.type}:${pad.x}:${pad.y}:${Date.now()}`
        });
      });
      row.appendChild(button);
    }
    container.appendChild(row);
  }

  function renderSelection(state) {
    const node = document.getElementById('selectionCard');
    if (!node) return;
    const sheet = document.getElementById('selectionSheet');
    const titleNode = document.getElementById('selectionSheetTitle');
    const clearBtn = document.getElementById('selectionClearBtn');
    node.innerHTML = '';
    const selectedBuilding = findSelected();
    const selectedPad = emptyPadFromSelection();
    if (clearBtn) {
      clearBtn.hidden = !selectedBuilding && !selectedPad;
      clearBtn.onclick = () => {
        selectedKey = '';
        renderAll();
      };
    }

    if (sheet) {
      sheet.hidden = !selectedBuilding && !selectedPad;
    }
    if (!selectedBuilding && !selectedPad) {
      if (titleNode) titleNode.textContent = 'Selected object';
      node.innerHTML = '';
      return;
    }

    if (selectedBuilding) {
      const runningJob = selectedBuilding.runningJob || null;
      const completedJobs = Array.isArray(selectedBuilding.completedJobs) ? selectedBuilding.completedJobs : [];
      const actions = document.createElement('div');
      actions.className = 'foundersActions';
      const title = document.createElement('h2');
      title.textContent = BUILDING_LABELS[selectedBuilding.type] || selectedBuilding.type;
      if (titleNode) titleNode.textContent = title.textContent;
      node.appendChild(title);

      const rows = document.createElement('div');
      rows.innerHTML = `
        <div class="foundersDataRow"><span>State</span><span class="foundersBadge">${htmlEscape(selectedBuilding.state.toLowerCase().replace(/_/g, ' '))}</span></div>
        <div class="foundersDataRow"><span>Level</span><span>${htmlEscape(String(selectedBuilding.level))}</span></div>
        <div class="foundersDataRow"><span>Priority</span><span>${htmlEscape(String(selectedBuilding.priority || 'BALANCED'))}</span></div>
      `;
      node.appendChild(rows);

      if (runningJob) {
        const running = document.createElement('p');
        running.textContent = `${runningJob.kind.toLowerCase()} finishes in ${formatDuration(runningJob.endsAt)}.`;
        node.appendChild(running);
      }
      if (completedJobs.length > 0) {
        actions.appendChild(actionButton(
          'Collect outputs',
          async () => {
            await runTool('et.plot.collect_outputs', {
              buildingId: selectedBuilding.buildingId,
              idempotencyKey: `collect:${selectedBuilding.buildingId}:${Date.now()}`
            });
          },
          'selection-collect'
        ));
      } else if (!runningJob && selectedBuilding.type !== 'HQ' && selectedBuilding.state === 'READY') {
        actions.appendChild(actionButton(
          selectedBuilding.type === 'MARKET_STALL' ? 'Queue market sale' : 'Queue job',
          async () => {
            await runTool('et.plot.queue_job', {
              buildingId: selectedBuilding.buildingId,
              idempotencyKey: `queue:${selectedBuilding.buildingId}:${Date.now()}`
            });
          },
          'selection-queue'
        ));
      }

      if (!runningJob && (UPGRADE_CAPS[selectedBuilding.type] || 1) > selectedBuilding.level) {
        const label = selectedBuilding.type === 'HQ' ? 'Upgrade Headquarters' : 'Upgrade building';
        actions.appendChild(actionButton(
          label,
          async () => {
            await runTool('et.plot.upgrade_building', {
              buildingId: selectedBuilding.type === 'HQ' ? undefined : selectedBuilding.buildingId,
              idempotencyKey: `upgrade:${selectedBuilding.buildingId}:${Date.now()}`
            });
          },
          'selection-upgrade'
        ));
      }

      if ((state.progress?.currentLevel || state.plot?.hqLevel || 1) >= 4 && selectedBuilding.type !== 'HQ') {
        const priorityRow = document.createElement('div');
        priorityRow.className = 'foundersPriorityRow';
        const titleRow = document.createElement('div');
        titleRow.className = 'small';
        titleRow.textContent = 'Priority';
        priorityRow.appendChild(titleRow);
        const buttons = document.createElement('div');
        buttons.className = 'foundersInlineButtons';
        ['BALANCED', 'WOOD', 'STONE', 'FOOD'].forEach((priority) => {
          buttons.appendChild(actionButton(
            priority.toLowerCase(),
            async () => {
              await runTool('et.plot.set_priority', {
                buildingId: selectedBuilding.buildingId,
                priority,
                idempotencyKey: `priority:${selectedBuilding.buildingId}:${priority}:${Date.now()}`
              });
            },
            `priority-${priority.toLowerCase()}`,
            selectedBuilding.priority === priority
          ));
        });
        priorityRow.appendChild(buttons);
        node.appendChild(priorityRow);
      }

      node.appendChild(actions);
      if (sheet) sheet.hidden = false;
      return;
    }

    if (selectedPad) {
      const title = document.createElement('h2');
      title.textContent = selectedPad.label;
      if (titleNode) titleNode.textContent = 'Build here';
      node.appendChild(title);
      const description = document.createElement('p');
      description.textContent = 'Choose the next building for this open pad.';
      node.appendChild(description);
      buildTypeButtons(node, state, selectedPad);
      if (sheet) sheet.hidden = false;
      return;
    }

    if (titleNode) titleNode.textContent = 'Next step';
    const goal = state?.currentGoal || state?.quest || {};
    const message = document.createElement('div');
    message.className = 'foundersObjectGoal';
    message.innerHTML = `
      <strong>${htmlEscape(goal.title || 'Grow the first district')}</strong>
      <div class="small foundersObjectGoalText">${htmlEscape(goal.body || 'Tap the highlighted place in town to inspect it.')}</div>
    `;
    node.appendChild(message);
    if (sheet) sheet.hidden = false;
  }

  function renderContracts(state) {
    const node = document.getElementById('contractBoard');
    if (!node) return;
    const statusNode = document.getElementById('contractBoardStatus');
    const contracts = state?.contracts || {};
    const offers = Array.isArray(contracts.offers) ? contracts.offers : [];
    const activeContract = contracts.activeContract || null;
    if (!contracts.boardLocked && (offers.length > 0 || activeContract)) {
      trackFoundersEvent('founders.first_contract_viewed', {
        offerCount: offers.length,
        hasActiveContract: !!activeContract
      }, { once: true });
    }
    if (contracts.boardLocked) {
      if (statusNode) statusNode.textContent = 'Opens at HQ2.';
      node.innerHTML = '<div class="foundersEmptyState">Town requests arrive once Headquarters reaches level 2.</div>';
      return;
    }

    if (statusNode) {
      statusNode.textContent = activeContract
        ? `Active: ${activeContract.title}`
        : `${offers.length} offers ready.`;
    }

    const cards = [];
    if (activeContract) {
      cards.push(`
        <article class="foundersContractItem is-active">
          <div class="foundersContractHeader">
            <div>
              <strong>${htmlEscape(activeContract.title)}</strong>
              <div class="foundersContractKicker">${htmlEscape(contractRequesterDisplay(activeContract))} · ${htmlEscape(contractInstitutionDisplay(activeContract))}</div>
            </div>
            <span class="foundersBadge">${htmlEscape(prettyContractStatus(activeContract.status))}</span>
          </div>
          <div class="small">${htmlEscape(activeContract.whyNow || activeContract.townBenefit || '')}</div>
          <div class="foundersContractMeta">
            <div class="small">${htmlEscape(formatContractRequirements(activeContract))}</div>
            <div class="small">${htmlEscape(formatContractRewards(activeContract))}</div>
            ${activeContract.townBenefit ? `<div class="small">${htmlEscape(activeContract.townBenefit)}</div>` : ''}
            ${activeContract.townMoment?.label ? `<div class="small">Town moment: ${htmlEscape(activeContract.townMoment.label)}</div>` : ''}
            <div class="small">${htmlEscape(activeContract.philosophyHint || '')}</div>
          </div>
          <div class="foundersContractAction">
            <button
              class="btn small"
              type="button"
              data-contract-turn-in="${htmlEscape(activeContract.contractId)}"
              ${activeContract.status === 'READY_TO_TURN_IN' && !pendingAction ? '' : 'disabled'}
            >
              ${activeContract.status === 'READY_TO_TURN_IN' ? 'Turn in contract' : 'In progress'}
            </button>
          </div>
        </article>
      `);
    }

    if (offers.length > 0) {
      const recommendation = contracts.recommendation || null;
      cards.push(...offers.map((offer) => `
        <article class="foundersContractItem ${recommendation?.contractId === offer.contractId ? 'is-recommended' : ''}" data-testid="contract-offer" data-contract-kind="${htmlEscape(String(offer.kind || '').toLowerCase())}">
          <div class="foundersContractHeader">
            <div>
              <strong>${htmlEscape(offer.title)}</strong>
              <div class="foundersContractKicker">${htmlEscape(contractRequesterDisplay(offer))} · ${htmlEscape(contractInstitutionDisplay(offer))}</div>
            </div>
            <div class="foundersContractBadges">
              ${recommendation?.contractId === offer.contractId ? '<span class="foundersBadge is-good" data-testid="contract-recommended-badge">Clover pick</span>' : ''}
              <span class="foundersBadge">${htmlEscape(offer.kind)}</span>
            </div>
          </div>
          <div class="small">${htmlEscape(offer.whyNow || '')}</div>
          <div class="foundersContractMeta">
            <div class="small">${htmlEscape(formatContractRequirements(offer))}</div>
            <div class="small">${htmlEscape(formatContractRewards(offer))}</div>
            ${offer.townBenefit ? `<div class="small">${htmlEscape(offer.townBenefit)}</div>` : ''}
            ${offer.townMoment?.label ? `<div class="small">Town moment: ${htmlEscape(offer.townMoment.label)}</div>` : ''}
            <div class="small">${htmlEscape(offer.philosophyHint || '')}</div>
            ${recommendation?.contractId === offer.contractId ? `<div class="small foundersContractCloverReason" data-testid="contract-clover-reason">${htmlEscape(recommendation.reason || 'Clover sees this as the best next request.')}</div>` : ''}
          </div>
          <div class="foundersContractAction">
            <button
              class="btn small"
              type="button"
              data-contract-accept="${htmlEscape(offer.contractId)}"
              ${activeContract || pendingAction ? 'disabled' : ''}
            >
              Accept ${htmlEscape(offer.kind.toLowerCase())} request
            </button>
          </div>
        </article>
      `));
    }

    node.innerHTML = cards.length > 0
      ? `<div class="foundersContractList">${cards.join('')}</div>`
      : '<div class="foundersEmptyState">No town requests are waiting right now.</div>';

    node.querySelectorAll('[data-contract-accept]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await acceptContract(button.getAttribute('data-contract-accept') || '');
        } catch {
          // status line already updated
        }
      });
    });
    node.querySelectorAll('[data-contract-turn-in]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (button.hasAttribute('disabled')) return;
        try {
          await turnInContract(button.getAttribute('data-contract-turn-in') || '');
        } catch {
          // status line already updated
        }
      });
    });
  }

  function renderSignals(state) {
    const node = document.getElementById('signalsPanel');
    if (!node) return;
    const rows = signalList(state);
    node.innerHTML = rows.map((signal) => `
      <div class="foundersSignalItem" data-testid="signal-${htmlEscape(signal.key)}">
        <div class="foundersSignalHeader">
          <strong>${htmlEscape(signal.label)}</strong>
          <span class="foundersBadge ${signal.band === 'LOW' ? 'is-warn' : ''}">${htmlEscape(signalBandLabel(signal.band))}</span>
        </div>
        <div class="foundersSignalBar" aria-hidden="true">
          <div class="foundersSignalFill is-${htmlEscape(signal.band.toLowerCase())}" style="width:${Math.max(0, Math.min(100, signal.value))}%"></div>
        </div>
      </div>
    `).join('');
  }

  function renderLandmark(state) {
    const node = document.getElementById('publicSquareCard');
    if (!node) return;
    const landmark = state?.landmarks?.publicSquare || {};
    const opportunity = state?.townOpportunity?.active || null;
    const completedOpportunities = Array.isArray(state?.townOpportunity?.completed)
      ? state.townOpportunity.completed
      : [];
    const latestOpportunity = completedOpportunities[completedOpportunities.length - 1] || null;
    const scenariosEnabled = roadmapFeatureEnabled('FEATURE_FOUNDERS_V16_SCENARIOS', state);
    const identityEnabled = roadmapFeatureEnabled('FEATURE_FOUNDERS_V17_TOWN_IDENTITY', state);
    const activeScenario = scenariosEnabled ? state?.scenarios?.active || null : null;
    const scenarioOffers = scenariosEnabled && Array.isArray(state?.scenarios?.offers) ? state.scenarios.offers : [];
    const completedScenarios = scenariosEnabled && Array.isArray(state?.scenarios?.completed) ? state.scenarios.completed : [];
    const latestScenario = completedScenarios[completedScenarios.length - 1] || null;
    const canUpgrade = Number(landmark.level || 0) < 1
      && Number(state?.plot?.inventory?.wood || 0) >= 4
      && Number(state?.plot?.inventory?.coin || 0) >= 8;
    const styleOptions = identityEnabled && Array.isArray(landmark.availableStyles) ? landmark.availableStyles : [];
    const styleHtml = identityEnabled && Number(landmark.level || 0) >= 1 && styleOptions.length > 0 ? `
      <div class="foundersLandmarkBody foundersIdentityBody" data-testid="town-identity-card">
        <div class="foundersSignalHeader">
          <div>
            <div class="foundersLabel">Town style</div>
            <strong>${htmlEscape(landmark.styleLabel || 'Choose a Public Square style')}</strong>
          </div>
          <span class="foundersBadge">${landmark.styleId ? 'Set' : 'Cosmetic'}</span>
        </div>
        <div class="foundersStyleChoices">
          ${styleOptions.map((style) => `
            <button
              class="btn small foundersStyleChoice"
              type="button"
              data-town-style="${htmlEscape(style.styleId || '')}"
              data-testid="town-style-${htmlEscape(style.styleId || '')}"
              style="--style-swatch:${htmlEscape(style?.palette?.tint || '#d9b77a')};--style-accent:${htmlEscape(style?.palette?.accent || '#7a3f22')};"
              ${pendingAction || String(landmark.styleId || '') === String(style.styleId || '') ? 'disabled' : ''}
            >
              <span class="foundersStyleSwatch" aria-hidden="true"></span>
              <strong>${htmlEscape(style.label || 'Town style')}</strong>
              <span>${htmlEscape(style.body || 'Cosmetic only.')}</span>
            </button>
          `).join('')}
        </div>
        <div class="foundersContractAction">
          <button class="btn small" type="button" data-plot-card-generate="1" data-testid="plot-card-generate-btn" ${pendingAction ? 'disabled' : ''}>Generate plot card</button>
          <button class="btn small" type="button" data-postcard-capture="1" data-testid="postcard-capture-btn" ${pendingAction ? 'disabled' : ''}>Capture postcard</button>
        </div>
      </div>
    ` : '';
    const postcard = identityEnabled ? currentPostcard || state?.townPostcards?.latest || null : null;
    const postcardHtml = identityEnabled && postcard ? `
      <div class="foundersLandmarkBody foundersPostcard" data-testid="postcard-preview">
        <div class="foundersSignalHeader">
          <div>
            <div class="foundersLabel">Postcard</div>
            <strong>${htmlEscape(postcard.cameraLabel || 'Town postcard')}</strong>
          </div>
          <span class="foundersBadge">Public</span>
        </div>
        ${String(postcard.imageDataUrl || '').startsWith('data:image/')
          ? `<img class="foundersPostcardImage" src="${htmlEscape(postcard.imageDataUrl)}" alt="Captured Founders Plot postcard preview" data-testid="postcard-image" />`
          : ''}
        <div class="small">${htmlEscape((postcard.flyoverStops || []).map((stop) => stop.label).join(' -> ') || 'Public Square flyover')}</div>
      </div>
    ` : '';
    const cardHtml = identityEnabled && currentPlotCard ? `
      <div class="foundersLandmarkBody foundersPlotCard" data-testid="plot-card-preview">
        <div class="foundersLabel">Plot card</div>
        <strong>${htmlEscape(currentPlotCard.title || 'Agent Town: Founders Plot')}</strong>
        <div class="small">${htmlEscape(currentPlotCard.subtitle || 'Frontier plot')}</div>
        <div class="foundersPlotCardStats">
          <span>HQ ${htmlEscape(currentPlotCard.hqLevel || 1)}</span>
          <span>${htmlEscape((currentPlotCard.buildings || []).length)} buildings</span>
          <span>${htmlEscape(currentPlotCard.completedContracts || 0)} requests</span>
        </div>
      </div>
    ` : '';
    const scenarioHtml = activeScenario ? `
      <div class="foundersLandmarkBody foundersScenarioBody" data-testid="civic-scenario-card">
        <div class="foundersSignalHeader">
          <div>
            <div class="foundersLabel">Civic project</div>
            <strong>${htmlEscape(activeScenario.title || 'Civic project')}</strong>
          </div>
          <span class="foundersBadge is-good">${htmlEscape(scenarioProgressText(activeScenario))}</span>
        </div>
        <div class="small">${htmlEscape(activeScenario.body || '')}</div>
        <div class="foundersScenarioProgress" aria-hidden="true">
          <div class="foundersScenarioFill" style="width:${Math.round(Math.max(0, Math.min(1, Number(activeScenario.progress || 0))) * 100)}%"></div>
        </div>
        <div class="foundersOpportunityChoices">
          ${(Array.isArray(activeScenario.tasks) ? activeScenario.tasks : []).map((task) => {
            const affordable = canAffordResources(state, task.cost || {});
            const costText = formatResourceList(task.cost || {}) || 'No cost';
            const signalText = formatSignalDelta(task.signalDelta || '');
            return `
              <button
                class="btn small foundersOpportunityChoice foundersScenarioTask"
                type="button"
                data-scenario-task="${htmlEscape(task.taskId || '')}"
                data-testid="scenario-task-${htmlEscape(task.taskId || '')}"
                ${pendingAction || task.completed === true || !affordable ? 'disabled' : ''}
              >
                <strong>${htmlEscape(task.label || 'Prep task')}</strong>
                <span>${htmlEscape(task.body || '')}</span>
                <span>Cost: ${htmlEscape(costText)}.</span>
                ${signalText ? `<span>${htmlEscape(signalText)}.</span>` : ''}
                ${task.completed === true ? '<span>Done.</span>' : affordable ? '' : '<span>Need more supplies.</span>'}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    ` : scenarioOffers.length > 0 ? `
      <div class="foundersLandmarkBody foundersScenarioBody" data-testid="civic-scenario-offer">
        <div class="foundersSignalHeader">
          <div>
            <div class="foundersLabel">Civic project</div>
            <strong>${htmlEscape(scenarioOffers[0].title || 'Civic project')}</strong>
          </div>
          <span class="foundersBadge">Scenario</span>
        </div>
        <div class="small">${htmlEscape(scenarioOffers[0].body || '')}</div>
        <div class="small">${htmlEscape(formatScenarioReward(scenarioOffers[0]) || 'Completing prep helps the town mood.')}</div>
        <div class="foundersContractAction">
          <button class="btn small" type="button" data-scenario-start="${htmlEscape(scenarioOffers[0].scenarioId || '')}" data-testid="scenario-start-btn" ${pendingAction ? 'disabled' : ''}>Start ${htmlEscape(scenarioOffers[0].title || 'scenario')}</button>
        </div>
      </div>
    ` : latestScenario ? `
      <div class="foundersLandmarkBody foundersScenarioBody" data-testid="civic-scenario-result">
        <div class="foundersLabel">Last civic project</div>
        <strong>${htmlEscape(latestScenario.title || 'Civic project')}</strong>
        <div class="small">${htmlEscape(String(latestScenario.status || '').replace(/_/g, ' ').toLowerCase())} · ${htmlEscape(scenarioProgressText(latestScenario))}</div>
      </div>
    ` : '';
    const opportunityHtml = opportunity ? `
      <div class="foundersLandmarkBody foundersOpportunityBody" data-testid="town-opportunity-card">
        <div class="foundersSignalHeader">
          <div>
            <div class="foundersLabel">Town opportunity</div>
            <strong>${htmlEscape(opportunity.title || 'Town choice')}</strong>
          </div>
          <span class="foundersBadge is-good">Choice</span>
        </div>
        <div class="small">${htmlEscape(opportunity.body || '')}</div>
        <div class="foundersOpportunityChoices">
          ${(Array.isArray(opportunity.options) ? opportunity.options : []).map((option) => {
            const affordable = canAffordResources(state, option.cost || {});
            const costText = formatResourceList(option.cost || {}) || 'No cost';
            const rewardText = formatOpportunityReward(option) || 'Town mood changes';
            const tradeoffText = formatCloverTradeoff(option);
            return `
              <button
                class="btn small foundersOpportunityChoice"
                type="button"
                data-town-opportunity-option="${htmlEscape(option.optionId || '')}"
                data-testid="town-opportunity-option-${htmlEscape(option.optionId || '')}"
                ${pendingAction || !affordable ? 'disabled' : ''}
              >
                <strong>${htmlEscape(option.label || 'Choose')}</strong>
                <span>${htmlEscape(option.body || '')}</span>
                <span>Cost: ${htmlEscape(costText)}.</span>
                <span>${htmlEscape(rewardText)}.</span>
                ${tradeoffText ? `<span>${htmlEscape(tradeoffText)}.</span>` : ''}
                ${affordable ? '' : '<span>Need more supplies.</span>'}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    ` : latestOpportunity ? `
      <div class="foundersLandmarkBody foundersOpportunityBody" data-testid="town-opportunity-result">
        <div class="foundersLabel">Last town choice</div>
        <strong>${htmlEscape(latestOpportunity.title || 'Town choice resolved')}</strong>
        <div class="small">${htmlEscape(latestOpportunity.body || '')}</div>
        <div class="small">${htmlEscape(formatOpportunityReward(latestOpportunity) || 'Town mood changed.')}</div>
      </div>
    ` : '';
    node.innerHTML = `
      ${scenarioHtml}
      ${opportunityHtml}
      ${styleHtml}
      ${postcardHtml}
      ${cardHtml}
      <div class="foundersLandmarkBody">
        <div class="foundersLabel">Public square</div>
        <strong>${htmlEscape(landmark.level >= 1 ? 'Welcome Sign' : 'Open Dust Lot')}</strong>
        <div class="small">${htmlEscape(
          landmark.level >= 1
            ? 'The square feels settled enough to greet newcomers.'
            : 'A simple welcome sign would make the plot feel like a town.'
        )}</div>
        <div class="small">${landmark.level >= 1 ? 'Built.' : 'Cost: 4 wood, 8 coin.'}</div>
        <div class="foundersContractAction">
          <button class="btn small" type="button" id="publicSquareUpgradeBtn" data-testid="public-square-upgrade-btn" ${landmark.level >= 1 || pendingAction || !canUpgrade ? 'disabled' : ''}>
            ${landmark.level >= 1 ? 'Welcome Sign raised' : 'Raise the Welcome Sign'}
          </button>
        </div>
      </div>
    `;
    const button = document.getElementById('publicSquareUpgradeBtn');
    if (button) {
      button.onclick = async () => {
        try {
          await runTool('et.plot.town.upgrade_landmark', {
            landmarkId: 'public_square_welcome_sign',
            idempotencyKey: `landmark:${Date.now()}`
          });
        } catch {
          // status line already updated
        }
      };
    }
    node.querySelectorAll('[data-town-opportunity-option]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (button.hasAttribute('disabled')) return;
        try {
          await resolveTownOpportunity(
            String(opportunity?.opportunityId || ''),
            String(button.getAttribute('data-town-opportunity-option') || '')
          );
        } catch {
          // status line already updated
        }
      });
    });
    node.querySelectorAll('[data-scenario-start]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (button.hasAttribute('disabled')) return;
        try {
          await startCivicScenario(String(button.getAttribute('data-scenario-start') || ''));
        } catch {
          // status line already updated
        }
      });
    });
    node.querySelectorAll('[data-scenario-task]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (button.hasAttribute('disabled')) return;
        try {
          await contributeCivicScenario(
            String(activeScenario?.scenarioId || ''),
            String(button.getAttribute('data-scenario-task') || '')
          );
        } catch {
          // status line already updated
        }
      });
    });
    node.querySelectorAll('[data-town-style]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (button.hasAttribute('disabled')) return;
        try {
          await setTownIdentityStyle(String(button.getAttribute('data-town-style') || ''));
        } catch {
          // status line already updated
        }
      });
    });
    node.querySelectorAll('[data-plot-card-generate]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (button.hasAttribute('disabled')) return;
        try {
          await generatePlotCard();
        } catch {
          // status line already updated
        }
      });
    });
    node.querySelectorAll('[data-postcard-capture]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (button.hasAttribute('disabled')) return;
        try {
          await capturePostcard();
        } catch {
          // status line already updated
        }
      });
    });
  }

  function renderJournal(state) {
    const node = document.getElementById('journalList');
    if (!node) return;
    const entries = Array.isArray(state?.journal?.entries) ? state.journal.entries : [];
    if (entries.length === 0) {
      node.innerHTML = '<div class="foundersEmptyState">No fresh town notes yet.</div>';
      return;
    }
    node.innerHTML = entries.map((entry) => `
      <div class="foundersJournalItem">
        <div class="foundersSignalHeader">
          <strong>${htmlEscape(entry.title || entry.category || 'Town note')}</strong>
          <span class="foundersBadge">${htmlEscape(String(entry.category || 'NOTE').toLowerCase())}</span>
        </div>
        <div class="small">${htmlEscape(entry.body || '')}</div>
      </div>
    `).join('');
  }

  function renderForeman(state) {
    const runtime = state?.foreman?.runtime || {};
    const runtimeLocal = localForemanRuntimeStatus(runtime);
    const access = buildFoundersAccessState(state);
    const brainConfigured = isBrainConfiguredForForeman();
    const realBrainReady = isRealBrainReadyForForeman();
    const status = !realBrainReady
      ? { label: brainModeLabel(access), tone: '' }
      : runtimeLocal.needsRestart
      ? { label: 'Needs a fresh start', tone: 'warn' }
      : foremanStatusMeta(runtime.status);
    const badge = document.getElementById('foremanStatusBadge');
    if (badge) {
      badge.textContent = status.label;
      badge.setAttribute('data-mode', String(access?.foundersPlot?.mode || 'MANUAL_FOUNDER'));
      badge.className = `foundersBadge ${status.tone === 'warn' ? 'is-warn' : ''}`;
    }

    const companionRecommendation = state?.foreman?.companionAdvice?.recommendation
      || state?.foreman?.recommendation
      || 'Clover is watching. No safe action inside your standing order.';
    const recommendation = companionRecommendation || (!realBrainReady ? brainModeCopy(access) : '');
    setText('foremanRecommendation', recommendation);
    if (recommendation) {
      trackFoundersEvent('founders.clover_advice_seen', {}, { once: true });
    }

    const toolsLine = (() => {
      if (!brainConfigured) return 'Manual play stays open. Connect a Brain when you want Clover to act as your Foreman.';
      if (!realBrainReady) return 'This Brain is preview-only. Manual play stays open until you connect a production Brain.';
      if (!runtime.runtimeId) return 'Start Clover when you are ready for in-session help.';
      if (runtimeLocal.needsRestart) return 'Restart Clover before any routine can run in this tab.';
      if (runtime.status === 'PAUSED') return 'Automation is paused until you wake Clover again.';
      if (runtime.status === 'STALE' || runtime.status === 'ERROR' || ['ERROR', 'STALE', 'TOKEN_MISSING'].includes(String(workerSchedulerStatus.lastStatus || '').toUpperCase())) {
        return 'Clover needs a fresh start.';
      }
      return 'Clover can observe, plan, and handle one safe routine task you have allowed.';
    })();
    setText('foremanToolsLine', toolsLine);

    const teachingNode = document.getElementById('foremanTeachingActions');
    if (teachingNode) {
      const teaching = state?.foreman?.teachingPreferences || {};
      const latest = teachingCorrectionLabel(teaching.latestCorrection || teaching.contractPreference || '');
      teachingNode.innerHTML = `
        <div class="foundersTeachingHeader">
          <span class="foundersLabel">Teach Clover</span>
          <span class="small" data-testid="founders-teaching-latest">${htmlEscape(latest)}</span>
        </div>
        <div class="foundersInlineButtons">
          <button class="btn small" type="button" data-teaching-correction="DO_THIS_AGAIN" data-testid="foreman-teach-do-this-again" ${pendingAction ? 'disabled' : ''}>Do this again</button>
          <button class="btn small" type="button" data-teaching-correction="ASK_ME_FIRST" data-testid="foreman-teach-ask-me-first" ${pendingAction ? 'disabled' : ''}>Ask me first</button>
          <button class="btn small" type="button" data-teaching-correction="PREFER_RESERVES" data-testid="foreman-teach-prefer-reserves" ${pendingAction ? 'disabled' : ''}>Prefer reserves</button>
          <button class="btn small" type="button" data-teaching-correction="PREFER_SPEED" data-testid="foreman-teach-prefer-speed" ${pendingAction ? 'disabled' : ''}>Prefer speed</button>
        </div>
      `;
      teachingNode.querySelectorAll('[data-teaching-correction]').forEach((button) => {
        button.addEventListener('click', async () => {
          if (button.hasAttribute('disabled')) return;
          try {
            pendingAction = true;
            const correction = String(button.getAttribute('data-teaching-correction') || '');
            await recordForemanPreference(correction);
            setStatusLine(`Clover learned: ${teachingCorrectionLabel(correction)}.`);
          } catch (error) {
            setStatusLine(error?.playerMessage || `Could not teach Clover: ${error.message}.`);
          } finally {
            pendingAction = false;
            renderAll();
          }
        });
      });
    }

    const startBtn = document.getElementById('foremanStartBtn');
    const pauseBtn = document.getElementById('foremanPauseBtn');
    const runNowBtn = document.getElementById('foremanRunNowBtn');
    if (startBtn) {
      startBtn.disabled = pendingAction;
      startBtn.textContent = !brainConfigured
        ? 'Connect a Brain'
        : !realBrainReady
          ? 'Upgrade Brain'
          : (runtime.runtimeId ? 'Restart Clover' : 'Start Clover');
      startBtn.onclick = async () => {
        if (!realBrainReady) {
          const card = document.querySelector('[data-testid="brain-quick-connect-sheet"]');
          if (card && typeof card.scrollIntoView === 'function') card.scrollIntoView({ block: 'center', behavior: 'smooth' });
          setStatusLine(brainConfigured
            ? 'Connect a production Brain to unlock Real Clover actions.'
            : 'Connect a Brain to unlock real Foreman help.');
          return;
        }
        try {
          pendingAction = true;
          setStatusLine('Starting Clover…');
          const response = await startForemanRuntime();
          setStatusLine(response?.ok ? 'Clover is ready to watch the town.' : 'Clover could not start. You can still play by hand.');
          renderAll();
        } catch (error) {
          setStatusLine(error?.playerMessage || 'Clover could not start. You can still play by hand.');
        } finally {
          pendingAction = false;
          renderAll();
        }
      };
    }
    if (pauseBtn) {
      pauseBtn.disabled = pendingAction || !realBrainReady || !runtimeLocal.actionable || String(runtime.status || '').toUpperCase() === 'PAUSED';
      pauseBtn.onclick = async () => {
        try {
          pendingAction = true;
          await pauseForemanRuntime();
          setStatusLine('Foreman paused.');
        } catch (error) {
          setStatusLine(`Could not pause Clover: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      };
    }
    if (runNowBtn) {
      runNowBtn.disabled = pendingAction || !realBrainReady || !runtimeLocal.actionable || ['PAUSED', 'STALE', 'ERROR', 'NOT_STARTED'].includes(String(runtime.status || '').toUpperCase());
      runNowBtn.onclick = async () => {
        if (!realBrainReady) {
          setStatusLine(brainConfigured
            ? 'Connect a production Brain to let Clover act as your Foreman.'
            : 'Connect a Brain to let Clover act as your Foreman.');
          return;
        }
        try {
          pendingAction = true;
          setStatusLine('Clover is taking a look…');
          const response = await runForemanTick();
          if (response?.receipt) {
            setStatusLine('Clover handled one safe task.');
          } else {
            setStatusLine('Clover watched but did not choose an action.');
          }
        } catch (error) {
          setStatusLine(error?.playerMessage || 'Clover watched but did not choose an action.');
        } finally {
          pendingAction = false;
          renderAll();
        }
      };
    }

    const standingOrderNode = document.getElementById('standingOrderCard');
    if (standingOrderNode) {
      const activeOrder = state?.foreman?.standingOrder || 'CAREFUL_STEWARD';
      standingOrderNode.innerHTML = `
        <div class="foundersStandingOrderBody">
          <div class="foundersLabel">Standing order</div>
          <strong>${htmlEscape(prettyStandingOrder(activeOrder))}</strong>
          <div class="small">${htmlEscape(standingOrderSummary(activeOrder))}</div>
          <div class="foundersStandingOrderChoices">
            <button class="btn small foundersStandingOrderChoice" type="button" data-standing-order="CAREFUL_STEWARD" data-testid="standing-order-careful" ${activeOrder === 'CAREFUL_STEWARD' || pendingAction ? 'disabled' : ''}>
              <strong>Careful Steward</strong>
              <span class="small">Protect supplies and ask before spending.</span>
            </button>
            <button class="btn small foundersStandingOrderChoice" type="button" data-standing-order="BOLD_FOUNDER" data-testid="standing-order-bold" ${activeOrder === 'BOLD_FOUNDER' || pendingAction ? 'disabled' : ''}>
              <strong>Bold Founder</strong>
              <span class="small">Push growth when the move is still safe.</span>
            </button>
          </div>
        </div>
      `;
      standingOrderNode.querySelectorAll('[data-standing-order]').forEach((button) => {
        button.addEventListener('click', async () => {
          try {
            await setStandingOrder(button.getAttribute('data-standing-order') || '');
          } catch {
            // status line already updated
          }
        });
      });
    }

    const doctrineNode = document.getElementById('doctrineCard');
    if (doctrineNode) {
      const doctrine = state?.foreman?.doctrine || {};
      const rules = Array.isArray(doctrine.rules) ? doctrine.rules : [];
      doctrineNode.innerHTML = `
        <div class="foundersPlanBody">
          <div class="foundersLabel">Clover rules</div>
          <strong>${htmlEscape(doctrine.activeRules?.length ? doctrine.summary : 'Teach one clear preference')}</strong>
          <div class="small">These tune Clover’s suggestions. They do not grant permission.</div>
          <div class="foundersDoctrineRules">
            ${rules.map((rule) => `
              <button
                class="btn small foundersDoctrineRule ${rule.enabled ? 'is-active' : ''}"
                type="button"
                data-doctrine-rule="${htmlEscape(rule.ruleId)}"
                data-doctrine-enabled="${rule.enabled ? 'true' : 'false'}"
                data-testid="foreman-doctrine-rule-${htmlEscape(rule.ruleId)}"
                ${pendingAction ? 'disabled' : ''}
              >
                <strong>${htmlEscape(rule.label || doctrineRuleLabel(rule.ruleId))}</strong>
                <span class="small">${htmlEscape(rule.summary || '')}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
      doctrineNode.querySelectorAll('[data-doctrine-rule]').forEach((button) => {
        button.addEventListener('click', async () => {
          if (button.hasAttribute('disabled')) return;
          const ruleId = String(button.getAttribute('data-doctrine-rule') || '');
          const enabled = String(button.getAttribute('data-doctrine-enabled') || '') !== 'true';
          try {
            pendingAction = true;
            const payload = await setForemanDoctrineRule(ruleId, enabled);
            if (payload?.result?.conflict) {
              setStatusLine('Clover needs your decision before changing that preference.');
              openDrawer('foreman', { clearSelection: false });
            } else {
              setStatusLine(`${doctrineRuleLabel(ruleId)} ${enabled ? 'enabled' : 'disabled'} for Clover.`);
            }
          } catch (error) {
            setStatusLine(error?.playerMessage || `Could not update Clover preference: ${error.message}.`);
          } finally {
            pendingAction = false;
            renderAll();
          }
        });
      });
    }

    const planNode = document.getElementById('planCard');
    const planCard = state?.foreman?.planCard || null;
    if (planNode) {
      if (!realBrainReady) {
        planNode.innerHTML = renderBrainQuickConnectCard();
      } else if (!planCard) {
        planNode.innerHTML = `
          ${renderBrainVaultSaveCard()}
          <div class="foundersPlanBody">
            <div class="foundersLabel">Foreman plan</div>
            <div class="small">Clover is watching. No safe action inside your standing order.</div>
          </div>
        `;
      } else {
        planNode.innerHTML = `
          ${renderBrainVaultSaveCard()}
          <div class="foundersPlanBody">
            <div class="foundersLabel">Foreman plan</div>
            <strong>${htmlEscape(planCard.headline || 'Foreman plan')}</strong>
            <div class="foundersPlanMeta">
              <span class="foundersBadge ${planCard.canActNow ? '' : 'is-warn'}">${htmlEscape(String(planCard.goalServed || 'town_stability').replace(/_/g, ' '))}</span>
              <span class="small">${htmlEscape(planCard.canActNow ? 'Can act now' : 'Watching only')}</span>
            </div>
            <div class="small">${htmlEscape(planCard.observation || '')}</div>
            <div class="small">${htmlEscape(planCard.recommendation || '')}</div>
            <div class="small">${htmlEscape(planCard.reason || '')}</div>
            ${planCard.standingOrderInfluence ? `<div class="small">${htmlEscape(planCard.standingOrderInfluence)}</div>` : ''}
            ${planCard.doctrineInfluence ? `<div class="small">${htmlEscape(planCard.doctrineInfluence)}</div>` : ''}
            ${planCard.alternative ? `<div class="small">${htmlEscape(planCard.alternative)}</div>` : ''}
          </div>
        `;
      }
    }

    const schedulerNode = document.getElementById('schedulerCard');
    if (schedulerNode) {
      const task = state?.foreman?.scheduler?.collectReadyOutputs || {};
      const schedulerLabel = !brainConfigured
        ? 'Connect a Brain to unlock Foreman routines.'
        : !realBrainReady
        ? 'Preview Brain cannot run Foreman routines.'
        : task.paused === true
        ? 'Clover will ask next time.'
        : task.enabled && !runtimeLocal.actionable
          ? 'Restart Clover to resume this routine.'
          : ['ERROR', 'STALE', 'TOKEN_MISSING'].includes(String(workerSchedulerStatus.lastStatus || '').toUpperCase())
            ? 'Clover needs a fresh start.'
            : task.enabled && workerSchedulerStatus.active
              ? 'Clover is watching for ready outputs while this tab is open.'
              : task.enabled
                ? 'Collect ready outputs is enabled.'
                : 'Collect ready outputs is off.';
      schedulerNode.innerHTML = `
        <div class="foundersSchedulerBody">
          <div class="foundersLabel">Foreman routine</div>
          <strong>${htmlEscape(schedulerLabel)}</strong>
          <div class="small">This helps only while you keep Founders Plot open.</div>
          <div class="foundersSchedulerRow">
            <button class="btn small" type="button" id="schedulerCollectToggle" data-testid="scheduler-collect-toggle" ${pendingAction || !realBrainReady || !runtimeLocal.actionable ? 'disabled' : ''}>
              ${task.enabled && task.paused !== true ? 'Ask me next time' : 'Enable collect ready outputs'}
            </button>
            <span class="small">${task.runCount ? `${task.runCount} successful run${task.runCount === 1 ? '' : 's'}` : 'No automatic collection yet.'}</span>
          </div>
        </div>
      `;
      const toggleBtn = document.getElementById('schedulerCollectToggle');
      if (toggleBtn) {
        toggleBtn.onclick = async () => {
          if (!realBrainReady) {
            setStatusLine(brainConfigured
              ? 'Connect a production Brain to let Clover run Foreman routines.'
              : 'Connect a Brain to let Clover run Foreman routines.');
            return;
          }
          try {
            if (task.enabled && task.paused !== true) {
              await applyReceiptCorrection('ASK_ME_NEXT_TIME');
              setStatusLine('Clover will ask next time before collecting automatically.');
            } else {
              await enableCollectReadyOutputs();
              setStatusLine('Collect ready outputs is enabled.');
            }
          } catch (error) {
            setStatusLine(error?.playerMessage || 'Could not update Clover’s routine.');
          } finally {
            renderAll();
          }
        };
      }
    }

    const governanceNode = document.getElementById('governanceCard');
    if (governanceNode) {
      const governance = state?.foreman?.governance || {};
      const lease = governance.activeLease || null;
      const persistent = governance.persistent || {};
      const persistentActive = persistent.active === true || String(persistent.status || '').toUpperCase() === 'ACTIVE';
      const leaseCopy = lease?.expiresAtMs
        ? `Active until ${new Date(Number(lease.expiresAtMs || 0)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'No active lease';
      governanceNode.innerHTML = `
        <div class="foundersPlanBody">
          <div class="foundersLabel">Governance lease</div>
          <strong>${htmlEscape(lease ? leaseCopy : 'Manual approval required')}</strong>
          <div class="small">${htmlEscape(lease ? 'Clover may handle the approved routine until the lease expires or you revoke it.' : 'Grant a short lease before routine Foreman work continues.')}</div>
          <div class="foundersInlineButtons">
            <button class="btn small" type="button" id="foremanGrantLeaseBtn" data-testid="foreman-lease-grant" ${pendingAction || !realBrainReady ? 'disabled' : ''}>Grant 15 min</button>
            <button class="btn small" type="button" id="foremanRevokeLeaseBtn" data-testid="foreman-lease-revoke" ${pendingAction || !lease ? 'disabled' : ''}>Revoke</button>
          </div>
          <div class="foundersPersistentHelp">
            <div class="foundersLabel">While-away help</div>
            <strong>${htmlEscape(persistentActive ? 'Clover is watching for ready output' : 'Off')}</strong>
            <div class="small">${htmlEscape(persistent.summary || 'Start this only when you want Clover to keep one approved routine moving while you are away.')}</div>
            <div class="foundersInlineButtons">
              <button class="btn small" type="button" id="foremanStartPersistentBtn" data-testid="foreman-persistent-start" ${pendingAction || !realBrainReady || persistentActive ? 'disabled' : ''}>Watch while away</button>
              <button class="btn small" type="button" id="foremanPausePersistentBtn" data-testid="foreman-persistent-pause" ${pendingAction || !persistentActive ? 'disabled' : ''}>Pause while-away help</button>
            </div>
          </div>
        </div>
      `;
      const grantBtn = document.getElementById('foremanGrantLeaseBtn');
      if (grantBtn) {
        grantBtn.onclick = async () => {
          if (!realBrainReady) {
            setStatusLine('Connect a production Brain before granting a Foreman lease.');
            return;
          }
          try {
            pendingAction = true;
            await grantForemanLease(15);
            setStatusLine('Clover has a 15 minute Foreman lease.');
          } catch (error) {
            setStatusLine(`Could not grant Foreman lease: ${error.message}.`);
          } finally {
            pendingAction = false;
            renderAll();
          }
        };
      }
      const revokeBtn = document.getElementById('foremanRevokeLeaseBtn');
      if (revokeBtn) {
        revokeBtn.onclick = async () => {
          try {
            pendingAction = true;
            await revokeForemanLease();
            setStatusLine('Foreman lease revoked. Clover paused routine work.');
          } catch (error) {
            setStatusLine(`Could not revoke Foreman lease: ${error.message}.`);
          } finally {
            pendingAction = false;
            renderAll();
          }
        };
      }
      const startPersistentBtn = document.getElementById('foremanStartPersistentBtn');
      if (startPersistentBtn) {
        startPersistentBtn.onclick = async () => {
          if (!realBrainReady) {
            setStatusLine('Connect a production Brain before starting while-away Clover help.');
            return;
          }
          try {
            pendingAction = true;
            await startPersistentForeman(120);
            setStatusLine('Clover can watch for ready output while you are away.');
          } catch (error) {
            setStatusLine(error?.playerMessage || `Could not start while-away help: ${error.message}.`);
          } finally {
            pendingAction = false;
            renderAll();
          }
        };
      }
      const pausePersistentBtn = document.getElementById('foremanPausePersistentBtn');
      if (pausePersistentBtn) {
        pausePersistentBtn.onclick = async () => {
          try {
            pendingAction = true;
            await pausePersistentForeman();
            setStatusLine('While-away Clover help paused.');
          } catch (error) {
            setStatusLine(error?.playerMessage || `Could not pause while-away help: ${error.message}.`);
          } finally {
            pendingAction = false;
            renderAll();
          }
        };
      }
    }

    const specialistsNode = document.getElementById('specialistsCard');
    if (specialistsNode) {
      const specialists = state?.foreman?.specialists || {};
      const gate = specialists.gate || {};
      const roles = Array.isArray(specialists.roles) ? specialists.roles : [];
      const ready = gate.ready === true;
      specialistsNode.innerHTML = `
        <div class="foundersPlanBody">
          <div class="foundersSignalHeader">
            <div>
              <div class="foundersLabel">Specialists</div>
              <strong>${htmlEscape(specialists.summary || 'Specialist lanes are not staffed yet.')}</strong>
            </div>
            <span class="foundersBadge ${ready ? '' : 'is-warn'}">${htmlEscape(ready ? 'Ready' : 'Locked')}</span>
          </div>
          <div class="small">${htmlEscape(gate.summary || 'Choose a charter and prove one bounded Clover routine before adding specialists.')}</div>
          <div class="foundersOperatingGrid foundersSpecialistGrid">
            ${roles.map((role) => {
              const roleId = String(role.roleId || '');
              const active = role.active === true || String(role.status || '').toUpperCase() === 'ACTIVE';
              const paused = role.paused === true || String(role.status || '').toUpperCase() === 'PAUSED';
              const domainLabel = specialistDomainLabel(role.domainId);
              const assignable = Array.isArray(role.assignableDomains) ? role.assignableDomains : [];
              return `
                <article class="foundersSettlementCard${active ? ' is-active' : paused ? ' is-paused' : ''}" data-testid="specialist-role-card" data-specialist-role-card="${htmlEscape(roleId)}">
                  <div class="foundersSignalHeader">
                    <strong>${htmlEscape(role.label || specialistRoleLabel(roleId))}</strong>
                    <span class="foundersBadge">${htmlEscape(active ? domainLabel : paused ? 'Paused' : 'Open')}</span>
                  </div>
                  <div class="small">${htmlEscape(role.summary || '')}</div>
                  <div class="small">${htmlEscape(active ? `${domainLabel}: ${specialistToolSummary(role.domain || {})}` : 'Choose a bounded lane for this specialist.')}</div>
                  <div class="foundersInlineButtons">
                    ${assignable.map((domain) => {
                      const domainId = String(domain.domainId || '');
                      const alreadyActive = active && String(role.domainId || '') === domainId;
                      return `
                        <button
                          class="btn small"
                          type="button"
                          data-specialist-assign-role="${htmlEscape(roleId)}"
                          data-specialist-assign-domain="${htmlEscape(domainId)}"
                          data-testid="specialist-assign-${htmlEscape(roleId.toLowerCase())}-${htmlEscape(domainId)}"
                          ${pendingAction || !ready || alreadyActive ? 'disabled' : ''}
                        >${htmlEscape(specialistDomainLabel(domainId))}</button>
                      `;
                    }).join('')}
                    <button class="btn small" type="button" data-specialist-pause="${htmlEscape(roleId)}" data-testid="specialist-pause-${htmlEscape(roleId.toLowerCase())}" ${pendingAction || !active ? 'disabled' : ''}>Pause</button>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </div>
      `;
      specialistsNode.querySelectorAll('[data-specialist-assign-role]').forEach((button) => {
        button.addEventListener('click', async () => {
          if (button.hasAttribute('disabled')) return;
          const roleId = String(button.getAttribute('data-specialist-assign-role') || '');
          const domainId = String(button.getAttribute('data-specialist-assign-domain') || '');
          try {
            pendingAction = true;
            const response = await assignSpecialist(roleId, domainId);
            if (response?.conflict) {
              setStatusLine('Clover needs your decision before reassigning that specialist lane.');
            } else {
              setStatusLine(`${specialistRoleLabel(roleId)} assigned to ${specialistDomainLabel(domainId)}.`);
            }
          } catch (error) {
            setStatusLine(error?.playerMessage || `Could not assign specialist: ${error.message}.`);
          } finally {
            pendingAction = false;
            renderAll();
          }
        });
      });
      specialistsNode.querySelectorAll('[data-specialist-pause]').forEach((button) => {
        button.addEventListener('click', async () => {
          if (button.hasAttribute('disabled')) return;
          const roleId = String(button.getAttribute('data-specialist-pause') || '');
          try {
            pendingAction = true;
            await pauseSpecialist(roleId);
            setStatusLine(`${specialistRoleLabel(roleId)} paused.`);
          } catch (error) {
            setStatusLine(error?.playerMessage || `Could not pause specialist: ${error.message}.`);
          } finally {
            pendingAction = false;
            renderAll();
          }
        });
      });
    }

    const exceptionNode = document.getElementById('exceptionCard');
    if (exceptionNode) {
      const exceptions = Array.isArray(state?.foreman?.governance?.openExceptions)
        ? state.foreman.governance.openExceptions
        : [];
      if (exceptions.length === 0) {
        exceptionNode.innerHTML = `
          <div class="foundersPlanBody">
            <div class="foundersLabel">Exception inbox</div>
            <div class="small">No Foreman exceptions.</div>
          </div>
        `;
      } else {
        exceptionNode.innerHTML = `
          <div class="foundersPlanBody">
            <div class="foundersLabel">Exception inbox</div>
            ${exceptions.map((exception) => `
              <div class="foundersApprovalItem" data-testid="foreman-exception-item">
                <strong>${htmlEscape(exception.title || 'Clover needs a decision')}</strong>
                <div class="small">${htmlEscape(exception.body || '')}</div>
                <div class="foundersInlineButtons">
                  <button class="btn small" type="button" data-resolve-foreman-exception="${htmlEscape(exception.exceptionId)}" data-testid="foreman-exception-resolve">Resolve</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
        exceptionNode.querySelectorAll('[data-resolve-foreman-exception]').forEach((button) => {
          button.addEventListener('click', async () => {
            const exceptionId = String(button.getAttribute('data-resolve-foreman-exception') || '');
            try {
              pendingAction = true;
              await resolveForemanException(exceptionId, 'RESOLVED');
              setStatusLine('Foreman exception resolved.');
            } catch (error) {
              setStatusLine(`Could not resolve exception: ${error.message}.`);
            } finally {
              pendingAction = false;
              renderAll();
            }
          });
        });
      }
    }

    const receiptNode = document.getElementById('receiptCard');
    const receipt = state?.foreman?.receipt || null;
    if (receiptNode) {
      if (!receipt) {
        receiptNode.innerHTML = `
          <div class="foundersReceiptBody">
            <div class="foundersLabel">Latest receipt</div>
            <div class="small">Clover has not acted yet.</div>
          </div>
        `;
      } else {
        receiptNode.innerHTML = `
          <div class="foundersReceiptBody">
            <div class="foundersLabel">Latest receipt</div>
            <strong>${htmlEscape(receipt.action === 'collect_ready_outputs' ? 'Clover collected ready output' : receipt.action || 'Foreman action')}</strong>
            <div class="foundersReceiptMeta">
              <span class="small">Event #${htmlEscape(String(receipt.eventId || '0'))}</span>
              ${receipt.standingOrderUsed ? `<span class="small">${htmlEscape(prettyStandingOrder(receipt.standingOrderUsed))}</span>` : ''}
            </div>
            <div class="small">${htmlEscape(receipt.reason || receipt.result || '')}</div>
            ${receipt.doctrineUsed?.summary ? `<div class="small">${htmlEscape(receipt.doctrineUsed.summary)}</div>` : ''}
            <div class="foundersReceiptActions">
              <button class="btn small" type="button" id="receiptAskNextTime" data-testid="receipt-ask-next-time" ${pendingAction ? 'disabled' : ''}>Ask me next time</button>
              <button class="btn small" type="button" id="receiptPauseForeman" data-testid="receipt-pause-foreman" ${pendingAction ? 'disabled' : ''}>Pause Foreman</button>
            </div>
          </div>
        `;
        const askBtn = document.getElementById('receiptAskNextTime');
        if (askBtn) {
          askBtn.onclick = async () => {
            try {
              await applyReceiptCorrection('ASK_ME_NEXT_TIME');
              setStatusLine('Clover will ask next time before repeating that routine.');
            } catch (error) {
              setStatusLine(`Could not update Clover’s routine: ${error.message}.`);
            } finally {
              renderAll();
            }
          };
        }
        const pauseReceiptBtn = document.getElementById('receiptPauseForeman');
        if (pauseReceiptBtn) {
          pauseReceiptBtn.onclick = async () => {
            try {
              await applyReceiptCorrection('PAUSE_FOREMAN');
              setStatusLine('Foreman paused.');
            } catch (error) {
              setStatusLine(`Could not pause Clover: ${error.message}.`);
            } finally {
              renderAll();
            }
          };
        }
      }
    }
    bindBrainQuickConnectCard(document);
  }

  function permissionConfig() {
    return [
      { key: 'observeAndSuggest', label: 'Observe + suggest', level: 1 },
      { key: 'collectOutputs', label: 'Collect outputs', level: 1 },
      { key: 'queueProduction', label: 'Queue production', level: 3 },
      { key: 'setPriority', label: 'Set one priority', level: 4 },
      { key: 'sellSurplusFood', label: 'Sell surplus food', level: 5 }
    ];
  }

  function renderPermissions(state) {
    const node = document.getElementById('permissionsList');
    if (!node) return;
    node.innerHTML = '';
    const currentLevel = state?.progress?.currentLevel || state?.plot?.hqLevel || 1;
    for (const item of permissionConfig()) {
      const wrapper = document.createElement('div');
      wrapper.className = 'foundersPermissionItem';
      const enabled = !!state?.policy?.[item.key];
      const unlocked = currentLevel >= item.level;
      wrapper.innerHTML = `
        <div class="foundersPermissionToggle">
          <div>
            <strong>${htmlEscape(item.label)}</strong>
            <div class="small">${unlocked ? 'Unlocked' : `Unlocks at HQ ${item.level}`}</div>
          </div>
          <span class="foundersBadge ${enabled ? '' : 'is-warn'}">${enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      `;
      wrapper.appendChild(actionButton(
        enabled ? 'Disable' : 'Enable',
        async () => updatePolicy(item.key, !enabled),
        `permission-${item.key}`,
        !unlocked
      ));
      node.appendChild(wrapper);
    }
  }

  function renderApprovals(state) {
    const node = document.getElementById('approvalsList');
    if (!node) return;
    const approvals = Array.isArray(state?.foreman?.pendingApprovals) ? state.foreman.pendingApprovals : [];
    if (approvals.length === 0) {
      node.innerHTML = '<div class="foundersEmptyState">No pending approvals.</div>';
      return;
    }
    node.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'foundersApprovalList';
    approvals.forEach((approval) => {
      const item = document.createElement('div');
      item.className = 'foundersApprovalItem';
      item.innerHTML = `
        <strong>${htmlEscape(approval.title)}</strong>
        <div class="small">${htmlEscape(approval.body)}</div>
      `;
      const actions = document.createElement('div');
      actions.className = 'foundersApprovalActions';
      actions.appendChild(actionButton('Approve', async () => resolveApproval(approval.approvalId, 'approve'), `approve-${approval.approvalId}`));
      actions.appendChild(actionButton('Reject', async () => resolveApproval(approval.approvalId, 'reject'), `reject-${approval.approvalId}`));
      item.appendChild(actions);
      list.appendChild(item);
    });
    node.appendChild(list);
  }

  function renderRewards(state) {
    const node = document.getElementById('rewardsList');
    if (!node) return;
    const rewards = Array.isArray(state?.rewards) ? state.rewards : [];
    if (rewards.length === 0) {
      node.innerHTML = '<div class="foundersEmptyState">No rewards ready.</div>';
      return;
    }
    node.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'foundersRewardsList';
    rewards.forEach((reward) => {
      const item = document.createElement('div');
      item.className = 'foundersRewardItem';
      item.innerHTML = `
        <strong>${htmlEscape(reward.title)}</strong>
        <div class="small">${htmlEscape(reward.body || '')}</div>
      `;
      item.appendChild(actionButton('Claim reward', async () => claimReward(reward.key), `claim-${reward.key}`));
      list.appendChild(item);
    });
    node.appendChild(list);
  }

  function renderQueue(state) {
    setText('queueSummaryText', queueSummary(state));
    const node = document.getElementById('queueList');
    if (!node) return;
    const jobs = Array.isArray(state?.jobs) ? state.jobs : [];
    if (jobs.length === 0) {
      node.innerHTML = '<div class="foundersEmptyState">No active or pending jobs.</div>';
      return;
    }
    node.innerHTML = jobs.map((job) => {
      const building = findBuilding(job.buildingId);
      return `
        <div class="foundersQueueItem">
          <strong>${htmlEscape(BUILDING_LABELS[building?.type] || 'Building')}</strong>
          <div class="small">${htmlEscape(job.kind.toLowerCase())} · ${htmlEscape(job.status.toLowerCase())} · ends in ${htmlEscape(formatDuration(job.endsAt))}</div>
        </div>
      `;
    }).join('');
  }

  function renderSettlements(state) {
    const node = document.getElementById('governorLedger');
    if (!node) return;
    const settlementsEnabled = roadmapFeatureEnabled('FEATURE_FOUNDERS_V25_SECOND_SETTLEMENT', state);
    const regionalEnabled = roadmapFeatureEnabled('FEATURE_FOUNDERS_V35_REGIONAL_GOVERNANCE', state);
    if (!settlementsEnabled && !regionalEnabled) {
      node.innerHTML = '';
      return;
    }
    const ledger = state?.settlements || {};
    const settlements = Array.isArray(ledger.settlements) ? ledger.settlements : [];
    const gate = ledger.stabilityGate || {};
    const expedition = ledger.expedition || {};
    const hasSecondSettlement = settlements.some((entry) => entry.settlementId === 'town_2');
    const launchReady = String(expedition.status || '').toUpperCase() === 'READY';
    const criteria = Array.isArray(gate.criteria) ? gate.criteria : [];
    const regional = regionalEnabled ? state?.regionalNetwork || {} : {};
    const regionalGate = regional.gate || {};
    const regionalCriteria = Array.isArray(regionalGate.criteria) ? regionalGate.criteria : [];
    const routes = regionalEnabled && Array.isArray(regional.routes) ? regional.routes : [];
    const contracts = regionalEnabled && Array.isArray(regional.contracts) ? regional.contracts : [];
    const issues = regionalEnabled && Array.isArray(regional.issues) ? regional.issues : [];
    const reserves = regional.sharedReserves || {};
    node.innerHTML = `
      <section class="foundersGovernorSummary" data-testid="governor-ledger-summary">
        <div>
          <div class="foundersLabel">Governor Ledger</div>
          <strong>${htmlEscape(ledger.summary || 'Stabilize the first town before launching settlers.')}</strong>
          <div class="small">${htmlEscape(gate.summary || '')}</div>
        </div>
        <button class="btn primary small" type="button" id="settlerExpeditionLaunchBtn" data-testid="settler-expedition-launch" ${pendingAction || !launchReady || hasSecondSettlement ? 'disabled' : ''}>Launch settlers</button>
      </section>
      <div class="foundersSettlementCriteria">
        ${criteria.map((item) => `
          <span class="foundersBadge ${item.met ? '' : 'is-warn'}">${htmlEscape(item.met ? 'Ready' : 'Needed')}: ${htmlEscape(item.label || '')}</span>
        `).join('')}
      </div>
      <div class="foundersSettlementList">
        ${settlements.map((settlement) => {
          const active = String(settlement.settlementId || '') === String(ledger.activeSettlementId || '');
          const inventory = settlement.inventory || {};
          const tasks = Array.isArray(settlement.foundingTasks) ? settlement.foundingTasks : [];
          return `
            <article class="foundersSettlementCard${active ? ' is-active' : ''}" data-testid="governor-ledger-settlement" data-settlement-id="${htmlEscape(settlement.settlementId || '')}">
              <div class="foundersSignalHeader">
                <strong>${htmlEscape(settlement.name || 'Settlement')}</strong>
                <span class="foundersBadge">${htmlEscape(active ? 'Focused' : settlement.status || 'Active')}</span>
              </div>
              <div class="small">HQ ${htmlEscape(String(settlement.hqLevel || 1))} · ${htmlEscape(String(settlement.buildingCount || 0))} building${Number(settlement.buildingCount || 0) === 1 ? '' : 's'} · ${htmlEscape(String(settlement.pendingDecisionCount || 0))} pending</div>
              <div class="small">W ${htmlEscape(String(inventory.wood || 0))} · S ${htmlEscape(String(inventory.stone || 0))} · F ${htmlEscape(String(inventory.food || 0))} · C ${htmlEscape(String(inventory.coin || 0))}</div>
              <div class="foundersInlineButtons">
                <button class="btn small" type="button" data-settlement-focus="${htmlEscape(settlement.settlementId || '')}" ${pendingAction || active ? 'disabled' : ''}>Focus</button>
              </div>
              ${tasks.length > 0 ? `
                <div class="foundersSettlementTasks">
                  ${tasks.map((task) => `
                    <div class="foundersApprovalItem">
                      <strong>${htmlEscape(task.label || 'Founding task')}</strong>
                      <div class="small">${htmlEscape(task.body || '')}</div>
                      <div class="small">Cost: W ${htmlEscape(String(task.cost?.wood || 0))} · F ${htmlEscape(String(task.cost?.food || 0))}</div>
                      <button class="btn small" type="button" data-settlement-task="${htmlEscape(task.taskId || '')}" data-settlement-task-owner="${htmlEscape(settlement.settlementId || '')}" ${pendingAction || task.status === 'COMPLETED' ? 'disabled' : ''}>${task.status === 'COMPLETED' ? 'Completed' : 'Complete task'}</button>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </article>
          `;
        }).join('')}
      </div>
      ${regionalEnabled ? `<section class="foundersRegionalPanel" data-testid="regional-ledger-panel">
        <div class="foundersSignalHeader">
          <div>
            <div class="foundersLabel">Regional Ledger</div>
            <strong>${htmlEscape(regional.summary || 'Regional routes are not ready yet.')}</strong>
            <div class="small">${htmlEscape(regionalGate.summary || '')}</div>
          </div>
          <span class="foundersBadge ${issues.length > 0 ? 'is-warn' : ''}">${htmlEscape(issues.length > 0 ? `${issues.length} issue${issues.length === 1 ? '' : 's'}` : 'Clear')}</span>
        </div>
        <div class="foundersSettlementCriteria">
          ${regionalCriteria.map((item) => `
            <span class="foundersBadge ${item.met ? '' : 'is-warn'}">${htmlEscape(item.met ? 'Ready' : 'Needed')}: ${htmlEscape(item.label || '')}</span>
          `).join('')}
        </div>
        <div class="small">Shared reserves: W ${htmlEscape(String(reserves.wood || 0))} · S ${htmlEscape(String(reserves.stone || 0))} · F ${htmlEscape(String(reserves.food || 0))} · C ${htmlEscape(String(reserves.coin || 0))}</div>
        <div class="foundersRegionalMap" data-testid="regional-map">
          ${settlements.map((settlement) => {
            const settlementId = String(settlement.settlementId || '');
            const active = String(ledger.activeSettlementId || '') === settlementId;
            return `
              <button
                class="foundersRegionalNode${active ? ' is-active' : ''}"
                type="button"
                data-regional-map-focus="${htmlEscape(settlementId)}"
                data-testid="regional-map-node-${htmlEscape(settlementId)}"
                ${pendingAction || active ? 'disabled' : ''}
              >
                <strong>${htmlEscape(settlement.name || settlementId || 'Settlement')}</strong>
                <span>${htmlEscape(active ? 'Camera focus' : 'Jump')}</span>
              </button>
            `;
          }).join('')}
          ${routes.map((route) => `
            <div class="foundersRegionalMapRoute${String(route.status || '').toUpperCase() === 'SHORTAGE' ? ' is-shortage' : ''}" data-testid="regional-map-route-${htmlEscape(route.routeId || '')}">
              ${htmlEscape(route.label || 'Supply route')} · ${htmlEscape(String(route.status || 'locked').toLowerCase().replace(/_/g, ' '))}
            </div>
          `).join('')}
        </div>
        ${issues.length > 0 ? `
          <div class="foundersSettlementTasks">
            ${issues.map((issue) => `
              <div class="foundersApprovalItem" data-testid="regional-ledger-issue">
                <strong>${htmlEscape(issue.title || 'Regional issue')}</strong>
                <div class="small">${htmlEscape(issue.summary || '')}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div class="foundersRegionalGrid">
          ${routes.map((route) => {
            const routeStatus = String(route.status || 'LOCKED').toUpperCase();
            const canOpen = routeStatus === 'READY';
            const canTransfer = routeStatus === 'ACTIVE' || routeStatus === 'SHORTAGE';
            return `
              <article class="foundersSettlementCard${canTransfer ? ' is-active' : ''}${routeStatus === 'SHORTAGE' ? ' is-paused' : ''}" data-testid="regional-route-${htmlEscape(route.routeId || '')}">
                <div class="foundersSignalHeader">
                  <strong>${htmlEscape(route.label || 'Supply route')}</strong>
                  <span class="foundersBadge ${routeStatus === 'SHORTAGE' ? 'is-warn' : ''}">${htmlEscape(routeStatus === 'READY' ? 'Ready' : routeStatus.toLowerCase().replace(/_/g, ' '))}</span>
                </div>
                <div class="small">${htmlEscape(route.fromSettlementName || route.fromSettlementId || '')} -> ${htmlEscape(route.toSettlementName || route.toSettlementId || '')}</div>
                <div class="small">Shipment: ${htmlEscape(String(route.transferAmount || 0))} ${htmlEscape(route.resource || 'wood')} · moved ${htmlEscape(String(route.totalTransfers || 0))}</div>
                ${route.shortage ? `<div class="small">Waiting on ${htmlEscape(route.shortage.resource || route.resource || 'supplies')}.</div>` : ''}
                <div class="foundersInlineButtons">
                  <button class="btn small" type="button" data-regional-open-route="${htmlEscape(route.routeId || '')}" data-testid="regional-open-route-${htmlEscape(route.routeId || '')}" ${pendingAction || !canOpen ? 'disabled' : ''}>Open route</button>
                  <button class="btn small" type="button" data-regional-transfer-route="${htmlEscape(route.routeId || '')}" data-testid="regional-transfer-route-${htmlEscape(route.routeId || '')}" ${pendingAction || !canTransfer ? 'disabled' : ''}>${routeStatus === 'SHORTAGE' ? 'Retry shipment' : 'Send shipment'}</button>
                </div>
              </article>
            `;
          }).join('')}
          ${contracts.map((contract) => {
            const contractStatus = String(contract.status || 'LOCKED').toUpperCase();
            return `
              <article class="foundersSettlementCard${contractStatus === 'ACTIVE' || contractStatus === 'READY_TO_TURN_IN' ? ' is-active' : ''}" data-testid="regional-contract-${htmlEscape(contract.contractId || '')}">
                <div class="foundersSignalHeader">
                  <strong>${htmlEscape(contract.title || 'Regional contract')}</strong>
                  <span class="foundersBadge">${htmlEscape(contractStatus.toLowerCase().replace(/_/g, ' '))}</span>
                </div>
                <div class="small">${htmlEscape(contract.fromSettlementName || contract.fromSettlementId || '')} + ${htmlEscape(contract.toSettlementName || contract.toSettlementId || '')}</div>
                <div class="small">${htmlEscape(contract.summary || '')}</div>
                <div class="small">Progress: ${htmlEscape(contract.progressLabel || '')} · Reward: C ${htmlEscape(String(contract.reward?.coin || 0))}</div>
                <div class="foundersInlineButtons">
                  <button class="btn small" type="button" data-regional-accept-contract="${htmlEscape(contract.contractId || '')}" data-testid="regional-accept-contract-${htmlEscape(contract.contractId || '')}" ${pendingAction || contractStatus !== 'AVAILABLE' ? 'disabled' : ''}>Accept</button>
                  <button class="btn small" type="button" data-regional-turn-in-contract="${htmlEscape(contract.contractId || '')}" data-testid="regional-turn-in-contract-${htmlEscape(contract.contractId || '')}" ${pendingAction || contractStatus !== 'READY_TO_TURN_IN' ? 'disabled' : ''}>Turn in</button>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </section>` : ''}
    `;
    const launchButton = document.getElementById('settlerExpeditionLaunchBtn');
    if (launchButton) {
      launchButton.onclick = async () => {
        try {
          pendingAction = true;
          await runTool('et.plot.settlements.launch_expedition', {
            idempotencyKey: `settler-expedition:${Date.now()}`
          });
          openDrawer('settlements', { clearSelection: false });
          setStatusLine('Settler Expedition launched Ridge Outpost.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not launch settlers: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      };
    }
    node.querySelectorAll('[data-settlement-focus]').forEach((button) => {
      button.addEventListener('click', async () => {
        const settlementId = String(button.getAttribute('data-settlement-focus') || '');
        try {
          pendingAction = true;
          await runTool('et.plot.settlements.focus', {
            settlementId,
            idempotencyKey: `settlement-focus:${settlementId}:${Date.now()}`
          });
          openDrawer('settlements', { clearSelection: false });
          setStatusLine(settlementId === 'town_1' ? 'Focused Founders Plot.' : 'Focused Ridge Outpost.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not focus settlement: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    });
    node.querySelectorAll('[data-settlement-task]').forEach((button) => {
      button.addEventListener('click', async () => {
        const taskId = String(button.getAttribute('data-settlement-task') || '');
        const settlementId = String(button.getAttribute('data-settlement-task-owner') || 'town_2');
        try {
          pendingAction = true;
          await runTool('et.plot.settlements.complete_founding_task', {
            settlementId,
            taskId,
            idempotencyKey: `settlement-task:${settlementId}:${taskId}:${Date.now()}`
          });
          openDrawer('settlements', { clearSelection: false });
          setStatusLine('Ridge Outpost founding task completed.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not complete founding task: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    });
    node.querySelectorAll('[data-regional-map-focus]').forEach((button) => {
      button.addEventListener('click', async () => {
        const settlementId = String(button.getAttribute('data-regional-map-focus') || '');
        try {
          pendingAction = true;
          await runTool('et.plot.settlements.focus', {
            settlementId,
            idempotencyKey: `regional-map-focus:${settlementId}:${Date.now()}`
          });
          openDrawer('settlements', { clearSelection: false });
          setStatusLine(settlementId === 'town_2' ? 'Camera jumped to Ridge Outpost.' : 'Camera centered on Founders Plot.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not jump to settlement: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    });
    node.querySelectorAll('[data-regional-open-route]').forEach((button) => {
      button.addEventListener('click', async () => {
        const routeId = String(button.getAttribute('data-regional-open-route') || '');
        try {
          pendingAction = true;
          await runTool('et.plot.regional.open_supply_route', {
            routeId,
            idempotencyKey: `regional-open:${routeId}:${Date.now()}`
          });
          openDrawer('settlements', { clearSelection: false });
          setStatusLine('Regional supply route opened.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not open route: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    });
    node.querySelectorAll('[data-regional-transfer-route]').forEach((button) => {
      button.addEventListener('click', async () => {
        const routeId = String(button.getAttribute('data-regional-transfer-route') || '');
        try {
          pendingAction = true;
          await runTool('et.plot.regional.transfer_supply_route', {
            routeId,
            fromSettlementId: 'town_1',
            toSettlementId: 'town_2',
            idempotencyKey: `regional-transfer:${routeId}:${Date.now()}`
          });
          openDrawer('settlements', { clearSelection: false });
          setStatusLine('Regional shipment updated.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not send shipment: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    });
    node.querySelectorAll('[data-regional-accept-contract]').forEach((button) => {
      button.addEventListener('click', async () => {
        const contractId = String(button.getAttribute('data-regional-accept-contract') || '');
        try {
          pendingAction = true;
          await runTool('et.plot.regional.accept_contract', {
            contractId,
            idempotencyKey: `regional-accept:${contractId}:${Date.now()}`
          });
          openDrawer('settlements', { clearSelection: false });
          setStatusLine('Regional contract accepted.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not accept regional contract: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    });
    node.querySelectorAll('[data-regional-turn-in-contract]').forEach((button) => {
      button.addEventListener('click', async () => {
        const contractId = String(button.getAttribute('data-regional-turn-in-contract') || '');
        try {
          pendingAction = true;
          await runTool('et.plot.regional.turn_in_contract', {
            contractId,
            idempotencyKey: `regional-turn-in:${contractId}:${Date.now()}`
          });
          openDrawer('settlements', { clearSelection: false });
          setStatusLine('Regional contract completed.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not turn in regional contract: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    });
  }

  function renderOperatingModel(state) {
    const node = document.getElementById('operatingModelPanel');
    if (!node) return;
    const operatingEnabled = roadmapFeatureEnabled('FEATURE_FOUNDERS_V30_OPERATING_MODEL', state);
    const operatingStyleSharingEnabled = roadmapFeatureEnabled('FEATURE_FOUNDERS_V40_OPERATING_STYLE_SHARING', state);
    if (!operatingEnabled) {
      node.innerHTML = '';
      return;
    }
    const operating = state?.operatingModel || {};
    const gate = operating.gate || {};
    const criteria = Array.isArray(gate.criteria) ? gate.criteria : [];
    const charters = Array.isArray(operating.availableCharters) ? operating.availableCharters : [];
    const capabilities = Array.isArray(operating.capabilities) ? operating.capabilities : [];
    const selectedCharterId = String(operating.selectedCharterId || '');
    const canChoose = gate.ready === true && !selectedCharterId;
    const allowedActions = Array.isArray(operating.allowedActions) ? operating.allowedActions : [];
    const styleCard = currentOperatingStyleCard || null;
    const styleTags = Array.isArray(styleCard?.styleTags) ? styleCard.styleTags : [];
    const styleSpecialists = Array.isArray(styleCard?.specialists?.assignments) ? styleCard.specialists.assignments : [];
    const styleCapabilities = Array.isArray(styleCard?.capabilityWeb) ? styleCard.capabilityWeb : [];
    const stylePreviewHtml = styleCard ? `
      <div class="foundersOperatingStylePreview" data-testid="operating-style-card-preview">
        <div class="foundersSignalHeader">
          <div>
            <div class="foundersLabel">Operating style</div>
            <strong>${htmlEscape(styleCard.charter?.label || styleCard.title || 'Founders Plot Operating Style')}</strong>
          </div>
          <span class="foundersBadge">Shareable</span>
        </div>
        <div class="small">${htmlEscape(styleCard.doctrine?.summary || styleCard.charter?.summary || 'A public town-running style summary.')}</div>
        <div class="foundersPlotCardStats">
          <span>HQ ${htmlEscape(String(styleCard.hqLevel || 1))}</span>
          <span>${htmlEscape(String(styleCapabilities.length))} paths</span>
          <span>${htmlEscape(String(styleSpecialists.length))} Clover lanes</span>
          <span>${htmlEscape(String(styleCard.regionalNetwork?.activeRouteCount || 0))} routes</span>
        </div>
        ${styleTags.length > 0 ? `
          <div class="foundersStyleTags">
            ${styleTags.map((tag) => `<span>${htmlEscape(tag)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    ` : '';
    node.innerHTML = `
      <section class="foundersOperatingSummary" data-testid="operating-model-summary">
        <div>
          <div class="foundersLabel">Town Charter</div>
          <strong>${htmlEscape(operating.summary || 'Found Ridge Outpost before choosing an operating charter.')}</strong>
          <div class="small">${htmlEscape(gate.summary || '')}</div>
        </div>
        <button class="btn primary small" type="button" data-operating-refresh="1" data-testid="operating-refresh-contracts" ${pendingAction || !allowedActions.includes('refresh_contracts') ? 'disabled' : ''}>Refresh board</button>
      </section>
      <div class="foundersSettlementCriteria">
        ${criteria.map((item) => `
          <span class="foundersBadge ${item.met ? '' : 'is-warn'}">${htmlEscape(item.met ? 'Ready' : 'Needed')}: ${htmlEscape(item.label || '')}</span>
        `).join('')}
      </div>
      <div class="foundersOperatingGrid">
        ${charters.map((charter) => {
          const active = String(charter.charterId || '') === selectedCharterId;
          return `
            <article class="foundersSettlementCard${active ? ' is-active' : ''}" data-testid="operating-charter-card" data-charter-card="${htmlEscape(charter.charterId || '')}">
              <div class="foundersSignalHeader">
                <strong>${htmlEscape(charter.label || 'Charter')}</strong>
                <span class="foundersBadge">${htmlEscape(active ? 'Chosen' : charter.axis || 'Option')}</span>
              </div>
              <div class="small">${htmlEscape(charter.summary || '')}</div>
              <div class="small">Banner: ${htmlEscape(charter.bannerText || charter.label || 'Town charter')}</div>
              <button class="btn small" type="button" data-operating-charter="${htmlEscape(charter.charterId || '')}" data-testid="operating-charter-${htmlEscape(String(charter.charterId || '').toLowerCase())}" ${pendingAction || !canChoose || active ? 'disabled' : ''}>Choose</button>
            </article>
          `;
        }).join('')}
      </div>
      ${operatingStyleSharingEnabled ? `<section class="foundersDrawerSection foundersOperatingShare" data-testid="operating-style-section">
        <div class="foundersSignalHeader">
          <div>
            <div class="foundersLabel">Share style</div>
            <strong>How this town runs</strong>
            <div class="small">Charter, doctrine, Clover lanes, and routes only.</div>
          </div>
          <button class="btn small" type="button" data-operating-style-generate="1" data-testid="operating-style-generate-btn" ${pendingAction ? 'disabled' : ''}>Generate</button>
        </div>
        ${stylePreviewHtml || '<div class="small" data-testid="operating-style-card-empty">Generate a public operating style when you want to compare town-running ideas.</div>'}
      </section>` : ''}
      <section class="foundersDrawerSection">
        <div class="foundersLabel">Capability Web</div>
        <div class="foundersOperatingGrid">
          ${capabilities.map((capability) => `
            <article class="foundersSettlementCard${capability.unlocked ? ' is-active' : ''}" data-testid="operating-capability-card" data-capability-card="${htmlEscape(capability.capabilityId || '')}">
              <div class="foundersSignalHeader">
                <strong>${htmlEscape(capability.label || 'Capability')}</strong>
                <span class="foundersBadge">${htmlEscape(capability.unlocked ? 'Unlocked' : capability.available ? 'Ready' : 'Locked')}</span>
              </div>
              <div class="small">${htmlEscape(capability.summary || '')}</div>
              ${Array.isArray(capability.unlocksTools) && capability.unlocksTools.length > 0 ? `<div class="small">Adds: ${htmlEscape(capability.unlocksTools.join(', '))}</div>` : ''}
              ${capability.lockedReason && !capability.unlocked ? `<div class="small">${htmlEscape(capability.lockedReason)}</div>` : ''}
              <button class="btn small" type="button" data-operating-capability="${htmlEscape(capability.capabilityId || '')}" data-testid="operating-capability-${htmlEscape(String(capability.capabilityId || '').toLowerCase())}" ${pendingAction || !capability.available ? 'disabled' : ''}>Unlock</button>
            </article>
          `).join('')}
        </div>
      </section>
    `;
    node.querySelectorAll('[data-operating-charter]').forEach((button) => {
      button.addEventListener('click', async () => {
        const charterId = String(button.getAttribute('data-operating-charter') || '');
        try {
          pendingAction = true;
          await runTool('et.plot.operating_model.choose_charter', {
            charterId,
            idempotencyKey: `operating-charter:${charterId}:${Date.now()}`
          });
          openDrawer('operating', { clearSelection: false });
          setStatusLine('Town charter chosen.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not choose charter: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    });
    node.querySelectorAll('[data-operating-capability]').forEach((button) => {
      button.addEventListener('click', async () => {
        const capabilityId = String(button.getAttribute('data-operating-capability') || '');
        try {
          pendingAction = true;
          await runTool('et.plot.operating_model.unlock_capability', {
            capabilityId,
            idempotencyKey: `operating-capability:${capabilityId}:${Date.now()}`
          });
          openDrawer('operating', { clearSelection: false });
          setStatusLine('Capability unlocked.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not unlock capability: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    });
    const refreshButton = node.querySelector('[data-operating-refresh]');
    if (refreshButton) {
      refreshButton.addEventListener('click', async () => {
        try {
          pendingAction = true;
          await runTool('et.plot.operating_model.refresh_contracts', {
            idempotencyKey: `operating-refresh:${Date.now()}`
          });
          openDrawer('operating', { clearSelection: false });
          setStatusLine('Contract Board refreshed through the town charter.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not refresh contracts: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    }
    const styleButton = node.querySelector('[data-operating-style-generate]');
    if (styleButton) {
      styleButton.addEventListener('click', async () => {
        try {
          await generateOperatingStyleCard();
          openDrawer('operating', { clearSelection: false });
        } catch {
          // status line already updated
        }
      });
    }
  }

  function creatorTestSlug(extensionId) {
    return String(extensionId || 'creator-building').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'creator-building';
  }

  function renderCreatorExtensions(state) {
    const node = document.getElementById('creatorExtensionsPanel');
    if (!node) return;
    if (!roadmapFeatureEnabled('FEATURE_FOUNDERS_V45_CREATOR_BUILDINGS', state)) {
      node.innerHTML = '';
      return;
    }
    const creator = state?.creatorExtensions || {};
    const catalog = Array.isArray(creator.catalog) ? creator.catalog : [];
    const installed = Array.isArray(creator.installed) ? creator.installed : [];
    if (catalog.length === 0) {
      node.innerHTML = '<div class="foundersEmptyState">No approved creator buildings are ready yet.</div>';
      return;
    }
    node.innerHTML = `
      <section class="foundersOperatingSummary" data-testid="creator-extensions-summary">
        <div>
          <div class="foundersLabel">Creator Buildings</div>
          <strong>${htmlEscape(creator.summary || 'Curated buildings can attach to this town.')}</strong>
          <div class="small">Approved additions attach to town truth, can be disabled, and use only public town summary.</div>
        </div>
      </section>
      <div class="foundersOperatingGrid">
        ${catalog.map((entry) => {
          const extensionId = String(entry.extensionId || '');
          const slug = creatorTestSlug(extensionId);
          const activeInstalled = installed.find((item) => item.extensionId === extensionId) || null;
          const allowedActions = Array.isArray(entry.allowedActions) ? entry.allowedActions : [];
          const criteria = Array.isArray(entry.gate?.criteria) ? entry.gate.criteria : [];
          const notice = activeInstalled?.state?.featuredNotice || '';
          const noticeCount = Number(activeInstalled?.state?.noticeCount || 0);
          const status = activeInstalled?.status || entry.status || 'AVAILABLE';
          return `
            <article class="foundersSettlementCard${activeInstalled?.active ? ' is-active' : status === 'DISABLED' ? ' is-paused' : ''}" data-testid="creator-catalog-${htmlEscape(slug)}" data-creator-card="${htmlEscape(extensionId)}">
              <div class="foundersSignalHeader">
                <div>
                  <strong>${htmlEscape(entry.label || 'Creator Building')}</strong>
                  <div class="small">${htmlEscape(entry.summary || 'A curated town addition.')}</div>
                </div>
                <span class="foundersBadge">${htmlEscape(activeInstalled?.active ? 'Attached' : status === 'DISABLED' ? 'Disabled' : entry.gate?.ready ? 'Ready' : 'Locked')}</span>
              </div>
              <div class="foundersPlotCardStats">
                <span>${htmlEscape(entry.creator?.credit || entry.creator?.name || 'Approved creator')}</span>
                <span>${htmlEscape(entry.moderation?.rating || 'Everyone')}</span>
                <span>${entry.moderation?.networkAccess === false ? 'No network' : 'Review needed'}</span>
                <span>Public summary only</span>
                <span>${entry.source?.externalUpload === false ? 'Local curated import' : 'Import blocked'}</span>
                <span>${entry.assetGovernance?.status === 'APPROVED' ? 'Assets approved' : 'Asset review'}</span>
                <span>${entry.creatorEconomics?.revenueEnabled === false ? 'Credit only' : 'Revenue review'}</span>
              </div>
              ${criteria.length > 0 ? `
                <div class="foundersSettlementCriteria">
                  ${criteria.map((item) => `<span class="foundersBadge ${item.met ? '' : 'is-warn'}">${htmlEscape(item.met ? 'Ready' : 'Needed')}: ${htmlEscape(item.label || '')}</span>`).join('')}
                </div>
              ` : ''}
              ${activeInstalled ? `
                <div class="foundersCreatorNotice" data-testid="creator-installed-${htmlEscape(slug)}">
                  <div class="foundersLabel">Notice Kiosk</div>
                  <strong>${notice ? htmlEscape(notice) : 'No town notice posted yet.'}</strong>
                  <div class="small">${htmlEscape(String(noticeCount))} notice${noticeCount === 1 ? '' : 's'} posted.</div>
                </div>
              ` : ''}
              <div class="foundersCreatorActions">
                ${allowedActions.includes('install') ? `<button class="btn small" type="button" data-creator-install="${htmlEscape(extensionId)}" data-testid="creator-install-${htmlEscape(slug)}" ${pendingAction ? 'disabled' : ''}>${status === 'DISABLED' ? 'Enable' : 'Install'}</button>` : ''}
                ${allowedActions.includes('post_notice') ? `<button class="btn small" type="button" data-creator-post-notice="${htmlEscape(extensionId)}" data-testid="creator-post-notice-${htmlEscape(slug)}" ${pendingAction ? 'disabled' : ''}>Post Notice</button>` : ''}
                ${allowedActions.includes('disable') ? `<button class="btn small" type="button" data-creator-disable="${htmlEscape(extensionId)}" data-testid="creator-disable-${htmlEscape(slug)}" ${pendingAction ? 'disabled' : ''}>Disable</button>` : ''}
                ${allowedActions.includes('remove') ? `<button class="btn small" type="button" data-creator-remove="${htmlEscape(extensionId)}" data-testid="creator-remove-${htmlEscape(slug)}" ${pendingAction ? 'disabled' : ''}>Remove</button>` : ''}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
    node.querySelectorAll('[data-creator-install]').forEach((button) => {
      button.addEventListener('click', async () => {
        const extensionId = String(button.getAttribute('data-creator-install') || '');
        try {
          pendingAction = true;
          await runTool('et.plot.creator.install_building', {
            extensionId,
            idempotencyKey: `creator-install:${extensionId}:${Date.now()}`
          });
          openDrawer('creator', { clearSelection: false });
          setStatusLine('Creator building attached.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not attach creator building: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    });
    node.querySelectorAll('[data-creator-post-notice]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          pendingAction = true;
          await runTool('et.creator.notice_kiosk.post_notice', {
            text: 'Welcome travelers to this growing town.',
            idempotencyKey: `creator-notice:${Date.now()}`
          });
          openDrawer('creator', { clearSelection: false });
          setStatusLine('Notice posted.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not post notice: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    });
    node.querySelectorAll('[data-creator-disable]').forEach((button) => {
      button.addEventListener('click', async () => {
        const extensionId = String(button.getAttribute('data-creator-disable') || '');
        try {
          pendingAction = true;
          await runTool('et.plot.creator.disable_building', {
            extensionId,
            idempotencyKey: `creator-disable:${extensionId}:${Date.now()}`
          });
          openDrawer('creator', { clearSelection: false });
          setStatusLine('Creator building disabled.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not disable creator building: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    });
    node.querySelectorAll('[data-creator-remove]').forEach((button) => {
      button.addEventListener('click', async () => {
        const extensionId = String(button.getAttribute('data-creator-remove') || '');
        try {
          pendingAction = true;
          await runTool('et.plot.creator.remove_building', {
            extensionId,
            idempotencyKey: `creator-remove:${extensionId}:${Date.now()}`
          });
          openDrawer('creator', { clearSelection: false });
          setStatusLine('Creator building removed.');
        } catch (error) {
          setStatusLine(error?.playerMessage || `Could not remove creator building: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      });
    });
  }

  function renderRecap(state) {
    const lines = Array.isArray(state?.recap?.lines) ? state.recap.lines : [];
    const sections = Array.isArray(state?.recap?.sections) ? state.recap.sections : [];
    const morningBrief = state?.recap?.morningBrief || null;
    setText('recapSummaryText', morningBrief?.available
      ? `${Number(morningBrief.unseenCount || lines.length)} morning brief updates ready.`
      : lines.length > 0 ? `${lines.length} recap lines ready.` : 'No new recap lines yet.');
    const node = document.getElementById('recapList');
    if (!node) return;
    if (!morningBrief?.available && lines.length === 0 && sections.every((section) => !Array.isArray(section?.lines) || section.lines.length === 0)) {
      node.innerHTML = '<div class="foundersEmptyState">The plot has been quiet since your last visit.</div>';
      return;
    }
    const briefHtml = morningBrief ? `
      <section class="foundersMorningBrief" data-testid="founders-morning-brief">
        <div class="foundersSignalHeader">
          <strong>${htmlEscape(morningBrief.title || 'Morning brief')}</strong>
          <span class="foundersBadge">${morningBrief.available ? 'New' : 'Current'}</span>
        </div>
        <div class="foundersBriefGrid">
          <div><span class="foundersLabel">Changed</span><div class="small">${htmlEscape(morningBrief.changed || '')}</div></div>
          <div><span class="foundersLabel">Active</span><div class="small">${htmlEscape(morningBrief.active || '')}</div></div>
          <div><span class="foundersLabel">Blocked</span><div class="small">${htmlEscape(morningBrief.blocked || '')}</div></div>
          <div><span class="foundersLabel">Clover</span><div class="small">${htmlEscape(morningBrief.clover || '')}</div></div>
          ${morningBrief.doctrine ? `<div><span class="foundersLabel">Preference</span><div class="small">${htmlEscape(morningBrief.doctrine || '')}</div></div>` : ''}
          ${morningBrief.specialists ? `<div><span class="foundersLabel">Specialists</span><div class="small">${htmlEscape(morningBrief.specialists || '')}</div></div>` : ''}
          ${morningBrief.regionalNetwork ? `<div><span class="foundersLabel">Regional ledger</span><div class="small">${htmlEscape(morningBrief.regionalNetwork || '')}</div></div>` : ''}
          <div><span class="foundersLabel">Next</span><div class="small">${htmlEscape(morningBrief.nextAction || '')}</div></div>
        </div>
      </section>
    ` : '';
    const sectionHtml = sections.map((section) => `
      <div class="foundersRecapSection">
        <strong>${htmlEscape(section.title || 'Update')}</strong>
        <div class="foundersRecapSectionList">
          ${(Array.isArray(section?.lines) && section.lines.length > 0 ? section.lines : [{ line: 'No new notes.' }]).map((item) => `
            <div class="small">${htmlEscape(item.line || 'No new notes.')}</div>
          `).join('')}
        </div>
      </div>
    `).join('');
    node.innerHTML = briefHtml + (sectionHtml || lines.map((item) => `
      <div class="foundersRecapItem">
        <strong>Event #${htmlEscape(String(item.eventId || item.seq))}</strong>
        <div class="small">${htmlEscape(item.line)}</div>
      </div>
    `).join(''));
  }

  function renderQuest(state) {
    const currentGoal = state?.currentGoal || state?.quest || {};
    const sceneGoal = currentScene?.currentGoal || {};
    const title = sceneGoal.title || currentGoal.title || state?.quest?.title || 'Set the first productive district';
    const body = sceneGoal.body || currentGoal.body || state?.quest?.body || 'Choose a meaningful next step for the settlement.';
    const owner = sceneGoal.owner || currentGoal.owner;
    const targetObjectId = String(sceneGoal.targetObjectId || '');
    const targetLabel = String(sceneGoal.targetLabel || '');
    const sceneCtaLabel = String(sceneGoal.primaryCtaLabel || '').trim();

    setText('questTitle', title);
    setText('questBody', body);
    setText('goalOwnerBadge', prettyGoalOwner(owner));
    setQuestStatus(`${state?.recap?.unseenCount || 0} unseen recap lines · ${state?.foreman?.pendingApprovals?.length || 0} pending approvals`);

    const ribbon = document.querySelector('[data-testid="founders-current-goal"]');
    if (ribbon instanceof HTMLElement) {
      ribbon.setAttribute('data-target-object-id', targetObjectId);
      ribbon.setAttribute('data-owner', String(owner || 'tutorial'));
      ribbon.setAttribute('data-has-target', targetObjectId ? 'true' : 'false');
    }

    const cta = document.getElementById('questCtaBtn');
    if (!cta) return;
    const action = currentGoal.primaryAction && typeof currentGoal.primaryAction === 'object'
      ? currentGoal.primaryAction
      : (state?.quest?.primaryAction && typeof state.quest.primaryAction === 'object' ? state.quest.primaryAction : null);
    const label = sceneCtaLabel || (() => {
      if (!action) return 'No action available';
      if (action.type === 'PLACE_BUILDING') return `Place ${BUILDING_LABELS[action.buildingType] || action.buildingType}`;
      if (action.type === 'QUEUE_JOB') return 'Queue the first job';
      if (action.type === 'COLLECT_OUTPUTS') return 'Collect outputs';
      if (action.type === 'UPGRADE_HQ' || action.type === 'UPGRADE_BUILDING') {
        return action.buildingId ? 'Upgrade building' : 'Upgrade Headquarters';
      }
      if (action.type === 'UPGRADE_LANDMARK') return 'Raise the Welcome Sign';
      if (action.type === 'VIEW_TOWN_OPPORTUNITY') return 'Choose town play';
      if (action.type === 'VIEW_TOWN_IDENTITY') return 'Choose square style';
      if (action.type === 'START_SCENARIO') return 'Start civic project';
      if (action.type === 'CONTRIBUTE_SCENARIO') return 'Prep civic project';
      if (action.type === 'VIEW_SCENARIO_BOARD') return 'Open civic project';
      if (action.type === 'ENABLE_PERMISSION') return 'Enable permission';
      if (action.type === 'TURN_IN_CONTRACT') return 'Turn in contract';
      if (action.type === 'VIEW_CONTRACT_BOARD') return 'Open Contract Board';
      if (action.type === 'RESOLVE_APPROVAL') return 'Review approval';
      if (action.type === 'QUEUE_BEST_JOB') return 'Queue best job';
      return 'Continue';
    })();
    cta.textContent = label;
    cta.disabled = pendingAction || !action;
    cta.setAttribute('data-target-object-id', targetObjectId);
    cta.setAttribute('data-target-label', targetLabel);
    cta.onclick = async () => {
      if (!action) return;
      try {
        if (action.type === 'PLACE_BUILDING') {
          const pad = targetObjectId.startsWith('PAD:')
            ? state.pads.find((candidate) => `PAD:${candidate.x},${candidate.y}` === targetObjectId)
            : (emptyPadFromSelection() || firstEmptyPad());
          if (!pad) {
            setStatusLine('No open pad is available.');
            return;
          }
          selectedKey = `pad:${pad.x},${pad.y}`;
          await runTool('et.plot.place_building', {
            type: action.buildingType,
            x: pad.x,
            y: pad.y,
            idempotencyKey: `quest-place:${action.buildingType}:${pad.x}:${pad.y}:${Date.now()}`
          });
          return;
        }
        if (action.type === 'QUEUE_JOB' && action.buildingId) {
          await runTool('et.plot.queue_job', {
            buildingId: action.buildingId,
            idempotencyKey: `quest-queue:${action.buildingId}:${Date.now()}`
          });
          return;
        }
        if (action.type === 'COLLECT_OUTPUTS' && action.buildingId) {
          await runTool('et.plot.collect_outputs', {
            buildingId: action.buildingId,
            idempotencyKey: `quest-collect:${action.buildingId}:${Date.now()}`
          });
          return;
        }
        if (action.type === 'UPGRADE_HQ' || action.type === 'UPGRADE_BUILDING') {
          await runTool('et.plot.upgrade_building', {
            buildingId: action.buildingId,
            idempotencyKey: `quest-upgrade-hq:${Date.now()}`
          });
          return;
        }
        if (action.type === 'UPGRADE_LANDMARK' && action.landmarkId) {
          await runTool('et.plot.town.upgrade_landmark', {
            landmarkId: action.landmarkId,
            idempotencyKey: `quest-landmark:${action.landmarkId}:${Date.now()}`
          });
          return;
        }
        if (action.type === 'VIEW_TOWN_OPPORTUNITY') {
          openDrawer('signals', { clearSelection: false });
          setLastActionTarget('PUBLIC_SQUARE');
          setStatusLine('Public Square has a town choice waiting.');
          return;
        }
        if (action.type === 'VIEW_TOWN_IDENTITY') {
          openDrawer('signals', { clearSelection: false });
          setLastActionTarget('PUBLIC_SQUARE');
          setStatusLine('Choose a Public Square style.');
          return;
        }
        if (action.type === 'START_SCENARIO' && action.scenarioId) {
          await startCivicScenario(action.scenarioId);
          return;
        }
        if (action.type === 'CONTRIBUTE_SCENARIO' && action.scenarioId && action.taskId) {
          await contributeCivicScenario(action.scenarioId, action.taskId);
          return;
        }
        if (action.type === 'VIEW_SCENARIO_BOARD') {
          openDrawer('signals', { clearSelection: false });
          setLastActionTarget('SCENARIO_SITE');
          setStatusLine('Civic project is at the Public Square.');
          return;
        }
        if (action.type === 'ENABLE_PERMISSION' && action.permission) {
          await updatePolicy(action.permission, true);
          return;
        }
        if (action.type === 'TURN_IN_CONTRACT' && action.contractId) {
          await turnInContract(action.contractId);
          return;
        }
        if (action.type === 'VIEW_CONTRACT_BOARD') {
          openDrawer('contracts', { clearSelection: false });
          setStatusLine('Contract Board is ready.');
          return;
        }
        if (action.type === 'RESOLVE_APPROVAL') {
          openDrawer('approvals', { clearSelection: false });
          setStatusLine('An approval is waiting for your decision.');
          return;
        }
        if (action.type === 'QUEUE_BEST_JOB') {
          const candidate = (state.buildings || []).find((building) => (
            building.type !== 'HQ'
            && building.state === 'READY'
            && !building.runningJob
            && (!building.completedJobs || building.completedJobs.length === 0)
          ));
          if (!candidate) {
            setStatusLine('No ready building is available for a new job.');
            return;
          }
          await runTool('et.plot.queue_job', {
            buildingId: candidate.buildingId,
            idempotencyKey: `quest-queue:${candidate.buildingId}:${Date.now()}`
          });
        }
      } catch {
        // status line already updated
      }
    };
  }

  function renderDrawerState() {
    const layer = document.getElementById('foundersDrawerLayer');
    const drawerIds = ['contracts', 'foreman', 'settlements', 'operating', 'creator', 'journal', 'signals', 'rewards', 'approvals', 'recap'];
    if (!(layer instanceof HTMLElement)) return;
    if (activeDrawer && !drawerFeatureEnabled(activeDrawer)) {
      activeDrawer = '';
    }
    layer.hidden = !activeDrawer;
    drawerIds.forEach((key) => {
      const node = document.getElementById(`foundersDrawer-${key}`);
      if (node instanceof HTMLElement) {
        node.hidden = key !== activeDrawer;
      }
    });
  }

  function renderStageMood(state) {
    const moodLine = document.getElementById('plotStageMood');
    if (!(moodLine instanceof HTMLElement)) return;
    if (activeDrawer === 'contracts') {
      moodLine.textContent = 'Town requests are pinned on the board.';
      return;
    }
    if (activeDrawer === 'foreman') {
      moodLine.textContent = 'Clover keeps one safe eye on the plot.';
      return;
    }
    if (activeDrawer === 'creator') {
      moodLine.textContent = 'Curated creator buildings stay attached to town truth.';
      return;
    }
    const receipt = state?.foreman?.receipt || null;
    if (receipt?.action === 'collect_ready_outputs') {
      moodLine.textContent = 'The plot feels busy and capable today.';
      return;
    }
    moodLine.textContent = 'A warm frontier plot ready to grow.';
  }

  function renderProgress(state) {
    const currentLevel = state?.progress?.currentLevel || state?.plot?.hqLevel || 1;
    const progress = state?.progress?.next || null;
    setText('hqLevelValue', String(currentLevel));
    const fill = document.getElementById('hqLevelFill');
    if (fill) {
      fill.style.width = `${Math.round((progress?.ratio || 0) * 100)}%`;
    }
    const levelCard = document.querySelector('.foundersHudLevel');
    if (levelCard instanceof HTMLElement && currentLevel > lastRenderedHqLevel) {
      levelCard.classList.remove('is-level-up');
      void levelCard.offsetWidth;
      levelCard.classList.add('is-level-up');
      window.setTimeout(() => levelCard.classList.remove('is-level-up'), 760);
    }
    lastRenderedHqLevel = currentLevel;
    if (progress) {
      setText('hqProgressText', `${progress.xpCurrent} / ${progress.xpRequired} XP`);
    } else {
      setText('hqProgressText', 'Phase 1 complete');
    }
  }

  function renderAll() {
    const state = stateData();
    if (!state) return;
    maybeTrackStateAnalytics(state);
    currentScene = null;
    document.title = `Agent Town — Founders Plot (HQ ${state.progress?.currentLevel || state.plot?.hqLevel || 1})`;
    renderProgress(state);
    renderInventory(state);
    renderBoard(state);
    renderQuest(state);
    renderStageMood(state);
    renderSelection(state);
    renderContracts(state);
    renderSignals(state);
    renderLandmark(state);
    renderForeman(state);
    renderPermissions(state);
    renderApprovals(state);
    renderRewards(state);
    renderSettlements(state);
    renderOperatingModel(state);
    renderCreatorExtensions(state);
    renderQueue(state);
    renderJournal(state);
    renderRecap(state);
    renderDrawerState();
  }

  async function loadState() {
    try {
      await loadAssetManifest().catch(() => null);
      const payload = await api('/api/founders-plot/state');
      currentState = payload;
      await syncWorkerScheduler(payload?.state || null);
      const quest = payload?.state?.quest?.title || 'Settlement ready.';
      setStatusLine(`Plot synchronized. ${quest}`);
      renderAll();
      return payload;
    } catch (error) {
      setStatusLine(`Could not load the plot: ${error.message}.`);
      throw error;
    }
  }

  async function loadRecap() {
    try {
      const payload = await api('/api/founders-plot/recap');
      if (currentState?.state) {
        currentState.state.recap = {
          ...(currentState.state.recap || {}),
          unseenCount: payload.recap?.unseenCount || 0,
          lines: Array.isArray(payload.recap?.lines) ? payload.recap.lines : [],
          sections: Array.isArray(payload.recap?.sections) ? payload.recap.sections : [],
          morningBrief: payload.recap?.morningBrief || currentState.state.recap?.morningBrief || null
        };
        renderRecap(currentState.state);
      }
    } catch {
      // ignore recap refresh failures
    }
  }

  async function markRecapRead() {
    try {
      await api('/api/founders-plot/recap/read', {
        method: 'POST',
        body: JSON.stringify({})
      });
      await loadState();
    } catch (error) {
      setStatusLine(`Could not mark recap read: ${error.message}.`);
    }
  }

  async function advanceForTest(ms) {
    const payload = await api('/__test__/founders-plot/advance', {
      method: 'POST',
      body: JSON.stringify({ ms })
    });
    currentState = { ok: true, state: payload.state };
    renderAll();
    return payload;
  }

  async function startForemanRuntime() {
    await refreshSharedBrainStatus({ render: false }).catch(() => null);
    if (!isRealBrainReadyForForeman()) {
      const error = new Error('BRAIN_REQUIRED');
      error.playerMessage = isBrainConfiguredForForeman()
        ? 'Connect a production Brain to let Clover act as your Foreman.'
        : 'Connect a Brain to let Clover act as your Foreman.';
      throw error;
    }
    setLastActionTarget('FOREMAN_HUT');
    const gateway = await initGateway();
    const syncedBrain = await syncSharedLlmConfigToGateway(gateway).catch(() => null);
    if (!syncedBrain) {
      const error = new Error('BRAIN_REQUIRED');
      error.playerMessage = 'Connect a Brain to let Clover act as your Foreman.';
      throw error;
    }
    if (gateway && typeof gateway.foundersPlotSchedulerStop === 'function') {
      await gateway.foundersPlotSchedulerStop({ reason: 'RUNTIME_RESTART' }).catch(() => null);
    }
    foremanRuntimeToken = '';
    localForemanRuntimeId = '';
    workerSchedulerStatus = normalizeWorkerSchedulerStatus();
    let skillLoaded = false;
    let heartbeatLoaded = false;
    let toolsLoaded = false;
    let goalsLoaded = false;
    let safetyLoaded = false;

    if (gateway && typeof gateway.visitExperience === 'function') {
      const visit = await gateway.visitExperience({ url: '/experiences/founders-plot/skill.md' }).catch(() => null);
      skillLoaded = !!visit?.ok;
    }
    const packSync = await syncForemanPackDocsToWorker(gateway).catch(() => null);
    heartbeatLoaded = packSync?.heartbeatLoaded === true;
    toolsLoaded = packSync?.toolsLoaded === true;
    goalsLoaded = packSync?.goalsLoaded === true;
    safetyLoaded = packSync?.safetyLoaded === true;

    const payload = await api('/api/founders-plot/foreman/session/start', {
      method: 'POST',
      body: JSON.stringify({
        brainReady: true,
        pack: {
          skillLoaded,
          heartbeatLoaded,
          toolsLoaded,
          goalsLoaded,
          safetyLoaded
        }
      })
    });
    foremanRuntimeToken = String(payload?.runtime?.token || '');
    localForemanRuntimeId = String(payload?.runtime?.runtimeId || '');
    await loadState();
    return payload;
  }

  async function heartbeatForemanRuntime() {
    setLastActionTarget('FOREMAN_HUT');
    const payload = await foremanApi('/api/founders-plot/foreman/session/heartbeat', {
      method: 'POST',
      body: JSON.stringify({})
    });
    await loadState();
    return payload;
  }

  async function pauseForemanRuntime() {
    setLastActionTarget('FOREMAN_HUT');
    const payload = await foremanApi('/api/founders-plot/foreman/session/pause', {
      method: 'POST',
      body: JSON.stringify({})
    });
    await stopWorkerScheduler('HUMAN_PAUSED');
    await loadState();
    return payload;
  }

  async function getForemanObservation() {
    return await foremanApi('/api/founders-plot/foreman/observation', {
      method: 'GET'
    });
  }

  async function enableCollectReadyOutputs() {
    if (!isRealBrainReadyForForeman()) {
      throw Object.assign(new Error('BRAIN_REQUIRED'), {
        playerMessage: isBrainConfiguredForForeman()
          ? 'Connect a production Brain to let Clover run Foreman routines.'
          : 'Connect a Brain to let Clover run Foreman routines.'
      });
    }
    setLastActionTarget('FOREMAN_HUT');
    const response = await api('/api/founders-plot/tool/et.foreman.scheduler.enable_collect_ready_outputs', {
      method: 'POST',
      body: JSON.stringify({
        idempotencyKey: `scheduler-enable:${Date.now()}`
      })
    });
    currentState = { ok: true, state: response.data?.state || response.state || currentState?.state || null };
    await syncWorkerScheduler(currentState?.state || null);
    renderAll();
    return {
      ok: true,
      scheduler: response.data?.scheduler || response.scheduler || null
    };
  }

  async function grantForemanLease(durationMinutes = 15) {
    const response = await api('/api/founders-plot/tool/et.foreman.governance.grant_lease', {
      method: 'POST',
      body: JSON.stringify({
        durationMinutes,
        scope: 'collect_ready_outputs',
        idempotencyKey: `governance-lease:${Date.now()}`
      })
    });
    currentState = { ok: true, state: response.data?.state || response.state || currentState?.state || null };
    renderAll();
    return response.data?.governance || currentState?.state?.foreman?.governance || null;
  }

  async function startPersistentForeman(durationMinutes = 120) {
    if (!isRealBrainReadyForForeman()) {
      throw Object.assign(new Error('BRAIN_REQUIRED'), {
        playerMessage: isBrainConfiguredForForeman()
          ? 'Connect a production Brain before starting while-away Clover help.'
          : 'Connect a Brain before starting while-away Clover help.'
      });
    }
    const response = await api('/api/founders-plot/foreman/persistent/start', {
      method: 'POST',
      body: JSON.stringify({
        brainReady: true,
        durationMinutes,
        scope: 'collect_ready_outputs'
      })
    });
    currentState = { ok: true, state: response.state || currentState?.state || null };
    await syncWorkerScheduler(currentState?.state || null);
    renderAll();
    return response.governance || currentState?.state?.foreman?.governance || null;
  }

  async function pausePersistentForeman(reason = 'Player paused while-away Clover help.') {
    const response = await api('/api/founders-plot/foreman/persistent/pause', {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    currentState = { ok: true, state: response.state || currentState?.state || null };
    await syncWorkerScheduler(currentState?.state || null);
    renderAll();
    return response.governance || currentState?.state?.foreman?.governance || null;
  }

  async function revokeForemanLease(reason = 'Player revoked Foreman lease.') {
    const response = await api('/api/founders-plot/tool/et.foreman.governance.revoke_lease', {
      method: 'POST',
      body: JSON.stringify({
        reason,
        idempotencyKey: `governance-revoke:${Date.now()}`
      })
    });
    currentState = { ok: true, state: response.data?.state || response.state || currentState?.state || null };
    await stopWorkerScheduler('GOVERNANCE_LEASE_REVOKED').catch(() => null);
    renderAll();
    return response.data?.governance || currentState?.state?.foreman?.governance || null;
  }

  async function resolveForemanException(exceptionId, resolution = 'RESOLVED') {
    const response = await api('/api/founders-plot/tool/et.foreman.governance.resolve_exception', {
      method: 'POST',
      body: JSON.stringify({
        exceptionId,
        resolution,
        idempotencyKey: `governance-exception:${exceptionId}:${Date.now()}`
      })
    });
    currentState = { ok: true, state: response.data?.state || response.state || currentState?.state || null };
    renderAll();
    return response.data?.governance || currentState?.state?.foreman?.governance || null;
  }

  async function raiseForemanExceptionForTest(payload = {}) {
    const response = await api('/api/founders-plot/tool/et.foreman.governance.raise_exception', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title || 'Clover needs a decision',
        body: payload.body || 'Review this before Clover continues.',
        requestedAction: payload.requestedAction || '',
        severity: payload.severity || 'needs_review',
        payload: payload.payload || {},
        idempotencyKey: `governance-raise:${Date.now()}`
      })
    });
    currentState = { ok: true, state: response.data?.state || response.state || currentState?.state || null };
    renderAll();
    return response.data?.governance || currentState?.state?.foreman?.governance || null;
  }

  async function getSchedulerStatus() {
    const payload = await api('/api/founders-plot/state');
    const local = await syncWorkerScheduler(payload?.state || null);
    return {
      ok: true,
      scheduler: payload?.state?.foreman?.scheduler || payload?.state?.scheduler || null,
      local
    };
  }

  async function runForemanTick() {
    if (!isRealBrainReadyForForeman()) {
      return {
        ok: false,
        error: {
          code: 'BRAIN_REQUIRED',
          message: isBrainConfiguredForForeman()
            ? 'Connect a production Brain to let Clover act as your Foreman.'
            : 'Connect a Brain to let Clover act as your Foreman.',
          retryable: false
        },
        result: { mutationApplied: false },
        receipt: currentState?.state?.foreman?.receipt || null
      };
    }
    const runtimeLocal = localForemanRuntimeStatus(currentState?.state?.foreman?.runtime || {});
    if (!runtimeLocal.actionable) {
      return {
        ok: true,
        result: { mutationApplied: false },
        receipt: currentState?.state?.foreman?.receipt || null
      };
    }
    setLastActionTarget(currentDecisionTargetObjectId(currentState?.state) || 'FOREMAN_HUT');
    const gateway = await initGateway();
    if (!gateway || typeof gateway.foundersPlotForemanTick !== 'function') {
      throw new Error('FOREMAN_WORKER_UNAVAILABLE');
    }
    let payload;
    manualForemanActingUntilMs = Date.now() + 1600;
    renderAll();
    window.setTimeout(() => {
      if (Date.now() >= manualForemanActingUntilMs) {
        renderAll();
      }
    }, 1650);
    try {
      payload = await gateway.foundersPlotForemanTick({
        token: foremanRuntimeToken
      });
    } catch (error) {
      if (error?.message === 'STALE_RUNTIME' || error?.message === 'FOREMAN_RUNTIME_REQUIRED') {
        foremanRuntimeToken = '';
        localForemanRuntimeId = '';
        await stopWorkerScheduler('ERROR');
      }
      await loadState().catch(() => null);
      if (error?.message === 'STALE_RUNTIME' || error?.message === 'FOREMAN_RUNTIME_REQUIRED') {
        return {
          ok: true,
          result: { mutationApplied: false },
          receipt: currentState?.state?.foreman?.receipt || null
        };
      }
      throw error;
    }
    await loadState();
    return payload;
  }

  async function applyReceiptCorrection(correction) {
    setLastActionTarget('FOREMAN_HUT');
    const payload = await api('/api/founders-plot/foreman/receipt/correction', {
      method: 'POST',
      body: JSON.stringify({ correction })
    });
    currentState = { ok: true, state: payload.state };
    trackFoundersEvent('founders.clover_teaching_clicked', {
      correction: String(correction || '')
    });
    await syncWorkerScheduler(currentState?.state || null);
    renderAll();
    return payload;
  }

  async function recordForemanPreference(correction) {
    setLastActionTarget('FOREMAN_HUT');
    const payload = await api('/api/founders-plot/foreman/preference', {
      method: 'POST',
      body: JSON.stringify({ correction })
    });
    currentState = { ok: true, state: payload.state };
    trackFoundersEvent('founders.clover_teaching_clicked', {
      correction: String(correction || '')
    });
    renderAll();
    return payload;
  }

  async function setForemanDoctrineRule(ruleId, enabled) {
    setLastActionTarget('FOREMAN_HUT');
    const payload = await api('/api/founders-plot/foreman/doctrine', {
      method: 'POST',
      body: JSON.stringify({ ruleId, enabled: enabled === true })
    });
    currentState = { ok: true, state: payload.state };
    renderAll();
    return payload;
  }

  async function assignSpecialist(roleId, domainId) {
    const response = await api('/api/founders-plot/tool/et.foreman.specialists.assign', {
      method: 'POST',
      body: JSON.stringify({
        roleId,
        domainId,
        idempotencyKey: `specialist-assign:${roleId}:${domainId}:${Date.now()}`
      })
    });
    currentState = { ok: true, state: response.data?.state || response.state || currentState?.state || null };
    renderAll();
    return response.data || response;
  }

  async function pauseSpecialist(roleId) {
    const response = await api('/api/founders-plot/tool/et.foreman.specialists.pause', {
      method: 'POST',
      body: JSON.stringify({
        roleId,
        idempotencyKey: `specialist-pause:${roleId}:${Date.now()}`
      })
    });
    currentState = { ok: true, state: response.data?.state || response.state || currentState?.state || null };
    renderAll();
    return response.data || response;
  }

  async function reviewSpecialistRecommendationForTest(payload = {}) {
    const response = await api('/api/founders-plot/tool/et.foreman.specialists.review_recommendation', {
      method: 'POST',
      body: JSON.stringify({
        roleId: payload.roleId || '',
        domainId: payload.domainId || '',
        toolName: payload.toolName || '',
        targetObjectId: payload.targetObjectId || '',
        summary: payload.summary || '',
        recommendationId: payload.recommendationId || '',
        conflictsWith: Array.isArray(payload.conflictsWith) ? payload.conflictsWith : [],
        idempotencyKey: payload.idempotencyKey || `specialist-review:${Date.now()}`
      })
    });
    currentState = { ok: true, state: response.data?.state || response.state || currentState?.state || null };
    renderAll();
    return response.data || response;
  }

  async function stopWorkerScheduler(reason = 'HUMAN_PAUSED') {
    const gateway = await initGateway().catch(() => null);
    if (!gateway || typeof gateway.foundersPlotSchedulerStop !== 'function') {
      workerSchedulerStatus = normalizeWorkerSchedulerStatus({
        active: false,
        lastStatus: 'STOPPED',
        lastStopReason: reason
      });
      return workerSchedulerStatus;
    }
    const status = await gateway.foundersPlotSchedulerStop({ reason }).catch(() => null);
    workerSchedulerStatus = normalizeWorkerSchedulerStatus(status || {
      active: false,
      lastStatus: 'STOPPED',
      lastStopReason: reason
    });
    return workerSchedulerStatus;
  }

  async function syncWorkerScheduler(state = null) {
    const serverState = state || stateData();
    const runtimeLocal = localForemanRuntimeStatus(serverState?.foreman?.runtime || {});
    const task = serverState?.foreman?.scheduler?.collectReadyOutputs || {};
    const realBrainReady = isRealBrainReadyForForeman();
    const shouldCheckWorker = realBrainReady && (runtimeLocal.hasServerRuntime || task.enabled === true || !!foremanRuntimeToken);
    if (!shouldCheckWorker) {
      workerSchedulerStatus = normalizeWorkerSchedulerStatus();
      return workerSchedulerStatus;
    }
    const gateway = await initGateway().catch(() => null);
    if (!gateway || typeof gateway.foundersPlotSchedulerStatus !== 'function') {
      workerSchedulerStatus = normalizeWorkerSchedulerStatus({
        active: false,
        lastStatus: 'ERROR',
        lastErrorCode: 'FOREMAN_WORKER_UNAVAILABLE'
      });
      return workerSchedulerStatus;
    }
    let nextStatus = await gateway.foundersPlotSchedulerStatus().catch((error) => ({
      active: false,
      lastStatus: 'ERROR',
      lastErrorCode: String(error?.message || 'FOREMAN_WORKER_UNAVAILABLE')
    }));
    const shouldBeActive = realBrainReady && runtimeLocal.actionable && task.enabled === true && task.paused !== true;
    if (shouldBeActive && nextStatus?.active !== true) {
      nextStatus = await gateway.foundersPlotSchedulerStart({
        token: foremanRuntimeToken,
        taskKind: 'COLLECT_READY_OUTPUTS'
      }).catch((error) => ({
        active: false,
        lastStatus: String(error?.message || 'ERROR').toUpperCase() === 'STALE_RUNTIME' ? 'STALE' : 'ERROR',
        lastErrorCode: String(error?.message || 'FOUNDERS_PLOT_SCHEDULER_START_FAILED')
      }));
    } else if (!shouldBeActive && nextStatus?.active === true) {
      nextStatus = await gateway.foundersPlotSchedulerStop({
        reason: runtimeLocal.needsRestart ? 'RUNTIME_RESTART' : task.paused === true ? 'HUMAN_PAUSED' : 'ERROR'
      }).catch(() => ({
        active: false,
        lastStatus: 'STOPPED'
      }));
    }
    workerSchedulerStatus = normalizeWorkerSchedulerStatus(nextStatus);
    return workerSchedulerStatus;
  }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (document.hidden || pendingAction) return;
      loadState().catch(() => {});
    }, 5000);
  }

  function applyEmbedMode() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === '1') {
      document.documentElement.classList.add('founders-plot-embed');
    }
    if (params.get('presentation') === 'fullscreen' || params.get('fullscreen') === '1') {
      document.documentElement.classList.add('founders-plot-fullscreen');
      document.body?.classList?.add('founders-plot-fullscreen-body');
    }
  }

  function bindUi() {
    const markRecapReadBtn = document.getElementById('markRecapReadBtn');
    if (markRecapReadBtn) {
      markRecapReadBtn.addEventListener('click', () => {
        markRecapRead();
      });
    }
    const drawerBackdrop = document.getElementById('foundersDrawerBackdrop');
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', () => {
        closeDrawer();
      });
    }
    document.querySelectorAll('[data-close-drawer]').forEach((button) => {
      button.addEventListener('click', () => {
        closeDrawer();
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && activeDrawer) {
        closeDrawer();
      }
    });
  }

  window.__foundersPlotTest = {
    loadState,
    getState: () => currentState,
    getScene: () => currentScene,
    getThreeSceneInfo: () => window.FoundersPlotThreeRenderer?.getStageInfo?.(document.getElementById('plotBoard')) || null,
    getBrainStatus: () => ({ ...sharedBrainStatus }),
    refreshBrainStatus: () => refreshSharedBrainStatus({ render: true }),
    getBrainVaultStatus: () => ({ ...brainVaultStatus }),
    refreshBrainVaultStatus: () => refreshBrainVaultStatus({ render: true }),
    backupBrainVaultForTest: async (passphrase = 'founders-test-vault', options = {}) => {
      const lib = await loadBrainVaultLibrary();
      const result = await lib.backupCurrentBrainVault(passphrase, options || {});
      await refreshBrainVaultStatus({ render: true });
      return result;
    },
    restoreBrainVaultForTest: async (passphrase = 'founders-test-vault') => {
      const lib = await loadBrainVaultLibrary();
      const result = await lib.restoreBrainVault(passphrase, { confirm: true });
      await refreshSharedBrainStatus({ render: false });
      await refreshBrainVaultStatus({ render: true });
      return result;
    },
    setBrainHarnessMode: async (policy = {}) => {
      brainHarnessPolicy = {
        ...brainHarnessPolicy,
        allowTestBrainForRealClover: policy?.allowTestBrainForRealClover === true
      };
      saveBrainHarnessPolicy(brainHarnessPolicy);
      return await refreshSharedBrainStatus({ render: true });
    },
    saveBrainConfigForTest: async (config = {}) => {
      const lib = await loadLiteLlmLibrary();
      await lib.saveLlmConfig(config || {});
      return await refreshSharedBrainStatus({ render: true });
    },
    getLocalForemanRuntimeStatus: () => localForemanRuntimeStatus(currentState?.state?.foreman?.runtime || {}),
    getWorkerSchedulerStatus: () => ({ ...workerSchedulerStatus }),
    getActiveDrawer: () => activeDrawer,
    getAnalyticsEvents: () => analyticsEvents.slice(),
    resetAnalyticsForTest,
    openDrawer,
    closeDrawer,
    collectSurfaceMetrics: () => {
      const metrics = window.FoundersPlotVisualMetrics?.collectSurfaceMetrics?.({
        root: document.body,
        stageNode: document.getElementById('plotBoard')
      }) || null;
      if (metrics) {
        const questCta = document.getElementById('questCtaBtn');
        metrics.primaryCtasAboveFold = questCta && questCta.getBoundingClientRect().top < window.innerHeight ? 1 : 0;
      }
      return metrics;
    },
    runTool,
    updatePolicy,
    resolveApproval,
    claimReward,
    startCivicScenario,
    contributeCivicScenario,
    setTownIdentityStyle,
    generatePlotCard,
    capturePostcard,
    generateOperatingStyleCard,
    advance: advanceForTest,
    startForemanRuntime,
    heartbeatForemanRuntime,
    pauseForemanRuntime,
    getForemanObservation,
    enableCollectReadyOutputs,
    grantForemanLease,
    startPersistentForeman,
    pausePersistentForeman,
    revokeForemanLease,
    raiseForemanExceptionForTest,
    resolveForemanException,
    getSchedulerStatus,
    runForemanTick,
    applyReceiptCorrection,
    setForemanDoctrineRule,
    assignSpecialist,
    pauseSpecialist,
    reviewSpecialistRecommendationForTest,
    recordForemanPreference
  };

  applyEmbedMode();
  bindUi();
  window.addEventListener('resize', syncViewportScenePolicy, { passive: true });
  refreshSharedBrainStatus({ render: true }).catch(() => {});
  refreshBrainVaultStatus({ render: true }).catch(() => {});
  loadAssetManifest().then(() => {
    renderAll();
  }).catch(() => {});
  loadState().catch(() => {});
  startPolling();
})();
