const { test, expect, request: playwrightRequest } = require('@playwright/test');

const {
  createDeterministicSolanaSigner,
  seedRecoverableTokenHouse,
} = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');
const {
  seedPublishedHouseLibraryPublicStack,
} = require('./helpers/house_library_public_stacks');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M37.2: Public Stack preview projects unchecked and verified seal posture without losing review or attestation context', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_provenance_preview_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_provenance_preview_target_01',
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
    idPrefix: 'house-library-public-stack-attestation-provenance-preview',
    title: 'Journey Preview Seal Pack',
    scopeTitle: 'Journey Preview Seal Pack',
  });

  const reviewResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-preview-review-001' },
    data: {
      reviewTier: 'trusted_here',
      note: 'Preview this as a trusted pack.',
    },
  });
  expect(reviewResp.status).toBe(201);

  const attestationResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-preview-attestation-001' },
    data: {},
  });
  expect(attestationResp.status).toBe(201);
  const attestationId = String(attestationResp.json?.data?.attestation?.libraryPublicStackAttestationId || '');
  const preSealPreview = await callPageJson(page, `/api/platform/library/public-stacks/preview/${encodeURIComponent(libraryPublicStackId)}`, {
    method: 'GET',
  });
  expect(preSealPreview.status).toBe(200);
  expect(preSealPreview.json?.data?.preview).toMatchObject({
    libraryPublicStackId,
    reviewTier: 'trusted_here',
    attestationCounts: { total: 1, trustedHere: 1, reviewLater: 0, blockedHere: 0 },
  });
  expect(preSealPreview.json?.data?.preview?.localAttestation?.provenance).toBe(null);
  expect(preSealPreview.json?.data?.preview?.attestations?.[0]?.provenance).toBe(null);

  const signer = createDeterministicSolanaSigner({
    seedLabel: 'house-library-public-stack-attestation-provenance-preview',
  });
  const provenanceDraft = attestationResp.json?.data?.preview?.localAttestation?.provenanceDraft;
  const sealResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations/${encodeURIComponent(attestationId)}/provenance`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-preview-seal-001' },
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

  const uncheckedPreview = await callPageJson(page, `/api/platform/library/public-stacks/preview/${encodeURIComponent(libraryPublicStackId)}`, {
    method: 'GET',
  });
  expect(uncheckedPreview.status).toBe(200);
  expect(uncheckedPreview.json?.data?.preview?.review).toBe(null);
  expect(uncheckedPreview.json?.data?.preview?.attestations?.[0]).toMatchObject({
    houseId: sourceHouse.houseId,
    reviewTier: 'trusted_here',
    sealState: 'unchecked',
    provenance: expect.objectContaining({
      chain: 'solana',
      walletAddress: signer.address,
      walletAddressMasked: expect.stringContaining('...'),
      messageVersion: 'v1',
    }),
  });
  expect(String(uncheckedPreview.json?.data?.preview?.attestations?.[0]?.provenance?.signedAt || '')).toMatch(/T/);
  expect(uncheckedPreview.json?.data?.preview?.provenance).toMatchObject({
    sealState: 'unchecked',
  });
  expect(String(uncheckedPreview.json?.data?.preview?.provenance?.sealSummary || '')).toContain('1 sealed');

  const provenanceId = String(uncheckedPreview.json?.data?.preview?.attestations?.[0]?.provenance?.libraryPublicStackAttestationProvenanceId || '');
  const verifyResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations/${encodeURIComponent(attestationId)}/provenance/${encodeURIComponent(provenanceId)}/verifications`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-preview-verify-001' },
    data: {},
  });
  expect(verifyResp.status).toBe(201);

  const verifiedPreview = await callPageJson(page, `/api/platform/library/public-stacks/preview/${encodeURIComponent(libraryPublicStackId)}`, {
    method: 'GET',
  });
  expect(verifiedPreview.status).toBe(200);
  expect(verifiedPreview.json?.data?.preview?.attestations?.[0]).toMatchObject({
    sealState: 'verified',
    localVerificationReceipt: expect.objectContaining({
      verificationStatus: 'verified',
      verifiedSignerAddress: signer.address,
      verifiedChain: 'solana',
    }),
  });
  expect(verifiedPreview.json?.data?.preview?.provenance).toMatchObject({
    sealState: 'verified',
  });
});
