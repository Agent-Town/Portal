# qwen

## Use this when

Use this alias if you prefer qwen naming in the UI.

## UI settings

- `Provider`: `qwen`
- `Auth mode`: API Key

## Supported Model ID options in current UI

- `qwen3-coder-plus`
- `qwen3-max`
- `qwen3-vl-plus`

## Setup notes

- Configure this in either index (`/`) or house (`/house?...`) Mind block.
- If requests fail, verify endpoint, key/token, and model compatibility.
- After connecting, run a smoke prompt: `Reply with exactly: smoke-ok`.
- Runtime provider normalization maps qwen to qwen-portal.

## Related pages

- [Providers Overview](/docs/providers/README.md)
- [Getting Started](/docs/getting-started.md)
