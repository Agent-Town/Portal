function stableJsonValue(value) {
  if (Array.isArray(value)) return value.map((item) => stableJsonValue(item));
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = stableJsonValue(value[key]);
      return acc;
    }, {});
  }
  return value;
}

function stableJsonStringify(value) {
  return JSON.stringify(stableJsonValue(value));
}

function normalizePortalPokerSubmissionBundle(bundle, declaredCapabilities, deps) {
  const artifactUri = typeof bundle?.artifactUri === 'string' ? bundle.artifactUri.trim() : '';
  const entrypoint = typeof bundle?.entrypoint === 'string' ? bundle.entrypoint.trim() : '';
  if (!artifactUri || !entrypoint) return null;
  const normalizedCapabilities = declaredCapabilities && typeof declaredCapabilities === 'object' && !Array.isArray(declaredCapabilities)
    ? declaredCapabilities
    : {};
  const contentAddress = deps.sha256PrefixedHex(stableJsonStringify({
    artifactUri,
    entrypoint,
    declaredCapabilities: normalizedCapabilities,
  }));
  const manifestHash = deps.sha256PrefixedHex(stableJsonStringify({
    schema: 'agent-town-poker-bundle/v1',
    bundle: {
      contentAddress,
      artifactUri,
      entrypoint,
    },
    declaredCapabilities: normalizedCapabilities,
  }));
  return {
    contentAddress,
    manifestHash,
    artifactUri,
    entrypoint,
  };
}

function registerPokerRoutes(app, deps) {
  const {
    buildPortalRequestId,
    computePokerArtifactSha256,
    createPortalPokerOperatorClient,
    express,
    getLatestPokerLeaderboardSnapshot,
    getPokerBatchById,
    getPokerOperatorServiceToken,
    getPokerReplayArtifactByRunId,
    getPokerRunById,
    getPokerSeasonById,
    getPokerSubmissionById,
    getPokerSubmissionByRequest,
    listPokerLeaderboardSnapshots,
    listPokerSeasons,
    normalizePortalIdempotencyKey,
    nowIso,
    randomHex,
    requireBoundHumanSession,
    resolvePrimaryWalletSubject,
    respondPokerOperatorTransport,
    sendPortalApiError,
    sendPortalApiSuccess,
    sha256PrefixedHex,
    summarizeMirroredPokerSeason,
    syncPokerMirrorFromOperator,
    upsertPokerLeaderboardSnapshot,
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
    const normalizedBundle = normalizePortalPokerSubmissionBundle(bundle, declaredCapabilities, {
      sha256PrefixedHex,
    });
    if (!normalizedBundle) {
      return sendPortalApiError(res, 400, 'POKER_INVALID_BUNDLE', 'Submission bundle is invalid.', { requestId });
    }
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
          bundle: normalizedBundle,
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
        bundle: normalizedBundle,
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

  app.get('/api/poker/leaderboards/:seasonId/snapshots', async (req, res) => {
    const requestId = buildPortalRequestId();
    const season = getPokerSeasonById(req.params.seasonId);
    if (!season) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Poker season not found.', { requestId });
    }
    let snapshots = listPokerLeaderboardSnapshots(req.params.seasonId);
    if (snapshots.length <= 1) {
      try {
        const client = createPortalPokerOperatorClient();
        const history = await client.listLeaderboardSnapshots(req.params.seasonId);
        const remoteItems = Array.isArray(history?.items) ? history.items : [];
        if (remoteItems.length > snapshots.length) {
          for (const snapshot of remoteItems) {
            if (!snapshot?.snapshotId) continue;
            upsertPokerLeaderboardSnapshot({
              snapshotId: snapshot.snapshotId,
              seasonId: req.params.seasonId,
              rankings: snapshot.rankings,
              raw: snapshot,
              createdAt: snapshot.createdAt || nowIso(),
              updatedAt: snapshot.createdAt || nowIso(),
            });
          }
          snapshots = listPokerLeaderboardSnapshots(req.params.seasonId);
        }
      } catch {
        // Keep the mirrored snapshots already available in Portal.
      }
    }
    const items = snapshots.map((snapshot) => ({
      snapshotId: snapshot.snapshotId,
      seasonId: snapshot.seasonId,
      createdAt: snapshot.createdAt,
      rankingsCount: Array.isArray(snapshot.rankings) ? snapshot.rankings.length : 0,
      topSubmissionId: Array.isArray(snapshot.rankings) && snapshot.rankings[0]
        ? String(snapshot.rankings[0].submissionId || '')
        : '',
    }));
    return sendPortalApiSuccess(res, {
      seasonId: req.params.seasonId,
      items,
    }, { requestId });
  });

  app.get('/api/poker/runs/:runId', (req, res) => {
    const requestId = buildPortalRequestId();
    const run = getPokerRunById(req.params.runId);
    if (!run) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Poker run not found.', { requestId });
    }
    const batch = getPokerBatchById(run.batchId);
    const summary = run.summary && typeof run.summary === 'object' ? run.summary : {};
    const raw = run.raw && typeof run.raw === 'object' ? run.raw : {};
    const submissionId = typeof raw.submissionId === 'string' && raw.submissionId.trim()
      ? raw.submissionId.trim()
      : typeof summary.submissionId === 'string' && summary.submissionId.trim()
        ? summary.submissionId.trim()
        : Array.isArray(batch?.submissionIds) && batch.submissionIds.length === 1
          ? String(batch.submissionIds[0] || '').trim()
          : null;
    const seatResults = Array.isArray(summary.seatResults)
      ? summary.seatResults
      : Array.isArray(raw.seatResults)
        ? raw.seatResults
        : Array.isArray(batch?.submissionIds) && batch.submissionIds.length === 1
          ? []
          : [];
    return sendPortalApiSuccess(res, {
      run: {
        runId: run.runId,
        seasonId: run.seasonId,
        batchId: run.batchId,
        submissionId,
        fingerprint: typeof summary.fingerprint === 'string' ? summary.fingerprint : null,
        winnerSeat: summary.winnerSeat ?? null,
        turns: summary.turns ?? null,
        seed: typeof summary.seed === 'string' ? summary.seed : null,
        seatResults,
        replayReady: !!getPokerReplayArtifactByRunId(run.runId),
      },
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
