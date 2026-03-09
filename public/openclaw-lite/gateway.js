// src/openclaw-lite/shared/encoding.js
function bytesToB64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function utf8ToBytes(str) {
  return new TextEncoder().encode(String(str ?? ""));
}

// src/openclaw-lite/gateway.js
var gatewayEvents = {
  listeners: /* @__PURE__ */ new Map(),
  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, /* @__PURE__ */ new Set());
    this.listeners.get(event).add(cb);
  },
  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) cb(data);
    }
  },
  send: (msg) => {
    console.warn("gateway not ready");
  }
};
var TRAINER_NAMESPACE_STORAGE_KEY = "agentTown:feature:trainerNamespace";
var TRAINER_NAMESPACE_QUERY_KEYS = ["trainerNamespace", "trainer_namespace", "trainer-tools", "trainerTools"];
var TRAINER_NAMESPACE_DEFAULT_ENABLED = true;
function byId(id) {
  return document.getElementById(id);
}
function appendLine(node, line) {
  if (!node) return;
  const next = `${node.textContent || ""}${node.textContent ? "\n" : ""}${line}`;
  node.textContent = next.slice(-2e4);
}
function parseBoolLike(value) {
  if (value === true || value === false) return value;
  const normalized = String(value == null ? "" : value).trim().toLowerCase();
  if (!normalized) return null;
  if (["1", "true", "yes", "on", "enable", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disable", "disabled"].includes(normalized)) return false;
  return null;
}
function parseTrainerNamespaceQuery(search) {
  const raw = String(search || "").trim();
  if (!raw) return null;
  const params = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  for (const key of TRAINER_NAMESPACE_QUERY_KEYS) {
    if (!params.has(key)) continue;
    const parsed = parseBoolLike(params.get(key));
    if (parsed !== null) return parsed;
  }
  return null;
}
function readTrainerNamespaceStorageOverride() {
  try {
    return parseBoolLike(window?.localStorage?.getItem(TRAINER_NAMESPACE_STORAGE_KEY));
  } catch {
    return null;
  }
}
function resolveTrainerNamespaceEnabled({
  locationSearch = "",
  fallback = TRAINER_NAMESPACE_DEFAULT_ENABLED
} = {}) {
  let enabled = parseBoolLike(fallback);
  if (enabled === null) enabled = TRAINER_NAMESPACE_DEFAULT_ENABLED;
  const queryOverride = parseTrainerNamespaceQuery(locationSearch);
  if (queryOverride !== null) enabled = queryOverride;
  const storageOverride = readTrainerNamespaceStorageOverride();
  if (storageOverride !== null) enabled = storageOverride;
  return enabled;
}
function normalizeSignatureBytes(sig) {
  if (sig instanceof Uint8Array) return sig;
  if (sig instanceof ArrayBuffer) return new Uint8Array(sig);
  if (ArrayBuffer.isView(sig)) return new Uint8Array(sig.buffer);
  if (Array.isArray(sig)) return new Uint8Array(sig);
  return null;
}
async function solanaConnect() {
  const provider = window.solana;
  if (!provider || typeof provider.connect !== "function") throw new Error("NO_SOLANA_WALLET");
  const resp = await provider.connect();
  const address = resp?.publicKey?.toString?.();
  if (!address) throw new Error("WALLET_CONNECT_FAILED");
  return { provider, address };
}
async function solanaSignMessageBytes(messageStr) {
  const provider = window.solana;
  if (!provider || typeof provider.signMessage !== "function") throw new Error("NO_SOLANA_SIGN");
  const msgBytes = utf8ToBytes(messageStr);
  const resp = await provider.signMessage(msgBytes);
  const sig = normalizeSignatureBytes(resp?.signature ?? resp);
  if (!sig || sig.length !== 64) throw new Error("SIGNATURE_FORMAT");
  return sig;
}
async function evmConnect() {
  const eth = window.ethereum;
  if (eth && typeof eth.request === "function") {
    const accounts = await eth.request({ method: "eth_requestAccounts" });
    const address = Array.isArray(accounts) && accounts.length > 0 ? String(accounts[0] || "").trim() : "";
    if (!address) throw new Error("EVM_CONNECT_FAILED");
    return address;
  }
  const res = await fetch("/__test__/evm/wallet", { credentials: "include" });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok || typeof data.address !== "string") {
    throw new Error(String(data?.error || "NO_EVM_WALLET"));
  }
  return data.address;
}
async function evmSignMessageHex(messageStr, address) {
  const eth = window.ethereum;
  if (eth && typeof eth.request === "function") {
    const addr = String(address || "").trim() || await evmConnect();
    const sig = await eth.request({ method: "personal_sign", params: [messageStr, addr] });
    const signatureHex = typeof sig === "string" ? sig.trim() : "";
    if (!signatureHex) throw new Error("EVM_SIGN_FAILED");
    return { address: addr, signatureHex };
  }
  const res = await fetch("/__test__/evm/sign", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: String(messageStr || "") })
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok || typeof data.signatureHex !== "string" || typeof data.address !== "string") {
    throw new Error(String(data?.error || "EVM_SIGN_FAILED"));
  }
  return { address: data.address, signatureHex: data.signatureHex };
}
async function evmSendTransaction({ transaction = {} } = {}) {
  const eth = window.ethereum;
  if (!eth || typeof eth.request !== "function") {
    throw new Error("NO_EVM_PROVIDER");
  }
  const tx = transaction && typeof transaction === "object" ? transaction : {};
  const payload = { ...tx };
  const result = await eth.request({ method: "eth_sendTransaction", params: [payload] });
  const txHash = typeof result === "string" ? result.trim() : "";
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) throw new Error("EVM_SEND_TX_FAILED");
  return txHash;
}
async function init() {
  const runtimeStatus = byId("runtimeStatus");
  const walletLine = byId("walletLine");
  const houseId = byId("houseId");
  const vaultStatus = byId("vaultStatus");
  const approvalsPanel = byId("approvalsPanel");
  const approvals = byId("approvals");
  const runtimeLogs = byId("runtimeLogs");
  const workspaceEvents = byId("workspaceEvents");
  const chatTranscript = byId("chatTranscript");
  const hasSidebarChatUi = !!byId("sendChatBtn");
  const chatInput = byId("chatInput");
  const llmKeyInput = byId("llmKeyInput");
  const llmModelRefInput = byId("llmModelRefInput");
  const llmApiInput = byId("llmApiInput");
  const llmBaseUrlInput = byId("llmBaseUrlInput");
  const llmThinkingInput = byId("llmThinkingInput");
  const llmUseProxyInput = byId("llmUseProxyInput");
  const llmAuthModeInput = byId("llmAuthModeSelect");
  const llmOauthProfileInput = byId("llmOauthProfileInput");
  const llmOauthProfileHint = byId("llmOauthProfileHint");
  const llmLine = byId("llmLine");
  const connectWalletBtn = byId("connectWalletBtn");
  const createHouseBtn = byId("createHouseBtn");
  const recoverHouseBtn = byId("recoverHouseBtn");
  const backupBtn = byId("backupBtn");
  const restoreBtn = byId("restoreBtn");
  const publishBtn = byId("publishBtn");
  const freezeBtn = byId("freezeBtn");
  const exportBtn = byId("exportBtn");
  const chatSend = byId("chatSend");
  const llmSaveBtn = byId("llmSaveBtn");
  const approvalNodes = /* @__PURE__ */ new Map();
  function refreshApprovalsVisibility() {
    if (!approvalsPanel || !approvals) return;
    const hasRows = approvals.childElementCount > 0;
    approvalsPanel.classList.toggle("is-hidden", !hasRows);
  }
  function updateWalletLine(addr) {
    if (!walletLine) return;
    walletLine.textContent = addr ? `Wallet: ${addr}` : "";
  }
  let walletAddr = null;
  let walletAddrEvm = null;
  function renderWorkspaceEvents(events) {
    if (!workspaceEvents) return;
    const rows = Array.isArray(events) ? events : [];
    const lines = rows.slice(0, 50).map((e) => {
      const ts = typeof e?.timestamp === "string" ? e.timestamp : "";
      const actor = typeof e?.actor === "string" ? e.actor : "unknown";
      const action = typeof e?.action === "string" ? e.action : "update";
      const path = typeof e?.path === "string" ? e.path : "";
      return `${ts} ${actor} ${action} ${path}`.trim();
    }).filter(Boolean);
    workspaceEvents.textContent = lines.join("\n");
  }
  async function connectWallet({ silent = false } = {}) {
    try {
      const { address } = await solanaConnect();
      walletAddr = address;
      updateWalletLine(walletAddr);
      return address;
    } catch (e) {
      if (!silent) {
        updateWalletLine(`Wallet error: ${e.message || String(e)}`);
      }
      throw e;
    }
  }
  connectWalletBtn?.addEventListener("click", async () => {
    try {
      await connectWallet();
    } catch {
    }
  });
  const trainerNamespaceEnabled = resolveTrainerNamespaceEnabled({ locationSearch: window.location.search });
  const workerUrl = new URL("/openclaw-lite/worker.js", window.location.href);
  workerUrl.searchParams.set("trainerNamespace", trainerNamespaceEnabled ? "1" : "0");
  const worker = new Worker(`${workerUrl.pathname}${workerUrl.search}`, { type: "module" });
  worker.addEventListener("error", (event) => {
    const message = String(event?.message || "WORKER_ERROR");
    const file = String(event?.filename || "");
    const line = Number(event?.lineno || 0);
    const col = Number(event?.colno || 0);
    const stack = event?.error?.stack ? String(event.error.stack) : "";
    console.error("openclaw-lite worker error:", { message, file, line, col, stack });
    gatewayEvents.emit("status", "worker-error");
  });
  worker.addEventListener("messageerror", () => {
    console.error("openclaw-lite worker messageerror");
    gatewayEvents.emit("status", "worker-error");
  });
  function sendToWorker(msg) {
    worker.postMessage(msg);
  }
  const testRequests = /* @__PURE__ */ new Map();
  let testReqCounter = 0;
  const DEFAULT_WORKER_REQUEST_TIMEOUT_MS = 3e4;
  const EXPERIENCE_RUN_REQUEST_TIMEOUT_MS = 18e4;
  const EXPERIENCE_TOOL_TRACE_LIMIT = 200;
  const experienceToolTrace = [];
  function nextTestRequestId(prefix = "t") {
    testReqCounter += 1;
    return `${prefix}_${Date.now()}_${testReqCounter}`;
  }
  function sendWorkerRequest({ requestType, responseType, payload, timeoutMs = DEFAULT_WORKER_REQUEST_TIMEOUT_MS }) {
    const requestId = nextTestRequestId("req");
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        testRequests.delete(requestId);
        reject(new Error("WORKER_REQUEST_TIMEOUT"));
      }, timeoutMs);
      testRequests.set(requestId, { resolve, reject, timeoutId, responseType });
      sendToWorker({ type: requestType, requestId, ...payload || {} });
    });
  }
  function resolveWorkerRequest(msg) {
    const requestId = typeof msg.requestId === "string" ? msg.requestId : "";
    if (!requestId) return false;
    const rec = testRequests.get(requestId);
    if (!rec) return false;
    if (typeof rec.responseType === "string" && rec.responseType !== msg.type) return false;
    clearTimeout(rec.timeoutId);
    testRequests.delete(requestId);
    rec.resolve(msg);
    return true;
  }
  function isPlainRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function normalizeExperienceToolResult(value) {
    const payload = isPlainRecord(value) ? value : {};
    const errorRaw = isPlainRecord(payload.error) ? payload.error : null;
    return {
      ok: payload.ok === true,
      applied: payload.applied === true,
      stateSnapshot: isPlainRecord(payload.stateSnapshot) ? payload.stateSnapshot : null,
      error: errorRaw ? {
        code: String(errorRaw.code || "UI_INTENT_INTERNAL"),
        message: String(errorRaw.message || errorRaw.code || "UI intent failed")
      } : null
    };
  }
  function appendExperienceToolTrace({ source = "runtime", tool = "", result = null }) {
    const normalized = normalizeExperienceToolResult(result);
    experienceToolTrace.push({
      atMs: Date.now(),
      source: String(source || "runtime"),
      tool: String(tool || ""),
      ok: normalized.ok === true,
      applied: normalized.applied === true,
      errorCode: normalized.error ? normalized.error.code : null
    });
    if (experienceToolTrace.length > EXPERIENCE_TOOL_TRACE_LIMIT) {
      experienceToolTrace.splice(0, experienceToolTrace.length - EXPERIENCE_TOOL_TRACE_LIMIT);
    }
  }
  function resolveExperienceIntentDispatcher() {
    if (window.AgentTownExperienceIntent && typeof window.AgentTownExperienceIntent.dispatch === "function") {
      return window.AgentTownExperienceIntent.dispatch.bind(window.AgentTownExperienceIntent);
    }
    if (typeof window.dispatchExperienceIntent === "function") {
      return window.dispatchExperienceIntent.bind(window);
    }
    return null;
  }
  async function invokeExperienceTool({ tool, params = {}, source = "runtime" } = {}) {
    const toolName = String(tool || "").trim();
    const safeParams = isPlainRecord(params) ? params : {};
    const dispatch = resolveExperienceIntentDispatcher();
    if (!dispatch) {
      const unavailable = {
        ok: false,
        applied: false,
        stateSnapshot: null,
        error: {
          code: "UI_INTENT_UNAVAILABLE",
          message: "Experience intent dispatcher is not available"
        }
      };
      appendExperienceToolTrace({ source, tool: toolName, result: unavailable });
      return unavailable;
    }
    let result;
    try {
      result = await dispatch(toolName, safeParams, { source });
    } catch (err) {
      result = {
        ok: false,
        applied: false,
        stateSnapshot: null,
        error: {
          code: "UI_INTENT_INTERNAL",
          message: String(err?.message || err || "UI intent dispatch failed")
        }
      };
    }
    const normalized = normalizeExperienceToolResult(result);
    appendExperienceToolTrace({ source, tool: toolName, result: normalized });
    return normalized;
  }
  function parseModelRef(modelRef, fallbackProvider = "openai", fallbackModelId = "gpt-4o-mini") {
    const ref = String(modelRef || "").trim();
    if (!ref) return { provider: fallbackProvider, modelId: fallbackModelId, modelRef: `${fallbackProvider}/${fallbackModelId}` };
    const slash = ref.indexOf("/");
    if (slash > 0) {
      const provider = ref.slice(0, slash).trim();
      const modelId = ref.slice(slash + 1).trim();
      if (provider && modelId) return { provider, modelId, modelRef: `${provider}/${modelId}` };
    }
    return { provider: fallbackProvider, modelId: ref, modelRef: `${fallbackProvider}/${ref}` };
  }
  function setLlmAuthModeUi() {
    const authMode = String(llmAuthModeInput?.value || "").trim() === "oauth-json" ? "oauth-json" : "api-key";
    if (llmOauthProfileInput) {
      llmOauthProfileInput.style.display = authMode === "oauth-json" ? "block" : "none";
      if (authMode === "oauth-json") {
        llmOauthProfileInput.placeholder = "Paste OAuth callback URL, auth.json profile JSON, or raw access token.";
      }
    }
    if (llmKeyInput) {
      llmKeyInput.placeholder = authMode === "oauth-json" ? "Optional override token (usually auto-derived from OAuth input)" : "LLM API key (stored locally)";
    }
    if (llmOauthProfileHint) {
      llmOauthProfileHint.textContent = authMode === "oauth-json" ? 'Use "Sign in with ChatGPT" (subscription) and paste callback URL, auth JSON, or token here.' : "";
    }
  }
  function getAccessTokenFromProfileValue(value) {
    if (!value || typeof value !== "object") return "";
    const direct = typeof value.access === "string" ? value.access.trim() : typeof value.access_token === "string" ? value.access_token.trim() : typeof value.accessToken === "string" ? value.accessToken.trim() : "";
    return direct;
  }
  function getOAuthProviderAliases(providerHint) {
    const normalized = String(providerHint || "").trim().toLowerCase();
    if (!normalized) return [];
    const aliases = /* @__PURE__ */ new Set([normalized]);
    if (normalized === "openai-codex") {
      aliases.add("openai");
      aliases.add("chatgpt");
    }
    if (normalized === "openai") {
      aliases.add("openai-codex");
      aliases.add("chatgpt");
    }
    return [...aliases];
  }
  function providerAliasMatches(aliasSet, rawName) {
    if (!aliasSet || !aliasSet.size) return true;
    const normalized = String(rawName || "").trim().toLowerCase();
    if (!normalized) return false;
    if (aliasSet.has(normalized)) return true;
    const prefix = normalized.match(/^[a-z0-9_-]+/);
    if (prefix && aliasSet.has(prefix[0])) return true;
    return false;
  }
  function decodeMaybeUriComponent(value) {
    const text = String(value || "").trim();
    if (!text || !text.includes("%")) return text;
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  }
  function normalizeTokenCandidate(value) {
    const text = String(value || "").trim().replace(/^['"]+|['"]+$/g, "");
    if (!text) return "";
    return text.replace(/^bearer\s+/i, "").trim();
  }
  function isLikelyJwtToken(value) {
    return /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(String(value || ""));
  }
  function isLikelyOpaqueOAuthToken(value) {
    return /^[A-Za-z0-9._~-]{24,}$/.test(String(value || ""));
  }
  function collectOAuthCandidatesFromUrl(rawUrl) {
    let parsed = null;
    try {
      parsed = new URL(String(rawUrl || "").trim());
    } catch {
      return [];
    }
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const pushCandidate = (value) => {
      const normalized = normalizeTokenCandidate(value);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      out.push(normalized);
      const decoded = decodeMaybeUriComponent(normalized);
      if (decoded && decoded !== normalized && !seen.has(decoded)) {
        seen.add(decoded);
        out.push(decoded);
      }
    };
    const readParams = (params) => {
      for (const [rawKey, rawValue] of params.entries()) {
        const key = String(rawKey || "").trim().toLowerCase();
        const value = String(rawValue || "").trim();
        if (!key || !value) continue;
        const include = key === "access" || key === "access_token" || key === "token" || key === "oauth_token" || key === "id_token" || key === "auth" || key === "profile" || key === "credentials" || key.includes("token");
        if (!include) continue;
        pushCandidate(value);
      }
    };
    readParams(parsed.searchParams);
    const hashRaw = String(parsed.hash || "").replace(/^#/, "").trim();
    if (hashRaw) {
      const hashQuery = hashRaw.startsWith("?") ? hashRaw.slice(1) : hashRaw;
      readParams(new URLSearchParams(hashQuery));
    }
    return out;
  }
  function extractOAuthTokenFromProfileMap(profileMap, providerHint) {
    if (!profileMap || typeof profileMap !== "object") return "";
    if (Array.isArray(profileMap)) {
      for (const item of profileMap) {
        const token = extractOAuthTokenFromProfileMap(item, providerHint);
        if (token) return token;
      }
      return "";
    }
    const aliasSet = new Set(getOAuthProviderAliases(providerHint));
    const direct = getAccessTokenFromProfileValue(profileMap);
    if (direct) return direct;
    for (const alias of aliasSet) {
      if (!alias) continue;
      if (profileMap[alias]) {
        const directProfile = getAccessTokenFromProfileValue(profileMap[alias]);
        if (directProfile) return directProfile;
      }
    }
    for (const key of Object.keys(profileMap)) {
      const profile = profileMap[key];
      const profileToken = getAccessTokenFromProfileValue(profile);
      const profileProvider = String(profile?.provider || profile?.type || key || "").trim().toLowerCase();
      if (!profileToken) continue;
      if (providerAliasMatches(aliasSet, profileProvider) || providerAliasMatches(aliasSet, key)) {
        return profileToken;
      }
    }
    return "";
  }
  function extractOAuthAccessTokenFromObject(parsed, providerHint) {
    const candidates = [];
    if (parsed && typeof parsed === "object") {
      candidates.push(parsed);
      if (parsed.profiles && typeof parsed.profiles === "object") candidates.push(parsed.profiles);
      if (parsed.auth && parsed.auth.profiles && typeof parsed.auth.profiles === "object") candidates.push(parsed.auth.profiles);
      if (parsed.profile && typeof parsed.profile === "object") candidates.push(parsed.profile);
      if (parsed.providerProfiles && typeof parsed.providerProfiles === "object") candidates.push(parsed.providerProfiles);
    }
    for (const candidate of candidates) {
      const token = extractOAuthTokenFromProfileMap(candidate, providerHint);
      if (token) return token;
    }
    const direct = getAccessTokenFromProfileValue(parsed);
    if (direct) return direct;
    return "";
  }
  function extractOAuthAccessToken(raw, providerHint) {
    const text = String(raw || "").trim();
    if (!text) {
      return { ok: false, error: "MISSING_OAUTH_PROFILE_JSON" };
    }
    const directToken = normalizeTokenCandidate(text);
    if (isLikelyJwtToken(directToken) || isLikelyOpaqueOAuthToken(directToken)) {
      return { ok: true, token: directToken };
    }
    if (text.startsWith("{")) {
      try {
        const parsed = JSON.parse(text);
        const token = extractOAuthAccessTokenFromObject(parsed, providerHint);
        return token ? { ok: true, token } : { ok: false, error: "NO_OAUTH_ACCESS_TOKEN_FOUND" };
      } catch {
        return { ok: false, error: "INVALID_OAUTH_PROFILE_JSON" };
      }
    }
    const decodedText = decodeMaybeUriComponent(text);
    if (decodedText && decodedText !== text) {
      const decodedDirectToken = normalizeTokenCandidate(decodedText);
      if (isLikelyJwtToken(decodedDirectToken) || isLikelyOpaqueOAuthToken(decodedDirectToken)) {
        return { ok: true, token: decodedDirectToken };
      }
      if (decodedText.startsWith("{")) {
        try {
          const parsed = JSON.parse(decodedText);
          const token = extractOAuthAccessTokenFromObject(parsed, providerHint);
          if (token) return { ok: true, token };
        } catch {
        }
      }
    }
    const urlCandidates = collectOAuthCandidatesFromUrl(text);
    for (const candidate of urlCandidates) {
      if (isLikelyJwtToken(candidate) || isLikelyOpaqueOAuthToken(candidate)) {
        return { ok: true, token: candidate };
      }
      if (candidate.startsWith("{")) {
        try {
          const parsed = JSON.parse(candidate);
          const token = extractOAuthAccessTokenFromObject(parsed, providerHint);
          if (token) return { ok: true, token };
        } catch {
        }
      }
    }
    if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(text)) {
      return { ok: false, error: "NO_OAUTH_ACCESS_TOKEN_FOUND" };
    }
    return { ok: false, error: "INVALID_OAUTH_PROFILE_JSON" };
  }
  function normalizeThinkingLevel(value) {
    const v = String(value || "").trim().toLowerCase();
    if (!v) return "";
    if (v === "minimal" || v === "low" || v === "medium" || v === "high" || v === "xhigh") return v;
    return "";
  }
  function configureLlm({ apiKey }) {
    const modelParsed = parseModelRef(llmModelRefInput?.value || "");
    const authMode = String(llmAuthModeInput?.value || "").trim() === "oauth-json" ? "oauth-json" : "api-key";
    const oauthText = String(llmOauthProfileInput?.value || "").trim();
    const providerHint = modelParsed?.provider || "openai";
    const parsedToken = authMode === "oauth-json" ? extractOAuthAccessToken(oauthText, providerHint) : null;
    const manualApiKey = String(apiKey || "").trim();
    const resolvedApiKey = manualApiKey || (parsedToken?.ok ? String(parsedToken.token || "").trim() : "");
    const oauthError = authMode === "oauth-json" && oauthText && parsedToken && !parsedToken.ok ? String(parsedToken.error || "INVALID_OAUTH_PROFILE_JSON") : "";
    let api = String(llmApiInput?.value || "").trim();
    const baseOverride = String(llmBaseUrlInput?.value || "").trim();
    const thinking = normalizeThinkingLevel(llmThinkingInput?.value || "");
    const useProxy = llmUseProxyInput ? llmUseProxyInput.checked !== false : true;
    const defaultOpenAiProxyBase = new URL("/api/llm/openai/v1", window.location.origin).toString();
    if (!api && modelParsed.provider === "openai") api = "openai-completions";
    const baseUrl = baseOverride || (modelParsed.provider === "openai" ? defaultOpenAiProxyBase : "");
    sendToWorker({
      type: "gateway.command.setLlmConfig",
      apiKey: resolvedApiKey,
      api,
      provider: modelParsed.provider,
      modelRef: modelParsed.modelRef,
      modelId: modelParsed.modelId,
      baseUrl,
      reasoning: thinking,
      useProxy
    });
    if (llmLine) {
      const keyStatus = resolvedApiKey ? authMode === "oauth-json" ? "oauth saved" : "key saved" : oauthError ? `oauth error: ${oauthError}` : "missing key";
      llmLine.textContent = `LLM: ${modelParsed.modelRef} (${keyStatus}, proxy=${useProxy ? "on" : "off"}, thinking=${thinking || "default"})`;
    }
  }
  llmSaveBtn?.addEventListener("click", () => {
    configureLlm({ apiKey: llmKeyInput?.value || "" });
  });
  llmAuthModeInput?.addEventListener("change", () => {
    setLlmAuthModeUi();
  });
  if (llmModelRefInput && !llmModelRefInput.value) llmModelRefInput.value = "openai/gpt-4o-mini";
  if (llmUseProxyInput) llmUseProxyInput.checked = true;
  setLlmAuthModeUi();
  createHouseBtn?.addEventListener("click", () => {
    const rh = new Uint8Array(32);
    crypto.getRandomValues(rh);
    sendToWorker({ type: "gateway.command.createHouse", rhB64: bytesToB64(rh) });
  });
  recoverHouseBtn?.addEventListener("click", () => {
    sendToWorker({ type: "gateway.command.recoverHouse" });
  });
  backupBtn?.addEventListener("click", () => {
    sendToWorker({ type: "gateway.command.backupVault" });
  });
  restoreBtn?.addEventListener("click", () => {
    sendToWorker({ type: "gateway.command.restoreVault" });
  });
  publishBtn?.addEventListener("click", () => {
    sendToWorker({
      type: "gateway.command.publishProfile",
      housePublicJson: { v: 1, displayName: "Lite House", tagline: "<b>hello</b> from <script>lite<\/script>" },
      promptMd: "Hello from OpenClaw Lite."
    });
  });
  freezeBtn?.addEventListener("click", () => {
    sendToWorker({ type: "gateway.command.freezeNow" });
  });
  exportBtn?.addEventListener("click", () => {
    sendToWorker({ type: "gateway.command.exportZip" });
  });
  chatSend?.addEventListener("click", () => {
    const text = (chatInput?.value || "").trim();
    if (!text) return;
    chatInput.value = "";
    sendToWorker({ type: "gateway.chat.send", text });
  });
  chatInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") chatSend?.click();
  });
  window.addEventListener("pagehide", () => {
    sendToWorker({ type: "gateway.event.pagehide" });
  });
  document.addEventListener("visibilitychange", () => {
    sendToWorker({ type: "gateway.event.visibilitychange", state: document.visibilityState });
  });
  worker.addEventListener("message", async (ev) => {
    const msg = ev.data;
    if (!msg || typeof msg.type !== "string") return;
    if (resolveWorkerRequest(msg)) {
      return;
    }
    if (msg.type === "worker.runtime.status") {
      if (runtimeStatus) runtimeStatus.textContent = String(msg.status || "");
      gatewayEvents.emit("status", String(msg.status || ""));
      return;
    }
    if (msg.type === "worker.runtime.ready") {
      if (runtimeStatus) runtimeStatus.textContent = "ready";
      return;
    }
    if (msg.type === "worker.state.update") {
      if (houseId) houseId.textContent = msg.state?.houseId || "\u2014";
      const latest = msg.state?.vault?.latestBackupId || null;
      if (vaultStatus) vaultStatus.textContent = latest ? `latest ${latest}` : "\u2014";
      gatewayEvents.emit("state", msg.state || {});
      return;
    }
    if (msg.type === "worker.log.append") {
      appendLine(runtimeLogs, String(msg.line || ""));
      gatewayEvents.emit("log", { level: "info", message: String(msg.line || "") });
      return;
    }
    if (msg.type === "worker.workspace.events") {
      const events = Array.isArray(msg.events) ? msg.events : [];
      renderWorkspaceEvents(events);
      return;
    }
    if (msg.type === "worker.chat.append") {
      const role = String(msg.role || "unknown");
      const text = String(msg.text || "");
      if (!hasSidebarChatUi) {
        appendLine(chatTranscript, `${role}: ${text}`);
      }
      gatewayEvents.emit("message", { role, text });
      return;
    }
    if (msg.type === "worker.approval.request") {
      const approval = msg.approval || {};
      const id = String(approval.id || "");
      if (!id) return;
      if (!approvals) {
        sendToWorker({ type: "gateway.approval.respond", id, decision: "reject" });
        gatewayEvents.emit("log", {
          level: "warn",
          message: `approval auto-rejected: ${approval.title || "Approval"} (missing approvals UI surface)`
        });
        return;
      }
      if (approvalNodes.has(id)) return;
      const wrap = document.createElement("div");
      wrap.className = "kv";
      wrap.style.marginBottom = "8px";
      wrap.textContent = "";
      const label = document.createElement("span");
      label.textContent = `${approval.title || "Approval"}: ${approval.body || ""}`;
      label.style.flex = "1";
      const okBtn = document.createElement("button");
      okBtn.className = "btn primary";
      okBtn.textContent = "Approve";
      okBtn.addEventListener("click", () => {
        sendToWorker({ type: "gateway.approval.respond", id, decision: "approve" });
      });
      const noBtn = document.createElement("button");
      noBtn.className = "btn";
      noBtn.textContent = "Reject";
      noBtn.addEventListener("click", () => {
        sendToWorker({ type: "gateway.approval.respond", id, decision: "reject" });
      });
      wrap.appendChild(label);
      wrap.appendChild(okBtn);
      wrap.appendChild(noBtn);
      approvals.appendChild(wrap);
      approvalNodes.set(id, wrap);
      refreshApprovalsVisibility();
      return;
    }
    if (msg.type === "worker.approval.clear") {
      const id = String(msg.id || "");
      const node = approvalNodes.get(id);
      if (node) node.remove();
      approvalNodes.delete(id);
      refreshApprovalsVisibility();
      return;
    }
    if (msg.type === "worker.wallet.request") {
      const id = String(msg.id || "");
      const method = String(msg.method || "");
      const chain = String(msg.chain || "solana").toLowerCase();
      try {
        if (method === "connect") {
          const addr = chain === "evm" ? await evmConnect() : await connectWallet();
          if (chain === "evm") {
            walletAddrEvm = addr;
          } else {
            walletAddr = addr;
          }
          sendToWorker({ type: "gateway.wallet.response", id, ok: true, address: addr });
          return;
        }
        if (method === "signMessage") {
          const message = String(msg.message || "");
          if (chain === "evm") {
            if (!walletAddrEvm) {
              walletAddrEvm = await evmConnect();
            }
            const signed = await evmSignMessageHex(message, walletAddrEvm);
            walletAddrEvm = signed.address;
            sendToWorker({
              type: "gateway.wallet.response",
              id,
              ok: true,
              address: signed.address,
              signatureHex: signed.signatureHex
            });
          } else {
            if (!walletAddr) {
              await connectWallet({ silent: true });
            }
            const sigBytes = await solanaSignMessageBytes(message);
            sendToWorker({
              type: "gateway.wallet.response",
              id,
              ok: true,
              address: walletAddr,
              signatureB64: bytesToB64(sigBytes)
            });
          }
          return;
        }
        if (method === "sendTransaction") {
          if (chain !== "evm") throw new Error("UNSUPPORTED_WALLET_CHAIN");
          if (!walletAddrEvm) {
            walletAddrEvm = await evmConnect();
          }
          const transaction = msg.transaction && typeof msg.transaction === "object" ? msg.transaction : {};
          const txHash = await evmSendTransaction({ transaction });
          sendToWorker({
            type: "gateway.wallet.response",
            id,
            ok: true,
            address: walletAddrEvm,
            txHash
          });
          return;
        }
        throw new Error("UNSUPPORTED_WALLET_METHOD");
      } catch (e) {
        sendToWorker({ type: "gateway.wallet.response", id, ok: false, error: e.message || String(e) });
      }
      return;
    }
    if (msg.type === "worker.ui.intent.request") {
      const id = String(msg.id || "");
      if (!id) return;
      const tool = String(msg.intent || "");
      const params = isPlainRecord(msg.params) ? msg.params : {};
      const result = await invokeExperienceTool({
        tool,
        params,
        source: "worker"
      });
      sendToWorker({
        type: "gateway.ui.intent.response",
        id,
        result
      });
      return;
    }
    if (msg.type === "worker.export.zip") {
      const filename = String(msg.filename || "openclaw-lite-export.zip");
      const bytes = msg.bytes instanceof ArrayBuffer ? new Uint8Array(msg.bytes) : null;
      if (!bytes) return;
      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1e3);
      }
      return;
    }
  });
  sendToWorker({ type: "gateway.boot" });
  async function skillStateRequest() {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.skill.state",
      responseType: "worker.skill.state"
    });
    if (!res?.ok) throw new Error(String(res?.error || "SKILL_STATE_FAILED"));
    return res.result || null;
  }
  async function systemPromptPreviewRequest() {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.systemPrompt.preview",
      responseType: "worker.systemPrompt.preview"
    });
    if (!res?.ok) throw new Error(String(res?.error || "SYSTEM_PROMPT_PREVIEW_FAILED"));
    return res.result || null;
  }
  async function runtimeSessionContextRequest(params = {}) {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.runtime.sessionContext",
      responseType: "worker.runtime.sessionContext",
      payload: { params }
    });
    if (!res?.ok) throw new Error(String(res?.error || "RUNTIME_SESSION_CONTEXT_FAILED"));
    return res.result || null;
  }
  const DEFAULT_COMPILED_PACK_ROOT = "workspace/.agent-town/default-pack";
  const DEFAULT_COMPILED_PACK_MANIFEST_PATH = `${DEFAULT_COMPILED_PACK_ROOT}/manifest.json`;
  const DEFAULT_COMPILED_PACK_MANUAL_PATH = `${DEFAULT_COMPILED_PACK_ROOT}/manual/skill.md`;
  const DEFAULT_COMPILED_PACK_HEARTBEAT_PATH = `${DEFAULT_COMPILED_PACK_ROOT}/heartbeat.md`;
  const DEFAULT_COMPILED_PACK_TOOLS_PATH = `${DEFAULT_COMPILED_PACK_ROOT}/tools.md`;
  const DEFAULT_COMPILED_PACK_TRACE_MAP_PATH = `${DEFAULT_COMPILED_PACK_ROOT}/trace_map.json`;
  let defaultCompiledPackPromise = null;
  let defaultCompiledPackCache = null;
  function unwrapToolEnvelope(value) {
    if (!value || typeof value !== "object") return null;
    if (value.ok === true && value.data && typeof value.data === "object") {
      return value.data;
    }
    return value;
  }
  async function workspaceReadFileRequest(params = {}) {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.workspace.readFile",
      responseType: "worker.workspace.readFile",
      payload: { params }
    });
    if (!res?.ok) throw new Error(String(res?.error || "WORKSPACE_READ_FAILED"));
    return res.result || null;
  }
  async function workspaceWriteFileRequest(params = {}) {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.workspace.writeFile",
      responseType: "worker.workspace.writeFile",
      payload: { params }
    });
    if (!res?.ok) throw new Error(String(res?.error || "WORKSPACE_WRITE_FAILED"));
    return res.result || null;
  }
  async function toolRegistryRequest() {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.tools.registry",
      responseType: "worker.tools.registry"
    });
    if (!res?.ok) throw new Error(String(res?.error || "TOOLS_REGISTRY_FAILED"));
    return res.info || null;
  }
  async function sha256HexFromText(value) {
    const digest = await crypto.subtle.digest("SHA-256", utf8ToBytes(value));
    const hex = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return `sha256:${hex}`;
  }
  function shortHashId(hash, prefix = "packv") {
    const normalized = String(hash || "").replace(/^sha256:/, "");
    return `${prefix}_${normalized.slice(0, 24)}`;
  }
  function normalizeDefaultSkillSourcePath(sourceUrl) {
    try {
      const parsed = new URL(String(sourceUrl || ""), window.location.href);
      return parsed.pathname || "/skill.md";
    } catch {
      return "/skill.md";
    }
  }
  function isSameOriginDefaultSkillSourceUrl(sourceUrl) {
    try {
      const parsed = new URL(String(sourceUrl || ""), window.location.href);
      return parsed.origin === window.location.origin && parsed.pathname === "/skill.md";
    } catch {
      return false;
    }
  }
  async function readWorkspaceText(path, fallback = "") {
    const result = await workspaceReadFileRequest({ path }).catch(() => null);
    const data = unwrapToolEnvelope(result);
    return typeof data?.content === "string" ? data.content : fallback;
  }
  async function writeWorkspaceText(path, content) {
    await workspaceWriteFileRequest({ path, content });
  }
  function buildDefaultHeartbeatMd(sourcePath) {
    return [
      "# Heartbeat",
      "",
      `Source manual: ${sourcePath}`,
      "- Poll shared state at 1 second while the experience is active.",
      "- Back off to 2-5 seconds only on transient failures.",
      "- Keep worker-first execution and ask for human input only when the playbook requires it.",
      ""
    ].join("\n");
  }
  function buildDefaultToolsMd(toolNames = []) {
    const names = Array.isArray(toolNames) ? toolNames.map((name) => String(name || "").trim()).filter(Boolean).sort() : [];
    const lines = [
      "# Tools",
      "",
      "Validated runtime tools available when the default pack was compiled:"
    ];
    if (names.length === 0) {
      lines.push("- (tool registry unavailable during compile)");
    } else {
      for (const name of names) {
        lines.push(`- ${name}`);
      }
    }
    lines.push("");
    return lines.join("\n");
  }
  function buildDefaultTraceMapJson(sourcePath) {
    return `${JSON.stringify({
      traceMapVersion: "portal-default-pack-v1",
      sourcePath,
      experienceId: "agent_town_home",
      eventFamilies: [
        "experience.started",
        "experience.completed",
        "agent.tool",
        "human.action"
      ]
    }, null, 2)}
`;
  }
  async function readDefaultCompiledPackManifest() {
    const raw = await readWorkspaceText(DEFAULT_COMPILED_PACK_MANIFEST_PATH, "");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  async function ensureDefaultSkillPackCompiled({ force = false, idempotencyKey = "" } = {}) {
    if (defaultCompiledPackPromise && !force) return defaultCompiledPackPromise;
    let compilePromise = null;
    compilePromise = (async () => {
      const skillEnvelope = await skillStateRequest();
      const skillState = unwrapToolEnvelope(skillEnvelope);
      const sourceUrl = typeof skillState?.sourceUrl === "string" ? skillState.sourceUrl : "";
      if (!isSameOriginDefaultSkillSourceUrl(sourceUrl)) return null;
      const activeSkillPath = typeof skillState?.activeSkillPath === "string" ? skillState.activeSkillPath.trim() : "";
      if (!activeSkillPath) {
        throw new Error("DEFAULT_SKILL_PACK_NO_ACTIVE_SKILL");
      }
      const manualContent = await readWorkspaceText(activeSkillPath, "");
      if (!manualContent) {
        throw new Error("DEFAULT_SKILL_PACK_EMPTY_MANUAL");
      }
      const sourcePath = normalizeDefaultSkillSourcePath(sourceUrl);
      const existingHeartbeat = await readWorkspaceText("workspace/heartbeat.md", "");
      const existingTools = await readWorkspaceText("workspace/tools.md", "");
      const existingTraceMap = await readWorkspaceText("workspace/trace_map.json", "");
      const toolRegistry = await toolRegistryRequest().catch(() => null);
      const toolNames = Array.isArray(toolRegistry?.names) ? toolRegistry.names.map((name) => String(name || "").trim()).filter(Boolean) : [];
      const heartbeatContent = existingHeartbeat || buildDefaultHeartbeatMd(sourcePath);
      const toolsContent = existingTools || buildDefaultToolsMd(toolNames);
      const traceMapContent = existingTraceMap || buildDefaultTraceMapJson(sourcePath);
      const fileContents = {
        "manual/skill.md": manualContent,
        "heartbeat.md": heartbeatContent,
        "tools.md": toolsContent,
        "trace_map.json": traceMapContent
      };
      const fileHashes = {};
      for (const [filePath, content] of Object.entries(fileContents)) {
        fileHashes[filePath] = await sha256HexFromText(content);
      }
      const sourceRefs = [
        {
          path: sourcePath,
          kind: "same_origin_manual",
          hash: fileHashes["manual/skill.md"]
        }
      ];
      const contentHash = await sha256HexFromText(JSON.stringify({
        sourceRefs,
        fileHashes
      }));
      const manifest = {
        packId: "pack_portal_onboarding_v1",
        packVersionId: shortHashId(contentHash, "packv"),
        displayName: "Portal Default Skill",
        sourceKind: "same_origin_manual",
        sourceRefs,
        contentHash,
        fileHashes,
        compatibility: {
          experienceKind: "web.portal",
          minClientVersion: "0.1.0"
        },
        compiler: {
          version: "portal-default-pack-bridge-v1",
          idempotencyKey: String(idempotencyKey || shortHashId(fileHashes["manual/skill.md"], "idem"))
        }
      };
      if (!force && defaultCompiledPackCache?.manifest?.contentHash === manifest.contentHash && defaultCompiledPackCache?.manifest?.packVersionId === manifest.packVersionId) {
        return defaultCompiledPackCache.manifest;
      }
      await writeWorkspaceText("workspace/heartbeat.md", heartbeatContent);
      await writeWorkspaceText("workspace/tools.md", toolsContent);
      await writeWorkspaceText("workspace/trace_map.json", traceMapContent);
      await writeWorkspaceText(DEFAULT_COMPILED_PACK_MANUAL_PATH, manualContent);
      await writeWorkspaceText(DEFAULT_COMPILED_PACK_HEARTBEAT_PATH, heartbeatContent);
      await writeWorkspaceText(DEFAULT_COMPILED_PACK_TOOLS_PATH, toolsContent);
      await writeWorkspaceText(DEFAULT_COMPILED_PACK_TRACE_MAP_PATH, traceMapContent);
      await writeWorkspaceText(
        DEFAULT_COMPILED_PACK_MANIFEST_PATH,
        `${JSON.stringify(manifest, null, 2)}
`
      );
      defaultCompiledPackCache = {
        manifest,
        fileContents
      };
      return manifest;
    })();
    defaultCompiledPackPromise = compilePromise;
    try {
      return await compilePromise;
    } finally {
      if (defaultCompiledPackPromise === compilePromise) {
        defaultCompiledPackPromise = null;
      }
    }
  }
  async function experienceRunRequest(params = {}) {
    await ensureDefaultSkillPackCompiled({
      idempotencyKey: typeof params?.idempotencyKey === "string" && params.idempotencyKey.trim() ? params.idempotencyKey.trim() : "default-skill-pack-run"
    });
    const requestedTimeoutMs = Number(params?.timeoutMs);
    const timeoutMs = Number.isFinite(requestedTimeoutMs) && requestedTimeoutMs > 0 ? Math.max(1e4, requestedTimeoutMs) : EXPERIENCE_RUN_REQUEST_TIMEOUT_MS;
    const res = await sendWorkerRequest({
      requestType: "gateway.command.experience.run",
      responseType: "worker.experience.run",
      payload: { params },
      timeoutMs
    });
    if (!res?.ok) throw new Error(String(res?.error || "EXPERIENCE_RUN_FAILED"));
    return res.result || null;
  }
  async function visitExperienceRequest({ url } = {}) {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.visit",
      responseType: "worker.visit",
      payload: { url: String(url || "") }
    });
    if (!res?.ok) throw new Error(String(res?.error || "VISIT_FAILED"));
    return res.result || null;
  }
  async function trainerListAttemptsRequest(params = {}) {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.trainer.attempts.list",
      responseType: "worker.trainer.attempts.list",
      payload: { params }
    });
    if (!res?.ok) throw new Error(String(res?.error || "TRAINER_ATTEMPTS_FAILED"));
    return res.result || null;
  }
  async function trainerGetAttemptRequest(params = {}) {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.trainer.attempt.get",
      responseType: "worker.trainer.attempt.get",
      payload: { params }
    });
    if (!res?.ok) throw new Error(String(res?.error || "TRAINER_ATTEMPT_FAILED"));
    return res.result || null;
  }
  async function trainerCompareRequest(params = {}) {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.trainer.compare",
      responseType: "worker.trainer.compare",
      payload: { params }
    });
    if (!res?.ok) throw new Error(String(res?.error || "TRAINER_COMPARE_FAILED"));
    return res.result || null;
  }
  async function trainerListLoadoutsRequest(params = {}) {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.trainer.loadouts.list",
      responseType: "worker.trainer.loadouts.list",
      payload: { params }
    });
    if (!res?.ok) throw new Error(String(res?.error || "TRAINER_LOADOUTS_FAILED"));
    return res.result || null;
  }
  async function trainerActivateLoadoutRequest(params = {}) {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.trainer.loadouts.activate",
      responseType: "worker.trainer.loadouts.activate",
      payload: { params }
    });
    if (!res?.ok) throw new Error(String(res?.error || "TRAINER_LOADOUT_ACTIVATE_FAILED"));
    return res.result || null;
  }
  async function trainerGetCoachingRequest() {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.trainer.coaching.get",
      responseType: "worker.trainer.coaching.get"
    });
    if (!res?.ok) throw new Error(String(res?.error || "TRAINER_COACHING_GET_FAILED"));
    return res.result || null;
  }
  async function trainerSetCoachingRequest(params = {}) {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.trainer.coaching.set",
      responseType: "worker.trainer.coaching.set",
      payload: { params }
    });
    if (!res?.ok) throw new Error(String(res?.error || "TRAINER_COACHING_SET_FAILED"));
    return res.result || null;
  }
  async function trainerBackupExportRequest() {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.trainer.backup.export",
      responseType: "worker.trainer.backup.export",
      timeoutMs: 3e4
    });
    if (!res?.ok) throw new Error(String(res?.error || "TRAINER_BACKUP_EXPORT_FAILED"));
    return res.result || null;
  }
  async function trainerBackupImportRequest(params = {}) {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.trainer.backup.import",
      responseType: "worker.trainer.backup.import",
      payload: { params },
      timeoutMs: 3e4
    });
    if (!res?.ok) throw new Error(String(res?.error || "TRAINER_BACKUP_IMPORT_FAILED"));
    return res.result || null;
  }
  async function permissionPolicyGetRequest() {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.permission.policy.get",
      responseType: "worker.permission.policy.get"
    });
    if (!res?.ok) throw new Error(String(res?.error || "PERMISSION_POLICY_GET_FAILED"));
    return res.result || null;
  }
  async function permissionPolicySetRequest({ manifest = null, source = null } = {}) {
    const payload = {};
    if (manifest && typeof manifest === "object") payload.manifest = manifest;
    if (source && typeof source === "object") payload.source = source;
    const res = await sendWorkerRequest({
      requestType: "gateway.command.permission.policy.set",
      responseType: "worker.permission.policy.set",
      payload
    });
    if (!res?.ok) throw new Error(String(res?.error || "PERMISSION_POLICY_SET_FAILED"));
    return res.result || null;
  }
  async function permissionPolicyClearRequest() {
    const res = await sendWorkerRequest({
      requestType: "gateway.command.permission.policy.clear",
      responseType: "worker.permission.policy.clear"
    });
    if (!res?.ok) throw new Error(String(res?.error || "PERMISSION_POLICY_CLEAR_FAILED"));
    return res.result || null;
  }
  window.__openclawLiteTest = {
    async setLlmConfig(params = {}) {
      const payload = params && typeof params === "object" ? params : {};
      const normalized = {
        apiKey: typeof payload.apiKey === "string" ? payload.apiKey : "",
        api: typeof payload.api === "string" ? payload.api : "",
        provider: typeof payload.provider === "string" ? payload.provider : "",
        modelRef: typeof payload.modelRef === "string" ? payload.modelRef : "",
        modelId: typeof payload.modelId === "string" ? payload.modelId : "",
        baseUrl: typeof payload.baseUrl === "string" ? payload.baseUrl : "",
        reasoning: typeof payload.reasoning === "string" ? payload.reasoning : "",
        useProxy: payload.useProxy !== false
      };
      const matchesExpected = (resultEnvelope) => {
        const applied = resultEnvelope?.data && typeof resultEnvelope.data === "object" ? resultEnvelope.data : {};
        if (normalized.provider && String(applied.provider || "") !== normalized.provider) return false;
        if (normalized.api && String(applied.api || "") !== normalized.api) return false;
        if (normalized.modelRef && String(applied.modelRef || "") !== normalized.modelRef) return false;
        if (normalized.modelId && String(applied.modelId || "") !== normalized.modelId) return false;
        return true;
      };
      let lastResult = null;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const res = await sendWorkerRequest({
          requestType: "gateway.command.setLlmConfig",
          responseType: "worker.llm.config.set",
          payload: normalized
        });
        if (!res?.ok) throw new Error(String(res?.error || "LLM_CONFIG_SET_FAILED"));
        lastResult = res.result || null;
        if (matchesExpected(lastResult)) return lastResult;
        await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
      }
      return lastResult;
    },
    async countCheckpoints() {
      const req = indexedDB.open("openclaw-lite", 1);
      const db = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error("IDB_OPEN_FAILED"));
      });
      const tx = db.transaction(["checkpoints"], "readonly");
      const countReq = tx.objectStore("checkpoints").count();
      const count = await new Promise((resolve, reject) => {
        countReq.onsuccess = () => resolve(countReq.result || 0);
        countReq.onerror = () => reject(countReq.error || new Error("IDB_COUNT_FAILED"));
      });
      await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error("IDB_TX_FAILED"));
      });
      db.close();
      return Number(count) || 0;
    },
    async getToolRegistryInfo() {
      return toolRegistryRequest();
    },
    async runToolSmoke({ count = 5 } = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.smoke",
        responseType: "worker.tools.smoke",
        payload: { count }
      });
      if (!res?.ok) throw new Error(String(res?.error || "TOOLS_SMOKE_FAILED"));
      return res.summary || null;
    },
    async getTranscriptToolStats() {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.transcriptStats",
        responseType: "worker.tools.transcriptStats"
      });
      if (!res?.ok) throw new Error(String(res?.error || "TOOLS_TRANSCRIPT_STATS_FAILED"));
      return res.stats || null;
    },
    async webFetch(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.webFetch",
        responseType: "worker.tools.webFetch",
        payload: { toolName: "web_fetch", params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WEB_FETCH_FAILED"));
      return res.result || null;
    },
    async skillFetch(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.webFetch",
        responseType: "worker.tools.webFetch",
        payload: { toolName: "skill_fetch", params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "SKILL_FETCH_FAILED"));
      return res.result || null;
    },
    async httpRequest(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.httpRequest",
        responseType: "worker.tools.httpRequest",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "HTTP_REQUEST_FAILED"));
      return res.result || null;
    },
    async agentTownCeremonyCommit(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.agentTownCeremonyCommit",
        responseType: "worker.tools.agentTownCeremonyCommit",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "AGENT_TOWN_CEREMONY_COMMIT_FAILED"));
      return res.result || null;
    },
    async agentTownCeremonyReveal(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.agentTownCeremonyReveal",
        responseType: "worker.tools.agentTownCeremonyReveal",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "AGENT_TOWN_CEREMONY_REVEAL_FAILED"));
      return res.result || null;
    },
    async setSecret({ name, value } = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.secrets.set",
        responseType: "worker.secrets.set",
        payload: { params: { name, value } }
      });
      if (!res?.ok) throw new Error(String(res?.error || "SECRET_SET_FAILED"));
      return res.result || null;
    },
    async listSecrets() {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.secrets.list",
        responseType: "worker.secrets.list"
      });
      if (!res?.ok) throw new Error(String(res?.error || "SECRET_LIST_FAILED"));
      return res.result || null;
    },
    async deleteSecret({ name } = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.secrets.delete",
        responseType: "worker.secrets.delete",
        payload: { params: { name } }
      });
      if (!res?.ok) throw new Error(String(res?.error || "SECRET_DELETE_FAILED"));
      return res.result || null;
    },
    async getTranscriptDump() {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.transcriptDump",
        responseType: "worker.tools.transcriptDump"
      });
      if (!res?.ok) throw new Error(String(res?.error || "TRANSCRIPT_DUMP_FAILED"));
      return typeof res.dump === "string" ? res.dump : "";
    },
    async getTranscriptDigestQueue() {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.transcriptDigestQueue",
        responseType: "worker.tools.transcriptDigestQueue"
      });
      if (!res?.ok) throw new Error(String(res?.error || "TRANSCRIPT_DIGEST_QUEUE_FAILED"));
      return Array.isArray(res.queue) ? res.queue : [];
    },
    async clearTranscript(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.transcriptReset",
        responseType: "worker.tools.transcriptReset",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "TRANSCRIPT_RESET_FAILED"));
      return res.result || null;
    },
    async wsOpen(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.ws.open",
        responseType: "worker.tools.ws.open",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WS_OPEN_FAILED"));
      return res.result || null;
    },
    async wsSend(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.ws.send",
        responseType: "worker.tools.ws.send",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WS_SEND_FAILED"));
      return res.result || null;
    },
    async wsRecv(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.ws.recv",
        responseType: "worker.tools.ws.recv",
        payload: { params },
        timeoutMs: Math.max(15e3, Number(params?.waitMs || 0) + 5e3)
      });
      if (!res?.ok) throw new Error(String(res?.error || "WS_RECV_FAILED"));
      return res.result || null;
    },
    async wsClose(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.ws.close",
        responseType: "worker.tools.ws.close",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WS_CLOSE_FAILED"));
      return res.result || null;
    },
    async wsStatus(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.ws.status",
        responseType: "worker.tools.ws.status",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WS_STATUS_FAILED"));
      return res.result || null;
    },
    async workspaceMkdir(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.workspace.mkdir",
        responseType: "worker.workspace.mkdir",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WORKSPACE_MKDIR_FAILED"));
      return res.result || null;
    },
    async workspaceList(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.workspace.list",
        responseType: "worker.workspace.list",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WORKSPACE_LIST_FAILED"));
      return res.result || null;
    },
    async workspaceReadFile(params = {}) {
      return workspaceReadFileRequest(params);
    },
    async workspaceWriteFile(params = {}) {
      return workspaceWriteFileRequest(params);
    },
    async workspaceEditFile(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.workspace.editFile",
        responseType: "worker.workspace.editFile",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WORKSPACE_EDIT_FAILED"));
      return res.result || null;
    },
    async workspaceDelete(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.workspace.delete",
        responseType: "worker.workspace.delete",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WORKSPACE_DELETE_FAILED"));
      return res.result || null;
    },
    async workspaceBootstrap() {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.workspace.bootstrap",
        responseType: "worker.workspace.bootstrap"
      });
      if (!res?.ok) throw new Error(String(res?.error || "WORKSPACE_BOOTSTRAP_FAILED"));
      return res.result || null;
    },
    async workspaceEvents() {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.workspace.events",
        responseType: "worker.workspace.events"
      });
      if (!res?.ok) throw new Error(String(res?.error || "WORKSPACE_EVENTS_FAILED"));
      return res.result || null;
    },
    async walletConnectTool(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.wallet.connect",
        responseType: "worker.tools.wallet.connect",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WALLET_CONNECT_TOOL_FAILED"));
      return res.result || null;
    },
    async walletGetAccountsTool(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.wallet.accounts",
        responseType: "worker.tools.wallet.accounts",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WALLET_ACCOUNTS_TOOL_FAILED"));
      return res.result || null;
    },
    async walletSignMessageTool(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.wallet.signMessage",
        responseType: "worker.tools.wallet.signMessage",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WALLET_SIGN_TOOL_FAILED"));
      return res.result || null;
    },
    async walletSendTransactionTool(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.wallet.sendTransaction",
        responseType: "worker.tools.wallet.sendTransaction",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WALLET_SEND_TX_TOOL_FAILED"));
      return res.result || null;
    },
    async runtimeKeyMaterialStatus() {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.runtime.keyMaterialStatus",
        responseType: "worker.runtime.keyMaterialStatus"
      });
      if (!res?.ok) throw new Error(String(res?.error || "RUNTIME_KEY_STATUS_FAILED"));
      return res.result || null;
    },
    async invokeExperienceTool({ tool, params = {} } = {}) {
      return invokeExperienceTool({
        tool,
        params,
        source: "test"
      });
    },
    async getExperienceToolTrace() {
      return { events: experienceToolTrace.slice() };
    },
    async runtimeSessionContext(params = {}) {
      return runtimeSessionContextRequest(params);
    },
    async compileDefaultSkillPack(params = {}) {
      return await ensureDefaultSkillPackCompiled({
        force: params?.force === true,
        idempotencyKey: typeof params?.idempotencyKey === "string" ? params.idempotencyKey : ""
      });
    },
    async getDefaultCompiledPackManifest() {
      return await readDefaultCompiledPackManifest();
    },
    async skillState() {
      return skillStateRequest();
    },
    async systemPromptPreview() {
      return systemPromptPreviewRequest();
    },
    async webmcpDiscover(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.webmcp.discover",
        responseType: "worker.webmcp.discover",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WEBMCP_DISCOVER_FAILED"));
      return res.result || null;
    },
    async webmcpCall(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.webmcp.call",
        responseType: "worker.webmcp.call",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WEBMCP_CALL_FAILED"));
      return res.result || null;
    },
    async experienceRun(params = {}) {
      return experienceRunRequest(params);
    },
    async visitExperience({ url } = {}) {
      return visitExperienceRequest({ url });
    },
    async trainerListAttempts(params = {}) {
      return trainerListAttemptsRequest(params);
    },
    async trainerGetAttempt(params = {}) {
      return trainerGetAttemptRequest(params);
    },
    async trainerCompare(params = {}) {
      return trainerCompareRequest(params);
    },
    async trainerListLoadouts(params = {}) {
      return trainerListLoadoutsRequest(params);
    },
    async trainerActivateLoadout(params = {}) {
      return trainerActivateLoadoutRequest(params);
    },
    async trainerGetCoaching() {
      return trainerGetCoachingRequest();
    },
    async trainerSetCoaching(params = {}) {
      return trainerSetCoachingRequest(params);
    },
    async trainerBackupExport() {
      return trainerBackupExportRequest();
    },
    async trainerBackupImport(params = {}) {
      return trainerBackupImportRequest(params);
    },
    async getPermissionPolicy() {
      return permissionPolicyGetRequest();
    },
    async setPermissionPolicy({ manifest = null, source = null } = {}) {
      return permissionPolicySetRequest({ manifest, source });
    },
    async clearPermissionPolicy() {
      return permissionPolicyClearRequest();
    },
    async checkOriginAccess({ url, capability = "web_fetch", method = "GET", consume = true } = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.origin.check",
        responseType: "worker.origin.check",
        payload: { url, capability, method, consume }
      });
      if (!res?.ok) throw new Error(String(res?.error || "ORIGIN_CHECK_FAILED"));
      return res.result || null;
    },
    async requestOriginGrant({ url, capability = "web_fetch", scope = "once", methods = null } = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.origin.grant",
        responseType: "worker.origin.grant",
        payload: { url, capability, scope, methods }
      });
      return res || null;
    },
    async revokeOriginGrant({ grantId } = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.origin.revoke",
        responseType: "worker.origin.revoke",
        payload: { grantId }
      });
      return res || null;
    }
  };
  gatewayEvents.skillState = skillStateRequest;
  gatewayEvents.systemPromptPreview = systemPromptPreviewRequest;
  gatewayEvents.runtimeSessionContext = runtimeSessionContextRequest;
  gatewayEvents.experienceRun = experienceRunRequest;
  gatewayEvents.visitExperience = visitExperienceRequest;
  gatewayEvents.trainerListAttempts = trainerListAttemptsRequest;
  gatewayEvents.trainerGetAttempt = trainerGetAttemptRequest;
  gatewayEvents.trainerCompare = trainerCompareRequest;
  gatewayEvents.trainerListLoadouts = trainerListLoadoutsRequest;
  gatewayEvents.trainerActivateLoadout = trainerActivateLoadoutRequest;
  gatewayEvents.trainerGetCoaching = trainerGetCoachingRequest;
  gatewayEvents.trainerSetCoaching = trainerSetCoachingRequest;
  gatewayEvents.trainerBackupExport = trainerBackupExportRequest;
  gatewayEvents.trainerBackupImport = trainerBackupImportRequest;
  gatewayEvents.permissionPolicyGet = permissionPolicyGetRequest;
  gatewayEvents.permissionPolicySet = permissionPolicySetRequest;
  gatewayEvents.permissionPolicyClear = permissionPolicyClearRequest;
  gatewayEvents.invokeExperienceTool = (payload = {}) => invokeExperienceTool({
    tool: payload?.tool,
    params: payload?.params,
    source: "runtime"
  });
  gatewayEvents.getExperienceToolTrace = () => ({ events: experienceToolTrace.slice() });
  gatewayEvents.send = (msg) => {
    if (msg && msg.type === "chat") {
      sendToWorker({
        type: "gateway.chat.send",
        text: String(msg.text || "") || "",
        runtimeContext: msg.runtimeContext || null,
        runtimeState: msg.runtimeState || null
      });
      return;
    }
    if (msg && msg.type === "command" && msg.command === "visit") {
      return sendWorkerRequest({
        requestType: "gateway.command.visit",
        responseType: "worker.visit",
        payload: { url: String(msg.url || "") }
      }).then((res) => {
        if (!res?.ok) throw new Error(String(res?.error || "VISIT_FAILED"));
        if (!res?.result?.ok) {
          const message = String(res?.result?.error?.message || res?.result?.error?.code || "VISIT_FAILED");
          throw new Error(message);
        }
        return res.result;
      });
    }
    sendToWorker(msg);
  };
  return gatewayEvents;
}
var initialization = init();
initialization.catch((e) => {
  console.error(e);
});
var gateway_default = initialization;
export {
  gateway_default as default
};
//# sourceMappingURL=gateway.js.map
