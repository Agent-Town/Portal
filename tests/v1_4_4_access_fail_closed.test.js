const test = require('node:test');
const assert = require('node:assert/strict');
const Access = require('../public/agent_town_access');

test('access helper fails closed when auth is unknown', () => {
  const access = Access.buildAccessState();

  assert.equal(access.authenticated, false);
  assert.equal(access.foundersPlot.playable, false);
  assert.equal(access.foundersPlot.blockedReason, 'AUTH_REQUIRED');
  assert.equal(access.clover.guideAvailable, false);
  assert.equal(Access.canOpenDistrict('founders-plot', access, {}), false);
});

test('play-first access is explicit when auth is known', () => {
  const access = Access.buildAccessState({
    authenticated: true,
    state: {
      onboarding: {
        required: true,
        registrationComplete: false
      }
    }
  });

  assert.equal(access.authenticated, true);
  assert.equal(access.foundersPlot.playable, true);
  assert.equal(access.foundersPlot.mode, 'MANUAL_FOUNDER');
  assert.equal(Access.canOpenDistrict('founders-plot', access, {}), true);
});
