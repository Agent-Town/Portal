# Working Agreements (OpenClaw Lite Repo)

This repo is a **minimal** standalone OpenClaw Lite runtime (browser + server storage).

## Primary goals

1. Minimal UI (single-purpose Gateway Panel).
2. Human + agent co-op: runtime actions are approval-gated.
3. Session-token identity (cookie only). No external identity providers.
4. Deterministic testability: every milestone is verifiable with Playwright.
5. OpenClaw compatibility: exported artifacts and transcripts are OpenClaw-compatible.

## Hard requirements

- PI (pi-mono) is required: use PI agent loop + PI-AI provider path.
- No mocks for wallet or LLM in the runtime.
  - Tests may use deterministic server fixtures, but the runtime path must remain real.
- Do not commit real API keys.
- Keep the API contract accurate at `specs/02_api_contract.md`.

## Commands

Install:
```bash
git submodule update --init --recursive
npm install
```

Dev:
```bash
npm run dev
```

E2E tests:
```bash
npm test
```

Single test file:
```bash
npx playwright test e2e/openclaw_lite/09_pi_ai_llm_integration.spec.js
```

## Where to change things

- `public/` — HTML/CSS/JS pages (`/lite`, `/town`, `/house`)
- `src/` — Worker runtime + wallet + shared libs (bundled by `scripts/build_openclaw_lite.mjs`)
- `server/` — Express API + server storage
- `e2e/` — Playwright tests (acceptance criteria)
- `specs/` — product + API specifications

## Definition of done

- All Playwright tests pass (`npm test`).
- UX remains minimal.
- OpenClaw compatibility gates pass.
- Specs stay in sync with implementation.

