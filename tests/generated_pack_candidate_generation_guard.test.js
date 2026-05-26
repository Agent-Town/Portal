const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createGeneratedPack
} = require('../server/world_grid/generated_pack');
const {
  normalizeCandidateGenerationConfig,
  runCandidateImageGenerationSpike
} = require('../server/world_grid/generated_asset_generation');

const root = path.resolve(__dirname, '..');

function createGuardPack(ownerAccountId = 'owner_candidate_guard') {
  return createGeneratedPack({
    owner: { ownerAccountId },
    prompt: 'winter pine hamlet with fox couriers and warm inns',
    nowMs: 40_000,
    candidateRoot: 'data/generated-packs-test'
  });
}

function readLastJobLog(relativePath) {
  const fullPath = path.join(root, relativePath);
  const lines = fs.readFileSync(fullPath, 'utf8').trim().split('\n').filter(Boolean);
  return JSON.parse(lines[lines.length - 1]);
}

function approvedGateConfig(overrides = {}) {
  return {
    enabled: true,
    productSecurityApprovalGranted: true,
    authModelDocumented: true,
    authMode: 'operator_managed',
    costModelDocumented: true,
    costEstimateAccepted: true,
    userConsentGranted: true,
    teamConsentGranted: true,
    estimatedCostUsd: { min: 0.04, max: 0.12 },
    retryPolicy: { maxRetries: 1 },
    rateLimit: { maxRequestsPerMinute: 2, maxConcurrentJobs: 1 },
    ...overrides
  };
}

test('candidate image generation is blocked without explicit consent, auth, cost, and approval gates', async () => {
  const pack = createGuardPack('owner_candidate_guard_blocked');
  const target = pack.assetPromptPlan.targets[0];
  const commandPath = path.join(root, 'scripts/generated_pack_candidate_generation_spike.js');
  const result = await runCandidateImageGenerationSpike({
    pack,
    targetLimit: 1,
    nowMs: 41_000,
    config: {
      enabled: false,
      authMode: 'not_configured',
      rawOperatorInput: 'sk-test-raw-secret-000'
    }
  });
  const entry = readLastJobLog(target.jobLogPath);
  const serializedEntry = JSON.stringify(entry);

  assert.equal(fs.existsSync(commandPath), true);
  assert.equal(result.status, 'blocked');
  assert.equal(result.blockedReasons.includes('generation_disabled'), true);
  assert.equal(result.blockedReasons.includes('auth_model_required'), true);
  assert.equal(result.blockedReasons.includes('cost_consent_required'), true);
  assert.equal(result.blockedReasons.includes('user_team_consent_required'), true);
  assert.equal(result.externalImageGenerationUsed, false);
  assert.equal(result.candidateImagesGenerated, false);
  assert.equal(result.approvedProductionAssetsCreated, false);
  assert.equal(result.fallbackStillPlayable, true);
  assert.equal(entry.status, 'blocked');
  assert.equal(entry.externalImageGenerationUsed, false);
  assert.equal(entry.outputCount, 0);
  assert.equal(entry.approvedProductionAssetsCreated, false);
  assert.doesNotMatch(serializedEntry, /sk-test|raw-secret|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|private[_ -]?key/i);
});

test('approved gates still require an explicit generation adapter and keep outputs candidate-only', async () => {
  const pack = createGuardPack('owner_candidate_guard_adapter');
  const target = pack.assetPromptPlan.targets[0];
  const result = await runCandidateImageGenerationSpike({
    pack,
    targetLimit: 1,
    nowMs: 42_000,
    config: approvedGateConfig()
  });
  const entry = readLastJobLog(target.jobLogPath);

  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.blockedReasons, ['generation_adapter_not_configured']);
  assert.equal(result.authModelDocumented, true);
  assert.equal(result.costConsentRequired, true);
  assert.equal(result.costConsentStatus, 'accepted');
  assert.equal(result.approvedAssetsRequireHumanSignoff, true);
  assert.equal(result.productionImageAssetCount, 0);
  assert.equal(entry.status, 'blocked');
  assert.equal(entry.candidateOutputStatus, 'candidate_only');
  assert.equal(entry.candidateOutputPath.includes('/candidates/'), true);
  assert.equal(entry.approvedProductionAssetsCreated, false);
  assert.equal(entry.sourceProvenance.productionAssetApproval, 'not_requested');
  assert.equal(entry.humanReviewChecklist.includes('human_signoff_required_before_production'), true);
});

test('adapter-produced candidate records are never promoted to production assets', async () => {
  const pack = createGuardPack('owner_candidate_guard_candidate_only');
  const target = pack.assetPromptPlan.targets[0];
  const result = await runCandidateImageGenerationSpike({
    pack,
    targetLimit: 1,
    nowMs: 42_500,
    config: approvedGateConfig(),
    generatorAdapter: async ({ target: plannedTarget }) => ({
      candidateOutputPath: plannedTarget.candidateOutputPath
    })
  });
  const entry = readLastJobLog(target.jobLogPath);

  assert.equal(result.status, 'candidate_recorded');
  assert.equal(result.candidateRecordCount, 1);
  assert.equal(result.productionImageAssetCount, 0);
  assert.equal(result.approvedProductionAssetsCreated, false);
  assert.equal(result.approvedAssetsRequireHumanSignoff, true);
  assert.equal(result.canonicalMappingPreserved, true);
  assert.equal(entry.status, 'candidate_recorded');
  assert.equal(entry.outputCount, 1);
  assert.equal(entry.candidateOutputPath, target.candidateOutputPath);
  assert.equal(entry.candidateOutputStatus, 'candidate_only');
  assert.equal(entry.approvedProductionAssetsCreated, false);
  assert.equal(entry.generatedImageAssetsCanChangeServerRules, false);
});

test('failed candidate generation attempts preserve deterministic fallback and canonical server mappings', async () => {
  const pack = createGuardPack('owner_candidate_guard_failed');
  const target = pack.assetPromptPlan.targets[0];
  const result = await runCandidateImageGenerationSpike({
    pack,
    targetLimit: 1,
    nowMs: 43_000,
    config: approvedGateConfig(),
    generatorAdapter: async () => {
      throw new Error('sk-test-raw-secret-should-not-log');
    }
  });
  const entry = readLastJobLog(target.jobLogPath);
  const serializedEntry = JSON.stringify(entry);

  assert.equal(result.status, 'failed');
  assert.equal(result.failedJobCount, 1);
  assert.equal(result.fallbackStillPlayable, true);
  assert.equal(result.canonicalMappingPreserved, true);
  assert.equal(result.generatedImageAssetsCanChangeServerRules, false);
  assert.equal(result.externalImageGenerationUsed, false);
  assert.equal(result.approvedProductionAssetsCreated, false);
  assert.equal(entry.status, 'failed');
  assert.equal(entry.errors[0].code, 'candidate_generation_failed');
  assert.equal(entry.fallbackStillPlayable, true);
  assert.equal(entry.generatedImageAssetsCanChangeServerRules, false);
  assert.doesNotMatch(serializedEntry, /sk-test|raw-secret|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|private[_ -]?key/i);
});

test('candidate generation guard normalizes unsafe config values into bounded policy', () => {
  const config = normalizeCandidateGenerationConfig({
    enabled: true,
    authMode: 'raw_provider_key',
    estimatedCostUsd: { min: -1, max: 99.99999 },
    retryPolicy: { maxRetries: 99 },
    rateLimit: { maxRequestsPerMinute: 999, maxConcurrentJobs: 99 }
  });

  assert.equal(config.enabled, true);
  assert.equal(config.authMode, 'not_configured');
  assert.equal(config.estimatedCostUsd.min, 0);
  assert.equal(config.estimatedCostUsd.max, 99.9999);
  assert.equal(config.retryPolicy.maxRetries, 3);
  assert.equal(config.rateLimit.maxRequestsPerMinute, 10);
  assert.equal(config.rateLimit.maxConcurrentJobs, 2);
});
