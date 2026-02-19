const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveAssetPath(assetPath) {
  if (typeof assetPath !== 'string') return '';
  if (assetPath.startsWith('/')) return assetPath;
  return `/${assetPath}`;
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('vendor runtime manifest and bundle provenance are verifiable', async ({ request }) => {
  const vendorPkg = readJson(path.join(process.cwd(), 'vendors', 'openclaw-lite-main', 'package.json'));
  const vendorVersion = (vendorPkg.version || '').trim();
  expect(vendorVersion.length).toBeGreaterThan(0);

  const manifestResp = await request.get('/openclaw-lite/manifest.json');
  expect(manifestResp.ok()).toBeTruthy();
  const manifest = await manifestResp.json();

  expect(typeof manifest.vendorPath).toBe('string');
  expect(manifest.vendorPath).toContain('vendors/openclaw-lite-main');
  expect(typeof manifest.vendorVersion).toBe('string');
  expect(manifest.vendorVersion).toBe(vendorVersion);
  expect(manifest.buildTime).toBeTruthy();
  expect(manifest.entrypoints).toBeTruthy();
  expect(typeof manifest.entrypoints.gateway).toBe('string');
  expect(typeof manifest.entrypoints.worker).toBe('string');

  const gatewayPath = resolveAssetPath(manifest.entrypoints.gateway);
  const workerPath = resolveAssetPath(manifest.entrypoints.worker);

  const gatewayResp = await request.get(gatewayPath);
  expect(gatewayResp.ok()).toBeTruthy();
  const gatewayCode = await gatewayResp.text();
  expect(gatewayCode.length).toBeGreaterThan(100);
  expect(gatewayCode).not.toContain('openclaw-lite-mock');
  expect(gatewayCode).not.toContain('So1anaMock');

  const workerResp = await request.get(workerPath);
  expect(workerResp.ok()).toBeTruthy();
  const workerCode = await workerResp.text();
  expect(workerCode.length).toBeGreaterThan(100);
  expect(workerCode).not.toContain('openclaw-lite-mock');
  expect(workerCode).not.toContain('streamMock');
  expect(workerCode).not.toContain('local://openclaw-lite');
});

