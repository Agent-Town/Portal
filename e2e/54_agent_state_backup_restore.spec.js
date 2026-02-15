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

async function configureMindFromHouseUi(page, {
  provider = 'openai',
  model = 'gpt-4o-mini',
  authMode = 'api-key',
  credential
}) {
  await page.locator('#llmProviderSelect').selectOption(provider);
  await page.locator('#llmModelIdInput').selectOption(model);
  await page.locator('#llmAuthModeSelect').selectOption(authMode);
  await page.locator('#llmKeyInput').fill(credential);
  await page.locator('#llmSaveBtn').click();
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
    meta.put({ key: 'llmModelId', value: 'gpt-4o-mini' });
    meta.put({ key: 'llmModelRef', value: 'openai/gpt-4o-mini' });
    meta.put({ key: 'llmAuthMode', value: 'api-key' });
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

async function readDownloadToBuffer(download) {
  const stream = await download.createReadStream();
  if (!stream) throw new Error('DOWNLOAD_STREAM_UNAVAILABLE');
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function parseStoredZipEntries(zipBytes) {
  const data = Buffer.isBuffer(zipBytes) ? zipBytes : Buffer.from(zipBytes || []);
  if (data.length < 22) throw new Error('INVALID_ZIP');

  let eocdOffset = -1;
  const minOffset = Math.max(0, data.length - (22 + 0xffff));
  for (let i = data.length - 22; i >= minOffset; i--) {
    if (data.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error('INVALID_ZIP');

  const entryCount = data.readUInt16LE(eocdOffset + 10);
  const centralOffset = data.readUInt32LE(eocdOffset + 16);
  const out = new Map();
  let cursor = centralOffset;

  for (let i = 0; i < entryCount; i++) {
    if (cursor + 46 > data.length || data.readUInt32LE(cursor) !== 0x02014b50) throw new Error('INVALID_ZIP');
    const compression = data.readUInt16LE(cursor + 10);
    const compressedSize = data.readUInt32LE(cursor + 20);
    const uncompressedSize = data.readUInt32LE(cursor + 24);
    const nameLen = data.readUInt16LE(cursor + 28);
    const extraLen = data.readUInt16LE(cursor + 30);
    const commentLen = data.readUInt16LE(cursor + 32);
    const localOffset = data.readUInt32LE(cursor + 42);
    const nameStart = cursor + 46;
    const nameEnd = nameStart + nameLen;
    if (nameEnd > data.length) throw new Error('INVALID_ZIP');

    const name = data.toString('utf8', nameStart, nameEnd);
    if (compression !== 0) throw new Error('UNSUPPORTED_ZIP_COMPRESSION');
    if (localOffset + 30 > data.length || data.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('INVALID_ZIP');
    const localNameLen = data.readUInt16LE(localOffset + 26);
    const localExtraLen = data.readUInt16LE(localOffset + 28);
    const fileStart = localOffset + 30 + localNameLen + localExtraLen;
    const fileEnd = fileStart + compressedSize;
    if (fileEnd > data.length || fileEnd < fileStart) throw new Error('INVALID_ZIP');

    const bytes = data.subarray(fileStart, fileEnd);
    if (bytes.length !== uncompressedSize) throw new Error('INVALID_ZIP');
    out.set(name, Buffer.from(bytes));

    cursor += 46 + nameLen + extraLen + commentLen;
  }

  return out;
}

function parseZipJson(entries, fileName) {
  const bytes = entries.get(fileName);
  if (!bytes) throw new Error(`MISSING_ZIP_ENTRY_${fileName}`);
  return JSON.parse(bytes.toString('utf8'));
}

test('house backup stores encrypted state and supports ZIP download/upload restore', async ({ page, request }) => {
  await installMockSolanaWallet(page);
  await reachHouseViaLiteFlow(page);

  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBeTruthy();

  await ensureWalletConnectedAndUnlock(page);

  const initialToken = 'oauth-token-initial';
  await configureMindFromHouseUi(page, { credential: initialToken });
  await expect.poll(() => readLocalMetaValue(page, 'llmApiKey')).toBe(initialToken);
  await writeLocalAgentState(page, { houseId, llmApiKey: initialToken });
  await page.locator('#saveAgentStateBtn').click();
  await expect(page.locator('#agentStateStatus')).toContainText('Saved encrypted agent state to house', { timeout: 5000 });

  await clearLocalAgentState(page);
  await expect.poll(() => readLocalMetaValue(page, 'llmApiKey')).toBeNull();

  await page.reload();
  await page.waitForURL(/\/house\?house=/, { timeout: 15000 });
  await ensureWalletConnectedAndUnlock(page);
  await expect.poll(() => readLocalMetaValue(page, 'llmApiKey'), { timeout: 8000 }).toBe(initialToken);
  await expect(page.locator('#llmProviderSelect')).toHaveValue('openai');
  await expect(page.locator('#llmModelIdInput')).toHaveValue('gpt-4o-mini');
  await expect(page.locator('#llmKeyInput')).toHaveValue(initialToken);

  const replacementToken = 'oauth-token-replacement';
  await configureMindFromHouseUi(page, { credential: replacementToken });
  await expect.poll(() => readLocalMetaValue(page, 'llmApiKey'), { timeout: 5000 }).toBe(replacementToken);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#downloadAgentStateBtn').click();
  const download = await downloadPromise;
  await expect(page.locator('#agentStateStatus')).toContainText('Downloaded local backup ZIP', { timeout: 5000 });
  expect(download.suggestedFilename()).toMatch(/agent-town-state-.*\.zip$/);
  const zipBytes = await readDownloadToBuffer(download);
  expect(zipBytes.length).toBeGreaterThan(128);

  const zipEntries = parseStoredZipEntries(zipBytes);
  const manifest = parseZipJson(zipEntries, 'agent-state-manifest.json');
  expect(manifest.kind).toBe('openclaw-lite-state-zip');
  expect(manifest.schema).toBe('openclaw-lite-state-zip@1');
  expect(manifest.houseId).toBe(houseId);
  const meta = parseZipJson(zipEntries, 'meta.json');
  const llmMeta = meta.find((entry) => entry && entry.key === 'llmApiKey');
  expect(llmMeta?.value).toBe(replacementToken);
  const vfsIndex = parseZipJson(zipEntries, 'vfs-index.json');
  expect(Array.isArray(vfsIndex)).toBeTruthy();
  expect(vfsIndex.length).toBeGreaterThan(0);
  const firstPath = vfsIndex[0] && vfsIndex[0].path;
  expect(firstPath).toBeTruthy();
  expect(zipEntries.has(`vfs/${firstPath}`)).toBeTruthy();

  await clearLocalAgentState(page);
  await expect.poll(() => readLocalMetaValue(page, 'llmApiKey')).toBeNull();

  await page.locator('#uploadAgentStateInput').setInputFiles({
    name: download.suggestedFilename() || 'agent-state.zip',
    mimeType: 'application/zip',
    buffer: zipBytes
  });
  await expect(page.locator('#agentStateStatus')).toContainText('Uploaded and replaced agent state', { timeout: 5000 });
  await expect.poll(() => readLocalMetaValue(page, 'llmApiKey'), { timeout: 8000 }).toBe(replacementToken);
  await expect(page.locator('#llmKeyInput')).toHaveValue(replacementToken);

  const keyB64 = await page.evaluate((id) => sessionStorage.getItem(`agentTownHouseAuth:${id}`), houseId);
  expect(keyB64).toBeTruthy();

  const statePath = `/api/house/${houseId}/agent-state`;
  const headers = houseAuthHeadersFromKeyB64(houseId, 'GET', statePath, '', keyB64);
  const stateResp = await request.get(statePath, { headers });
  expect(stateResp.ok()).toBeTruthy();
  const stateJson = await stateResp.json();
  expect(stateJson.agentState?.kind).toBe('openclaw-lite-state-sealed');
  expect(stateJson.agentState?.schema).toBe('openclaw-lite-state-sealed@1');
  expect(stateJson.agentState?.houseId).toBe(houseId);
  expect(stateJson.agentState?.ciphertext?.alg).toBe('AES-GCM');
  expect(stateJson.agentState?.ciphertext?.iv).toBeTruthy();
  expect(stateJson.agentState?.ciphertext?.ct).toBeTruthy();
  expect(stateJson.agentState?.stores).toBeUndefined();
});
