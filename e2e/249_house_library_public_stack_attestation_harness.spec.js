const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  getPlatformFixture,
  getPlatformInspector,
  getPlatformStats,
  listPlatformFixtures,
} = require('./helpers/unified_platform');

const REQUIRED_FAMILIES = [
  'library_public_stack_attestation_seed',
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M36.0: unified platform harness exposes deterministic Public Stack attestation fixtures and inspectors', async ({ request }) => {
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
    publicStackAttestations: true,
  }));
  expect(statsA.stats?.counts).toEqual(expect.objectContaining({
    library_public_stack_attestations: 0,
  }));
  expect(String(statsA.stats?.fixtureManifestHash || '')).toMatch(/^sha256:/);

  const fixture = await getPlatformFixture(request, 'library_public_stack_attestation_seed');
  expect(fixture?.ok).toBe(true);
  expect(fixture?.fixture?.sourceHouse).toEqual(expect.objectContaining({
    houseId: 'house_library_attestation_source',
    teamId: 'team_main',
  }));
  expect(fixture?.fixture?.targetHouse).toEqual(expect.objectContaining({
    houseId: 'house_library_attestation_target',
    teamId: 'team_main',
  }));
  expect(fixture?.fixture?.publicStack).toEqual(expect.objectContaining({
    scopeSetId: 'scope_public_stack_attestation_alpha_01',
    familySlug: 'house_library_stacks',
    title: 'Attestation Launch Pack',
    expectedMemberCount: 2,
  }));
  expect(fixture?.fixture?.reviewTiers).toEqual([
    'trusted_here',
    'review_later',
    'blocked_here',
  ]);
  expect(fixture?.fixture?.attestationPolicy).toEqual(expect.objectContaining({
    requiresLocalReview: true,
    oneAttestationPerHousePerStack: true,
    supportsNote: true,
  }));

  const attestationsInspector = await getPlatformInspector(request, 'public-stack-attestations');
  expect(attestationsInspector.status).toBe(200);
  expect(attestationsInspector.json).toMatchObject({
    ok: true,
    inspector: 'public-stack-attestations',
    data: {
      attestations: [],
      filters: {
        sourceHouseId: '',
        teamId: '',
        libraryPublicStackId: '',
        reviewTier: '',
      },
    },
  });
});
