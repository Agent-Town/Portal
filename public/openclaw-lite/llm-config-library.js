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

// API type mapping from pi model registry.
const PROVIDER_API_MAP = {
  'openai':               'openai-completions',
  'ollama':               'openai-completions',
  'openrouter':           'openai-completions',
  'groq':                 'openai-completions',
  'cerebras':             'openai-completions',
  'xai':                  'openai-completions',
  'mistral':              'openai-completions',
  'huggingface':          'openai-completions',
  'opencode':             'openai-completions',
  'zai':                  'openai-completions',
  'together':             'openai-completions',
  'nvidia':               'openai-completions',
  'vllm':                 'openai-completions',
  'venice':               'openai-completions',
  'litellm':              'openai-completions',
  'cloudflare-ai-gateway':'openai-completions',
  'anthropic':            'anthropic-messages',
  'vercel-ai-gateway':    'anthropic-messages',
  'kimi-coding':          'anthropic-messages',
  'minimax':              'anthropic-messages',
  'amazon-bedrock':       'bedrock-converse-stream',
  'google':               'google-generative-ai',
  'openai-codex':         'openai-codex-responses',
};

function defaultProviderApi(provider) {
  const p = String(provider || '').trim();
  return PROVIDER_API_MAP[p] || '';
}

// Base URLs from pi model registry + common providers.
const PROVIDER_BASE_URL_MAP = {
  'openai':               '/api/llm/openai/v1',
  'ollama':               'http://127.0.0.1:11434/v1',
  'openrouter':           'https://openrouter.ai/api/v1',
  'anthropic':            'https://api.anthropic.com',
  'groq':                 'https://api.groq.com/openai/v1',
  'cerebras':             'https://api.cerebras.ai/v1',
  'xai':                  'https://api.x.ai/v1',
  'mistral':              'https://api.mistral.ai/v1',
  'huggingface':          'https://router.huggingface.co/v1',
  'opencode':             'https://opencode.ai/zen/v1',
  'zai':                  'https://api.z.ai/api/coding/paas/v4',
  'together':             'https://api.together.xyz/v1',
  'nvidia':               'https://integrate.api.nvidia.com/v1',
  'vllm':                 'http://127.0.0.1:8000/v1',
  'venice':               'https://api.venice.ai/api/v1',
  'litellm':              'http://127.0.0.1:4000/v1',
  'minimax':              'https://api.minimax.io/anthropic',
  'kimi-coding':          'https://api.kimi.com/coding',
  'vercel-ai-gateway':    'https://ai-gateway.vercel.sh',
  'amazon-bedrock':       'https://bedrock-runtime.us-east-1.amazonaws.com',
  'google':               'https://generativelanguage.googleapis.com/v1beta',
  'openai-codex':         'https://chatgpt.com/backend-api',
  'cloudflare-ai-gateway':'https://gateway.ai.cloudflare.com/v1',
  'moonshot':             'https://api.moonshot.cn/v1',
  'qianfan':              'https://qianfan.baidubce.com/v2',
  'qwen':                 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  'qwen-portal':          'https://chat.qwen.ai/api',
  'glm':                  'https://open.bigmodel.cn/api/paas/v4',
  'xiaomi':               'https://api.xiaomi.com/v1',
};

function defaultProviderBaseUrl(provider) {
  const p = String(provider || '').trim();
  const url = PROVIDER_BASE_URL_MAP[p];
  if (!url) return '';
  if (url.startsWith('/')) {
    return new URL(url, window.location.origin).toString();
  }
  return url;
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

export async function saveLlmConfig({ provider, model, apiKey, authMode, reasoning, useProxy }) {
  const providerTrim = String(provider || '').trim();
  const modelTrim = String(model || '').trim();
  const keyTrim = String(apiKey || '').trim();
  const normalizedAuthMode = String(authMode || '').trim() === 'oauth-json' ? 'oauth-json' : 'api-key';
  const normalizedReasoning = normalizeReasoning(reasoning);
  const normalizedUseProxy = useProxy !== false;
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
  const provider = await metaGet('llmProvider');
  const model = await metaGet('llmModelId');
  const modelRef = await metaGet('llmModelRef');
  const apiKey = await metaGet('llmApiKey');
  const authMode = await metaGet('llmAuthMode');
  const reasoning = await metaGet('llmReasoning');
  const useProxy = await metaGet('llmUseProxy');
  return {
    configured: !!(provider && model && apiKey),
    provider: provider || null,
    model: model || null,
    modelRef: modelRef || null,
    apiKey: typeof apiKey === 'string' ? apiKey : '',
    authMode: authMode === 'oauth-json' ? 'oauth-json' : 'api-key',
    reasoning: normalizeReasoning(reasoning),
    useProxy: useProxy !== false,
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
