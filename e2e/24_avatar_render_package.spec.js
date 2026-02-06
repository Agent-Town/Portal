const { test, expect } = require('@playwright/test');
const { reset, uploadFixture, waitForTerminalJob, pngSize } = require('./helpers/avatar');

test.beforeEach(async ({ request }) => {
  await reset(request);
});

test('package contains idle+walk for 4 directions and ships x1 + x2 atlases', async ({ request, playwright }, testInfo) => {
  const up = await uploadFixture(request, 'good_full.png');
  const job = await waitForTerminalJob(request, up.jobId);
  expect(job.status).toBe('completed');

  const pkgResp = await request.get(`/api/avatar/${encodeURIComponent(up.avatarId)}/package`);
  expect(pkgResp.ok()).toBeTruthy();
  const pkg = await pkgResp.json();

  expect(pkg.hashes.atlasPngSha256).toMatch(/^[a-f0-9]{64}$/);
  expect(pkg.hashes.atlas2xPngSha256).toMatch(/^[a-f0-9]{64}$/);
  expect(pkg.hashes.metadataJsonSha256).toMatch(/^[a-f0-9]{64}$/);

  const metaResp = await request.get(pkg.assets.metadataJson);
  expect(metaResp.ok()).toBeTruthy();
  const meta = await metaResp.json();

  expect(meta.frame.w).toBe(32);
  expect(meta.frame.h).toBe(48);

  for (const dir of ['south', 'north', 'east', 'west']) {
    expect(meta.clips.idle[dir].length).toBe(2);
    expect(meta.clips.walk[dir].length).toBe(8);
  }

  const atlasResp = await request.get(pkg.assets.atlasPng);
  expect(atlasResp.ok()).toBeTruthy();
  const atlasBytes = await atlasResp.body();
  const atlasSize = pngSize(atlasBytes);

  const atlas2xResp = await request.get(pkg.assets.atlas2xPng);
  expect(atlas2xResp.ok()).toBeTruthy();
  const atlas2xBytes = await atlas2xResp.body();
  const atlas2xSize = pngSize(atlas2xBytes);

  expect(atlas2xSize.w).toBe(atlasSize.w * 2);
  expect(atlas2xSize.h).toBe(atlasSize.h * 2);

  // Cross-session: same input bytes => same hashes (content-hash artifact reuse).
  const isolated = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL });
  try {
    const up2 = await (async () => {
      const resp = await isolated.post('/api/avatar/upload', {
        multipart: {
          avatar: {
            name: 'good_full.png',
            mimeType: 'image/png',
            buffer: require('fs').readFileSync(require('path').join(process.cwd(), 'e2e/fixtures/avatar/good_full.png'))
          }
        }
      });
      expect(resp.ok()).toBeTruthy();
      return resp.json();
    })();

    const job2 = await (async () => {
      const started = Date.now();
      while (Date.now() - started < 15000) {
        const r = await isolated.get(`/api/avatar/jobs/${encodeURIComponent(up2.jobId)}`);
        expect(r.ok()).toBeTruthy();
        const payload = await r.json();
        if (payload.job.status === 'completed') return payload.job;
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      throw new Error('timeout');
    })();

    expect(job2.status).toBe('completed');

    const pkgResp2 = await isolated.get(`/api/avatar/${encodeURIComponent(up2.avatarId)}/package`);
    expect(pkgResp2.ok()).toBeTruthy();
    const pkg2 = await pkgResp2.json();
    expect(pkg2.hashes.atlasPngSha256).toBe(pkg.hashes.atlasPngSha256);
    expect(pkg2.hashes.metadataJsonSha256).toBe(pkg.hashes.metadataJsonSha256);
  } finally {
    await isolated.dispose();
  }
});
