const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  getPlatformFixture,
  getPlatformStats,
  listPlatformFixtures,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M40.0: unified platform harness exposes deterministic Public Stack discovery fixtures without adding a new persistent table', async ({ request }) => {
  const listed = await listPlatformFixtures(request);
  expect(listed?.ok).toBe(true);
  expect(Array.isArray(listed?.families)).toBe(true);
  expect(listed.families).toContain('library_public_stack_discovery_seed');

  const stats = await getPlatformStats(request);
  expect(stats?.ok).toBe(true);
  expect(stats?.stats?.fixtureFamilies).toContain('library_public_stack_discovery_seed');
  expect(Object.prototype.hasOwnProperty.call(stats?.stats?.counts || {}, 'library_public_stack_discovery_records')).toBe(false);

  const fixture = await getPlatformFixture(request, 'library_public_stack_discovery_seed');
  expect(fixture?.ok).toBe(true);
  expect(fixture?.fixture?.sourceHouse).toEqual(expect.objectContaining({
    houseId: 'house_library_discovery_source',
    teamId: 'team_main',
  }));
  expect(fixture?.fixture?.targetHouse).toEqual(expect.objectContaining({
    houseId: 'house_library_discovery_target',
    teamId: 'team_main',
  }));
  expect(fixture?.fixture?.discoveryLanes).toEqual([
    'ready_here',
    'check_here',
    'attested_elsewhere',
    'imported_here',
  ]);
  expect(fixture?.fixture?.lanePriority).toEqual([
    'imported_here',
    'ready_here',
    'attested_elsewhere',
    'check_here',
  ]);
});
