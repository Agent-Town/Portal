const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  attachHouseToPageSession,
  getPlatformContextFromPage,
  getPlatformFixture,
} = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.7: house office and staff scaffolding is deterministic and does not disturb current team flows', async ({ page, request }) => {
  const fixture = await getPlatformFixture(request, 'house_office_staff_seed');
  expect(fixture?.ok).toBe(true);
  expect(fixture?.fixture).toMatchObject({
    offices: [
      {
        officeId: 'office_fixture_ops',
        slug: 'ops',
        displayName: 'Operations',
      },
    ],
    staffAgents: [
      {
        staffAgentId: 'staff_fixture_operator',
        role: 'operator',
        officeId: 'office_fixture_ops',
      },
    ],
  });

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  const beforeAttachResponse = await page.request.get('/api/platform/house-structure');
  expect(beforeAttachResponse.ok()).toBe(true);
  const beforeAttachBody = await beforeAttachResponse.json();
  expect(beforeAttachBody?.data).toMatchObject({
    houseId: null,
    offices: [],
    staffAgents: [],
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
    offices: fixture.fixture.offices,
    staffAgents: fixture.fixture.staffAgents,
  });

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
