const { test, expect } = require('@playwright/test');
const {
  getPlatformCounts,
  getPlatformFixture,
  listPlatformFixtures,
  readWorkerSessionId,
} = require('./helpers/unified_platform');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

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

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', {
    headers: { 'x-test-reset': resetToken },
  });
});

test('M19.0 harness exposes deterministic platform counts, fixtures, and worker continuity', async ({ request, page }) => {
  const countsEnvelope = await getPlatformCounts(request);
  expect(countsEnvelope?.ok).toBe(true);
  expect(countsEnvelope?.counts).toEqual(expect.objectContaining({
    compiled_pack_versions: 0,
    runs: 0,
    trace_intake_records: 0,
    trace_events: 0,
    trace_artifacts: 0,
    config_versions: 0,
    config_component_versions: 0,
    team_config_bindings: 0,
    integration_candidates: 0,
    integration_pack_versions: 0,
    integration_executions: 0,
    trainer_jobs: 0,
    trainer_results: 0,
    library_items: 0,
    library_links: 0,
    scope_sets: 0,
    scope_set_items: 0,
    library_publications: 0,
    track_progress_events: 0,
    sealed_contexts: 0,
    sealed_context_violations: 0,
    approvals: 0,
    usage_ledger: 0,
  }));

  const familiesEnvelope = await listPlatformFixtures(request);
  expect(familiesEnvelope?.ok).toBe(true);
  expect(familiesEnvelope?.families).toEqual(expect.arrayContaining(REQUIRED_FIXTURE_FAMILIES));

  for (const family of REQUIRED_FIXTURE_FAMILIES) {
    const fixtureEnvelope = await getPlatformFixture(request, family);
    expect(fixtureEnvelope?.ok).toBe(true);
    expect(fixtureEnvelope?.family).toBe(family);
    expect(fixtureEnvelope?.fixture).toBeTruthy();
    expect(JSON.stringify(fixtureEnvelope.fixture).length).toBeGreaterThan(8);
  }

  const sessionIdA = await readWorkerSessionId(page);
  expect(sessionIdA).toBeTruthy();
  const sessionIdB = await readWorkerSessionId(page);
  expect(sessionIdB).toBe(sessionIdA);
});
