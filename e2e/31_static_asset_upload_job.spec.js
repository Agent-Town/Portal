const { test, expect } = require('@playwright/test');
const { reset, uploadFixture, waitForTerminalJob, pngSize } = require('./helpers/static_asset');

test.beforeEach(async ({ request }) => {
  await reset(request);
});

test('static asset: upload -> job -> sprite + manifest package', async ({ request }) => {
  const up = await uploadFixture(request, 'good_full.png', {
    fields: {
      kind: 'prop',
      tileFootprintW: '1',
      tileFootprintH: '1',
      pixelateTo: '128',
      quantizeBits: '4'
    }
  });

  const job = await waitForTerminalJob(request, up.jobId);
  expect(job.status).toBe('completed');

  const pkgResp = await request.get(`/api/static-asset/${encodeURIComponent(up.assetId)}/package`);
  expect(pkgResp.ok()).toBeTruthy();
  const pkg = await pkgResp.json();

  expect(pkg.assetId).toBe(up.assetId);
  expect(pkg.hashes.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
  expect(pkg.hashes.spritePngSha256).toMatch(/^[a-f0-9]{64}$/);
  expect(pkg.hashes.sprite2xPngSha256).toMatch(/^[a-f0-9]{64}$/);
  expect(pkg.hashes.manifestJsonSha256).toMatch(/^[a-f0-9]{64}$/);

  const spriteResp = await request.get(pkg.assets.spritePng);
  expect(spriteResp.ok()).toBeTruthy();
  const spriteBytes = await spriteResp.body();
  const spriteSize = pngSize(spriteBytes);

  const sprite2xResp = await request.get(pkg.assets.sprite2xPng);
  expect(sprite2xResp.ok()).toBeTruthy();
  const sprite2xBytes = await sprite2xResp.body();
  const sprite2xSize = pngSize(sprite2xBytes);

  expect(sprite2xSize.w).toBe(spriteSize.w * 2);
  expect(sprite2xSize.h).toBe(spriteSize.h * 2);

  const manifestResp = await request.get(pkg.assets.manifestJson);
  expect(manifestResp.ok()).toBeTruthy();
  const manifest = await manifestResp.json();

  expect(manifest.kind).toBe('agent-town-static-asset-pack');
  expect(manifest.assetKind).toBe('prop');
  expect(manifest.projection.kind).toBe('iso-2:1');
  expect(manifest.projection.tile.w).toBe(64);
  expect(manifest.projection.tile.h).toBe(32);
  expect(manifest.tileFootprint.w).toBe(1);
  expect(manifest.tileFootprint.h).toBe(1);
  expect(manifest.pivot.origin[0]).toBe(0.5);
  expect(manifest.pivot.origin[1]).toBe(1);
});

