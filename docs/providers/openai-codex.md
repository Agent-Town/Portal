# openai-codex

## Use this when

Use this for OpenAI Codex subscription style setup.

## UI settings

- `Provider`: `openai-codex`
- `Auth mode`: API Key or OpenAI OAuth Profile / Token

## Supported Model ID options in current UI

- `gpt-5.3-codex`
- `gpt-5-codex`

## Setup notes

- Configure this in either index (`/`) or house (`/house?...`) Mind block.
- If requests fail, verify endpoint, key/token, and model compatibility.
- After connecting, run a smoke prompt: `Reply with exactly: smoke-ok`.
- OAuth launch in a new tab is supported for this provider.

## Related pages

- [Providers Overview](/docs/providers/README.md)
- [Getting Started](/docs/getting-started.md)

## OpenAI Codex OAuth

You can start OAuth from the UI with **Start OAuth in new tab**.

Equivalent OpenClaw CLI flows:

```bash
openclaw onboard --auth-choice openai-codex
openclaw models auth login --provider openai-codex
```

Paste callback URL, auth profile JSON, or raw token into the OAuth input.
