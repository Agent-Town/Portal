const { nowIso, parseCookies, randomHex } = require("./util");

function createSessionManager() {
  const sessionsById = new Map();
  const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h
  const SESSION_MAX = 5_000;
  const SESSION_CLEANUP_INTERVAL_MS = 60 * 1000; // 1m
  let lastSessionCleanupMs = 0;

  function cleanupSessions() {
    const now = Date.now();
    if (now - lastSessionCleanupMs < SESSION_CLEANUP_INTERVAL_MS) return;
    lastSessionCleanupMs = now;

    // TTL eviction.
    for (const [sid, s] of sessionsById.entries()) {
      const createdAtMs = typeof s?.createdAtMs === "number" ? s.createdAtMs : null;
      if (typeof createdAtMs === "number" && now - createdAtMs > SESSION_TTL_MS) {
        sessionsById.delete(sid);
      }
    }

    // Hard cap eviction (oldest first) as a backstop.
    if (sessionsById.size <= SESSION_MAX) return;
    const ordered = Array.from(sessionsById.entries())
      .map(([sid, s]) => ({ sid, createdAtMs: typeof s?.createdAtMs === "number" ? s.createdAtMs : 0 }))
      .sort((a, b) => a.createdAtMs - b.createdAtMs);
    const toDrop = ordered.slice(0, Math.max(0, sessionsById.size - SESSION_MAX));
    for (const rec of toDrop) sessionsById.delete(rec.sid);
  }

  function ensureSession(req, res) {
    cleanupSessions();
    const cookies = parseCookies(req.header("cookie") || "");
    let sid = cookies.et_session;
    let session = sid ? sessionsById.get(sid) : null;
    if (!session) {
      sid = randomHex(16);
      session = {
        sessionId: sid,
        createdAt: nowIso(),
        createdAtMs: Date.now(),
        walletLookupNonce: null,
        houseInitNonce: null,
        houseId: null,
      };
      sessionsById.set(sid, session);

      // Cookie is the only "identity". No external auth required.
      const isProd = process.env.NODE_ENV === "production";
      const secureFlag = isProd || req.secure ? "; Secure" : "";
      res.setHeader(
        "Set-Cookie",
        `et_session=${encodeURIComponent(sid)}; Path=/; SameSite=Lax; HttpOnly${secureFlag}`,
      );
    }
    return session;
  }

  function resetAllSessions() {
    sessionsById.clear();
  }

  return {
    ensureSession,
    resetAllSessions,
  };
}

module.exports = { createSessionManager };
