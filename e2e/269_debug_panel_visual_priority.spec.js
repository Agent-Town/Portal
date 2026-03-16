const { test, expect } = require('@playwright/test');
const { ensureAppShell } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('town hub keeps the debug panel visually secondary while preserving access', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '1');
    localStorage.setItem('agentTown:panel:debugVisible', '0');
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await ensureAppShell(page);

  const metrics = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="agent-panel"]');
    const focusCard = document.querySelector('[data-testid="town-focus-card"]');
    const focusTitle = document.querySelector('[data-testid="town-focus-title"]');
    const panelTitle = document.querySelector('#agentSidebar .sidebar-header h3');
    const header = document.querySelector('#agentSidebar .sidebar-header');
    if (!(panel instanceof HTMLElement) || !(focusCard instanceof HTMLElement) || !(focusTitle instanceof HTMLElement) || !(panelTitle instanceof HTMLElement) || !(header instanceof HTMLElement)) {
      return null;
    }
    const visibleHeaderButtons = Array.from(header.querySelectorAll('button')).filter((node) => {
      if (!(node instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    const panelRect = panel.getBoundingClientRect();
    const focusRect = focusCard.getBoundingClientRect();
    const intersects = !(
      panelRect.right <= focusRect.left ||
      panelRect.left >= focusRect.right ||
      panelRect.bottom <= focusRect.top ||
      panelRect.top >= focusRect.bottom
    );
    return {
      shellPriority: panel.getAttribute('data-shell-priority'),
      panelWidth: Math.round(panelRect.width),
      panelHeight: Math.round(panelRect.height),
      rightGap: Math.round(window.innerWidth - panelRect.right),
      visibleHeaderButtons: visibleHeaderButtons.length,
      focusTitleSize: parseFloat(window.getComputedStyle(focusTitle).fontSize),
      panelTitleSize: parseFloat(window.getComputedStyle(panelTitle).fontSize),
      intersects,
      minimized: panel.classList.contains('minimized'),
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics.shellPriority).toBe('secondary');
  expect(metrics.minimized).toBe(true);
  expect(metrics.panelWidth).toBeLessThanOrEqual(280);
  expect(metrics.panelHeight).toBeLessThanOrEqual(56);
  expect(metrics.rightGap).toBeLessThanOrEqual(32);
  expect(metrics.visibleHeaderButtons).toBeLessThanOrEqual(1);
  expect(metrics.focusTitleSize).toBeGreaterThan(metrics.panelTitleSize);
  expect(metrics.intersects).toBe(false);

  await page.locator('#agentSidebar .sidebar-header').click();
  await expect.poll(async () => {
    return page.locator('#agentSidebar').evaluate((node) => node.classList.contains('minimized'));
  }).toBe(false);
});
