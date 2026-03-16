const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('shared empty-state cards stay consistent across leaderboard and registry', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/leaderboard');
  await expect(page.getByTestId('leaderboard-empty-state')).toBeVisible();

  const leaderboardMetrics = await page.evaluate(() => {
    const node = document.querySelector('[data-testid="leaderboard-empty-state"]');
    if (!(node instanceof HTMLElement)) return null;
    const styles = window.getComputedStyle(node);
    return {
      hasStateMessage: node.classList.contains('stateMessage'),
      boxShadow: styles.boxShadow,
      backgroundImage: styles.backgroundImage,
      borderRadius: Number.parseFloat(styles.borderRadius || '0'),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });

  expect(leaderboardMetrics).not.toBeNull();
  expect(leaderboardMetrics.hasStateMessage).toBe(true);
  expect(leaderboardMetrics.boxShadow).not.toBe('none');
  expect(leaderboardMetrics.backgroundImage).toContain('gradient');
  expect(leaderboardMetrics.borderRadius).toBeGreaterThanOrEqual(16);
  expect(leaderboardMetrics.documentWidth).toBeLessThanOrEqual(leaderboardMetrics.viewportWidth + 1);

  await page.goto('/registry.html?q=nohitszzzzzzz');
  await expect(page.getByTestId('registry-empty-state')).toBeVisible();

  const registryMetrics = await page.evaluate(() => {
    const node = document.querySelector('[data-testid="registry-empty-state"]');
    if (!(node instanceof HTMLElement)) return null;
    const styles = window.getComputedStyle(node);
    return {
      hasStateMessage: node.classList.contains('stateMessage'),
      boxShadow: styles.boxShadow,
      backgroundImage: styles.backgroundImage,
      borderRadius: Number.parseFloat(styles.borderRadius || '0'),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });

  expect(registryMetrics).not.toBeNull();
  expect(registryMetrics.hasStateMessage).toBe(true);
  expect(registryMetrics.boxShadow).not.toBe('none');
  expect(registryMetrics.backgroundImage).toContain('gradient');
  expect(registryMetrics.borderRadius).toBeGreaterThanOrEqual(16);
  expect(registryMetrics.documentWidth).toBeLessThanOrEqual(registryMetrics.viewportWidth + 1);
});

test('house and create status surfaces use shared state-note and empty-state classes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  await page.getByTestId('house-open-experiences').click();
  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();

  const houseMetrics = await page.evaluate(() => {
    const emptyNode = document.querySelector('[data-testid="house-experiences-empty"]');
    const detailNode = document.querySelector('[data-testid="house-experiences-detail"]');
    const statusNode = document.querySelector('#houseSurfaceStatus');
    if (!(emptyNode instanceof HTMLElement) || !(detailNode instanceof HTMLElement) || !(statusNode instanceof HTMLElement)) {
      return null;
    }
    return {
      emptyHasStateMessage: emptyNode.classList.contains('stateMessage'),
      detailHasStateNote: detailNode.classList.contains('stateNote'),
      statusHasStateNote: statusNode.classList.contains('stateNote'),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });

  expect(houseMetrics).not.toBeNull();
  expect(houseMetrics.emptyHasStateMessage).toBe(true);
  expect(houseMetrics.detailHasStateNote).toBe(true);
  expect(houseMetrics.statusHasStateNote).toBe(true);
  expect(houseMetrics.documentWidth).toBeLessThanOrEqual(houseMetrics.viewportWidth + 1);

  await installMockSolanaWallet(page);
  await reachCreateViaLite(page);
  await expect(page.getByTestId('create-panel')).toBeVisible();
  const createMetrics = await page.evaluate(() => {
    const errNode = document.querySelector('[data-testid="create-error"]');
    const shareNode = document.querySelector('#shareStatus');
    if (!(errNode instanceof HTMLElement) || !(shareNode instanceof HTMLElement)) return null;
    return {
      errHasStateNote: errNode.classList.contains('stateNote'),
      shareHasStateNote: shareNode.classList.contains('stateNote'),
    };
  });

  expect(createMetrics).not.toBeNull();
  expect(createMetrics.errHasStateNote).toBe(true);
  expect(createMetrics.shareHasStateNote).toBe(true);
});
