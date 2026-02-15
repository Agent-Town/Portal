# Providers Overview

These pages mirror the provider options currently shown in the Agent Town Portal UI (index and house pages).

If you are not sure what to choose, start here first:
- [Which Provider Should I Pick?](/docs/which-provider.md)

## Provider pages

- [openai](/docs/providers/openai.md)
- [ollama](/docs/providers/ollama.md)
- [openai-codex](/docs/providers/openai-codex.md)
- [anthropic](/docs/providers/anthropic.md)
- [openrouter](/docs/providers/openrouter.md)
- [litellm](/docs/providers/litellm.md)
- [amazon-bedrock](/docs/providers/amazon-bedrock.md)
- [vercel-ai-gateway](/docs/providers/vercel-ai-gateway.md)
- [moonshot](/docs/providers/moonshot.md)
- [kimi-coding](/docs/providers/kimi-coding.md)
- [minimax](/docs/providers/minimax.md)
- [opencode](/docs/providers/opencode.md)
- [zai](/docs/providers/zai.md)
- [glm](/docs/providers/glm.md)
- [synthetic](/docs/providers/synthetic.md)
- [qianfan](/docs/providers/qianfan.md)
- [qwen-portal](/docs/providers/qwen-portal.md)
- [qwen](/docs/providers/qwen.md)
- [together](/docs/providers/together.md)
- [cloudflare-ai-gateway](/docs/providers/cloudflare-ai-gateway.md)
- [xiaomi](/docs/providers/xiaomi.md)
- [venice](/docs/providers/venice.md)
- [huggingface](/docs/providers/huggingface.md)
- [vllm](/docs/providers/vllm.md)
- [nvidia](/docs/providers/nvidia.md)
- [google](/docs/providers/google.md)
- [groq](/docs/providers/groq.md)
- [test-local](/docs/providers/test-local.md)

## Alias behavior

The UI includes alias providers for naming compatibility:

- `glm` resolves to runtime provider `zai`
- `qwen` resolves to runtime provider `qwen-portal`

## OAuth flow

`Start OAuth in new tab` is available for OpenAI providers.

- `openai`
- `openai-codex`

## Notes on model lists

Model dropdown values come from the current front-end mappings. Some entries are placeholders (`model-id`, `your-model-id`) and require your real provider-specific model name.
