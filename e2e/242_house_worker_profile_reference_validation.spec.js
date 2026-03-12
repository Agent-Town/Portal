const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker, readHouseWorkerSessionsFromPage, spawnHouseWorker } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T38.6: invalid helper runtime references fail before spawn while valid defaults still work', async ({ page, request }) => {
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  const validationFixture = await getPlatformFixture(request, 'worker_profile_validation_seed');
  expect(installFixture?.ok).toBe(true);
  expect(validationFixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });

  const installResult = await installHouseWorker(page.request, {
    registryEntityId: installFixture.fixture.registryEntityId,
  });
  expect(installResult.status).toBe(200);
  const deploymentId = String(installResult.json?.data?.deployment?.deploymentId || '').trim();
  expect(deploymentId).toBeTruthy();

  const invalidBrain = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'Invalid brain profile probe.',
    reason: 'validation_probe',
    brainProfileId: validationFixture.fixture.invalid.brainProfileId,
  });
  expect(invalidBrain.status).toBe(409);
  expect(invalidBrain.json?.error?.code).toBe('INVALID_BRAIN_PROFILE');

  const invalidWorkspace = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'Invalid workspace probe.',
    reason: 'validation_probe',
    workspaceSeedRef: validationFixture.fixture.invalid.workspaceSeedRef,
  });
  expect(invalidWorkspace.status).toBe(409);
  expect(invalidWorkspace.json?.error?.code).toBe('INVALID_WORKSPACE_SEED_REF');

  const invalidConfig = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'Invalid config probe.',
    reason: 'validation_probe',
    configVersionId: validationFixture.fixture.invalid.configVersionId,
  });
  expect(invalidConfig.status).toBe(409);
  expect(invalidConfig.json?.error?.code).toBe('INVALID_CONFIG_VERSION_ID');

  const invalidLoadout = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'Invalid loadout probe.',
    reason: 'validation_probe',
    loadoutId: validationFixture.fixture.invalid.loadoutId,
  });
  expect(invalidLoadout.status).toBe(409);
  expect(invalidLoadout.json?.error?.code).toBe('INVALID_LOADOUT_ID');

  const sessionsAfterInvalid = await readHouseWorkerSessionsFromPage(page, { teamId: 'team_main' });
  expect(sessionsAfterInvalid.status).toBe(200);
  expect(Array.isArray(sessionsAfterInvalid.json?.data?.sessions) ? sessionsAfterInvalid.json.data.sessions : []).toHaveLength(0);

  const validSpawn = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'Valid profile probe.',
    reason: 'validation_probe',
    brainProfileId: validationFixture.fixture.valid.brainProfileId,
    workspaceSeedRef: validationFixture.fixture.valid.workspaceSeedRef,
    configVersionId: validationFixture.fixture.valid.configVersionId,
    loadoutId: validationFixture.fixture.valid.loadoutId,
  });
  expect(validSpawn.status).toBe(201);
  expect(validSpawn.json?.ok).toBe(true);
  expect(validSpawn.json?.data?.session?.requestedRuntimeProfile).toMatchObject({
    brainProfileId: validationFixture.fixture.valid.brainProfileId,
    workspaceSeedRef: validationFixture.fixture.valid.workspaceSeedRef,
    configVersionId: validationFixture.fixture.valid.configVersionId,
    loadoutId: validationFixture.fixture.valid.loadoutId,
  });
});
