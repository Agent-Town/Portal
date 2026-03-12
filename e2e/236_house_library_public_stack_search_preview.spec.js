const { test, expect } = require('@playwright/test');

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

test('M33.2: House Library Public Stacks search merges published Satchel bundles and preview resolves bundle provenance without breaking Registry preview', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_search_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const alphaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-search-alpha-001',
    },
    data: {
      itemType: 'library_note',
      title: 'Signal Notes',
      summary: 'First public stack search member.',
      contentText: 'Signal Notes should appear in the published stack preview.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-public-stack-search-alpha-001',
      visibility: 'house_private',
    },
  });
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-search-beta-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Skyline Checklist',
      summary: 'Second public stack search member.',
      contentText: 'Skyline Checklist should appear second in the preview.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/skyline-checklist.md',
      visibility: 'house_private',
    },
  });
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_public_stack_search_01',
      title: 'Skyline Launch Pack',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);

  const alphaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-search-publish-alpha-001',
    },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  const alphaPublicationId = String(alphaPublishResp.json?.data?.publication?.libraryPublicationId || '');

  const betaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-search-publish-beta-001',
    },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  const betaPublicationId = String(betaPublishResp.json?.data?.publication?.libraryPublicationId || '');

  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-search-create-001',
    },
    data: {
      scopeSetId: 'scope_public_stack_search_01',
      approvalId: APPROVED_PUBLIC_STACK_ID,
    },
  });
  expect(publicStackResp.status).toBe(201);
  const libraryPublicStackId = String(publicStackResp.json?.data?.publicStack?.libraryPublicStackId || '');

  const stackSearchResp = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Skyline Launch Pack&family=house_library_stacks');
  expect(stackSearchResp.status).toBe(200);
  expect(stackSearchResp.json?.data).toMatchObject({
    query: 'Skyline Launch Pack',
    family: 'house_library_stacks',
    resultCount: 1,
  });
  expect(Array.isArray(stackSearchResp.json?.data?.results)).toBe(true);
  expect(stackSearchResp.json.data.results[0]).toMatchObject({
    registryId: libraryPublicStackId,
    registryEntityId: libraryPublicStackId,
    familySlug: 'house_library_stacks',
    familyTitle: 'House Library Stacks',
    displayName: 'Skyline Launch Pack',
    entityKind: 'library_public_stack_bundle',
  });

  const bundlePreviewResp = await callPageJson(page, `/api/platform/library/public-stacks/preview/${encodeURIComponent(libraryPublicStackId)}`);
  expect(bundlePreviewResp.status).toBe(200);
  expect(bundlePreviewResp.json?.data?.preview).toMatchObject({
    registryId: libraryPublicStackId,
    registryEntityId: libraryPublicStackId,
    libraryPublicStackId,
    displayName: 'Skyline Launch Pack',
    entityKind: 'library_public_stack_bundle',
    bundleKind: 'library_public_stack',
    family: 'house_library_stacks',
    familyTitle: 'House Library Stacks',
    sourceHouseId: sourceHouse.houseId,
    scopeSetId: 'scope_public_stack_search_01',
    scopeKind: 'satchel',
    memberCount: 2,
    importedCount: 0,
    alreadyImported: false,
    alreadyImportedAll: false,
  });
  expect(bundlePreviewResp.json?.data?.preview?.members).toEqual([
    expect.objectContaining({
      position: 0,
      libraryPublicationId: alphaPublicationId,
      title: 'Signal Notes',
      alreadyImported: false,
    }),
    expect.objectContaining({
      position: 1,
      libraryPublicationId: betaPublicationId,
      title: 'Skyline Checklist',
      alreadyImported: false,
    }),
  ]);
  expect(String(bundlePreviewResp.json?.data?.preview?.provenance?.summary || '')).toContain(sourceHouse.houseId);

  const registrySearchResp = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Atlas Scout&family=skill');
  expect(registrySearchResp.status).toBe(200);
  expect(registrySearchResp.json?.data).toMatchObject({
    query: 'Atlas Scout',
    family: 'skill',
    resultCount: 1,
  });
  expect(registrySearchResp.json?.data?.results?.[0]).toMatchObject({
    registryId: 'reg_atlas_skill_01',
    familySlug: 'skill',
  });

  const registryPreviewResp = await callPageJson(page, '/api/platform/library/public-stacks/preview/reg_atlas_skill_01');
  expect(registryPreviewResp.status).toBe(200);
  expect(registryPreviewResp.json?.data?.preview).toMatchObject({
    registryId: 'reg_atlas_skill_01',
    family: 'skill',
  });
  expect(registryPreviewResp.json?.data?.preview?.bundleKind).toBeUndefined();
});
