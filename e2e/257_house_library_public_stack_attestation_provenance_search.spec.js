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

async function reviewAttestAndMaybeSeal(page, {
  libraryPublicStackId = '',
  signer = null,
  seal = false,
  idPrefix = '',
} = {}) {
  const reviewResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': `${idPrefix}-review-001` },
    data: {
      reviewTier: 'trusted_here',
      note: `${idPrefix} trusted review`,
    },
  });
  expect(reviewResp.status).toBe(201);

  const attestationResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations`, {
    method: 'POST',
    headers: { 'Idempotency-Key': `${idPrefix}-attestation-001` },
    data: {},
  });
  expect(attestationResp.status).toBe(201);
  if (!seal) {
    return {
      attestationId: String(attestationResp.json?.data?.attestation?.libraryPublicStackAttestationId || ''),
      provenanceId: '',
    };
  }
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

test('M37.3: Public Stack search exposes deterministic seal posture and filters sealed vs verified-here results', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_provenance_search_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_provenance_search_target_01',
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

  const sealedStack = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-public-stack-attestation-provenance-search-aurora',
    title: 'Aurora Seal Pack',
    scopeTitle: 'Aurora Seal Pack',
  });
  const openStack = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-public-stack-attestation-provenance-search-beacon',
    title: 'Beacon Open Pack',
    scopeTitle: 'Beacon Open Pack',
  });
  const signer = createDeterministicSolanaSigner({
    seedLabel: 'house-library-public-stack-attestation-provenance-search',
  });
  const sealedMeta = await reviewAttestAndMaybeSeal(page, {
    libraryPublicStackId: sealedStack.libraryPublicStackId,
    signer,
    seal: true,
    idPrefix: 'house-library-public-stack-attestation-provenance-search-aurora',
  });
  await reviewAttestAndMaybeSeal(page, {
    libraryPublicStackId: openStack.libraryPublicStackId,
    signer,
    seal: false,
    idPrefix: 'house-library-public-stack-attestation-provenance-search-beacon',
  });

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const searchAll = await callPageJson(page, '/api/platform/library/public-stacks/search?family=house_library_stacks', {
    method: 'GET',
  });
  expect(searchAll.status).toBe(200);
  expect(searchAll.json?.data?.resultCount).toBe(2);
  expect(searchAll.json?.data?.results.map((entry) => entry.displayName)).toEqual([
    'Aurora Seal Pack',
    'Beacon Open Pack',
  ]);
  expect(searchAll.json?.data?.results[0]).toMatchObject({
    provenanceCounts: expect.objectContaining({
      sealed: 1,
      verifiedHere: 0,
    }),
  });
  expect(String(searchAll.json?.data?.results[0]?.provenanceSummary || '')).toContain('1 sealed');

  const searchSealed = await callPageJson(page, '/api/platform/library/public-stacks/search?family=house_library_stacks&seal=sealed', {
    method: 'GET',
  });
  expect(searchSealed.status).toBe(200);
  expect(searchSealed.json?.data?.resultCount).toBe(1);
  expect(searchSealed.json?.data?.results?.[0]?.displayName).toBe('Aurora Seal Pack');

  const searchVerifiedBefore = await callPageJson(page, '/api/platform/library/public-stacks/search?family=house_library_stacks&seal=verified_here', {
    method: 'GET',
  });
  expect(searchVerifiedBefore.status).toBe(200);
  expect(searchVerifiedBefore.json?.data?.resultCount).toBe(0);

  const verifyResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(sealedStack.libraryPublicStackId)}/attestations/${encodeURIComponent(sealedMeta.attestationId)}/provenance/${encodeURIComponent(sealedMeta.provenanceId)}/verifications`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-provenance-search-verify-001' },
    data: {},
  });
  expect(verifyResp.status).toBe(201);

  const searchVerifiedAfter = await callPageJson(page, '/api/platform/library/public-stacks/search?family=house_library_stacks&seal=verified_here', {
    method: 'GET',
  });
  expect(searchVerifiedAfter.status).toBe(200);
  expect(searchVerifiedAfter.json?.data?.resultCount).toBe(1);
  expect(searchVerifiedAfter.json?.data?.results?.[0]?.displayName).toBe('Aurora Seal Pack');
  expect(searchVerifiedAfter.json?.data?.results?.[0]).toMatchObject({
    provenanceCounts: expect.objectContaining({
      verifiedHere: 1,
    }),
  });
});
