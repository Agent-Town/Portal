const crypto = require("crypto");
const { ethers } = require("ethers");

const { nowIso, randomHex } = require("../util");
const { readStore, writeStore } = require("../store");

// --- base58 (for Solana public keys) ---
function base58Encode(bytes) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let x = BigInt("0x" + Buffer.from(bytes).toString("hex"));
  let out = "";
  while (x > 0n) {
    const mod = x % 58n;
    out = alphabet[Number(mod)] + out;
    x = x / 58n;
  }
  // leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out = "1" + out;
  return out || "1";
}

function base58Decode(str) {
  if (!str || typeof str !== "string") return null;
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = 0n;
  for (const ch of str) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) return null;
    num = num * 58n + BigInt(idx);
  }
  const bytes = [];
  while (num > 0n) {
    bytes.push(Number(num & 0xffn));
    num >>= 8n;
  }
  bytes.reverse();
  let leadingZeros = 0;
  for (let i = 0; i < str.length && str[i] === "1"; i++) leadingZeros++;
  if (leadingZeros) {
    return new Uint8Array(Array(leadingZeros).fill(0).concat(bytes));
  }
  return new Uint8Array(bytes);
}

function buildWalletLookupMessage({ address, nonce, houseId }) {
  const parts = ["ElizaTown House Lookup", `address: ${address}`, `nonce: ${nonce}`];
  if (houseId) parts.push(`houseId: ${houseId}`);
  return parts.join("\n");
}

function buildEvmHouseInitMessage({ address, houseId, nonce }) {
  return ["ElizaTown EVM House Init", `address: ${address}`, `houseId: ${houseId}`, `nonce: ${nonce}`].join("\n");
}

function buildHouseKeyWrapMessage({ houseId, origin = null } = {}) {
  const parts = ["ElizaTown House Key Wrap", `houseId: ${houseId}`];
  if (origin) parts.push(`origin: ${origin}`);
  return parts.join("\n");
}

function verifySolanaSignature(address, message, signatureB64) {
  try {
    const pubKey = base58Decode(address);
    if (!pubKey || pubKey.length !== 32) return false;
    const sig = Buffer.from(signatureB64 || "", "base64");
    if (sig.length !== 64) return false;
    const spki = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(pubKey)]);
    const key = crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
    return crypto.verify(null, Buffer.from(message, "utf8"), key, sig);
  } catch (e) {
    console.warn("wallet signature verify failed", e);
    return false;
  }
}

function normalizeEvmAddress(address) {
  try {
    return ethers.getAddress(String(address || "").trim());
  } catch {
    return null;
  }
}

function verifyEvmSignature(address, message, signatureHex) {
  try {
    const normalized = normalizeEvmAddress(address);
    if (!normalized) return false;
    const recovered = ethers.verifyMessage(String(message || ""), String(signatureHex || ""));
    const recNorm = normalizeEvmAddress(recovered);
    if (!recNorm) return false;
    return recNorm === normalized;
  } catch (e) {
    console.warn("evm signature verify failed", e);
    return false;
  }
}

function sha256Base64(input) {
  return crypto.createHash("sha256").update(input).digest("base64");
}

function decodeB64(input) {
  try {
    return Buffer.from(input, "base64");
  } catch {
    return null;
  }
}

const HOUSE_AUTH_SKEW_MS = 2 * 60 * 1000;

function verifyHouseAuth(req, house) {
  if (!house || !house.authKey) return { ok: false, error: "HOUSE_AUTH_REQUIRED" };
  const ts = req.header("x-house-ts");
  const auth = req.header("x-house-auth");
  if (!ts || !auth) return { ok: false, error: "HOUSE_AUTH_REQUIRED" };
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return { ok: false, error: "HOUSE_AUTH_INVALID" };
  const skew = Math.abs(Date.now() - tsNum);
  if (skew > HOUSE_AUTH_SKEW_MS) return { ok: false, error: "HOUSE_AUTH_EXPIRED" };
  const key = decodeB64(house.authKey);
  if (!key || key.length < 16) return { ok: false, error: "HOUSE_AUTH_INVALID" };
  const bodyHash = sha256Base64(req.rawBody || "");
  const msg = `${house.id}.${ts}.${req.method.toUpperCase()}.${req.path}.${bodyHash}`;
  const expected = crypto.createHmac("sha256", key).update(msg).digest("base64");
  const a = Buffer.from(expected, "base64");
  const b = Buffer.from(auth, "base64");
  if (a.length !== b.length) return { ok: false, error: "HOUSE_AUTH_INVALID" };
  if (!crypto.timingSafeEqual(a, b)) return { ok: false, error: "HOUSE_AUTH_INVALID" };
  return { ok: true };
}

function makeNonce(prefix) {
  const p = prefix || "n";
  return `${p}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const MAX_HOUSE_ENTRIES = 200;
const MAX_VAULT_CT_B64 = 1_600_000; // ~1.2MB binary + overhead
const MAX_PROMPT_MD = 16 * 1024;

function sanitizeProfileText(input, maxLen) {
  const raw = typeof input === "string" ? input : "";
  // Minimal, deterministic sanitizer: strip HTML tags + control chars.
  let cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, "");
  cleaned = cleaned.replace(/<[^>]*>/g, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  if (!maxLen || maxLen <= 0) return cleaned;
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned;
}

function sanitizePromptMd(input, maxLen) {
  const raw = typeof input === "string" ? input : "";
  // Preserve newlines for Markdown, but strip control chars + HTML tags deterministically.
  let cleaned = raw.replace(/\r\n?/g, "\n");
  cleaned = cleaned.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  if (maxLen && maxLen > 0 && cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen);
  }

  // Trim trailing whitespace per-line and outer whitespace.
  cleaned = cleaned
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trim();
  return cleaned;
}

function normalizeHousePublicJson(input) {
  if (!input || typeof input !== "object") return null;
  const v = input.v === 1 ? 1 : null;
  if (!v) return null;
  const displayName = sanitizeProfileText(input.displayName, 64) || "House";
  const tagline = sanitizeProfileText(input.tagline, 280) || "";
  return { v, displayName, tagline };
}

function parsePublicImageDataUrl(dataUrl) {
  if (dataUrl == null || dataUrl === "") return { dataUrl: null };
  if (typeof dataUrl !== "string") return { error: "INVALID_PUBLIC_IMAGE" };
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return { error: "INVALID_PUBLIC_IMAGE" };
  const mime = match[1];
  const payload = match[2];
  let bytes;
  try {
    bytes = Buffer.from(payload, "base64");
  } catch {
    return { error: "INVALID_PUBLIC_IMAGE" };
  }
  if (!bytes || bytes.length === 0) return { error: "INVALID_PUBLIC_IMAGE" };
  if (bytes.length > 1024 * 1024) return { error: "PUBLIC_IMAGE_TOO_LARGE" };
  return { dataUrl, mime, bytes };
}

function registerHouseRoutes(app, { ensureSession }) {
  app.get("/api/house/nonce", (req, res) => {
    const s = ensureSession(req, res);
    const nonce = makeNonce("n");
    s.houseInitNonce = nonce;
    res.json({ ok: true, nonce });
  });

  app.post("/api/house/init", (req, res) => {
    const s = ensureSession(req, res);
    const houseId = typeof req.body?.houseId === "string" ? req.body.houseId.trim() : "";
    const housePubKey = typeof req.body?.housePubKey === "string" ? req.body.housePubKey.trim() : "";
    const nonce = typeof req.body?.nonce === "string" ? req.body.nonce.trim() : "";
    const keyMode = typeof req.body?.keyMode === "string" ? req.body.keyMode.trim() : "ceremony";
    const unlock = req.body?.unlock || null;
    const keyWrap = req.body?.keyWrap || null;
    const houseAuthKey = typeof req.body?.houseAuthKey === "string" ? req.body.houseAuthKey.trim() : "";

    if (!houseId || !housePubKey) return res.status(400).json({ ok: false, error: "MISSING_HOUSE_ID" });
    if (houseId !== housePubKey) return res.status(400).json({ ok: false, error: "HOUSE_ID_MISMATCH" });
    if (!nonce) return res.status(400).json({ ok: false, error: "MISSING_NONCE" });
    if (!s.houseInitNonce || nonce !== s.houseInitNonce) {
      return res.status(400).json({ ok: false, error: "NONCE_MISMATCH" });
    }
    if (!houseAuthKey) return res.status(400).json({ ok: false, error: "MISSING_HOUSE_AUTH" });
    const authKeyBytes = decodeB64(houseAuthKey);
    if (!authKeyBytes || authKeyBytes.length < 16) return res.status(400).json({ ok: false, error: "INVALID_HOUSE_AUTH" });

    // v1.2: ceremony-only houses.
    if (keyMode !== "ceremony") return res.status(400).json({ ok: false, error: "CEREMONY_ONLY" });

    let normalizedUnlock = unlock;
    if (unlock && typeof unlock === "object" && unlock.kind === "evm-wallet-signature") {
      const address = normalizeEvmAddress(unlock.address);
      const signature = typeof unlock.signature === "string" ? unlock.signature.trim() : "";
      const unlockNonce = typeof unlock.nonce === "string" ? unlock.nonce.trim() : "";
      if (!address || !signature || !unlockNonce) {
        return res.status(400).json({ ok: false, error: "INVALID_UNLOCK" });
      }
      if (unlockNonce !== nonce) {
        return res.status(400).json({ ok: false, error: "NONCE_MISMATCH" });
      }
      const msg = buildEvmHouseInitMessage({ address, houseId, nonce });
      if (!verifyEvmSignature(address, msg, signature)) {
        return res.status(401).json({ ok: false, error: "BAD_SIGNATURE" });
      }
      normalizedUnlock = {
        kind: "evm-wallet-signature",
        address,
        nonce: unlockNonce,
        signature,
      };
    }

    let normalizedKeyWrap = null;
    if (keyWrap && typeof keyWrap === "object") {
      const alg = typeof keyWrap.alg === "string" ? keyWrap.alg.trim() : "";
      const iv = typeof keyWrap.iv === "string" ? keyWrap.iv.trim() : "";
      const ct = typeof keyWrap.ct === "string" ? keyWrap.ct.trim() : "";
      if (alg && iv && ct) {
        if (alg !== "AES-GCM") return res.status(400).json({ ok: false, error: "INVALID_KEY_WRAP" });
        normalizedKeyWrap = { alg, iv, ct };
      }
    }

    const store = readStore();
    const exists = store.houses.find((r) => r && r.id === houseId);
    if (exists) return res.status(409).json({ ok: false, error: "HOUSE_EXISTS" });

    store.houses.push({
      id: houseId,
      housePubKey,
      createdAt: nowIso(),
      nonce,
      keyMode: "ceremony",
      unlock: normalizedUnlock,
      keyWrap: normalizedKeyWrap,
      authKey: houseAuthKey,
      entries: [],
    });
    writeStore(store, { tables: ["houses"] });

    s.houseId = houseId;
    s.houseInitNonce = null;
    res.json({ ok: true, houseId });
  });

  app.get("/api/house/:id/meta", (req, res) => {
    const houseId = typeof req.params?.id === "string" ? req.params.id.trim() : "";
    if (!houseId) return res.status(400).json({ ok: false, error: "MISSING_HOUSE_ID" });
    const store = readStore();
    const house = store.houses.find((r) => r && r.id === houseId) || null;
    if (!house) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    const auth = verifyHouseAuth(req, house);
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
    res.json({ ok: true, houseId: house.id, housePubKey: house.housePubKey, nonce: house.nonce, keyMode: "ceremony" });
  });

  app.get("/api/house/:id/log", (req, res) => {
    const houseId = typeof req.params?.id === "string" ? req.params.id.trim() : "";
    if (!houseId) return res.status(400).json({ ok: false, error: "MISSING_HOUSE_ID" });
    const store = readStore();
    const house = store.houses.find((r) => r && r.id === houseId) || null;
    if (!house) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    const auth = verifyHouseAuth(req, house);
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
    res.json({ ok: true, entries: Array.isArray(house.entries) ? house.entries : [] });
  });

  app.post("/api/house/:id/append", (req, res) => {
    const houseId = typeof req.params?.id === "string" ? req.params.id.trim() : "";
    if (!houseId) return res.status(400).json({ ok: false, error: "MISSING_HOUSE_ID" });
    const ciphertext = req.body?.ciphertext;
    const author = typeof req.body?.author === "string" ? req.body.author.trim() : "unknown";
    if (!ciphertext || typeof ciphertext.iv !== "string" || typeof ciphertext.ct !== "string") {
      return res.status(400).json({ ok: false, error: "INVALID_CIPHERTEXT" });
    }

    const store = readStore();
    const house = store.houses.find((r) => r && r.id === houseId) || null;
    if (!house) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    const auth = verifyHouseAuth(req, house);
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

    house.entries = Array.isArray(house.entries) ? house.entries : [];
    if (house.entries.length >= MAX_HOUSE_ENTRIES) return res.status(403).json({ ok: false, error: "HOUSE_FULL" });

    house.entries.push({ id: makeNonce("re"), createdAt: nowIso(), author, ciphertext });
    writeStore(store, { tables: ["houses"] });
    res.json({ ok: true });
  });

  // --- Wallet lookup ---
  app.get("/api/wallet/nonce", (req, res) => {
    const s = ensureSession(req, res);
    const nonce = `wn_${randomHex(16)}`;
    s.walletLookupNonce = nonce;
    res.json({ ok: true, nonce });
  });

  app.post("/api/wallet/lookup", (req, res) => {
    const s = ensureSession(req, res);
    const address = typeof req.body?.address === "string" ? req.body.address.trim() : "";
    const chainRaw = typeof req.body?.chain === "string" ? req.body.chain.trim().toLowerCase() : "";
    const signature = typeof req.body?.signature === "string" ? req.body.signature.trim() : "";
    const nonce = typeof req.body?.nonce === "string" ? req.body.nonce.trim() : "";
    const houseId = typeof req.body?.houseId === "string" ? req.body.houseId.trim() : "";

    if (!address) return res.status(400).json({ ok: false, error: "MISSING_ADDRESS" });
    if (!signature) return res.status(400).json({ ok: false, error: "MISSING_SIGNATURE" });

    const inferredChain = address.startsWith("0x") ? "evm" : "solana";
    const chain = chainRaw || inferredChain;
    if (chain !== "solana" && chain !== "evm") return res.status(400).json({ ok: false, error: "UNSUPPORTED_CHAIN" });

    const normalizedAddress = chain === "evm" ? normalizeEvmAddress(address) : address;
    if (!normalizedAddress) return res.status(400).json({ ok: false, error: "INVALID_ADDRESS" });

    const usingNonce = !!nonce;
    if (usingNonce) {
      if (nonce !== s.walletLookupNonce) return res.status(400).json({ ok: false, error: "NONCE_MISMATCH" });
      const msg = buildWalletLookupMessage({ address: normalizedAddress, nonce, houseId: houseId || null });
      const verified =
        chain === "evm"
          ? verifyEvmSignature(normalizedAddress, msg, signature)
          : verifySolanaSignature(normalizedAddress, msg, signature);
      if (!verified) {
        return res.status(401).json({ ok: false, error: "BAD_SIGNATURE" });
      }
      s.walletLookupNonce = null;
    } else {
      if (!houseId) return res.status(400).json({ ok: false, error: "MISSING_HOUSE_ID" });
      const msg = buildHouseKeyWrapMessage({ houseId });
      const verified =
        chain === "evm"
          ? verifyEvmSignature(normalizedAddress, msg, signature)
          : verifySolanaSignature(normalizedAddress, msg, signature);
      if (!verified) {
        return res.status(401).json({ ok: false, error: "BAD_SIGNATURE" });
      }
    }

    const store = readStore();
    let matches = [];
    if (chain === "evm") {
      matches = store.houses.filter((r) => {
        if (!r || !r.unlock || r.unlock.kind !== "evm-wallet-signature") return false;
        const addr = normalizeEvmAddress(r.unlock.address);
        return !!addr && addr === normalizedAddress;
      });
    } else {
      matches = store.houses.filter(
        (r) => r && r.unlock && r.unlock.kind === "solana-wallet-signature" && r.unlock.address === normalizedAddress,
      );
    }
    if (houseId) {
      matches = matches.filter((r) => r.id === houseId);
      if (!matches.length) return res.status(404).json({ ok: false, error: "HOUSE_NOT_FOUND" });
    }

    if (!matches.length) return res.json({ ok: true, houseId: null, keyWrap: null });

    matches.sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
    const house = matches[matches.length - 1];

    if (house?.id) s.houseId = house.id;
    res.json({ ok: true, houseId: house.id, keyWrap: house.keyWrap || null });
  });

  // Minimal ceremony surface for interop with legacy house pages.
  app.get("/api/human/house/material", (req, res) => {
    const s = ensureSession(req, res);
    res.json({ ok: true, houseId: s.houseId || null, humanReveal: null, agentReveal: null });
  });

  app.post("/api/house/:id/vault/backup", (req, res) => {
    const houseId = typeof req.params?.id === "string" ? req.params.id.trim() : "";
    if (!houseId) return res.status(400).json({ ok: false, error: "MISSING_HOUSE_ID" });
    const vault = req.body?.vault;
    if (!vault || typeof vault !== "object") return res.status(400).json({ ok: false, error: "INVALID_VAULT" });
    if (vault.v !== 1 || vault.alg !== "AES-GCM") return res.status(400).json({ ok: false, error: "INVALID_VAULT" });
    if (!vault.kdf || typeof vault.kdf !== "object") return res.status(400).json({ ok: false, error: "INVALID_VAULT" });
    if (vault.kdf.houseId !== houseId) return res.status(400).json({ ok: false, error: "HOUSE_ID_MISMATCH" });
    if (typeof vault.iv !== "string" || typeof vault.ct !== "string") return res.status(400).json({ ok: false, error: "INVALID_VAULT" });
    if (vault.ct.length > MAX_VAULT_CT_B64) return res.status(413).json({ ok: false, error: "VAULT_TOO_LARGE" });

    const store = readStore();
    const house = store.houses.find((r) => r && r.id === houseId) || null;
    if (!house) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    const auth = verifyHouseAuth(req, house);
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

    store.vaultBackups = Array.isArray(store.vaultBackups) ? store.vaultBackups : [];
    store.vaultPointers = Array.isArray(store.vaultPointers) ? store.vaultPointers : [];

    const backupId = makeNonce("vb");
    store.vaultBackups.push({ id: backupId, houseId, createdAt: nowIso(), vault });

    store.vaultPointers = store.vaultPointers.filter((p) => p && p.houseId !== houseId);
    const pointer = { houseId, latestBackupId: backupId, updatedAt: nowIso() };
    store.vaultPointers.push(pointer);

    writeStore(store, { tables: ["vaultBackups", "vaultPointers"] });
    res.json({ ok: true, backupId, pointer });
  });

  app.get("/api/house/:id/vault/latest", (req, res) => {
    const houseId = typeof req.params?.id === "string" ? req.params.id.trim() : "";
    if (!houseId) return res.status(400).json({ ok: false, error: "MISSING_HOUSE_ID" });
    const store = readStore();
    const house = store.houses.find((r) => r && r.id === houseId) || null;
    if (!house) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    const auth = verifyHouseAuth(req, house);
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

    const ptr = (store.vaultPointers || []).find((p) => p && p.houseId === houseId) || null;
    if (!ptr || !ptr.latestBackupId) return res.json({ ok: true, backupId: null, vault: null });
    const rec = (store.vaultBackups || []).find((b) => b && b.id === ptr.latestBackupId) || null;
    if (!rec) return res.json({ ok: true, backupId: null, vault: null });

    res.json({ ok: true, backupId: rec.id, vault: rec.vault });
  });

  app.post("/api/house/:id/public-profile", (req, res) => {
    const houseId = typeof req.params?.id === "string" ? req.params.id.trim() : "";
    if (!houseId) return res.status(400).json({ ok: false, error: "MISSING_HOUSE_ID" });

    const store = readStore();
    const house = store.houses.find((r) => r && r.id === houseId) || null;
    if (!house) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    const auth = verifyHouseAuth(req, house);
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

    store.publicProfiles = Array.isArray(store.publicProfiles) ? store.publicProfiles : [];

    const clear = req.body?.clear === true;
    if (clear) {
      store.publicProfiles = store.publicProfiles.filter((p) => p && p.houseId !== houseId);
      writeStore(store, { tables: ["publicProfiles"] });
      return res.json({ ok: true, profile: null });
    }

    const normalized = normalizeHousePublicJson(req.body?.housePublicJson);
    if (!normalized) return res.status(400).json({ ok: false, error: "INVALID_PUBLIC_PROFILE" });

    const promptMd = req.body?.promptMd == null ? "" : String(req.body.promptMd);
    const safePromptMd = sanitizePromptMd(promptMd, MAX_PROMPT_MD);

    const preview = req.body?.previewImage;
    let previewImage = null;
    if (typeof preview === "string" && preview.trim()) {
      const parsed = parsePublicImageDataUrl(preview);
      if (parsed.error) return res.status(400).json({ ok: false, error: parsed.error });
      previewImage = parsed.dataUrl;
    }

    const rec = {
      houseId,
      updatedAt: nowIso(),
      housePublicJson: normalized,
      promptMd: safePromptMd,
      previewImage,
    };

    store.publicProfiles = store.publicProfiles.filter((p) => p && p.houseId !== houseId);
    store.publicProfiles.unshift(rec);
    writeStore(store, { tables: ["publicProfiles"] });

    res.json({
      ok: true,
      profile: {
        houseId,
        updatedAt: rec.updatedAt,
        housePublicJson: rec.housePublicJson,
        promptMd: rec.promptMd,
        previewImageUrl: previewImage ? `/api/house/${encodeURIComponent(houseId)}/public-profile/preview` : null,
      },
    });
  });

  app.get("/api/house/:id/public-profile", (req, res) => {
    const houseId = typeof req.params?.id === "string" ? req.params.id.trim() : "";
    if (!houseId) return res.status(400).json({ ok: false, error: "MISSING_HOUSE_ID" });
    const store = readStore();
    const rec = (store.publicProfiles || []).find((p) => p && p.houseId === houseId) || null;
    if (!rec) return res.json({ ok: true, profile: null });
    res.json({
      ok: true,
      profile: {
        houseId,
        updatedAt: rec.updatedAt || null,
        housePublicJson: rec.housePublicJson || null,
        promptMd: rec.promptMd || "",
        previewImageUrl: rec.previewImage ? `/api/house/${encodeURIComponent(houseId)}/public-profile/preview` : null,
      },
    });
  });

  app.get("/api/house/:id/public-profile/preview", (req, res) => {
    const houseId = typeof req.params?.id === "string" ? req.params.id.trim() : "";
    if (!houseId) return res.status(400).json({ ok: false, error: "MISSING_HOUSE_ID" });
    const store = readStore();
    const rec = (store.publicProfiles || []).find((p) => p && p.houseId === houseId) || null;
    if (!rec || !rec.previewImage) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    const parsed = parsePublicImageDataUrl(rec.previewImage);
    if (parsed.error || !parsed.bytes) return res.status(500).json({ ok: false, error: "INVALID_PUBLIC_IMAGE" });
    res.setHeader("Content-Type", parsed.mime || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.end(parsed.bytes);
  });

  app.get("/api/town/grid", (_req, res) => {
    const store = readStore();
    const out = [];
    for (const rec of store.publicProfiles || []) {
      if (!rec || typeof rec.houseId !== "string") continue;
      out.push({
        houseId: rec.houseId,
        updatedAt: rec.updatedAt || null,
        housePublicJson: rec.housePublicJson || null,
        previewImageUrl: rec.previewImage ? `/api/house/${encodeURIComponent(rec.houseId)}/public-profile/preview` : null,
      });
    }
    res.json({ ok: true, houses: out });
  });
}

module.exports = { registerHouseRoutes };
