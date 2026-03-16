const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  getPlatformTeamBinding,
  promotePlatformConfigVersion,
  readWorkerSessionId,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId, overrides = {}) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.10`,
    branch: 'house-workshop',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_workshop_01',
      teamCompositionVersionId: 'tcv_house_workshop_01',
      agentConfigVersionIds: ['agv_house_workshop_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_workshop_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_workshop_01',
    },
    ...overrides,
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.6: House Workshop shows active config lineage and opens Inbox inside the same shell', async ({ page, request }) => {
  test.slow();
  test.setTimeout(180_000);
  const seededHouse = await seedRecoverableTokenHouse(request);

  const configAResp = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-workshop-config-a-001',
    payload: buildConfigPayload('cfg_house_workshop_a_01'),
  });
  expect(configAResp.status).toBe(201);

  const configBResp = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-workshop-config-b-001',
    payload: buildConfigPayload('cfg_house_workshop_b_01', {
      parentConfigVersionIds: ['cfg_house_workshop_a_01'],
      componentRefs: {
        housePolicyVersionId: 'hpv_house_workshop_01',
        teamCompositionVersionId: 'tcv_house_workshop_02',
        agentConfigVersionIds: ['agv_house_workshop_02'],
        officePolicyVersionIds: [],
        experiencePresetVersionId: 'epv_house_workshop_01',
        integrationOverlayVersionIds: [],
        trainerPresetVersionId: 'tpv_house_workshop_01',
      },
    }),
  });
  expect(configBResp.status).toBe(201);

  const promoteA = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_house_workshop_a_01',
    teamId: 'team_main',
    idempotencyKey: 'house-workshop-promote-a-001',
  });
  expect(promoteA.status).toBe(200);

  const promoteB = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_house_workshop_b_01',
    teamId: 'team_main',
    idempotencyKey: 'house-workshop-promote-b-001',
  });
  expect(promoteB.status).toBe(200);

  const activeBinding = await getPlatformTeamBinding(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    teamId: 'team_main',
  });
  expect(activeBinding.status).toBe(200);
  expect(String(activeBinding.json?.data?.activeConfigVersionId || '')).toBe('cfg_house_workshop_b_01');

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const initialSessionId = await readWorkerSessionId(page);

  const workshopResponseA = await page.request.get('/api/platform/workshop');
  expect(workshopResponseA.ok()).toBe(true);
  const workshopBodyA = await workshopResponseA.json();
  expect(workshopBodyA?.data).toMatchObject({
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    activeConfigVersionId: 'cfg_house_workshop_b_01',
    inboxPath: `/inbox/${seededHouse.houseId}`,
    lineage: {
      parentConfigVersionIds: ['cfg_house_workshop_a_01'],
    },
  });

  const workshopResponseB = await page.request.get('/api/platform/workshop');
  expect(workshopResponseB.ok()).toBe(true);
  const workshopBodyB = await workshopResponseB.json();
  expect(workshopBodyB?.data).toEqual(workshopBodyA?.data);

  await page.getByTestId('house-open-workshop').click();
  await expect(page.getByTestId('house-workshop-panel')).toBeVisible();
  await expect(page.getByTestId('house-workshop-detail')).toContainText('cfg_house_workshop_b_01');
  await expect(page.getByTestId('house-workshop-detail')).toContainText('cfg_house_workshop_a_01');
  await expect(page.getByTestId('house-workshop-open-inbox')).toHaveAttribute('data-entry-path', `/inbox/${seededHouse.houseId}`);

  await page.getByTestId('house-workshop-open-inbox').click();
  await expect(page.locator('#districtModalTitle')).toHaveText('Inbox');
  await expect(page.locator('#districtModalBody iframe.districtFrame')).toHaveAttribute('src', new RegExp(`/inbox/${seededHouse.houseId}$`));
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  const afterInboxSessionId = await readWorkerSessionId(page);
  expect(afterInboxSessionId).toBe(initialSessionId);
});
