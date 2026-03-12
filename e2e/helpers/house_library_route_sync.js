const { expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./phase1');
const { waitForLiteApi } = require('./trainer');
const {
  attachHouseToPageSession,
  seedPlatformConfigVersion,
} = require('./unified_platform');
const {
  seedPublishedHouseLibraryPublicStack,
} = require('./house_library_public_stacks');

async function seedHouseLibraryRouteSyncScene(page, request, playwrightRequest, {
  titlePrefix = 'Route Sync',
  stackCount = 2,
} = {}) {
  const normalizedPrefix = String(titlePrefix || 'Route Sync').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'Route-Sync';
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  expect((await seedPlatformConfigVersion(request, {
    configVersionId: `cfg_${String(normalizedPrefix).toLowerCase().replace(/[^a-z0-9]+/g, '_')}_source_01`,
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  }))?.ok).toBe(true);
  expect((await seedPlatformConfigVersion(request, {
    configVersionId: `cfg_${String(normalizedPrefix).toLowerCase().replace(/[^a-z0-9]+/g, '_')}_target_01`,
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  }))?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  let attached = await attachHouseToPageSession(page, {
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const stacks = [];
  for (let index = 0; index < Math.max(1, Number(stackCount || 1)); index += 1) {
    stacks.push(await seedPublishedHouseLibraryPublicStack(page, {
      idPrefix: `${normalizedPrefix}-stack-${index + 1}`,
      title: `${titlePrefix} Pack ${index + 1}`,
    }));
  }

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  return {
    sourceHouse,
    targetHouse,
    stacks,
  };
}

module.exports = {
  seedHouseLibraryRouteSyncScene,
};
