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

test('M44.6 house first entry turns naming into one concise shared move before Mission', async ({ page, request }) => {
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
  const input = page.getByTestId('house-hq-name-input');
  const primary = page.getByTestId('house-hq-start-mission');
  const preview = page.getByTestId('house-hq-name-preview');

  await expect(root).toBeVisible();
  await expect(page.getByTestId('house-hq-human-proposal')).toContainText('Robin');
  await expect(page.getByTestId('house-hq-agent-proposal')).toContainText('OpenClaw');

  const humanWord = String(await page.locator('#houseHqHumanWord').textContent() || '').trim();
  const agentWord = String(await page.locator('#houseHqAgentWord').textContent() || '').trim();
  const suggestedName = `${humanWord} ${agentWord}`.trim();

  await expect(preview).toHaveText(suggestedName);
  await expect(input).toHaveValue(suggestedName);
  await expect(primary).toHaveText('Name HQ and open mission');
  await expect(primary).toHaveAttribute('data-zhc-primary-action', 'true');
  expect(await visiblePrimaryActionCount(page)).toBe(1);

  const customName = `Shared ${agentWord}`;
  await input.fill(customName);
  await primary.click();

  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();

  await page.reload();
  await waitForLiteApi(page);

  await expect(root).toBeVisible();
  await expect(preview).toHaveText(customName);
  await expect(input).toHaveValue(customName);
  await expect(primary).toHaveText('Open mission');
  expect(await visiblePrimaryActionCount(page)).toBe(1);

  await primary.click();
  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();
});
