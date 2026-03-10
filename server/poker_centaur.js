const crypto = require('crypto');

const STREAMFLOW_PROVIDER = 'streamflow';
const STREAMFLOW_TOKEN_SYMBOL = '$AGENTTOWN';
const DEFAULT_OIL_AWARD_PER_SNAPSHOT = 100;
const DEFAULT_SNAPSHOTS_PER_HOUR = 15;
const DEFAULT_CENTAUR_COUNTDOWN_SECONDS = 45;

function normalizeOilAmount(value, fallback = 0) {
  const amount = Number.parseInt(String(value == null ? '' : value), 10);
  if (!Number.isFinite(amount) || amount < 0) return fallback;
  return amount;
}

function toHourBucketStart(input = new Date().toISOString()) {
  const ms = Date.parse(String(input || ''));
  const date = Number.isFinite(ms) ? new Date(ms) : new Date();
  date.setUTCMinutes(0, 0, 0);
  return date.toISOString();
}

function buildStreamflowLockVerifyMessage({
  address = '',
  houseId = '',
  streamId = '',
  minLockAmountAtomic = '',
  nonce = '',
  origin = '',
}) {
  return [
    'AgentTown Streamflow Lock Verify',
    `provider: ${STREAMFLOW_PROVIDER}`,
    `address: ${String(address || '').trim()}`,
    `houseId: ${String(houseId || '').trim()}`,
    `streamId: ${String(streamId || '').trim()}`,
    `minLockAmountAtomic: ${String(minLockAmountAtomic || '').trim()}`,
    `origin: ${String(origin || '').trim()}`,
    `nonce: ${String(nonce || '').trim()}`,
  ].join('\n');
}

function buildSnapshotSeed(verificationId, hourBucket, index) {
  return crypto
    .createHash('sha256')
    .update(`${String(verificationId || '').trim()}:${String(hourBucket || '').trim()}:${Number(index || 0)}`)
    .digest('hex');
}

function buildDeterministicHourlySnapshotSchedule({
  verificationId = '',
  hourBucket = '',
  count = DEFAULT_SNAPSHOTS_PER_HOUR,
} = {}) {
  const startIso = toHourBucketStart(hourBucket);
  const hourStartMs = Date.parse(startIso);
  const total = Math.max(1, normalizeOilAmount(count, DEFAULT_SNAPSHOTS_PER_HOUR));
  const windowSeconds = Math.floor(3600 / total);
  const out = [];
  for (let index = 0; index < total; index += 1) {
    const seed = buildSnapshotSeed(verificationId, startIso, index);
    const offsetWithinWindow = Number.parseInt(seed.slice(0, 8), 16) % Math.max(1, windowSeconds);
    const secondOffset = (index * windowSeconds) + offsetWithinWindow;
    out.push({
      index,
      scheduledFor: new Date(hourStartMs + (secondOffset * 1000)).toISOString(),
      scheduledSecondOffset: secondOffset,
    });
  }
  out.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  return out;
}

function buildInitialCentaurHandState({
  tournamentTitle = 'Centaur Invitational',
  handNumber = 1,
  countdownSeconds = DEFAULT_CENTAUR_COUNTDOWN_SECONDS,
  now = new Date().toISOString(),
} = {}) {
  return {
    tableLabel: `${tournamentTitle} Table`,
    handNumber,
    phase: 'turn',
    blindLevel: '25 / 50',
    heroCards: ['Ah', 'Kd'],
    boardCards: ['Qs', 'Tc', '2d', '7h'],
    potOil: 150,
    requiredCallOil: 50,
    minRaiseToOil: 150,
    stackOil: 900,
    allowedActions: ['fold', 'call', 'raise'],
    countdownSeconds,
    countdownStartedAt: String(now || new Date().toISOString()),
    seatLabel: 'Centaur Seat',
    opponents: [
      { seat: 1, label: 'North Bot', stackOil: 1200, status: 'active' },
      { seat: 2, label: 'East Bot', stackOil: 860, status: 'active' },
      { seat: 4, label: 'South Bot', stackOil: 1100, status: 'active' },
      { seat: 5, label: 'West Bot', stackOil: 980, status: 'active' },
      { seat: 6, label: 'River Bot', stackOil: 760, status: 'active' },
    ],
    lastAction: null,
    result: null,
  };
}

function deriveCentaurAgentSuggestion(tableState = {}) {
  const cards = Array.isArray(tableState.heroCards) ? tableState.heroCards.map((item) => String(item || '').trim()) : [];
  const cardRanks = cards.map((card) => card.slice(0, -1));
  const allowed = new Set(Array.isArray(tableState.allowedActions) ? tableState.allowedActions.map((item) => String(item || '').trim().toLowerCase()) : []);
  const callOil = normalizeOilAmount(tableState.requiredCallOil, 0);
  const minRaiseToOil = normalizeOilAmount(tableState.minRaiseToOil, 0);

  let suggestedAction = 'check';
  let body = 'Clock is running. Keep the line low variance and preserve stack for later streets.';

  const broadways = new Set(['A', 'K', 'Q', 'J', 'T']);
  const hasBroadwayCombo = cardRanks.length >= 2 && broadways.has(cardRanks[0]) && broadways.has(cardRanks[1]);
  const isPair = cardRanks.length >= 2 && cardRanks[0] && cardRanks[0] === cardRanks[1];

  if (isPair && allowed.has('raise')) {
    suggestedAction = 'raise';
    body = `Pocket pair in a live centaur spot. Apply pressure before the ${DEFAULT_CENTAUR_COUNTDOWN_SECONDS}s clock rolls over; size to ${minRaiseToOil || 150} OIL.`;
  } else if (hasBroadwayCombo && allowed.has('raise')) {
    suggestedAction = 'raise';
    body = `Two broadway cards plus initiative pressure. Prefer a raise to ${minRaiseToOil || 150} OIL instead of a flat call.`;
  } else if (allowed.has('call') && callOil > 0) {
    suggestedAction = 'call';
    body = `Pot is priced for a disciplined continue. Call ${callOil} OIL and keep later-street options open.`;
  } else if (allowed.has('check')) {
    suggestedAction = 'check';
    body = 'Nothing forces aggression here. Check and retain maximum flexibility.';
  } else if (allowed.has('fold')) {
    suggestedAction = 'fold';
    body = 'This is below the continue threshold. Fold and preserve OIL for the next decision.';
  }

  return {
    suggestedAction,
    body,
  };
}

function applyCentaurActionToTableState(tableState = {}, { actionKind = '', amountOil = 0 } = {}) {
  const next = {
    ...(tableState && typeof tableState === 'object' ? tableState : {}),
  };
  const normalizedActionKind = String(actionKind || '').trim().toLowerCase();
  const allowed = new Set(Array.isArray(next.allowedActions) ? next.allowedActions.map((item) => String(item || '').trim().toLowerCase()) : []);
  if (!allowed.has(normalizedActionKind)) {
    const err = new Error('POKER_CENTAUR_ACTION_INVALID');
    err.code = 'POKER_CENTAUR_ACTION_INVALID';
    throw err;
  }

  let debitOil = 0;
  if (normalizedActionKind === 'call') {
    debitOil = normalizeOilAmount(next.requiredCallOil, 0);
  } else if (normalizedActionKind === 'raise' || normalizedActionKind === 'bet') {
    debitOil = Math.max(normalizeOilAmount(next.minRaiseToOil, 0), normalizeOilAmount(amountOil, 0));
  }

  const currentStack = normalizeOilAmount(next.stackOil, 0);
  if (debitOil > currentStack) {
    const err = new Error('POKER_CENTAUR_STACK_INSUFFICIENT');
    err.code = 'POKER_CENTAUR_STACK_INSUFFICIENT';
    err.requiredOil = debitOil;
    err.stackOil = currentStack;
    throw err;
  }

  next.stackOil = currentStack - debitOil;
  next.potOil = normalizeOilAmount(next.potOil, 0) + debitOil;
  next.requiredCallOil = 0;
  next.allowedActions = [];
  next.lastAction = {
    actionKind: normalizedActionKind,
    amountOil: debitOil,
  };
  next.result = {
    status: 'pending_resolution',
    note: 'Centaur decision submitted. Operator scoring or later hand progression can resolve the outcome.',
  };
  return {
    tableState: next,
    debitOil,
  };
}

module.exports = {
  DEFAULT_CENTAUR_COUNTDOWN_SECONDS,
  DEFAULT_OIL_AWARD_PER_SNAPSHOT,
  DEFAULT_SNAPSHOTS_PER_HOUR,
  STREAMFLOW_PROVIDER,
  STREAMFLOW_TOKEN_SYMBOL,
  applyCentaurActionToTableState,
  buildDeterministicHourlySnapshotSchedule,
  buildInitialCentaurHandState,
  buildStreamflowLockVerifyMessage,
  deriveCentaurAgentSuggestion,
  normalizeOilAmount,
  toHourBucketStart,
};
