const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  await request.post('/__test__/world/policy', {
    headers: { 'x-test-reset': resetToken },
    data: { maxPlayers: 1, maxHouses: 8, minExperienceHouses: 2 }
  });
});

async function assignWithSession(context, houseId) {
  const page = await context.newPage();
  await page.goto('/');
  await context.request.post('/__test__/world/session-house', {
    headers: { 'x-test-reset': resetToken },
    data: { houseId }
  });
  const assign = await context.request.post('/api/world/instance/assign', { data: {} });
  expect(assign.ok()).toBeTruthy();
  const body = await assign.json();
  await page.close();
  return body;
}

test('capacity overflow creates new instance and includes player + curated houses', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();

  const first = await assignWithSession(ctxA, 'H_P1');
  const second = await assignWithSession(ctxB, 'H_P2');

  expect(first.instanceId).not.toBe(second.instanceId);
  expect(first.composition.playerHouseIds).toContain('H_P1');
  expect(second.composition.playerHouseIds).toContain('H_P2');
  expect(first.houses.some((house) => house.houseId === 'H_P1')).toBeTruthy();
  expect(second.houses.some((house) => house.houseId === 'H_P2')).toBeTruthy();

  const firstExperienceCount = first.houses.filter((house) => house.type === 'experience').length;
  const secondExperienceCount = second.houses.filter((house) => house.type === 'experience').length;
  expect(firstExperienceCount).toBeGreaterThanOrEqual(2);
  expect(secondExperienceCount).toBeGreaterThanOrEqual(2);

  // Deterministic reassignment for the same session.
  const againResp = await ctxA.request.post('/api/world/instance/assign', { data: {} });
  const again = await againResp.json();
  expect(again.instanceId).toBe(first.instanceId);

  await ctxA.close();
  await ctxB.close();
});
