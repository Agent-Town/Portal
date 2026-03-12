const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  getPlatformFixture,
  getPlatformInspector,
  getPlatformStats,
  listPlatformFixtures,
} = require('./helpers/unified_platform');

const REQUIRED_FAMILIES = [
  'library_peer_relay_seed',
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M31.0: unified platform harness exposes deterministic House Library peer relay fixtures and inspectors', async ({ request }) => {
  const listed = await listPlatformFixtures(request);
  expect(listed?.ok).toBe(true);
  expect(Array.isArray(listed?.families)).toBe(true);
  expect(listed.families).toEqual(expect.arrayContaining(REQUIRED_FAMILIES));

  const statsA = await getPlatformStats(request);
  const statsB = await getPlatformStats(request);
  expect(statsA?.ok).toBe(true);
  expect(statsB?.ok).toBe(true);
  expect(statsA.stats).toEqual(statsB.stats);
  expect(statsA.stats?.fixtureFamilies).toEqual(expect.arrayContaining(REQUIRED_FAMILIES));
  expect(statsA.stats?.inspectors).toEqual(expect.objectContaining({
    peerRelay: true,
  }));
  expect(statsA.stats?.counts).toEqual(expect.objectContaining({
    library_peer_relays: 0,
    library_peer_receipts: 0,
  }));
  expect(String(statsA.stats?.fixtureManifestHash || '')).toMatch(/^sha256:/);

  const relayFixture = await getPlatformFixture(request, 'library_peer_relay_seed');
  expect(relayFixture?.ok).toBe(true);
  expect(relayFixture?.fixture?.publication).toEqual(expect.objectContaining({
    houseId: 'house_library_peer_source',
    teamId: 'team_main',
    libraryPublicationId: 'pub_peer_alpha_01',
    registryId: 'regpub_peer_alpha_01',
    visibility: 'registry_public',
  }));
  expect(relayFixture?.fixture?.peerRelay).toEqual(expect.objectContaining({
    targetHouseId: 'house_library_peer_friend',
    transportKind: 'pony.relay.registry.v1',
    relayState: 'queued',
    receiptKind: 'pony_dispatch_receipt',
    expectedReceiptCount: 1,
  }));

  const relayInspector = await getPlatformInspector(request, 'peer-relay');
  expect(relayInspector.status).toBe(200);
  expect(relayInspector.json).toMatchObject({
    ok: true,
    inspector: 'peer-relay',
    data: {
      relays: [],
      receipts: [],
      filters: {
        sourceHouseId: '',
        targetHouseId: '',
        transportKind: '',
      },
    },
  });
});
