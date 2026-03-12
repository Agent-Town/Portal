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
const APPROVED_SATCHEL_RELAY_ID = 'appr_fixture_library_satchel_relay_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.3: target House previews a delivered Satchel relay, imports a subset, then imports the full pack as one local Satchel without duplication on replay', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_library_satchel_import_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_library_satchel_import_target_01',
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
      'Idempotency-Key': 'library-satchel-import-alpha-001',
    },
    data: {
      itemType: 'library_note',
      title: 'Scout Notes',
      summary: 'First member for subset import.',
      contentText: 'Scout Notes should be previewable and imported first.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-satchel-import-alpha-001',
      visibility: 'house_private',
    },
  });
  expect(alphaResp.status).toBe(201);
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-import-beta-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Launch Checklist',
      summary: 'Second member for full import.',
      contentText: 'Launch Checklist should join the imported Satchel on full import.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/launch-checklist.md',
      visibility: 'house_private',
    },
  });
  expect(betaResp.status).toBe(201);
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_satchel_import_01',
      title: 'Launch Satchel Import Pack',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);

  const alphaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-import-publish-alpha-001',
    },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(alphaPublishResp.status).toBe(201);
  const alphaPublicationId = String(alphaPublishResp.json?.data?.publication?.libraryPublicationId || '');
  const alphaRegistryId = String(alphaPublishResp.json?.data?.publication?.registryId || '');

  const betaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-import-publish-beta-001',
    },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(betaPublishResp.status).toBe(201);
  const betaPublicationId = String(betaPublishResp.json?.data?.publication?.libraryPublicationId || '');
  const betaRegistryId = String(betaPublishResp.json?.data?.publication?.registryId || '');

  const relayResp = await callPageJson(page, '/api/platform/library/satchel-relays', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-import-create-001',
    },
    data: {
      scopeSetId: 'scope_satchel_import_01',
      targetHouseId: targetHouse.houseId,
      transportKind: 'pony.relay.registry.v1',
      approvalId: APPROVED_SATCHEL_RELAY_ID,
    },
  });
  expect(relayResp.status).toBe(201);
  const relay = relayResp.json?.data?.relay || null;

  const deliverResp = await callPageJson(page, `/api/platform/library/satchel-relays/${encodeURIComponent(relay.librarySatchelRelayId)}/deliver`, {
    method: 'POST',
    data: {},
  });
  expect(deliverResp.status).toBe(201);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const previewResp = await callPageJson(page, `/api/platform/library/satchel-relays/${encodeURIComponent(relay.librarySatchelRelayId)}/preview`);
  expect(previewResp.status).toBe(200);
  expect(previewResp.json?.data?.preview).toMatchObject({
    librarySatchelRelayId: relay.librarySatchelRelayId,
    scopeSetId: 'scope_satchel_import_01',
    sourceHouseId: sourceHouse.houseId,
    targetHouseId: targetHouse.houseId,
    title: 'Launch Satchel Import Pack',
    scopeKind: 'satchel',
    memberCount: 2,
    importedCount: 0,
    alreadyImported: false,
    alreadyImportedAll: false,
  });
  expect(Array.isArray(previewResp.json?.data?.preview?.members)).toBe(true);
  expect(previewResp.json.data.preview.members).toHaveLength(2);
  expect(previewResp.json.data.preview.members[0]).toMatchObject({
    libraryPublicationId: alphaPublicationId,
    registryId: alphaRegistryId,
    title: 'Scout Notes',
    alreadyImported: false,
  });
  expect(previewResp.json.data.preview.members[1]).toMatchObject({
    libraryPublicationId: betaPublicationId,
    registryId: betaRegistryId,
    title: 'Launch Checklist',
    alreadyImported: false,
  });

  const statsBeforeSubset = await getPlatformStats(request);
  expect(statsBeforeSubset?.ok).toBe(true);

  const subsetImportResp = await callPageJson(page, `/api/platform/library/satchel-relays/${encodeURIComponent(relay.librarySatchelRelayId)}/imports`, {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-import-subset-001',
    },
    data: {
      libraryPublicationIds: [alphaPublicationId],
    },
  });
  expect(subsetImportResp.status).toBe(201);
  expect(subsetImportResp.json?.data?.import).toMatchObject({
    librarySatchelRelayId: relay.librarySatchelRelayId,
    selectionKind: 'subset',
    importedCount: 1,
    memberCount: 2,
  });
  expect(Array.isArray(subsetImportResp.json?.data?.items)).toBe(true);
  expect(subsetImportResp.json.data.items).toHaveLength(1);
  expect(subsetImportResp.json.data.items[0]).toMatchObject({
    title: 'Scout Notes',
    sourceKind: 'satchel_relay_artifact',
    importedState: 'imported_artifact',
    registryId: alphaRegistryId,
    readOnly: true,
    published: false,
  });
  expect(subsetImportResp.json?.data?.scopeSet).toBeNull();

  const statsAfterSubset = await getPlatformStats(request);
  expect(Number(statsAfterSubset?.stats?.counts?.library_items || 0)).toBe(Number(statsBeforeSubset?.stats?.counts?.library_items || 0) + 1);
  expect(Number(statsAfterSubset?.stats?.counts?.library_links || 0)).toBe(Number(statsBeforeSubset?.stats?.counts?.library_links || 0) + 2);
  expect(Number(statsAfterSubset?.stats?.counts?.scope_sets || 0)).toBe(Number(statsBeforeSubset?.stats?.counts?.scope_sets || 0));

  const previewAfterSubset = await callPageJson(page, `/api/platform/library/satchel-relays/${encodeURIComponent(relay.librarySatchelRelayId)}/preview`);
  expect(previewAfterSubset.status).toBe(200);
  expect(previewAfterSubset.json?.data?.preview).toMatchObject({
    importedCount: 1,
    alreadyImported: true,
    alreadyImportedAll: false,
    localScopeSet: null,
  });
  expect(previewAfterSubset.json.data.preview.members[0]).toMatchObject({
    libraryPublicationId: alphaPublicationId,
    alreadyImported: true,
  });
  expect(previewAfterSubset.json.data.preview.members[0]?.importedItem).toMatchObject({
    title: 'Scout Notes',
    sourceKind: 'satchel_relay_artifact',
    readOnly: true,
  });
  expect(previewAfterSubset.json.data.preview.members[1]).toMatchObject({
    libraryPublicationId: betaPublicationId,
    alreadyImported: false,
  });

  const fullImportResp = await callPageJson(page, `/api/platform/library/satchel-relays/${encodeURIComponent(relay.librarySatchelRelayId)}/imports`, {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-import-full-001',
    },
    data: {},
  });
  expect(fullImportResp.status).toBe(201);
  expect(fullImportResp.json?.data?.import).toMatchObject({
    librarySatchelRelayId: relay.librarySatchelRelayId,
    selectionKind: 'full',
    importedCount: 2,
    memberCount: 2,
  });
  expect(Array.isArray(fullImportResp.json?.data?.items)).toBe(true);
  expect(fullImportResp.json.data.items).toHaveLength(2);
  expect(fullImportResp.json.data.items[0]).toMatchObject({
    title: 'Scout Notes',
    registryId: alphaRegistryId,
  });
  expect(fullImportResp.json.data.items[1]).toMatchObject({
    title: 'Launch Checklist',
    sourceKind: 'satchel_relay_artifact',
    registryId: betaRegistryId,
    readOnly: true,
  });
  expect(fullImportResp.json?.data?.scopeSet).toMatchObject({
    title: 'Launch Satchel Import Pack',
    scopeKind: 'satchel',
  });
  const importedScopeSetId = String(fullImportResp.json?.data?.scopeSet?.scopeSetId || '');
  expect(importedScopeSetId).toMatch(/^scope_/);
  const importedOrderedIds = fullImportResp.json?.data?.scopeSet?.orderedItemIds || [];
  expect(importedOrderedIds).toHaveLength(2);

  const statsAfterFull = await getPlatformStats(request);
  expect(Number(statsAfterFull?.stats?.counts?.library_items || 0)).toBe(Number(statsAfterSubset?.stats?.counts?.library_items || 0) + 1);
  expect(Number(statsAfterFull?.stats?.counts?.library_links || 0)).toBe(Number(statsAfterSubset?.stats?.counts?.library_links || 0) + 2);
  expect(Number(statsAfterFull?.stats?.counts?.scope_sets || 0)).toBe(Number(statsAfterSubset?.stats?.counts?.scope_sets || 0) + 1);
  expect(Number(statsAfterFull?.stats?.counts?.scope_set_items || 0)).toBe(Number(statsAfterSubset?.stats?.counts?.scope_set_items || 0) + 2);

  const previewAfterFull = await callPageJson(page, `/api/platform/library/satchel-relays/${encodeURIComponent(relay.librarySatchelRelayId)}/preview`);
  expect(previewAfterFull.status).toBe(200);
  expect(previewAfterFull.json?.data?.preview).toMatchObject({
    importedCount: 2,
    alreadyImported: true,
    alreadyImportedAll: true,
  });
  expect(previewAfterFull.json?.data?.preview?.localScopeSet).toMatchObject({
    scopeSetId: importedScopeSetId,
    title: 'Launch Satchel Import Pack',
    orderedItemIds: importedOrderedIds,
  });

  const replayResp = await callPageJson(page, `/api/platform/library/satchel-relays/${encodeURIComponent(relay.librarySatchelRelayId)}/imports`, {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-import-full-001',
    },
    data: {},
  });
  expect(replayResp.status).toBe(200);
  expect(String(replayResp.json?.data?.scopeSet?.scopeSetId || '')).toBe(importedScopeSetId);
  expect(replayResp.json?.data?.scopeSet?.orderedItemIds || []).toEqual(importedOrderedIds);

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterFull?.stats?.counts);

  const incomingResp = await callPageJson(page, '/api/platform/library/satchel-relays/incoming');
  expect(incomingResp.status).toBe(200);
  const incomingRelay = Array.isArray(incomingResp.json?.data?.incomingRelays)
    ? incomingResp.json.data.incomingRelays.find((entry) => String(entry?.librarySatchelRelayId || '') === String(relay.librarySatchelRelayId))
    : null;
  expect(incomingRelay).toMatchObject({
    librarySatchelRelayId: relay.librarySatchelRelayId,
    sourceHouseId: sourceHouse.houseId,
    importedCount: 2,
    alreadyImportedAll: true,
  });
  expect(incomingRelay?.localScopeSet).toMatchObject({
    scopeSetId: importedScopeSetId,
    orderedItemIds: importedOrderedIds,
  });

  const libraryRead = await callPageJson(page, '/api/platform/library');
  expect(libraryRead.status).toBe(200);
  const importedItems = Array.isArray(libraryRead.json?.data?.items)
    ? libraryRead.json.data.items.filter((entry) => String(entry?.sourceKind || '') === 'satchel_relay_artifact')
    : [];
  expect(importedItems).toHaveLength(2);
  expect(importedItems.map((entry) => entry.title)).toEqual(expect.arrayContaining(['Scout Notes', 'Launch Checklist']));
});
