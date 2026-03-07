# openai

## Use this when

Use this for OpenAI-hosted models.

## UI settings

- `Provider`: `openai`
- `Auth mode`: API Key or OpenAI OAuth Profile / Token

## Supported Model ID options in current UI

- `gpt-5.1-codex`
- `gpt-4o`
- `gpt-4o-mini`

## Setup notes

- Configure this in either index (`/`) or house (`/house?...`) Mind block.
- If requests fail, verify endpoint, key/token, and model compatibility.
- After connecting, run a smoke prompt: `Reply with exactly: smoke-ok`.
- OAuth launch in a new tab is supported for this provider.
- Default proxy base URL is /api/llm/openai/v1.

## Related pages

- [Providers Overview](/docs/providers/README.md)
- [Getting Started](/docs/getting-started.md)
