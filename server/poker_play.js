const crypto = require('crypto');

const POKER_PLAY_MAX_SEATS = 6;
const DEFAULT_PLAY_ACTION_COUNTDOWN_SECONDS = 45;

const RANK_ORDER = '23456789TJQKA';
const SUIT_ORDER = 'shdc';
const STREET_ORDER = ['preflop', 'flop', 'turn', 'river', 'showdown'];

function normalizeOilAmount(value, fallback = 0) {
  const amount = Number.parseInt(String(value == null ? '' : value), 10);
  if (!Number.isFinite(amount) || amount < 0) return fallback;
  return amount;
}

function normalizeSeatNumber(value, fallback = 0) {
  const seat = Number.parseInt(String(value == null ? '' : value), 10);
  if (!Number.isFinite(seat) || seat < 1 || seat > POKER_PLAY_MAX_SEATS) return fallback;
  return seat;
}

function cloneJson(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value == null ? fallback : value));
  } catch {
    return fallback;
  }
}

function buildPokerDeck() {
  const deck = [];
  for (const rank of RANK_ORDER) {
    for (const suit of SUIT_ORDER) {
      deck.push(`${rank}${suit}`);
    }
  }
  return deck;
}

function createSeededRng(seed) {
  const source = String(seed || 'agent-town-poker');
  let block = Buffer.alloc(0);
  let index = 0;
  let counter = 0;
  return {
    nextByte() {
      if (index >= block.length) {
        block = crypto.createHash('sha256').update(`${source}:${counter}`).digest();
        counter += 1;
        index = 0;
      }
      const value = block[index];
      index += 1;
      return value;
    },
    nextInt(max) {
      const safeMax = Math.max(1, Number(max || 1));
      return this.nextByte() % safeMax;
    },
  };
}

function shuffleDeck(seed) {
  const deck = buildPokerDeck();
  const rng = createSeededRng(seed);
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = rng.nextInt(index + 1);
    const next = deck[index];
    deck[index] = deck[swapIndex];
    deck[swapIndex] = next;
  }
  return deck;
}

function nextOccupiedSeat(seatNumbers, currentSeat, { wrap = true } = {}) {
  const ordered = Array.from(new Set((Array.isArray(seatNumbers) ? seatNumbers : []).map((seat) => normalizeSeatNumber(seat)).filter(Boolean))).sort((a, b) => a - b);
  if (!ordered.length) return 0;
  if (!currentSeat) return ordered[0];
  for (const seat of ordered) {
    if (seat > currentSeat) return seat;
  }
  return wrap ? ordered[0] : 0;
}

function buildSeatOrder(seatNumbers, startSeat) {
  const ordered = Array.from(new Set((Array.isArray(seatNumbers) ? seatNumbers : []).map((seat) => normalizeSeatNumber(seat)).filter(Boolean))).sort((a, b) => a - b);
  if (!ordered.length) return [];
  const start = normalizeSeatNumber(startSeat, ordered[0]) || ordered[0];
  const pivot = ordered.indexOf(start);
  if (pivot === -1) return ordered;
  return ordered.slice(pivot).concat(ordered.slice(0, pivot));
}

function isSeatActive(seatState) {
  return !!seatState && !seatState.folded && !seatState.eliminated;
}

function isSeatAbleToAct(seatState) {
  return isSeatActive(seatState) && !seatState.allIn;
}

function sumSeatPot(state) {
  const seatStates = state?.seatStates && typeof state.seatStates === 'object' ? state.seatStates : {};
  let total = 0;
  for (const seatState of Object.values(seatStates)) {
    total += Number(seatState?.committedHandOil || 0);
  }
  return total;
}

function rankValue(rankChar) {
  return RANK_ORDER.indexOf(String(rankChar || '').toUpperCase()) + 2;
}

function parseCard(card) {
  const value = String(card || '').trim();
  if (!value || value.length < 2) return null;
  const rankChar = value[0].toUpperCase();
  const suitChar = value.slice(-1).toLowerCase();
  const rank = rankValue(rankChar);
  if (!rank || !SUIT_ORDER.includes(suitChar)) return null;
  return { card: `${rankChar}${suitChar}`, rank, suit: suitChar };
}

function evaluateStraight(ranksDesc) {
  const unique = Array.from(new Set((Array.isArray(ranksDesc) ? ranksDesc : []).map((rank) => Number(rank || 0)).filter(Boolean))).sort((a, b) => b - a);
  if (unique.includes(14)) unique.push(1);
  for (let index = 0; index <= unique.length - 5; index += 1) {
    const window = unique.slice(index, index + 5);
    const top = window[0];
    const isStraight = window.every((rank, offset) => rank === top - offset);
    if (isStraight) return top === 1 ? 5 : top;
  }
  return 0;
}

function compareScoreArrays(left, right) {
  const a = Array.isArray(left) ? left : [];
  const b = Array.isArray(right) ? right : [];
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const delta = Number(a[index] || 0) - Number(b[index] || 0);
    if (delta > 0) return 1;
    if (delta < 0) return -1;
  }
  return 0;
}

function describeHandRank(category, tie) {
  const primary = Number(Array.isArray(tie) ? tie[0] || 0 : 0);
  const labelByRank = {
    14: 'Aces',
    13: 'Kings',
    12: 'Queens',
    11: 'Jacks',
    10: 'Tens',
    9: 'Nines',
    8: 'Eights',
    7: 'Sevens',
    6: 'Sixes',
    5: 'Fives',
    4: 'Fours',
    3: 'Threes',
    2: 'Twos',
  };
  if (category === 8) return 'Straight flush';
  if (category === 7) return `Four of a kind, ${labelByRank[primary] || 'high'}`;
  if (category === 6) return 'Full house';
  if (category === 5) return 'Flush';
  if (category === 4) return 'Straight';
  if (category === 3) return `Three of a kind, ${labelByRank[primary] || 'high'}`;
  if (category === 2) return 'Two pair';
  if (category === 1) return `Pair of ${labelByRank[primary] || 'high cards'}`;
  return 'High card';
}

function scoreFiveCardHand(cards) {
  const parsed = cards.map(parseCard).filter(Boolean);
  if (parsed.length !== 5) {
    return {
      score: [-1],
      category: -1,
      tie: [],
      label: 'Invalid hand',
    };
  }
  const ranksDesc = parsed.map((card) => card.rank).sort((a, b) => b - a);
  const suit = parsed[0].suit;
  const isFlush = parsed.every((card) => card.suit === suit);
  const straightHigh = evaluateStraight(ranksDesc);

  const counts = new Map();
  for (const card of parsed) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  }
  const groups = Array.from(counts.entries())
    .map(([rank, count]) => ({ rank, count }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return right.rank - left.rank;
    });

  let category = 0;
  let tie = ranksDesc.slice();

  if (isFlush && straightHigh) {
    category = 8;
    tie = [straightHigh];
  } else if (groups[0]?.count === 4) {
    category = 7;
    tie = [groups[0].rank, groups[1].rank];
  } else if (groups[0]?.count === 3 && groups[1]?.count === 2) {
    category = 6;
    tie = [groups[0].rank, groups[1].rank];
  } else if (isFlush) {
    category = 5;
    tie = ranksDesc.slice();
  } else if (straightHigh) {
    category = 4;
    tie = [straightHigh];
  } else if (groups[0]?.count === 3) {
    category = 3;
    const kickers = groups.slice(1).map((group) => group.rank).sort((a, b) => b - a);
    tie = [groups[0].rank, ...kickers];
  } else if (groups[0]?.count === 2 && groups[1]?.count === 2) {
    category = 2;
    const highPair = Math.max(groups[0].rank, groups[1].rank);
    const lowPair = Math.min(groups[0].rank, groups[1].rank);
    const kicker = groups[2]?.rank || 0;
    tie = [highPair, lowPair, kicker];
  } else if (groups[0]?.count === 2) {
    category = 1;
    const kickers = groups.slice(1).map((group) => group.rank).sort((a, b) => b - a);
    tie = [groups[0].rank, ...kickers];
  }

  return {
    score: [category, ...tie],
    category,
    tie,
    label: describeHandRank(category, tie),
  };
}

function choose(array, size, start = 0, prefix = [], out = []) {
  if (prefix.length === size) {
    out.push(prefix.slice());
    return out;
  }
  for (let index = start; index <= array.length - (size - prefix.length); index += 1) {
    prefix.push(array[index]);
    choose(array, size, index + 1, prefix, out);
    prefix.pop();
  }
  return out;
}

function evaluateSevenCardHand(cards) {
  const combos = choose(cards, 5);
  let best = null;
  for (const combo of combos) {
    const scored = scoreFiveCardHand(combo);
    if (!best || compareScoreArrays(scored.score, best.score) > 0) {
      best = { ...scored, cards: combo.slice() };
    }
  }
  return best || scoreFiveCardHand(cards.slice(0, 5));
}

function normalizeSeatState(input, seatNumber) {
  const seat = normalizeSeatNumber(seatNumber || input?.seatNumber);
  const stackOil = normalizeOilAmount(input?.stackOil, 0);
  const committedStreetOil = normalizeOilAmount(input?.committedStreetOil, 0);
  const committedHandOil = normalizeOilAmount(input?.committedHandOil, committedStreetOil);
  return {
    seatNumber: seat,
    stackOil,
    holeCards: Array.isArray(input?.holeCards) ? input.holeCards.slice(0, 2).map((card) => String(card || '').trim()).filter(Boolean) : [],
    committedStreetOil,
    committedHandOil,
    folded: input?.folded === true,
    allIn: input?.allIn === true || stackOil <= 0,
    eliminated: input?.eliminated === true || (stackOil <= 0 && committedHandOil <= 0),
    actedStreet: input?.actedStreet === true,
  };
}

function createSeatStateMap(seats) {
  const out = {};
  for (const seat of Array.isArray(seats) ? seats : []) {
    const seatNumber = normalizeSeatNumber(seat?.seatNumber);
    if (!seatNumber) continue;
    out[String(seatNumber)] = normalizeSeatState({
      stackOil: normalizeOilAmount(seat?.stackOil, normalizeOilAmount(seat?.buyInOil, 0)),
      committedStreetOil: 0,
      committedHandOil: 0,
      folded: false,
      allIn: false,
      eliminated: normalizeOilAmount(seat?.stackOil, normalizeOilAmount(seat?.buyInOil, 0)) <= 0,
      actedStreet: false,
    }, seatNumber);
  }
  return out;
}

function buildSeedFromTable(table, seats, handNumber) {
  const tableId = String(table?.tableId || table?.slug || 'table');
  const playerSeed = (Array.isArray(seats) ? seats : [])
    .slice()
    .sort((left, right) => Number(left?.seatNumber || 0) - Number(right?.seatNumber || 0))
    .map((seat) => `${seat.seatNumber}:${seat.walletSubject}:${seat.houseId || ''}`)
    .join('|');
  return crypto.createHash('sha256').update(`${tableId}:${handNumber}:${playerSeed}`).digest('hex');
}

function takeBlind(seatState, blindOil) {
  const amount = Math.min(seatState.stackOil, normalizeOilAmount(blindOil, 0));
  seatState.stackOil -= amount;
  seatState.committedStreetOil += amount;
  seatState.committedHandOil += amount;
  seatState.allIn = seatState.stackOil <= 0;
  return amount;
}

function dealHoleCards(deck, deckPosition, seatOrder) {
  const nextPosition = { value: deckPosition };
  const dealt = {};
  for (let round = 0; round < 2; round += 1) {
    for (const seatNumber of seatOrder) {
      const key = String(seatNumber);
      dealt[key] = dealt[key] || [];
      dealt[key].push(deck[nextPosition.value]);
      nextPosition.value += 1;
    }
  }
  return {
    dealt,
    deckPosition: nextPosition.value,
  };
}

function activeSeatNumbersFromState(state) {
  return Object.values(state?.seatStates || {})
    .filter(isSeatActive)
    .map((seatState) => seatState.seatNumber)
    .sort((a, b) => a - b);
}

function nonFoldedSeatNumbersFromState(state) {
  return Object.values(state?.seatStates || {})
    .filter((seatState) => isSeatActive(seatState) && !seatState.folded)
    .map((seatState) => seatState.seatNumber)
    .sort((a, b) => a - b);
}

function actingSeatNumbersFromState(state) {
  return Object.values(state?.seatStates || {})
    .filter((seatState) => isSeatAbleToAct(seatState) && !seatState.folded)
    .map((seatState) => seatState.seatNumber)
    .sort((a, b) => a - b);
}

function createActionDeadline(nowIso, countdownSeconds) {
  const baseMs = Date.parse(String(nowIso || ''));
  const startMs = Number.isFinite(baseMs) ? baseMs : Date.now();
  return new Date(startMs + (Math.max(5, normalizeOilAmount(countdownSeconds, DEFAULT_PLAY_ACTION_COUNTDOWN_SECONDS)) * 1000)).toISOString();
}

function normalizeSeatList(seatNumbers) {
  return Array.from(new Set((Array.isArray(seatNumbers) ? seatNumbers : []).map((seat) => normalizeSeatNumber(seat)).filter(Boolean))).sort((a, b) => a - b);
}

function clockwiseSeatOrderFromButton(seatNumbers, buttonSeat) {
  const ordered = normalizeSeatList(seatNumbers);
  if (!ordered.length) return [];
  const startSeat = nextOccupiedSeat(ordered, normalizeSeatNumber(buttonSeat), { wrap: true }) || ordered[0];
  return buildSeatOrder(ordered, startSeat);
}

function buildMatchedPotSlices(state) {
  const seatStates = Object.values(state?.seatStates || {})
    .map((seatState) => normalizeSeatState(seatState, seatState?.seatNumber))
    .filter((seatState) => seatState.seatNumber && normalizeOilAmount(seatState.committedHandOil, 0) > 0)
    .sort((left, right) => {
      const delta = normalizeOilAmount(left?.committedHandOil, 0) - normalizeOilAmount(right?.committedHandOil, 0);
      if (delta !== 0) return delta;
      return normalizeSeatNumber(left?.seatNumber) - normalizeSeatNumber(right?.seatNumber);
    });
  if (!seatStates.length) {
    return {
      potSlices: [],
      returnedUncalledBySeat: {},
    };
  }

  const levels = Array.from(new Set(seatStates.map((seatState) => normalizeOilAmount(seatState.committedHandOil, 0)).filter((amount) => amount > 0))).sort((a, b) => a - b);
  let previousLevel = 0;
  const potSlices = [];
  const returnedUncalledBySeat = {};

  for (const level of levels) {
    const contributors = seatStates.filter((seatState) => normalizeOilAmount(seatState.committedHandOil, 0) >= level);
    const perSeatContributionOil = Math.max(0, level - previousLevel);
    const totalOil = perSeatContributionOil * contributors.length;
    previousLevel = level;
    if (!totalOil || !contributors.length) continue;
    if (contributors.length === 1) {
      const seatNumber = normalizeSeatNumber(contributors[0]?.seatNumber);
      if (seatNumber) {
        returnedUncalledBySeat[String(seatNumber)] = normalizeOilAmount(returnedUncalledBySeat[String(seatNumber)], 0) + totalOil;
      }
      continue;
    }
    const contributorSeatNumbers = contributors.map((seatState) => normalizeSeatNumber(seatState.seatNumber)).filter(Boolean).sort((a, b) => a - b);
    const eligibleSeatNumbers = contributors
      .filter((seatState) => seatState.folded !== true)
      .map((seatState) => normalizeSeatNumber(seatState.seatNumber))
      .filter(Boolean)
      .sort((a, b) => a - b);
    potSlices.push({
      potIndex: potSlices.length + 1,
      potKind: potSlices.length === 0 ? 'main' : 'side',
      capOil: level,
      perSeatContributionOil,
      totalOil,
      contributorSeatNumbers,
      eligibleSeatNumbers,
      winningSeatNumbers: [],
      oddChipSeatNumbers: [],
      payoutBySeat: {},
    });
  }

  return {
    potSlices,
    returnedUncalledBySeat,
  };
}

function applyReturnedUncalledChips(state, returnedUncalledBySeat) {
  const returns = returnedUncalledBySeat && typeof returnedUncalledBySeat === 'object' ? returnedUncalledBySeat : {};
  for (const [seatNumberRaw, amountRaw] of Object.entries(returns)) {
    const seatNumber = normalizeSeatNumber(seatNumberRaw);
    const amount = normalizeOilAmount(amountRaw, 0);
    if (!seatNumber || amount <= 0) continue;
    const seatState = state?.seatStates?.[String(seatNumber)];
    if (!seatState) continue;
    seatState.stackOil += amount;
    seatState.committedHandOil = Math.max(0, normalizeOilAmount(seatState.committedHandOil, 0) - amount);
    seatState.committedStreetOil = Math.max(0, normalizeOilAmount(seatState.committedStreetOil, 0) - amount);
    seatState.allIn = seatState.stackOil <= 0;
  }
}

function distributeMatchedPot(totalOil, winners, buttonSeat) {
  const winningSeatNumbers = normalizeSeatList(winners);
  if (!winningSeatNumbers.length) {
    return {
      payoutBySeat: {},
      oddChipSeatNumbers: [],
    };
  }
  const payoutBySeat = {};
  const baseAmount = Math.floor(Math.max(0, normalizeOilAmount(totalOil, 0)) / winningSeatNumbers.length);
  let remainder = Math.max(0, normalizeOilAmount(totalOil, 0) - (baseAmount * winningSeatNumbers.length));
  for (const seatNumber of winningSeatNumbers) {
    payoutBySeat[String(seatNumber)] = baseAmount;
  }
  const oddChipSeatNumbers = [];
  const clockwiseWinners = clockwiseSeatOrderFromButton(winningSeatNumbers, buttonSeat);
  for (const seatNumber of clockwiseWinners) {
    if (remainder <= 0) break;
    payoutBySeat[String(seatNumber)] = normalizeOilAmount(payoutBySeat[String(seatNumber)], 0) + 1;
    oddChipSeatNumbers.push(seatNumber);
    remainder -= 1;
  }
  return {
    payoutBySeat,
    oddChipSeatNumbers,
  };
}

function summarizePotSliceWinners(potSlices) {
  const uniqueWinners = normalizeSeatList((Array.isArray(potSlices) ? potSlices : []).flatMap((slice) => slice?.winningSeatNumbers || []));
  if (!uniqueWinners.length) return 'Hand ended without an eligible winner.';
  if (uniqueWinners.length === 1 && Number(Array.isArray(potSlices) ? potSlices.length : 0) <= 1) {
    return `Seat ${uniqueWinners[0]} wins the pot.`;
  }
  if (uniqueWinners.length === 1) {
    return `Seat ${uniqueWinners[0]} wins ${Number(potSlices.length || 0)} matched pots.`;
  }
  return `${Number(potSlices.length || 0)} matched pots were awarded across seats ${uniqueWinners.join(', ')}.`;
}

function buildPendingOrder(state, startSeat, seatNumbers) {
  const canAct = (Array.isArray(seatNumbers) ? seatNumbers : actingSeatNumbersFromState(state))
    .filter((seatNumber) => {
      const seatState = state?.seatStates?.[String(seatNumber)];
      return isSeatAbleToAct(seatState) && !seatState.folded;
    });
  if (!canAct.length) return [];
  return buildSeatOrder(canAct, startSeat).filter(Boolean);
}

function updateStreetStateForNextRound(state, {
  street,
  cardsToReveal,
  startSeat,
  countdownSeconds,
  nowIso,
}) {
  const next = cloneJson(state, {});
  next.street = street;
  next.phase = street;
  next.currentBetOil = 0;
  next.lastRaiseSizeOil = normalizeOilAmount(next.bigBlindOil, 0);
  next.minRaiseToOil = Math.max(normalizeOilAmount(next.bigBlindOil, 0), 1);
  const count = Math.max(0, normalizeOilAmount(cardsToReveal, 0));
  for (let index = 0; index < count; index += 1) {
    next.communityCards.push(next.deck[next.deckPosition]);
    next.deckPosition += 1;
  }
  for (const key of Object.keys(next.seatStates || {})) {
    next.seatStates[key].committedStreetOil = 0;
    next.seatStates[key].actedStreet = false;
  }
  next.pendingSeatNumbers = buildPendingOrder(next, startSeat);
  next.actingSeat = next.pendingSeatNumbers[0] || 0;
  next.actionExpiresAt = next.actingSeat
    ? createActionDeadline(nowIso, countdownSeconds)
    : null;
  return next;
}

function finalizeSettledState(state, result) {
  const next = cloneJson(state, {});
  next.status = 'settled';
  next.phase = 'showdown';
  next.street = 'showdown';
  next.pendingSeatNumbers = [];
  next.actingSeat = 0;
  next.actionExpiresAt = null;
  next.result = result;
  return next;
}

function settleByFold(state) {
  const next = cloneJson(state, {});
  const { potSlices, returnedUncalledBySeat } = buildMatchedPotSlices(next);
  applyReturnedUncalledChips(next, returnedUncalledBySeat);
  next.potOil = potSlices.reduce((sum, slice) => sum + normalizeOilAmount(slice?.totalOil, 0), 0);
  const survivingSeats = nonFoldedSeatNumbersFromState(next);
  const winnerSeat = survivingSeats[0] || 0;
  const payoutBySeat = {};
  for (const slice of potSlices) {
    slice.winningSeatNumbers = winnerSeat ? [winnerSeat] : [];
    slice.payoutBySeat = winnerSeat ? { [String(winnerSeat)]: normalizeOilAmount(slice.totalOil, 0) } : {};
    slice.oddChipSeatNumbers = [];
    if (winnerSeat) {
      next.seatStates[String(winnerSeat)].stackOil += normalizeOilAmount(slice.totalOil, 0);
      payoutBySeat[String(winnerSeat)] = normalizeOilAmount(payoutBySeat[String(winnerSeat)], 0) + normalizeOilAmount(slice.totalOil, 0);
    }
  }
  return finalizeSettledState(next, {
    type: 'walk',
    winningSeatNumbers: winnerSeat ? [winnerSeat] : [],
    payoutBySeat,
    handLabelsBySeat: {},
    potSlices,
    returnedUncalledBySeat,
    note: winnerSeat ? `Seat ${winnerSeat} wins uncontested.` : 'Hand ended without an eligible winner.',
  });
}

function settleByShowdown(state) {
  const next = cloneJson(state, {});
  while (Array.isArray(next.communityCards) && next.communityCards.length < 5) {
    next.communityCards.push(next.deck[next.deckPosition]);
    next.deckPosition += 1;
  }
  const contenders = nonFoldedSeatNumbersFromState(next);
  let best = null;
  const evaluations = {};
  let winners = [];

  for (const seatNumber of contenders) {
    const seatState = next.seatStates[String(seatNumber)];
    const cards = []
      .concat(Array.isArray(seatState?.holeCards) ? seatState.holeCards : [])
      .concat(Array.isArray(next.communityCards) ? next.communityCards : []);
    const evaluated = evaluateSevenCardHand(cards);
    evaluations[String(seatNumber)] = {
      label: evaluated.label,
      score: evaluated.score,
      cards: evaluated.cards,
    };
    if (!best || compareScoreArrays(evaluated.score, best.score) > 0) {
      best = evaluated;
      winners = [seatNumber];
    } else if (best && compareScoreArrays(evaluated.score, best.score) === 0) {
      winners.push(seatNumber);
    }
  }

  winners.sort((a, b) => a - b);
  const { potSlices, returnedUncalledBySeat } = buildMatchedPotSlices(next);
  applyReturnedUncalledChips(next, returnedUncalledBySeat);
  next.potOil = potSlices.reduce((sum, slice) => sum + normalizeOilAmount(slice?.totalOil, 0), 0);
  const payoutBySeat = {};

  for (const slice of potSlices) {
    const eligibleWinners = normalizeSeatList(slice.eligibleSeatNumbers);
    if (!eligibleWinners.length) continue;
    let sliceBest = null;
    let sliceWinningSeats = [];
    for (const seatNumber of eligibleWinners) {
      const evaluation = evaluations[String(seatNumber)];
      if (!evaluation) continue;
      if (!sliceBest || compareScoreArrays(evaluation.score, sliceBest.score) > 0) {
        sliceBest = evaluation;
        sliceWinningSeats = [seatNumber];
      } else if (sliceBest && compareScoreArrays(evaluation.score, sliceBest.score) === 0) {
        sliceWinningSeats.push(seatNumber);
      }
    }
    sliceWinningSeats = normalizeSeatList(sliceWinningSeats);
    slice.winningSeatNumbers = sliceWinningSeats;
    const distribution = distributeMatchedPot(slice.totalOil, sliceWinningSeats, next.buttonSeat);
    slice.payoutBySeat = distribution.payoutBySeat;
    slice.oddChipSeatNumbers = distribution.oddChipSeatNumbers;
    for (const [seatNumberRaw, amountRaw] of Object.entries(distribution.payoutBySeat)) {
      const seatNumber = normalizeSeatNumber(seatNumberRaw);
      const amount = normalizeOilAmount(amountRaw, 0);
      if (!seatNumber || amount <= 0) continue;
      next.seatStates[String(seatNumber)].stackOil += amount;
      payoutBySeat[String(seatNumber)] = normalizeOilAmount(payoutBySeat[String(seatNumber)], 0) + amount;
    }
  }

  const handLabelsBySeat = {};
  for (const [seatNumber, evaluation] of Object.entries(evaluations)) {
    handLabelsBySeat[seatNumber] = evaluation.label;
  }

  return finalizeSettledState(next, {
    type: 'showdown',
    winningSeatNumbers: normalizeSeatList(Object.keys(payoutBySeat).map((seatNumber) => Number(seatNumber))),
    payoutBySeat,
    handLabelsBySeat,
    potSlices,
    returnedUncalledBySeat,
    note: summarizePotSliceWinners(potSlices),
  });
}

function resolveIfHandComplete(state, table, nowIso) {
  let next = cloneJson(state, {});
  const countdownSeconds = normalizeOilAmount(next.countdownSeconds, normalizeOilAmount(table?.rules?.decisionCountdownSeconds, DEFAULT_PLAY_ACTION_COUNTDOWN_SECONDS));

  while (true) {
    const remainingSeats = nonFoldedSeatNumbersFromState(next);
    if (remainingSeats.length <= 1) {
      next = settleByFold(next);
      break;
    }

    const canActSeats = actingSeatNumbersFromState(next);
    if (!canActSeats.length) {
      next = settleByShowdown(next);
      break;
    }

    const pending = Array.isArray(next.pendingSeatNumbers) ? next.pendingSeatNumbers.filter((seatNumber) => canActSeats.includes(seatNumber)) : [];
    next.pendingSeatNumbers = pending;
    if (pending.length) {
      next.actingSeat = pending[0];
      next.actionExpiresAt = createActionDeadline(nowIso, countdownSeconds);
      break;
    }

    if (next.street === 'preflop') {
      next = updateStreetStateForNextRound(next, {
        street: 'flop',
        cardsToReveal: 3,
        startSeat: nextOccupiedSeat(remainingSeats, next.buttonSeat),
        countdownSeconds,
        nowIso,
      });
      continue;
    }
    if (next.street === 'flop') {
      next = updateStreetStateForNextRound(next, {
        street: 'turn',
        cardsToReveal: 1,
        startSeat: nextOccupiedSeat(remainingSeats, next.buttonSeat),
        countdownSeconds,
        nowIso,
      });
      continue;
    }
    if (next.street === 'turn') {
      next = updateStreetStateForNextRound(next, {
        street: 'river',
        cardsToReveal: 1,
        startSeat: nextOccupiedSeat(remainingSeats, next.buttonSeat),
        countdownSeconds,
        nowIso,
      });
      continue;
    }
    next = settleByShowdown(next);
    break;
  }

  return next;
}

function createInitialPokerPlayHandState({
  table,
  seats,
  handNumber = 1,
  nowIso = new Date().toISOString(),
  previousTableState = {},
}) {
  const activeSeats = (Array.isArray(seats) ? seats : [])
    .filter((seat) => normalizeSeatNumber(seat?.seatNumber) > 0 && normalizeOilAmount(seat?.stackOil, normalizeOilAmount(seat?.buyInOil, 0)) > 0)
    .slice()
    .sort((left, right) => Number(left?.seatNumber || 0) - Number(right?.seatNumber || 0));
  if (activeSeats.length < Math.max(2, normalizeOilAmount(table?.minPlayers, 2))) return null;

  const orderedSeatNumbers = activeSeats.map((seat) => normalizeSeatNumber(seat.seatNumber)).filter(Boolean);
  const lastButtonSeat = normalizeSeatNumber(previousTableState?.lastButtonSeat);
  const buttonSeat = nextOccupiedSeat(orderedSeatNumbers, lastButtonSeat || orderedSeatNumbers[orderedSeatNumbers.length - 1]);
  const headsUp = orderedSeatNumbers.length === 2;
  const smallBlindSeat = headsUp ? buttonSeat : nextOccupiedSeat(orderedSeatNumbers, buttonSeat);
  const bigBlindSeat = nextOccupiedSeat(orderedSeatNumbers, smallBlindSeat);
  const actingSeat = headsUp
    ? smallBlindSeat
    : nextOccupiedSeat(orderedSeatNumbers, bigBlindSeat);
  const seed = buildSeedFromTable(table, activeSeats, handNumber);
  const deck = shuffleDeck(seed);
  const dealOrder = buildSeatOrder(orderedSeatNumbers, nextOccupiedSeat(orderedSeatNumbers, buttonSeat));
  const dealt = dealHoleCards(deck, 0, dealOrder);
  const seatStates = createSeatStateMap(activeSeats);
  for (const [key, cards] of Object.entries(dealt.dealt || {})) {
    seatStates[key].holeCards = cards.slice(0, 2);
  }

  const smallBlindOil = normalizeOilAmount(table?.smallBlindOil, 10);
  const bigBlindOil = normalizeOilAmount(table?.bigBlindOil, Math.max(20, smallBlindOil * 2));
  const postedSmallBlind = takeBlind(seatStates[String(smallBlindSeat)], smallBlindOil);
  const postedBigBlind = takeBlind(seatStates[String(bigBlindSeat)], bigBlindOil);
  const currentBetOil = Math.max(postedBigBlind, postedSmallBlind);
  const minRaiseToOil = currentBetOil + Math.max(bigBlindOil, 1);

  const state = {
    handNumber: normalizeOilAmount(handNumber, 1),
    tableType: String(table?.tableType || 'cash'),
    blindLevel: normalizeOilAmount(table?.state?.currentBlindLevel, 0),
    handsPerBlindLevel: normalizeOilAmount(table?.state?.handsPerBlindLevel, 0),
    buttonSeat,
    smallBlindSeat,
    bigBlindSeat,
    actingSeat,
    street: 'preflop',
    phase: 'preflop',
    status: 'live',
    countdownSeconds: normalizeOilAmount(table?.rules?.decisionCountdownSeconds, DEFAULT_PLAY_ACTION_COUNTDOWN_SECONDS),
    deck,
    deckPosition: dealt.deckPosition,
    communityCards: [],
    seatOrder: orderedSeatNumbers.slice(),
    seatStates,
    pendingSeatNumbers: buildSeatOrder(orderedSeatNumbers.filter((seat) => isSeatAbleToAct(seatStates[String(seat)])), actingSeat),
    potOil: postedSmallBlind + postedBigBlind,
    currentBetOil,
    lastRaiseSizeOil: Math.max(bigBlindOil, 1),
    minRaiseToOil,
    bigBlindOil,
    actionExpiresAt: createActionDeadline(nowIso, normalizeOilAmount(table?.rules?.decisionCountdownSeconds, DEFAULT_PLAY_ACTION_COUNTDOWN_SECONDS)),
    result: null,
  };
  return resolveIfHandComplete(state, table, nowIso);
}

function getSeatCallAmount(handState, seatNumber) {
  const seat = handState?.seatStates?.[String(normalizeSeatNumber(seatNumber))];
  if (!seat || seat.folded || seat.allIn) return 0;
  return Math.max(0, normalizeOilAmount(handState?.currentBetOil, 0) - normalizeOilAmount(seat?.committedStreetOil, 0));
}

function getSeatAllowedActions({ handState, seatNumber }) {
  const seat = handState?.seatStates?.[String(normalizeSeatNumber(seatNumber))];
  if (!seat || handState?.status !== 'live' || normalizeSeatNumber(handState?.actingSeat) !== normalizeSeatNumber(seatNumber)) return [];
  if (seat.folded || seat.allIn) return [];
  const toCall = getSeatCallAmount(handState, seatNumber);
  const stackOil = normalizeOilAmount(seat.stackOil, 0);
  const actions = [];
  if (toCall > 0) actions.push('fold');
  if (toCall === 0) actions.push('check');
  if (stackOil > 0 && toCall > 0) actions.push('call');
  if (stackOil > toCall) actions.push(handState?.currentBetOil > 0 ? 'raise' : 'bet');
  return actions;
}

function derivePokerPlayAgentSuggestion({ table, handState, seatNumber }) {
  const seat = handState?.seatStates?.[String(normalizeSeatNumber(seatNumber))];
  const allowedActions = getSeatAllowedActions({ handState, seatNumber });
  const allowed = new Set(allowedActions);
  const cards = Array.isArray(seat?.holeCards) ? seat.holeCards : [];
  const ranks = cards.map((card) => String(card || '').trim().slice(0, -1));
  const toCall = getSeatCallAmount(handState, seatNumber);
  const stackOil = normalizeOilAmount(seat?.stackOil, 0);
  const potOil = normalizeOilAmount(handState?.potOil, 0);
  const minRaiseToOil = normalizeOilAmount(handState?.minRaiseToOil, 0);

  let actionKind = 'check';
  let amountOil = 0;
  let body = 'Clock is live. Default to the line that preserves the strongest future options.';

  const isPair = ranks.length >= 2 && ranks[0] && ranks[0] === ranks[1];
  const broadways = new Set(['A', 'K', 'Q', 'J', 'T']);
  const strongBroadway = ranks.length >= 2 && broadways.has(ranks[0]) && broadways.has(ranks[1]);

  if (isPair && (allowed.has('raise') || allowed.has('bet'))) {
    actionKind = allowed.has('raise') ? 'raise' : 'bet';
    amountOil = Math.min(stackOil + normalizeOilAmount(seat?.committedStreetOil, 0), Math.max(minRaiseToOil, toCall + Math.max(normalizeOilAmount(table?.bigBlindOil, 20), 20)));
    body = `Pocket pair on a 6-max table. Pressure the field before the ${normalizeOilAmount(handState?.countdownSeconds, DEFAULT_PLAY_ACTION_COUNTDOWN_SECONDS)}s clock expires; size to ${amountOil || minRaiseToOil} OIL.`;
  } else if (strongBroadway && (allowed.has('raise') || allowed.has('bet'))) {
    actionKind = allowed.has('raise') ? 'raise' : 'bet';
    amountOil = Math.min(stackOil + normalizeOilAmount(seat?.committedStreetOil, 0), Math.max(minRaiseToOil, toCall + Math.floor(Math.max(potOil, normalizeOilAmount(table?.bigBlindOil, 20)) / 2)));
    body = `Strong broadway combo. Lean into initiative and size to ${amountOil || minRaiseToOil} OIL.`;
  } else if (allowed.has('call') && toCall > 0) {
    actionKind = 'call';
    amountOil = toCall;
    body = `Price is still live at ${toCall} OIL. Continue and preserve stack depth for later streets.`;
  } else if (allowed.has('check')) {
    actionKind = 'check';
    amountOil = 0;
    body = 'Nothing forces extra risk here. Check and keep the range wide.';
  } else if (allowed.has('fold')) {
    actionKind = 'fold';
    amountOil = 0;
    body = 'This branch burns too much stack for too little equity. Fold and wait for the next spot.';
  }

  return {
    actionKind,
    amountOil,
    body,
  };
}

function pickTimeoutAction({ handState, seatNumber }) {
  const toCall = getSeatCallAmount(handState, seatNumber);
  if (toCall > 0) {
    return { actionKind: 'fold', amountOil: 0 };
  }
  return { actionKind: 'check', amountOil: 0 };
}

function applyPokerPlayActionToHandState({
  table,
  handState,
  seatNumber,
  actionKind,
  amountOil = 0,
  nowIso = new Date().toISOString(),
}) {
  const state = cloneJson(handState, {});
  const seat = state?.seatStates?.[String(normalizeSeatNumber(seatNumber))];
  const normalizedAction = String(actionKind || '').trim().toLowerCase();
  const allowed = getSeatAllowedActions({ handState: state, seatNumber }).map((item) => String(item || '').trim().toLowerCase());
  if (!allowed.includes(normalizedAction)) {
    const err = new Error('POKER_PLAY_ACTION_INVALID');
    err.code = 'POKER_PLAY_ACTION_INVALID';
    throw err;
  }

  const toCall = getSeatCallAmount(state, seatNumber);
  const stackOil = normalizeOilAmount(seat?.stackOil, 0);
  const currentCommitted = normalizeOilAmount(seat?.committedStreetOil, 0);
  let debitOil = 0;
  let normalizedAmountOil = 0;

  if (normalizedAction === 'fold') {
    seat.folded = true;
  } else if (normalizedAction === 'check') {
    // no-op
  } else if (normalizedAction === 'call') {
    debitOil = Math.min(toCall, stackOil);
    normalizedAmountOil = debitOil;
    seat.stackOil -= debitOil;
    seat.committedStreetOil += debitOil;
    seat.committedHandOil += debitOil;
    seat.allIn = seat.stackOil <= 0;
    state.potOil += debitOil;
  } else if (normalizedAction === 'bet' || normalizedAction === 'raise') {
    const maxTarget = currentCommitted + stackOil;
    let targetTotal = normalizeOilAmount(amountOil, 0);
    const minTarget = Math.max(
      normalizeOilAmount(state.minRaiseToOil, normalizeOilAmount(state.bigBlindOil, 1)),
      normalizeOilAmount(state.currentBetOil, 0) > 0 ? normalizeOilAmount(state.currentBetOil, 0) + Math.max(normalizeOilAmount(state.lastRaiseSizeOil, 0), 1) : normalizeOilAmount(state.bigBlindOil, 1)
    );
    if (targetTotal <= 0) targetTotal = minTarget;
    if (targetTotal > maxTarget) targetTotal = maxTarget;
    if (targetTotal < minTarget && targetTotal !== maxTarget) {
      const err = new Error('POKER_PLAY_RAISE_TOO_SMALL');
      err.code = 'POKER_PLAY_RAISE_TOO_SMALL';
      err.requiredOil = minTarget;
      throw err;
    }
    debitOil = Math.max(0, targetTotal - currentCommitted);
    normalizedAmountOil = targetTotal;
    seat.stackOil -= debitOil;
    seat.committedStreetOil += debitOil;
    seat.committedHandOil += debitOil;
    seat.allIn = seat.stackOil <= 0;
    state.potOil += debitOil;
    const previousBet = normalizeOilAmount(state.currentBetOil, 0);
    const raiseSize = Math.max(1, targetTotal - previousBet);
    state.currentBetOil = targetTotal;
    state.lastRaiseSizeOil = raiseSize;
    state.minRaiseToOil = targetTotal + Math.max(raiseSize, normalizeOilAmount(state.bigBlindOil, 1));
  }

  seat.actedStreet = true;
  state.pendingSeatNumbers = Array.isArray(state.pendingSeatNumbers)
    ? state.pendingSeatNumbers.filter((pendingSeat) => normalizeSeatNumber(pendingSeat) !== normalizeSeatNumber(seatNumber))
    : [];

  if (normalizedAction === 'bet' || normalizedAction === 'raise') {
    const canActSeats = actingSeatNumbersFromState(state)
      .filter((pendingSeat) => normalizeSeatNumber(pendingSeat) !== normalizeSeatNumber(seatNumber) && !state.seatStates[String(pendingSeat)].folded);
    state.pendingSeatNumbers = buildSeatOrder(canActSeats, nextOccupiedSeat(canActSeats, normalizeSeatNumber(seatNumber)));
  }

  state.potOil = sumSeatPot(state);
  const next = resolveIfHandComplete(state, table, nowIso);
  return {
    handState: next,
    debitOil,
    normalizedAmountOil,
  };
}

module.exports = {
  DEFAULT_PLAY_ACTION_COUNTDOWN_SECONDS,
  POKER_PLAY_MAX_SEATS,
  applyPokerPlayActionToHandState,
  createInitialPokerPlayHandState,
  derivePokerPlayAgentSuggestion,
  evaluateSevenCardHand,
  getSeatAllowedActions,
  getSeatCallAmount,
  nextOccupiedSeat,
  normalizeOilAmount,
  normalizeSeatNumber,
  pickTimeoutAction,
};
