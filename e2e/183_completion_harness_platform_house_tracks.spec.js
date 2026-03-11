const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  getPlatformFixture,
  getPlatformStats,
  listPlatformFixtures,
} = require('./helpers/unified_platform');

const REQUIRED_FAMILIES = [
  'trainer_real_result_seed',
  'sealed_read_policy_seed',
  'platform_experience_registration_seed',
  'house_experiences_seed',
  'house_workshop_seed',
  'house_office_staff_seed',
  'tracks_core_seed',
  'tracks_progress_seed',
  'editor_pack_compat_seed',
  'joined_completion_smoke_seed',
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.0: unified platform harness exposes deterministic late-phase fixtures and observability', async ({ request }) => {
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
  expect(statsA.stats?.inspectors).toEqual({
    artifacts: true,
    seals: true,
    house: true,
    tracks: true,
    houseOffice: true,
    houseOfficePresence: true,
    houseOfficeBriefing: true,
    houseOfficeAttention: true,
    houseOfficeAssignments: true,
  });
  expect(String(statsA.stats?.fixtureManifestHash || '')).toMatch(/^sha256:/);
  expect(String(statsA.stats?.fixtureManifest?.trainer_real_result_seed || '')).toMatch(/^sha256:/);
  expect(String(statsA.stats?.fixtureManifest?.joined_completion_smoke_seed || '')).toMatch(/^sha256:/);

  const trainerFixture = await getPlatformFixture(request, 'trainer_real_result_seed');
  expect(trainerFixture?.ok).toBe(true);
  expect(trainerFixture?.fixture?.trainerJob?.jobKind).toBe('trainer_job.compare');
  expect(Array.isArray(trainerFixture?.fixture?.expectedArtifacts)).toBe(true);
  expect(trainerFixture.fixture.expectedArtifacts[0]).toMatchObject({
    artifactKind: 'trainer_report',
  });

  const sealedFixture = await getPlatformFixture(request, 'sealed_read_policy_seed');
  expect(sealedFixture?.ok).toBe(true);
  expect(String(sealedFixture?.fixture?.expectedReadPolicy?.mode || '')).toBe('redact');

  const houseFixture = await getPlatformFixture(request, 'house_experiences_seed');
  expect(houseFixture?.ok).toBe(true);
  expect(Array.isArray(houseFixture?.fixture?.experiences)).toBe(true);
  expect(houseFixture.fixture.experiences.map((entry) => String(entry.experienceId || ''))).toEqual([
    'web.agent',
    'poker.season',
  ]);

  const tracksFixture = await getPlatformFixture(request, 'tracks_progress_seed');
  expect(tracksFixture?.ok).toBe(true);
  expect(tracksFixture.fixture.tracks.map((entry) => String(entry.title || ''))).toEqual([
    'Poker Mastery',
    'Web Ops',
    'Builder',
    'Analyst',
  ]);

  const smokeFixture = await getPlatformFixture(request, 'joined_completion_smoke_seed');
  expect(smokeFixture?.ok).toBe(true);
  expect(smokeFixture.fixture?.smoke).toEqual({
    registry: true,
    web: true,
    poker: true,
    trainer: true,
    house: true,
    tracks: true,
  });
});
