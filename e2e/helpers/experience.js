const EXPERIENCE_PRESETS = Object.freeze({
  'global-default': Object.freeze({
    presetId: 'global-default',
    locale: 'en',
    market: 'global',
    providerPolicy: 'global-default',
    sharePolicy: 'x-moltbook',
    mediaPolicy: 'youtube',
    agentPolicy: 'default',
  }),
  'cn-mainland': Object.freeze({
    presetId: 'cn-mainland',
    locale: 'zh-CN',
    market: 'cn-mainland',
    providerPolicy: 'cn-mainland',
    sharePolicy: 'link-first',
    mediaPolicy: 'mainland-safe',
    agentPolicy: 'avoid-blocked-services',
  }),
});

function buildPreference(presetId = 'global-default') {
  const preset = EXPERIENCE_PRESETS[presetId] || EXPERIENCE_PRESETS['global-default'];
  return {
    ...preset,
    selectedAt: '2026-03-09T00:00:00.000Z',
    source: 'user',
  };
}

async function seedExperiencePreference(page, presetId = 'global-default') {
  const preference = buildPreference(presetId);
  await page.addInitScript(({ value }) => {
    localStorage.setItem('agentTown:experiencePreset', value.presetId);
    localStorage.setItem('agentTown:locale', value.locale);
    localStorage.setItem('agentTown:market', value.market);
    localStorage.setItem('agentTown:experiencePreference', JSON.stringify(value));
  }, { value: preference });
}

async function selectStartPreset(page, presetId = 'global-default') {
  const selector = `[data-preset-id="${presetId}"]`;
  await page.waitForFunction((targetSelector) => {
    const node = document.querySelector(targetSelector);
    return !!node && node instanceof HTMLElement && node.dataset.bound === '1';
  }, selector);
  await page.locator(selector).first().click();
  await page.waitForFunction(() => {
    const enterBtn = document.getElementById('enterBtn');
    return !!enterBtn && enterBtn instanceof HTMLButtonElement && enterBtn.disabled === false;
  });
}

module.exports = {
  EXPERIENCE_PRESETS,
  buildPreference,
  seedExperiencePreference,
  selectStartPreset,
};
