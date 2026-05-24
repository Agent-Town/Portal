import { getRecord, putRecord } from '/openclaw-lite/vendor/shared/idb.js';

const SETTINGS_KEY = 'codexBudgetSettingsV1';
const LEDGER_KEY = 'codexBudgetLedgerV1';
const SNAPSHOT_KEY = 'codexBudgetSnapshotV1';
export const CODEX_BUDGET_ENDPOINT = '/api/agent/lite/codex/rate-limits';
export const CODEX_BUDGET_DEFAULTS = Object.freeze({
  enabled: true,
  fiveHourPercent: 10,
  weeklyPercent: 25,
  perTurnPercent: 1
});

function nowMs() {
  return Date.now();
}

async function metaGet(key) {
  const rec = await getRecord('meta', key);
  return rec ? rec.value : null;
}

async function metaSet(key, value) {
  await putRecord('meta', { key, value });
}

function clampPercent(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(1, Math.min(100, Math.round(numeric)));
}

export function normalizeCodexBudgetSettings(value = {}) {
  const input = value && typeof value === 'object' ? value : {};
  return {
    enabled: input.enabled === false ? false : true,
    fiveHourPercent: clampPercent(input.fiveHourPercent, CODEX_BUDGET_DEFAULTS.fiveHourPercent),
    weeklyPercent: clampPercent(input.weeklyPercent, CODEX_BUDGET_DEFAULTS.weeklyPercent),
    perTurnPercent: clampPercent(input.perTurnPercent, CODEX_BUDGET_DEFAULTS.perTurnPercent)
  };
}

function normalizeSpendEvent(event) {
  if (!event || typeof event !== 'object') return null;
  const spentAtMs = Number(event.spentAtMs);
  const amountPercent = Number(event.amountPercent);
  if (!Number.isFinite(spentAtMs) || spentAtMs <= 0) return null;
  if (!Number.isFinite(amountPercent) || amountPercent <= 0) return null;
  return {
    spentAtMs: Math.round(spentAtMs),
    amountPercent: Math.max(0.1, Math.min(100, amountPercent)),
    source: typeof event.source === 'string' ? event.source.slice(0, 80) : 'llm-turn'
  };
}

export function normalizeCodexBudgetLedger(value = {}) {
  const input = value && typeof value === 'object' ? value : {};
  const events = Array.isArray(input.events) ? input.events.map(normalizeSpendEvent).filter(Boolean) : [];
  return {
    v: 1,
    events: events
      .filter((event) => event.spentAtMs >= nowMs() - 10080 * 60 * 1000)
      .sort((a, b) => a.spentAtMs - b.spentAtMs)
      .slice(-500)
  };
}

function rollingSpendPercent(ledger, windowMins) {
  const cutoff = nowMs() - Number(windowMins || 0) * 60 * 1000;
  const events = Array.isArray(ledger?.events) ? ledger.events : [];
  return events
    .filter((event) => event.spentAtMs >= cutoff)
    .reduce((sum, event) => sum + Number(event.amountPercent || 0), 0);
}

export async function loadCodexBudgetSettings() {
  return normalizeCodexBudgetSettings(await metaGet(SETTINGS_KEY));
}

export async function saveCodexBudgetSettings(settings = {}) {
  const normalized = normalizeCodexBudgetSettings(settings);
  await metaSet(SETTINGS_KEY, normalized);
  return normalized;
}

export async function loadCodexBudgetLedger() {
  return normalizeCodexBudgetLedger(await metaGet(LEDGER_KEY));
}

export async function saveCodexBudgetLedger(ledger = {}) {
  const normalized = normalizeCodexBudgetLedger(ledger);
  await metaSet(LEDGER_KEY, normalized);
  return normalized;
}

export async function clearCodexBudgetLedger() {
  const ledger = { v: 1, events: [] };
  await metaSet(LEDGER_KEY, ledger);
  return ledger;
}

export async function recordCodexBudgetSpend({ amountPercent, source = 'llm-turn' } = {}) {
  const settings = await loadCodexBudgetSettings();
  const ledger = await loadCodexBudgetLedger();
  ledger.events.push({
    spentAtMs: nowMs(),
    amountPercent: Number.isFinite(Number(amountPercent)) ? Number(amountPercent) : settings.perTurnPercent,
    source
  });
  return saveCodexBudgetLedger(ledger);
}

export async function fetchCodexRateLimits() {
  const response = await fetch(CODEX_BUDGET_ENDPOINT, { credentials: 'include' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok !== true) {
    const error = new Error(String(payload?.error || `HTTP_${response.status}`));
    error.payload = payload;
    error.status = response.status;
    throw error;
  }
  await metaSet(SNAPSHOT_KEY, payload);
  return payload;
}

export async function loadLastCodexRateLimitSnapshot() {
  return await metaGet(SNAPSHOT_KEY);
}

export function selectCodexRateLimitBucket(snapshot = null) {
  const byId = snapshot?.rateLimitsByLimitId && typeof snapshot.rateLimitsByLimitId === 'object'
    ? snapshot.rateLimitsByLimitId
    : {};
  if (byId.codex) return byId.codex;
  const codexLike = Object.values(byId).find((entry) => {
    const id = String(entry?.limitId || '').toLowerCase();
    const name = String(entry?.limitName || '').toLowerCase();
    return id.includes('codex') || name.includes('codex');
  });
  if (codexLike) return codexLike;
  if (snapshot?.rateLimits) return snapshot.rateLimits;
  return Object.values(byId)[0] || null;
}

function windowStatus(bucket, key) {
  const source = bucket && typeof bucket === 'object' ? bucket[key] : null;
  return {
    usedPercent: Number.isFinite(Number(source?.usedPercent)) ? Number(source.usedPercent) : 0,
    windowDurationMins: Number.isFinite(Number(source?.windowDurationMins)) ? Number(source.windowDurationMins) : null,
    resetsAt: Number.isFinite(Number(source?.resetsAt)) ? Number(source.resetsAt) : null
  };
}

export function deriveCodexBudgetStatus({ settings, ledger, snapshot = null, error = null } = {}) {
  const normalizedSettings = normalizeCodexBudgetSettings(settings);
  const normalizedLedger = normalizeCodexBudgetLedger(ledger);
  const bucket = selectCodexRateLimitBucket(snapshot);
  const fiveHourSpentPercent = rollingSpendPercent(normalizedLedger, 300);
  const weeklySpentPercent = rollingSpendPercent(normalizedLedger, 10080);
  const primary = windowStatus(bucket, 'primary');
  const secondary = windowStatus(bucket, 'secondary');
  const liveLimitReached = !!bucket?.rateLimitReachedType || primary.usedPercent >= 100 || secondary.usedPercent >= 100;
  const nextTurnPercent = normalizedSettings.perTurnPercent;
  const fiveHourWouldExceed = fiveHourSpentPercent + nextTurnPercent > normalizedSettings.fiveHourPercent;
  const weeklyWouldExceed = weeklySpentPercent + nextTurnPercent > normalizedSettings.weeklyPercent;
  const localLimitReached = fiveHourWouldExceed || weeklyWouldExceed;
  const enabled = normalizedSettings.enabled !== false;
  const source = snapshot?.source || (error ? 'local-fallback' : 'local-only');
  const canSpend = enabled && !liveLimitReached && !localLimitReached;

  return {
    ok: true,
    enabled,
    source,
    bucket: bucket || null,
    settings: normalizedSettings,
    ledger: normalizedLedger,
    live: {
      planType: bucket?.planType || null,
      limitId: bucket?.limitId || null,
      limitName: bucket?.limitName || null,
      primary,
      secondary,
      rateLimitReachedType: bucket?.rateLimitReachedType || null
    },
    local: {
      fiveHourSpentPercent: Math.round(fiveHourSpentPercent * 10) / 10,
      weeklySpentPercent: Math.round(weeklySpentPercent * 10) / 10,
      fiveHourRemainingPercent: Math.max(0, Math.round((normalizedSettings.fiveHourPercent - fiveHourSpentPercent) * 10) / 10),
      weeklyRemainingPercent: Math.max(0, Math.round((normalizedSettings.weeklyPercent - weeklySpentPercent) * 10) / 10),
      nextTurnPercent
    },
    limits: {
      liveLimitReached,
      localLimitReached,
      fiveHourWouldExceed,
      weeklyWouldExceed
    },
    canSpend,
    error: error ? String(error?.message || error) : ''
  };
}

export async function refreshCodexBudgetStatus() {
  const settings = await loadCodexBudgetSettings();
  const ledger = await loadCodexBudgetLedger();
  try {
    const snapshot = await fetchCodexRateLimits();
    return deriveCodexBudgetStatus({ settings, ledger, snapshot });
  } catch (error) {
    const snapshot = await loadLastCodexRateLimitSnapshot().catch(() => null);
    return deriveCodexBudgetStatus({ settings, ledger, snapshot, error });
  }
}
