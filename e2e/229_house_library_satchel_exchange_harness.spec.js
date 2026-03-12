const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  getPlatformFixture,
  getPlatformInspector,
  getPlatformStats,
  listPlatformFixtures,
} = require('./helpers/unified_platform');

const REQUIRED_FAMILIES = [
  'library_satchel_exchange_seed',
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.0: unified platform harness exposes deterministic House Library satchel exchange fixtures and inspectors', async ({ request }) => {
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
    satchelExchange: true,
  }));
  expect(statsA.stats?.counts).toEqual(expect.objectContaining({
    library_satchel_relays: 0,
    library_satchel_receipts: 0,
  }));
  expect(String(statsA.stats?.fixtureManifestHash || '')).toMatch(/^sha256:/);

  const satchelFixture = await getPlatformFixture(request, 'library_satchel_exchange_seed');
  expect(satchelFixture?.ok).toBe(true);
  expect(satchelFixture?.fixture?.scopeSet).toEqual(expect.objectContaining({
    houseId: 'house_library_satchel_source',
    teamId: 'team_main',
    scopeSetId: 'scope_satchel_alpha_01',
    title: 'Launch Satchel Alpha',
    scopeKind: 'satchel',
  }));
  expect(satchelFixture?.fixture?.bundleRelay).toEqual(expect.objectContaining({
    targetHouseId: 'house_library_satchel_friend',
    relayState: 'queued',
    receiptKind: 'pony_dispatch_receipt',
    expectedReceiptCount: 1,
  }));
  expect(Array.isArray(satchelFixture?.fixture?.bundleRelay?.publicationRefs)).toBe(true);
  expect(satchelFixture.fixture.bundleRelay.publicationRefs).toEqual([
    'pub_satchel_alpha_01',
    'pub_satchel_alpha_02',
  ]);

  const exchangeInspector = await getPlatformInspector(request, 'satchel-exchange');
  expect(exchangeInspector.status).toBe(200);
  expect(exchangeInspector.json).toMatchObject({
    ok: true,
    inspector: 'satchel-exchange',
    data: {
      relays: [],
      receipts: [],
      filters: {
        sourceHouseId: '',
        targetHouseId: '',
        scopeSetId: '',
      },
    },
  });
});
