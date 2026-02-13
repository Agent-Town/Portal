import { b64ToBytes, bytesToB64, utf8ToBytes } from "./encoding.js";
import { getRecord, openDb, putRecord } from "./idb.js";

export async function vfsPutBytes(filePath, bytes) {
  const rec = {
    path: String(filePath),
    updatedAtMs: Date.now(),
    dataB64: bytesToB64(bytes),
  };
  await putRecord("vfs", rec);
}

export async function vfsPutUtf8(filePath, text) {
  await vfsPutBytes(filePath, utf8ToBytes(text));
}

export async function vfsGetBytes(filePath) {
  const rec = await getRecord("vfs", String(filePath));
  if (!rec || typeof rec.dataB64 !== "string") return null;
  return b64ToBytes(rec.dataB64);
}

export async function vfsGetUtf8(filePath) {
  const bytes = await vfsGetBytes(filePath);
  if (!bytes) return null;
  return new TextDecoder().decode(bytes);
}

export async function vfsListPaths(prefix = "") {
  const db = await openDb();
  const tx = db.transaction(["vfs"], "readonly");
  const store = tx.objectStore("vfs");
  const req = store.getAll();
  const all = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error || new Error("IDB_LIST_FAILED"));
  });
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IDB_TX_FAILED"));
  });
  const p = String(prefix || "");
  return all
    .map((r) => (r && typeof r.path === "string" ? r.path : null))
    .filter((x) => typeof x === "string" && (!p || x.startsWith(p)));
}

export async function vfsReadAllBytes(prefix = "") {
  const db = await openDb();
  const tx = db.transaction(["vfs"], "readonly");
  const store = tx.objectStore("vfs");
  const req = store.getAll();
  const all = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error || new Error("IDB_LIST_FAILED"));
  });
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IDB_TX_FAILED"));
  });
  const p = String(prefix || "");
  /** @type {Record<string, Uint8Array>} */
  const out = {};
  for (const rec of all) {
    if (!rec || typeof rec.path !== "string") continue;
    if (p && !rec.path.startsWith(p)) continue;
    if (typeof rec.dataB64 !== "string") continue;
    out[rec.path] = b64ToBytes(rec.dataB64);
  }
  return out;
}

