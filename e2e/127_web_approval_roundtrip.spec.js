const { test, expect } = require('@playwright/test');
const {
  createWebSession,
  getPortalState,
  getTableCount,
  resetPortalWebState,
} = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M16.6-M16.7: approvals gate writes and invocation/evidence rows are durable and idempotent', async ({ request }) => {
  await getPortalState(request);
  const created = await createWebSession(request);
  const webSessionId = created.data?.session?.webSessionId;
  expect(String(webSessionId || '')).toMatch(/^we_/);

  const approvalRequiredResp = await request.post(`/api/web/sessions/${webSessionId}/actions/submit_reply/invoke`, {
    data: {
      expectedRevision: 1,
      idempotencyKey: 'act-submit-001',
      params: {
        threadId: '123',
        draft: 'Hello world'
      }
    }
  });
  expect(approvalRequiredResp.status()).toBe(409);
  const approvalRequired = await approvalRequiredResp.json();
  expect(String(approvalRequired.error?.code || '')).toBe('WEB_APPROVAL_REQUIRED');
  const approvalId = String(approvalRequired.error?.details?.approvalId || '');
  expect(approvalId).toMatch(/^apr_/);
  expect(await getTableCount(request, 'web_approval_requests')).toBe(1);

  const approveResp = await request.post(`/api/web/approvals/${approvalId}/decision`, {
    data: {
      decision: 'approved',
      reason: 'Human confirmed publication target',
      expectedRevision: 1,
      idempotencyKey: 'aprdec-001'
    }
  });
  expect(approveResp.ok()).toBe(true);
  const approve = await approveResp.json();
  expect(approve.data?.approval?.status).toBe('approved');

  const draftInvokeResp = await request.post(`/api/web/sessions/${webSessionId}/actions/save_draft/invoke`, {
    data: {
      expectedRevision: 2,
      idempotencyKey: 'act-draft-001',
      params: {
        draft: 'Keep this local'
      }
    }
  });
  expect(draftInvokeResp.ok()).toBe(true);
  const draftInvoke = await draftInvokeResp.json();
  expect(String(draftInvoke.data?.invocation?.invocationId || '')).toMatch(/^act_/);
  expect(await getTableCount(request, 'web_action_invocations')).toBe(1);

  const replayResp = await request.post(`/api/web/sessions/${webSessionId}/actions/save_draft/invoke`, {
    data: {
      expectedRevision: 999,
      idempotencyKey: 'act-draft-001',
      params: {
        draft: 'Keep this local'
      }
    }
  });
  expect(replayResp.ok()).toBe(true);
  const replay = await replayResp.json();
  expect(replay.data?.invocation?.invocationId).toBe(draftInvoke.data?.invocation?.invocationId);
  expect(await getTableCount(request, 'web_action_invocations')).toBe(1);

  const evidenceResp = await request.get(`/api/web/sessions/${webSessionId}/evidence?limit=5`);
  expect(evidenceResp.ok()).toBe(true);
  const evidence = await evidenceResp.json();
  const items = Array.isArray(evidence.data?.items) ? evidence.data.items : [];
  expect(items.length).toBeGreaterThanOrEqual(2);
  expect(items[0].createdAt >= items[1].createdAt).toBe(true);
  expect(items.some((item) => item.category === 'approval_decided')).toBe(true);
  expect(items.some((item) => item.category === 'tool_invoked')).toBe(true);
});
