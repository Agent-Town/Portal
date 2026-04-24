(function agentTownAccessFactory(globalScope) {
  const MODES = Object.freeze({
    MANUAL_FOUNDER: 'MANUAL_FOUNDER',
    PREVIEW_CLOVER: 'PREVIEW_CLOVER',
    REAL_CLOVER: 'REAL_CLOVER',
    OFFICIAL_TOWN: 'OFFICIAL_TOWN'
  });

  const BRAIN_QUALITIES = Object.freeze({
    NONE: 'none',
    TEST: 'test',
    PREVIEW: 'preview',
    REAL: 'real'
  });

  const START_DESTINATION = '/app?district=founders-plot&entry=play-first';

  function bool(value) {
    return value === true;
  }

  function normalizeDistrict(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (
      raw === 'founders-plot'
      || raw === 'townhall'
      || raw === 'brain'
      || raw === 'sigil'
      || raw === 'ceremony'
      || raw === 'house'
      || raw === 'atlas'
      || raw === 'pony'
      || raw === 'saloon'
      || raw === 'leaderboard'
    ) {
      return raw;
    }
    return 'house';
  }

  function inferTownHallRecommended({ state = {}, progression = {} } = {}) {
    const hqLevel = Number(
      progression.hqLevel
      ?? state?.foundersPlot?.hqLevel
      ?? state?.plot?.hqLevel
      ?? state?.plot?.hq
      ?? 0
    ) || 0;
    const firstContractDone = bool(
      progression.firstContractDone
      ?? state?.foundersPlot?.firstContractDone
      ?? state?.contracts?.firstCompleted
      ?? state?.contracts?.completedFirst
    );
    const publicFeatureAttempted = bool(
      progression.publicFeatureAttempted
      ?? state?.foundersPlot?.publicFeatureAttempted
      ?? state?.publicFeatureAttempted
    );
    if (hqLevel >= 2) return { recommended: true, reason: 'HQ2_REACHED' };
    if (firstContractDone) return { recommended: true, reason: 'FIRST_CONTRACT_DONE' };
    if (publicFeatureAttempted) return { recommended: true, reason: 'PUBLIC_FEATURE_ATTEMPT' };
    return { recommended: false, reason: '' };
  }

  function cleanLower(value) {
    return String(value || '').trim().toLowerCase();
  }

  function hasCredential(config = {}) {
    return !!(
      config.apiKeySet === true
      || config.credentialPresent === true
      || String(config.apiKey || config.credential || '').trim()
    );
  }

  function classifyBrainQuality(config = {}) {
    const provider = cleanLower(config.provider);
    const model = cleanLower(config.model || config.modelId);
    const modelRef = cleanLower(config.modelRef || (provider && model ? `${provider}/${model}` : ''));
    const text = `${provider} ${model} ${modelRef}`;
    const credentialPresent = hasCredential(config);
    const configured = bool(config.configured ?? config.brainConfigured ?? (provider && model && credentialPresent));
    if (!configured) return BRAIN_QUALITIES.NONE;
    if (!provider || !model) return BRAIN_QUALITIES.PREVIEW;

    if (/\b(test-local|deterministic|mock|no-?op|noop)\b/.test(text)) {
      return BRAIN_QUALITIES.TEST;
    }
    if (!credentialPresent || /(^|[/:_\s-])(free|basic)(\b|$)/.test(text)) {
      return BRAIN_QUALITIES.PREVIEW;
    }
    return BRAIN_QUALITIES.REAL;
  }

  function brainQualityCanRunRealForeman(quality, input = {}) {
    if (quality === BRAIN_QUALITIES.REAL) return true;
    if (quality === BRAIN_QUALITIES.TEST) return bool(input.allowTestBrainForRealClover ?? input.testHarnessAllowed);
    if (quality === BRAIN_QUALITIES.PREVIEW) return bool(input.allowPreviewBrainForRealClover);
    return false;
  }

  function buildAccessState(input = {}) {
    const state = input.state && typeof input.state === 'object' ? input.state : {};
    const onboarding = state.onboarding && typeof state.onboarding === 'object' ? state.onboarding : {};
    const authenticated = bool(input.authenticated ?? state.authenticated ?? false);
    const provider = input.provider || state.brain?.provider || null;
    const model = input.model || state.brain?.model || state.brain?.modelId || null;
    const modelRef = input.modelRef || state.brain?.modelRef || null;
    const apiKeySet = input.apiKeySet ?? input.credentialPresent ?? state.brain?.apiKeySet ?? state.brain?.credentialPresent;
    const brainQuality = classifyBrainQuality({
      configured: input.brainConfigured ?? state.brain?.configured,
      provider,
      model,
      modelRef,
      apiKeySet,
      apiKey: input.apiKey ?? state.brain?.apiKey,
      credential: input.credential ?? state.brain?.credential
    });
    const brainConfigured = brainQuality !== BRAIN_QUALITIES.NONE;
    const realBrainReady = brainQualityCanRunRealForeman(brainQuality, input);
    const runtimeReady = bool(input.runtimeReady ?? state.foreman?.runtimeReady);
    const testBrainOnly = brainQuality === BRAIN_QUALITIES.TEST && !realBrainReady;
    const townHallComplete = bool(
      input.townHallComplete
      ?? onboarding.registrationComplete
      ?? state.townHall?.complete
    );
    const official = townHallComplete;
    const realClover = realBrainReady && runtimeReady;
    const previewClover = brainConfigured && !realBrainReady;
    const mode = official
      ? MODES.OFFICIAL_TOWN
      : realClover
        ? MODES.REAL_CLOVER
        : previewClover
          ? MODES.PREVIEW_CLOVER
          : MODES.MANUAL_FOUNDER;
    const recommendation = inferTownHallRecommended({ state, progression: input.progression || {} });
    const disabledReason = !brainConfigured
      ? 'BRAIN_REQUIRED'
      : !realBrainReady
        ? 'REAL_BRAIN_REQUIRED'
        : runtimeReady
          ? ''
          : 'RUNTIME_NOT_READY';

    return {
      authenticated,
      authProvider: String(input.authProvider || state.authProvider || 'session'),
      foundersPlot: {
        playable: authenticated,
        mode,
        blockedReason: authenticated ? '' : 'AUTH_REQUIRED',
        defaultDestination: START_DESTINATION
      },
      brain: {
        configured: brainConfigured,
        quality: brainQuality,
        realReady: realBrainReady,
        previewOnly: brainConfigured && !realBrainReady,
        testHarnessAllowed: bool(input.allowTestBrainForRealClover ?? input.testHarnessAllowed),
        runtimeReady,
        requiredForRealForeman: true,
        provider,
        model,
        modelRef,
        testBrainOnly
      },
      clover: {
        guideAvailable: authenticated,
        previewAvailable: brainConfigured,
        realForemanAvailable: realBrainReady && runtimeReady,
        schedulerEnabled: realBrainReady && runtimeReady,
        disabledReason
      },
      townHall: {
        complete: townHallComplete,
        requiredForPublicIdentity: true,
        recommended: recommendation.recommended,
        recommendedReason: recommendation.reason
      }
    };
  }

  function canRunRealForeman(accessState = {}) {
    return !!(
      accessState?.authenticated
      && accessState?.brain?.configured === true
      && accessState?.brain?.realReady === true
      && accessState?.brain?.runtimeReady === true
      && accessState?.clover?.realForemanAvailable === true
    );
  }

  function canOpenDistrict(district, accessState = {}, state = {}) {
    const safeDistrict = normalizeDistrict(district);
    if (!accessState?.authenticated) return false;
    if (safeDistrict === 'founders-plot') return accessState?.foundersPlot?.playable === true;
    if (safeDistrict === 'house') return true;
    if (safeDistrict === 'townhall' || safeDistrict === 'brain') return true;
    if (safeDistrict === 'sigil') {
      return bool(state?.onboarding?.registrationComplete) && accessState?.brain?.configured === true;
    }
    if (safeDistrict === 'ceremony') {
      return bool(state?.signup?.complete);
    }
    return true;
  }

  function districtGateReason(district, accessState = {}, state = {}) {
    if (canOpenDistrict(district, accessState, state)) return '';
    const safeDistrict = normalizeDistrict(district);
    if (!accessState?.authenticated) return 'AUTH_REQUIRED';
    if (safeDistrict === 'sigil' && !bool(state?.onboarding?.registrationComplete)) return 'TOWNHALL_REQUIRED';
    if (safeDistrict === 'sigil' && accessState?.brain?.configured !== true) return 'BRAIN_REQUIRED';
    if (safeDistrict === 'ceremony' && !bool(state?.signup?.complete)) return 'SIGIL_REQUIRED';
    return '';
  }

  const api = Object.freeze({
    MODES,
    BRAIN_QUALITIES,
    START_DESTINATION,
    buildAccessState,
    canOpenDistrict,
    canRunRealForeman,
    classifyBrainQuality,
    districtGateReason,
    normalizeDistrict
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  globalScope.AgentTownAccess = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
