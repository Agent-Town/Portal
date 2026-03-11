const { test, expect, request } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomPort(min = 5300, span = 300) {
  return min + Math.floor(Math.random() * span);
}

function startServer({ port, storePath, callbackHost, callbackPort, enablePrivy = false }) {
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(port),
    TEST_RESET_TOKEN: 'test-reset',
    ADMIN_TOKEN: 'test-admin',
    START_PAGE_ENABLED: '0',
    STORE_PATH: storePath,
    OPENAI_CODEX_OAUTH_CALLBACK_HOST: callbackHost,
    OPENAI_CODEX_OAUTH_CALLBACK_PORT: String(callbackPort),
    ...(enablePrivy
      ? {
          PRIVY_APP_ID: 'test-privy-app',
          ENABLE_PRIVY_IN_TEST: '1'
        }
      : {})
  };

  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let logs = '';
  const append = (chunk) => {
    logs += String(chunk || '');
    if (logs.length > 12000) logs = logs.slice(-12000);
  };
  if (child.stdout) child.stdout.on('data', append);
  if (child.stderr) child.stderr.on('data', append);

  return {
    child,
    readLogs: () => logs
  };
}

async function waitForServer(baseUrl, readLogs, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const resp = await fetch(`${baseUrl}/api/health`);
      if (resp.ok) return;
    } catch {
      // keep polling
    }
    await sleep(150);
  }
  throw new Error(`SERVER_START_TIMEOUT\n${readLogs()}`);
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

test('oauth start uses callback host in redirect URI and fails closed when callback server cannot bind', async () => {
  const goodPort = randomPort(5600, 200);
  const goodCbPort = randomPort(1460, 120);
  const goodStorePath = path.join(os.tmpdir(), `agent-town-oauth-good-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
  const goodBaseUrl = `http://127.0.0.1:${goodPort}`;
  const goodServer = startServer({
    port: goodPort,
    storePath: goodStorePath,
    callbackHost: '127.0.0.1',
    callbackPort: goodCbPort
  });

  let goodApi = null;
  try {
    await waitForServer(goodBaseUrl, goodServer.readLogs);
    goodApi = await request.newContext({ baseURL: goodBaseUrl });

    const resetResp = await goodApi.post('/__test__/reset', { headers: { 'x-test-reset': 'test-reset' } });
    expect(resetResp.ok()).toBeTruthy();

    const startResp = await goodApi.post('/api/agent/lite/llm/oauth/openai-codex/start', { data: {} });
    expect(startResp.ok()).toBeTruthy();
    const startBody = await startResp.json();
    expect(startBody?.ok).toBe(true);
    expect(startBody?.callbackServer?.ready).toBe(true);
    expect(startBody?.redirectUri).toBe(`http://127.0.0.1:${goodCbPort}/auth/callback`);
  } finally {
    if (goodApi) await goodApi.dispose();
    await stopServer(goodServer.child);
    try {
      fs.unlinkSync(goodStorePath);
    } catch {
      // ignore temp file cleanup errors
    }
  }

  const badPort = randomPort(5800, 200);
  const badCbPort = randomPort(1700, 120);
  const badStorePath = path.join(os.tmpdir(), `agent-town-oauth-bad-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
  const badBaseUrl = `http://127.0.0.1:${badPort}`;
  const badServer = startServer({
    port: badPort,
    storePath: badStorePath,
    callbackHost: '192.0.2.1',
    callbackPort: badCbPort
  });

  let badApi = null;
  try {
    await waitForServer(badBaseUrl, badServer.readLogs);
    badApi = await request.newContext({ baseURL: badBaseUrl });

    const startResp = await badApi.post('/api/agent/lite/llm/oauth/openai-codex/start', { data: {} });
    expect(startResp.status()).toBe(503);
    const startBody = await startResp.json();
    expect(startBody?.ok).toBe(false);
    expect(startBody?.error).toBe('CALLBACK_SERVER_UNAVAILABLE');
    expect(startBody?.callbackServer?.ready).toBe(false);
  } finally {
    if (badApi) await badApi.dispose();
    await stopServer(badServer.child);
    try {
      fs.unlinkSync(badStorePath);
    } catch {
      // ignore temp file cleanup errors
    }
  }
});

test('oauth start falls back to manual callback mode when the callback port is already in use', async () => {
  const occupiedPort = randomPort(1960, 120);
  const blocker = await new Promise((resolve, reject) => {
    const server = require('http').createServer((req, res) => {
      res.statusCode = 200;
      res.end('occupied');
    });
    server.once('error', reject);
    server.listen(occupiedPort, '127.0.0.1', () => resolve(server));
  });

  const port = randomPort(6200, 200);
  const storePath = path.join(os.tmpdir(), `agent-town-oauth-manual-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
  const baseUrl = `http://127.0.0.1:${port}`;
  const launched = startServer({
    port,
    storePath,
    callbackHost: '127.0.0.1',
    callbackPort: occupiedPort
  });

  let api = null;
  try {
    await waitForServer(baseUrl, launched.readLogs);
    api = await request.newContext({ baseURL: baseUrl });

    const startResp = await api.post('/api/agent/lite/llm/oauth/openai-codex/start', { data: {} });
    expect(startResp.ok()).toBeTruthy();
    const startBody = await startResp.json();
    expect(startBody?.ok).toBe(true);
    expect(startBody?.callbackServer?.ready).toBe(false);
    expect(startBody?.callbackServer?.error).toBe('EADDRINUSE');
    expect(startBody?.callbackServer?.manualOnly).toBe(true);
    expect(String(startBody?.redirectUri || '')).toBe(`http://127.0.0.1:${occupiedPort}/auth/callback`);
    expect(String(startBody?.authorizeUrl || '')).toContain(encodeURIComponent(`http://127.0.0.1:${occupiedPort}/auth/callback`));

    const pendingResp = await api.post('/api/agent/lite/llm/oauth/openai-codex/exchange', {
      data: { attemptId: startBody.attemptId }
    });
    expect(pendingResp.status()).toBe(409);
    await expect(pendingResp.json()).resolves.toMatchObject({ ok: false, error: 'CODE_PENDING' });
  } finally {
    if (api) await api.dispose();
    await stopServer(launched.child);
    await new Promise((resolve) => blocker.close(resolve));
    try {
      fs.unlinkSync(storePath);
    } catch {
      // ignore temp file cleanup errors
    }
  }
});

test('onboarding status endpoint uses current session schema', async () => {
  const port = randomPort(6000, 200);
  const cbPort = randomPort(1840, 120);
  const storePath = path.join(os.tmpdir(), `agent-town-onboarding-status-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
  const baseUrl = `http://127.0.0.1:${port}`;
  const launched = startServer({
    port,
    storePath,
    callbackHost: '127.0.0.1',
    callbackPort: cbPort,
    enablePrivy: true
  });

  let api = null;
  try {
    await waitForServer(baseUrl, launched.readLogs);
    api = await request.newContext({ baseURL: baseUrl });

    const resetResp = await api.post('/__test__/reset', { headers: { 'x-test-reset': 'test-reset' } });
    expect(resetResp.ok()).toBeTruthy();

    const beforeResp = await api.get('/api/onboarding/status');
    expect(beforeResp.ok()).toBeTruthy();
    const beforeBody = await beforeResp.json();
    expect(beforeBody?.ok).toBe(true);
    expect(beforeBody?.step).toBe(2);
    expect(beforeBody?.done).toBe(false);

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
            evm: { id: '11155111:8101' },
            solana: { id: 'solana:user-8101' }
          },
          agent: {
            evm: { id: '11155111:8102' },
            solana: { id: 'solana:agent-8102' }
          }
        }
      }
    });
    expect(registerResp.ok()).toBeTruthy();

    const afterResp = await api.get('/api/onboarding/status');
    expect(afterResp.ok()).toBeTruthy();
    const afterBody = await afterResp.json();
    expect(afterBody?.ok).toBe(true);
    expect(afterBody?.step).toBe(4);
    expect(afterBody?.done).toBe(false);
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
