const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  installHouseWorker,
  shareHouseWorker,
} = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.3f: worker package release and compatibility stay visible in plain language across Registry, share preview, and House Office', async ({ page, request }) => {
  const registryFixture = await getPlatformFixture(request, 'worker_package_registry_seed');
  expect(registryFixture?.ok).toBe(true);
  const fixture = registryFixture.fixture || {};

  await page.goto('/registry.html?family=workers');
  const registryCard = page.getByTestId('registry-worker-package-card');
  await expect(registryCard).toContainText(`Release: ${fixture.versionLabel}`);
  await expect(registryCard).toContainText('Install uses exactly release v1 from Registry.');

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const seededHouse = await seedRecoverableTokenHouse(request);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const install = await installHouseWorker(page.request, {
    registryEntityId: fixture.registryEntityId,
  });
  expect(install.status).toBe(200);

  await page.getByTestId('house-open-office').click();
  const deploymentCard = page.getByTestId('house-office-deployment-item');
  await expect(deploymentCard.getByTestId('house-office-deployment-release')).toHaveText(`Release: ${fixture.versionLabel}`);
  await expect(deploymentCard.getByTestId('house-office-deployment-compatibility')).toContainText('Install uses exactly release v1 from Registry.');

  const share = await shareHouseWorker(page.request, {
    deploymentId: install.json?.data?.deployment?.deploymentId,
  });
  expect(share.status).toBe(200);
  const shareId = String(share.json?.data?.shareId || '').trim();
  expect(shareId).toBeTruthy();

  await page.goto(`/registry.html?workerShare=${encodeURIComponent(shareId)}`);
  const shareBanner = page.getByTestId('registry-worker-share-banner');
  await expect(shareBanner.getByTestId('registry-worker-package-release')).toHaveText(`Release: ${fixture.versionLabel}`);
  await expect(shareBanner.getByTestId('registry-worker-package-compatibility')).toContainText('This link installs exactly release v1 from Registry.');
});
