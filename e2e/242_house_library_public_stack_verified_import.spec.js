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

test('M34.3: Public Stack import reuses or creates one verification receipt and stamps imported metadata with it', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_verified_import_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_verified_import_target_01',
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
    headers: { 'Idempotency-Key': 'library-public-stack-verified-import-alpha-001' },
    data: {
      itemType: 'library_note',
      title: 'Import Notes',
      summary: 'First import member.',
      contentText: 'Import Notes should get a verification ref on import.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-public-stack-verified-import-alpha-001',
      visibility: 'house_private',
    },
  });
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');
  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-verified-import-beta-001' },
    data: {
      itemType: 'playbook',
      title: 'Import Checklist',
      summary: 'Second import member.',
      contentText: 'Import Checklist should keep the same verification ref.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/import-checklist.md',
      visibility: 'house_private',
    },
  });
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_public_stack_verified_import_01',
      title: 'Verified Import Pack',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-verified-import-publish-alpha-001' },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-verified-import-publish-beta-001' },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-verified-import-create-001' },
    data: {
      scopeSetId: 'scope_public_stack_verified_import_01',
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

  const statsBeforeImport = await getPlatformStats(request);
  expect(statsBeforeImport?.ok).toBe(true);

  const importResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/imports`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-verified-import-target-001' },
    data: {},
  });
  expect(importResp.status).toBe(201);
  expect(importResp.json?.data?.import).toMatchObject({
    libraryPublicStackId,
    importedCount: 2,
    memberCount: 2,
  });
  expect(importResp.json?.data?.verification).toMatchObject({
    verificationKind: 'bundle_integrity',
    verificationState: 'verified',
    libraryPublicStackVerificationId: expect.stringMatching(/^pstv_/),
  });
  const verificationId = String(importResp.json?.data?.verification?.libraryPublicStackVerificationId || '');

  const statsAfterImport = await getPlatformStats(request);
  expect(Number(statsAfterImport?.stats?.counts?.library_public_stack_verifications || 0)).toBe(Number(statsBeforeImport?.stats?.counts?.library_public_stack_verifications || 0) + 1);
  expect(Number(statsAfterImport?.stats?.counts?.library_public_stack_verification_members || 0)).toBe(Number(statsBeforeImport?.stats?.counts?.library_public_stack_verification_members || 0) + 2);
  expect(Number(statsAfterImport?.stats?.counts?.library_items || 0)).toBe(Number(statsBeforeImport?.stats?.counts?.library_items || 0) + 2);
  expect(Number(statsAfterImport?.stats?.counts?.scope_sets || 0)).toBe(Number(statsBeforeImport?.stats?.counts?.scope_sets || 0) + 1);

  const libraryInspector = await getPlatformInspector(request, 'library');
  expect(libraryInspector.status).toBe(200);
  const importedItems = (Array.isArray(libraryInspector.json?.data?.items) ? libraryInspector.json.data.items : [])
    .filter((item) => String(item?.houseId || '').trim() === targetHouse.houseId)
    .filter((item) => String(item?.sourceKind || '').trim() === 'public_stack_artifact');
  expect(importedItems).toHaveLength(2);
  importedItems.forEach((item) => {
    expect(item?.metadata).toEqual(expect.objectContaining({
      libraryPublicStackId,
      libraryPublicStackVerificationId: verificationId,
    }));
  });

  const scopesInspector = await getPlatformInspector(request, 'scopes');
  expect(scopesInspector.status).toBe(200);
  const importedScope = (Array.isArray(scopesInspector.json?.data?.scopeSets) ? scopesInspector.json.data.scopeSets : [])
    .find((scopeSet) => String(scopeSet?.houseId || '').trim() === targetHouse.houseId
      && String(scopeSet?.metadata?.importKind || '').trim() === 'public_stack_bundle');
  expect(importedScope).toBeTruthy();
  expect(importedScope?.metadata).toEqual(expect.objectContaining({
    libraryPublicStackId,
    libraryPublicStackVerificationId: verificationId,
  }));

  const secondImportResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/imports`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-verified-import-target-002' },
    data: {},
  });
  expect(secondImportResp.status).toBe(200);
  expect(secondImportResp.json?.data?.verification?.libraryPublicStackVerificationId).toBe(verificationId);

  const statsAfterSecondImport = await getPlatformStats(request);
  expect(statsAfterSecondImport?.stats?.counts).toEqual(statsAfterImport?.stats?.counts);
});
