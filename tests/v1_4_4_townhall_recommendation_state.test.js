const test = require('node:test');
const assert = require('node:assert/strict');
const Access = require('../public/agent_town_access');

test('Town Hall recommendation is non-blocking after progression', () => {
  const state = {
    onboarding: {
      required: true,
      registrationComplete: false
    },
    plot: { hqLevel: 2 }
  };
  const access = Access.buildAccessState({
    authenticated: true,
    brainConfigured: false,
    runtimeReady: false,
    state
  });

  assert.equal(access.townHall.recommended, true);
  assert.equal(access.townHall.recommendedReason, 'HQ2_REACHED');
  assert.equal(access.foundersPlot.playable, true);
  assert.equal(Access.canOpenDistrict('founders-plot', access, state), true);
});
