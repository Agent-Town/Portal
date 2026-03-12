const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  openHouseLibraryPublicStackPreview,
  openHouseLibraryPreviewDetails,
  openHouseLibrarySatchelPublishDrawer,
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

test('M34.4: House Library trust flow stays in the same shell from Public Stack preview through verify and import', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_trust_full_smoke_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_trust_full_smoke_target_01',
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
    headers: { 'Idempotency-Key': 'house-library-public-stack-trust-full-alpha-001' },
    data: {
      itemType: 'library_note',
      title: 'Signal Notes',
      summary: 'First trust smoke member.',
      contentText: 'Signal Notes should remain inside the same shell through verify and import.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:house-library-public-stack-trust-full-alpha-001',
      visibility: 'house_private',
    },
  });
  expect(alphaResp.status).toBe(201);
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-trust-full-beta-001' },
    data: {
      itemType: 'playbook',
      title: 'Skyline Checklist',
      summary: 'Second trust smoke member.',
      contentText: 'Skyline Checklist should arrive with the same verification ref.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/public-stack-trust-full-smoke.md',
      visibility: 'house_private',
    },
  });
  expect(betaResp.status).toBe(201);
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_public_stack_trust_full_smoke_01',
      title: 'Journey Trust Pack',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);

  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-trust-full-publish-alpha-001' },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-trust-full-publish-beta-001' },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });

  const initialSessionId = await readWorkerSessionId(page);
  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await page.getByRole('button', { name: /Journey Trust Pack/ }).first().click();
  await openHouseLibrarySatchelPublishDrawer(page);
  await page.getByTestId('house-library-public-stack-approval-input').fill(APPROVED_PUBLIC_STACK_ID);
  await page.getByTestId('house-library-public-stack-publish-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Published Satchel Journey Trust Pack to Public Stacks.');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await openHouseLibraryPublicStackPreview(page, { title: 'Journey Trust Pack' });
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-preview-title')).toContainText('Journey Trust Pack');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Verification: Not yet verified in this House.');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Verification pending');
  await expect(page.getByTestId('house-library-guided-verify-button')).toBeEnabled();

  await page.getByTestId('house-library-guided-verify-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Verified Public Stack Journey Trust Pack.');
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Verified here');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Bundle integrity');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Local import status');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  await page.getByTestId('house-library-guided-import-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Public Stack Journey Trust Pack.');
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Already in your Library as Satchel Journey Trust Pack.');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Verified here');
  await expect(page.getByRole('button', { name: /Satchel · Journey Trust Pack/ }).first()).toBeVisible();
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfter = await getPlatformStats(request);
  expect(Number(statsAfter?.stats?.counts?.library_public_stacks || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stacks || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_members || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stack_members || 0) + 2);
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_verifications || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stack_verifications || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_verification_members || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stack_verification_members || 0) + 2);
  expect(Number(statsAfter?.stats?.counts?.library_items || 0)).toBe(Number(statsBefore?.stats?.counts?.library_items || 0) + 2);
  expect(Number(statsAfter?.stats?.counts?.scope_sets || 0)).toBe(Number(statsBefore?.stats?.counts?.scope_sets || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.scope_set_items || 0)).toBe(Number(statsBefore?.stats?.counts?.scope_set_items || 0) + 2);
});
