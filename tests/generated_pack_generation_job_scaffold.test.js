const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createGeneratedPack
} = require('../server/world_grid/generated_pack');

const root = path.resolve(__dirname, '..');

function readJobLog(relativePath) {
  const fullPath = path.join(root, relativePath);
  const lines = fs.readFileSync(fullPath, 'utf8').trim().split('\n').filter(Boolean);
  return lines.map((line) => JSON.parse(line));
}

test('candidate generation scaffold writes replayable no-generation job logs with consent and provenance placeholders', () => {
  const pack = createGeneratedPack({
    owner: { ownerAccountId: 'owner_job_scaffold' },
    prompt: 'crystal cave outpost with echo miners and glow carts',
    nowMs: 30_000,
    candidateRoot: 'data/generated-packs-test'
  });
  const target = pack.assetPromptPlan.targets.find((item) => item.canonicalTarget === 'postcard.pack-preview')
    || pack.assetPromptPlan.targets[0];
  const [entry] = readJobLog(target.jobLogPath);

  assert.equal(pack.assetScaffold.jobLogCount, 23);
  assert.equal(pack.assetScaffold.externalModelUsed, false);
  assert.equal(pack.assetScaffold.productionImageAssetCount, 0);
  assert.equal(pack.assetScaffold.replayableFromPromptPlan, true);
  assert.equal(entry.schemaVersion, 'agent-town-asset-generation-job-log-v1');
  assert.equal(entry.status, 'planned');
  assert.equal(entry.modelFamily, 'gpt-image-2-candidate');
  assert.equal(entry.authMode, 'not_configured');
  assert.equal(entry.costConsentStatus, 'not_required_for_scaffold');
  assert.equal(entry.consentModel.explicitConsentRequiredForGeneration, true);
  assert.equal(entry.costEstimate.estimatedMax, 0);
  assert.equal(entry.sourceProvenance.externalModelUsed, false);
  assert.equal(entry.sourceProvenance.productionAssetApproval, 'not_requested');
  assert.equal(entry.retryPolicy.maxRetries, 0);
  assert.equal(entry.retryPolicy.retryRecords.length, 0);
  assert.equal(entry.resume.replayableFromPromptPlan, true);
  assert.equal(entry.outputCount, 0);
  assert.equal(entry.errors.length, 0);
  assert.equal(JSON.stringify(entry).match(/api[_-]?key|secret|access[_-]?token|refresh[_-]?token|private[_-]?key/i), null);
});
