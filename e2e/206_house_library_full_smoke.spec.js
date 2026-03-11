const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  exportPlatformSnapshot,
  getPlatformFixture,
  getPlatformStats,
  promotePlatformConfigVersion,
  readWorkerSessionId,
} = require('./helpers/unified_platform');

const RESET_TOKEN = process.env.TEST_RESET_TOKEN || 'test-reset';
const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';
const TARGET_PATH = 'workspace/.agent-town/playbooks/scope.md';
const UPDATED_CONTENT = '# Scope Playbook\n\nOnly use the two items the user selected.\n\nRe-open the reading table before acting.';

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.11`,
    branch: 'house-library-full-smoke',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_library_full_smoke_01',
      teamCompositionVersionId: 'tcv_house_library_full_smoke_01',
      agentConfigVersionIds: ['agv_house_library_full_smoke_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_library_full_smoke_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_library_full_smoke_01',
    },
  };
}

async function readPromptPreviewInspector(request) {
  const response = await request.get('/__test__/unified-platform/inspect/prompt-preview', {
    headers: { 'x-test-reset': RESET_TOKEN },
  });
  return await response.json();
}

async function readLibraryInspector(request) {
  const response = await request.get('/__test__/unified-platform/inspect/library', {
    headers: { 'x-test-reset': RESET_TOKEN },
  });
  return await response.json();
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.11: House Library full smoke preserves same-shell continuity from curation through scoped reuse and Registry publication', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });
  const seededHouse = await seedRecoverableTokenHouse(request);

  const configResp = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-library-full-smoke-config-001',
    payload: buildConfigPayload('cfg_house_library_full_smoke_01'),
  });
  expect(configResp.status).toBe(201);

  const promoteResp = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_house_library_full_smoke_01',
    teamId: 'team_main',
    idempotencyKey: 'house-library-full-smoke-promote-001',
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

  const initialSessionId = await readWorkerSessionId(page);

  const createItemResp = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'house-library-full-smoke-item-001',
    },
    data: {
      itemType: 'fact_note',
      title: 'Modal Continuity',
      summary: 'Keep House work inside the same /app shell.',
      contentText: 'Do not leave /app while the worker is live.',
      sourceKind: 'trace',
      sourceRef: 'trace_house_library_full_smoke_01',
    },
    failOnStatusCode: false,
  });
  expect(createItemResp.status()).toBe(201);
  const createItemBody = await createItemResp.json();
  const curatedItemId = String(createItemBody?.data?.item?.libraryItemId || '');
  expect(curatedItemId).toMatch(/^lib_/);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.locator('#houseLibraryList button').first()).toContainText('Modal Continuity');
  await page.getByRole('button', { name: 'Bring to Chat' }).click();
  await expect(page.getByTestId('house-library-selected')).toContainText('Modal Continuity');

  await expect.poll(async () => {
    const inspector = await readPromptPreviewInspector(request);
    return Array.isArray(inspector?.data?.selectedItemIds) ? inspector.data.selectedItemIds : [];
  }).toEqual([curatedItemId]);
  const scopeInspectorAfterFirstBring = await readPromptPreviewInspector(request);
  const activeScopeSetId = String(scopeInspectorAfterFirstBring?.data?.activeScopeSetId || '');
  expect(activeScopeSetId).toMatch(/^scope_/);

  await page.getByTestId('house-open-workshop').click();
  await expect(page.getByTestId('house-workshop-panel')).toBeVisible();
  await page.locator('#houseWorkshopFiles button').nth(1).click();
  await expect(page.getByTestId('house-workshop-file-path')).toHaveText(TARGET_PATH);
  await page.getByTestId('house-workshop-draft-input').fill(UPDATED_CONTENT);
  await page.getByTestId('house-workshop-apply-draft').click();
  await expect(page.getByTestId('approvals-panel')).toBeVisible({ timeout: 3000 });
  await page.locator('#approvals button', { hasText: 'Approve' }).first().click();
  await expect(page.getByTestId('house-workshop-action-status')).toContainText('Saved scope.md in Workshop.');
  await expect(page.getByTestId('house-workshop-file-content')).toHaveText(UPDATED_CONTENT);
  await page.getByTestId('house-workshop-save-snapshot').click();
  await expect(page.getByTestId('house-workshop-action-status')).toContainText('Saved Workshop Snapshot · scope.md to Library.');

  const libraryInspectorAfterSnapshot = await readLibraryInspector(request);
  const snapshotItem = Array.isArray(libraryInspectorAfterSnapshot?.data?.items)
    ? libraryInspectorAfterSnapshot.data.items.find((item) => String(item?.sourceRef || '') === TARGET_PATH)
    : null;
  const snapshotItemId = String(snapshotItem?.libraryItemId || '');
  expect(snapshotItemId).toMatch(/^lib_/);

  const scopeToSnapshotResp = await page.request.post('/api/platform/library/scope', {
    data: {
      scopeSetId: activeScopeSetId,
      title: 'Reading Table',
      itemIds: [snapshotItemId],
    },
    failOnStatusCode: false,
  });
  expect(scopeToSnapshotResp.status()).toBe(200);

  await expect.poll(async () => {
    const inspector = await readPromptPreviewInspector(request);
    return Array.isArray(inspector?.data?.selectedItemIds) ? inspector.data.selectedItemIds : [];
  }).toEqual([snapshotItemId]);
  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.getByTestId('house-library-selected')).toContainText('Workshop Snapshot · scope.md');

  const scopeBackToCuratedResp = await page.request.post('/api/platform/library/scope', {
    data: {
      scopeSetId: activeScopeSetId,
      title: 'Reading Table',
      itemIds: [curatedItemId],
    },
    failOnStatusCode: false,
  });
  expect(scopeBackToCuratedResp.status()).toBe(200);

  await expect.poll(async () => {
    const inspector = await readPromptPreviewInspector(request);
    return Array.isArray(inspector?.data?.selectedItemIds) ? inspector.data.selectedItemIds : [];
  }).toEqual([curatedItemId]);
  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.getByTestId('house-library-selected')).toContainText('Modal Continuity');
  await expect(page.getByTestId('house-library-selected')).not.toContainText('Workshop Snapshot · scope.md');

  const publishResp = await page.request.post('/api/platform/library/publications', {
    headers: {
      'Idempotency-Key': 'house-library-full-smoke-publish-001',
    },
    data: {
      libraryItemId: curatedItemId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
    failOnStatusCode: false,
  });
  expect(publishResp.status()).toBe(201);

  const stats = await getPlatformStats(request);
  expect(stats?.ok).toBe(true);
  expect(Number(stats?.stats?.counts?.library_items || 0)).toBe(2);
  expect(Number(stats?.stats?.counts?.scope_sets || 0)).toBe(1);
  expect(Number(stats?.stats?.counts?.library_publications || 0)).toBe(1);

  const exported = await exportPlatformSnapshot(request);
  expect(exported.status).toBe(200);
  const snapshot = exported.json?.snapshot || {};
  expect(snapshot?.schemaVersion).toBe('platform-export/v1');
  expect(Number(snapshot?.counts?.library_items || 0)).toBe(Number(stats?.stats?.counts?.library_items || 0));
  expect(Number(snapshot?.counts?.scope_sets || 0)).toBe(Number(stats?.stats?.counts?.scope_sets || 0));
  expect(Number(snapshot?.counts?.library_publications || 0)).toBe(Number(stats?.stats?.counts?.library_publications || 0));
  expect(Array.isArray(snapshot?.tables?.library_items)).toBe(true);
  expect(Array.isArray(snapshot?.tables?.scope_sets)).toBe(true);
  expect(Array.isArray(snapshot?.tables?.library_publications)).toBe(true);
  expect(snapshot.tables.library_items).toHaveLength(2);
  expect(snapshot.tables.scope_sets).toHaveLength(1);
  expect(snapshot.tables.library_publications).toHaveLength(1);

  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);
});
