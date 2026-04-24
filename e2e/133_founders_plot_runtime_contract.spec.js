const { test, expect } = require('@playwright/test');
const { gotoAppWithLite } = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function invokeWorkerTool(page, tool, params = {}) {
  return page.evaluate(async ({ toolName, toolParams }) => {
    const api = window.__openclawLiteTest;
    if (!api || typeof api.invokeTool !== 'function') {
      throw new Error('invokeTool helper is unavailable');
    }
    const raw = await api.invokeTool({ tool: toolName, params: toolParams || {} });
    const textPart = Array.isArray(raw?.content)
      ? raw.content.find((part) => part && part.type === 'text')
      : null;
    const text = typeof textPart?.text === 'string' ? textPart.text : '';
    let envelope = null;
    try {
      envelope = text ? JSON.parse(text) : null;
    } catch {
      envelope = null;
    }
    return { raw, text, envelope };
  }, { toolName: String(tool || ''), toolParams: params || {} });
}

test('worker registry exposes the bounded Founders Plot foreman tool family', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });

  const registry = await page.evaluate(async () => window.__openclawLiteTest.getToolRegistryInfo());
  const names = Array.isArray(registry?.names) ? registry.names : [];

  expect(names).toContain('et_plot_get_state');
  expect(names).toContain('et_plot_place_building');
  expect(names).toContain('et_plot_queue_job');
  expect(names).toContain('et_plot_collect_outputs');
  expect(names).toContain('et_plot_upgrade_building');
  expect(names).toContain('et_plot_set_priority');
  expect(names).toContain('et_plot_claim_reward');
  expect(names).toContain('et_plot_request_user_approval');
  expect(names).toContain('et_plot_contracts_get_state');
  expect(names).toContain('et_plot_contracts_accept');
  expect(names).toContain('et_plot_contracts_turn_in');
  expect(names).toContain('et_foreman_policy_get_standing_order');
  expect(names).toContain('et_foreman_policy_set_standing_order');
  expect(names).toContain('et_foreman_scheduler_get_status');
  expect(names).toContain('et_foreman_scheduler_enable_collect_ready_outputs');
  expect(names).toContain('et_foreman_scheduler_pause');
  expect(names).toContain('et_foreman_scheduler_resume');
  expect(names.some((name) => String(name || '').includes('.'))).toBe(false);
});

test('worker tools preserve the schema-v3 Founders Plot state and idempotent human-route mutations', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });

  const initialState = await invokeWorkerTool(page, 'et.plot.get_state');
  expect(initialState.envelope?.ok).toBe(true);
  expect(initialState.envelope?.data?.state?.plot?.hqLevel).toBe(1);
  expect(initialState.envelope?.data?.state?.quest?.title).toBeTruthy();
  expect(initialState.envelope?.data?.state?.compatibility?.schemaVersion).toBe(3);

  const placed = await invokeWorkerTool(page, 'et.plot.place_building', {
    type: 'LUMBER_CAMP',
    x: 0,
    y: 0,
    idempotencyKey: 'placed-place-lumber'
  });
  expect(placed.envelope?.ok).toBe(true);
  expect(String(placed.envelope?.data?.result?.buildingId || '')).toMatch(/^bld_/);
  expect(placed.envelope?.data?.state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP')).toBe(true);

  const replayed = await invokeWorkerTool(page, 'et.plot.place_building', {
    type: 'LUMBER_CAMP',
    x: 0,
    y: 0,
    idempotencyKey: 'placed-place-lumber'
  });
  expect(replayed.envelope?.ok).toBe(true);
  expect(replayed.envelope?.data?.result?.buildingId).toBe(placed.envelope?.data?.result?.buildingId);
  expect(replayed.envelope?.data?.state?.stateHash).toBe(placed.envelope?.data?.state?.stateHash);
});
