const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  getPlatformFixture,
  getPlatformInspector,
  getPlatformStats,
  listPlatformFixtures,
} = require('./helpers/unified_platform');

const REQUIRED_FAMILIES = [
  'library_authoring_seed',
  'library_revision_seed',
  'library_conversation_capture_seed',
  'library_shelf_seed',
  'library_satchel_seed',
  'library_registry_browse_seed',
  'library_guided_exchange_seed',
  'library_copy_a11y_seed',
  'library_skill_contract_v2_seed',
  'library_benchmark_seed',
  'library_guided_flow_seed',
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M30.0: unified platform harness exposes deterministic House Library authoring fixtures and inspectors', async ({ request }) => {
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
    library: true,
    revisions: true,
    conversationArtifacts: true,
    shelves: true,
    scopes: true,
    publications: true,
    promptPreview: true,
    editor: true,
    registryPreview: true,
    benchmarks: true,
  }));
  expect(String(statsA.stats?.fixtureManifestHash || '')).toMatch(/^sha256:/);
  expect(statsA.stats?.counts).toEqual(expect.objectContaining({
    library_items: 0,
    library_item_revisions: 0,
    library_links: 0,
    conversation_artifacts: 0,
    library_shelves: 0,
    library_shelf_items: 0,
    scope_sets: 0,
    scope_set_items: 0,
    library_publications: 0,
  }));

  const authoringFixture = await getPlatformFixture(request, 'library_authoring_seed');
  expect(authoringFixture?.ok).toBe(true);
  expect(authoringFixture?.fixture?.houseId).toBe('house_library_authoring_alpha');
  expect(authoringFixture?.fixture?.composer).toEqual(expect.objectContaining({
    deskLabel: 'Librarian Desk',
    titleLabel: 'Title',
  }));

  const browseFixture = await getPlatformFixture(request, 'library_registry_browse_seed');
  expect(browseFixture?.ok).toBe(true);
  expect(browseFixture?.fixture?.browse).toEqual(expect.objectContaining({
    query: 'atlas',
    family: 'skill',
    expectedResultCount: 2,
  }));

  const guidedFixture = await getPlatformFixture(request, 'library_guided_flow_seed');
  expect(guidedFixture?.ok).toBe(true);
  expect(guidedFixture?.fixture?.smoke).toEqual(expect.objectContaining({
    authoring: true,
    capture: true,
    shelves: true,
    registry: true,
  }));

  const revisionsInspector = await getPlatformInspector(request, 'revisions');
  expect(revisionsInspector.status).toBe(200);
  expect(revisionsInspector.json).toMatchObject({
    ok: true,
    inspector: 'revisions',
    data: {
      revisions: [],
      latestByItem: {},
    },
  });

  const conversationInspector = await getPlatformInspector(request, 'conversation-artifacts');
  expect(conversationInspector.status).toBe(200);
  expect(conversationInspector.json).toMatchObject({
    ok: true,
    inspector: 'conversation-artifacts',
    data: {
      artifacts: [],
    },
  });

  const shelvesInspector = await getPlatformInspector(request, 'shelves');
  expect(shelvesInspector.status).toBe(200);
  expect(shelvesInspector.json).toMatchObject({
    ok: true,
    inspector: 'shelves',
    data: {
      shelves: [],
    },
  });

  const registryPreviewInspector = await getPlatformInspector(request, 'registry-preview');
  expect(registryPreviewInspector.status).toBe(200);
  expect(registryPreviewInspector.json).toMatchObject({
    ok: true,
    inspector: 'registry-preview',
    data: {
      query: '',
      family: '',
      resultCount: 0,
      selectedRegistryId: null,
      preview: null,
    },
  });

  const benchmarkInspector = await getPlatformInspector(request, 'benchmarks');
  expect(benchmarkInspector.status).toBe(200);
  expect(benchmarkInspector.json).toMatchObject({
    ok: true,
    inspector: 'benchmarks',
    data: {
      runId: null,
      metrics: {},
      scenarios: [],
      outputHash: '',
    },
  });
});
