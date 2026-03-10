const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('experience preference bootstrap and persistence APIs expose a canonical session preference', async ({ request }) => {
  const bootstrapResp = await request.get('/api/experience/bootstrap');
  expect(bootstrapResp.ok()).toBeTruthy();
  const bootstrap = await bootstrapResp.json();
  expect(bootstrap).toMatchObject({
    ok: true,
    defaultPresetId: 'global-default',
  });
  expect(bootstrap.current).toMatchObject({
    presetId: 'global-default',
    locale: 'en',
    source: 'server-default',
  });
  expect(Array.isArray(bootstrap.presets)).toBeTruthy();
  expect(bootstrap.presets.map((row) => row.id)).toEqual(expect.arrayContaining(['global-default', 'cn-mainland']));

  const saveResp = await request.post('/api/experience/preference', {
    data: { presetId: 'cn-mainland' },
  });
  expect(saveResp.ok()).toBeTruthy();
  const saved = await saveResp.json();
  expect(saved).toMatchObject({
    ok: true,
    experiencePreference: {
      presetId: 'cn-mainland',
      locale: 'zh-CN',
      providerPolicy: 'cn-mainland',
      sharePolicy: 'link-first',
      mediaPolicy: 'mainland-safe',
      source: 'user',
    },
  });

  const stateResp = await request.get('/api/state');
  expect(stateResp.ok()).toBeTruthy();
  const state = await stateResp.json();
  expect(state.experiencePreference).toMatchObject({
    presetId: 'cn-mainland',
    locale: 'zh-CN',
    source: 'user',
  });

  const badResp = await request.post('/api/experience/preference', {
    data: { presetId: 'does-not-exist' },
  });
  expect(badResp.status()).toBe(400);
  const bad = await badResp.json();
  expect(bad).toMatchObject({
    ok: false,
    error: 'INVALID_PRESET_ID',
    experiencePreference: {
      presetId: 'cn-mainland',
      source: 'user',
    },
  });
});
