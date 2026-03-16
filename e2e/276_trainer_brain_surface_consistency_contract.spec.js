const { test, expect } = require('@playwright/test');

const { waitForLiteApi } = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('trainer and brain surfaces keep advanced controls disciplined across mobile and desktop', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
    localStorage.setItem('agentTown:panel:debugVisible', '1');
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app?liteDriver=phase1');
  await waitForLiteApi(page);
  await page.getByTestId('agent-open-trainer').click();
  await expect(page.getByTestId('trainer-root')).toBeVisible({ timeout: 10000 });

  const trainerMetrics = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="trainer-root"]');
    const hero = panel?.querySelector('.trainerHero');
    const toolbar = panel?.querySelector('[data-testid="trainer-action-row"]');
    const stack = panel?.querySelector('.trainerStack');
    const sections = panel ? panel.querySelectorAll('.trainerSectionCard').length : 0;
    const heroRect = hero?.getBoundingClientRect();
    const toolbarRect = toolbar?.getBoundingClientRect();
    const stackRect = stack?.getBoundingClientRect();
    return {
      sectionCount: sections,
      heroBottom: heroRect ? heroRect.bottom : 0,
      toolbarTop: toolbarRect ? toolbarRect.top : 0,
      toolbarBottom: toolbarRect ? toolbarRect.bottom : 0,
      stackTop: stackRect ? stackRect.top : 0,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    };
  });

  expect(trainerMetrics.sectionCount).toBeGreaterThanOrEqual(5);
  expect(trainerMetrics.heroBottom).toBeLessThanOrEqual(trainerMetrics.toolbarTop + 2);
  expect(trainerMetrics.toolbarBottom).toBeLessThanOrEqual(trainerMetrics.stackTop + 2);
  expect(trainerMetrics.documentWidth).toBeLessThanOrEqual(trainerMetrics.viewportWidth + 1);

  await page.locator('#trainerModalClose').click();
  await expect(page.locator('#trainerModalBackdrop')).toHaveClass(/is-hidden/);
  await expect(page.getByTestId('agent-panel')).toBeVisible({ timeout: 1500 });
  if (!(await page.getByTestId('agent-debug-pane').isVisible())) {
    await page.getByTestId('agent-debug-toggle').click();
  }
  await page.getByTestId('agent-debug-tab-brain').click();
  await expect(page.getByTestId('agent-debug-panel-brain')).not.toHaveClass(/is-hidden/);

  const mobileBrainMetrics = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="agent-debug-panel-brain"]');
    const heading = panel?.querySelector('.agent-mind-heading');
    const copy = panel?.querySelector('.agent-mind-copy');
    const grid = panel?.querySelector('.agent-mind-grid');
    const advanced = panel?.querySelector('[data-testid="lite-llm-advanced"]');
    const columns = grid ? String(getComputedStyle(grid).gridTemplateColumns || '').trim().split(/\s+/).filter(Boolean).length : 0;
    return {
      advancedOpen: advanced instanceof HTMLDetailsElement ? advanced.open : true,
      columns,
      headingFontPx: heading ? Number.parseFloat(getComputedStyle(heading).fontSize || '0') : 0,
      copyFontPx: copy ? Number.parseFloat(getComputedStyle(copy).fontSize || '0') : 0,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    };
  });

  expect(mobileBrainMetrics.advancedOpen).toBe(false);
  expect(mobileBrainMetrics.columns).toBe(1);
  expect(mobileBrainMetrics.headingFontPx).toBeGreaterThan(mobileBrainMetrics.copyFontPx);
  expect(mobileBrainMetrics.documentWidth).toBeLessThanOrEqual(mobileBrainMetrics.viewportWidth + 1);

  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.waitForTimeout(250);

  const desktopBrainMetrics = await page.evaluate(() => {
    const grid = document.querySelector('[data-testid="agent-debug-panel-brain"] .agent-mind-grid');
    const columns = grid ? String(getComputedStyle(grid).gridTemplateColumns || '').trim().split(/\s+/).filter(Boolean).length : 0;
    return {
      columns,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    };
  });

  expect(desktopBrainMetrics.columns).toBeGreaterThanOrEqual(2);
  expect(desktopBrainMetrics.documentWidth).toBeLessThanOrEqual(desktopBrainMetrics.viewportWidth + 1);
});
