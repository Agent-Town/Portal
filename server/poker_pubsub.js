const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { getStorePath } = require('./store');

const DEFAULT_POKER_PUBSUB_RETAIN_LIMIT = 128;
const DEFAULT_POKER_PUBSUB_POLL_INTERVAL_MS = 125;
const DEFAULT_POKER_PUBSUB_POLL_BATCH_LIMIT = 32;

function normalizeTrimmedString(value, fallback = '') {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

function cloneJson(value) {
  return value == null ? null : JSON.parse(JSON.stringify(value));
}

function parseJson(value, fallback = null) {
  if (value == null || value === '') return fallback;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function normalizeRetainLimit(value, fallback = DEFAULT_POKER_PUBSUB_RETAIN_LIMIT) {
  const limit = Number.parseInt(String(value), 10);
  if (!Number.isFinite(limit) || limit < 1) return fallback;
  return limit;
}

function normalizePollIntervalMs(value, fallback = DEFAULT_POKER_PUBSUB_POLL_INTERVAL_MS) {
  const intervalMs = Number.parseInt(String(value), 10);
  if (!Number.isFinite(intervalMs) || intervalMs < 10) return fallback;
  return intervalMs;
}

function normalizePollBatchLimit(value, fallback = DEFAULT_POKER_PUBSUB_POLL_BATCH_LIMIT) {
  const limit = Number.parseInt(String(value), 10);
  if (!Number.isFinite(limit) || limit < 1) return fallback;
  return limit;
}

function normalizePokerPubSubAdapterKind(value, fallback = 'memory') {
  const kind = normalizeTrimmedString(value, fallback).toLowerCase();
  if (kind === 'sqlite') return 'sqlite';
  return 'memory';
}

function createPokerPubSubMemoryAdapter({
  nowIso = () => new Date().toISOString(),
  retainLimit = DEFAULT_POKER_PUBSUB_RETAIN_LIMIT,
} = {}) {
  const maxRetained = normalizeRetainLimit(retainLimit);
  const topicStates = new Map();

  function getTopicState(topic) {
    const normalizedTopic = normalizeTrimmedString(topic);
    if (!normalizedTopic) return null;
    if (!topicStates.has(normalizedTopic)) {
      topicStates.set(normalizedTopic, {
        topic: normalizedTopic,
        publishCount: 0,
        retained: [],
        subscribers: new Map(),
        deliveryCounts: new Map(),
        latestPublishedAt: null,
      });
    }
    return topicStates.get(normalizedTopic);
  }

  function publish({ topic, message = null, metadata = null } = {}) {
    const state = getTopicState(topic);
    if (!state) return null;
    state.publishCount += 1;
    const envelope = {
      topic: state.topic,
      eventId: `${state.topic}:${state.publishCount}`,
      publishCount: state.publishCount,
      publishedAt: normalizeTrimmedString(nowIso(), new Date().toISOString()),
      message: cloneJson(message),
      metadata: cloneJson(metadata),
    };
    state.latestPublishedAt = envelope.publishedAt;
    state.retained.push(envelope);
    if (state.retained.length > maxRetained) {
      state.retained.splice(0, state.retained.length - maxRetained);
    }
    for (const [subscriberId, listener] of state.subscribers.entries()) {
      state.deliveryCounts.set(subscriberId, Number(state.deliveryCounts.get(subscriberId) || 0) + 1);
      try {
        listener(cloneJson(envelope.message), cloneJson(envelope));
      } catch {
        // Subscriber owners are responsible for cleanup.
      }
    }
    return cloneJson(envelope);
  }

  function subscribe({ topic, subscriberId = '', listener } = {}) {
    const state = getTopicState(topic);
    const normalizedSubscriberId = normalizeTrimmedString(subscriberId);
    if (!state || !normalizedSubscriberId || typeof listener !== 'function') {
      return () => {};
    }
    state.subscribers.set(normalizedSubscriberId, listener);
    if (!state.deliveryCounts.has(normalizedSubscriberId)) {
      state.deliveryCounts.set(normalizedSubscriberId, 0);
    }
    return () => {
      const current = getTopicState(topic);
      if (!current) return;
      current.subscribers.delete(normalizedSubscriberId);
      if (!current.subscribers.size && current.publishCount === 0) {
        topicStates.delete(current.topic);
      }
    };
  }

  function getTopicSummary(topic) {
    const state = getTopicState(topic);
    if (!state) return null;
    return {
      adapterKind: 'memory',
      topic: state.topic,
      publishCount: state.publishCount,
      retainedCount: state.retained.length,
      latestPublishedAt: state.latestPublishedAt,
      latestEnvelope: state.retained.length ? cloneJson(state.retained[state.retained.length - 1]) : null,
      subscriberCount: state.subscribers.size,
      subscribers: Array.from(state.subscribers.keys()).sort().map((subscriberId) => ({
        subscriberId,
        deliveryCount: Number(state.deliveryCounts.get(subscriberId) || 0),
      })),
    };
  }

  function reset() {
    topicStates.clear();
  }

  return {
    adapterKind: 'memory',
    close() {},
    publish,
    subscribe,
    getTopicSummary,
    reset,
  };
}

function createPokerPubSubSqliteAdapter({
  nowIso = () => new Date().toISOString(),
  retainLimit = DEFAULT_POKER_PUBSUB_RETAIN_LIMIT,
  pollIntervalMs = DEFAULT_POKER_PUBSUB_POLL_INTERVAL_MS,
  pollBatchLimit = DEFAULT_POKER_PUBSUB_POLL_BATCH_LIMIT,
  storePath = getStorePath(),
} = {}) {
  const maxRetained = normalizeRetainLimit(retainLimit);
  const pollEveryMs = normalizePollIntervalMs(pollIntervalMs);
  const maxPollBatch = normalizePollBatchLimit(pollBatchLimit);
  const resolvedStorePath = path.resolve(normalizeTrimmedString(storePath, getStorePath()));
  fs.mkdirSync(path.dirname(resolvedStorePath), { recursive: true });
  const database = new DatabaseSync(resolvedStorePath);
  database.exec('PRAGMA foreign_keys = ON;');
  database.exec('PRAGMA journal_mode = WAL;');
  database.exec('PRAGMA synchronous = NORMAL;');
  database.exec('PRAGMA busy_timeout = 5000;');
  database.exec(`
    CREATE TABLE IF NOT EXISTS poker_pubsub_topic_counters (
      topic TEXT PRIMARY KEY,
      publish_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS poker_pubsub_events (
      event_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      publish_count INTEGER NOT NULL,
      published_at TEXT NOT NULL,
      message_json TEXT NOT NULL,
      metadata_json TEXT,
      UNIQUE (topic, publish_count)
    );

    CREATE INDEX IF NOT EXISTS poker_pubsub_events_topic_row_idx
      ON poker_pubsub_events(topic, event_row_id ASC);
  `);

  const topicStates = new Map();
  let pollTimer = null;
  let pollInFlight = false;

  const selectTopicCounter = database.prepare(`
    SELECT publish_count
    FROM poker_pubsub_topic_counters
    WHERE topic = ?
  `);
  const upsertTopicCounter = database.prepare(`
    INSERT INTO poker_pubsub_topic_counters (topic, publish_count)
    VALUES (?, ?)
    ON CONFLICT(topic) DO UPDATE SET publish_count = excluded.publish_count
  `);
  const insertEvent = database.prepare(`
    INSERT INTO poker_pubsub_events (
      topic,
      publish_count,
      published_at,
      message_json,
      metadata_json
    ) VALUES (?, ?, ?, ?, ?)
  `);
  const selectTopicMaxRowId = database.prepare(`
    SELECT COALESCE(MAX(event_row_id), 0) AS max_row_id
    FROM poker_pubsub_events
    WHERE topic = ?
  `);
  const selectTopicCount = database.prepare(`
    SELECT COUNT(1) AS count
    FROM poker_pubsub_events
    WHERE topic = ?
  `);
  const selectLatestEvent = database.prepare(`
    SELECT *
    FROM poker_pubsub_events
    WHERE topic = ?
    ORDER BY event_row_id DESC
    LIMIT 1
  `);
  const selectEventsAfterRowId = database.prepare(`
    SELECT *
    FROM poker_pubsub_events
    WHERE topic = ?
      AND event_row_id > ?
    ORDER BY event_row_id ASC
    LIMIT ?
  `);
  const pruneEvents = database.prepare(`
    DELETE FROM poker_pubsub_events
    WHERE topic = ?
      AND event_row_id < COALESCE((
        SELECT MIN(retained.event_row_id)
        FROM (
          SELECT event_row_id
          FROM poker_pubsub_events
          WHERE topic = ?
          ORDER BY event_row_id DESC
          LIMIT ?
        ) retained
      ), 0)
  `);
  const deleteAllEvents = database.prepare('DELETE FROM poker_pubsub_events');
  const deleteAllCounters = database.prepare('DELETE FROM poker_pubsub_topic_counters');

  function buildEnvelopeFromRow(row) {
    if (!row || typeof row !== 'object') return null;
    const topic = normalizeTrimmedString(row.topic);
    const publishCount = Number(row.publish_count || 0);
    return {
      topic,
      eventId: `${topic}:${publishCount}`,
      publishCount,
      publishedAt: normalizeTrimmedString(row.published_at),
      message: parseJson(row.message_json, null),
      metadata: parseJson(row.metadata_json, null),
    };
  }

  function getTopicState(topic, { create = false } = {}) {
    const normalizedTopic = normalizeTrimmedString(topic);
    if (!normalizedTopic) return null;
    if (topicStates.has(normalizedTopic)) {
      return topicStates.get(normalizedTopic);
    }
    if (!create) return null;
    const baselineRow = selectTopicMaxRowId.get(normalizedTopic);
    const state = {
      topic: normalizedTopic,
      lastSeenEventRowId: Number(baselineRow?.max_row_id || 0),
      subscribers: new Map(),
      deliveryCounts: new Map(),
    };
    topicStates.set(normalizedTopic, state);
    return state;
  }

  function hasSubscribers() {
    for (const state of topicStates.values()) {
      if (state.subscribers.size) return true;
    }
    return false;
  }

  function deliverToTopicState(state, envelope) {
    if (!state || !envelope) return;
    for (const [subscriberId, listener] of state.subscribers.entries()) {
      state.deliveryCounts.set(subscriberId, Number(state.deliveryCounts.get(subscriberId) || 0) + 1);
      try {
        listener(cloneJson(envelope.message), cloneJson(envelope));
      } catch {
        // Subscriber owners handle cleanup and failures.
      }
    }
  }

  function stopPoller() {
    if (!pollTimer) return;
    clearInterval(pollTimer);
    pollTimer = null;
  }

  function pollOnce() {
    if (pollInFlight) return;
    pollInFlight = true;
    try {
      for (const state of topicStates.values()) {
        if (!state.subscribers.size) continue;
        const rows = selectEventsAfterRowId.all(
          state.topic,
          state.lastSeenEventRowId,
          maxPollBatch
        );
        for (const row of rows) {
          state.lastSeenEventRowId = Math.max(
            state.lastSeenEventRowId,
            Number(row?.event_row_id || 0)
          );
          deliverToTopicState(state, buildEnvelopeFromRow(row));
        }
      }
    } finally {
      pollInFlight = false;
      if (!hasSubscribers()) {
        stopPoller();
      }
    }
  }

  function ensurePoller() {
    if (pollTimer || !hasSubscribers()) return;
    pollTimer = setInterval(() => {
      pollOnce();
    }, pollEveryMs);
    if (typeof pollTimer.unref === 'function') {
      pollTimer.unref();
    }
  }

  function publish({ topic, message = null, metadata = null } = {}) {
    const normalizedTopic = normalizeTrimmedString(topic);
    if (!normalizedTopic) return null;
    let eventRow = null;
    database.exec('BEGIN IMMEDIATE');
    try {
      const existingCounter = selectTopicCounter.get(normalizedTopic);
      const nextPublishCount = Number(existingCounter?.publish_count || 0) + 1;
      upsertTopicCounter.run(normalizedTopic, nextPublishCount);
      const publishedAt = normalizeTrimmedString(nowIso(), new Date().toISOString());
      const messageJson = JSON.stringify(message == null ? null : message);
      const metadataJson = JSON.stringify(metadata == null ? null : metadata);
      const insertResult = insertEvent.run(
        normalizedTopic,
        nextPublishCount,
        publishedAt,
        messageJson,
        metadataJson
      );
      pruneEvents.run(normalizedTopic, normalizedTopic, maxRetained);
      database.exec('COMMIT');
      eventRow = {
        event_row_id: Number(insertResult?.lastInsertRowid || 0),
        topic: normalizedTopic,
        publish_count: nextPublishCount,
        published_at: publishedAt,
        message_json: messageJson,
        metadata_json: metadataJson,
      };
    } catch (err) {
      database.exec('ROLLBACK');
      throw err;
    }
    const envelope = buildEnvelopeFromRow(eventRow);
    const state = getTopicState(normalizedTopic, { create: false });
    if (state) {
      state.lastSeenEventRowId = Math.max(
        state.lastSeenEventRowId,
        Number(eventRow?.event_row_id || 0)
      );
      deliverToTopicState(state, envelope);
    }
    return cloneJson(envelope);
  }

  function subscribe({ topic, subscriberId = '', listener } = {}) {
    const normalizedTopic = normalizeTrimmedString(topic);
    const normalizedSubscriberId = normalizeTrimmedString(subscriberId);
    if (!normalizedTopic || !normalizedSubscriberId || typeof listener !== 'function') {
      return () => {};
    }
    const state = getTopicState(normalizedTopic, { create: true });
    state.subscribers.set(normalizedSubscriberId, listener);
    if (!state.deliveryCounts.has(normalizedSubscriberId)) {
      state.deliveryCounts.set(normalizedSubscriberId, 0);
    }
    ensurePoller();
    return () => {
      const currentState = getTopicState(normalizedTopic, { create: false });
      if (!currentState) return;
      currentState.subscribers.delete(normalizedSubscriberId);
      if (!currentState.subscribers.size) {
        topicStates.delete(normalizedTopic);
      }
      if (!hasSubscribers()) {
        stopPoller();
      }
    };
  }

  function getTopicSummary(topic) {
    const normalizedTopic = normalizeTrimmedString(topic);
    if (!normalizedTopic) return null;
    const counterRow = selectTopicCounter.get(normalizedTopic);
    const latestRow = selectLatestEvent.get(normalizedTopic);
    const countRow = selectTopicCount.get(normalizedTopic);
    const state = getTopicState(normalizedTopic, { create: false });
    return {
      adapterKind: 'sqlite',
      topic: normalizedTopic,
      publishCount: Number(counterRow?.publish_count || 0),
      retainedCount: Number(countRow?.count || 0),
      latestPublishedAt: normalizeTrimmedString(latestRow?.published_at, ''),
      latestEnvelope: buildEnvelopeFromRow(latestRow),
      subscriberCount: state?.subscribers?.size || 0,
      subscribers: Array.from(state?.subscribers?.keys?.() || [])
        .sort()
        .map((subscriberId) => ({
          subscriberId,
          deliveryCount: Number(state?.deliveryCounts?.get(subscriberId) || 0),
        })),
    };
  }

  function reset() {
    stopPoller();
    topicStates.clear();
    database.exec('BEGIN IMMEDIATE');
    try {
      deleteAllEvents.run();
      deleteAllCounters.run();
      database.exec('COMMIT');
    } catch (err) {
      database.exec('ROLLBACK');
      throw err;
    }
  }

  function close() {
    stopPoller();
    topicStates.clear();
    if (database && typeof database.close === 'function') {
      database.close();
    }
  }

  return {
    adapterKind: 'sqlite',
    close,
    getTopicSummary,
    publish,
    reset,
    subscribe,
  };
}

function createPokerPubSubAdapter(options = {}) {
  const adapterKind = normalizePokerPubSubAdapterKind(
    options.kind,
    'memory'
  );
  if (adapterKind === 'sqlite') {
    return createPokerPubSubSqliteAdapter(options);
  }
  return createPokerPubSubMemoryAdapter(options);
}

module.exports = {
  createPokerPubSubAdapter,
  createPokerPubSubMemoryAdapter,
  createPokerPubSubSqliteAdapter,
  DEFAULT_POKER_PUBSUB_RETAIN_LIMIT,
  DEFAULT_POKER_PUBSUB_POLL_BATCH_LIMIT,
  DEFAULT_POKER_PUBSUB_POLL_INTERVAL_MS,
  normalizePokerPubSubAdapterKind,
};
