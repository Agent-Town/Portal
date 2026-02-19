/* eslint-disable no-console */

function el(id) {
  return document.getElementById(id);
}

function setStatus(msg) {
  const node = el("status");
  if (node) node.textContent = msg || "";
}

function setError(msg) {
  const node = el("error");
  if (node) node.textContent = msg || "";
}

function b64ToBytes(str) {
  const bin = atob(String(str || ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function normalizeBytes(x) {
  if (x instanceof Uint8Array) return x;
  if (x instanceof ArrayBuffer) return new Uint8Array(x);
  if (ArrayBuffer.isView(x)) return new Uint8Array(x.buffer);
  if (Array.isArray(x)) return new Uint8Array(x);
  return null;
}

async function apiJson(url, opts = {}) {
  const res = await fetch(url, {
    credentials: "include",
    ...opts,
    headers: {
      "content-type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP_${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// --- base58 (minimal) ---
function base58Encode(bytes) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let x = BigInt(
    "0x" +
      Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""),
  );
  let out = "";
  while (x > 0n) {
    const mod = x % 58n;
    out = alphabet[Number(mod)] + out;
    x = x / 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out = "1" + out;
  return out || "1";
}

// --- crypto helpers ---
async function sha256(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(digest);
}

async function hkdfSha256(ikmBytes, infoStr, lengthBytes) {
  const info = new TextEncoder().encode(String(infoStr || ""));
  const salt = new Uint8Array([]);
  const baseKey = await crypto.subtle.importKey("raw", ikmBytes, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    baseKey,
    lengthBytes * 8,
  );
  return new Uint8Array(bits);
}

async function aesGcmDecryptRaw(keyBytes, ivBytes, ctBytes, aadBytes) {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes, additionalData: aadBytes || new Uint8Array([]) },
    key,
    ctBytes,
  );
  return new Uint8Array(pt);
}

async function hmacSha256B64(key, messageStr) {
  const msgBytes = new TextEncoder().encode(String(messageStr || ""));
  const sig = await crypto.subtle.sign("HMAC", key, msgBytes);
  return bytesToB64(new Uint8Array(sig));
}

async function sha256B64FromUtf8(str) {
  const bytes = new TextEncoder().encode(String(str || ""));
  const digest = await sha256(bytes);
  return bytesToB64(digest);
}

// --- wallet ---
function getSolanaProvider() {
  const provider = window.solana;
  if (!provider || typeof provider.connect !== "function") throw new Error("NO_SOLANA_WALLET");
  if (typeof provider.signMessage !== "function") throw new Error("NO_SOLANA_SIGN");
  return provider;
}

let walletAddr = null;

async function connectWallet({ silent = false } = {}) {
  const provider = getSolanaProvider();
  const resp = await provider.connect(silent ? { onlyIfTrusted: true } : undefined);
  const pk = resp?.publicKey || provider.publicKey;
  const address = pk && typeof pk.toString === "function" ? pk.toString() : "";
  if (!address) throw new Error("WALLET_CONNECT_FAILED");
  walletAddr = address;
  return walletAddr;
}

async function signMessageBytes(messageStr) {
  const provider = getSolanaProvider();
  if (!walletAddr) await connectWallet({ silent: true });
  if (!walletAddr) throw new Error("WALLET_NOT_CONNECTED");
  const msgBytes = new TextEncoder().encode(String(messageStr || ""));
  const resp = await provider.signMessage(msgBytes);
  const sig = normalizeBytes(resp?.signature ?? resp);
  if (!sig || sig.length !== 64) throw new Error("SIGNATURE_FORMAT");
  return sig;
}

function buildWalletLookupMessage({ address, nonce, houseId }) {
  const parts = ["ElizaTown House Lookup", `address: ${address}`, `nonce: ${nonce}`];
  if (houseId) parts.push(`houseId: ${houseId}`);
  return parts.join("\n");
}

function buildHouseKeyWrapMessage({ houseId, origin = null }) {
  const parts = ["ElizaTown House Key Wrap", `houseId: ${houseId}`];
  if (origin) parts.push(`origin: ${origin}`);
  return parts.join("\n");
}

function buildUnlockMessage({ housePubKey, nonce, origin }) {
  return ["ElizaTown House Unlock", `housePubKey: ${housePubKey}`, `origin: ${origin}`, `nonce: ${nonce}`].join(
    "\n",
  );
}

// --- house auth ---
let KencKey = null;
let KauthKey = null;
let currentHouseId = null;

async function houseAuthHeaders({ houseId, method, urlPath, body }) {
  if (!KauthKey) throw new Error("HOUSE_AUTH_NOT_READY");
  const ts = String(Date.now());
  const bodyHash = await sha256B64FromUtf8(body || "");
  const msg = `${houseId}.${ts}.${method}.${urlPath}.${bodyHash}`;
  const auth = await hmacSha256B64(KauthKey, msg);
  return { "x-house-ts": ts, "x-house-auth": auth };
}

async function houseApiJson(houseId, url, opts = {}) {
  const method = String(opts.method || "GET").toUpperCase();
  const body = typeof opts.body === "string" ? opts.body : "";
  const urlPath = new URL(url, window.location.origin).pathname;
  const headers = await houseAuthHeaders({ houseId, method, urlPath, body });
  return apiJson(url, { ...opts, headers: { ...(opts.headers || {}), ...headers } });
}

async function decryptKrootFromKeyWrap({ houseId, keyWrap }) {
  if (!keyWrap || keyWrap.alg !== "AES-GCM" || typeof keyWrap.iv !== "string" || typeof keyWrap.ct !== "string") {
    throw new Error("MISSING_KEY_WRAP");
  }

  const iv = b64ToBytes(keyWrap.iv);
  const ct = b64ToBytes(keyWrap.ct);

  const attempts = [];
  attempts.push(buildHouseKeyWrapMessage({ houseId })); // legacy (no origin)

  const origin = window.location.origin;
  if (origin) {
    attempts.push(buildHouseKeyWrapMessage({ houseId, origin }));
    const u = new URL(origin);
    const portSuffix = u.port ? `:${u.port}` : "";
    if (u.hostname === "localhost") {
      attempts.push(buildHouseKeyWrapMessage({ houseId, origin: `${u.protocol}//127.0.0.1${portSuffix}` }));
    } else if (u.hostname === "127.0.0.1") {
      attempts.push(buildHouseKeyWrapMessage({ houseId, origin: `${u.protocol}//localhost${portSuffix}` }));
    }
  }

  let lastErr = null;
  for (const msg of attempts) {
    try {
      const sig = await signMessageBytes(msg);
      const wrapKeyBytes = await sha256(sig);
      const kroot = await aesGcmDecryptRaw(wrapKeyBytes, iv, ct);
      const derivedHouseId = base58Encode(await sha256(kroot));
      if (derivedHouseId !== houseId) throw new Error("HOUSE_ID_MISMATCH");
      return kroot;
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(lastErr?.message || "KEY_WRAP_DECRYPT_FAILED");
}

async function initKeysFromKroot({ houseId, krootBytes }) {
  const kencBytes = await hkdfSha256(krootBytes, "elizatown-house-enc-v1", 32);
  const kauthBytes = await hkdfSha256(krootBytes, "elizatown-house-auth-v1", 32);
  KencKey = await crypto.subtle.importKey("raw", kencBytes, { name: "AES-GCM" }, false, ["decrypt"]);
  KauthKey = await crypto.subtle.importKey("raw", kauthBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  currentHouseId = houseId;
}

async function refreshEntries() {
  if (!currentHouseId || !KencKey) return;
  const data = await houseApiJson(currentHouseId, `/api/house/${encodeURIComponent(currentHouseId)}/log`);
  const aad = new TextEncoder().encode(`house=${currentHouseId}`);
  const lines = [];

  for (const entry of Array.isArray(data?.entries) ? data.entries : []) {
    try {
      const iv = b64ToBytes(entry?.ciphertext?.iv || "");
      const ct = b64ToBytes(entry?.ciphertext?.ct || "");
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: aad }, KencKey, ct);
      const obj = JSON.parse(new TextDecoder().decode(new Uint8Array(pt)));
      const bodyText = obj?.body?.text ?? (obj?.body ? JSON.stringify(obj.body) : "");
      lines.push(`${obj?.type || "entry"}: ${String(bodyText || "")}`);
    } catch (e) {
      lines.push(`[decrypt failed] ${e.message || String(e)}`);
    }
  }

  const node = el("entries");
  if (node) node.textContent = lines.join("\n");
}

async function unlockHouse(houseId) {
  if (!houseId) throw new Error("MISSING_HOUSE_ID");
  if (!walletAddr) await connectWallet();

  setStatus("Looking up house...");
  const nonceResp = await apiJson("/api/wallet/nonce");
  const lookupMsg = buildWalletLookupMessage({ address: walletAddr, nonce: nonceResp.nonce, houseId });
  const sig = await signMessageBytes(lookupMsg);
  const lookup = await apiJson("/api/wallet/lookup", {
    method: "POST",
    body: JSON.stringify({
      address: walletAddr,
      nonce: nonceResp.nonce,
      houseId,
      signature: bytesToB64(sig),
    }),
  });

  const keyWrap = lookup?.keyWrap || null;
  setStatus("Recovering keys...");
  const kroot = await decryptKrootFromKeyWrap({ houseId, keyWrap });
  await initKeysFromKroot({ houseId, krootBytes: kroot });

  // UX gate: require a wallet signature each session (no server validation; purely human intent).
  const meta = await houseApiJson(houseId, `/api/house/${encodeURIComponent(houseId)}/meta`);
  const msg = buildUnlockMessage({ housePubKey: meta.housePubKey, nonce: meta.nonce, origin: window.location.origin });
  await signMessageBytes(msg);

  setStatus("Unlocked.");
  await refreshEntries();
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const houseId = (params.get("house") || "").trim();
  const houseIdNode = el("houseId");
  if (houseIdNode) houseIdNode.textContent = houseId || "-";

  el("connectWalletBtn")?.addEventListener("click", async () => {
    setError("");
    try {
      await connectWallet();
      setStatus(`Wallet connected: ${walletAddr}`);
    } catch (e) {
      setError(e.message || String(e));
    }
  });

  el("unlockBtn")?.addEventListener("click", async () => {
    setError("");
    try {
      await unlockHouse(houseId);
    } catch (e) {
      setError(e.message || String(e));
    }
  });

  // If the local wallet is installed and trusted, this will connect silently.
  try {
    await connectWallet({ silent: true });
  } catch {
    // ignore
  }
}

init().catch((e) => {
  console.error(e);
});
