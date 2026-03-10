const { runOilSnapshotSweep } = require('./poker_oil');

function normalizeBooleanEnv(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function normalizeIntervalMs(value, fallbackMs) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed)) return fallbackMs;
  return Math.max(5000, parsed);
}

function createPokerOilScheduler({
  deps,
  enabled = normalizeBooleanEnv(process.env.POKER_OIL_SCHEDULER_ENABLED, process.env.NODE_ENV !== 'test'),
  intervalMs = normalizeIntervalMs(process.env.POKER_OIL_SCHEDULER_INTERVAL_MS, 60 * 1000),
  logger = console,
} = {}) {
  let timer = null;
  let inFlight = null;

  async function runNow(options = {}) {
    if (inFlight) return inFlight;
    inFlight = runOilSnapshotSweep(deps, options)
      .then((summary) => {
        if (summary.processedSnapshots > 0 || summary.creditedOil > 0) {
          logger.info(
            `[poker-oil] sweep verifications=${summary.verificationCount} snapshots=${summary.processedSnapshots} credited=${summary.creditedOil}`
          );
        }
        if (summary.errorCount > 0) {
          logger.warn(`[poker-oil] sweep completed with ${summary.errorCount} verification errors`);
        }
        return summary;
      })
      .catch((error) => {
        const message = error && typeof error.message === 'string' ? error.message : String(error || 'unknown error');
        logger.warn(`[poker-oil] sweep failed: ${message}`);
        throw error;
      })
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  }

  function start() {
    if (!enabled || timer) return;
    void runNow();
    timer = setInterval(() => {
      void runNow();
    }, intervalMs);
    if (typeof timer.unref === 'function') timer.unref();
  }

  function stop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }

  return {
    enabled,
    intervalMs,
    runNow,
    start,
    stop,
  };
}

module.exports = {
  createPokerOilScheduler,
};
