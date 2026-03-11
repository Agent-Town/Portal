const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.5: default helper install guidance stays understandable for non-technical users', async ({ page, request }) => {
  const registryFixture = await getPlatformFixture(request, 'worker_package_registry_seed');
  const guidanceFixture = await getPlatformFixture(request, 'worker_package_guidance_seed');
  expect(registryFixture?.ok).toBe(true);
  expect(guidanceFixture?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const seededHouse = await seedRecoverableTokenHouse(request);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await page.goto('/registry.html?family=workers');
  await expect(page.getByTestId('registry-worker-package-card')).toContainText('Keeps your House organized and easy to understand.');
  await expect(page.getByTestId('registry-worker-package-card')).toContainText('Explains what is happening in plain language');
  for (const label of guidanceFixture.fixture.requiredLabels || []) {
    await expect(page.locator('body')).toContainText(label);
  }
  await expect(page.getByTestId('registry-worker-package-advanced-body')).not.toBeVisible();

  await page.getByTestId('registry-worker-package-install').click();
  for (const fragment of guidanceFixture.fixture.requiredGuidanceFragments || []) {
    await expect(page.getByTestId('registry-worker-package-card')).toContainText(fragment);
  }

  await page.getByTestId('registry-worker-package-details').click();
  await expect(page.getByTestId('registry-worker-package-advanced-body')).toBeVisible();
  await expect(page.getByTestId('registry-worker-package-advanced-body')).toContainText(registryFixture.fixture.entityVersionId);
  await expect(page.getByTestId('registry-worker-package-advanced-body')).toContainText(registryFixture.fixture.loadoutId);
});
