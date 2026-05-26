const { loadPlotByPairId } = require('../founders_plot/store');

// Prototype/ephemeral process-local stores; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const presenceByOwner = new Map();
const followsByOwner = new Map();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safePublicName(value = '', fallback = '') {
  const normalized = String(value || '').trim().replace(/\s+/g, ' ');
  return (normalized || fallback).slice(0, 48);
}

function charmBandFromPlot(plotState) {
  const charm = Number(plotState?.meta?.townSignals?.publicCharm || 0);
  if (charm >= 40) return 'welcoming';
  if (charm >= 15) return 'settling-in';
  return 'new';
}

function publicSummaryFor(owner, opts = {}) {
  const plotState = loadPlotByPairId(owner.pairId);
  const publicSquare = plotState?.meta?.landmarks?.publicSquare || null;
  const operatingModel = plotState?.meta?.operatingModel || null;
  return {
    hqLevel: Math.max(1, Number(plotState?.plot?.hqLevel || 1)),
    charmBand: charmBandFromPlot(plotState),
    charter: opts.showOperatingStyle === true ? (operatingModel?.selectedCharterId || null) : null,
    visibleLandmarks: [
      publicSquare?.level >= 1 ? 'Public Square' : null,
      publicSquare?.styleLabel || publicSquare?.style?.label || null
    ].filter(Boolean)
  };
}

function publicTownIdFor(owner) {
  return `public_town_${owner.ownerAccountId.replace(/^owner_/, '')}`;
}

function regionHintFor(region) {
  const terrainCounts = {};
  for (const cell of region?.cells || []) {
    terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
  }
  const topTerrain = Object.entries(terrainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'frontier';
  return `${topTerrain} territory`;
}

function buildPresence({ owner, region, displayName, townName, privacy = {} }) {
  const normalizedPrivacy = {
    showOperatingStyle: privacy.showOperatingStyle === true,
    showRegion: privacy.showRegion !== false,
    allowVisits: privacy.allowVisits !== false
  };
  return {
    publicTownId: publicTownIdFor(owner),
    accountPublicId: owner.ownerAccountId,
    displayName: safePublicName(displayName, 'A neighbor'),
    townName: safePublicName(townName, 'Founders Plot'),
    styleCardId: normalizedPrivacy.showOperatingStyle ? `style_${owner.ownerAccountId}` : undefined,
    regionHint: normalizedPrivacy.showRegion ? regionHintFor(region) : 'private region',
    publicSummary: publicSummaryFor(owner, normalizedPrivacy),
    privacy: normalizedPrivacy,
    updatedAtMs: Date.now()
  };
}

function optInPublicPresence(args) {
  const presence = buildPresence(args);
  presenceByOwner.set(args.owner.ownerAccountId, clone(presence));
  return clone(presence);
}

function optOutPublicPresence(owner) {
  const existed = presenceByOwner.delete(owner.ownerAccountId);
  return { removed: existed };
}

function listPublicTowns() {
  return [...presenceByOwner.values()].map((presence) => clone(presence));
}

function getPublicTown(publicTownId = '') {
  const target = String(publicTownId || '').trim();
  return listPublicTowns().find((presence) => presence.publicTownId === target) || null;
}

function followTown(owner, publicTownId = '') {
  const town = getPublicTown(publicTownId);
  if (!town) {
    const error = new Error('NOT_FOUND');
    error.details = { publicTownId };
    throw error;
  }
  if (town.accountPublicId === owner.ownerAccountId) {
    const error = new Error('INVALID_PUBLIC_TOWN');
    error.details = { reason: 'CANNOT_FOLLOW_SELF' };
    throw error;
  }
  const follows = followsByOwner.get(owner.ownerAccountId) || new Set();
  follows.add(town.publicTownId);
  followsByOwner.set(owner.ownerAccountId, follows);
  return {
    publicTownId: town.publicTownId,
    followed: true,
    followCount: follows.size
  };
}

function summarizeNeighbor(publicTownId = '') {
  const town = getPublicTown(publicTownId);
  if (!town) {
    const error = new Error('NOT_FOUND');
    error.details = { publicTownId };
    throw error;
  }
  return {
    publicTownId: town.publicTownId,
    summary: `${town.townName} is a ${town.publicSummary.charmBand} town in ${town.regionHint}.`,
    publicSummary: town.publicSummary
  };
}

module.exports = {
  followTown,
  getPublicTown,
  listPublicTowns,
  optInPublicPresence,
  optOutPublicPresence,
  summarizeNeighbor
};
