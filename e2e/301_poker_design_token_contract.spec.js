const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D0 token contract: lobby exposes token-backed shell and distinct action roles', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: 'So1anaMockDesignToken111111111111111111111111',
    houseId: 'house_design_token',
  });

  await page.goto('/poker/play?embed=1');

  await expect(page.locator('body[data-poker-view="play-lobby"]')).toBeVisible();
  await expect(page.locator('[data-poker-section="quick-seat"]')).toBeVisible();

  const tokenSnapshot = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      surface0: styles.getPropertyValue('--poker-surface-0').trim(),
      textPrimary: styles.getPropertyValue('--poker-text-primary').trim(),
      accent: styles.getPropertyValue('--poker-accent-gold').trim(),
      fontUi: styles.getPropertyValue('--poker-font-ui').trim(),
    };
  });

  expect(tokenSnapshot.surface0).toBe('#0b1014');
  expect(tokenSnapshot.textPrimary).toBe('#f4ecdc');
  expect(tokenSnapshot.accent).toBe('#d6aa63');
  expect(tokenSnapshot.fontUi).toContain('PingFang SC');

  const joinButton = page.locator('#pokerPlayMatchmakeForm button[type="submit"]');
  const navLink = page.getByRole('link', { name: 'Tournament Schedule' });
  const policyDrawer = page.locator('[data-poker-section="poker-policy"] details[data-poker-detail-level="advanced"]');
  await policyDrawer.locator('summary').click();
  const dangerButton = page.getByRole('button', { name: 'Self-Exclude 24h' });

  await expect(joinButton).toHaveAttribute('data-action-role', 'primary');
  await expect(navLink).toHaveAttribute('data-action-role', 'navigation');
  await expect(dangerButton).toHaveAttribute('data-action-role', 'destructive');

  const roleStyles = await page.evaluate(() => {
    const primary = document.querySelector('button[data-action-role="primary"]');
    const nav = document.querySelector('a[data-action-role="navigation"]');
    const danger = document.querySelector('button[data-action-role="destructive"]');
    return {
      primary: window.getComputedStyle(primary).backgroundColor,
      nav: window.getComputedStyle(nav).backgroundColor,
      danger: window.getComputedStyle(danger).backgroundColor,
      primaryClass: primary.className,
      navClass: nav.className,
      dangerClass: danger.className,
    };
  });

  expect(roleStyles.primaryClass).toContain('pokerButtonPrimary');
  expect(roleStyles.navClass).toContain('pokerButtonNav');
  expect(roleStyles.dangerClass).toContain('pokerButtonDanger');
  expect(roleStyles.primary).not.toBe(roleStyles.nav);
  expect(roleStyles.primary).not.toBe(roleStyles.danger);

  await context.close();
});
