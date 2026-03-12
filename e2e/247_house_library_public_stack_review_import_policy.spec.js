const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  getPlatformStats,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';
const APPROVED_PUBLIC_STACK_ID = 'appr_fixture_library_public_stack_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

async function createSingleMemberPublicStack(page, {
  suffix,
  title,
  summary,
} = {}) {
  const itemResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': `library-public-stack-review-import-item-${suffix}` },
    data: {
      itemType: 'library_note',
      title,
      summary,
      contentText: `${title} content should stay deterministic through review import policy checks.`,
      sourceKind: 'user_note',
      sourceRef: `user_note:library-public-stack-review-import-${suffix}`,
      visibility: 'house_private',
    },
  });
  const libraryItemId = String(itemResp.json?.data?.item?.libraryItemId || '');
  expect(libraryItemId).toBeTruthy();

  const scopeSetId = `scope_public_stack_review_import_${suffix}`;
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
    headers: { 'Idempotency-Key': `library-public-stack-review-import-publish-${suffix}` },
    data: {
      libraryItemId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(publicationResp.status).toBe(201);

  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: { 'Idempotency-Key': `library-public-stack-review-import-stack-${suffix}` },
    data: {
      scopeSetId,
      approvalId: APPROVED_PUBLIC_STACK_ID,
    },
  });
  expect(publicStackResp.status).toBe(201);
  return String(publicStackResp.json?.data?.publicStack?.libraryPublicStackId || '');
}

async function saveReview(page, {
  libraryPublicStackId,
  reviewTier,
  note,
  suffix,
} = {}) {
  const response = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': `library-public-stack-review-import-review-${suffix}` },
    data: {
      reviewTier,
      note,
    },
  });
  expect(response.status).toBe(201);
}

function expectCountsEqual(actual = {}, expected = {}, keys = []) {
  keys.forEach((key) => {
    expect(Number(actual?.[key] || 0)).toBe(Number(expected?.[key] || 0));
  });
}

test('M35.3: blocked-here refuses import locally while trusted and review-later remain importable with deterministic replay', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_review_import_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_review_import_target_01',
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

  const blockedStackId = await createSingleMemberPublicStack(page, {
    suffix: 'blocked-001',
    title: 'Policy Pack Blocked',
    summary: 'Blocked policy fixture.',
  });
  const trustedStackId = await createSingleMemberPublicStack(page, {
    suffix: 'trusted-001',
    title: 'Policy Pack Trusted',
    summary: 'Trusted policy fixture.',
  });
  const reviewLaterStackId = await createSingleMemberPublicStack(page, {
    suffix: 'review-001',
    title: 'Policy Pack Review',
    summary: 'Review-later policy fixture.',
  });

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await saveReview(page, {
    libraryPublicStackId: blockedStackId,
    reviewTier: 'blocked_here',
    note: 'Never import this here.',
    suffix: 'blocked-001',
  });
  await saveReview(page, {
    libraryPublicStackId: trustedStackId,
    reviewTier: 'trusted_here',
    note: 'Approved for this House.',
    suffix: 'trusted-001',
  });
  await saveReview(page, {
    libraryPublicStackId: reviewLaterStackId,
    reviewTier: 'review_later',
    note: 'Allow import while waiting on a final decision.',
    suffix: 'review-001',
  });

  const trackedKeys = [
    'library_items',
    'library_links',
    'scope_sets',
    'scope_set_items',
    'library_public_stack_verifications',
    'library_public_stack_verification_members',
  ];
  const statsBeforeBlocked = await getPlatformStats(request);
  expect(statsBeforeBlocked?.ok).toBe(true);

  const blockedResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(blockedStackId)}/imports`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-import-blocked-001' },
    data: {},
  });
  expect(blockedResp.status).toBe(409);
  expect(blockedResp.json?.error?.code || blockedResp.json?.code).toBe('LIBRARY_PUBLIC_STACK_BLOCKED_HERE');

  const statsAfterBlocked = await getPlatformStats(request);
  expectCountsEqual(statsAfterBlocked?.stats?.counts, statsBeforeBlocked?.stats?.counts, trackedKeys);

  const trustedImportResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(trustedStackId)}/imports`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-import-trusted-001' },
    data: {},
  });
  expect(trustedImportResp.status).toBe(201);
  expect(trustedImportResp.json?.data?.import).toMatchObject({
    libraryPublicStackId: trustedStackId,
    importedCount: 1,
    memberCount: 1,
  });

  const statsAfterTrustedImport = await getPlatformStats(request);
  expect(Number(statsAfterTrustedImport?.stats?.counts?.library_items || 0)).toBe(Number(statsAfterBlocked?.stats?.counts?.library_items || 0) + 1);
  expect(Number(statsAfterTrustedImport?.stats?.counts?.library_links || 0)).toBe(Number(statsAfterBlocked?.stats?.counts?.library_links || 0) + 2);
  expect(Number(statsAfterTrustedImport?.stats?.counts?.scope_sets || 0)).toBe(Number(statsAfterBlocked?.stats?.counts?.scope_sets || 0) + 1);
  expect(Number(statsAfterTrustedImport?.stats?.counts?.scope_set_items || 0)).toBe(Number(statsAfterBlocked?.stats?.counts?.scope_set_items || 0) + 1);
  expect(Number(statsAfterTrustedImport?.stats?.counts?.library_public_stack_verifications || 0)).toBe(Number(statsAfterBlocked?.stats?.counts?.library_public_stack_verifications || 0) + 1);
  expect(Number(statsAfterTrustedImport?.stats?.counts?.library_public_stack_verification_members || 0)).toBe(Number(statsAfterBlocked?.stats?.counts?.library_public_stack_verification_members || 0) + 1);

  const trustedReviewUpdateResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(trustedStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-import-trusted-update-001' },
    data: {
      reviewTier: 'blocked_here',
      note: 'Now blocked for fresh imports, but replay must stay stable.',
    },
  });
  expect(trustedReviewUpdateResp.status).toBe(200);

  const trustedReplayResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(trustedStackId)}/imports`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-import-trusted-001' },
    data: {},
  });
  expect(trustedReplayResp.status).toBe(200);
  expect(trustedReplayResp.json?.data?.import).toMatchObject({
    libraryPublicStackId: trustedStackId,
    importedCount: 1,
    memberCount: 1,
  });

  const statsAfterTrustedReplay = await getPlatformStats(request);
  expectCountsEqual(statsAfterTrustedReplay?.stats?.counts, statsAfterTrustedImport?.stats?.counts, trackedKeys);

  const reviewLaterImportResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(reviewLaterStackId)}/imports`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-review-import-review-001' },
    data: {},
  });
  expect(reviewLaterImportResp.status).toBe(201);
  expect(reviewLaterImportResp.json?.data?.import).toMatchObject({
    libraryPublicStackId: reviewLaterStackId,
    importedCount: 1,
    memberCount: 1,
  });

  const statsAfterReviewLaterImport = await getPlatformStats(request);
  expect(Number(statsAfterReviewLaterImport?.stats?.counts?.library_items || 0)).toBe(Number(statsAfterTrustedReplay?.stats?.counts?.library_items || 0) + 1);
  expect(Number(statsAfterReviewLaterImport?.stats?.counts?.library_links || 0)).toBe(Number(statsAfterTrustedReplay?.stats?.counts?.library_links || 0) + 2);
  expect(Number(statsAfterReviewLaterImport?.stats?.counts?.scope_sets || 0)).toBe(Number(statsAfterTrustedReplay?.stats?.counts?.scope_sets || 0) + 1);
  expect(Number(statsAfterReviewLaterImport?.stats?.counts?.scope_set_items || 0)).toBe(Number(statsAfterTrustedReplay?.stats?.counts?.scope_set_items || 0) + 1);
  expect(Number(statsAfterReviewLaterImport?.stats?.counts?.library_public_stack_verifications || 0)).toBe(Number(statsAfterTrustedReplay?.stats?.counts?.library_public_stack_verifications || 0) + 1);
  expect(Number(statsAfterReviewLaterImport?.stats?.counts?.library_public_stack_verification_members || 0)).toBe(Number(statsAfterTrustedReplay?.stats?.counts?.library_public_stack_verification_members || 0) + 1);
});
