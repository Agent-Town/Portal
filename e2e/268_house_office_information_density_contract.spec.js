const { test, expect } = require('@playwright/test');

const { waitForLiteApi } = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('house office overview reads before operational detail and uses standardized sections', async ({ page }) => {
  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await expect(page.getByTestId('house-office-hero')).toBeVisible();
  await expect(page.getByTestId('house-office-overview-grid')).toBeVisible();

  const sectionTitles = await page.locator('#houseOfficePanel .houseOfficeSectionTitle').allTextContents();
  expect(sectionTitles.map((value) => value.trim())).toEqual([
    'Selected Office',
    'Office Map',
    'Presence',
    'What Changed',
    'Needs Follow-Up',
    'Staff Assignments',
    'Installed Helpers',
    'Friend Links',
    'Active Helper Sessions',
  ]);

  const metrics = await page.evaluate(() => {
    const hero = document.querySelector('[data-testid="house-office-hero"]');
    const overview = document.querySelector('[data-testid="house-office-overview-grid"]');
    const firstSection = document.querySelector('#houseOfficePanel .houseOfficeSection');
    const root = document.documentElement;
    return {
      heroTop: hero?.getBoundingClientRect().top || 0,
      overviewTop: overview?.getBoundingClientRect().top || 0,
      firstSectionTop: firstSection?.getBoundingClientRect().top || 0,
      viewportWidth: window.innerWidth,
      documentWidth: root.scrollWidth,
    };
  });

  expect(metrics.heroTop).toBeLessThan(metrics.overviewTop);
  expect(metrics.overviewTop).toBeLessThan(metrics.firstSectionTop);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
});
