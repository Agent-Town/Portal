const test = require('node:test');
const assert = require('node:assert/strict');

const LlmCatalog = require('../public/llm_catalog.js');

test('openrouter defaults use the OpenAI-compatible proxy path and a live free default model', () => {
  assert.equal(LlmCatalog.defaultProviderApi('openrouter'), 'openai-completions');
  assert.equal(LlmCatalog.defaultProviderBaseUrl('openrouter', 'http://localhost:4173'), 'https://openrouter.ai/api/v1');
  assert.equal(LlmCatalog.getDefaultModel('openrouter'), 'nvidia/nemotron-3-super-120b-a12b:free');
  assert.equal(LlmCatalog.getDefaultFreeOpenRouterModel(), 'nvidia/nemotron-3-super-120b-a12b:free');
  assert.equal(LlmCatalog.normalizeModelForProvider('openrouter', 'openrouter/hunter-alpha'), 'nvidia/nemotron-3-super-120b-a12b:free');
  assert.equal(LlmCatalog.normalizeModelForProvider('openrouter', 'openrouter/healer-alpha'), 'nvidia/nemotron-3-super-120b-a12b:free');
  assert.deepEqual(
    LlmCatalog.getFreeOpenRouterModels().map((entry) => entry.id),
    ['nvidia/nemotron-3-super-120b-a12b:free']
  );
});
