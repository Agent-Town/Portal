const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T38.7: helper recovery stays plain-language first after interruption', async ({ page, request }) => {
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  const recoveryFixture = await getPlatformFixture(request, 'worker_recovery_summary_seed');
  expect(installFixture?.ok).toBe(true);
  expect(recoveryFixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  await setDeterministicLlm(page);
  await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });

  const installResult = await installHouseWorker(page.request, {
    registryEntityId: installFixture.fixture.registryEntityId,
  });
  expect(installResult.status).toBe(200);

  await page.getByTestId('house-open-office').click();
  await page.getByTestId('house-office-helper-start').first().click();
  await expect(page.getByTestId('house-office-worker-session-item').first()).toBeVisible();

  await page.reload();
  await waitForLiteApi(page);
  await page.getByTestId('house-open-office').click();

  const deploymentCard = page.getByTestId('house-office-deployment-item').first();
  await expect(deploymentCard.getByTestId('house-office-helper-recovery-summary')).toContainText(String(recoveryFixture.fixture?.lastCompletedPrefix || 'Last finished').trim());
  await expect(deploymentCard.getByTestId('house-office-helper-last-active')).toContainText(String(recoveryFixture.fixture?.lastActivePrefix || 'Last active').trim());
  await expect(deploymentCard.getByTestId('house-office-helper-next-step')).toContainText(/Take over|Resume|Restart/i);
  await expect(deploymentCard.getByTestId('house-office-helper-resume-safety')).toContainText(String(recoveryFixture.fixture?.resumeSafetyPrefix || 'Safe to do now').trim());

  const sessionCard = page.getByTestId('house-office-worker-session-item').first();
  await expect(sessionCard.getByTestId('house-office-worker-session-recovery-summary')).toContainText(String(recoveryFixture.fixture?.lastCompletedPrefix || 'Last finished').trim());
  await expect(sessionCard.getByTestId('house-office-worker-session-last-active')).toContainText(String(recoveryFixture.fixture?.lastActivePrefix || 'Last active').trim());
  await expect(sessionCard.getByTestId('house-office-worker-session-next-step')).toContainText(/Take over|Resume|Restart/i);
  await expect(sessionCard.getByTestId('house-office-worker-session-resume-safety')).toContainText(String(recoveryFixture.fixture?.resumeSafetyPrefix || 'Safe to do now').trim());
});
