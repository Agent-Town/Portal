# venice

## Use this when

Use this for Venice provider routes.

## UI settings

- `Provider`: `venice`
- `Auth mode`: API Key

## Supported Model ID options in current UI

- `llama-3.3-70b`
- `claude-opus-45`
- `venice-uncensored`
- `qwen3-vl-235b-a22b`
- `qwen3-coder-480b-a35b-instruct`

## Setup notes

- Configure this in either index (`/`) or house (`/house?...`) Mind block.
- If requests fail, verify endpoint, key/token, and model compatibility.
- After connecting, run a smoke prompt: `Reply with exactly: smoke-ok`.

## Related pages

- [Providers Overview](/docs/providers/README.md)
- [Getting Started](/docs/getting-started.md)
