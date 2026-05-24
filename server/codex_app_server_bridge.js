const { spawn } = require('child_process');

const DEFAULT_TIMEOUT_MS = 5000;
let testRateLimitsFixture = null;

function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function sanitizeString(value, maxLength = 120) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;
  return raw.slice(0, maxLength);
}

function sanitizeWindow(windowValue) {
  if (!windowValue || typeof windowValue !== 'object') return null;
  const windowDurationMins = Number(windowValue.windowDurationMins);
  const resetsAt = Number(windowValue.resetsAt);
  return {
    usedPercent: clampPercent(windowValue.usedPercent),
    windowDurationMins: Number.isFinite(windowDurationMins) && windowDurationMins > 0 ? Math.round(windowDurationMins) : null,
    resetsAt: Number.isFinite(resetsAt) && resetsAt > 0 ? Math.round(resetsAt) : null
  };
}

function sanitizeCredits(credits) {
  if (!credits || typeof credits !== 'object') return null;
  return {
    hasCredits: credits.hasCredits === true,
    unlimited: credits.unlimited === true,
    balance: sanitizeString(credits.balance, 64)
  };
}

function sanitizeRateLimitSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const primary = sanitizeWindow(snapshot.primary);
  const secondary = sanitizeWindow(snapshot.secondary);
  if (!primary && !secondary) return null;
  return {
    limitId: sanitizeString(snapshot.limitId, 80),
    limitName: sanitizeString(snapshot.limitName, 120),
    primary,
    secondary,
    credits: sanitizeCredits(snapshot.credits),
    planType: sanitizeString(snapshot.planType, 40),
    rateLimitReachedType: sanitizeString(snapshot.rateLimitReachedType, 80)
  };
}

function resolveRateLimitsPayload(payload) {
  if (payload && typeof payload === 'object' && payload.result && typeof payload.result === 'object') {
    return payload.result;
  }
  return payload && typeof payload === 'object' ? payload : {};
}

function sanitizeRateLimitsResponse(payload, { source = 'codex-app-server' } = {}) {
  const body = resolveRateLimitsPayload(payload);
  const rateLimits = sanitizeRateLimitSnapshot(body.rateLimits);
  const rateLimitsByLimitId = {};
  const byId = body.rateLimitsByLimitId && typeof body.rateLimitsByLimitId === 'object' ? body.rateLimitsByLimitId : {};
  for (const [rawKey, rawSnapshot] of Object.entries(byId)) {
    const key = sanitizeString(rawKey, 80);
    const snapshot = sanitizeRateLimitSnapshot(rawSnapshot);
    if (key && snapshot) rateLimitsByLimitId[key] = snapshot;
  }

  if (!rateLimits && Object.keys(rateLimitsByLimitId).length === 0) {
    const error = new Error('Codex app-server did not return rate-limit data.');
    error.code = 'CODEX_RATE_LIMITS_UNAVAILABLE';
    error.status = 502;
    throw error;
  }

  return {
    ok: true,
    source,
    fetchedAtMs: Date.now(),
    rateLimits,
    rateLimitsByLimitId
  };
}

function createBridgeError(code, message, status = 503) {
  const error = new Error(message || code);
  error.code = code;
  error.status = status;
  return error;
}

function parseFixtureFromEnv() {
  const raw = process.env.CODEX_APP_SERVER_RATE_LIMITS_FIXTURE_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw createBridgeError('CODEX_APP_SERVER_FIXTURE_INVALID', 'Invalid Codex app-server fixture JSON.', 500);
  }
}

function sendJsonLine(child, payload) {
  child.stdin.write(`${JSON.stringify(payload)}\n`);
}

async function requestCodexAppServerRateLimits({ timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (process.env.CODEX_APP_SERVER_DISABLED === '1') {
    throw createBridgeError('CODEX_APP_SERVER_UNAVAILABLE', 'Codex app-server bridge is disabled.', 503);
  }

  const command = String(process.env.CODEX_APP_SERVER_COMMAND || 'codex').trim() || 'codex';
  const child = spawn(command, ['app-server', '--listen', 'stdio://'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env
  });

  let stdoutBuffer = '';
  let stderrBuffer = '';
  const pending = new Map();

  const failAll = (error) => {
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(error);
    }
    pending.clear();
  };

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk;
    let newline = stdoutBuffer.indexOf('\n');
    while (newline >= 0) {
      const line = stdoutBuffer.slice(0, newline).trim();
      stdoutBuffer = stdoutBuffer.slice(newline + 1);
      newline = stdoutBuffer.indexOf('\n');
      if (!line) continue;
      let message = null;
      try {
        message = JSON.parse(line);
      } catch {
        continue;
      }
      const id = message && message.id;
      if (id === undefined || !pending.has(id)) continue;
      const entry = pending.get(id);
      pending.delete(id);
      clearTimeout(entry.timer);
      if (message.error) {
        const code = sanitizeString(message.error.code, 80) || 'CODEX_APP_SERVER_ERROR';
        const details = sanitizeString(message.error.message, 240) || 'Codex app-server returned an error.';
        entry.reject(createBridgeError(code, details, 502));
      } else {
        entry.resolve(message.result || {});
      }
    }
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    stderrBuffer = `${stderrBuffer}${chunk}`.slice(-1200);
  });
  child.on('error', () => {
    failAll(createBridgeError('CODEX_APP_SERVER_UNAVAILABLE', 'Could not start Codex app-server.', 503));
  });
  child.on('exit', (code) => {
    if (pending.size > 0) {
      const detail = sanitizeString(stderrBuffer, 240) || `Codex app-server exited with code ${code}.`;
      failAll(createBridgeError('CODEX_APP_SERVER_UNAVAILABLE', detail, 503));
    }
  });

  let nextId = 1;
  const request = (method, params) => {
    const id = nextId;
    nextId += 1;
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        const error = createBridgeError('CODEX_APP_SERVER_TIMEOUT', 'Codex app-server did not respond in time.', 504);
        reject(error);
        failAll(error);
      }, timeoutMs);
      pending.set(id, { resolve, reject, timer });
    });
    const payload = params === undefined ? { id, method } : { id, method, params };
    sendJsonLine(child, payload);
    return promise;
  };

  try {
    await request('initialize', {
      clientInfo: {
        name: 'portal-openclaw-lite',
        version: '0.1.0',
        title: 'OpenClaw Lite'
      },
      capabilities: {
        experimentalApi: true
      }
    });
    return await request('account/rateLimits/read');
  } finally {
    child.stdin.end();
    child.kill('SIGTERM');
  }
}

async function readCodexAppServerRateLimits(opts = {}) {
  if (testRateLimitsFixture !== null) {
    if (testRateLimitsFixture && testRateLimitsFixture.ok === false) {
      throw createBridgeError(
        sanitizeString(testRateLimitsFixture.error, 80) || 'CODEX_APP_SERVER_UNAVAILABLE',
        sanitizeString(testRateLimitsFixture.message, 240) || 'Codex app-server fixture failure.',
        Number(testRateLimitsFixture.status) || 503
      );
    }
    return sanitizeRateLimitsResponse(testRateLimitsFixture, { source: 'test-fixture' });
  }
  const envFixture = parseFixtureFromEnv();
  if (envFixture) return sanitizeRateLimitsResponse(envFixture, { source: 'env-fixture' });
  const payload = await requestCodexAppServerRateLimits(opts);
  return sanitizeRateLimitsResponse(payload, { source: 'codex-app-server' });
}

function setCodexAppServerRateLimitsFixture(fixture) {
  testRateLimitsFixture = fixture && typeof fixture === 'object' ? fixture : null;
}

function resetCodexAppServerRateLimitsFixture() {
  testRateLimitsFixture = null;
}

module.exports = {
  readCodexAppServerRateLimits,
  resetCodexAppServerRateLimitsFixture,
  sanitizeRateLimitsResponse,
  setCodexAppServerRateLimitsFixture
};
