const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_grid_idempotency_restart_probe_child.js');

function runProbe(mode, sqlitePath, storePath, scenarioPath = '') {
  const args = [probePath, mode, sqlitePath, storePath];
  if (scenarioPath) args.push(scenarioPath);
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      FORCE_COLOR: '0'
    }
  });
  const lines = result.stdout.trim().split('\n').filter(Boolean);
  const parsed = JSON.parse(lines[lines.length - 1] || '{}');
  if (result.status !== 0) {
    const error = new Error(`world-grid idempotency restart probe failed: ${mode}`);
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

test('world-grid durable idempotency rows replay after separate Node process restart without remutating prototype state', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-idempotency-'));
  const sqlitePath = path.join(dir, 'world-grid-idempotency.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  try {
    const seeded = runProbe('seed', sqlitePath, storePath);
    const replayed = runProbe('replay', sqlitePath, storePath);
    const conflicted = runProbe('conflict', sqlitePath, storePath);

    assert.equal(seeded.ok, true);
    assert.equal(seeded.status, 200);
    assert.equal(seeded.replayHeader, '');
    assert.match(seeded.claimId, /^claim_/);
    assert.equal(seeded.claimCount, 1);
    assert.equal(seeded.durableCount, 1);

    assert.equal(replayed.ok, true);
    assert.equal(replayed.status, 200);
    assert.equal(replayed.replayHeader, '1');
    assert.equal(replayed.claimId, seeded.claimId);
    assert.equal(replayed.claimCount, 0);
    assert.equal(replayed.durableCount, 1);

    assert.equal(conflicted.ok, true);
    assert.equal(conflicted.status, 409);
    assert.equal(conflicted.errorCode, 'IDEMPOTENCY_CONFLICT');
    assert.equal(conflicted.claimCount, 0);
    assert.equal(conflicted.durableCount, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('world-grid durable idempotency rows replay every V5.1-V5.5 mutating route surface after restart', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-idempotency-routes-'));
  const sqlitePath = path.join(dir, 'world-grid-idempotency.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  const scenarioPath = path.join(dir, 'route-matrix.json');
  try {
    const seeded = runProbe('route-matrix-seed', sqlitePath, storePath);
    fs.writeFileSync(scenarioPath, JSON.stringify(seeded.cases, null, 2));
    const replayed = runProbe('route-matrix-replay', sqlitePath, storePath, scenarioPath);
    const conflicted = runProbe('route-matrix-conflict', sqlitePath, storePath, scenarioPath);

    assert.equal(seeded.ok, true);
    assert.equal(seeded.caseCount, 19);
    assert.equal(seeded.durableCount, seeded.caseCount);
    for (const surface of EXPECTED_ROUTE_SURFACES) {
      assert.equal(seeded.surfaces.includes(surface), true, surface);
    }
    assert.equal(
      seeded.durableRecords.every((record) => record.migrationVersion === 'world_grid_idempotency_v1'),
      true
    );
    assert.equal(
      seeded.durableRecords.every((record) => record.schemaVersion === 'agent-town.v5.world-grid.idempotency.v1'),
      true
    );

    assert.equal(replayed.ok, true);
    assert.equal(replayed.durableCount, seeded.durableCount);
    assert.equal(replayed.results.length, seeded.caseCount);
    for (const result of replayed.results) {
      assert.equal(result.status, 200, result.route);
      assert.equal(result.replayHeader, '1', result.route);
      assert.equal(result.matchesSeededResponse, true, result.route);
    }

    assert.equal(conflicted.ok, true);
    assert.equal(conflicted.durableCount, seeded.durableCount);
    assert.equal(conflicted.results.length, seeded.caseCount);
    for (const result of conflicted.results) {
      assert.equal(result.status, 409, result.route);
      assert.equal(result.errorCode, 'IDEMPOTENCY_CONFLICT', result.route);
      assert.equal(result.replayHeader, '', result.route);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('world-grid durable idempotency rows replay every V5.1-V5.5 mutating tool surface after restart', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-idempotency-tools-'));
  const sqlitePath = path.join(dir, 'world-grid-idempotency.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  const scenarioPath = path.join(dir, 'tool-matrix.json');
  try {
    const seeded = runProbe('tool-matrix-seed', sqlitePath, storePath);
    fs.writeFileSync(scenarioPath, JSON.stringify(seeded.cases, null, 2));
    const replayed = runProbe('tool-matrix-replay', sqlitePath, storePath, scenarioPath);
    const conflicted = runProbe('tool-matrix-conflict', sqlitePath, storePath, scenarioPath);

    assert.equal(seeded.ok, true);
    assert.equal(seeded.caseCount, 14);
    assert.equal(seeded.durableCount, seeded.caseCount);
    for (const surface of EXPECTED_TOOL_SURFACES) {
      assert.equal(seeded.surfaces.includes(surface), true, surface);
    }
    assert.equal(
      seeded.durableRecords.every((record) => record.migrationVersion === 'world_grid_idempotency_v1'),
      true
    );
    assert.equal(
      seeded.durableRecords.every((record) => record.schemaVersion === 'agent-town.v5.world-grid.idempotency.v1'),
      true
    );

    assert.equal(replayed.ok, true);
    assert.equal(replayed.durableCount, seeded.durableCount);
    assert.equal(replayed.results.length, seeded.caseCount);
    for (const result of replayed.results) {
      assert.equal(result.status, 200, result.toolName);
      assert.equal(result.replayHeader, '1', result.toolName);
      assert.equal(result.matchesSeededResponse, true, result.toolName);
    }

    assert.equal(conflicted.ok, true);
    assert.equal(conflicted.durableCount, seeded.durableCount);
    assert.equal(conflicted.results.length, seeded.caseCount);
    for (const result of conflicted.results) {
      assert.equal(result.status, 409, result.toolName);
      assert.equal(result.errorCode, 'IDEMPOTENCY_CONFLICT', result.toolName);
      assert.equal(result.replayHeader, '', result.toolName);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
