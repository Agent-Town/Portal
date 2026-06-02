'use strict';

const crypto = require('crypto');

const engine = require('./engine');
const store = require('./store');
const { FOUNDERS_PLOT_TOOL_SPECS } = require('./tools');
const {
  RESOURCE_KEYS,
  getAgentTownIcon,
  getAgentTownIconCatalog
} = require('../agent_town_icons');

const ATLAS_VERSION = 'founders-plot-progression-atlas-v1';
const DEFAULT_STRATEGY_KEY = 'rush-hq3';
const STEP_KINDS = Object.freeze(['canonical_node', 'custom_note', 'future_placeholder']);
const FUTURE_SYSTEMS = Object.freeze([
  'expedition',
  'research',
  'territory',
  'unit',
  'oracle',
  'settlement',
  'work_order',
  'civic',
  'world_grid',
  'generated_universe'
]);
const RISK_LEVELS = Object.freeze(['low', 'medium', 'high', 'unknown']);
const REVERSIBILITY_LEVELS = Object.freeze(['safe', 'layout_sensitive', 'irreversible', 'unknown']);
const PRIVACY_LEVELS = Object.freeze(['private', 'share_redacted', 'public_template_allowed']);
const STRATEGY_CREATED_BY = Object.freeze(['human', 'openclaw_lite', 'clover', 'atlas_oracle']);
const STRATEGY_SOURCES = Object.freeze(['template', 'editor', 'oracle_draft', 'import', 'fork']);
const STRATEGY_TEMPLATES = Object.freeze({
  'rush-hq3': Object.freeze({
    strategyKey: 'rush-hq3',
    title: 'Rush HQ3',
    goal: 'Reach HQ Level 3 through normal Founders Plot play and unlock Foreman queueProduction.',
    summary: 'Fastest safe route through Lumber Camp, Farm Plot, Quarry, and HQ Level 3.',
    focus: ['Fast HQ upgrades', 'Quarry unlock', 'queueProduction readiness'],
    tradeoff: 'Fastest path to HQ3, but it gives the player less time to inspect each resource loop before Foreman queueing appears.',
    approvalDelegationBurden: 'Medium: most actions stay player-run until HQ3, then queueProduction becomes the first major Foreman delegation gate.'
  }),
  'balanced-food-wood': Object.freeze({
    strategyKey: 'balanced-food-wood',
    title: 'Balanced Food-Wood',
    goal: 'Build a steadier early economy by proving both wood and food before pushing the stone gate.',
    summary: 'Balanced opening that keeps Lumber Camp and Farm Plot visible before the HQ2 and Quarry push.',
    focus: ['Wood and food base', 'Lower early resource whiplash', 'HQ2 after two production loops'],
    tradeoff: 'More legible for new players, but it sacrifices some rush speed to make the wood and food chains feel understood.',
    approvalDelegationBurden: 'Low: this plan keeps the human in direct control and delays Foreman delegation until the economy is easier to read.'
  }),
  'delegate-outputs-first': Object.freeze({
    strategyKey: 'delegate-outputs-first',
    title: 'Delegate Outputs First',
    goal: 'Reach HQ Level 2 deliberately, review collectOutputs, then continue toward Foreman queueProduction.',
    summary: 'Foreman-readiness route that makes the HQ2 collectOutputs permission an explicit checkpoint before HQ3.',
    focus: ['Foreman readiness', 'collectOutputs checkpoint', 'queueProduction policy gate'],
    tradeoff: 'Best for teaching delegation boundaries, but it asks the player to pause at HQ2 before pushing to HQ3.',
    approvalDelegationBurden: 'High: this plan asks the player to inspect output collection at HQ2 before approving deeper queueProduction delegation at HQ3.'
  }),
  'hq10-horizon': Object.freeze({
    strategyKey: 'hq10-horizon',
    title: 'HQ10 Horizon',
    goal: 'Extend the current settlement into expeditions, second plots, research, agent cohorts, and world-grid civilization.',
    summary: 'Uses current HQ1-HQ6 truth as the launchpad, then marks HQ7-HQ10 as advisory future milestones.',
    focus: ['Expansion', 'Research', 'Multi-plot strategy', 'Agent cohorts'],
    tradeoff: 'Most of the path past HQ5 is future design, so it must stay advisory until each gameplay model exists.',
    approvalDelegationBurden: 'High later: expeditions, claims, cohorts, and civic actions will all need explicit receipts and approval boundaries.'
  })
});
const STRATEGY_TEMPLATE_KEYS = Object.freeze(Object.keys(STRATEGY_TEMPLATES));
const HQ10_HORIZON_MILESTONES = Object.freeze([
  Object.freeze({
    id: 'settlement_charter',
    level: 6,
    system: 'expedition',
    title: 'HQ6: Settlement Charter',
    summary: 'Promote Scout Reports and Site Plans into reviewed claim candidates without creating territory by accident.',
    possibilities: [
      'Site Plans can be compared, revised, and approved before any settler convoy exists.',
      'Atlas proposals can stay private while the engine owns the canonical plan record.',
      'Rook can surface plan-review approvals and promotion receipts.'
    ],
    nextImplementableSlice: 'Add reviewed Site Plan promotion status, claim preconditions, and explicit no-territory guardrails.',
    riskLevel: 'medium'
  }),
  Object.freeze({
    id: 'second_settlement',
    level: 7,
    system: 'territory',
    title: 'HQ7: Settler Convoy',
    summary: 'Let the player claim or found a second plot from a scouted site.',
    possibilities: [
      'Settlers can reserve a second plot with explicit approval.',
      'Plots can specialize by local resources and distance from the first town.',
      'Atlas strategies can plan routes, dependencies, and expansion timing.'
    ],
    nextImplementableSlice: 'Add claimable site state, a settler or convoy job, and a second-plot creation approval gate.',
    riskLevel: 'high'
  }),
  Object.freeze({
    id: 'research_doctrines',
    level: 8,
    system: 'research',
    title: 'HQ8: Research Lodge',
    summary: 'Introduce doctrines and tech choices that make towns diverge strategically.',
    possibilities: [
      'Players pick research lanes instead of only climbing linear HQ levels.',
      'Workshop buffs can evolve into named doctrines with tradeoffs.',
      'Atlas can compare food-first, quarry-first, logistics, and automation strategies.'
    ],
    nextImplementableSlice: 'Promote one tiny engine-owned doctrine effect, such as a bounded SCOUT duration modifier, without opening general research freedom.',
    riskLevel: 'medium'
  }),
  Object.freeze({
    id: 'agent_cohorts',
    level: 9,
    system: 'work_order',
    title: 'HQ9: Agent Cohorts',
    summary: 'Group Foremen, inhabitants, and future citizen agents into bounded work orders.',
    possibilities: [
      'Players can assign scoped cohorts to collect, build, scout, or research plans.',
      'Every delegated action keeps receipts, caps, idempotency, and human approval gates.',
      'Clover or an Atlas Oracle can explain why a cohort is blocked or safe to run.'
    ],
    nextImplementableSlice: 'Add private cohort/work-order schemas that reference existing et.plot.* tools without broadening authority.',
    riskLevel: 'high'
  }),
  Object.freeze({
    id: 'world_grid_civilization',
    level: 10,
    system: 'world_grid',
    title: 'HQ10: World Grid Civilization',
    summary: 'Connect multiple settlements into a civic/world-grid layer while keeping generated visuals separate from truth.',
    possibilities: [
      'World Grid routes, public works, and civic projects can span player-owned plots.',
      'Generated Universe packs can reskin the Atlas view without changing gameplay rules.',
      'Long-term Oracle memory can connect goals, decisions, strategy revisions, and receipts.'
    ],
    nextImplementableSlice: 'Define public-safe world-grid projection contracts before allowing any civic mutation tools.',
    riskLevel: 'high'
  })
]);
const RESOURCE_STORAGE_KEYS = Object.freeze(['wood', 'stone', 'food']);
const PRIORITY_OPTIONS = Object.freeze(['WOOD', 'STONE', 'FOOD', 'BALANCED']);
const REWARD_CATALOG = Object.freeze([
  {
    rewardId: 'quest.first-lumber',
    title: 'Supply crate',
    body: 'The first lumber haul kept the camp alive.',
    grant: { coin: 5 },
    requiredCollectedBuildingType: 'LUMBER_CAMP'
  },
  {
    rewardId: 'hq.level-2',
    title: 'Field notes',
    body: 'HQ Level 2 opens the food lane.',
    grant: { coin: 6 },
    requiredHqLevel: 2
  },
  {
    rewardId: 'hq.level-3',
    title: 'Quarry kit',
    body: 'A small reserve to help the new quarry boot.',
    grant: { wood: 8, stone: 4 },
    requiredHqLevel: 3
  },
  {
    rewardId: 'hq.level-4',
    title: 'Workshop charter',
    body: 'Your builders can now compress future timelines.',
    grant: { coin: 8 },
    requiredHqLevel: 4
  },
  {
    rewardId: 'hq.level-5',
    title: 'Founder stipend',
    body: 'Your overnight planner is now part of the town rhythm.',
    grant: { coin: 12, town_xp: 10 },
    requiredHqLevel: 5
  }
]);
const TOOL_HTTP = Object.freeze({
  'et.plot.get_state': { method: 'GET', path: '/api/founders-plot/state' },
  'et.plot.list_plots': { method: 'GET', path: '/api/founders-plot/plots' },
  'et.plot.get_world_grid_status': { method: 'GET', path: '/api/founders-plot/world-grid' },
  'et.plot.list_civic_proposals': { method: 'GET', path: '/api/founders-plot/civic-proposals' },
  'et.plot.list_overlay_packs': { method: 'GET', path: '/api/founders-plot/overlay-packs' },
  'et.plot.list_civic_projects': { method: 'GET', path: '/api/founders-plot/civic-projects' },
  'et.plot.place_building': { method: 'POST', path: '/api/founders-plot/place-building' },
  'et.plot.queue_job': { method: 'POST', path: '/api/founders-plot/queue-job' },
  'et.plot.collect_outputs': { method: 'POST', path: '/api/founders-plot/collect-outputs' },
  'et.plot.draft_site_plan': { method: 'POST', path: '/api/founders-plot/draft-site-plan' },
  'et.plot.draft_site_plan_from_packet': { method: 'POST', path: '/api/founders-plot/expedition-map/draft-site-plan' },
  'et.plot.review_site_plan': { method: 'POST', path: '/api/founders-plot/review-site-plan' },
  'et.plot.select_doctrine': { method: 'POST', path: '/api/founders-plot/select-doctrine' },
  'et.plot.create_work_order_draft': { method: 'POST', path: '/api/founders-plot/work-orders/draft' },
  'et.plot.execute_work_order': { method: 'POST', path: '/api/founders-plot/work-orders/execute' },
  'et.plot.move_expedition_unit': { method: 'POST', path: '/api/founders-plot/expedition-map/move-unit' },
  'et.plot.create_civic_proposal': { method: 'POST', path: '/api/founders-plot/civic-proposals' },
  'et.plot.create_overlay_pack': { method: 'POST', path: '/api/founders-plot/overlay-packs' },
  'et.plot.activate_civic_project': { method: 'POST', path: '/api/founders-plot/civic-projects/activate' },
  'et.plot.inspect_civic_project': { method: 'POST', path: '/api/founders-plot/civic-projects/inspect' },
  'et.plot.prepare_settler_convoy': { method: 'POST', path: '/api/founders-plot/prepare-settler-convoy' },
  'et.plot.found_settlement': { method: 'POST', path: '/api/founders-plot/found-settlement' },
  'et.plot.upgrade_building': { method: 'POST', path: '/api/founders-plot/upgrade-building' },
  'et.plot.set_priority': { method: 'POST', path: '/api/founders-plot/set-priority' },
  'et.plot.claim_reward': { method: 'POST', path: '/api/founders-plot/claim-reward' },
  'et.plot.request_user_approval': { method: 'POST', path: '/api/founders-plot/request-approval' }
});

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function errorEnvelope(code, message, retryable = false, details = {}) {
  return {
    ok: false,
    error: {
      code: String(code || 'INVALID_STATE'),
      message: String(message || code || 'Progression Atlas failed.'),
      retryable: !!retryable,
      details: details && typeof details === 'object' ? details : {}
    }
  };
}

function successEnvelope(data) {
  return { ok: true, ...data };
}

function hashId(parts) {
  return crypto
    .createHash('sha256')
    .update(parts.map((part) => String(part || '')).join('|'))
    .digest('hex')
    .slice(0, 16);
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = stableValue(value[key]);
      return acc;
    }, {});
}

function stableHash(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(stableValue(value)))
    .digest('hex');
}

function normalizeStrategyKey(value) {
  return String(value || DEFAULT_STRATEGY_KEY).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
}

function cleanText(value, fallback = '', max = 160) {
  const text = String(value == null ? '' : value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (text || fallback).slice(0, max);
}

function slugFor(value, fallback = 'step') {
  const slug = cleanText(value, fallback, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || fallback;
}

function strategyTemplateForKey(value) {
  const key = normalizeStrategyKey(value);
  return STRATEGY_TEMPLATES[key] || null;
}

function normalizeInventory(value) {
  const bag = value && typeof value === 'object' ? value : {};
  const out = {};
  for (const key of RESOURCE_KEYS) out[key] = Math.max(0, Math.floor(Number(bag[key] || 0)));
  return out;
}

function normalizeCost(value) {
  const cost = value && typeof value === 'object' ? value : {};
  const out = {};
  for (const key of RESOURCE_KEYS) {
    const amount = Math.max(0, Math.floor(Number(cost[key] || 0)));
    if (amount > 0) out[key] = amount;
  }
  return out;
}

function normalizeJobOutput(value) {
  const output = normalizeCost(value);
  const scoutReports = Math.max(0, Math.floor(Number(value?.scout_report || 0)));
  if (scoutReports > 0) output.scout_report = scoutReports;
  return output;
}

function compactScoutReport(report) {
  if (!report || typeof report !== 'object') return null;
  const hints = normalizeCost(report.resourceHints || {});
  return {
    reportId: cleanText(report.reportId, '', 120),
    originPlotId: cleanText(report.originPlotId || report.plotId, '', 120),
    sourceBuildingId: cleanText(report.sourceBuildingId, '', 120),
    title: cleanText(report.title, 'Scout Report', 120),
    siteType: cleanText(report.siteType, 'nearby_site', 80),
    risk: cleanText(report.risk, 'unknown', 40),
    traits: uniqueStrings(Array.isArray(report.traits) ? report.traits : [], 8),
    resourceHints: hints,
    summary: cleanText(report.summary, '', 280),
    recommendedNext: cleanText(report.recommendedNext, '', 220),
    sequence: Math.max(1, Math.floor(Number(report.sequence || 1))),
    createdAt: Number(report.createdAt || 0)
  };
}

function normalizeScoutReports(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .map(compactScoutReport)
    .filter((report) => report?.reportId)
    .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0) || a.reportId.localeCompare(b.reportId));
}

function compactSitePlan(plan) {
  if (!plan || typeof plan !== 'object') return null;
  const out = {
    planId: cleanText(plan.planId, '', 120),
    reportId: cleanText(plan.reportId, '', 120),
    originPlotId: cleanText(plan.originPlotId || plan.plotId, '', 120),
    title: cleanText(plan.title, 'Site Plan', 120),
    focus: cleanText(plan.focus, 'balanced', 40),
    status: cleanText(plan.status, 'DRAFT', 40),
    promotionStatus: cleanText(plan.promotionStatus, 'draft', 40),
    reviewStatus: cleanText(plan.reviewStatus, 'unreviewed', 40),
    source: cleanText(plan.source, 'scout_report', 80),
    authorityBoundary: cleanText(plan.authorityBoundary, 'requires_engine_promotion_for_settlement', 120),
    siteType: cleanText(plan.siteType, 'nearby_site', 80),
    risk: cleanText(plan.risk, 'unknown', 40),
    traits: uniqueStrings(Array.isArray(plan.traits) ? plan.traits : [], 8),
    resourceHints: normalizeCost(plan.resourceHints || {}),
    summary: cleanText(plan.summary, '', 320),
    recommendedNext: cleanText(plan.recommendedNext, '', 240),
    reviewedAt: plan.reviewedAt == null ? null : Number(plan.reviewedAt),
    reviewNote: cleanText(plan.reviewNote, '', 320),
    sequence: Math.max(1, Math.floor(Number(plan.sequence || 1))),
    createdAt: Number(plan.createdAt || 0)
  };
  const claimId = cleanText(plan.claimId, '', 120);
  const convoyJobId = cleanText(plan.convoyJobId, '', 120);
  const foundedPlotId = cleanText(plan.foundedPlotId, '', 120);
  const sourcePacketId = cleanText(plan.sourcePacketId, '', 160);
  const sourceScoutId = cleanText(plan.sourceScoutId, '', 120);
  const sourceCellId = cleanText(plan.sourceCellId, '', 80);
  const sourceReceiptKind = cleanText(plan.sourceReceiptKind, '', 80);
  const sourceActionName = cleanText(plan.sourceActionName, '', 120);
  const sourceBridgeVersion = cleanText(plan.sourceBridgeVersion, '', 120);
  if (claimId) out.claimId = claimId;
  if (convoyJobId) out.convoyJobId = convoyJobId;
  if (foundedPlotId) out.foundedPlotId = foundedPlotId;
  if (sourcePacketId) out.sourcePacketId = sourcePacketId;
  if (sourceScoutId) out.sourceScoutId = sourceScoutId;
  if (sourceCellId) out.sourceCellId = sourceCellId;
  if (sourceReceiptKind) out.sourceReceiptKind = sourceReceiptKind;
  if (sourceActionName) out.sourceActionName = sourceActionName;
  if (sourceBridgeVersion) out.sourceBridgeVersion = sourceBridgeVersion;
  if (plan.claimedAt != null) out.claimedAt = Number(plan.claimedAt);
  return out;
}

function normalizeSitePlans(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .map(compactSitePlan)
    .filter((plan) => plan?.planId && plan?.reportId)
    .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0) || a.planId.localeCompare(b.planId));
}

function compactSettlementClaim(claim) {
  if (!claim || typeof claim !== 'object') return null;
  return {
    claimId: cleanText(claim.claimId, '', 120),
    ownerPairId: cleanText(claim.ownerPairId, '', 160),
    originPlotId: cleanText(claim.originPlotId, '', 120),
    sitePlanId: cleanText(claim.sitePlanId, '', 120),
    reportId: cleanText(claim.reportId, '', 120),
    foundedPlotId: cleanText(claim.foundedPlotId, '', 120) || null,
    convoyJobId: cleanText(claim.convoyJobId, '', 120) || null,
    status: cleanText(claim.status, 'CLAIM_READY', 40).toUpperCase(),
    title: cleanText(claim.title, 'Settlement Claim', 120),
    focus: cleanText(claim.focus, 'balanced', 40),
    siteType: cleanText(claim.siteType, 'nearby_site', 80),
    risk: cleanText(claim.risk, 'unknown', 40),
    traits: uniqueStrings(Array.isArray(claim.traits) ? claim.traits : [], 8),
    resourceHints: normalizeCost(claim.resourceHints || {}),
    route: stableValue(claim.route || {}),
    cost: normalizeCost(claim.cost || {}),
    receipt: stableValue(claim.receipt || {}),
    createdAt: Number(claim.createdAt || 0),
    updatedAt: Number(claim.updatedAt || 0),
    convoyStartedAt: claim.convoyStartedAt == null ? null : Number(claim.convoyStartedAt),
    convoyEndsAt: claim.convoyEndsAt == null ? null : Number(claim.convoyEndsAt),
    foundedAt: claim.foundedAt == null ? null : Number(claim.foundedAt)
  };
}

function normalizeSettlementClaims(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .map(compactSettlementClaim)
    .filter((claim) => claim?.claimId && claim?.sitePlanId)
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0) || a.claimId.localeCompare(b.claimId));
}

function compactOwnedPlot(plot) {
  if (!plot || typeof plot !== 'object') return null;
  return {
    plotId: cleanText(plot.plotId, '', 120),
    role: cleanText(plot.role, '', 40).toUpperCase(),
    hqLevel: Math.max(1, Math.floor(Number(plot.hqLevel || 1))),
    townXp: Math.max(0, Math.floor(Number(plot.townXp || 0))),
    status: cleanText(plot.status, 'ACTIVE', 40).toUpperCase(),
    originClaimId: cleanText(plot.originClaimId, '', 120) || null,
    siteType: cleanText(plot.siteType, '', 80) || null,
    risk: cleanText(plot.risk, '', 40) || null
  };
}

function normalizeOwnedPlots(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .map(compactOwnedPlot)
    .filter((plot) => plot?.plotId)
    .sort((a, b) => a.role.localeCompare(b.role) || a.plotId.localeCompare(b.plotId));
}

function normalizeDoctrineState(value) {
  const state = value && typeof value === 'object' ? value : {};
  const doctrineId = cleanText(state.selectedDoctrineId || state.doctrineId, '', 80);
  return {
    selectedDoctrineId: doctrineId || null,
    status: doctrineId ? cleanText(state.status, 'SELECTED', 40).toUpperCase() : 'NONE',
    selectedAt: state.selectedAt == null ? null : Number(state.selectedAt),
    selectedBy: state.selectedBy ? cleanText(state.selectedBy, '', 40).toUpperCase() : null,
    revision: Math.max(0, Math.floor(Number(state.revision || 0))),
    authorityBoundary: cleanText(state.authorityBoundary, 'server_owned_doctrine_effect_v1', 120),
    receiptEventType: doctrineId ? cleanText(state.receiptEventType, 'DOCTRINE_SELECTED', 80) : null
  };
}

function compactWorkOrder(order) {
  if (!order || typeof order !== 'object') return null;
  return {
    workOrderId: cleanText(order.workOrderId, '', 120),
    plotId: cleanText(order.plotId, '', 120),
    templateId: cleanText(order.templateId, '', 120),
    status: cleanText(order.status, 'DRAFT', 40).toUpperCase(),
    title: cleanText(order.title, 'Work Order Draft', 120),
    scope: stableValue(order.scope || {}),
    allowedActions: uniqueStrings(Array.isArray(order.allowedActions) ? order.allowedActions : [], 8),
    caps: stableValue(order.caps || {}),
    childReceiptCount: Array.isArray(order.childReceipts) ? order.childReceipts.length : 0,
    createdBy: cleanText(order.createdBy, 'HUMAN', 40).toUpperCase(),
    approvedBy: cleanText(order.approvedBy, '', 80) || null,
    failureReason: cleanText(order.failureReason, '', 160) || null,
    createdAt: Number(order.createdAt || 0),
    updatedAt: Number(order.updatedAt || 0),
    expiresAt: order.expiresAt == null ? null : Number(order.expiresAt)
  };
}

function normalizeWorkOrders(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .map(compactWorkOrder)
    .filter((order) => order?.workOrderId && order?.templateId)
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0) || a.workOrderId.localeCompare(b.workOrderId));
}

function compactCivicProposal(proposal) {
  if (!proposal || typeof proposal !== 'object') return null;
  return {
    proposalId: cleanText(proposal.proposalId, '', 120),
    plotId: cleanText(proposal.plotId, '', 120),
    status: cleanText(proposal.status, 'DRAFT', 40).toUpperCase(),
    title: cleanText(proposal.title, 'Civic Proposal', 120),
    category: cleanText(proposal.category, 'coordination', 80),
    summary: cleanText(proposal.summary, '', 480),
    scope: stableValue(proposal.scope || {}),
    review: stableValue(proposal.review || {}),
    authorityBoundary: cleanText(proposal.authorityBoundary, 'server_owned_civic_proposal_record_no_execution_v1', 160),
    createdBy: cleanText(proposal.createdBy, 'HUMAN', 40).toUpperCase(),
    approvedBy: cleanText(proposal.approvedBy, '', 80) || null,
    createdAt: Number(proposal.createdAt || 0),
    updatedAt: Number(proposal.updatedAt || 0),
    reviewedAt: proposal.reviewedAt == null ? null : Number(proposal.reviewedAt),
    archivedAt: proposal.archivedAt == null ? null : Number(proposal.archivedAt)
  };
}

function normalizeCivicProposals(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .map(compactCivicProposal)
    .filter((proposal) => proposal?.proposalId)
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0) || a.proposalId.localeCompare(b.proposalId));
}

function compactOverlayPack(pack) {
  if (!pack || typeof pack !== 'object') return null;
  return {
    overlayPackId: cleanText(pack.overlayPackId, '', 120),
    plotId: cleanText(pack.plotId, '', 120),
    sourceProposalId: cleanText(pack.sourceProposalId, '', 120),
    status: cleanText(pack.status, 'DRAFT', 40).toUpperCase(),
    title: cleanText(pack.title, 'Generated Universe Overlay Pack', 120),
    theme: cleanText(pack.theme, 'civic', 80),
    summary: cleanText(pack.summary, '', 480),
    targetSurfaceIds: uniqueStrings(Array.isArray(pack.targetSurfaceIds) ? pack.targetSurfaceIds : [], 8),
    targetNodeIds: uniqueStrings(Array.isArray(pack.targetNodeIds) ? pack.targetNodeIds : [], 20),
    displayHints: stableValue(pack.displayHints || {}),
    prompt: {
      sanitizedPrompt: cleanText(pack.prompt?.sanitizedPrompt, '', 600),
      promptDigest: cleanText(pack.prompt?.promptDigest, '', 80) || null,
      redactionLevel: cleanText(pack.prompt?.redactionLevel, 'private_internal', 80),
      rawPromptStored: false
    },
    provenance: stableValue(pack.provenance || {}),
    presentationOnly: true,
    visualOnly: true,
    gameplayMutationPolicy: 'presentation_only',
    executableByAtlas: false,
    authorityBoundary: cleanText(pack.authorityBoundary, 'server_owned_generated_universe_overlay_pack_presentation_only_v1', 180),
    createdBy: cleanText(pack.createdBy, 'HUMAN', 40).toUpperCase(),
    approvedBy: cleanText(pack.approvedBy, '', 80) || null
  };
}

function normalizeOverlayPacks(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .map(compactOverlayPack)
    .filter((pack) => pack?.overlayPackId)
    .sort((a, b) => a.overlayPackId.localeCompare(b.overlayPackId));
}

function compactCivicProject(project) {
  if (!project || typeof project !== 'object') return null;
  return {
    projectId: cleanText(project.projectId, '', 120),
    plotId: cleanText(project.plotId, '', 120),
    sourceProposalId: cleanText(project.sourceProposalId, '', 120),
    status: cleanText(project.status, 'ACTIVE', 40).toUpperCase(),
    projectType: cleanText(project.projectType, 'civic_beacon', 80),
    title: cleanText(project.title, 'Civic Beacon', 120),
    summary: cleanText(project.summary, '', 480),
    effect: stableValue(project.effect || {}),
    receipt: stableValue(project.receipt || {}),
    authorityBoundary: cleanText(project.authorityBoundary, 'server_owned_civic_project_activation_local_public_work_v1', 180),
    createdBy: cleanText(project.createdBy, 'HUMAN', 40).toUpperCase(),
    approvedBy: cleanText(project.approvedBy, '', 80) || null,
    createdAt: Number(project.createdAt || 0),
    updatedAt: Number(project.updatedAt || 0),
    activatedAt: project.activatedAt == null ? null : Number(project.activatedAt),
    archivedAt: project.archivedAt == null ? null : Number(project.archivedAt)
  };
}

function normalizeCivicProjects(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .map(compactCivicProject)
    .filter((project) => project?.projectId)
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0) || a.projectId.localeCompare(b.projectId));
}

function compactOutputBuffer(buffer) {
  const normalized = normalizeJobOutput(buffer || {});
  if (buffer?.scoutReport && typeof buffer.scoutReport === 'object') {
    normalized.scoutReport = compactScoutReport(buffer.scoutReport);
  }
  return stableValue(normalized);
}

function firstAllowed(value, allowed, fallback) {
  const clean = cleanText(value, '', 80).toLowerCase();
  return allowed.includes(clean) ? clean : fallback;
}

function nullableString(value, max = 120) {
  const text = cleanText(value, '', max);
  return text || null;
}

function normalizeStringArray(value, fallback = [], limit = 6, max = 160) {
  const source = Array.isArray(value) ? value : fallback;
  return uniqueStrings(source.map((entry) => cleanText(entry, '', max)), limit);
}

function normalizeTargetRef(value, fallback = null) {
  const raw = value && typeof value === 'object' ? value : fallback;
  if (!raw || typeof raw !== 'object') return null;
  const kind = nullableString(raw.kind, 60);
  const id = nullableString(raw.id ?? raw.buildingId ?? raw.stepId ?? raw.nodeId ?? raw.key, 120);
  const type = nullableString(raw.type ?? raw.buildingType ?? raw.resource ?? raw.permissionKey ?? raw.key, 120);
  if (!kind && !id && !type) return null;
  return { kind, id, type };
}

function targetRefFromTarget(target) {
  if (!target || typeof target !== 'object') return null;
  return normalizeTargetRef({
    kind: target.kind || null,
    id: target.buildingId || target.key || target.permissionKey || target.resource || target.level || null,
    type: target.type || target.buildingType || target.key || target.kind || null
  });
}

function normalizeRequirementItem(item, advisory) {
  if (!item || typeof item !== 'object') return null;
  const kind = cleanText(item.kind, 'note', 60).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'note';
  const resource = nullableString(item.resource, 60);
  const label = nullableString(item.label || item.title || item.description, 180);
  const out = {
    kind,
    advisory: !!advisory
  };
  if (resource) out.resource = resource;
  if (label) out.label = label;
  for (const key of ['have', 'required', 'missing']) {
    if (item[key] == null) continue;
    out[key] = Math.max(0, Math.floor(Number(item[key] || 0)));
  }
  if (item.requiredState) out.requiredState = cleanText(item.requiredState, 'READY', 40).toUpperCase();
  if (item.state) out.state = cleanText(item.state, '', 40).toUpperCase();
  if (item.system) out.system = cleanText(item.system, '', 60).toLowerCase().replace(/[^a-z0-9_-]/g, '') || null;
  if (item.ref && typeof item.ref === 'object') out.ref = normalizeTargetRef(item.ref);
  return out;
}

function normalizePlanningRequirements(value, { fallback = null, advisory = false } = {}) {
  if (!value || typeof value !== 'object') {
    if (!fallback) return { items: [], affordable: true, missing: {}, advisory: !!advisory };
    return {
      ...clone(fallback),
      advisory: !!advisory
    };
  }
  const items = Array.isArray(value.items)
    ? value.items.map((item) => normalizeRequirementItem(item, advisory)).filter(Boolean)
    : [];
  const missing = value.missing && typeof value.missing === 'object' && !Array.isArray(value.missing)
    ? Object.entries(value.missing).reduce((acc, [key, amount]) => {
      const cleanKey = cleanText(key, '', 60);
      if (cleanKey) acc[cleanKey] = Math.max(0, Math.floor(Number(amount || 0)));
      return acc;
    }, {})
    : {};
  return {
    items,
    affordable: value.affordable == null ? Object.values(missing).every((amount) => Number(amount || 0) <= 0) : !!value.affordable,
    missing,
    advisory: !!advisory
  };
}

function normalizeEstimatedCost(value) {
  const cost = normalizeCost(value);
  return Object.keys(cost).length ? cost : null;
}

function estimatedCostFromRequirements(requirements) {
  const items = Array.isArray(requirements?.items) ? requirements.items : [];
  const cost = {};
  for (const item of items) {
    if (!item || String(item.kind || '').toLowerCase() !== 'resource') continue;
    const resource = String(item.resource || '').toLowerCase();
    if (!RESOURCE_KEYS.includes(resource)) continue;
    const required = Math.max(0, Math.floor(Number(item.required || 0)));
    if (required > 0) cost[resource] = required;
  }
  return Object.keys(cost).length ? cost : null;
}

function hasResourceRequirement(requirements) {
  return (Array.isArray(requirements?.items) ? requirements.items : [])
    .some((item) => item && String(item.kind || '').toLowerCase() === 'resource' && Number(item.required || 0) > 0);
}

function buildingPrerequisiteRequirementItems(state, buildingPrerequisites = []) {
  return (Array.isArray(buildingPrerequisites) ? buildingPrerequisites : [])
    .map((entry) => {
      const type = String(entry?.type || '').trim().toUpperCase();
      if (!type) return null;
      const requiredState = String(entry?.requiredState || 'READY').trim().toUpperCase() || 'READY';
      const building = findBuilding(state, type);
      const stateValue = building?.state || null;
      const satisfied = !!building && stateValue === requiredState;
      return {
        kind: 'building',
        resource: type,
        label: labelForType(type),
        have: satisfied ? 1 : 0,
        required: 1,
        missing: satisfied ? 0 : 1,
        requiredState,
        state: stateValue,
        ref: { kind: 'building', type, id: building?.buildingId || null }
      };
    })
    .filter(Boolean);
}

function requirementsFor(state, {
  cost = {},
  xpRequired = null,
  hqLevelRequired = null,
  buildingPrerequisites = []
} = {}) {
  const inventory = normalizeInventory(state?.plot?.inventory);
  const normalizedCost = normalizeCost(cost);
  const resources = RESOURCE_KEYS
    .filter((key) => Number(normalizedCost[key] || 0) > 0)
    .map((key) => {
      const required = Number(normalizedCost[key] || 0);
      const have = Number(inventory[key] || 0);
      return {
        kind: 'resource',
        resource: key,
        have,
        required,
        missing: Math.max(0, required - have)
      };
    });
  if (xpRequired != null) {
    const required = Math.max(0, Math.floor(Number(xpRequired || 0)));
    const have = Math.max(0, Math.floor(Number(state?.plot?.townXp || 0)));
    resources.push({
      kind: 'xp',
      resource: 'XP',
      have,
      required,
      missing: Math.max(0, required - have)
    });
  }
  if (hqLevelRequired != null) {
    const required = Math.max(1, Math.floor(Number(hqLevelRequired || 1)));
    const have = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
    resources.push({
      kind: 'hq',
      resource: 'HQ',
      have,
      required,
      missing: Math.max(0, required - have)
    });
  }
  resources.push(...buildingPrerequisiteRequirementItems(state, buildingPrerequisites));
  return {
    items: resources,
    affordable: resources.every((entry) => entry.missing === 0),
    missing: resources
      .filter((entry) => entry.missing > 0)
      .reduce((acc, entry) => {
        acc[entry.resource] = entry.missing;
        return acc;
      }, {})
  };
}

function findBuilding(state, type) {
  return (state?.buildings || []).find((building) => building.type === type) || null;
}

function hqBuilding(state) {
  return findBuilding(state, 'HQ');
}

function isBuildingUnlocked(state, type) {
  return (state?.unlockedBuildings || []).includes(type);
}

function openPadCount(state) {
  return (state?.pads || []).filter((pad) => !pad.occupiedBy && String(pad.kind || '').toUpperCase() === 'BUILD').length;
}

function buildingDef(state, type) {
  return state?.buildingDefs?.[type] || engine.BUILDING_DEFS[type] || null;
}

function sortedStrings(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry || '')).filter(Boolean).sort() : [];
}

function compactJob(job) {
  if (!job || typeof job !== 'object') return null;
  return {
    jobId: String(job.jobId || ''),
    buildingId: String(job.buildingId || ''),
    kind: String(job.kind || ''),
    status: String(job.status || ''),
    resource: String(job.resource || ''),
    startsAt: Number(job.startsAt || 0),
    endsAt: Number(job.endsAt || 0)
  };
}

function compactBuilding(building) {
  return {
    buildingId: String(building?.buildingId || ''),
    type: String(building?.type || ''),
    x: Number(building?.x || 0),
    y: Number(building?.y || 0),
    level: Number(building?.level || 1),
    state: String(building?.state || ''),
    priority: String(building?.priority || ''),
    outputBuffer: compactOutputBuffer(building?.outputBuffer),
    activeJob: compactJob(building?.activeJob)
  };
}

function buildGameplaySnapshot(state) {
  const buildings = Array.isArray(state?.buildings) ? state.buildings : [];
  const pads = Array.isArray(state?.pads) ? state.pads : [];
  const approvals = Array.isArray(state?.approvals) ? state.approvals : [];
  const rewards = Array.isArray(state?.rewards) ? state.rewards : [];
  return {
    graphVersion: ATLAS_VERSION,
    plot: {
      plotId: String(state?.plot?.plotId || ''),
      hqLevel: Number(state?.plot?.hqLevel || 1),
      townXp: Number(state?.plot?.townXp || 0),
      inventory: normalizeInventory(state?.plot?.inventory),
      storageCaps: normalizeInventory(state?.plot?.storageCaps),
      constructionSlots: Number(state?.plot?.constructionSlots || 0),
      nextBuildBuffPct: Number(state?.plot?.nextBuildBuffPct || 0),
      dailySoldCoin: Number(state?.plot?.dailySoldCoin || 0),
      dailySellDay: String(state?.plot?.dailySellDay || ''),
      collectedBuildingTypes: sortedStrings(state?.plot?.collectedBuildingTypes),
      seenBuildingTypes: sortedStrings(state?.plot?.seenBuildingTypes),
      claimedRewards: sortedStrings(state?.plot?.claimedRewards),
      policy: stableValue(state?.plot?.policy || {}),
      scoutReports: normalizeScoutReports(state?.plot?.scoutReports || state?.scoutReports),
      sitePlans: normalizeSitePlans(state?.plot?.sitePlans || state?.sitePlans),
      doctrineState: normalizeDoctrineState(state?.plot?.doctrineState || state?.doctrineState)
    },
    settlementClaims: normalizeSettlementClaims(state?.settlementClaims || []),
    ownedPlots: normalizeOwnedPlots(state?.ownedPlots || []),
    workOrders: normalizeWorkOrders(state?.workOrders || []),
    civicProposals: normalizeCivicProposals(state?.civicProposals?.proposals || state?.civicProposals || []),
    civicProjects: normalizeCivicProjects(state?.civicProjects?.projects || state?.civicProjects || []),
    worldGrid: stableValue(state?.worldGrid || {}),
    activePlotId: String(state?.activePlotId || state?.plot?.plotId || ''),
    homePlotId: String(state?.homePlotId || ''),
    buildings: buildings
      .map(compactBuilding)
      .sort((a, b) => a.buildingId.localeCompare(b.buildingId)),
    pads: pads
      .map((pad) => ({
        x: Number(pad?.x || 0),
        y: Number(pad?.y || 0),
        kind: String(pad?.kind || ''),
        occupiedBy: String(pad?.occupiedBy || '')
      }))
      .sort((a, b) => (a.y - b.y) || (a.x - b.x)),
    unlockedBuildings: sortedStrings(state?.unlockedBuildings),
    permissions: stableValue(state?.permissions || {}),
    approvals: approvals
      .map((approval) => ({
        approvalId: String(approval?.approvalId || ''),
        actionName: String(approval?.actionName || approval?.action || ''),
        status: String(approval?.status || ''),
        requestedParams: stableValue(approval?.requestedParams || approval?.params || {})
      }))
      .sort((a, b) => a.approvalId.localeCompare(b.approvalId)),
    rewards: rewards
      .map((reward) => ({
        rewardId: String(reward?.rewardId || reward?.id || ''),
        status: String(reward?.status || ''),
        title: String(reward?.title || '')
      }))
      .sort((a, b) => a.rewardId.localeCompare(b.rewardId)),
    quest: {
      id: String(state?.quest?.id || ''),
      primaryAction: String(state?.quest?.primaryAction || '')
    },
    audit: {
      eventCount: Number(state?.audit?.eventCount || 0)
    }
  };
}

function gameplayStableHashForState(state) {
  return stableHash(buildGameplaySnapshot(state));
}

function labelForType(type) {
  return String(type || '')
    .toLowerCase()
    .split('_')
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '')
    .join(' ');
}

function makeIcon({ iconId, label, symbol, tone, source, assetPath = null }) {
  const overrides = {
    label: label || 'Progression step',
    symbol: symbol || '?',
    tone: tone || 'neutral',
    source: source || 'canonical_progression_graph'
  };
  if (assetPath != null) overrides.assetPath = assetPath;
  return getAgentTownIcon(iconId || 'progression.generic', overrides);
}

function buildingIcon(buildingType) {
  const type = String(buildingType || '').toUpperCase();
  const icons = {
    HQ: { symbol: 'HQ', tone: 'command', label: 'Headquarters' },
    LUMBER_CAMP: { symbol: 'W', tone: 'wood', label: 'Wood chain' },
    FARM_PLOT: { symbol: 'F', tone: 'food', label: 'Food chain' },
    QUARRY: { symbol: 'S', tone: 'stone', label: 'Stone chain' },
    EXPEDITION_BOARD: { symbol: 'EB', tone: 'expedition', label: 'Expedition Board' },
    WORKSHOP: { symbol: 'WK', tone: 'craft', label: 'Workshop chain' },
    MARKET_STALL: { symbol: 'C', tone: 'coin', label: 'Coin chain' }
  };
  const spec = icons[type] || { symbol: 'B', tone: 'building', label: labelForType(type) || 'Building' };
  const iconId = `building.${type.toLowerCase()}`;
  return makeIcon({
    iconId,
    label: spec.label,
    symbol: spec.symbol,
    tone: spec.tone,
    source: `building:${type}`
  });
}

function resourceIcon(resource) {
  const key = String(resource || '').toLowerCase();
  const icons = {
    wood: { symbol: 'W', tone: 'wood', label: 'Wood output' },
    food: { symbol: 'F', tone: 'food', label: 'Food output' },
    stone: { symbol: 'S', tone: 'stone', label: 'Stone output' },
    coin: { symbol: 'C', tone: 'coin', label: 'Coin output' },
    XP: { symbol: 'XP', tone: 'xp', label: 'Town XP' },
    xp: { symbol: 'XP', tone: 'xp', label: 'Town XP' }
  };
  const spec = icons[key] || { symbol: key.slice(0, 1).toUpperCase() || 'R', tone: 'resource', label: `${key} output` };
  const iconId = `resource.${key || 'unknown'}`;
  return makeIcon({
    iconId,
    label: spec.label,
    symbol: spec.symbol,
    tone: spec.tone,
    source: `resource:${key}`
  });
}

function hqIcon(level) {
  return getAgentTownIcon('hq.upgrade', {
    iconId: `hq.level.${Math.max(1, Number(level || 1))}`,
    label: `HQ Level ${Math.max(1, Number(level || 1))}`,
    symbol: `H${Math.max(1, Number(level || 1))}`,
    tone: 'command',
    source: `hq:${Math.max(1, Number(level || 1))}`
  });
}

function permissionIcon(permissionKey) {
  const key = String(permissionKey || 'permission');
  return getAgentTownIcon(`permission.${key}`, {
    label: key === 'queueProduction' ? 'Foreman queueing' : key === 'collectOutputs' ? 'Foreman output collection' : labelForType(key),
    symbol: key === 'queueProduction' ? 'Q' : key === 'collectOutputs' ? 'CO' : 'P',
    tone: 'foreman',
    source: `permission:${key}`
  });
}

function productionOutputFor(buildingType, level, resource) {
  const def = engine.BUILDING_DEFS[buildingType];
  if (!def || typeof def.produces !== 'function') return null;
  const produced = def.produces(level || 1);
  return produced?.output?.[resource] ?? null;
}

function makePlaceBuildingStep(state, {
  stepId,
  title,
  buildingType,
  reason
}) {
  const existing = findBuilding(state, buildingType);
  const def = buildingDef(state, buildingType) || {};
  const unlockedAt = Number(def.unlockHqLevel || 1);
  const unlocked = isBuildingUnlocked(state, buildingType);
  const requirements = requirementsFor(state, {
    cost: def.construction?.cost || {},
    hqLevelRequired: unlockedAt
  });
  let status = 'blocked';
  let blocker = null;
  let nextAction = `Build ${labelForType(buildingType)}`;

  if (existing) {
    status = 'done';
    blocker = null;
    nextAction = `${labelForType(buildingType)} is placed`;
  } else if (!unlocked) {
    status = 'blocked';
    blocker = `Requires HQ Level ${unlockedAt}.`;
  } else if (openPadCount(state) <= 0) {
    status = 'blocked';
    blocker = 'No open build pads remain.';
  } else if (!requirements.affordable) {
    status = 'blocked';
    blocker = 'Collect the missing construction resources.';
  } else {
    status = 'available';
  }

  return {
    stepId,
    nodeId: stepId,
    title,
    status,
    reason,
    icon: buildingIcon(buildingType),
    target: { kind: 'building', type: buildingType, buildingId: existing?.buildingId || null },
    requirements,
    blocker,
    nextAction,
    actionRef: existing ? null : {
      tool: 'et.plot.place_building',
      params: { type: buildingType }
    }
  };
}

function makeProductionStep(state, {
  stepId,
  title,
  buildingType,
  resource,
  reason
}) {
  const building = findBuilding(state, buildingType);
  const collected = new Set(state?.plot?.collectedBuildingTypes || []);
  let status = 'blocked';
  let blocker = null;
  let nextAction = `Produce ${resource}`;
  let actionRef = null;

  if (collected.has(buildingType)) {
    status = 'done';
    nextAction = `${resource} collection proven`;
  } else if (!building) {
    blocker = `Build ${labelForType(buildingType)} first.`;
  } else if (building.canCollect || building.state === 'OUTPUT_READY') {
    status = 'available';
    nextAction = `Collect ${resource}`;
    actionRef = {
      tool: 'et.plot.collect_outputs',
      params: { buildingId: building.buildingId }
    };
  } else if (building.canQueue) {
    status = 'available';
    nextAction = `Queue ${resource} production`;
    actionRef = {
      tool: 'et.plot.queue_job',
      params: { buildingId: building.buildingId, kind: 'PRODUCE' }
    };
  } else if (building.activeJob) {
    status = 'waiting';
    blocker = `${labelForType(buildingType)} has an active ${String(building.activeJob.kind || 'job').toLowerCase()} job.`;
  } else {
    status = 'waiting';
    blocker = `${labelForType(buildingType)} is ${String(building.state || 'not ready').toLowerCase()}.`;
  }

  return {
    stepId,
    nodeId: stepId,
    title,
    status,
    reason,
    icon: resourceIcon(resource),
    target: { kind: 'building', type: buildingType, buildingId: building?.buildingId || null },
    output: { [resource]: productionOutputFor(buildingType, building?.level || 1, resource) },
    requirements: { items: [], affordable: true, missing: {} },
    blocker,
    nextAction,
    actionRef
  };
}

function makeHqUpgradeStep(state, {
  stepId,
  title,
  targetLevel,
  reason
}) {
  const currentLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const fromLevel = Math.max(1, targetLevel - 1);
  const rule = engine.HQ_UPGRADE_RULES[fromLevel] || null;
  const hq = hqBuilding(state);
  const requirements = requirementsFor(state, {
    cost: rule?.cost || {},
    xpRequired: rule?.xpRequired || null,
    hqLevelRequired: fromLevel,
    buildingPrerequisites: rule?.buildingPrerequisites || []
  });
  let status = 'blocked';
  let blocker = null;
  let nextAction = `Upgrade HQ to Level ${targetLevel}`;
  let actionRef = null;

  if (currentLevel >= targetLevel) {
    status = 'done';
    nextAction = `HQ Level ${targetLevel} reached`;
  } else if (currentLevel < fromLevel) {
    blocker = `Reach HQ Level ${fromLevel} first.`;
  } else if (hq?.activeJob) {
    status = 'waiting';
    blocker = 'Headquarters is already upgrading.';
  } else if (!requirements.affordable) {
    const missingBuilding = requirements.items.find((item) => item.kind === 'building' && Number(item.missing || 0) > 0);
    blocker = missingBuilding
      ? `Build and ready ${missingBuilding.label || labelForType(missingBuilding.resource)} before this HQ upgrade.`
      : 'Collect the missing HQ upgrade requirements.';
  } else {
    status = 'available';
    actionRef = {
      tool: 'et.plot.upgrade_building',
      params: { buildingId: hq?.buildingId || null }
    };
  }

  return {
    stepId,
    nodeId: stepId,
    title,
    status,
    reason,
    icon: hqIcon(targetLevel),
    target: { kind: 'hq', level: targetLevel, buildingId: hq?.buildingId || null },
    requirements,
    blocker,
    nextAction,
    unlocks: engine.HQ_LEVEL_RULES[targetLevel]?.unlocks || [],
    permissionUnlocks: engine.HQ_LEVEL_RULES[targetLevel]?.permissionUnlocks || [],
    actionRef
  };
}

function makePermissionStep(state, {
  stepId,
  title,
  permissionKey,
  requiredHqLevel,
  reason,
  nextWhenBlocked,
  nextWhenDone
}) {
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const done = hqLevel >= requiredHqLevel;
  return {
    stepId,
    nodeId: stepId,
    title,
    status: done ? 'done' : 'blocked',
    reason,
    icon: permissionIcon(permissionKey),
    target: { kind: 'permission', key: permissionKey },
    requirements: requirementsFor(state, { hqLevelRequired: requiredHqLevel }),
    blocker: done ? null : `Reach HQ Level ${requiredHqLevel} first.`,
    nextAction: done ? nextWhenDone : nextWhenBlocked,
    actionRef: null
  };
}

function makeQueueProductionPermissionStep(state, nextWhenBlocked = 'Finish the Rush HQ3 plan') {
  return makePermissionStep(state, {
    stepId: 'foreman.queue_production',
    title: 'Unlock Foreman production queueing',
    permissionKey: 'queueProduction',
    requiredHqLevel: 3,
    reason: 'HQ Level 3 gives Clover the first real production-planning permission, still gated by player policy.',
    nextWhenBlocked,
    nextWhenDone: 'Review the queueProduction permission'
  });
}

function makeCollectOutputsPermissionStep(state) {
  return makePermissionStep(state, {
    stepId: 'foreman.collect_outputs',
    title: 'Review Foreman output collection',
    permissionKey: 'collectOutputs',
    requiredHqLevel: 2,
    reason: 'HQ Level 2 unlocks the first narrow Foreman action: collecting ready outputs under player policy.',
    nextWhenBlocked: 'Reach HQ Level 2 first',
    nextWhenDone: 'Review the collectOutputs permission'
  });
}

function buildRushHq3Steps(state) {
  return [
    makePlaceBuildingStep(state, {
      stepId: 'building.lumber_camp.place',
      title: 'Build Lumber Camp',
      buildingType: 'LUMBER_CAMP',
      reason: 'Wood is the settlement base resource and the first visible work loop.'
    }),
    makeProductionStep(state, {
      stepId: 'production.lumber_camp.collect_wood',
      title: 'Produce and collect wood',
      buildingType: 'LUMBER_CAMP',
      resource: 'wood',
      reason: 'Wood pays for Farm Plot and later HQ upgrades.'
    }),
    makePlaceBuildingStep(state, {
      stepId: 'building.farm_plot.place',
      title: 'Build Farm Plot',
      buildingType: 'FARM_PLOT',
      reason: 'Food removes the old HQ2 deadlock and starts the second production chain.'
    }),
    makeProductionStep(state, {
      stepId: 'production.farm_plot.collect_food',
      title: 'Produce and collect food',
      buildingType: 'FARM_PLOT',
      resource: 'food',
      reason: 'Food combines with wood to unlock HQ Level 2.'
    }),
    makeHqUpgradeStep(state, {
      stepId: 'hq.level.2',
      title: 'Upgrade HQ to Level 2',
      targetLevel: 2,
      reason: 'HQ Level 2 unlocks Quarry access and Foreman output collection.'
    }),
    makePlaceBuildingStep(state, {
      stepId: 'building.quarry.place',
      title: 'Build Quarry',
      buildingType: 'QUARRY',
      reason: 'Stone is the resource gate for HQ Level 3.'
    }),
    makeProductionStep(state, {
      stepId: 'production.quarry.collect_stone',
      title: 'Produce and collect stone',
      buildingType: 'QUARRY',
      resource: 'stone',
      reason: 'Stone plus wood finishes the first strategic milestone.'
    }),
    makeHqUpgradeStep(state, {
      stepId: 'hq.level.3',
      title: 'Upgrade HQ to Level 3',
      targetLevel: 3,
      reason: 'HQ Level 3 unlocks the first true Foreman planning loop: queue production.'
    }),
    makeQueueProductionPermissionStep(state)
  ];
}

function buildBalancedFoodWoodSteps(state) {
  return [
    makePlaceBuildingStep(state, {
      stepId: 'building.lumber_camp.place',
      title: 'Build Lumber Camp',
      buildingType: 'LUMBER_CAMP',
      reason: 'Start with wood so Farm Plot and HQ upgrade costs are easier to read.'
    }),
    makeProductionStep(state, {
      stepId: 'production.lumber_camp.collect_wood',
      title: 'Produce and collect wood',
      buildingType: 'LUMBER_CAMP',
      resource: 'wood',
      reason: 'Prove the wood chain before spending into food.'
    }),
    makePlaceBuildingStep(state, {
      stepId: 'building.farm_plot.place',
      title: 'Build Farm Plot',
      buildingType: 'FARM_PLOT',
      reason: 'Add food early so the opening is not only a timber sprint.'
    }),
    makeProductionStep(state, {
      stepId: 'production.farm_plot.collect_food',
      title: 'Produce and collect food',
      buildingType: 'FARM_PLOT',
      resource: 'food',
      reason: 'Food plus wood keeps HQ Level 2 reachable without hidden grants.'
    }),
    makeHqUpgradeStep(state, {
      stepId: 'hq.level.2',
      title: 'Upgrade HQ to Level 2',
      targetLevel: 2,
      reason: 'Upgrade only after both early production chains are visible.'
    }),
    makePlaceBuildingStep(state, {
      stepId: 'building.quarry.place',
      title: 'Build Quarry',
      buildingType: 'QUARRY',
      reason: 'Move into stone after the wood-food base is proven.'
    }),
    makeProductionStep(state, {
      stepId: 'production.quarry.collect_stone',
      title: 'Produce and collect stone',
      buildingType: 'QUARRY',
      resource: 'stone',
      reason: 'Stone completes the first broad resource triangle.'
    }),
    makeHqUpgradeStep(state, {
      stepId: 'hq.level.3',
      title: 'Upgrade HQ to Level 3',
      targetLevel: 3,
      reason: 'HQ Level 3 follows from a steadier wood, food, and stone base.'
    }),
    makeQueueProductionPermissionStep(state, 'Finish the Balanced Food-Wood plan')
  ];
}

function buildDelegateOutputsFirstSteps(state) {
  return [
    makePlaceBuildingStep(state, {
      stepId: 'building.lumber_camp.place',
      title: 'Build Lumber Camp',
      buildingType: 'LUMBER_CAMP',
      reason: 'Wood creates the first output loop the Foreman can later help collect.'
    }),
    makeProductionStep(state, {
      stepId: 'production.lumber_camp.collect_wood',
      title: 'Produce and collect wood',
      buildingType: 'LUMBER_CAMP',
      resource: 'wood',
      reason: 'A collected output makes delegation review concrete instead of abstract.'
    }),
    makePlaceBuildingStep(state, {
      stepId: 'building.farm_plot.place',
      title: 'Build Farm Plot',
      buildingType: 'FARM_PLOT',
      reason: 'Food gets HQ Level 2 within reach while adding a second output source.'
    }),
    makeProductionStep(state, {
      stepId: 'production.farm_plot.collect_food',
      title: 'Produce and collect food',
      buildingType: 'FARM_PLOT',
      resource: 'food',
      reason: 'Food collection proves the second loop before any Foreman authority expands.'
    }),
    makeHqUpgradeStep(state, {
      stepId: 'hq.level.2',
      title: 'Upgrade HQ to Level 2',
      targetLevel: 2,
      reason: 'HQ Level 2 unlocks the first output-delegation checkpoint.'
    }),
    makeCollectOutputsPermissionStep(state),
    makePlaceBuildingStep(state, {
      stepId: 'building.quarry.place',
      title: 'Build Quarry',
      buildingType: 'QUARRY',
      reason: 'Add stone after the player has reviewed collectOutputs.'
    }),
    makeProductionStep(state, {
      stepId: 'production.quarry.collect_stone',
      title: 'Produce and collect stone',
      buildingType: 'QUARRY',
      resource: 'stone',
      reason: 'Stone is still required for HQ Level 3 and queueProduction.'
    }),
    makeHqUpgradeStep(state, {
      stepId: 'hq.level.3',
      title: 'Upgrade HQ to Level 3',
      targetLevel: 3,
      reason: 'HQ Level 3 should follow a deliberate delegation checkpoint.'
    }),
    makeQueueProductionPermissionStep(state, 'Review collectOutputs, then finish the HQ3 plan')
  ];
}

function implementedHqCap() {
  const levels = Object.keys(engine.HQ_LEVEL_RULES || {}).map((level) => Number(level) || 1);
  return levels.length ? Math.max(...levels) : 1;
}

function canonicalStepFromNode(node, reason = null) {
  if (!node) return null;
  return {
    stepId: node.nodeId,
    nodeId: node.nodeId,
    title: node.title,
    status: node.status,
    reason: cleanText(reason || node.metadata?.body || node.title, node.title, 360),
    icon: node.icon,
    target: node.target,
    requirements: clone(node.requirements || { items: [], affordable: true, missing: {} }),
    blocker: node.blocker || node.availability?.blocker || null,
    nextAction: node.nextAction || node.availability?.nextAction || null,
    actionRef: node.actionRef || null,
    expectedBenefit: Array.isArray(node.effects) ? node.effects : []
  };
}

function futureHqNodeId(milestone) {
  return `future.hq.${milestone.level}.${milestone.id}`;
}

function makeFutureHqMilestoneStep(state, milestone) {
  const currentHq = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const cap = implementedHqCap();
  const nodeId = futureHqNodeId(milestone);
  const previousLevel = Number(milestone.level || 0) - 1;
  const previousNodeId = previousLevel <= cap
    ? `hq.level.${previousLevel}`
    : futureHqNodeId(HQ10_HORIZON_MILESTONES.find((item) => item.level === previousLevel) || { level: previousLevel, id: 'previous' });
  const requirementItems = [
    {
      kind: 'hq',
      resource: 'HQ',
      have: Math.min(currentHq, cap),
      required: Number(milestone.level || 0),
      missing: Math.max(0, Number(milestone.level || 0) - Math.min(currentHq, cap))
    },
    {
      kind: 'future_system',
      resource: milestone.system,
      have: 0,
      required: 1,
      missing: 1
    },
    {
      kind: 'canonical_model',
      resource: milestone.id,
      have: 0,
      required: 1,
      missing: 1
    }
  ];
  return {
    stepId: nodeId,
    nodeId,
    stepKind: 'future_placeholder',
    canonicalNodeId: null,
    futureSystem: milestone.system,
    title: milestone.title,
    status: 'locked',
    reason: milestone.summary,
    icon: hqIcon(milestone.level),
    target: {
      kind: 'future_hq_level',
      level: milestone.level,
      system: milestone.system,
      source: 'progression_atlas_hq10_horizon_v1'
    },
    targetRef: {
      type: 'future_hq_level',
      id: nodeId,
      system: milestone.system,
      level: milestone.level
    },
    requirements: {
      items: requirementItems,
      affordable: false,
      missing: {
        [`hq.level.${milestone.level}`]: Math.max(1, Number(milestone.level || 0) - Math.min(currentHq, cap)),
        [`future.${milestone.system}`]: 1
      }
    },
    blocker: `Future gameplay model not implemented yet; canonical Founders Plot currently stops at HQ${cap}.`,
    nextAction: milestone.nextImplementableSlice,
    expectedBenefit: [...milestone.possibilities],
    assumptions: [
      `HQ${milestone.level} is a planning milestone, not current engine truth.`,
      `Promote this only after ${milestone.system} has server-owned state, receipts, and approval boundaries.`,
      `Keep Generated Universe visuals presentation-only unless a later canonical model says otherwise.`
    ],
    riskLevel: milestone.riskLevel,
    reversibility: 'unknown',
    privacy: 'private',
    previousNodeId,
    actionRef: null
  };
}

function buildHq10HorizonSteps(state) {
  const graph = buildCanonicalAtlasGraph(state);
  const canonicalByNode = new Map(graph.canonicalNodes.map((node) => [node.nodeId, node]));
  const currentGamePath = [
    'hq.upgrade.4',
    'permission.setPriority.unlock',
    'building.WORKSHOP.place',
    'production.WORKSHOP.PRODUCE',
    'effect.workshop.next_build_buff',
    'hq.upgrade.5',
    'building.MARKET_STALL.place',
    'production.MARKET_STALL.SELL',
    'permission.sellSurplusFood.unlock',
    'hq.upgrade.6',
    'hq.level.6'
  ]
    .map((nodeId) => canonicalStepFromNode(canonicalByNode.get(nodeId), `Bridge current Founders Plot truth through ${nodeId}.`))
    .filter(Boolean);
  const settlementCharterPath = graph.canonicalNodes
    .filter((node) => node.kind === 'planning_review')
    .map((node) => canonicalStepFromNode(node, 'Review canonical Site Plans into HQ6 claim-ready planning state without creating territory.'))
    .filter(Boolean);
  const cap = implementedHqCap();
  const futureMilestones = HQ10_HORIZON_MILESTONES
    .filter((milestone) => Number(milestone.level || 0) > cap)
    .map((milestone) => makeFutureHqMilestoneStep(state, milestone));
  return [
    ...buildDelegateOutputsFirstSteps(state),
    ...currentGamePath,
    ...settlementCharterPath,
    ...futureMilestones
  ];
}

function buildGraph(state, steps) {
  const nodes = steps.map((step, index) => ({
    nodeId: step.nodeId,
    title: step.title,
    status: step.status,
    index,
    target: step.target,
    icon: step.icon,
    requirements: step.requirements,
    resourceGate: step.resourceGate,
    blocker: step.blocker,
    nextAction: step.nextAction
  }));
  const edges = [];
  for (let i = 0; i < steps.length - 1; i += 1) {
    edges.push({
      from: steps[i].nodeId,
      to: steps[i + 1].nodeId,
      kind: 'strategy_sequence'
    });
  }
  return { nodes, edges };
}

function toolSpecFor(toolName) {
  return FOUNDERS_PLOT_TOOL_SPECS.find((spec) => spec.name === toolName) || null;
}

function actionRefFor(toolName, paramsTemplate = {}, extra = {}) {
  const spec = toolSpecFor(toolName);
  const required = Array.isArray(spec?.argsSchema?.required) ? [...spec.argsSchema.required] : [];
  return {
    tool: toolName,
    http: TOOL_HTTP[toolName] || null,
    paramsTemplate: stableValue(paramsTemplate || {}),
    required,
    requiresIdempotencyKey: required.includes('idempotencyKey'),
    actorSupport: ['HUMAN', 'AGENT'],
    authority: 'et.plot.*',
    executable: false,
    executableByAtlas: false,
    toolSpec: spec ? {
      name: spec.name,
      description: spec.description,
      argsSchema: stableValue(spec.argsSchema || {}),
      resultSchema: stableValue(spec.resultSchema || {})
    } : null,
    ...stableValue(extra || {})
  };
}

function permissionLevelMap() {
  const out = {};
  for (const [level, rules] of Object.entries(engine.HQ_LEVEL_RULES || {})) {
    for (const key of rules.permissionUnlocks || []) out[key] = Number(level);
  }
  return out;
}

function permissionRowsByKey(state) {
  return Object.fromEntries((state?.permissions || []).map((row) => [row.key, row]));
}

function canonicalAvailability(node) {
  const status = cleanText(node?.status, 'blocked', 40);
  const blockedBy = Array.isArray(node?.availability?.blockedBy)
    ? node.availability.blockedBy.filter(Boolean)
    : [];
  return {
    status,
    unlocked: status !== 'locked',
    done: status === 'done',
    available: status === 'available',
    waiting: status === 'waiting',
    blockedBy,
    nextAction: node?.nextAction || node?.availability?.nextAction || null,
    blocker: node?.blocker || node?.availability?.blocker || null,
    ...stableValue(node?.availability || {})
  };
}

function canonicalNode({
  nodeId,
  kind,
  title,
  status,
  icon = null,
  target = null,
  requirements = null,
  availability = {},
  effects = [],
  metadata = {},
  blocker = null,
  nextAction = null,
  actionRef = null,
  ui = {}
}) {
  const node = {
    nodeId,
    kind,
    canonical: true,
    title,
    status,
    icon,
    target,
    requirements: requirements || { items: [], affordable: true, missing: {} },
    availability: {
      ...availability,
      status,
      blocker: blocker || availability.blocker || null,
      nextAction: nextAction || availability.nextAction || null
    },
    effects: Array.isArray(effects) ? effects : [],
    metadata: stableValue(metadata || {}),
    blocker: blocker || null,
    nextAction: nextAction || null,
    actionRef,
    ui: stableValue(ui || {})
  };
  node.availability = canonicalAvailability(node);
  return node;
}

function canonicalEdge(edgeId, from, to, kind, label = null, metadata = {}) {
  return {
    edgeId: edgeId || `${from}->${to}:${kind}`,
    from,
    to,
    kind,
    canonical: true,
    label,
    metadata: stableValue(metadata || {})
  };
}

function missingRefs(requirements) {
  return (requirements?.items || [])
    .filter((item) => Number(item.missing || 0) > 0)
    .map((item) => item.kind === 'hq'
      ? `hq.level.${item.required}`
      : item.kind === 'xp'
        ? 'resource.xp'
        : item.kind === 'building'
          ? `building.${String(item.resource || '').toUpperCase()}.place`
          : `constraint.storage.${String(item.resource || '').toLowerCase()}`);
}

function productionSpecFor(buildingType, level = 1, state = null) {
  const def = engine.BUILDING_DEFS[buildingType];
  if (typeof def?.produces !== 'function') return null;
  const spec = def.produces(level);
  return typeof engine.applyDoctrineEffectsToJobSpec === 'function'
    ? engine.applyDoctrineEffectsToJobSpec(state || {}, buildingType, spec)
    : spec;
}

function buildCanonicalHqNodes(state) {
  const nodes = [];
  const edges = [];
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const hq = hqBuilding(state);
  for (const [rawLevel, rules] of Object.entries(engine.HQ_LEVEL_RULES || {}).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const level = Number(rawLevel);
    const status = hqLevel >= level ? 'done' : level === hqLevel + 1 ? 'blocked' : 'locked';
    nodes.push(canonicalNode({
      nodeId: `hq.level.${level}`,
      kind: 'hq_level',
      title: `HQ Level ${level}`,
      status,
      icon: hqIcon(level),
      target: { kind: 'hq', level, buildingId: hq?.buildingId || null },
      requirements: requirementsFor(state, { hqLevelRequired: level }),
      availability: {
        hqLevel: hqLevel,
        hqLevelRequired: level,
        blockedBy: hqLevel >= level ? [] : [`hq.level.${Math.max(1, level - 1)}`]
      },
      effects: [
        ...(rules.unlocks || []).map((type) => ({ kind: 'unlocks_building', buildingType: type })),
        ...(rules.permissionUnlocks || []).map((key) => ({ kind: 'unlocks_permission', permissionKey: key })),
        { kind: 'sets_storage_caps', storageCaps: clone(rules.storageCaps || {}) },
        { kind: 'sets_construction_slots', constructionSlots: Number(rules.constructionSlots || 0) }
      ],
      nextAction: status === 'done' ? `HQ Level ${level} reached` : `Reach HQ Level ${level}`,
      ui: { tier: `HQ${level}`, lane: 'HQ', sort: level * 100 }
    }));
  }
  for (const [rawFromLevel, rule] of Object.entries(engine.HQ_UPGRADE_RULES || {}).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const fromLevel = Number(rawFromLevel);
    const targetLevel = Number(rule.nextLevel || fromLevel + 1);
    const requirements = requirementsFor(state, {
      cost: rule.cost || {},
      xpRequired: rule.xpRequired || null,
      hqLevelRequired: fromLevel,
      buildingPrerequisites: rule.buildingPrerequisites || []
    });
    const buildingPrerequisites = requirements.items.filter((item) => item.kind === 'building');
    const missingBuildingPrerequisites = buildingPrerequisites.filter((item) => Number(item.missing || 0) > 0);
    let status = 'locked';
    let blocker = null;
    let actionRef = null;
    if (hqLevel >= targetLevel) {
      status = 'done';
    } else if (hqLevel < fromLevel) {
      blocker = `Reach HQ Level ${fromLevel} first.`;
    } else if (hq?.activeJob) {
      status = 'waiting';
      blocker = 'Headquarters is already upgrading.';
    } else if (!requirements.affordable) {
      status = 'blocked';
      const missingBuilding = requirements.items.find((item) => item.kind === 'building' && Number(item.missing || 0) > 0);
      blocker = missingBuilding
        ? `Build and ready ${missingBuilding.label || labelForType(missingBuilding.resource)} before this HQ upgrade.`
        : 'Collect the missing HQ upgrade requirements.';
    } else {
      status = 'available';
      actionRef = actionRefFor('et.plot.upgrade_building', {
        buildingId: hq?.buildingId || '$hqBuildingId',
        actor: 'HUMAN',
        idempotencyKey: '$idempotencyKey'
      });
    }
    const nodeId = `hq.upgrade.${targetLevel}`;
    nodes.push(canonicalNode({
      nodeId,
      kind: 'hq_upgrade',
      title: `Upgrade HQ to Level ${targetLevel}`,
      status,
      icon: hqIcon(targetLevel),
      target: { kind: 'hq_upgrade', fromLevel, targetLevel, buildingId: hq?.buildingId || null },
      requirements,
      availability: {
        hqLevel,
        hqLevelRequired: fromLevel,
        affordable: requirements.affordable,
        durationMs: Number(rule.durationMs || 0),
        buildingPrerequisites,
        missingBuildingPrerequisites,
        blockedBy: [
          ...(hqLevel < fromLevel ? [`hq.level.${fromLevel}`] : []),
          ...missingRefs(requirements)
        ]
      },
      effects: [{ kind: 'unlocks_hq_level', level: targetLevel }],
      metadata: {
        cost: normalizeCost(rule.cost || {}),
        xpRequired: Number(rule.xpRequired || 0),
        durationMs: Number(rule.durationMs || 0),
        buildingPrerequisites,
        missingBuildingPrerequisites
      },
      blocker,
      nextAction: status === 'done' ? `HQ Level ${targetLevel} reached` : `Upgrade HQ to Level ${targetLevel}`,
      actionRef,
      ui: { tier: `HQ${targetLevel}`, lane: 'HQ', sort: targetLevel * 100 + 10 }
    }));
    edges.push(canonicalEdge(`hq.level.${fromLevel}->${nodeId}`, `hq.level.${fromLevel}`, nodeId, 'requires_hq_level', `Requires HQ Level ${fromLevel}`));
    for (const prerequisite of buildingPrerequisites) {
      edges.push(canonicalEdge(
        `building.${prerequisite.resource}.place->${nodeId}`,
        `building.${prerequisite.resource}.place`,
        nodeId,
        'requires_building_prerequisite',
        `Requires ${prerequisite.label || prerequisite.resource} ready`
      ));
    }
    edges.push(canonicalEdge(`${nodeId}->hq.level.${targetLevel}`, nodeId, `hq.level.${targetLevel}`, 'unlocks_hq_level', `Unlocks HQ Level ${targetLevel}`));
  }
  return { nodes, edges };
}

function buildCanonicalBuildingNodes(state) {
  const nodes = [];
  const edges = [];
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const openPads = openPadCount(state);
  const sortedDefs = Object.entries(engine.BUILDING_DEFS || {})
    .filter(([type, def]) => type !== 'HQ' && def?.construction)
    .sort((a, b) => Number(a[1].unlockHqLevel || 1) - Number(b[1].unlockHqLevel || 1) || a[0].localeCompare(b[0]));
  for (const [buildingType, def] of sortedDefs) {
    const label = labelForType(buildingType);
    const existing = findBuilding(state, buildingType);
    const requiredHq = Number(def.unlockHqLevel || 1);
    const unlocked = isBuildingUnlocked(state, buildingType) || hqLevel >= requiredHq;
    const unlockNodeId = `building.${buildingType}.unlock`;
    nodes.push(canonicalNode({
      nodeId: unlockNodeId,
      kind: 'building_unlock',
      title: `Unlock ${label}`,
      status: unlocked ? 'done' : 'locked',
      icon: buildingIcon(buildingType),
      target: { kind: 'building', type: buildingType },
      requirements: requirementsFor(state, { hqLevelRequired: requiredHq }),
      availability: {
        hqLevelRequired: requiredHq,
        unlocked,
        blockedBy: unlocked ? [] : [`hq.level.${requiredHq}`]
      },
      effects: [{ kind: 'unlocks_action', action: `building.${buildingType}.place` }],
      nextAction: unlocked ? `${label} unlocked` : `Reach HQ Level ${requiredHq}`,
      ui: { tier: `HQ${requiredHq}`, lane: label, sort: requiredHq * 100 + 20 }
    }));
    edges.push(canonicalEdge(`hq.level.${requiredHq}->${unlockNodeId}`, `hq.level.${requiredHq}`, unlockNodeId, 'unlocks_building', `HQ${requiredHq} unlocks ${label}`));

    const placeRequirements = requirementsFor(state, {
      cost: def.construction?.cost || {},
      hqLevelRequired: requiredHq
    });
    let placeStatus = 'locked';
    let placeBlocker = null;
    let placeActionRef = null;
    if (existing) {
      placeStatus = 'done';
    } else if (!unlocked) {
      placeBlocker = `Requires HQ Level ${requiredHq}.`;
    } else if (openPads <= 0) {
      placeStatus = 'blocked';
      placeBlocker = 'No open build pads remain.';
    } else if (!placeRequirements.affordable) {
      placeStatus = 'blocked';
      placeBlocker = 'Collect the missing construction resources.';
    } else {
      placeStatus = 'available';
      placeActionRef = actionRefFor('et.plot.place_building', {
        type: buildingType,
        x: '$padX',
        y: '$padY',
        actor: 'HUMAN',
        idempotencyKey: '$idempotencyKey'
      }, {
        note: 'Atlas does not choose a pad; gameplay placement still requires x/y.'
      });
    }
    const placeNodeId = `building.${buildingType}.place`;
    nodes.push(canonicalNode({
      nodeId: placeNodeId,
      kind: 'building_place',
      title: `Build ${label}`,
      status: placeStatus,
      icon: buildingIcon(buildingType),
      target: { kind: 'building', type: buildingType, buildingId: existing?.buildingId || null, level: existing?.level || 1 },
      requirements: placeRequirements,
      availability: {
        hqLevelRequired: requiredHq,
        unlocked,
        placed: !!existing,
        openPads,
        affordable: placeRequirements.affordable,
        durationMs: Number(def.construction?.durationMs || 0),
        blockedBy: [
          ...(unlocked ? [] : [`hq.level.${requiredHq}`]),
          ...(openPads <= 0 && !existing ? ['constraint.build_pads'] : []),
          ...missingRefs(placeRequirements)
        ]
      },
      effects: [{ kind: 'unlocks_action', action: `production.${buildingType}.${productionSpecFor(buildingType)?.kind || 'PRODUCE'}` }],
      metadata: { cost: normalizeCost(def.construction?.cost || {}), durationMs: Number(def.construction?.durationMs || 0) },
      blocker: placeBlocker,
      nextAction: existing ? `${label} is placed` : `Build ${label}`,
      actionRef: placeActionRef,
      ui: { tier: `HQ${requiredHq}`, lane: label, sort: requiredHq * 100 + 30 }
    }));
    edges.push(canonicalEdge(`${unlockNodeId}->${placeNodeId}`, unlockNodeId, placeNodeId, 'enables_action', `${label} can be placed once unlocked`));
    edges.push(canonicalEdge(`constraint.construction_slots->${placeNodeId}`, 'constraint.construction_slots', placeNodeId, 'uses_construction_slot', 'Construction uses a slot'));

    for (const [rawFromLevel, upgradeRule] of Object.entries(def.upgrade || {}).sort((a, b) => Number(a[0]) - Number(b[0]))) {
      const fromLevel = Number(rawFromLevel);
      const toLevel = Number(upgradeRule.toLevel || fromLevel + 1);
      const upgradeRequirements = requirementsFor(state, {
        cost: upgradeRule.cost || {},
        hqLevelRequired: requiredHq
      });
      let status = 'locked';
      let blocker = null;
      let actionRef = null;
      if (!existing) {
        blocker = `Build ${label} first.`;
      } else if (Number(existing.level || 1) >= toLevel) {
        status = 'done';
      } else if (Number(existing.level || 1) < fromLevel) {
        blocker = `Upgrade ${label} to Level ${fromLevel} first.`;
      } else if (existing.activeJob) {
        status = 'waiting';
        blocker = `${label} already has an active job.`;
      } else if (!upgradeRequirements.affordable) {
        status = 'blocked';
        blocker = 'Collect the missing building upgrade resources.';
      } else {
        status = 'available';
        actionRef = actionRefFor('et.plot.upgrade_building', {
          buildingId: existing.buildingId,
          actor: 'HUMAN',
          idempotencyKey: '$idempotencyKey'
        });
      }
      const nodeId = `building.${buildingType}.upgrade.${toLevel}`;
      nodes.push(canonicalNode({
        nodeId,
        kind: 'building_upgrade',
        title: `Upgrade ${label} to Level ${toLevel}`,
        status,
        icon: buildingIcon(buildingType),
        target: { kind: 'building_upgrade', type: buildingType, buildingId: existing?.buildingId || null, fromLevel, toLevel },
        requirements: upgradeRequirements,
        availability: {
          hqLevelRequired: requiredHq,
          placed: !!existing,
          currentLevel: Number(existing?.level || 0),
          affordable: upgradeRequirements.affordable,
          durationMs: Number(upgradeRule.durationMs || 0),
          blockedBy: [
            ...(existing ? [] : [placeNodeId]),
            ...missingRefs(upgradeRequirements)
          ]
        },
        effects: [{ kind: 'improves_building_output', buildingType, toLevel }],
        metadata: { cost: normalizeCost(upgradeRule.cost || {}), durationMs: Number(upgradeRule.durationMs || 0) },
        blocker,
        nextAction: status === 'done' ? `${label} Level ${toLevel} reached` : `Upgrade ${label}`,
        actionRef,
        ui: { tier: `HQ${requiredHq}`, lane: label, sort: requiredHq * 100 + 40 + toLevel }
      }));
      edges.push(canonicalEdge(`${placeNodeId}->${nodeId}`, placeNodeId, nodeId, 'requires_building', `Requires ${label}`));
      edges.push(canonicalEdge(`constraint.construction_slots->${nodeId}`, 'constraint.construction_slots', nodeId, 'uses_construction_slot', 'Upgrade uses a construction slot'));
    }
  }
  return { nodes, edges };
}

function buildCanonicalProductionNodes(state) {
  const nodes = [];
  const edges = [];
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  for (const [buildingType, def] of Object.entries(engine.BUILDING_DEFS || {}).filter(([type, row]) => type !== 'HQ' && typeof row?.produces === 'function')) {
    const label = labelForType(buildingType);
    const existing = findBuilding(state, buildingType);
    const spec = productionSpecFor(buildingType, existing?.level || 1, state) || productionSpecFor(buildingType, 1, state);
    if (!spec) continue;
    const requiredHq = Number(def.unlockHqLevel || 1);
    const locked = hqLevel < requiredHq || !existing;
    const requirements = requirementsFor(state, { cost: spec.input || {}, hqLevelRequired: requiredHq });
    let status = 'locked';
    let blocker = null;
    let actionRef = null;
    if (locked) {
      blocker = !existing ? `Build ${label} first.` : `Requires HQ Level ${requiredHq}.`;
    } else if (existing.state === 'OUTPUT_READY' || existing.canCollect) {
      status = 'waiting';
      blocker = 'Collect the ready output before queueing another job.';
    } else if (existing.activeJob) {
      status = 'waiting';
      blocker = `${label} has an active ${String(existing.activeJob.kind || 'job').toLowerCase()} job.`;
    } else if (!requirements.affordable) {
      status = 'blocked';
      blocker = 'Collect the missing job inputs.';
    } else {
      status = 'available';
      actionRef = actionRefFor('et.plot.queue_job', {
        buildingId: existing.buildingId,
        kind: spec.kind,
        actor: 'HUMAN',
        idempotencyKey: '$idempotencyKey'
      }, {
        agentPolicy: spec.kind === 'SELL'
          ? { permissionKey: 'sellSurplusFood', requiredHqLevel: 5, requiresPolicyEnabled: true, dailyCapField: 'sellDailyCoinCap' }
          : { permissionKey: 'queueProduction', requiredHqLevel: 3, requiresPolicyEnabled: true }
      });
    }
    const productionNodeId = `production.${buildingType}.${spec.kind}`;
    const output = normalizeJobOutput(spec.output || {});
    const input = normalizeCost(spec.input || {});
    const effects = Object.entries(output)
      .filter(([resource]) => RESOURCE_KEYS.includes(resource))
      .map(([resource, amount]) => ({ kind: 'produces_resource', resource, amount }));
    if (Number(output.scout_report || 0) > 0) {
      effects.push({ kind: 'produces_receipt', receiptType: 'scout_report', amount: Number(output.scout_report || 0) });
    }
    if (buildingType === 'WORKSHOP') effects.push({ kind: 'applies_buff_to_next_build', construction_buff_pct: Number(spec.buffPct || 0) });
    const isScout = spec.kind === 'SCOUT';
    nodes.push(canonicalNode({
      nodeId: productionNodeId,
      kind: spec.kind === 'SELL' ? 'production_sell' : isScout ? 'production_receipt' : buildingType === 'WORKSHOP' ? 'production_effect' : 'production_loop',
      title: spec.kind === 'SELL' ? `Sell food at ${label}` : isScout ? `Dispatch scout from ${label}` : `Run ${label}`,
      status,
      icon: spec.kind === 'SELL' ? resourceIcon('coin') : isScout ? getAgentTownIcon('action.scout') : buildingIcon(buildingType),
      target: { kind: 'building_job', type: buildingType, buildingId: existing?.buildingId || null, jobKind: spec.kind },
      requirements,
      availability: {
        hqLevelRequired: requiredHq,
        placed: !!existing,
        buildingState: existing?.state || null,
        canQueue: !!existing?.canQueue,
        affordable: requirements.affordable,
        durationMs: Number(spec.durationMs || 0),
        baseDurationMs: Number(spec.baseDurationMs || spec.durationMs || 0),
        doctrineEffect: spec.doctrineEffect ? stableValue(spec.doctrineEffect) : null,
        blockedBy: [
          ...(existing ? [] : [`building.${buildingType}.place`]),
          ...(hqLevel >= requiredHq ? [] : [`hq.level.${requiredHq}`]),
          ...missingRefs(requirements)
        ]
      },
      effects,
      metadata: {
        kind: spec.kind,
        input,
        output,
        durationMs: Number(spec.durationMs || 0),
        baseDurationMs: Number(spec.baseDurationMs || spec.durationMs || 0),
        doctrineEffect: spec.doctrineEffect ? stableValue(spec.doctrineEffect) : null,
        buffPct: spec.buffPct == null ? null : Number(spec.buffPct)
      },
      blocker,
      nextAction: status === 'available' ? (isScout ? 'Dispatch scout' : `Queue ${spec.kind.toLowerCase()} job`) : (blocker || `Prepare ${label}`),
      actionRef,
      ui: { tier: `HQ${requiredHq}`, lane: label, sort: requiredHq * 100 + 60 }
    }));
    edges.push(canonicalEdge(`building.${buildingType}.place->${productionNodeId}`, `building.${buildingType}.place`, productionNodeId, 'requires_building', `Requires ${label}`));
    for (const resource of Object.keys(input)) {
      edges.push(canonicalEdge(`constraint.storage.${resource}->${productionNodeId}`, `constraint.storage.${resource}`, productionNodeId, 'consumes_resource', `Consumes ${resource}`));
    }

    let collectStatus = 'locked';
    let collectBlocker = null;
    let collectActionRef = null;
    if (!existing) {
      collectBlocker = `Build ${label} first.`;
    } else if (existing.canCollect || existing.state === 'OUTPUT_READY') {
      collectStatus = 'available';
      collectActionRef = actionRefFor('et.plot.collect_outputs', {
        buildingId: existing.buildingId,
        actor: 'HUMAN',
        idempotencyKey: '$idempotencyKey'
      }, {
        agentPolicy: { permissionKey: 'collectOutputs', requiredHqLevel: 2, requiresPolicyEnabled: true }
      });
    } else if (existing.activeJob) {
      collectStatus = 'waiting';
      collectBlocker = `${label} output is not ready yet.`;
    } else {
      collectStatus = 'blocked';
      collectBlocker = 'Queue a job before collecting output.';
    }
    const buffer = buildingType === 'EXPEDITION_BOARD'
      ? normalizeJobOutput(existing?.outputBuffer || {})
      : normalizeInventory(existing?.outputBuffer || {});
    const collectNodeId = `production.${buildingType}.collect`;
    const isScoutCollect = buildingType === 'EXPEDITION_BOARD';
    nodes.push(canonicalNode({
      nodeId: collectNodeId,
      kind: buildingType === 'WORKSHOP' ? 'effect_collect' : isScoutCollect ? 'receipt_collect' : 'production_collect',
      title: buildingType === 'WORKSHOP' ? 'Collect Workshop buff' : isScoutCollect ? 'Collect Scout Report' : `Collect ${label} output`,
      status: collectStatus,
      icon: buildingType === 'WORKSHOP' ? permissionIcon('setPriority') : isScoutCollect ? getAgentTownIcon('receipt.scout_report') : buildingIcon(buildingType),
      target: { kind: 'building_collect', type: buildingType, buildingId: existing?.buildingId || null },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        placed: !!existing,
        buildingState: existing?.state || null,
        canCollect: !!existing?.canCollect || existing?.state === 'OUTPUT_READY',
        outputBuffer: buffer,
        blockedBy: existing ? [] : [`building.${buildingType}.place`]
      },
      effects: buildingType === 'WORKSHOP'
        ? [{ kind: 'applies_buff_to_next_build', construction_buff_pct: Number(spec.buffPct || 0) }]
        : isScoutCollect
          ? [{ kind: 'records_receipt', receiptType: 'scout_report' }]
          : Object.entries(output)
            .filter(([resource]) => RESOURCE_KEYS.includes(resource))
            .map(([resource, amount]) => ({ kind: 'fills_storage', resource, amount })),
      metadata: {
        outputBuffer: buffer,
        scoutReport: isScoutCollect && existing?.outputBuffer?.scoutReport ? compactScoutReport(existing.outputBuffer.scoutReport) : null,
        scoutReportCount: isScoutCollect ? normalizeScoutReports(state?.plot?.scoutReports || state?.scoutReports).length : null,
        storageCaps: normalizeInventory(state?.plot?.storageCaps),
        leavesOverflowWhenCapped: RESOURCE_STORAGE_KEYS.some((key) => Number(buffer[key] || 0) > 0 && Number(state?.plot?.inventory?.[key] || 0) >= Number(state?.plot?.storageCaps?.[key] || 0))
      },
      blocker: collectBlocker,
      nextAction: collectStatus === 'available' ? (isScoutCollect ? 'Collect scout report' : 'Collect outputs') : (collectBlocker || 'Wait for output'),
      actionRef: collectActionRef,
      ui: { tier: `HQ${requiredHq}`, lane: label, sort: requiredHq * 100 + 70 }
    }));
    edges.push(canonicalEdge(`${productionNodeId}->${collectNodeId}`, productionNodeId, collectNodeId, buildingType === 'WORKSHOP' ? 'applies_buff_to_next_build' : isScoutCollect ? 'produces_receipt' : 'produces_resource', 'Job output becomes collectible'));
  }
  return { nodes, edges };
}

function buildCanonicalPermissionPolicyNodes(state) {
  const nodes = [];
  const edges = [];
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const policy = {
    sellDailyCoinCap: 15,
    maxAutonomousActionsPerHour: 12,
    emergencyPause: false,
    ...(state?.plot?.policy || {})
  };
  const levels = permissionLevelMap();
  const rows = permissionRowsByKey(state);
  for (const [permissionKey, requiredHq] of Object.entries(levels).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))) {
    const row = rows[permissionKey] || {};
    const unlocked = row.unlocked === true || hqLevel >= requiredHq;
    const nodeId = `permission.${permissionKey}.unlock`;
    nodes.push(canonicalNode({
      nodeId,
      kind: 'permission_unlock',
      title: row.label || labelForType(permissionKey),
      status: unlocked ? 'done' : 'locked',
      icon: permissionIcon(permissionKey),
      target: { kind: 'permission', key: permissionKey },
      requirements: requirementsFor(state, { hqLevelRequired: requiredHq }),
      availability: {
        hqLevelRequired: requiredHq,
        unlocked,
        enabled: row.enabled === true,
        requiresApproval: row.requiresApproval === true,
        blockedBy: unlocked ? [] : [`hq.level.${requiredHq}`]
      },
      effects: [{ kind: 'enables_policy', policyKey: permissionKey }],
      nextAction: unlocked ? `Review ${permissionKey}` : `Reach HQ Level ${requiredHq}`,
      ui: { tier: `HQ${requiredHq}`, lane: 'Permissions', sort: requiredHq * 100 + 80 }
    }));
    edges.push(canonicalEdge(`hq.level.${requiredHq}->${nodeId}`, `hq.level.${requiredHq}`, nodeId, 'unlocks_permission', `HQ${requiredHq} unlocks ${permissionKey}`));
    const policyNodeId = `policy.${permissionKey}.enable`;
    const policyStatus = unlocked ? (row.enabled === true ? 'done' : 'available') : 'locked';
    nodes.push(canonicalNode({
      nodeId: policyNodeId,
      kind: 'policy_enable',
      title: `Policy: ${row.label || labelForType(permissionKey)}`,
      status: policyStatus,
      icon: permissionIcon(permissionKey),
      target: { kind: 'policy', key: permissionKey },
      requirements: requirementsFor(state, { hqLevelRequired: requiredHq }),
      availability: {
        hqLevelRequired: requiredHq,
        unlocked,
        enabled: row.enabled === true,
        requiresApproval: row.requiresApproval === true,
        blockedBy: unlocked ? [] : [nodeId]
      },
      effects: [{ kind: 'enables_agent_action', permissionKey }],
      metadata: { policyValue: row.enabled === true },
      nextAction: row.enabled ? `${permissionKey} policy enabled` : `Enable ${permissionKey} policy if desired`,
      ui: { tier: `HQ${requiredHq}`, lane: 'Policy', sort: requiredHq * 100 + 85 }
    }));
    edges.push(canonicalEdge(`${nodeId}->${policyNodeId}`, nodeId, policyNodeId, 'enables_action', `${permissionKey} permission enables policy toggle`));
  }
  const capNodes = [
    {
      nodeId: 'policy.sellDailyCoinCap',
      title: 'Policy: daily sell coin cap',
      value: Number(policy.sellDailyCoinCap || 0),
      requiredHq: levels.sellSurplusFood || 5
    },
    {
      nodeId: 'policy.maxAutonomousActionsPerHour',
      title: 'Policy: hourly autonomous action cap',
      value: Number(policy.maxAutonomousActionsPerHour || 0),
      requiredHq: 1
    },
    {
      nodeId: 'policy.emergencyPause',
      title: 'Policy: emergency pause',
      value: policy.emergencyPause === true,
      requiredHq: 1
    }
  ];
  for (const cap of capNodes) {
    const unlocked = hqLevel >= cap.requiredHq;
    nodes.push(canonicalNode({
      nodeId: cap.nodeId,
      kind: 'policy_cap',
      title: cap.title,
      status: unlocked ? 'done' : 'locked',
      icon: permissionIcon(cap.nodeId.split('.')[1]),
      target: { kind: 'policy', key: cap.nodeId.replace('policy.', '') },
      requirements: requirementsFor(state, { hqLevelRequired: cap.requiredHq }),
      availability: {
        hqLevelRequired: cap.requiredHq,
        unlocked,
        value: cap.value,
        blockedBy: unlocked ? [] : [`hq.level.${cap.requiredHq}`]
      },
      metadata: { value: cap.value },
      nextAction: 'Review policy cap',
      ui: { tier: `HQ${cap.requiredHq}`, lane: 'Policy', sort: cap.requiredHq * 100 + 90 }
    }));
  }
  const setPriorityUnlocked = hqLevel >= (levels.setPriority || 4);
  nodes.push(canonicalNode({
    nodeId: 'action.set_priority',
    kind: 'policy_action',
    title: 'Set building priority',
    status: setPriorityUnlocked ? 'available' : 'locked',
    icon: permissionIcon('setPriority'),
    target: { kind: 'action', action: 'set_priority', options: [...PRIORITY_OPTIONS] },
    requirements: requirementsFor(state, { hqLevelRequired: levels.setPriority || 4 }),
    availability: {
      hqLevelRequired: levels.setPriority || 4,
      policyEnabled: rows.setPriority?.enabled === true,
      blockedBy: setPriorityUnlocked ? [] : ['permission.setPriority.unlock']
    },
    metadata: { priorityOptions: [...PRIORITY_OPTIONS] },
    nextAction: 'Set WOOD, STONE, FOOD, or BALANCED priority through gameplay tools',
    actionRef: actionRefFor('et.plot.set_priority', {
      buildingId: '$buildingId',
      priority: '$priority',
      actor: 'HUMAN',
      idempotencyKey: '$idempotencyKey'
    }),
    ui: { tier: `HQ${levels.setPriority || 4}`, lane: 'Policy', sort: (levels.setPriority || 4) * 100 + 95 }
  }));
  return { nodes, edges };
}

function buildCanonicalRewardNodes(state) {
  const nodes = [];
  const edges = [];
  const available = new Map((state?.rewards || []).map((reward) => [reward.rewardId, reward]));
  const claimed = new Set(state?.plot?.claimedRewards || []);
  const collected = new Set(state?.plot?.collectedBuildingTypes || []);
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  for (const reward of REWARD_CATALOG) {
    const isAvailable = available.has(reward.rewardId);
    const isClaimed = claimed.has(reward.rewardId);
    const requiredHq = Number(reward.requiredHqLevel || 1);
    const requiredCollected = reward.requiredCollectedBuildingType || null;
    const unlocked = requiredCollected ? collected.has(requiredCollected) : hqLevel >= requiredHq;
    const status = isClaimed ? 'done' : isAvailable ? 'available' : unlocked ? 'blocked' : 'locked';
    const nodeId = `reward.${reward.rewardId}.claim`;
    nodes.push(canonicalNode({
      nodeId,
      kind: 'reward_claim',
      title: `Claim ${reward.title}`,
      status,
      icon: resourceIcon(reward.grant?.town_xp ? 'xp' : Object.keys(reward.grant || {})[0] || 'coin'),
      target: { kind: 'reward', rewardId: reward.rewardId },
      requirements: requiredCollected
        ? {
          items: [{
            kind: 'building_collection',
            resource: requiredCollected,
            have: collected.has(requiredCollected) ? 1 : 0,
            required: 1,
            missing: collected.has(requiredCollected) ? 0 : 1
          }],
          affordable: collected.has(requiredCollected),
          missing: collected.has(requiredCollected) ? {} : { [requiredCollected]: 1 }
        }
        : requirementsFor(state, { hqLevelRequired: requiredHq }),
      availability: {
        available: isAvailable,
        claimed: isClaimed,
        unlocked,
        blockedBy: isClaimed || isAvailable ? [] : requiredCollected ? [`production.${requiredCollected}.collect`] : [`hq.level.${requiredHq}`]
      },
      effects: [{ kind: 'grants_reward', grant: clone(available.get(reward.rewardId)?.grant || reward.grant || {}) }],
      metadata: {
        body: reward.body,
        grant: clone(available.get(reward.rewardId)?.grant || reward.grant || {})
      },
      blocker: status === 'locked' ? 'Reward requirement has not been met yet.' : null,
      nextAction: isClaimed ? `${reward.title} claimed` : isAvailable ? `Claim ${reward.title}` : 'Meet reward requirement',
      actionRef: isAvailable ? actionRefFor('et.plot.claim_reward', {
        rewardId: reward.rewardId,
        actor: 'HUMAN',
        idempotencyKey: '$idempotencyKey'
      }) : null,
      ui: { tier: requiredCollected ? 'HQ1' : `HQ${requiredHq}`, lane: 'Rewards', sort: requiredHq * 100 + 110 }
    }));
    if (requiredCollected) {
      edges.push(canonicalEdge(`production.${requiredCollected}.collect->${nodeId}`, `production.${requiredCollected}.collect`, nodeId, 'unlocks_reward', `${requiredCollected} collection unlocks ${reward.title}`));
    } else {
      edges.push(canonicalEdge(`hq.level.${requiredHq}->${nodeId}`, `hq.level.${requiredHq}`, nodeId, 'unlocks_reward', `HQ${requiredHq} unlocks ${reward.title}`));
    }
  }
  return { nodes, edges };
}

function buildCanonicalConstraintNodes(state) {
  const nodes = [];
  const edges = [];
  const inventory = normalizeInventory(state?.plot?.inventory);
  const caps = normalizeInventory(state?.plot?.storageCaps);
  for (const resource of RESOURCE_STORAGE_KEYS) {
    const current = Number(inventory[resource] || 0);
    const cap = Number(caps[resource] || 0);
    nodes.push(canonicalNode({
      nodeId: `constraint.storage.${resource}`,
      kind: 'storage_cap',
      title: `${labelForType(resource)} storage`,
      status: 'done',
      icon: resourceIcon(resource),
      target: { kind: 'storage', resource },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        current,
        cap,
        remaining: Math.max(0, cap - current),
        full: cap > 0 && current >= cap,
        blockedBy: []
      },
      metadata: { current, cap, remaining: Math.max(0, cap - current) },
      nextAction: cap > 0 && current >= cap ? `Spend or upgrade before collecting more ${resource}` : `${resource} storage has room`,
      ui: { tier: 'Constraints', lane: 'Storage', sort: 900 + RESOURCE_STORAGE_KEYS.indexOf(resource) }
    }));
  }
  const jobs = Array.isArray(state?.jobs) ? state.jobs : [];
  const activeConstruction = jobs.filter((job) => ['CONSTRUCT', 'UPGRADE'].includes(job.kind) && ['QUEUED', 'RUNNING'].includes(job.status));
  const runningConstruction = activeConstruction.filter((job) => job.status === 'RUNNING');
  const queuedConstruction = activeConstruction.filter((job) => job.status === 'QUEUED');
  const constructionSlots = Number(state?.plot?.constructionSlots || 0);
  nodes.push(canonicalNode({
    nodeId: 'constraint.construction_slots',
    kind: 'construction_slots',
    title: 'Construction slots',
    status: runningConstruction.length >= constructionSlots ? 'waiting' : 'available',
    icon: permissionIcon('constructionSlots'),
    target: { kind: 'constraint', key: 'construction_slots' },
    requirements: { items: [], affordable: true, missing: {} },
    availability: {
      slots: constructionSlots,
      running: runningConstruction.length,
      queued: queuedConstruction.length,
      open: Math.max(0, constructionSlots - runningConstruction.length),
      blockedBy: []
    },
    metadata: {
      slots: constructionSlots,
      runningJobs: runningConstruction.map(compactJob).filter(Boolean),
      queuedJobs: queuedConstruction.map(compactJob).filter(Boolean)
    },
    nextAction: queuedConstruction.length ? 'Wait for a construction slot' : 'Construction slot available',
    ui: { tier: 'Constraints', lane: 'Construction', sort: 920 }
  }));
  const buffPct = Number(state?.plot?.nextBuildBuffPct || 0);
  const workshop = findBuilding(state, 'WORKSHOP');
  const workshopSpec = productionSpecFor('WORKSHOP', workshop?.level || 1);
  nodes.push(canonicalNode({
    nodeId: 'effect.workshop.next_build_buff',
    kind: 'workshop_buff',
    title: 'Workshop next-build buff',
    status: buffPct > 0 ? 'done' : workshop ? 'blocked' : 'locked',
    icon: buildingIcon('WORKSHOP'),
    target: { kind: 'effect', key: 'nextBuildBuffPct', buildingId: workshop?.buildingId || null },
    requirements: requirementsFor(state, { hqLevelRequired: 4 }),
    availability: {
      hqLevelRequired: 4,
      placed: !!workshop,
      activeBuffPct: buffPct,
      availableBuffPct: Number(workshopSpec?.buffPct || 20),
      blockedBy: workshop ? [] : ['building.WORKSHOP.place']
    },
    effects: [{ kind: 'applies_buff_to_next_build', construction_buff_pct: buffPct || Number(workshopSpec?.buffPct || 20) }],
    metadata: { activeBuffPct: buffPct, availableBuffPct: Number(workshopSpec?.buffPct || 20) },
    nextAction: buffPct > 0 ? 'Start the next construction to consume the buff' : 'Run and collect Workshop prep',
    ui: { tier: 'HQ4', lane: 'Workshop', sort: 480 }
  }));
  edges.push(canonicalEdge('production.WORKSHOP.collect->effect.workshop.next_build_buff', 'production.WORKSHOP.collect', 'effect.workshop.next_build_buff', 'applies_buff_to_next_build', 'Workshop collection applies next-build buff'));
  return { nodes, edges };
}

function buildCanonicalApprovalNodes(state) {
  const nodes = [];
  for (const approval of Array.isArray(state?.approvals) ? state.approvals : []) {
    const approvalId = String(approval.approvalId || '');
    if (!approvalId) continue;
    const status = String(approval.status || '').toUpperCase() === 'PENDING'
      ? 'available'
      : String(approval.status || '').toUpperCase() === 'APPROVED'
        ? 'done'
        : 'blocked';
    nodes.push(canonicalNode({
      nodeId: `approval.${approvalId}`,
      kind: 'approval',
      title: cleanText(approval.title || approval.actionName || 'Approval request', 'Approval request', 120),
      status,
      icon: permissionIcon('approval'),
      target: { kind: 'approval', approvalId, actionName: approval.actionName || approval.action || null },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        approvalId,
        approvalStatus: approval.status || null,
        actionName: approval.actionName || approval.action || null,
        blockedBy: []
      },
      metadata: {
        actionName: approval.actionName || approval.action || null,
        requestedParams: stableValue(approval.requestedParams || approval.params || {})
      },
      nextAction: status === 'available' ? 'Resolve approval in the gameplay approval surface' : 'Review approval record',
      ui: { tier: 'Approvals', lane: 'Approvals', sort: 1000 }
    }));
  }
  return { nodes, edges: [] };
}

function buildCanonicalScoutReportNodes(state) {
  const nodes = [];
  const edges = [];
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const reports = normalizeScoutReports(state?.plot?.scoutReports || state?.scoutReports);
  const plans = normalizeSitePlans(state?.plot?.sitePlans || state?.sitePlans);
  const plansByReport = new Map(plans.map((plan) => [plan.reportId, plan]));
  reports.forEach((report, index) => {
    const slug = slugFor(report.reportId || report.title || `report-${index + 1}`, `report_${index + 1}`);
    const nodeId = `receipt.scout_report.${slug}`;
    const draftNodeId = `planning.site_plan.${slug}.draft`;
    const plan = plansByReport.get(report.reportId);
    nodes.push(canonicalNode({
      nodeId,
      kind: 'receipt',
      title: report.title || `Scout Report ${index + 1}`,
      status: 'done',
      icon: getAgentTownIcon('receipt.scout_report'),
      target: { kind: 'receipt', receiptType: 'scout_report', reportId: report.reportId },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        receiptType: 'scout_report',
        reportId: report.reportId,
        blockedBy: []
      },
      effects: [{ kind: 'records_site_intelligence', receiptType: 'scout_report', siteType: report.siteType, risk: report.risk }],
      metadata: {
        report,
        resourceHints: report.resourceHints,
        traits: report.traits,
        summary: report.summary,
        recommendedNext: report.recommendedNext
      },
      nextAction: plan ? 'Review the Site Plan in the planning lane.' : 'Draft a Site Plan from this report before any future settlement claim exists.',
      ui: { tier: 'HQ3', lane: 'Scout Reports', sort: 375 + index }
    }));
    edges.push(canonicalEdge(`production.EXPEDITION_BOARD.collect->${nodeId}`, 'production.EXPEDITION_BOARD.collect', nodeId, 'records_receipt', 'Collected scout report becomes a planning receipt'));
    nodes.push(canonicalNode({
      nodeId: draftNodeId,
      kind: 'planning',
      title: plan ? `Site Plan drafted for ${report.title}` : `Draft Site Plan for ${report.title}`,
      status: plan ? 'done' : 'available',
      icon: getAgentTownIcon('planning.site_plan'),
      target: { kind: 'site_plan_draft', reportId: report.reportId },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        reportId: report.reportId,
        blockedBy: []
      },
      effects: [{ kind: 'creates_site_plan_draft', reportId: report.reportId, canonicalPlanningOnly: true }],
      metadata: {
        reportId: report.reportId,
        boundary: 'Drafting a Site Plan records canonical planning intent only; it does not claim territory.',
        editorBoundary: 'Atlas variants can propose alternate content, but this tool records the engine-owned plan.'
      },
      nextAction: plan ? 'Review the canonical Site Plan and editor variants.' : 'Draft a Site Plan from this report.',
      actionRef: plan ? null : actionRefFor('et.plot.draft_site_plan', {
        reportId: report.reportId,
        title: `${report.title || 'Scout Report'} Site Plan`,
        focus: 'balanced',
        actor: 'HUMAN',
        idempotencyKey: `draft-site-plan-${slug}`
      }, {
        note: 'Atlas may point to this canonical tool, but execution remains a Founders Plot mutation.',
        executableByAtlas: false
      }),
      ui: { tier: 'HQ3', lane: 'Site Plans', sort: 382 + index }
    }));
    edges.push(canonicalEdge(`${nodeId}->${draftNodeId}`, nodeId, draftNodeId, 'promotes_receipt_to_plan', 'Scout report can be promoted into a canonical Site Plan draft'));
  });
  plans.forEach((plan, index) => {
    const planSlug = slugFor(plan.planId || plan.title || `site-plan-${index + 1}`, `site_plan_${index + 1}`);
    const reportSlug = slugFor(plan.reportId || `report-${index + 1}`, `report_${index + 1}`);
    const nodeId = `planning.site_plan.${planSlug}`;
    nodes.push(canonicalNode({
      nodeId,
      kind: 'planning',
      title: plan.title || `Site Plan ${index + 1}`,
      status: 'done',
      icon: getAgentTownIcon('planning.site_plan'),
      target: { kind: 'site_plan', planId: plan.planId, reportId: plan.reportId },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        planId: plan.planId,
        reportId: plan.reportId,
        promotionStatus: plan.promotionStatus,
        reviewStatus: plan.reviewStatus,
        blockedBy: []
      },
      effects: [{
        kind: 'records_settlement_intent',
        planId: plan.planId,
        focus: plan.focus,
        promotionStatus: plan.promotionStatus,
        reviewStatus: plan.reviewStatus
      }],
      metadata: {
        plan,
        boundary: 'This is canonical planning state, not a second plot or territory claim.',
        requiresImplementation: plan.authorityBoundary
      },
      nextAction: plan.reviewStatus === 'reviewed'
        ? 'Hold for HQ7 Settler Convoy claim rules.'
        : 'Review at HQ6 Settlement Charter before any future claim tool exists.',
      ui: { tier: 'HQ3', lane: 'Site Plans', sort: 390 + index }
    }));
    edges.push(canonicalEdge(`planning.site_plan.${reportSlug}.draft->${nodeId}`, `planning.site_plan.${reportSlug}.draft`, nodeId, 'plans_from_receipt', 'Scout report became a canonical Site Plan draft'));
    const reviewNodeId = `${nodeId}.review`;
    const reviewed = plan.reviewStatus === 'reviewed' || plan.promotionStatus === 'reviewed_claim_ready';
    const reviewUnlocked = hqLevel >= 6;
    nodes.push(canonicalNode({
      nodeId: reviewNodeId,
      kind: 'planning_review',
      title: reviewed ? `Reviewed Site Plan: ${plan.title}` : `Review Site Plan: ${plan.title}`,
      status: reviewed ? 'done' : reviewUnlocked ? 'available' : 'locked',
      icon: hqIcon(6),
      target: { kind: 'site_plan_review', planId: plan.planId, reportId: plan.reportId },
      requirements: requirementsFor(state, { hqLevelRequired: 6 }),
      availability: {
        planId: plan.planId,
        reportId: plan.reportId,
        hqLevelRequired: 6,
        reviewStatus: plan.reviewStatus,
        promotionStatus: plan.promotionStatus,
        blockedBy: reviewed || reviewUnlocked ? [] : ['hq.level.6']
      },
      effects: [{
        kind: 'marks_claim_ready_planning_state',
        planId: plan.planId,
        canonicalPlanningOnly: true,
        createsTerritory: false,
        createsSecondPlot: false,
        createsConvoy: false,
        resourcePayout: false
      }],
      metadata: {
        plan,
        authorityBoundary: plan.authorityBoundary,
        reviewedAt: plan.reviewedAt,
        reviewNote: plan.reviewNote,
        boundary: 'HQ6 review is engine-owned claim-ready planning state only; it cannot create territory, routes, convoys, resources, or a second plot.'
      },
      nextAction: reviewed ? 'Wait for future HQ7 claim/convoy rules.' : reviewUnlocked ? 'Review this Site Plan for future claim readiness.' : 'Reach HQ6 Settlement Charter first.',
      actionRef: reviewed ? null : actionRefFor('et.plot.review_site_plan', {
        planId: plan.planId,
        reviewNote: 'Reviewed for future claim readiness; no territory created.',
        actor: 'HUMAN',
        idempotencyKey: `review-site-plan-${planSlug}`
      }, {
        note: 'Atlas may reference this canonical review tool, but execution remains a Founders Plot mutation.',
        executableByAtlas: false,
        authorityBoundary: 'claim_ready_planning_only_no_territory'
      }),
      ui: { tier: 'HQ6', lane: 'Settlement Charter', sort: 600 + index }
    }));
    edges.push(canonicalEdge(`${nodeId}->${reviewNodeId}`, nodeId, reviewNodeId, 'reviews_planning_state', 'Site Plan review promotes planning state without territory'));
    edges.push(canonicalEdge(`hq.level.6->${reviewNodeId}`, 'hq.level.6', reviewNodeId, 'requires_hq_level', 'HQ6 Settlement Charter unlocks Site Plan review'));
  });
  return { nodes, edges };
}

function buildCanonicalSettlementClaimNodes(state) {
  const nodes = [];
  const edges = [];
  const plans = normalizeSitePlans(state?.plot?.sitePlans || state?.sitePlans);
  const claims = normalizeSettlementClaims(state?.settlementClaims || []);
  const claimsByPlan = new Map(claims.map((claim) => [claim.sitePlanId, claim]));
  plans.forEach((plan, index) => {
    const claimReady = plan.reviewStatus === 'reviewed'
      || plan.promotionStatus === 'reviewed_claim_ready'
      || plan.promotionStatus === 'convoy_preparing'
      || plan.promotionStatus === 'claimed';
    if (!claimReady) return;
    const planSlug = slugFor(plan.planId || plan.title || `site-plan-${index + 1}`, `site_plan_${index + 1}`);
    const claim = claimsByPlan.get(plan.planId);
    const claimReadyNodeId = `planning.site_plan.${planSlug}.claim_ready`;
    const prepareNodeId = `settlement.claim.${planSlug}.prepare_convoy`;
    nodes.push(canonicalNode({
      nodeId: claimReadyNodeId,
      kind: 'planning_claim_ready',
      title: `Claim-ready Site Plan: ${plan.title}`,
      status: 'done',
      icon: getAgentTownIcon('planning.site_plan'),
      target: { kind: 'site_plan_claim_ready', planId: plan.planId },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        planId: plan.planId,
        promotionStatus: plan.promotionStatus,
        blockedBy: []
      },
      effects: [{
        kind: 'unlocks_settler_convoy_preparation',
        planId: plan.planId,
        createsTerritory: false,
        createsSecondPlot: false
      }],
      metadata: {
        plan,
        boundary: 'Claim-ready planning can unlock a convoy action, but it is not territory and not a second plot.'
      },
      nextAction: claim ? 'Track the active settlement claim.' : 'Prepare a Settler Convoy in Founders Plot.',
      ui: { tier: 'HQ7', lane: 'Settler Convoy', sort: 700 + index }
    }));
    const prepareDone = !!claim;
    nodes.push(canonicalNode({
      nodeId: prepareNodeId,
      kind: 'settlement_claim_prepare',
      title: prepareDone ? `Settler Convoy prepared for ${plan.title}` : `Prepare Settler Convoy: ${plan.title}`,
      status: prepareDone ? 'done' : 'available',
      icon: getAgentTownIcon('action.prepare_settler_convoy'),
      target: { kind: 'settler_convoy_prepare', planId: plan.planId },
      requirements: requirementsFor(state, { cost: engine.SETTLER_CONVOY_DEF.cost, hqLevelRequired: engine.SETTLER_CONVOY_DEF.bridgeRequiredHqLevel }),
      availability: {
        planId: plan.planId,
        hqLevelRequired: engine.SETTLER_CONVOY_DEF.bridgeRequiredHqLevel,
        blockedBy: []
      },
      effects: [{
        kind: 'creates_settlement_claim_and_convoy_job',
        planId: plan.planId,
        createsSecondPlot: false,
        durationMs: engine.SETTLER_CONVOY_DEF.durationMs
      }],
      metadata: {
        plan,
        cost: engine.SETTLER_CONVOY_DEF.cost,
        durationMs: engine.SETTLER_CONVOY_DEF.durationMs,
        boundary: 'Preparing a convoy spends resources and creates an engine-owned claim/job. It does not found a plot.'
      },
      nextAction: prepareDone ? 'Wait for convoy arrival or found settlement if arrived.' : 'Prepare Settler Convoy in Founders Plot.',
      actionRef: prepareDone ? null : actionRefFor('et.plot.prepare_settler_convoy', {
        sitePlanId: plan.planId,
        actor: 'HUMAN',
        idempotencyKey: `prepare-settler-convoy-${planSlug}`
      }, {
        note: 'Atlas exposes this action reference as metadata only; Founders Plot owns execution.',
        executableByAtlas: false,
        authorityBoundary: 'engine_owned_expansion_claim_no_world_map'
      }),
      ui: { tier: 'HQ7', lane: 'Settler Convoy', sort: 710 + index }
    }));
    edges.push(canonicalEdge(`planning.site_plan.${planSlug}.review->${claimReadyNodeId}`, `planning.site_plan.${planSlug}.review`, claimReadyNodeId, 'promotes_plan_to_claim_ready', 'HQ6 review produces claim-ready planning state'));
    edges.push(canonicalEdge(`${claimReadyNodeId}->${prepareNodeId}`, claimReadyNodeId, prepareNodeId, 'unlocks_convoy', 'Claim-ready Site Plan unlocks bounded Settler Convoy preparation'));
  });

  claims.forEach((claim, index) => {
    const claimSlug = slugFor(claim.claimId || claim.title || `claim-${index + 1}`, `claim_${index + 1}`);
    const planSlug = slugFor(claim.sitePlanId || `site-plan-${index + 1}`, `site_plan_${index + 1}`);
    const convoyNodeId = `settlement.claim.${claimSlug}.convoy`;
    const arrivedNodeId = `settlement.claim.${claimSlug}.arrived`;
    const foundNodeId = `settlement.claim.${claimSlug}.found`;
    const plotNodeId = claim.foundedPlotId ? `plot.outpost.${slugFor(claim.foundedPlotId, 'outpost')}` : null;
    const claimReceiptNodeId = `receipt.settlement_claim.${claimSlug}`;
    const foundedReceiptNodeId = claim.foundedPlotId ? `receipt.second_plot_founded.${slugFor(claim.foundedPlotId, 'outpost')}` : null;
    const arrived = claim.status === 'CONVOY_ARRIVED' || claim.status === 'FOUNDED';
    const founded = claim.status === 'FOUNDED' && !!claim.foundedPlotId;
    nodes.push(canonicalNode({
      nodeId: convoyNodeId,
      kind: 'settler_convoy',
      title: `Settler Convoy: ${claim.title}`,
      status: 'done',
      icon: getAgentTownIcon('unit.settler_convoy'),
      target: { kind: 'settlement_claim', claimId: claim.claimId },
      requirements: { items: [], affordable: true, missing: {} },
      availability: { claimId: claim.claimId, status: claim.status, blockedBy: [] },
      effects: [{ kind: 'tracks_timed_convoy', claimId: claim.claimId, route: claim.route }],
      metadata: { claim, boundary: 'Convoy route is an engine record with visual-only projection; it is not a world map.' },
      nextAction: arrived ? 'Found settlement explicitly.' : 'Wait for the timed convoy to arrive.',
      ui: { tier: 'HQ7', lane: 'Settler Convoy', sort: 720 + index }
    }));
    nodes.push(canonicalNode({
      nodeId: arrivedNodeId,
      kind: 'settler_convoy_arrival',
      title: arrived ? `Convoy arrived: ${claim.title}` : `Convoy en route: ${claim.title}`,
      status: arrived ? 'done' : 'locked',
      icon: getAgentTownIcon('route.convoy'),
      target: { kind: 'settlement_claim_arrival', claimId: claim.claimId },
      requirements: { items: [], affordable: arrived, missing: arrived ? {} : { convoy_arrival: 1 } },
      availability: { claimId: claim.claimId, status: claim.status, blockedBy: arrived ? [] : [convoyNodeId] },
      effects: [{ kind: 'unlocks_found_settlement', claimId: claim.claimId }],
      metadata: { claim },
      nextAction: arrived ? 'Found settlement in Founders Plot.' : 'Wait for the convoy timer.',
      ui: { tier: 'HQ7', lane: 'Settler Convoy', sort: 730 + index }
    }));
    nodes.push(canonicalNode({
      nodeId: foundNodeId,
      kind: 'found_settlement',
      title: founded ? `Settlement founded: ${claim.title}` : `Found Settlement: ${claim.title}`,
      status: founded ? 'done' : arrived ? 'available' : 'locked',
      icon: getAgentTownIcon('action.found_settlement'),
      target: { kind: 'found_settlement', claimId: claim.claimId },
      requirements: { items: [], affordable: arrived, missing: arrived ? {} : { convoy_arrival: 1 } },
      availability: { claimId: claim.claimId, status: claim.status, blockedBy: arrived ? [] : [arrivedNodeId] },
      effects: [{
        kind: 'creates_second_plot',
        claimId: claim.claimId,
        foundedPlotId: claim.foundedPlotId || null,
        createsWorldMap: false
      }],
      metadata: {
        claim,
        requiresHumanConfirmation: true,
        boundary: 'Founding creates one owned outpost plot through server code. It does not create trade routes, territory simulation, or doctrine effects.'
      },
      nextAction: founded ? 'Open the outpost plot.' : arrived ? 'Confirm settlement founding in Founders Plot.' : 'Wait for convoy arrival.',
      actionRef: founded ? null : actionRefFor('et.plot.found_settlement', {
        claimId: claim.claimId,
        actor: 'HUMAN',
        idempotencyKey: `found-settlement-${claimSlug}`
      }, {
        note: 'Atlas exposes this action reference as metadata only; Founders Plot owns execution and confirmation.',
        executableByAtlas: false,
        requiresHumanConfirmation: true,
        authorityBoundary: 'server_owned_second_plot_no_world_map'
      }),
      ui: { tier: 'HQ7', lane: 'Second Plot', sort: 740 + index }
    }));
    nodes.push(canonicalNode({
      nodeId: claimReceiptNodeId,
      kind: 'receipt',
      title: `Settlement Claim Receipt: ${claim.title}`,
      status: 'done',
      icon: getAgentTownIcon('receipt.settlement_claim'),
      target: { kind: 'receipt', receiptType: 'settlement_claim', claimId: claim.claimId },
      requirements: { items: [], affordable: true, missing: {} },
      availability: { claimId: claim.claimId, blockedBy: [] },
      effects: [{ kind: 'records_settlement_claim', claimId: claim.claimId }],
      metadata: { claim },
      nextAction: founded ? 'Review founding receipt.' : 'Keep the claim receipt for founding.',
      ui: { tier: 'HQ7', lane: 'Receipts', sort: 750 + index }
    }));
    edges.push(canonicalEdge(`settlement.claim.${planSlug}.prepare_convoy->${convoyNodeId}`, `settlement.claim.${planSlug}.prepare_convoy`, convoyNodeId, 'creates_claim', 'Preparing convoy creates the settlement claim'));
    edges.push(canonicalEdge(`${convoyNodeId}->${arrivedNodeId}`, convoyNodeId, arrivedNodeId, 'convoy_arrives', 'Timed convoy arrival unlocks founding'));
    edges.push(canonicalEdge(`${arrivedNodeId}->${foundNodeId}`, arrivedNodeId, foundNodeId, 'unlocks_found_settlement', 'Arrived convoy can be founded explicitly'));
    edges.push(canonicalEdge(`${convoyNodeId}->${claimReceiptNodeId}`, convoyNodeId, claimReceiptNodeId, 'records_receipt', 'Settlement claim is recorded as a receipt'));
    if (plotNodeId) {
      nodes.push(canonicalNode({
        nodeId: plotNodeId,
        kind: 'outpost_plot',
        title: `Outpost Plot: ${claim.title}`,
        status: 'done',
        icon: getAgentTownIcon('plot.second_settlement'),
        target: { kind: 'plot', plotId: claim.foundedPlotId, claimId: claim.claimId },
        requirements: { items: [], affordable: true, missing: {} },
        availability: { plotId: claim.foundedPlotId, claimId: claim.claimId, blockedBy: [] },
        effects: [{ kind: 'owned_outpost_plot_created', plotId: claim.foundedPlotId, claimId: claim.claimId }],
        metadata: { claim },
        nextAction: 'Open the outpost plot.',
        ui: { tier: 'HQ7', lane: 'Second Plot', sort: 760 + index }
      }));
      nodes.push(canonicalNode({
        nodeId: foundedReceiptNodeId,
        kind: 'receipt',
        title: `Second Plot Founded: ${claim.title}`,
        status: 'done',
        icon: getAgentTownIcon('receipt.second_plot_founded'),
        target: { kind: 'receipt', receiptType: 'second_plot_founded', plotId: claim.foundedPlotId, claimId: claim.claimId },
        requirements: { items: [], affordable: true, missing: {} },
        availability: { plotId: claim.foundedPlotId, claimId: claim.claimId, blockedBy: [] },
        effects: [{ kind: 'records_second_plot_founding', plotId: claim.foundedPlotId }],
        metadata: { claim },
        nextAction: 'Review outpost state.',
        ui: { tier: 'HQ7', lane: 'Receipts', sort: 770 + index }
      }));
      edges.push(canonicalEdge(`${foundNodeId}->${plotNodeId}`, foundNodeId, plotNodeId, 'creates_second_plot', 'Founding creates the owned outpost plot'));
      edges.push(canonicalEdge(`${foundNodeId}->${foundedReceiptNodeId}`, foundNodeId, foundedReceiptNodeId, 'records_receipt', 'Founding records a second-plot receipt'));
    }
  });
  return { nodes, edges };
}

function buildCanonicalDoctrineNodes(state) {
  const nodes = [];
  const edges = [];
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const claims = normalizeSettlementClaims(state?.settlementClaims || []);
  const outpostCount = claims.filter((claim) => claim.status === 'FOUNDED' && claim.foundedPlotId).length;
  const doctrineState = normalizeDoctrineState(state?.plot?.doctrineState || state?.doctrineState);
  const catalog = Object.values(engine.DOCTRINE_CATALOG || {});
  const lodgeUnlocked = hqLevel >= 6 && outpostCount > 0;
  const selectedDoctrine = catalog.find((doctrine) => doctrine.doctrineId === doctrineState.selectedDoctrineId) || null;
  const hasOperationalEffect = selectedDoctrine?.engineOwnedEffect === true || selectedDoctrine?.gameplayBuff === true;
  const lodgeNodeId = 'research_lodge.advisory_stance';
  nodes.push(canonicalNode({
    nodeId: lodgeNodeId,
    kind: 'research_lodge',
    title: 'Research Lodge Doctrine Stance',
    status: lodgeUnlocked ? 'available' : 'locked',
    icon: makeIcon({
      iconId: 'building.research_lodge',
      label: 'Research Lodge',
      symbol: 'RL',
      tone: 'research'
    }),
    target: { kind: 'research_lodge', advisoryOnly: false, engineOwnedEffect: true },
    requirements: requirementsFor(state, { hqLevelRequired: 6 }),
    availability: {
      hqLevelRequired: 6,
      outpostCount,
      foundedOutpostRequired: true,
      advisoryOnly: false,
      engineOwnedEffect: true,
      blockedBy: lodgeUnlocked
        ? []
        : [
          ...(hqLevel < 6 ? ['hq.level.6'] : []),
          ...(outpostCount > 0 ? [] : ['settlement.outpost.founded'])
        ]
    },
    effects: [{
      kind: 'unlocks_engine_owned_doctrine_selection',
      gameplayBuff: true,
      resourceMath: false,
      crossPlotEffect: false
    }],
    metadata: {
      implementation: 'server_owned_doctrine_read_model_no_building_scout_duration_effect_v1',
      boundary: 'HQ8B does not add a physical Research Lodge building or general research system; it exposes one server-owned doctrine effect after HQ6 plus a founded outpost.'
    },
    nextAction: doctrineState.selectedDoctrineId
      ? 'Review the selected engine-owned doctrine effect.'
      : lodgeUnlocked ? 'Select one engine-owned doctrine stance.' : 'Found an outpost after HQ6 before selecting a doctrine stance.',
    ui: { tier: 'HQ8', lane: 'Research Lodge', sort: 800 }
  }));
  edges.push(canonicalEdge('hq.level.6->research_lodge.advisory_stance', 'hq.level.6', lodgeNodeId, 'unlocks_research_lodge_read_model', 'HQ6 is the engine bridge for Research Lodge doctrine stance'));

  catalog.forEach((doctrine, index) => {
    const selected = doctrineState.selectedDoctrineId === doctrine.doctrineId && doctrineState.status === 'SELECTED';
    const unlocked = hqLevel >= Number(doctrine.unlockHqLevel || 1)
      && (!doctrine.requiresFoundedOutpost || outpostCount > 0);
    const nodeId = `doctrine.${slugFor(doctrine.doctrineId, `doctrine_${index + 1}`)}`;
    nodes.push(canonicalNode({
      nodeId,
      kind: 'doctrine',
      title: doctrine.title || doctrine.doctrineId,
      status: selected ? 'done' : unlocked ? 'available' : 'locked',
      icon: makeIcon({
        iconId: `doctrine.${doctrine.doctrineId}`,
        label: doctrine.title || 'Doctrine',
        symbol: 'D',
        tone: 'research'
      }),
      target: { kind: 'doctrine', doctrineId: doctrine.doctrineId },
      requirements: requirementsFor(state, { cost: doctrine.cost || {}, hqLevelRequired: doctrine.unlockHqLevel || 1 }),
      availability: {
        doctrineId: doctrine.doctrineId,
        hqLevelRequired: Number(doctrine.unlockHqLevel || 1),
        outpostCount,
        selected,
        advisoryOnly: doctrine.engineOwnedEffect !== true,
        engineOwnedEffect: doctrine.engineOwnedEffect === true,
        gameplayBuff: doctrine.gameplayBuff === true,
        blockedBy: unlocked
          ? []
          : [
            ...(hqLevel < Number(doctrine.unlockHqLevel || 1) ? [`hq.level.${Number(doctrine.unlockHqLevel || 1)}`] : []),
            ...(doctrine.requiresFoundedOutpost && outpostCount < 1 ? ['settlement.outpost.founded'] : [])
          ]
      },
      effects: [{
        kind: doctrine.engineOwnedEffect === true ? 'sets_engine_owned_doctrine_effect' : 'sets_advisory_doctrine_stance',
        doctrineId: doctrine.doctrineId,
        gameplayBuff: doctrine.gameplayBuff === true,
        resourceMath: false,
        durationModifier: doctrine.effectKind === 'scout_duration_modifier' ? stableValue(doctrine.effectValue || {}) : null,
        crossPlotEffect: false
      }],
      metadata: {
        doctrine,
        selectedState: selected ? doctrineState : null,
        boundary: 'Survey Discipline has exactly one engine-owned gameplay effect: Expedition Board SCOUT duration is multiplied by 0.95. It cannot change inventory, routes, settlement, cohorts, world-grid, or cross-plot rules.'
      },
      nextAction: selected ? 'Doctrine effect selected.' : unlocked ? 'Select this engine-owned doctrine stance.' : 'Unlock the Research Lodge doctrine stance first.',
      actionRef: selected ? null : actionRefFor('et.plot.select_doctrine', {
        doctrineId: doctrine.doctrineId,
        actor: 'HUMAN',
        idempotencyKey: `select-doctrine-${slugFor(doctrine.doctrineId, 'doctrine')}`
      }, {
        note: 'Atlas exposes this action reference as metadata only; Founders Plot owns doctrine selection.',
        executableByAtlas: false,
        authorityBoundary: doctrine.authorityBoundary || 'server_owned_doctrine_effect_v1'
      }),
      ui: { tier: 'HQ8', lane: 'Research Lodge', sort: 810 + index }
    }));
    edges.push(canonicalEdge(`${lodgeNodeId}->${nodeId}`, lodgeNodeId, nodeId, 'offers_doctrine', 'Research Lodge offers engine-owned doctrine stances'));
  });
  if (hasOperationalEffect) {
    edges.push(canonicalEdge('doctrine.survey_discipline->production.EXPEDITION_BOARD.SCOUT', 'doctrine.survey_discipline', 'production.EXPEDITION_BOARD.SCOUT', 'modifies_duration', 'Survey Discipline applies a 0.95 duration multiplier to SCOUT jobs'));
  }
  return { nodes, edges };
}

function buildCanonicalWorkOrderNodes(state) {
  const nodes = [];
  const edges = [];
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const claims = normalizeSettlementClaims(state?.settlementClaims || []);
  const outpostCount = claims.filter((claim) => claim.status === 'FOUNDED' && claim.foundedPlotId).length;
  const doctrineState = normalizeDoctrineState(state?.plot?.doctrineState || state?.doctrineState);
  const templates = Array.isArray(state?.workOrderTemplates) ? state.workOrderTemplates : [];
  const workOrders = normalizeWorkOrders(state?.workOrders || []);
  const plannerUnlocked = hqLevel >= 6 && outpostCount > 0 && doctrineState.selectedDoctrineId === 'survey_discipline';
  const executorAvailable = plannerUnlocked;
  const plannerNodeId = 'cohort.work_order_planner';
  nodes.push(canonicalNode({
    nodeId: plannerNodeId,
    kind: 'cohort_planner',
    title: 'Cohort Work-Order Planner',
    status: plannerUnlocked ? 'available' : 'locked',
    icon: makeIcon({
      iconId: 'building.cohort_hall',
      label: 'Cohort Hall',
      symbol: 'CH',
      tone: 'civic'
    }),
    target: { kind: 'cohort_planner', executionAvailable: executorAvailable },
    requirements: requirementsFor(state, { hqLevelRequired: 6 }),
    availability: {
      hqLevelRequired: 6,
      outpostCount,
      selectedDoctrineId: doctrineState.selectedDoctrineId,
      executionAvailable: executorAvailable,
      blockedBy: plannerUnlocked
        ? []
        : [
          ...(hqLevel < 6 ? ['hq.level.6'] : []),
          ...(outpostCount > 0 ? [] : ['settlement.outpost.founded']),
          ...(doctrineState.selectedDoctrineId === 'survey_discipline' ? [] : ['doctrine.survey_discipline.selected'])
        ]
    },
    effects: [{
      kind: 'unlocks_work_order_drafts',
      executionAvailable: executorAvailable,
      arbitraryToolExecution: false
    }],
    metadata: {
      boundary: 'HQ9B can explicitly execute only collect_ready_outputs_once work orders. It does not schedule, spend, place, scout, found, or run arbitrary tools.',
      templates: stableValue(templates)
    },
    nextAction: plannerUnlocked ? 'Draft or explicitly execute a bounded collect-ready-outputs work order.' : 'Finish HQ8 doctrine setup before drafting cohort work orders.',
    ui: { tier: 'HQ9', lane: 'Cohorts', sort: 900 }
  }));
  edges.push(canonicalEdge('doctrine.survey_discipline->cohort.work_order_planner', 'doctrine.survey_discipline', plannerNodeId, 'unlocks_cohort_planner', 'Selected Survey Discipline unlocks cautious cohort planning'));

  templates.forEach((template, index) => {
    const availability = template.availability || {};
    const unlocked = availability.unlocked === true;
    const nodeId = `work_order.template.${slugFor(template.templateId, `template_${index + 1}`)}`;
    nodes.push(canonicalNode({
      nodeId,
      kind: 'work_order_template',
      title: template.title || template.templateId,
      status: unlocked ? 'available' : 'locked',
      icon: makeIcon({
        iconId: `work_order.${template.templateId}`,
        label: template.title || 'Work Order',
        symbol: 'WO',
        tone: 'civic'
      }),
      target: { kind: 'work_order_template', templateId: template.templateId },
      requirements: requirementsFor(state, { hqLevelRequired: availability.hqLevelRequired || 6 }),
      availability: {
        ...stableValue(availability),
        executionAvailable: unlocked && template.templateId === 'collect_ready_outputs_once',
        arbitraryToolExecution: false
      },
      effects: [{
        kind: 'creates_work_order_draft',
        allowedActions: stableValue(template.allowedActions || []),
        caps: stableValue(template.caps || {}),
        executionAvailable: unlocked && template.templateId === 'collect_ready_outputs_once'
      }],
      metadata: {
        template: stableValue(template),
        boundary: template.authorityBoundary || 'server_owned_work_order_draft_no_execution_v1'
      },
      nextAction: unlocked ? 'Create a draft, then execute it explicitly when ready outputs exist.' : 'Unlock this work-order template first.',
      actionRef: unlocked ? actionRefFor('et.plot.create_work_order_draft', {
        templateId: template.templateId,
        scope: {},
        actor: 'HUMAN',
        idempotencyKey: `draft-work-order-${slugFor(template.templateId, 'template')}`
      }, {
        note: 'Atlas exposes this action reference as metadata only; Founders Plot owns work-order draft creation.',
        executableByAtlas: false,
        authorityBoundary: template.authorityBoundary || 'server_owned_work_order_draft_no_execution_v1'
      }) : null,
      ui: { tier: 'HQ9', lane: 'Cohorts', sort: 910 + index }
    }));
    edges.push(canonicalEdge(`${plannerNodeId}->${nodeId}`, plannerNodeId, nodeId, 'offers_work_order_template', 'Cohort planner offers bounded server-owned work-order draft templates'));
  });

  workOrders.forEach((order, index) => {
    const nodeId = `work_order.${slugFor(order.workOrderId, `draft_${index + 1}`)}`;
    const executable = order.status === 'DRAFT' && order.templateId === 'collect_ready_outputs_once' && executorAvailable;
    nodes.push(canonicalNode({
      nodeId,
      kind: 'work_order_draft',
      title: order.title,
      status: order.status === 'DRAFT' ? 'waiting' : order.status.toLowerCase(),
      icon: makeIcon({
        iconId: `work_order.${order.templateId}`,
        label: order.title,
        symbol: 'WO',
        tone: 'civic'
      }),
      target: { kind: 'work_order', workOrderId: order.workOrderId, templateId: order.templateId },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        status: order.status,
        executionAvailable: executable,
        blockedBy: executable ? [] : order.status === 'DRAFT' ? ['work_order.executor.locked_or_template_unsupported'] : ['work_order.already_executed']
      },
      effects: [{
        kind: order.status === 'COMPLETED' ? 'records_work_order_execution' : 'records_work_order_draft',
        executionAvailable: executable,
        childReceiptCount: Number(order.childReceiptCount || 0)
      }],
      metadata: {
        workOrder: order,
        boundary: 'HQ9B executor is explicit, one-shot, same-plot only, max two collect_outputs children, no spend.'
      },
      blocker: executable ? null : (order.status === 'DRAFT' ? 'This work order is not executable in the current live unlock state.' : 'This work order already executed once.'),
      nextAction: executable ? 'Execute this collect-ready-outputs work order explicitly.' : 'Review the work-order receipt trail.',
      actionRef: executable ? actionRefFor('et.plot.execute_work_order', {
        workOrderId: order.workOrderId,
        actor: 'HUMAN',
        idempotencyKey: `execute-work-order-${slugFor(order.workOrderId, 'work_order')}`
      }, {
        note: 'Atlas exposes this execution reference as metadata only; Founders Plot owns the mutation.',
        executableByAtlas: false,
        authorityBoundary: 'server_owned_work_order_executor_collect_ready_outputs_once_v1'
      }) : null,
      ui: { tier: 'HQ9', lane: 'Cohorts', sort: 940 + index }
    }));
    edges.push(canonicalEdge(`work_order.template.${slugFor(order.templateId, 'template')}->${nodeId}`, `work_order.template.${slugFor(order.templateId, 'template')}`, nodeId, 'drafted_work_order', 'Template produced a server-owned work-order draft'));
  });

  return { nodes, edges };
}

function buildCanonicalWorldGridNodes(state) {
  const nodes = [];
  const edges = [];
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const worldGrid = state?.worldGrid && typeof state.worldGrid === 'object' ? state.worldGrid : {};
  const blockedBy = Array.isArray(worldGrid?.requirements?.blockedBy)
    ? worldGrid.requirements.blockedBy.filter(Boolean)
    : [
      ...(hqLevel >= 6 ? [] : ['hq.level.6']),
      'settlement.outpost.founded',
      'doctrine.survey_discipline.selected',
      'work_order.collect_ready_outputs_once.available'
    ];
  const ready = worldGrid?.civicReadiness?.ready === true || worldGrid.status === 'READ_MODEL_READY';
  const civicProposalReadModel = state?.civicProposals && typeof state.civicProposals === 'object'
    ? state.civicProposals
    : {};
  const civicProposals = normalizeCivicProposals(civicProposalReadModel?.proposals || []);
  const overlayPackReadModel = state?.overlayPacks && typeof state.overlayPacks === 'object'
    ? state.overlayPacks
    : {};
  const overlayPacks = normalizeOverlayPacks(overlayPackReadModel?.packs || []);
  const civicProjectReadModel = state?.civicProjects && typeof state.civicProjects === 'object'
    ? state.civicProjects
    : {};
  const civicProjects = normalizeCivicProjects(civicProjectReadModel?.projects || []);
  const reviewedProposalIds = civicProposals
    .filter((proposal) => proposal.status === 'REVIEWED')
    .map((proposal) => proposal.proposalId)
    .sort();
  const overlayReady = ready && reviewedProposalIds.length > 0;
  const civicProjectReady = ready && reviewedProposalIds.length > 0;
  const activeCivicProjectCount = civicProjects.filter((project) => project.status === 'ACTIVE').length;
  const readModelNodeId = 'world_grid.read_model';
  const civicReadinessNodeId = 'world_grid.civic_readiness';
  const proposalRecordsNodeId = 'world_grid.civic_proposal_records';
  const overlayRecordsNodeId = 'generated_universe.overlay_pack_records';
  const civicProjectActivationNodeId = 'world_grid.civic_project_activation';

  nodes.push(canonicalNode({
    nodeId: readModelNodeId,
    kind: 'world_grid_read_model',
    title: 'World Grid Read Model',
    status: ready ? 'available' : 'locked',
    icon: makeIcon({
      iconId: 'world_grid.read_model',
      label: 'World Grid',
      symbol: 'WG',
      tone: 'civic'
    }),
    target: { kind: 'world_grid_status', readOnly: true },
    requirements: requirementsFor(state, { hqLevelRequired: 6 }),
    availability: {
      readOnly: true,
      executableByAtlas: false,
      status: worldGrid.status || 'LOCKED',
      blockedBy
    },
    effects: [{
      kind: 'projects_world_grid_status',
      readOnly: true,
      civicMutation: false,
      tradeRoutes: false,
      backgroundScheduling: false,
      arbitraryToolExecution: false
    }],
    metadata: {
      implementation: worldGrid.implementation || 'hq10a_server_owned_world_grid_read_model_v1',
      boundary: worldGrid.authorityBoundary || 'server_owned_read_only_world_grid_projection_no_civic_mutation_v1',
      worldGrid: stableValue(worldGrid)
    },
    blocker: ready ? null : 'World Grid status is read-only until HQ6, a founded outpost, Survey Discipline, and the bounded work-order executor are present.',
    nextAction: ready
      ? 'Use HQ10B to add civic proposal records before any civic mutation tools.'
      : 'Complete the HQ6-HQ9 server-owned readiness chain before projecting World Grid status.',
    actionRef: null,
    ui: { tier: 'HQ10', lane: 'World Grid', sort: 1000 }
  }));

  nodes.push(canonicalNode({
    nodeId: civicReadinessNodeId,
    kind: 'civic_readiness',
    title: 'Civic Readiness Status',
    status: ready ? 'waiting' : 'locked',
    icon: makeIcon({
      iconId: 'world_grid.civic_readiness',
      label: 'Civic readiness',
      symbol: 'CR',
      tone: 'civic'
    }),
    target: { kind: 'civic_readiness', readOnly: true },
    requirements: { items: stableValue(worldGrid?.requirements?.items || []), affordable: ready, missing: {} },
    availability: {
      readOnly: true,
      executableByAtlas: false,
      readyForHq10B: ready,
      blockedBy
    },
    effects: [{
      kind: 'identifies_next_promotable_slice',
      nextPromotableSlice: ready ? 'HQ10B_CIVIC_PROPOSAL_RECORDS' : null,
      mutationAllowed: false
    }],
    metadata: {
      civicReadiness: stableValue(worldGrid?.civicReadiness || {}),
      prohibitedCapabilities: stableValue(worldGrid?.civicReadiness?.prohibitedCapabilities || [])
    },
    blocker: ready ? 'HQ10A intentionally stops at read-only status; HQ10B must add proposal records before mutations.' : 'Civic readiness is blocked by missing server-owned prerequisites.',
    nextAction: ready
      ? 'Draft HQ10B civic proposal records with no execution authority.'
      : 'Resolve the missing World Grid readiness prerequisites.',
    actionRef: null,
    ui: { tier: 'HQ10', lane: 'World Grid', sort: 1010 }
  }));

  nodes.push(canonicalNode({
    nodeId: proposalRecordsNodeId,
    kind: 'civic_proposal_records',
    title: 'Civic Proposal Records',
    status: ready ? 'available' : 'locked',
    icon: makeIcon({
      iconId: 'civic.proposal_records',
      label: 'Civic proposals',
      symbol: 'CP',
      tone: 'civic'
    }),
    target: { kind: 'civic_proposal_records', proposalOnly: true, readOnlyExecution: true },
    requirements: { items: stableValue(worldGrid?.requirements?.items || []), affordable: ready, missing: {} },
    availability: {
      readOnly: false,
      proposalOnly: true,
      executableByAtlas: false,
      readyForRecords: ready,
      blockedBy
    },
    effects: [{
      kind: 'records_advisory_civic_proposal',
      civicMutation: false,
      executionAllowed: false,
      tradeRoutes: false,
      resourceSpending: false,
      externalEffects: false
    }],
    metadata: {
      implementation: civicProposalReadModel.implementation || 'hq10b_server_owned_civic_proposal_records_v1',
      boundary: civicProposalReadModel.authorityBoundary || 'server_owned_civic_proposal_record_no_execution_v1',
      counts: stableValue(civicProposalReadModel.counts || {}),
      allowedStatuses: stableValue(civicProposalReadModel.allowedStatuses || ['DRAFT', 'REVIEWED', 'ARCHIVED']),
      proposals: stableValue(civicProposals)
    },
    blocker: ready ? null : 'Civic proposal records unlock only after HQ10A World Grid readiness.',
    nextAction: ready ? 'Record an advisory civic proposal. It will not execute civic work.' : 'Complete HQ10A World Grid readiness first.',
    actionRef: ready ? actionRefFor('et.plot.create_civic_proposal', {
      title: 'Civic Proposal',
      category: 'coordination',
      summary: 'Record advisory civic intent for later review. No execution.',
      status: 'DRAFT',
      actor: 'HUMAN',
      idempotencyKey: 'create-civic-proposal-draft'
    }, {
      note: 'Atlas exposes this creation reference as metadata only; Founders Plot owns the record mutation.',
      executableByAtlas: false,
      authorityBoundary: civicProposalReadModel.authorityBoundary || 'server_owned_civic_proposal_record_no_execution_v1'
    }) : null,
    ui: { tier: 'HQ10', lane: 'World Grid', sort: 1020 }
  }));

  nodes.push(canonicalNode({
    nodeId: overlayRecordsNodeId,
    kind: 'generated_universe_overlay_pack_records',
    title: 'Generated Universe Overlay Packs',
    status: overlayReady ? 'available' : ready ? 'waiting' : 'locked',
    icon: makeIcon({
      iconId: 'generated_universe.overlay_pack_records',
      label: 'Overlay packs',
      symbol: 'GU',
      tone: 'civic'
    }),
    target: { kind: 'generated_universe_overlay_pack_records', presentationOnly: true, visualOnly: true },
    requirements: {
      items: stableValue(overlayPackReadModel.requirements?.items || [
        ...(worldGrid?.requirements?.items || []),
        {
          key: 'civic_proposal.reviewed',
          label: 'Reviewed civic proposal',
          satisfied: reviewedProposalIds.length > 0,
          current: reviewedProposalIds.length,
          required: 1
        }
      ]),
      affordable: overlayReady,
      missing: {}
    },
    availability: {
      presentationOnly: true,
      visualOnly: true,
      executableByAtlas: false,
      readyForRecords: overlayReady,
      blockedBy: stableValue(overlayPackReadModel.requirements?.blockedBy || (overlayReady ? [] : ['civic_proposal.reviewed']))
    },
    effects: [{
      kind: 'records_generated_universe_overlay_pack',
      presentationOnly: true,
      gameplayMutation: false,
      executionAllowed: false,
      renderingImplemented: false,
      publicSharing: false,
      resourceSpending: false,
      routeCreation: false,
      externalEffects: false
    }],
    metadata: {
      implementation: overlayPackReadModel.implementation || 'hq10c_server_owned_generated_universe_overlay_pack_records_v1',
      boundary: overlayPackReadModel.authorityBoundary || 'server_owned_generated_universe_overlay_pack_presentation_only_v1',
      stableGameplayHashExcluded: true,
      counts: stableValue(overlayPackReadModel.counts || {}),
      sourceProposalIds: stableValue(reviewedProposalIds),
      packs: stableValue(overlayPacks)
    },
    blocker: overlayReady ? null : ready
      ? 'Overlay pack records require a reviewed civic proposal before any visual pack can be recorded.'
      : 'Overlay pack records unlock only after HQ10A World Grid readiness.',
    nextAction: overlayReady
      ? 'Record a presentation-only overlay pack. It will not render, share, or change gameplay.'
      : 'Review a civic proposal first, then record presentation-only overlay metadata.',
    actionRef: overlayReady ? actionRefFor('et.plot.create_overlay_pack', {
      sourceProposalId: reviewedProposalIds[0],
      title: 'Generated Universe Overlay Pack',
      theme: 'civic',
      summary: 'Presentation-only overlay metadata for Atlas and World Grid surfaces.',
      status: 'DRAFT',
      targetSurfaceIds: ['progression_atlas', 'world_grid'],
      targetNodeIds: [readModelNodeId, civicReadinessNodeId],
      prompt: 'Civic, readable Agent Town presentation overlay.',
      actor: 'HUMAN',
      idempotencyKey: 'create-overlay-pack-draft'
    }, {
      note: 'Atlas exposes this creation reference as metadata only; Founders Plot owns the persisted record mutation.',
      executableByAtlas: false,
      authorityBoundary: overlayPackReadModel.authorityBoundary || 'server_owned_generated_universe_overlay_pack_presentation_only_v1'
    }) : null,
    ui: { tier: 'HQ10', lane: 'Generated Universe', sort: 1040 }
  }));

  nodes.push(canonicalNode({
    nodeId: civicProjectActivationNodeId,
    kind: 'civic_project_activation',
    title: 'Civic Project Activation',
    status: activeCivicProjectCount > 0 ? 'available' : civicProjectReady ? 'waiting' : 'locked',
    icon: makeIcon({
      iconId: 'civic.project_activation',
      label: 'Civic project',
      symbol: 'CB',
      tone: 'civic'
    }),
    target: { kind: 'civic_project_activation', projectType: 'civic_beacon', publicWork: true },
    requirements: {
      items: stableValue(civicProjectReadModel.requirements?.items || [
        ...(worldGrid?.requirements?.items || []),
        {
          key: 'civic_proposal.reviewed',
          label: 'Reviewed civic proposal',
          satisfied: reviewedProposalIds.length > 0,
          current: reviewedProposalIds.length,
          required: 1
        }
      ]),
      affordable: civicProjectReady,
      missing: {}
    },
    availability: {
      readOnly: false,
      publicWork: true,
      executableByAtlas: false,
      activationAllowed: civicProjectReady,
      blockedBy: stableValue(civicProjectReadModel.requirements?.blockedBy || (civicProjectReady ? [] : ['civic_proposal.reviewed']))
    },
    effects: [{
      kind: 'applies_local_civic_beacon',
      localReadinessDelta: Number(civicProjectReadModel.activeEffects?.localReadinessDelta || 0),
      moraleMarkers: stableValue(civicProjectReadModel.activeEffects?.moraleMarkers || []),
      resourceSpending: false,
      routeCreation: false,
      backgroundScheduling: false,
      externalEffects: false
    }],
    metadata: {
      implementation: civicProjectReadModel.implementation || 'hq10d_server_owned_civic_project_activation_v1',
      boundary: civicProjectReadModel.authorityBoundary || 'server_owned_civic_project_activation_local_public_work_v1',
      counts: stableValue(civicProjectReadModel.counts || {}),
      activeEffects: stableValue(civicProjectReadModel.activeEffects || {}),
      projects: stableValue(civicProjects)
    },
    blocker: civicProjectReady ? null : ready
      ? 'Civic project activation requires a reviewed civic proposal on this plot.'
      : 'Civic project activation unlocks after HQ10A World Grid readiness.',
    nextAction: civicProjectReady
      ? 'Activate one local Civic Beacon from a reviewed proposal.'
      : 'Review a civic proposal first, then activate a bounded local public work.',
    actionRef: civicProjectReady ? actionRefFor('et.plot.activate_civic_project', {
      sourceProposalId: reviewedProposalIds[0],
      projectType: 'civic_beacon',
      title: 'Civic Beacon',
      summary: 'Activate a local public-work beacon that adds a bounded civic readiness marker.',
      actor: 'HUMAN',
      idempotencyKey: 'activate-civic-beacon'
    }, {
      note: 'Atlas exposes this activation reference as metadata only; Founders Plot owns the mutation and audit receipt.',
      executableByAtlas: false,
      authorityBoundary: civicProjectReadModel.authorityBoundary || 'server_owned_civic_project_activation_local_public_work_v1'
    }) : null,
    ui: { tier: 'HQ10', lane: 'World Grid', sort: 1060 }
  }));

  civicProposals.forEach((proposal, index) => {
    const nodeId = `civic_proposal.${slugFor(proposal.proposalId, `proposal_${index + 1}`)}`;
    nodes.push(canonicalNode({
      nodeId,
      kind: 'civic_proposal_record',
      title: proposal.title,
      status: proposal.status === 'ARCHIVED' ? 'done' : proposal.status === 'REVIEWED' ? 'available' : 'waiting',
      icon: makeIcon({
        iconId: 'civic.proposal',
        label: 'Proposal',
        symbol: 'PR',
        tone: 'civic'
      }),
      target: { kind: 'civic_proposal_record', proposalId: proposal.proposalId, proposalOnly: true },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        readOnly: true,
        proposalOnly: true,
        executableByAtlas: false,
        status: proposal.status
      },
      effects: [{
        kind: 'advisory_record_only',
        civicMutation: false,
        executionAllowed: false,
        resourceSpending: false,
        routeCreation: false
      }],
      metadata: {
        proposal: stableValue(proposal),
        boundary: proposal.authorityBoundary
      },
      blocker: proposal.status === 'DRAFT' ? 'Proposal is recorded for review only and cannot execute.' : null,
      nextAction: proposal.status === 'DRAFT' ? 'Review the civic note outside execution authority.' : 'Keep as a non-executing civic record.',
      actionRef: null,
      ui: { tier: 'HQ10', lane: 'World Grid', sort: 1030 + index }
    }));
    edges.push(canonicalEdge(`${proposalRecordsNodeId}->${nodeId}`, proposalRecordsNodeId, nodeId, 'records_civic_proposal', 'HQ10B stores proposal records without execution authority'));
  });

  overlayPacks.forEach((pack, index) => {
    const nodeId = `overlay_pack.${slugFor(pack.overlayPackId, `pack_${index + 1}`)}`;
    nodes.push(canonicalNode({
      nodeId,
      kind: 'generated_universe_overlay_pack_record',
      title: pack.title,
      status: pack.status === 'ARCHIVED' ? 'done' : pack.status === 'REVIEWED' ? 'available' : 'waiting',
      icon: makeIcon({
        iconId: 'generated_universe.overlay_pack',
        label: 'Overlay',
        symbol: 'OV',
        tone: 'civic'
      }),
      target: { kind: 'generated_universe_overlay_pack_record', overlayPackId: pack.overlayPackId, presentationOnly: true },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        readOnly: true,
        presentationOnly: true,
        visualOnly: true,
        executableByAtlas: false,
        status: pack.status
      },
      effects: [{
        kind: 'presentation_record_only',
        gameplayMutation: false,
        executionAllowed: false,
        resourceSpending: false,
        routeCreation: false,
        publicSharing: false,
        renderingImplemented: false
      }],
      metadata: {
        overlayPack: stableValue(pack),
        boundary: pack.authorityBoundary,
        stableGameplayHashExcluded: true
      },
      blocker: pack.status === 'DRAFT' ? 'Overlay pack is recorded for presentation review only and cannot execute.' : null,
      nextAction: pack.status === 'DRAFT' ? 'Review the visual metadata outside gameplay authority.' : 'Keep as a non-executing presentation record.',
      actionRef: null,
      ui: { tier: 'HQ10', lane: 'Generated Universe', sort: 1050 + index }
    }));
    edges.push(canonicalEdge(`${overlayRecordsNodeId}->${nodeId}`, overlayRecordsNodeId, nodeId, 'records_overlay_pack', 'HQ10C stores Generated Universe overlay packs as presentation-only records'));
  });

  civicProjects.forEach((project, index) => {
    const nodeId = `civic_project.${slugFor(project.projectId, `project_${index + 1}`)}`;
    const baselineInspected = project?.effect?.inspection?.baselineReadinessInspected === true;
    nodes.push(canonicalNode({
      nodeId,
      kind: 'civic_project_record',
      title: project.title,
      status: project.status === 'ARCHIVED' ? 'done' : 'available',
      icon: makeIcon({
        iconId: 'civic.project',
        label: 'Project',
        symbol: 'PW',
        tone: 'civic'
      }),
      target: { kind: 'civic_project_record', projectId: project.projectId, projectType: project.projectType },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        readOnly: true,
        publicWork: true,
        executableByAtlas: false,
        status: project.status,
        baselineInspectionAvailable: project.status === 'ACTIVE' && !baselineInspected
      },
      effects: [{
        kind: 'local_public_work_effect',
        effect: stableValue(project.effect || {}),
        receiptBacked: true,
        inspectionReceiptBacked: baselineInspected,
        resourceSpending: false,
        routeCreation: false,
        backgroundScheduling: false,
        externalEffects: false
      }],
      metadata: {
        project: stableValue(project),
        boundary: project.authorityBoundary,
        inspectionBoundary: engine.CIVIC_PROJECT_INSPECTION_AUTHORITY_BOUNDARY
      },
      blocker: null,
      nextAction: baselineInspected
        ? 'Keep the inspection receipt visible in the World Grid read model.'
        : 'Inspect this active same-plot civic project for local operations readiness.',
      actionRef: project.status === 'ACTIVE' && !baselineInspected ? actionRefFor('et.plot.inspect_civic_project', {
        projectId: project.projectId,
        inspectionType: 'baseline_readiness',
        note: 'Baseline inspection for local civic operations readiness.',
        actor: 'HUMAN',
        idempotencyKey: 'inspect-civic-project-baseline'
      }, {
        note: 'Atlas exposes this inspection reference as metadata only; Founders Plot owns the mutation and audit receipt.',
        executableByAtlas: false,
        authorityBoundary: engine.CIVIC_PROJECT_INSPECTION_AUTHORITY_BOUNDARY
      }) : null,
      ui: { tier: 'HQ10', lane: 'World Grid', sort: 1070 + index }
    }));
    edges.push(canonicalEdge(`${civicProjectActivationNodeId}->${nodeId}`, civicProjectActivationNodeId, nodeId, 'activates_civic_project', 'HQ10D activates a bounded local civic project with an audit receipt'));
  });

  edges.push(canonicalEdge(
    'cohort.work_order_planner->world_grid.read_model',
    'cohort.work_order_planner',
    readModelNodeId,
    'enables_world_grid_projection',
    'Bounded cohort planning is the final HQ9 prerequisite for read-only World Grid projection'
  ));
  edges.push(canonicalEdge(
    'world_grid.read_model->world_grid.civic_readiness',
    readModelNodeId,
    civicReadinessNodeId,
    'summarizes_civic_readiness',
    'The read model summarizes readiness without civic mutation'
  ));
  edges.push(canonicalEdge(
    'world_grid.civic_readiness->world_grid.civic_proposal_records',
    civicReadinessNodeId,
    proposalRecordsNodeId,
    'unlocks_proposal_records',
    'HQ10B records advisory civic proposals before any civic mutation tools exist'
  ));
  edges.push(canonicalEdge(
    'world_grid.civic_proposal_records->generated_universe.overlay_pack_records',
    proposalRecordsNodeId,
    overlayRecordsNodeId,
    'unlocks_overlay_pack_records',
    'HQ10C records Generated Universe overlay packs after reviewed civic proposals, without gameplay authority'
  ));
  edges.push(canonicalEdge(
    'world_grid.civic_proposal_records->world_grid.civic_project_activation',
    proposalRecordsNodeId,
    civicProjectActivationNodeId,
    'unlocks_civic_project_activation',
    'HQ10D promotes a reviewed civic proposal into a bounded local public-work project'
  ));

  return { nodes, edges };
}

function buildCanonicalAtlasGraph(state) {
  const sections = [
    buildCanonicalHqNodes(state),
    buildCanonicalConstraintNodes(state),
    buildCanonicalBuildingNodes(state),
    buildCanonicalProductionNodes(state),
    buildCanonicalScoutReportNodes(state),
    buildCanonicalSettlementClaimNodes(state),
    buildCanonicalDoctrineNodes(state),
    buildCanonicalWorkOrderNodes(state),
    buildCanonicalWorldGridNodes(state),
    buildCanonicalPermissionPolicyNodes(state),
    buildCanonicalRewardNodes(state),
    buildCanonicalApprovalNodes(state)
  ];
  const nodeMap = new Map();
  const edges = [];
  for (const section of sections) {
    for (const node of section.nodes || []) {
      if (!node?.nodeId || nodeMap.has(node.nodeId)) continue;
      nodeMap.set(node.nodeId, node);
    }
    for (const edge of section.edges || []) edges.push(edge);
  }
  const canonicalNodes = Array.from(nodeMap.values())
    .sort((a, b) => Number(a.ui?.sort || 0) - Number(b.ui?.sort || 0) || a.nodeId.localeCompare(b.nodeId));
  const seenEdges = new Set();
  const canonicalEdges = edges
    .filter((edge) => edge?.from && edge?.to && nodeMap.has(edge.from) && nodeMap.has(edge.to))
    .filter((edge) => {
      const key = edge.edgeId || `${edge.from}->${edge.to}:${edge.kind}`;
      if (seenEdges.has(key)) return false;
      seenEdges.add(key);
      return true;
    });
  const availabilityByNode = {};
  const actionRefsByNode = {};
  const receiptRefs = {};
  for (const node of canonicalNodes) {
    availabilityByNode[node.nodeId] = canonicalAvailability(node);
    receiptRefs[node.nodeId] = [];
    if (node.actionRef) actionRefsByNode[node.nodeId] = node.actionRef;
  }
  for (const edge of canonicalEdges) {
    if (edge.kind !== 'records_receipt' || !receiptRefs[edge.from]) continue;
    receiptRefs[edge.from].push(edge.to);
  }
  return {
    canonicalNodes,
    canonicalEdges,
    availabilityByNode,
    actionRefsByNode,
    receiptRefs
  };
}

function buildHq10Horizon(state) {
  const currentHqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const cap = implementedHqCap();
  const futureMilestoneDefs = HQ10_HORIZON_MILESTONES.filter((milestone) => Number(milestone.level || 0) > cap);
  const milestones = futureMilestoneDefs.map((milestone) => {
    const nodeId = futureHqNodeId(milestone);
    const previousLevel = Number(milestone.level || 0) - 1;
    const previousMilestone = futureMilestoneDefs.find((item) => item.level === previousLevel);
    return {
      nodeId,
      hqLevel: milestone.level,
      title: milestone.title,
      system: milestone.system,
      status: 'locked',
      gameplayTruth: 'future_placeholder',
      currentImplementedHqCap: cap,
      summary: milestone.summary,
      possibilities: [...milestone.possibilities],
      blocker: `Canonical gameplay currently stops at HQ${cap}.`,
      nextImplementableSlice: milestone.nextImplementableSlice,
      riskLevel: milestone.riskLevel,
      icon: hqIcon(milestone.level),
      previousNodeId: previousMilestone ? futureHqNodeId(previousMilestone) : `hq.level.${cap}`
    };
  });
  return {
    version: 'progression_atlas_hq10_horizon_v1',
    targetHqLevel: 10,
    currentHqLevel,
    currentImplementedHqCap: cap,
    gameplayTruthBoundary: `HQ1-HQ${cap} are current Founders Plot engine truth; HQ${cap + 1}-HQ10 are advisory horizon nodes.`,
    gameplayMutationPolicy: 'advisory_only',
    recommendedTemplateKey: 'hq10-horizon',
    currentBridge: {
      nodeId: `hq.level.${cap}`,
      title: `Current playable cap: HQ${cap}`,
      status: currentHqLevel >= cap ? 'done' : 'locked',
      gameplayTruth: 'implemented',
      nextAction: currentHqLevel >= cap ? `Plan the HQ${cap + 1} model` : `Reach HQ${cap} through current gameplay first`
    },
    milestones,
    edges: milestones.map((milestone, index) => ({
      from: index === 0 ? `hq.level.${cap}` : milestones[index - 1].nodeId,
      to: milestone.nodeId,
      kind: 'future_horizon_sequence'
    })),
    possibleUntilHq10: milestones.map((milestone) => ({
      hqLevel: milestone.hqLevel,
      title: milestone.title,
      system: milestone.system,
      possibilities: milestone.possibilities,
      nextImplementableSlice: milestone.nextImplementableSlice
    })),
    guardrails: [
      `Do not add HQ${cap + 1}-HQ10 as real upgrade rules until the engine owns their state.`,
      'Do not let generated visuals redefine costs, unlocks, resources, permissions, or receipts.',
      'Keep Atlas plans advisory until a human promotes a future milestone into canonical gameplay work.'
    ]
  };
}

function summarizeAtlas(state, steps) {
  const firstOpen = steps.find((step) => step.status !== 'done') || steps[steps.length - 1] || null;
  const sitePlans = normalizeSitePlans(state?.plot?.sitePlans || state?.sitePlans);
  const claims = normalizeSettlementClaims(state?.settlementClaims || []);
  const doctrineState = normalizeDoctrineState(state?.plot?.doctrineState || state?.doctrineState);
  const workOrders = normalizeWorkOrders(state?.workOrders || []);
  const civicProposals = normalizeCivicProposals(state?.civicProposals?.proposals || state?.civicProposals || []);
  const overlayPacks = normalizeOverlayPacks(state?.overlayPacks?.packs || state?.overlayPacks || []);
  const civicProjects = normalizeCivicProjects(state?.civicProjects?.projects || state?.civicProjects || []);
  const worldGrid = state?.worldGrid && typeof state.worldGrid === 'object' ? state.worldGrid : {};
  const hqLevel = Number(state?.plot?.hqLevel || 1);
  return {
    hqLevel,
    townXp: Number(state?.plot?.townXp || 0),
    inventory: normalizeInventory(state?.plot?.inventory),
    scoutReportCount: normalizeScoutReports(state?.plot?.scoutReports || state?.scoutReports).length,
    sitePlanCount: sitePlans.length,
    reviewedSitePlanCount: sitePlans
      .filter((plan) => plan.reviewStatus === 'reviewed' || ['reviewed_claim_ready', 'convoy_preparing', 'claimed'].includes(plan.promotionStatus)).length,
    claimReadySitePlanCount: sitePlans
      .filter((plan) => plan.reviewStatus === 'reviewed' || ['reviewed_claim_ready', 'convoy_preparing', 'claimed'].includes(plan.promotionStatus)).length,
    settlementClaimCount: claims.length,
    activeConvoyCount: claims.filter((claim) => claim.status === 'CONVOY_PREPARING').length,
    outpostCount: claims.filter((claim) => claim.status === 'FOUNDED' && claim.foundedPlotId).length,
    selectedDoctrineId: doctrineState.selectedDoctrineId,
    doctrineAdvisoryOnly: false,
    doctrineEngineOwnedEffect: !!doctrineState.selectedDoctrineId,
    workOrderDraftCount: workOrders.filter((order) => order.status === 'DRAFT').length,
    workOrderExecutionAvailable: workOrders.some((order) => (
      order.status === 'DRAFT'
      && order.templateId === 'collect_ready_outputs_once'
      && hqLevel >= 6
      && claims.some((claim) => claim.status === 'FOUNDED' && claim.foundedPlotId)
      && doctrineState.selectedDoctrineId === 'survey_discipline'
    )),
    worldGridStatus: worldGrid.status || 'LOCKED',
    worldGridReady: worldGrid?.civicReadiness?.ready === true,
    worldGridKnownPlotCount: Number(worldGrid?.scope?.knownPlotCount || 0),
    worldGridOutpostCount: Number(worldGrid?.scope?.outpostCount || 0),
    worldGridProjectionHash: worldGrid.projectionHash || null,
    civicProposalCount: civicProposals.length,
    civicProposalDraftCount: civicProposals.filter((proposal) => proposal.status === 'DRAFT').length,
    civicProposalReviewedCount: civicProposals.filter((proposal) => proposal.status === 'REVIEWED').length,
    overlayPackCount: overlayPacks.length,
    overlayPackDraftCount: overlayPacks.filter((pack) => pack.status === 'DRAFT').length,
    overlayPackReviewedCount: overlayPacks.filter((pack) => pack.status === 'REVIEWED').length,
    civicProjectCount: civicProjects.length,
    civicProjectActiveCount: civicProjects.filter((project) => project.status === 'ACTIVE').length,
    civicBeaconActive: civicProjects.some((project) => project.status === 'ACTIVE' && project.projectType === 'civic_beacon'),
    currentPlotId: state?.plot?.plotId || null,
    homePlotId: state?.homePlotId || null,
    quest: clone(state?.quest || null),
    currentStepId: firstOpen?.stepId || null,
    currentStepTitle: firstOpen?.title || null,
    currentBlocker: firstOpen?.blocker || null,
    currentNextAction: firstOpen?.nextAction || null
  };
}

function stepsForStrategyKey(state, strategyKey) {
  switch (strategyKey) {
    case 'balanced-food-wood':
      return buildBalancedFoodWoodSteps(state);
    case 'delegate-outputs-first':
      return buildDelegateOutputsFirstSteps(state);
    case 'hq10-horizon':
      return buildHq10HorizonSteps(state);
    case 'rush-hq3':
    default:
      return buildRushHq3Steps(state);
  }
}

function aggregateMissingRequirements(steps) {
  const totals = {};
  for (const step of Array.isArray(steps) ? steps : []) {
    for (const item of Array.isArray(step.requirements?.items) ? step.requirements.items : []) {
      const missing = Math.max(0, Math.floor(Number(item.missing || 0)));
      if (missing <= 0) continue;
      const key = String(item.resource || item.kind || 'unknown');
      totals[key] = Math.max(Number(totals[key] || 0), missing);
    }
  }
  return totals;
}

function uniqueStrings(items, limit = 4) {
  const seen = new Set();
  const out = [];
  for (const item of Array.isArray(items) ? items : []) {
    const text = String(item || '').trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

function compareForStrategy(template, steps) {
  const blockers = uniqueStrings(steps.map((step) => step.blocker).filter(Boolean));
  const approvalActions = steps.filter((step) => step.actionRef?.tool).length;
  const permissionCheckpoints = steps
    .filter((step) => step.target?.kind === 'permission')
    .map((step) => step.target.key);
  const futureMilestones = steps
    .filter((step) => step.stepKind === 'future_placeholder' || step.target?.kind === 'future_hq_level')
    .map((step) => ({
      stepId: step.stepId,
      title: step.title,
      level: step.target?.level || null,
      system: step.futureSystem || step.target?.system || null
    }));
  return {
    goal: template.goal,
    stepCount: steps.length,
    focus: [...template.focus],
    roughBlockers: blockers.length ? blockers : ['No current blocker from the read model.'],
    resourceShortfalls: aggregateMissingRequirements(steps),
    permissions: permissionCheckpoints,
    futureMilestones,
    tradeoff: template.tradeoff,
    approvalDelegationBurden: template.approvalDelegationBurden,
    burden: {
      playerActionRefs: approvalActions,
      delegationMilestones: permissionCheckpoints,
      futureMilestones: futureMilestones.length
    }
  };
}

function normalizeStrategyMetadata(raw = {}, fallback = {}) {
  const revision = Math.max(1, Math.floor(Number(raw.revision || fallback.revision || 1)));
  return {
    createdBy: firstAllowed(raw.createdBy, STRATEGY_CREATED_BY, fallback.createdBy || 'human'),
    source: firstAllowed(raw.source, STRATEGY_SOURCES, fallback.source || 'editor'),
    parentStrategyId: nullableString(raw.parentStrategyId ?? fallback.parentStrategyId, 140),
    revision,
    sharePolicy: firstAllowed(raw.sharePolicy, PRIVACY_LEVELS, fallback.sharePolicy || 'private')
  };
}

function strategyContentHash(strategy) {
  return stableHash({
    strategyKey: strategy.strategyKey,
    title: strategy.title,
    goal: strategy.goal,
    summary: strategy.summary,
    focus: strategy.focus,
    compare: strategy.compare,
    steps: strategy.steps,
    graph: strategy.graph,
    createdBy: strategy.createdBy,
    source: strategy.source,
    parentStrategyId: strategy.parentStrategyId,
    revision: strategy.revision,
    sharePolicy: strategy.sharePolicy,
    gameplayMutationPolicy: strategy.gameplayMutationPolicy
  });
}

function buildProgressionStrategy(state, stateHash, strategyKey = DEFAULT_STRATEGY_KEY, { title = null } = {}) {
  const template = strategyTemplateForKey(strategyKey) || STRATEGY_TEMPLATES[DEFAULT_STRATEGY_KEY];
  const steps = stepsForStrategyKey(state, template.strategyKey)
    .map((step) => addStepContract(step, {
      stepKind: step.stepKind || 'canonical_node',
      canonicalNodeId: step.stepKind === 'future_placeholder' ? null : (step.canonicalNodeId || step.stepId),
      futureSystem: step.futureSystem || null
    }));
  const graph = buildGraph(state, steps);
  const strategyId = `strategy_${hashId([state?.plot?.plotId, template.strategyKey])}`;
  const gameplayStableHash = gameplayStableHashForState(state);
  const strategy = {
    strategyId,
    strategyKey: template.strategyKey,
    title: String(title || template.title).trim().slice(0, 80) || template.title,
    visibility: 'private',
    generatedBy: 'progression_atlas_v1',
    ...normalizeStrategyMetadata({}, {
      createdBy: 'clover',
      source: 'template',
      parentStrategyId: null,
      revision: 1,
      sharePolicy: 'private'
    }),
    baseGraphVersion: ATLAS_VERSION,
    baseStateHash: String(stateHash || state?.audit?.stateHash || ''),
    baseGameplayStableHash: gameplayStableHash,
    goal: template.goal,
    summary: template.summary,
    focus: [...template.focus],
    compare: compareForStrategy(template, steps),
    steps,
    graph,
    openClawLiteTools: [
      'agent_town_progression_get_state',
      'agent_town_progression_draft_strategy',
      'agent_town_progression_save_strategy',
      'agent_town_progression_select_strategy',
      'agent_town_progression_explain_node'
    ],
    gameplayMutationPolicy: 'advisory_only',
    createdAt: null,
    updatedAt: null
  };
  strategy.contentHash = strategyContentHash(strategy);
  return strategy;
}

function buildRushHq3Strategy(state, stateHash, options = {}) {
  return buildProgressionStrategy(state, stateHash, DEFAULT_STRATEGY_KEY, options);
}

function listStrategyTemplates() {
  return STRATEGY_TEMPLATE_KEYS.map((key) => clone(STRATEGY_TEMPLATES[key]));
}

function symbolFromText(value) {
  const words = cleanText(value, 'S', 80)
    .split(/[^A-Za-z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const symbol = words.length > 1
    ? words.slice(0, 2).map((word) => word[0]).join('')
    : (words[0] || 'S').slice(0, 2);
  return symbol.toUpperCase();
}

function makeEditorIconDraft({ title, prompt, nowMs }) {
  const safeTitle = cleanText(title, 'Custom strategy step', 80);
  const safePrompt = cleanText(prompt, `${safeTitle}, Agent Town strategy icon`, 300);
  const slug = slugFor(safeTitle, 'custom_step');
  return makeIcon({
    iconId: `strategy.custom.${slug}.${hashId([safeTitle, safePrompt]).slice(0, 8)}`,
    label: safeTitle,
    symbol: symbolFromText(safeTitle),
    tone: 'custom',
    source: 'progression_atlas_strategy_editor',
    assetPath: null
  });
}

function normalizeEditorIcon(rawIcon, { title, prompt, nowMs }) {
  const base = rawIcon && typeof rawIcon === 'object' ? rawIcon : {};
  const draft = makeEditorIconDraft({ title, prompt: base.prompt || prompt, nowMs });
  const label = cleanText(base.label, draft.label, 80);
  const icon = {
    ...draft,
    iconId: cleanText(base.iconId, draft.iconId, 100).replace(/[^a-zA-Z0-9._:-]/g, '_'),
    label,
    symbol: cleanText(base.symbol, draft.symbol, 4).toUpperCase(),
    tone: cleanText(base.tone, draft.tone, 24).replace(/[^a-zA-Z0-9_-]/g, '') || 'custom',
    source: 'progression_atlas_strategy_editor',
    assetPath: null,
    generatedBy: 'progression_atlas_genai_icon_prompt_v1',
    generatedAdHoc: true,
    global: false,
    generationMode: 'prompt_artifact',
    prompt: cleanText(base.prompt, prompt || `${label}, Agent Town strategy icon`, 300),
    genAi: {
      status: 'draft_prompt_attached',
      modelHint: 'openclaw-visible-genai',
      prompt: cleanText(base.prompt, prompt || `${label}, Agent Town strategy icon`, 300),
      createdAt: Number(nowMs || Date.now())
    }
  };
  return icon;
}

function normalizeConnection(value, knownIds) {
  const id = cleanText(value, '', 100);
  return id && knownIds.has(id) ? id : null;
}

function normalizeActionRef(value) {
  if (!value || typeof value !== 'object') return null;
  const tool = cleanText(value.tool, '', 80);
  if (!tool.startsWith('et.plot.')) return null;
  return {
    tool,
    params: value.params && typeof value.params === 'object' && !Array.isArray(value.params)
      ? stableValue(value.params)
      : {},
    executable: false
  };
}

function normalizeResourceGateActionRef(value) {
  const action = normalizeActionRef(value);
  if (!action) return null;
  const raw = value && typeof value === 'object' ? value : {};
  return {
    ...action,
    http: raw.http && typeof raw.http === 'object' ? stableValue(raw.http) : null,
    paramsTemplate: raw.paramsTemplate && typeof raw.paramsTemplate === 'object' ? stableValue(raw.paramsTemplate) : undefined,
    required: Array.isArray(raw.required) ? normalizeStringArray(raw.required, [], 12, 80) : undefined,
    requiresIdempotencyKey: raw.requiresIdempotencyKey === true,
    authority: cleanText(raw.authority, 'et.plot.*', 80),
    executableByAtlas: false
  };
}

function resourceGateKind({ stepKind, requirements, estimatedCost, actionRef }) {
  if (estimatedCost || hasResourceRequirement(requirements)) return 'resource_spending_gate';
  if (actionRef?.tool) return 'action_gate';
  if (stepKind === 'future_placeholder') return 'future_advisory_gate';
  return 'unlock_gate';
}

function normalizeResourceGate(value, {
  step = {},
  stepKind = 'canonical_node',
  canonicalNodeId = null,
  requirements = null,
  estimatedCost = null,
  targetRef = null,
  actionRef = null
} = {}) {
  const raw = typeof value === 'string'
    ? { canonicalNodeId: value }
    : value && typeof value === 'object'
      ? value
      : {};
  const rawCanonicalNodeId = nullableString(raw.canonicalNodeId || raw.nodeId, 120);
  const gateCanonicalNodeId = rawCanonicalNodeId || canonicalNodeId || null;
  const rawGateId = nullableString(raw.gateId, 140);
  const gateRequirements = normalizePlanningRequirements(raw.requirements || requirements, {
    fallback: requirements,
    advisory: gateCanonicalNodeId ? false : stepKind !== 'canonical_node'
  });
  const gateEstimatedCost = normalizeEstimatedCost(raw.estimatedCost || raw.cost || estimatedCost)
    || estimatedCostFromRequirements(gateRequirements);
  const gateActionRef = normalizeResourceGateActionRef(raw.actionRef || actionRef);
  const gateTargetRef = normalizeTargetRef(raw.targetRef || raw.target, targetRef);
  const hasRequirementItems = Array.isArray(gateRequirements.items) && gateRequirements.items.length > 0;
  if (!hasRequirementItems && !gateEstimatedCost && !gateActionRef) return null;

  const gateId = rawGateId || gateCanonicalNodeId || nullableString(step.nodeId || step.stepId, 140);
  if (!gateId) return null;
  return {
    gateId,
    canonicalNodeId: gateCanonicalNodeId,
    title: cleanText(raw.title || step.title, 'Resource gate', 120),
    kind: firstAllowed(raw.kind, [
      'resource_spending_gate',
      'action_gate',
      'unlock_gate',
      'future_advisory_gate'
    ], resourceGateKind({ stepKind, requirements: gateRequirements, estimatedCost: gateEstimatedCost, actionRef: gateActionRef })),
    requirements: gateRequirements,
    estimatedCost: gateEstimatedCost,
    targetRef: gateTargetRef,
    actionRef: gateActionRef,
    gameplayAuthority: gateCanonicalNodeId ? 'founders_plot_engine' : 'strategy_editor_advisory',
    mutationPolicy: 'advisory_only',
    source: cleanText(raw.source, gateCanonicalNodeId ? 'founders_plot_engine' : 'strategy_editor_gate_draft_v1', 100),
    promotionStatus: firstAllowed(raw.promotionStatus, ['draft', 'canonical', 'needs_model', 'rejected'], gateCanonicalNodeId ? 'canonical' : 'draft'),
    executableByAtlas: false
  };
}

function addStepContract(step, overrides = {}) {
  const stepKind = firstAllowed(overrides.stepKind || step.stepKind, STEP_KINDS, 'canonical_node');
  const canonicalNodeId = stepKind === 'canonical_node'
    ? nullableString(overrides.canonicalNodeId || step.canonicalNodeId || step.nodeId || step.stepId, 120)
    : null;
  const futureSystem = stepKind === 'future_placeholder'
    ? firstAllowed(overrides.futureSystem || step.futureSystem, FUTURE_SYSTEMS, null)
    : null;
  const targetRef = normalizeTargetRef(overrides.targetRef || step.targetRef, targetRefFromTarget(step.target));
  const requirements = normalizePlanningRequirements(step.requirements, {
    fallback: step.requirements,
    advisory: stepKind !== 'canonical_node'
  });
  const estimatedCost = normalizeEstimatedCost(overrides.estimatedCost || step.estimatedCost || step.requirements?.cost)
    || estimatedCostFromRequirements(requirements);
  const actionRef = normalizeActionRef(step.actionRef);
  const resourceGate = normalizeResourceGate(overrides.resourceGate || step.resourceGate || null, {
    step,
    stepKind,
    canonicalNodeId,
    requirements,
    estimatedCost,
    targetRef,
    actionRef: step.actionRef
  });
  return {
    ...step,
    stepKind,
    canonicalNodeId,
    futureSystem,
    targetRef,
    requirements,
    estimatedCost,
    resourceGate,
    expectedBenefit: normalizeStringArray(overrides.expectedBenefit || step.expectedBenefit, [], 8, 180),
    riskLevel: firstAllowed(overrides.riskLevel || step.riskLevel, RISK_LEVELS, stepKind === 'canonical_node' ? 'low' : 'unknown'),
    reversibility: firstAllowed(overrides.reversibility || step.reversibility, REVERSIBILITY_LEVELS, stepKind === 'canonical_node' ? 'safe' : 'unknown'),
    assumptions: normalizeStringArray(overrides.assumptions || step.assumptions, [], 8, 220),
    privacy: firstAllowed(overrides.privacy || step.privacy, PRIVACY_LEVELS, 'private'),
    actionRef
  };
}

function buildCanonicalStepIndex(state) {
  const index = new Map();
  for (const key of STRATEGY_TEMPLATE_KEYS) {
    for (const step of stepsForStrategyKey(state, key)) {
      if (!step?.stepId || index.has(step.stepId)) continue;
      index.set(step.stepId, addStepContract(step, {
        stepKind: step.stepKind || 'canonical_node',
        canonicalNodeId: step.stepKind === 'future_placeholder' ? null : (step.canonicalNodeId || step.stepId),
        futureSystem: step.futureSystem || null
      }));
    }
  }
  const canonicalGraph = buildCanonicalAtlasGraph(state);
  for (const node of canonicalGraph.canonicalNodes || []) {
    if (!node?.nodeId || index.has(node.nodeId)) continue;
    index.set(node.nodeId, addStepContract({
      stepId: node.nodeId,
      nodeId: node.nodeId,
      title: node.title,
      status: node.status,
      reason: node.metadata?.body || node.title,
      icon: node.icon,
      target: node.target,
      requirements: node.requirements,
      blocker: node.blocker,
      nextAction: node.nextAction,
      actionRef: node.actionRef
    }, { stepKind: 'canonical_node', canonicalNodeId: node.nodeId }));
  }
  return index;
}

function inferFutureSystem(raw) {
  const explicit = firstAllowed(raw?.futureSystem || raw?.targetRef?.system || raw?.target?.system, FUTURE_SYSTEMS, null);
  if (explicit) return explicit;
  const haystack = `${raw?.stepId || ''} ${raw?.nodeId || ''} ${raw?.title || ''}`.toLowerCase();
  return FUTURE_SYSTEMS.find((system) => haystack.includes(system)) || null;
}

function resolveEditorStepKind(raw, canonicalSteps) {
  const requestedKind = firstAllowed(raw?.stepKind, STEP_KINDS, null);
  const requestedCanonicalId = nullableString(raw?.canonicalNodeId || raw?.nodeId || raw?.stepId, 120);
  if (requestedCanonicalId && canonicalSteps.has(requestedCanonicalId)) {
    return {
      stepKind: 'canonical_node',
      canonicalNodeId: requestedCanonicalId,
      futureSystem: null,
      requestedCanonicalId
    };
  }
  const futureSystem = inferFutureSystem(raw);
  if (requestedKind === 'future_placeholder' || futureSystem) {
    return {
      stepKind: 'future_placeholder',
      canonicalNodeId: null,
      futureSystem,
      requestedCanonicalId
    };
  }
  return {
    stepKind: 'custom_note',
    canonicalNodeId: null,
    futureSystem: null,
    requestedCanonicalId: requestedKind === 'canonical_node' ? requestedCanonicalId : null
  };
}

function resolveEditorResourceGate(rawGate, canonicalSteps) {
  const raw = typeof rawGate === 'string'
    ? { canonicalNodeId: rawGate }
    : rawGate && typeof rawGate === 'object'
      ? rawGate
      : {};
  const candidates = [
    raw.canonicalNodeId,
    raw.nodeId,
    raw.gateId,
    String(raw.gateId || '').replace(/^gate[:.]/, '')
  ];
  for (const candidate of candidates) {
    const key = nullableString(candidate, 140);
    if (key && canonicalSteps.has(key)) return canonicalSteps.get(key);
  }
  return null;
}

function resourceGateInputFromCanonical(rawGate, gateStep) {
  if (!gateStep) return rawGate || null;
  const raw = rawGate && typeof rawGate === 'object' ? rawGate : {};
  const canonicalNodeId = gateStep.canonicalNodeId || gateStep.nodeId || gateStep.stepId;
  return {
    ...raw,
    gateId: raw.gateId || canonicalNodeId,
    canonicalNodeId,
    title: raw.title || gateStep.title,
    requirements: raw.requirements || gateStep.requirements,
    estimatedCost: raw.estimatedCost || raw.cost || gateStep.estimatedCost,
    targetRef: raw.targetRef || gateStep.targetRef,
    actionRef: raw.actionRef || gateStep.actionRef
  };
}

function normalizeCanonicalProposal(value, { stepId, title } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const proposalId = nullableString(value.proposalId || value.id || stepId, 140);
  const parentNodeId = nullableString(value.parentNodeId || value.afterNodeId || value.fromNodeId, 140);
  if (!proposalId && !parentNodeId) return null;
  return {
    proposalId: proposalId || hashId('canonical_proposal', { title, parentNodeId }).slice(0, 24),
    title: cleanText(value.title, title || 'Canonical graph proposal', 100),
    parentNodeId,
    parentTitle: cleanText(value.parentTitle, '', 120) || null,
    proposedNodeId: nullableString(value.proposedNodeId || value.nodeId, 140),
    nodeKind: cleanText(value.nodeKind || value.kind, 'custom', 60).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'custom',
    summary: cleanText(value.summary || value.reason, '', 240) || null,
    source: cleanText(value.source, 'strategy_editor_canonical_proposal_v1', 100),
    promotionStatus: firstAllowed(value.promotionStatus, ['draft', 'needs_model', 'canonical', 'rejected'], 'draft'),
    authorityBoundary: cleanText(value.authorityBoundary, 'requires_engine_promotion', 120)
  };
}

function normalizeEditorSteps(rawSteps, nowMs, { canonicalSteps = new Map() } = {}) {
  const inputSteps = Array.isArray(rawSteps) ? rawSteps.slice(0, 24) : [];
  if (!inputSteps.length) return [];
  const used = new Set();
  const firstPass = inputSteps.map((raw, index) => {
    const title = cleanText(raw?.title, `Strategy Step ${index + 1}`, 80);
    const resolved = resolveEditorStepKind(raw, canonicalSteps);
    const baseId = cleanText(raw?.stepId || raw?.nodeId || resolved.canonicalNodeId, '', 100)
      .replace(/[^a-zA-Z0-9._:-]/g, '_') || `editor.${slugFor(title, 'step')}`;
    let stepId = baseId;
    let suffix = 2;
    while (used.has(stepId)) {
      stepId = `${baseId}.${suffix}`;
      suffix += 1;
    }
    used.add(stepId);
    return { raw, title, stepId, resolved };
  });
  const knownIds = new Set(firstPass.map((entry) => entry.stepId));
  return firstPass.map(({ raw, title, stepId, resolved }) => {
    const beforeStepId = normalizeConnection(raw?.beforeStepId || raw?.before, knownIds);
    const afterStepId = normalizeConnection(raw?.afterStepId || raw?.after, knownIds);
    const reason = cleanText(raw?.reason || raw?.note, 'Player-authored progression step.', 400);
    const prompt = cleanText(raw?.iconPrompt || raw?.icon?.prompt, `${title}, Agent Town strategy icon`, 300);
    const canonical = resolved.canonicalNodeId ? canonicalSteps.get(resolved.canonicalNodeId) : null;
    const gateCanonical = resolveEditorResourceGate(raw?.resourceGate, canonicalSteps);
    const fallbackRequirements = canonical?.requirements || null;
    const rawHasRequirements = raw?.requirements && typeof raw.requirements === 'object';
    const requirements = resolved.stepKind === 'canonical_node'
      ? normalizePlanningRequirements(fallbackRequirements, { fallback: fallbackRequirements, advisory: false })
      : gateCanonical && !rawHasRequirements
        ? normalizePlanningRequirements(gateCanonical.requirements, { fallback: gateCanonical.requirements, advisory: true })
        : normalizePlanningRequirements(raw?.requirements, { advisory: true });
    const target = canonical?.target || {
      kind: resolved.stepKind === 'future_placeholder' ? 'future_system_placeholder' : 'custom_strategy_step',
      source: 'progression_atlas_strategy_editor',
      system: resolved.futureSystem
    };
    const normalized = {
      stepId,
      nodeId: stepId,
      title,
      status: cleanText(raw?.status, 'planned', 24).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'planned',
      reason,
      icon: normalizeEditorIcon(raw?.icon, { title, prompt, nowMs }),
      target,
      requirements,
      blocker: cleanText(raw?.blocker, '', 180) || null,
      nextAction: cleanText(raw?.nextAction, title, 120),
      actionRef: normalizeActionRef(raw?.actionRef || canonical?.actionRef),
      connections: { beforeStepId, afterStepId },
      beforeStepId,
      afterStepId,
      requestedCanonicalNodeId: resolved.stepKind === 'canonical_node' ? null : resolved.requestedCanonicalId,
      canonicalProposal: normalizeCanonicalProposal(raw?.canonicalProposal, { stepId, title }),
      editorEditable: true
    };
    return addStepContract(normalized, {
      stepKind: resolved.stepKind,
      canonicalNodeId: resolved.canonicalNodeId,
      futureSystem: resolved.futureSystem,
      targetRef: normalizeTargetRef(raw?.targetRef || raw?.target, targetRefFromTarget(target)),
      estimatedCost: raw?.estimatedCost || raw?.cost || canonical?.estimatedCost || canonical?.requirements?.cost || gateCanonical?.estimatedCost || gateCanonical?.requirements?.cost,
      resourceGate: resourceGateInputFromCanonical(raw?.resourceGate, gateCanonical),
      expectedBenefit: raw?.expectedBenefit || raw?.expectedBenefits || raw?.benefits || canonical?.expectedBenefit,
      riskLevel: raw?.riskLevel || canonical?.riskLevel,
      reversibility: raw?.reversibility || canonical?.reversibility,
      assumptions: raw?.assumptions || canonical?.assumptions,
      privacy: raw?.privacy || canonical?.privacy
    });
  });
}

function buildEditorGraph(steps) {
  const nodes = steps.map((step, index) => ({
    nodeId: step.nodeId,
    title: step.title,
    status: step.status,
    index,
    target: step.target,
    icon: step.icon,
    requirements: step.requirements,
    resourceGate: step.resourceGate,
    canonicalProposal: step.canonicalProposal,
    blocker: step.blocker,
    nextAction: step.nextAction,
    connections: step.connections || {}
  }));
  const edges = [];
  const seen = new Set();
  function addEdge(from, to, kind) {
    if (!from || !to || from === to) return;
    const key = `${from}->${to}:${kind}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ from, to, kind });
  }
  for (const step of steps) {
    addEdge(step.beforeStepId, step.stepId, 'editor_before');
    addEdge(step.stepId, step.afterStepId, 'editor_after');
  }
  if (!edges.length) {
    for (let i = 0; i < steps.length - 1; i += 1) addEdge(steps[i].stepId, steps[i + 1].stepId, 'editor_sequence');
  }
  return { nodes, edges };
}

function buildEditedStrategyFromInput({ state, stateHash, strategyInput, nowMs }) {
  const raw = strategyInput && typeof strategyInput === 'object' ? strategyInput : {};
  const timestamp = Number(nowMs || Date.now());
  const sourceSteps = Array.isArray(raw.steps) && raw.steps.length
    ? raw.steps
    : buildRushHq3Strategy(state, stateHash).steps;
  const canonicalSteps = buildCanonicalStepIndex(state);
  const steps = normalizeEditorSteps(sourceSteps, timestamp, { canonicalSteps });
  if (!steps.length) return null;
  const title = cleanText(raw.title, 'Custom Progression Strategy', 80);
  const goal = cleanText(raw.goal, raw.summary || 'Player-authored Founders Plot strategy.', 220);
  const focus = Array.isArray(raw.focus)
    ? uniqueStrings(raw.focus, 6)
    : ['Player-authored plan', 'Private strategy', 'Advisory only'];
  const graph = buildEditorGraph(steps);
  const strategyHash = stableHash({ title, goal, focus, steps, graph });
  const strategyKey = normalizeStrategyKey(raw.strategyKey || `custom-${slugFor(title, 'strategy')}`);
  const strategy = {
    strategyId: `strategy_custom_${hashId([state?.plot?.plotId, strategyHash])}`,
    strategyKey: strategyKey.startsWith('custom-') ? strategyKey : `custom-${strategyKey}`,
    title,
    visibility: 'private',
    generatedBy: 'progression_atlas_strategy_editor_v1',
    ...normalizeStrategyMetadata(raw, {
      createdBy: 'human',
      source: 'editor',
      parentStrategyId: null,
      revision: 1,
      sharePolicy: 'private'
    }),
    baseGraphVersion: ATLAS_VERSION,
    baseStateHash: String(stateHash || state?.audit?.stateHash || ''),
    baseGameplayStableHash: gameplayStableHashForState(state),
    goal,
    summary: cleanText(raw.summary, goal, 240),
    focus,
    compare: {
      goal,
      stepCount: steps.length,
      focus,
      roughBlockers: uniqueStrings(steps.map((step) => step.blocker).filter(Boolean), 4),
      resourceShortfalls: {},
      permissions: uniqueStrings(steps.map((step) => step.target?.key).filter(Boolean), 4),
      tradeoff: 'Custom editor plan. It can guide play, but canonical gameplay still requires normal Founders Plot tools and approvals.',
      approvalDelegationBurden: 'User-authored: review every linked action before execution.',
      burden: {
        playerActionRefs: steps.filter((step) => step.actionRef?.tool).length,
        delegationMilestones: []
      }
    },
    steps,
    graph,
    editor: {
      version: 'progression_atlas_strategy_editor_v1',
      connectionModel: 'before_after_step_ids',
      iconModel: 'prompt_backed_genai_draft'
    },
    openClawLiteTools: [
      'agent_town_progression_get_state',
      'agent_town_progression_save_strategy',
      'agent_town_progression_generate_icon_draft',
      'agent_town_progression_save_edited_strategy',
      'agent_town_progression_select_strategy'
    ],
    gameplayMutationPolicy: 'advisory_only',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  strategy.contentHash = strategyContentHash(strategy);
  return strategy;
}

function getStateEnvelope({ pairId, houseId = null, plotId = null, nowMs }) {
  const envelope = engine.getFoundersPlotState({
    pairId,
    houseId,
    plotId,
    nowMs,
    includeReplay: false,
    includePublicSummary: true
  });
  if (!envelope || envelope.ok === false) return envelope;
  return envelope;
}

function strategyFromRecord(record) {
  if (!record?.strategy) return null;
  return {
    ...clone(record.strategy),
    selected: record.selected === true,
    savedAt: record.updatedAt,
    createdAt: record.strategy.createdAt || record.createdAt,
    updatedAt: record.strategy.updatedAt || record.updatedAt
  };
}

function buildAtlasEnvelope({ stateEnvelope, nowMs }) {
  const state = stateEnvelope.state;
  const stateHash = stateEnvelope.stateHash || state?.audit?.stateHash || '';
  const gameplaySnapshot = buildGameplaySnapshot(state);
  const gameplayStableHash = stableHash(gameplaySnapshot);
  const draft = buildRushHq3Strategy(state, stateHash);
  const strategyOptions = STRATEGY_TEMPLATE_KEYS.map((key) => buildProgressionStrategy(state, stateHash, key));
  const records = store.listProgressionStrategies(state.plot.plotId);
  const strategies = records.map(strategyFromRecord).filter(Boolean);
  const selectedStrategy = strategies.find((strategy) => strategy.selected) || null;
  const summary = summarizeAtlas(state, draft.steps);
  const canonicalGraph = buildCanonicalAtlasGraph(state);
  const futureHorizon = buildHq10Horizon(state);
  return successEnvelope({
    plotId: state.plot.plotId,
    stateHash,
    gameplayStableHash,
    gameplaySnapshot,
    generatedAt: Number(nowMs || Date.now()),
    atlas: {
      graphVersion: ATLAS_VERSION,
      gameplayStableHash,
      iconCatalog: getAgentTownIconCatalog(),
      summary,
      canonicalNodes: canonicalGraph.canonicalNodes,
      canonicalEdges: canonicalGraph.canonicalEdges,
      availabilityByNode: canonicalGraph.availabilityByNode,
      actionRefsByNode: canonicalGraph.actionRefsByNode,
      receiptRefs: canonicalGraph.receiptRefs,
      futureHorizon,
      nodes: draft.graph.nodes,
      edges: draft.graph.edges,
      strategyTemplates: listStrategyTemplates(),
      strategyOptions,
      recommendedStrategy: draft,
      strategies,
      selectedStrategyId: selectedStrategy?.strategyId || null,
      openClawLiteSurface: {
        uiIntent: 'agent_town_ui_open_progression_atlas',
        read: 'agent_town_progression_get_state',
        draft: 'agent_town_progression_draft_strategy',
        save: 'agent_town_progression_save_strategy',
        select: 'agent_town_progression_select_strategy',
        explain: 'agent_town_progression_explain_node',
        editor: 'progression_atlas_iframe_editor',
        iconDraft: '/api/founders-plot/progression-atlas/icons/generate',
        generateIconDraft: 'agent_town_progression_generate_icon_draft',
        saveEditedStrategy: 'agent_town_progression_save_edited_strategy'
      }
    }
  });
}

function getProgressionAtlasState({ pairId, houseId = null, plotId = null, nowMs }) {
  const stateEnvelope = getStateEnvelope({ pairId, houseId, plotId, nowMs });
  if (!stateEnvelope || stateEnvelope.ok === false) return stateEnvelope;
  return buildAtlasEnvelope({ stateEnvelope, nowMs });
}

function draftProgressionStrategy({ pairId, houseId = null, plotId = null, strategyKey = DEFAULT_STRATEGY_KEY, title = null, nowMs }) {
  const key = normalizeStrategyKey(strategyKey);
  const template = strategyTemplateForKey(key);
  if (!template) {
    return errorEnvelope('INVALID_REQUEST', `Unknown Progression Atlas strategy template: ${key || 'empty'}.`);
  }
  const stateEnvelope = getStateEnvelope({ pairId, houseId, plotId, nowMs });
  if (!stateEnvelope || stateEnvelope.ok === false) return stateEnvelope;
  const strategy = buildProgressionStrategy(stateEnvelope.state, stateEnvelope.stateHash, template.strategyKey, { title });
  strategy.createdAt = Number(nowMs || Date.now());
  strategy.updatedAt = strategy.createdAt;
  return successEnvelope({
    plotId: stateEnvelope.state.plot.plotId,
    stateHash: stateEnvelope.stateHash,
    gameplayStableHash: gameplayStableHashForState(stateEnvelope.state),
    strategy
  });
}

function saveProgressionStrategy({
  pairId,
  houseId = null,
  plotId = null,
  strategyKey = DEFAULT_STRATEGY_KEY,
  title = null,
  select = false,
  nowMs
}) {
  const drafted = draftProgressionStrategy({ pairId, houseId, plotId, strategyKey, title, nowMs });
  if (!drafted || drafted.ok === false) return drafted;
  const timestamp = Number(nowMs || Date.now());
  const strategy = {
    ...drafted.strategy,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const saved = store.writeProgressionStrategy({
    strategyId: strategy.strategyId,
    plotId: drafted.plotId,
    strategyKey: strategy.strategyKey,
    title: strategy.title,
    selected: !!select,
    strategy,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  let selected = saved;
  if (select) {
    selected = store.selectProgressionStrategy(drafted.plotId, strategy.strategyId, timestamp);
  }
  const latest = store.listProgressionStrategies(drafted.plotId).map(strategyFromRecord).filter(Boolean);
  return successEnvelope({
    plotId: drafted.plotId,
    stateHash: drafted.stateHash,
    gameplayStableHash: drafted.gameplayStableHash,
    strategy: strategyFromRecord(selected) || strategy,
    strategies: latest,
    selectedStrategyId: select ? strategy.strategyId : (latest.find((entry) => entry.selected)?.strategyId || null)
  });
}

function saveEditedProgressionStrategy({
  pairId,
  houseId = null,
  plotId = null,
  strategy = null,
  select = false,
  nowMs
}) {
  const stateEnvelope = getStateEnvelope({ pairId, houseId, plotId, nowMs });
  if (!stateEnvelope || stateEnvelope.ok === false) return stateEnvelope;
  const edited = buildEditedStrategyFromInput({
    state: stateEnvelope.state,
    stateHash: stateEnvelope.stateHash,
    strategyInput: strategy,
    nowMs
  });
  if (!edited) return errorEnvelope('INVALID_REQUEST', 'At least one strategy step is required.');
  const timestamp = Number(nowMs || Date.now());
  const saved = store.writeProgressionStrategy({
    strategyId: edited.strategyId,
    plotId: stateEnvelope.state.plot.plotId,
    strategyKey: edited.strategyKey,
    title: edited.title,
    selected: !!select,
    strategy: edited,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  let selected = saved;
  if (select) {
    selected = store.selectProgressionStrategy(stateEnvelope.state.plot.plotId, edited.strategyId, timestamp);
  }
  const latest = store.listProgressionStrategies(stateEnvelope.state.plot.plotId).map(strategyFromRecord).filter(Boolean);
  return successEnvelope({
    plotId: stateEnvelope.state.plot.plotId,
    stateHash: stateEnvelope.stateHash,
    gameplayStableHash: gameplayStableHashForState(stateEnvelope.state),
    strategy: strategyFromRecord(selected) || edited,
    strategies: latest,
    selectedStrategyId: select ? edited.strategyId : (latest.find((entry) => entry.selected)?.strategyId || null)
  });
}

function generateProgressionIconDraft({
  pairId,
  houseId = null,
  plotId = null,
  title = null,
  prompt = null,
  nowMs
}) {
  const stateEnvelope = getStateEnvelope({ pairId, houseId, plotId, nowMs });
  if (!stateEnvelope || stateEnvelope.ok === false) return stateEnvelope;
  const safeTitle = cleanText(title, 'Custom strategy step', 80);
  const icon = normalizeEditorIcon(null, {
    title: safeTitle,
    prompt: cleanText(prompt, `${safeTitle}, Agent Town strategy icon`, 300),
    nowMs
  });
  return successEnvelope({
    plotId: stateEnvelope.state.plot.plotId,
    stateHash: stateEnvelope.stateHash,
    gameplayStableHash: gameplayStableHashForState(stateEnvelope.state),
    icon
  });
}

function selectProgressionStrategy({ pairId, houseId = null, plotId = null, strategyId, nowMs }) {
  const stateEnvelope = getStateEnvelope({ pairId, houseId, plotId, nowMs });
  if (!stateEnvelope || stateEnvelope.ok === false) return stateEnvelope;
  const safeStrategyId = String(strategyId || '').trim();
  if (!safeStrategyId) return errorEnvelope('INVALID_REQUEST', 'strategyId is required.');
  const existing = store.getProgressionStrategy(safeStrategyId);
  if (!existing || existing.plotId !== stateEnvelope.state.plot.plotId) {
    return errorEnvelope('INVALID_STATE', 'Strategy not found for this plot.');
  }
  const selected = store.selectProgressionStrategy(stateEnvelope.state.plot.plotId, safeStrategyId, Number(nowMs || Date.now()));
  const strategies = store.listProgressionStrategies(stateEnvelope.state.plot.plotId).map(strategyFromRecord).filter(Boolean);
  return successEnvelope({
    plotId: stateEnvelope.state.plot.plotId,
    gameplayStableHash: gameplayStableHashForState(stateEnvelope.state),
    strategy: strategyFromRecord(selected),
    strategies,
    selectedStrategyId: safeStrategyId
  });
}

function explainProgressionNode({ pairId, houseId = null, plotId = null, nodeId, nowMs }) {
  const stateEnvelope = getStateEnvelope({ pairId, houseId, plotId, nowMs });
  if (!stateEnvelope || stateEnvelope.ok === false) return stateEnvelope;
  const strategies = STRATEGY_TEMPLATE_KEYS.map((key) => buildProgressionStrategy(stateEnvelope.state, stateEnvelope.stateHash, key));
  const safeNodeId = String(nodeId || '').trim();
  const strategyStep = strategies
    .flatMap((strategy) => strategy.steps)
    .find((entry) => entry.nodeId === safeNodeId || entry.stepId === safeNodeId);
  const canonicalNode = strategyStep ? null : buildCanonicalAtlasGraph(stateEnvelope.state).canonicalNodes
    .find((entry) => entry.nodeId === safeNodeId);
  const step = strategyStep || (canonicalNode ? {
    stepId: canonicalNode.nodeId,
    nodeId: canonicalNode.nodeId,
    title: canonicalNode.title,
    status: canonicalNode.status,
    reason: canonicalNode.metadata?.body || `${canonicalNode.title} is part of the canonical Founders Plot graph.`,
    requirements: canonicalNode.requirements,
    blocker: canonicalNode.blocker,
    nextAction: canonicalNode.nextAction,
    icon: canonicalNode.icon,
    target: canonicalNode.target,
    actionRef: canonicalNode.actionRef
  } : null);
  if (!step) return errorEnvelope('INVALID_REQUEST', 'Unknown progression node.');
  const missing = Object.entries(step.requirements?.missing || {})
    .map(([key, amount]) => `${key} ${amount}`)
    .join(', ');
  const explanation = [
    `${step.title}: ${step.reason}`,
    step.status === 'done' ? 'Status: complete.' : `Status: ${step.status}.`,
    step.blocker ? `Blocker: ${step.blocker}` : null,
    missing ? `Missing: ${missing}.` : null,
    `Next action: ${step.nextAction}.`
  ].filter(Boolean).join(' ');
  return successEnvelope({
    plotId: stateEnvelope.state.plot.plotId,
    gameplayStableHash: gameplayStableHashForState(stateEnvelope.state),
    nodeId: step.nodeId,
    step,
    explanation
  });
}

module.exports = {
  ATLAS_VERSION,
  DEFAULT_STRATEGY_KEY,
  STRATEGY_TEMPLATE_KEYS,
  buildGameplaySnapshot,
  gameplayStableHashForState,
  getProgressionAtlasState,
  draftProgressionStrategy,
  saveProgressionStrategy,
  saveEditedProgressionStrategy,
  generateProgressionIconDraft,
  selectProgressionStrategy,
  explainProgressionNode
};
