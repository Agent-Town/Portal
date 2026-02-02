const { createPairCode, nowIso, randomHex } = require('./util');

// In-memory sessions (MVP).
const sessionsById = new Map();
const sessionIdByPairCode = new Map();

const ELEMENTS = [
  { id: 'key', label: 'Key' },
  { id: 'cookie', label: 'Cookie' },
  { id: 'booth', label: 'Booth' },
  { id: 'wolf', label: 'Wolf' },
  { id: 'map', label: 'Map' },
  { id: 'spark', label: 'Spark' }
];

const CANVAS = { w: 16, h: 16 };

function emptyCanvas() {
  return Array(CANVAS.w * CANVAS.h).fill(0);
}

function createSession() {
  const sessionId = randomHex(16);
  const pairCode = createPairCode();
  const session = {
    sessionId,
    pairCode,
    createdAt: nowIso(),
    agent: {
      connected: false,
      name: null,
      selected: null,
      betaPressed: false,
      optIn: null,
      posts: {
        moltbookUrl: null,
        moltXUrl: null
      }
    },
    human: {
      selected: null,
      betaPressed: false,
      optIn: null,
      email: null,
      xPostUrl: null
    },
    match: {
      matched: false,
      elementId: null,
      unlockedAt: null
    },
    signup: {
      complete: false,
      createdAt: null
    },
    canvas: {
      w: CANVAS.w,
      h: CANVAS.h,
      pixels: emptyCanvas()
    },
    share: {
      id: null,
      createdAt: null
    }
  };

  sessionsById.set(sessionId, session);
  sessionIdByPairCode.set(pairCode, sessionId);
  return session;
}

function getSessionById(sessionId) {
  if (!sessionId) return null;
  return sessionsById.get(sessionId) || null;
}

function getSessionByPairCode(pairCode) {
  if (!pairCode || typeof pairCode !== 'string') return null;
  const code = pairCode.trim();
  const sessionId = sessionIdByPairCode.get(code);
  if (!sessionId) return null;
  return getSessionById(sessionId);
}

function listElements() {
  return ELEMENTS;
}

function evaluateMatch(session) {
  const a = session.agent.selected;
  const h = session.human.selected;
  if (a && h && a === h) {
    session.match.matched = true;
    session.match.elementId = a;
    session.match.unlockedAt = session.match.unlockedAt || nowIso();
  } else {
    session.match.matched = false;
    session.match.elementId = null;
    session.match.unlockedAt = null;
    // Reset beta gating if the match breaks.
    session.human.betaPressed = false;
    session.agent.betaPressed = false;
  }
}

function resetAllSessions() {
  sessionsById.clear();
  sessionIdByPairCode.clear();
}

module.exports = {
  createSession,
  getSessionById,
  getSessionByPairCode,
  listElements,
  evaluateMatch,
  resetAllSessions,
  CANVAS
};
