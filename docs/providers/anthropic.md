# anthropic

## Use this when

Use this for Anthropic-hosted models.

## UI settings

- `Provider`: `anthropic`
- `Auth mode`: API Key

## Supported Model ID options in current UI

- `claude-opus-4-6`
- `claude-3-5-sonnet-20240620`
- `claude-3-5-haiku-20241022`

## Setup notes

- Configure this in either index (`/`) or house (`/house?...`) Mind block.
- If requests fail, verify endpoint, key/token, and model compatibility.
- After connecting, run a smoke prompt: `Reply with exactly: smoke-ok`.

## Related pages

- [Providers Overview](/docs/providers/README.md)
- [Getting Started](/docs/getting-started.md)
