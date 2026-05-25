const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyAssignSpecialist,
  applyPauseSpecialist,
  applyReviewSpecialistRecommendation,
  createInitialPlot,
  prepareLoadedState,
  specialistsView,
  stateView
} = require('../server/founders_plot/engine');
const { buildRecap } = require('../server/founders_plot/recap');

function mutationCtx(nowMs = 10_000) {
  const events = [];
  return {
    nowMs,
    appendEvent: (event) => events.push({ ...event, seq: events.length + 1, createdAt: event.createdAt || nowMs }),
    events
  };
}

function makeSpecialistReadyState() {
  const state = createInitialPlot({ pairId: 'pair_v31_specialists', nowMs: 1_000 });
  state.plot.hqLevel = 2;
  state.meta.operatingModel.selectedCharterId = 'STEADY_COMMONS';
  state.meta.operatingModel.selectedAtMs = 2_000;
  state.meta.governance.persistent = {
    runtimeId: 'pfr_ready',
    status: 'ACTIVE',
    scope: 'collect_ready_outputs',
    authorizationId: 'pfa_ready',
    authorizedBy: 'HUMAN_UNLOCKED_BRAIN',
    requiresUnlockedBrain: true,
    startedAtMs: 2_000,
    pausedAtMs: 0,
    expiresAtMs: 120_000,
    lastTickAtMs: 3_000,
    nextTickAtMs: 60_000,
    actionCount: 1,
    lastResult: { reason: 'COLLECTED_READY_OUTPUT' },
    lastErrorCode: ''
  };
  return state;
}

test('V3.1 specialist staffing is gated behind charter and trusted Foreman routine', () => {
  const state = createInitialPlot({ pairId: 'pair_v31_gate', nowMs: 1_000 });
  const view = specialistsView(state, { nowMs: 2_000 });

  assert.equal(view.gate.ready, false);
  assert.equal(view.allowedActions.includes('assign'), false);
  assert.throws(
    () => applyAssignSpecialist(state, {
      roleId: 'BUILDER_FOREMAN',
      domainId: 'construction'
    }, mutationCtx(3_000)),
    /SPECIALIST_GATE_REQUIRED/
  );
});

test('V3.1 assigns, pauses, and reassigns bounded specialist lanes', () => {
  const state = makeSpecialistReadyState();
  const assignCtx = mutationCtx(4_000);
  const assigned = applyAssignSpecialist(state, {
    roleId: 'BUILDER_FOREMAN',
    domainId: 'construction'
  }, assignCtx);

  const builder = assigned.specialists.roles.find((role) => role.roleId === 'BUILDER_FOREMAN');
  assert.equal(builder.active, true);
  assert.equal(builder.domainId, 'construction');
  assert.deepEqual(builder.allowedTools, ['et.plot.place_building', 'et.plot.upgrade_building']);
  assert.equal(assignCtx.events.some((event) => event.type === 'SPECIALIST_ASSIGNED'), true);

  const paused = applyPauseSpecialist(state, { roleId: 'BUILDER_FOREMAN' }, mutationCtx(5_000));
  assert.equal(paused.specialists.roles.find((role) => role.roleId === 'BUILDER_FOREMAN').paused, true);

  const reassigned = applyAssignSpecialist(state, {
    roleId: 'BUILDER_FOREMAN',
    domainId: 'public_works'
  }, mutationCtx(6_000));
  const nextBuilder = reassigned.specialists.roles.find((role) => role.roleId === 'BUILDER_FOREMAN');
  assert.equal(nextBuilder.active, true);
  assert.equal(nextBuilder.domainId, 'public_works');
  assert.deepEqual(nextBuilder.allowedTools, ['et.plot.town.upgrade_landmark', 'et.plot.scenarios.contribute']);
});

test('V3.1 specialist domain permissions are enforced', () => {
  const state = makeSpecialistReadyState();
  applyAssignSpecialist(state, {
    roleId: 'BUILDER_FOREMAN',
    domainId: 'construction'
  }, mutationCtx(4_000));

  assert.throws(
    () => applyReviewSpecialistRecommendation(state, {
      roleId: 'BUILDER_FOREMAN',
      domainId: 'construction',
      toolName: 'et.plot.collect_outputs',
      targetObjectId: 'LUMBER_CAMP',
      summary: 'Collect wood from the lumber lane.'
    }, mutationCtx(5_000)),
    /SPECIALIST_DOMAIN_VIOLATION/
  );
});

test('V3.1 conflicting specialist recommendations route to the Exception Inbox and recap distinctly', () => {
  const state = makeSpecialistReadyState();
  const events = [];
  const ctx = {
    nowMs: 4_000,
    appendEvent: (event) => events.push({ ...event, seq: events.length + 1, createdAt: event.createdAt || 4_000 })
  };
  applyAssignSpecialist(state, {
    roleId: 'BUILDER_FOREMAN',
    domainId: 'construction'
  }, ctx);
  applyAssignSpecialist(state, {
    roleId: 'QUARTERMASTER',
    domainId: 'supplies'
  }, ctx);
  const first = applyReviewSpecialistRecommendation(state, {
    roleId: 'BUILDER_FOREMAN',
    domainId: 'construction',
    toolName: 'et.plot.upgrade_building',
    targetObjectId: 'HQ',
    summary: 'Start the next Headquarters upgrade.'
  }, ctx);
  assert.equal(first.conflict, null);

  const second = applyReviewSpecialistRecommendation(state, {
    roleId: 'QUARTERMASTER',
    domainId: 'supplies',
    toolName: 'et.plot.collect_outputs',
    targetObjectId: 'HQ',
    summary: 'Collect reserves before spending on HQ.'
  }, ctx);
  assert.ok(second.conflict);

  const view = stateView(state, events);
  assert.equal(view.foreman.governance.openExceptions.length, 1);
  assert.equal(view.foreman.specialists.conflicts.length, 1);
  assert.equal(events.some((event) => event.type === 'SPECIALIST_CONFLICT_RAISED'), true);

  const recap = buildRecap(events, { afterSeq: 0, limit: 12 });
  const cloverLines = recap.sections.find((section) => section.title === 'What Clover did').lines;
  const decisionLines = recap.sections.find((section) => section.title === 'What needs your decision now').lines;
  assert.ok(cloverLines.some((line) => /Builder Foreman recommended/.test(line.line)));
  assert.ok(decisionLines.some((line) => /Specialists need your decision/.test(line.line)));
});

test('V3.1 specialist state restores from loaded account or agent backup state', () => {
  const old = makeSpecialistReadyState();
  old.meta.schemaVersion = 10;
  old.meta.specialists = {
    roles: {
      BUILDER_FOREMAN: {
        roleId: 'BUILDER_FOREMAN',
        status: 'ACTIVE',
        domainId: 'construction',
        assignedAtMs: 4_000
      }
    },
    recommendations: [{
      recommendationId: 'spr_backup',
      roleId: 'BUILDER_FOREMAN',
      domainId: 'construction',
      toolName: 'et.plot.upgrade_building',
      targetObjectId: 'HQ',
      summary: 'Backup kept the build lane.',
      status: 'OPEN',
      createdAtMs: 5_000
    }]
  };

  const migrated = prepareLoadedState(old);
  assert.equal(migrated.fromVersion, 10);
  assert.equal(migrated.toVersion, 14);
  const view = specialistsView(migrated.state, { nowMs: 6_000 });
  const builder = view.roles.find((role) => role.roleId === 'BUILDER_FOREMAN');
  assert.equal(builder.active, true);
  assert.equal(builder.domainId, 'construction');
  assert.equal(view.recommendations[0].recommendationId, 'spr_backup');
});
