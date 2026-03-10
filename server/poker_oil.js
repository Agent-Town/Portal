const crypto = require('crypto');
const {
  DEFAULT_OIL_AWARD_PER_SNAPSHOT,
  DEFAULT_SNAPSHOTS_PER_HOUR,
  buildDeterministicHourlySnapshotSchedule,
  toHourBucketStart,
} = require('./poker_centaur');
const { resolveStreamflowLockStatus } = require('./streamflow_adapter');

function normalizeTrimmedString(value, fallback = '') {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

function normalizeIsoOrNull(value) {
  const text = normalizeTrimmedString(value);
  const ms = Date.parse(text);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function listHourBucketsBetween(startIso, endIso) {
  const start = normalizeIsoOrNull(startIso);
  const end = normalizeIsoOrNull(endIso);
  if (!start || !end) return [];
  const startMs = Date.parse(toHourBucketStart(start));
  const endMs = Date.parse(toHourBucketStart(end));
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return [];
  const out = [];
  for (let cursor = startMs; cursor <= endMs; cursor += 60 * 60 * 1000) {
    out.push(new Date(cursor).toISOString());
  }
  return out;
}

function makeOilSnapshotId(verificationId, scheduledFor) {
  const digest = crypto
    .createHash('sha256')
    .update(`${String(verificationId || '').trim()}:${String(scheduledFor || '').trim()}`)
    .digest('hex');
  return `oilsnap_${digest.slice(0, 16)}`;
}

function buildCurrentHourSnapshotState(verification, snapshotEvents, atIso) {
  if (!verification?.verificationId) {
    return {
      hourBucket: toHourBucketStart(atIso),
      slots: [],
    };
  }
  const hourBucket = toHourBucketStart(atIso);
  const slots = buildDeterministicHourlySnapshotSchedule({
    verificationId: verification.verificationId,
    hourBucket,
    count: Number(verification?.raw?.snapshotsPerHour || DEFAULT_SNAPSHOTS_PER_HOUR),
  });
  const eventByScheduledFor = new Map(
    (Array.isArray(snapshotEvents) ? snapshotEvents : []).map((event) => [String(event.scheduledFor || ''), event])
  );
  return {
    hourBucket,
    slots: slots.map((slot) => {
      const event = eventByScheduledFor.get(String(slot.scheduledFor || ''));
      return {
        index: slot.index,
        scheduledFor: slot.scheduledFor,
        status: event?.status || 'pending',
        amountAwarded: Number(event?.amountAwarded || 0),
      };
    }),
  };
}

async function processOilSnapshotsForVerification(deps, verification, { asOf = null } = {}) {
  if (!verification?.verificationId || !verification?.walletSubject || !verification?.address || !verification?.streamId) {
    return {
      processedSnapshots: 0,
      creditedOil: 0,
      snapshotEvents: [],
      latestProviderStatus: null,
    };
  }
  const asOfIso = normalizeIsoOrNull(asOf) || deps.nowIso();
  const verifiedAtIso = normalizeIsoOrNull(verification.verifiedAt || verification.createdAt || asOfIso) || asOfIso;
  const hourBuckets = listHourBucketsBetween(verifiedAtIso, asOfIso);
  let processedSnapshots = 0;
  let creditedOil = 0;
  let latestProviderStatus = null;
  const snapshotEvents = [];

  for (const hourBucket of hourBuckets) {
    const schedule = buildDeterministicHourlySnapshotSchedule({
      verificationId: verification.verificationId,
      hourBucket,
      count: Number(verification?.raw?.snapshotsPerHour || DEFAULT_SNAPSHOTS_PER_HOUR),
    });
    for (const slot of schedule) {
      const scheduledMs = Date.parse(String(slot?.scheduledFor || ''));
      const verifiedAtMs = Date.parse(verifiedAtIso);
      const asOfMs = Date.parse(asOfIso);
      if (!Number.isFinite(scheduledMs) || scheduledMs > asOfMs || scheduledMs < verifiedAtMs) continue;

      const existing = deps.getOilSnapshotEventByVerificationAndScheduledFor(verification.verificationId, slot.scheduledFor);
      if (existing) {
        snapshotEvents.push(existing);
        continue;
      }

      const providerStatus = await resolveStreamflowLockStatus({
        address: verification.address,
        streamId: verification.streamId,
        minLockAmountAtomic: verification.minLockAmountAtomic,
        atIso: slot.scheduledFor,
      });
      latestProviderStatus = providerStatus;
      const amountAwarded = providerStatus.eligible ? DEFAULT_OIL_AWARD_PER_SNAPSHOT : 0;
      const status = providerStatus.eligible
        ? 'credited'
        : providerStatus.locked
          ? 'below_minimum'
          : 'not_locked';
      const snapshot = deps.upsertOilSnapshotEvent({
        snapshotId: makeOilSnapshotId(verification.verificationId, slot.scheduledFor),
        verificationId: verification.verificationId,
        walletSubject: verification.walletSubject,
        houseId: verification.houseId || null,
        hourBucket,
        scheduledFor: slot.scheduledFor,
        checkedAt: providerStatus.checkedAt || asOfIso,
        status,
        amountAwarded,
        providerStatus,
      });
      snapshotEvents.push(snapshot);
      processedSnapshots += 1;
      if (amountAwarded > 0) {
        deps.createOilLedgerEntry({
          walletSubject: verification.walletSubject,
          houseId: verification.houseId || null,
          verificationId: verification.verificationId,
          snapshotId: snapshot.snapshotId,
          entryKind: 'streamflow_snapshot',
          direction: 'credit',
          amount: amountAwarded,
          memo: `Verified Streamflow lock at ${slot.scheduledFor}`,
        });
        creditedOil += amountAwarded;
      }
    }
  }

  if (latestProviderStatus) {
    deps.upsertStreamflowVerification({
      ...verification,
      verifiedAmountAtomic: String(latestProviderStatus.lockedAmountAtomic || verification.verifiedAmountAtomic || '0'),
      lastCheckedAt: latestProviderStatus.checkedAt || asOfIso,
      raw: {
        ...(verification.raw || {}),
        latestProviderStatus,
      },
      updatedAt: deps.nowIso(),
    });
  }

  return {
    processedSnapshots,
    creditedOil,
    snapshotEvents,
    latestProviderStatus,
  };
}

async function runOilSnapshotSweep(deps, { asOf = null, limit = 500 } = {}) {
  const asOfIso = normalizeIsoOrNull(asOf) || deps.nowIso();
  const verifications = typeof deps.listActiveStreamflowVerifications === 'function'
    ? deps.listActiveStreamflowVerifications({ limit })
    : [];
  const results = [];
  let processedSnapshots = 0;
  let creditedOil = 0;
  let errorCount = 0;
  for (const verification of verifications) {
    try {
      const processed = await processOilSnapshotsForVerification(deps, verification, { asOf: asOfIso });
      processedSnapshots += Number(processed?.processedSnapshots || 0);
      creditedOil += Number(processed?.creditedOil || 0);
      results.push({
        verificationId: verification.verificationId,
        walletSubject: verification.walletSubject,
        processedSnapshots: Number(processed?.processedSnapshots || 0),
        creditedOil: Number(processed?.creditedOil || 0),
      });
    } catch (error) {
      errorCount += 1;
      results.push({
        verificationId: verification.verificationId,
        walletSubject: verification.walletSubject,
        processedSnapshots: 0,
        creditedOil: 0,
        error: error && typeof error.message === 'string' ? error.message : 'unknown_error',
      });
    }
  }
  return {
    asOf: asOfIso,
    verificationCount: verifications.length,
    processedSnapshots,
    creditedOil,
    errorCount,
    results,
  };
}

module.exports = {
  buildCurrentHourSnapshotState,
  normalizeIsoOrNull,
  processOilSnapshotsForVerification,
  runOilSnapshotSweep,
};
