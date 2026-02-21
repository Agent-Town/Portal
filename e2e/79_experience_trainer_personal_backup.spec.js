const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  runExperience,
  openTrainerFromSidebar,
  readMetaValue
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function readDownloadToBuffer(download) {
  const stream = await download.createReadStream();
  if (!stream) throw new Error('DOWNLOAD_STREAM_UNAVAILABLE');
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function clearLocalStores(page) {
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

test('trainer personal backup restores Brain + attempts and excludes krootB64', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);
  await runExperience(page, 'trainer probe: lite echo');

  await page.evaluate(async () => {
    const req = indexedDB.open('openclaw-lite', 1);
    const db = await new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IDB_OPEN_FAILED'));
    });
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'krootB64', value: 'mock-kroot-secret' });
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IDB_TX_FAILED'));
      tx.onabort = () => reject(tx.error || new Error('IDB_TX_ABORTED'));
    });
    db.close();
  });

  await openTrainerFromSidebar(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('trainer-backup-download').click();
  const download = await downloadPromise;
  const backupBytes = await readDownloadToBuffer(download);
  const backup = JSON.parse(backupBytes.toString('utf8'));

  expect(backup?.kind).toBe('agent-town-personal-backup');
  expect(backup?.v).toBe(1);
  const meta = Array.isArray(backup?.stores?.meta) ? backup.stores.meta : [];
  const keys = meta.map((entry) => entry.key);
  expect(keys).toContain('llmApiKey');
  expect(keys).not.toContain('krootB64');

  await clearLocalStores(page);
  await expect.poll(() => readMetaValue(page, 'llmApiKey')).toBeNull();

  await page.getByTestId('trainer-backup-upload').setInputFiles({
    name: 'agent-town-personal-backup.json',
    mimeType: 'application/json',
    buffer: backupBytes
  });

  await expect.poll(() => readMetaValue(page, 'llmApiKey'), { timeout: 8000 }).toBe('trainer-test-key');
  await expect.poll(() => readMetaValue(page, 'krootB64'), { timeout: 8000 }).toBeNull();
  await expect(page.getByTestId('trainer-attempts').getByRole('button').first()).toBeVisible({ timeout: 5000 });
});
