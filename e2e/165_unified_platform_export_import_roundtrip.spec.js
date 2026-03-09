const { test, expect } = require('@playwright/test');

const { getTableCount, resetPortalWebState, seedPokerOperatorFixture, syncPokerMirror } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  createPlatformRun,
  createPlatformTrainerJob,
  exportPlatformSnapshot,
  importPlatformSnapshot,
  ingestPlatformTraceRecords,
  seedPlatformConfigVersion,
  seedPlatformSealedContext,
  verifyPlatformSnapshot,
} = require('./helpers/unified_platform');

function makeLeaderboardFixture({ seasonId = 'pks_export', rankings = [] } = {}) {
  return {
    schemaVersion: '2026-03-09',
    operatorVersion: '0.9.0',
    seasons: [
      {
        seasonId,
        seasonSlug: `${seasonId}-slug`,
        displayName: `Season ${seasonId}`,
        rulesVersion: 'poker-rules-v3',
        operatorVersion: '0.9.0',
        status: 'open',
        submissionOpenAt: '2026-04-01T00:00:00.000Z',
        submissionCloseAt: '2030-04-15T00:00:00.000Z',
        divisions: [
          { divisionId: `${seasonId}_div`, divisionSlug: 'standard', runnerKind: 'native' },
        ],
      },
    ],
    leaderboards: [
      {
        snapshotId: `${seasonId}_snapshot`,
        seasonId,
        rankings: rankings.length ? rankings : [
          { submissionId: 'pksub_export_01', displayName: 'ExportBot', rank: 1, rating: 42.8, games: 320, wins: 188 },
        ],
        createdAt: '2026-03-09T12:00:00.000Z',
        updatedAt: '2026-03-09T12:00:00.000Z',
      },
    ],
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M20.9: unified platform export/import reproduces counts and reports exact mismatches by table and id', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_export_roundtrip_01';
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId,
    houseId: seededHouse.houseId,
    teamId: 'team_alpha',
    status: 'active',
  });
  expect(seededConfig.ok).toBe(true);

  const run = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_alpha',
    idempotencyKey: 'export-run-001',
  });
  expect(run.status).toBe(201);
  const runId = String(run.json?.data?.runId || '');

  const ingest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId,
    idempotencyKey: 'export-ingest-001',
    records: [
      {
        ingestKey: 'export-worker:1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: {
          kind: 'navigate',
          url: 'https://example.com/export',
        },
      },
    ],
  });
  expect(ingest.status).toBe(200);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'export-trainer-001',
    payload: {
      teamId: 'team_alpha',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: [configVersionId],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(trainerJob.status).toBe(201);

  const sealedContext = await seedPlatformSealedContext(request, {
    houseId: seededHouse.houseId,
    releasePolicy: 'manual',
    status: 'active',
  });
  expect(sealedContext.status).toBe(200);

  await seedPokerOperatorFixture(request, makeLeaderboardFixture());
  const sync = await syncPokerMirror(request);
  expect(sync.resp.ok()).toBe(true);

  const exported = await exportPlatformSnapshot(request);
  expect(exported.status).toBe(200);
  const snapshot = exported.json?.snapshot;
  expect(snapshot?.schemaVersion).toBe('platform-export/v1');
  expect(Number(snapshot?.counts?.runs || 0)).toBe(1);
  expect(Number(snapshot?.counts?.trace_events || 0)).toBe(1);
  expect(Number(snapshot?.counts?.config_versions || 0)).toBe(1);
  expect(Number(snapshot?.counts?.trainer_jobs || 0)).toBe(1);
  expect(Number(snapshot?.counts?.trainer_results || 0)).toBe(1);
  expect(Number(snapshot?.counts?.sealed_contexts || 0)).toBe(1);
  expect(Object.prototype.hasOwnProperty.call(snapshot?.counts || {}, 'poker_seasons')).toBe(true);
  expect(Object.prototype.hasOwnProperty.call(snapshot?.counts || {}, 'poker_leaderboard_snapshots')).toBe(true);

  await resetPortalWebState(request);

  const imported = await importPlatformSnapshot(request, snapshot, { reset: true });
  expect(imported.status).toBe(200);

  expect(await getTableCount(request, 'config_versions')).toBe(Number(snapshot?.counts?.config_versions || 0));
  expect(await getTableCount(request, 'trainer_jobs')).toBe(Number(snapshot?.counts?.trainer_jobs || 0));
  expect(await getTableCount(request, 'trainer_results')).toBe(Number(snapshot?.counts?.trainer_results || 0));
  expect(await getTableCount(request, 'trace_events')).toBe(Number(snapshot?.counts?.trace_events || 0));
  expect(await getTableCount(request, 'sealed_contexts')).toBe(Number(snapshot?.counts?.sealed_contexts || 0));
  expect(await getTableCount(request, 'poker_seasons')).toBe(Number(snapshot?.counts?.poker_seasons || 0));
  expect(await getTableCount(request, 'poker_leaderboard_snapshots')).toBe(Number(snapshot?.counts?.poker_leaderboard_snapshots || 0));

  const verification = await verifyPlatformSnapshot(request, snapshot);
  expect(verification.status).toBe(200);
  expect(verification.json?.verification?.ok).toBe(true);

  const corruptedSnapshot = JSON.parse(JSON.stringify(snapshot));
  corruptedSnapshot.tables.config_versions[0].config_hash = 'sha256:corrupted';
  const mismatch = await verifyPlatformSnapshot(request, corruptedSnapshot);
  expect(mismatch.status).toBe(200);
  expect(mismatch.json?.verification?.ok).toBe(false);
  expect(mismatch.json?.verification?.mismatches?.[0]).toMatchObject({
    table: 'config_versions',
    id: configVersionId,
    reason: 'ROW_MISMATCH',
  });
});
