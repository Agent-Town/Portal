const test = require('node:test');
const assert = require('node:assert/strict');
const Access = require('../public/agent_town_access');

test('access state decouples Founders Plot playability from full onboarding', () => {
  const access = Access.buildAccessState({
    authenticated: true,
    brainConfigured: false,
    runtimeReady: false,
    state: {
      onboarding: {
        required: true,
        registrationComplete: false,
        step: 'townhall_profile'
      },
      signup: { complete: false },
      houseId: null
    }
  });

  assert.equal(access.foundersPlot.playable, true);
  assert.equal(access.foundersPlot.blockedReason, '');
  assert.equal(access.foundersPlot.mode, 'MANUAL_FOUNDER');
  assert.equal(access.brain.requiredForRealForeman, true);
  assert.equal(access.brain.configured, false);
  assert.equal(access.clover.guideAvailable, true);
  assert.equal(access.clover.realForemanAvailable, false);
  assert.equal(access.townHall.complete, false);
});
