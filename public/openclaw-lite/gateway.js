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
function byId(id) {
  return document.getElementById(id);
}
function appendLine(node, line) {
  if (!node) return;
  const next = `${node.textContent || ""}${node.textContent ? "\n" : ""}${line}`;
  node.textContent = next.slice(-2e4);
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
async function init() {
  const runtimeStatus = byId("runtimeStatus");
  const walletLine = byId("walletLine");
  const houseId = byId("houseId");
  const vaultStatus = byId("vaultStatus");
  const approvals = byId("approvals");
  const runtimeLogs = byId("runtimeLogs");
  const workspaceEvents = byId("workspaceEvents");
  const chatTranscript = byId("chatTranscript");
  const chatInput = byId("chatInput");
  const llmKeyInput = byId("llmKeyInput");
  const llmModelRefInput = byId("llmModelRefInput");
  const llmApiInput = byId("llmApiInput");
  const llmBaseUrlInput = byId("llmBaseUrlInput");
  const llmThinkingInput = byId("llmThinkingInput");
  const llmUseProxyInput = byId("llmUseProxyInput");
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
  const worker = new Worker("/openclaw-lite/worker.js", { type: "module" });
  function sendToWorker(msg) {
    worker.postMessage(msg);
  }
  const testRequests = /* @__PURE__ */ new Map();
  let testReqCounter = 0;
  function nextTestRequestId(prefix = "t") {
    testReqCounter += 1;
    return `${prefix}_${Date.now()}_${testReqCounter}`;
  }
  function sendWorkerRequest({ requestType, responseType, payload, timeoutMs = 1e4 }) {
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
  function setCodexCliMode(enabled) {
    const on = enabled === true;
    sendToWorker({ type: "gateway.command.setRuntimeCaps", codexCli: on });
    if (llmKeyInput) {
      llmKeyInput.disabled = on;
      llmKeyInput.placeholder = on ? "Codex CLI bridge enabled (no API key required)" : "LLM API key (stored locally)";
      if (on) llmKeyInput.value = "";
    }
    if (llmModelRefInput) llmModelRefInput.disabled = on;
    if (llmApiInput) llmApiInput.disabled = on;
    if (llmBaseUrlInput) llmBaseUrlInput.disabled = on;
    if (llmThinkingInput) llmThinkingInput.disabled = on;
    if (llmUseProxyInput) llmUseProxyInput.disabled = on;
    if (llmSaveBtn) llmSaveBtn.disabled = on;
    if (llmLine) llmLine.textContent = on ? "LLM: Codex CLI bridge (local)" : llmLine.textContent;
  }
  async function loadCapabilities() {
    try {
      const res = await fetch("/api/runtime/capabilities", { credentials: "include" });
      const data = await res.json().catch(() => null);
      setCodexCliMode(!!data?.llm?.codexCli);
    } catch {
      setCodexCliMode(false);
    }
  }
  loadCapabilities();
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
  function normalizeThinkingLevel(value) {
    const v = String(value || "").trim().toLowerCase();
    if (!v) return "";
    if (v === "minimal" || v === "low" || v === "medium" || v === "high" || v === "xhigh") return v;
    return "";
  }
  function configureLlm({ apiKey }) {
    const key = String(apiKey || "").trim();
    const modelParsed = parseModelRef(llmModelRefInput?.value || "");
    let api = String(llmApiInput?.value || "").trim();
    const baseOverride = String(llmBaseUrlInput?.value || "").trim();
    const thinking = normalizeThinkingLevel(llmThinkingInput?.value || "");
    const useProxy = llmUseProxyInput ? llmUseProxyInput.checked !== false : true;
    const defaultOpenAiProxyBase = new URL("/api/llm/openai/v1", window.location.origin).toString();
    if (!api && modelParsed.provider === "openai") api = "openai-completions";
    const baseUrl = baseOverride || (modelParsed.provider === "openai" ? defaultOpenAiProxyBase : "");
    sendToWorker({
      type: "gateway.command.setLlmConfig",
      apiKey: key,
      api,
      provider: modelParsed.provider,
      modelRef: modelParsed.modelRef,
      modelId: modelParsed.modelId,
      baseUrl,
      reasoning: thinking,
      useProxy
    });
    if (llmLine) {
      const keyStatus = key ? "key saved" : "missing key";
      llmLine.textContent = `LLM: ${modelParsed.modelRef} (${keyStatus}, proxy=${useProxy ? "on" : "off"}, thinking=${thinking || "default"})`;
    }
  }
  llmSaveBtn?.addEventListener("click", () => {
    configureLlm({ apiKey: llmKeyInput?.value || "" });
  });
  if (llmModelRefInput && !llmModelRefInput.value) llmModelRefInput.value = "openai/gpt-4o-mini";
  if (llmUseProxyInput) llmUseProxyInput.checked = true;
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
      appendLine(chatTranscript, `${role}: ${text}`);
      gatewayEvents.emit("message", { role, text });
      return;
    }
    if (msg.type === "worker.approval.request") {
      const approval = msg.approval || {};
      const id = String(approval.id || "");
      if (!id || !approvals) return;
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
      return;
    }
    if (msg.type === "worker.approval.clear") {
      const id = String(msg.id || "");
      const node = approvalNodes.get(id);
      if (node) node.remove();
      approvalNodes.delete(id);
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
        throw new Error("UNSUPPORTED_WALLET_METHOD");
      } catch (e) {
        sendToWorker({ type: "gateway.wallet.response", id, ok: false, error: e.message || String(e) });
      }
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
  window.__openclawLiteTest = {
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
      const res = await sendWorkerRequest({
        requestType: "gateway.command.tools.registry",
        responseType: "worker.tools.registry"
      });
      if (!res?.ok) throw new Error(String(res?.error || "TOOLS_REGISTRY_FAILED"));
      return res.info || null;
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
      const res = await sendWorkerRequest({
        requestType: "gateway.command.workspace.readFile",
        responseType: "worker.workspace.readFile",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WORKSPACE_READ_FAILED"));
      return res.result || null;
    },
    async workspaceWriteFile(params = {}) {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.workspace.writeFile",
        responseType: "worker.workspace.writeFile",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "WORKSPACE_WRITE_FAILED"));
      return res.result || null;
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
    async runtimeKeyMaterialStatus() {
      const res = await sendWorkerRequest({
        requestType: "gateway.command.runtime.keyMaterialStatus",
        responseType: "worker.runtime.keyMaterialStatus"
      });
      if (!res?.ok) throw new Error(String(res?.error || "RUNTIME_KEY_STATUS_FAILED"));
      return res.result || null;
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
      const res = await sendWorkerRequest({
        requestType: "gateway.command.experience.run",
        responseType: "worker.experience.run",
        payload: { params }
      });
      if (!res?.ok) throw new Error(String(res?.error || "EXPERIENCE_RUN_FAILED"));
      return res.result || null;
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
  gatewayEvents.send = (msg) => {
    if (msg && msg.type === "chat") {
      sendToWorker({ type: "gateway.chat.send", text: String(msg.text || "") || "" });
      return;
    }
    if (msg && msg.type === "command" && msg.command === "visit") {
      console.warn("gateway: visit command not supported by worker, ignoring");
      return;
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
