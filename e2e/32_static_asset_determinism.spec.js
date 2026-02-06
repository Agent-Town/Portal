const { test, expect } = require('@playwright/test');
const { reset, uploadFixture, waitForTerminalJob } = require('./helpers/static_asset');
const fs = require('fs');
const path = require('path');

test.beforeEach(async ({ request }) => {
  await reset(request);
});

test('static asset: same bytes + same options is idempotent within a session and deterministic across sessions', async ({ request, playwright }, testInfo) => {
  const fields = {
    kind: 'decal',
    tileFootprintW: '1',
    tileFootprintH: '1',
    pixelateTo: '128',
    quantizeBits: '3'
  };

  const up1 = await uploadFixture(request, 'good_full.png', { fields });
  const up2 = await uploadFixture(request, 'good_full.png', { fields });
  expect(up2.assetId).toBe(up1.assetId);
  expect(up2.jobId).toBe(up1.jobId);

  const job = await waitForTerminalJob(request, up1.jobId);
  expect(job.status).toBe('completed');

  const pkgResp = await request.get(`/api/static-asset/${encodeURIComponent(up1.assetId)}/package`);
  expect(pkgResp.ok()).toBeTruthy();
  const pkg = await pkgResp.json();

  // Cross-session: same input bytes + same options => same hashes.
  const isolated = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL });
  try {
    const resp = await isolated.post('/api/static-asset/upload', {
      multipart: {
        asset: {
          name: 'good_full.png',
          mimeType: 'image/png',
          buffer: fs.readFileSync(path.join(process.cwd(), 'e2e/fixtures/avatar/good_full.png'))
        },
        ...fields
      }
    });
    expect(resp.ok()).toBeTruthy();
    const upIso = await resp.json();

    const job2 = await (async () => {
      const started = Date.now();
      while (Date.now() - started < 15000) {
        const r = await isolated.get(`/api/static-asset/jobs/${encodeURIComponent(upIso.jobId)}`);
        expect(r.ok()).toBeTruthy();
        const payload = await r.json();
        if (payload.job.status === 'completed') return payload.job;
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      throw new Error('timeout');
    })();
    expect(job2.status).toBe('completed');

    const pkgResp2 = await isolated.get(`/api/static-asset/${encodeURIComponent(upIso.assetId)}/package`);
    expect(pkgResp2.ok()).toBeTruthy();
    const pkg2 = await pkgResp2.json();

    expect(pkg2.hashes.spritePngSha256).toBe(pkg.hashes.spritePngSha256);
    expect(pkg2.hashes.manifestJsonSha256).toBe(pkg.hashes.manifestJsonSha256);
  } finally {
    await isolated.dispose();
  }
});

