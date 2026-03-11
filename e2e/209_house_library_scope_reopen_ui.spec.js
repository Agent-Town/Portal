const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformStats,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

async function readPromptPreviewInspector(request) {
  const response = await request.get('/__test__/unified-platform/inspect/prompt-preview', {
    headers: { 'x-test-reset': process.env.TEST_RESET_TOKEN || 'test-reset' },
  });
  return await response.json();
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.15: House Library reopens a saved Reading Table for a later chat without leaving the shell', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_scope_reopen_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const itemAlphaResponse = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-scope-reopen-item-alpha',
    },
    data: {
      itemType: 'fact_note',
      title: 'Atlas Modal Rule',
      summary: 'Atlas stays inside the modal shell.',
      sourceKind: 'trace',
      sourceRef: 'trace_scope_reopen_alpha',
    },
    failOnStatusCode: false,
  });
  expect(itemAlphaResponse.status()).toBe(201);
  const itemAlphaBody = await itemAlphaResponse.json();

  const itemBetaResponse = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-scope-reopen-item-beta',
    },
    data: {
      itemType: 'playbook',
      title: 'Workshop Snapshot Rule',
      summary: 'Re-open the Workshop file before applying edits.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/scope.md',
    },
    failOnStatusCode: false,
  });
  expect(itemBetaResponse.status()).toBe(201);
  const itemBetaBody = await itemBetaResponse.json();

  const itemGammaResponse = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-scope-reopen-item-gamma',
    },
    data: {
      itemType: 'fact_note',
      title: 'Library Continuity Note',
      summary: 'Bring only the saved reading table back into scope.',
      sourceKind: 'conversation_excerpt',
      sourceRef: 'conv_scope_reopen_gamma#msg_01',
    },
    failOnStatusCode: false,
  });
  expect(itemGammaResponse.status()).toBe(201);
  const itemGammaBody = await itemGammaResponse.json();

  const itemAlphaId = String(itemAlphaBody?.data?.item?.libraryItemId || '');
  const itemBetaId = String(itemBetaBody?.data?.item?.libraryItemId || '');
  const itemGammaId = String(itemGammaBody?.data?.item?.libraryItemId || '');
  expect(itemAlphaId).toMatch(/^lib_/);
  expect(itemBetaId).toMatch(/^lib_/);
  expect(itemGammaId).toMatch(/^lib_/);

  const scopeAlphaResponse = await page.request.post('/api/platform/library/scope', {
    data: {
      scopeSetId: 'scope_reading_table_alpha',
      title: 'Atlas Reading Table',
      itemIds: [itemAlphaId],
    },
    failOnStatusCode: false,
  });
  expect(scopeAlphaResponse.status()).toBe(200);

  const scopeBetaResponse = await page.request.post('/api/platform/library/scope', {
    data: {
      scopeSetId: 'scope_reading_table_beta',
      title: 'Workshop Return Kit',
      itemIds: [itemBetaId, itemGammaId],
    },
    failOnStatusCode: false,
  });
  expect(scopeBetaResponse.status()).toBe(200);

  const statsBeforeUi = await getPlatformStats(request);
  expect(Number(statsBeforeUi?.stats?.counts?.scope_sets || 0)).toBe(2);

  await page.context().clearCookies();
  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const reattached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(reattached.status).toBe(200);

  const initialSessionId = await readWorkerSessionId(page);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.getByTestId('house-library-selected')).toHaveText('Selected for this chat: none.');
  await expect(page.getByTestId('house-library-scope-empty')).toBeHidden();
  await expect(page.getByTestId('house-library-scope-sets').locator('button')).toHaveCount(2);
  await expect(page.getByTestId('house-library-scope-sets')).toContainText('Workshop Return Kit');
  await expect(page.getByTestId('house-library-scope-sets')).toContainText('Atlas Reading Table');

  await page.getByRole('button', { name: /Workshop Return Kit/ }).click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Reopened Reading Table Workshop Return Kit for this chat.');
  await expect(page.getByTestId('house-library-selected')).toContainText('Workshop Snapshot Rule');
  await expect(page.getByTestId('house-library-selected')).toContainText('Library Continuity Note');
  await expect(page.getByTestId('house-library-selected')).not.toContainText('Atlas Modal Rule');

  await expect.poll(async () => {
    const inspector = await readPromptPreviewInspector(request);
    return {
      activeScopeSetId: String(inspector?.data?.activeScopeSetId || ''),
      selectedItemIds: Array.isArray(inspector?.data?.selectedItemIds) ? inspector.data.selectedItemIds : [],
    };
  }).toEqual({
    activeScopeSetId: 'scope_reading_table_beta',
    selectedItemIds: [itemBetaId, itemGammaId],
  });

  await page.getByTestId('house-open-workshop').click();
  await expect(page.getByTestId('house-workshop-panel')).toBeVisible();
  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();

  await page.getByRole('button', { name: /Atlas Reading Table/ }).click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Reopened Reading Table Atlas Reading Table for this chat.');
  await expect(page.getByTestId('house-library-selected')).toContainText('Atlas Modal Rule');
  await expect(page.getByTestId('house-library-selected')).not.toContainText('Workshop Snapshot Rule');
  await expect(page.getByTestId('house-library-selected')).not.toContainText('Library Continuity Note');

  await expect.poll(async () => {
    const inspector = await readPromptPreviewInspector(request);
    return {
      activeScopeSetId: String(inspector?.data?.activeScopeSetId || ''),
      selectedItemIds: Array.isArray(inspector?.data?.selectedItemIds) ? inspector.data.selectedItemIds : [],
    };
  }).toEqual({
    activeScopeSetId: 'scope_reading_table_alpha',
    selectedItemIds: [itemAlphaId],
  });

  const finalSessionId = await readWorkerSessionId(page);
  expect(finalSessionId).toBe(initialSessionId);
  expect(page.url()).toContain('/app');

  const statsAfterUi = await getPlatformStats(request);
  expect(Number(statsAfterUi?.stats?.counts?.scope_sets || 0)).toBe(2);
});
