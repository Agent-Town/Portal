const { spawn } = require('child_process');

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
    PRIVY_LOGIN_METHOD: 'guest',
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
      // retry until timeout
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

module.exports = {
  randomPort,
  startPrivyTestServer,
  stopServer,
  waitForServerHealth
};
