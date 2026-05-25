const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyEnableCollectReadyOutputs,
  applyGrantForemanLease,
  applyRaiseForemanException,
  applyResolveForemanException,
  applyRevokeForemanLease,
  createInitialPlot,
  foremanGovernanceView,
  startForemanSession
} = require('../server/founders_plot/engine');

function mutationCtx(nowMs = 10_000) {
  const events = [];
  return {
    nowMs,
    appendEvent: (event) => events.push({ ...event, createdAt: event.createdAt || nowMs }),
    events
  };
}

test('V2.0 Foreman governance grants and revokes a bounded lease', () => {
  const state = createInitialPlot({ pairId: 'pair_v20_governance', nowMs: 1_000 });
  const runtime = startForemanSession(state, {
    nowMs: 2_000,
    brainReady: true,
    pack: {
      skillLoaded: true,
      heartbeatLoaded: true,
      toolsLoaded: true,
      goalsLoaded: true
    }
  });
  const grantCtx = mutationCtx(3_000);
  const governance = applyGrantForemanLease(state, { durationMinutes: 30 }, grantCtx);
  assert.equal(governance.activeLease.status, 'ACTIVE');
  assert.equal(governance.activeLease.runtimeId, runtime.runtimeId);
  assert.equal(governance.activeLease.requiresUnlockedBrain, true);
  assert.equal(grantCtx.events.some((event) => event.type === 'FOREMAN_LEASE_GRANTED'), true);

  const revokeCtx = mutationCtx(4_000);
  const revoked = applyRevokeForemanLease(state, { reason: 'test revoke' }, revokeCtx);
  assert.equal(revoked.activeLease, null);
  assert.equal(state.meta.foremanRuntime.status, 'PAUSED');
  assert.equal(state.meta.scheduler.collectReadyOutputs.paused, true);
  assert.equal(revokeCtx.events.some((event) => event.type === 'FOREMAN_LEASE_REVOKED'), true);
});

test('V2.0 scheduler enable creates a short governance lease if missing', () => {
  const state = createInitialPlot({ pairId: 'pair_v20_scheduler', nowMs: 1_000 });
  const ctx = mutationCtx(5_000);
  const scheduler = applyEnableCollectReadyOutputs(state, ctx);
  const governance = foremanGovernanceView(state, { nowMs: 5_000 });
  assert.equal(scheduler.collectReadyOutputs.enabled, true);
  assert.equal(governance.activeLease.status, 'ACTIVE');
  assert.equal(governance.activeLease.scope, 'collect_ready_outputs');
  assert.equal(ctx.events.some((event) => event.type === 'FOREMAN_LEASE_GRANTED'), true);
  assert.equal(ctx.events.some((event) => event.type === 'SCHEDULER_ENABLED'), true);
});

test('V2.0 Exception Inbox raises and resolves Foreman review items', () => {
  const state = createInitialPlot({ pairId: 'pair_v20_exception', nowMs: 1_000 });
  const raiseCtx = mutationCtx(6_000);
  const raised = applyRaiseForemanException(state, {
    title: 'Approve lumber spending',
    body: 'Clover wants confirmation before spending reserves.',
    requestedAction: 'spend_wood'
  }, raiseCtx);
  assert.equal(raised.openExceptions.length, 1);
  assert.equal(raised.openExceptions[0].title, 'Approve lumber spending');
  assert.equal(raiseCtx.events.some((event) => event.type === 'FOREMAN_EXCEPTION_RAISED'), true);

  const resolveCtx = mutationCtx(7_000);
  const resolved = applyResolveForemanException(state, {
    exceptionId: raised.openExceptions[0].exceptionId,
    resolution: 'RESOLVED'
  }, resolveCtx);
  assert.equal(resolved.openExceptions.length, 0);
  assert.equal(resolved.resolvedExceptions[0].status, 'RESOLVED');
  assert.equal(resolveCtx.events.some((event) => event.type === 'FOREMAN_EXCEPTION_RESOLVED'), true);
});
