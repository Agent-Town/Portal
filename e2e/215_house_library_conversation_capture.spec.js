const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformFixture,
  getPlatformInspector,
  getPlatformStats,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

async function readPromptPreviewInspector(request) {
  const response = await getPlatformInspector(request, 'prompt-preview');
  expect(response.status).toBe(200);
  return response.json;
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M30.3: House Library captures only the selected chat turns into one reviewed conversation artifact', async ({ page, request }) => {
  const fixture = await getPlatformFixture(request, 'library_conversation_capture_seed');
  expect(fixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_conversation_capture_01',
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
  await page.waitForFunction(() => !!window.__agentTownUiTest);

  const seededMessages = await page.evaluate(() => {
    window.__agentTownUiTest.resetChatTranscript();
    window.__agentTownUiTest.appendChatMessage('user', 'Atlas stays inside the modal shell.');
    window.__agentTownUiTest.appendChatMessage('agent', 'I will keep Atlas inside /app.');
    return window.__agentTownUiTest.appendChatMessage('user', 'Bring only the selected memories into chat.');
  });
  expect(Array.isArray(seededMessages)).toBe(true);
  expect(seededMessages).toHaveLength(3);

  const selectedMessageIds = [
    String(seededMessages[0]?.messageId || ''),
    String(seededMessages[2]?.messageId || ''),
  ];

  const initialStats = await getPlatformStats(request);
  const initialPromptPreview = await readPromptPreviewInspector(request);
  expect(Array.isArray(initialPromptPreview?.data?.selectedItemIds) ? initialPromptPreview.data.selectedItemIds : []).toEqual([]);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-capture-desk')).toBeVisible();
  await page.getByTestId('house-library-capture-title').fill(String(fixture?.fixture?.artifactTitle || 'Planner Notes'));
  await page.locator(`#houseLibraryCaptureMessages input[data-message-id="${selectedMessageIds[0]}"]`).check();
  await page.locator(`#houseLibraryCaptureMessages input[data-message-id="${selectedMessageIds[1]}"]`).check();
  await page.getByTestId('house-library-capture-save').click();

  await expect(page.getByTestId('house-library-action-status')).toContainText(`Saved ${String(fixture?.fixture?.artifactTitle || 'Planner Notes')} to your Library.`);
  await expect(page.getByTestId('house-library-detail')).toContainText('conversation_artifact');

  const finalStats = await getPlatformStats(request);
  expect(Number(finalStats?.stats?.counts?.conversation_artifacts || 0)).toBe(Number(initialStats?.stats?.counts?.conversation_artifacts || 0) + 1);
  expect(Number(finalStats?.stats?.counts?.library_items || 0)).toBe(Number(initialStats?.stats?.counts?.library_items || 0) + 1);
  expect(Number(finalStats?.stats?.counts?.library_links || 0)).toBe(Number(initialStats?.stats?.counts?.library_links || 0) + 1);
  expect(Number(finalStats?.stats?.counts?.library_item_revisions || 0)).toBe(Number(initialStats?.stats?.counts?.library_item_revisions || 0) + 1);

  const conversationInspector = await getPlatformInspector(request, 'conversation-artifacts');
  expect(conversationInspector.status).toBe(200);
  expect(conversationInspector.json?.data?.artifacts?.[0]).toMatchObject({
    title: String(fixture?.fixture?.artifactTitle || 'Planner Notes'),
    messageIds: selectedMessageIds,
  });
  expect(String(conversationInspector.json?.data?.artifacts?.[0]?.transcriptText || '')).toContain('Atlas stays inside the modal shell.');
  expect(String(conversationInspector.json?.data?.artifacts?.[0]?.transcriptText || '')).toContain('Bring only the selected memories into chat.');
  expect(String(conversationInspector.json?.data?.artifacts?.[0]?.transcriptText || '')).not.toContain('I will keep Atlas inside /app.');

  const libraryInspector = await getPlatformInspector(request, 'library');
  expect(libraryInspector.status).toBe(200);
  expect(libraryInspector.json?.data?.items?.[0]).toMatchObject({
    sourceKind: String(fixture?.fixture?.expectedSourceKind || 'conversation_artifact'),
  });

  const finalPromptPreview = await readPromptPreviewInspector(request);
  expect(Array.isArray(finalPromptPreview?.data?.selectedItemIds) ? finalPromptPreview.data.selectedItemIds : []).toEqual([]);
});
