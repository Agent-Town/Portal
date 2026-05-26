// Prototype/ephemeral process-local mutation buckets; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const buckets = new Map();

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX = 30;

function readPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function worldGridMutationRateLimitConfig(env = process.env) {
  return {
    windowMs: readPositiveInteger(env.WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS),
    max: readPositiveInteger(env.WORLD_GRID_MUTATION_RATE_LIMIT_MAX, DEFAULT_MAX)
  };
}

function ownerKey(owner = {}) {
  return String(owner.ownerAccountId || owner.regionId || owner.pairId || '').trim();
}

function consumeWorldGridMutationRateLimit({ owner, surface = '', nowMs = Date.now(), env = process.env } = {}) {
  const keyOwner = ownerKey(owner);
  if (!keyOwner) return null;
  const { windowMs, max } = worldGridMutationRateLimitConfig(env);
  const key = `${keyOwner}\n${String(surface || '').trim()}`;
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAtMs <= nowMs) {
    bucket = { count: 0, resetAtMs: nowMs + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, max - bucket.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAtMs - nowMs) / 1000));
  if (bucket.count > max) {
    return {
      allowed: false,
      limit: max,
      remaining: 0,
      retryAfterSeconds,
      resetAtMs: bucket.resetAtMs
    };
  }
  return {
    allowed: true,
    limit: max,
    remaining,
    retryAfterSeconds,
    resetAtMs: bucket.resetAtMs
  };
}

function worldGridMutationRateLimitBucketCount() {
  return buckets.size;
}

module.exports = {
  consumeWorldGridMutationRateLimit,
  worldGridMutationRateLimitBucketCount,
  worldGridMutationRateLimitConfig
};
