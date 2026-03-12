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
const APPROVED_SATCHEL_RELAY_ID = 'appr_fixture_library_satchel_relay_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.2: delivering a Satchel relay lands one Pony inbox bundle notice and one durable receipt row', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_library_satchel_receipt_01',
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
      'Idempotency-Key': 'library-satchel-receipt-alpha-001',
    },
    data: {
      itemType: 'library_note',
      title: 'Satchel Relay Primer',
      summary: 'First member in the relay bundle.',
      contentText: 'Keep Satchel relay delivery additive to inbox behavior.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-satchel-receipt-alpha-001',
      visibility: 'house_private',
    },
  });
  expect(alphaResp.status).toBe(201);
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-receipt-beta-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Relay Bundle Checklist',
      summary: 'Second member in the relay bundle.',
      contentText: 'Deliver one bundle notice instead of one notice per member.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/relay-bundle-checklist.md',
      visibility: 'house_private',
    },
  });
  expect(betaResp.status).toBe(201);
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_satchel_receipt_01',
      title: 'Relay Bundle Receipt Pack',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);

  const alphaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-receipt-publish-alpha-001',
    },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(alphaPublishResp.status).toBe(201);
  const alphaPublicationId = String(alphaPublishResp.json?.data?.publication?.libraryPublicationId || '');

  const betaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-receipt-publish-beta-001',
    },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(betaPublishResp.status).toBe(201);
  const betaPublicationId = String(betaPublishResp.json?.data?.publication?.libraryPublicationId || '');

  const relayResp = await callPageJson(page, '/api/platform/library/satchel-relays', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-receipt-create-001',
    },
    data: {
      scopeSetId: 'scope_satchel_receipt_01',
      targetHouseId: targetHouse.houseId,
      transportKind: 'pony.relay.registry.v1',
      approvalId: APPROVED_SATCHEL_RELAY_ID,
    },
  });
  expect(relayResp.status).toBe(201);
  const relay = relayResp.json?.data?.relay || null;
  expect(relay).toMatchObject({
    scopeSetId: 'scope_satchel_receipt_01',
    targetHouseId: targetHouse.houseId,
    relayState: 'queued',
  });

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  const deliverResp = await callPageJson(page, `/api/platform/library/satchel-relays/${encodeURIComponent(relay.librarySatchelRelayId)}/deliver`, {
    method: 'POST',
    data: {},
  });
  expect(deliverResp.status).toBe(201);
  const delivery = deliverResp.json?.data || {};
  expect(delivery.relay).toMatchObject({
    librarySatchelRelayId: relay.librarySatchelRelayId,
    relayState: 'accepted',
    targetHouseId: targetHouse.houseId,
  });
  expect(delivery.receipt).toMatchObject({
    librarySatchelRelayId: relay.librarySatchelRelayId,
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
  expect(Number(statsAfterDelivery?.stats?.counts?.library_satchel_relays || 0)).toBe(Number(statsBefore?.stats?.counts?.library_satchel_relays || 0));
  expect(Number(statsAfterDelivery?.stats?.counts?.library_satchel_receipts || 0)).toBe(Number(statsBefore?.stats?.counts?.library_satchel_receipts || 0) + 1);
  expect(Number(statsAfterDelivery?.stats?.counts?.library_publications || 0)).toBe(Number(statsBefore?.stats?.counts?.library_publications || 0));

  const replayResp = await callPageJson(page, `/api/platform/library/satchel-relays/${encodeURIComponent(relay.librarySatchelRelayId)}/deliver`, {
    method: 'POST',
    data: {},
  });
  expect(replayResp.status).toBe(200);
  expect(String(replayResp.json?.data?.receipt?.librarySatchelReceiptId || '')).toBe(String(delivery.receipt?.librarySatchelReceiptId || ''));

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
    ? inboxBody.inbox.find((entry) => String(entry?.satchelRelay?.librarySatchelRelayId || '') === String(relay.librarySatchelRelayId))
    : null;
  expect(relayMessage).toMatchObject({
    kind: 'msg.library_satchel_bundle.v1',
    toHouseId: targetHouse.houseId,
    fromHouseId: sourceHouse.houseId,
    status: 'accepted',
  });
  expect(relayMessage?.satchelRelay).toMatchObject({
    librarySatchelRelayId: relay.librarySatchelRelayId,
    scopeSetId: 'scope_satchel_receipt_01',
    targetHouseId: targetHouse.houseId,
    title: 'Relay Bundle Receipt Pack',
    memberCount: 2,
  });
  expect(relayMessage?.bundle).toMatchObject({
    orderedPublicationIds: [alphaPublicationId, betaPublicationId],
    orderedItemIds: [alphaId, betaId],
  });
  expect(Array.isArray(relayMessage?.bundle?.members)).toBe(true);
  expect(relayMessage.bundle.members).toHaveLength(2);
  expect(relayMessage?.dispatch).toMatchObject({
    receiptId: delivery.receipt.receiptRef,
    adapter: 'relay.http.v1',
    transportKind: 'pony.relay.registry.v1',
  });

  const exchangeInspector = await getPlatformInspector(request, 'satchel-exchange');
  expect(exchangeInspector.status).toBe(200);
  const inspectorRelay = Array.isArray(exchangeInspector.json?.data?.relays)
    ? exchangeInspector.json.data.relays.find((entry) => String(entry?.librarySatchelRelayId || '') === String(relay.librarySatchelRelayId))
    : null;
  const inspectorReceipt = Array.isArray(exchangeInspector.json?.data?.receipts)
    ? exchangeInspector.json.data.receipts.find((entry) => String(entry?.librarySatchelReceiptId || '') === String(delivery.receipt?.librarySatchelReceiptId || ''))
    : null;
  expect(inspectorRelay).toMatchObject({
    librarySatchelRelayId: relay.librarySatchelRelayId,
    relayState: 'accepted',
    targetHouseId: targetHouse.houseId,
  });
  expect(inspectorReceipt).toMatchObject({
    librarySatchelRelayId: relay.librarySatchelRelayId,
    targetHouseId: targetHouse.houseId,
    receiptRef: delivery.receipt.receiptRef,
    receiptKind: 'pony_dispatch_receipt',
  });
  expect(inspectorReceipt?.metadata).toMatchObject({
    messageId: relayMessage.id,
    dispatchAdapter: 'relay.http.v1',
    transportKind: 'pony.relay.registry.v1',
    scopeSetId: 'scope_satchel_receipt_01',
    memberCount: 2,
  });
});
