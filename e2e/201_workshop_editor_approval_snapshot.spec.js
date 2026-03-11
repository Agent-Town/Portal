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
} = require('./helpers/unified_platform');

const RESET_TOKEN = process.env.TEST_RESET_TOKEN || 'test-reset';
const TARGET_PATH = 'workspace/.agent-town/playbooks/scope.md';
const UPDATED_CONTENT = '# Scope Playbook\n\nOnly use the two items the user selected.';

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.11`,
    branch: 'house-workshop-writer',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_workshop_writer_01',
      teamCompositionVersionId: 'tcv_house_workshop_writer_01',
      agentConfigVersionIds: ['agv_house_workshop_writer_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_workshop_writer_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_workshop_writer_01',
    },
  };
}

async function readLibraryInspector(request) {
  const response = await request.get('/__test__/unified-platform/inspect/library', {
    headers: { 'x-test-reset': RESET_TOKEN },
  });
  return await response.json();
}

async function countWorkspaceUpdateEvents(page, path) {
  return await page.evaluate(async (targetPath) => {
    const envelope = await window.__openclawLiteTest.workspaceEvents();
    const data = envelope?.data || envelope || {};
    const events = Array.isArray(data?.events) ? data.events : [];
    return events.filter((event) => {
      return String(event?.path || '') === String(targetPath || '') && String(event?.action || '') === 'update';
    }).length;
  }, path);
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.6: House Workshop writes require approval and can snapshot the approved file into Library', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });
  const seededHouse = await seedRecoverableTokenHouse(request);

  const configResp = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-workshop-writer-config-001',
    payload: buildConfigPayload('cfg_house_workshop_writer_01'),
  });
  expect(configResp.status).toBe(201);

  const promoteResp = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_house_workshop_writer_01',
    teamId: 'team_main',
    idempotencyKey: 'house-workshop-writer-promote-001',
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

  await page.getByTestId('house-open-workshop').click();
  await expect(page.getByTestId('house-workshop-panel')).toBeVisible();
  await page.locator('#houseWorkshopFiles button').nth(1).click();

  await expect(page.getByTestId('house-workshop-file-path')).toHaveText(TARGET_PATH);
  await expect(page.getByTestId('house-workshop-file-content')).toHaveText('# Scope Playbook\n\nOnly use what the user selected.');

  const statsBefore = await getPlatformStats(request);
  const updatesBefore = await countWorkspaceUpdateEvents(page, TARGET_PATH);

  await page.getByTestId('house-workshop-draft-input').fill(UPDATED_CONTENT);
  await expect(page.getByTestId('house-workshop-diff-preview')).toContainText('- Only use what the user selected.');
  await expect(page.getByTestId('house-workshop-diff-preview')).toContainText('+ Only use the two items the user selected.');

  await page.getByTestId('house-workshop-apply-draft').click();
  await expect(page.getByTestId('approvals-panel')).toBeVisible({ timeout: 3000 });
  await page.locator('#approvals button', { hasText: 'Reject' }).first().click();
  await expect(page.getByTestId('house-workshop-action-status')).toContainText('PERMISSION_DENIED');

  const updatesAfterReject = await countWorkspaceUpdateEvents(page, TARGET_PATH);
  expect(updatesAfterReject).toBe(updatesBefore);
  await expect(page.getByTestId('house-workshop-file-content')).toHaveText('# Scope Playbook\n\nOnly use what the user selected.');

  await page.getByTestId('house-workshop-apply-draft').click();
  await expect(page.getByTestId('approvals-panel')).toBeVisible({ timeout: 3000 });
  await page.locator('#approvals button', { hasText: 'Approve' }).first().click();
  await expect(page.getByTestId('house-workshop-action-status')).toContainText('Saved scope.md in Workshop.');
  await expect(page.getByTestId('house-workshop-file-content')).toHaveText(UPDATED_CONTENT);
  await expect(page.getByTestId('house-workshop-diff-preview')).toHaveText('No pending changes.');

  const updatesAfterApprove = await countWorkspaceUpdateEvents(page, TARGET_PATH);
  expect(updatesAfterApprove).toBe(updatesBefore + 1);

  const statsAfterApprove = await getPlatformStats(request);
  expect(Number(statsAfterApprove?.stats?.counts?.library_items || 0)).toBe(Number(statsBefore?.stats?.counts?.library_items || 0));
  expect(Number(statsAfterApprove?.stats?.counts?.library_links || 0)).toBe(Number(statsBefore?.stats?.counts?.library_links || 0));

  await page.getByTestId('house-workshop-save-snapshot').click();
  await expect(page.getByTestId('house-workshop-action-status')).toContainText('Saved Workshop Snapshot · scope.md to Library.');

  const statsAfterSnapshot = await getPlatformStats(request);
  expect(Number(statsAfterSnapshot?.stats?.counts?.library_items || 0)).toBe(Number(statsAfterApprove?.stats?.counts?.library_items || 0) + 1);
  expect(Number(statsAfterSnapshot?.stats?.counts?.library_links || 0)).toBe(Number(statsAfterApprove?.stats?.counts?.library_links || 0) + 1);

  const inspector = await readLibraryInspector(request);
  expect(inspector?.ok).toBe(true);
  const snapshotItem = Array.isArray(inspector?.data?.items)
    ? inspector.data.items.find((item) => String(item?.sourceRef || '') === TARGET_PATH)
    : null;
  expect(snapshotItem).toMatchObject({
    sourceKind: 'workspace_file',
    sourceRef: TARGET_PATH,
  });
});
