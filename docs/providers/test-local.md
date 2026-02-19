# test-local

## Use this when

Use this only for deterministic smoke tests.

## UI settings

- `Provider`: `test-local`
- `Auth mode`: API Key

## Supported Model ID options in current UI

- `deterministic`

## Setup notes

- Configure this in either index (`/`) or house (`/house?...`) Mind block.
- If requests fail, verify endpoint, key/token, and model compatibility.
- After connecting, run a smoke prompt: `Reply with exactly: smoke-ok`.
- This is not real model inference.

## Related pages

- [Providers Overview](/docs/providers/README.md)
- [Getting Started](/docs/getting-started.md)
