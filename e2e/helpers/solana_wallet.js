const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_FAUCET_URL = 'https://faucet.solana.com/';
const DEFAULT_RPC_URL = 'https://api.devnet.solana.com';
const SOLANA_SECRET_KEY_PLACEHOLDER = 'SOLANA_SECRET_KEY_PLACEHOLDER';
const SOLANA_ADDR_PLACEHOLDER = 'SOLANA_ADDRESS_PLACEHOLDER';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');
const SPKI_ED25519_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

function walletFilePath() {
  const configured = process.env.LOCAL_SOLANA_DEVNET_WALLET_FILE;
  if (configured && configured.trim()) return path.resolve(configured.trim());
  return path.join(process.cwd(), 'data', 'local.solana.devnet.wallet.json');
}

function walletTemplate() {
  return {
    address: SOLANA_ADDR_PLACEHOLDER,
    secretKey: SOLANA_SECRET_KEY_PLACEHOLDER,
    network: 'solana-devnet',
    faucetUrl: DEFAULT_FAUCET_URL,
    note: 'Run `npm run setup:solana-wallet` to configure this wallet for local tests.',
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

function base58Encode(bytes) {
  const input = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes || []);
  if (!input.length) return '';

  let x = BigInt(`0x${Buffer.from(input).toString('hex')}`);
  let out = '';

  while (x > 0n) {
    const mod = x % 58n;
    out = BASE58_ALPHABET[Number(mod)] + out;
    x /= 58n;
  }

  for (let i = 0; i < input.length && input[i] === 0; i++) out = `1${out}`;
  return out || '1';
}

function base58Decode(str) {
  if (typeof str !== 'string') return null;
  const input = str.trim();
  if (!input) return null;

  let num = 0n;
  for (const ch of input) {
    const idx = BASE58_ALPHABET.indexOf(ch);
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
  for (let i = 0; i < input.length && input[i] === '1'; i++) leadingZeros += 1;

  return new Uint8Array(Array(leadingZeros).fill(0).concat(bytes));
}

function derivePublicKeyFromSeed(seedBytes) {
  if (!(seedBytes instanceof Uint8Array) || seedBytes.length !== 32) {
    throw new Error('INVALID_SEED');
  }

  const pkcs8Der = Buffer.concat([PKCS8_ED25519_PREFIX, Buffer.from(seedBytes)]);
  const privateKey = crypto.createPrivateKey({ key: pkcs8Der, format: 'der', type: 'pkcs8' });
  const spkiDer = Buffer.from(crypto.createPublicKey(privateKey).export({ format: 'der', type: 'spki' }));

  const prefix = spkiDer.subarray(0, SPKI_ED25519_PREFIX.length);
  if (!prefix.equals(SPKI_ED25519_PREFIX)) throw new Error('INVALID_PUBLIC_KEY_DER');
  const publicKey = spkiDer.subarray(SPKI_ED25519_PREFIX.length);
  if (publicKey.length !== 32) throw new Error('INVALID_PUBLIC_KEY_LENGTH');

  return new Uint8Array(publicKey);
}

function allByteValues(arr) {
  return Array.isArray(arr) && arr.every((n) => Number.isInteger(n) && n >= 0 && n <= 255);
}

function parseSecretKeyBytes(secretKey) {
  if (secretKey instanceof Uint8Array) return secretKey;
  if (Buffer.isBuffer(secretKey)) return new Uint8Array(secretKey);
  if (allByteValues(secretKey)) return Uint8Array.from(secretKey);

  if (typeof secretKey !== 'string') return null;
  const value = secretKey.trim();
  if (!value) return null;

  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (!allByteValues(parsed)) return null;
      return Uint8Array.from(parsed);
    } catch {
      return null;
    }
  }

  return base58Decode(value);
}

function seedFromSecretKeyBytes(secretKeyBytes) {
  if (!(secretKeyBytes instanceof Uint8Array)) throw new Error('INVALID_SECRET_KEY');
  if (secretKeyBytes.length === 32) return secretKeyBytes;
  if (secretKeyBytes.length !== 64) throw new Error('INVALID_SECRET_KEY_LENGTH');

  const seed = secretKeyBytes.subarray(0, 32);
  const expectedPublic = derivePublicKeyFromSeed(seed);
  const actualPublic = secretKeyBytes.subarray(32);

  if (!Buffer.from(expectedPublic).equals(Buffer.from(actualPublic))) {
    throw new Error('SECRET_KEY_PUBLIC_MISMATCH');
  }
  return seed;
}

function normalizeSecretKey(secretKey) {
  const bytes = parseSecretKeyBytes(secretKey);
  if (!bytes) return null;

  try {
    const seed = seedFromSecretKeyBytes(bytes);
    const pub = derivePublicKeyFromSeed(seed);
    return base58Encode(Buffer.concat([Buffer.from(seed), Buffer.from(pub)]));
  } catch {
    return null;
  }
}

function isValidSecretKey(secretKey) {
  return normalizeSecretKey(secretKey) !== null;
}

function addressFromSecretKey(secretKey) {
  const normalized = normalizeSecretKey(secretKey);
  if (!normalized) throw new Error('INVALID_SECRET_KEY');
  const bytes = base58Decode(normalized);
  if (!bytes || bytes.length !== 64) throw new Error('INVALID_SECRET_KEY');
  return base58Encode(bytes.subarray(32));
}

function normalizeAddress(address) {
  if (typeof address !== 'string') return null;
  const decoded = base58Decode(address.trim());
  if (!decoded || decoded.length !== 32) return null;
  return base58Encode(decoded);
}

function isValidAddress(address) {
  return normalizeAddress(address) !== null;
}

function generateSolanaWallet() {
  for (;;) {
    const seed = crypto.randomBytes(32);
    try {
      const publicKey = derivePublicKeyFromSeed(seed);
      const address = base58Encode(publicKey);
      const secretKey = base58Encode(Buffer.concat([seed, Buffer.from(publicKey)]));
      if (isValidAddress(address) && isValidSecretKey(secretKey)) return { secretKey, address };
    } catch {
      // Retry on improbable key generation edge-cases.
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

async function getDevnetBalanceLamports(address) {
  const normalized = normalizeAddress(address);
  if (!normalized) throw new Error('INVALID_ADDRESS');
  const rpcUrl = (process.env.SOLANA_DEVNET_RPC_URL || DEFAULT_RPC_URL).trim();
  const out = await jsonRpc(rpcUrl, 'getBalance', [normalized, { commitment: 'confirmed' }]);
  if (!out || typeof out.value !== 'number' || !Number.isFinite(out.value) || out.value < 0) {
    throw new Error('RPC_BAD_BALANCE');
  }
  return BigInt(Math.trunc(out.value));
}

function lamportsToSolString(lamports) {
  const base = 10n ** 9n;
  const whole = lamports / base;
  const frac = lamports % base;
  const fracStr = frac.toString().padStart(9, '0').replace(/0+$/, '');
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

function minLamportsFromEnv() {
  const minSol = process.env.MIN_SOLANA_DEVNET_SOL || '0.1';
  const trimmed = minSol.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) throw new Error('INVALID_MIN_SOLANA_DEVNET_SOL');
  const [wholeStr, fracStr = ''] = trimmed.split('.');
  const whole = BigInt(wholeStr) * (10n ** 9n);
  const fracPadded = `${fracStr}000000000`.slice(0, 9);
  const frac = BigInt(fracPadded || '0');
  return whole + frac;
}

module.exports = {
  DEFAULT_FAUCET_URL,
  DEFAULT_RPC_URL,
  SOLANA_ADDR_PLACEHOLDER,
  SOLANA_SECRET_KEY_PLACEHOLDER,
  ensureWalletFile,
  readWalletConfig,
  writeWalletConfig,
  isValidAddress,
  isValidSecretKey,
  normalizeAddress,
  normalizeSecretKey,
  addressFromSecretKey,
  generateSolanaWallet,
  getDevnetBalanceLamports,
  lamportsToSolString,
  minLamportsFromEnv,
  walletFilePath
};
