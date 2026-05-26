const crypto = require('crypto');

// Prototype/ephemeral process-local replay guard; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const recordsByOwnerAndKey = new Map();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = stableValue(value[key]);
      return out;
    }, {});
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function sha256(value = '') {
  return `sha256:${crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex')}`;
}

function ownerKey(owner = {}) {
  return String(owner.ownerAccountId || owner.regionId || owner.pairId || '').trim();
}

function requestBodyWithoutIdempotency(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  const next = clone(body);
  delete next.idempotencyKey;
  delete next.csrfToken;
  return next;
}

function recordKey(owner, idempotencyKey = '') {
  return `${ownerKey(owner)}\n${String(idempotencyKey || '').trim()}`;
}

function requestHash({ surface = '', body = {} } = {}) {
  return sha256(stableJson({
    surface: String(surface || ''),
    body: requestBodyWithoutIdempotency(body)
  }));
}

function runIdempotentWorldGridMutation({
  owner,
  surface = '',
  idempotencyKey = '',
  body = {},
  nowMs = Date.now()
} = {}, mutate) {
  const key = String(idempotencyKey || '').trim();
  const accountKey = ownerKey(owner);
  if (!accountKey || !key || typeof mutate !== 'function') {
    throw new Error('INVALID_IDEMPOTENCY_KEY');
  }

  const argsSha = requestHash({ surface, body });
  const storeKey = recordKey(owner, key);
  const existing = recordsByOwnerAndKey.get(storeKey);
  if (existing) {
    if (existing.surface !== surface || existing.argsSha !== argsSha) {
      const error = new Error('IDEMPOTENCY_CONFLICT');
      error.details = {
        ownerAccountId: accountKey,
        idempotencyKey: key,
        existingSurface: existing.surface,
        requestedSurface: surface,
        existingArgsSha: existing.argsSha,
        requestedArgsSha: argsSha
      };
      throw error;
    }
    return {
      duplicate: true,
      response: clone(existing.response),
      record: clone(existing)
    };
  }

  const response = mutate();
  const record = {
    ownerAccountId: accountKey,
    surface: String(surface || ''),
    idempotencyKey: key,
    argsSha,
    response: clone(response),
    createdAtMs: nowMs
  };
  recordsByOwnerAndKey.set(storeKey, record);
  return {
    duplicate: false,
    response: clone(response),
    record: clone(record)
  };
}

function worldGridIdempotencyRecordCount() {
  return recordsByOwnerAndKey.size;
}

module.exports = {
  runIdempotentWorldGridMutation,
  sha256,
  stableJson,
  worldGridIdempotencyRecordCount
};
