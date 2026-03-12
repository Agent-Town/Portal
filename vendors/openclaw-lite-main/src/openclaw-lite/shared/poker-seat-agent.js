function normalizeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function normalizeCards(cards) {
  return (Array.isArray(cards) ? cards : [])
    .map((card) => normalizeText(card).toUpperCase())
    .filter(Boolean)
    .slice(0, 2);
}

function cardRank(card) {
  const text = normalizeText(card).toUpperCase();
  return text ? text[0] : "";
}

function cardSuit(card) {
  const text = normalizeText(card).toUpperCase();
  return text ? text.slice(-1) : "";
}

function isPocketPair(cards) {
  if (cards.length !== 2) return false;
  return cardRank(cards[0]) && cardRank(cards[0]) === cardRank(cards[1]);
}

function isSuited(cards) {
  if (cards.length !== 2) return false;
  return cardSuit(cards[0]) && cardSuit(cards[0]) === cardSuit(cards[1]);
}

function isBroadway(rank) {
  return ["A", "K", "Q", "J", "T"].includes(String(rank || "").toUpperCase());
}

function countBroadway(cards) {
  return cards.reduce((count, card) => count + (isBroadway(cardRank(card)) ? 1 : 0), 0);
}

function makeProposal({
  actionKind,
  amountOil = 0,
  confidence = "medium",
  body = "",
  reason = "",
} = {}) {
  return {
    schemaVersion: "poker-seat-agent-proposal-v1",
    source: "worker-seat-agent-v1",
    actionKind: normalizeText(actionKind).toLowerCase(),
    amountOil: Math.max(0, Math.floor(normalizeNumber(amountOil, 0))),
    confidence: ["low", "medium", "high"].includes(normalizeText(confidence).toLowerCase())
      ? normalizeText(confidence).toLowerCase()
      : "medium",
    body: normalizeText(body),
    reason: normalizeText(reason),
  };
}

export function buildPokerSeatAgentProposal({
  table = null,
  hand = null,
  mySeat = null,
} = {}) {
  const allowed = new Set(
    (Array.isArray(hand?.viewerAllowedActions) ? hand.viewerAllowedActions : [])
      .map((value) => normalizeText(value).toLowerCase())
      .filter(Boolean),
  );
  if (!allowed.size) {
    return makeProposal({
      actionKind: "check",
      amountOil: 0,
      confidence: "low",
      body: "No legal seat action is available right now.",
      reason: "no_legal_action",
    });
  }

  const cards = normalizeCards(mySeat?.holeCards);
  const stackOil = Math.max(0, normalizeNumber(mySeat?.stackOil, 0));
  const committedStreetOil = Math.max(0, normalizeNumber(mySeat?.committedStreetOil, 0));
  const toCall = Math.max(0, normalizeNumber(hand?.requiredCallOil, 0));
  const minRaiseToOil = Math.max(0, normalizeNumber(hand?.minRaiseToOil, 0));
  const bigBlindOil = Math.max(1, normalizeNumber(table?.bigBlindOil, 1));
  const shoveToOil = committedStreetOil + stackOil;
  const aggressiveTarget = Math.min(
    stackOil,
    Math.max(minRaiseToOil, toCall + bigBlindOil),
  );
  const pressureTarget = Math.min(
    stackOil,
    Math.max(minRaiseToOil, toCall + Math.max(bigBlindOil * 2, 1)),
  );
  const broadwayCount = countBroadway(cards);
  const pair = isPocketPair(cards);
  const suited = isSuited(cards);

  if (allowed.has("shove") && shoveToOil > 0 && (pair || broadwayCount >= 2) && stackOil <= Math.max(bigBlindOil * 2, minRaiseToOil || bigBlindOil)) {
    return makeProposal({
      actionKind: "shove",
      amountOil: shoveToOil,
      confidence: pair ? "high" : "medium",
      body: `Stack depth is compressed. Shove to ${shoveToOil} OIL and realize the full 6-max pressure now.`,
      reason: pair ? "pair_shove_pressure" : "broadway_shove_pressure",
    });
  }

  if (allowed.has("raise") && pressureTarget > 0 && (pair || (suited && broadwayCount >= 2))) {
    return makeProposal({
      actionKind: "raise",
      amountOil: pressureTarget,
      confidence: "high",
      body: `Pressure this 6-max spot now. Raise to ${pressureTarget} OIL and keep initiative while the clock is live.`,
      reason: pair ? "pocket_pair_pressure" : "suited_broadway_pressure",
    });
  }

  if (allowed.has("bet") && aggressiveTarget > 0 && (pair || broadwayCount >= 1)) {
    return makeProposal({
      actionKind: "bet",
      amountOil: aggressiveTarget,
      confidence: pair ? "high" : "medium",
      body: `Take the lead and size to ${aggressiveTarget} OIL before the table gets a free card.`,
      reason: pair ? "pair_value_bet" : "broadway_lead_bet",
    });
  }

  if (allowed.has("call") && toCall > 0 && toCall <= Math.max(bigBlindOil * 2, Math.floor(stackOil * 0.25))) {
    return makeProposal({
      actionKind: "call",
      amountOil: toCall,
      confidence: suited || broadwayCount >= 1 ? "medium" : "low",
      body: `The price is controlled at ${toCall} OIL. Call and continue with position-sensitive postflop decisions.`,
      reason: "priced_in_call",
    });
  }

  if (allowed.has("check")) {
    return makeProposal({
      actionKind: "check",
      amountOil: 0,
      confidence: "medium",
      body: "No forced investment here. Check and preserve OIL for the next betting node.",
      reason: "free_check",
    });
  }

  if (allowed.has("fold")) {
    return makeProposal({
      actionKind: "fold",
      amountOil: 0,
      confidence: toCall > Math.max(bigBlindOil * 2, Math.floor(stackOil * 0.25)) ? "medium" : "low",
      body: "This spot burns too much stack for too little edge. Fold and preserve OIL for a cleaner decision.",
      reason: "fallback_fold",
    });
  }

  if (allowed.has("call")) {
    return makeProposal({
      actionKind: "call",
      amountOil: toCall,
      confidence: "low",
      body: `This is the lowest-variance legal continue. Call ${toCall} OIL and reassess on the next street.`,
      reason: "fallback_call",
    });
  }

  const firstAllowed = Array.from(allowed)[0] || "check";
  return makeProposal({
    actionKind: firstAllowed,
    amountOil: firstAllowed === "bet" || firstAllowed === "raise" ? aggressiveTarget : 0,
    confidence: "low",
    body: `Take the first legal action available: ${firstAllowed}.`,
    reason: "first_legal_action",
  });
}

export function scorePokerSeatAgentCorpus(corpus = []) {
  const rows = Array.isArray(corpus) ? corpus : [];
  const latencies = [];
  let legalCount = 0;
  let amountLegalCount = 0;
  let schemaValidCount = 0;
  let easyAgreeCount = 0;
  let easyCount = 0;
  let mediumSafeCount = 0;
  let mediumCount = 0;
  const cases = rows.map((entry) => {
    const startedAt = Date.now();
    const proposal = buildPokerSeatAgentProposal(entry?.state || {});
    const durationMs = Math.max(0, Date.now() - startedAt);
    latencies.push(durationMs);
    const allowed = new Set((Array.isArray(entry?.expected?.allowedActions) ? entry.expected.allowedActions : [])
      .map((value) => normalizeText(value).toLowerCase())
      .filter(Boolean));
    const minRaiseToOil = Math.max(0, normalizeNumber(entry?.expected?.minRaiseToOil, 0));
    const maxCommitOil = Math.max(0, normalizeNumber(entry?.expected?.maxCommitOil, 0));
    const actionKind = normalizeText(proposal?.actionKind).toLowerCase();
    const amountOil = Math.max(0, normalizeNumber(proposal?.amountOil, 0));
    const legal = allowed.has(actionKind);
    const amountLegal = !legal
      ? false
      : ((actionKind === "raise" || actionKind === "bet")
        ? amountOil >= minRaiseToOil && amountOil <= maxCommitOil
        : amountOil >= 0 && amountOil <= maxCommitOil);
    const schemaValid = proposal
      && normalizeText(proposal?.schemaVersion) === "poker-seat-agent-proposal-v1"
      && ["low", "medium", "high"].includes(normalizeText(proposal?.confidence).toLowerCase())
      && normalizeText(proposal?.body).length > 0;
    if (legal) legalCount += 1;
    if (amountLegal) amountLegalCount += 1;
    if (schemaValid) schemaValidCount += 1;
    if (String(entry?.expected?.difficulty || "") === "easy") {
      easyCount += 1;
      if (actionKind === normalizeText(entry?.expected?.preferredActionKind).toLowerCase()) easyAgreeCount += 1;
    }
    if (String(entry?.expected?.difficulty || "") === "medium") {
      mediumCount += 1;
      const safeActions = new Set((Array.isArray(entry?.expected?.safeActionKinds) ? entry.expected.safeActionKinds : [])
        .map((value) => normalizeText(value).toLowerCase())
        .filter(Boolean));
      if (safeActions.has(actionKind)) mediumSafeCount += 1;
    }
    return {
      id: normalizeText(entry?.id),
      proposal,
      legal,
      amountLegal,
      schemaValid,
      durationMs,
    };
  });
  const sortedLatencies = latencies.slice().sort((left, right) => left - right);
  const medianLatencyMs = sortedLatencies.length
    ? sortedLatencies[Math.floor(sortedLatencies.length / 2)]
    : 0;
  const total = Math.max(rows.length, 1);
  return {
    corpusSize: rows.length,
    legalActionCompliance: Number((legalCount / total).toFixed(4)),
    amountLegalityCompliance: Number((amountLegalCount / total).toFixed(4)),
    schemaValidity: Number((schemaValidCount / total).toFixed(4)),
    easySpotAgreement: easyCount ? Number((easyAgreeCount / easyCount).toFixed(4)) : 1,
    mediumSpotNonBlunderRate: mediumCount ? Number((mediumSafeCount / mediumCount).toFixed(4)) : 1,
    medianLatencyMs,
    cases,
  };
}
