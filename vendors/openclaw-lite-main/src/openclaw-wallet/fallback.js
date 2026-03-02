/* eslint-disable no-console */

// OpenClaw Local Wallet (Solana-style signMessage)
//
// Purpose:
// - Provide a real Ed25519 signing wallet when no browser extension is present.
// - Make Playwright deterministic without injecting mock wallets.
//
// Notes:
// - In e2e, the server exposes a deterministic seed at /__test__/wallet/seed.
// - In non-test environments, we persist a random seed in localStorage.

import * as ed25519 from "@noble/ed25519";

import { base58Encode } from "../openclaw-lite/shared/base58.js";

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const clean = String(hex || "").trim().toLowerCase();
  if (!/^[0-9a-f]*$/.test(clean) || clean.length % 2 !== 0) throw new Error("INVALID_HEX");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function normalizeMessageBytes(message) {
  if (message instanceof Uint8Array) return message;
  if (message instanceof ArrayBuffer) return new Uint8Array(message);
  if (ArrayBuffer.isView(message)) return new Uint8Array(message.buffer);
  // Phantom sometimes gets a string message in ad-hoc adapters.
  return new TextEncoder().encode(String(message || ""));
}

async function tryFetchTestSeed() {
  try {
    const res = await fetch("/__test__/wallet/seed", { credentials: "omit" });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const seedHex = typeof data?.seedHex === "string" ? data.seedHex.trim() : "";
    if (!seedHex) return null;
    return seedHex;
  } catch {
    return null;
  }
}

function loadSeedFromLocalStorage() {
  try {
    const raw = localStorage.getItem("openclaw.localWallet.seedHex") || "";
    const seedHex = raw.trim();
    if (!seedHex) return null;
    // Validate now so we don't persist junk.
    const seed = hexToBytes(seedHex);
    if (seed.length !== 32) return null;
    return seedHex;
  } catch {
    return null;
  }
}

function saveSeedToLocalStorage(seedHex) {
  try {
    localStorage.setItem("openclaw.localWallet.seedHex", seedHex);
  } catch {
    // ignore
  }
}

function randomSeedHex() {
  const seed = new Uint8Array(32);
  crypto.getRandomValues(seed);
  return bytesToHex(seed);
}

async function resolveSeedHex() {
  const testSeed = await tryFetchTestSeed();
  if (testSeed) return testSeed;
  const cached = loadSeedFromLocalStorage();
  if (cached) return cached;
  const fresh = randomSeedHex();
  saveSeedToLocalStorage(fresh);
  return fresh;
}

let walletPromise = null;

async function getLocalWallet() {
  if (walletPromise) return walletPromise;
  walletPromise = (async () => {
    const seedHex = await resolveSeedHex();
    const secretKey = hexToBytes(seedHex);
    if (secretKey.length !== 32) throw new Error("INVALID_WALLET_SEED");
    const publicKeyBytes = await ed25519.getPublicKeyAsync(secretKey);
    const address = base58Encode(publicKeyBytes);

    const wallet = {
      isPhantom: true,
      isOpenClawLocalWallet: true,
      isConnected: false,
      publicKey: null,
      async connect(_opts) {
        wallet.isConnected = true;
        wallet.publicKey = { toString: () => address };
        return { publicKey: wallet.publicKey };
      },
      async disconnect() {
        wallet.isConnected = false;
        wallet.publicKey = null;
      },
      async signMessage(message) {
        if (!wallet.isConnected) {
          await wallet.connect();
        }
        const msgBytes = normalizeMessageBytes(message);
        const signature = await ed25519.signAsync(msgBytes, secretKey);
        return { signature, publicKey: { toString: () => address } };
      },
    };

    return wallet;
  })();
  return walletPromise;
}

function installLazySolanaWallet() {
  try {
    if (
      window.solana &&
      typeof window.solana.signMessage === "function" &&
      typeof window.solana.connect === "function"
    ) {
      return;
    }
  } catch {
    // ignore
  }

  let inner = null;
  let innerPromise = null;
  async function getInner() {
    if (inner) return inner;
    if (!innerPromise) innerPromise = getLocalWallet();
    inner = await innerPromise;
    return inner;
  }

  const lazy = {
    isPhantom: true,
    isOpenClawLocalWallet: true,
    get isConnected() {
      return !!inner?.isConnected;
    },
    get publicKey() {
      return inner?.publicKey || null;
    },
    async connect(opts) {
      const w = await getInner();
      return await w.connect(opts);
    },
    async disconnect() {
      const w = await getInner();
      return await w.disconnect();
    },
    async signMessage(message) {
      const w = await getInner();
      return await w.signMessage(message);
    },
  };

  window.solana = lazy;
}

// Install eagerly so non-module scripts can rely on window.solana existing.
try {
  installLazySolanaWallet();
} catch (e) {
  console.warn("openclaw local wallet install failed:", e?.message || String(e));
}
