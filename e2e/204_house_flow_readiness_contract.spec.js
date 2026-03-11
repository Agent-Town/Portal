const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const { attachHouseToPageSession } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('House flow readiness reports live blockers before attach and an honest mixed state after attach', async ({ page, request }) => {
  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  await expect(page.getByTestId('house-readiness-summary')).toContainText('Attach a house', { timeout: 10000 });

  const beforeAttachResponse = await page.request.get('/api/platform/house-readiness');
  expect(beforeAttachResponse.ok()).toBe(true);
  const beforeAttachBody = await beforeAttachResponse.json();
  const beforeAttachData = beforeAttachBody?.data || {};
  expect(beforeAttachData).toMatchObject({
    schema: 'agent-town-house-readiness/v1',
    houseId: null,
    activeTeamId: null,
    status: 'action_required',
  });
  expect(beforeAttachData.blockers.map((entry) => String(entry?.code || ''))).toEqual(['HOUSE_REQUIRED']);
  expect(beforeAttachData.districtSections.map((entry) => String(entry?.label || ''))).toEqual([
    'Front Desk',
    'Workshop Wing',
    'Analysis Wing',
    'Archive Wing',
    'Operations Wing',
    'Tracks Board',
  ]);
  expect(beforeAttachData.surfaces.map((entry) => String(entry?.status || ''))).toEqual([
    'blocked',
    'blocked',
    'blocked',
    'blocked',
    'blocked',
    'blocked',
  ]);
  expect(beforeAttachData.checklist).toHaveLength(4);
  expect(beforeAttachData.checklist.map((entry) => String(entry?.stepId || ''))).toEqual([
    'open_house_office',
    'follow_briefing_citation',
    'open_workshop_and_tracks',
    'open_archive_and_trainer',
  ]);
  await expect(page.getByTestId('house-readiness-surface')).toHaveCount(6);
  await expect(page.getByTestId('house-readiness-check-item')).toHaveCount(4);
  await expect(page.getByTestId('house-readiness-surface').nth(0)).toContainText('House Office');
  await expect(page.getByTestId('house-readiness-surface').nth(0)).toContainText('blocked');

  const seededHouse = await seedRecoverableTokenHouse(request);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await page.reload();
  await waitForLiteApi(page);
  await expect(page.getByTestId('house-team-summary')).toContainText('team_main');
  await expect(page.getByTestId('house-readiness-summary')).toContainText('2 of 6 House surfaces', { timeout: 10000 });

  const afterAttachResponse = await page.request.get('/api/platform/house-readiness');
  expect(afterAttachResponse.ok()).toBe(true);
  const afterAttachBody = await afterAttachResponse.json();
  const afterAttachData = afterAttachBody?.data || {};
  expect(afterAttachData).toMatchObject({
    schema: 'agent-town-house-readiness/v1',
    houseId: seededHouse.houseId,
    activeTeamId: 'team_main',
    status: 'action_required',
  });
  expect(afterAttachData.blockers).toEqual([]);
  expect(afterAttachData.surfaces).toHaveLength(6);
  expect(afterAttachData.counts).toMatchObject({
    officeCount: 4,
    staffAgentCount: 1,
    readySurfaceCount: 2,
  });
  expect(afterAttachData.surfaces.map((surface) => String(surface?.status || ''))).toEqual([
    'ready',
    'blocked',
    'blocked',
    'blocked',
    'blocked',
    'ready',
  ]);
  expect(afterAttachData.checklist).toHaveLength(4);

  await expect(page.getByTestId('house-readiness-surface').nth(0)).toContainText('House Office');
  await expect(page.getByTestId('house-readiness-surface').nth(0)).toContainText('route ok');
  await expect(page.getByTestId('house-readiness-surface').nth(0)).toContainText('selection ok');
  await expect(page.getByTestId('house-readiness-surface').nth(1)).toContainText('House Workshop');
  await expect(page.getByTestId('house-readiness-surface').nth(1)).toContainText('blocked');
  await expect(page.getByTestId('house-readiness-check-item').nth(0)).toContainText('Open House Office');
  await expect(page.getByTestId('house-readiness-check-item').nth(1)).toContainText('Follow one House Briefing citation');
});
