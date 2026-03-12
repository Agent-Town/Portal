const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  attachHouseToPageSession,
  getPlatformStats,
  getPlatformContextFromPage,
} = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

const EXPECTED_HOUSE_OFFICES = [
  {
    officeId: 'office_fixture_workshop',
    slug: 'workshop',
    displayName: 'Workshop',
  },
  {
    officeId: 'office_fixture_analysis',
    slug: 'analysis',
    displayName: 'Analysis',
  },
  {
    officeId: 'office_fixture_archive',
    slug: 'archive',
    displayName: 'Archive',
  },
  {
    officeId: 'office_fixture_ops',
    slug: 'ops',
    displayName: 'Operations',
  },
];

const EXPECTED_HOUSE_STAFF = [
  {
    staffAgentId: 'staff_fixture_operator',
    role: 'operator',
    officeId: 'office_fixture_ops',
  },
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.7: house office and staff scaffolding is deterministic and does not disturb current team flows', async ({ page, request }) => {
  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  const beforeAttachResponse = await page.request.get('/api/platform/house-structure');
  expect(beforeAttachResponse.ok()).toBe(true);
  const beforeAttachBody = await beforeAttachResponse.json();
  expect(beforeAttachBody?.data).toMatchObject({
    houseId: null,
    offices: [],
    staffAgents: [],
    structureSourceKind: 'unattached_preview',
  });

  const seededHouse = await seedRecoverableTokenHouse(request);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const structureResponse = await page.request.get('/api/platform/house-structure');
  expect(structureResponse.ok()).toBe(true);
  const structureBody = await structureResponse.json();
  expect(structureBody?.data).toMatchObject({
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    structureSourceKind: 'durable_house_structure',
    modelVersion: 'house_canonical_structure_v1',
    offices: EXPECTED_HOUSE_OFFICES,
    staffAgents: EXPECTED_HOUSE_STAFF,
  });

  const stats = await getPlatformStats(request);
  expect(stats?.stats?.counts?.house_offices).toBeGreaterThanOrEqual(4);
  expect(stats?.stats?.counts?.house_staff_agents).toBeGreaterThanOrEqual(1);

  await page.reload();
  await waitForLiteApi(page);

  const context = await getPlatformContextFromPage(page);
  expect(context?.data).toMatchObject({
    houseId: seededHouse.houseId,
    activeTeamId: 'team_main',
  });

  await expect(page.getByTestId('house-console-panel')).toBeVisible();
  await expect(page.getByTestId('house-team-summary')).toContainText('team_main');
});
