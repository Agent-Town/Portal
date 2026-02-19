const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

function ssePayload(chunks) {
  return chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n';
}

test('co-op open -> co-create -> generate house -> unlock with wallet signature', async ({ page, request }) => {
  // Mock a Solana wallet (Phantom-style) for Playwright.
  await page.addInitScript(() => {
    // Minimal mock matching usage in create.js/house.js
    const sig = new Uint8Array(64);
    // Deterministic but non-zero
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 13) & 0xff;
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address: 'So1anaMock111111111111111111111111111111111' }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: sig, publicKey: { toString: () => 'So1anaMock111111111111111111111111111111111' } })
    };
  });

  await page.goto('/');
  const teamCode = (await page.getByTestId('team-code').innerText()).trim();

function makeToolChunks({ id, model, toolName, args = {}, callId }) {
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
              name: String(toolName || '').trim(),
              arguments: JSON.stringify(args || {})
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

function makeTextChunks({ id, model, text = 'done' }) {
  const created = Math.floor(Date.now() / 1000);
  return [
    {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{
        index: 0,
        delta: { role: 'assistant', content: String(text || 'done') },
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

function textFromContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map((part) => {
    if (!part || typeof part !== 'object') return '';
    if (typeof part.text === 'string') return part.text;
    if (part.type === 'text' && typeof part.text === 'string') return part.text;
    return '';
  }).join('\n');
}

async function routeCreateCeremonyLlm(page) {
  let llmSeq = 0;
  await page.route('**/api/llm/openai/v1/chat/completions', async (route, req) => {
    let parsed = {};
    try {
      parsed = JSON.parse(req.postData() || '{}');
    } catch {
      parsed = {};
    }
    const messages = Array.isArray(parsed?.messages) ? parsed.messages : [];
    const model = String(parsed?.model || 'gpt-4o-mini');
    llmSeq += 1;
    const id = `chatcmpl_create_${llmSeq}`;

    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (String(messages[i]?.role || '').toLowerCase() === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    const afterLastUser = lastUserIndex >= 0 ? messages.slice(lastUserIndex + 1) : [];
    const hasToolResult = afterLastUser.some((msg) => String(msg?.role || '').toLowerCase() === 'tool');
    const userPrompt = lastUserIndex >= 0
      ? textFromContent(messages[lastUserIndex]?.content).toLowerCase()
      : '';

    if (!hasToolResult && userPrompt.includes('publish the agent ceremony reveal payload')) {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream; charset=utf-8' },
        body: ssePayload(makeToolChunks({
          id,
          model,
          toolName: 'agent_town_ceremony_reveal',
          callId: `call_${llmSeq}`
        }))
      });
      return;
    }

    if (!hasToolResult && userPrompt.includes('publish the agent ceremony commit and reveal public key')) {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream; charset=utf-8' },
        body: ssePayload(makeToolChunks({
          id,
          model,
          toolName: 'agent_town_ceremony_commit',
          callId: `call_${llmSeq}`
        }))
      });
      return;
    }

    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream; charset=utf-8' },
      body: ssePayload(makeTextChunks({ id, model, text: 'done' }))
    });
  });
}

test('co-op open -> co-create -> generate house -> unlock with wallet signature', async ({ page }) => {
  await installMockSolanaWallet(page);
  await reachCreateViaLite(page);
  await routeCreateCeremonyLlm(page);

  await page.getByTestId('px-0-0').click();
  await expect(page.getByTestId('px-0-0')).toHaveAttribute('data-color', /[1-9]/);

  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 30000 });
  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBeTruthy();

  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const walletLabel = (await connectWalletBtn.textContent()) || '';
  if (walletLabel.includes('Connect')) {
    await connectWalletBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();

  const share = await page.evaluate(async () => {
    const resp = await fetch('/api/share/create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await resp.json().catch(() => ({}));
    return { ok: resp.ok, data };
  });
  expect(share.ok).toBe(true);
  expect(share.data?.shareId).toBeTruthy();
});
