const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  openHouseLibraryPublicStackPreview,
  openHouseLibraryPreviewDetails,
  saveHouseLibraryReview,
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

test('M36.4: House Library attestation flow stays same-shell from source review through target blocked import policy', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_full_smoke_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_full_smoke_target_01',
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
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-full-alpha-001' },
    data: {
      itemType: 'library_note',
      title: 'Signal Notes',
      summary: 'First attestation full-smoke member.',
      contentText: 'Signal Notes should stay in the same shell through review and attestation.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:house-library-public-stack-attestation-full-alpha-001',
      visibility: 'house_private',
    },
  });
  expect(alphaResp.status).toBe(201);
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-full-beta-001' },
    data: {
      itemType: 'playbook',
      title: 'Skyline Checklist',
      summary: 'Second attestation full-smoke member.',
      contentText: 'Skyline Checklist should remain in the preview when the target House inspects it.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/public-stack-attestation-full-smoke.md',
      visibility: 'house_private',
    },
  });
  expect(betaResp.status).toBe(201);
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_public_stack_attestation_full_smoke_01',
      title: 'Journey Attestation Pack',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);

  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-full-publish-alpha-001' },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-full-publish-beta-001' },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });

  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-public-stack-attestation-full-stack-001' },
    data: {
      scopeSetId: 'scope_public_stack_attestation_full_smoke_01',
      approvalId: APPROVED_PUBLIC_STACK_ID,
    },
  });
  expect(publicStackResp.status).toBe(201);

  const initialSessionId = await readWorkerSessionId(page);
  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await openHouseLibraryPublicStackPreview(page, { title: 'Journey Attestation Pack' });
  await saveHouseLibraryReview(page, {
    reviewTier: 'trusted_here',
    note: 'Good for launch use in this House.',
  });
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved local review Trusted here for Journey Attestation Pack.');

  await page.getByTestId('house-library-guided-attest-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Published attestation for Journey Attestation Pack.');
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Attestations: Attested by Houses: 1 attestation, 1 trusted here.');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText(sourceHouse.houseId);
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await openHouseLibraryPublicStackPreview(page, { title: 'Journey Attestation Pack' });
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Attestations: Attested by Houses: 1 attestation, 1 trusted here.');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText(sourceHouse.houseId);

  await saveHouseLibraryReview(page, {
    reviewTier: 'blocked_here',
    note: 'Keep this out of this House.',
  });
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved local review Blocked here for Journey Attestation Pack.');
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Local review: Blocked here for this House. Note: Keep this out of this House.');
  await expect(page.getByTestId('house-library-guided-import-button')).toBeDisabled();
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfter = await getPlatformStats(request);
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_reviews || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stack_reviews || 0) + 2);
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_attestations || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stack_attestations || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_verifications || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stack_verifications || 0));
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_verification_members || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stack_verification_members || 0));
  expect(Number(statsAfter?.stats?.counts?.scope_sets || 0)).toBe(Number(statsBefore?.stats?.counts?.scope_sets || 0));
  expect(Number(statsAfter?.stats?.counts?.scope_set_items || 0)).toBe(Number(statsBefore?.stats?.counts?.scope_set_items || 0));
});
