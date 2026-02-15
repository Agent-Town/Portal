# huggingface

## Use this when

Use this for Hugging Face routed models.

## UI settings

- `Provider`: `huggingface`
- `Auth mode`: API Key

## Supported Model ID options in current UI

- `Qwen/Qwen3-235B-A22B-Instruct-2507`
- `meta-llama/Llama-3.3-70B-Instruct`
- `openai/gpt-oss-120b`

## Setup notes

- Configure this in either index (`/`) or house (`/house?...`) Mind block.
- If requests fail, verify endpoint, key/token, and model compatibility.
- After connecting, run a smoke prompt: `Reply with exactly: smoke-ok`.

## Related pages

- [Providers Overview](/docs/providers/README.md)
- [Getting Started](/docs/getting-started.md)
