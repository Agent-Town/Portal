(function foundersPlotBootstrap() {
  const TEAM_CODE_HINT_STORAGE_KEY = 'agentTown:teamCodeHint';
  const BRAIN_HARNESS_POLICY_STORAGE_KEY = 'foundersPlot:testBrainHarnessPolicy';
  const BUILDING_LABELS = {
    HQ: 'Headquarters',
    LUMBER_CAMP: 'Lumber Camp',
    FARM_PLOT: 'Farm Plot',
    QUARRY: 'Quarry',
    WORKSHOP: 'Workshop',
    MARKET_STALL: 'Market Stall'
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

  let currentState = null;
  let selectedKey = '';
  let activeDrawer = '';
  let pollTimer = null;
  let pendingAction = false;
  let gatewayPromise = null;
  let llmLibraryPromise = null;
  let assetManifestPromise = null;
  let assetMap = {};
  let effectsController = null;
  let currentScene = null;
  let sceneActionRegistry = new Map();
  let viewportSyncTimer = null;
  let manualForemanActingUntilMs = 0;
  let foremanRuntimeToken = '';
  let localForemanRuntimeId = '';
  let lastActionTargetObjectId = '';
  let lastRenderedHqLevel = 0;
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

  function defaultBrainModel(provider = '') {
    const normalized = String(provider || '').trim().toLowerCase();
    if (normalized === 'openrouter') return 'nvidia/nemotron-3-super-120b-a12b:free';
    if (normalized === 'ollama') return 'llama3.2';
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

  function renderBrainQuickConnectCard() {
    const provider = sharedBrainStatus.provider || 'openrouter';
    const model = sharedBrainStatus.model || defaultBrainModel(provider);
    return `
      <div class="foundersBrainQuickConnect" data-testid="brain-quick-connect-sheet">
        <div class="foundersLabel">Brain Quick Connect</div>
        <strong>Connect a Brain</strong>
        <div class="small">Let Clover reason about your town and help with approved actions.</div>
        <div class="foundersBrainQuickFields">
          <label class="small" for="foundersBrainProvider">Provider</label>
          <select id="foundersBrainProvider" data-testid="brain-quick-provider">
            <option value="openrouter" ${provider === 'openrouter' ? 'selected' : ''}>OpenRouter</option>
            <option value="openai" ${provider === 'openai' ? 'selected' : ''}>OpenAI</option>
            <option value="ollama" ${provider === 'ollama' ? 'selected' : ''}>Ollama</option>
          </select>
          <label class="small" for="foundersBrainModel">Model</label>
          <input id="foundersBrainModel" data-testid="brain-quick-model" type="text" value="${htmlEscape(model)}" />
          <label class="small" for="foundersBrainKey">Local key</label>
          <input id="foundersBrainKey" data-testid="brain-quick-key" type="password" autocomplete="off" placeholder="Stored only in this browser" />
        </div>
        <div class="foundersInlineButtons">
          <button class="btn primary small" type="button" id="foundersBrainSaveBtn" data-testid="brain-quick-save">Save Brain</button>
          <a class="btn small" href="/app?district=brain&entry=brain-settings" target="_top" rel="noopener">Full settings</a>
        </div>
        <div class="small" id="foundersBrainQuickStatus" data-testid="brain-quick-status"></div>
      </div>
    `;
  }

  function bindBrainQuickConnectCard(root = document) {
    const providerSelect = root.querySelector('#foundersBrainProvider');
    const modelInput = root.querySelector('#foundersBrainModel');
    const keyInput = root.querySelector('#foundersBrainKey');
    const saveBtn = root.querySelector('#foundersBrainSaveBtn');
    const status = root.querySelector('#foundersBrainQuickStatus');
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
    return String(buildingTypeForId(buildingId) || '');
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
      case 'et.plot.town.resolve_opportunity':
        setLastActionTarget('PUBLIC_SQUARE');
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
    if (options.clearSelection !== false) {
      selectedKey = '';
    }
    if (activeDrawer === 'recap') {
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

    if (selectedPad) {
      for (const type of state?.unlocks?.buildingTypes || []) {
        addSceneAction(actions, {
          id: `place:${type}:${selectedPad.x}:${selectedPad.y}`,
          kind: 'place',
          objectId: selectedObjectId,
          label: `Place ${BUILDING_LABELS[type] || type}`,
          detail: selectedPad.label || 'Open lot',
          buildingType: type,
          x: selectedPad.x,
          y: selectedPad.y,
          testId: `founders-scene-action-place-${actionSafeId(type)}`
        });
      }
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
          addSceneAction(actions, {
            id: `goal-place:${goalAction.buildingType}:${pad.x}:${pad.y}`,
            kind: 'place',
            objectId: goalTargetId,
            label: `Place ${BUILDING_LABELS[goalAction.buildingType] || goalAction.buildingType}`,
            detail: pad.label || 'Open lot',
            buildingType: goalAction.buildingType,
            x: pad.x,
            y: pad.y,
            testId: `founders-scene-action-place-${actionSafeId(goalAction.buildingType)}`
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

  function buildTypeButtons(container, types, pad) {
    const row = document.createElement('div');
    row.className = 'foundersInlineButtons';
    for (const type of types) {
      row.appendChild(actionButton(
        `Place ${BUILDING_LABELS[type] || type}`,
        async () => {
          await runTool('et.plot.place_building', {
            type,
            x: pad.x,
            y: pad.y,
            idempotencyKey: `place:${type}:${pad.x}:${pad.y}:${Date.now()}`
          });
        },
        `place-${type.toLowerCase()}`
      ));
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
      buildTypeButtons(node, state.unlocks.buildingTypes || [], selectedPad);
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
      cards.push(...offers.map((offer) => `
        <article class="foundersContractItem" data-testid="contract-offer">
          <div class="foundersContractHeader">
            <div>
              <strong>${htmlEscape(offer.title)}</strong>
              <div class="foundersContractKicker">${htmlEscape(contractRequesterDisplay(offer))} · ${htmlEscape(contractInstitutionDisplay(offer))}</div>
            </div>
            <span class="foundersBadge">${htmlEscape(offer.kind)}</span>
          </div>
          <div class="small">${htmlEscape(offer.whyNow || '')}</div>
          <div class="foundersContractMeta">
            <div class="small">${htmlEscape(formatContractRequirements(offer))}</div>
            <div class="small">${htmlEscape(formatContractRewards(offer))}</div>
            ${offer.townBenefit ? `<div class="small">${htmlEscape(offer.townBenefit)}</div>` : ''}
            ${offer.townMoment?.label ? `<div class="small">Town moment: ${htmlEscape(offer.townMoment.label)}</div>` : ''}
            <div class="small">${htmlEscape(offer.philosophyHint || '')}</div>
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
    const canUpgrade = Number(landmark.level || 0) < 1
      && Number(state?.plot?.inventory?.wood || 0) >= 4
      && Number(state?.plot?.inventory?.coin || 0) >= 8;
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
      ${opportunityHtml}
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

    const planNode = document.getElementById('planCard');
    const planCard = state?.foreman?.planCard || null;
    if (planNode) {
      if (!realBrainReady) {
        planNode.innerHTML = renderBrainQuickConnectCard();
      } else if (!planCard) {
        planNode.innerHTML = `
          <div class="foundersPlanBody">
            <div class="foundersLabel">Foreman plan</div>
            <div class="small">Clover is watching. No safe action inside your standing order.</div>
          </div>
        `;
      } else {
        planNode.innerHTML = `
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

  function renderRecap(state) {
    const lines = Array.isArray(state?.recap?.lines) ? state.recap.lines : [];
    const sections = Array.isArray(state?.recap?.sections) ? state.recap.sections : [];
    setText('recapSummaryText', lines.length > 0 ? `${lines.length} recap lines ready.` : 'No new recap lines yet.');
    const node = document.getElementById('recapList');
    if (!node) return;
    if (lines.length === 0 && sections.every((section) => !Array.isArray(section?.lines) || section.lines.length === 0)) {
      node.innerHTML = '<div class="foundersEmptyState">The plot has been quiet since your last visit.</div>';
      return;
    }
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
    node.innerHTML = sectionHtml || lines.map((item) => `
      <div class="foundersRecapItem">
        <strong>Event #${htmlEscape(String(item.eventId || item.seq))}</strong>
        <div class="small">${htmlEscape(item.line)}</div>
      </div>
    `).join('');
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
    const drawerIds = ['contracts', 'foreman', 'journal', 'signals', 'rewards', 'approvals', 'recap'];
    if (!(layer instanceof HTMLElement)) return;
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
          sections: Array.isArray(payload.recap?.sections) ? payload.recap.sections : []
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
    await syncWorkerScheduler(currentState?.state || null);
    renderAll();
    return payload;
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
    advance: advanceForTest,
    startForemanRuntime,
    heartbeatForemanRuntime,
    pauseForemanRuntime,
    getForemanObservation,
    enableCollectReadyOutputs,
    getSchedulerStatus,
    runForemanTick,
    applyReceiptCorrection
  };

  applyEmbedMode();
  bindUi();
  window.addEventListener('resize', syncViewportScenePolicy, { passive: true });
  refreshSharedBrainStatus({ render: true }).catch(() => {});
  loadAssetManifest().then(() => {
    renderAll();
  }).catch(() => {});
  loadState().catch(() => {});
  startPolling();
})();
