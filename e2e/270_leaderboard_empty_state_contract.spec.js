const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');

const VIEWPORTS = [
  { label: 'mobile', width: 390, height: 844 },
  { label: 'tablet', width: 834, height: 1112 },
  { label: 'desktop', width: 1440, height: 1200 },
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('leaderboard empty state keeps one focal message while support metrics stay secondary', async ({ page }) => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/leaderboard');

    const panel = page.getByTestId('leaderboard-panel');
    const statRail = page.getByTestId('leaderboard-stat-rail');
    const emptyState = page.getByTestId('leaderboard-empty-state');
    const emptyTitle = page.getByTestId('leaderboard-empty-title');
    const actionRow = page.getByTestId('leaderboard-empty-actions');

    await expect(panel).toBeVisible();
    await expect(statRail).toBeVisible();
    await expect(emptyState).toBeVisible();
    await expect(emptyTitle).toContainText('No public teams yet.');
    await expect(actionRow).toContainText('Open Plan Wagons');
    await expect(actionRow).toContainText('See Town Map');
    await expect(page.getByTestId('leaderboard-list').locator(':scope > *')).toHaveCount(0);

    const metrics = await page.evaluate(() => {
      const panelNode = document.querySelector('[data-testid="leaderboard-panel"]');
      const emptyNode = document.querySelector('[data-testid="leaderboard-empty-state"]');
      const titleNode = document.querySelector('[data-testid="leaderboard-empty-title"]');
      const railNode = document.querySelector('[data-testid="leaderboard-stat-rail"]');
      const pillNode = document.querySelector('[data-testid="leaderboard-signup-count"]');
      if (!(panelNode instanceof HTMLElement) || !(emptyNode instanceof HTMLElement) || !(titleNode instanceof HTMLElement) || !(railNode instanceof HTMLElement) || !(pillNode instanceof HTMLElement)) {
        return null;
      }
      const panelRect = panelNode.getBoundingClientRect();
      const emptyRect = emptyNode.getBoundingClientRect();
      const railRect = railNode.getBoundingClientRect();
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        panelCenterX: panelRect.left + (panelRect.width / 2),
        emptyCenterX: emptyRect.left + (emptyRect.width / 2),
        emptyTop: emptyRect.top,
        railBottom: railRect.bottom,
        panelEmpty: panelNode.classList.contains('is-empty'),
        titleFontSize: Number.parseFloat(window.getComputedStyle(titleNode).fontSize || '0'),
        pillFontSize: Number.parseFloat(window.getComputedStyle(pillNode).fontSize || '0'),
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics.panelEmpty).toBe(true);
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(Math.abs(metrics.emptyCenterX - metrics.panelCenterX)).toBeLessThanOrEqual(12);
    expect(metrics.emptyTop).toBeGreaterThan(metrics.railBottom + 12);
    expect(metrics.titleFontSize).toBeGreaterThan(metrics.pillFontSize);
  }
});
