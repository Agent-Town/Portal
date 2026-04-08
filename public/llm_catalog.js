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
    openrouter: Object.freeze(['anthropic/claude-sonnet-4-5', 'openrouter/hunter-alpha', 'openrouter/healer-alpha', 'nvidia/nemotron-3-super-120b-a12b:free']),
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
    Object.freeze({ id: 'openrouter/hunter-alpha', label: 'Hunter Alpha (free)', contextWindow: 1000000 }),
    Object.freeze({ id: 'openrouter/healer-alpha', label: 'Healer Alpha (free)', contextWindow: 262144 }),
    Object.freeze({ id: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nemotron 120B (free)', contextWindow: 262144 })
  ]);

  function getFreeOpenRouterModels() {
    return [...FREE_OPENROUTER_MODELS];
  }

  function getDefaultFreeOpenRouterModel() {
    return FREE_OPENROUTER_MODELS[0].id;
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

  // API type + base URL maps from pi model registry (all providers).
  const PROVIDER_API_TYPE = {
    'openai': 'openai-completions', 'ollama': 'openai-completions', 'openrouter': 'openai-completions',
    'groq': 'openai-completions', 'cerebras': 'openai-completions', 'xai': 'openai-completions',
    'mistral': 'openai-completions', 'huggingface': 'openai-completions', 'opencode': 'openai-completions',
    'zai': 'openai-completions', 'together': 'openai-completions', 'nvidia': 'openai-completions',
    'vllm': 'openai-completions', 'venice': 'openai-completions', 'litellm': 'openai-completions',
    'cloudflare-ai-gateway': 'openai-completions',
    'anthropic': 'anthropic-messages', 'vercel-ai-gateway': 'anthropic-messages',
    'kimi-coding': 'anthropic-messages', 'minimax': 'anthropic-messages',
    'amazon-bedrock': 'bedrock-converse-stream', 'google': 'google-generative-ai',
    'openai-codex': 'openai-codex-responses',
  };

  const PROVIDER_BASE_URL = {
    'openai': '/api/llm/openai/v1', 'ollama': 'http://127.0.0.1:11434/v1',
    'openrouter': 'https://openrouter.ai/api/v1', 'anthropic': 'https://api.anthropic.com',
    'groq': 'https://api.groq.com/openai/v1', 'cerebras': 'https://api.cerebras.ai/v1',
    'xai': 'https://api.x.ai/v1', 'mistral': 'https://api.mistral.ai/v1',
    'huggingface': 'https://router.huggingface.co/v1', 'opencode': 'https://opencode.ai/zen/v1',
    'zai': 'https://api.z.ai/api/coding/paas/v4', 'together': 'https://api.together.xyz/v1',
    'nvidia': 'https://integrate.api.nvidia.com/v1', 'vllm': 'http://127.0.0.1:8000/v1',
    'venice': 'https://api.venice.ai/api/v1', 'litellm': 'http://127.0.0.1:4000/v1',
    'minimax': 'https://api.minimax.io/anthropic', 'kimi-coding': 'https://api.kimi.com/coding',
    'vercel-ai-gateway': 'https://ai-gateway.vercel.sh',
    'amazon-bedrock': 'https://bedrock-runtime.us-east-1.amazonaws.com',
    'google': 'https://generativelanguage.googleapis.com/v1beta',
    'openai-codex': 'https://chatgpt.com/backend-api',
    'cloudflare-ai-gateway': 'https://gateway.ai.cloudflare.com/v1',
    'moonshot': 'https://api.moonshot.cn/v1', 'qianfan': 'https://qianfan.baidubce.com/v2',
    'qwen': 'https://dashscope.aliyuncs.com/compatible-mode/v1', 'qwen-portal': 'https://chat.qwen.ai/api',
    'glm': 'https://open.bigmodel.cn/api/paas/v4', 'xiaomi': 'https://api.xiaomi.com/v1',
  };

  function defaultProviderApi(provider) {
    return PROVIDER_API_TYPE[String(provider || '').trim()] || '';
  }

  function defaultProviderBaseUrl(provider, origin) {
    const url = PROVIDER_BASE_URL[String(provider || '').trim()];
    if (!url) return '';
    if (url.startsWith('/')) return new URL(url, origin || 'http://localhost').toString();
    return url;
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
    getFreeOpenRouterModels,
    getDefaultFreeOpenRouterModel
  };
}));
