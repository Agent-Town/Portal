const { createTeamCode, nowIso, randomHex } = require('./util');

// In-memory sessions (MVP).
const sessionsById = new Map();
const sessionIdByTeamCode = new Map();
const sessionIdByHouseId = new Map();
const sessionIdByWalletAddress = new Map();
const SESSION_TTL_MS = Math.max(60_000, Number.parseInt(process.env.SESSION_TTL_MS || '', 10) || (24 * 60 * 60 * 1000));
const SESSION_MAX = Math.max(100, Number.parseInt(process.env.SESSION_MAX || '', 10) || 2000);
const SESSION_PRUNE_INTERVAL_MS = 60_000;
let nextSessionPruneAtMs = 0;

const ELEMENTS = [
  { id: 'key', label: 'Key', icon: '🔑' },
  { id: 'cookie', label: 'Cookie', icon: '🍪' },
  { id: 'booth', label: 'Booth', icon: '🎪' },
  { id: 'wolf', label: 'Wolf', icon: '🐺' },
  { id: 'map', label: 'Map', icon: '🗺️' },
  { id: 'spark', label: 'Spark', icon: '✨' }
];

const CANVAS = { w: 16, h: 16 };

function makeWalletSessionKey(chain, address) {
  const rawChain = typeof chain === 'string' ? chain.trim().toLowerCase() : '';
  const normalizedChain = rawChain === 'evm' || rawChain === 'solana' ? rawChain : '';
  const rawAddress = typeof address === 'string' ? address.trim() : '';
  if (!normalizedChain || !rawAddress) return null;
  const normalizedAddress = normalizedChain === 'evm' ? rawAddress.toLowerCase() : rawAddress;
  return `${normalizedChain}:${normalizedAddress}`;
}

function bindSessionWallet(session, chain, address, { allowRebind = false } = {}) {
  if (!session || typeof session !== 'object' || !session.sessionId) return;
  if (typeof address !== 'string' || !address.trim()) return;
  const key = makeWalletSessionKey(chain, address);
  if (!key) return;
  const [normalizedChain, normalizedAddress] = key.split(':');
  const existingSessionId = sessionIdByWalletAddress.get(key);
  if (existingSessionId && existingSessionId !== session.sessionId) {
    const existingSession = getSessionById(existingSessionId);
    if (!existingSession) {
      sessionIdByWalletAddress.delete(key);
    } else if (!allowRebind) {
      return false;
    }
  }
  sessionIdByWalletAddress.set(key, session.sessionId);
  session.walletBindings = Array.isArray(session.walletBindings) ? session.walletBindings : [];
  const existingBinding = session.walletBindings.find((entry) => (
    entry
    && entry.chain === normalizedChain
    && entry.address === normalizedAddress
  ));
  if (existingBinding) {
    existingBinding.boundAt = existingBinding.boundAt || nowIso();
  } else {
    session.walletBindings.push({
      chain: normalizedChain,
      address: normalizedAddress,
      boundAt: nowIso(),
    });
  }
  return true;
}

function removeSessionIndices(session) {
  if (!session || typeof session !== 'object') return;
  const sessionId = String(session.sessionId || '').trim();
  if (!sessionId) return;
  const teamCode = String(session.teamCode || '').trim();
  if (teamCode) sessionIdByTeamCode.delete(teamCode);
  const houseId = String(session?.houseCeremony?.houseId || '').trim();
  if (houseId && sessionIdByHouseId.get(houseId) === sessionId) {
    sessionIdByHouseId.delete(houseId);
  }
  for (const [walletKey, mappedSessionId] of sessionIdByWalletAddress.entries()) {
    if (mappedSessionId === sessionId) {
      sessionIdByWalletAddress.delete(walletKey);
    }
  }
}

function deleteSessionById(sessionId) {
  const existing = sessionsById.get(sessionId);
  if (!existing) return;
  sessionsById.delete(sessionId);
  removeSessionIndices(existing);
}

function touchSession(session) {
  if (!session || typeof session !== 'object') return;
  session.lastSeenAtMs = Date.now();
}

function sessionLastSeenMs(session) {
  const raw = Number(session?.lastSeenAtMs);
  if (Number.isFinite(raw) && raw > 0) return raw;
  const createdAtMs = Date.parse(String(session?.createdAt || ''));
  if (Number.isFinite(createdAtMs) && createdAtMs > 0) return createdAtMs;
  return 0;
}

function maybePruneSessions(now = Date.now()) {
  if (now < nextSessionPruneAtMs) return;
  nextSessionPruneAtMs = now + SESSION_PRUNE_INTERVAL_MS;

  const ttlCutoff = now - SESSION_TTL_MS;
  for (const [sessionId, session] of sessionsById.entries()) {
    const lastSeen = sessionLastSeenMs(session);
    if (!lastSeen || lastSeen < ttlCutoff) {
      deleteSessionById(sessionId);
    }
  }

  if (sessionsById.size <= SESSION_MAX) return;
  const ordered = Array.from(sessionsById.entries())
    .map(([sessionId, session]) => ({ sessionId, lastSeen: sessionLastSeenMs(session) }))
    .sort((a, b) => a.lastSeen - b.lastSeen);
  while (sessionsById.size > SESSION_MAX && ordered.length > 0) {
    const oldest = ordered.shift();
    if (!oldest?.sessionId) continue;
    deleteSessionById(oldest.sessionId);
  }
}

function getSessionByWallet(chain, address) {
  const key = makeWalletSessionKey(chain, address);
  if (!key) return null;
  const sessionId = sessionIdByWalletAddress.get(key);
  if (!sessionId) return null;
  const session = getSessionById(sessionId);
  if (!session) sessionIdByWalletAddress.delete(key);
  return session;
}

function emptyCanvas() {
  return Array(CANVAS.w * CANVAS.h).fill(0);
}

function defaultLiteState() {
  return {
    driver: 'vendor',
    runtimeBooted: false,
    runtimeReady: false,
    runtimeVersion: null,
    lastError: null,
    llmConfigured: false,
    llmProvider: null,
    llmModel: null,
    llmApiKeySet: false,
    llmAuthMode: null,
    llmConfiguredAt: null
  };
}

function createSession({ flow } = {}) {
  maybePruneSessions();
  const sessionId = randomHex(16);
  const teamCode = createTeamCode();
  const nowMs = Date.now();
  const session = {
    sessionId,
    teamCode,
    walletRecoveryKey: `wrk_${randomHex(32)}`,
    flow: flow === 'agent_solo' ? 'agent_solo' : 'human',
    createdAt: nowIso(),
    lastSeenAtMs: nowMs,
    agent: {
      connected: false,
      source: null,
      name: null,
      selected: null,
      openPressed: false,
      optIn: null,
      posts: {
        moltbookUrl: null
      }
    },
    human: {
      selected: null,
      openPressed: false,
      optIn: null,
      xPostUrl: null,
      xHandle: null
    },
    match: {
      matched: false,
      elementId: null,
      unlockedAt: null
    },
    signup: {
      complete: false,
      createdAt: null,
      mode: null,
      address: null
    },
    hatch: {
      complete: false,
      createdAt: null,
      agentKind: null
    },
    lite: defaultLiteState(),
    referral: {
      shareId: null
    },
    canvas: {
      w: CANVAS.w,
      h: CANVAS.h,
      pixels: emptyCanvas()
    },
    share: {
      id: null,
      createdAt: null
    },
    shareApproval: {
      human: false,
      agent: false
    },
    token: {
      verifiedAt: null,
      address: null
    },
    walletBindings: [],
    onboarding: {
      required: false,
      registrationComplete: false,
      step: 'townhall_profile',
      registeredAt: null,
      profile: {
        humanName: null,
        agentName: null,
        humanAvatar: {
          image: null,
          prompt: null,
          source: 'default',
          updatedAt: null
        },
        agentAvatar: {
          image: null,
          prompt: null,
          source: 'default',
          updatedAt: null
        }
      },
      erc8004: {
        evm: {
          id: null,
          chain: 'sepolia',
          txHash: null,
          updatedAt: null
        },
        solana: {
          id: null,
          cluster: 'devnet',
          txSig: null,
          updatedAt: null
        }
      }
    },
    reservedHouseId: null,
    houseCeremony: {
      humanCommit: null,
      agentCommit: null,
      humanRevealPub: null,
      agentRevealPub: null,
      humanRevealSealed: null,
      agentRevealSealed: null,
      liteAgentReveal: null,
      houseId: null,
      createdAt: null
    }
  };

  sessionsById.set(sessionId, session);
  sessionIdByTeamCode.set(teamCode, sessionId);
  return session;
}

function getSessionById(sessionId) {
  maybePruneSessions();
  if (!sessionId) return null;
  const session = sessionsById.get(sessionId) || null;
  if (!session) return null;
  const lastSeen = sessionLastSeenMs(session);
  if (lastSeen && lastSeen < Date.now() - SESSION_TTL_MS) {
    deleteSessionById(sessionId);
    return null;
  }
  touchSession(session);
  return session;
}

function getSessionByTeamCode(teamCode) {
  if (!teamCode || typeof teamCode !== 'string') return null;
  const code = teamCode.trim();
  const sessionId = sessionIdByTeamCode.get(code);
  if (!sessionId) return null;
  const session = getSessionById(sessionId);
  if (!session) sessionIdByTeamCode.delete(code);
  return session;
}

function indexHouseId(session, houseId) {
  if (!session || !houseId || typeof houseId !== 'string') return;
  sessionIdByHouseId.set(houseId, session.sessionId);
}

function getSessionByHouseId(houseId) {
  if (!houseId || typeof houseId !== 'string') return null;
  const id = houseId.trim();
  if (!id) return null;
  const sessionId = sessionIdByHouseId.get(id);
  if (!sessionId) return null;
  const session = getSessionById(sessionId);
  if (!session) sessionIdByHouseId.delete(id);
  return session;
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
    // Reset open gating if the match breaks.
    session.human.openPressed = false;
    session.agent.openPressed = false;
  }
}

function resetAllSessions() {
  sessionsById.clear();
  sessionIdByTeamCode.clear();
  sessionIdByHouseId.clear();
  sessionIdByWalletAddress.clear();
}

module.exports = {
  createSession,
  getSessionById,
  getSessionByTeamCode,
  getSessionByHouseId,
  bindSessionWallet,
  getSessionByWallet,
  indexHouseId,
  listElements,
  evaluateMatch,
  resetAllSessions,
  CANVAS,
  defaultLiteState
};
