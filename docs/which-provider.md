# Which Provider Should I Pick?

Use this page if you are unsure whether to pick an API provider, a subscription provider, or a local provider.

## Quick recommendation

- If privacy and local control matter most: choose `ollama` (local).
- If you already pay for Codex-style subscription access: choose `openai-codex` (OAuth flow).
- If you want broad hosted model choice and predictable integrations: choose an API-key provider.

## Three provider types

### 1) API-based providers

You authenticate with an API key and pay by usage.

Typical examples in this UI:

- `openai`, `anthropic`, `openrouter`, `moonshot`, `minimax`, `groq`, `google`, `huggingface`, `together`, `zai` (and others)

What this implies:

- Cost: usually pay-per-token (input + output). Higher usage means higher cost.
- Token availability: limited by provider rate limits and your plan/quotas.
- Privacy: prompts/responses leave your machine and are processed by a remote provider.

### 2) Subscription-based providers

You authenticate with an account/subscription flow (OAuth-like) instead of a classic API key.

Typical example in this UI:

- `openai-codex`

What this implies:

- Cost: fixed subscription fee, but usage may still have soft limits/fair-use policies.
- Token availability: not truly infinite; practical throughput and limits can still apply.
- Privacy: prompts/responses are still processed by the remote service.

### 3) Local providers

Inference runs on your own machine or your own local network service.

Typical examples in this UI:

- `ollama`
- `test-local` (deterministic testing only, not real inference)

Also possible depending on your setup:

- `vllm` or `litellm` can be local if you point them to your own local endpoint.

What this implies:

- Cost: no per-token cloud bill; you pay hardware + electricity + setup effort.
- Token availability: bounded by your CPU/GPU speed, VRAM/RAM, and model limits.
- Privacy: strongest by default when endpoint is local (for example `127.0.0.1`).

## Side-by-side comparison

| Type | Cost model | Token availability | Privacy |
|---|---|---|---|
| API-based | Pay per token/request | Provider quotas + rate limits | Data sent to remote provider |
| Subscription-based | Fixed subscription (plus policy limits) | Fair-use / session / throughput limits may apply | Data sent to remote provider |
| Local | Hardware + power, no per-token cloud fee | Your hardware throughput + model context limits | Data can stay local |

## Important nuance: endpoint decides locality

Provider name alone does not fully determine privacy.

- If `Base URL` points to a remote host, requests are remote.
- If `Base URL` points to local host (`127.0.0.1`/`localhost`), requests stay local.
- `Use Proxy` routes through the app server path, but final privacy still depends on the final upstream endpoint.

## Practical default for Agent Town Portal

For a strict local-first setup:

1. Set `Provider` to `ollama`.
2. Use a local model (for example `gpt-oss:20b`).
3. Keep base URL local (`http://127.0.0.1:11434/v1`).
4. Run a smoke test prompt after connecting.

## Related pages

- [Getting Started](/docs/getting-started.md)
- [Providers Overview](/docs/providers/README.md)
