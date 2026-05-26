const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const express = require('express');

const { createWorldGridRouter } = require('../server/world_grid/routes');
const {
  REQUIRED_CANONICAL_IDS,
  clearGeneratedPacksForTests,
  createGeneratedPack,
  validateGeneratedPack
} = require('../server/world_grid/generated_pack');

const root = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

async function withWorldGridServer({ identity, envPatch = {} }, fn) {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    ADMIN_TOKEN: process.env.ADMIN_TOKEN,
    FEATURE_WORLD_GRID_V50_REGION: process.env.FEATURE_WORLD_GRID_V50_REGION,
    FEATURE_WORLD_GRID_GENERATED_PACKS: process.env.FEATURE_WORLD_GRID_GENERATED_PACKS,
    WORLD_GRID_FEATURE_FLAGS: process.env.WORLD_GRID_FEATURE_FLAGS
  };
  for (const [key, value] of Object.entries(envPatch)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  clearGeneratedPacksForTests();
  const app = express();
  app.use(express.json());
  app.use(createWorldGridRouter({
    resolveIdentity: () => identity
  }));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    clearGeneratedPacksForTests();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('generated pack schema suite and fixtures exist', () => {
  const requiredSchemas = [
    'generation_brief.schema.json',
    'style_bible.schema.json',
    'universe_bible.schema.json',
    'gameplay_mapping.schema.json',
    'asset_prompt_plan.schema.json',
    'generated_asset_manifest.schema.json',
    'generated_pack.schema.json',
    'playtest_report.schema.json'
  ];
  for (const schema of requiredSchemas) {
    const parsed = readJson(`schemas/generated-packs/${schema}`);
    assert.ok(parsed.$id, schema);
  }
  assert.equal(requiredSchemas.length, 8);

  for (const fixture of [
    'valid_world_grid_pack.json',
    'invalid_missing_mapping.json',
    'invalid_formula_authority.json',
    'invalid_secret_field.json'
  ]) {
    assert.ok(readJson(`tests/fixtures/generated_packs/${fixture}`).packId, fixture);
  }
});

test('generated pack validation accepts the valid fixture and covers canonical gameplay mappings', () => {
  const fixture = readJson('tests/fixtures/generated_packs/valid_world_grid_pack.json');
  const report = validateGeneratedPack(fixture);

  assert.equal(report.ok, true, JSON.stringify(report.checks));
  assert.equal(report.metrics.requiredCanonicalMappings, REQUIRED_CANONICAL_IDS.length);
  assert.equal(report.metrics.canonicalMappingsCovered, REQUIRED_CANONICAL_IDS.length);
  assert.equal(report.metrics.fallbackAssetCount >= 20, true);
});

test('generated pack validation rejects missing mappings, arbitrary formulas, and secret-like fields', () => {
  const missingMapping = readJson('tests/fixtures/generated_packs/invalid_missing_mapping.json');
  const missingReport = validateGeneratedPack(missingMapping);
  assert.equal(missingReport.ok, false);
  assert.equal(
    missingReport.checks.find((check) => check.id === 'GENPACK_CANONICAL_MAPPING_COVERAGE').passed,
    false
  );

  const valid = readJson('tests/fixtures/generated_packs/valid_world_grid_pack.json');
  const formulaPack = { ...valid, formula: 'wood * 2', gameplayMapping: { ...valid.gameplayMapping, serverRuleOverrides: 1 } };
  const formulaReport = validateGeneratedPack(formulaPack);
  assert.equal(formulaReport.ok, false);
  assert.equal(formulaReport.checks.find((check) => check.id === 'GENPACK_NO_MUTATION_AUTHORITY').passed, false);
  assert.equal(formulaReport.checks.find((check) => check.id === 'GENPACK_CANONICAL_KEYS_PRESERVED').passed, false);

  const secretPack = { ...valid, apiKey: 'must-not-ship' };
  const secretReport = validateGeneratedPack(secretPack);
  assert.equal(secretReport.ok, false);
  assert.equal(secretReport.checks.find((check) => check.id === 'GENPACK_NO_MUTATION_AUTHORITY').passed, false);
});

test('prompt-to-pack generation is deterministic, hashed, and does not store raw prompt text', () => {
  const owner = { ownerAccountId: 'owner_generation_contract' };
  const prompt = 'cozy mushroom frontier with clockwork gardeners and lantern moss';
  const first = createGeneratedPack({ owner, prompt, nowMs: 1_000 });
  const second = createGeneratedPack({ owner, prompt, nowMs: 2_000 });

  assert.equal(first.packId, second.packId);
  assert.equal(first.prompt.hash, second.prompt.hash);
  assert.equal(Object.prototype.hasOwnProperty.call(first.prompt, 'normalizedPrompt'), false);
  assert.equal(first.validationReport.ok, true);
  assert.match(first.universePack.firstLoop.objective, /complete the first claim/i);
});

test('generated pack API is gated and records first-loop playtest reports when enabled', async () => {
  const identity = { pairId: 'session:generated-pack-api', houseId: null };

  await withWorldGridServer({
    identity,
    envPatch: {
      NODE_ENV: 'production',
      WORLD_GRID_FEATURE_FLAGS: undefined,
      FEATURE_WORLD_GRID_V50_REGION: '1',
      FEATURE_WORLD_GRID_GENERATED_PACKS: undefined
    }
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/world/generated-pack/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'moss lantern survey town' })
    });
    const body = await response.json();
    assert.equal(response.status, 403, JSON.stringify(body));
    assert.equal(body.error.code, 'FEATURE_DISABLED');
  });

  await withWorldGridServer({
    identity,
    envPatch: { NODE_ENV: 'test', WORLD_GRID_FEATURE_FLAGS: 'all' }
  }, async (baseUrl) => {
    const toolsResponse = await fetch(`${baseUrl}/api/world/tools`);
    const toolsBody = await toolsResponse.json();
    assert.equal(toolsResponse.status, 200, JSON.stringify(toolsBody));
    assert.equal(toolsBody.tools.some((tool) => tool.name === 'et.world.generated_pack.generate'), true);

    const generateResponse = await fetch(`${baseUrl}/api/world/generated-pack/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'cozy mushroom frontier with clockwork gardeners and lantern moss' })
    });
    const generateBody = await generateResponse.json();
    assert.equal(generateResponse.status, 200, JSON.stringify(generateBody));
    assert.equal(generateBody.generatedPack.validationReport.ok, true);
    assert.equal(Object.prototype.hasOwnProperty.call(generateBody.generatedPack.prompt, 'normalizedPrompt'), false);

    const regionResponse = await fetch(`${baseUrl}/api/world/region`);
    const regionBody = await regionResponse.json();
    assert.equal(regionResponse.status, 200, JSON.stringify(regionBody));
    assert.equal(regionBody.generatedPack.packId, generateBody.generatedPack.packId);

    const reportResponse = await fetch(`${baseUrl}/api/world/generated-pack/playtest-report`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        packId: generateBody.generatedPack.packId,
        renderer: 'three',
        firstLoopCompleted: true,
        canonicalPayloadIntegrity: true,
        missingAssets: 0,
        consoleErrors: 0
      })
    });
    const reportBody = await reportResponse.json();
    assert.equal(reportResponse.status, 200, JSON.stringify(reportBody));
    assert.equal(reportBody.playtestReport.playtestPassed, true);

    const currentResponse = await fetch(`${baseUrl}/api/world/generated-pack/current`);
    const currentBody = await currentResponse.json();
    assert.equal(currentResponse.status, 200, JSON.stringify(currentBody));
    assert.equal(currentBody.playtestReport.packId, generateBody.generatedPack.packId);
  });
});

