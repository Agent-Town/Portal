# cloudflare-ai-gateway

## Use this when

Use this for Cloudflare AI Gateway routes.

## UI settings

- `Provider`: `cloudflare-ai-gateway`
- `Auth mode`: API Key

## Supported Model ID options in current UI

- `claude-sonnet-4-5`

## Setup notes

- Configure this in either index (`/`) or house (`/house?...`) Mind block.
- If requests fail, verify endpoint, key/token, and model compatibility.
- After connecting, run a smoke prompt: `Reply with exactly: smoke-ok`.

## Related pages

- [Providers Overview](/docs/providers/README.md)
- [Getting Started](/docs/getting-started.md)
