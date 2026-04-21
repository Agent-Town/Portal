const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('the Founders Plot asset manifest is complete, dimensionally correct, and under budget', async ({ page, request }) => {
  const response = await request.get('/experiences/founders-plot/assets/asset-manifest.json');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  expect(manifest?.styleFamily).toBe('agent-town-frontier-storybook-v1');
  expect(assets.length).toBeGreaterThanOrEqual(32);

  await page.goto('/founders-plot?embed=1');
  const inspected = await page.evaluate(async (assetEntries) => {
    async function inspectImage(asset) {
      if (String(asset.src || '').endsWith('.svg')) {
        const raw = await fetch(asset.src, { cache: 'no-store' }).then((res) => res.text());
        const widthMatch = raw.match(/width="(\d+)"/);
        const heightMatch = raw.match(/height="(\d+)"/);
        return {
          id: asset.id,
          naturalWidth: Number(widthMatch?.[1] || 0),
          naturalHeight: Number(heightMatch?.[1] || 0),
          hasAlpha: true
        };
      }
      const image = await new Promise((resolve, reject) => {
        const next = new Image();
        next.onload = () => resolve(next);
        next.onerror = reject;
        next.src = asset.src;
      });
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const corner = context.getImageData(0, 0, 1, 1).data;
      return {
        id: asset.id,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        hasAlpha: corner[3] < 255
      };
    }
    return await Promise.all(assetEntries.map((asset) => inspectImage(asset)));
  }, assets);

  const byId = new Map(inspected.map((entry) => [entry.id, entry]));
  const transparentRequired = assets.filter((asset) => asset.transparent === true && !String(asset.src || '').endsWith('.svg'));
  const totalBytes = assets.reduce((sum, asset) => sum + Number(asset?.bytes || 0), 0);

  for (const asset of assets) {
    const inspectedAsset = byId.get(asset.id);
    expect(inspectedAsset?.naturalWidth).toBe(asset.width);
    expect(inspectedAsset?.naturalHeight).toBe(asset.height);
    expect(asset?.promptFile).toBeTruthy();
    expect(asset?.license).toBeTruthy();
    expect(asset?.styleReview?.passed).toBe(true);
    expect(asset?.reviewer).toBeTruthy();
    expect(asset?.approvalStatus).toBe('approved');
  }

  transparentRequired.forEach((asset) => {
    expect(byId.get(asset.id)?.hasAlpha).toBe(true);
  });
  expect(totalBytes).toBeLessThanOrEqual(2_800_000);
});
