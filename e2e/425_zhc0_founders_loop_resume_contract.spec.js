const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function openTownhallPanel(page) {
  const panel = page.locator('#townhallRegisterPanel');
  const panelVisible = async () => (
    await panel.isVisible().catch(() => false)
    || await page.locator('#townhallStepHuman').isVisible().catch(() => false)
    || await page.locator('#townhallStepAgent').isVisible().catch(() => false)
    || await page.locator('#townhallStepProcessing').isVisible().catch(() => false)
  );
  if (await panelVisible()) return;

  const backdrop = page.locator('#districtModalBackdrop');
  if (await backdrop.isVisible().catch(() => false)) {
    const closeBtn = page.locator('#districtModalClose');
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    } else {
      await expect(page.locator('#townhallStepHuman')).toBeVisible();
      return;
    }
  }

  if (!(await panelVisible())) {
    await page.getByRole('button', { name: 'Open Town Hall' }).click();
  }

  await expect.poll(async () => (
    await page.locator('#townhallStepHuman').isVisible().catch(() => false)
    || await page.locator('#townhallStepAgent').isVisible().catch(() => false)
    || await page.locator('#townhallStepProcessing').isVisible().catch(() => false)
  )).toBe(true);
}

async function visiblePrimaryActionCount(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll('[data-zhc-primary-action="true"]')].filter((node) => {
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }).length;
  });
}

const DEFAULT_HUMAN_PROMPT = "Stylized 3D third-person game character concept: a gender-neutral, race-neutral wild west wizard known as a 'Promptmancer' with a friendly, approachable silhouette and expressive eyes.";
const DEFAULT_AGENT_PROMPT = 'Stylized 3D prairie pup avatar doing a cute hat-tip emote with a wholesome mascot vibe in a cozy wild west frontier style.';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeOnboarding({ complete = false, step = 'townhall' } = {}) {
  return {
    required: true,
    registrationComplete: complete,
    step,
    registeredAt: complete ? '2026-02-16T00:00:00.000Z' : null,
    profile: {
      humanName: complete ? 'Robin' : null,
      agentName: complete ? 'OpenClaw' : null,
      humanAvatar: {
        image: '/brand-kit/default_user_avatar.png',
        prompt: DEFAULT_HUMAN_PROMPT,
        source: 'default',
        updatedAt: complete ? '2026-02-16T00:00:00.000Z' : null
      },
      agentAvatar: {
        image: '/brand-kit/default_agent_avatar.png',
        prompt: DEFAULT_AGENT_PROMPT,
        source: 'default',
        updatedAt: complete ? '2026-02-16T00:00:00.000Z' : null
      }
    },
    erc8004: complete
      ? {
          user: {
            evm: { id: '11155111:456', chain: 'sepolia', txHash: null, updatedAt: '2026-02-16T00:00:00.000Z' },
            solana: { id: 'solana:user-asset-789', cluster: 'devnet', txSig: null, updatedAt: '2026-02-16T00:00:00.000Z' }
          },
          agent: {
            evm: { id: '11155111:457', chain: 'sepolia', txHash: null, updatedAt: '2026-02-16T00:00:00.000Z' },
            solana: { id: 'solana:agent-asset-790', cluster: 'devnet', txSig: null, updatedAt: '2026-02-16T00:00:00.000Z' }
          }
        }
      : {
          user: {
            evm: { id: null, chain: 'sepolia', txHash: null, updatedAt: null },
            solana: { id: null, cluster: 'devnet', txSig: null, updatedAt: null }
          },
          agent: {
            evm: { id: null, chain: 'sepolia', txHash: null, updatedAt: null },
            solana: { id: null, cluster: 'devnet', txSig: null, updatedAt: null }
          }
        }
  };
}

async function mockOnboardingState(page, onboarding, { llmConfigured = false } = {}) {
  const fulfill = async (route) => {
    const upstream = await route.fetch();
    const body = await upstream.json().catch(() => ({}));
    body.onboarding = clone(onboarding);
    body.lite = {
      ...(body.lite || {}),
      driver: 'vendor',
      llmConfigured
    };
    if (route.request().url().includes('/api/state')) {
      body.houseId = null;
    }
    await route.fulfill({
      status: upstream.status(),
      contentType: 'application/json',
      body: JSON.stringify(body)
    });
  };

  await page.route('**/api/session', fulfill);
  await page.route('**/api/state', fulfill);
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('M44.3 resume keeps human and agent founder drafts on the correct Town Hall step after refresh', async ({ page }) => {
  await mockOnboardingState(page, makeOnboarding({ complete: false, step: 'townhall' }));
  await page.goto('/app');
  await openTownhallPanel(page);

  await page.locator('#townhallHumanName').fill('Resume Robin');
  await page.locator('#townhallHumanCustomizeBtn').click();
  await page.locator('#townhallHumanPrompt').fill('Resume human prompt');

  await page.reload();
  await openTownhallPanel(page);

  const humanRoot = page.getByTestId('zhc-townhall-founder-human');
  await expect(humanRoot).toBeVisible();
  await expect(humanRoot).toHaveAttribute('data-zhc-phase', 'founders_established');
  await expect(page.locator('#townhallHumanName')).toHaveValue('Resume Robin');
  await page.locator('#townhallHumanCustomizeBtn').click();
  await expect(page.locator('#townhallHumanPrompt')).toHaveValue('Resume human prompt');
  await expect(page.getByTestId('townhall-human-submit-btn')).toHaveAttribute('data-zhc-primary-action', 'true');
  expect(await visiblePrimaryActionCount(page)).toBe(1);

  await page.getByTestId('townhall-human-submit-btn').click();
  await page.locator('#townhallAgentName').fill('Resume OpenClaw');
  await page.locator('#townhallAgentCustomizeBtn').click();
  await page.locator('#townhallAgentPrompt').fill('Resume agent prompt');

  await page.reload();
  await openTownhallPanel(page);

  const agentRoot = page.getByTestId('zhc-townhall-founder-agent');
  await expect(agentRoot).toBeVisible();
  await expect(agentRoot).toHaveAttribute('data-zhc-phase', 'founders_established');
  await expect(page.locator('#townhallAgentName')).toHaveValue('Resume OpenClaw');
  await page.locator('#townhallAgentCustomizeBtn').click();
  await expect(page.locator('#townhallAgentPrompt')).toHaveValue('Resume agent prompt');
  await expect(page.getByTestId('townhall-agent-submit-btn')).toHaveAttribute('data-zhc-primary-action', 'true');
  expect(await visiblePrimaryActionCount(page)).toBe(1);
  await expect(page.locator('#townhallSigilFlow')).toHaveClass(/is-hidden/);

  await page.locator('#townhallAgentBackBtn').click();
  await expect(page.locator('#townhallHumanName')).toHaveValue('Resume Robin');
  await expect(page.locator('#townhallHumanPrompt')).toHaveValue('Resume human prompt');
});

test('M44.3 resume preserves the explicit first-worker gate after founder registration is already complete', async ({ page }) => {
  await mockOnboardingState(page, makeOnboarding({ complete: true, step: 'brain' }));
  await page.goto('/app');
  await openTownhallPanel(page);

  const processingRoot = page.locator('#townhallStepProcessing');
  await expect(processingRoot).toBeVisible();
  await expect(processingRoot).toHaveAttribute('data-zhc-phase', 'first_worker_online');
  await expect(processingRoot).toHaveAttribute('data-zhc-overlay-state', 'blocked');
  await expect(processingRoot).toHaveAttribute('data-zhc-blocker-key', 'needs_brain');
  await expect(page.getByTestId('townhall-open-brain-btn')).toHaveAttribute('data-zhc-primary-action', 'true');
  expect(await visiblePrimaryActionCount(page)).toBe(1);

  await page.reload();
  await openTownhallPanel(page);

  await expect(processingRoot).toBeVisible();
  await expect(processingRoot).toHaveAttribute('data-zhc-phase', 'first_worker_online');
  await expect(processingRoot).toHaveAttribute('data-zhc-overlay-state', 'blocked');
  await expect(processingRoot).toHaveAttribute('data-zhc-blocker-key', 'needs_brain');
  await expect(page.locator('#townhallStepHuman')).toBeHidden();
  await expect(page.locator('#townhallStepAgent')).toBeHidden();
  await expect(page.getByTestId('townhall-open-brain-btn')).toHaveAttribute('data-zhc-primary-action', 'true');
  expect(await visiblePrimaryActionCount(page)).toBe(1);
});
