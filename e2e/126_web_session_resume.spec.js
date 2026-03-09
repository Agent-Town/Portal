const { test, expect } = require('@playwright/test');
const {
  bindMockSolanaWallet,
  createWebSession,
  getPortalState,
  getTableCount,
  resetPortalWebState,
} = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M16.3-M16.5: web sessions persist, checkpoint deterministically, and recover via wallet continuity', async ({ request, playwright, baseURL }) => {
  const state = await getPortalState(request);
  const walletAddress = await bindMockSolanaWallet(request);
  const created = await createWebSession(request);
  const session = created.data?.session;

  expect(String(session?.webSessionId || '')).toMatch(/^we_/);
  expect(session?.teamCode).toBe(state.teamCode);
  expect(session?.houseId ?? null).toBe(state.houseId ?? null);
  expect(session?.activeRevision).toBe(1);
  expect(await getTableCount(request, 'web_sessions')).toBe(1);

  const checkpointPayload = {
    pageClass: 'issue_detail',
    draftBuffers: {
      replyBody: 'Draft body'
    },
    approvalQueueState: {
      pendingApprovalIds: []
    },
    evidenceCursor: 'ev_50',
    agentDockState: {
      selectedTaskFlowId: 'draft_comment'
    },
    renderMode: 'companion',
    companionWindow: {
      tabId: 'tab_12',
      lastKnownUrl: 'https://github.com/openai/openai-codex/issues/1'
    }
  };

  const checkpointResp = await request.post(`/api/web/sessions/${session.webSessionId}/checkpoint`, {
    data: {
      expectedRevision: 1,
      idempotencyKey: 'ckp-resume-001',
      checkpoint: checkpointPayload
    }
  });
  expect(checkpointResp.ok()).toBe(true);
  const checkpoint = await checkpointResp.json();
  expect(checkpoint.data?.writtenRevision).toBe(2);

  const staleResp = await request.post(`/api/web/sessions/${session.webSessionId}/checkpoint`, {
    data: {
      expectedRevision: 1,
      idempotencyKey: 'ckp-resume-stale',
      checkpoint: checkpointPayload
    }
  });
  expect(staleResp.status()).toBe(409);
  const stale = await staleResp.json();
  expect(String(stale.error?.code || '')).toBe('WEB_CHECKPOINT_CONFLICT');

  const resumedResp = await request.get(`/api/web/sessions/${session.webSessionId}`);
  expect(resumedResp.ok()).toBe(true);
  const resumed = await resumedResp.json();
  expect(resumed.data?.session?.activeRevision).toBe(2);
  expect(resumed.data?.runtimeSnapshot?.draftBuffers?.replyBody).toBe('Draft body');
  expect(resumed.data?.lastCheckpoint?.payload?.evidenceCursor).toBe('ev_50');

  const recovered = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: {
      'x-wallet-solana-address': walletAddress,
      'x-wallet-recovery-key': state.walletRecoveryKey,
      'x-team-code-hint': state.teamCode
    }
  });
  const recoveredResp = await recovered.get(`/api/web/sessions/${session.webSessionId}`);
  expect(recoveredResp.ok()).toBe(true);
  const recoveredBody = await recoveredResp.json();
  expect(recoveredBody.data?.session?.teamCode).toBe(state.teamCode);
  expect(recoveredBody.data?.session?.houseId ?? null).toBe(state.houseId ?? null);
  expect(await getTableCount(request, 'web_sessions')).toBe(1);
  await recovered.dispose();
});
