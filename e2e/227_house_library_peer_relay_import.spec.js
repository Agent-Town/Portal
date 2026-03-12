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
const APPROVED_RELAY_ID = 'appr_fixture_library_peer_relay_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M31.3: target House previews a delivered relay and imports it as one read-only Library artifact with provenance', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_library_peer_import_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_library_peer_import_target_01',
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

  const itemResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-peer-relay-import-item-001',
    },
    data: {
      itemType: 'library_note',
      title: 'Shared Mission Brief',
      summary: 'A note that the target House can preview before import.',
      contentText: 'This mission brief contains the exact steps that should survive relay and import.',
      sourceKind: 'user_note',
      sourceRef: 'workspace/.agent-town/playbooks/shared-mission-brief.md',
      visibility: 'house_private',
    },
  });
  expect(itemResp.status).toBe(201);
  const libraryItemId = String(itemResp.json?.data?.item?.libraryItemId || '');
  expect(libraryItemId).toMatch(/^lib_/);

  const publicationResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-peer-relay-import-publication-001',
    },
    data: {
      libraryItemId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(publicationResp.status).toBe(201);
  const publication = publicationResp.json?.data?.publication || null;

  const relayResp = await callPageJson(page, '/api/platform/library/peer-relays', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-peer-relay-import-create-001',
    },
    data: {
      libraryPublicationId: publication.libraryPublicationId,
      targetHouseId: targetHouse.houseId,
      transportKind: 'pony.relay.registry.v1',
      approvalId: APPROVED_RELAY_ID,
    },
  });
  expect(relayResp.status).toBe(201);
  const relay = relayResp.json?.data?.relay || null;

  const deliverResp = await callPageJson(page, `/api/platform/library/peer-relays/${encodeURIComponent(relay.libraryPeerRelayId)}/deliver`, {
    method: 'POST',
    data: {},
  });
  expect(deliverResp.status).toBe(201);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const previewResp = await callPageJson(page, `/api/platform/library/peer-relays/${encodeURIComponent(relay.libraryPeerRelayId)}/preview`);
  expect(previewResp.status).toBe(200);
  expect(previewResp.json?.data?.preview).toMatchObject({
    libraryPeerRelayId: relay.libraryPeerRelayId,
    libraryPublicationId: publication.libraryPublicationId,
    sourceHouseId: sourceHouse.houseId,
    targetHouseId: targetHouse.houseId,
    transportKind: 'pony.relay.registry.v1',
    registryId: publication.registryId,
    displayName: 'Shared Mission Brief',
    alreadyImported: false,
  });
  expect(String(previewResp.json?.data?.preview?.contentText || '')).toContain('exact steps that should survive relay and import');

  const statsBeforeImport = await getPlatformStats(request);
  expect(statsBeforeImport?.ok).toBe(true);

  const importResp = await callPageJson(page, `/api/platform/library/peer-relays/${encodeURIComponent(relay.libraryPeerRelayId)}/imports`, {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-peer-relay-import-target-001',
    },
    data: {},
  });
  expect(importResp.status).toBe(201);
  const importedItem = importResp.json?.data?.item || null;
  expect(importedItem).toMatchObject({
    itemType: 'imported_artifact',
    title: 'Shared Mission Brief',
    sourceKind: 'peer_relay_artifact',
    sourceRef: relay.libraryPeerRelayId,
    importedState: 'imported_artifact',
    registryId: publication.registryId,
    readOnly: true,
    published: false,
  });
  expect(Array.isArray(importResp.json?.data?.links)).toBe(true);
  expect(importResp.json.data.links).toHaveLength(2);
  expect(importResp.json.data.links).toEqual(expect.arrayContaining([expect.objectContaining({
    linkKind: 'imported_from_peer_relay',
    sourceKind: 'peer_relay_artifact',
    sourceRef: relay.libraryPeerRelayId,
  }), expect.objectContaining({
    linkKind: 'relayed_publication',
    sourceKind: 'library_publication',
    sourceRef: publication.libraryPublicationId,
  })]));

  const statsAfterImport = await getPlatformStats(request);
  expect(Number(statsAfterImport?.stats?.counts?.library_items || 0)).toBe(Number(statsBeforeImport?.stats?.counts?.library_items || 0) + 1);
  expect(Number(statsAfterImport?.stats?.counts?.library_links || 0)).toBe(Number(statsBeforeImport?.stats?.counts?.library_links || 0) + 2);
  expect(Number(statsAfterImport?.stats?.counts?.library_peer_receipts || 0)).toBe(Number(statsBeforeImport?.stats?.counts?.library_peer_receipts || 0));

  const replayResp = await callPageJson(page, `/api/platform/library/peer-relays/${encodeURIComponent(relay.libraryPeerRelayId)}/imports`, {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-peer-relay-import-target-001',
    },
    data: {},
  });
  expect(replayResp.status).toBe(200);
  expect(String(replayResp.json?.data?.item?.libraryItemId || '')).toBe(String(importedItem?.libraryItemId || ''));

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterImport?.stats?.counts);

  const incomingResp = await callPageJson(page, '/api/platform/library/peer-relays/incoming');
  expect(incomingResp.status).toBe(200);
  const incomingRelay = Array.isArray(incomingResp.json?.data?.incomingRelays)
    ? incomingResp.json.data.incomingRelays.find((entry) => String(entry?.libraryPeerRelayId || '') === String(relay.libraryPeerRelayId))
    : null;
  expect(incomingRelay).toMatchObject({
    libraryPeerRelayId: relay.libraryPeerRelayId,
    sourceHouseId: sourceHouse.houseId,
    registryId: publication.registryId,
    alreadyImported: true,
  });
  expect(incomingRelay?.importedItem).toMatchObject({
    libraryItemId: importedItem.libraryItemId,
    sourceKind: 'peer_relay_artifact',
    readOnly: true,
  });

  const libraryRead = await callPageJson(page, '/api/platform/library');
  expect(libraryRead.status).toBe(200);
  const relayImport = Array.isArray(libraryRead.json?.data?.items)
    ? libraryRead.json.data.items.find((entry) => String(entry?.libraryItemId || '') === String(importedItem.libraryItemId))
    : null;
  expect(relayImport).toMatchObject({
    libraryItemId: importedItem.libraryItemId,
    sourceKind: 'peer_relay_artifact',
    sourceRef: relay.libraryPeerRelayId,
    importedState: 'imported_artifact',
    registryId: publication.registryId,
    readOnly: true,
  });

  const previewAfterImport = await callPageJson(page, `/api/platform/library/peer-relays/${encodeURIComponent(relay.libraryPeerRelayId)}/preview`);
  expect(previewAfterImport.status).toBe(200);
  expect(previewAfterImport.json?.data?.preview).toMatchObject({
    libraryPeerRelayId: relay.libraryPeerRelayId,
    alreadyImported: true,
  });
  expect(previewAfterImport.json?.data?.preview?.importedItem).toMatchObject({
    libraryItemId: importedItem.libraryItemId,
    readOnly: true,
    sourceKind: 'peer_relay_artifact',
  });
});
