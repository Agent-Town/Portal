const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  getPlatformFixture,
  getPlatformInspector,
  getPlatformStats,
  listPlatformFixtures,
} = require('./helpers/unified_platform');

const REQUIRED_FAMILIES = [
  'library_public_stack_trust_seed',
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M34.0: unified platform harness exposes deterministic Public Stack trust fixtures and inspectors', async ({ request }) => {
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
    publicStackTrust: true,
  }));
  expect(statsA.stats?.counts).toEqual(expect.objectContaining({
    library_public_stack_verifications: 0,
    library_public_stack_verification_members: 0,
  }));
  expect(String(statsA.stats?.fixtureManifestHash || '')).toMatch(/^sha256:/);

  const fixture = await getPlatformFixture(request, 'library_public_stack_trust_seed');
  expect(fixture?.ok).toBe(true);
  expect(fixture?.fixture?.sourceHouse).toEqual(expect.objectContaining({
    houseId: 'house_library_trust_source',
    teamId: 'team_main',
  }));
  expect(fixture?.fixture?.targetHouse).toEqual(expect.objectContaining({
    houseId: 'house_library_trust_target',
    teamId: 'team_main',
  }));
  expect(fixture?.fixture?.publicStack).toEqual(expect.objectContaining({
    familySlug: 'house_library_stacks',
    scopeSetId: 'scope_public_stack_trust_alpha_01',
    expectedMemberCount: 2,
    expectedVerificationKind: 'bundle_integrity',
    expectedVerificationState: 'verified',
  }));
  expect(fixture?.fixture?.expectedProofCards).toEqual([
    'Bundle integrity',
    'Local import status',
  ]);

  const trustInspector = await getPlatformInspector(request, 'public-stack-trust');
  expect(trustInspector.status).toBe(200);
  expect(trustInspector.json).toMatchObject({
    ok: true,
    inspector: 'public-stack-trust',
    data: {
      verifications: [],
      verificationMembers: [],
      filters: {
        targetHouseId: '',
        teamId: '',
        libraryPublicStackId: '',
      },
    },
  });
});
