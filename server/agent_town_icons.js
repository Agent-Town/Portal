'use strict';

const AGENT_TOWN_ICON_ASSET_BASE = '/assets/icons/agent-town';
const AGENT_TOWN_OBJECT_ASSET_BASE = '/experiences/founders-plot/assets/objects';
const AGENT_TOWN_ICON_ASSET_SET = 'agent-town-global-icons-v1';
const AGENT_TOWN_ICON_GENERATOR = 'agent_town_global_icon_registry_v1';
const RESOURCE_KEYS = Object.freeze(['wood', 'stone', 'food', 'coin']);

function objectAssetPath(file) {
  return `${AGENT_TOWN_OBJECT_ASSET_BASE}/${file}`;
}

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
  'building.expedition_board': {
    label: 'Expedition Board',
    symbol: 'EB',
    tone: 'expedition',
    source: 'building:EXPEDITION_BOARD',
    assetFile: 'expedition-board-gpt-image-2-v1.png'
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
  'building.research_lodge': {
    label: 'Research Lodge',
    symbol: 'RL',
    tone: 'research',
    source: 'building:RESEARCH_LODGE',
    assetFile: 'research-lodge-gpt-image-2-v1.png'
  },
  'building.cohort_hall': {
    label: 'Cohort Hall',
    symbol: 'CH',
    tone: 'civic',
    source: 'building:COHORT_HALL',
    assetFile: 'cohort-work-order-gpt-image-2-v1.png'
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
  'action.scout': {
    label: 'Scout route',
    symbol: 'SC',
    tone: 'expedition',
    source: 'action:scout',
    assetFile: 'scout-action-gpt-image-2-v1.png'
  },
  'action.collect': {
    label: 'Collect output',
    symbol: 'C',
    tone: 'resource',
    source: 'action:collect'
  },
  'action.review_site_plan': {
    label: 'Review Site Plan',
    symbol: 'RV',
    tone: 'charter',
    source: 'action:review_site_plan',
    assetFile: 'reviewed-plan-receipt-gpt-image-2-v1.png'
  },
  'action.prepare_settler_convoy': {
    label: 'Prepare Settler Convoy',
    symbol: 'CV',
    tone: 'settlement',
    source: 'action:prepare_settler_convoy',
    assetFile: 'settler-convoy-gpt-image-2-v1.png'
  },
  'action.found_settlement': {
    label: 'Found Settlement',
    symbol: 'FS',
    tone: 'settlement',
    source: 'action:found_settlement',
    assetFile: 'outpost-marker-gpt-image-2-v1.png'
  },
  'unit.settler_convoy': {
    label: 'Settler Convoy',
    symbol: 'CV',
    tone: 'settlement',
    source: 'unit:settler_convoy',
    assetFile: 'settler-convoy-gpt-image-2-v1.png'
  },
  'route.convoy': {
    label: 'Convoy Route',
    symbol: 'RT',
    tone: 'settlement',
    source: 'route:convoy',
    assetFile: 'convoy-route-gpt-image-2-v1.png'
  },
  'receipt.scout_report': {
    label: 'Scout Report',
    symbol: 'SR',
    tone: 'expedition',
    source: 'receipt:scout_report',
    assetFile: 'scout-report-gpt-image-2-v1.png'
  },
  'receipt.settlement_claim': {
    label: 'Settlement Claim',
    symbol: 'CL',
    tone: 'settlement',
    source: 'receipt:settlement_claim',
    assetFile: 'settlement-claim-gpt-image-2-v1.png'
  },
  'receipt.second_plot_founded': {
    label: 'Second Plot Founded',
    symbol: '2P',
    tone: 'settlement',
    source: 'receipt:second_plot_founded',
    assetFile: 'second-plot-founded-gpt-image-2-v1.png'
  },
  'planning.site_plan': {
    label: 'Site Plan',
    symbol: 'SP',
    tone: 'expedition',
    source: 'planning:site_plan',
    assetFile: 'site-plan-gpt-image-2-v1.png'
  },
  'planning.claim_ready': {
    label: 'Claim-ready Plan',
    symbol: 'CR',
    tone: 'charter',
    source: 'planning:claim_ready',
    assetFile: 'claim-ready-plan-gpt-image-2-v1.png'
  },
  'plot.second_settlement': {
    label: 'Outpost Plot',
    symbol: 'OP',
    tone: 'settlement',
    source: 'plot:second_settlement',
    assetFile: 'outpost-core-gpt-image-2-v1.png'
  },
  'doctrine.survey_discipline': {
    label: 'Survey Discipline',
    symbol: 'SD',
    tone: 'research',
    source: 'doctrine:survey_discipline',
    assetFile: 'cohort-work-order-gpt-image-2-v1.png'
  },
  'work_order.collect_ready_outputs_once': {
    label: 'Collect Ready Outputs Once',
    symbol: 'WO',
    tone: 'civic',
    source: 'work_order:collect_ready_outputs_once',
    assetFile: 'cohort-work-order-gpt-image-2-v1.png'
  },
  'world_grid.read_model': {
    label: 'World Grid',
    symbol: 'WG',
    tone: 'civic',
    source: 'world_grid:read_model',
    assetPath: objectAssetPath('world-grid-civic-beacon.webp')
  },
  'world_grid.civic_readiness': {
    label: 'Civic Readiness',
    symbol: 'CR',
    tone: 'civic',
    source: 'world_grid:civic_readiness',
    assetPath: objectAssetPath('world-grid-civic-beacon.webp')
  },
  'civic.proposal_records': {
    label: 'Civic Proposal Records',
    symbol: 'CP',
    tone: 'civic',
    source: 'civic:proposal_records',
    assetPath: objectAssetPath('civic-proposal-dossier-card-art.webp')
  },
  'civic.proposal': {
    label: 'Civic Proposal',
    symbol: 'PR',
    tone: 'civic',
    source: 'civic:proposal',
    assetPath: objectAssetPath('civic-proposal-dossier-card-art.webp')
  },
  'generated_universe.overlay_pack_records': {
    label: 'Generated Universe Overlay Packs',
    symbol: 'GU',
    tone: 'civic',
    source: 'generated_universe:overlay_pack_records',
    assetPath: objectAssetPath('generated-universe-overlay-pack-card-art.webp')
  },
  'generated_universe.overlay_pack': {
    label: 'Generated Universe Overlay Pack',
    symbol: 'OV',
    tone: 'civic',
    source: 'generated_universe:overlay_pack',
    assetPath: objectAssetPath('generated-universe-overlay-pack-card-art.webp')
  },
  'civic.project_activation': {
    label: 'Civic Project Activation',
    symbol: 'CB',
    tone: 'civic',
    source: 'civic:project_activation',
    assetPath: objectAssetPath('world-grid-civic-beacon.webp')
  },
  'civic.project': {
    label: 'Civic Project',
    symbol: 'PW',
    tone: 'civic',
    source: 'civic:project',
    assetPath: objectAssetPath('world-grid-civic-beacon.webp')
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
    : (spec.assetPath || iconAssetPath(sourceAssetFile));
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
