const { test, expect } = require('@playwright/test');
const { reset, fixturePath } = require('./helpers/avatar');

test.beforeEach(async ({ request }) => {
  await reset(request);
});

test('lab desktop: avatar mode upload -> preview loop', async ({ page }) => {
  await page.goto('/lab');

  await page.setInputFiles('#labFile', fixturePath('good_full.png'));
  await page.getByTestId('lab-generate-btn').click();

  await expect(page.getByTestId('lab-avatar-preview')).toBeVisible();
  await expect(page.getByTestId('a-prev-se')).toBeVisible();

  const debug = page.getByTestId('lab-avatar-debug');
  await expect(debug).toContainText('walk(se) frame=');

  const t1 = await debug.textContent();
  await page.waitForTimeout(350);
  const t2 = await debug.textContent();
  expect(t2).not.toBe(t1);
});

test.describe('lab mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('lab mobile: static mode upload -> sprite + manifest', async ({ page }) => {
    await page.goto('/lab');

    await page.getByTestId('mode-static').click();
    await expect(page.getByTestId('static-options')).toBeVisible();

    // Ranges: set values deterministically and trigger UI updates.
    await page.$eval('#footW', (el) => {
      el.value = '2';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.$eval('#footH', (el) => {
      el.value = '1';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.$eval('#pixelateTo', (el) => {
      el.value = '64';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.$eval('#quantBits', (el) => {
      el.value = '4';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await page.setInputFiles('#labFile', fixturePath('good_full.png'));
    await page.getByTestId('lab-generate-btn').click();

    await expect(page.getByTestId('lab-static-preview')).toBeVisible();
    await expect(page.getByTestId('s-prev')).toBeVisible();

    const txt = await page.getByTestId('static-manifest').textContent();
    expect(txt).toBeTruthy();
    const manifest = JSON.parse(txt);

    expect(manifest.kind).toBe('agent-town-static-asset-pack');
    expect(manifest.assetKind).toBe('prop');
    expect(manifest.projection.kind).toBe('iso-2:1');
    expect(manifest.tileFootprint.w).toBe(2);
    expect(manifest.tileFootprint.h).toBe(1);
    expect(manifest.options.pixelateTo).toBe(64);
    expect(manifest.options.quantizeBits).toBe(4);
    expect(manifest.pivot.origin[0]).toBe(0.5);
    expect(manifest.pivot.origin[1]).toBe(1);
  });
});

