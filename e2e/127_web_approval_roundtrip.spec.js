const { test, expect } = require('@playwright/test');
const {
  createWebSession,
  getPortalState,
  getTableCount,
  resetPortalWebState,
} = require('./helpers/portal_web');
const {
  gotoAppWithLite,
  openTrainerFromSidebar,
  openTrainerToolsTab,
} = require('./helpers/trainer');

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

async function invokeTrainerTool(page, toolName, params = {}) {
  const resultNode = page.getByTestId('trainer-tool-result');
  const beforeText = String((await resultNode.textContent()) || '');
  await page.getByTestId('trainer-tool-name').selectOption(toolName);
  await page.getByTestId('trainer-tool-params').fill(JSON.stringify(params, null, 2));
  await page.getByTestId('trainer-tool-invoke').click();
  await expect.poll(async () => {
    const current = String((await resultNode.textContent()) || '');
    return current.length > 0 && current !== beforeText;
  }, { timeout: 5000 }).toBe(true);
  return await page.evaluate(() => {
    const node = document.getElementById('trainerToolResult');
    return node ? JSON.parse(String(node.textContent || '{}')) : null;
  });
}

test('M16.14: trainer namespace webSessionId bridge matches /api/web/* evidence and idempotent invocation ids', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });

  const created = await page.evaluate(async () => {
    const response = await fetch('/api/web/sessions', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://github.com/openai/openai-codex/issues/1',
        integrationRegistryId: 'wi_github_issue_reply',
        versionId: 'rv_github_issue_reply_v1',
        renderMode: 'auto',
        autonomyMode: 'assist',
      }),
    });
    return await response.json();
  });
  const webSessionId = String(created?.data?.session?.webSessionId || '');
  expect(webSessionId).toMatch(/^we_/);

  const directInvoke = await page.evaluate(async (sessionId) => {
    const response = await fetch(`/api/web/sessions/${encodeURIComponent(sessionId)}/actions/save_draft/invoke`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        expectedRevision: 1,
        idempotencyKey: 'act-web-parity-001',
        params: {
          draft: 'Trainer parity draft',
        },
      }),
    });
    return await response.json();
  }, webSessionId);
  const directInvocationId = String(directInvoke?.data?.invocation?.invocationId || '');
  expect(directInvocationId).toMatch(/^act_/);

  const directEvidence = await page.evaluate(async (sessionId) => {
    const response = await fetch(`/api/web/sessions/${encodeURIComponent(sessionId)}/evidence?limit=20`, {
      credentials: 'include',
    });
    return await response.json();
  }, webSessionId);
  const directEvidenceItems = Array.isArray(directEvidence?.data?.items) ? directEvidence.data.items : [];
  const directEvidenceIds = directEvidenceItems.map((item) => String(item?.evidenceId || '')).filter(Boolean).sort();
  expect(directEvidenceIds.length).toBeGreaterThan(0);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  const trainerEvidence = await invokeTrainerTool(page, 'trainer.list_evidence', {
    webSessionId,
    limit: 20,
  });
  expect(trainerEvidence?.ok).toBe(true);
  expect(Number(trainerEvidence?.count || 0)).toBe(directEvidenceIds.length);
  const trainerEvidenceIds = (Array.isArray(trainerEvidence?.evidence) ? trainerEvidence.evidence : [])
    .map((item) => String(item?.evidenceId || ''))
    .filter(Boolean)
    .sort();
  expect(trainerEvidenceIds).toEqual(directEvidenceIds);

  const trainerInvoke = await invokeTrainerTool(page, 'trainer.invoke_action', {
    webSessionId,
    actionId: 'save_draft',
    idempotencyKey: 'act-web-parity-001',
    expectedRevision: 999,
    params: {
      draft: 'Trainer parity draft',
    },
  });
  expect(trainerInvoke?.ok).toBe(true);
  expect(String(trainerInvoke?.invocation?.invocationId || '')).toBe(directInvocationId);
});
