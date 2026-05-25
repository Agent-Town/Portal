const crypto = require('crypto');
const express = require('express');
const {
  BUILDING_RULES,
  EVENT_TYPES,
  MAX_OFFLINE_MS,
  applyAcceptContract,
  applyClaimReward,
  applyCollectOutputs,
  applyPlaceBuilding,
  applyPolicyChange,
  applyQueueJob,
  applyRequestUserApproval,
  applyResolveApproval,
  applyResolveTownOpportunity,
  applyResumeScheduler,
  applyPauseScheduler,
  applyEnableCollectReadyOutputs,
  applyGrantForemanLease,
  applyPausePersistentForeman,
  applyPersistentForemanTick,
  applyUpgradeLandmark,
  applyStartCivicScenario,
  applyContributeCivicScenario,
  applyCompleteSettlementFoundingTask,
  applyChooseOperatingCharter,
  applyFocusSettlement,
  applyLaunchSettlerExpedition,
  applyRefreshOperatingContracts,
  applySetTownIdentity,
  applySetForemanDoctrineRule,
  applyAssignSpecialist,
  applyPauseSpecialist,
  applyReviewSpecialistRecommendation,
  applyAcceptRegionalContract,
  applyCaptureTownPostcard,
  applyCreatorNoticeKioskPostNotice,
  applyDisableCreatorBuilding,
  applyInstallCreatorBuilding,
  applyOpenRegionalSupplyRoute,
  applyRemoveCreatorBuilding,
  applyTransferRegionalSupplyRoute,
  applyTurnInRegionalContract,
  applyStartPersistentForeman,
  applyUnlockOperatingCapability,
  applyReceiptCorrection,
  applyForemanPreference,
  applyRaiseForemanException,
  applyResolveForemanException,
  applyRevokeForemanLease,
  applySetStandingOrder,
  applySetPriority,
  applyTurnInContract,
  applyUpgradeBuilding,
  buildForemanObservation,
  buildForemanDecision,
  buildOperatingStyleCard,
  buildPlotCard,
  compareOperatingStyleCards,
  buildSafeForemanCandidates,
  buildWorldDelta,
  chooseForemanCandidateWithTestBrain,
  createInitialPlot,
  foremanDoctrineView,
  foremanRuntimeStatus,
  pendingApprovalsView,
  resolvePrimaryGoal,
  schedulerStatusView,
  simulatePlot,
  startForemanSession,
  stateView,
  heartbeatForemanSession,
  pauseForemanSession,
  summarizePublic
} = require('./engine');
const {
  appendEvents,
  getIdempotency,
  listEvents,
  listPlots,
  listRecentEvents,
  loadPlotByPairId,
  loadPlotGraphById,
  saveIdempotency,
  savePlotGraph
} = require('./store');
const { buildRecap } = require('./recap');
const { replayFromEvents } = require('./replay');
const { FOUNDERS_PLOT_TOOL_SPECS, getToolSpec } = require('./tools');
const {
  filterToolSpecs,
  isFeatureEnabled,
  isToolEnabled,
  resolveFoundersPlotFeatureFlags,
  stripDisabledFutureState
} = require('./feature_flags');

let persistentForemanSweepTimer = null;

function hashJson(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function normalizeForemanPack(raw = {}) {
  return {
    skillLoaded: raw?.skillLoaded === true,
    heartbeatLoaded: raw?.heartbeatLoaded === true,
    toolsLoaded: raw?.toolsLoaded === true,
    goalsLoaded: raw?.goalsLoaded === true,
    safetyLoaded: raw?.safetyLoaded === true
  };
}

function safeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeFiniteNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function normalizeForemanDecisionPayload(raw = {}) {
  const aliasMap = raw?.toolContract?.aliasMap && typeof raw.toolContract.aliasMap === 'object'
    ? Object.fromEntries(
        Object.entries(raw.toolContract.aliasMap)
          .map(([alias, canonical]) => [String(alias || '').trim(), safeString(canonical)])
          .filter(([alias, canonical]) => alias && canonical)
      )
    : {};
  return {
    selectedCandidateId: safeString(raw?.selectedCandidateId || raw?.chosenCandidateId),
    source: safeString(raw?.source || 'llm') || 'llm',
    confidence: safeFiniteNumber(raw?.confidence, 0),
    reason: safeString(raw?.reason),
    playerFacingLine: safeString(raw?.playerFacingLine),
    noopCode: safeString(raw?.noopCode).toUpperCase() || null,
    modelInvocationId: safeString(raw?.modelInvocationId),
    testBrainInvocationId: safeString(raw?.testBrainInvocationId),
    provider: safeString(raw?.provider),
    model: safeString(raw?.model),
    llmToolName: safeString(raw?.llmToolName),
    workerCommandId: safeString(raw?.workerCommandId),
    workerTraceId: safeString(raw?.workerTraceId),
    packHash: safeString(raw?.pack?.packHash),
    skillMdHash: safeString(raw?.pack?.files?.skillMdHash),
    heartbeatMdHash: safeString(raw?.pack?.files?.heartbeatMdHash),
    toolsMdHash: safeString(raw?.pack?.files?.toolsMdHash),
    goalsMdHash: safeString(raw?.pack?.files?.goalsMdHash),
    safetyMdHash: safeString(raw?.pack?.files?.safetyMdHash),
    aliasMap,
    toolContractSource: safeString(raw?.toolContract?.source),
    contextSummary: raw?.contextSummary && typeof raw.contextSummary === 'object' ? raw.contextSummary : null
  };
}

function buildForemanDecisionMeta(payload = {}, selectedCandidate = null, runtime = null) {
  const canonicalToolName = safeString(selectedCandidate?.toolName);
  const providerSafeToolName = canonicalToolName
    ? Object.entries(payload.aliasMap || {}).find(([, canonical]) => canonical === canonicalToolName)?.[0] || ''
    : '';
  return {
    runtimeId: safeString(runtime?.runtimeId),
    foremanSessionId: safeString(runtime?.sessionId),
    workerCommandId: payload.workerCommandId,
    workerTraceId: payload.workerTraceId,
    modelInvocationId: payload.modelInvocationId || null,
    testBrainInvocationId: payload.testBrainInvocationId || null,
    provider: payload.provider || null,
    model: payload.model || null,
    packHash: payload.packHash || null,
    skillMdHash: payload.skillMdHash || null,
    heartbeatMdHash: payload.heartbeatMdHash || null,
    toolsMdHash: payload.toolsMdHash || null,
    goalsMdHash: payload.goalsMdHash || null,
    safetyMdHash: payload.safetyMdHash || null,
    selectedCandidateId: payload.selectedCandidateId || null,
    llmToolName: payload.llmToolName || null,
    providerSafeToolName: providerSafeToolName || null,
    canonicalToolName: canonicalToolName || null,
    confidence: payload.confidence,
    noopCode: payload.noopCode || null,
    contextSummary: payload.contextSummary
  };
}

function buildForemanDecisionEvents(payload = {}, decisionMeta = {}, { selectedCandidate = null, nowMs = Date.now(), rejectedError = null } = {}) {
  const events = [
    {
      type: EVENT_TYPES.FOREMAN_CONTEXT_ASSEMBLED,
      actor: 'AGENT',
      explanation: 'Clover assembled the Founders Plot Foreman context pack.',
      recapLine: '',
      data: {
        ...decisionMeta,
        completeness: payload?.contextSummary?.completeness || null,
        toolContractSource: payload?.toolContractSource || null
      },
      createdAt: nowMs
    },
    {
      type: EVENT_TYPES.FOREMAN_LLM_REQUESTED,
      actor: 'AGENT',
      explanation: payload.source === 'test_brain'
        ? 'Clover asked the Test Brain to choose a safe candidate.'
        : 'Clover asked the LLM to choose a safe candidate.',
      recapLine: '',
      data: decisionMeta,
      createdAt: nowMs
    }
  ];
  if (payload.selectedCandidateId) {
    events.push({
      type: EVENT_TYPES.FOREMAN_LLM_DECISION_SELECTED,
      actor: 'AGENT',
      explanation: 'Clover selected one safe candidate.',
      recapLine: '',
      data: {
        ...decisionMeta,
        selectedCandidate: selectedCandidate ? {
          candidateId: selectedCandidate.candidateId,
          toolName: selectedCandidate.toolName,
          buildingId: selectedCandidate.buildingId
        } : null,
        reason: payload.reason || null,
        playerFacingLine: payload.playerFacingLine || null
      },
      createdAt: nowMs
    });
    if (decisionMeta.providerSafeToolName || payload.llmToolName) {
      events.push({
        type: EVENT_TYPES.FOREMAN_TOOL_ALIAS_MAPPED,
        actor: 'AGENT',
        explanation: 'Clover mapped the provider-safe tool alias to the canonical Founders Plot tool.',
        recapLine: '',
        data: decisionMeta,
        createdAt: nowMs
      });
    }
  } else {
    events.push({
      type: EVENT_TYPES.FOREMAN_LLM_DECISION_NOOP,
      actor: 'AGENT',
      explanation: 'Clover watched the plot and chose a no-op.',
      recapLine: payload.playerFacingLine || 'Clover watched the plot and held position.',
      data: {
        ...decisionMeta,
        reason: payload.reason || null,
        playerFacingLine: payload.playerFacingLine || null
      },
      createdAt: nowMs
    });
  }
  if (rejectedError) {
    events.push({
      type: EVENT_TYPES.FOREMAN_ACTION_REJECTED,
      actor: 'AGENT',
      explanation: 'Clover suggested a move, but the server rejected it.',
      recapLine: '',
      data: {
        ...decisionMeta,
        error: rejectedError
      },
      createdAt: nowMs
    });
  }
  return events;
}

function normalizeIdentity(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    return { pairId: raw, houseId: null };
  }
  if (typeof raw === 'object') {
    const pairId = String(raw.pairId || raw.identity || raw.id || '').trim();
    if (!pairId) return null;
    const houseId = typeof raw.houseId === 'string' ? raw.houseId.trim() : '';
    return {
      pairId,
      houseId: houseId || null
    };
  }
  return null;
}

function normalizeToolError(error) {
  const code = typeof error?.message === 'string' && error.message ? error.message : 'SERVER_ERROR';
  const retryable = code === 'RATE_LIMITED' || code === 'SIMULATION_DESYNC' || code === 'SERVER_ERROR';
  const message = (() => {
    if (code === 'FOREMAN_WORKER_ORIGIN_REQUIRED') {
      return 'Foreman mutations must originate from the OpenClaw Lite worker command path.';
    }
    if (code === 'FOREMAN_WORKER_RUNTIME_MISMATCH') {
      return 'Foreman mutations must use the current Clover runtime.';
    }
    if (code === 'BRAIN_REQUIRED') {
      return 'Connect a Brain to let Clover act as your Foreman.';
    }
    if (code === 'FEATURE_DISABLED') {
      return 'That roadmap prototype is hidden for this play session.';
    }
    return code;
  })();
  return {
    code,
    message,
    retryable,
    details: error?.details && typeof error.details === 'object' ? error.details : {}
  };
}

function makeToolEnvelope({ ok, data = null, error = null, worldDelta = null }) {
  return {
    ok,
    error,
    worldDelta,
    ...(data ? { data } : {})
  };
}

function createFoundersPlotRouter({ resolveIdentity } = {}) {
  const router = express.Router();

  function resolvePlotIdentity(req, res) {
    const raw = typeof resolveIdentity === 'function' ? resolveIdentity(req, res) : null;
    const identity = normalizeIdentity(raw);
    if (!identity) {
      const error = new Error('UNAUTHORIZED');
      error.details = { reason: 'PLOT_IDENTITY_UNAVAILABLE' };
      throw error;
    }
    return identity;
  }

  function createPlotIfMissing(identity, nowMs) {
    let state = loadPlotByPairId(identity.pairId);
    if (!state) {
      state = createInitialPlot({
        pairId: identity.pairId,
        houseId: identity.houseId || null,
        nowMs
      });
      state.meta.publicHeadline = resolvePrimaryGoal(state, { nowMs }).title;
      savePlotGraph(state);
      appendEvents(state.plot.plotId, [
        {
          type: EVENT_TYPES.PLOT_CREATED,
          actor: 'SYSTEM',
          explanation: 'Founders Plot opened for the session.',
          recapLine: 'Founders Plot opened.',
          data: {
            plot: {
              ...state.plot,
              workshopBuffCharges: state.meta.workshopBuffCharges,
              pendingRewards: state.meta.pendingRewards
            },
            building: state.buildings.find((building) => building.type === 'HQ') || null
          },
          createdAt: nowMs
        }
      ]);
      return state;
    }
    if (identity.houseId && state.plot.houseId !== identity.houseId) {
      state.plot.houseId = identity.houseId;
      state.plot.updatedAt = nowMs;
      savePlotGraph(state);
    }
    const contractsBefore = hashJson(state.meta.contracts || {});
    const headline = resolvePrimaryGoal(state, { nowMs }).title;
    if (!state.meta.publicHeadline || state.meta.publicHeadline !== headline || contractsBefore !== hashJson(state.meta.contracts || {})) {
      state.meta.publicHeadline = headline;
      savePlotGraph(state);
    }
    return state;
  }

  function applySimulation(state, nowMs) {
    const simulationEvents = [];
    const result = simulatePlot(state, nowMs, (event) => {
      simulationEvents.push({
        ...event,
        createdAt: event.createdAt || nowMs
      });
    });
    if (simulationEvents.length > 0) {
      savePlotGraph(state);
      appendEvents(state.plot.plotId, simulationEvents);
    }
    return result;
  }

  function featureDisabledError(featureFlags = {}, toolName = '') {
    const error = new Error('FEATURE_DISABLED');
    error.details = {
      tool: String(toolName || ''),
      featureFlags
    };
    return error;
  }

  function buildStatePayload(state, featureFlags = null) {
    const resolvedFeatureFlags = featureFlags || resolveFoundersPlotFeatureFlags(null);
    const beforeSnapshot = hashJson({
      contracts: state.meta.contracts,
      contractDeck: state.meta.contractDeck,
      townOpportunities: state.meta.townOpportunities,
      scenarios: state.meta.scenarios,
      operatingModel: state.meta.operatingModel,
      specialists: state.meta.specialists,
      regionalNetwork: state.meta.regionalNetwork,
      creatorExtensions: state.meta.creatorExtensions,
      governance: state.meta.governance,
      doctrine: state.meta.doctrine,
      requesters: state.meta.requesters,
      foremanLastDecision: state.meta.foremanLastDecision,
      publicHeadline: state.meta.publicHeadline
    });
    const recentEvents = listRecentEvents(state.plot.plotId, 48);
    const view = stateView(state, recentEvents);
    const recap = buildRecap(recentEvents, {
      afterSeq: state.meta.recapSeenSeq,
      limit: 8
    });
    const payload = stripDisabledFutureState({
      ...view,
      recap: {
        ...view.recap,
        unseenCount: recap.unseenCount,
        lines: recap.lines,
        pendingApprovals: pendingApprovalsView(state)
      }
    }, resolvedFeatureFlags);
    const afterSnapshot = hashJson({
      contracts: state.meta.contracts,
      contractDeck: state.meta.contractDeck,
      townOpportunities: state.meta.townOpportunities,
      scenarios: state.meta.scenarios,
      operatingModel: state.meta.operatingModel,
      specialists: state.meta.specialists,
      regionalNetwork: state.meta.regionalNetwork,
      creatorExtensions: state.meta.creatorExtensions,
      governance: state.meta.governance,
      doctrine: state.meta.doctrine,
      requesters: state.meta.requesters,
      foremanLastDecision: state.meta.foremanLastDecision,
      publicHeadline: state.meta.publicHeadline
    });
    if (beforeSnapshot !== afterSnapshot) {
      savePlotGraph(state);
    }
    return payload;
  }

  function persistStateAndEvents(state, events = []) {
    savePlotGraph(state);
    if (Array.isArray(events) && events.length > 0) {
      return appendEvents(state.plot.plotId, events);
    }
    return [];
  }

  function runPersistentForemanAndPersist(state, nowMs = Date.now()) {
    const events = [];
    const recentEvents = listRecentEvents(state.plot.plotId, 48);
    const result = applyPersistentForemanTick(state, {
      nowMs,
      recentEvents
    }, {
      nowMs,
      appendEvent: (event) => events.push({
        ...event,
        createdAt: event.createdAt || nowMs
      })
    });
    savePlotGraph(state);
    if (events.length > 0) {
      appendEvents(state.plot.plotId, events);
    }
    return {
      result,
      events
    };
  }

  function runPersistentForemanSweep(nowMs = Date.now()) {
    const results = [];
    for (const state of listPlots(100)) {
      if (!state?.plot?.plotId) continue;
      const persistent = state?.meta?.governance?.persistent;
      if (!persistent || String(persistent.status || '').toUpperCase() !== 'ACTIVE') continue;
      const events = [];
      simulatePlot(state, nowMs, (event) => {
        events.push({
          ...event,
          createdAt: event.createdAt || nowMs
        });
      });
      const result = applyPersistentForemanTick(state, {
        nowMs,
        recentEvents: listRecentEvents(state.plot.plotId, 48)
      }, {
        nowMs,
        appendEvent: (event) => events.push({
          ...event,
          createdAt: event.createdAt || nowMs
        })
      });
      savePlotGraph(state);
      if (events.length > 0) {
        appendEvents(state.plot.plotId, events);
      }
      results.push({
        plotId: state.plot.plotId,
        result
      });
    }
    return results;
  }

  if (
    !persistentForemanSweepTimer
    && process.env.NODE_ENV !== 'test'
    && process.env.FOUNDERS_PLOT_BACKGROUND_FOREMAN_DISABLED !== '1'
  ) {
    persistentForemanSweepTimer = setInterval(() => {
      try {
        runPersistentForemanSweep(Date.now());
      } catch {
        // Keep the app server alive if one background sweep fails.
      }
    }, 15_000);
    if (typeof persistentForemanSweepTimer.unref === 'function') persistentForemanSweepTimer.unref();
  }

  function readForemanBearer(req) {
    const auth = String(req.headers?.authorization || '').trim();
    if (!auth || !/^Bearer\s+/i.test(auth)) return '';
    return auth.replace(/^Bearer\s+/i, '').trim();
  }

  function requireForemanRuntime(req, res) {
    const { state, nowMs } = withState(req, res);
    const token = readForemanBearer(req);
    const runtime = foremanRuntimeStatus(state);
    if (!token || !runtime?.token || token !== runtime.token) {
      const error = new Error('FOREMAN_RUNTIME_REQUIRED');
      error.details = { reason: 'TOKEN_REQUIRED' };
      throw error;
    }
    if (runtime.status === 'PAUSED') {
      const error = new Error('STALE_RUNTIME');
      error.details = { runtimeId: runtime.runtimeId, status: runtime.status };
      throw error;
    }
    if (runtime.expiresAt && runtime.expiresAt < nowMs) {
      runtime.status = 'STALE';
      savePlotGraph(state);
      const error = new Error('STALE_RUNTIME');
      error.details = { runtimeId: runtime.runtimeId, status: runtime.status };
      throw error;
    }
    if (runtime.brainReady !== true) {
      const error = new Error('BRAIN_REQUIRED');
      error.details = { runtimeId: runtime.runtimeId, status: runtime.status };
      throw error;
    }
    return { state, nowMs, runtime };
  }

  function withState(req, res) {
    const identity = resolvePlotIdentity(req, res);
    const featureFlags = resolveFoundersPlotFeatureFlags(req);
    const wallNowMs = Date.now();
    const state = createPlotIfMissing(identity, wallNowMs);
    const nowMs = Math.max(wallNowMs, safeFiniteNumber(state?.plot?.lastSimulatedAt, wallNowMs));
    const simulation = applySimulation(state, nowMs);
    return { identity, nowMs, state, simulation, featureFlags };
  }

  function mutationContext(req, res, toolName, rawArgs) {
    const { state, nowMs, featureFlags } = withState(req, res);
    const args = rawArgs && typeof rawArgs === 'object' ? rawArgs : {};
    const idempotencyKey = typeof args.idempotencyKey === 'string' ? args.idempotencyKey.trim() : '';
    if (!idempotencyKey) {
      const error = new Error('INVALID_STATE');
      error.details = { reason: 'MISSING_IDEMPOTENCY_KEY', tool: toolName };
      throw error;
    }
    const argsHash = hashJson({ toolName, args });
    const previous = getIdempotency(state.plot.plotId, idempotencyKey);
    if (previous) {
      if (previous.argsSha !== argsHash) {
        const conflict = new Error('IDEMPOTENCY_CONFLICT');
        conflict.details = { idempotencyKey, tool: toolName };
        throw conflict;
      }
      return {
        nowMs,
        state,
        featureFlags,
        replayResponse: previous.response
      };
    }
    return {
      nowMs,
      state,
      featureFlags,
      argsHash,
      idempotencyKey
    };
  }

  const READ_ONLY_TOOL_NAMES = new Set([
    'et.plot.town.get_signals',
    'et.plot.journal.get_entries',
    'et.plot.contracts.get_state',
    'et.plot.scenarios.get_state',
    'et.plot.regional.get_ledger',
    'et.plot.creator.get_catalog',
    'et.foreman.specialists.get_state',
    'et.foreman.policy.get_standing_order',
    'et.foreman.scheduler.get_status'
  ]);
  const FOREMAN_MUTATION_TOOL_NAMES = new Set([
    'et.plot.collect_outputs',
    'et.plot.queue_job',
    'et.plot.place_building',
    'et.plot.upgrade_building'
  ]);
  const WORKER_COMMAND_ID_RE = /^fpwcmd_\d+_[a-f0-9]+$/i;
  const WORKER_TRACE_ID_RE = /^fpwtrace_\d+_[a-f0-9]+$/i;

  function readOnlyToolData(toolName, state, featureFlags = null) {
    const payload = buildStatePayload(state, featureFlags);
    if (toolName === 'et.plot.town.get_signals') {
      return {
        signals: payload.townSignals
      };
    }
    if (toolName === 'et.plot.journal.get_entries') {
      return {
        entries: payload.journal?.entries || []
      };
    }
    if (toolName === 'et.plot.contracts.get_state') {
      return {
        contracts: payload.contracts
      };
    }
    if (toolName === 'et.plot.scenarios.get_state') {
      return {
        scenarios: payload.scenarios
      };
    }
    if (toolName === 'et.plot.regional.get_ledger') {
      return {
        regionalNetwork: payload.regionalNetwork
      };
    }
    if (toolName === 'et.plot.creator.get_catalog') {
      return {
        creatorExtensions: payload.creatorExtensions
      };
    }
    if (toolName === 'et.foreman.specialists.get_state') {
      return {
        specialists: payload.foreman?.specialists
      };
    }
    if (toolName === 'et.foreman.policy.get_standing_order') {
      return {
        standingOrder: payload.foreman?.standingOrder
      };
    }
    if (toolName === 'et.foreman.scheduler.get_status') {
      return {
        scheduler: schedulerStatusView(state)
      };
    }
    return null;
  }

  function normalizeWorkerCommandMeta(rawArgs = {}, runtime = {}) {
    const origin = String(rawArgs.origin || '').trim().toUpperCase();
    if (origin !== 'OPENCLAW_LITE_WORKER') {
      const error = new Error('FOREMAN_WORKER_ORIGIN_REQUIRED');
      error.details = { reason: 'INVALID_ORIGIN' };
      throw error;
    }
    const workerCommandId = String(rawArgs.workerCommandId || '').trim();
    if (!WORKER_COMMAND_ID_RE.test(workerCommandId)) {
      const error = new Error('FOREMAN_WORKER_ORIGIN_REQUIRED');
      error.details = { reason: 'INVALID_WORKER_COMMAND_ID' };
      throw error;
    }
    const workerTraceId = String(rawArgs.workerTraceId || '').trim();
    if (!WORKER_TRACE_ID_RE.test(workerTraceId)) {
      const error = new Error('FOREMAN_WORKER_ORIGIN_REQUIRED');
      error.details = { reason: 'INVALID_WORKER_TRACE_ID' };
      throw error;
    }
    const requestedRuntimeId = String(rawArgs.runtimeId || '').trim();
    if (!requestedRuntimeId) {
      const error = new Error('FOREMAN_WORKER_ORIGIN_REQUIRED');
      error.details = { reason: 'MISSING_RUNTIME_ID' };
      throw error;
    }
    if (requestedRuntimeId !== String(runtime.runtimeId || '').trim()) {
      const error = new Error('FOREMAN_WORKER_RUNTIME_MISMATCH');
      error.details = {
        expectedRuntimeId: String(runtime.runtimeId || '').trim(),
        runtimeId: requestedRuntimeId
      };
      throw error;
    }
    return {
      origin,
      workerCommandId,
      workerTraceId,
      runtimeId: String(runtime.runtimeId || '').trim(),
      foremanSessionId: String(runtime.sessionId || '').trim()
    };
  }

  function buildWorkerCommandEvent(type, workerMeta, { toolName = '', buildingId = '', error = null, extraData = null } = {}) {
    return {
      type,
      actor: 'AGENT',
      explanation: type === EVENT_TYPES.FOREMAN_WORKER_COMMAND_FAILED
        ? `Worker-owned Foreman command failed for ${toolName}.`
        : type === EVENT_TYPES.FOREMAN_WORKER_COMMAND_COMPLETED
          ? `Worker-owned Foreman command completed for ${toolName}.`
          : `Worker-owned Foreman command started for ${toolName}.`,
      recapLine: '',
      data: {
        ...workerMeta,
        tool: String(toolName || ''),
        buildingId: String(buildingId || ''),
        ...(error ? { error } : {}),
        ...(extraData && typeof extraData === 'object' ? extraData : {})
      }
    };
  }

  function persistMutation(state, toolName, idempotencyKey, argsHash, envelope, events) {
    savePlotGraph(state);
    if (events.length > 0) {
      appendEvents(state.plot.plotId, events);
    }
    saveIdempotency(state.plot.plotId, idempotencyKey, {
      tool: toolName,
      argsSha: argsHash,
      response: envelope,
      createdAt: Date.now()
    });
  }

  function executeTool(toolName, req, res) {
    const spec = getToolSpec(toolName);
    if (!spec) {
      return res.status(404).json(makeToolEnvelope({
        ok: false,
        error: {
          code: 'INVALID_STATE',
          message: 'Unknown Founders Plot tool',
          retryable: false,
          details: { tool: toolName }
        },
        worldDelta: null
      }));
    }

    try {
      const featureFlags = resolveFoundersPlotFeatureFlags(req);
      if (!isToolEnabled(toolName, featureFlags)) {
        throw featureDisabledError(featureFlags, toolName);
      }
      const rawArgs = req.body && typeof req.body === 'object' ? req.body : {};
      if (String(rawArgs.actor || '').trim().toUpperCase() === 'AGENT') {
        return res.status(403).json(makeToolEnvelope({
          ok: false,
          error: {
            code: 'ACTOR_SPOOF_REJECTED',
            message: 'Agent actions must come through the Foreman runtime route.',
            retryable: false,
            details: {}
          },
          worldDelta: null
        }));
      }
      if (toolName === 'et.plot.get_state') {
        const { state, featureFlags: requestFeatureFlags } = withState(req, res);
        return res.json(makeToolEnvelope({
          ok: true,
          data: {
            state: buildStatePayload(state, requestFeatureFlags)
          },
          worldDelta: null
        }));
      }
      const readOnlyState = READ_ONLY_TOOL_NAMES.has(toolName) ? withState(req, res) : null;
      if (readOnlyState) {
        const { state, featureFlags: requestFeatureFlags } = readOnlyState;
        return res.json(makeToolEnvelope({
          ok: true,
          data: {
            ...readOnlyToolData(toolName, state, requestFeatureFlags),
            state: buildStatePayload(state, requestFeatureFlags)
          },
          worldDelta: null
        }));
      }

      const actor = 'HUMAN';
      const ctx = mutationContext(req, res, toolName, rawArgs);
      if (ctx.replayResponse) {
        return res.json(ctx.replayResponse);
      }

      const eventBuffer = [];
      const mutationHelpers = {
        nowMs: ctx.nowMs,
        appendEvent: (event) => eventBuffer.push({
          ...event,
          createdAt: event.createdAt || ctx.nowMs
        })
      };

      let data = null;
      if (toolName === 'et.plot.place_building') {
        data = applyPlaceBuilding(ctx.state, {
          actor,
          type: String(rawArgs.type || '').trim(),
          x: Number(rawArgs.x),
          y: Number(rawArgs.y),
          approvalId: typeof rawArgs.approvalId === 'string' ? rawArgs.approvalId.trim() : null
        }, mutationHelpers);
      } else if (toolName === 'et.plot.queue_job') {
        data = applyQueueJob(ctx.state, {
          actor,
          buildingId: String(rawArgs.buildingId || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.collect_outputs') {
        data = applyCollectOutputs(ctx.state, {
          actor,
          buildingId: String(rawArgs.buildingId || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.upgrade_building') {
        data = applyUpgradeBuilding(ctx.state, {
          actor,
          buildingId: typeof rawArgs.buildingId === 'string' ? rawArgs.buildingId.trim() : null,
          approvalId: typeof rawArgs.approvalId === 'string' ? rawArgs.approvalId.trim() : null
        }, mutationHelpers);
      } else if (toolName === 'et.plot.set_priority') {
        data = applySetPriority(ctx.state, {
          actor,
          buildingId: String(rawArgs.buildingId || '').trim(),
          priority: String(rawArgs.priority || '').trim().toUpperCase()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.claim_reward') {
        data = applyClaimReward(ctx.state, {
          rewardKey: String(rawArgs.rewardKey || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.request_user_approval') {
        data = applyRequestUserApproval(ctx.state, {
          requestedBy: actor,
          tool: String(rawArgs.tool || '').trim(),
          title: typeof rawArgs.title === 'string' ? rawArgs.title.trim() : '',
          body: typeof rawArgs.body === 'string' ? rawArgs.body.trim() : '',
          payload: rawArgs.payload && typeof rawArgs.payload === 'object' ? rawArgs.payload : {}
        }, mutationHelpers);
      } else if (toolName === 'et.plot.town.get_signals') {
        data = {
          signals: buildStatePayload(ctx.state, ctx.featureFlags).townSignals
        };
      } else if (toolName === 'et.plot.town.upgrade_landmark') {
        data = applyUpgradeLandmark(ctx.state, {
          landmarkId: String(rawArgs.landmarkId || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.town.set_identity') {
        data = applySetTownIdentity(ctx.state, {
          landmarkId: String(rawArgs.landmarkId || '').trim(),
          styleId: String(rawArgs.styleId || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.town.resolve_opportunity') {
        data = applyResolveTownOpportunity(ctx.state, {
          opportunityId: String(rawArgs.opportunityId || '').trim(),
          optionId: String(rawArgs.optionId || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.journal.get_entries') {
        data = {
          entries: buildStatePayload(ctx.state, ctx.featureFlags).journal?.entries || []
        };
      } else if (toolName === 'et.plot.contracts.get_state') {
        data = {
          contracts: buildStatePayload(ctx.state, ctx.featureFlags).contracts
        };
      } else if (toolName === 'et.plot.contracts.accept') {
        data = applyAcceptContract(ctx.state, {
          contractId: String(rawArgs.contractId || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.contracts.turn_in') {
        data = applyTurnInContract(ctx.state, {
          contractId: String(rawArgs.contractId || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.scenarios.get_state') {
        data = {
          scenarios: buildStatePayload(ctx.state, ctx.featureFlags).scenarios
        };
      } else if (toolName === 'et.plot.scenarios.start') {
        data = applyStartCivicScenario(ctx.state, {
          scenarioId: String(rawArgs.scenarioId || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.scenarios.contribute') {
        data = applyContributeCivicScenario(ctx.state, {
          scenarioId: String(rawArgs.scenarioId || '').trim(),
          taskId: String(rawArgs.taskId || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.settlements.get_ledger') {
        data = {
          settlements: buildStatePayload(ctx.state, ctx.featureFlags).settlements
        };
      } else if (toolName === 'et.plot.settlements.launch_expedition') {
        data = {
          settlements: applyLaunchSettlerExpedition(ctx.state, {}, mutationHelpers)
        };
      } else if (toolName === 'et.plot.settlements.focus') {
        data = {
          settlements: applyFocusSettlement(ctx.state, {
            settlementId: String(rawArgs.settlementId || 'town_1').trim()
          }, mutationHelpers)
        };
      } else if (toolName === 'et.plot.settlements.complete_founding_task') {
        data = {
          settlements: applyCompleteSettlementFoundingTask(ctx.state, {
            settlementId: String(rawArgs.settlementId || 'town_2').trim(),
            taskId: String(rawArgs.taskId || 'raise_outpost_camp').trim()
          }, mutationHelpers)
        };
      } else if (toolName === 'et.plot.operating_model.get_state') {
        data = {
          operatingModel: buildStatePayload(ctx.state, ctx.featureFlags).operatingModel
        };
      } else if (toolName === 'et.plot.operating_model.choose_charter') {
        data = applyChooseOperatingCharter(ctx.state, {
          charterId: String(rawArgs.charterId || '').trim(),
          source: 'tool'
        }, mutationHelpers);
      } else if (toolName === 'et.plot.operating_model.unlock_capability') {
        data = applyUnlockOperatingCapability(ctx.state, {
          capabilityId: String(rawArgs.capabilityId || '').trim(),
          source: 'tool'
        }, mutationHelpers);
      } else if (toolName === 'et.plot.operating_model.refresh_contracts') {
        data = applyRefreshOperatingContracts(ctx.state, {}, mutationHelpers);
      } else if (toolName === 'et.plot.regional.get_ledger') {
        data = {
          regionalNetwork: buildStatePayload(ctx.state, ctx.featureFlags).regionalNetwork
        };
      } else if (toolName === 'et.plot.regional.open_supply_route') {
        data = applyOpenRegionalSupplyRoute(ctx.state, {
          routeId: String(rawArgs.routeId || 'founders_ridge_supply_route').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.regional.transfer_supply_route') {
        data = applyTransferRegionalSupplyRoute(ctx.state, {
          routeId: String(rawArgs.routeId || 'founders_ridge_supply_route').trim(),
          fromSettlementId: String(rawArgs.fromSettlementId || 'town_1').trim(),
          toSettlementId: String(rawArgs.toSettlementId || 'town_2').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.regional.accept_contract') {
        data = applyAcceptRegionalContract(ctx.state, {
          contractId: String(rawArgs.contractId || 'ridge_timber_bridge').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.regional.turn_in_contract') {
        data = applyTurnInRegionalContract(ctx.state, {
          contractId: String(rawArgs.contractId || 'ridge_timber_bridge').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.creator.get_catalog') {
        data = {
          creatorExtensions: buildStatePayload(ctx.state, ctx.featureFlags).creatorExtensions
        };
      } else if (toolName === 'et.plot.creator.install_building') {
        data = applyInstallCreatorBuilding(ctx.state, {
          extensionId: String(rawArgs.extensionId || 'creator.notice-kiosk').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.creator.disable_building') {
        data = applyDisableCreatorBuilding(ctx.state, {
          extensionId: String(rawArgs.extensionId || 'creator.notice-kiosk').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.creator.remove_building') {
        data = applyRemoveCreatorBuilding(ctx.state, {
          extensionId: String(rawArgs.extensionId || 'creator.notice-kiosk').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.creator.notice_kiosk.post_notice') {
        data = applyCreatorNoticeKioskPostNotice(ctx.state, {
          text: String(rawArgs.text || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.foreman.specialists.get_state') {
        data = {
          specialists: buildStatePayload(ctx.state, ctx.featureFlags).foreman?.specialists
        };
      } else if (toolName === 'et.foreman.specialists.assign') {
        data = applyAssignSpecialist(ctx.state, {
          roleId: String(rawArgs.roleId || '').trim(),
          domainId: String(rawArgs.domainId || '').trim(),
          source: 'tool'
        }, mutationHelpers);
      } else if (toolName === 'et.foreman.specialists.pause') {
        data = applyPauseSpecialist(ctx.state, {
          roleId: String(rawArgs.roleId || '').trim(),
          reason: String(rawArgs.reason || 'Player paused specialist lane.').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.foreman.specialists.review_recommendation') {
        data = applyReviewSpecialistRecommendation(ctx.state, {
          roleId: String(rawArgs.roleId || '').trim(),
          domainId: String(rawArgs.domainId || '').trim(),
          toolName: String(rawArgs.toolName || '').trim(),
          targetObjectId: String(rawArgs.targetObjectId || '').trim(),
          summary: String(rawArgs.summary || '').trim(),
          recommendationId: String(rawArgs.recommendationId || '').trim(),
          conflictsWith: Array.isArray(rawArgs.conflictsWith) ? rawArgs.conflictsWith : []
        }, mutationHelpers);
      } else if (toolName === 'et.foreman.policy.get_standing_order') {
        data = {
          standingOrder: buildStatePayload(ctx.state, ctx.featureFlags).foreman?.standingOrder
        };
      } else if (toolName === 'et.foreman.policy.set_standing_order') {
        data = applySetStandingOrder(ctx.state, {
          standingOrder: String(rawArgs.standingOrder || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.foreman.doctrine.get_state') {
        data = {
          doctrine: buildStatePayload(ctx.state, ctx.featureFlags).foreman?.doctrine
        };
      } else if (toolName === 'et.foreman.doctrine.set_rule') {
        data = applySetForemanDoctrineRule(ctx.state, {
          ruleId: String(rawArgs.ruleId || '').trim(),
          enabled: rawArgs.enabled !== false,
          source: 'tool'
        }, mutationHelpers);
      } else if (toolName === 'et.foreman.scheduler.get_status') {
        data = {
          scheduler: schedulerStatusView(ctx.state)
        };
      } else if (toolName === 'et.foreman.scheduler.enable_collect_ready_outputs') {
        data = {
          scheduler: applyEnableCollectReadyOutputs(ctx.state, mutationHelpers)
        };
      } else if (toolName === 'et.foreman.scheduler.pause') {
        data = {
          scheduler: applyPauseScheduler(ctx.state, mutationHelpers)
        };
      } else if (toolName === 'et.foreman.scheduler.resume') {
        data = {
          scheduler: applyResumeScheduler(ctx.state, mutationHelpers)
        };
      } else if (toolName === 'et.foreman.governance.grant_lease') {
        data = {
          governance: applyGrantForemanLease(ctx.state, {
            durationMinutes: Number(rawArgs.durationMinutes || 15),
            scope: String(rawArgs.scope || 'collect_ready_outputs').trim()
          }, mutationHelpers)
        };
      } else if (toolName === 'et.foreman.governance.revoke_lease') {
        data = {
          governance: applyRevokeForemanLease(ctx.state, {
            reason: String(rawArgs.reason || 'Player revoked Foreman lease.').trim()
          }, mutationHelpers)
        };
      } else if (toolName === 'et.foreman.governance.raise_exception') {
        data = {
          governance: applyRaiseForemanException(ctx.state, {
            title: String(rawArgs.title || '').trim(),
            body: String(rawArgs.body || '').trim(),
            requestedAction: String(rawArgs.requestedAction || '').trim(),
            severity: String(rawArgs.severity || 'needs_review').trim(),
            payload: rawArgs.payload && typeof rawArgs.payload === 'object' ? rawArgs.payload : {}
          }, mutationHelpers)
        };
      } else if (toolName === 'et.foreman.governance.resolve_exception') {
        data = {
          governance: applyResolveForemanException(ctx.state, {
            exceptionId: String(rawArgs.exceptionId || '').trim(),
            resolution: String(rawArgs.resolution || 'RESOLVED').trim()
          }, mutationHelpers)
        };
      } else if (toolName === 'et.foreman.governance.start_persistent') {
        if (rawArgs.brainReady !== true) {
          const error = new Error('BRAIN_REQUIRED');
          error.details = { reason: 'BRAIN_NOT_READY' };
          throw error;
        }
        data = {
          governance: applyStartPersistentForeman(ctx.state, {
            durationMinutes: Number(rawArgs.durationMinutes || 120),
            scope: String(rawArgs.scope || 'collect_ready_outputs').trim()
          }, mutationHelpers)
        };
      } else if (toolName === 'et.foreman.governance.pause_persistent') {
        data = {
          governance: applyPausePersistentForeman(ctx.state, {
            reason: String(rawArgs.reason || 'Player paused while-away Clover help.').trim()
          }, mutationHelpers)
        };
      } else {
        const error = new Error('INVALID_STATE');
        error.details = { tool: toolName };
        throw error;
      }

      ctx.state.plot.updatedAt = ctx.nowMs;
      const envelope = makeToolEnvelope({
        ok: true,
        data: {
          ...data,
          state: buildStatePayload(ctx.state, ctx.featureFlags)
        },
        worldDelta: buildWorldDelta(ctx.state, eventBuffer.map((event) => event.type))
      });
      persistMutation(ctx.state, toolName, ctx.idempotencyKey, ctx.argsHash, envelope, eventBuffer);
      return res.json(envelope);
    } catch (error) {
      const normalized = normalizeToolError(error);
      const status = normalized.code === 'UNAUTHORIZED'
        ? 401
        : normalized.code === 'OUT_OF_BOUNDS' || normalized.code === 'INVALID_STATE'
          ? 400
          : normalized.code === 'CREATOR_MANIFEST_NOT_FOUND'
            ? 404
          : normalized.code === 'OUT_OF_RESOURCES' || normalized.code === 'FORBIDDEN_POLICY' || normalized.code === 'FEATURE_DISABLED' || normalized.code === 'ACTOR_SPOOF_REJECTED' || normalized.code === 'FOREMAN_RUNTIME_REQUIRED' || normalized.code === 'STALE_RUNTIME' || normalized.code === 'SPECIALIST_GATE_REQUIRED' || normalized.code === 'SPECIALIST_DOMAIN_VIOLATION' || normalized.code === 'REGIONAL_GATE_REQUIRED' || normalized.code === 'REGIONAL_ROUTE_FORBIDDEN' || normalized.code === 'CREATOR_GATE_REQUIRED' || normalized.code === 'CREATOR_MANIFEST_REJECTED' || normalized.code === 'CREATOR_TOOL_MODERATION_FAILED'
            ? 403
            : normalized.code === 'BUILD_SLOT_OCCUPIED' || normalized.code === 'JOB_ALREADY_RUNNING' || normalized.code === 'IDEMPOTENCY_CONFLICT' || normalized.code === 'CONTRACT_ACTIVE_EXISTS' || normalized.code === 'SPECIALIST_ASSIGNMENT_REQUIRED' || normalized.code === 'REGIONAL_ROUTE_REQUIRED' || normalized.code === 'REGIONAL_CONTRACT_ACTIVE_EXISTS' || normalized.code === 'CREATOR_INSTALLATION_REQUIRED'
              ? 409
              : normalized.code === 'RATE_LIMITED'
                ? 429
                : 500;
      return res.status(status).json(makeToolEnvelope({
        ok: false,
        error: normalized,
        worldDelta: null
      }));
    }
  }

  router.get('/api/founders-plot/tools', (req, res) => {
    const featureFlags = resolveFoundersPlotFeatureFlags(req);
    res.json({
      ok: true,
      featureFlags,
      tools: filterToolSpecs(FOUNDERS_PLOT_TOOL_SPECS, featureFlags)
    });
  });

  router.get('/api/founders-plot/state', (req, res) => {
    try {
      const { state, simulation, featureFlags } = withState(req, res);
      res.json({
        ok: true,
        simulation,
        state: buildStatePayload(state, featureFlags)
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'UNAUTHORIZED' ? 401 : 500).json({
        ok: false,
        error: normalized.code
      });
    }
  });

  router.get('/api/founders-plot/recap', (req, res) => {
    try {
      const { state, nowMs, featureFlags } = withState(req, res);
      const events = listRecentEvents(state.plot.plotId, 120);
      const recap = buildRecap(events, {
        afterSeq: state.meta.recapSeenSeq,
        limit: 12
      });
      const latestSeq = events.length > 0 ? events[events.length - 1].seq : 0;
      if (recap.unseenCount > 0 && state.meta.lastGeneratedRecapSeq < latestSeq) {
        state.meta.lastGeneratedRecapSeq = latestSeq;
        savePlotGraph(state);
        appendEvents(state.plot.plotId, [
          {
            type: EVENT_TYPES.RECAP_GENERATED,
            actor: 'SYSTEM',
            explanation: 'While-you-were-away recap generated.',
            recapLine: '',
            data: {
              plot: {
                plotId: state.plot.plotId,
                hqLevel: state.plot.hqLevel
              },
              recap: {
                unseenCount: recap.unseenCount,
                latestSeq
              }
            },
            createdAt: nowMs
          }
        ]);
      }
      res.json({
        ok: true,
        recap: {
          ...recap,
          morningBrief: buildStatePayload(state, featureFlags).recap?.morningBrief || null
        }
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'UNAUTHORIZED' ? 401 : 500).json({
        ok: false,
        error: normalized.code
      });
    }
  });

  router.post('/api/founders-plot/recap/read', (req, res) => {
    try {
      const { state, featureFlags } = withState(req, res);
      const latest = listRecentEvents(state.plot.plotId, 1)[0] || null;
      state.meta.recapSeenSeq = latest ? latest.seq : state.meta.recapSeenSeq;
      state.plot.updatedAt = Date.now();
      savePlotGraph(state);
      res.json({
        ok: true,
        recapSeenSeq: state.meta.recapSeenSeq
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'UNAUTHORIZED' ? 401 : 500).json({
        ok: false,
        error: normalized.code
      });
    }
  });

  router.get('/api/founders-plot/replay', (req, res) => {
    try {
      const { state } = withState(req, res);
      const events = listEvents(state.plot.plotId, {
        afterSeq: 0,
        limit: 5000
      });
      const replay = replayFromEvents(events, state);
      res.json({
        ok: true,
        replay,
        currentHash: buildStatePayload(state, featureFlags).stateHash
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'UNAUTHORIZED' ? 401 : 500).json({
        ok: false,
        error: normalized.code
      });
    }
  });

  router.post('/api/founders-plot/policy', (req, res) => {
    try {
      const { state, nowMs, featureFlags } = withState(req, res);
      const key = String(req.body?.key || '').trim();
      const value = typeof req.body?.value === 'boolean' ? req.body.value : req.body?.value;
      const events = [];
      const data = applyPolicyChange(state, { key, value }, {
        nowMs,
        appendEvent: (event) => events.push({
          ...event,
          createdAt: event.createdAt || nowMs
        })
      });
      savePlotGraph(state);
      appendEvents(state.plot.plotId, events);
      res.json({
        ok: true,
        data,
        state: buildStatePayload(state, featureFlags)
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'FORBIDDEN_POLICY' ? 403 : 400).json({
        ok: false,
        error: normalized.code,
        details: normalized.details
      });
    }
  });

  router.post('/api/founders-plot/approvals/:approvalId/resolve', (req, res) => {
    try {
      const { state, nowMs, featureFlags } = withState(req, res);
      const events = [];
      const data = applyResolveApproval(state, {
        approvalId: String(req.params.approvalId || '').trim(),
        decision: String(req.body?.decision || '').trim().toLowerCase(),
        note: typeof req.body?.note === 'string' ? req.body.note : ''
      }, {
        nowMs,
        appendEvent: (event) => events.push({
          ...event,
          createdAt: event.createdAt || nowMs
        })
      });
      savePlotGraph(state);
      appendEvents(state.plot.plotId, events);
      res.json({
        ok: true,
        data,
        state: buildStatePayload(state, featureFlags)
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(400).json({
        ok: false,
        error: normalized.code,
        details: normalized.details
      });
    }
  });

  router.get('/api/founders-plot/contracts/state', (req, res) => {
    try {
      const { state, featureFlags } = withState(req, res);
      res.json({
        ok: true,
        contracts: buildStatePayload(state, featureFlags).contracts
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'UNAUTHORIZED' ? 401 : 500).json({
        ok: false,
        error: normalized
      });
    }
  });

  router.post('/api/founders-plot/contracts/accept', (req, res) => {
    try {
      const rawArgs = req.body && typeof req.body === 'object' ? req.body : {};
      const ctx = mutationContext(req, res, 'et.plot.contracts.accept', rawArgs);
      if (ctx.replayResponse) return res.json(ctx.replayResponse);
      const events = [];
      const result = applyAcceptContract(ctx.state, {
        contractId: String(rawArgs.contractId || '').trim()
      }, {
        nowMs: ctx.nowMs,
        appendEvent: (event) => events.push({ ...event, createdAt: event.createdAt || ctx.nowMs })
      });
      const payload = {
        ok: true,
        contract: result.contract,
        state: buildStatePayload(ctx.state, ctx.featureFlags)
      };
      persistMutation(ctx.state, 'et.plot.contracts.accept', ctx.idempotencyKey, ctx.argsHash, payload, events);
      res.json(payload);
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'CONTRACT_ACTIVE_EXISTS' ? 409 : 400).json({
        ok: false,
        error: normalized
      });
    }
  });

  router.post('/api/founders-plot/contracts/turn-in', (req, res) => {
    try {
      const rawArgs = req.body && typeof req.body === 'object' ? req.body : {};
      const ctx = mutationContext(req, res, 'et.plot.contracts.turn_in', rawArgs);
      if (ctx.replayResponse) return res.json(ctx.replayResponse);
      const events = [];
      const result = applyTurnInContract(ctx.state, {
        contractId: String(rawArgs.contractId || '').trim()
      }, {
        nowMs: ctx.nowMs,
        appendEvent: (event) => events.push({ ...event, createdAt: event.createdAt || ctx.nowMs })
      });
      const payload = {
        ok: true,
        contract: result.contract,
        state: buildStatePayload(ctx.state, ctx.featureFlags)
      };
      persistMutation(ctx.state, 'et.plot.contracts.turn_in', ctx.idempotencyKey, ctx.argsHash, payload, events);
      res.json(payload);
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(400).json({
        ok: false,
        error: normalized
      });
    }
  });

  router.post('/api/founders-plot/foreman/session/start', (req, res) => {
    try {
      const { state, nowMs, featureFlags } = withState(req, res);
      const raw = req.body && typeof req.body === 'object' ? req.body : {};
      if (raw.brainReady !== true) {
        const error = new Error('BRAIN_REQUIRED');
        error.details = { reason: 'BRAIN_NOT_READY' };
        throw error;
      }
      const runtime = startForemanSession(state, {
        runtimeId: String(raw.runtimeId || '').trim(),
        nowMs,
        pack: normalizeForemanPack(raw?.pack || {}),
        brainReady: raw.brainReady === true
      });
      state.plot.updatedAt = nowMs;
      persistStateAndEvents(state, [
        {
          type: EVENT_TYPES.FOREMAN_SESSION_STARTED,
          actor: 'SYSTEM',
          explanation: 'Foreman runtime session started.',
          recapLine: '',
          data: {
            runtimeId: runtime.runtimeId,
            foremanSessionId: runtime.sessionId
          },
          createdAt: nowMs
        }
      ]);
      res.json({
        ok: true,
        runtime
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'BRAIN_REQUIRED' ? 403 : 500).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/founders-plot/foreman/session/heartbeat', (req, res) => {
    try {
      const { state, nowMs, runtime } = requireForemanRuntime(req, res);
      const raw = req.body && typeof req.body === 'object' ? req.body : {};
      const updated = heartbeatForemanSession(state, {
        nowMs,
        pack: normalizeForemanPack(raw?.pack || {})
      });
      persistStateAndEvents(state, []);
      res.json({
        ok: true,
        runtime: {
          ...updated,
          token: runtime.token
        }
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(403).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/founders-plot/foreman/session/pause', (req, res) => {
    try {
      const { state, nowMs } = requireForemanRuntime(req, res);
      const paused = pauseForemanSession(state, { nowMs });
      persistStateAndEvents(state, [
        {
          type: EVENT_TYPES.FOREMAN_SESSION_PAUSED,
          actor: 'HUMAN',
          explanation: 'Foreman runtime paused.',
          recapLine: 'Foreman paused.',
          data: {
            runtimeId: paused.runtimeId,
            foremanSessionId: paused.sessionId
          },
          createdAt: nowMs
        }
      ]);
      res.json({
        ok: true,
        runtime: paused
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(403).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/founders-plot/foreman/persistent/start', (req, res) => {
    try {
      const { state, nowMs, featureFlags } = withState(req, res);
      if (!isFeatureEnabled(featureFlags, 'FEATURE_FOUNDERS_V20_PERSISTENT_FOREMAN')) {
        throw featureDisabledError(featureFlags, 'et.foreman.governance.start_persistent');
      }
      const raw = req.body && typeof req.body === 'object' ? req.body : {};
      if (raw.brainReady !== true) {
        const error = new Error('BRAIN_REQUIRED');
        error.details = { reason: 'BRAIN_NOT_READY' };
        throw error;
      }
      const events = [];
      const governance = applyStartPersistentForeman(state, {
        durationMinutes: Number(raw.durationMinutes || 120),
        scope: String(raw.scope || 'collect_ready_outputs').trim()
      }, {
        nowMs,
        appendEvent: (event) => events.push({
          ...event,
          createdAt: event.createdAt || nowMs
        })
      });
      persistStateAndEvents(state, events);
      res.json({
        ok: true,
        governance,
        state: buildStatePayload(state, featureFlags)
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'BRAIN_REQUIRED' || normalized.code === 'FEATURE_DISABLED' ? 403 : 400).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/founders-plot/foreman/persistent/pause', (req, res) => {
    try {
      const { state, nowMs, featureFlags } = withState(req, res);
      if (!isFeatureEnabled(featureFlags, 'FEATURE_FOUNDERS_V20_PERSISTENT_FOREMAN')) {
        throw featureDisabledError(featureFlags, 'et.foreman.governance.pause_persistent');
      }
      const raw = req.body && typeof req.body === 'object' ? req.body : {};
      const events = [];
      const governance = applyPausePersistentForeman(state, {
        reason: String(raw.reason || 'Player paused while-away Clover help.').trim()
      }, {
        nowMs,
        appendEvent: (event) => events.push({
          ...event,
          createdAt: event.createdAt || nowMs
        })
      });
      persistStateAndEvents(state, events);
      res.json({
        ok: true,
        governance,
        state: buildStatePayload(state, featureFlags)
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'FEATURE_DISABLED' ? 403 : 400).json({ ok: false, error: normalized });
    }
  });

  router.get('/api/founders-plot/foreman/observation', (req, res) => {
    try {
      const { state, nowMs, runtime } = requireForemanRuntime(req, res);
      const recentEvents = listRecentEvents(state.plot.plotId, 48);
      const observation = buildForemanObservation(state, {
        runtimeId: runtime.runtimeId,
        nowMs,
        recentEvents
      });
      observation.claimLease = true;
      const safeCandidates = buildSafeForemanCandidates(state, observation);
      const decision = chooseForemanCandidateWithTestBrain({
        observation,
        safeCandidates
      });
      res.json({
        ok: true,
        observation,
        safeCandidates,
        recentReceipts: Array.isArray(state.meta.foremanReceipts) ? state.meta.foremanReceipts.slice(0, 4) : [],
        toolRegistry: FOUNDERS_PLOT_TOOL_SPECS,
        decision,
        runtime: {
          ...runtime,
          token: undefined
        }
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(403).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/founders-plot/foreman/decision', express.json(), (req, res) => {
    try {
      const { state, nowMs, runtime } = requireForemanRuntime(req, res);
      const observation = buildForemanObservation(state, {
        runtimeId: runtime.runtimeId,
        nowMs,
        recentEvents: listRecentEvents(state.plot.plotId, 48)
      });
      const safeCandidates = buildSafeForemanCandidates(state, observation);
      const payload = normalizeForemanDecisionPayload(req.body || {});
      const selectedCandidate = payload.selectedCandidateId
        ? safeCandidates.find((candidate) => String(candidate?.candidateId || '') === payload.selectedCandidateId) || null
        : null;
      const decisionMeta = buildForemanDecisionMeta(payload, selectedCandidate, runtime);
      if (payload.selectedCandidateId && !selectedCandidate) {
        persistStateAndEvents(state, buildForemanDecisionEvents(payload, decisionMeta, {
          selectedCandidate: null,
          nowMs,
          rejectedError: {
            code: 'INVALID_FOREMAN_DECISION_CANDIDATE',
            chosenCandidateId: payload.selectedCandidateId
          }
        }));
        throw Object.assign(new Error('INVALID_STATE'), {
          details: {
            reason: 'INVALID_FOREMAN_DECISION_CANDIDATE',
            chosenCandidateId: payload.selectedCandidateId
          }
        });
      }
      const decision = payload.selectedCandidateId
        ? {
            ...buildForemanDecision({
              observation,
              safeCandidates,
              chosenCandidateId: payload.selectedCandidateId,
              source: payload.source
            }),
            confidence: payload.confidence,
            reason: payload.reason,
            playerFacingLine: payload.playerFacingLine,
            noopCode: payload.noopCode,
            meta: decisionMeta
          }
        : {
            chosenCandidateId: null,
            planCard: null,
            source: payload.source,
            confidence: payload.confidence,
            reason: payload.reason,
            playerFacingLine: payload.playerFacingLine,
            noopCode: payload.noopCode,
            meta: decisionMeta
          };
      state.meta.foremanLastDecision = decision;
      persistStateAndEvents(state, buildForemanDecisionEvents(payload, decisionMeta, {
        selectedCandidate,
        nowMs
      }));
      res.json({
        ok: true,
        decision
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(403).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/founders-plot/foreman/tool/:toolName', (req, res) => {
    let state = null;
    let nowMs = 0;
    let runtime = null;
    let workerMeta = null;
    let toolName = '';
    let rawArgs = {};
    let decisionEventMeta = null;
    let featureFlags = resolveFoundersPlotFeatureFlags(req);
    try {
      toolName = String(req.params.toolName || '').trim();
      rawArgs = req.body && typeof req.body === 'object' ? req.body : {};
      if (!isToolEnabled(toolName, featureFlags)) {
        throw featureDisabledError(featureFlags, toolName);
      }
      ({ state, nowMs, runtime } = requireForemanRuntime(req, res));
      const idempotencyKey = typeof rawArgs.idempotencyKey === 'string' ? rawArgs.idempotencyKey.trim() : '';
      if (toolName !== 'et.plot.get_state' && !idempotencyKey) {
        throw Object.assign(new Error('INVALID_STATE'), { details: { reason: 'MISSING_IDEMPOTENCY_KEY', tool: toolName } });
      }
      if (toolName === 'et.plot.get_state') {
        return res.json({
          ok: true,
          data: {
            state: buildStatePayload(state, featureFlags)
          }
        });
      }
      if (FOREMAN_MUTATION_TOOL_NAMES.has(toolName)) {
        workerMeta = normalizeWorkerCommandMeta(rawArgs, runtime);
      }
      decisionEventMeta = state?.meta?.foremanLastDecision?.meta && typeof state.meta.foremanLastDecision.meta === 'object'
        ? {
            selectedCandidateId: state.meta.foremanLastDecision.meta.selectedCandidateId || null,
            llmToolName: state.meta.foremanLastDecision.meta.llmToolName || rawArgs.llmToolName || null,
            providerSafeToolName: state.meta.foremanLastDecision.meta.providerSafeToolName || null,
            canonicalToolName: state.meta.foremanLastDecision.meta.canonicalToolName || rawArgs.canonicalToolName || toolName,
            modelInvocationId: state.meta.foremanLastDecision.meta.modelInvocationId || null,
            testBrainInvocationId: state.meta.foremanLastDecision.meta.testBrainInvocationId || null,
            provider: state.meta.foremanLastDecision.meta.provider || null,
            model: state.meta.foremanLastDecision.meta.model || null,
            packHash: state.meta.foremanLastDecision.meta.packHash || null,
            skillMdHash: state.meta.foremanLastDecision.meta.skillMdHash || null,
            heartbeatMdHash: state.meta.foremanLastDecision.meta.heartbeatMdHash || null,
            toolsMdHash: state.meta.foremanLastDecision.meta.toolsMdHash || null,
            goalsMdHash: state.meta.foremanLastDecision.meta.goalsMdHash || null,
            safetyMdHash: state.meta.foremanLastDecision.meta.safetyMdHash || null
          }
        : {
            selectedCandidateId: safeString(rawArgs.selectedCandidateId) || null,
            llmToolName: safeString(rawArgs.llmToolName) || null,
            canonicalToolName: safeString(rawArgs.canonicalToolName) || toolName
          };

      const argsHash = hashJson({ toolName, args: rawArgs, runtimeId: runtime.runtimeId });
      const previous = getIdempotency(state.plot.plotId, idempotencyKey);
      if (previous) {
        if (previous.argsSha !== argsHash) {
          throw Object.assign(new Error('IDEMPOTENCY_CONFLICT'), { details: { idempotencyKey, tool: toolName } });
        }
        return res.json(previous.response);
      }

      const eventBuffer = [];
      if (workerMeta) {
        eventBuffer.push({
          ...buildWorkerCommandEvent(EVENT_TYPES.FOREMAN_WORKER_COMMAND_STARTED, workerMeta, {
            toolName,
            buildingId: rawArgs.buildingId,
            extraData: decisionEventMeta
          }),
          createdAt: nowMs
        });
      }
      const mutationHelpers = {
        nowMs,
        actorMeta: {
          runtimeId: runtime.runtimeId,
          foremanSessionId: runtime.sessionId,
          tokenScope: ['founders_plot:tool'],
          ...(workerMeta || {}),
          ...(decisionEventMeta || {})
        },
        appendEvent: (event) => eventBuffer.push({
          ...event,
          createdAt: event.createdAt || nowMs
        })
      };
      let result = null;
      if (toolName === 'et.plot.collect_outputs') {
        result = applyCollectOutputs(state, {
          actor: 'AGENT',
          buildingId: String(rawArgs.buildingId || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.queue_job') {
        result = applyQueueJob(state, {
          actor: 'AGENT',
          buildingId: String(rawArgs.buildingId || '').trim()
        }, mutationHelpers);
      } else if (toolName === 'et.plot.place_building') {
        result = applyPlaceBuilding(state, {
          actor: 'AGENT',
          type: String(rawArgs.type || '').trim(),
          x: Number(rawArgs.x),
          y: Number(rawArgs.y),
          approvalId: typeof rawArgs.approvalId === 'string' ? rawArgs.approvalId.trim() : null
        }, mutationHelpers);
      } else if (toolName === 'et.plot.upgrade_building') {
        result = applyUpgradeBuilding(state, {
          actor: 'AGENT',
          buildingId: typeof rawArgs.buildingId === 'string' ? rawArgs.buildingId.trim() : null,
          approvalId: typeof rawArgs.approvalId === 'string' ? rawArgs.approvalId.trim() : null
        }, mutationHelpers);
      } else {
        throw Object.assign(new Error('INVALID_STATE'), { details: { tool: toolName } });
      }

      if (workerMeta) {
        state.meta.foremanWorker.lastWorkerCommandId = workerMeta.workerCommandId;
        state.meta.foremanWorker.lastWorkerTraceId = workerMeta.workerTraceId;
        eventBuffer.push({
          ...buildWorkerCommandEvent(EVENT_TYPES.FOREMAN_WORKER_COMMAND_COMPLETED, workerMeta, {
            toolName,
            buildingId: rawArgs.buildingId,
            extraData: decisionEventMeta
          }),
          createdAt: nowMs
        });
      }

      const lastSeq = listRecentEvents(state.plot.plotId, 1)[0]?.seq || 0;
      const action = toolName === 'et.plot.collect_outputs' ? 'collect_ready_outputs' : toolName;
      const doctrineUsed = foremanDoctrineView(state);
      const receipt = {
        receiptId: `rcpt_${crypto.randomBytes(6).toString('hex')}`,
        action,
        result: 'completed',
        reason: String(
          state.meta.foremanLastDecision?.playerFacingLine
          || state.meta.foremanLastDecision?.reason
          || state.meta.foremanLastDecision?.planCard?.reason
          || 'Executed the safest useful action.'
        ),
        authorityUsed: 'Foreman runtime token (server-authenticated)',
        standingOrderUsed: buildStatePayload(state, featureFlags).foreman?.standingOrder || '',
        doctrineUsed: doctrineUsed.activeRules.length > 0
          ? {
            activeRules: doctrineUsed.activeRules,
            summary: doctrineUsed.summary
          }
          : null,
        correctionOptions: ['ASK_ME_NEXT_TIME', 'PAUSE_FOREMAN'],
        createdAt: nowMs,
        eventId: lastSeq + eventBuffer.length + 1
      };
      state.meta.foremanReceipts = [receipt, ...(state.meta.foremanReceipts || [])].slice(0, 12);
      state.meta.foremanLastReceiptId = receipt.receiptId;
      state.meta.scheduler.collectReadyOutputs.runCount += action === 'collect_ready_outputs' ? 1 : 0;
      state.meta.scheduler.collectReadyOutputs.nextRunAtMs = nowMs + 15_000;
      state.meta.scheduler.collectReadyOutputs.lease = {
        runtimeId: '',
        claimedAtMs: 0,
        expiresAtMs: 0
      };
      eventBuffer.push({
        type: EVENT_TYPES.FOREMAN_RECEIPT_CREATED,
        actor: 'SYSTEM',
        explanation: `Foreman receipt created for ${action}.`,
        recapLine: receipt.reason,
        data: {
          receipt
        },
        createdAt: nowMs
      });
      const payload = {
        ok: true,
        result: {
          mutationApplied: true
        },
        receipt,
        state: buildStatePayload(state, featureFlags)
      };
      saveIdempotency(state.plot.plotId, idempotencyKey, {
        tool: toolName,
        argsSha: argsHash,
        response: payload,
        createdAt: nowMs
      });
      const insertedEvents = persistStateAndEvents(state, eventBuffer);
      const receiptEvent = insertedEvents.find((event) => event.type === EVENT_TYPES.FOREMAN_RECEIPT_CREATED) || null;
      if (receiptEvent && state.meta.foremanReceipts[0]) {
        state.meta.foremanReceipts[0].eventId = receiptEvent.seq;
        payload.receipt.eventId = receiptEvent.seq;
        payload.state = buildStatePayload(state, featureFlags);
        savePlotGraph(state);
      }
      res.json(payload);
    } catch (error) {
      if (state && workerMeta) {
        state.meta.foremanWorker.lastWorkerCommandId = workerMeta.workerCommandId;
        state.meta.foremanWorker.lastWorkerTraceId = workerMeta.workerTraceId;
        persistStateAndEvents(state, [
          {
            ...buildWorkerCommandEvent(EVENT_TYPES.FOREMAN_WORKER_COMMAND_FAILED, workerMeta, {
              toolName,
              buildingId: rawArgs.buildingId,
              error: normalizeToolError(error),
              extraData: decisionEventMeta
            }),
            createdAt: nowMs || Date.now()
          },
          {
            type: EVENT_TYPES.FOREMAN_ACTION_REJECTED,
            actor: 'AGENT',
            explanation: 'Clover suggested a move, but the server rejected it.',
            recapLine: '',
            data: {
              ...(decisionEventMeta || {}),
              error: normalizeToolError(error)
            },
            createdAt: nowMs || Date.now()
          }
        ]);
      }
      const normalized = normalizeToolError(error);
      const status = normalized.code === 'FOREMAN_RUNTIME_REQUIRED'
        || normalized.code === 'STALE_RUNTIME'
        || normalized.code === 'BRAIN_REQUIRED'
        || normalized.code === 'FOREMAN_WORKER_ORIGIN_REQUIRED'
        || normalized.code === 'FOREMAN_WORKER_RUNTIME_MISMATCH'
        ? 403
        : normalized.code === 'FEATURE_DISABLED'
          ? 403
        : normalized.code === 'IDEMPOTENCY_CONFLICT'
          ? 409
          : 400;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/founders-plot/foreman/receipt/correction', (req, res) => {
    try {
      const { state, nowMs } = withState(req, res);
      const raw = req.body && typeof req.body === 'object' ? req.body : {};
      const result = applyReceiptCorrection(state, {
        correction: String(raw.correction || '').trim()
      }, { nowMs });
      const correction = String(raw.correction || '').trim().toUpperCase();
      const events = [];
      if (correction === 'ASK_ME_NEXT_TIME') {
        events.push({
          type: EVENT_TYPES.SCHEDULER_PAUSED,
          actor: 'HUMAN',
          explanation: 'The player asked the Foreman to ask next time before repeating this automation.',
          recapLine: 'Foreman auto-collect was told to ask next time.',
          data: {
            correction,
            scheduler: schedulerStatusView(state)
          },
          createdAt: nowMs
        });
      } else if (correction === 'PAUSE_FOREMAN') {
        events.push({
          type: EVENT_TYPES.FOREMAN_SESSION_PAUSED,
          actor: 'HUMAN',
          explanation: 'The player paused the Foreman from the latest receipt controls.',
          recapLine: 'Foreman paused from the latest receipt.',
          data: {
            correction,
            runtime: foremanRuntimeStatus(state)
          },
          createdAt: nowMs
        });
      }
      persistStateAndEvents(state, events);
      res.json({
        ok: true,
        result,
        state: buildStatePayload(state, featureFlags)
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(400).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/founders-plot/foreman/preference', (req, res) => {
    try {
      const { state, nowMs, featureFlags } = withState(req, res);
      const raw = req.body && typeof req.body === 'object' ? req.body : {};
      const preferenceEvents = [];
      const result = applyForemanPreference(state, {
        correction: String(raw.correction || '').trim(),
        note: String(raw.note || '').trim()
      }, {
        nowMs,
        appendEvent: (event) => preferenceEvents.push({
          ...event,
          createdAt: event.createdAt || nowMs
        })
      });
      persistStateAndEvents(state, [
        ...preferenceEvents,
        {
          type: EVENT_TYPES.FOREMAN_PREFERENCE_RECORDED,
          actor: 'HUMAN',
          explanation: `The player taught Clover: ${result.label}.`,
          recapLine: `Clover learned: ${result.label}.`,
          data: {
            correction: result.correction,
            teachingPreferences: result.teachingPreferences,
            contractRecommendation: result.contractRecommendation
          },
          createdAt: nowMs
        }
      ]);
      res.json({
        ok: true,
        result,
        state: buildStatePayload(state, featureFlags)
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(400).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/founders-plot/foreman/doctrine', (req, res) => {
    try {
      const { state, nowMs, featureFlags } = withState(req, res);
      if (!isFeatureEnabled(featureFlags, 'FEATURE_FOUNDERS_V21_DOCTRINE_LITE')) {
        throw featureDisabledError(featureFlags, 'et.foreman.doctrine.set_rule');
      }
      const raw = req.body && typeof req.body === 'object' ? req.body : {};
      const events = [];
      const result = applySetForemanDoctrineRule(state, {
        ruleId: String(raw.ruleId || '').trim(),
        enabled: raw.enabled !== false,
        source: 'player'
      }, {
        nowMs,
        appendEvent: (event) => events.push({
          ...event,
          createdAt: event.createdAt || nowMs
        })
      });
      persistStateAndEvents(state, events);
      res.json({
        ok: true,
        result,
        state: buildStatePayload(state, featureFlags)
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'FEATURE_DISABLED' ? 403 : 400).json({ ok: false, error: normalized });
    }
  });

  router.get('/api/founders-plot/public', (_req, res) => {
    const summaries = listPlots(20).map((state) => summarizePublic(state));
    res.json({
      ok: true,
      plots: summaries
    });
  });

  router.get('/api/founders-plot/public/:plotId', (req, res) => {
    const state = loadPlotGraphById(String(req.params.plotId || '').trim());
    if (!state) {
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }
    return res.json({
      ok: true,
      plot: summarizePublic(state)
    });
  });

  router.get('/api/founders-plot/public/operating-style-card/:plotId', (req, res) => {
    const featureFlags = resolveFoundersPlotFeatureFlags(req);
    if (!isFeatureEnabled(featureFlags, 'FEATURE_FOUNDERS_V40_OPERATING_STYLE_SHARING')) {
      return res.status(403).json({ ok: false, error: { code: 'FEATURE_DISABLED', details: { featureFlags } } });
    }
    const state = loadPlotGraphById(String(req.params.plotId || '').trim());
    if (!state) {
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }
    return res.json({
      ok: true,
      card: buildOperatingStyleCard(state, { nowMs: Date.now() })
    });
  });

  router.post('/api/founders-plot/tool/:toolName', (req, res) => {
    executeTool(String(req.params.toolName || '').trim(), req, res);
  });

  router.get('/api/founders-plot/summary', (req, res) => {
    try {
      const { state } = withState(req, res);
      res.json({
        ok: true,
        summary: summarizePublic(state)
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'UNAUTHORIZED' ? 401 : 500).json({
        ok: false,
        error: normalized.code
      });
    }
  });

  router.get('/api/founders-plot/plot-card', (req, res) => {
    try {
      const { state, nowMs, featureFlags } = withState(req, res);
      if (!isFeatureEnabled(featureFlags, 'FEATURE_FOUNDERS_V17_TOWN_IDENTITY')) {
        throw featureDisabledError(featureFlags, 'plot-card');
      }
      res.json({
        ok: true,
        card: buildPlotCard(state, { nowMs })
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FEATURE_DISABLED' ? 403 : 500).json({
        ok: false,
        error: normalized.code
      });
    }
  });

  router.post('/api/founders-plot/postcard', (req, res) => {
    try {
      const rawArgs = req.body && typeof req.body === 'object' ? req.body : {};
      const ctx = mutationContext(req, res, 'et.plot.town.capture_postcard', rawArgs);
      if (!isFeatureEnabled(ctx.featureFlags, 'FEATURE_FOUNDERS_V17_TOWN_IDENTITY')) {
        throw featureDisabledError(ctx.featureFlags, 'postcard');
      }
      if (ctx.replayResponse) return res.json(ctx.replayResponse);
      const events = [];
      const result = applyCaptureTownPostcard(ctx.state, {
        focusObjectId: String(rawArgs.focusObjectId || 'PUBLIC_SQUARE').trim() || 'PUBLIC_SQUARE'
      }, {
        nowMs: ctx.nowMs,
        appendEvent: (event) => events.push({ ...event, createdAt: event.createdAt || ctx.nowMs })
      });
      const payload = {
        ok: true,
        postcard: result.postcard,
        postcards: result.postcards,
        state: buildStatePayload(ctx.state, ctx.featureFlags)
      };
      persistMutation(ctx.state, 'et.plot.town.capture_postcard', ctx.idempotencyKey, ctx.argsHash, payload, events);
      res.json(payload);
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'UNAUTHORIZED' ? 401 : 400).json({
        ok: false,
        error: normalized
      });
    }
  });

  router.get('/api/founders-plot/operating-style-card', (req, res) => {
    try {
      const { state, nowMs, featureFlags } = withState(req, res);
      if (!isFeatureEnabled(featureFlags, 'FEATURE_FOUNDERS_V40_OPERATING_STYLE_SHARING')) {
        throw featureDisabledError(featureFlags, 'operating-style-card');
      }
      res.json({
        ok: true,
        card: buildOperatingStyleCard(state, { nowMs })
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FEATURE_DISABLED' ? 403 : 500).json({
        ok: false,
        error: normalized.code
      });
    }
  });

  router.post('/api/founders-plot/operating-style/compare', (req, res) => {
    try {
      const { state, nowMs, featureFlags } = withState(req, res);
      if (!isFeatureEnabled(featureFlags, 'FEATURE_FOUNDERS_V40_OPERATING_STYLE_SHARING')) {
        throw featureDisabledError(featureFlags, 'operating-style');
      }
      const current = buildOperatingStyleCard(state, { nowMs });
      res.json({
        ok: true,
        current,
        comparison: compareOperatingStyleCards(current, req.body?.card || {})
      });
    } catch (error) {
      const normalized = normalizeToolError(error);
      res.status(normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FEATURE_DISABLED' ? 403 : 500).json({
        ok: false,
        error: normalized.code
      });
    }
  });

  if (process.env.NODE_ENV === 'test') {
    router.post('/__test__/founders-plot/advance', (req, res) => {
      try {
        const { state, featureFlags } = withState(req, res);
        const requestedMs = Number(req.body?.ms ?? (Number(req.body?.minutes || 0) * 60 * 1000) ?? 0);
        const advanceMs = Math.max(0, Math.min(MAX_OFFLINE_MS, Math.floor(requestedMs)));
        const targetMs = state.plot.lastSimulatedAt + advanceMs;
        const events = [];
        simulatePlot(state, targetMs, (event) => {
          events.push({
            ...event,
            createdAt: event.createdAt || targetMs
          });
        });
        const persistent = applyPersistentForemanTick(state, {
          nowMs: targetMs,
          recentEvents: listRecentEvents(state.plot.plotId, 48)
        }, {
          nowMs: targetMs,
          appendEvent: (event) => events.push({
            ...event,
            createdAt: event.createdAt || targetMs
          })
        });
        savePlotGraph(state);
        if (events.length > 0) {
          appendEvents(state.plot.plotId, events);
        }
        res.json({
          ok: true,
          advancedToMs: targetMs,
          persistent,
          state: buildStatePayload(state, featureFlags)
        });
      } catch (error) {
        const normalized = normalizeToolError(error);
        res.status(normalized.code === 'UNAUTHORIZED' ? 401 : 500).json({
          ok: false,
          error: normalized.code
        });
      }
    });

    router.post('/__test__/founders-plot/persistent-tick', (req, res) => {
      try {
        const { state, nowMs, featureFlags } = withState(req, res);
        const { result, events } = runPersistentForemanAndPersist(state, nowMs);
        res.json({
          ok: true,
          persistent: result,
          eventCount: events.length,
          state: buildStatePayload(state, featureFlags)
        });
      } catch (error) {
        const normalized = normalizeToolError(error);
        res.status(normalized.code === 'UNAUTHORIZED' ? 401 : 500).json({
          ok: false,
          error: normalized.code
        });
      }
    });

    router.post('/__test__/founders-plot/persistent-sweep', (req, res) => {
      try {
        const requestedNowMs = Number(req.body?.nowMs || 0);
        const nowMs = Number.isFinite(requestedNowMs) && requestedNowMs > 0 ? requestedNowMs : Date.now();
        const results = runPersistentForemanSweep(nowMs);
        res.json({
          ok: true,
          results,
          ranCount: results.filter((entry) => entry?.result?.ran === true).length
        });
      } catch (error) {
        const normalized = normalizeToolError(error);
        res.status(500).json({
          ok: false,
          error: normalized.code
        });
      }
    });
  }

  return router;
}

module.exports = {
  createFoundersPlotRouter
};
