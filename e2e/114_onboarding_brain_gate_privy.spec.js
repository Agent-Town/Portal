const { test, expect, request } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomPort() {
  return 5200 + Math.floor(Math.random() * 200);
}

function startPrivyTestServer({ port, storePath }) {
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(port),
    TEST_RESET_TOKEN: 'test-reset',
    ADMIN_TOKEN: 'test-admin',
    START_PAGE_ENABLED: '0',
    STORE_PATH: storePath,
    PRIVY_APP_ID: 'test-privy-app',
    ENABLE_PRIVY_IN_TEST: '1'
  };
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let logs = '';
  const append = (buf) => {
    logs += String(buf || '');
    if (logs.length > 10000) logs = logs.slice(-10000);
  };
  if (child.stdout) child.stdout.on('data', append);
  if (child.stderr) child.stderr.on('data', append);
  return {
    child,
    readLogs: () => logs
  };
}

async function waitForServerHealth(baseUrl, readLogs, timeoutMs = 20000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const resp = await fetch(`${baseUrl}/api/health`);
      if (resp.ok) return;
    } catch {
      // Retry until timeout.
    }
    await sleep(150);
  }
  throw new Error(`PRIVY_TEST_SERVER_HEALTH_TIMEOUT\n${readLogs()}`);
}

async function stopServer(child) {
  if (!child || child.killed) return;
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (!child.killed) child.kill('SIGKILL');
      resolve();
    }, 5000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill('SIGTERM');
  });
}

test('brain config is blocked until Town Hall registration when Privy onboarding is required', async () => {
  const port = randomPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const storePath = path.join(
    os.tmpdir(),
    `agent-town-privy-onboarding-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`
  );
  const launched = startPrivyTestServer({ port, storePath });
  let api = null;

  try {
    await waitForServerHealth(baseUrl, launched.readLogs);
    api = await request.newContext({ baseURL: baseUrl });

    const resetResp = await api.post('/__test__/reset', { headers: { 'x-test-reset': 'test-reset' } });
    expect(resetResp.ok()).toBeTruthy();

    const blockedResp = await api.post('/api/onboarding/brain/complete', {
      data: {}
    });
    expect(blockedResp.status()).toBe(409);
    const blockedBody = await blockedResp.json();
    expect(blockedBody?.ok).toBe(false);
    expect(blockedBody?.error).toBe('ONBOARDING_TOWNHALL_REQUIRED');

    const registerResp = await api.post('/api/townhall/register', {
      data: {
        profile: {
          humanName: 'Robin',
          agentName: 'OpenClaw',
          humanAvatar: { prompt: 'Hero avatar prompt' },
          agentAvatar: { prompt: 'Agent avatar prompt' }
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
      }
    });
    expect(registerResp.ok()).toBeTruthy();
    const registerBody = await registerResp.json();
    expect(registerBody?.ok).toBe(true);
    expect(registerBody?.onboarding?.registrationComplete).toBe(true);

    const allowedResp = await api.post('/api/onboarding/brain/complete', {
      data: {}
    });
    expect(allowedResp.ok()).toBeTruthy();
    const allowedBody = await allowedResp.json();
    expect(allowedBody?.ok).toBe(true);
    expect(allowedBody?.nextStep).toBe('sigil');
  } finally {
    if (api) await api.dispose();
    await stopServer(launched.child);
    try {
      fs.unlinkSync(storePath);
    } catch {
      // ignore temp file cleanup errors
    }
  }
});
