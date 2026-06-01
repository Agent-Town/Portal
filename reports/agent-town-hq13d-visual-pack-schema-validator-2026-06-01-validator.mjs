#!/usr/bin/env node
import fs from 'node:fs';

const forbiddenKeys = new Set([
  'action',
  'actions',
  'atlasAction',
  'atlasActions',
  'clientAction',
  'serverAction',
  'tool',
  'tools',
  'toolName',
  'handler',
  'serverHandler',
  'serverHandlers',
  'route',
  'routes',
  'apiRoute',
  'mutation',
  'mutations',
  'resourceDelta',
  'resourceDeltas',
  'cost',
  'costs',
  'output',
  'outputs',
  'timer',
  'timers',
  'permission',
  'permissions',
  'publicUrl',
  'externalUrl',
  'webhook',
  'webhooks'
]);

const topLevelRequired = [
  'packId',
  'packVersion',
  'schemaVersion',
  'title',
  'status',
  'scope',
  'presentationOnly',
  'visualOnly',
  'gameplayMutationPolicy',
  'authorityBoundary',
  'publicSharing',
  'atlasExecution',
  'generatedUniverseRendering',
  'modules'
];

const statusValues = new Set(['draft', 'previewable', 'reviewed', 'promoted_visual', 'archived']);
const authorityValues = new Set([
  'requires_engine_promotion_for_any_gameplay_effect',
  'visual_only_projection_of_server_state',
  'server_owned_visual_presentation_only_v1'
]);

const moduleTypes = {
  mapTerrain: {
    type: 'map_terrain_pack',
    slot: /^expedition_map\.terrain\.[a-z0-9_]+$/
  },
  fogMarkers: {
    type: 'fog_marker_pack',
    slot: /^expedition_map\.(fog\.(discovered|known|hinted|locked_unknown|frontier_border)|marker\.[a-z0-9_]+|stroke\.[a-z0-9_]+)$/
  },
  hudCards: {
    type: 'hud_card_pack',
    slot: /^(hud\.(card|frame)\.[a-z0-9_]+|atlas\.node_icon\.[a-z0-9_]+)$/
  },
  inhabitants: {
    type: 'inhabitant_operator_pack',
    slot: /^founders_plot\.(actor|party\.member)\.[a-z0-9_]+$/
  },
  locations: {
    type: 'location_scene_pack',
    slot: /^founders_plot\.(stage\.background\.(desktop|mobile)|building\.[A-Z0-9_]+|pad\.empty)$/
  }
};

const sameOriginAssetPath = /^\/(?!\/)(?!.*(?:^|\/)\.\.)(?!.*\b(?:https?:|data:|javascript:))[A-Za-z0-9._~!$&'()*+,;=:@/%-]+\.(?:png|webp|jpg|jpeg|json|md)$/;
const assetFields = new Set(['assetSrc', 'metadataSrc', 'promptSrc', 'generatedSrc', 'sourceSrc', 'webpSrc', 'reducedMotionFallback']);

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function push(errors, path, message) {
  errors.push(`${path}: ${message}`);
}

function scanForbidden(value, path, errors) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanForbidden(entry, `${path}[${index}]`, errors));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) {
      push(errors, path, `forbidden field "${key}"`);
    }
    scanForbidden(nested, `${path}.${key}`, errors);
  }
}

function validateAssetBinding(binding, path, errors) {
  if (!binding || typeof binding !== 'object' || Array.isArray(binding)) {
    push(errors, path, 'binding must be an object');
    return;
  }
  const allowed = new Set([
    ...assetFields,
    'variant',
    'label',
    'palette'
  ]);
  const keys = Object.keys(binding);
  keys.forEach((key) => {
    if (!allowed.has(key) && !forbiddenKeys.has(key)) {
      push(errors, `${path}.${key}`, 'unknown binding field');
    }
  });
  if (!keys.some((key) => ['assetSrc', 'metadataSrc', 'webpSrc'].includes(key))) {
    push(errors, path, 'binding must include assetSrc, metadataSrc, or webpSrc');
  }
  for (const key of assetFields) {
    if (key in binding && !sameOriginAssetPath.test(binding[key])) {
      push(errors, `${path}.${key}`, 'must be a same-origin static asset path');
    }
  }
  if ('variant' in binding && !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(binding.variant)) {
    push(errors, `${path}.variant`, 'must be a lowercase runtime variant id');
  }
  if ('palette' in binding) {
    if (!Array.isArray(binding.palette)) {
      push(errors, `${path}.palette`, 'must be an array');
    } else {
      binding.palette.forEach((color, index) => {
        if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
          push(errors, `${path}.palette[${index}]`, 'must be a hex color');
        }
      });
    }
  }
}

function validateManifest(manifest) {
  const errors = [];
  scanForbidden(manifest, '$', errors);

  topLevelRequired.forEach((field) => {
    if (!(field in manifest)) push(errors, '$', `missing required field "${field}"`);
  });

  if (!/^agent-town\.[a-z0-9][a-z0-9.-]*$/.test(manifest.packId || '')) {
    push(errors, '$.packId', 'must start with agent-town. and use lowercase dotted id segments');
  }
  if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/.test(manifest.packVersion || '')) {
    push(errors, '$.packVersion', 'must be semver-like');
  }
  if (manifest.schemaVersion !== 'agent-town.visual-pack.v1') push(errors, '$.schemaVersion', 'must equal agent-town.visual-pack.v1');
  if (!statusValues.has(manifest.status)) push(errors, '$.status', 'unknown status');
  if (manifest.scope !== 'private_owner_scoped') push(errors, '$.scope', 'must be private_owner_scoped');
  if (manifest.presentationOnly !== true) push(errors, '$.presentationOnly', 'must be true');
  if (manifest.visualOnly !== true) push(errors, '$.visualOnly', 'must be true');
  if (manifest.gameplayMutationPolicy !== 'presentation_only') push(errors, '$.gameplayMutationPolicy', 'must be presentation_only');
  if (!authorityValues.has(manifest.authorityBoundary)) push(errors, '$.authorityBoundary', 'unknown authority boundary');
  if (manifest.publicSharing !== false) push(errors, '$.publicSharing', 'must be false');
  if (manifest.atlasExecution !== false) push(errors, '$.atlasExecution', 'must be false');
  if (manifest.generatedUniverseRendering !== false) push(errors, '$.generatedUniverseRendering', 'must be false');

  if (!manifest.modules || typeof manifest.modules !== 'object' || Array.isArray(manifest.modules)) {
    push(errors, '$.modules', 'must be an object');
    return errors;
  }
  const moduleKeys = Object.keys(manifest.modules);
  if (moduleKeys.length < 1) push(errors, '$.modules', 'must include at least one module');
  moduleKeys.forEach((moduleKey) => {
    const expected = moduleTypes[moduleKey];
    const mod = manifest.modules[moduleKey];
    const path = `$.modules.${moduleKey}`;
    if (!expected) {
      push(errors, path, 'unknown module key');
      return;
    }
    if (!mod || typeof mod !== 'object' || Array.isArray(mod)) {
      push(errors, path, 'module must be an object');
      return;
    }
    if (mod.type !== expected.type) push(errors, `${path}.type`, `must be ${expected.type}`);
    if (!mod.slotBindings || typeof mod.slotBindings !== 'object' || Array.isArray(mod.slotBindings)) {
      push(errors, `${path}.slotBindings`, 'must be an object');
      return;
    }
    const slots = Object.keys(mod.slotBindings);
    if (slots.length < 1) push(errors, `${path}.slotBindings`, 'must include at least one slot');
    slots.forEach((slot) => {
      if (!expected.slot.test(slot)) {
        push(errors, `${path}.slotBindings.${slot}`, 'slot is not allowed for this module type');
      }
      validateAssetBinding(mod.slotBindings[slot], `${path}.slotBindings.${slot}`, errors);
    });
  });

  return errors;
}

const [schemaPath, ...fixturePaths] = process.argv.slice(2);
if (!schemaPath || fixturePaths.length < 1) {
  console.error('Usage: node validator.mjs <schema.json> <fixture.json>...');
  process.exit(2);
}

const schema = readJson(schemaPath);
if (schema.title !== 'Agent Town Visual Pack Manifest v1') {
  console.error(`Unexpected schema title in ${schemaPath}`);
  process.exit(2);
}

const results = fixturePaths.map((fixturePath) => {
  const manifest = readJson(fixturePath);
  const errors = validateManifest(manifest);
  const expectedValid = !fixturePath.includes('.invalid-');
  const pass = expectedValid ? errors.length === 0 : errors.length > 0;
  return {
    fixturePath,
    expectedValid,
    actualValid: errors.length === 0,
    pass,
    errors
  };
});

console.log(JSON.stringify({
  schemaPath,
  results,
  ok: results.every((result) => result.pass)
}, null, 2));

if (!results.every((result) => result.pass)) {
  process.exit(1);
}
