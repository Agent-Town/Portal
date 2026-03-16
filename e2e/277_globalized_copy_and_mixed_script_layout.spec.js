const { test, expect } = require('@playwright/test');
const { ensureAppShell } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('town shell remains stable under mixed Latin and Simplified Chinese copy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ensureAppShell(page);

  const metrics = await page.evaluate(() => {
    const copy = {
      eyebrow: 'Today in Agent Town / 今日任务',
      title: 'Plan Wagons / 规划马车与协作助手',
      summary: 'Start here to unlock your house, review what matters, and keep progress moving. 从这里开始，完成房屋解锁、查看重点，并继续推进工作。',
      action: 'Open Plan Wagons / 打开规划马车',
      status: 'Support: finish Town Hall first when the town is still locked. 说明：如果城镇仍然锁定，请先完成市政厅。',
      label: 'Town Board / 城镇公告板',
    };

    const assign = (selector, text) => {
      const node = document.querySelector(selector);
      if (node) node.textContent = text;
      return node;
    };

    const eyebrow = assign('#townFocusEyebrow', copy.eyebrow);
    const title = assign('#townFocusTitle', copy.title);
    const summary = assign('#townFocusSummary', copy.summary);
    const action = assign('#townPrimaryAction', copy.action);
    const status = assign('#townSceneStatus', copy.status);
    const label = assign('.townDistrict-board .townDistrictLabel', copy.label);

    const measure = (node) => {
      if (!(node instanceof HTMLElement)) return null;
      const rect = node.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        scrollWidth: Math.round(node.scrollWidth),
        scrollHeight: Math.round(node.scrollHeight),
        clientWidth: Math.round(node.clientWidth),
        clientHeight: Math.round(node.clientHeight),
      };
    };

    return {
      bodyWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      eyebrow: measure(eyebrow),
      title: measure(title),
      summary: measure(summary),
      action: measure(action),
      status: measure(status),
      label: measure(label),
    };
  });

  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);

  for (const key of ['eyebrow', 'title', 'summary', 'action', 'status', 'label']) {
    expect(metrics[key], `${key} should be measurable`).not.toBeNull();
    expect(metrics[key].scrollWidth).toBeLessThanOrEqual(metrics[key].clientWidth + 1);
    expect(metrics[key].scrollHeight).toBeLessThanOrEqual(metrics[key].clientHeight + 2);
  }
});
