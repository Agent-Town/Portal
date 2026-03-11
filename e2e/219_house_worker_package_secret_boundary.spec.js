const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { getHouseWorkerShare, installHouseWorker, shareHouseWorker } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.4: worker package payloads stay portable without leaking live credentials', async ({ page, request }) => {
  const registryFixture = await getPlatformFixture(request, 'worker_package_registry_seed');
  const secretFixture = await getPlatformFixture(request, 'worker_package_secret_boundary_seed');
  expect(registryFixture?.ok).toBe(true);
  expect(secretFixture?.ok).toBe(true);

  const entityResponse = await request.get(`/api/registry/entities/${encodeURIComponent(registryFixture.fixture.registryEntityId)}`, {
    failOnStatusCode: false,
  });
  expect(entityResponse.status()).toBe(200);
  const entityPayload = await entityResponse.json();
  const entityJson = JSON.stringify(entityPayload?.data?.entity?.workerPackage || {});

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const seededHouse = await seedRecoverableTokenHouse(request);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const install = await installHouseWorker(page.request, {
    registryEntityId: registryFixture.fixture.registryEntityId,
  });
  expect(install.status).toBe(200);
  expect(install.json?.data?.deployment?.status).toBe('brain_binding_required');
  expect(install.json?.data?.guidance?.nextStep).toContain('Connect a local brain');

  const share = await shareHouseWorker(page.request, {
    deploymentId: install.json?.data?.deployment?.deploymentId,
  });
  expect(share.status).toBe(200);
  const shareDetail = await getHouseWorkerShare(page.request, share.json?.data?.shareId);
  expect(shareDetail.status).toBe(200);

  const shareJson = JSON.stringify(share.json?.data?.portable || {});
  const shareDetailJson = JSON.stringify(shareDetail.json?.data?.portable || {});
  for (const forbiddenField of secretFixture.fixture.forbiddenFields || []) {
    expect(entityJson).not.toContain(String(forbiddenField));
    expect(shareJson).not.toContain(String(forbiddenField));
    expect(shareDetailJson).not.toContain(String(forbiddenField));
  }
});
