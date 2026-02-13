(function initOpenClawLiteRuntimeBridge(global) {
  const state = {
    driver: 'vendor',
    teamCode: '',
    manifest: null,
    worker: null,
    pending: new Map(),
    seq: 0,
    initPromise: null,
    ready: false
  };

  function nextRequestId() {
    state.seq += 1;
    return `lite_${Date.now()}_${state.seq}`;
  }

  function clearPending(reason) {
    for (const [requestId, entry] of state.pending.entries()) {
      clearTimeout(entry.timeoutId);
      entry.reject(new Error(reason || 'RUNTIME_DISCONNECTED'));
      state.pending.delete(requestId);
    }
  }

  async function fetchManifest() {
    const resp = await fetch('/openclaw-lite/manifest.json', {
      credentials: 'include',
      cache: 'no-store'
    });
    if (!resp.ok) throw new Error(`MANIFEST_HTTP_${resp.status}`);
    return resp.json();
  }

  function ensureWorker(workerPath) {
    if (state.worker) return state.worker;
    const worker = new Worker(workerPath, { type: 'module' });
    worker.addEventListener('message', (event) => {
      const msg = event?.data || {};
      const requestId = typeof msg.requestId === 'string' ? msg.requestId : '';
      if (!requestId) return;
      const pending = state.pending.get(requestId);
      if (!pending) return;
      clearTimeout(pending.timeoutId);
      state.pending.delete(requestId);
      if (msg.ok) {
        pending.resolve(msg.result);
      } else {
        pending.reject(new Error(String(msg.error || 'RUNTIME_COMMAND_FAILED')));
      }
    });
    worker.addEventListener('error', () => {
      state.ready = false;
      clearPending('RUNTIME_WORKER_FAILED');
    });
    state.worker = worker;
    return worker;
  }

  function request(command, payload = {}, timeoutMs = 4_000) {
    if (!state.worker) return Promise.reject(new Error('RUNTIME_NOT_INITIALIZED'));
    const requestId = nextRequestId();
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        state.pending.delete(requestId);
        reject(new Error('RUNTIME_TIMEOUT'));
      }, timeoutMs);
      state.pending.set(requestId, { resolve, reject, timeoutId });
      state.worker.postMessage({
        requestId,
        command,
        payload
      });
    });
  }

  async function bootstrapWorker() {
    if (state.driver !== 'vendor') return { ok: true, driver: state.driver };
    if (state.ready) return { ok: true, driver: state.driver, manifest: state.manifest };
    if (state.initPromise) return state.initPromise;

    state.initPromise = (async () => {
      state.manifest = await fetchManifest();
      const workerPath = String(state.manifest?.entrypoints?.worker || '/openclaw-lite/worker.js');
      ensureWorker(workerPath);
      await request('bootstrap', { teamCode: state.teamCode }, 5_000);
      state.ready = true;
      return {
        ok: true,
        driver: state.driver,
        manifest: state.manifest
      };
    })();

    try {
      return await state.initPromise;
    } finally {
      state.initPromise = null;
    }
  }

  async function init({ driver, teamCode } = {}) {
    if (driver) state.driver = String(driver);
    if (teamCode) state.teamCode = String(teamCode);
    return bootstrapWorker();
  }

  async function selectSigil({ elementId, teamCode } = {}) {
    if (teamCode) state.teamCode = String(teamCode);
    if (state.driver !== 'vendor') return null;
    await bootstrapWorker();
    return request('agentSelect', { teamCode: state.teamCode, elementId });
  }

  async function pressOpen({ teamCode } = {}) {
    if (teamCode) state.teamCode = String(teamCode);
    if (state.driver !== 'vendor') return null;
    await bootstrapWorker();
    return request('agentOpenPress', { teamCode: state.teamCode });
  }

  async function contributeCanvas({ humanX, humanY, humanColor, teamCode } = {}) {
    if (teamCode) state.teamCode = String(teamCode);
    if (state.driver !== 'vendor') return { paint: null };
    await bootstrapWorker();
    return request('canvasContribute', {
      teamCode: state.teamCode,
      humanX,
      humanY,
      humanColor
    });
  }

  async function ceremonyCommit({ teamCode } = {}) {
    if (teamCode) state.teamCode = String(teamCode);
    if (state.driver !== 'vendor') return null;
    await bootstrapWorker();
    return request('ceremonyCommit', { teamCode: state.teamCode }, 8_000);
  }

  async function ceremonyReveal({ humanRevealPub, teamCode } = {}) {
    if (teamCode) state.teamCode = String(teamCode);
    if (state.driver !== 'vendor') return null;
    await bootstrapWorker();
    return request(
      'ceremonyReveal',
      {
        teamCode: state.teamCode,
        humanRevealPub
      },
      8_000
    );
  }

  async function setLlmConfig({ provider, model } = {}) {
    if (state.driver !== 'vendor') return { ok: true };
    await bootstrapWorker();
    return request('setLlmConfig', { provider, model });
  }

  async function resetCeremony() {
    if (state.driver !== 'vendor') return { ok: true };
    await bootstrapWorker();
    return request('ceremonyReset');
  }

  function dispose() {
    if (state.worker) {
      state.worker.terminate();
      state.worker = null;
    }
    state.ready = false;
    clearPending('RUNTIME_DISPOSED');
  }

  global.OpenClawLiteRuntimeBridge = {
    init,
    dispose,
    selectSigil,
    pressOpen,
    contributeCanvas,
    ceremonyCommit,
    ceremonyReveal,
    setLlmConfig,
    resetCeremony
  };
})(window);
