const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

function fixturePath(name) {
  // Reuse avatar fixtures for static assets (any PNG works).
  return path.join(process.cwd(), 'e2e', 'fixtures', 'avatar', name);
}

async function reset(request) {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
}

async function uploadFixture(request, name, { fields = {}, headers } = {}) {
  const p = fixturePath(name);
  const buf = fs.readFileSync(p);
  const resp = await request.post('/api/static-asset/upload', {
    headers,
    multipart: {
      asset: {
        name,
        mimeType: 'image/png',
        buffer: buf
      },
      ...fields
    }
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

async function uploadBytes(request, { filename, mimeType, buffer, fields = {}, headers } = {}) {
  const resp = await request.post('/api/static-asset/upload', {
    headers,
    multipart: {
      asset: {
        name: filename || 'upload.bin',
        mimeType: mimeType || 'application/octet-stream',
        buffer: buffer || Buffer.from('')
      },
      ...fields
    }
  });
  return resp;
}

async function waitForTerminalJob(request, jobId, timeoutMs = 25000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const r = await request.get(`/api/static-asset/jobs/${encodeURIComponent(jobId)}`);
    expect(r.ok()).toBeTruthy();
    const payload = await r.json();
    const status = payload?.job?.status;
    if (status === 'completed' || status === 'failed') {
      return payload.job;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error(`Timed out waiting for static-asset job ${jobId}`);
}

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function pngSize(pngBuf) {
  if (!Buffer.isBuffer(pngBuf) || pngBuf.length < 24) throw new Error('BAD_PNG');
  const sig = pngBuf.subarray(0, 8).toString('hex');
  if (sig !== '89504e470d0a1a0a') throw new Error('BAD_PNG');
  const chunk = pngBuf.subarray(12, 16).toString('ascii');
  if (chunk !== 'IHDR') throw new Error('BAD_PNG');
  const w = pngBuf.readUInt32BE(16);
  const h = pngBuf.readUInt32BE(20);
  return { w, h };
}

module.exports = {
  fixturePath,
  reset,
  uploadFixture,
  uploadBytes,
  waitForTerminalJob,
  sha256Hex,
  pngSize
};

