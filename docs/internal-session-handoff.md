# Internal Session Handoff (2026-02-18)

Status: Active handoff for next coding session.

## Repository Snapshot

- Workspace: `/Users/robin/Projects/Portal-claw-lite`
- Branch: `hatch-openclawlite`
- Baseline skill/worker alignment commit: `7a47be7`
- Latest OAuth reliability commit: `7827f97` (`fix(oauth): resolve pkce state mismatch across retries`)
- Current guidance source files:
  - `AGENTS.md`
  - `docs/internal-skill-adoption-gaps.md`
  - `docs/internal-skill-testline.md`

## What Is Stable Now

1. Worker-first skill execution path is preserved (no backend action shortcuts).
2. Agent panel right-side tabs are active and useful for diagnosis:
   - `Worker Tools`, `Skill Context`, `Worker Traffic`, `Brain`, `Session Context`
3. Worker Traffic UI now uses card entries, newest-first ordering, and direction filters.
4. OpenAI Codex brain auth is PKCE-based with local callback capture:
   - `POST /api/agent/lite/llm/oauth/openai-codex/start`
   - `GET /api/agent/lite/llm/oauth/openai-codex/status`
   - `POST /api/agent/lite/llm/oauth/openai-codex/exchange`
5. OAuth stale-attempt recovery is fixed:
   - exchange resolves by callback `state` when callback input is provided, even if attemptId is stale.
6. Unsupported OpenAI `id_token` callback URLs are rejected with explicit guidance.

## Deterministic Coverage Added/Validated

- `e2e/53_agent_panel_global_presence.spec.js`
  - `agent panel debug tabs expose tools, skill context, traffic, and session context`
  - includes traffic ordering/filter assertions
- `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js`
  - `OpenAI Codex PKCE endpoints start, report status, and exchange code`
  - `OpenAI Codex exchange resolves callback state even when attemptId is stale`
  - `agent panel brain controls configure provider/model/thinking via the same setup pipeline`
  - `agent panel brain completes OpenAI PKCE exchange and configures brain`
  - `agent panel brain rejects OpenAI id_token callback URLs with clear guidance`
  - `state endpoint restores session via team code hint when cookie is missing`

## Last Known Good Test Run

Command:

```bash
npx playwright test e2e/01_home.spec.js e2e/53_agent_panel_global_presence.spec.js e2e/56_phase3_skill_visit_worker.spec.js e2e/57_phase3_onboarding_wallet_llm_persist.spec.js
```

Result:

- `42 passed` on 2026-02-18.

## Critical Guardrails (Do Not Regress)

1. No backend cheating for worker actions; behavior must be worker + tools + LLM.
2. Keep Team Code internal/minimal in UI; preserve stable session identity across poll/refresh.
3. Do not revert to `attemptId`-only OAuth exchange matching.
4. Do not accept OpenAI `id_token` callback URLs as model credentials.
5. Keep debug panel observability and traffic filters intact.

## High-Value Next Work

1. Continue `docs/internal-skill-testline.md` “Next Planned Expansions”:
   - multi-skill conflict/tie-break assertions
   - Moltbook cross-origin import/refresh semantics
   - reusable multi-experience contract matrix
2. Keep adding deterministic tests first for any worker/skill behavior changes.
3. Rebuild Lite artifacts after vendor source edits:

```bash
npm run build:openclaw-lite
```
