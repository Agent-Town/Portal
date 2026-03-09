function registerPokerRoutes(app, deps) {
  const {
    buildPortalRequestId,
    computePokerArtifactSha256,
    createPortalPokerOperatorClient,
    express,
    getLatestPokerLeaderboardSnapshot,
    getPokerOperatorServiceToken,
    getPokerReplayArtifactByRunId,
    getPokerRunById,
    getPokerSeasonById,
    getPokerSubmissionById,
    getPokerSubmissionByRequest,
    listPokerSeasons,
    normalizePortalIdempotencyKey,
    nowIso,
    randomHex,
    requireBoundHumanSession,
    resolvePrimaryWalletSubject,
    respondPokerOperatorTransport,
    sendPortalApiError,
    sendPortalApiSuccess,
    summarizeMirroredPokerSeason,
    syncPokerMirrorFromOperator,
    upsertPokerSeason,
    upsertPokerSubmission,
  } = deps;

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
}

module.exports = {
  registerPokerRoutes,
};
