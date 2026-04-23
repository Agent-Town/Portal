const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const repoRoot = path.resolve(__dirname, '..');

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('active routes reference the V1.4.3 platform assets and not the retired V1.4.2 platform art', async ({ request }) => {
  const startHtml = await request.get('/start.html').then((response) => response.text());
  const townhallHtml = await request.get('/views/townhall.html').then((response) => response.text());
  const brainHtml = await request.get('/views/brain.html').then((response) => response.text());
  const houseHtml = await request.get('/house.html').then((response) => response.text());
  const styles = await request.get('/styles.css').then((response) => response.text());

  expect(startHtml).toContain('/assets/platform/start_gate/start-gate-hero-v1_4_3.webp');
  expect(townhallHtml).toContain('/assets/platform/townhall/townhall-onboarding-illustration-v1_4_3.webp');
  expect(brainHtml).toContain('/assets/platform/brain/brain-connect-illustration-v1_4_3.webp');
  expect(houseHtml).toContain('/assets/platform/house/house-claim-share-illustration-v1_4_3.webp');
  expect(styles).toContain('/assets/platform/town_shell/town-shell-background-v1_4_3.webp');

  expect(startHtml).not.toContain('/assets/hero-cast/hero-cast-group.webp" alt="Agent Town intro"');
  expect(styles).not.toContain('/assets/platform/town-shell-background-v1_4_2.webp');
  expect(townhallHtml).not.toContain('/assets/platform/townhall-onboarding-illustration-v1_4_2.webp');
  expect(brainHtml).not.toContain('/assets/platform/brain-connect-marker-v1_4_2.webp');
});

test('platform asset manifest stays under budget and references live code paths', async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'public/assets/platform/asset-manifest.json'), 'utf8'));
  expect(manifest.schemaVersion).toBe('v1.4.3');
  expect(Number(manifest.totalBytes)).toBeLessThanOrEqual(8_388_608);
  for (const asset of manifest.assets) {
    expect(fs.existsSync(path.join(repoRoot, asset.path))).toBe(true);
    if (!asset.futureUse) {
      expect(Array.isArray(asset.usedBy) && asset.usedBy.length > 0).toBeTruthy();
    }
  }
});
