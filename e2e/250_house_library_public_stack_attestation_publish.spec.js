const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  getPlatformInspector,
  getPlatformStats,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';
const APPROVED_PUBLIC_STACK_ID = 'appr_fixture_library_public_stack_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M36.1: target House publishes one Public Stack attestation from an existing local review with idempotent replay', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_target_01',
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

  const itemResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-alpha-001' },
    data: {
      itemType: 'library_note',
      title: 'Attestation Notes',
      summary: 'Seed item for Public Stack attestation.',
      contentText: 'Attestation Notes should become the public stack member used in M36.1.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-public-stack-attestation-alpha-001',
      visibility: 'house_private',
    },
  });
  expect(itemResp.status).toBe(201);
  const libraryItemId = String(itemResp.json?.data?.item?.libraryItemId || '');

  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_public_stack_attestation_01',
      title: 'Attestation Pack',
      itemIds: [libraryItemId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);

  const publicationResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-publish-001' },
    data: {
      libraryItemId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(publicationResp.status).toBe(201);

  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-stack-001' },
    data: {
      scopeSetId: 'scope_public_stack_attestation_01',
      approvalId: APPROVED_PUBLIC_STACK_ID,
    },
  });
  expect(publicStackResp.status).toBe(201);
  const libraryPublicStackId = String(publicStackResp.json?.data?.publicStack?.libraryPublicStackId || '');

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const missingIdempotency = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations`, {
    method: 'POST',
    data: {},
  });
  expect(missingIdempotency.status).toBe(400);
  expect(missingIdempotency.json?.error?.code || missingIdempotency.json?.code).toBe('LIBRARY_IDEMPOTENCY_REQUIRED');

  const missingLocalReview = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-missing-review-001' },
    data: {},
  });
  expect(missingLocalReview.status).toBe(409);
  expect(missingLocalReview.json?.error?.code || missingLocalReview.json?.code).toBe('LIBRARY_PUBLIC_STACK_REVIEW_REQUIRED');

  const reviewResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-review-001' },
    data: {
      reviewTier: 'trusted_here',
      note: 'Use this inside launch prep in this House.',
    },
  });
  expect(reviewResp.status).toBe(201);
  const reviewId = String(reviewResp.json?.data?.review?.libraryPublicStackReviewId || '');

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  const firstAttestation = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-target-001' },
    data: {},
  });
  expect(firstAttestation.status).toBe(201);
  expect(firstAttestation.json?.data?.attestation).toMatchObject({
    libraryPublicStackId,
    libraryPublicStackReviewId: reviewId,
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    reviewTier: 'trusted_here',
    note: 'Use this inside launch prep in this House.',
  });
  expect(String(firstAttestation.json?.data?.attestation?.summary || '')).toContain('This House attests this Public Stack as trusted here.');

  const statsAfterFirst = await getPlatformStats(request);
  expect(Number(statsAfterFirst?.stats?.counts?.library_public_stack_attestations || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stack_attestations || 0) + 1);

  const replay = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-target-001' },
    data: {},
  });
  expect(replay.status).toBe(200);
  expect(replay.json?.data?.attestation?.libraryPublicStackAttestationId).toBe(firstAttestation.json?.data?.attestation?.libraryPublicStackAttestationId);

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterFirst?.stats?.counts);

  const inspector = await getPlatformInspector(request, 'public-stack-attestations');
  expect(inspector.status).toBe(200);
  expect(Array.isArray(inspector.json?.data?.attestations)).toBe(true);
  expect(inspector.json.data.attestations).toHaveLength(1);
  expect(inspector.json.data.attestations[0]).toMatchObject({
    libraryPublicStackId,
    libraryPublicStackReviewId: reviewId,
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    reviewTier: 'trusted_here',
    note: 'Use this inside launch prep in this House.',
  });
});
