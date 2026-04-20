const SIGNAL_KEYS = [
  'depotReadiness',
  'marketConfidence',
  'neighborGoodwill',
  'publicCharm'
];

function copyJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function clampSignalValue(value) {
  const numeric = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  return Number.isFinite(numeric) ? numeric : 0;
}

function defaultTownSignals() {
  return {
    depotReadiness: 50,
    marketConfidence: 50,
    neighborGoodwill: 50,
    publicCharm: 0,
    updatedAtMs: 0
  };
}

function normalizeTownSignals(raw = {}) {
  const base = defaultTownSignals();
  for (const key of SIGNAL_KEYS) {
    base[key] = clampSignalValue(raw?.[key] ?? base[key]);
  }
  base.updatedAtMs = Math.max(0, Math.floor(Number(raw?.updatedAtMs || 0) || 0));
  return base;
}

function normalizeSignalDelta(raw = {}) {
  const next = {};
  for (const key of SIGNAL_KEYS) {
    const numeric = Math.round(Number(raw?.[key] || 0));
    if (!Number.isFinite(numeric) || numeric === 0) continue;
    next[key] = numeric;
  }
  return next;
}

function signalBand(value) {
  const normalized = clampSignalValue(value);
  if (normalized < 35) return 'LOW';
  if (normalized < 70) return 'STEADY';
  return 'STRONG';
}

function applySignalDelta(signals, delta = {}, nowMs = Date.now()) {
  const before = normalizeTownSignals(signals);
  const normalizedDelta = normalizeSignalDelta(delta);
  const after = copyJson(before);
  for (const key of SIGNAL_KEYS) {
    after[key] = clampSignalValue(before[key] + Number(normalizedDelta[key] || 0));
  }
  after.updatedAtMs = Math.max(0, Math.floor(Number(nowMs || 0) || 0));
  return {
    before,
    delta: normalizedDelta,
    after
  };
}

module.exports = {
  SIGNAL_KEYS,
  applySignalDelta,
  clampSignalValue,
  defaultTownSignals,
  normalizeSignalDelta,
  normalizeTownSignals,
  signalBand
};
