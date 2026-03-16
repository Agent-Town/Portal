const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.describe('agent dock quiet-state design contract', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('minimized dock keeps short controls and a compact mobile footprint', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByTestId('agent-panel')).toBeVisible();

    const labels = (await page.locator('#agentSidebar .sidebar-header-actions button').allTextContents())
      .map((value) => value.trim())
      .filter(Boolean);
    expect(labels).toEqual(['Debug', 'Small', 'Large', 'Open']);
    expect(labels.every((value) => value.length <= 7)).toBe(true);

    const metrics = await page.evaluate(() => {
      const panel = document.getElementById('agentSidebar');
      const header = panel?.querySelector('.sidebar-header');
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        panelHeight: panel ? panel.getBoundingClientRect().height : 0,
        headerFits: header ? header.scrollWidth <= header.clientWidth + 1 : false,
      };
    });

    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.headerFits).toBe(true);
    expect(metrics.panelHeight / metrics.viewportHeight).toBeLessThan(0.08);
  });

  test('expanded dock stays within mobile bounds without clipped header controls', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('agentTown:panel:minimized', '0');
      localStorage.setItem('agentTown:panel:debugVisible', '1');
    });

    await page.goto('/app');
    await expect(page.getByTestId('agent-panel')).toBeVisible();
    await expect(page.getByTestId('agent-debug-pane')).toBeVisible();

    const metrics = await page.evaluate(() => {
      const panel = document.getElementById('agentSidebar');
      const header = panel?.querySelector('.sidebar-header');
      const actions = panel?.querySelector('.sidebar-header-actions');
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        panelClientWidth: panel ? panel.clientWidth : 0,
        panelScrollWidth: panel ? panel.scrollWidth : 0,
        headerFits: header ? header.scrollWidth <= header.clientWidth + 1 : false,
        actionsFits: actions ? actions.scrollWidth <= actions.clientWidth + 1 : false,
      };
    });

    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.panelScrollWidth).toBeLessThanOrEqual(metrics.panelClientWidth + 1);
    expect(metrics.headerFits).toBe(true);
    expect(metrics.actionsFits).toBe(true);
  });
});
