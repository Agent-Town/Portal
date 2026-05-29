'use strict';

const AGENT_TOWN_ICON_ASSET_BASE = '/assets/icons/agent-town';
const AGENT_TOWN_ICON_ASSET_SET = 'agent-town-global-icons-v1';
const AGENT_TOWN_ICON_GENERATOR = 'agent_town_global_icon_registry_v1';
const RESOURCE_KEYS = Object.freeze(['wood', 'stone', 'food', 'coin']);

const AGENT_TOWN_ICON_SPECS = Object.freeze({
  'building.hq': {
    label: 'Headquarters',
    symbol: 'HQ',
    tone: 'command',
    source: 'building:HQ',
    assetFile: 'hq-command-gpt-image-2-v1.png'
  },
  'building.lumber_camp': {
    label: 'Wood chain',
    symbol: 'W',
    tone: 'wood',
    source: 'building:LUMBER_CAMP',
    assetFile: 'lumber-camp-gpt-image-2-v1.png'
  },
  'building.farm_plot': {
    label: 'Food chain',
    symbol: 'F',
    tone: 'food',
    source: 'building:FARM_PLOT',
    assetFile: 'farm-plot-gpt-image-2-v1.png'
  },
  'building.quarry': {
    label: 'Stone chain',
    symbol: 'S',
    tone: 'stone',
    source: 'building:QUARRY',
    assetFile: 'quarry-gpt-image-2-v1.png'
  },
  'building.workshop': {
    label: 'Workshop chain',
    symbol: 'WK',
    tone: 'craft',
    source: 'building:WORKSHOP'
  },
  'building.market_stall': {
    label: 'Coin chain',
    symbol: 'C',
    tone: 'coin',
    source: 'building:MARKET_STALL'
  },
  'resource.wood': {
    label: 'Wood',
    symbol: 'W',
    tone: 'wood',
    source: 'resource:wood',
    assetFile: 'wood-resource-gpt-image-2-v1.png'
  },
  'resource.food': {
    label: 'Food',
    symbol: 'F',
    tone: 'food',
    source: 'resource:food',
    assetFile: 'food-resource-gpt-image-2-v1.png'
  },
  'resource.stone': {
    label: 'Stone',
    symbol: 'S',
    tone: 'stone',
    source: 'resource:stone',
    assetFile: 'stone-resource-gpt-image-2-v1.png'
  },
  'resource.coin': {
    label: 'Coin',
    symbol: 'C',
    tone: 'coin',
    source: 'resource:coin'
  },
  'resource.xp': {
    label: 'Town XP',
    symbol: 'XP',
    tone: 'xp',
    source: 'resource:xp'
  },
  'hq.upgrade': {
    label: 'HQ upgrade',
    symbol: 'H',
    tone: 'command',
    source: 'hq:upgrade',
    assetFile: 'hq-upgrade-gpt-image-2-v1.png'
  },
  'permission.queueProduction': {
    label: 'Foreman queueing',
    symbol: 'Q',
    tone: 'foreman',
    source: 'permission:queueProduction',
    assetFile: 'foreman-queue-gpt-image-2-v1.png'
  },
  'action.construct': {
    label: 'Construction',
    symbol: 'B',
    tone: 'building',
    source: 'action:construct'
  },
  'action.produce': {
    label: 'Production',
    symbol: 'P',
    tone: 'resource',
    source: 'action:produce'
  },
  'action.collect': {
    label: 'Collect output',
    symbol: 'C',
    tone: 'resource',
    source: 'action:collect'
  }
});

function normalizeIconId(value) {
  return String(value || 'progression.generic').trim() || 'progression.generic';
}

function iconAssetPath(assetFile) {
  const safeFile = String(assetFile || '').trim();
  if (!safeFile || safeFile.includes('/') || safeFile.includes('..')) return null;
  return `${AGENT_TOWN_ICON_ASSET_BASE}/${safeFile}`;
}

function getAgentTownIcon(iconId, overrides = {}) {
  const key = normalizeIconId(iconId);
  const spec = AGENT_TOWN_ICON_SPECS[key] || {};
  const sourceAssetFile = Object.prototype.hasOwnProperty.call(overrides, 'assetFile')
    ? overrides.assetFile
    : spec.assetFile;
  const sourceAssetPath = Object.prototype.hasOwnProperty.call(overrides, 'assetPath')
    ? overrides.assetPath
    : iconAssetPath(sourceAssetFile);
  const assetPath = sourceAssetPath ? String(sourceAssetPath) : null;
  return {
    iconId: String(overrides.iconId || key),
    label: String(overrides.label || spec.label || 'Agent Town icon'),
    symbol: String(overrides.symbol || spec.symbol || '?').slice(0, 3),
    tone: String(overrides.tone || spec.tone || 'neutral'),
    source: String(overrides.source || spec.source || key),
    assetPath,
    assetSet: assetPath ? AGENT_TOWN_ICON_ASSET_SET : null,
    generatedBy: AGENT_TOWN_ICON_GENERATOR,
    generatedAdHoc: !!assetPath,
    global: true
  };
}

function getAgentTownIconCatalog() {
  return Object.keys(AGENT_TOWN_ICON_SPECS)
    .sort()
    .reduce((acc, iconId) => {
      acc[iconId] = getAgentTownIcon(iconId);
      return acc;
    }, {});
}

module.exports = {
  AGENT_TOWN_ICON_ASSET_BASE,
  AGENT_TOWN_ICON_ASSET_SET,
  AGENT_TOWN_ICON_GENERATOR,
  AGENT_TOWN_ICON_SPECS,
  RESOURCE_KEYS,
  getAgentTownIcon,
  getAgentTownIconCatalog,
  iconAssetPath
};
