const { nowIso } = require('./util');

let fixtureState = {
  locks: [],
};

function clone(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value == null ? fallback : value));
  } catch {
    return fallback;
  }
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

function normalizeLockMatchValue(value) {
  return String(value || '').trim().toLowerCase();
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

function amountAtLeast(actual, minimum) {
  const actualBig = BigInt(String(actual || '0') || '0');
  const minimumBig = BigInt(String(minimum || '0') || '0');
  return actualBig >= minimumBig;
}

function resolveStreamflowLockStatus({
  address = '',
  streamId = '',
  minLockAmountAtomic = '0',
  atIso = nowIso(),
} = {}) {
  const fixtureLock = resolveFixtureLockRecord({ address, streamId });
  if (!fixtureLock) {
    return {
      ok: false,
      provider: 'streamflow',
      locked: false,
      eligible: false,
      checkedAt: String(atIso || nowIso()),
      code: 'STREAMFLOW_LOCK_NOT_FOUND',
      details: {
        address: String(address || '').trim(),
        streamId: String(streamId || '').trim(),
      },
    };
  }

  const status = resolveFixtureScheduleStatus(fixtureLock, atIso);
  const eligible = status.locked === true && amountAtLeast(status.lockedAmountAtomic, minLockAmountAtomic);
  return {
    ok: true,
    provider: 'streamflow',
    locked: status.locked === true,
    eligible,
    checkedAt: status.checkedAt,
    streamId: String(streamId || '').trim(),
    address: String(address || '').trim(),
    tokenSymbol: String(fixtureLock?.tokenSymbol || '$AGENTTOWN'),
    lockedAmountAtomic: String(status.lockedAmountAtomic || '0'),
    minLockAmountAtomic: String(minLockAmountAtomic || '0'),
    details: {
      source: status.source,
      interval: status.interval,
    },
  };
}

module.exports = {
  getStreamflowFixtureSnapshot,
  resetStreamflowFixtureState,
  resolveStreamflowLockStatus,
  seedStreamflowFixtureState,
};
