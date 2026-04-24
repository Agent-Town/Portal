const test = require('node:test');
const assert = require('node:assert/strict');
const Access = require('../public/agent_town_access');

test('free and test Brain configs are not production Real Clover by default', () => {
  const free = Access.buildAccessState({
    authenticated: true,
    brainConfigured: true,
    provider: 'openrouter',
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    apiKeySet: true,
    runtimeReady: true
  });
  assert.equal(free.brain.quality, 'preview');
  assert.equal(free.brain.realReady, false);
  assert.equal(free.foundersPlot.mode, 'PREVIEW_CLOVER');
  assert.equal(Access.canRunRealForeman(free), false);

  const testLocal = Access.buildAccessState({
    authenticated: true,
    brainConfigured: true,
    provider: 'test-local',
    model: 'deterministic',
    apiKeySet: true,
    runtimeReady: true
  });
  assert.equal(testLocal.brain.quality, 'test');
  assert.equal(testLocal.brain.realReady, false);
  assert.equal(Access.canRunRealForeman(testLocal), false);
});

test('test Brain can unlock Real Clover only under explicit harness policy', () => {
  const harness = Access.buildAccessState({
    authenticated: true,
    brainConfigured: true,
    provider: 'test-local',
    model: 'deterministic',
    apiKeySet: true,
    runtimeReady: true,
    allowTestBrainForRealClover: true
  });

  assert.equal(harness.brain.quality, 'test');
  assert.equal(harness.brain.realReady, true);
  assert.equal(harness.foundersPlot.mode, 'REAL_CLOVER');
  assert.equal(Access.canRunRealForeman(harness), true);
});

test('non-free provider Brain can unlock Real Clover after runtime readiness', () => {
  const access = Access.buildAccessState({
    authenticated: true,
    brainConfigured: true,
    provider: 'openrouter',
    model: 'anthropic/claude-sonnet-4-5',
    apiKeySet: true,
    runtimeReady: true
  });

  assert.equal(access.brain.quality, 'real');
  assert.equal(access.brain.realReady, true);
  assert.equal(access.foundersPlot.mode, 'REAL_CLOVER');
  assert.equal(Access.canRunRealForeman(access), true);
});
