const { test, expect } = require('@playwright/test');

const { waitForLiteApi } = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('town modal keeps shell chrome quiet and concentrates emphasis into one leading panel', async ({ page }) => {
  await page.goto('/app?liteDriver=phase1');
  await waitForLiteApi(page);

  await page.locator('[data-district="house"]').click();
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1);
  await expect(page.locator('#districtModalTitle')).toHaveText('Plan Wagons');

  const metrics = await page.evaluate(() => {
    const modal = document.querySelector('#districtModalBackdrop .districtModal');
    const header = modal?.querySelector('.districtModalHeader');
    const body = modal?.querySelector('.districtModalBody');
    const headerRect = header?.getBoundingClientRect();
    const bodyChildren = body ? Array.from(body.children) : [];
    const visiblePanels = bodyChildren.filter((node) => {
      if (!(node instanceof HTMLElement) || !node.classList.contains('panel')) return false;
      const rect = node.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > (headerRect?.bottom || 0);
    });
    const emphasizedPanels = visiblePanels.filter((node) => getComputedStyle(node).boxShadow !== 'none');
    return {
      headerHeight: headerRect ? headerRect.height : 0,
      modalHeight: modal ? modal.getBoundingClientRect().height : 0,
      visiblePanelCount: visiblePanels.length,
      emphasizedPanelCount: emphasizedPanels.length,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    };
  });

  expect(metrics.headerHeight).toBeGreaterThan(0);
  expect(metrics.modalHeight).toBeGreaterThan(0);
  expect(metrics.headerHeight / metrics.modalHeight).toBeLessThan(0.12);
  expect(metrics.visiblePanelCount).toBeGreaterThanOrEqual(2);
  expect(metrics.emphasizedPanelCount).toBe(1);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
});
