(function initTrainerNamespacePlugin(globalScope) {
  const PLUGIN_VERSION = "trainer-namespace-plugin-v1";
  const STORAGE_KEY = "agentTown:feature:trainerNamespace";
  const DEFAULT_ENABLED = true;
  const DEFAULT_QUEST_ID = "portal_onboarding_v1";
  const DEFAULT_RUN_LIMIT = 20;
  const MAX_RUN_LIMIT = 200;
  const DEFAULT_POLICY = Object.freeze({
    maxTrainerCallsPerTurn: 6,
    maxTrainerCallsPerMinute: 20,
    minuteWindowMs: 60000,
    approvalTtlMs: 60000,
    approvalMaxUses: 1,
    recentBlockLimit: 24,
    recentAuditLimit: 80,
  });

  const TOOL_ROWS = Object.freeze([
    { name: "trainer.list_runs", tier: "A", description: "List captured trainer runs (newest-first)." },
    { name: "trainer.get_run", tier: "A", description: "Get one trainer run bundle by attemptId." },
    { name: "trainer.get_event", tier: "A", description: "Get one trainer event by attemptId+seq." },
    { name: "trainer.list_actions", tier: "A", description: "List extracted dynamic skill actions." },
    { name: "trainer.invoke_action", tier: "B", description: "Invoke one skill action via trainer bridge." },
    { name: "trainer.list_evidence", tier: "A", description: "List evidence rows produced by actions." },
    { name: "trainer.get_transcript_integrity", tier: "A", description: "Read transcript integrity diagnostics." },
    { name: "trainer.get_session_context", tier: "A", description: "Read runtime/session context snapshot." },
    { name: "trainer.explain_not_used", tier: "A", description: "Explain why an action was not used." },
    { name: "trainer.delete_trace", tier: "C", description: "Delete one run trace (approval required)." },
    { name: "trainer.clear_traces", tier: "C", description: "Clear all run traces (approval required)." },
  ]);

  const TOOL_ALIAS_MAP = Object.freeze({
    trainer_list_runs: "trainer.list_runs",
    trainer_get_run: "trainer.get_run",
    trainer_get_event: "trainer.get_event",
    trainer_list_actions: "trainer.list_actions",
    trainer_invoke_action: "trainer.invoke_action",
    trainer_list_evidence: "trainer.list_evidence",
    trainer_get_transcript_integrity: "trainer.get_transcript_integrity",
    trainer_get_session_context: "trainer.get_session_context",
    trainer_explain_not_used: "trainer.explain_not_used",
    trainer_delete_trace: "trainer.delete_trace",
    trainer_clear_traces: "trainer.clear_traces",
  });

  const INTERNAL_PARAM_KEYS = new Set(["__nowMs", "__turnKey", "__policy"]);
  const SECRET_KEY_RE = /(api[_-]?key|token|secret|password|credential|authorization|id_token|access_token|refresh_token)/i;
  const JWT_RE = /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

  const policyState = {
    minuteCalls: [],
    turnCalls: new Map(),
    recursionDepth: 0,
    approvals: new Map(),
    recentBlockCodes: [],
    recentAudit: [],
  };

  function parseBoolLike(value) {
    if (value === true || value === false) return value;
    const normalized = String(value == null ? "" : value).trim().toLowerCase();
    if (!normalized) return null;
    if (["1", "true", "yes", "on", "enable", "enabled"].includes(normalized)) return true;
    if (["0", "false", "no", "off", "disable", "disabled"].includes(normalized)) return false;
    return null;
  }

  function parseQueryOverride(locationSearch) {
    const raw = String(locationSearch || "").trim();
    if (!raw) return null;
    const params = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
    const keys = ["trainerNamespace", "trainer_namespace", "trainer-tools", "trainerTools"];
    for (const key of keys) {
      if (!params.has(key)) continue;
      const parsed = parseBoolLike(params.get(key));
      if (parsed !== null) return parsed;
    }
    return null;
  }

  function readStorageOverride() {
    try {
      if (!globalScope || !globalScope.localStorage) return null;
      const raw = globalScope.localStorage.getItem(STORAGE_KEY);
      return parseBoolLike(raw);
    } catch {
      return null;
    }
  }

  function resolveEnabled({
    runtimeFeatureFlag = null,
    locationSearch = null,
    storageOverride = null,
    fallback = DEFAULT_ENABLED,
  } = {}) {
    const runtimeEnabled = parseBoolLike(runtimeFeatureFlag);
    if (runtimeEnabled !== null) return runtimeEnabled;

    const explicitStorage = parseBoolLike(storageOverride);
    if (explicitStorage !== null) return explicitStorage;
    const storageFlag = readStorageOverride();
    if (storageFlag !== null) return storageFlag;

    const queryOverride = parseQueryOverride(
      locationSearch === null || locationSearch === undefined
        ? (typeof window !== "undefined" ? window.location.search : "")
        : locationSearch
    );
    if (queryOverride !== null) return queryOverride;

    let enabled = parseBoolLike(fallback);
    if (enabled === null) enabled = DEFAULT_ENABLED;
    return enabled;
  }

  function listTools({ includeAliases = false } = {}) {
    const rows = TOOL_ROWS.map((row) => ({
      name: row.name,
      canonical: row.name,
      tier: row.tier,
      description: row.description,
      alias: false,
    }));
    if (!includeAliases) return rows;
    for (const [alias, canonical] of Object.entries(TOOL_ALIAS_MAP)) {
      rows.push({
        name: alias,
        canonical,
        tier: "alias",
        description: `Alias for ${canonical}`,
        alias: true,
      });
    }
    return rows;
  }

  function normalizeToolName(name) {
    const raw = String(name || "").trim();
    if (!raw) return "";
    if (Object.prototype.hasOwnProperty.call(TOOL_ALIAS_MAP, raw)) {
      return TOOL_ALIAS_MAP[raw];
    }
    return raw;
  }

  function buildQuickRef(tools, query, limit = 8) {
    const rows = Array.isArray(tools) ? tools : [];
    if (!rows.length) return "";
    const normalizedQuery = String(query || "").trim().toLowerCase();
    const scored = rows.map((tool, index) => {
      const name = String(tool?.name || "").trim();
      const description = String(tool?.description || "").trim();
      let score = 0;
      if (normalizedQuery) {
        if (name.toLowerCase().includes(normalizedQuery)) score += 6;
        if (description.toLowerCase().includes(normalizedQuery)) score += 2;
        if (normalizedQuery.includes("trace") && name.includes("trace")) score += 3;
        if (normalizedQuery.includes("action") && name.includes("action")) score += 3;
      }
      if (!normalizedQuery) score = 1;
      return { tool, index, score };
    });
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    });
    const top = scored
      .slice(0, Math.max(1, Math.min(32, Number(limit) || 8)))
      .map((entry) => entry.tool)
      .filter(Boolean);
    const lines = ["Trainer namespace tools:"];
    for (const row of top) {
      lines.push(`- ${row.name}: ${row.description || ""}`.trim());
    }
    return lines.join("\n");
  }

  function toObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value;
  }

  function toEnvelopeData(envelope) {
    if (!envelope || envelope.ok !== true) return null;
    return envelope.data || null;
  }

  function toInt(value, fallback = 0) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.floor(num);
  }

  function toNumber(value, fallback = NaN) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return num;
  }

  function clampInt(value, minValue, maxValue, fallback) {
    const raw = toInt(value, fallback);
    return Math.max(minValue, Math.min(maxValue, raw));
  }

  function runEpochMs(run) {
    const row = run && typeof run === "object" ? run : {};
    const candidates = [
      row.createdAtMs,
      row.startedAtMs,
      row.updatedAtMs,
      row.timestampMs,
      row.stats && row.stats.startedAtMs,
      row.stats && row.stats.endedAtMs,
    ];
    for (const value of candidates) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
    }
    const isoCandidates = [row.createdAt, row.startedAt, row.updatedAt];
    for (const value of isoCandidates) {
      const parsed = Date.parse(String(value || ""));
      if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
    }
    return 0;
  }

  function redactStringSecret(raw) {
    const text = String(raw || "");
    if (!text) return "[redacted]";
    if (text.length <= 8) return "[redacted]";
    return `${text.slice(0, 4)}...${text.slice(-3)} [redacted]`;
  }

  function redactMaybeString(value) {
    const text = String(value || "").trim();
    if (!text) return text;
    if (/bearer\s+[A-Za-z0-9._~+/=-]{10,}/i.test(text)) {
      return text.replace(/bearer\s+([A-Za-z0-9._~+/=-]{10,})/gi, (_m, token) => `Bearer ${redactStringSecret(token)}`);
    }
    if (JWT_RE.test(text)) return redactStringSecret(text);
    if (/^sk-[A-Za-z0-9_-]{10,}$/i.test(text)) return redactStringSecret(text);
    return text;
  }

  function redactSecrets(value, depth = 0, seen = new WeakSet()) {
    if (value === null || value === undefined) return value;
    if (depth > 6) return "[max-depth]";
    const type = typeof value;
    if (type === "number" || type === "boolean") return value;
    if (type === "bigint") return String(value);
    if (type === "string") return redactMaybeString(value);
    if (type === "function" || type === "symbol" || type === "undefined") return String(value);

    if (Array.isArray(value)) {
      const out = [];
      const limit = Math.min(value.length, 100);
      for (let i = 0; i < limit; i += 1) {
        out.push(redactSecrets(value[i], depth + 1, seen));
      }
      if (value.length > limit) {
        out.push(`[${value.length - limit} more]`);
      }
      return out;
    }

    if (type === "object") {
      if (value instanceof Date) return value.toISOString();
      if (seen.has(value)) return "[circular]";
      seen.add(value);
      const out = {};
      const entries = Object.entries(value);
      const limit = Math.min(entries.length, 120);
      for (let i = 0; i < limit; i += 1) {
        const [rawKey, rawVal] = entries[i];
        const key = String(rawKey || "");
        if (!key) continue;
        if (SECRET_KEY_RE.test(key)) {
          out[key] = redactStringSecret(rawVal);
          continue;
        }
        out[key] = redactSecrets(rawVal, depth + 1, seen);
      }
      if (entries.length > limit) {
        out.__truncatedKeys = entries.length - limit;
      }
      return out;
    }

    return String(value);
  }

  function fail(tool, code, message, startedAtMs, extra = null) {
    return {
      ok: false,
      tool,
      durationMs: Math.max(0, Date.now() - Number(startedAtMs || Date.now())),
      code: String(code || "TRAINER_UNAVAILABLE"),
      message: String(message || "Trainer tool unavailable"),
      ...(extra && typeof extra === "object" ? redactSecrets(extra) : {}),
    };
  }

  function success(tool, startedAtMs, payload = null) {
    return {
      ok: true,
      tool,
      durationMs: Math.max(0, Date.now() - Number(startedAtMs || Date.now())),
      code: null,
      message: null,
      ...(payload && typeof payload === "object" ? redactSecrets(payload) : {}),
    };
  }

  function findSkillAction(skillActions, actionId) {
    const target = String(actionId || "").trim();
    if (!target) return null;
    const rows = Array.isArray(skillActions) ? skillActions : [];
    return rows.find((row) => String(row?.id || "").trim() === target) || null;
  }

  function normalizePolicy(rawPolicy = null) {
    const src = toObject(rawPolicy);
    return {
      maxTrainerCallsPerTurn: clampInt(src.maxTrainerCallsPerTurn, 1, 200, DEFAULT_POLICY.maxTrainerCallsPerTurn),
      maxTrainerCallsPerMinute: clampInt(src.maxTrainerCallsPerMinute, 1, 500, DEFAULT_POLICY.maxTrainerCallsPerMinute),
      minuteWindowMs: clampInt(src.minuteWindowMs, 10, 300000, DEFAULT_POLICY.minuteWindowMs),
      approvalTtlMs: clampInt(src.approvalTtlMs, 1000, 300000, DEFAULT_POLICY.approvalTtlMs),
      approvalMaxUses: clampInt(src.approvalMaxUses, 1, 10, DEFAULT_POLICY.approvalMaxUses),
      recentBlockLimit: clampInt(src.recentBlockLimit, 4, 100, DEFAULT_POLICY.recentBlockLimit),
      recentAuditLimit: clampInt(src.recentAuditLimit, 10, 200, DEFAULT_POLICY.recentAuditLimit),
    };
  }

  function parseInternalParams(params = {}) {
    const src = toObject(params);
    const out = {};
    for (const [key, value] of Object.entries(src)) {
      if (INTERNAL_PARAM_KEYS.has(key)) continue;
      out[key] = value;
    }
    const nowMs = toNumber(src.__nowMs, Date.now());
    const turnKeyRaw = String(src.__turnKey || "").trim();
    const turnKey = turnKeyRaw || null;
    const policyOverride = normalizePolicy(src.__policy);
    return {
      safeParams: out,
      internal: {
        nowMs: Number.isFinite(nowMs) ? nowMs : Date.now(),
        turnKey,
        policyOverride,
      },
    };
  }

  function prunePolicyState(nowMs, policy) {
    const now = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
    const minCutoff = now - Number(policy.minuteWindowMs || DEFAULT_POLICY.minuteWindowMs);
    policyState.minuteCalls = policyState.minuteCalls.filter((stamp) => Number(stamp || 0) >= minCutoff);

    const staleTurnCutoff = now - Math.max(Number(policy.minuteWindowMs || DEFAULT_POLICY.minuteWindowMs), 120000);
    for (const [key, row] of policyState.turnCalls.entries()) {
      const touchedAtMs = Number(row?.touchedAtMs || 0);
      if (touchedAtMs > 0 && touchedAtMs >= staleTurnCutoff) continue;
      policyState.turnCalls.delete(key);
    }

    for (const [token, row] of policyState.approvals.entries()) {
      const expiresAtMs = Number(row?.expiresAtMs || 0);
      const usesRemaining = Number(row?.usesRemaining || 0);
      if (expiresAtMs > now || usesRemaining > 0) continue;
      policyState.approvals.delete(token);
    }
  }

  function maskTokenId(rawToken) {
    return redactStringSecret(rawToken);
  }

  function pushRecentBlock(code, tool, message, atMs, policy) {
    const row = {
      code: String(code || "TRAINER_UNAVAILABLE"),
      tool: String(tool || "trainer.unknown"),
      message: String(message || ""),
      atMs: Number.isFinite(Number(atMs)) ? Number(atMs) : Date.now(),
    };
    policyState.recentBlockCodes.push(row);
    const max = Number(policy?.recentBlockLimit || DEFAULT_POLICY.recentBlockLimit);
    if (policyState.recentBlockCodes.length > max) {
      policyState.recentBlockCodes.splice(0, policyState.recentBlockCodes.length - max);
    }
  }

  function pushAuditRow(row, policy) {
    const normalized = redactSecrets(row && typeof row === "object" ? row : {});
    policyState.recentAudit.push(normalized);
    const max = Number(policy?.recentAuditLimit || DEFAULT_POLICY.recentAuditLimit);
    if (policyState.recentAudit.length > max) {
      policyState.recentAudit.splice(0, policyState.recentAudit.length - max);
    }
  }

  function buildBudgetSnapshot(policy, nowMs, turnKey) {
    prunePolicyState(nowMs, policy);
    const minuteUsed = policyState.minuteCalls.length;
    const minuteLimit = Number(policy.maxTrainerCallsPerMinute || DEFAULT_POLICY.maxTrainerCallsPerMinute);
    const minuteRemaining = Math.max(0, minuteLimit - minuteUsed);

    const normalizedTurnKey = String(turnKey || "").trim() || null;
    const turnCount = normalizedTurnKey && policyState.turnCalls.has(normalizedTurnKey)
      ? Number(policyState.turnCalls.get(normalizedTurnKey)?.count || 0)
      : 0;
    const turnLimit = Number(policy.maxTrainerCallsPerTurn || DEFAULT_POLICY.maxTrainerCallsPerTurn);
    const turnRemaining = normalizedTurnKey ? Math.max(0, turnLimit - turnCount) : null;

    return {
      perTurn: {
        limit: turnLimit,
        used: turnCount,
        remaining: turnRemaining,
        turnKey: normalizedTurnKey,
      },
      perMinute: {
        limit: minuteLimit,
        used: minuteUsed,
        remaining: minuteRemaining,
        windowMs: Number(policy.minuteWindowMs || DEFAULT_POLICY.minuteWindowMs),
      },
    };
  }

  function checkRateLimit({ nowMs, turnKey, policy }) {
    prunePolicyState(nowMs, policy);
    const minuteLimit = Number(policy.maxTrainerCallsPerMinute || DEFAULT_POLICY.maxTrainerCallsPerMinute);
    if (policyState.minuteCalls.length >= minuteLimit) {
      return {
        ok: false,
        code: "TRAINER_RATE_LIMITED",
        message: "trainer namespace minute budget exceeded",
      };
    }

    const normalizedTurnKey = String(turnKey || "").trim();
    if (normalizedTurnKey) {
      const row = policyState.turnCalls.get(normalizedTurnKey) || { count: 0, touchedAtMs: 0 };
      const turnLimit = Number(policy.maxTrainerCallsPerTurn || DEFAULT_POLICY.maxTrainerCallsPerTurn);
      if (Number(row.count || 0) >= turnLimit) {
        return {
          ok: false,
          code: "TRAINER_RATE_LIMITED",
          message: "trainer namespace per-turn budget exceeded",
        };
      }
    }

    return { ok: true };
  }

  function consumeRateBudget({ nowMs, turnKey }) {
    const normalizedNow = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
    policyState.minuteCalls.push(normalizedNow);
    const normalizedTurnKey = String(turnKey || "").trim();
    if (!normalizedTurnKey) return;
    const row = policyState.turnCalls.get(normalizedTurnKey) || { count: 0, touchedAtMs: 0 };
    row.count = Number(row.count || 0) + 1;
    row.touchedAtMs = normalizedNow;
    policyState.turnCalls.set(normalizedTurnKey, row);
  }

  function listPendingApprovals(nowMs) {
    const now = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
    const rows = [];
    for (const row of policyState.approvals.values()) {
      const expiresAtMs = Number(row?.expiresAtMs || 0);
      const usesRemaining = Number(row?.usesRemaining || 0);
      rows.push({
        tokenId: maskTokenId(row?.token || ""),
        scopes: Array.isArray(row?.scopes) ? row.scopes.slice() : [],
        expiresAtMs,
        usesRemaining,
        expired: expiresAtMs > 0 ? expiresAtMs <= now : true,
      });
    }
    rows.sort((a, b) => Number(a.expiresAtMs || 0) - Number(b.expiresAtMs || 0));
    return rows;
  }

  function buildDiagnostics({ policy, nowMs, turnKey }) {
    return {
      tierPolicy: {
        tierA: "allow",
        tierB: "allow-with-budget",
        tierC: "approval-required",
      },
      policy: {
        maxTrainerCallsPerTurn: Number(policy.maxTrainerCallsPerTurn || DEFAULT_POLICY.maxTrainerCallsPerTurn),
        maxTrainerCallsPerMinute: Number(policy.maxTrainerCallsPerMinute || DEFAULT_POLICY.maxTrainerCallsPerMinute),
        minuteWindowMs: Number(policy.minuteWindowMs || DEFAULT_POLICY.minuteWindowMs),
        approvalTtlMs: Number(policy.approvalTtlMs || DEFAULT_POLICY.approvalTtlMs),
      },
      budgetRemaining: buildBudgetSnapshot(policy, nowMs, turnKey),
      pendingApprovals: listPendingApprovals(nowMs),
      recentBlockCodes: policyState.recentBlockCodes.slice().reverse().map((row) => ({
        code: String(row?.code || ""),
        tool: String(row?.tool || ""),
        atMs: Number(row?.atMs || 0),
      })),
      recentBlocksDetailed: policyState.recentBlockCodes.slice().reverse(),
      recentAudit: policyState.recentAudit.slice().reverse(),
    };
  }

  function issueApprovalToken({
    scopes = ["trainer.delete_trace", "trainer.clear_traces"],
    ttlMs = DEFAULT_POLICY.approvalTtlMs,
    uses = DEFAULT_POLICY.approvalMaxUses,
    nowMs = Date.now(),
    token = "",
  } = {}) {
    const normalizedNow = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
    const normalizedScopes = Array.isArray(scopes)
      ? scopes.map((entry) => String(entry || "").trim()).filter(Boolean)
      : [];
    const tokenRaw = String(token || "").trim() || `appr_${Math.floor(normalizedNow)}_${Math.random().toString(36).slice(2, 10)}`;
    const expiresAtMs = normalizedNow + clampInt(ttlMs, 1000, 300000, DEFAULT_POLICY.approvalTtlMs);
    const usesRemaining = clampInt(uses, 1, 10, DEFAULT_POLICY.approvalMaxUses);
    policyState.approvals.set(tokenRaw, {
      token: tokenRaw,
      scopes: normalizedScopes,
      expiresAtMs,
      usesRemaining,
      createdAtMs: normalizedNow,
    });
    return {
      ok: true,
      token: tokenRaw,
      tokenId: maskTokenId(tokenRaw),
      scopes: normalizedScopes,
      expiresAtMs,
      usesRemaining,
    };
  }

  function consumeApprovalToken({ approvalToken, requiredScope, nowMs }) {
    const token = String(approvalToken || "").trim();
    if (!token) {
      return {
        ok: false,
        code: "TRAINER_APPROVAL_REQUIRED",
        message: "approvalToken required",
      };
    }
    const row = policyState.approvals.get(token);
    if (!row) {
      return {
        ok: false,
        code: "TRAINER_APPROVAL_REQUIRED",
        message: "approvalToken missing or consumed",
      };
    }
    const now = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
    const expiresAtMs = Number(row.expiresAtMs || 0);
    if (expiresAtMs > 0 && expiresAtMs <= now) {
      policyState.approvals.delete(token);
      return {
        ok: false,
        code: "TRAINER_APPROVAL_REQUIRED",
        message: "approvalToken expired",
      };
    }
    const scopes = Array.isArray(row.scopes) ? row.scopes : [];
    if (requiredScope && scopes.length && !scopes.includes(requiredScope)) {
      return {
        ok: false,
        code: "TRAINER_PERMISSION_DENIED",
        message: `approvalToken does not grant ${requiredScope}`,
      };
    }

    row.usesRemaining = Math.max(0, Number(row.usesRemaining || 0) - 1);
    if (row.usesRemaining <= 0) {
      policyState.approvals.delete(token);
    } else {
      policyState.approvals.set(token, row);
    }

    return {
      ok: true,
      tokenId: maskTokenId(token),
      expiresAtMs,
      usesRemaining: row.usesRemaining,
      scopes,
    };
  }

  function normalizeActionStats(actionStatsById, actionId) {
    const id = String(actionId || "").trim();
    if (!id) return { invocations: 0, successes: 0, failures: 0, lastStatus: null };
    const src = toObject(actionStatsById);
    const row = toObject(src[id]);
    return {
      invocations: Math.max(0, toInt(row.invocations, 0)),
      successes: Math.max(0, toInt(row.successes, 0)),
      failures: Math.max(0, toInt(row.failures, 0)),
      lastStatus: row.lastStatus ? String(row.lastStatus) : null,
    };
  }

  function listEvidenceRows(evidenceRows, params, nowMs) {
    const rows = Array.isArray(evidenceRows) ? evidenceRows : [];
    const now = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
    const actionId = String(params?.actionId || "").trim();
    const freshOnly = params?.freshOnly === true;
    const out = [];
    for (const row of rows) {
      const key = String(row?.evidenceKey || "").trim();
      if (!key) continue;
      if (actionId && String(row?.actionId || "").trim() !== actionId) continue;
      const atMs = Number(row?.atMs || 0);
      const ttlMs = Number(row?.ttlMs || 0);
      const expiresAtMs = atMs > 0 && ttlMs > 0 ? atMs + ttlMs : 0;
      const expired = expiresAtMs > 0 ? expiresAtMs <= now : false;
      if (freshOnly && expired) continue;
      out.push({
        evidenceKey: key,
        actionId: String(row?.actionId || "").trim() || null,
        ok: row?.ok === true,
        atMs: Number.isFinite(atMs) ? atMs : 0,
        ttlMs: Number.isFinite(ttlMs) ? ttlMs : 0,
        expiresAtMs,
        expired,
        summary: row?.summary && typeof row.summary === "object" ? row.summary : null,
      });
    }
    out.sort((a, b) => Number(b.atMs || 0) - Number(a.atMs || 0));
    return out;
  }

  function explainNotUsedPayload({ actionId, usageDiagnostics, skillActions, evidenceRows, nowMs }) {
    const diagnostics = usageDiagnostics && typeof usageDiagnostics === "object" ? usageDiagnostics : {};
    const actionRows = Array.isArray(skillActions) ? skillActions : [];
    const targetActionId = String(actionId || "").trim();
    const actionExists = targetActionId
      ? actionRows.some((row) => String(row?.id || "").trim() === targetActionId)
      : false;
    const byAction = Array.isArray(diagnostics.byAction) ? diagnostics.byAction : [];
    const usageRow = byAction.find((row) => String(row?.actionId || "").trim() === targetActionId) || null;
    const attempted = Number(usageRow?.invocations || 0) > 0;
    const matchedCalls = Number(usageRow?.invocations || 0);
    const missingResults = Number(diagnostics?.missingResults || 0);
    const reasonCodes = Array.isArray(diagnostics?.reasonCodes) ? diagnostics.reasonCodes : [];
    const notUsedActions = Array.isArray(diagnostics?.notUsedActions) ? diagnostics.notUsedActions : [];
    const notUsed = targetActionId ? notUsedActions.includes(targetActionId) : null;
    const evidence = listEvidenceRows(evidenceRows, { actionId: targetActionId, freshOnly: false }, nowMs);
    const freshEvidence = evidence.filter((row) => row.expired !== true);

    return {
      actionId: targetActionId || null,
      actionExists,
      attempted,
      matchedCalls,
      missingResults,
      notUsed,
      reasonCodes,
      evidenceCount: evidence.length,
      freshEvidenceCount: freshEvidence.length,
      evidence: evidence.slice(0, 10),
      diagnostics,
    };
  }

  async function invokeTool({
    toolName,
    params = {},
    gatewayApi = null,
    questId = DEFAULT_QUEST_ID,
    skillActions = [],
    actionStatsById = null,
    runtimeSessionContext = null,
    usageDiagnostics = null,
    transcriptIntegrity = null,
    evidenceRows = [],
    invokeSkillAction = null,
    deleteTrace = null,
    clearTraces = null,
  } = {}) {
    const startedAtMs = Date.now();
    const canonical = normalizeToolName(toolName);
    const fallbackPolicy = normalizePolicy();
    if (!canonical) {
      const failure = fail("trainer.unknown", "TRAINER_PARAM_INVALID", "Missing tool name", startedAtMs);
      pushRecentBlock(failure.code, failure.tool, failure.message, Date.now(), fallbackPolicy);
      return failure;
    }

    const parsedParams = parseInternalParams(params);
    const safeParams = parsedParams.safeParams;
    const internal = parsedParams.internal;
    const nowMs = Number.isFinite(Number(internal.nowMs)) ? Number(internal.nowMs) : Date.now();
    const policy = normalizePolicy(internal.policyOverride);

    if (policyState.recursionDepth > 0) {
      const failure = fail(canonical, "TRAINER_RECURSION_BLOCKED", "Nested trainer dispatch blocked", startedAtMs, {
        trainerNamespace: buildDiagnostics({ policy, nowMs, turnKey: internal.turnKey }),
      });
      pushRecentBlock(failure.code, canonical, failure.message, nowMs, policy);
      pushAuditRow({
        atMs: nowMs,
        tool: canonical,
        ok: false,
        code: failure.code,
        message: failure.message,
        params: safeParams,
      }, policy);
      return failure;
    }

    const rateCheck = checkRateLimit({ nowMs, turnKey: internal.turnKey, policy });
    if (!rateCheck.ok) {
      const failure = fail(canonical, rateCheck.code, rateCheck.message, startedAtMs, {
        trainerNamespace: buildDiagnostics({ policy, nowMs, turnKey: internal.turnKey }),
      });
      pushRecentBlock(failure.code, canonical, failure.message, nowMs, policy);
      pushAuditRow({
        atMs: nowMs,
        tool: canonical,
        ok: false,
        code: failure.code,
        message: failure.message,
        params: safeParams,
      }, policy);
      return failure;
    }
    consumeRateBudget({ nowMs, turnKey: internal.turnKey });

    let result = null;
    policyState.recursionDepth += 1;
    try {
      const normalizedQuestId = String(safeParams.questId || questId || DEFAULT_QUEST_ID).trim() || DEFAULT_QUEST_ID;

      switch (canonical) {
        case "trainer.list_runs": {
          if (!gatewayApi || typeof gatewayApi.trainerListAttempts !== "function") {
            result = fail(canonical, "TRAINER_UNAVAILABLE", "trainerListAttempts unavailable", startedAtMs);
            break;
          }
          const limitRaw = toInt(safeParams.limit, DEFAULT_RUN_LIMIT);
          const limit = Math.max(1, Math.min(MAX_RUN_LIMIT, limitRaw || DEFAULT_RUN_LIMIT));
          const envelope = await gatewayApi.trainerListAttempts({ questId: normalizedQuestId }).catch(() => null);
          const data = toEnvelopeData(envelope) || {};
          const attempts = Array.isArray(data?.attempts) ? data.attempts : [];
          const orderedAttempts = attempts
            .slice()
            .sort((a, b) => runEpochMs(b) - runEpochMs(a));
          result = success(canonical, startedAtMs, {
            runs: orderedAttempts.slice(0, limit),
            totalRuns: orderedAttempts.length,
          });
          break;
        }
        case "trainer.get_run": {
          if (!gatewayApi || typeof gatewayApi.trainerGetAttempt !== "function") {
            result = fail(canonical, "TRAINER_UNAVAILABLE", "trainerGetAttempt unavailable", startedAtMs);
            break;
          }
          const attemptId = String(safeParams.attemptId || "").trim();
          if (!attemptId) {
            result = fail(canonical, "TRAINER_PARAM_INVALID", "attemptId is required", startedAtMs);
            break;
          }
          const envelope = await gatewayApi.trainerGetAttempt({
            questId: normalizedQuestId,
            attemptId,
          }).catch(() => null);
          const run = toEnvelopeData(envelope);
          if (!run) {
            result = fail(canonical, "TRAINER_NOT_FOUND", `Run not found: ${attemptId}`, startedAtMs, { attemptId });
            break;
          }
          result = success(canonical, startedAtMs, { attemptId, run });
          break;
        }
        case "trainer.get_event": {
          if (!gatewayApi || typeof gatewayApi.trainerGetAttempt !== "function") {
            result = fail(canonical, "TRAINER_UNAVAILABLE", "trainerGetAttempt unavailable", startedAtMs);
            break;
          }
          const attemptId = String(safeParams.attemptId || "").trim();
          const seq = toInt(safeParams.seq, NaN);
          if (!attemptId || !Number.isFinite(seq) || seq <= 0) {
            result = fail(canonical, "TRAINER_PARAM_INVALID", "attemptId and seq are required", startedAtMs);
            break;
          }
          const envelope = await gatewayApi.trainerGetAttempt({
            questId: normalizedQuestId,
            attemptId,
          }).catch(() => null);
          const run = toEnvelopeData(envelope) || {};
          const events = Array.isArray(run?.events) ? run.events : [];
          const event = events.find((row) => toInt(row?.seq, 0) === seq) || null;
          if (!event) {
            result = fail(canonical, "TRAINER_NOT_FOUND", `Event not found: ${attemptId}#${seq}`, startedAtMs, {
              attemptId,
              seq,
            });
            break;
          }
          result = success(canonical, startedAtMs, {
            attemptId,
            seq,
            event,
          });
          break;
        }
        case "trainer.list_actions": {
          const actions = Array.isArray(skillActions) ? skillActions : [];
          const out = actions.map((row) => {
            const id = String(row?.id || "").trim();
            const stats = normalizeActionStats(actionStatsById, id);
            return {
              id,
              source: String(row?.source || "inferred"),
              confidence: Number(row?.confidence || 0),
              request: {
                method: String(row?.request?.method || "GET"),
                urlTemplate: String(row?.request?.urlTemplate || ""),
              },
              params: Array.isArray(row?.params) ? row.params.map((param) => String(param?.name || "").trim()).filter(Boolean) : [],
              runStats: stats,
            };
          }).filter((row) => row.id);
          result = success(canonical, startedAtMs, { actions: out });
          break;
        }
        case "trainer.invoke_action": {
          if (typeof invokeSkillAction !== "function") {
            result = fail(canonical, "TRAINER_UNAVAILABLE", "Skill action bridge unavailable", startedAtMs);
            break;
          }
          const actionId = String(safeParams.actionId || "").trim();
          const actionParams = toObject(safeParams.params);
          if (!actionId) {
            result = fail(canonical, "TRAINER_PARAM_INVALID", "actionId is required", startedAtMs);
            break;
          }
          const action = findSkillAction(skillActions, actionId);
          if (!action) {
            result = fail(canonical, "TRAINER_NOT_FOUND", `Unknown actionId: ${actionId}`, startedAtMs, { actionId });
            break;
          }
          const invokeResult = await invokeSkillAction(actionId, actionParams).catch((err) => ({
            ok: false,
            code: "TRAINER_UNAVAILABLE",
            message: String(err?.message || "INVOKE_ACTION_FAILED"),
          }));
          result = {
            ok: invokeResult?.ok === true,
            tool: canonical,
            durationMs: Math.max(0, Date.now() - startedAtMs),
            code: invokeResult?.ok === true ? null : String(invokeResult?.code || "TRAINER_UNAVAILABLE"),
            message: invokeResult?.ok === true ? null : String(invokeResult?.message || "Action invocation failed"),
            actionId,
            request: redactSecrets(invokeResult?.request || null),
            response: redactSecrets(invokeResult?.response || null),
            validation: redactSecrets(invokeResult?.validation || null),
            evidence: Array.isArray(invokeResult?.evidence) ? redactSecrets(invokeResult.evidence) : [],
          };
          break;
        }
        case "trainer.list_evidence": {
          const rows = listEvidenceRows(evidenceRows, safeParams, nowMs);
          result = success(canonical, startedAtMs, {
            evidence: rows,
            count: rows.length,
          });
          break;
        }
        case "trainer.get_transcript_integrity": {
          result = success(canonical, startedAtMs, {
            transcriptIntegrity: transcriptIntegrity && typeof transcriptIntegrity === "object"
              ? transcriptIntegrity
              : null,
          });
          break;
        }
        case "trainer.get_session_context": {
          const reasonCodes = Array.isArray(usageDiagnostics?.reasonCodes) ? usageDiagnostics.reasonCodes : [];
          const actionCount = Array.isArray(skillActions) ? skillActions.length : 0;
          result = success(canonical, startedAtMs, {
            sessionContext: runtimeSessionContext && typeof runtimeSessionContext === "object"
              ? runtimeSessionContext
              : null,
            runtimeContext: runtimeSessionContext?.runtimeContext && typeof runtimeSessionContext.runtimeContext === "object"
              ? runtimeSessionContext.runtimeContext
              : null,
            actionCatalogSize: actionCount,
            recentReasonCodes: reasonCodes,
            trainerNamespace: buildDiagnostics({ policy, nowMs, turnKey: internal.turnKey }),
          });
          break;
        }
        case "trainer.explain_not_used": {
          const actionId = String(safeParams.actionId || "").trim();
          result = success(canonical, startedAtMs, explainNotUsedPayload({
            actionId,
            usageDiagnostics,
            skillActions,
            evidenceRows,
            nowMs,
          }));
          break;
        }
        case "trainer.delete_trace": {
          const approval = consumeApprovalToken({
            approvalToken: safeParams.approvalToken,
            requiredScope: "trainer.delete_trace",
            nowMs,
          });
          if (!approval.ok) {
            result = fail(canonical, approval.code, approval.message, startedAtMs, {
              trainerNamespace: buildDiagnostics({ policy, nowMs, turnKey: internal.turnKey }),
            });
            break;
          }
          const attemptId = String(safeParams.attemptId || "").trim();
          if (!attemptId) {
            result = fail(canonical, "TRAINER_PARAM_INVALID", "attemptId is required", startedAtMs);
            break;
          }
          if (typeof deleteTrace !== "function") {
            result = fail(canonical, "TRAINER_UNAVAILABLE", "deleteTrace bridge unavailable", startedAtMs);
            break;
          }
          const bridgeResult = await deleteTrace({ attemptId }).catch((err) => ({
            ok: false,
            code: "TRAINER_UNAVAILABLE",
            message: String(err?.message || "DELETE_TRACE_FAILED"),
          }));
          if (bridgeResult?.ok === false) {
            result = fail(canonical, String(bridgeResult.code || "TRAINER_UNAVAILABLE"), String(bridgeResult.message || "Delete trace failed"), startedAtMs, {
              attemptId,
              approvalTokenId: approval.tokenId,
            });
            break;
          }
          result = success(canonical, startedAtMs, {
            attemptId,
            approvalTokenId: approval.tokenId,
            ...toObject(bridgeResult),
          });
          break;
        }
        case "trainer.clear_traces": {
          const approval = consumeApprovalToken({
            approvalToken: safeParams.approvalToken,
            requiredScope: "trainer.clear_traces",
            nowMs,
          });
          if (!approval.ok) {
            result = fail(canonical, approval.code, approval.message, startedAtMs, {
              trainerNamespace: buildDiagnostics({ policy, nowMs, turnKey: internal.turnKey }),
            });
            break;
          }
          if (typeof clearTraces !== "function") {
            result = fail(canonical, "TRAINER_UNAVAILABLE", "clearTraces bridge unavailable", startedAtMs);
            break;
          }
          const bridgeResult = await clearTraces().catch((err) => ({
            ok: false,
            code: "TRAINER_UNAVAILABLE",
            message: String(err?.message || "CLEAR_TRACES_FAILED"),
          }));
          if (bridgeResult?.ok === false) {
            result = fail(canonical, String(bridgeResult.code || "TRAINER_UNAVAILABLE"), String(bridgeResult.message || "Clear traces failed"), startedAtMs, {
              approvalTokenId: approval.tokenId,
            });
            break;
          }
          result = success(canonical, startedAtMs, {
            approvalTokenId: approval.tokenId,
            ...toObject(bridgeResult),
          });
          break;
        }
        default:
          result = fail(canonical, "TRAINER_NOT_FOUND", `Unknown trainer tool: ${canonical}`, startedAtMs);
          break;
      }
    } finally {
      policyState.recursionDepth = Math.max(0, policyState.recursionDepth - 1);
    }

    const completedAtMs = Date.now();
    if (result?.ok !== true) {
      pushRecentBlock(String(result?.code || "TRAINER_UNAVAILABLE"), canonical, String(result?.message || ""), nowMs, policy);
    }
    pushAuditRow({
      atMs: nowMs,
      completedAtMs,
      tool: canonical,
      ok: result?.ok === true,
      code: result?.code || null,
      message: result?.message || null,
      durationMs: Math.max(0, completedAtMs - startedAtMs),
      params: safeParams,
      response: result,
    }, policy);

    return result;
  }

  function getDiagnostics(options = {}) {
    const src = toObject(options);
    const nowMs = Number.isFinite(Number(src.nowMs)) ? Number(src.nowMs) : Date.now();
    const turnKey = String(src.turnKey || "").trim() || null;
    const policy = normalizePolicy(src.policy);
    return buildDiagnostics({ policy, nowMs, turnKey });
  }

  function revokeApprovalToken(token) {
    const key = String(token || "").trim();
    if (!key) return false;
    return policyState.approvals.delete(key);
  }

  function resetState() {
    policyState.minuteCalls = [];
    policyState.turnCalls.clear();
    policyState.recursionDepth = 0;
    policyState.approvals.clear();
    policyState.recentBlockCodes = [];
    policyState.recentAudit = [];
  }

  const api = {
    version: PLUGIN_VERSION,
    resolveEnabled,
    listTools,
    normalizeToolName,
    buildQuickRef,
    invokeTool,
    getDiagnostics,
    issueApprovalToken,
    revokeApprovalToken,
    resetState,
  };

  globalScope.AgentTownTrainerNamespacePlugin = api;
})(window);
