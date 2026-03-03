const { test, expect, request } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const MOCK_SOLANA_ADDRESS = process.env.TEST_TOKEN_ADDRESS || 'So1anaMockToken1111111111111111111111111111';

async function createApiContext(testInfo) {
  const baseURL = testInfo.project.use.baseURL;
  return request.newContext({ baseURL });
}

async function getSession(api) {
  const resp = await api.get('/api/session');
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  expect(body?.ok).toBe(true);
  expect(typeof body?.teamCode).toBe('string');
  expect(body?.walletRecoveryKey).toMatch(/^wrk_[a-f0-9]{64}$/);
  return body;
}

async function bindMockSolanaWallet(api, address = MOCK_SOLANA_ADDRESS) {
  const nonceResp = await api.get('/api/token/nonce');
  expect(nonceResp.ok()).toBeTruthy();
  const nonceBody = await nonceResp.json();
  expect(nonceBody?.ok).toBe(true);
  const nonce = nonceBody?.nonce;
  expect(typeof nonce).toBe('string');

  const lookupResp = await api.post('/api/token/verify', {
    data: {
      address,
      nonce,
      signature: 'sig_mock_token_verify'
    }
  });
  expect(lookupResp.ok()).toBeTruthy();
  const lookupBody = await lookupResp.json();
  expect(lookupBody?.ok).toBe(true);
  expect(lookupBody?.eligible).toBe(true);
}

test.beforeEach(async ({ request }) => {
  const resetResp = await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  expect(resetResp.ok()).toBeTruthy();
});

test('wallet recovery requires both wallet hint and matching recovery key', async () => {
  const victimApi = await createApiContext(test.info());
  const attackerApi = await createApiContext(test.info());
  const noKeyApi = await createApiContext(test.info());
  const recoverApi = await createApiContext(test.info());

  try {
    const victimSession = await getSession(victimApi);
    await bindMockSolanaWallet(victimApi, MOCK_SOLANA_ADDRESS);

    const attackerSession = await getSession(attackerApi);

    const noKeyResp = await noKeyApi.get('/api/session', {
      headers: {
        'x-wallet-solana-address': MOCK_SOLANA_ADDRESS,
        'x-wallet-recovery-intent': '1'
      }
    });
    expect(noKeyResp.ok()).toBeTruthy();
    const noKeyBody = await noKeyResp.json();
    expect(noKeyBody?.ok).toBe(true);
    expect(noKeyBody?.teamCode).not.toBe(victimSession.teamCode);

    const wrongKeyResp = await attackerApi.get('/api/session', {
      headers: {
        'x-wallet-solana-address': MOCK_SOLANA_ADDRESS,
        'x-wallet-recovery-intent': '1',
        'x-wallet-recovery-key': attackerSession.walletRecoveryKey
      }
    });
    expect(wrongKeyResp.ok()).toBeTruthy();
    const wrongKeyBody = await wrongKeyResp.json();
    expect(wrongKeyBody?.ok).toBe(true);
    expect(wrongKeyBody?.teamCode).toBe(attackerSession.teamCode);

    const recoverResp = await recoverApi.get('/api/session', {
      headers: {
        'x-wallet-solana-address': MOCK_SOLANA_ADDRESS,
        'x-wallet-recovery-intent': '1',
        'x-wallet-recovery-key': victimSession.walletRecoveryKey
      }
    });
    expect(recoverResp.ok()).toBeTruthy();
    const recoverBody = await recoverResp.json();
    expect(recoverBody?.ok).toBe(true);
    expect(recoverBody?.teamCode).toBe(victimSession.teamCode);
  } finally {
    await victimApi.dispose();
    await attackerApi.dispose();
    await noKeyApi.dispose();
    await recoverApi.dispose();
  }
});

test('townhall register payload cannot rebind wallet mapping', async () => {
  const victimApi = await createApiContext(test.info());
  const attackerApi = await createApiContext(test.info());
  const probeApi = await createApiContext(test.info());
  const victimProbeApi = await createApiContext(test.info());

  try {
    const victimSession = await getSession(victimApi);
    await bindMockSolanaWallet(victimApi, MOCK_SOLANA_ADDRESS);

    const attackerSession = await getSession(attackerApi);

    const registerResp = await attackerApi.post('/api/townhall/register', {
      data: {
        profile: {
          humanName: 'Attacker Human',
          agentName: 'Attacker Agent',
          humanAvatar: { prompt: 'Human prompt' },
          agentAvatar: { prompt: 'Agent prompt' }
        },
        erc8004: {
          user: {
            evm: { id: '11155111:7001' },
            solana: { id: 'solana:user-7001' }
          },
          agent: {
            evm: { id: '11155111:7002' },
            solana: { id: 'solana:agent-7002' }
          }
        },
        wallet: {
          chain: 'solana',
          address: MOCK_SOLANA_ADDRESS,
          solanaAddress: MOCK_SOLANA_ADDRESS
        }
      }
    });
    expect(registerResp.ok()).toBeTruthy();
    const registerBody = await registerResp.json();
    expect(registerBody?.ok).toBe(true);

    const attackerProbeResp = await probeApi.get('/api/session', {
      headers: {
        'x-wallet-solana-address': MOCK_SOLANA_ADDRESS,
        'x-wallet-recovery-intent': '1',
        'x-wallet-recovery-key': attackerSession.walletRecoveryKey
      }
    });
    expect(attackerProbeResp.ok()).toBeTruthy();
    const attackerProbeBody = await attackerProbeResp.json();
    expect(attackerProbeBody?.ok).toBe(true);
    expect(attackerProbeBody?.teamCode).not.toBe(attackerSession.teamCode);

    const victimProbeResp = await victimProbeApi.get('/api/session', {
      headers: {
        'x-wallet-solana-address': MOCK_SOLANA_ADDRESS,
        'x-wallet-recovery-intent': '1',
        'x-wallet-recovery-key': victimSession.walletRecoveryKey
      }
    });
    expect(victimProbeResp.ok()).toBeTruthy();
    const victimProbeBody = await victimProbeResp.json();
    expect(victimProbeBody?.ok).toBe(true);
    expect(victimProbeBody?.teamCode).toBe(victimSession.teamCode);
  } finally {
    await victimApi.dispose();
    await attackerApi.dispose();
    await probeApi.dispose();
    await victimProbeApi.dispose();
  }
});
