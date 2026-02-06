const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('record button captures and exports a local clip', async ({ page }) => {
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
          const blob = new Blob(['fake-video-payload'], { type: this.mimeType });
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
  await expect(page.getByTestId('world-clip-download')).toBeVisible();

  const durationText = await page.getByTestId('world-clip-duration').innerText();
  const durationSec = Number(durationText.replace('s', '').trim());
  expect(durationSec).toBeGreaterThanOrEqual(1);
  expect(durationSec).toBeLessThanOrEqual(60);

  const href = await page.getByTestId('world-clip-download').getAttribute('href');
  expect(href && href.startsWith('blob:')).toBeTruthy();
});
