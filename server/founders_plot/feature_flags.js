const FUTURE_FEATURES = [
  {
    key: 'FEATURE_FOUNDERS_V16_SCENARIOS',
    label: 'V1.6 Civic Projects and Short Scenarios',
    shortName: 'v16',
    tools: [
      'et.plot.scenarios.get_state',
      'et.plot.scenarios.start',
      'et.plot.scenarios.contribute'
    ],
    payloadKeys: ['scenarios'],
    domains: ['civic-scenarios'],
    anchors: ['STATE:scenarios']
  },
  {
    key: 'FEATURE_FOUNDERS_V17_TOWN_IDENTITY',
    label: 'V1.7 Town Identity and Postcards',
    shortName: 'v17',
    tools: ['et.plot.town.set_identity'],
    payloadKeys: ['townPostcards'],
    domains: ['town-identity', 'town-postcards'],
    anchors: ['STATE:town_identity', 'STATE:town_postcard'],
    endpoints: ['plot-card', 'postcard']
  },
  {
    key: 'FEATURE_FOUNDERS_V20_PERSISTENT_FOREMAN',
    label: 'V2.0 Persistent Foreman Governance',
    shortName: 'v20',
    tools: [
      'et.foreman.governance.grant_lease',
      'et.foreman.governance.revoke_lease',
      'et.foreman.governance.raise_exception',
      'et.foreman.governance.resolve_exception',
      'et.foreman.governance.start_persistent',
      'et.foreman.governance.pause_persistent'
    ],
    domains: ['foreman-governance', 'foreman-persistent'],
    anchors: ['STATE:governance', 'STATE:persistent_foreman'],
    endpoints: ['persistent-foreman']
  },
  {
    key: 'FEATURE_FOUNDERS_V21_DOCTRINE_LITE',
    label: 'V2.1 Doctrine Lite',
    shortName: 'v21',
    tools: [
      'et.foreman.doctrine.get_state',
      'et.foreman.doctrine.set_rule'
    ],
    domains: ['foreman-doctrine'],
    anchors: ['STATE:doctrine'],
    endpoints: ['doctrine']
  },
  {
    key: 'FEATURE_FOUNDERS_V25_SECOND_SETTLEMENT',
    label: 'V2.5 Second Settlement',
    shortName: 'v25',
    tools: [
      'et.plot.settlements.get_ledger',
      'et.plot.settlements.launch_expedition',
      'et.plot.settlements.focus',
      'et.plot.settlements.complete_founding_task'
    ],
    payloadKeys: ['settlements'],
    domains: ['settlements'],
    anchors: ['STATE:settlements']
  },
  {
    key: 'FEATURE_FOUNDERS_V30_OPERATING_MODEL',
    label: 'V3.0 Operating Model',
    shortName: 'v30',
    tools: [
      'et.plot.operating_model.get_state',
      'et.plot.operating_model.choose_charter',
      'et.plot.operating_model.unlock_capability',
      'et.plot.operating_model.refresh_contracts'
    ],
    payloadKeys: ['operatingModel'],
    domains: ['operating-model'],
    anchors: ['STATE:operating-model']
  },
  {
    key: 'FEATURE_FOUNDERS_V31_SPECIALISTS',
    label: 'V3.1 Specialist Foremen',
    shortName: 'v31',
    tools: [
      'et.foreman.specialists.get_state',
      'et.foreman.specialists.assign',
      'et.foreman.specialists.pause',
      'et.foreman.specialists.review_recommendation'
    ],
    domains: ['foreman-specialists'],
    anchors: ['STATE:specialists']
  },
  {
    key: 'FEATURE_FOUNDERS_V35_REGIONAL_GOVERNANCE',
    label: 'V3.5 Regional Governance',
    shortName: 'v35',
    tools: [
      'et.plot.regional.get_ledger',
      'et.plot.regional.open_supply_route',
      'et.plot.regional.transfer_supply_route',
      'et.plot.regional.accept_contract',
      'et.plot.regional.turn_in_contract'
    ],
    payloadKeys: ['regionalNetwork'],
    domains: ['regional-network'],
    anchors: ['STATE:regional-network']
  },
  {
    key: 'FEATURE_FOUNDERS_V40_OPERATING_STYLE_SHARING',
    label: 'V4.0 Operating Style Sharing',
    shortName: 'v40',
    endpoints: ['operating-style']
  },
  {
    key: 'FEATURE_FOUNDERS_V45_CREATOR_BUILDINGS',
    label: 'V4.5 Creator Buildings',
    shortName: 'v45',
    tools: [
      'et.plot.creator.get_catalog',
      'et.plot.creator.install_building',
      'et.plot.creator.disable_building',
      'et.plot.creator.remove_building',
      'et.creator.notice_kiosk.post_notice'
    ],
    payloadKeys: ['creatorExtensions'],
    domains: ['creator-extensions'],
    anchors: ['STATE:creator-extensions']
  }
];

const FEATURE_BY_KEY = new Map(FUTURE_FEATURES.map((feature) => [feature.key, feature]));
const FEATURE_BY_SHORT_NAME = new Map(FUTURE_FEATURES.map((feature) => [feature.shortName, feature]));
const TOOL_TO_FEATURE = new Map();
const PAYLOAD_KEY_TO_FEATURE = new Map();
const DOMAIN_TO_FEATURE = new Map();
const ANCHOR_TO_FEATURE = new Map();

for (const feature of FUTURE_FEATURES) {
  for (const tool of feature.tools || []) TOOL_TO_FEATURE.set(tool, feature.key);
  for (const key of feature.payloadKeys || []) PAYLOAD_KEY_TO_FEATURE.set(key, feature.key);
  for (const domain of feature.domains || []) DOMAIN_TO_FEATURE.set(domain, feature.key);
  for (const anchor of feature.anchors || []) ANCHOR_TO_FEATURE.set(anchor, feature.key);
}

function truthyEnv(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(normalized);
}

function normalizeToken(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function emptyFeatureFlags(enabled = false) {
  return Object.fromEntries(FUTURE_FEATURES.map((feature) => [feature.key, enabled === true]));
}

function parseExplicitFeatureFlags(raw = '') {
  const value = String(raw || '').trim();
  if (!value) return null;
  const normalized = normalizeToken(value);
  if (['all', 'future', 'prototype', 'prototypes'].includes(normalized)) return emptyFeatureFlags(true);
  if (['none', 'off', 'disabled', 'v15', 'first_hour'].includes(normalized)) return emptyFeatureFlags(false);

  const flags = emptyFeatureFlags(false);
  const tokens = value.split(',').map((part) => part.trim()).filter(Boolean);
  for (const token of tokens) {
    const tokenKey = normalizeToken(token);
    const exact = FUTURE_FEATURES.find((feature) => normalizeToken(feature.key) === tokenKey);
    const short = FEATURE_BY_SHORT_NAME.get(tokenKey);
    const feature = exact || short || null;
    if (feature) flags[feature.key] = true;
  }
  return flags;
}

function defaultFoundersPlotFeatureFlags(env = process.env) {
  const explicitDefault = parseExplicitFeatureFlags(env.FOUNDERS_PLOT_FEATURE_FLAGS || '');
  if (explicitDefault) return explicitDefault;
  const testDefault = env.NODE_ENV === 'test';
  const flags = emptyFeatureFlags(testDefault);
  for (const feature of FUTURE_FEATURES) {
    if (Object.prototype.hasOwnProperty.call(env, feature.key)) {
      flags[feature.key] = truthyEnv(env[feature.key]);
    }
  }
  return flags;
}

function resolveFoundersPlotFeatureFlags(req = null, env = process.env) {
  const explicit = req
    ? String(
      req.headers?.['x-founders-plot-feature-flags']
      || req.query?.foundersFeatureFlags
      || req.query?.founders_features
      || ''
    )
    : '';
  return parseExplicitFeatureFlags(explicit) || defaultFoundersPlotFeatureFlags(env);
}

function isFeatureEnabled(flags = {}, featureKey = '') {
  return flags?.[featureKey] === true;
}

function featureForTool(toolName = '') {
  return TOOL_TO_FEATURE.get(String(toolName || '').trim()) || '';
}

function featureForPayloadKey(key = '') {
  return PAYLOAD_KEY_TO_FEATURE.get(String(key || '').trim()) || '';
}

function featureForDomain(domainId = '') {
  return DOMAIN_TO_FEATURE.get(String(domainId || '').trim()) || '';
}

function featureForAnchor(anchorId = '') {
  return ANCHOR_TO_FEATURE.get(String(anchorId || '').trim()) || '';
}

function isToolEnabled(toolName = '', flags = {}) {
  const featureKey = featureForTool(toolName);
  return !featureKey || isFeatureEnabled(flags, featureKey);
}

function filterToolSpecs(toolSpecs = [], flags = {}) {
  return (Array.isArray(toolSpecs) ? toolSpecs : []).filter((tool) => isToolEnabled(tool?.name, flags));
}

function stripDisabledFutureState(payload = {}, flags = {}) {
  const safe = { ...payload, featureFlags: { ...flags } };
  for (const [key, featureKey] of PAYLOAD_KEY_TO_FEATURE.entries()) {
    if (!isFeatureEnabled(flags, featureKey)) delete safe[key];
  }
  if (safe.foreman && typeof safe.foreman === 'object') {
    safe.foreman = { ...safe.foreman };
    safe.foreman.allowedTools = (Array.isArray(safe.foreman.allowedTools) ? safe.foreman.allowedTools : [])
      .filter((toolName) => isToolEnabled(toolName, flags));
    if (!isFeatureEnabled(flags, 'FEATURE_FOUNDERS_V20_PERSISTENT_FOREMAN')) delete safe.foreman.governance;
    if (!isFeatureEnabled(flags, 'FEATURE_FOUNDERS_V21_DOCTRINE_LITE')) delete safe.foreman.doctrine;
    if (!isFeatureEnabled(flags, 'FEATURE_FOUNDERS_V31_SPECIALISTS')) delete safe.foreman.specialists;
  }
  return safe;
}

module.exports = {
  ANCHOR_TO_FEATURE,
  DOMAIN_TO_FEATURE,
  FEATURE_BY_KEY,
  FUTURE_FEATURES,
  PAYLOAD_KEY_TO_FEATURE,
  TOOL_TO_FEATURE,
  defaultFoundersPlotFeatureFlags,
  emptyFeatureFlags,
  featureForAnchor,
  featureForDomain,
  featureForPayloadKey,
  featureForTool,
  filterToolSpecs,
  isFeatureEnabled,
  isToolEnabled,
  parseExplicitFeatureFlags,
  resolveFoundersPlotFeatureFlags,
  stripDisabledFutureState
};
