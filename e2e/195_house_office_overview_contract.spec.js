const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformFixture,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.0: House Office overview is deterministic, mobile-safe, and reuses current House truth', async ({ page, request }) => {
  const fixture = await getPlatformFixture(request, 'house_office_overview_seed');
  expect(fixture?.ok).toBe(true);
  const seededOffices = Array.isArray(fixture?.fixture?.offices) ? fixture.fixture.offices : [];
  expect(seededOffices.map((item) => String(item?.slug || ''))).toEqual([
    'workshop',
    'analysis',
    'archive',
    'ops',
  ]);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  const beforeAttachResponse = await page.request.get('/api/platform/house-office');
  expect(beforeAttachResponse.ok()).toBe(true);
  const beforeAttachBody = await beforeAttachResponse.json();
  expect(beforeAttachBody?.data).toMatchObject({
    houseId: null,
    teamId: null,
    offices: seededOffices.map((item) => expect.objectContaining({
      officeId: item.officeId,
      slug: item.slug,
      displayName: item.displayName,
    })),
    staffAgents: [],
    presence: [],
    briefing: [],
    attention: [],
  });
  expect(beforeAttachBody?.data?.sourceManifest?.routes).toEqual(expect.arrayContaining([
    '/api/platform/context',
    '/api/platform/experiences',
    '/api/platform/workshop',
    '/api/platform/tracks',
    '/api/platform/archive',
    '/api/platform/trainer',
  ]));
  expect(beforeAttachBody?.data?.sourceManifest?.fixtures).toEqual(expect.arrayContaining([
    'house_office_overview_seed',
    'house_office_structure_seed',
  ]));
  expect(beforeAttachBody?.data?.sourceManifest?.structureSourceKind).toBe('unattached_preview');

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await expect(page.getByTestId('house-office-empty')).toContainText('Attach a house');
  await expect(page.locator('[data-testid="house-office-map-office"]')).toHaveCount(seededOffices.length);
  await expect(page.getByTestId('house-office-summary')).toContainText('4 offices');
  await expect(page.getByTestId('house-office-summary')).toContainText('selected Workshop');
  await expect(page.getByTestId('house-office-source-manifest')).toContainText('/api/platform/context');
  await expect(page.getByTestId('house-office-source-manifest')).toContainText('house_office_overview_seed');

  const preAttachLayout = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="house-office-panel"]');
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelClientWidth: panel ? panel.clientWidth : 0,
      panelScrollWidth: panel ? panel.scrollWidth : 0,
    };
  });
  expect(preAttachLayout.documentWidth).toBeLessThanOrEqual(preAttachLayout.viewportWidth + 1);
  expect(preAttachLayout.panelScrollWidth).toBeLessThanOrEqual(preAttachLayout.panelClientWidth + 1);

  const seededHouse = await seedRecoverableTokenHouse(request);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();

  const attachedResponse = await page.request.get('/api/platform/house-office');
  expect(attachedResponse.ok()).toBe(true);
  const attachedBody = await attachedResponse.json();
  expect(attachedBody?.data).toMatchObject({
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    activeTeamId: 'team_main',
  });
  expect(attachedBody?.data?.offices.map((item) => String(item?.slug || ''))).toEqual([
    'workshop',
    'analysis',
    'archive',
    'ops',
  ]);
  expect(attachedBody?.data?.sourceManifest?.structureSourceKind).toBe('durable_house_structure');
  expect(Array.isArray(attachedBody?.data?.staffAgents)).toBe(true);
  expect(attachedBody.data.staffAgents).toHaveLength(1);
  expect(attachedBody?.data?.sourceManifest?.counts).toMatchObject({
    officeCount: 4,
    staffAgentCount: 1,
  });

  await expect(page.getByTestId('house-team-summary')).toContainText('team_main');
  await expect(page.getByTestId('house-office-summary')).toContainText(seededHouse.houseId);
  await expect(page.getByTestId('house-office-summary')).toContainText('active team team_main');
  await expect(page.getByTestId('house-office-summary')).toContainText('1 staff');
  await expect(page.getByTestId('house-office-source-manifest')).toContainText('/api/platform/trainer');
  await expect(page.getByTestId('house-office-source-manifest')).toContainText('durable_house_structure');
  await expect(page.getByTestId('house-office-source-manifest')).toContainText('house_office_structure_seed');

  const postAttachLayout = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="house-office-panel"]');
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelClientWidth: panel ? panel.clientWidth : 0,
      panelScrollWidth: panel ? panel.scrollWidth : 0,
      pathname: window.location.pathname,
    };
  });
  expect(postAttachLayout.documentWidth).toBeLessThanOrEqual(postAttachLayout.viewportWidth + 1);
  expect(postAttachLayout.panelScrollWidth).toBeLessThanOrEqual(postAttachLayout.panelClientWidth + 1);
  expect(postAttachLayout.pathname).toBe('/app');
});
