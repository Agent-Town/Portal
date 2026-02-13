const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet, houseAuthHeadersFromKeyB64 } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function reachHouseViaLiteFlow(page) {
  await reachCreateViaLite(page);
  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 15000 });
}

async function ensureWalletConnectedAndUnlock(page) {
  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const walletLabel = (await connectWalletBtn.textContent()) || '';
  if (walletLabel.includes('Connect')) {
    await connectWalletBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();
}

async function writeLocalAgentState(page, { houseId, llmApiKey }) {
  await page.evaluate(async ({ hid, key }) => {
    const openDb = () => new Promise((resolve, reject) => {
      const req = indexedDB.open('openclaw-lite', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('checkpoints')) {
          const s = db.createObjectStore('checkpoints', { keyPath: 'checkpointId' });
          s.createIndex('by_house_createdAtMs', ['houseId', 'createdAtMs'], { unique: false });
        }
        if (!db.objectStoreNames.contains('vfs')) {
          db.createObjectStore('vfs', { keyPath: 'path' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IDB_OPEN_FAILED'));
    });

    const txDone = (tx) => new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IDB_TX_FAILED'));
      tx.onabort = () => reject(tx.error || new Error('IDB_TX_ABORTED'));
    });

    const db = await openDb();
    const tx = db.transaction(['meta', 'vfs', 'checkpoints'], 'readwrite');
    const meta = tx.objectStore('meta');
    const vfs = tx.objectStore('vfs');
    const checkpoints = tx.objectStore('checkpoints');

    meta.put({ key: 'houseId', value: hid });
    meta.put({ key: 'llmApiKey', value: key });
    meta.put({ key: 'llmProvider', value: 'openai' });
    meta.put({ key: 'llmModelRef', value: 'openai/gpt-4o-mini' });
    vfs.put({
      path: 'workspace/AGENTS.md',
      updatedAtMs: Date.now(),
      dataB64: btoa('# Agents\n\nRestored from snapshot.\n')
    });
    checkpoints.put({
      v: 1,
      checkpointId: `cp_${Date.now()}`,
      createdAtMs: Date.now(),
      houseId: hid,
      reason: 'test'
    });
    await txDone(tx);
    db.close();
  }, { hid: houseId, key: llmApiKey });
}

async function clearLocalAgentState(page) {
  await page.evaluate(async () => {
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
    const db = await openDb();
    const tx = db.transaction(['meta', 'vfs', 'checkpoints'], 'readwrite');
    tx.objectStore('meta').clear();
    tx.objectStore('vfs').clear();
    tx.objectStore('checkpoints').clear();
    await txDone(tx);
    db.close();
  });
}

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

test('house backup stores and restores local OpenClaw Lite state including llm oauth token', async ({ page, request }) => {
  await installMockSolanaWallet(page);
  await reachHouseViaLiteFlow(page);

  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBeTruthy();

  await ensureWalletConnectedAndUnlock(page);

  const initialToken = 'oauth-token-initial';
  await writeLocalAgentState(page, { houseId, llmApiKey: initialToken });
  await page.locator('#saveAgentStateBtn').click();
  await expect(page.locator('#agentStateStatus')).toContainText('Saved agent state to house', { timeout: 5000 });

  await clearLocalAgentState(page);
  await expect.poll(() => readLocalMetaValue(page, 'llmApiKey')).toBeNull();

  await page.reload();
  await page.waitForURL(/\/house\?house=/, { timeout: 15000 });
  await ensureWalletConnectedAndUnlock(page);
  await expect.poll(() => readLocalMetaValue(page, 'llmApiKey'), { timeout: 8000 }).toBe(initialToken);

  const replacementToken = 'oauth-token-replacement';
  const replacementSnapshot = {
    v: 1,
    kind: 'openclaw-lite-state',
    schema: 'openclaw-lite-state@1',
    createdAt: new Date().toISOString(),
    stores: {
      meta: [
        { key: 'houseId', value: houseId },
        { key: 'llmApiKey', value: replacementToken },
        { key: 'llmProvider', value: 'openai' },
        { key: 'llmModelRef', value: 'openai/gpt-4o-mini' }
      ],
      vfs: [
        {
          path: 'workspace/AGENTS.md',
          updatedAtMs: Date.now(),
          dataB64: Buffer.from('# Agents\n\nUploaded snapshot.\n', 'utf8').toString('base64')
        }
      ],
      checkpoints: []
    }
  };

  await page.locator('#uploadAgentStateInput').setInputFiles({
    name: 'agent-state.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(replacementSnapshot), 'utf8')
  });
  await expect(page.locator('#agentStateStatus')).toContainText('Uploaded and replaced agent state', { timeout: 5000 });
  await expect.poll(() => readLocalMetaValue(page, 'llmApiKey'), { timeout: 8000 }).toBe(replacementToken);

  const keyB64 = await page.evaluate((id) => sessionStorage.getItem(`agentTownHouseAuth:${id}`), houseId);
  expect(keyB64).toBeTruthy();

  const statePath = `/api/house/${houseId}/agent-state`;
  const headers = houseAuthHeadersFromKeyB64(houseId, 'GET', statePath, '', keyB64);
  const stateResp = await request.get(statePath, { headers });
  expect(stateResp.ok()).toBeTruthy();
  const stateJson = await stateResp.json();
  const llmKeyRecord = (stateJson.agentState?.stores?.meta || []).find((entry) => entry.key === 'llmApiKey');
  expect(llmKeyRecord?.value).toBe(replacementToken);
});
