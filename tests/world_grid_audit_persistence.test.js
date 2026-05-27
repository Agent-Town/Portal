const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createWorldGridAuditLog } = require('../server/world_grid/audit_log');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_grid_idempotency_restart_probe_child.js');

const EXPECTED_ROUTE_SURFACES = [
  '/api/world/territory/plan-claim',
  '/api/world/territory/complete-claim',
  '/api/world/territory/cancel-claim',
  '/api/world/public-presence/opt-in',
  '/api/world/public-presence/opt-out',
  '/api/world/follow-town',
  '/api/world/public-town/report-abuse',
  '/api/world/services/request-advice',
  '/api/world/services/accept-result',
  '/api/world/services/report-issue',
  '/api/world/events/contribute',
  '/api/world/events/claim-reward',
  '/api/world/sandbox/enter',
  '/api/world/sandbox/place-prop',
  '/api/world/sandbox/agent-demo',
  '/api/world/sandbox/rollback-last',
  '/api/world/sandbox/leave'
];

const EXPECTED_TOOL_SURFACES = [
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
];

const AUDIT_STORE_SUMMARIES = {
  publicPresence: ['publicTownCount', 'totalPublicTownCount'],
  services: ['requestCount'],
  events: ['eventCount', 'personalContributionCount', 'rewardCount'],
  sandbox: ['participantCount', 'cellCount', 'snapshotCount', 'recentActionCount']
};

function runProbe(mode, idempotencyPath, storePath, auditPath, scenarioPath = '') {
  const args = [probePath, mode, idempotencyPath, storePath];
  if (scenarioPath) args.push(scenarioPath);
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      WORLD_GRID_AUDIT_SQLITE_PATH: auditPath
    }
  });
  const lines = result.stdout.trim().split('\n').filter(Boolean);
  const parsed = JSON.parse(lines[lines.length - 1] || '{}');
  if (result.status !== 0) {
    const error = new Error(`world-grid audit restart probe failed: ${mode}`);
    error.details = {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      parsed
    };
    throw error;
  }
  return parsed;
}

function auditSnapshot(auditPath) {
  const log = createWorldGridAuditLog({ sqlitePath: auditPath });
  try {
    const entries = log.replay();
    return {
      count: entries.length,
      idempotencyKeys: entries.map((row) => row.idempotencyKey).sort(),
      surfaces: Array.from(new Set(entries.map((row) => row.surface))).sort(),
      entries
    };
  } finally {
    log.close();
  }
}

function snapshotFor(row, phase) {
  return phase === 'after' ? row.entry.afterSummary.snapshot : row.entry.beforeSummary;
}

function assertStoreAuditSummaries(snapshot) {
  for (const row of snapshot.entries) {
    for (const [section, numericFields] of Object.entries(AUDIT_STORE_SUMMARIES)) {
      const before = snapshotFor(row, 'before')?.[section];
      const after = snapshotFor(row, 'after')?.[section];
      assert.equal(before && typeof before === 'object' && !Array.isArray(before), true, `${row.surface} before ${section}`);
      assert.equal(after && typeof after === 'object' && !Array.isArray(after), true, `${row.surface} after ${section}`);
      for (const field of numericFields) {
        assert.equal(Number.isFinite(before[field]), true, `${row.surface} before ${section}.${field}`);
        assert.equal(Number.isFinite(after[field]), true, `${row.surface} after ${section}.${field}`);
      }
    }
  }
}

function entryForKey(snapshot, idempotencyKey) {
  const row = snapshot.entries.find((entry) => entry.idempotencyKey === idempotencyKey);
  assert.ok(row, idempotencyKey);
  return row;
}

function assertSnapshotIncrease(snapshot, idempotencyKey, section, field) {
  const row = entryForKey(snapshot, idempotencyKey);
  const before = snapshotFor(row, 'before')?.[section]?.[field];
  const after = snapshotFor(row, 'after')?.[section]?.[field];
  assert.equal(Number.isFinite(before), true, `${idempotencyKey} before ${section}.${field}`);
  assert.equal(Number.isFinite(after), true, `${idempotencyKey} after ${section}.${field}`);
  assert.equal(after > before, true, `${idempotencyKey} expected ${section}.${field} to increase (${before} -> ${after})`);
}

function assertSnapshotDecrease(snapshot, idempotencyKey, section, field) {
  const row = entryForKey(snapshot, idempotencyKey);
  const before = snapshotFor(row, 'before')?.[section]?.[field];
  const after = snapshotFor(row, 'after')?.[section]?.[field];
  assert.equal(Number.isFinite(before), true, `${idempotencyKey} before ${section}.${field}`);
  assert.equal(Number.isFinite(after), true, `${idempotencyKey} after ${section}.${field}`);
  assert.equal(after < before, true, `${idempotencyKey} expected ${section}.${field} to decrease (${before} -> ${after})`);
}

function assertSnapshotAfterValue(snapshot, idempotencyKey, section, field, expected) {
  const row = entryForKey(snapshot, idempotencyKey);
  assert.deepEqual(snapshotFor(row, 'after')?.[section]?.[field], expected, `${idempotencyKey} after ${section}.${field}`);
}

function assertAuditSnapshot(snapshot, {
  expectedCount,
  expectedSurfaces,
  expectedCaseKeys
}) {
  assert.equal(snapshot.count, expectedCount);
  for (const surface of expectedSurfaces) {
    assert.equal(snapshot.surfaces.includes(surface), true, surface);
  }
  for (const key of expectedCaseKeys) {
    assert.equal(snapshot.idempotencyKeys.includes(key), true, key);
  }
  assert.equal(snapshot.entries.every((row) => row.entry.replayable === true), true);
  assert.equal(snapshot.entries.every((row) => row.entry.privacy.privateDataIncluded === false), true);
  assert.equal(snapshot.entries.every((row) => row.entry.migrationVersion === 'world_grid_audit_v1'), true);
  assert.equal(snapshot.entries.every((row) => row.entry.schemaVersion === 'agent-town.v5.world-grid.audit.v1'), true);
  assert.equal(snapshot.entries.every((row) => row.entry.beforeSummary.snapshotVersion === 'agent-town.v5.world-grid.audit-snapshot.v1'), true);
  assert.equal(snapshot.entries.every((row) => row.entry.beforeSummary.phase === 'before'), true);
  assert.equal(snapshot.entries.every((row) => row.entry.afterSummary.snapshot?.snapshotVersion === 'agent-town.v5.world-grid.audit-snapshot.v1'), true);
  assert.equal(snapshot.entries.every((row) => row.entry.afterSummary.snapshot?.phase === 'after'), true);
  assert.equal(snapshot.entries.every((row) => row.entry.beforeSummary.region?.regionId), true);
  assert.equal(snapshot.entries.every((row) => row.entry.afterSummary.snapshot?.region?.regionId), true);
  assert.equal(snapshot.entries.some((row) => row.entry.beforeSummary.territory?.claimOptionCount > 0), true);
  assertStoreAuditSummaries(snapshot);
}

test('world-grid durable audit rows replay every V5.1-V5.5 mutating route surface after restart without duplicate audit writes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-audit-routes-'));
  const idempotencyPath = path.join(dir, 'world-grid-idempotency.sqlite');
  const auditPath = path.join(dir, 'world-grid-audit.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  const scenarioPath = path.join(dir, 'route-matrix.json');
  try {
    const seeded = runProbe('route-matrix-seed', idempotencyPath, storePath, auditPath);
    fs.writeFileSync(scenarioPath, JSON.stringify(seeded.cases, null, 2));
    const seededAudit = auditSnapshot(auditPath);
    const replayed = runProbe('route-matrix-replay', idempotencyPath, storePath, auditPath, scenarioPath);
    const replayAudit = auditSnapshot(auditPath);
    const conflicted = runProbe('route-matrix-conflict', idempotencyPath, storePath, auditPath, scenarioPath);
    const conflictAudit = auditSnapshot(auditPath);

    assert.equal(seeded.ok, true);
    assert.equal(seeded.caseCount, 19);
    assert.equal(replayed.ok, true);
    assert.equal(conflicted.ok, true);
    assertAuditSnapshot(seededAudit, {
      expectedCount: seeded.caseCount,
      expectedSurfaces: EXPECTED_ROUTE_SURFACES,
      expectedCaseKeys: seeded.cases.map((entry) => entry.body.idempotencyKey)
    });
    assertSnapshotIncrease(seededAudit, 'route_matrix_public_opt_in_b_001', 'publicPresence', 'publicTownCount');
    assertSnapshotIncrease(seededAudit, 'route_matrix_public_opt_in_a_001', 'publicPresence', 'publicTownCount');
    assertSnapshotDecrease(seededAudit, 'route_matrix_public_opt_out_001', 'publicPresence', 'publicTownCount');
    assertSnapshotIncrease(seededAudit, 'route_matrix_service_request_001', 'services', 'requestCount');
    assertSnapshotIncrease(seededAudit, 'route_matrix_event_contribute_001', 'events', 'personalContributionCount');
    assertSnapshotIncrease(seededAudit, 'route_matrix_event_reward_001', 'events', 'rewardCount');
    assertSnapshotAfterValue(seededAudit, 'route_matrix_sandbox_enter_001', 'sandbox', 'participantActive', true);
    assertSnapshotIncrease(seededAudit, 'route_matrix_sandbox_place_001', 'sandbox', 'recentActionCount');
    assertSnapshotIncrease(seededAudit, 'route_matrix_sandbox_agent_001', 'sandbox', 'recentActionCount');
    assertSnapshotAfterValue(seededAudit, 'route_matrix_sandbox_leave_001', 'sandbox', 'participantActive', false);
    assert.deepEqual(replayAudit.idempotencyKeys, seededAudit.idempotencyKeys);
    assert.deepEqual(conflictAudit.idempotencyKeys, seededAudit.idempotencyKeys);
    assert.equal(JSON.stringify(seededAudit.entries).includes('sk-route-matrix-secret'), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('world-grid durable audit rows replay every V5.1-V5.5 mutating tool surface after restart without duplicate audit writes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-audit-tools-'));
  const idempotencyPath = path.join(dir, 'world-grid-idempotency.sqlite');
  const auditPath = path.join(dir, 'world-grid-audit.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  const scenarioPath = path.join(dir, 'tool-matrix.json');
  try {
    const seeded = runProbe('tool-matrix-seed', idempotencyPath, storePath, auditPath);
    fs.writeFileSync(scenarioPath, JSON.stringify(seeded.cases, null, 2));
    const seededAudit = auditSnapshot(auditPath);
    const replayed = runProbe('tool-matrix-replay', idempotencyPath, storePath, auditPath, scenarioPath);
    const replayAudit = auditSnapshot(auditPath);
    const conflicted = runProbe('tool-matrix-conflict', idempotencyPath, storePath, auditPath, scenarioPath);
    const conflictAudit = auditSnapshot(auditPath);

    assert.equal(seeded.ok, true);
    assert.equal(seeded.caseCount, 14);
    assert.equal(replayed.ok, true);
    assert.equal(conflicted.ok, true);
    assertAuditSnapshot(seededAudit, {
      expectedCount: seeded.caseCount,
      expectedSurfaces: EXPECTED_TOOL_SURFACES,
      expectedCaseKeys: seeded.cases.map((entry) => entry.body.idempotencyKey)
    });
    assertSnapshotIncrease(seededAudit, 'tool_matrix_service_request_001', 'services', 'requestCount');
    assertSnapshotIncrease(seededAudit, 'tool_matrix_event_contribute_001', 'events', 'personalContributionCount');
    assertSnapshotIncrease(seededAudit, 'tool_matrix_event_reward_001', 'events', 'rewardCount');
    assertSnapshotAfterValue(seededAudit, 'tool_matrix_sandbox_enter_001', 'sandbox', 'participantActive', true);
    assertSnapshotIncrease(seededAudit, 'tool_matrix_sandbox_place_001', 'sandbox', 'recentActionCount');
    assertSnapshotIncrease(seededAudit, 'tool_matrix_sandbox_agent_001', 'sandbox', 'recentActionCount');
    assertSnapshotAfterValue(seededAudit, 'tool_matrix_sandbox_leave_001', 'sandbox', 'participantActive', false);
    assert.deepEqual(replayAudit.idempotencyKeys, seededAudit.idempotencyKeys);
    assert.deepEqual(conflictAudit.idempotencyKeys, seededAudit.idempotencyKeys);
    assert.equal(JSON.stringify(seededAudit.entries).includes('sk-tool-matrix-secret'), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
