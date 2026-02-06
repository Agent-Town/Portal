const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SUPPORTED_INSTANCES = new Set(['public']);
const FIXTURE_PATHS = {
  public: path.join(process.cwd(), 'data', 'fixtures', 'world', 'public.snapshot.v1.json')
};

const fixtureByInstance = new Map();
const testMutationsByInstance = new Map();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeCoord(coord) {
  const x = Number(coord?.x || 0);
  const y = Number(coord?.y || 0);
  return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
}

function normalizeHouse(raw) {
  return {
    houseId: String(raw?.houseId || '').trim(),
    type: raw?.type === 'experience' ? 'experience' : 'player',
    name: String(raw?.name || 'Unnamed House').slice(0, 80),
    instanceTags: Array.isArray(raw?.instanceTags)
      ? raw.instanceTags.map((x) => String(x).trim()).filter(Boolean)
      : [],
    coord: normalizeCoord(raw?.coord),
    spriteKey: typeof raw?.spriteKey === 'string' ? raw.spriteKey : 'house.placeholder.v1',
    updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : null
  };
}

function normalizeInhabitant(raw) {
  return {
    inhabitantId: String(raw?.inhabitantId || '').trim(),
    houseId: String(raw?.houseId || '').trim(),
    label: String(raw?.label || 'Unnamed').slice(0, 80),
    role: ['agent', 'human', 'npc'].includes(raw?.role) ? raw.role : 'npc',
    spriteKey: typeof raw?.spriteKey === 'string' ? raw.spriteKey : 'inhabitant.placeholder.v1',
    updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : null
  };
}

function normalizeSnapshot(raw, instance) {
  const houses = Array.isArray(raw?.houses) ? raw.houses.map(normalizeHouse).filter((h) => h.houseId) : [];
  houses.sort((a, b) => a.houseId.localeCompare(b.houseId));

  const inhabitants = Array.isArray(raw?.inhabitants)
    ? raw.inhabitants.map(normalizeInhabitant).filter((i) => i.inhabitantId && i.houseId)
    : [];
  inhabitants.sort((a, b) => a.inhabitantId.localeCompare(b.inhabitantId));

  const houseSet = new Set(houses.map((h) => h.houseId));
  const filteredInhabitants = inhabitants.filter((i) => houseSet.has(i.houseId));

  const width = Number(raw?.world?.width || 2400);
  const height = Number(raw?.world?.height || 1400);

  return {
    instance,
    world: {
      version: typeof raw?.world?.version === 'string' ? raw.world.version : 'world_projection_v1',
      seed: typeof raw?.world?.seed === 'string' ? raw.world.seed : 'test-world-v1',
      revision: null,
      updatedAt: typeof raw?.world?.updatedAt === 'string' ? raw.world.updatedAt : null,
      width: Number.isFinite(width) ? width : 2400,
      height: Number.isFinite(height) ? height : 1400
    },
    houses: houses.map((house) => ({
      ...house,
      inhabitants: filteredInhabitants.filter((inh) => inh.houseId === house.houseId).length
    })),
    inhabitants: filteredInhabitants
  };
}

function loadFixture(instance) {
  const fixturePath = FIXTURE_PATHS[instance];
  if (!fixturePath) return null;
  const raw = fs.readFileSync(fixturePath, 'utf8');
  const parsed = JSON.parse(raw);
  return normalizeSnapshot(parsed, instance);
}

function getFixtureSnapshot(instance) {
  if (!fixtureByInstance.has(instance)) {
    fixtureByInstance.set(instance, loadFixture(instance));
  }
  return fixtureByInstance.get(instance);
}

function hashInt(seed, max) {
  const digest = crypto.createHash('sha256').update(seed).digest();
  const raw = digest.readUInt32BE(0);
  return max > 0 ? raw % max : 0;
}

function normalizeHandle(raw) {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().replace(/^@+/, '');
  if (!value) return null;
  return value.slice(0, 20);
}

function safeIdSuffix(raw) {
  return String(raw || '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
}

function deriveCoordForHouse(houseId, width, height) {
  const margin = 140;
  const xSpan = Math.max(1, width - margin * 2);
  const ySpan = Math.max(1, height - margin * 2);
  return {
    x: margin + hashInt(`x:${houseId}`, xSpan),
    y: margin + hashInt(`y:${houseId}`, ySpan)
  };
}

function projectStoreRecords(instance, baseWorld, store) {
  const houses = [];
  const inhabitants = [];

  const sharesByHouseId = new Map();
  for (const share of Array.isArray(store?.shares) ? store.shares : []) {
    if (!share || typeof share.houseId !== 'string' || !share.houseId) continue;
    sharesByHouseId.set(share.houseId, share);
  }

  const publicByShareId = new Map();
  for (const team of Array.isArray(store?.publicTeams) ? store.publicTeams : []) {
    if (!team || typeof team.shareId !== 'string' || !team.shareId) continue;
    if (!publicByShareId.has(team.shareId)) publicByShareId.set(team.shareId, team);
  }

  const baseHouseIds = new Set((baseWorld?.houses || []).map((h) => h.houseId));
  for (const house of Array.isArray(store?.houses) ? store.houses : []) {
    const houseId = String(house?.id || '').trim();
    if (!houseId || baseHouseIds.has(houseId)) continue;

    const share = sharesByHouseId.get(houseId) || null;
    const team = share?.id ? publicByShareId.get(share.id) || null : null;
    const humanHandle = normalizeHandle(team?.humanHandle || share?.humanHandle || null);
    const agentNameRaw =
      typeof team?.agentName === 'string' && team.agentName
        ? team.agentName
        : typeof share?.agentName === 'string'
          ? share.agentName
          : null;
    const agentName = agentNameRaw ? agentNameRaw.trim().slice(0, 40) : null;

    const type = share?.mode === 'agent' || share?.mode === 'agent_solo' ? 'player' : 'player';
    let name = null;
    if (humanHandle) name = `@${humanHandle}'s House`;
    else if (agentName) name = `${agentName}'s House`;
    else name = `Player House ${houseId.slice(-4).toUpperCase()}`;

    const projectedHouse = normalizeHouse({
      houseId,
      type,
      name,
      instanceTags: ['player-house'],
      coord: deriveCoordForHouse(houseId, baseWorld.world.width, baseWorld.world.height),
      spriteKey: 'house.placeholder.player.v1',
      updatedAt: house?.createdAt || share?.createdAt || null
    });
    houses.push(projectedHouse);

    if (humanHandle) {
      inhabitants.push(
        normalizeInhabitant({
          inhabitantId: `I_HUMAN_${safeIdSuffix(houseId)}`,
          houseId,
          label: `@${humanHandle}`,
          role: 'human',
          spriteKey: 'inhabitant.placeholder.human.v1',
          updatedAt: projectedHouse.updatedAt
        })
      );
    }
    if (agentName) {
      inhabitants.push(
        normalizeInhabitant({
          inhabitantId: `I_AGENT_${safeIdSuffix(houseId)}`,
          houseId,
          label: agentName,
          role: 'agent',
          spriteKey: 'inhabitant.placeholder.agent.v1',
          updatedAt: projectedHouse.updatedAt
        })
      );
    }
    if (!humanHandle && !agentName) {
      inhabitants.push(
        normalizeInhabitant({
          inhabitantId: `I_RESIDENT_${safeIdSuffix(houseId)}`,
          houseId,
          label: 'Resident',
          role: 'npc',
          spriteKey: 'inhabitant.placeholder.resident.v1',
          updatedAt: projectedHouse.updatedAt
        })
      );
    }
  }

  houses.sort((a, b) => a.houseId.localeCompare(b.houseId));
  inhabitants.sort((a, b) => a.inhabitantId.localeCompare(b.inhabitantId));

  return { instance, houses, inhabitants };
}

function getTestMutation(instance) {
  if (!testMutationsByInstance.has(instance)) {
    testMutationsByInstance.set(instance, { houses: new Map(), inhabitants: new Map() });
  }
  return testMutationsByInstance.get(instance);
}

function buildRevision(world, houses, inhabitants) {
  const hashInput = JSON.stringify({
    seed: world.seed,
    width: world.width,
    height: world.height,
    houses: houses.map((h) => [h.houseId, h.updatedAt]),
    inhabitants: inhabitants.map((i) => [i.inhabitantId, i.houseId, i.updatedAt])
  });
  return crypto.createHash('sha256').update(hashInput).digest('hex').slice(0, 12);
}

function computeUpdatedAt(world, houses, inhabitants) {
  const stamps = [world.updatedAt]
    .concat(houses.map((h) => h.updatedAt))
    .concat(inhabitants.map((i) => i.updatedAt))
    .filter(Boolean);
  if (!stamps.length) return null;
  return stamps.sort().at(-1) || null;
}

function mergeSnapshotSources(baseSnapshot, storeProjection, testMutation) {
  const mergedHouses = new Map();
  const mergedInhabitants = new Map();

  for (const house of baseSnapshot.houses) mergedHouses.set(house.houseId, house);
  for (const house of storeProjection.houses) mergedHouses.set(house.houseId, house);
  for (const house of testMutation.houses.values()) mergedHouses.set(house.houseId, house);

  for (const inhabitant of baseSnapshot.inhabitants) mergedInhabitants.set(inhabitant.inhabitantId, inhabitant);
  for (const inhabitant of storeProjection.inhabitants) mergedInhabitants.set(inhabitant.inhabitantId, inhabitant);
  for (const inhabitant of testMutation.inhabitants.values()) mergedInhabitants.set(inhabitant.inhabitantId, inhabitant);

  const houseIds = new Set(mergedHouses.keys());
  const inhabitants = Array.from(mergedInhabitants.values()).filter((inh) => houseIds.has(inh.houseId));
  inhabitants.sort((a, b) => a.inhabitantId.localeCompare(b.inhabitantId));

  const popByHouse = new Map();
  for (const inhabitant of inhabitants) {
    popByHouse.set(inhabitant.houseId, (popByHouse.get(inhabitant.houseId) || 0) + 1);
  }

  const houses = Array.from(mergedHouses.values()).map((house) => ({
    ...house,
    inhabitants: popByHouse.get(house.houseId) || 0
  }));
  houses.sort((a, b) => a.houseId.localeCompare(b.houseId));

  const world = {
    ...baseSnapshot.world,
    updatedAt: computeUpdatedAt(baseSnapshot.world, houses, inhabitants)
  };
  world.revision = buildRevision(world, houses, inhabitants);

  return {
    instance: baseSnapshot.instance,
    world,
    houses,
    inhabitants
  };
}

function getWorldSnapshot(instance = 'public', store = null) {
  if (!SUPPORTED_INSTANCES.has(instance)) return null;
  const fixture = getFixtureSnapshot(instance);
  if (!fixture) return null;
  const baseSnapshot = clone(fixture);
  const storeProjection = projectStoreRecords(instance, baseSnapshot, store || {});
  const testMutation = getTestMutation(instance);
  return mergeSnapshotSources(baseSnapshot, storeProjection, testMutation);
}

function upsertTestWorldEntry({ instance = 'public', house, inhabitants = [] } = {}) {
  if (!SUPPORTED_INSTANCES.has(instance)) return null;
  const mutation = getTestMutation(instance);
  const normalizedHouse = normalizeHouse(house || {});
  if (!normalizedHouse.houseId) return null;
  mutation.houses.set(normalizedHouse.houseId, normalizedHouse);

  for (const [id, inhabitant] of Array.from(mutation.inhabitants.entries())) {
    if (inhabitant.houseId === normalizedHouse.houseId) mutation.inhabitants.delete(id);
  }
  for (const raw of Array.isArray(inhabitants) ? inhabitants : []) {
    const inhabitant = normalizeInhabitant(raw);
    if (!inhabitant.inhabitantId || inhabitant.houseId !== normalizedHouse.houseId) continue;
    mutation.inhabitants.set(inhabitant.inhabitantId, inhabitant);
  }
  return true;
}

function resetWorldState() {
  fixtureByInstance.clear();
  testMutationsByInstance.clear();
}

module.exports = {
  getWorldSnapshot,
  upsertTestWorldEntry,
  resetWorldState
};
