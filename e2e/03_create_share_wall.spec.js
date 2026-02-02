const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset');
});

test('co-op beta -> co-create -> share -> both opt in -> appears on wall', async ({ page, request }) => {
  await page.goto('/');
  const pairCode = (await page.getByTestId('pair-code').innerText()).trim();

  // Connect agent
  await request.post('/api/agent/connect', { data: { pairCode, agentName: 'ClawTest' } });

  // Match
  await page.getByTestId('sigil-key').click();
  await request.post('/api/agent/select', { data: { pairCode, elementId: 'key' } });
  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED');

  // Press beta (human) with email, then agent presses
  await page.getByTestId('email').fill('test@example.com');
  await page.getByTestId('beta-btn').click();
  await expect(page.getByTestId('beta-waiting')).toBeVisible();

  await request.post('/api/agent/beta/press', { data: { pairCode } });

  // Should auto-navigate to /create
  await page.waitForURL('**/create');

  // Human paints one pixel
  await page.getByTestId('px-0-0').click();
  await expect(page.getByTestId('px-0-0')).toHaveAttribute('data-color', '1');

  // Agent paints another pixel
  await request.post('/api/agent/canvas/paint', { data: { pairCode, x: 1, y: 0, color: 2 } });
  await expect(page.getByTestId('px-1-0')).toHaveAttribute('data-color', '2');

  // Create share
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/s\/sh_/);

  const url = page.url();
  const shareId = url.split('/').pop();
  await expect(page.getByTestId('share-link')).toContainText(`/s/${shareId}`);

  // Human opts in
  await page.getByTestId('optin-human-yes').click();

  // Agent opts in
  await request.post('/api/agent/optin', { data: { pairCode, appear: true } });

  await expect(page.getByTestId('optin-status')).toContainText('Added');

  // Wall shows the pair
  await page.goto('/wall');
  await expect(page.getByTestId('wall-signup-count')).toContainText('1');
  await expect(page.getByTestId('wall-list')).toContainText(shareId);
});
