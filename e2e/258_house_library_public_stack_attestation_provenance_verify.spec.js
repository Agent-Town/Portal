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
  exportPlatformSnapshot,
  getPlatformInspector,
  getPlatformStats,
  importPlatformSnapshot,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');
const {
  seedPublishedHouseLibraryPublicStack,
} = require('./helpers/house_library_public_stacks');

async function seedSealedAttestation(page, {
  libraryPublicStackId = '',
  signer = null,
  idPrefix = '',
} = {}) {
  const reviewResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': `${idPrefix}-review-001` },
    data: {
      reviewTier: 'trusted_here',
      note: `${idPrefix} review`,
    },
  });
  expect(reviewResp.status).toBe(201);

  const attestationResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations`, {
    method: 'POST',
    headers: { 'Idempotency-Key': `${idPrefix}-attestation-001` },
    data: {},
  });
  expect(attestationResp.status).toBe(201);
  const attestationId = String(attestationResp.json?.data?.attestation?.libraryPublicStackAttestationId || '');
  const provenanceDraft = attestationResp.json?.data?.preview?.localAttestation?.provenanceDraft || null;
  const sealResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations/${encodeURIComponent(attestationId)}/provenance`, {
    method: 'POST',
    headers: { 'Idempotency-Key': `${idPrefix}-seal-001` },
    data: {
      chain: 'solana',
      walletAddress: signer.address,
      signature: signer.signMessage(String(provenanceDraft?.message || '')).toString('base64'),
    },
  });
  expect(sealResp.status).toBe(201);
  return {
    attestationId,
    provenanceId: String(sealResp.json?.data?.provenance?.libraryPublicStackAttestationProvenanceId || ''),
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M37.4: target House checks one seal idempotently and persists both verified and mismatch receipts', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_provenance_verify_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_provenance_verify_target_01',
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

  const validStack = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-public-stack-attestation-provenance-verify-valid',
    title: 'Verified Seal Pack',
    scopeTitle: 'Verified Seal Pack',
  });
  const mismatchStack = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-public-stack-attestation-provenance-verify-mismatch',
    title: 'Mismatch Seal Pack',
    scopeTitle: 'Mismatch Seal Pack',
  });
  const signer = createDeterministicSolanaSigner({
    seedLabel: 'house-library-public-stack-attestation-provenance-verify',
  });
  const validMeta = await seedSealedAttestation(page, {
    libraryPublicStackId: validStack.libraryPublicStackId,
    signer,
    idPrefix: 'house-library-public-stack-attestation-provenance-verify-valid',
  });
  const mismatchMeta = await seedSealedAttestation(page, {
    libraryPublicStackId: mismatchStack.libraryPublicStackId,
    signer,
    idPrefix: 'house-library-public-stack-attestation-provenance-verify-mismatch',
  });

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const missingIdempotency = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(validStack.libraryPublicStackId)}/attestations/${encodeURIComponent(validMeta.attestationId)}/provenance/${encodeURIComponent(validMeta.provenanceId)}/verifications`, {
    method: 'POST',
    data: {},
  });
  expect(missingIdempotency.status).toBe(400);
  expect(missingIdempotency.json?.error?.code || missingIdempotency.json?.code).toBe('LIBRARY_IDEMPOTENCY_REQUIRED');

  const missingProvenance = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(validStack.libraryPublicStackId)}/attestations/${encodeURIComponent(validMeta.attestationId)}/provenance/pstprov_missing/verifications`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-verify-missing-001' },
    data: {},
  });
  expect(missingProvenance.status).toBe(409);
  expect(missingProvenance.json?.error?.code || missingProvenance.json?.code).toBe('LIBRARY_PUBLIC_STACK_ATTESTATION_PROVENANCE_REQUIRED');

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);
  const reviewCountBefore = Number(statsBefore?.stats?.counts?.library_public_stack_reviews || 0);

  const validVerify = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(validStack.libraryPublicStackId)}/attestations/${encodeURIComponent(validMeta.attestationId)}/provenance/${encodeURIComponent(validMeta.provenanceId)}/verifications`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-verify-valid-001' },
    data: {},
  });
  expect(validVerify.status).toBe(201);
  expect(validVerify.json?.data?.verificationReceipt).toMatchObject({
    libraryPublicStackAttestationProvenanceId: validMeta.provenanceId,
    libraryPublicStackAttestationId: validMeta.attestationId,
    libraryPublicStackId: validStack.libraryPublicStackId,
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    verificationStatus: 'verified',
    verifiedSignerAddress: signer.address,
    verifiedChain: 'solana',
  });

  const statsAfterValid = await getPlatformStats(request);
  expect(Number(statsAfterValid?.stats?.counts?.library_public_stack_attestation_verification_receipts || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_public_stack_attestation_verification_receipts || 0) + 1
  );
  expect(Number(statsAfterValid?.stats?.counts?.library_public_stack_reviews || 0)).toBe(reviewCountBefore);

  const validReplay = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(validStack.libraryPublicStackId)}/attestations/${encodeURIComponent(validMeta.attestationId)}/provenance/${encodeURIComponent(validMeta.provenanceId)}/verifications`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-verify-valid-001' },
    data: {},
  });
  expect(validReplay.status).toBe(200);
  expect(validReplay.json?.data?.verificationReceipt?.libraryPublicStackAttestationVerificationReceiptId).toBe(
    validVerify.json?.data?.verificationReceipt?.libraryPublicStackAttestationVerificationReceiptId
  );

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterValid?.stats?.counts);

  const exported = await exportPlatformSnapshot(request);
  expect(exported.status).toBe(200);
  const snapshot = exported.json?.snapshot;
  const tamperedSnapshot = JSON.parse(JSON.stringify(snapshot));
  const tamperedRow = Array.isArray(tamperedSnapshot?.tables?.library_public_stack_attestation_provenance)
    ? tamperedSnapshot.tables.library_public_stack_attestation_provenance.find((row) => String(row?.library_public_stack_attestation_provenance_id || '').trim() === mismatchMeta.provenanceId)
    : null;
  expect(tamperedRow).toBeTruthy();
  tamperedRow.signature = Buffer.alloc(64, 7).toString('base64');

  const imported = await importPlatformSnapshot(request, tamperedSnapshot, { reset: true });
  expect(imported.status).toBe(200);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const mismatchVerify = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(mismatchStack.libraryPublicStackId)}/attestations/${encodeURIComponent(mismatchMeta.attestationId)}/provenance/${encodeURIComponent(mismatchMeta.provenanceId)}/verifications`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-verify-mismatch-001' },
    data: {},
  });
  expect(mismatchVerify.status).toBe(201);
  expect(mismatchVerify.json?.data?.verificationReceipt).toMatchObject({
    libraryPublicStackAttestationProvenanceId: mismatchMeta.provenanceId,
    verificationStatus: 'mismatch',
    verificationReason: 'SIGNATURE_MISMATCH',
    verifiedSignerAddress: signer.address,
    verifiedChain: 'solana',
  });

  const finalStats = await getPlatformStats(request);
  expect(Number(finalStats?.stats?.counts?.library_public_stack_attestation_verification_receipts || 0)).toBe(
    Number(statsAfterReplay?.stats?.counts?.library_public_stack_attestation_verification_receipts || 0) + 1
  );
  expect(Number(finalStats?.stats?.counts?.library_public_stack_reviews || 0)).toBe(reviewCountBefore);

  const inspector = await getPlatformInspector(request, 'public-stack-attestation-verification-receipts');
  expect(inspector.status).toBe(200);
  expect(inspector.json?.data?.verificationReceipts).toEqual(expect.arrayContaining([
    expect.objectContaining({
      libraryPublicStackAttestationProvenanceId: validMeta.provenanceId,
      verificationStatus: 'verified',
    }),
    expect.objectContaining({
      libraryPublicStackAttestationProvenanceId: mismatchMeta.provenanceId,
      verificationStatus: 'mismatch',
      verificationReason: 'SIGNATURE_MISMATCH',
    }),
  ]));
});
