const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  exportPlatformSnapshot,
  getPlatformFixture,
  getPlatformInspector,
  getPlatformStats,
  importPlatformSnapshot,
  listPlatformFixtures,
  verifyPlatformSnapshot,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M41.0: unified platform harness exposes deterministic Route Desk fixtures, inspectors, and export coverage', async ({ request }) => {
  const listed = await listPlatformFixtures(request);
  expect(listed?.ok).toBe(true);
  expect(Array.isArray(listed?.families)).toBe(true);
  expect(listed.families).toContain('library_route_sync_seed');

  const stats = await getPlatformStats(request);
  expect(stats?.ok).toBe(true);
  expect(stats?.stats?.fixtureFamilies).toContain('library_route_sync_seed');
  expect(stats?.stats?.inspectors).toEqual(expect.objectContaining({
    routeSync: true,
  }));
  expect(stats?.stats?.counts).toEqual(expect.objectContaining({
    library_route_subscriptions: 0,
    library_route_sync_receipts: 0,
  }));

  const fixture = await getPlatformFixture(request, 'library_route_sync_seed');
  expect(fixture?.ok).toBe(true);
  expect(fixture?.fixture).toMatchObject({
    sourceHouse: {
      houseId: 'house_library_route_source',
      teamId: 'team_main',
    },
    targetHouse: {
      houseId: 'house_library_route_target',
      teamId: 'team_main',
    },
    routeState: 'active',
    bundleKind: 'library_public_stack',
    transport: 'explicit_sync',
  });

  const inspector = await getPlatformInspector(request, 'route-sync');
  expect(inspector.status).toBe(200);
  expect(inspector.json).toMatchObject({
    ok: true,
    inspector: 'route-sync',
    data: {
      subscriptions: [],
      receipts: [],
      filters: {
        sourceHouseId: '',
        targetHouseId: '',
        routeState: '',
      },
    },
  });

  const exported = await exportPlatformSnapshot(request);
  expect(exported.status).toBe(200);
  const snapshot = exported.json?.snapshot;
  expect(Array.isArray(snapshot?.tables?.library_route_subscriptions)).toBe(true);
  expect(Array.isArray(snapshot?.tables?.library_route_sync_receipts)).toBe(true);

  await resetPortalWebState(request);

  const imported = await importPlatformSnapshot(request, snapshot, { reset: true });
  expect(imported.status).toBe(200);

  const verification = await verifyPlatformSnapshot(request, snapshot);
  expect(verification.status).toBe(200);
  expect(verification.json?.verification?.ok).toBe(true);
});
