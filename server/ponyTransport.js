function ensureInbox(store) {
  if (!store || typeof store !== 'object') throw new Error('INVALID_TRANSPORT_STORE');
  if (!Array.isArray(store.inbox)) store.inbox = [];
  return store.inbox;
}

function createHttpRelayAdapter() {
  return {
    id: 'relay.http.v1',
    canHandle(transport) {
      const kind = typeof transport?.kind === 'string' ? transport.kind.trim() : '';
      return !kind || kind === 'relay.http.v1';
    },
    deliver({ store, message }) {
      ensureInbox(store).push(message);
      return {
        ok: true,
        adapter: 'relay.http.v1'
      };
    }
  };
}

function createFallbackRelayAdapter() {
  return {
    id: 'relay.fallback.v1',
    canHandle() {
      return true;
    },
    deliver({ store, message }) {
      ensureInbox(store).push(message);
      return {
        ok: true,
        adapter: 'relay.fallback.v1'
      };
    }
  };
}

function createPonyTransportService(options = {}) {
  const adapters = Array.isArray(options.adapters) ? options.adapters.filter(Boolean) : [createHttpRelayAdapter()];
  const fallbackAdapter = options.fallbackAdapter || createFallbackRelayAdapter();

  function resolveAdapter(transport, context) {
    const adapter = adapters.find((candidate) => {
      if (!candidate || typeof candidate.canHandle !== 'function') return false;
      try {
        return candidate.canHandle(transport, context);
      } catch {
        return false;
      }
    });
    return adapter || fallbackAdapter;
  }

  return {
    resolveAdapter,
    dispatch({ store, message, transport, context }) {
      const adapter = resolveAdapter(transport, context);
      if (!adapter || typeof adapter.deliver !== 'function') {
        throw new Error('TRANSPORT_ADAPTER_UNAVAILABLE');
      }
      return adapter.deliver({ store, message, transport, context });
    }
  };
}

module.exports = {
  createHttpRelayAdapter,
  createFallbackRelayAdapter,
  createPonyTransportService
};
