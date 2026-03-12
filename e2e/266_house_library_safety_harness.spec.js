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

const REQUIRED_FAMILIES = [
  'library_public_stack_safety_seed',
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M39.0: unified platform harness exposes deterministic Public Stack safety fixtures, inspectors, and export coverage', async ({ request }) => {
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
    publicStackSafety: true,
  }));
  expect(statsA.stats?.counts).toEqual(expect.objectContaining({
    library_public_stack_safety_records: 0,
  }));
  expect(String(statsA.stats?.fixtureManifestHash || '')).toMatch(/^sha256:/);

  const fixture = await getPlatformFixture(request, 'library_public_stack_safety_seed');
  expect(fixture?.ok).toBe(true);
  expect(fixture?.fixture?.sourceHouse).toEqual(expect.objectContaining({
    houseId: 'house_library_safety_source',
    teamId: 'team_main',
  }));
  expect(fixture?.fixture?.targetHouse).toEqual(expect.objectContaining({
    houseId: 'house_library_safety_target',
    teamId: 'team_main',
  }));
  expect(fixture?.fixture?.publicStack).toEqual(expect.objectContaining({
    scopeSetId: 'scope_public_stack_safety_alpha_01',
    familySlug: 'house_library_stacks',
    title: 'Safety Launch Pack',
    expectedMemberCount: 2,
  }));
  expect(fixture?.fixture?.safetyStates).toEqual([
    'visible_here',
    'hidden_here',
    'reported_here',
  ]);
  expect(fixture?.fixture?.filters).toEqual(expect.objectContaining({
    defaultSafetyFilter: '',
    supportedSafetyFilters: [
      'all',
      'visible_here',
      'hidden_here',
      'reported_here',
    ],
    importBlockingStates: [
      'hidden_here',
      'reported_here',
    ],
  }));

  const inspector = await getPlatformInspector(request, 'public-stack-safety');
  expect(inspector.status).toBe(200);
  expect(inspector.json).toMatchObject({
    ok: true,
    inspector: 'public-stack-safety',
    data: {
      safetyRecords: [],
      filters: {
        targetHouseId: '',
        teamId: '',
        libraryPublicStackId: '',
        safetyState: '',
      },
    },
  });

  const exported = await exportPlatformSnapshot(request);
  expect(exported.status).toBe(200);
  const snapshot = exported.json?.snapshot;
  expect(snapshot?.schemaVersion).toBe('platform-export/v1');
  expect(Object.prototype.hasOwnProperty.call(snapshot?.counts || {}, 'library_public_stack_safety_records')).toBe(true);
  expect(Array.isArray(snapshot?.tables?.library_public_stack_safety_records)).toBe(true);

  await resetPortalWebState(request);

  const imported = await importPlatformSnapshot(request, snapshot, { reset: true });
  expect(imported.status).toBe(200);

  const verification = await verifyPlatformSnapshot(request, snapshot);
  expect(verification.status).toBe(200);
  expect(verification.json?.verification?.ok).toBe(true);
});
