const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getLiveSuiteManifest,
  getPlatformContextFromPage,
  getPlatformCounts,
  getPlatformFixture,
  getRouteManifest,
  listPlatformFixtures,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

const REQUIRED_FIXTURES = [
  'multi_team_archive_seed',
  'multi_team_trainer_seed',
  'privy_email_otp_stub_seed',
  'live_suite_manifest_expected',
  'route_module_manifest_expected',
  'platform_export_roundtrip_seed',
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M20.0: gap harness exposes fixture families, active team context, route owners, and live-suite manifest', async ({ page, request }) => {
  const initialCounts = await getPlatformCounts(request);
  expect(initialCounts.ok).toBe(true);
  for (const count of Object.values(initialCounts.counts || {})) {
    expect(Number(count || 0)).toBe(0);
  }

  const fixtureList = await listPlatformFixtures(request);
  expect(fixtureList.ok).toBe(true);
  for (const family of REQUIRED_FIXTURES) {
    expect(fixtureList.families || []).toContain(family);
    const fixture = await getPlatformFixture(request, family);
    expect(fixture.ok).toBe(true);
    expect(fixture.fixture && typeof fixture.fixture === 'object').toBeTruthy();
  }

  const routeManifest = await getRouteManifest(request);
  expect(routeManifest.ok).toBe(true);
  const routeFamilies = (routeManifest.routes || []).map((entry) => String(entry.family || ''));
  expect(routeFamilies).toEqual(expect.arrayContaining(['web', 'registry', 'poker', 'platform', 'v1']));

  const liveSuiteManifest = await getLiveSuiteManifest(request);
  expect(liveSuiteManifest.ok).toBe(true);
  const liveSuiteIds = (liveSuiteManifest.suites || []).map((entry) => String(entry.suiteId || ''));
  expect(liveSuiteIds).toEqual(expect.arrayContaining(['privy-guest', 'sepolia-wallet']));

  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_gap_harness_team_alpha_01',
    houseId: seededHouse.houseId,
    teamId: 'team_alpha',
    status: 'active',
  });
  expect(seededConfig.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_alpha',
  });
  expect(attached.status).toBe(200);

  await expect.poll(async () => {
    const context = await getPlatformContextFromPage(page);
    const data = context?.data || context || {};
    return String(data.activeTeamId || '');
  }).toBe('team_alpha');

  const workerSessionId = await readWorkerSessionId(page);
  expect(String(workerSessionId || '')).toBeTruthy();
});
