# ollama

## Use this when

Use this for local-first inference with Ollama.

## UI settings

- `Provider`: `ollama`
- `Auth mode`: API Key

## Supported Model ID options in current UI

- `gpt-oss:20b`
- `gpt-oss:120b`
- `llama3.3`
- `llama3.2:latest`
- `qwen2.5:7b`

## Setup notes

- Configure this in either index (`/`) or house (`/house?...`) Mind block.
- If requests fail, verify endpoint, key/token, and model compatibility.
- After connecting, run a smoke prompt: `Reply with exactly: smoke-ok`.
- Default base URL is http://127.0.0.1:11434/v1.
- A non-empty API Key field is still required by the current UI validation.

## Related pages

- [Providers Overview](/docs/providers/README.md)
- [Getting Started](/docs/getting-started.md)

## Local quick command

```bash
ollama pull gpt-oss:20b
```
