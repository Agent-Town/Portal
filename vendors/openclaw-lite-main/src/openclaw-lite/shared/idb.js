const DB_NAME = "openclaw-lite";
const DB_VERSION = 1;

export const OPENCLAW_LITE_DB_NAME = DB_NAME;

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IDB_REQUEST_FAILED"));
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IDB_TX_FAILED"));
    tx.onabort = () => reject(tx.error || new Error("IDB_TX_ABORTED"));
  });
}

let dbPromise = null;

export function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains("checkpoints")) {
        const s = db.createObjectStore("checkpoints", { keyPath: "checkpointId" });
        s.createIndex("by_house_createdAtMs", ["houseId", "createdAtMs"], { unique: false });
      }

      if (!db.objectStoreNames.contains("vfs")) {
        db.createObjectStore("vfs", { keyPath: "path" });
      }

      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IDB_OPEN_FAILED"));
  });
  return dbPromise;
}

export async function putRecord(storeName, record) {
  const db = await openDb();
  const tx = db.transaction([storeName], "readwrite");
  tx.objectStore(storeName).put(record);
  await txDone(tx);
}

export async function getRecord(storeName, key) {
  const db = await openDb();
  const tx = db.transaction([storeName], "readonly");
  const req = tx.objectStore(storeName).get(key);
  const res = await reqToPromise(req);
  await txDone(tx);
  return res ?? null;
}

export async function getAllFromIndex(storeName, indexName, query, direction) {
  const db = await openDb();
  const tx = db.transaction([storeName], "readonly");
  const store = tx.objectStore(storeName);
  const index = store.index(indexName);
  const req = index.getAll(query, 10_000);
  const res = await reqToPromise(req);
  await txDone(tx);
  if (!direction) return res;
  if (direction === "desc") {
    return res.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  }
  return res.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
}

export async function deleteByKeys(storeName, keys) {
  const db = await openDb();
  const tx = db.transaction([storeName], "readwrite");
  const store = tx.objectStore(storeName);
  for (const k of keys) store.delete(k);
  await txDone(tx);
}

export async function listCheckpointCountByHouse(houseId) {
  const all = await getAllFromIndex("checkpoints", "by_house_createdAtMs", IDBKeyRange.bound([houseId, 0], [houseId, 9e15]));
  return all.length;
}

