const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function resetClientStorage(page) {
  await page.goto('/test_blank.html');
  await page.evaluate(async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('openclaw-lite');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });
}

test.describe('OpenClaw Lite: Websocket Tools (M14)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('ws_open/send/recv/close/status cycle works with deterministic timeout and closed-session behavior', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    // Clear deterministic boot approval.
    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const pageUrl = new URL(page.url());
    const wsProtocol = pageUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${pageUrl.host}/__test__/ws/echo`;

    const opened = await page.evaluate(async ({ url }) => {
      return await window.__openclawLiteTest.wsOpen({ url, connectTimeoutMs: 5000 });
    }, { url: wsUrl });
    expect(opened.ok).toBeTruthy();
    expect(opened.data.sessionId).toBeTruthy();

    const sessionId = opened.data.sessionId;

    const statusOpen = await page.evaluate(async ({ sid }) => {
      return await window.__openclawLiteTest.wsStatus({ sessionId: sid });
    }, { sid: sessionId });
    expect(statusOpen.ok).toBeTruthy();
    expect(statusOpen.data.readyState).toBe('open');

    const sentText = await page.evaluate(async ({ sid }) => {
      return await window.__openclawLiteTest.wsSend({ sessionId: sid, text: 'hello ws' });
    }, { sid: sessionId });
    expect(sentText.ok).toBeTruthy();

    const recvText = await page.evaluate(async ({ sid }) => {
      return await window.__openclawLiteTest.wsRecv({ sessionId: sid, maxMessages: 1, waitMs: 2000 });
    }, { sid: sessionId });
    expect(recvText.ok).toBeTruthy();
    expect(recvText.data.messages.length).toBe(1);
    expect(recvText.data.messages[0].text).toBe('hello ws');

    const sentJson = await page.evaluate(async ({ sid }) => {
      return await window.__openclawLiteTest.wsSend({
        sessionId: sid,
        json: { jsonrpc: '2.0', id: 1, method: 'ping' },
      });
    }, { sid: sessionId });
    expect(sentJson.ok).toBeTruthy();

    const recvJson = await page.evaluate(async ({ sid }) => {
      return await window.__openclawLiteTest.wsRecv({ sessionId: sid, maxMessages: 1, waitMs: 2000 });
    }, { sid: sessionId });
    expect(recvJson.ok).toBeTruthy();
    expect(recvJson.data.messages.length).toBe(1);
    expect(recvJson.data.messages[0].json).toBeTruthy();
    expect(recvJson.data.messages[0].json.result).toBe('pong');

    const recvTimeout = await page.evaluate(async ({ sid }) => {
      return await window.__openclawLiteTest.wsRecv({ sessionId: sid, maxMessages: 1, waitMs: 120 });
    }, { sid: sessionId });
    expect(recvTimeout.ok).toBeTruthy();
    expect(Array.isArray(recvTimeout.data.messages)).toBeTruthy();
    expect(recvTimeout.data.messages.length).toBe(0);

    const closed = await page.evaluate(async ({ sid }) => {
      return await window.__openclawLiteTest.wsClose({ sessionId: sid });
    }, { sid: sessionId });
    expect(closed.ok).toBeTruthy();

    const sendAfterClose = await page.evaluate(async ({ sid }) => {
      return await window.__openclawLiteTest.wsSend({ sessionId: sid, text: 'after close' });
    }, { sid: sessionId });
    expect(sendAfterClose.ok).toBeFalsy();
    expect(sendAfterClose.error.code).toBe('NOT_FOUND');
  });
});
