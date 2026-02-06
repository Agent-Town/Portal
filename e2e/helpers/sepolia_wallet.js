const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_FAUCET_URL = 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia';
const DEFAULT_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
const EVM_KEY_PLACEHOLDER = '0x0000000000000000000000000000000000000000000000000000000000000000';
const EVM_ADDR_PLACEHOLDER = '0x0000000000000000000000000000000000000000';

const MASK64 = (1n << 64n) - 1n;
const KECCAK_RATE_BYTES = 136;
const KECCAK_RC = [
  0x0000000000000001n,
  0x0000000000008082n,
  0x800000000000808an,
  0x8000000080008000n,
  0x000000000000808bn,
  0x0000000080000001n,
  0x8000000080008081n,
  0x8000000000008009n,
  0x000000000000008an,
  0x0000000000000088n,
  0x0000000080008009n,
  0x000000008000000an,
  0x000000008000808bn,
  0x800000000000008bn,
  0x8000000000008089n,
  0x8000000000008003n,
  0x8000000000008002n,
  0x8000000000000080n,
  0x000000000000800an,
  0x800000008000000an,
  0x8000000080008081n,
  0x8000000000008080n,
  0x0000000080000001n,
  0x8000000080008008n
];
const KECCAK_R = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14]
];

function walletFilePath() {
  const configured = process.env.LOCAL_SEPOLIA_WALLET_FILE;
  if (configured && configured.trim()) return path.resolve(configured.trim());
  return path.join(process.cwd(), 'data', 'local.sepolia.wallet.json');
}

function walletTemplate() {
  return {
    address: EVM_ADDR_PLACEHOLDER,
    privateKey: EVM_KEY_PLACEHOLDER,
    network: 'sepolia',
    faucetUrl: DEFAULT_FAUCET_URL,
    note: 'Run `npm run setup:sepolia-wallet` to configure this wallet for local tests.',
    createdAt: new Date().toISOString(),
    updatedAt: null
  };
}

function ensureWalletFile() {
  const file = walletFilePath();
  if (fs.existsSync(file)) return file;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const template = walletTemplate();
  fs.writeFileSync(file, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
  return file;
}

function readWalletConfig() {
  const file = ensureWalletFile();
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(raw);
  return { file, config: parsed };
}

function writeWalletConfig(file, config) {
  const next = {
    ...walletTemplate(),
    ...(config || {}),
    updatedAt: new Date().toISOString()
  };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

function isValidAddress(address) {
  return typeof address === 'string' && /^0x[0-9a-fA-F]{40}$/.test(address);
}

function normalizePrivateKeyHex(privateKey) {
  if (typeof privateKey !== 'string') return null;
  const key = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  if (!/^[0-9a-fA-F]{64}$/.test(key)) return null;
  return `0x${key.toLowerCase()}`;
}

function isValidPrivateKey(privateKey) {
  const normalized = normalizePrivateKeyHex(privateKey);
  if (!normalized) return false;
  const raw = Buffer.from(normalized.slice(2), 'hex');
  try {
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(raw);
    return true;
  } catch {
    return false;
  }
}

function rotl64(x, n) {
  const shift = BigInt(n);
  if (shift === 0n) return x & MASK64;
  return ((x << shift) | (x >> (64n - shift))) & MASK64;
}

function keccakF1600(state) {
  for (let round = 0; round < 24; round++) {
    const c = new Array(5);
    const d = new Array(5);
    for (let x = 0; x < 5; x++) {
      c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }
    for (let x = 0; x < 5; x++) {
      d[x] = c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1);
    }
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        state[x + 5 * y] = (state[x + 5 * y] ^ d[x]) & MASK64;
      }
    }

    const b = new Array(25).fill(0n);
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const newX = y;
        const newY = (2 * x + 3 * y) % 5;
        b[newX + 5 * newY] = rotl64(state[x + 5 * y], KECCAK_R[x][y]);
      }
    }

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const i = x + 5 * y;
        const i1 = ((x + 1) % 5) + 5 * y;
        const i2 = ((x + 2) % 5) + 5 * y;
        state[i] = (b[i] ^ (((~b[i1]) & MASK64) & b[i2])) & MASK64;
      }
    }

    state[0] = (state[0] ^ KECCAK_RC[round]) & MASK64;
  }
}

function keccak256(bytes) {
  const msg = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes || []);
  const padLen = KECCAK_RATE_BYTES - (msg.length % KECCAK_RATE_BYTES);
  const padded = new Uint8Array(msg.length + padLen);
  padded.set(msg);
  padded[msg.length] = 0x01;
  padded[padded.length - 1] |= 0x80;

  const state = new Array(25).fill(0n);
  for (let off = 0; off < padded.length; off += KECCAK_RATE_BYTES) {
    for (let lane = 0; lane < KECCAK_RATE_BYTES / 8; lane++) {
      let v = 0n;
      for (let b = 0; b < 8; b++) {
        v |= BigInt(padded[off + lane * 8 + b]) << (8n * BigInt(b));
      }
      state[lane] = (state[lane] ^ v) & MASK64;
    }
    keccakF1600(state);
  }

  const out = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    const lane = Math.floor(i / 8);
    const shift = 8n * BigInt(i % 8);
    out[i] = Number((state[lane] >> shift) & 0xffn);
  }
  return out;
}

function addressFromPrivateKey(privateKey) {
  const normalized = normalizePrivateKeyHex(privateKey);
  if (!normalized) throw new Error('INVALID_PRIVATE_KEY');
  const raw = Buffer.from(normalized.slice(2), 'hex');
  const ecdh = crypto.createECDH('secp256k1');
  ecdh.setPrivateKey(raw);
  const uncompressed = ecdh.getPublicKey(undefined, 'uncompressed');
  const hashed = keccak256(uncompressed.slice(1));
  return `0x${hashed.slice(-20).toString('hex')}`;
}

function generateEvmWallet() {
  for (;;) {
    const raw = crypto.randomBytes(32);
    try {
      const privateKey = `0x${raw.toString('hex')}`;
      const address = addressFromPrivateKey(privateKey);
      if (isValidAddress(address)) return { privateKey, address };
    } catch {
      // Retry on improbable invalid private key edge-case.
    }
  }
}

async function jsonRpc(url, method, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  if (!res.ok) throw new Error(`RPC_HTTP_${res.status}`);
  const payload = await res.json();
  if (payload.error) throw new Error(`RPC_${payload.error.code || 'ERR'}_${payload.error.message || 'UNKNOWN'}`);
  return payload.result;
}

async function getSepoliaBalanceWei(address) {
  const rpcUrl = (process.env.SEPOLIA_RPC_URL || DEFAULT_RPC_URL).trim();
  const out = await jsonRpc(rpcUrl, 'eth_getBalance', [address, 'latest']);
  if (typeof out !== 'string' || !out.startsWith('0x')) throw new Error('RPC_BAD_BALANCE');
  return BigInt(out);
}

function weiToEthString(wei) {
  const base = 10n ** 18n;
  const whole = wei / base;
  const frac = wei % base;
  const fracStr = frac.toString().padStart(18, '0').replace(/0+$/, '');
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

function minWeiFromEnv() {
  const minEth = process.env.MIN_SEPOLIA_ETH || '0.001';
  const trimmed = minEth.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) throw new Error('INVALID_MIN_SEPOLIA_ETH');
  const [wholeStr, fracStr = ''] = trimmed.split('.');
  const whole = BigInt(wholeStr) * (10n ** 18n);
  const fracPadded = `${fracStr}000000000000000000`.slice(0, 18);
  const frac = BigInt(fracPadded || '0');
  return whole + frac;
}

module.exports = {
  DEFAULT_FAUCET_URL,
  DEFAULT_RPC_URL,
  EVM_ADDR_PLACEHOLDER,
  EVM_KEY_PLACEHOLDER,
  ensureWalletFile,
  readWalletConfig,
  writeWalletConfig,
  isValidAddress,
  isValidPrivateKey,
  normalizePrivateKeyHex,
  addressFromPrivateKey,
  generateEvmWallet,
  getSepoliaBalanceWei,
  weiToEthString,
  minWeiFromEnv,
  walletFilePath
};
