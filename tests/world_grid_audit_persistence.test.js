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
    assert.deepEqual(replayAudit.idempotencyKeys, seededAudit.idempotencyKeys);
    assert.deepEqual(conflictAudit.idempotencyKeys, seededAudit.idempotencyKeys);
    assert.equal(JSON.stringify(seededAudit.entries).includes('sk-tool-matrix-secret'), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
