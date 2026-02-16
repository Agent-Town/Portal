const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeOnboarding(complete = false) {
  return {
    required: true,
    registrationComplete: complete,
    registeredAt: complete ? '2026-02-16T00:00:00.000Z' : null,
    profile: {
      humanName: complete ? 'Robin' : null,
      agentName: complete ? 'OpenClaw' : null,
      humanAvatar: {
        image: '/brand-kit/elizaos-sheriff.png',
        prompt: complete ? 'Human prompt' : '',
        source: 'default',
        updatedAt: complete ? '2026-02-16T00:00:00.000Z' : null
      },
      agentAvatar: {
        image: '/brand-kit/openclaw-sheriff.png',
        prompt: complete ? 'Agent prompt' : '',
        source: 'default',
        updatedAt: complete ? '2026-02-16T00:00:00.000Z' : null
      }
    },
    erc8004: {
      evm: {
        id: complete ? '11155111:123' : null,
        chain: 'sepolia',
        txHash: null,
        updatedAt: complete ? '2026-02-16T00:00:00.000Z' : null
      },
      solana: {
        id: complete ? 'solana:asset123' : null,
        cluster: 'devnet',
        txSig: null,
        updatedAt: complete ? '2026-02-16T00:00:00.000Z' : null
      }
    }
  };
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('town hall registration saves names/prompts/ERC-8004 IDs to session state', async ({ page }) => {
  await page.goto('/app');

  await page.locator('#districtModalClose').click();
  await page.getByRole('button', { name: 'Open Town Hall' }).click();
  await expect(page.locator('#townhallRegisterPanel')).toBeVisible();

  await page.locator('#townhallHumanName').fill('Robin');
  await page.locator('#townhallAgentName').fill('OpenClaw');
  await page.locator('#townhallHumanPrompt').fill('Human prompt text');
  await page.locator('#townhallAgentPrompt').fill('Agent prompt text');
  await page.locator('#townhallEvmErcId').fill('11155111:456');
  await page.locator('#townhallSolanaErcId').fill('solana:asset789');

  await page.getByTestId('townhall-register-btn').click();
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered');

  const stateResp = await page.request.get('/api/state');
  expect(stateResp.ok()).toBeTruthy();
  const state = await stateResp.json();
  expect(state.onboarding?.registrationComplete).toBe(true);
  expect(state.onboarding?.profile?.humanName).toBe('Robin');
  expect(state.onboarding?.profile?.agentName).toBe('OpenClaw');
  expect(state.onboarding?.profile?.humanAvatar?.prompt).toBe('Human prompt text');
  expect(state.onboarding?.profile?.agentAvatar?.prompt).toBe('Agent prompt text');
  expect(state.onboarding?.erc8004?.evm?.id).toBe('11155111:456');
  expect(state.onboarding?.erc8004?.solana?.id).toBe('solana:asset789');
});

test('required town hall onboarding locks district switching until registration is saved', async ({ page }) => {
  let mockedOnboarding = makeOnboarding(false);

  await page.route('**/api/session', async (route) => {
    const upstream = await route.fetch();
    const body = await upstream.json().catch(() => ({}));
    body.onboarding = deepClone(mockedOnboarding);
    await route.fulfill({
      status: upstream.status(),
      contentType: 'application/json',
      body: JSON.stringify(body)
    });
  });

  await page.route('**/api/state', async (route) => {
    const upstream = await route.fetch();
    const body = await upstream.json().catch(() => ({}));
    body.houseId = null;
    body.onboarding = deepClone(mockedOnboarding);
    await route.fulfill({
      status: upstream.status(),
      contentType: 'application/json',
      body: JSON.stringify(body)
    });
  });

  await page.route('**/api/townhall/register', async (route) => {
    mockedOnboarding = makeOnboarding(true);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, onboarding: deepClone(mockedOnboarding) })
    });
  });

  await page.goto('/app');

  await expect(page.locator('#townhallRegisterPanel')).toBeVisible();
  await expect(page.locator('#districtModalClose')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open Saloon' })).toHaveAttribute('aria-disabled', 'true');

  await page.locator('#townhallHumanName').fill('Robin');
  await page.locator('#townhallAgentName').fill('OpenClaw');
  await page.locator('#townhallHumanPrompt').fill('Human prompt');
  await page.locator('#townhallAgentPrompt').fill('Agent prompt');
  await page.locator('#townhallEvmErcId').fill('11155111:123');
  await page.locator('#townhallSolanaErcId').fill('solana:asset123');
  await page.getByTestId('townhall-register-btn').click();

  await expect(page.locator('#townhallRegisterState')).toContainText('Registered');
  await expect(page.getByTestId('open-btn')).toBeVisible();
  await expect(page.locator('#districtModalClose')).toBeHidden();
});
