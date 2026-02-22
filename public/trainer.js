(() => {
  const QUEST_ID = "portal_onboarding_v1";
  const RUN_PROMPT = "trainer probe: lite echo";
  const BACKUP_FILENAME = "agent-town-personal-backup.json";
  const TRAINER_ROOT = `lite/experience-trainer/v1/quests/${QUEST_ID}`;
  const TRAINER_ATTEMPTS_ROOT = `${TRAINER_ROOT}/attempts`;

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

  async function deleteAttemptTrace(attemptId) {
    const key = String(attemptId || "").trim();
    if (!key) return;
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
    await render();
    if (deletedFiles > 0) {
      setStatus(`Deleted trace for ${key}.`);
      return;
    }
    setStatus(`No trace found for ${key}.`);
  }

  async function clearAllAttemptTraces() {
    const attemptCount = state.attempts.length;
    if (!attemptCount) {
      setStatus("No attempts to clear.");
      return;
    }
    await deleteVfsByPrefix(`${TRAINER_ATTEMPTS_ROOT}/`);
    state.selectedAttemptId = null;
    state.selectedEventSeq = null;
    state.attemptBundles.clear();
    state.receiptCache.clear();
    await refreshAttempts();
    await refreshBackupCache().catch(() => {});
    await render();
    setStatus(`Cleared ${attemptCount} attempt(s).`);
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
      remove.title = `Delete trace ${attempt.attemptId || ""}`;
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

  async function render() {
    renderAttempts();
    await renderTimeline();
    await renderInspector();
    renderCompare();
    renderLoadouts();
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
    await render();
    setStatus(`Completed ${total} attempt(s).`);
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
    await render();
    setStatus("Backup restored.");
  }

  function bindUi() {
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
    await syncCoachingUi();
    await refreshAttempts();
    await refreshBackupCache().catch(() => {});
    await render();
    if (!state.attempts.length) {
      setStatus("No attempts captured yet. Run the experience once to begin.");
    } else {
      setStatus(`Loaded ${state.attempts.length} attempt(s).`);
    }
  }

  boot().catch((err) => {
    setStatus(`Trainer failed to initialize: ${err?.message || "UNKNOWN"}`, true);
  });
})();
