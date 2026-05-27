const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const civicToolPattern = /et\.world\.civic\./i;

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function openDebugPane(page) {
  await expect(page.getByTestId('agent-panel')).toBeVisible({ timeout: 3000 });
  const debugPane = page.getByTestId('agent-debug-pane');
  if (!(await debugPane.isVisible())) {
    await page.getByTestId('agent-debug-toggle').click();
  }
  await expect(debugPane).toBeVisible({ timeout: 3000 });
}

test('V6 lab modal opens without replacing the page-scoped worker context', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
    localStorage.setItem('agentTown:panel:debugVisible', '1');
  });

  await page.goto('/app?worldGridFeatureFlags=v60&__v6LabTest=1');
  await openDebugPane(page);

  await expect(page.getByTestId('agent-debug-tools')).toContainText('Worker tools count', { timeout: 8000 });
  await page.getByTestId('agent-debug-tab-session').click();
  await expect(page.getByTestId('agent-debug-session')).toContainText('"runtimeState"', { timeout: 8000 });
  await expect(page.getByTestId('agent-debug-session')).not.toContainText(civicToolPattern);

  await page.waitForFunction(() => !!window.__agentTownV6LabTest && !!window.__openclawLiteTest);
  expect(await page.evaluate(() => window.__agentTownV6LabTest.pinWorkerRef())).toBe(true);

  const before = await page.evaluate(() => window.__agentTownV6LabTest.snapshot());
  expect(before.path).toBe('/app');
  expect(before.modalOpen).toBe(false);
  expect(before.hasWorkerTestApi).toBe(true);
  expect(before.debugTabs).toEqual(expect.arrayContaining([
    'Worker Tools',
    'Skill Context',
    'Worker Traffic',
    'Brain',
    'Session Context'
  ]));

  const opened = await page.evaluate(async () => {
    const next = new URL(window.location.href);
    next.searchParams.set('v6Lab', '1');
    window.history.replaceState({}, '', next);
    return await window.__agentTownV6LabTest.openFromRoute();
  });
  expect(opened).toBe(true);

  const lab = page.locator('#v6-research-lab');
  await expect(lab).toBeVisible();
  await expect(lab).toHaveAttribute('data-execution-status', 'not_executable');
  await expect(lab).not.toContainText(civicToolPattern);

  const during = await page.evaluate(() => window.__agentTownV6LabTest.snapshot());
  expect(during.path).toBe('/app');
  expect(during.search).toContain('v6Lab=1');
  expect(during.modalOpen).toBe(true);
  expect(during.modalTitle).toBe('V6 Research Lab');
  expect(during.labVisible).toBe(true);
  expect(during.districtFrameCount).toBe(0);
  expect(during.hasWorkerTestApi).toBe(true);
  expect(during.workerRefStable).toBe(true);

  await page.locator('#districtModalClose').click();
  await expect(page.locator('#districtModalBackdrop')).toHaveClass(/is-hidden/);
  const afterClose = await page.evaluate(() => window.__agentTownV6LabTest.snapshot());
  expect(afterClose.path).toBe('/app');
  expect(afterClose.modalOpen).toBe(false);
  expect(afterClose.hasWorkerTestApi).toBe(true);
  expect(afterClose.workerRefStable).toBe(true);

  await page.getByTestId('agent-debug-tab-session').click();
  await expect(page.getByTestId('agent-debug-session')).toContainText('"runtimeState"', { timeout: 8000 });
  await expect(page.getByTestId('agent-debug-session')).not.toContainText(civicToolPattern);

  const toolsResponse = await request.get('/api/world/tools?worldGridFeatureFlags=all,v60');
  expect(toolsResponse.status()).toBe(200);
  const toolsBody = await toolsResponse.json();
  const toolNames = Array.isArray(toolsBody.tools) ? toolsBody.tools.map((tool) => String(tool.name || '')) : [];
  expect(toolNames.some((name) => civicToolPattern.test(name))).toBe(false);
});
