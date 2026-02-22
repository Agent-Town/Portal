const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  openTrainerFromSidebar,
  openTrainerToolsTab,
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function invokeTool(page, toolName, params = {}) {
  const resultNode = page.getByTestId('trainer-tool-result');
  const beforeText = String((await resultNode.textContent()) || '');
  await page.getByTestId('trainer-tool-name').selectOption(toolName);
  await page.getByTestId('trainer-tool-params').fill(JSON.stringify(params, null, 2));
  await page.getByTestId('trainer-tool-invoke').click();
  await expect.poll(async () => {
    const current = String((await resultNode.textContent()) || '');
    return current.length > 0 && current !== beforeText;
  }, { timeout: 6000 }).toBe(true);
  await expect(resultNode).toContainText(`"tool": "${toolName}"`, { timeout: 5000 });
  return await page.evaluate(() => {
    const node = document.getElementById('trainerToolResult');
    return node ? JSON.parse(String(node.textContent || '{}')) : null;
  });
}

test('trainer namespace enforces rate limits and blocks recursive dispatch attempts deterministically', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  const perTurnPolicy = {
    maxTrainerCallsPerTurn: 2,
    maxTrainerCallsPerMinute: 50,
    minuteWindowMs: 60000,
  };
  const perTurnNowBase = Date.now();

  const t1 = await invokeTool(page, 'trainer.list_runs', {
    limit: 5,
    __turnKey: 'turn-A',
    __policy: perTurnPolicy,
    __nowMs: perTurnNowBase,
  });
  expect(t1?.ok).toBe(true);

  const t2 = await invokeTool(page, 'trainer.list_runs', {
    limit: 5,
    __turnKey: 'turn-A',
    __policy: perTurnPolicy,
    __nowMs: perTurnNowBase + 1,
  });
  expect(t2?.ok).toBe(true);

  const t3 = await invokeTool(page, 'trainer.list_runs', {
    limit: 5,
    __turnKey: 'turn-A',
    __policy: perTurnPolicy,
    __nowMs: perTurnNowBase + 2,
  });
  expect(t3?.ok).toBe(false);
  expect(String(t3?.code || '')).toBe('TRAINER_RATE_LIMITED');

  const nextTurn = await invokeTool(page, 'trainer.list_runs', {
    limit: 5,
    __turnKey: 'turn-B',
    __policy: perTurnPolicy,
    __nowMs: perTurnNowBase + 3,
  });
  expect(nextTurn?.ok).toBe(true);

  await page.evaluate(() => {
    if (window.AgentTownTrainerNamespacePlugin && typeof window.AgentTownTrainerNamespacePlugin.resetState === 'function') {
      window.AgentTownTrainerNamespacePlugin.resetState();
    }
  });

  const minutePolicy = {
    maxTrainerCallsPerTurn: 50,
    maxTrainerCallsPerMinute: 1,
    minuteWindowMs: 40,
  };
  const minuteNowBase = Date.now() + 1000;

  const minute1 = await invokeTool(page, 'trainer.list_runs', {
    limit: 5,
    __turnKey: 'minute-turn',
    __policy: minutePolicy,
    __nowMs: minuteNowBase,
  });
  expect(minute1?.ok).toBe(true);

  const minuteBlocked = await invokeTool(page, 'trainer.list_runs', {
    limit: 5,
    __turnKey: 'minute-turn',
    __policy: minutePolicy,
    __nowMs: minuteNowBase + 10,
  });
  expect(minuteBlocked?.ok).toBe(false);
  expect(String(minuteBlocked?.code || '')).toBe('TRAINER_RATE_LIMITED');

  const minuteReset = await invokeTool(page, 'trainer.list_runs', {
    limit: 5,
    __turnKey: 'minute-turn',
    __policy: minutePolicy,
    __nowMs: minuteNowBase + 55,
  });
  expect(minuteReset?.ok).toBe(true);

  const recursionProbe = await page.evaluate(async () => {
    const plugin = window.AgentTownTrainerNamespacePlugin;
    if (!plugin || typeof plugin.invokeTool !== 'function') return null;
    let nested = null;
    const outer = await plugin.invokeTool({
      toolName: 'trainer.list_runs',
      params: {
        limit: 1,
        __turnKey: 'rec-outer',
        __policy: {
          maxTrainerCallsPerTurn: 10,
          maxTrainerCallsPerMinute: 10,
          minuteWindowMs: 60000,
        },
      },
      gatewayApi: {
        trainerListAttempts: async () => {
          nested = await plugin.invokeTool({
            toolName: 'trainer.list_runs',
            params: {
              limit: 1,
              __turnKey: 'rec-inner',
              __policy: {
                maxTrainerCallsPerTurn: 10,
                maxTrainerCallsPerMinute: 10,
                minuteWindowMs: 60000,
              },
            },
            gatewayApi: {
              trainerListAttempts: async () => ({ ok: true, data: { attempts: [] } }),
            },
          });
          return { ok: true, data: { attempts: [] } };
        },
      },
    });
    return { outer, nested };
  });

  expect(recursionProbe && typeof recursionProbe === 'object').toBeTruthy();
  expect(recursionProbe?.outer?.ok).toBe(true);
  expect(recursionProbe?.nested?.ok).toBe(false);
  expect(String(recursionProbe?.nested?.code || '')).toBe('TRAINER_RECURSION_BLOCKED');
});
