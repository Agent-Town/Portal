const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('skill_agent_solo documents wallet persistence, return unlock, and Sepolia faucet', async ({ request }) => {
  const resp = await request.get('/skill_agent_solo.md');
  expect(resp.ok()).toBeTruthy();

  const txt = await resp.text();
  expect(txt).toContain('name: agent-town-solo-agent');

  // Wallet requirements are explicit and role-separated.
  expect(txt).toContain('House recovery + unlock requires a Solana wallet');
  expect(txt).toContain('ERC-8004 anchors require an EVM wallet');
  expect(txt).toContain('If you lose the Solana wallet identity or switch to another wallet');

  // Return flow is explicit: revisit house URL and sign unlock.
  expect(txt).toContain('BASE_URL/house?house=<houseId>');
  expect(txt).toContain('Sign to unlock');

  // Faucet guidance is pinned to Sepolia.
  expect(txt).toContain('https://cloud.google.com/application/web3/faucet/ethereum/sepolia');
  expect(txt).toContain('Sepolia ETH');
  expect(txt).toContain('npm run setup:sepolia-wallet');
});
