const fs = require('fs');
const path = require('path');

const WORLD_GRID_SERVICES_SCHEMA_VERSION = 'agent-town.v5.world-grid.services.v1';
const WORLD_GRID_SERVICES_MIGRATION_VERSION = 'world_grid_services_v1';

const SERVICE_LISTINGS = [
  {
    serviceId: 'service_route_advisor',
    providerAccountId: 'civic_service_route_office',
    agentId: 'agent_route_advisor',
    title: 'Route Advisor',
    description: 'Suggests safe route priorities from public territory summaries.',
    serviceKind: 'advice',
    allowedInputs: ['regionSummary', 'selectedCell', 'publicTownCard'],
    forbiddenInputs: ['brainSecrets', 'walletSecrets', 'providerConfig', 'privateEventLog', 'workerTraffic'],
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'rationale', 'nextStep']
    },
    reputation: {
      completedJobs: 0,
      disputeCount: 0,
      reliabilityBand: 'new'
    }
  },
  {
    serviceId: 'service_public_works_planner',
    providerAccountId: 'civic_service_public_works',
    agentId: 'agent_public_works_planner',
    title: 'Public Works Planner',
    description: 'Turns public-safe town goals into a small civic works suggestion.',
    serviceKind: 'template',
    allowedInputs: ['regionSummary', 'claimSummary', 'publicTownCard'],
    forbiddenInputs: ['brainSecrets', 'walletSecrets', 'providerConfig', 'privateEventLog', 'workerTraffic'],
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'rationale', 'nextStep']
    },
    reputation: {
      completedJobs: 0,
      disputeCount: 0,
      reliabilityBand: 'new'
    }
  },
  {
    serviceId: 'service_town_recap_narrator',
    providerAccountId: 'civic_service_recaps',
    agentId: 'agent_town_recap_narrator',
    title: 'Town Recap Narrator',
    description: 'Produces a public-safe recap draft from approved summary fields.',
    serviceKind: 'public-summary',
    allowedInputs: ['publicTownCard', 'regionSummary'],
    forbiddenInputs: ['brainSecrets', 'walletSecrets', 'providerConfig', 'privateEventLog', 'workerTraffic'],
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'rationale', 'nextStep']
    },
    reputation: {
      completedJobs: 0,
      disputeCount: 0,
      reliabilityBand: 'new'
    }
  }
];

// Prototype/ephemeral process-local stores; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const serviceRequestsByOwner = new Map();
const reputationByService = new Map();
let durableSingleton = null;
let durableSingletonPath = '';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureDurableSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_grid_service_requests (
      owner_account_id TEXT NOT NULL,
      request_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      accepted_at INTEGER,
      reported_at INTEGER,
      request_json TEXT NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      PRIMARY KEY (owner_account_id, request_id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_world_grid_service_requests_request
      ON world_grid_service_requests(request_id);
    CREATE INDEX IF NOT EXISTS idx_world_grid_service_requests_owner_status
      ON world_grid_service_requests(owner_account_id, status);
    CREATE INDEX IF NOT EXISTS idx_world_grid_service_requests_service_status
      ON world_grid_service_requests(service_id, status);

    CREATE TABLE IF NOT EXISTS world_grid_service_reputation (
      service_id TEXT PRIMARY KEY,
      completed_jobs INTEGER NOT NULL,
      dispute_count INTEGER NOT NULL,
      reliability_band TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      reputation_json TEXT NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_world_grid_service_reputation_band
      ON world_grid_service_reputation(reliability_band);
  `);
}

function parseDurableRequest(row) {
  if (!row) return null;
  return JSON.parse(row.request_json);
}

function parseDurableReputation(row) {
  if (!row) return null;
  return JSON.parse(row.reputation_json);
}

function createWorldGridServiceStore({ sqlitePath } = {}) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('WORLD_GRID_SERVICES_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(sqlitePath);
  ensureDurableSchema(db);
  const statements = {
    requestsByOwner: db.prepare(`
      SELECT *
      FROM world_grid_service_requests
      WHERE owner_account_id = ?
      ORDER BY created_at ASC, request_id ASC
    `),
    deleteOwnerRequests: db.prepare('DELETE FROM world_grid_service_requests WHERE owner_account_id = ?'),
    insertRequest: db.prepare(`
      INSERT OR REPLACE INTO world_grid_service_requests (
        owner_account_id, request_id, service_id, provider_account_id, status,
        created_at, accepted_at, reported_at, request_json, migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    reputationByService: db.prepare(`
      SELECT *
      FROM world_grid_service_reputation
      WHERE service_id = ?
      LIMIT 1
    `),
    upsertReputation: db.prepare(`
      INSERT INTO world_grid_service_reputation (
        service_id, completed_jobs, dispute_count, reliability_band, updated_at,
        reputation_json, migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(service_id) DO UPDATE SET
        completed_jobs=excluded.completed_jobs,
        dispute_count=excluded.dispute_count,
        reliability_band=excluded.reliability_band,
        updated_at=excluded.updated_at,
        reputation_json=excluded.reputation_json,
        migration_version=excluded.migration_version,
        schema_version=excluded.schema_version
    `),
    requestCount: db.prepare('SELECT COUNT(1) AS count FROM world_grid_service_requests'),
    reputationCount: db.prepare('SELECT COUNT(1) AS count FROM world_grid_service_reputation'),
    metadata: db.prepare(`
      SELECT migration_version, schema_version, COUNT(1) AS count
      FROM (
        SELECT migration_version, schema_version FROM world_grid_service_requests
        UNION ALL
        SELECT migration_version, schema_version FROM world_grid_service_reputation
      )
      GROUP BY migration_version, schema_version
      ORDER BY migration_version ASC, schema_version ASC
    `)
  };
  let closed = false;

  function requestsForOwner(ownerAccountId = '') {
    return statements.requestsByOwner.all(String(ownerAccountId || '')).map(parseDurableRequest);
  }

  function saveOwnerRequests(ownerAccountId = '', requests = []) {
    const normalizedOwner = String(ownerAccountId || '');
    db.exec('BEGIN IMMEDIATE;');
    try {
      statements.deleteOwnerRequests.run(normalizedOwner);
      for (const request of requests) {
        statements.insertRequest.run(
          normalizedOwner,
          String(request.requestId || ''),
          String(request.serviceId || ''),
          String(request.providerAccountId || ''),
          String(request.status || ''),
          Number(request.createdAtMs) || Date.now(),
          request.acceptedAtMs ? Number(request.acceptedAtMs) : null,
          request.reportedAtMs ? Number(request.reportedAtMs) : null,
          JSON.stringify(clone(request)),
          WORLD_GRID_SERVICES_MIGRATION_VERSION,
          WORLD_GRID_SERVICES_SCHEMA_VERSION
        );
      }
      db.exec('COMMIT;');
    } catch (error) {
      db.exec('ROLLBACK;');
      throw error;
    }
  }

  function getReputation(serviceId = '') {
    return parseDurableReputation(statements.reputationByService.get(String(serviceId || '')));
  }

  function saveReputation(serviceId = '', reputation = {}) {
    const next = clone(reputation);
    statements.upsertReputation.run(
      String(serviceId || ''),
      Number(next.completedJobs) || 0,
      Number(next.disputeCount) || 0,
      String(next.reliabilityBand || 'new'),
      Date.now(),
      JSON.stringify(next),
      WORLD_GRID_SERVICES_MIGRATION_VERSION,
      WORLD_GRID_SERVICES_SCHEMA_VERSION
    );
  }

  function counts() {
    return {
      requests: Number(statements.requestCount.get().count || 0),
      reputation: Number(statements.reputationCount.get().count || 0)
    };
  }

  function metadata() {
    return statements.metadata.all().map((row) => ({
      migrationVersion: row.migration_version,
      schemaVersion: row.schema_version,
      count: Number(row.count || 0)
    }));
  }

  function close() {
    if (closed) return;
    closed = true;
    db.close();
  }

  return {
    close,
    counts,
    getReputation,
    metadata,
    requestsForOwner,
    saveOwnerRequests,
    saveReputation,
    sqlitePath
  };
}

function configuredWorldGridServicesPath(env = process.env) {
  return String(env.WORLD_GRID_SERVICES_SQLITE_PATH || '').trim();
}

function getConfiguredWorldGridServiceStore(env = process.env) {
  const sqlitePath = configuredWorldGridServicesPath(env);
  if (!sqlitePath) return null;
  if (durableSingleton && durableSingletonPath === sqlitePath) return durableSingleton;
  if (durableSingleton) durableSingleton.close();
  durableSingleton = createWorldGridServiceStore({ sqlitePath });
  durableSingletonPath = sqlitePath;
  return durableSingleton;
}

function closeWorldGridServiceStore() {
  if (!durableSingleton) return;
  durableSingleton.close();
  durableSingleton = null;
  durableSingletonPath = '';
}

function normalizeText(value = '', fallback = '') {
  return String(value || fallback).trim().replace(/\s+/g, ' ').slice(0, 280);
}

function serviceListings() {
  return SERVICE_LISTINGS.map((listing) => {
    const durableStore = getConfiguredWorldGridServiceStore();
    const reputation = durableStore?.getReputation(listing.serviceId) || reputationByService.get(listing.serviceId) || listing.reputation;
    return {
      ...clone(listing),
      reputation: { ...listing.reputation, ...clone(reputation) }
    };
  });
}

function getService(serviceId = '') {
  const target = String(serviceId || '').trim();
  return serviceListings().find((service) => service.serviceId === target) || null;
}

function redactedInputs(service, rawInput = {}) {
  const input = rawInput && typeof rawInput === 'object' ? rawInput : {};
  const allowed = new Set(service.allowedInputs || []);
  const forbidden = new Set(service.forbiddenInputs || []);
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (forbidden.has(key)) continue;
    if (!allowed.has(key)) continue;
    if (value && typeof value === 'object') {
      out[key] = clone(value);
    } else {
      out[key] = normalizeText(value);
    }
  }
  return out;
}

function validateServiceOutput(output = {}) {
  const valid = output
    && typeof output === 'object'
    && typeof output.recommendation === 'string'
    && typeof output.rationale === 'string'
    && typeof output.nextStep === 'string';
  if (!valid) {
    const error = new Error('INVALID_SERVICE_OUTPUT');
    error.details = { reason: 'SCHEMA_VALIDATION_FAILED' };
    throw error;
  }
  return output;
}

function recommendationFor(service, input = {}) {
  const selected = input.selectedCell?.terrain || input.claimSummary?.terrain || 'nearby territory';
  if (service.serviceId === 'service_route_advisor') {
    return validateServiceOutput({
      recommendation: `Prioritize a simple route check around ${selected}.`,
      rationale: 'The service received only public-safe region and cell summary data.',
      nextStep: 'Review the suggestion and apply any actual route work through normal world tools later.'
    });
  }
  if (service.serviceId === 'service_public_works_planner') {
    return validateServiceOutput({
      recommendation: `Draft a small public works plan around ${selected}.`,
      rationale: 'The suggestion is a template only and cannot spend resources or mutate the town.',
      nextStep: 'Keep it as a plan until a future explicit public-works tool applies it.'
    });
  }
  return validateServiceOutput({
    recommendation: 'Draft a short public-safe town recap.',
    rationale: 'The recap is based on approved public card and region fields only.',
    nextStep: 'Review before sharing it anywhere public.'
  });
}

function ownerRequests(owner) {
  const durableStore = getConfiguredWorldGridServiceStore();
  if (durableStore) return durableStore.requestsForOwner(owner.ownerAccountId).map((request) => clone(request));
  return serviceRequestsByOwner.get(owner.ownerAccountId) || [];
}

function saveOwnerRequests(owner, requests) {
  const durableStore = getConfiguredWorldGridServiceStore();
  if (durableStore) {
    durableStore.saveOwnerRequests(owner.ownerAccountId, requests);
    return;
  }
  serviceRequestsByOwner.set(owner.ownerAccountId, requests.map((request) => clone(request)));
}

function requestAdvice(owner, serviceId = '', rawInput = {}) {
  const service = getService(serviceId);
  if (!service) {
    const error = new Error('NOT_FOUND');
    error.details = { serviceId };
    throw error;
  }
  const input = redactedInputs(service, rawInput);
  const output = recommendationFor(service, input);
  const requests = ownerRequests(owner);
  const request = {
    requestId: `svc_req_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    serviceId: service.serviceId,
    providerAccountId: service.providerAccountId,
    requesterAccountId: owner.ownerAccountId,
    status: 'recommended',
    input,
    output,
    createdAtMs: Date.now(),
    acceptedAtMs: null,
    reportedAtMs: null
  };
  saveOwnerRequests(owner, [...requests, request]);
  return clone(request);
}

function findRequest(owner, requestId = '') {
  const target = String(requestId || '').trim();
  const requests = ownerRequests(owner);
  const index = requests.findIndex((request) => request.requestId === target);
  return { requests, index, request: index >= 0 ? requests[index] : null };
}

function updateReputation(serviceId = '', patch = {}) {
  const service = getService(serviceId);
  if (!service) return null;
  const durableStore = getConfiguredWorldGridServiceStore();
  const current = durableStore?.getReputation(serviceId) || reputationByService.get(serviceId) || service.reputation;
  const next = {
    completedJobs: current.completedJobs + (patch.completedJobs || 0),
    disputeCount: current.disputeCount + (patch.disputeCount || 0),
    reliabilityBand: 'new'
  };
  if (next.completedJobs >= 3 && next.disputeCount === 0) next.reliabilityBand = 'trusted';
  else if (next.completedJobs >= 1) next.reliabilityBand = 'steady';
  if (durableStore) {
    durableStore.saveReputation(serviceId, next);
    return clone(next);
  }
  reputationByService.set(serviceId, next);
  return clone(next);
}

function acceptResult(owner, requestId = '') {
  const { requests, index, request } = findRequest(owner, requestId);
  if (!request) {
    const error = new Error('NOT_FOUND');
    error.details = { requestId };
    throw error;
  }
  if (request.requesterAccountId !== owner.ownerAccountId) {
    const error = new Error('FORBIDDEN');
    error.details = { reason: 'SERVICE_REQUEST_OWNER_MISMATCH' };
    throw error;
  }
  if (request.status === 'reported') {
    const error = new Error('INVALID_SERVICE_REQUEST_STATE');
    error.details = { requestId, status: request.status };
    throw error;
  }
  if (request.status === 'accepted') return clone(request);
  requests[index] = {
    ...request,
    status: 'accepted',
    acceptedAtMs: Date.now(),
    mutationApplied: false
  };
  updateReputation(request.serviceId, { completedJobs: 1 });
  saveOwnerRequests(owner, requests);
  return clone(requests[index]);
}

function reportIssue(owner, requestId = '', reason = '') {
  const { requests, index, request } = findRequest(owner, requestId);
  if (!request) {
    const error = new Error('NOT_FOUND');
    error.details = { requestId };
    throw error;
  }
  if (request.requesterAccountId !== owner.ownerAccountId) {
    const error = new Error('FORBIDDEN');
    error.details = { reason: 'SERVICE_REQUEST_OWNER_MISMATCH' };
    throw error;
  }
  if (request.status === 'reported') return clone(request);
  requests[index] = {
    ...request,
    status: 'reported',
    reportReason: normalizeText(reason, 'Issue reported'),
    reportedAtMs: Date.now()
  };
  updateReputation(request.serviceId, { disputeCount: 1 });
  saveOwnerRequests(owner, requests);
  return clone(requests[index]);
}

function listRequests(owner) {
  return ownerRequests(owner).map((request) => clone(request));
}

module.exports = {
  WORLD_GRID_SERVICES_MIGRATION_VERSION,
  WORLD_GRID_SERVICES_SCHEMA_VERSION,
  acceptResult,
  closeWorldGridServiceStore,
  configuredWorldGridServicesPath,
  createWorldGridServiceStore,
  listRequests,
  reportIssue,
  requestAdvice,
  serviceListings
};
