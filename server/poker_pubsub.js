const DEFAULT_POKER_PUBSUB_RETAIN_LIMIT = 128;

function normalizeTrimmedString(value, fallback = '') {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

function cloneJson(value) {
  return value == null ? null : JSON.parse(JSON.stringify(value));
}

function normalizeRetainLimit(value, fallback = DEFAULT_POKER_PUBSUB_RETAIN_LIMIT) {
  const limit = Number.parseInt(String(value), 10);
  if (!Number.isFinite(limit) || limit < 1) return fallback;
  return limit;
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
    publish,
    subscribe,
    getTopicSummary,
    reset,
  };
}

module.exports = {
  createPokerPubSubMemoryAdapter,
  DEFAULT_POKER_PUBSUB_RETAIN_LIMIT,
};
