const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');
const { installHouseWorker, readHouseWorkerSessionsFromPage } = require('./helpers/house_workers');
const { attachHouseToPageSession, ensureActivePlatformConfigVersion, getPlatformFixture } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.8: advanced spawn profile overrides persist exactly while the default path stays non-technical', async ({ page, request }) => {
  test.slow();
  test.setTimeout(60_000);

  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  const profileFixture = await getPlatformFixture(request, 'worker_spawn_profile_seed');
  expect(installFixture?.ok).toBe(true);
  expect(profileFixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = await ensureActivePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_house_worker_spawn_profile_contract_01',
    idempotencyPrefix: 'house-worker-spawn-profile-contract',
    branch: 'house-worker-spawn-profile-contract',
  });

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
  const advancedBody = page.getByTestId('house-office-deployment-advanced-body').first();
  await expect(advancedBody).not.toBeVisible();

  await page.getByTestId('house-office-deployment-advanced').first().locator('summary').click();
  await expect(advancedBody).toBeVisible();

  await page.getByTestId('house-office-helper-brainProfileId-input').first().fill(String(profileFixture.fixture.brainProfileId || ''));
  await page.getByTestId('house-office-helper-workspaceSeedRef-input').first().fill(String(profileFixture.fixture.workspaceSeedRef || ''));
  await page.getByTestId('house-office-helper-configVersionId-input').first().fill(configVersionId);
  await page.getByTestId('house-office-helper-loadoutId-input').first().fill(String(profileFixture.fixture.loadoutId || ''));
  await page.getByTestId('house-office-helper-start').first().click();

  await expect.poll(async () => {
    const sessions = await readHouseWorkerSessionsFromPage(page, { teamId: 'team_main' });
    return Array.isArray(sessions?.json?.data?.sessions) ? sessions.json.data.sessions.length : 0;
  }).toBe(1);

  const sessionsPayload = await readHouseWorkerSessionsFromPage(page, { teamId: 'team_main' });
  const session = sessionsPayload.json?.data?.sessions?.[0];
  expect(session?.runtimeProfile).toMatchObject({
    brainProfileId: profileFixture.fixture.brainProfileId,
    workspaceSeedRef: profileFixture.fixture.workspaceSeedRef,
    configVersionId,
    loadoutId: profileFixture.fixture.loadoutId,
  });
});
