# Working agreements for coding agents

This repo is a **minimal** Agent Town landing page.

## Primary goals

1. **Minimal UI** (no clutter) — keep it single-purpose.
2. **Human + agent co-op** — the unlock flow requires both participants.
3. **Session-token identity** — do not add external identity providers.
4. **Deterministic testability** — every milestone must be verifiable with Playwright.
5. **Wallet-first identity** — each user is represented by their connected wallet; wallet continuity drives session continuity.

## Non-goals / constraints

- Do **not** add point systems, token farming, or engagement hacks.
- Do **not** add heavy frameworks unless absolutely necessary.
- Do **not** introduce real API keys. The Team Code is the only token.

## Commands

Install:
```bash
npm install
```

Dev server:
```bash
npm run dev
```

E2E tests:
```bash
npm test
```

Run a single test file:
```bash
npx playwright test e2e/02_match_unlock.spec.js
```

## Where to change things

- `public/` — HTML/CSS/JS
- `server/` — Express API + session logic
- `e2e/` — Playwright tests (acceptance criteria)
- `specs/` — product + API specifications

## Definition of done

- All Playwright tests pass (`npm test`).
- UX remains minimal.
- API contract stays documented in `specs/02_api_contract.md`.
- Skill remains correct and readable at `/skill.md`.

## Skill Contract Convention (mandatory)

To keep future skill and worker work safe, preserve this convention:

- `public/skill.md` is the source of truth for the external-agent playbook.
- `e2e/55_phase3_skill_contract_line.spec.js` is the baseline contract line for skill compatibility.
- `docs/internal-skill-testline.md` tracks capability-to-test mapping and planned expansions.

When changing skill behavior:

- Update `public/skill.md`.
- Update or extend `e2e/55_phase3_skill_contract_line.spec.js` (or add `e2e/56+` tests).
- Update `docs/internal-skill-testline.md` with the new capability row and coverage.

When changing worker behavior required by skill files (`skill.md` / `SKILL.md`):

- Add deterministic Playwright coverage first (test-first).
- Keep tests API-first and behavior-focused so UI reshuffles do not break contract validation.
- Do not merge worker-skill changes unless the full suite passes (`npm test`).

## New Agent Onboarding Rules (mandatory)

### 1) Worker-first architecture (no backend shortcuts)

- The in-browser OpenClaw Lite worker/runtime is authoritative for agent behavior.
- The server is an API/state backend only; do **not** move agent decision logic into backend handlers.
- Do **not** fake co-op outcomes in server routes (for example: force match/open/share completion server-side).
- If behavior is missing, add/extend a worker tool and route the skill through tools + LLM, not backend hacks.

### 2) Shared-state co-op model

- Human and agent must operate against the same shared state machine.
- Worker should poll state with delay/backoff (not tight loops) and decide next action from that shared state.
- Co-op actions that require both participants (e.g. lock/open, share creation) must remain two-party flows.

### 3) Skill path and execution expectations

- `public/skill.md` is the product playbook source; worker-imported `workspace/.../SKILL.md` is execution input.
- Do not bypass skill execution by manually injecting “next step” behavior into server responses.
- Preserve most-specific-skill selection behavior and single upfront skill-read constraint.

### 4) Tools and observability for debugging

- Keep agent debugging transparent in the agent panel:
  - `Worker Tools` tab: current callable worker tool surface.
  - `Skill Context` tab: imported skill state + extracted `<available_skills>`.
  - `Worker Traffic` tab: outbound/inbound worker/gateway traffic trace (debug visibility).
  - `Session Context` tab: runtime snapshot + transcript/system prompt preview.
- When adding new capability, ensure it is visible through worker tools and traceable in debug tabs.

### 5) Required implementation workflow

- For worker/runtime changes under `vendors/openclaw-lite-main/src/openclaw-lite/*`, rebuild artifacts with:
  - `npm run build:openclaw-lite`
- Keep `public/openclaw-lite/*` in sync with vendor source changes.
- Add deterministic Playwright coverage for each new worker capability and regression risk.

### 6) Session and identity guardrails

- The user identity is the connected wallet (or wallets), not a transient browser credential.
- Team Code is a session token/routing token and should stay hidden from cluttered UX surfaces.
- Team/session identity should be stable across polling/refresh for a live session; avoid regressions that rotate it unexpectedly.

### 7) Brain OAuth and debug-panel guardrails

- OpenAI Codex authentication must use the PKCE flow (`/api/agent/lite/llm/oauth/openai-codex/start` -> `status` -> `exchange`).
- Do not treat OpenAI `id_token` callback URLs as usable model credentials; only access tokens from OAuth exchange are valid.
- Preserve state-based OAuth recovery:
  - `exchange` must be able to resolve the correct attempt from callback `state` when a stale `attemptId` is sent.
  - Do not regress to strict attemptId-only matching.
- Keep the right-side agent debug tabs stable and worker-observable:
  - `Worker Tools`, `Skill Context`, `Worker Traffic`, `Brain`, `Session Context`.
- Keep Worker Traffic behavior stable:
  - card entries, newest-first ordering, filter buttons (`All`, `Incoming`, `Outgoing`).
- If changing any of the above, update deterministic coverage in:
  - `e2e/53_agent_panel_global_presence.spec.js`
  - `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js`
