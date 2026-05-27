const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createWorldGridAuditLog } = require('../server/world_grid/audit_log');
const {
  WORLD_GRID_AUDIT_GENESIS_HASH,
  assertWorldGridReplayReconstructionSafe,
  reconstructWorldGridAuditReplay,
  reconstructWorldGridAuditReplayFromLog
} = require('../server/world_grid/replay_reconstruction');

function withTempAuditLog(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-replay-'));
  const sqlitePath = path.join(dir, 'world-grid-audit.sqlite');
  const log = createWorldGridAuditLog({ sqlitePath });
  try {
    return fn(log);
  } finally {
    log.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function auditSnapshot(phase, overrides = {}) {
  return {
    snapshotVersion: 'agent-town.v5.world-grid.audit-snapshot.v1',
    phase,
    region: {
      regionId: 'region_replay_001',
      cellCount: 19,
      cellStateCounts: { open: 18, settled: 1 },
      terrainCounts: { meadow: 10, grove: 9 },
      settlementCount: 1,
      routeCount: 0
    },
    territory: {
      claimsEnabled: true,
      claimCount: 0,
      claimStatusCounts: {},
      claimOptionCount: 3,
      claims: []
    },
    preferences: {
      selectedCellId: 'cell_0_0',
      camera: { zoom: 'region', q: 0, r: 0 }
    },
    publicPresence: {
      optedIn: false,
      publicTownCount: 0,
      totalPublicTownCount: 0,
      publicTownIds: []
    },
    services: {
      requestCount: 0,
      requestStatusCounts: {},
      requestServiceIds: [],
      reputationBandCounts: {}
    },
    events: {
      eventCount: 1,
      personalContributionCount: 0,
      rewardCount: 0,
      eventIds: ['spring_cleanup']
    },
    sandbox: {
      participantActive: false,
      participantStatus: '',
      participantCount: 0,
      cellCount: 4,
      snapshotCount: 0,
      recentActionCount: 0,
      actionKindCounts: {},
      moderationStatusCounts: {}
    },
    ...overrides
  };
}

function appendAuditEntry(log, {
  idempotencyKey,
  surface,
  beforeSummary,
  afterSummary,
  response = { ok: true }
}) {
  log.append({
    owner: {
      ownerAccountId: 'acct_world_grid_replay_001',
      regionId: 'region_replay_001'
    },
    surface,
    idempotencyKey,
    body: {
      idempotencyKey,
      displayName: '<script>private-looking</script>',
      providerToken: 'should-redact'
    },
    response,
    beforeSummary,
    afterSummary,
    createdAtMs: 1_779_784_000_000
  });
}

function seedAuditLog(log) {
  appendAuditEntry(log, {
    idempotencyKey: 'replay_public_presence_001',
    surface: '/api/world/public-presence/opt-in',
    beforeSummary: auditSnapshot('before'),
    afterSummary: auditSnapshot('after', {
      publicPresence: {
        optedIn: true,
        publicTownCount: 1,
        totalPublicTownCount: 1,
        publicTownIds: ['public_town_replay_001']
      }
    }),
    response: {
      ok: true,
      publicTownId: 'public_town_replay_001'
    }
  });
  appendAuditEntry(log, {
    idempotencyKey: 'replay_sandbox_place_001',
    surface: '/api/world/sandbox/place-prop',
    beforeSummary: auditSnapshot('before', {
      sandbox: {
        participantActive: true,
        participantStatus: 'active',
        participantCount: 1,
        cellCount: 4,
        snapshotCount: 0,
        recentActionCount: 0,
        actionKindCounts: {},
        moderationStatusCounts: {}
      }
    }),
    afterSummary: auditSnapshot('after', {
      sandbox: {
        participantActive: true,
        participantStatus: 'active',
        participantCount: 1,
        cellCount: 4,
        snapshotCount: 1,
        recentActionCount: 1,
        actionKindCounts: { place_prop: 1 },
        moderationStatusCounts: { approved: 1 }
      }
    }),
    response: {
      ok: true,
      action: {
        actionId: 'sandbox_action_replay_001',
        rollbackId: 'rollback_sandbox_action_replay_001',
        moderationStatus: 'approved'
      }
    }
  });
}

test('world-grid replay reconstruction verifies audit hash chain without applying world state', () => withTempAuditLog((log) => {
  seedAuditLog(log);
  const report = reconstructWorldGridAuditReplayFromLog(log);

  assert.equal(report.entryCount, 2);
  assert.equal(report.firstSeq, 1);
  assert.equal(report.lastSeq, 2);
  assert.equal(report.chainValid, true);
  assert.equal(report.privacySafe, true);
  assert.equal(report.privateDataIncluded, false);
  assert.equal(report.snapshotComplete, true);
  assert.equal(report.aggregateSnapshotComplete, true);
  assert.equal(report.exactBeforeStateComplete, false);
  assert.equal(report.releaseReplayReady, false);
  assert.deepEqual(report.summaryCoverage, {
    beforeAfterSnapshotCount: 2,
    missingSnapshotCount: 0,
    fallbackBeforeStateCount: 0,
    exactRecordSnapshotCount: 0
  });
  assert.deepEqual(report.bySurface, {
    '/api/world/public-presence/opt-in': 1,
    '/api/world/sandbox/place-prop': 1
  });
  assert.deepEqual(report.byMigrationVersion, { world_grid_audit_v1: 2 });
  assert.equal(report.uniqueActorCount, 1);
  assert.equal(report.uniqueObjectCount, 2);
  assert.equal(report.rollbackCount, 1);
  assert.equal(report.appliesWorldState, false);
  assert.equal(report.mutatesWorldState, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.releaseReady, false);
  assert.equal(typeof report.actorAccountIds, 'undefined');
  assert.deepEqual(assertWorldGridReplayReconstructionSafe(report), { ok: true, errors: [] });
}));

test('world-grid replay reconstruction paginates audit rows deterministically', () => withTempAuditLog((log) => {
  seedAuditLog(log);
  const report = reconstructWorldGridAuditReplayFromLog(log, { pageSize: 1 });

  assert.equal(report.entryCount, 2);
  assert.equal(report.firstSeq, 1);
  assert.equal(report.lastSeq, 2);
  assert.deepEqual(assertWorldGridReplayReconstructionSafe(report), { ok: true, errors: [] });
}));

test('world-grid replay reconstruction fails closed on hash tampering and private data', () => withTempAuditLog((log) => {
  seedAuditLog(log);
  const rows = log.replay();
  const tampered = [
    rows[0],
    {
      ...rows[1],
      entryHash: WORLD_GRID_AUDIT_GENESIS_HASH,
      entry: {
        ...rows[1].entry,
        privacy: {
          redacted: false,
          privateDataIncluded: true,
          dataClasses: ['provider_token']
        }
      }
    }
  ];
  const report = reconstructWorldGridAuditReplay(tampered);
  const safety = assertWorldGridReplayReconstructionSafe(report);

  assert.equal(report.ok, false);
  assert.equal(report.chainValid, false);
  assert.equal(report.privacySafe, false);
  assert.match(report.errors.join(','), /WORLD_GRID_REPLAY_ENTRY_HASH_MISMATCH/);
  assert.match(report.errors.join(','), /WORLD_GRID_REPLAY_REDACTION_REQUIRED/);
  assert.match(report.errors.join(','), /WORLD_GRID_REPLAY_PRIVATE_DATA_FORBIDDEN/);
  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /WORLD_GRID_REPLAY_RECONSTRUCTION_CHAIN_VALID_REQUIRED/);
  assert.match(safety.errors.join(','), /WORLD_GRID_REPLAY_RECONSTRUCTION_PRIVACY_SAFE_REQUIRED/);
  assert.match(safety.errors.join(','), /WORLD_GRID_REPLAY_RECONSTRUCTION_ERRORS_PRESENT/);
}));

test('world-grid replay reconstruction fails closed when before or after snapshots are missing', () => withTempAuditLog((log) => {
  seedAuditLog(log);
  const rows = log.replay();
  const missingSummary = [
    {
      ...rows[0],
      entry: {
        ...rows[0].entry,
        beforeSummary: undefined,
        afterSummary: undefined
      }
    }
  ];
  const report = reconstructWorldGridAuditReplay(missingSummary);
  const safety = assertWorldGridReplayReconstructionSafe(report);

  assert.equal(report.ok, false);
  assert.equal(report.snapshotComplete, false);
  assert.equal(report.summaryCoverage.beforeAfterSnapshotCount, 0);
  assert.equal(report.summaryCoverage.missingSnapshotCount, 1);
  assert.match(report.errors.join(','), /WORLD_GRID_REPLAY_AUDIT_SNAPSHOT_REQUIRED/);
  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /WORLD_GRID_REPLAY_RECONSTRUCTION_SNAPSHOT_REQUIRED/);
}));

test('world-grid replay reconstruction fails closed when audit log API is missing', () => {
  const report = reconstructWorldGridAuditReplayFromLog(null);
  const safety = assertWorldGridReplayReconstructionSafe(report);

  assert.equal(report.ok, false);
  assert.match(report.errors.join(','), /WORLD_GRID_REPLAY_LOG_REQUIRED/);
  assert.equal(safety.ok, false);
});
