const crypto = require('crypto');
const express = require('express');
const {
  BUILDING_RULES,
  EVENT_TYPES,
  MAX_OFFLINE_MS,
  applyClaimReward,
  applyCollectOutputs,
  applyPlaceBuilding,
  applyPolicyChange,
  applyQueueJob,
  applyRequestUserApproval,
  applyResolveApproval,
  applySetPriority,
  applyUpgradeBuilding,
  buildWorldDelta,
  createInitialPlot,
  nextQuest,
  pendingApprovalsView,
  simulatePlot,
  stateView,
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

function hashJson(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
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
  return {
    code,
    message: code,
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
      state.meta.publicHeadline = nextQuest(state).title;
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
    if (!state.meta.publicHeadline) {
      state.meta.publicHeadline = nextQuest(state).title;
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

  function buildStatePayload(state) {
    const recentEvents = listRecentEvents(state.plot.plotId, 48);
    const view = stateView(state, recentEvents);
    const recap = buildRecap(recentEvents, {
      afterSeq: state.meta.recapSeenSeq,
      limit: 8
    });
    return {
      ...view,
      recap: {
        ...view.recap,
        unseenCount: recap.unseenCount,
        lines: recap.lines,
        pendingApprovals: pendingApprovalsView(state)
      }
    };
  }

  function withState(req, res) {
    const identity = resolvePlotIdentity(req, res);
    const nowMs = Date.now();
    const state = createPlotIfMissing(identity, nowMs);
    const simulation = applySimulation(state, nowMs);
    return { identity, nowMs, state, simulation };
  }

  function mutationContext(req, res, toolName, rawArgs) {
    const { state, nowMs } = withState(req, res);
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
        replayResponse: previous.response
      };
    }
    return {
      nowMs,
      state,
      argsHash,
      idempotencyKey
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
      if (toolName === 'et.plot.get_state') {
        const { state } = withState(req, res);
        return res.json(makeToolEnvelope({
          ok: true,
          data: {
            state: buildStatePayload(state)
          },
          worldDelta: null
        }));
      }

      const rawArgs = req.body && typeof req.body === 'object' ? req.body : {};
      const actor = String(rawArgs.actor || 'HUMAN').trim().toUpperCase() === 'AGENT' ? 'AGENT' : 'HUMAN';
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
          state: buildStatePayload(ctx.state)
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
          : normalized.code === 'OUT_OF_RESOURCES' || normalized.code === 'FORBIDDEN_POLICY'
            ? 403
            : normalized.code === 'BUILD_SLOT_OCCUPIED' || normalized.code === 'JOB_ALREADY_RUNNING' || normalized.code === 'IDEMPOTENCY_CONFLICT'
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

  router.get('/api/founders-plot/tools', (_req, res) => {
    res.json({
      ok: true,
      tools: FOUNDERS_PLOT_TOOL_SPECS
    });
  });

  router.get('/api/founders-plot/state', (req, res) => {
    try {
      const { state, simulation } = withState(req, res);
      res.json({
        ok: true,
        simulation,
        state: buildStatePayload(state)
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
      const { state, nowMs } = withState(req, res);
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
        recap
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
      const { state } = withState(req, res);
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
      const replay = replayFromEvents(events);
      res.json({
        ok: true,
        replay,
        currentHash: buildStatePayload(state).stateHash
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
      const { state, nowMs } = withState(req, res);
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
        state: buildStatePayload(state)
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
      const { state, nowMs } = withState(req, res);
      const data = applyResolveApproval(state, {
        approvalId: String(req.params.approvalId || '').trim(),
        decision: String(req.body?.decision || '').trim().toLowerCase(),
        note: typeof req.body?.note === 'string' ? req.body.note : ''
      }, {
        nowMs,
        appendEvent: null
      });
      savePlotGraph(state);
      res.json({
        ok: true,
        data,
        state: buildStatePayload(state)
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

  if (process.env.NODE_ENV === 'test') {
    router.post('/__test__/founders-plot/advance', (req, res) => {
      try {
        const { state } = withState(req, res);
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
        savePlotGraph(state);
        if (events.length > 0) {
          appendEvents(state.plot.plotId, events);
        }
        res.json({
          ok: true,
          advancedToMs: targetMs,
          state: buildStatePayload(state)
        });
      } catch (error) {
        const normalized = normalizeToolError(error);
        res.status(normalized.code === 'UNAUTHORIZED' ? 401 : 500).json({
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
