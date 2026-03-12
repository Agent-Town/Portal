const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformInspector,
  getPlatformStats,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';
const APPROVED_RELAY_ID = 'appr_fixture_library_peer_relay_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M31.1: House Library creates one approval-gated peer relay from an existing publication and replays idempotently', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  let targetHouse = null;
  try {
    targetHouse = await seedRecoverableTokenHouse(targetApi);
  } finally {
    await targetApi.dispose();
  }
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_peer_relay_source_01',
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

  const createResp = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-peer-relay-item-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Peer Relay Launch Kit',
      summary: 'One published Library item ready to relay to another House.',
      contentText: 'Relay this publication to another House after approval.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/peer-relay-launch.md',
    },
    failOnStatusCode: false,
  });
  expect(createResp.status()).toBe(201);
  const createBody = await createResp.json();
  const libraryItemId = String(createBody?.data?.item?.libraryItemId || '');
  expect(libraryItemId).toMatch(/^lib_/);

  const publishResp = await page.request.post('/api/platform/library/publications', {
    headers: {
      'Idempotency-Key': 'library-peer-relay-publication-001',
    },
    data: {
      libraryItemId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
    failOnStatusCode: false,
  });
  expect(publishResp.status()).toBe(201);
  const publishBody = await publishResp.json();
  const libraryPublicationId = String(publishBody?.data?.publication?.libraryPublicationId || '');
  const registryId = String(publishBody?.data?.publication?.registryId || '');
  expect(libraryPublicationId).toMatch(/^pub_/);
  expect(registryId).toMatch(/^regpub_/);

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  const blockedResp = await page.request.post('/api/platform/library/peer-relays', {
    headers: {
      'Idempotency-Key': 'library-peer-relay-create-001',
    },
    data: {
      libraryPublicationId,
      targetHouseId: String(targetHouse?.houseId || ''),
      transportKind: 'pony.relay.registry.v1',
    },
    failOnStatusCode: false,
  });
  expect(blockedResp.status()).toBe(409);
  const blockedBody = await blockedResp.json();
  expect(String(blockedBody?.error?.code || '')).toBe('LIBRARY_PEER_RELAY_APPROVAL_REQUIRED');

  const statsAfterBlocked = await getPlatformStats(request);
  expect(statsAfterBlocked?.stats?.counts).toEqual(statsBefore?.stats?.counts);

  const relayResp = await page.request.post('/api/platform/library/peer-relays', {
    headers: {
      'Idempotency-Key': 'library-peer-relay-create-001',
    },
    data: {
      libraryPublicationId,
      targetHouseId: String(targetHouse?.houseId || ''),
      transportKind: 'pony.relay.registry.v1',
      approvalId: APPROVED_RELAY_ID,
    },
    failOnStatusCode: false,
  });
  expect(relayResp.status()).toBe(201);
  const relayBody = await relayResp.json();
  expect(relayBody?.data?.relay).toMatchObject({
    libraryPublicationId,
    registryId,
    targetHouseId: targetHouse.houseId,
    transportKind: 'pony.relay.registry.v1',
    relayState: 'queued',
  });
  const libraryPeerRelayId = String(relayBody?.data?.relay?.libraryPeerRelayId || '');
  expect(libraryPeerRelayId).toMatch(/^prelay_/);

  const statsAfterRelay = await getPlatformStats(request);
  expect(Number(statsAfterRelay?.stats?.counts?.library_peer_relays || 0)).toBe(Number(statsBefore?.stats?.counts?.library_peer_relays || 0) + 1);
  expect(Number(statsAfterRelay?.stats?.counts?.library_peer_receipts || 0)).toBe(Number(statsBefore?.stats?.counts?.library_peer_receipts || 0));

  const replayResp = await page.request.post('/api/platform/library/peer-relays', {
    headers: {
      'Idempotency-Key': 'library-peer-relay-create-001',
    },
    data: {
      libraryPublicationId,
      targetHouseId: String(targetHouse?.houseId || ''),
      transportKind: 'pony.relay.registry.v1',
    },
    failOnStatusCode: false,
  });
  expect(replayResp.status()).toBe(200);
  const replayBody = await replayResp.json();
  expect(String(replayBody?.data?.relay?.libraryPeerRelayId || '')).toBe(libraryPeerRelayId);

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterRelay?.stats?.counts);

  const relayInspector = await getPlatformInspector(request, 'peer-relay');
  expect(relayInspector.status).toBe(200);
  const relay = Array.isArray(relayInspector.json?.data?.relays)
    ? relayInspector.json.data.relays.find((entry) => String(entry?.libraryPeerRelayId || '') === libraryPeerRelayId)
    : null;
  expect(relay).toMatchObject({
    libraryPublicationId,
    registryId,
    targetHouseId: targetHouse.houseId,
    transportKind: 'pony.relay.registry.v1',
    relayState: 'queued',
  });
});
