const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T38.8: default helper surfaces hide raw ids and keep advanced runtime details behind explicit disclosure', async ({ page, request }) => {
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  const languageFixture = await getPlatformFixture(request, 'worker_default_user_language_seed');
  expect(installFixture?.ok).toBe(true);
  expect(languageFixture?.ok).toBe(true);

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

  const deploymentCard = page.getByTestId('house-office-deployment-item').first();
  const sessionCard = page.getByTestId('house-office-worker-session-item').first();

  await expect(deploymentCard.getByTestId('house-office-deployment-advanced')).not.toHaveJSProperty('open', true);
  await expect(sessionCard.getByTestId('house-office-worker-session-advanced')).not.toHaveJSProperty('open', true);

  const visibleDeploymentText = await page.evaluate((element) => {
    const lines = [];
    for (const child of Array.from(element.children)) {
      if (child.tagName === 'DETAILS') continue;
      const text = String(child.textContent || '').trim();
      if (text) lines.push(text);
    }
    return lines.join('\n').toLowerCase();
  }, await deploymentCard.elementHandle());
  const visibleSessionText = await page.evaluate((element) => {
    const lines = [];
    for (const child of Array.from(element.children)) {
      if (child.tagName === 'DETAILS') continue;
      const text = String(child.textContent || '').trim();
      if (text) lines.push(text);
    }
    return lines.join('\n').toLowerCase();
  }, await sessionCard.elementHandle());

  for (const forbidden of Array.isArray(languageFixture.fixture?.forbiddenDefaultFragments) ? languageFixture.fixture.forbiddenDefaultFragments : []) {
    expect(visibleDeploymentText).not.toContain(String(forbidden || '').trim().toLowerCase());
    expect(visibleSessionText).not.toContain(String(forbidden || '').trim().toLowerCase());
  }

  await expect(deploymentCard.getByTestId('house-office-helper-next-step')).toContainText('Next step');
  await expect(deploymentCard.getByTestId('house-office-helper-resume-safety')).toContainText('Safe to do now');
  await expect(sessionCard.getByTestId('house-office-worker-session-next-step')).toContainText('Next step');
  await expect(sessionCard.getByTestId('house-office-worker-session-resume-safety')).toContainText('Safe to do now');
});
