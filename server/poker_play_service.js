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
const DEFAULT_PLAY_TIME_BANK_SECONDS = 0;
const POKER_PLAY_ROOM_TREASURY_WALLET_SUBJECT = '__poker_play_room_treasury__';
const POKER_PLAY_ROOM_TREASURY_ENTRY_KINDS = ['poker_play_room_treasury_credit'];
const POKER_PLAY_NATIVE_SEASON_ID_RE = /^native-(\d{4})-(0[1-9]|1[0-2])$/;
const POKER_PLAY_RECONCILE_RULES = [
  {
    key: 'buy_in',
    statField: 'buyInOil',
    direction: 'debit',
    entryKinds: ['poker_play_buy_in', 'poker_play_waitlist_buy_in'],
  },
  {
    key: 'reload',
    statField: 'reloadOil',
    direction: 'debit',
    entryKinds: ['poker_play_reload', 'poker_play_tournament_rebuy', 'poker_play_tournament_addon'],
  },
  {
    key: 'cashout',
    statField: 'cashoutOil',
    direction: 'credit',
    entryKinds: ['poker_play_cashout'],
  },
  {
    key: 'refund',
    statField: 'refundOil',
    direction: 'credit',
    entryKinds: ['poker_play_admin_refund', 'poker_play_tournament_refund', 'poker_play_tournament_unregister'],
  },
  {
    key: 'prize',
    statField: 'prizeOil',
    direction: 'credit',
    entryKinds: ['poker_play_tournament_prize'],
  },
  {
    key: 'bounty',
    statField: 'bountyOil',
    direction: 'credit',
    entryKinds: ['poker_play_tournament_bounty'],
  },
];
const POKER_PLAY_REFUND_ENTRY_KINDS = ['poker_play_admin_refund', 'poker_play_tournament_refund', 'poker_play_tournament_unregister'];
const POKER_PLAY_PAYOUT_ENTRY_KINDS = ['poker_play_tournament_prize'];
const POKER_PLAY_BOUNTY_ENTRY_KINDS = ['poker_play_tournament_bounty'];
const POKER_PLAY_TREASURY_ENTRY_KINDS = ['poker_play_room_treasury_credit'];
const POKER_PLAY_CHOP_ACTIVE_STATUSES = new Set(['open', 'pending_approval']);
const POKER_PLAY_POLICY_SPEND_ENTRY_KINDS = [
  'poker_play_buy_in',
  'poker_play_waitlist_buy_in',
  'poker_play_reload',
  'poker_play_tournament_rebuy',
  'poker_play_tournament_addon',
];
const DEFAULT_POKER_PLAY_SELF_EXCLUDE_HOURS = 24;

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

function normalizeIsoString(value) {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : '';
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

function normalizePokerPlayChopStatus(value, fallback = 'open') {
  const status = normalizeTrimmedString(value, fallback).toLowerCase();
  if (status === 'pending_approval') return 'pending_approval';
  if (status === 'rejected') return 'rejected';
  if (status === 'settled') return 'settled';
  return 'open';
}

function normalizePokerPlayChopNote(value) {
  const note = normalizeTrimmedString(value);
  return note ? note.slice(0, 400) : '';
}

function normalizePokerPlayProposalConfidence(value, fallback = 'medium') {
  const confidence = normalizeTrimmedString(value, fallback).toLowerCase();
  return ['low', 'medium', 'high'].includes(confidence) ? confidence : fallback;
}

function normalizePokerPlayAuditActorRole(value, fallback = 'system') {
  const role = normalizeTrimmedString(value, fallback).toLowerCase();
  return ['human', 'agent', 'operator', 'system'].includes(role) ? role : fallback;
}

function normalizePokerPlayTableType(value, fallback = 'cash') {
  const type = normalizeTrimmedString(value, fallback).toLowerCase();
  return type === 'tournament' ? 'tournament' : 'cash';
}

function normalizePokerPlayCashRakeBps(value, fallback = 0) {
  return Math.max(0, Math.min(1000, normalizeOilAmount(value, fallback)));
}

function normalizePokerPlayCashRakeCapOil(value, fallback = 0) {
  return Math.max(0, normalizeOilAmount(value, fallback));
}

function normalizePokerPlayTournamentEntryFeeOil(value, buyInOil, fallback = 0) {
  const maxFeeOil = Math.max(0, normalizeOilAmount(buyInOil, 0) - 1);
  return Math.max(0, Math.min(maxFeeOil, normalizeOilAmount(value, fallback)));
}

function normalizePokerPlayScheduleTemplateId(value, fallback = '') {
  return normalizeTrimmedString(value, fallback).slice(0, 64);
}

function normalizePokerPlayScheduleTemplateTitle(value, fallback = '') {
  return normalizeTrimmedString(value, fallback).slice(0, 96);
}

function normalizePokerPlayScheduleRecurrenceLabel(value, fallback = '') {
  return normalizeTrimmedString(value, fallback).slice(0, 96);
}

function normalizePokerPlayScheduleRecurrenceKind(value, fallback = 'daily') {
  const kind = normalizeTrimmedString(value, fallback).toLowerCase();
  return kind === 'weekly' ? 'weekly' : 'daily';
}

function normalizePokerPlayScheduleTemplateStatus(value, fallback = 'active') {
  const status = normalizeTrimmedString(value, fallback).toLowerCase();
  return status === 'cancelled' ? 'cancelled' : 'active';
}

function normalizePokerPlayScheduledBreakLabel(value, fallback = '') {
  return normalizeTrimmedString(value, fallback).slice(0, 80);
}

function normalizePokerPlayScheduledBreaks(value, { handsPerBlindLevel = 0 } = {}) {
  const items = Array.isArray(value) ? value : [];
  const fallbackAfterHandNumber = Math.max(2, normalizeOilAmount(handsPerBlindLevel, 2));
  const normalized = [];
  const seenAfterHandNumbers = new Set();
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const afterHandNumber = Math.max(1, normalizeOilAmount(item?.afterHandNumber, fallbackAfterHandNumber));
    if (seenAfterHandNumbers.has(afterHandNumber)) continue;
    seenAfterHandNumbers.add(afterHandNumber);
    normalized.push({
      breakId: normalizeTrimmedString(item?.breakId, `break_after_${afterHandNumber}`).slice(0, 64),
      label: normalizePokerPlayScheduledBreakLabel(item?.label, `Break ${index + 1}`),
      afterHandNumber,
      durationMinutes: Math.max(1, Math.min(60, normalizeOilAmount(item?.durationMinutes, 5))),
    });
  }
  return normalized
    .sort((left, right) => left.afterHandNumber - right.afterHandNumber)
    .slice(0, 12);
}

function normalizePokerPlayTournamentFillPolicy(value, fallback = 'open_match') {
  const policy = normalizeTrimmedString(value, fallback).toLowerCase();
  if (policy === 'fill_to_full') return 'fill_to_full';
  if (policy === 'fill_to_target') return 'fill_to_target';
  return 'open_match';
}

function isSitAndGoFillPolicy(value) {
  const policy = normalizePokerPlayTournamentFillPolicy(value);
  return policy === 'fill_to_full' || policy === 'fill_to_target';
}

function normalizePokerPlayTournamentBountyModel(value, fallback = 'none') {
  const model = normalizeTrimmedString(value, fallback).toLowerCase();
  if (model === 'pko_50') return 'pko_50';
  if (model === 'pko_75') return 'pko_75';
  if (model === 'full_bounty') return 'full_bounty';
  return 'none';
}

function normalizePokerPlayTournamentFormat(value, fallback = 'standard') {
  const format = normalizeTrimmedString(value, fallback).toLowerCase();
  if (format === 'satellite') return 'satellite';
  if (format === 'multi_flight') return 'multi_flight';
  return 'standard';
}

function normalizePokerPlayMultiFlightFestivalId(value, fallback = '') {
  return normalizeTrimmedString(value, fallback).slice(0, 96);
}

function normalizePokerPlayMultiFlightFestivalTitle(value, fallback = '') {
  return normalizeTrimmedString(value, fallback).slice(0, 96);
}

function normalizePokerPlayMultiFlightFlightCode(value, fallback = '') {
  return normalizeTrimmedString(value, fallback)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

function normalizePokerPlayMultiFlightFlightLabel(value, fallback = '') {
  return normalizeTrimmedString(value, fallback).slice(0, 96);
}

function normalizePokerPlayTournamentSatelliteAwardKind(value, fallback = 'ticket') {
  const kind = normalizeTrimmedString(value, fallback).toLowerCase();
  if (kind === 'credit') return 'credit';
  if (kind === 'qualifier_seat') return 'qualifier_seat';
  return 'ticket';
}

function normalizePokerPlayAccessMode(value, fallback = 'public') {
  const mode = normalizeTrimmedString(value, fallback).toLowerCase();
  return mode === 'invite_only' ? 'invite_only' : 'public';
}

function normalizePokerPlayBlindReturnPolicy(value, fallback = 'post_big_blind') {
  const policy = normalizeTrimmedString(value, fallback).toLowerCase();
  return policy === 'wait_for_big_blind' ? 'wait_for_big_blind' : 'post_big_blind';
}

function normalizePokerPlayNotebookEntryKind(value, fallback = 'notebook') {
  const kind = normalizeTrimmedString(value, fallback).toLowerCase();
  return kind === 'opponent_note' ? 'opponent_note' : 'notebook';
}

function normalizePokerPlayNotebookAuthorRole(value, fallback = 'human') {
  const role = normalizeTrimmedString(value, fallback).toLowerCase();
  return role === 'worker' ? 'worker' : 'human';
}

function normalizePokerPlayNotebookTopic(value) {
  return normalizeTrimmedString(value).slice(0, 120);
}

function normalizePokerPlayNotebookBody(value) {
  return normalizeTrimmedString(value).slice(0, 800);
}

function normalizePokerPlayNotebookTags(value) {
  const items = Array.isArray(value)
    ? value
    : String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  const seen = new Set();
  return items
    .map((item) => normalizeTrimmedString(item).toLowerCase())
    .map((item) => item.replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32))
    .filter(Boolean)
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .slice(0, 8);
}

function normalizePokerPlayInviteCode(value, fallback = '') {
  const code = normalizeTrimmedString(value, fallback)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return code || fallback;
}

function normalizeCashLifecycleSeatStatus(value, fallback = 'active') {
  const status = normalizeTrimmedString(value, fallback).toLowerCase();
  const allowed = new Set([
    'active',
    'registered',
    'pending_cashout',
    'sitout_next_hand',
    'sitting_out',
    'away_next_hand',
    'away',
    'waiting_big_blind',
    'busted',
    'advanced',
    'paid',
    'void_refund',
  ]);
  return allowed.has(status) ? status : fallback;
}

function normalizeReloadAmount(value) {
  return Math.max(0, normalizeOilAmount(value, 0));
}

function normalizePokerPlayDailySpendCapOil(value, fallback = 0) {
  if (value == null || value === '') return Math.max(0, Number(fallback || 0));
  return Math.max(0, normalizeOilAmount(value, fallback));
}

function normalizePokerPlaySelfExcludeHours(value, fallback = 0) {
  if (value == null || value === '') return Math.max(0, Number(fallback || 0));
  return Math.max(0, normalizeOilAmount(value, fallback));
}

function normalizeSeatCount(value, fallback = POKER_PLAY_MAX_SEATS) {
  const seats = normalizeOilAmount(value, fallback);
  return Math.max(2, Math.min(POKER_PLAY_MAX_SEATS, seats || fallback));
}

function normalizeTournamentStartTargetSeats(value, { minPlayers = 2, maxSeats = POKER_PLAY_MAX_SEATS, fillPolicy = 'open_match' } = {}) {
  const normalizedFillPolicy = normalizePokerPlayTournamentFillPolicy(fillPolicy);
  const normalizedMinPlayers = Math.max(2, Math.min(normalizeSeatCount(maxSeats, POKER_PLAY_MAX_SEATS), normalizeOilAmount(minPlayers, 2)));
  const normalizedMaxSeats = normalizeSeatCount(maxSeats, POKER_PLAY_MAX_SEATS);
  if (normalizedFillPolicy === 'fill_to_full') return normalizedMaxSeats;
  if (normalizedFillPolicy === 'fill_to_target') {
    return Math.max(
      normalizedMinPlayers,
      Math.min(normalizedMaxSeats, normalizeOilAmount(value, Math.min(normalizedMaxSeats, Math.max(normalizedMinPlayers, 3))))
    );
  }
  return normalizedMinPlayers;
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
  const fillPolicy = tableType === 'tournament'
    ? normalizePokerPlayTournamentFillPolicy(input?.fillPolicy)
    : 'open_match';
  const accessMode = normalizePokerPlayAccessMode(input?.accessMode);
  const smallBlindOil = Math.max(1, normalizeOilAmount(input?.smallBlindOil, tableType === 'cash' ? 10 : 50));
  const bigBlindOil = Math.max(smallBlindOil * 2, normalizeOilAmount(input?.bigBlindOil, tableType === 'cash' ? 20 : 100));
  const buyInOil = Math.max(bigBlindOil * 10, normalizeOilAmount(input?.buyInOil, tableType === 'cash' ? 400 : 300));
  const maxSeats = normalizeSeatCount(input?.maxSeats, POKER_PLAY_MAX_SEATS);
  const minPlayers = Math.max(2, Math.min(maxSeats, normalizeOilAmount(input?.minPlayers, 2)));
  const countdownSeconds = Math.max(10, normalizeOilAmount(input?.decisionCountdownSeconds, DEFAULT_PLAY_ACTION_COUNTDOWN_SECONDS));
  const presenceTimeoutSeconds = Math.max(10, normalizeOilAmount(input?.presenceTimeoutSeconds, DEFAULT_PLAY_PRESENCE_TIMEOUT_SECONDS));
  const reconnectGraceSeconds = Math.max(10, normalizeOilAmount(input?.reconnectGraceSeconds, DEFAULT_PLAY_RECONNECT_GRACE_SECONDS));
  const timeBankSeconds = Math.max(0, normalizeOilAmount(input?.timeBankSeconds, DEFAULT_PLAY_TIME_BANK_SECONDS));
  const lateRegistrationHands = tableType === 'tournament'
    ? (isSitAndGoFillPolicy(fillPolicy) ? 0 : Math.max(0, normalizeOilAmount(input?.lateRegistrationHands, 2)))
    : 0;
  const handsPerBlindLevel = tableType === 'tournament'
    ? Math.max(1, normalizeOilAmount(input?.handsPerBlindLevel, 2))
    : 0;
  const blindLevels = tableType === 'tournament'
    ? normalizeTournamentBlindLevels(input?.blindLevels, smallBlindOil, bigBlindOil)
    : [];
  const bountyModel = tableType === 'tournament'
    ? normalizePokerPlayTournamentBountyModel(input?.bountyModel)
    : 'none';
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
  const scheduledStartAt = tableType === 'tournament'
    ? normalizeIsoString(input?.scheduledStartAt)
    : '';
  const reentryLimit = tableType === 'tournament'
    ? (isSitAndGoFillPolicy(fillPolicy) ? 0 : Math.max(0, normalizeOilAmount(input?.reentryLimit, 0)))
    : 0;
  const startTargetSeats = tableType === 'tournament'
    ? normalizeTournamentStartTargetSeats(input?.startTargetSeats, { minPlayers, maxSeats, fillPolicy })
    : minPlayers;
  const blindReturnPolicy = tableType === 'cash'
    ? normalizePokerPlayBlindReturnPolicy(input?.blindReturnPolicy)
    : 'post_big_blind';
  const cashRakeBps = tableType === 'cash'
    ? normalizePokerPlayCashRakeBps(input?.cashRakeBps, 0)
    : 0;
  const cashRakeCapOil = tableType === 'cash'
    ? normalizePokerPlayCashRakeCapOil(input?.cashRakeCapOil, 0)
    : 0;
  const tournamentEntryFeeOil = tableType === 'tournament'
    ? normalizePokerPlayTournamentEntryFeeOil(input?.tournamentEntryFeeOil, buyInOil, 0)
    : 0;
  const formatVariant = tableType === 'tournament'
    ? normalizePokerPlayTournamentFormat(input?.formatVariant)
    : 'standard';
  const satelliteTargetSeriesId = tableType === 'tournament' && formatVariant === 'satellite'
    ? normalizeTrimmedString(input?.satelliteTargetSeriesId)
    : '';
  const satelliteTargetSeriesTitle = tableType === 'tournament' && formatVariant === 'satellite'
    ? normalizeTrimmedString(input?.satelliteTargetSeriesTitle)
    : '';
  const satelliteAwardKind = tableType === 'tournament' && formatVariant === 'satellite'
    ? normalizePokerPlayTournamentSatelliteAwardKind(input?.satelliteAwardKind)
    : 'ticket';
  const satelliteAwardCount = tableType === 'tournament' && formatVariant === 'satellite'
    ? Math.max(1, normalizeOilAmount(input?.satelliteAwardCount, 1))
    : 0;
  const satelliteAwardValueOil = tableType === 'tournament' && formatVariant === 'satellite'
    ? Math.max(0, normalizeOilAmount(input?.satelliteAwardValueOil, buyInOil))
    : 0;
  const multiFlightFestivalParentId = tableType === 'tournament' && formatVariant === 'multi_flight'
    ? normalizePokerPlayMultiFlightFestivalId(input?.multiFlightFestivalParentId)
    : '';
  const multiFlightFestivalTitle = tableType === 'tournament' && formatVariant === 'multi_flight'
    ? normalizePokerPlayMultiFlightFestivalTitle(input?.multiFlightFestivalTitle, seriesTitle || title)
    : '';
  const multiFlightFlightCode = tableType === 'tournament' && formatVariant === 'multi_flight'
    ? normalizePokerPlayMultiFlightFlightCode(input?.multiFlightFlightCode)
    : '';
  const multiFlightFlightLabel = tableType === 'tournament' && formatVariant === 'multi_flight'
    ? normalizePokerPlayMultiFlightFlightLabel(
      input?.multiFlightFlightLabel,
      multiFlightFlightCode ? `Flight ${multiFlightFlightCode}` : ''
    )
    : '';
  const multiFlightMergeSeriesId = tableType === 'tournament' && formatVariant === 'multi_flight'
    ? normalizeTrimmedString(input?.multiFlightMergeSeriesId)
    : '';
  const multiFlightMergeSeriesTitle = tableType === 'tournament' && formatVariant === 'multi_flight'
    ? normalizeTrimmedString(input?.multiFlightMergeSeriesTitle)
    : '';
  const multiFlightAdvanceSeatCount = tableType === 'tournament' && formatVariant === 'multi_flight' && multiFlightMergeSeriesId
    ? Math.max(1, Math.min(maxSeats, normalizeOilAmount(input?.multiFlightAdvanceSeatCount, minPlayers)))
    : 0;
  const rebuyLimit = tableType === 'tournament'
    ? Math.max(0, normalizeOilAmount(input?.rebuyLimit, 0))
    : 0;
  const rebuyWindowHands = tableType === 'tournament'
    ? Math.max(0, normalizeOilAmount(input?.rebuyWindowHands, 0))
    : 0;
  const addonWindowAfterHandNumbers = tableType === 'tournament'
    ? normalizePokerPlayTournamentAddonWindowAfterHandNumbers(input?.addonWindowAfterHandNumbers)
    : [];
  const maxAddonsPerSeat = tableType === 'tournament'
    ? Math.max(0, normalizeOilAmount(input?.maxAddonsPerSeat, addonWindowAfterHandNumbers.length ? 1 : 0))
    : 0;
  const addonCostOil = tableType === 'tournament' && maxAddonsPerSeat > 0
    ? normalizePokerPlayTournamentAddonCostOil(input?.addonCostOil, buyInOil)
    : 0;
  const addonChipsOil = tableType === 'tournament' && maxAddonsPerSeat > 0
    ? normalizePokerPlayTournamentAddonChipsOil(input?.addonChipsOil, buyInOil)
    : 0;
  const scheduleTemplateId = tableType === 'tournament'
    ? normalizePokerPlayScheduleTemplateId(input?.scheduleTemplateId)
    : '';
  const scheduleTemplateTitle = tableType === 'tournament'
    ? normalizePokerPlayScheduleTemplateTitle(input?.scheduleTemplateTitle, title)
    : '';
  const scheduleRecurrenceLabel = tableType === 'tournament'
    ? normalizePokerPlayScheduleRecurrenceLabel(input?.scheduleRecurrenceLabel)
    : '';
  const scheduledBreaks = tableType === 'tournament'
    ? normalizePokerPlayScheduledBreaks(input?.scheduledBreaks, { handsPerBlindLevel })
    : [];
  return {
    tableType,
    fillPolicy,
    accessMode,
    blindReturnPolicy,
    cashRakeBps,
    cashRakeCapOil,
    smallBlindOil,
    bigBlindOil,
    buyInOil,
    maxSeats,
    minPlayers,
    formatVariant,
    satelliteTargetSeriesId,
    satelliteTargetSeriesTitle,
    satelliteAwardKind,
    satelliteAwardCount,
    satelliteAwardValueOil,
    multiFlightFestivalParentId,
    multiFlightFestivalTitle,
    multiFlightFlightCode,
    multiFlightFlightLabel,
    multiFlightMergeSeriesId,
    multiFlightMergeSeriesTitle,
    multiFlightAdvanceSeatCount,
    decisionCountdownSeconds: countdownSeconds,
    presenceTimeoutSeconds,
    reconnectGraceSeconds,
    timeBankSeconds,
    lateRegistrationHands,
    rebuyLimit,
    rebuyWindowHands,
    addonWindowAfterHandNumbers,
    addonCostOil,
    addonChipsOil,
    maxAddonsPerSeat,
    handsPerBlindLevel,
    blindLevels,
    bountyModel,
    tournamentEntryFeeOil,
    title,
    seriesId,
    seriesTitle,
    scheduledStartAt,
    reentryLimit,
    startTargetSeats,
    scheduleTemplateId,
    scheduleTemplateTitle,
    scheduleRecurrenceLabel,
    scheduledBreaks,
    inviteCode: accessMode === 'invite_only' ? normalizePokerPlayInviteCode(input?.inviteCode) : '',
    creatorWalletSubject: normalizeTrimmedString(input?.creatorWalletSubject),
    creatorHouseId: normalizeTrimmedString(input?.creatorHouseId),
  };
}

function resolveTournamentBlindProgress(table, handNumber = 1, { includePendingAdvances = false } = {}) {
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
  if (!levels.length) {
    return {
      blindLevel: 1,
      handsPerBlindLevel,
      smallBlindOil: Math.max(1, normalizeOilAmount(table?.smallBlindOil, 50)),
      bigBlindOil: Math.max(2, normalizeOilAmount(table?.bigBlindOil, 100)),
      levels: [],
      handsUntilIncrease: 0,
      nextBlindLevel: 0,
    };
  }
  const naturalLevelIndex = Math.floor((currentHandNumber - 1) / handsPerBlindLevel);
  const directorBlindLevelAdjustment = Math.max(0, normalizeOilAmount(table?.state?.directorBlindLevelAdjustment, 0));
  const directorBlindAdvancesPending = Math.max(
    0,
    includePendingAdvances ? normalizeOilAmount(table?.state?.directorBlindAdvancesPending, 0) : 0
  );
  const levelIndex = Math.min(levels.length - 1, naturalLevelIndex + directorBlindLevelAdjustment + directorBlindAdvancesPending);
  const level = levels[levelIndex] || levels[0];
  const nextLevel = levels[levelIndex + 1] || null;
  const nextLevelStartsAtHand = nextLevel ? (naturalLevelIndex + 1) * handsPerBlindLevel + 1 : 0;
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
    const formatVariant = normalizePokerPlayTournamentFormat(config?.formatVariant);
    base.push(`fp${normalizePokerPlayTournamentFillPolicy(config?.fillPolicy)}`);
    base.push(`ft${formatVariant}`);
    base.push(`st${normalizeTournamentStartTargetSeats(config?.startTargetSeats, {
      minPlayers: config?.minPlayers,
      maxSeats: config?.maxSeats,
      fillPolicy: config?.fillPolicy,
    })}`);
    base.push(`hbl${Math.max(1, normalizeOilAmount(config?.handsPerBlindLevel, 2))}`);
    base.push(`bl${blindLevels.map((level) => `${level.smallBlindOil}-${level.bigBlindOil}`).join('_')}`);
    base.push(`lr${Math.max(0, normalizeOilAmount(config?.lateRegistrationHands, 0))}`);
    base.push(`re${Math.max(0, normalizeOilAmount(config?.reentryLimit, 0))}`);
    base.push(`rr${Math.max(0, normalizeOilAmount(config?.rebuyLimit, 0))}`);
    base.push(`rw${Math.max(0, normalizeOilAmount(config?.rebuyWindowHands, 0))}`);
    base.push(`aw${normalizePokerPlayTournamentAddonWindowAfterHandNumbers(config?.addonWindowAfterHandNumbers).join('_') || 'none'}`);
    base.push(`ac${normalizePokerPlayTournamentAddonCostOil(config?.addonCostOil, config?.buyInOil)}`);
    base.push(`ah${normalizePokerPlayTournamentAddonChipsOil(config?.addonChipsOil, config?.buyInOil)}`);
    base.push(`am${Math.max(0, normalizeOilAmount(config?.maxAddonsPerSeat, 0))}`);
    base.push(`bm${normalizePokerPlayTournamentBountyModel(config?.bountyModel)}`);
    base.push(`tf${normalizePokerPlayTournamentEntryFeeOil(config?.tournamentEntryFeeOil, config?.buyInOil, 0)}`);
    if (formatVariant === 'satellite') {
      base.push(`sts${slugifySegment(config?.satelliteTargetSeriesId || 'none', 'none')}`);
      base.push(`sak${normalizePokerPlayTournamentSatelliteAwardKind(config?.satelliteAwardKind)}`);
      base.push(`san${Math.max(1, normalizeOilAmount(config?.satelliteAwardCount, 1))}`);
      base.push(`sav${Math.max(0, normalizeOilAmount(config?.satelliteAwardValueOil, config?.buyInOil))}`);
    } else if (formatVariant === 'multi_flight') {
      base.push(`mff${slugifySegment(config?.multiFlightFestivalParentId || 'none', 'none')}`);
      base.push(`mfm${slugifySegment(config?.multiFlightMergeSeriesId || 'merge', 'merge')}`);
      base.push(`mfc${slugifySegment(config?.multiFlightFlightCode || 'day', 'day')}`);
      base.push(`mfa${Math.max(0, normalizeOilAmount(config?.multiFlightAdvanceSeatCount, 0))}`);
    }
  }
  if (normalizePokerPlayTableType(config?.tableType) === 'cash') {
    base.push(`rb${normalizePokerPlayCashRakeBps(config?.cashRakeBps, 0)}`);
    base.push(`rc${normalizePokerPlayCashRakeCapOil(config?.cashRakeCapOil, 0)}`);
  }
  base.push(`pt${Math.max(10, normalizeOilAmount(config?.presenceTimeoutSeconds, DEFAULT_PLAY_PRESENCE_TIMEOUT_SECONDS))}`);
  base.push(`rg${Math.max(10, normalizeOilAmount(config?.reconnectGraceSeconds, DEFAULT_PLAY_RECONNECT_GRACE_SECONDS))}`);
  base.push(`tb${Math.max(0, normalizeOilAmount(config?.timeBankSeconds, DEFAULT_PLAY_TIME_BANK_SECONDS))}`);
  return base.join(':');
}

function buildMatchKeyFromTable(table) {
  return buildMatchKey({
    tableType: table?.tableType,
    fillPolicy: table?.rules?.fillPolicy,
    smallBlindOil: table?.smallBlindOil,
    bigBlindOil: table?.bigBlindOil,
    buyInOil: table?.buyInOil,
    maxSeats: table?.maxSeats,
    minPlayers: table?.minPlayers,
    handsPerBlindLevel: table?.rules?.handsPerBlindLevel,
    blindLevels: table?.rules?.blindLevels,
    lateRegistrationHands: table?.rules?.lateRegistrationHands,
    reentryLimit: table?.rules?.reentryLimit,
    rebuyLimit: table?.rules?.rebuyLimit,
    rebuyWindowHands: table?.rules?.rebuyWindowHands,
    addonWindowAfterHandNumbers: table?.rules?.addonWindowAfterHandNumbers,
    addonCostOil: table?.rules?.addonCostOil,
    addonChipsOil: table?.rules?.addonChipsOil,
    maxAddonsPerSeat: table?.rules?.maxAddonsPerSeat,
    startTargetSeats: table?.rules?.startTargetSeats,
    formatVariant: table?.rules?.formatVariant,
    satelliteTargetSeriesId: table?.rules?.satelliteTargetSeriesId,
    multiFlightFestivalParentId: table?.rules?.multiFlightFestivalParentId,
    multiFlightMergeSeriesId: table?.rules?.multiFlightMergeSeriesId,
    multiFlightFlightCode: table?.rules?.multiFlightFlightCode,
    multiFlightAdvanceSeatCount: table?.rules?.multiFlightAdvanceSeatCount,
    satelliteAwardKind: table?.rules?.satelliteAwardKind,
    satelliteAwardCount: table?.rules?.satelliteAwardCount,
    satelliteAwardValueOil: table?.rules?.satelliteAwardValueOil,
    bountyModel: table?.rules?.bountyModel,
    tournamentEntryFeeOil: table?.rules?.tournamentEntryFeeOil,
    cashRakeBps: table?.rules?.cashRakeBps,
    cashRakeCapOil: table?.rules?.cashRakeCapOil,
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

function buildPokerPlayInviteCode(deps) {
  return normalizePokerPlayInviteCode(`PK-${String(deps.randomHex(8) || '').slice(0, 8)}`);
}

function getPokerPlayTableAccess(table) {
  const rules = table?.rules && typeof table.rules === 'object' ? table.rules : {};
  const state = table?.state && typeof table.state === 'object' ? table.state : {};
  const mode = normalizePokerPlayAccessMode(rules.accessMode || state.accessMode, 'public');
  return {
    mode,
    inviteOnly: mode === 'invite_only',
    inviteCode: mode === 'invite_only'
      ? normalizePokerPlayInviteCode(rules.inviteCode || state.inviteCode)
      : '',
    creatorWalletSubject: normalizeTrimmedString(
      state.createdByWalletSubject,
      normalizeTrimmedString(rules.createdByWalletSubject)
    ),
    creatorHouseId: normalizeTrimmedString(
      state.createdByHouseId,
      normalizeTrimmedString(rules.createdByHouseId)
    ),
  };
}

function sanitizePokerPlayTableRecord(table) {
  const safe = cloneJson(table, {});
  if (!safe || typeof safe !== 'object') return {};
  if (safe.rules && typeof safe.rules === 'object') {
    delete safe.rules.inviteCode;
    delete safe.rules.createdByWalletSubject;
    delete safe.rules.createdByHouseId;
  }
  if (safe.state && typeof safe.state === 'object') {
    delete safe.state.inviteCode;
    delete safe.state.createdByWalletSubject;
    delete safe.state.createdByHouseId;
  }
  return safe;
}

function isInviteOnlyPokerPlayTable(table) {
  return getPokerPlayTableAccess(table).inviteOnly;
}

function parsePokerPlayInviteCode(req, body = null) {
  return normalizePokerPlayInviteCode(
    body?.inviteCode
      || req?.query?.inviteCode
      || req?.headers?.['x-poker-invite-code']
  );
}

function resolvePokerPlayInviteAuthorization(table, {
  walletSubject = '',
  houseId = '',
  viewerSeat = null,
  inviteCode = '',
} = {}) {
  const access = getPokerPlayTableAccess(table);
  if (!access.inviteOnly) {
    return {
      access,
      authorized: true,
      bySeat: !!viewerSeat,
      byCreator: false,
      byInvite: false,
    };
  }
  const normalizedWalletSubject = normalizeTrimmedString(walletSubject);
  const normalizedHouseId = normalizeTrimmedString(houseId);
  const normalizedInviteCode = normalizePokerPlayInviteCode(inviteCode);
  const bySeat = !!viewerSeat;
  const byCreator = !!(
    (normalizedWalletSubject && normalizedWalletSubject === access.creatorWalletSubject)
      || (normalizedHouseId && normalizedHouseId === access.creatorHouseId)
  );
  const byInvite = !!(
    normalizedInviteCode
      && access.inviteCode
      && normalizedInviteCode === access.inviteCode
  );
  return {
    access,
    authorized: bySeat || byCreator || byInvite,
    bySeat,
    byCreator,
    byInvite,
  };
}

function requirePokerPlayTableAccess(table, {
  walletSubject = '',
  houseId = '',
  viewerSeat = null,
  inviteCode = '',
  publicViewer = false,
} = {}) {
  const authorization = resolvePokerPlayInviteAuthorization(table, {
    walletSubject,
    houseId,
    viewerSeat,
    inviteCode,
  });
  if (!authorization.access.inviteOnly) {
    return authorization;
  }
  if (publicViewer) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  if (!authorization.authorized) {
    throw createRouteError(403, 'POKER_PLAY_INVITE_REQUIRED', 'This poker table requires a valid invite code.');
  }
  return authorization;
}

function requirePokerPlaySeriesAccess(entries, {
  walletSubject = '',
  houseId = '',
  inviteCode = '',
  publicViewer = false,
} = {}) {
  const items = Array.isArray(entries) ? entries : [];
  const inviteOnlyEntries = items.filter((entry) => isInviteOnlyPokerPlayTable(entry?.table));
  if (!inviteOnlyEntries.length) {
    return {
      inviteOnly: false,
      authorized: true,
    };
  }
  if (publicViewer) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker tournament series not found.');
  }
  const authorized = inviteOnlyEntries.some((entry) => resolvePokerPlayInviteAuthorization(entry?.table, {
    walletSubject,
    houseId,
    viewerSeat: entry?.viewerSeat || null,
    inviteCode,
  }).authorized);
  if (!authorized) {
    throw createRouteError(403, 'POKER_PLAY_INVITE_REQUIRED', 'This poker tournament requires a valid invite code.');
  }
  return {
    inviteOnly: true,
    authorized: true,
  };
}

function getTournamentEntryCountsByWallet(table) {
  const state = table?.state && typeof table.state === 'object' ? table.state : {};
  const raw = state.entryCountsByWallet && typeof state.entryCountsByWallet === 'object'
    ? state.entryCountsByWallet
    : {};
  const normalized = {};
  for (const [walletSubject, count] of Object.entries(raw)) {
    const key = normalizeTrimmedString(walletSubject);
    if (!key) continue;
    normalized[key] = Math.max(0, normalizeOilAmount(count, 0));
  }
  return normalized;
}

function sumTournamentEntryCounts(entryCountsByWallet = {}) {
  return Object.values(entryCountsByWallet).reduce((sum, count) => sum + Math.max(0, Number(count || 0)), 0);
}

function getTournamentTableEntryCount(table, seats) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    return 0;
  }
  const countedSeats = (Array.isArray(seats) ? seats : [])
    .filter((seat) => !isTournamentVoidedSeat(seat))
    .length;
  const stateCount = Math.max(
    0,
    normalizeOilAmount(
      table?.state?.entryCount,
      sumTournamentEntryCounts(getTournamentEntryCountsByWallet(table))
    )
  );
  return Math.max(countedSeats, stateCount);
}

function getTournamentTableWalletEntryCount(table, walletSubject, seats = []) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    return 0;
  }
  const normalizedWallet = normalizeTrimmedString(walletSubject);
  if (!normalizedWallet) return 0;
  const entryCountsByWallet = getTournamentEntryCountsByWallet(table);
  if (Object.prototype.hasOwnProperty.call(entryCountsByWallet, normalizedWallet)) {
    return Math.max(0, Number(entryCountsByWallet[normalizedWallet] || 0));
  }
  return (Array.isArray(seats) ? seats : [])
    .filter((seat) => normalizeTrimmedString(seat?.walletSubject) === normalizedWallet && !isTournamentVoidedSeat(seat))
    .length;
}

function incrementTournamentEntryState(table, walletSubject, {
  reentry = false,
  rebuy = false,
} = {}) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    return cloneJson(table?.state, {});
  }
  const normalizedWallet = normalizeTrimmedString(walletSubject);
  const entryCountsByWallet = getTournamentEntryCountsByWallet(table);
  const rebuyCountsByWallet = cloneJson(table?.state?.rebuyCountsByWallet, {});
  if (normalizedWallet) {
    entryCountsByWallet[normalizedWallet] = Math.max(0, Number(entryCountsByWallet[normalizedWallet] || 0)) + 1;
    if (rebuy) {
      rebuyCountsByWallet[normalizedWallet] = Math.max(0, Number(rebuyCountsByWallet[normalizedWallet] || 0)) + 1;
    }
  }
  return {
    ...(table?.state && typeof table.state === 'object' ? table.state : {}),
    entryCount: sumTournamentEntryCounts(entryCountsByWallet),
    reentryCount: Math.max(0, normalizeOilAmount(table?.state?.reentryCount, 0)) + (reentry ? 1 : 0),
    rebuyCount: Math.max(0, normalizeOilAmount(table?.state?.rebuyCount, 0)) + (rebuy ? 1 : 0),
    entryCountsByWallet,
    rebuyCountsByWallet,
  };
}

function getTournamentSeriesWalletEntryCount(entries, walletSubject) {
  const normalizedWallet = normalizeTrimmedString(walletSubject);
  if (!normalizedWallet) return 0;
  return (Array.isArray(entries) ? entries : []).reduce((sum, entry) => (
    sum + getTournamentTableWalletEntryCount(entry?.table, normalizedWallet, entry?.seats)
  ), 0);
}

function getTournamentSeriesWalletRebuyCount(entries, walletSubject) {
  const normalizedWallet = normalizeTrimmedString(walletSubject);
  if (!normalizedWallet) return 0;
  return (Array.isArray(entries) ? entries : []).reduce((sum, entry) => (
    sum + Math.max(0, Number(entry?.table?.state?.rebuyCountsByWallet?.[normalizedWallet] || 0))
  ), 0);
}

function getTournamentScheduledStartAt(table) {
  return normalizeIsoString(table?.rules?.scheduledStartAt || table?.state?.scheduledStartAt);
}

function getTournamentScheduleTemplate(table) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') return null;
  const templateId = normalizePokerPlayScheduleTemplateId(
    table?.rules?.scheduleTemplateId || table?.summary?.scheduleTemplateId || ''
  );
  if (!templateId) return null;
  return {
    templateId,
    title: normalizePokerPlayScheduleTemplateTitle(
      table?.rules?.scheduleTemplateTitle || table?.summary?.scheduleTemplateTitle || table?.title || 'Tournament Template',
      table?.title || 'Tournament Template'
    ),
    recurrenceLabel: normalizePokerPlayScheduleRecurrenceLabel(
      table?.rules?.scheduleRecurrenceLabel || table?.summary?.scheduleRecurrenceLabel || ''
    ),
  };
}

function getTournamentScheduledBreaks(table) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') return [];
  return normalizePokerPlayScheduledBreaks(table?.rules?.scheduledBreaks, {
    handsPerBlindLevel: table?.rules?.handsPerBlindLevel,
  });
}

function getCompletedScheduledBreakAfterHands(table) {
  return normalizePositiveNumberList(table?.state?.completedScheduledBreakAfterHands);
}

function getActiveScheduledBreakState(table) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') return null;
  const state = table?.state && typeof table.state === 'object' ? table.state : {};
  const afterHandNumber = Math.max(0, normalizeOilAmount(state?.scheduledBreakAfterHandNumber, 0));
  const untilAt = normalizeIsoString(state?.scheduledBreakUntilAt);
  if (!afterHandNumber || !untilAt) return null;
  return {
    breakId: normalizeTrimmedString(state?.scheduledBreakId, `break_after_${afterHandNumber}`),
    label: normalizePokerPlayScheduledBreakLabel(state?.scheduledBreakLabel, `Break after hand ${afterHandNumber}`),
    afterHandNumber,
    startedAt: normalizeIsoString(state?.scheduledBreakStartedAt) || null,
    untilAt,
    durationMinutes: Math.max(1, normalizeOilAmount(state?.scheduledBreakDurationMinutes, 5)),
  };
}

function isScheduledBreakActive(table, atIso) {
  const scheduledBreak = getActiveScheduledBreakState(table);
  if (!scheduledBreak) return false;
  const breakUntilMs = Date.parse(String(scheduledBreak.untilAt || ''));
  const atMs = Date.parse(String(atIso || ''));
  if (!Number.isFinite(breakUntilMs) || !Number.isFinite(atMs)) return true;
  return atMs < breakUntilMs;
}

function getNextScheduledBreak(table) {
  const completed = new Set(getCompletedScheduledBreakAfterHands(table));
  const activeBreak = getActiveScheduledBreakState(table);
  return getTournamentScheduledBreaks(table).find((item) => {
    if (completed.has(item.afterHandNumber)) return false;
    if (activeBreak && item.afterHandNumber === activeBreak.afterHandNumber) return false;
    return true;
  }) || null;
}

function activateTournamentScheduledBreak(deps, table, hand, scheduledBreak, atIso, {
  actorRole = 'system',
  eventKind = 'scheduled_break_started',
  auditPayload = {},
} = {}) {
  const state = table?.state && typeof table.state === 'object' ? table.state : {};
  const settledHandId = normalizeTrimmedString(state?.lastSettledHandId);
  const persistedSettledHandId = settledHandId && typeof deps.getPokerPlayHandById === 'function' && deps.getPokerPlayHandById(settledHandId)
    ? settledHandId
    : null;
  const breakStartHandId = normalizeTrimmedString(hand?.handId) || persistedSettledHandId || null;
  const untilAt = addMinutesToIso(atIso, scheduledBreak.durationMinutes);
  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
    state: {
      ...state,
      completedScheduledBreakAfterHands: normalizePositiveNumberList([
        ...getCompletedScheduledBreakAfterHands(table),
        scheduledBreak.afterHandNumber,
      ]),
      scheduledBreakId: scheduledBreak.breakId,
      scheduledBreakLabel: scheduledBreak.label,
      scheduledBreakAfterHandNumber: scheduledBreak.afterHandNumber,
      scheduledBreakStartedAt: atIso,
      scheduledBreakUntilAt: untilAt,
      scheduledBreakDurationMinutes: scheduledBreak.durationMinutes,
    },
    updatedAt: atIso,
  });
  if (breakStartHandId) {
    deps.createPokerPlayMessage({
      tableId: updatedTable.tableId,
      handId: breakStartHandId,
      seatNumber: null,
      authorRole: 'system',
      body: `Scheduled break started: ${scheduledBreak.label}.`,
      createdAt: atIso,
    });
  }
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: updatedTable.tableId,
      handId: breakStartHandId,
      seatNumber: null,
      actorRole: normalizePokerPlayAuditActorRole(actorRole, 'system'),
      eventKind,
      payload: {
        breakId: scheduledBreak.breakId,
        label: scheduledBreak.label,
        afterHandNumber: scheduledBreak.afterHandNumber,
        durationMinutes: scheduledBreak.durationMinutes,
        startedAt: atIso,
        untilAt,
        ...cloneJson(auditPayload, {}),
      },
      createdAt: atIso,
    });
  }
  return updatedTable;
}

function clearTournamentScheduledBreak(deps, table, hand, activeBreak, atIso, {
  actorRole = 'system',
  eventKind = 'scheduled_break_ended',
  auditPayload = {},
} = {}) {
  const state = table?.state && typeof table.state === 'object' ? table.state : {};
  const resumeHandId = normalizeTrimmedString(hand?.handId);
  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
    state: {
      ...state,
      scheduledBreakId: null,
      scheduledBreakLabel: null,
      scheduledBreakAfterHandNumber: 0,
      scheduledBreakStartedAt: null,
      scheduledBreakUntilAt: null,
      scheduledBreakDurationMinutes: 0,
      lastScheduledBreakResumedAt: atIso,
    },
    updatedAt: atIso,
  });
  if (resumeHandId) {
    deps.createPokerPlayMessage({
      tableId: updatedTable.tableId,
      handId: resumeHandId,
      seatNumber: null,
      authorRole: 'system',
      body: `Scheduled break ended: ${activeBreak.label}.`,
      createdAt: atIso,
    });
  }
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: updatedTable.tableId,
      handId: null,
      seatNumber: null,
      actorRole: normalizePokerPlayAuditActorRole(actorRole, 'system'),
      eventKind,
      payload: {
        breakId: activeBreak.breakId,
        label: activeBreak.label,
        afterHandNumber: activeBreak.afterHandNumber,
        durationMinutes: activeBreak.durationMinutes,
        resumedAt: atIso,
        ...cloneJson(auditPayload, {}),
      },
      createdAt: atIso,
    });
  }
  return updatedTable;
}

function isScheduledTournamentPending(table, atIso) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') return false;
  if (normalizeTrimmedString(table?.status, 'open') !== 'scheduled') return false;
  const scheduledStartAt = getTournamentScheduledStartAt(table);
  if (!scheduledStartAt) return false;
  const scheduledMs = Date.parse(scheduledStartAt);
  const atMs = Date.parse(String(atIso || ''));
  if (!Number.isFinite(scheduledMs) || !Number.isFinite(atMs)) return true;
  if (normalizeTrimmedString(table?.state?.startedByDirectorAt)) return false;
  return atMs < scheduledMs;
}

function getCashBlindReturnPolicy(table) {
  return normalizePokerPlayBlindReturnPolicy(table?.rules?.blindReturnPolicy, 'post_big_blind');
}

function getTournamentReentryLimit(table) {
  return Math.max(0, normalizeOilAmount(table?.rules?.reentryLimit, 0));
}

function getTournamentFormatVariant(table) {
  return normalizePokerPlayTournamentFormat(table?.rules?.formatVariant, 'standard');
}

function getTournamentSatelliteAwardKind(table) {
  return normalizePokerPlayTournamentSatelliteAwardKind(table?.rules?.satelliteAwardKind, 'ticket');
}

function getTournamentSatelliteAwardCount(table) {
  return Math.max(0, normalizeOilAmount(table?.rules?.satelliteAwardCount, 0));
}

function getTournamentSatelliteAwardValueOil(table) {
  return Math.max(0, normalizeOilAmount(table?.rules?.satelliteAwardValueOil, table?.buyInOil));
}

function getTournamentMultiFlightFestivalParentId(table) {
  return normalizePokerPlayMultiFlightFestivalId(
    table?.rules?.multiFlightFestivalParentId || table?.summary?.multiFlightFestivalParentId || ''
  );
}

function getTournamentMultiFlightFestivalTitle(table) {
  return normalizePokerPlayMultiFlightFestivalTitle(
    table?.rules?.multiFlightFestivalTitle || table?.summary?.multiFlightFestivalTitle || table?.title || '',
    table?.title || ''
  );
}

function getTournamentMultiFlightFlightCode(table) {
  return normalizePokerPlayMultiFlightFlightCode(
    table?.rules?.multiFlightFlightCode || table?.summary?.multiFlightFlightCode || ''
  );
}

function getTournamentMultiFlightFlightLabel(table) {
  return normalizePokerPlayMultiFlightFlightLabel(
    table?.rules?.multiFlightFlightLabel || table?.summary?.multiFlightFlightLabel || '',
    getTournamentMultiFlightFlightCode(table) ? `Flight ${getTournamentMultiFlightFlightCode(table)}` : ''
  );
}

function getTournamentMultiFlightMergeSeriesId(table) {
  return normalizeTrimmedString(table?.rules?.multiFlightMergeSeriesId || table?.summary?.multiFlightMergeSeriesId || '');
}

function getTournamentMultiFlightMergeSeriesTitle(table) {
  return normalizeTrimmedString(
    table?.rules?.multiFlightMergeSeriesTitle || table?.summary?.multiFlightMergeSeriesTitle || ''
  );
}

function getTournamentMultiFlightAdvanceSeatCount(table) {
  return Math.max(0, normalizeOilAmount(table?.rules?.multiFlightAdvanceSeatCount, 0));
}

function isMultiFlightTournament(table) {
  return getTournamentFormatVariant(table) === 'multi_flight';
}

function isMultiFlightFlightTable(table) {
  return isMultiFlightTournament(table) && !!getTournamentMultiFlightMergeSeriesId(table);
}

function getTournamentMultiFlightStage(table) {
  if (!isMultiFlightTournament(table)) return null;
  return isMultiFlightFlightTable(table) ? 'flight' : 'merge';
}

function getTournamentMultiFlightImportMap(table) {
  const raw = table?.state?.multiFlightImportsBySourceSeriesId;
  return raw && typeof raw === 'object' ? cloneJson(raw, {}) : {};
}

function normalizeTournamentMultiFlightImportRecord(record = {}) {
  const sourceSeriesId = normalizeTrimmedString(record?.sourceSeriesId);
  if (!sourceSeriesId) return null;
  return {
    sourceSeriesId,
    sourceSeriesTitle: normalizeTrimmedString(record?.sourceSeriesTitle) || null,
    festivalParentId: normalizePokerPlayMultiFlightFestivalId(record?.festivalParentId) || null,
    festivalTitle: normalizePokerPlayMultiFlightFestivalTitle(record?.festivalTitle) || null,
    flightCode: normalizePokerPlayMultiFlightFlightCode(record?.flightCode) || null,
    flightLabel: normalizePokerPlayMultiFlightFlightLabel(record?.flightLabel) || null,
    entryCount: Math.max(0, normalizeOilAmount(record?.entryCount, 0)),
    prizePoolOil: Math.max(0, normalizeOilAmount(record?.prizePoolOil, 0)),
    bountyPoolOil: Math.max(0, normalizeOilAmount(record?.bountyPoolOil, 0)),
    advancedSeatCount: Math.max(0, normalizeOilAmount(record?.advancedSeatCount, 0)),
    carriedStackTotalOil: Math.max(0, normalizeOilAmount(record?.carriedStackTotalOil, 0)),
    importedAt: normalizeIsoString(record?.importedAt) || null,
  };
}

function buildTournamentMultiFlightImportSummary(entries) {
  const bySourceSeriesId = new Map();
  for (const entry of Array.isArray(entries) ? entries : []) {
    const importMap = getTournamentMultiFlightImportMap(entry?.table);
    for (const value of Object.values(importMap)) {
      const normalized = normalizeTournamentMultiFlightImportRecord(value);
      if (!normalized?.sourceSeriesId) continue;
      const existing = bySourceSeriesId.get(normalized.sourceSeriesId);
      if (!existing || compareIsoAsc(existing.importedAt || '', normalized.importedAt || '') < 0) {
        bySourceSeriesId.set(normalized.sourceSeriesId, normalized);
      }
    }
  }
  const items = Array.from(bySourceSeriesId.values()).sort((left, right) => {
    const importedDelta = compareIsoAsc(left?.importedAt || '', right?.importedAt || '');
    if (importedDelta !== 0) return importedDelta;
    return String(left?.sourceSeriesId || '').localeCompare(String(right?.sourceSeriesId || ''));
  });
  return {
    items,
    flightCount: items.length,
    entryCount: items.reduce((sum, item) => sum + Math.max(0, Number(item?.entryCount || 0)), 0),
    prizePoolOil: items.reduce((sum, item) => sum + Math.max(0, Number(item?.prizePoolOil || 0)), 0),
    bountyPoolOil: items.reduce((sum, item) => sum + Math.max(0, Number(item?.bountyPoolOil || 0)), 0),
    advancedSeatCount: items.reduce((sum, item) => sum + Math.max(0, Number(item?.advancedSeatCount || 0)), 0),
    carriedStackTotalOil: items.reduce((sum, item) => sum + Math.max(0, Number(item?.carriedStackTotalOil || 0)), 0),
  };
}

function getTournamentRebuyLimit(table) {
  return Math.max(0, normalizeOilAmount(table?.rules?.rebuyLimit, 0));
}

function getTournamentRebuyWindowHands(table) {
  return Math.max(0, normalizeOilAmount(table?.rules?.rebuyWindowHands, 0));
}

function getTournamentAddonWindowAfterHandNumbers(table) {
  return normalizePokerPlayTournamentAddonWindowAfterHandNumbers(table?.rules?.addonWindowAfterHandNumbers);
}

function getTournamentAddonCostOil(table) {
  return normalizePokerPlayTournamentAddonCostOil(table?.rules?.addonCostOil, table?.buyInOil);
}

function getTournamentAddonChipsOil(table) {
  return normalizePokerPlayTournamentAddonChipsOil(table?.rules?.addonChipsOil, table?.buyInOil);
}

function getTournamentMaxAddonsPerSeat(table) {
  return Math.max(0, normalizeOilAmount(table?.rules?.maxAddonsPerSeat, 0));
}

function getTournamentFillPolicy(table) {
  return normalizePokerPlayTournamentFillPolicy(table?.rules?.fillPolicy, 'open_match');
}

function getTournamentStartTargetSeats(table) {
  const minPlayers = Math.max(2, normalizeOilAmount(table?.minPlayers, 2));
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') return minPlayers;
  return normalizeTournamentStartTargetSeats(table?.rules?.startTargetSeats, {
    minPlayers,
    maxSeats: table?.maxSeats,
    fillPolicy: getTournamentFillPolicy(table),
  });
}

function hasPokerPlayTableStarted(table, hand) {
  return !!(
    hand?.handId
      || normalizeTrimmedString(table?.state?.lastStartedAt)
      || normalizeTrimmedString(table?.state?.lastSettledHandId)
      || Number(table?.state?.activeHandNumber || 0) > 0
  );
}

function getPokerPlayAutoStartSeatTarget(table, hand) {
  const minPlayers = Math.max(2, normalizeOilAmount(table?.minPlayers, 2));
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') return minPlayers;
  if (!isSitAndGoFillPolicy(getTournamentFillPolicy(table))) return minPlayers;
  if (normalizeTrimmedString(table?.state?.startedByDirectorAt)) return minPlayers;
  if (hasPokerPlayTableStarted(table, hand)) return minPlayers;
  return getTournamentStartTargetSeats(table);
}

function getSessionHouseId(session) {
  return normalizeTrimmedString(session?.houseCeremony?.houseId);
}

function toProcessIso(deps, value) {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : deps.nowIso();
}

function addHoursToIso(iso, hours) {
  const baseMs = Date.parse(String(iso || ''));
  const safeHours = Math.max(0, Number(hours || 0));
  const nextMs = (Number.isFinite(baseMs) ? baseMs : Date.now()) + (safeHours * 60 * 60 * 1000);
  return new Date(nextMs).toISOString();
}

function getPokerPlayScheduleRecurrenceIntervalHours(kind) {
  return normalizePokerPlayScheduleRecurrenceKind(kind) === 'weekly' ? (7 * 24) : 24;
}

function buildPokerPlayScheduleRecurrenceLabel(kind, firstStartAt) {
  const normalizedKind = normalizePokerPlayScheduleRecurrenceKind(kind);
  const parsed = Date.parse(String(firstStartAt || ''));
  const date = Number.isFinite(parsed) ? new Date(parsed) : new Date();
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  if (normalizedKind === 'weekly') {
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()] || 'UTC';
    return `Weekly ${weekday} ${hh}:${mm} UTC`;
  }
  return `Daily ${hh}:${mm} UTC`;
}

function addMinutesToIso(iso, minutes) {
  const baseMs = Date.parse(String(iso || ''));
  const safeMinutes = Math.max(0, Number(minutes || 0));
  const nextMs = (Number.isFinite(baseMs) ? baseMs : Date.now()) + (safeMinutes * 60 * 1000);
  return new Date(nextMs).toISOString();
}

function buildUtcDayWindow(atIso) {
  const baseMs = Date.parse(String(atIso || ''));
  const base = Number.isFinite(baseMs) ? new Date(baseMs) : new Date();
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const end = new Date(start.getTime() + (24 * 60 * 60 * 1000));
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function isIsoInFuture(iso, refIso) {
  const targetMs = Date.parse(String(iso || ''));
  const refMs = Date.parse(String(refIso || ''));
  return Number.isFinite(targetMs) && Number.isFinite(refMs) && targetMs > refMs;
}

function buildPokerPlayWalletPolicySummary(deps, walletSubject, { processAt } = {}) {
  const normalizedWalletSubject = normalizeTrimmedString(walletSubject);
  if (!normalizedWalletSubject) return null;
  const requestAt = toProcessIso(deps, processAt);
  const policy = typeof deps.getPokerPlayWalletPolicy === 'function'
    ? deps.getPokerPlayWalletPolicy(normalizedWalletSubject)
    : null;
  const dailySpendCapOil = Math.max(0, Number(policy?.dailySpendCapOil || 0));
  const selfExcludedUntil = normalizeIsoString(policy?.selfExcludedUntil) || null;
  const selfExcluded = !!selfExcludedUntil && isIsoInFuture(selfExcludedUntil, requestAt);
  const window = buildUtcDayWindow(requestAt);
  const todaySpendOil = typeof deps.computeOilLedgerAmountByWalletSubject === 'function'
    ? deps.computeOilLedgerAmountByWalletSubject(normalizedWalletSubject, {
      entryKinds: POKER_PLAY_POLICY_SPEND_ENTRY_KINDS,
      direction: 'debit',
      since: window.startIso,
      until: window.endIso,
    })
    : 0;
  return {
    walletSubject: normalizedWalletSubject,
    dailySpendCapOil,
    todaySpendOil: Math.max(0, Number(todaySpendOil || 0)),
    remainingDailySpendOil: dailySpendCapOil > 0
      ? Math.max(0, dailySpendCapOil - Math.max(0, Number(todaySpendOil || 0)))
      : null,
    selfExcluded,
    selfExcludedUntil,
    windowStartAt: window.startIso,
    windowEndAt: window.endIso,
    updatedAt: policy?.updatedAt || null,
  };
}

function assertPokerPlayWalletPolicyAllowsSpend(deps, walletSubject, { amountOil = 0, processAt } = {}) {
  const policy = buildPokerPlayWalletPolicySummary(deps, walletSubject, { processAt });
  if (!policy) return null;
  if (policy.selfExcluded) {
    throw createRouteError(409, 'POKER_PLAY_SELF_EXCLUDED', 'This wallet is currently self-excluded from live poker spend.', {
      selfExcludedUntil: policy.selfExcludedUntil,
    });
  }
  const spendAmountOil = Math.max(0, normalizeOilAmount(amountOil, 0));
  if (policy.dailySpendCapOil > 0 && (policy.todaySpendOil + spendAmountOil) > policy.dailySpendCapOil) {
    throw createRouteError(409, 'POKER_PLAY_POLICY_LIMIT_EXCEEDED', 'This wallet reached the daily live-poker spend limit.', {
      dailySpendCapOil: policy.dailySpendCapOil,
      todaySpendOil: policy.todaySpendOil,
      projectedSpendOil: policy.todaySpendOil + spendAmountOil,
      remainingDailySpendOil: Math.max(0, Number(policy.remainingDailySpendOil || 0)),
      windowStartAt: policy.windowStartAt,
      windowEndAt: policy.windowEndAt,
    });
  }
  return policy;
}

function isSeatPendingCashout(seat) {
  return !!seat && seat.status === 'pending_cashout';
}

function isSeatSitOutPending(seat) {
  return normalizeTrimmedString(seat?.status).toLowerCase() === 'sitout_next_hand';
}

function isSeatAwayPending(seat) {
  return normalizeTrimmedString(seat?.status).toLowerCase() === 'away_next_hand';
}

function isSeatSittingOut(seat) {
  return normalizeTrimmedString(seat?.status).toLowerCase() === 'sitting_out';
}

function isSeatAway(seat) {
  return normalizeTrimmedString(seat?.status).toLowerCase() === 'away';
}

function isTablePaused(table) {
  return normalizeTrimmedString(table?.status, 'open').toLowerCase() === 'paused';
}

function isTableAdminClosed(table) {
  return normalizeTrimmedString(table?.status).toLowerCase() === 'admin_closed';
}

function isSeriesClosedTable(table) {
  const status = normalizeTrimmedString(table?.status).toLowerCase();
  return status === 'series_closed' || status === 'admin_closed';
}

function isSeatInPlay(seat) {
  const status = normalizeTrimmedString(seat?.status).toLowerCase();
  return !!seat
    && (
      status === 'active'
      || status === 'registered'
      || isSeatPendingCashout(seat)
      || isSeatSitOutPending(seat)
      || isSeatAwayPending(seat)
    )
    && Number(seat.stackOil || 0) > 0;
}

function isSeatOccupyingTable(seat) {
  const status = normalizeTrimmedString(seat?.status).toLowerCase();
  if (!seat) return false;
  return status !== 'busted' && status !== 'advanced' && status !== 'paid' && status !== 'void_refund';
}

function isTournamentVoidedSeat(seat) {
  return normalizeTrimmedString(seat?.status).toLowerCase() === 'void_refund';
}

function normalizeAdminCloseRefundMode(value, tableType) {
  const normalized = normalizeTrimmedString(value).toLowerCase();
  if (normalized === 'none') return 'none';
  if (normalized === 'cash_stack' || normalized === 'buy_in') return normalized;
  return normalizePokerPlayTableType(tableType) === 'cash' ? 'cash_stack' : 'buy_in';
}

function getPokerPlayPresenceTimeoutSeconds(table) {
  return Math.max(10, normalizeOilAmount(table?.rules?.presenceTimeoutSeconds, DEFAULT_PLAY_PRESENCE_TIMEOUT_SECONDS));
}

function getPokerPlayReconnectGraceSeconds(table) {
  return Math.max(10, normalizeOilAmount(table?.rules?.reconnectGraceSeconds, DEFAULT_PLAY_RECONNECT_GRACE_SECONDS));
}

function getPokerPlayTimeBankSeconds(table) {
  return Math.max(0, normalizeOilAmount(table?.rules?.timeBankSeconds, DEFAULT_PLAY_TIME_BANK_SECONDS));
}

function getPokerPlayTimeBankState(table) {
  const state = table?.state && typeof table.state === 'object' ? table.state : {};
  const bySeat = state.timeBankRemainingBySeat && typeof state.timeBankRemainingBySeat === 'object'
    ? state.timeBankRemainingBySeat
    : {};
  return {
    bySeat,
  };
}

function getSeatTimeBankRemainingSeconds(table, seatNumber) {
  const normalizedSeatNumber = normalizeSeatNumber(seatNumber);
  if (!normalizedSeatNumber) return 0;
  const defaults = getPokerPlayTimeBankSeconds(table);
  const timeBankState = getPokerPlayTimeBankState(table);
  if (Object.prototype.hasOwnProperty.call(timeBankState.bySeat, String(normalizedSeatNumber))) {
    return Math.max(0, normalizeOilAmount(timeBankState.bySeat[String(normalizedSeatNumber)], defaults));
  }
  return defaults;
}

function setSeatTimeBankRemainingSeconds(table, seatNumber, remainingSeconds) {
  const normalizedSeatNumber = normalizeSeatNumber(seatNumber);
  if (!normalizedSeatNumber) {
    return cloneJson(table?.state, {});
  }
  const nextState = {
    ...(table?.state && typeof table.state === 'object' ? table.state : {}),
    timeBankRemainingBySeat: {
      ...getPokerPlayTimeBankState(table).bySeat,
      [String(normalizedSeatNumber)]: Math.max(0, normalizeOilAmount(remainingSeconds, 0)),
    },
  };
  return nextState;
}

function removeSeatTimeBankState(table, seatNumber) {
  const normalizedSeatNumber = normalizeSeatNumber(seatNumber);
  const current = {
    ...(table?.state && typeof table.state === 'object' ? table.state : {}),
  };
  const nextBySeat = { ...getPokerPlayTimeBankState(table).bySeat };
  delete nextBySeat[String(normalizedSeatNumber)];
  current.timeBankRemainingBySeat = nextBySeat;
  return current;
}

function resolveTournamentLateRegistration(table, hand) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    return {
      open: false,
      lateRegistrationHands: 0,
      remainingHands: 0,
    };
  }
  if (normalizeTrimmedString(table?.state?.registrationClosedByDirectorAt)) {
    return {
      open: false,
      lateRegistrationHands: Math.max(0, normalizeOilAmount(table?.rules?.lateRegistrationHands, 0)),
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

function getTournamentProgressHandNumber(table, hand) {
  return Math.max(
    0,
    normalizeOilAmount(
      hand?.handNumber,
      normalizeOilAmount(
        table?.state?.lastSettledHandNumber,
        normalizeOilAmount(table?.state?.activeHandNumber, 0)
      )
    )
  );
}

function resolveTournamentRebuyWindow(table, hand) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    return {
      open: false,
      rebuyWindowHands: 0,
      remainingHands: 0,
    };
  }
  const rebuyWindowHands = getTournamentRebuyWindowHands(table);
  if (!rebuyWindowHands) {
    return {
      open: false,
      rebuyWindowHands,
      remainingHands: 0,
    };
  }
  const currentHandNumber = getTournamentProgressHandNumber(table, hand);
  if (!currentHandNumber) {
    return {
      open: true,
      rebuyWindowHands,
      remainingHands: rebuyWindowHands,
    };
  }
  const remainingHands = Math.max(0, (rebuyWindowHands - currentHandNumber) + 1);
  return {
    open: remainingHands > 0,
    rebuyWindowHands,
    remainingHands,
  };
}

function resolveTournamentAddonWindow(table, hand, processAt = '') {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    return {
      open: false,
      afterHandNumbers: [],
      activeAfterHandNumber: 0,
      nextAfterHandNumber: 0,
    };
  }
  const afterHandNumbers = getTournamentAddonWindowAfterHandNumbers(table);
  if (!afterHandNumbers.length) {
    return {
      open: false,
      afterHandNumbers,
      activeAfterHandNumber: 0,
      nextAfterHandNumber: 0,
    };
  }
  const progressHandNumber = getTournamentProgressHandNumber(table, hand);
  const referenceAt = normalizeIsoString(processAt) || hand?.updatedAt || table?.updatedAt || table?.createdAt || '';
  const breakActive = !!getActiveScheduledBreakState(table) && isScheduledBreakActive(table, referenceAt);
  const matchingScheduledBreak = getTournamentScheduledBreaks(table).find((item) => (
    Math.max(0, normalizeOilAmount(item?.afterHandNumber, 0)) === progressHandNumber
  )) || null;
  const betweenHands = !hand || hand.status !== 'live';
  const activeAfterHandNumber = afterHandNumbers.includes(progressHandNumber) && (
    matchingScheduledBreak ? breakActive : betweenHands
  )
    ? progressHandNumber
    : 0;
  const nextAfterHandNumber = afterHandNumbers.find((value) => value > progressHandNumber) || 0;
  return {
    open: activeAfterHandNumber > 0,
    afterHandNumbers,
    activeAfterHandNumber,
    nextAfterHandNumber,
  };
}

function getSeatPresenceStatus(seat) {
  if (isSeatAway(seat) || isSeatAwayPending(seat)) return 'away';
  if (isSeatWaitingBigBlind(seat)) return 'online';
  if (!isSeatInPlay(seat)) return 'inactive';
  return seat?.disconnectedAt ? 'disconnected' : 'online';
}

function isSeatWaitingBigBlind(seat) {
  return normalizeTrimmedString(seat?.status).toLowerCase() === 'waiting_big_blind';
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
  if (action === 'shove') return `shoves to ${Number(amountOil || 0)} OIL`;
  return action || 'acts';
}

function normalizePokerPlayAutoActMode(value, fallback = 'off') {
  const normalized = normalizeTrimmedString(value, fallback).toLowerCase();
  return ['off', 'propose_only', 'check_fold', 'seat_agent_auto'].includes(normalized)
    ? normalized
    : fallback;
}

function getPokerPlayAutoActPolicyMap(table) {
  const map = table?.state?.autoActByWallet;
  return map && typeof map === 'object' ? cloneJson(map, {}) : {};
}

function getPokerPlaySeatAutoActPolicy(table, walletSubject) {
  const normalizedWallet = normalizeTrimmedString(walletSubject);
  if (!normalizedWallet) return null;
  const map = getPokerPlayAutoActPolicyMap(table);
  const policy = map[normalizedWallet];
  if (!policy || typeof policy !== 'object') return null;
  return {
    mode: normalizePokerPlayAutoActMode(policy.mode, 'off'),
    allowWhileDisconnected: policy.allowWhileDisconnected === true,
    updatedAt: normalizeTrimmedString(policy.updatedAt) || null,
    lastExecutedAt: normalizeTrimmedString(policy.lastExecutedAt) || null,
    lastExecutedHandId: normalizeTrimmedString(policy.lastExecutedHandId) || null,
    lastExecutedActionKind: normalizeTrimmedString(policy.lastExecutedActionKind) || null,
    lastProposalId: normalizeTrimmedString(policy.lastProposalId) || null,
  };
}

function upsertPokerPlaySeatAutoActPolicy(deps, table, walletSubject, patch = {}, updatedAt) {
  const normalizedWallet = normalizeTrimmedString(walletSubject);
  if (!table?.tableId || !normalizedWallet) return table;
  const now = toProcessIso(deps, updatedAt);
  const current = getPokerPlaySeatAutoActPolicy(table, normalizedWallet) || {
    mode: 'off',
    allowWhileDisconnected: false,
    updatedAt: null,
    lastExecutedAt: null,
    lastExecutedHandId: null,
    lastExecutedActionKind: null,
    lastProposalId: null,
  };
  const mode = normalizePokerPlayAutoActMode(
    Object.prototype.hasOwnProperty.call(patch || {}, 'mode') ? patch.mode : current.mode,
    'off'
  );
  const nextPolicy = {
    ...current,
    ...cloneJson(patch, {}),
    mode,
    allowWhileDisconnected: Object.prototype.hasOwnProperty.call(patch || {}, 'allowWhileDisconnected')
      ? patch.allowWhileDisconnected === true
      : current.allowWhileDisconnected === true,
    updatedAt: now,
  };
  const nextMap = {
    ...getPokerPlayAutoActPolicyMap(table),
    [normalizedWallet]: nextPolicy,
  };
  const nextState = {
    ...(table.state && typeof table.state === 'object' ? table.state : {}),
    autoActByWallet: nextMap,
  };
  return deps.upsertPokerPlayTable({
    ...table,
    state: nextState,
    updatedAt: now,
  });
}

function buildPokerPlayAutoActSummary(table, walletSubject) {
  const policy = getPokerPlaySeatAutoActPolicy(table, walletSubject);
  const mode = normalizePokerPlayAutoActMode(policy?.mode, 'off');
  return {
    mode,
    enabled: mode !== 'off',
    allowWhileDisconnected: policy?.allowWhileDisconnected === true,
    updatedAt: policy?.updatedAt || null,
    lastExecutedAt: policy?.lastExecutedAt || null,
    lastExecutedHandId: policy?.lastExecutedHandId || null,
    lastExecutedActionKind: policy?.lastExecutedActionKind || null,
    lastProposalId: policy?.lastProposalId || null,
  };
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

function getOpenSeatCount(table, seats) {
  const occupiedSeatCount = (Array.isArray(seats) ? seats : []).filter(isSeatOccupyingTable).length;
  return Math.max(0, Number(table?.maxSeats || POKER_PLAY_MAX_SEATS) - occupiedSeatCount);
}

function getDeferredCashSeatStatus(seat) {
  if (isSeatAwayPending(seat)) return 'away';
  if (isSeatSitOutPending(seat)) return 'sitting_out';
  return '';
}

function applyDeferredCashLifecycleSeats(deps, table, seats, atIso) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'cash') {
    return Array.isArray(seats) ? seats : [];
  }
  let changed = false;
  for (const seat of Array.isArray(seats) ? seats : []) {
    const nextStatus = getDeferredCashSeatStatus(seat);
    if (!nextStatus) continue;
    deps.upsertPokerPlaySeat({
      ...seat,
      status: nextStatus,
      disconnectedAt: nextStatus === 'away' ? seat?.disconnectedAt || atIso : null,
      updatedAt: atIso,
    });
    changed = true;
  }
  return changed ? deps.listPokerPlaySeatsByTable(table.tableId) : (Array.isArray(seats) ? seats : []);
}

function buildWaitlistSummary(entries, viewerWalletSubject = '') {
  const waitingEntries = (Array.isArray(entries) ? entries : [])
    .filter((entry) => normalizeTrimmedString(entry?.status, 'waiting') === 'waiting')
    .sort((left, right) => {
      const createdDelta = compareIsoAsc(left?.createdAt || '', right?.createdAt || '');
      if (createdDelta !== 0) return createdDelta;
      return String(left?.waitlistEntryId || left?.tournamentWaitlistEntryId || '')
        .localeCompare(String(right?.waitlistEntryId || right?.tournamentWaitlistEntryId || ''));
    });
  const normalizedViewerWallet = normalizeTrimmedString(viewerWalletSubject);
  const viewerIndex = normalizedViewerWallet
    ? waitingEntries.findIndex((entry) => normalizeTrimmedString(entry?.walletSubject) === normalizedViewerWallet)
    : -1;
  return {
    count: waitingEntries.length,
    viewerQueued: viewerIndex >= 0,
    viewerPosition: viewerIndex >= 0 ? viewerIndex + 1 : null,
  };
}

function listTableWaitlistEntries(deps, table, { status = 'waiting' } = {}) {
  if (normalizePokerPlayTableType(table?.tableType) === 'tournament') {
    return typeof deps.listPokerTournamentWaitlistEntriesByTable === 'function'
      ? deps.listPokerTournamentWaitlistEntriesByTable(table.tableId, { status })
      : [];
  }
  return typeof deps.listPokerPlayWaitlistEntriesByTable === 'function'
    ? deps.listPokerPlayWaitlistEntriesByTable(table.tableId, { status })
    : [];
}

function getTableWaitlistEntryByWalletSubject(deps, table, walletSubject) {
  const normalizedWalletSubject = normalizeTrimmedString(walletSubject);
  if (!normalizedWalletSubject) return null;
  if (normalizePokerPlayTableType(table?.tableType) === 'tournament') {
    return typeof deps.getPokerTournamentWaitlistEntryByTableAndWalletSubject === 'function'
      ? deps.getPokerTournamentWaitlistEntryByTableAndWalletSubject(table.tableId, normalizedWalletSubject)
      : null;
  }
  return typeof deps.getPokerPlayWaitlistEntryByTableAndWalletSubject === 'function'
    ? deps.getPokerPlayWaitlistEntryByTableAndWalletSubject(table.tableId, normalizedWalletSubject)
    : null;
}

function upsertTableWaitlistEntry(deps, table, entry) {
  if (normalizePokerPlayTableType(table?.tableType) === 'tournament') {
    return typeof deps.upsertPokerTournamentWaitlistEntry === 'function'
      ? deps.upsertPokerTournamentWaitlistEntry(entry)
      : null;
  }
  return typeof deps.upsertPokerPlayWaitlistEntry === 'function'
    ? deps.upsertPokerPlayWaitlistEntry(entry)
    : null;
}

function buildBlindObligationSummary(obligation) {
  if (!obligation) return null;
  return {
    blindObligationId: obligation.blindObligationId || null,
    seatNumber: normalizeSeatNumber(obligation?.seatNumber),
    policy: normalizePokerPlayBlindReturnPolicy(obligation?.policy, 'post_big_blind'),
    status: normalizeTrimmedString(obligation?.status, 'pending'),
    blindAmountOil: Number(obligation?.blindAmountOil || 0),
    postedAt: obligation?.postedAt || null,
    clearedAt: obligation?.clearedAt || null,
    updatedAt: obligation?.updatedAt || null,
  };
}

function getSeatBlindObligation(deps, table, seat) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'cash' || !seat?.walletSubject) return null;
  return typeof deps.getPokerBlindObligationByTableAndWalletSubject === 'function'
    ? buildBlindObligationSummary(deps.getPokerBlindObligationByTableAndWalletSubject(table.tableId, seat.walletSubject))
    : null;
}

function getSeatWaitlistPromotion(deps, table, seat) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament' || !seat?.walletSubject) return null;
  const entry = getTableWaitlistEntryByWalletSubject(deps, table, seat.walletSubject);
  if (!entry || normalizeTrimmedString(entry?.status, 'waiting') !== 'promoted') return null;
  return {
    source: 'tournament_waitlist',
    promotedAt: entry?.promotedAt || null,
    promotedSeatNumber: Number(entry?.promotedSeatNumber || 0) || null,
  };
}

function isCashSeatMovementAllowed(table, seat, hand) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'cash') return false;
  if (!seat || !isSeatOccupyingTable(seat)) return false;
  if (isTableAdminClosed(table)) return false;
  if (hand && hand.status === 'live') return false;
  if (isSeatPendingCashout(seat)) return false;
  return Number(seat?.stackOil || 0) > 0;
}

function listCashSeatChangeOpenSeatNumbers(table, seats, currentSeatNumber) {
  const occupied = new Set(
    (Array.isArray(seats) ? seats : [])
      .filter(isSeatOccupyingTable)
      .map((seat) => normalizeSeatNumber(seat?.seatNumber))
      .filter(Boolean)
  );
  return Array.from({ length: Number(table?.maxSeats || POKER_PLAY_MAX_SEATS) }, (_value, index) => index + 1)
    .filter((seatNumber) => !occupied.has(seatNumber));
}

function listCompatibleCashTransferOptions(deps, sourceTable, sourceSeat, {
  walletSubject,
  houseId,
  processAt,
} = {}) {
  const normalizedWalletSubject = normalizeTrimmedString(walletSubject);
  if (!sourceTable?.tableId || !sourceSeat || !normalizedWalletSubject) return [];
  const sourceAccess = getPokerPlayTableAccess(sourceTable);
  const sourceMatchKey = normalizeTrimmedString(
    sourceTable?.rules?.matchKey || sourceTable?.summary?.matchKey || buildMatchKeyFromTable(sourceTable)
  );
  return deps.listPokerPlayTables()
    .filter((candidate) => String(candidate?.tableId || '') !== String(sourceTable.tableId || ''))
    .map((candidate) => ({
      table: candidate,
      seats: deps.listPokerPlaySeatsByTable(candidate.tableId),
      hand: deps.getCurrentPokerPlayHandForTable(candidate.tableId),
    }))
    .filter((entry) => normalizePokerPlayTableType(entry?.table?.tableType) === 'cash')
    .filter((entry) => !isTableAdminClosed(entry?.table))
    .filter((entry) => !isTablePaused(entry?.table))
    .filter((entry) => normalizeTrimmedString(entry?.table?.status, 'open') === 'open')
    .filter((entry) => !entry?.hand || entry.hand.status !== 'live')
    .filter((entry) => getOpenSeatCount(entry.table, entry.seats) > 0)
    .filter((entry) => normalizeTrimmedString(entry?.table?.rules?.matchKey || entry?.table?.summary?.matchKey || buildMatchKeyFromTable(entry.table)) === sourceMatchKey)
    .filter((entry) => normalizePokerPlayAccessMode(getPokerPlayTableAccess(entry.table).mode) === normalizePokerPlayAccessMode(sourceAccess.mode))
    .filter((entry) => {
      const targetViewerSeat = deps.getPokerPlaySeatByWalletSubject(entry.table.tableId, normalizedWalletSubject);
      if (targetViewerSeat && isSeatOccupyingTable(targetViewerSeat)) {
        return false;
      }
      const inviteAuthorization = resolvePokerPlayInviteAuthorization(entry.table, {
        walletSubject: normalizedWalletSubject,
        houseId: normalizeTrimmedString(houseId),
        viewerSeat: targetViewerSeat,
      });
      return !!inviteAuthorization?.authorized;
    })
    .map((entry) => {
      const openSeatNumbers = listCashSeatChangeOpenSeatNumbers(entry.table, entry.seats, 0);
      return {
        tableId: entry.table.tableId,
        title: normalizeTrimmedString(entry.table.title, 'Cash Table'),
        openSeatNumbers,
        occupancy: Number(entry?.seats?.filter(isSeatOccupyingTable).length || 0),
        maxSeats: Number(entry?.table?.maxSeats || POKER_PLAY_MAX_SEATS),
        smallBlindOil: Number(entry?.table?.smallBlindOil || 0),
        bigBlindOil: Number(entry?.table?.bigBlindOil || 0),
        buyInOil: Number(entry?.table?.buyInOil || 0),
        accessMode: normalizePokerPlayAccessMode(getPokerPlayTableAccess(entry.table).mode),
      };
    })
    .filter((entry) => entry.openSeatNumbers.length > 0)
    .sort((left, right) => {
      const occupancyDelta = Number(right?.occupancy || 0) - Number(left?.occupancy || 0);
      if (occupancyDelta !== 0) return occupancyDelta;
      return String(left?.tableId || '').localeCompare(String(right?.tableId || ''));
    });
}

function buildCashMovementSummary(deps, table, seats, hand, viewerSeat, {
  walletSubject,
  houseId,
  processAt,
  publicViewer = false,
} = {}) {
  if (publicViewer || normalizePokerPlayTableType(table?.tableType) !== 'cash' || !viewerSeat) {
    return null;
  }
  const seatChangeOpenSeatNumbers = listCashSeatChangeOpenSeatNumbers(table, seats, viewerSeat.seatNumber);
  const seatChangeAllowed = isCashSeatMovementAllowed(table, viewerSeat, hand) && seatChangeOpenSeatNumbers.length > 0;
  const transferOptions = isCashSeatMovementAllowed(table, viewerSeat, hand)
    ? listCompatibleCashTransferOptions(deps, table, viewerSeat, {
      walletSubject,
      houseId,
      processAt,
    })
    : [];
  return {
    seatChangeAllowed,
    seatChangeOpenSeatNumbers,
    transferAllowed: transferOptions.length > 0,
    transferOptions,
  };
}

function promoteCashWaitlistEntriesIntoOpenSeats(deps, table, seats, hand, atIso) {
  let nextSeats = Array.isArray(seats) ? seats.slice() : [];
  const waitingEntries = listTableWaitlistEntries(deps, table, { status: 'waiting' });
  if (!waitingEntries.length || getOpenSeatCount(table, nextSeats) <= 0) {
    return {
      table,
      seats: nextSeats,
      promoted: [],
      changed: false,
    };
  }
  const promoted = [];
  for (const entry of waitingEntries) {
    if (getOpenSeatCount(table, nextSeats) <= 0) break;
    const walletSubject = normalizeTrimmedString(entry?.walletSubject);
    if (!walletSubject) continue;
    const existingSeat = deps.getPokerPlaySeatByWalletSubject(table.tableId, walletSubject);
    if (existingSeat && isSeatOccupyingTable(existingSeat)) {
      upsertTableWaitlistEntry(deps, table, {
        ...entry,
        status: 'promoted',
        promotedSeatNumber: normalizeSeatNumber(existingSeat.seatNumber),
        promotedAt: atIso,
        updatedAt: atIso,
      });
      continue;
    }
    const activeElsewhere = deps.getActivePokerPlaySeatByWalletSubject(walletSubject);
    if (activeElsewhere && String(activeElsewhere.tableId || '') !== String(table.tableId || '') && isSeatInPlay(activeElsewhere)) {
      continue;
    }
    const buyInOil = computeBuyInOil(table, entry?.buyInOil);
    try {
      assertPokerPlayWalletPolicyAllowsSpend(deps, walletSubject, {
        amountOil: buyInOil,
        processAt: atIso,
      });
    } catch {
      continue;
    }
    const oilBalance = deps.computeOilBalance(walletSubject);
    if (Number(oilBalance?.balance || 0) < buyInOil) continue;
    const openSeatNumber = findNextOpenSeatNumber(table, nextSeats);
    if (!openSeatNumber) break;
    deps.createOilLedgerEntry({
      walletSubject,
      houseId: entry?.houseId || null,
      verificationId: deps.getStreamflowVerificationByWalletSubject(walletSubject)?.verificationId || null,
      tableId: table.tableId,
      seriesId: getTournamentSeriesRef(table).seriesId || null,
      entryKind: 'poker_play_waitlist_buy_in',
      direction: 'debit',
      amount: buyInOil,
      memo: `${table.title} waitlist buy-in`,
    });
    const seat = deps.upsertPokerPlaySeat({
      tableId: table.tableId,
      seatNumber: openSeatNumber,
      portalSessionId: entry?.portalSessionId || null,
      houseId: entry?.houseId || null,
      walletSubject,
      displayName: normalizePokerPlayDisplayName(entry?.displayName, entry?.houseId || walletSubject.slice(0, 8)),
      status: 'active',
      buyInOil,
      stackOil: buyInOil,
      streamflowVerificationId: deps.getStreamflowVerificationByWalletSubject(walletSubject)?.verificationId || null,
      lastSeenAt: atIso,
      disconnectedAt: null,
      updatedAt: atIso,
    });
    table = deps.upsertPokerPlayTable({
      ...table,
      state: setSeatTimeBankRemainingSeconds(table, openSeatNumber, getSeatTimeBankRemainingSeconds(table, openSeatNumber)),
      updatedAt: atIso,
    });
    upsertTableWaitlistEntry(deps, table, {
      ...entry,
      status: 'promoted',
      promotedSeatNumber: openSeatNumber,
      promotedAt: atIso,
      updatedAt: atIso,
    });
    if (typeof deps.createPokerPlayAuditEvent === 'function') {
      deps.createPokerPlayAuditEvent({
        tableId: table.tableId,
        handId: hand?.handId || null,
        seatNumber: openSeatNumber,
        actorRole: 'system',
        eventKind: 'waitlist_promoted',
        payload: {
          walletSubject,
          waitlistEntryId: entry?.waitlistEntryId || null,
          buyInOil,
          seatNumber: openSeatNumber,
        },
        createdAt: atIso,
      });
    }
    if (hand?.handId) {
      deps.createPokerPlayMessage({
        tableId: table.tableId,
        handId: hand.handId,
        seatNumber: null,
        authorRole: 'system',
        body: `${formatSeatLabel(openSeatNumber, seat.displayName)} is promoted from the waitlist for the next hand.`,
        createdAt: atIso,
      });
    }
    nextSeats = deps.listPokerPlaySeatsByTable(table.tableId);
    promoted.push({
      waitlistEntryId: entry?.waitlistEntryId || null,
      walletSubject,
      seatNumber: openSeatNumber,
    });
  }
  return {
    table,
    seats: nextSeats,
    promoted,
    changed: promoted.length > 0,
  };
}

function promoteTournamentWaitlistEntriesIntoOpenSeats(deps, table, seats, hand, atIso) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    return {
      table,
      seats: Array.isArray(seats) ? seats : [],
      promoted: [],
      changed: false,
    };
  }
  const lateRegistration = resolveTournamentLateRegistration(table, hand);
  const scheduledPending = isScheduledTournamentPending(table, atIso);
  if (!scheduledPending && hand && hand.status === 'live' && !lateRegistration.open) {
    return {
      table,
      seats: Array.isArray(seats) ? seats : [],
      promoted: [],
      changed: false,
    };
  }
  let nextSeats = Array.isArray(seats) ? seats.slice() : [];
  const waitingEntries = listTableWaitlistEntries(deps, table, { status: 'waiting' });
  if (!waitingEntries.length || getOpenSeatCount(table, nextSeats) <= 0) {
    return {
      table,
      seats: nextSeats,
      promoted: [],
      changed: false,
    };
  }
  const promoted = [];
  for (const entry of waitingEntries) {
    if (getOpenSeatCount(table, nextSeats) <= 0) break;
    const walletSubject = normalizeTrimmedString(entry?.walletSubject);
    if (!walletSubject) continue;
    const existingSeat = deps.getPokerPlaySeatByWalletSubject(table.tableId, walletSubject);
    if (existingSeat && isSeatOccupyingTable(existingSeat)) {
      upsertTableWaitlistEntry(deps, table, {
        ...entry,
        status: 'promoted',
        promotedSeatNumber: normalizeSeatNumber(existingSeat.seatNumber),
        promotedAt: atIso,
        updatedAt: atIso,
      });
      continue;
    }
    const activeElsewhere = deps.getActivePokerPlaySeatByWalletSubject(walletSubject);
    if (activeElsewhere && String(activeElsewhere.tableId || '') !== String(table.tableId || '') && isSeatInPlay(activeElsewhere)) {
      continue;
    }
    const buyInOil = computeBuyInOil(table, entry?.buyInOil);
    try {
      assertPokerPlayWalletPolicyAllowsSpend(deps, walletSubject, {
        amountOil: buyInOil,
        processAt: atIso,
      });
    } catch {
      continue;
    }
    const oilBalance = deps.computeOilBalance(walletSubject);
    if (Number(oilBalance?.balance || 0) < buyInOil) continue;
    const openSeatNumber = findNextOpenSeatNumber(table, nextSeats);
    if (!openSeatNumber) break;
    deps.createOilLedgerEntry({
      walletSubject,
      houseId: entry?.houseId || null,
      verificationId: deps.getStreamflowVerificationByWalletSubject(walletSubject)?.verificationId || null,
      tableId: table.tableId,
      seriesId: getTournamentSeriesRef(table).seriesId || null,
      entryKind: 'poker_play_waitlist_buy_in',
      direction: 'debit',
      amount: buyInOil,
      memo: `${table.title} tournament waitlist buy-in`,
    });
    const nextTableState = incrementTournamentEntryState(table, walletSubject, { reentry: false });
    const seatStatus = hand && hand.status === 'live' ? 'registered' : 'active';
    const seat = deps.upsertPokerPlaySeat({
      tableId: table.tableId,
      seatNumber: openSeatNumber,
      portalSessionId: entry?.portalSessionId || null,
      houseId: entry?.houseId || null,
      walletSubject,
      displayName: normalizePokerPlayDisplayName(entry?.displayName, entry?.houseId || walletSubject.slice(0, 8)),
      status: seatStatus,
      buyInOil,
      stackOil: buyInOil,
      currentBountyOil: computeTournamentInitialBountyOil(buyInOil, getTournamentBountyModel(table), getTournamentEntryFeeOil(table)),
      bountyWonOil: 0,
      bountySettledAt: null,
      payoutSettledAt: null,
      streamflowVerificationId: deps.getStreamflowVerificationByWalletSubject(walletSubject)?.verificationId || null,
      lastSeenAt: atIso,
      disconnectedAt: null,
      updatedAt: atIso,
    });
    upsertPokerPlayPlayerStatForSeat(deps, table, seat, {
      processAt: atIso,
      status: seatStatus === 'registered' ? 'registered' : 'open',
    });
    table = deps.upsertPokerPlayTable({
      ...table,
      state: setSeatTimeBankRemainingSeconds(
        {
          ...table,
          state: nextTableState,
        },
        openSeatNumber,
        getSeatTimeBankRemainingSeconds(table, openSeatNumber)
      ),
      updatedAt: atIso,
    });
    upsertTableWaitlistEntry(deps, table, {
      ...entry,
      seriesId: getTournamentSeriesRef(table).seriesId || entry?.seriesId || null,
      status: 'promoted',
      promotedSeatNumber: openSeatNumber,
      promotedAt: atIso,
      updatedAt: atIso,
    });
    if (typeof deps.createPokerPlayAuditEvent === 'function') {
      deps.createPokerPlayAuditEvent({
        tableId: table.tableId,
        handId: hand?.handId || null,
        seatNumber: openSeatNumber,
        actorRole: 'system',
        eventKind: 'tournament_waitlist_promoted',
        payload: {
          walletSubject,
          tournamentWaitlistEntryId: entry?.tournamentWaitlistEntryId || null,
          buyInOil,
          seatNumber: openSeatNumber,
          seatStatus,
        },
        createdAt: atIso,
      });
    }
    nextSeats = deps.listPokerPlaySeatsByTable(table.tableId);
    promoted.push({
      tournamentWaitlistEntryId: entry?.tournamentWaitlistEntryId || null,
      walletSubject,
      seatNumber: openSeatNumber,
    });
  }
  return {
    table,
    seats: nextSeats,
    promoted,
    changed: promoted.length > 0,
  };
}

function promoteWaitlistEntriesIntoOpenSeats(deps, table, seats, hand, atIso) {
  if (normalizePokerPlayTableType(table?.tableType) === 'tournament') {
    return promoteTournamentWaitlistEntriesIntoOpenSeats(deps, table, seats, hand, atIso);
  }
  if (normalizePokerPlayTableType(table?.tableType) === 'cash') {
    return promoteCashWaitlistEntriesIntoOpenSeats(deps, table, seats, hand, atIso);
  }
  return {
    table,
    seats: Array.isArray(seats) ? seats : [],
    promoted: [],
    changed: false,
  };
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

function normalizeSeatNumberList(values) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((seatNumber) => normalizeSeatNumber(seatNumber))
    .filter(Boolean)))
    .sort((left, right) => left - right);
}

function normalizePositiveNumberList(values) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((value) => Math.max(0, normalizeOilAmount(value, 0)))
    .filter((value) => value > 0)))
    .sort((left, right) => left - right);
}

function normalizePokerPlayTournamentAddonWindowAfterHandNumbers(values) {
  return normalizePositiveNumberList(values).slice(0, 8);
}

function normalizePokerPlayTournamentAddonCostOil(value, fallback = 0) {
  return Math.max(0, normalizeOilAmount(value, fallback));
}

function normalizePokerPlayTournamentAddonChipsOil(value, fallback = 0) {
  return Math.max(0, normalizeOilAmount(value, fallback));
}

function clockwiseSeatOrderFromButton(seatNumbers, buttonSeat) {
  const normalized = normalizeSeatNumberList(seatNumbers);
  const button = normalizeSeatNumber(buttonSeat);
  if (!button) return normalized;
  return normalized
    .map((seatNumber) => ({
      seatNumber,
      distance: seatNumber > button
        ? seatNumber - button
        : (1000 - button) + seatNumber,
    }))
    .sort((left, right) => {
      if (left.distance !== right.distance) return left.distance - right.distance;
      return left.seatNumber - right.seatNumber;
    })
    .map((item) => item.seatNumber);
}

function distributeTournamentBountyOil(totalOil, winners, buttonSeat) {
  const winningSeatNumbers = normalizeSeatNumberList(winners);
  if (!winningSeatNumbers.length) {
    return {
      payoutBySeat: {},
      oddChipSeatNumbers: [],
    };
  }
  const normalizedTotal = Math.max(0, normalizeOilAmount(totalOil, 0));
  const baseAmount = Math.floor(normalizedTotal / winningSeatNumbers.length);
  let remainder = normalizedTotal - (baseAmount * winningSeatNumbers.length);
  const payoutBySeat = {};
  for (const seatNumber of winningSeatNumbers) {
    payoutBySeat[String(seatNumber)] = baseAmount;
  }
  const oddChipSeatNumbers = [];
  for (const seatNumber of clockwiseSeatOrderFromButton(winningSeatNumbers, buttonSeat)) {
    if (remainder <= 0) break;
    payoutBySeat[String(seatNumber)] += 1;
    oddChipSeatNumbers.push(seatNumber);
    remainder -= 1;
  }
  return {
    payoutBySeat,
    oddChipSeatNumbers,
  };
}

function getTournamentBountyModel(table) {
  return normalizePokerPlayTournamentBountyModel(table?.rules?.bountyModel);
}

function getCashRakeBps(table) {
  return normalizePokerPlayCashRakeBps(table?.rules?.cashRakeBps, 0);
}

function getCashRakeCapOil(table) {
  return normalizePokerPlayCashRakeCapOil(table?.rules?.cashRakeCapOil, 0);
}

function getTournamentEntryFeeOil(table) {
  return normalizePokerPlayTournamentEntryFeeOil(
    table?.rules?.tournamentEntryFeeOil,
    table?.buyInOil,
    0
  );
}

function computeTournamentNetBuyInOil(buyInOil, entryFeeOil = 0) {
  const normalizedBuyInOil = Math.max(0, normalizeOilAmount(buyInOil, 0));
  const normalizedEntryFeeOil = normalizePokerPlayTournamentEntryFeeOil(entryFeeOil, normalizedBuyInOil, 0);
  return Math.max(0, normalizedBuyInOil - normalizedEntryFeeOil);
}

function computeTournamentInitialBountyOil(buyInOil, bountyModel = 'none', entryFeeOil = 0) {
  const normalizedBuyInOil = computeTournamentNetBuyInOil(buyInOil, entryFeeOil);
  const model = normalizePokerPlayTournamentBountyModel(bountyModel);
  if (model === 'pko_50') {
    return Math.floor(normalizedBuyInOil / 2);
  }
  if (model === 'pko_75') {
    return Math.floor((normalizedBuyInOil * 75) / 100);
  }
  if (model === 'full_bounty') {
    return normalizedBuyInOil;
  }
  return 0;
}

function computeTournamentPrizeContributionOil(buyInOil, bountyModel = 'none', entryFeeOil = 0) {
  const normalizedBuyInOil = computeTournamentNetBuyInOil(buyInOil, entryFeeOil);
  const startingBountyOil = computeTournamentInitialBountyOil(normalizedBuyInOil, bountyModel, 0);
  return Math.max(0, normalizedBuyInOil - startingBountyOil);
}

function resolveTournamentBountySplit(bountyModel, totalBountyOil) {
  const model = normalizePokerPlayTournamentBountyModel(bountyModel);
  const amount = Math.max(0, normalizeOilAmount(totalBountyOil, 0));
  let cashPercent = 0;
  if (model === 'pko_50') cashPercent = 50;
  if (model === 'pko_75') cashPercent = 75;
  if (model === 'full_bounty') cashPercent = 100;
  const cashPoolOil = Math.floor((amount * cashPercent) / 100);
  return {
    cashPoolOil,
    carryPoolOil: Math.max(0, amount - cashPoolOil),
  };
}

function buildTournamentPayoutPlan({
  entrantCount,
  prizePoolOil,
  formatVariant = 'standard',
  satelliteAwardCount = 0,
  satelliteAwardKind = 'ticket',
}) {
  const entrants = Math.max(0, normalizeOilAmount(entrantCount, 0));
  const prizePool = Math.max(0, normalizeOilAmount(prizePoolOil, 0));
  const tournamentFormat = normalizePokerPlayTournamentFormat(formatVariant, 'standard');
  if (tournamentFormat === 'satellite') {
    const paidPlaces = Math.min(
      entrants,
      Math.max(1, normalizeOilAmount(satelliteAwardCount, 1))
    );
    return {
      entrantCount: entrants,
      prizePoolOil: prizePool,
      payoutModel: `satellite_${normalizePokerPlayTournamentSatelliteAwardKind(satelliteAwardKind, 'ticket')}`,
      paidPlaces,
      payouts: Array.from({ length: paidPlaces }, (_value, index) => ({
        place: index + 1,
        percent: 0,
        amountOil: 0,
      })),
    };
  }
  let payoutModel = 'winner_take_all';
  let percents = [100];
  if (entrants >= 18) {
    payoutModel = 'top5_35_25_18_12_10';
    percents = [35, 25, 18, 12, 10];
  } else if (entrants >= 12) {
    payoutModel = 'top4_40_27_18_15';
    percents = [40, 27, 18, 15];
  } else if (entrants >= 6) {
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

function getTournamentSeatTotalWonOil(seat) {
  return Number(seat?.prizeOil || 0) + Number(seat?.bountyWonOil || 0);
}

function buildCompletedTournamentPlacements(entries) {
  const seats = getTournamentAllSeats(entries).filter((seat) => !isTournamentVoidedSeat(seat));
  if (!seats.length) return [];
  const activeSeats = getActiveSeatRows(seats);
  let winnerSeat = activeSeats
    .slice()
    .sort((left, right) => {
      const stackDelta = Number(right?.stackOil || 0) - Number(left?.stackOil || 0);
      if (stackDelta !== 0) return stackDelta;
      const wonDelta = getTournamentSeatTotalWonOil(right) - getTournamentSeatTotalWonOil(left);
      if (wonDelta !== 0) return wonDelta;
      return normalizeSeatNumber(left?.seatNumber) - normalizeSeatNumber(right?.seatNumber);
    })[0] || null;
  if (!winnerSeat) {
    winnerSeat = seats
      .filter((seat) => Number(seat?.stackOil || 0) > 0)
      .slice()
      .sort((left, right) => {
        const stackDelta = Number(right?.stackOil || 0) - Number(left?.stackOil || 0);
        if (stackDelta !== 0) return stackDelta;
        const wonDelta = getTournamentSeatTotalWonOil(right) - getTournamentSeatTotalWonOil(left);
        if (wonDelta !== 0) return wonDelta;
        return compareIsoAsc(left?.updatedAt || '', right?.updatedAt || '');
      })[0] || null;
  }
  if (!winnerSeat) {
    winnerSeat = seats
      .filter((seat) => getTournamentSeatTotalWonOil(seat) > 0)
      .slice()
      .sort((left, right) => {
        const wonDelta = getTournamentSeatTotalWonOil(right) - getTournamentSeatTotalWonOil(left);
        if (wonDelta !== 0) return wonDelta;
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
    .filter((seat) => getTournamentSeatTotalWonOil(seat) > 0 && !seen.has(getTournamentSeatIdentity(seat)))
    .slice()
    .sort((left, right) => {
      const wonDelta = getTournamentSeatTotalWonOil(right) - getTournamentSeatTotalWonOil(left);
      if (wonDelta !== 0) return wonDelta;
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
    bountyWonOil: Number(seat?.bountyWonOil || 0),
    totalWonOil: Number(seat?.prizeOil || 0) + Number(seat?.bountyWonOil || 0),
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

function computeCashRakeOil(table, {
  investedOil = 0,
  returnedOil = 0,
} = {}) {
  const rakeBps = getCashRakeBps(table);
  const rakeCapOil = getCashRakeCapOil(table);
  if (rakeBps <= 0) return 0;
  const profitOil = Math.max(0, Number(returnedOil || 0) - Number(investedOil || 0));
  if (profitOil <= 0) return 0;
  const rawRakeOil = Math.floor((profitOil * rakeBps) / 10000);
  if (rawRakeOil <= 0) return 0;
  return rakeCapOil > 0 ? Math.min(rakeCapOil, rawRakeOil) : rawRakeOil;
}

function resolveCashSessionCashoutTerms(deps, table, seat, requestedReturnOil) {
  const existing = typeof deps.getOpenPokerPlayPlayerStatByTableAndWalletSubject === 'function'
    ? deps.getOpenPokerPlayPlayerStatByTableAndWalletSubject(table?.tableId, seat?.walletSubject)
    : null;
  const investedOil = Number(existing?.buyInOil || seat?.buyInOil || 0) + Number(existing?.reloadOil || 0);
  const grossReturnOil = Math.max(0, Number(requestedReturnOil || 0));
  const rakeOil = computeCashRakeOil(table, {
    investedOil,
    returnedOil: grossReturnOil,
  });
  return {
    investedOil,
    grossReturnOil,
    rakeOil,
    netReturnOil: Math.max(0, grossReturnOil - rakeOil),
  };
}

function getPokerPlayPlayerStatEffectiveAt(stat) {
  return normalizeIsoString(
    stat?.closedAt
    || stat?.payoutSettledAt
    || ((normalizeTrimmedString(stat?.status).toLowerCase() !== 'open' && normalizeTrimmedString(stat?.status).toLowerCase() !== 'registered')
      ? stat?.updatedAt
      : '')
    || ''
  );
}

function buildNativePokerSeasonWindow(seasonId) {
  const match = String(seasonId || '').trim().match(POKER_PLAY_NATIVE_SEASON_ID_RE);
  if (!match) return null;
  const year = Number(match[1] || 0);
  const month = Number(match[2] || 0);
  if (!year || !month) return null;
  const startAt = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)).toISOString();
  const endAt = month === 12
    ? new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0)).toISOString()
    : new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)).toISOString();
  const titleMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
    .toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  return {
    seasonId: `native-${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`,
    title: `Native Live Season ${titleMonth}`,
    startAt,
    endAt,
  };
}

function resolveCurrentNativePokerSeason(processAt) {
  const normalized = normalizeIsoString(processAt) || new Date().toISOString();
  const date = new Date(normalized);
  return buildNativePokerSeasonWindow(`native-${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`);
}

function listNativePokerSeasonIdsFromStats(stats) {
  const seasonIds = new Set();
  for (const stat of Array.isArray(stats) ? stats : []) {
    const effectiveAt = getPokerPlayPlayerStatEffectiveAt(stat);
    if (!effectiveAt) continue;
    const date = new Date(effectiveAt);
    const seasonId = `native-${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    seasonIds.add(seasonId);
  }
  return Array.from(seasonIds).sort((left, right) => String(right).localeCompare(String(left)));
}

function computeTableSummary(table, seats, hand, viewerSeat) {
  const access = getPokerPlayTableAccess(table);
  const activeSeats = getActiveSeatRows(seats);
  const occupiedSeats = (Array.isArray(seats) ? seats : []).filter(isSeatOccupyingTable);
  const disconnectedSeatCount = activeSeats.filter((seat) => getSeatPresenceStatus(seat) === 'disconnected').length;
  const handNumber = Number(hand?.handNumber || 0);
  const blindProgress = resolveTournamentBlindProgress(table, handNumber > 0 ? handNumber : Number(table?.state?.activeHandNumber || 1));
  const pendingBlindAdvanceCount = Math.max(0, normalizeOilAmount(table?.state?.directorBlindAdvancesPending, 0));
  const upcomingBlindProgress = normalizePokerPlayTableType(table?.tableType) === 'tournament'
    ? resolveTournamentBlindProgress(
      table,
      hand?.status === 'live'
        ? Math.max(1, handNumber + 1)
        : Math.max(1, handNumber > 0 ? handNumber : Number(table?.state?.activeHandNumber || 1)),
      { includePendingAdvances: true }
    )
    : blindProgress;
  const lateRegistration = resolveTournamentLateRegistration(table, hand);
  const scheduledStartAt = getTournamentScheduledStartAt(table);
  const scheduledStartPending = !!scheduledStartAt && isScheduledTournamentPending(table, hand?.updatedAt || table?.updatedAt || table?.createdAt || '');
  const activeScheduledBreak = getActiveScheduledBreakState(table);
  const scheduledBreakActive = !!activeScheduledBreak && isScheduledBreakActive(table, hand?.updatedAt || table?.updatedAt || table?.createdAt || '');
  const nextScheduledBreak = getNextScheduledBreak(table);
  const scheduleTemplate = getTournamentScheduleTemplate(table);
  const fillPolicy = getTournamentFillPolicy(table);
  const formatVariant = getTournamentFormatVariant(table);
  const bountyModel = getTournamentBountyModel(table);
  const tournamentEntryFeeOil = getTournamentEntryFeeOil(table);
  const bountyPerEntryOil = computeTournamentInitialBountyOil(table?.buyInOil, bountyModel, tournamentEntryFeeOil);
  const entryCount = getTournamentTableEntryCount(table, seats);
  const rebuyWindow = resolveTournamentRebuyWindow(table, hand);
  const addonWindow = resolveTournamentAddonWindow(table, hand);
  const addonPrizePoolOil = Math.max(0, normalizeOilAmount(table?.state?.addonPrizePoolOil, 0));
  const addonBountyPoolOil = Math.max(0, normalizeOilAmount(table?.state?.addonBountyPoolOil, 0));
  const multiFlightImportSummary = buildTournamentMultiFlightImportSummary([{ table }]);
  const multiFlightStage = getTournamentMultiFlightStage(table);
  const localEntrantCount = multiFlightStage === 'merge' && multiFlightImportSummary.flightCount > 0
    ? multiFlightImportSummary.entryCount
    : entryCount;
  const localPrizePoolOil = multiFlightStage === 'merge' && multiFlightImportSummary.flightCount > 0
    ? multiFlightImportSummary.prizePoolOil
    : ((entryCount * computeTournamentPrizeContributionOil(table?.buyInOil, bountyModel, tournamentEntryFeeOil)) + addonPrizePoolOil);
  const localPayoutPlan = buildTournamentPayoutPlan({
    entrantCount: localEntrantCount,
    prizePoolOil: localPrizePoolOil,
    formatVariant,
    satelliteAwardCount: getTournamentSatelliteAwardCount(table),
    satelliteAwardKind: getTournamentSatelliteAwardKind(table),
  });
  const startTargetSeats = getTournamentStartTargetSeats(table);
  const started = hasPokerPlayTableStarted(table, hand);
  const startSeatCount = activeSeats.length;
  const startReady = !started
    && !scheduledStartPending
    && startSeatCount >= getPokerPlayAutoStartSeatTarget(table, hand);
  const seatsUntilStart = started ? 0 : Math.max(0, startTargetSeats - startSeatCount);
  return {
    occupancy: occupiedSeats.length,
    activeSeatCount: activeSeats.length,
    openSeatCount: Math.max(0, Number(table?.maxSeats || POKER_PLAY_MAX_SEATS) - occupiedSeats.length),
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
    pendingBlindAdvanceCount,
    upcomingBlindLevel: upcomingBlindProgress.blindLevel,
    lateRegistrationOpen: lateRegistration.open,
    lateRegistrationRemainingHands: lateRegistration.remainingHands,
    scheduledStartAt: scheduledStartAt || null,
    scheduledStartPending,
    formatVariant,
    scheduleTemplateId: scheduleTemplate?.templateId || null,
    scheduleTemplateTitle: scheduleTemplate?.title || null,
    scheduleRecurrenceLabel: scheduleTemplate?.recurrenceLabel || null,
    reentryLimit: getTournamentReentryLimit(table),
    rebuyLimit: getTournamentRebuyLimit(table),
    rebuyWindowHands: rebuyWindow.rebuyWindowHands,
    rebuyWindowOpen: rebuyWindow.open,
    rebuyWindowRemainingHands: rebuyWindow.remainingHands,
    fillPolicy,
    startTargetSeats,
    seatsUntilStart,
    startReady,
    entryCount: localEntrantCount,
    acceptedReentryCount: Math.max(0, normalizeOilAmount(table?.state?.reentryCount, 0)),
    acceptedRebuyCount: Math.max(0, normalizeOilAmount(table?.state?.rebuyCount, 0)),
    bountyModel,
    bountyPerEntryOil,
    bountyPoolOil: multiFlightStage === 'merge' && multiFlightImportSummary.flightCount > 0
      ? multiFlightImportSummary.bountyPoolOil
      : ((entryCount * bountyPerEntryOil) + addonBountyPoolOil),
    tournamentEntryFeeOil,
    tournamentFeePoolOil: entryCount * tournamentEntryFeeOil,
    prizePoolOil: Number(localPayoutPlan.prizePoolOil || 0),
    payoutModel: localPayoutPlan.payoutModel,
    paidPlaces: Number(localPayoutPlan.paidPlaces || 0),
    payouts: cloneJson(localPayoutPlan.payouts, []),
    satelliteTargetSeriesId: formatVariant === 'satellite'
      ? normalizeTrimmedString(table?.rules?.satelliteTargetSeriesId)
      : null,
    satelliteTargetSeriesTitle: formatVariant === 'satellite'
      ? normalizeTrimmedString(table?.rules?.satelliteTargetSeriesTitle)
      : null,
    satelliteAwardKind: formatVariant === 'satellite'
      ? getTournamentSatelliteAwardKind(table)
      : null,
    satelliteAwardCount: formatVariant === 'satellite'
      ? getTournamentSatelliteAwardCount(table)
      : 0,
    satelliteAwardValueOil: formatVariant === 'satellite'
      ? getTournamentSatelliteAwardValueOil(table)
      : 0,
    multiFlightFestivalParentId: isMultiFlightTournament(table)
      ? getTournamentMultiFlightFestivalParentId(table)
      : null,
    multiFlightFestivalTitle: isMultiFlightTournament(table)
      ? getTournamentMultiFlightFestivalTitle(table)
      : null,
    multiFlightStage,
    multiFlightFlightCode: isMultiFlightTournament(table)
      ? getTournamentMultiFlightFlightCode(table) || null
      : null,
    multiFlightFlightLabel: isMultiFlightTournament(table)
      ? getTournamentMultiFlightFlightLabel(table) || null
      : null,
    multiFlightMergeSeriesId: isMultiFlightFlightTable(table)
      ? getTournamentMultiFlightMergeSeriesId(table) || null
      : null,
    multiFlightMergeSeriesTitle: isMultiFlightFlightTable(table)
      ? getTournamentMultiFlightMergeSeriesTitle(table) || null
      : null,
    multiFlightAdvanceSeatCount: isMultiFlightFlightTable(table)
      ? getTournamentMultiFlightAdvanceSeatCount(table)
      : 0,
    multiFlightAdvancedSeatCount: Math.max(0, normalizeOilAmount(table?.state?.multiFlightAdvancedSeatCount, 0)),
    multiFlightBaggedAt: normalizeIsoString(table?.state?.multiFlightBaggedAt) || null,
    multiFlightImportedFlightCount: multiFlightImportSummary.flightCount,
    multiFlightImportedEntryCount: multiFlightImportSummary.entryCount,
    multiFlightImportedPrizePoolOil: multiFlightImportSummary.prizePoolOil,
    multiFlightImportedBountyPoolOil: multiFlightImportSummary.bountyPoolOil,
    multiFlightImportedCarriedStackTotalOil: multiFlightImportSummary.carriedStackTotalOil,
    addonWindowAfterHandNumbers: addonWindow.afterHandNumbers,
    addonWindowOpen: addonWindow.open,
    activeAddonWindowAfterHandNumber: addonWindow.activeAfterHandNumber,
    nextAddonAfterHandNumber: addonWindow.nextAfterHandNumber,
    addonCostOil: getTournamentAddonCostOil(table),
    addonChipsOil: getTournamentAddonChipsOil(table),
    maxAddonsPerSeat: getTournamentMaxAddonsPerSeat(table),
    addonCount: Math.max(0, normalizeOilAmount(table?.state?.addonCount, 0)),
    addonPrizePoolOil,
    addonBountyPoolOil,
    scheduledBreakCount: getTournamentScheduledBreaks(table).length,
    scheduledBreakActive,
    scheduledBreakLabel: activeScheduledBreak?.label || null,
    scheduledBreakAfterHandNumber: activeScheduledBreak?.afterHandNumber || 0,
    scheduledBreakStartedAt: activeScheduledBreak?.startedAt || null,
    scheduledBreakUntilAt: scheduledBreakActive ? activeScheduledBreak?.untilAt || null : null,
    scheduledBreakDurationMinutes: activeScheduledBreak?.durationMinutes || 0,
    completedScheduledBreakCount: getCompletedScheduledBreakAfterHands(table).length,
    nextScheduledBreakAfterHandNumber: nextScheduledBreak?.afterHandNumber || 0,
    nextScheduledBreakLabel: nextScheduledBreak?.label || null,
    registrationClosedByDirectorAt: normalizeTrimmedString(table?.state?.registrationClosedByDirectorAt) || null,
    blindReturnPolicy: normalizePokerPlayTableType(table?.tableType) === 'cash' ? getCashBlindReturnPolicy(table) : null,
    cashRakeBps: normalizePokerPlayTableType(table?.tableType) === 'cash' ? getCashRakeBps(table) : 0,
    cashRakeCapOil: normalizePokerPlayTableType(table?.tableType) === 'cash' ? getCashRakeCapOil(table) : 0,
    accessMode: access.mode,
    inviteOnly: access.inviteOnly,
  };
}

function buildDynamicTableSummary(config, matchKey) {
  const tournamentFillPolicy = normalizePokerPlayTournamentFillPolicy(config?.fillPolicy);
  const tournamentBountyModel = normalizePokerPlayTournamentBountyModel(config?.bountyModel);
  const tournamentFormatVariant = normalizePokerPlayTournamentFormat(config?.formatVariant);
  const tournamentStartTargetSeats = normalizeTournamentStartTargetSeats(config?.startTargetSeats, {
    minPlayers: config?.minPlayers,
    maxSeats: config?.maxSeats,
    fillPolicy: tournamentFillPolicy,
  });
  const tournamentHeadline = tournamentFormatVariant === 'satellite'
    ? 'Six-max satellite tournament that awards downstream target-event qualification.'
    : (tournamentFormatVariant === 'multi_flight'
      ? (normalizeTrimmedString(config?.multiFlightMergeSeriesId)
        ? 'Day 1 multi-flight table that bags surviving stacks into a downstream merge stage.'
        : 'Merge-stage multi-flight tournament that receives carried stacks from Day 1 flights.')
    : (tournamentBountyModel === 'pko_50' || tournamentBountyModel === 'pko_75' || tournamentBountyModel === 'full_bounty'
      ? 'Six-max bounty tournament with real ladder prizes, live knockout rewards, and private human + agent seat threads.'
      : (tournamentFillPolicy === 'fill_to_full'
        ? 'Sit-and-go tournament that waits for a full table before the first hand.'
        : (tournamentFillPolicy === 'fill_to_target'
          ? `Sit-and-go tournament that waits for ${tournamentStartTargetSeats} seats before the first hand.`
          : 'Six-max tournament with a real payout ladder and private human + agent seat threads.'))));
  const summary = {
    headline: config.tableType === 'cash'
      ? 'Open cash table with private human + agent seat threads.'
      : tournamentHeadline,
    matchKey,
    origin: 'dynamic',
    accessMode: normalizePokerPlayAccessMode(config?.accessMode),
    inviteOnly: normalizePokerPlayAccessMode(config?.accessMode) === 'invite_only',
  };
  if (config.tableType === 'cash') {
    summary.blindReturnPolicy = normalizePokerPlayBlindReturnPolicy(config?.blindReturnPolicy, 'post_big_blind');
    summary.cashRakeBps = normalizePokerPlayCashRakeBps(config?.cashRakeBps, 0);
    summary.cashRakeCapOil = normalizePokerPlayCashRakeCapOil(config?.cashRakeCapOil, 0);
  }
  if (config.tableType === 'tournament') {
    summary.seriesId = normalizeTrimmedString(config?.seriesId);
    summary.seriesTitle = normalizeTrimmedString(config?.seriesTitle, config?.title);
    summary.scheduledStartAt = normalizeIsoString(config?.scheduledStartAt) || null;
    summary.formatVariant = tournamentFormatVariant;
    summary.scheduleTemplateId = normalizePokerPlayScheduleTemplateId(config?.scheduleTemplateId) || null;
    summary.scheduleTemplateTitle = normalizePokerPlayScheduleTemplateTitle(config?.scheduleTemplateTitle, config?.title) || null;
    summary.scheduleRecurrenceLabel = normalizePokerPlayScheduleRecurrenceLabel(config?.scheduleRecurrenceLabel) || null;
    summary.reentryLimit = Math.max(0, normalizeOilAmount(config?.reentryLimit, 0));
    summary.rebuyLimit = Math.max(0, normalizeOilAmount(config?.rebuyLimit, 0));
    summary.rebuyWindowHands = Math.max(0, normalizeOilAmount(config?.rebuyWindowHands, 0));
    summary.fillPolicy = tournamentFillPolicy;
    summary.bountyModel = tournamentBountyModel;
    summary.tournamentEntryFeeOil = normalizePokerPlayTournamentEntryFeeOil(config?.tournamentEntryFeeOil, config?.buyInOil, 0);
    summary.bountyPerEntryOil = computeTournamentInitialBountyOil(config?.buyInOil, tournamentBountyModel, summary.tournamentEntryFeeOil);
    summary.satelliteTargetSeriesId = tournamentFormatVariant === 'satellite' ? normalizeTrimmedString(config?.satelliteTargetSeriesId) || null : null;
    summary.satelliteTargetSeriesTitle = tournamentFormatVariant === 'satellite' ? normalizeTrimmedString(config?.satelliteTargetSeriesTitle) || null : null;
    summary.satelliteAwardKind = tournamentFormatVariant === 'satellite' ? normalizePokerPlayTournamentSatelliteAwardKind(config?.satelliteAwardKind) : null;
    summary.satelliteAwardCount = tournamentFormatVariant === 'satellite' ? Math.max(1, normalizeOilAmount(config?.satelliteAwardCount, 1)) : 0;
    summary.satelliteAwardValueOil = tournamentFormatVariant === 'satellite' ? Math.max(0, normalizeOilAmount(config?.satelliteAwardValueOil, config?.buyInOil)) : 0;
    summary.multiFlightFestivalParentId = tournamentFormatVariant === 'multi_flight'
      ? normalizePokerPlayMultiFlightFestivalId(config?.multiFlightFestivalParentId) || null
      : null;
    summary.multiFlightFestivalTitle = tournamentFormatVariant === 'multi_flight'
      ? normalizePokerPlayMultiFlightFestivalTitle(config?.multiFlightFestivalTitle, config?.seriesTitle || config?.title) || null
      : null;
    summary.multiFlightStage = tournamentFormatVariant === 'multi_flight'
      ? (normalizeTrimmedString(config?.multiFlightMergeSeriesId) ? 'flight' : 'merge')
      : null;
    summary.multiFlightFlightCode = tournamentFormatVariant === 'multi_flight'
      ? normalizePokerPlayMultiFlightFlightCode(config?.multiFlightFlightCode) || null
      : null;
    summary.multiFlightFlightLabel = tournamentFormatVariant === 'multi_flight'
      ? normalizePokerPlayMultiFlightFlightLabel(
        config?.multiFlightFlightLabel,
        normalizePokerPlayMultiFlightFlightCode(config?.multiFlightFlightCode)
          ? `Flight ${normalizePokerPlayMultiFlightFlightCode(config?.multiFlightFlightCode)}`
          : ''
      ) || null
      : null;
    summary.multiFlightMergeSeriesId = tournamentFormatVariant === 'multi_flight'
      ? normalizeTrimmedString(config?.multiFlightMergeSeriesId) || null
      : null;
    summary.multiFlightMergeSeriesTitle = tournamentFormatVariant === 'multi_flight'
      ? normalizeTrimmedString(config?.multiFlightMergeSeriesTitle) || null
      : null;
    summary.multiFlightAdvanceSeatCount = tournamentFormatVariant === 'multi_flight'
      ? Math.max(0, normalizeOilAmount(config?.multiFlightAdvanceSeatCount, 0))
      : 0;
    summary.multiFlightAdvancedSeatCount = 0;
    summary.multiFlightBaggedAt = null;
    summary.multiFlightImportedFlightCount = 0;
    summary.multiFlightImportedEntryCount = 0;
    summary.multiFlightImportedPrizePoolOil = 0;
    summary.multiFlightImportedBountyPoolOil = 0;
    summary.multiFlightImportedCarriedStackTotalOil = 0;
    summary.addonWindowAfterHandNumbers = normalizePokerPlayTournamentAddonWindowAfterHandNumbers(config?.addonWindowAfterHandNumbers);
    summary.addonWindowOpen = false;
    summary.activeAddonWindowAfterHandNumber = 0;
    summary.nextAddonAfterHandNumber = summary.addonWindowAfterHandNumbers[0] || 0;
    summary.addonCostOil = normalizePokerPlayTournamentAddonCostOil(config?.addonCostOil, config?.buyInOil);
    summary.addonChipsOil = normalizePokerPlayTournamentAddonChipsOil(config?.addonChipsOil, config?.buyInOil);
    summary.maxAddonsPerSeat = Math.max(0, normalizeOilAmount(config?.maxAddonsPerSeat, 0));
    summary.acceptedRebuyCount = 0;
    summary.addonCount = 0;
    summary.addonPrizePoolOil = 0;
    summary.addonBountyPoolOil = 0;
    summary.startTargetSeats = tournamentStartTargetSeats;
    summary.seatsUntilStart = summary.startTargetSeats;
    summary.startReady = false;
    summary.scheduledBreakCount = normalizePokerPlayScheduledBreaks(config?.scheduledBreaks, {
      handsPerBlindLevel: config?.handsPerBlindLevel,
    }).length;
    summary.scheduledBreakActive = false;
    summary.scheduledBreakLabel = null;
    summary.scheduledBreakAfterHandNumber = 0;
    summary.scheduledBreakStartedAt = null;
    summary.scheduledBreakUntilAt = null;
    summary.scheduledBreakDurationMinutes = 0;
    summary.completedScheduledBreakCount = 0;
    const nextScheduledBreak = normalizePokerPlayScheduledBreaks(config?.scheduledBreaks, {
      handsPerBlindLevel: config?.handsPerBlindLevel,
    })[0] || null;
    summary.nextScheduledBreakAfterHandNumber = nextScheduledBreak?.afterHandNumber || 0;
    summary.nextScheduledBreakLabel = nextScheduledBreak?.label || null;
  }
  return summary;
}

function buildTournamentEconomics(entries) {
  const seats = getTournamentAllSeats(entries).filter((seat) => !isTournamentVoidedSeat(seat));
  const entryCountsByWallet = {};
  let prizePoolOil = 0;
  let bountyPoolOil = 0;
  let totalBountyAwardedOil = 0;
  let activeBountyPoolOil = 0;
  let rebuyCount = 0;
  let addonCount = 0;
  let addonPrizePoolOil = 0;
  let addonBountyPoolOil = 0;
  for (const entry of Array.isArray(entries) ? entries : []) {
    const entryTable = entry?.table || null;
    const entryBountyModel = getTournamentBountyModel(entryTable);
    const entryFeeOil = getTournamentEntryFeeOil(entryTable);
    const tableCounts = getTournamentEntryCountsByWallet(entry?.table);
    const countedEntryTotal = Object.values(tableCounts).reduce(
      (sum, count) => sum + Math.max(0, Number(count || 0)),
      0
    );
    if (Object.keys(tableCounts).length) {
      for (const [walletSubject, count] of Object.entries(tableCounts)) {
        entryCountsByWallet[walletSubject] = Math.max(0, Number(entryCountsByWallet[walletSubject] || 0)) + Math.max(0, Number(count || 0));
      }
      prizePoolOil += countedEntryTotal * computeTournamentPrizeContributionOil(entryTable?.buyInOil, entryBountyModel, entryFeeOil);
      bountyPoolOil += countedEntryTotal * computeTournamentInitialBountyOil(entryTable?.buyInOil, entryBountyModel, entryFeeOil);
    }
    rebuyCount += Math.max(0, normalizeOilAmount(entryTable?.state?.rebuyCount, 0));
    addonCount += Math.max(0, normalizeOilAmount(entryTable?.state?.addonCount, 0));
    addonPrizePoolOil += Math.max(0, normalizeOilAmount(entryTable?.state?.addonPrizePoolOil, 0));
    addonBountyPoolOil += Math.max(0, normalizeOilAmount(entryTable?.state?.addonBountyPoolOil, 0));
    for (const seat of Array.isArray(entry?.seats) ? entry.seats : []) {
      if (isTournamentVoidedSeat(seat)) continue;
      const walletSubject = normalizeTrimmedString(seat?.walletSubject);
      if (!Object.keys(tableCounts).length && walletSubject) {
        entryCountsByWallet[walletSubject] = Math.max(0, Number(entryCountsByWallet[walletSubject] || 0)) + 1;
        prizePoolOil += computeTournamentPrizeContributionOil(seat?.buyInOil, entryBountyModel, entryFeeOil);
        bountyPoolOil += computeTournamentInitialBountyOil(seat?.buyInOil, entryBountyModel, entryFeeOil);
      }
      totalBountyAwardedOil += Math.max(0, Number(seat?.bountyWonOil || 0));
      activeBountyPoolOil += Math.max(0, Number(seat?.currentBountyOil || 0));
    }
  }
  const uniquePlayerCount = Object.keys(entryCountsByWallet).length;
  const entryCount = Object.values(entryCountsByWallet).reduce((sum, count) => sum + Math.max(0, Number(count || 0)), 0);
  const leadTable = (Array.isArray(entries) ? entries : []).find((entry) => entry?.table)?.table || null;
  const bountyModel = getTournamentBountyModel(leadTable);
  const formatVariant = getTournamentFormatVariant(leadTable);
  const multiFlightImports = buildTournamentMultiFlightImportSummary(entries);
  const multiFlightMergeStage = isMultiFlightTournament(leadTable) && !isMultiFlightFlightTable(leadTable) && multiFlightImports.flightCount > 0;
  const settledChopTable = (Array.isArray(entries) ? entries : [])
    .map((entry) => entry?.table || null)
    .find((table) => normalizeIsoString(table?.state?.chopSettledAt) && Array.isArray(table?.state?.payouts) && table.state.payouts.length);
  const effectivePrizePoolOil = multiFlightMergeStage
    ? multiFlightImports.prizePoolOil
    : (prizePoolOil + addonPrizePoolOil);
  const payoutPlan = settledChopTable
    ? {
      entrantCount: entryCount,
      prizePoolOil: Math.max(0, normalizeOilAmount(settledChopTable?.state?.prizePoolOil, effectivePrizePoolOil)),
      payoutModel: normalizeTrimmedString(settledChopTable?.state?.payoutModel, 'deal_custom'),
      paidPlaces: Math.max(
        0,
        normalizeOilAmount(
          settledChopTable?.state?.paidPlaces,
          (Array.isArray(settledChopTable?.state?.payouts) ? settledChopTable.state.payouts : []).filter((item) => Number(item?.amountOil || 0) > 0).length
        )
      ),
      payouts: cloneJson(settledChopTable?.state?.payouts, []),
    }
    : buildTournamentPayoutPlan({
      entrantCount: multiFlightMergeStage ? multiFlightImports.entryCount : entryCount,
      prizePoolOil: effectivePrizePoolOil,
      formatVariant,
      satelliteAwardCount: getTournamentSatelliteAwardCount(leadTable),
      satelliteAwardKind: getTournamentSatelliteAwardKind(leadTable),
    });
  const completed = (
    getActiveSeatRows(seats).length <= 1
    || (isMultiFlightFlightTable(leadTable) && !!normalizeIsoString(leadTable?.state?.multiFlightBaggedAt))
  ) && payoutPlan.entrantCount > 1;
  const storedStandingsTable = (Array.isArray(entries) ? entries : [])
    .map((entry) => entry?.table || null)
    .find((table) => Array.isArray(table?.state?.standings) && table.state.standings.length);
  return {
    ...payoutPlan,
    formatVariant,
    bountyModel,
    bountyPerEntryOil: computeTournamentInitialBountyOil(leadTable?.buyInOil, bountyModel, getTournamentEntryFeeOil(leadTable)),
    tournamentEntryFeeOil: getTournamentEntryFeeOil(leadTable),
    bountyPoolOil: multiFlightMergeStage ? multiFlightImports.bountyPoolOil : (bountyPoolOil + addonBountyPoolOil),
    totalBountyAwardedOil,
    activeBountyPoolOil,
    uniquePlayerCount,
    entryCount: multiFlightMergeStage ? multiFlightImports.entryCount : entryCount,
    reentryCount: Object.values(entryCountsByWallet).reduce((sum, count) => sum + Math.max(0, Number(count || 0) - 1), 0),
    rebuyCount,
    addonCount,
    addonPrizePoolOil,
    addonBountyPoolOil,
    satelliteTargetSeriesId: formatVariant === 'satellite' ? normalizeTrimmedString(leadTable?.rules?.satelliteTargetSeriesId) || null : null,
    satelliteTargetSeriesTitle: formatVariant === 'satellite' ? normalizeTrimmedString(leadTable?.rules?.satelliteTargetSeriesTitle) || null : null,
    satelliteAwardKind: formatVariant === 'satellite' ? getTournamentSatelliteAwardKind(leadTable) : null,
    satelliteAwardCount: formatVariant === 'satellite' ? getTournamentSatelliteAwardCount(leadTable) : 0,
    satelliteAwardValueOil: formatVariant === 'satellite' ? getTournamentSatelliteAwardValueOil(leadTable) : 0,
    multiFlightFestivalParentId: isMultiFlightTournament(leadTable) ? getTournamentMultiFlightFestivalParentId(leadTable) || null : null,
    multiFlightFestivalTitle: isMultiFlightTournament(leadTable) ? getTournamentMultiFlightFestivalTitle(leadTable) || null : null,
    multiFlightStage: getTournamentMultiFlightStage(leadTable),
    multiFlightFlightCode: isMultiFlightTournament(leadTable) ? getTournamentMultiFlightFlightCode(leadTable) || null : null,
    multiFlightFlightLabel: isMultiFlightTournament(leadTable) ? getTournamentMultiFlightFlightLabel(leadTable) || null : null,
    multiFlightMergeSeriesId: isMultiFlightFlightTable(leadTable) ? getTournamentMultiFlightMergeSeriesId(leadTable) || null : null,
    multiFlightMergeSeriesTitle: isMultiFlightFlightTable(leadTable) ? getTournamentMultiFlightMergeSeriesTitle(leadTable) || null : null,
    multiFlightAdvanceSeatCount: isMultiFlightFlightTable(leadTable) ? getTournamentMultiFlightAdvanceSeatCount(leadTable) : 0,
    multiFlightAdvancedSeatCount: multiFlightMergeStage
      ? multiFlightImports.advancedSeatCount
      : Math.max(0, normalizeOilAmount(leadTable?.state?.multiFlightAdvancedSeatCount, 0)),
    multiFlightImportedFlightCount: multiFlightImports.flightCount,
    multiFlightImportedEntryCount: multiFlightImports.entryCount,
    multiFlightImportedPrizePoolOil: multiFlightImports.prizePoolOil,
    multiFlightImportedBountyPoolOil: multiFlightImports.bountyPoolOil,
    multiFlightImportedCarriedStackTotalOil: multiFlightImports.carriedStackTotalOil,
    completed,
    standings: completed
      ? (storedStandingsTable
        ? cloneJson(storedStandingsTable.state.standings, [])
        : buildCompletedTournamentPlacements(entries))
      : [],
  };
}

function buildTournamentChopSnapshot(entries) {
  const items = Array.isArray(entries) ? entries : [];
  const economics = buildTournamentEconomics(items);
  const allSeats = getTournamentAllSeats(items).filter((seat) => !isTournamentVoidedSeat(seat));
  const remainingSeats = getActiveSeatRows(allSeats)
    .slice()
    .sort((left, right) => {
      const stackDelta = Number(right?.stackOil || 0) - Number(left?.stackOil || 0);
      if (stackDelta !== 0) return stackDelta;
      return normalizeSeatNumber(left?.seatNumber) - normalizeSeatNumber(right?.seatNumber);
    });
  const remainingSeatKeys = new Set(remainingSeats.map((seat) => getTournamentSeatIdentity(seat)));
  const payoutByPlace = new Map((Array.isArray(economics?.payouts) ? economics.payouts : []).map((item) => [Number(item.place || 0), Number(item.amountOil || 0)]));
  const defaultPayouts = Array.from({ length: remainingSeats.length }, (_item, index) => ({
    place: index + 1,
    amountOil: Number(payoutByPlace.get(index + 1) || 0),
  }));
  const payablePoolOil = defaultPayouts.reduce((sum, item) => sum + Number(item.amountOil || 0), 0);
  const fixedPayouts = sortSeatsByTournamentElimination(
    allSeats.filter((seat) => !remainingSeatKeys.has(getTournamentSeatIdentity(seat)))
  )
    .map((seat, index) => {
      const place = remainingSeats.length + index + 1;
      return {
        place,
        tableId: seat.tableId,
        seatNumber: normalizeSeatNumber(seat?.seatNumber),
        walletSubject: normalizeTrimmedString(seat?.walletSubject),
        houseId: seat?.houseId || null,
        displayName: seat?.displayName || formatSeatLabel(seat?.seatNumber),
        amountOil: Number(payoutByPlace.get(place) || 0),
      };
    })
    .filter((item) => item.amountOil > 0);
  return {
    economics,
    remainingSeats: remainingSeats.map((seat) => ({
      tableId: seat.tableId,
      seatNumber: normalizeSeatNumber(seat?.seatNumber),
      walletSubject: normalizeTrimmedString(seat?.walletSubject),
      houseId: seat?.houseId || null,
      displayName: seat?.displayName || formatSeatLabel(seat?.seatNumber),
      stackOil: Number(seat?.stackOil || 0),
      buyInOil: Number(seat?.buyInOil || 0),
      currentBountyOil: Number(seat?.currentBountyOil || 0),
    })),
    defaultPayouts,
    fixedPayouts,
    payablePoolOil,
  };
}

function getSeriesChopProposalList(deps, seriesId, { limit = 20 } = {}) {
  return typeof deps.listPokerChopProposalsBySeriesId === 'function'
    ? deps.listPokerChopProposalsBySeriesId(seriesId, { limit })
    : [];
}

function getLatestSeriesChopProposal(deps, seriesId, { activeOnly = false } = {}) {
  const items = getSeriesChopProposalList(deps, seriesId, { limit: 20 });
  return items.find((proposal) => !activeOnly || POKER_PLAY_CHOP_ACTIVE_STATUSES.has(normalizePokerPlayChopStatus(proposal?.status, 'open'))) || null;
}

function buildPokerPlayChopProposalSummary(proposal, { viewerWalletSubject = '', publicViewer = false } = {}) {
  if (!proposal || typeof proposal !== 'object') return null;
  const agreements = (Array.isArray(proposal?.agreements) ? proposal.agreements : []).map((item) => ({
    walletSubject: publicViewer ? null : normalizeTrimmedString(item?.walletSubject) || null,
    seatNumber: normalizeSeatNumber(item?.seatNumber),
    displayName: normalizePokerPlayDisplayName(item?.displayName || formatSeatLabel(item?.seatNumber)),
    agreedAt: normalizeIsoString(item?.agreedAt) || null,
    status: normalizeIsoString(item?.agreedAt) ? 'agreed' : 'pending',
  }));
  const agreementCount = agreements.filter((item) => item.status === 'agreed').length;
  const remainingSeats = (Array.isArray(proposal?.remainingSeats) ? proposal.remainingSeats : []).map((item) => ({
    tableId: normalizeTrimmedString(item?.tableId) || null,
    seatNumber: normalizeSeatNumber(item?.seatNumber),
    walletSubject: publicViewer ? null : normalizeTrimmedString(item?.walletSubject) || null,
    displayName: normalizePokerPlayDisplayName(item?.displayName || formatSeatLabel(item?.seatNumber)),
    stackOil: Number(item?.stackOil || 0),
    currentBountyOil: Number(item?.currentBountyOil || 0),
  }));
  const proposedPayouts = (Array.isArray(proposal?.proposedPayouts) ? proposal.proposedPayouts : []).map((item) => ({
    seatNumber: normalizeSeatNumber(item?.seatNumber),
    walletSubject: publicViewer ? null : normalizeTrimmedString(item?.walletSubject) || null,
    displayName: normalizePokerPlayDisplayName(item?.displayName || formatSeatLabel(item?.seatNumber)),
    amountOil: Number(item?.amountOil || 0),
  }));
  return {
    proposalId: normalizeTrimmedString(proposal?.proposalId),
    seriesId: normalizeTrimmedString(proposal?.seriesId),
    tableId: normalizeTrimmedString(proposal?.tableId),
    handId: normalizeTrimmedString(proposal?.handId) || null,
    status: normalizePokerPlayChopStatus(proposal?.status, 'open'),
    proposalKind: normalizeTrimmedString(proposal?.proposalKind, 'deal_custom'),
    proposerSeatNumber: normalizeSeatNumber(proposal?.proposerSeatNumber),
    proposerWalletSubject: publicViewer ? null : normalizeTrimmedString(proposal?.proposerWalletSubject) || null,
    note: normalizePokerPlayChopNote(proposal?.note),
    remainingSeats,
    defaultPayouts: cloneJson(proposal?.defaultPayouts, []),
    fixedPayouts: cloneJson(proposal?.fixedPayouts, []),
    proposedPayouts,
    agreements,
    agreementCount,
    allAgreed: remainingSeats.length > 0 && agreementCount >= remainingSeats.length,
    viewerAgreed: !!agreements.find((item) => normalizeTrimmedString(item?.walletSubject) === normalizeTrimmedString(viewerWalletSubject) && item.status === 'agreed'),
    settlement: cloneJson(proposal?.settlement, {}),
    approvedAt: normalizeIsoString(proposal?.approvedAt) || null,
    approvedBy: publicViewer ? null : normalizeTrimmedString(proposal?.approvedBy) || null,
    rejectedAt: normalizeIsoString(proposal?.rejectedAt) || null,
    rejectedBy: publicViewer ? null : normalizeTrimmedString(proposal?.rejectedBy) || null,
    settledAt: normalizeIsoString(proposal?.settledAt) || null,
    createdAt: normalizeIsoString(proposal?.createdAt) || null,
    updatedAt: normalizeIsoString(proposal?.updatedAt) || null,
  };
}

function getLatestSeriesChopProposalSummary(deps, seriesId, { viewerWalletSubject = '', publicViewer = false } = {}) {
  const proposal = getLatestSeriesChopProposal(deps, seriesId);
  if (!proposal) return null;
  const summary = buildPokerPlayChopProposalSummary(proposal, { viewerWalletSubject, publicViewer });
  if (!summary) return null;
  if (publicViewer && summary.status !== 'settled') return null;
  return summary;
}

function buildTournamentSeriesClosureSummary(entries) {
  const items = Array.isArray(entries) ? entries : [];
  let adminClosedTableCount = 0;
  let refundedSeatCount = 0;
  let refundedTotalOil = 0;
  let closeReason = '';
  let refundMode = '';
  let closedAt = '';
  let closedBy = '';
  for (const entry of items) {
    const table = entry?.table || null;
    if (!table || !isTableAdminClosed(table)) continue;
    adminClosedTableCount += 1;
    const state = table?.state && typeof table.state === 'object' ? table.state : {};
    refundedSeatCount += Number(state?.refundedSeatCount || 0);
    refundedTotalOil += Number(state?.refundedTotalOil || 0);
    if (!closeReason) {
      closeReason = normalizeTrimmedString(state?.closeReason);
    }
    if (!refundMode) {
      refundMode = normalizeTrimmedString(state?.refundMode);
    }
    if (!closedBy) {
      closedBy = normalizeTrimmedString(state?.closedBy);
    }
    const candidateClosedAt = normalizeTrimmedString(state?.closedAt, normalizeTrimmedString(table?.updatedAt));
    if (candidateClosedAt && (!closedAt || candidateClosedAt.localeCompare(closedAt) > 0)) {
      closedAt = candidateClosedAt;
    }
  }
  return {
    adminClosedTableCount,
    refundedSeatCount,
    refundedTotalOil,
    closeReason: closeReason || null,
    refundMode: refundMode || null,
    closedAt: closedAt || null,
    closedBy: closedBy || null,
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
  const closure = buildTournamentSeriesClosureSummary(items);
  const uniqueWallets = new Set();
  let tableCount = 0;
  let liveTableCount = 0;
  let completedTableCount = 0;
  let closedTableCount = 0;
  let openSeatCount = 0;
  let lateRegistrationOpen = false;
  let earliestScheduledStartAt = '';
  let anyScheduledPending = false;
  let anyScheduledBreakActive = false;
  let scheduledBreakTableCount = 0;
  let earliestScheduledBreakUntilAt = '';
  let nextScheduledBreakAfterHandNumber = 0;
  let nextScheduledBreakLabel = '';
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
    if (summary?.scheduledStartAt && (!earliestScheduledStartAt || compareIsoAsc(summary.scheduledStartAt, earliestScheduledStartAt) < 0)) {
      earliestScheduledStartAt = summary.scheduledStartAt;
    }
    if (summary?.scheduledStartPending) {
      anyScheduledPending = true;
    }
    if (summary?.scheduledBreakActive) {
      anyScheduledBreakActive = true;
      scheduledBreakTableCount += 1;
      if (summary?.scheduledBreakUntilAt && (!earliestScheduledBreakUntilAt || compareIsoAsc(summary.scheduledBreakUntilAt, earliestScheduledBreakUntilAt) < 0)) {
        earliestScheduledBreakUntilAt = summary.scheduledBreakUntilAt;
      }
    }
    if (Number(summary?.nextScheduledBreakAfterHandNumber || 0) > 0) {
      if (!nextScheduledBreakAfterHandNumber || Number(summary.nextScheduledBreakAfterHandNumber) < nextScheduledBreakAfterHandNumber) {
        nextScheduledBreakAfterHandNumber = Number(summary.nextScheduledBreakAfterHandNumber);
        nextScheduledBreakLabel = normalizeTrimmedString(summary?.nextScheduledBreakLabel);
      }
    }
    if (summary?.lateRegistrationOpen && Number(summary?.openSeatCount || 0) > 0) {
      lateRegistrationOpen = true;
    }
    for (const seat of Array.isArray(entry?.seats) ? entry.seats : []) {
      if (isTournamentVoidedSeat(seat)) continue;
      const walletSubject = normalizeTrimmedString(seat?.walletSubject);
      if (walletSubject) uniqueWallets.add(walletSubject);
    }
    if (!currentUserTableId && normalizeTrimmedString(viewerWalletSubject) && normalizeTrimmedString(entry?.viewerSeat?.walletSubject) === normalizeTrimmedString(viewerWalletSubject)) {
      currentUserTableId = String(table.tableId || '');
    }
  }

  let stage = 'seating';
  if (tableCount === 0 && closure.adminClosedTableCount > 0) {
    stage = 'cancelled';
  } else if (anyScheduledPending && liveTableCount === 0) {
    stage = 'scheduled';
  } else if (anyScheduledBreakActive && liveTableCount === 0) {
    stage = 'break';
  } else if (completedTableCount === tableCount && liveTableCount === 0 && !lateRegistrationOpen) {
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

  const viewerNavigableEntry = navigableEntries.find((entry) => normalizeTrimmedString(entry?.viewerSeat?.walletSubject) === normalizeTrimmedString(viewerWalletSubject));
  const activeTableId = String(
    viewerNavigableEntry?.table?.tableId
      || navigableEntries.find((entry) => entry?.summary?.liveHand)?.table?.tableId
      || navigableEntries.find((entry) => Number(entry?.summary?.openSeatCount || 0) > 0)?.table?.tableId
      || ''
  );

  return {
    seriesId: ref.seriesId || String(leadTable?.tableId || ''),
    seriesTitle: ref.seriesTitle || String(leadTable?.title || 'Tournament Series'),
    matchKey: ref.matchKey,
    tableCount,
    liveTableCount,
    completedTableCount,
    closedTableCount,
    entrantCount: economics.entryCount,
    entryCount: economics.entryCount,
    uniquePlayerCount: economics.uniquePlayerCount,
    acceptedReentryCount: economics.reentryCount,
    acceptedRebuyCount: economics.rebuyCount,
    openSeatCount,
    lateRegistrationOpen,
    scheduledStartAt: earliestScheduledStartAt || null,
    scheduledStartPending: anyScheduledPending,
    scheduledBreakActive: anyScheduledBreakActive,
    scheduledBreakTableCount,
    scheduledBreakUntilAt: earliestScheduledBreakUntilAt || null,
    nextScheduledBreakAfterHandNumber,
    nextScheduledBreakLabel: nextScheduledBreakLabel || null,
    stage,
    targetTableCount: directorPolicy.targetTableCount,
    needsRebalance: directorPolicy.needsRebalance,
    pendingBreakTableId: directorPolicy.pendingBreakTableId,
    pendingBreakSeatCount: directorPolicy.pendingBreakSeatCount,
    pendingBreakBlockedByLiveTable: directorPolicy.pendingBreakBlockedByLiveTable,
    prizePoolOil: economics.prizePoolOil,
    formatVariant: economics.formatVariant || 'standard',
    bountyModel: economics.bountyModel,
    bountyPerEntryOil: economics.bountyPerEntryOil,
    bountyPoolOil: economics.bountyPoolOil,
    totalBountyAwardedOil: economics.totalBountyAwardedOil,
    activeBountyPoolOil: economics.activeBountyPoolOil,
    payoutModel: economics.payoutModel,
    paidPlaces: economics.paidPlaces,
    payouts: economics.payouts,
    satelliteTargetSeriesId: economics.satelliteTargetSeriesId || null,
    satelliteTargetSeriesTitle: economics.satelliteTargetSeriesTitle || null,
    satelliteAwardKind: economics.satelliteAwardKind || null,
    satelliteAwardCount: Number(economics.satelliteAwardCount || 0),
    satelliteAwardValueOil: Number(economics.satelliteAwardValueOil || 0),
    multiFlightFestivalParentId: economics.multiFlightFestivalParentId || null,
    multiFlightFestivalTitle: economics.multiFlightFestivalTitle || null,
    multiFlightStage: economics.multiFlightStage || null,
    multiFlightFlightCode: economics.multiFlightFlightCode || null,
    multiFlightFlightLabel: economics.multiFlightFlightLabel || null,
    multiFlightMergeSeriesId: economics.multiFlightMergeSeriesId || null,
    multiFlightMergeSeriesTitle: economics.multiFlightMergeSeriesTitle || null,
    multiFlightAdvanceSeatCount: Number(economics.multiFlightAdvanceSeatCount || 0),
    multiFlightAdvancedSeatCount: Number(economics.multiFlightAdvancedSeatCount || 0),
    multiFlightImportedFlightCount: Number(economics.multiFlightImportedFlightCount || 0),
    multiFlightImportedEntryCount: Number(economics.multiFlightImportedEntryCount || 0),
    multiFlightImportedPrizePoolOil: Number(economics.multiFlightImportedPrizePoolOil || 0),
    multiFlightImportedBountyPoolOil: Number(economics.multiFlightImportedBountyPoolOil || 0),
    multiFlightImportedCarriedStackTotalOil: Number(economics.multiFlightImportedCarriedStackTotalOil || 0),
    addonCount: Number(economics.addonCount || 0),
    addonPrizePoolOil: Number(economics.addonPrizePoolOil || 0),
    addonBountyPoolOil: Number(economics.addonBountyPoolOil || 0),
    standings: economics.standings,
    adminClosedTableCount: closure.adminClosedTableCount,
    refundedSeatCount: closure.refundedSeatCount,
    refundedTotalOil: closure.refundedTotalOil,
    closeReason: closure.closeReason,
    refundMode: closure.refundMode,
    closedAt: closure.closedAt,
    closedBy: closure.closedBy,
    currentUserTableId: currentUserTableId || null,
    activeTableId: activeTableId || null,
    tableIds: tableIds.filter(Boolean),
  };
}

function listTournamentSeriesEntriesBySeriesId(deps, seriesId, { processAt, includeClosed = false } = {}) {
  const targetSeriesId = normalizeTrimmedString(seriesId);
  return deps.listPokerPlayTables()
    .map((table) => syncPokerPlayTable(deps, table.tableId, { processAt }))
    .filter((synced) => normalizePokerPlayTableType(synced?.table?.tableType) === 'tournament')
    .filter((synced) => includeClosed || !isSeriesClosedTable(synced?.table))
    .filter((synced) => normalizeTrimmedString(getTournamentSeriesRef(synced?.table).seriesId) === targetSeriesId);
}

function listTournamentSeriesEntriesDirectBySeriesId(deps, seriesId, { includeClosed = false } = {}) {
  const targetSeriesId = normalizeTrimmedString(seriesId);
  return deps.listPokerPlayTables()
    .filter((table) => normalizePokerPlayTableType(table?.tableType) === 'tournament')
    .filter((table) => includeClosed || !isSeriesClosedTable(table))
    .filter((table) => normalizeTrimmedString(getTournamentSeriesRef(table).seriesId) === targetSeriesId)
    .map((table) => ({
      table,
      seats: deps.listPokerPlaySeatsByTable(table.tableId),
      hand: deps.getCurrentPokerPlayHandForTable(table.tableId),
    }));
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
  const normalizedStatus = normalizeTrimmedString(seat?.status).toLowerCase();
  let status = seat?.status || 'empty';
  if (stateSeat && normalizedStatus === 'registered') {
    status = 'active';
  } else if (isSeatPendingCashout(seat)) {
    status = 'leaving_after_hand';
  } else if (isSeatSitOutPending(seat)) {
    status = 'sitting_out_next_hand';
  } else if (isSeatAwayPending(seat)) {
    status = 'away_next_hand';
  } else if (isSeatSittingOut(seat)) {
    status = 'sitting_out';
  } else if (isSeatAway(seat)) {
    status = 'away';
  }
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
    currentBountyOil: Number(seat?.currentBountyOil || 0),
    bountyWonOil: Number(seat?.bountyWonOil || 0),
    bountySettledAt: seat?.bountySettledAt || null,
    payoutSettledAt: seat?.payoutSettledAt || null,
    eliminatedAt: seat?.eliminatedAt || null,
  };
}

function resolveEffectiveSeatStackOil(seat, hand) {
  const seatNumber = normalizeSeatNumber(seat?.seatNumber);
  const seatState = hand?.state?.seatStates?.[String(seatNumber)] || null;
  if (seatState && Number.isFinite(Number(seatState?.stackOil))) {
    return Math.max(0, Number(seatState.stackOil || 0));
  }
  return Math.max(0, Number(seat?.stackOil || 0));
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
  const viewerTimeBankRemainingSeconds = actingSeat === normalizeSeatNumber(viewerSeatNumber)
    ? getSeatTimeBankRemainingSeconds(table, viewerSeatNumber)
    : 0;
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
    timeBankRemainingSeconds: viewerTimeBankRemainingSeconds,
    canUseTimeBank: actingSeat === normalizeSeatNumber(viewerSeatNumber) && viewerTimeBankRemainingSeconds > 0,
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

function sanitizeIntegrityFlagDetailsForViewer(details, { includePrivate = false } = {}) {
  const next = cloneJson(details, {});
  if (!includePrivate && next && typeof next === 'object') {
    delete next.privateNote;
    delete next.privateMessageBodies;
    if (Array.isArray(next.messages)) {
      next.messages = next.messages.map((message) => {
        const sanitized = cloneJson(message, {});
        delete sanitized.body;
        return sanitized;
      });
    }
  }
  return next;
}

function sanitizeIntegrityFlagsForViewer(flags, seats, { includePrivate = false } = {}) {
  const seatMap = getSeatMap(seats);
  return (Array.isArray(flags) ? flags : []).map((flag) => ({
    ...flag,
    seatNumber: flag.seatNumber == null ? null : normalizeSeatNumber(flag.seatNumber),
    seatLabel: flag.seatNumber == null
      ? null
      : formatSeatLabel(flag.seatNumber, seatMap.get(normalizeSeatNumber(flag.seatNumber))?.displayName || ''),
    details: sanitizeIntegrityFlagDetailsForViewer(flag.details, { includePrivate }),
  }));
}

function sanitizeAuditPayloadForViewer(payload, { includePrivate = false } = {}) {
  const next = cloneJson(payload, {});
  if (!includePrivate && next && typeof next === 'object') {
    delete next.body;
  }
  return next;
}

function sanitizeAuditEventsForViewer(events, seats, { includePrivate = false } = {}) {
  const seatMap = getSeatMap(seats);
  return (Array.isArray(events) ? events : []).map((event) => ({
    ...event,
    seatNumber: event.seatNumber == null ? null : normalizeSeatNumber(event.seatNumber),
    seatLabel: event.seatNumber == null
      ? null
      : formatSeatLabel(event.seatNumber, seatMap.get(normalizeSeatNumber(event.seatNumber))?.displayName || ''),
    payload: sanitizeAuditPayloadForViewer(event.payload, { includePrivate }),
  }));
}

function listOpenIntegrityFlagsByTable(deps, tableId, { limit = 100 } = {}) {
  if (typeof deps.listPokerPlayIntegrityFlags !== 'function') return [];
  return deps.listPokerPlayIntegrityFlags({
    tableId,
    status: 'open',
    limit,
  });
}

function buildPokerPlayIntegritySignals(deps, table, seats, hand) {
  const signals = [];
  const activeSeats = getActiveSeatRows(seats);
  const seatsByHouse = new Map();
  for (const seat of activeSeats) {
    const houseId = normalizeTrimmedString(seat?.houseId);
    if (!houseId) continue;
    const bucket = seatsByHouse.get(houseId) || [];
    bucket.push(seat);
    seatsByHouse.set(houseId, bucket);
  }
  for (const [houseId, houseSeats] of seatsByHouse.entries()) {
    if (houseSeats.length < 2) continue;
    const orderedSeats = houseSeats
      .slice()
      .sort((left, right) => normalizeSeatNumber(left?.seatNumber) - normalizeSeatNumber(right?.seatNumber));
    signals.push({
      signalKey: `shared_house_multi_seat:${normalizeTrimmedString(table?.tableId)}:${houseId}`,
      tableId: normalizeTrimmedString(table?.tableId),
      seriesId: normalizeTrimmedString(getTournamentSeriesRef(table).seriesId) || null,
      handId: normalizeTrimmedString(hand?.handId) || null,
      seatNumber: normalizeSeatNumber(orderedSeats[0]?.seatNumber) || null,
      houseId,
      walletSubject: normalizeTrimmedString(orderedSeats[0]?.walletSubject) || null,
      severity: 'high',
      category: 'shared_house_multi_seat',
      summary: `${houseId} controls ${orderedSeats.length} live seats on ${table?.title || table?.tableId || 'this table'}.`,
      details: {
        houseId,
        seatNumbers: orderedSeats.map((seat) => normalizeSeatNumber(seat?.seatNumber)).filter(Boolean),
        walletSubjects: orderedSeats.map((seat) => normalizeTrimmedString(seat?.walletSubject)).filter(Boolean),
        seatCount: orderedSeats.length,
      },
    });
  }

  const openDisputes = typeof deps.listPokerPlayDisputesByTable === 'function'
    ? deps.listPokerPlayDisputesByTable(table.tableId, { status: 'open', limit: 50 })
    : [];
  const uniqueWalletSubjects = new Set(
    openDisputes
      .map((dispute) => normalizeTrimmedString(dispute?.walletSubject))
      .filter(Boolean)
  );
  if (openDisputes.length >= 2 && uniqueWalletSubjects.size >= 2) {
    const orderedDisputes = openDisputes
      .slice()
      .sort((left, right) => String(left?.createdAt || '').localeCompare(String(right?.createdAt || '')));
    const targetDispute = orderedDisputes[orderedDisputes.length - 1] || null;
    const disputeHandId = normalizeTrimmedString(targetDispute?.handId, normalizeTrimmedString(hand?.handId)) || null;
    signals.push({
      signalKey: `multi_dispute_cluster:${normalizeTrimmedString(table?.tableId)}:${disputeHandId || 'table'}`,
      tableId: normalizeTrimmedString(table?.tableId),
      seriesId: normalizeTrimmedString(getTournamentSeriesRef(table).seriesId) || null,
      handId: disputeHandId,
      seatNumber: normalizeSeatNumber(targetDispute?.seatNumber) || null,
      houseId: normalizeTrimmedString(targetDispute?.houseId) || null,
      walletSubject: normalizeTrimmedString(targetDispute?.walletSubject) || null,
      severity: 'medium',
      category: 'multi_dispute_cluster',
      summary: `${openDisputes.length} open hand reviews are stacked on ${table?.title || table?.tableId || 'this table'}.`,
      details: {
        disputeCount: openDisputes.length,
        uniqueWalletCount: uniqueWalletSubjects.size,
        disputeIds: orderedDisputes.map((dispute) => normalizeTrimmedString(dispute?.disputeId)).filter(Boolean),
        handIds: Array.from(new Set(orderedDisputes.map((dispute) => normalizeTrimmedString(dispute?.handId)).filter(Boolean))),
        categories: Array.from(new Set(orderedDisputes.map((dispute) => normalizeTrimmedString(dispute?.category)).filter(Boolean))),
      },
    });
  }

  return signals;
}

function syncPokerPlayIntegrityFlags(deps, table, seats, hand, { processAt } = {}) {
  if (!table || typeof deps.upsertPokerPlayIntegrityFlag !== 'function' || typeof deps.listPokerPlayIntegrityFlags !== 'function') {
    return [];
  }
  const requestAt = toProcessIso(deps, processAt);
  const signals = buildPokerPlayIntegritySignals(deps, table, seats, hand);
  const existingFlags = new Map(
    deps.listPokerPlayIntegrityFlags({ tableId: table.tableId, limit: 200 }).map((flag) => [normalizeTrimmedString(flag?.signalKey), flag])
  );
  const nextFlags = [];
  for (const signal of signals) {
    const existing = existingFlags.get(normalizeTrimmedString(signal.signalKey)) || null;
    if (existing && normalizeTrimmedString(existing?.status).toLowerCase() !== 'open') {
      continue;
    }
    const nextFlag = deps.upsertPokerPlayIntegrityFlag({
      flagId: existing?.flagId || null,
      signalKey: signal.signalKey,
      tableId: signal.tableId,
      seriesId: signal.seriesId,
      handId: signal.handId,
      seatNumber: signal.seatNumber,
      houseId: signal.houseId,
      walletSubject: signal.walletSubject,
      status: 'open',
      severity: signal.severity,
      category: signal.category,
      summary: signal.summary,
      details: signal.details,
      resolutionNote: null,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: requestAt,
      updatedAt: requestAt,
    });
    if (!existing && typeof deps.createPokerPlayAuditEvent === 'function') {
      deps.createPokerPlayAuditEvent({
        tableId: signal.tableId,
        handId: signal.handId,
        seatNumber: signal.seatNumber,
        actorRole: 'system',
        eventKind: 'integrity_flag_opened',
        payload: {
          flagId: nextFlag.flagId,
          category: signal.category,
          severity: signal.severity,
          signalKey: signal.signalKey,
          summary: signal.summary,
        },
        createdAt: requestAt,
      });
    }
    nextFlags.push(nextFlag);
  }
  return nextFlags;
}

function buildPokerPlayReviewSummary(deps, table, seats, hand, walletSubject) {
  const openIntegrityFlags = syncPokerPlayIntegrityFlags(deps, table, seats, hand, {
    processAt: hand?.updatedAt || table?.updatedAt,
  });
  const openDisputes = deps.listPokerPlayDisputesByTable(table.tableId, { status: 'open', limit: 50 });
  const latestAuditEvents = deps.listPokerPlayAuditEventsByTable(table.tableId, { limit: 10 });
  const latestAuditEvent = latestAuditEvents.find((event) => {
    const eventKind = String(event?.eventKind || '');
    return !eventKind.startsWith('integrity_flag_') && eventKind !== 'table_paused';
  })
    || latestAuditEvents[0]
    || null;
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
    integrity: {
      openFlagCount: openIntegrityFlags.length,
      categories: Array.from(new Set(openIntegrityFlags.map((flag) => normalizeTrimmedString(flag?.category)).filter(Boolean))),
    },
    latestAuditEvent: latestAuditEvent
      ? sanitizeAuditEventsForViewer([latestAuditEvent], seats, { includePrivate: false })[0]
      : null,
  };
}

function buildPokerPlayAdminReviewPayload(deps, { tableId, processAt, handId } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  syncPokerPlayIntegrityFlags(deps, synced.table, synced.seats, synced.hand, { processAt: requestAt });
  const openDisputes = deps.listPokerPlayDisputesByTable(synced.table.tableId, { status: 'open', limit: 50 });
  const openIntegrityFlags = listOpenIntegrityFlagsByTable(deps, synced.table.tableId, { limit: 50 });
  const allIntegrityFlags = typeof deps.listPokerPlayIntegrityFlags === 'function'
    ? deps.listPokerPlayIntegrityFlags({ tableId: synced.table.tableId, limit: 100 })
    : [];
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
    integrityFlags: sanitizeIntegrityFlagsForViewer(allIntegrityFlags, synced.seats, { includePrivate: false }),
    integritySummary: {
      openFlagCount: openIntegrityFlags.length,
      resolvedFlagCount: allIntegrityFlags.filter((flag) => normalizeTrimmedString(flag?.status).toLowerCase() === 'resolved').length,
      dismissedFlagCount: allIntegrityFlags.filter((flag) => normalizeTrimmedString(flag?.status).toLowerCase() === 'dismissed').length,
    },
    auditEvents: sanitizeAuditEventsForViewer(auditEvents, synced.seats, { includePrivate: true }),
    processAt: requestAt,
  };
}

function buildPokerPlayIntegrityQueuePayload(deps, { processAt, status = 'open', limit = 100 } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const entries = deps.listPokerPlayTables()
    .map((table) => syncPokerPlayTable(deps, table.tableId, { processAt: requestAt }))
    .filter((entry) => entry?.table);
  for (const entry of entries) {
    syncPokerPlayIntegrityFlags(deps, entry.table, entry.seats, entry.hand, { processAt: requestAt });
  }
  const normalizedStatus = normalizeTrimmedString(status).toLowerCase();
  const filterStatus = normalizedStatus === 'all' ? '' : normalizedStatus;
  const safeLimit = Math.max(1, Math.min(200, normalizeOilAmount(limit, 100)));
  const flags = typeof deps.listPokerPlayIntegrityFlags === 'function'
    ? deps.listPokerPlayIntegrityFlags({
      status: filterStatus,
      limit: safeLimit,
    })
    : [];
  const allFlags = typeof deps.listPokerPlayIntegrityFlags === 'function'
    ? deps.listPokerPlayIntegrityFlags({ limit: 500 })
    : [];
  const tableMap = new Map(entries.map((entry) => [normalizeTrimmedString(entry?.table?.tableId), entry]));
  const items = flags.map((flag) => {
    const entry = tableMap.get(normalizeTrimmedString(flag?.tableId)) || null;
    const seats = entry?.seats || [];
    const table = entry?.table || deps.getPokerPlayTableById(flag.tableId) || null;
    return {
      ...sanitizeIntegrityFlagsForViewer([flag], seats, { includePrivate: false })[0],
      tableTitle: table?.title || flag.tableId,
      tableStatus: table?.status || null,
      seriesTitle: normalizeTrimmedString(getTournamentSeriesRef(table).seriesTitle) || null,
    };
  });
  return {
    summary: {
      openFlagCount: allFlags.filter((flag) => normalizeTrimmedString(flag?.status).toLowerCase() === 'open').length,
      resolvedFlagCount: allFlags.filter((flag) => normalizeTrimmedString(flag?.status).toLowerCase() === 'resolved').length,
      dismissedFlagCount: allFlags.filter((flag) => normalizeTrimmedString(flag?.status).toLowerCase() === 'dismissed').length,
      tableCount: new Set(items.map((item) => normalizeTrimmedString(item?.tableId)).filter(Boolean)).size,
      eventCount: items.length,
    },
    filter: {
      status: filterStatus || 'all',
      limit: safeLimit,
    },
    items,
    processAt: requestAt,
  };
}

function resolvePokerPlayIntegrityFlagStatus(value) {
  const normalized = normalizeTrimmedString(value).toLowerCase();
  return normalized === 'resolved' || normalized === 'dismissed' ? normalized : '';
}

function resolveIntegrityFlag(deps, { flagId, body, processAt } = {}) {
  const requestAt = toProcessIso(deps, processAt || body?.asOf);
  if (typeof deps.getPokerPlayIntegrityFlagById !== 'function' || typeof deps.upsertPokerPlayIntegrityFlag !== 'function') {
    throw createRouteError(500, 'INTEGRITY_UNAVAILABLE', 'Poker integrity flags are not available.');
  }
  const flag = deps.getPokerPlayIntegrityFlagById(flagId);
  if (!flag) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker integrity flag not found.');
  }
  if (normalizeTrimmedString(flag.status).toLowerCase() !== 'open') {
    throw createRouteError(409, 'POKER_PLAY_INTEGRITY_FLAG_CLOSED', 'This poker integrity flag is already closed.');
  }
  const status = resolvePokerPlayIntegrityFlagStatus(body?.status);
  if (!status) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Resolution status must be resolved or dismissed.');
  }
  const resolutionNote = normalizePokerPlayDisputeNote(body?.resolutionNote);
  const resolvedBy = normalizeTrimmedString(body?.resolvedBy, 'operator');
  const updated = deps.upsertPokerPlayIntegrityFlag({
    ...flag,
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
      seatNumber: updated.seatNumber,
      actorRole: 'operator',
      eventKind: status === 'resolved' ? 'integrity_flag_resolved' : 'integrity_flag_dismissed',
      payload: {
        flagId: updated.flagId,
        category: updated.category,
        resolutionNote: resolutionNote || null,
        resolvedBy,
      },
      createdAt: requestAt,
    });
  }
  return {
    flag: updated,
    queue: buildPokerPlayIntegrityQueuePayload(deps, {
      processAt: requestAt,
      status: 'all',
      limit: 100,
    }),
  };
}

function buildPokerPlayAdminSeriesReviewPayload(deps, { seriesId, processAt } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const entries = listTournamentSeriesEntriesBySeriesId(deps, seriesId, {
    processAt: requestAt,
    includeClosed: true,
  });
  if (!entries.length) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker tournament series not found.');
  }
  const normalizedEntries = entries.map((entry) => ({
    ...entry,
    viewerSeat: null,
    summary: computeTableSummary(entry?.table, entry?.seats, entry?.hand, null),
  }));
  const series = buildPokerPlaySeriesSummary(normalizedEntries, '');
  if (!series) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker tournament series not found.');
  }
  const chopProposals = getSeriesChopProposalList(deps, normalizeTrimmedString(series?.seriesId, seriesId), { limit: 20 })
    .map((proposal) => buildPokerPlayChopProposalSummary(proposal, { viewerWalletSubject: '', publicViewer: false }))
    .filter(Boolean);
  const tableReviews = normalizedEntries
    .slice()
    .sort((left, right) => {
      const leftClosed = isSeriesClosedTable(left?.table) ? 1 : 0;
      const rightClosed = isSeriesClosedTable(right?.table) ? 1 : 0;
      if (leftClosed !== rightClosed) return leftClosed - rightClosed;
      const leftLive = left?.summary?.liveHand ? 1 : 0;
      const rightLive = right?.summary?.liveHand ? 1 : 0;
      if (leftLive !== rightLive) return rightLive - leftLive;
      return String(left?.table?.tableId || '').localeCompare(String(right?.table?.tableId || ''));
    })
    .map((entry) => {
      const review = buildPokerPlayAdminReviewPayload(deps, {
        tableId: entry.table.tableId,
        processAt: requestAt,
      });
      return {
        tableId: review?.table?.tableId || entry.table.tableId,
        tableStatus: review?.table?.status || entry?.table?.status || 'unknown',
        review,
      };
    });

  const summary = tableReviews.reduce((acc, entry) => {
    const review = entry?.review || {};
    acc.tableCount += 1;
    if (String(entry?.tableStatus || '').toLowerCase() === 'admin_closed') {
      acc.adminClosedTableCount += 1;
    }
    acc.openDisputeCount += Array.isArray(review?.openDisputes) ? review.openDisputes.length : 0;
    acc.reviewDisputeCount += Array.isArray(review?.disputes) ? review.disputes.length : 0;
    acc.auditEventCount += Array.isArray(review?.auditEvents) ? review.auditEvents.length : 0;
    acc.messageCount += Array.isArray(review?.messages) ? review.messages.length : 0;
    acc.actionCount += Array.isArray(review?.actions) ? review.actions.length : 0;
    return acc;
  }, {
    tableCount: 0,
    adminClosedTableCount: 0,
    openDisputeCount: 0,
    reviewDisputeCount: 0,
    auditEventCount: 0,
    messageCount: 0,
    actionCount: 0,
    chopProposalCount: chopProposals.length,
  });

  return {
    reviewVersion: 'poker-play-admin-series-review-v1',
    processAt: requestAt,
    series,
    summary,
    chopProposals,
    tables: tableReviews,
  };
}

function buildPokerPlayAdminExportPayload(deps, { tableId, processAt, handId } = {}) {
  const review = buildPokerPlayAdminReviewPayload(deps, { tableId, processAt, handId });
  return {
    exportVersion: 'poker-play-admin-export-v1',
    generatedAt: review.processAt,
    tableId: review?.table?.tableId || normalizeTrimmedString(tableId),
    handId: review?.reviewHand?.handId || review?.activeHand?.handId || null,
    summary: {
      tableStatus: review?.table?.status || 'unknown',
      seatCount: Array.isArray(review?.seats) ? review.seats.length : 0,
      openDisputeCount: Array.isArray(review?.openDisputes) ? review.openDisputes.length : 0,
      reviewDisputeCount: Array.isArray(review?.disputes) ? review.disputes.length : 0,
      auditEventCount: Array.isArray(review?.auditEvents) ? review.auditEvents.length : 0,
      messageCount: Array.isArray(review?.messages) ? review.messages.length : 0,
      actionCount: Array.isArray(review?.actions) ? review.actions.length : 0,
    },
    review,
  };
}

function buildPokerPlayAdminSeriesExportPayload(deps, { seriesId, processAt } = {}) {
  const review = buildPokerPlayAdminSeriesReviewPayload(deps, { seriesId, processAt });
  return {
    exportVersion: 'poker-play-admin-series-export-v1',
    generatedAt: review.processAt,
    seriesId: review?.series?.seriesId || normalizeTrimmedString(seriesId),
    summary: {
      ...cloneJson(review?.summary, {}),
      stage: review?.series?.stage || 'unknown',
      prizePoolOil: Number(review?.series?.prizePoolOil || 0),
      paidPlaces: Number(review?.series?.paidPlaces || 0),
    },
    review,
  };
}

function buildLedgerTableTitleMatchers(tableEntries) {
  const out = [];
  for (const entry of Array.isArray(tableEntries) ? tableEntries : []) {
    const table = entry?.table || entry || null;
    const title = normalizeTrimmedString(table?.title).toLowerCase();
    if (!table || !title) continue;
    out.push({ title, table });
  }
  return out.sort((left, right) => right.title.length - left.title.length);
}

function resolveOilLedgerEntryContext(entry, { tableMap, tableTitleMatchers } = {}) {
  const explicitTableId = normalizeTrimmedString(entry?.tableId);
  const explicitSeriesId = normalizeTrimmedString(entry?.seriesId);
  const directTable = explicitTableId ? tableMap.get(explicitTableId) || null : null;
  if (directTable) {
    const ref = getTournamentSeriesRef(directTable);
    return {
      tableId: directTable.tableId,
      tableTitle: directTable.title,
      table: directTable,
      seriesId: explicitSeriesId || ref.seriesId || null,
      seriesTitle: ref.seriesTitle || null,
    };
  }
  const memoLower = normalizeTrimmedString(entry?.memo).toLowerCase();
  const matched = memoLower
    ? (Array.isArray(tableTitleMatchers) ? tableTitleMatchers : []).find((candidate) => memoLower.includes(candidate.title))
    : null;
  const inferredTable = matched?.table || null;
  const ref = getTournamentSeriesRef(inferredTable);
  return {
    tableId: inferredTable?.tableId || explicitTableId || null,
    tableTitle: inferredTable?.title || null,
    table: inferredTable,
    seriesId: explicitSeriesId || ref.seriesId || null,
    seriesTitle: ref.seriesTitle || null,
  };
}

function buildPokerPlayLedgerMismatchCategory(ruleKey, kind = 'amount') {
  return `${normalizeTrimmedString(ruleKey, 'ledger').toLowerCase()}_${normalizeTrimmedString(kind, 'mismatch').toLowerCase()}`;
}

function buildPokerPlayUnexpectedLedgerCategory(entryKind) {
  const kind = normalizeTrimmedString(entryKind).toLowerCase();
  if (POKER_PLAY_REFUND_ENTRY_KINDS.includes(kind)) return 'unexpected_refund_entry';
  if (POKER_PLAY_PAYOUT_ENTRY_KINDS.includes(kind)) return 'unexpected_prize_entry';
  if (kind === 'poker_play_reload') return 'unexpected_reload_entry';
  if (kind === 'poker_play_cashout') return 'unexpected_cashout_entry';
  if (kind === 'poker_play_buy_in' || kind === 'poker_play_waitlist_buy_in') return 'unexpected_buy_in_entry';
  return 'unexpected_ledger_entry';
}

function doesLedgerEntryMatchPlayerStat(entry, context, stat) {
  if (!entry || !stat) return false;
  if (normalizeTrimmedString(entry?.walletSubject) !== normalizeTrimmedString(stat?.walletSubject)) return false;
  const statTableId = normalizeTrimmedString(stat?.tableId);
  const statSeriesId = normalizeTrimmedString(stat?.seriesId);
  const contextTableId = normalizeTrimmedString(context?.tableId);
  const contextSeriesId = normalizeTrimmedString(context?.seriesId);
  if (statTableId && contextTableId && statTableId === contextTableId) return true;
  if (statSeriesId && contextSeriesId && statSeriesId === contextSeriesId) return true;
  const memoLower = normalizeTrimmedString(entry?.memo).toLowerCase();
  const titleLower = normalizeTrimmedString(stat?.title).toLowerCase();
  const seriesTitleLower = normalizeTrimmedString(stat?.seriesTitle).toLowerCase();
  if (titleLower && memoLower.includes(titleLower)) return true;
  if (seriesTitleLower && memoLower.includes(seriesTitleLower)) return true;
  return false;
}

function buildPokerPlayLedgerReconciliationPayload(deps, { processAt, limit = 200 } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const relevantKinds = new Set(POKER_PLAY_RECONCILE_RULES.flatMap((rule) => rule.entryKinds));
  const tableEntries = deps.listPokerPlayTables()
    .map((table) => syncPokerPlayTable(deps, table.tableId, { processAt: requestAt }))
    .filter((entry) => entry?.table);
  const tableMap = new Map(tableEntries.map((entry) => [normalizeTrimmedString(entry?.table?.tableId), entry.table]));
  const tableTitleMatchers = buildLedgerTableTitleMatchers(tableEntries);
  const stats = typeof deps.listPokerPlayPlayerStats === 'function'
    ? deps.listPokerPlayPlayerStats({ limit: 5000 })
    : [];
  const ledgerEntries = typeof deps.listOilLedgerEntries === 'function'
    ? deps.listOilLedgerEntries({ limit: 5000 })
    : [];
  const relevantLedgerEntries = ledgerEntries.filter((entry) => relevantKinds.has(normalizeTrimmedString(entry?.entryKind)));
  const contextsByLedgerId = new Map(relevantLedgerEntries.map((entry) => [
    entry.ledgerEntryId,
    resolveOilLedgerEntryContext(entry, { tableMap, tableTitleMatchers }),
  ]));
  const matchedLedgerEntryIds = new Set();
  const mismatches = [];
  const expectedBalanceByWallet = new Map();
  const actualBalanceByWallet = new Map();

  const addExpectedWalletDelta = (walletSubject, delta) => {
    const key = normalizeTrimmedString(walletSubject);
    if (!key) return;
    expectedBalanceByWallet.set(key, Number(expectedBalanceByWallet.get(key) || 0) + Number(delta || 0));
  };
  const addActualWalletDelta = (walletSubject, delta) => {
    const key = normalizeTrimmedString(walletSubject);
    if (!key) return;
    actualBalanceByWallet.set(key, Number(actualBalanceByWallet.get(key) || 0) + Number(delta || 0));
  };
  const buildMismatchRow = ({
    category,
    ruleKey = '',
    stat = null,
    entry = null,
    context = null,
    expectedAmount = 0,
    actualAmount = 0,
    note = '',
  } = {}) => ({
    mismatchId: `${normalizeTrimmedString(category, 'ledger_mismatch')}:${normalizeTrimmedString(entry?.ledgerEntryId || stat?.resultId || entry?.createdAt || 'row')}:${normalizeTrimmedString(stat?.resultId || '')}`,
    category,
    ruleKey: ruleKey || null,
    walletSubject: normalizeTrimmedString(stat?.walletSubject || entry?.walletSubject) || null,
    houseId: stat?.houseId || entry?.houseId || null,
    tableId: normalizeTrimmedString(stat?.tableId || context?.tableId) || null,
    seriesId: normalizeTrimmedString(stat?.seriesId || context?.seriesId) || null,
    ledgerEntryId: entry?.ledgerEntryId || null,
    entryKind: entry?.entryKind || null,
    expectedAmount: Number(expectedAmount || 0),
    actualAmount: Number(actualAmount || 0),
    createdAt: entry?.createdAt || stat?.updatedAt || null,
    title: stat?.title || context?.tableTitle || null,
    seriesTitle: stat?.seriesTitle || context?.seriesTitle || null,
    note: note || null,
  });

  for (const entry of ledgerEntries) {
    const signedAmount = normalizeTrimmedString(entry?.direction).toLowerCase() === 'debit'
      ? -Number(entry?.amount || 0)
      : Number(entry?.amount || 0);
    addActualWalletDelta(entry?.walletSubject, signedAmount);
    if (!relevantKinds.has(normalizeTrimmedString(entry?.entryKind))) {
      addExpectedWalletDelta(entry?.walletSubject, signedAmount);
    }
  }

  for (const stat of stats) {
    for (const rule of POKER_PLAY_RECONCILE_RULES) {
      const expectedAmount = Number(stat?.[rule.statField] || 0);
      if (expectedAmount <= 0) continue;
      addExpectedWalletDelta(stat.walletSubject, rule.direction === 'debit' ? -expectedAmount : expectedAmount);
      const matches = relevantLedgerEntries.filter((entry) => {
        if (!rule.entryKinds.includes(normalizeTrimmedString(entry?.entryKind))) return false;
        const context = contextsByLedgerId.get(entry.ledgerEntryId) || {};
        return doesLedgerEntryMatchPlayerStat(entry, context, stat);
      });
      if (!matches.length) {
        mismatches.push(buildMismatchRow({
          category: buildPokerPlayLedgerMismatchCategory(rule.key, 'missing_entry'),
          ruleKey: rule.key,
          stat,
          expectedAmount,
          actualAmount: 0,
          note: 'Expected ledger row is missing for this player result.',
        }));
        continue;
      }
      const exactMatches = matches.filter((entry) => (
        normalizeTrimmedString(entry?.direction).toLowerCase() === rule.direction
        && Number(entry?.amount || 0) === expectedAmount
      ));
      if (exactMatches.length === 1) {
        matchedLedgerEntryIds.add(exactMatches[0].ledgerEntryId);
        continue;
      }
      const sameDirectionMatches = matches.filter((entry) => (
        normalizeTrimmedString(entry?.direction).toLowerCase() === rule.direction
      ));
      if (sameDirectionMatches.length === 1) {
        const entry = sameDirectionMatches[0];
        const context = contextsByLedgerId.get(entry.ledgerEntryId) || {};
        matchedLedgerEntryIds.add(entry.ledgerEntryId);
        mismatches.push(buildMismatchRow({
          category: buildPokerPlayLedgerMismatchCategory(rule.key, 'amount_mismatch'),
          ruleKey: rule.key,
          stat,
          entry,
          context,
          expectedAmount,
          actualAmount: Number(entry?.amount || 0),
          note: 'Ledger amount does not match the durable player-result row.',
        }));
        continue;
      }
      if (matches.length > 1) {
        for (const entry of matches) {
          const context = contextsByLedgerId.get(entry.ledgerEntryId) || {};
          mismatches.push(buildMismatchRow({
            category: buildPokerPlayLedgerMismatchCategory(rule.key, 'ambiguous_entry'),
            ruleKey: rule.key,
            stat,
            entry,
            context,
            expectedAmount,
            actualAmount: Number(entry?.amount || 0),
            note: 'Multiple ledger rows match the same player-result event.',
          }));
          matchedLedgerEntryIds.add(entry.ledgerEntryId);
        }
        continue;
      }
      const entry = matches[0];
      const context = contextsByLedgerId.get(entry.ledgerEntryId) || {};
      matchedLedgerEntryIds.add(entry.ledgerEntryId);
      const actualDirection = normalizeTrimmedString(entry?.direction).toLowerCase();
      if (actualDirection !== rule.direction) {
        mismatches.push(buildMismatchRow({
          category: buildPokerPlayLedgerMismatchCategory(rule.key, 'direction_mismatch'),
          ruleKey: rule.key,
          stat,
          entry,
          context,
          expectedAmount,
          actualAmount: Number(entry?.amount || 0),
          note: `Expected ${rule.direction} but saw ${actualDirection || 'unknown'}.`,
        }));
      } else if (Number(entry?.amount || 0) !== expectedAmount) {
        mismatches.push(buildMismatchRow({
          category: buildPokerPlayLedgerMismatchCategory(rule.key, 'amount_mismatch'),
          ruleKey: rule.key,
          stat,
          entry,
          context,
          expectedAmount,
          actualAmount: Number(entry?.amount || 0),
          note: 'Ledger amount does not match the durable player-result row.',
        }));
      }
    }
  }

  for (const entry of relevantLedgerEntries) {
    if (matchedLedgerEntryIds.has(entry.ledgerEntryId)) continue;
    const context = contextsByLedgerId.get(entry.ledgerEntryId) || {};
    mismatches.push(buildMismatchRow({
      category: buildPokerPlayUnexpectedLedgerCategory(entry?.entryKind),
      entry,
      context,
      actualAmount: Number(entry?.amount || 0),
      note: 'Ledger row does not reconcile to any durable player-result event.',
    }));
  }

  const walletSubjects = new Set([
    ...expectedBalanceByWallet.keys(),
    ...actualBalanceByWallet.keys(),
  ]);
  const wallets = Array.from(walletSubjects)
    .sort((left, right) => left.localeCompare(right))
    .map((walletSubject) => {
      const expectedBalance = Number(expectedBalanceByWallet.get(walletSubject) || 0);
      const actualBalance = Number(deps.computeOilBalance(walletSubject)?.balance || 0);
      const walletMismatches = mismatches.filter((item) => normalizeTrimmedString(item?.walletSubject) === walletSubject);
      return {
        walletSubject,
        expectedBalance,
        actualBalance,
        balanceDelta: actualBalance - expectedBalance,
        mismatchCount: walletMismatches.length,
      };
    });
  const safeLimit = Math.max(1, Math.min(500, normalizeOilAmount(limit, 200)));
  const sortedItems = mismatches
    .slice()
    .sort((left, right) => compareIsoDesc(left?.createdAt || '', right?.createdAt || ''))
    .slice(0, safeLimit);
  const byCategory = {};
  for (const item of mismatches) {
    const key = normalizeTrimmedString(item?.category, 'unknown');
    byCategory[key] = Number(byCategory[key] || 0) + 1;
  }
  return {
    processAt: requestAt,
    summary: {
      walletCount: wallets.length,
      mismatchCount: mismatches.length,
      mismatchedWalletCount: wallets.filter((wallet) => Number(wallet?.mismatchCount || 0) > 0 || Number(wallet?.balanceDelta || 0) !== 0).length,
      byCategory,
    },
    wallets,
    items: sortedItems,
  };
}

function buildPokerPlayOpsDashboardPayload(deps, { processAt } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const tableEntries = deps.listPokerPlayTables()
    .map((table) => syncPokerPlayTable(deps, table.tableId, { processAt: requestAt }))
    .filter((entry) => entry?.table);
  const openTables = tableEntries.filter((entry) => !isSeriesClosedTable(entry?.table));
  const liveTables = openTables
    .map((entry) => ({
      ...entry,
      summary: computeTableSummary(entry?.table, entry?.seats, entry?.hand, entry?.viewerSeat || null),
    }))
    .filter((entry) => !isTableAdminClosed(entry?.table))
    .filter((entry) => (
      isTablePaused(entry?.table)
      || !!entry?.summary?.liveHand
      || Number(entry?.summary?.occupancy || 0) > 0
    ));
  const tournamentEntriesBySeriesId = new Map();
  for (const entry of liveTables) {
    if (normalizePokerPlayTableType(entry?.table?.tableType) !== 'tournament') continue;
    const ref = getTournamentSeriesRef(entry.table);
    if (!ref.seriesId) continue;
    if (!tournamentEntriesBySeriesId.has(ref.seriesId)) tournamentEntriesBySeriesId.set(ref.seriesId, []);
    tournamentEntriesBySeriesId.get(ref.seriesId).push(entry);
  }
  const liveSeries = Array.from(tournamentEntriesBySeriesId.values())
    .map((entries) => buildPokerPlaySeriesSummary(entries, ''))
    .filter((series) => series && series.stage !== 'completed' && series.stage !== 'cancelled');
  const pausedTables = liveTables.filter((entry) => isTablePaused(entry?.table));
  const disconnectedSeats = [];
  const openDisputes = [];
  for (const entry of liveTables) {
    for (const seat of Array.isArray(entry?.seats) ? entry.seats : []) {
      if (getSeatPresenceStatus(seat) !== 'disconnected') continue;
      disconnectedSeats.push({
        tableId: entry.table.tableId,
        tableTitle: entry.table.title,
        seatNumber: normalizeSeatNumber(seat?.seatNumber),
        displayName: seat?.displayName || '',
        disconnectedAt: seat?.disconnectedAt || null,
        href: `/poker/play/tables/${encodeURIComponent(entry.table.tableId)}`,
        apiPath: `/api/poker/play/admin/tables/${encodeURIComponent(entry.table.tableId)}/review`,
      });
    }
    const disputes = deps.listPokerPlayDisputesByTable(entry.table.tableId, { status: 'open', limit: 50 });
    for (const dispute of disputes) {
      openDisputes.push({
        disputeId: dispute.disputeId,
        tableId: entry.table.tableId,
        tableTitle: entry.table.title,
        handId: dispute.handId,
        seatNumber: normalizeSeatNumber(dispute?.seatNumber),
        category: dispute.category,
        note: dispute.note,
        href: `/poker/play/tables/${encodeURIComponent(entry.table.tableId)}`,
        apiPath: `/api/poker/play/admin/tables/${encodeURIComponent(entry.table.tableId)}/review`,
      });
    }
  }
  const integrity = buildPokerPlayIntegrityQueuePayload(deps, {
    processAt: requestAt,
    status: 'open',
    limit: 100,
  });
  const recentRefunds = (typeof deps.listOilLedgerEntries === 'function'
    ? deps.listOilLedgerEntries({ entryKinds: POKER_PLAY_REFUND_ENTRY_KINDS, limit: 25 })
    : [])
    .map((entry) => {
      const context = resolveOilLedgerEntryContext(entry, {
        tableMap: new Map(tableEntries.map((item) => [normalizeTrimmedString(item?.table?.tableId), item.table])),
        tableTitleMatchers: buildLedgerTableTitleMatchers(tableEntries),
      });
      return {
        ledgerEntryId: entry.ledgerEntryId,
        walletSubject: entry.walletSubject,
        amount: Number(entry.amount || 0),
        entryKind: entry.entryKind,
        tableId: context.tableId,
        tableTitle: context.tableTitle,
        seriesId: context.seriesId,
        seriesTitle: context.seriesTitle,
        createdAt: entry.createdAt,
        href: context.seriesId
          ? `/poker/play/series/${encodeURIComponent(context.seriesId)}/timeline`
          : (context.tableId ? `/poker/play/tables/${encodeURIComponent(context.tableId)}` : '/poker/play'),
        apiPath: context.seriesId
          ? `/api/poker/play/admin/series/${encodeURIComponent(context.seriesId)}/review`
          : (context.tableId ? `/api/poker/play/admin/tables/${encodeURIComponent(context.tableId)}/review` : '/api/poker/play/admin/ops'),
      };
    });
  const recentPayoutJobs = (typeof deps.listOilLedgerEntries === 'function'
    ? deps.listOilLedgerEntries({ entryKinds: POKER_PLAY_PAYOUT_ENTRY_KINDS, limit: 25 })
    : [])
    .map((entry) => {
      const context = resolveOilLedgerEntryContext(entry, {
        tableMap: new Map(tableEntries.map((item) => [normalizeTrimmedString(item?.table?.tableId), item.table])),
        tableTitleMatchers: buildLedgerTableTitleMatchers(tableEntries),
      });
      return {
        ledgerEntryId: entry.ledgerEntryId,
        walletSubject: entry.walletSubject,
        amount: Number(entry.amount || 0),
        entryKind: entry.entryKind,
        tableId: context.tableId,
        tableTitle: context.tableTitle,
        seriesId: context.seriesId,
        seriesTitle: context.seriesTitle,
        createdAt: entry.createdAt,
        href: context.seriesId
          ? `/poker/play/series/${encodeURIComponent(context.seriesId)}/timeline`
          : (context.tableId ? `/poker/play/tables/${encodeURIComponent(context.tableId)}` : '/poker/play'),
        apiPath: context.seriesId
          ? `/api/poker/play/admin/series/${encodeURIComponent(context.seriesId)}/review`
          : (context.tableId ? `/api/poker/play/admin/tables/${encodeURIComponent(context.tableId)}/review` : '/api/poker/play/admin/ops'),
      };
    });
  const reconciliation = buildPokerPlayLedgerReconciliationPayload(deps, {
    processAt: requestAt,
    limit: 50,
  });
  const firstLiveTable = liveTables[0]?.table || null;
  const firstLiveSeries = liveSeries[0] || null;
  const firstPausedTable = pausedTables[0]?.table || null;
  const firstDisconnected = disconnectedSeats[0] || null;
  const firstDispute = openDisputes[0] || null;
  const firstIntegrity = Array.isArray(integrity?.items) ? integrity.items[0] : null;
  const firstRefund = recentRefunds[0] || null;
  const firstPayout = recentPayoutJobs[0] || null;
  const cards = [
    {
      metricKey: 'live_tables',
      label: 'Live Tables',
      count: liveTables.length,
      href: firstLiveTable ? `/poker/play/tables/${encodeURIComponent(firstLiveTable.tableId)}` : '/poker/play',
      apiPath: firstLiveTable ? `/api/poker/play/admin/tables/${encodeURIComponent(firstLiveTable.tableId)}/review` : '/api/poker/play/tables',
    },
    {
      metricKey: 'live_series',
      label: 'Live Series',
      count: liveSeries.length,
      href: firstLiveSeries ? `/poker/play/series/${encodeURIComponent(firstLiveSeries.seriesId)}/timeline` : '/poker/play',
      apiPath: firstLiveSeries ? `/api/poker/play/admin/series/${encodeURIComponent(firstLiveSeries.seriesId)}/review` : '/api/poker/play/tables',
    },
    {
      metricKey: 'paused_tables',
      label: 'Paused Tables',
      count: pausedTables.length,
      href: firstPausedTable ? `/poker/play/tables/${encodeURIComponent(firstPausedTable.tableId)}` : '/poker/play',
      apiPath: firstPausedTable ? `/api/poker/play/admin/tables/${encodeURIComponent(firstPausedTable.tableId)}/review` : '/api/poker/play/admin/ops',
    },
    {
      metricKey: 'disconnected_seats',
      label: 'Disconnected Seats',
      count: disconnectedSeats.length,
      href: firstDisconnected?.href || '/poker/play',
      apiPath: firstDisconnected?.apiPath || '/api/poker/play/admin/ops',
    },
    {
      metricKey: 'open_disputes',
      label: 'Open Disputes',
      count: openDisputes.length,
      href: firstDispute?.href || '/poker/play',
      apiPath: firstDispute?.apiPath || '/api/poker/play/admin/ops',
    },
    {
      metricKey: 'open_integrity_flags',
      label: 'Open Integrity Flags',
      count: Number(integrity?.summary?.openFlagCount || 0),
      href: '/poker/play/admin/integrity',
      apiPath: '/api/poker/play/admin/integrity',
    },
    {
      metricKey: 'recent_refunds',
      label: 'Recent Refunds',
      count: recentRefunds.length,
      href: firstRefund?.href || '/poker/play',
      apiPath: firstRefund?.apiPath || '/api/poker/play/admin/ops',
    },
    {
      metricKey: 'recent_payout_jobs',
      label: 'Recent Payout Jobs',
      count: recentPayoutJobs.length,
      href: firstPayout?.href || '/poker/play',
      apiPath: firstPayout?.apiPath || '/api/poker/play/admin/ops',
    },
    {
      metricKey: 'reconciliation_mismatches',
      label: 'Reconciliation Mismatches',
      count: Number(reconciliation?.summary?.mismatchCount || 0),
      href: '/poker/play/admin/ops?section=reconciliation',
      apiPath: '/api/poker/play/admin/reconciliation',
    },
  ];
  return {
    processAt: requestAt,
    summary: {
      liveTableCount: liveTables.length,
      liveSeriesCount: liveSeries.length,
      pausedTableCount: pausedTables.length,
      disconnectedSeatCount: disconnectedSeats.length,
      openDisputeCount: openDisputes.length,
      openIntegrityFlagCount: Number(integrity?.summary?.openFlagCount || 0),
      recentRefundCount: recentRefunds.length,
      recentRefundTotalOil: recentRefunds.reduce((sum, item) => sum + Number(item?.amount || 0), 0),
      recentPayoutCount: recentPayoutJobs.length,
      recentPayoutTotalOil: recentPayoutJobs.reduce((sum, item) => sum + Number(item?.amount || 0), 0),
      reconciliationMismatchCount: Number(reconciliation?.summary?.mismatchCount || 0),
    },
    cards,
    sections: {
      liveTables: liveTables.map((entry) => ({
        tableId: entry.table.tableId,
        tableTitle: entry.table.title,
        tableType: entry.table.tableType,
        status: entry.table.status,
        liveHand: !!entry?.summary?.liveHand,
        occupancy: Number(entry?.summary?.occupancy || 0),
        href: `/poker/play/tables/${encodeURIComponent(entry.table.tableId)}`,
        apiPath: `/api/poker/play/admin/tables/${encodeURIComponent(entry.table.tableId)}/review`,
      })),
      liveSeries: liveSeries.map((series) => ({
        seriesId: series.seriesId,
        seriesTitle: series.seriesTitle,
        stage: series.stage,
        tableCount: Number(series.tableCount || 0),
        liveTableCount: Number(series.liveTableCount || 0),
        entryCount: Number(series.entryCount || 0),
        href: `/poker/play/series/${encodeURIComponent(series.seriesId)}/timeline`,
        apiPath: `/api/poker/play/admin/series/${encodeURIComponent(series.seriesId)}/review`,
      })),
      pausedTables: pausedTables.map((entry) => ({
        tableId: entry.table.tableId,
        tableTitle: entry.table.title,
        reason: normalizeTrimmedString(entry?.table?.state?.pausedReason, 'Paused by operator'),
        href: `/poker/play/tables/${encodeURIComponent(entry.table.tableId)}`,
        apiPath: `/api/poker/play/admin/tables/${encodeURIComponent(entry.table.tableId)}/review`,
      })),
      disconnectedSeats,
      openDisputes,
      openIntegrityFlags: Array.isArray(integrity?.items)
        ? integrity.items.map((item) => ({
          flagId: item.flagId,
          tableId: item.tableId,
          tableTitle: item.tableTitle,
          category: item.category,
          summary: item.summary,
          severity: item.severity,
          href: item.tableId ? `/poker/play/tables/${encodeURIComponent(item.tableId)}` : '/poker/play/admin/integrity',
          apiPath: item.tableId ? `/api/poker/play/admin/tables/${encodeURIComponent(item.tableId)}/review` : '/api/poker/play/admin/integrity',
        }))
        : [],
      recentRefunds,
      recentPayoutJobs,
      reconciliation,
    },
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

function getLatestSeatAgentProposal(deps, handId, seatNumber) {
  if (!handId || !seatNumber || typeof deps.listPokerPlayAuditEventsByHand !== 'function') return null;
  const events = deps.listPokerPlayAuditEventsByHand(handId, { limit: 100 });
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (String(event?.eventKind || '') !== 'seat_agent_proposal') continue;
    if (normalizeSeatNumber(event?.seatNumber) !== normalizeSeatNumber(seatNumber)) continue;
    const payload = cloneJson(event?.payload, {});
    return {
      proposalId: String(payload?.proposalId || ''),
      schemaVersion: String(payload?.schemaVersion || 'poker-seat-agent-proposal-v1'),
      source: String(payload?.source || 'worker-seat-agent-v1'),
      actionKind: String(payload?.actionKind || ''),
      amountOil: Number(payload?.amountOil || 0),
      confidence: normalizePokerPlayProposalConfidence(payload?.confidence, 'medium'),
      body: String(payload?.body || ''),
      createdAt: event?.createdAt || null,
      handId: String(payload?.handId || handId || ''),
      tableId: String(payload?.tableId || ''),
      seatNumber: normalizeSeatNumber(event?.seatNumber),
    };
  }
  return null;
}

function resolveSeatAutoActDecision(deps, table, hand, seats, actingSeatNumber) {
  const seatNumber = normalizeSeatNumber(actingSeatNumber);
  if (!table?.tableId || !hand?.handId || !seatNumber) return null;
  const seat = (Array.isArray(seats) ? seats : []).find((entry) => normalizeSeatNumber(entry?.seatNumber) === seatNumber) || null;
  if (!seat?.walletSubject) return null;
  const policy = getPokerPlaySeatAutoActPolicy(table, seat.walletSubject);
  const mode = normalizePokerPlayAutoActMode(policy?.mode, 'off');
  if (mode === 'off' || mode === 'propose_only') return null;
  if (getSeatPresenceStatus(seat) === 'disconnected' && policy?.allowWhileDisconnected !== true) return null;
  if (mode === 'check_fold') {
    const allowed = getSeatAllowedActions({ handState: hand.state, seatNumber });
    if (allowed.includes('check')) {
      return {
        mode,
        seat,
        actionKind: 'check',
        amountOil: 0,
        proposalId: null,
        reason: 'check_fold_policy',
      };
    }
    if (allowed.includes('fold')) {
      return {
        mode,
        seat,
        actionKind: 'fold',
        amountOil: 0,
        proposalId: null,
        reason: 'check_fold_policy',
      };
    }
    return null;
  }
  if (mode !== 'seat_agent_auto') return null;
  const proposal = getLatestSeatAgentProposal(deps, hand.handId, seatNumber);
  if (!proposal?.actionKind) return null;
  try {
    applyPokerPlayActionToHandState({
      table,
      handState: hand.state,
      seatNumber,
      actionKind: proposal.actionKind,
      amountOil: Number(proposal.amountOil || 0),
      nowIso: hand.updatedAt || hand.createdAt || new Date().toISOString(),
    });
  } catch {
    return null;
  }
  return {
    mode,
    seat,
    actionKind: proposal.actionKind,
    amountOil: Number(proposal.amountOil || 0),
    proposalId: normalizeTrimmedString(proposal?.proposalId) || null,
    proposalBody: normalizeTrimmedString(proposal?.body) || '',
    reason: 'seat_agent_proposal',
  };
}

function requirePokerPlayViewerWalletBinding(deps, session, req) {
  const walletBinding = session ? deps.resolvePrimaryWalletSubject(session, req) : null;
  if (!walletBinding?.walletSubject) {
    throw createRouteError(401, 'AUTH_REQUIRED', 'A bound wallet session is required for this poker study route.');
  }
  return walletBinding;
}

function listViewerNotebookEntries(deps, walletSubject, filters = {}) {
  if (!walletSubject || typeof deps.listPokerPlayerNotebookEntriesByWalletSubject !== 'function') return [];
  return deps.listPokerPlayerNotebookEntriesByWalletSubject(walletSubject, filters);
}

function findSeatDisplayNameByWalletSubject(seats, walletSubject) {
  const normalizedWallet = normalizeTrimmedString(walletSubject);
  if (!normalizedWallet) return '';
  const seat = (Array.isArray(seats) ? seats : []).find((candidate) => (
    normalizeTrimmedString(candidate?.walletSubject) === normalizedWallet
  ));
  return normalizeTrimmedString(seat?.displayName);
}

function decorateNotebookEntry(entry, {
  table = null,
  hand = null,
  seats = [],
  seriesId = '',
  seriesTitle = '',
} = {}) {
  if (!entry) return null;
  return {
    ...cloneJson(entry, {}),
    entryKind: normalizePokerPlayNotebookEntryKind(entry?.entryKind, 'notebook'),
    topic: normalizeTrimmedString(entry?.topic),
    body: normalizeTrimmedString(entry?.body),
    tags: normalizePokerPlayNotebookTags(entry?.tags),
    tableTitle: normalizeTrimmedString(table?.title) || null,
    seriesId: normalizeTrimmedString(entry?.seriesId || seriesId) || null,
    seriesTitle: normalizeTrimmedString(seriesTitle) || null,
    handNumber: hand && normalizeTrimmedString(hand?.handId) === normalizeTrimmedString(entry?.handId)
      ? Number(hand?.handNumber || 0)
      : null,
    opponentDisplayName: findSeatDisplayNameByWalletSubject(seats, entry?.opponentWalletSubject) || null,
  };
}

function mapNotebookEntriesByHand(entries) {
  const byHandId = new Map();
  for (const entry of Array.isArray(entries) ? entries : []) {
    const handId = normalizeTrimmedString(entry?.handId);
    if (!handId) continue;
    const items = byHandId.get(handId) || [];
    items.push(entry);
    byHandId.set(handId, items);
  }
  return byHandId;
}

function buildStudySummaryForTable(deps, {
  table,
  seats,
  hand,
  walletSubject,
} = {}) {
  const seriesRef = getTournamentSeriesRef(table);
  const entries = listViewerNotebookEntries(deps, walletSubject, {
    tableId: table?.tableId,
    limit: 25,
  }).map((entry) => decorateNotebookEntry(entry, {
    table,
    hand,
    seats,
    seriesId: seriesRef.seriesId,
    seriesTitle: seriesRef.seriesTitle,
  }));
  const notebookEntries = entries.filter((entry) => entry?.entryKind === 'notebook');
  const opponentNotes = entries.filter((entry) => entry?.entryKind === 'opponent_note');
  const latestOpponentNoteByWallet = new Map();
  for (const entry of opponentNotes) {
    const key = normalizeTrimmedString(entry?.opponentWalletSubject);
    if (!key || latestOpponentNoteByWallet.has(key)) continue;
    latestOpponentNoteByWallet.set(key, entry);
  }
  return {
    handReviewPath: hand?.handId ? `/poker/play/hands/${encodeURIComponent(hand.handId)}/review` : null,
    notebookCount: notebookEntries.length,
    opponentNoteCount: opponentNotes.length,
    recentEntries: notebookEntries.slice(0, 3),
    opponentNotes: Array.from(latestOpponentNoteByWallet.values()).slice(0, 5),
  };
}

function buildBoardPotSlices(hand) {
  const result = hand?.result && typeof hand.result === 'object' ? hand.result : {};
  const state = hand?.state && typeof hand.state === 'object' ? hand.state : {};
  return {
    communityCards: Array.isArray(state.communityCards) ? state.communityCards.slice() : [],
    potOil: Number(state.potOil || 0),
    payouts: Array.isArray(result?.payouts) ? cloneJson(result.payouts, []) : [],
    potSlices: Array.isArray(result?.potSlices) ? cloneJson(result.potSlices, []) : [],
    returnedUncalledBySeat: result?.returnedUncalledBySeat && typeof result.returnedUncalledBySeat === 'object'
      ? cloneJson(result.returnedUncalledBySeat, {})
      : {},
    note: normalizeTrimmedString(result?.note),
  };
}

function sanitizeTimelineEventPayload(payload = {}, { includePrivate = false } = {}) {
  const next = {
    actionKind: typeof payload?.actionKind === 'string' ? payload.actionKind : undefined,
    amountOil: Number(payload?.amountOil || 0) || undefined,
    confidence: typeof payload?.confidence === 'string' ? payload.confidence : undefined,
    status: typeof payload?.status === 'string' ? payload.status : undefined,
    seriesId: typeof payload?.seriesId === 'string' ? payload.seriesId : undefined,
    tableId: typeof payload?.tableId === 'string' ? payload.tableId : undefined,
    handId: typeof payload?.handId === 'string' ? payload.handId : undefined,
    reason: typeof payload?.reason === 'string' ? payload.reason : undefined,
    proposalId: typeof payload?.proposalId === 'string' ? payload.proposalId : undefined,
    proposalKind: typeof payload?.proposalKind === 'string' ? payload.proposalKind : undefined,
    agreementCount: Number(payload?.agreementCount || 0) || undefined,
    allAgreed: payload?.allAgreed === true ? true : undefined,
    payablePoolOil: Number(payload?.payablePoolOil || 0) || undefined,
  };
  if (includePrivate && typeof payload?.body === 'string' && payload.body.trim()) {
    next.body = payload.body.trim();
  }
  return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

function buildPokerPlayHandHistoryPayload(deps, {
  tableId,
  session,
  req,
  processAt,
  publicViewer = false,
  limit = 20,
  status = '',
} = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  const walletBinding = (!publicViewer && session) ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const viewerSeat = walletBinding?.walletSubject
    ? deps.getPokerPlaySeatByWalletSubject(synced.table.tableId, walletBinding.walletSubject)
    : null;
  const statusFilter = normalizeTrimmedString(status).toLowerCase();
  const notebookEntriesByHand = mapNotebookEntriesByHand(
    walletBinding?.walletSubject
      ? listViewerNotebookEntries(deps, walletBinding.walletSubject, {
        tableId: synced.table.tableId,
        limit: 200,
      })
      : []
  );
  const items = (typeof deps.listPokerPlayHandsByTable === 'function'
    ? deps.listPokerPlayHandsByTable(synced.table.tableId, { limit: Math.max(1, Number(limit || 20)) })
    : [])
    .filter((historyHand) => !statusFilter || normalizeTrimmedString(historyHand?.status).toLowerCase() === statusFilter)
    .map((historyHand) => {
      const actions = sanitizeActions(deps.listPokerPlayActionsByHand(historyHand.handId), synced.seats);
      const proposal = viewerSeat ? getLatestSeatAgentProposal(deps, historyHand.handId, viewerSeat.seatNumber) : null;
      const notebookEntries = notebookEntriesByHand.get(normalizeTrimmedString(historyHand.handId)) || [];
      return {
        handId: historyHand.handId,
        handNumber: Number(historyHand.handNumber || 0),
        status: String(historyHand.status || ''),
        street: String(historyHand?.state?.street || historyHand?.state?.phase || 'preflop'),
        startedAt: historyHand.createdAt || null,
        completedAt: historyHand.updatedAt || null,
        communityCards: Array.isArray(historyHand?.state?.communityCards) ? historyHand.state.communityCards.slice() : [],
        result: historyHand.result && Object.keys(historyHand.result).length ? cloneJson(historyHand.result, {}) : null,
        actionCount: actions.length,
        actions: publicViewer ? actions : actions.slice(-12),
        agentProposal: proposal,
        reviewPath: publicViewer ? null : `/poker/play/hands/${encodeURIComponent(historyHand.handId)}/review`,
        notebookEntryCount: notebookEntries.filter((entry) => normalizePokerPlayNotebookEntryKind(entry?.entryKind, 'notebook') === 'notebook').length,
        opponentNoteCount: notebookEntries.filter((entry) => normalizePokerPlayNotebookEntryKind(entry?.entryKind, 'notebook') === 'opponent_note').length,
      };
    });
  return {
    viewerMode: publicViewer ? 'public' : 'player',
    table: {
      tableId: synced.table.tableId,
      title: synced.table.title || 'Live Table',
      tableType: synced.table.tableType,
      status: synced.table.status,
      summary: computeTableSummary(synced.table, synced.seats, synced.hand, viewerSeat),
    },
    viewerSeatNumber: viewerSeat ? normalizeSeatNumber(viewerSeat.seatNumber) : null,
    filter: {
      status: statusFilter || null,
      limit: Math.max(1, Number(limit || 20)),
    },
    items,
    processAt: requestAt,
  };
}

function buildPokerPlaySeriesTimelinePayload(deps, { seriesId, session, req, processAt, publicViewer = false, limit = 200 } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const targetSeriesId = normalizeTrimmedString(seriesId);
  const walletBinding = (!publicViewer && session) ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const viewerHouseId = (!publicViewer && session) ? getSessionHouseId(session) : '';
  const entries = listTournamentSeriesEntriesBySeriesId(deps, targetSeriesId, {
    processAt: requestAt,
    includeClosed: true,
  });
  if (!entries.length) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker tournament series not found.');
  }
  const viewerSeatByTableId = new Map(entries.map((entry) => {
    const seat = (Array.isArray(entry?.seats) ? entry.seats : []).find((candidate) => {
      const candidateWallet = normalizeTrimmedString(candidate?.walletSubject);
      const candidateHouseId = normalizeTrimmedString(candidate?.houseId);
      if (walletBinding?.walletSubject && candidateWallet === normalizeTrimmedString(walletBinding.walletSubject)) {
        return true;
      }
      if (viewerHouseId && candidateHouseId === normalizeTrimmedString(viewerHouseId)) {
        return true;
      }
      return false;
    }) || null;
    return [entry.table.tableId, seat];
  }));
  const normalizedEntries = entries.map((entry) => ({
    ...entry,
    viewerSeat: viewerSeatByTableId.get(entry.table.tableId) || null,
    summary: computeTableSummary(entry?.table, entry?.seats, entry?.hand, viewerSeatByTableId.get(entry.table.tableId) || null),
  }));
  const seatMapByTableId = new Map(normalizedEntries.map((entry) => [entry.table.tableId, getSeatMap(entry.seats)]));
  const series = buildPokerPlaySeriesSummary(normalizedEntries, walletBinding?.walletSubject || '');
  const timeline = normalizedEntries.flatMap((entry) => {
    const seatMap = seatMapByTableId.get(entry.table.tableId) || new Map();
    const viewerSeat = viewerSeatByTableId.get(entry.table.tableId) || null;
    return deps.listPokerPlayAuditEventsByTable(entry.table.tableId, { limit: Math.max(50, Number(limit || 200)) })
      .map((event) => ({
        createdAt: event.createdAt || null,
        tableId: entry.table.tableId,
        tableTitle: entry.table.title || 'Tournament Table',
        handId: event.handId || null,
        eventKind: String(event.eventKind || ''),
        actorRole: String(event.actorRole || 'system'),
        seatNumber: event.seatNumber == null ? null : normalizeSeatNumber(event.seatNumber),
        seatLabel: event.seatNumber == null
          ? 'System'
          : formatSeatLabel(event.seatNumber, seatMap.get(normalizeSeatNumber(event.seatNumber))?.displayName || ''),
        payload: sanitizeTimelineEventPayload(event.payload, {
          includePrivate: !!viewerSeat && normalizeSeatNumber(event.seatNumber) === normalizeSeatNumber(viewerSeat.seatNumber),
        }),
      }));
  })
    .sort((left, right) => {
      const leftAt = Date.parse(String(left?.createdAt || ''));
      const rightAt = Date.parse(String(right?.createdAt || ''));
      if (Number.isFinite(leftAt) && Number.isFinite(rightAt) && leftAt !== rightAt) return leftAt - rightAt;
      return `${String(left?.tableId || '')}:${String(left?.handId || '')}:${String(left?.eventKind || '')}`
        .localeCompare(`${String(right?.tableId || '')}:${String(right?.handId || '')}:${String(right?.eventKind || '')}`);
    })
    .slice(-Math.max(1, Number(limit || 200)));
  return {
    viewerMode: publicViewer ? 'public' : 'player',
    series: series || {
      seriesId: targetSeriesId,
      seriesTitle: targetSeriesId,
    },
    seriesId: targetSeriesId,
    summary: {
      tableCount: normalizedEntries.length,
      eventCount: timeline.length,
    },
    items: timeline,
    processAt: requestAt,
  };
}

function buildPokerPlayResultFinishPosition(deps, item, walletSubject, processAt) {
  if (Number(item?.finishPosition || 0) > 0) {
    return Number(item.finishPosition || 0);
  }
  const seriesId = normalizeTrimmedString(item?.seriesId);
  const tableId = normalizeTrimmedString(item?.tableId);
  if (!seriesId) return null;
  const entries = listTournamentSeriesEntriesBySeriesId(deps, seriesId, {
    processAt,
    includeClosed: true,
  });
  const series = buildPokerPlaySeriesSummary(entries.map((entry) => ({
    ...entry,
    viewerSeat: null,
    summary: computeTableSummary(entry?.table, entry?.seats, entry?.hand, null),
  })), walletSubject);
  const standings = Array.isArray(series?.standings) ? series.standings : [];
  const walletMatch = standings.find((standing) => {
    const standingWallet = normalizeTrimmedString(standing?.walletSubject);
    return standingWallet && standingWallet === normalizeTrimmedString(walletSubject);
  });
  if (walletMatch) {
    return Number(walletMatch.place || 0) || null;
  }
  const seatMatch = standings.find((standing) => (
    normalizeTrimmedString(standing?.tableId) === tableId
      && normalizeSeatNumber(standing?.seatNumber) === normalizeSeatNumber(item?.seatNumber)
  ));
  if (seatMatch) {
    return Number(seatMatch.place || 0) || null;
  }
  const tableMatch = standings.find((standing) => normalizeTrimmedString(standing?.tableId) === tableId);
  return Number(tableMatch?.place || 0) || null;
}

function buildPokerPlayResultItem(item, { currentSeat = null, finishPosition = null } = {}) {
  const buyInOil = Number(item?.buyInOil || 0);
  const reloadOil = Number(item?.reloadOil || 0);
  const investedOil = buyInOil + reloadOil;
  const cashoutOil = Number(item?.cashoutOil || 0);
  const refundOil = Number(item?.refundOil || 0);
  const returnedOil = cashoutOil + refundOil;
  const prizeOil = Number(item?.prizeOil || 0);
  const bountyOil = Number(item?.bountyOil || currentSeat?.bountyWonOil || 0);
  const rakeOil = Number(item?.rakeOil || 0);
  const entryFeeOil = Number(item?.entryFeeOil || 0);
  const stackOil = Number(currentSeat?.stackOil ?? item?.stackOil ?? 0);
  const live = !!currentSeat && !normalizeTrimmedString(item?.closedAt);
  return {
    resultId: item?.resultId || null,
    walletSubject: normalizeTrimmedString(item?.walletSubject) || null,
    houseId: item?.houseId || null,
    tableId: item?.tableId || null,
    tableType: item?.tableType || 'cash',
    title: item?.title || 'Live Table',
    seatNumber: normalizeSeatNumber(currentSeat?.seatNumber || item?.seatNumber),
    displayName: currentSeat?.displayName || item?.displayName || 'Seat',
    buyInOil,
    reloadOil,
    investedOil,
    cashoutOil,
    refundOil,
    returnedOil,
    stackOil,
    prizeOil,
    bountyOil,
    rakeOil,
    entryFeeOil,
    treasuryContributionOil: rakeOil + entryFeeOil,
    netOil: returnedOil + prizeOil + bountyOil - investedOil,
    finishPosition: Number(finishPosition || item?.finishPosition || 0) || null,
    payoutSettledAt: item?.payoutSettledAt || null,
    completedAt: item?.closedAt || item?.payoutSettledAt || null,
    openedAt: item?.openedAt || item?.createdAt || null,
    updatedAt: item?.updatedAt || null,
    status: currentSeat?.status || item?.status || 'open',
    live,
    seriesId: item?.seriesId || null,
    seriesTitle: item?.seriesTitle || null,
  };
}

function buildPokerPlaySeatResultFallback(deps, seat, walletSubject, processAt) {
  const table = deps.getPokerPlayTableById(seat.tableId);
  if (!table) return null;
  const hand = deps.getCurrentPokerPlayHandForTable(seat.tableId);
  const synced = syncPokerPlayTable(deps, seat.tableId, { processAt });
  const viewerSeat = deps.getPokerPlaySeatByWalletSubject(seat.tableId, walletSubject) || seat;
  const seriesRef = getTournamentSeriesRef(synced.table);
  const fallback = {
    resultId: null,
    tableId: synced.table.tableId,
    tableType: synced.table.tableType,
    title: synced.table.title || 'Live Table',
    seatNumber: viewerSeat.seatNumber,
    displayName: viewerSeat.displayName,
    buyInOil: Number(viewerSeat.buyInOil || 0),
    reloadOil: 0,
    cashoutOil: 0,
    refundOil: 0,
    stackOil: Number(viewerSeat.stackOil || 0),
    prizeOil: Number(viewerSeat.prizeOil || 0),
    bountyOil: Number(viewerSeat.bountyWonOil || 0),
    finishPosition: null,
    payoutSettledAt: viewerSeat.payoutSettledAt || null,
    closedAt: null,
    openedAt: viewerSeat.createdAt || null,
    updatedAt: viewerSeat.updatedAt || null,
    status: viewerSeat.status || 'active',
    seriesId: seriesRef.seriesId || null,
    seriesTitle: seriesRef.seriesTitle || null,
  };
  const finishPosition = buildPokerPlayResultFinishPosition(deps, fallback, walletSubject, processAt);
  return buildPokerPlayResultItem(fallback, {
    currentSeat: viewerSeat,
    finishPosition,
  });
}

function sortPokerPlayResultItems(items) {
  return (Array.isArray(items) ? items.slice() : []).sort((left, right) => {
    const leftAt = Date.parse(String(left?.completedAt || left?.payoutSettledAt || left?.updatedAt || left?.openedAt || ''));
    const rightAt = Date.parse(String(right?.completedAt || right?.payoutSettledAt || right?.updatedAt || right?.openedAt || ''));
    if (Number.isFinite(leftAt) && Number.isFinite(rightAt) && leftAt !== rightAt) {
      return rightAt - leftAt;
    }
    return `${String(right?.tableId || '')}:${String(right?.resultId || '')}`
      .localeCompare(`${String(left?.tableId || '')}:${String(left?.resultId || '')}`);
  });
}

function buildPokerPlayMyResultsPayload(deps, { session, req, processAt, limit = 50 } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const walletBinding = deps.resolvePrimaryWalletSubject(session, req);
  if (!walletBinding?.walletSubject) {
    throw createRouteError(409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before reading poker results.');
  }
  const requestedWalletSubject = normalizeTrimmedString(req?.query?.walletSubject);
  if (requestedWalletSubject && requestedWalletSubject !== normalizeTrimmedString(walletBinding.walletSubject)) {
    throw createRouteError(403, 'FORBIDDEN', 'This route only exposes poker results for the bound wallet subject.');
  }
  const effectiveWalletSubject = requestedWalletSubject || walletBinding.walletSubject;
  const safeLimit = Math.max(1, Math.min(200, Number(limit || 50)));
  const currentSeats = typeof deps.listPokerPlaySeatsByWalletSubject === 'function'
    ? deps.listPokerPlaySeatsByWalletSubject(effectiveWalletSubject, { limit: Math.max(50, safeLimit) })
    : [];
  const liveSeats = currentSeats.filter((seat) => {
    const status = normalizeTrimmedString(seat?.status).toLowerCase();
    return isSeatOccupyingTable(seat) && status !== 'closed_refund';
  });
  const currentSeatByTableId = new Map(currentSeats.map((seat) => [normalizeTrimmedString(seat?.tableId), seat]));
  const statRows = typeof deps.listPokerPlayPlayerStatsByWalletSubject === 'function'
    ? deps.listPokerPlayPlayerStatsByWalletSubject(effectiveWalletSubject, { limit: Math.max(50, safeLimit) })
    : [];
  const items = statRows
    .map((stat) => buildPokerPlayResultItem({
      ...stat,
      finishPosition: buildPokerPlayResultFinishPosition(deps, stat, effectiveWalletSubject, requestAt),
    }, {
      currentSeat: currentSeatByTableId.get(normalizeTrimmedString(stat?.tableId)) || null,
    }))
    .filter(Boolean);
  const representedTables = new Set(items.map((item) => normalizeTrimmedString(item?.tableId)).filter(Boolean));
  for (const seat of currentSeats) {
    const tableId = normalizeTrimmedString(seat?.tableId);
    if (!tableId || representedTables.has(tableId)) continue;
    const fallback = buildPokerPlaySeatResultFallback(deps, seat, effectiveWalletSubject, requestAt);
    if (fallback) items.push(fallback);
  }
  const sortedItems = sortPokerPlayResultItems(items).slice(0, safeLimit);
  const liveSeatSummary = liveSeats.reduce((acc, seat) => {
    acc.activeSeatCount += 1;
    acc.stackOil += Number(seat?.stackOil || 0);
    if (normalizePokerPlayTableType(seat?.tableType || deps.getPokerPlayTableById(seat?.tableId)?.tableType) === 'tournament') {
      acc.tournamentSeatCount += 1;
    } else {
      acc.cashSeatCount += 1;
    }
    return acc;
  }, {
    activeSeatCount: 0,
    cashSeatCount: 0,
    tournamentSeatCount: 0,
    stackOil: 0,
  });
  const summary = items.reduce((acc, item) => {
    acc.tableCount += 1;
    acc.buyInOil += Number(item?.buyInOil || 0);
    acc.reloadOil += Number(item?.reloadOil || 0);
    acc.investedOil += Number(item?.investedOil || 0);
    acc.returnedOil += Number(item?.returnedOil || 0);
    acc.prizeOil += Number(item?.prizeOil || 0);
    acc.bountyOil += Number(item?.bountyOil || 0);
    acc.rakeOil += Number(item?.rakeOil || 0);
    acc.entryFeeOil += Number(item?.entryFeeOil || 0);
    acc.treasuryContributionOil += Number(item?.treasuryContributionOil || 0);
    acc.netOil += Number(item?.netOil || 0);
    if (item?.tableType === 'tournament') acc.tournamentCount += 1;
    if (item?.tableType === 'cash') {
      acc.cashCount += 1;
      if (!item?.live) {
        acc.cashNetOil += Number(item?.netOil || 0);
      }
    }
    if (item?.tableType === 'tournament') {
      acc.tournamentEntries += 1;
      acc.tournamentInvestedOil += Number(item?.investedOil || 0);
      acc.tournamentPrizeOil += Number(item?.prizeOil || 0);
      acc.tournamentBountyOil += Number(item?.bountyOil || 0);
      acc.tournamentNetOil += Number(item?.netOil || 0);
      if (Number(item?.prizeOil || 0) > 0) acc.tournamentCashes += 1;
      if (Number(item?.finishPosition || 0) === 1) acc.tournamentWins += 1;
    }
    return acc;
  }, {
    tableCount: 0,
    cashCount: 0,
    tournamentCount: 0,
    buyInOil: 0,
    reloadOil: 0,
    investedOil: 0,
    returnedOil: 0,
    prizeOil: 0,
    bountyOil: 0,
    rakeOil: 0,
    entryFeeOil: 0,
    treasuryContributionOil: 0,
    netOil: 0,
    cashNetOil: 0,
    tournamentEntries: 0,
    tournamentCashes: 0,
    tournamentWins: 0,
    tournamentInvestedOil: 0,
    tournamentPrizeOil: 0,
    tournamentBountyOil: 0,
    tournamentNetOil: 0,
  });
  summary.tournamentRoiPercent = summary.tournamentInvestedOil > 0
    ? Number((((Number(summary.tournamentNetOil || 0)) / Number(summary.tournamentInvestedOil || 0)) * 100).toFixed(2))
    : 0;
  summary.liveSeatCount = liveSeatSummary.activeSeatCount;
  summary.liveStackOil = liveSeatSummary.stackOil;
  return {
    walletSubject: effectiveWalletSubject,
    liveSeatSummary,
    items: sortedItems,
    summary,
    processAt: requestAt,
  };
}

function createPokerPlayRoomTreasuryCredit(deps, {
  table = null,
  seriesId = '',
  amountOil = 0,
  memo = '',
  createdAt,
} = {}) {
  const normalizedAmountOil = Math.max(0, Number(amountOil || 0));
  if (normalizedAmountOil <= 0 || typeof deps.createOilLedgerEntry !== 'function') return null;
  return deps.createOilLedgerEntry({
    walletSubject: POKER_PLAY_ROOM_TREASURY_WALLET_SUBJECT,
    tableId: table?.tableId || null,
    seriesId: normalizeTrimmedString(seriesId || getTournamentSeriesRef(table).seriesId) || null,
    entryKind: 'poker_play_room_treasury_credit',
    direction: 'credit',
    amount: normalizedAmountOil,
    memo: normalizeTrimmedString(memo, table?.title ? `${table.title} treasury credit` : 'Poker room treasury credit'),
    createdAt: createdAt || null,
  });
}

function listClosedPokerPlayResultItems(deps) {
  const stats = typeof deps.listPokerPlayPlayerStats === 'function'
    ? deps.listPokerPlayPlayerStats({ limit: 5000 })
    : [];
  return stats
    .filter((stat) => !!getPokerPlayPlayerStatEffectiveAt(stat))
    .map((stat) => buildPokerPlayResultItem(stat))
    .filter(Boolean);
}

function getPokerPlayResultItemEffectiveAt(item) {
  return normalizeIsoString(item?.completedAt || item?.payoutSettledAt || item?.updatedAt || '');
}

function aggregatePokerPlayResultItemsByWallet(items) {
  const byWallet = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const walletSubject = normalizeTrimmedString(item?.walletSubject);
    if (!walletSubject) continue;
    const existing = byWallet.get(walletSubject) || {
      walletSubject,
      displayName: normalizeTrimmedString(item?.displayName, 'Seat'),
      entryCount: 0,
      cashSessions: 0,
      tournamentEntries: 0,
      investedOil: 0,
      returnedOil: 0,
      prizeOil: 0,
      bountyOil: 0,
      rakeOil: 0,
      entryFeeOil: 0,
      treasuryContributionOil: 0,
      netOil: 0,
      cashNetOil: 0,
      tournamentNetOil: 0,
      tournamentWins: 0,
      tournamentCashes: 0,
      latestAt: '',
    };
    existing.entryCount += 1;
    existing.investedOil += Number(item?.investedOil || 0);
    existing.returnedOil += Number(item?.returnedOil || 0);
    existing.prizeOil += Number(item?.prizeOil || 0);
    existing.bountyOil += Number(item?.bountyOil || 0);
    existing.rakeOil += Number(item?.rakeOil || 0);
    existing.entryFeeOil += Number(item?.entryFeeOil || 0);
    existing.treasuryContributionOil += Number(item?.treasuryContributionOil || 0);
    existing.netOil += Number(item?.netOil || 0);
    const effectiveAt = getPokerPlayResultItemEffectiveAt(item);
    if (!existing.latestAt || compareIsoDesc(effectiveAt, existing.latestAt) < 0) {
      existing.latestAt = effectiveAt;
      existing.displayName = normalizeTrimmedString(item?.displayName, existing.displayName || 'Seat');
    }
    if (normalizePokerPlayTableType(item?.tableType) === 'cash') {
      existing.cashSessions += 1;
      existing.cashNetOil += Number(item?.netOil || 0);
    } else {
      existing.tournamentEntries += 1;
      existing.tournamentNetOil += Number(item?.netOil || 0);
      if (Number(item?.prizeOil || 0) > 0) existing.tournamentCashes += 1;
      if (Number(item?.finishPosition || 0) === 1) existing.tournamentWins += 1;
    }
    byWallet.set(walletSubject, existing);
  }
  return Array.from(byWallet.values())
    .map((item) => ({
      ...item,
      roiPercent: item.investedOil > 0
        ? Number(((Number(item.netOil || 0) / Number(item.investedOil || 0)) * 100).toFixed(2))
        : 0,
    }))
    .sort((left, right) => {
      const netDelta = Number(right?.netOil || 0) - Number(left?.netOil || 0);
      if (netDelta !== 0) return netDelta;
      const winDelta = Number(right?.tournamentWins || 0) - Number(left?.tournamentWins || 0);
      if (winDelta !== 0) return winDelta;
      const cashDelta = Number(right?.cashNetOil || 0) - Number(left?.cashNetOil || 0);
      if (cashDelta !== 0) return cashDelta;
      const bountyDelta = Number(right?.bountyOil || 0) - Number(left?.bountyOil || 0);
      if (bountyDelta !== 0) return bountyDelta;
      return String(left?.walletSubject || '').localeCompare(String(right?.walletSubject || ''));
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      scoreNetOil: Number(item?.netOil || 0),
    }));
}

function buildPokerPlayNativeSeasonSummary(items, seasonWindow, actualTreasuryCreditOil = 0, processAt = '') {
  const walletRows = aggregatePokerPlayResultItemsByWallet(items);
  const uniqueTableIds = new Set();
  let cashSessionCount = 0;
  let tournamentEntryCount = 0;
  let investedOil = 0;
  let returnedOil = 0;
  let prizeOil = 0;
  let bountyOil = 0;
  let cashRakeOil = 0;
  let tournamentFeeOil = 0;
  let netOil = 0;
  for (const item of Array.isArray(items) ? items : []) {
    if (normalizeTrimmedString(item?.tableId)) uniqueTableIds.add(normalizeTrimmedString(item.tableId));
    investedOil += Number(item?.investedOil || 0);
    returnedOil += Number(item?.returnedOil || 0);
    prizeOil += Number(item?.prizeOil || 0);
    bountyOil += Number(item?.bountyOil || 0);
    cashRakeOil += Number(item?.rakeOil || 0);
    tournamentFeeOil += Number(item?.entryFeeOil || 0);
    netOil += Number(item?.netOil || 0);
    if (normalizePokerPlayTableType(item?.tableType) === 'cash') {
      cashSessionCount += 1;
    } else {
      tournamentEntryCount += 1;
    }
  }
  const treasuryContributionOil = cashRakeOil + tournamentFeeOil;
  return {
    seasonId: seasonWindow.seasonId,
    title: seasonWindow.title,
    startAt: seasonWindow.startAt,
    endAt: seasonWindow.endAt,
    status: Date.parse(seasonWindow.endAt) > Date.parse(normalizeIsoString(processAt) || seasonWindow.startAt) ? 'running' : 'completed',
    metricKey: 'net_oil',
    summary: {
      playerCount: walletRows.length,
      tableCount: uniqueTableIds.size,
      entryCount: Array.isArray(items) ? items.length : 0,
      cashSessionCount,
      tournamentEntryCount,
      investedOil,
      returnedOil,
      prizeOil,
      bountyOil,
      totalNetOil: netOil,
      totalCashRakeOil: cashRakeOil,
      totalTournamentFeeOil: tournamentFeeOil,
      totalTreasuryContributionOil: treasuryContributionOil,
      actualTreasuryCreditOil: Number(actualTreasuryCreditOil || 0),
      roomNetDriftOil: Number(actualTreasuryCreditOil || 0) + Number(netOil || 0),
    },
  };
}

function buildPokerPlayNativeSeasonLeaderboardPayload(deps, {
  seasonId,
  processAt,
  limit = 100,
} = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const seasonWindow = buildNativePokerSeasonWindow(seasonId || resolveCurrentNativePokerSeason(requestAt)?.seasonId);
  if (!seasonWindow) {
    throw createRouteError(404, 'NOT_FOUND', 'Native poker season not found.');
  }
  const items = listClosedPokerPlayResultItems(deps).filter((item) => {
    const effectiveAt = getPokerPlayResultItemEffectiveAt(item);
    return !!effectiveAt && effectiveAt >= seasonWindow.startAt && effectiveAt < seasonWindow.endAt;
  });
  const actualTreasuryCreditOil = typeof deps.computeOilLedgerAmountByWalletSubject === 'function'
    ? deps.computeOilLedgerAmountByWalletSubject(POKER_PLAY_ROOM_TREASURY_WALLET_SUBJECT, {
      entryKinds: POKER_PLAY_TREASURY_ENTRY_KINDS,
      direction: 'credit',
      since: seasonWindow.startAt,
      until: seasonWindow.endAt,
    })
    : 0;
  const season = buildPokerPlayNativeSeasonSummary(items, seasonWindow, actualTreasuryCreditOil, requestAt);
  const leaderboardRows = aggregatePokerPlayResultItemsByWallet(items).slice(0, Math.max(1, Math.min(500, Number(limit || 100))));
  return {
    processAt: requestAt,
    season,
    leaderboard: {
      seasonId: season.seasonId,
      sortKey: 'net_oil',
      items: leaderboardRows,
    },
  };
}

function buildPokerPlayAdminTreasuryPayload(deps, { processAt } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const currentSeasonWindow = resolveCurrentNativePokerSeason(requestAt);
  const currentSeasonPayload = buildPokerPlayNativeSeasonLeaderboardPayload(deps, {
    seasonId: currentSeasonWindow?.seasonId,
    processAt: requestAt,
    limit: 500,
  });
  const items = listClosedPokerPlayResultItems(deps).filter((item) => {
    const effectiveAt = getPokerPlayResultItemEffectiveAt(item);
    return !!effectiveAt && effectiveAt >= currentSeasonPayload.season.startAt && effectiveAt < currentSeasonPayload.season.endAt;
  });
  const players = aggregatePokerPlayResultItemsByWallet(items);
  const tablesById = new Map();
  for (const item of items) {
    const tableId = normalizeTrimmedString(item?.tableId);
    if (!tableId) continue;
    const effectiveAt = getPokerPlayResultItemEffectiveAt(item);
    const seasonId = effectiveAt
      ? `native-${new Date(effectiveAt).getUTCFullYear()}-${String(new Date(effectiveAt).getUTCMonth() + 1).padStart(2, '0')}`
      : null;
    const existing = tablesById.get(tableId) || {
      tableId,
      title: normalizeTrimmedString(item?.title, 'Live Table'),
      tableType: normalizePokerPlayTableType(item?.tableType),
      seriesId: normalizeTrimmedString(item?.seriesId) || null,
      seasonId,
      entryCount: 0,
      playerNetOil: 0,
      cashRakeOil: 0,
      tournamentFeeOil: 0,
      treasuryContributionOil: 0,
    };
    existing.entryCount += 1;
    existing.playerNetOil += Number(item?.netOil || 0);
    existing.cashRakeOil += Number(item?.rakeOil || 0);
    existing.tournamentFeeOil += Number(item?.entryFeeOil || 0);
    existing.treasuryContributionOil += Number(item?.treasuryContributionOil || 0);
    tablesById.set(tableId, existing);
  }
  const seasonIds = listNativePokerSeasonIdsFromStats(
    typeof deps.listPokerPlayPlayerStats === 'function'
      ? deps.listPokerPlayPlayerStats({ limit: 5000 })
      : []
  );
  const seasons = seasonIds
    .map((seasonId) => buildPokerPlayNativeSeasonLeaderboardPayload(deps, {
      seasonId,
      processAt: requestAt,
      limit: 500,
    }))
    .map((payload) => ({
      seasonId: payload.season.seasonId,
      title: payload.season.title,
      startAt: payload.season.startAt,
      endAt: payload.season.endAt,
      playerCount: Number(payload.season.summary.playerCount || 0),
      tableCount: Number(payload.season.summary.tableCount || 0),
      cashRakeOil: Number(payload.season.summary.totalCashRakeOil || 0),
      tournamentFeeOil: Number(payload.season.summary.totalTournamentFeeOil || 0),
      expectedTreasuryCreditOil: Number(payload.season.summary.totalTreasuryContributionOil || 0),
      actualTreasuryCreditOil: Number(payload.season.summary.actualTreasuryCreditOil || 0),
      roomNetDriftOil: Number(payload.season.summary.roomNetDriftOil || 0),
    }));
  const cashRakeOil = items.reduce((sum, item) => sum + Number(item?.rakeOil || 0), 0);
  const tournamentFeeOil = items.reduce((sum, item) => sum + Number(item?.entryFeeOil || 0), 0);
  const expectedTreasuryCreditOil = cashRakeOil + tournamentFeeOil;
  const actualTreasuryCreditOil = Number(currentSeasonPayload?.season?.summary?.actualTreasuryCreditOil || 0);
  const treasuryWalletBalanceOil = Number(deps.computeOilBalance(POKER_PLAY_ROOM_TREASURY_WALLET_SUBJECT)?.balance || 0);
  const playerNetOil = items.reduce((sum, item) => sum + Number(item?.netOil || 0), 0);
  return {
    processAt: requestAt,
    treasuryWalletSubject: POKER_PLAY_ROOM_TREASURY_WALLET_SUBJECT,
    summary: {
      statCount: items.length,
      playerCount: players.length,
      tableCount: tablesById.size,
      seasonCount: seasons.length,
      seasonId: currentSeasonPayload.season.seasonId,
      seasonTitle: currentSeasonPayload.season.title,
      cashRakeOil,
      tournamentFeeOil,
      expectedTreasuryCreditOil,
      actualTreasuryCreditOil,
      treasuryWalletBalanceOil,
      playerNetOil,
      roomNetDriftOil: playerNetOil + actualTreasuryCreditOil,
      treasuryDeltaOil: actualTreasuryCreditOil - expectedTreasuryCreditOil,
      treasuryEntryCount: typeof deps.listOilLedgerEntries === 'function'
        ? deps.listOilLedgerEntries({ limit: 5000, entryKinds: POKER_PLAY_TREASURY_ENTRY_KINDS }).length
        : 0,
    },
    players,
    tables: Array.from(tablesById.values()).sort((left, right) => String(left?.tableId || '').localeCompare(String(right?.tableId || ''))),
    seasons,
  };
}

function upsertPokerPlayPlayerStatForSeat(deps, table, seat, {
  processAt,
  reloadOilDelta = 0,
  cashoutOilDelta = 0,
  refundOilDelta = 0,
  prizeOil = null,
  bountyOilDelta = 0,
  rakeOilDelta = 0,
  entryFeeOilDelta = 0,
  finishPosition = null,
  status = '',
  close = false,
  closedAt = null,
  payoutSettledAt = null,
  stackOil = null,
} = {}) {
  if (typeof deps.upsertPokerPlayPlayerStat !== 'function' || typeof deps.getOpenPokerPlayPlayerStatByTableAndWalletSubject !== 'function') {
    return null;
  }
  const walletSubject = normalizeTrimmedString(seat?.walletSubject);
  if (!walletSubject || !table?.tableId) return null;
  const requestAt = toProcessIso(deps, processAt);
  const existing = deps.getOpenPokerPlayPlayerStatByTableAndWalletSubject(table.tableId, walletSubject);
  const seriesRef = getTournamentSeriesRef(table);
  return deps.upsertPokerPlayPlayerStat({
    resultId: existing?.resultId || null,
    walletSubject,
    houseId: seat?.houseId || existing?.houseId || null,
    tableId: table.tableId,
    seriesId: seriesRef.seriesId || existing?.seriesId || null,
    seriesTitle: seriesRef.seriesTitle || existing?.seriesTitle || null,
    tableType: normalizePokerPlayTableType(table?.tableType),
    title: normalizeTrimmedString(table?.title, existing?.title || 'Live Table'),
    seatNumber: normalizeSeatNumber(seat?.seatNumber),
    displayName: normalizeTrimmedString(seat?.displayName, existing?.displayName || 'Seat'),
    buyInOil: existing?.buyInOil != null ? Number(existing.buyInOil || 0) : Number(seat?.buyInOil || 0),
    reloadOil: Number(existing?.reloadOil || 0) + Number(reloadOilDelta || 0),
    cashoutOil: Number(existing?.cashoutOil || 0) + Number(cashoutOilDelta || 0),
    refundOil: Number(existing?.refundOil || 0) + Number(refundOilDelta || 0),
    prizeOil: prizeOil == null ? Math.max(Number(existing?.prizeOil || 0), Number(seat?.prizeOil || 0)) : Number(prizeOil || 0),
    bountyOil: Number(bountyOilDelta || 0) > 0
      ? Number(existing?.bountyOil || 0) + Number(bountyOilDelta || 0)
      : Math.max(Number(existing?.bountyOil || 0), Number(seat?.bountyWonOil || 0)),
    rakeOil: Number(existing?.rakeOil || 0) + Number(rakeOilDelta || 0),
    entryFeeOil: Number(existing?.entryFeeOil || 0) + Number(entryFeeOilDelta || 0),
    stackOil: stackOil == null ? Number(seat?.stackOil || 0) : Number(stackOil || 0),
    finishPosition: finishPosition == null ? (existing?.finishPosition || null) : Number(finishPosition || 0),
    status: status || existing?.status || normalizeTrimmedString(seat?.status, 'open'),
    payoutSettledAt: payoutSettledAt || existing?.payoutSettledAt || seat?.payoutSettledAt || null,
    openedAt: existing?.openedAt || seat?.createdAt || requestAt,
    closedAt: close ? (closedAt || requestAt) : existing?.closedAt || null,
    createdAt: existing?.createdAt || seat?.createdAt || requestAt,
    updatedAt: requestAt,
  });
}

function moveOpenPokerPlayPlayerStatForSeat(deps, {
  sourceTable,
  targetTable,
  seat,
  targetSeatNumber,
  processAt,
} = {}) {
  if (typeof deps.upsertPokerPlayPlayerStat !== 'function' || typeof deps.getOpenPokerPlayPlayerStatByTableAndWalletSubject !== 'function') {
    return null;
  }
  const walletSubject = normalizeTrimmedString(seat?.walletSubject);
  if (!walletSubject || !sourceTable?.tableId || !targetTable?.tableId) return null;
  const requestAt = toProcessIso(deps, processAt);
  const existing = deps.getOpenPokerPlayPlayerStatByTableAndWalletSubject(sourceTable.tableId, walletSubject);
  if (!existing) {
    return upsertPokerPlayPlayerStatForSeat(deps, targetTable, {
      ...seat,
      tableId: targetTable.tableId,
      seatNumber: normalizeSeatNumber(targetSeatNumber),
    }, {
      processAt: requestAt,
      status: 'open',
      stackOil: Number(seat?.stackOil || 0),
    });
  }
  const targetSeriesRef = getTournamentSeriesRef(targetTable);
  return deps.upsertPokerPlayPlayerStat({
    resultId: existing.resultId,
    walletSubject,
    houseId: seat?.houseId || existing?.houseId || null,
    tableId: targetTable.tableId,
    seriesId: targetSeriesRef.seriesId || null,
    seriesTitle: targetSeriesRef.seriesTitle || null,
    tableType: normalizePokerPlayTableType(targetTable?.tableType),
    title: normalizeTrimmedString(targetTable?.title, existing?.title || 'Live Table'),
    seatNumber: normalizeSeatNumber(targetSeatNumber),
    displayName: normalizeTrimmedString(seat?.displayName, existing?.displayName || 'Seat'),
    buyInOil: Number(existing?.buyInOil || seat?.buyInOil || 0),
    reloadOil: Number(existing?.reloadOil || 0),
    cashoutOil: Number(existing?.cashoutOil || 0),
    refundOil: Number(existing?.refundOil || 0),
    prizeOil: Number(existing?.prizeOil || seat?.prizeOil || 0),
    bountyOil: Number(existing?.bountyOil || seat?.bountyWonOil || 0),
    rakeOil: Number(existing?.rakeOil || 0),
    entryFeeOil: Number(existing?.entryFeeOil || 0),
    stackOil: Number(seat?.stackOil || 0),
    finishPosition: existing?.finishPosition == null ? null : Number(existing.finishPosition || 0),
    status: normalizeTrimmedString(existing?.status, 'open'),
    payoutSettledAt: existing?.payoutSettledAt || seat?.payoutSettledAt || null,
    openedAt: existing?.openedAt || existing?.createdAt || seat?.createdAt || requestAt,
    closedAt: existing?.closedAt || null,
    createdAt: existing?.createdAt || seat?.createdAt || requestAt,
    updatedAt: requestAt,
  });
}

function postSeatAgentProposal(deps, { handId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const hand = deps.getPokerPlayHandById(handId);
  if (!hand) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker hand not found.');
  }
  const synced = syncPokerPlayTable(deps, hand.tableId, { processAt: body?.asOf });
  if (isTableAdminClosed(synced.table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
  }
  const currentHand = deps.getPokerPlayHandById(handId) || synced.hand;
  if (!currentHand || currentHand.status !== 'live') {
    throw createRouteError(409, 'POKER_PLAY_HAND_NOT_LIVE', 'This poker hand is no longer live.');
  }
  const { seat } = requireSeatWriter(deps, { table: synced.table, session, req });
  const touchedSeat = touchPokerPlaySeatPresence(deps, synced.table.tableId, seat.walletSubject, requestAt) || seat;
  const actionKind = normalizeTrimmedString(body?.actionKind).toLowerCase();
  const proposalBody = normalizePokerPlayMessageBody(body?.body);
  const confidence = normalizePokerPlayProposalConfidence(body?.confidence, 'medium');
  if (!actionKind) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Proposal actionKind is required.');
  }
  if (!proposalBody) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Proposal body is required.');
  }
  let outcome;
  try {
    outcome = applyPokerPlayActionToHandState({
      table: synced.table,
      handState: currentHand.state,
      seatNumber: touchedSeat.seatNumber,
      actionKind,
      amountOil: Number(body?.amountOil || 0),
      nowIso: requestAt,
    });
  } catch (err) {
    throw createRouteError(
      err?.code === 'POKER_PLAY_RAISE_TOO_SMALL' ? 409 : 400,
      err?.code || 'INVALID_ARGUMENT',
      err?.code === 'POKER_PLAY_RAISE_TOO_SMALL'
        ? 'The requested proposal size is smaller than the current minimum.'
        : 'This proposed action is not legal for the current hand.',
      err?.code === 'POKER_PLAY_RAISE_TOO_SMALL'
        ? { requiredOil: err?.requiredOil }
        : {}
    );
  }
  const proposal = {
    proposalId: `pkprop_${deps.randomHex(10)}`,
    schemaVersion: 'poker-seat-agent-proposal-v1',
    source: normalizeTrimmedString(body?.source, 'worker-seat-agent-v1'),
    tableId: synced.table.tableId,
    handId: currentHand.handId,
    seatNumber: normalizeSeatNumber(touchedSeat.seatNumber),
    actionKind,
    amountOil: Number(outcome?.normalizedAmountOil || outcome?.debitOil || 0),
    confidence,
    body: proposalBody,
    createdAt: requestAt,
  };
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: synced.table.tableId,
      handId: currentHand.handId,
      seatNumber: touchedSeat.seatNumber,
      actorRole: 'agent',
      eventKind: 'seat_agent_proposal',
      payload: proposal,
      createdAt: requestAt,
    });
  }
  const message = deps.createPokerPlayMessage({
    tableId: synced.table.tableId,
    handId: currentHand.handId,
    seatNumber: touchedSeat.seatNumber,
    authorRole: 'agent',
    body: proposalBody,
    createdAt: requestAt,
  });
  return {
    proposal,
    message,
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

function applyTimeBankExtension(deps, {
  table,
  hand,
  seatNumber,
  consumeSeconds,
  requestAt,
  actorRole = 'human',
  actorLabel = 'player',
  auto = false,
} = {}) {
  const normalizedSeatNumber = normalizeSeatNumber(seatNumber);
  const appliedSeconds = Math.max(0, normalizeOilAmount(consumeSeconds, 0));
  if (!table || !hand || !normalizedSeatNumber || appliedSeconds <= 0) {
    return { table, hand };
  }
  const remainingSeconds = getSeatTimeBankRemainingSeconds(table, normalizedSeatNumber);
  const nextRemainingSeconds = Math.max(0, remainingSeconds - appliedSeconds);
  const currentExpiresAtMs = Date.parse(String(hand.actionExpiresAt || hand?.state?.actionExpiresAt || ''));
  const requestAtMs = Date.parse(String(requestAt || ''));
  const baseMs = Number.isFinite(currentExpiresAtMs)
    ? Math.max(currentExpiresAtMs, Number.isFinite(requestAtMs) ? requestAtMs : currentExpiresAtMs)
    : (Number.isFinite(requestAtMs) ? requestAtMs : Date.now());
  const nextExpiresAt = new Date(baseMs + (appliedSeconds * 1000)).toISOString();

  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
    state: setSeatTimeBankRemainingSeconds(table, normalizedSeatNumber, nextRemainingSeconds),
    updatedAt: requestAt,
  });
  const updatedHand = deps.upsertPokerPlayHand({
    ...hand,
    actionExpiresAt: nextExpiresAt,
    state: {
      ...(hand.state && typeof hand.state === 'object' ? hand.state : {}),
      actionExpiresAt: nextExpiresAt,
      timeBankConsumedBySeat: {
        ...((hand?.state?.timeBankConsumedBySeat && typeof hand.state.timeBankConsumedBySeat === 'object')
          ? hand.state.timeBankConsumedBySeat
          : {}),
        [String(normalizedSeatNumber)]: normalizeOilAmount(
          hand?.state?.timeBankConsumedBySeat?.[String(normalizedSeatNumber)],
          0
        ) + appliedSeconds,
      },
      lastTimeBankSeatNumber: normalizedSeatNumber,
      lastTimeBankAppliedSeconds: appliedSeconds,
      lastTimeBankAppliedAt: requestAt,
      lastTimeBankAuto: auto === true,
    },
    updatedAt: requestAt,
  });

  deps.createPokerPlayMessage({
    tableId: updatedTable.tableId,
    handId: updatedHand.handId,
    seatNumber: null,
    authorRole: 'system',
    body: auto
      ? `${formatSeatLabel(normalizedSeatNumber)} automatically consumes ${appliedSeconds}s of time bank before timeout action.`
      : `${formatSeatLabel(normalizedSeatNumber)} uses ${appliedSeconds}s of time bank.`,
    createdAt: requestAt,
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: updatedTable.tableId,
      handId: updatedHand.handId,
      seatNumber: normalizedSeatNumber,
      actorRole: normalizePokerPlayAuditActorRole(actorRole, actorRole),
      eventKind: auto ? 'time_bank_auto_used' : 'time_bank_used',
      payload: {
        actorLabel: normalizeTrimmedString(actorLabel, auto ? 'system' : 'player'),
        appliedSeconds,
        remainingSeconds: nextRemainingSeconds,
        actionExpiresAt: nextExpiresAt,
      },
      createdAt: requestAt,
    });
  }
  return {
    table: updatedTable,
    hand: updatedHand,
  };
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
    const cashoutTerms = resolveCashSessionCashoutTerms(deps, table, seat, Number(seat.stackOil || 0));
    const returnedOil = Number(cashoutTerms.netReturnOil || 0);
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
    if (Number(cashoutTerms.rakeOil || 0) > 0) {
      createPokerPlayRoomTreasuryCredit(deps, {
        table,
        amountOil: cashoutTerms.rakeOil,
        memo: `${table.title} cash rake`,
        createdAt: atIso,
      });
    }
    upsertPokerPlayPlayerStatForSeat(deps, table, seat, {
      processAt: atIso,
      cashoutOilDelta: returnedOil,
      rakeOilDelta: Number(cashoutTerms.rakeOil || 0),
      status: 'cashed_out',
      close: true,
      stackOil: 0,
    });
    deps.createPokerPlayMessage({
      tableId: table.tableId,
      handId: hand?.handId || null,
      seatNumber: null,
      authorRole: 'system',
      body: `${formatSeatLabel(seat.seatNumber, seat.displayName)} cashes out ${returnedOil} OIL${Number(cashoutTerms.rakeOil || 0) > 0 ? ` after ${Number(cashoutTerms.rakeOil || 0)} OIL rake` : ''} and leaves after hand ${Number(hand?.handNumber || 0)}.`,
      createdAt: atIso,
    });
    deps.deletePokerPlaySeat(seat.tableId, seat.seatNumber);
    table = deps.upsertPokerPlayTable({
      ...table,
      state: removeSeatTimeBankState(table, seat.seatNumber),
      updatedAt: atIso,
    });
  }
  return deps.listPokerPlaySeatsByTable(table.tableId);
}

function startNewTableHand(deps, table, seats, previousHand, atIso) {
  let nextSeats = Array.isArray(seats) ? seats.slice() : [];
  for (const seat of nextSeats) {
    if (normalizeTrimmedString(seat?.status).toLowerCase() !== 'registered') continue;
    const updatedSeat = deps.upsertPokerPlaySeat({
      ...seat,
      status: 'active',
      updatedAt: atIso,
    });
    upsertPokerPlayPlayerStatForSeat(deps, table, updatedSeat, {
      processAt: atIso,
      status: 'open',
    });
  }
  nextSeats = deps.listPokerPlaySeatsByTable(table.tableId);
  nextSeats = applyDeferredCashLifecycleSeats(deps, table, nextSeats, atIso);
  const previousHandNumber = previousHand
    ? Number(previousHand.handNumber || 0)
    : Math.max(
      0,
      Number(table?.state?.activeHandNumber || 0),
      Number(table?.state?.lastSettledHandNumber || 0)
    );
  const nextHandNumber = Math.max(1, previousHandNumber + 1);
  let nextTable = table;
  if (normalizePokerPlayTableType(table?.tableType) === 'tournament') {
    const nextBlindAdjustment = Math.max(
      0,
      normalizeOilAmount(table?.state?.directorBlindLevelAdjustment, 0)
        + normalizeOilAmount(table?.state?.directorBlindAdvancesPending, 0)
    );
    const tournamentState = {
      ...(table?.state && typeof table.state === 'object' ? table.state : {}),
      currentBlindLevel: 0,
      handsPerBlindLevel: 0,
      directorBlindLevelAdjustment: nextBlindAdjustment,
      directorBlindAdvancesPending: 0,
    };
    const blindProgress = resolveTournamentBlindProgress({
      ...table,
      state: tournamentState,
    }, nextHandNumber);
    const nextTournamentState = {
      ...tournamentState,
      currentBlindLevel: blindProgress.blindLevel,
      handsPerBlindLevel: blindProgress.handsPerBlindLevel,
    };
    nextTable = deps.upsertPokerPlayTable({
      ...table,
      smallBlindOil: blindProgress.smallBlindOil,
      bigBlindOil: blindProgress.bigBlindOil,
      state: nextTournamentState,
      updatedAt: atIso,
    });
  }
  const nextState = createInitialPokerPlayHandState({
    table: nextTable,
    seats: getActiveSeatRows(nextSeats),
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

function collectTournamentKnockoutWinnerSeatNumbers(hand, bustedSeatNumber, fallbackSeats = []) {
  const targetSeatNumber = normalizeSeatNumber(bustedSeatNumber);
  const winners = new Set();
  const potSlices = Array.isArray(hand?.result?.potSlices) ? hand.result.potSlices : [];
  for (const slice of potSlices) {
    const eligibleSeatNumbers = normalizeSeatNumberList(slice?.eligibleSeatNumbers || []);
    if (!eligibleSeatNumbers.includes(targetSeatNumber)) continue;
    for (const winningSeatNumber of normalizeSeatNumberList(slice?.winningSeatNumbers || [])) {
      if (winningSeatNumber && winningSeatNumber !== targetSeatNumber) {
        winners.add(winningSeatNumber);
      }
    }
  }
  if (!winners.size) {
    for (const winningSeatNumber of normalizeSeatNumberList(hand?.result?.winningSeatNumbers || [])) {
      if (winningSeatNumber && winningSeatNumber !== targetSeatNumber) {
        winners.add(winningSeatNumber);
      }
    }
  }
  if (!winners.size) {
    for (const seat of Array.isArray(fallbackSeats) ? fallbackSeats : []) {
      const seatNumber = normalizeSeatNumber(seat?.seatNumber);
      if (!seatNumber || seatNumber === targetSeatNumber) continue;
      if (Number(seat?.stackOil || 0) > 0) {
        winners.add(seatNumber);
      }
    }
  }
  return normalizeSeatNumberList(Array.from(winners));
}

function settleTournamentKnockoutBounties(deps, table, previousSeats, currentSeats, hand, atIso) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    return Array.isArray(currentSeats) ? currentSeats : [];
  }
  const bountyModel = getTournamentBountyModel(table);
  if (bountyModel === 'none') {
    return Array.isArray(currentSeats) ? currentSeats : [];
  }
  const previousBySeat = new Map((Array.isArray(previousSeats) ? previousSeats : [])
    .map((seat) => [normalizeSeatNumber(seat?.seatNumber), seat]));
  const currentBySeat = new Map((Array.isArray(currentSeats) ? currentSeats : [])
    .map((seat) => [normalizeSeatNumber(seat?.seatNumber), seat]));
  const newlyBusted = (Array.isArray(currentSeats) ? currentSeats : [])
    .map((seat) => ({
      current: seat,
      previous: previousBySeat.get(normalizeSeatNumber(seat?.seatNumber)) || seat,
    }))
    .filter(({ current, previous }) => (
      !isTournamentVoidedSeat(current)
      && Number(previous?.stackOil || 0) > 0
      && Number(current?.stackOil || 0) <= 0
      && normalizeTrimmedString(current?.status).toLowerCase() === 'busted'
    ))
    .sort((left, right) => {
      const stackDelta = Number(left?.previous?.stackOil || 0) - Number(right?.previous?.stackOil || 0);
      if (stackDelta !== 0) return stackDelta;
      return normalizeSeatNumber(left?.current?.seatNumber) - normalizeSeatNumber(right?.current?.seatNumber);
    });
  if (!newlyBusted.length) {
    return Array.isArray(currentSeats) ? currentSeats : [];
  }
  for (const bustedEntry of newlyBusted) {
    const bustedSeatNumber = normalizeSeatNumber(bustedEntry?.current?.seatNumber);
    const bustedSeat = currentBySeat.get(bustedSeatNumber) || bustedEntry.current;
    const startingBountyOil = computeTournamentInitialBountyOil(
      bustedEntry?.previous?.buyInOil ?? bustedSeat?.buyInOil,
      bountyModel,
      getTournamentEntryFeeOil(table)
    );
    const currentBountyOil = Math.max(0, Number(
      bustedSeat?.currentBountyOil != null
        ? bustedSeat.currentBountyOil
        : (bustedEntry?.previous?.currentBountyOil != null
          ? bustedEntry.previous.currentBountyOil
          : startingBountyOil)
    ));
    const winnerSeatNumbers = collectTournamentKnockoutWinnerSeatNumbers(hand, bustedSeatNumber, Array.from(currentBySeat.values()));
    if (currentBountyOil > 0 && winnerSeatNumbers.length) {
      const buttonSeat = normalizeSeatNumber(hand?.state?.buttonSeat || table?.state?.lastButtonSeat);
      const { cashPoolOil, carryPoolOil } = resolveTournamentBountySplit(bountyModel, currentBountyOil);
      const cashDistribution = distributeTournamentBountyOil(cashPoolOil, winnerSeatNumbers, buttonSeat);
      const carryDistribution = distributeTournamentBountyOil(carryPoolOil, winnerSeatNumbers, buttonSeat);
      const winnerSummaries = [];
      for (const winnerSeatNumber of winnerSeatNumbers) {
        const winnerSeat = currentBySeat.get(winnerSeatNumber);
        if (!winnerSeat) continue;
        const cashAwardOil = Number(cashDistribution?.payoutBySeat?.[String(winnerSeatNumber)] || 0);
        const carryAwardOil = Number(carryDistribution?.payoutBySeat?.[String(winnerSeatNumber)] || 0);
        if (cashAwardOil > 0) {
          deps.createOilLedgerEntry({
            walletSubject: winnerSeat.walletSubject,
            houseId: winnerSeat.houseId || null,
            verificationId: winnerSeat.streamflowVerificationId || null,
            tableId: table.tableId,
            seriesId: getTournamentSeriesRef(table).seriesId || null,
            entryKind: 'poker_play_tournament_bounty',
            direction: 'credit',
            amount: cashAwardOil,
            memo: `${table.title} knockout bounty`,
          });
        }
        const nextWinnerSeat = deps.upsertPokerPlaySeat({
          ...winnerSeat,
          currentBountyOil: Number(winnerSeat?.currentBountyOil || 0) + carryAwardOil,
          bountyWonOil: Number(winnerSeat?.bountyWonOil || 0) + cashAwardOil,
          updatedAt: atIso,
        });
        currentBySeat.set(winnerSeatNumber, nextWinnerSeat);
        upsertPokerPlayPlayerStatForSeat(deps, table, nextWinnerSeat, {
          processAt: atIso,
          bountyOilDelta: cashAwardOil,
          status: nextWinnerSeat.status || 'open',
          stackOil: nextWinnerSeat.stackOil,
        });
        winnerSummaries.push({
          seatNumber: winnerSeatNumber,
          cashAwardOil,
          carryAwardOil,
        });
      }
      if (typeof deps.createPokerPlayAuditEvent === 'function') {
        deps.createPokerPlayAuditEvent({
          tableId: table.tableId,
          handId: hand?.handId || null,
          seatNumber: bustedSeatNumber,
          actorRole: 'system',
          eventKind: 'tournament_bounty_awarded',
          payload: {
            bountyModel,
            bustedSeatNumber,
            bustedWalletSubject: bustedSeat?.walletSubject || '',
            totalBountyOil: currentBountyOil,
            winners: winnerSummaries,
          },
          createdAt: atIso,
        });
      }
      if (typeof deps.createPokerPlayMessage === 'function' && winnerSummaries.length) {
        deps.createPokerPlayMessage({
          tableId: table.tableId,
          handId: hand?.handId || null,
          seatNumber: null,
          authorRole: 'system',
          body: `${formatSeatLabel(bustedSeatNumber, bustedSeat?.displayName)} bounty settled for ${currentBountyOil} OIL.`,
          createdAt: atIso,
        });
      }
    }
    const nextBustedSeat = deps.upsertPokerPlaySeat({
      ...bustedSeat,
      currentBountyOil: 0,
      bountySettledAt: currentBountyOil > 0 ? (bustedSeat?.bountySettledAt || atIso) : (bustedSeat?.bountySettledAt || null),
      updatedAt: atIso,
    });
    currentBySeat.set(bustedSeatNumber, nextBustedSeat);
  }
  return Array.from(currentBySeat.values()).sort((left, right) => normalizeSeatNumber(left?.seatNumber) - normalizeSeatNumber(right?.seatNumber));
}

function hasPendingTournamentRebuyOpportunity(entries) {
  const items = Array.isArray(entries) ? entries : [];
  const leadEntry = items.find((entry) => entry?.table) || null;
  const leadTable = leadEntry?.table || null;
  if (!leadTable || getTournamentRebuyLimit(leadTable) <= 0) return false;
  const rebuyWindow = resolveTournamentRebuyWindow(leadTable, leadEntry?.hand || null);
  if (!rebuyWindow.open) return false;
  const activeWallets = new Set(
    items.flatMap((entry) => getActiveSeatRows(entry?.seats).map((seat) => normalizeTrimmedString(seat?.walletSubject))).filter(Boolean)
  );
  const seenWallets = new Set();
  for (const seat of getTournamentAllSeats(items)) {
    const walletSubject = normalizeTrimmedString(seat?.walletSubject);
    if (!walletSubject || seenWallets.has(walletSubject)) continue;
    seenWallets.add(walletSubject);
    if (activeWallets.has(walletSubject)) continue;
    if (getTournamentSeriesWalletEntryCount(items, walletSubject) <= 0) continue;
    if (getTournamentSeriesWalletRebuyCount(items, walletSubject) >= getTournamentRebuyLimit(leadTable)) continue;
    return true;
  }
  return false;
}

function buildMultiFlightBaggedStandings(seats, advancers, {
  tableId,
  atIso,
  mergeSeriesId,
  mergeTableId,
} = {}) {
  const advancerBySeat = new Map(
    (Array.isArray(advancers) ? advancers : [])
      .map((item) => [normalizeSeatNumber(item?.seat?.seatNumber), item])
      .filter(([seatNumber]) => seatNumber > 0)
  );
  const orderedAdvancers = (Array.isArray(advancers) ? advancers : [])
    .slice()
    .sort((left, right) => {
      const stackDelta = Number(right?.carriedStackOil || right?.seat?.stackOil || 0) - Number(left?.carriedStackOil || left?.seat?.stackOil || 0);
      if (stackDelta !== 0) return stackDelta;
      return normalizeSeatNumber(left?.seat?.seatNumber) - normalizeSeatNumber(right?.seat?.seatNumber);
    });
  const bustedSeats = sortSeatsByTournamentElimination(
    (Array.isArray(seats) ? seats : []).filter((seat) => !advancerBySeat.has(normalizeSeatNumber(seat?.seatNumber)))
  );
  const items = [];
  for (const advancer of orderedAdvancers) {
    const seat = advancer?.seat || null;
    items.push({
      place: items.length + 1,
      tableId: tableId || seat?.tableId || null,
      seatNumber: normalizeSeatNumber(seat?.seatNumber),
      displayName: seat?.displayName || formatSeatLabel(seat?.seatNumber),
      houseId: seat?.houseId || null,
      walletSubject: seat?.walletSubject || '',
      status: 'advanced',
      prizeOil: 0,
      bountyWonOil: Number(seat?.bountyWonOil || 0),
      totalWonOil: Number(seat?.bountyWonOil || 0),
      eliminatedAt: null,
      payoutSettledAt: atIso,
      carriedStackOil: Number(advancer?.carriedStackOil || seat?.stackOil || 0),
      advancedAt: atIso,
      advancedToSeriesId: mergeSeriesId || null,
      advancedToTableId: mergeTableId || null,
    });
  }
  for (const seat of bustedSeats) {
    items.push({
      place: items.length + 1,
      tableId: tableId || seat?.tableId || null,
      seatNumber: normalizeSeatNumber(seat?.seatNumber),
      displayName: seat?.displayName || formatSeatLabel(seat?.seatNumber),
      houseId: seat?.houseId || null,
      walletSubject: seat?.walletSubject || '',
      status: seat?.status || 'busted',
      prizeOil: Number(seat?.prizeOil || 0),
      bountyWonOil: Number(seat?.bountyWonOil || 0),
      totalWonOil: Number(seat?.prizeOil || 0) + Number(seat?.bountyWonOil || 0),
      eliminatedAt: seat?.eliminatedAt || null,
      payoutSettledAt: seat?.payoutSettledAt || null,
      carriedStackOil: 0,
      advancedAt: null,
      advancedToSeriesId: null,
      advancedToTableId: null,
    });
  }
  return items;
}

function upsertMultiFlightImportIntoTargetTable(deps, table, record, atIso) {
  if (!table?.tableId) return table;
  const normalizedRecord = normalizeTournamentMultiFlightImportRecord({
    ...record,
    importedAt: atIso,
  });
  if (!normalizedRecord) return table;
  const nextImports = {
    ...getTournamentMultiFlightImportMap(table),
    [normalizedRecord.sourceSeriesId]: normalizedRecord,
  };
  return deps.upsertPokerPlayTable({
    ...table,
    state: {
      ...(table.state && typeof table.state === 'object' ? table.state : {}),
      multiFlightImportsBySourceSeriesId: nextImports,
    },
    updatedAt: atIso,
  });
}

function registerMultiFlightAdvancerIntoMergeSeries(deps, sourceTable, sourceSeat, {
  carriedStackOil,
  asOf,
} = {}) {
  const targetSeriesId = getTournamentMultiFlightMergeSeriesId(sourceTable);
  if (!targetSeriesId) {
    return null;
  }
  const requestAt = toProcessIso(deps, asOf);
  const entries = listTournamentSeriesEntriesDirectBySeriesId(deps, targetSeriesId, {
    includeClosed: false,
  });
  if (!entries.length) {
    return null;
  }
  const walletSubject = normalizeTrimmedString(sourceSeat?.walletSubject);
  if (!walletSubject) {
    return null;
  }
  const existingEntry = entries.find((entry) => (
    normalizeTrimmedString(entry?.viewerSeat?.walletSubject) === walletSubject
      || !!(Array.isArray(entry?.seats) ? entry.seats : []).find((seat) => normalizeTrimmedString(seat?.walletSubject) === walletSubject && !isTournamentVoidedSeat(seat))
  ));
  if (existingEntry?.table) {
    const existingSeat = (Array.isArray(existingEntry?.seats) ? existingEntry.seats : [])
      .find((seat) => normalizeTrimmedString(seat?.walletSubject) === walletSubject && !isTournamentVoidedSeat(seat)) || null;
    return {
      table: existingEntry.table,
      seat: existingSeat,
      carriedStackOil: Math.max(0, Number(existingSeat?.stackOil || carriedStackOil || 0)),
      created: false,
    };
  }
  const candidates = entries
    .map((entry) => ({
      ...entry,
      summary: computeTableSummary(entry.table, entry.seats, entry.hand, null),
    }))
    .filter((entry) => Number(entry?.summary?.openSeatCount || 0) > 0)
    .filter((entry) => !entry?.hand || entry.hand.status !== 'live' || resolveTournamentLateRegistration(entry.table, entry.hand).open)
    .sort((left, right) => {
      const scheduledDelta = Number(!!left?.summary?.scheduledStartPending) - Number(!!right?.summary?.scheduledStartPending);
      if (scheduledDelta !== 0) return scheduledDelta;
      const occupancyDelta = Number(right?.summary?.occupancy || 0) - Number(left?.summary?.occupancy || 0);
      if (occupancyDelta !== 0) return occupancyDelta;
      return String(left?.table?.tableId || '').localeCompare(String(right?.table?.tableId || ''));
    });
  const candidate = candidates[0] || null;
  if (!candidate?.table) {
    return null;
  }
  const targetTable = maybeClearReusableTournamentSeats(deps, candidate.table);
  const synced = syncPokerPlayTable(deps, targetTable.tableId, { processAt: requestAt });
  const seatNumber = findNextOpenSeatNumber(synced.table, synced.seats);
  if (!seatNumber) {
    return null;
  }
  const nextTableState = incrementTournamentEntryState(synced.table, walletSubject, {
    reentry: false,
    rebuy: false,
  });
  const seatStatus = synced.hand && synced.hand.status === 'live' ? 'registered' : 'active';
  const targetSeat = deps.upsertPokerPlaySeat({
    tableId: synced.table.tableId,
    seatNumber,
    portalSessionId: sourceSeat?.portalSessionId || null,
    houseId: sourceSeat?.houseId || null,
    walletSubject,
    displayName: normalizePokerPlayDisplayName(sourceSeat?.displayName, walletSubject.slice(0, 8)),
    status: seatStatus,
    buyInOil: Math.max(0, Number(sourceSeat?.buyInOil || synced.table.buyInOil || 0)),
    stackOil: Math.max(0, Number(carriedStackOil || sourceSeat?.stackOil || 0)),
    streamflowVerificationId: sourceSeat?.streamflowVerificationId || null,
    lastSeenAt: requestAt,
    disconnectedAt: null,
    eliminatedAt: null,
    prizeOil: 0,
    currentBountyOil: Math.max(0, Number(sourceSeat?.currentBountyOil || 0)),
    bountyWonOil: Math.max(0, Number(sourceSeat?.bountyWonOil || 0)),
    bountySettledAt: null,
    payoutSettledAt: null,
    updatedAt: requestAt,
  });
  const updatedTable = deps.upsertPokerPlayTable({
    ...synced.table,
    state: setSeatTimeBankRemainingSeconds(
      {
        ...synced.table,
        state: nextTableState,
      },
      seatNumber,
      getSeatTimeBankRemainingSeconds(synced.table, seatNumber)
    ),
    updatedAt: requestAt,
  });
  upsertPokerPlayPlayerStatForSeat(deps, updatedTable, targetSeat, {
    processAt: requestAt,
    status: seatStatus === 'registered' ? 'registered' : 'open',
    stackOil: Number(targetSeat?.stackOil || 0),
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: updatedTable.tableId,
      handId: synced.hand?.handId || null,
      seatNumber,
      actorRole: 'system',
      eventKind: 'multi_flight_advancer_registered',
      payload: {
        sourceTableId: sourceTable?.tableId || null,
        sourceSeriesId: getTournamentSeriesRef(sourceTable).seriesId || null,
        flightCode: getTournamentMultiFlightFlightCode(sourceTable) || null,
        walletSubject,
        carriedStackOil: Number(targetSeat?.stackOil || 0),
      },
      createdAt: requestAt,
    });
  }
  if (synced.hand?.handId && typeof deps.createPokerPlayMessage === 'function') {
    deps.createPokerPlayMessage({
      tableId: updatedTable.tableId,
      handId: synced.hand.handId,
      seatNumber: null,
      authorRole: 'system',
      body: `${formatSeatLabel(seatNumber, targetSeat.displayName)} advances from ${getTournamentMultiFlightFlightLabel(sourceTable) || sourceTable?.title || 'Day 1'} with ${Number(targetSeat?.stackOil || 0)} chips.`,
      createdAt: requestAt,
    });
  }
  return {
    table: updatedTable,
    seat: targetSeat,
    carriedStackOil: Number(targetSeat?.stackOil || 0),
    created: true,
  };
}

function maybeBagMultiFlightFlight(deps, table, seats, hand, atIso) {
  if (!isMultiFlightFlightTable(table)) {
    return { table, seats, hand, bagged: false };
  }
  if (!hasPokerPlayTableStarted(table, hand)) {
    return { table, seats, hand, bagged: false };
  }
  if (normalizeIsoString(table?.state?.multiFlightBaggedAt) || normalizeIsoString(table?.state?.completedAt)) {
    return { table, seats, hand, bagged: false };
  }
  const activeSeats = getActiveSeatRows(seats);
  const advanceSeatCount = getTournamentMultiFlightAdvanceSeatCount(table);
  if (advanceSeatCount <= 0 || !activeSeats.length || activeSeats.length > advanceSeatCount) {
    return { table, seats, hand, bagged: false };
  }
  const flightEconomics = buildTournamentEconomics([{ table, seats, hand }]);
  const advancerRegistrations = [];
  const touchedTargetTableIds = new Set();
  for (const seat of activeSeats.slice().sort((left, right) => {
    const stackDelta = Number(right?.stackOil || 0) - Number(left?.stackOil || 0);
    if (stackDelta !== 0) return stackDelta;
    return normalizeSeatNumber(left?.seatNumber) - normalizeSeatNumber(right?.seatNumber);
  })) {
    const registration = registerMultiFlightAdvancerIntoMergeSeries(deps, table, seat, {
      carriedStackOil: Number(seat?.stackOil || 0),
      asOf: atIso,
    });
    if (!registration?.table || !registration?.seat) {
      return { table, seats, hand, bagged: false };
    }
    advancerRegistrations.push({
      seat,
      mergeSeat: registration.seat,
      mergeTableId: registration.table.tableId,
      carriedStackOil: Number(registration.carriedStackOil || 0),
    });
    touchedTargetTableIds.add(String(registration.table.tableId || ''));
  }
  const standings = buildMultiFlightBaggedStandings(seats, advancerRegistrations, {
    tableId: table.tableId,
    atIso,
    mergeSeriesId: getTournamentMultiFlightMergeSeriesId(table),
    mergeTableId: advancerRegistrations[0]?.mergeTableId || null,
  });
  const placementByWallet = new Map(
    standings
      .filter((item) => normalizeTrimmedString(item?.walletSubject))
      .map((item) => [normalizeTrimmedString(item.walletSubject), Number(item.place || 0)])
  );
  const advancerWallets = new Set(
    advancerRegistrations.map((item) => normalizeTrimmedString(item?.seat?.walletSubject)).filter(Boolean)
  );
  for (const seat of Array.isArray(seats) ? seats : []) {
    const walletSubject = normalizeTrimmedString(seat?.walletSubject);
    const advanced = advancerWallets.has(walletSubject);
    const updatedSeat = deps.upsertPokerPlaySeat({
      ...seat,
      status: advanced ? 'advanced' : seat?.status || 'busted',
      stackOil: advanced ? 0 : Number(seat?.stackOil || 0),
      currentBountyOil: advanced ? 0 : Number(seat?.currentBountyOil || 0),
      payoutSettledAt: advanced ? atIso : (seat?.payoutSettledAt || null),
      updatedAt: atIso,
    });
    upsertPokerPlayPlayerStatForSeat(deps, table, updatedSeat, {
      processAt: atIso,
      finishPosition: placementByWallet.get(walletSubject) || null,
      status: advanced ? 'advanced' : (updatedSeat.status || 'busted'),
      close: true,
      closedAt: atIso,
      payoutSettledAt: advanced ? atIso : null,
      stackOil: 0,
    });
    if (advanced && typeof deps.createPokerPlayAuditEvent === 'function') {
      deps.createPokerPlayAuditEvent({
        tableId: table.tableId,
        handId: hand?.handId || null,
        seatNumber: normalizeSeatNumber(updatedSeat?.seatNumber),
        actorRole: 'system',
        eventKind: 'multi_flight_advanced',
        payload: {
          mergeSeriesId: getTournamentMultiFlightMergeSeriesId(table) || null,
          mergeTableId: advancerRegistrations.find((item) => normalizeTrimmedString(item?.seat?.walletSubject) === walletSubject)?.mergeTableId || null,
          carriedStackOil: advancerRegistrations.find((item) => normalizeTrimmedString(item?.seat?.walletSubject) === walletSubject)?.carriedStackOil || 0,
        },
        createdAt: atIso,
      });
    }
  }
  const importRecord = {
    sourceSeriesId: getTournamentSeriesRef(table).seriesId || table.tableId,
    sourceSeriesTitle: getTournamentSeriesRef(table).seriesTitle || table.title,
    festivalParentId: getTournamentMultiFlightFestivalParentId(table) || null,
    festivalTitle: getTournamentMultiFlightFestivalTitle(table) || null,
    flightCode: getTournamentMultiFlightFlightCode(table) || null,
    flightLabel: getTournamentMultiFlightFlightLabel(table) || null,
    entryCount: Number(flightEconomics.entryCount || 0),
    prizePoolOil: Number(flightEconomics.prizePoolOil || 0),
    bountyPoolOil: Number(flightEconomics.bountyPoolOil || 0),
    advancedSeatCount: advancerRegistrations.length,
    carriedStackTotalOil: advancerRegistrations.reduce((sum, item) => sum + Number(item?.carriedStackOil || 0), 0),
  };
  for (const targetTableId of Array.from(touchedTargetTableIds).filter(Boolean)) {
    const targetTable = deps.getPokerPlayTableById(targetTableId);
    if (targetTable) {
      upsertMultiFlightImportIntoTargetTable(deps, targetTable, importRecord, atIso);
    }
  }
  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
    state: {
      ...(table.state && typeof table.state === 'object' ? table.state : {}),
      completedAt: atIso,
      winnerSeatNumber: 0,
      prizeOil: 0,
      prizeSettledAt: atIso,
      payoutModel: 'multi_flight_bag',
      payouts: [],
      standings,
      multiFlightBaggedAt: atIso,
      multiFlightAdvancedSeatCount: advancerRegistrations.length,
      multiFlightImportedIntoSeriesId: getTournamentMultiFlightMergeSeriesId(table) || null,
      multiFlightImportedIntoTableId: advancerRegistrations[0]?.mergeTableId || null,
      activeHandId: hand?.handId || null,
      activeHandNumber: Number(hand?.handNumber || table?.state?.activeHandNumber || 0),
      prizePoolOil: Number(flightEconomics.prizePoolOil || 0),
      bountyPoolOil: Number(flightEconomics.bountyPoolOil || 0),
    },
    updatedAt: atIso,
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: updatedTable.tableId,
      handId: hand?.handId || null,
      seatNumber: null,
      actorRole: 'system',
      eventKind: 'multi_flight_bagged',
      payload: {
        mergeSeriesId: getTournamentMultiFlightMergeSeriesId(table) || null,
        mergeTableId: advancerRegistrations[0]?.mergeTableId || null,
        advancedSeatCount: advancerRegistrations.length,
        importedPrizePoolOil: Number(flightEconomics.prizePoolOil || 0),
      },
      createdAt: atIso,
    });
  }
  return {
    table: updatedTable,
    seats: deps.listPokerPlaySeatsByTable(table.tableId),
    hand,
    bagged: true,
  };
}

function registerSatelliteAwardIntoTargetSeries(deps, award, { asOf } = {}) {
  if (!award?.targetSeriesId || typeof deps.upsertPokerSatelliteAward !== 'function') {
    return award;
  }
  const requestAt = toProcessIso(deps, asOf);
  const entries = listTournamentSeriesEntriesDirectBySeriesId(deps, award.targetSeriesId, {
    includeClosed: false,
  });
  if (!entries.length) {
    return award;
  }
  const walletSubject = normalizeTrimmedString(award.walletSubject);
  const existingEntry = entries.find((entry) => (
    normalizeTrimmedString(entry?.viewerSeat?.walletSubject) === walletSubject
      || !!(Array.isArray(entry?.seats) ? entry.seats : []).find((seat) => normalizeTrimmedString(seat?.walletSubject) === walletSubject && !isTournamentVoidedSeat(seat))
  ));
  if (existingEntry?.table) {
    return deps.upsertPokerSatelliteAward({
      ...award,
      targetTableId: existingEntry.table.tableId,
      registrationState: 'registered',
      status: 'active',
      updatedAt: requestAt,
    });
  }
  const candidates = entries
    .map((entry) => ({
      ...entry,
      summary: computeTableSummary(entry.table, entry.seats, entry.hand, null),
    }))
    .filter((entry) => Number(entry?.summary?.openSeatCount || 0) > 0)
    .filter((entry) => !entry?.hand || entry.hand.status !== 'live' || resolveTournamentLateRegistration(entry.table, entry.hand).open)
    .sort((left, right) => {
      const scheduledDelta = Number(!!left?.summary?.scheduledStartPending) - Number(!!right?.summary?.scheduledStartPending);
      if (scheduledDelta !== 0) return scheduledDelta;
      const occupancyDelta = Number(right?.summary?.occupancy || 0) - Number(left?.summary?.occupancy || 0);
      if (occupancyDelta !== 0) return occupancyDelta;
      return String(left?.table?.tableId || '').localeCompare(String(right?.table?.tableId || ''));
    });
  const candidate = candidates[0] || null;
  if (!candidate?.table) {
    return award;
  }
  const targetTable = maybeClearReusableTournamentSeats(deps, candidate.table);
  const synced = syncPokerPlayTable(deps, targetTable.tableId, { processAt: requestAt });
  const seatNumber = findNextOpenSeatNumber(synced.table, synced.seats);
  if (!seatNumber) {
    return award;
  }
  const verification = typeof deps.getStreamflowVerificationByWalletSubject === 'function'
    ? deps.getStreamflowVerificationByWalletSubject(walletSubject)
    : null;
  const displayName = normalizePokerPlayDisplayName(
    award?.payload?.displayName,
    walletSubject ? walletSubject.slice(0, 8) : 'Qualifier'
  );
  const nextTableState = incrementTournamentEntryState(synced.table, walletSubject, {
    reentry: false,
    rebuy: false,
  });
  const targetSeat = deps.upsertPokerPlaySeat({
    tableId: synced.table.tableId,
    seatNumber,
    portalSessionId: null,
    houseId: award.houseId || null,
    walletSubject,
    displayName,
    status: synced.hand && synced.hand.status === 'live' ? 'registered' : 'active',
    buyInOil: synced.table.buyInOil,
    stackOil: synced.table.buyInOil,
    streamflowVerificationId: verification?.verificationId || null,
    lastSeenAt: requestAt,
    disconnectedAt: null,
    eliminatedAt: null,
    prizeOil: 0,
    currentBountyOil: computeTournamentInitialBountyOil(
      synced.table.buyInOil,
      getTournamentBountyModel(synced.table),
      getTournamentEntryFeeOil(synced.table)
    ),
    bountyWonOil: 0,
    bountySettledAt: null,
    payoutSettledAt: null,
    updatedAt: requestAt,
  });
  const updatedTable = deps.upsertPokerPlayTable({
    ...synced.table,
    state: setSeatTimeBankRemainingSeconds(
      {
        ...synced.table,
        state: nextTableState,
      },
      seatNumber,
      getSeatTimeBankRemainingSeconds(synced.table, seatNumber)
    ),
    updatedAt: requestAt,
  });
  upsertPokerPlayPlayerStatForSeat(deps, updatedTable, targetSeat, {
    processAt: requestAt,
    status: targetSeat.status || 'open',
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: updatedTable.tableId,
      handId: synced.hand?.handId || null,
      seatNumber,
      actorRole: 'system',
      eventKind: 'satellite_qualifier_registered',
      payload: {
        sourceTableId: award.sourceTableId || null,
        sourceSeriesId: award.sourceSeriesId || null,
        awardKind: award.awardKind,
        awardValueOil: Number(award.awardValueOil || 0),
        walletSubject,
      },
      createdAt: requestAt,
    });
  }
  if (synced.hand?.handId && typeof deps.createPokerPlayMessage === 'function') {
    deps.createPokerPlayMessage({
      tableId: updatedTable.tableId,
      handId: synced.hand.handId,
      seatNumber: null,
      authorRole: 'system',
      body: `${formatSeatLabel(seatNumber, displayName)} registers through a satellite qualifier.`,
      createdAt: requestAt,
    });
  }
  return deps.upsertPokerSatelliteAward({
    ...award,
    targetTableId: updatedTable.tableId,
    registrationState: 'registered',
    status: 'active',
    updatedAt: requestAt,
  });
}

function settleTournamentSatelliteAwards(deps, table, standings, atIso) {
  if (getTournamentFormatVariant(table) !== 'satellite') {
    return { table, awards: [] };
  }
  if (!Array.isArray(standings) || !standings.length) {
    return { table, awards: [] };
  }
  if (normalizeIsoString(table?.state?.satelliteAwardsSettledAt)) {
    return { table, awards: [] };
  }
  const awardCount = getTournamentSatelliteAwardCount(table);
  if (awardCount <= 0 || typeof deps.upsertPokerSatelliteAward !== 'function') {
    const updatedTable = deps.upsertPokerPlayTable({
      ...table,
      state: {
        ...(table.state && typeof table.state === 'object' ? table.state : {}),
        satelliteAwardsSettledAt: atIso,
      },
      updatedAt: atIso,
    });
    return { table: updatedTable, awards: [] };
  }
  const winners = standings.slice(0, awardCount);
  const awards = [];
  for (const standing of winners) {
    const walletSubject = normalizeTrimmedString(standing?.walletSubject);
    if (!walletSubject) continue;
    let award = deps.upsertPokerSatelliteAward({
      sourceTableId: table.tableId,
      sourceSeriesId: getTournamentSeriesRef(table).seriesId || null,
      targetTableId: null,
      targetSeriesId: normalizeTrimmedString(table?.rules?.satelliteTargetSeriesId) || null,
      walletSubject,
      houseId: standing?.houseId || null,
      awardKind: getTournamentSatelliteAwardKind(table),
      registrationState: 'awarded',
      status: 'active',
      awardCount: 1,
      awardValueOil: getTournamentSatelliteAwardValueOil(table),
      payload: {
        place: Number(standing?.place || 0),
        displayName: normalizeTrimmedString(standing?.displayName),
        sourceTitle: table?.title || '',
      },
      createdAt: atIso,
      updatedAt: atIso,
    });
    award = registerSatelliteAwardIntoTargetSeries(deps, award, { asOf: atIso });
    awards.push(award);
    if (typeof deps.createPokerPlayAuditEvent === 'function') {
      deps.createPokerPlayAuditEvent({
        tableId: table.tableId,
        handId: table?.state?.lastSettledHandId || table?.state?.activeHandId || null,
        seatNumber: normalizeSeatNumber(standing?.seatNumber),
        actorRole: 'system',
        eventKind: 'satellite_award_issued',
        payload: {
          walletSubject,
          awardKind: award?.awardKind || getTournamentSatelliteAwardKind(table),
          registrationState: award?.registrationState || 'awarded',
          targetSeriesId: award?.targetSeriesId || normalizeTrimmedString(table?.rules?.satelliteTargetSeriesId) || null,
        },
        createdAt: atIso,
      });
    }
  }
  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
    state: {
      ...(table.state && typeof table.state === 'object' ? table.state : {}),
      satelliteAwardsSettledAt: atIso,
    },
    updatedAt: atIso,
  });
  return { table: updatedTable, awards };
}

function settleTournamentIfComplete(deps, table, seats, hand, atIso) {
  if (String(table?.tableType || 'cash') !== 'tournament') return { table, seats, completed: false };
  const seriesRef = getTournamentSeriesRef(table);
  const tournamentEntries = seriesRef.seriesId && seriesRef.matchKey
    ? listTournamentSeriesEntriesDirect(deps, seriesRef.matchKey, { includeClosed: true })
    : [{ table, seats, hand }];
  const activeSeatCount = tournamentEntries.reduce((sum, entry) => sum + getActiveSeatRows(entry?.seats).length, 0);
  if (activeSeatCount <= 1 && hasPendingTournamentRebuyOpportunity(tournamentEntries)) {
    return { table, seats, completed: false };
  }
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
  const settleTreasuryFees = !normalizeIsoString(table?.state?.completedAt);
  const satelliteTournament = getTournamentFormatVariant(table) === 'satellite';
  for (const entry of tournamentEntries) {
    const entryFeeOil = getTournamentEntryFeeOil(entry?.table || table);
    for (const seat of Array.isArray(entry?.seats) ? entry.seats : []) {
      const identity = getTournamentSeatIdentity(seat);
      const placement = placementMap.get(identity);
      if (!placement) continue;
      const payoutOil = satelliteTournament ? 0 : Number(payoutByPlace.get(Number(placement.place || 0)) || 0);
      const bountyPayoutOil = Number(seat?.currentBountyOil || 0) > 0 && !seat?.bountySettledAt
        ? Math.max(0, Number(seat?.currentBountyOil || 0))
        : 0;
      if (payoutOil > 0 && !seat?.payoutSettledAt) {
        deps.createOilLedgerEntry({
          walletSubject: seat.walletSubject,
          houseId: seat.houseId || null,
          verificationId: seat.streamflowVerificationId || null,
          tableId: entry?.table?.tableId || table?.tableId || null,
          seriesId: getTournamentSeriesRef(entry?.table || table).seriesId || null,
          entryKind: 'poker_play_tournament_prize',
          direction: 'credit',
          amount: payoutOil,
          memo: `Tournament prize from ${entry?.table?.title || table?.title}`,
        });
      }
      if (bountyPayoutOil > 0) {
        deps.createOilLedgerEntry({
          walletSubject: seat.walletSubject,
          houseId: seat.houseId || null,
          verificationId: seat.streamflowVerificationId || null,
          tableId: entry?.table?.tableId || table?.tableId || null,
          seriesId: getTournamentSeriesRef(entry?.table || table).seriesId || null,
          entryKind: 'poker_play_tournament_bounty',
          direction: 'credit',
          amount: bountyPayoutOil,
          memo: `Tournament bounty from ${entry?.table?.title || table?.title}`,
        });
      }
      if (settleTreasuryFees && entryFeeOil > 0) {
        createPokerPlayRoomTreasuryCredit(deps, {
          table: entry?.table || table,
          seriesId: getTournamentSeriesRef(entry?.table || table).seriesId || null,
          amountOil: entryFeeOil,
          memo: `Tournament fee from ${entry?.table?.title || table?.title}`,
          createdAt: atIso,
        });
      }
      const isWinner = Number(placement.place || 0) === 1;
      const updatedSeat = deps.upsertPokerPlaySeat({
        ...seat,
        status: payoutOil > 0 ? 'paid' : 'busted',
        stackOil: 0,
        eliminatedAt: isWinner ? seat?.eliminatedAt || null : (seat?.eliminatedAt || atIso),
        prizeOil: payoutOil,
        currentBountyOil: 0,
        bountyWonOil: Number(seat?.bountyWonOil || 0) + bountyPayoutOil,
        bountySettledAt: bountyPayoutOil > 0 ? atIso : (seat?.bountySettledAt || null),
        payoutSettledAt: payoutOil > 0 ? (seat?.payoutSettledAt || atIso) : seat?.payoutSettledAt || null,
        updatedAt: atIso,
      });
      upsertPokerPlayPlayerStatForSeat(deps, entry.table, updatedSeat, {
        processAt: atIso,
        prizeOil: payoutOil,
        bountyOilDelta: bountyPayoutOil,
        entryFeeOilDelta: settleTreasuryFees ? entryFeeOil : 0,
        finishPosition: Number(placement.place || 0) || null,
        status: payoutOil > 0 ? 'paid' : 'busted',
        payoutSettledAt: payoutOil > 0 ? (seat?.payoutSettledAt || atIso) : null,
        close: true,
        stackOil: 0,
      });
      const resultHandId = entry?.hand?.handId || entry?.table?.state?.lastSettledHandId || entry?.table?.state?.activeHandId || hand?.handId || null;
      if ((payoutOil > 0 || bountyPayoutOil > 0) && resultHandId && (!seat?.payoutSettledAt || bountyPayoutOil > 0)) {
        deps.createPokerPlayMessage({
          tableId: entry.table.tableId,
          handId: resultHandId,
          seatNumber: null,
          authorRole: 'system',
          body: `${formatSeatLabel(seat.seatNumber, seat.displayName)} finishes ${Number(placement.place || 0)} and is paid ${payoutOil} OIL${bountyPayoutOil > 0 ? ` plus ${bountyPayoutOil} OIL bounty` : ''}.`,
          createdAt: atIso,
        });
      }
    }
  }
  const finalEntries = seriesRef.seriesId && seriesRef.matchKey
    ? listTournamentSeriesEntriesDirect(deps, seriesRef.matchKey, { includeClosed: true })
    : [{ table, seats: deps.listPokerPlaySeatsByTable(table.tableId), hand }];
  const finalEconomics = buildTournamentEconomics(finalEntries);
  const finalStandings = Array.isArray(finalEconomics.standings) ? finalEconomics.standings : standings;
  const winner = finalStandings[0] || null;
  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
    state: {
      ...(table.state && typeof table.state === 'object' ? table.state : {}),
      completedAt: table?.state?.completedAt || atIso,
      winnerSeatNumber: winner && String(winner.tableId || '') === String(table.tableId || '')
        ? normalizeSeatNumber(winner.seatNumber)
        : normalizeSeatNumber(table?.state?.winnerSeatNumber),
      prizeOil: Number(finalEconomics?.payouts?.[0]?.amountOil || 0),
      prizePoolOil: Number(finalEconomics.prizePoolOil || 0),
      bountyModel: finalEconomics.bountyModel,
      bountyPoolOil: Number(finalEconomics.bountyPoolOil || 0),
      totalBountyAwardedOil: Number(finalEconomics.totalBountyAwardedOil || 0),
      prizeSettledAt: table?.state?.prizeSettledAt || atIso,
      payoutModel: finalEconomics.payoutModel,
      payouts: cloneJson(finalEconomics.payouts, []),
      standings: cloneJson(finalStandings, []),
      activeHandId: hand?.handId || null,
      activeHandNumber: Number(hand?.handNumber || 0),
    },
    updatedAt: atIso,
  });
  const satelliteSettlement = settleTournamentSatelliteAwards(deps, updatedTable, finalStandings, atIso);
  return {
    table: satelliteSettlement.table,
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
      rebuyCount: 0,
      addonCount: 0,
      addonPrizePoolOil: 0,
      addonBountyPoolOil: 0,
      multiFlightBaggedAt: null,
      multiFlightAdvancedSeatCount: 0,
      multiFlightImportedIntoSeriesId: null,
      multiFlightImportedIntoTableId: null,
      multiFlightImportsBySourceSeriesId: {},
      rebuyCountsByWallet: {},
      addonCountsByWallet: {},
      satelliteAwardsSettledAt: null,
      chopSettledAt: null,
      chopProposalId: null,
      payouts: [],
      standings: [],
      completedScheduledBreakAfterHands: [],
      scheduledBreakId: null,
      scheduledBreakLabel: null,
      scheduledBreakAfterHandNumber: 0,
      scheduledBreakStartedAt: null,
      scheduledBreakUntilAt: null,
      scheduledBreakDurationMinutes: 0,
    },
  });
}

function findNextOpenSeatNumber(table, seats) {
  const occupied = new Set(
    (Array.isArray(seats) ? seats : [])
      .filter(isSeatOccupyingTable)
      .map((seat) => normalizeSeatNumber(seat?.seatNumber))
      .filter(Boolean)
  );
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

function moveTournamentSeriesSeat(deps, seat, targetEntry, atIso, targetSeatNumber = 0) {
  const targetTable = targetEntry?.table || null;
  if (!targetTable || !seat) return null;
  const sourceTable = deps.getPokerPlayTableById(seat.tableId);
  const targetSeats = deps.listPokerPlaySeatsByTable(targetTable.tableId);
  const normalizedTargetSeatNumber = normalizeSeatNumber(targetSeatNumber);
  const occupied = new Set(
    targetSeats
      .filter(isSeatOccupyingTable)
      .map((targetSeat) => normalizeSeatNumber(targetSeat.seatNumber))
      .filter(Boolean)
  );
  const openSeatNumber = normalizedTargetSeatNumber && !occupied.has(normalizedTargetSeatNumber)
    ? normalizedTargetSeatNumber
    : findNextOpenSeatNumber(targetTable, targetSeats);
  if (!openSeatNumber) return null;
  const carriedTimeBank = sourceTable ? getSeatTimeBankRemainingSeconds(sourceTable, seat.seatNumber) : 0;
  const movedSeat = deps.upsertPokerPlaySeat({
    ...seat,
    tableId: targetTable.tableId,
    seatNumber: openSeatNumber,
    status: targetEntry?.hand && targetEntry.hand.status === 'live' ? 'registered' : 'active',
    createdAt: seat.createdAt,
    updatedAt: atIso,
  });
  deps.deletePokerPlaySeat(seat.tableId, seat.seatNumber);
  if (sourceTable) {
    deps.upsertPokerPlayTable({
      ...sourceTable,
      state: removeSeatTimeBankState(sourceTable, seat.seatNumber),
      updatedAt: atIso,
    });
  }
  deps.upsertPokerPlayTable({
    ...targetTable,
    state: setSeatTimeBankRemainingSeconds(targetTable, openSeatNumber, carriedTimeBank),
    updatedAt: atIso,
  });
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
  if (hand?.handId) {
    deps.createPokerPlayMessage({
      tableId: table.tableId,
      handId: hand.handId,
      seatNumber: null,
      authorRole: 'system',
      body: 'Table resumed by operator.',
      createdAt: requestAt,
    });
  }
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

function closeTable(deps, { tableId, reason, actorLabel = 'operator', refundMode, asOf } = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  if (isTableAdminClosed(synced.table)) {
    return {
      table: synced.table,
      seats: synced.seats,
      hand: synced.hand,
      refundSummary: {
        refundMode: normalizeTrimmedString(synced?.table?.state?.refundMode, normalizeAdminCloseRefundMode(refundMode, synced.table.tableType)),
        refundedSeatCount: Number(synced?.table?.state?.refundedSeatCount || 0),
        refundedTotalOil: Number(synced?.table?.state?.refundedTotalOil || 0),
      },
    };
  }

  const table = synced.table;
  const hand = synced.hand;
  const refundPolicy = normalizeAdminCloseRefundMode(refundMode, table.tableType);
  const closeReason = normalizeTrimmedString(reason, 'Operator closed the table.');
  let refundedSeatCount = 0;
  let refundedTotalOil = 0;
  const finalSeatStatusByNumber = new Map();

  for (const seat of Array.isArray(synced.seats) ? synced.seats : []) {
    const seatNumber = normalizeSeatNumber(seat?.seatNumber);
    const status = normalizeTrimmedString(seat?.status).toLowerCase();
    if (normalizePokerPlayTableType(table.tableType) === 'cash') {
      const refundAmount = refundPolicy === 'none' ? 0 : resolveEffectiveSeatStackOil(seat, hand);
      if (refundAmount > 0) {
        deps.createOilLedgerEntry({
          walletSubject: seat.walletSubject,
          houseId: seat.houseId || null,
          verificationId: seat.streamflowVerificationId || null,
          tableId: table.tableId,
          seriesId: getTournamentSeriesRef(table).seriesId || null,
          entryKind: 'poker_play_admin_refund',
          direction: 'credit',
          amount: refundAmount,
          memo: `${table.title} operator closure refund`,
        });
        refundedSeatCount += 1;
        refundedTotalOil += refundAmount;
      }
      finalSeatStatusByNumber.set(seatNumber, 'closed_refund');
      const updatedSeat = deps.upsertPokerPlaySeat({
        ...seat,
        status: 'closed_refund',
        stackOil: 0,
        disconnectedAt: null,
        updatedAt: requestAt,
      });
      upsertPokerPlayPlayerStatForSeat(deps, table, updatedSeat, {
        processAt: requestAt,
        refundOilDelta: refundAmount,
        status: 'closed_refund',
        close: true,
        stackOil: 0,
      });
      continue;
    }

    const alreadySettled = status === 'paid' || status === 'advanced' || status === 'busted' || status === 'void_refund';
    const refundAmount = refundPolicy === 'none' || alreadySettled
      ? 0
      : Math.max(0, Number(seat?.buyInOil || 0));
    if (refundAmount > 0) {
      deps.createOilLedgerEntry({
        walletSubject: seat.walletSubject,
        houseId: seat.houseId || null,
        verificationId: seat.streamflowVerificationId || null,
        tableId: table.tableId,
        seriesId: getTournamentSeriesRef(table).seriesId || null,
        entryKind: 'poker_play_tournament_refund',
        direction: 'credit',
        amount: refundAmount,
        memo: `${table.title} operator tournament refund`,
      });
      refundedSeatCount += 1;
      refundedTotalOil += refundAmount;
    }
    finalSeatStatusByNumber.set(seatNumber, alreadySettled ? status : 'void_refund');
    const updatedSeat = deps.upsertPokerPlaySeat({
      ...seat,
      status: alreadySettled ? status : 'void_refund',
      stackOil: 0,
      disconnectedAt: null,
      eliminatedAt: alreadySettled ? (seat?.eliminatedAt || null) : (seat?.eliminatedAt || requestAt),
      updatedAt: requestAt,
    });
    upsertPokerPlayPlayerStatForSeat(deps, table, updatedSeat, {
      processAt: requestAt,
      refundOilDelta: refundAmount,
      status: alreadySettled ? status : 'void_refund',
      close: true,
      stackOil: 0,
    });
  }

  let updatedHand = hand;
  if (hand) {
    const nextHandState = cloneJson(hand.state, {});
    const rawSeatStates = nextHandState?.seatStates && typeof nextHandState.seatStates === 'object'
      ? nextHandState.seatStates
      : {};
    const nextSeatStates = {};
    for (const [key, seatState] of Object.entries(rawSeatStates)) {
      const seatNumber = normalizeSeatNumber(key);
      const nextSeatStatus = normalizeTrimmedString(finalSeatStatusByNumber.get(seatNumber));
      nextSeatStates[key] = {
        ...cloneJson(seatState, {}),
        stackOil: 0,
        committedStreetOil: 0,
        committedHandOil: 0,
        allIn: false,
        eliminated: nextSeatStatus === 'void_refund' ? true : Boolean(seatState?.eliminated),
      };
    }
    nextHandState.actionExpiresAt = null;
    nextHandState.actingSeat = 0;
    nextHandState.seatStates = nextSeatStates;
    updatedHand = deps.upsertPokerPlayHand({
      ...hand,
      status: 'cancelled',
      actionExpiresAt: null,
      state: nextHandState,
      result: {
        ...(hand.result && typeof hand.result === 'object' ? hand.result : {}),
        type: 'admin_closed',
        note: closeReason,
      },
      updatedAt: requestAt,
    });
  }

  const state = table?.state && typeof table.state === 'object' ? table.state : {};
  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
    status: 'admin_closed',
    state: {
      ...state,
      closedAt: requestAt,
      closeReason,
      closedBy: normalizeTrimmedString(actorLabel, 'operator'),
      refundMode: refundPolicy,
      refundedSeatCount,
      refundedTotalOil,
      pausedAt: null,
      pausedReason: null,
      pausedBy: null,
      pausedActionRemainingMs: 0,
    },
    updatedAt: requestAt,
  });

  if (updatedHand?.handId) {
    deps.createPokerPlayMessage({
      tableId: updatedTable.tableId,
      handId: updatedHand.handId,
      seatNumber: null,
      authorRole: 'system',
      body: `${closeReason}${refundedSeatCount ? ` ${refundedSeatCount} seat${refundedSeatCount === 1 ? '' : 's'} refunded for ${refundedTotalOil} OIL.` : ''}`,
      createdAt: requestAt,
    });
  }
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: updatedTable.tableId,
      handId: updatedHand?.handId || null,
      actorRole: normalizePokerPlayAuditActorRole(actorLabel, actorLabel === 'operator' ? 'operator' : 'system'),
      eventKind: 'table_closed',
      payload: {
        reason: closeReason,
        refundMode: refundPolicy,
        refundedSeatCount,
        refundedTotalOil,
        actorLabel: normalizeTrimmedString(actorLabel, 'operator'),
      },
      createdAt: requestAt,
    });
  }

  return {
    table: updatedTable,
    seats: deps.listPokerPlaySeatsByTable(updatedTable.tableId),
    hand: updatedHand,
    refundSummary: {
      refundMode: refundPolicy,
      refundedSeatCount,
      refundedTotalOil,
    },
  };
}

function closeTournamentSeries(deps, { seriesId, reason, actorLabel = 'operator', refundMode, asOf } = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const targetSeriesId = normalizeTrimmedString(seriesId);
  if (!targetSeriesId) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker tournament series not found.');
  }
  const existingEntries = listTournamentSeriesEntriesBySeriesId(deps, targetSeriesId, {
    processAt: requestAt,
    includeClosed: true,
  });
  if (!existingEntries.length) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker tournament series not found.');
  }

  const closeReason = normalizeTrimmedString(reason, 'Operator closed the tournament series.');
  const refundPolicy = normalizeAdminCloseRefundMode(refundMode, 'tournament');
  const newlyClosedTables = [];
  for (const entry of existingEntries) {
    const table = entry?.table || null;
    if (!table || isSeriesClosedTable(table)) continue;
    const closed = closeTable(deps, {
      tableId: table.tableId,
      reason: closeReason,
      actorLabel,
      refundMode: refundPolicy,
      asOf: requestAt,
    });
    newlyClosedTables.push({
      tableId: closed?.table?.tableId || table.tableId,
      refundSummary: {
        refundMode: normalizeTrimmedString(closed?.refundSummary?.refundMode, refundPolicy),
        refundedSeatCount: Number(closed?.refundSummary?.refundedSeatCount || 0),
        refundedTotalOil: Number(closed?.refundSummary?.refundedTotalOil || 0),
      },
    });
  }

  const detail = getSeriesDetail(deps, {
    seriesId: targetSeriesId,
    processAt: requestAt,
  });
  const adminClosedEntries = listTournamentSeriesEntriesBySeriesId(deps, targetSeriesId, {
    processAt: requestAt,
    includeClosed: true,
  }).filter((entry) => isTableAdminClosed(entry?.table));

  return {
    ...detail,
    refundSummary: {
      refundMode: normalizeTrimmedString(detail?.series?.refundMode, refundPolicy),
      closedTableCount: Number(detail?.series?.adminClosedTableCount || adminClosedEntries.length || 0),
      refundedSeatCount: Number(detail?.series?.refundedSeatCount || 0),
      refundedTotalOil: Number(detail?.series?.refundedTotalOil || 0),
    },
    closedTableIds: adminClosedEntries
      .map((entry) => String(entry?.table?.tableId || ''))
      .filter(Boolean),
    newlyClosedTables,
  };
}

function getTournamentDirectorEntries(deps, seriesId, requestAt, { includeClosed = false } = {}) {
  const targetSeriesId = normalizeTrimmedString(seriesId);
  if (!targetSeriesId) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker tournament series not found.');
  }
  const entries = listTournamentSeriesEntriesBySeriesId(deps, targetSeriesId, {
    processAt: requestAt,
    includeClosed,
  });
  if (!entries.length) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker tournament series not found.');
  }
  return entries;
}

function getTournamentDirectorEntry(entries, tableId) {
  const targetTableId = normalizeTrimmedString(tableId);
  return (Array.isArray(entries) ? entries : []).find((entry) => String(entry?.table?.tableId || '') === targetTableId) || null;
}

function createDirectorAuditEvent(deps, {
  seriesId,
  tableId,
  handId = null,
  eventKind,
  payload = {},
  atIso,
  actorLabel = 'operator',
  reason = '',
}) {
  if (typeof deps.createPokerPlayAuditEvent !== 'function') return;
  deps.createPokerPlayAuditEvent({
    tableId,
    handId,
    seatNumber: null,
    actorRole: normalizePokerPlayAuditActorRole(actorLabel, 'operator'),
    eventKind,
    payload: {
      seriesId: normalizeTrimmedString(seriesId) || null,
      actorLabel: normalizeTrimmedString(actorLabel, 'operator'),
      reason: normalizeTrimmedString(reason) || null,
      ...cloneJson(payload, {}),
    },
    createdAt: atIso,
  });
}

function closeTournamentRegistration(deps, { seriesId, reason, actorLabel = 'operator', asOf } = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const entries = getTournamentDirectorEntries(deps, seriesId, requestAt);
  const activeEntries = entries.filter((entry) => !isSeriesClosedTable(entry?.table));
  if (!activeEntries.length) {
    throw createRouteError(409, 'POKER_PLAY_SERIES_CLOSED', 'This tournament series is already closed.');
  }
  const targetReason = normalizeTrimmedString(reason, 'Director closed late registration.');
  for (const entry of activeEntries) {
    deps.upsertPokerPlayTable({
      ...entry.table,
      state: {
        ...(entry?.table?.state && typeof entry.table.state === 'object' ? entry.table.state : {}),
        registrationClosedByDirectorAt: requestAt,
        registrationClosedByDirectorReason: targetReason,
      },
      updatedAt: requestAt,
    });
  }
  createDirectorAuditEvent(deps, {
    seriesId,
    tableId: activeEntries[0]?.table?.tableId || '',
    eventKind: 'director_registration_closed',
    payload: {
      tableIds: activeEntries.map((entry) => String(entry?.table?.tableId || '')).filter(Boolean),
    },
    atIso: requestAt,
    actorLabel,
    reason: targetReason,
  });
  return getSeriesDetail(deps, {
    seriesId,
    processAt: requestAt,
  });
}

function moveTournamentDirectorSeat(deps, {
  seriesId,
  sourceTableId,
  seatNumber,
  targetTableId,
  targetSeatNumber,
  reason,
  actorLabel = 'operator',
  asOf,
} = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const entries = getTournamentDirectorEntries(deps, seriesId, requestAt);
  const sourceEntry = getTournamentDirectorEntry(entries, sourceTableId);
  const targetEntry = getTournamentDirectorEntry(entries, targetTableId);
  if (!sourceEntry || !targetEntry) {
    throw createRouteError(404, 'NOT_FOUND', 'Tournament director move requires valid source and target tables.');
  }
  if (String(sourceEntry.table.tableId || '') === String(targetEntry.table.tableId || '')) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Source and target tables must differ for a director move.');
  }
  if (isSeriesClosedTable(sourceEntry.table) || isSeriesClosedTable(targetEntry.table)) {
    throw createRouteError(409, 'POKER_PLAY_SERIES_CLOSED', 'Director moves only apply to active tournament tables.');
  }
  const sourceSeatNumber = normalizeSeatNumber(seatNumber);
  const sourceSeat = sourceEntry.seats.find((seat) => normalizeSeatNumber(seat?.seatNumber) === sourceSeatNumber) || null;
  if (!sourceSeat || !isSeatInPlay(sourceSeat)) {
    throw createRouteError(404, 'NOT_FOUND', 'The requested tournament seat is not active.');
  }
  if (sourceEntry?.hand && sourceEntry.hand.status === 'live' && sourceEntry?.hand?.state?.seatStates?.[String(sourceSeatNumber)]) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_MOVE_LIVE_HAND', 'Director seat moves are only allowed between hands.');
  }
  const movedSeat = moveTournamentSeriesSeat(
    deps,
    sourceSeat,
    targetEntry,
    requestAt,
    normalizeSeatNumber(targetSeatNumber)
  );
  if (!movedSeat) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_MOVE_FAILED', 'Unable to move the requested tournament seat.');
  }
  const targetReason = normalizeTrimmedString(reason, 'Director moved a tournament seat.');
  createDirectorAuditEvent(deps, {
    seriesId,
    tableId: sourceEntry.table.tableId,
    handId: sourceEntry?.hand?.handId || null,
    eventKind: 'director_seat_moved',
    payload: {
      sourceTableId: sourceEntry.table.tableId,
      sourceSeatNumber,
      targetTableId: targetEntry.table.tableId,
      targetSeatNumber: normalizeSeatNumber(movedSeat?.seatNumber),
      walletSubject: normalizeTrimmedString(sourceSeat?.walletSubject) || null,
      buyInOil: Number(sourceSeat?.buyInOil || 0),
      stackOil: Number(sourceSeat?.stackOil || 0),
    },
    atIso: requestAt,
    actorLabel,
    reason: targetReason,
  });
  return getSeriesDetail(deps, {
    seriesId,
    processAt: requestAt,
  });
}

function rebalanceTournamentSeriesByDirector(deps, { seriesId, reason, actorLabel = 'operator', asOf } = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const entries = getTournamentDirectorEntries(deps, seriesId, requestAt);
  const openEntries = entries.filter((entry) => !isSeriesClosedTable(entry?.table));
  const activeEntries = entries
    .filter((entry) => !isSeriesClosedTable(entry?.table))
    .map((entry) => ({
      ...entry,
      activeSeats: getActiveSeatRows(entry?.seats),
      live: !!(entry?.hand && entry.hand.status === 'live'),
    }));
  if (!activeEntries.length) {
    throw createRouteError(409, 'POKER_PLAY_SERIES_CLOSED', 'This tournament series is already closed.');
  }
  const directorPolicy = buildTournamentSeriesDirectorPolicy(activeEntries);
  if (directorPolicy.pendingBreakBlockedByLiveTable) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_REBALANCE_BLOCKED', 'The current break candidate must finish its live hand before rebalancing.');
  }
  const emptyOpenEntries = openEntries.filter((entry) => getActiveSeatRows(entry?.seats).length === 0);
  if (!directorPolicy.needsRebalance && !emptyOpenEntries.length) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_REBALANCE_NOT_NEEDED', 'This tournament series is already balanced.');
  }
  const beforeTableIds = new Set(activeEntries.map((entry) => String(entry?.table?.tableId || '')).filter(Boolean));
  const leadTableId = activeEntries[0]?.table?.tableId || '';
  if (directorPolicy.needsRebalance) {
    maybeRebalanceTournamentSeries(deps, activeEntries[0].table, activeEntries[0].seats, activeEntries[0].hand, requestAt);
  }
  for (const entry of emptyOpenEntries) {
    closeTournamentSeriesTable(deps, entry.table, {
      mergedIntoTableId: activeEntries[0]?.table?.tableId || null,
      atIso: requestAt,
    });
  }
  const detail = getSeriesDetail(deps, {
    seriesId,
    processAt: requestAt,
  });
  const afterTableIds = new Set(
    (Array.isArray(detail?.tables) ? detail.tables : [])
      .map((entry) => String(entry?.table?.tableId || ''))
      .filter(Boolean)
  );
  const closedTableIds = Array.from(beforeTableIds).filter((tableId) => !afterTableIds.has(tableId));
  const activeTableHandId = (Array.isArray(detail?.tables) ? detail.tables : [])
    .find((entry) => String(entry?.table?.tableId || '') === String(leadTableId || ''))?.hand?.handId
    || (Array.isArray(detail?.tables) ? detail.tables : [])[0]?.hand?.handId
    || null;
  createDirectorAuditEvent(deps, {
    seriesId,
    tableId: leadTableId,
    handId: activeTableHandId,
    eventKind: 'director_rebalanced',
    payload: {
      tableCountBefore: beforeTableIds.size,
      tableCountAfter: afterTableIds.size,
      closedTableIds,
      pendingBreakTableId: detail?.series?.pendingBreakTableId || null,
      targetTableCount: Number(detail?.series?.targetTableCount || 0),
    },
    atIso: requestAt,
    actorLabel,
    reason: normalizeTrimmedString(reason, 'Director rebalanced the tournament series.'),
  });
  return detail;
}

function breakTournamentSeriesTableByDirector(deps, {
  seriesId,
  tableId,
  reason,
  actorLabel = 'operator',
  asOf,
} = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const entries = getTournamentDirectorEntries(deps, seriesId, requestAt);
  const sourceEntry = getTournamentDirectorEntry(entries, tableId);
  if (!sourceEntry || isSeriesClosedTable(sourceEntry.table)) {
    throw createRouteError(404, 'NOT_FOUND', 'Tournament table not found.');
  }
  if (sourceEntry?.hand && sourceEntry.hand.status === 'live') {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BREAK_LIVE_HAND', 'Director table breaks are only allowed between hands.');
  }
  const destinationEntries = entries
    .filter((entry) => String(entry?.table?.tableId || '') !== String(sourceEntry.table.tableId || ''))
    .filter((entry) => !isSeriesClosedTable(entry?.table))
    .sort((left, right) => {
      const leftSeats = getActiveSeatRows(left?.seats).length;
      const rightSeats = getActiveSeatRows(right?.seats).length;
      if (leftSeats !== rightSeats) return rightSeats - leftSeats;
      return String(left?.table?.tableId || '').localeCompare(String(right?.table?.tableId || ''));
    });
  if (!destinationEntries.length) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BREAK_FAILED', 'No destination table is available for this table break.');
  }
  const movableSeats = sortSeatsForTournamentSeriesTransfer(getActiveSeatRows(sourceEntry.seats));
  if (!movableSeats.length) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BREAK_FAILED', 'The selected table has no active seats to move.');
  }
  let movedSeatCount = 0;
  for (const seat of movableSeats) {
    let moved = null;
    for (const destinationEntry of destinationEntries) {
      const currentDestinationSeats = deps.listPokerPlaySeatsByTable(destinationEntry.table.tableId);
      if (findNextOpenSeatNumber(destinationEntry.table, currentDestinationSeats) <= 0) {
        continue;
      }
      moved = moveTournamentSeriesSeat(deps, seat, {
        ...destinationEntry,
        seats: currentDestinationSeats,
        hand: deps.getCurrentPokerPlayHandForTable(destinationEntry.table.tableId),
      }, requestAt);
      if (moved) break;
    }
    if (!moved) {
      throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BREAK_FAILED', 'The destination tables do not have enough open seats for this break.');
    }
    movedSeatCount += 1;
  }
  closeTournamentSeriesTable(deps, sourceEntry.table, {
    mergedIntoTableId: destinationEntries[0]?.table?.tableId || null,
    atIso: requestAt,
  });
  const targetReason = normalizeTrimmedString(reason, 'Director broke a tournament table.');
  createDirectorAuditEvent(deps, {
    seriesId,
    tableId: sourceEntry.table.tableId,
    handId: sourceEntry?.hand?.handId || null,
    eventKind: 'director_table_broken',
    payload: {
      sourceTableId: sourceEntry.table.tableId,
      mergedIntoTableId: destinationEntries[0]?.table?.tableId || null,
      movedSeatCount,
    },
    atIso: requestAt,
    actorLabel,
    reason: targetReason,
  });
  return getSeriesDetail(deps, {
    seriesId,
    processAt: requestAt,
  });
}

function startScheduledBreaksForSeriesByDirector(deps, { seriesId, reason, actorLabel = 'operator', asOf } = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const entries = getTournamentDirectorEntries(deps, seriesId, requestAt);
  const activeEntries = entries
    .filter((entry) => !isSeriesClosedTable(entry?.table))
    .map((entry) => ({
      ...entry,
      activeSeats: getActiveSeatRows(entry?.seats),
    }))
    .filter((entry) => entry.activeSeats.length > 0);
  if (!activeEntries.length) {
    throw createRouteError(409, 'POKER_PLAY_SERIES_CLOSED', 'This tournament series is already closed.');
  }
  if (activeEntries.some((entry) => entry?.hand && entry.hand.status === 'live')) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_SERIES_BREAK_LIVE_HAND', 'Every tournament table must be between hands before a series break can start.');
  }
  if (activeEntries.some((entry) => {
    const activeBreak = getActiveScheduledBreakState(entry.table);
    return !!activeBreak && isScheduledBreakActive(entry.table, requestAt);
  })) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_SERIES_BREAK_START_UNAVAILABLE', 'A scheduled break is already active in this series.');
  }
  const targets = activeEntries.map((entry) => ({
    entry,
    scheduledBreak: hasPokerPlayTableStarted(entry.table, entry.hand) && !isScheduledTournamentPending(entry.table, requestAt)
      ? getNextScheduledBreak(entry.table)
      : null,
  }));
  if (targets.some((target) => !target.scheduledBreak)) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_SERIES_BREAK_START_UNAVAILABLE', 'Every active tournament table must share the next scheduled break before a series break can start.');
  }
  const breakKeys = new Set(targets.map((target) => [
    normalizeTrimmedString(target?.scheduledBreak?.breakId, ''),
    Number(target?.scheduledBreak?.afterHandNumber || 0),
    normalizeTrimmedString(target?.scheduledBreak?.label, ''),
    Number(target?.scheduledBreak?.durationMinutes || 0),
  ].join(':')));
  if (breakKeys.size !== 1) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_SERIES_BREAK_MISMATCH', 'Active tournament tables do not share the same next scheduled break.');
  }
  const targetReason = normalizeTrimmedString(reason, 'Director started the next scheduled break across the tournament series.');
  for (const target of targets) {
    activateTournamentScheduledBreak(deps, target.entry.table, target.entry.hand, target.scheduledBreak, requestAt, {
      actorRole: 'operator',
      eventKind: 'director_scheduled_break_started',
      auditPayload: {
        seriesId,
        actorLabel: normalizeTrimmedString(actorLabel, 'operator'),
        reason: targetReason,
        seriesWide: true,
      },
    });
  }
  const leadEntry = targets[0]?.entry || activeEntries[0] || null;
  createDirectorAuditEvent(deps, {
    seriesId,
    tableId: leadEntry?.table?.tableId || '',
    handId: leadEntry?.hand?.handId || null,
    eventKind: 'director_series_scheduled_break_started',
    payload: {
      tableIds: targets.map((target) => String(target?.entry?.table?.tableId || '')).filter(Boolean),
      breakId: targets[0]?.scheduledBreak?.breakId || null,
      label: targets[0]?.scheduledBreak?.label || null,
      afterHandNumber: Number(targets[0]?.scheduledBreak?.afterHandNumber || 0),
      durationMinutes: Number(targets[0]?.scheduledBreak?.durationMinutes || 0),
    },
    atIso: requestAt,
    actorLabel,
    reason: targetReason,
  });
  return getSeriesDetail(deps, {
    seriesId,
    processAt: requestAt,
  });
}

function endScheduledBreaksForSeriesByDirector(deps, { seriesId, reason, actorLabel = 'operator', asOf } = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const entries = getTournamentDirectorEntries(deps, seriesId, requestAt);
  const activeEntries = entries
    .filter((entry) => !isSeriesClosedTable(entry?.table))
    .map((entry) => ({
      ...entry,
      activeSeats: getActiveSeatRows(entry?.seats),
      activeBreak: getActiveScheduledBreakState(entry?.table),
    }))
    .filter((entry) => entry.activeSeats.length > 0);
  if (!activeEntries.length) {
    throw createRouteError(409, 'POKER_PLAY_SERIES_CLOSED', 'This tournament series is already closed.');
  }
  const activeBreakTargets = activeEntries.filter((entry) => !!entry.activeBreak && isScheduledBreakActive(entry.table, requestAt));
  if (!activeBreakTargets.length) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_SERIES_BREAK_END_UNAVAILABLE', 'No active scheduled break can be ended for this series.');
  }
  if (activeBreakTargets.length !== activeEntries.length) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_SERIES_BREAK_MISMATCH', 'Only part of the active field is currently on a scheduled break.');
  }
  const breakKeys = new Set(activeBreakTargets.map((target) => [
    normalizeTrimmedString(target?.activeBreak?.breakId, ''),
    Number(target?.activeBreak?.afterHandNumber || 0),
    normalizeTrimmedString(target?.activeBreak?.label, ''),
    Number(target?.activeBreak?.durationMinutes || 0),
  ].join(':')));
  if (breakKeys.size !== 1) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_SERIES_BREAK_MISMATCH', 'Active tournament tables do not share the same scheduled break state.');
  }
  const targetReason = normalizeTrimmedString(reason, 'Director ended the scheduled break early across the tournament series.');
  for (const target of activeBreakTargets) {
    clearTournamentScheduledBreak(deps, target.table, target.hand, target.activeBreak, requestAt, {
      actorRole: 'operator',
      eventKind: 'director_scheduled_break_ended',
      auditPayload: {
        seriesId,
        actorLabel: normalizeTrimmedString(actorLabel, 'operator'),
        reason: targetReason,
        endedEarly: true,
        seriesWide: true,
      },
    });
  }
  const leadEntry = activeBreakTargets[0] || activeEntries[0] || null;
  createDirectorAuditEvent(deps, {
    seriesId,
    tableId: leadEntry?.table?.tableId || '',
    handId: leadEntry?.hand?.handId || null,
    eventKind: 'director_series_scheduled_break_ended',
    payload: {
      tableIds: activeBreakTargets.map((target) => String(target?.table?.tableId || '')).filter(Boolean),
      breakId: activeBreakTargets[0]?.activeBreak?.breakId || null,
      label: activeBreakTargets[0]?.activeBreak?.label || null,
      afterHandNumber: Number(activeBreakTargets[0]?.activeBreak?.afterHandNumber || 0),
      durationMinutes: Number(activeBreakTargets[0]?.activeBreak?.durationMinutes || 0),
      endedEarly: true,
    },
    atIso: requestAt,
    actorLabel,
    reason: targetReason,
  });
  return getSeriesDetail(deps, {
    seriesId,
    processAt: requestAt,
  });
}

function advanceTournamentBlindLevelsForSeriesByDirector(deps, { seriesId, reason, actorLabel = 'operator', asOf } = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const entries = getTournamentDirectorEntries(deps, seriesId, requestAt);
  const activeEntries = entries
    .filter((entry) => !isSeriesClosedTable(entry?.table))
    .map((entry) => ({
      ...entry,
      activeSeats: getActiveSeatRows(entry?.seats),
    }))
    .filter((entry) => entry.activeSeats.length > 0);
  if (!activeEntries.length) {
    throw createRouteError(409, 'POKER_PLAY_SERIES_CLOSED', 'This tournament series is already closed.');
  }
  const previews = activeEntries.map((entry) => {
    const table = entry.table;
    const hand = entry.hand;
    const liveHand = !!(hand && hand.status === 'live');
    const currentState = table?.state && typeof table.state === 'object' ? table.state : {};
    const currentAdjustment = Math.max(0, normalizeOilAmount(currentState?.directorBlindLevelAdjustment, 0));
    const currentPending = Math.max(0, normalizeOilAmount(currentState?.directorBlindAdvancesPending, 0));
    const referenceHandNumber = liveHand
      ? Math.max(1, Number(hand?.handNumber || 1) + 1)
      : Math.max(1, Number(hand?.handNumber || table?.state?.activeHandNumber || 1));
    const currentPreview = resolveTournamentBlindProgress(table, referenceHandNumber, {
      includePendingAdvances: liveHand,
    });
    const nextState = liveHand
      ? {
        ...currentState,
        directorBlindLevelAdjustment: currentAdjustment,
        directorBlindAdvancesPending: currentPending + 1,
      }
      : {
        ...currentState,
        directorBlindLevelAdjustment: currentAdjustment + 1,
        directorBlindAdvancesPending: 0,
      };
    const nextPreview = resolveTournamentBlindProgress({
      ...table,
      state: nextState,
    }, referenceHandNumber, {
      includePendingAdvances: liveHand,
    });
    return {
      entry,
      liveHand,
      currentPreview,
      nextPreview,
    };
  });
  const currentKeys = new Set(previews.map((preview) => [
    Number(preview?.currentPreview?.blindLevel || 0),
    Number(preview?.currentPreview?.smallBlindOil || 0),
    Number(preview?.currentPreview?.bigBlindOil || 0),
  ].join(':')));
  const nextKeys = new Set(previews.map((preview) => [
    Number(preview?.nextPreview?.blindLevel || 0),
    Number(preview?.nextPreview?.smallBlindOil || 0),
    Number(preview?.nextPreview?.bigBlindOil || 0),
  ].join(':')));
  if (currentKeys.size !== 1 || nextKeys.size !== 1) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_SERIES_BLINDS_MISMATCH', 'Active tournament tables do not share the same blind progression state.');
  }
  if (previews.some((preview) => Number(preview?.nextPreview?.blindLevel || 0) <= Number(preview?.currentPreview?.blindLevel || 0))) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_SERIES_BLINDS_FINAL', 'The tournament series is already at the final blind level.');
  }
  const targetReason = normalizeTrimmedString(reason, 'Director advanced the tournament blinds across the series.');
  const payloads = previews.map((preview) => advanceTournamentBlindLevelByDirector(deps, {
    tableId: preview.entry.table.tableId,
    reason: targetReason,
    actorLabel,
    asOf: requestAt,
  }));
  createDirectorAuditEvent(deps, {
    seriesId,
    tableId: previews[0]?.entry?.table?.tableId || '',
    handId: payloads[0]?.hand?.handId || previews[0]?.entry?.hand?.handId || null,
    eventKind: 'director_series_blinds_advanced',
    payload: {
      tableIds: payloads.map((payload) => String(payload?.table?.tableId || '')).filter(Boolean),
      previousBlindLevel: Number(previews[0]?.currentPreview?.blindLevel || 0),
      nextBlindLevel: Number(previews[0]?.nextPreview?.blindLevel || 0),
      queuedTableCount: payloads.filter((payload) => Number(payload?.table?.summary?.pendingBlindAdvanceCount || 0) > 0).length,
      immediateTableCount: payloads.filter((payload) => Number(payload?.table?.summary?.pendingBlindAdvanceCount || 0) <= 0).length,
    },
    atIso: requestAt,
    actorLabel,
    reason: targetReason,
  });
  return getSeriesDetail(deps, {
    seriesId,
    processAt: requestAt,
  });
}

function startTournamentTableByDirector(deps, { tableId, reason, actorLabel = 'operator', asOf } = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  const table = synced.table;
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_START_UNAVAILABLE', 'Director start is only available for tournament tables.');
  }
  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
    status: 'open',
    state: {
      ...(table?.state && typeof table.state === 'object' ? table.state : {}),
      startedByDirectorAt: requestAt,
      startedByDirectorReason: normalizeTrimmedString(reason, 'Director started the tournament table.'),
    },
    updatedAt: requestAt,
  });
  const detail = syncPokerPlayTable(deps, updatedTable.tableId, { processAt: requestAt });
  createDirectorAuditEvent(deps, {
    seriesId: getTournamentSeriesRef(updatedTable).seriesId,
    tableId: updatedTable.tableId,
    handId: detail?.hand?.handId || null,
    eventKind: 'director_table_started',
    payload: {
      scheduledStartAt: getTournamentScheduledStartAt(updatedTable) || null,
    },
    atIso: requestAt,
    actorLabel,
    reason: normalizeTrimmedString(reason, 'Director started the tournament table.'),
  });
  return buildPokerPlayTablePayload(deps, detail.table, detail.seats, detail.hand, {
    session: null,
    req: null,
    processAt: requestAt,
  });
}

function advanceTournamentBlindLevelByDirector(deps, { tableId, reason, actorLabel = 'operator', asOf } = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  const table = synced.table;
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BLINDS_UNAVAILABLE', 'Director blind advancement is only available for tournament tables.');
  }
  const status = normalizeTrimmedString(table?.status, 'open').toLowerCase();
  if (['admin_closed', 'series_closed', 'completed'].includes(status)) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BLINDS_UNAVAILABLE', 'Director blind advancement is only available for active tournament tables.');
  }
  const liveHand = synced?.hand && synced.hand.status === 'live';
  const currentState = table?.state && typeof table.state === 'object' ? table.state : {};
  const currentAdjustment = Math.max(0, normalizeOilAmount(currentState?.directorBlindLevelAdjustment, 0));
  const currentPending = Math.max(0, normalizeOilAmount(currentState?.directorBlindAdvancesPending, 0));
  const referenceHandNumber = liveHand
    ? Math.max(1, Number(synced?.hand?.handNumber || 1) + 1)
    : Math.max(1, Number(synced?.hand?.handNumber || table?.state?.activeHandNumber || 1));
  const currentPreview = resolveTournamentBlindProgress(table, referenceHandNumber, {
    includePendingAdvances: liveHand,
  });
  const nextState = liveHand
    ? {
      ...currentState,
      directorBlindLevelAdjustment: currentAdjustment,
      directorBlindAdvancesPending: currentPending + 1,
    }
    : {
      ...currentState,
      directorBlindLevelAdjustment: currentAdjustment + 1,
      directorBlindAdvancesPending: 0,
    };
  const nextPreview = resolveTournamentBlindProgress({
    ...table,
    state: nextState,
  }, referenceHandNumber, {
    includePendingAdvances: liveHand,
  });
  if (Number(nextPreview.blindLevel || 0) <= Number(currentPreview.blindLevel || 0)) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BLINDS_FINAL', 'The tournament table is already at the final blind level.');
  }
  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
    smallBlindOil: liveHand ? table?.smallBlindOil : nextPreview.smallBlindOil,
    bigBlindOil: liveHand ? table?.bigBlindOil : nextPreview.bigBlindOil,
    state: {
      ...nextState,
      ...(liveHand ? {} : {
        currentBlindLevel: nextPreview.blindLevel,
        handsPerBlindLevel: nextPreview.handsPerBlindLevel,
      }),
    },
    updatedAt: requestAt,
  });
  const detail = syncPokerPlayTable(deps, updatedTable.tableId, { processAt: requestAt });
  createDirectorAuditEvent(deps, {
    seriesId: getTournamentSeriesRef(updatedTable).seriesId,
    tableId: updatedTable.tableId,
    handId: detail?.hand?.handId || synced?.hand?.handId || null,
    eventKind: 'director_blinds_advanced',
    payload: {
      appliedOnNextHand: !!liveHand,
      previousBlindLevel: Number(currentPreview.blindLevel || 0),
      nextBlindLevel: Number(nextPreview.blindLevel || 0),
      pendingBlindAdvanceCount: Math.max(0, normalizeOilAmount(detail?.table?.state?.directorBlindAdvancesPending, 0)),
    },
    atIso: requestAt,
    actorLabel,
    reason: normalizeTrimmedString(reason, liveHand ? 'Director queued the next blind increase.' : 'Director advanced the blind level.'),
  });
  return buildPokerPlayTablePayload(deps, detail.table, detail.seats, detail.hand, {
    session: null,
    req: null,
    processAt: requestAt,
  });
}

function startScheduledBreakByDirector(deps, { tableId, reason, actorLabel = 'operator', asOf } = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  const table = synced.table;
  const hand = synced.hand;
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BREAK_START_UNAVAILABLE', 'Director break control is only available for tournament tables.');
  }
  const status = normalizeTrimmedString(table?.status, 'open').toLowerCase();
  if (['admin_closed', 'series_closed', 'completed'].includes(status)) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BREAK_START_UNAVAILABLE', 'Director break control is only available for active tournament tables.');
  }
  if (!hasPokerPlayTableStarted(table, hand) || isScheduledTournamentPending(table, requestAt)) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BREAK_START_UNAVAILABLE', 'Director breaks are only available after the tournament has started.');
  }
  if (hand && hand.status === 'live') {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BREAK_LIVE_HAND', 'Director breaks can only start between hands.');
  }
  if (getActiveScheduledBreakState(table) && isScheduledBreakActive(table, requestAt)) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BREAK_START_UNAVAILABLE', 'A scheduled break is already active.');
  }
  const nextScheduledBreak = getNextScheduledBreak(table);
  if (!nextScheduledBreak) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BREAK_START_UNAVAILABLE', 'No remaining scheduled break is available for this table.');
  }
  const targetReason = normalizeTrimmedString(reason, 'Director started the next scheduled break.');
  const updatedTable = activateTournamentScheduledBreak(deps, table, hand, nextScheduledBreak, requestAt, {
    actorRole: 'operator',
    eventKind: 'director_scheduled_break_started',
    auditPayload: {
      seriesId: getTournamentSeriesRef(table).seriesId || null,
      actorLabel: normalizeTrimmedString(actorLabel, 'operator'),
      reason: targetReason,
    },
  });
  const detail = syncPokerPlayTable(deps, updatedTable.tableId, { processAt: requestAt });
  return buildPokerPlayTablePayload(deps, detail.table, detail.seats, detail.hand, {
    session: null,
    req: null,
    processAt: requestAt,
  });
}

function endScheduledBreakByDirector(deps, { tableId, reason, actorLabel = 'operator', asOf } = {}) {
  const requestAt = toProcessIso(deps, asOf);
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  const table = synced.table;
  const hand = synced.hand;
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BREAK_END_UNAVAILABLE', 'Director break control is only available for tournament tables.');
  }
  const activeBreak = getActiveScheduledBreakState(table);
  if (!activeBreak || !isScheduledBreakActive(table, requestAt)) {
    throw createRouteError(409, 'POKER_PLAY_DIRECTOR_BREAK_END_UNAVAILABLE', 'No active scheduled break can be ended on this table.');
  }
  const targetReason = normalizeTrimmedString(reason, 'Director ended the scheduled break early.');
  const updatedTable = clearTournamentScheduledBreak(deps, table, hand, activeBreak, requestAt, {
    actorRole: 'operator',
    eventKind: 'director_scheduled_break_ended',
    auditPayload: {
      seriesId: getTournamentSeriesRef(table).seriesId || null,
      actorLabel: normalizeTrimmedString(actorLabel, 'operator'),
      reason: targetReason,
      endedEarly: true,
    },
  });
  const detail = syncPokerPlayTable(deps, updatedTable.tableId, { processAt: requestAt });
  return buildPokerPlayTablePayload(deps, detail.table, detail.seats, detail.hand, {
    session: null,
    req: null,
    processAt: requestAt,
  });
}

function maybeActivateScheduledTournament(deps, table, seats, atIso) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    return {
      table,
      seats,
      changed: false,
    };
  }
  if (normalizeTrimmedString(table?.status, 'open') !== 'scheduled') {
    return {
      table,
      seats,
      changed: false,
    };
  }
  const scheduledStartAt = getTournamentScheduledStartAt(table);
  if (!scheduledStartAt) {
    return {
      table,
      seats,
      changed: false,
    };
  }
  const scheduledMs = Date.parse(scheduledStartAt);
  const atMs = Date.parse(String(atIso || ''));
  if (Number.isFinite(scheduledMs) && Number.isFinite(atMs) && atMs < scheduledMs && !normalizeTrimmedString(table?.state?.startedByDirectorAt)) {
    return {
      table,
      seats,
      changed: false,
    };
  }
  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
    status: 'open',
    state: {
      ...(table?.state && typeof table.state === 'object' ? table.state : {}),
      scheduledStartActivatedAt: atIso,
    },
    updatedAt: atIso,
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: updatedTable.tableId,
      handId: null,
      seatNumber: null,
      actorRole: normalizeTrimmedString(table?.state?.startedByDirectorAt) ? 'operator' : 'system',
      eventKind: normalizeTrimmedString(table?.state?.startedByDirectorAt) ? 'director_table_started' : 'scheduled_table_started',
      payload: {
        scheduledStartAt: scheduledStartAt || null,
        activatedAt: atIso,
      },
      createdAt: atIso,
    });
  }
  return {
    table: updatedTable,
    seats,
    changed: true,
  };
}

function syncScheduledBreakState(deps, table, hand, atIso) {
  if (normalizePokerPlayTableType(table?.tableType) !== 'tournament') {
    return { table, hand, changed: false, active: false };
  }
  const state = table?.state && typeof table.state === 'object' ? table.state : {};
  const activeBreak = getActiveScheduledBreakState(table);
  if (activeBreak) {
    if (isScheduledBreakActive(table, atIso)) {
      return { table, hand, changed: false, active: true };
    }
    const updatedTable = clearTournamentScheduledBreak(deps, table, hand, activeBreak, atIso);
    return { table: updatedTable, hand, changed: true, active: false };
  }
  if (!hasPokerPlayTableStarted(table, hand)) {
    return { table, hand, changed: false, active: false };
  }
  if (hand && hand.status === 'live') {
    return { table, hand, changed: false, active: false };
  }
  if (isScheduledTournamentPending(table, atIso)) {
    return { table, hand, changed: false, active: false };
  }
  const scheduledBreak = getTournamentScheduledBreaks(table).find((item) => (
    !getCompletedScheduledBreakAfterHands(table).includes(item.afterHandNumber)
      && item.afterHandNumber <= Math.max(0, normalizeOilAmount(table?.state?.lastSettledHandNumber, hand?.status === 'settled' ? hand.handNumber : 0))
  )) || null;
  if (!scheduledBreak) {
    return { table, hand, changed: false, active: false };
  }
  const updatedTable = activateTournamentScheduledBreak(deps, table, hand, scheduledBreak, atIso);
  return { table: updatedTable, hand, changed: true, active: true };
}

function syncPokerPlayTable(deps, tableId, { processAt } = {}) {
  let table = deps.getPokerPlayTableById(tableId);
  if (!table) return null;
  let seats = deps.listPokerPlaySeatsByTable(table.tableId);
  let hand = deps.getCurrentPokerPlayHandForTable(table.tableId);
  const atIso = toProcessIso(deps, processAt);
  const manualDirectorOnly = table?.state?.manualDirectorOnly === true;
  let presence = reconcilePokerPlaySeatPresence(deps, table, seats, hand, atIso);
  table = presence.table;
  seats = presence.seats;
  hand = presence.hand;
  const scheduledActivation = maybeActivateScheduledTournament(deps, table, seats, atIso);
  table = scheduledActivation.table;
  seats = scheduledActivation.seats;
  hand = deps.getCurrentPokerPlayHandForTable(table.tableId);
  if (isTablePaused(table) || isTableAdminClosed(table)) {
    return { table, seats, hand };
  }
  let waitlistPromotion = promoteWaitlistEntriesIntoOpenSeats(deps, table, seats, hand, atIso);
  table = waitlistPromotion.table;
  seats = waitlistPromotion.seats;
  if (isScheduledTournamentPending(table, atIso)) {
    return { table, seats, hand };
  }
  let scheduledBreakState = syncScheduledBreakState(deps, table, hand, atIso);
  table = scheduledBreakState.table;
  hand = scheduledBreakState.hand;
  if (scheduledBreakState.active) {
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
        const autoActDecision = resolveSeatAutoActDecision(deps, table, hand, seats, actingSeat);
        if (autoActDecision?.actionKind) {
          const outcome = applyPokerPlayActionToHandState({
            table,
            handState: hand.state,
            seatNumber: actingSeat,
            actionKind: autoActDecision.actionKind,
            amountOil: autoActDecision.amountOil,
            nowIso: atIso,
          });
          deps.createPokerPlayAction({
            tableId: table.tableId,
            handId: hand.handId,
            seatNumber: actingSeat,
            actorRole: 'agent',
            actionKind: autoActDecision.actionKind,
            amountOil: Number(outcome.normalizedAmountOil || outcome.debitOil || 0),
            payload: {
              reason: 'auto_act',
              automationMode: autoActDecision.mode,
              proposalId: autoActDecision.proposalId || null,
              requestedAmountOil: Number(autoActDecision.amountOil || 0),
            },
            createdAt: atIso,
          });
          deps.createPokerPlayMessage({
            tableId: table.tableId,
            handId: hand.handId,
            seatNumber: actingSeat,
            authorRole: 'agent',
            body: autoActDecision.mode === 'seat_agent_auto' && autoActDecision.proposalBody
              ? `Auto-act executes the saved worker line: ${autoActDecision.proposalBody}`
              : `Auto-act ${buildActionNarrative(autoActDecision.actionKind, outcome.normalizedAmountOil || outcome.debitOil || 0)}.`,
            createdAt: atIso,
          });
          if (typeof deps.createPokerPlayAuditEvent === 'function') {
            deps.createPokerPlayAuditEvent({
              tableId: table.tableId,
              handId: hand.handId,
              seatNumber: actingSeat,
              actorRole: 'agent',
              eventKind: 'auto_act_executed',
              payload: {
                automationMode: autoActDecision.mode,
                actionKind: autoActDecision.actionKind,
                amountOil: Number(outcome.normalizedAmountOil || outcome.debitOil || 0),
                proposalId: autoActDecision.proposalId || null,
                reason: autoActDecision.reason || 'auto_act',
              },
              createdAt: atIso,
            });
          }
          table = upsertPokerPlaySeatAutoActPolicy(deps, table, autoActDecision.seat.walletSubject, {
            lastExecutedAt: atIso,
            lastExecutedHandId: hand.handId,
            lastExecutedActionKind: autoActDecision.actionKind,
            lastProposalId: autoActDecision.proposalId || null,
          }, atIso);
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
        const timeBankRemainingSeconds = getSeatTimeBankRemainingSeconds(table, actingSeat);
        if (timeBankRemainingSeconds > 0) {
          const updated = applyTimeBankExtension(deps, {
            table,
            hand,
            seatNumber: actingSeat,
            consumeSeconds: timeBankRemainingSeconds,
            requestAt: atIso,
            actorRole: 'agent',
            actorLabel: seat?.displayName || formatSeatLabel(actingSeat),
            auto: true,
          });
          table = updated.table;
          hand = updated.hand;
          continue;
        }
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
      const seatsBeforeSettlement = Array.isArray(seats) ? seats.slice() : [];
      seats = upsertSeatStacksFromHand(deps, table, seats, hand, atIso);
      seats = settleTournamentKnockoutBounties(deps, table, seatsBeforeSettlement, seats, hand, atIso);
      seats = settleQueuedCashouts(deps, table, seats, hand, atIso);
      waitlistPromotion = promoteWaitlistEntriesIntoOpenSeats(deps, table, seats, hand, atIso);
      table = waitlistPromotion.table;
      seats = waitlistPromotion.seats;
      const nextTableState = {
        ...(table.state && typeof table.state === 'object' ? table.state : {}),
        lastButtonSeat: normalizeSeatNumber(hand?.state?.buttonSeat) || normalizeSeatNumber(table?.state?.lastButtonSeat),
        lastSettledAt: atIso,
        lastSettledHandId: hand.handId,
        lastSettledHandNumber: Number(hand?.handNumber || 0),
      };
      table = deps.upsertPokerPlayTable({
        ...table,
        state: nextTableState,
        updatedAt: atIso,
      });

      const multiFlightBag = maybeBagMultiFlightFlight(deps, table, seats, hand, atIso);
      table = multiFlightBag.table;
      seats = multiFlightBag.seats;
      hand = multiFlightBag.hand;
      if (multiFlightBag.bagged) break;

      const tournamentSettlement = settleTournamentIfComplete(deps, table, seats, hand, atIso);
      table = tournamentSettlement.table;
      seats = tournamentSettlement.seats;
      if (tournamentSettlement.completed) break;

      if (!manualDirectorOnly) {
        const seriesRebalance = maybeRebalanceTournamentSeries(deps, table, seats, hand, atIso);
        table = seriesRebalance.table;
        seats = seriesRebalance.seats;
        hand = seriesRebalance.hand;
        if (seriesRebalance.closed) break;
      }

      scheduledBreakState = syncScheduledBreakState(deps, table, hand, atIso);
      table = scheduledBreakState.table;
      hand = scheduledBreakState.hand;
      if (scheduledBreakState.active) break;
      if (scheduledBreakState.changed) continue;

      const readySeats = getActiveSeatRows(seats);
      if (readySeats.length >= getPokerPlayAutoStartSeatTarget(table, hand)) {
        const started = startNewTableHand(deps, table, seats, hand, atIso);
        table = started.table;
        hand = started.hand;
        continue;
      }
      break;
    }

    if (!hand || hand.status !== 'live') {
      waitlistPromotion = promoteWaitlistEntriesIntoOpenSeats(deps, table, seats, hand, atIso);
      table = waitlistPromotion.table;
      seats = waitlistPromotion.seats;
      if (!manualDirectorOnly) {
        const seriesRebalance = maybeRebalanceTournamentSeries(deps, table, seats, hand, atIso);
        table = seriesRebalance.table;
        seats = seriesRebalance.seats;
        hand = seriesRebalance.hand;
        if (seriesRebalance.closed) break;
      }
    }

    scheduledBreakState = syncScheduledBreakState(deps, table, hand, atIso);
    table = scheduledBreakState.table;
    hand = scheduledBreakState.hand;
    if (scheduledBreakState.active) break;
    if (scheduledBreakState.changed) continue;

    const multiFlightBag = maybeBagMultiFlightFlight(deps, table, seats, hand, atIso);
    table = multiFlightBag.table;
    seats = multiFlightBag.seats;
    hand = multiFlightBag.hand;
    if (multiFlightBag.bagged) break;

    if ((!hand || hand.status !== 'live') && getActiveSeatRows(seats).length >= getPokerPlayAutoStartSeatTarget(table, hand)) {
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

function buildPokerPlayTablePayload(deps, table, seats, hand, { session, req, processAt, publicViewer = false, seatAgentMode = '' } = {}) {
  const walletBinding = (!publicViewer && session) ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const viewerHouseId = (!publicViewer && session) ? getSessionHouseId(session) : '';
  const viewerSeat = walletBinding?.walletSubject
    ? deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject)
    : null;
  const inviteAuthorization = resolvePokerPlayInviteAuthorization(table, {
    walletSubject: walletBinding?.walletSubject || '',
    houseId: viewerHouseId,
    viewerSeat,
    inviteCode: parsePokerPlayInviteCode(req),
  });
  const messages = hand ? deps.listPokerPlayMessagesByHand(hand.handId) : [];
  const actions = hand ? deps.listPokerPlayActionsByHand(hand.handId) : [];
  const oilBalance = walletBinding?.walletSubject ? deps.computeOilBalance(walletBinding.walletSubject) : null;
  const pokerPolicy = walletBinding?.walletSubject
    ? buildPokerPlayWalletPolicySummary(deps, walletBinding.walletSubject, { processAt })
    : null;
  const workerSeatAgentMode = normalizeTrimmedString(seatAgentMode).toLowerCase() === 'worker';
  const agentProposal = viewerSeat && hand
    ? getLatestSeatAgentProposal(deps, hand.handId, viewerSeat.seatNumber)
    : null;
  const suggestion = !workerSeatAgentMode && viewerSeat && hand && hand.status === 'live'
    ? derivePokerPlayAgentSuggestion({ table, handState: hand.state, seatNumber: viewerSeat.seatNumber })
    : null;
  const review = buildPokerPlayReviewSummary(deps, table, seats, hand, walletBinding?.walletSubject || '');
  const waitlistEntries = listTableWaitlistEntries(deps, table, { status: 'waiting' });
  const waitlist = buildWaitlistSummary(waitlistEntries, walletBinding?.walletSubject || '');
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
  const chopProposal = seriesRef.seriesId
    ? getLatestSeriesChopProposalSummary(deps, seriesRef.seriesId, {
      viewerWalletSubject: walletBinding?.walletSubject || '',
      publicViewer,
    })
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
  const baseTableSummary = computeTableSummary(table, seats, hand, viewerSeat);
  const tableSummary = {
    ...baseTableSummary,
    waitlistCount: Number(waitlist?.count || 0),
    viewerWaitlistPosition: waitlist?.viewerPosition ?? null,
    ...(series
      ? {
        prizePoolOil: Number(series?.prizePoolOil || 0),
        bountyModel: series?.bountyModel || 'none',
        bountyPerEntryOil: Number(series?.bountyPerEntryOil || 0),
        bountyPoolOil: Number(series?.bountyPoolOil || 0),
        totalBountyAwardedOil: Number(series?.totalBountyAwardedOil || 0),
        activeBountyPoolOil: Number(series?.activeBountyPoolOil || 0),
        payoutModel: series?.payoutModel || '',
        paidPlaces: Number(series?.paidPlaces || 0),
        payouts: cloneJson(series?.payouts, []),
        multiFlightFestivalParentId: series?.multiFlightFestivalParentId || baseTableSummary?.multiFlightFestivalParentId || null,
        multiFlightFestivalTitle: series?.multiFlightFestivalTitle || baseTableSummary?.multiFlightFestivalTitle || null,
        multiFlightStage: series?.multiFlightStage || baseTableSummary?.multiFlightStage || null,
        multiFlightFlightCode: series?.multiFlightFlightCode || baseTableSummary?.multiFlightFlightCode || null,
        multiFlightFlightLabel: series?.multiFlightFlightLabel || baseTableSummary?.multiFlightFlightLabel || null,
        multiFlightMergeSeriesId: series?.multiFlightMergeSeriesId || baseTableSummary?.multiFlightMergeSeriesId || null,
        multiFlightMergeSeriesTitle: series?.multiFlightMergeSeriesTitle || baseTableSummary?.multiFlightMergeSeriesTitle || null,
        multiFlightAdvanceSeatCount: Number(series?.multiFlightAdvanceSeatCount || baseTableSummary?.multiFlightAdvanceSeatCount || 0),
        multiFlightAdvancedSeatCount: Number(series?.multiFlightAdvancedSeatCount || baseTableSummary?.multiFlightAdvancedSeatCount || 0),
        multiFlightImportedFlightCount: Number(series?.multiFlightImportedFlightCount || baseTableSummary?.multiFlightImportedFlightCount || 0),
        multiFlightImportedEntryCount: Number(series?.multiFlightImportedEntryCount || baseTableSummary?.multiFlightImportedEntryCount || 0),
        multiFlightImportedPrizePoolOil: Number(series?.multiFlightImportedPrizePoolOil || baseTableSummary?.multiFlightImportedPrizePoolOil || 0),
        multiFlightImportedBountyPoolOil: Number(series?.multiFlightImportedBountyPoolOil || baseTableSummary?.multiFlightImportedBountyPoolOil || 0),
        multiFlightImportedCarriedStackTotalOil: Number(series?.multiFlightImportedCarriedStackTotalOil || baseTableSummary?.multiFlightImportedCarriedStackTotalOil || 0),
      }
      : {}),
  };
  const cashMovement = buildCashMovementSummary(deps, table, seats, hand, viewerSeat, {
    walletSubject: walletBinding?.walletSubject || '',
    houseId: viewerHouseId,
    processAt,
    publicViewer,
  });
  const viewerAutoAct = (!publicViewer && walletBinding?.walletSubject)
    ? buildPokerPlayAutoActSummary(table, walletBinding.walletSubject)
    : null;
  const study = (!publicViewer && walletBinding?.walletSubject)
    ? buildStudySummaryForTable(deps, {
      table,
      seats,
      hand,
      walletSubject: walletBinding.walletSubject,
    })
    : null;

  return {
    viewerMode: publicViewer ? 'public' : 'player',
    table: {
      ...sanitizePokerPlayTableRecord(table),
      summary: tableSummary,
      access: {
        mode: inviteAuthorization.access.mode,
        inviteOnly: inviteAuthorization.access.inviteOnly,
        viewerAuthorized: !publicViewer && inviteAuthorization.authorized,
        viewerAuthorizedByInvite: !publicViewer && inviteAuthorization.byInvite,
        viewerCanShareInvite: !publicViewer && inviteAuthorization.byCreator,
        inviteCode: !publicViewer && inviteAuthorization.byCreator ? inviteAuthorization.access.inviteCode : null,
        inviteJoinPath: !publicViewer && inviteAuthorization.byCreator && inviteAuthorization.access.inviteCode
          ? `/poker/play/tables/${encodeURIComponent(table.tableId)}?inviteCode=${encodeURIComponent(inviteAuthorization.access.inviteCode)}`
          : null,
      },
    },
    series,
    chopProposal,
    waitlist,
    houseId: publicViewer ? null : viewerHouseId,
    wallet: walletBinding?.submitterWallet || null,
    oilBalance,
    pokerPolicy,
    cashMovement,
    study,
    mySeat: viewerSeat
      ? {
        ...summarizeSeat(viewerSeat),
        blindObligation: getSeatBlindObligation(deps, table, viewerSeat),
        waitlistPromotion: getSeatWaitlistPromotion(deps, table, viewerSeat),
        autoAct: viewerAutoAct,
      }
      : null,
    seats: (Array.isArray(seats) ? seats : [])
      .map((seat) => summarizeSeat(seat))
      .sort((left, right) => left.seatNumber - right.seatNumber),
    hand: sanitizeHandForViewer({ table, hand, seats, viewerSeatNumber: viewerSeat?.seatNumber || 0 }),
    messages: sanitizeMessagesForViewer(messages, viewerSeat?.seatNumber || 0),
    actions: sanitizeActions(actions, seats),
    review,
    agentProposal,
    suggestion,
    processAt: toProcessIso(deps, processAt),
  };
}

function buildPokerPlayLobbyPayload(deps, { session, req, processAt, publicViewer = false } = {}) {
  const walletBinding = (!publicViewer && session) ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const viewerHouseId = (!publicViewer && session) ? getSessionHouseId(session) : '';
  const oilBalance = walletBinding?.walletSubject ? deps.computeOilBalance(walletBinding.walletSubject) : null;
  const pokerPolicy = walletBinding?.walletSubject
    ? buildPokerPlayWalletPolicySummary(deps, walletBinding.walletSubject, { processAt })
    : null;
  const entries = deps.listPokerPlayTables()
    .filter((table) => !isSeriesClosedTable(table))
    .map((table) => {
      const synced = syncPokerPlayTable(deps, table.tableId, { processAt });
      const viewerSeat = walletBinding?.walletSubject
        ? deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject)
        : null;
      const summary = computeTableSummary(synced.table, synced.seats, synced.hand, viewerSeat);
      const waitlist = buildWaitlistSummary(
        listTableWaitlistEntries(deps, synced.table, { status: 'waiting' }),
        walletBinding?.walletSubject || ''
      );
      const inviteAuthorization = resolvePokerPlayInviteAuthorization(synced.table, {
        walletSubject: walletBinding?.walletSubject || '',
        houseId: viewerHouseId,
        viewerSeat,
      });
      return {
        table: synced.table,
        seats: synced.seats,
        hand: synced.hand,
        viewerSeat,
        inviteAuthorization,
        summary: {
          ...summary,
          waitlistCount: Number(waitlist?.count || 0),
          viewerWaitlistPosition: waitlist?.viewerPosition ?? null,
        },
      };
    })
    .filter((entry) => !entry?.inviteAuthorization?.access?.inviteOnly || !!entry?.inviteAuthorization?.bySeat || !!entry?.inviteAuthorization?.byCreator);
  const items = entries.map((entry) => {
    const seriesRef = getTournamentSeriesRef(entry.table);
    return {
      ...sanitizePokerPlayTableRecord(entry.table),
      seriesId: seriesRef.seriesId || null,
      seriesTitle: seriesRef.seriesTitle || null,
      summary: entry.summary,
      accessMode: entry?.inviteAuthorization?.access?.mode || 'public',
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
          inviteAuthorization: resolvePokerPlayInviteAuthorization(seriesEntry.table, {
            walletSubject: walletBinding?.walletSubject || '',
            houseId: viewerHouseId,
            viewerSeat: currentViewerSeat,
          }),
          summary: computeTableSummary(seriesEntry.table, seriesEntry.seats, seriesEntry.hand, currentViewerSeat),
        };
      }).filter((seriesEntry) => !seriesEntry?.inviteAuthorization?.access?.inviteOnly || !!seriesEntry?.inviteAuthorization?.bySeat || !!seriesEntry?.inviteAuthorization?.byCreator));
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
    houseId: publicViewer ? null : viewerHouseId,
    wallet: walletBinding?.submitterWallet || null,
    oilBalance,
    pokerPolicy,
    processAt: toProcessIso(deps, processAt),
  };
}

function buildPokerPlaySchedulePayload(deps, { session, req, processAt, publicViewer = false, days = 7 } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const walletBinding = (!publicViewer && session) ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const viewerHouseId = (!publicViewer && session) ? getSessionHouseId(session) : '';
  const oilBalance = walletBinding?.walletSubject ? deps.computeOilBalance(walletBinding.walletSubject) : null;
  const windowEndAt = addHoursToIso(requestAt, Math.max(1, normalizeOilAmount(days, 7)) * 24);
  const items = deps.listPokerPlayTables()
    .map((table) => syncPokerPlayTable(deps, table.tableId, { processAt: requestAt }))
    .filter((entry) => normalizePokerPlayTableType(entry?.table?.tableType) === 'tournament')
    .filter((entry) => !!getTournamentScheduledStartAt(entry?.table))
    .filter((entry) => !isSeriesClosedTable(entry?.table))
    .map((entry) => {
      const viewerSeat = walletBinding?.walletSubject
        ? deps.getPokerPlaySeatByWalletSubject(entry.table.tableId, walletBinding.walletSubject)
        : null;
      const inviteAuthorization = resolvePokerPlayInviteAuthorization(entry.table, {
        walletSubject: walletBinding?.walletSubject || '',
        houseId: viewerHouseId,
        viewerSeat,
        inviteCode: parsePokerPlayInviteCode(req),
      });
      const summary = computeTableSummary(entry.table, entry.seats, entry.hand, viewerSeat);
      const waitlistEntries = listTableWaitlistEntries(deps, entry.table, { status: 'waiting' });
      const waitlist = buildWaitlistSummary(waitlistEntries, walletBinding?.walletSubject || '');
      const scheduleTemplate = getTournamentScheduleTemplate(entry.table);
      return {
        ...entry,
        viewerSeat,
        inviteAuthorization,
        summary: {
          ...summary,
          waitlistCount: Number(waitlist?.count || 0),
          viewerWaitlistPosition: waitlist?.viewerPosition ?? null,
        },
        waitlist,
        scheduleTemplate,
      };
    })
    .filter((entry) => !entry?.inviteAuthorization?.access?.inviteOnly || !!entry?.inviteAuthorization?.bySeat || !!entry?.inviteAuthorization?.byCreator)
    .filter((entry) => {
      const scheduledStartAt = getTournamentScheduledStartAt(entry?.table);
      return !!scheduledStartAt
        && compareIsoAsc(scheduledStartAt, windowEndAt) <= 0
        && (
          compareIsoAsc(scheduledStartAt, requestAt) >= 0
            || !!entry?.summary?.lateRegistrationOpen
            || !!entry?.summary?.scheduledBreakActive
            || !!entry?.summary?.liveHand
        );
    })
    .sort((left, right) => {
      const startDelta = compareIsoAsc(getTournamentScheduledStartAt(left?.table), getTournamentScheduledStartAt(right?.table));
      if (startDelta !== 0) return startDelta;
      return String(left?.table?.title || '').localeCompare(String(right?.table?.title || ''));
    })
    .map((entry) => {
      const scheduledStartAt = getTournamentScheduledStartAt(entry.table);
      const seriesRef = getTournamentSeriesRef(entry.table);
      const viewerRegistered = !!entry.viewerSeat;
      const viewerWaitlisted = !!entry.waitlist?.viewerQueued;
      const registrationOpen = !!entry.summary?.scheduledStartPending || !entry.summary?.liveHand || !!entry.summary?.lateRegistrationOpen;
      const viewerSeatStatus = normalizeTrimmedString(entry?.viewerSeat?.status).toLowerCase();
      const canUnregister = viewerRegistered && (
        !hasPokerPlayTableStarted(entry.table, entry.hand)
        || (!!entry.hand && entry.hand.status === 'live' && viewerSeatStatus === 'registered')
      );
      let registrationStatus = 'closed';
      if (viewerRegistered) registrationStatus = 'registered';
      else if (viewerWaitlisted) registrationStatus = 'waitlisted';
      else if (registrationOpen && Number(entry.summary?.openSeatCount || 0) > 0) registrationStatus = 'open';
      else if (registrationOpen) registrationStatus = 'waitlist';
      const nextBreakAfterHandNumber = Number(entry.summary?.nextScheduledBreakAfterHandNumber || 0);
      return {
        tableId: String(entry.table.tableId || ''),
        title: String(entry.table.title || 'Tournament'),
        tableStatus: String(entry.table.status || 'open'),
        seriesId: seriesRef.seriesId || null,
        seriesTitle: seriesRef.seriesTitle || null,
        scheduledStartAt,
        day: scheduledStartAt.slice(0, 10),
        buyInOil: Number(entry.table?.buyInOil || 0),
        openSeatCount: Number(entry.summary?.openSeatCount || 0),
        waitlistCount: Number(entry.summary?.waitlistCount || 0),
        entryCount: Number(entry.summary?.entryCount || 0),
        registrationStatus,
        registrationOpen,
        viewerRegistered,
        viewerWaitlisted,
        lateRegistrationOpen: !!entry.summary?.lateRegistrationOpen,
        scheduleTemplateId: entry.scheduleTemplate?.templateId || null,
        scheduleTemplateTitle: entry.scheduleTemplate?.title || null,
        scheduleRecurrenceLabel: entry.scheduleTemplate?.recurrenceLabel || null,
        scheduledBreakCount: Number(entry.summary?.scheduledBreakCount || 0),
        scheduledBreakActive: !!entry.summary?.scheduledBreakActive,
        scheduledBreakUntilAt: entry.summary?.scheduledBreakUntilAt || null,
        nextScheduledBreakAfterHandNumber: nextBreakAfterHandNumber,
        nextScheduledBreakLabel: entry.summary?.nextScheduledBreakLabel || null,
        actions: {
          register: registrationStatus === 'open'
            ? {
              method: 'POST',
              path: `/api/poker/play/tables/${encodeURIComponent(entry.table.tableId)}/sit`,
            }
            : null,
          waitlist: registrationStatus === 'waitlist'
            ? {
              method: 'POST',
              path: `/api/poker/play/tables/${encodeURIComponent(entry.table.tableId)}/waitlist`,
            }
            : null,
          unregister: canUnregister
            ? {
              method: 'POST',
              path: `/api/poker/play/tables/${encodeURIComponent(entry.table.tableId)}/leave`,
            }
            : null,
          leaveWaitlist: viewerWaitlisted
            ? {
              method: 'DELETE',
              path: `/api/poker/play/tables/${encodeURIComponent(entry.table.tableId)}/waitlist`,
            }
            : null,
        },
        links: {
          table: `/poker/play/tables/${encodeURIComponent(entry.table.tableId)}`,
          timeline: seriesRef.seriesId ? `/poker/play/series/${encodeURIComponent(seriesRef.seriesId)}/timeline` : null,
        },
      };
    });

  const templates = Array.from(items.reduce((map, item) => {
    const templateId = normalizePokerPlayScheduleTemplateId(item?.scheduleTemplateId);
    if (!templateId) return map;
    const existing = map.get(templateId) || {
      templateId,
      title: normalizePokerPlayScheduleTemplateTitle(item?.scheduleTemplateTitle, item?.title),
      recurrenceLabel: normalizePokerPlayScheduleRecurrenceLabel(item?.scheduleRecurrenceLabel),
      upcomingCount: 0,
      nextStartAt: null,
      eventTableIds: [],
    };
    existing.upcomingCount += 1;
    existing.eventTableIds.push(String(item?.tableId || ''));
    if (!existing.nextStartAt || compareIsoAsc(item?.scheduledStartAt, existing.nextStartAt) < 0) {
      existing.nextStartAt = item?.scheduledStartAt || null;
    }
    map.set(templateId, existing);
    return map;
  }, new Map()).values())
    .sort((left, right) => {
      const nextDelta = compareIsoAsc(left?.nextStartAt, right?.nextStartAt);
      if (nextDelta !== 0) return nextDelta;
      return String(left?.title || '').localeCompare(String(right?.title || ''));
    });

  const dayMap = new Map();
  for (const item of items) {
    if (!dayMap.has(item.day)) {
      dayMap.set(item.day, []);
    }
    dayMap.get(item.day).push(item);
  }
  const scheduleDays = Array.from(dayMap.entries())
    .sort((left, right) => compareIsoAsc(left[0], right[0]))
    .map(([day, dayItems]) => ({
      day,
      eventCount: dayItems.length,
      items: dayItems,
    }));

  return {
    viewerMode: publicViewer ? 'public' : 'player',
    houseId: publicViewer ? null : viewerHouseId,
    wallet: walletBinding?.submitterWallet || null,
    oilBalance,
    summary: {
      dayCount: scheduleDays.length,
      templateCount: templates.length,
      eventCount: items.length,
      registeredCount: items.filter((item) => item.viewerRegistered).length,
      waitlistedCount: items.filter((item) => item.viewerWaitlisted).length,
      nextStartAt: items[0]?.scheduledStartAt || null,
    },
    templates,
    days: scheduleDays,
    processAt: requestAt,
  };
}

function buildPokerPlayAdminScheduleTemplatesPayload(deps, { processAt } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const templates = (typeof deps.listPokerPlayScheduleTemplates === 'function'
    ? deps.listPokerPlayScheduleTemplates()
    : [])
    .map((template) => {
      const items = deps.listPokerPlayTables()
        .filter((table) => normalizePokerPlayTableType(table?.tableType) === 'tournament')
        .filter((table) => normalizePokerPlayScheduleTemplateId(table?.rules?.scheduleTemplateId || table?.summary?.scheduleTemplateId || '') === template.templateId)
        .map((table) => syncPokerPlayTable(deps, table.tableId, { processAt: requestAt }))
        .filter((entry) => !isSeriesClosedTable(entry?.table))
        .map((entry) => {
          const summary = computeTableSummary(entry.table, entry.seats, entry.hand, null);
          return {
            tableId: String(entry.table.tableId || ''),
            title: String(entry.table.title || template.title || 'Tournament'),
            tableStatus: String(entry.table.status || 'open'),
            scheduledStartAt: getTournamentScheduledStartAt(entry.table) || null,
            entryCount: Number(summary?.entryCount || 0),
            openSeatCount: Number(summary?.openSeatCount || 0),
            waitlistCount: Number(summary?.waitlistCount || 0),
            links: {
              table: `/poker/play/tables/${encodeURIComponent(entry.table.tableId)}`,
            },
          };
        })
        .sort((left, right) => compareIsoAsc(left?.scheduledStartAt, right?.scheduledStartAt));
      return {
        templateId: template.templateId,
        title: template.title,
        status: normalizePokerPlayScheduleTemplateStatus(template.status),
        recurrenceKind: template.recurrenceKind,
        recurrenceIntervalHours: Number(template.recurrenceIntervalHours || 0),
        recurrenceLabel: template.recurrenceLabel,
        firstStartAt: template.firstStartAt,
        eventCount: Math.max(1, Number(template.eventCount || 1)),
        generatedEventCount: items.length,
        nextStartAt: items[0]?.scheduledStartAt || null,
        config: cloneJson(template.config, {}),
        cancelledAt: template.cancelledAt || null,
        items,
      };
    })
    .sort((left, right) => compareIsoAsc(left?.firstStartAt, right?.firstStartAt));
  return {
    summary: {
      templateCount: templates.length,
      eventCount: templates.reduce((sum, item) => sum + Number(item?.generatedEventCount || 0), 0),
      nextStartAt: templates.flatMap((item) => item?.items?.[0]?.scheduledStartAt ? [item.items[0].scheduledStartAt] : [])[0] || null,
    },
    templates,
    processAt: requestAt,
  };
}

function createScheduleTemplate(deps, { body, processAt } = {}) {
  if (typeof deps.upsertPokerPlayScheduleTemplate !== 'function' || typeof deps.listPokerPlayScheduleTemplates !== 'function') {
    throw createRouteError(500, 'POKER_PLAY_SCHEDULE_TEMPLATE_UNAVAILABLE', 'Schedule template storage is unavailable.');
  }
  const requestAt = toProcessIso(deps, processAt || body?.asOf);
  const normalizedTitle = normalizePokerPlayScheduleTemplateTitle(body?.title, body?.scheduleTemplateTitle || 'Scheduled Tournament');
  if (!normalizedTitle) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Schedule template title is required.');
  }
  const firstStartAt = normalizeIsoString(body?.firstStartAt || body?.scheduledStartAt);
  if (!firstStartAt) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'A valid firstStartAt ISO timestamp is required.');
  }
  if (compareIsoAsc(firstStartAt, requestAt) < 0) {
    throw createRouteError(409, 'POKER_PLAY_SCHEDULE_TEMPLATE_PAST_START', 'Schedule templates must start at or after the requested process time.');
  }
  const recurrenceKind = normalizePokerPlayScheduleRecurrenceKind(body?.recurrenceKind || body?.cadence);
  const recurrenceIntervalHours = getPokerPlayScheduleRecurrenceIntervalHours(recurrenceKind);
  const recurrenceLabel = normalizePokerPlayScheduleRecurrenceLabel(
    body?.recurrenceLabel,
    buildPokerPlayScheduleRecurrenceLabel(recurrenceKind, firstStartAt)
  );
  const eventCount = Math.max(1, Math.min(12, normalizeOilAmount(body?.eventCount, 3)));
  const templateId = normalizePokerPlayScheduleTemplateId(
    body?.templateId,
    `pktpl_${slugifySegment(normalizedTitle, 'schedule')}_${deps.randomHex(6)}`
  );
  const tableConfig = {
    tableType: 'tournament',
    title: normalizedTitle,
    smallBlindOil: body?.smallBlindOil,
    bigBlindOil: body?.bigBlindOil,
    buyInOil: body?.buyInOil,
    maxSeats: body?.maxSeats,
    minPlayers: body?.minPlayers,
    lateRegistrationHands: body?.lateRegistrationHands,
    handsPerBlindLevel: body?.handsPerBlindLevel,
    scheduledBreaks: body?.scheduledBreaks,
    accessMode: 'public',
  };
  const storedTemplate = deps.upsertPokerPlayScheduleTemplate({
    templateId,
    title: normalizedTitle,
    status: 'active',
    recurrenceKind,
    recurrenceIntervalHours,
    recurrenceLabel,
    firstStartAt,
    eventCount,
    config: cloneJson(tableConfig, {}),
    cancelledAt: null,
    createdAt: requestAt,
    updatedAt: requestAt,
  });
  for (let index = 0; index < eventCount; index += 1) {
    const scheduledStartAt = addHoursToIso(firstStartAt, recurrenceIntervalHours * index);
    createDynamicTable(deps, {
      ...tableConfig,
      scheduledStartAt,
      scheduleTemplateId: templateId,
      scheduleTemplateTitle: normalizedTitle,
      scheduleRecurrenceLabel: recurrenceLabel,
      creatorWalletSubject: 'poker_schedule_admin',
      creatorHouseId: 'house_poker_schedule_admin',
    }, { createdAt: requestAt });
  }
  const payload = buildPokerPlayAdminScheduleTemplatesPayload(deps, { processAt: requestAt });
  return {
    ...payload,
    createdTemplateId: storedTemplate?.templateId || templateId,
  };
}

function cancelScheduleTemplate(deps, { templateId, reason, actorLabel = 'operator', asOf } = {}) {
  if (typeof deps.upsertPokerPlayScheduleTemplate !== 'function' || typeof deps.listPokerPlayScheduleTemplates !== 'function') {
    throw createRouteError(500, 'POKER_PLAY_SCHEDULE_TEMPLATE_UNAVAILABLE', 'Schedule template storage is unavailable.');
  }
  const requestAt = toProcessIso(deps, asOf);
  const normalizedTemplateId = normalizePokerPlayScheduleTemplateId(templateId);
  const existingTemplate = (typeof deps.listPokerPlayScheduleTemplates === 'function'
    ? deps.listPokerPlayScheduleTemplates()
    : []).find((item) => normalizePokerPlayScheduleTemplateId(item?.templateId) === normalizedTemplateId) || null;
  if (!existingTemplate) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker schedule template not found.');
  }

  const closeReason = normalizeTrimmedString(
    reason,
    `Operator cancelled recurring schedule template ${existingTemplate.title || normalizedTemplateId}.`
  );
  const matchingEntries = deps.listPokerPlayTables()
    .filter((table) => normalizePokerPlayTableType(table?.tableType) === 'tournament')
    .filter((table) => normalizePokerPlayScheduleTemplateId(table?.rules?.scheduleTemplateId || table?.summary?.scheduleTemplateId || '') === normalizedTemplateId)
    .map((table) => syncPokerPlayTable(deps, table.tableId, { processAt: requestAt }))
    .filter((entry) => !isSeriesClosedTable(entry?.table))
    .filter((entry) => {
      const scheduledStartAt = getTournamentScheduledStartAt(entry?.table);
      return !!scheduledStartAt && compareIsoAsc(scheduledStartAt, requestAt) >= 0;
    })
    .filter((entry) => !hasPokerPlayTableStarted(entry?.table, entry?.hand));

  const closedTables = matchingEntries.map((entry) => {
    const closed = closeTable(deps, {
      tableId: entry.table.tableId,
      reason: closeReason,
      actorLabel,
      refundMode: 'refund_all',
      asOf: requestAt,
    });
    return {
      tableId: String(closed?.table?.tableId || entry.table.tableId || ''),
      title: String(closed?.table?.title || entry.table.title || 'Tournament'),
      scheduledStartAt: getTournamentScheduledStartAt(entry.table) || null,
      refundSummary: cloneJson(closed?.refundSummary, {}),
    };
  });

  const storedTemplate = deps.upsertPokerPlayScheduleTemplate({
    ...existingTemplate,
    status: 'cancelled',
    cancelledAt: existingTemplate?.cancelledAt || requestAt,
    updatedAt: requestAt,
  });
  const payload = buildPokerPlayAdminScheduleTemplatesPayload(deps, { processAt: requestAt });
  return {
    ...payload,
    cancelledTemplateId: storedTemplate?.templateId || normalizedTemplateId,
    closedTables,
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
  const scheduledStartAt = normalizeIsoString(normalized.scheduledStartAt);
  const accessMode = normalizePokerPlayAccessMode(normalized.accessMode);
  const inviteCode = accessMode === 'invite_only'
    ? normalizePokerPlayInviteCode(normalized.inviteCode, buildPokerPlayInviteCode(deps))
    : '';
  const createdIso = createdAt || deps.nowIso();
  const scheduledStartPending = normalizePokerPlayTableType(normalized.tableType) === 'tournament'
    && !!scheduledStartAt
    && Date.parse(scheduledStartAt) > Date.parse(createdIso);
  return deps.upsertPokerPlayTable({
    tableId,
    slug,
    title: normalized.title,
    tableType: normalized.tableType,
    status: scheduledStartPending ? 'scheduled' : 'open',
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
      scheduledStartAt: scheduledStartAt || null,
      entryCount: 0,
      reentryCount: 0,
      rebuyCount: 0,
      addonCount: 0,
      addonPrizePoolOil: 0,
      addonBountyPoolOil: 0,
      multiFlightBaggedAt: null,
      multiFlightAdvancedSeatCount: 0,
      multiFlightImportsBySourceSeriesId: {},
      entryCountsByWallet: {},
      rebuyCountsByWallet: {},
      addonCountsByWallet: {},
      completedScheduledBreakAfterHands: [],
      scheduledBreakId: null,
      scheduledBreakLabel: null,
      scheduledBreakAfterHandNumber: 0,
      scheduledBreakStartedAt: null,
      scheduledBreakUntilAt: null,
      scheduledBreakDurationMinutes: 0,
      registrationClosedByDirectorAt: null,
      timeBankRemainingBySeat: {},
      accessMode,
      inviteCode: inviteCode || null,
      createdByWalletSubject: normalized.creatorWalletSubject || null,
      createdByHouseId: normalized.creatorHouseId || null,
    },
    rules: {
      decisionCountdownSeconds: normalized.decisionCountdownSeconds,
      presenceTimeoutSeconds: normalized.presenceTimeoutSeconds,
      reconnectGraceSeconds: normalized.reconnectGraceSeconds,
      timeBankSeconds: normalized.timeBankSeconds,
      cashOutEnabled: normalized.tableType === 'cash',
      blindReturnPolicy: normalized.tableType === 'cash' ? normalized.blindReturnPolicy : 'post_big_blind',
      cashRakeBps: normalized.tableType === 'cash' ? normalized.cashRakeBps : 0,
      cashRakeCapOil: normalized.tableType === 'cash' ? normalized.cashRakeCapOil : 0,
      payoutModel: normalized.tableType === 'cash' ? 'cash_stack' : 'dynamic_ladder',
      formatVariant: normalized.tableType === 'tournament' ? normalized.formatVariant : 'standard',
      bountyModel: normalized.tableType === 'tournament' ? normalized.bountyModel : 'none',
      tournamentEntryFeeOil: normalized.tableType === 'tournament' ? normalized.tournamentEntryFeeOil : 0,
      satelliteTargetSeriesId: normalized.tableType === 'tournament' ? (normalized.satelliteTargetSeriesId || null) : null,
      satelliteTargetSeriesTitle: normalized.tableType === 'tournament' ? (normalized.satelliteTargetSeriesTitle || null) : null,
      satelliteAwardKind: normalized.tableType === 'tournament' ? normalized.satelliteAwardKind : 'ticket',
      satelliteAwardCount: normalized.tableType === 'tournament' ? normalized.satelliteAwardCount : 0,
      satelliteAwardValueOil: normalized.tableType === 'tournament' ? normalized.satelliteAwardValueOil : 0,
      multiFlightFestivalParentId: normalized.tableType === 'tournament' ? (normalized.multiFlightFestivalParentId || null) : null,
      multiFlightFestivalTitle: normalized.tableType === 'tournament' ? (normalized.multiFlightFestivalTitle || null) : null,
      multiFlightFlightCode: normalized.tableType === 'tournament' ? (normalized.multiFlightFlightCode || null) : null,
      multiFlightFlightLabel: normalized.tableType === 'tournament' ? (normalized.multiFlightFlightLabel || null) : null,
      multiFlightMergeSeriesId: normalized.tableType === 'tournament' ? (normalized.multiFlightMergeSeriesId || null) : null,
      multiFlightMergeSeriesTitle: normalized.tableType === 'tournament' ? (normalized.multiFlightMergeSeriesTitle || null) : null,
      multiFlightAdvanceSeatCount: normalized.tableType === 'tournament' ? normalized.multiFlightAdvanceSeatCount : 0,
      fillPolicy: normalized.tableType === 'tournament' ? normalized.fillPolicy : 'open_match',
      lateRegistrationHands: normalized.tableType === 'tournament' ? normalized.lateRegistrationHands : 0,
      rebuyLimit: normalized.tableType === 'tournament' ? normalized.rebuyLimit : 0,
      rebuyWindowHands: normalized.tableType === 'tournament' ? normalized.rebuyWindowHands : 0,
      addonWindowAfterHandNumbers: normalized.tableType === 'tournament' ? normalized.addonWindowAfterHandNumbers : [],
      addonCostOil: normalized.tableType === 'tournament' ? normalized.addonCostOil : 0,
      addonChipsOil: normalized.tableType === 'tournament' ? normalized.addonChipsOil : 0,
      maxAddonsPerSeat: normalized.tableType === 'tournament' ? normalized.maxAddonsPerSeat : 0,
      handsPerBlindLevel: normalized.tableType === 'tournament' ? normalized.handsPerBlindLevel : 0,
      blindLevels: normalized.tableType === 'tournament' ? normalized.blindLevels : [],
      scheduledBreaks: normalized.tableType === 'tournament' ? normalized.scheduledBreaks : [],
      scheduledStartAt: normalized.tableType === 'tournament' ? (scheduledStartAt || null) : null,
      reentryLimit: normalized.tableType === 'tournament' ? normalized.reentryLimit : 0,
      startTargetSeats: normalized.tableType === 'tournament' ? normalized.startTargetSeats : normalized.minPlayers,
      scheduleTemplateId: normalized.tableType === 'tournament' ? (normalized.scheduleTemplateId || null) : null,
      scheduleTemplateTitle: normalized.tableType === 'tournament' ? (normalized.scheduleTemplateTitle || null) : null,
      scheduleRecurrenceLabel: normalized.tableType === 'tournament' ? (normalized.scheduleRecurrenceLabel || null) : null,
      seriesId: normalized.tableType === 'tournament'
        ? normalizeTrimmedString(normalized.seriesId, `pkseries_${deps.randomHex(8)}`)
        : '',
      seriesTitle: normalized.tableType === 'tournament'
        ? normalizeTrimmedString(normalized.seriesTitle, normalized.title)
        : '',
      matchKey,
      dynamic: true,
      accessMode,
      inviteCode: inviteCode || null,
      createdByWalletSubject: normalized.creatorWalletSubject || null,
      createdByHouseId: normalized.creatorHouseId || null,
    },
    summary: buildDynamicTableSummary(normalized, matchKey),
    createdAt: createdIso,
    updatedAt: createdIso,
  });
}

function isTableMatchCandidate(synced, matchKey, tableType) {
  if (!synced?.table) return false;
  const table = synced.table;
  if (isInviteOnlyPokerPlayTable(table)) return false;
  const computedSummary = computeTableSummary(table, synced.seats, synced.hand, null);
  const summary = {
    ...(table.summary && typeof table.summary === 'object' ? table.summary : {}),
    ...computedSummary,
  };
  const tableMatchKey = normalizeTrimmedString(table?.rules?.matchKey || table?.summary?.matchKey || summary.matchKey || buildMatchKeyFromTable(table));
  if (!tableMatchKey || tableMatchKey !== matchKey) return false;
  if (normalizePokerPlayTableType(table.tableType) !== normalizePokerPlayTableType(tableType)) return false;
  if (Number(summary.openSeatCount || 0) <= 0) return false;
  const normalizedStatus = normalizeTrimmedString(table.status, 'open');
  const tournamentPrestart = normalizePokerPlayTableType(tableType) === 'tournament' && normalizedStatus === 'scheduled';
  if (normalizedStatus !== 'open' && !tournamentPrestart) return false;
  if (tableType === 'tournament') {
    if (Number(summary.occupancy || 0) >= Number(table.maxSeats || POKER_PLAY_MAX_SEATS)) return false;
    const lateRegistration = resolveTournamentLateRegistration(table, synced.hand);
    if (hasPokerPlayTableStarted(table, synced.hand) && !lateRegistration.open) return false;
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
    if (isSitAndGoFillPolicy(normalized.fillPolicy)) {
      nextConfig = {
        ...normalized,
        seriesId: `pkseries_${deps.randomHex(8)}`,
        seriesTitle: normalized.title,
      };
    } else {
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
  }
  return createDynamicTable(deps, nextConfig, { createdAt: toProcessIso(deps, processAt) });
}

function listTables(deps, { session, req, processAt, publicViewer = false } = {}) {
  return buildPokerPlayLobbyPayload(deps, { session, req, processAt, publicViewer });
}

function getPokerPlayPolicy(deps, { session, req, processAt } = {}) {
  const walletBinding = deps.resolvePrimaryWalletSubject(session, req);
  if (!walletBinding?.walletSubject) {
    throw createRouteError(409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before reading poker policy.');
  }
  const requestAt = toProcessIso(deps, processAt);
  return {
    houseId: getSessionHouseId(session),
    wallet: walletBinding.submitterWallet || null,
    oilBalance: deps.computeOilBalance(walletBinding.walletSubject),
    pokerPolicy: buildPokerPlayWalletPolicySummary(deps, walletBinding.walletSubject, { processAt: requestAt }),
    processAt: requestAt,
  };
}

function updatePokerPlayPolicy(deps, { session, req, body } = {}) {
  const walletBinding = deps.resolvePrimaryWalletSubject(session, req);
  if (!walletBinding?.walletSubject) {
    throw createRouteError(409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before updating poker policy.');
  }
  const requestAt = toProcessIso(deps, body?.asOf);
  const existing = typeof deps.getPokerPlayWalletPolicy === 'function'
    ? deps.getPokerPlayWalletPolicy(walletBinding.walletSubject)
    : null;
  const hasCapUpdate = Object.prototype.hasOwnProperty.call(body || {}, 'dailySpendCapOil');
  const requestedSelfExcludeHours = normalizePokerPlaySelfExcludeHours(body?.selfExcludeHours, 0);
  if (!hasCapUpdate && requestedSelfExcludeHours <= 0) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Provide a daily spend cap and/or self-exclusion window.');
  }
  const nextDailySpendCapOil = hasCapUpdate
    ? normalizePokerPlayDailySpendCapOil(body?.dailySpendCapOil, existing?.dailySpendCapOil || 0)
    : Math.max(0, Number(existing?.dailySpendCapOil || 0));
  const currentSelfExcludedUntil = normalizeIsoString(existing?.selfExcludedUntil) || '';
  const requestedSelfExcludedUntil = requestedSelfExcludeHours > 0
    ? addHoursToIso(requestAt, requestedSelfExcludeHours)
    : '';
  let nextSelfExcludedUntil = currentSelfExcludedUntil || null;
  if (requestedSelfExcludedUntil) {
    nextSelfExcludedUntil = currentSelfExcludedUntil && isIsoInFuture(currentSelfExcludedUntil, requestedSelfExcludedUntil)
      ? currentSelfExcludedUntil
      : requestedSelfExcludedUntil;
  }
  if (typeof deps.upsertPokerPlayWalletPolicy === 'function') {
    deps.upsertPokerPlayWalletPolicy({
      walletSubject: walletBinding.walletSubject,
      dailySpendCapOil: nextDailySpendCapOil,
      selfExcludedUntil: nextSelfExcludedUntil,
      updatedAt: requestAt,
    });
  }
  return getPokerPlayPolicy(deps, { session, req, processAt: requestAt });
}

function getSeriesDetail(deps, { seriesId, session, req, processAt, publicViewer = false } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const targetSeriesId = normalizeTrimmedString(seriesId);
  const walletBinding = (!publicViewer && session) ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const viewerHouseId = (!publicViewer && session) ? getSessionHouseId(session) : '';
  const inviteCode = parsePokerPlayInviteCode(req);
  const entries = deps.listPokerPlayTables()
    .map((table) => syncPokerPlayTable(deps, table.tableId, { processAt: requestAt }))
    .filter((synced) => normalizePokerPlayTableType(synced?.table?.tableType) === 'tournament')
    .filter((synced) => normalizeTrimmedString(getTournamentSeriesRef(synced?.table).seriesId) === targetSeriesId);
  if (!entries.length) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker tournament series not found.');
  }

  const withViewerSeat = entries.map((entry) => {
    const viewerSeat = walletBinding?.walletSubject
      ? deps.getPokerPlaySeatByWalletSubject(entry.table.tableId, walletBinding.walletSubject)
      : null;
    return {
      ...entry,
      viewerSeat,
      summary: computeTableSummary(entry.table, entry.seats, entry.hand, viewerSeat),
    };
  });
  requirePokerPlaySeriesAccess(withViewerSeat, {
    walletSubject: walletBinding?.walletSubject || '',
    houseId: viewerHouseId,
    inviteCode,
    publicViewer,
  });
  const series = buildPokerPlaySeriesSummary(withViewerSeat, walletBinding?.walletSubject || '');
  if (!series) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker tournament series not found.');
  }

  const tables = withViewerSeat
    .filter((entry) => !isSeriesClosedTable(entry?.table))
    .sort((left, right) => {
      const leftLive = left?.summary?.liveHand ? 1 : 0;
      const rightLive = right?.summary?.liveHand ? 1 : 0;
      if (leftLive !== rightLive) return rightLive - leftLive;
      return String(left?.table?.tableId || '').localeCompare(String(right?.table?.tableId || ''));
    })
    .map((entry) => {
      const payload = buildPokerPlayTablePayload(deps, entry.table, entry.seats, entry.hand, {
        session,
        req,
        processAt: requestAt,
        publicViewer,
      });
      return {
        table: payload.table,
        seats: payload.seats,
        hand: payload.hand,
        actions: payload.actions,
        messages: payload.messages,
        review: payload.review,
        processAt: payload.processAt,
      };
    });

  return {
    viewerMode: publicViewer ? 'public' : 'player',
    houseId: publicViewer ? null : viewerHouseId,
    wallet: walletBinding?.submitterWallet || null,
    oilBalance: walletBinding?.walletSubject ? deps.computeOilBalance(walletBinding.walletSubject) : null,
    series,
    chopProposal: getLatestSeriesChopProposalSummary(deps, targetSeriesId, {
      viewerWalletSubject: walletBinding?.walletSubject || '',
      publicViewer,
    }),
    tables,
    processAt: requestAt,
  };
}

function getTableDetail(deps, { tableId, session, req, processAt, publicViewer = false, seatAgentMode = '' } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  if (!publicViewer) {
    touchPokerPlaySeatPresenceForSession(deps, tableId, session, req, requestAt);
  }
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  const walletBinding = (!publicViewer && session) ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const viewerHouseId = (!publicViewer && session) ? getSessionHouseId(session) : '';
  const viewerSeat = walletBinding?.walletSubject
    ? deps.getPokerPlaySeatByWalletSubject(synced.table.tableId, walletBinding.walletSubject)
    : null;
  requirePokerPlayTableAccess(synced.table, {
    walletSubject: walletBinding?.walletSubject || '',
    houseId: viewerHouseId,
    viewerSeat,
    inviteCode: parsePokerPlayInviteCode(req),
    publicViewer,
  });
  return buildPokerPlayTablePayload(deps, synced.table, synced.seats, synced.hand, {
    session,
    req,
    processAt: requestAt,
    publicViewer,
    seatAgentMode,
  });
}

function updateAutoActPolicy(deps, { tableId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  if (isTableAdminClosed(synced.table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
  }
  const { seat } = requireSeatWriter(deps, { table: synced.table, session, req });
  const requestedMode = normalizeTrimmedString(body?.mode);
  const nextMode = normalizePokerPlayAutoActMode(requestedMode || 'off', '__invalid__');
  if (nextMode === '__invalid__') {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Auto-act mode is invalid.');
  }
  const updatedTable = upsertPokerPlaySeatAutoActPolicy(deps, synced.table, seat.walletSubject, {
    mode: nextMode,
    allowWhileDisconnected: body?.allowWhileDisconnected === true,
  }, requestAt);
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: updatedTable.tableId,
      handId: synced.hand?.handId || null,
      seatNumber: seat.seatNumber,
      actorRole: 'human',
      eventKind: nextMode === 'off' ? 'auto_act_revoked' : 'auto_act_policy_updated',
      payload: {
        automationMode: nextMode,
        allowWhileDisconnected: body?.allowWhileDisconnected === true,
      },
      createdAt: requestAt,
    });
  }
  return getTableDetail(deps, {
    tableId: updatedTable.tableId,
    session,
    req,
    processAt: requestAt,
    publicViewer: false,
    seatAgentMode: req.query?.seatAgentMode,
  });
}

function getHandHistory(deps, { tableId, session, req, processAt, publicViewer = false, limit = 20, status = '' } = {}) {
  const table = deps.getPokerPlayTableById(tableId);
  if (!table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  const walletBinding = (!publicViewer && session) ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const viewerHouseId = (!publicViewer && session) ? getSessionHouseId(session) : '';
  const viewerSeat = walletBinding?.walletSubject
    ? deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject)
    : null;
  requirePokerPlayTableAccess(table, {
    walletSubject: walletBinding?.walletSubject || '',
    houseId: viewerHouseId,
    viewerSeat,
    inviteCode: parsePokerPlayInviteCode(req),
    publicViewer,
  });
  return buildPokerPlayHandHistoryPayload(deps, {
    tableId,
    session,
    req,
    processAt,
    publicViewer,
    limit,
    status,
  });
}

function listNotebook(deps, {
  session,
  req,
  processAt,
  entryKind = '',
  tableId = '',
  seriesId = '',
  handId = '',
  opponentWalletSubject = '',
  limit = 50,
} = {}) {
  const walletBinding = requirePokerPlayViewerWalletBinding(deps, session, req);
  const items = listViewerNotebookEntries(deps, walletBinding.walletSubject, {
    entryKind: normalizeTrimmedString(entryKind),
    tableId: normalizeTrimmedString(tableId),
    seriesId: normalizeTrimmedString(seriesId),
    handId: normalizeTrimmedString(handId),
    opponentWalletSubject: normalizeTrimmedString(opponentWalletSubject),
    limit: Math.max(1, Number(limit || 50)),
  }).map((entry) => {
    const table = entry?.tableId && typeof deps.getPokerPlayTableById === 'function'
      ? deps.getPokerPlayTableById(entry.tableId)
      : null;
    const hand = entry?.handId && typeof deps.getPokerPlayHandById === 'function'
      ? deps.getPokerPlayHandById(entry.handId)
      : null;
    const seats = table?.tableId && typeof deps.listPokerPlaySeatsByTable === 'function'
      ? deps.listPokerPlaySeatsByTable(table.tableId)
      : [];
    const seriesRef = getTournamentSeriesRef(table);
    return decorateNotebookEntry(entry, {
      table,
      hand,
      seats,
      seriesId: seriesRef.seriesId,
      seriesTitle: seriesRef.seriesTitle,
    });
  });
  return {
    viewerMode: 'player',
    filter: {
      entryKind: normalizeTrimmedString(entryKind) || null,
      tableId: normalizeTrimmedString(tableId) || null,
      seriesId: normalizeTrimmedString(seriesId) || null,
      handId: normalizeTrimmedString(handId) || null,
      opponentWalletSubject: normalizeTrimmedString(opponentWalletSubject) || null,
      limit: Math.max(1, Number(limit || 50)),
    },
    items,
    processAt: toProcessIso(deps, processAt),
  };
}

function saveNotebookEntry(deps, {
  session,
  req,
  body,
  processAt,
  opponentWalletSubject = '',
} = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const walletBinding = requirePokerPlayViewerWalletBinding(deps, session, req);
  const viewerHouseId = getSessionHouseId(session);
  const entryKind = normalizePokerPlayNotebookEntryKind(
    normalizeTrimmedString(opponentWalletSubject) ? 'opponent_note' : body?.entryKind,
    'notebook'
  );
  const topic = normalizePokerPlayNotebookTopic(body?.topic);
  const noteBody = normalizePokerPlayNotebookBody(body?.body);
  const tags = normalizePokerPlayNotebookTags(body?.tags);
  if (!noteBody) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'A notebook note body is required.');
  }
  const targetHandId = normalizeTrimmedString(body?.handId);
  const targetTableId = normalizeTrimmedString(body?.tableId);
  const targetSeriesId = normalizeTrimmedString(body?.seriesId);
  const hand = targetHandId && typeof deps.getPokerPlayHandById === 'function'
    ? deps.getPokerPlayHandById(targetHandId)
    : null;
  if (targetHandId && !hand) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker hand not found.');
  }
  const table = (targetTableId && typeof deps.getPokerPlayTableById === 'function'
    ? deps.getPokerPlayTableById(targetTableId)
    : null) || (hand?.tableId && typeof deps.getPokerPlayTableById === 'function'
      ? deps.getPokerPlayTableById(hand.tableId)
      : null);
  if (targetTableId && !table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  if (hand && table && normalizeTrimmedString(hand.tableId) !== normalizeTrimmedString(table.tableId)) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Notebook hand and table must match.');
  }
  const viewerSeat = table?.tableId && typeof deps.getPokerPlaySeatByWalletSubject === 'function'
    ? deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject)
    : null;
  if (table) {
    requirePokerPlayTableAccess(table, {
      walletSubject: walletBinding.walletSubject,
      houseId: viewerHouseId,
      viewerSeat,
      inviteCode: parsePokerPlayInviteCode(req, body),
      publicViewer: false,
    });
  }
  const nextOpponentWalletSubject = normalizeTrimmedString(opponentWalletSubject || body?.opponentWalletSubject);
  if (entryKind === 'opponent_note' && !nextOpponentWalletSubject) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Opponent notes require an opponent wallet subject.');
  }
  if (nextOpponentWalletSubject && nextOpponentWalletSubject === normalizeTrimmedString(walletBinding.walletSubject)) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Opponent notes cannot target the current wallet.');
  }
  if (typeof deps.upsertPokerPlayerNotebookEntry !== 'function') {
    throw createRouteError(500, 'UNAVAILABLE', 'Poker notebook storage is not configured.');
  }
  const seriesRef = getTournamentSeriesRef(table);
  const entry = deps.upsertPokerPlayerNotebookEntry({
    entryId: normalizeTrimmedString(body?.entryId) || null,
    walletSubject: walletBinding.walletSubject,
    houseId: viewerHouseId || null,
    entryKind,
    tableId: table?.tableId || targetTableId || null,
    seriesId: targetSeriesId || seriesRef.seriesId || null,
    handId: hand?.handId || targetHandId || null,
    opponentWalletSubject: nextOpponentWalletSubject || null,
    opponentSeatKey: normalizeTrimmedString(body?.opponentSeatKey) || null,
    topic,
    authorRole: normalizePokerPlayNotebookAuthorRole(body?.authorRole, 'human'),
    body: noteBody,
    tags,
    updatedAt: requestAt,
  });
  return {
    entry: decorateNotebookEntry(entry, {
      table,
      hand,
      seats: table?.tableId && typeof deps.listPokerPlaySeatsByTable === 'function'
        ? deps.listPokerPlaySeatsByTable(table.tableId)
        : [],
      seriesId: targetSeriesId || seriesRef.seriesId,
      seriesTitle: seriesRef.seriesTitle,
    }),
    processAt: requestAt,
  };
}

function getHandReview(deps, { handId, session, req, processAt } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const walletBinding = requirePokerPlayViewerWalletBinding(deps, session, req);
  const viewerHouseId = getSessionHouseId(session);
  const hand = typeof deps.getPokerPlayHandById === 'function' ? deps.getPokerPlayHandById(handId) : null;
  if (!hand) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker hand not found.');
  }
  const synced = syncPokerPlayTable(deps, hand.tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  const viewerSeat = typeof deps.getPokerPlaySeatByWalletSubject === 'function'
    ? deps.getPokerPlaySeatByWalletSubject(synced.table.tableId, walletBinding.walletSubject)
    : null;
  requirePokerPlayTableAccess(synced.table, {
    walletSubject: walletBinding.walletSubject,
    houseId: viewerHouseId,
    viewerSeat,
    inviteCode: parsePokerPlayInviteCode(req),
    publicViewer: false,
  });
  if (!viewerSeat) {
    throw createRouteError(403, 'FORBIDDEN', 'Only a seated player from this table can open hand review.');
  }
  const seriesRef = getTournamentSeriesRef(synced.table);
  const notebookEntries = listViewerNotebookEntries(deps, walletBinding.walletSubject, {
    handId: hand.handId,
    limit: 100,
  }).map((entry) => decorateNotebookEntry(entry, {
    table: synced.table,
    hand,
    seats: synced.seats,
    seriesId: seriesRef.seriesId,
    seriesTitle: seriesRef.seriesTitle,
  }));
  const handOpponentWallets = new Set(
    (Array.isArray(synced.seats) ? synced.seats : [])
      .map((seat) => normalizeTrimmedString(seat?.walletSubject))
      .filter((wallet) => wallet && wallet !== normalizeTrimmedString(walletBinding.walletSubject))
  );
  const opponentNotes = listViewerNotebookEntries(deps, walletBinding.walletSubject, {
    tableId: synced.table.tableId,
    entryKind: 'opponent_note',
    limit: 100,
  })
    .map((entry) => decorateNotebookEntry(entry, {
      table: synced.table,
      hand,
      seats: synced.seats,
      seriesId: seriesRef.seriesId,
      seriesTitle: seriesRef.seriesTitle,
    }))
    .filter((entry) => handOpponentWallets.has(normalizeTrimmedString(entry?.opponentWalletSubject)))
    .filter((entry) => {
      const entryHandId = normalizeTrimmedString(entry?.handId);
      return !entryHandId || entryHandId === normalizeTrimmedString(hand.handId);
    });
  const humanNote = notebookEntries.find((entry) => normalizePokerPlayNotebookEntryKind(entry?.entryKind, 'notebook') === 'notebook') || null;
  const agentNote = getLatestSeatAgentProposal(deps, hand.handId, viewerSeat.seatNumber);
  const lessonTags = normalizePokerPlayNotebookTags([
    ...notebookEntries.flatMap((entry) => Array.isArray(entry?.tags) ? entry.tags : []),
    ...opponentNotes.flatMap((entry) => Array.isArray(entry?.tags) ? entry.tags : []),
  ]);
  const actions = sanitizeActions(
    typeof deps.listPokerPlayActionsByHand === 'function' ? deps.listPokerPlayActionsByHand(hand.handId) : [],
    synced.seats
  );
  return {
    viewerMode: 'player',
    table: {
      tableId: synced.table.tableId,
      title: synced.table.title || 'Live Table',
      tableType: synced.table.tableType,
      status: synced.table.status,
      summary: computeTableSummary(synced.table, synced.seats, synced.hand, viewerSeat),
    },
    series: seriesRef.seriesId
      ? {
        seriesId: seriesRef.seriesId,
        seriesTitle: seriesRef.seriesTitle,
      }
      : null,
    hand: {
      handId: hand.handId,
      handNumber: Number(hand.handNumber || 0),
      status: String(hand.status || ''),
      street: String(hand?.state?.street || hand?.state?.phase || 'preflop'),
      startedAt: hand.createdAt || null,
      completedAt: hand.updatedAt || null,
    },
    resultSummary: {
      viewerSeatNumber: normalizeSeatNumber(viewerSeat?.seatNumber),
      note: normalizeTrimmedString(hand?.result?.note),
      winningSeatNumbers: Array.isArray(hand?.result?.winningSeatNumbers) ? cloneJson(hand.result.winningSeatNumbers, []) : [],
      payouts: Array.isArray(hand?.result?.payouts) ? cloneJson(hand.result.payouts, []) : [],
      actionCount: actions.length,
    },
    actionLine: actions,
    boardPot: buildBoardPotSlices(hand),
    humanNote,
    agentNote,
    lessonTags,
    notebook: {
      items: notebookEntries,
      savePath: '/api/poker/play/notebook',
    },
    opponentNotes,
    links: {
      table: `/poker/play/tables/${encodeURIComponent(synced.table.tableId)}`,
      history: `/poker/play/tables/${encodeURIComponent(synced.table.tableId)}/history`,
      export: {
        json: `/api/poker/play/tables/${encodeURIComponent(synced.table.tableId)}/history/export?format=json`,
        ndjson: `/api/poker/play/tables/${encodeURIComponent(synced.table.tableId)}/history/export?format=ndjson`,
        text: `/api/poker/play/tables/${encodeURIComponent(synced.table.tableId)}/history/export?format=text`,
      },
    },
    processAt: requestAt,
  };
}

function buildHandHistoryExport(deps, {
  tableId,
  session,
  req,
  processAt,
  status = '',
  limit = 20,
} = {}) {
  const walletBinding = requirePokerPlayViewerWalletBinding(deps, session, req);
  const history = getHandHistory(deps, {
    tableId,
    session,
    req,
    processAt,
    publicViewer: false,
    status,
    limit,
  });
  const notebookEntriesByHand = mapNotebookEntriesByHand(
    listViewerNotebookEntries(deps, walletBinding.walletSubject, {
      tableId: normalizeTrimmedString(tableId),
      limit: 200,
    })
  );
  return {
    exportVersion: 'poker-play-hand-history-export-v1',
    format: 'json',
    generatedAt: toProcessIso(deps, processAt),
    viewerWalletSubject: walletBinding.walletSubject,
    table: cloneJson(history.table, {}),
    filter: cloneJson(history.filter, {}),
    items: (Array.isArray(history.items) ? history.items : []).map((item) => ({
      ...cloneJson(item, {}),
      notebookEntryIds: (notebookEntriesByHand.get(normalizeTrimmedString(item?.handId)) || []).map((entry) => entry.entryId),
    })),
  };
}

function buildHandHistoryExportNdjson(exportPayload) {
  return (Array.isArray(exportPayload?.items) ? exportPayload.items : [])
    .map((item) => JSON.stringify(item))
    .join('\n');
}

function formatActionForCompactExport(action) {
  const actionKind = normalizeTrimmedString(action?.actionKind, 'action');
  const seatNumber = normalizeSeatNumber(action?.seatNumber);
  const amountOil = Number(action?.amountOil || 0);
  return amountOil > 0
    ? `Seat ${seatNumber} ${actionKind} ${amountOil} OIL`
    : `Seat ${seatNumber} ${actionKind}`;
}

function buildHandHistoryExportText(exportPayload) {
  return (Array.isArray(exportPayload?.items) ? exportPayload.items : []).map((item) => {
    const lines = [
      `Hand ${Number(item?.handNumber || 0)} · ${normalizeTrimmedString(item?.status, 'unknown')}`,
      `Street: ${normalizeTrimmedString(item?.street, 'preflop')}`,
      `Board: ${Array.isArray(item?.communityCards) && item.communityCards.length ? item.communityCards.join(' ') : '-'}`,
      `Result: ${normalizeTrimmedString(item?.result?.note, 'No result note.')}`,
      `Actions: ${Array.isArray(item?.actions) && item.actions.length ? item.actions.map((action) => formatActionForCompactExport(action)).join('; ') : 'none'}`,
      `Worker: ${normalizeTrimmedString(item?.agentProposal?.body, 'none')}`,
      `Notebook: ${Array.isArray(item?.notebookEntryIds) && item.notebookEntryIds.length ? item.notebookEntryIds.join(', ') : '-'}`,
    ];
    return lines.join('\n');
  }).join('\n\n');
}

function getSeriesTimeline(deps, { seriesId, session, req, processAt, publicViewer = false, limit = 200 } = {}) {
  const requestAt = toProcessIso(deps, processAt);
  const walletBinding = (!publicViewer && session) ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const viewerHouseId = (!publicViewer && session) ? getSessionHouseId(session) : '';
  const entries = listTournamentSeriesEntriesBySeriesId(deps, normalizeTrimmedString(seriesId), {
    processAt: requestAt,
    includeClosed: true,
  }).map((entry) => ({
    ...entry,
    viewerSeat: walletBinding?.walletSubject
      ? deps.getPokerPlaySeatByWalletSubject(entry.table.tableId, walletBinding.walletSubject)
      : null,
  }));
  if (!entries.length) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker tournament series not found.');
  }
  requirePokerPlaySeriesAccess(entries, {
    walletSubject: walletBinding?.walletSubject || '',
    houseId: viewerHouseId,
    inviteCode: parsePokerPlayInviteCode(req),
    publicViewer,
  });
  return buildPokerPlaySeriesTimelinePayload(deps, {
    seriesId,
    session,
    req,
    processAt: requestAt,
    publicViewer,
    limit,
  });
}

function getMyResults(deps, { session, req, processAt, limit = 50 } = {}) {
  return buildPokerPlayMyResultsPayload(deps, {
    session,
    req,
    processAt,
    limit,
  });
}

function getMyQualifiers(deps, { session, req, processAt, limit = 50 } = {}) {
  const walletBinding = deps.resolvePrimaryWalletSubject(session, req);
  if (!walletBinding?.walletSubject) {
    throw createRouteError(409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before reading poker qualifier awards.');
  }
  const requestAt = toProcessIso(deps, processAt);
  const items = typeof deps.listPokerSatelliteAwardsByWalletSubject === 'function'
    ? deps.listPokerSatelliteAwardsByWalletSubject(walletBinding.walletSubject, { limit })
    : [];
  return {
    walletSubject: walletBinding.walletSubject,
    items: items.map((award) => {
      const entries = award?.targetSeriesId
        ? listTournamentSeriesEntriesBySeriesId(deps, award.targetSeriesId, {
          processAt: requestAt,
          includeClosed: true,
        })
        : [];
      const series = entries.length ? buildPokerPlaySeriesSummary(entries, walletBinding.walletSubject) : null;
      return {
        ...award,
        targetSeries: series
          ? {
            seriesId: series.seriesId,
            seriesTitle: series.seriesTitle,
            stage: series.stage,
            tableCount: series.tableCount,
            scheduledStartAt: series.scheduledStartAt,
            currentUserTableId: series.currentUserTableId,
          }
          : null,
      };
    }),
    summary: {
      awardCount: items.length,
      registeredCount: items.filter((item) => normalizeTrimmedString(item?.registrationState) === 'registered').length,
      pendingCount: items.filter((item) => normalizeTrimmedString(item?.registrationState) !== 'registered').length,
    },
    processAt: requestAt,
  };
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
  const tournamentTable = normalizePokerPlayTableType(table.tableType) === 'tournament';
  const tournamentReentry = tournamentTable && body?.reentry === true;
  const tournamentEntryMode = tournamentTable && normalizeTrimmedString(body?.entryMode).toLowerCase() === 'rebuy'
    ? 'rebuy'
    : (tournamentReentry ? 'reentry' : 'entry');
  if (isTableAdminClosed(table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
  }
  if (isTablePaused(table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_PAUSED', 'This poker table is paused by an operator.');
  }
  const sameTableSeat = deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject);
  if (sameTableSeat) {
    if (!tournamentReentry || isSeatInPlay(sameTableSeat)) {
      return buildPokerPlayTablePayload(deps, table, seats, currentHand, { session, req, processAt: requestAt });
    }
  }
  requirePokerPlayTableAccess(table, {
    walletSubject: walletBinding.walletSubject,
    houseId,
    viewerSeat: sameTableSeat || null,
    inviteCode: parsePokerPlayInviteCode(req, body),
    publicViewer: false,
  });
  const lateRegistration = resolveTournamentLateRegistration(table, currentHand);
  if (normalizePokerPlayTableType(table.tableType) === 'tournament' && currentHand && currentHand.status === 'live' && !lateRegistration.open) {
    throw createRouteError(409, 'POKER_PLAY_TOURNAMENT_ALREADY_STARTED', 'Tournament seats lock once late registration closes.', {
      tableId: table.tableId,
      handId: currentHand.handId,
      lateRegistrationRemainingHands: lateRegistration.remainingHands,
    });
  }
  if (normalizePokerPlayTableType(table.tableType) === 'tournament' && isScheduledTournamentPending(table, requestAt) && normalizeTrimmedString(table?.status, 'open') !== 'scheduled') {
    throw createRouteError(409, 'POKER_PLAY_TOURNAMENT_SCHEDULED', 'This tournament is scheduled and not open for hand start yet.', {
      scheduledStartAt: getTournamentScheduledStartAt(table) || null,
    });
  }
  if (tournamentTable && isMultiFlightTournament(table) && !isMultiFlightFlightTable(table)) {
    throw createRouteError(
      409,
      'POKER_PLAY_MULTIFLIGHT_MERGE_DIRECT_SEAT_UNAVAILABLE',
      'Merge-stage multi-flight tables only accept carried stacks from completed flights.'
    );
  }

  const requestedSeatNumber = normalizeSeatNumber(body?.seatNumber);
  const occupied = new Set(
    seats
      .filter(isSeatOccupyingTable)
      .map((seat) => normalizeSeatNumber(seat.seatNumber))
      .filter(Boolean)
  );
  const openSeatNumber = requestedSeatNumber && !occupied.has(requestedSeatNumber)
    ? requestedSeatNumber
    : Array.from({ length: Number(table.maxSeats || POKER_PLAY_MAX_SEATS) }, (_value, index) => index + 1).find((seat) => !occupied.has(seat));
  if (!openSeatNumber) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_FULL', 'No open seat is available at this table.');
  }
  const buyInOil = computeBuyInOil(table, body?.buyInOil);
  assertPokerPlayWalletPolicyAllowsSpend(deps, walletBinding.walletSubject, {
    amountOil: buyInOil,
    processAt: requestAt,
  });
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
    tableId: table.tableId,
    seriesId: getTournamentSeriesRef(table).seriesId || null,
    entryKind: tournamentEntryMode === 'rebuy' ? 'poker_play_tournament_rebuy' : 'poker_play_buy_in',
    direction: 'debit',
    amount: buyInOil,
    memo: tournamentEntryMode === 'rebuy' ? `${table.title} rebuy` : `${table.title} buy-in`,
  });

  let nextTableState = table?.state && typeof table.state === 'object' ? table.state : {};
  if (tournamentTable) {
    nextTableState = incrementTournamentEntryState(table, walletBinding.walletSubject, {
      reentry: tournamentEntryMode === 'reentry',
      rebuy: tournamentEntryMode === 'rebuy',
    });
  }

  const seatedSeat = deps.upsertPokerPlaySeat({
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
    eliminatedAt: null,
    prizeOil: 0,
    currentBountyOil: computeTournamentInitialBountyOil(buyInOil, getTournamentBountyModel(table), getTournamentEntryFeeOil(table)),
    bountyWonOil: 0,
    bountySettledAt: null,
    payoutSettledAt: null,
    updatedAt: requestAt,
  });
  upsertPokerPlayPlayerStatForSeat(deps, table, seatedSeat, {
    processAt: requestAt,
    reloadOilDelta: tournamentEntryMode === 'rebuy' ? buyInOil : 0,
    status: normalizePokerPlayTableType(table.tableType) === 'tournament' && currentHand && currentHand.status === 'live'
      ? 'registered'
      : 'open',
  });
  if (tournamentEntryMode === 'rebuy' && typeof deps.createPokerRebuyEvent === 'function') {
    deps.createPokerRebuyEvent({
      tableId: table.tableId,
      seriesId: getTournamentSeriesRef(table).seriesId || null,
      handId: currentHand?.handId || table?.state?.lastSettledHandId || null,
      walletSubject: walletBinding.walletSubject,
      houseId,
      seatNumber: openSeatNumber,
      eventKind: 'rebuy',
      amountOil: buyInOil,
      chipsOil: buyInOil,
      payload: {
        entryMode: tournamentEntryMode,
        scheduledStartAt: getTournamentScheduledStartAt(table) || null,
      },
      createdAt: requestAt,
    });
  }
  const waitlistEntry = getTableWaitlistEntryByWalletSubject(deps, table, walletBinding.walletSubject);
  if (waitlistEntry && normalizeTrimmedString(waitlistEntry?.status, 'waiting') === 'waiting') {
    upsertTableWaitlistEntry(deps, table, {
      ...waitlistEntry,
      status: 'promoted',
      promotedSeatNumber: openSeatNumber,
      promotedAt: requestAt,
      updatedAt: requestAt,
    });
  }
  table = deps.upsertPokerPlayTable({
    ...table,
    state: setSeatTimeBankRemainingSeconds(
      {
        ...table,
        state: nextTableState,
      },
      openSeatNumber,
      getSeatTimeBankRemainingSeconds(table, openSeatNumber)
    ),
    updatedAt: requestAt,
  });
  if (normalizePokerPlayTableType(table.tableType) === 'tournament' && currentHand && currentHand.status === 'live') {
    deps.createPokerPlayMessage({
      tableId: table.tableId,
      handId: currentHand.handId,
      seatNumber: null,
      authorRole: 'system',
      body: `${formatSeatLabel(openSeatNumber, normalizePokerPlayDisplayName(body?.displayName, session?.agent?.name || houseId || walletBinding.walletSubject.slice(0, 8)))} ${tournamentEntryMode === 'rebuy' ? 'rebuys for' : (tournamentReentry ? 're-enters for' : 'registers for')} the next hand.`,
      createdAt: requestAt,
    });
  }

  const refreshed = syncPokerPlayTable(deps, table.tableId, { processAt: requestAt });
  if (normalizePokerPlayTableType(table.tableType) === 'tournament' && typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: table.tableId,
      handId: refreshed?.hand?.handId || currentHand?.handId || null,
      seatNumber: openSeatNumber,
      actorRole: 'human',
      eventKind: tournamentEntryMode === 'rebuy'
        ? 'tournament_rebuy'
        : (tournamentReentry ? 'tournament_reentered' : 'tournament_registered'),
      payload: {
        walletSubject: walletBinding.walletSubject,
        buyInOil,
        reentry: tournamentEntryMode === 'reentry',
        rebuy: tournamentEntryMode === 'rebuy',
        scheduledStartAt: getTournamentScheduledStartAt(table) || null,
      },
      createdAt: requestAt,
    });
  }
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
  const created = createDynamicTable(deps, {
    ...body,
    creatorWalletSubject: walletBinding.walletSubject,
    creatorHouseId: houseId,
  }, { createdAt: requestAt });
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
  if (normalizePokerPlayAccessMode(body?.accessMode) === 'invite_only') {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Invite-only tables must be created directly instead of through matchmaking.');
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

function enterTournamentSeriesBuyback(deps, { seriesId, session, req, body, mode = 'reentry' } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const walletBinding = deps.resolvePrimaryWalletSubject(session, req);
  const buybackMode = normalizeTrimmedString(mode, 'reentry').toLowerCase() === 'rebuy' ? 'rebuy' : 'reentry';
  if (!walletBinding?.walletSubject) {
    throw createRouteError(409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before re-entering a live poker tournament.');
  }
  const houseId = getSessionHouseId(session);
  if (!houseId) {
    throw createRouteError(409, 'HOUSE_REQUIRED', 'Join a house before re-entering a live poker tournament.');
  }
  const entries = getTournamentDirectorEntries(deps, seriesId, requestAt);
  const activeEntries = entries.filter((entry) => !isSeriesClosedTable(entry?.table));
  const entryCount = getTournamentSeriesWalletEntryCount(entries, walletBinding.walletSubject);
  if (entryCount <= 0) {
    throw createRouteError(
      409,
      buybackMode === 'rebuy' ? 'POKER_PLAY_REBUY_UNAVAILABLE' : 'POKER_PLAY_REENTRY_UNAVAILABLE',
      'This wallet does not have a prior tournament entry in the series.'
    );
  }
  const leadTable = activeEntries[0]?.table || entries[0]?.table || null;
  if (buybackMode === 'rebuy') {
    const rebuyLimit = getTournamentRebuyLimit(leadTable);
    if (rebuyLimit <= 0) {
      throw createRouteError(409, 'POKER_PLAY_REBUY_UNAVAILABLE', 'This tournament does not allow rebuys.');
    }
    const rebuyWindow = resolveTournamentRebuyWindow(leadTable, activeEntries[0]?.hand || null);
    if (!rebuyWindow.open) {
      throw createRouteError(409, 'POKER_PLAY_REBUY_WINDOW_CLOSED', 'The rebuy window is closed for this tournament.', {
        rebuyWindowHands: rebuyWindow.rebuyWindowHands,
        remainingHands: rebuyWindow.remainingHands,
      });
    }
    const acceptedRebuyCount = getTournamentSeriesWalletRebuyCount(entries, walletBinding.walletSubject);
    if (acceptedRebuyCount >= rebuyLimit) {
      throw createRouteError(409, 'POKER_PLAY_REBUY_LIMIT_REACHED', 'This wallet has reached the tournament rebuy limit.', {
        rebuyLimit,
        acceptedRebuyCount,
      });
    }
    const activeSeat = deps.getActivePokerPlaySeatByWalletSubject(walletBinding.walletSubject);
    if (activeSeat && isSeatInPlay(activeSeat)) {
      throw createRouteError(409, 'POKER_PLAY_SEAT_ALREADY_ACTIVE', 'This wallet is already seated at a live table.', {
        tableId: activeSeat.tableId,
        seatNumber: activeSeat.seatNumber,
      });
    }
  } else {
    const activeSeat = deps.getActivePokerPlaySeatByWalletSubject(walletBinding.walletSubject);
    if (activeSeat && isSeatInPlay(activeSeat)) {
      throw createRouteError(409, 'POKER_PLAY_SEAT_ALREADY_ACTIVE', 'This wallet is already seated at a live table.', {
        tableId: activeSeat.tableId,
        seatNumber: activeSeat.seatNumber,
      });
    }
    const reentryLimit = getTournamentReentryLimit(leadTable);
    if (reentryLimit <= 0) {
      throw createRouteError(409, 'POKER_PLAY_REENTRY_UNAVAILABLE', 'This tournament series is a freezeout and does not allow re-entry.');
    }
    if (entryCount >= (1 + reentryLimit)) {
      throw createRouteError(409, 'POKER_PLAY_REENTRY_LIMIT_REACHED', 'This wallet has reached the tournament re-entry limit.', {
        reentryLimit,
        acceptedReentryCount: Math.max(0, entryCount - 1),
      });
    }
  }
  const candidates = activeEntries
    .map((entry) => ({
      ...entry,
      summary: computeTableSummary(entry.table, entry.seats, entry.hand, null),
    }))
    .filter((entry) => Number(entry?.summary?.openSeatCount || 0) > 0)
    .filter((entry) => !entry?.hand || entry.hand.status !== 'live' || resolveTournamentLateRegistration(entry.table, entry.hand).open)
    .sort((left, right) => {
      const leftSameWallet = getTournamentTableWalletEntryCount(left?.table, walletBinding.walletSubject, left?.seats) > 0 ? 1 : 0;
      const rightSameWallet = getTournamentTableWalletEntryCount(right?.table, walletBinding.walletSubject, right?.seats) > 0 ? 1 : 0;
      if (leftSameWallet !== rightSameWallet) return rightSameWallet - leftSameWallet;
      const occupancyDelta = Number(right?.summary?.occupancy || 0) - Number(left?.summary?.occupancy || 0);
      if (occupancyDelta !== 0) return occupancyDelta;
      return String(left?.table?.tableId || '').localeCompare(String(right?.table?.tableId || ''));
    });
  const candidate = candidates[0] || null;
  if (!candidate) {
    throw createRouteError(
      409,
      buybackMode === 'rebuy' ? 'POKER_PLAY_REBUY_UNAVAILABLE' : 'POKER_PLAY_REENTRY_UNAVAILABLE',
      buybackMode === 'rebuy'
        ? 'No open rebuy seat is currently available in this tournament series.'
        : 'No open re-entry seat is currently available in this tournament series.'
    );
  }
  return seatIntoTable(deps, {
    tableId: candidate.table.tableId,
    session,
    req,
    body: {
      ...body,
      asOf: requestAt,
      reentry: true,
      entryMode: buybackMode,
    },
  });
}

function reenterTournamentSeries(deps, { seriesId, session, req, body } = {}) {
  return enterTournamentSeriesBuyback(deps, {
    seriesId,
    session,
    req,
    body,
    mode: 'reentry',
  });
}

function rebuyTournamentSeries(deps, { seriesId, session, req, body } = {}) {
  return enterTournamentSeriesBuyback(deps, {
    seriesId,
    session,
    req,
    body,
    mode: 'rebuy',
  });
}

function addTournamentAddon(deps, { tableId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const synced = syncPokerPlayTable(deps, tableId, { processAt: body?.asOf });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  if (normalizePokerPlayTableType(synced.table.tableType) !== 'tournament') {
    throw createRouteError(409, 'POKER_PLAY_ADDON_UNAVAILABLE', 'Add-ons are tournament-only.');
  }
  if (isTableAdminClosed(synced.table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
  }
  if (isTablePaused(synced.table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_PAUSED', 'This poker table is paused by an operator.');
  }
  const { walletBinding, seat } = requireSeatWriter(deps, { table: synced.table, session, req });
  touchPokerPlaySeatPresence(deps, tableId, walletBinding.walletSubject, requestAt);
  const addonWindow = resolveTournamentAddonWindow(synced.table, synced.hand, requestAt);
  if (!addonWindow.open) {
    throw createRouteError(409, 'POKER_PLAY_ADDON_WINDOW_CLOSED', 'The add-on window is not open for this tournament.', {
      afterHandNumbers: addonWindow.afterHandNumbers,
      nextAfterHandNumber: addonWindow.nextAfterHandNumber,
    });
  }
  const maxAddonsPerSeat = getTournamentMaxAddonsPerSeat(synced.table);
  if (maxAddonsPerSeat <= 0) {
    throw createRouteError(409, 'POKER_PLAY_ADDON_UNAVAILABLE', 'This tournament does not allow add-ons.');
  }
  const existingAddonCount = Math.max(
    0,
    Number(synced.table?.state?.addonCountsByWallet?.[walletBinding.walletSubject] || 0)
  );
  if (existingAddonCount >= maxAddonsPerSeat) {
    throw createRouteError(409, 'POKER_PLAY_ADDON_LIMIT_REACHED', 'This seat has already used the allowed number of add-ons.', {
      maxAddonsPerSeat,
      acceptedAddonCount: existingAddonCount,
    });
  }
  if (!isSeatInPlay(seat)) {
    throw createRouteError(409, 'POKER_PLAY_ADDON_UNAVAILABLE', 'Only active tournament seats can take an add-on.');
  }
  const addonCostOil = getTournamentAddonCostOil(synced.table);
  const addonChipsOil = getTournamentAddonChipsOil(synced.table);
  assertPokerPlayWalletPolicyAllowsSpend(deps, walletBinding.walletSubject, {
    amountOil: addonCostOil,
    processAt: requestAt,
  });
  const oilBalance = deps.computeOilBalance(walletBinding.walletSubject);
  if (oilBalance.balance < addonCostOil) {
    throw createRouteError(409, 'OIL_BALANCE_TOO_LOW', 'Not enough OIL balance to cover the add-on.', {
      requiredOil: addonCostOil,
      balance: oilBalance.balance,
    });
  }
  deps.createOilLedgerEntry({
    walletSubject: walletBinding.walletSubject,
    houseId: seat.houseId || null,
    verificationId: seat.streamflowVerificationId || null,
    tableId: synced.table.tableId,
    seriesId: getTournamentSeriesRef(synced.table).seriesId || null,
    entryKind: 'poker_play_tournament_addon',
    direction: 'debit',
    amount: addonCostOil,
    memo: `${synced.table.title} add-on`,
  });
  const bountyDeltaOil = computeTournamentInitialBountyOil(addonCostOil, getTournamentBountyModel(synced.table), 0);
  const prizeDeltaOil = computeTournamentPrizeContributionOil(addonCostOil, getTournamentBountyModel(synced.table), 0);
  const updatedSeat = deps.upsertPokerPlaySeat({
    ...seat,
    stackOil: Number(seat?.stackOil || 0) + addonChipsOil,
    currentBountyOil: Number(seat?.currentBountyOil || 0) + bountyDeltaOil,
    updatedAt: requestAt,
  });
  const nextAddonCountsByWallet = {
    ...(synced.table?.state?.addonCountsByWallet && typeof synced.table.state.addonCountsByWallet === 'object'
      ? synced.table.state.addonCountsByWallet
      : {}),
    [walletBinding.walletSubject]: existingAddonCount + 1,
  };
  const updatedTable = deps.upsertPokerPlayTable({
    ...synced.table,
    state: {
      ...(synced.table.state && typeof synced.table.state === 'object' ? synced.table.state : {}),
      addonCount: Math.max(0, normalizeOilAmount(synced.table?.state?.addonCount, 0)) + 1,
      addonPrizePoolOil: Math.max(0, normalizeOilAmount(synced.table?.state?.addonPrizePoolOil, 0)) + prizeDeltaOil,
      addonBountyPoolOil: Math.max(0, normalizeOilAmount(synced.table?.state?.addonBountyPoolOil, 0)) + bountyDeltaOil,
      addonCountsByWallet: nextAddonCountsByWallet,
    },
    updatedAt: requestAt,
  });
  if (typeof deps.createPokerRebuyEvent === 'function') {
    deps.createPokerRebuyEvent({
      tableId: updatedTable.tableId,
      seriesId: getTournamentSeriesRef(updatedTable).seriesId || null,
      handId: synced.hand?.handId || synced.table?.state?.lastSettledHandId || null,
      walletSubject: walletBinding.walletSubject,
      houseId: seat.houseId || null,
      seatNumber: seat.seatNumber,
      eventKind: 'add_on',
      amountOil: addonCostOil,
      chipsOil: addonChipsOil,
      payload: {
        activeAfterHandNumber: addonWindow.activeAfterHandNumber,
        maxAddonsPerSeat,
      },
      createdAt: requestAt,
    });
  }
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: updatedTable.tableId,
      handId: synced.hand?.handId || synced.table?.state?.lastSettledHandId || null,
      seatNumber: seat.seatNumber,
      actorRole: 'human',
      eventKind: 'tournament_addon',
      payload: {
        walletSubject: walletBinding.walletSubject,
        addonCostOil,
        addonChipsOil,
        activeAfterHandNumber: addonWindow.activeAfterHandNumber,
      },
      createdAt: requestAt,
    });
  }
  upsertPokerPlayPlayerStatForSeat(deps, updatedTable, updatedSeat, {
    processAt: requestAt,
    reloadOilDelta: addonCostOil,
    stackOil: updatedSeat.stackOil,
    status: updatedSeat.status || 'open',
  });
  const refreshed = syncPokerPlayTable(deps, updatedTable.tableId, { processAt: requestAt });
  return buildPokerPlayTablePayload(deps, refreshed.table, refreshed.seats, refreshed.hand, {
    session,
    req,
    processAt: requestAt,
  });
}

function resolveTournamentChopContext(deps, seriesId, requestAt, { requireBetweenHands = true } = {}) {
  const entries = getTournamentDirectorEntries(deps, seriesId, requestAt, { includeClosed: true });
  const activeEntries = entries.filter((entry) => !isSeriesClosedTable(entry?.table));
  if (activeEntries.length !== 1) {
    throw createRouteError(409, 'POKER_PLAY_CHOP_NOT_FINAL_TABLE', 'Chop proposals are only available once the tournament is down to one active table.');
  }
  const activeEntry = activeEntries[0];
  if (normalizePokerPlayTableType(activeEntry?.table?.tableType) !== 'tournament') {
    throw createRouteError(409, 'POKER_PLAY_CHOP_TOURNAMENT_ONLY', 'Chop proposals are tournament-only.');
  }
  if (requireBetweenHands && activeEntry?.hand && activeEntry.hand.status === 'live') {
    throw createRouteError(409, 'POKER_PLAY_CHOP_HAND_LIVE', 'Chop proposals can only be created or approved between hands.');
  }
  const snapshot = buildTournamentChopSnapshot(entries);
  if (snapshot.remainingSeats.length < 2 || snapshot.remainingSeats.length > 3) {
    throw createRouteError(409, 'POKER_PLAY_CHOP_NOT_AVAILABLE', 'Chop proposals are only available with 2 or 3 seats remaining.');
  }
  return {
    entries,
    activeEntry,
    snapshot,
  };
}

function normalizePokerPlayChopPayouts(input, remainingSeats, payablePoolOil) {
  const items = Array.isArray(input) ? input : [];
  const seatByNumber = new Map((Array.isArray(remainingSeats) ? remainingSeats : []).map((seat) => [normalizeSeatNumber(seat?.seatNumber), seat]));
  const seenSeats = new Set();
  const normalized = [];
  for (const item of items) {
    const seatNumber = normalizeSeatNumber(item?.seatNumber);
    const seat = seatByNumber.get(seatNumber);
    if (!seat || seenSeats.has(seatNumber)) continue;
    seenSeats.add(seatNumber);
    normalized.push({
      seatNumber,
      walletSubject: normalizeTrimmedString(seat?.walletSubject),
      houseId: seat?.houseId || null,
      displayName: seat?.displayName || formatSeatLabel(seatNumber),
      amountOil: Math.max(0, normalizeOilAmount(item?.amountOil, 0)),
    });
  }
  if (normalized.length !== seatByNumber.size) {
    throw createRouteError(400, 'POKER_PLAY_CHOP_INVALID_PAYOUTS', 'A chop proposal must include one payout for each remaining seat.');
  }
  const totalOil = normalized.reduce((sum, item) => sum + Number(item.amountOil || 0), 0);
  const targetTotalOil = Math.max(0, normalizeOilAmount(payablePoolOil, 0));
  if (totalOil !== targetTotalOil) {
    throw createRouteError(409, 'POKER_PLAY_CHOP_TOTAL_MISMATCH', 'Chop payout totals must match the current payable pool exactly.', {
      payablePoolOil: targetTotalOil,
      proposedTotalOil: totalOil,
    });
  }
  return normalized.sort((left, right) => {
    const amountDelta = Number(right?.amountOil || 0) - Number(left?.amountOil || 0);
    if (amountDelta !== 0) return amountDelta;
    return normalizeSeatNumber(left?.seatNumber) - normalizeSeatNumber(right?.seatNumber);
  });
}

function settleTournamentSeriesByChopProposal(deps, proposal, {
  approvedBy = 'operator',
  atIso,
} = {}) {
  const requestAt = toProcessIso(deps, atIso);
  const context = resolveTournamentChopContext(deps, proposal?.seriesId, requestAt, { requireBetweenHands: true });
  const { entries, activeEntry, snapshot } = context;
  const currentRemainingSeats = getActiveSeatRows(activeEntry?.seats);
  const currentWallets = currentRemainingSeats.map((seat) => normalizeTrimmedString(seat?.walletSubject)).filter(Boolean).sort();
  const proposedWallets = (Array.isArray(proposal?.remainingSeats) ? proposal.remainingSeats : [])
    .map((seat) => normalizeTrimmedString(seat?.walletSubject))
    .filter(Boolean)
    .sort();
  if (currentWallets.length !== proposedWallets.length || currentWallets.some((wallet, index) => wallet !== proposedWallets[index])) {
    throw createRouteError(409, 'POKER_PLAY_CHOP_STALE', 'The remaining tournament seats changed after this chop proposal was created.');
  }
  const proposedPayouts = normalizePokerPlayChopPayouts(
    proposal?.proposedPayouts,
    currentRemainingSeats,
    snapshot.payablePoolOil
  );
  const proposalPayoutByWallet = new Map(proposedPayouts.map((item) => [normalizeTrimmedString(item.walletSubject), Number(item.amountOil || 0)]));
  const payoutByPlace = new Map((Array.isArray(snapshot?.economics?.payouts) ? snapshot.economics.payouts : []).map((item) => [Number(item.place || 0), Number(item.amountOil || 0)]));
  const remainingIdentities = new Set(currentRemainingSeats.map((seat) => getTournamentSeatIdentity(seat)));
  const orderedRemainingSeats = currentRemainingSeats
    .slice()
    .sort((left, right) => {
      const payoutDelta = Number(proposalPayoutByWallet.get(normalizeTrimmedString(right?.walletSubject)) || 0)
        - Number(proposalPayoutByWallet.get(normalizeTrimmedString(left?.walletSubject)) || 0);
      if (payoutDelta !== 0) return payoutDelta;
      const stackDelta = Number(right?.stackOil || 0) - Number(left?.stackOil || 0);
      if (stackDelta !== 0) return stackDelta;
      return normalizeSeatNumber(left?.seatNumber) - normalizeSeatNumber(right?.seatNumber);
    });
  const eliminatedSeats = sortSeatsByTournamentElimination(
    getTournamentAllSeats(entries).filter((seat) => !isTournamentVoidedSeat(seat) && !remainingIdentities.has(getTournamentSeatIdentity(seat)))
  );
  const placementDescriptors = [];
  for (let index = 0; index < orderedRemainingSeats.length; index += 1) {
    const seat = orderedRemainingSeats[index];
    placementDescriptors.push({
      identity: getTournamentSeatIdentity(seat),
      seat,
      place: index + 1,
      payoutOil: Number(proposalPayoutByWallet.get(normalizeTrimmedString(seat?.walletSubject)) || 0),
      payoutSource: 'deal',
    });
  }
  for (let index = 0; index < eliminatedSeats.length; index += 1) {
    const seat = eliminatedSeats[index];
    const place = orderedRemainingSeats.length + index + 1;
    placementDescriptors.push({
      identity: getTournamentSeatIdentity(seat),
      seat,
      place,
      payoutOil: Number(payoutByPlace.get(place) || 0),
      payoutSource: 'ladder',
    });
  }
  const placementMap = new Map(placementDescriptors.map((item) => [item.identity, item]));
  const settleTreasuryFees = !normalizeIsoString(activeEntry?.table?.state?.completedAt);
  for (const entry of entries) {
    const entryTable = entry?.table || null;
    const entryFeeOil = getTournamentEntryFeeOil(entryTable);
    for (const seat of Array.isArray(entry?.seats) ? entry.seats : []) {
      const placement = placementMap.get(getTournamentSeatIdentity(seat));
      if (!placement) continue;
      const payoutOil = Math.max(0, Number(placement?.payoutOil || 0));
      const bountyPayoutOil = Number(seat?.currentBountyOil || 0) > 0 && !seat?.bountySettledAt
        ? Math.max(0, Number(seat?.currentBountyOil || 0))
        : 0;
      if (payoutOil > 0 && !seat?.payoutSettledAt) {
        deps.createOilLedgerEntry({
          walletSubject: seat.walletSubject,
          houseId: seat.houseId || null,
          verificationId: seat.streamflowVerificationId || null,
          tableId: entryTable.tableId,
          seriesId: getTournamentSeriesRef(entryTable).seriesId || null,
          entryKind: 'poker_play_tournament_prize',
          direction: 'credit',
          amount: payoutOil,
          memo: `${entryTable.title} chop payout`,
          createdAt: requestAt,
        });
      }
      if (bountyPayoutOil > 0) {
        deps.createOilLedgerEntry({
          walletSubject: seat.walletSubject,
          houseId: seat.houseId || null,
          verificationId: seat.streamflowVerificationId || null,
          tableId: entryTable.tableId,
          seriesId: getTournamentSeriesRef(entryTable).seriesId || null,
          entryKind: 'poker_play_tournament_bounty',
          direction: 'credit',
          amount: bountyPayoutOil,
          memo: `${entryTable.title} remaining bounty settlement`,
          createdAt: requestAt,
        });
      }
      if (settleTreasuryFees && entryFeeOil > 0) {
        createRoomTreasuryCredit(deps, {
          table: entryTable,
          seriesId: getTournamentSeriesRef(entryTable).seriesId || null,
          amountOil: entryFeeOil,
          memo: `Tournament fee from ${entryTable.title}`,
          createdAt: requestAt,
        });
      }
      const updatedSeat = deps.upsertPokerPlaySeat({
        ...seat,
        status: payoutOil > 0 ? 'paid' : 'busted',
        stackOil: 0,
        eliminatedAt: Number(placement.place || 0) === 1 ? (seat?.eliminatedAt || null) : (seat?.eliminatedAt || requestAt),
        prizeOil: payoutOil,
        currentBountyOil: 0,
        bountyWonOil: Number(seat?.bountyWonOil || 0) + bountyPayoutOil,
        bountySettledAt: bountyPayoutOil > 0 ? requestAt : (seat?.bountySettledAt || null),
        payoutSettledAt: payoutOil > 0 ? (seat?.payoutSettledAt || requestAt) : (seat?.payoutSettledAt || null),
        updatedAt: requestAt,
      });
      upsertPokerPlayPlayerStatForSeat(deps, entryTable, updatedSeat, {
        processAt: requestAt,
        prizeOil: payoutOil,
        bountyOilDelta: bountyPayoutOil,
        entryFeeOilDelta: settleTreasuryFees ? entryFeeOil : 0,
        finishPosition: Number(placement.place || 0) || null,
        status: payoutOil > 0 ? 'paid' : 'busted',
        payoutSettledAt: payoutOil > 0 ? (seat?.payoutSettledAt || requestAt) : null,
        close: true,
        stackOil: 0,
      });
      const resultHandId = entry?.hand?.handId || entryTable?.state?.lastSettledHandId || entryTable?.state?.activeHandId || null;
      if ((payoutOil > 0 || bountyPayoutOil > 0) && resultHandId) {
        deps.createPokerPlayMessage({
          tableId: entryTable.tableId,
          handId: resultHandId,
          seatNumber: null,
          authorRole: 'system',
          body: `${formatSeatLabel(seat.seatNumber, seat.displayName)} settles by deal for ${payoutOil} OIL${bountyPayoutOil > 0 ? ` plus ${bountyPayoutOil} OIL bounty` : ''}.`,
          createdAt: requestAt,
        });
      }
    }
  }
  const finalEntries = listTournamentSeriesEntriesBySeriesId(deps, normalizeTrimmedString(proposal?.seriesId), {
    processAt: requestAt,
    includeClosed: true,
  });
  const finalStandings = buildCompletedTournamentPlacements(finalEntries);
  const finalSeats = getTournamentAllSeats(finalEntries).filter((seat) => !isTournamentVoidedSeat(seat));
  const finalPayouts = placementDescriptors
    .map((item) => ({
      place: Number(item.place || 0),
      amountOil: Number(item.payoutOil || 0),
      percent: snapshot.payablePoolOil > 0 || snapshot.economics.prizePoolOil > 0
        ? Number((((Number(item.payoutOil || 0)) / Math.max(1, Number(snapshot.economics.prizePoolOil || 0))) * 100).toFixed(2))
        : 0,
    }))
    .sort((left, right) => Number(left.place || 0) - Number(right.place || 0));
  const winner = finalStandings[0] || null;
  const paidPlaces = finalPayouts.filter((item) => Number(item.amountOil || 0) > 0).length;
  const totalBountyAwardedOil = finalSeats.reduce((sum, seat) => sum + Math.max(0, Number(seat?.bountyWonOil || 0)), 0);
  for (const entry of finalEntries) {
    const entryTable = entry?.table || null;
    if (!entryTable) continue;
    deps.upsertPokerPlayTable({
      ...entryTable,
      status: isSeriesClosedTable(entryTable) ? entryTable.status : 'open',
      state: {
        ...(entryTable.state && typeof entryTable.state === 'object' ? entryTable.state : {}),
        completedAt: entryTable?.state?.completedAt || requestAt,
        winnerSeatNumber: winner && String(winner.tableId || '') === String(entryTable.tableId || '')
          ? normalizeSeatNumber(winner.seatNumber)
          : normalizeSeatNumber(entryTable?.state?.winnerSeatNumber),
        prizeOil: Number(finalPayouts?.[0]?.amountOil || 0),
        prizePoolOil: Number(snapshot.economics.prizePoolOil || 0),
        bountyModel: snapshot.economics.bountyModel,
        bountyPoolOil: Number(snapshot.economics.bountyPoolOil || 0),
        totalBountyAwardedOil,
        prizeSettledAt: entryTable?.state?.prizeSettledAt || requestAt,
        payoutModel: 'deal_custom',
        paidPlaces,
        payouts: cloneJson(finalPayouts, []),
        standings: cloneJson(finalStandings, []),
        activeHandId: entry?.hand?.handId || entryTable?.state?.activeHandId || null,
        activeHandNumber: Number(entry?.hand?.handNumber || entryTable?.state?.activeHandNumber || 0),
        chopSettledAt: requestAt,
        chopProposalId: normalizeTrimmedString(proposal?.proposalId) || null,
        pausedAt: null,
        pausedReason: null,
        pausedBy: null,
        pausedActionRemainingMs: 0,
      },
      updatedAt: requestAt,
    });
  }
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: activeEntry.table.tableId,
      handId: activeEntry?.hand?.handId || activeEntry?.table?.state?.lastSettledHandId || null,
      seatNumber: null,
      actorRole: 'operator',
      eventKind: 'chop_settled',
      payload: {
        proposalId: normalizeTrimmedString(proposal?.proposalId),
        proposalKind: normalizeTrimmedString(proposal?.proposalKind, 'deal_custom'),
        seriesId: normalizeTrimmedString(proposal?.seriesId),
        tableId: activeEntry.table.tableId,
        agreementCount: (Array.isArray(proposal?.agreements) ? proposal.agreements : []).filter((item) => normalizeIsoString(item?.agreedAt)).length,
        allAgreed: true,
        payablePoolOil: Number(snapshot.payablePoolOil || 0),
      },
      createdAt: requestAt,
    });
  }
  return {
    tableId: activeEntry.table.tableId,
    seriesId: normalizeTrimmedString(proposal?.seriesId),
    payouts: finalPayouts,
    standings: finalStandings,
  };
}

function createChopProposal(deps, { seriesId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const context = resolveTournamentChopContext(deps, seriesId, requestAt, { requireBetweenHands: true });
  const { activeEntry, snapshot } = context;
  const { walletBinding, seat } = requireSeatWriter(deps, { table: activeEntry.table, session, req });
  touchPokerPlaySeatPresence(deps, activeEntry.table.tableId, walletBinding.walletSubject, requestAt);
  if (!snapshot.remainingSeats.find((item) => normalizeTrimmedString(item?.walletSubject) === walletBinding.walletSubject)) {
    throw createRouteError(403, 'FORBIDDEN', 'Only remaining tournament seats can propose a chop.');
  }
  const existing = getLatestSeriesChopProposal(deps, normalizeTrimmedString(seriesId), { activeOnly: true });
  if (existing) {
    throw createRouteError(409, 'POKER_PLAY_CHOP_ALREADY_OPEN', 'An active chop proposal already exists for this tournament series.', {
      proposalId: existing.proposalId,
      status: existing.status,
    });
  }
  const proposedPayouts = normalizePokerPlayChopPayouts(body?.payouts, snapshot.remainingSeats, snapshot.payablePoolOil);
  const proposal = deps.upsertPokerChopProposal({
    seriesId: normalizeTrimmedString(seriesId),
    tableId: activeEntry.table.tableId,
    handId: activeEntry?.hand?.handId || activeEntry?.table?.state?.lastSettledHandId || null,
    status: snapshot.remainingSeats.length === 1 ? 'pending_approval' : 'open',
    proposalKind: 'deal_custom',
    proposerWalletSubject: walletBinding.walletSubject,
    proposerHouseId: seat.houseId || null,
    proposerSeatNumber: seat.seatNumber,
    note: normalizePokerPlayChopNote(body?.note),
    remainingSeats: snapshot.remainingSeats,
    defaultPayouts: snapshot.defaultPayouts,
    fixedPayouts: snapshot.fixedPayouts,
    proposedPayouts,
    agreements: snapshot.remainingSeats.map((item) => ({
      walletSubject: item.walletSubject,
      seatNumber: item.seatNumber,
      displayName: item.displayName,
      agreedAt: normalizeTrimmedString(item.walletSubject) === walletBinding.walletSubject ? requestAt : null,
    })),
    settlement: {
      payablePoolOil: Number(snapshot.payablePoolOil || 0),
      defaultPayoutModel: snapshot.economics?.payoutModel || '',
      prizePoolOil: Number(snapshot.economics?.prizePoolOil || 0),
      fixedPayoutTotalOil: Number(snapshot.fixedPayouts.reduce((sum, item) => sum + Number(item.amountOil || 0), 0)),
    },
    createdAt: requestAt,
    updatedAt: requestAt,
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: activeEntry.table.tableId,
      handId: proposal.handId || null,
      seatNumber: seat.seatNumber,
      actorRole: 'human',
      eventKind: 'chop_proposed',
      payload: {
        proposalId: proposal.proposalId,
        proposalKind: proposal.proposalKind,
        seriesId: proposal.seriesId,
        tableId: proposal.tableId,
        agreementCount: 1,
        allAgreed: false,
        payablePoolOil: Number(snapshot.payablePoolOil || 0),
      },
      createdAt: requestAt,
    });
  }
  const refreshed = syncPokerPlayTable(deps, activeEntry.table.tableId, { processAt: requestAt });
  return {
    proposal: buildPokerPlayChopProposalSummary(proposal, { viewerWalletSubject: walletBinding.walletSubject }),
    table: buildPokerPlayTablePayload(deps, refreshed.table, refreshed.seats, refreshed.hand, {
      session,
      req,
      processAt: requestAt,
    }),
  };
}

function agreeToChopProposal(deps, { proposalId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const proposal = typeof deps.getPokerChopProposalById === 'function'
    ? deps.getPokerChopProposalById(proposalId)
    : null;
  if (!proposal) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker chop proposal not found.');
  }
  if (!POKER_PLAY_CHOP_ACTIVE_STATUSES.has(normalizePokerPlayChopStatus(proposal?.status, 'open'))) {
    throw createRouteError(409, 'POKER_PLAY_CHOP_CLOSED', 'This poker chop proposal is no longer active.');
  }
  const context = resolveTournamentChopContext(deps, proposal.seriesId, requestAt, { requireBetweenHands: true });
  const { activeEntry, snapshot } = context;
  const { walletBinding } = requireSeatWriter(deps, { table: activeEntry.table, session, req });
  touchPokerPlaySeatPresence(deps, activeEntry.table.tableId, walletBinding.walletSubject, requestAt);
  const seat = snapshot.remainingSeats.find((item) => normalizeTrimmedString(item?.walletSubject) === walletBinding.walletSubject);
  if (!seat) {
    throw createRouteError(403, 'FORBIDDEN', 'Only remaining tournament seats can agree to a chop proposal.');
  }
  const nextAgreements = (Array.isArray(proposal?.agreements) ? proposal.agreements : []).map((item) => (
    normalizeTrimmedString(item?.walletSubject) === walletBinding.walletSubject
      ? {
        ...cloneJson(item, {}),
        seatNumber: seat.seatNumber,
        displayName: seat.displayName,
        agreedAt: requestAt,
      }
      : cloneJson(item, {})
  ));
  const allAgreed = nextAgreements.every((item) => normalizeIsoString(item?.agreedAt));
  const updated = deps.upsertPokerChopProposal({
    ...proposal,
    status: allAgreed ? 'pending_approval' : 'open',
    agreements: nextAgreements,
    updatedAt: requestAt,
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: activeEntry.table.tableId,
      handId: updated.handId || null,
      seatNumber: seat.seatNumber,
      actorRole: 'human',
      eventKind: 'chop_agreed',
      payload: {
        proposalId: updated.proposalId,
        proposalKind: updated.proposalKind,
        seriesId: updated.seriesId,
        tableId: updated.tableId,
        agreementCount: nextAgreements.filter((item) => normalizeIsoString(item?.agreedAt)).length,
        allAgreed,
        payablePoolOil: Number(updated?.settlement?.payablePoolOil || 0),
      },
      createdAt: requestAt,
    });
  }
  const refreshed = syncPokerPlayTable(deps, activeEntry.table.tableId, { processAt: requestAt });
  return {
    proposal: buildPokerPlayChopProposalSummary(updated, { viewerWalletSubject: walletBinding.walletSubject }),
    table: buildPokerPlayTablePayload(deps, refreshed.table, refreshed.seats, refreshed.hand, {
      session,
      req,
      processAt: requestAt,
    }),
  };
}

function reviewChopProposal(deps, { proposalId, body, processAt } = {}) {
  const requestAt = toProcessIso(deps, processAt || body?.asOf);
  const proposal = typeof deps.getPokerChopProposalById === 'function'
    ? deps.getPokerChopProposalById(proposalId)
    : null;
  if (!proposal) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker chop proposal not found.');
  }
  if (!POKER_PLAY_CHOP_ACTIVE_STATUSES.has(normalizePokerPlayChopStatus(proposal?.status, 'open'))) {
    throw createRouteError(409, 'POKER_PLAY_CHOP_CLOSED', 'This poker chop proposal is already closed.');
  }
  const action = normalizeTrimmedString(body?.status, 'approved').toLowerCase();
  if (action !== 'approved' && action !== 'rejected') {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Chop review status must be approved or rejected.');
  }
  const approvedBy = normalizeTrimmedString(body?.approvedBy || body?.resolvedBy, 'operator');
  if (action === 'rejected') {
    const rejected = deps.upsertPokerChopProposal({
      ...proposal,
      status: 'rejected',
      rejectedAt: requestAt,
      rejectedBy: approvedBy,
      updatedAt: requestAt,
    });
    if (typeof deps.createPokerPlayAuditEvent === 'function') {
      deps.createPokerPlayAuditEvent({
        tableId: rejected.tableId,
        handId: rejected.handId || null,
        seatNumber: null,
        actorRole: 'operator',
        eventKind: 'chop_rejected',
        payload: {
          proposalId: rejected.proposalId,
          proposalKind: rejected.proposalKind,
          seriesId: rejected.seriesId,
          tableId: rejected.tableId,
          agreementCount: (Array.isArray(rejected?.agreements) ? rejected.agreements : []).filter((item) => normalizeIsoString(item?.agreedAt)).length,
          allAgreed: false,
          payablePoolOil: Number(rejected?.settlement?.payablePoolOil || 0),
        },
        createdAt: requestAt,
      });
    }
    return {
      proposal: buildPokerPlayChopProposalSummary(rejected, { publicViewer: false }),
      review: buildPokerPlayAdminSeriesReviewPayload(deps, {
        seriesId: rejected.seriesId,
        processAt: requestAt,
      }),
    };
  }
  const agreementCount = (Array.isArray(proposal?.agreements) ? proposal.agreements : []).filter((item) => normalizeIsoString(item?.agreedAt)).length;
  const remainingSeatCount = Array.isArray(proposal?.remainingSeats) ? proposal.remainingSeats.length : 0;
  if (!remainingSeatCount || agreementCount < remainingSeatCount) {
    throw createRouteError(409, 'POKER_PLAY_CHOP_AGREEMENTS_INCOMPLETE', 'Every remaining seat must agree before operator approval.', {
      agreementCount,
      remainingSeatCount,
    });
  }
  const settled = settleTournamentSeriesByChopProposal(deps, proposal, {
    approvedBy,
    atIso: requestAt,
  });
  const updated = deps.upsertPokerChopProposal({
    ...proposal,
    status: 'settled',
    approvedAt: requestAt,
    approvedBy,
    settledAt: requestAt,
    settlement: {
      ...(proposal?.settlement && typeof proposal.settlement === 'object' ? proposal.settlement : {}),
      settledAt: requestAt,
      payoutCount: Array.isArray(settled?.payouts) ? settled.payouts.length : 0,
    },
    updatedAt: requestAt,
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: settled.tableId || updated.tableId,
      handId: updated.handId || null,
      seatNumber: null,
      actorRole: 'operator',
      eventKind: 'chop_approved',
      payload: {
        proposalId: updated.proposalId,
        proposalKind: updated.proposalKind,
        seriesId: updated.seriesId,
        tableId: updated.tableId,
        agreementCount,
        allAgreed: true,
        payablePoolOil: Number(updated?.settlement?.payablePoolOil || 0),
      },
      createdAt: requestAt,
    });
  }
  return {
    proposal: buildPokerPlayChopProposalSummary(updated, { publicViewer: false }),
    review: buildPokerPlayAdminSeriesReviewPayload(deps, {
      seriesId: updated.seriesId,
      processAt: requestAt,
    }),
  };
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
      const cashoutTerms = resolveCashSessionCashoutTerms(deps, synced.table, seat, Number(seat.stackOil || 0));
      deps.createOilLedgerEntry({
        walletSubject: walletBinding.walletSubject,
        houseId: seat.houseId || null,
        verificationId: seat.streamflowVerificationId || null,
        tableId: synced.table.tableId,
        seriesId: getTournamentSeriesRef(synced.table).seriesId || null,
        entryKind: 'poker_play_cashout',
        direction: 'credit',
        amount: Number(cashoutTerms.netReturnOil || 0),
        memo: `${synced.table.title} cashout`,
      });
      if (Number(cashoutTerms.rakeOil || 0) > 0) {
        createPokerPlayRoomTreasuryCredit(deps, {
          table: synced.table,
          amountOil: cashoutTerms.rakeOil,
          memo: `${synced.table.title} cash rake`,
          createdAt: requestAt,
        });
      }
      upsertPokerPlayPlayerStatForSeat(deps, synced.table, seat, {
        processAt: requestAt,
        cashoutOilDelta: Number(cashoutTerms.netReturnOil || 0),
        rakeOilDelta: Number(cashoutTerms.rakeOil || 0),
        status: 'cashed_out',
        close: true,
        stackOil: 0,
      });
    } else {
      upsertPokerPlayPlayerStatForSeat(deps, synced.table, seat, {
        processAt: requestAt,
        cashoutOilDelta: 0,
        status: 'cashed_out',
        close: true,
        stackOil: 0,
      });
    }
    deps.deletePokerPlaySeat(seat.tableId, seat.seatNumber);
    deps.upsertPokerPlayTable({
      ...synced.table,
      state: removeSeatTimeBankState(synced.table, seat.seatNumber),
      updatedAt: requestAt,
    });
  } else {
    if (!liveHand && !hasPokerPlayTableStarted(synced.table, synced.hand)) {
      if (Number(seat.stackOil || 0) > 0) {
        deps.createOilLedgerEntry({
          walletSubject: walletBinding.walletSubject,
          houseId: seat.houseId || null,
          verificationId: seat.streamflowVerificationId || null,
          tableId: synced.table.tableId,
          seriesId: getTournamentSeriesRef(synced.table).seriesId || null,
          entryKind: 'poker_play_tournament_unregister',
          direction: 'credit',
          amount: Number(seat.stackOil || 0),
          memo: `${synced.table.title} pre-start unregister`,
        });
      }
      upsertPokerPlayPlayerStatForSeat(deps, synced.table, seat, {
        processAt: requestAt,
        refundOilDelta: Number(seat.stackOil || 0),
        status: 'unregistered',
        close: true,
        stackOil: 0,
      });
      deps.deletePokerPlaySeat(seat.tableId, seat.seatNumber);
      deps.upsertPokerPlayTable({
        ...synced.table,
        state: removeSeatTimeBankState(synced.table, seat.seatNumber),
        updatedAt: requestAt,
      });
      if (typeof deps.createPokerPlayAuditEvent === 'function') {
        deps.createPokerPlayAuditEvent({
          tableId: synced.table.tableId,
          handId: null,
          seatNumber: seat.seatNumber,
          actorRole: 'human',
          eventKind: 'tournament_unregistered',
          payload: {
            walletSubject: walletBinding.walletSubject,
            refundedOil: Number(seat.stackOil || 0),
          },
          createdAt: requestAt,
        });
      }
      const refreshedScheduled = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
      return buildPokerPlayTablePayload(deps, refreshedScheduled.table, refreshedScheduled.seats, refreshedScheduled.hand, { session, req, processAt: requestAt });
    }
    if (liveHand && normalizeTrimmedString(seat?.status).toLowerCase() === 'registered') {
      if (Number(seat.stackOil || 0) > 0) {
        deps.createOilLedgerEntry({
          walletSubject: walletBinding.walletSubject,
          houseId: seat.houseId || null,
          verificationId: seat.streamflowVerificationId || null,
          tableId: synced.table.tableId,
          seriesId: getTournamentSeriesRef(synced.table).seriesId || null,
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
      upsertPokerPlayPlayerStatForSeat(deps, synced.table, seat, {
        processAt: requestAt,
        refundOilDelta: Number(seat.stackOil || 0),
        status: 'unregistered',
        close: true,
        stackOil: 0,
      });
      deps.deletePokerPlaySeat(seat.tableId, seat.seatNumber);
      deps.upsertPokerPlayTable({
        ...synced.table,
        state: removeSeatTimeBankState(synced.table, seat.seatNumber),
        updatedAt: requestAt,
      });
      const refreshedRegistered = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
      return buildPokerPlayTablePayload(deps, refreshedRegistered.table, refreshedRegistered.seats, refreshedRegistered.hand, { session, req, processAt: requestAt });
    }
    if (liveHand) {
      throw createRouteError(409, 'POKER_PLAY_HAND_IN_PROGRESS', 'Tournament seats can only leave after the current hand settles.');
    }
    if (seat.status === 'active' && Number(seat.stackOil || 0) > 0) {
      throw createRouteError(409, 'POKER_PLAY_TOURNAMENT_STILL_ACTIVE', 'Tournament chips must finish the table; cashout is not available.');
    }
    upsertPokerPlayPlayerStatForSeat(deps, synced.table, seat, {
      processAt: requestAt,
      status: normalizeTrimmedString(seat?.status, 'busted'),
      close: true,
      stackOil: 0,
    });
    deps.deletePokerPlaySeat(seat.tableId, seat.seatNumber);
    deps.upsertPokerPlayTable({
      ...synced.table,
      state: removeSeatTimeBankState(synced.table, seat.seatNumber),
      updatedAt: requestAt,
    });
  }

  const refreshed = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  return buildPokerPlayTablePayload(deps, refreshed.table, refreshed.seats, refreshed.hand, { session, req, processAt: requestAt });
}

function changeCashTableSeat(deps, { tableId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  if (normalizePokerPlayTableType(synced.table?.tableType) !== 'cash') {
    throw createRouteError(409, 'POKER_PLAY_SEAT_CHANGE_UNAVAILABLE', 'Seat change is only available at cash tables.');
  }
  if (isTableAdminClosed(synced.table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
  }
  const { walletBinding, seat } = requireSeatWriter(deps, { table: synced.table, session, req });
  if (synced.hand && synced.hand.status === 'live') {
    throw createRouteError(409, 'POKER_PLAY_HAND_IN_PROGRESS', 'Seat change is only available between hands.');
  }
  if (!isCashSeatMovementAllowed(synced.table, seat, synced.hand)) {
    throw createRouteError(409, 'POKER_PLAY_SEAT_CHANGE_UNAVAILABLE', 'This seat cannot move right now.');
  }
  const targetSeatNumber = normalizeSeatNumber(body?.seatNumber);
  if (!targetSeatNumber || targetSeatNumber === normalizeSeatNumber(seat.seatNumber)) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Choose a different open seat.');
  }
  const openSeatNumbers = listCashSeatChangeOpenSeatNumbers(synced.table, synced.seats, seat.seatNumber);
  if (!openSeatNumbers.includes(targetSeatNumber)) {
    throw createRouteError(409, 'POKER_PLAY_SEAT_UNAVAILABLE', 'That cash seat is not open.');
  }

  const carriedTimeBank = getSeatTimeBankRemainingSeconds(synced.table, seat.seatNumber);
  deps.deletePokerPlaySeat(synced.table.tableId, seat.seatNumber);
  const nextSeat = deps.upsertPokerPlaySeat({
    ...seat,
    seatNumber: targetSeatNumber,
    lastSeenAt: requestAt,
    updatedAt: requestAt,
  });
  const nextState = setSeatTimeBankRemainingSeconds(
    {
      ...synced.table,
      state: removeSeatTimeBankState(synced.table, seat.seatNumber),
    },
    targetSeatNumber,
    carriedTimeBank
  );
  deps.upsertPokerPlayTable({
    ...synced.table,
    state: nextState,
    updatedAt: requestAt,
  });
  moveOpenPokerPlayPlayerStatForSeat(deps, {
    sourceTable: synced.table,
    targetTable: synced.table,
    seat: nextSeat,
    targetSeatNumber,
    processAt: requestAt,
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: synced.table.tableId,
      handId: synced.hand?.handId || null,
      seatNumber: targetSeatNumber,
      actorRole: 'human',
      eventKind: 'seat_changed',
      payload: {
        walletSubject: walletBinding.walletSubject,
        fromSeatNumber: normalizeSeatNumber(seat.seatNumber),
        toSeatNumber: targetSeatNumber,
      },
      createdAt: requestAt,
    });
  }
  const refreshed = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  return buildPokerPlayTablePayload(deps, refreshed.table, refreshed.seats, refreshed.hand, { session, req, processAt: requestAt });
}

function transferCashTableSeat(deps, { tableId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const synced = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  if (normalizePokerPlayTableType(synced.table?.tableType) !== 'cash') {
    throw createRouteError(409, 'POKER_PLAY_TRANSFER_UNAVAILABLE', 'Table transfer is only available at cash tables.');
  }
  if (isTableAdminClosed(synced.table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
  }
  const { walletBinding, seat } = requireSeatWriter(deps, { table: synced.table, session, req });
  if (synced.hand && synced.hand.status === 'live') {
    throw createRouteError(409, 'POKER_PLAY_HAND_IN_PROGRESS', 'Table transfer is only available between hands.');
  }
  if (!isCashSeatMovementAllowed(synced.table, seat, synced.hand)) {
    throw createRouteError(409, 'POKER_PLAY_TRANSFER_UNAVAILABLE', 'This seat cannot transfer right now.');
  }
  const targetTableId = normalizeTrimmedString(body?.targetTableId);
  if (!targetTableId || targetTableId === normalizeTrimmedString(synced.table.tableId)) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Choose a different compatible cash table.');
  }
  const targetSynced = syncPokerPlayTable(deps, targetTableId, { processAt: requestAt });
  if (!targetSynced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Target poker table not found.');
  }
  if (normalizePokerPlayTableType(targetSynced.table?.tableType) !== 'cash') {
    throw createRouteError(409, 'POKER_PLAY_TRANSFER_INCOMPATIBLE', 'Target table must be a compatible cash table.');
  }
  if (isTableAdminClosed(targetSynced.table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'Target poker table was closed by an operator.');
  }
  if (isTablePaused(targetSynced.table) || normalizeTrimmedString(targetSynced.table?.status, 'open') !== 'open') {
    throw createRouteError(409, 'POKER_PLAY_TRANSFER_INCOMPATIBLE', 'Target cash table is not open for transfers.');
  }
  if (targetSynced.hand && targetSynced.hand.status === 'live') {
    throw createRouteError(409, 'POKER_PLAY_HAND_IN_PROGRESS', 'Target table must also be between hands.');
  }
  const houseId = getSessionHouseId(session);
  requirePokerPlayTableAccess(targetSynced.table, {
    walletSubject: walletBinding.walletSubject,
    houseId,
    viewerSeat: deps.getPokerPlaySeatByWalletSubject(targetSynced.table.tableId, walletBinding.walletSubject),
    inviteCode: parsePokerPlayInviteCode(req, body),
    publicViewer: false,
  });
  const sourceMatchKey = normalizeTrimmedString(
    synced.table?.rules?.matchKey || synced.table?.summary?.matchKey || buildMatchKeyFromTable(synced.table)
  );
  const targetMatchKey = normalizeTrimmedString(
    targetSynced.table?.rules?.matchKey || targetSynced.table?.summary?.matchKey || buildMatchKeyFromTable(targetSynced.table)
  );
  const sourceAccessMode = normalizePokerPlayAccessMode(getPokerPlayTableAccess(synced.table).mode);
  const targetAccessMode = normalizePokerPlayAccessMode(getPokerPlayTableAccess(targetSynced.table).mode);
  if (!sourceMatchKey || sourceMatchKey !== targetMatchKey || sourceAccessMode !== targetAccessMode) {
    throw createRouteError(409, 'POKER_PLAY_TRANSFER_INCOMPATIBLE', 'Target table is not compatible with this cash seat.');
  }
  if (deps.getPokerPlaySeatByWalletSubject(targetSynced.table.tableId, walletBinding.walletSubject)) {
    throw createRouteError(409, 'POKER_PLAY_ALREADY_SEATED', 'This wallet already has a seat at the target table.');
  }
  const requestedTargetSeatNumber = normalizeSeatNumber(body?.targetSeatNumber ?? body?.seatNumber);
  const openSeatNumbers = listCashSeatChangeOpenSeatNumbers(targetSynced.table, targetSynced.seats, 0);
  const targetSeatNumber = requestedTargetSeatNumber || openSeatNumbers[0] || 0;
  if (!targetSeatNumber || !openSeatNumbers.includes(targetSeatNumber)) {
    throw createRouteError(409, 'POKER_PLAY_SEAT_UNAVAILABLE', 'That target seat is not open.');
  }

  const carriedTimeBank = getSeatTimeBankRemainingSeconds(synced.table, seat.seatNumber);
  const movedSeat = deps.upsertPokerPlaySeat({
    ...seat,
    tableId: targetSynced.table.tableId,
    seatNumber: targetSeatNumber,
    lastSeenAt: requestAt,
    updatedAt: requestAt,
  });
  deps.deletePokerPlaySeat(synced.table.tableId, seat.seatNumber);
  deps.upsertPokerPlayTable({
    ...synced.table,
    state: removeSeatTimeBankState(synced.table, seat.seatNumber),
    updatedAt: requestAt,
  });
  deps.upsertPokerPlayTable({
    ...targetSynced.table,
    state: setSeatTimeBankRemainingSeconds(targetSynced.table, targetSeatNumber, carriedTimeBank),
    updatedAt: requestAt,
  });
  moveOpenPokerPlayPlayerStatForSeat(deps, {
    sourceTable: synced.table,
    targetTable: targetSynced.table,
    seat: movedSeat,
    targetSeatNumber,
    processAt: requestAt,
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: synced.table.tableId,
      handId: synced.hand?.handId || null,
      seatNumber: normalizeSeatNumber(seat.seatNumber),
      actorRole: 'human',
      eventKind: 'seat_transferred_out',
      payload: {
        walletSubject: walletBinding.walletSubject,
        sourceTableId: synced.table.tableId,
        sourceSeatNumber: normalizeSeatNumber(seat.seatNumber),
        targetTableId: targetSynced.table.tableId,
        targetSeatNumber,
      },
      createdAt: requestAt,
    });
    deps.createPokerPlayAuditEvent({
      tableId: targetSynced.table.tableId,
      handId: targetSynced.hand?.handId || null,
      seatNumber: targetSeatNumber,
      actorRole: 'human',
      eventKind: 'seat_transferred_in',
      payload: {
        walletSubject: walletBinding.walletSubject,
        sourceTableId: synced.table.tableId,
        sourceSeatNumber: normalizeSeatNumber(seat.seatNumber),
        targetTableId: targetSynced.table.tableId,
        targetSeatNumber,
      },
      createdAt: requestAt,
    });
  }
  const refreshed = syncPokerPlayTable(deps, targetSynced.table.tableId, { processAt: requestAt });
  return {
    ...buildPokerPlayTablePayload(deps, refreshed.table, refreshed.seats, refreshed.hand, { session, req, processAt: requestAt }),
    transfer: {
      sourceTableId: synced.table.tableId,
      sourceSeatNumber: normalizeSeatNumber(seat.seatNumber),
      targetTableId: targetSynced.table.tableId,
      targetSeatNumber,
    },
  };
}

function reloadTableSeat(deps, { tableId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const table = deps.getPokerPlayTableById(tableId);
  if (!table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  if (normalizePokerPlayTableType(table?.tableType) !== 'cash') {
    throw createRouteError(409, 'POKER_PLAY_RELOAD_UNAVAILABLE', 'Reload is only available at cash tables.');
  }
  if (isTableAdminClosed(table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
  }
  if (isTablePaused(table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_PAUSED', 'This poker table is paused by an operator.');
  }
  const { walletBinding, seat } = requireSeatWriter(deps, { table, session, req });
  const currentHand = deps.getCurrentPokerPlayHandForTable(table.tableId);
  if (currentHand && currentHand.status === 'live') {
    throw createRouteError(409, 'POKER_PLAY_HAND_IN_PROGRESS', 'Reload is only available between hands.');
  }
  const amountOil = normalizeReloadAmount(body?.amountOil);
  if (amountOil <= 0) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Reload amount must be greater than zero.');
  }
  assertPokerPlayWalletPolicyAllowsSpend(deps, walletBinding.walletSubject, {
    amountOil,
    processAt: requestAt,
  });
  const oilBalance = deps.computeOilBalance(walletBinding.walletSubject);
  if (Number(oilBalance?.balance || 0) < amountOil) {
    throw createRouteError(409, 'OIL_BALANCE_TOO_LOW', 'Not enough OIL balance to reload this seat.', {
      requiredOil: amountOil,
      balance: Number(oilBalance?.balance || 0),
    });
  }
  deps.createOilLedgerEntry({
    walletSubject: walletBinding.walletSubject,
    houseId: seat.houseId || null,
    verificationId: seat.streamflowVerificationId || null,
    tableId: table.tableId,
    seriesId: getTournamentSeriesRef(table).seriesId || null,
    entryKind: 'poker_play_reload',
    direction: 'debit',
    amount: amountOil,
    memo: `${table.title} reload`,
  });
  const updatedSeat = deps.upsertPokerPlaySeat({
    ...seat,
    stackOil: Number(seat.stackOil || 0) + amountOil,
    updatedAt: requestAt,
  });
  upsertPokerPlayPlayerStatForSeat(deps, table, updatedSeat, {
    processAt: requestAt,
    reloadOilDelta: amountOil,
    status: 'open',
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: table.tableId,
      handId: currentHand?.handId || null,
      seatNumber: seat.seatNumber,
      actorRole: 'human',
      eventKind: 'seat_reloaded',
      payload: {
        amountOil,
        walletSubject: walletBinding.walletSubject,
      },
      createdAt: requestAt,
    });
  }
  const refreshedTable = deps.getPokerPlayTableById(table.tableId) || table;
  const refreshedSeats = deps.listPokerPlaySeatsByTable(table.tableId);
  const refreshedHand = deps.getCurrentPokerPlayHandForTable(table.tableId);
  return buildPokerPlayTablePayload(deps, refreshedTable, refreshedSeats, refreshedHand, { session, req, processAt: requestAt });
}

function applyCashBlindReturnPolicy(deps, table, seat, requestAt) {
  const policy = getCashBlindReturnPolicy(table);
  const blindAmountOil = Math.min(Math.max(0, Number(seat?.stackOil || 0)), Math.max(0, Number(table?.bigBlindOil || 0)));
  if (policy === 'wait_for_big_blind') {
    const obligation = typeof deps.upsertPokerBlindObligation === 'function'
      ? deps.upsertPokerBlindObligation({
        tableId: table.tableId,
        walletSubject: seat.walletSubject,
        seatNumber: seat.seatNumber,
        policy,
        status: 'waiting',
        blindAmountOil,
        updatedAt: requestAt,
      })
      : null;
    const updatedSeat = deps.upsertPokerPlaySeat({
      ...seat,
      status: 'waiting_big_blind',
      disconnectedAt: null,
      lastSeenAt: requestAt,
      updatedAt: requestAt,
    });
    return {
      seat: updatedSeat,
      obligation,
      postedBlindOil: 0,
    };
  }
  const updatedSeat = deps.upsertPokerPlaySeat({
    ...seat,
    status: 'active',
    stackOil: Math.max(0, Number(seat?.stackOil || 0) - blindAmountOil),
    disconnectedAt: null,
    lastSeenAt: requestAt,
    updatedAt: requestAt,
  });
  const obligation = typeof deps.upsertPokerBlindObligation === 'function'
    ? deps.upsertPokerBlindObligation({
      tableId: table.tableId,
      walletSubject: seat.walletSubject,
      seatNumber: seat.seatNumber,
      policy,
      status: 'posted',
      blindAmountOil,
      postedAt: requestAt,
      updatedAt: requestAt,
    })
    : null;
  return {
    seat: updatedSeat,
    obligation,
    postedBlindOil: blindAmountOil,
  };
}

function sitOutTableSeat(deps, { tableId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const table = deps.getPokerPlayTableById(tableId);
  if (!table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  if (normalizePokerPlayTableType(table?.tableType) !== 'cash') {
    throw createRouteError(409, 'POKER_PLAY_SIT_OUT_UNAVAILABLE', 'Sit-out is only available at cash tables.');
  }
  if (isTableAdminClosed(table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
  }
  const { walletBinding, seat } = requireSeatWriter(deps, { table, session, req });
  const currentHand = deps.getCurrentPokerPlayHandForTable(table.tableId);
  const markAway = body?.markAway === true;
  const inLiveHand = currentHand
    && currentHand.status === 'live'
    && currentHand?.state?.seatStates
    && currentHand.state.seatStates[String(normalizeSeatNumber(seat.seatNumber))];
  const nextStatus = inLiveHand
    ? (markAway ? 'away_next_hand' : 'sitout_next_hand')
    : (markAway ? 'away' : 'sitting_out');
  deps.upsertPokerPlaySeat({
    ...seat,
    status: nextStatus,
    disconnectedAt: markAway ? seat?.disconnectedAt || requestAt : null,
    updatedAt: requestAt,
  });
  if (currentHand?.handId) {
    deps.createPokerPlayMessage({
      tableId: table.tableId,
      handId: currentHand.handId,
      seatNumber: null,
      authorRole: 'system',
      body: inLiveHand
        ? `${formatSeatLabel(seat.seatNumber, seat.displayName)} will ${markAway ? 'go away' : 'sit out'} after this hand.`
        : `${formatSeatLabel(seat.seatNumber, seat.displayName)} is now ${markAway ? 'away' : 'sitting out'}.`,
      createdAt: requestAt,
    });
  }
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: table.tableId,
      handId: currentHand?.handId || null,
      seatNumber: seat.seatNumber,
      actorRole: 'human',
      eventKind: markAway ? 'seat_away' : 'seat_sitout',
      payload: {
        walletSubject: walletBinding.walletSubject,
        deferred: !!inLiveHand,
        status: nextStatus,
      },
      createdAt: requestAt,
    });
  }
  const refreshed = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  return buildPokerPlayTablePayload(deps, refreshed.table, refreshed.seats, refreshed.hand, { session, req, processAt: requestAt });
}

function returnTableSeat(deps, { tableId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const table = deps.getPokerPlayTableById(tableId);
  if (!table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  if (normalizePokerPlayTableType(table?.tableType) !== 'cash') {
    throw createRouteError(409, 'POKER_PLAY_RETURN_UNAVAILABLE', 'Return is only available at cash tables.');
  }
  if (isTableAdminClosed(table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
  }
  const { walletBinding, seat } = requireSeatWriter(deps, { table, session, req });
  const currentHand = deps.getCurrentPokerPlayHandForTable(table.tableId);
  const blindReturn = applyCashBlindReturnPolicy(deps, table, seat, requestAt);
  if (currentHand?.handId) {
    deps.createPokerPlayMessage({
      tableId: table.tableId,
      handId: currentHand.handId,
      seatNumber: null,
      authorRole: 'system',
      body: blindReturn.postedBlindOil > 0
        ? `${formatSeatLabel(seat.seatNumber, seat.displayName)} returns and posts ${blindReturn.postedBlindOil} OIL big blind to rejoin.`
        : `${formatSeatLabel(seat.seatNumber, seat.displayName)} returns to the table for the next hand.`,
      createdAt: requestAt,
    });
  }
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: table.tableId,
      handId: currentHand?.handId || null,
      seatNumber: seat.seatNumber,
      actorRole: 'human',
      eventKind: 'seat_returned',
      payload: {
        walletSubject: walletBinding.walletSubject,
      },
      createdAt: requestAt,
    });
    deps.createPokerPlayAuditEvent({
      tableId: table.tableId,
      handId: currentHand?.handId || null,
      seatNumber: seat.seatNumber,
      actorRole: 'system',
      eventKind: blindReturn.postedBlindOil > 0 ? 'blind_obligation_posted' : 'blind_obligation_waiting',
      payload: {
        walletSubject: walletBinding.walletSubject,
        policy: getCashBlindReturnPolicy(table),
        blindAmountOil: blindReturn.obligation?.blindAmountOil || Number(table?.bigBlindOil || 0),
        blindObligationId: blindReturn.obligation?.blindObligationId || null,
      },
      createdAt: requestAt,
    });
  }
  const refreshed = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  return buildPokerPlayTablePayload(deps, refreshed.table, refreshed.seats, refreshed.hand, { session, req, processAt: requestAt });
}

function joinTableWaitlist(deps, { tableId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const walletBinding = deps.resolvePrimaryWalletSubject(session, req);
  if (!walletBinding?.walletSubject) {
    throw createRouteError(409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before joining a poker waitlist.');
  }
  const houseId = getSessionHouseId(session);
  if (!houseId) {
    throw createRouteError(409, 'HOUSE_REQUIRED', 'Join a house before joining a poker waitlist.');
  }
  const table = deps.getPokerPlayTableById(tableId);
  if (!table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  requirePokerPlayTableAccess(table, {
    walletSubject: walletBinding.walletSubject,
    houseId,
    viewerSeat: deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject),
    inviteCode: parsePokerPlayInviteCode(req, body),
    publicViewer: false,
  });
  if (isTableAdminClosed(table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
  }
  if (isTablePaused(table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_PAUSED', 'This poker table is paused by an operator.');
  }
  const activeSeat = deps.getActivePokerPlaySeatByWalletSubject(walletBinding.walletSubject);
  if (activeSeat && isSeatInPlay(activeSeat)) {
    throw createRouteError(409, 'POKER_PLAY_SEAT_ALREADY_ACTIVE', 'This wallet is already seated at a different live table.', {
      tableId: activeSeat.tableId,
      seatNumber: activeSeat.seatNumber,
    });
  }
  if (deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject)) {
    throw createRouteError(409, 'POKER_PLAY_ALREADY_SEATED', 'This wallet already has a seat at the table.');
  }
  if (getTableWaitlistEntryByWalletSubject(deps, table, walletBinding.walletSubject)
    && normalizeTrimmedString(getTableWaitlistEntryByWalletSubject(deps, table, walletBinding.walletSubject)?.status, 'waiting') === 'waiting') {
    throw createRouteError(409, 'POKER_PLAY_WAITLIST_ALREADY_QUEUED', 'This wallet is already on the waitlist for the table.');
  }
  const seats = deps.listPokerPlaySeatsByTable(table.tableId);
  const openSeatCount = getOpenSeatCount(table, seats);
  const tableType = normalizePokerPlayTableType(table?.tableType);
  const currentHand = deps.getCurrentPokerPlayHandForTable(table.tableId);
  const tournamentLateRegistration = resolveTournamentLateRegistration(table, currentHand);
  if (tableType === 'cash' && openSeatCount > 0) {
    throw createRouteError(409, 'POKER_PLAY_WAITLIST_NOT_NEEDED', 'This table still has an open seat.');
  }
  if (tableType === 'tournament') {
    const scheduledPending = isScheduledTournamentPending(table, requestAt);
    const tournamentWaitlistAllowed = openSeatCount <= 0 && (
      scheduledPending
      || !currentHand
      || currentHand.status !== 'live'
      || tournamentLateRegistration.open
    );
    if (!tournamentWaitlistAllowed) {
      throw createRouteError(409, 'POKER_PLAY_WAITLIST_UNAVAILABLE', 'Tournament waitlist is only available for scheduled or late-registration events when the table is full.');
    }
  }
  const buyInOil = computeBuyInOil(table, body?.buyInOil);
  assertPokerPlayWalletPolicyAllowsSpend(deps, walletBinding.walletSubject, {
    amountOil: buyInOil,
    processAt: requestAt,
  });
  const oilBalance = deps.computeOilBalance(walletBinding.walletSubject);
  if (Number(oilBalance?.balance || 0) < buyInOil) {
    throw createRouteError(409, 'OIL_BALANCE_TOO_LOW', 'Not enough OIL balance to join this waitlist.', {
      requiredOil: buyInOil,
      balance: Number(oilBalance?.balance || 0),
    });
  }
  upsertTableWaitlistEntry(deps, table, {
    tableId: table.tableId,
    seriesId: tableType === 'tournament' ? getTournamentSeriesRef(table).seriesId || null : null,
    portalSessionId: session.sessionId,
    houseId,
    walletSubject: walletBinding.walletSubject,
    displayName: normalizePokerPlayDisplayName(body?.displayName, session?.agent?.name || houseId || walletBinding.walletSubject.slice(0, 8)),
    buyInOil,
    status: 'waiting',
    updatedAt: requestAt,
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: table.tableId,
      handId: null,
      seatNumber: null,
      actorRole: 'human',
      eventKind: tableType === 'tournament' ? 'tournament_waitlist_joined' : 'waitlist_joined',
      payload: {
        walletSubject: walletBinding.walletSubject,
        buyInOil,
      },
      createdAt: requestAt,
    });
  }
  const refreshed = syncPokerPlayTable(deps, tableId, { processAt: requestAt });
  return buildPokerPlayTablePayload(deps, refreshed.table, refreshed.seats, refreshed.hand, { session, req, processAt: requestAt });
}

function leaveTableWaitlist(deps, { tableId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const walletBinding = deps.resolvePrimaryWalletSubject(session, req);
  if (!walletBinding?.walletSubject) {
    throw createRouteError(409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before leaving a poker waitlist.');
  }
  const table = deps.getPokerPlayTableById(tableId);
  if (!table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  const waitlistEntry = getTableWaitlistEntryByWalletSubject(deps, table, walletBinding.walletSubject);
  if (!waitlistEntry || normalizeTrimmedString(waitlistEntry?.status, 'waiting') !== 'waiting') {
    throw createRouteError(404, 'NOT_FOUND', 'Poker waitlist entry not found.');
  }
  upsertTableWaitlistEntry(deps, table, {
    ...waitlistEntry,
    status: 'cancelled',
    updatedAt: requestAt,
  });
  if (typeof deps.createPokerPlayAuditEvent === 'function') {
    deps.createPokerPlayAuditEvent({
      tableId: table.tableId,
      handId: null,
      seatNumber: null,
      actorRole: 'human',
      eventKind: normalizePokerPlayTableType(table?.tableType) === 'tournament' ? 'tournament_waitlist_left' : 'waitlist_left',
      payload: {
        walletSubject: walletBinding.walletSubject,
      },
      createdAt: requestAt,
    });
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
  if (isTableAdminClosed(synced.table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
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
  if (isTableAdminClosed(synced.table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
  }
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

function useTimeBank(deps, { handId, session, req, body } = {}) {
  const requestAt = toProcessIso(deps, body?.asOf);
  const hand = deps.getPokerPlayHandById(handId);
  if (!hand) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker hand not found.');
  }
  const synced = syncPokerPlayTable(deps, hand.tableId, { processAt: body?.asOf });
  if (isTableAdminClosed(synced.table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
  }
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
  const remainingSeconds = getSeatTimeBankRemainingSeconds(synced.table, touchedSeat.seatNumber);
  if (remainingSeconds <= 0) {
    throw createRouteError(409, 'POKER_PLAY_TIME_BANK_EMPTY', 'No time bank remains for this seat.', {
      seatNumber: normalizeSeatNumber(touchedSeat.seatNumber),
    });
  }
  const requestedSeconds = Math.max(0, normalizeOilAmount(body?.consumeSeconds, remainingSeconds));
  const consumeSeconds = Math.max(1, Math.min(remainingSeconds, requestedSeconds || remainingSeconds));
  applyTimeBankExtension(deps, {
    table: synced.table,
    hand: currentHand,
    seatNumber: touchedSeat.seatNumber,
    consumeSeconds,
    requestAt,
    actorRole: 'human',
    actorLabel: touchedSeat.displayName || formatSeatLabel(touchedSeat.seatNumber),
  });
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
  if (isTableAdminClosed(synced.table)) {
    throw createRouteError(409, 'POKER_PLAY_TABLE_CLOSED', 'This poker table was closed by an operator.');
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
  buildPokerPlayAdminExportPayload,
  buildPokerPlayIntegrityQueuePayload,
  buildPokerPlayLedgerReconciliationPayload,
  buildPokerPlayAdminScheduleTemplatesPayload,
  buildPokerPlayAdminTreasuryPayload,
  buildPokerPlayNativeSeasonLeaderboardPayload,
  buildPokerPlayOpsDashboardPayload,
  buildPokerPlayAdminReviewPayload,
  buildPokerPlayAdminSeriesExportPayload,
  buildPokerPlayAdminSeriesReviewPayload,
  buildPokerPlayLobbyPayload,
  buildPokerPlaySchedulePayload,
  buildPokerPlayTablePayload,
  POKER_PLAY_ROOM_TREASURY_WALLET_SUBJECT,
  breakTournamentSeriesTableByDirector,
  changeCashTableSeat,
  closeTournamentRegistration,
  closeTable,
  closeTournamentSeries,
  cancelScheduleTemplate,
  createTable,
  createScheduleTemplate,
  createRouteError,
  addTournamentAddon,
  createChopProposal,
  getHandHistory,
  getHandReview,
  buildHandHistoryExport,
  buildHandHistoryExportNdjson,
  buildHandHistoryExportText,
  getMyQualifiers,
  getMyResults,
  getPokerPlayPolicy,
  getSeriesTimeline,
  getSeriesDetail,
  getTableDetail,
  joinTableWaitlist,
  listTables,
  listNotebook,
  leaveTable,
  leaveTableWaitlist,
  matchmakeIntoTable,
  normalizePokerPlayDisplayName,
  normalizePokerPlayMessageBody,
  openHandDispute,
  pauseTable,
  postAction,
  agreeToChopProposal,
  postMessage,
  postSeatAgentProposal,
  resolveIntegrityFlag,
  rebalanceTournamentSeriesByDirector,
  reloadTableSeat,
  rebuyTournamentSeries,
  reenterTournamentSeries,
  returnTableSeat,
  reviewChopProposal,
  resolveHandDispute,
  resumeTable,
  seatIntoTable,
  saveNotebookEntry,
  sitOutTableSeat,
  advanceTournamentBlindLevelByDirector,
  advanceTournamentBlindLevelsForSeriesByDirector,
  startScheduledBreakByDirector,
  endScheduledBreakByDirector,
  startScheduledBreaksForSeriesByDirector,
  endScheduledBreaksForSeriesByDirector,
  startTournamentTableByDirector,
  moveTournamentDirectorSeat,
  syncPokerPlayTable,
  transferCashTableSeat,
  updateAutoActPolicy,
  updatePokerPlayPolicy,
  useTimeBank,
};
