const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'public/experiences/founders-plot/assets/asset-manifest.json');
const heroDir = path.join(repoRoot, 'e2e/162_founders_plot_full_route_player_surface.spec.js-snapshots');

test('primary-view assets carry human approval metadata and hero-frame signoff metadata', async () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const primaryViewAssets = assets.filter((asset) => String(asset?.usage || '') === 'primary-view');
  const heroFrame = manifest?.heroFrame || null;

  expect(primaryViewAssets.length).toBeGreaterThan(10);
  expect(Array.isArray(manifest?.referenceInputs)).toBe(true);
  expect(manifest?.videoReference?.url).toBe('https://www.youtube.com/watch?v=ZW7tUUZqhdY');
  expect(manifest?.videoReference?.frameExtractionRequired).toBe(false);
  primaryViewAssets.forEach((asset) => {
    expect(asset.approvalStatus).toBe('approved');
    expect(String(asset.sourceTool || '').trim().length).toBeGreaterThan(0);
    expect(String(asset.referenceSource || '').trim().length).toBeGreaterThan(0);
    expect(Array.isArray(asset.referenceFiles)).toBe(true);
    expect(String(asset.rightsStatus || '').trim().length).toBeGreaterThan(0);
    expect(Array.isArray(asset.postProcessing)).toBe(true);
    expect(asset.approvalScope).toBe('gameplay_asset');
    expect(String(asset.approvedBy || '').trim().length).toBeGreaterThan(0);
    expect(String(asset.approvedAt || '').trim()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(String(asset.approvalNotes || '').trim().length).toBeGreaterThan(0);
  });

  expect(heroFrame).toBeTruthy();
  expect(heroFrame.approvalStatus).toBe('approved');
  expect(String(heroFrame.approvedBy || '').trim().length).toBeGreaterThan(0);
  expect(String(heroFrame.approvedAt || '').trim()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(String(heroFrame.sourceRoute || '')).toContain('district=founders-plot');
  expect(String(heroFrame.screenshotPrefix || '')).toContain('founders-v1-3-1-full-route-hero-1280');
});

test('hero screenshot metadata points at a real captured baseline', async () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const heroFrame = manifest?.heroFrame || {};
  const prefix = String(heroFrame.screenshotPrefix || '');
  const files = fs.existsSync(heroDir)
    ? fs.readdirSync(heroDir).filter((entry) => entry.startsWith(prefix))
    : [];

  expect(prefix.length).toBeGreaterThan(0);
  expect(files.length).toBeGreaterThan(0);
});
