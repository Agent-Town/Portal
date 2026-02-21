const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('atlas districts API returns deterministic fixture and detail split', async ({ request }) => {
  const districtsResp = await request.get('/api/atlas/districts');
  expect(districtsResp.ok()).toBeTruthy();
  const districtsJson = await districtsResp.json();

  expect(districtsJson.ok).toBeTruthy();
  expect(districtsJson.meta?.source).toBe('fixture-test-v1');
  expect(districtsJson.meta?.formula?.base).toBe(1);
  expect(districtsJson.meta?.formula?.scale).toBe(2);

  const districts = districtsJson.districts || [];
  expect(districts.length).toBe(4);
  expect(districts.map((d) => d.key)).toEqual(['ethereum', 'monad', 'base', 'gnosis']);

  for (const district of districts) {
    const expectedSize = Number(
      (1 + 2 * Math.log10(1 + Number(district.totalAgents || 0))).toFixed(4)
    );
    expect(district.districtSize).toBe(expectedSize);
  }

  const ethereumResp = await request.get('/api/atlas/district/ethereum');
  expect(ethereumResp.ok()).toBeTruthy();
  const ethereumJson = await ethereumResp.json();
  expect(ethereumJson.ok).toBeTruthy();
  expect(ethereumJson.district?.key).toBe('ethereum');
  expect(ethereumJson.district?.mainnet?.agents).toBe(120);
  expect(ethereumJson.district?.testnets?.agents).toBe(30);
  expect(ethereumJson.district?.totalAgents).toBe(150);

  const missingResp = await request.get('/api/atlas/district/not-a-district');
  expect(missingResp.status()).toBe(404);
  const missingJson = await missingResp.json();
  expect(missingJson.error).toBe('NOT_FOUND');
});
