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

  expect(names).toContain('et.plot.get_state');
  expect(names).toContain('et.plot.place_building');
  expect(names).toContain('et.plot.queue_job');
  expect(names).toContain('et.plot.collect_outputs');
  expect(names).toContain('et.plot.upgrade_building');
  expect(names).toContain('et.plot.set_priority');
  expect(names).toContain('et.plot.claim_reward');
  expect(names).toContain('et.plot.request_user_approval');
});

test('worker tools enforce approval boundaries and preserve idempotent Founders Plot mutations', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });

  const initialState = await invokeWorkerTool(page, 'et.plot.get_state');
  expect(initialState.envelope?.ok).toBe(true);
  expect(initialState.envelope?.data?.state?.plot?.hqLevel).toBe(1);
  expect(initialState.envelope?.data?.state?.quest?.title).toBeTruthy();

  const blockedPlace = await invokeWorkerTool(page, 'et.plot.place_building', {
    type: 'LUMBER_CAMP',
    x: 0,
    y: 0,
    idempotencyKey: 'blocked-place-lumber'
  });
  expect(blockedPlace.envelope?.ok).toBe(false);
  expect(blockedPlace.envelope?.error?.code).toBe('FORBIDDEN_POLICY');
  expect(blockedPlace.envelope?.error?.details?.approvalRequired).toBe(true);

  const approvalRequest = await invokeWorkerTool(page, 'et.plot.request_user_approval', {
    tool: 'et.plot.place_building',
    title: 'Approve Lumber Camp',
    body: 'Allow the foreman to place the first Lumber Camp on the northwest pad.',
    payload: { type: 'LUMBER_CAMP', x: 0, y: 0 },
    idempotencyKey: 'approval-place-lumber'
  });
  expect(approvalRequest.envelope?.ok).toBe(true);

  const approvalId = String(approvalRequest.envelope?.data?.result?.approvalId || '');
  expect(approvalId).toMatch(/^apr_/);
  expect(approvalRequest.envelope?.data?.state?.foreman?.pendingApprovals).toHaveLength(1);

  const resolveResp = await page.evaluate(async (targetApprovalId) => {
    const resp = await fetch(`/api/founders-plot/approvals/${encodeURIComponent(targetApprovalId)}/resolve`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'approve' })
    });
    return await resp.json().catch(() => ({}));
  }, approvalId);
  expect(resolveResp?.ok).toBe(true);

  const placed = await invokeWorkerTool(page, 'et.plot.place_building', {
    type: 'LUMBER_CAMP',
    x: 0,
    y: 0,
    approvalId,
    idempotencyKey: 'approved-place-lumber'
  });
  expect(placed.envelope?.ok).toBe(true);
  expect(String(placed.envelope?.data?.result?.buildingId || '')).toMatch(/^bld_/);
  expect(placed.envelope?.data?.state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP')).toBe(true);

  const replayed = await invokeWorkerTool(page, 'et.plot.place_building', {
    type: 'LUMBER_CAMP',
    x: 0,
    y: 0,
    approvalId,
    idempotencyKey: 'approved-place-lumber'
  });
  expect(replayed.envelope?.ok).toBe(true);
  expect(replayed.envelope?.data?.result?.buildingId).toBe(placed.envelope?.data?.result?.buildingId);
  expect(replayed.envelope?.data?.state?.stateHash).toBe(placed.envelope?.data?.state?.stateHash);
});
