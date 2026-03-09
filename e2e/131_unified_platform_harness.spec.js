const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  getUnifiedPlatformFixture,
  getUnifiedPlatformStats,
  getWorkerSessionId,
  gotoAppWithLite,
  listUnifiedPlatformFixtureFamilies,
} = require('./helpers/unified_platform');

const REQUIRED_FIXTURE_FAMILIES = [
  'portal_default_skill_manual',
  'portal_default_compiled_pack_expected',
  'trace_web_run_seed',
  'trace_web_run_expected_archive',
  'trainer_compare_seed',
  'sealed_context_seed',
  'poker_operator_seed_jsonl',
  'poker_operator_expected_canonical_trace',
];

const REQUIRED_PLATFORM_TABLES = [
  'runs',
  'trace_intake_records',
  'trace_events',
  'trace_artifacts',
  'config_versions',
  'config_component_versions',
  'integration_pack_versions',
  'integration_executions',
  'trainer_jobs',
  'trainer_results',
  'sealed_contexts',
  'approvals',
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M19.0: unified platform harness exposes deterministic fixtures, zeroed counts, and worker continuity', async ({ request, page }) => {
  const stats = await getUnifiedPlatformStats(request);
  expect(stats?.tables).toEqual(REQUIRED_PLATFORM_TABLES);
  for (const tableName of REQUIRED_PLATFORM_TABLES) {
    expect(stats?.counts?.[tableName]).toBe(0);
  }

  const families = await listUnifiedPlatformFixtureFamilies(request);
  expect(families).toEqual(REQUIRED_FIXTURE_FAMILIES.slice().sort());
  for (const family of REQUIRED_FIXTURE_FAMILIES) {
    const fixture = await getUnifiedPlatformFixture(request, family);
    expect(fixture && typeof fixture === 'object').toBeTruthy();
    expect(Object.keys(fixture || {}).length).toBeGreaterThan(0);
  }

  await gotoAppWithLite(page);
  const firstSessionId = await getWorkerSessionId(page);
  const secondSessionId = await getWorkerSessionId(page);

  expect(firstSessionId).toMatch(/^sess_/);
  expect(secondSessionId).toBe(firstSessionId);
});
