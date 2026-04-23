const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('platform routes point at the latest promoted production art pack', async ({ page, request }) => {
  const startHtml = await request.get('/start.html').then((response) => response.text());
  const townhallHtml = await request.get('/views/townhall.html').then((response) => response.text());
  const brainHtml = await request.get('/views/brain.html').then((response) => response.text());
  const styles = await request.get('/styles.css').then((response) => response.text());

  expect(startHtml).toContain('/assets/platform/start_gate/start-gate-hero-v1_4_3.webp');
  expect(startHtml).toContain('/assets/hero-cast/prairie-dog-ranger.webp');
  expect(startHtml).toContain('/assets/hero-cast/sheriff-lobster.webp');
  expect(startHtml).toContain('/assets/hero-cast/chibi-homesteader.webp');
  expect(startHtml).toContain('/assets/hero-cast/wizard-kid.webp');
  expect(townhallHtml).toContain('/assets/platform/townhall/townhall-onboarding-illustration-v1_4_3.webp');
  expect(brainHtml).toContain('/assets/platform/brain/brain-connect-illustration-v1_4_3.webp');
  expect(styles).toContain('/assets/platform/town_shell/town-shell-background-v1_4_3.webp');
  expect(styles).toContain('/assets/hero-cast/hero-cast-group.webp');
  expect(styles).not.toContain('url("/agenttown.jpeg")');
  expect(styles).not.toContain('/assets/platform/town-shell-background-v1_4_2.webp');

  await page.goto('/start.html');
  await expect(page.locator('#startHeroPoster')).toHaveAttribute('src', '/assets/platform/start_gate/start-gate-hero-v1_4_3.webp');
  await expect(page.getByTestId('hero-cast-card-prairie-dog')).toBeVisible();
  await expect(page.getByTestId('hero-cast-card-sheriff-lobster')).toBeVisible();
  await expect(page.getByTestId('hero-cast-card-chibi-homesteader')).toBeVisible();
  await expect(page.getByTestId('hero-cast-card-wizard-kid')).toBeVisible();
  const startWrapBackground = await page.locator('.startWrap').evaluate((node) => window.getComputedStyle(node).backgroundImage);
  expect(startWrapBackground).toContain('/assets/platform/start_gate/start-gate-hero-v1_4_3.webp');
});
