const { test, expect, request } = require('@playwright/test');
const { createServer } = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getFreePort() {
  const probe = createServer();
  const port = await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      if (!address || typeof address === 'string') {
        reject(new Error('FREE_PORT_RESOLVE_FAILED'));
        return;
      }
      resolve(address.port);
    });
  });
  await new Promise((resolve) => probe.close(() => resolve()));
  return Number(port);
}

function startPrivyApiStub({ port, transactionId, transactionHash }) {
  let requestCount = 0;
  let lastAuthHeader = '';
  let lastAppIdHeader = '';
  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === `/v1/transactions/${transactionId}`) {
      requestCount += 1;
      lastAuthHeader = String(req.headers.authorization || '');
      lastAppIdHeader = String(req.headers['privy-app-id'] || '');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        data: {
          id: transactionId,
          status: 'confirmed',
          transaction_hash: transactionHash
        }
      }));
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'NOT_FOUND' } }));
  });

  return {
    listen: () => new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', resolve);
    }),
    close: () => new Promise((resolve) => server.close(() => resolve())),
    getState: () => ({ requestCount, lastAuthHeader, lastAppIdHeader })
  };
}

function startServer({ port, storePath, privyApiBaseUrl }) {
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(port),
    TEST_RESET_TOKEN: 'test-reset',
    ADMIN_TOKEN: 'test-admin',
    START_PAGE_ENABLED: '0',
    STORE_PATH: storePath,
    ENABLE_PRIVY_IN_TEST: '1',
    PRIVY_APP_ID: 'test-privy-app',
    PRIVY_APP_SECRET: 'test-privy-secret',
    PRIVY_CLIENT_ID: 'test-privy-client',
    PRIVY_API_BASE_URL: privyApiBaseUrl
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
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const resp = await fetch(`${baseUrl}/api/health`);
      if (resp.ok) return;
    } catch {
      // retry until timeout
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

test('privy transaction status accepts same-origin fetch metadata but still rejects explicit cross-origin headers', async () => {
  const appPort = await getFreePort();
  const stubPort = await getFreePort();
  const transactionId = '11111111-2222-4333-8444-555555555555';
  const transactionHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const storePath = path.join(
    os.tmpdir(),
    `agent-town-privy-origin-guard-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`
  );
  const baseUrl = `http://127.0.0.1:${appPort}`;
  const privyApiBaseUrl = `http://127.0.0.1:${stubPort}`;
  const stub = startPrivyApiStub({ port: stubPort, transactionId, transactionHash });
  const launched = startServer({ port: appPort, storePath, privyApiBaseUrl });
  let api = null;

  try {
    await stub.listen();
    await waitForServer(baseUrl, launched.readLogs);
    api = await request.newContext({ baseURL: baseUrl });

    const sessionResp = await api.get('/api/session');
    expect(sessionResp.ok()).toBeTruthy();

    const sameOriginResp = await api.get(`/api/privy/transactions/${transactionId}`, {
      headers: {
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty'
      }
    });
    expect(sameOriginResp.ok()).toBeTruthy();
    const sameOriginBody = await sameOriginResp.json();
    expect(sameOriginBody?.ok).toBe(true);
    expect(sameOriginBody?.transaction?.transactionHash).toBe(transactionHash);

    const stubState = stub.getState();
    expect(stubState.requestCount).toBeGreaterThanOrEqual(1);
    expect(stubState.lastAuthHeader).toContain('Basic ');
    expect(stubState.lastAppIdHeader).toBe('test-privy-app');

    const crossOriginResp = await api.get(`/api/privy/transactions/${transactionId}`, {
      headers: {
        origin: 'https://evil.example',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty'
      }
    });
    expect(crossOriginResp.status()).toBe(403);
    await expect(crossOriginResp.json()).resolves.toMatchObject({ ok: false, error: 'FORBIDDEN_ORIGIN' });

    const missingContextResp = await api.get(`/api/privy/transactions/${transactionId}`);
    expect(missingContextResp.status()).toBe(403);
    await expect(missingContextResp.json()).resolves.toMatchObject({ ok: false, error: 'FORBIDDEN_ORIGIN' });
  } finally {
    if (api) await api.dispose();
    await stopServer(launched.child);
    await stub.close();
    try {
      fs.unlinkSync(storePath);
    } catch {
      // ignore temp file cleanup errors
    }
  }
});
