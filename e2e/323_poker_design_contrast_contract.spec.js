const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');

function parseRgb(value) {
  const match = String(value || '').trim().match(/^#([0-9a-f]{6})$/i);
  if (match) {
    const hex = match[1];
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }
  throw new Error(`UNSUPPORTED_COLOR:${value}`);
}

function luminance(channel) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function contrastRatio(a, b) {
  const l1 = 0.2126 * luminance(a.r) + 0.7152 * luminance(a.g) + 0.0722 * luminance(a.b);
  const l2 = 0.2126 * luminance(b.r) + 0.7152 * luminance(b.g) + 0.0722 * luminance(b.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D4 accessibility: poker design tokens preserve readable text contrast on core surfaces', async ({ page }) => {
  await page.goto('/poker/play?embed=1');

  const tokens = await page.evaluate(() => {
    const root = window.getComputedStyle(document.documentElement);
    return {
      textPrimary: root.getPropertyValue('--poker-text-primary').trim(),
      textInverse: root.getPropertyValue('--poker-text-inverse').trim(),
      surface1: root.getPropertyValue('--poker-surface-1').trim(),
      accentGold: root.getPropertyValue('--poker-accent-gold').trim(),
    };
  });

  const textOnSurface = contrastRatio(parseRgb(tokens.textPrimary), parseRgb(tokens.surface1));
  const primaryButton = contrastRatio(parseRgb(tokens.textInverse), parseRgb(tokens.accentGold));

  expect(textOnSurface).toBeGreaterThanOrEqual(7);
  expect(primaryButton).toBeGreaterThanOrEqual(4.5);
});
