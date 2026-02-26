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
  expect(Array.isArray(ethereumJson.agents)).toBeTruthy();
  expect(ethereumJson.agents.length).toBe(1);
  expect(ethereumJson.agents[0]?.erc8004Id).toBe('1:1001');

  const summaryResp = await request.get('/api/atlas/district/ethereum/summary');
  expect(summaryResp.ok()).toBeTruthy();
  const summaryJson = await summaryResp.json();
  expect(summaryJson.ok).toBeTruthy();
  expect(summaryJson.district?.key).toBe('ethereum');
  expect(summaryJson.summary?.totals?.agents).toBe(1);
  expect(summaryJson.summary?.totals?.mainnet).toBe(120);
  expect(summaryJson.summary?.totals?.testnet).toBe(30);
  expect(summaryJson.summary?.totals?.averageScore).toBe(0);
  expect(summaryJson.summary?.totals?.scoreGt0).toBe(0);
  expect(summaryJson.summary?.scoreBins?.score0).toBe(1);
  expect(summaryJson.summary?.serviceCounts?.hasWeb).toBe(0);

  const summaryTestnetResp = await request.get('/api/atlas/district/ethereum/summary?network=testnet');
  expect(summaryTestnetResp.ok()).toBeTruthy();
  const summaryTestnetJson = await summaryTestnetResp.json();
  expect(summaryTestnetJson.ok).toBeTruthy();
  expect(summaryTestnetJson.query?.network).toBe('testnet');
  expect(summaryTestnetJson.summary?.network).toBe('testnet');
  expect(summaryTestnetJson.summary?.totals?.agents).toBe(0);
  expect(summaryTestnetJson.summary?.totals?.mainnet).toBe(120);
  expect(summaryTestnetJson.summary?.totals?.testnet).toBe(30);

  const agentsResp = await request.get('/api/atlas/district/ethereum/agents?limit=1&sort=score_desc');
  expect(agentsResp.ok()).toBeTruthy();
  const agentsJson = await agentsResp.json();
  expect(agentsJson.ok).toBeTruthy();
  expect(agentsJson.district?.key).toBe('ethereum');
  expect(agentsJson.pagination?.limit).toBe(1);
  expect(agentsJson.pagination?.total).toBe(1);
  expect(agentsJson.pagination?.returned).toBe(1);
  expect(agentsJson.pagination?.hasMore).toBeFalsy();
  expect(agentsJson.pagination?.nextCursor).toBeNull();
  expect(Array.isArray(agentsJson.results)).toBeTruthy();
  expect(agentsJson.results.length).toBe(1);
  expect(agentsJson.results[0]?.erc8004Id).toBe('1:1001');

  const agentsTestnetResp = await request.get('/api/atlas/district/ethereum/agents?network=testnet&limit=20');
  expect(agentsTestnetResp.ok()).toBeTruthy();
  const agentsTestnetJson = await agentsTestnetResp.json();
  expect(agentsTestnetJson.ok).toBeTruthy();
  expect(agentsTestnetJson.query?.network).toBe('testnet');
  expect(agentsTestnetJson.pagination?.total).toBe(0);
  expect(agentsTestnetJson.pagination?.returned).toBe(0);
  expect(Array.isArray(agentsTestnetJson.results)).toBeTruthy();
  expect(agentsTestnetJson.results.length).toBe(0);

  const missingResp = await request.get('/api/atlas/district/not-a-district');
  expect(missingResp.status()).toBe(404);
  const missingJson = await missingResp.json();
  expect(missingJson.error).toBe('NOT_FOUND');
});
