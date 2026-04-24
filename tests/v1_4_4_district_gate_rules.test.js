const test = require('node:test');
const assert = require('node:assert/strict');
const Access = require('../public/agent_town_access');

test('district gates permit Founders Plot after auth while preserving Brain/Town Hall paths', () => {
  const state = {
    onboarding: {
      required: true,
      registrationComplete: false,
      step: 'townhall_profile'
    },
    signup: { complete: false }
  };
  const access = Access.buildAccessState({
    authenticated: true,
    brainConfigured: false,
    runtimeReady: false,
    state
  });

  assert.equal(Access.canOpenDistrict('founders-plot', access, state), true);
  assert.equal(Access.canOpenDistrict('townhall', access, state), true);
  assert.equal(Access.canOpenDistrict('brain', access, state), true);
  assert.equal(Access.canOpenDistrict('atlas', access, state), true);
  assert.equal(Access.canOpenDistrict('pony', access, state), true);
  assert.equal(Access.canOpenDistrict('sigil', access, state), false);
  assert.equal(Access.canRunRealForeman(access), false);
});
