const { test, expect } = require('@playwright/test');

const {
  bootstrapExperienceIntentHarness,
  invokeLiteTool,
  readPathname,
} = require('./helpers/experience_intents');
const { resetPortalWebState } = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.5: worker-visible web and registry tools expose durable state without breaking hub continuity', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const registryInfo = await page.evaluate(async () => {
    return await window.__openclawLiteTest.getToolRegistryInfo();
  });
  const names = Array.isArray(registryInfo?.names) ? registryInfo.names : [];
  expect(names).toEqual(expect.arrayContaining([
    'agent_town_ui_web_open',
    'agent_town_state_get_registry_entity',
    'agent_town_state_get_web_session',
  ]));

  const createdSession = await page.evaluate(async () => {
    const response = await fetch('/api/web/sessions', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://github.com/openai/openai-codex/issues/1',
        integrationRegistryId: 'wi_github_issue_reply',
        versionId: 'rv_github_issue_reply_v1',
        renderMode: 'auto',
        autonomyMode: 'assist',
      }),
    });
    return await response.json();
  });
  const webSessionId = String(createdSession?.data?.session?.webSessionId || '');
  expect(webSessionId).toMatch(/^we_/);

  const checkpoint = await page.evaluate(async (sessionId) => {
    const detailResp = await fetch(`/api/web/sessions/${encodeURIComponent(sessionId)}`, {
      credentials: 'include',
    });
    const detail = await detailResp.json();
    const expectedRevision = Number(detail?.data?.session?.activeRevision || 0);
    const checkpointResp = await fetch(`/api/web/sessions/${encodeURIComponent(sessionId)}/checkpoint`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        expectedRevision,
        checkpoint: {
          identity: {
            marker: 'web-tool-surface-checkpoint',
            route: '/issues/1',
          },
          page: {
            title: 'GitHub Issue Reply',
          },
        },
      }),
    });
    return await checkpointResp.json();
  }, webSessionId);
  const checkpointRef = String(checkpoint?.data?.checkpointRef || '');
  expect(checkpointRef).toMatch(/^wcp_/);

  expect(await readPathname(page)).toBe('/app');

  const registryState = await invokeLiteTool(page, 'agent_town_state_get_registry_entity', {
    registryId: 'reg_github_issue_reply',
  });
  expect(registryState?.ok).toBe(true);
  expect(registryState?.error).toBeNull();
  expect(registryState?.data).toMatchObject({
    registryId: 'reg_github_issue_reply',
    registryEntityId: 'reg_github_issue_reply',
    entityVersionId: 'rev_github_issue_reply_v1',
  });
  expect(await readPathname(page)).toBe('/app');

  const webState = await invokeLiteTool(page, 'agent_town_state_get_web_session', {
    webSessionId,
  });
  expect(webState?.ok).toBe(true);
  expect(webState?.error).toBeNull();
  expect(webState?.data).toMatchObject({
    sessionId: webSessionId,
    webSessionId,
    lastCheckpointIdentity: checkpointRef,
  });
  expect(webState?.data?.lastCheckpoint).toMatchObject({
    checkpointRef,
    webSessionId,
  });
  expect(await readPathname(page)).toBe('/app');

  const webOpen = await invokeLiteTool(page, 'agent_town_ui_web_open', {
    url: '/skill.md',
    title: 'Skill Sheet',
  });
  expect(webOpen?.ok).toBe(true);
  expect(webOpen?.error).toBeNull();
  expect(webOpen?.data).toMatchObject({
    ok: true,
    applied: true,
    stateSnapshot: {
      path: '/app',
      web: {
        title: 'Skill Sheet',
        url: '/skill.md',
      },
    },
  });

  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 3000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Skill Sheet');
  expect(await readPathname(page)).toBe('/app');
});
