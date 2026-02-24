const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('agent panel is present on core pages', async ({ page }) => {
  const routes = ['/', '/house', '/leaderboard', '/inbox/test-house'];

  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByTestId('agent-panel')).toBeVisible({ timeout: 1500 });
  }
});

test('agent panel debug tabs expose tools, skill context, traffic, and session context', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await page.goto('/');
  await expect(page.getByTestId('agent-panel')).toBeVisible({ timeout: 1500 });
  await expect(page.getByTestId('agent-debug-pane')).toBeHidden();
  await page.getByTestId('agent-debug-toggle').click();
  await expect(page.getByTestId('agent-debug-pane')).toBeVisible({ timeout: 1500 });
  await expect(page.getByTestId('agent-team-code-row')).toBeVisible({ timeout: 3000 });
  const teamCode = String((await page.getByTestId('agent-team-code-text').textContent()) || '').trim();
  expect(teamCode).toMatch(/^TEAM-[A-Z2-9]{4}-[A-Z2-9]{4}$/);

  await page.getByTestId('agent-team-code-send').click();
  await expect(page.locator('#chatTranscript .chat-message.user').last()).toContainText(teamCode, { timeout: 3000 });

  await expect(page.getByTestId('agent-debug-tools')).toContainText('Worker tools count', { timeout: 8000 });

  await page.getByTestId('agent-debug-tab-skill').click();
  await expect(page.getByTestId('agent-debug-panel-skill')).not.toHaveClass(/is-hidden/);
  await expect(page.getByTestId('agent-debug-skill')).toContainText('Skill import status', { timeout: 8000 });

  await page.locator('#chatInput').fill('traffic probe');
  await page.locator('#sendChatBtn').click();
  await page.getByTestId('agent-team-code-send').click();
  await page.getByTestId('agent-debug-tab-traffic').click();
  await expect(page.getByTestId('agent-debug-panel-traffic')).not.toHaveClass(/is-hidden/);
  const trafficCount = await page.locator('#agentDebugTraffic .agent-traffic-card').count();
  if (trafficCount > 0) {
    await expect(page.getByTestId('agent-debug-traffic')).toContainText('OUT', { timeout: 8000 });

    const orderedEpochs = await page.locator('#agentDebugTraffic .agent-traffic-card').evaluateAll((nodes) => {
      return nodes.map((node) => Number(node.getAttribute('data-epoch-ms') || '0'));
    });
    expect(orderedEpochs.length).toBeGreaterThan(0);
    for (let i = 1; i < orderedEpochs.length; i += 1) {
      expect(orderedEpochs[i - 1]).toBeGreaterThanOrEqual(orderedEpochs[i]);
    }

    await page.getByTestId('agent-traffic-filter-out').click();
    await expect(page.getByTestId('agent-traffic-filter-out')).toHaveClass(/is-active/);
    await expect.poll(async () => {
      const outgoingDirections = await page.locator('#agentDebugTraffic .agent-traffic-card').evaluateAll((nodes) => {
        return nodes.map((node) => String(node.getAttribute('data-direction') || ''));
      });
      return outgoingDirections.length > 0 && outgoingDirections.every((dir) => dir === 'OUT');
    }, { timeout: 8000 }).toBe(true);

    await page.getByTestId('agent-traffic-filter-in').click();
    await expect(page.getByTestId('agent-traffic-filter-in')).toHaveClass(/is-active/);
    await expect.poll(async () => {
      const incomingDirections = await page.locator('#agentDebugTraffic .agent-traffic-card').evaluateAll((nodes) => {
        return nodes.map((node) => String(node.getAttribute('data-direction') || ''));
      });
      return incomingDirections.length > 0 && incomingDirections.every((dir) => dir === 'IN');
    }, { timeout: 8000 }).toBe(true);

    await page.getByTestId('agent-traffic-filter-all').click();
    await expect(page.getByTestId('agent-traffic-filter-all')).toHaveClass(/is-active/);
  } else {
    await expect(page.getByTestId('agent-debug-traffic')).toContainText('No traffic entries', { timeout: 8000 });
  }

  await page.getByTestId('agent-debug-tab-session').click();
  await expect(page.getByTestId('agent-debug-panel-session')).not.toHaveClass(/is-hidden/);
  await expect(page.getByTestId('agent-debug-session')).toContainText('"runtimeState"', { timeout: 8000 });
});
