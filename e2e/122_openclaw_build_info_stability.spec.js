const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

async function loadBuildInfoHelpers() {
  const scriptPath = path.join(process.cwd(), 'scripts', 'build_openclaw_lite_runtime.mjs');
  return import(pathToFileURL(scriptPath).href);
}

test('openclaw build-info preserves builtAt when sync metadata is unchanged', async () => {
  const { createBuildInfoPayload, stabilizeBuildInfoPayload } = await loadBuildInfoHelpers();
  const existingPayload = {
    vendorPath: 'vendors/openclaw-lite-main',
    vendorVersion: '1.2.0',
    builtAt: '2026-03-03T01:47:37.755Z',
    copiedArtifacts: ['gateway.js', 'worker.js'],
    copiedShared: ['encoding.js', 'crypto.js']
  };

  const stablePayload = stabilizeBuildInfoPayload({
    nextPayload: createBuildInfoPayload({
      vendorVersion: '1.2.0',
      builtAt: '2026-03-09T00:00:00.000Z',
      copiedArtifacts: ['worker.js', 'gateway.js'],
      copiedShared: ['crypto.js', 'encoding.js']
    }),
    existingPayload
  });

  expect(stablePayload.builtAt).toBe('2026-03-03T01:47:37.755Z');
  expect(stablePayload.copiedArtifacts).toEqual(['gateway.js', 'worker.js']);
  expect(stablePayload.copiedShared).toEqual(['crypto.js', 'encoding.js']);
});

test('openclaw build-info refreshes builtAt when sync metadata changes', async () => {
  const { createBuildInfoPayload, stabilizeBuildInfoPayload } = await loadBuildInfoHelpers();
  const nextPayload = createBuildInfoPayload({
    vendorVersion: '1.2.1',
    builtAt: '2026-03-09T00:00:00.000Z',
    copiedArtifacts: ['gateway.js', 'worker.js', 'town.js'],
    copiedShared: ['crypto.js', 'encoding.js']
  });

  const refreshedPayload = stabilizeBuildInfoPayload({
    nextPayload,
    existingPayload: {
      vendorPath: 'vendors/openclaw-lite-main',
      vendorVersion: '1.2.0',
      builtAt: '2026-03-03T01:47:37.755Z',
      copiedArtifacts: ['gateway.js', 'worker.js'],
      copiedShared: ['crypto.js', 'encoding.js']
    }
  });

  expect(refreshedPayload.builtAt).toBe('2026-03-09T00:00:00.000Z');
  expect(refreshedPayload.vendorVersion).toBe('1.2.1');
  expect(refreshedPayload.copiedArtifacts).toEqual(['gateway.js', 'town.js', 'worker.js']);
});
