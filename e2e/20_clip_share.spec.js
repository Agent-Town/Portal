const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('uploaded clip transitions to ready and share URL is reachable', async ({ page, request }) => {
  await page.addInitScript(() => {
    class FakeMediaRecorder {
      constructor(stream, opts = {}) {
        this.stream = stream;
        this.mimeType = opts.mimeType || 'video/webm';
        this.state = 'inactive';
        this.ondataavailable = null;
        this.onstop = null;
      }
      static isTypeSupported() {
        return true;
      }
      start() {
        this.state = 'recording';
        this._timer = setTimeout(() => {
          const blob = new Blob(['fake-video-payload-share'], { type: this.mimeType });
          if (this.ondataavailable) this.ondataavailable({ data: blob });
        }, 100);
      }
      stop() {
        clearTimeout(this._timer);
        this.state = 'inactive';
        if (this.onstop) this.onstop();
      }
    }
    window.MediaRecorder = FakeMediaRecorder;
    HTMLCanvasElement.prototype.captureStream = function captureStream() {
      return {
        getTracks() {
          return [{ stop() {} }];
        }
      };
    };
  });

  await page.goto('/world');
  await expect(page.getByTestId('world-status')).toContainText('Loaded');

  await page.getByTestId('world-record-btn').click();
  await page.waitForTimeout(1200);
  await page.getByTestId('world-record-btn').click();
  await expect(page.getByTestId('world-record-status')).toContainText('Clip ready');

  await page.getByTestId('world-upload-clip-btn').click();
  await expect(page.getByTestId('world-upload-status')).toContainText(/Uploading|accepted|ready/i);
  await expect
    .poll(async () => (await page.getByTestId('world-upload-status').innerText()).trim())
    .toContain('Clip ready');

  const shareLink = page.getByTestId('world-clip-share-link');
  await expect(shareLink).toBeVisible();
  const href = await shareLink.getAttribute('href');
  expect(href).toBeTruthy();

  const shareResp = await request.get(href);
  expect(shareResp.ok()).toBeTruthy();

  // Idempotent upload should not fail once ready.
  await page.getByTestId('world-upload-clip-btn').click();
  await expect(page.getByTestId('world-upload-status')).toContainText('Clip ready');
});
