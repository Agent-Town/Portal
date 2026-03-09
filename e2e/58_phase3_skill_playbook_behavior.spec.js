const crypto = require('crypto');
const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet, houseAuthHeadersFromKeyB64, seedRecoverableTokenHouse } = require('./helpers/phase1');
const { attachPathRecorder, enterHatch, triggerWalletProfileCheck, ensureBrainPanelVisible } = require('./helpers/phase2');
const { makeCeremonyRevealPair, encryptCeremonyReveal } = require('./helpers/ceremony_crypto');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const testWalletAddress = process.env.TEST_TOKEN_ADDRESS || 'So1anaMockToken1111111111111111111111111111';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

function sha256B64(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('base64');
}

function ssePayload(chunks) {
  return chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n';
}

function toolStep(name, args = {}) {
  return { kind: 'tool', name: String(name || '').trim(), args: args || {} };
}

function textStep(text = 'done') {
  return { kind: 'text', text: String(text || 'done') };
}

function makeToolChunks({ id, model, step, callId }) {
  const created = Math.floor(Date.now() / 1000);
  return [
    {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{
        index: 0,
        delta: {
          role: 'assistant',
          tool_calls: [{
            index: 0,
            id: callId,
            type: 'function',
            function: {
              name: String(step?.name || ''),
              arguments: JSON.stringify(step?.args || {})
            }
          }]
        },
        finish_reason: null
      }]
    },
    {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }]
    }
  ];
}

function makeTextChunks({ id, model, step }) {
  const created = Math.floor(Date.now() / 1000);
  return [
    {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{
        index: 0,
        delta: { role: 'assistant', content: String(step?.text || 'done') },
        finish_reason: null
      }]
    },
    {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
    }
  ];
}

async function bootstrapWorker(page) {
  await installMockSolanaWallet(page);
  await enterHatch(page, 'signup');
  await triggerWalletProfileCheck(page);
  await expect(page.locator('#walletStatus')).toContainText(/Wallet verified\. Configure brain\.|No Privy-connected Solana wallet found\.|Wallet connected\. Lookup skipped/i, { timeout: 3000 });
  await ensureBrainPanelVisible(page);

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 3000 });

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'openclaw-lite';
  }, null, { timeout: 10000 });

  await page.waitForFunction(() => !!window.__openclawLiteTest, null, { timeout: 5000 });
  const state = await page.evaluate(async () => {
    const resp = await fetch('/api/state', { credentials: 'include' });
    return await resp.json();
  });
  const teamCode = String(state?.teamCode || '').trim();
  expect(teamCode).toMatch(/^TEAM-/);
  return { teamCode, origin: new URL(String(page.url())).origin };
}

async function ensureSkillImported(page, url = '/skill.md') {
  const visit = await page.evaluate(async ({ visitUrl }) => {
    return await window.__openclawLiteTest.visitExperience({ url: visitUrl });
  }, { visitUrl: url });
  expect(visit?.ok).toBe(true);
}

async function clearTranscript(page) {
  const reset = await page.evaluate(async () => {
    return await window.__openclawLiteTest.clearTranscript({ rotateSession: false, keepBootMessage: true });
  });
  expect(reset?.ok).not.toBe(false);
}

async function runScriptedExperience(page, { prompt, steps }) {
  const llmRequests = [];
  let callCount = 0;
  const routeUrl = '**/api/llm/openai/v1/chat/completions';
  try {
    await page.unroute(routeUrl);
  } catch {
    // no-op
  }

  await page.route(routeUrl, async (route, req) => {
    callCount += 1;
    let parsed = null;
    try {
      parsed = JSON.parse(req.postData() || '{}');
    } catch {
      parsed = null;
    }
    llmRequests.push(parsed);

    const id = `chatcmpl_skill_${callCount}`;
    const model = String(parsed?.model || 'gpt-4o-mini');
    const step = steps[Math.min(callCount - 1, steps.length - 1)] || textStep('done');
    const chunks = step.kind === 'tool'
      ? makeToolChunks({ id, model, step, callId: `call_${callCount}` })
      : makeTextChunks({ id, model, step });
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream; charset=utf-8' },
      body: ssePayload(chunks)
    });
  });

  const run = await page.evaluate(async ({ runPrompt }) => {
    return await window.__openclawLiteTest.experienceRun({ prompt: runPrompt });
  }, { runPrompt: String(prompt || 'Read SKILL.md and do the next safe step.') });
  return { run, llmRequests, callCount };
}

async function postHuman(page, path, payload = {}) {
  return await page.evaluate(async ({ target, body }) => {
    const resp = await fetch(target, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    const data = await resp.json().catch(() => ({}));
    return { ok: resp.ok, status: resp.status, body: data };
  }, { target: path, body: payload });
}

async function getAssistantToolCallNames(page) {
  const raw = await page.evaluate(async () => await window.__openclawLiteTest.getTranscriptDump());
  let dump = [];
  try {
    dump = JSON.parse(raw || '[]');
  } catch {
    dump = [];
  }
  const names = [];
  for (const msg of dump) {
    if (!msg || msg.role !== 'assistant' || !Array.isArray(msg.content)) continue;
    for (const entry of msg.content) {
      if (entry && entry.type === 'toolCall' && typeof entry.name === 'string' && entry.name.trim()) {
        names.push(entry.name.trim());
      }
    }
  }
  return names;
}

async function prepareTokenHouseState(page) {
  return await page.evaluate(async ({ address }) => {
    const tokenNonceResp = await fetch('/api/token/nonce', { credentials: 'include' });
    const tokenNonceJson = await tokenNonceResp.json().catch(() => ({}));
    const nonce = String(tokenNonceJson?.nonce || '');

    const verifyResp = await fetch('/api/token/verify', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address, nonce, signature: 'phase3-worker-sig' })
    });
    const verifyBody = await verifyResp.json().catch(() => ({}));
    if (!verifyResp.ok || !verifyBody?.ok || verifyBody?.eligible !== true) {
      return { ok: false, error: 'TOKEN_VERIFY_FAILED', verifyBody };
    }

    const paintResp = await fetch('/api/human/canvas/paint', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ x: 0, y: 0, color: 1 })
    });
    const paintBody = await paintResp.json().catch(() => ({}));
    if (!paintResp.ok || !paintBody?.ok) return { ok: false, error: 'PAINT_FAILED', paintBody };

    const houseNonceResp = await fetch('/api/house/nonce', { credentials: 'include' });
    const houseNonceJson = await houseNonceResp.json().catch(() => ({}));
    const houseNonce = String(houseNonceJson?.nonce || '');
    if (!houseNonce) return { ok: false, error: 'MISSING_HOUSE_NONCE' };

    const random = crypto.getRandomValues(new Uint8Array(32));
    let binary = '';
    for (let i = 0; i < random.length; i += 1) binary += String.fromCharCode(random[i]);
    const houseAuthKey = btoa(binary);
    const houseId = `house_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;

    const initResp = await fetch('/api/house/init', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        houseId,
        housePubKey: houseId,
        nonce: houseNonce,
        houseAuthKey
      })
    });
    const initBody = await initResp.json().catch(() => ({}));
    if (!initResp.ok || !initBody?.ok) return { ok: false, error: 'HOUSE_INIT_FAILED', initBody };

    return {
      ok: true,
      houseId
    };
  }, { address: testWalletAddress });
}

test('chat auto-imports referenced skill.md URL and injects runtime context into llm turn', async ({ page }) => {
  const { teamCode, origin } = await bootstrapWorker(page);
  const targetSkillUrl = `${origin}/fixtures/multi-skill-pack/skill.md`;
  const llmRequests = [];
  const routeUrl = '**/api/llm/openai/v1/chat/completions';

  try {
    await page.unroute(routeUrl);
  } catch {
    // no-op
  }

  await page.route(routeUrl, async (route, req) => {
    let parsed = null;
    try {
      parsed = JSON.parse(req.postData() || '{}');
    } catch {
      parsed = null;
    }
    llmRequests.push(parsed);
    const id = `chatcmpl_chat_${llmRequests.length}`;
    const model = String(parsed?.model || 'gpt-4o-mini');
    const chunks = makeTextChunks({ id, model, step: textStep('checked skill url') });
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream; charset=utf-8' },
      body: ssePayload(chunks)
    });
  });

  const chatText = `Can you check ${targetSkillUrl} and continue?`;
  await page.evaluate(async ({ text }) => {
    const mod = await import('/openclaw-lite/gateway.js');
    let gateway = mod?.default || mod;
    if (gateway && typeof gateway.then === 'function') {
      gateway = await gateway;
    }
    await gateway.send({ type: 'chat', text: String(text || '') });
  }, { text: chatText });

  await expect.poll(async () => {
    return await page.evaluate(async () => {
      const snapshot = await window.__openclawLiteTest.skillState();
      const data = snapshot?.data || snapshot || {};
      return String(data?.sourceUrl || '');
    });
  }, { timeout: 10000 }).toContain('/fixtures/multi-skill-pack/skill.md');

  await expect.poll(() => {
    return llmRequests.some((req) => JSON.stringify(req?.messages || []).includes(targetSkillUrl));
  }, { timeout: 10000 }).toBe(true);

  const chatRequest = llmRequests.find((req) => JSON.stringify(req?.messages || []).includes(targetSkillUrl));
  expect(chatRequest).toBeTruthy();
  const chatMessages = Array.isArray(chatRequest?.messages) ? chatRequest.messages : [];
  const lastUserMsg = [...chatMessages].reverse().find((entry) => entry?.role === 'user') || null;
  const userText = typeof lastUserMsg?.content === 'string'
    ? lastUserMsg.content
    : JSON.stringify(lastUserMsg?.content || '');

  expect(userText).toContain(chatText);
  expect(userText).toContain('Runtime session context (authoritative):');
  expect(userText).toContain(`- origin: ${origin}`);
  expect(userText).toContain(`- teamCode: ${teamCode}`);
  expect(userText).toContain('Use these values directly when SKILL.md asks for origin/teamCode/houseId.');
});

test('chat honors explicit runtime context/state payload from gateway sender', async ({ page }) => {
  const { teamCode } = await bootstrapWorker(page);
  await ensureSkillImported(page);
  await clearTranscript(page);

  const llmRequests = [];
  const routeUrl = '**/api/llm/openai/v1/chat/completions';
  try {
    await page.unroute(routeUrl);
  } catch {
    // no-op
  }

  await page.route(routeUrl, async (route, req) => {
    let parsed = null;
    try {
      parsed = JSON.parse(req.postData() || '{}');
    } catch {
      parsed = null;
    }
    llmRequests.push(parsed);
    const id = `chatcmpl_runtime_payload_${llmRequests.length}`;
    const model = String(parsed?.model || 'gpt-4o-mini');
    const chunks = makeTextChunks({ id, model, step: textStep('runtime payload checked') });
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream; charset=utf-8' },
      body: ssePayload(chunks)
    });
  });

  const injected = {
    teamCode: 'TEAM-ZZZZ-YYYY',
    houseId: 'house_runtime_payload',
    step: 'mirror_sigil',
    selected: 'booth'
  };
  expect(injected.teamCode).not.toBe(teamCode);

  await page.evaluate(async ({ payload }) => {
    const mod = await import('/openclaw-lite/gateway.js');
    let gateway = mod?.default || mod;
    if (gateway && typeof gateway.then === 'function') gateway = await gateway;

    const runtimeState = {
      teamCode: String(payload?.teamCode || ''),
      houseId: String(payload?.houseId || ''),
      experience: {
        id: 'agent_town_coop_v1',
        step: String(payload?.step || ''),
        nextAgentAction: 'agent_town_select'
      },
      human: {
        selected: String(payload?.selected || ''),
        openPressed: false
      },
      agent: {
        selected: '',
        openPressed: false
      },
      match: {
        matched: false
      }
    };

    await gateway.send({
      type: 'chat',
      text: 'Use runtime payload context for this status check.',
      runtimeContext: {
        origin: window.location.origin,
        teamCode: String(payload?.teamCode || ''),
        houseId: String(payload?.houseId || '')
      },
      runtimeState
    });
  }, { payload: injected });

  await expect.poll(() => llmRequests.length, { timeout: 10_000 }).toBeGreaterThan(0);
  const first = llmRequests[0] || {};
  const messages = Array.isArray(first?.messages) ? first.messages : [];
  const lastUser = [...messages].reverse().find((entry) => entry?.role === 'user') || null;
  const userText = typeof lastUser?.content === 'string'
    ? lastUser.content
    : JSON.stringify(lastUser?.content || '');

  expect(userText).toContain(`- teamCode: ${injected.teamCode}`);
  expect(userText).toContain(`- houseId: ${injected.houseId}`);
  expect(userText).toContain(`- experience.step: ${injected.step}`);
  expect(userText).toContain(`- human.selected: ${injected.selected}`);
  expect(userText).toContain('This is an active co-op session (`agent_town_coop_v1`): follow the co-op playbook at activeSkillPath (skill.md).');
  expect(userText).not.toContain(`- teamCode: ${teamCode}`);
});

test('experience run injects runtime context/state hints and active skill guidance into llm turn', async ({ page }) => {
  const { teamCode, origin } = await bootstrapWorker(page);
  await ensureSkillImported(page);
  await clearTranscript(page);

  const llmRequests = [];
  const routeUrl = '**/api/llm/openai/v1/chat/completions';
  try {
    await page.unroute(routeUrl);
  } catch {
    // no-op
  }

  await page.route(routeUrl, async (route, req) => {
    let parsed = null;
    try {
      parsed = JSON.parse(req.postData() || '{}');
    } catch {
      parsed = null;
    }
    llmRequests.push(parsed);
    const id = `chatcmpl_exp_${llmRequests.length}`;
    const model = String(parsed?.model || 'gpt-4o-mini');
    const chunks = makeTextChunks({ id, model, step: textStep('experience run checked') });
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream; charset=utf-8' },
      body: ssePayload(chunks)
    });
  });

  const runSummary = await page.evaluate(async () => {
    const stateResp = await fetch('/api/state', { credentials: 'include' });
    const appState = await stateResp.json().catch(() => ({}));
    const skill = await window.__openclawLiteTest.skillState();
    const activeSkillPath = String(skill?.data?.activeSkillPath || '');

    const mod = await import('/openclaw-lite/gateway.js');
    let gateway = mod?.default || mod;
    if (gateway && typeof gateway.then === 'function') gateway = await gateway;

    const run = await gateway.experienceRun({
      prompt: 'Read workspace/SKILL.md and do exactly the next safe co-op step.',
      timeoutMs: 60_000,
      runtimeContext: {
        origin: window.location.origin,
        teamCode: String(appState?.teamCode || ''),
        houseId: String(appState?.houseId || '')
      },
      runtimeState: appState
    });
    return {
      run,
      teamCode: String(appState?.teamCode || ''),
      step: String(appState?.experience?.step || ''),
      activeSkillPath
    };
  });

  expect(runSummary?.run?.ok).toBe(true);

  await expect.poll(() => llmRequests.length, { timeout: 10_000 }).toBeGreaterThan(0);
  const first = llmRequests[0] || {};
  const messages = Array.isArray(first?.messages) ? first.messages : [];
  const lastUser = [...messages].reverse().find((entry) => entry?.role === 'user') || null;
  const userText = typeof lastUser?.content === 'string'
    ? lastUser.content
    : JSON.stringify(lastUser?.content || '');

  expect(userText).toContain('Runtime session context (authoritative):');
  expect(userText).toContain(`- origin: ${origin}`);
  expect(userText).toContain(`- teamCode: ${teamCode}`);
  expect(userText).toContain('Runtime experience state (authoritative):');
  expect(userText).toContain(`- experience.step: ${runSummary.step}`);
  expect(userText).toContain('Active imported skill package (authoritative for this experience):');
  expect(userText).toContain(`- activeSkillPath: ${runSummary.activeSkillPath}`);
  expect(userText).toContain('Do not ask the human for teamCode/houseId/skill-path when runtime context already provides them.');
});

test('worker+llm skill run drives connect/match/open co-op loop with no direct test-side agent API calls', async ({ page, request }) => {
  const { teamCode, origin } = await bootstrapWorker(page);
  await ensureSkillImported(page);
  await clearTranscript(page);

  const agentCalls = attachPathRecorder(page, [
    '/api/agent/connect',
    '/api/agent/state',
    '/api/agent/select',
    '/api/agent/open/press'
  ]);

  const humanSelect = await postHuman(page, '/api/human/select', { elementId: 'key' });
  expect(humanSelect.ok).toBe(true);

  const run1 = await runScriptedExperience(page, {
    prompt: 'Read SKILL.md and execute the next co-op loop steps.',
    steps: [
      toolStep('workspace_read_file', { path: 'workspace/SKILL.md' }),
      toolStep('http_request', {
        method: 'POST',
        url: `${origin}/api/agent/connect`,
        headers: { 'content-type': 'application/json' },
        body: { teamCode, agentName: 'WorkerLLM' },
        responseMode: 'json'
      }),
      toolStep('http_request', {
        method: 'GET',
        url: `${origin}/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`,
        responseMode: 'json'
      }),
      toolStep('http_request', {
        method: 'POST',
        url: `${origin}/api/agent/select`,
        headers: { 'content-type': 'application/json' },
        body: { teamCode, elementId: 'key' },
        responseMode: 'json'
      }),
      textStep('connected and matched')
    ]
  });

  expect(run1.run?.ok).toBe(true);
  expect(run1.callCount).toBeGreaterThanOrEqual(5);

  const humanOpen = await postHuman(page, '/api/human/open/press', {});
  expect(humanOpen.ok).toBe(true);

  const run2 = await runScriptedExperience(page, {
    prompt: 'Continue the co-op loop and finish open press once human has pressed.',
    steps: [
      toolStep('http_request', {
        method: 'GET',
        url: `${origin}/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`,
        responseMode: 'json'
      }),
      toolStep('http_request', {
        method: 'POST',
        url: `${origin}/api/agent/open/press`,
        headers: { 'content-type': 'application/json' },
        body: { teamCode },
        responseMode: 'json'
      }),
      textStep('open pressed')
    ]
  });
  expect(run2.run?.ok).toBe(true);

  const stateResp = await request.get(`/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`);
  expect(stateResp.ok()).toBeTruthy();
  const state = await stateResp.json();
  expect(state?.agent?.connected).toBe(true);
  expect(state?.agent?.name).toBe('WorkerLLM');
  expect(state?.match?.matched).toBe(true);
  expect(state?.agent?.openPressed).toBe(true);
  expect(state?.signup?.complete).toBe(true);

  await expect.poll(() => agentCalls.filter((call) => call.pathname === '/api/agent/connect').length).toBeGreaterThan(0);
  await expect.poll(() => agentCalls.filter((call) => call.pathname === '/api/agent/select').length).toBeGreaterThan(0);
  await expect.poll(() => agentCalls.filter((call) => call.pathname === '/api/agent/open/press').length).toBeGreaterThan(0);

  const toolCalls = await getAssistantToolCallNames(page);
  expect(toolCalls).toContain('workspace_read_file');
  expect(toolCalls.filter((name) => name === 'http_request').length).toBeGreaterThanOrEqual(4);
});

test('worker+llm skill run supports collaborative canvas paint actions via agent API', async ({ page }) => {
  const { teamCode, origin } = await bootstrapWorker(page);
  await ensureSkillImported(page);
  await clearTranscript(page);

  const agentCalls = attachPathRecorder(page, [
    '/api/agent/connect',
    '/api/agent/canvas/paint',
    '/api/agent/canvas/image'
  ]);

  const x = 2;
  const y = 1;
  const color = 4;
  const run = await runScriptedExperience(page, {
    prompt: 'Read SKILL.md and connect, then paint one collaborative canvas pixel.',
    steps: [
      toolStep('workspace_read_file', { path: 'workspace/SKILL.md' }),
      toolStep('http_request', {
        method: 'POST',
        url: `${origin}/api/agent/connect`,
        headers: { 'content-type': 'application/json' },
        body: { teamCode, agentName: 'WorkerPainter' },
        responseMode: 'json'
      }),
      toolStep('http_request', {
        method: 'POST',
        url: `${origin}/api/agent/canvas/paint`,
        headers: { 'content-type': 'application/json' },
        body: { teamCode, x, y, color },
        responseMode: 'json'
      }),
      toolStep('http_request', {
        method: 'GET',
        url: `${origin}/api/agent/canvas/image?teamCode=${encodeURIComponent(teamCode)}`,
        responseMode: 'json'
      }),
      textStep('canvas paint done')
    ]
  });
  expect(run.run?.ok).toBe(true);

  const canvas = await page.evaluate(async () => {
    const resp = await fetch('/api/canvas/state', { credentials: 'include' });
    const body = await resp.json().catch(() => ({}));
    return { ok: resp.ok, body };
  });
  expect(canvas?.ok).toBe(true);
  const state = canvas?.body || {};
  const width = Number(state?.canvas?.w || 0);
  const pixels = Array.isArray(state?.canvas?.pixels) ? state.canvas.pixels : [];
  expect(width).toBeGreaterThan(0);
  expect(pixels[y * width + x]).toBe(color);

  await expect.poll(() => agentCalls.filter((call) => call.pathname === '/api/agent/canvas/paint').length).toBeGreaterThan(0);
  await expect.poll(() => agentCalls.filter((call) => call.pathname === '/api/agent/canvas/image').length).toBeGreaterThan(0);

  const toolCalls = await getAssistantToolCallNames(page);
  expect(toolCalls).toContain('workspace_read_file');
  expect(toolCalls.filter((name) => name === 'http_request').length).toBeGreaterThanOrEqual(3);
});

test('worker+llm skill run drives ceremony commit/reveal and house reconnect checks', async ({ page, request }) => {
  const { teamCode, origin } = await bootstrapWorker(page);
  await ensureSkillImported(page);
  await clearTranscript(page);

  const agentCalls = attachPathRecorder(page, [
    '/api/agent/state',
    '/api/agent/house/commit',
    '/api/agent/house/reveal',
    '/api/agent/house/connect'
  ]);

  const humanReveal = crypto.randomBytes(32);
  const humanCommit = sha256B64(humanReveal);
  const humanPair = makeCeremonyRevealPair();
  const humanCommitResp = await postHuman(page, '/api/human/house/commit', {
    commit: humanCommit,
    revealPub: humanPair.publicKeyB64
  });
  expect(humanCommitResp.ok).toBe(true);

  const run1 = await runScriptedExperience(page, {
    prompt: 'Read skill and execute ceremony commit + state checks.',
    steps: [
      toolStep('workspace_read_file', { path: 'workspace/SKILL.md' }),
      toolStep('http_request', {
        method: 'GET',
        url: `${origin}/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`,
        responseMode: 'json'
      }),
      toolStep('agent_town_ceremony_commit', { teamCode }),
      toolStep('http_request', {
        method: 'GET',
        url: `${origin}/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`,
        responseMode: 'json'
      }),
      textStep('commit complete')
    ]
  });
  expect(run1.run?.ok).toBe(true);

  const materialResp = await request.get(`/api/agent/house/material?teamCode=${encodeURIComponent(teamCode)}`);
  expect(materialResp.ok()).toBeTruthy();
  const material = await materialResp.json();
  expect(typeof material?.agentRevealPub).toBe('string');
  expect(material.agentRevealPub.length).toBeGreaterThan(20);

  const sealedForAgent = encryptCeremonyReveal({
    revealBytes: humanReveal,
    recipientRevealPubB64: material.agentRevealPub,
    direction: 'human_to_agent',
    teamCode
  });
  const humanRevealResp = await postHuman(page, '/api/human/house/reveal', { sealedForAgent });
  expect(humanRevealResp.ok).toBe(true);

  const run2 = await runScriptedExperience(page, {
    prompt: 'Continue ceremony flow and reveal for human.',
    steps: [
      toolStep('agent_town_ceremony_reveal', { teamCode }),
      toolStep('http_request', {
        method: 'GET',
        url: `${origin}/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`,
        responseMode: 'json'
      }),
      textStep('reveal complete')
    ]
  });
  expect(run2.run?.ok).toBe(true);

  const houseStateAfterRevealResp = await request.get(`/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`);
  expect(houseStateAfterRevealResp.ok()).toBeTruthy();
  const houseStateAfterReveal = await houseStateAfterRevealResp.json();
  expect(houseStateAfterReveal?.ceremony?.humanReveal).toBe(true);
  expect(houseStateAfterReveal?.ceremony?.agentReveal).toBe(true);
  expect(houseStateAfterReveal?.ceremony?.houseId).toBeNull();

  const initHouse = await page.evaluate(async () => {
    const nonceResp = await fetch('/api/house/nonce', { credentials: 'include' });
    const nonceJson = await nonceResp.json().catch(() => ({}));
    const nonce = String(nonceJson?.nonce || '');
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    const houseAuthKey = btoa(binary);
    const houseId = `house_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
    const initResp = await fetch('/api/house/init', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        houseId,
        housePubKey: houseId,
        nonce,
        houseAuthKey
      })
    });
    const initBody = await initResp.json().catch(() => ({}));
    return { ok: initResp.ok, body: initBody, houseId };
  });
  expect(initHouse?.ok).toBe(true);
  expect(initHouse?.body?.ok).toBe(true);

  const houseId = String(initHouse?.houseId || '');
  expect(houseId).toContain('house_');

  const run3 = await runScriptedExperience(page, {
    prompt: 'Reconnect to existing house using skill reconnect route.',
    steps: [
      toolStep('http_request', {
        method: 'POST',
        url: `${origin}/api/agent/house/connect`,
        headers: { 'content-type': 'application/json' },
        body: { houseId, agentName: 'WorkerReconnect' },
        responseMode: 'json'
      }),
      toolStep('http_request', {
        method: 'GET',
        url: `${origin}/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`,
        responseMode: 'json'
      }),
      textStep('reconnected')
    ]
  });
  expect(run3.run?.ok).toBe(true);

  const finalStateResp = await request.get(`/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`);
  expect(finalStateResp.ok()).toBeTruthy();
  const finalState = await finalStateResp.json();
  expect(finalState?.agent?.connected).toBe(true);
  expect(finalState?.agent?.source).toBe('external');
  expect(finalState?.agent?.name).toBe('WorkerReconnect');

  const finalHouseStateResp = await request.get(`/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`);
  expect(finalHouseStateResp.ok()).toBeTruthy();
  const finalHouseState = await finalHouseStateResp.json();
  expect(finalHouseState?.ceremony?.houseId).toBe(houseId);

  await expect.poll(() => agentCalls.filter((call) => call.pathname === '/api/agent/house/commit').length).toBeGreaterThan(0);
  await expect.poll(() => agentCalls.filter((call) => call.pathname === '/api/agent/house/reveal').length).toBeGreaterThan(0);
  await expect.poll(() => agentCalls.filter((call) => call.pathname === '/api/agent/house/connect').length).toBeGreaterThan(0);
  await expect.poll(() => agentCalls.filter((call) => call.pathname === '/api/agent/state').length).toBeGreaterThan(0);

  const toolCalls = await getAssistantToolCallNames(page);
  expect(toolCalls).toContain('agent_town_ceremony_commit');
  expect(toolCalls).toContain('agent_town_ceremony_reveal');
  expect(toolCalls.filter((name) => name === 'http_request').length).toBeGreaterThanOrEqual(4);
});

test('worker+llm skill run creates share and exposes helper instructions without direct test-side share API calls', async ({ page, request }) => {
  const { teamCode, origin } = await bootstrapWorker(page);
  await ensureSkillImported(page);
  await clearTranscript(page);

  const agentCalls = attachPathRecorder(page, [
    '/api/share/create',
    '/api/agent/share/instructions'
  ]);

  const run1 = await runScriptedExperience(page, {
    prompt: 'Check share instructions readiness from the skill helper route.',
    steps: [
      toolStep('workspace_read_file', { path: 'workspace/SKILL.md' }),
      toolStep('http_request', {
        method: 'GET',
        url: `${origin}/api/agent/share/instructions?teamCode=${encodeURIComponent(teamCode)}`,
        responseMode: 'json'
      }),
      textStep('share not ready checked')
    ]
  });
  expect(run1.run?.ok).toBe(true);

  const preReady = await request.get(`/api/agent/share/instructions?teamCode=${encodeURIComponent(teamCode)}`);
  expect(preReady.status()).toBe(404);

  const houseReady = await prepareTokenHouseState(page);
  expect(houseReady?.ok).toBe(true);
  expect(String(houseReady?.houseId || '')).toContain('house_');

  const run2 = await runScriptedExperience(page, {
    prompt: 'Create a share and fetch helper instructions.',
    steps: [
      toolStep('http_request', {
        method: 'POST',
        url: `${origin}/api/share/create`,
        headers: { 'content-type': 'application/json' },
        body: {},
        responseMode: 'json'
      }),
      toolStep('http_request', {
        method: 'GET',
        url: `${origin}/api/agent/share/instructions?teamCode=${encodeURIComponent(teamCode)}`,
        responseMode: 'json'
      }),
      textStep('share create + helper complete')
    ]
  });
  expect(run2.run?.ok).toBe(true);

  const stateWithShareResp = await request.get(`/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`);
  expect(stateWithShareResp.ok()).toBeTruthy();
  const stateWithShare = await stateWithShareResp.json();
  const shareId = String(stateWithShare?.share?.id || '');
  expect(shareId).toMatch(/^sh_/);

  const shareReady = {
    shareId,
    sharePath: `/s/${shareId}`
  };

  const instructionsResp = await request.get(`/api/agent/share/instructions?teamCode=${encodeURIComponent(teamCode)}`);
  expect(instructionsResp.ok()).toBeTruthy();
  const instructions = await instructionsResp.json();
  expect(String(instructions?.sharePath || '')).toBe(String(shareReady?.sharePath || ''));

  const leaderboardResp = await request.get('/api/leaderboard');
  expect(leaderboardResp.ok()).toBeTruthy();
  const leaderboard = await leaderboardResp.json();
  const row = Array.isArray(leaderboard?.teams)
    ? leaderboard.teams.find((entry) => entry?.sharePath === shareReady?.sharePath)
    : null;
  expect(row).toBeTruthy();

  await expect.poll(() => agentCalls.filter((call) => call.pathname === '/api/share/create').length).toBeGreaterThan(0);
  await expect.poll(() => agentCalls.filter((call) => call.pathname === '/api/agent/share/instructions').length).toBeGreaterThanOrEqual(2);

  const toolCalls = await getAssistantToolCallNames(page);
  expect(toolCalls).toContain('workspace_read_file');
  expect(toolCalls.filter((name) => name === 'http_request').length).toBeGreaterThanOrEqual(3);
});

test('worker+llm skill run recovers house context and appends encrypted vault note', async ({ page, request }) => {
  await bootstrapWorker(page);

  const seeded = await seedRecoverableTokenHouse(page.request, {
    address: testWalletAddress,
    signatureMultiplier: 11
  });
  expect(String(seeded?.houseId || '')).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
  expect(typeof seeded?.houseAuthKey).toBe('string');

  await ensureSkillImported(page);
  await clearTranscript(page);
  const agentCalls = attachPathRecorder(page, [
    `/api/house/${seeded.houseId}/append`,
    '/api/wallet/lookup'
  ]);

  const noteText = 'worker vault note: co-op memory';
  const run = await runScriptedExperience(page, {
    prompt: 'Read SKILL.md, recover house context, and append one vault note.',
    steps: [
      toolStep('workspace_read_file', { path: 'workspace/SKILL.md' }),
      toolStep('agent_town_house_recover', {}),
      toolStep('agent_town_house_append_note', { text: noteText }),
      textStep('house vault note appended')
    ]
  });
  expect(run.run?.ok).toBe(true);

  const logPath = `/api/house/${encodeURIComponent(seeded.houseId)}/log`;
  const logHeaders = houseAuthHeadersFromKeyB64(seeded.houseId, 'GET', logPath, '', seeded.houseAuthKey);
  const logResp = await request.get(logPath, { headers: logHeaders });
  expect(logResp.ok()).toBeTruthy();
  const logBody = await logResp.json();
  const appended = Array.isArray(logBody?.entries)
    ? logBody.entries.find((entry) => entry?.author === 'lite')
    : null;
  expect(appended).toBeTruthy();
  expect(appended?.ciphertext?.alg).toBe('AES-GCM');
  expect(typeof appended?.ciphertext?.ct).toBe('string');
  expect(appended.ciphertext.ct.length).toBeGreaterThan(16);

  await expect.poll(() => agentCalls.filter((call) => call.pathname === '/api/wallet/lookup').length).toBeGreaterThan(0);
  await expect.poll(() => agentCalls.filter((call) => call.pathname === `/api/house/${seeded.houseId}/append`).length).toBeGreaterThan(0);

  const toolCalls = await getAssistantToolCallNames(page);
  expect(toolCalls).toContain('workspace_read_file');
  expect(toolCalls).toContain('agent_town_house_recover');
  expect(toolCalls).toContain('agent_town_house_append_note');
});
