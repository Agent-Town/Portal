const { test, expect } = require('@playwright/test');
const { enterHatch, completeHatch, configureLiteLlm, fetchSessionState, ensureBrainPanelVisible } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function readLocalMetaValue(page, key) {
  return page.evaluate(async (lookupKey) => {
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
    const req = tx.objectStore('meta').get(String(lookupKey || ''));
    const rec = await reqToPromise(req);
    await txDone(tx);
    db.close();
    return rec ? rec.value : null;
  }, key);
}

test('vendor runtime uses local-only LLM config without server runtime boot state', async ({ page }) => {
  await enterHatch(page, 'signin');
  await completeHatch(page);
  await ensureBrainPanelVisible(page);

  await expect(page.getByTestId('lite-llm-panel')).toBeVisible({ timeout: 2000 });
  await expect.poll(async () => {
    const state = await fetchSessionState(page);
    return !!state?.agent?.connected;
  }, { timeout: 3000 }).toBe(false);

  const before = await fetchSessionState(page);
  expect(before.lite).toBeTruthy();
  expect(before.lite.driver).toBe('vendor');
  expect(before.lite.llmConfigured).toBe(false);

  await configureLiteLlm(page, {
    provider: 'test-local',
    model: 'deterministic',
    apiKey: 'phase2-test-key'
  });

  await expect.poll(async () => {
    const state = await fetchSessionState(page);
    return !!state?.agent?.connected;
  }, { timeout: 10000 }).toBe(true);

  const state = await fetchSessionState(page);
  expect(state.lite).toBeTruthy();
  expect(state.lite.driver).toBe('vendor');
  // Server only tracks that brain is configured — no provider/model/key details.
  expect(state.lite.llmConfigured).toBe(true);
  expect(state.lite.llmProvider).toBeUndefined();
  expect(state.lite.llmModel).toBeUndefined();
  expect(state.lite.runtimeReady).toBe(false);
  expect(state.lite.runtimeVersion ?? null).toBeNull();
  expect(state.lite.lastError ?? null).toBeNull();
  // LLM details stay browser-local only.
  await expect.poll(() => readLocalMetaValue(page, 'llmProvider')).toBe('test-local');
  await expect.poll(() => readLocalMetaValue(page, 'llmModelId')).toBe('deterministic');
  // API key must never appear in server-side state.
  expect(JSON.stringify(state)).not.toContain('phase2-test-key');
});
