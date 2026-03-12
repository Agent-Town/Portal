const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { getHouseWorkerLiveReadiness, readHouseWorkerLiveReadinessFromPage } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T38.9: House worker live readiness names house, team, browser, and local-brain prerequisites honestly', async ({ page, request }) => {
  const fixture = await getPlatformFixture(request, 'worker_live_readiness_seed');
  expect(fixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  const initialReadiness = await getHouseWorkerLiveReadiness(page.request);
  expect(initialReadiness.status).toBe(200);
  const initialChecks = Array.isArray(initialReadiness.json?.data?.checks) ? initialReadiness.json.data.checks : [];
  expect(initialChecks.map((entry) => String(entry?.checkId || '').trim())).toEqual(expect.arrayContaining(
    Array.isArray(fixture.fixture?.requiredChecks) ? fixture.fixture.requiredChecks : []
  ));
  expect(initialChecks.find((entry) => String(entry?.checkId || '').trim() === 'house_attached')?.status).toBe('blocked');
  expect(initialChecks.find((entry) => String(entry?.checkId || '').trim() === 'active_team_selected')?.status).toBe('blocked');
  expect(initialChecks.find((entry) => String(entry?.checkId || '').trim() === 'browser_local_brain_ready')?.browserValidationRequired).toBe(true);
  expect(initialChecks.find((entry) => String(entry?.checkId || '').trim() === 'headed_operator_browser')?.browserValidationRequired).toBe(true);

  await setDeterministicLlm(page);
  await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  await page.getByTestId('house-open-office').click();

  const liveSnapshot = await readHouseWorkerLiveReadinessFromPage(page);
  expect(liveSnapshot.status).toBe(200);
  expect(liveSnapshot.json?.data?.status).toBe('ready_for_operator_gate');
  const combinedChecks = Array.isArray(liveSnapshot.json?.data?.checks) ? liveSnapshot.json.data.checks : [];
  expect(combinedChecks.find((entry) => String(entry?.checkId || '').trim() === 'house_attached')?.status).toBe('ready');
  expect(combinedChecks.find((entry) => String(entry?.checkId || '').trim() === 'active_team_selected')?.status).toBe('ready');
  expect(combinedChecks.find((entry) => String(entry?.checkId || '').trim() === 'browser_local_brain_ready')?.status).toBe('ready');

  await expect(page.getByTestId('house-worker-live-readiness-summary')).toContainText('Run the headed operator gate next');
  await expect(page.getByTestId('house-worker-live-readiness-checks')).toContainText('Local brain ready in this browser');
  await expect(page.getByTestId('house-worker-live-readiness-steps')).toContainText('capture:house-worker-live-state');
});
