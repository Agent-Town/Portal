const crypto = require('crypto');
const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

function sha256PrefixedHex(input) {
  return `sha256:${crypto.createHash('sha256').update(String(input || ''), 'utf8').digest('hex')}`;
}

function decodePromptXmlEntities(value = '') {
  return String(value || '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}

function parseAvailableSkills(skillsPrompt = '') {
  const text = String(skillsPrompt || '');
  const entries = [];
  const blockRe = /<skill>\s*<name>([\s\S]*?)<\/name>\s*<description>([\s\S]*?)<\/description>\s*<location>([\s\S]*?)<\/location>\s*<\/skill>/g;
  for (const match of text.matchAll(blockRe)) {
    entries.push({
      name: decodePromptXmlEntities(match?.[1] || '').trim(),
      description: decodePromptXmlEntities(match?.[2] || '').trim(),
      location: decodePromptXmlEntities(match?.[3] || '').trim(),
    });
  }
  return entries;
}

async function postJsonInPage(page, url, { headers = {}, body = null } = {}) {
  return await page.evaluate(async ({ nextUrl, nextHeaders, nextBody }) => {
    const response = await fetch(nextUrl, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        ...nextHeaders,
      },
      body: JSON.stringify(nextBody && typeof nextBody === 'object' ? nextBody : {}),
    });
    return {
      status: response.status,
      json: await response.json().catch(() => null),
    };
  }, {
    nextUrl: String(url || ''),
    nextHeaders: headers && typeof headers === 'object' ? headers : {},
    nextBody: body && typeof body === 'object' ? body : {},
  });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.4: House Library skill pack compiles, routes deterministically, and injects active scope into prompt preview', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_skill_pack_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig.ok).toBe(true);

  const publicSkillResp = await request.get('/skill.md');
  expect(publicSkillResp.ok()).toBe(true);
  const publicSkillText = await publicSkillResp.text();

  const defaultPackResp = await request.get('/api/platform/default-skill-pack');
  expect(defaultPackResp.ok()).toBe(true);
  const defaultPackBody = await defaultPackResp.json();
  expect(String(defaultPackBody?.data?.sourceRefs?.[0]?.hash || '')).toBe(sha256PrefixedHex(publicSkillText));

  const libraryPackResp = await request.get('/api/platform/library/skill-pack');
  expect(libraryPackResp.ok()).toBe(true);
  const libraryPackBody = await libraryPackResp.json();
  expect(libraryPackBody?.data).toMatchObject({
    specializedSkills: [
      'House Librarian',
      'Archive Clerk',
      'Workshop Scribe',
      'Registry Curator',
    ],
  });
  expect(String(libraryPackBody?.data?.packVersionId || '')).toMatch(/^packv_/);
  expect(String(libraryPackBody?.data?.contentHash || '')).toMatch(/^sha256:/);
  expect(Object.keys(libraryPackBody?.data?.fileHashes || {}).sort()).toEqual([
    'rules.md',
    'skill.md',
    'skills/archive-clerk/skill.md',
    'skills/librarian/skill.md',
    'skills/registry-curator/skill.md',
    'skills/workshop-scribe/skill.md',
  ]);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const itemAResponse = await postJsonInPage(page, '/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-skill-pack-item-a',
    },
    body: {
      itemType: 'fact_note',
      title: 'Modal Continuity',
      summary: 'Atlas stays modal-first in the town shell.',
      contentText: 'Keep the worker in /app so live continuity is preserved.',
      sourceKind: 'trace',
      sourceRef: 'trace_skill_pack_item_a',
    },
  });
  expect(itemAResponse.status).toBe(201);
  const itemA = itemAResponse.json;

  const itemBResponse = await postJsonInPage(page, '/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-skill-pack-item-b',
    },
    body: {
      itemType: 'playbook',
      title: 'Registry Prep',
      summary: 'Only publish artifacts after the human opts in.',
      contentText: 'Registry work is later and opt-in only.',
      sourceKind: 'conversation_excerpt',
      sourceRef: 'conv_skill_pack_item_b#msg_01',
    },
  });
  expect(itemBResponse.status).toBe(201);
  const itemB = itemBResponse.json;

  const itemCResponse = await postJsonInPage(page, '/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-skill-pack-item-c',
    },
    body: {
      itemType: 'playbook',
      title: 'Reading Table Rule',
      summary: 'Only scoped Library items are in play for the current chat.',
      contentText: 'The human controls what is in scope.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/reading-table.md',
    },
  });
  expect(itemCResponse.status).toBe(201);
  const itemC = itemCResponse.json;

  const itemAId = String(itemA?.data?.item?.libraryItemId || '');
  const itemBId = String(itemB?.data?.item?.libraryItemId || '');
  const itemCId = String(itemC?.data?.item?.libraryItemId || '');
  expect(itemAId).toMatch(/^lib_/);
  expect(itemBId).toMatch(/^lib_/);
  expect(itemCId).toMatch(/^lib_/);

  const scopeResp = await postJsonInPage(page, '/api/platform/library/scope', {
    body: {
      title: 'Reading Table',
      itemIds: [itemCId, itemAId],
    },
  });
  expect(scopeResp.status).toBe(200);
  const scopeBody = scopeResp.json;
  const activeScopeSetId = String(scopeBody?.data?.activeScopeSetId || '');
  expect(activeScopeSetId).toMatch(/^scope_/);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-selected')).toContainText('Reading Table Rule');
  await expect(page.getByTestId('house-library-selected')).toContainText('Modal Continuity');
  await expect(page.getByTestId('house-library-selected')).not.toContainText('Registry Prep');

  const routerSkillResp = await request.get('/__compiled/library-skill-pack/skill.md');
  expect(routerSkillResp.ok()).toBe(true);
  expect(await routerSkillResp.text()).toContain('Use exactly one specialized skill before acting');

  const librarianSkillResp = await request.get('/__compiled/library-skill-pack/skills/librarian/skill.md');
  expect(librarianSkillResp.ok()).toBe(true);
  const librarianSkillText = await librarianSkillResp.text();
  expect(librarianSkillText).toContain('house_library_list_items');
  expect(librarianSkillText).toContain('house_library_set_scope');

  const workshopSkillResp = await request.get('/__compiled/library-skill-pack/skills/workshop-scribe/skill.md');
  expect(workshopSkillResp.ok()).toBe(true);
  const workshopSkillText = await workshopSkillResp.text();
  expect(workshopSkillText).toContain('workspace_list');
  expect(workshopSkillText).toContain('workspace_edit_file');

  const runtimeSummary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.visitExperience({ url: '/__compiled/library-skill-pack/skill.md' });
    const previewA = await api.systemPromptPreview();
    const previewB = await api.systemPromptPreview();
    const toolRegistry = await api.getToolRegistryInfo();
    const libraryList = await api.invokeLiteTool({ tool: 'house_library_list_items', params: {} });
    const privateRouteA = await api.librarySkillRoutePreview({
      text: 'Make sure the agent knows the modal continuity rule for this chat.',
    });
    const privateRouteB = await api.librarySkillRoutePreview({
      text: 'Make sure the agent knows the modal continuity rule for this chat.',
    });
    const workshopRoute = await api.librarySkillRoutePreview({
      text: 'Open Workshop, edit the file, and show me the diff before saving.',
    });
    return {
      previewA,
      previewB,
      toolRegistry,
      libraryList,
      privateRouteA,
      privateRouteB,
      workshopRoute,
    };
  });

  expect(runtimeSummary?.toolRegistry?.names).toEqual(expect.arrayContaining([
    'house_library_create_item',
    'house_library_list_items',
    'house_library_read_scope',
    'house_library_set_scope',
  ]));
  expect(runtimeSummary?.libraryList?.ok).toBe(true);
  expect(runtimeSummary?.libraryList?.data?.items?.length || 0).toBe(3);

  const previewA = runtimeSummary?.previewA?.data || runtimeSummary?.previewA || {};
  const previewB = runtimeSummary?.previewB?.data || runtimeSummary?.previewB || {};
  expect(previewA.libraryScope).toMatchObject({
    activeScopeSetId,
    selectedItemIds: [itemCId, itemAId],
  });
  expect(previewB.libraryScope).toEqual(previewA.libraryScope);
  expect(Array.isArray(previewA.contextFilePaths)).toBe(true);
  expect(previewA.contextFilePaths).toContain('house-library/scope.md');
  expect(String(previewA.systemPrompt || '')).toContain('## house-library/scope.md');
  expect(String(previewA.systemPrompt || '')).toContain(activeScopeSetId);
  expect(String(previewA.systemPrompt || '')).toContain(itemAId);
  expect(String(previewA.systemPrompt || '')).toContain(itemCId);
  expect(String(previewA.systemPrompt || '')).not.toContain(itemBId);
  expect(String(previewA.systemPrompt || '')).not.toContain('Registry Prep');

  const availableSkills = parseAvailableSkills(previewA.skillsPrompt || '');
  const availableSkillNames = availableSkills.map((entry) => entry.name);
  expect(availableSkillNames).toEqual(expect.arrayContaining([
    'house-library-router',
    'House Librarian',
    'Archive Clerk',
    'Workshop Scribe',
    'Registry Curator',
  ]));

  expect(runtimeSummary?.privateRouteA?.data || runtimeSummary?.privateRouteA).toMatchObject({
    selectedSkillName: 'House Librarian',
  });
  expect(runtimeSummary?.privateRouteB?.data || runtimeSummary?.privateRouteB).toEqual(runtimeSummary?.privateRouteA?.data || runtimeSummary?.privateRouteA);
  expect(runtimeSummary?.workshopRoute?.data || runtimeSummary?.workshopRoute).toMatchObject({
    selectedSkillName: 'Workshop Scribe',
  });
});
