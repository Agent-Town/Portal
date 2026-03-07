# vllm

## Use this when

Use this when your backend is a vLLM deployment.

## UI settings

- `Provider`: `vllm`
- `Auth mode`: API Key

## Supported Model ID options in current UI

- `your-model-id`

## Setup notes

- Configure this in either index (`/`) or house (`/house?...`) Mind block.
- If requests fail, verify endpoint, key/token, and model compatibility.
- After connecting, run a smoke prompt: `Reply with exactly: smoke-ok`.
- The listed Model ID is a placeholder. Replace it with your deployed model name.

## Related pages

- [Providers Overview](/docs/providers/README.md)
- [Getting Started](/docs/getting-started.md)
