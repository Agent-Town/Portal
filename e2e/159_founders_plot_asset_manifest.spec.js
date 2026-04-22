const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const ALLOWED_GENERATORS = ['gpt-image-2', 'codex-svg', 'reference-normalized'];

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('the Founders Plot asset manifest is complete, dimensionally correct, and under budget', async ({ page, request }) => {
  const response = await request.get('/experiences/founders-plot/assets/asset-manifest.json');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  expect(manifest?.schemaVersion).toBe('v1.4.2');
  expect(manifest?.styleFamily).toBe('agent-town-frontier-storybook-v1_4_2');
  expect(Array.isArray(manifest?.referenceInputs)).toBe(true);
  expect(manifest?.videoReference?.url).toBe('https://www.youtube.com/watch?v=ZW7tUUZqhdY');
  expect(manifest?.videoReference?.usage).toBe('tone_motion_story_reference_only');
  expect(manifest?.videoReference?.frameExtractionRequired).toBe(false);
  expect(manifest?.heroFrame?.screenshotPrefix).toBe('founders-v1-4-2-full-route-hero-1280');
  expect(assets.length).toBeGreaterThanOrEqual(43);

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
    expect(ALLOWED_GENERATORS).toContain(asset?.generatedBy);
    expect(asset?.generationMode).toBeTruthy();
    expect(asset?.model).toBeTruthy();
    expect(asset?.candidateId).toBeTruthy();
    expect(asset?.candidatePath).toBeTruthy();
    expect(Array.isArray(asset?.referenceInputs)).toBe(true);
    expect(asset?.referenceInputs?.length).toBeGreaterThan(0);
    expect(asset?.referenceHashes).toBeTruthy();
    expect(Array.isArray(asset?.postProcessing)).toBe(true);
    expect(asset?.status).toBe('approved');
    expect(asset?.styleReview?.passed).toBe(true);
    expect(asset?.approvalStatus).toBe('approved');
    expect(asset?.approvedBy).toBeTruthy();
    expect(asset?.approvedAt).toBeTruthy();
    expect(asset?.approvalNotes).toBeTruthy();
  }

  transparentRequired.forEach((asset) => {
    expect(byId.get(asset.id)?.hasAlpha).toBe(true);
  });
  expect(totalBytes).toBeLessThanOrEqual(4_500_000);
});
