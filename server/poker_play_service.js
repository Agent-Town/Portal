const {
  DEFAULT_PLAY_ACTION_COUNTDOWN_SECONDS,
  POKER_PLAY_MAX_SEATS,
  applyPokerPlayActionToHandState,
  createInitialPokerPlayHandState,
  derivePokerPlayAgentSuggestion,
  getSeatAllowedActions,
  getSeatCallAmount,
  normalizeOilAmount,
  normalizeSeatNumber,
  pickTimeoutAction,
} = require('./poker_play');

const DEFAULT_PLAY_PRESENCE_TIMEOUT_SECONDS = 30;
const DEFAULT_PLAY_RECONNECT_GRACE_SECONDS = 90;

function createRouteError(status, code, message, details = {}) {
  const err = new Error(message);
  err.status = Number(status || 500);
  err.code = String(code || 'INTERNAL_ERROR');
  err.details = details && typeof details === 'object' ? details : {};
  return err;
}

function cloneJson(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value == null ? fallback : value));
  } catch {
    return fallback;
  }
}

function normalizeTrimmedString(value, fallback = '') {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

function normalizePokerPlayDisplayName(value, fallback = 'Table Player') {
  return normalizeTrimmedString(value, fallback).slice(0, 80);
}

function normalizePokerPlayMessageBody(value) {
  const body = normalizeTrimmedString(value);
  return body ? body.slice(0, 800) : '';
}

function normalizePokerPlayDisputeCategory(value, fallback = 'general') {
  const category = normalizeTrimmedString(value, fallback).toLowerCase();
  const allowed = new Set([
    'general',
    'rule_misread',
    'bet_size',
    'turn_order',
    'disconnect',
    'settlement',
    'conduct',
    'other',
  ]);
  return allowed.has(category) ? category : fallback;
}

function normalizePokerPlayDisputeNote(value) {
  const note = normalizeTrimmedString(value);
  return note ? note.slice(0, 800) : '';
}

function normalizePokerPlayDisputeResolutionStatus(value, fallback = '') {
  const status = normalizeTrimmedString(value, fallback).toLowerCase();
  return status === 'resolved' || status === 'dismissed' ? status : fallback;
}

function normalizePokerPlayAuditActorRole(value, fallback = 'system') {
  const role = normalizeTrimmedString(value, fallback).toLowerCase();
  return ['human', 'agent', 'operator', 'system'].includes(role) ? role : fallback;
}

function normalizePokerPlayTableType(value, fallback = 'cash') {
  const type = normalizeTrimmedString(value, fallback).toLowerCase();
  return type === 'tournament' ? 'tournament' : 'cash';
}

function normalizeSeatCount(value, fallback = POKER_PLAY_MAX_SEATS) {
  const seats = normalizeOilAmount(value, fallback);
  return Math.max(2, Math.min(POKER_PLAY_MAX_SEATS, seats || fallback));
}

function buildTournamentBlindLevels(smallBlindOil, bigBlindOil) {
  const baseSmallBlind = Math.max(1, normalizeOilAmount(smallBlindOil, 50));
  const baseBigBlind = Math.max(baseSmallBlind * 2, normalizeOilAmount(bigBlindOil, 100));
  const levels = [
    [baseSmallBlind, baseBigBlind],
    [Math.ceil(baseSmallBlind * 1.5), Math.ceil(baseBigBlind * 1.5)],
    [baseSmallBlind * 2, baseBigBlind * 2],
    [baseSmallBlind * 3, baseBigBlind * 3],
    [baseSmallBlind * 4, baseBigBlind * 4],
    [baseSmallBlind * 6, baseBigBlind * 6],
  ];
  return levels.map(([levelSmallBlind, levelBigBlind], index) => ({
    level: index + 1,
    smallBlindOil: Math.max(1, normalizeOilAmount(levelSmallBlind, baseSmallBlind)),
    bigBlindOil: Math.max(
      Math.max(1, normalizeOilAmount(levelSmallBlind, baseSmallBlind)) * 2,
      normalizeOilAmount(levelBigBlind, baseBigBlind)
    ),
  }));
}

function normalizeTournamentBlindLevels(levels, fallbackSmallBlind, fallbackBigBlind) {
  const items = Array.isArray(levels) ? levels : [];
  const normalized = items
    .map((level, index) => {
      const smallBlindOil = Math.max(1, normalizeOilAmount(level?.smallBlindOil, 0));
      const bigBlindOil = Math.max(smallBlindOil * 2, normalizeOilAmount(level?.bigBlindOil, 0));
      if (!smallBlindOil || !bigBlindOil) return null;
      return {
        level: index + 1,
        smallBlindOil,
        bigBlindOil,
      };
    })
    .filter(Boolean);
  return normalized.length ? normalized : buildTournamentBlindLevels(fallbackSmallBlind, fallbackBigBlind);
}

function slugifySegment(value, fallback = 'table') {
  const base = normalizeTrimmedString(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || fallback;
}

function normalizeCreateTableConfig(input = {}) {
  const tableType = normalizePokerPlayTableType(input?.tableType);
  const smallBlindOil = Math.max(1, normalizeOilAmount(input?.smallBlindOil, tableType === 'cash' ? 10 : 50));
  const bigBlindOil = Math.max(smallBlindOil * 2, normalizeOilAmount(input?.bigBlindOil, tableType === 'cash' ? 20 : 100));
  const buyInOil = Math.max(bigBlindOil * 10, normalizeOilAmount(input?.buyInOil, tableType === 'cash' ? 400 : 300));
  const maxSeats = normalizeSeatCount(input?.maxSeats, POKER_PLAY_MAX_SEATS);
  const minPlayers = Math.max(2, Math.min(maxSeats, normalizeOilAmount(input?.minPlayers, 2)));
  const countdownSeconds = Math.max(10, normalizeOilAmount(input?.decisionCountdownSeconds, DEFAULT_PLAY_ACTION_COUNTDOWN_SECONDS));
  const presenceTimeoutSeconds = Math.max(10, normalizeOilAmount(input?.presenceTimeoutSeconds, DEFAULT_PLAY_PRESENCE_TIMEOUT_SECONDS));
  const reconnectGraceSeconds = Math.max(10, normalizeOilAmount(input?.reconnectGraceSeconds, DEFAULT_PLAY_RECONNECT_GRACE_SECONDS));
  const lateRegistrationHands = tableType === 'tournament'
    ? Math.max(0, normalizeOilAmount(input?.lateRegistrationHands, 2))
    : 0;
  const handsPerBlindLevel = tableType === 'tournament'
    ? Math.max(1, normalizeOilAmount(input?.handsPerBlindLevel, 2))
    : 0;
  const blindLevels = tableType === 'tournament'
    ? normalizeTournamentBlindLevels(input?.blindLevels, smallBlindOil, bigBlindOil)
    : [];
  const title = normalizeTrimmedString(
    input?.title,
    tableType === 'cash'
      ? `6-Max Cash ${smallBlindOil}/${bigBlindOil}`
      : `6-Max Tournament ${smallBlindOil}/${bigBlindOil}`
  ).slice(0, 96);
  const seriesId = tableType === 'tournament'
    ? normalizeTrimmedString(input?.seriesId)
    : '';
  const seriesTitle = tableType === 'tournament'
    ? normalizeTrimmedString(input?.seriesTitle, title).slice(0, 96)
    : '';
  return {
    tableType,
    smallBlindOil,
    bigBlindOil,
    buyInOil,
    maxSeats,
    minPlayers,
    decisionCountdownSeconds: countdownSeconds,
    presenceTimeoutSeconds,
    reconnectGraceSeconds,
    lateRegistrationHands,
    handsPerBlindLevel,
    blindLevels,
    title,
    seriesId,
    seriesTitle,
  };
}

function resolveTournamentBlindProgress(table, handNumber = 1) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    return {
      blindLevel: 0,
      handsPerBlindLevel: 0,
      smallBlindOil: Math.max(1, normalizeOilAmount(table?.smallBlindOil, 10)),
      bigBlindOil: Math.max(2, normalizeOilAmount(table?.bigBlindOil, 20)),
      levels: [],
      handsUntilIncrease: 0,
      nextBlindLevel: 0,
    };
  }
  const currentHandNumber = Math.max(1, normalizeOilAmount(handNumber, 1));
  const handsPerBlindLevel = Math.max(1, normalizeOilAmount(table?.rules?.handsPerBlindLevel, 2));
  const levels = normalizeTournamentBlindLevels(table?.rules?.blindLevels, table?.smallBlindOil, table?.bigBlindOil);
  const levelIndex = Math.min(levels.length - 1, Math.floor((currentHandNumber - 1) / handsPerBlindLevel));
  const level = levels[levelIndex] || levels[0];
  const nextLevel = levels[levelIndex + 1] || null;
  const nextLevelStartsAtHand = nextLevel ? (levelIndex + 1) * handsPerBlindLevel + 1 : 0;
  return {
    blindLevel: Number(level?.level || levelIndex + 1),
    handsPerBlindLevel,
    smallBlindOil: Math.max(1, normalizeOilAmount(level?.smallBlindOil, table?.smallBlindOil)),
    bigBlindOil: Math.max(2, normalizeOilAmount(level?.bigBlindOil, table?.bigBlindOil)),
    levels,
    handsUntilIncrease: nextLevelStartsAtHand ? Math.max(0, nextLevelStartsAtHand - currentHandNumber) : 0,
    nextBlindLevel: nextLevel ? Number(nextLevel.level || levelIndex + 2) : 0,
  };
}

function buildMatchKey(config) {
  const base = [
    normalizePokerPlayTableType(config?.tableType),
    `sb${Math.max(1, normalizeOilAmount(config?.smallBlindOil, 0))}`,
    `bb${Math.max(2, normalizeOilAmount(config?.bigBlindOil, 0))}`,
    `bi${Math.max(1, normalizeOilAmount(config?.buyInOil, 0))}`,
    `mx${normalizeSeatCount(config?.maxSeats, POKER_PLAY_MAX_SEATS)}`,
    `mn${Math.max(2, normalizeOilAmount(config?.minPlayers, 2))}`,
  ];
  if (normalizePokerPlayTableType(config?.tableType) === 'tournament') {
    const blindLevels = normalizeTournamentBlindLevels(config?.blindLevels, config?.smallBlindOil, config?.bigBlindOil);
    base.push(`hbl${Math.max(1, normalizeOilAmount(config?.handsPerBlindLevel, 2))}`);
    base.push(`bl${blindLevels.map((level) => `${level.smallBlindOil}-${level.bigBlindOil}`).join('_')}`);
    base.push(`lr${Math.max(0, normalizeOilAmount(config?.lateRegistrationHands, 0))}`);
  }
  base.push(`pt${Math.max(10, normalizeOilAmount(config?.presenceTimeoutSeconds, DEFAULT_PLAY_PRESENCE_TIMEOUT_SECONDS))}`);
  base.push(`rg${Math.max(10, normalizeOilAmount(config?.reconnectGraceSeconds, DEFAULT_PLAY_RECONNECT_GRACE_SECONDS))}`);
  return base.join(':');
}

function buildMatchKeyFromTable(table) {
  return buildMatchKey({
    tableType: table?.tableType,
    smallBlindOil: table?.smallBlindOil,
    bigBlindOil: table?.bigBlindOil,
    buyInOil: table?.buyInOil,
    maxSeats: table?.maxSeats,
    minPlayers: table?.minPlayers,
    handsPerBlindLevel: table?.rules?.handsPerBlindLevel,
    blindLevels: table?.rules?.blindLevels,
    lateRegistrationHands: table?.rules?.lateRegistrationHands,
    presenceTimeoutSeconds: table?.rules?.presenceTimeoutSeconds,
    reconnectGraceSeconds: table?.rules?.reconnectGraceSeconds,
  });
}

function getTournamentSeriesRef(table) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    return {
      seriesId: '',
      seriesTitle: '',
      matchKey: '',
    };
  }
  return {
    seriesId: normalizeTrimmedString(table?.rules?.seriesId || table?.summary?.seriesId),
    seriesTitle: normalizeTrimmedString(table?.rules?.seriesTitle || table?.summary?.seriesTitle || table?.title, table?.title || 'Tournament Series'),
    matchKey: normalizeTrimmedString(table?.rules?.matchKey || table?.summary?.matchKey || buildMatchKeyFromTable(table)),
  };
}

function getSessionHouseId(session) {
  return normalizeTrimmedString(session?.houseCeremony?.houseId);
}

function toProcessIso(deps, value) {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : deps.nowIso();
}

function isSeatPendingCashout(seat) {
  return !!seat && seat.status === 'pending_cashout';
}

function isTablePaused(table) {
  return normalizeTrimmedString(table?.status, 'open').toLowerCase() === 'paused';
}

function isSeriesClosedTable(table) {
  return normalizeTrimmedString(table?.status).toLowerCase() === 'series_closed';
}

function isSeatInPlay(seat) {
  return !!seat && (seat.status === 'active' || seat.status === 'registered' || isSeatPendingCashout(seat)) && Number(seat.stackOil || 0) > 0;
}

function getPokerPlayPresenceTimeoutSeconds(table) {
  return Math.max(10, normalizeOilAmount(table?.rules?.presenceTimeoutSeconds, DEFAULT_PLAY_PRESENCE_TIMEOUT_SECONDS));
}

function getPokerPlayReconnectGraceSeconds(table) {
  return Math.max(10, normalizeOilAmount(table?.rules?.reconnectGraceSeconds, DEFAULT_PLAY_RECONNECT_GRACE_SECONDS));
}

function resolveTournamentLateRegistration(table, hand) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    return {
      open: false,
      lateRegistrationHands: 0,
      remainingHands: 0,
    };
  }
  const lateRegistrationHands = Math.max(0, normalizeOilAmount(table?.rules?.lateRegistrationHands, 0));
  if (!lateRegistrationHands) {
    return {
      open: false,
      lateRegistrationHands,
      remainingHands: 0,
    };
  }
  const currentHandNumber = Math.max(0, normalizeOilAmount(hand?.handNumber, normalizeOilAmount(table?.state?.activeHandNumber, 0)));
  if (!currentHandNumber) {
    return {
      open: true,
      lateRegistrationHands,
      remainingHands: lateRegistrationHands,
    };
  }
  const remainingHands = Math.max(0, (lateRegistrationHands - currentHandNumber) + 1);
  return {
    open: remainingHands > 0,
    lateRegistrationHands,
    remainingHands,
  };
}

function getSeatPresenceStatus(seat) {
  if (!isSeatInPlay(seat)) return 'inactive';
  return seat?.disconnectedAt ? 'disconnected' : 'online';
}

function formatSeatLabel(seatNumber, displayName = '') {
  const seat = normalizeSeatNumber(seatNumber);
  if (!seat) return displayName || 'Seat';
  return displayName ? `Seat ${seat} (${displayName})` : `Seat ${seat}`;
}

function buildActionNarrative(actionKind, amountOil) {
  const action = normalizeTrimmedString(actionKind).toLowerCase();
  if (action === 'fold') return 'folds';
  if (action === 'check') return 'checks';
  if (action === 'call') return `calls ${Number(amountOil || 0)} OIL`;
  if (action === 'bet') return `bets to ${Number(amountOil || 0)} OIL`;
  if (action === 'raise') return `raises to ${Number(amountOil || 0)} OIL`;
  return action || 'acts';
}

function getSeatMap(seats) {
  const out = new Map();
  for (const seat of Array.isArray(seats) ? seats : []) {
    const seatNumber = normalizeSeatNumber(seat?.seatNumber);
    if (!seatNumber) continue;
    out.set(seatNumber, seat);
  }
  return out;
}

function getActiveSeatRows(seats) {
  return (Array.isArray(seats) ? seats : []).filter(isSeatInPlay).sort((left, right) => left.seatNumber - right.seatNumber);
}

function compareIsoAsc(left, right) {
  const leftMs = Date.parse(String(left || ''));
  const rightMs = Date.parse(String(right || ''));
  const leftFinite = Number.isFinite(leftMs);
  const rightFinite = Number.isFinite(rightMs);
  if (leftFinite && rightFinite && leftMs !== rightMs) return leftMs - rightMs;
  if (leftFinite !== rightFinite) return leftFinite ? -1 : 1;
  return String(left || '').localeCompare(String(right || ''));
}

function compareIsoDesc(left, right) {
  return compareIsoAsc(right, left);
}

function getTournamentSeatIdentity(seat) {
  return `${normalizeTrimmedString(seat?.walletSubject)}:${normalizeTrimmedString(seat?.tableId)}:${normalizeSeatNumber(seat?.seatNumber)}`;
}

function getTournamentAllSeats(entries) {
  return (Array.isArray(entries) ? entries : [])
    .flatMap((entry) => Array.isArray(entry?.seats) ? entry.seats : [])
    .filter(Boolean);
}

function computeTournamentPrizePoolOil(seats) {
  return (Array.isArray(seats) ? seats : []).reduce((sum, seat) => sum + Math.max(0, Number(seat?.buyInOil || 0)), 0);
}

function buildTournamentPayoutPlan({ entrantCount, prizePoolOil }) {
  const entrants = Math.max(0, normalizeOilAmount(entrantCount, 0));
  const prizePool = Math.max(0, normalizeOilAmount(prizePoolOil, 0));
  let payoutModel = 'winner_take_all';
  let percents = [100];
  if (entrants >= 6) {
    payoutModel = 'top3_50_30_20';
    percents = [50, 30, 20];
  } else if (entrants >= 3) {
    payoutModel = 'top2_70_30';
    percents = [70, 30];
  }
  const paidPlaces = Math.min(entrants, percents.length);
  const payouts = [];
  let allocated = 0;
  for (let index = 0; index < paidPlaces; index += 1) {
    const percent = Number(percents[index] || 0);
    const isLast = index === paidPlaces - 1;
    const amountOil = isLast
      ? Math.max(0, prizePool - allocated)
      : Math.max(0, Math.floor((prizePool * percent) / 100));
    allocated += amountOil;
    payouts.push({
      place: index + 1,
      percent,
      amountOil,
    });
  }
  return {
    entrantCount: entrants,
    prizePoolOil: prizePool,
    payoutModel,
    paidPlaces,
    payouts,
  };
}

function sortSeatsByTournamentElimination(seats) {
  return (Array.isArray(seats) ? seats : [])
    .slice()
    .sort((left, right) => {
      const eliminatedDelta = compareIsoDesc(
        left?.eliminatedAt || left?.updatedAt || '',
        right?.eliminatedAt || right?.updatedAt || ''
      );
      if (eliminatedDelta !== 0) return eliminatedDelta;
      const prizeDelta = Number(right?.prizeOil || 0) - Number(left?.prizeOil || 0);
      if (prizeDelta !== 0) return prizeDelta;
      const tableDelta = String(left?.tableId || '').localeCompare(String(right?.tableId || ''));
      if (tableDelta !== 0) return tableDelta;
      return normalizeSeatNumber(left?.seatNumber) - normalizeSeatNumber(right?.seatNumber);
    });
}

function buildCompletedTournamentPlacements(entries) {
  const seats = getTournamentAllSeats(entries);
  if (!seats.length) return [];
  const activeSeats = getActiveSeatRows(seats);
  let winnerSeat = activeSeats[0] || null;
  if (!winnerSeat) {
    winnerSeat = seats
      .filter((seat) => Number(seat?.prizeOil || 0) > 0)
      .slice()
      .sort((left, right) => {
        const prizeDelta = Number(right?.prizeOil || 0) - Number(left?.prizeOil || 0);
        if (prizeDelta !== 0) return prizeDelta;
        return compareIsoAsc(left?.payoutSettledAt || left?.updatedAt || '', right?.payoutSettledAt || right?.updatedAt || '');
      })[0] || null;
  }
  const seen = new Set();
  const ordered = [];
  if (winnerSeat) {
    ordered.push(winnerSeat);
    seen.add(getTournamentSeatIdentity(winnerSeat));
  }
  const paidSeats = seats
    .filter((seat) => Number(seat?.prizeOil || 0) > 0 && !seen.has(getTournamentSeatIdentity(seat)))
    .slice()
    .sort((left, right) => {
      const prizeDelta = Number(right?.prizeOil || 0) - Number(left?.prizeOil || 0);
      if (prizeDelta !== 0) return prizeDelta;
      return compareIsoAsc(left?.payoutSettledAt || left?.updatedAt || '', right?.payoutSettledAt || right?.updatedAt || '');
    });
  for (const seat of paidSeats) {
    ordered.push(seat);
    seen.add(getTournamentSeatIdentity(seat));
  }
  const eliminatedSeats = sortSeatsByTournamentElimination(
    seats.filter((seat) => !seen.has(getTournamentSeatIdentity(seat)))
  );
  for (const seat of eliminatedSeats) {
    ordered.push(seat);
  }
  return ordered.map((seat, index) => ({
    place: index + 1,
    tableId: seat.tableId,
    seatNumber: normalizeSeatNumber(seat?.seatNumber),
    displayName: seat?.displayName || formatSeatLabel(seat?.seatNumber),
    houseId: seat?.houseId || null,
    walletSubject: seat?.walletSubject || '',
    status: seat?.status || 'busted',
    prizeOil: Number(seat?.prizeOil || 0),
    eliminatedAt: seat?.eliminatedAt || null,
    payoutSettledAt: seat?.payoutSettledAt || null,
  }));
}

function computeBuyInOil(table, requestedBuyInOil) {
  const minimum = Math.max(1, normalizeOilAmount(table?.buyInOil, 0));
  const requested = normalizeOilAmount(requestedBuyInOil, minimum);
  if (String(table?.tableType || 'cash') === 'cash') {
    return Math.max(minimum, requested);
  }
  return minimum;
}

function computeTableSummary(table, seats, hand, viewerSeat) {
  const activeSeats = getActiveSeatRows(seats);
  const disconnectedSeatCount = activeSeats.filter((seat) => getSeatPresenceStatus(seat) === 'disconnected').length;
  const handNumber = Number(hand?.handNumber || 0);
  const blindProgress = resolveTournamentBlindProgress(table, handNumber > 0 ? handNumber : Number(table?.state?.activeHandNumber || 1));
  const lateRegistration = resolveTournamentLateRegistration(table, hand);
  return {
    occupancy: activeSeats.length,
    openSeatCount: Math.max(0, Number(table?.maxSeats || POKER_PLAY_MAX_SEATS) - activeSeats.length),
    disconnectedSeatCount,
    liveHand: !!hand && hand.status === 'live',
    handNumber,
    actingSeat: normalizeSeatNumber(hand?.state?.actingSeat),
    viewerSeatNumber: normalizeSeatNumber(viewerSeat?.seatNumber),
    completedAt: table?.state?.completedAt || null,
    winnerSeatNumber: normalizeSeatNumber(table?.state?.winnerSeatNumber),
    blindLevel: blindProgress.blindLevel,
    nextBlindLevel: blindProgress.nextBlindLevel,
    handsUntilBlindIncrease: blindProgress.handsUntilIncrease,
    lateRegistrationOpen: lateRegistration.open,
    lateRegistrationRemainingHands: lateRegistration.remainingHands,
  };
}

function buildDynamicTableSummary(config, matchKey) {
  const summary = {
    headline: config.tableType === 'cash'
      ? 'Open cash table with private human + agent seat threads.'
      : 'Six-max tournament with a real payout ladder and private human + agent seat threads.',
    matchKey,
    origin: 'dynamic',
  };
  if (config.tableType === 'tournament') {
    summary.seriesId = normalizeTrimmedString(config?.seriesId);
    summary.seriesTitle = normalizeTrimmedString(config?.seriesTitle, config?.title);
  }
  return summary;
}

function buildTournamentEconomics(entries) {
  const seats = getTournamentAllSeats(entries);
  const uniqueWallets = new Set();
  for (const seat of seats) {
    const walletSubject = normalizeTrimmedString(seat?.walletSubject);
    if (walletSubject) uniqueWallets.add(walletSubject);
  }
  const payoutPlan = buildTournamentPayoutPlan({
    entrantCount: uniqueWallets.size,
    prizePoolOil: computeTournamentPrizePoolOil(seats),
  });
  const completed = getActiveSeatRows(seats).length <= 1 && payoutPlan.entrantCount > 1;
  return {
    ...payoutPlan,
    completed,
    standings: completed ? buildCompletedTournamentPlacements(entries) : [],
  };
}

function buildPokerPlaySeriesSummary(entries, viewerWalletSubject = '') {
  const items = Array.isArray(entries) ? entries : [];
  if (!items.length) return null;
  const leadTable = items.find((entry) => !isSeriesClosedTable(entry?.table))?.table || items[0]?.table || null;
  const ref = getTournamentSeriesRef(leadTable);
  const activeEntries = items.map((entry) => ({
    ...entry,
    activeSeats: getActiveSeatRows(entry?.seats),
    live: !!(entry?.hand && entry.hand.status === 'live'),
  }));
  const directorPolicy = buildTournamentSeriesDirectorPolicy(activeEntries);
  const economics = buildTournamentEconomics(items);
  const uniqueWallets = new Set();
  let tableCount = 0;
  let liveTableCount = 0;
  let completedTableCount = 0;
  let closedTableCount = 0;
  let openSeatCount = 0;
  let lateRegistrationOpen = false;
  let currentUserTableId = '';
  const tableIds = [];
  const navigableEntries = items.filter((entry) => !isSeriesClosedTable(entry?.table));

  for (const entry of items) {
    const table = entry?.table || null;
    if (!table) continue;
    if (isSeriesClosedTable(table)) {
      closedTableCount += 1;
      continue;
    }
    const summary = entry?.summary || computeTableSummary(table, entry?.seats, entry?.hand, entry?.viewerSeat || null);
    tableCount += 1;
    tableIds.push(String(table.tableId || ''));
    openSeatCount += Number(summary?.openSeatCount || 0);
    if (summary?.liveHand) liveTableCount += 1;
    if (summary?.completedAt) completedTableCount += 1;
    if (summary?.lateRegistrationOpen && Number(summary?.openSeatCount || 0) > 0) {
      lateRegistrationOpen = true;
    }
    for (const seat of Array.isArray(entry?.seats) ? entry.seats : []) {
      const walletSubject = normalizeTrimmedString(seat?.walletSubject);
      if (walletSubject) uniqueWallets.add(walletSubject);
    }
    if (!currentUserTableId && normalizeTrimmedString(viewerWalletSubject) && normalizeTrimmedString(entry?.viewerSeat?.walletSubject) === normalizeTrimmedString(viewerWalletSubject)) {
      currentUserTableId = String(table.tableId || '');
    }
  }

  let stage = 'seating';
  if (completedTableCount === tableCount && liveTableCount === 0 && !lateRegistrationOpen) {
    stage = 'completed';
  } else if (directorPolicy.needsRebalance && !lateRegistrationOpen) {
    stage = 'table_break';
  } else if (tableCount > 1 && liveTableCount <= 1 && !lateRegistrationOpen) {
    stage = 'finalizing';
  } else if (lateRegistrationOpen) {
    stage = 'registration_open';
  } else if (liveTableCount > 0) {
    stage = 'in_play';
  }

  const activeTableId = currentUserTableId
    || String(navigableEntries.find((entry) => entry?.summary?.liveHand)?.table?.tableId || '')
    || String(navigableEntries.find((entry) => Number(entry?.summary?.openSeatCount || 0) > 0)?.table?.tableId || '')
    || String(leadTable?.tableId || '');

  return {
    seriesId: ref.seriesId || String(leadTable?.tableId || ''),
    seriesTitle: ref.seriesTitle || String(leadTable?.title || 'Tournament Series'),
    matchKey: ref.matchKey,
    tableCount,
    liveTableCount,
    completedTableCount,
    closedTableCount,
    entrantCount: uniqueWallets.size,
    openSeatCount,
    lateRegistrationOpen,
    stage,
    targetTableCount: directorPolicy.targetTableCount,
    needsRebalance: directorPolicy.needsRebalance,
    pendingBreakTableId: directorPolicy.pendingBreakTableId,
    pendingBreakSeatCount: directorPolicy.pendingBreakSeatCount,
    pendingBreakBlockedByLiveTable: directorPolicy.pendingBreakBlockedByLiveTable,
    prizePoolOil: economics.prizePoolOil,
    payoutModel: economics.payoutModel,
    paidPlaces: economics.paidPlaces,
    payouts: economics.payouts,
    standings: economics.standings,
    currentUserTableId: currentUserTableId || null,
    activeTableId: activeTableId || null,
    tableIds: tableIds.filter(Boolean),
  };
}

function listExistingTournamentSeriesTables(deps, matchKey, { processAt, includeClosed = false } = {}) {
  const targetMatchKey = normalizeTrimmedString(matchKey);
  return deps.listPokerPlayTables()
    .map((table) => syncPokerPlayTable(deps, table.tableId, { processAt }))
    .filter((synced) => normalizePokerPlayTableType(synced?.table?.tableType) === 'tournament')
    .filter((synced) => includeClosed || !isSeriesClosedTable(synced?.table))
    .filter((synced) => getTournamentSeriesRef(synced.table).matchKey === targetMatchKey);
}

function listTournamentSeriesEntriesDirect(deps, matchKey, { includeClosed = false } = {}) {
  const targetMatchKey = normalizeTrimmedString(matchKey);
  return deps.listPokerPlayTables()
    .filter((table) => normalizePokerPlayTableType(table?.tableType) === 'tournament')
    .filter((table) => includeClosed || !isSeriesClosedTable(table))
    .filter((table) => getTournamentSeriesRef(table).matchKey === targetMatchKey)
    .map((table) => ({
      table,
      seats: deps.listPokerPlaySeatsByTable(table.tableId),
      hand: deps.getCurrentPokerPlayHandForTable(table.tableId),
    }));
}

function shouldRevealCards({ viewerSeatNumber, hand, seatState }) {
  if (!seatState) return false;
  if (normalizeSeatNumber(seatState.seatNumber) === normalizeSeatNumber(viewerSeatNumber)) return true;
  if (hand?.status !== 'settled') return false;
  if (hand?.result?.type === 'showdown') return seatState.folded !== true;
  if (hand?.result?.type === 'walk') {
    const winners = Array.isArray(hand?.result?.winningSeatNumbers) ? hand.result.winningSeatNumbers.map((seat) => normalizeSeatNumber(seat)) : [];
    return winners.includes(normalizeSeatNumber(seatState.seatNumber));
  }
  return false;
}

function sanitizeSeatForViewer({ seat, hand, viewerSeatNumber }) {
  const seatNumber = normalizeSeatNumber(seat?.seatNumber);
  const stateSeat = hand?.state?.seatStates?.[String(seatNumber)] || null;
  const revealed = shouldRevealCards({ viewerSeatNumber, hand, seatState: stateSeat });
  const rawCards = Array.isArray(stateSeat?.holeCards) ? stateSeat.holeCards.slice(0, 2) : [];
  const status = stateSeat && normalizeTrimmedString(seat?.status).toLowerCase() === 'registered'
    ? 'active'
    : (isSeatPendingCashout(seat) ? 'leaving_after_hand' : (seat?.status || 'empty'));
  return {
    seatNumber,
    displayName: seat?.displayName || `Seat ${seatNumber}`,
    status,
    stackOil: Number(stateSeat?.stackOil ?? seat?.stackOil ?? 0),
    buyInOil: Number(seat?.buyInOil || 0),
    committedStreetOil: Number(stateSeat?.committedStreetOil || 0),
    committedHandOil: Number(stateSeat?.committedHandOil || 0),
    folded: stateSeat?.folded === true,
    allIn: stateSeat?.allIn === true,
    eliminated: stateSeat?.eliminated === true,
    presenceStatus: getSeatPresenceStatus(seat),
    lastSeenAt: seat?.lastSeenAt || null,
    disconnectedAt: seat?.disconnectedAt || null,
    isViewer: seatNumber === normalizeSeatNumber(viewerSeatNumber),
    isActing: seatNumber === normalizeSeatNumber(hand?.state?.actingSeat),
    holeCards: revealed ? rawCards : [],
    hiddenCardCount: revealed ? 0 : rawCards.length,
    prizeOil: Number(seat?.prizeOil || 0),
    payoutSettledAt: seat?.payoutSettledAt || null,
    eliminatedAt: seat?.eliminatedAt || null,
  };
}

function sanitizeHandForViewer({ table, hand, seats, viewerSeatNumber }) {
  if (!hand) return null;
  const seatList = (Array.isArray(seats) ? seats : [])
    .map((seat) => sanitizeSeatForViewer({ seat, hand, viewerSeatNumber }))
    .sort((left, right) => left.seatNumber - right.seatNumber);
  const actingSeat = normalizeSeatNumber(hand?.state?.actingSeat);
  const viewerAllowedActions = actingSeat === normalizeSeatNumber(viewerSeatNumber)
    ? getSeatAllowedActions({ handState: hand.state, seatNumber: actingSeat })
    : [];
  return {
    handId: hand.handId,
    handNumber: Number(hand.handNumber || 0),
    status: hand.status,
    street: hand?.state?.street || hand?.state?.phase || 'preflop',
    phase: hand?.state?.phase || hand?.state?.street || 'preflop',
    blindLevel: Number(hand?.state?.blindLevel || 0),
    handsPerBlindLevel: Number(hand?.state?.handsPerBlindLevel || 0),
    actingSeat,
    buttonSeat: normalizeSeatNumber(hand?.state?.buttonSeat),
    smallBlindSeat: normalizeSeatNumber(hand?.state?.smallBlindSeat),
    bigBlindSeat: normalizeSeatNumber(hand?.state?.bigBlindSeat),
    potOil: Number(hand?.state?.potOil || 0),
    currentBetOil: Number(hand?.state?.currentBetOil || 0),
    minRaiseToOil: Number(hand?.state?.minRaiseToOil || 0),
    requiredCallOil: actingSeat ? Number(getSeatCallAmount({ handState: hand.state, seatNumber: actingSeat })) : 0,
    countdownSeconds: Number(hand?.state?.countdownSeconds || table?.rules?.decisionCountdownSeconds || DEFAULT_PLAY_ACTION_COUNTDOWN_SECONDS),
    actionExpiresAt: hand.actionExpiresAt || hand?.state?.actionExpiresAt || null,
    communityCards: Array.isArray(hand?.state?.communityCards) ? hand.state.communityCards.slice() : [],
    seats: seatList,
    result: hand.result && Object.keys(hand.result).length ? hand.result : null,
    viewerAllowedActions,
  };
}

function sanitizeMessagesForViewer(messages, viewerSeatNumber) {
  const viewerSeat = normalizeSeatNumber(viewerSeatNumber);
  return (Array.isArray(messages) ? messages : [])
    .filter((message) => message.seatNumber == null || normalizeSeatNumber(message.seatNumber) === viewerSeat)
    .map((message) => ({
      ...message,
      seatNumber: message.seatNumber == null ? null : normalizeSeatNumber(message.seatNumber),
    }));
}

function sanitizeActions(actions, seats) {
  const seatMap = getSeatMap(seats);
  return (Array.isArray(actions) ? actions : []).map((action) => ({
    ...action,
    seatNumber: action.seatNumber == null ? null : normalizeSeatNumber(action.seatNumber),
    seatLabel: action.seatNumber == null
      ? 'System'
      : formatSeatLabel(action.seatNumber, seatMap.get(normalizeSeatNumber(action.seatNumber))?.displayName || ''),
  }));
}

function sanitizeDisputesForViewer(disputes, seats) {
  const seatMap = getSeatMap(seats);
  return (Array.isArray(disputes) ? disputes : []).map((dispute) => ({
    ...dispute,
    seatNumber: dispute.seatNumber == null ? null : normalizeSeatNumber(dispute.seatNumber),
    seatLabel: dispute.seatNumber == null
      ? 'Seat'
      : formatSeatLabel(dispute.seatNumber, seatMap.get(normalizeSeatNumber(dispute.seatNumber))?.displayName || ''),
  }));
}

function sanitizeAuditEventsForViewer(events, seats) {
  const seatMap = getSeatMap(seats);
  return (Array.isArray(events) ? events : []).map((event) => ({
    ...event,
    seatNumber: event.seatNumber == null ? null : normalizeSeatNumber(event.seatNumber),
    seatLabel: event.seatNumber == null
      ? null
      : formatSeatLabel(event.seatNumber, seatMap.get(normalizeSeatNumber(event.seatNumber))?.displayName || ''),
    payload: cloneJson(event.payload, {}),
  }));
}

function buildPokerPlayReviewSummary(deps, table, seats, hand, walletSubject) {
  const openDisputes = deps.listPokerPlayDisputesByTable(table.tableId, { status: 'open', limit: 50 });
  const latestAuditEvent = deps.listPokerPlayAuditEventsByTable(table.tableId, { limit: 1 })[0] || null;
  const myDisputes = normalizeTrimmedString(walletSubject)
    ? deps.listPokerPlayDisputesByWalletSubject(walletSubject, { tableId: table.tableId, limit: 20 })
    : [];
  const currentHandId = normalizeTrimmedString(hand?.handId);
  const myHandDisputes = currentHandId
    ? myDisputes.filter((dispute) => normalizeTrimmedString(dispute?.handId) === currentHandId)
    : myDisputes;
  return {
    status: openDisputes.length
      ? 'under_review'
      : (isTablePaused(table) ? 'paused' : 'clear'),
    openDisputeCount: openDisputes.length,
    currentHandOpenDisputeCount: currentHandId
      ? openDisputes.filter((dispute) => normalizeTrimmedString(dispute?.handId) === currentHandId).length
      : openDisputes.length,
    myDisputes: sanitizeDisputesForViewer(myHandDisputes, seats),
    latestAuditEvent: latestAuditEvent
      ? sanitizeAuditEventsForViewer([latestAuditEvent], seats)[0]
      : null,
  };
}

function buildPokerPlayAdminReviewPayload(deps, { tableId, processAt, handId } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  const openDisputes = deps.listPokerPlayDisputesByTable(synced.table.tableId, { status: 'open', limit: 50 });
  const selectedHandId = normalizeTrimmedString(handId)
    || normalizeTrimmedString(openDisputes[0]?.handId)
    || normalizeTrimmedString(synced.hand?.handId);
  const reviewHand = selectedHandId ? deps.getPokerPlayHandById(selectedHandId) : null;
  const reviewMessages = reviewHand ? deps.listPokerPlayMessagesByHand(reviewHand.handId) : [];
  const reviewActions = reviewHand ? deps.listPokerPlayActionsByHand(reviewHand.handId) : [];
  const reviewDisputes = reviewHand
    ? deps.listPokerPlayDisputesByHand(reviewHand.handId, { limit: 50 })
    : deps.listPokerPlayDisputesByTable(synced.table.tableId, { limit: 50 });
  const auditEvents = reviewHand
    ? deps.listPokerPlayAuditEventsByHand(reviewHand.handId, { limit: 100 })
    : deps.listPokerPlayAuditEventsByTable(synced.table.tableId, { limit: 100 });
  const seatMap = getSeatMap(synced.seats);
  return {
    table: {
      ...synced.table,
      summary: computeTableSummary(synced.table, synced.seats, synced.hand, null),
    },
    activeHand: synced.hand ? cloneJson(synced.hand, null) : null,
    reviewHand: reviewHand
      ? {
        ...cloneJson(reviewHand, {}),
        seats: (Array.isArray(synced.seats) ? synced.seats : []).map((seat) => sanitizeSeatForViewer({
          seat,
          hand: reviewHand,
          viewerSeatNumber: normalizeSeatNumber(seat?.seatNumber),
        })),
      }
      : null,
    seats: (Array.isArray(synced.seats) ? synced.seats : []).map((seat) => ({
      ...cloneJson(seat, {}),
      seatNumber: normalizeSeatNumber(seat?.seatNumber),
      seatLabel: formatSeatLabel(seat?.seatNumber, seat?.displayName || ''),
      presenceStatus: getSeatPresenceStatus(seat),
      lastSeenAt: seat?.lastSeenAt || null,
      disconnectedAt: seat?.disconnectedAt || null,
    })),
    messages: reviewMessages.map((message) => ({
      ...cloneJson(message, {}),
      seatNumber: message.seatNumber == null ? null : normalizeSeatNumber(message.seatNumber),
      seatLabel: message.seatNumber == null
        ? 'System'
        : formatSeatLabel(message.seatNumber, seatMap.get(normalizeSeatNumber(message.seatNumber))?.displayName || ''),
    })),
    actions: sanitizeActions(reviewActions, synced.seats),
    disputes: sanitizeDisputesForViewer(reviewDisputes, synced.seats),
    openDisputes: sanitizeDisputesForViewer(openDisputes, synced.seats),
    auditEvents: sanitizeAuditEventsForViewer(auditEvents, synced.seats),
    processAt: requestAt,
  };
}

function buildPrivateAgentPrompt(table, handState, seatNumber) {
  const suggestion = derivePokerPlayAgentSuggestion({ table, handState, seatNumber });
  if (!suggestion) return null;
  return {
    suggestion,
    body: suggestion.body || 'The agent does not have a strong line yet.',
  };
}

function touchPokerPlaySeatPresence(deps, tableId, walletSubject, atIso) {
  const normalizedTableId = normalizeTrimmedString(tableId);
  const normalizedWalletSubject = normalizeTrimmedString(walletSubject);
  if (!normalizedTableId || !normalizedWalletSubject) return null;
  const seat = deps.getPokerPlaySeatByWalletSubject(normalizedTableId, normalizedWalletSubject);
  if (!seat) return null;
  return deps.upsertPokerPlaySeat({
    ...seat,
    lastSeenAt: atIso,
    updatedAt: atIso,
  });
}

function touchPokerPlaySeatPresenceForSession(deps, tableId, session, req, atIso) {
  const walletBinding = session ? deps.resolvePrimaryWalletSubject(session, req) : null;
  if (!walletBinding?.walletSubject) return null;
  return touchPokerPlaySeatPresence(deps, tableId, walletBinding.walletSubject, atIso);
}

function reconcilePokerPlaySeatPresence(deps, table, seats, hand, atIso) {
  const atMs = Date.parse(String(atIso || ''));
  if (!Number.isFinite(atMs)) {
    return { table, seats, hand };
  }
  const presenceTimeoutMs = getPokerPlayPresenceTimeoutSeconds(table) * 1000;
  const reconnectGraceSeconds = getPokerPlayReconnectGraceSeconds(table);
  const reconnectGraceMs = reconnectGraceSeconds * 1000;
  const nextSeats = [];
  let nextHand = hand;
  let graceSeats = new Set(
    Array.isArray(hand?.state?.presenceGraceSeatNumbers)
      ? hand.state.presenceGraceSeatNumbers.map((seatNumber) => normalizeSeatNumber(seatNumber)).filter(Boolean)
      : []
  );

  for (const seat of Array.isArray(seats) ? seats : []) {
    let nextSeat = seat;
    if (!isSeatInPlay(seat)) {
      nextSeats.push(nextSeat);
      continue;
    }
    const lastSeenSource = normalizeTrimmedString(seat?.lastSeenAt, normalizeTrimmedString(seat?.updatedAt, normalizeTrimmedString(seat?.createdAt)));
    const lastSeenMs = Date.parse(lastSeenSource);
    const seatNumber = normalizeSeatNumber(seat?.seatNumber);
    const stale = Number.isFinite(lastSeenMs) ? (atMs - lastSeenMs) > presenceTimeoutMs : false;
    if (stale && !seat?.disconnectedAt) {
      nextSeat = deps.upsertPokerPlaySeat({
        ...seat,
        disconnectedAt: atIso,
        updatedAt: atIso,
      });
      if (nextHand && nextHand.status === 'live' && normalizeSeatNumber(nextHand?.state?.actingSeat) === seatNumber && !graceSeats.has(seatNumber)) {
        const currentExpiresAtMs = Date.parse(String(nextHand.actionExpiresAt || nextHand?.state?.actionExpiresAt || ''));
        const nextExpiresAtMs = Number.isFinite(currentExpiresAtMs)
          ? Math.max(currentExpiresAtMs, atMs + reconnectGraceMs)
          : (atMs + reconnectGraceMs);
        const nextExpiresAt = new Date(nextExpiresAtMs).toISOString();
        graceSeats = new Set([...graceSeats, seatNumber]);
        nextHand = deps.upsertPokerPlayHand({
          ...nextHand,
          actionExpiresAt: nextExpiresAt,
          state: {
            ...(nextHand.state && typeof nextHand.state === 'object' ? nextHand.state : {}),
            actionExpiresAt: nextExpiresAt,
            reconnectGraceSeconds,
            presenceGraceSeatNumbers: Array.from(graceSeats.values()),
          },
          updatedAt: atIso,
        });
        deps.createPokerPlayMessage({
          tableId: table.tableId,
          handId: nextHand.handId,
          seatNumber: null,
          authorRole: 'system',
          body: `${formatSeatLabel(seatNumber, seat.displayName)} disconnected. Holding the clock for a ${reconnectGraceSeconds}s reconnect window.`,
          createdAt: atIso,
        });
      } else {
        if (nextHand?.handId) {
          deps.createPokerPlayMessage({
            tableId: table.tableId,
            handId: nextHand.handId,
            seatNumber: null,
            authorRole: 'system',
            body: `${formatSeatLabel(seatNumber, seat.displayName)} disconnected.`,
            createdAt: atIso,
          });
        }
      }
    } else if (!stale && seat?.disconnectedAt) {
      nextSeat = deps.upsertPokerPlaySeat({
        ...seat,
        disconnectedAt: null,
        lastSeenAt: atIso,
        updatedAt: atIso,
      });
      if (nextHand?.handId) {
        deps.createPokerPlayMessage({
          tableId: table.tableId,
          handId: nextHand.handId,
          seatNumber: null,
          authorRole: 'system',
          body: `${formatSeatLabel(seatNumber, seat.displayName)} reconnected.`,
          createdAt: atIso,
        });
      }
    }
    nextSeats.push(nextSeat);
  }
  return {
    table,
    seats: nextSeats,
    hand: nextHand,
  };
}

function upsertSeatStacksFromHand(deps, table, seats, hand, atIso) {
  const updated = [];
  for (const seat of Array.isArray(seats) ? seats : []) {
    const seatState = hand?.state?.seatStates?.[String(seat.seatNumber)] || null;
    if (!seatState) {
      updated.push(seat);
      continue;
    }
    let status = seat.status || 'active';
    const stackOil = Number(seatState.stackOil || 0);
    let eliminatedAt = seat?.eliminatedAt || null;
    if (String(table?.tableType || 'cash') === 'tournament') {
      if (stackOil <= 0) {
        status = 'busted';
        eliminatedAt = eliminatedAt || atIso;
      } else if (status !== 'paid') {
        status = 'active';
        eliminatedAt = null;
      }
    } else if (status !== 'left' && !isSeatPendingCashout(seat)) {
      status = 'active';
      eliminatedAt = null;
    }
    updated.push(deps.upsertPokerPlaySeat({
      ...seat,
      status,
      stackOil,
      eliminatedAt,
      updatedAt: atIso,
    }));
  }
  return updated;
}

function settleQueuedCashouts(deps, table, seats, hand, atIso) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'cash') {
    return Array.isArray(seats) ? seats : [];
  }
  const queuedSeats = (Array.isArray(seats) ? seats : []).filter((seat) => isSeatPendingCashout(seat));
  if (!queuedSeats.length) {
    return Array.isArray(seats) ? seats : [];
  }
  for (const seat of queuedSeats) {
    const returnedOil = Number(seat.stackOil || 0);
    if (returnedOil > 0) {
      deps.createOilLedgerEntry({
        walletSubject: seat.walletSubject,
        houseId: seat.houseId || null,
        verificationId: seat.streamflowVerificationId || null,
        entryKind: 'poker_play_cashout',
        direction: 'credit',
        amount: returnedOil,
        memo: `${table.title} queued cashout`,
      });
    }
    deps.createPokerPlayMessage({
      tableId: table.tableId,
      handId: hand?.handId || null,
      seatNumber: null,
      authorRole: 'system',
      body: `${formatSeatLabel(seat.seatNumber, seat.displayName)} cashes out ${returnedOil} OIL and leaves after hand ${Number(hand?.handNumber || 0)}.`,
      createdAt: atIso,
    });
    deps.deletePokerPlaySeat(seat.tableId, seat.seatNumber);
  }
  return deps.listPokerPlaySeatsByTable(table.tableId);
}

function startNewTableHand(deps, table, seats, previousHand, atIso) {
  let nextSeats = Array.isArray(seats) ? seats.slice() : [];
  for (const seat of nextSeats) {
    if (normalizeTrimmedString(seat?.status).toLowerCase() !== 'registered') continue;
    deps.upsertPokerPlaySeat({
      ...seat,
      status: 'active',
      updatedAt: atIso,
    });
  }
  nextSeats = deps.listPokerPlaySeatsByTable(table.tableId);
  const nextHandNumber = previousHand ? Number(previousHand.handNumber || 0) + 1 : 1;
  let nextTable = table;
  if (normalizePokerPlayTableType(table?.tableType) === 'tournament') {
    const blindProgress = resolveTournamentBlindProgress(table, nextHandNumber);
    const nextTableState = {
      ...(table?.state && typeof table.state === 'object' ? table.state : {}),
      currentBlindLevel: blindProgress.blindLevel,
      handsPerBlindLevel: blindProgress.handsPerBlindLevel,
    };
    nextTable = deps.upsertPokerPlayTable({
      ...table,
      smallBlindOil: blindProgress.smallBlindOil,
      bigBlindOil: blindProgress.bigBlindOil,
      state: nextTableState,
      updatedAt: atIso,
    });
  }
  const nextState = createInitialPokerPlayHandState({
    table: nextTable,
    seats: nextSeats,
    handNumber: nextHandNumber,
    nowIso: atIso,
    previousTableState: nextTable?.state || {},
  });
  if (!nextState) return { table: nextTable, hand: previousHand };

  const hand = deps.upsertPokerPlayHand({
    handId: `pkplayhand_${deps.randomHex(10)}`,
    tableId: nextTable.tableId,
    handNumber: nextHandNumber,
    status: 'live',
    actionExpiresAt: nextState.actionExpiresAt || null,
    state: nextState,
    result: {},
  });
  const nextTableState = {
    ...(nextTable.state && typeof nextTable.state === 'object' ? nextTable.state : {}),
    completedAt: null,
    winnerSeatNumber: 0,
    prizeOil: 0,
    prizePoolOil: 0,
    prizeSettledAt: null,
    payouts: [],
    standings: [],
    lastButtonSeat: normalizeSeatNumber(nextState.buttonSeat),
    activeHandId: hand.handId,
    activeHandNumber: hand.handNumber,
    lastStartedAt: atIso,
  };
  const updatedTable = deps.upsertPokerPlayTable({
    ...nextTable,
    state: nextTableState,
    updatedAt: atIso,
  });
  deps.createPokerPlayMessage({
    tableId: updatedTable.tableId,
    handId: hand.handId,
    seatNumber: null,
    authorRole: 'system',
    body: `Hand ${hand.handNumber} is live. ${formatSeatLabel(nextState.actingSeat)} to act.`,
  });
  if (nextState.actingSeat) {
    const prompt = buildPrivateAgentPrompt(updatedTable, nextState, nextState.actingSeat);
    if (prompt) {
      deps.createPokerPlayMessage({
        tableId: updatedTable.tableId,
        handId: hand.handId,
        seatNumber: nextState.actingSeat,
        authorRole: 'agent',
        body: prompt.body,
      });
    }
  }
  return { table: updatedTable, hand };
}

function settleTournamentIfComplete(deps, table, seats, hand, atIso) {
  if (String(table?.tableType || 'cash') !== 'tournament') return { table, seats, completed: false };
  const seriesRef = getTournamentSeriesRef(table);
  const tournamentEntries = seriesRef.seriesId && seriesRef.matchKey
    ? listTournamentSeriesEntriesDirect(deps, seriesRef.matchKey, { includeClosed: true })
    : [{ table, seats, hand }];
  const activeSeatCount = tournamentEntries.reduce((sum, entry) => sum + getActiveSeatRows(entry?.seats).length, 0);
  if (activeSeatCount > 1) return { table, seats, completed: false };
  const economics = buildTournamentEconomics(tournamentEntries);
  const standings = Array.isArray(economics.standings) ? economics.standings : [];
  if (!standings.length) {
    if (table?.state?.completedAt) {
      return { table, seats, completed: true };
    }
    return { table, seats, completed: false };
  }
  const payoutByPlace = new Map((Array.isArray(economics.payouts) ? economics.payouts : []).map((item) => [Number(item.place || 0), Number(item.amountOil || 0)]));
  const placementMap = new Map(standings.map((item) => [getTournamentSeatIdentity(item), item]));
  for (const entry of tournamentEntries) {
    for (const seat of Array.isArray(entry?.seats) ? entry.seats : []) {
      const identity = getTournamentSeatIdentity(seat);
      const placement = placementMap.get(identity);
      if (!placement) continue;
      const payoutOil = Number(payoutByPlace.get(Number(placement.place || 0)) || 0);
      if (payoutOil > 0 && !seat?.payoutSettledAt) {
        deps.createOilLedgerEntry({
          walletSubject: seat.walletSubject,
          houseId: seat.houseId || null,
          verificationId: seat.streamflowVerificationId || null,
          entryKind: 'poker_play_tournament_prize',
          direction: 'credit',
          amount: payoutOil,
          memo: `Tournament prize from ${entry?.table?.title || table?.title}`,
        });
      }
      const isWinner = Number(placement.place || 0) === 1;
      deps.upsertPokerPlaySeat({
        ...seat,
        status: payoutOil > 0 ? 'paid' : 'busted',
        stackOil: 0,
        eliminatedAt: isWinner ? seat?.eliminatedAt || null : (seat?.eliminatedAt || atIso),
        prizeOil: payoutOil,
        payoutSettledAt: payoutOil > 0 ? (seat?.payoutSettledAt || atIso) : seat?.payoutSettledAt || null,
        updatedAt: atIso,
      });
      const resultHandId = entry?.hand?.handId || entry?.table?.state?.lastSettledHandId || entry?.table?.state?.activeHandId || hand?.handId || null;
      if (payoutOil > 0 && resultHandId && !seat?.payoutSettledAt) {
        deps.createPokerPlayMessage({
          tableId: entry.table.tableId,
          handId: resultHandId,
          seatNumber: null,
          authorRole: 'system',
          body: `${formatSeatLabel(seat.seatNumber, seat.displayName)} finishes ${Number(placement.place || 0)} and is paid ${payoutOil} OIL.`,
          createdAt: atIso,
        });
      }
    }
  }
  const winner = standings[0] || null;
  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
    state: {
      ...(table.state && typeof table.state === 'object' ? table.state : {}),
      completedAt: table?.state?.completedAt || atIso,
      winnerSeatNumber: winner && String(winner.tableId || '') === String(table.tableId || '')
        ? normalizeSeatNumber(winner.seatNumber)
        : normalizeSeatNumber(table?.state?.winnerSeatNumber),
      prizeOil: Number(economics?.payouts?.[0]?.amountOil || 0),
      prizePoolOil: Number(economics.prizePoolOil || 0),
      prizeSettledAt: table?.state?.prizeSettledAt || atIso,
      payoutModel: economics.payoutModel,
      payouts: cloneJson(economics.payouts, []),
      standings: cloneJson(standings, []),
      activeHandId: hand?.handId || null,
      activeHandNumber: Number(hand?.handNumber || 0),
    },
    updatedAt: atIso,
  });
  return {
    table: updatedTable,
    seats: deps.listPokerPlaySeatsByTable(table.tableId),
    completed: true,
  };
}

function maybeClearReusableTournamentSeats(deps, table) {
  if (String(table?.tableType || 'cash') !== 'tournament') return table;
  const currentSeats = deps.listPokerPlaySeatsByTable(table.tableId);
  if (!currentSeats.length) return table;
  const hasActiveSeat = currentSeats.some((seat) => seat.status === 'active' || Number(seat.stackOil || 0) > 0);
  if (hasActiveSeat) return table;
  for (const seat of currentSeats) {
    deps.deletePokerPlaySeat(table.tableId, seat.seatNumber);
  }
  return deps.upsertPokerPlayTable({
    ...table,
    state: {
      ...(table.state && typeof table.state === 'object' ? table.state : {}),
      completedAt: null,
      winnerSeatNumber: 0,
      prizeOil: 0,
      prizeSettledAt: null,
      prizePoolOil: 0,
      payouts: [],
      standings: [],
    },
  });
}

function findNextOpenSeatNumber(table, seats) {
  const occupied = new Set((Array.isArray(seats) ? seats : []).map((seat) => normalizeSeatNumber(seat?.seatNumber)).filter(Boolean));
  return Array.from({ length: Number(table?.maxSeats || POKER_PLAY_MAX_SEATS) }, (_value, index) => index + 1)
    .find((seatNumber) => !occupied.has(seatNumber)) || 0;
}

function sortTournamentSeriesEntriesByOccupancy(entries) {
  return (Array.isArray(entries) ? entries : [])
    .slice()
    .sort((left, right) => {
      const occupancyDelta = Number(right?.activeSeats?.length || 0) - Number(left?.activeSeats?.length || 0);
      if (occupancyDelta !== 0) return occupancyDelta;
      return String(left?.table?.createdAt || '').localeCompare(String(right?.table?.createdAt || ''));
    });
}

function buildSeriesTargetOccupancies(totalActiveSeats, tableCount) {
  const total = Math.max(0, normalizeOilAmount(totalActiveSeats, 0));
  const count = Math.max(1, normalizeOilAmount(tableCount, 1));
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from({ length: count }, (_value, index) => base + (index < remainder ? 1 : 0));
}

function buildTournamentSeriesDirectorPolicy(entries) {
  const activeEntries = (Array.isArray(entries) ? entries : [])
    .map((entry) => ({
      ...entry,
      activeSeats: Array.isArray(entry?.activeSeats) ? entry.activeSeats : getActiveSeatRows(entry?.seats),
      live: typeof entry?.live === 'boolean' ? entry.live : !!(entry?.hand && entry.hand.status === 'live'),
    }))
    .filter((entry) => entry.activeSeats.length > 0);
  if (!activeEntries.length) {
    return {
      orderedEntries: [],
      keepers: [],
      targetByTableId: new Map(),
      currentTableCount: 0,
      targetTableCount: 0,
      totalActiveSeats: 0,
      targetOccupancies: [],
      deficitSeatCount: 0,
      surplusSeatCount: 0,
      needsRebalance: false,
      pendingBreakTableId: null,
      pendingBreakSeatCount: 0,
      pendingBreakBlockedByLiveTable: false,
    };
  }
  const orderedEntries = sortTournamentSeriesEntriesByOccupancy(activeEntries);
  const maxSeats = Math.max(
    1,
    ...orderedEntries.map((entry) => Number(entry?.table?.maxSeats || POKER_PLAY_MAX_SEATS)).filter((value) => Number.isFinite(value) && value > 0)
  );
  const totalActiveSeats = orderedEntries.reduce((sum, entry) => sum + entry.activeSeats.length, 0);
  const targetTableCount = Math.max(1, Math.ceil(totalActiveSeats / maxSeats));
  const keepers = orderedEntries.slice(0, targetTableCount);
  const targetOccupancies = buildSeriesTargetOccupancies(totalActiveSeats, keepers.length);
  const targetByTableId = new Map(keepers.map((entry, index) => [String(entry?.table?.tableId || ''), targetOccupancies[index] || 0]));
  const deficitSeatCount = keepers.reduce((sum, entry) => {
    const tableId = String(entry?.table?.tableId || '');
    return sum + Math.max(0, Number(targetByTableId.get(tableId) || 0) - entry.activeSeats.length);
  }, 0);
  const surplusSeatCount = orderedEntries.reduce((sum, entry) => {
    const tableId = String(entry?.table?.tableId || '');
    const target = Number(targetByTableId.has(tableId) ? targetByTableId.get(tableId) : 0);
    return sum + Math.max(0, entry.activeSeats.length - target);
  }, 0);
  const breakCandidates = orderedEntries
    .filter((entry) => !targetByTableId.has(String(entry?.table?.tableId || '')))
    .sort((left, right) => {
      const liveDelta = Number(Boolean(left?.live)) - Number(Boolean(right?.live));
      if (liveDelta !== 0) return liveDelta;
      const occupancyDelta = Number(left?.activeSeats?.length || 0) - Number(right?.activeSeats?.length || 0);
      if (occupancyDelta !== 0) return occupancyDelta;
      return String(right?.table?.createdAt || '').localeCompare(String(left?.table?.createdAt || ''));
    });
  const pendingBreak = breakCandidates[0] || null;
  return {
    orderedEntries,
    keepers,
    targetByTableId,
    currentTableCount: orderedEntries.length,
    targetTableCount,
    totalActiveSeats,
    targetOccupancies,
    deficitSeatCount,
    surplusSeatCount,
    needsRebalance: breakCandidates.length > 0 || (deficitSeatCount > 0 && surplusSeatCount > 0),
    pendingBreakTableId: pendingBreak?.table?.tableId || null,
    pendingBreakSeatCount: pendingBreak ? Number(pendingBreak?.activeSeats?.length || 0) : 0,
    pendingBreakBlockedByLiveTable: !!pendingBreak?.live,
  };
}

function sortSeatsForTournamentSeriesTransfer(seats) {
  const transferPriority = (seat) => {
    const status = normalizeTrimmedString(seat?.status).toLowerCase();
    if (status === 'registered') return 0;
    if (status === 'active') return 1;
    return 2;
  };
  return (Array.isArray(seats) ? seats : [])
    .slice()
    .sort((left, right) => {
      const priorityDelta = transferPriority(left) - transferPriority(right);
      if (priorityDelta !== 0) return priorityDelta;
      const createdDelta = String(right?.createdAt || '').localeCompare(String(left?.createdAt || ''));
      if (createdDelta !== 0) return createdDelta;
      return normalizeSeatNumber(right?.seatNumber) - normalizeSeatNumber(left?.seatNumber);
    });
}

function moveTournamentSeriesSeat(deps, seat, targetEntry, atIso) {
  const targetTable = targetEntry?.table || null;
  if (!targetTable || !seat) return null;
  const targetSeats = deps.listPokerPlaySeatsByTable(targetTable.tableId);
  const openSeatNumber = findNextOpenSeatNumber(targetTable, targetSeats);
  if (!openSeatNumber) return null;
  const movedSeat = deps.upsertPokerPlaySeat({
    ...seat,
    tableId: targetTable.tableId,
    seatNumber: openSeatNumber,
    status: targetEntry?.hand && targetEntry.hand.status === 'live' ? 'registered' : 'active',
    createdAt: seat.createdAt,
    updatedAt: atIso,
  });
  deps.deletePokerPlaySeat(seat.tableId, seat.seatNumber);
  return movedSeat;
}

function closeTournamentSeriesTable(deps, table, { mergedIntoTableId, atIso }) {
  return deps.upsertPokerPlayTable({
    ...table,
    status: 'series_closed',
    state: {
      ...(table?.state && typeof table.state === 'object' ? table.state : {}),
      seriesClosedAt: atIso,
      mergedIntoTableId: normalizeTrimmedString(mergedIntoTableId) || null,
    },
    updatedAt: atIso,
  });
}

function maybeRebalanceTournamentSeries(deps, table, seats, hand, atIso) {
  const seriesRef = getTournamentSeriesRef(table);
  if (!seriesRef.seriesId || !seriesRef.matchKey) {
    return {
      table,
      seats,
      hand,
      changed: false,
      closed: false,
    };
  }
  const entries = listTournamentSeriesEntriesDirect(deps, seriesRef.matchKey);
  if (entries.length <= 1) {
    return {
      table,
      seats,
      hand,
      changed: false,
      closed: false,
    };
  }
  const activeEntries = entries
    .map((entry) => ({
      ...entry,
      activeSeats: getActiveSeatRows(entry.seats),
      live: !!(entry?.hand && entry.hand.status === 'live'),
    }))
    .filter((entry) => entry.activeSeats.length > 0);
  if (activeEntries.length <= 1) {
    return {
      table,
      seats,
      hand,
      changed: false,
      closed: false,
    };
  }
  const directorPolicy = buildTournamentSeriesDirectorPolicy(activeEntries);
  const orderedEntries = directorPolicy.orderedEntries;
  if (directorPolicy.targetTableCount === 1 && orderedEntries.some((entry) => entry.live)) {
    return {
      table,
      seats,
      hand,
      changed: false,
      closed: false,
    };
  }
  const keepers = directorPolicy.keepers;
  const targetByTableId = directorPolicy.targetByTableId;
  const deficits = keepers.map((entry) => ({
    tableId: String(entry.table.tableId || ''),
    target: Number(targetByTableId.get(String(entry.table.tableId || '')) || 0),
  }));

  const movePool = [];
  for (const entry of orderedEntries) {
    if (entry.live) continue;
    const tableId = String(entry.table.tableId || '');
    const targetOccupancy = Number(targetByTableId.has(tableId) ? targetByTableId.get(tableId) : 0);
    const moveCount = Math.max(0, entry.activeSeats.length - targetOccupancy);
    if (!moveCount) continue;
    movePool.push(...sortSeatsForTournamentSeriesTransfer(entry.activeSeats).slice(0, moveCount));
  }

  let movedCount = 0;
  for (const deficit of deficits) {
    if (deficit.target <= 0) continue;
    let targetEntry = {
      table: deps.getPokerPlayTableById(deficit.tableId) || keepers.find((entry) => String(entry?.table?.tableId || '') === deficit.tableId)?.table,
      seats: deps.listPokerPlaySeatsByTable(deficit.tableId),
      hand: deps.getCurrentPokerPlayHandForTable(deficit.tableId),
    };
    while (movePool.length && getActiveSeatRows(targetEntry.seats).length < deficit.target) {
      const nextSeat = movePool.shift();
      if (!nextSeat || String(nextSeat.tableId || '') === deficit.tableId) continue;
      const movedSeat = moveTournamentSeriesSeat(deps, nextSeat, targetEntry, atIso);
      if (!movedSeat) continue;
      targetEntry = {
        table: deps.getPokerPlayTableById(deficit.tableId) || targetEntry.table,
        seats: deps.listPokerPlaySeatsByTable(deficit.tableId),
        hand: deps.getCurrentPokerPlayHandForTable(deficit.tableId),
      };
      movedCount += 1;
    }
  }

  let closedCount = 0;
  for (const entry of orderedEntries) {
    const tableId = String(entry.table.tableId || '');
    if (targetByTableId.has(tableId)) continue;
    if (entry.live) continue;
    const remainingSeats = deps.listPokerPlaySeatsByTable(tableId);
    if (getActiveSeatRows(remainingSeats).length > 0) continue;
    closeTournamentSeriesTable(deps, entry.table, {
      mergedIntoTableId: keepers[0]?.table?.tableId || null,
      atIso,
    });
    closedCount += 1;
  }

  if (!movedCount && !closedCount) {
    return {
      table,
      seats,
      hand,
      changed: false,
      closed: false,
    };
  }

  const refreshedTable = deps.getPokerPlayTableById(table.tableId) || table;
  return {
    table: refreshedTable,
    seats: deps.listPokerPlaySeatsByTable(table.tableId),
    hand: deps.getCurrentPokerPlayHandForTable(table.tableId),
    changed: true,
    closed: isSeriesClosedTable(refreshedTable),
  };
}

function pauseTable(deps, { tableId, reason, actorLabel = 'operator', asOf } = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  const table = synced.table;
  const hand = synced.hand;
  const state = table?.state && typeof table.state === 'object' ? table.state : {};
  const alreadyPaused = isTablePaused(table);
  const atMs = Date.parse(requestAt);
  const expiresAtMs = Date.parse(String(hand?.actionExpiresAt || hand?.state?.actionExpiresAt || ''));
  const pausedActionRemainingMs = hand && hand.status === 'live' && Number.isFinite(atMs) && Number.isFinite(expiresAtMs)
    ? Math.max(0, expiresAtMs - atMs)
    : 0;
  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
    status: 'paused',
    state: {
      ...state,
      pausedAt: requestAt,
      pausedReason: normalizeTrimmedString(reason, normalizeTrimmedString(state.pausedReason, 'Operator review')),
      pausedBy: normalizeTrimmedString(actorLabel, 'operator'),
      pausedActionRemainingMs,
    },
    updatedAt: requestAt,
  });
  if (!alreadyPaused) {
    deps.createPokerPlayMessage({
      tableId: updatedTable.tableId,
      handId: hand?.handId || null,
      seatNumber: null,
      authorRole: 'system',
      body: normalizeTrimmedString(reason)
        ? `Table paused by operator: ${normalizeTrimmedString(reason)}.`
        : 'Table paused by operator.',
      createdAt: requestAt,
    });
    if (typeof deps.createPokerPlayAuditEvent === 'function') {
      deps.createPokerPlayAuditEvent({
        tableId: updatedTable.tableId,
        handId: hand?.handId || null,
        actorRole: normalizePokerPlayAuditActorRole(actorLabel, actorLabel === 'operator' ? 'operator' : 'system'),
        eventKind: 'table_paused',
        payload: {
          reason: normalizeTrimmedString(reason, normalizeTrimmedString(state.pausedReason, 'Operator review')),
          pausedActionRemainingMs,
          actorLabel: normalizeTrimmedString(actorLabel, 'operator'),
        },
        createdAt: requestAt,
      });
    }
  }
  return {
    table: updatedTable,
    seats: synced.seats,
    hand,
  };
}

function resumeTable(deps, { tableId, actorLabel = 'operator', asOf } = {}) {
  const requestAt = toProcessIso(deps, asOf);
  let table = deps.getPokerPlayTableById(tableId);
  if (!table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  let seats = deps.listPokerPlaySeatsByTable(table.tableId);
  let hand = deps.getCurrentPokerPlayHandForTable(table.tableId);
  const state = table?.state && typeof table.state === 'object' ? table.state : {};
  const remainingActionMs = Math.max(0, normalizeOilAmount(state.pausedActionRemainingMs, 0));
  if (hand && hand.status === 'live' && remainingActionMs > 0) {
    const resumeAtMs = Date.parse(requestAt);
    const actionExpiresAt = Number.isFinite(resumeAtMs)
      ? new Date(resumeAtMs + remainingActionMs).toISOString()
      : requestAt;
    hand = deps.upsertPokerPlayHand({
      ...hand,
      actionExpiresAt,
      state: {
        ...(hand.state && typeof hand.state === 'object' ? hand.state : {}),
        actionExpiresAt,
      },
      updatedAt: requestAt,
    });
  }
  table = deps.upsertPokerPlayTable({
    ...table,
    status: 'open',
    state: {
      ...state,
      pausedAt: null,
      pausedReason: null,
      pausedBy: null,
      pausedActionRemainingMs: 0,
      lastResumedAt: requestAt,
      lastResumedBy: normalizeTrimmedString(actorLabel, 'operator'),
    },
    updatedAt: requestAt,
  });
  deps.createPokerPlayMessage({
    tableId: table.tableId,
    handId: hand?.handId || null,
    seatNumber: null,
    authorRole: 'system',
    body: 'Table resumed by operator.',
    createdAt: requestAt,
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: table.tableId,
      handId: hand?.handId || null,
      actorRole: normalizePokerPlayAuditActorRole(actorLabel, actorLabel === 'operator' ? 'operator' : 'system'),
      eventKind: 'table_resumed',
      payload: {
        actorLabel: normalizeTrimmedString(actorLabel, 'operator'),
        remainingActionMs,
      },
      createdAt: requestAt,
    });
  }
  const synced = syncPokerPlayTable(deps, table.tableId, { processAt: requestAt });
  return synced || { table, seats, hand };
}

function syncPokerPlayTable(deps, tableId, { processAt } = {}) {
  let table = deps.getPokerPlayTableById(tableId);
  if (!table) return null;
  let seats = deps.listPokerPlaySeatsByTable(table.tableId);
  let hand = deps.getCurrentPokerPlayHandForTable(table.tableId);
  const atIso = toProcessIso(deps, processAt);
  let presence = reconcilePokerPlaySeatPresence(deps, table, seats, hand, atIso);
  table = presence.table;
  seats = presence.seats;
  hand = presence.hand;
  if (isTablePaused(table)) {
    return { table, seats, hand };
  }
  let safety = 0;

  while (safety < 24) {
    safety += 1;
    presence = reconcilePokerPlaySeatPresence(deps, table, seats, hand, atIso);
    table = presence.table;
    seats = presence.seats;
    hand = presence.hand;
    const atMs = Date.parse(atIso);
    if (hand && hand.status === 'live') {
      const expiresAtMs = Date.parse(String(hand.actionExpiresAt || hand?.state?.actionExpiresAt || ''));
      const actingSeat = normalizeSeatNumber(hand?.state?.actingSeat);
      if (actingSeat && Number.isFinite(atMs) && Number.isFinite(expiresAtMs) && expiresAtMs <= atMs) {
        const seat = seats.find((item) => normalizeSeatNumber(item.seatNumber) === actingSeat) || null;
        const timeoutAction = pickTimeoutAction({ handState: hand.state, seatNumber: actingSeat });
        const outcome = applyPokerPlayActionToHandState({
          table,
          handState: hand.state,
          seatNumber: actingSeat,
          actionKind: timeoutAction.actionKind,
          amountOil: timeoutAction.amountOil,
          nowIso: atIso,
        });
        deps.createPokerPlayAction({
          tableId: table.tableId,
          handId: hand.handId,
          seatNumber: actingSeat,
          actorRole: 'agent',
          actionKind: timeoutAction.actionKind,
          amountOil: Number(outcome.normalizedAmountOil || outcome.debitOil || 0),
          payload: {
            reason: 'timeout',
            requestedAmountOil: Number(timeoutAction.amountOil || 0),
          },
          createdAt: atIso,
        });
        deps.createPokerPlayMessage({
          tableId: table.tableId,
          handId: hand.handId,
          seatNumber: actingSeat,
          authorRole: 'agent',
          body: `Clock expired. ${seat?.displayName || formatSeatLabel(actingSeat)} ${buildActionNarrative(timeoutAction.actionKind, outcome.normalizedAmountOil || outcome.debitOil || 0)}.`,
          createdAt: atIso,
        });
        hand = deps.upsertPokerPlayHand({
          ...hand,
          status: outcome.handState?.status || 'live',
          actionExpiresAt: outcome.handState?.actionExpiresAt || null,
          state: outcome.handState,
          result: outcome.handState?.result || {},
          updatedAt: atIso,
        });
        if (hand.status === 'live' && hand.state?.actingSeat) {
          const prompt = buildPrivateAgentPrompt(table, hand.state, hand.state.actingSeat);
          if (prompt) {
            deps.createPokerPlayMessage({
              tableId: table.tableId,
              handId: hand.handId,
              seatNumber: hand.state.actingSeat,
              authorRole: 'agent',
              body: prompt.body,
              createdAt: atIso,
            });
          }
        }
        continue;
      }
    }

    if (hand && hand.status === 'settled') {
      seats = upsertSeatStacksFromHand(deps, table, seats, hand, atIso);
      seats = settleQueuedCashouts(deps, table, seats, hand, atIso);
      const nextTableState = {
        ...(table.state && typeof table.state === 'object' ? table.state : {}),
        lastButtonSeat: normalizeSeatNumber(hand?.state?.buttonSeat) || normalizeSeatNumber(table?.state?.lastButtonSeat),
        lastSettledAt: atIso,
        lastSettledHandId: hand.handId,
      };
      table = deps.upsertPokerPlayTable({
        ...table,
        state: nextTableState,
        updatedAt: atIso,
      });

      const tournamentSettlement = settleTournamentIfComplete(deps, table, seats, hand, atIso);
      table = tournamentSettlement.table;
      seats = tournamentSettlement.seats;
      if (tournamentSettlement.completed) break;

      const seriesRebalance = maybeRebalanceTournamentSeries(deps, table, seats, hand, atIso);
      table = seriesRebalance.table;
      seats = seriesRebalance.seats;
      hand = seriesRebalance.hand;
      if (seriesRebalance.closed) break;

      const readySeats = getActiveSeatRows(seats);
      if (readySeats.length >= Math.max(2, Number(table.minPlayers || 2))) {
        const started = startNewTableHand(deps, table, seats, hand, atIso);
        table = started.table;
        hand = started.hand;
        continue;
      }
      break;
    }

    if (!hand || hand.status !== 'live') {
      const seriesRebalance = maybeRebalanceTournamentSeries(deps, table, seats, hand, atIso);
      table = seriesRebalance.table;
      seats = seriesRebalance.seats;
      hand = seriesRebalance.hand;
      if (seriesRebalance.closed) break;
    }

    if ((!hand || hand.status !== 'live') && getActiveSeatRows(seats).length >= Math.max(2, Number(table.minPlayers || 2))) {
      const started = startNewTableHand(deps, table, seats, hand, atIso);
      table = started.table;
      hand = started.hand;
      continue;
    }
    break;
  }

  table = deps.getPokerPlayTableById(table.tableId) || table;
  seats = deps.listPokerPlaySeatsByTable(table.tableId);
  hand = deps.getCurrentPokerPlayHandForTable(table.tableId);
  return { table, seats, hand };
}

function buildPokerPlayTablePayload(deps, table, seats, hand, { session, req, processAt, publicViewer = false } = {}) {
  const walletBinding = (!publicViewer && session) ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const viewerSeat = walletBinding?.walletSubject
    ? deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject)
    : null;
  const messages = hand ? deps.listPokerPlayMessagesByHand(hand.handId) : [];
  const actions = hand ? deps.listPokerPlayActionsByHand(hand.handId) : [];
  const oilBalance = walletBinding?.walletSubject ? deps.computeOilBalance(walletBinding.walletSubject) : null;
  const suggestion = viewerSeat && hand && hand.status === 'live'
    ? derivePokerPlayAgentSuggestion({ table, handState: hand.state, seatNumber: viewerSeat.seatNumber })
    : null;
  const review = buildPokerPlayReviewSummary(deps, table, seats, hand, walletBinding?.walletSubject || '');
  const seriesRef = getTournamentSeriesRef(table);
  const series = seriesRef.seriesId
    ? buildPokerPlaySeriesSummary(
      listExistingTournamentSeriesTables(deps, seriesRef.matchKey, { processAt, includeClosed: true }).map((entry) => {
        const currentViewerSeat = walletBinding?.walletSubject
          ? deps.getPokerPlaySeatByWalletSubject(entry.table.tableId, walletBinding.walletSubject)
          : null;
        return {
          ...entry,
          viewerSeat: currentViewerSeat,
          summary: computeTableSummary(entry.table, entry.seats, entry.hand, currentViewerSeat),
        };
      }),
      walletBinding?.walletSubject || ''
    )
    : null;
  const placementByWallet = new Map(
    (Array.isArray(series?.standings) ? series.standings : [])
      .filter((item) => normalizeTrimmedString(item?.walletSubject))
      .map((item) => [normalizeTrimmedString(item.walletSubject), Number(item.place || 0)])
  );
  const summarizeSeat = (seat) => {
    const base = sanitizeSeatForViewer({ seat, hand, viewerSeatNumber: viewerSeat?.seatNumber || 0 });
    const finishPosition = placementByWallet.get(normalizeTrimmedString(seat?.walletSubject)) || null;
    return {
      ...base,
      finishPosition,
    };
  };
  const tableSummary = {
    ...computeTableSummary(table, seats, hand, viewerSeat),
    ...(series
      ? {
        prizePoolOil: Number(series?.prizePoolOil || 0),
        payoutModel: series?.payoutModel || '',
        paidPlaces: Number(series?.paidPlaces || 0),
        payouts: cloneJson(series?.payouts, []),
      }
      : {}),
  };

  return {
    viewerMode: publicViewer ? 'public' : 'player',
    table: {
      ...table,
      summary: tableSummary,
    },
    series,
    houseId: publicViewer ? null : getSessionHouseId(session),
    wallet: walletBinding?.submitterWallet || null,
    oilBalance,
    mySeat: viewerSeat
      ? summarizeSeat(viewerSeat)
      : null,
    seats: (Array.isArray(seats) ? seats : [])
      .map((seat) => summarizeSeat(seat))
      .sort((left, right) => left.seatNumber - right.seatNumber),
    hand: sanitizeHandForViewer({ table, hand, seats, viewerSeatNumber: viewerSeat?.seatNumber || 0 }),
    messages: sanitizeMessagesForViewer(messages, viewerSeat?.seatNumber || 0),
    actions: sanitizeActions(actions, seats),
    review,
    suggestion,
    processAt: toProcessIso(deps, processAt),
  };
}

function buildPokerPlayLobbyPayload(deps, { session, req, processAt, publicViewer = false } = {}) {
  const walletBinding = (!publicViewer && session) ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const oilBalance = walletBinding?.walletSubject ? deps.computeOilBalance(walletBinding.walletSubject) : null;
  const entries = deps.listPokerPlayTables()
    .filter((table) => !isSeriesClosedTable(table))
    .map((table) => {
    const synced = syncPokerPlayTable(deps, table.tableId, { processAt });
    const viewerSeat = walletBinding?.walletSubject
      ? deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject)
      : null;
    const summary = computeTableSummary(synced.table, synced.seats, synced.hand, viewerSeat);
    return {
      table: synced.table,
      seats: synced.seats,
      hand: synced.hand,
      viewerSeat,
      summary,
    };
    });
  const items = entries.map((entry) => {
    const seriesRef = getTournamentSeriesRef(entry.table);
    return {
      ...entry.table,
      seriesId: seriesRef.seriesId || null,
      seriesTitle: seriesRef.seriesTitle || null,
      summary: entry.summary,
      currentUser: {
        walletSubject: walletBinding?.walletSubject || null,
        oilBalance: oilBalance?.balance ?? 0,
        seated: !!entry.viewerSeat,
        seatNumber: normalizeSeatNumber(entry.viewerSeat?.seatNumber),
      },
    };
  });
  const series = Array.from(entries.reduce((map, entry) => {
    const ref = getTournamentSeriesRef(entry.table);
    if (!ref.seriesId) return map;
    if (!map.has(ref.seriesId)) {
      map.set(ref.seriesId, listExistingTournamentSeriesTables(deps, ref.matchKey, {
        processAt,
        includeClosed: true,
      }).map((seriesEntry) => {
        const currentViewerSeat = walletBinding?.walletSubject
          ? deps.getPokerPlaySeatByWalletSubject(seriesEntry.table.tableId, walletBinding.walletSubject)
          : null;
        return {
          ...seriesEntry,
          viewerSeat: currentViewerSeat,
          summary: computeTableSummary(seriesEntry.table, seriesEntry.seats, seriesEntry.hand, currentViewerSeat),
        };
      }));
    }
    return map;
  }, new Map()).values())
    .map((seriesEntries) => buildPokerPlaySeriesSummary(seriesEntries, walletBinding?.walletSubject || ''))
    .filter(Boolean)
    .sort((left, right) => String(left?.seriesTitle || '').localeCompare(String(right?.seriesTitle || '')));
  return {
    viewerMode: publicViewer ? 'public' : 'player',
    items,
    series,
    houseId: publicViewer ? null : getSessionHouseId(session),
    wallet: walletBinding?.submitterWallet || null,
    oilBalance,
    processAt: toProcessIso(deps, processAt),
  };
}

function requireSeatWriter(deps, { table, session, req }) {
  const walletBinding = deps.resolvePrimaryWalletSubject(session, req);
  if (!walletBinding?.walletSubject) {
    throw createRouteError(409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before joining a live poker table.');
  }
  const seat = deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject);
  if (!seat) {
    throw createRouteError(403, 'FORBIDDEN', 'This poker table seat belongs to a different wallet.');
  }
  return { walletBinding, seat };
}

function createDynamicTable(deps, config, { createdAt } = {}) {
  const normalized = normalizeCreateTableConfig(config);
  const matchKey = buildMatchKey(normalized);
  const tableId = `pkt_play_${normalized.tableType}_${deps.randomHex(8)}`;
  const slug = `${slugifySegment(normalized.title)}-${deps.randomHex(4)}`;
  return deps.upsertPokerPlayTable({
    tableId,
    slug,
    title: normalized.title,
    tableType: normalized.tableType,
    status: 'open',
    maxSeats: normalized.maxSeats,
    smallBlindOil: normalized.smallBlindOil,
    bigBlindOil: normalized.bigBlindOil,
    buyInOil: normalized.buyInOil,
    minPlayers: normalized.minPlayers,
    state: {
      activeHandId: null,
      activeHandNumber: 0,
      completedAt: null,
      winnerSeatNumber: 0,
      prizeOil: 0,
      prizeSettledAt: null,
    },
    rules: {
      decisionCountdownSeconds: normalized.decisionCountdownSeconds,
      presenceTimeoutSeconds: normalized.presenceTimeoutSeconds,
      reconnectGraceSeconds: normalized.reconnectGraceSeconds,
      cashOutEnabled: normalized.tableType === 'cash',
      payoutModel: normalized.tableType === 'cash' ? 'cash_stack' : 'dynamic_ladder',
      lateRegistrationHands: normalized.tableType === 'tournament' ? normalized.lateRegistrationHands : 0,
      handsPerBlindLevel: normalized.tableType === 'tournament' ? normalized.handsPerBlindLevel : 0,
      blindLevels: normalized.tableType === 'tournament' ? normalized.blindLevels : [],
      seriesId: normalized.tableType === 'tournament'
        ? normalizeTrimmedString(normalized.seriesId, `pkseries_${deps.randomHex(8)}`)
        : '',
      seriesTitle: normalized.tableType === 'tournament'
        ? normalizeTrimmedString(normalized.seriesTitle, normalized.title)
        : '',
      matchKey,
      dynamic: true,
    },
    summary: buildDynamicTableSummary(normalized, matchKey),
    createdAt,
    updatedAt: createdAt || deps.nowIso(),
  });
}

function isTableMatchCandidate(synced, matchKey, tableType) {
  if (!synced?.table) return false;
  const table = synced.table;
  const computedSummary = computeTableSummary(table, synced.seats, synced.hand, null);
  const summary = {
    ...(table.summary && typeof table.summary === 'object' ? table.summary : {}),
    ...computedSummary,
  };
  const tableMatchKey = normalizeTrimmedString(table?.rules?.matchKey || table?.summary?.matchKey || summary.matchKey || buildMatchKeyFromTable(table));
  if (!tableMatchKey || tableMatchKey !== matchKey) return false;
  if (normalizePokerPlayTableType(table.tableType) !== normalizePokerPlayTableType(tableType)) return false;
  if (Number(summary.openSeatCount || 0) <= 0) return false;
  if (String(table.status || 'open') !== 'open') return false;
  if (tableType === 'tournament') {
    if (Number(summary.occupancy || 0) >= Number(table.maxSeats || POKER_PLAY_MAX_SEATS)) return false;
    if (summary.liveHand) {
      const lateRegistration = resolveTournamentLateRegistration(table, synced.hand);
      if (!lateRegistration.open) return false;
    }
  }
  return true;
}

function resolveMatchmakeTable(deps, config, { processAt } = {}) {
  const normalized = normalizeCreateTableConfig(config);
  const matchKey = buildMatchKey(normalized);
  const candidates = deps.listPokerPlayTables()
    .map((table) => syncPokerPlayTable(deps, table.tableId, { processAt }))
    .filter((synced) => isTableMatchCandidate(synced, matchKey, normalized.tableType))
    .sort((left, right) => {
      const leftSummary = computeTableSummary(left.table, left.seats, left.hand, null);
      const rightSummary = computeTableSummary(right.table, right.seats, right.hand, null);
      const occupancyDelta = Number(rightSummary?.occupancy || 0) - Number(leftSummary?.occupancy || 0);
      if (occupancyDelta !== 0) return occupancyDelta;
      return String(left?.table?.createdAt || '').localeCompare(String(right?.table?.createdAt || ''));
    });
  if (candidates.length) {
    return candidates[0].table;
  }
  let nextConfig = normalized;
  if (normalized.tableType === 'tournament') {
    const existingSeries = listExistingTournamentSeriesTables(deps, matchKey, { processAt })
      .sort((left, right) => String(right?.table?.createdAt || '').localeCompare(String(left?.table?.createdAt || '')));
    const leadSeriesTable = existingSeries[0]?.table || null;
    const ref = getTournamentSeriesRef(leadSeriesTable);
    nextConfig = {
      ...normalized,
      seriesId: ref.seriesId || `pkseries_${deps.randomHex(8)}`,
      seriesTitle: ref.seriesTitle || normalized.title,
    };
  }
  return createDynamicTable(deps, nextConfig, { createdAt: toProcessIso(deps, processAt) });
}

function listTables(deps, { session, req, processAt, publicViewer = false } = {}) {
  return buildPokerPlayLobbyPayload(deps, { session, req, processAt, publicViewer });
}

function getTableDetail(deps, { tableId, session, req, processAt, publicViewer = false } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  if (!publicViewer) {
    touchPokerPlaySeatPresenceForSession(deps, tableId, session, req, requestAt);
  }
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  return buildPokerPlayTablePayload(deps, synced.table, synced.seats, synced.hand, {
    session,
    req,
    processAt: requestAt,
    publicViewer,
  });
}

function seatIntoTable(deps, { tableId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const walletBinding = deps.resolvePrimaryWalletSubject(session, req);
  if (!walletBinding?.walletSubject) {
    throw createRouteError(409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before joining a live poker table.');
  }
  const houseId = getSessionHouseId(session);
  if (!houseId) {
    throw createRouteError(409, 'HOUSE_REQUIRED', 'Join a house before entering a live poker table.');
  }
  const existingSeat = deps.getActivePokerPlaySeatByWalletSubject(walletBinding.walletSubject);
  if (existingSeat && existingSeat.tableId && existingSeat.tableId !== tableId && isSeatInPlay(existingSeat)) {
    throw createRouteError(409, 'POKER_PLAY_SEAT_ALREADY_ACTIVE', 'This wallet is already seated at a different live table.', {
      tableId: existingSeat.tableId,
      seatNumber: existingSeat.seatNumber,
    });
  }

  let table = deps.getPokerPlayTableById(tableId);
  if (!table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  table = maybeClearReusableTournamentSeats(deps, table);
  const synced = syncPokerPlayTable(deps, table.tableId, { processAt: body?.asOf });
  table = synced.table;
  const seats = synced.seats;
  const currentHand = synced.hand;
  if (isTablePaused(table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_PAUSED', 'This poker table is paused by an operator.');
  }
  const sameTableSeat = deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject);
  if (sameTableSeat) {
    return buildPokerPlayTablePayload(deps, table, seats, currentHand, { session, req, processAt: requestAt });
  }
  const lateRegistration = resolveTournamentLateRegistration(table, currentHand);
  if (normalizePokerPlayTableType(table.tableType) === 'tournament' && currentHand && currentHand.status === 'live' && !lateRegistration.open) {
    throw createRouteError(409, 'POKER_PLAY_TOURNAMENT_ALREADY_STARTED', 'Tournament seats lock once late registration closes.', {
      tableId: table.tableId,
      handId: currentHand.handId,
      lateRegistrationRemainingHands: lateRegistration.remainingHands,
    });
  }

  const requestedSeatNumber = normalizeSeatNumber(body?.seatNumber);
  const occupied = new Set(seats.map((seat) => normalizeSeatNumber(seat.seatNumber)).filter(Boolean));
  const openSeatNumber = requestedSeatNumber && !occupied.has(requestedSeatNumber)
    ? requestedSeatNumber
    : Array.from({ length: Number(table.maxSeats || POKER_PLAY_MAX_SEATS) }, (_value, index) => index + 1).find((seat) => !occupied.has(seat));
  if (!openSeatNumber) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_FULL', 'No open seat is available at this table.');
  }
  const buyInOil = computeBuyInOil(table, body?.buyInOil);
  const oilBalance = deps.computeOilBalance(walletBinding.walletSubject);
  if (oilBalance.balance < buyInOil) {
    throw createRouteError(409, 'OIL_BALANCE_TOO_LOW', 'Not enough OIL balance to cover the table buy-in.', {
      requiredOil: buyInOil,
      balance: oilBalance.balance,
    });
  }

  deps.createOilLedgerEntry({
    walletSubject: walletBinding.walletSubject,
    houseId,
    verificationId: deps.getStreamflowVerificationByWalletSubject(walletBinding.walletSubject)?.verificationId || null,
    entryKind: 'poker_play_buy_in',
    direction: 'debit',
    amount: buyInOil,
    memo: `${table.title} buy-in`,
  });

  deps.upsertPokerPlaySeat({
    tableId: table.tableId,
    seatNumber: openSeatNumber,
    portalSessionId: session.sessionId,
    houseId,
    walletSubject: walletBinding.walletSubject,
    displayName: normalizePokerPlayDisplayName(body?.displayName, session?.agent?.name || houseId || walletBinding.walletSubject.slice(0, 8)),
    status: normalizePokerPlayTableType(table.tableType) === 'tournament' && currentHand && currentHand.status === 'live' ? 'registered' : 'active',
    buyInOil,
    stackOil: buyInOil,
    streamflowVerificationId: deps.getStreamflowVerificationByWalletSubject(walletBinding.walletSubject)?.verificationId || null,
    lastSeenAt: requestAt,
    disconnectedAt: null,
    updatedAt: requestAt,
  });
  if (normalizePokerPlayTableType(table.tableType) === 'tournament' && currentHand && currentHand.status === 'live') {
    deps.createPokerPlayMessage({
      tableId: table.tableId,
      handId: currentHand.handId,
      seatNumber: null,
      authorRole: 'system',
      body: `${formatSeatLabel(openSeatNumber, normalizePokerPlayDisplayName(body?.displayName, session?.agent?.name || houseId || walletBinding.walletSubject.slice(0, 8)))} registers for the next hand.`,
      createdAt: requestAt,
    });
  }

  const refreshed = syncPokerPlayTable(deps, table.tableId, { processAt: requestAt });
  return buildPokerPlayTablePayload(deps, refreshed.table, refreshed.seats, refreshed.hand, { session, req, processAt: requestAt });
}

function createTable(deps, { session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const walletBinding = deps.resolvePrimaryWalletSubject(session, req);
  if (!walletBinding?.walletSubject) {
    throw createRouteError(409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before creating a live poker table.');
  }
  const houseId = getSessionHouseId(session);
  if (!houseId) {
    throw createRouteError(409, 'HOUSE_REQUIRED', 'Join a house before creating a live poker table.');
  }
  const created = createDynamicTable(deps, body, { createdAt: requestAt });
  if (body?.joinNow === false) {
    return buildPokerPlayTablePayload(deps, created, deps.listPokerPlaySeatsByTable(created.tableId), deps.getCurrentPokerPlayHandForTable(created.tableId), {
      session,
      req,
      processAt: requestAt,
    });
  }
  return seatIntoTable(deps, {
    tableId: created.tableId,
    session,
    req,
    body: {
      ...body,
      seatNumber: body?.seatNumber,
      asOf: requestAt,
    },
  });
}

function matchmakeIntoTable(deps, { session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const walletBinding = deps.resolvePrimaryWalletSubject(session, req);
  if (!walletBinding?.walletSubject) {
    throw createRouteError(409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before match-making into live poker.');
  }
  const table = resolveMatchmakeTable(deps, body, { processAt: requestAt });
  return seatIntoTable(deps, {
    tableId: table.tableId,
    session,
    req,
    body: {
      ...body,
      asOf: requestAt,
    },
  });
}

function leaveTable(deps, { tableId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const table = deps.getPokerPlayTableById(tableId);
  if (!table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  const synced = syncPokerPlayTable(deps, tableId, { processAt: body?.asOf });
  const { walletBinding, seat } = requireSeatWriter(deps, { table: synced.table, session, req });
  touchPokerPlaySeatPresence(deps, tableId, walletBinding.walletSubject, requestAt);
  const liveHand = synced.hand && synced.hand.status === 'live' ? synced.hand : null;

  if (String(synced.table.tableType || 'cash') === 'cash') {
    if (liveHand) {
      if (!isSeatPendingCashout(seat)) {
        deps.upsertPokerPlaySeat({
          ...seat,
          status: 'pending_cashout',
          updatedAt: requestAt,
        });
        deps.createPokerPlayMessage({
          tableId: synced.table.tableId,
          handId: liveHand.handId,
          seatNumber: null,
          authorRole: 'system',
          body: `${formatSeatLabel(seat.seatNumber, seat.displayName)} will cash out after this hand settles.`,
          createdAt: requestAt,
        });
      }
      const refreshedDuringHand = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
      return buildPokerPlayTablePayload(deps, refreshedDuringHand.table, refreshedDuringHand.seats, refreshedDuringHand.hand, { session, req, processAt: requestAt });
    }
    if (Number(seat.stackOil || 0) > 0) {
      deps.createOilLedgerEntry({
        walletSubject: walletBinding.walletSubject,
        houseId: seat.houseId || null,
        verificationId: seat.streamflowVerificationId || null,
        entryKind: 'poker_play_cashout',
        direction: 'credit',
        amount: Number(seat.stackOil || 0),
        memo: `${synced.table.title} cashout`,
      });
    }
    deps.deletePokerPlaySeat(seat.tableId, seat.seatNumber);
  } else {
    if (liveHand && normalizeTrimmedString(seat?.status).toLowerCase() === 'registered') {
      if (Number(seat.stackOil || 0) > 0) {
        deps.createOilLedgerEntry({
          walletSubject: walletBinding.walletSubject,
          houseId: seat.houseId || null,
          verificationId: seat.streamflowVerificationId || null,
          entryKind: 'poker_play_tournament_unregister',
          direction: 'credit',
          amount: Number(seat.stackOil || 0),
          memo: `${synced.table.title} late registration refund`,
        });
      }
      deps.createPokerPlayMessage({
        tableId: synced.table.tableId,
        handId: liveHand.handId,
        seatNumber: null,
        authorRole: 'system',
        body: `${formatSeatLabel(seat.seatNumber, seat.displayName)} cancels late registration before the next hand begins.`,
        createdAt: requestAt,
      });
      deps.deletePokerPlaySeat(seat.tableId, seat.seatNumber);
      const refreshedRegistered = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
      return buildPokerPlayTablePayload(deps, refreshedRegistered.table, refreshedRegistered.seats, refreshedRegistered.hand, { session, req, processAt: requestAt });
    }
    if (liveHand) {
      throw createRouteError(409, 'POKER_PLAY_HAND_IN_PROGRESS', 'Tournament seats can only leave after the current hand settles.');
    }
    if (seat.status === 'active' && Number(seat.stackOil || 0) > 0) {
      throw createRouteError(409, 'POKER_PLAY_TOURNAMENT_STILL_ACTIVE', 'Tournament chips must finish the table; cashout is not available.');
    }
    deps.deletePokerPlaySeat(seat.tableId, seat.seatNumber);
  }

  const refreshed = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  return buildPokerPlayTablePayload(deps, refreshed.table, refreshed.seats, refreshed.hand, { session, req, processAt: requestAt });
}

function postMessage(deps, { handId, session, req, body } = {}) {
  const hand = deps.getPokerPlayHandById(handId);
  if (!hand) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker hand not found.');
  }
  const synced = syncPokerPlayTable(deps, hand.tableId, { processAt: body?.asOf });
  const currentHand = deps.getPokerPlayHandById(handId) || synced.hand;
  if (!currentHand || currentHand.tableId !== synced.table.tableId) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker hand not found.');
  }
  const { seat } = requireSeatWriter(deps, { table: synced.table, session, req });
  const touchedSeat = touchPokerPlaySeatPresence(deps, synced.table.tableId, seat.walletSubject, toProcessIso(deps, body?.asOf)) || seat;
  const messageBody = normalizePokerPlayMessageBody(body?.body);
  if (!messageBody) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Message body is required.');
  }
  const created = deps.createPokerPlayMessage({
    tableId: synced.table.tableId,
    handId: currentHand.handId,
    seatNumber: touchedSeat.seatNumber,
    authorRole: 'human',
    body: messageBody,
  });
  let agentMessage = null;
  if (currentHand.status === 'live') {
      const prompt = buildPrivateAgentPrompt(synced.table, currentHand.state, touchedSeat.seatNumber);
      if (prompt) {
        agentMessage = deps.createPokerPlayMessage({
          tableId: synced.table.tableId,
          handId: currentHand.handId,
          seatNumber: touchedSeat.seatNumber,
          authorRole: 'agent',
          body: prompt.body,
        });
    }
  }
  return {
    handId: currentHand.handId,
    messages: [created, agentMessage].filter(Boolean),
  };
}

function postAction(deps, { handId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const hand = deps.getPokerPlayHandById(handId);
  if (!hand) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker hand not found.');
  }
  const synced = syncPokerPlayTable(deps, hand.tableId, { processAt: body?.asOf });
  const currentHand = deps.getPokerPlayHandById(handId) || synced.hand;
  if (isTablePaused(synced.table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_PAUSED', 'This poker table is paused by an operator.');
  }
  if (!currentHand || currentHand.status !== 'live') {
    throw createRouteError(409, 'POKER_PLAY_HAND_NOT_LIVE', 'This poker hand is no longer live.');
  }
  const { seat } = requireSeatWriter(deps, { table: synced.table, session, req });
  const touchedSeat = touchPokerPlaySeatPresence(deps, synced.table.tableId, seat.walletSubject, requestAt) || seat;
  if (normalizeSeatNumber(currentHand.state?.actingSeat) !== normalizeSeatNumber(touchedSeat.seatNumber)) {
    throw createRouteError(409, 'POKER_PLAY_NOT_YOUR_TURN', 'It is not this seat’s turn to act.', {
      actingSeat: normalizeSeatNumber(currentHand.state?.actingSeat),
      seatNumber: normalizeSeatNumber(touchedSeat.seatNumber),
    });
  }
  const actionKind = normalizeTrimmedString(body?.actionKind).toLowerCase();
  const amountOil = normalizeOilAmount(body?.amountOil, 0);
  if (!actionKind) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Action kind is required.');
  }
  let outcome;
  try {
    outcome = applyPokerPlayActionToHandState({
      table: synced.table,
      handState: currentHand.state,
      seatNumber: touchedSeat.seatNumber,
      actionKind,
      amountOil,
      nowIso: requestAt,
    });
  } catch (err) {
    throw createRouteError(
      err?.code === 'POKER_PLAY_RAISE_TOO_SMALL' ? 409 : 400,
      err?.code || 'POKER_PLAY_ACTION_INVALID',
      err?.code === 'POKER_PLAY_RAISE_TOO_SMALL'
        ? 'The requested raise is smaller than the current minimum.'
        : 'This action is not valid for the current poker hand.',
      {
        requiredOil: err?.requiredOil,
      }
    );
  }

  const action = deps.createPokerPlayAction({
    tableId: synced.table.tableId,
    handId: currentHand.handId,
    seatNumber: touchedSeat.seatNumber,
    actorRole: 'human',
    actionKind,
    amountOil: Number(outcome.normalizedAmountOil || outcome.debitOil || 0),
    payload: {
      requestedAmountOil: amountOil,
    },
    createdAt: requestAt,
  });
  deps.createPokerPlayMessage({
    tableId: synced.table.tableId,
    handId: currentHand.handId,
    seatNumber: null,
    authorRole: 'system',
    body: `${formatSeatLabel(touchedSeat.seatNumber, touchedSeat.displayName)} ${buildActionNarrative(actionKind, outcome.normalizedAmountOil || outcome.debitOil || 0)}.`,
    createdAt: requestAt,
  });
  deps.upsertPokerPlayHand({
    ...currentHand,
    status: outcome.handState?.status || 'live',
    actionExpiresAt: outcome.handState?.actionExpiresAt || null,
    state: outcome.handState,
    result: outcome.handState?.result || {},
    updatedAt: requestAt,
  });

  if (outcome.handState?.status === 'live' && outcome.handState?.actingSeat) {
    const prompt = buildPrivateAgentPrompt(synced.table, outcome.handState, outcome.handState.actingSeat);
    if (prompt) {
      deps.createPokerPlayMessage({
        tableId: synced.table.tableId,
        handId: currentHand.handId,
        seatNumber: outcome.handState.actingSeat,
        authorRole: 'agent',
        body: prompt.body,
        createdAt: requestAt,
      });
    }
  }

  const refreshed = syncPokerPlayTable(deps, synced.table.tableId, { processAt: requestAt });
  return buildPokerPlayTablePayload(deps, refreshed.table, refreshed.seats, refreshed.hand, { session, req, processAt: requestAt });
}

function openHandDispute(deps, { handId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const hand = deps.getPokerPlayHandById(handId);
  if (!hand) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker hand not found.');
  }
  const synced = syncPokerPlayTable(deps, hand.tableId, { processAt: requestAt });
  const currentHand = deps.getPokerPlayHandById(handId) || hand;
  if (!synced?.table || currentHand.tableId !== synced.table.tableId) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker hand not found.');
  }
  const { walletBinding, seat } = requireSeatWriter(deps, { table: synced.table, session, req });
  const touchedSeat = touchPokerPlaySeatPresence(deps, synced.table.tableId, walletBinding.walletSubject, requestAt) || seat;
  const seatNumber = normalizeSeatNumber(touchedSeat.seatNumber);
  if (!seatNumber || !currentHand?.state?.seatStates || !currentHand.state.seatStates[String(seatNumber)]) {
    throw createRouteError(403, 'FORBIDDEN', 'Only a seated player from this hand can flag it for review.');
  }
  const note = normalizePokerPlayDisputeNote(body?.note);
  if (!note) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'A review note is required.');
  }
  const category = normalizePokerPlayDisputeCategory(body?.category, 'general');
  const existing = deps.listPokerPlayDisputesByHand(currentHand.handId, { status: 'open', limit: 50 })
    .find((dispute) => normalizeTrimmedString(dispute?.walletSubject) === normalizeTrimmedString(walletBinding.walletSubject));
  if (!existing) {
    const dispute = deps.upsertPokerPlayDispute({
      disputeId: `pkdp_${deps.randomHex(10)}`,
      tableId: synced.table.tableId,
      handId: currentHand.handId,
      seatNumber,
      houseId: touchedSeat.houseId || getSessionHouseId(session) || null,
      walletSubject: walletBinding.walletSubject,
      status: 'open',
      category,
      note,
      createdAt: requestAt,
      updatedAt: requestAt,
    });
    deps.createPokerPlayMessage({
      tableId: synced.table.tableId,
      handId: currentHand.handId,
      seatNumber: null,
      authorRole: 'system',
      body: `${formatSeatLabel(seatNumber, touchedSeat.displayName)} flagged the hand for operator review.`,
      createdAt: requestAt,
    });
    if (typeof deps.createPokerPlayAuditEvent === 'function') {
      deps.createPokerPlayAuditEvent({
        tableId: synced.table.tableId,
        handId: currentHand.handId,
        disputeId: dispute.disputeId,
        seatNumber,
        actorRole: 'human',
        eventKind: 'dispute_opened',
        payload: {
          category,
          note,
          walletSubject: walletBinding.walletSubject,
          houseId: touchedSeat.houseId || getSessionHouseId(session) || null,
        },
        createdAt: requestAt,
      });
    }
  }
  let refreshed = synced;
  if (!isTablePaused(synced.table)) {
    refreshed = pauseTable(deps, {
      tableId: synced.table.tableId,
      reason: 'hand review',
      actorLabel: 'system',
      asOf: requestAt,
    });
  } else {
    refreshed = {
      table: synced.table,
      seats: synced.seats,
      hand: currentHand,
    };
  }
  return buildPokerPlayTablePayload(
    deps,
    refreshed.table,
    refreshed.seats,
    refreshed.hand,
    { session, req, processAt: requestAt }
  );
}

function resolveHandDispute(deps, { disputeId, body, processAt } = {}) {
  const requestAt = toProcessIso(deps, processAt || body?.asOf);
  const dispute = deps.getPokerPlayDisputeById(disputeId);
  if (!dispute) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker dispute not found.');
  }
  if (normalizeTrimmedString(dispute.status).toLowerCase() !== 'open') {
    throw createRouteError(409, 'POKER_PLAY_DISPUTE_CLOSED', 'This poker dispute is already closed.');
  }
  const status = normalizePokerPlayDisputeResolutionStatus(body?.status);
  if (!status) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Resolution status must be resolved or dismissed.');
  }
  const resolutionNote = normalizePokerPlayDisputeNote(body?.resolutionNote);
  const resolvedBy = normalizeTrimmedString(body?.resolvedBy, 'operator');
  const updated = deps.upsertPokerPlayDispute({
    ...dispute,
    status,
    resolutionNote: resolutionNote || null,
    resolvedAt: requestAt,
    resolvedBy,
    updatedAt: requestAt,
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: updated.tableId,
      handId: updated.handId,
      disputeId: updated.disputeId,
      seatNumber: updated.seatNumber,
      actorRole: 'operator',
      eventKind: status === 'resolved' ? 'dispute_resolved' : 'dispute_dismissed',
      payload: {
        status,
        resolutionNote: resolutionNote || null,
        resolvedBy,
      },
      createdAt: requestAt,
    });
  }
  const hand = deps.getPokerPlayHandById(updated.handId);
  if (hand) {
    deps.createPokerPlayMessage({
      tableId: updated.tableId,
      handId: hand.handId,
      seatNumber: null,
      authorRole: 'system',
      body: status === 'resolved'
        ? 'Operator resolved the hand review.'
        : 'Operator dismissed the hand review.',
      createdAt: requestAt,
    });
  }
  const remainingOpen = deps.listPokerPlayDisputesByTable(updated.tableId, { status: 'open', limit: 50 });
  const table = deps.getPokerPlayTableById(updated.tableId);
  if (body?.resumeTable === true && table && isTablePaused(table) && !remainingOpen.length) {
    resumeTable(deps, {
      tableId: updated.tableId,
      actorLabel: 'operator',
      asOf: requestAt,
    });
  }
  return {
    dispute: updated,
    review: buildPokerPlayAdminReviewPayload(deps, {
      tableId: updated.tableId,
      processAt: requestAt,
      handId: updated.handId,
    }),
  };
}

module.exports = {
  buildPokerPlayAdminReviewPayload,
  buildPokerPlayLobbyPayload,
  buildPokerPlayTablePayload,
  createTable,
  createRouteError,
  getTableDetail,
  listTables,
  leaveTable,
  matchmakeIntoTable,
  normalizePokerPlayDisplayName,
  normalizePokerPlayMessageBody,
  openHandDispute,
  pauseTable,
  postAction,
  postMessage,
  resolveHandDispute,
  resumeTable,
  seatIntoTable,
  syncPokerPlayTable,
};
