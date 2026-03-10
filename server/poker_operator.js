const { nowIso, randomHex } = require('./util');

const POKER_OPERATOR_SCHEMA_VERSION = '2026-03-09';
const POKER_OPERATOR_REPLAY_FORMAT = 'poker-run-replay-v1';
const DEFAULT_OPERATOR_VERSION = '0.9.0';
const DEFAULT_OPERATOR_TOKEN = process.env.POKER_OPERATOR_SERVICE_TOKEN || 'portal-operator-test-token';

let operatorState = createEmptyOperatorState();

function createEmptyOperatorState() {
  return {
    schemaVersion: POKER_OPERATOR_SCHEMA_VERSION,
    operatorVersion: DEFAULT_OPERATOR_VERSION,
    serviceToken: DEFAULT_OPERATOR_TOKEN,
    seasons: new Map(),
    batches: new Map(),
    runs: new Map(),
    replays: new Map(),
    leaderboards: new Map(),
    submissions: new Map(),
    idempotency: new Map(),
  };
}

function clone(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value == null ? fallback : value));
  } catch {
    return fallback;
  }
}

function makeId(prefix) {
  return `${prefix}_${randomHex(8)}`;
}

function resetPokerOperatorState() {
  operatorState = createEmptyOperatorState();
}

function seedPokerOperatorState(fixture = {}) {
  resetPokerOperatorState();
  operatorState.schemaVersion = typeof fixture?.schemaVersion === 'string' && fixture.schemaVersion.trim()
    ? fixture.schemaVersion.trim()
    : POKER_OPERATOR_SCHEMA_VERSION;
  operatorState.operatorVersion = typeof fixture?.operatorVersion === 'string' && fixture.operatorVersion.trim()
    ? fixture.operatorVersion.trim()
    : DEFAULT_OPERATOR_VERSION;
  operatorState.serviceToken = typeof fixture?.serviceToken === 'string' && fixture.serviceToken.trim()
    ? fixture.serviceToken.trim()
    : DEFAULT_OPERATOR_TOKEN;

  for (const season of Array.isArray(fixture?.seasons) ? fixture.seasons : []) {
    const normalized = normalizeSeason(season);
    operatorState.seasons.set(normalized.seasonId, normalized);
  }
  for (const batch of Array.isArray(fixture?.batches) ? fixture.batches : []) {
    const normalized = normalizeBatch(batch);
    operatorState.batches.set(normalized.batchId, normalized);
  }
  for (const run of Array.isArray(fixture?.runs) ? fixture.runs : []) {
    const normalized = normalizeRun(run);
    operatorState.runs.set(normalized.runId, normalized);
  }
  for (const replay of Array.isArray(fixture?.replays) ? fixture.replays : []) {
    const normalized = normalizeReplay(replay);
    operatorState.replays.set(normalized.runId, normalized);
  }
  for (const snapshot of Array.isArray(fixture?.leaderboards) ? fixture.leaderboards : []) {
    const normalized = normalizeLeaderboardSnapshot(snapshot);
    const existing = operatorState.leaderboards.get(normalized.seasonId) || [];
    existing.push(normalized);
    operatorState.leaderboards.set(normalized.seasonId, existing);
  }
  for (const submission of Array.isArray(fixture?.submissions) ? fixture.submissions : []) {
    const normalized = normalizeSubmission(submission);
    operatorState.submissions.set(normalized.submissionId, normalized);
  }
  for (const [seasonId, snapshots] of operatorState.leaderboards.entries()) {
    snapshots.sort(compareNewestFirst);
    operatorState.leaderboards.set(seasonId, snapshots);
  }
  return getPokerOperatorSnapshot();
}

function getPokerOperatorSnapshot() {
  return {
    schemaVersion: operatorState.schemaVersion,
    operatorVersion: operatorState.operatorVersion,
    serviceToken: operatorState.serviceToken,
    seasons: Array.from(operatorState.seasons.values()).map((item) => clone(item, {})),
    batches: Array.from(operatorState.batches.values()).map((item) => clone(item, {})),
    runs: Array.from(operatorState.runs.values()).map((item) => clone(item, {})),
    replays: Array.from(operatorState.replays.values()).map((item) => clone(item, {})),
    leaderboards: Array.from(operatorState.leaderboards.values()).flat().map((item) => clone(item, {})),
    submissions: Array.from(operatorState.submissions.values()).map((item) => clone(item, {})),
  };
}

function compareNewestFirst(a, b) {
  const aTime = Date.parse(String(a?.createdAt || '')) || 0;
  const bTime = Date.parse(String(b?.createdAt || '')) || 0;
  if (bTime !== aTime) return bTime - aTime;
  return String(b?.snapshotId || b?.runId || b?.seasonId || '').localeCompare(String(a?.snapshotId || a?.runId || a?.seasonId || ''));
}

function normalizeSeason(input = {}) {
  const now = nowIso();
  return {
    seasonId: typeof input.seasonId === 'string' && input.seasonId.trim() ? input.seasonId.trim() : makeId('pks'),
    seasonSlug: typeof input.seasonSlug === 'string' && input.seasonSlug.trim() ? input.seasonSlug.trim() : `season-${randomHex(4)}`,
    displayName: typeof input.displayName === 'string' && input.displayName.trim() ? input.displayName.trim() : 'Season',
    rulesVersion: typeof input.rulesVersion === 'string' && input.rulesVersion.trim() ? input.rulesVersion.trim() : 'poker-rules-v3',
    operatorVersion: typeof input.operatorVersion === 'string' && input.operatorVersion.trim() ? input.operatorVersion.trim() : operatorState.operatorVersion,
    status: typeof input.status === 'string' && input.status.trim() ? input.status.trim() : 'scheduled',
    submissionOpenAt: typeof input.submissionOpenAt === 'string' ? input.submissionOpenAt : null,
    submissionCloseAt: typeof input.submissionCloseAt === 'string' ? input.submissionCloseAt : null,
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : now,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : now,
    rulesSummary: clone(input.rulesSummary, {
      summary: 'Operator-defined rules summary.',
    }),
    divisions: Array.isArray(input.divisions) ? input.divisions.map((division) => ({
      divisionId: typeof division?.divisionId === 'string' && division.divisionId.trim() ? division.divisionId.trim() : makeId('pkd'),
      divisionSlug: typeof division?.divisionSlug === 'string' && division.divisionSlug.trim() ? division.divisionSlug.trim() : 'standard',
      runnerKind: typeof division?.runnerKind === 'string' && division.runnerKind.trim() ? division.runnerKind.trim() : 'native',
    })) : [],
    latestReplayRunId: typeof input.latestReplayRunId === 'string' ? input.latestReplayRunId : null,
  };
}

function normalizeBatch(input = {}) {
  const now = nowIso();
  return {
    batchId: typeof input.batchId === 'string' && input.batchId.trim() ? input.batchId.trim() : makeId('pkb'),
    seasonId: typeof input.seasonId === 'string' ? input.seasonId.trim() : null,
    batchKind: typeof input.batchKind === 'string' && input.batchKind.trim() ? input.batchKind.trim() : 'season_eval',
    submissionIds: Array.isArray(input.submissionIds) ? input.submissionIds.map((item) => String(item)) : [],
    batchConfig: clone(input.batchConfig, {}),
    status: typeof input.status === 'string' && input.status.trim() ? input.status.trim() : 'queued',
    runIds: Array.isArray(input.runIds) ? input.runIds.map((item) => String(item)) : [],
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : now,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : now,
  };
}

function normalizeRun(input = {}) {
  const now = nowIso();
  return {
    runId: typeof input.runId === 'string' && input.runId.trim() ? input.runId.trim() : makeId('pkr'),
    batchId: typeof input.batchId === 'string' ? input.batchId.trim() : '',
    seasonId: typeof input.seasonId === 'string' ? input.seasonId.trim() : null,
    submissionId: typeof input.submissionId === 'string' && input.submissionId.trim() ? input.submissionId.trim() : null,
    summary: clone(input.summary, {}),
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : now,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : now,
  };
}

function normalizeReplay(input = {}) {
  const now = nowIso();
  const replay = input && typeof input.replay === 'object' ? input.replay : input;
  return {
    runId: typeof input.runId === 'string' && input.runId.trim() ? input.runId.trim() : makeId('pkr'),
    replay: {
      replayFormat: typeof replay?.replayFormat === 'string' && replay.replayFormat.trim()
        ? replay.replayFormat.trim()
        : POKER_OPERATOR_REPLAY_FORMAT,
      summaryJson: clone(replay?.summaryJson, {}),
      eventsJsonlUri: typeof replay?.eventsJsonlUri === 'string' ? replay.eventsJsonlUri : null,
      artifactSha256: typeof replay?.artifactSha256 === 'string' ? replay.artifactSha256 : null,
      contentType: typeof replay?.contentType === 'string' ? replay.contentType : 'application/x-ndjson',
      eventsJsonl: typeof replay?.eventsJsonl === 'string' ? replay.eventsJsonl : '',
    },
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : now,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : now,
  };
}

function normalizeLeaderboardSnapshot(input = {}) {
  const now = nowIso();
  return {
    snapshotId: typeof input.snapshotId === 'string' && input.snapshotId.trim() ? input.snapshotId.trim() : makeId('pklb'),
    seasonId: typeof input.seasonId === 'string' && input.seasonId.trim() ? input.seasonId.trim() : '',
    rankings: Array.isArray(input.rankings) ? input.rankings.map((entry) => clone(entry, {})) : [],
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : now,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : now,
  };
}

function normalizeSubmission(input = {}) {
  const now = nowIso();
  return {
    submissionId: typeof input.submissionId === 'string' && input.submissionId.trim() ? input.submissionId.trim() : makeId('pksub'),
    seasonId: typeof input.seasonId === 'string' && input.seasonId.trim() ? input.seasonId.trim() : '',
    portalSubmissionId: typeof input.portalSubmissionId === 'string' ? input.portalSubmissionId.trim() : null,
    submitterWallet: clone(input.submitterWallet, {}),
    bundle: clone(input.bundle, {}),
    declaredCapabilities: clone(input.declaredCapabilities, {}),
    status: typeof input.status === 'string' && input.status.trim() ? input.status.trim() : 'accepted',
    validation: clone(input.validation, { status: 'pending' }),
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : now,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : now,
  };
}

function encodeCursor(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

function decodeCursor(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(String(value), 'base64').toString('utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function makeOperatorError(status, code, message, details = {}) {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  err.details = clone(details, {});
  return err;
}

function requireSeason(seasonId) {
  const season = operatorState.seasons.get(seasonId);
  if (!season) throw makeOperatorError(404, 'NOT_FOUND', 'Season not found.', { seasonId });
  return season;
}

function requireBatch(batchId) {
  const batch = operatorState.batches.get(batchId);
  if (!batch) throw makeOperatorError(404, 'NOT_FOUND', 'Batch not found.', { batchId });
  return batch;
}

function requireRun(runId) {
  const run = operatorState.runs.get(runId);
  if (!run) throw makeOperatorError(404, 'NOT_FOUND', 'Run not found.', { runId });
  return run;
}

function listSeasons({ cursor = null, limit = 20, status = '' } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const safeStatus = String(status || '').trim().toLowerCase();
  const items = Array.from(operatorState.seasons.values())
    .filter((season) => !safeStatus || String(season.status || '').toLowerCase() === safeStatus)
    .sort((a, b) => String(a.seasonId).localeCompare(String(b.seasonId)));
  const decoded = decodeCursor(cursor);
  let startIndex = 0;
  if (decoded?.seasonId) {
    const idx = items.findIndex((season) => season.seasonId === decoded.seasonId);
    startIndex = idx >= 0 ? idx + 1 : 0;
  }
  const sliced = items.slice(startIndex, startIndex + safeLimit);
  const nextItem = items[startIndex + safeLimit] || null;
  return {
    items: sliced.map((season) => ({
      seasonId: season.seasonId,
      seasonSlug: season.seasonSlug,
      displayName: season.displayName,
      rulesVersion: season.rulesVersion,
      operatorVersion: season.operatorVersion,
      status: season.status,
      submissionOpenAt: season.submissionOpenAt,
      submissionCloseAt: season.submissionCloseAt,
    })),
    nextCursor: nextItem ? encodeCursor({ seasonId: sliced[sliced.length - 1].seasonId }) : null,
  };
}

function getLatestLeaderboardSnapshot(seasonId) {
  const items = operatorState.leaderboards.get(seasonId) || [];
  if (!items.length) return null;
  return items.slice().sort(compareNewestFirst)[0] || null;
}

function getReplayHighlight(season) {
  const latestRunId = season?.latestReplayRunId || null;
  if (!latestRunId) return null;
  const run = operatorState.runs.get(latestRunId);
  const replay = operatorState.replays.get(latestRunId);
  if (!run || !replay) return null;
  return {
    runId: run.runId,
    summary: clone(run.summary, {}),
    replayFormat: replay.replay.replayFormat,
  };
}

function getSeasonDetail(seasonId) {
  const season = requireSeason(seasonId);
  const latestLeaderboardSnapshot = getLatestLeaderboardSnapshot(seasonId);
  return {
    seasonId: season.seasonId,
    seasonSlug: season.seasonSlug,
    displayName: season.displayName,
    rulesVersion: season.rulesVersion,
    operatorVersion: season.operatorVersion,
    status: season.status,
    submissionOpenAt: season.submissionOpenAt,
    submissionCloseAt: season.submissionCloseAt,
    rulesSummary: clone(season.rulesSummary, {}),
    divisions: clone(season.divisions, []),
    latestLeaderboardSnapshot: latestLeaderboardSnapshot ? {
      snapshotId: latestLeaderboardSnapshot.snapshotId,
      createdAt: latestLeaderboardSnapshot.createdAt,
    } : null,
    latestReplayHighlight: getReplayHighlight(season),
  };
}

function getBatchDetail(batchId) {
  const batch = requireBatch(batchId);
  return clone(batch, {});
}

function getRunDetail(runId) {
  const run = requireRun(runId);
  return clone(run, {});
}

function getReplayDetail(runId) {
  requireRun(runId);
  const replay = operatorState.replays.get(runId);
  if (!replay) throw makeOperatorError(404, 'POKER_REPLAY_NOT_READY', 'Replay artifact is not ready.', { runId });
  return {
    runId,
    replay: clone(replay.replay, {}),
  };
}

function getLatestLeaderboardDetail(seasonId) {
  requireSeason(seasonId);
  const snapshot = getLatestLeaderboardSnapshot(seasonId);
  if (!snapshot) {
    return {
      seasonId,
      snapshotId: null,
      createdAt: null,
      rankings: [],
    };
  }
  return {
    seasonId,
    snapshotId: snapshot.snapshotId,
    createdAt: snapshot.createdAt,
    rankings: clone(snapshot.rankings, []),
  };
}

function getLeaderboardSnapshotDetail(seasonId, snapshotId) {
  requireSeason(seasonId);
  const snapshots = operatorState.leaderboards.get(seasonId) || [];
  const snapshot = snapshots.find((item) => item.snapshotId === snapshotId) || null;
  if (!snapshot) throw makeOperatorError(404, 'NOT_FOUND', 'Leaderboard snapshot not found.', { seasonId, snapshotId });
  return {
    seasonId,
    snapshotId: snapshot.snapshotId,
    createdAt: snapshot.createdAt,
    rankings: clone(snapshot.rankings, []),
  };
}

function listLeaderboardSnapshotHistory(seasonId) {
  requireSeason(seasonId);
  const snapshots = operatorState.leaderboards.get(seasonId) || [];
  return {
    seasonId,
    items: snapshots.slice().sort(compareNewestFirst).map((snapshot) => ({
      snapshotId: snapshot.snapshotId,
      createdAt: snapshot.createdAt,
      rankings: clone(snapshot.rankings, []),
    })),
  };
}

function buildIdempotencyKey(kind, idempotencyKey) {
  return `${kind}:${String(idempotencyKey || '').trim()}`;
}

function getStoredIdempotentResult(kind, idempotencyKey) {
  if (!idempotencyKey) return null;
  return operatorState.idempotency.get(buildIdempotencyKey(kind, idempotencyKey)) || null;
}

function storeIdempotentResult(kind, idempotencyKey, result) {
  if (!idempotencyKey) return;
  operatorState.idempotency.set(buildIdempotencyKey(kind, idempotencyKey), clone(result, {}));
}

function createSeason(payload = {}, { actor = 'operator', idempotencyKey = '' } = {}) {
  const replay = getStoredIdempotentResult('createSeason', idempotencyKey);
  if (replay) return replay;
  const normalized = normalizeSeason(payload);
  operatorState.seasons.set(normalized.seasonId, normalized);
  const result = {
    seasonId: normalized.seasonId,
    status: 'created',
    actor,
  };
  storeIdempotentResult('createSeason', idempotencyKey, result);
  return result;
}

function isSeasonClosed(season) {
  if (!season) return true;
  if (String(season.status || '').toLowerCase() === 'closed') return true;
  const closeAtMs = Date.parse(String(season.submissionCloseAt || ''));
  return Number.isFinite(closeAtMs) && closeAtMs <= Date.now();
}

function createSubmission(seasonId, payload = {}, { actor = 'portal', idempotencyKey = '' } = {}) {
  const season = requireSeason(seasonId);
  const replay = getStoredIdempotentResult(`submission:${seasonId}`, idempotencyKey);
  if (replay) return replay;
  if (isSeasonClosed(season)) {
    throw makeOperatorError(409, 'POKER_SEASON_CLOSED', 'Season no longer accepts submissions.', { seasonId });
  }
  const bundle = payload && typeof payload.bundle === 'object' ? payload.bundle : null;
  if (!bundle || !bundle.contentAddress || !bundle.manifestHash || !bundle.artifactUri || !bundle.entrypoint) {
    throw makeOperatorError(400, 'POKER_INVALID_BUNDLE', 'Submission bundle is invalid.', { seasonId });
  }
  const submissionId = typeof payload.portalSubmissionId === 'string' && payload.portalSubmissionId.trim()
    ? payload.portalSubmissionId.trim()
    : makeId('pksub');
  const existingByPortalId = Array.from(operatorState.submissions.values()).find((item) => item.portalSubmissionId === submissionId);
  if (existingByPortalId) {
    throw makeOperatorError(409, 'POKER_SUBMISSION_DUPLICATE', 'Submission already exists.', { submissionId });
  }
  const submission = normalizeSubmission({
    submissionId,
    seasonId,
    portalSubmissionId: submissionId,
    submitterWallet: clone(payload.submitterWallet, {}),
    bundle: clone(payload.bundle, {}),
    declaredCapabilities: clone(payload.declaredCapabilities, {}),
    status: 'accepted',
    validation: { status: 'pending' },
  });
  operatorState.submissions.set(submission.submissionId, submission);
  const result = {
    submissionId: submission.submissionId,
    status: submission.status,
    validation: clone(submission.validation, {}),
    actor,
  };
  storeIdempotentResult(`submission:${seasonId}`, idempotencyKey, result);
  return result;
}

function createBatch(seasonId, payload = {}, { actor = 'operator', idempotencyKey = '' } = {}) {
  requireSeason(seasonId);
  const replay = getStoredIdempotentResult(`batch:${seasonId}`, idempotencyKey);
  if (replay) return replay;
  const normalized = normalizeBatch({
    seasonId,
    batchKind: payload.batchKind,
    submissionIds: payload.submissionIds,
    batchConfig: payload.batchConfig,
    status: 'queued',
  });
  operatorState.batches.set(normalized.batchId, normalized);
  const result = {
    batchId: normalized.batchId,
    status: normalized.status,
    actor,
  };
  storeIdempotentResult(`batch:${seasonId}`, idempotencyKey, result);
  return result;
}

module.exports = {
  DEFAULT_OPERATOR_TOKEN,
  POKER_OPERATOR_REPLAY_FORMAT,
  POKER_OPERATOR_SCHEMA_VERSION,
  createBatch,
  createSeason,
  createSubmission,
  getBatchDetail,
  getLeaderboardSnapshotDetail,
  listLeaderboardSnapshotHistory,
  getLatestLeaderboardDetail,
  getPokerOperatorSnapshot,
  getReplayDetail,
  getRunDetail,
  getSeasonDetail,
  listSeasons,
  resetPokerOperatorState,
  seedPokerOperatorState,
};
