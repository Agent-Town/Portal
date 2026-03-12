const { expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./phase1');
const { waitForLiteApi } = require('./trainer');
const {
  attachHouseToPageSession,
  seedPlatformConfigVersion,
} = require('./unified_platform');
const {
  importHouseLibraryPublicStackApi,
  publishHouseLibraryAttestationApi,
  saveHouseLibraryReviewApi,
  seedPublishedHouseLibraryPublicStack,
} = require('./house_library_public_stacks');

async function seedHouseLibraryDiscoveryScene(page, request, playwrightRequest, {
  titlePrefix = 'Discovery',
} = {}) {
  const normalizedPrefix = String(titlePrefix || 'Discovery').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'Discovery';
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  expect((await seedPlatformConfigVersion(request, {
    configVersionId: `cfg_${String(normalizedPrefix || 'discovery').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_source_01`,
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  }))?.ok).toBe(true);
  expect((await seedPlatformConfigVersion(request, {
    configVersionId: `cfg_${String(normalizedPrefix || 'discovery').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_target_01`,
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

  const readyStack = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: `${normalizedPrefix}-ready`,
    title: `${titlePrefix} Ready Pack`,
  });
  const checkStack = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: `${normalizedPrefix}-check`,
    title: `${titlePrefix} Check Pack`,
  });
  const attestedStack = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: `${normalizedPrefix}-attested`,
    title: `${titlePrefix} Attested Pack`,
  });
  const importedStack = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: `${normalizedPrefix}-imported`,
    title: `${titlePrefix} Imported Pack`,
  });

  let response = await saveHouseLibraryReviewApi(page, {
    libraryPublicStackId: attestedStack.libraryPublicStackId,
    reviewTier: 'trusted_here',
    note: 'Publish this attestation from the source House.',
    idempotencyKey: `${normalizedPrefix}-attested-review-001`,
  });
  expect(response.status).toBe(201);
  response = await publishHouseLibraryAttestationApi(page, {
    libraryPublicStackId: attestedStack.libraryPublicStackId,
    idempotencyKey: `${normalizedPrefix}-attested-attestation-001`,
  });
  expect(response.status).toBe(201);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  response = await saveHouseLibraryReviewApi(page, {
    libraryPublicStackId: readyStack.libraryPublicStackId,
    reviewTier: 'trusted_here',
    note: 'Ready here in the target House.',
    idempotencyKey: `${normalizedPrefix}-ready-review-001`,
  });
  expect(response.status).toBe(201);

  response = await saveHouseLibraryReviewApi(page, {
    libraryPublicStackId: checkStack.libraryPublicStackId,
    reviewTier: 'review_later',
    note: 'Keep this in the check lane.',
    idempotencyKey: `${normalizedPrefix}-check-review-001`,
  });
  expect(response.status).toBe(201);

  response = await importHouseLibraryPublicStackApi(page, {
    libraryPublicStackId: importedStack.libraryPublicStackId,
    idempotencyKey: `${normalizedPrefix}-imported-import-001`,
  });
  expect(response.status).toBe(201);

  return {
    sourceHouse,
    targetHouse,
    stacks: {
      ready: readyStack,
      check: checkStack,
      attested: attestedStack,
      imported: importedStack,
    },
  };
}

module.exports = {
  seedHouseLibraryDiscoveryScene,
};
