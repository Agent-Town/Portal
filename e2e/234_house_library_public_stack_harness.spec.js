const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  getPlatformFixture,
  getPlatformInspector,
  getPlatformStats,
  listPlatformFixtures,
} = require('./helpers/unified_platform');

const REQUIRED_FAMILIES = [
  'library_public_stack_seed',
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M33.0: unified platform harness exposes deterministic House Library public stack fixtures and inspectors', async ({ request }) => {
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
    publicStacks: true,
  }));
  expect(statsA.stats?.counts).toEqual(expect.objectContaining({
    library_public_stacks: 0,
    library_public_stack_members: 0,
  }));
  expect(String(statsA.stats?.fixtureManifestHash || '')).toMatch(/^sha256:/);

  const fixture = await getPlatformFixture(request, 'library_public_stack_seed');
  expect(fixture?.ok).toBe(true);
  expect(fixture?.fixture?.scopeSet).toEqual(expect.objectContaining({
    houseId: 'house_library_public_source',
    teamId: 'team_main',
    scopeSetId: 'scope_public_stack_alpha_01',
    title: 'Public Launch Satchel',
    scopeKind: 'satchel',
  }));
  expect(fixture?.fixture?.publicStack).toEqual(expect.objectContaining({
    familySlug: 'house_library_stacks',
    title: 'Public Launch Satchel',
    expectedMemberCount: 2,
    targetHouseId: 'house_library_public_friend',
  }));
  expect(Array.isArray(fixture?.fixture?.publicStack?.publicationRefs)).toBe(true);
  expect(fixture.fixture.publicStack.publicationRefs).toEqual([
    'pub_public_stack_alpha_01',
    'pub_public_stack_alpha_02',
  ]);

  const publicStacksInspector = await getPlatformInspector(request, 'public-stacks');
  expect(publicStacksInspector.status).toBe(200);
  expect(publicStacksInspector.json).toMatchObject({
    ok: true,
    inspector: 'public-stacks',
    data: {
      publicStacks: [],
      members: [],
      filters: {
        sourceHouseId: '',
        familySlug: '',
        scopeSetId: '',
      },
    },
  });
});
