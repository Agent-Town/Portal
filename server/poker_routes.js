const crypto = require('crypto');
const {
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
} = require('./poker_centaur');
const {
  resetStreamflowFixtureState,
  resolveStreamflowLockStatus,
  seedStreamflowFixtureState,
} = require('./streamflow_adapter');

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

function processOilSnapshotsForVerification(deps, verification, { asOf = null } = {}) {
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

      const providerStatus = resolveStreamflowLockStatus({
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

function buildCentaurTournamentPayload(deps, tournament, session, req, { processAt = null } = {}) {
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
    processOilSnapshotsForVerification(deps, verification, { asOf: processAt });
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

function sendCentaurTournamentSuccess(deps, res, requestId, tournament, session, req, options = {}) {
  const detail = buildCentaurTournamentPayload(deps, tournament, session, req, options);
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
    createPortalPokerOperatorClient,
    express,
    getCentaurEntryById,
    getCentaurEntryByWalletSubject,
    getCentaurHandById,
    getCentaurTournamentById,
    getCurrentCentaurHandForEntry,
    getLatestPokerLeaderboardSnapshot,
    getOilSnapshotEventByVerificationAndScheduledFor,
    getPokerOperatorServiceToken,
    getPokerReplayArtifactByRunId,
    getPokerRunById,
    getPokerSeasonById,
    getPokerSubmissionById,
    getPokerSubmissionByRequest,
    getStreamflowVerificationById,
    getStreamflowVerificationByWalletAndStream,
    getStreamflowVerificationByWalletSubject,
    isTestMockAddress,
    listCentaurActionsByHand,
    listCentaurMessagesByHand,
    listCentaurTournaments,
    listOilLedgerEntriesByWalletSubject,
    listOilSnapshotEventsByVerificationAndHour,
    listPokerSeasons,
    normalizePortalIdempotencyKey,
    nowIso,
    randomHex,
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

  app.get('/api/poker/centaur/tournaments', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = parseOptionalSession({ resolveHumanSessionWithRecovery }, req, res);
    const walletBinding = session ? resolvePrimaryWalletSubject(session, req) : null;
    const verification = walletBinding?.walletSubject ? getStreamflowVerificationByWalletSubject(walletBinding.walletSubject) : null;
    const atIso = normalizeIsoOrNull(req.query?.asOf) || nowIso();
    let currentHourSnapshots = buildCurrentHourSnapshotState(null, [], atIso);
    if (verification) {
      processOilSnapshotsForVerification(routeDeps, verification, { asOf: req.query?.asOf });
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

  app.get('/api/poker/centaur/tournaments/:tournamentId', (req, res) => {
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

  app.post('/api/poker/streamflow/challenge', express.json({ limit: '128kb' }), (req, res) => {
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
  });

  app.post('/api/poker/streamflow/verify', express.json({ limit: '128kb' }), (req, res) => {
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

    const providerStatus = resolveStreamflowLockStatus({
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

    const existing = getStreamflowVerificationByWalletAndStream(walletBinding.walletSubject, STREAMFLOW_PROVIDER, streamId)
      || getStreamflowVerificationByWalletSubject(walletBinding.walletSubject);
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
    const processed = processOilSnapshotsForVerification(routeDeps, verification, { asOf: req.body?.asOf });
    return sendPortalApiSuccess(res, {
      verification: getStreamflowVerificationById(verification.verificationId),
      oilBalance: computeOilBalance(walletBinding.walletSubject),
      processed,
    }, { requestId });
  });

  app.get('/api/poker/oil/balance', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const walletBinding = resolvePrimaryWalletSubject(session, req);
    if (!walletBinding?.walletSubject) {
      return sendPortalApiError(res, 409, 'WALLET_SUBJECT_REQUIRED', 'A bound wallet is required before reading OIL balance.', { requestId });
    }
    const verification = getStreamflowVerificationByWalletSubject(walletBinding.walletSubject);
    if (verification) {
      processOilSnapshotsForVerification(routeDeps, verification, { asOf: req.query?.asOf });
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
  });

  app.post('/api/poker/centaur/tournaments/:tournamentId/join', express.json({ limit: '128kb' }), (req, res) => {
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
    processOilSnapshotsForVerification(routeDeps, verification, { asOf: req.body?.asOf });
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

  app.post('/__test__/poker/oil/process', express.json({ limit: '128kb' }), (req, res) => {
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
    const processed = processOilSnapshotsForVerification(routeDeps, verification, { asOf: req.body?.asOf });
    return res.json({
      ok: true,
      verificationId: verification.verificationId,
      oilBalance: computeOilBalance(verification.walletSubject),
      processed,
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
