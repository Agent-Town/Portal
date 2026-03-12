const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { houseAuthHeadersFromKeyB64, seedRecoverableTokenHouse } = require('./helpers/phase1');
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
const APPROVED_RELAY_ID = 'appr_fixture_library_peer_relay_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M31.2: delivering a peer relay lands one Pony inbox envelope and one durable receipt row', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_library_peer_receipt_01',
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

  const itemResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-peer-relay-receipt-item-001',
    },
    data: {
      itemType: 'library_note',
      title: 'Relay Receipt Primer',
      summary: 'A note that will be delivered to another house.',
      contentText: 'Relay this note to the target house inbox and keep the registry provenance intact.',
      sourceKind: 'user_note',
      sourceRef: 'workspace/.agent-town/playbooks/peer-relay-receipt.md',
      visibility: 'house_private',
    },
  });
  expect(itemResp.status).toBe(201);
  const libraryItemId = String(itemResp.json?.data?.item?.libraryItemId || '');
  expect(libraryItemId).toMatch(/^lib_/);

  const publicationResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-peer-relay-receipt-publication-001',
    },
    data: {
      libraryItemId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(publicationResp.status).toBe(201);
  const publication = publicationResp.json?.data?.publication || null;
  expect(String(publication?.libraryPublicationId || '')).toMatch(/^pub_/);

  const relayResp = await callPageJson(page, '/api/platform/library/peer-relays', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-peer-relay-receipt-create-001',
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
  expect(relay).toMatchObject({
    libraryPublicationId: publication.libraryPublicationId,
    targetHouseId: targetHouse.houseId,
    relayState: 'queued',
  });

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  const deliverResp = await callPageJson(page, `/api/platform/library/peer-relays/${encodeURIComponent(relay.libraryPeerRelayId)}/deliver`, {
    method: 'POST',
    data: {},
  });
  expect(deliverResp.status).toBe(201);
  const delivery = deliverResp.json?.data || {};
  expect(delivery.relay).toMatchObject({
    libraryPeerRelayId: relay.libraryPeerRelayId,
    relayState: 'accepted',
    targetHouseId: targetHouse.houseId,
  });
  expect(delivery.receipt).toMatchObject({
    libraryPeerRelayId: relay.libraryPeerRelayId,
    targetHouseId: targetHouse.houseId,
    receiptKind: 'pony_dispatch_receipt',
    status: 'accepted',
  });
  expect(String(delivery.receipt?.receiptRef || '')).toMatch(/^dr_/);
  expect(delivery.dispatch).toMatchObject({
    ok: true,
    adapter: 'relay.http.v1',
    transportKind: 'pony.relay.registry.v1',
  });

  const statsAfterDelivery = await getPlatformStats(request);
  expect(Number(statsAfterDelivery?.stats?.counts?.library_peer_relays || 0)).toBe(Number(statsBefore?.stats?.counts?.library_peer_relays || 0));
  expect(Number(statsAfterDelivery?.stats?.counts?.library_peer_receipts || 0)).toBe(Number(statsBefore?.stats?.counts?.library_peer_receipts || 0) + 1);
  expect(Number(statsAfterDelivery?.stats?.counts?.library_publications || 0)).toBe(Number(statsBefore?.stats?.counts?.library_publications || 0));

  const replayResp = await callPageJson(page, `/api/platform/library/peer-relays/${encodeURIComponent(relay.libraryPeerRelayId)}/deliver`, {
    method: 'POST',
    data: {},
  });
  expect(replayResp.status).toBe(200);
  expect(String(replayResp.json?.data?.receipt?.libraryPeerReceiptId || '')).toBe(String(delivery.receipt?.libraryPeerReceiptId || ''));

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterDelivery?.stats?.counts);

  const inboxPath = `/api/pony/inbox?houseId=${encodeURIComponent(targetHouse.houseId)}`;
  const inboxHeaders = houseAuthHeadersFromKeyB64(targetHouse.houseId, 'GET', '/api/pony/inbox', '', targetHouse.houseAuthKey);
  const inboxResp = await request.get(inboxPath, {
    headers: inboxHeaders,
    failOnStatusCode: false,
  });
  expect(inboxResp.status()).toBe(200);
  const inboxBody = await inboxResp.json();
  expect(inboxBody?.ok).toBe(true);
  const relayMessage = Array.isArray(inboxBody?.inbox)
    ? inboxBody.inbox.find((entry) => String(entry?.relay?.libraryPeerRelayId || '') === String(relay.libraryPeerRelayId))
    : null;
  expect(relayMessage).toMatchObject({
    kind: 'msg.library_relay.v1',
    toHouseId: targetHouse.houseId,
    fromHouseId: sourceHouse.houseId,
    status: 'accepted',
  });
  expect(relayMessage?.relay).toMatchObject({
    libraryPeerRelayId: relay.libraryPeerRelayId,
    libraryPublicationId: publication.libraryPublicationId,
    registryId: publication.registryId,
    targetHouseId: targetHouse.houseId,
  });
  expect(relayMessage?.dispatch).toMatchObject({
    receiptId: delivery.receipt.receiptRef,
    adapter: 'relay.http.v1',
    transportKind: 'pony.relay.registry.v1',
  });

  const relayInspector = await getPlatformInspector(request, 'peer-relay');
  expect(relayInspector.status).toBe(200);
  const inspectorRelay = Array.isArray(relayInspector.json?.data?.relays)
    ? relayInspector.json.data.relays.find((entry) => String(entry?.libraryPeerRelayId || '') === String(relay.libraryPeerRelayId))
    : null;
  const inspectorReceipt = Array.isArray(relayInspector.json?.data?.receipts)
    ? relayInspector.json.data.receipts.find((entry) => String(entry?.libraryPeerReceiptId || '') === String(delivery.receipt?.libraryPeerReceiptId || ''))
    : null;
  expect(inspectorRelay).toMatchObject({
    libraryPeerRelayId: relay.libraryPeerRelayId,
    relayState: 'accepted',
    transportKind: 'pony.relay.registry.v1',
  });
  expect(inspectorReceipt).toMatchObject({
    libraryPeerRelayId: relay.libraryPeerRelayId,
    targetHouseId: targetHouse.houseId,
    receiptRef: delivery.receipt.receiptRef,
    receiptKind: 'pony_dispatch_receipt',
  });
  expect(inspectorReceipt?.metadata).toMatchObject({
    messageId: relayMessage.id,
    dispatchAdapter: 'relay.http.v1',
    transportKind: 'pony.relay.registry.v1',
    registryId: publication.registryId,
    libraryPublicationId: publication.libraryPublicationId,
  });
});
