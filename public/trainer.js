(() => {
  const QUEST_ID = "portal_onboarding_v1";
  const RUN_PROMPT = "trainer probe: lite echo";
  const BACKUP_FILENAME = "agent-town-personal-backup.json";
  const TRAINER_ROOT = `lite/experience-trainer/v1/quests/${QUEST_ID}`;
  const TRAINER_ATTEMPTS_ROOT = `${TRAINER_ROOT}/attempts`;
  const SYNTHETIC_TRANSCRIPT_REPAIR_TEXT = "[openclaw] missing tool result in session history; inserted synthetic error result for transcript repair.";
  const SKILL_ACTION_TOOL_PREFIX = "skill_action.";
  const TRAINER_NAMESPACE_TOOL_PREFIX = "trainer.";
  const TOOL_METHOD_MAP = Object.freeze({
    web_fetch: "webFetch",
    skill_fetch: "skillFetch",
    http_request: "httpRequest",
    agent_town_ceremony_commit: "agentTownCeremonyCommit",
    agent_town_ceremony_reveal: "agentTownCeremonyReveal",
    secret_set: "setSecret",
    secret_list: "listSecrets",
    secret_delete: "deleteSecret",
    ws_open: "wsOpen",
    ws_send: "wsSend",
    ws_recv: "wsRecv",
    ws_receive: "wsRecv",
    ws_close: "wsClose",
    ws_status: "wsStatus",
    workspace_mkdir: "workspaceMkdir",
    workspace_list: "workspaceList",
    workspace_read_file: "workspaceReadFile",
    workspace_write_file: "workspaceWriteFile",
    workspace_edit_file: "workspaceEditFile",
    workspace_delete: "workspaceDelete",
    wallet_connect: "walletConnectTool",
    wallet_get_accounts: "walletGetAccountsTool",
    wallet_sign_message: "walletSignMessageTool",
  });
  const TOOL_PARAM_SAMPLES = Object.freeze({
    http_request: {
      method: "POST",
      url: "http://localhost:4173/api/agent/canvas/paint",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        teamCode: "TEAM-ABCD-EFGH",
        x: 0,
        y: 0,
        color: 2,
      }),
    },
    web_fetch: {
      url: "http://localhost:4173/skill.md",
      maxBytes: 262144,
    },
    skill_fetch: {
      url: "http://localhost:4173/skill.md",
      maxBytes: 262144,
    },
    workspace_list: {
      path: "workspace/",
    },
    workspace_read_file: {
      path: "workspace/skill.md",
    },
    workspace_write_file: {
      path: "workspace/NOTES.md",
      content: "hello",
    },
    workspace_edit_file: {
      path: "workspace/skill.md",
      find: "Canvas Paint",
      replace: "Canvas Paint",
    },
    ws_open: {
      url: "wss://echo.websocket.events",
      timeoutMs: 5000,
    },
    ws_send: {
      sessionId: "ws_123",
      text: "hello",
    },
    ws_recv: {
      sessionId: "ws_123",
      waitMs: 1000,
    },
    ws_close: {
      sessionId: "ws_123",
    },
    secret_set: {
      name: "API_TOKEN",
      value: "token-value",
    },
    secret_delete: {
      name: "API_TOKEN",
    },
    wallet_connect: {
      chain: "solana",
    },
    wallet_get_accounts: {
      chain: "solana",
    },
    wallet_sign_message: {
      chain: "solana",
      message: "sign me",
    },
    agent_town_ceremony_commit: {
      teamCode: "TEAM-ABCD-EFGH",
      payload: {},
    },
    agent_town_ceremony_reveal: {
      teamCode: "TEAM-ABCD-EFGH",
      payload: {},
    },
    "trainer.list_runs": {
      limit: 20,
    },
    "trainer.get_run": {
      attemptId: "attempt_0001",
    },
    "trainer.get_event": {
      attemptId: "attempt_0001",
      seq: 1,
    },
    "trainer.invoke_action": {
      webSessionId: "we_1234567890",
      actionId: "save_draft",
      idempotencyKey: "act-web-001",
      expectedRevision: 1,
      params: {
        draft: "Keep this local",
      },
    },
    "trainer.list_evidence": {
      webSessionId: "we_1234567890",
      freshOnly: true,
    },
    "trainer.get_transcript_integrity": {},
    "trainer.get_session_context": {
      webSessionId: "we_1234567890",
    },
    "trainer.explain_not_used": {
      actionId: "canvas.image",
    },
    "trainer.delete_trace": {
      attemptId: "attempt_0001",
      approvalToken: "appr_...",
    },
    "trainer.clear_traces": {
      approvalToken: "appr_...",
    },
  });

  const state = {
    attempts: [],
    selectedAttemptId: null,
    selectedEventSeq: null,
    attemptBundles: new Map(),
    receiptCache: new Map(),
    compare: null,
    loadouts: [],
    activeLoadoutId: null,
    advanced: false,
    backupCache: null,
    activeTab: "trace",
    toolNames: [],
    skillCatalog: [],
    skillActions: [],
    skillActionCompile: null,
    skillActionUsage: null,
    trainerNamespaceEnabled: false,
    trainerNamespaceTools: [],
    trainerNamespaceDiagnostics: null,
    runtimeSessionContext: null,
    actionEvidenceByKey: new Map(),
    actionStatsById: new Map(),
    transcriptIntegrity: null,
    toolDraftByName: new Map(),
    selectedToolName: "",
    toolLastResult: null,
  };

  let gatewayPromise = null;

  function el(id) {
    return document.getElementById(id);
  }

  function setStatus(text, isError = false) {
    const node = el("trainerStatusLine");
    if (!node) return;
    node.textContent = String(text || "");
    node.style.color = isError ? "var(--bad)" : "var(--muted)";
  }

  function formatMs(value) {
    const ms = Number(value);
    if (!Number.isFinite(ms) || ms < 0) return "0ms";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function decodeB64Utf8(value) {
    try {
      const bin = atob(String(value || ""));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch {
      return "";
    }
  }

  function safeJsonParse(raw, fallback = null) {
    try {
      return JSON.parse(String(raw || ""));
    } catch {
      return fallback;
    }
  }

  function decodePromptXml(text) {
    return String(text || "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }

  function parseAvailableSkills(skillsPrompt) {
    const prompt = String(skillsPrompt || "");
    if (!prompt) return [];
    const out = [];
    const skillRegex = /<skill>\s*<name>([\s\S]*?)<\/name>\s*<description>([\s\S]*?)<\/description>\s*<location>([\s\S]*?)<\/location>\s*<\/skill>/gi;
    let match = null;
    while ((match = skillRegex.exec(prompt)) !== null) {
      const name = decodePromptXml(match[1]).trim();
      const description = decodePromptXml(match[2]).trim();
      const location = decodePromptXml(match[3]).trim();
      out.push({ name, description, location });
    }
    return out;
  }

  function skillActionsPlugin() {
    return window.AgentTownSkillActionsPlugin || null;
  }

  function trainerNamespacePlugin() {
    return window.AgentTownTrainerNamespacePlugin || null;
  }

  function normalizeTrainerNamespaceToolName(toolName) {
    const plugin = trainerNamespacePlugin();
    if (plugin && typeof plugin.normalizeToolName === "function") {
      return String(plugin.normalizeToolName(toolName) || "").trim();
    }
    return String(toolName || "").trim();
  }

  function isTrainerNamespaceToolName(toolName) {
    const canonical = normalizeTrainerNamespaceToolName(toolName);
    return canonical.startsWith(TRAINER_NAMESPACE_TOOL_PREFIX);
  }

  function trainerNamespaceToolsMap() {
    const map = new Map();
    for (const row of Array.isArray(state.trainerNamespaceTools) ? state.trainerNamespaceTools : []) {
      const name = String(row?.name || "").trim();
      if (!name) continue;
      map.set(name, row);
    }
    return map;
  }

  function findTrainerNamespaceTool(toolName) {
    const map = trainerNamespaceToolsMap();
    const canonical = normalizeTrainerNamespaceToolName(toolName);
    if (!canonical) return null;
    return map.get(canonical) || null;
  }

  function listTrackedEvidenceRows() {
    const out = [];
    for (const row of state.actionEvidenceByKey.values()) {
      if (!row || typeof row !== "object") continue;
      out.push({
        evidenceKey: String(row.evidenceKey || "").trim(),
        actionId: String(row.actionId || "").trim() || null,
        ok: row.ok === true,
        atMs: Number.isFinite(Number(row.atMs)) ? Number(row.atMs) : 0,
        ttlMs: Number.isFinite(Number(row.ttlMs)) ? Number(row.ttlMs) : 0,
        summary: row.summary && typeof row.summary === "object" ? row.summary : null,
      });
    }
    out.sort((a, b) => Number(b.atMs || 0) - Number(a.atMs || 0));
    return out;
  }

  function listActionStatsRows() {
    const out = {};
    for (const [actionId, row] of state.actionStatsById.entries()) {
      const id = String(actionId || "").trim();
      if (!id) continue;
      out[id] = {
        actionId: id,
        invocations: Number.isFinite(Number(row?.invocations)) ? Number(row.invocations) : 0,
        successes: Number.isFinite(Number(row?.successes)) ? Number(row.successes) : 0,
        failures: Number.isFinite(Number(row?.failures)) ? Number(row.failures) : 0,
        lastStatus: row?.lastStatus ? String(row.lastStatus) : null,
      };
    }
    return out;
  }

  function isSkillActionToolName(toolName) {
    return String(toolName || "").startsWith(SKILL_ACTION_TOOL_PREFIX);
  }

  function actionIdFromToolName(toolName) {
    const raw = String(toolName || "").trim();
    if (!isSkillActionToolName(raw)) return "";
    return raw.slice(SKILL_ACTION_TOOL_PREFIX.length).trim();
  }

  function findSkillActionByToolName(toolName) {
    const actionId = actionIdFromToolName(toolName);
    if (!actionId) return null;
    return state.skillActions.find((action) => String(action?.id || "") === actionId) || null;
  }

  function buildSkillActionDraft(action) {
    const out = {};
    const params = Array.isArray(action?.params) ? action.params : [];
    for (const row of params) {
      const name = String(row?.name || "").trim();
      if (!name) continue;
      if (row?.default !== undefined && row?.default !== null) {
        out[name] = row.default;
      }
    }
    return JSON.stringify(out, null, 2);
  }

  function trackActionEvidence(evidenceRows = []) {
    const now = Date.now();
    for (const row of Array.isArray(evidenceRows) ? evidenceRows : []) {
      const key = String(row?.evidenceKey || "").trim();
      if (!key) continue;
      state.actionEvidenceByKey.set(key, {
        evidenceKey: key,
        actionId: String(row?.actionId || "").trim() || null,
        ok: row?.ok === true,
        atMs: Number.isFinite(Number(row?.atMs)) ? Number(row.atMs) : now,
        ttlMs: Number.isFinite(Number(row?.ttlMs)) ? Number(row.ttlMs) : 0,
        summary: row?.summary && typeof row.summary === "object" ? row.summary : null,
      });
    }
  }

  function trackActionRun(actionId, runOk, code = "") {
    const id = String(actionId || "").trim();
    if (!id) return;
    const current = state.actionStatsById.get(id) || {
      actionId: id,
      invocations: 0,
      successes: 0,
      failures: 0,
      lastStatus: null,
    };
    current.invocations += 1;
    if (runOk) {
      current.successes += 1;
      current.lastStatus = "ok";
    } else {
      current.failures += 1;
      current.lastStatus = String(code || "UNSUPPORTED");
    }
    state.actionStatsById.set(id, current);
  }

  function defaultToolDraft(toolName) {
    const key = String(toolName || "").trim();
    if (isSkillActionToolName(key)) {
      const action = findSkillActionByToolName(key);
      if (action) return buildSkillActionDraft(action);
    }
    if (isTrainerNamespaceToolName(key)) {
      const canonical = normalizeTrainerNamespaceToolName(key);
      const sample = TOOL_PARAM_SAMPLES[canonical];
      return JSON.stringify(sample || {}, null, 2);
    }
    const sample = TOOL_PARAM_SAMPLES[key];
    return JSON.stringify(sample || {}, null, 2);
  }

  function getToolDraft(toolName) {
    const key = String(toolName || "").trim();
    if (!key) return "{}";
    if (!state.toolDraftByName.has(key)) {
      state.toolDraftByName.set(key, defaultToolDraft(key));
    }
    return state.toolDraftByName.get(key) || "{}";
  }

  async function openOpenClawDb() {
    return await new Promise((resolve, reject) => {
      const req = indexedDB.open("openclaw-lite", 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("checkpoints")) {
          const store = db.createObjectStore("checkpoints", { keyPath: "checkpointId" });
          store.createIndex("by_house_createdAtMs", ["houseId", "createdAtMs"], { unique: false });
        }
        if (!db.objectStoreNames.contains("vfs")) db.createObjectStore("vfs", { keyPath: "path" });
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("IDB_OPEN_FAILED"));
    });
  }

  function idbReqToPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error("IDB_REQUEST_FAILED"));
    });
  }

  function idbTxDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("IDB_TX_FAILED"));
      tx.onabort = () => reject(tx.error || new Error("IDB_TX_ABORTED"));
    });
  }

  async function readVfsText(path) {
    const db = await openOpenClawDb();
    try {
      const tx = db.transaction(["vfs"], "readonly");
      const req = tx.objectStore("vfs").get(String(path || ""));
      const rec = await idbReqToPromise(req);
      await idbTxDone(tx);
      if (!rec || typeof rec.dataB64 !== "string") return null;
      return decodeB64Utf8(rec.dataB64);
    } finally {
      db.close();
    }
  }

  async function listVfsPaths(prefix = "") {
    const db = await openOpenClawDb();
    try {
      const tx = db.transaction(["vfs"], "readonly");
      const rows = await idbReqToPromise(tx.objectStore("vfs").getAll());
      await idbTxDone(tx);
      const normalizedPrefix = String(prefix || "");
      return (Array.isArray(rows) ? rows : [])
        .map((row) => (row && typeof row.path === "string" ? row.path : ""))
        .filter((path) => !!path && (!normalizedPrefix || path.startsWith(normalizedPrefix)));
    } finally {
      db.close();
    }
  }

  async function deleteVfsPaths(paths = []) {
    const keys = (Array.isArray(paths) ? paths : [])
      .map((path) => String(path || ""))
      .filter(Boolean);
    if (!keys.length) return 0;
    const db = await openOpenClawDb();
    try {
      const tx = db.transaction(["vfs"], "readwrite");
      const store = tx.objectStore("vfs");
      for (const key of keys) {
        store.delete(key);
      }
      await idbTxDone(tx);
      return keys.length;
    } finally {
      db.close();
    }
  }

  async function deleteVfsByPrefix(prefix) {
    const paths = await listVfsPaths(prefix);
    if (!paths.length) return 0;
    return await deleteVfsPaths(paths);
  }

  async function gateway() {
    if (!gatewayPromise) {
      gatewayPromise = (async () => {
        const mod = await import("/openclaw-lite/gateway.js");
        let resolved = mod.default || mod;
        if (resolved && typeof resolved.then === "function") {
          resolved = await resolved;
        }
        return resolved || null;
      })();
    }
    return await gatewayPromise;
  }

  function unwrapEnvelope(envelope) {
    if (!envelope || envelope.ok !== true) return null;
    return envelope.data || null;
  }

  async function listAttempts() {
    const g = await gateway();
    if (!g || typeof g.trainerListAttempts !== "function") return [];
    const result = await g.trainerListAttempts({ questId: QUEST_ID });
    const data = unwrapEnvelope(result);
    return Array.isArray(data?.attempts) ? data.attempts : [];
  }

  async function getAttemptBundle(attemptId) {
    const key = String(attemptId || "").trim();
    if (!key) return null;
    if (state.attemptBundles.has(key)) return state.attemptBundles.get(key);
    const g = await gateway();
    if (!g || typeof g.trainerGetAttempt !== "function") return null;
    const result = await g.trainerGetAttempt({ questId: QUEST_ID, attemptId: key });
    const data = unwrapEnvelope(result);
    if (!data) return null;
    state.attemptBundles.set(key, data);
    return data;
  }

  async function refreshCompare() {
    const g = await gateway();
    if (!g || typeof g.trainerCompare !== "function") {
      state.compare = null;
      return;
    }
    const result = await g.trainerCompare({ questId: QUEST_ID, limit: Math.max(3, state.attempts.length) });
    state.compare = unwrapEnvelope(result);
  }

  async function refreshLoadouts() {
    const g = await gateway();
    if (!g || typeof g.trainerListLoadouts !== "function") {
      state.loadouts = [];
      state.activeLoadoutId = null;
      return;
    }
    const result = await g.trainerListLoadouts({ questId: QUEST_ID });
    const data = unwrapEnvelope(result) || {};
    state.activeLoadoutId = typeof data.activeLoadoutId === "string" ? data.activeLoadoutId : null;
    state.loadouts = Array.isArray(data.loadouts) ? data.loadouts : [];
  }

  async function refreshAttempts() {
    state.attempts = await listAttempts();
    if (!state.selectedAttemptId && state.attempts.length > 0) {
      state.selectedAttemptId = state.attempts[0].attemptId || null;
      state.selectedEventSeq = null;
    }
    if (state.selectedAttemptId && !state.attempts.some((attempt) => attempt.attemptId === state.selectedAttemptId)) {
      state.selectedAttemptId = state.attempts[0]?.attemptId || null;
      state.selectedEventSeq = null;
    }
    await refreshCompare();
    await refreshLoadouts();
  }

  async function refreshBackupCache() {
    const g = await gateway();
    if (!g || typeof g.trainerBackupExport !== "function") {
      state.backupCache = null;
      return null;
    }
    const data = unwrapEnvelope(await g.trainerBackupExport());
    state.backupCache = data?.backup || null;
    return state.backupCache;
  }

  function selectedAttempt() {
    return state.attempts.find((attempt) => attempt.attemptId === state.selectedAttemptId) || null;
  }

  async function selectedBundle() {
    const attempt = selectedAttempt();
    if (!attempt?.attemptId) return null;
    return await getAttemptBundle(attempt.attemptId);
  }

  function setTrainerTab(tab) {
    const next = String(tab || "").trim() === "tools" ? "tools" : "trace";
    state.activeTab = next;
    const tabButtons = Array.from(document.querySelectorAll("[data-trainer-tab]"));
    for (const btn of tabButtons) {
      const isActive = String(btn?.dataset?.trainerTab || "") === next;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    }
    const panels = Array.from(document.querySelectorAll("[data-trainer-panel]"));
    for (const panel of panels) {
      const isActive = String(panel?.dataset?.trainerPanel || "") === next;
      panel.classList.toggle("is-hidden", !isActive);
    }
  }

  function captureToolDraftFromInput() {
    const toolName = String(state.selectedToolName || "").trim();
    const input = el("trainerToolParamsInput");
    if (!toolName || !input) return;
    state.toolDraftByName.set(toolName, String(input.value || "{}"));
  }

  function normalizeToolInvocationResult(raw) {
    if (raw && typeof raw === "object") return raw;
    return { value: raw };
  }

  function cloneForToolResult(value, fallback = null) {
    try {
      return JSON.parse(JSON.stringify(value == null ? fallback : value));
    } catch {
      return fallback;
    }
  }

  function isToolCallable(gatewayApi, toolName) {
    if (!gatewayApi || !toolName) return false;
    if (isTrainerNamespaceToolName(toolName)) {
      return !!findTrainerNamespaceTool(toolName);
    }
    if (isSkillActionToolName(toolName)) {
      return typeof gatewayApi.httpRequest === "function" && !!findSkillActionByToolName(toolName);
    }
    if (typeof gatewayApi.runToolByName === "function") return true;
    const method = TOOL_METHOD_MAP[String(toolName || "").trim()];
    return !!(method && typeof gatewayApi[method] === "function");
  }

  async function invokeToolByName(gatewayApi, toolName, params) {
    const key = String(toolName || "").trim();
    if (!key) throw new Error("MISSING_TOOL_NAME");
    if (gatewayApi && typeof gatewayApi.runToolByName === "function") {
      return await gatewayApi.runToolByName({ name: key, params });
    }
    const method = TOOL_METHOD_MAP[key];
    if (!method || typeof gatewayApi?.[method] !== "function") {
      throw new Error(`TOOL_INVOKE_UNAVAILABLE:${key}`);
    }
    if (method === "listSecrets") {
      return await gatewayApi[method]();
    }
    return await gatewayApi[method](isPlainObject(params) ? params : {});
  }

  async function invokeSkillActionByName(gatewayApi, toolName, params) {
    const plugin = skillActionsPlugin();
    if (!plugin || typeof plugin.invokeSkillAction !== "function") {
      throw new Error("SKILL_ACTION_PLUGIN_UNAVAILABLE");
    }
    const action = findSkillActionByToolName(toolName);
    if (!action) {
      throw new Error("SKILL_ACTION_NOT_FOUND");
    }
    if (typeof gatewayApi?.httpRequest !== "function") {
      throw new Error("HTTP_REQUEST_UNAVAILABLE");
    }
    const runtimeContext = state.runtimeSessionContext?.runtimeContext || { origin: window.location.origin };
    return await plugin.invokeSkillAction({
      action,
      runtimeContext,
      params: isPlainObject(params) ? params : {},
      httpRequest: async (request) => {
        const body = request?.body;
        const payload = {
          method: String(request?.method || "GET"),
          url: String(request?.url || ""),
          headers: request?.headers && typeof request.headers === "object" ? request.headers : {},
          timeoutMs: Number.isFinite(Number(request?.timeoutMs)) ? Number(request.timeoutMs) : 30000,
        };
        if (body !== null && body !== undefined) {
          payload.body = body;
        }
        return await gatewayApi.httpRequest(payload);
      },
    });
  }

  async function invokeTrainerNamespaceByName(gatewayApi, toolName, params) {
    const plugin = trainerNamespacePlugin();
    if (!plugin || typeof plugin.invokeTool !== "function") {
      throw new Error("TRAINER_NAMESPACE_PLUGIN_UNAVAILABLE");
    }
    const toolDef = findTrainerNamespaceTool(toolName);
    if (!toolDef) {
      throw new Error("TRAINER_NAMESPACE_TOOL_NOT_FOUND");
    }
    return await plugin.invokeTool({
      toolName: normalizeTrainerNamespaceToolName(toolName),
      params: isPlainObject(params) ? params : {},
      gatewayApi,
      questId: QUEST_ID,
      skillActions: state.skillActions,
      actionStatsById: listActionStatsRows(),
      runtimeSessionContext: state.runtimeSessionContext,
      usageDiagnostics: state.skillActionUsage,
      transcriptIntegrity: state.transcriptIntegrity,
      evidenceRows: listTrackedEvidenceRows(),
      invokeSkillAction: async (actionId, actionParams) => {
        const targetTool = skillActionToolName(actionId);
        return await invokeSkillActionByName(gatewayApi, targetTool, actionParams);
      },
      deleteTrace: async ({ attemptId }) => {
        return await deleteAttemptTrace(attemptId, { silent: true });
      },
      clearTraces: async () => {
        return await clearAllAttemptTraces({ silent: true });
      },
    });
  }

  function skillActionToolName(actionId) {
    return `${SKILL_ACTION_TOOL_PREFIX}${String(actionId || "").trim()}`;
  }

  async function loadActiveSkillContent(gatewayApi, debugApi) {
    let skillState = null;
    if (gatewayApi && typeof gatewayApi.skillState === "function") {
      const envelope = await gatewayApi.skillState().catch(() => null);
      skillState = unwrapEnvelope(envelope) || envelope || null;
    }
    const activeSkillPath = String(skillState?.activeSkillPath || "").trim();
    if (!activeSkillPath || !debugApi || typeof debugApi.workspaceReadFile !== "function") {
      return { skillState, activeSkillPath, skillText: "" };
    }
    const readResult = await debugApi.workspaceReadFile({ path: activeSkillPath }).catch(() => null);
    const readData = unwrapEnvelope(readResult) || readResult || null;
    const skillText = typeof readData?.content === "string" ? readData.content : "";
    return { skillState, activeSkillPath, skillText };
  }

  async function refreshToolLab() {
    const g = await gateway();
    const debugApi = window.__openclawLiteTest || null;
    const plugin = skillActionsPlugin();
    let toolNames = [];
    if (debugApi && typeof debugApi.getToolRegistryInfo === "function") {
      const info = await debugApi.getToolRegistryInfo().catch(() => null);
      toolNames = Array.isArray(info?.names) ? info.names.map((name) => String(name || "").trim()).filter(Boolean) : [];
    }
    const { skillState, activeSkillPath, skillText } = await loadActiveSkillContent(g, debugApi);
    let compiled = { ok: true, source: "none", actions: [], errors: [] };
    if (plugin && typeof plugin.compileSkillActions === "function" && skillText) {
      compiled = plugin.compileSkillActions(skillText, { source: "trainer-plugin" }) || compiled;
    }
    state.skillActionCompile = {
      source: String(compiled?.source || "none"),
      parserVersion: String(compiled?.parserVersion || ""),
      activeSkillPath: activeSkillPath || null,
      skillStatus: String(skillState?.status || ""),
      errors: Array.isArray(compiled?.errors) ? compiled.errors : [],
    };
    state.skillActions = Array.isArray(compiled?.actions) ? compiled.actions : [];
    const dynamicToolNames = state.skillActions.map((action) => skillActionToolName(action?.id)).filter(Boolean);
    const preview = g && typeof g.systemPromptPreview === "function"
      ? await g.systemPromptPreview().catch(() => null)
      : null;
    const promptPreview = unwrapEnvelope(preview) || preview || null;
    state.skillCatalog = parseAvailableSkills(promptPreview?.skillsPrompt || "");
    let runtimeSessionContext = null;
    if (g && typeof g.runtimeSessionContext === "function") {
      const runtimeEnvelope = await g.runtimeSessionContext({
        runtimeContext: { origin: window.location.origin },
      }).catch(() => null);
      runtimeSessionContext = unwrapEnvelope(runtimeEnvelope) || runtimeEnvelope || null;
    }
    state.runtimeSessionContext = runtimeSessionContext;
    const trainerPlugin = trainerNamespacePlugin();
    let trainerNamespaceEnabled = false;
    let trainerNamespaceTools = [];
    let trainerNamespaceDiagnostics = null;
    if (trainerPlugin && typeof trainerPlugin.resolveEnabled === "function" && typeof trainerPlugin.listTools === "function") {
      const runtimeFeatureFlag = runtimeSessionContext?.runtimeState?.featureFlags?.trainerNamespace;
      trainerNamespaceEnabled = trainerPlugin.resolveEnabled({
        runtimeFeatureFlag,
        locationSearch: window.location.search,
      }) === true;
      trainerNamespaceTools = trainerNamespaceEnabled
        ? trainerPlugin.listTools({ includeAliases: false })
        : [];
      if (trainerNamespaceEnabled && typeof trainerPlugin.getDiagnostics === "function") {
        trainerNamespaceDiagnostics = trainerPlugin.getDiagnostics({
          turnKey: runtimeSessionContext?.lastLlmInput?.turnId || null,
        });
      }
    }
    state.trainerNamespaceEnabled = trainerNamespaceEnabled;
    state.trainerNamespaceTools = Array.isArray(trainerNamespaceTools) ? trainerNamespaceTools : [];
    state.trainerNamespaceDiagnostics = trainerNamespaceDiagnostics;
    const trainerNamespaceToolNames = state.trainerNamespaceTools
      .map((row) => String(row?.name || "").trim())
      .filter((name) => name && name.startsWith(TRAINER_NAMESPACE_TOOL_PREFIX));
    state.toolNames = Array.from(new Set(toolNames.concat(dynamicToolNames, trainerNamespaceToolNames)));
    if (!state.selectedToolName || !state.toolNames.includes(state.selectedToolName)) {
      state.selectedToolName = state.toolNames[0] || "";
    }
    if (plugin && typeof plugin.summarizeTranscriptUsage === "function" && debugApi && typeof debugApi.getTranscriptDump === "function") {
      const rawDump = await debugApi.getTranscriptDump().catch(() => "[]");
      const transcript = parseTranscriptDump(rawDump);
      state.skillActionUsage = plugin.summarizeTranscriptUsage(
        transcript,
        state.skillActions,
        runtimeSessionContext?.runtimeContext || { origin: window.location.origin },
      );
    } else {
      state.skillActionUsage = null;
    }
  }

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function parseTranscriptDump(rawDump) {
    if (typeof rawDump !== "string" || !rawDump.trim()) return [];
    const parsed = safeJsonParse(rawDump, null);
    if (Array.isArray(parsed)) return parsed;
    const lines = rawDump.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const out = [];
    for (const line of lines) {
      const row = safeJsonParse(line, null);
      if (row) out.push(row);
    }
    return out;
  }

  function readTranscriptTextBlocks(message) {
    const content = message?.content;
    if (typeof content === "string") return [content];
    if (!Array.isArray(content)) return [];
    const out = [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      if (typeof part.text === "string" && part.text.trim()) out.push(part.text);
    }
    return out;
  }

  async function refreshTranscriptIntegrity() {
    const debugApi = window.__openclawLiteTest || null;
    if (!debugApi) {
      state.transcriptIntegrity = null;
      return;
    }
    let stats = null;
    if (typeof debugApi.getTranscriptToolStats === "function") {
      stats = await debugApi.getTranscriptToolStats().catch(() => null);
    }
    let transcript = [];
    if (typeof debugApi.getTranscriptDump === "function") {
      const raw = await debugApi.getTranscriptDump().catch(() => "[]");
      transcript = parseTranscriptDump(raw);
    }
    const synthetic = [];
    for (const msg of transcript) {
      if (!msg || msg.role !== "toolResult") continue;
      const blocks = readTranscriptTextBlocks(msg);
      if (!blocks.some((text) => String(text || "").includes(SYNTHETIC_TRANSCRIPT_REPAIR_TEXT))) continue;
      synthetic.push({
        toolCallId: String(msg.toolCallId || msg.toolUseId || ""),
        toolName: String(msg.toolName || "unknown"),
      });
    }
    state.transcriptIntegrity = {
      refreshedAt: new Date().toISOString(),
      stats: isPlainObject(stats) ? stats : null,
      syntheticCount: synthetic.length,
      syntheticRecent: synthetic.slice(Math.max(0, synthetic.length - 10)),
      transcriptItems: transcript.length,
    };
  }

  function purgeAttemptReceiptCache(attemptId) {
    const key = String(attemptId || "").trim();
    if (!key) return;
    const prefix = `${TRAINER_ATTEMPTS_ROOT}/${key}/`;
    for (const path of state.receiptCache.keys()) {
      if (String(path || "").startsWith(prefix)) {
        state.receiptCache.delete(path);
      }
    }
  }

  async function deleteAttemptTrace(attemptId, options = {}) {
    const key = String(attemptId || "").trim();
    const silent = options?.silent === true;
    if (!key) {
      return {
        ok: false,
        code: "TRAINER_PARAM_INVALID",
        message: "attemptId is required",
      };
    }
    const prefix = `${TRAINER_ATTEMPTS_ROOT}/${key}/`;
    const deletedFiles = await deleteVfsByPrefix(prefix);
    state.attemptBundles.delete(key);
    purgeAttemptReceiptCache(key);
    if (state.selectedAttemptId === key) {
      state.selectedAttemptId = null;
      state.selectedEventSeq = null;
    }
    await refreshAttempts();
    await refreshBackupCache().catch(() => {});
    await refreshBuilderDiagnostics();
    await render();
    if (!silent) {
      if (deletedFiles > 0) {
        setStatus(`Deleted local trace cache for ${key}.`);
      } else {
        setStatus(`No local trace cache found for ${key}.`);
      }
    }
    return {
      ok: true,
      attemptId: key,
      deletedFiles,
      deleted: deletedFiles > 0,
    };
  }

  async function clearAllAttemptTraces(options = {}) {
    const silent = options?.silent === true;
    const attemptCount = state.attempts.length;
    if (!attemptCount) {
      if (!silent) setStatus("No local cache attempts to clear.");
      return {
        ok: true,
        clearedAttempts: 0,
        deletedFiles: 0,
      };
    }
    const deletedFiles = await deleteVfsByPrefix(`${TRAINER_ATTEMPTS_ROOT}/`);
    state.selectedAttemptId = null;
    state.selectedEventSeq = null;
    state.attemptBundles.clear();
    state.receiptCache.clear();
    await refreshAttempts();
    await refreshBackupCache().catch(() => {});
    await refreshBuilderDiagnostics();
    await render();
    if (!silent) setStatus(`Cleared ${attemptCount} local cache attempt(s).`);
    return {
      ok: true,
      clearedAttempts: attemptCount,
      deletedFiles,
    };
  }

  function renderAttempts() {
    const root = el("trainerAttempts");
    if (!root) return;
    root.innerHTML = "";
    if (!state.attempts.length) {
      root.textContent = "No attempts yet.";
      return;
    }
    for (const attempt of state.attempts) {
      const row = document.createElement("div");
      row.className = "trainerAttemptRow";
      const btn = document.createElement("button");
      btn.className = "btn small trainerAttemptSelect";
      btn.type = "button";
      const result = String(attempt?.result || "unknown");
      const duration = formatMs(attempt?.stats?.durationMs || 0);
      const failures = Number(attempt?.stats?.toolFailures || 0);
      btn.textContent = `${attempt.attemptId} • ${result} • ${duration} • fail:${failures}`;
      if (attempt.attemptId === state.selectedAttemptId) {
        btn.style.borderColor = "var(--accent)";
      }
      btn.addEventListener("click", () => {
        state.selectedAttemptId = attempt.attemptId || null;
        state.selectedEventSeq = null;
        render().catch(() => {});
      });
      row.appendChild(btn);

      const remove = document.createElement("span");
      remove.className = "trainerAttemptDelete";
      remove.textContent = "[x]";
      remove.title = `Delete local trace cache ${attempt.attemptId || ""}`;
      remove.setAttribute("data-testid", "trainer-attempt-delete");
      remove.tabIndex = 0;
      const onDelete = (event) => {
        event.preventDefault();
        event.stopPropagation();
        deleteAttemptTrace(attempt.attemptId).catch((err) => {
          setStatus(`Delete failed: ${err?.message || "UNKNOWN"}`, true);
        });
      };
      remove.addEventListener("click", onDelete);
      remove.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        onDelete(event);
      });
      row.appendChild(remove);

      root.appendChild(row);
    }
  }

  async function renderTimeline() {
    const root = el("trainerTimeline");
    if (!root) return;
    root.innerHTML = "";
    const bundle = await selectedBundle();
    const events = Array.isArray(bundle?.events) ? bundle.events : [];
    if (!events.length) {
      root.textContent = "No events.";
      return;
    }
    for (const event of events) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "btn small";
      row.style.display = "block";
      row.style.width = "100%";
      row.style.textAlign = "left";
      row.style.marginBottom = "6px";
      const seq = Number(event?.seq || 0);
      const type = String(event?.type || "");
      const actor = String(event?.actor || "");
      row.textContent = `${seq}. ${type} (${actor})`;
      if (seq === state.selectedEventSeq) {
        row.style.borderColor = "var(--accent)";
      }
      row.addEventListener("click", () => {
        state.selectedEventSeq = seq;
        renderInspector().catch(() => {});
      });
      root.appendChild(row);
    }
  }

  function findEvent(events, seq) {
    return (Array.isArray(events) ? events : []).find((event) => Number(event?.seq || 0) === Number(seq || 0)) || null;
  }

  async function loadContextReceipt(path) {
    const key = String(path || "").trim();
    if (!key) return null;
    if (state.receiptCache.has(key)) return state.receiptCache.get(key);
    const text = await readVfsText(key);
    if (!text) return null;
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    if (parsed) state.receiptCache.set(key, parsed);
    return parsed;
  }

  async function resolvePreviousReceipt(bundle, selectedEvent) {
    const events = Array.isArray(bundle?.events) ? bundle.events : [];
    const currentSeq = Number(selectedEvent?.seq || 0);
    const sameAttemptPrev = [...events]
      .filter((event) => event?.type === "llm.turn.start" && Number(event?.seq || 0) < currentSeq)
      .sort((a, b) => Number(b.seq || 0) - Number(a.seq || 0))[0];
    if (sameAttemptPrev?.data?.contextReceiptPath) {
      return await loadContextReceipt(sameAttemptPrev.data.contextReceiptPath);
    }

    for (let i = 0; i < state.attempts.length; i += 1) {
      const attempt = state.attempts[i];
      if (attempt.attemptId === state.selectedAttemptId) continue;
      const candidateBundle = await getAttemptBundle(attempt.attemptId);
      const llmStarts = (Array.isArray(candidateBundle?.events) ? candidateBundle.events : [])
        .filter((event) => event?.type === "llm.turn.start");
      const last = llmStarts.sort((a, b) => Number(b.seq || 0) - Number(a.seq || 0))[0];
      if (!last?.data?.contextReceiptPath) continue;
      return await loadContextReceipt(last.data.contextReceiptPath);
    }
    return null;
  }

  function diffReceiptSections(currentReceipt, previousReceipt) {
    const currentSections = Array.isArray(currentReceipt?.receipt?.sections) ? currentReceipt.receipt.sections : [];
    const previousSections = Array.isArray(previousReceipt?.receipt?.sections) ? previousReceipt.receipt.sections : [];
    const previousById = new Map(previousSections.map((section) => [String(section?.id || ""), section]));
    const out = [];
    for (const section of currentSections) {
      const id = String(section?.id || "");
      const prev = previousById.get(id) || null;
      if (!prev) {
        out.push(`+ ${id || "(no-id)"} (new)`);
        continue;
      }
      if (String(prev?.sha256 || "") !== String(section?.sha256 || "")) {
        out.push(`~ ${id || "(no-id)"} (changed)`);
      }
    }
    return out;
  }

  async function renderInspector() {
    const root = el("trainerInspector");
    if (!root) return;
    const bundle = await selectedBundle();
    const events = Array.isArray(bundle?.events) ? bundle.events : [];
    if (!events.length) {
      root.textContent = "Select an attempt.";
      return;
    }
    const selected = state.selectedEventSeq
      ? findEvent(events, state.selectedEventSeq)
      : events[0];
    if (!selected) {
      root.textContent = "Select an event.";
      return;
    }

    const lines = [];
    lines.push(`type: ${selected.type}`);
    lines.push(`seq: ${selected.seq}`);
    lines.push(`actor: ${selected.actor}`);
    lines.push("");

    if (selected.type === "tool.call.executed") {
      lines.push(`tool: ${selected?.data?.name || "(unknown)"}`);
      lines.push(`ok: ${selected?.data?.ok === true ? "true" : "false"}`);
      if (selected?.data?.error) {
        lines.push(`error.code: ${selected.data.error.code || ""}`);
        lines.push(`error.message: ${selected.data.error.message || ""}`);
      } else {
        lines.push(`result: ${JSON.stringify(selected?.data?.result ?? null)}`);
      }
    } else if (selected.type === "error") {
      lines.push(`kind: ${selected?.data?.kind || ""}`);
      lines.push(`requestedToolName: ${selected?.data?.requestedToolName || ""}`);
      lines.push(`message: ${selected?.data?.message || ""}`);
      const registryEvent = events.find((event) => event?.type === "tool.registry.snapshot");
      const tools = Array.isArray(registryEvent?.data?.tools) ? registryEvent.data.tools.map((tool) => tool.name).filter(Boolean) : [];
      lines.push(`registryTools(${tools.length}): ${tools.join(", ")}`);
    } else if (selected.type === "llm.turn.start") {
      lines.push(`turnId: ${selected?.data?.turnId || ""}`);
      lines.push(`toolRegistrySha256: ${selected?.data?.toolRegistrySha256 || ""}`);
      lines.push(`contextReceiptPath: ${selected?.data?.contextReceiptPath || ""}`);
      if (state.advanced && selected?.data?.contextReceiptPath) {
        const receipt = await loadContextReceipt(selected.data.contextReceiptPath);
        const previousReceipt = await resolvePreviousReceipt(bundle, selected);
        const diffLines = diffReceiptSections(receipt, previousReceipt);
        lines.push("");
        lines.push("llmRequest.system:");
        lines.push(String(receipt?.llmRequest?.system || ""));
        lines.push("");
        lines.push("llmRequest.messages:");
        lines.push(JSON.stringify(receipt?.llmRequest?.messages || [], null, 2));
        lines.push("");
        lines.push("llmRequest.tools:");
        lines.push(JSON.stringify(receipt?.llmRequest?.tools || [], null, 2));
        lines.push("");
        lines.push("provenance.sections:");
        lines.push(JSON.stringify(receipt?.receipt?.sections || [], null, 2));
        lines.push("");
        lines.push("diff.vs.previous:");
        lines.push(diffLines.length ? diffLines.join("\n") : "(no previous receipt)");
      }
    }

    lines.push("");
    lines.push("raw:");
    lines.push(JSON.stringify(selected, null, 2));
    root.textContent = lines.join("\n");
  }

  function renderCompare() {
    const root = el("trainerCompare");
    if (!root) return;
    const compare = state.compare;
    if (!compare) {
      root.textContent = "Compare not available.";
      return;
    }
    const rows = [];
    rows.push(`Attempts: ${compare.attemptsCount || 0}`);
    rows.push(`Success rate: ${(Number(compare.successRate || 0) * 100).toFixed(1)}%`);
    rows.push(`Median duration: ${formatMs(compare.medianDurationMs || 0)}`);
    rows.push("");
    rows.push("Tool failure rates:");
    const toolRows = Array.isArray(compare.toolFailureRates) ? compare.toolFailureRates : [];
    if (!toolRows.length) {
      rows.push("(none)");
    } else {
      for (const row of toolRows) {
        rows.push(`- ${row.toolName}: ${row.failures}/${row.total} (${(Number(row.rate || 0) * 100).toFixed(1)}%)`);
      }
    }
    rows.push("");
    rows.push("Divergence fingerprints:");
    const fpRows = Array.isArray(compare.divergence) ? compare.divergence : [];
    if (!fpRows.length) {
      rows.push("(none)");
    } else {
      for (const row of fpRows) {
        rows.push(`- ${row.fingerprint}: ${row.count}`);
      }
    }
    root.textContent = rows.join("\n");
  }

  function renderLoadouts() {
    const root = el("trainerLoadouts");
    if (!root) return;
    root.innerHTML = "";
    if (!state.loadouts.length) {
      root.textContent = "No loadouts.";
      return;
    }
    for (const loadout of state.loadouts) {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "8px";
      row.style.marginBottom = "8px";
      const id = String(loadout?.loadoutId || "");
      const marker = id && id === state.activeLoadoutId ? " (active)" : "";
      const label = document.createElement("span");
      label.className = "small";
      label.textContent = `${id}${marker}`;
      row.appendChild(label);
      if (id && id !== state.activeLoadoutId) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn small";
        btn.textContent = "Use";
        btn.addEventListener("click", async () => {
          const g = await gateway();
          if (!g || typeof g.trainerActivateLoadout !== "function") return;
          await g.trainerActivateLoadout({ questId: QUEST_ID, loadoutId: id });
          await refreshLoadouts();
          renderLoadouts();
        });
        row.appendChild(btn);
      }
      root.appendChild(row);
    }
  }

  function renderSkillCatalog() {
    const root = el("trainerSkillCatalog");
    if (!root) return;
    const rows = [];
    rows.push(`Skills extracted: ${state.skillCatalog.length}`);
    if (!state.skillCatalog.length) {
      rows.push("(none)");
    } else {
      for (let i = 0; i < state.skillCatalog.length; i += 1) {
        const entry = state.skillCatalog[i] || {};
        rows.push(`${i + 1}. ${entry.name || "(unnamed)"} @ ${entry.location || "(unknown)"}`);
        rows.push(`   ${entry.description || ""}`);
      }
    }
    rows.push("");
    rows.push(`Skill actions (plugin): ${state.skillActions.length}`);
    if (state.skillActionCompile) {
      rows.push(`Parser: ${state.skillActionCompile.parserVersion || "(unknown)"}`);
      rows.push(`Source: ${state.skillActionCompile.source || "none"}`);
      rows.push(`Active skill path: ${state.skillActionCompile.activeSkillPath || "(none)"}`);
      rows.push(`Skill status: ${state.skillActionCompile.skillStatus || "(unknown)"}`);
      const compileErrors = Array.isArray(state.skillActionCompile.errors) ? state.skillActionCompile.errors : [];
      if (compileErrors.length) {
        rows.push("Compile errors:");
        for (const err of compileErrors) {
          rows.push(`- ${err?.code || "PARSE_INVALID"}: ${err?.message || "Unknown parse error"}`);
        }
      }
    }
    if (!state.skillActions.length) {
      rows.push("(none)");
    } else {
      for (const action of state.skillActions) {
        const actionId = String(action?.id || "");
        const method = String(action?.request?.method || "GET");
        const urlTemplate = String(action?.request?.urlTemplate || "");
        const confidence = Number(action?.confidence || 0);
        const source = String(action?.source || "inferred");
        const params = Array.isArray(action?.params) ? action.params.map((row) => row?.name).filter(Boolean) : [];
        const stats = state.actionStatsById.get(actionId) || { invocations: 0, successes: 0, failures: 0, lastStatus: null };
        rows.push(`- ${actionId} [${source}, c=${confidence.toFixed(2)}]`);
        rows.push(`  ${method} ${urlTemplate}`);
        rows.push(`  params: ${params.length ? params.join(", ") : "(none)"}`);
        rows.push(`  runs: ${stats.invocations} (ok=${stats.successes}, fail=${stats.failures}, last=${stats.lastStatus || "n/a"})`);
      }
    }
    if (state.skillActionUsage) {
      rows.push("");
      rows.push("Usage diagnostics:");
      rows.push(`- HTTP request calls: ${Number(state.skillActionUsage.httpRequestCalls || 0)}`);
      rows.push(`- Matched action calls: ${Number(state.skillActionUsage.httpRequestMatched || 0)}`);
      rows.push(`- Missing tool results: ${Number(state.skillActionUsage.missingResults || 0)}`);
      const notUsed = Array.isArray(state.skillActionUsage.notUsedActions) ? state.skillActionUsage.notUsedActions : [];
      rows.push(`- Not used actions: ${notUsed.length ? notUsed.join(", ") : "(none)"}`);
      const reasonCodes = Array.isArray(state.skillActionUsage.reasonCodes) ? state.skillActionUsage.reasonCodes : [];
      rows.push(`- Reason codes: ${reasonCodes.length ? reasonCodes.join(", ") : "(none)"}`);
    }
    rows.push("");
    rows.push(`Trainer namespace enabled: ${state.trainerNamespaceEnabled ? "yes" : "no"}`);
    rows.push(`Trainer namespace tools: ${state.trainerNamespaceTools.length}`);
    if (state.trainerNamespaceTools.length) {
      for (const row of state.trainerNamespaceTools) {
        rows.push(`- ${row?.name || "(unknown)"} [tier=${row?.tier || "?"}]`);
      }
    }
    const trainerDiag = state.trainerNamespaceDiagnostics && typeof state.trainerNamespaceDiagnostics === "object"
      ? state.trainerNamespaceDiagnostics
      : null;
    if (trainerDiag) {
      rows.push("");
      rows.push("Trainer namespace diagnostics:");
      const perTurnRemaining = trainerDiag?.budgetRemaining?.perTurn?.remaining;
      const perMinuteRemaining = trainerDiag?.budgetRemaining?.perMinute?.remaining;
      rows.push(`- Budget per turn remaining: ${perTurnRemaining === null || perTurnRemaining === undefined ? "(n/a)" : perTurnRemaining}`);
      rows.push(`- Budget per minute remaining: ${perMinuteRemaining === null || perMinuteRemaining === undefined ? "(n/a)" : perMinuteRemaining}`);
      const pendingApprovals = Array.isArray(trainerDiag.pendingApprovals) ? trainerDiag.pendingApprovals : [];
      rows.push(`- Pending approvals: ${pendingApprovals.length}`);
      const recentBlockCodes = Array.isArray(trainerDiag.recentBlockCodes) ? trainerDiag.recentBlockCodes : [];
      rows.push(`- Recent block codes: ${recentBlockCodes.length}`);
      if (recentBlockCodes.length) {
        for (const row of recentBlockCodes.slice(0, 8)) {
          rows.push(`  ${row?.code || "UNKNOWN"} @ ${row?.tool || "(unknown tool)"}`);
        }
      }
    }
    root.textContent = rows.join("\n");
  }

  function renderToolLab() {
    const select = el("trainerToolNameSelect");
    const paramsInput = el("trainerToolParamsInput");
    const output = el("trainerToolResult");
    const invokeBtn = el("trainerToolInvokeBtn");
    if (!select || !paramsInput || !output) return;

    const currentDraftTool = String(state.selectedToolName || "").trim();
    if (currentDraftTool) {
      state.toolDraftByName.set(currentDraftTool, String(paramsInput.value || "{}"));
    }

    const currentSelected = String(state.selectedToolName || "").trim();
    select.innerHTML = "";
    if (!state.toolNames.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "(no tools)";
      select.appendChild(option);
      select.disabled = true;
      paramsInput.value = "{}";
      if (invokeBtn) invokeBtn.disabled = true;
    } else {
      select.disabled = false;
      for (const name of state.toolNames) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
      }
      const nextSelected = state.toolNames.includes(currentSelected) ? currentSelected : state.toolNames[0];
      state.selectedToolName = nextSelected || "";
      select.value = state.selectedToolName;
      paramsInput.value = getToolDraft(state.selectedToolName);
      if (invokeBtn) invokeBtn.disabled = false;
    }

    const result = state.toolLastResult;
    if (!result) {
      output.textContent = "Select a tool, set params JSON, and click Run tool.";
      return;
    }
    output.textContent = JSON.stringify(result, null, 2);
  }

  function renderIntegrity() {
    const root = el("trainerIntegrity");
    if (!root) return;
    const integrity = state.transcriptIntegrity;
    if (!integrity) {
      root.textContent = "Transcript integrity snapshot unavailable.";
      return;
    }
    const stats = integrity.stats || {};
    const trainerDiag = state.trainerNamespaceDiagnostics && typeof state.trainerNamespaceDiagnostics === "object"
      ? state.trainerNamespaceDiagnostics
      : null;
    const trainerBudgetPerTurn = trainerDiag?.budgetRemaining?.perTurn?.remaining;
    const trainerBudgetPerMinute = trainerDiag?.budgetRemaining?.perMinute?.remaining;
    const trainerPendingApprovals = Array.isArray(trainerDiag?.pendingApprovals) ? trainerDiag.pendingApprovals.length : 0;
    const trainerRecentBlocks = Array.isArray(trainerDiag?.recentBlockCodes) ? trainerDiag.recentBlockCodes.length : 0;
    const lines = [
      `Refreshed: ${integrity.refreshedAt}`,
      `Transcript items: ${Number(integrity.transcriptItems || 0)}`,
      `Tool results: ${Number(stats.toolResultCount || 0)}`,
      `Orphan tool results: ${Number(stats.orphanToolResults || 0)}`,
      `Duplicate tool results: ${Number(stats.duplicateToolResults || 0)}`,
      `Displaced tool results: ${Number(stats.displacedToolResults || 0)}`,
      `Synthetic repair rows: ${Number(integrity.syntheticCount || 0)}`,
      `Skill action tools: ${Number(state.skillActions.length || 0)}`,
      `Trainer namespace enabled: ${state.trainerNamespaceEnabled ? "yes" : "no"}`,
      `Trainer namespace tools: ${Number(state.trainerNamespaceTools.length || 0)}`,
      `Trainer budget per turn remaining: ${trainerBudgetPerTurn === null || trainerBudgetPerTurn === undefined ? "(n/a)" : trainerBudgetPerTurn}`,
      `Trainer budget per minute remaining: ${trainerBudgetPerMinute === null || trainerBudgetPerMinute === undefined ? "(n/a)" : trainerBudgetPerMinute}`,
      `Trainer pending approvals: ${trainerPendingApprovals}`,
      `Trainer recent block codes: ${trainerRecentBlocks}`,
      `Skill action reason codes: ${
        Array.isArray(state.skillActionUsage?.reasonCodes) && state.skillActionUsage.reasonCodes.length
          ? state.skillActionUsage.reasonCodes.join(", ")
          : "(none)"
      }`,
      "",
      "Recent synthetic rows:",
    ];
    const recent = Array.isArray(integrity.syntheticRecent) ? integrity.syntheticRecent : [];
    if (!recent.length) {
      lines.push("(none)");
    } else {
      for (const row of recent) {
        lines.push(`- ${row.toolCallId || "(no-call-id)"} :: ${row.toolName || "unknown"}`);
      }
    }
    root.textContent = lines.join("\n");
  }

  async function render() {
    renderAttempts();
    await renderTimeline();
    await renderInspector();
    renderSkillCatalog();
    renderToolLab();
    renderIntegrity();
    renderCompare();
    renderLoadouts();
    setTrainerTab(state.activeTab);
  }

  async function runAttempts(count) {
    const total = Math.max(1, Math.floor(Number(count) || 1));
    const g = await gateway();
    if (!g || typeof g.experienceRun !== "function") {
      setStatus("Runtime gateway unavailable.", true);
      return;
    }
    setStatus(`Running ${total} attempt(s)...`);
    for (let i = 0; i < total; i += 1) {
      await g.experienceRun({ prompt: RUN_PROMPT, emitChat: false, recordToTranscript: true }).catch(() => null);
    }
    state.attemptBundles.clear();
    await refreshAttempts();
    await refreshBuilderDiagnostics();
    await render();
    setStatus(`Completed ${total} attempt(s).`);
  }

  async function refreshBuilderDiagnostics() {
    await refreshToolLab().catch(() => {});
    await refreshTranscriptIntegrity().catch(() => {});
  }

  async function invokeSelectedToolFromUi() {
    const g = await gateway();
    const toolApi = window.__openclawLiteTest || g;
    if (!toolApi) {
      setStatus("Runtime gateway unavailable.", true);
      return;
    }
    const toolName = String(state.selectedToolName || "").trim();
    if (!toolName) {
      setStatus("Select a tool first.", true);
      return;
    }
    const paramsInput = el("trainerToolParamsInput");
    const raw = String(paramsInput?.value || "{}").trim() || "{}";
    let params = {};
    try {
      params = safeJsonParse(raw, null);
      if (!isPlainObject(params)) throw new Error("INVALID_PARAMS_JSON");
    } catch {
      setStatus("Tool params must be valid JSON object.", true);
      return;
    }
    state.toolDraftByName.set(toolName, JSON.stringify(params, null, 2));
    if (!isToolCallable(toolApi, toolName)) {
      state.toolLastResult = {
        ok: false,
        error: `Direct invoke unavailable for "${toolName}" in gateway API.`,
        hint: "Use http_request for endpoint-level testing, or run through experience loop for agent-only tools.",
      };
      await render();
      setStatus(`Tool ${toolName} is not directly invocable from Tool Lab.`, true);
      return;
    }
    const startedAt = Date.now();
    setStatus(`Running tool ${toolName}...`);
    try {
      const isSkillAction = isSkillActionToolName(toolName);
      const isTrainerNamespace = isTrainerNamespaceToolName(toolName);
      const result = isSkillAction
        ? await invokeSkillActionByName(toolApi, toolName, params)
        : isTrainerNamespace
          ? await invokeTrainerNamespaceByName(toolApi, toolName, params)
          : await invokeToolByName(toolApi, toolName, params);
      if (isSkillAction) {
        const actionId = actionIdFromToolName(toolName);
        trackActionRun(actionId, result?.ok === true, String(result?.code || ""));
        trackActionEvidence(result?.evidence || []);
      }
      if (isTrainerNamespace && normalizeTrainerNamespaceToolName(toolName) === "trainer.invoke_action") {
        const actionId = String(result?.actionId || "").trim();
        if (actionId) {
          trackActionRun(actionId, result?.ok === true, String(result?.code || ""));
        }
        trackActionEvidence(result?.evidence || []);
      }
      state.toolLastResult = isSkillAction
        ? {
          ok: result?.ok === true,
          tool: toolName,
          actionId: actionIdFromToolName(toolName),
          durationMs: Date.now() - startedAt,
          request: result?.request || params,
          response: normalizeToolInvocationResult(result?.response || result),
          validation: result?.validation || null,
          evidence: Array.isArray(result?.evidence) ? result.evidence : [],
          code: result?.code || null,
          message: result?.message || null,
        }
        : isTrainerNamespace
          ? {
            ...(result && typeof result === "object" ? result : {}),
            ok: result?.ok === true,
            tool: normalizeTrainerNamespaceToolName(toolName),
            durationMs: Number.isFinite(Number(result?.durationMs))
              ? Number(result.durationMs)
              : Date.now() - startedAt,
            request: result?.request || params,
            response: normalizeToolInvocationResult(cloneForToolResult(result?.response || result, {})),
            code: result?.code || null,
            message: result?.message || null,
            ...(result && typeof result === "object" ? {
              actionId: result.actionId || null,
              evidence: Array.isArray(result.evidence) ? cloneForToolResult(result.evidence, []) : [],
              invocation: cloneForToolResult(result.invocation, null),
              validation: result.validation || null,
            } : {}),
          }
        : {
          ok: true,
          tool: toolName,
          durationMs: Date.now() - startedAt,
          request: params,
          response: normalizeToolInvocationResult(result),
        };
      await refreshToolLab().catch(() => {});
      await refreshTranscriptIntegrity().catch(() => {});
      await render();
      if (isSkillAction && result?.ok !== true) {
        setStatus(`Skill action ${toolName} failed: ${result?.code || "UNSUPPORTED"}`, true);
      } else if (isTrainerNamespace && result?.ok !== true) {
        setStatus(`Trainer tool ${toolName} failed: ${result?.code || "TRAINER_UNAVAILABLE"}`, true);
      } else {
        setStatus(`Tool ${toolName} completed.`);
      }
    } catch (err) {
      if (isSkillActionToolName(toolName)) {
        trackActionRun(actionIdFromToolName(toolName), false, "UNSUPPORTED");
      }
      if (isTrainerNamespaceToolName(toolName) && normalizeTrainerNamespaceToolName(toolName) === "trainer.invoke_action") {
        const actionId = String(params?.actionId || "").trim();
        if (actionId) trackActionRun(actionId, false, "TRAINER_UNAVAILABLE");
      }
      state.toolLastResult = {
        ok: false,
        tool: toolName,
        durationMs: Date.now() - startedAt,
        request: params,
        error: String(err?.message || err || "UNKNOWN"),
      };
      await refreshToolLab().catch(() => {});
      await refreshTranscriptIntegrity().catch(() => {});
      await render();
      setStatus(`Tool ${toolName} failed: ${err?.message || "UNKNOWN"}`, true);
    }
  }

  async function syncCoachingUi() {
    const select = el("trainerCoachingMode");
    if (!select) return;
    const g = await gateway();
    if (!g || typeof g.trainerGetCoaching !== "function") return;
    const data = unwrapEnvelope(await g.trainerGetCoaching());
    const mode = data?.enabled === true ? String(data?.mode || "manual") : "approve";
    select.value = mode;
  }

  async function applyCoachingMode(mode) {
    const g = await gateway();
    if (!g || typeof g.trainerSetCoaching !== "function") return;
    const normalized = String(mode || "approve");
    await g.trainerSetCoaching({
      enabled: normalized !== "approve",
      mode: normalized,
    });
  }

  function triggerBackupDownload(backup) {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = BACKUP_FILENAME;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  async function downloadBackup() {
    let backup = state.backupCache;
    if (!backup) {
      backup = await refreshBackupCache();
    }
    if (!backup) {
      setStatus("Backup export failed.", true);
      return;
    }
    triggerBackupDownload(backup);
    setStatus("Backup downloaded.");
  }

  async function uploadBackup(file) {
    if (!file) return;
    const g = await gateway();
    if (!g || typeof g.trainerBackupImport !== "function") {
      setStatus("Backup import unavailable.", true);
      return;
    }
    let parsed = null;
    try {
      const raw = await file.text();
      parsed = JSON.parse(raw);
    } catch {
      setStatus("Invalid backup JSON file.", true);
      return;
    }
    const data = unwrapEnvelope(await g.trainerBackupImport({ backup: parsed }));
    if (!data?.imported) {
      setStatus("Backup import failed.", true);
      return;
    }
    state.attemptBundles.clear();
    state.receiptCache.clear();
    await refreshAttempts();
    await refreshBackupCache().catch(() => {});
    await refreshBuilderDiagnostics();
    await render();
    setStatus("Backup restored.");
  }

  function bindUi() {
    const traceTabBtn = el("trainerTabTraceBtn");
    if (traceTabBtn) {
      traceTabBtn.addEventListener("click", () => {
        setTrainerTab("trace");
      });
    }
    const toolsTabBtn = el("trainerTabToolsBtn");
    if (toolsTabBtn) {
      toolsTabBtn.addEventListener("click", () => {
        setTrainerTab("tools");
      });
    }

    const run1 = el("trainerRunOnceBtn");
    if (run1) run1.addEventListener("click", () => runAttempts(1).catch(() => {}));
    const run3 = el("trainerRun3Btn");
    if (run3) run3.addEventListener("click", () => runAttempts(3).catch(() => {}));
    const run10 = el("trainerRun10Btn");
    if (run10) run10.addEventListener("click", () => runAttempts(10).catch(() => {}));
    const clearBtn = el("trainerClearAttemptsBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        clearAllAttemptTraces().catch((err) => {
          setStatus(`Clear failed: ${err?.message || "UNKNOWN"}`, true);
        });
      });
    }

    const toolSelect = el("trainerToolNameSelect");
    const paramsInput = el("trainerToolParamsInput");
    const invokeBtn = el("trainerToolInvokeBtn");
    if (toolSelect) {
      toolSelect.addEventListener("change", () => {
        captureToolDraftFromInput();
        state.selectedToolName = String(toolSelect.value || "").trim();
        const draft = getToolDraft(state.selectedToolName);
        if (paramsInput) paramsInput.value = draft;
      });
    }
    if (paramsInput) {
      paramsInput.addEventListener("input", () => {
        captureToolDraftFromInput();
      });
    }
    if (invokeBtn) {
      invokeBtn.addEventListener("click", () => {
        invokeSelectedToolFromUi().catch((err) => {
          setStatus(`Tool run failed: ${err?.message || "UNKNOWN"}`, true);
        });
      });
    }

    const advanced = el("trainerAdvancedToggle");
    if (advanced) {
      advanced.addEventListener("change", () => {
        state.advanced = advanced.checked === true;
        renderInspector().catch(() => {});
      });
    }

    const coaching = el("trainerCoachingMode");
    if (coaching) {
      coaching.addEventListener("change", () => {
        applyCoachingMode(coaching.value).catch(() => {});
      });
    }

    const downloadBtn = el("trainerBackupDownloadBtn");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        downloadBackup().catch((err) => {
          setStatus(`Backup download failed: ${err?.message || "UNKNOWN"}`, true);
        });
      });
    }
    const uploadInput = el("trainerBackupUploadInput");
    if (uploadInput) {
      uploadInput.addEventListener("change", () => {
        const file = uploadInput.files && uploadInput.files[0];
        uploadInput.value = "";
        uploadBackup(file).catch((err) => {
          setStatus(`Backup restore failed: ${err?.message || "UNKNOWN"}`, true);
        });
      });
    }
  }

  async function boot() {
    bindUi();
    setTrainerTab(state.activeTab);
    await syncCoachingUi();
    await refreshAttempts();
    await refreshBackupCache().catch(() => {});
    await refreshBuilderDiagnostics();
    await render();
    if (!state.attempts.length) {
      setStatus("No attempts captured yet. Run the experience once to begin.");
    } else {
      setStatus(`Loaded ${state.attempts.length} attempt(s).`);
    }
    window.__agentTownTrainerRefresh = async () => {
      await refreshBuilderDiagnostics();
      await render();
    };
  }

  boot().catch((err) => {
    setStatus(`Trainer failed to initialize: ${err?.message || "UNKNOWN"}`, true);
  });
})();
