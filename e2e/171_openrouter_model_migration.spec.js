const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const CURRENT_OPENROUTER_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('stale openrouter hunter/healer configs migrate to the current live default on load', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(async () => {
    const openRequest = indexedDB.open('openclaw-lite', 1);
    const db = await new Promise((resolve, reject) => {
      openRequest.onupgradeneeded = () => {
        const nextDb = openRequest.result;
        if (!nextDb.objectStoreNames.contains('meta')) {
          nextDb.createObjectStore('meta', { keyPath: 'key' });
        }
      };
      openRequest.onsuccess = () => resolve(openRequest.result);
      openRequest.onerror = () => reject(openRequest.error || new Error('IDB_OPEN_FAILED'));
    });
    const tx = db.transaction(['meta'], 'readwrite');
    const store = tx.objectStore('meta');
    const put = (key, value) => store.put({ key, value });
    put('llmProvider', 'openrouter');
    put('llmModelId', 'openrouter/hunter-alpha');
    put('llmModelRef', 'openrouter/openrouter/hunter-alpha');
    put('llmApiKey', 'or-stale-key');
    put('llmApi', null);
    put('llmBaseUrl', null);
    put('llmUseProxy', true);
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IDB_TX_FAILED'));
      tx.onabort = () => reject(tx.error || new Error('IDB_TX_ABORTED'));
    });
    db.close();
  });

  const loaded = await page.evaluate(async () => {
    const mod = await import('/openclaw-lite/llm-config-library.js');
    return await mod.loadLlmConfig();
  });
  expect(loaded.model).toBe(CURRENT_OPENROUTER_MODEL);
  expect(loaded.modelRef).toBe(`openrouter/${CURRENT_OPENROUTER_MODEL}`);

  const persisted = await page.evaluate(async () => {
    const openRequest = indexedDB.open('openclaw-lite', 1);
    const db = await new Promise((resolve, reject) => {
      openRequest.onupgradeneeded = () => {
        const nextDb = openRequest.result;
        if (!nextDb.objectStoreNames.contains('meta')) {
          nextDb.createObjectStore('meta', { keyPath: 'key' });
        }
      };
      openRequest.onsuccess = () => resolve(openRequest.result);
      openRequest.onerror = () => reject(openRequest.error || new Error('IDB_OPEN_FAILED'));
    });
    const tx = db.transaction(['meta'], 'readonly');
    const store = tx.objectStore('meta');
    const read = (key) => new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.value ?? null);
      req.onerror = () => reject(req.error || new Error('IDB_GET_FAILED'));
    });
    const values = {
      modelId: await read('llmModelId'),
      modelRef: await read('llmModelRef'),
      api: await read('llmApi'),
      baseUrl: await read('llmBaseUrl')
    };
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IDB_TX_FAILED'));
      tx.onabort = () => reject(tx.error || new Error('IDB_TX_ABORTED'));
    });
    db.close();
    return values;
  });

  expect(persisted).toEqual({
    modelId: CURRENT_OPENROUTER_MODEL,
    modelRef: `openrouter/${CURRENT_OPENROUTER_MODEL}`,
    api: 'openai-completions',
    baseUrl: 'https://openrouter.ai/api/v1'
  });
});
