(function initLlmCatalog(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root && typeof root === 'object') {
    root.AgentTownLlmCatalog = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildLlmCatalog() {
  const PROVIDER_MODELS = Object.freeze({
    openai: Object.freeze(['gpt-5.1-codex', 'gpt-4o', 'gpt-4o-mini']),
    ollama: Object.freeze(['gpt-oss:20b', 'gpt-oss:120b', 'llama3.3', 'llama3.2:latest', 'qwen2.5:7b']),
    'openai-codex': Object.freeze(['gpt-5.3-codex', 'gpt-5-codex']),
    anthropic: Object.freeze(['claude-opus-4-6', 'claude-3-5-sonnet-20240620', 'claude-3-5-haiku-20241022']),
    openrouter: Object.freeze(['nvidia/nemotron-3-super-120b-a12b:free', 'anthropic/claude-sonnet-4-5']),
    litellm: Object.freeze(['claude-opus-4-6']),
    'amazon-bedrock': Object.freeze(['us.anthropic.claude-opus-4-6-v1:0']),
    'vercel-ai-gateway': Object.freeze(['anthropic/claude-opus-4.6']),
    moonshot: Object.freeze(['kimi-k2.5', 'kimi-k2-0905-preview', 'kimi-k2-turbo-preview', 'kimi-k2-thinking', 'kimi-k2-thinking-turbo']),
    'kimi-coding': Object.freeze(['k2p5']),
    minimax: Object.freeze(['MiniMax-M2.1', 'MiniMax-M2.1-lightning']),
    opencode: Object.freeze(['claude-opus-4-6']),
    zai: Object.freeze(['glm-5']),
    glm: Object.freeze(['glm-5']),
    synthetic: Object.freeze(['hf:MiniMaxAI/MiniMax-M2.1', 'hf:moonshotai/Kimi-K2-Thinking', 'hf:zai-org/GLM-4.7']),
    qianfan: Object.freeze(['model-id']),
    'qwen-portal': Object.freeze(['qwen3-coder-plus', 'qwen3-max', 'qwen3-vl-plus']),
    qwen: Object.freeze(['qwen3-coder-plus', 'qwen3-max', 'qwen3-vl-plus']),
    together: Object.freeze(['moonshotai/Kimi-K2.5']),
    'cloudflare-ai-gateway': Object.freeze(['claude-sonnet-4-5']),
    xiaomi: Object.freeze(['mimo-v2-flash']),
    venice: Object.freeze(['llama-3.3-70b', 'claude-opus-45', 'venice-uncensored', 'qwen3-vl-235b-a22b', 'qwen3-coder-480b-a35b-instruct']),
    huggingface: Object.freeze(['Qwen/Qwen3-235B-A22B-Instruct-2507', 'meta-llama/Llama-3.3-70B-Instruct', 'openai/gpt-oss-120b']),
    vllm: Object.freeze(['your-model-id']),
    nvidia: Object.freeze(['model-id']),
    google: Object.freeze(['gemini-1.5-flash', 'gemini-1.5-pro']),
    groq: Object.freeze(['llama3-8b-8192', 'llama3-70b-8192']),
    'test-local': Object.freeze(['deterministic'])
  });

  const TEMPLATE_MODEL_IDS = Object.freeze(new Set([
    'model-id',
    'your-model-id',
    'coder-model',
    'vision-model'
  ]));

  const PROVIDER_ALIASES = Object.freeze({
    glm: 'zai',
    qwen: 'qwen-portal'
  });

  const GLOBAL_PROVIDER_ORDER = Object.freeze([
    'openai',
    'ollama',
    'openai-codex',
    'anthropic',
    'openrouter',
    'litellm',
    'amazon-bedrock',
    'vercel-ai-gateway',
    'moonshot',
    'kimi-coding',
    'minimax',
    'opencode',
    'zai',
    'glm',
    'synthetic',
    'qianfan',
    'qwen-portal',
    'qwen',
    'together',
    'cloudflare-ai-gateway',
    'xiaomi',
    'venice',
    'huggingface',
    'vllm',
    'nvidia',
    'google',
    'groq',
    'test-local'
  ]);

  const CN_PROVIDER_ORDER = Object.freeze([
    'qwen',
    'glm',
    'moonshot',
    'kimi-coding',
    'minimax',
    'ollama',
    'qwen-portal',
    'zai',
    'synthetic',
    'qianfan',
    'together',
    'xiaomi',
    'openai',
    'openai-codex',
    'anthropic',
    'openrouter',
    'litellm',
    'amazon-bedrock',
    'vercel-ai-gateway',
    'cloudflare-ai-gateway',
    'opencode',
    'venice',
    'huggingface',
    'vllm',
    'nvidia',
    'google',
    'groq',
    'test-local'
  ]);

  const FREE_OPENROUTER_MODELS = Object.freeze([
    Object.freeze({ id: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nemotron 120B (free)', contextWindow: 262144 })
  ]);

  const RETIRED_OPENROUTER_MODELS = Object.freeze(new Set([
    'openrouter/hunter-alpha',
    'openrouter/healer-alpha'
  ]));

  function getFreeOpenRouterModels() {
    return [...FREE_OPENROUTER_MODELS];
  }

  function getDefaultFreeOpenRouterModel() {
    return FREE_OPENROUTER_MODELS[0].id;
  }

  function normalizeModelForProvider(provider, model) {
    const normalizedProvider = normalizeProvider(provider);
    const rawModel = String(model || '').trim();
    if (!rawModel) return getDefaultModel(normalizedProvider);
    if (normalizedProvider === 'openrouter' && RETIRED_OPENROUTER_MODELS.has(rawModel)) {
      return getDefaultFreeOpenRouterModel();
    }
    return rawModel;
  }

  function normalizePolicy(input) {
    const raw = String(
      input?.providerPolicy
      || input?.presetId
      || input
      || 'global-default'
    ).trim();
    return raw === 'cn-mainland' ? 'cn-mainland' : 'global-default';
  }

  function getProviderOrder(input) {
    return normalizePolicy(input) === 'cn-mainland'
      ? [...CN_PROVIDER_ORDER]
      : [...GLOBAL_PROVIDER_ORDER];
  }

  function normalizeProvider(value) {
    const raw = String(value || '').trim();
    if (PROVIDER_MODELS[raw]) return raw;
    const alias = PROVIDER_ALIASES[raw];
    return PROVIDER_MODELS[alias] ? alias : raw;
  }

  function getSupportedModels(provider) {
    const key = normalizeProvider(provider);
    const models = PROVIDER_MODELS[key];
    return Array.isArray(models) ? [...models] : [];
  }

  function isTemplateModelId(value) {
    return TEMPLATE_MODEL_IDS.has(String(value || '').trim().toLowerCase());
  }

  function hasTemplateModels(provider) {
    return getSupportedModels(provider).some((modelId) => isTemplateModelId(modelId));
  }

  function getDefaultProvider(input) {
    return normalizePolicy(input) === 'cn-mainland' ? 'qwen' : 'openai';
  }

  function getDefaultModel(provider) {
    const supported = getSupportedModels(provider);
    return supported[0] || 'gpt-4o-mini';
  }

  function getRecommendedProviders(input, limit = 6) {
    return getProviderOrder(input).slice(0, Math.max(1, Number(limit) || 6));
  }

  function isDiscouragedProvider(provider, input) {
    if (normalizePolicy(input) !== 'cn-mainland') return false;
    const normalized = normalizeProvider(provider);
    return normalized === 'openai' || normalized === 'openai-codex';
  }

  function getProviderWarning(provider, input) {
    if (!isDiscouragedProvider(provider, input)) return '';
    return 'OpenAI providers are discouraged for the mainland-friendly preset because they may require a VPN or may be unreachable. Prefer qwen, glm, moonshot, kimi-coding, minimax, or ollama when possible.';
  }

  function defaultProviderApi(provider) {
    const normalized = String(provider || '').trim();
    if (normalized === 'openai' || normalized === 'ollama' || normalized === 'openrouter') return 'openai-completions';
    if (normalized === 'openai-codex') return 'openai-codex-responses';
    return '';
  }

  function defaultProviderBaseUrl(provider, origin) {
    const normalized = String(provider || '').trim();
    if (normalized === 'openai') {
      return new URL('/api/llm/openai/v1', origin || 'http://localhost').toString();
    }
    if (normalized === 'openrouter') return 'https://openrouter.ai/api/v1';
    if (normalized === 'ollama') return 'http://127.0.0.1:11434/v1';
    return '';
  }

  return {
    PROVIDER_MODELS,
    PROVIDER_ALIASES,
    GLOBAL_PROVIDER_ORDER,
    CN_PROVIDER_ORDER,
    FREE_OPENROUTER_MODELS,
    normalizePolicy,
    normalizeProvider,
    getProviderOrder,
    getSupportedModels,
    isTemplateModelId,
    hasTemplateModels,
    getDefaultProvider,
    getDefaultModel,
    getRecommendedProviders,
    isDiscouragedProvider,
    getProviderWarning,
    defaultProviderApi,
    defaultProviderBaseUrl,
    normalizeModelForProvider,
    getFreeOpenRouterModels,
    getDefaultFreeOpenRouterModel
  };
}));
