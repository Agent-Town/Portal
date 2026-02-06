const crypto = require('crypto');

const DEFAULT_POLICY = {
  maxPlayers: 120,
  maxHouses: 400,
  minExperienceHouses: 20,
  strategy: 'player_houses_plus_curated_fill_v1'
};

class MemoryPresence {
  constructor() {
    this.byInstance = new Map();
  }

  async reset() {
    this.byInstance.clear();
  }

  async add(instanceId, sessionId) {
    if (!this.byInstance.has(instanceId)) this.byInstance.set(instanceId, new Set());
    this.byInstance.get(instanceId).add(sessionId);
  }

  async remove(instanceId, sessionId) {
    const set = this.byInstance.get(instanceId);
    if (!set) return;
    set.delete(sessionId);
    if (!set.size) this.byInstance.delete(instanceId);
  }

  async count(instanceId) {
    return this.byInstance.get(instanceId)?.size || 0;
  }
}

class RedisPresence {
  constructor(client) {
    this.client = client;
    this.prefix = 'agenttown:world:presence:';
  }

  key(instanceId) {
    return `${this.prefix}${instanceId}`;
  }

  async reset() {
    const keys = await this.client.keys(`${this.prefix}*`);
    if (keys.length) await this.client.del(keys);
  }

  async add(instanceId, sessionId) {
    await this.client.sAdd(this.key(instanceId), sessionId);
  }

  async remove(instanceId, sessionId) {
    await this.client.sRem(this.key(instanceId), sessionId);
  }

  async count(instanceId) {
    return this.client.sCard(this.key(instanceId));
  }
}

async function createPresenceAdapter() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return new MemoryPresence();
  try {
    const { createClient } = require('redis');
    const client = createClient({ url: redisUrl });
    client.on('error', (err) => console.warn('[world-presence] redis error', err?.message || err));
    await client.connect();
    return new RedisPresence(client);
  } catch (err) {
    console.warn('[world-presence] falling back to memory adapter', err?.message || err);
    return new MemoryPresence();
  }
}

function toNumber(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function normalizePolicy(raw) {
  const next = {
    maxPlayers: Math.max(1, Math.floor(toNumber(raw?.maxPlayers, DEFAULT_POLICY.maxPlayers))),
    maxHouses: Math.max(1, Math.floor(toNumber(raw?.maxHouses, DEFAULT_POLICY.maxHouses))),
    minExperienceHouses: Math.max(
      0,
      Math.floor(toNumber(raw?.minExperienceHouses, DEFAULT_POLICY.minExperienceHouses))
    ),
    strategy: typeof raw?.strategy === 'string' && raw.strategy ? raw.strategy : DEFAULT_POLICY.strategy
  };
  if (next.minExperienceHouses > next.maxHouses) {
    next.minExperienceHouses = next.maxHouses;
  }
  return next;
}

function hash(seed) {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

function stableSort(arr, keyFn) {
  return [...arr].sort((a, b) => keyFn(a).localeCompare(keyFn(b)));
}

class WorldInstanceManager {
  constructor({ getSnapshot, presence }) {
    this.getSnapshot = getSnapshot;
    this.presence = presence;
    this.policy = { ...DEFAULT_POLICY };
    this.instances = new Map();
    this.sessionToInstance = new Map();
    this.sessionMeta = new Map();
    this.nextId = 1;
  }

  getPolicy() {
    return { ...this.policy };
  }

  setPolicy(raw) {
    this.policy = normalizePolicy({ ...this.policy, ...(raw || {}) });
    this.recomputeAll();
    return this.getPolicy();
  }

  async reset() {
    this.instances.clear();
    this.sessionToInstance.clear();
    this.sessionMeta.clear();
    this.nextId = 1;
    await this.presence.reset();
  }

  ensureInstance(instanceId) {
    let instance = this.instances.get(instanceId);
    if (!instance) {
      instance = {
        instanceId,
        sessions: new Set(),
        houses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.instances.set(instanceId, instance);
    }
    return instance;
  }

  generateInstanceId() {
    const id = `inst_public_${String(this.nextId).padStart(3, '0')}`;
    this.nextId += 1;
    return id;
  }

  chooseInstance(requestedInstanceId = null) {
    if (requestedInstanceId) {
      const forced = this.instances.get(requestedInstanceId);
      if (forced && forced.sessions.size < this.policy.maxPlayers) return forced;
    }

    const candidates = stableSort(Array.from(this.instances.values()), (x) => x.instanceId).filter(
      (x) => x.sessions.size < this.policy.maxPlayers
    );
    if (candidates.length) return candidates[0];

    return this.ensureInstance(this.generateInstanceId());
  }

  updateSessionMeta(sessionId, data) {
    const prev = this.sessionMeta.get(sessionId) || {};
    this.sessionMeta.set(sessionId, { ...prev, ...(data || {}) });
  }

  resolveSnapshot() {
    const snapshot = this.getSnapshot('public');
    if (!snapshot) return { world: null, houses: [], inhabitants: [] };
    return snapshot;
  }

  recomputeInstance(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;
    const snapshot = this.resolveSnapshot();
    const houseById = new Map(snapshot.houses.map((house) => [house.houseId, house]));
    const playerHouseIds = new Set();

    for (const sessionId of instance.sessions) {
      const houseId = this.sessionMeta.get(sessionId)?.houseId || null;
      if (houseId && houseById.has(houseId)) playerHouseIds.add(houseId);
    }

    const selectedIds = [];
    for (const houseId of stableSort(Array.from(playerHouseIds), (x) => x)) {
      if (selectedIds.length >= this.policy.maxHouses) break;
      selectedIds.push(houseId);
    }

    const experiencePool = snapshot.houses.filter((house) => house.type === 'experience');
    const selectedSet = new Set(selectedIds);
    let experienceCount = selectedIds.filter((id) => houseById.get(id)?.type === 'experience').length;

    for (const house of stableSort(experiencePool, (x) => x.houseId)) {
      if (selectedIds.length >= this.policy.maxHouses) break;
      if (selectedSet.has(house.houseId)) continue;
      if (experienceCount < this.policy.minExperienceHouses || selectedIds.length < this.policy.maxHouses) {
        selectedIds.push(house.houseId);
        selectedSet.add(house.houseId);
        experienceCount += 1;
      }
    }

    instance.houses = selectedIds.map((houseId) => houseById.get(houseId)).filter(Boolean);
    instance.updatedAt = new Date().toISOString();
    return instance;
  }

  recomputeAll() {
    for (const instanceId of this.instances.keys()) {
      this.recomputeInstance(instanceId);
    }
  }

  assign({ sessionId, houseId = null, requestedInstanceId = null } = {}) {
    if (!sessionId) return null;
    this.updateSessionMeta(sessionId, { houseId: houseId || null });

    const existingId = this.sessionToInstance.get(sessionId);
    if (existingId && this.instances.has(existingId)) {
      const existing = this.recomputeInstance(existingId);
      return this.formatAssignment(existing, sessionId);
    }

    const instance = this.chooseInstance(requestedInstanceId);
    instance.sessions.add(sessionId);
    this.sessionToInstance.set(sessionId, instance.instanceId);
    this.recomputeInstance(instance.instanceId);

    return this.formatAssignment(instance, sessionId);
  }

  unassign(sessionId) {
    const instanceId = this.sessionToInstance.get(sessionId);
    if (!instanceId) return;
    this.sessionToInstance.delete(sessionId);
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    instance.sessions.delete(sessionId);
    this.recomputeInstance(instanceId);
    if (!instance.sessions.size) this.instances.delete(instanceId);
  }

  async markPresence(instanceId, sessionId, joined) {
    if (!instanceId || !sessionId) return;
    if (joined) await this.presence.add(instanceId, sessionId);
    else await this.presence.remove(instanceId, sessionId);
  }

  getInstance(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;
    return {
      instanceId: instance.instanceId,
      sessions: [...instance.sessions],
      houses: instance.houses,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt
    };
  }

  formatAssignment(instance, sessionId) {
    const playerHouseIds = [];
    for (const id of instance.sessions) {
      const houseId = this.sessionMeta.get(id)?.houseId;
      if (houseId) playerHouseIds.push(houseId);
    }
    const experienceCount = instance.houses.filter((house) => house.type === 'experience').length;
    return {
      instanceId: instance.instanceId,
      roomName: 'world_instance_v1',
      sessionId,
      houses: instance.houses,
      policy: this.getPolicy(),
      composition: {
        playerHouseIds: stableSort([...new Set(playerHouseIds)], (x) => x),
        experienceHouses: experienceCount
      }
    };
  }

  clampPosition(x, y) {
    const snapshot = this.resolveSnapshot();
    const maxX = Math.max(0, Number(snapshot.world?.width || 2400));
    const maxY = Math.max(0, Number(snapshot.world?.height || 1400));
    return {
      x: Math.min(maxX, Math.max(0, x)),
      y: Math.min(maxY, Math.max(0, y))
    };
  }

  initialPosition(sessionId, instanceId) {
    const seed = hash(`${sessionId}:${instanceId}`);
    const x = parseInt(seed.slice(0, 8), 16) % 1200;
    const y = parseInt(seed.slice(8, 16), 16) % 700;
    const pos = this.clampPosition(100 + x, 100 + y);
    return pos;
  }

  getInstanceHouses(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return [];
    return instance.houses;
  }
}

module.exports = {
  DEFAULT_POLICY,
  createPresenceAdapter,
  WorldInstanceManager
};
