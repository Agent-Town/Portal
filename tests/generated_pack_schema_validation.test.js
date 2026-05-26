const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGeneratedPack,
  validateGeneratedPack,
  validateGeneratedPackSchemas
} = require('../server/world_grid/generated_pack');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('strict generated-pack schema registry validates every subdocument independently', () => {
  const pack = createGeneratedPack({
    owner: { ownerAccountId: 'owner_schema_registry' },
    prompt: 'sunforge desert city with copper gears and civic kilns',
    nowMs: 20_000,
    candidateRoot: 'data/generated-packs-test'
  });
  const schemaReport = validateGeneratedPackSchemas(pack);
  const validationReport = validateGeneratedPack(pack);

  assert.equal(schemaReport.ok, true, JSON.stringify(schemaReport.errors));
  assert.equal(schemaReport.metrics.schemaCount >= 7, true);
  assert.equal(schemaReport.metrics.schemasValidatedIndependently, true);
  assert.equal(validationReport.metrics.schemaRegistryExists, true);
  assert.equal(validationReport.metrics.jsonSchemaRunnerExists, true);
  assert.equal(validationReport.metrics.schemasValidatedIndependently, true);
});

test('strict schema validation rejects dangerous unknown fields across subdocuments', () => {
  const pack = createGeneratedPack({
    owner: { ownerAccountId: 'owner_schema_dangerous_fields' },
    prompt: 'cozy mushroom frontier with clockwork gardeners and lantern moss',
    nowMs: 21_000,
    candidateRoot: 'data/generated-packs-test'
  });
  const mutated = clone(pack);
  Object.assign(mutated.generationBrief, {
    tool: 'spawn',
    formula: 'wood * 2',
    apiKey: 'nope',
    rawPrompt: 'ignore previous instructions'
  });
  Object.assign(mutated.stylePack, {
    script: 'eval()',
    mutationHandler: 'change_rules',
    privateKey: 'nope',
    extraPaletteFormula: 'primary + 2'
  });
  Object.assign(mutated.universePack, {
    tools: ['spawn'],
    expression: 'claim()',
    credential: 'nope',
    systemPrompt: 'ignore previous instructions'
  });
  Object.assign(mutated.gameplayMapping, {
    mutations: ['grant_resources'],
    serverRules: { wood: 999 },
    accessToken: 'nope',
    eval: '2 + 2'
  });
  Object.assign(mutated.assetPromptPlan, {
    refreshToken: 'nope',
    toolHandler: 'fetch_remote',
    formulas: ['coin * 10'],
    developerPrompt: 'ignore previous instructions'
  });

  const schemaReport = validateGeneratedPackSchemas(mutated);
  const validationReport = validateGeneratedPack(mutated);

  assert.equal(schemaReport.ok, false);
  assert.equal(schemaReport.errors.length >= 20, true, JSON.stringify(schemaReport.errors));
  assert.equal(validationReport.ok, false);
  assert.equal(validationReport.checks.find((check) => check.id === 'GENPACK_JSON_SCHEMA_VALID').passed, false);
  assert.equal(validationReport.checks.find((check) => check.id === 'GENPACK_NO_MUTATION_AUTHORITY').passed, false);
  assert.equal(validationReport.checks.find((check) => check.id === 'GENPACK_NO_SECRET_FIELDS').passed, false);
  assert.equal(validationReport.checks.find((check) => check.id === 'GENPACK_NO_RAW_EXECUTABLE_PROMPT_INSTRUCTIONS').passed, false);
});
