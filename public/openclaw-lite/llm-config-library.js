import { getRecord, putRecord } from '/openclaw-lite/vendor/shared/idb.js';

function parseModelRef(modelRef, fallbackProvider = 'openai', fallbackModelId = 'gpt-4o-mini') {
  const ref = String(modelRef || '').trim();
  if (!ref) {
    return {
      provider: fallbackProvider,
      modelId: fallbackModelId,
      modelRef: `${fallbackProvider}/${fallbackModelId}`
    };
  }
  const slash = ref.indexOf('/');
  if (slash > 0) {
    const provider = ref.slice(0, slash).trim();
    const modelId = ref.slice(slash + 1).trim();
    if (provider && modelId) {
      return { provider, modelId, modelRef: `${provider}/${modelId}` };
    }
  }
  return {
    provider: fallbackProvider,
    modelId: ref,
    modelRef: `${fallbackProvider}/${ref}`
  };
}

async function metaGet(key) {
  const rec = await getRecord('meta', key);
  return rec ? rec.value : null;
}

async function metaSet(key, value) {
  await putRecord('meta', { key, value });
}

export async function saveLlmConfig({ provider, model, apiKey }) {
  const providerTrim = String(provider || '').trim();
  const modelTrim = String(model || '').trim();
  const keyTrim = String(apiKey || '').trim();
  if (!providerTrim) throw new Error('MISSING_LLM_PROVIDER');
  if (!modelTrim) throw new Error('MISSING_LLM_MODEL');
  if (!keyTrim) throw new Error('MISSING_LLM_API_KEY');

  const parsed = parseModelRef(`${providerTrim}/${modelTrim}`, providerTrim, modelTrim);
  const useProxy = true;
  const api = parsed.provider === 'openai' ? 'openai-completions' : '';
  const baseUrl = parsed.provider === 'openai'
    ? new URL('/api/llm/openai/v1', window.location.origin).toString()
    : '';

  await metaSet('llmApiKey', keyTrim);
  await metaSet('llmApi', api || null);
  await metaSet('llmProvider', parsed.provider || null);
  await metaSet('llmModelRef', parsed.modelRef || null);
  await metaSet('llmModelId', parsed.modelId || null);
  await metaSet('llmBaseUrl', baseUrl || null);
  await metaSet('llmReasoning', null);
  await metaSet('llmUseProxy', useProxy);

  return {
    configured: true,
    provider: parsed.provider,
    model: parsed.modelId,
    modelRef: parsed.modelRef,
    apiKeySet: true
  };
}

export async function loadLlmConfig() {
  const provider = await metaGet('llmProvider');
  const model = await metaGet('llmModelId');
  const modelRef = await metaGet('llmModelRef');
  const apiKey = await metaGet('llmApiKey');
  return {
    configured: !!(provider && model && apiKey),
    provider: provider || null,
    model: model || null,
    modelRef: modelRef || null,
    apiKey: typeof apiKey === 'string' ? apiKey : '',
    apiKeySet: !!apiKey
  };
}

export async function clearLlmConfig() {
  await metaSet('llmApiKey', null);
  await metaSet('llmApi', null);
  await metaSet('llmProvider', null);
  await metaSet('llmModelRef', null);
  await metaSet('llmModelId', null);
  await metaSet('llmBaseUrl', null);
  await metaSet('llmReasoning', null);
  await metaSet('llmUseProxy', true);
  return { cleared: true };
}
