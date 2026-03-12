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

test('M35.1: target House saves one local Public Stack review tier with idempotent replay and stable row updates', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_review_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_review_target_01',
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

  const alphaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-alpha-001' },
    data: {
      itemType: 'library_note',
      title: 'Review Notes',
      summary: 'First review member.',
      contentText: 'Review Notes should live inside a locally reviewed public stack.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-public-stack-review-alpha-001',
      visibility: 'house_private',
    },
  });
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-beta-001' },
    data: {
      itemType: 'playbook',
      title: 'Review Checklist',
      summary: 'Second review member.',
      contentText: 'Review Checklist should remain in the reviewed pack.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/review-checklist.md',
      visibility: 'house_private',
    },
  });
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_public_stack_review_01',
      title: 'Review Pack',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-publish-alpha-001' },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-publish-beta-001' },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-create-001' },
    data: {
      scopeSetId: 'scope_public_stack_review_01',
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

  const missingIdempotency = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    data: {
      reviewTier: 'trusted_here',
    },
  });
  expect(missingIdempotency.status).toBe(400);
  expect(missingIdempotency.json?.error?.code || missingIdempotency.json?.code).toBe('LIBRARY_IDEMPOTENCY_REQUIRED');

  const missingStack = await callPageJson(page, '/api/platform/library/public-stacks/pstack_missing/reviews', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-missing-001' },
    data: {
      reviewTier: 'trusted_here',
    },
  });
  expect(missingStack.status).toBe(404);
  expect(missingStack.json?.error?.code || missingStack.json?.code).toBe('PUBLIC_STACK_NOT_FOUND');

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  const firstReviewResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-target-001' },
    data: {
      reviewTier: 'trusted_here',
      note: 'Use this for launch prep.',
    },
  });
  expect(firstReviewResp.status).toBe(201);
  expect(firstReviewResp.json?.data?.review).toMatchObject({
    libraryPublicStackId,
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    reviewTier: 'trusted_here',
    note: 'Use this for launch prep.',
  });
  expect(String(firstReviewResp.json?.data?.review?.summary || '')).toContain('Trusted here');

  const statsAfterFirst = await getPlatformStats(request);
  expect(Number(statsAfterFirst?.stats?.counts?.library_public_stack_reviews || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stack_reviews || 0) + 1);

  const replayResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-target-001' },
    data: {
      reviewTier: 'trusted_here',
      note: 'Use this for launch prep.',
    },
  });
  expect(replayResp.status).toBe(200);
  expect(replayResp.json?.data?.review?.libraryPublicStackReviewId).toBe(firstReviewResp.json?.data?.review?.libraryPublicStackReviewId);

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterFirst?.stats?.counts);

  const updateResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-target-002' },
    data: {
      reviewTier: 'blocked_here',
      note: 'Skip this in this House.',
    },
  });
  expect(updateResp.status).toBe(200);
  expect(updateResp.json?.data?.review).toMatchObject({
    libraryPublicStackId,
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    reviewTier: 'blocked_here',
    note: 'Skip this in this House.',
  });
  expect(updateResp.json?.data?.review?.libraryPublicStackReviewId).toBe(firstReviewResp.json?.data?.review?.libraryPublicStackReviewId);
  expect(String(updateResp.json?.data?.review?.summary || '')).toContain('Blocked here');

  const statsAfterUpdate = await getPlatformStats(request);
  expect(statsAfterUpdate?.stats?.counts).toEqual(statsAfterFirst?.stats?.counts);

  const reviewsInspector = await getPlatformInspector(request, 'public-stack-reviews');
  expect(reviewsInspector.status).toBe(200);
  expect(Array.isArray(reviewsInspector.json?.data?.reviews)).toBe(true);
  expect(reviewsInspector.json.data.reviews).toHaveLength(1);
  expect(reviewsInspector.json.data.reviews[0]).toMatchObject({
    libraryPublicStackId,
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    reviewTier: 'blocked_here',
    note: 'Skip this in this House.',
  });
});
