const path = require('path');
const crypto = require('crypto');
const express = require('express');

const { parseCookies, nowIso, randomHex } = require('./util');
const { readStore, writeStore } = require('./store');
const {
  createSession,
  getSessionById,
  getSessionByTeamCode,
  listElements,
  evaluateMatch,
  resetAllSessions,
  CANVAS
} = require('./sessions');

function b64ToBytes(str) {
  const bin = Buffer.from(str, 'base64');
  return new Uint8Array(bin);
}

function bytesToB64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

function sha256Bytes(bytes) {
  return new Uint8Array(crypto.createHash('sha256').update(Buffer.from(bytes)).digest());
}

function sha256Base64(input) {
  return crypto.createHash('sha256').update(input).digest('base64');
}

function base58Encode(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let x = BigInt('0x' + Buffer.from(bytes).toString('hex'));
  let out = '';
  while (x > 0n) {
    const mod = x % 58n;
    out = alphabet[Number(mod)] + out;
    x = x / 58n;
  }
  // leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out = '1' + out;
  return out || '1';
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(
  express.json({
    limit: '200kb',
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    }
  })
);

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    const size = req.rawBody ? req.rawBody.length : 0;
    console.warn(`[bad-json] ${req.method} ${req.originalUrl} (${size} bytes)`);
    return res.status(400).json({ ok: false, error: 'INVALID_JSON' });
  }
  return next(err);
});

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const isProd = process.env.NODE_ENV === 'production';

function setSecurityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');

  const connectSrc = ["'self'", 'https://eth.llamarpc.com', 'https://rpc.ankr.com'];
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'"
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);

  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return next();
}

app.use((req, res, next) => {
  if (isProd && !req.secure) {
    const host = req.get('host');
    if (host) {
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
  }
  return next();
});

app.use(setSecurityHeaders);

// --- rate limiting ---
const rateBuckets = new Map();
function rateLimit({ windowMs, max, keyFn }) {
  return (req, res, next) => {
    const key = keyFn(req);
    if (!key) return next();
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      rateBuckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ ok: false, error: 'RATE_LIMITED' });
    }
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - bucket.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));
    return next();
  };
}

app.use(
  '/api/agent',
  rateLimit({
    windowMs: 60_000,
    max: 120,
    keyFn: (req) => `agent:${req.ip}`
  })
);

app.use(
  '/api/room',
  rateLimit({
    windowMs: 60_000,
    max: 180,
    keyFn: (req) => `room:${req.ip}`
  })
);

const shareLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  keyFn: (req) => `share:${req.ip}`
});
app.use('/api/share/create', shareLimiter);
app.use('/api/human/posts', shareLimiter);
app.use('/api/human/optin', shareLimiter);

function ensureHumanSession(req, res) {
  const cookies = parseCookies(req.header('cookie') || '');
  let sid = cookies.et_session;
  let session = sid ? getSessionById(sid) : null;
  if (!session) {
    session = createSession();
    sid = session.sessionId;
    // Cookie is the only "identity". No external auth required.
    const secureFlag = req.secure ? '; Secure' : '';
    res.setHeader('Set-Cookie', `et_session=${encodeURIComponent(sid)}; Path=/; SameSite=Lax; HttpOnly${secureFlag}`);
  }
  return session;
}

function sanitizeUrl(url) {
  if (typeof url !== 'string') return null;
  const u = url.trim();
  if (!u) return null;
  if (u.length > 500) return null;
  try {
    const parsed = new URL(u);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

const MAX_ROOM_ENTRIES = 200;
const MAX_ROOMS = 500;
const MAX_SHARES = 2000;
const MAX_SIGNUPS = 5000;
const MAX_PUBLIC_TEAMS = 2000;

function extractXHandle(url) {
  if (typeof url !== 'string') return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  const allowed = new Set(['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com']);
  if (!allowed.has(host)) return null;
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (!parts.length) return null;
  const raw = parts[0].startsWith('@') ? parts[0].slice(1) : parts[0];
  const handle = raw.trim();
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;
  const reserved = new Set(['i', 'intent', 'share', 'home']);
  if (reserved.has(handle.toLowerCase())) return null;
  return handle;
}

function palette() {
  // Tiny 8-color palette (0 = empty).
  return [
    '#000000', // 0 empty (rendered as dark)
    '#ffffff',
    '#ff004d',
    '#00e756',
    '#29adff',
    '#ffa300',
    '#7e2553',
    '#fff1e8'
  ];
}

function canvasHasInk(pixels) {
  return Array.isArray(pixels) && pixels.some((p) => p && p !== 0);
}

function isShareLocked(share) {
  return !!share && share.locked !== false;
}

function normalizeAgentName(name) {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^A-Za-z0-9 _().-]/g, '').slice(0, 40);
  return cleaned || null;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyToken(hash, token) {
  if (!hash || !token) return false;
  const next = hashToken(token);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(next, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function resolveShareWithToken(req, session) {
  const bodyShareId = typeof req.body?.shareId === 'string' ? req.body.shareId.trim() : '';
  const shareId = bodyShareId || session.share.id || '';
  if (!shareId) return { ok: false, error: 'SHARE_NOT_READY' };
  const store = readStore();
  const share = store.shares.find((x) => x.id === shareId);
  if (!share) return { ok: false, error: 'NOT_FOUND' };
  const token = typeof req.body?.manageToken === 'string' ? req.body.manageToken.trim() : '';
  if (!token) return { ok: false, error: 'MANAGE_TOKEN_REQUIRED' };
  if (!share.manageTokenHash || !verifyToken(share.manageTokenHash, token)) {
    return { ok: false, error: 'INVALID_TOKEN' };
  }
  session.share.id = shareId;
  session.share.createdAt = share.createdAt || null;
  return { ok: true, shareId, store, share };
}

function decodeB64(input) {
  try {
    return Buffer.from(input, 'base64');
  } catch {
    return null;
  }
}

function verifyRoomAuth(req, room) {
  if (!room || !room.authKey) return { ok: false, error: 'ROOM_AUTH_REQUIRED' };
  const ts = req.header('x-room-ts');
  const auth = req.header('x-room-auth');
  if (!ts || !auth) return { ok: false, error: 'ROOM_AUTH_REQUIRED' };
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return { ok: false, error: 'ROOM_AUTH_INVALID' };
  const skew = Math.abs(Date.now() - tsNum);
  if (skew > 5 * 60 * 1000) return { ok: false, error: 'ROOM_AUTH_EXPIRED' };
  const key = decodeB64(room.authKey);
  if (!key || key.length < 16) return { ok: false, error: 'ROOM_AUTH_INVALID' };
  const bodyHash = sha256Base64(req.rawBody || '');
  const msg = `${room.id}.${ts}.${req.method.toUpperCase()}.${req.path}.${bodyHash}`;
  const expected = crypto.createHmac('sha256', key).update(msg).digest('base64');
  const a = Buffer.from(expected, 'base64');
  const b = Buffer.from(auth, 'base64');
  if (a.length !== b.length) return { ok: false, error: 'ROOM_AUTH_INVALID' };
  if (!crypto.timingSafeEqual(a, b)) return { ok: false, error: 'ROOM_AUTH_INVALID' };
  return { ok: true };
}

// --- API ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: nowIso() });
});

app.get('/api/session', (req, res) => {
  const s = ensureHumanSession(req, res);
  const store = readStore();
  res.json({
    ok: true,
    teamCode: s.teamCode,
    elements: listElements(),
    stats: {
      signups: store.signups.length,
      publicTeams: store.publicTeams.length
    }
  });
});

app.get('/api/state', (req, res) => {
  const s = ensureHumanSession(req, res);
  const store = readStore();
  res.json({
    ok: true,
    teamCode: s.teamCode,
    elements: listElements(),
    agent: {
      connected: s.agent.connected,
      name: s.agent.name,
      selected: s.agent.selected,
      openPressed: s.agent.openPressed,
      optIn: s.agent.optIn,
      posts: s.agent.posts
    },
    human: {
      selected: s.human.selected,
      openPressed: s.human.openPressed,
      optIn: s.human.optIn,
      xPostUrl: s.human.xPostUrl
    },
    match: s.match,
    signup: s.signup,
    share: s.share,
    stats: {
      signups: store.signups.length,
      publicTeams: store.publicTeams.length
    }
  });
});

app.post('/api/referral', (req, res) => {
  const s = ensureHumanSession(req, res);
  const shareId = typeof req.body?.shareId === 'string' ? req.body.shareId.trim() : '';
  if (!shareId) return res.status(400).json({ ok: false, error: 'MISSING_SHARE_ID' });
  const store = readStore();
  const share = store.shares.find((x) => x.id === shareId);
  if (!share) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  s.referral.shareId = shareId;
  res.json({ ok: true });
});

app.post('/api/human/select', (req, res) => {
  const s = ensureHumanSession(req, res);
  const elementId = typeof req.body?.elementId === 'string' ? req.body.elementId.trim() : '';
  const allowed = new Set(listElements().map((e) => e.id));
  if (!allowed.has(elementId)) return res.status(400).json({ ok: false, error: 'INVALID_ELEMENT' });
  s.human.selected = elementId;
  evaluateMatch(s);
  res.json({ ok: true, match: s.match, humanSelected: s.human.selected });
});

app.post('/api/agent/connect', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const agentName = normalizeAgentName(req.body?.agentName);
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  s.agent.connected = true;
  s.agent.name = agentName || s.agent.name || 'OpenClaw';
  res.json({ ok: true });
});

app.get('/api/agent/state', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  res.json({
    ok: true,
    agent: s.agent,
    human: {
      selected: s.human.selected,
      openPressed: s.human.openPressed,
      optIn: s.human.optIn,
      xPostUrl: s.human.xPostUrl
    },
    match: s.match,
    signup: s.signup,
    share: s.share,
    canvas: { w: s.canvas.w, h: s.canvas.h },
    roomId: s.roomCeremony?.roomId || null
  });
});

app.post('/api/agent/select', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const elementId = typeof req.body?.elementId === 'string' ? req.body.elementId.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  const allowed = new Set(listElements().map((e) => e.id));
  if (!allowed.has(elementId)) return res.status(400).json({ ok: false, error: 'INVALID_ELEMENT' });
  s.agent.selected = elementId;
  evaluateMatch(s);
  res.json({ ok: true, match: s.match, agentSelected: s.agent.selected });
});

function maybeCompleteOpen(session) {
  if (!session.match.matched) return { complete: false, reason: 'LOCKED' };
  if (!session.human.openPressed || !session.agent.openPressed) return { complete: false, reason: 'WAITING' };

  if (session.signup.complete) {
    return { complete: true, already: true };
  }

  const store = readStore();
  if (store.signups.length >= MAX_SIGNUPS) {
    return { complete: false, reason: 'STORE_FULL' };
  }
  const signupId = `s_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const referralShareId = session.referral?.shareId || null;
  const record = {
    id: signupId,
    createdAt: nowIso(),
    teamCode: session.teamCode,
    agentName: session.agent.name || null,
    matchedElement: session.match.elementId,
    referralShareId
  };
  if (referralShareId) {
    const share = store.shares.find((x) => x.id === referralShareId);
    if (share) {
      share.referrals = typeof share.referrals === 'number' ? share.referrals + 1 : 1;
    }
  }
  store.signups.push(record);
  writeStore(store);

  session.signup.complete = true;
  session.signup.createdAt = record.createdAt;

  return { complete: true, already: false, createdAt: record.createdAt };
}

app.post('/api/human/open/press', (req, res) => {
  const s = ensureHumanSession(req, res);
  if (!s.match.matched) return res.status(403).json({ ok: false, error: 'LOCKED' });
  s.human.openPressed = true;

  const status = maybeCompleteOpen(s);
  res.json({ ok: true, status, nextUrl: status.complete ? '/create' : null });
});

app.post('/api/agent/open/press', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  if (!s.match.matched) return res.status(403).json({ ok: false, error: 'LOCKED' });
  s.agent.openPressed = true;

  const status = maybeCompleteOpen(s);
  res.json({ ok: true, status, nextUrl: status.complete ? '/create' : null });
});

// Canvas state
app.get('/api/canvas/state', (req, res) => {
  const s = ensureHumanSession(req, res);
  res.json({ ok: true, canvas: s.canvas, palette: palette() });
});

function paint(session, x, y, color) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return { ok: false, error: 'INVALID_COORDS' };
  if (!Number.isInteger(color) || color < 0 || color >= palette().length) return { ok: false, error: 'INVALID_COLOR' };
  if (x < 0 || x >= CANVAS.w || y < 0 || y >= CANVAS.h) return { ok: false, error: 'OUT_OF_BOUNDS' };
  const idx = y * CANVAS.w + x;
  session.canvas.pixels[idx] = color;
  return { ok: true };
}

app.post('/api/human/canvas/paint', (req, res) => {
  const s = ensureHumanSession(req, res);
  const x = req.body?.x;
  const y = req.body?.y;
  const color = req.body?.color;
  const result = paint(s, x, y, color);
  if (!result.ok) return res.status(400).json(result);
  res.json({ ok: true });
});

app.post('/api/agent/canvas/paint', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  const x = req.body?.x;
  const y = req.body?.y;
  const color = req.body?.color;
  const result = paint(s, x, y, color);
  if (!result.ok) return res.status(400).json(result);
  res.json({ ok: true });
});

// --- Room ceremony (agent + human) ---
app.get('/api/agent/room/state', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  res.json({
    ok: true,
    teamCode: s.teamCode,
    ceremony: {
      humanCommit: !!s.roomCeremony?.humanCommit,
      agentCommit: !!s.roomCeremony?.agentCommit,
      humanReveal: !!s.roomCeremony?.humanReveal,
      agentReveal: !!s.roomCeremony?.agentReveal,
      roomId: s.roomCeremony?.roomId || null
    }
  });
});

app.post('/api/agent/room/commit', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const commit = typeof req.body?.commit === 'string' ? req.body.commit.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  if (!commit) return res.status(400).json({ ok: false, error: 'MISSING_COMMIT' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  s.roomCeremony.agentCommit = commit;
  res.json({ ok: true });
});

app.post('/api/agent/room/reveal', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const reveal = typeof req.body?.reveal === 'string' ? req.body.reveal.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  if (!reveal) return res.status(400).json({ ok: false, error: 'MISSING_REVEAL' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });

  // Verify reveal matches commit if present.
  const ra = b64ToBytes(reveal);
  const ch = bytesToB64(sha256Bytes(ra));
  if (s.roomCeremony.agentCommit && s.roomCeremony.agentCommit !== ch) {
    return res.status(400).json({ ok: false, error: 'COMMIT_MISMATCH' });
  }

  s.roomCeremony.agentReveal = reveal;

  // If both reveals exist, compute roomId and store it (no secrets persisted).
  if (s.roomCeremony.humanReveal && s.roomCeremony.agentReveal) {
    const rh = b64ToBytes(s.roomCeremony.humanReveal);
    const combo = new Uint8Array(rh.length + ra.length);
    combo.set(rh, 0);
    combo.set(ra, rh.length);
    const kroot = sha256Bytes(combo);
    const roomIdBytes = sha256Bytes(kroot);
    s.roomCeremony.roomId = base58Encode(roomIdBytes);
    s.roomCeremony.createdAt = s.roomCeremony.createdAt || nowIso();
  }

  res.json({ ok: true, roomId: s.roomCeremony.roomId || null });
});

app.post('/api/human/room/commit', (req, res) => {
  const s = ensureHumanSession(req, res);
  const commit = typeof req.body?.commit === 'string' ? req.body.commit.trim() : '';
  if (!commit) return res.status(400).json({ ok: false, error: 'MISSING_COMMIT' });
  s.roomCeremony.humanCommit = commit;
  res.json({ ok: true });
});

app.post('/api/human/room/reveal', (req, res) => {
  const s = ensureHumanSession(req, res);
  const reveal = typeof req.body?.reveal === 'string' ? req.body.reveal.trim() : '';
  if (!reveal) return res.status(400).json({ ok: false, error: 'MISSING_REVEAL' });

  const rh = b64ToBytes(reveal);
  const ch = bytesToB64(sha256Bytes(rh));
  if (s.roomCeremony.humanCommit && s.roomCeremony.humanCommit !== ch) {
    return res.status(400).json({ ok: false, error: 'COMMIT_MISMATCH' });
  }

  s.roomCeremony.humanReveal = reveal;

  // If both reveals exist, compute roomId.
  if (s.roomCeremony.humanReveal && s.roomCeremony.agentReveal) {
    const ra = b64ToBytes(s.roomCeremony.agentReveal);
    const combo = new Uint8Array(rh.length + ra.length);
    combo.set(rh, 0);
    combo.set(ra, rh.length);
    const kroot = sha256Bytes(combo);
    const roomIdBytes = sha256Bytes(kroot);
    s.roomCeremony.roomId = base58Encode(roomIdBytes);
    s.roomCeremony.createdAt = s.roomCeremony.createdAt || nowIso();
  }

  res.json({ ok: true, roomId: s.roomCeremony.roomId || null });
});

app.get('/api/human/room/state', (req, res) => {
  const s = ensureHumanSession(req, res);
  res.json({
    ok: true,
    ceremony: {
      humanCommit: !!s.roomCeremony?.humanCommit,
      agentCommit: !!s.roomCeremony?.agentCommit,
      humanReveal: !!s.roomCeremony?.humanReveal,
      agentReveal: !!s.roomCeremony?.agentReveal,
      roomId: s.roomCeremony?.roomId || null
    }
  });
});

app.get('/api/human/room/material', (req, res) => {
  const s = ensureHumanSession(req, res);
  res.json({
    ok: true,
    roomId: s.roomCeremony?.roomId || null,
    humanReveal: s.roomCeremony?.humanReveal || null,
    agentReveal: s.roomCeremony?.agentReveal || null
  });
});

app.get('/api/agent/room/material', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  res.json({ ok: true, roomId: s.roomCeremony?.roomId || null, humanReveal: s.roomCeremony?.humanReveal || null });
});

// Share creation + retrieval
app.post('/api/share/create', (req, res) => {
  const s = ensureHumanSession(req, res);
  if (!s.signup.complete) return res.status(403).json({ ok: false, error: 'SIGNUP_REQUIRED' });
  if (!canvasHasInk(s.canvas.pixels)) {
    return res.status(403).json({ ok: false, error: 'EMPTY_CANVAS' });
  }

  const store = readStore();
  if (store.shares.length >= MAX_SHARES) {
    return res.status(403).json({ ok: false, error: 'STORE_FULL' });
  }
  const shareId = `sh_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const manageToken = randomHex(16);
  const manageTokenHash = hashToken(manageToken);
  const record = {
    id: shareId,
    createdAt: nowIso(),
    matchedElement: s.match.elementId,
    agentName: s.agent.name,
    pixels: s.canvas.pixels,
    canvas: { w: s.canvas.w, h: s.canvas.h },
    // These are optionally added later:
    xPostUrl: s.human.xPostUrl,
    humanHandle: s.human.xHandle || null,
    agentPosts: {
      moltbookUrl: s.agent.posts?.moltbookUrl || null
    },
    referrals: 0,
    locked: true,
    lockedAt: nowIso(),
    optIn: { human: null, agent: null },
    public: false,
    manageTokenHash
  };

  store.shares.push(record);
  writeStore(store);

  s.share.id = shareId;
  s.share.createdAt = record.createdAt;

  res.json({
    ok: true,
    shareId,
    sharePath: `/s/${shareId}`,
    managePath: `/share/${shareId}?k=${manageToken}`
  });
});

app.get('/api/share/:id', (req, res) => {
  const id = req.params.id;
  const store = readStore();
  const rec = store.shares.find((x) => x.id === id);
  if (!rec) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const { teamCode, ...rest } = rec;
  if (rest.agentPosts) {
    rest.agentPosts = { moltbookUrl: rest.agentPosts.moltbookUrl || null };
  }
  res.json({ ok: true, share: rest, palette: palette() });
});

app.get('/api/agent/share/instructions', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s || !s.share.id) return res.status(404).json({ ok: false, error: 'SHARE_NOT_READY' });

  const sharePath = `/s/${s.share.id}`;
  // We don't know the public hostname; agent should use the same base URL as configured.
  const agentText = `We just unlocked Agent Town together (human + agent co-op).\n\nShare: {BASE_URL}${sharePath}`;
  const humanText = `I teamed up with my OpenClaw agent and unlocked Agent Town.\n\n{BASE_URL}${sharePath}`;

  res.json({ ok: true, shareId: s.share.id, sharePath, agentPostText: agentText, humanPostText: humanText });
});

// Posts
app.post('/api/human/posts', (req, res) => {
  const s = ensureHumanSession(req, res);
  const wantsShare = Boolean(req.body?.shareId || s.share.id);
  const resolved = wantsShare ? resolveShareWithToken(req, s) : null;
  if (resolved && !resolved.ok && resolved.error !== 'SHARE_NOT_READY') {
    return res.status(resolved.error === 'NOT_FOUND' ? 404 : 403).json({ ok: false, error: resolved.error });
  }
  const url = sanitizeUrl(req.body?.xPostUrl);
  if (!url) return res.status(400).json({ ok: false, error: 'INVALID_URL' });
  const handle = extractXHandle(url);
  const store = (resolved && resolved.store) || readStore();
  if (handle) {
    const handleLower = handle.toLowerCase();
    const takenBySignup = store.signups.some(
      (rec) => rec.humanHandle && rec.humanHandle.toLowerCase() === handleLower && rec.teamCode !== s.teamCode
    );
    const takenByShare = store.shares.some((rec) => {
      const recHandle = rec.humanHandle || extractXHandle(rec.xPostUrl);
      if (!recHandle || recHandle.toLowerCase() !== handleLower) return false;
      return resolved ? rec.id !== resolved.shareId : true;
    });
    const takenByPublic = store.publicTeams.some((rec) => {
      const recHandle = rec.humanHandle || extractXHandle(rec.xPostUrl);
      return !!recHandle && recHandle.toLowerCase() === handleLower;
    });
    if (takenBySignup || takenByShare || takenByPublic) {
      return res.status(409).json({ ok: false, error: 'HANDLE_TAKEN' });
    }
  }
  s.human.xPostUrl = url;
  s.human.xHandle = handle;

  let signupsChanged = false;
  if (handle) {
    const signup = store.signups.find((rec) => rec.teamCode === s.teamCode);
    if (signup) {
      signup.humanHandle = handle;
      signupsChanged = true;
    }
  }
  const rec = resolved && resolved.ok ? (resolved.share || store.shares.find((x) => x.id === resolved.shareId)) : null;
  if (rec) {
    rec.xPostUrl = url;
    rec.humanHandle = handle;
    const pub = store.publicTeams.find((p) => p.shareId === s.share.id);
    if (pub) {
      pub.xPostUrl = url;
      pub.humanHandle = handle;
    }
    writeStore(store);
  } else if (signupsChanged) {
    writeStore(store);
  }
  res.json({ ok: true });
});

app.post('/api/agent/posts', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });

  const moltbookUrl = sanitizeUrl(req.body?.moltbookUrl);

  s.agent.posts.moltbookUrl = moltbookUrl;

  if (s.share.id) {
    const store = readStore();
    const rec = store.shares.find((x) => x.id === s.share.id);
    if (rec) {
      rec.agentPosts = { moltbookUrl };
      const pub = store.publicTeams.find((p) => p.shareId === s.share.id);
      if (pub) {
        pub.agentPosts = { moltbookUrl };
      }
      writeStore(store);
    }
  }
  res.json({ ok: true });
});

// Opt-in gating: only list team if BOTH opted in.
function maybeAddToLeaderboard(session) {
  if (!session.share.id) return { ok: false, error: 'SHARE_NOT_READY' };
  if (session.human.optIn !== true || session.agent.optIn !== true) return { ok: false, error: 'WAITING' };

  const store = readStore();
  if (store.publicTeams.length >= MAX_PUBLIC_TEAMS) {
    return { ok: false, error: 'STORE_FULL' };
  }

  const already = store.publicTeams.find((p) => p.shareId === session.share.id);
  if (already) return { ok: true, already: true };

  const share = store.shares.find((x) => x.id === session.share.id);
  if (!share) return { ok: false, error: 'SHARE_NOT_FOUND' };

  const humanHandle = share.humanHandle || extractXHandle(share.xPostUrl);
  const record = {
    id: `p_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    shareId: session.share.id,
    sharePath: `/s/${session.share.id}`,
    matchedElement: session.match.elementId,
    agentName: session.agent.name,
    xPostUrl: share.xPostUrl,
    humanHandle,
    agentPosts: share.agentPosts
  };

  store.publicTeams.unshift(record);
  share.public = true;
  share.optIn = { human: true, agent: true };

  writeStore(store);
  return { ok: true, already: false };
}

app.post('/api/human/optin', (req, res) => {
  const s = ensureHumanSession(req, res);
  const resolved = resolveShareWithToken(req, s);
  if (!resolved.ok) {
    return res.status(resolved.error === 'NOT_FOUND' ? 404 : 403).json({ ok: false, error: resolved.error });
  }
  const appear = typeof req.body?.appear === 'boolean' ? req.body.appear : null;
  if (appear === null) return res.status(400).json({ ok: false, error: 'MISSING_APPEAR' });
  s.human.optIn = appear;

  const store = resolved.store || readStore();
  const share = resolved.share || store.shares.find((x) => x.id === resolved.shareId);
  if (share) {
    share.optIn = { ...(share.optIn || {}), human: appear };
    writeStore(store);
  }

  const result = maybeAddToLeaderboard(s);
  res.json({ ok: true, result });
});

app.post('/api/agent/optin', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const appear = typeof req.body?.appear === 'boolean' ? req.body.appear : null;
  if (appear === null) return res.status(400).json({ ok: false, error: 'MISSING_APPEAR' });

  const s = getSessionByTeamCode(teamCode);
  if (!s || !s.share.id) return res.status(404).json({ ok: false, error: 'SHARE_NOT_READY' });

  s.agent.optIn = appear;

  const store = readStore();
  const share = store.shares.find((x) => x.id === s.share.id);
  if (share) {
    share.optIn = { ...(share.optIn || {}), agent: appear };
    writeStore(store);
  }

  const result = maybeAddToLeaderboard(s);
  res.json({ ok: true, result });
});

function buildLeaderboard(store) {
  const referralsByShare = new Map(
    store.shares.map((s) => [s.id, typeof s.referrals === 'number' ? s.referrals : 0])
  );
  const teams = store.publicTeams.map((p) => ({
    ...p,
    humanHandle: p.humanHandle || extractXHandle(p.xPostUrl),
    referrals: referralsByShare.get(p.shareId) || 0,
    agentPosts: p.agentPosts ? { moltbookUrl: p.agentPosts.moltbookUrl || null } : null
  }));
  teams.sort((a, b) => (b.referrals || 0) - (a.referrals || 0));
  const referralsTotal = teams.reduce((sum, t) => sum + (t.referrals || 0), 0);
  return { teams, referralsTotal };
}

app.get('/api/leaderboard', (_req, res) => {
  const store = readStore();
  const { teams, referralsTotal } = buildLeaderboard(store);
  res.json({ ok: true, signups: store.signups.length, referralsTotal, teams });
});

app.get('/api/wall', (_req, res) => {
  const store = readStore();
  const { teams, referralsTotal } = buildLeaderboard(store);
  res.json({ ok: true, signups: store.signups.length, referralsTotal, teams });
});

// --- Test-only reset endpoint ---
if (process.env.NODE_ENV === 'test') {
  app.post('/__test__/reset', (_req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = _req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    writeStore({ signups: [], shares: [], publicTeams: [], rooms: [] });
    resetAllSessions();
    res.json({ ok: true });
  });
}

// --- Rooms (Phase 1 MVP) ---
function makeNonce() {
  return `n_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

app.get('/api/room/nonce', (_req, res) => {
  res.json({ ok: true, nonce: makeNonce() });
});

app.post('/api/room/init', (req, res) => {
  const roomId = typeof req.body?.roomId === 'string' ? req.body.roomId.trim() : '';
  const roomPubKey = typeof req.body?.roomPubKey === 'string' ? req.body.roomPubKey.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const keyMode = typeof req.body?.keyMode === 'string' ? req.body.keyMode.trim() : 'ceremony';
  const unlock = req.body?.unlock || null;
  const roomAuthKey = typeof req.body?.roomAuthKey === 'string' ? req.body.roomAuthKey.trim() : '';

  if (!roomId || !roomPubKey) return res.status(400).json({ ok: false, error: 'MISSING_ROOM_ID' });
  if (roomId !== roomPubKey) return res.status(400).json({ ok: false, error: 'ROOM_ID_MISMATCH' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (!roomAuthKey) return res.status(400).json({ ok: false, error: 'MISSING_ROOM_AUTH' });
  const authKeyBytes = decodeB64(roomAuthKey);
  if (!authKeyBytes || authKeyBytes.length < 16) {
    return res.status(400).json({ ok: false, error: 'INVALID_ROOM_AUTH' });
  }

  // Converged for today's publish: ceremony-only rooms.
  if (keyMode !== 'ceremony') {
    return res.status(400).json({ ok: false, error: 'CEREMONY_ONLY' });
  }

  const store = readStore();
  if (store.rooms.length >= MAX_ROOMS) {
    return res.status(403).json({ ok: false, error: 'STORE_FULL' });
  }
  const exists = store.rooms.find((r) => r.id === roomId);
  if (exists) return res.status(409).json({ ok: false, error: 'ROOM_EXISTS' });

  store.rooms.push({
    id: roomId,
    roomPubKey,
    createdAt: nowIso(),
    nonce,
    keyMode: 'ceremony',
    unlock,
    authKey: roomAuthKey,
    entries: []
  });
  writeStore(store);

  res.json({ ok: true, roomId });
});

app.get('/api/room/:id/meta', (req, res) => {
  const roomId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!roomId) return res.status(400).json({ ok: false, error: 'MISSING_ROOM_ID' });
  const store = readStore();
  const room = store.rooms.find((r) => r.id === roomId);
  if (!room) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyRoomAuth(req, room);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
  res.json({
    ok: true,
    roomId: room.id,
    roomPubKey: room.roomPubKey,
    nonce: room.nonce,
    keyMode: 'ceremony'
  });
});

app.get('/api/room/:id/descriptor', (req, res) => {
  const roomId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!roomId) return res.status(400).json({ ok: false, error: 'MISSING_ROOM_ID' });
  const store = readStore();
  const room = store.rooms.find((r) => r.id === roomId);
  if (!room) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyRoomAuth(req, room);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const origin = `${req.protocol}://${req.get('host')}`;
  res.json({
    ok: true,
    descriptor: {
      v: 1,
      kind: 'agent-town-room',
      room: {
        id: room.id,
        pub: room.roomPubKey,
        mailboxes: [
          {
            chain: 'solana',
            kind: 'pda',
            status: 'placeholder',
            address: 'PDA_TODO',
            program: 'PROGRAM_TODO'
          }
        ]
      },
      endpoints: {
        meta: `${origin}/api/room/${encodeURIComponent(room.id)}/meta`,
        log: `${origin}/api/room/${encodeURIComponent(room.id)}/log`,
        append: `${origin}/api/room/${encodeURIComponent(room.id)}/append`
      },
      ui: {
        roomUrl: `${origin}/room?room=${encodeURIComponent(room.id)}`
      }
    }
  });
});

app.get('/api/room/:id/log', (req, res) => {
  const roomId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!roomId) return res.status(400).json({ ok: false, error: 'MISSING_ROOM_ID' });
  const store = readStore();
  const room = store.rooms.find((r) => r.id === roomId);
  if (!room) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyRoomAuth(req, room);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
  res.json({ ok: true, entries: Array.isArray(room.entries) ? room.entries : [] });
});

app.post('/api/room/:id/append', (req, res) => {
  const roomId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!roomId) return res.status(400).json({ ok: false, error: 'MISSING_ROOM_ID' });
  const ciphertext = req.body?.ciphertext;
  const author = typeof req.body?.author === 'string' ? req.body.author.trim() : 'unknown';
  if (!ciphertext || typeof ciphertext.iv !== 'string' || typeof ciphertext.ct !== 'string') {
    return res.status(400).json({ ok: false, error: 'INVALID_CIPHERTEXT' });
  }

  const store = readStore();
  const room = store.rooms.find((r) => r.id === roomId);
  if (!room) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyRoomAuth(req, room);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
  room.entries = Array.isArray(room.entries) ? room.entries : [];
  if (room.entries.length >= MAX_ROOM_ENTRIES) {
    return res.status(403).json({ ok: false, error: 'ROOM_FULL' });
  }
  room.entries.push({
    id: `re_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    author,
    ciphertext
  });
  writeStore(store);
  res.json({ ok: true });
});

// --- Static + routes ---
app.use(
  express.static(PUBLIC_DIR, {
    etag: true,
    maxAge: isProd ? '1h' : 0,
    setHeaders: (res) => {
      if (!isProd) {
        res.setHeader('Cache-Control', 'no-store');
      }
    }
  })
);

app.get('/create', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'create.html')));
app.get('/room', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'room.html')));
app.get('/leaderboard', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'leaderboard.html')));
app.get('/wall', (_req, res) => res.redirect(302, '/leaderboard'));
app.get('/share/:id', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'share_manage.html')));
app.get('/s/:id', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'share.html')));

// Default route
app.get('*', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

const port = Number(process.env.PORT || 4173);
app.listen(port, () => {
  console.log(`[agent-town] http://localhost:${port}`);
});
