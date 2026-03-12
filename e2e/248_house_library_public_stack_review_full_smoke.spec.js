const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  openHouseLibraryPublicStackPreview,
  openHouseLibraryPreviewDetails,
  saveHouseLibraryReview,
  setHouseLibraryTrustChip,
} = require('./helpers/house_library_public_stacks');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  getPlatformStats,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';
const APPROVED_PUBLIC_STACK_ID = 'appr_fixture_library_public_stack_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.4: House Library review flow stays same-shell from Public Stack search through local review, trust filter, and import', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_review_full_smoke_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_review_full_smoke_target_01',
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
    headers: { 'Idempotency-Key': 'house-library-public-stack-review-full-alpha-001' },
    data: {
      itemType: 'library_note',
      title: 'Signal Notes',
      summary: 'First review full-smoke member.',
      contentText: 'Signal Notes should stay in the same shell from review through import.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:house-library-public-stack-review-full-alpha-001',
      visibility: 'house_private',
    },
  });
  expect(alphaResp.status).toBe(201);
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-review-full-beta-001' },
    data: {
      itemType: 'playbook',
      title: 'Skyline Checklist',
      summary: 'Second review full-smoke member.',
      contentText: 'Skyline Checklist should arrive after the saved local review.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/public-stack-review-full-smoke.md',
      visibility: 'house_private',
    },
  });
  expect(betaResp.status).toBe(201);
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_public_stack_review_full_smoke_01',
      title: 'Journey Review Pack',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);

  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-review-full-publish-alpha-001' },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-review-full-publish-beta-001' },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });

  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-review-full-stack-001' },
    data: {
      scopeSetId: 'scope_public_stack_review_full_smoke_01',
      approvalId: APPROVED_PUBLIC_STACK_ID,
    },
  });
  expect(publicStackResp.status).toBe(201);

  const initialSessionId = await readWorkerSessionId(page);
  const statsBeforeTarget = await getPlatformStats(request);
  expect(statsBeforeTarget?.ok).toBe(true);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await openHouseLibraryPublicStackPreview(page, { title: 'Journey Review Pack' });
  await saveHouseLibraryReview(page, {
    reviewTier: 'review_later',
    note: 'Use this later in this House.',
  });
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved local review Review later for Journey Review Pack.');
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Local review: Saved for later review in this House. Note: Use this later in this House.');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  await setHouseLibraryTrustChip(page, 'review_later');
  await page.getByTestId('house-library-public-stacks-search').click();
  await expect(page.locator('#houseLibraryPublicStacksResults button')).toHaveCount(1);
  await expect(page.getByTestId('house-library-storefront-trust-cluster').first()).toContainText('[hour]');

  await page.getByTestId('house-library-storefront-card').filter({ hasText: 'Journey Review Pack' }).first().getByTestId('house-library-storefront-preview').click();
  await expect(page.getByTestId('house-library-guided-import-button')).toBeEnabled();
  await page.getByTestId('house-library-guided-import-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Public Stack Journey Review Pack.');
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Already in your Library as Satchel Journey Review Pack.');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Review later');
  await expect(page.getByRole('button', { name: /Satchel · Journey Review Pack/ }).first()).toBeVisible();
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfterTarget = await getPlatformStats(request);
  expect(Number(statsAfterTarget?.stats?.counts?.library_public_stack_reviews || 0)).toBe(Number(statsBeforeTarget?.stats?.counts?.library_public_stack_reviews || 0) + 1);
  expect(Number(statsAfterTarget?.stats?.counts?.library_public_stack_verifications || 0)).toBe(Number(statsBeforeTarget?.stats?.counts?.library_public_stack_verifications || 0) + 1);
  expect(Number(statsAfterTarget?.stats?.counts?.library_public_stack_verification_members || 0)).toBe(Number(statsBeforeTarget?.stats?.counts?.library_public_stack_verification_members || 0) + 2);
  expect(Number(statsAfterTarget?.stats?.counts?.library_items || 0)).toBe(Number(statsBeforeTarget?.stats?.counts?.library_items || 0) + 2);
  expect(Number(statsAfterTarget?.stats?.counts?.library_links || 0)).toBe(Number(statsBeforeTarget?.stats?.counts?.library_links || 0) + 4);
  expect(Number(statsAfterTarget?.stats?.counts?.scope_sets || 0)).toBe(Number(statsBeforeTarget?.stats?.counts?.scope_sets || 0) + 1);
  expect(Number(statsAfterTarget?.stats?.counts?.scope_set_items || 0)).toBe(Number(statsBeforeTarget?.stats?.counts?.scope_set_items || 0) + 2);
});
