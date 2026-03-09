const { test, expect } = require('@playwright/test');
const {
  getPortalState,
  getTableCount,
  resetPortalWebState,
  seedPokerOperatorFixture,
  syncPokerMirror,
} = require('./helpers/portal_web');

function makeOperatorFixture({ schemaVersion = '2026-03-09' } = {}) {
  return {
    schemaVersion,
    operatorVersion: '0.9.0',
    seasons: [
      {
        seasonId: 'pks_01',
        seasonSlug: 'spring-2026',
        displayName: 'Spring 2026',
        rulesVersion: 'poker-rules-v3',
        operatorVersion: '0.9.0',
        status: 'open',
        submissionOpenAt: '2026-04-01T00:00:00.000Z',
        submissionCloseAt: '2030-04-15T00:00:00.000Z',
        divisions: [
          { divisionId: 'pkd_01', divisionSlug: 'standard', runnerKind: 'native' },
        ],
        latestReplayRunId: 'pkr_01',
      },
      {
        seasonId: 'pks_02',
        seasonSlug: 'summer-2026',
        displayName: 'Summer 2026',
        rulesVersion: 'poker-rules-v3',
        operatorVersion: '0.9.0',
        status: 'scheduled',
        submissionOpenAt: '2030-06-01T00:00:00.000Z',
        submissionCloseAt: '2030-06-15T00:00:00.000Z',
        divisions: [
          { divisionId: 'pkd_02', divisionSlug: 'standard', runnerKind: 'native' },
        ],
      },
    ],
    batches: [
      {
        batchId: 'pkb_01',
        seasonId: 'pks_01',
        batchKind: 'season_eval',
        submissionIds: ['pksub_fixture_01'],
        batchConfig: { seedSetVersion: 'seed-v4', gamesPerPairing: 40 },
        status: 'queued',
      },
    ],
    runs: [
      {
        runId: 'pkr_01',
        batchId: 'pkb_01',
        seasonId: 'pks_01',
        summary: {
          winnerSeat: 2,
          turns: 184,
          seed: 'seed-v4-008',
        },
      },
    ],
    replays: [
      {
        runId: 'pkr_01',
        replay: {
          replayFormat: 'poker-run-replay-v1',
          summaryJson: {
            winnerSeat: 2,
            turns: 184,
            seed: 'seed-v4-008',
          },
          eventsJsonlUri: 's3://operator/replays/pkr_01/events.jsonl',
          artifactSha256: 'sha256:7d2304dd5221af2fd5f34c5e166b0df1c373b35f00d36ab51e385e4f2cbac0a8',
          contentType: 'application/x-ndjson',
          eventsJsonl: '{"seq":1,"timestamp":"2026-03-09T12:00:00.000Z","actorSeat":1,"eventType":"deal","payload":{"cards":["Ah","Kd"]}}\n',
        },
      },
    ],
    leaderboards: [
      {
        snapshotId: 'pklb_01',
        seasonId: 'pks_01',
        rankings: [
          { submissionId: 'pksub_fixture_01', displayName: 'PortalBot', rank: 1, rating: 42.8, games: 320, wins: 188 },
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

test('M16.10: poker operator contract validates auth, schema, pagination, and mirror durability', async ({ request }) => {
  await getPortalState(request);

  await seedPokerOperatorFixture(request, makeOperatorFixture({ schemaVersion: '2099-01-01' }));
  const mismatchedSync = await syncPokerMirror(request);
  expect(mismatchedSync.resp.status()).toBe(502);
  expect(String(mismatchedSync.body?.error?.code || '')).toBe('POKER_OPERATOR_SCHEMA_MISMATCH');

  await seedPokerOperatorFixture(request, makeOperatorFixture());

  const listPage1 = await request.get('/v1/seasons?limit=1');
  expect(listPage1.ok()).toBe(true);
  const list1 = await listPage1.json();
  expect(list1.data?.items).toHaveLength(1);
  expect(list1.data?.items?.[0]?.seasonId).toBe('pks_01');
  expect(String(list1.data?.nextCursor || '')).not.toBe('');

  const listPage2 = await request.get(`/v1/seasons?limit=1&cursor=${encodeURIComponent(list1.data.nextCursor)}`);
  expect(listPage2.ok()).toBe(true);
  const list2 = await listPage2.json();
  expect(list2.data?.items).toHaveLength(1);
  expect(list2.data?.items?.[0]?.seasonId).toBe('pks_02');
  expect(list2.data?.nextCursor).toBe(null);

  const missingAuth = await request.post('/v1/seasons', {
    data: {
      seasonSlug: 'autumn-2026',
      displayName: 'Autumn 2026',
      rulesVersion: 'poker-rules-v3',
      operatorVersion: '0.9.0',
      submissionOpenAt: '2030-09-01T00:00:00.000Z',
      submissionCloseAt: '2030-09-15T00:00:00.000Z',
      divisions: [{ divisionSlug: 'standard', runnerKind: 'native' }],
    },
  });
  expect(missingAuth.status()).toBe(401);
  const missingAuthBody = await missingAuth.json();
  expect(String(missingAuthBody?.error?.code || '')).toBe('POKER_OPERATOR_AUTH_REQUIRED');

  const mirroredSync = await syncPokerMirror(request);
  expect(mirroredSync.resp.ok()).toBe(true);
  expect(mirroredSync.body?.data?.mirrored?.seasons).toBe(2);
  expect(await getTableCount(request, 'poker_seasons')).toBe(2);
  expect(await getTableCount(request, 'poker_leaderboard_snapshots')).toBe(1);
  expect(await getTableCount(request, 'poker_batches')).toBe(1);
  expect(await getTableCount(request, 'poker_runs')).toBe(1);
  expect(await getTableCount(request, 'poker_replay_artifacts')).toBe(1);
});
