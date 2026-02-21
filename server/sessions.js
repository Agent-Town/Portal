const { createTeamCode, nowIso, randomHex } = require('./util');

// In-memory sessions (MVP).
const sessionsById = new Map();
const sessionIdByTeamCode = new Map();
const sessionIdByHouseId = new Map();
const sessionIdByWalletAddress = new Map();

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
  return `${normalizedChain}:${rawAddress}`;
}

function bindSessionWallet(session, chain, address) {
  if (!session || typeof session !== 'object' || !session.sessionId) return;
  if (typeof address !== 'string' || !address.trim()) return;
  const key = makeWalletSessionKey(chain, address);
  if (!key) return;
  sessionIdByWalletAddress.set(key, session.sessionId);
}

function getSessionByWallet(chain, address) {
  const key = makeWalletSessionKey(chain, address);
  if (!key) return null;
  const sessionId = sessionIdByWalletAddress.get(key);
  if (!sessionId) return null;
  return getSessionById(sessionId);
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
  const sessionId = randomHex(16);
  const teamCode = createTeamCode();
  const session = {
    sessionId,
    teamCode,
    flow: flow === 'agent_solo' ? 'agent_solo' : 'human',
    createdAt: nowIso(),
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
  if (!sessionId) return null;
  return sessionsById.get(sessionId) || null;
}

function getSessionByTeamCode(teamCode) {
  if (!teamCode || typeof teamCode !== 'string') return null;
  const code = teamCode.trim();
  const sessionId = sessionIdByTeamCode.get(code);
  if (!sessionId) return null;
  return getSessionById(sessionId);
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
