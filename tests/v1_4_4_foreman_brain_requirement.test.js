const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const Access = require('../public/agent_town_access');

test('real Foreman action availability fails closed without Brain readiness', () => {
  const access = Access.buildAccessState({
    authenticated: true,
    brainConfigured: false,
    runtimeReady: true,
    state: { plot: { hqLevel: 1 } }
  });

  assert.equal(Access.canRunRealForeman(access), false);
  assert.equal(access.clover.disabledReason, 'BRAIN_REQUIRED');
});

test('server Foreman route exposes a friendly BRAIN_REQUIRED guard', () => {
  const routes = fs.readFileSync(path.join(__dirname, '../server/founders_plot/routes.js'), 'utf8');
  assert.match(routes, /BRAIN_REQUIRED/);
  assert.match(routes, /Connect a Brain to let Clover act as your Foreman\./);
  assert.doesNotMatch(routes, /LLM not configured/);
});
