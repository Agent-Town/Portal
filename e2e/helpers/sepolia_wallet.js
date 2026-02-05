const fs = require('fs');
const path = require('path');

const DEFAULT_FAUCET_URL = 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia';
const DEFAULT_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';

function walletFilePath() {
  const configured = process.env.LOCAL_SEPOLIA_WALLET_FILE;
  if (configured && configured.trim()) return path.resolve(configured.trim());
  return path.join(process.cwd(), 'data', 'local.sepolia.wallet.json');
}

function walletTemplate() {
  return {
    address: '0x0000000000000000000000000000000000000000',
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
  ensureWalletFile,
  readWalletConfig,
  writeWalletConfig,
  isValidAddress,
  getSepoliaBalanceWei,
  weiToEthString,
  minWeiFromEnv,
  walletFilePath
};
