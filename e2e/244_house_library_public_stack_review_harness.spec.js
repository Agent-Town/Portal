const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  getPlatformFixture,
  getPlatformInspector,
  getPlatformStats,
  listPlatformFixtures,
} = require('./helpers/unified_platform');

const REQUIRED_FAMILIES = [
  'library_public_stack_review_seed',
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.0: unified platform harness exposes deterministic Public Stack review fixtures and inspectors', async ({ request }) => {
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
    publicStackReviews: true,
  }));
  expect(statsA.stats?.counts).toEqual(expect.objectContaining({
    library_public_stack_reviews: 0,
  }));
  expect(String(statsA.stats?.fixtureManifestHash || '')).toMatch(/^sha256:/);

  const fixture = await getPlatformFixture(request, 'library_public_stack_review_seed');
  expect(fixture?.ok).toBe(true);
  expect(fixture?.fixture?.sourceHouse).toEqual(expect.objectContaining({
    houseId: 'house_library_review_source',
    teamId: 'team_main',
  }));
  expect(fixture?.fixture?.targetHouse).toEqual(expect.objectContaining({
    houseId: 'house_library_review_target',
    teamId: 'team_main',
  }));
  expect(fixture?.fixture?.publicStack).toEqual(expect.objectContaining({
    scopeSetId: 'scope_public_stack_review_alpha_01',
    familySlug: 'house_library_stacks',
    title: 'Review Launch Pack',
    expectedMemberCount: 2,
  }));
  expect(fixture?.fixture?.reviewTiers).toEqual([
    'trusted_here',
    'review_later',
    'blocked_here',
  ]);
  expect(fixture?.fixture?.filters).toEqual(expect.objectContaining({
    defaultTrustFilter: '',
    supportedTrustFilters: [
      'trusted_here',
      'review_later',
      'blocked_here',
    ],
  }));

  const reviewsInspector = await getPlatformInspector(request, 'public-stack-reviews');
  expect(reviewsInspector.status).toBe(200);
  expect(reviewsInspector.json).toMatchObject({
    ok: true,
    inspector: 'public-stack-reviews',
    data: {
      reviews: [],
      filters: {
        targetHouseId: '',
        teamId: '',
        libraryPublicStackId: '',
      },
    },
  });
});
