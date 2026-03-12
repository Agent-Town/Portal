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
  createPokerTransportMemoryAdapter,
  POKER_PLAY_TRANSPORT_VERSION,
} = require('./poker_transport');
const {
  createPokerPubSubAdapter,
} = require('./poker_pubsub');
const {
  buildPokerPlayAdminReviewPayload,
  buildPokerPlayAdminExportPayload,
  buildPokerPlayIntegrityQueuePayload,
  buildPokerPlayLedgerReconciliationPayload,
  buildPokerPlayAdminTreasuryPayload,
  buildPokerPlayNativeSeasonLeaderboardPayload,
  buildPokerPlayOpsDashboardPayload,
  buildPokerPlayAdminSeriesExportPayload,
  buildPokerPlayAdminSeriesReviewPayload,
  buildPokerPlayTablePayload,
  buildPokerPlaySchedulePayload,
  POKER_PLAY_ROOM_TREASURY_WALLET_SUBJECT,
  breakTournamentSeriesTableByDirector,
  changeCashTableSeat,
  closeTournamentRegistration,
  closeTable,
  closeTournamentSeries,
  createTable,
  createRouteError,
  addTournamentAddon,
  createChopProposal,
  buildHandHistoryExport,
  buildHandHistoryExportNdjson,
  buildHandHistoryExportText,
  agreeToChopProposal,
  getHandHistory,
  getHandReview,
  getMyQualifiers,
  getMyResults,
  getPokerPlayPolicy,
  getSeriesTimeline,
  getSeriesDetail,
  getTableDetail,
  joinTableWaitlist,
  leaveTable,
  leaveTableWaitlist,
  listNotebook,
  listTables,
  matchmakeIntoTable,
  openHandDispute,
  pauseTable,
  postAction,
  postMessage,
  postSeatAgentProposal,
  rebalanceTournamentSeriesByDirector,
  reloadTableSeat,
  rebuyTournamentSeries,
  reenterTournamentSeries,
  returnTableSeat,
  reviewChopProposal,
  resolveHandDispute,
  resolveIntegrityFlag,
  resumeTable,
  seatIntoTable,
  saveNotebookEntry,
  sitOutTableSeat,
  startTournamentTableByDirector,
  moveTournamentDirectorSeat,
  syncPokerPlayTable,
  transferCashTableSeat,
  updatePokerPlayPolicy,
  updateAutoActPolicy,
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
    computeOilLedgerAmountByWalletSubject,
    computePokerArtifactSha256,
    createCentaurAction,
    createCentaurMessage,
    createOilLedgerEntry,
    createPokerPlayAuditEvent,
    createPokerPlayAction,
    createPokerPlayMessage,
    createPokerRebuyEvent,
    createPortalPokerOperatorClient,
    express,
    getActivePokerPlaySeatByWalletSubject,
    getCentaurEntryById,
    getCentaurEntryByWalletSubject,
    getCentaurHandById,
    getCentaurTournamentById,
    getCurrentCentaurHandForEntry,
    getCurrentPokerPlayHandForTable,
    getPokerChopProposalById,
    getLatestPokerLeaderboardSnapshot,
    getOilSnapshotEventByVerificationAndScheduledFor,
    getPokerOperatorServiceToken,
    getPokerPlayHandById,
    getPokerPlayDisputeById,
    getPokerPlayIntegrityFlagById,
    getPokerPlayPlayerStatById,
    getPokerPlayWalletPolicy,
    getPokerBlindObligationByTableAndWalletSubject,
    getOpenPokerPlayPlayerStatByTableAndWalletSubject,
    getPokerPlayerNotebookEntryById,
    getPokerPlaySeatByTableAndNumber,
    getPokerPlaySeatByWalletSubject,
    getPokerPlayTableById,
    getPokerSatelliteAwardById,
    getPokerSatelliteAwardBySourceAndWallet,
    getPokerTournamentWaitlistEntryByTableAndWalletSubject,
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
    listOilLedgerEntries,
    listOilLedgerEntriesByWalletSubject,
    listOilSnapshotEventsByVerificationAndHour,
    listPokerBlindObligationsByTable,
    listPokerChopProposalsBySeriesId,
    listPokerChopProposalsByTable,
    listPokerPlayActionsByHand,
    listPokerPlayAuditEventsByHand,
    listPokerPlayAuditEventsByTable,
    listPokerPlayDisputesByHand,
    listPokerPlayDisputesByTable,
    listPokerPlayDisputesByWalletSubject,
    listPokerPlayIntegrityFlags,
    listPokerPlayHandsByTable,
    listPokerPlayMessagesByHand,
    listPokerPlayerNotebookEntriesByWalletSubject,
    listPokerPlayPlayerStats,
    listPokerPlayPlayerStatsByWalletSubject,
    listPokerPlaySeatsByWalletSubject,
    listPokerPlaySeatsByTable,
    listPokerPlayTables,
    listPokerRebuyEventsBySeriesId,
    listPokerRebuyEventsByTable,
    listPokerSatelliteAwardsByTargetSeriesId,
    listPokerSatelliteAwardsByWalletSubject,
    listPokerTournamentWaitlistEntriesByTable,
    listPokerPlayWaitlistEntriesByTable,
    listPokerSeasons,
    normalizePortalIdempotencyKey,
    nowIso,
    randomHex,
    deletePokerBlindObligation,
    deletePokerPlayerNotebookEntry,
    deletePokerPlaySeat,
    deletePokerTournamentWaitlistEntry,
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
    upsertPokerBlindObligation,
    upsertPokerChopProposal,
    upsertPokerPlayHand,
    upsertPokerPlayDispute,
    upsertPokerPlayIntegrityFlag,
    upsertPokerPlaySeat,
    upsertPokerPlayerNotebookEntry,
    upsertPokerPlayPlayerStat,
    upsertPokerPlayWalletPolicy,
    upsertPokerPlayTable,
    upsertPokerSatelliteAward,
    upsertPokerTournamentWaitlistEntry,
    upsertPokerPlayWaitlistEntry,
    upsertPokerSeason,
    upsertPokerSubmission,
    upsertStreamflowVerification,
    verifySolanaSignature,
    WebSocketServer,
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
    listOilLedgerEntries,
    listOilSnapshotEventsByVerificationAndHour,
    nowIso,
    resolvePrimaryWalletSubject,
    sendPortalApiSuccess,
    upsertOilSnapshotEvent,
    upsertStreamflowVerification,
    getOilSnapshotEventByVerificationAndScheduledFor,
  };

  const playRouteDeps = {
    computeOilLedgerAmountByWalletSubject,
    computeOilBalance,
    createOilLedgerEntry,
    createPokerPlayAuditEvent,
    createPokerPlayAction,
    createPokerPlayMessage,
    createPokerRebuyEvent,
    deletePokerPlaySeat,
    getActivePokerPlaySeatByWalletSubject,
    getCurrentPokerPlayHandForTable,
    getPokerChopProposalById,
    getPokerPlayHandById,
    getPokerPlayDisputeById,
    getPokerPlayIntegrityFlagById,
    getPokerPlayPlayerStatById,
    getPokerPlayWalletPolicy,
    getPokerBlindObligationByTableAndWalletSubject,
    getOpenPokerPlayPlayerStatByTableAndWalletSubject,
    getPokerPlayerNotebookEntryById,
    getPokerPlaySeatByTableAndNumber,
    getPokerPlaySeatByWalletSubject,
    getPokerPlayTableById,
    getPokerSatelliteAwardById,
    getPokerSatelliteAwardBySourceAndWallet,
    getPokerTournamentWaitlistEntryByTableAndWalletSubject,
    getPokerPlayWaitlistEntryByTableAndWalletSubject,
    getStreamflowVerificationByWalletSubject,
    listOilLedgerEntries,
    listPokerBlindObligationsByTable,
    listPokerChopProposalsBySeriesId,
    listPokerChopProposalsByTable,
    listPokerPlayActionsByHand,
    listPokerPlayAuditEventsByHand,
    listPokerPlayAuditEventsByTable,
    listPokerPlayDisputesByHand,
    listPokerPlayDisputesByTable,
    listPokerPlayDisputesByWalletSubject,
    listPokerPlayIntegrityFlags,
    listPokerPlayHandsByTable,
    listPokerPlayMessagesByHand,
    listPokerPlayerNotebookEntriesByWalletSubject,
    listPokerPlayPlayerStats,
    listPokerPlayPlayerStatsByWalletSubject,
    listPokerPlaySeatsByWalletSubject,
    listPokerPlaySeatsByTable,
    listPokerPlayTables,
    listPokerRebuyEventsBySeriesId,
    listPokerRebuyEventsByTable,
    listPokerSatelliteAwardsByTargetSeriesId,
    listPokerSatelliteAwardsByWalletSubject,
    listPokerTournamentWaitlistEntriesByTable,
    listPokerPlayWaitlistEntriesByTable,
    nowIso,
    randomHex,
    resolvePrimaryWalletSubject,
    deletePokerBlindObligation,
    deletePokerPlayerNotebookEntry,
    upsertPokerPlayHand,
    upsertPokerPlayDispute,
    upsertPokerPlayIntegrityFlag,
    upsertPokerPlayerNotebookEntry,
    upsertPokerPlaySeat,
    upsertPokerPlayPlayerStat,
    upsertPokerPlayWalletPolicy,
    upsertPokerBlindObligation,
    upsertPokerChopProposal,
    upsertPokerPlayTable,
    upsertPokerSatelliteAward,
    upsertPokerTournamentWaitlistEntry,
    upsertPokerPlayWaitlistEntry,
  };

  const pokerPlayStreamClientsByTable = new Map();
  const pokerPlayStreamClientsBySeries = new Map();
  const pokerPlayTransport = createPokerTransportMemoryAdapter({ nowIso });
  const pokerPlayPubSub = createPokerPubSubAdapter({
    kind: process.env.POKER_PLAY_PUBSUB_ADAPTER,
    nowIso,
  });
  const pokerPlayTransportWss = WebSocketServer ? new WebSocketServer({ noServer: true }) : null;
  let pokerPlayStreamEventCounter = 0;

  function normalizePokerPlayTransportChannelKind(value) {
    const kind = normalizeTrimmedString(value).toLowerCase();
    if (kind === 'table' || kind === 'series') return kind;
    return '';
  }

  function buildPokerPlayPubSubTopic(channelKind, channelId) {
    const kind = normalizePokerPlayTransportChannelKind(channelKind);
    const id = normalizeTrimmedString(channelId);
    if (!kind || !id) return '';
    return `poker-play:${kind}:${id}`;
  }

  function createWebSocketRequestFacade(req) {
    const url = new URL(String(req.url || '/'), 'http://localhost');
    const query = {};
    for (const [key, value] of url.searchParams.entries()) {
      query[key] = value;
    }
    return {
      ...req,
      query,
      params: {},
      path: url.pathname,
      header(name) {
        return req.headers[String(name || '').toLowerCase()];
      },
    };
  }

  function createWebSocketResponseFacade() {
    const headers = new Map();
    return {
      setHeader(name, value) {
        headers.set(String(name || '').toLowerCase(), value);
      },
      getHeader(name) {
        return headers.get(String(name || '').toLowerCase());
      },
    };
  }

  function buildPokerPlayTransportSnapshot({ channelKind, channelId, viewerMode, req }) {
    const request = createWebSocketRequestFacade(req);
    if (channelKind === 'table') {
      if (viewerMode === 'player') {
        const response = createWebSocketResponseFacade();
        const session = resolveHumanSessionWithRecovery(request, response, { allowCreate: false });
        if (!session) {
          throw createRouteError(401, 'SESSION_REQUIRED', 'A live player session is required for this poker transport channel.');
        }
        return getTableDetail(playRouteDeps, {
          tableId: channelId,
          session,
          req: request,
        });
      }
      return getTableDetail(playRouteDeps, {
        tableId: channelId,
        session: null,
        req: request,
        publicViewer: true,
      });
    }
    if (channelKind === 'series') {
      return getSeriesDetail(playRouteDeps, {
        seriesId: channelId,
        session: null,
        req: request,
        publicViewer: true,
      });
    }
    throw createRouteError(404, 'NOT_FOUND', 'Poker live transport channel not found.');
  }

  function sendPokerPlayTransportMessage(socket, envelope) {
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify(envelope || {}));
  }

  function closePokerPlayWebSocket(socket, code, reason) {
    if (!socket) return;
    try {
      socket.close(code, reason);
    } catch {
      try {
        socket.terminate();
      } catch {
        // no-op
      }
    }
  }

  function normalizePokerPlayTransportViewerMode(value) {
    const viewerMode = normalizeTrimmedString(value, 'player').toLowerCase();
    if (viewerMode === 'rail') return 'rail';
    return 'player';
  }

  function handlePokerPlayTransportConnection(socket, req) {
    const request = createWebSocketRequestFacade(req);
    const channelKind = normalizePokerPlayTransportChannelKind(request.query?.channelKind);
    const channelId = normalizeTrimmedString(request.query?.channelId);
    const viewerMode = normalizePokerPlayTransportViewerMode(request.query?.viewer);
    const subscriberId = normalizeTrimmedString(
      request.query?.subscriberId,
      `ws:${channelKind || 'unknown'}:${channelId || 'unknown'}:${randomHex(8)}`
    );
    const lastSeenVersionRaw = request.query?.lastSeenVersion;
    if (!channelKind || !channelId) {
      sendPokerPlayTransportMessage(socket, {
        transportVersion: POKER_PLAY_TRANSPORT_VERSION,
        messageKind: 'error',
        reason: 'invalid_channel',
        at: nowIso(),
      });
      return closePokerPlayWebSocket(socket, 1008, 'INVALID_CHANNEL');
    }
    if (channelKind === 'series' && viewerMode !== 'rail') {
      sendPokerPlayTransportMessage(socket, {
        transportVersion: POKER_PLAY_TRANSPORT_VERSION,
        channelKind,
        channelId,
        messageKind: 'error',
        reason: 'viewer_mode_unsupported',
        at: nowIso(),
      });
      return closePokerPlayWebSocket(socket, 1008, 'VIEWER_MODE_UNSUPPORTED');
    }

    let snapshot = null;
    try {
      snapshot = buildPokerPlayTransportSnapshot({
        channelKind,
        channelId,
        viewerMode,
        req,
      });
    } catch (err) {
      sendPokerPlayTransportMessage(socket, {
        transportVersion: POKER_PLAY_TRANSPORT_VERSION,
        channelKind,
        channelId,
        messageKind: 'error',
        reason: err?.code || 'snapshot_failed',
        at: nowIso(),
      });
      return closePokerPlayWebSocket(socket, err?.status === 401 ? 1008 : 1011, err?.code || 'SNAPSHOT_FAILED');
    }

    const replay = pokerPlayTransport.resolveReplay({
      channelKind,
      channelId,
      lastSeenVersion: lastSeenVersionRaw,
    });
    if (replay.mode === 'replay') {
      for (const envelope of replay.deltas) {
        sendPokerPlayTransportMessage(socket, envelope);
      }
    } else if (replay.mode === 'reset') {
      sendPokerPlayTransportMessage(socket, {
        ...pokerPlayTransport.buildSnapshotEnvelope({
          channelKind,
          channelId,
          snapshot,
          reason: replay.reason || 'version_gap',
        }),
        messageKind: 'reset',
      });
    } else if (replay.mode !== 'noop') {
      sendPokerPlayTransportMessage(socket, pokerPlayTransport.buildSnapshotEnvelope({
        channelKind,
        channelId,
        snapshot,
        reason: replay.reason || 'subscribe',
      }));
    }

    const unsubscribe = pokerPlayPubSub.subscribe({
      topic: buildPokerPlayPubSubTopic(channelKind, channelId),
      subscriberId,
      listener(message) {
        const envelope = message && typeof message === 'object' ? message : null;
        if (!envelope) return;
        sendPokerPlayTransportMessage(socket, envelope);
      },
    });
    const heartbeat = setInterval(() => {
      sendPokerPlayTransportMessage(socket, {
        transportVersion: POKER_PLAY_TRANSPORT_VERSION,
        channelKind,
        channelId,
        messageKind: 'heartbeat',
        version: pokerPlayTransport.getChannelStateSummary(channelKind, channelId)?.version || 0,
        prevVersion: pokerPlayTransport.getChannelStateSummary(channelKind, channelId)?.version || 0,
        patch: null,
        snapshot: null,
        reason: 'keepalive',
        at: nowIso(),
      });
    }, 15000);
    const close = () => {
      clearInterval(heartbeat);
      unsubscribe();
    };
    socket.on('close', close);
    socket.on('error', close);
  }

  if (pokerPlayTransportWss) {
    pokerPlayTransportWss.on('connection', (socket, req) => {
      handlePokerPlayTransportConnection(socket, req);
    });
  }

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
    const tableEnvelope = pokerPlayTransport.publish({
      channelKind: 'table',
      channelId: normalizedTableId,
      reason: payload.reason,
      patch: payload,
      at: payload.at,
    });
    if (tableEnvelope) {
      pokerPlayPubSub.publish({
        topic: buildPokerPlayPubSubTopic('table', normalizedTableId),
        message: tableEnvelope,
        metadata: {
          source: 'mutation',
          channelKind: 'table',
          channelId: normalizedTableId,
        },
      });
    }

    const table = getPokerPlayTableById(normalizedTableId);
    const seriesId = normalizeTrimmedString(
      table?.rules?.seriesId,
      normalizeTrimmedString(table?.summary?.seriesId)
    );
    if (!seriesId) return;
    const seriesPayload = {
      seriesId,
      ...payload,
    };
    const seriesEnvelope = pokerPlayTransport.publish({
      channelKind: 'series',
      channelId: seriesId,
      reason: payload.reason,
      patch: seriesPayload,
      at: payload.at,
    });
    if (seriesEnvelope) {
      pokerPlayPubSub.publish({
        topic: buildPokerPlayPubSubTopic('series', seriesId),
        message: seriesEnvelope,
        metadata: {
          source: 'mutation',
          channelKind: 'series',
          channelId: seriesId,
        },
      });
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
    const unsubscribe = pokerPlayPubSub.subscribe({
      topic: buildPokerPlayPubSubTopic('table', normalizedTableId),
      subscriberId: `sse:table:${normalizedTableId}:${randomHex(8)}`,
      listener(message) {
        const envelope = message && typeof message === 'object' ? message : null;
        if (!envelope) return;
        try {
          writePokerPlayStreamEvent(res, {
            id: envelope?.version || null,
            event: 'table',
            data: envelope?.patch || {},
          });
        } catch {
          client.close();
        }
      },
    });
    client.close = () => {
      clearInterval(heartbeat);
      unsubscribe();
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
    const unsubscribe = pokerPlayPubSub.subscribe({
      topic: buildPokerPlayPubSubTopic('series', normalizedSeriesId),
      subscriberId: `sse:series:${normalizedSeriesId}:${randomHex(8)}`,
      listener(message) {
        const envelope = message && typeof message === 'object' ? message : null;
        if (!envelope) return;
        try {
          writePokerPlayStreamEvent(res, {
            id: envelope?.version ? `${envelope.version}-series` : null,
            event: 'series',
            data: envelope?.patch || {},
          });
        } catch {
          client.close();
        }
      },
    });
    client.close = () => {
      clearInterval(heartbeat);
      unsubscribe();
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

  function resetPokerPlayTransportState() {
    pokerPlayTransport.reset();
    pokerPlayPubSub.reset();
    for (const bucket of pokerPlayStreamClientsByTable.values()) {
      for (const client of bucket) {
        try {
          client.close();
        } catch {
          // no-op
        }
      }
    }
    pokerPlayStreamClientsByTable.clear();
    for (const bucket of pokerPlayStreamClientsBySeries.values()) {
      for (const client of bucket) {
        try {
          client.close();
        } catch {
          // no-op
        }
      }
    }
    pokerPlayStreamClientsBySeries.clear();
    if (pokerPlayTransportWss && pokerPlayTransportWss.clients) {
      for (const client of pokerPlayTransportWss.clients) {
        closePokerPlayWebSocket(client, 1001, 'SERVER_RESET');
      }
    }
  }

  function handlePokerPlayWebSocketUpgrade(req, socket, head, pathname = '') {
    if (!pokerPlayTransportWss) return false;
    if (String(pathname || '') !== '/api/poker/play/ws') return false;
    pokerPlayTransportWss.handleUpgrade(req, socket, head, (ws) => {
      pokerPlayTransportWss.emit('connection', ws, req);
    });
    return true;
  }

  function normalizeHarnessSeatNumber(value, fallback = 0) {
    const seatNumber = Number.parseInt(String(value == null ? '' : value), 10);
    if (!Number.isFinite(seatNumber) || seatNumber < 1 || seatNumber > 6) return fallback;
    return seatNumber;
  }

  function addHarnessSeconds(iso, seconds) {
    const baseMs = Date.parse(String(iso || ''));
    const safeBaseMs = Number.isFinite(baseMs) ? baseMs : Date.now();
    return new Date(safeBaseMs + (Number(seconds || 0) * 1000)).toISOString();
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
      rebuy_addon_story: [
        { seatNumber: 1, address: 'So1anaHarnessRebuyA111111111111111111111111', houseId: 'house_harness_rebuy_a', displayName: 'Rebuy Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessRebuyB111111111111111111111111', houseId: 'house_harness_rebuy_b', displayName: 'Rebuy Bravo' },
        { seatNumber: 3, address: 'So1anaHarnessRebuyC111111111111111111111111', houseId: 'house_harness_rebuy_c', displayName: 'Rebuy Charlie' },
      ],
      multiflight_story: [
        { seatNumber: 1, address: 'So1anaHarnessFlightA11111111111111111111111', houseId: 'house_harness_flight_a', displayName: 'Flight Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessFlightB11111111111111111111111', houseId: 'house_harness_flight_b', displayName: 'Flight Bravo' },
        { seatNumber: 3, address: 'So1anaHarnessFlightC11111111111111111111111', houseId: 'house_harness_flight_c', displayName: 'Flight Charlie' },
      ],
      chop_deal_story: [
        { seatNumber: 1, address: 'So1anaHarnessChopA1111111111111111111111111', houseId: 'house_harness_chop_a', displayName: 'Deal Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessChopB1111111111111111111111111', houseId: 'house_harness_chop_b', displayName: 'Deal Bravo' },
        { seatNumber: 3, address: 'So1anaHarnessChopC1111111111111111111111111', houseId: 'house_harness_chop_c', displayName: 'Deal Charlie' },
      ],
      history_results_story: [
        { seatNumber: 1, address: 'So1anaHarnessHistoryA111111111111111111111', houseId: 'house_harness_history_a', displayName: 'History Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessHistoryB111111111111111111111', houseId: 'house_harness_history_b', displayName: 'History Bravo' },
        { seatNumber: 2, address: 'So1anaHarnessHistoryC111111111111111111111', houseId: 'house_harness_history_c', displayName: 'History Charlie' },
      ],
      series_timeline_story: [
        { seatNumber: 1, address: 'So1anaHarnessTimelineA11111111111111111111', houseId: 'house_harness_timeline_a', displayName: 'Timeline Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessTimelineB11111111111111111111', houseId: 'house_harness_timeline_b', displayName: 'Timeline Bravo' },
        { seatNumber: 1, address: 'So1anaHarnessTimelineC11111111111111111111', houseId: 'house_harness_timeline_c', displayName: 'Timeline Charlie' },
      ],
      integrity_flag_story: [
        { seatNumber: 1, address: 'So1anaHarnessIntegrityA1111111111111111111', houseId: 'house_harness_integrity_shared', displayName: 'Integrity Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessIntegrityB1111111111111111111', houseId: 'house_harness_integrity_shared', displayName: 'Integrity Bravo' },
        { seatNumber: 3, address: 'So1anaHarnessIntegrityC1111111111111111111', houseId: 'house_harness_integrity_other', displayName: 'Integrity Charlie' },
      ],
      player_stats_story: [
        { seatNumber: 1, address: 'So1anaHarnessStatsA11111111111111111111111', houseId: 'house_harness_stats_a', displayName: 'Stats Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessStatsB11111111111111111111111', houseId: 'house_harness_stats_b', displayName: 'Stats Bravo' },
        { seatNumber: 3, address: 'So1anaHarnessStatsC11111111111111111111111', houseId: 'house_harness_stats_c', displayName: 'Stats Charlie' },
      ],
      ops_dashboard_story: [
        { seatNumber: 1, address: 'So1anaHarnessOpsA1111111111111111111111111', houseId: 'house_harness_ops_a', displayName: 'Ops Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessOpsB1111111111111111111111111', houseId: 'house_harness_ops_b', displayName: 'Ops Bravo' },
        { seatNumber: 3, address: 'So1anaHarnessOpsC1111111111111111111111111', houseId: 'house_harness_ops_c', displayName: 'Ops Charlie' },
        { seatNumber: 4, address: 'So1anaHarnessOpsD1111111111111111111111111', houseId: 'house_harness_ops_d', displayName: 'Ops Delta' },
      ],
      ledger_reconciliation_story: [
        { seatNumber: 1, address: 'So1anaHarnessReconA11111111111111111111111', houseId: 'house_harness_recon_a', displayName: 'Recon Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessReconB11111111111111111111111', houseId: 'house_harness_recon_b', displayName: 'Recon Bravo' },
      ],
      ledger_reconciliation_corrupt_story: [
        { seatNumber: 1, address: 'So1anaHarnessReconA11111111111111111111111', houseId: 'house_harness_recon_a', displayName: 'Recon Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessReconB11111111111111111111111', houseId: 'house_harness_recon_b', displayName: 'Recon Bravo' },
      ],
      economy_native_season_story: [
        { seatNumber: 1, address: 'So1anaHarnessEconomyA111111111111111111111', houseId: 'house_harness_economy_a', displayName: 'Economy Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessEconomyB111111111111111111111', houseId: 'house_harness_economy_b', displayName: 'Economy Bravo' },
        { seatNumber: 3, address: 'So1anaHarnessEconomyC111111111111111111111', houseId: 'house_harness_economy_c', displayName: 'Economy Charlie' },
      ],
      schedule_calendar_story: [
        { seatNumber: 1, address: 'So1anaHarnessScheduleUIA11111111111111111111', houseId: 'house_harness_schedule_ui_a', displayName: 'Schedule Viewer' },
      ],
      scheduled_break_story: [
        { seatNumber: 1, address: 'So1anaHarnessSchedBreakA1111111111111111111', houseId: 'house_harness_sched_break_a', displayName: 'Break Alpha' },
        { seatNumber: 2, address: 'So1anaHarnessSchedBreakB1111111111111111111', houseId: 'house_harness_sched_break_b', displayName: 'Break Bravo' },
        { seatNumber: 3, address: 'So1anaHarnessSchedBreakC1111111111111111111', houseId: 'house_harness_sched_break_c', displayName: 'Break Charlie' },
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
    let reconciliationDebug = null;
    const buildHarnessTournamentRules = (seriesId, seriesTitle, overrides = {}) => ({
      mode: 'no_limit_holdem',
      format: 'tournament',
      maxSeats: 6,
      decisionCountdownSeconds: 45,
      presenceTimeoutSeconds: 30,
      reconnectGraceSeconds: 90,
      timeBankSeconds: 15,
      cashOutEnabled: false,
      payoutModel: 'top2_70_30',
      lateRegistrationHands: 0,
      handsPerBlindLevel: 2,
      blindLevels: [
        { level: 1, smallBlindOil: 50, bigBlindOil: 100 },
      ],
      reentryLimit: 0,
      seriesId,
      seriesTitle,
      matchKey: `tournament:harness:${seriesId}`,
      ...overrides,
    });

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
    } else if (normalizedScenario === 'schedule_calendar_story') {
      const [seatOne] = normalizedActors;
      const dailyTemplateId = 'daily_river_sprint';
      const dailyTemplateTitle = 'Daily River Sprint';
      const dailyRecurrenceLabel = 'Daily 12:00 UTC';
      const majorTemplateId = 'friday_deepstack_major';
      const majorTemplateTitle = 'Friday Deepstack Major';
      const majorRecurrenceLabel = 'Weekly Fri 18:00 UTC';
      const dailySeriesId = `pkseries_harness_schedule_daily_${randomHex(6)}`;
      const majorSeriesId = `pkseries_harness_schedule_major_${randomHex(6)}`;
      const tableAId = nextTableId;
      const tableBId = `${nextTableId}_b`;
      const tableCId = `${nextTableId}_c`;
      const scheduleA = addHarnessSeconds(requestAt, 4 * 60 * 60);
      const scheduleB = addHarnessSeconds(requestAt, 28 * 60 * 60);
      const scheduleC = addHarnessSeconds(requestAt, 34 * 60 * 60);
      const buildScheduledState = (scheduledStartAt, entryCountsByWallet = {}) => ({
        activeHandId: null,
        activeHandNumber: 0,
        completedAt: null,
        winnerSeatNumber: 0,
        prizeOil: 0,
        prizeSettledAt: null,
        scheduledStartAt,
        timeBankRemainingBySeat: {},
        entryCount: Object.values(entryCountsByWallet).reduce((sum, count) => sum + Number(count || 0), 0),
        reentryCount: 0,
        entryCountsByWallet,
        completedScheduledBreakAfterHands: [],
        scheduledBreakId: null,
        scheduledBreakLabel: null,
        scheduledBreakAfterHandNumber: 0,
        scheduledBreakStartedAt: null,
        scheduledBreakUntilAt: null,
        scheduledBreakDurationMinutes: 0,
      });
      upsertPokerPlayTable({
        tableId: tableAId,
        slug: `${normalizedScenario}-a-${randomHex(4)}`,
        title: dailyTemplateTitle,
        tableType: 'tournament',
        status: 'scheduled',
        maxSeats: 6,
        smallBlindOil: 25,
        bigBlindOil: 50,
        buyInOil: 300,
        minPlayers: 2,
        state: buildScheduledState(scheduleA, {
          [seatOne.address]: 1,
        }),
        rules: buildHarnessTournamentRules(dailySeriesId, dailyTemplateTitle, {
          scheduledStartAt: scheduleA,
          lateRegistrationHands: 2,
          scheduleTemplateId: dailyTemplateId,
          scheduleTemplateTitle: dailyTemplateTitle,
          scheduleRecurrenceLabel: dailyRecurrenceLabel,
        }),
        summary: {
          headline: 'Harness schedule calendar scenario.',
          seriesId: dailySeriesId,
          seriesTitle: dailyTemplateTitle,
          scheduledStartAt: scheduleA,
          scheduleTemplateId: dailyTemplateId,
          scheduleTemplateTitle: dailyTemplateTitle,
          scheduleRecurrenceLabel: dailyRecurrenceLabel,
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      upsertPokerPlaySeat({
        tableId: tableAId,
        seatNumber: seatOne.seatNumber,
        portalSessionId: `harness_${seatOne.address}`,
        houseId: seatOne.houseId,
        walletSubject: seatOne.address,
        displayName: seatOne.displayName,
        status: 'active',
        buyInOil: 300,
        stackOil: 300,
        lastSeenAt: requestAt,
        disconnectedAt: null,
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      upsertPokerPlayTable({
        tableId: tableBId,
        slug: `${normalizedScenario}-b-${randomHex(4)}`,
        title: dailyTemplateTitle,
        tableType: 'tournament',
        status: 'scheduled',
        maxSeats: 6,
        smallBlindOil: 25,
        bigBlindOil: 50,
        buyInOil: 300,
        minPlayers: 2,
        state: buildScheduledState(scheduleB),
        rules: buildHarnessTournamentRules(dailySeriesId, dailyTemplateTitle, {
          scheduledStartAt: scheduleB,
          lateRegistrationHands: 2,
          scheduleTemplateId: dailyTemplateId,
          scheduleTemplateTitle: dailyTemplateTitle,
          scheduleRecurrenceLabel: dailyRecurrenceLabel,
        }),
        summary: {
          headline: 'Harness schedule calendar scenario.',
          seriesId: dailySeriesId,
          seriesTitle: dailyTemplateTitle,
          scheduledStartAt: scheduleB,
          scheduleTemplateId: dailyTemplateId,
          scheduleTemplateTitle: dailyTemplateTitle,
          scheduleRecurrenceLabel: dailyRecurrenceLabel,
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      upsertPokerPlayTable({
        tableId: tableCId,
        slug: `${normalizedScenario}-c-${randomHex(4)}`,
        title: majorTemplateTitle,
        tableType: 'tournament',
        status: 'scheduled',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 2,
        state: buildScheduledState(scheduleC),
        rules: buildHarnessTournamentRules(majorSeriesId, majorTemplateTitle, {
          scheduledStartAt: scheduleC,
          lateRegistrationHands: 2,
          scheduleTemplateId: majorTemplateId,
          scheduleTemplateTitle: majorTemplateTitle,
          scheduleRecurrenceLabel: majorRecurrenceLabel,
          scheduledBreaks: [
            {
              afterHandNumber: 4,
              label: 'Player Break 1',
              durationMinutes: 5,
            },
          ],
        }),
        summary: {
          headline: 'Harness schedule calendar scenario.',
          seriesId: majorSeriesId,
          seriesTitle: majorTemplateTitle,
          scheduledStartAt: scheduleC,
          scheduleTemplateId: majorTemplateId,
          scheduleTemplateTitle: majorTemplateTitle,
          scheduleRecurrenceLabel: majorRecurrenceLabel,
          scheduledBreakCount: 1,
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      seededSeriesId = dailySeriesId;
      seededTableIds.push(tableAId, tableBId, tableCId);
    } else if (normalizedScenario === 'scheduled_break_story') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      const seriesId = `pkseries_harness_sched_break_${randomHex(6)}`;
      upsertPokerPlayTable({
        tableId: nextTableId,
        slug: `${normalizedScenario}-${randomHex(4)}`,
        title: 'Harness Scheduled Break Table',
        tableType: 'tournament',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 3,
          completedAt: null,
          winnerSeatNumber: 0,
          prizeOil: 0,
          prizeSettledAt: null,
          lastButtonSeat: seatThree.seatNumber,
          lastSettledAt: requestAt,
          lastSettledHandId: `${handId}_settled`,
          lastSettledHandNumber: 3,
          timeBankRemainingBySeat: {
            [String(seatOne.seatNumber)]: 15,
            [String(seatTwo.seatNumber)]: 15,
            [String(seatThree.seatNumber)]: 15,
          },
          entryCount: 3,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatTwo.address]: 1,
            [seatThree.address]: 1,
          },
          completedScheduledBreakAfterHands: [],
          scheduledBreakId: null,
          scheduledBreakLabel: null,
          scheduledBreakAfterHandNumber: 0,
          scheduledBreakStartedAt: null,
          scheduledBreakUntilAt: null,
          scheduledBreakDurationMinutes: 0,
        },
        rules: buildHarnessTournamentRules(seriesId, 'Harness Break Series', {
          lateRegistrationHands: 0,
          scheduledBreaks: [
            {
              breakId: 'player_break_1',
              afterHandNumber: 3,
              label: 'Player Break 1',
              durationMinutes: 5,
            },
            {
              breakId: 'player_break_2',
              afterHandNumber: 6,
              label: 'Player Break 2',
              durationMinutes: 5,
            },
          ],
        }),
        summary: {
          headline: 'Harness scheduled-break scenario.',
          seriesId,
          seriesTitle: 'Harness Break Series',
          scheduledBreakCount: 2,
        },
        createdAt: addHarnessSeconds(requestAt, -1800),
        updatedAt: requestAt,
      });
      [
        { actor: seatOne, stackOil: 640 },
        { actor: seatTwo, stackOil: 580 },
        { actor: seatThree, stackOil: 560 },
      ].forEach(({ actor, stackOil }) => {
        upsertPokerPlaySeat({
          tableId: nextTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'active',
          buyInOil: 600,
          stackOil,
          lastSeenAt: requestAt,
          disconnectedAt: null,
          createdAt: requestAt,
          updatedAt: requestAt,
        });
      });
      seededSeriesId = seriesId;
      seededTableIds.push(nextTableId);
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
    } else if (normalizedScenario === 'rebuy_addon_story') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      const seriesId = `pkseries_harness_rebuy_addon_${randomHex(6)}`;
      const breakStartedAt = requestAt;
      const breakUntilAt = addHarnessSeconds(requestAt, 300);
      upsertPokerPlayTable({
        tableId: nextTableId,
        slug: `${normalizedScenario}-${randomHex(4)}`,
        title: 'Harness Rebuy Add-On Table',
        tableType: 'tournament',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 1,
          lastSettledHandNumber: 1,
          lastSettledHandId: null,
          completedAt: null,
          winnerSeatNumber: 0,
          prizeOil: 0,
          prizeSettledAt: null,
          entryCount: 3,
          reentryCount: 0,
          rebuyCount: 0,
          addonCount: 0,
          addonPrizePoolOil: 0,
          addonBountyPoolOil: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatTwo.address]: 1,
            [seatThree.address]: 1,
          },
          rebuyCountsByWallet: {},
          addonCountsByWallet: {},
          completedScheduledBreakAfterHands: [],
          scheduledBreakId: 'rebuy_break_1',
          scheduledBreakLabel: 'Break 1',
          scheduledBreakAfterHandNumber: 1,
          scheduledBreakStartedAt: breakStartedAt,
          scheduledBreakUntilAt: breakUntilAt,
          scheduledBreakDurationMinutes: 5,
          timeBankRemainingBySeat: {
            '1': 15,
            '2': 15,
            '3': 15,
          },
        },
        rules: buildHarnessTournamentRules(seriesId, 'Harness Rebuy Add-On Series', {
          reentryLimit: 0,
          rebuyLimit: 1,
          rebuyWindowHands: 1,
          addonWindowAfterHandNumbers: [1],
          addonCostOil: 200,
          addonChipsOil: 300,
          maxAddonsPerSeat: 1,
          scheduledBreaks: [
            {
              breakId: 'rebuy_break_1',
              label: 'Break 1',
              afterHandNumber: 1,
              durationMinutes: 5,
            },
          ],
        }),
        summary: {
          headline: 'Harness rebuy and add-on policy story.',
          seriesId,
          seriesTitle: 'Harness Rebuy Add-On Series',
          rebuyLimit: 1,
          rebuyWindowHands: 1,
          addonWindowAfterHandNumbers: [1],
          addonCostOil: 200,
          addonChipsOil: 300,
          maxAddonsPerSeat: 1,
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
        stackOil: 500,
        lastSeenAt: requestAt,
        disconnectedAt: null,
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      upsertPokerPlaySeat({
        tableId: nextTableId,
        seatNumber: seatThree.seatNumber,
        portalSessionId: `harness_${seatThree.address}`,
        houseId: seatThree.houseId,
        walletSubject: seatThree.address,
        displayName: seatThree.displayName,
        status: 'active',
        buyInOil: 600,
        stackOil: 900,
        lastSeenAt: requestAt,
        disconnectedAt: null,
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      seededSeriesId = seriesId;
      seededTableIds.push(nextTableId);
    } else if (normalizedScenario === 'multiflight_story') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      const festivalParentId = `pkfestival_harness_${randomHex(6)}`;
      const festivalTitle = 'Harness Festival';
      const flightSeriesId = `pkseries_harness_flight_${randomHex(6)}`;
      const mergeSeriesId = `pkseries_harness_merge_${randomHex(6)}`;
      const mergeTableId = `${nextTableId}_merge`;
      const mergeScheduledStartAt = addHarnessSeconds(requestAt, 3600);
      upsertPokerPlayTable({
        tableId: mergeTableId,
        slug: `${normalizedScenario}-merge-${randomHex(4)}`,
        title: 'Harness Festival Day 2',
        tableType: 'tournament',
        status: 'scheduled',
        maxSeats: 6,
        smallBlindOil: 100,
        bigBlindOil: 200,
        buyInOil: 600,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 0,
          completedAt: null,
          winnerSeatNumber: 0,
          prizeOil: 0,
          prizeSettledAt: null,
          scheduledStartAt: mergeScheduledStartAt,
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
          timeBankRemainingBySeat: {},
        },
        rules: buildHarnessTournamentRules(mergeSeriesId, 'Harness Festival Day 2', {
          formatVariant: 'multi_flight',
          scheduledStartAt: mergeScheduledStartAt,
          lateRegistrationHands: 0,
          multiFlightFestivalParentId: festivalParentId,
          multiFlightFestivalTitle: festivalTitle,
        }),
        summary: {
          headline: 'Harness Day 2 merge table.',
          seriesId: mergeSeriesId,
          seriesTitle: 'Harness Festival Day 2',
          formatVariant: 'multi_flight',
          multiFlightFestivalParentId: festivalParentId,
          multiFlightFestivalTitle: festivalTitle,
          multiFlightStage: 'merge',
          multiFlightImportedFlightCount: 0,
          multiFlightImportedEntryCount: 0,
          multiFlightImportedPrizePoolOil: 0,
          multiFlightImportedCarriedStackTotalOil: 0,
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      upsertPokerPlayTable({
        tableId: nextTableId,
        slug: `${normalizedScenario}-${randomHex(4)}`,
        title: 'Harness Festival Flight A',
        tableType: 'tournament',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 4,
          lastSettledHandId: `${handId}_settled`,
          lastSettledHandNumber: 4,
          completedAt: null,
          winnerSeatNumber: 0,
          prizeOil: 0,
          prizeSettledAt: null,
          entryCount: 3,
          reentryCount: 0,
          rebuyCount: 0,
          addonCount: 0,
          addonPrizePoolOil: 0,
          addonBountyPoolOil: 0,
          multiFlightBaggedAt: null,
          multiFlightAdvancedSeatCount: 0,
          multiFlightImportsBySourceSeriesId: {},
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatTwo.address]: 1,
            [seatThree.address]: 1,
          },
          rebuyCountsByWallet: {},
          addonCountsByWallet: {},
          completedScheduledBreakAfterHands: [],
          scheduledBreakId: null,
          scheduledBreakLabel: null,
          scheduledBreakAfterHandNumber: 0,
          scheduledBreakStartedAt: null,
          scheduledBreakUntilAt: null,
          scheduledBreakDurationMinutes: 0,
          timeBankRemainingBySeat: {
            '1': 15,
            '2': 15,
            '3': 15,
          },
        },
        rules: buildHarnessTournamentRules(flightSeriesId, 'Harness Festival Flight A', {
          formatVariant: 'multi_flight',
          lateRegistrationHands: 0,
          multiFlightFestivalParentId: festivalParentId,
          multiFlightFestivalTitle: festivalTitle,
          multiFlightFlightCode: 'A',
          multiFlightFlightLabel: 'Flight A',
          multiFlightMergeSeriesId: mergeSeriesId,
          multiFlightMergeSeriesTitle: 'Harness Festival Day 2',
          multiFlightAdvanceSeatCount: 2,
        }),
        summary: {
          headline: 'Harness multi-flight day 1 table.',
          seriesId: flightSeriesId,
          seriesTitle: 'Harness Festival Flight A',
          formatVariant: 'multi_flight',
          multiFlightFestivalParentId: festivalParentId,
          multiFlightFestivalTitle: festivalTitle,
          multiFlightStage: 'flight',
          multiFlightFlightCode: 'A',
          multiFlightFlightLabel: 'Flight A',
          multiFlightMergeSeriesId: mergeSeriesId,
          multiFlightMergeSeriesTitle: 'Harness Festival Day 2',
          multiFlightAdvanceSeatCount: 2,
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      [
        { actor: seatOne, stackOil: 900, status: 'active', eliminatedAt: null },
        { actor: seatTwo, stackOil: 600, status: 'active', eliminatedAt: null },
        { actor: seatThree, stackOil: 0, status: 'busted', eliminatedAt: addHarnessSeconds(requestAt, -60) },
      ].forEach(({ actor, stackOil, status, eliminatedAt }) => {
        upsertPokerPlaySeat({
          tableId: nextTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status,
          buyInOil: 600,
          stackOil,
          lastSeenAt: requestAt,
          disconnectedAt: null,
          eliminatedAt,
          createdAt: requestAt,
          updatedAt: requestAt,
        });
      });
      syncPokerPlayTable(playRouteDeps, nextTableId, {
        processAt: addHarnessSeconds(requestAt, 1),
      });
      seededSeriesId = flightSeriesId;
      seededTableIds.push(nextTableId, mergeTableId);
      reconciliationDebug = {
        multiFlight: {
          festivalParentId,
          flightSeriesId,
          mergeSeriesId,
          mergeTableId,
          expectedAdvancedSeatCount: 2,
          expectedImportedPrizePoolOil: 1800,
          expectedImportedEntryCount: 3,
          expectedCarriedStackTotalOil: 1500,
        },
      };
    } else if (normalizedScenario === 'chop_deal_story') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      const seriesId = `pkseries_harness_chop_${randomHex(6)}`;
      upsertPokerPlayTable({
        tableId: nextTableId,
        slug: `${normalizedScenario}-${randomHex(4)}`,
        title: 'Harness Chop Final Table',
        tableType: 'tournament',
        status: 'paused',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 7,
          lastSettledHandNumber: 6,
          lastSettledHandId: null,
          completedAt: null,
          winnerSeatNumber: 0,
          prizeOil: 0,
          prizeSettledAt: null,
          entryCount: 3,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatTwo.address]: 1,
            [seatThree.address]: 1,
          },
          pausedAt: requestAt,
          pausedReason: 'Harness chop review window.',
          pausedBy: 'system',
          pausedActionRemainingMs: 0,
          timeBankRemainingBySeat: {
            '1': 15,
            '2': 15,
            '3': 15,
          },
        },
        rules: buildHarnessTournamentRules(seriesId, 'Harness Chop Series', {
          payoutModel: 'top2_70_30',
          lateRegistrationHands: 0,
        }),
        summary: {
          headline: 'Harness chop and deal story.',
          seriesId,
          seriesTitle: 'Harness Chop Series',
        },
        createdAt: requestAt,
        updatedAt: requestAt,
      });
      [
        { actor: seatOne, stackOil: 900 },
        { actor: seatTwo, stackOil: 600 },
        { actor: seatThree, stackOil: 300 },
      ].forEach(({ actor, stackOil }) => {
        upsertPokerPlaySeat({
          tableId: nextTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'active',
          buyInOil: 600,
          stackOil,
          lastSeenAt: requestAt,
          disconnectedAt: null,
          createdAt: requestAt,
          updatedAt: requestAt,
        });
      });
      createPokerPlayAuditEvent({
        tableId: nextTableId,
        handId: null,
        seatNumber: null,
        actorRole: 'system',
        eventKind: 'table_paused',
        payload: {
          seriesId,
          tableId: nextTableId,
          reason: 'Harness chop review window.',
        },
        createdAt: requestAt,
      });
      seededSeriesId = seriesId;
      seededTableIds.push(nextTableId);
    } else if (normalizedScenario === 'history_results_story') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      const tournamentTableId = `${nextTableId}_tournament`;
      const tournamentSeriesId = `pkseries_harness_history_${randomHex(6)}`;
      const firstHistoryAt = addHarnessSeconds(requestAt, -360);
      const secondHistoryAt = addHarnessSeconds(requestAt, -240);
      const liveHistoryAt = addHarnessSeconds(requestAt, -90);
      const handOneId = `${handId}_1`;
      const handTwoId = `${handId}_2`;
      const resultSettledAt = addHarnessSeconds(requestAt, -30);

      upsertPokerPlayTable({
        tableId: nextTableId,
        slug: `${normalizedScenario}-${randomHex(4)}`,
        title: 'Harness History Cash Table',
        tableType: 'cash',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 400,
        minPlayers: 2,
        state: {
          activeHandId: handId,
          activeHandNumber: 3,
          lastButtonSeat: seatTwo.seatNumber,
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
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 15,
          cashOutEnabled: true,
        },
        summary: {
          headline: 'Harness hand-history and results scenario.',
        },
        createdAt: firstHistoryAt,
        updatedAt: requestAt,
      });

      [
        { actor: seatOne, buyInOil: 400, stackOil: 420 },
        { actor: seatTwo, buyInOil: 400, stackOil: 380 },
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
          createdAt: firstHistoryAt,
          updatedAt: requestAt,
        });
      });

      upsertPokerPlayHand({
        handId: handOneId,
        tableId: nextTableId,
        handNumber: 1,
        status: 'completed',
        actionExpiresAt: addHarnessSeconds(firstHistoryAt, 45),
        state: {
          handNumber: 1,
          tableType: 'cash',
          blindLevel: 0,
          handsPerBlindLevel: 0,
          buttonSeat: seatOne.seatNumber,
          smallBlindSeat: seatOne.seatNumber,
          bigBlindSeat: seatTwo.seatNumber,
          actingSeat: 0,
          street: 'river',
          phase: 'river',
          status: 'completed',
          countdownSeconds: 45,
          communityCards: ['Ah', 'Qc', '9d', '6s', '2c'],
          seatOrder: [seatOne.seatNumber, seatTwo.seatNumber],
          seatStates: {
            [String(seatOne.seatNumber)]: {
              seatNumber: seatOne.seatNumber,
              stackOil: 460,
              holeCards: ['As', 'Ad'],
              committedStreetOil: 0,
              committedHandOil: 60,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: true,
            },
            [String(seatTwo.seatNumber)]: {
              seatNumber: seatTwo.seatNumber,
              stackOil: 340,
              holeCards: ['Kh', 'Qs'],
              committedStreetOil: 0,
              committedHandOil: 60,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: true,
            },
          },
          pendingSeatNumbers: [],
          potOil: 120,
          currentBetOil: 0,
          lastRaiseSizeOil: 20,
          minRaiseToOil: 40,
          bigBlindOil: 20,
          actionExpiresAt: addHarnessSeconds(firstHistoryAt, 45),
          result: null,
        },
        result: {
          winningSeatNumbers: [seatOne.seatNumber],
          payouts: [
            { seatNumber: seatOne.seatNumber, amountOil: 120 },
          ],
          note: `${seatOne.displayName} wins 120 OIL at showdown.`,
        },
        createdAt: firstHistoryAt,
        updatedAt: addHarnessSeconds(firstHistoryAt, 50),
      });
      createPokerPlayAction({
        tableId: nextTableId,
        handId: handOneId,
        seatNumber: seatOne.seatNumber,
        actorRole: 'player',
        actionKind: 'raise',
        amountOil: 40,
        createdAt: addHarnessSeconds(firstHistoryAt, 10),
      });
      createPokerPlayAction({
        tableId: nextTableId,
        handId: handOneId,
        seatNumber: seatTwo.seatNumber,
        actorRole: 'player',
        actionKind: 'call',
        amountOil: 40,
        createdAt: addHarnessSeconds(firstHistoryAt, 20),
      });

      upsertPokerPlayHand({
        handId: handTwoId,
        tableId: nextTableId,
        handNumber: 2,
        status: 'completed',
        actionExpiresAt: addHarnessSeconds(secondHistoryAt, 45),
        state: {
          handNumber: 2,
          tableType: 'cash',
          blindLevel: 0,
          handsPerBlindLevel: 0,
          buttonSeat: seatTwo.seatNumber,
          smallBlindSeat: seatTwo.seatNumber,
          bigBlindSeat: seatOne.seatNumber,
          actingSeat: 0,
          street: 'turn',
          phase: 'turn',
          status: 'completed',
          countdownSeconds: 45,
          communityCards: ['Kd', 'Jd', '7s', '4h'],
          seatOrder: [seatOne.seatNumber, seatTwo.seatNumber],
          seatStates: {
            [String(seatOne.seatNumber)]: {
              seatNumber: seatOne.seatNumber,
              stackOil: 420,
              holeCards: ['Th', '9h'],
              committedStreetOil: 0,
              committedHandOil: 30,
              folded: true,
              allIn: false,
              eliminated: false,
              actedStreet: true,
            },
            [String(seatTwo.seatNumber)]: {
              seatNumber: seatTwo.seatNumber,
              stackOil: 380,
              holeCards: ['Ac', 'Kc'],
              committedStreetOil: 0,
              committedHandOil: 30,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: true,
            },
          },
          pendingSeatNumbers: [],
          potOil: 60,
          currentBetOil: 0,
          lastRaiseSizeOil: 20,
          minRaiseToOil: 40,
          bigBlindOil: 20,
          actionExpiresAt: addHarnessSeconds(secondHistoryAt, 45),
          result: null,
        },
        result: {
          winningSeatNumbers: [seatTwo.seatNumber],
          payouts: [
            { seatNumber: seatTwo.seatNumber, amountOil: 60 },
          ],
          note: `${seatTwo.displayName} takes the pot after a turn fold.`,
        },
        createdAt: secondHistoryAt,
        updatedAt: addHarnessSeconds(secondHistoryAt, 50),
      });
      createPokerPlayAction({
        tableId: nextTableId,
        handId: handTwoId,
        seatNumber: seatTwo.seatNumber,
        actorRole: 'player',
        actionKind: 'bet',
        amountOil: 30,
        createdAt: addHarnessSeconds(secondHistoryAt, 12),
      });
      createPokerPlayAction({
        tableId: nextTableId,
        handId: handTwoId,
        seatNumber: seatOne.seatNumber,
        actorRole: 'player',
        actionKind: 'fold',
        amountOil: 0,
        createdAt: addHarnessSeconds(secondHistoryAt, 20),
      });
      createPokerPlayAuditEvent({
        tableId: nextTableId,
        handId: handTwoId,
        seatNumber: seatOne.seatNumber,
        actorRole: 'agent',
        eventKind: 'seat_agent_proposal',
        payload: {
          schemaVersion: 'poker-seat-agent-proposal-v1',
          source: 'worker-seat-agent-v1',
          actionKind: 'call',
          amountOil: 30,
          confidence: 'medium',
          body: 'Call once and re-evaluate on the river if the board pairs.',
          tableId: nextTableId,
          handId: handTwoId,
        },
        createdAt: addHarnessSeconds(secondHistoryAt, 24),
      });

      upsertPokerPlayHand({
        handId,
        tableId: nextTableId,
        handNumber: 3,
        status: 'live',
        actionExpiresAt,
        state: {
          handNumber: 3,
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
          countdownSeconds: 45,
          communityCards: [],
          seatOrder: [seatOne.seatNumber, seatTwo.seatNumber],
          seatStates: {
            [String(seatOne.seatNumber)]: {
              seatNumber: seatOne.seatNumber,
              stackOil: 420,
              holeCards: ['Qh', 'Js'],
              committedStreetOil: 10,
              committedHandOil: 10,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: false,
            },
            [String(seatTwo.seatNumber)]: {
              seatNumber: seatTwo.seatNumber,
              stackOil: 380,
              holeCards: ['8d', '8c'],
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
        createdAt: liveHistoryAt,
        updatedAt: requestAt,
      });

      upsertPokerPlayTable({
        tableId: tournamentTableId,
        slug: `${normalizedScenario}-t-${randomHex(4)}`,
        title: 'Harness Results Tournament Table',
        tableType: 'tournament',
        status: 'series_closed',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 2,
          completedAt: resultSettledAt,
          winnerSeatNumber: seatThree.seatNumber,
          prizeOil: 1500,
          prizeSettledAt: resultSettledAt,
          entryCount: 2,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatThree.address]: 1,
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
          lateRegistrationHands: 0,
          handsPerBlindLevel: 2,
          blindLevels: [
            { level: 1, smallBlindOil: 50, bigBlindOil: 100 },
          ],
          reentryLimit: 0,
          seriesId: tournamentSeriesId,
          seriesTitle: 'Harness Results Series',
          matchKey: 'tournament:history-results:harness',
        },
        summary: {
          headline: 'Harness results story.',
          seriesId: tournamentSeriesId,
          seriesTitle: 'Harness Results Series',
        },
        createdAt: addHarnessSeconds(requestAt, -600),
        updatedAt: resultSettledAt,
      });
      upsertPokerPlaySeat({
        tableId: tournamentTableId,
        seatNumber: seatOne.seatNumber,
        portalSessionId: `harness_${seatOne.address}`,
        houseId: seatOne.houseId,
        walletSubject: seatOne.address,
        displayName: seatOne.displayName,
        status: 'paid',
        buyInOil: 600,
        stackOil: 0,
        prizeOil: 450,
        finishPosition: 2,
        payoutSettledAt: resultSettledAt,
        eliminatedAt: addHarnessSeconds(resultSettledAt, -20),
        lastSeenAt: resultSettledAt,
        disconnectedAt: null,
        createdAt: addHarnessSeconds(requestAt, -600),
        updatedAt: resultSettledAt,
      });
      upsertPokerPlaySeat({
        tableId: tournamentTableId,
        seatNumber: seatThree.seatNumber,
        portalSessionId: `harness_${seatThree.address}`,
        houseId: seatThree.houseId,
        walletSubject: seatThree.address,
        displayName: seatThree.displayName,
        status: 'paid',
        buyInOil: 600,
        stackOil: 0,
        prizeOil: 1050,
        finishPosition: 1,
        payoutSettledAt: resultSettledAt,
        lastSeenAt: resultSettledAt,
        disconnectedAt: null,
        createdAt: addHarnessSeconds(requestAt, -600),
        updatedAt: resultSettledAt,
      });
      seededSeriesId = tournamentSeriesId;
      seededTableIds.push(nextTableId, tournamentTableId);
    } else if (normalizedScenario === 'series_timeline_story') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      const seriesId = `pkseries_harness_timeline_${randomHex(6)}`;
      const tableAId = nextTableId;
      const tableBId = `${nextTableId}_b`;
      const handAId = `${handId}_a`;
      const handBId = `${handId}_b`;
      const timelineStartAt = addHarnessSeconds(requestAt, -120);
      const closeAt = addHarnessSeconds(requestAt, -10);
      const sharedRules = {
        mode: 'no_limit_holdem',
        format: 'tournament',
        maxSeats: 6,
        decisionCountdownSeconds: 45,
        presenceTimeoutSeconds: 30,
        reconnectGraceSeconds: 90,
        timeBankSeconds: 15,
        cashOutEnabled: false,
        payoutModel: 'top2_70_30',
        lateRegistrationHands: 0,
        handsPerBlindLevel: 2,
        blindLevels: [
          { level: 1, smallBlindOil: 50, bigBlindOil: 100 },
        ],
        reentryLimit: 0,
        seriesId,
        seriesTitle: 'Harness Timeline Series',
        matchKey: 'tournament:timeline:harness',
      };
      upsertPokerPlayTable({
        tableId: tableAId,
        slug: `${normalizedScenario}-a-${randomHex(4)}`,
        title: 'Harness Timeline Table A',
        tableType: 'tournament',
        status: 'series_closed',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 3,
          completedAt: closeAt,
          winnerSeatNumber: seatOne.seatNumber,
          prizeOil: 1200,
          prizeSettledAt: addHarnessSeconds(requestAt, -20),
          closeReason: 'Harness timeline series closed after final review.',
          closedBy: 'operator',
          closedAt: closeAt,
          refundedSeatCount: 1,
          refundedTotalOil: 300,
          refundMode: 'tournament_refund',
          entryCount: 3,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatTwo.address]: 1,
            [seatThree.address]: 1,
          },
        },
        rules: sharedRules,
        summary: {
          headline: 'Harness timeline story.',
          seriesId,
          seriesTitle: 'Harness Timeline Series',
        },
        createdAt: timelineStartAt,
        updatedAt: closeAt,
      });
      upsertPokerPlayTable({
        tableId: tableBId,
        slug: `${normalizedScenario}-b-${randomHex(4)}`,
        title: 'Harness Timeline Table B',
        tableType: 'tournament',
        status: 'admin_closed',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 1,
          completedAt: addHarnessSeconds(requestAt, -30),
          winnerSeatNumber: 0,
          prizeOil: 0,
          prizeSettledAt: null,
          closeReason: 'Harness table break complete.',
          closedBy: 'operator',
          closedAt: addHarnessSeconds(requestAt, -30),
          refundedSeatCount: 0,
          refundedTotalOil: 0,
          refundMode: 'none',
          entryCount: 1,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatThree.address]: 1,
          },
        },
        rules: sharedRules,
        summary: {
          headline: 'Harness timeline story.',
          seriesId,
          seriesTitle: 'Harness Timeline Series',
        },
        createdAt: timelineStartAt,
        updatedAt: addHarnessSeconds(requestAt, -30),
      });
      [
        { tableId: tableAId, actor: seatOne, status: 'paid', prizeOil: 900, finishPosition: 1 },
        { tableId: tableAId, actor: seatTwo, status: 'void_refund', prizeOil: 0, finishPosition: 2 },
        { tableId: tableBId, actor: seatThree, status: 'busted', prizeOil: 0, finishPosition: 3 },
      ].forEach(({ tableId: seededTableId, actor, status, prizeOil, finishPosition }) => {
        upsertPokerPlaySeat({
          tableId: seededTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status,
          buyInOil: 600,
          stackOil: 0,
          prizeOil,
          finishPosition,
          payoutSettledAt: prizeOil > 0 ? addHarnessSeconds(requestAt, -20) : null,
          eliminatedAt: status === 'paid' ? null : addHarnessSeconds(requestAt, -40),
          lastSeenAt: closeAt,
          disconnectedAt: null,
          createdAt: timelineStartAt,
          updatedAt: closeAt,
        });
      });
      upsertPokerPlayHand({
        handId: handAId,
        tableId: tableAId,
        handNumber: 3,
        status: 'completed',
        actionExpiresAt: addHarnessSeconds(requestAt, -80),
        state: {
          handNumber: 3,
          tableType: 'tournament',
          blindLevel: 2,
          handsPerBlindLevel: 2,
          buttonSeat: seatOne.seatNumber,
          smallBlindSeat: seatTwo.seatNumber,
          bigBlindSeat: seatOne.seatNumber,
          actingSeat: 0,
          street: 'river',
          phase: 'river',
          status: 'completed',
          countdownSeconds: 45,
          communityCards: ['As', 'Kd', 'Qc', '7h', '2d'],
          seatOrder: [seatOne.seatNumber, seatTwo.seatNumber],
          seatStates: {
            [String(seatOne.seatNumber)]: {
              seatNumber: seatOne.seatNumber,
              stackOil: 0,
              holeCards: ['Ah', 'Ad'],
              committedStreetOil: 0,
              committedHandOil: 600,
              folded: false,
              allIn: true,
              eliminated: false,
              actedStreet: true,
            },
            [String(seatTwo.seatNumber)]: {
              seatNumber: seatTwo.seatNumber,
              stackOil: 0,
              holeCards: ['Kh', 'Kd'],
              committedStreetOil: 0,
              committedHandOil: 300,
              folded: false,
              allIn: true,
              eliminated: true,
              actedStreet: true,
            },
          },
          pendingSeatNumbers: [],
          potOil: 900,
          currentBetOil: 0,
          lastRaiseSizeOil: 0,
          minRaiseToOil: 0,
          bigBlindOil: 100,
          actionExpiresAt: addHarnessSeconds(requestAt, -80),
          result: null,
        },
        result: {
          winningSeatNumbers: [seatOne.seatNumber],
          payouts: [
            { seatNumber: seatOne.seatNumber, amountOil: 900 },
          ],
          note: `${seatOne.displayName} wins the final table.`,
        },
        createdAt: addHarnessSeconds(requestAt, -90),
        updatedAt: addHarnessSeconds(requestAt, -70),
      });
      upsertPokerPlayHand({
        handId: handBId,
        tableId: tableBId,
        handNumber: 1,
        status: 'completed',
        actionExpiresAt: addHarnessSeconds(requestAt, -105),
        state: {
          handNumber: 1,
          tableType: 'tournament',
          blindLevel: 1,
          handsPerBlindLevel: 2,
          buttonSeat: seatThree.seatNumber,
          smallBlindSeat: seatThree.seatNumber,
          bigBlindSeat: seatThree.seatNumber,
          actingSeat: 0,
          street: 'turn',
          phase: 'turn',
          status: 'completed',
          countdownSeconds: 45,
          communityCards: ['Td', '9d', '4s', '2h'],
          seatOrder: [seatThree.seatNumber],
          seatStates: {
            [String(seatThree.seatNumber)]: {
              seatNumber: seatThree.seatNumber,
              stackOil: 0,
              holeCards: ['7c', '7d'],
              committedStreetOil: 0,
              committedHandOil: 300,
              folded: false,
              allIn: true,
              eliminated: true,
              actedStreet: true,
            },
          },
          pendingSeatNumbers: [],
          potOil: 300,
          currentBetOil: 0,
          lastRaiseSizeOil: 0,
          minRaiseToOil: 0,
          bigBlindOil: 100,
          actionExpiresAt: addHarnessSeconds(requestAt, -105),
          result: null,
        },
        result: {
          winningSeatNumbers: [seatThree.seatNumber],
          payouts: [
            { seatNumber: seatThree.seatNumber, amountOil: 300 },
          ],
          note: `${seatThree.displayName} wins the broken table.`,
        },
        createdAt: addHarnessSeconds(requestAt, -110),
        updatedAt: addHarnessSeconds(requestAt, -95),
      });
      [
        {
          tableId: tableAId,
          handId: handAId,
          seatNumber: null,
          actorRole: 'operator',
          eventKind: 'director_table_started',
          createdAt: addHarnessSeconds(requestAt, -120),
          payload: { seriesId, tableId: tableAId, reason: 'Director started the final table.' },
        },
        {
          tableId: tableAId,
          handId: handAId,
          seatNumber: seatOne.seatNumber,
          actorRole: 'agent',
          eventKind: 'seat_agent_proposal',
          createdAt: addHarnessSeconds(requestAt, -110),
          payload: {
            seriesId,
            tableId: tableAId,
            handId: handAId,
            actionKind: 'raise',
            amountOil: 300,
            confidence: 'high',
            body: 'Jam the turn and deny the redraw.',
          },
        },
        {
          tableId: tableAId,
          handId: handAId,
          seatNumber: null,
          actorRole: 'operator',
          eventKind: 'director_registration_closed',
          createdAt: addHarnessSeconds(requestAt, -100),
          payload: { seriesId, tableId: tableAId, reason: 'Registration closed before final-table play.' },
        },
        {
          tableId: tableAId,
          handId: handAId,
          seatNumber: seatTwo.seatNumber,
          actorRole: 'player',
          eventKind: 'dispute_opened',
          createdAt: addHarnessSeconds(requestAt, -90),
          payload: { seriesId, handId: handAId, reason: 'Player challenged the action order.' },
        },
        {
          tableId: tableAId,
          handId: handAId,
          seatNumber: seatTwo.seatNumber,
          actorRole: 'operator',
          eventKind: 'dispute_resolved',
          createdAt: addHarnessSeconds(requestAt, -80),
          payload: { seriesId, handId: handAId, status: 'resolved', reason: 'Operator confirmed the action order.' },
        },
        {
          tableId: tableBId,
          handId: handBId,
          seatNumber: seatThree.seatNumber,
          actorRole: 'operator',
          eventKind: 'director_seat_moved',
          createdAt: addHarnessSeconds(requestAt, -70),
          payload: { seriesId, tableId: tableBId, reason: 'Seat moved to the final table.', targetTableId: tableAId },
        },
        {
          tableId: tableBId,
          handId: handBId,
          seatNumber: null,
          actorRole: 'operator',
          eventKind: 'director_table_broken',
          createdAt: addHarnessSeconds(requestAt, -60),
          payload: { seriesId, tableId: tableBId, reason: 'Table B collapsed into the final table.' },
        },
        {
          tableId: tableAId,
          handId: handAId,
          seatNumber: seatOne.seatNumber,
          actorRole: 'system',
          eventKind: 'tournament_payout_paid',
          createdAt: addHarnessSeconds(requestAt, -50),
          payload: { seriesId, handId: handAId, status: 'paid', amountOil: 900, reason: 'Final-table payout settled.' },
        },
        {
          tableId: tableAId,
          handId: handAId,
          seatNumber: seatTwo.seatNumber,
          actorRole: 'system',
          eventKind: 'tournament_refund_issued',
          createdAt: addHarnessSeconds(requestAt, -40),
          payload: { seriesId, handId: handAId, amountOil: 300, reason: 'Tournament refund issued after review.' },
        },
        {
          tableId: tableAId,
          handId: handAId,
          seatNumber: null,
          actorRole: 'operator',
          eventKind: 'table_closed',
          createdAt: addHarnessSeconds(requestAt, -30),
          payload: { seriesId, tableId: tableAId, reason: 'Series closed after payout and refund review.' },
        },
      ].forEach((event) => createPokerPlayAuditEvent(event));
      seededSeriesId = seriesId;
      seededTableIds.push(tableAId, tableBId);
    } else if (normalizedScenario === 'integrity_flag_story') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      upsertPokerPlayTable({
        tableId: nextTableId,
        slug: `${normalizedScenario}-${randomHex(4)}`,
        title: 'Harness Integrity Table',
        tableType: 'cash',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 25,
        bigBlindOil: 50,
        buyInOil: 400,
        minPlayers: 2,
        state: {
          activeHandId: handId,
          activeHandNumber: 4,
          lastButtonSeat: seatThree.seatNumber,
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
          headline: 'Harness integrity queue scenario.',
        },
        createdAt: addHarnessSeconds(requestAt, -180),
        updatedAt: requestAt,
      });
      [
        { actor: seatOne, stackOil: 375 },
        { actor: seatTwo, stackOil: 350 },
        { actor: seatThree, stackOil: 475 },
      ].forEach(({ actor, stackOil }) => {
        upsertPokerPlaySeat({
          tableId: nextTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'active',
          buyInOil: 400,
          stackOil,
          lastSeenAt: requestAt,
          disconnectedAt: null,
          createdAt: addHarnessSeconds(requestAt, -180),
          updatedAt: requestAt,
        });
      });
      upsertPokerPlayHand({
        handId,
        tableId: nextTableId,
        handNumber: 4,
        status: 'live',
        actionExpiresAt,
        state: {
          handNumber: 4,
          tableType: 'cash',
          blindLevel: 0,
          handsPerBlindLevel: 0,
          buttonSeat: seatThree.seatNumber,
          smallBlindSeat: seatOne.seatNumber,
          bigBlindSeat: seatTwo.seatNumber,
          actingSeat: seatThree.seatNumber,
          street: 'turn',
          phase: 'turn',
          status: 'live',
          countdownSeconds: 45,
          communityCards: ['Qs', 'Td', '8h', '3c'],
          seatOrder: [seatOne.seatNumber, seatTwo.seatNumber, seatThree.seatNumber],
          seatStates: {
            [String(seatOne.seatNumber)]: {
              seatNumber: seatOne.seatNumber,
              stackOil: 375,
              holeCards: ['Ah', 'Ac'],
              committedStreetOil: 25,
              committedHandOil: 25,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: true,
            },
            [String(seatTwo.seatNumber)]: {
              seatNumber: seatTwo.seatNumber,
              stackOil: 350,
              holeCards: ['Kh', 'Kd'],
              committedStreetOil: 50,
              committedHandOil: 50,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: true,
            },
            [String(seatThree.seatNumber)]: {
              seatNumber: seatThree.seatNumber,
              stackOil: 475,
              holeCards: ['9c', '9d'],
              committedStreetOil: 0,
              committedHandOil: 0,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: false,
            },
          },
          pendingSeatNumbers: [seatThree.seatNumber],
          potOil: 75,
          currentBetOil: 50,
          lastRaiseSizeOil: 25,
          minRaiseToOil: 100,
          bigBlindOil: 50,
          actionExpiresAt,
          result: null,
        },
        result: {},
        createdAt: addHarnessSeconds(requestAt, -120),
        updatedAt: requestAt,
      });
      [
        {
          seatNumber: seatOne.seatNumber,
          authorRole: 'human',
          body: 'Do not leak this private seat note outside the review queue.',
          createdAt: addHarnessSeconds(requestAt, -20),
        },
        {
          seatNumber: seatOne.seatNumber,
          authorRole: 'agent',
          body: 'Keep this private seat-agent warning inside the seat thread.',
          createdAt: addHarnessSeconds(requestAt, -15),
        },
      ].forEach((message) => createPokerPlayMessage({
        tableId: nextTableId,
        handId,
        seatNumber: message.seatNumber,
        authorRole: message.authorRole,
        body: message.body,
        createdAt: message.createdAt,
      }));
      [
        {
          disputeId: `pkdp_${randomHex(10)}`,
          tableId: nextTableId,
          handId,
          seatNumber: seatOne.seatNumber,
          houseId: seatOne.houseId,
          walletSubject: seatOne.address,
          status: 'open',
          category: 'turn_order',
          note: 'Seat order looked wrong after the shared-house action sequence.',
          createdAt: addHarnessSeconds(requestAt, -10),
          updatedAt: addHarnessSeconds(requestAt, -10),
        },
        {
          disputeId: `pkdp_${randomHex(10)}`,
          tableId: nextTableId,
          handId,
          seatNumber: seatThree.seatNumber,
          houseId: seatThree.houseId,
          walletSubject: seatThree.address,
          status: 'open',
          category: 'settlement',
          note: 'Pot ownership needs another operator look before play resumes.',
          createdAt: addHarnessSeconds(requestAt, -8),
          updatedAt: addHarnessSeconds(requestAt, -8),
        },
      ].forEach((dispute) => upsertPokerPlayDispute(dispute));
      [
        {
          tableId: nextTableId,
          handId,
          seatNumber: seatOne.seatNumber,
          actorRole: 'human',
          eventKind: 'dispute_opened',
          createdAt: addHarnessSeconds(requestAt, -10),
          payload: {
            category: 'turn_order',
            note: 'Seat order looked wrong after the shared-house action sequence.',
          },
        },
        {
          tableId: nextTableId,
          handId,
          seatNumber: seatThree.seatNumber,
          actorRole: 'human',
          eventKind: 'dispute_opened',
          createdAt: addHarnessSeconds(requestAt, -8),
          payload: {
            category: 'settlement',
            note: 'Pot ownership needs another operator look before play resumes.',
          },
        },
      ].forEach((event) => createPokerPlayAuditEvent(event));
    } else if (normalizedScenario === 'player_stats_story') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      const liveCashTableId = nextTableId;
      const closedCashTableId = `${nextTableId}_cash_closed`;
      const winTableId = `${nextTableId}_tournament_win`;
      const bustTableId = `${nextTableId}_tournament_bust`;
      const winSeriesId = `pkseries_harness_stats_win_${randomHex(6)}`;
      const bustSeriesId = `pkseries_harness_stats_bust_${randomHex(6)}`;
      const liveOpenedAt = addHarnessSeconds(requestAt, -120);
      const cashOpenedAt = addHarnessSeconds(requestAt, -720);
      const cashClosedAt = addHarnessSeconds(requestAt, -600);
      const winOpenedAt = addHarnessSeconds(requestAt, -540);
      const winClosedAt = addHarnessSeconds(requestAt, -420);
      const bustOpenedAt = addHarnessSeconds(requestAt, -360);
      const bustClosedAt = addHarnessSeconds(requestAt, -240);

      upsertPokerPlayTable({
        tableId: liveCashTableId,
        slug: `${normalizedScenario}-live-${randomHex(4)}`,
        title: 'Harness Stats Live Cash Table',
        tableType: 'cash',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 300,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 0,
          lastButtonSeat: seatTwo.seatNumber,
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
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 15,
          cashOutEnabled: true,
        },
        summary: {
          headline: 'Harness player-stats live cash seat.',
        },
        createdAt: liveOpenedAt,
        updatedAt: requestAt,
      });
      [
        { actor: seatOne, buyInOil: 300, stackOil: 320 },
        { actor: seatTwo, buyInOil: 300, stackOil: 280 },
      ].forEach(({ actor, buyInOil, stackOil }) => {
        upsertPokerPlaySeat({
          tableId: liveCashTableId,
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
          createdAt: liveOpenedAt,
          updatedAt: requestAt,
        });
      });
      upsertPokerPlayPlayerStat({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: liveCashTableId,
        tableType: 'cash',
        title: 'Harness Stats Live Cash Table',
        seatNumber: seatOne.seatNumber,
        displayName: seatOne.displayName,
        buyInOil: 300,
        stackOil: 320,
        status: 'open',
        openedAt: liveOpenedAt,
        createdAt: liveOpenedAt,
        updatedAt: requestAt,
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        entryKind: 'poker_play_buy_in',
        direction: 'debit',
        amount: 300,
        memo: 'Harness stats live cash buy-in',
        createdAt: liveOpenedAt,
      });

      upsertPokerPlayTable({
        tableId: closedCashTableId,
        slug: `${normalizedScenario}-cash-${randomHex(4)}`,
        title: 'Harness Stats Closed Cash Table',
        tableType: 'cash',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 400,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 2,
          lastButtonSeat: seatOne.seatNumber,
          prizePoolOil: 0,
          settlementLedgerEntryId: null,
          timeBankRemainingBySeat: {},
          completedAt: cashClosedAt,
        },
        rules: {
          mode: 'no_limit_holdem',
          format: 'cash',
          maxSeats: 6,
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 15,
          cashOutEnabled: true,
        },
        summary: {
          headline: 'Harness settled cash session for player stats.',
        },
        createdAt: cashOpenedAt,
        updatedAt: cashClosedAt,
      });
      upsertPokerPlayPlayerStat({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: closedCashTableId,
        tableType: 'cash',
        title: 'Harness Stats Closed Cash Table',
        seatNumber: seatOne.seatNumber,
        displayName: seatOne.displayName,
        buyInOil: 400,
        reloadOil: 100,
        cashoutOil: 560,
        stackOil: 0,
        status: 'cashed_out',
        openedAt: cashOpenedAt,
        closedAt: cashClosedAt,
        createdAt: cashOpenedAt,
        updatedAt: cashClosedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        entryKind: 'poker_play_buy_in',
        direction: 'debit',
        amount: 400,
        memo: 'Harness stats closed cash buy-in',
        createdAt: cashOpenedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        entryKind: 'poker_play_reload',
        direction: 'debit',
        amount: 100,
        memo: 'Harness stats closed cash reload',
        createdAt: addHarnessSeconds(cashOpenedAt, 60),
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        entryKind: 'poker_play_cashout',
        direction: 'credit',
        amount: 560,
        memo: 'Harness stats closed cash cashout',
        createdAt: cashClosedAt,
      });

      const tournamentRules = (seriesId, seriesTitle) => ({
        mode: 'no_limit_holdem',
        format: 'tournament',
        maxSeats: 6,
        decisionCountdownSeconds: 45,
        presenceTimeoutSeconds: 30,
        reconnectGraceSeconds: 90,
        timeBankSeconds: 15,
        cashOutEnabled: false,
        payoutModel: 'top2_70_30',
        lateRegistrationHands: 0,
        handsPerBlindLevel: 2,
        blindLevels: [
          { level: 1, smallBlindOil: 50, bigBlindOil: 100 },
        ],
        reentryLimit: 0,
        seriesId,
        seriesTitle,
        matchKey: `tournament:stats:${seriesId}`,
      });

      upsertPokerPlayTable({
        tableId: winTableId,
        slug: `${normalizedScenario}-win-${randomHex(4)}`,
        title: 'Harness Stats Win Tournament',
        tableType: 'tournament',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 3,
          completedAt: winClosedAt,
          winnerSeatNumber: seatOne.seatNumber,
          prizeOil: 1260,
          prizePoolOil: 1800,
          prizeSettledAt: winClosedAt,
          payouts: [
            { place: 1, percent: 70, amountOil: 1260 },
            { place: 2, percent: 30, amountOil: 540 },
          ],
          standings: [],
          timeBankRemainingBySeat: {},
          entryCount: 3,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatTwo.address]: 1,
            [seatThree.address]: 1,
          },
        },
        rules: tournamentRules(winSeriesId, 'Harness Stats Win Series'),
        summary: {
          headline: 'Harness winning tournament result for player stats.',
          seriesId: winSeriesId,
          seriesTitle: 'Harness Stats Win Series',
        },
        createdAt: winOpenedAt,
        updatedAt: winClosedAt,
      });
      [
        { actor: seatOne, prizeOil: 1260, status: 'paid', eliminatedAt: null, payoutSettledAt: winClosedAt },
        { actor: seatTwo, prizeOil: 540, status: 'paid', eliminatedAt: addHarnessSeconds(winClosedAt, -10), payoutSettledAt: winClosedAt },
        { actor: seatThree, prizeOil: 0, status: 'busted', eliminatedAt: addHarnessSeconds(winClosedAt, -20), payoutSettledAt: null },
      ].forEach(({ actor, prizeOil, status, eliminatedAt, payoutSettledAt }) => {
        upsertPokerPlaySeat({
          tableId: winTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status,
          buyInOil: 600,
          stackOil: 0,
          lastSeenAt: winClosedAt,
          disconnectedAt: null,
          eliminatedAt,
          prizeOil,
          payoutSettledAt,
          createdAt: winOpenedAt,
          updatedAt: winClosedAt,
        });
      });
      upsertPokerPlayPlayerStat({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: winTableId,
        seriesId: winSeriesId,
        seriesTitle: 'Harness Stats Win Series',
        tableType: 'tournament',
        title: 'Harness Stats Win Tournament',
        seatNumber: seatOne.seatNumber,
        displayName: seatOne.displayName,
        buyInOil: 600,
        prizeOil: 1260,
        finishPosition: 1,
        stackOil: 0,
        status: 'paid',
        payoutSettledAt: winClosedAt,
        openedAt: winOpenedAt,
        closedAt: winClosedAt,
        createdAt: winOpenedAt,
        updatedAt: winClosedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        entryKind: 'poker_play_buy_in',
        direction: 'debit',
        amount: 600,
        memo: 'Harness stats tournament win buy-in',
        createdAt: winOpenedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        entryKind: 'poker_play_tournament_prize',
        direction: 'credit',
        amount: 1260,
        memo: 'Harness stats tournament win prize',
        createdAt: winClosedAt,
      });

      upsertPokerPlayTable({
        tableId: bustTableId,
        slug: `${normalizedScenario}-bust-${randomHex(4)}`,
        title: 'Harness Stats Bust Tournament',
        tableType: 'tournament',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 600,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 3,
          completedAt: bustClosedAt,
          winnerSeatNumber: seatTwo.seatNumber,
          prizeOil: 1260,
          prizePoolOil: 1800,
          prizeSettledAt: bustClosedAt,
          payouts: [
            { place: 1, percent: 70, amountOil: 1260 },
            { place: 2, percent: 30, amountOil: 540 },
          ],
          standings: [],
          timeBankRemainingBySeat: {},
          entryCount: 3,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatTwo.address]: 1,
            [seatThree.address]: 1,
          },
        },
        rules: tournamentRules(bustSeriesId, 'Harness Stats Bust Series'),
        summary: {
          headline: 'Harness busted tournament result for player stats.',
          seriesId: bustSeriesId,
          seriesTitle: 'Harness Stats Bust Series',
        },
        createdAt: bustOpenedAt,
        updatedAt: bustClosedAt,
      });
      [
        { actor: seatTwo, prizeOil: 1260, status: 'paid', eliminatedAt: null, payoutSettledAt: bustClosedAt },
        { actor: seatThree, prizeOil: 540, status: 'paid', eliminatedAt: addHarnessSeconds(bustClosedAt, -10), payoutSettledAt: bustClosedAt },
        { actor: seatOne, prizeOil: 0, status: 'busted', eliminatedAt: addHarnessSeconds(bustClosedAt, -20), payoutSettledAt: null },
      ].forEach(({ actor, prizeOil, status, eliminatedAt, payoutSettledAt }) => {
        upsertPokerPlaySeat({
          tableId: bustTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status,
          buyInOil: 600,
          stackOil: 0,
          lastSeenAt: bustClosedAt,
          disconnectedAt: null,
          eliminatedAt,
          prizeOil,
          payoutSettledAt,
          createdAt: bustOpenedAt,
          updatedAt: bustClosedAt,
        });
      });
      upsertPokerPlayPlayerStat({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: bustTableId,
        seriesId: bustSeriesId,
        seriesTitle: 'Harness Stats Bust Series',
        tableType: 'tournament',
        title: 'Harness Stats Bust Tournament',
        seatNumber: seatOne.seatNumber,
        displayName: seatOne.displayName,
        buyInOil: 600,
        prizeOil: 0,
        finishPosition: 3,
        stackOil: 0,
        status: 'busted',
        openedAt: bustOpenedAt,
        closedAt: bustClosedAt,
        createdAt: bustOpenedAt,
        updatedAt: bustClosedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        entryKind: 'poker_play_buy_in',
        direction: 'debit',
        amount: 600,
        memo: 'Harness stats tournament bust buy-in',
        createdAt: bustOpenedAt,
      });

      seededSeriesId = winSeriesId;
      seededTableIds.push(liveCashTableId, closedCashTableId, winTableId, bustTableId);
    } else if (normalizedScenario === 'ops_dashboard_story') {
      const [seatOne, seatTwo, seatThree, seatFour] = normalizedActors;
      const liveCashTableId = nextTableId;
      const pausedCashTableId = `${nextTableId}_paused_cash`;
      const liveSeriesId = `pkseries_harness_ops_live_${randomHex(6)}`;
      const liveSeriesTableAId = `${nextTableId}_series_a`;
      const liveSeriesTableBId = `${nextTableId}_series_b`;
      const refundCashTableId = `${nextTableId}_refund_cash`;
      const refundTournamentTableId = `${nextTableId}_refund_tournament`;
      const refundTournamentSeriesId = `pkseries_harness_ops_refund_${randomHex(6)}`;
      const payoutSeriesId = `pkseries_harness_ops_payout_${randomHex(6)}`;
      const payoutTableId = `${nextTableId}_payout_tournament`;
      const liveOpenedAt = addHarnessSeconds(requestAt, -900);
      const pausedOpenedAt = addHarnessSeconds(requestAt, -780);
      const seriesOpenedAt = addHarnessSeconds(requestAt, -660);
      const refundCashClosedAt = addHarnessSeconds(requestAt, -240);
      const refundTournamentClosedAt = addHarnessSeconds(requestAt, -180);
      const payoutClosedAt = addHarnessSeconds(requestAt, -120);
      const liveCashHandId = `${handId}_live_cash`;
      const pausedCashHandId = `${handId}_paused_cash`;
      const seriesHandId = `${handId}_series_live`;

      upsertPokerPlayTable({
        tableId: liveCashTableId,
        slug: `${normalizedScenario}-live-cash-${randomHex(4)}`,
        title: 'Harness Ops Live Cash Table',
        tableType: 'cash',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 400,
        minPlayers: 2,
        state: {
          activeHandId: liveCashHandId,
          activeHandNumber: 6,
          lastButtonSeat: seatTwo.seatNumber,
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
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 15,
          cashOutEnabled: true,
        },
        summary: {
          headline: 'Harness ops live cash table.',
        },
        createdAt: liveOpenedAt,
        updatedAt: requestAt,
      });
      [
        { actor: seatOne, stackOil: 420, disconnectedAt: null },
        { actor: seatTwo, stackOil: 380, disconnectedAt: addHarnessSeconds(requestAt, -40) },
      ].forEach(({ actor, stackOil, disconnectedAt }) => {
        upsertPokerPlaySeat({
          tableId: liveCashTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'active',
          buyInOil: 400,
          stackOil,
          lastSeenAt: disconnectedAt ? addHarnessSeconds(requestAt, -45) : requestAt,
          disconnectedAt,
          createdAt: liveOpenedAt,
          updatedAt: requestAt,
        });
      });
      upsertPokerPlayHand({
        handId: liveCashHandId,
        tableId: liveCashTableId,
        handNumber: 6,
        status: 'live',
        actionExpiresAt,
        state: {
          handNumber: 6,
          tableType: 'cash',
          blindLevel: 0,
          handsPerBlindLevel: 0,
          buttonSeat: seatTwo.seatNumber,
          smallBlindSeat: seatOne.seatNumber,
          bigBlindSeat: seatTwo.seatNumber,
          actingSeat: seatOne.seatNumber,
          street: 'turn',
          phase: 'turn',
          status: 'live',
          countdownSeconds: 45,
          deck: [],
          deckPosition: 0,
          communityCards: ['Ah', 'Kd', '7c', '4s'],
          seatOrder: [seatOne.seatNumber, seatTwo.seatNumber],
          seatStates: {
            [String(seatOne.seatNumber)]: {
              seatNumber: seatOne.seatNumber,
              stackOil: 420,
              holeCards: ['As', 'Qc'],
              committedStreetOil: 20,
              committedHandOil: 80,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: false,
            },
            [String(seatTwo.seatNumber)]: {
              seatNumber: seatTwo.seatNumber,
              stackOil: 380,
              holeCards: ['Kh', 'Qh'],
              committedStreetOil: 20,
              committedHandOil: 80,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: true,
            },
          },
          pendingSeatNumbers: [seatOne.seatNumber],
          potOil: 160,
          currentBetOil: 20,
          minRaiseToOil: 40,
          lastAggressorSeat: seatTwo.seatNumber,
          result: null,
        },
        createdAt: liveOpenedAt,
        updatedAt: requestAt,
      });

      upsertPokerPlayTable({
        tableId: pausedCashTableId,
        slug: `${normalizedScenario}-paused-cash-${randomHex(4)}`,
        title: 'Harness Ops Paused Cash Table',
        tableType: 'cash',
        status: 'paused',
        maxSeats: 6,
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 400,
        minPlayers: 2,
        state: {
          activeHandId: pausedCashHandId,
          activeHandNumber: 8,
          lastButtonSeat: seatThree.seatNumber,
          pausedAt: addHarnessSeconds(requestAt, -12),
          pausedBy: 'operator',
          pausedReason: 'hand review',
          prizePoolOil: 0,
          settlementLedgerEntryId: null,
          timeBankRemainingBySeat: {
            [String(seatThree.seatNumber)]: 15,
            [String(seatFour.seatNumber)]: 15,
          },
        },
        rules: {
          mode: 'no_limit_holdem',
          format: 'cash',
          maxSeats: 6,
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 15,
          cashOutEnabled: true,
        },
        summary: {
          headline: 'Harness ops paused cash table.',
        },
        createdAt: pausedOpenedAt,
        updatedAt: requestAt,
      });
      [
        { actor: seatThree, stackOil: 390, disconnectedAt: null },
        { actor: seatFour, stackOil: 410, disconnectedAt: addHarnessSeconds(requestAt, -25) },
      ].forEach(({ actor, stackOil, disconnectedAt }) => {
        upsertPokerPlaySeat({
          tableId: pausedCashTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'active',
          buyInOil: 400,
          stackOil,
          lastSeenAt: disconnectedAt ? addHarnessSeconds(requestAt, -35) : requestAt,
          disconnectedAt,
          createdAt: pausedOpenedAt,
          updatedAt: requestAt,
        });
      });
      upsertPokerPlayHand({
        handId: pausedCashHandId,
        tableId: pausedCashTableId,
        handNumber: 8,
        status: 'live',
        actionExpiresAt,
        state: {
          handNumber: 8,
          tableType: 'cash',
          blindLevel: 0,
          handsPerBlindLevel: 0,
          buttonSeat: seatThree.seatNumber,
          smallBlindSeat: seatFour.seatNumber,
          bigBlindSeat: seatThree.seatNumber,
          actingSeat: seatFour.seatNumber,
          street: 'river',
          phase: 'river',
          status: 'live',
          countdownSeconds: 45,
          deck: [],
          deckPosition: 0,
          communityCards: ['9h', '9d', '4c', '4d', '2s'],
          seatOrder: [seatThree.seatNumber, seatFour.seatNumber],
          seatStates: {
            [String(seatThree.seatNumber)]: {
              seatNumber: seatThree.seatNumber,
              stackOil: 390,
              holeCards: ['Qs', 'Qd'],
              committedStreetOil: 40,
              committedHandOil: 120,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: true,
            },
            [String(seatFour.seatNumber)]: {
              seatNumber: seatFour.seatNumber,
              stackOil: 410,
              holeCards: ['7s', '7d'],
              committedStreetOil: 40,
              committedHandOil: 120,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: false,
            },
          },
          pendingSeatNumbers: [seatFour.seatNumber],
          potOil: 240,
          currentBetOil: 40,
          minRaiseToOil: 80,
          lastAggressorSeat: seatThree.seatNumber,
          result: null,
        },
        createdAt: pausedOpenedAt,
        updatedAt: requestAt,
      });
      upsertPokerPlayDispute({
        disputeId: `pkdisp_ops_${randomHex(8)}`,
        tableId: pausedCashTableId,
        handId: pausedCashHandId,
        seatNumber: seatThree.seatNumber,
        houseId: seatThree.houseId,
        walletSubject: seatThree.address,
        status: 'open',
        category: 'turn_order',
        note: 'Seat four disconnected while action was still pending.',
        createdAt: addHarnessSeconds(requestAt, -11),
        updatedAt: addHarnessSeconds(requestAt, -11),
      });
      upsertPokerPlayIntegrityFlag({
        flagId: `pkflag_ops_${randomHex(8)}`,
        signalKey: `ops-paused-cash-${randomHex(8)}`,
        tableId: pausedCashTableId,
        handId: pausedCashHandId,
        seatNumber: seatFour.seatNumber,
        houseId: seatFour.houseId,
        walletSubject: seatFour.address,
        status: 'open',
        severity: 'medium',
        category: 'disconnect_pattern',
        summary: 'Paused table has a disconnected acting seat.',
        details: {
          reason: 'Harness ops paused cash flag.',
        },
        createdAt: addHarnessSeconds(requestAt, -10),
        updatedAt: addHarnessSeconds(requestAt, -10),
      });

      upsertPokerPlayTable({
        tableId: liveSeriesTableAId,
        slug: `${normalizedScenario}-series-a-${randomHex(4)}`,
        title: 'Harness Ops Series Alpha',
        tableType: 'tournament',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 300,
        minPlayers: 2,
        state: {
          activeHandId: seriesHandId,
          activeHandNumber: 3,
          lastButtonSeat: seatOne.seatNumber,
          entryCount: 3,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatTwo.address]: 1,
            [seatThree.address]: 1,
          },
          timeBankRemainingBySeat: {
            [String(seatOne.seatNumber)]: 15,
            [String(seatTwo.seatNumber)]: 15,
          },
        },
        rules: buildHarnessTournamentRules(liveSeriesId, 'Harness Ops Live Series', {
          lateRegistrationHands: 1,
        }),
        summary: {
          headline: 'Harness ops live tournament series table A.',
          seriesId: liveSeriesId,
          seriesTitle: 'Harness Ops Live Series',
        },
        createdAt: seriesOpenedAt,
        updatedAt: requestAt,
      });
      [
        { actor: seatOne, stackOil: 320, status: 'active' },
        { actor: seatTwo, stackOil: 280, status: 'active' },
      ].forEach(({ actor, stackOil, status }) => {
        upsertPokerPlaySeat({
          tableId: liveSeriesTableAId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status,
          buyInOil: 300,
          stackOil,
          lastSeenAt: requestAt,
          disconnectedAt: null,
          createdAt: seriesOpenedAt,
          updatedAt: requestAt,
        });
      });
      upsertPokerPlayHand({
        handId: seriesHandId,
        tableId: liveSeriesTableAId,
        handNumber: 3,
        status: 'live',
        actionExpiresAt,
        state: {
          handNumber: 3,
          tableType: 'tournament',
          blindLevel: 2,
          handsPerBlindLevel: 2,
          buttonSeat: seatOne.seatNumber,
          smallBlindSeat: seatTwo.seatNumber,
          bigBlindSeat: seatOne.seatNumber,
          actingSeat: seatTwo.seatNumber,
          street: 'flop',
          phase: 'flop',
          status: 'live',
          countdownSeconds: 45,
          deck: [],
          deckPosition: 0,
          communityCards: ['Ad', 'Ts', '5c'],
          seatOrder: [seatOne.seatNumber, seatTwo.seatNumber],
          seatStates: {
            [String(seatOne.seatNumber)]: {
              seatNumber: seatOne.seatNumber,
              stackOil: 320,
              holeCards: ['Ac', 'Jc'],
              committedStreetOil: 100,
              committedHandOil: 100,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: true,
            },
            [String(seatTwo.seatNumber)]: {
              seatNumber: seatTwo.seatNumber,
              stackOil: 280,
              holeCards: ['Ks', 'Qh'],
              committedStreetOil: 100,
              committedHandOil: 100,
              folded: false,
              allIn: false,
              eliminated: false,
              actedStreet: false,
            },
          },
          pendingSeatNumbers: [seatTwo.seatNumber],
          potOil: 200,
          currentBetOil: 100,
          minRaiseToOil: 200,
          lastAggressorSeat: seatOne.seatNumber,
          result: null,
        },
        createdAt: seriesOpenedAt,
        updatedAt: requestAt,
      });
      upsertPokerPlayDispute({
        disputeId: `pkdisp_ops_${randomHex(8)}`,
        tableId: liveSeriesTableAId,
        handId: seriesHandId,
        seatNumber: seatOne.seatNumber,
        houseId: seatOne.houseId,
        walletSubject: seatOne.address,
        status: 'open',
        category: 'bet_size',
        note: 'Tournament raise size needs operator confirmation.',
        createdAt: addHarnessSeconds(requestAt, -9),
        updatedAt: addHarnessSeconds(requestAt, -9),
      });
      upsertPokerPlayIntegrityFlag({
        flagId: `pkflag_ops_${randomHex(8)}`,
        signalKey: `ops-series-a-${randomHex(8)}`,
        tableId: liveSeriesTableAId,
        seriesId: liveSeriesId,
        handId: seriesHandId,
        seatNumber: seatOne.seatNumber,
        houseId: seatOne.houseId,
        walletSubject: seatOne.address,
        status: 'open',
        severity: 'medium',
        category: 'soft_play_pattern',
        summary: 'Tournament table A triggered a soft-play heuristic.',
        details: {
          reason: 'Harness ops tournament flag A.',
        },
        createdAt: addHarnessSeconds(requestAt, -8),
        updatedAt: addHarnessSeconds(requestAt, -8),
      });

      upsertPokerPlayTable({
        tableId: liveSeriesTableBId,
        slug: `${normalizedScenario}-series-b-${randomHex(4)}`,
        title: 'Harness Ops Series Bravo',
        tableType: 'tournament',
        status: 'open',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 300,
        minPlayers: 2,
        state: {
          activeHandId: null,
          activeHandNumber: 2,
          lastButtonSeat: seatThree.seatNumber,
          entryCount: 3,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatTwo.address]: 1,
            [seatThree.address]: 1,
          },
          timeBankRemainingBySeat: {},
        },
        rules: buildHarnessTournamentRules(liveSeriesId, 'Harness Ops Live Series', {
          lateRegistrationHands: 1,
        }),
        summary: {
          headline: 'Harness ops live tournament series table B.',
          seriesId: liveSeriesId,
          seriesTitle: 'Harness Ops Live Series',
        },
        createdAt: seriesOpenedAt,
        updatedAt: requestAt,
      });
      upsertPokerPlaySeat({
        tableId: liveSeriesTableBId,
        seatNumber: seatThree.seatNumber,
        portalSessionId: `harness_${seatThree.address}`,
        houseId: seatThree.houseId,
        walletSubject: seatThree.address,
        displayName: seatThree.displayName,
        status: 'registered',
        buyInOil: 300,
        stackOil: 300,
        lastSeenAt: requestAt,
        disconnectedAt: null,
        createdAt: seriesOpenedAt,
        updatedAt: requestAt,
      });
      upsertPokerPlayIntegrityFlag({
        flagId: `pkflag_ops_${randomHex(8)}`,
        signalKey: `ops-series-b-${randomHex(8)}`,
        tableId: liveSeriesTableBId,
        seriesId: liveSeriesId,
        seatNumber: seatThree.seatNumber,
        houseId: seatThree.houseId,
        walletSubject: seatThree.address,
        status: 'open',
        severity: 'low',
        category: 'wallet_overlap',
        summary: 'Tournament table B triggered a wallet-overlap heuristic.',
        details: {
          reason: 'Harness ops tournament flag B.',
        },
        createdAt: addHarnessSeconds(requestAt, -7),
        updatedAt: addHarnessSeconds(requestAt, -7),
      });

      upsertPokerPlayTable({
        tableId: refundCashTableId,
        slug: `${normalizedScenario}-refund-cash-${randomHex(4)}`,
        title: 'Harness Ops Refund Cash Table',
        tableType: 'cash',
        status: 'admin_closed',
        maxSeats: 6,
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 500,
        minPlayers: 2,
        state: {
          closedAt: refundCashClosedAt,
          closedBy: 'operator',
          closeReason: 'Harness refund audit complete.',
          refundMode: 'cash_stack',
          refundedSeatCount: 1,
          refundedTotalOil: 500,
        },
        rules: {
          mode: 'no_limit_holdem',
          format: 'cash',
          maxSeats: 6,
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 15,
          cashOutEnabled: true,
        },
        summary: {
          headline: 'Harness ops historical cash refund table.',
        },
        createdAt: addHarnessSeconds(requestAt, -420),
        updatedAt: refundCashClosedAt,
      });
      upsertPokerPlayPlayerStat({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: refundCashTableId,
        tableType: 'cash',
        title: 'Harness Ops Refund Cash Table',
        seatNumber: seatOne.seatNumber,
        displayName: seatOne.displayName,
        buyInOil: 500,
        refundOil: 500,
        stackOil: 0,
        status: 'closed_refund',
        openedAt: addHarnessSeconds(requestAt, -420),
        closedAt: refundCashClosedAt,
        createdAt: addHarnessSeconds(requestAt, -420),
        updatedAt: refundCashClosedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: refundCashTableId,
        entryKind: 'poker_play_buy_in',
        direction: 'debit',
        amount: 500,
        memo: 'Harness ops refund cash buy-in',
        createdAt: addHarnessSeconds(requestAt, -420),
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: refundCashTableId,
        entryKind: 'poker_play_admin_refund',
        direction: 'credit',
        amount: 500,
        memo: 'Harness ops refund cash admin refund',
        createdAt: refundCashClosedAt,
      });

      upsertPokerPlayTable({
        tableId: refundTournamentTableId,
        slug: `${normalizedScenario}-refund-tournament-${randomHex(4)}`,
        title: 'Harness Ops Refund Tournament',
        tableType: 'tournament',
        status: 'series_closed',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 300,
        minPlayers: 2,
        state: {
          completedAt: refundTournamentClosedAt,
          refundedSeatCount: 1,
          refundedTotalOil: 300,
          refundMode: 'buy_in',
        },
        rules: buildHarnessTournamentRules(refundTournamentSeriesId, 'Harness Ops Refund Series'),
        summary: {
          headline: 'Harness ops historical tournament refund table.',
        },
        createdAt: addHarnessSeconds(requestAt, -360),
        updatedAt: refundTournamentClosedAt,
      });
      upsertPokerPlayPlayerStat({
        walletSubject: seatTwo.address,
        houseId: seatTwo.houseId,
        tableId: refundTournamentTableId,
        seriesId: refundTournamentSeriesId,
        seriesTitle: 'Harness Ops Refund Series',
        tableType: 'tournament',
        title: 'Harness Ops Refund Tournament',
        seatNumber: seatTwo.seatNumber,
        displayName: seatTwo.displayName,
        buyInOil: 300,
        refundOil: 300,
        stackOil: 0,
        status: 'void_refund',
        openedAt: addHarnessSeconds(requestAt, -360),
        closedAt: refundTournamentClosedAt,
        createdAt: addHarnessSeconds(requestAt, -360),
        updatedAt: refundTournamentClosedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatTwo.address,
        houseId: seatTwo.houseId,
        tableId: refundTournamentTableId,
        seriesId: refundTournamentSeriesId,
        entryKind: 'poker_play_buy_in',
        direction: 'debit',
        amount: 300,
        memo: 'Harness ops refund tournament buy-in',
        createdAt: addHarnessSeconds(requestAt, -360),
      });
      createOilLedgerEntry({
        walletSubject: seatTwo.address,
        houseId: seatTwo.houseId,
        tableId: refundTournamentTableId,
        seriesId: refundTournamentSeriesId,
        entryKind: 'poker_play_tournament_refund',
        direction: 'credit',
        amount: 300,
        memo: 'Harness ops refund tournament credit',
        createdAt: refundTournamentClosedAt,
      });

      upsertPokerPlayTable({
        tableId: payoutTableId,
        slug: `${normalizedScenario}-payout-${randomHex(4)}`,
        title: 'Harness Ops Payout Tournament',
        tableType: 'tournament',
        status: 'series_closed',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 400,
        minPlayers: 2,
        state: {
          completedAt: payoutClosedAt,
          winnerSeatNumber: seatThree.seatNumber,
          prizePoolOil: 1200,
          payouts: [
            { place: 1, percent: 70, amountOil: 840 },
            { place: 2, percent: 30, amountOil: 360 },
          ],
          standings: [],
          entryCount: 3,
          reentryCount: 0,
        },
        rules: buildHarnessTournamentRules(payoutSeriesId, 'Harness Ops Payout Series'),
        summary: {
          headline: 'Harness ops historical payout tournament.',
          seriesId: payoutSeriesId,
          seriesTitle: 'Harness Ops Payout Series',
        },
        createdAt: addHarnessSeconds(requestAt, -300),
        updatedAt: payoutClosedAt,
      });
      [
        { actor: seatThree, finishPosition: 1, prizeOil: 840, eliminatedAt: null },
        { actor: seatFour, finishPosition: 2, prizeOil: 360, eliminatedAt: addHarnessSeconds(payoutClosedAt, -10) },
      ].forEach(({ actor, finishPosition, prizeOil, eliminatedAt }) => {
        upsertPokerPlaySeat({
          tableId: payoutTableId,
          seatNumber: actor.seatNumber,
          portalSessionId: `harness_${actor.address}`,
          houseId: actor.houseId,
          walletSubject: actor.address,
          displayName: actor.displayName,
          status: 'paid',
          buyInOil: 400,
          stackOil: 0,
          lastSeenAt: payoutClosedAt,
          disconnectedAt: null,
          eliminatedAt,
          prizeOil,
          payoutSettledAt: payoutClosedAt,
          createdAt: addHarnessSeconds(requestAt, -300),
          updatedAt: payoutClosedAt,
        });
        upsertPokerPlayPlayerStat({
          walletSubject: actor.address,
          houseId: actor.houseId,
          tableId: payoutTableId,
          seriesId: payoutSeriesId,
          seriesTitle: 'Harness Ops Payout Series',
          tableType: 'tournament',
          title: 'Harness Ops Payout Tournament',
          seatNumber: actor.seatNumber,
          displayName: actor.displayName,
          buyInOil: 400,
          prizeOil,
          finishPosition,
          stackOil: 0,
          status: 'paid',
          payoutSettledAt: payoutClosedAt,
          openedAt: addHarnessSeconds(requestAt, -300),
          closedAt: payoutClosedAt,
          createdAt: addHarnessSeconds(requestAt, -300),
          updatedAt: payoutClosedAt,
        });
        createOilLedgerEntry({
          walletSubject: actor.address,
          houseId: actor.houseId,
          tableId: payoutTableId,
          seriesId: payoutSeriesId,
          entryKind: 'poker_play_buy_in',
          direction: 'debit',
          amount: 400,
          memo: `Harness ops payout buy-in for ${actor.displayName}`,
          createdAt: addHarnessSeconds(requestAt, -300),
        });
        createOilLedgerEntry({
          walletSubject: actor.address,
          houseId: actor.houseId,
          tableId: payoutTableId,
          seriesId: payoutSeriesId,
          entryKind: 'poker_play_tournament_prize',
          direction: 'credit',
          amount: prizeOil,
          memo: `Harness ops payout prize for ${actor.displayName}`,
          createdAt: payoutClosedAt,
        });
      });

      seededSeriesId = liveSeriesId;
      seededTableIds.push(
        liveCashTableId,
        pausedCashTableId,
        liveSeriesTableAId,
        liveSeriesTableBId,
        refundCashTableId,
        refundTournamentTableId,
        payoutTableId
      );
    } else if (normalizedScenario === 'ledger_reconciliation_story' || normalizedScenario === 'ledger_reconciliation_corrupt_story') {
      const [seatOne, seatTwo] = normalizedActors;
      const corrupt = normalizedScenario === 'ledger_reconciliation_corrupt_story';
      const cashTableId = nextTableId;
      const tournamentSeriesId = `pkseries_harness_reconcile_${randomHex(6)}`;
      const tournamentTableId = `${nextTableId}_tournament`;
      const cashOpenedAt = addHarnessSeconds(requestAt, -600);
      const cashClosedAt = addHarnessSeconds(requestAt, -420);
      const tournamentOpenedAt = addHarnessSeconds(requestAt, -360);
      const tournamentClosedAt = addHarnessSeconds(requestAt, -180);

      upsertPokerPlayTable({
        tableId: cashTableId,
        slug: `${normalizedScenario}-cash-${randomHex(4)}`,
        title: 'Harness Reconcile Cash Table',
        tableType: 'cash',
        status: 'admin_closed',
        maxSeats: 6,
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 400,
        minPlayers: 2,
        state: {
          closedAt: cashClosedAt,
          closedBy: 'operator',
          closeReason: 'Harness reconciliation cash settled.',
        },
        rules: {
          mode: 'no_limit_holdem',
          format: 'cash',
          maxSeats: 6,
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 15,
          cashOutEnabled: true,
        },
        summary: {
          headline: 'Harness reconciliation cash result.',
        },
        createdAt: cashOpenedAt,
        updatedAt: cashClosedAt,
      });
      upsertPokerPlayPlayerStat({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: cashTableId,
        tableType: 'cash',
        title: 'Harness Reconcile Cash Table',
        seatNumber: seatOne.seatNumber,
        displayName: seatOne.displayName,
        buyInOil: 400,
        reloadOil: 50,
        cashoutOil: 470,
        stackOil: 0,
        status: 'cashed_out',
        openedAt: cashOpenedAt,
        closedAt: cashClosedAt,
        createdAt: cashOpenedAt,
        updatedAt: cashClosedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: cashTableId,
        entryKind: 'poker_play_buy_in',
        direction: 'debit',
        amount: 400,
        memo: 'Harness reconcile cash buy-in',
        createdAt: cashOpenedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: cashTableId,
        entryKind: 'poker_play_reload',
        direction: 'debit',
        amount: corrupt ? 75 : 50,
        memo: 'Harness reconcile cash reload',
        createdAt: addHarnessSeconds(cashOpenedAt, 60),
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: cashTableId,
        entryKind: 'poker_play_cashout',
        direction: 'credit',
        amount: 470,
        memo: 'Harness reconcile cash cashout',
        createdAt: cashClosedAt,
      });
      if (corrupt) {
        createOilLedgerEntry({
          walletSubject: seatOne.address,
          houseId: seatOne.houseId,
          tableId: cashTableId,
          entryKind: 'poker_play_admin_refund',
          direction: 'credit',
          amount: 20,
          memo: 'Harness reconcile unexpected refund',
          createdAt: addHarnessSeconds(cashClosedAt, 5),
        });
      }

      upsertPokerPlayTable({
        tableId: tournamentTableId,
        slug: `${normalizedScenario}-tournament-${randomHex(4)}`,
        title: 'Harness Reconcile Tournament',
        tableType: 'tournament',
        status: 'series_closed',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 300,
        minPlayers: 2,
        state: {
          completedAt: tournamentClosedAt,
          winnerSeatNumber: seatTwo.seatNumber,
          prizePoolOil: 600,
          payouts: [
            { place: 1, percent: 70, amountOil: 420 },
            { place: 2, percent: 30, amountOil: 180 },
          ],
        },
        rules: buildHarnessTournamentRules(tournamentSeriesId, 'Harness Reconcile Series'),
        summary: {
          headline: 'Harness reconciliation tournament result.',
          seriesId: tournamentSeriesId,
          seriesTitle: 'Harness Reconcile Series',
        },
        createdAt: tournamentOpenedAt,
        updatedAt: tournamentClosedAt,
      });
      upsertPokerPlayPlayerStat({
        walletSubject: seatTwo.address,
        houseId: seatTwo.houseId,
        tableId: tournamentTableId,
        seriesId: tournamentSeriesId,
        seriesTitle: 'Harness Reconcile Series',
        tableType: 'tournament',
        title: 'Harness Reconcile Tournament',
        seatNumber: seatTwo.seatNumber,
        displayName: seatTwo.displayName,
        buyInOil: 300,
        prizeOil: 420,
        finishPosition: 1,
        stackOil: 0,
        status: 'paid',
        payoutSettledAt: tournamentClosedAt,
        openedAt: tournamentOpenedAt,
        closedAt: tournamentClosedAt,
        createdAt: tournamentOpenedAt,
        updatedAt: tournamentClosedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatTwo.address,
        houseId: seatTwo.houseId,
        tableId: tournamentTableId,
        seriesId: tournamentSeriesId,
        entryKind: 'poker_play_buy_in',
        direction: 'debit',
        amount: 300,
        memo: 'Harness reconcile tournament buy-in',
        createdAt: tournamentOpenedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatTwo.address,
        houseId: seatTwo.houseId,
        tableId: tournamentTableId,
        seriesId: tournamentSeriesId,
        entryKind: 'poker_play_tournament_prize',
        direction: 'credit',
        amount: 420,
        memo: 'Harness reconcile tournament prize',
        createdAt: tournamentClosedAt,
      });
      if (corrupt) {
        createOilLedgerEntry({
          walletSubject: seatTwo.address,
          houseId: seatTwo.houseId,
          tableId: tournamentTableId,
          seriesId: tournamentSeriesId,
          entryKind: 'poker_play_tournament_prize',
          direction: 'credit',
          amount: 25,
          memo: 'Harness reconcile unexpected bonus prize',
          createdAt: addHarnessSeconds(tournamentClosedAt, 5),
        });
      }

      seededSeriesId = tournamentSeriesId;
      seededTableIds.push(cashTableId, tournamentTableId);
      reconciliationDebug = {
        corrupt,
        expectedMismatchCount: corrupt ? 3 : 0,
        expectedWalletBalanceDeltaByWallet: {
          [seatOne.address]: corrupt ? -5 : 0,
          [seatTwo.address]: corrupt ? 25 : 0,
        },
      };
    } else if (normalizedScenario === 'economy_native_season_story') {
      const [seatOne, seatTwo, seatThree] = normalizedActors;
      const currentSeasonId = 'native-2026-03';
      const currentSeasonTitle = 'Native Live Season Mar 2026';
      const marchCashTableId = nextTableId;
      const marchTournamentSeriesId = `pkseries_harness_economy_${randomHex(6)}`;
      const marchTournamentTableId = `${nextTableId}_tournament`;
      const febCashTableId = `${nextTableId}_feb_cash`;
      const marchCashOpenedAt = '2026-03-05T18:00:00.000Z';
      const marchCashClosedAt = '2026-03-05T18:30:00.000Z';
      const marchTournamentOpenedAt = '2026-03-08T19:00:00.000Z';
      const marchTournamentClosedAt = '2026-03-08T20:00:00.000Z';
      const febCashOpenedAt = '2026-02-18T18:00:00.000Z';
      const febCashClosedAt = '2026-02-18T18:25:00.000Z';

      upsertPokerPlayTable({
        tableId: marchCashTableId,
        slug: `${normalizedScenario}-cash-${randomHex(4)}`,
        title: 'Harness Economy Cash Table',
        tableType: 'cash',
        status: 'admin_closed',
        maxSeats: 6,
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 500,
        minPlayers: 2,
        state: {
          closedAt: marchCashClosedAt,
          closedBy: 'operator',
          closeReason: 'Harness economy cash settlement complete.',
        },
        rules: {
          mode: 'no_limit_holdem',
          format: 'cash',
          maxSeats: 6,
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 15,
          cashOutEnabled: true,
          blindReturnPolicy: 'post_big_blind',
          cashRakeBps: 500,
          cashRakeCapOil: 10,
        },
        summary: {
          headline: 'Harness economy cash session with explicit rake.',
          cashRakeBps: 500,
          cashRakeCapOil: 10,
        },
        createdAt: marchCashOpenedAt,
        updatedAt: marchCashClosedAt,
      });
      upsertPokerPlayPlayerStat({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: marchCashTableId,
        tableType: 'cash',
        title: 'Harness Economy Cash Table',
        seatNumber: 1,
        displayName: seatOne.displayName,
        buyInOil: 500,
        reloadOil: 100,
        cashoutOil: 660,
        rakeOil: 10,
        stackOil: 0,
        status: 'cashed_out',
        openedAt: marchCashOpenedAt,
        closedAt: marchCashClosedAt,
        createdAt: marchCashOpenedAt,
        updatedAt: marchCashClosedAt,
      });
      upsertPokerPlayPlayerStat({
        walletSubject: seatTwo.address,
        houseId: seatTwo.houseId,
        tableId: marchCashTableId,
        tableType: 'cash',
        title: 'Harness Economy Cash Table',
        seatNumber: 2,
        displayName: seatTwo.displayName,
        buyInOil: 500,
        cashoutOil: 430,
        rakeOil: 0,
        stackOil: 0,
        status: 'cashed_out',
        openedAt: marchCashOpenedAt,
        closedAt: marchCashClosedAt,
        createdAt: marchCashOpenedAt,
        updatedAt: marchCashClosedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: marchCashTableId,
        entryKind: 'poker_play_buy_in',
        direction: 'debit',
        amount: 500,
        memo: 'Harness economy cash buy-in A',
        createdAt: marchCashOpenedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: marchCashTableId,
        entryKind: 'poker_play_reload',
        direction: 'debit',
        amount: 100,
        memo: 'Harness economy cash reload A',
        createdAt: '2026-03-05T18:10:00.000Z',
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: marchCashTableId,
        entryKind: 'poker_play_cashout',
        direction: 'credit',
        amount: 660,
        memo: 'Harness economy cash cashout A',
        createdAt: marchCashClosedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatTwo.address,
        houseId: seatTwo.houseId,
        tableId: marchCashTableId,
        entryKind: 'poker_play_buy_in',
        direction: 'debit',
        amount: 500,
        memo: 'Harness economy cash buy-in B',
        createdAt: marchCashOpenedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatTwo.address,
        houseId: seatTwo.houseId,
        tableId: marchCashTableId,
        entryKind: 'poker_play_cashout',
        direction: 'credit',
        amount: 430,
        memo: 'Harness economy cash cashout B',
        createdAt: marchCashClosedAt,
      });
      createOilLedgerEntry({
        walletSubject: POKER_PLAY_ROOM_TREASURY_WALLET_SUBJECT,
        tableId: marchCashTableId,
        entryKind: 'poker_play_room_treasury_credit',
        direction: 'credit',
        amount: 10,
        memo: 'Harness economy cash rake',
        createdAt: marchCashClosedAt,
      });

      upsertPokerPlayTable({
        tableId: marchTournamentTableId,
        slug: `${normalizedScenario}-tournament-${randomHex(4)}`,
        title: 'Harness Economy Tournament',
        tableType: 'tournament',
        status: 'series_closed',
        maxSeats: 6,
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 330,
        minPlayers: 2,
        state: {
          completedAt: marchTournamentClosedAt,
          winnerSeatNumber: 1,
          prizeOil: 630,
          prizePoolOil: 900,
          prizeSettledAt: marchTournamentClosedAt,
          payouts: [
            { place: 1, percent: 70, amountOil: 630 },
            { place: 2, percent: 30, amountOil: 270 },
          ],
          standings: [],
          entryCount: 3,
          reentryCount: 0,
          entryCountsByWallet: {
            [seatOne.address]: 1,
            [seatTwo.address]: 1,
            [seatThree.address]: 1,
          },
        },
        rules: buildHarnessTournamentRules(marchTournamentSeriesId, 'Harness Economy Series', {
          tournamentEntryFeeOil: 30,
          bountyModel: 'none',
        }),
        summary: {
          headline: 'Harness economy tournament with entry fee.',
          seriesId: marchTournamentSeriesId,
          seriesTitle: 'Harness Economy Series',
          tournamentEntryFeeOil: 30,
        },
        createdAt: marchTournamentOpenedAt,
        updatedAt: marchTournamentClosedAt,
      });
      [
        {
          actor: seatOne,
          seatNumber: 1,
          prizeOil: 630,
          finishPosition: 1,
          status: 'paid',
          payoutSettledAt: marchTournamentClosedAt,
        },
        {
          actor: seatTwo,
          seatNumber: 2,
          prizeOil: 270,
          finishPosition: 2,
          status: 'paid',
          payoutSettledAt: marchTournamentClosedAt,
        },
        {
          actor: seatThree,
          seatNumber: 3,
          prizeOil: 0,
          finishPosition: 3,
          status: 'busted',
          payoutSettledAt: null,
        },
      ].forEach(({ actor, seatNumber, prizeOil, finishPosition, status, payoutSettledAt }) => {
        upsertPokerPlayPlayerStat({
          walletSubject: actor.address,
          houseId: actor.houseId,
          tableId: marchTournamentTableId,
          seriesId: marchTournamentSeriesId,
          seriesTitle: 'Harness Economy Series',
          tableType: 'tournament',
          title: 'Harness Economy Tournament',
          seatNumber,
          displayName: actor.displayName,
          buyInOil: 330,
          prizeOil,
          entryFeeOil: 30,
          finishPosition,
          stackOil: 0,
          status,
          payoutSettledAt,
          openedAt: marchTournamentOpenedAt,
          closedAt: marchTournamentClosedAt,
          createdAt: marchTournamentOpenedAt,
          updatedAt: marchTournamentClosedAt,
        });
        createOilLedgerEntry({
          walletSubject: actor.address,
          houseId: actor.houseId,
          tableId: marchTournamentTableId,
          seriesId: marchTournamentSeriesId,
          entryKind: 'poker_play_buy_in',
          direction: 'debit',
          amount: 330,
          memo: `Harness economy tournament buy-in for ${actor.displayName}`,
          createdAt: marchTournamentOpenedAt,
        });
      });
      createOilLedgerEntry({
        walletSubject: seatOne.address,
        houseId: seatOne.houseId,
        tableId: marchTournamentTableId,
        seriesId: marchTournamentSeriesId,
        entryKind: 'poker_play_tournament_prize',
        direction: 'credit',
        amount: 630,
        memo: 'Harness economy tournament prize A',
        createdAt: marchTournamentClosedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatTwo.address,
        houseId: seatTwo.houseId,
        tableId: marchTournamentTableId,
        seriesId: marchTournamentSeriesId,
        entryKind: 'poker_play_tournament_prize',
        direction: 'credit',
        amount: 270,
        memo: 'Harness economy tournament prize B',
        createdAt: marchTournamentClosedAt,
      });
      createOilLedgerEntry({
        walletSubject: POKER_PLAY_ROOM_TREASURY_WALLET_SUBJECT,
        tableId: marchTournamentTableId,
        seriesId: marchTournamentSeriesId,
        entryKind: 'poker_play_room_treasury_credit',
        direction: 'credit',
        amount: 90,
        memo: 'Harness economy tournament fees',
        createdAt: marchTournamentClosedAt,
      });

      upsertPokerPlayTable({
        tableId: febCashTableId,
        slug: `${normalizedScenario}-feb-cash-${randomHex(4)}`,
        title: 'Harness Economy February Cash Table',
        tableType: 'cash',
        status: 'admin_closed',
        maxSeats: 6,
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 400,
        minPlayers: 2,
        state: {
          closedAt: febCashClosedAt,
          closedBy: 'operator',
          closeReason: 'Harness previous-season cash result.',
        },
        rules: {
          mode: 'no_limit_holdem',
          format: 'cash',
          maxSeats: 6,
          decisionCountdownSeconds: 45,
          presenceTimeoutSeconds: 30,
          reconnectGraceSeconds: 90,
          timeBankSeconds: 15,
          cashOutEnabled: true,
          blindReturnPolicy: 'post_big_blind',
          cashRakeBps: 0,
          cashRakeCapOil: 0,
        },
        summary: {
          headline: 'Harness previous-season cash result for native ranking filtering.',
        },
        createdAt: febCashOpenedAt,
        updatedAt: febCashClosedAt,
      });
      upsertPokerPlayPlayerStat({
        walletSubject: seatTwo.address,
        houseId: seatTwo.houseId,
        tableId: febCashTableId,
        tableType: 'cash',
        title: 'Harness Economy February Cash Table',
        seatNumber: 2,
        displayName: seatTwo.displayName,
        buyInOil: 400,
        cashoutOil: 520,
        rakeOil: 0,
        stackOil: 0,
        status: 'cashed_out',
        openedAt: febCashOpenedAt,
        closedAt: febCashClosedAt,
        createdAt: febCashOpenedAt,
        updatedAt: febCashClosedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatTwo.address,
        houseId: seatTwo.houseId,
        tableId: febCashTableId,
        entryKind: 'poker_play_buy_in',
        direction: 'debit',
        amount: 400,
        memo: 'Harness previous-season cash buy-in B',
        createdAt: febCashOpenedAt,
      });
      createOilLedgerEntry({
        walletSubject: seatTwo.address,
        houseId: seatTwo.houseId,
        tableId: febCashTableId,
        entryKind: 'poker_play_cashout',
        direction: 'credit',
        amount: 520,
        memo: 'Harness previous-season cash cashout B',
        createdAt: febCashClosedAt,
      });

      seededSeriesId = marchTournamentSeriesId;
      seededTableIds.push(marchCashTableId, marchTournamentTableId, febCashTableId);
      reconciliationDebug = {
        corrupt: false,
        expectedMismatchCount: 0,
        expectedWalletBalanceDeltaByWallet: {
          [seatOne.address]: 0,
          [seatTwo.address]: 0,
          [seatThree.address]: 0,
          [POKER_PLAY_ROOM_TREASURY_WALLET_SUBJECT]: 0,
        },
      };
      const nativeSeasonDebug = {
        seasonId: currentSeasonId,
        seasonTitle: currentSeasonTitle,
        playerCount: 3,
        expectedOrder: [seatOne.address, seatTwo.address, seatThree.address],
        byWallet: {
          [seatOne.address]: {
            netOil: 360,
            cashNetOil: 60,
            tournamentNetOil: 300,
            rakeOil: 10,
            entryFeeOil: 30,
            treasuryContributionOil: 40,
            tournamentWins: 1,
            tournamentCashes: 1,
          },
          [seatTwo.address]: {
            netOil: -130,
            cashNetOil: -70,
            tournamentNetOil: -60,
            rakeOil: 0,
            entryFeeOil: 30,
            treasuryContributionOil: 30,
            tournamentWins: 0,
            tournamentCashes: 1,
          },
          [seatThree.address]: {
            netOil: -330,
            cashNetOil: 0,
            tournamentNetOil: -330,
            rakeOil: 0,
            entryFeeOil: 30,
            treasuryContributionOil: 30,
            tournamentWins: 0,
            tournamentCashes: 0,
          },
        },
      };
      return {
        scenario: normalizedScenario,
        tableId: nextTableId,
        tableIds: seededTableIds,
        seriesId: seededSeriesId || null,
        handId,
        actionExpiresAt,
        debug: {
          reconciliation: reconciliationDebug,
          treasury: {
            seasonId: currentSeasonId,
            expectedCashRakeOil: 10,
            expectedTournamentFeeOil: 90,
            expectedTreasuryCreditOil: 100,
          },
          nativeSeason: nativeSeasonDebug,
        },
        actors: normalizedActors.map((actor) => ({
          seatNumber: actor.seatNumber,
          address: actor.address,
          houseId: actor.houseId,
          displayName: actor.displayName,
        })),
      };
    }

    return {
      scenario: normalizedScenario,
      tableId: nextTableId,
      tableIds: seededTableIds.length ? seededTableIds : [nextTableId],
      seriesId: seededSeriesId || null,
      handId,
      actionExpiresAt,
      debug: {
        reconciliation: reconciliationDebug,
      },
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

  app.get('/api/poker/play/schedule', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
      const payload = buildPokerPlaySchedulePayload(playRouteDeps, {
        session,
        req,
        processAt: req.query?.asOf,
        days: req.query?.days,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_SCHEDULE_FAILED',
        err?.message || 'Unable to load the poker tournament schedule.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/policy', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = getPokerPlayPolicy(playRouteDeps, {
        session,
        req,
        processAt: req.query?.asOf,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_POLICY_READ_FAILED',
        err?.message || 'Unable to load poker policy.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/policy', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = updatePokerPlayPolicy(playRouteDeps, {
        session,
        req,
        body: req.body,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_POLICY_UPDATE_FAILED',
        err?.message || 'Unable to update poker policy.',
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
        status: req.query?.status,
        publicViewer: !session,
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

  app.get('/api/poker/play/notebook', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
      const payload = listNotebook(playRouteDeps, {
        session,
        req,
        processAt: req.query?.asOf,
        entryKind: req.query?.entryKind,
        tableId: req.query?.tableId,
        seriesId: req.query?.seriesId,
        handId: req.query?.handId,
        opponentWalletSubject: req.query?.opponentWalletSubject,
        limit: req.query?.limit,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_NOTEBOOK_LIST_FAILED',
        err?.message || 'Unable to load poker notebook entries.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/notebook', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
      const payload = saveNotebookEntry(playRouteDeps, {
        session,
        req,
        body: req.body || {},
        processAt: req.body?.asOf || req.query?.asOf,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_NOTEBOOK_SAVE_FAILED',
        err?.message || 'Unable to save the poker notebook entry.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/opponents/:walletSubject/notes', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
      const payload = listNotebook(playRouteDeps, {
        session,
        req,
        processAt: req.query?.asOf,
        entryKind: 'opponent_note',
        tableId: req.query?.tableId,
        seriesId: req.query?.seriesId,
        handId: req.query?.handId,
        opponentWalletSubject: req.params.walletSubject,
        limit: req.query?.limit,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_OPPONENT_NOTES_FAILED',
        err?.message || 'Unable to load poker opponent notes.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/opponents/:walletSubject/notes', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
      const payload = saveNotebookEntry(playRouteDeps, {
        session,
        req,
        body: {
          ...(req.body || {}),
          entryKind: 'opponent_note',
        },
        opponentWalletSubject: req.params.walletSubject,
        processAt: req.body?.asOf || req.query?.asOf,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_OPPONENT_NOTE_SAVE_FAILED',
        err?.message || 'Unable to save the poker opponent note.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/hands/:handId/review', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
      const payload = getHandReview(playRouteDeps, {
        handId: req.params.handId,
        session,
        req,
        processAt: req.query?.asOf,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_HAND_REVIEW_FAILED',
        err?.message || 'Unable to load poker hand review.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/tables/:tableId/history/export', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
      const format = normalizeTrimmedString(req.query?.format, 'json').toLowerCase();
      if (format !== 'json' && format !== 'ndjson' && format !== 'text') {
        throw createRouteError(400, 'INVALID_ARGUMENT', 'Unsupported poker history export format.');
      }
      const payload = buildHandHistoryExport(playRouteDeps, {
        tableId: req.params.tableId,
        session,
        req,
        processAt: req.query?.asOf,
        status: req.query?.status,
        limit: req.query?.limit,
      });
      if (format === 'ndjson') {
        res.setHeader('cache-control', 'no-store');
        res.setHeader('content-type', 'application/x-ndjson; charset=utf-8');
        return res.status(200).send(buildHandHistoryExportNdjson({
          ...payload,
          format,
        }));
      }
      if (format === 'text') {
        res.setHeader('cache-control', 'no-store');
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        return res.status(200).send(buildHandHistoryExportText({
          ...payload,
          format,
        }));
      }
      return sendPortalApiSuccess(res, { ...payload, format }, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_HISTORY_EXPORT_FAILED',
        err?.message || 'Unable to export poker hand history.',
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
        publicViewer: !session,
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

  app.get('/api/poker/play/rail/series/:seriesId/timeline', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const payload = getSeriesTimeline(playRouteDeps, {
        seriesId: req.params.seriesId,
        session: null,
        req,
        processAt: req.query?.asOf,
        limit: req.query?.limit,
        publicViewer: true,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_RAIL_SERIES_TIMELINE_FAILED',
        err?.message || 'Unable to load poker rail series timeline.',
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

  app.get('/api/poker/play/qualifiers/me', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = getMyQualifiers(playRouteDeps, {
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
        err?.code || 'POKER_PLAY_QUALIFIERS_FAILED',
        err?.message || 'Unable to load poker qualifier awards.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/seasons/native/current', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const payload = buildPokerPlayNativeSeasonLeaderboardPayload(playRouteDeps, {
        processAt: req.query?.asOf,
        limit: req.query?.limit,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_NATIVE_SEASON_FAILED',
        err?.message || 'Unable to load the current native poker season.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/seasons/native/:seasonId/leaderboard', (req, res) => {
    const requestId = buildPortalRequestId();
    try {
      const payload = buildPokerPlayNativeSeasonLeaderboardPayload(playRouteDeps, {
        seasonId: req.params.seasonId,
        processAt: req.query?.asOf,
        limit: req.query?.limit,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_NATIVE_SEASON_LEADERBOARD_FAILED',
        err?.message || 'Unable to load the native poker season leaderboard.',
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
    try {
      getTableDetail(playRouteDeps, {
        tableId,
        session,
        req,
        processAt: req.query?.asOf,
      });
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
    try {
      getTableDetail(playRouteDeps, {
        tableId,
        session: null,
        req,
        processAt: req.query?.asOf,
        publicViewer: true,
      });
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

  app.get('/api/poker/play/admin/integrity', (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = buildPokerPlayIntegrityQueuePayload(playRouteDeps, {
        processAt: req.query?.asOf,
        status: req.query?.status,
        limit: req.query?.limit,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_INTEGRITY_QUEUE_FAILED',
        err?.message || 'Unable to load poker integrity queue.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/admin/ops', (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = buildPokerPlayOpsDashboardPayload(playRouteDeps, {
        processAt: req.query?.asOf,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_OPS_DASHBOARD_FAILED',
        err?.message || 'Unable to load poker operations dashboard.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/admin/reconciliation', (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = buildPokerPlayLedgerReconciliationPayload(playRouteDeps, {
        processAt: req.query?.asOf,
        limit: req.query?.limit,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_RECONCILIATION_FAILED',
        err?.message || 'Unable to reconcile poker ledger state.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.get('/api/poker/play/admin/treasury', (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = buildPokerPlayAdminTreasuryPayload(playRouteDeps, {
        processAt: req.query?.asOf,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_TREASURY_FAILED',
        err?.message || 'Unable to load poker room treasury state.',
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

  app.post('/api/poker/play/admin/chop-proposals/:proposalId/review', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const payload = reviewChopProposal(playRouteDeps, {
        proposalId: req.params.proposalId,
        body: req.body,
        processAt: req.body?.asOf,
      });
      publishPokerPlayTableEvent(payload?.proposal?.tableId || '', 'chop_review', {
        proposalId: payload?.proposal?.proposalId || req.params.proposalId,
        status: payload?.proposal?.status || null,
        seriesId: payload?.proposal?.seriesId || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_CHOP_REVIEW_FAILED',
        err?.message || 'Unable to review the poker chop proposal.',
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

  app.post('/api/poker/play/admin/integrity/:flagId/resolve', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    if (!isAdmin(req)) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Poker admin token required.', { requestId });
    }
    try {
      const result = resolveIntegrityFlag(playRouteDeps, {
        flagId: req.params.flagId,
        body: req.body,
        processAt: req.body?.asOf,
      });
      publishPokerPlayTableEvent(result?.flag?.tableId || '', 'integrity_review', {
        flagId: result?.flag?.flagId || req.params.flagId,
        handId: result?.flag?.handId || null,
        status: result?.flag?.status || null,
      });
      return sendPortalApiSuccess(res, result.queue, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_INTEGRITY_RESOLUTION_FAILED',
        err?.message || 'Unable to resolve the poker integrity flag.',
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

  app.post('/api/poker/play/series/:seriesId/rebuy', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = rebuyTournamentSeries(playRouteDeps, {
        seriesId: req.params.seriesId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || '', 'rebuy', {
        handId: payload?.hand?.handId || null,
        seatNumber: payload?.mySeat?.seatNumber || null,
        seriesId: payload?.series?.seriesId || req.params.seriesId,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_REBUY_FAILED',
        err?.message || 'Unable to rebuy into the poker tournament.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/tables/:tableId/addon', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = addTournamentAddon(playRouteDeps, {
        tableId: req.params.tableId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || req.params.tableId, 'addon', {
        handId: payload?.hand?.handId || null,
        seatNumber: payload?.mySeat?.seatNumber || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_ADDON_FAILED',
        err?.message || 'Unable to add chips to the poker tournament seat.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/series/:seriesId/chop-proposals', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = createChopProposal(playRouteDeps, {
        seriesId: req.params.seriesId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.table?.tableId || payload?.proposal?.tableId || '', 'chop_proposal', {
        proposalId: payload?.proposal?.proposalId || null,
        status: payload?.proposal?.status || null,
        seriesId: payload?.proposal?.seriesId || req.params.seriesId,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_CHOP_CREATE_FAILED',
        err?.message || 'Unable to create the poker chop proposal.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/chop-proposals/:proposalId/agree', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = agreeToChopProposal(playRouteDeps, {
        proposalId: req.params.proposalId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(payload?.table?.table?.tableId || payload?.proposal?.tableId || '', 'chop_agree', {
        proposalId: payload?.proposal?.proposalId || req.params.proposalId,
        status: payload?.proposal?.status || null,
        seriesId: payload?.proposal?.seriesId || null,
        agreementCount: payload?.proposal?.agreementCount || 0,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_CHOP_AGREE_FAILED',
        err?.message || 'Unable to agree to the poker chop proposal.',
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

  app.post('/api/poker/play/tables/:tableId/change-seat', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = changeCashTableSeat(playRouteDeps, {
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
        err?.code || 'POKER_PLAY_SEAT_CHANGE_FAILED',
        err?.message || 'Unable to change the poker seat.',
        {
          requestId,
          details: err?.details || {},
        }
      );
    }
  });

  app.post('/api/poker/play/tables/:tableId/transfer', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = transferCashTableSeat(playRouteDeps, {
        tableId: req.params.tableId,
        session,
        req,
        body: req.body,
      });
      publishPokerPlayTableEvent(req.params.tableId, 'seat_transfer', {
        handId: null,
        seatNumber: payload?.transfer?.sourceSeatNumber || null,
        targetTableId: payload?.transfer?.targetTableId || null,
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || payload?.transfer?.targetTableId || '', 'seat_transfer', {
        handId: payload?.hand?.handId || null,
        seatNumber: payload?.mySeat?.seatNumber || payload?.transfer?.targetSeatNumber || null,
        sourceTableId: payload?.transfer?.sourceTableId || req.params.tableId,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_TRANSFER_FAILED',
        err?.message || 'Unable to transfer the poker seat.',
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

  app.post('/api/poker/play/tables/:tableId/auto-act', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    try {
      const payload = updateAutoActPolicy(playRouteDeps, {
        tableId: req.params.tableId,
        session,
        req,
        body: req.body || {},
      });
      publishPokerPlayTableEvent(payload?.table?.tableId || req.params.tableId, 'table', {
        handId: payload?.hand?.handId || null,
        seatNumber: payload?.mySeat?.seatNumber || null,
      });
      return sendPortalApiSuccess(res, payload, { requestId });
    } catch (err) {
      return sendPortalApiError(
        res,
        Number(err?.status || 500),
        err?.code || 'POKER_PLAY_AUTO_ACT_FAILED',
        err?.message || 'Unable to update poker auto-act policy.',
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

  app.get('/__test__/poker/play/transport/channels/:channelKind/:channelId', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (req.header('x-test-reset') !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const summary = pokerPlayTransport.getChannelStateSummary(req.params.channelKind, req.params.channelId);
    return res.json({
      ok: true,
      channel: summary || {
        adapterKind: pokerPlayTransport.adapterKind,
        transportVersion: pokerPlayTransport.transportVersion,
        channelKind: normalizePokerPlayTransportChannelKind(req.params.channelKind),
        channelId: normalizeTrimmedString(req.params.channelId),
        version: 0,
        replayEntryCount: 0,
        latestDelta: null,
        subscriberCount: 0,
      },
    });
  });

  app.get('/__test__/poker/play/pubsub/topics/:channelKind/:channelId', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (req.header('x-test-reset') !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const topic = buildPokerPlayPubSubTopic(req.params.channelKind, req.params.channelId);
    return res.json({
      ok: true,
      topic: pokerPlayPubSub.getTopicSummary(topic) || {
        adapterKind: pokerPlayPubSub.adapterKind,
        topic,
        publishCount: 0,
        retainedCount: 0,
        latestPublishedAt: null,
        latestEnvelope: null,
        subscriberCount: 0,
        subscribers: [],
      },
    });
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

  return {
    handleWebSocketUpgrade: handlePokerPlayWebSocketUpgrade,
    resetTransportState: resetPokerPlayTransportState,
  };
}

module.exports = {
  registerPokerRoutes,
};
