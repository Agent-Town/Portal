(function agentTownAccessFactory(globalScope) {
  const MODES = Object.freeze({
    MANUAL_FOUNDER: 'MANUAL_FOUNDER',
    REAL_CLOVER: 'REAL_CLOVER',
    OFFICIAL_TOWN: 'OFFICIAL_TOWN'
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

  function buildAccessState(input = {}) {
    const state = input.state && typeof input.state === 'object' ? input.state : {};
    const onboarding = state.onboarding && typeof state.onboarding === 'object' ? state.onboarding : {};
    const authenticated = bool(input.authenticated ?? state.authenticated ?? true);
    const brainConfigured = bool(input.brainConfigured ?? state.brain?.configured);
    const runtimeReady = bool(input.runtimeReady ?? state.foreman?.runtimeReady);
    const testBrainOnly = bool(input.testBrainOnly ?? state.brain?.testBrainOnly);
    const townHallComplete = bool(
      input.townHallComplete
      ?? onboarding.registrationComplete
      ?? state.townHall?.complete
    );
    const official = townHallComplete;
    const realClover = brainConfigured && runtimeReady;
    const mode = official
      ? MODES.OFFICIAL_TOWN
      : realClover
        ? MODES.REAL_CLOVER
        : MODES.MANUAL_FOUNDER;
    const recommendation = inferTownHallRecommended({ state, progression: input.progression || {} });

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
        runtimeReady,
        requiredForRealForeman: true,
        provider: input.provider || state.brain?.provider || null,
        model: input.model || state.brain?.model || null,
        testBrainOnly
      },
      clover: {
        guideAvailable: authenticated,
        realForemanAvailable: brainConfigured && runtimeReady,
        schedulerEnabled: brainConfigured && runtimeReady,
        disabledReason: brainConfigured ? (runtimeReady ? '' : 'RUNTIME_NOT_READY') : 'BRAIN_REQUIRED'
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
    START_DESTINATION,
    buildAccessState,
    canOpenDistrict,
    canRunRealForeman,
    districtGateReason,
    normalizeDistrict
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  globalScope.AgentTownAccess = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
