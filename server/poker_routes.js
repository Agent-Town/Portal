const {
  DEFAULT_CENTAUR_COUNTDOWN_SECONDS,
  DEFAULT_SNAPSHOTS_PER_HOUR,
  STREAMFLOW_PROVIDER,
  STREAMFLOW_TOKEN_SYMBOL,
  applyCentaurActionToTableState,
  buildInitialCentaurHandState,
  buildStreamflowLockVerifyMessage,
  deriveCentaurAgentSuggestion,
  normalizeOilAmount,
  toHourBucketStart,
} = require('./poker_centaur');
const {
  buildCurrentHourSnapshotState,
  normalizeIsoOrNull,
  processOilSnapshotsForVerification,
  runOilSnapshotSweep,
} = require('./poker_oil');
const {
  resetStreamflowFixtureState,
  resolveStreamflowLockStatus,
  seedStreamflowFixtureState,
} = require('./streamflow_adapter');
const {
  buildPokerPlayAdminReviewPayload,
  buildPokerPlayAdminExportPayload,
  buildPokerPlayAdminSeriesExportPayload,
  buildPokerPlayAdminSeriesReviewPayload,
  buildPokerPlayTablePayload,
  breakTournamentSeriesTableByDirector,
  closeTournamentRegistration,
  closeTable,
  closeTournamentSeries,
  createTable,
  createRouteError,
  getHandHistory,
  getMyResults,
  getSeriesTimeline,
  getSeriesDetail,
  getTableDetail,
  joinTableWaitlist,
  leaveTable,
  leaveTableWaitlist,
  listTables,
  matchmakeIntoTable,
  openHandDispute,
  pauseTable,
  postAction,
  postMessage,
  postSeatAgentProposal,
  rebalanceTournamentSeriesByDirector,
  reloadTableSeat,
  reenterTournamentSeries,
  returnTableSeat,
  resolveHandDispute,
  resumeTable,
  seatIntoTable,
  sitOutTableSeat,
  startTournamentTableByDirector,
  moveTournamentDirectorSeat,
  useTimeBank,
} = require('./poker_play_service');

const STREAMFLOW_VERIFY_NONCE_TTL_MS = 15 * 60 * 1000;

function normalizeTrimmedString(value, fallback = '') {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

function normalizeCentaurMessageBody(value) {
  const body = normalizeTrimmedString(value);
  if (!body) return '';
  return body.slice(0, 800);
}

function normalizeCentaurDisplayName(value, fallback = 'Centaur Pilot') {
  const text = normalizeTrimmedString(value, fallback);
  return text.slice(0, 80);
}

function buildCentaurHandForEntry({ tournament, entry, nowIso }) {
  const base = buildInitialCentaurHandState({
    tournamentTitle: tournament?.title || 'Centaur Invitational',
    handNumber: 1,
    countdownSeconds: DEFAULT_CENTAUR_COUNTDOWN_SECONDS,
    now: nowIso,
  });
  const startingStack = Math.max(normalizeOilAmount(entry?.wagerOil, 0), 150);
  const requiredCallOil = Math.max(25, Math.min(50, startingStack));
  const minRaiseToOil = Math.max(requiredCallOil * 3, Math.min(150, startingStack));
  return {
    ...base,
    stackOil: startingStack,
    potOil: Math.min(100, Math.max(25, Math.floor(startingStack / 4))),
    requiredCallOil,
    minRaiseToOil,
  };
}

function parseOptionalSession(deps, req, res) {
  if (typeof deps.resolveHumanSessionWithRecovery !== 'function') return null;
  return deps.resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
}

function getSessionHouseId(session) {
  return normalizeTrimmedString(session?.houseCeremony?.houseId);
}

function ensureCentaurOwnership({
  entry,
  hand,
  session,
  walletBinding,
  requestId,
  sendPortalApiError,
  res,
}) {
  if (!entry || !hand) {
    sendPortalApiError(res, 404, 'NOT_FOUND', 'Centaur hand not found.', { requestId });
    return null;
  }
  if (entry.portalSessionId && session?.sessionId && entry.portalSessionId !== session.sessionId && entry.walletSubject !== walletBinding?.walletSubject) {
    sendPortalApiError(res, 403, 'FORBIDDEN', 'This centaur table belongs to a different Portal session.', { requestId });
    return null;
  }
  if (walletBinding?.walletSubject && entry.walletSubject !== walletBinding.walletSubject) {
    sendPortalApiError(res, 403, 'FORBIDDEN', 'This centaur table belongs to a different wallet.', { requestId });
    return null;
  }
  return { entry, hand };
}

async function buildCentaurTournamentPayload(deps, tournament, session, req, { processAt = null } = {}) {
  const walletBinding = session ? deps.resolvePrimaryWalletSubject(session, req) : null;
  const atIso = normalizeIsoOrNull(processAt) || deps.nowIso();
  const payload = {
    tournament,
    houseId: getSessionHouseId(session),
    wallet: walletBinding?.submitterWallet || null,
    verification: null,
    oilBalance: null,
    entry: null,
    hand: null,
    suggestion: null,
    messages: [],
    actions: [],
    ledgerEntries: [],
    snapshotEvents: [],
    currentHourSnapshots: buildCurrentHourSnapshotState(null, [], atIso),
  };

  if (!session) return payload;
  if (!walletBinding?.walletSubject) return payload;

  let verification = deps.getStreamflowVerificationByWalletSubject(walletBinding.walletSubject);
  if (verification) {
    await processOilSnapshotsForVerification(deps, verification, { asOf: processAt });
    verification = deps.getStreamflowVerificationById(verification.verificationId) || verification;
    payload.verification = verification;
    payload.oilBalance = deps.computeOilBalance(walletBinding.walletSubject);
    const hourBucket = toHourBucketStart(atIso);
    payload.snapshotEvents = deps.listOilSnapshotEventsByVerificationAndHour(verification.verificationId, hourBucket);
    payload.currentHourSnapshots = buildCurrentHourSnapshotState(verification, payload.snapshotEvents, atIso);
    payload.ledgerEntries = deps.listOilLedgerEntriesByWalletSubject(walletBinding.walletSubject, { limit: 20 });
  } else {
    payload.oilBalance = deps.computeOilBalance(walletBinding.walletSubject);
  }

  const entry = deps.getCentaurEntryByWalletSubject(tournament.tournamentId, walletBinding.walletSubject);
  if (!entry) return payload;
  payload.entry = entry;
  const hand = deps.getCurrentCentaurHandForEntry(entry.entryId);
  if (!hand) return payload;
  payload.hand = hand;
  payload.suggestion = deriveCentaurAgentSuggestion(hand.tableState);
  payload.messages = deps.listCentaurMessagesByHand(hand.handId);
  payload.actions = deps.listCentaurActionsByHand(hand.handId);
  return payload;
}

async function sendCentaurTournamentSuccess(deps, res, requestId, tournament, session, req, options = {}) {
  const detail = await buildCentaurTournamentPayload(deps, tournament, session, req, options);
  return deps.sendPortalApiSuccess(res, detail, { requestId });
}

function registerPokerRoutes(app, deps) {
  const {
    buildPortalRequestId,
    computeOilBalance,
    computePokerArtifactSha256,
    createCentaurAction,
    createCentaurMessage,
    createOilLedgerEntry,
    createPokerPlayAuditEvent,
    createPokerPlayAction,
    createPokerPlayMessage,
    createPortalPokerOperatorClient,
    express,
    getActivePokerPlaySeatByWalletSubject,
    getCentaurEntryById,
    getCentaurEntryByWalletSubject,
    getCentaurHandById,
    getCentaurTournamentById,
    getCurrentCentaurHandForEntry,
    getCurrentPokerPlayHandForTable,
    getLatestPokerLeaderboardSnapshot,
    getOilSnapshotEventByVerificationAndScheduledFor,
    getPokerOperatorServiceToken,
    getPokerPlayHandById,
    getPokerPlayDisputeById,
    getPokerPlaySeatByTableAndNumber,
    getPokerPlaySeatByWalletSubject,
    getPokerPlayTableById,
    getPokerPlayWaitlistEntryByTableAndWalletSubject,
    getPokerReplayArtifactByRunId,
    getPokerRunById,
    getPokerSeasonById,
    getPokerSubmissionById,
    getPokerSubmissionByRequest,
    getStreamflowVerificationById,
    getStreamflowVerificationByProviderAndStream,
    getStreamflowVerificationByWalletAndStream,
    getStreamflowVerificationByWalletSubject,
    isAdmin,
    isTestMockAddress,
    listActiveStreamflowVerifications,
    listCentaurActionsByHand,
    listCentaurMessagesByHand,
    listCentaurTournaments,
    listOilLedgerEntriesByWalletSubject,
    listOilSnapshotEventsByVerificationAndHour,
    listPokerPlayActionsByHand,
    listPokerPlayAuditEventsByHand,
    listPokerPlayAuditEventsByTable,
    listPokerPlayDisputesByHand,
    listPokerPlayDisputesByTable,
    listPokerPlayDisputesByWalletSubject,
    listPokerPlayHandsByTable,
    listPokerPlayMessagesByHand,
    listPokerPlaySeatsByWalletSubject,
    listPokerPlaySeatsByTable,
    listPokerPlayTables,
    listPokerPlayWaitlistEntriesByTable,
    listPokerSeasons,
    normalizePortalIdempotencyKey,
    nowIso,
    randomHex,
    deletePokerPlaySeat,
    deletePokerPlayWaitlistEntry,
    requireBoundHumanSession,
    resolveHumanSessionWithRecovery,
    resolvePrimaryWalletSubject,
    respondPokerOperatorTransport,
    sendPortalApiError,
    sendPortalApiSuccess,
    summarizeMirroredPokerSeason,
    syncPokerMirrorFromOperator,
    upsertCentaurEntry,
    upsertCentaurHand,
    upsertCentaurTournament,
    upsertOilSnapshotEvent,
    upsertPokerPlayHand,
    upsertPokerPlayDispute,
    upsertPokerPlaySeat,
    upsertPokerPlayTable,
    upsertPokerPlayWaitlistEntry,
    upsertPokerSeason,
    upsertPokerSubmission,
    upsertStreamflowVerification,
    verifySolanaSignature,
  } = deps;

  const routeDeps = {
    computeOilBalance,
    createOilLedgerEntry,
    getCentaurEntryByWalletSubject,
    getCurrentCentaurHandForEntry,
    getStreamflowVerificationById,
    getStreamflowVerificationByWalletSubject,
    listActiveStreamflowVerifications,
    listCentaurActionsByHand,
    listCentaurMessagesByHand,
    listOilLedgerEntriesByWalletSubject,
    listOilSnapshotEventsByVerificationAndHour,
    nowIso,
    resolvePrimaryWalletSubject,
    sendPortalApiSuccess,
    upsertOilSnapshotEvent,
    upsertStreamflowVerification,
    getOilSnapshotEventByVerificationAndScheduledFor,
  };

  const playRouteDeps = {
    computeOilBalance,
    createOilLedgerEntry,
    createPokerPlayAuditEvent,
    createPokerPlayAction,
    createPokerPlayMessage,
    deletePokerPlaySeat,
    getActivePokerPlaySeatByWalletSubject,
    getCurrentPokerPlayHandForTable,
    getPokerPlayHandById,
    getPokerPlayDisputeById,
    getPokerPlaySeatByTableAndNumber,
    getPokerPlaySeatByWalletSubject,
    getPokerPlayTableById,
    getPokerPlayWaitlistEntryByTableAndWalletSubject,
    getStreamflowVerificationByWalletSubject,
    listPokerPlayActionsByHand,
    listPokerPlayAuditEventsByHand,
    listPokerPlayAuditEventsByTable,
    listPokerPlayDisputesByHand,
    listPokerPlayDisputesByTable,
    listPokerPlayDisputesByWalletSubject,
    listPokerPlayHandsByTable,
    listPokerPlayMessagesByHand,
    listPokerPlaySeatsByWalletSubject,
    listPokerPlaySeatsByTable,
    listPokerPlayTables,
    listPokerPlayWaitlistEntriesByTable,
    nowIso,
    randomHex,
    resolvePrimaryWalletSubject,
    upsertPokerPlayHand,
    upsertPokerPlayDispute,
    upsertPokerPlaySeat,
    upsertPokerPlayTable,
    upsertPokerPlayWaitlistEntry,
  };

  const pokerPlayStreamClientsByTable = new Map();
  const pokerPlayStreamClientsBySeries = new Map();
  let pokerPlayStreamEventCounter = 0;

  function writePokerPlayStreamEvent(res, { event = 'table', data = {}, id = null } = {}) {
    if (id != null) {
      res.write(`id: ${String(id)}\n`);
    }
    res.write(`event: ${String(event || 'table')}\n`);
    res.write(`data: ${JSON.stringify(data || {})}\n\n`);
  }

  function publishPokerPlayTableEvent(tableId, reason, details = {}) {
    const normalizedTableId = normalizeTrimmedString(tableId);
    if (!normalizedTableId) return;
    pokerPlayStreamEventCounter += 1;
    const payload = {
      tableId: normalizedTableId,
      reason: normalizeTrimmedString(reason, 'update'),
      at: nowIso(),
      ...((details && typeof details === 'object') ? details : {}),
    };
    const tableClients = pokerPlayStreamClientsByTable.get(normalizedTableId);
    if (tableClients && tableClients.size) {
      for (const client of tableClients) {
        try {
          writePokerPlayStreamEvent(client.res, {
            id: pokerPlayStreamEventCounter,
            event: 'table',
            data: payload,
          });
        } catch {
          client.close();
        }
      }
    }

    const table = getPokerPlayTableById(normalizedTableId);
    const seriesId = normalizeTrimmedString(
      table?.rules?.seriesId,
      normalizeTrimmedString(table?.summary?.seriesId)
    );
    if (!seriesId) return;
    const seriesClients = pokerPlayStreamClientsBySeries.get(seriesId);
    if (!seriesClients || !seriesClients.size) return;
    const seriesPayload = {
      seriesId,
      ...payload,
    };
    for (const client of seriesClients) {
      try {
        writePokerPlayStreamEvent(client.res, {
          id: `${pokerPlayStreamEventCounter}-series`,
          event: 'series',
          data: seriesPayload,
        });
      } catch {
        client.close();
      }
    }
  }

  function subscribePokerPlayTableStream(tableId, req, res) {
    const normalizedTableId = normalizeTrimmedString(tableId);
    const bucket = pokerPlayStreamClientsByTable.get(normalizedTableId) || new Set();
    const client = {
      res,
      close() {},
    };
    const heartbeat = setInterval(() => {
      try {
        res.write(`: keepalive ${Date.now()}\n\n`);
      } catch {
        client.close();
      }
    }, 15000);
    client.close = () => {
      clearInterval(heartbeat);
      bucket.delete(client);
      if (!bucket.size) {
        pokerPlayStreamClientsByTable.delete(normalizedTableId);
      }
    };
    bucket.add(client);
    pokerPlayStreamClientsByTable.set(normalizedTableId, bucket);
    req.on('close', client.close);
    req.on('aborted', client.close);
    writePokerPlayStreamEvent(res, {
      id: `ready-${Date.now()}`,
      event: 'ready',
      data: {
        tableId: normalizedTableId,
        at: nowIso(),
      },
    });
  }

  function subscribePokerPlaySeriesStream(seriesId, req, res) {
    const normalizedSeriesId = normalizeTrimmedString(seriesId);
    const bucket = pokerPlayStreamClientsBySeries.get(normalizedSeriesId) || new Set();
    const client = {
      res,
      close() {},
    };
    const heartbeat = setInterval(() => {
      try {
        res.write(`: keepalive ${Date.now()}\n\n`);
      } catch {
        client.close();
      }
    }, 15000);
    client.close = () => {
      clearInterval(heartbeat);
      bucket.delete(client);
      if (!bucket.size) {
        pokerPlayStreamClientsBySeries.delete(normalizedSeriesId);
      }
    };
    bucket.add(client);
    pokerPlayStreamClientsBySeries.set(normalizedSeriesId, bucket);
    req.on('close', client.close);
    req.on('aborted', client.close);
    writePokerPlayStreamEvent(res, {
      id: `ready-${Date.now()}`,
      event: 'ready',
      data: {
        seriesId: normalizedSeriesId,
        at: nowIso(),
      },
    });
  }

  function normalizeHarnessSeatNumber(value, fallback = 0) {
    const seatNumber = Number.parseInt(String(value == null ? '' : value), 10);
    if (!Number.isFinite(seatNumber) || seatNumber < 1 || seatNumber > 6) return fallback;
    return seatNumber;
  }

  function addHarnessSeconds(iso, seconds) {
    const baseMs = Date.parse(String(iso || ''));
    const safeBaseMs = Number.isFinite(baseMs) ? baseMs : Date.now();
    return new Date(safeBaseMs + (Math.max(0, Number(seconds || 0)) * 1000)).toISOString();
  }

  function normalizeHarnessActors(rawActors, defaults) {
    return (Array.isArray(defaults) ? defaults : []).map((fallback, index) => {
      const source = Array.isArray(rawActors) ? rawActors[index] : null;
      return {
        seatNumber: normalizeHarnessSeatNumber(source?.seatNumber, fallback.seatNumber),
        address: normalizeTrimmedString(source?.address, fallback.address),
        houseId: normalizeTrimmedString(source?.houseId, fallback.houseId),
        displayName: normalizeTrimmedString(source?.displayName, fallback.displayName),
      };
    });
  }

  function seedPokerPlayHarnessScenario({ scenario, requestAt, tableId, actors }) {
    const normalizedScenario = normalizeTrimmedString(scenario).toLowerCase();
    const defaultsByScenario = {
      sidepot_live: [
        { seatNumber: 1, address: 'So1anaHarnessSidepotA111111111111111111111111', houseId: 'house_harness_sidepot_a', displayName: 'Harness Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessSidepotB111111111111111111111111', houseId: 'house_harness_sidepot_b', displayName: 'Harness Bravo' },
        { seatNumber: 3, address: 'So1anaHarnessSidepotC111111111111111111111111', houseId: 'house_harness_sidepot_c', displayName: 'Harness Charlie' },
      ],
      oddchip_live: [
        { seatNumber: 1, address: 'Sq1anaHarnessQddChipA11111111111111111111111', houseId: 'house_harness_oddchip_a', displayName: 'Odd Alpha' },
        { seatNumber: 2, address: 'Sq1anaHarnessQddChipB11111111111111111111111', houseId: 'house_harness_oddchip_b', displayName: 'Odd Bravo' },
        { seatNumber: 3, address: 'Sq1anaHarnessQddChipC11111111111111111111111', houseId: 'house_harness_oddchip_c', displayName: 'Odd Charlie' },
      ],
      timebank_live: [
        { seatNumber: 1, address: 'So1anaHarnessTimeBankA1111111111111111111111', houseId: 'house_harness_timebank_a', displayName: 'Clock Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessTimeBankB1111111111111111111111', houseId: 'house_harness_timebank_b', displayName: 'Clock Bravo' },
      ],
      cash_lifecycle_waiting: [
        { seatNumber: 1, address: 'So1anaHarnessCashLifeA111111111111111111111', houseId: 'house_harness_cashlife_a', displayName: 'Lifecycle Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessCashLifeB111111111111111111111', houseId: 'house_harness_cashlife_b', displayName: 'Lifecycle Bravo' },
        { seatNumber: 3, address: 'So1anaHarnessCashLifeC111111111111111111111', houseId: 'house_harness_cashlife_c', displayName: 'Lifecycle Charlie' },
      ],
      waitlist_full_cash: [
        { seatNumber: 1, address: 'So1anaHarnessWaitlistA111111111111111111111', houseId: 'house_harness_waitlist_a', displayName: 'Waitlist Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessWaitlistB111111111111111111111', houseId: 'house_harness_waitlist_b', displayName: 'Waitlist Bravo' },
      ],
      tournament_director_manual: [
        { seatNumber: 1, address: 'So1anaHarnessDirectorA1111111111111111111111', houseId: 'house_harness_director_a', displayName: 'Director Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessDirectorB1111111111111111111111', houseId: 'house_harness_director_b', displayName: 'Director Bravo' },
        { seatNumber: 1, address: 'So1anaHarnessDirectorC1111111111111111111111', houseId: 'house_harness_director_c', displayName: 'Director Charlie' },
      ],
      tournament_director_break: [
        { seatNumber: 1, address: 'So1anaHarnessBreakA111111111111111111111111', houseId: 'house_harness_break_a', displayName: 'Break Alpha' },
        { seatNumber: 1, address: 'So1anaHarnessBreakB111111111111111111111111', houseId: 'house_harness_break_b', displayName: 'Break Bravo' },
        { seatNumber: 2, address: 'So1anaHarnessBreakC111111111111111111111111', houseId: 'house_harness_break_c', displayName: 'Break Charlie' },
      ],
      tournament_schedule_waiting: [
        { seatNumber: 1, address: 'So1anaHarnessSchedA111111111111111111111111', houseId: 'house_harness_schedule_a', displayName: 'Schedule Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessSchedB111111111111111111111111', houseId: 'house_harness_schedule_b', displayName: 'Schedule Bravo' },
      ],
      tournament_reentry_waiting: [
        { seatNumber: 1, address: 'So1anaHarnessReentryA11111111111111111111111', houseId: 'house_harness_reentry_a', displayName: 'Reentry Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessReentryB11111111111111111111111', houseId: 'house_harness_reentry_b', displayName: 'Reentry Bravo' },
      ],
    };
    const defaults = defaultsByScenario[normalizedScenario];
    if (!defaults) {
      throw createRouteError(400, 'INVALID_ARGUMENT', 'Unknown poker play harness scenario.');
    }
    const normalizedActors = normalizeHarnessActors(actors, defaults);
    const nextTableId = normalizeTrimmedString(tableId, `pkt_play_harness_${normalizedScenario}_${randomHex(6)}`);
    const handId = `pkplayhand_harness_${randomHex(8)}`;
    const actionExpiresAt = addHarnessSeconds(requestAt, normalizedScenario === 'timebank_live' ? 10 : 45);
    let seededSeriesId = '';
    const seededTableIds = [];

    if (normalizedScenario === 'sidepot_live') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      upsertPokerPlayTable({
        tableId: nextTableId,
        slug: `${normalizedScenario}-${randomHex(4)}`,
        title: 'Harness Side Pot Table',
        tableType: 'cash',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 400,
        minPlayers: 4,
        state: {
          activeHandId: handId,
          activeHandNumber: 1,
          lastButtonSeat: seatOne.seatNumber,
          prizePoolOil: 0,
          settlementLedgerEntryId: null,
          timeBankRemainingBySeat: {},
        },
        rules: {
          mode: 'no_limit_holdem',
          format: 'cash',
          maxSeats: 6,
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 0,
          cashOutEnabled: true,
        },
        summary: {
          headline: 'Harness side-pot showdown scenario.',
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      [
        { actor: seatOne, buyInOil: 100, stackOil: 0 },
        { actor: seatTwo, buyInOil: 250, stackOil: 0 },
        { actor: seatThree, buyInOil: 400, stackOil: 50 },
      ].forEach(({ actor, buyInOil, stackOil }) => {
        upsertPokerPlaySeat({
          tableId: nextTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'active',
          buyInOil,
          stackOil,
          lastSeenAt: requestAt,
          disconnectedAt: null,
          createdAt: requestAt,
          updatedAt: requestAt,
        });
      });
      upsertPokerPlayHand({
        handId,
        tableId: nextTableId,
        handNumber: 1,
        status: 'live',
        actionExpiresAt,
        state: {
          handNumber: 1,
          tableType: 'cash',
          blindLevel: 0,
          handsPerBlindLevel: 0,
          buttonSeat: seatOne.seatNumber,
          smallBlindSeat: seatTwo.seatNumber,
          bigBlindSeat: seatThree.seatNumber,
          actingSeat: seatThree.seatNumber,
          street: 'river',
          phase: 'river',
          status: 'live',
          countdownSeconds: 45,
          deck: [],
          deckPosition: 0,
          communityCards: ['Ah', 'Kd', '7c', '4s', '2h'],
          seatOrder: [seatOne.seatNumber, seatTwo.seatNumber, seatThree.seatNumber],
          seatStates: {
            [String(seatOne.seatNumber)]: {
              seatNumber: seatOne.seatNumber,
              stackOil: 0,
              holeCards: ['Ac', 'Ad'],
              committedStreetOil: 100,
              committedHandOil: 100,
              folded: false,
              allIn: true,
              eliminated: false,
              actedStreet: true,
            },
            [String(seatTwo.seatNumber)]: {
              seatNumber: seatTwo.seatNumber,
              stackOil: 0,
              holeCards: ['Kc', 'Kh'],
              committedStreetOil: 250,
              committedHandOil: 250,
              folded: false,
              allIn: true,
              eliminated: false,
              actedStreet: true,
            },
            [String(seatThree.seatNumber)]: {
              seatNumber: seatThree.seatNumber,
              stackOil: 50,
              holeCards: ['Qc', 'Jh'],
              committedStreetOil: 250,
              committedHandOil: 350,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: false,
            },
          },
          pendingSeatNumbers: [seatThree.seatNumber],
          potOil: 700,
          currentBetOil: 250,
          lastRaiseSizeOil: 150,
          minRaiseToOil: 400,
          bigBlindOil: 20,
          actionExpiresAt,
          result: null,
        },
        result: {},
        createdAt: requestAt,
        updatedAt: requestAt,
      });
    } else if (normalizedScenario === 'oddchip_live') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      upsertPokerPlayTable({
        tableId: nextTableId,
        slug: `${normalizedScenario}-${randomHex(4)}`,
        title: 'Harness Odd Chip Table',
        tableType: 'cash',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 5,
        bigBlindOil: 10,
        buyInOil: 100,
        minPlayers: 4,
        state: {
          activeHandId: handId,
          activeHandNumber: 1,
          lastButtonSeat: seatOne.seatNumber,
          prizePoolOil: 0,
          settlementLedgerEntryId: null,
          timeBankRemainingBySeat: {},
        },
        rules: {
          mode: 'no_limit_holdem',
          format: 'cash',
          maxSeats: 6,
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 0,
          cashOutEnabled: true,
        },
        summary: {
          headline: 'Harness odd-chip split scenario.',
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      [
        { actor: seatOne, buyInOil: 25, stackOil: 0 },
        { actor: seatTwo, buyInOil: 25, stackOil: 0 },
        { actor: seatThree, buyInOil: 35, stackOil: 10 },
      ].forEach(({ actor, buyInOil, stackOil }) => {
        upsertPokerPlaySeat({
          tableId: nextTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'active',
          buyInOil,
          stackOil,
          lastSeenAt: requestAt,
          disconnectedAt: null,
          createdAt: requestAt,
          updatedAt: requestAt,
        });
      });
      upsertPokerPlayHand({
        handId,
        tableId: nextTableId,
        handNumber: 1,
        status: 'live',
        actionExpiresAt,
        state: {
          handNumber: 1,
          tableType: 'cash',
          blindLevel: 0,
          handsPerBlindLevel: 0,
          buttonSeat: seatOne.seatNumber,
          smallBlindSeat: seatTwo.seatNumber,
          bigBlindSeat: seatThree.seatNumber,
          actingSeat: seatThree.seatNumber,
          street: 'river',
          phase: 'river',
          status: 'live',
          countdownSeconds: 45,
          deck: [],
          deckPosition: 0,
          communityCards: ['As', 'Ks', 'Qd', 'Jh', '2c'],
          seatOrder: [seatOne.seatNumber, seatTwo.seatNumber, seatThree.seatNumber],
          seatStates: {
            [String(seatOne.seatNumber)]: {
              seatNumber: seatOne.seatNumber,
              stackOil: 0,
              holeCards: ['Tc', '3d'],
              committedStreetOil: 25,
              committedHandOil: 25,
              folded: false,
              allIn: true,
              eliminated: false,
              actedStreet: true,
            },
            [String(seatTwo.seatNumber)]: {
              seatNumber: seatTwo.seatNumber,
              stackOil: 0,
              holeCards: ['Th', '4d'],
              committedStreetOil: 25,
              committedHandOil: 25,
              folded: false,
              allIn: true,
              eliminated: false,
              actedStreet: true,
            },
            [String(seatThree.seatNumber)]: {
              seatNumber: seatThree.seatNumber,
              stackOil: 10,
              holeCards: ['9s', '8s'],
              committedStreetOil: 25,
              committedHandOil: 25,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: false,
            },
          },
          pendingSeatNumbers: [seatThree.seatNumber],
          potOil: 75,
          currentBetOil: 25,
          lastRaiseSizeOil: 10,
          minRaiseToOil: 35,
          bigBlindOil: 10,
          actionExpiresAt,
          result: null,
        },
        result: {},
        createdAt: requestAt,
        updatedAt: requestAt,
      });
    } else if (normalizedScenario === 'timebank_live') {
      const [seatOne, seatTwo] = normalizedActors;
      upsertPokerPlayTable({
        tableId: nextTableId,
        slug: `${normalizedScenario}-${randomHex(4)}`,
        title: 'Harness Time Bank Table',
        tableType: 'cash',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 200,
        minPlayers: 2,
        state: {
          activeHandId: handId,
          activeHandNumber: 1,
          lastButtonSeat: seatOne.seatNumber,
          prizePoolOil: 0,
          settlementLedgerEntryId: null,
          timeBankRemainingBySeat: {
            [String(seatOne.seatNumber)]: 15,
            [String(seatTwo.seatNumber)]: 15,
          },
        },
        rules: {
          mode: 'no_limit_holdem',
          format: 'cash',
          maxSeats: 6,
          decisionCountdownSeconds: 10,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 15,
          cashOutEnabled: true,
        },
        summary: {
          headline: 'Harness time-bank scenario.',
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      [
        { actor: seatOne, buyInOil: 200, stackOil: 190 },
        { actor: seatTwo, buyInOil: 200, stackOil: 180 },
      ].forEach(({ actor, buyInOil, stackOil }) => {
        upsertPokerPlaySeat({
          tableId: nextTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'active',
          buyInOil,
          stackOil,
          lastSeenAt: requestAt,
          disconnectedAt: null,
          createdAt: requestAt,
          updatedAt: requestAt,
        });
      });
      upsertPokerPlayHand({
        handId,
        tableId: nextTableId,
        handNumber: 1,
        status: 'live',
        actionExpiresAt,
        state: {
          handNumber: 1,
          tableType: 'cash',
          blindLevel: 0,
          handsPerBlindLevel: 0,
          buttonSeat: seatOne.seatNumber,
          smallBlindSeat: seatOne.seatNumber,
          bigBlindSeat: seatTwo.seatNumber,
          actingSeat: seatOne.seatNumber,
          street: 'preflop',
          phase: 'preflop',
          status: 'live',
          countdownSeconds: 10,
          deck: [],
          deckPosition: 0,
          communityCards: [],
          seatOrder: [seatOne.seatNumber, seatTwo.seatNumber],
          seatStates: {
            [String(seatOne.seatNumber)]: {
              seatNumber: seatOne.seatNumber,
              stackOil: 190,
              holeCards: ['Ah', 'Qs'],
              committedStreetOil: 10,
              committedHandOil: 10,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: false,
            },
            [String(seatTwo.seatNumber)]: {
              seatNumber: seatTwo.seatNumber,
              stackOil: 180,
              holeCards: ['Kd', 'Jc'],
              committedStreetOil: 20,
              committedHandOil: 20,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: true,
            },
          },
          pendingSeatNumbers: [seatOne.seatNumber],
          potOil: 30,
          currentBetOil: 20,
          lastRaiseSizeOil: 20,
          minRaiseToOil: 40,
          bigBlindOil: 20,
          actionExpiresAt,
          result: null,
        },
        result: {},
        createdAt: requestAt,
        updatedAt: requestAt,
      });
    } else if (normalizedScenario === 'cash_lifecycle_waiting') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      upsertPokerPlayTable({
        tableId: nextTableId,
        slug: `${normalizedScenario}-${randomHex(4)}`,
        title: 'Harness Cash Lifecycle Table',
        tableType: 'cash',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 200,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 0,
          lastButtonSeat: 2,
          prizePoolOil: 0,
          settlementLedgerEntryId: null,
          timeBankRemainingBySeat: {},
        },
        rules: {
          mode: 'no_limit_holdem',
          format: 'cash',
          maxSeats: 6,
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 0,
          cashOutEnabled: true,
        },
        summary: {
          headline: 'Harness cash lifecycle scenario.',
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      [
        { actor: seatOne, buyInOil: 200, stackOil: 240 },
        { actor: seatTwo, buyInOil: 200, stackOil: 220 },
        { actor: seatThree, buyInOil: 200, stackOil: 200 },
      ].forEach(({ actor, buyInOil, stackOil }) => {
        upsertPokerPlaySeat({
          tableId: nextTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'active',
          buyInOil,
          stackOil,
          lastSeenAt: requestAt,
          disconnectedAt: null,
          createdAt: requestAt,
          updatedAt: requestAt,
        });
      });
    } else if (normalizedScenario === 'waitlist_full_cash') {
      const [seatOne, seatTwo] = normalizedActors;
      upsertPokerPlayTable({
        tableId: nextTableId,
        slug: `${normalizedScenario}-${randomHex(4)}`,
        title: 'Harness Waitlist Table',
        tableType: 'cash',
        status: 'open',
        maxSeats: 2,
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 250,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 0,
          lastButtonSeat: 2,
          prizePoolOil: 0,
          settlementLedgerEntryId: null,
          timeBankRemainingBySeat: {},
        },
        rules: {
          mode: 'no_limit_holdem',
          format: 'cash',
          maxSeats: 2,
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 0,
          cashOutEnabled: true,
        },
        summary: {
          headline: 'Harness waitlist scenario.',
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      [
        { actor: seatOne, buyInOil: 250, stackOil: 260 },
        { actor: seatTwo, buyInOil: 250, stackOil: 240 },
      ].forEach(({ actor, buyInOil, stackOil }) => {
        upsertPokerPlaySeat({
          tableId: nextTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'active',
          buyInOil,
          stackOil,
          lastSeenAt: requestAt,
          disconnectedAt: null,
          createdAt: requestAt,
          updatedAt: requestAt,
        });
      });
    } else if (normalizedScenario === 'tournament_director_manual') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      const seriesId = `pkseries_harness_director_${randomHex(6)}`;
      const tableAId = nextTableId;
      const tableBId = `${nextTableId}_b`;
      const blindLevels = [
        { level: 1, smallBlindOil: 50, bigBlindOil: 100 },
        { level: 2, smallBlindOil: 75, bigBlindOil: 150 },
      ];
      const tableRules = {
        mode: 'no_limit_holdem',
        format: 'tournament',
        maxSeats: 3,
        decisionCountdownSeconds: 45,
        presenceTimeoutSeconds: 30,
        reconnectGraceSeconds: 90,
        timeBankSeconds: 15,
        cashOutEnabled: false,
        payoutModel: 'top2_70_30',
        lateRegistrationHands: 2,
        handsPerBlindLevel: 2,
        blindLevels,
        reentryLimit: 1,
        seriesId,
        seriesTitle: 'Harness Director Series',
        matchKey: 'tournament:director:harness',
      };
      upsertPokerPlayTable({
        tableId: tableAId,
        slug: `${normalizedScenario}-a-${randomHex(4)}`,
        title: 'Harness Director Table A',
        tableType: 'tournament',
        status: 'open',
        maxSeats: 3,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 3,
        state: {
          activeHandId: null,
          activeHandNumber: 0,
          completedAt: null,
          winnerSeatNumber: 0,
          prizeOil: 0,
          prizeSettledAt: null,
          manualDirectorOnly: true,
          timeBankRemainingBySeat: {
            '1': 15,
            '2': 15,
          },
          entryCount: 2,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatTwo.address]: 1,
          },
        },
        rules: tableRules,
        summary: {
          headline: 'Harness director override scenario.',
          seriesId,
          seriesTitle: 'Harness Director Series',
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      upsertPokerPlayTable({
        tableId: tableBId,
        slug: `${normalizedScenario}-b-${randomHex(4)}`,
        title: 'Harness Director Table B',
        tableType: 'tournament',
        status: 'open',
        maxSeats: 3,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 3,
        state: {
          activeHandId: null,
          activeHandNumber: 0,
          completedAt: null,
          winnerSeatNumber: 0,
          prizeOil: 0,
          prizeSettledAt: null,
          manualDirectorOnly: true,
          timeBankRemainingBySeat: {
            '1': 15,
          },
          entryCount: 1,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatThree.address]: 1,
          },
        },
        rules: tableRules,
        summary: {
          headline: 'Harness director override scenario.',
          seriesId,
          seriesTitle: 'Harness Director Series',
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      [
        { tableId: tableAId, actor: seatOne, buyInOil: 600, stackOil: 600 },
        { tableId: tableAId, actor: seatTwo, buyInOil: 600, stackOil: 600 },
        { tableId: tableBId, actor: seatThree, buyInOil: 600, stackOil: 600 },
      ].forEach(({ tableId: seededTableId, actor, buyInOil, stackOil }) => {
        upsertPokerPlaySeat({
          tableId: seededTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'active',
          buyInOil,
          stackOil,
          lastSeenAt: requestAt,
          disconnectedAt: null,
          createdAt: requestAt,
          updatedAt: requestAt,
        });
      });
      seededSeriesId = seriesId;
      seededTableIds.push(tableAId, tableBId);
    } else if (normalizedScenario === 'tournament_director_break') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      const seriesId = `pkseries_harness_break_${randomHex(6)}`;
      const tableAId = nextTableId;
      const tableBId = `${nextTableId}_b`;
      const tableRules = {
        mode: 'no_limit_holdem',
        format: 'tournament',
        maxSeats: 4,
        decisionCountdownSeconds: 45,
        presenceTimeoutSeconds: 30,
        reconnectGraceSeconds: 90,
        timeBankSeconds: 15,
        cashOutEnabled: false,
        payoutModel: 'top2_70_30',
        lateRegistrationHands: 1,
        handsPerBlindLevel: 2,
        blindLevels: [
          { level: 1, smallBlindOil: 50, bigBlindOil: 100 },
        ],
        reentryLimit: 0,
        seriesId,
        seriesTitle: 'Harness Break Series',
        matchKey: 'tournament:break:harness',
      };
      upsertPokerPlayTable({
        tableId: tableAId,
        slug: `${normalizedScenario}-a-${randomHex(4)}`,
        title: 'Harness Break Table A',
        tableType: 'tournament',
        status: 'open',
        maxSeats: 4,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 4,
        state: {
          activeHandId: null,
          activeHandNumber: 0,
          completedAt: null,
          winnerSeatNumber: 0,
          prizeOil: 0,
          prizeSettledAt: null,
          manualDirectorOnly: true,
          timeBankRemainingBySeat: {
            '1': 15,
          },
          entryCount: 1,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
          },
        },
        rules: tableRules,
        summary: {
          headline: 'Harness break-table scenario.',
          seriesId,
          seriesTitle: 'Harness Break Series',
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      upsertPokerPlayTable({
        tableId: tableBId,
        slug: `${normalizedScenario}-b-${randomHex(4)}`,
        title: 'Harness Break Table B',
        tableType: 'tournament',
        status: 'open',
        maxSeats: 4,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 4,
        state: {
          activeHandId: null,
          activeHandNumber: 0,
          completedAt: null,
          winnerSeatNumber: 0,
          prizeOil: 0,
          prizeSettledAt: null,
          manualDirectorOnly: true,
          timeBankRemainingBySeat: {
            '1': 15,
            '2': 15,
          },
          entryCount: 2,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatTwo.address]: 1,
            [seatThree.address]: 1,
          },
        },
        rules: tableRules,
        summary: {
          headline: 'Harness break-table scenario.',
          seriesId,
          seriesTitle: 'Harness Break Series',
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      [
        { tableId: tableAId, actor: seatOne, buyInOil: 600, stackOil: 600 },
        { tableId: tableBId, actor: seatTwo, buyInOil: 600, stackOil: 600 },
        { tableId: tableBId, actor: seatThree, buyInOil: 600, stackOil: 600 },
      ].forEach(({ tableId: seededTableId, actor, buyInOil, stackOil }) => {
        upsertPokerPlaySeat({
          tableId: seededTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'active',
          buyInOil,
          stackOil,
          lastSeenAt: requestAt,
          disconnectedAt: null,
          createdAt: requestAt,
          updatedAt: requestAt,
        });
      });
      seededSeriesId = seriesId;
      seededTableIds.push(tableAId, tableBId);
    } else if (normalizedScenario === 'tournament_schedule_waiting') {
      const [seatOne, seatTwo] = normalizedActors;
      const seriesId = `pkseries_harness_schedule_${randomHex(6)}`;
      const scheduledStartAt = addHarnessSeconds(requestAt, 300);
      upsertPokerPlayTable({
        tableId: nextTableId,
        slug: `${normalizedScenario}-${randomHex(4)}`,
        title: 'Harness Scheduled Table',
        tableType: 'tournament',
        status: 'scheduled',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 0,
          completedAt: null,
          winnerSeatNumber: 0,
          prizeOil: 0,
          prizeSettledAt: null,
          scheduledStartAt,
          timeBankRemainingBySeat: {
            '1': 15,
            '2': 15,
          },
          entryCount: 2,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatTwo.address]: 1,
          },
        },
        rules: {
          mode: 'no_limit_holdem',
          format: 'tournament',
          maxSeats: 6,
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 15,
          cashOutEnabled: false,
          payoutModel: 'top2_70_30',
          lateRegistrationHands: 2,
          handsPerBlindLevel: 2,
          blindLevels: [
            { level: 1, smallBlindOil: 50, bigBlindOil: 100 },
            { level: 2, smallBlindOil: 75, bigBlindOil: 150 },
          ],
          scheduledStartAt,
          reentryLimit: 1,
          seriesId,
          seriesTitle: 'Harness Scheduled Series',
          matchKey: 'tournament:schedule:harness',
        },
        summary: {
          headline: 'Harness scheduled-start scenario.',
          seriesId,
          seriesTitle: 'Harness Scheduled Series',
          scheduledStartAt,
          reentryLimit: 1,
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      [
        { actor: seatOne, buyInOil: 600, stackOil: 600 },
        { actor: seatTwo, buyInOil: 600, stackOil: 600 },
      ].forEach(({ actor, buyInOil, stackOil }) => {
        upsertPokerPlaySeat({
          tableId: nextTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'active',
          buyInOil,
          stackOil,
          lastSeenAt: requestAt,
          disconnectedAt: null,
          createdAt: requestAt,
          updatedAt: requestAt,
        });
      });
      seededSeriesId = seriesId;
      seededTableIds.push(nextTableId);
    } else if (normalizedScenario === 'tournament_reentry_waiting') {
      const [seatOne, seatTwo] = normalizedActors;
      const seriesId = `pkseries_harness_reentry_${randomHex(6)}`;
      upsertPokerPlayTable({
        tableId: nextTableId,
        slug: `${normalizedScenario}-${randomHex(4)}`,
        title: 'Harness Reentry Table',
        tableType: 'tournament',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 0,
          completedAt: null,
          winnerSeatNumber: 0,
          prizeOil: 0,
          prizeSettledAt: null,
          timeBankRemainingBySeat: {
            '1': 15,
            '2': 15,
          },
          entryCount: 2,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatTwo.address]: 1,
          },
        },
        rules: {
          mode: 'no_limit_holdem',
          format: 'tournament',
          maxSeats: 6,
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 15,
          cashOutEnabled: false,
          payoutModel: 'top2_70_30',
          lateRegistrationHands: 2,
          handsPerBlindLevel: 2,
          blindLevels: [
            { level: 1, smallBlindOil: 50, bigBlindOil: 100 },
            { level: 2, smallBlindOil: 75, bigBlindOil: 150 },
          ],
          scheduledStartAt: null,
          reentryLimit: 1,
          seriesId,
          seriesTitle: 'Harness Reentry Series',
          matchKey: 'tournament:reentry:harness',
        },
        summary: {
          headline: 'Harness re-entry scenario.',
          seriesId,
          seriesTitle: 'Harness Reentry Series',
          reentryLimit: 1,
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      upsertPokerPlaySeat({
        tableId: nextTableId,
        seatNumber: seatOne.seatNumber,
        portalSessionId: `harness_${seatOne.address}`,
        houseId: seatOne.houseId,
        walletSubject: seatOne.address,
        displayName: seatOne.displayName,
        status: 'busted',
        buyInOil: 600,
        stackOil: 0,
        lastSeenAt: requestAt,
        disconnectedAt: null,
        eliminatedAt: requestAt,
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      upsertPokerPlaySeat({
        tableId: nextTableId,
        seatNumber: seatTwo.seatNumber,
        portalSessionId: `harness_${seatTwo.address}`,
        houseId: seatTwo.houseId,
        walletSubject: seatTwo.address,
        displayName: seatTwo.displayName,
        status: 'active',
        buyInOil: 600,
        stackOil: 600,
        lastSeenAt: requestAt,
        disconnectedAt: null,
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      seededSeriesId = seriesId;
      seededTableIds.push(nextTableId);
    }

    return {
      scenario: normalizedScenario,
      tableId: nextTableId,
      tableIds: seededTableIds.length ? seededTableIds : [nextTableId],
      seriesId: seededSeriesId || null,
      handId,
      actionExpiresAt,
      actors: normalizedActors.map((actor) => ({
        seatNumber: actor.seatNumber,
        address: actor.address,
        houseId: actor.houseId,
        displayName: actor.displayName,
      })),
    };
  }

  app.get('/v1/health', respondPokerOperatorTransport);
  app.get('/v1/seasons', respondPokerOperatorTransport);
  app.get('/v1/seasons/:seasonId', respondPokerOperatorTransport);
  app.post('/v1/seasons', express.json({ limit: '1mb' }), respondPokerOperatorTransport);
  app.post('/v1/seasons/:seasonId/submissions', express.json({ limit: '1mb' }), respondPokerOperatorTransport);
  app.post('/v1/seasons/:seasonId/batches', express.json({ limit: '1mb' }), respondPokerOperatorTransport);
  app.get('/v1/batches/:batchId', respondPokerOperatorTransport);
  app.get('/v1/runs/:runId', respondPokerOperatorTransport);
  app.get('/v1/runs/:runId/replay', respondPokerOperatorTransport);
  app.get('/v1/leaderboards/:seasonId/latest', respondPokerOperatorTransport);
  app.get('/v1/leaderboards/:seasonId/snapshots/:snapshotId', respondPokerOperatorTransport);

  app.post('/api/poker/admin/sync', async (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const seasonId = typeof req.body?.seasonId === 'string' ? req.body.seasonId.trim() : '';
    try {
      const mirrored = await syncPokerMirrorFromOperator({ seasonId });
      return sendPortalApiSuccess(res, {
        operator: mirrored.health,
        mirrored: mirrored.counts,
        seasonIds: mirrored.seasonIds,
      }, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 502),
        typeof err?.code === 'string' && err.code ? err.code : 'POKER_OPERATOR_SYNC_FAILED',
        typeof err?.message === 'string' && err.message ? err.message : 'Poker operator sync failed.',
        {
          requestId,
          retryable: Number(err?.status || 502) >= 500,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/seasons', (_req, res) => {
    const requestId = buildPortalRequestId();
    const items = listPokerSeasons()
      .map(summarizeMirroredPokerSeason)
      .filter(Boolean);
    return sendPortalApiSuccess(res, { items }, { requestId });
  });

  app.get('/api/poker/seasons/:seasonId', (req, res) => {
    const requestId = buildPortalRequestId();
    const season = getPokerSeasonById(req.params.seasonId);
    if (!season) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Poker season not found.', { requestId });
    }
    return sendPortalApiSuccess(res, {
      season: summarizeMirroredPokerSeason(season),
    }, { requestId });
  });

  app.post('/api/poker/seasons/:seasonId/submissions', async (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'idempotencyKey is required.', { requestId });
    }
    const walletBinding = resolvePrimaryWalletSubject(session, req);
    if (!walletBinding) {
      return sendPortalApiError(res, 409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before submitting.', { requestId });
    }
    const existing = getPokerSubmissionByRequest({
      seasonId: req.params.seasonId,
      portalSessionId: session.sessionId,
      idempotencyKey,
    });
    if (existing) {
      return sendPortalApiSuccess(res, {
        submission: existing,
        replayed: true,
      }, { requestId });
    }

    const bundle = req.body?.bundle && typeof req.body.bundle === 'object' ? req.body.bundle : null;
    const declaredCapabilities = req.body?.declaredCapabilities && typeof req.body.declaredCapabilities === 'object'
      ? req.body.declaredCapabilities
      : {};
    const portalSubmissionId = typeof req.body?.portalSubmissionId === 'string' && req.body.portalSubmissionId.trim()
      ? req.body.portalSubmissionId.trim()
      : `psub_${randomHex(8)}`;
    try {
      const client = createPortalPokerOperatorClient();
      const result = await client.createSubmission(
        req.params.seasonId,
        {
          portalSubmissionId,
          submitterWallet: walletBinding.submitterWallet,
          bundle,
          declaredCapabilities,
        },
        {
          bearerToken: getPokerOperatorServiceToken(),
          idempotencyKey,
        }
      );
      if (!getPokerSeasonById(req.params.seasonId)) {
        const season = await client.getSeason(req.params.seasonId);
        upsertPokerSeason({
          seasonId: season.seasonId,
          seasonSlug: season.seasonSlug,
          displayName: season.displayName,
          rulesVersion: season.rulesVersion,
          operatorVersion: season.operatorVersion,
          status: season.status,
          submissionOpenAt: season.submissionOpenAt,
          submissionCloseAt: season.submissionCloseAt,
          divisions: season.divisions,
          raw: season,
          createdAt: season.createdAt || nowIso(),
          updatedAt: season.updatedAt || nowIso(),
        });
      }
      const mirrored = upsertPokerSubmission({
        submissionId: result.submissionId,
        seasonId: req.params.seasonId,
        portalSubmissionId,
        portalSessionId: session.sessionId,
        walletSubject: walletBinding.walletSubject,
        submitterWallet: walletBinding.submitterWallet,
        bundle,
        declaredCapabilities,
        validation: result.validation,
        status: result.status,
        idempotencyKey,
        raw: result,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      return sendPortalApiSuccess(res, {
        submission: mirrored,
        replayed: false,
      }, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 502),
        typeof err?.code === 'string' && err.code ? err.code : 'POKER_SUBMISSION_FAILED',
        typeof err?.message === 'string' && err.message ? err.message : 'Poker submission failed.',
        {
          requestId,
          retryable: Number(err?.status || 502) >= 500,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/submissions/:submissionId', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const submission = getPokerSubmissionById(req.params.submissionId);
    if (!submission) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Poker submission not found.', { requestId });
    }
    if (submission.portalSessionId && submission.portalSessionId !== session.sessionId) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'This poker submission belongs to a different Portal session.', { requestId });
    }
    return sendPortalApiSuccess(res, {
      submission: {
        submissionId: submission.submissionId,
        seasonId: submission.seasonId,
        status: submission.status,
        validation: submission.validation,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
      },
    }, { requestId });
  });

  app.get('/api/poker/leaderboards/:seasonId/latest', (req, res) => {
    const requestId = buildPortalRequestId();
    const snapshot = getLatestPokerLeaderboardSnapshot(req.params.seasonId);
    return sendPortalApiSuccess(res, {
      seasonId: req.params.seasonId,
      snapshotId: snapshot?.snapshotId || null,
      createdAt: snapshot?.createdAt || null,
      rankings: Array.isArray(snapshot?.rankings) ? snapshot.rankings : [],
    }, { requestId });
  });

  app.get('/api/poker/runs/:runId/replay', (req, res) => {
    const requestId = buildPortalRequestId();
    const run = getPokerRunById(req.params.runId);
    const replay = getPokerReplayArtifactByRunId(req.params.runId);
    if (!run || !replay) {
      return sendPortalApiError(res, 404, 'POKER_REPLAY_NOT_READY', 'Replay artifact is not ready.', { requestId });
    }
    if (replay.replayFormat !== 'poker-run-replay-v1') {
      return sendPortalApiError(res, 502, 'POKER_OPERATOR_SCHEMA_MISMATCH', 'Replay format does not match Portal expectations.', {
        requestId,
        details: {
          expectedReplayFormat: 'poker-run-replay-v1',
          receivedReplayFormat: replay.replayFormat,
        },
      });
    }
    const computedHash = computePokerArtifactSha256(replay.raw);
    if (!computedHash || computedHash !== replay.artifactSha256) {
      return sendPortalApiError(res, 409, 'POKER_REPLAY_NOT_READY', 'Replay artifact hash is not ready or does not match.', {
        requestId,
        details: {
          expectedArtifactSha256: replay.artifactSha256,
          computedArtifactSha256: computedHash,
        },
      });
    }
    return sendPortalApiSuccess(res, {
      runId: run.runId,
      summary: run.summary,
      replay: {
        replayFormat: replay.replayFormat,
        summaryJson: replay.summary,
        eventsJsonlUri: replay.eventsJsonlUri,
        artifactSha256: replay.artifactSha256,
        contentType: replay.contentType,
      },
      hashVerified: true,
    }, { requestId });
  });

  app.get('/api/poker/play/tables', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
      const payload = listTables(playRouteDeps, {
        session,
        req,
        processAt: req.query?.asOf,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_LIST_FAILED',
        err?.message || 'Unable to load poker tables.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/rail', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const payload = listTables(playRouteDeps, {
        session: null,
        req,
        processAt: req.query?.asOf,
        publicViewer: true,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_RAIL_LIST_FAILED',
        err?.message || 'Unable to load poker rail tables.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/tables', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = createTable(playRouteDeps, {
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || '', payload?.mySeat ? 'seat' : 'create', {
        handId: payload?.hand?.handId || null,
        seatNumber: payload?.mySeat?.seatNumber || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_CREATE_FAILED',
        err?.message || 'Unable to create the poker table.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/matchmake', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = matchmakeIntoTable(playRouteDeps, {
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || '', 'seat', {
        handId: payload?.hand?.handId || null,
        seatNumber: payload?.mySeat?.seatNumber || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_MATCHMAKE_FAILED',
        err?.message || 'Unable to matchmake into a poker table.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/tables/:tableId', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
      const payload = getTableDetail(playRouteDeps, {
        tableId: req.params.tableId,
        session,
        req,
        processAt: req.query?.asOf,
        seatAgentMode: normalizeTrimmedString(req.query?.seatAgentMode),
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_DETAIL_FAILED',
        err?.message || 'Unable to load poker table.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/tables/:tableId/history', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
      const payload = getHandHistory(playRouteDeps, {
        tableId: req.params.tableId,
        session,
        req,
        processAt: req.query?.asOf,
        limit: req.query?.limit,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_HISTORY_FAILED',
        err?.message || 'Unable to load poker hand history.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/series/:seriesId/timeline', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
      const payload = getSeriesTimeline(playRouteDeps, {
        seriesId: req.params.seriesId,
        session,
        req,
        processAt: req.query?.asOf,
        limit: req.query?.limit,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_SERIES_TIMELINE_FAILED',
        err?.message || 'Unable to load poker series timeline.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/results/me', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = getMyResults(playRouteDeps, {
        session,
        req,
        processAt: req.query?.asOf,
        limit: req.query?.limit,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_RESULTS_FAILED',
        err?.message || 'Unable to load poker results.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/rail/tables/:tableId', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const payload = getTableDetail(playRouteDeps, {
        tableId: req.params.tableId,
        session: null,
        req,
        processAt: req.query?.asOf,
        publicViewer: true,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_RAIL_DETAIL_FAILED',
        err?.message || 'Unable to load poker rail table.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/rail/series/:seriesId', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const payload = getSeriesDetail(playRouteDeps, {
        seriesId: req.params.seriesId,
        session: null,
        req,
        processAt: req.query?.asOf,
        publicViewer: true,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_RAIL_SERIES_FAILED',
        err?.message || 'Unable to load poker rail series.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/rail/series/:seriesId/stream', (req, res) => {
    const requestId = buildPortalRequestId();
    const seriesId = normalizeTrimmedString(req.params.seriesId);
    if (!seriesId) {
      return sendPortalApiError(
        res,
        404,
        'NOT_FOUND',
        'Poker tournament series not found.',
        { requestId }
      );
    }
    try {
      getSeriesDetail(playRouteDeps, {
        seriesId,
        session: null,
        req,
        processAt: req.query?.asOf,
        publicViewer: true,
      });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_RAIL_SERIES_FAILED',
        err?.message || 'Unable to load poker rail series.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
    res.status(200);
    res.setHeader('content-type', 'text/event-stream; charset=utf-8');
    res.setHeader('cache-control', 'no-cache, no-transform');
    res.setHeader('connection', 'keep-alive');
    res.setHeader('x-accel-buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }
    subscribePokerPlaySeriesStream(seriesId, req, res);
  });

  app.get('/api/poker/play/tables/:tableId/stream', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const tableId = normalizeTrimmedString(req.params.tableId);
    if (!tableId || !getPokerPlayTableById(tableId)) {
      return sendPortalApiError(
        res,
        404,
        'NOT_FOUND',
        'Poker table not found.',
        { requestId }
      );
    }
    const streamAt = normalizeIsoOrNull(req.query?.asOf) || nowIso();
    const walletBinding = resolvePrimaryWalletSubject(session, req);
    if (walletBinding?.walletSubject) {
      const seat = getPokerPlaySeatByWalletSubject(tableId, walletBinding.walletSubject);
      if (seat) {
        upsertPokerPlaySeat({
          ...seat,
          lastSeenAt: streamAt,
          updatedAt: streamAt,
        });
      }
    }
    res.status(200);
    res.setHeader('content-type', 'text/event-stream; charset=utf-8');
    res.setHeader('cache-control', 'no-cache, no-transform');
    res.setHeader('connection', 'keep-alive');
    res.setHeader('x-accel-buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }
    subscribePokerPlayTableStream(tableId, req, res);
  });

  app.get('/api/poker/play/rail/tables/:tableId/stream', (req, res) => {
    const requestId = buildPortalRequestId();
    const tableId = normalizeTrimmedString(req.params.tableId);
    if (!tableId || !getPokerPlayTableById(tableId)) {
      return sendPortalApiError(
        res,
        404,
        'NOT_FOUND',
        'Poker table not found.',
        { requestId }
      );
    }
    res.status(200);
    res.setHeader('content-type', 'text/event-stream; charset=utf-8');
    res.setHeader('cache-control', 'no-cache, no-transform');
    res.setHeader('connection', 'keep-alive');
    res.setHeader('x-accel-buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }
    subscribePokerPlayTableStream(tableId, req, res);
  });

  app.post('/api/poker/play/admin/tables/:tableId/pause', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = pauseTable(playRouteDeps, {
        tableId: req.params.tableId,
        reason: normalizeTrimmedString(req.body?.reason),
        actorLabel: 'operator',
        asOf: req.body?.asOf,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || req.params.tableId, 'pause', {
        handId: payload?.hand?.handId || null,
        handNumber: payload?.hand?.handNumber || null,
        actingSeat: payload?.hand?.state?.actingSeat || null,
      });
      return sendPortalApiSuccess(
        res,
        buildPokerPlayTablePayload(playRouteDeps, payload.table, payload.seats, payload.hand, {
          req,
          processAt: req.body?.asOf,
        }),
        { requestId }
      );
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_PAUSE_FAILED',
        err?.message || 'Unable to pause the poker table.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/admin/tables/:tableId/resume', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = resumeTable(playRouteDeps, {
        tableId: req.params.tableId,
        actorLabel: 'operator',
        asOf: req.body?.asOf,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || req.params.tableId, 'resume', {
        handId: payload?.hand?.handId || null,
        handNumber: payload?.hand?.handNumber || null,
        actingSeat: payload?.hand?.state?.actingSeat || null,
      });
      return sendPortalApiSuccess(
        res,
        buildPokerPlayTablePayload(playRouteDeps, payload.table, payload.seats, payload.hand, {
          req,
          processAt: req.body?.asOf,
        }),
        { requestId }
      );
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_RESUME_FAILED',
        err?.message || 'Unable to resume the poker table.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/admin/tables/:tableId/close', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = closeTable(playRouteDeps, {
        tableId: req.params.tableId,
        reason: normalizeTrimmedString(req.body?.reason),
        actorLabel: 'operator',
        refundMode: req.body?.refundMode,
        asOf: req.body?.asOf,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || req.params.tableId, 'close', {
        handId: payload?.hand?.handId || null,
        refundMode: payload?.refundSummary?.refundMode || null,
        refundedSeatCount: Number(payload?.refundSummary?.refundedSeatCount || 0),
        refundedTotalOil: Number(payload?.refundSummary?.refundedTotalOil || 0),
      });
      return sendPortalApiSuccess(
        res,
        buildPokerPlayTablePayload(playRouteDeps, payload.table, payload.seats, payload.hand, {
          req,
          processAt: req.body?.asOf,
        }),
        { requestId }
      );
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_CLOSE_FAILED',
        err?.message || 'Unable to close the poker table.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/admin/series/:seriesId/close', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = closeTournamentSeries(playRouteDeps, {
        seriesId: req.params.seriesId,
        reason: normalizeTrimmedString(req.body?.reason),
        actorLabel: 'operator',
        refundMode: req.body?.refundMode,
        asOf: req.body?.asOf,
      });
      for (const entry of Array.isArray(payload?.newlyClosedTables) ? payload.newlyClosedTables : []) {
        publishPokerPlayTableEvent(entry?.tableId || '', 'series_close', {
          seriesId: payload?.series?.seriesId || req.params.seriesId,
          refundMode: entry?.refundSummary?.refundMode || null,
          refundedSeatCount: Number(entry?.refundSummary?.refundedSeatCount || 0),
          refundedTotalOil: Number(entry?.refundSummary?.refundedTotalOil || 0),
        });
      }
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_SERIES_CLOSE_FAILED',
        err?.message || 'Unable to close the poker tournament series.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/admin/series/:seriesId/registration/close', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = closeTournamentRegistration(playRouteDeps, {
        seriesId: req.params.seriesId,
        reason: normalizeTrimmedString(req.body?.reason),
        actorLabel: 'operator',
        asOf: req.body?.asOf,
      });
      for (const tableId of Array.isArray(payload?.series?.tableIds) ? payload.series.tableIds : []) {
        publishPokerPlayTableEvent(tableId, 'series_registration_close', {
          seriesId: payload?.series?.seriesId || req.params.seriesId,
          registrationClosedByDirectorAt: payload?.tables?.[0]?.table?.summary?.registrationClosedByDirectorAt || req.body?.asOf || nowIso(),
        });
      }
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_SERIES_REGISTRATION_CLOSE_FAILED',
        err?.message || 'Unable to close tournament registration.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/admin/series/:seriesId/move-seat', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = moveTournamentDirectorSeat(playRouteDeps, {
        seriesId: req.params.seriesId,
        sourceTableId: normalizeTrimmedString(req.body?.sourceTableId),
        seatNumber: req.body?.seatNumber,
        targetTableId: normalizeTrimmedString(req.body?.targetTableId),
        targetSeatNumber: req.body?.targetSeatNumber,
        reason: normalizeTrimmedString(req.body?.reason),
        actorLabel: 'operator',
        asOf: req.body?.asOf,
      });
      for (const tableId of Array.isArray(payload?.series?.tableIds) ? payload.series.tableIds : []) {
        publishPokerPlayTableEvent(tableId, 'series_move_seat', {
          seriesId: payload?.series?.seriesId || req.params.seriesId,
        });
      }
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_SERIES_MOVE_SEAT_FAILED',
        err?.message || 'Unable to move the tournament seat.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/admin/series/:seriesId/rebalance', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = rebalanceTournamentSeriesByDirector(playRouteDeps, {
        seriesId: req.params.seriesId,
        reason: normalizeTrimmedString(req.body?.reason),
        actorLabel: 'operator',
        asOf: req.body?.asOf,
      });
      for (const tableId of Array.isArray(payload?.series?.tableIds) ? payload.series.tableIds : []) {
        publishPokerPlayTableEvent(tableId, 'series_rebalance', {
          seriesId: payload?.series?.seriesId || req.params.seriesId,
        });
      }
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_SERIES_REBALANCE_FAILED',
        err?.message || 'Unable to rebalance the tournament series.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/admin/series/:seriesId/break-table', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = breakTournamentSeriesTableByDirector(playRouteDeps, {
        seriesId: req.params.seriesId,
        tableId: normalizeTrimmedString(req.body?.tableId),
        reason: normalizeTrimmedString(req.body?.reason),
        actorLabel: 'operator',
        asOf: req.body?.asOf,
      });
      for (const tableId of Array.isArray(payload?.series?.tableIds) ? payload.series.tableIds : []) {
        publishPokerPlayTableEvent(tableId, 'series_break_table', {
          seriesId: payload?.series?.seriesId || req.params.seriesId,
        });
      }
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_SERIES_BREAK_TABLE_FAILED',
        err?.message || 'Unable to break the tournament table.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/admin/tables/:tableId/start', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = startTournamentTableByDirector(playRouteDeps, {
        tableId: req.params.tableId,
        reason: normalizeTrimmedString(req.body?.reason),
        actorLabel: 'operator',
        asOf: req.body?.asOf,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || req.params.tableId, 'director_start', {
        handId: payload?.hand?.handId || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_TABLE_START_FAILED',
        err?.message || 'Unable to start the tournament table.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/admin/tables/:tableId/review', (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = buildPokerPlayAdminReviewPayload(playRouteDeps, {
        tableId: req.params.tableId,
        processAt: req.query?.asOf,
        handId: req.query?.handId,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_REVIEW_FAILED',
        err?.message || 'Unable to load poker table review.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/admin/tables/:tableId/export', (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = buildPokerPlayAdminExportPayload(playRouteDeps, {
        tableId: req.params.tableId,
        processAt: req.query?.asOf,
        handId: req.query?.handId,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_EXPORT_FAILED',
        err?.message || 'Unable to export poker review data.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/admin/series/:seriesId/review', (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = buildPokerPlayAdminSeriesReviewPayload(playRouteDeps, {
        seriesId: req.params.seriesId,
        processAt: req.query?.asOf,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_SERIES_REVIEW_FAILED',
        err?.message || 'Unable to load poker tournament series review.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/admin/series/:seriesId/export', (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = buildPokerPlayAdminSeriesExportPayload(playRouteDeps, {
        seriesId: req.params.seriesId,
        processAt: req.query?.asOf,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_SERIES_EXPORT_FAILED',
        err?.message || 'Unable to export poker tournament series review data.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/admin/disputes/:disputeId/resolve', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const result = resolveHandDispute(playRouteDeps, {
        disputeId: req.params.disputeId,
        body: req.body,
        processAt: req.body?.asOf,
      });
      publishPokerPlayTableEvent(result?.review?.table?.tableId || '', 'review', {
        disputeId: result?.dispute?.disputeId || req.params.disputeId,
        handId: result?.dispute?.handId || null,
        status: result?.dispute?.status || null,
      });
      return sendPortalApiSuccess(res, result.review, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_DISPUTE_RESOLUTION_FAILED',
        err?.message || 'Unable to resolve the poker dispute.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/tables/:tableId/sit', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = seatIntoTable(playRouteDeps, {
        tableId: req.params.tableId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || req.params.tableId, 'seat', {
        handId: payload?.hand?.handId || null,
        seatNumber: payload?.mySeat?.seatNumber || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_SIT_FAILED',
        err?.message || 'Unable to join the poker table.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/series/:seriesId/reenter', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = reenterTournamentSeries(playRouteDeps, {
        seriesId: req.params.seriesId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || '', 'reentry', {
        handId: payload?.hand?.handId || null,
        seatNumber: payload?.mySeat?.seatNumber || null,
        seriesId: payload?.series?.seriesId || req.params.seriesId,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_REENTRY_FAILED',
        err?.message || 'Unable to re-enter the poker tournament.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/tables/:tableId/reload', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = reloadTableSeat(playRouteDeps, {
        tableId: req.params.tableId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || req.params.tableId, 'reload', {
        handId: payload?.hand?.handId || null,
        seatNumber: payload?.mySeat?.seatNumber || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_RELOAD_FAILED',
        err?.message || 'Unable to reload the poker seat.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/tables/:tableId/sit-out', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = sitOutTableSeat(playRouteDeps, {
        tableId: req.params.tableId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || req.params.tableId, 'seat', {
        handId: payload?.hand?.handId || null,
        seatNumber: payload?.mySeat?.seatNumber || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_SIT_OUT_FAILED',
        err?.message || 'Unable to sit out from the poker table.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/tables/:tableId/return', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = returnTableSeat(playRouteDeps, {
        tableId: req.params.tableId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || req.params.tableId, 'seat', {
        handId: payload?.hand?.handId || null,
        seatNumber: payload?.mySeat?.seatNumber || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_RETURN_FAILED',
        err?.message || 'Unable to return to the poker table.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/tables/:tableId/waitlist', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = joinTableWaitlist(playRouteDeps, {
        tableId: req.params.tableId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || req.params.tableId, 'waitlist', {
        handId: payload?.hand?.handId || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_WAITLIST_JOIN_FAILED',
        err?.message || 'Unable to join the poker waitlist.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.delete('/api/poker/play/tables/:tableId/waitlist', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = leaveTableWaitlist(playRouteDeps, {
        tableId: req.params.tableId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || req.params.tableId, 'waitlist', {
        handId: payload?.hand?.handId || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_WAITLIST_LEAVE_FAILED',
        err?.message || 'Unable to leave the poker waitlist.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/tables/:tableId/leave', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = leaveTable(playRouteDeps, {
        tableId: req.params.tableId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || req.params.tableId, 'leave', {
        handId: payload?.hand?.handId || null,
        seatNumber: payload?.mySeat?.seatNumber || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_LEAVE_FAILED',
        err?.message || 'Unable to leave the poker table.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/hands/:handId/messages', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = postMessage(playRouteDeps, {
        handId: req.params.handId,
        session,
        req,
        body: req.body,
      });
      const hand = getPokerPlayHandById(req.params.handId);
      publishPokerPlayTableEvent(hand?.tableId || '', 'message', {
        handId: payload?.handId || req.params.handId,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_MESSAGE_FAILED',
        err?.message || 'Unable to post the poker discussion note.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/hands/:handId/proposals', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = postSeatAgentProposal(playRouteDeps, {
        handId: req.params.handId,
        session,
        req,
        body: req.body,
      });
      const hand = getPokerPlayHandById(req.params.handId);
      publishPokerPlayTableEvent(hand?.tableId || '', 'proposal', {
        handId: payload?.proposal?.handId || req.params.handId,
        seatNumber: payload?.proposal?.seatNumber || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_PROPOSAL_FAILED',
        err?.message || 'Unable to persist the worker poker proposal.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/hands/:handId/disputes', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = openHandDispute(playRouteDeps, {
        handId: req.params.handId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || getPokerPlayHandById(req.params.handId)?.tableId || '', 'review', {
        handId: payload?.hand?.handId || req.params.handId,
        openDisputeCount: Number(payload?.review?.openDisputeCount || 0),
        tableStatus: payload?.table?.status || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_DISPUTE_OPEN_FAILED',
        err?.message || 'Unable to flag the poker hand for review.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/hands/:handId/actions', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = postAction(playRouteDeps, {
        handId: req.params.handId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || getPokerPlayHandById(req.params.handId)?.tableId || '', 'action', {
        handId: payload?.hand?.handId || req.params.handId,
        actingSeat: payload?.hand?.actingSeat || null,
        handNumber: payload?.hand?.handNumber || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_ACTION_FAILED',
        err?.message || 'Unable to submit the poker action.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/hands/:handId/timebank', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = useTimeBank(playRouteDeps, {
        handId: req.params.handId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || getPokerPlayHandById(req.params.handId)?.tableId || '', 'timebank', {
        handId: payload?.hand?.handId || req.params.handId,
        actingSeat: payload?.hand?.actingSeat || null,
        remainingSeconds: Number(payload?.hand?.timeBankRemainingSeconds || 0),
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_TIME_BANK_FAILED',
        err?.message || 'Unable to use poker time bank.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/centaur/tournaments', async (req, res) => {
    const requestId = buildPortalRequestId();
    const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
    const walletBinding = session ? resolvePrimaryWalletSubject(session, req) : null;
    const verification = walletBinding?.walletSubject ? getStreamflowVerificationByWalletSubject(walletBinding.walletSubject) : null;
    const atIso = normalizeIsoOrNull(req.query?.asOf) || nowIso();
    let currentHourSnapshots = buildCurrentHourSnapshotState(null, [], atIso);
    if (verification) {
      await processOilSnapshotsForVerification(routeDeps, verification, { asOf: req.query?.asOf });
      const latestVerification = getStreamflowVerificationById(verification.verificationId) || verification;
      const snapshotEvents = listOilSnapshotEventsByVerificationAndHour(latestVerification.verificationId, toHourBucketStart(atIso));
      currentHourSnapshots = buildCurrentHourSnapshotState(latestVerification, snapshotEvents, atIso);
    }
    const balance = walletBinding?.walletSubject ? computeOilBalance(walletBinding.walletSubject) : null;
    const items = listCentaurTournaments().map((tournament) => {
      const entry = walletBinding?.walletSubject
        ? getCentaurEntryByWalletSubject(tournament.tournamentId, walletBinding.walletSubject)
        : null;
      return {
        ...tournament,
        currentUser: {
          walletSubject: walletBinding?.walletSubject || null,
          verified: !!verification,
          oilBalance: balance?.balance ?? 0,
          joined: !!entry,
          entryId: entry?.entryId || null,
        },
      };
    });
    return sendPortalApiSuccess(res, {
      items,
      houseId: getSessionHouseId(session),
      wallet: walletBinding?.submitterWallet || null,
      verification: verification ? (getStreamflowVerificationById(verification.verificationId) || verification) : null,
      oilBalance: balance,
      currentHourSnapshots,
    }, { requestId });
  });

  app.get('/api/poker/centaur/tournaments/:tournamentId', async (req, res) => {
    const requestId = buildPortalRequestId();
    const tournament = getCentaurTournamentById(req.params.tournamentId);
    if (!tournament) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Centaur tournament not found.', { requestId });
    }
    const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
    return sendCentaurTournamentSuccess(routeDeps, res, requestId, tournament, session, req, { processAt: req.query?.asOf });
  });

  app.get('/api/poker/streamflow/nonce', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const walletBinding = resolvePrimaryWalletSubject(session, req);
    if (!walletBinding?.walletSubject || walletBinding.submitterWallet?.chain !== 'solana') {
      return sendPortalApiError(res, 409, 'SOLANA_WALLET_REQUIRED', 'A bound Solana wallet is required before Streamflow verification.', { requestId });
    }
    const houseId = getSessionHouseId(session);
    if (!houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Join a house before verifying a Streamflow lock.', { requestId });
    }
    const tournament = normalizeTrimmedString(req.query?.tournamentId)
      ? getCentaurTournamentById(normalizeTrimmedString(req.query.tournamentId))
      : null;
    const streamId = normalizeTrimmedString(
      req.query?.streamId,
      normalizeTrimmedString(tournament?.rules?.streamId, 'agenttown-streamflow-lock')
    );
    const minLockAmountAtomic = normalizeTrimmedString(
      req.query?.minLockAmountAtomic,
      normalizeTrimmedString(tournament?.requiredLockAmountAtomic, '0')
    );
    const nonce = `sfvnonce_${randomHex(12)}`;
    const message = buildStreamflowLockVerifyMessage({
      address: walletBinding.submitterWallet.address,
      houseId,
      streamId,
      minLockAmountAtomic,
      nonce,
      origin: normalizeTrimmedString(req.get('origin') || req.get('host')),
    });
    session.centaurPoker = session.centaurPoker || {};
    session.centaurPoker.streamflowVerify = {
      nonce,
      streamId,
      minLockAmountAtomic,
      houseId,
      address: walletBinding.submitterWallet.address,
      issuedAt: nowIso(),
      message,
    };
    return sendPortalApiSuccess(res, {
      provider: STREAMFLOW_PROVIDER,
      tokenSymbol: STREAMFLOW_TOKEN_SYMBOL,
      chain: 'solana',
      address: walletBinding.submitterWallet.address,
      houseId,
      streamId,
      minLockAmountAtomic,
      nonce,
      message,
    }, { requestId });
  });

  const handleStreamflowChallenge = (req, res) => {
    req.query = {
      ...req.query,
      streamId: req.body?.streamId,
      minLockAmountAtomic: req.body?.minLockAmountAtomic,
      tournamentId: req.body?.tournamentId,
    };
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const walletBinding = resolvePrimaryWalletSubject(session, req);
    if (!walletBinding?.walletSubject || walletBinding.submitterWallet?.chain !== 'solana') {
      return sendPortalApiError(res, 409, 'SOLANA_WALLET_REQUIRED', 'A bound Solana wallet is required before Streamflow verification.', { requestId });
    }
    const houseId = getSessionHouseId(session);
    if (!houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Join a house before verifying a Streamflow lock.', { requestId });
    }
    const tournament = normalizeTrimmedString(req.body?.tournamentId)
      ? getCentaurTournamentById(normalizeTrimmedString(req.body.tournamentId))
      : null;
    const streamId = normalizeTrimmedString(
      req.body?.streamId,
      normalizeTrimmedString(tournament?.rules?.streamId, 'agenttown-streamflow-lock')
    );
    const minLockAmountAtomic = normalizeTrimmedString(
      req.body?.minLockAmountAtomic,
      normalizeTrimmedString(tournament?.requiredLockAmountAtomic, '0')
    );
    const nonce = `sfvnonce_${randomHex(12)}`;
    const message = buildStreamflowLockVerifyMessage({
      address: walletBinding.submitterWallet.address,
      houseId,
      streamId,
      minLockAmountAtomic,
      nonce,
      origin: normalizeTrimmedString(req.get('origin') || req.get('host')),
    });
    session.centaurPoker = session.centaurPoker || {};
    session.centaurPoker.streamflowVerify = {
      nonce,
      streamId,
      minLockAmountAtomic,
      houseId,
      address: walletBinding.submitterWallet.address,
      issuedAt: nowIso(),
      message,
    };
    return sendPortalApiSuccess(res, {
      challenge: {
        provider: STREAMFLOW_PROVIDER,
        tokenSymbol: STREAMFLOW_TOKEN_SYMBOL,
        chain: 'solana',
        address: walletBinding.submitterWallet.address,
        houseId,
        streamId,
        minLockAmountAtomic,
        nonce,
        message,
      },
    }, { requestId });
  };

  app.post(['/api/poker/streamflow/challenge', '/api/oil/streamflow/challenge'], express.json({ limit: '128kb' }), handleStreamflowChallenge);

  const handleStreamflowVerify = async (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const walletBinding = resolvePrimaryWalletSubject(session, req);
    if (!walletBinding?.walletSubject || walletBinding.submitterWallet?.chain !== 'solana') {
      return sendPortalApiError(res, 409, 'SOLANA_WALLET_REQUIRED', 'A bound Solana wallet is required before Streamflow verification.', { requestId });
    }
    const houseId = getSessionHouseId(session);
    if (!houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Join a house before verifying a Streamflow lock.', { requestId });
    }

    const pending = session.centaurPoker?.streamflowVerify || null;
    const nonce = normalizeTrimmedString(req.body?.nonce);
    const streamId = normalizeTrimmedString(req.body?.streamId, normalizeTrimmedString(pending?.streamId));
    const minLockAmountAtomic = normalizeTrimmedString(req.body?.minLockAmountAtomic, normalizeTrimmedString(pending?.minLockAmountAtomic));
    const signature = normalizeTrimmedString(req.body?.signature);
    if (!pending || !nonce || nonce !== pending.nonce || !streamId || !minLockAmountAtomic || !signature) {
      return sendPortalApiError(res, 400, 'STREAMFLOW_VERIFY_CONTEXT_REQUIRED', 'Fetch a fresh Streamflow verification nonce before signing.', { requestId });
    }
    const issuedAtMs = Date.parse(String(pending.issuedAt || ''));
    if (!Number.isFinite(issuedAtMs) || (Date.now() - issuedAtMs) > STREAMFLOW_VERIFY_NONCE_TTL_MS) {
      return sendPortalApiError(res, 409, 'STREAMFLOW_VERIFY_NONCE_EXPIRED', 'The Streamflow verification nonce expired. Request a new one.', { requestId });
    }

    const address = walletBinding.submitterWallet.address;
    if (pending.address !== address || pending.houseId !== houseId) {
      return sendPortalApiError(res, 409, 'STREAMFLOW_VERIFY_CONTEXT_CHANGED', 'Wallet or house changed before verification completed.', { requestId });
    }
    const message = buildStreamflowLockVerifyMessage({
      address,
      houseId,
      streamId,
      minLockAmountAtomic,
      nonce,
      origin: normalizeTrimmedString(req.get('origin') || req.get('host')),
    });
    const verifyAt = normalizeIsoOrNull(req.body?.asOf) || nowIso();
    if (pending.message !== message) {
      return sendPortalApiError(res, 409, 'STREAMFLOW_VERIFY_CONTEXT_CHANGED', 'Verification message changed. Request a new nonce.', { requestId });
    }

    if (!isTestMockAddress(address) && !verifySolanaSignature(address, message, signature)) {
      return sendPortalApiError(res, 401, 'STREAMFLOW_SIGNATURE_INVALID', 'Wallet signature could not be verified.', { requestId });
    }

    const providerStatus = await resolveStreamflowLockStatus({
      address,
      streamId,
      minLockAmountAtomic,
      atIso: verifyAt,
    });
    if (!providerStatus.ok || !providerStatus.eligible) {
      return sendPortalApiError(
        res,
        409,
        providerStatus.code || 'STREAMFLOW_LOCK_INELIGIBLE',
        providerStatus.locked ? 'Streamflow lock amount is below the required minimum.' : 'No eligible Streamflow lock was found for this wallet.',
        { requestId, details: providerStatus }
      );
    }

    const existingStake = getStreamflowVerificationByProviderAndStream(STREAMFLOW_PROVIDER, streamId);
    if (existingStake && (
      existingStake.walletSubject !== walletBinding.walletSubject
      || normalizeTrimmedString(existingStake.houseId) !== houseId
    )) {
      return sendPortalApiError(
        res,
        409,
        'STREAMFLOW_STAKE_ALREADY_CLAIMED',
        'This Streamflow stake is already bound to a different house.',
        {
          requestId,
          details: {
            verificationId: existingStake.verificationId,
            houseId: existingStake.houseId || null,
          },
        }
      );
    }

    const existingWallet = getStreamflowVerificationByWalletSubject(walletBinding.walletSubject);
    if (existingWallet && normalizeTrimmedString(existingWallet.houseId) && normalizeTrimmedString(existingWallet.houseId) !== houseId) {
      return sendPortalApiError(
        res,
        409,
        'STREAMFLOW_WALLET_ALREADY_BOUND',
        'This staked wallet is already bound to a different house for OIL accrual.',
        {
          requestId,
          details: {
            verificationId: existingWallet.verificationId,
            houseId: existingWallet.houseId || null,
          },
        }
      );
    }
    if (existingWallet && existingWallet.streamId && existingWallet.streamId !== streamId) {
      return sendPortalApiError(
        res,
        409,
        'STREAMFLOW_WALLET_ALREADY_VERIFIED',
        'This wallet already has an active verified Streamflow stake.',
        {
          requestId,
          details: {
            verificationId: existingWallet.verificationId,
            streamId: existingWallet.streamId,
            houseId: existingWallet.houseId || null,
          },
        }
      );
    }

    const existing = getStreamflowVerificationByWalletAndStream(walletBinding.walletSubject, STREAMFLOW_PROVIDER, streamId)
      || existingWallet;
    const verification = upsertStreamflowVerification({
      verificationId: existing?.verificationId || `sfv_${randomHex(10)}`,
      portalSessionId: session.sessionId,
      houseId,
      walletSubject: walletBinding.walletSubject,
      chain: 'solana',
      address,
      provider: STREAMFLOW_PROVIDER,
      streamId,
      minLockAmountAtomic,
      verifiedAmountAtomic: String(providerStatus.lockedAmountAtomic || '0'),
      tokenSymbol: STREAMFLOW_TOKEN_SYMBOL,
      signatureMessage: message,
      status: 'verified',
      verifiedAt: verifyAt,
      lastCheckedAt: providerStatus.checkedAt || verifyAt,
      raw: {
        ...(existing?.raw || {}),
        latestProviderStatus: providerStatus,
        snapshotsPerHour: DEFAULT_SNAPSHOTS_PER_HOUR,
      },
    });
    session.centaurPoker.streamflowVerify = null;
    const processed = await processOilSnapshotsForVerification(routeDeps, verification, { asOf: req.body?.asOf });
    return sendPortalApiSuccess(res, {
      verification: getStreamflowVerificationById(verification.verificationId),
      oilBalance: computeOilBalance(walletBinding.walletSubject),
      processed,
    }, { requestId });
  };

  app.post(['/api/poker/streamflow/verify', '/api/oil/streamflow/verify'], express.json({ limit: '128kb' }), handleStreamflowVerify);

  const handleOilBalance = async (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const walletBinding = resolvePrimaryWalletSubject(session, req);
    if (!walletBinding?.walletSubject) {
      return sendPortalApiError(res, 409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before reading OIL balance.', { requestId });
    }
    const verification = getStreamflowVerificationByWalletSubject(walletBinding.walletSubject);
    if (verification) {
      await processOilSnapshotsForVerification(routeDeps, verification, { asOf: req.query?.asOf });
    }
    const latestVerification = verification ? getStreamflowVerificationById(verification.verificationId) : null;
    const balance = computeOilBalance(walletBinding.walletSubject);
    const hourBucket = toHourBucketStart(req.query?.asOf || nowIso());
    const snapshotEvents = latestVerification
      ? listOilSnapshotEventsByVerificationAndHour(latestVerification.verificationId, hourBucket)
      : [];
    const ledgerEntries = listOilLedgerEntriesByWalletSubject(walletBinding.walletSubject, { limit: 25 });
    return sendPortalApiSuccess(res, {
      walletSubject: walletBinding.walletSubject,
      verification: latestVerification,
      oilBalance: balance,
      snapshotEvents,
      ledgerEntries,
    }, { requestId });
  };

  app.get(['/api/poker/oil/balance', '/api/oil/balance'], handleOilBalance);

  app.post('/api/poker/centaur/tournaments/:tournamentId/join', express.json({ limit: '128kb' }), async (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const tournament = getCentaurTournamentById(req.params.tournamentId);
    if (!tournament) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Centaur tournament not found.', { requestId });
    }
    const walletBinding = resolvePrimaryWalletSubject(session, req);
    if (!walletBinding?.walletSubject) {
      return sendPortalApiError(res, 409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before joining a centaur tournament.', { requestId });
    }
    const houseId = getSessionHouseId(session);
    if (!houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Join a house before entering a centaur tournament.', { requestId });
    }
    const verification = getStreamflowVerificationByWalletSubject(walletBinding.walletSubject);
    if (!verification) {
      return sendPortalApiError(res, 409, 'STREAMFLOW_VERIFICATION_REQUIRED', 'Verify a Streamflow lock before entering a centaur tournament.', { requestId });
    }
    await processOilSnapshotsForVerification(routeDeps, verification, { asOf: req.body?.asOf });
    const wagerOil = Math.max(
      normalizeOilAmount(req.body?.wagerOil, tournament.buyInOil),
      normalizeOilAmount(tournament.buyInOil, 0)
    );
    const oilBalance = computeOilBalance(walletBinding.walletSubject);
    if (oilBalance.balance < wagerOil) {
      return sendPortalApiError(res, 409, 'OIL_BALANCE_TOO_LOW', 'Not enough OIL balance to cover the tournament buy-in.', {
        requestId,
        details: {
          requiredOil: wagerOil,
          balance: oilBalance.balance,
        },
      });
    }

    const existingEntry = getCentaurEntryByWalletSubject(tournament.tournamentId, walletBinding.walletSubject);
    if (existingEntry) {
      return sendCentaurTournamentSuccess(routeDeps, res, requestId, tournament, session, req, { processAt: req.body?.asOf });
    }

    const displayName = normalizeCentaurDisplayName(
      req.body?.displayName,
      normalizeCentaurDisplayName(session?.agent?.name || houseId || walletBinding.walletSubject.slice(0, 8))
    );
    const entry = upsertCentaurEntry({
      entryId: `pkentry_${randomHex(10)}`,
      tournamentId: tournament.tournamentId,
      portalSessionId: session.sessionId,
      houseId,
      walletSubject: walletBinding.walletSubject,
      displayName,
      status: 'active',
      wagerOil,
      streamflowVerificationId: verification.verificationId,
    });
    createOilLedgerEntry({
      walletSubject: walletBinding.walletSubject,
      houseId,
      verificationId: verification.verificationId,
      tournamentId: tournament.tournamentId,
      entryId: entry.entryId,
      entryKind: 'centaur_buy_in',
      direction: 'debit',
      amount: wagerOil,
      memo: `Centaur tournament buy-in for ${tournament.title}`,
    });
    const hand = upsertCentaurHand({
      handId: `pkhand_${randomHex(10)}`,
      tournamentId: tournament.tournamentId,
      entryId: entry.entryId,
      handNumber: 1,
      phase: 'turn',
      status: 'live',
      decisionExpiresAt: new Date(Date.now() + (DEFAULT_CENTAUR_COUNTDOWN_SECONDS * 1000)).toISOString(),
      tableState: buildCentaurHandForEntry({ tournament, entry, nowIso: nowIso() }),
    });
    createCentaurMessage({
      tournamentId: tournament.tournamentId,
      entryId: entry.entryId,
      handId: hand.handId,
      authorRole: 'system',
      body: `Clock live. ${DEFAULT_CENTAUR_COUNTDOWN_SECONDS}s to align on the first move with your agent partner.`,
    });
    const suggestion = deriveCentaurAgentSuggestion(hand.tableState);
    createCentaurMessage({
      tournamentId: tournament.tournamentId,
      entryId: entry.entryId,
      handId: hand.handId,
      authorRole: 'agent',
      body: suggestion.body,
    });
    return sendCentaurTournamentSuccess(routeDeps, res, requestId, tournament, session, req, { processAt: req.body?.asOf });
  });

  app.post('/api/poker/centaur/hands/:handId/messages', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const walletBinding = resolvePrimaryWalletSubject(session, req);
    if (!walletBinding?.walletSubject) {
      return sendPortalApiError(res, 409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before posting a centaur message.', { requestId });
    }
    const hand = getCentaurHandById(req.params.handId);
    const entry = hand ? getCentaurEntryById(hand.entryId) : null;
    if (!ensureCentaurOwnership({ entry, hand, session, walletBinding, requestId, sendPortalApiError, res })) return;

    const body = normalizeCentaurMessageBody(req.body?.body);
    if (!body) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'Message body is required.', { requestId });
    }

    const humanMessage = createCentaurMessage({
      tournamentId: entry.tournamentId,
      entryId: entry.entryId,
      handId: hand.handId,
      authorRole: 'human',
      body,
    });
    const suggestion = deriveCentaurAgentSuggestion(hand.tableState);
    const agentMessage = createCentaurMessage({
      tournamentId: entry.tournamentId,
      entryId: entry.entryId,
      handId: hand.handId,
      authorRole: 'agent',
      body: suggestion.body,
    });
    return sendPortalApiSuccess(res, {
      handId: hand.handId,
      messages: [humanMessage, agentMessage],
      suggestion,
    }, { requestId });
  });

  app.post('/api/poker/centaur/hands/:handId/actions', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const walletBinding = resolvePrimaryWalletSubject(session, req);
    if (!walletBinding?.walletSubject) {
      return sendPortalApiError(res, 409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before taking a centaur action.', { requestId });
    }
    const hand = getCentaurHandById(req.params.handId);
    const entry = hand ? getCentaurEntryById(hand.entryId) : null;
    const owned = ensureCentaurOwnership({ entry, hand, session, walletBinding, requestId, sendPortalApiError, res });
    if (!owned) return;

    const expiresAtMs = Date.parse(String(hand.decisionExpiresAt || ''));
    if (Number.isFinite(expiresAtMs) && Date.now() > expiresAtMs) {
      return sendPortalApiError(res, 409, 'CENTAUR_CLOCK_EXPIRED', 'The decision clock expired for this hand.', { requestId });
    }

    const actionKind = normalizeTrimmedString(req.body?.actionKind).toLowerCase();
    const requestedAmountOil = normalizeOilAmount(req.body?.amountOil, 0);
    let outcome;
    try {
      outcome = applyCentaurActionToTableState(hand.tableState, {
        actionKind,
        amountOil: requestedAmountOil,
      });
    } catch (err) {
      return sendPortalApiError(
        res,
        err?.code === 'POKER_CENTAUR_STACK_INSUFFICIENT' ? 409 : 400,
        err?.code || 'POKER_CENTAUR_ACTION_INVALID',
        err?.code === 'POKER_CENTAUR_STACK_INSUFFICIENT'
          ? 'The requested action needs more table stack than this entry has.'
          : 'This action is not valid for the current centaur hand.',
        {
          requestId,
          details: {
            requiredOil: err?.requiredOil,
            stackOil: err?.stackOil,
          },
        }
      );
    }

    const oilBalance = computeOilBalance(entry.walletSubject);
    if (outcome.debitOil > oilBalance.balance) {
      return sendPortalApiError(res, 409, 'OIL_BALANCE_TOO_LOW', 'Not enough OIL balance to cover this centaur action.', {
        requestId,
        details: {
          requiredOil: outcome.debitOil,
          balance: oilBalance.balance,
        },
      });
    }

    const action = createCentaurAction({
      tournamentId: entry.tournamentId,
      entryId: entry.entryId,
      handId: hand.handId,
      actorRole: 'human',
      actionKind,
      amountOil: outcome.debitOil,
      payload: {
        requestedAmountOil,
      },
    });
    if (outcome.debitOil > 0) {
      createOilLedgerEntry({
        walletSubject: entry.walletSubject,
        houseId: entry.houseId || null,
        tournamentId: entry.tournamentId,
        entryId: entry.entryId,
        entryKind: 'centaur_action_wager',
        direction: 'debit',
        amount: outcome.debitOil,
        memo: `Centaur action ${actionKind}`,
      });
    }
    createCentaurMessage({
      tournamentId: entry.tournamentId,
      entryId: entry.entryId,
      handId: hand.handId,
      authorRole: 'human',
      body: `Commit: ${actionKind}${outcome.debitOil > 0 ? ` ${outcome.debitOil} OIL` : ''}.`,
    });
    const updatedHand = upsertCentaurHand({
      handId: hand.handId,
      tournamentId: hand.tournamentId,
      entryId: hand.entryId,
      handNumber: hand.handNumber,
      phase: hand.phase,
      status: 'submitted',
      decisionExpiresAt: null,
      tableState: outcome.tableState,
      createdAt: hand.createdAt,
      updatedAt: nowIso(),
    });
    const suggestion = deriveCentaurAgentSuggestion(updatedHand.tableState);
    createCentaurMessage({
      tournamentId: entry.tournamentId,
      entryId: entry.entryId,
      handId: hand.handId,
      authorRole: 'agent',
      body: `Move logged. ${suggestion.body}`,
    });
    return sendPortalApiSuccess(res, {
      hand: updatedHand,
      action,
      oilBalance: computeOilBalance(entry.walletSubject),
    }, { requestId });
  });

  app.post('/__test__/streamflow/locks/seed', express.json({ limit: '512kb' }), (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (req.header('x-test-reset') !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const snapshot = seedStreamflowFixtureState(req.body && typeof req.body === 'object' ? req.body : {});
    return res.json({ ok: true, snapshot });
  });

  app.post('/__test__/poker/play/harness', express.json({ limit: '256kb' }), (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (req.header('x-test-reset') !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    try {
      const seeded = seedPokerPlayHarnessScenario({
        scenario: req.body?.scenario,
        requestAt: normalizeIsoOrNull(req.body?.asOf) || nowIso(),
        tableId: req.body?.tableId,
        actors: req.body?.actors,
      });
      return res.json({
        ok: true,
        seeded,
      });
    } catch (err) {
      return res.status(Number(err?.status || 500)).json({
        ok: false,
        error: err?.code || 'POKER_PLAY_HARNESS_FAILED',
        message: err?.message || 'Unable to seed the poker play harness.',
        details: err?.details || {},
      });
    }
  });

  app.post('/__test__/poker/oil/process', express.json({ limit: '128kb' }), async (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (req.header('x-test-reset') !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

    const verificationId = normalizeTrimmedString(req.body?.verificationId);
    const walletSubject = normalizeTrimmedString(req.body?.walletSubject);
    const verification = verificationId
      ? getStreamflowVerificationById(verificationId)
      : walletSubject
        ? getStreamflowVerificationByWalletSubject(walletSubject)
        : null;
    if (!verification) {
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }
    const processed = await processOilSnapshotsForVerification(routeDeps, verification, { asOf: req.body?.asOf });
    return res.json({
      ok: true,
      verificationId: verification.verificationId,
      oilBalance: computeOilBalance(verification.walletSubject),
      processed,
    });
  });

  app.post('/__test__/poker/oil/fund', express.json({ limit: '64kb' }), (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (req.header('x-test-reset') !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const walletSubject = normalizeTrimmedString(req.body?.walletSubject);
    const houseId = normalizeTrimmedString(req.body?.houseId) || null;
    const amount = Math.max(0, normalizeOilAmount(req.body?.amount, 0));
    if (!walletSubject || amount <= 0) {
      return res.status(400).json({ ok: false, error: 'INVALID_ARGUMENT' });
    }
    createOilLedgerEntry({
      walletSubject,
      houseId,
      verificationId: null,
      entryKind: 'test_oil_funding',
      direction: 'credit',
      amount,
      memo: 'Test OIL funding',
    });
    return res.json({
      ok: true,
      oilBalance: computeOilBalance(walletSubject),
    });
  });

  app.post('/__test__/poker/oil/scheduler/run', express.json({ limit: '128kb' }), async (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (req.header('x-test-reset') !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const summary = await runOilSnapshotSweep(routeDeps, {
      asOf: req.body?.asOf,
      limit: req.body?.limit,
    });
    return res.json({
      ok: true,
      summary,
    });
  });

  app.post('/__test__/streamflow/locks/reset', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (req.header('x-test-reset') !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    resetStreamflowFixtureState();
    return res.json({ ok: true });
  });
}

module.exports = {
  registerPokerRoutes,
};
