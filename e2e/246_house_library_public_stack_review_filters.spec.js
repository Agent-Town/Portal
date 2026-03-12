const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';
const APPROVED_PUBLIC_STACK_ID = 'appr_fixture_library_public_stack_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

async function createPublicStack(page, {
  suffix,
  title,
  summary,
  contentText,
} = {}) {
  const itemResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': `library-public-stack-review-filters-item-${suffix}` },
    data: {
      itemType: 'library_note',
      title,
      summary,
      contentText,
      sourceKind: 'user_note',
      sourceRef: `user_note:library-public-stack-review-filters-${suffix}`,
      visibility: 'house_private',
    },
  });
  const libraryItemId = String(itemResp.json?.data?.item?.libraryItemId || '');
  expect(libraryItemId).toBeTruthy();

  const scopeSetId = `scope_public_stack_review_filters_${suffix}`;
  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId,
      title,
      itemIds: [libraryItemId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);

  const publicationResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': `library-public-stack-review-filters-publish-${suffix}` },
    data: {
      libraryItemId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(publicationResp.status).toBe(201);

  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: { 'Idempotency-Key': `library-public-stack-review-filters-stack-${suffix}` },
    data: {
      scopeSetId,
      approvalId: APPROVED_PUBLIC_STACK_ID,
    },
  });
  expect(publicStackResp.status).toBe(201);
  return String(publicStackResp.json?.data?.publicStack?.libraryPublicStackId || '');
}

test('M35.2: Public Stack search filters by local review tier and preview exposes local review state without changing Registry preview', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_review_filters_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_review_filters_target_01',
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

  const trustedStackId = await createPublicStack(page, {
    suffix: 'trusted-001',
    title: 'Discovery Pack Trusted',
    summary: 'Trusted review fixture.',
    contentText: 'Trusted review fixture content.',
  });
  const reviewLaterStackId = await createPublicStack(page, {
    suffix: 'review-001',
    title: 'Discovery Pack Review',
    summary: 'Review later fixture.',
    contentText: 'Review later fixture content.',
  });
  const blockedStackId = await createPublicStack(page, {
    suffix: 'blocked-001',
    title: 'Discovery Pack Blocked',
    summary: 'Blocked review fixture.',
    contentText: 'Blocked review fixture content.',
  });

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const reviewCases = [
    {
      libraryPublicStackId: trustedStackId,
      reviewTier: 'trusted_here',
      note: 'Use this for launch prep.',
    },
    {
      libraryPublicStackId: reviewLaterStackId,
      reviewTier: 'review_later',
      note: 'Check this after the current sprint.',
    },
    {
      libraryPublicStackId: blockedStackId,
      reviewTier: 'blocked_here',
      note: 'Do not bring this into this House.',
    },
  ];
  for (const reviewCase of reviewCases) {
    const response = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(reviewCase.libraryPublicStackId)}/reviews`, {
      method: 'POST',
      headers: { 'Idempotency-Key': `library-public-stack-review-filters-${reviewCase.reviewTier}` },
      data: {
        reviewTier: reviewCase.reviewTier,
        note: reviewCase.note,
      },
    });
    expect(response.status).toBe(201);
  }

  const unfilteredSearch = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Discovery%20Pack&family=house_library_stacks');
  expect(unfilteredSearch.status).toBe(200);
  expect(unfilteredSearch.json?.data).toMatchObject({
    query: 'Discovery Pack',
    family: 'house_library_stacks',
    resultCount: 3,
  });
  expect(unfilteredSearch.json?.data?.results?.map((entry) => entry.registryId)).toEqual([
    blockedStackId,
    reviewLaterStackId,
    trustedStackId,
  ]);

  const trustedSearch = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Discovery%20Pack&family=house_library_stacks&trust=trusted_here');
  expect(trustedSearch.status).toBe(200);
  expect(trustedSearch.json?.data).toMatchObject({
    query: 'Discovery Pack',
    family: 'house_library_stacks',
    trust: 'trusted_here',
    resultCount: 1,
  });
  expect(trustedSearch.json?.data?.results?.[0]).toMatchObject({
    registryId: trustedStackId,
    registryEntityId: trustedStackId,
    reviewTier: 'trusted_here',
  });

  const reviewLaterSearch = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Discovery%20Pack&family=house_library_stacks&trust=review_later');
  expect(reviewLaterSearch.status).toBe(200);
  expect(reviewLaterSearch.json?.data).toMatchObject({
    trust: 'review_later',
    resultCount: 1,
  });
  expect(reviewLaterSearch.json?.data?.results?.[0]).toMatchObject({
    registryId: reviewLaterStackId,
    reviewTier: 'review_later',
  });

  const blockedSearch = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Discovery%20Pack&family=house_library_stacks&trust=blocked_here');
  expect(blockedSearch.status).toBe(200);
  expect(blockedSearch.json?.data).toMatchObject({
    trust: 'blocked_here',
    resultCount: 1,
  });
  expect(blockedSearch.json?.data?.results?.[0]).toMatchObject({
    registryId: blockedStackId,
    reviewTier: 'blocked_here',
  });

  const trustedPreview = await callPageJson(page, `/api/platform/library/public-stacks/preview/${encodeURIComponent(trustedStackId)}`);
  expect(trustedPreview.status).toBe(200);
  expect(trustedPreview.json?.data?.preview).toMatchObject({
    registryId: trustedStackId,
    libraryPublicStackId: trustedStackId,
    reviewTier: 'trusted_here',
    review: {
      libraryPublicStackId: trustedStackId,
      houseId: targetHouse.houseId,
      teamId: 'team_main',
      reviewTier: 'trusted_here',
      note: 'Use this for launch prep.',
    },
  });
  expect(String(trustedPreview.json?.data?.preview?.review?.summary || '')).toContain('Trusted here');

  const registryPreview = await callPageJson(page, '/api/platform/library/public-stacks/preview/reg_atlas_skill_01');
  expect(registryPreview.status).toBe(200);
  expect(registryPreview.json?.data?.preview).toMatchObject({
    registryId: 'reg_atlas_skill_01',
    family: 'skill',
  });
  expect(registryPreview.json?.data?.preview?.reviewTier).toBeUndefined();
  expect(registryPreview.json?.data?.preview?.review).toBeUndefined();
});
