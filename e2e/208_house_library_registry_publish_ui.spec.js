const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformStats,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');
const { openHouseLibraryManualPublishDrawer } = require('./helpers/house_library_public_stacks');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.13: House Library publishes the selected item to Registry inside the same shell with approval-gated replay', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_registry_publish_ui_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const createResp = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'house-library-publish-ui-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Registry Publish Playbook',
      summary: 'One curated item ready for Registry publication.',
      contentText: 'Publish this Library item after explicit approval.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/registry-publish.md',
    },
    failOnStatusCode: false,
  });
  expect(createResp.status()).toBe(201);

  const initialSessionId = await readWorkerSessionId(page);
  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await openHouseLibraryManualPublishDrawer(page);
  await expect(page.locator('#houseLibraryList button')).toHaveCount(1);
  await expect(page.locator('#houseLibraryList button').first()).toContainText('Registry Publish Playbook');
  await expect(page.getByTestId('house-library-approval-input')).toBeEnabled();
  await expect(page.getByTestId('house-library-publish-button')).toBeEnabled();

  await page.getByTestId('house-library-publish-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('LIBRARY_PUBLISH_APPROVAL_REQUIRED');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfterBlocked = await getPlatformStats(request);
  expect(statsAfterBlocked?.stats?.counts).toEqual(statsBefore?.stats?.counts);

  await page.getByTestId('house-library-approval-input').fill(APPROVED_PUBLICATION_ID);
  await page.getByTestId('house-library-publish-button').click();

  await expect(page.getByTestId('house-library-action-status')).toContainText('Published Registry Publish Playbook to Registry as regpub_');
  await expect(page.getByTestId('house-library-approval-input')).toHaveValue('');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfterPublish = await getPlatformStats(request);
  expect(Number(statsAfterPublish?.stats?.counts?.library_publications || 0)).toBe(Number(statsBefore?.stats?.counts?.library_publications || 0) + 1);

  await page.getByTestId('house-library-approval-input').fill(APPROVED_PUBLICATION_ID);
  await page.getByTestId('house-library-publish-button').click();

  await expect(page.getByTestId('house-library-action-status')).toContainText('Published Registry Publish Playbook to Registry as regpub_');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterPublish?.stats?.counts);
});
