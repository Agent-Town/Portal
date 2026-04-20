# Agent Town: Real-LLM Chat Validation and `test-local` Split

**Document status:** implementation finding / operator runbook  
**Target area:** OpenClaw Lite chat validation in real browsers  
**Recorded on:** 2026-04-20

## Why this note exists

An interactive browser chat can appear to be "broken" when it answers with `pi-ai ok`.

That output does **not** mean the chat path is inherently failing. On this branch it usually means the browser session is still configured to the deterministic test provider instead of a real model provider.

This note exists so the next agent can distinguish:

1. deterministic test-mode chat,
2. real-provider browser chat,
3. provider/tooling bugs that would require code changes.

## Scope

This note is about plain browser chat in the Agent panel, not the Founders Plot Foreman tool-calling path.

The earlier provider-safe tool-name work in [specs/22_founders_plot_real_llm_foreman_and_provider_safe_tools.md](/Users/robin/.codex/worktrees/6b5d/Portal/specs/22_founders_plot_real_llm_foreman_and_provider_safe_tools.md) was still required for real LLM tool calling, but plain text chat itself already works when the browser is actually pointed at a real provider.

## Findings

### F1. Plain chat worked with no additional code changes

Using a real browser and a real OpenRouter model, the prompt:

`What is the opposite of white?`

returned:

`The opposite of white is black.`

No code change was required for that plain-chat path.

### F2. `pi-ai ok` is the deterministic test stub

When the browser session used the deterministic helper/default brain, the same prompt returned:

`pi-ai ok`

That behavior comes from the test-only OpenAI-compatible route in:

- [vendors/openclaw-lite-main/server/routes/llm.js](/Users/robin/.codex/worktrees/6b5d/Portal/vendors/openclaw-lite-main/server/routes/llm.js:118)
- [vendors/openclaw-lite-main/server/routes/llm.js](/Users/robin/.codex/worktrees/6b5d/Portal/vendors/openclaw-lite-main/server/routes/llm.js:414)

Under `NODE_ENV=test`, `POST /api/llm/openai/v1/chat/completions` returns deterministic SSE chunks whose fallback text is `pi-ai ok`.

### F3. The common source of confusion is the shared phase2 helper

The shared E2E helper configures the browser brain to deterministic values unless explicitly overridden:

- [e2e/helpers/phase2.js](/Users/robin/.codex/worktrees/6b5d/Portal/e2e/helpers/phase2.js:256)
- [e2e/helpers/phase2.js](/Users/robin/.codex/worktrees/6b5d/Portal/e2e/helpers/phase2.js:316)

Defaults:

- provider: `test-local`
- model: `deterministic`
- api key: test fixture value

That is correct for deterministic Playwright coverage. It is not evidence of a production chat defect.

## Browser-level evidence

Two headed Chromium runs were performed on this branch.

### Run A: deterministic helper/default brain

Question:

- `What is the opposite of white?`

Observed transcript:

- `pi-ai ok`

Observed LLM request:

- `POST /api/llm/openai/v1/chat/completions`

Interpretation:

- the session was still using the deterministic test provider path
- the canned test route answered as designed

### Run B: real OpenRouter brain

Question:

- `What is the opposite of white?`

Observed transcript:

- `The opposite of white is black.`

Observed LLM request:

- `POST /api/llm/proxy/https%3A%2F%2Fopenrouter.ai%2Fapi%2Fv1/chat/completions`

Observed request model:

- `openai/gpt-4o-mini`

Interpretation:

- the browser was using the real-provider proxy path
- plain chat was functioning correctly

## How to tell which mode you are in

Check the request URL first.

### Deterministic test chat

If chat hits:

- `/api/llm/openai/v1/chat/completions`

and the server is running with `NODE_ENV=test`, then `pi-ai ok` is expected fallback behavior from the test stub.

### Real-provider chat

If chat hits:

- `/api/llm/proxy/<encoded-upstream>/chat/completions`

for example OpenRouter, then the browser is using the real provider path.

## Validation guidance for future agents

When validating real chat in a browser:

1. Do not rely on `hatchAndConnectLite(...)` alone if you need a real model run.
2. Either configure the brain manually in the UI or override the helper defaults before sending chat.
3. Verify the request URL before diagnosing the answer.
4. Treat `pi-ai ok` as a configuration-mode signal first, not as proof of a runtime bug.

## Safe documentation rule

Do not record raw API keys in repo docs, specs, tests, fixtures, or transcripts.

If a future agent needs to document a successful live run, document only:

- provider,
- model,
- request path shape,
- observed answer,
- whether the response came from deterministic test mode or a real provider.
