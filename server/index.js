const path = require('path');
const express = require('express');

const { parseCookies, nowIso, isValidEmail } = require('./util');
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

const app = express();
app.disable('x-powered-by');
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

function ensureHumanSession(req, res) {
  const cookies = parseCookies(req.header('cookie') || '');
  let sid = cookies.et_session;
  let session = sid ? getSessionById(sid) : null;
  if (!session) {
    session = createSession();
    sid = session.sessionId;
    // Cookie is the only "identity". No external auth required.
    res.setHeader('Set-Cookie', `et_session=${encodeURIComponent(sid)}; Path=/; SameSite=Lax; HttpOnly`);
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

function resolveHumanShare(req, session) {
  if (session.share.id) return { ok: true, shareId: session.share.id };
  const shareId = typeof req.body?.shareId === 'string' ? req.body.shareId.trim() : '';
  if (!shareId) return { ok: false, error: 'SHARE_NOT_READY' };
  const store = readStore();
  const share = store.shares.find((x) => x.id === shareId);
  if (!share) return { ok: false, error: 'NOT_FOUND' };
  session.share.id = shareId;
  session.share.createdAt = share.createdAt || null;
  return { ok: true, shareId, store, share };
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
      betaPressed: s.agent.betaPressed,
      optIn: s.agent.optIn,
      posts: s.agent.posts
    },
    human: {
      selected: s.human.selected,
      betaPressed: s.human.betaPressed,
      optIn: s.human.optIn,
      email: s.human.email ? 'set' : null,
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
  const agentName = typeof req.body?.agentName === 'string' ? req.body.agentName.trim() : '';
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
      betaPressed: s.human.betaPressed,
      optIn: s.human.optIn,
      xPostUrl: s.human.xPostUrl
    },
    match: s.match,
    signup: s.signup,
    share: s.share,
    canvas: { w: s.canvas.w, h: s.canvas.h }
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

function maybeCompleteSignup(session) {
  if (!session.match.matched) return { complete: false, reason: 'LOCKED' };
  if (!session.human.betaPressed || !session.agent.betaPressed) return { complete: false, reason: 'WAITING' };
  if (!isValidEmail(session.human.email || '')) return { complete: false, reason: 'MISSING_EMAIL' };

  if (session.signup.complete) {
    return { complete: true, already: true };
  }

  const store = readStore();
  const signupId = `s_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const record = {
    id: signupId,
    createdAt: nowIso(),
    email: session.human.email,
    teamCode: session.teamCode,
    agentName: session.agent.name || null,
    matchedElement: session.match.elementId
  };
  store.signups.push(record);
  writeStore(store);

  session.signup.complete = true;
  session.signup.createdAt = record.createdAt;

  return { complete: true, already: false, createdAt: record.createdAt };
}

app.post('/api/human/beta/press', (req, res) => {
  const s = ensureHumanSession(req, res);
  if (!s.match.matched) return res.status(403).json({ ok: false, error: 'LOCKED' });
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: 'INVALID_EMAIL' });
  s.human.betaPressed = true;
  s.human.email = email;

  const status = maybeCompleteSignup(s);
  res.json({ ok: true, status, nextUrl: status.complete ? '/create' : null });
});

app.post('/api/agent/beta/press', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  if (!s.match.matched) return res.status(403).json({ ok: false, error: 'LOCKED' });
  s.agent.betaPressed = true;

  const status = maybeCompleteSignup(s);
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

// Share creation + retrieval
app.post('/api/share/create', (req, res) => {
  const s = ensureHumanSession(req, res);
  if (!s.signup.complete) return res.status(403).json({ ok: false, error: 'SIGNUP_REQUIRED' });
  if (!canvasHasInk(s.canvas.pixels)) {
    return res.status(403).json({ ok: false, error: 'EMPTY_CANVAS' });
  }
  if (!s.human.xPostUrl || !s.agent.posts?.moltbookUrl) {
    return res.status(403).json({ ok: false, error: 'POSTS_REQUIRED' });
  }

  const store = readStore();
  const shareId = `sh_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
      moltbookUrl: s.agent.posts?.moltbookUrl || null,
      moltXUrl: s.agent.posts?.moltXUrl || null
    },
    locked: true,
    lockedAt: nowIso(),
    optIn: { human: null, agent: null },
    public: false
  };

  store.shares.push(record);
  writeStore(store);

  s.share.id = shareId;
  s.share.createdAt = record.createdAt;

  res.json({ ok: true, shareId, sharePath: `/s/${shareId}`, managePath: `/share/${shareId}` });
});

app.get('/api/share/:id', (req, res) => {
  const id = req.params.id;
  const store = readStore();
  const rec = store.shares.find((x) => x.id === id);
  if (!rec) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const { teamCode, ...rest } = rec;
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
  const resolved = resolveHumanShare(req, s);
  if (!resolved.ok && resolved.error !== 'SHARE_NOT_READY') {
    return res.status(resolved.error === 'NOT_FOUND' ? 404 : 403).json({ ok: false, error: resolved.error });
  }
  const url = sanitizeUrl(req.body?.xPostUrl);
  if (!url) return res.status(400).json({ ok: false, error: 'INVALID_URL' });
  const handle = extractXHandle(url);
  const store = resolved.store || readStore();
  if (handle) {
    const handleLower = handle.toLowerCase();
    const takenBySignup = store.signups.some(
      (rec) => rec.humanHandle && rec.humanHandle.toLowerCase() === handleLower && rec.teamCode !== s.teamCode
    );
    const takenByShare = store.shares.some((rec) => {
      const recHandle = rec.humanHandle || extractXHandle(rec.xPostUrl);
      if (!recHandle || recHandle.toLowerCase() !== handleLower) return false;
      return rec.id !== resolved.shareId;
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
  const rec = resolved.ok ? (resolved.share || store.shares.find((x) => x.id === resolved.shareId)) : null;
  if (rec) {
    if (isShareLocked(rec)) {
      return res.status(403).json({ ok: false, error: 'LOCKED' });
    }
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
  const moltXUrl = sanitizeUrl(req.body?.moltXUrl);

  s.agent.posts.moltbookUrl = moltbookUrl;
  s.agent.posts.moltXUrl = moltXUrl;

  if (s.share.id) {
    const store = readStore();
    const rec = store.shares.find((x) => x.id === s.share.id);
    if (rec) {
      if (isShareLocked(rec)) {
        return res.status(403).json({ ok: false, error: 'LOCKED' });
      }
      rec.agentPosts = { moltbookUrl, moltXUrl };
      const pub = store.publicTeams.find((p) => p.shareId === s.share.id);
      if (pub) {
        pub.agentPosts = { moltbookUrl, moltXUrl };
      }
      writeStore(store);
    }
  }
  res.json({ ok: true });
});

// Opt-in gating: only list team if BOTH opted in.
function maybeAddToWall(session) {
  if (!session.share.id) return { ok: false, error: 'SHARE_NOT_READY' };
  if (session.human.optIn !== true || session.agent.optIn !== true) return { ok: false, error: 'WAITING' };

  const store = readStore();

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
  const resolved = resolveHumanShare(req, s);
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

  const result = maybeAddToWall(s);
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

  const result = maybeAddToWall(s);
  res.json({ ok: true, result });
});

app.get('/api/wall', (_req, res) => {
  const store = readStore();
  const teams = store.publicTeams.map((p) => ({
    ...p,
    humanHandle: p.humanHandle || extractXHandle(p.xPostUrl)
  }));
  res.json({ ok: true, signups: store.signups.length, teams });
});

// --- Test-only reset endpoint ---
if (process.env.NODE_ENV === 'test') {
  app.post('/__test__/reset', (_req, res) => {
    writeStore({ signups: [], shares: [], publicTeams: [] });
    resetAllSessions();
    res.json({ ok: true });
  });
}

// --- Static + routes ---
const isProd = process.env.NODE_ENV === 'production';
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
app.get('/wall', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'wall.html')));
app.get('/share/:id', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'share_manage.html')));
app.get('/s/:id', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'share.html')));

// Default route
app.get('*', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

const port = Number(process.env.PORT || 4173);
app.listen(port, () => {
  console.log(`[agent-town] http://localhost:${port}`);
});
