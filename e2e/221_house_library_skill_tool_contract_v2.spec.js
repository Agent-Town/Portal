const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const { invokeLiteTool } = require('./helpers/experience_intents');
const {
  attachHouseToPageSession,
  getPlatformFixture,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M30.9: House Library skill pack v2 exposes Phase 30 tools and routes deterministically', async ({ page, request }) => {
  const skillFixture = await getPlatformFixture(request, 'library_skill_contract_v2_seed');
  expect(skillFixture?.ok).toBe(true);
  const requiredTools = Array.isArray(skillFixture?.fixture?.requiredTools) ? skillFixture.fixture.requiredTools : [];
  const requiredRoles = Array.isArray(skillFixture?.fixture?.roles) ? skillFixture.fixture.roles : [];

  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_skill_tool_v2_01',
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

  const publicSkill = await request.get('/skill.md');
  expect(publicSkill.ok()).toBe(true);
  expect(await publicSkill.text()).toContain('Agent Town Portal');

  const compiledSkill = await request.get('/__compiled/library-skill-pack/skill.md');
  expect(compiledSkill.ok()).toBe(true);
  const compiledRouter = await compiledSkill.text();
  requiredRoles.forEach((role) => {
    expect(compiledRouter).toContain(role);
  });

  const compiledLibrarian = await request.get('/__compiled/library-skill-pack/skills/librarian/skill.md');
  expect(compiledLibrarian.ok()).toBe(true);
  const librarianText = await compiledLibrarian.text();
  expect(librarianText).toContain('house_library_update_item');
  expect(librarianText).toContain('house_library_read_revisions');
  expect(librarianText).toContain('house_library_capture_conversation');
  expect(librarianText).toContain('house_library_write_shelf');
  expect(librarianText).not.toContain('workspace_write_file');

  const compiledWorkshop = await request.get('/__compiled/library-skill-pack/skills/workshop-scribe/skill.md');
  expect(compiledWorkshop.ok()).toBe(true);
  const workshopText = await compiledWorkshop.text();
  expect(workshopText).toContain('workspace_edit_file');
  expect(workshopText).toContain('workspace_write_file');

  const compiledRegistry = await request.get('/__compiled/library-skill-pack/skills/registry-curator/skill.md');
  expect(compiledRegistry.ok()).toBe(true);
  const registryText = await compiledRegistry.text();
  expect(registryText).toContain('house_library_search_public_stacks');
  expect(registryText).toContain('house_library_preview_registry_artifact');
  expect(registryText).not.toContain('workspace_write_file');

  const runtimeSummary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.visitExperience({ url: '/__compiled/library-skill-pack/skill.md' });
    return {
      toolRegistry: await api.getToolRegistryInfo(),
      privateRoute: await api.librarySkillRoutePreview({
        text: 'Revise this note, save the change, and place it on a shelf for later.',
      }),
      registryRoute: await api.librarySkillRoutePreview({
        text: 'Search Public Stacks and preview provenance before import.',
      }),
      workshopRoute: await api.librarySkillRoutePreview({
        text: 'Open Workshop, edit the file, and show the diff before saving.',
      }),
    };
  });

  expect(runtimeSummary?.toolRegistry?.names).toEqual(expect.arrayContaining(requiredTools));
  expect(runtimeSummary?.privateRoute?.data || runtimeSummary?.privateRoute).toMatchObject({
    selectedSkillName: 'House Librarian',
  });
  expect(runtimeSummary?.registryRoute?.data || runtimeSummary?.registryRoute).toMatchObject({
    selectedSkillName: 'Registry Curator',
  });
  expect(runtimeSummary?.workshopRoute?.data || runtimeSummary?.workshopRoute).toMatchObject({
    selectedSkillName: 'Workshop Scribe',
  });

  const createResult = await invokeLiteTool(page, 'house_library_create_item', {
    itemType: 'library_note',
    title: 'Tool Contract Note',
    summary: 'Created through the worker tool surface.',
    contentText: 'Keep worker and human Library paths aligned.',
    sourceKind: 'user_note',
    sourceRef: 'worker:tool_contract_note',
  });
  expect(createResult?.ok).toBe(true);
  const libraryItemId = String(createResult?.data?.item?.libraryItemId || '');
  expect(libraryItemId).toMatch(/^lib_/);

  const updateResult = await invokeLiteTool(page, 'house_library_update_item', {
    libraryItemId,
    title: 'Tool Contract Note',
    summary: 'Updated through the worker tool surface.',
    contentText: 'Updated from the House Librarian tool family.',
  });
  expect(updateResult?.ok).toBe(true);
  expect(updateResult?.data?.revisions?.length || 0).toBeGreaterThanOrEqual(2);

  const revisionResult = await invokeLiteTool(page, 'house_library_read_revisions', {
    libraryItemId,
  });
  expect(revisionResult?.ok).toBe(true);
  expect(revisionResult?.data?.revisions?.length || 0).toBeGreaterThanOrEqual(2);

  const captureResult = await invokeLiteTool(page, 'house_library_capture_conversation', {
    title: 'Worker Capture',
    messageIds: ['msg_worker_01'],
    messages: [
      { messageId: 'msg_worker_01', role: 'user', text: 'Remember this worker-authored capture.' },
    ],
  });
  expect(captureResult?.ok).toBe(true);
  expect(String(captureResult?.data?.item?.sourceKind || '')).toBe('conversation_artifact');

  const shelfCreateResult = await invokeLiteTool(page, 'house_library_write_shelf', {
    mode: 'create',
    title: 'Worker Shelf',
    itemIds: [libraryItemId],
  });
  expect(shelfCreateResult?.ok).toBe(true);
  const libraryShelfId = String(shelfCreateResult?.data?.shelf?.libraryShelfId || '');
  expect(libraryShelfId).toMatch(/^shelf_/);

  const listShelvesResult = await invokeLiteTool(page, 'house_library_list_shelves', {});
  expect(listShelvesResult?.ok).toBe(true);
  expect(Array.isArray(listShelvesResult?.data?.shelves)).toBe(true);
  expect(listShelvesResult.data.shelves.map((entry) => String(entry?.libraryShelfId || ''))).toContain(libraryShelfId);

  const searchStacksResult = await invokeLiteTool(page, 'house_library_search_public_stacks', {
    query: 'atlas',
    family: 'skill',
  });
  expect(searchStacksResult?.ok).toBe(true);
  expect(Number(searchStacksResult?.data?.resultCount || 0)).toBeGreaterThanOrEqual(2);

  const previewStackResult = await invokeLiteTool(page, 'house_library_preview_registry_artifact', {
    registryEntityId: 'reg_atlas_skill_01',
  });
  expect(previewStackResult?.ok).toBe(true);
  expect(previewStackResult?.data?.preview).toMatchObject({
    registryId: 'reg_atlas_skill_01',
    family: 'skill',
  });

  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
    localStorage.setItem('agentTown:panel:debugVisible', '1');
  });
  await page.reload();
  await waitForLiteApi(page);
  await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });

  const debugPane = page.getByTestId('agent-debug-pane');
  if (!(await debugPane.isVisible())) {
    await page.getByTestId('agent-debug-toggle').click();
  }
  await expect(page.getByTestId('agent-debug-pane')).toBeVisible();
  await page.evaluate(() => {
    if (typeof window.setupAgentInterface === 'function') {
      window.setupAgentInterface();
    }
  });
  await page.waitForTimeout(100);
  await page.getByTestId('agent-debug-tab-tools').click();
  for (const toolName of requiredTools) {
    await expect(page.getByTestId('agent-debug-tools')).toContainText(toolName);
  }

  const debugHookType = await page.evaluate(() => typeof window.__agentTownPushDebugTraffic);
  expect(debugHookType).toBe('function');
});
