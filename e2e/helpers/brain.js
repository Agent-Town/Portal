const { expect } = require('@playwright/test');

async function saveLocalBrainConfig(page, {
  provider = 'openai',
  model = 'gpt-4o-mini',
  apiKey = 'test-openai-key',
  authMode = 'api-key',
  reasoning = '',
  useProxy
} = {}) {
  const normalizedUseProxy = typeof useProxy === 'boolean'
    ? useProxy
    : provider !== 'openrouter';
  await page.evaluate(async (config) => {
    const lib = await import('/openclaw-lite/llm-config-library.js');
    await lib.saveLlmConfig(config);
  }, {
    provider,
    model,
    apiKey,
    authMode,
    reasoning,
    useProxy: normalizedUseProxy
  });
}

async function completeBrainOnboarding(page) {
  const response = await page.request.post('/api/onboarding/brain/complete', {
    headers: { 'content-type': 'application/json' },
    data: JSON.stringify({})
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json().catch(() => ({}));
  expect(payload.ok).toBe(true);
  return payload;
}

async function configureBrain(page, options = {}) {
  const {
    refreshUi = true,
    reopen = null,
    ...config
  } = options || {};
  await saveLocalBrainConfig(page, config);
  const payload = await completeBrainOnboarding(page);
  if (refreshUi) {
    await page.reload();
    if (typeof reopen === 'function') {
      await reopen();
    }
  }
  return payload;
}

module.exports = {
  saveLocalBrainConfig,
  completeBrainOnboarding,
  configureBrain
};
