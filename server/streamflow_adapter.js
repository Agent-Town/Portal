const { PublicKey } = require('@solana/web3.js');
const { nowIso } = require('./util');

const STREAMFLOW_DEFAULT_RPC_URL = (
  String(process.env.STREAMFLOW_RPC_URL || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com').trim()
  || 'https://api.mainnet-beta.solana.com'
);
const STREAMFLOW_REQUIRED_MINT = normalizeSolanaAddress(process.env.STREAMFLOW_REQUIRED_MINT);
const STREAMFLOW_TOKEN_SYMBOL = String(process.env.STREAMFLOW_TOKEN_SYMBOL || '$AGENTTOWN').trim() || '$AGENTTOWN';
const STREAMFLOW_RPC_TIMEOUT_MS = Math.max(
  1000,
  Number.parseInt(process.env.STREAMFLOW_RPC_TIMEOUT_MS || '', 10) || 8000
);

let fixtureState = {
  locks: [],
};

let streamflowSdkModule = null;
let streamflowSdkLoadError = null;
let cachedClient = {
  rpcUrl: '',
  client: null,
};

function clone(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value == null ? fallback : value));
  } catch {
    return fallback;
  }
}

function normalizeProviderMode(value) {
  const mode = String(value || '').trim().toLowerCase();
  if (mode === 'fixture' || mode === 'live') return mode;
  return 'auto';
}

function getProviderMode() {
  return normalizeProviderMode(process.env.STREAMFLOW_PROVIDER_MODE);
}

function normalizeSolanaAddress(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    return new PublicKey(raw).toBase58();
  } catch {
    return raw;
  }
}

function normalizeLockMatchValue(value) {
  return String(value || '').trim();
}

function bnLikeToBigInt(value) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.trunc(value));
  if (value && typeof value.toString === 'function') {
    const text = value.toString(10);
    if (typeof text === 'string' && /^-?\d+$/.test(text)) {
      return BigInt(text);
    }
  }
  return 0n;
}

function amountAtLeast(actual, minimum) {
  const actualBig = BigInt(String(actual || '0') || '0');
  const minimumBig = BigInt(String(minimum || '0') || '0');
  return actualBig >= minimumBig;
}

function makeProviderResult({
  ok = false,
  locked = false,
  eligible = false,
  checkedAt = nowIso(),
  code = '',
  address = '',
  streamId = '',
  tokenSymbol = STREAMFLOW_TOKEN_SYMBOL,
  lockedAmountAtomic = '0',
  minLockAmountAtomic = '0',
  details = {},
}) {
  return {
    ok: ok === true,
    provider: 'streamflow',
    locked: locked === true,
    eligible: eligible === true,
    checkedAt: String(checkedAt || nowIso()),
    code: code || undefined,
    address: String(address || '').trim(),
    streamId: String(streamId || '').trim(),
    tokenSymbol: String(tokenSymbol || STREAMFLOW_TOKEN_SYMBOL).trim() || STREAMFLOW_TOKEN_SYMBOL,
    lockedAmountAtomic: String(lockedAmountAtomic || '0'),
    minLockAmountAtomic: String(minLockAmountAtomic || '0'),
    details: details && typeof details === 'object' ? details : {},
  };
}

function resetStreamflowFixtureState() {
  fixtureState = {
    locks: [],
  };
}

function seedStreamflowFixtureState(next = {}) {
  fixtureState = {
    locks: Array.isArray(next?.locks) ? clone(next.locks, []) : [],
  };
  return getStreamflowFixtureSnapshot();
}

function getStreamflowFixtureSnapshot() {
  return clone(fixtureState, { locks: [] });
}

function resolveFixtureLockRecord({ address = '', streamId = '' } = {}) {
  const normalizedAddress = normalizeLockMatchValue(address);
  const normalizedStreamId = normalizeLockMatchValue(streamId);
  return fixtureState.locks.find((lock) => {
    const lockAddress = normalizeLockMatchValue(lock?.address);
    const lockStreamId = normalizeLockMatchValue(lock?.streamId);
    if (!lockAddress || !lockStreamId) return false;
    return lockAddress === normalizedAddress && lockStreamId === normalizedStreamId;
  }) || null;
}

function intervalContains(interval, atIso) {
  const whenMs = Date.parse(String(atIso || ''));
  const fromMs = Date.parse(String(interval?.from || ''));
  const toMs = Date.parse(String(interval?.to || ''));
  if (!Number.isFinite(whenMs)) return false;
  if (Number.isFinite(fromMs) && whenMs < fromMs) return false;
  if (Number.isFinite(toMs) && whenMs >= toMs) return false;
  return true;
}

function resolveFixtureScheduleStatus(lockRecord, atIso) {
  const schedule = Array.isArray(lockRecord?.statusSchedule) ? lockRecord.statusSchedule : [];
  for (const interval of schedule) {
    if (!intervalContains(interval, atIso)) continue;
    return {
      locked: interval?.locked === true,
      lockedAmountAtomic: String(interval?.lockedAmountAtomic || lockRecord?.lockedAmountAtomic || ''),
      checkedAt: String(atIso || nowIso()),
      source: 'fixture_schedule',
      interval: clone(interval, {}),
    };
  }
  return {
    locked: lockRecord?.locked === true,
    lockedAmountAtomic: String(lockRecord?.lockedAmountAtomic || ''),
    checkedAt: String(atIso || nowIso()),
    source: 'fixture_default',
    interval: null,
  };
}

function resolveFixtureLockStatus({
  address = '',
  streamId = '',
  minLockAmountAtomic = '0',
  atIso = nowIso(),
} = {}) {
  const fixtureLock = resolveFixtureLockRecord({ address, streamId });
  if (!fixtureLock) return null;
  const status = resolveFixtureScheduleStatus(fixtureLock, atIso);
  const eligible = status.locked === true && amountAtLeast(status.lockedAmountAtomic, minLockAmountAtomic);
  return makeProviderResult({
    ok: true,
    locked: status.locked === true,
    eligible,
    checkedAt: status.checkedAt,
    address,
    streamId,
    tokenSymbol: String(fixtureLock?.tokenSymbol || STREAMFLOW_TOKEN_SYMBOL),
    lockedAmountAtomic: String(status.lockedAmountAtomic || '0'),
    minLockAmountAtomic,
    details: {
      source: status.source,
      interval: status.interval,
    },
  });
}

async function loadStreamflowSdkModule() {
  if (streamflowSdkModule) return streamflowSdkModule;
  if (streamflowSdkLoadError) throw streamflowSdkLoadError;
  try {
    streamflowSdkModule = require('@streamflow/stream');
    return streamflowSdkModule;
  } catch (err) {
    streamflowSdkLoadError = err;
    throw err;
  }
}

async function getStreamflowClient() {
  if (cachedClient.client && cachedClient.rpcUrl === STREAMFLOW_DEFAULT_RPC_URL) {
    return cachedClient.client;
  }
  const sdk = await loadStreamflowSdkModule();
  const ClientClass = sdk?.SolanaStreamClient;
  if (typeof ClientClass !== 'function') {
    throw new Error('STREAMFLOW_SDK_CLIENT_MISSING');
  }
  const client = new ClientClass(STREAMFLOW_DEFAULT_RPC_URL);
  cachedClient = {
    rpcUrl: STREAMFLOW_DEFAULT_RPC_URL,
    client,
  };
  return client;
}

async function withTimeout(promise, timeoutMs, code) {
  let timeoutId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(code || 'TIMEOUT');
      err.code = code || 'TIMEOUT';
      reject(err);
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function extractLiveStreamState(stream, atIso) {
  const checkedAtIso = String(atIso || nowIso());
  const checkedAtMs = Date.parse(checkedAtIso);
  const checkedAtSeconds = Number.isFinite(checkedAtMs)
    ? Math.max(0, Math.floor(checkedAtMs / 1000))
    : Math.floor(Date.now() / 1000);
  const depositedAmount = bnLikeToBigInt(stream?.depositedAmount);
  const withdrawnAmount = bnLikeToBigInt(stream?.withdrawnAmount);
  const unlockedAmount = stream && typeof stream.unlocked === 'function'
    ? bnLikeToBigInt(stream.unlocked(checkedAtSeconds))
    : 0n;
  const canceledAt = Number(stream?.canceledAt || 0);
  const closed = stream?.closed === true;
  const rawLockedAmount = depositedAmount > unlockedAmount ? depositedAmount - unlockedAmount : 0n;
  const remainingAmount = depositedAmount > withdrawnAmount ? depositedAmount - withdrawnAmount : 0n;
  const lockedAmount = (!closed && canceledAt <= 0 && rawLockedAmount > 0n) ? rawLockedAmount : 0n;
  return {
    depositedAmount,
    withdrawnAmount,
    unlockedAmount,
    remainingAmount,
    lockedAmount,
    canceledAt,
    closed,
  };
}

async function resolveLiveStreamflowLockStatus({
  address = '',
  streamId = '',
  minLockAmountAtomic = '0',
  atIso = nowIso(),
} = {}) {
  const checkedAt = String(atIso || nowIso());
  const normalizedAddress = normalizeSolanaAddress(address);
  const normalizedStreamId = normalizeLockMatchValue(streamId);
  if (!normalizedAddress || !normalizedStreamId) {
    return makeProviderResult({
      ok: false,
      locked: false,
      eligible: false,
      checkedAt,
      code: 'STREAMFLOW_LOCK_NOT_FOUND',
      address,
      streamId,
      minLockAmountAtomic,
      details: {
        source: 'streamflow_sdk',
        reason: 'missing_address_or_stream',
      },
    });
  }

  let stream = null;
  try {
    const client = await getStreamflowClient();
    stream = await withTimeout(client.getOne({ id: normalizedStreamId }), STREAMFLOW_RPC_TIMEOUT_MS, 'STREAMFLOW_PROVIDER_TIMEOUT');
  } catch (err) {
    const message = typeof err?.message === 'string' ? err.message : '';
    const code = err?.code === 'STREAMFLOW_PROVIDER_TIMEOUT'
      ? 'STREAMFLOW_PROVIDER_TIMEOUT'
      : /not found|invalid public key|account does not exist/i.test(message)
        ? 'STREAMFLOW_LOCK_NOT_FOUND'
        : 'STREAMFLOW_PROVIDER_UNAVAILABLE';
    return makeProviderResult({
      ok: false,
      locked: false,
      eligible: false,
      checkedAt,
      code,
      address: normalizedAddress,
      streamId: normalizedStreamId,
      minLockAmountAtomic,
      details: {
        source: 'streamflow_sdk',
        rpcUrl: STREAMFLOW_DEFAULT_RPC_URL,
        requiredMint: STREAMFLOW_REQUIRED_MINT || null,
        message,
      },
    });
  }

  const streamRecipient = normalizeSolanaAddress(stream?.recipient);
  const streamMint = normalizeSolanaAddress(stream?.mint);
  const streamType = typeof stream?.type === 'string' ? stream.type : 'unknown';
  const state = extractLiveStreamState(stream, checkedAt);
  const minimumAmount = BigInt(String(minLockAmountAtomic || '0') || '0');
  const recipientMatches = streamRecipient === normalizedAddress;
  const mintMatches = !STREAMFLOW_REQUIRED_MINT || streamMint === STREAMFLOW_REQUIRED_MINT;
  const eligible = recipientMatches && mintMatches && state.lockedAmount >= minimumAmount;
  const locked = state.lockedAmount > 0n && recipientMatches && mintMatches;
  let code = '';
  if (!recipientMatches) code = 'STREAMFLOW_LOCK_RECIPIENT_MISMATCH';
  else if (!mintMatches) code = 'STREAMFLOW_TOKEN_MINT_MISMATCH';
  else if (state.lockedAmount < minimumAmount) code = 'STREAMFLOW_LOCK_BELOW_MINIMUM';

  return makeProviderResult({
    ok: true,
    locked,
    eligible,
    checkedAt,
    code,
    address: normalizedAddress,
    streamId: normalizedStreamId,
    tokenSymbol: STREAMFLOW_TOKEN_SYMBOL,
    lockedAmountAtomic: state.lockedAmount.toString(10),
    minLockAmountAtomic,
    details: {
      source: 'streamflow_sdk',
      rpcUrl: STREAMFLOW_DEFAULT_RPC_URL,
      requiredMint: STREAMFLOW_REQUIRED_MINT || null,
      streamType,
      recipient: streamRecipient || null,
      mint: streamMint || null,
      depositedAmountAtomic: state.depositedAmount.toString(10),
      withdrawnAmountAtomic: state.withdrawnAmount.toString(10),
      unlockedAmountAtomic: state.unlockedAmount.toString(10),
      remainingAmountAtomic: state.remainingAmount.toString(10),
      canceledAt: state.canceledAt,
      closed: state.closed === true,
    },
  });
}

async function resolveStreamflowLockStatus({
  address = '',
  streamId = '',
  minLockAmountAtomic = '0',
  atIso = nowIso(),
} = {}) {
  const fixtureResult = resolveFixtureLockStatus({
    address,
    streamId,
    minLockAmountAtomic,
    atIso,
  });
  const mode = getProviderMode();
  if (fixtureResult && (mode === 'fixture' || mode === 'auto')) {
    return fixtureResult;
  }
  if (mode === 'fixture') {
    return makeProviderResult({
      ok: false,
      locked: false,
      eligible: false,
      checkedAt: String(atIso || nowIso()),
      code: 'STREAMFLOW_LOCK_NOT_FOUND',
      address,
      streamId,
      minLockAmountAtomic,
      details: {
        source: 'fixture_missing',
      },
    });
  }
  return resolveLiveStreamflowLockStatus({
    address,
    streamId,
    minLockAmountAtomic,
    atIso,
  });
}

module.exports = {
  getStreamflowFixtureSnapshot,
  resetStreamflowFixtureState,
  resolveStreamflowLockStatus,
  seedStreamflowFixtureState,
};
