const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  getPlatformFixture,
  getPlatformInspector,
  getPlatformStats,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';

async function appendSmokeTranscript(page) {
  await page.evaluate(() => {
    window.__agentTownUiTest.resetChatTranscript();
    window.__agentTownUiTest.appendChatMessage('user', 'Keep the library scope narrow.');
    window.__agentTownUiTest.appendChatMessage('assistant', 'I will use only the items you place on the Reading Table.');
    window.__agentTownUiTest.appendChatMessage('user', 'Save the planning notes for later.');
  });
}

async function collectLibraryCopyAudit(page) {
  return await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="house-library-panel"]');
    const headingTexts = panel
      ? Array.from(panel.querySelectorAll('h2, h3')).map((node) => String(node.textContent || '').trim()).filter(Boolean)
      : [];
    return {
      headingTexts,
      panelText: panel ? String(panel.innerText || '') : '',
    };
  });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M30.11: House Library full guided memory loop stays same-shell and benchmark-clean', async ({ page, request }) => {
  const benchmarkFixture = await getPlatformFixture(request, 'library_benchmark_seed');
  expect(benchmarkFixture?.ok).toBe(true);
  const expectedMetrics = benchmarkFixture?.fixture?.expectedMetrics || {};

  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_guided_memory_loop_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const initialSessionId = await readWorkerSessionId(page);
  const statsBefore = await getPlatformStats(request);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();

  await page.getByTestId('house-library-note-title').fill('Journey Note');
  await page.getByTestId('house-library-note-body').fill('Keep the final chat scope to the Journey Shelf items only.');
  await page.getByTestId('house-library-save-note').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved Journey Note to your Library.');

  await appendSmokeTranscript(page);
  await page.getByTestId('house-library-capture-title').fill('Journey Capture');
  await page.locator('#houseLibraryCaptureMessages input').nth(0).check();
  await page.locator('#houseLibraryCaptureMessages input').nth(1).check();
  await page.getByTestId('house-library-capture-save').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved Journey Capture to your Library.');

  await page.getByTestId('house-library-shelf-title').fill('Journey Shelf');
  await page.getByTestId('house-library-shelf-create-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Made shelf Journey Shelf');

  await page.locator('#houseLibraryShelves button').first().click();
  await page.locator('#houseLibraryList button', { hasText: 'Journey Note' }).click();
  await page.getByRole('button', { name: 'Place on Journey Shelf' }).click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Placed Journey Note on Journey Shelf.');

  await page.getByTestId('house-library-satchel-title').fill('Journey Pack');
  await expect(page.getByTestId('house-library-save-satchel')).toBeEnabled();
  await page.getByTestId('house-library-save-satchel').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved Satchel Journey Pack.');

  await page.getByTestId('house-library-public-stacks-query').fill('atlas');
  await page.getByTestId('house-library-public-stacks-family').selectOption('skill');
  await page.getByTestId('house-library-public-stacks-search').click();
  await page.locator('#houseLibraryPublicStacksResults button[data-registry-id="reg_atlas_skill_01"]').click();
  await page.getByTestId('house-library-guided-import-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Atlas Scout from Registry.');

  await page.locator('#houseLibraryList button', { hasText: 'Journey Note' }).click();
  await page.getByTestId('house-library-guided-approval-input').fill(APPROVED_PUBLICATION_ID);
  await page.getByTestId('house-library-guided-publish-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Published Journey Note to Registry as regpub_');

  await page.getByRole('button', { name: /Satchel · Journey Pack/ }).click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Reopened Satchel Journey Pack for this chat.');

  const statsAfter = await getPlatformStats(request);
  expect(Number(statsAfter?.stats?.counts?.library_items || 0)).toBe(Number(statsBefore?.stats?.counts?.library_items || 0) + 3);
  expect(Number(statsAfter?.stats?.counts?.conversation_artifacts || 0)).toBe(Number(statsBefore?.stats?.counts?.conversation_artifacts || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.library_shelves || 0)).toBe(Number(statsBefore?.stats?.counts?.library_shelves || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.scope_sets || 0)).toBe(Number(statsBefore?.stats?.counts?.scope_sets || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.library_publications || 0)).toBe(Number(statsBefore?.stats?.counts?.library_publications || 0) + 1);

  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const libraryRead = await page.request.get('/api/platform/library', {
    failOnStatusCode: false,
  });
  expect(libraryRead.status()).toBe(200);
  const libraryBody = await libraryRead.json();
  const items = Array.isArray(libraryBody?.data?.items) ? libraryBody.data.items : [];
  const noteItem = items.find((item) => String(item?.title || '') === 'Journey Note');
  const captureItem = items.find((item) => String(item?.title || '') === 'Journey Capture');
  const importedItem = items.find((item) => String(item?.registryId || '') === 'reg_atlas_skill_01');
  expect(noteItem).toBeTruthy();
  expect(captureItem).toBeTruthy();
  expect(importedItem).toBeTruthy();
  expect(importedItem?.readOnly).toBe(true);

  await page.locator('#houseLibraryList button', { hasText: 'Journey Note' }).click();
  await expect(page.getByTestId('house-library-detail')).toContainText('Provenance: user_note');
  await expect(page.getByTestId('house-library-detail')).toContainText('Published');

  await page.locator('#houseLibraryList button', { hasText: 'Journey Capture' }).click();
  await expect(page.getByTestId('house-library-detail')).toContainText('Provenance: conversation_artifact');

  await page.locator('#houseLibraryShelves button').first().click();
  await page.locator('#houseLibraryList button', { hasText: 'Atlas Scout' }).click();
  await expect(page.getByTestId('house-library-detail')).toContainText('Provenance: registry_artifact');
  await expect(page.getByTestId('house-library-detail')).toContainText('Read only');

  const promptPreviewInspector = await getPlatformInspector(request, 'prompt-preview');
  expect(promptPreviewInspector.status).toBe(200);
  expect(promptPreviewInspector.json?.data?.selectedItemIds).toEqual([
    String(captureItem?.libraryItemId || ''),
    String(noteItem?.libraryItemId || ''),
  ]);
  expect(promptPreviewInspector.json?.data?.selectedItemIds).not.toContain(String(importedItem?.libraryItemId || ''));

  const copyAudit = await collectLibraryCopyAudit(page);
  const benchmarkRun = await callPageJson(page, '/api/platform/library/benchmarks/run', {
    method: 'POST',
    data: { copyAudit },
  });
  expect(benchmarkRun.status).toBe(200);
  expect(benchmarkRun.json?.data?.metrics).toEqual(expectedMetrics);
});
