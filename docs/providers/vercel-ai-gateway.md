# vercel-ai-gateway

## Use this when

Use this for Vercel AI Gateway setups.

## UI settings

- `Provider`: `vercel-ai-gateway`
- `Auth mode`: API Key

## Supported Model ID options in current UI

- `anthropic/claude-opus-4.6`

## Setup notes

- Configure this in either index (`/`) or house (`/house?...`) Mind block.
- If requests fail, verify endpoint, key/token, and model compatibility.
- After connecting, run a smoke prompt: `Reply with exactly: smoke-ok`.

## Related pages

- [Providers Overview](/docs/providers/README.md)
- [Getting Started](/docs/getting-started.md)
