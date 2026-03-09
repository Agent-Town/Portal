const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function resetPortalWebState(request) {
  const resp = await request.post('/__test__/reset', {
    headers: { 'x-test-reset': resetToken }
  });
  if (!resp.ok()) {
    throw new Error(`RESET_FAILED:${resp.status()}`);
  }
}

async function getTableCount(request, table) {
  const resp = await request.get(`/__test__/counts/${encodeURIComponent(table)}`, {
    headers: { 'x-test-reset': resetToken }
  });
  const body = await resp.json().catch(() => ({}));
  return Number(body?.count || 0);
}

async function getPortalState(request) {
  const resp = await request.get('/api/state');
  if (!resp.ok()) {
    throw new Error(`STATE_FAILED:${resp.status()}`);
  }
  return await resp.json();
}

async function bindMockSolanaWallet(request, address = 'So1anaMockResume11111111111111111111111111111') {
  const bindResp = await request.post('/__test__/session/bind-wallet', {
    headers: { 'x-test-reset': resetToken },
    data: {
      chain: 'solana',
      address,
    }
  });
  if (!bindResp.ok()) {
    const body = await bindResp.json().catch(() => ({}));
    throw new Error(`WALLET_BIND_FAILED:${bindResp.status()}:${JSON.stringify(body)}`);
  }
  return address;
}

async function createWebSession(request, {
  url = 'https://github.com/openai/openai-codex/issues/1',
  integrationRegistryId = 'wi_github_issue_reply',
  versionId = 'rv_github_issue_reply_v1',
  renderMode = 'auto',
  autonomyMode = 'assist'
} = {}) {
  const resp = await request.post('/api/web/sessions', {
    data: {
      url,
      integrationRegistryId,
      versionId,
      renderMode,
      autonomyMode
    }
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok()) {
    throw new Error(`WEB_SESSION_CREATE_FAILED:${resp.status()}:${JSON.stringify(body)}`);
  }
  return body;
}

async function seedPokerOperatorFixture(request, fixture) {
  const resp = await request.post('/__test__/poker/operator-fixture', {
    headers: { 'x-test-reset': resetToken },
    data: fixture,
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok()) {
    throw new Error(`POKER_FIXTURE_FAILED:${resp.status()}:${JSON.stringify(body)}`);
  }
  return body;
}

async function syncPokerMirror(request, { seasonId = '' } = {}) {
  const resp = await request.post('/api/poker/admin/sync', {
    data: seasonId ? { seasonId } : {},
  });
  const body = await resp.json().catch(() => ({}));
  return { resp, body };
}

async function getPokerSubmissionRow(request, submissionId) {
  const resp = await request.get(`/__test__/poker/submissions/${encodeURIComponent(submissionId)}`, {
    headers: { 'x-test-reset': resetToken },
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok()) {
    throw new Error(`POKER_SUBMISSION_ROW_FAILED:${resp.status()}:${JSON.stringify(body)}`);
  }
  return body?.submission || null;
}

module.exports = {
  bindMockSolanaWallet,
  createWebSession,
  getPokerSubmissionRow,
  getPortalState,
  getTableCount,
  resetPortalWebState,
  resetToken,
  seedPokerOperatorFixture,
  syncPokerMirror,
};
