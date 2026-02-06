const { test, expect } = require('@playwright/test');
const { reset, uploadBytes } = require('./helpers/avatar');

test.beforeEach(async ({ request }) => {
  await reset(request);
});

test('avatar endpoints have stable contract shapes', async ({ request }) => {
  // Missing image
  const missing = await request.post('/api/avatar/upload', { data: {} });
  expect(missing.status()).toBe(400);
  const missingPayload = await missing.json();
  expect(missingPayload.ok).toBe(false);
  expect(missingPayload.error).toBe('MISSING_IMAGE');

  // Unsupported media type
  const bad = await uploadBytes(request, {
    filename: 'bad.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('nope')
  });
  expect(bad.status()).toBe(415);
  const badPayload = await bad.json();
  expect(badPayload.ok).toBe(false);
  expect(badPayload.error).toBe('UNSUPPORTED_MEDIA_TYPE');

  // Unknown job
  const jobResp = await request.get('/api/avatar/jobs/avj_does_not_exist');
  expect(jobResp.status()).toBe(404);
});
