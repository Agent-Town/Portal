const { test, expect } = require('@playwright/test');
const { getOpenFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

function rateLimitFixture({ primary = 19, secondary = 4 } = {}) {
  const now = Date.now();
  return {
    rateLimits: {
      limitId: 'codex',
      limitName: 'Codex',
      primary: {
        usedPercent: primary,
        windowDurationMins: 300,
        resetsAt: now + 2 * 60 * 60 * 1000
      },
      secondary: {
        usedPercent: secondary,
        windowDurationMins: 10080,
        resetsAt: now + 5 * 24 * 60 * 60 * 1000
      },
      credits: {
        hasCredits: false,
        unlimited: false,
        balance: '0'
      },
      planType: 'pro',
      rateLimitReachedType: null
    },
    rateLimitsByLimitId: {
      codex: {
        limitId: 'codex',
        limitName: 'Codex',
        primary: {
          usedPercent: primary,
          windowDurationMins: 300,
          resetsAt: now + 2 * 60 * 60 * 1000
        },
        secondary: {
          usedPercent: secondary,
          windowDurationMins: 10080,
          resetsAt: now + 5 * 24 * 60 * 60 * 1000
        },
        credits: {
          hasCredits: false,
          unlimited: false,
          balance: '0'
        },
        planType: 'pro',
        rateLimitReachedType: null
      }
    }
  };
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Codex app-server bridge feeds the Clover budget UI and persists allocation', async ({ page, request }) => {
  await request.post('/__test__/codex-app-server/rate-limits', {
    headers: { 'x-test-reset': resetToken },
    data: { fixture: rateLimitFixture({ primary: 19, secondary: 4 }) }
  });

  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);
  await frame.getByTestId('founders-clover-avatar').click();
  await expect(frame.getByTestId('codex-budget-card')).toBeVisible();

  await frame.evaluate(async () => {
    return await window.__foundersPlotTest.refreshCodexBudgetStatus();
  });

  await expect(frame.getByTestId('codex-budget-source')).toContainText('Codex app-server');
  await expect(frame.getByTestId('codex-budget-five-hour-status')).toContainText('subscription 19%');
  await expect(frame.getByTestId('codex-budget-weekly-status')).toContainText('subscription 4%');

  await frame.getByTestId('codex-budget-five-hour-percent').fill('7');
  await frame.getByTestId('codex-budget-weekly-percent').fill('13');
  await frame.getByTestId('codex-budget-save').click();

  await expect.poll(async () => {
    return await frame.evaluate(() => window.__foundersPlotTest.getCodexBudgetStatus()?.settings);
  }, { timeout: 5000 }).toMatchObject({
    fiveHourPercent: 7,
    weeklyPercent: 13
  });

  await page.reload();
  const reloadedFrame = await getOpenFoundersPlotFrame(page);
  await reloadedFrame.getByTestId('founders-clover-avatar').click();
  await expect(reloadedFrame.getByTestId('codex-budget-five-hour-percent')).toHaveValue('7');
  await expect(reloadedFrame.getByTestId('codex-budget-weekly-percent')).toHaveValue('13');
});

test('Codex app-server failure shows local-only budgeting guidance', async ({ page, request }) => {
  await request.post('/__test__/codex-app-server/rate-limits', {
    headers: { 'x-test-reset': resetToken },
    data: {
      fixture: {
        ok: false,
        status: 503,
        error: 'CODEX_APP_SERVER_UNAVAILABLE',
        message: 'Codex app-server is not running.'
      }
    }
  });

  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);
  await frame.getByTestId('founders-clover-avatar').click();

  await frame.evaluate(async () => {
    return await window.__foundersPlotTest.refreshCodexBudgetStatus();
  });

  await expect(frame.getByTestId('codex-budget-source')).toContainText('Local budget only');
  await expect(frame.getByTestId('codex-budget-warning')).toContainText('Open Codex');
  await expect(frame.getByTestId('codex-budget-save')).toBeEnabled();
});

test('OpenClaw Lite blocks a Clover LLM turn before exceeding the ChatGPT game budget', async ({ page, request }) => {
  await request.post('/__test__/codex-app-server/rate-limits', {
    headers: { 'x-test-reset': resetToken },
    data: { fixture: rateLimitFixture({ primary: 12, secondary: 6 }) }
  });

  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);

  const outcome = await frame.evaluate(async () => {
    await window.__foundersPlotTest.saveBrainConfigForTest({
      provider: 'openai-codex',
      model: 'gpt-5.3-codex',
      apiKey: 'test-chatgpt-token',
      authMode: 'oauth-json',
      useProxy: true
    });
    await window.__foundersPlotTest.setCodexBudgetForTest({
      settings: {
        enabled: true,
        fiveHourPercent: 1,
        weeklyPercent: 10,
        perTurnPercent: 1
      },
      ledger: {
        events: [{
          spentAtMs: Date.now(),
          amountPercent: 1,
          source: 'test-existing-turn'
        }]
      },
      refresh: true
    });
    await window.__foundersPlotTest.startForemanRuntime();
    try {
      await window.__foundersPlotTest.runForemanTick();
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: String(error?.message || ''),
        status: window.__foundersPlotTest.getCodexBudgetStatus()
      };
    }
  });

  expect(outcome.ok).toBe(false);
  expect(outcome.message).toBe('CODEX_BUDGET_EXCEEDED');
  expect(outcome.status?.limits?.fiveHourWouldExceed).toBe(true);
});
