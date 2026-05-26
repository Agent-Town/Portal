const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCHEMA_DIR = path.join(REPO_ROOT, 'schemas', 'generated-packs');

const GENERATED_PACK_SCHEMA_FILES = {
  generationBrief: 'generation_brief.schema.json',
  stylePack: 'style_bible.schema.json',
  universePack: 'universe_bible.schema.json',
  gameplayMapping: 'gameplay_mapping.schema.json',
  techFlavorTree: 'tech_flavor_tree.schema.json',
  requesterVoicePack: 'requester_voice_pack.schema.json',
  inhabitantStyleOverlay: 'inhabitant_style_overlay.schema.json',
  multiSurfaceCompatibility: 'multi_surface_compatibility.schema.json',
  approvedModifiers: 'approved_modifiers.schema.json',
  assetPromptPlan: 'asset_prompt_plan.schema.json',
  assetManifest: 'generated_asset_manifest.schema.json',
  generatedPack: 'generated_pack.schema.json',
  playtestReport: 'playtest_report.schema.json',
  publicPackCard: 'public_pack_card.schema.json',
  publicPackGallery: 'public_pack_gallery.schema.json'
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function schemaPath(filename) {
  const resolved = path.resolve(SCHEMA_DIR, filename);
  if (!resolved.startsWith(`${SCHEMA_DIR}${path.sep}`)) {
    throw new Error('INVALID_SCHEMA_PATH');
  }
  return resolved;
}

function loadGeneratedPackSchemaRegistry() {
  const registry = {};
  for (const [key, filename] of Object.entries(GENERATED_PACK_SCHEMA_FILES)) {
    registry[key] = JSON.parse(fs.readFileSync(schemaPath(filename), 'utf8'));
  }
  return registry;
}

function typeMatches(value, expectedType) {
  if (expectedType === 'array') return Array.isArray(value);
  if (expectedType === 'integer') return Number.isInteger(value);
  if (expectedType === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (expectedType === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  return typeof value === expectedType;
}

function validateGeneratedSchema(value, schema, pathLabel = '$') {
  const errors = [];
  function addError(pathName, code, details = {}) {
    errors.push({ path: pathName, code, ...details });
  }

  function visit(node, spec, currentPath) {
    if (!spec || typeof spec !== 'object') return;
    if (spec.anyOf) {
      const matched = spec.anyOf.some((childSpec) => validateGeneratedSchema(node, childSpec, currentPath).ok);
      if (!matched) addError(currentPath, 'ANY_OF_MISMATCH');
    }
    if (spec.not) {
      const notResult = validateGeneratedSchema(node, spec.not, currentPath);
      if (notResult.ok) addError(currentPath, 'NOT_SCHEMA_MATCHED');
    }
    if (spec.const !== undefined && node !== spec.const) {
      addError(currentPath, 'CONST_MISMATCH', { expected: spec.const, actual: node });
    }
    if (spec.enum && !spec.enum.includes(node)) {
      addError(currentPath, 'ENUM_MISMATCH', { allowed: spec.enum, actual: node });
    }
    if (spec.type) {
      const expectedTypes = Array.isArray(spec.type) ? spec.type : [spec.type];
      if (!expectedTypes.some((expectedType) => typeMatches(node, expectedType))) {
        addError(currentPath, 'TYPE_MISMATCH', { expected: expectedTypes, actual: Array.isArray(node) ? 'array' : typeof node });
        return;
      }
    }
    if (typeof node === 'string') {
      if (spec.minLength !== undefined && node.length < spec.minLength) {
        addError(currentPath, 'MIN_LENGTH', { minLength: spec.minLength, actual: node.length });
      }
      if (spec.pattern && !(new RegExp(spec.pattern).test(node))) {
        addError(currentPath, 'PATTERN_MISMATCH', { pattern: spec.pattern });
      }
    }
    if (typeof node === 'number') {
      if (spec.minimum !== undefined && node < spec.minimum) addError(currentPath, 'MINIMUM', { minimum: spec.minimum, actual: node });
      if (spec.maximum !== undefined && node > spec.maximum) addError(currentPath, 'MAXIMUM', { maximum: spec.maximum, actual: node });
    }
    if (Array.isArray(node)) {
      if (spec.minItems !== undefined && node.length < spec.minItems) {
        addError(currentPath, 'MIN_ITEMS', { minItems: spec.minItems, actual: node.length });
      }
      if (spec.items) {
        node.forEach((item, index) => visit(item, spec.items, `${currentPath}[${index}]`));
      }
    }
    if (node && typeof node === 'object' && !Array.isArray(node)) {
      const required = Array.isArray(spec.required) ? spec.required : [];
      for (const key of required) {
        if (!Object.prototype.hasOwnProperty.call(node, key)) addError(`${currentPath}.${key}`, 'REQUIRED');
      }
      const properties = spec.properties || {};
      if (spec.additionalProperties === false) {
        for (const key of Object.keys(node)) {
          if (!Object.prototype.hasOwnProperty.call(properties, key)) addError(`${currentPath}.${key}`, 'ADDITIONAL_PROPERTY');
        }
      }
      for (const [key, childSpec] of Object.entries(properties)) {
        if (Object.prototype.hasOwnProperty.call(node, key)) visit(node[key], childSpec, `${currentPath}.${key}`);
      }
    }
  }

  visit(value, schema, pathLabel);
  return { ok: errors.length === 0, errors };
}

function validateGeneratedPackSchemas(pack, registry = loadGeneratedPackSchemaRegistry()) {
  const subdocuments = {
    generationBrief: pack?.generationBrief,
    stylePack: pack?.stylePack,
    universePack: pack?.universePack,
    gameplayMapping: pack?.gameplayMapping,
    techFlavorTree: pack?.techFlavorTree,
    requesterVoicePack: pack?.requesterVoicePack,
    inhabitantStyleOverlay: pack?.inhabitantStyleOverlay,
    multiSurfaceCompatibility: pack?.multiSurfaceCompatibility,
    approvedModifiers: pack?.approvedModifiers,
    assetPromptPlan: pack?.assetPromptPlan,
    assetManifest: pack?.assetManifest,
    generatedPack: pack
  };
  const results = {};
  for (const [key, value] of Object.entries(subdocuments)) {
    results[key] = validateGeneratedSchema(value, registry[key], `$${key === 'generatedPack' ? '' : `.${key}`}`);
  }
  const errors = Object.entries(results).flatMap(([key, result]) => result.errors.map((error) => ({ schema: key, ...error })));
  return {
    ok: errors.length === 0,
    results: clone(results),
    errors,
    metrics: {
      schemaCount: Object.keys(subdocuments).length,
      schemasValidatedIndependently: true,
      schemaErrorCount: errors.length
    }
  };
}

module.exports = {
  GENERATED_PACK_SCHEMA_FILES,
  loadGeneratedPackSchemaRegistry,
  validateGeneratedPackSchemas,
  validateGeneratedSchema
};
