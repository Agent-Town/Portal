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

function normalizePokerPlayTableType(value, fallback = 'cash') {
  const type = normalizeTrimmedString(value, fallback).toLowerCase();
  return type === 'tournament' ? 'tournament' : 'cash';
}

function normalizeSeatCount(value, fallback = POKER_PLAY_MAX_SEATS) {
  const seats = normalizeOilAmount(value, fallback);
  return Math.max(2, Math.min(POKER_PLAY_MAX_SEATS, seats || fallback));
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
  const title = normalizeTrimmedString(
    input?.title,
    tableType === 'cash'
      ? `6-Max Cash ${smallBlindOil}/${bigBlindOil}`
      : `6-Max Tournament ${smallBlindOil}/${bigBlindOil}`
  ).slice(0, 96);
  return {
    tableType,
    smallBlindOil,
    bigBlindOil,
    buyInOil,
    maxSeats,
    minPlayers,
    decisionCountdownSeconds: countdownSeconds,
    title,
  };
}

function buildMatchKey(config) {
  return [
    normalizePokerPlayTableType(config?.tableType),
    `sb${Math.max(1, normalizeOilAmount(config?.smallBlindOil, 0))}`,
    `bb${Math.max(2, normalizeOilAmount(config?.bigBlindOil, 0))}`,
    `bi${Math.max(1, normalizeOilAmount(config?.buyInOil, 0))}`,
    `mx${normalizeSeatCount(config?.maxSeats, POKER_PLAY_MAX_SEATS)}`,
    `mn${Math.max(2, normalizeOilAmount(config?.minPlayers, 2))}`,
  ].join(':');
}

function getSessionHouseId(session) {
  return normalizeTrimmedString(session?.houseCeremony?.houseId);
}

function toProcessIso(deps, value) {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : deps.nowIso();
}

function isSeatInPlay(seat) {
  return !!seat && seat.status === 'active' && Number(seat.stackOil || 0) > 0;
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
  return {
    occupancy: activeSeats.length,
    openSeatCount: Math.max(0, Number(table?.maxSeats || POKER_PLAY_MAX_SEATS) - activeSeats.length),
    liveHand: !!hand && hand.status === 'live',
    handNumber: Number(hand?.handNumber || 0),
    actingSeat: normalizeSeatNumber(hand?.state?.actingSeat),
    viewerSeatNumber: normalizeSeatNumber(viewerSeat?.seatNumber),
    completedAt: table?.state?.completedAt || null,
    winnerSeatNumber: normalizeSeatNumber(table?.state?.winnerSeatNumber),
  };
}

function buildDynamicTableSummary(config, matchKey) {
  return {
    headline: config.tableType === 'cash'
      ? 'Open cash table with private human + agent seat threads.'
      : 'Single-table tournament with private human + agent seat threads.',
    matchKey,
    origin: 'dynamic',
  };
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
  return {
    seatNumber,
    displayName: seat?.displayName || `Seat ${seatNumber}`,
    status: seat?.status || 'empty',
    stackOil: Number(stateSeat?.stackOil ?? seat?.stackOil ?? 0),
    buyInOil: Number(seat?.buyInOil || 0),
    committedStreetOil: Number(stateSeat?.committedStreetOil || 0),
    committedHandOil: Number(stateSeat?.committedHandOil || 0),
    folded: stateSeat?.folded === true,
    allIn: stateSeat?.allIn === true,
    eliminated: stateSeat?.eliminated === true,
    isViewer: seatNumber === normalizeSeatNumber(viewerSeatNumber),
    isActing: seatNumber === normalizeSeatNumber(hand?.state?.actingSeat),
    holeCards: revealed ? rawCards : [],
    hiddenCardCount: revealed ? 0 : rawCards.length,
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

function buildPrivateAgentPrompt(table, handState, seatNumber) {
  const suggestion = derivePokerPlayAgentSuggestion({ table, handState, seatNumber });
  if (!suggestion) return null;
  return {
    suggestion,
    body: suggestion.body || 'The agent does not have a strong line yet.',
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
    if (String(table?.tableType || 'cash') === 'tournament') {
      if (stackOil <= 0) {
        status = 'busted';
      } else if (status !== 'paid') {
        status = 'active';
      }
    } else if (status !== 'left') {
      status = 'active';
    }
    updated.push(deps.upsertPokerPlaySeat({
      ...seat,
      status,
      stackOil,
      updatedAt: atIso,
    }));
  }
  return updated;
}

function startNewTableHand(deps, table, seats, previousHand, atIso) {
  const nextHandNumber = previousHand ? Number(previousHand.handNumber || 0) + 1 : 1;
  const nextState = createInitialPokerPlayHandState({
    table,
    seats,
    handNumber: nextHandNumber,
    nowIso: atIso,
    previousTableState: table?.state || {},
  });
  if (!nextState) return { table, hand: previousHand };

  const hand = deps.upsertPokerPlayHand({
    handId: `pkplayhand_${deps.randomHex(10)}`,
    tableId: table.tableId,
    handNumber: nextHandNumber,
    status: 'live',
    actionExpiresAt: nextState.actionExpiresAt || null,
    state: nextState,
    result: {},
  });
  const nextTableState = {
    ...(table.state && typeof table.state === 'object' ? table.state : {}),
    completedAt: null,
    winnerSeatNumber: 0,
    prizeOil: 0,
    prizeSettledAt: null,
    lastButtonSeat: normalizeSeatNumber(nextState.buttonSeat),
    activeHandId: hand.handId,
    activeHandNumber: hand.handNumber,
    lastStartedAt: atIso,
  };
  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
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
  const activeSeats = getActiveSeatRows(seats);
  if (activeSeats.length > 1) return { table, seats, completed: false };
  const winnerSeat = activeSeats[0] || null;
  if (!winnerSeat && table?.state?.completedAt) {
    return { table, seats, completed: true };
  }
  const nextState = {
    ...(table.state && typeof table.state === 'object' ? table.state : {}),
    completedAt: table?.state?.completedAt || atIso,
    winnerSeatNumber: normalizeSeatNumber(winnerSeat?.seatNumber || table?.state?.winnerSeatNumber),
    prizeOil: winnerSeat ? Number(winnerSeat.stackOil || 0) : Number(table?.state?.prizeOil || 0),
    prizeSettledAt: table?.state?.prizeSettledAt || null,
    activeHandId: hand?.handId || null,
    activeHandNumber: Number(hand?.handNumber || 0),
  };
  let nextSeats = Array.isArray(seats) ? seats.slice() : [];
  if (winnerSeat && !nextState.prizeSettledAt && Number(winnerSeat.stackOil || 0) > 0) {
    deps.createOilLedgerEntry({
      walletSubject: winnerSeat.walletSubject,
      houseId: winnerSeat.houseId || null,
      verificationId: winnerSeat.streamflowVerificationId || null,
      entryKind: 'poker_play_tournament_prize',
      direction: 'credit',
      amount: Number(winnerSeat.stackOil || 0),
      memo: `Tournament prize from ${table.title}`,
    });
    deps.createPokerPlayMessage({
      tableId: table.tableId,
      handId: hand.handId,
      seatNumber: null,
      authorRole: 'system',
      body: `${formatSeatLabel(winnerSeat.seatNumber, winnerSeat.displayName)} wins ${Number(winnerSeat.stackOil || 0)} OIL.`,
    });
    nextState.prizeSettledAt = atIso;
    nextSeats = nextSeats.map((seat) => {
      if (normalizeSeatNumber(seat.seatNumber) === normalizeSeatNumber(winnerSeat.seatNumber)) {
        return deps.upsertPokerPlaySeat({
          ...seat,
          status: 'paid',
          stackOil: 0,
          updatedAt: atIso,
        });
      }
      if (seat.status === 'active' && Number(seat.stackOil || 0) <= 0) {
        return deps.upsertPokerPlaySeat({
          ...seat,
          status: 'busted',
          updatedAt: atIso,
        });
      }
      return seat;
    });
  }
  const updatedTable = deps.upsertPokerPlayTable({
    ...table,
    state: nextState,
    updatedAt: atIso,
  });
  return {
    table: updatedTable,
    seats: nextSeats,
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
    },
  });
}

function syncPokerPlayTable(deps, tableId, { processAt } = {}) {
  let table = deps.getPokerPlayTableById(tableId);
  if (!table) return null;
  let seats = deps.listPokerPlaySeatsByTable(table.tableId);
  let hand = deps.getCurrentPokerPlayHandForTable(table.tableId);
  const atIso = toProcessIso(deps, processAt);
  let safety = 0;

  while (safety < 24) {
    safety += 1;
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

      const readySeats = getActiveSeatRows(seats);
      if (readySeats.length >= Math.max(2, Number(table.minPlayers || 2))) {
        const started = startNewTableHand(deps, table, seats, hand, atIso);
        table = started.table;
        hand = started.hand;
        continue;
      }
      break;
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

function buildPokerPlayTablePayload(deps, table, seats, hand, { session, req, processAt } = {}) {
  const walletBinding = session ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const viewerSeat = walletBinding?.walletSubject
    ? deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject)
    : null;
  const messages = hand ? deps.listPokerPlayMessagesByHand(hand.handId) : [];
  const actions = hand ? deps.listPokerPlayActionsByHand(hand.handId) : [];
  const oilBalance = walletBinding?.walletSubject ? deps.computeOilBalance(walletBinding.walletSubject) : null;
  const suggestion = viewerSeat && hand && hand.status === 'live'
    ? derivePokerPlayAgentSuggestion({ table, handState: hand.state, seatNumber: viewerSeat.seatNumber })
    : null;

  return {
    table: {
      ...table,
      summary: computeTableSummary(table, seats, hand, viewerSeat),
    },
    houseId: getSessionHouseId(session),
    wallet: walletBinding?.submitterWallet || null,
    oilBalance,
    mySeat: viewerSeat
      ? sanitizeSeatForViewer({ seat: viewerSeat, hand, viewerSeatNumber: viewerSeat.seatNumber })
      : null,
    seats: (Array.isArray(seats) ? seats : [])
      .map((seat) => sanitizeSeatForViewer({ seat, hand, viewerSeatNumber: viewerSeat?.seatNumber || 0 }))
      .sort((left, right) => left.seatNumber - right.seatNumber),
    hand: sanitizeHandForViewer({ table, hand, seats, viewerSeatNumber: viewerSeat?.seatNumber || 0 }),
    messages: sanitizeMessagesForViewer(messages, viewerSeat?.seatNumber || 0),
    actions: sanitizeActions(actions, seats),
    suggestion,
    processAt: toProcessIso(deps, processAt),
  };
}

function buildPokerPlayLobbyPayload(deps, { session, req, processAt } = {}) {
  const walletBinding = session ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const oilBalance = walletBinding?.walletSubject ? deps.computeOilBalance(walletBinding.walletSubject) : null;
  const items = deps.listPokerPlayTables().map((table) => {
    const synced = syncPokerPlayTable(deps, table.tableId, { processAt });
    const viewerSeat = walletBinding?.walletSubject
      ? deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject)
      : null;
    return {
      ...synced.table,
      summary: computeTableSummary(synced.table, synced.seats, synced.hand, viewerSeat),
      currentUser: {
        walletSubject: walletBinding?.walletSubject || null,
        oilBalance: oilBalance?.balance ?? 0,
        seated: !!viewerSeat,
        seatNumber: normalizeSeatNumber(viewerSeat?.seatNumber),
      },
    };
  });
  return {
    items,
    houseId: getSessionHouseId(session),
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
      cashOutEnabled: normalized.tableType === 'cash',
      payoutModel: normalized.tableType === 'cash' ? 'cash_stack' : 'winner_take_all',
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
  const tableMatchKey = normalizeTrimmedString(table?.rules?.matchKey || table?.summary?.matchKey || summary.matchKey);
  if (!tableMatchKey || tableMatchKey !== matchKey) return false;
  if (normalizePokerPlayTableType(table.tableType) !== normalizePokerPlayTableType(tableType)) return false;
  if (Number(summary.openSeatCount || 0) <= 0) return false;
  if (String(table.status || 'open') !== 'open') return false;
  if (tableType === 'tournament' && (summary.liveHand || Number(summary.occupancy || 0) >= Number(table.maxSeats || POKER_PLAY_MAX_SEATS))) {
    return false;
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
  return createDynamicTable(deps, normalized, { createdAt: toProcessIso(deps, processAt) });
}

function listTables(deps, { session, req, processAt } = {}) {
  return buildPokerPlayLobbyPayload(deps, { session, req, processAt });
}

function getTableDetail(deps, { tableId, session, req, processAt } = {}) {
  const synced = syncPokerPlayTable(deps, tableId, { processAt });
  if (!synced?.table) {
    throw createRouteError(404, 'NOT_FOUND', 'Poker table not found.');
  }
  return buildPokerPlayTablePayload(deps, synced.table, synced.seats, synced.hand, { session, req, processAt });
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
  if (existingSeat && existingSeat.tableId && existingSeat.tableId !== tableId && Number(existingSeat.stackOil || 0) > 0 && existingSeat.status === 'active') {
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
  const sameTableSeat = deps.getPokerPlaySeatByWalletSubject(table.tableId, walletBinding.walletSubject);
  if (sameTableSeat) {
    return buildPokerPlayTablePayload(deps, table, seats, currentHand, { session, req, processAt: requestAt });
  }
  if (normalizePokerPlayTableType(table.tableType) === 'tournament' && currentHand && currentHand.status === 'live') {
    throw createRouteError(409, 'POKER_PLAY_TOURNAMENT_ALREADY_STARTED', 'Tournament seats lock once the first live hand begins.', {
      tableId: table.tableId,
      handId: currentHand.handId,
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
    status: 'active',
    buyInOil,
    stackOil: buyInOil,
    streamflowVerificationId: deps.getStreamflowVerificationByWalletSubject(walletBinding.walletSubject)?.verificationId || null,
    updatedAt: requestAt,
  });

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
  const liveHand = synced.hand && synced.hand.status === 'live' ? synced.hand : null;

  if (String(synced.table.tableType || 'cash') === 'cash') {
    if (liveHand) {
      throw createRouteError(409, 'POKER_PLAY_HAND_IN_PROGRESS', 'Cashing out is only allowed between hands.');
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
  const messageBody = normalizePokerPlayMessageBody(body?.body);
  if (!messageBody) {
    throw createRouteError(400, 'INVALID_ARGUMENT', 'Message body is required.');
  }
  const created = deps.createPokerPlayMessage({
    tableId: synced.table.tableId,
    handId: currentHand.handId,
    seatNumber: seat.seatNumber,
    authorRole: 'human',
    body: messageBody,
  });
  let agentMessage = null;
  if (currentHand.status === 'live') {
    const prompt = buildPrivateAgentPrompt(synced.table, currentHand.state, seat.seatNumber);
    if (prompt) {
      agentMessage = deps.createPokerPlayMessage({
        tableId: synced.table.tableId,
        handId: currentHand.handId,
        seatNumber: seat.seatNumber,
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
  if (!currentHand || currentHand.status !== 'live') {
    throw createRouteError(409, 'POKER_PLAY_HAND_NOT_LIVE', 'This poker hand is no longer live.');
  }
  const { seat } = requireSeatWriter(deps, { table: synced.table, session, req });
  if (normalizeSeatNumber(currentHand.state?.actingSeat) !== normalizeSeatNumber(seat.seatNumber)) {
    throw createRouteError(409, 'POKER_PLAY_NOT_YOUR_TURN', 'It is not this seat’s turn to act.', {
      actingSeat: normalizeSeatNumber(currentHand.state?.actingSeat),
      seatNumber: normalizeSeatNumber(seat.seatNumber),
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
      seatNumber: seat.seatNumber,
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
    seatNumber: seat.seatNumber,
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
    body: `${formatSeatLabel(seat.seatNumber, seat.displayName)} ${buildActionNarrative(actionKind, outcome.normalizedAmountOil || outcome.debitOil || 0)}.`,
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

module.exports = {
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
  postAction,
  postMessage,
  seatIntoTable,
  syncPokerPlayTable,
};
