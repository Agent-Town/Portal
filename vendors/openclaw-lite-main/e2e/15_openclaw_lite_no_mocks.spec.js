const { test, expect } = require('@playwright/test');
const fs = require('fs/promises');
const path = require('path');

test('OpenClaw Lite bundles MUST NOT include mock LLM/wallet adapters', async () => {
  const repoRoot = process.cwd();
  const workerBundle = path.join(repoRoot, 'public', 'openclaw-lite', 'worker.js');
  const gatewayBundle = path.join(repoRoot, 'public', 'openclaw-lite', 'gateway.js');

  const worker = await fs.readFile(workerBundle, 'utf8');
  const gateway = await fs.readFile(gatewayBundle, 'utf8');

  // LLM: no in-process echo/mocks
  expect(worker).not.toContain('openclaw-lite-mock');
  expect(worker).not.toContain('streamMock');
  expect(worker).not.toContain('local://openclaw-lite');

  // Wallet: tests must not rely on injected wallet mocks
  expect(gateway).not.toContain('So1anaMock');
});

