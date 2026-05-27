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
  reportPublicTown,
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
  issueWorldGridCsrfToken,
  requireWorldGridCsrfToken,
  worldGridCsrfRequired
} = require('./csrf');
const { runIdempotentWorldGridMutation } = require('./idempotency');
const { recordWorldGridMutationAudit } = require('./audit_log');
const { requireWorldGridMutationOrigin } = require('./mutation_origin');
const {
  preferencesForOwner,
  savePreferencesForOwner
} = require('./preferences');
const { loadWorldGridPlotPrerequisite } = require('./plot_prerequisite');
const { consumeWorldGridMutationRateLimit } = require('./rate_limit');

const WORLD_GRID_IDEMPOTENCY_KEY_RE = /^[a-z0-9][a-z0-9:_-]{5,119}$/i;

const WORLD_GRID_TOOLS = [
  {
    name: 'et.world.region.get_state',
    featureFlag: 'FEATURE_WORLD_GRID_V50_REGION',
    description: 'Read the V5.0 region-grid state without mutating town or world state.'
  },
  {
    name: 'et.world.region.explain_cell',
    featureFlag: 'FEATURE_WORLD_GRID_V50_REGION',
    description: 'Explain one region cell terrain/state tradeoff without claiming it.'
  },
  {
    name: 'et.world.territory.get_claim_options',
    featureFlag: 'FEATURE_WORLD_GRID_V51_CLAIMS',
    description: 'List adjacent V5.1 territory claim options with cost, benefit, drawback, and route preview.'
  },
  {
    name: 'et.world.territory.plan_claim',
    featureFlag: 'FEATURE_WORLD_GRID_V51_CLAIMS',
    description: 'Plan one adjacent territory claim without spending resources.'
  },
  {
    name: 'et.world.territory.complete_claim',
    featureFlag: 'FEATURE_WORLD_GRID_V51_CLAIMS',
    description: 'Complete a planned territory claim with exact resource spend.'
  },
  {
    name: 'et.world.territory.cancel_claim',
    featureFlag: 'FEATURE_WORLD_GRID_V51_CLAIMS',
    description: 'Cancel a planned territory claim before resources are spent.'
  },
  {
    name: 'et.world.public.list_neighbors',
    featureFlag: 'FEATURE_WORLD_GRID_V52_PUBLIC_PRESENCE',
    description: 'List opt-in public towns using public-safe redacted fields only.'
  },
  {
    name: 'et.world.public.summarize_neighbor',
    featureFlag: 'FEATURE_WORLD_GRID_V52_PUBLIC_PRESENCE',
    description: 'Summarize one public town without private state or mutation.'
  },
  {
    name: 'et.world.services.list',
    featureFlag: 'FEATURE_WORLD_GRID_V53_AGENT_SERVICES',
    description: 'List bounded V5.3 civic service advice prototypes with input scopes and reputation.'
  },
  {
    name: 'et.world.services.request_advice',
    featureFlag: 'FEATURE_WORLD_GRID_V53_AGENT_SERVICES',
    description: 'Request a structured recommendation from one service using redacted approved inputs.'
  },
  {
    name: 'et.world.services.accept_result',
    featureFlag: 'FEATURE_WORLD_GRID_V53_AGENT_SERVICES',
    description: 'Accept a service recommendation without mutating town or world state.'
  },
  {
    name: 'et.world.services.report_issue',
    featureFlag: 'FEATURE_WORLD_GRID_V53_AGENT_SERVICES',
    description: 'Report a service issue and update service reliability bookkeeping.'
  },
  {
    name: 'et.world.events.get_state',
    featureFlag: 'FEATURE_WORLD_GRID_V54_WORLD_EVENTS',
    description: 'Read active public works events, public progress, and this town’s personal recap.'
  },
  {
    name: 'et.world.events.preview_contribution',
    featureFlag: 'FEATURE_WORLD_GRID_V54_WORLD_EVENTS',
    description: 'Preview a capped world-event contribution before resources are spent.'
  },
  {
    name: 'et.world.events.contribute',
    featureFlag: 'FEATURE_WORLD_GRID_V54_WORLD_EVENTS',
    description: 'Contribute allowed resources to a world event with idempotent accounting.'
  },
  {
    name: 'et.world.events.claim_reward',
    featureFlag: 'FEATURE_WORLD_GRID_V54_WORLD_EVENTS',
    description: 'Claim a cosmetic/status-safe world-event reward for this account.'
  },
  {
    name: 'et.world.sandbox.get_state',
    featureFlag: 'FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS',
    description: 'Read the controlled sandbox district with redacted public presence.'
  },
  {
    name: 'et.world.sandbox.enter',
    featureFlag: 'FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS',
    description: 'Enter the sandbox as a redacted public participant.'
  },
  {
    name: 'et.world.sandbox.place_prop',
    featureFlag: 'FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS',
    description: 'Place one approved typed prop through sandbox moderation.'
  },
  {
    name: 'et.world.sandbox.agent_demo',
    featureFlag: 'FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS',
    description: 'Run one typed agent demo action in the sandbox, with moderation and rollback.'
  },
  {
    name: 'et.world.sandbox.rollback_last',
    featureFlag: 'FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS',
    description: 'Rollback this participant’s last approved sandbox action.'
  },
  {
    name: 'et.world.sandbox.leave',
    featureFlag: 'FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS',
    description: 'Leave the sandbox without mutating private town state.'
  }
];

const MUTATING_WORLD_GRID_TOOL_NAMES = new Set([
  'et.world.territory.plan_claim',
  'et.world.territory.complete_claim',
  'et.world.territory.cancel_claim',
  'et.world.services.request_advice',
  'et.world.services.accept_result',
  'et.world.services.report_issue',
  'et.world.events.contribute',
  'et.world.events.claim_reward',
  'et.world.sandbox.enter',
  'et.world.sandbox.place_prop',
  'et.world.sandbox.agent_demo',
  'et.world.sandbox.rollback_last',
  'et.world.sandbox.leave'
]);

function toolsForFlags(featureFlags = {}) {
  return WORLD_GRID_TOOLS.filter((tool) => isWorldGridFeatureEnabled(featureFlags, tool.featureFlag));
}

function normalizeError(error) {
  const code = String(error?.message || error?.code || 'INTERNAL_ERROR').trim() || 'INTERNAL_ERROR';
  return {
    code,
    message: code === 'FEATURE_DISABLED'
      ? 'The world grid prototype is hidden for this play session.'
      : code === 'UNAUTHORIZED'
        ? 'Sign in to view your territory survey.'
        : code === 'WORLD_GRID_PLOT_REQUIRED'
          ? 'Open Founders Plot before using mutating world-grid prototype tools.'
        : code,
    details: error?.details && typeof error.details === 'object' ? error.details : {}
  };
}

function statusForWorldGridError(normalized = {}) {
  const code = String(normalized?.code || '');
  if (code === 'UNAUTHORIZED') return 401;
  if (code === 'NOT_FOUND') return 404;
  if (code === 'INVALID_PUBLIC_TOWN' || code === 'INVALID_IDEMPOTENCY_KEY' || code === 'INVALID_EVENT_STATE') return 400;
  if (code === 'INVALID_SERVICE_OUTPUT') return 422;
  if ([
    'WORLD_GRID_PLOT_REQUIRED',
    'IDEMPOTENCY_CONFLICT',
    'INVALID_SERVICE_REQUEST_STATE',
    'OUT_OF_RESOURCES',
    'CONTRIBUTION_CAP_EXCEEDED',
    'INVALID_REWARD_STATE'
  ].includes(code)) return 409;
  if ([
    'FORBIDDEN',
    'FORBIDDEN_ORIGIN',
    'CSRF_REQUIRED',
    'CSRF_INVALID',
    'FEATURE_DISABLED',
    'INVALID_CLAIM_TARGET',
    'INVALID_CLAIM_STATE'
  ].includes(code)) return 403;
  if (code === 'RATE_LIMITED') return 429;
  return 500;
}

function readWorldGridIdempotencyKey(req = null) {
  return String(req?.body?.idempotencyKey || req?.get?.('x-idempotency-key') || '').trim();
}

function requireWorldGridIdempotencyKey(req = null, surface = '') {
  const idempotencyKey = readWorldGridIdempotencyKey(req);
  if (!WORLD_GRID_IDEMPOTENCY_KEY_RE.test(idempotencyKey)) {
    const error = new Error('INVALID_IDEMPOTENCY_KEY');
    error.details = {
      surface: String(surface || ''),
      rule: 'Mutating V5.1+ world-grid prototype routes require a 6-120 character idempotency key using letters, numbers, colon, underscore, or dash.'
    };
    throw error;
  }
  return idempotencyKey;
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
    const preferences = preferencesForOwner(owner, {
      selectedCellId: region.cells.find((cell) => cell.state === 'claimed')?.cellId || '',
      camera: { zoom: 'settlement', q: 0, r: 0 }
    });
    return {
      identity,
      owner,
      featureFlags,
      region,
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

  function countByString(values = []) {
    return values.reduce((out, value) => {
      const key = String(value || 'unknown');
      out[key] = (out[key] || 0) + 1;
      return out;
    }, {});
  }

  function buildWorldGridAuditSnapshot(payload = null, phase = 'before') {
    const region = payload?.region || {};
    const owner = payload?.owner || {};
    const cells = Array.isArray(region.cells) ? region.cells : [];
    const settlements = Array.isArray(region.settlements) ? region.settlements : [];
    const routes = Array.isArray(region.routes) ? region.routes : [];
    const claims = Array.isArray(payload?.territory?.claims) ? payload.territory.claims : [];
    const claimOptionsList = Array.isArray(payload?.territory?.claimOptions) ? payload.territory.claimOptions : [];
    const preferences = payload?.preferences && typeof payload.preferences === 'object' ? payload.preferences : {};
    const selectedCellId = String(preferences.selectedCellId || '');
    const camera = preferences.camera && typeof preferences.camera === 'object' ? preferences.camera : {};
    const publicTowns = listPublicTowns();
    const ownPublicTowns = publicTowns
      .filter((town) => town.accountPublicId === owner.ownerAccountId)
      .map((town) => ({
        publicTownId: String(town.publicTownId || ''),
        charmBand: String(town.publicSummary?.charmBand || ''),
        regionHint: String(town.regionHint || '')
      }))
      .sort((a, b) => a.publicTownId.localeCompare(b.publicTownId));
    const serviceRequests = listServiceRequests(owner);
    const serviceReputationBands = serviceListings().map((service) => service.reputation?.reliabilityBand);
    const eventStates = worldEventState(owner);
    const sandbox = sandboxStateFor(owner);
    const sandboxDistrict = sandbox?.district || {};
    const sandboxActions = Array.isArray(sandboxDistrict.recentActions) ? sandboxDistrict.recentActions : [];
    return {
      snapshotVersion: 'agent-town.v5.world-grid.audit-snapshot.v1',
      phase: phase === 'after' ? 'after' : 'before',
      region: {
        regionId: String(region.regionId || ''),
        cellCount: cells.length,
        cellStateCounts: countByString(cells.map((cell) => cell.state)),
        terrainCounts: countByString(cells.map((cell) => cell.terrain)),
        settlementCount: settlements.length,
        routeCount: routes.length
      },
      territory: {
        claimsEnabled: payload?.territory?.claimsEnabled === true,
        claimCount: claims.length,
        claimStatusCounts: countByString(claims.map((claim) => claim.status)),
        claimOptionCount: claimOptionsList.length,
        claims: claims.map((claim) => ({
          claimId: String(claim.claimId || ''),
          cellId: String(claim.cellId || ''),
          status: String(claim.status || ''),
          routeId: String(claim.routePreview?.routeId || claim.routeId || '')
        })).sort((a, b) => a.claimId.localeCompare(b.claimId))
      },
      preferences: {
        selectedCellId,
        camera: {
          zoom: String(camera.zoom || ''),
          q: Number.isFinite(Number(camera.q)) ? Number(camera.q) : 0,
          r: Number.isFinite(Number(camera.r)) ? Number(camera.r) : 0
        }
      },
      publicPresence: {
        optedIn: ownPublicTowns.length > 0,
        publicTownCount: ownPublicTowns.length,
        totalPublicTownCount: publicTowns.length,
        publicTownIds: ownPublicTowns.map((town) => town.publicTownId)
      },
      services: {
        requestCount: serviceRequests.length,
        requestStatusCounts: countByString(serviceRequests.map((request) => request.status)),
        requestServiceIds: Array.from(new Set(serviceRequests.map((request) => String(request.serviceId || '')))).sort(),
        reputationBandCounts: countByString(serviceReputationBands)
      },
      events: {
        eventCount: eventStates.length,
        personalContributionCount: eventStates.reduce((sum, state) => sum + Number(state.personal?.contributionCount || 0), 0),
        rewardCount: eventStates.filter((state) => state.personal?.reward).length,
        eventIds: eventStates.map((state) => String(state.event?.eventId || state.personal?.eventId || '')).filter(Boolean).sort()
      },
      sandbox: {
        participantActive: !!sandbox?.participant,
        participantStatus: String(sandbox?.participant?.status || ''),
        participantCount: Array.isArray(sandboxDistrict.participants) ? sandboxDistrict.participants.length : 0,
        cellCount: Array.isArray(sandboxDistrict.cells) ? sandboxDistrict.cells.length : 0,
        snapshotCount: Array.isArray(sandboxDistrict.snapshots) ? sandboxDistrict.snapshots.length : 0,
        recentActionCount: sandboxActions.length,
        actionKindCounts: countByString(sandboxActions.map((action) => action.kind)),
        moderationStatusCounts: countByString(sandboxActions.map((action) => action.moderationStatus))
      }
    };
  }

  function requirePlotPrerequisite(payload) {
    return loadWorldGridPlotPrerequisite(payload.identity);
  }

  function requireMutationPrerequisites(req, payload, surface) {
    requireWorldGridMutationOrigin(req);
    requirePlotPrerequisite(payload);
    requireWorldGridCsrfToken(req, payload.owner);
    return requireWorldGridIdempotencyKey(req, surface);
  }

  function requireMutationRateLimit(res, payload, surface) {
    const rateLimit = consumeWorldGridMutationRateLimit({
      owner: payload.owner,
      surface
    });
    if (!rateLimit) return;
    res.set('X-RateLimit-Limit', String(rateLimit.limit));
    res.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    res.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetAtMs / 1000)));
    if (!rateLimit.allowed) {
      res.set('Retry-After', String(rateLimit.retryAfterSeconds));
      const error = new Error('RATE_LIMITED');
      error.details = {
        surface,
        retryAfterSeconds: rateLimit.retryAfterSeconds
      };
      throw error;
    }
  }

  function sendIdempotentMutation(req, res, payload, surface, mutate) {
    const idempotencyKey = requireMutationPrerequisites(req, payload, surface);
    requireMutationRateLimit(res, payload, surface);
    const beforeSummary = buildWorldGridAuditSnapshot(payload, 'before');
    const outcome = runIdempotentWorldGridMutation({
      owner: payload.owner,
      surface,
      idempotencyKey,
      body: req.body
    }, () => mutate(idempotencyKey));
    if (!outcome.duplicate) {
      const afterSummary = buildWorldGridAuditSnapshot(buildRegionPayload(req, res), 'after');
      recordWorldGridMutationAudit({
        owner: payload.owner,
        surface,
        idempotencyKey,
        body: req.body,
        response: outcome.response,
        beforeSummary,
        afterSummary,
        createdAtMs: outcome.record?.createdAtMs
      });
    }
    if (outcome.duplicate) res.set('x-world-grid-idempotency-replay', '1');
    return res.json(outcome.response);
  }

  function sendIdempotentToolMutation(req, res, payload, toolName, mutate) {
    if (!MUTATING_WORLD_GRID_TOOL_NAMES.has(toolName)) return res.json(mutate(''));
    return sendIdempotentMutation(req, res, payload, toolName, mutate);
  }

  router.get('/api/world/tools', (req, res) => {
    try {
      const featureFlags = requireEnabled(req);
      res.json({ ok: true, featureFlags, tools: toolsForFlags(featureFlags) });
    } catch (error) {
      const normalized = normalizeError(error);
      res.status(statusForWorldGridError(normalized)).json({ ok: false, error: normalized });
    }
  });

  router.get('/api/world/mutation-token', (req, res) => {
    try {
      if (worldGridCsrfRequired()) requireWorldGridMutationOrigin(req);
      const payload = buildRegionPayload(req, res);
      const issued = issueWorldGridCsrfToken(payload.owner);
      res.json({
        ok: true,
        featureFlags: payload.featureFlags,
        csrfToken: issued.token,
        expiresAtMs: issued.expiresAtMs
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.get('/api/world/region', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      res.json({ ok: true, ...payload });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
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
      const currentPreferences = preferencesForOwner(owner, {
        selectedCellId: payload.region.cells.find((candidate) => candidate.state === 'claimed')?.cellId || '',
        camera: { zoom: 'settlement', q: 0, r: 0 }
      });
      const nextPreferences = {
        ...currentPreferences,
        selectedCellId: cell.cellId,
        camera: { zoom: 'region', q: cell.q, r: cell.r }
      };
      savePreferencesForOwner(owner, nextPreferences);
      res.json({ ok: true, featureFlags: payload.featureFlags, region: payload.region, preferences: nextPreferences, selectedCell: cell });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
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
      const currentPreferences = preferencesForOwner(owner, {
        selectedCellId: payload.region.cells.find((cell) => cell.state === 'claimed')?.cellId || '',
        camera: { zoom: 'settlement', q: 0, r: 0 }
      });
      const nextPreferences = {
        ...currentPreferences,
        camera
      };
      savePreferencesForOwner(owner, nextPreferences);
      res.json({ ok: true, featureFlags: payload.featureFlags, region: payload.region, preferences: nextPreferences });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
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
        return sendIdempotentToolMutation(req, res, payload, toolName, () => {
          const claim = planClaim(payload.region, req.body?.cellId, payload.owner, Date.now());
          return { ok: true, data: { claim } };
        });
      }
      if (toolName === 'et.world.territory.complete_claim') {
        requireClaimsEnabled(payload.featureFlags);
        return sendIdempotentToolMutation(req, res, payload, toolName, () => {
          const claim = completeClaim(payload.region, payload.identity, payload.owner, req.body?.claimId, Date.now());
          return { ok: true, data: { claim } };
        });
      }
      if (toolName === 'et.world.territory.cancel_claim') {
        requireClaimsEnabled(payload.featureFlags);
        return sendIdempotentToolMutation(req, res, payload, toolName, () => {
          const result = cancelClaim(payload.region.regionId, payload.owner, req.body?.claimId);
          return { ok: true, data: result };
        });
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
        return sendIdempotentToolMutation(req, res, payload, toolName, () => {
          return {
            ok: true,
            data: {
              request: requestServiceAdvice(payload.owner, req.body?.serviceId, req.body?.input)
            }
          };
        });
      }
      if (toolName === 'et.world.services.accept_result') {
        requireServicesEnabled(payload.featureFlags);
        return sendIdempotentToolMutation(req, res, payload, toolName, () => {
          return { ok: true, data: { request: acceptServiceResult(payload.owner, req.body?.requestId) } };
        });
      }
      if (toolName === 'et.world.services.report_issue') {
        requireServicesEnabled(payload.featureFlags);
        return sendIdempotentToolMutation(req, res, payload, toolName, () => {
          return { ok: true, data: { request: reportServiceIssue(payload.owner, req.body?.requestId, req.body?.reason) } };
        });
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
        return sendIdempotentToolMutation(req, res, payload, toolName, (idempotencyKey) => {
          return {
            ok: true,
            data: contributeToEvent(payload.identity, payload.owner, req.body?.eventId, req.body?.bundle, idempotencyKey, Date.now())
          };
        });
      }
      if (toolName === 'et.world.events.claim_reward') {
        requireEventsEnabled(payload.featureFlags);
        return sendIdempotentToolMutation(req, res, payload, toolName, () => {
          return {
            ok: true,
            data: {
              reward: claimEventReward(payload.owner, req.body?.eventId, req.body?.ownerAccountId)
            }
          };
        });
      }
      if (toolName === 'et.world.sandbox.get_state') {
        requireSandboxEnabled(payload.featureFlags);
        return res.json({ ok: true, data: sandboxStateFor(payload.owner) });
      }
      if (toolName === 'et.world.sandbox.enter') {
        requireSandboxEnabled(payload.featureFlags);
        return sendIdempotentToolMutation(req, res, payload, toolName, () => {
          return { ok: true, data: { participant: enterSandbox(payload.owner), sandbox: sandboxStateFor(payload.owner) } };
        });
      }
      if (toolName === 'et.world.sandbox.place_prop') {
        requireSandboxEnabled(payload.featureFlags);
        return sendIdempotentToolMutation(req, res, payload, toolName, () => {
          return { ok: true, data: { action: placeSandboxProp(payload.owner, req.body?.payload), sandbox: sandboxStateFor(payload.owner) } };
        });
      }
      if (toolName === 'et.world.sandbox.agent_demo') {
        requireSandboxEnabled(payload.featureFlags);
        return sendIdempotentToolMutation(req, res, payload, toolName, () => {
          return { ok: true, data: { action: sandboxAgentDemo(payload.owner, req.body?.payload), sandbox: sandboxStateFor(payload.owner) } };
        });
      }
      if (toolName === 'et.world.sandbox.rollback_last') {
        requireSandboxEnabled(payload.featureFlags);
        return sendIdempotentToolMutation(req, res, payload, toolName, () => {
          return { ok: true, data: rollbackSandboxLastAction(payload.owner) };
        });
      }
      if (toolName === 'et.world.sandbox.leave') {
        requireSandboxEnabled(payload.featureFlags);
        return sendIdempotentToolMutation(req, res, payload, toolName, () => {
          return { ok: true, data: leaveSandbox(payload.owner) };
        });
      }
      res.status(404).json({ ok: false, error: { code: 'TOOL_NOT_FOUND' } });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
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
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/territory/plan-claim', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireClaimsEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/territory/plan-claim', () => {
        const claim = planClaim(payload.region, req.body?.cellId, payload.owner, Date.now());
        return { ok: true, featureFlags: payload.featureFlags, claim };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/territory/complete-claim', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireClaimsEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/territory/complete-claim', () => {
        const claim = completeClaim(payload.region, payload.identity, payload.owner, req.body?.claimId, Date.now());
        const refreshed = buildRegionPayload(req, res);
        return { ok: true, featureFlags: payload.featureFlags, claim, region: refreshed.region, territory: refreshed.territory };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/territory/cancel-claim', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireClaimsEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/territory/cancel-claim', () => {
        const result = cancelClaim(payload.region.regionId, payload.owner, req.body?.claimId);
        return { ok: true, featureFlags: payload.featureFlags, ...result };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
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
      const status = statusForWorldGridError(normalized);
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
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/public-presence/opt-in', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requirePublicEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/public-presence/opt-in', () => {
        const town = optInPublicPresence({
          owner: payload.owner,
          region: payload.region,
          displayName: req.body?.displayName,
          townName: req.body?.townName,
          privacy: req.body?.privacy
        });
        return { ok: true, featureFlags: payload.featureFlags, town };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/public-presence/opt-out', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requirePublicEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/public-presence/opt-out', () => {
        const result = optOutPublicPresence(payload.owner);
        return { ok: true, featureFlags: payload.featureFlags, ...result };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/follow-town', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requirePublicEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/follow-town', () => {
        const result = followTown(payload.owner, req.body?.publicTownId);
        return { ok: true, featureFlags: payload.featureFlags, ...result };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/public-town/report-abuse', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requirePublicEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/public-town/report-abuse', () => {
        const report = reportPublicTown(payload.owner, req.body?.publicTownId, req.body?.reason, req.body?.note);
        return { ok: true, featureFlags: payload.featureFlags, report, mutationApplied: false };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
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
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/services/request-advice', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireServicesEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/services/request-advice', () => {
        const request = requestServiceAdvice(payload.owner, req.body?.serviceId, req.body?.input);
        return { ok: true, featureFlags: payload.featureFlags, request };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/services/accept-result', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireServicesEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/services/accept-result', () => {
        const request = acceptServiceResult(payload.owner, req.body?.requestId);
        return { ok: true, featureFlags: payload.featureFlags, request, mutationApplied: false };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/services/report-issue', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireServicesEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/services/report-issue', () => {
        const request = reportServiceIssue(payload.owner, req.body?.requestId, req.body?.reason);
        return { ok: true, featureFlags: payload.featureFlags, request };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
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
      const status = statusForWorldGridError(normalized);
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
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/events/contribute', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireEventsEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/events/contribute', (idempotencyKey) => {
        const result = contributeToEvent(payload.identity, payload.owner, req.body?.eventId, req.body?.bundle, idempotencyKey, Date.now());
        const events = worldEventState(payload.owner);
        return { ok: true, featureFlags: payload.featureFlags, ...result, events };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/events/claim-reward', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireEventsEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/events/claim-reward', () => {
        const reward = claimEventReward(payload.owner, req.body?.eventId, req.body?.ownerAccountId);
        return { ok: true, featureFlags: payload.featureFlags, reward, mutationApplied: false };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
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
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/sandbox/enter', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireSandboxEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/sandbox/enter', () => {
        const participant = enterSandbox(payload.owner);
        return { ok: true, featureFlags: payload.featureFlags, participant, sandbox: sandboxStateFor(payload.owner) };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/sandbox/place-prop', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireSandboxEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/sandbox/place-prop', () => {
        const action = placeSandboxProp(payload.owner, req.body?.payload);
        return { ok: true, featureFlags: payload.featureFlags, action, sandbox: sandboxStateFor(payload.owner) };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/sandbox/agent-demo', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireSandboxEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/sandbox/agent-demo', () => {
        const action = sandboxAgentDemo(payload.owner, req.body?.payload);
        return { ok: true, featureFlags: payload.featureFlags, action, sandbox: sandboxStateFor(payload.owner) };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/sandbox/rollback-last', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireSandboxEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/sandbox/rollback-last', () => {
        return { ok: true, featureFlags: payload.featureFlags, ...rollbackSandboxLastAction(payload.owner) };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  router.post('/api/world/sandbox/leave', (req, res) => {
    try {
      const payload = buildRegionPayload(req, res);
      requireSandboxEnabled(payload.featureFlags);
      sendIdempotentMutation(req, res, payload, '/api/world/sandbox/leave', () => {
        return { ok: true, featureFlags: payload.featureFlags, ...leaveSandbox(payload.owner) };
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const status = statusForWorldGridError(normalized);
      res.status(status).json({ ok: false, error: normalized });
    }
  });

  return router;
}

module.exports = {
  WORLD_GRID_IDEMPOTENCY_KEY_RE,
  WORLD_GRID_TOOLS,
  createWorldGridRouter
};
