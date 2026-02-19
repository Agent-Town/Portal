const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const DEFAULT_PORT = Number(process.env.PW_PORT || (process.env.CI ? 4173 : 4174));

function lineCount(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return text.split(/\r?\n/).length;
}

function extractFunctionBody(source, functionName) {
  const asyncSig = `async function ${functionName}(`;
  const syncSig = `function ${functionName}(`;
  const start = source.indexOf(asyncSig) >= 0 ? source.indexOf(asyncSig) : source.indexOf(syncSig);
  if (start < 0) throw new Error(`Function not found: ${functionName}`);
  const open = source.indexOf('{', start);
  if (open < 0) throw new Error(`Malformed function: ${functionName}`);

  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`Unclosed function: ${functionName}`);
}

async function resetServer(request) {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
}

function resolveBaseUrl(testInfo) {
  return String(testInfo.project.use.baseURL || `http://[::1]:${DEFAULT_PORT}`);
}

async function waitForHealth(origin, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  const url = `${origin}/api/health`;
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for ${url}`);
    await new Promise((r) => setTimeout(r, 120));
  }
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

async function startStandaloneServer(extraEnv = {}) {
  const port = Number(extraEnv.PORT || 0) || (await getFreePort());
  const storePath = path.join(os.tmpdir(), `openclaw-lite-security-${process.pid}-${port}.sqlite`);
  let logs = '';

  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'development',
      TEST_RESET_TOKEN: resetToken,
      STORE_PATH: storePath,
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (buf) => {
    logs += buf.toString('utf8');
    if (logs.length > 16_000) logs = logs.slice(-16_000);
  });
  child.stderr.on('data', (buf) => {
    logs += buf.toString('utf8');
    if (logs.length > 16_000) logs = logs.slice(-16_000);
  });

  const origin = `http://127.0.0.1:${port}`;
  try {
    await waitForHealth(origin);
  } catch (err) {
    if (child.exitCode == null) child.kill('SIGKILL');
    throw new Error(`${err.message}\nServer logs:\n${logs}`);
  }

  async function stop() {
    if (child.exitCode != null) return;
    await new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      child.once('exit', finish);
      child.kill('SIGTERM');
      setTimeout(() => {
        if (child.exitCode == null) child.kill('SIGKILL');
      }, 1500);
      setTimeout(finish, 3000);
    });
  }

  return { origin, stop, logs: () => logs };
}

test.describe('OpenClaw Lite: security findings regression suite', () => {
  test('finding #1: backend entrypoint respects modularity budget', () => {
    const indexPath = path.join(ROOT_DIR, 'server', 'index.js');
    expect(lineCount(indexPath)).toBeLessThanOrEqual(1200);
  });

  test('finding #2: Codex bridge localhost check must not use req.ip', () => {
    const bridgePath = path.join(ROOT_DIR, 'server', 'codex_bridge.js');
    const source = fs.readFileSync(bridgePath, 'utf8');
    const body = extractFunctionBody(source, 'isLocalRequest');

    expect(body).toContain('remoteAddress');
    expect(body).not.toMatch(/\breq\.ip\b/);
  });

  test('finding #3: every workspace mutation tool requires requestApproval', () => {
    const workerPath = path.join(ROOT_DIR, 'src', 'openclaw-lite', 'worker.js');
    const source = fs.readFileSync(workerPath, 'utf8');
    const mutatingFns = ['runWorkspaceMkdir', 'runWorkspaceWriteFile', 'runWorkspaceEditFile', 'runWorkspaceDelete'];

    for (const fnName of mutatingFns) {
      const body = extractFunctionBody(source, fnName);
      expect(body, `${fnName} must ask for approval before mutating state`).toContain('requestApproval(');
    }
  });

  test('finding #4a: web_fetch proxy blocks IPv6-mapped loopback aliases', async ({ request }, testInfo) => {
    await resetServer(request);
    const base = new URL(resolveBaseUrl(testInfo));
    const port = Number(base.port || DEFAULT_PORT);
    const target = `http://[::ffff:127.0.0.1]:${port}/__test__/web-fetch/doc/blocked`;

    const res = await request.post('/api/tools/web_fetch', {
      data: { url: target, maxBytes: 2048, followRedirects: true },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe('NETWORK_BLOCKED');
  });

  test('finding #4b: http_request proxy blocks IPv6-mapped loopback aliases', async ({ request }, testInfo) => {
    await resetServer(request);
    const base = new URL(resolveBaseUrl(testInfo));
    const port = Number(base.port || DEFAULT_PORT);
    const target = `http://[::ffff:127.0.0.1]:${port}/__test__/http/large-text`;

    const res = await request.post('/api/tools/http_request', {
      data: { method: 'GET', url: target, responseMode: 'text', followRedirects: true },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe('NETWORK_BLOCKED');
  });

  test('finding #5: tool proxy endpoints reject anonymous direct calls', async ({ playwright }, testInfo) => {
    const base = new URL(resolveBaseUrl(testInfo));
    const ctx = await playwright.request.newContext({ baseURL: `${base.protocol}//${base.host}` });
    try {
      const res = await ctx.post('/api/tools/web_fetch', {
        data: { url: 'https://fixture.openclaw.test/docs/agenttown', maxBytes: 2048 },
      });
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    } finally {
      await ctx.dispose();
    }
  });

  test('finding #6: non-test runtime does not expose window.__openclawLiteTest', async ({ browser }) => {
    const server = await startStandaloneServer({ NODE_ENV: 'development' });
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(`${server.origin}/lite`, { waitUntil: 'domcontentloaded' });
      const helperType = await page.evaluate(() => typeof window.__openclawLiteTest);
      expect(helperType).toBe('undefined');
    } finally {
      await context.close();
      await server.stop();
    }
  });

  test('finding #7: /responses is not implemented in Codex CLI bridge mode', async () => {
    const server = await startStandaloneServer({
      NODE_ENV: 'development',
      OPENCLAW_LITE_CODEX_CLI: '1',
    });
    try {
      const res = await fetch(`${server.origin}/api/llm/openai/v1/responses`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          input: [{ role: 'user', content: [{ type: 'input_text', text: 'hi' }] }],
        }),
      });
      expect(res.status).toBe(501);
    } finally {
      await server.stop();
    }
  });
});
