const { test, expect } = require('@playwright/test');

const {
  createDeterministicSolanaSigner,
  seedRecoverableTokenHouse,
} = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  getPlatformInspector,
  getPlatformStats,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');
const {
  seedPublishedHouseLibraryPublicStack,
} = require('./helpers/house_library_public_stacks');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M37.1: source House seals one published attestation with a deterministic wallet proof and idempotent replay', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_provenance_publish_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(sourceConfig?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  const attached = await attachHouseToPageSession(page, {
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const { libraryPublicStackId } = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-public-stack-attestation-provenance-publish',
    title: 'Journey Seal Pack',
    scopeTitle: 'Journey Seal Pack',
  });

  const signer = createDeterministicSolanaSigner({
    seedLabel: 'house-library-public-stack-attestation-provenance-publish',
  });
  const placeholderSignature = signer.signMessage('journey-seal-pack').toString('base64');

  const missingAttestation = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations/attestation_missing/provenance`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-missing-attestation-001' },
    data: {
      chain: 'solana',
      walletAddress: signer.address,
      signature: placeholderSignature,
    },
  });
  expect(missingAttestation.status).toBe(409);
  expect(missingAttestation.json?.error?.code || missingAttestation.json?.code).toBe('LIBRARY_PUBLIC_STACK_ATTESTATION_REQUIRED');

  const reviewResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-review-001' },
    data: {
      reviewTier: 'trusted_here',
      note: 'Seal this for trusted reuse.',
    },
  });
  expect(reviewResp.status).toBe(201);

  const attestationResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-attestation-001' },
    data: {},
  });
  expect(attestationResp.status).toBe(201);
  const attestationId = String(attestationResp.json?.data?.attestation?.libraryPublicStackAttestationId || '');
  const provenanceDraft = attestationResp.json?.data?.preview?.localAttestation?.provenanceDraft || null;
  expect(provenanceDraft).toEqual(expect.objectContaining({
    messageVersion: 'v1',
    libraryPublicStackAttestationId: attestationId,
    libraryPublicStackId,
  }));

  const missingSignature = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations/${encodeURIComponent(attestationId)}/provenance`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-missing-signature-001' },
    data: {
      chain: 'solana',
      walletAddress: signer.address,
    },
  });
  expect(missingSignature.status).toBe(400);
  expect(missingSignature.json?.error?.code || missingSignature.json?.code).toBe('WALLET_SIGNATURE_REQUIRED');

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  const firstSeal = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations/${encodeURIComponent(attestationId)}/provenance`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-publish-001' },
    data: {
      chain: 'solana',
      walletAddress: signer.address,
      signature: signer.signMessage(String(provenanceDraft?.message || '')).toString('base64'),
    },
  });
  expect(firstSeal.status).toBe(201);
  expect(firstSeal.json?.data?.provenance).toMatchObject({
    libraryPublicStackAttestationId: attestationId,
    libraryPublicStackId,
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    chain: 'solana',
    walletAddress: signer.address,
    messageVersion: 'v1',
    messageDigest: String(provenanceDraft?.messageDigest || ''),
  });

  const statsAfterFirst = await getPlatformStats(request);
  expect(Number(statsAfterFirst?.stats?.counts?.library_public_stack_attestation_provenance || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_public_stack_attestation_provenance || 0) + 1
  );

  const replay = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations/${encodeURIComponent(attestationId)}/provenance`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-publish-001' },
    data: {
      chain: 'solana',
      walletAddress: signer.address,
      signature: signer.signMessage(String(provenanceDraft?.message || '')).toString('base64'),
    },
  });
  expect(replay.status).toBe(200);
  expect(replay.json?.data?.provenance?.libraryPublicStackAttestationProvenanceId).toBe(
    firstSeal.json?.data?.provenance?.libraryPublicStackAttestationProvenanceId
  );

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterFirst?.stats?.counts);

  const inspector = await getPlatformInspector(request, 'public-stack-attestation-provenance');
  expect(inspector.status).toBe(200);
  expect(inspector.json?.data?.provenance).toHaveLength(1);
  expect(inspector.json.data.provenance[0]).toMatchObject({
    libraryPublicStackAttestationId: attestationId,
    libraryPublicStackId,
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    chain: 'solana',
    walletAddress: signer.address,
  });
});
