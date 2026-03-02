const { test, expect } = require('@playwright/test');
const {
  bootstrapExperienceIntentHarness,
  invokeExperienceTool,
  readExperienceIntentTrace,
  readPathname,
  readSessionState
} = require('./helpers/experience_intents');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function ensureAgentConnected(page) {
  const state = await readSessionState(page);
  if (state?.agent?.connected === true) return state;
  const teamCode = String(state?.teamCode || '').trim();
  const result = await page.evaluate(async (code) => {
    const resp = await fetch('/api/agent/connect', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ teamCode: code, agentName: 'IntentContinuityBot' })
    });
    return await resp.json().catch(() => ({}));
  }, teamCode);
  expect(result?.ok).toBe(true);
  const next = await readSessionState(page);
  expect(next?.agent?.connected).toBe(true);
  return next;
}

test('AC-61: worker remains connected and teamCode-stable during multi-intent UI sequence', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);
  expect(await readPathname(page)).toBe('/app');

  // AC-61.1 baseline snapshot
  const before = await ensureAgentConnected(page);
  const initialTeamCode = String(before?.teamCode || '');
  expect(initialTeamCode).toMatch(/^TEAM-/);
  expect(before?.agent?.connected).toBe(true);

  // AC-61.2 sequence
  const results = [];
  results.push(await invokeExperienceTool(page, 'agent_town_ui_open_modal', { modal: 'atlas', params: {} }));
  expect(await readPathname(page)).toBe('/app');
  results.push(await invokeExperienceTool(page, 'agent_town_ui_atlas_search', { q: 'sentinel', family: 'ethereum', searchType: 'keyword' }));
  expect(await readPathname(page)).toBe('/app');
  results.push(await invokeExperienceTool(page, 'agent_town_ui_open_modal', { modal: 'pony', params: {} }));
  expect(await readPathname(page)).toBe('/app');
  results.push(await invokeExperienceTool(page, 'agent_town_ui_pony_compose', {
    toHouseId: 'hs_test_receiver',
    subject: 'Continuity Subject',
    draft: 'Continuity Draft'
  }));
  expect(await readPathname(page)).toBe('/app');

  // AC-61.3 / AC-61.4 / AC-61.5
  const after = await readSessionState(page);
  expect(after?.agent?.connected).toBe(true);
  expect(String(after?.teamCode || '')).toBe(initialTeamCode);

  // Sequence call success envelopes
  for (const row of results) {
    expect(row?.ok).toBe(true);
    expect(row?.applied).toBe(true);
  }

  // AC-61.6: trace has one success record per intent call.
  const trace = await readExperienceIntentTrace(page);
  expect(Array.isArray(trace?.events)).toBe(true);
  const successes = trace.events.filter((row) => row && row.ok === true);
  expect(successes).toHaveLength(4);
});
