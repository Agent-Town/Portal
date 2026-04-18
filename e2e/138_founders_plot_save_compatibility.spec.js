const { DatabaseSync } = require('node:sqlite');
const { test, expect } = require('@playwright/test');
const { getStorePath } = require('../server/store');
const {
  FOUNDERS_PLOT_SCHEMA_VERSION,
  createInitialPlot,
  stateView
} = require('../server/founders_plot/engine');
const { loadPlotByPairId, savePlotGraph } = require('../server/founders_plot/store');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

function readRawMetaForPair(pairId) {
  const db = new DatabaseSync(getStorePath());
  try {
    const row = db.prepare('SELECT meta_json FROM founder_plots WHERE pair_id = ? LIMIT 1').get(pairId);
    return row?.meta_json ? JSON.parse(row.meta_json) : null;
  } finally {
    db.close?.();
  }
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('legacy plot saves migrate to the current schema and preserve additive extension metadata', async () => {
  const pairId = `compat:legacy-save:${Date.now()}`;
  const legacyState = createInitialPlot({
    pairId,
    houseId: 'house_legacy_save',
    nowMs: 1_713_456_000_000
  });
  delete legacyState.meta.schemaVersion;
  legacyState.meta.publicHeadline = 'Legacy founders headline';
  legacyState.meta.futureQuestPreview = { step: 'dockyard_preview', unlockAt: 6 };
  legacyState.meta.storyFlags = { season: 1, mayorIntroSeen: true };
  savePlotGraph(legacyState);

  const rawBeforeMigration = readRawMetaForPair(pairId);
  expect(rawBeforeMigration?.schemaVersion).toBeUndefined();
  expect(rawBeforeMigration?.futureQuestPreview?.step).toBe('dockyard_preview');

  const loadedState = loadPlotByPairId(pairId);
  expect(loadedState?.meta?.schemaVersion).toBe(FOUNDERS_PLOT_SCHEMA_VERSION);
  expect(loadedState?.meta?.publicHeadline).toBe('Legacy founders headline');
  expect(loadedState?.meta?.extensions).toEqual(expect.objectContaining({
    futureQuestPreview: { step: 'dockyard_preview', unlockAt: 6 },
    storyFlags: { season: 1, mayorIntroSeen: true }
  }));

  const payload = stateView(loadedState, []);
  expect(payload?.compatibility?.schemaVersion).toBe(FOUNDERS_PLOT_SCHEMA_VERSION);

  const rawAfterMigration = readRawMetaForPair(pairId);
  expect(rawAfterMigration?.schemaVersion).toBe(FOUNDERS_PLOT_SCHEMA_VERSION);
  expect(rawAfterMigration?.extensions).toEqual(expect.objectContaining({
    futureQuestPreview: { step: 'dockyard_preview', unlockAt: 6 },
    storyFlags: { season: 1, mayorIntroSeen: true }
  }));
  expect(rawAfterMigration).not.toHaveProperty('futureQuestPreview');
  expect(rawAfterMigration).not.toHaveProperty('storyFlags');
});
