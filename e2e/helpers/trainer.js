const { ensureAppShell, configureLiteLlm } = require('./phase2');

const TRAINER_QUEST_ID = 'portal_onboarding_v1';
const TRAINER_ROOT = `lite/experience-trainer/v1/quests/${TRAINER_QUEST_ID}`;

async function waitForLiteApi(page, timeout = 10000) {
  await page.waitForFunction(() => !!window.__openclawLiteTest, null, { timeout });
}

async function waitForRuntimeSessionContext(page, timeout = 15000) {
  await waitForLiteApi(page, timeout);
  const deadlineAt = Date.now() + Math.max(1000, Number(timeout) || 15000);
  let lastSessionId = '';
  while (Date.now() < deadlineAt) {
    const snapshot = await page.evaluate(async () => {
      try {
        if (typeof window.bootstrapVendorRuntime === 'function') {
          await window.bootstrapVendorRuntime().catch(() => null);
        }
        if (typeof window.connectLiteAgent === 'function') {
          await window.connectLiteAgent().catch(() => null);
        }
        if (!window.__openclawLiteTest || typeof window.__openclawLiteTest.runtimeSessionContext !== 'function') {
          return { ok: false, sessionId: '' };
        }
        const envelope = await window.__openclawLiteTest.runtimeSessionContext({
          runtimeContext: {
            origin: window.location.origin,
            teamCode: '',
            houseId: '',
          },
          runtimeState: {},
        }).catch(() => null);
        const data = envelope?.data || envelope || null;
        const sessionId = String(data?.sessionId || '').trim();
        return {
          ok: sessionId.length > 0,
          sessionId,
        };
      } catch {
        return { ok: false, sessionId: '' };
      }
    }).catch(() => ({ ok: false, sessionId: '' }));
    lastSessionId = String(snapshot?.sessionId || '').trim();
    if (snapshot?.ok && lastSessionId) {
      return lastSessionId;
    }
    await page.waitForTimeout(250);
  }
  throw new Error(`RUNTIME_SESSION_CONTEXT_TIMEOUT:${lastSessionId}`);
}

async function gotoAppWithLite(page, options = {}) {
  await page.goto('/');
  if (Object.prototype.hasOwnProperty.call(options || {}, 'trainerNamespace')) {
    await page.evaluate((enabled) => {
      try {
        localStorage.setItem('agentTown:feature:trainerNamespace', enabled ? '1' : '0');
      } catch {
        // ignore storage failures in tests
      }
    }, options?.trainerNamespace ? '1' : '0');
  }
  await ensureAppShell(page, { navigate: false });
  await waitForLiteApi(page);
}

async function setDeterministicLlm(page) {
  await waitForRuntimeSessionContext(page, 4000).catch(() => null);
  await configureLiteLlm(page, {
    provider: 'test-local',
    model: 'deterministic',
    apiKey: 'trainer-test-key',
  });
}

async function visitSkill(page, url = '/skill.md') {
  const visit = await page.evaluate(async (visitUrl) => {
    return await window.__openclawLiteTest.visitExperience({ url: visitUrl });
  }, url);
  const visitData = visit?.data && typeof visit.data === 'object' ? visit.data : {};
  const expectedActiveSkillPath = typeof visitData.activeSkillPath === 'string' ? visitData.activeSkillPath.trim() : '';
  const expectedImportedPaths = Array.isArray(visitData.importedPaths)
    ? visitData.importedPaths.map((path) => String(path || '').trim()).filter(Boolean)
    : [];

  if (expectedActiveSkillPath) {
    await page.waitForFunction(async ({ activeSkillPath, importedPaths }) => {
      const api = window.__openclawLiteTest;
      if (!api || typeof api.skillState !== 'function') return false;
      const envelope = await api.skillState().catch(() => null);
      const state = envelope?.data && typeof envelope.data === 'object' ? envelope.data : envelope || {};
      const currentActiveSkillPath = typeof state?.activeSkillPath === 'string' ? state.activeSkillPath.trim() : '';
      if (currentActiveSkillPath !== activeSkillPath) return false;
      const currentImportedPaths = Array.isArray(state?.importedPaths)
        ? state.importedPaths.map((path) => String(path || '').trim()).filter(Boolean)
        : [];
      return importedPaths.every((path) => currentImportedPaths.includes(path));
    }, {
      activeSkillPath: expectedActiveSkillPath,
      importedPaths: expectedImportedPaths
    }, { timeout: 10000 });
  }

  return visit;
}

async function runExperience(page, prompt = 'trainer probe: lite echo') {
  return await page.evaluate(async (stepPrompt) => {
    return await window.__openclawLiteTest.experienceRun({
      prompt: String(stepPrompt || ''),
      emitChat: false,
      recordToTranscript: true
    });
  }, prompt);
}

async function openTrainerFromSidebar(page) {
  const sidebar = page.locator('#agentSidebar');
  const minimized = await sidebar.evaluate((node) => node.classList.contains('minimized'));
  if (minimized) {
    await page.locator('#agentSidebar .sidebar-header').click();
  }
  await page.evaluate(async () => {
    if (typeof window.openExperienceTrainerModal === 'function') {
      await window.openExperienceTrainerModal();
      return;
    }
    const button = document.querySelector('[data-testid="agent-open-trainer"]');
    if (button instanceof HTMLElement) button.click();
  });
  await page.getByTestId('trainer-modal').waitFor({ state: 'visible', timeout: 5000 });
  await page.getByTestId('trainer-root').waitFor({ state: 'visible', timeout: 5000 });
}

async function openTrainerToolsTab(page) {
  await page.getByTestId('trainer-tab-tools').click();
  await page.getByTestId('trainer-tool-name').waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForFunction(() => {
    const select = document.getElementById('trainerToolNameSelect');
    return !!select && Array.from(select.options || []).some((option) => String(option.value || '').trim().length > 0);
  }, null, { timeout: 5000 });
}

async function listTrainerToolNames(page) {
  return await page.evaluate(() => {
    const select = document.getElementById('trainerToolNameSelect');
    if (!select) return [];
    return Array.from(select.options || [])
      .map((option) => String(option.value || '').trim())
      .filter(Boolean);
  });
}

async function readVfsText(page, path) {
  return await page.evaluate(async (targetPath) => {
    const openDb = () => new Promise((resolve, reject) => {
      const req = indexedDB.open('openclaw-lite', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('checkpoints')) {
          const s = db.createObjectStore('checkpoints', { keyPath: 'checkpointId' });
          s.createIndex('by_house_createdAtMs', ['houseId', 'createdAtMs'], { unique: false });
        }
        if (!db.objectStoreNames.contains('vfs')) db.createObjectStore('vfs', { keyPath: 'path' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IDB_OPEN_FAILED'));
    });
    const txDone = (tx) => new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IDB_TX_FAILED'));
      tx.onabort = () => reject(tx.error || new Error('IDB_TX_ABORTED'));
    });
    const reqToPromise = (req) => new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('IDB_REQUEST_FAILED'));
    });
    const decode = (b64) => {
      const bin = atob(String(b64 || ''));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    };
    const db = await openDb();
    const tx = db.transaction(['vfs'], 'readonly');
    const rec = await reqToPromise(tx.objectStore('vfs').get(String(targetPath || '')));
    await txDone(tx);
    db.close();
    if (!rec || typeof rec.dataB64 !== 'string') return null;
    return decode(rec.dataB64);
  }, path);
}

async function listVfsPaths(page, prefix) {
  return await page.evaluate(async (pathPrefix) => {
    const openDb = () => new Promise((resolve, reject) => {
      const req = indexedDB.open('openclaw-lite', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('checkpoints')) {
          const s = db.createObjectStore('checkpoints', { keyPath: 'checkpointId' });
          s.createIndex('by_house_createdAtMs', ['houseId', 'createdAtMs'], { unique: false });
        }
        if (!db.objectStoreNames.contains('vfs')) db.createObjectStore('vfs', { keyPath: 'path' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IDB_OPEN_FAILED'));
    });
    const txDone = (tx) => new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IDB_TX_FAILED'));
      tx.onabort = () => reject(tx.error || new Error('IDB_TX_ABORTED'));
    });
    const reqToPromise = (req) => new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('IDB_REQUEST_FAILED'));
    });
    const db = await openDb();
    const tx = db.transaction(['vfs'], 'readonly');
    const rows = await reqToPromise(tx.objectStore('vfs').getAll());
    await txDone(tx);
    db.close();
    return (Array.isArray(rows) ? rows : [])
      .map((row) => (row && typeof row.path === 'string' ? row.path : ''))
      .filter((path) => path.startsWith(String(pathPrefix || '')))
      .sort();
  }, prefix);
}

async function listTrainerAttemptIds(page) {
  const paths = await listVfsPaths(page, `${TRAINER_ROOT}/attempts/`);
  return paths
    .filter((path) => path.endsWith('/manifest.json'))
    .map((path) => {
      const parts = String(path || '').split('/');
      return parts.length >= 2 ? parts[parts.length - 2] : '';
    })
    .filter(Boolean);
}

async function readTrainerManifest(page, attemptId) {
  const raw = await readVfsText(page, `${TRAINER_ROOT}/attempts/${attemptId}/manifest.json`);
  return raw ? JSON.parse(raw) : null;
}

async function readTrainerEvents(page, attemptId) {
  const raw = await readVfsText(page, `${TRAINER_ROOT}/attempts/${attemptId}/events.jsonl`);
  const lines = String(raw || '').split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.map((line) => JSON.parse(line));
}

async function clearOpenClawDb(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('openclaw-lite');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });
}

async function readMetaValue(page, key) {
  return await page.evaluate(async (lookupKey) => {
    const openDb = () => new Promise((resolve, reject) => {
      const req = indexedDB.open('openclaw-lite', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('checkpoints')) {
          const s = db.createObjectStore('checkpoints', { keyPath: 'checkpointId' });
          s.createIndex('by_house_createdAtMs', ['houseId', 'createdAtMs'], { unique: false });
        }
        if (!db.objectStoreNames.contains('vfs')) db.createObjectStore('vfs', { keyPath: 'path' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IDB_OPEN_FAILED'));
    });
    const txDone = (tx) => new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IDB_TX_FAILED'));
      tx.onabort = () => reject(tx.error || new Error('IDB_TX_ABORTED'));
    });
    const reqToPromise = (req) => new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('IDB_REQUEST_FAILED'));
    });
    const db = await openDb();
    const tx = db.transaction(['meta'], 'readonly');
    const rec = await reqToPromise(tx.objectStore('meta').get(String(lookupKey || '')));
    await txDone(tx);
    db.close();
    return rec ? rec.value : null;
  }, key);
}

module.exports = {
  TRAINER_QUEST_ID,
  TRAINER_ROOT,
  waitForLiteApi,
  waitForRuntimeSessionContext,
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  runExperience,
  openTrainerFromSidebar,
  openTrainerToolsTab,
  listTrainerToolNames,
  listTrainerAttemptIds,
  readTrainerManifest,
  readTrainerEvents,
  readVfsText,
  clearOpenClawDb,
  readMetaValue
};
