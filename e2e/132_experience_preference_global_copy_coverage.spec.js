const { test, expect } = require('@playwright/test');
const { seedExperiencePreference, selectStartPreset } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('global-default keeps start-page auth placeholders and controls in English', async ({ page }) => {
  await page.route('**/api/privy/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        enabled: false,
        startPageEnabled: false,
        appPath: '/app',
        config: null,
      }),
    });
  });

  await page.goto('/start');
  await selectStartPreset(page, 'global-default');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#privyEmailInput')).toHaveAttribute('placeholder', 'you@example.com');
  await expect(page.locator('#privyCodeInput')).toHaveAttribute('placeholder', '123456');
  await expect(page.locator('#privyAuthCancelBtn')).toHaveText('Cancel');
});

test('global-default keeps create page ceremony copy in English', async ({ page }) => {
  await seedExperiencePreference(page, 'global-default');
  await page.route('**/api/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        signup: {
          complete: true,
          mode: 'agent',
          createdAt: '2026-03-10T00:00:00.000Z'
        },
        lite: {
          driver: 'test'
        },
        teamCode: 'TEAM-ABCD-EFGH',
        experiencePreference: {
          presetId: 'global-default',
          locale: 'en',
          market: 'global',
          providerPolicy: 'global-default',
          sharePolicy: 'x-moltbook',
          mediaPolicy: 'youtube',
          agentPolicy: 'default',
          selectedAt: '2026-03-10T00:00:00.000Z',
          source: 'user'
        }
      })
    });
  });
  await page.route('**/api/canvas/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        palette: ['#000000', '#ffffff'],
        canvas: {
          w: 2,
          h: 1,
          pixels: [0, 1]
        }
      })
    });
  });

  await page.goto('/create');

  await expect(page.locator('#createHeading')).toHaveText('Create entropy for house key.');
  await expect(page.locator('#createIntro')).toHaveText('Human: click pixels. Agent: paint via the skill API. When it feels done, lock it in.');
  await expect(page.locator('#shareBtn')).toHaveText('Generate house key');
  await expect(page.locator('#createNextNote')).toHaveText('Next: unlock the house with a wallet signature. Then you and the agent can read/write encrypted entries.');
  await expect(page.locator('#createNavHomeLink')).toHaveText('Home');
});

test('global-default keeps standalone share and house pages in English/global wording', async ({ page }) => {
  await seedExperiencePreference(page, 'global-default');
  await page.route('**/api/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        houseId: null,
        experiencePreference: {
          presetId: 'global-default',
          locale: 'en',
          market: 'global',
          providerPolicy: 'global-default',
          sharePolicy: 'x-moltbook',
          mediaPolicy: 'youtube',
          agentPolicy: 'default',
          selectedAt: '2026-03-10T00:00:00.000Z',
          source: 'user'
        }
      })
    });
  });
  await page.route('**/api/share/share-en', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        share: {
          id: 'share-en',
          humanHandle: 'robin',
          agentName: 'OpenClaw',
          xPostUrl: 'https://x.com/robin/status/123',
          agentPosts: {},
          experiencePreference: {
            presetId: 'global-default',
            locale: 'en',
            market: 'global',
            providerPolicy: 'global-default',
            sharePolicy: 'x-moltbook',
            mediaPolicy: 'youtube',
            agentPolicy: 'default',
            selectedAt: '2026-03-10T00:00:00.000Z',
            source: 'user'
          }
        }
      })
    });
  });

  await page.goto('/s/share-en');
  await expect(page.locator('#shareCardTitle')).toHaveText('Share Card');
  await expect(page.locator('#shareLead')).toHaveText('High-distribution card for social sharing with generated house hero.');
  await expect(page.locator('#xPostLink')).toHaveText('X post');
  await expect(page.locator('#addFriendBtn')).toHaveText('Add as friend');
  await expect(page.locator('#teamLine')).toHaveText('human: @robin | agent: OpenClaw');

  await page.goto('/house');
  await expect(page.locator('#houseHeroTitle')).toHaveText('House of Secrets');
  await expect(page.locator('#houseUnlockTitle')).toHaveText('Unlock');
  await expect(page.locator('#unlockBtn')).toHaveText('Sign to unlock');
  await expect(page.locator('#houseShareTitle')).toHaveText('Share');
  await expect(page.locator('#housePublicTitle')).toHaveText('Public image');
});
