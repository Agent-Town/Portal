const { test, expect } = require('@playwright/test');
const { seedExperiencePreference, selectStartPreset } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('mainland preset localizes start-page auth placeholders', async ({ page }) => {
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
  await selectStartPreset(page, 'cn-mainland');

  await expect(page.locator('#privyEmailInput')).toHaveAttribute('placeholder', 'you@example.com');
  await expect(page.locator('#privyCodeInput')).toHaveAttribute('placeholder', '123456');
  await expect(page.locator('#privyAuthCancelBtn')).toHaveText('取消');
});

test('mainland preset localizes create page ceremony copy', async ({ page }) => {
  await seedExperiencePreference(page, 'cn-mainland');
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
          presetId: 'cn-mainland',
          locale: 'zh-CN',
          market: 'cn-mainland',
          providerPolicy: 'cn-mainland',
          sharePolicy: 'link-first',
          mediaPolicy: 'mainland-safe',
          agentPolicy: 'avoid-blocked-services',
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

  await expect(page.locator('#createHeading')).toHaveText('为 house key 创造熵值。');
  await expect(page.locator('#createIntro')).toHaveText('人类点击像素，Agent 通过 skill API 绘制。感觉完成后就锁定它。');
  await expect(page.locator('#shareBtn')).toHaveText('生成 house key');
  await expect(page.locator('#createNextNote')).toHaveText('下一步：当 joined key 准备好后，你和 Agent 就可以一起进入 house，读写加密条目。');
  await expect(page.locator('#createNavHomeLink')).toHaveText('首页');
});

test('mainland preset localizes standalone share and house pages', async ({ page }) => {
  await seedExperiencePreference(page, 'cn-mainland');
  await page.route('**/api/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        houseId: null,
        experiencePreference: {
          presetId: 'cn-mainland',
          locale: 'zh-CN',
          market: 'cn-mainland',
          providerPolicy: 'cn-mainland',
          sharePolicy: 'link-first',
          mediaPolicy: 'mainland-safe',
          agentPolicy: 'avoid-blocked-services',
          selectedAt: '2026-03-10T00:00:00.000Z',
          source: 'user'
        }
      })
    });
  });
  await page.route('**/api/share/share-zh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        share: {
          id: 'share-zh',
          humanHandle: 'robin',
          agentName: 'OpenClaw',
          xPostUrl: 'https://example.com/post/123',
          agentPosts: {},
          experiencePreference: {
            presetId: 'cn-mainland',
            locale: 'zh-CN',
            market: 'cn-mainland',
            providerPolicy: 'cn-mainland',
            sharePolicy: 'link-first',
            mediaPolicy: 'mainland-safe',
            agentPolicy: 'avoid-blocked-services',
            selectedAt: '2026-03-10T00:00:00.000Z',
            source: 'user'
          }
        }
      })
    });
  });

  await page.goto('/s/share-zh');
  await expect(page.locator('#shareCardTitle')).toHaveText('分享卡片');
  await expect(page.locator('#shareLead')).toHaveText('用于社交传播的高分发卡片，附带自动生成的 house 形象。');
  await expect(page.locator('#xPostLink')).toHaveText('公开帖子');
  await expect(page.locator('#addFriendBtn')).toHaveText('加为好友');
  await expect(page.locator('#teamLine')).toHaveText('human：@robin | agent：OpenClaw');

  await page.goto('/house');
  await expect(page.locator('#houseHeroTitle')).toHaveText('秘密之屋');
  await expect(page.locator('#houseUnlockTitle')).toHaveText('解锁');
  await expect(page.locator('#unlockBtn')).toHaveText('签名解锁');
  await expect(page.locator('#houseShareTitle')).toHaveText('分享');
  await expect(page.locator('#housePublicTitle')).toHaveText('公开图片');
});
