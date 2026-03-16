const { test, expect } = require('@playwright/test');
const { ensureAppShell } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('mobile town hub keeps the primary action clear of the dock and within the clutter budget', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '1');
    localStorage.setItem('agentTown:panel:debugVisible', '0');
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await ensureAppShell(page);

  const primaryAction = page.getByTestId('town-primary-action');
  await expect(primaryAction).toBeVisible();

  const metrics = await page.evaluate(() => {
    const countLandingClutter = () => {
      const isVisible = (node) => {
        if (!(node instanceof HTMLElement)) return false;
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
      const selectors = [
        'button',
        '[role="button"]',
        'a[href]',
        'input:not([type="hidden"])',
        'select',
        'textarea',
      ];
      const nodes = Array.from(document.querySelectorAll(selectors.join(',')));
      return nodes.filter((node) => {
        if (!isVisible(node)) return false;
        if (node.closest('#agentSidebar')) return false;
        if (node.closest('[data-testid="agent-panel"]')) return false;
        if (node.closest('#districtModalBackdrop')) return false;
        if (node.closest('[data-testid="trainer-modal"]')) return false;
        if (node.closest('.townDistrictHotspot')) return false;
        return true;
      }).length;
    };
    const primary = document.querySelector('[data-testid="town-primary-action"]');
    const focusCard = document.querySelector('[data-testid="town-focus-card"]');
    const panel = document.getElementById('agentSidebar');
    if (!(primary instanceof HTMLElement) || !(focusCard instanceof HTMLElement) || !(panel instanceof HTMLElement)) {
      return null;
    }
    const primaryRect = primary.getBoundingClientRect();
    const focusRect = focusCard.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    return {
      clutterCount: countLandingClutter(),
      primaryHeight: Math.round(primaryRect.height),
      primaryWidth: Math.round(primaryRect.width),
      focusBottom: Math.round(focusRect.bottom),
      panelTop: Math.round(panelRect.top),
      focusTop: Math.round(focusRect.top),
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics.clutterCount).toBeLessThanOrEqual(2);
  expect(metrics.primaryHeight).toBeGreaterThanOrEqual(44);
  expect(metrics.primaryWidth).toBeGreaterThanOrEqual(44);
  expect(metrics.focusBottom).toBeLessThanOrEqual(metrics.panelTop + 2);
  expect(metrics.focusTop).toBeGreaterThanOrEqual(12);
});
