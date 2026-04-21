import { getRecord, putRecord } from '/openclaw-lite/vendor/shared/idb.js';

const DEFAULT_FREE_OPENROUTER_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';
const RETIRED_OPENROUTER_MODELS = new Set([
  'openrouter/hunter-alpha',
  'openrouter/healer-alpha'
]);

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

function defaultProviderApi(provider) {
  const p = String(provider || '').trim();
  if (p === 'openai' || p === 'ollama' || p === 'openrouter') return 'openai-completions';
  return '';
}

function defaultProviderBaseUrl(provider) {
  const p = String(provider || '').trim();
  if (p === 'openai') {
    return new URL('/api/llm/openai/v1', window.location.origin).toString();
  }
  if (p === 'openrouter') return 'https://openrouter.ai/api/v1';
  if (p === 'ollama') {
    return 'http://127.0.0.1:11434/v1';
  }
  return '';
}

async function metaGet(key) {
  const rec = await getRecord('meta', key);
  return rec ? rec.value : null;
}

async function metaSet(key, value) {
  await putRecord('meta', { key, value });
}

function normalizeReasoning(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'minimal' || raw === 'low' || raw === 'medium' || raw === 'high' || raw === 'xhigh') return raw;
  return '';
}

function normalizeProviderModel(provider, model) {
  const providerTrim = String(provider || '').trim();
  const modelTrim = String(model || '').trim();
  if (providerTrim === 'openrouter' && (!modelTrim || RETIRED_OPENROUTER_MODELS.has(modelTrim))) {
    return DEFAULT_FREE_OPENROUTER_MODEL;
  }
  return modelTrim;
}

function defaultUseProxy(provider, explicitValue) {
  if (explicitValue === false) return false;
  if (explicitValue === true) return true;
  return String(provider || '').trim() === 'openrouter' ? false : true;
}

export async function saveLlmConfig({ provider, model, apiKey, authMode, reasoning, useProxy }) {
  const providerTrim = String(provider || '').trim();
  const modelTrim = normalizeProviderModel(providerTrim, model);
  const keyTrim = String(apiKey || '').trim();
  const normalizedAuthMode = String(authMode || '').trim() === 'oauth-json' ? 'oauth-json' : 'api-key';
  const normalizedReasoning = normalizeReasoning(reasoning);
  const normalizedUseProxy = defaultUseProxy(providerTrim, useProxy);
  if (!providerTrim) throw new Error('MISSING_LLM_PROVIDER');
  if (!modelTrim) throw new Error('MISSING_LLM_MODEL');
  if (!keyTrim) throw new Error('MISSING_LLM_API_KEY');

  const parsed = parseModelRef(`${providerTrim}/${modelTrim}`, providerTrim, modelTrim);
  const api = defaultProviderApi(parsed.provider);
  const baseUrl = defaultProviderBaseUrl(parsed.provider);

  await metaSet('llmApiKey', keyTrim);
  await metaSet('llmApi', api || null);
  await metaSet('llmProvider', parsed.provider || null);
  await metaSet('llmModelRef', parsed.modelRef || null);
  await metaSet('llmModelId', parsed.modelId || null);
  await metaSet('llmAuthMode', normalizedAuthMode);
  await metaSet('llmBaseUrl', baseUrl || null);
  await metaSet('llmReasoning', normalizedReasoning || null);
  await metaSet('llmUseProxy', normalizedUseProxy);

  return {
    configured: true,
    provider: parsed.provider,
    model: parsed.modelId,
    modelRef: parsed.modelRef,
    authMode: normalizedAuthMode,
    reasoning: normalizedReasoning,
    useProxy: normalizedUseProxy,
    apiKeySet: true
  };
}

export async function loadLlmConfig() {
  const providerRaw = await metaGet('llmProvider');
  const modelRaw = await metaGet('llmModelId');
  const modelRefRaw = await metaGet('llmModelRef');
  const apiKey = await metaGet('llmApiKey');
  const authMode = await metaGet('llmAuthMode');
  const reasoning = await metaGet('llmReasoning');
  const useProxy = await metaGet('llmUseProxy');
  const provider = typeof providerRaw === 'string' ? providerRaw.trim() : '';
  const model = normalizeProviderModel(provider, modelRaw);
  const modelRef = provider && model ? `${provider}/${model}` : '';
  const migrated = model !== String(modelRaw || '').trim() || (modelRef || null) !== (typeof modelRefRaw === 'string' ? modelRefRaw : null);
  if (migrated && provider && model) {
    await metaSet('llmApi', defaultProviderApi(provider) || null);
    await metaSet('llmModelRef', modelRef || null);
    await metaSet('llmModelId', model || null);
    await metaSet('llmBaseUrl', defaultProviderBaseUrl(provider) || null);
  }
  return {
    configured: !!(provider && model && apiKey),
    provider: provider || null,
    model: model || null,
    modelRef: modelRef || null,
    apiKey: typeof apiKey === 'string' ? apiKey : '',
    authMode: authMode === 'oauth-json' ? 'oauth-json' : 'api-key',
    reasoning: normalizeReasoning(reasoning),
    useProxy: defaultUseProxy(provider, useProxy),
    apiKeySet: !!apiKey
  };
}

export async function clearLlmConfig() {
  await metaSet('llmApiKey', null);
  await metaSet('llmApi', null);
  await metaSet('llmAuthMode', null);
  await metaSet('llmProvider', null);
  await metaSet('llmModelRef', null);
  await metaSet('llmModelId', null);
  await metaSet('llmBaseUrl', null);
  await metaSet('llmReasoning', null);
  await metaSet('llmUseProxy', true);
  return { cleared: true };
}
