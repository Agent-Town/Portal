const {
  isAuthorizedFeatureOverrideRequest,
  truthyEnv
} = require('../founders_plot/feature_flags');

const WORLD_GRID_FEATURES = [
  {
    key: 'FEATURE_WORLD_GRID_V50_REGION',
    label: 'V5.0 Region Grid Foundation',
    shortName: 'v50'
  },
  {
    key: 'FEATURE_WORLD_GRID_V51_CLAIMS',
    label: 'V5.1 Territory Claims and Settler Routes',
    shortName: 'v51'
  },
  {
    key: 'FEATURE_WORLD_GRID_V52_PUBLIC_PRESENCE',
    label: 'V5.2 Public Presence and Safe Player Discovery',
    shortName: 'v52'
  },
  {
    key: 'FEATURE_WORLD_GRID_V53_AGENT_SERVICES',
    label: 'V5.3 Agent Services and Civic Marketplace',
    shortName: 'v53'
  },
  {
    key: 'FEATURE_WORLD_GRID_V54_WORLD_EVENTS',
    label: 'V5.4 World Events and Public Works',
    shortName: 'v54'
  },
  {
    key: 'FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS',
    label: 'V5.5 Controlled Free-Play Sandbox Districts',
    shortName: 'v55'
  },
  {
    key: 'FEATURE_WORLD_GRID_GENERATED_PACKS',
    label: 'Generated Style and Universe Packs',
    shortName: 'generated'
  }
];

function normalizeToken(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function emptyWorldGridFeatureFlags(enabled = false) {
  return Object.fromEntries(WORLD_GRID_FEATURES.map((feature) => [feature.key, enabled === true]));
}

function parseWorldGridFeatureFlags(raw = '') {
  const value = String(raw || '').trim();
  if (!value) return null;
  const normalized = normalizeToken(value);
  if (['all', 'world', 'world_grid', 'prototype', 'prototypes'].includes(normalized)) {
    return emptyWorldGridFeatureFlags(true);
  }
  if (['none', 'off', 'disabled', 'v15', 'first_hour'].includes(normalized)) {
    return emptyWorldGridFeatureFlags(false);
  }
  const flags = emptyWorldGridFeatureFlags(false);
  const tokens = value.split(',').map((part) => normalizeToken(part)).filter(Boolean);
  for (const token of tokens) {
    for (const feature of WORLD_GRID_FEATURES) {
      if (token === normalizeToken(feature.key) || token === feature.shortName) {
        flags[feature.key] = true;
      }
    }
  }
  return flags;
}

function defaultWorldGridFeatureFlags(env = process.env) {
  const explicit = parseWorldGridFeatureFlags(env.WORLD_GRID_FEATURE_FLAGS || '');
  if (explicit) return explicit;
  const flags = emptyWorldGridFeatureFlags(false);
  for (const feature of WORLD_GRID_FEATURES) {
    if (Object.prototype.hasOwnProperty.call(env, feature.key)) {
      flags[feature.key] = truthyEnv(env[feature.key]);
    }
  }
  return flags;
}

function readHeaderValue(headers = {}, name = '') {
  const target = String(name || '').toLowerCase();
  for (const [key, value] of Object.entries(headers || {})) {
    if (String(key || '').toLowerCase() === target) return value;
  }
  return '';
}

function requestWorldGridFeatureOverride(req = null) {
  if (!req) return '';
  return String(
    readHeaderValue(req.headers, 'x-world-grid-feature-flags')
    || req.query?.worldGridFeatureFlags
    || ''
  ).trim();
}

function resolveWorldGridFeatureFlags(req = null, env = process.env) {
  const explicit = req && isAuthorizedFeatureOverrideRequest(req, env)
    ? requestWorldGridFeatureOverride(req)
    : '';
  return parseWorldGridFeatureFlags(explicit) || defaultWorldGridFeatureFlags(env);
}

function isWorldGridFeatureEnabled(flags = {}, featureKey = '') {
  return flags?.[featureKey] === true;
}

module.exports = {
  WORLD_GRID_FEATURES,
  defaultWorldGridFeatureFlags,
  emptyWorldGridFeatureFlags,
  isWorldGridFeatureEnabled,
  parseWorldGridFeatureFlags,
  requestWorldGridFeatureOverride,
  resolveWorldGridFeatureFlags
};
