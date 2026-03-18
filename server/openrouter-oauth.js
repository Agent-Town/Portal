/**
 * OpenRouter OAuth PKCE — server-side flow for iterate prototype.
 *
 * Mirrors the existing OpenAI Codex OAuth pattern in index.js but simplified.
 * User clicks "Connect with OpenRouter" → redirected to OpenRouter auth →
 * comes back with a code → exchanged for an API key.
 *
 * Routes:
 *   POST /api/iterate/oauth/openrouter/start    → generate PKCE, return auth URL
 *   GET  /api/iterate/oauth/openrouter/callback  → receive code from OpenRouter redirect
 *   POST /api/iterate/oauth/openrouter/exchange  → exchange code for API key
 *   GET  /api/iterate/oauth/openrouter/status    → poll attempt status
 */

const { Router } = require('express');
const crypto = require('crypto');

const router = Router();

// ── Config ──────────────────────────────────────────────────
const OPENROUTER_AUTH_URL = 'https://openrouter.ai/auth';
const OPENROUTER_EXCHANGE_URL = 'https://openrouter.ai/api/v1/auth/keys';
const ATTEMPT_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ── State ───────────────────────────────────────────────────
const attemptsById = new Map();

function toBase64Url(buf) {
  return (Buffer.isBuffer(buf) ? buf : Buffer.from(buf))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createPkce() {
  const verifier = toBase64Url(crypto.randomBytes(32));
  const challenge = toBase64Url(crypto.createHash('sha256').update(verifier, 'utf8').digest());
  return { verifier, challenge };
}

function cleanup() {
  const now = Date.now();
  for (const [id, a] of attemptsById) {
    if (now > a.expiresAtMs) attemptsById.delete(id);
  }
}

// ── Routes ──────────────────────────────────────────────────

// POST /start — begin the PKCE flow
router.post('/start', (req, res) => {
  cleanup();

  const callbackUrl = `${req.protocol}://${req.get('host')}/api/iterate/oauth/openrouter/callback`;
  const { verifier, challenge } = createPkce();
  const attemptId = `or_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const now = Date.now();

  attemptsById.set(attemptId, {
    id: attemptId,
    verifier,
    callbackUrl,
    createdAtMs: now,
    expiresAtMs: now + ATTEMPT_TTL_MS,
    status: 'pending',      // pending | code_received | completed | failed
    code: '',
    apiKey: null,
    lastError: '',
  });

  const authUrl = new URL(OPENROUTER_AUTH_URL);
  authUrl.searchParams.set('callback_url', callbackUrl);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  res.json({
    ok: true,
    attemptId,
    authorizeUrl: authUrl.toString(),
    expiresAtMs: now + ATTEMPT_TTL_MS,
  });
});

// GET /callback — OpenRouter redirects here with ?code=...
router.get('/callback', (req, res) => {
  const code = typeof req.query?.code === 'string' ? req.query.code.trim() : '';

  if (!code) {
    return res.status(400).send('Missing authorization code from OpenRouter.');
  }

  // Find the most recent pending attempt
  let matched = null;
  for (const [, attempt] of attemptsById) {
    if (attempt.status === 'pending') {
      matched = attempt;
    }
  }

  if (!matched) {
    return res.status(400).send('No pending OAuth attempt found. Please try again.');
  }

  matched.code = code;
  matched.status = 'code_received';
  matched.codeReceivedAtMs = Date.now();

  // Redirect back to the iterate page with the attempt ID
  res.redirect(302, `/iterate?oauth=openrouter&attemptId=${matched.id}`);
});

// POST /exchange — exchange code for API key
router.post('/exchange', async (req, res) => {
  cleanup();

  const attemptId = typeof req.body?.attemptId === 'string' ? req.body.attemptId.trim() : '';
  if (!attemptId) return res.status(400).json({ ok: false, error: 'MISSING_ATTEMPT_ID' });

  const attempt = attemptsById.get(attemptId);
  if (!attempt) return res.status(404).json({ ok: false, error: 'ATTEMPT_NOT_FOUND' });

  if (attempt.status === 'completed' && attempt.apiKey) {
    return res.json({ ok: true, apiKey: attempt.apiKey });
  }

  if (!attempt.code) {
    return res.status(400).json({ ok: false, error: 'NO_CODE_RECEIVED' });
  }

  try {
    const exchangeRes = await fetch(OPENROUTER_EXCHANGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: attempt.code,
        code_verifier: attempt.verifier,
        code_challenge_method: 'S256',
      }),
    });

    if (!exchangeRes.ok) {
      const errBody = await exchangeRes.text().catch(() => '');
      attempt.status = 'failed';
      attempt.lastError = `OpenRouter returned ${exchangeRes.status}: ${errBody.slice(0, 200)}`;
      return res.status(502).json({ ok: false, error: 'EXCHANGE_FAILED', detail: attempt.lastError });
    }

    const data = await exchangeRes.json();
    const apiKey = data.key || data.api_key || '';

    if (!apiKey) {
      attempt.status = 'failed';
      attempt.lastError = 'No API key in OpenRouter response';
      return res.status(502).json({ ok: false, error: 'NO_KEY_IN_RESPONSE' });
    }

    attempt.status = 'completed';
    attempt.apiKey = apiKey;
    attempt.exchangedAtMs = Date.now();

    return res.json({ ok: true, apiKey });

  } catch (e) {
    attempt.status = 'failed';
    attempt.lastError = e.message;
    return res.status(502).json({ ok: false, error: 'EXCHANGE_ERROR', detail: e.message });
  }
});

// GET /status — poll attempt status
router.get('/status', (req, res) => {
  cleanup();
  const attemptId = typeof req.query?.attemptId === 'string' ? req.query.attemptId.trim() : '';
  if (!attemptId) return res.status(400).json({ ok: false, error: 'MISSING_ATTEMPT_ID' });

  const attempt = attemptsById.get(attemptId);
  if (!attempt) return res.status(404).json({ ok: false, error: 'ATTEMPT_NOT_FOUND' });

  return res.json({
    ok: true,
    status: attempt.status,
    hasKey: !!attempt.apiKey,
    lastError: attempt.lastError,
  });
});

module.exports = { openrouterOAuthRouter: router };
