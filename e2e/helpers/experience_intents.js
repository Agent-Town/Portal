const { waitForLiteApi, setDeterministicLlm, visitSkill } = require('./trainer');

async function bootstrapExperienceIntentHarness(page, { path = '/app?liteDriver=phase1&trainerNamespace=1' } = {}) {
  await page.goto(path);
  await waitForLiteApi(page);
  await setDeterministicLlm(page);
  return await visitSkill(page, '/skill.md');
}

async function invokeExperienceTool(page, tool, params = {}) {
  return await page.evaluate(async ({ toolName, toolParams }) => {
    const api = window.__openclawLiteTest;
    if (!api || typeof api.invokeExperienceTool !== 'function') {
      return {
        ok: false,
        applied: false,
        stateSnapshot: null,
        error: {
          code: 'EXPERIENCE_TOOL_BRIDGE_MISSING',
          message: 'window.__openclawLiteTest.invokeExperienceTool is not available'
        }
      };
    }
    try {
      return await api.invokeExperienceTool({ tool: toolName, params: toolParams || {} });
    } catch (err) {
      return {
        ok: false,
        applied: false,
        stateSnapshot: null,
        error: {
          code: 'EXPERIENCE_TOOL_THROW',
          message: String(err?.message || err || 'invokeExperienceTool failed')
        }
      };
    }
  }, { toolName: String(tool || ''), toolParams: params || {} });
}

async function readSessionState(page) {
  return await page.evaluate(async () => {
    const resp = await fetch('/api/state', { credentials: 'include' });
    return await resp.json().catch(() => ({}));
  });
}

async function readPathname(page) {
  return await page.evaluate(() => window.location.pathname);
}

async function readExperienceIntentTrace(page) {
  return await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    if (!api || typeof api.getExperienceToolTrace !== 'function') return null;
    try {
      return await api.getExperienceToolTrace();
    } catch {
      return null;
    }
  });
}

module.exports = {
  bootstrapExperienceIntentHarness,
  invokeExperienceTool,
  readExperienceIntentTrace,
  readPathname,
  readSessionState
};
