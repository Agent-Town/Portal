const crypto = require('crypto');
const { test, expect } = require('@playwright/test');
const {
  getPortalState,
  resetPortalWebState,
  seedPokerOperatorFixture,
  syncPokerMirror,
} = require('./helpers/portal_web');

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value, 'utf8').digest('hex')}`;
}

function makeReplayFixture({ runId = 'pkr_replay', artifactSha256, replayFormat = 'poker-run-replay-v1' } = {}) {
  const eventsJsonl = [
    '{"seq":1,"timestamp":"2026-03-09T12:00:00.000Z","actorSeat":1,"eventType":"deal","payload":{"cards":["Ah","Kd"]}}',
    '{"seq":2,"timestamp":"2026-03-09T12:00:01.000Z","actorSeat":2,"eventType":"raise","payload":{"amount":20}}',
  ].join('\n');
  return {
    schemaVersion: '2026-03-09',
    operatorVersion: '0.9.0',
    seasons: [
      {
        seasonId: 'pks_replay',
        seasonSlug: 'replay-2026',
        displayName: 'Replay 2026',
        rulesVersion: 'poker-rules-v3',
        operatorVersion: '0.9.0',
        status: 'open',
        submissionOpenAt: '2026-04-01T00:00:00.000Z',
        submissionCloseAt: '2030-04-15T00:00:00.000Z',
        latestReplayRunId: runId,
        divisions: [
          { divisionId: 'pkd_replay', divisionSlug: 'standard', runnerKind: 'native' },
        ],
      },
    ],
    batches: [
      {
        batchId: 'pkb_replay',
        seasonId: 'pks_replay',
        batchKind: 'season_eval',
        submissionIds: ['pksub_replay'],
        batchConfig: { seedSetVersion: 'seed-v4', gamesPerPairing: 40 },
        status: 'queued',
      },
    ],
    runs: [
      {
        runId,
        batchId: 'pkb_replay',
        seasonId: 'pks_replay',
        summary: {
          winnerSeat: 2,
          turns: 184,
          seed: 'seed-v4-008',
        },
      },
    ],
    replays: [
      {
        runId,
        replay: {
          replayFormat,
          summaryJson: {
            winnerSeat: 2,
            turns: 184,
            seed: 'seed-v4-008',
          },
          eventsJsonlUri: `s3://operator/replays/${runId}/events.jsonl`,
          artifactSha256,
          contentType: 'application/x-ndjson',
          eventsJsonl,
        },
      },
    ],
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M16.13: replay manifests are hash-verified and fail deterministically on invalid hash or format', async ({ request, page }) => {
  await getPortalState(request);

  const validEventsJsonl = [
    '{"seq":1,"timestamp":"2026-03-09T12:00:00.000Z","actorSeat":1,"eventType":"deal","payload":{"cards":["Ah","Kd"]}}',
    '{"seq":2,"timestamp":"2026-03-09T12:00:01.000Z","actorSeat":2,"eventType":"raise","payload":{"amount":20}}',
  ].join('\n');
  await seedPokerOperatorFixture(request, makeReplayFixture({
    runId: 'pkr_valid',
    artifactSha256: sha256(validEventsJsonl),
  }));
  const validSync = await syncPokerMirror(request);
  expect(validSync.resp.ok()).toBe(true);

  await page.goto('/poker/replays/pkr_valid');
  await expect(page.locator('#replayWinnerSeat')).toHaveText('2');
  await expect(page.locator('#replayTurns')).toHaveText('184');
  await expect(page.locator('#replaySeed')).toHaveText('seed-v4-008');
  await expect(page.locator('#replayStatus')).toContainText('hash verified');

  await resetPortalWebState(request);
  await getPortalState(request);
  await seedPokerOperatorFixture(request, makeReplayFixture({
    runId: 'pkr_bad_hash',
    artifactSha256: 'sha256:deadbeef',
  }));
  const badHashSync = await syncPokerMirror(request);
  expect(badHashSync.resp.ok()).toBe(true);
  const badHashResp = await request.get('/api/poker/runs/pkr_bad_hash/replay');
  expect(badHashResp.status()).toBe(409);
  const badHashBody = await badHashResp.json();
  expect(String(badHashBody?.error?.code || '')).toBe('POKER_REPLAY_NOT_READY');

  await page.goto('/poker/replays/pkr_bad_hash');
  await expect(page.locator('#replayErrorCode')).toHaveText('POKER_REPLAY_NOT_READY');

  await resetPortalWebState(request);
  await getPortalState(request);
  await seedPokerOperatorFixture(request, makeReplayFixture({
    runId: 'pkr_bad_format',
    artifactSha256: sha256(validEventsJsonl),
    replayFormat: 'poker-run-replay-v2',
  }));
  const badFormatSync = await syncPokerMirror(request);
  expect(badFormatSync.resp.status()).toBe(502);
  expect(String(badFormatSync.body?.error?.code || '')).toBe('POKER_OPERATOR_SCHEMA_MISMATCH');
});
