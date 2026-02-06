function createServerHouseVaultBackend(options = {}) {
  const maxEntries = Number.isFinite(options.maxEntries) ? Math.max(1, Math.floor(options.maxEntries)) : 200;
  const nowIso = typeof options.nowIso === 'function' ? options.nowIso : () => new Date().toISOString();
  const idFactory = typeof options.idFactory === 'function'
    ? options.idFactory
    : () => `re_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  function ensureEntries(house) {
    if (!house || typeof house !== 'object') throw new Error('HOUSE_BACKEND_INVALID_HOUSE');
    if (!Array.isArray(house.entries)) house.entries = [];
    return house.entries;
  }

  return {
    kind: 'server.store.v1',
    listEntries({ house }) {
      return ensureEntries(house);
    },
    appendEntry({ house, author, ciphertext }) {
      const entries = ensureEntries(house);
      if (entries.length >= maxEntries) throw new Error('HOUSE_FULL');
      const entry = {
        id: idFactory(),
        createdAt: nowIso(),
        author,
        ciphertext
      };
      entries.push(entry);
      return entry;
    }
  };
}

module.exports = {
  createServerHouseVaultBackend
};
