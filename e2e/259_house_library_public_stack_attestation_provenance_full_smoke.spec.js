const { test, expect, request: playwrightRequest } = require('@playwright/test');

const {
  installDeterministicSigningSolanaWallet,
  seedRecoverableTokenHouse,
} = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformStats,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');
const {
  openHouseLibraryPublicStackPreview,
  openHouseLibraryPreviewDetails,
  saveHouseLibraryReview,
  seedPublishedHouseLibraryPublicStack,
} = require('./helpers/house_library_public_stacks');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M37.5: House Library stays same-shell from source attestation seal through target seal check', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });
  await installDeterministicSigningSolanaWallet(page, {
    seedLabel: 'house-library-public-stack-attestation-provenance-full-smoke',
  });

  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_provenance_full_smoke_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_provenance_full_smoke_target_01',
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(sourceConfig?.ok).toBe(true);
  expect(targetConfig?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  let attached = await attachHouseToPageSession(page, {
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const { libraryPublicStackId } = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-public-stack-attestation-provenance-full-smoke',
    title: 'Journey Provenance Pack',
    scopeTitle: 'Journey Provenance Pack',
  });

  const initialSessionId = await readWorkerSessionId(page);
  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  await openHouseLibraryPublicStackPreview(page, {
    title: 'Journey Provenance Pack',
  });
  await saveHouseLibraryReview(page, {
    reviewTier: 'trusted_here',
    note: 'Seal this for cross-house reuse.',
  });
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved local review Trusted here for Journey Provenance Pack.');

  await page.getByTestId('house-library-guided-attest-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Published attestation for Journey Provenance Pack.');

  await page.getByTestId('house-library-guided-seal-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Sealed attestation for Journey Provenance Pack.');
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Unchecked seal');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await openHouseLibraryPublicStackPreview(page, {
    title: 'Journey Provenance Pack',
  });
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Unchecked seal');
  await page.getByTestId('house-library-guided-check-seal-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Checked seal for Journey Provenance Pack.');
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Verified seal');
  await expect(page.getByTestId('house-library-registry-preview')).not.toContainText('Local review:');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfter = await getPlatformStats(request);
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_reviews || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_public_stack_reviews || 0) + 1
  );
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_attestations || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_public_stack_attestations || 0) + 1
  );
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_attestation_provenance || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_public_stack_attestation_provenance || 0) + 1
  );
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_attestation_verification_receipts || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_public_stack_attestation_verification_receipts || 0) + 1
  );
  expect(Number(statsAfter?.stats?.counts?.library_items || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_items || 0)
  );
  expect(Number(statsAfter?.stats?.counts?.scope_sets || 0)).toBe(
    Number(statsBefore?.stats?.counts?.scope_sets || 0)
  );
  expect(Number(statsAfter?.stats?.counts?.scope_set_items || 0)).toBe(
    Number(statsBefore?.stats?.counts?.scope_set_items || 0)
  );
  expect(libraryPublicStackId).toMatch(/^pstack_/);
});
