const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformStats,
} = require('./helpers/unified_platform');

const EXPECTED_OFFICES = [
  'office_fixture_workshop',
  'office_fixture_analysis',
  'office_fixture_archive',
  'office_fixture_ops',
];

const EXPECTED_STAFF = [
  'staff_fixture_operator',
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.0: House Office structure is canonical across structure and overview routes', async ({ page, request }) => {
  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  const seededHouse = await seedRecoverableTokenHouse(request);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const [structureResponse, overviewResponse] = await Promise.all([
    page.request.get('/api/platform/house-structure'),
    page.request.get('/api/platform/house-office'),
  ]);
  expect(structureResponse.ok()).toBe(true);
  expect(overviewResponse.ok()).toBe(true);

  const structureBody = await structureResponse.json();
  const overviewBody = await overviewResponse.json();
  const structureData = structureBody?.data || {};
  const overviewData = overviewBody?.data || {};

  expect(structureData).toMatchObject({
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    modelVersion: 'house_canonical_structure_v1',
    structureSourceKind: 'durable_house_structure',
  });
  expect(overviewData).toMatchObject({
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(overviewData?.sourceManifest?.structureSourceKind).toBe('durable_house_structure');

  const structureOfficeIds = Array.isArray(structureData?.offices)
    ? structureData.offices.map((entry) => String(entry?.officeId || ''))
    : [];
  const overviewOfficeIds = Array.isArray(overviewData?.offices)
    ? overviewData.offices.map((entry) => String(entry?.officeId || ''))
    : [];
  const structureStaffIds = Array.isArray(structureData?.staffAgents)
    ? structureData.staffAgents.map((entry) => String(entry?.staffAgentId || ''))
    : [];
  const overviewStaffIds = Array.isArray(overviewData?.staffAgents)
    ? overviewData.staffAgents.map((entry) => String(entry?.staffAgentId || ''))
    : [];

  expect(structureOfficeIds).toEqual(EXPECTED_OFFICES);
  expect(overviewOfficeIds).toEqual(structureOfficeIds);
  expect(structureStaffIds).toEqual(EXPECTED_STAFF);
  expect(overviewStaffIds).toEqual(structureStaffIds);

  const stats = await getPlatformStats(request);
  expect(stats?.stats?.counts?.house_offices).toBeGreaterThanOrEqual(EXPECTED_OFFICES.length);
  expect(stats?.stats?.counts?.house_staff_agents).toBeGreaterThanOrEqual(EXPECTED_STAFF.length);

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await expect(page.locator('[data-testid="house-office-map-office"]')).toHaveCount(EXPECTED_OFFICES.length);
  await expect(page.getByTestId('house-office-selected-office')).toContainText('Workshop');
  await expect(page.getByTestId('house-office-source-manifest')).toContainText('durable_house_structure');
  await expect(page.getByTestId('house-office-source-manifest')).not.toContainText('house_office_structure_seed');
});
