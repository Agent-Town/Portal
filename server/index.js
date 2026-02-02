const path = require('path');
const express = require('express');

const { parseCookies, nowIso, isValidEmail } = require('./util');
const { readStore, writeStore } = require('./store');
const {
  createSession,
  getSessionById,
  getSessionByPairCode,
  listElements,
  evaluateMatch,
  resetAllSessions,
  CANVAS
} = require('./sessions');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function ensureHumanSession(req, res) {
  const cookies = parseCookies(req.header('cookie') || '');
  let sid = cookies.et_session;
  let session = sid ? getSessionById(sid) : null;
  if (!session) {
    session = createSession();
    sid = session.sessionId;
    // Cookie is the only "identity". No Moltbook auth required.
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

// --- API ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: nowIso() });
});

app.get('/api/session', (req, res) => {
  const s = ensureHumanSession(req, res);
  const store = readStore();
  res.json({
    ok: true,
    pairCode: s.pairCode,
    elements: listElements(),
    stats: {
      signups: store.signups.length,
      publicPairs: store.publicPairs.length
    }
  });
});

app.get('/api/state', (req, res) => {
  const s = ensureHumanSession(req, res);
  const store = readStore();
  res.json({
    ok: true,
    pairCode: s.pairCode,
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
      publicPairs: store.publicPairs.length
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
  const pairCode = typeof req.body?.pairCode === 'string' ? req.body.pairCode.trim() : '';
  const agentName = typeof req.body?.agentName === 'string' ? req.body.agentName.trim() : '';
  if (!pairCode) return res.status(400).json({ ok: false, error: 'MISSING_PAIR_CODE' });
  const s = getSessionByPairCode(pairCode);
  if (!s) return res.status(404).json({ ok: false, error: 'PAIR_NOT_FOUND' });
  s.agent.connected = true;
  s.agent.name = agentName || s.agent.name || 'OpenClaw';
  res.json({ ok: true });
});

app.get('/api/agent/state', (req, res) => {
  const pairCode = typeof req.query?.pairCode === 'string' ? req.query.pairCode.trim() : '';
  if (!pairCode) return res.status(400).json({ ok: false, error: 'MISSING_PAIR_CODE' });
  const s = getSessionByPairCode(pairCode);
  if (!s) return res.status(404).json({ ok: false, error: 'PAIR_NOT_FOUND' });
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
  const pairCode = typeof req.body?.pairCode === 'string' ? req.body.pairCode.trim() : '';
  const elementId = typeof req.body?.elementId === 'string' ? req.body.elementId.trim() : '';
  if (!pairCode) return res.status(400).json({ ok: false, error: 'MISSING_PAIR_CODE' });
  const s = getSessionByPairCode(pairCode);
  if (!s) return res.status(404).json({ ok: false, error: 'PAIR_NOT_FOUND' });
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
    pairCode: session.pairCode,
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
  const pairCode = typeof req.body?.pairCode === 'string' ? req.body.pairCode.trim() : '';
  if (!pairCode) return res.status(400).json({ ok: false, error: 'MISSING_PAIR_CODE' });
  const s = getSessionByPairCode(pairCode);
  if (!s) return res.status(404).json({ ok: false, error: 'PAIR_NOT_FOUND' });
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
  const pairCode = typeof req.body?.pairCode === 'string' ? req.body.pairCode.trim() : '';
  if (!pairCode) return res.status(400).json({ ok: false, error: 'MISSING_PAIR_CODE' });
  const s = getSessionByPairCode(pairCode);
  if (!s) return res.status(404).json({ ok: false, error: 'PAIR_NOT_FOUND' });
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
    xPostUrl: null,
    agentPosts: { moltbookUrl: null, moltXUrl: null },
    optIn: { human: null, agent: null },
    public: false
  };

  store.shares.push(record);
  writeStore(store);

  s.share.id = shareId;
  s.share.createdAt = record.createdAt;

  res.json({ ok: true, shareId, sharePath: `/s/${shareId}` });
});

app.get('/api/share/:id', (req, res) => {
  const id = req.params.id;
  const store = readStore();
  const rec = store.shares.find((x) => x.id === id);
  if (!rec) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  res.json({ ok: true, share: rec, palette: palette() });
});

app.get('/api/agent/share/instructions', (req, res) => {
  const pairCode = typeof req.query?.pairCode === 'string' ? req.query.pairCode.trim() : '';
  if (!pairCode) return res.status(400).json({ ok: false, error: 'MISSING_PAIR_CODE' });
  const s = getSessionByPairCode(pairCode);
  if (!s || !s.share.id) return res.status(404).json({ ok: false, error: 'SHARE_NOT_READY' });

  const sharePath = `/s/${s.share.id}`;
  // We don't know the public hostname; agent should use the same base URL as configured.
  const agentText = `We just unlocked Eliza Town vNext together (human + agent co-op).\n\nShare: {BASE_URL}${sharePath}`;
  const humanText = `I paired with my OpenClaw agent and unlocked Eliza Town vNext.\n\n{BASE_URL}${sharePath}`;

  res.json({ ok: true, shareId: s.share.id, sharePath, agentPostText: agentText, humanPostText: humanText });
});

// Posts
app.post('/api/human/posts', (req, res) => {
  const s = ensureHumanSession(req, res);
  if (!s.share.id) return res.status(403).json({ ok: false, error: 'SHARE_NOT_READY' });
  const url = sanitizeUrl(req.body?.xPostUrl);
  if (!url) return res.status(400).json({ ok: false, error: 'INVALID_URL' });
  s.human.xPostUrl = url;

  const store = readStore();
  const rec = store.shares.find((x) => x.id === s.share.id);
  if (rec) {
    rec.xPostUrl = url;
    writeStore(store);
  }
  res.json({ ok: true });
});

app.post('/api/agent/posts', (req, res) => {
  const pairCode = typeof req.body?.pairCode === 'string' ? req.body.pairCode.trim() : '';
  if (!pairCode) return res.status(400).json({ ok: false, error: 'MISSING_PAIR_CODE' });
  const s = getSessionByPairCode(pairCode);
  if (!s || !s.share.id) return res.status(404).json({ ok: false, error: 'SHARE_NOT_READY' });

  const moltbookUrl = sanitizeUrl(req.body?.moltbookUrl);
  const moltXUrl = sanitizeUrl(req.body?.moltXUrl);

  s.agent.posts.moltbookUrl = moltbookUrl;
  s.agent.posts.moltXUrl = moltXUrl;

  const store = readStore();
  const rec = store.shares.find((x) => x.id === s.share.id);
  if (rec) {
    rec.agentPosts = { moltbookUrl, moltXUrl };
    writeStore(store);
  }
  res.json({ ok: true });
});

// Opt-in gating: only list pair if BOTH opted in.
function maybeAddToWall(session) {
  if (!session.share.id) return { ok: false, error: 'SHARE_NOT_READY' };
  if (session.human.optIn !== true || session.agent.optIn !== true) return { ok: false, error: 'WAITING' };

  const store = readStore();

  const already = store.publicPairs.find((p) => p.shareId === session.share.id);
  if (already) return { ok: true, already: true };

  const share = store.shares.find((x) => x.id === session.share.id);
  if (!share) return { ok: false, error: 'SHARE_NOT_FOUND' };

  const record = {
    id: `p_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    shareId: session.share.id,
    sharePath: `/s/${session.share.id}`,
    matchedElement: session.match.elementId,
    agentName: session.agent.name,
    xPostUrl: share.xPostUrl,
    agentPosts: share.agentPosts
  };

  store.publicPairs.unshift(record);
  share.public = true;
  share.optIn = { human: true, agent: true };

  writeStore(store);
  return { ok: true, already: false };
}

app.post('/api/human/optin', (req, res) => {
  const s = ensureHumanSession(req, res);
  if (!s.share.id) return res.status(403).json({ ok: false, error: 'SHARE_NOT_READY' });
  const appear = typeof req.body?.appear === 'boolean' ? req.body.appear : null;
  if (appear === null) return res.status(400).json({ ok: false, error: 'MISSING_APPEAR' });
  s.human.optIn = appear;

  const store = readStore();
  const share = store.shares.find((x) => x.id === s.share.id);
  if (share) {
    share.optIn = { ...(share.optIn || {}), human: appear };
    writeStore(store);
  }

  const result = maybeAddToWall(s);
  res.json({ ok: true, result });
});

app.post('/api/agent/optin', (req, res) => {
  const pairCode = typeof req.body?.pairCode === 'string' ? req.body.pairCode.trim() : '';
  if (!pairCode) return res.status(400).json({ ok: false, error: 'MISSING_PAIR_CODE' });
  const appear = typeof req.body?.appear === 'boolean' ? req.body.appear : null;
  if (appear === null) return res.status(400).json({ ok: false, error: 'MISSING_APPEAR' });

  const s = getSessionByPairCode(pairCode);
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
  res.json({ ok: true, signups: store.signups.length, pairs: store.publicPairs });
});

// --- Test-only reset endpoint ---
if (process.env.NODE_ENV === 'test') {
  app.post('/__test__/reset', (_req, res) => {
    writeStore({ signups: [], shares: [], publicPairs: [] });
    resetAllSessions();
    res.json({ ok: true });
  });
}

// --- Static + routes ---
app.use(express.static(PUBLIC_DIR, { etag: true, maxAge: '1h' }));

app.get('/create', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'create.html')));
app.get('/wall', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'wall.html')));
app.get('/s/:id', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'share.html')));

// Default route
app.get('*', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

const port = Number(process.env.PORT || 4173);
app.listen(port, () => {
  console.log(`[moltbook-playbook-coop] http://localhost:${port}`);
});
