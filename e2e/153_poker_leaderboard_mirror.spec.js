const { test, expect } = require('@playwright/test');
const {
  getPortalState,
  resetPortalWebState,
  seedPokerOperatorFixture,
  syncPokerMirror,
} = require('./helpers/portal_web');

function makeLeaderboardFixture({ seasonId = 'pks_board', rankings = [] } = {}) {
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
    leaderboards: rankings.length
      ? [
        {
          snapshotId: `${seasonId}_snapshot`,
          seasonId,
          rankings,
          createdAt: '2026-03-09T12:00:00.000Z',
          updatedAt: '2026-03-09T12:00:00.000Z',
        },
      ]
      : [],
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M16.12: leaderboard page renders mirrored operator ordering exactly and stays stable when empty', async ({ request, page }) => {
  await getPortalState(request);
  await seedPokerOperatorFixture(request, makeLeaderboardFixture({
    seasonId: 'pks_board',
    rankings: [
      { submissionId: 'pksub_01', displayName: 'PortalBot', rank: 1, rating: 42.8, games: 320, wins: 188 },
      { submissionId: 'pksub_02', displayName: 'MirrorFox', rank: 2, rating: 39.4, games: 320, wins: 171 },
      { submissionId: 'pksub_03', displayName: 'NorthSeat', rank: 3, rating: 33.1, games: 320, wins: 149 },
    ],
  }));
  const sync = await syncPokerMirror(request);
  expect(sync.resp.ok()).toBe(true);

  await page.goto('/poker/leaderboards/pks_board?embed=1');
  await expect(page.locator('#leaderboardRows tr')).toHaveCount(3);
  await expect(page.locator('.leaderboard-rank')).toHaveText(['1', '2', '3']);
  await expect(page.locator('.leaderboard-rating')).toHaveText(['42.8', '39.4', '33.1']);

  await resetPortalWebState(request);
  await getPortalState(request);
  await seedPokerOperatorFixture(request, makeLeaderboardFixture({ seasonId: 'pks_empty', rankings: [] }));
  const emptySync = await syncPokerMirror(request);
  expect(emptySync.resp.ok()).toBe(true);

  await page.goto('/poker/leaderboards/pks_empty?embed=1');
  await expect(page.locator('#pokerStatus')).toContainText('No leaderboard snapshot mirrored yet.');
  await expect(page.locator('text=No leaderboard snapshot yet.')).toHaveCount(1);
});
