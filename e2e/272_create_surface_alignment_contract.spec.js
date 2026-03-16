const { test, expect } = require('@playwright/test');

const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const VIEWPORTS = [
  { label: 'mobile', width: 390, height: 844, stackedShell: true },
  { label: 'desktop', width: 1440, height: 1200, stackedShell: false },
];

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('create surface keeps one guided workspace and adapts cleanly from mobile to desktop', async ({ page }) => {
  await installMockSolanaWallet(page);
  await reachCreateViaLite(page);

  const panel = page.getByTestId('create-panel');
  const palette = page.getByTestId('palette');
  const canvas = page.getByTestId('canvas');
  const actionRow = page.getByTestId('create-action-row');
  const shareButton = page.getByTestId('share-btn');
  const status = page.locator('#shareStatus');

  await expect(panel).toBeVisible();
  await expect(palette).toBeVisible();
  await expect(canvas).toBeVisible();
  await expect(actionRow).toBeVisible();
  await expect(shareButton).toBeVisible();
  await expect(status).toHaveClass(/is-hidden/);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(150);

    const metrics = await page.evaluate(() => {
      const hero = document.querySelector('.createHero');
      const shell = document.querySelector('.createCanvasShell');
      const paletteCard = document.querySelector('.createPaletteCard');
      const boardCard = document.querySelector('.createBoardCard');
      const title = document.querySelector('.createTitle');
      const nextNote = document.querySelector('.createNextNote');
      const root = document.documentElement;
      if (!(hero instanceof HTMLElement) || !(shell instanceof HTMLElement) || !(paletteCard instanceof HTMLElement) || !(boardCard instanceof HTMLElement) || !(title instanceof HTMLElement) || !(nextNote instanceof HTMLElement)) {
        return null;
      }
      const paletteRect = paletteCard.getBoundingClientRect();
      const boardRect = boardCard.getBoundingClientRect();
      return {
        documentWidth: root.scrollWidth,
        viewportWidth: window.innerWidth,
        heroTop: hero.getBoundingClientRect().top,
        shellTop: shell.getBoundingClientRect().top,
        stackedShell: Math.abs(paletteRect.top - boardRect.top) > 12,
        titleFontSize: Number.parseFloat(window.getComputedStyle(title).fontSize || '0'),
        noteFontSize: Number.parseFloat(window.getComputedStyle(nextNote).fontSize || '0'),
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.heroTop).toBeLessThan(metrics.shellTop);
    expect(metrics.stackedShell).toBe(viewport.stackedShell);
    expect(metrics.titleFontSize).toBeGreaterThan(metrics.noteFontSize);
  }
});
