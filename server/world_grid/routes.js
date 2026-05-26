const express = require('express');
const { explainCell, findCell, generateRegion, normalizeOwnerIdentity } = require('./region');
const {
  applyClaimsToRegion,
  cancelClaim,
  claimOptions,
  claimsForRegion,
  completeClaim,
  planClaim
} = require('./claims');
const {
  followTown,
  getPublicTown,
  listPublicTowns,
  optInPublicPresence,
  optOutPublicPresence,
  summarizeNeighbor
} = require('./public_presence');
const {
  acceptResult: acceptServiceResult,
  listRequests: listServiceRequests,
  reportIssue: reportServiceIssue,
  requestAdvice: requestServiceAdvice,
  serviceListings
} = require('./services');
const {
  claimEventReward,
  contributeToEvent,
  previewContribution,
  worldEventState
} = require('./events');
const {
  agentDemo: sandboxAgentDemo,
  enterSandbox,
  leaveSandbox,
  placeProp: placeSandboxProp,
  rollbackLastAction: rollbackSandboxLastAction,
  stateFor: sandboxStateFor
} = require('./sandbox');
const {
  isWorldGridFeatureEnabled,
  resolveWorldGridFeatureFlags
} = require('./feature_flags');
const {
  currentGeneratedPack,
  currentPlaytestReport,
  generateAndStorePack,
  recordPlaytestReport
} = require('./generated_pack');

const WORLD_GRID_TOOLS = [
  {
    name: 'et.world.region.get_state',
    description: 'Read the V5.0 region-grid state without mutating town or world state.'
  },
  {
    name: 'et.world.region.explain_cell',
    description: 'Explain one region cell terrain/state tradeoff without claiming it.'
  },
  {
    name: 'et.world.territory.get_claim_options',
    description: 'List adjacent V5.1 territory claim options with cost, benefit, drawback, and route preview.'
  },
  {
    name: 'et.world.territory.plan_claim',
    description: 'Plan one adjacent territory claim without spending resources.'
  },
  {
    name: 'et.world.territory.complete_claim',
    description: 'Complete a planned territory claim with exact resource spend.'
  },
  {
    name: 'et.world.territory.cancel_claim',
    description: 'Cancel a planned territory claim before resources are spent.'
  },
  {
    name: 'et.world.public.list_neighbors',
    description: 'List opt-in public towns using public-safe redacted fields only.'
  },
  {
    name: 'et.world.public.summarize_neighbor',
    description: 'Summarize one public town without private state or mutation.'
  },
  {
    name: 'et.world.services.list',
    description: 'List bounded civic agent services with input scopes and reputation.'
  },
  {
    name: 'et.world.services.request_advice',
    description: 'Request a structured recommendation from one service using redacted approved inputs.'
  },
  {
    name: 'et.world.services.accept_result',
    description: 'Accept a service recommendation without mutating town or world state.'
  },
  {
    name: 'et.world.services.report_issue',
    description: 'Report a service issue and update service reliability bookkeeping.'
  },
  {
    name: 'et.world.events.get_state',
    description: 'Read active public works events, public progress, and this town’s personal recap.'
  },
  {
    name: 'et.world.events.preview_contribution',
    description: 'Preview a capped world-event contribution before resources are spent.'
  },
  {
    name: 'et.world.events.contribute',
    description: 'Contribute allowed resources to a world event with idempotent accounting.'
  },
  {
    name: 'et.world.events.claim_reward',
    description: 'Claim a cosmetic/status-safe world-event reward for this account.'
  },
  {
    name: 'et.world.sandbox.get_state',
    description: 'Read the controlled sandbox district with redacted public presence.'
  },
  {
    name: 'et.world.sandbox.enter',
    description: 'Enter the sandbox as a redacted public participant.'
  },
  {
    name: 'et.world.sandbox.place_prop',
    description: 'Place one approved typed prop through sandbox moderation.'
  },
  {
    name: 'et.world.sandbox.agent_demo',
    description: 'Run one typed agent demo action in the sandbox, with moderation and rollback.'
  },
  {
    name: 'et.world.sandbox.rollback_last',
    description: 'Rollback this participant’s last approved sandbox action.'
  },
  {
    name: 'et.world.sandbox.leave',
    description: 'Leave the sandbox without mutating private town state.'
  },
  {
    name: 'et.world.generated_pack.current',
    description: 'Read the current generated universe and style pack without exposing raw prompts or secrets.'
  },
  {
    name: 'et.world.generated_pack.generate',
    description: 'Create a validated generated universe and style pack from a player prompt while preserving canonical world rules.'
  },
  {
    name: 'et.world.generated_pack.record_playtest',
    description: 'Record a first-loop generated-pack playtest report with machine-readable metrics.'
  }
];

const cameraPreferences = new Map();

function toolsForFlags(featureFlags = {}) {
  return WORLD_GRID_TOOLS.filter((tool) => {
    if (tool.name.startsWith('et.world.territory.')) {
      return isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_V51_CLAIMS');
    }
    if (tool.name.startsWith('et.world.public.')) {
      return isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_V52_PUBLIC_PRESENCE');
    }
    if (tool.name.startsWith('et.world.services.')) {
      return isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_V53_AGENT_SERVICES');
    }
    if (tool.name.startsWith('et.world.events.')) {
      return isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_V54_WORLD_EVENTS');
    }
    if (tool.name.startsWith('et.world.sandbox.')) {
      return isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS');
    }
    if (tool.name.startsWith('et.world.generated_pack.')) {
      return isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_GENERATED_PACKS');
    }
    return true;
  });
}

function normalizeError(error) {
  const code = String(error?.message || error?.code || 'INTERNAL_ERROR').trim() || 'INTERNAL_ERROR';
  return {
    code,
    message: code === 'FEATURE_DISABLED'
      ? 'The world grid prototype is hidden for this play session.'
      : code === 'UNAUTHORIZED'
        ? 'Sign in to view your territory survey.'
        : code,
    details: error?.details && typeof error.details === 'object' ? error.details : {}
  };
}

function createWorldGridRouter({ resolveIdentity } = {}) {
  const router = express.Router();

  function resolveWorldIdentity(req, res) {
    const raw = typeof resolveIdentity === 'function' ? resolveIdentity(req, res) : null;
    const owner = normalizeOwnerIdentity(raw);
    if (!owner) {
      const error = new Error('UNAUTHORIZED');
      error.details = { reason: 'WORLD_GRID_IDENTITY_UNAVAILABLE' };
      throw error;
    }
    return raw;
  }

  function requireEnabled(req) {
    const featureFlags = resolveWorldGridFeatureFlags(req);
    if (!isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_V50_REGION')) {
      const error = new Error('FEATURE_DISABLED');
      error.details = { featureFlags };
      throw error;
    }
    return featureFlags;
  }

  function requireClaimsEnabled(featureFlags) {
    if (!isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_V51_CLAIMS')) {
      const error = new Error('FEATURE_DISABLED');
      error.details = { featureFlags, feature: 'FEATURE_WORLD_GRID_V51_CLAIMS' };
      throw error;
    }
  }

  function requirePublicEnabled(featureFlags) {
    if (!isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_V52_PUBLIC_PRESENCE')) {
      const error = new Error('FEATURE_DISABLED');
      error.details = { featureFlags, feature: 'FEATURE_WORLD_GRID_V52_PUBLIC_PRESENCE' };
      throw error;
    }
  }

  function requireServicesEnabled(featureFlags) {
    if (!isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_V53_AGENT_SERVICES')) {
      const error = new Error('FEATURE_DISABLED');
      error.details = { featureFlags, feature: 'FEATURE_WORLD_GRID_V53_AGENT_SERVICES' };
      throw error;
    }
  }

  function requireEventsEnabled(featureFlags) {
    if (!isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_V54_WORLD_EVENTS')) {
      const error = new Error('FEATURE_DISABLED');
      error.details = { featureFlags, feature: 'FEATURE_WORLD_GRID_V54_WORLD_EVENTS' };
      throw error;
    }
  }

  function requireSandboxEnabled(featureFlags) {
    if (!isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS')) {
      const error = new Error('FEATURE_DISABLED');
      error.details = { featureFlags, feature: 'FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS' };
      throw error;
    }
  }

  function requireGeneratedPacksEnabled(featureFlags) {
    if (!isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_GENERATED_PACKS')) {
      const error = new Error('FEATURE_DISABLED');
      error.details = { featureFlags, feature: 'FEATURE_WORLD_GRID_GENERATED_PACKS' };
      throw error;
    }
  }

  function buildRegionPayload(req, res) {
    const featureFlags = requireEnabled(req);
    const identity = resolveWorldIdentity(req, res);
    const baseRegion = generateRegion(identity, { nowMs: Date.now() });
    const owner = normalizeOwnerIdentity(identity);
    const requestedRegionId = String(req.query?.regionId || req.body?.regionId || '').trim();
    if (requestedRegionId && requestedRegionId !== baseRegion.regionId) {
      const error = new Error('FORBIDDEN');
      error.details = { reason: 'REGION_OWNER_MISMATCH' };
      throw error;
    }
    const claims = claimsForRegion(baseRegion.regionId);
    const region = applyClaimsToRegion(baseRegion, claims);
    const preferences = cameraPreferences.get(owner.regionId) || {
      selectedCellId: region.cells.find((cell) => cell.state === 'claimed')?.cellId || '',
      camera: { zoom: 'settlement', q: 0, r: 0 }
    };
    const generatedPacksEnabled = isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_GENERATED_PACKS');
    return {
      identity,
      owner,
      featureFlags,
      region,
      generatedPack: generatedPacksEnabled ? currentGeneratedPack(owner) : null,
      generatedPackPlaytestReport: generatedPacksEnabled ? currentPlaytestReport(owner) : null,
      territory: {
        claimsEnabled: isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_V51_CLAIMS'),
        claimOptions: isWorldGridFeatureEnabled(featureFlags, 'FEATURE_WORLD_GRID_V51_CLAIMS')
          ? claimOptions(region, claims)
          : [],
        claims
      },
      preferences
    };
  }

  router.get('/api/world/tools', (req, res) => {
    try {
      const featureFlags = requireEnabled(req);
      res.json({ ok: true, featureFlags, tools: toolsForFlags(featureFlags) });
    } catch (error) {
      const normalized = normalizeError(error);
      res.status(normalized.code === 'FEATURE_DISABLED' ? 403 : 500).json({ ok: false, error: normalized });
    }
  });

  router.get('/api/world/region', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      res.json({ ok: true, ...payload });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/region/focus-cell', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      const owner = normalizeOwnerIdentity(resolveWorldIdentity(req, res));
      const cellId = String(req.body?.cellId || '').trim();
      const cell = findCell(payload.region, cellId);
      if (!cell) {
        const error = new Error('NOT_FOUND');
        error.details = { cellId };
        throw error;
      }
      const nextPreferences = {
        ...(cameraPreferences.get(owner.regionId) || {}),
        selectedCellId: cell.cellId,
        camera: { zoom: 'region', q: cell.q, r: cell.r }
      };
      cameraPreferences.set(owner.regionId, nextPreferences);
      res.json({ ok: true, featureFlags: payload.featureFlags, region: payload.region, preferences: nextPreferences, selectedCell: cell });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' ? 404 : normalized.code === 'INVALID_SERVICE_REQUEST_STATE' ? 409 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/region/set-camera', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      const owner = normalizeOwnerIdentity(resolveWorldIdentity(req, res));
      const camera = {
        zoom: ['settlement', 'region'].includes(String(req.body?.zoom || '')) ? String(req.body.zoom) : 'region',
        q: Number.isFinite(Number(req.body?.q)) ? Number(req.body.q) : 0,
        r: Number.isFinite(Number(req.body?.r)) ? Number(req.body.r) : 0
      };
      const nextPreferences = {
        ...(cameraPreferences.get(owner.regionId) || {}),
        camera
      };
      cameraPreferences.set(owner.regionId, nextPreferences);
      res.json({ ok: true, featureFlags: payload.featureFlags, region: payload.region, preferences: nextPreferences });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/tool/:toolName', (req, res) => {
    try {
      const toolName = String(req.params.toolName || '').trim();
      const payload = buildRegionPayload(req, res);
      if (toolName === 'et.world.region.get_state') {
        return res.json({ ok: true, data: payload });
      }
      if (toolName === 'et.world.region.explain_cell') {
        return res.json({
          ok: true,
          data: explainCell(payload.region, req.body?.cellId)
        });
      }
      if (toolName === 'et.world.territory.get_claim_options') {
        requireClaimsEnabled(payload.featureFlags);
        return res.json({
          ok: true,
          data: {
            options: claimOptions(payload.region, payload.territory.claims),
            claims: payload.territory.claims
          }
        });
      }
      if (toolName === 'et.world.territory.plan_claim') {
        requireClaimsEnabled(payload.featureFlags);
        const claim = planClaim(payload.region, req.body?.cellId, payload.owner, Date.now());
        return res.json({ ok: true, data: { claim } });
      }
      if (toolName === 'et.world.territory.complete_claim') {
        requireClaimsEnabled(payload.featureFlags);
        const claim = completeClaim(payload.region, payload.identity, payload.owner, req.body?.claimId, Date.now());
        return res.json({ ok: true, data: { claim } });
      }
      if (toolName === 'et.world.territory.cancel_claim') {
        requireClaimsEnabled(payload.featureFlags);
        const result = cancelClaim(payload.region.regionId, payload.owner, req.body?.claimId);
        return res.json({ ok: true, data: result });
      }
      if (toolName === 'et.world.public.list_neighbors') {
        requirePublicEnabled(payload.featureFlags);
        return res.json({ ok: true, data: { towns: listPublicTowns() } });
      }
      if (toolName === 'et.world.public.summarize_neighbor') {
        requirePublicEnabled(payload.featureFlags);
        return res.json({ ok: true, data: summarizeNeighbor(req.body?.publicTownId) });
      }
      if (toolName === 'et.world.services.list') {
        requireServicesEnabled(payload.featureFlags);
        return res.json({ ok: true, data: { services: serviceListings(), requests: listServiceRequests(payload.owner) } });
      }
      if (toolName === 'et.world.services.request_advice') {
        requireServicesEnabled(payload.featureFlags);
        return res.json({
          ok: true,
          data: {
            request: requestServiceAdvice(payload.owner, req.body?.serviceId, req.body?.input)
          }
        });
      }
      if (toolName === 'et.world.services.accept_result') {
        requireServicesEnabled(payload.featureFlags);
        return res.json({ ok: true, data: { request: acceptServiceResult(payload.owner, req.body?.requestId) } });
      }
      if (toolName === 'et.world.services.report_issue') {
        requireServicesEnabled(payload.featureFlags);
        return res.json({ ok: true, data: { request: reportServiceIssue(payload.owner, req.body?.requestId, req.body?.reason) } });
      }
      if (toolName === 'et.world.events.get_state') {
        requireEventsEnabled(payload.featureFlags);
        return res.json({ ok: true, data: { events: worldEventState(payload.owner) } });
      }
      if (toolName === 'et.world.events.preview_contribution') {
        requireEventsEnabled(payload.featureFlags);
        return res.json({
          ok: true,
          data: {
            preview: previewContribution(payload.owner, req.body?.eventId, req.body?.bundle, Date.now())
          }
        });
      }
      if (toolName === 'et.world.events.contribute') {
        requireEventsEnabled(payload.featureFlags);
        return res.json({
          ok: true,
          data: contributeToEvent(payload.identity, payload.owner, req.body?.eventId, req.body?.bundle, req.body?.idempotencyKey, Date.now())
        });
      }
      if (toolName === 'et.world.events.claim_reward') {
        requireEventsEnabled(payload.featureFlags);
        return res.json({
          ok: true,
          data: {
            reward: claimEventReward(payload.owner, req.body?.eventId, req.body?.ownerAccountId)
          }
        });
      }
      if (toolName === 'et.world.sandbox.get_state') {
        requireSandboxEnabled(payload.featureFlags);
        return res.json({ ok: true, data: sandboxStateFor(payload.owner) });
      }
      if (toolName === 'et.world.sandbox.enter') {
        requireSandboxEnabled(payload.featureFlags);
        return res.json({ ok: true, data: { participant: enterSandbox(payload.owner), sandbox: sandboxStateFor(payload.owner) } });
      }
      if (toolName === 'et.world.sandbox.place_prop') {
        requireSandboxEnabled(payload.featureFlags);
        return res.json({ ok: true, data: { action: placeSandboxProp(payload.owner, req.body?.payload), sandbox: sandboxStateFor(payload.owner) } });
      }
      if (toolName === 'et.world.sandbox.agent_demo') {
        requireSandboxEnabled(payload.featureFlags);
        return res.json({ ok: true, data: { action: sandboxAgentDemo(payload.owner, req.body?.payload), sandbox: sandboxStateFor(payload.owner) } });
      }
      if (toolName === 'et.world.sandbox.rollback_last') {
        requireSandboxEnabled(payload.featureFlags);
        return res.json({ ok: true, data: rollbackSandboxLastAction(payload.owner) });
      }
      if (toolName === 'et.world.sandbox.leave') {
        requireSandboxEnabled(payload.featureFlags);
        return res.json({ ok: true, data: leaveSandbox(payload.owner) });
      }
      if (toolName === 'et.world.generated_pack.current') {
        requireGeneratedPacksEnabled(payload.featureFlags);
        return res.json({
          ok: true,
          data: {
            generatedPack: currentGeneratedPack(payload.owner),
            playtestReport: currentPlaytestReport(payload.owner)
          }
        });
      }
      if (toolName === 'et.world.generated_pack.generate') {
        requireGeneratedPacksEnabled(payload.featureFlags);
        return res.json({
          ok: true,
          data: {
            generatedPack: generateAndStorePack({
              owner: payload.owner,
              prompt: req.body?.prompt,
              nowMs: Date.now()
            })
          }
        });
      }
      if (toolName === 'et.world.generated_pack.record_playtest') {
        requireGeneratedPacksEnabled(payload.featureFlags);
        return res.json({
          ok: true,
          data: {
            playtestReport: recordPlaytestReport(payload.owner, req.body?.report || req.body || {})
          }
        });
      }
      res.status(404).json({ ok: false, error: { code: 'TOOL_NOT_FOUND' } });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' || normalized.code === 'NO_GENERATED_PACK' ? 404 : normalized.code === 'INVALID_SERVICE_REQUEST_STATE' || normalized.code === 'OUT_OF_RESOURCES' || normalized.code === 'CONTRIBUTION_CAP_EXCEEDED' || normalized.code === 'INVALID_REWARD_STATE' ? 409 : normalized.code === 'INVALID_IDEMPOTENCY_KEY' || normalized.code === 'INVALID_EVENT_STATE' || normalized.code === 'INVALID_PROMPT' ? 400 : normalized.code === 'GENPACK_VALIDATION_FAILED' ? 422 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.get('/api/world/generated-pack/current', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireGeneratedPacksEnabled(payload.featureFlags);
      res.json({
        ok: true,
        featureFlags: payload.featureFlags,
        generatedPack: currentGeneratedPack(payload.owner),
        playtestReport: currentPlaytestReport(payload.owner)
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/generated-pack/generate', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireGeneratedPacksEnabled(payload.featureFlags);
      const generatedPack = generateAndStorePack({
        owner: payload.owner,
        prompt: req.body?.prompt,
        nowMs: Date.now()
      });
      res.json({
        ok: true,
        featureFlags: payload.featureFlags,
        generatedPack,
        playtestReport: currentPlaytestReport(payload.owner)
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'INVALID_PROMPT' ? 400 : normalized.code === 'GENPACK_VALIDATION_FAILED' ? 422 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/generated-pack/playtest-report', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireGeneratedPacksEnabled(payload.featureFlags);
      const playtestReport = recordPlaytestReport(payload.owner, req.body || {});
      res.json({
        ok: true,
        featureFlags: payload.featureFlags,
        playtestReport
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NO_GENERATED_PACK' ? 404 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.get('/api/world/territory/claim-options', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireClaimsEnabled(payload.featureFlags);
      res.json({
        ok: true,
        featureFlags: payload.featureFlags,
        options: claimOptions(payload.region, payload.territory.claims),
        claims: payload.territory.claims
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/territory/plan-claim', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireClaimsEnabled(payload.featureFlags);
      const claim = planClaim(payload.region, req.body?.cellId, payload.owner, Date.now());
      res.json({ ok: true, featureFlags: payload.featureFlags, claim });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' ? 404 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' || normalized.code === 'INVALID_CLAIM_TARGET' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/territory/complete-claim', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireClaimsEnabled(payload.featureFlags);
      const claim = completeClaim(payload.region, payload.identity, payload.owner, req.body?.claimId, Date.now());
      const refreshed = buildRegionPayload(req, res);
      res.json({ ok: true, featureFlags: payload.featureFlags, claim, region: refreshed.region, territory: refreshed.territory });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' ? 404 : normalized.code === 'OUT_OF_RESOURCES' ? 409 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' || normalized.code === 'INVALID_CLAIM_STATE' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/territory/cancel-claim', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireClaimsEnabled(payload.featureFlags);
      const result = cancelClaim(payload.region.regionId, payload.owner, req.body?.claimId);
      res.json({ ok: true, featureFlags: payload.featureFlags, ...result });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' ? 404 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' || normalized.code === 'INVALID_CLAIM_STATE' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.get('/api/world/public-towns', (req, res) => {
    try {
      const featureFlags = requireEnabled(req);
      requirePublicEnabled(featureFlags);
      res.json({ ok: true, featureFlags, towns: listPublicTowns() });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.get('/api/world/public-town/:publicTownId', (req, res) => {
    try {
      const featureFlags = requireEnabled(req);
      requirePublicEnabled(featureFlags);
      const town = getPublicTown(req.params.publicTownId);
      if (!town) {
        const error = new Error('NOT_FOUND');
        error.details = { publicTownId: req.params.publicTownId };
        throw error;
      }
      res.json({ ok: true, featureFlags, town });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' ? 404 : normalized.code === 'INVALID_SERVICE_REQUEST_STATE' ? 409 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/public-presence/opt-in', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requirePublicEnabled(payload.featureFlags);
      const town = optInPublicPresence({
        owner: payload.owner,
        region: payload.region,
        displayName: req.body?.displayName,
        townName: req.body?.townName,
        privacy: req.body?.privacy
      });
      res.json({ ok: true, featureFlags: payload.featureFlags, town });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/public-presence/opt-out', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requirePublicEnabled(payload.featureFlags);
      const result = optOutPublicPresence(payload.owner);
      res.json({ ok: true, featureFlags: payload.featureFlags, ...result });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/follow-town', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requirePublicEnabled(payload.featureFlags);
      const result = followTown(payload.owner, req.body?.publicTownId);
      res.json({ ok: true, featureFlags: payload.featureFlags, ...result });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' ? 404 : normalized.code === 'INVALID_PUBLIC_TOWN' ? 400 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.get('/api/world/services', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireServicesEnabled(payload.featureFlags);
      res.json({
        ok: true,
        featureFlags: payload.featureFlags,
        services: serviceListings(),
        requests: listServiceRequests(payload.owner)
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/services/request-advice', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireServicesEnabled(payload.featureFlags);
      const request = requestServiceAdvice(payload.owner, req.body?.serviceId, req.body?.input);
      res.json({ ok: true, featureFlags: payload.featureFlags, request });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' ? 404 : normalized.code === 'INVALID_SERVICE_OUTPUT' ? 422 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/services/accept-result', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireServicesEnabled(payload.featureFlags);
      const request = acceptServiceResult(payload.owner, req.body?.requestId);
      res.json({ ok: true, featureFlags: payload.featureFlags, request, mutationApplied: false });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' ? 404 : normalized.code === 'INVALID_SERVICE_REQUEST_STATE' ? 409 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/services/report-issue', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireServicesEnabled(payload.featureFlags);
      const request = reportServiceIssue(payload.owner, req.body?.requestId, req.body?.reason);
      res.json({ ok: true, featureFlags: payload.featureFlags, request });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' ? 404 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.get('/api/world/events', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireEventsEnabled(payload.featureFlags);
      res.json({
        ok: true,
        featureFlags: payload.featureFlags,
        events: worldEventState(payload.owner)
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/events/preview-contribution', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireEventsEnabled(payload.featureFlags);
      const preview = previewContribution(payload.owner, req.body?.eventId, req.body?.bundle, Date.now());
      res.json({ ok: true, featureFlags: payload.featureFlags, preview });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' ? 404 : normalized.code === 'INVALID_EVENT_STATE' ? 400 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/events/contribute', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireEventsEnabled(payload.featureFlags);
      const result = contributeToEvent(payload.identity, payload.owner, req.body?.eventId, req.body?.bundle, req.body?.idempotencyKey, Date.now());
      const events = worldEventState(payload.owner);
      res.json({ ok: true, featureFlags: payload.featureFlags, ...result, events });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' ? 404 : normalized.code === 'OUT_OF_RESOURCES' || normalized.code === 'CONTRIBUTION_CAP_EXCEEDED' ? 409 : normalized.code === 'INVALID_IDEMPOTENCY_KEY' || normalized.code === 'INVALID_EVENT_STATE' ? 400 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/events/claim-reward', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireEventsEnabled(payload.featureFlags);
      const reward = claimEventReward(payload.owner, req.body?.eventId, req.body?.ownerAccountId);
      res.json({ ok: true, featureFlags: payload.featureFlags, reward, mutationApplied: false });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' ? 404 : normalized.code === 'INVALID_REWARD_STATE' ? 409 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.get('/api/world/sandbox', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireSandboxEnabled(payload.featureFlags);
      res.json({ ok: true, featureFlags: payload.featureFlags, ...sandboxStateFor(payload.owner) });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/sandbox/enter', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireSandboxEnabled(payload.featureFlags);
      const participant = enterSandbox(payload.owner);
      res.json({ ok: true, featureFlags: payload.featureFlags, participant, sandbox: sandboxStateFor(payload.owner) });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/sandbox/place-prop', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireSandboxEnabled(payload.featureFlags);
      const action = placeSandboxProp(payload.owner, req.body?.payload);
      res.json({ ok: true, featureFlags: payload.featureFlags, action, sandbox: sandboxStateFor(payload.owner) });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/sandbox/agent-demo', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireSandboxEnabled(payload.featureFlags);
      const action = sandboxAgentDemo(payload.owner, req.body?.payload);
      res.json({ ok: true, featureFlags: payload.featureFlags, action, sandbox: sandboxStateFor(payload.owner) });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/sandbox/rollback-last', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireSandboxEnabled(payload.featureFlags);
      res.json({ ok: true, featureFlags: payload.featureFlags, ...rollbackSandboxLastAction(payload.owner) });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'NOT_FOUND' ? 404 : normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/sandbox/leave', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireSandboxEnabled(payload.featureFlags);
      res.json({ ok: true, featureFlags: payload.featureFlags, ...leaveSandbox(payload.owner) });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = normalized.code === 'UNAUTHORIZED' ? 401 : normalized.code === 'FORBIDDEN' || normalized.code === 'FEATURE_DISABLED' ? 403 : 500;
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  return router;
}

module.exports = {
  WORLD_GRID_TOOLS,
  createWorldGridRouter
};
