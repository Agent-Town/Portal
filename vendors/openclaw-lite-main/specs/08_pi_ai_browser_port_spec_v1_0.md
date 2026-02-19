# PI-AI Browser Port — OpenClaw Lite (No Mocks) Spec v1.0

**Status:** Draft (normative)  
**Version:** 1.0.0  
**Audience:** OpenClaw Lite implementers; PI-AI upgraders  
**Scope:** Making **PI-AI** usable in OpenClaw Lite’s browser runtime while keeping upstream security fixes applicable.

This spec is an addendum to:
- `specs/07_openclaw_lite_web_runtime_spec_v1_2.md`
- `specs/02_api_contract.md`

---

## 1) Problem statement

OpenClaw Lite MUST run PI’s agent loop in-browser and MUST use PI-AI’s LLM providers.

However, `@mariozechner/pi-ai`’s package entrypoint eagerly registers built-in providers, including Node-only providers (e.g. AWS Bedrock), which breaks browser bundling and violates Lite’s web-first constraints.

---

## 2) Hard requirements (MUST)

### 2.1 No mocks (MUST)

- Lite MUST NOT include an in-runtime “mock model adapter” (echo / canned completions).
- Lite MUST NOT include injected wallet mocks for ceremony/unlock.
- Tests MAY use deterministic server fixtures, but the runtime code path MUST remain the real PI/PI-AI path.

### 2.2 Upstream security fixes apply (MUST)

To ensure upstream security and transcript hygiene fixes apply to Lite:
- Lite MUST import PI / PI-AI from pinned packages (see `vendor/openclaw-main/package.json` for versions).
- Lite MUST NOT copy/paste PI-AI provider logic into local bespoke implementations.
- Lite MUST keep the port layer minimal and delegate provider behavior to upstream PI-AI modules.

---

## 3) Browser port design (MUST)

### 3.1 Port module (MUST)

The build MUST alias `@mariozechner/pi-ai` to a browser port module that:
- exports `EventStream`
- exports `streamSimple(model, context, options)` compatible with PI agent loop
- exports `validateToolArguments` (MAY be a no-op to avoid CSP `unsafe-eval`)

In this repo, the port module lives at:
- `src/openclaw-lite/pi-ai-browser-port.js`

### 3.2 Provider subset (MUST)

The port module MUST register browser-safe PI provider APIs used by Lite:
- `openai-completions`
- `openai-responses`
- `openai-codex-responses`
- `anthropic-messages`
- `google-generative-ai`
- `google-gemini-cli`
- `google-vertex`
- `azure-openai-responses`

The module MUST NOT register APIs that pull Node-only runtime deps in browser bundles (for example Bedrock via `proxy-agent` / Node HTTP handlers).

### 3.3 Node builtins in browser bundles (MUST)

The bundler MUST treat `node:*` imports as external so that:
- browser builds succeed
- Node-only dynamic imports remain inert at runtime (`process` is undefined in browser)

In this repo this is enforced via an esbuild plugin in:
- `scripts/build_openclaw_lite.mjs`

---

## 4) LLM networking contract (MUST)

Lite MUST call an OpenAI-compatible endpoint via PI-AI providers.

In this repo, Lite MUST default to the same-origin proxy:
- `POST /api/llm/openai/v1/chat/completions`

Rules:
- The server MUST NOT persist API keys.
- In `NODE_ENV=test`, the server MUST respond deterministically for Playwright.
- The browser runtime MUST allowlist the LLM endpoint origin (same-origin in this repo).

---

## 5) Tests (Definition of done)

### 5.1 PI-AI integration test (MUST)

Playwright MUST verify:
- Sending chat from `/lite` results in an assistant response.
- The server observed an LLM proxy call (proves no in-runtime mock adapter).

Test:
- `e2e/openclaw_lite/09_pi_ai_llm_integration.spec.js`

### 5.2 No-mocks bundle gate (MUST)

Playwright MUST fail if Lite bundles contain known mock markers.

Test:
- `e2e/15_openclaw_lite_no_mocks.spec.js`

---

## 6) Upgrade / re-port checklist (MUST)

When updating PI-AI / PI versions:
1) Update pinned versions to match vendored OpenClaw (source of truth: `vendor/openclaw-main/package.json`).
2) Run `npm test`.
3) If bundling fails due to new Node-only imports:
   - ensure `node:*` imports remain externalized
   - adjust `src/openclaw-lite/pi-ai-browser-port.js` to register only browser-safe providers
4) Ensure M8 and no-mocks tests still pass:
   - `e2e/openclaw_lite/09_pi_ai_llm_integration.spec.js`
   - `e2e/15_openclaw_lite_no_mocks.spec.js`
