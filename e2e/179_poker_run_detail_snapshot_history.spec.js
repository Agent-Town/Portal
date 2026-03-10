const crypto = require('crypto');
const { test, expect } = require('@playwright/test');

const {
  getPortalState,
  resetPortalWebState,
  seedPokerOperatorFixture,
  syncPokerMirror,
} = require('./helpers/portal_web');
const { getRegistryWebPokerFixture } = require('./helpers/registry_web_poker');

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value, 'utf8').digest('hex')}`;
}

function makeHistoryFixture({ runId, submissionId, snapshots }) {
  const eventsJsonl = [
    '{"seq":1,"timestamp":"2026-03-10T10:00:00.000Z","actorSeat":1,"eventType":"deal","payload":{"cards":["Ah","Kd"]}}',
    '{"seq":2,"timestamp":"2026-03-10T10:00:01.000Z","actorSeat":2,"eventType":"raise","payload":{"amount":20}}',
  ].join('\n');
  return {
    schemaVersion: '2026-03-09',
    operatorVersion: '0.9.0',
    seasons: [
      {
        seasonId: 'pks_history',
        seasonSlug: 'history-2026',
        displayName: 'History 2026',
        rulesVersion: 'poker-rules-v3',
        operatorVersion: '0.9.0',
        status: 'open',
        submissionOpenAt: '2026-03-01T00:00:00.000Z',
        submissionCloseAt: '2030-04-15T00:00:00.000Z',
        latestReplayRunId: runId,
        divisions: [
          { divisionId: 'pkd_history', divisionSlug: 'standard', runnerKind: 'native' },
        ],
      },
    ],
    batches: [
      {
        batchId: 'pkb_history',
        seasonId: 'pks_history',
        batchKind: 'season_eval',
        submissionIds: [submissionId],
        batchConfig: { seedSetVersion: 'seed-v4', gamesPerPairing: 40 },
        status: 'queued',
      },
    ],
    runs: [
      {
        runId,
        batchId: 'pkb_history',
        seasonId: 'pks_history',
        summary: {
          fingerprint: 'run-fixture-01',
          winnerSeat: 2,
          turns: 184,
          seed: 'seed-v4-008',
          seatResults: [
            { seat: 1, submissionId, finishRank: 2, chips: 120 },
            { seat: 2, submissionId: 'pksub_fixture_02', finishRank: 1, chips: 420 },
          ],
        },
      },
    ],
    replays: [
      {
        runId,
        replay: {
          replayFormat: 'poker-run-replay-v1',
          summaryJson: {
            winnerSeat: 2,
            turns: 184,
            seed: 'seed-v4-008',
          },
          eventsJsonlUri: `s3://operator/replays/${runId}/events.jsonl`,
          artifactSha256: sha256(eventsJsonl),
          contentType: 'application/x-ndjson',
          eventsJsonl,
        },
      },
    ],
    leaderboards: snapshots.map((snapshot, index) => ({
      snapshotId: snapshot.snapshotId,
      seasonId: 'pks_history',
      rankings: [
        {
          submissionId,
          displayName: 'PortalBot',
          rank: 1,
          rating: 42.8 - index,
          games: 320,
          wins: 188 - index,
        },
      ],
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.createdAt,
    })),
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.12: poker run detail and snapshot history are deterministic and replay links stay inside embed flow', async ({ request, page }) => {
  await getPortalState(request);
  const fixture = await getRegistryWebPokerFixture(request, 'poker_run_history_seed');
  expect(fixture.ok).toBe(true);
  const runSeed = fixture.fixture?.run || {};
  const snapshots = Array.isArray(fixture.fixture?.snapshots) ? fixture.fixture.snapshots : [];

  await seedPokerOperatorFixture(request, makeHistoryFixture({
    runId: String(runSeed.runId || 'pkrun_fixture_01'),
    submissionId: String(runSeed.submissionId || 'pksub_fixture_01'),
    snapshots,
  }));
  const sync = await syncPokerMirror(request);
  expect(sync.resp.ok()).toBe(true);

  const runDetailResponse = await request.get(`/api/poker/runs/${encodeURIComponent(runSeed.runId)}`);
  expect(runDetailResponse.ok()).toBe(true);
  const runDetailBody = await runDetailResponse.json();
  expect(runDetailBody?.data?.run).toMatchObject({
    runId: String(runSeed.runId || ''),
    submissionId: String(runSeed.submissionId || ''),
    fingerprint: 'run-fixture-01',
    replayReady: true,
  });
  expect(runDetailBody?.data?.run?.seatResults).toHaveLength(2);

  const snapshotHistoryResponse = await request.get('/api/poker/leaderboards/pks_history/snapshots');
  expect(snapshotHistoryResponse.ok()).toBe(true);
  const snapshotHistoryBody = await snapshotHistoryResponse.json();
  expect((snapshotHistoryBody?.data?.items || []).map((item) => item.snapshotId)).toEqual([
    'snapshot_fixture_02',
    'snapshot_fixture_01',
  ]);

  await page.goto(`/poker/leaderboards/pks_history/snapshots?embed=1`);
  await expect(page.locator('#pokerSnapshotHistoryRows tr')).toHaveCount(2);
  await expect(page.locator('.snapshot-history-id')).toHaveText(['snapshot_fixture_02', 'snapshot_fixture_01']);

  await page.goto(`/poker/runs/${encodeURIComponent(runSeed.runId)}?embed=1`);
  await expect(page.locator('#runDetailFingerprint')).toHaveText('run-fixture-01');
  await expect(page.locator('#pokerRunSeatRows tr')).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Replay' })).toHaveAttribute('href', `/poker/replays/${encodeURIComponent(runSeed.runId)}?embed=1`);

  await Promise.all([
    page.waitForURL(new RegExp(`/poker/replays/${encodeURIComponent(runSeed.runId)}\\?embed=1$`)),
    page.getByRole('link', { name: 'Replay' }).click(),
  ]);
  await expect(page.locator('#replayStatus')).toContainText('hash verified');
});
