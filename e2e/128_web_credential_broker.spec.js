const { test, expect } = require('@playwright/test');
const {
  createWebSession,
  getPortalState,
  getTableCount,
  resetPortalWebState,
  resetToken,
} = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M16.8: credential broker uses origin-scoped grants and hides raw secrets', async ({ request }) => {
  await getPortalState(request);
  const created = await createWebSession(request);
  const githubWebSessionId = created.data?.session?.webSessionId;

  const approvalNeededResp = await request.post(`/api/web/sessions/${githubWebSessionId}/actions/submit_reply/invoke`, {
    data: {
      expectedRevision: 1,
      idempotencyKey: 'act-cred-approval',
      params: {
        draft: 'Ship it'
      }
    }
  });
  const approvalNeeded = await approvalNeededResp.json();
  const approvalId = String(approvalNeeded.error?.details?.approvalId || '');

  const approveResp = await request.post(`/api/web/approvals/${approvalId}/decision`, {
    data: {
      decision: 'approved',
      reason: 'Human confirmed publication target',
      expectedRevision: 1,
      idempotencyKey: 'aprdec-cred-001'
    }
  });
  expect(approveResp.ok()).toBe(true);

  const missingGrantResp = await request.post(`/api/web/sessions/${githubWebSessionId}/actions/submit_reply/invoke`, {
    data: {
      expectedRevision: 2,
      approvalId,
      idempotencyKey: 'act-cred-missing',
      params: {
        draft: 'Ship it'
      }
    }
  });
  expect(missingGrantResp.status()).toBe(409);
  const missingGrant = await missingGrantResp.json();
  expect(String(missingGrant.error?.code || '')).toBe('WEB_CREDENTIAL_REQUIRED');

  const brokerResp = await request.post('/api/web/credentials/start', {
    data: {
      webSessionId: githubWebSessionId,
      origin: 'https://github.com',
      authClass: 'oauth',
      scopes: ['repo:issue:write']
    }
  });
  expect(brokerResp.ok()).toBe(true);
  const broker = await brokerResp.json();
  expect(String(broker.data?.brokerSessionId || '')).toMatch(/^wcb_/);

  const activateResp = await request.post('/__test__/web/credentials/activate', {
    headers: { 'x-test-reset': resetToken },
    data: {
      brokerSessionId: broker.data.brokerSessionId,
      redactedLabel: 'GitHub Test Grant'
    }
  });
  expect(activateResp.ok()).toBe(true);
  const activated = await activateResp.json();
  const credentialGrantId = activated.grant?.credentialGrantId;
  expect(String(credentialGrantId || '')).toMatch(/^wcg_/);
  expect(await getTableCount(request, 'origin_credential_grants')).toBe(1);

  const successResp = await request.post(`/api/web/sessions/${githubWebSessionId}/actions/submit_reply/invoke`, {
    data: {
      expectedRevision: 2,
      approvalId,
      credentialGrantId,
      idempotencyKey: 'act-cred-success',
      params: {
        draft: 'Ship it'
      }
    }
  });
  expect(successResp.ok()).toBe(true);
  const success = await successResp.json();
  expect(success.data?.invocation?.usedCredentialGrantId).toBe(credentialGrantId);
  expect(JSON.stringify(success)).not.toContain('token');

  const foreignSession = await createWebSession(request, {
    url: 'https://gitlab.com/example/project/issues/1',
    integrationRegistryId: 'wi_gitlab_issue_reply',
    versionId: 'rv_gitlab_issue_reply_v1'
  });
  const foreignWebSessionId = foreignSession.data?.session?.webSessionId;

  const foreignApprovalResp = await request.post(`/api/web/sessions/${foreignWebSessionId}/actions/submit_reply/invoke`, {
    data: {
      expectedRevision: 1,
      idempotencyKey: 'act-foreign-approval',
      params: {
        draft: 'Try cross-origin'
      }
    }
  });
  const foreignApproval = await foreignApprovalResp.json();
  const foreignApprovalId = String(foreignApproval.error?.details?.approvalId || '');

  const foreignApproveResp = await request.post(`/api/web/approvals/${foreignApprovalId}/decision`, {
    data: {
      decision: 'approved',
      reason: 'Approved foreign origin test',
      expectedRevision: 1,
      idempotencyKey: 'aprdec-foreign-001'
    }
  });
  expect(foreignApproveResp.ok()).toBe(true);

  const mismatchResp = await request.post(`/api/web/sessions/${foreignWebSessionId}/actions/submit_reply/invoke`, {
    data: {
      expectedRevision: 2,
      approvalId: foreignApprovalId,
      credentialGrantId,
      idempotencyKey: 'act-foreign-mismatch',
      params: {
        draft: 'Try cross-origin'
      }
    }
  });
  expect(mismatchResp.status()).toBe(409);
  const mismatch = await mismatchResp.json();
  expect(['WEB_CREDENTIAL_SCOPE_MISMATCH', 'WEB_ORIGIN_BLOCKED']).toContain(String(mismatch.error?.code || ''));
});
