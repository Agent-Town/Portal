const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyCreatorNoticeKioskPostNotice,
  applyDisableCreatorBuilding,
  applyInstallCreatorBuilding,
  applyRemoveCreatorBuilding,
  createInitialPlot,
  creatorExtensionsView,
  prepareLoadedState,
  stateView
} = require('../server/founders_plot/engine');
const {
  CREATOR_EXTENSION_MANIFESTS,
  validateCreatorManifest,
  validateCreatorToolInput
} = require('../server/founders_plot/creator_extensions');

function mutationCtx(nowMs = 10_000) {
  const events = [];
  return {
    nowMs,
    appendEvent: (event) => events.push({ ...event, seq: events.length + 1, createdAt: event.createdAt || nowMs }),
    events
  };
}

function makeCreatorReadyState() {
  const state = createInitialPlot({ pairId: 'pair_v45_creator', nowMs: 1_000 });
  state.plot.hqLevel = 2;
  state.plot.townXp = 50;
  state.plot.inventory = { wood: 12, stone: 0, food: 8, coin: 25 };
  stateView(state, []);
  return state;
}

function coreSnapshot(state) {
  return {
    hqLevel: state.plot.hqLevel,
    inventory: { ...state.plot.inventory },
    buildingCount: state.buildings.length,
    buildingTypes: state.buildings.map((building) => building.type).sort(),
    permissions: { ...state.policy },
    settlementCount: Object.keys(state.meta.settlements || {}).length,
    regionalRouteCount: Object.keys(state.meta.regionalNetwork?.routes || {}).length
  };
}

test('V4.5 creator manifest validation rejects unsafe extension capabilities', () => {
  const manifest = CREATOR_EXTENSION_MANIFESTS[0];
  const validation = validateCreatorManifest(manifest);
  assert.equal(validation.ok, true);
  assert.equal(manifest.source.importMode, 'curated_local_pack');
  assert.equal(manifest.source.externalUpload, false);
  assert.equal(manifest.assetGovernance.status, 'APPROVED');
  assert.equal(manifest.assetGovernance.promptProvenanceRequired, true);
  assert.equal(manifest.creatorEconomics.revenueEnabled, false);

  const unsafe = JSON.parse(JSON.stringify(manifest));
  unsafe.moderation.networkAccess = true;
  unsafe.moderation.forbiddenData = ['brain'];
  unsafe.source.externalUpload = true;
  unsafe.assetGovernance.promptProvenanceRequired = false;
  unsafe.creatorEconomics.revenueEnabled = true;
  unsafe.tools[0].inputSchema.required = ['text'];
  const unsafeValidation = validateCreatorManifest(unsafe);
  assert.equal(unsafeValidation.ok, false);
  assert.ok(unsafeValidation.errors.some((entry) => /networkAccess/.test(entry)));
  assert.ok(unsafeValidation.errors.some((entry) => /forbiddenData missing wallet/.test(entry)));
  assert.ok(unsafeValidation.errors.some((entry) => /externalUpload/.test(entry)));
  assert.ok(unsafeValidation.errors.some((entry) => /promptProvenanceRequired/.test(entry)));
  assert.ok(unsafeValidation.errors.some((entry) => /revenueEnabled/.test(entry)));
  assert.ok(unsafeValidation.errors.some((entry) => /idempotencyKey/.test(entry)));
});

test('V4.5 creator catalog is gated until HQ2 and installs only approved buildings', () => {
  const state = createInitialPlot({ pairId: 'pair_v45_gate', nowMs: 1_000 });
  const lockedView = creatorExtensionsView(state);
  assert.equal(lockedView.catalog[0].gate.ready, false);
  assert.deepEqual(lockedView.catalog[0].allowedActions, []);
  assert.throws(
    () => applyInstallCreatorBuilding(state, { extensionId: 'creator.notice-kiosk' }, mutationCtx(2_000)),
    /CREATOR_GATE_REQUIRED/
  );

  state.plot.hqLevel = 2;
  const installed = applyInstallCreatorBuilding(state, { extensionId: 'creator.notice-kiosk' }, mutationCtx(3_000));
  assert.equal(installed.installation.extensionId, 'creator.notice-kiosk');
  assert.equal(installed.installation.objectId, 'CREATOR_NOTICE_KIOSK');
  assert.equal(installed.creatorExtensions.installed[0].active, true);
  assert.ok(installed.creatorExtensions.catalog[0].allowedActions.includes('post_notice'));
  assert.equal(installed.creatorExtensions.catalog[0].source.importMode, 'curated_local_pack');
  assert.equal(installed.creatorExtensions.catalog[0].assetGovernance.status, 'APPROVED');
  assert.equal(installed.creatorExtensions.catalog[0].creatorEconomics.creditModel, 'credit_only_v1');
});

test('V4.5 Notice Kiosk mutates typed creator state and rejects private text', () => {
  const state = makeCreatorReadyState();
  applyInstallCreatorBuilding(state, { extensionId: 'creator.notice-kiosk' }, mutationCtx(2_000));
  const beforeCore = coreSnapshot(state);

  const posted = applyCreatorNoticeKioskPostNotice(state, {
    text: 'Welcome builders to the ridge road.'
  }, mutationCtx(3_000));

  assert.equal(posted.notice.noticeCount, 1);
  assert.equal(posted.notice.featuredNotice, 'Welcome builders to the ridge road.');
  assert.deepEqual(coreSnapshot(state), beforeCore);
  assert.throws(
    () => applyCreatorNoticeKioskPostNotice(state, {
      text: 'wallet token sk-test-private should not post'
    }, mutationCtx(4_000)),
    /CREATOR_TOOL_MODERATION_FAILED/
  );
});

test('V4.5 creator disable and remove are safe rollbacks for core town truth', () => {
  const state = makeCreatorReadyState();
  applyInstallCreatorBuilding(state, { extensionId: 'creator.notice-kiosk' }, mutationCtx(2_000));
  applyCreatorNoticeKioskPostNotice(state, { text: 'Town notice stays in creator state.' }, mutationCtx(3_000));
  const beforeCore = coreSnapshot(state);

  const disabled = applyDisableCreatorBuilding(state, { extensionId: 'creator.notice-kiosk' }, mutationCtx(4_000));
  assert.equal(disabled.creatorExtensions.installed[0].status, 'DISABLED');
  assert.deepEqual(coreSnapshot(state), beforeCore);
  assert.throws(
    () => applyCreatorNoticeKioskPostNotice(state, { text: 'Should not post while disabled.' }, mutationCtx(5_000)),
    /CREATOR_INSTALLATION_REQUIRED/
  );

  const removed = applyRemoveCreatorBuilding(state, { extensionId: 'creator.notice-kiosk' }, mutationCtx(6_000));
  assert.equal(removed.creatorExtensions.installed.length, 0);
  assert.deepEqual(coreSnapshot(state), beforeCore);
});

test('V4.5 creator tool input validator requires idempotency and public-safe text', () => {
  const manifest = CREATOR_EXTENSION_MANIFESTS[0];
  const valid = validateCreatorToolInput(manifest, 'et.creator.notice_kiosk.post_notice', {
    text: 'Market road opens at noon.',
    idempotencyKey: 'notice:1'
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.args.text, 'Market road opens at noon.');

  assert.equal(validateCreatorToolInput(manifest, 'et.creator.notice_kiosk.post_notice', {
    text: 'Market road opens at noon.'
  }).error, 'INVALID_STATE');
  assert.equal(validateCreatorToolInput(manifest, 'et.creator.notice_kiosk.post_notice', {
    text: 'provider model token',
    idempotencyKey: 'notice:2'
  }).error, 'CREATOR_TOOL_MODERATION_FAILED');
});

test('V4.5 creator state restores from loaded account state', () => {
  const old = makeCreatorReadyState();
  old.meta.schemaVersion = 12;
  old.meta.creatorExtensions = undefined;

  const migrated = prepareLoadedState(old);
  assert.equal(migrated.fromVersion, 12);
  assert.equal(migrated.toVersion, 14);
  const view = creatorExtensionsView(migrated.state);
  assert.equal(view.version, 'v4.5');
  assert.equal(view.catalog[0].extensionId, 'creator.notice-kiosk');
});
