const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');

const VIEWPORTS = [
  { label: 'mobile', width: 390, height: 844, stackedSearch: true },
  { label: 'tablet', width: 834, height: 1112, stackedSearch: false },
  { label: 'desktop', width: 1440, height: 1200, stackedSearch: false },
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('registry aligns with the shared system and tolerates translated worker-package copy', async ({ page }) => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/registry.html?family=workers');

    const panel = page.getByTestId('registry-panel');
    const searchForm = page.getByTestId('registry-search-form');
    const status = page.getByTestId('registry-status');
    const workerCard = page.getByTestId('registry-worker-package-card');
    const installButton = page.getByTestId('registry-worker-package-install');
    const shareButton = page.getByTestId('registry-worker-package-share');
    const detailsButton = page.getByTestId('registry-worker-package-details');

    await expect(panel).toBeVisible();
    await expect(searchForm).toBeVisible();
    await expect(status).toContainText('result');
    await expect(workerCard).toBeVisible();
    await expect(installButton).toContainText('Install to House');
    await expect(shareButton).toContainText('Send to Friend');
    await expect(detailsButton).toContainText('View Details');

    await page.evaluate(() => {
      const heroTitle = document.querySelector('.registryTitle');
      const heroCopy = document.querySelector('.registryIntro');
      const badge = document.querySelector('.registryBadge');
      const cardTitle = document.querySelector('[data-testid="registry-worker-package-card"] .registryCardTitle');
      const cardDesc = document.querySelector('[data-testid="registry-worker-package-card"] .registryCardDescription');
      const install = document.querySelector('[data-testid="registry-worker-package-install"]');
      const share = document.querySelector('[data-testid="registry-worker-package-share"]');
      const details = document.querySelector('[data-testid="registry-worker-package-details"]');
      const surfaces = Array.from(document.querySelectorAll('[data-testid="registry-worker-package-card"] .registryHint'));
      if (heroTitle) heroTitle.textContent = '查找助手、证明和工作台';
      if (heroCopy) heroCopy.textContent = '搜索能力和共享工具，同时保持当前区域状态不变。';
      if (badge) badge.textContent = '共享助手包';
      if (cardTitle) cardTitle.textContent = '长期运行的多语言房屋协作助手';
      if (cardDesc) cardDesc.textContent = '用清楚、平实的语言解释当前状态，并帮助团队继续推进任务。';
      if (install) install.textContent = '安装到我的房屋';
      if (share) share.textContent = '发送给朋友';
      if (details) details.textContent = '查看详细信息';
      for (const node of surfaces) {
        if (node.textContent.includes('Works across')) {
          node.textContent = '适用范围：房屋办公室、归档、训练器、工作台';
        }
      }
    });

    const metrics = await page.evaluate(() => {
      const panelNode = document.querySelector('[data-testid="registry-panel"]');
      const searchNode = document.querySelector('[data-testid="registry-search-form"]');
      const inputNode = document.querySelector('#registryQuery');
      const buttonNode = document.querySelector('.registrySearchButton');
      const titleNode = document.querySelector('.registryTitle');
      const badgeNode = document.querySelector('.registryBadge');
      const root = document.documentElement;
      if (!(panelNode instanceof HTMLElement) || !(searchNode instanceof HTMLElement) || !(inputNode instanceof HTMLElement) || !(buttonNode instanceof HTMLElement) || !(titleNode instanceof HTMLElement) || !(badgeNode instanceof HTMLElement)) {
        return null;
      }
      const inputRect = inputNode.getBoundingClientRect();
      const buttonRect = buttonNode.getBoundingClientRect();
      return {
        documentWidth: root.scrollWidth,
        viewportWidth: window.innerWidth,
        searchStacked: Math.abs(buttonRect.top - inputRect.top) > 12,
        titleFontSize: Number.parseFloat(window.getComputedStyle(titleNode).fontSize || '0'),
        badgeFontSize: Number.parseFloat(window.getComputedStyle(badgeNode).fontSize || '0'),
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.searchStacked).toBe(viewport.stackedSearch);
    expect(metrics.titleFontSize).toBeGreaterThan(metrics.badgeFontSize);
  }
});
