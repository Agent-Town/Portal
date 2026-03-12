const { test, expect, request: playwrightRequest } = require('@playwright/test');

const {
  createDeterministicSolanaSigner,
  seedRecoverableTokenHouse,
} = require('./helpers/phase1');
const {
  openHouseLibraryPreviewDetails,
  openHouseLibraryPublicStackPreview,
  seedPublishedHouseLibraryPublicStack,
} = require('./helpers/house_library_public_stacks');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M38.2: preview hero keeps trust and seal posture visible while technical detail stays collapsed', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_icon_first_preview_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_icon_first_preview_target_01',
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
    idPrefix: 'house-library-icon-first-preview',
    title: 'Journey Icon Preview Pack',
    scopeTitle: 'Journey Icon Preview Pack',
  });
  const reviewResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-icon-first-preview-review-001' },
    data: {
      reviewTier: 'trusted_here',
      note: 'Seal this for icon preview.',
    },
  });
  expect(reviewResp.status).toBe(201);
  const attestationResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-icon-first-preview-attestation-001' },
    data: {},
  });
  expect(attestationResp.status).toBe(201);
  const attestationId = String(attestationResp.json?.data?.attestation?.libraryPublicStackAttestationId || '');
  const provenanceDraft = attestationResp.json?.data?.preview?.localAttestation?.provenanceDraft || null;
  const signer = createDeterministicSolanaSigner({ seedLabel: 'house-library-icon-first-preview' });
  const sealResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations/${encodeURIComponent(attestationId)}/provenance`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-icon-first-preview-seal-001' },
    data: {
      chain: 'solana',
      walletAddress: signer.address,
      signature: signer.signMessage(String(provenanceDraft?.message || '')).toString('base64'),
    },
  });
  expect(sealResp.status).toBe(201);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await openHouseLibraryPublicStackPreview(page, { title: 'Journey Icon Preview Pack' });
  await expect(page.getByTestId('house-library-preview-title')).toContainText('Journey Icon Preview Pack');
  await expect(page.getByTestId('house-library-preview-status')).toContainText('Seal');
  await expect(page.getByTestId('house-library-preview-sigils')).toContainText('[seal]');
  await expect(page.locator('#houseLibraryPreviewActionDock button:visible')).toHaveCount(3);
  await expect(page.getByTestId('house-library-guided-approval-input')).toBeHidden();
  await expect(page.getByTestId('house-library-registry-preview')).toBeHidden();

  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Journey Icon Preview Pack');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Signer');
});
