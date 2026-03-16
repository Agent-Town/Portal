const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  closeDesignLiveTable,
  closeDesignPage,
  openDesignCentaurTable,
  openDesignLiveTable,
} = require('./helpers/poker_design');

const PROVIDER_PATTERN = /\b(provider|model|openai|anthropic|claude|gpt|qwen|deepseek)\b/i;

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D5 provider neutrality: live table keeps provider metadata hidden and out of primary actions', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request, {
    viewport: { width: 1280, height: 960 },
  });

  try {
    const { page } = resources;
    const providerMeta = page.locator('[data-poker-section="worker-seat-agent"] [data-poker-support-kind="provider-meta"]');
    await expect(providerMeta).toHaveCount(1);
    await expect(providerMeta).toBeHidden();
    await expect(providerMeta).toHaveAttribute('aria-hidden', 'true');

    const primaryText = await page.locator('[data-poker-section="submit-action"]').textContent();
    const handText = await page.locator('[data-poker-section="current-hand"]').textContent();
    expect(primaryText || '').not.toMatch(PROVIDER_PATTERN);
    expect(handText || '').not.toMatch(PROVIDER_PATTERN);
  } finally {
    await closeDesignLiveTable(resources);
  }
});

test('D5 provider neutrality: centaur keeps provider metadata in supporting regions only', async ({ browser, request }) => {
  const resources = await openDesignCentaurTable(browser, request, {
    viewport: { width: 390, height: 844 },
  });

  try {
    const { page } = resources;
    const providerMeta = page.locator('[data-poker-section="centaur-summary"] [data-poker-support-kind="provider-meta"]');
    await expect(providerMeta).toHaveCount(1);
    await expect(providerMeta).toBeHidden();
    await expect(providerMeta).toHaveAttribute('aria-hidden', 'true');

    const primaryText = await page.locator('[data-poker-section="centaur-submit-action"]').textContent();
    const handText = await page.locator('[data-poker-section="centaur-live-hand"]').textContent();
    expect(primaryText || '').not.toMatch(PROVIDER_PATTERN);
    expect(handText || '').not.toMatch(PROVIDER_PATTERN);
  } finally {
    await closeDesignPage(resources);
  }
});
