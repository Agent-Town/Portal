const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  getPlatformFixture,
  getPlatformStats,
  promotePlatformConfigVersion,
  readWorkerSessionId,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.11`,
    branch: 'house-workshop-editor',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_workshop_editor_01',
      teamCompositionVersionId: 'tcv_house_workshop_editor_01',
      agentConfigVersionIds: ['agv_house_workshop_editor_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_workshop_editor_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_workshop_editor_01',
    },
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.5: House Workshop exposes deterministic file browsing and read-only file views inside the same shell', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);

  const configResp = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-workshop-editor-config-001',
    payload: buildConfigPayload('cfg_house_workshop_editor_01'),
  });
  expect(configResp.status).toBe(201);

  const promoteResp = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_house_workshop_editor_01',
    teamId: 'team_main',
    idempotencyKey: 'house-workshop-editor-promote-001',
  });
  expect(promoteResp.status).toBe(200);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const fixture = await getPlatformFixture(request, 'library_workshop_seed');
  const files = Array.isArray(fixture?.fixture?.files) ? fixture.fixture.files : [];
  expect(files).toHaveLength(2);

  for (const file of files) {
    const filePath = String(file?.path || '');
    const content = String(file?.content || '');
    expect(filePath.startsWith('workspace/.agent-town/')).toBe(true);
    const writeResult = await page.evaluate(async ({ nextPath, nextContent }) => {
      return await window.__openclawLiteTest.workspaceWriteFile({
        path: nextPath,
        content: nextContent,
      });
    }, {
      nextPath: filePath,
      nextContent: content,
    });
    expect(writeResult?.ok).toBe(true);
  }

  const initialSessionId = await readWorkerSessionId(page);
  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  await page.getByTestId('house-open-workshop').click();
  await expect(page.getByTestId('house-workshop-panel')).toBeVisible();
  await expect(page.getByTestId('house-workshop-files')).toBeVisible();
  await expect(page.locator('#houseWorkshopFiles button')).toHaveCount(2);

  const fileLabels = await page.locator('#houseWorkshopFiles button').allTextContents();
  expect(fileLabels).toEqual([
    'workspace/.agent-town/notes/library.md',
    'workspace/.agent-town/playbooks/scope.md',
  ]);

  await page.locator('#houseWorkshopFiles button').nth(1).click();
  await expect(page.getByTestId('house-workshop-file-path')).toHaveText('workspace/.agent-town/playbooks/scope.md');
  await expect(page.getByTestId('house-workshop-file-content')).toHaveText('# Scope Playbook\n\nOnly use what the user selected.');

  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfter = await getPlatformStats(request);
  expect(Number(statsAfter?.stats?.counts?.library_items || 0)).toBe(Number(statsBefore?.stats?.counts?.library_items || 0));
  expect(Number(statsAfter?.stats?.counts?.runs || 0)).toBe(Number(statsBefore?.stats?.counts?.runs || 0));
});
