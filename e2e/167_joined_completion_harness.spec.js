const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  getRegistryWebPokerFixture,
  getRegistryWebPokerStats,
  listRegistryWebPokerFixtures,
} = require('./helpers/registry_web_poker');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.0: registry/web/poker harness exposes deterministic fixture families and inspection stats', async ({ request }) => {
  const expectedFamilies = [
    'registry_family_seed',
    'registry_claim_review_seed',
    'registry_proof_seed',
    'web_parse_stub_seed',
    'web_adapter_expected_actions',
    'poker_season_detail_seed',
    'poker_run_history_seed',
    'poker_safety_evidence_seed',
  ];

  const listed = await listRegistryWebPokerFixtures(request);
  expect(listed.ok).toBe(true);
  expect(Array.isArray(listed.families)).toBe(true);
  expect(listed.families).toEqual(expectedFamilies);

  const statsA = await getRegistryWebPokerStats(request);
  const statsB = await getRegistryWebPokerStats(request);
  expect(statsA.ok).toBe(true);
  expect(statsB.ok).toBe(true);
  expect(statsA.stats).toEqual(statsB.stats);
  expect(statsA.stats?.fixtureFamilies).toEqual(expectedFamilies);
  expect(statsA.stats?.inspectors).toEqual({
    registry: true,
    packManifest: true,
    poker: true,
  });
  expect(String(statsA.stats?.fixtureManifestHash || '')).toMatch(/^sha256:/);

  const registryFixture = await getRegistryWebPokerFixture(request, 'registry_family_seed');
  expect(registryFixture.ok).toBe(true);
  expect(Array.isArray(registryFixture.fixture?.groupedSearch)).toBe(true);
  expect(registryFixture.fixture.groupedSearch.length).toBeGreaterThan(0);

  const parseFixture = await getRegistryWebPokerFixture(request, 'web_parse_stub_seed');
  expect(parseFixture.ok).toBe(true);
  expect(String(parseFixture.fixture?.parseCandidate?.sourceKind || '')).toBe('parse');
  expect(String(parseFixture.fixture?.compiledPack?.contentHash || '')).toMatch(/^sha256:/);
  expect(String(parseFixture.fixture?.compiledPack?.fileHashes?.['manifest.json'] || '')).toMatch(/^sha256:/);

  const pokerFixture = await getRegistryWebPokerFixture(request, 'poker_run_history_seed');
  expect(pokerFixture.ok).toBe(true);
  const snapshots = Array.isArray(pokerFixture.fixture?.snapshots) ? pokerFixture.fixture.snapshots : [];
  expect(snapshots.map((entry) => String(entry.snapshotId || ''))).toEqual([
    'snapshot_fixture_02',
    'snapshot_fixture_01',
  ]);
});
