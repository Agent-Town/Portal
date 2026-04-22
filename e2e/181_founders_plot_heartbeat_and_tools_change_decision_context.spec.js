const { test, expect } = require('@playwright/test');
const { openFoundersPlotFrame } = require('./helpers/founders_plot');
const { configureDeterministicBrain, prepareReadyCollectScenario } = require('./helpers/founders_plot_foreman');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function runFixture({ page, request, heartbeatText, toolsText, keyPrefix }) {
  const decisionBodies = [];
  const heartbeatHandler = async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/markdown', body: heartbeatText });
  };
  const toolsHandler = async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/markdown', body: toolsText });
  };
  const decisionHandler = async (route) => {
    decisionBodies.push(route.request().postDataJSON());
    await route.continue();
  };

  await page.route('**/experiences/founders-plot/heartbeat.md', heartbeatHandler);
  await page.route('**/experiences/founders-plot/tools.md', toolsHandler);
  await page.route('**/api/founders-plot/foreman/decision', decisionHandler);

  const frame = await openFoundersPlotFrame(page);
  await configureDeterministicBrain(page);
  await prepareReadyCollectScenario(frame, { keyPrefix });
  await frame.getByTestId('founders-clover-avatar').click();
  await frame.getByTestId('foreman-run-now-btn').click();
  await expect.poll(() => decisionBodies.length, { timeout: 10_000 }).toBeGreaterThan(0);

  await page.unroute('**/experiences/founders-plot/heartbeat.md', heartbeatHandler);
  await page.unroute('**/experiences/founders-plot/tools.md', toolsHandler);
  await page.unroute('**/api/founders-plot/foreman/decision', decisionHandler);

  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  await page.goto('about:blank');

  return decisionBodies[0];
}

test('changing heartbeat/tools docs changes the Foreman context hash and deterministic decision output', async ({ page, request }) => {
  const fixtureA = await runFixture({
    page,
    request,
    keyPrefix: 'v14-heartbeat-a',
    heartbeatText: '# Founders Plot Heartbeat\nPrefer collecting ready outputs.',
    toolsText: '# Founders Plot Tool Surface\nUse provider-safe aliases for routine collection.'
  });
  const fixtureB = await runFixture({
    page,
    request,
    keyPrefix: 'v14-heartbeat-b',
    heartbeatText: '# Founders Plot Heartbeat\nIf no contract is active, return HEARTBEAT_OK unless storage is capped.',
    toolsText: '# Founders Plot Tool Surface\nUse provider-safe aliases and avoid low-value actions without a contract.'
  });

  expect(fixtureA.selectedCandidateId).toMatch(/^collect:/);
  expect(fixtureB.selectedCandidateId).toBeNull();
  expect(fixtureB.noopCode).toBe('HEARTBEAT_OK');
  expect(String(fixtureA.pack?.packHash || '')).not.toEqual(String(fixtureB.pack?.packHash || ''));
});
