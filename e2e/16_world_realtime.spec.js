const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('two users join same instance, move, and invalid move intents are ignored', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  await pageA.goto('/world');
  await pageB.goto('/world');

  await pageA.getByTestId('world-join-btn').click();
  await pageB.getByTestId('world-join-btn').click();

  await expect(pageA.getByTestId('world-realtime-status')).toContainText('Connected');
  await expect(pageB.getByTestId('world-realtime-status')).toContainText('Connected');
  await expect
    .poll(async () => Number((await pageA.getByTestId('world-player-count').innerText()).trim()))
    .toBeGreaterThanOrEqual(2);
  await expect
    .poll(async () => Number((await pageB.getByTestId('world-player-count').innerText()).trim()))
    .toBeGreaterThanOrEqual(2);

  const selfA = await pageA.evaluate(() => window.__worldDebug.getSelfId());
  expect(selfA).toBeTruthy();

  const beforeAOnB = await pageB.evaluate((playerId) => {
    const p = window.__worldDebug.getRealtimePlayers().find((item) => item.playerId === playerId);
    return p ? p.x : null;
  }, selfA);
  expect(typeof beforeAOnB).toBe('number');

  await pageA.getByTestId('world-move-right').click();

  await expect
    .poll(async () => {
      const x = await pageB.evaluate((playerId) => {
        const p = window.__worldDebug.getRealtimePlayers().find((item) => item.playerId === playerId);
        return p ? p.x : null;
      }, selfA);
      return Number(x);
    })
    .toBeGreaterThan(beforeAOnB);

  await pageA.waitForTimeout(300);
  const beforeInvalid = await pageA.evaluate(() => {
    const id = window.__worldDebug.getSelfId();
    const p = window.__worldDebug.getRealtimePlayers().find((item) => item.playerId === id);
    return p ? p.x : null;
  });
  await pageA.evaluate(() => {
    window.__worldDebug.sendRawMoveIntent({ dirX: 99, dirY: 0, seq: 10_000 });
  });
  await pageA.waitForTimeout(300);
  const afterInvalid = await pageA.evaluate(() => {
    const id = window.__worldDebug.getSelfId();
    const p = window.__worldDebug.getRealtimePlayers().find((item) => item.playerId === id);
    return p ? p.x : null;
  });
  expect(afterInvalid).toBe(beforeInvalid);

  await ctxA.close();
  await ctxB.close();
});
