const { test, expect } = require('@playwright/test');
const {
  getPlotState,
  openFoundersPlotFrame,
  startForemanRuntime
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('V2.0 Foreman governance shows bounded lease and Exception Inbox in the Three.js surface', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  const runtime = await startForemanRuntime(frame);
  expect(runtime.ok).toBe(true);

  const governance = await frame.evaluate(async () => {
    return await window.__foundersPlotTest.grantForemanLease(15);
  });
  expect(governance.activeLease.status).toBe('ACTIVE');
  expect(governance.activeLease.scope).toBe('collect_ready_outputs');

  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('foreman'));
  await expect(frame.getByTestId('foreman-governance-card')).toBeVisible();
  await expect(frame.getByTestId('foreman-governance-card')).toContainText('Active until');
  await expect(frame.getByTestId('foreman-lease-revoke')).toBeEnabled();

  const raised = await frame.evaluate(async () => {
    return await window.__foundersPlotTest.raiseForemanExceptionForTest({
      title: 'Review surplus collection',
      body: 'Clover needs your decision before repeating this routine.',
      requestedAction: 'collect_ready_outputs'
    });
  });
  expect(raised.openExceptions.length).toBe(1);
  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('foreman'));
  await expect(frame.getByTestId('foreman-exception-inbox')).toContainText('Review surplus collection');
  await expect(frame.getByTestId('foreman-exception-item')).toHaveCount(1);

  const scene = await frame.evaluate(() => window.__foundersPlotTest.getScene()?.stateCoverage || null);
  expect(scene?.domains?.map((entry) => entry.id)).toContain('foreman-governance');
  expect(scene?.anchors?.find((entry) => entry.id === 'STATE:governance')?.status).toBe('LEASE_ACTIVE');
  expect(scene?.anchors?.find((entry) => entry.id === 'STATE:approvals')?.count).toBeGreaterThanOrEqual(1);

  await frame.getByTestId('foreman-exception-resolve').click();
  await expect(frame.getByTestId('foreman-exception-item')).toHaveCount(0);
  const after = await getPlotState(frame);
  expect(after.foreman.governance.openExceptions).toHaveLength(0);
  expect(after.foreman.governance.resolvedExceptions[0].status).toBe('RESOLVED');

  await frame.getByTestId('foreman-lease-revoke').click();
  await expect(frame.getByTestId('foreman-governance-card')).toContainText('Manual approval required');
  const revoked = await getPlotState(frame);
  expect(revoked.foreman.governance.activeLease).toBeNull();
});
