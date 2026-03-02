const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function readPanelScrollMetrics(page) {
  return page.evaluate(() => {
    const sidebar = document.getElementById('agentSidebar');
    const panels = Array.from(document.querySelectorAll('.panel'));
    const lastPanel = panels.length ? panels[panels.length - 1] : null;
    if (!sidebar || !lastPanel) return null;
    const panelHeight = Math.round(sidebar.getBoundingClientRect().height);
    const bodyPaddingBottom = Math.round(parseFloat(getComputedStyle(document.body).paddingBottom) || 0);
    window.scrollTo(0, document.documentElement.scrollHeight);
    const panelRect = sidebar.getBoundingClientRect();
    const lastPanelRect = lastPanel.getBoundingClientRect();
    return {
      bodyPaddingBottom,
      panelHeight,
      panelTop: Math.round(panelRect.top),
      lastPanelBottom: Math.round(lastPanelRect.bottom),
      scrollY: Math.round(window.scrollY),
    };
  });
}

test('expanded agent panel reserves scroll inset on /house', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await page.goto('/house');
  await expect(page.getByTestId('agent-panel')).toBeVisible({ timeout: 2000 });

  const metrics = await readPanelScrollMetrics(page);
  expect(metrics).not.toBeNull();
  expect(metrics.bodyPaddingBottom).toBeGreaterThanOrEqual(metrics.panelHeight - 2);
  expect(metrics.scrollY).toBeGreaterThan(0);
  expect(metrics.lastPanelBottom).toBeLessThanOrEqual(metrics.panelTop + 2);
});

test('expanded agent panel reserves scroll inset on /inbox route', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await page.goto('/inbox/test-house');
  await expect(page.getByTestId('agent-panel')).toBeVisible({ timeout: 2000 });

  const metrics = await readPanelScrollMetrics(page);
  expect(metrics).not.toBeNull();
  expect(metrics.bodyPaddingBottom).toBeGreaterThanOrEqual(metrics.panelHeight - 2);
  expect(metrics.scrollY).toBeGreaterThan(0);
  expect(metrics.lastPanelBottom).toBeLessThanOrEqual(metrics.panelTop + 2);
});
