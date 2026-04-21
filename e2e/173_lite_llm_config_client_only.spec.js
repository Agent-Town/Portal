const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('lite llm config endpoint rejects mutation and onboarding completion stays config-free', async ({ request }) => {
  const upsert = await request.post('/api/agent/lite/llm/config', {
    headers: { 'content-type': 'application/json' },
    data: JSON.stringify({
      provider: 'openrouter',
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      modelRef: 'openrouter/nvidia/nemotron-3-super-120b-a12b:free',
      authMode: 'oauth-json',
      hasCredential: true
    })
  });
  expect(upsert.status()).toBe(410);
  const upsertBody = await upsert.json();
  expect(upsertBody).toEqual(expect.objectContaining({
    ok: false,
    error: 'LLM_CONFIG_CLIENT_ONLY'
  }));

  const configResp = await request.get('/api/agent/lite/llm/config');
  expect(configResp.ok()).toBeTruthy();
  const configBody = await configResp.json();
  expect(configBody).toEqual(expect.objectContaining({
    ok: true,
    configured: false,
    provider: null,
    model: null,
    authMode: null,
    apiKeySet: false,
    clientOnly: true
  }));

  const registerResp = await request.post('/api/townhall/register', {
    headers: { 'content-type': 'application/json' },
    data: JSON.stringify({
      profile: {
        humanName: 'Robin',
        agentName: 'OpenClaw',
        humanAvatar: { prompt: 'Human prompt' },
        agentAvatar: { prompt: 'Agent prompt' }
      },
      erc8004: {
        user: {
          evm: { id: '11155111:1001' },
          solana: { id: 'solana:user-1001' }
        },
        agent: {
          evm: { id: '11155111:1002' },
          solana: { id: 'solana:agent-1002' }
        }
      }
    })
  });
  expect(registerResp.ok()).toBeTruthy();

  const completeResp = await request.post('/api/onboarding/brain/complete', {
    headers: { 'content-type': 'application/json' },
    data: JSON.stringify({})
  });
  expect(completeResp.ok()).toBeTruthy();
  const completeBody = await completeResp.json();
  expect(completeBody).toEqual(expect.objectContaining({
    ok: true,
    nextStep: 'sigil'
  }));

  const stateResp = await request.get('/api/state');
  expect(stateResp.ok()).toBeTruthy();
  const stateBody = await stateResp.json();
  expect(stateBody?.onboarding?.step).toBe('sigil');
  expect(stateBody?.lite).toEqual(expect.objectContaining({
    llmConfigured: false,
    llmProvider: null,
    llmModel: null,
    llmAuthMode: null,
    llmApiKeySet: false
  }));
});
