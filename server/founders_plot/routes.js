const express = require('express');

const engine = require('./engine');
const progressionAtlas = require('./progression_atlas');
const { FOUNDERS_PLOT_TOOL_SPECS } = require('./tools');

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function statusForErrorCode(code) {
  switch (String(code || '')) {
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN_POLICY':
      return 403;
    case 'RATE_LIMITED':
      return 429;
    case 'IDEMPOTENCY_CONFLICT':
      return 409;
    case 'SERVER_ERROR':
      return 500;
    default:
      return 400;
  }
}

function sendEnvelope(res, envelope) {
  if (!envelope || envelope.ok !== false) return res.json(envelope);
  return res.status(statusForErrorCode(envelope?.error?.code)).json(envelope);
}

function createFoundersPlotRouter({
  resolveIdentity,
  identity,
  nowMs,
  now = () => Date.now()
} = {}) {
  const router = express.Router();
  const resolveIdentityFn = typeof resolveIdentity === 'function'
    ? resolveIdentity
    : typeof identity === 'function'
      ? identity
      : null;
  const nowMsFn = typeof nowMs === 'function' ? nowMs : now;

  function identityFor(req, res) {
    const resolved = resolveIdentityFn ? resolveIdentityFn(req, res) : null;
    return resolved && typeof resolved === 'object'
      ? resolved
      : { pairId: '', houseId: null };
  }

  router.get('/api/founders-plot/tools', (_req, res) => {
    res.json({
      ok: true,
      tools: FOUNDERS_PLOT_TOOL_SPECS
    });
  });

  router.get('/api/founders-plot/state', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.getFoundersPlotState({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.query?.plotId === 'string' ? req.query.plotId.trim() : null,
      nowMs: nowMsFn(),
      includeReplay: String(req.query?.includeReplay || '').trim() === '1',
      includePublicSummary: String(req.query?.includePublicSummary || '1').trim() !== '0',
      includeAdvancedReadModels: String(req.query?.includeAdvancedReadModels || '1').trim() !== '0',
      includeVisualActors: String(req.query?.includeVisualActors || '1').trim() !== '0'
    });
    return sendEnvelope(res, envelope);
  });

  router.get('/api/founders-plot/plots', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.listOwnedPlots({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.query?.plotId === 'string' ? req.query.plotId.trim() : null,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.get('/api/founders-plot/world-grid', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.getWorldGridStatus({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.query?.plotId === 'string' ? req.query.plotId.trim() : null,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.get('/api/founders-plot/expedition-map', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.getExpeditionMapStatus({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.query?.plotId === 'string' ? req.query.plotId.trim() : null,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/expedition-map/scout-sector', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.scoutExpeditionSector({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      cellId: req.body?.cellId,
      actor: req.body?.actor,
      actorType: req.body?.actorType,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/expedition-map/move-unit', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.moveExpeditionUnit({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      unitId: req.body?.unitId,
      targetCellId: req.body?.targetCellId,
      actor: req.body?.actor,
      actorType: req.body?.actorType,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.get('/api/founders-plot/civic-proposals', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.listCivicProposalRecords({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.query?.plotId === 'string' ? req.query.plotId.trim() : null,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.get('/api/founders-plot/overlay-packs', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.listOverlayPackRecords({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.query?.plotId === 'string' ? req.query.plotId.trim() : null,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.get('/api/founders-plot/civic-projects', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.listCivicProjectRecords({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.query?.plotId === 'string' ? req.query.plotId.trim() : null,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.get('/api/founders-plot/progression-atlas', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = progressionAtlas.getProgressionAtlasState({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.query?.plotId === 'string' ? req.query.plotId.trim() : null,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/progression-atlas/strategies/draft', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = progressionAtlas.draftProgressionStrategy({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      strategyKey: req.body?.strategyKey,
      title: req.body?.title,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/progression-atlas/strategies', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = req.body?.strategy?.generatedBy === 'progression_atlas_strategy_editor_v1' || Array.isArray(req.body?.strategy?.steps)
      ? progressionAtlas.saveEditedProgressionStrategy({
        pairId: identity.pairId,
        houseId: identity.houseId || null,
        plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
        strategy: req.body?.strategy,
        select: req.body?.select === true,
        nowMs: nowMsFn()
      })
      : progressionAtlas.saveProgressionStrategy({
        pairId: identity.pairId,
        houseId: identity.houseId || null,
        plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
        strategyKey: req.body?.strategyKey || req.body?.strategy?.strategyKey,
        title: req.body?.title || req.body?.strategy?.title,
        select: req.body?.select === true,
        nowMs: nowMsFn()
      });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/progression-atlas/icons/generate', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = progressionAtlas.generateProgressionIconDraft({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      title: req.body?.title,
      prompt: req.body?.prompt,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/progression-atlas/strategies/:strategyId/select', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = progressionAtlas.selectProgressionStrategy({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      strategyId: req.params.strategyId,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/progression-atlas/explain', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = progressionAtlas.explainProgressionNode({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      nodeId: req.body?.nodeId,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/place-building', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.placeBuilding({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      type: req.body?.type,
      x: req.body?.x,
      y: req.body?.y,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/queue-job', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.queueJob({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      buildingId: req.body?.buildingId,
      kind: req.body?.kind,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/collect-outputs', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.collectOutputs({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      buildingId: req.body?.buildingId,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/draft-site-plan', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.draftSitePlan({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      reportId: req.body?.reportId,
      title: req.body?.title,
      focus: req.body?.focus,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/review-site-plan', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.reviewSitePlan({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      planId: req.body?.planId,
      reviewNote: req.body?.reviewNote,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/select-doctrine', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.selectDoctrine({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      doctrineId: req.body?.doctrineId,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/work-orders/draft', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.createWorkOrderDraft({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      templateId: req.body?.templateId,
      scope: isPlainObject(req.body?.scope) ? req.body.scope : {},
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/work-orders/execute', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.executeWorkOrder({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      workOrderId: req.body?.workOrderId,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/civic-proposals', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.createCivicProposalRecord({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      title: req.body?.title,
      category: req.body?.category,
      summary: req.body?.summary,
      status: req.body?.status,
      relatedPlotIds: Array.isArray(req.body?.relatedPlotIds) ? req.body.relatedPlotIds : [],
      reviewNote: req.body?.reviewNote,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/overlay-packs', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.createOverlayPackRecord({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      sourceProposalId: req.body?.sourceProposalId,
      title: req.body?.title,
      theme: req.body?.theme,
      summary: req.body?.summary,
      status: req.body?.status,
      targetSurfaceIds: Array.isArray(req.body?.targetSurfaceIds) ? req.body.targetSurfaceIds : [],
      targetNodeIds: Array.isArray(req.body?.targetNodeIds) ? req.body.targetNodeIds : [],
      displayHints: req.body?.displayHints && typeof req.body.displayHints === 'object' ? req.body.displayHints : {},
      prompt: req.body?.prompt,
      provenance: req.body?.provenance && typeof req.body.provenance === 'object' ? req.body.provenance : {},
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/civic-projects/activate', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.activateCivicProject({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      sourceProposalId: req.body?.sourceProposalId,
      projectType: req.body?.projectType,
      title: req.body?.title,
      summary: req.body?.summary,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/civic-projects/inspect', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.inspectCivicProject({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      projectId: req.body?.projectId,
      inspectionType: req.body?.inspectionType,
      note: req.body?.note,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/prepare-settler-convoy', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.prepareSettlerConvoy({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      sitePlanId: req.body?.sitePlanId,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/found-settlement', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.foundSettlement({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      claimId: req.body?.claimId,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/upgrade-building', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.upgradeBuilding({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      buildingId: req.body?.buildingId,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/set-priority', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.setPriority({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      buildingId: req.body?.buildingId,
      priority: req.body?.priority,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/claim-reward', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.claimReward({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      rewardId: req.body?.rewardId,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/request-approval', (req, res) => {
    const identity = identityFor(req, res);
    const params = isPlainObject(req.body?.params) ? req.body.params : {};
    const envelope = engine.createApprovalRequest({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      actionName: req.body?.action,
      requestedParams: params,
      title: req.body?.title,
      body: req.body?.body,
      actor: req.body?.actor,
      idempotencyKey: req.body?.idempotencyKey,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/policy', (req, res) => {
    const identity = identityFor(req, res);
    const input = isPlainObject(req.body) ? req.body : {};
    const envelope = engine.setFoundersPlotPolicy({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof input.plotId === 'string' ? input.plotId.trim() : null,
      input,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/approvals/:approvalId/resolve', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.resolveApproval({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      approvalId: req.params.approvalId,
      decision: req.body?.decision,
      note: req.body?.note,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.post('/api/founders-plot/recap/ack', (req, res) => {
    const identity = identityFor(req, res);
    const envelope = engine.acknowledgeRecap({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
      nowMs: nowMsFn()
    });
    return sendEnvelope(res, envelope);
  });

  router.get('/api/founders-plot/public/:plotId', (req, res) => {
    const envelope = engine.readPublicPlot({
      plotId: req.params.plotId,
      includeReplay: String(req.query?.includeReplay || '').trim() === '1'
    });
    return sendEnvelope(res, envelope);
  });

  router.get('/api/founders-plot/leaderboard', (req, res) => {
    const limit = Math.max(1, Math.min(50, Math.floor(Number(req.query?.limit || 12) || 12)));
    return res.json(engine.listPublicPlots(limit));
  });

  if (process.env.NODE_ENV === 'test') {
    router.post('/__test__/founders-plot/advance', (req, res) => {
      const identity = identityFor(req, res);
      const envelope = engine.advancePlotTimeForTests({
        pairId: identity.pairId,
        houseId: identity.houseId || null,
        plotId: typeof req.body?.plotId === 'string' ? req.body.plotId.trim() : null,
        advanceMs: Number(req.body?.advanceMs || 0),
        nowMs: nowMsFn()
      });
      return sendEnvelope(res, envelope);
    });
  }

  return router;
}

module.exports = {
  createFoundersPlotRouter,
  createRouter: createFoundersPlotRouter
};
