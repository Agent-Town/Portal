const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const { attachHouseToPageSession } = require('./helpers/unified_platform');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

function visiblePrimaryActionCount(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll('[data-zhc-primary-action="true"]')].filter((node) => {
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }).length;
  });
}

async function bootstrapFoundersReady(request) {
  const response = await request.post('/__test__/session/bootstrap-onboarding', {
    headers: { 'x-test-reset': resetToken },
    data: {
      step: 'done',
      profile: {
        humanName: 'Robin',
        agentName: 'OpenClaw',
      },
    },
  });
  expect(response.ok()).toBeTruthy();
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M44.5 house first entry stays in the /app modal shell and frames House as HQ', async ({ page, request }) => {
  await bootstrapFoundersReady(page.request);
  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
  });
  expect(attached.status).toBe(200);

  await page.reload();
  await waitForLiteApi(page);

  const root = page.getByTestId('zhc-house-hq-surface');
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute('data-zhc-phase', 'house_ready');
  await expect(root).toHaveAttribute('data-zhc-progress-step', '6');
  await expect(root).toHaveAttribute('data-zhc-progress-total', '9');
  await expect(root).toHaveAttribute('data-zhc-overlay-state', 'ready');
  await expect(root).toHaveAttribute('data-zhc-next-unlock', 'first_mission');
  await expect(root).toContainText(/headquarters/i);
  await expect(root).toContainText(/modal/i);

  await expect(page.getByTestId('zhc-house-room-mission')).toContainText(/mission lane/i);
  await expect(page.getByTestId('zhc-house-room-memory')).toContainText(/memory/i);
  await expect(page.getByTestId('zhc-house-room-workshop')).toContainText(/workshop/i);
  await expect(page.getByTestId('zhc-house-room-mailroom')).toContainText(/mailroom/i);

  const primary = page.getByTestId('house-hq-start-mission');
  await expect(primary).toBeVisible();
  await expect(primary).toHaveAttribute('data-zhc-primary-action', 'true');
  expect(await visiblePrimaryActionCount(page)).toBe(1);

  await expect(root).not.toContainText('Open Archive');
  await expect(root).not.toContainText('Open Trainer');
  await expect(page.getByTestId('house-console-panel')).toContainText('Later-loop / deep ops');

  await primary.click();
  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();
});
