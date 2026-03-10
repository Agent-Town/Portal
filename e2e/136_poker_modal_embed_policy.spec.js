const crypto = require('crypto');
const { test, expect } = require('@playwright/test');
const {
  bootstrapExperienceIntentHarness,
  invokeExperienceTool,
  readPathname,
} = require('./helpers/experience_intents');
const {
  getPortalState,
  resetPortalWebState,
  seedPokerOperatorFixture,
  syncPokerMirror,
} = require('./helpers/portal_web');

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value, 'utf8').digest('hex')}`;
}

function makePokerModalFixture() {
  const eventsJsonl = [
    '{"seq":1,"timestamp":"2026-03-09T12:00:00.000Z","actorSeat":1,"eventType":"deal","payload":{"cards":["Ah","Kd"]}}',
    '{"seq":2,"timestamp":"2026-03-09T12:00:01.000Z","actorSeat":2,"eventType":"raise","payload":{"amount":20}}',
  ].join('\n');
  return {
    schemaVersion: '2026-03-09',
    operatorVersion: '0.9.0',
    seasons: [
      {
        seasonId: 'pks_modal',
        seasonSlug: 'modal-2026',
        displayName: 'Modal 2026',
        rulesVersion: 'poker-rules-v3',
        operatorVersion: '0.9.0',
        status: 'open',
        submissionOpenAt: '2026-04-01T00:00:00.000Z',
        submissionCloseAt: '2030-04-15T00:00:00.000Z',
        latestReplayRunId: 'pkr_modal',
        divisions: [
          { divisionId: 'pkd_modal', divisionSlug: 'standard', runnerKind: 'native' },
        ],
      },
    ],
    batches: [
      {
        batchId: 'pkb_modal',
        seasonId: 'pks_modal',
        batchKind: 'season_eval',
        submissionIds: ['pksub_modal'],
        batchConfig: { seedSetVersion: 'seed-v4', gamesPerPairing: 40 },
        status: 'queued',
      },
    ],
    runs: [
      {
        runId: 'pkr_modal',
        batchId: 'pkb_modal',
        seasonId: 'pks_modal',
        summary: {
          winnerSeat: 2,
          turns: 184,
          seed: 'seed-v4-008',
        },
      },
    ],
    replays: [
      {
        runId: 'pkr_modal',
        replay: {
          replayFormat: 'poker-run-replay-v1',
          summaryJson: {
            winnerSeat: 2,
            turns: 184,
            seed: 'seed-v4-008',
          },
          eventsJsonlUri: 's3://operator/replays/pkr_modal/events.jsonl',
          artifactSha256: sha256(eventsJsonl),
          contentType: 'application/x-ndjson',
          eventsJsonl,
        },
      },
    ],
    leaderboards: [
      {
        snapshotId: 'pklb_modal',
        seasonId: 'pks_modal',
        rankings: [
          { submissionId: 'pksub_modal', displayName: 'PortalBot', rank: 1, rating: 42.8, games: 320, wins: 188 },
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

test('M16.16: poker routes stay modal-first and embedded poker links preserve worker continuity', async ({ request, page }) => {
  await getPortalState(request);
  await seedPokerOperatorFixture(request, makePokerModalFixture());
  const sync = await syncPokerMirror(request);
  expect(sync.resp.ok()).toBe(true);

  const redirectResp = await request.get('/poker/replays/pkr_modal', { maxRedirects: 0 });
  expect(redirectResp.status()).toBe(302);
  const redirectLocation = String(redirectResp.headers().location || '');
  const redirectUrl = new URL(redirectLocation, 'http://localhost');
  expect(redirectUrl.pathname).toBe('/');
  expect(redirectUrl.searchParams.get('district')).toBe('poker');
  expect(redirectUrl.searchParams.get('pokerPath')).toBe('/poker/replays/pkr_modal');

  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const result = await invokeExperienceTool(page, 'agent_town_ui_open_modal', {
    modal: 'poker',
    params: {},
  });
  expect(result?.ok).toBe(true);
  expect(result?.applied).toBe(true);
  expect(result?.stateSnapshot?.activeDistrict).toBe('poker');
  expect(result?.stateSnapshot?.poker?.route).toBe('/poker');

  expect(await readPathname(page)).toBe('/app');
  expect(await page.evaluate(() => !!window.__openclawLiteTest)).toBe(true);
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 3000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Portal Poker');
  const frameEl = page.locator('#districtModalBody iframe.districtFrame');
  await expect(frameEl).toHaveAttribute('src', /\/poker\?embed=1$/);
  const frameHandle = await frameEl.elementHandle();
  const frame = await frameHandle.contentFrame();
  expect(frame).toBeTruthy();
  await frame.waitForLoadState('domcontentloaded');
  await expect(frame.locator('h1')).toHaveText('Portal Poker');
  await expect(frame.getByRole('link', { name: 'Leaderboard' })).toHaveAttribute('href', '/poker/leaderboards/pks_modal?embed=1');
  await expect(frame.getByRole('link', { name: 'Replay' })).toHaveAttribute('href', '/poker/replays/pkr_modal?embed=1');

  await Promise.all([
    frame.waitForURL(/\/poker\/leaderboards\/pks_modal\?embed=1$/),
    frame.getByRole('link', { name: 'Leaderboard' }).click(),
  ]);
  await expect(frame.locator('#leaderboardRows tr')).toHaveCount(1);
  await expect(frame.locator('.leaderboard-rank')).toHaveText(['1']);
  expect(await readPathname(page)).toBe('/app');
  expect(await page.evaluate(() => !!window.__openclawLiteTest)).toBe(true);
});
