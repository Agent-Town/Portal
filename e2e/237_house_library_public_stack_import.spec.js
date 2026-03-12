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

test('M33.3: target House imports one published Public Stack as read-only Library items and one local Satchel without duplication on replay', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_import_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_import_target_01',
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
    headers: {
      'Idempotency-Key': 'library-public-stack-import-alpha-001',
    },
    data: {
      itemType: 'library_note',
      title: 'Comet Notes',
      summary: 'First bundle member for import.',
      contentText: 'Comet Notes should arrive as a read-only imported artifact.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-public-stack-import-alpha-001',
      visibility: 'house_private',
    },
  });
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-import-beta-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Orbit Checklist',
      summary: 'Second bundle member for import.',
      contentText: 'Orbit Checklist should remain second in the imported Satchel.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/orbit-checklist.md',
      visibility: 'house_private',
    },
  });
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_public_stack_import_01',
      title: 'Orbit Launch Pack',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);

  const alphaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-import-publish-alpha-001',
    },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  const alphaRegistryId = String(alphaPublishResp.json?.data?.publication?.registryId || '');

  const betaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-import-publish-beta-001',
    },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  const betaRegistryId = String(betaPublishResp.json?.data?.publication?.registryId || '');

  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-import-create-001',
    },
    data: {
      scopeSetId: 'scope_public_stack_import_01',
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

  const previewBeforeImport = await callPageJson(page, `/api/platform/library/public-stacks/preview/${encodeURIComponent(libraryPublicStackId)}`);
  expect(previewBeforeImport.status).toBe(200);
  expect(previewBeforeImport.json?.data?.preview).toMatchObject({
    libraryPublicStackId,
    sourceHouseId: sourceHouse.houseId,
    memberCount: 2,
    importedCount: 0,
    alreadyImported: false,
    alreadyImportedAll: false,
    localScopeSet: null,
  });

  const statsBeforeImport = await getPlatformStats(request);
  expect(statsBeforeImport?.ok).toBe(true);

  const importResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/imports`, {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-import-target-001',
    },
    data: {},
  });
  expect(importResp.status).toBe(201);
  expect(importResp.json?.data?.import).toMatchObject({
    libraryPublicStackId,
    importedCount: 2,
    memberCount: 2,
  });
  expect(Array.isArray(importResp.json?.data?.items)).toBe(true);
  expect(importResp.json.data.items).toHaveLength(2);
  expect(importResp.json.data.items[0]).toMatchObject({
    title: 'Comet Notes',
    sourceKind: 'public_stack_artifact',
    importedState: 'imported_artifact',
    registryId: alphaRegistryId,
    readOnly: true,
  });
  expect(importResp.json.data.items[1]).toMatchObject({
    title: 'Orbit Checklist',
    sourceKind: 'public_stack_artifact',
    importedState: 'imported_artifact',
    registryId: betaRegistryId,
    readOnly: true,
  });
  expect(importResp.json?.data?.scopeSet).toMatchObject({
    title: 'Orbit Launch Pack',
    orderedItemIds: [
      expect.stringMatching(/^lib_/),
      expect.stringMatching(/^lib_/),
    ],
  });

  const statsAfterImport = await getPlatformStats(request);
  expect(Number(statsAfterImport?.stats?.counts?.library_items || 0)).toBe(Number(statsBeforeImport?.stats?.counts?.library_items || 0) + 2);
  expect(Number(statsAfterImport?.stats?.counts?.library_links || 0)).toBe(Number(statsBeforeImport?.stats?.counts?.library_links || 0) + 4);
  expect(Number(statsAfterImport?.stats?.counts?.scope_sets || 0)).toBe(Number(statsBeforeImport?.stats?.counts?.scope_sets || 0) + 1);
  expect(Number(statsAfterImport?.stats?.counts?.scope_set_items || 0)).toBe(Number(statsBeforeImport?.stats?.counts?.scope_set_items || 0) + 2);

  const previewAfterImport = await callPageJson(page, `/api/platform/library/public-stacks/preview/${encodeURIComponent(libraryPublicStackId)}`);
  expect(previewAfterImport.status).toBe(200);
  expect(previewAfterImport.json?.data?.preview).toMatchObject({
    importedCount: 2,
    alreadyImported: true,
    alreadyImportedAll: true,
    localScopeSet: expect.objectContaining({
      title: 'Orbit Launch Pack',
      orderedItemIds: [
        expect.stringMatching(/^lib_/),
        expect.stringMatching(/^lib_/),
      ],
    }),
  });

  const replayResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/imports`, {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-import-target-001',
    },
    data: {},
  });
  expect(replayResp.status).toBe(200);
  expect(replayResp.json?.data?.import).toMatchObject({
    libraryPublicStackId,
    importedCount: 2,
    memberCount: 2,
  });

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterImport?.stats?.counts);
});
