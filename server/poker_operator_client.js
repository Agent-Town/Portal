const {
  POKER_OPERATOR_REPLAY_FORMAT,
  POKER_OPERATOR_SCHEMA_VERSION,
} = require('./poker_operator');

function createPokerOperatorClient({ transport }) {
  if (typeof transport !== 'function') {
    throw new Error('POKER_OPERATOR_TRANSPORT_REQUIRED');
  }

  async function request({ method, path, query = {}, body = null, headers = {} }) {
    const response = await transport({ method, path, query, body, headers });
    const status = Number(response?.status || 0) || 500;
    const payload = response?.body;
    if (!payload || typeof payload !== 'object') {
      throw makeClientError(status, 'POKER_OPERATOR_SCHEMA_MISMATCH', 'Operator returned a non-object payload.');
    }
    if (payload.ok !== true) {
      const code = typeof payload?.error?.code === 'string' && payload.error.code.trim()
        ? payload.error.code.trim()
        : 'POKER_OPERATOR_ERROR';
      const message = typeof payload?.error?.message === 'string' && payload.error.message.trim()
        ? payload.error.message.trim()
        : 'Operator request failed.';
      throw makeClientError(status, code, message, payload?.error?.details || {});
    }
    if (!('data' in payload) || typeof payload.data !== 'object' || payload.data === null) {
      throw makeClientError(status, 'POKER_OPERATOR_SCHEMA_MISMATCH', 'Operator success envelope is missing data.');
    }
    return payload;
  }

  async function health() {
    const payload = await request({ method: 'GET', path: '/v1/health' });
    if (String(payload?.data?.schemaVersion || '') !== POKER_OPERATOR_SCHEMA_VERSION) {
      throw makeClientError(
        502,
        'POKER_OPERATOR_SCHEMA_MISMATCH',
        'Operator schema version does not match Portal expectations.',
        {
          expectedSchemaVersion: POKER_OPERATOR_SCHEMA_VERSION,
          receivedSchemaVersion: payload?.data?.schemaVersion || null,
        }
      );
    }
    return payload.data;
  }

  async function listSeasons({ cursor = null, limit = 20, status = '' } = {}) {
    const payload = await request({
      method: 'GET',
      path: '/v1/seasons',
      query: {
        cursor,
        limit,
        status,
      },
    });
    if (!Array.isArray(payload?.data?.items) || !('nextCursor' in payload.data)) {
      throw makeClientError(502, 'POKER_OPERATOR_SCHEMA_MISMATCH', 'Season list envelope is invalid.');
    }
    return payload.data;
  }

  async function getSeason(seasonId) {
    const payload = await request({ method: 'GET', path: `/v1/seasons/${encodeURIComponent(seasonId)}` });
    return payload.data;
  }

  async function getBatch(batchId) {
    const payload = await request({ method: 'GET', path: `/v1/batches/${encodeURIComponent(batchId)}` });
    return payload.data;
  }

  async function getRun(runId) {
    const payload = await request({ method: 'GET', path: `/v1/runs/${encodeURIComponent(runId)}` });
    return payload.data;
  }

  async function getReplay(runId) {
    const payload = await request({ method: 'GET', path: `/v1/runs/${encodeURIComponent(runId)}/replay` });
    if (String(payload?.data?.replay?.replayFormat || '') !== POKER_OPERATOR_REPLAY_FORMAT) {
      throw makeClientError(
        502,
        'POKER_OPERATOR_SCHEMA_MISMATCH',
        'Replay format does not match Portal expectations.',
        {
          expectedReplayFormat: POKER_OPERATOR_REPLAY_FORMAT,
          receivedReplayFormat: payload?.data?.replay?.replayFormat || null,
        }
      );
    }
    return payload.data;
  }

  async function getLatestLeaderboard(seasonId) {
    const payload = await request({ method: 'GET', path: `/v1/leaderboards/${encodeURIComponent(seasonId)}/latest` });
    if (!Array.isArray(payload?.data?.rankings)) {
      throw makeClientError(502, 'POKER_OPERATOR_SCHEMA_MISMATCH', 'Leaderboard rankings are missing.');
    }
    return payload.data;
  }

  async function getLeaderboardSnapshot(seasonId, snapshotId) {
    const payload = await request({
      method: 'GET',
      path: `/v1/leaderboards/${encodeURIComponent(seasonId)}/snapshots/${encodeURIComponent(snapshotId)}`,
    });
    if (!Array.isArray(payload?.data?.rankings)) {
      throw makeClientError(502, 'POKER_OPERATOR_SCHEMA_MISMATCH', 'Leaderboard snapshot rankings are missing.');
    }
    return payload.data;
  }

  async function listLeaderboardSnapshots(seasonId) {
    const payload = await request({
      method: 'GET',
      path: `/v1/leaderboards/${encodeURIComponent(seasonId)}/snapshots`,
    });
    if (!Array.isArray(payload?.data?.items)) {
      throw makeClientError(502, 'POKER_OPERATOR_SCHEMA_MISMATCH', 'Leaderboard snapshot history is missing.');
    }
    return payload.data;
  }

  async function createSeason(payload, { bearerToken, idempotencyKey }) {
    const envelope = await request({
      method: 'POST',
      path: '/v1/seasons',
      body: payload,
      headers: buildProtectedHeaders({ bearerToken, idempotencyKey }),
    });
    return envelope.data;
  }

  async function createSubmission(seasonId, payload, { bearerToken, idempotencyKey }) {
    const envelope = await request({
      method: 'POST',
      path: `/v1/seasons/${encodeURIComponent(seasonId)}/submissions`,
      body: payload,
      headers: buildProtectedHeaders({ bearerToken, idempotencyKey }),
    });
    return envelope.data;
  }

  async function createBatch(seasonId, payload, { bearerToken, idempotencyKey }) {
    const envelope = await request({
      method: 'POST',
      path: `/v1/seasons/${encodeURIComponent(seasonId)}/batches`,
      body: payload,
      headers: buildProtectedHeaders({ bearerToken, idempotencyKey }),
    });
    return envelope.data;
  }

  return {
    createBatch,
    createSeason,
    createSubmission,
    getBatch,
    getLeaderboardSnapshot,
    listLeaderboardSnapshots,
    getLatestLeaderboard,
    getReplay,
    getRun,
    getSeason,
    health,
    listSeasons,
  };
}

function buildProtectedHeaders({ bearerToken, idempotencyKey }) {
  const headers = {};
  if (bearerToken) headers.authorization = `Bearer ${bearerToken}`;
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;
  return headers;
}

function makeClientError(status, code, message, details = {}) {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  err.details = details && typeof details === 'object' ? details : {};
  return err;
}

module.exports = {
  createPokerOperatorClient,
};
