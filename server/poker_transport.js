const POKER_PLAY_TRANSPORT_VERSION = 1;
const DEFAULT_POKER_PLAY_TRANSPORT_REPLAY_LIMIT = 64;

function normalizeTrimmedString(value, fallback = '') {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

function normalizeChannelKind(value) {
  const kind = normalizeTrimmedString(value).toLowerCase();
  if (kind === 'table' || kind === 'series') return kind;
  return '';
}

function normalizeVersion(value, fallback = null) {
  if (value == null || value === '') return fallback;
  const version = Number.parseInt(String(value), 10);
  if (!Number.isFinite(version) || version < 0) return fallback;
  return version;
}

function buildChannelKey(channelKind, channelId) {
  const kind = normalizeChannelKind(channelKind);
  const id = normalizeTrimmedString(channelId);
  if (!kind || !id) return '';
  return `${kind}:${id}`;
}

function cloneEnvelope(envelope) {
  return envelope && typeof envelope === 'object'
    ? JSON.parse(JSON.stringify(envelope))
    : null;
}

function createPokerTransportMemoryAdapter({
  nowIso = () => new Date().toISOString(),
  replayLimit = DEFAULT_POKER_PLAY_TRANSPORT_REPLAY_LIMIT,
} = {}) {
  const channelStates = new Map();
  const listenersByChannel = new Map();
  const maxReplayEntries = Math.max(1, Number.parseInt(String(replayLimit), 10) || DEFAULT_POKER_PLAY_TRANSPORT_REPLAY_LIMIT);

  function getChannelState(channelKind, channelId) {
    const key = buildChannelKey(channelKind, channelId);
    if (!key) return null;
    if (!channelStates.has(key)) {
      channelStates.set(key, {
        channelKind: normalizeChannelKind(channelKind),
        channelId: normalizeTrimmedString(channelId),
        version: 0,
        deltas: [],
      });
    }
    return channelStates.get(key);
  }

  function buildEnvelope({
    channelKind,
    channelId,
    messageKind = 'delta',
    version = 0,
    prevVersion = 0,
    patch = null,
    snapshot = null,
    reason = '',
    at = nowIso(),
  } = {}) {
    return {
      transportVersion: POKER_PLAY_TRANSPORT_VERSION,
      channelKind: normalizeChannelKind(channelKind),
      channelId: normalizeTrimmedString(channelId),
      messageKind: normalizeTrimmedString(messageKind, 'delta'),
      version: Math.max(0, Number(version || 0)),
      prevVersion: Math.max(0, Number(prevVersion || 0)),
      patch: patch && typeof patch === 'object' ? cloneEnvelope(patch) : null,
      snapshot: snapshot && typeof snapshot === 'object' ? cloneEnvelope(snapshot) : null,
      reason: normalizeTrimmedString(reason),
      at: normalizeTrimmedString(at, nowIso()),
    };
  }

  function publish({
    channelKind,
    channelId,
    reason = 'update',
    patch = null,
    at = nowIso(),
  } = {}) {
    const state = getChannelState(channelKind, channelId);
    if (!state) return null;
    const prevVersion = state.version;
    state.version += 1;
    const envelope = buildEnvelope({
      channelKind: state.channelKind,
      channelId: state.channelId,
      messageKind: 'delta',
      version: state.version,
      prevVersion,
      patch,
      reason,
      at,
    });
    state.deltas.push(envelope);
    if (state.deltas.length > maxReplayEntries) {
      state.deltas.splice(0, state.deltas.length - maxReplayEntries);
    }
    const key = buildChannelKey(state.channelKind, state.channelId);
    const listeners = listenersByChannel.get(key);
    if (listeners && listeners.size) {
      for (const listener of listeners) {
        try {
          listener(cloneEnvelope(envelope));
        } catch {
          // Listener owners handle cleanup on failure.
        }
      }
    }
    return cloneEnvelope(envelope);
  }

  function subscribe({ channelKind, channelId, listener } = {}) {
    const key = buildChannelKey(channelKind, channelId);
    if (!key || typeof listener !== 'function') {
      return () => {};
    }
    const listeners = listenersByChannel.get(key) || new Set();
    listeners.add(listener);
    listenersByChannel.set(key, listeners);
    return () => {
      const current = listenersByChannel.get(key);
      if (!current) return;
      current.delete(listener);
      if (!current.size) {
        listenersByChannel.delete(key);
      }
    };
  }

  function buildSnapshotEnvelope({
    channelKind,
    channelId,
    snapshot = null,
    reason = 'subscribe',
    at = nowIso(),
  } = {}) {
    const state = getChannelState(channelKind, channelId);
    if (!state) return null;
    return buildEnvelope({
      channelKind: state.channelKind,
      channelId: state.channelId,
      messageKind: 'snapshot',
      version: state.version,
      prevVersion: state.version > 0 ? state.version - 1 : 0,
      snapshot,
      reason,
      at,
    });
  }

  function resolveReplay({
    channelKind,
    channelId,
    lastSeenVersion = null,
  } = {}) {
    const state = getChannelState(channelKind, channelId);
    if (!state) {
      return {
        mode: 'snapshot',
        version: 0,
        deltas: [],
        reason: 'missing_channel',
      };
    }
    const normalizedLastSeenVersion = normalizeVersion(lastSeenVersion, null);
    if (normalizedLastSeenVersion == null) {
      return {
        mode: 'snapshot',
        version: state.version,
        deltas: [],
        reason: 'subscribe',
      };
    }
    if (normalizedLastSeenVersion === state.version) {
      return {
        mode: 'noop',
        version: state.version,
        deltas: [],
        reason: 'already_current',
      };
    }
    if (normalizedLastSeenVersion > state.version) {
      return {
        mode: 'reset',
        version: state.version,
        deltas: [],
        reason: 'future_version',
      };
    }
    const deltas = state.deltas
      .filter((entry) => Number(entry?.version || 0) > normalizedLastSeenVersion)
      .sort((left, right) => Number(left?.version || 0) - Number(right?.version || 0));
    const contiguous = deltas.length > 0
      && Number(deltas[0]?.version || 0) === normalizedLastSeenVersion + 1
      && Number(deltas[deltas.length - 1]?.version || 0) === state.version;
    if (!contiguous) {
      return {
        mode: 'reset',
        version: state.version,
        deltas: [],
        reason: 'version_gap',
      };
    }
    return {
      mode: 'replay',
      version: state.version,
      deltas: deltas.map((entry) => cloneEnvelope(entry)).filter(Boolean),
      reason: 'replay',
    };
  }

  function getChannelStateSummary(channelKind, channelId) {
    const state = getChannelState(channelKind, channelId);
    if (!state) return null;
    const key = buildChannelKey(channelKind, channelId);
    return {
      adapterKind: 'memory',
      transportVersion: POKER_PLAY_TRANSPORT_VERSION,
      channelKind: state.channelKind,
      channelId: state.channelId,
      version: state.version,
      replayEntryCount: state.deltas.length,
      latestDelta: state.deltas.length ? cloneEnvelope(state.deltas[state.deltas.length - 1]) : null,
      subscriberCount: listenersByChannel.get(key)?.size || 0,
    };
  }

  function reset() {
    channelStates.clear();
    listenersByChannel.clear();
  }

  return {
    adapterKind: 'memory',
    transportVersion: POKER_PLAY_TRANSPORT_VERSION,
    buildSnapshotEnvelope,
    getChannelStateSummary,
    publish,
    reset,
    resolveReplay,
    subscribe,
  };
}

module.exports = {
  createPokerTransportMemoryAdapter,
  DEFAULT_POKER_PLAY_TRANSPORT_REPLAY_LIMIT,
  POKER_PLAY_TRANSPORT_VERSION,
};
