const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  getPlatformFixture,
  getPlatformStats,
  listPlatformFixtures,
} = require('./helpers/unified_platform');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

const REQUIRED_FAMILIES = [
  'library_private_seed',
  'library_item_link_seed',
  'library_scope_seed',
  'library_prompt_scope_seed',
  'library_workshop_seed',
  'library_trace_promotion_seed',
  'library_publish_seed',
  'library_import_seed',
  'library_seal_seed',
  'library_skill_pack_seed',
  'library_full_smoke_seed',
];

async function readInspector(request, inspector) {
  const response = await request.get(`/__test__/unified-platform/inspect/${encodeURIComponent(String(inspector || ''))}`, {
    headers: { 'x-test-reset': resetToken },
    failOnStatusCode: false,
  });
  return {
    status: response.status(),
    json: await response.json(),
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.0: unified platform harness exposes deterministic Library fixture families and observability', async ({ request }) => {
  const listed = await listPlatformFixtures(request);
  expect(listed?.ok).toBe(true);
  expect(Array.isArray(listed?.families)).toBe(true);
  expect(listed.families).toEqual(expect.arrayContaining(REQUIRED_FAMILIES));

  const statsA = await getPlatformStats(request);
  const statsB = await getPlatformStats(request);
  expect(statsA?.ok).toBe(true);
  expect(statsB?.ok).toBe(true);
  expect(statsA.stats).toEqual(statsB.stats);
  expect(statsA.stats?.fixtureFamilies).toEqual(expect.arrayContaining(REQUIRED_FAMILIES));
  expect(statsA.stats?.inspectors).toEqual(expect.objectContaining({
    artifacts: true,
    seals: true,
    house: true,
    tracks: true,
    library: true,
    scopes: true,
    publications: true,
    promptPreview: true,
    editor: true,
  }));
  expect(String(statsA.stats?.fixtureManifestHash || '')).toMatch(/^sha256:/);
  expect(statsA.stats?.counts).toEqual(expect.objectContaining({
    library_items: 0,
    library_links: 0,
    scope_sets: 0,
    scope_set_items: 0,
    library_publications: 0,
  }));

  const privateFixture = await getPlatformFixture(request, 'library_private_seed');
  expect(privateFixture?.ok).toBe(true);
  expect(privateFixture?.fixture?.houseId).toBe('house_library_fixture_alpha');

  const skillFixture = await getPlatformFixture(request, 'library_skill_pack_seed');
  expect(skillFixture?.ok).toBe(true);
  expect(Array.isArray(skillFixture?.fixture?.specializedSkills)).toBe(true);
  expect(skillFixture.fixture.specializedSkills).toEqual([
    'House Librarian',
    'Archive Clerk',
    'Workshop Scribe',
    'Registry Curator',
  ]);

  const smokeFixture = await getPlatformFixture(request, 'library_full_smoke_seed');
  expect(smokeFixture?.ok).toBe(true);
  expect(smokeFixture?.fixture?.smoke).toEqual(expect.objectContaining({
    library: true,
    workshop: true,
    registry: true,
  }));

  const libraryInspector = await readInspector(request, 'library');
  expect(libraryInspector.status).toBe(200);
  expect(libraryInspector.json).toMatchObject({
    ok: true,
    inspector: 'library',
    data: {
      items: [],
      links: [],
    },
  });

  const scopesInspector = await readInspector(request, 'scopes');
  expect(scopesInspector.status).toBe(200);
  expect(scopesInspector.json).toMatchObject({
    ok: true,
    inspector: 'scopes',
    data: {
      scopeSets: [],
      activeScopeSetId: null,
      orderedItemIds: [],
    },
  });

  const promptPreviewInspector = await readInspector(request, 'prompt-preview');
  expect(promptPreviewInspector.status).toBe(200);
  expect(promptPreviewInspector.json).toMatchObject({
    ok: true,
    inspector: 'prompt-preview',
    data: {
      activeScopeSetId: null,
      selectedItemIds: [],
    },
  });

  const editorInspector = await readInspector(request, 'editor');
  expect(editorInspector.status).toBe(200);
  expect(editorInspector.json).toMatchObject({
    ok: true,
    inspector: 'editor',
    data: {
      openFilePath: null,
      writeEvents: [],
    },
  });
});
