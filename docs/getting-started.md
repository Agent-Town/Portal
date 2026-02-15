# Getting Started

This page helps first-time users get an agent talking as fast as possible.

## 1) Start the app

```bash
npm install
npm run dev
```

Open the URL printed by the dev server.

## 2) Open Mind configuration

You can configure the same block in either location:

- Index page (`/`) in hatch step: **Give it a Mind**
- House page (`/house?...`) in agent state panel: **Mind configuration**

## 3) Choose provider and model

- `Provider` is the backend runtime/vendor.
- `Model ID` options change when provider changes.
- `Auth mode` can be:
  - `API Key`
  - `OpenAI OAuth Profile / Token` (OpenAI providers)

## 4) Recommended local setup (Ollama)

If you want local inference without external cloud credentials:

```bash
ollama pull gpt-oss:20b
```

Then set:

- `Provider`: `ollama`
- `Model ID`: `gpt-oss:20b`
- `Auth mode`: `API Key`
- `API Key`: any non-empty placeholder (required by current UI)
- `Use Proxy`: enabled

`Base URL` defaults to `http://127.0.0.1:11434/v1` for `ollama`.

## 5) Connect and smoke test

Click `Connect Brain`, then send:

`Reply with exactly: smoke-ok`

If everything is working, the model should answer with `smoke-ok`.

## 6) Backup and restore

Mind settings are included in agent state backup/restore in the house flow:

- Save includes provider/model/auth/base URL/proxy and relevant local state.
- Restore reapplies those settings into the same Mind block.

## Troubleshooting

- If chat UI is ready but no answer appears, check Agent Comms logs and network errors on `/api/llm/...`.
- If you switched providers, verify `Model ID` updated to a model supported by that provider.
- `test-local` is for deterministic tests and not real model inference.

## Next

- Decision guide: [Which Provider Should I Pick?](/docs/which-provider.md)
- Provider-specific setup: [Providers Overview](/docs/providers/README.md)
