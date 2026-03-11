const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker, getHouseWorkerDeployments } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.1: worker packages install into House deployments with exact Registry parity', async ({ page, request }) => {
  const registryFixture = await getPlatformFixture(request, 'worker_package_registry_seed');
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  expect(registryFixture?.ok).toBe(true);
  expect(installFixture?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const seededHouse = await seedRecoverableTokenHouse(request);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const installA = await installHouseWorker(page.request, {
    registryEntityId: registryFixture.fixture.registryEntityId,
  });
  expect(installA.status).toBe(200);
  expect(installA.json?.ok).toBe(true);
  expect(installA.json?.data?.deployment).toMatchObject({
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    officeId: installFixture.fixture.officeId,
    officeLabel: installFixture.fixture.officeLabel,
    staffAgentId: installFixture.fixture.staffAgentId,
    staffAgentLabel: installFixture.fixture.staffAgentLabel,
    registryEntityId: registryFixture.fixture.registryEntityId,
    entityVersionId: registryFixture.fixture.entityVersionId,
    loadoutId: registryFixture.fixture.loadoutId,
    bundleHash: registryFixture.fixture.bundleHash,
    status: installFixture.fixture.expectedStatus,
    statusLabel: installFixture.fixture.expectedStatusLabel,
  });
  expect(installA.json?.data?.guidance?.nextStep).toBe(installFixture.fixture.expectedStatusLabel);

  const installB = await installHouseWorker(page.request, {
    registryEntityId: registryFixture.fixture.registryEntityId,
  });
  expect(installB.status).toBe(200);
  expect(installB.json?.data?.deployment?.deploymentId).toBe(installA.json?.data?.deployment?.deploymentId);

  const deployments = await getHouseWorkerDeployments(page.request);
  expect(deployments.status).toBe(200);
  expect(deployments.json?.ok).toBe(true);
  expect(deployments.json?.data?.deployments).toHaveLength(1);
  expect(deployments.json?.data?.deployments?.[0]).toMatchObject({
    deploymentId: installA.json?.data?.deployment?.deploymentId,
    entityVersionId: registryFixture.fixture.entityVersionId,
    loadoutId: registryFixture.fixture.loadoutId,
    bundleHash: registryFixture.fixture.bundleHash,
  });
});
