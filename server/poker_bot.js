const {
  applyPokerPlayActionToHandState,
  getSeatAllowedActions,
  getSeatCallAmount,
  normalizeOilAmount,
  normalizeSeatNumber,
} = require('./poker_play');

// ---------------------------------------------------------------------------
// Configuration (env-driven, runtime-toggleable)
// ---------------------------------------------------------------------------

const BOT_CONFIG = {
  enabled: String(process.env.POKER_BOTS_ENABLED || 'true').toLowerCase() !== 'false',
  fillDelayMs: Number(process.env.POKER_BOTS_FILL_DELAY_MS) || 5000,
  minHumansToFill: Number(process.env.POKER_BOTS_MIN_HUMANS) || 1,
  botsPerTable: Number(process.env.POKER_BOTS_PER_TABLE) || 2,
  actionDelayMs: Number(process.env.POKER_BOTS_ACTION_DELAY_MS) || 0,
  fillTournaments: String(process.env.POKER_BOTS_FILL_TOURNAMENTS || 'false').toLowerCase() === 'true',
};

function getBotConfig() {
  return { ...BOT_CONFIG };
}

function setBotConfig(patch) {
  if (patch && typeof patch === 'object') {
    if (typeof patch.enabled === 'boolean') BOT_CONFIG.enabled = patch.enabled;
    if (typeof patch.fillDelayMs === 'number' && patch.fillDelayMs >= 0) BOT_CONFIG.fillDelayMs = patch.fillDelayMs;
    if (typeof patch.minHumansToFill === 'number' && patch.minHumansToFill >= 0) BOT_CONFIG.minHumansToFill = patch.minHumansToFill;
    if (typeof patch.botsPerTable === 'number' && patch.botsPerTable >= 0) BOT_CONFIG.botsPerTable = patch.botsPerTable;
    if (typeof patch.fillTournaments === 'boolean') BOT_CONFIG.fillTournaments = patch.fillTournaments;
  }
  return { ...BOT_CONFIG };
}

const POKER_BOTS = [
  { walletSubject: 'bot_tight_tom', displayName: 'Tight Tom', personality: 'tight' },
  { walletSubject: 'bot_loose_lucy', displayName: 'Loose Lucy', personality: 'loose' },
  { walletSubject: 'bot_aggro_al', displayName: 'Aggro Al', personality: 'aggressive' },
  { walletSubject: 'bot_calling_carl', displayName: 'Calling Carl', personality: 'passive' },
];

function isBotWalletSubject(walletSubject) {
  return typeof walletSubject === 'string' && walletSubject.startsWith('bot_');
}

function getBotPersonality(walletSubject) {
  const bot = POKER_BOTS.find((entry) => entry.walletSubject === walletSubject);
  return bot ? bot.personality : 'passive';
}

// ---------------------------------------------------------------------------
// Hand‑strength helpers (lightweight, pre‑flop + post‑flop aware)
// ---------------------------------------------------------------------------

function parseCard(card) {
  const text = String(card || '').trim();
  if (text.length < 2) return null;
  return { rank: text.slice(0, -1), suit: text.slice(-1) };
}

function rankValue(rank) {
  const order = '23456789TJQKA';
  const index = order.indexOf(String(rank || ''));
  return index >= 0 ? index + 2 : 0;
}

function evaluateHoleCards(holeCards) {
  const cards = (Array.isArray(holeCards) ? holeCards : []).map(parseCard).filter(Boolean);
  if (cards.length < 2) return { isPair: false, isBroadway: false, isSuited: false, highRank: 0, strength: 0 };
  const broadways = new Set(['A', 'K', 'Q', 'J', 'T']);
  const r0 = cards[0].rank;
  const r1 = cards[1].rank;
  const isPair = r0 === r1;
  const isSuited = cards[0].suit === cards[1].suit;
  const isBroadway = broadways.has(r0) && broadways.has(r1);
  const highRank = Math.max(rankValue(r0), rankValue(r1));
  const lowRank = Math.min(rankValue(r0), rankValue(r1));

  let strength = 0;
  if (isPair) strength = 50 + highRank * 3;
  else if (isBroadway) strength = 40 + highRank;
  else if (isSuited && highRank >= 12) strength = 35;
  else if (highRank >= 14) strength = 30 + lowRank;
  else if (isSuited) strength = 15 + highRank;
  else strength = highRank;

  return { isPair, isBroadway, isSuited, highRank, lowRank, strength };
}

function evaluatePostFlop(holeCards, communityCards) {
  const hole = (Array.isArray(holeCards) ? holeCards : []).map(parseCard).filter(Boolean);
  const board = (Array.isArray(communityCards) ? communityCards : []).map(parseCard).filter(Boolean);
  if (hole.length < 2 || board.length === 0) return { madeHand: false, pairHit: false, twoPair: false, trips: false, strength: 0 };

  const allRanks = hole.concat(board).map((card) => card.rank);
  const rankCounts = {};
  for (const rank of allRanks) {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  }

  const holeRanks = hole.map((card) => card.rank);
  const boardRanks = board.map((card) => card.rank);

  const pairHit = holeRanks.some((rank) => boardRanks.includes(rank));
  const twoPair = Object.values(rankCounts).filter((count) => count >= 2).length >= 2;
  const trips = Object.values(rankCounts).some((count) => count >= 3);
  const madeHand = pairHit || twoPair || trips;

  let strength = 0;
  if (trips) strength = 80;
  else if (twoPair) strength = 60;
  else if (pairHit) strength = 40 + rankValue(holeRanks.find((rank) => boardRanks.includes(rank)) || '2');
  else strength = Math.max(rankValue(holeRanks[0]), rankValue(holeRanks[1]));

  return { madeHand, pairHit, twoPair, trips, strength };
}

// ---------------------------------------------------------------------------
// Bot decision engine
// ---------------------------------------------------------------------------

function pickBotAction({ handState, seatNumber, table, personality }) {
  const normalizedSeat = normalizeSeatNumber(seatNumber);
  const allowedActions = getSeatAllowedActions({ handState, seatNumber: normalizedSeat });
  if (!allowedActions.length) return null;

  const allowed = new Set(allowedActions);
  const seat = handState?.seatStates?.[String(normalizedSeat)];
  if (!seat) return null;

  const holeCards = Array.isArray(seat.holeCards) ? seat.holeCards : [];
  const communityCards = Array.isArray(handState?.communityCards) ? handState.communityCards : [];
  const toCall = getSeatCallAmount(handState, normalizedSeat);
  const stackOil = normalizeOilAmount(seat.stackOil, 0);
  const potOil = normalizeOilAmount(handState?.potOil, 0);
  const minRaiseToOil = normalizeOilAmount(handState?.minRaiseToOil, 0);
  const bigBlindOil = normalizeOilAmount(table?.bigBlindOil, 20);
  const committedStreetOil = normalizeOilAmount(seat.committedStreetOil, 0);

  const preFlop = evaluateHoleCards(holeCards);
  const postFlop = communityCards.length > 0 ? evaluatePostFlop(holeCards, communityCards) : null;

  const effectiveStrength = postFlop ? postFlop.strength : preFlop.strength;

  let actionKind = 'check';
  let amountOil = 0;

  // Random factor for slight variation (0..99)
  const rng = Math.floor(Math.random() * 100);

  if (personality === 'tight') {
    // Only plays pairs and strong broadway. Folds most hands. Raises with premium.
    if (preFlop.strength < 35 && !postFlop?.madeHand) {
      // Weak hand: fold if facing a bet, check otherwise
      if (allowed.has('fold')) {
        actionKind = 'fold';
      } else if (allowed.has('check')) {
        actionKind = 'check';
      }
    } else if (effectiveStrength >= 60 && (allowed.has('raise') || allowed.has('bet'))) {
      // Premium: raise
      actionKind = allowed.has('raise') ? 'raise' : 'bet';
      amountOil = Math.min(stackOil + committedStreetOil, Math.max(minRaiseToOil, toCall + bigBlindOil * 3));
    } else if (effectiveStrength >= 35 && allowed.has('call') && toCall > 0) {
      actionKind = 'call';
      amountOil = toCall;
    } else if (allowed.has('check')) {
      actionKind = 'check';
    } else if (allowed.has('fold')) {
      actionKind = 'fold';
    }
  } else if (personality === 'loose') {
    // Plays most hands. Calls too much. Rarely folds preflop.
    if (allowed.has('call') && toCall > 0) {
      // Call most of the time; fold only with junk vs big bets
      if (toCall > stackOil * 0.5 && effectiveStrength < 20 && rng < 40) {
        actionKind = 'fold';
      } else {
        actionKind = 'call';
        amountOil = toCall;
      }
    } else if (effectiveStrength >= 40 && (allowed.has('raise') || allowed.has('bet'))) {
      actionKind = allowed.has('raise') ? 'raise' : 'bet';
      amountOil = Math.min(stackOil + committedStreetOil, Math.max(minRaiseToOil, toCall + bigBlindOil * 2));
    } else if (allowed.has('check')) {
      actionKind = 'check';
    } else if (allowed.has('fold')) {
      actionKind = 'fold';
    }
  } else if (personality === 'aggressive') {
    // Raises frequently with any decent hand. Bets the flop. Puts pressure on.
    if (effectiveStrength >= 20 && (allowed.has('raise') || allowed.has('bet'))) {
      actionKind = allowed.has('raise') ? 'raise' : 'bet';
      const sizingMultiplier = effectiveStrength >= 50 ? 4 : 2.5;
      amountOil = Math.min(stackOil + committedStreetOil, Math.max(minRaiseToOil, toCall + Math.floor(bigBlindOil * sizingMultiplier)));
    } else if (rng < 30 && (allowed.has('raise') || allowed.has('bet'))) {
      // Bluff ~30% of the time
      actionKind = allowed.has('raise') ? 'raise' : 'bet';
      amountOil = Math.min(stackOil + committedStreetOil, Math.max(minRaiseToOil, toCall + bigBlindOil * 2));
    } else if (allowed.has('call') && toCall > 0) {
      actionKind = 'call';
      amountOil = toCall;
    } else if (allowed.has('check')) {
      actionKind = 'check';
    } else if (allowed.has('fold')) {
      actionKind = 'fold';
    }
  } else {
    // passive: Calls most bets. Rarely raises. Checks when possible.
    if (allowed.has('check')) {
      actionKind = 'check';
    } else if (allowed.has('call') && toCall > 0) {
      // Call unless bet is huge relative to stack
      if (toCall > stackOil * 0.75 && effectiveStrength < 30) {
        actionKind = 'fold';
      } else {
        actionKind = 'call';
        amountOil = toCall;
      }
    } else if (effectiveStrength >= 70 && (allowed.has('raise') || allowed.has('bet'))) {
      // Only raise with very strong hands
      actionKind = allowed.has('raise') ? 'raise' : 'bet';
      amountOil = Math.min(stackOil + committedStreetOil, Math.max(minRaiseToOil, toCall + bigBlindOil * 2));
    } else if (allowed.has('fold')) {
      actionKind = 'fold';
    }
  }

  // Normalize raise/bet amounts
  if (actionKind === 'raise' || actionKind === 'bet') {
    if (amountOil <= 0) amountOil = minRaiseToOil;
    if (amountOil > stackOil + committedStreetOil) amountOil = stackOil + committedStreetOil;
  }

  // Validate the action by trying to apply it (same pattern as seat_agent_auto)
  try {
    applyPokerPlayActionToHandState({
      table,
      handState: handState,
      seatNumber: normalizedSeat,
      actionKind,
      amountOil: actionKind === 'call' ? 0 : amountOil,
      nowIso: new Date().toISOString(),
    });
  } catch {
    // Invalid action — fall back to check or fold
    if (allowed.has('check')) {
      return { actionKind: 'check', amountOil: 0 };
    }
    if (allowed.has('fold')) {
      return { actionKind: 'fold', amountOil: 0 };
    }
    return null;
  }

  return { actionKind, amountOil: actionKind === 'call' ? 0 : amountOil };
}

// ---------------------------------------------------------------------------
// Bot seat management
// ---------------------------------------------------------------------------

function getBotFillCount(table, seats) {
  if (!BOT_CONFIG.enabled) return 0;
  const activeSeatList = (Array.isArray(seats) ? seats : []).filter((seat) => {
    const status = String(seat?.status || '').toLowerCase();
    return status !== 'busted' && status !== 'advanced' && status !== 'paid' && status !== 'void_refund';
  });
  const humanCount = activeSeatList.filter((seat) => !isBotWalletSubject(seat?.walletSubject)).length;
  const botCount = activeSeatList.filter((seat) => isBotWalletSubject(seat?.walletSubject)).length;
  const maxSeats = Number(table?.maxSeats || 6);
  const available = maxSeats - activeSeatList.length;

  if (humanCount < BOT_CONFIG.minHumansToFill) return 0;
  if (humanCount >= 2) return 0;
  const targetBots = Math.min(BOT_CONFIG.botsPerTable, available);
  return Math.max(0, targetBots - botCount);
}

function findNextOpenSeatNumber(table, seats) {
  const maxSeats = Number(table?.maxSeats || 6);
  const occupied = new Set(
    (Array.isArray(seats) ? seats : [])
      .filter((seat) => {
        const status = String(seat?.status || '').toLowerCase();
        return status !== 'busted' && status !== 'advanced' && status !== 'paid' && status !== 'void_refund';
      })
      .map((seat) => normalizeSeatNumber(seat?.seatNumber))
      .filter(Boolean)
  );
  return Array.from({ length: maxSeats }, (_value, index) => index + 1)
    .find((seatNumber) => !occupied.has(seatNumber)) || 0;
}

function seatBotsAtTable(deps, tableId, count, seats, table) {
  if (!tableId || count <= 0) return [];
  const nowIso = typeof deps.nowIso === 'function' ? deps.nowIso() : new Date().toISOString();
  const buyInOil = normalizeOilAmount(table?.buyInOil, 1000);

  // Determine which bots are already seated
  const seatedBotWallets = new Set(
    (Array.isArray(seats) ? seats : [])
      .filter((seat) => isBotWalletSubject(seat?.walletSubject))
      .map((seat) => seat.walletSubject)
  );

  const availableBots = POKER_BOTS.filter((bot) => !seatedBotWallets.has(bot.walletSubject));
  const seatedBots = [];
  let currentSeats = Array.isArray(seats) ? seats.slice() : [];

  for (let index = 0; index < count && index < availableBots.length; index += 1) {
    const bot = availableBots[index];
    const openSeatNumber = findNextOpenSeatNumber(table, currentSeats);
    if (!openSeatNumber) break;

    // Create OIL ledger entry for buy-in (from treasury)
    if (typeof deps.createOilLedgerEntry === 'function') {
      deps.createOilLedgerEntry({
        walletSubject: bot.walletSubject,
        houseId: 'bot_house',
        verificationId: null,
        tableId,
        seriesId: null,
        entryKind: 'poker_play_buy_in',
        direction: 'debit',
        amount: buyInOil,
        memo: `Bot ${bot.displayName} buy-in`,
      });
    }

    // Seat the bot directly
    const seat = deps.upsertPokerPlaySeat({
      tableId,
      seatNumber: openSeatNumber,
      portalSessionId: 'bot_session',
      houseId: 'bot_house',
      walletSubject: bot.walletSubject,
      displayName: bot.displayName,
      status: 'active',
      buyInOil,
      stackOil: buyInOil,
      streamflowVerificationId: null,
      lastSeenAt: nowIso,
      disconnectedAt: null,
      updatedAt: nowIso,
    });

    currentSeats.push(seat);
    seatedBots.push(seat);
  }

  return seatedBots;
}

// ---------------------------------------------------------------------------
// Bot seat manager loop
// ---------------------------------------------------------------------------

function runBotSeatManager(deps) {
  let timerId = null;

  function tick() {
    if (!BOT_CONFIG.enabled) return;
    try {
      const tables = typeof deps.listPokerPlayTables === 'function' ? deps.listPokerPlayTables() : [];
      for (const table of Array.isArray(tables) ? tables : []) {
        if (!table?.tableId) continue;
        const tableStatus = String(table.status || '').toLowerCase();
        if (tableStatus !== 'open' && tableStatus !== 'active') continue;
        const isTournament = String(table.tableType || '').toLowerCase() === 'tournament';
        if (isTournament && !BOT_CONFIG.fillTournaments) continue;

        const seats = typeof deps.listPokerPlaySeatsByTable === 'function'
          ? deps.listPokerPlaySeatsByTable(table.tableId)
          : [];
        const needed = getBotFillCount(table, seats);
        if (needed > 0) {
          const seated = seatBotsAtTable(deps, table.tableId, needed, seats, table);
          if (seated.length) {
            console.log(`[poker_bot] Seated ${seated.length} bot(s) at ${table.title || table.tableId}`);
          }
        }
      }
    } catch (err) {
      console.error('[poker_bot] seat manager error:', err?.message || err);
    }
  }

  timerId = setInterval(tick, BOT_CONFIG.fillDelayMs);
  tick();
  console.log(`[poker_bot] Seat manager started (enabled=${BOT_CONFIG.enabled}, interval=${BOT_CONFIG.fillDelayMs}ms, botsPerTable=${BOT_CONFIG.botsPerTable})`);
  return timerId;
}

// ---------------------------------------------------------------------------
// Admin API helper
// ---------------------------------------------------------------------------

function fillTableWithBots(deps, tableId, { count } = {}) {
  if (!tableId) return [];
  const table = typeof deps.getPokerPlayTableById === 'function'
    ? deps.getPokerPlayTableById(tableId)
    : null;
  if (!table) return [];
  const seats = typeof deps.listPokerPlaySeatsByTable === 'function'
    ? deps.listPokerPlaySeatsByTable(tableId)
    : [];
  const activeSeatList = seats.filter((seat) => {
    const status = String(seat?.status || '').toLowerCase();
    return status !== 'busted' && status !== 'advanced' && status !== 'paid' && status !== 'void_refund';
  });
  const maxSeats = Number(table.maxSeats || 6);
  const available = maxSeats - activeSeatList.length;
  const toSeat = Math.min(
    typeof count === 'number' && count > 0 ? count : available,
    available,
    POKER_BOTS.length
  );
  if (toSeat <= 0) return [];
  return seatBotsAtTable(deps, tableId, toSeat, seats, table);
}

let _botRouteDeps = null;

function registerBotRoutes(app, deps) {
  _botRouteDeps = deps || null;

  app.get('/api/poker/bots/config', (_req, res) => {
    res.json({ ok: true, data: getBotConfig() });
  });

  app.post('/api/poker/bots/config', (req, res) => {
    const updated = setBotConfig(req.body || {});
    console.log('[poker_bot] Config updated:', JSON.stringify(updated));
    res.json({ ok: true, data: updated });
  });

  app.get('/api/poker/bots', (_req, res) => {
    res.json({ ok: true, data: { bots: POKER_BOTS, config: getBotConfig() } });
  });

  app.post('/api/poker/bots/fill/:tableId', (req, res) => {
    const d = _botRouteDeps;
    if (!d) return res.status(500).json({ ok: false, error: { code: 'NOT_READY', message: 'Bot system not initialized.' } });
    const tableId = String(req.params.tableId || '').trim();
    if (!tableId) return res.status(400).json({ ok: false, error: { code: 'MISSING_TABLE_ID', message: 'Table ID is required.' } });
    const count = typeof req.body?.count === 'number' ? req.body.count : undefined;
    const seated = fillTableWithBots(d, tableId, { count });
    console.log(`[poker_bot] Manual fill: ${seated.length} bot(s) at ${tableId}`);
    res.json({ ok: true, data: { seated: seated.length, bots: seated.map((s) => ({ seatNumber: s.seatNumber, displayName: s.displayName, walletSubject: s.walletSubject })) } });
  });
}

module.exports = {
  POKER_BOTS,
  isBotWalletSubject,
  getBotPersonality,
  getBotConfig,
  setBotConfig,
  pickBotAction,
  seatBotsAtTable,
  getBotFillCount,
  runBotSeatManager,
  registerBotRoutes,
};
