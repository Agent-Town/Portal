const { test, expect } = require('@playwright/test');
const { reset, uploadFixture, waitForTerminalJob, pngSize } = require('./helpers/avatar');
const sharp = require('sharp');

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
  expect(pkg.hashes.manifestJsonSha256).toMatch(/^[a-f0-9]{64}$/);

  const metaResp = await request.get(pkg.assets.metadataJson);
  expect(metaResp.ok()).toBeTruthy();
  const meta = await metaResp.json();

  expect(meta.frame.w).toBe(48);
  expect(meta.frame.h).toBe(72);

  for (const dir of ['se', 'sw', 'nw', 'ne']) {
    expect(meta.clips.idle[dir].length).toBe(2);
    expect(meta.clips.walk[dir].length).toBe(8);
  }

  // Regression: idle frames must include legs (standing still should not "lose" lower body).
  // Compare alpha coverage in the bottom third of the frame for idle vs walk.
  const atlasRespRaw = await request.get(pkg.assets.atlasPng);
  expect(atlasRespRaw.ok()).toBeTruthy();
  const atlasBytesRaw = await atlasRespRaw.body();
  const decoded = await sharp(atlasBytesRaw).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const atlasW = decoded.info.width;
  const atlasH = decoded.info.height;
  expect(atlasW).toBe(meta.atlas.w);
  expect(atlasH).toBe(meta.atlas.h);

  function alphaCountInBottomThird(rect) {
    const { x, y, w, h } = rect;
    const y0 = y + Math.floor(h * 0.66);
    const y1 = y + h;
    let count = 0;
    for (let py = y0; py < y1; py += 1) {
      for (let px = x; px < x + w; px += 1) {
        const i = (py * atlasW + px) * 4 + 3;
        if (decoded.data[i] > 24) count += 1;
      }
    }
    return count;
  }

  const idle0 = meta.clips.idle.se[0];
  const walk0 = meta.clips.walk.se[0];
  const idleBottom = alphaCountInBottomThird(idle0);
  const walkBottom = alphaCountInBottomThird(walk0);
  // Idle should retain most of the leg pixels.
  expect(idleBottom).toBeGreaterThan(Math.floor(walkBottom * 0.75));

  const manifestResp = await request.get(pkg.assets.manifestJson);
  expect(manifestResp.ok()).toBeTruthy();
  const manifest = await manifestResp.json();
  expect(manifest.projection.kind).toBe('iso-2:1');
  expect(manifest.projection.tile.w).toBe(64);
  expect(manifest.projection.tile.h).toBe(32);
  expect(manifest.sprite.frame.w).toBe(48);
  expect(manifest.sprite.frame.h).toBe(72);
  expect(manifest.sprite.pivot.name).toBe('feet');
  expect(manifest.sprite.pivot.x).toBe(24);
  expect(manifest.sprite.pivot.y).toBe(72);
  expect(manifest.clips.walk.se.frames).toBe(8);
  expect(manifest.clips.idle.nw.frames).toBe(2);

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
    expect(pkg2.hashes.manifestJsonSha256).toBe(pkg.hashes.manifestJsonSha256);
  } finally {
    await isolated.dispose();
  }
});
