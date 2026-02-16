# Internal: Skill Test Line

Status: Active  
Audience: Engineering only
Last updated: 2026-02-16

## Goal

Keep `skill.md` evolution testable as we:

1. stabilize Agent Town Portal skill behavior,
2. add Moltbook compatibility, and
3. support additional experience websites without regressions.

## Rules

- Every skill capability change must ship with at least one deterministic Playwright test.
- Every worker capability change that is required by `skill.md` must have a route or runtime assertion in tests.
- Keep tests API-first so UI restructuring does not break skill compatibility checks.

## Current Baseline

- Skill contract test file:
  - `e2e/55_phase3_skill_contract_line.spec.js`
- Skill source of truth:
  - `public/skill.md`

## Capability Matrix

| Capability | Source | Worker/runtime dependency | Test coverage |
|---|---|---|---|
| Minimal external agent playbook sections | `public/skill.md` | none | `e2e/55_phase3_skill_contract_line.spec.js` (`skill.md keeps the minimal external-agent contract`) |
| Portal external-agent API route wiring | `server/index.js` | HTTP route handlers | `e2e/55_phase3_skill_contract_line.spec.js` (`minimal skill endpoints are wired as JSON routes`) |
| Home-page co-op unlock/open contract without deterministic shims | `e2e/helpers/phase2.js`, `server/index.js` | helper attempts real `experienceRun` turns first, then uses explicit `/api/agent/select` + `/api/agent/open/press` actions for deterministic contract coverage when external LLM runs are unavailable | `e2e/02_match_unlock.spec.js` (`agent can connect and match the human sigil via co-op API`), `e2e/36_phase1_lite_agent_sigil_match.spec.js` (`human sigil choice is matched by co-op agent action and unlocks open button`), `e2e/37_phase1_lite_agent_open_press.spec.js` (`open press completes signup with co-op agent action and navigates to /create`), `e2e/43_phase2_vendor_sigil_match.spec.js` (`sigil unlock is driven by co-op agent-select action`), `e2e/44_phase2_vendor_open_press.spec.js` (`open transition is completed by co-op agent open-press action`) |
| Visit imports real skill package | `public/app.js`, `public/skill.md` | `gateway.command.visit` -> worker import pipeline | `e2e/56_phase3_skill_visit_worker.spec.js` (`visit imports portal skill and writes compatibility mirrors`) |
| Website-scoped skill workspace layout | worker visit importer | canonical storage under `workspace/skills/<site>/...` plus active-site resolution | `e2e/56_phase3_skill_visit_worker.spec.js` (`visit imports portal skill and writes compatibility mirrors`) |
| `SKILL.md` / `skill.md` compatibility resolution | worker experience resolver | dry-run resolution path for uppercase/lowercase files | `e2e/56_phase3_skill_visit_worker.spec.js` (`experience dry-run resolves uppercase workspace files`) |
| Skill-only experience compatibility | worker experience resolver | `SKILL.md` is required, `HEARTBEAT/GOALS/TOOLS/PENALTY` are optional | `e2e/56_phase3_skill_visit_worker.spec.js` (`experience dry-run succeeds with SKILL-only workspace`) |
| Non-dry-run experience execution path | worker experience resolver | default run path is local `agent-turn` (not test websocket) | `e2e/56_phase3_skill_visit_worker.spec.js` (`experience run defaults to local agent-turn path (no test ws dependency)`) |
| Websocket experience workflow | worker `experience_engine_run` WS mode + server test websocket route | `transport: ws` runs `ws_open/ws_send/ws_recv/ws_close` against deterministic `__test__/experience/ws` endpoint | `e2e/56_phase3_skill_visit_worker.spec.js` (`experience run supports ws transport via local test websocket endpoint`) |
| `http_request` connect payload compatibility | worker `http_request` + server proxy `/api/tools/http_request` | supports typed body, raw JSON string body, and plain object body | `e2e/56_phase3_skill_visit_worker.spec.js` (`http_request accepts raw JSON string/object body for /api/agent/connect`) |
| Agent Town ceremony crypto tool flow | worker tools `agent_town_ceremony_commit` + `agent_town_ceremony_reveal` | local worker generates valid commit/reveal cryptographic payloads and submits `/api/agent/house/commit` + `/api/agent/house/reveal` without deterministic UI/runtime bridge shortcuts | `e2e/56_phase3_skill_visit_worker.spec.js` (`agent-town ceremony tools drive commit/reveal payloads without server-side shortcuts`) |
| Agent Town ceremony randomness + idempotency contract | worker ceremony state keyed by `teamCode` | repeated commit on same team is idempotent; session-rotated/new team commit yields fresh random entropy and key material | `e2e/56_phase3_skill_visit_worker.spec.js` (`agent-town ceremony commit is idempotent per team and random across team reset`) |
| Create-page ceremony completion under real co-op API routes | `public/create.js`, `server/index.js` | regression path drives human+agent commit/reveal through `/api/human/house/*` + `/api/agent/house/*` without deterministic runtime bridge shortcuts | `e2e/38_phase1_create_ceremony_regression.spec.js` (`create flow preserves ceremony + house generation and keeps house-auth meta access`) |
| Same-origin multi-file companion import | worker visit importer (`collectSkillCompanionUrls`) | imports linked `.md`/`.json` files into `workspace/skills/<site>/...` and compatibility mirrors | `e2e/56_phase3_skill_visit_worker.spec.js` (`visit imports same-origin companion files for a skill package`) |
| `web_fetch` cross-origin proxy fallback | worker `runWebFetch` + server `/api/tools/web_fetch` | direct browser fetch failure falls back to session-gated proxy | `e2e/56_phase3_skill_visit_worker.spec.js` (`web_fetch falls back to proxy for cross-origin loopback alias`) |
| Skill run diagnostics (`lastRun*`) | worker `experience_engine_run` + persisted `skillImportV1` metadata | stores `lastRunMode`, `lastRunOk`, `lastRunErrorCode`, `lastRunErrorMessage`, timing metadata | `e2e/56_phase3_skill_visit_worker.spec.js` (`skill diagnostics persist last experience run failure details`) |
| Index approval UX compatibility | `public/index.html` + gateway approval bridge | index flow renders approval queue and allows deterministic approve/reject without worker deadlock | `e2e/56_phase3_skill_visit_worker.spec.js` (`approval requests render in index flow and can be rejected`) |
| Session-rotation runtime recovery | `public/app.js` local runtime bootstrap/connect flow + server `/api/session/reset` | local runtime bootstrap is tab-owned (no server runtime-ready dependency) and auto-reconnects when local LLM config exists | `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`session reset reboots runtime and reconnects OpenClaw Lite with local LLM config`) |
| One-time onboarding clarity + persisted return path | `public/index.html`, `public/app.js` | wallet+brain setup is explicitly one-time in copy; saved local brain auto-restores and auto-connects on return without repeating wallet check | `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`returning user auto-connects with saved brain without repeating wallet/brain setup`) |
| Truthful local “agent active” readiness | `public/app.js` + worker `skillState` bridge | OpenClaw Lite suppresses “ready” when skill import state is failed; `/skill.md` auto-import is attempted after local connect and failures are surfaced | `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`agent readiness status tracks skill import failure and recovery`) |
| House-page OpenClaw export compatibility | `public/house.js` | download delegates to local worker `gateway.command.exportZip` (`openclaw-lite-export.zip`); upload accepts OpenClaw export and legacy house backup zip formats | `e2e/54_agent_state_backup_restore.spec.js` (`house backup stores encrypted state and supports ZIP download/upload restore`) |

## Progress Log

### 2026-02-16

- Confirmed the in-browser worker does not require human copy/paste of `teamCode`.
- Kept `teamCode` hidden in UI to reduce onboarding confusion, while preserving internal session routing.
- Added regression coverage for agent-connect POST body compatibility through `http_request`.
- Added deterministic worker-tool coverage for ceremony commit/reveal crypto execution (`agent_town_ceremony_commit` / `agent_town_ceremony_reveal`) without deterministic UI bridge shortcuts.
- Added deterministic contract coverage for ceremony idempotency vs randomness boundaries (stable per team, fresh across team/session reset).
- Removed deterministic phase2 runtime monkeypatch helper (`e2e/helpers/phase2.js`) and completed the legacy regression rewrite onto explicit co-op API contracts (`e2e/02`, `e2e/36`, `e2e/37`, `e2e/38`, `e2e/43`, `e2e/44`).
- Added fixture-driven multi-file import coverage (`skill.md` + linked `heartbeat.md`, `rules.md`, `messaging.md`, `skill.json`).
- Added deterministic coverage for `web_fetch` direct-to-proxy fallback under cross-origin loopback alias.
- Added persisted skill run diagnostics coverage via `skillState` test API.
- Added deterministic websocket workflow coverage for `experienceRun({ transport: 'ws' })`.
- Added index approval-surface coverage to ensure approval-gated flows can be resolved in the main UI.
- Updated runtime recovery coverage for session rotation to enforce local-runtime-authoritative reconnect behavior (server runtime state is non-authoritative).
- Added deterministic coverage for the persisted return path so users do not repeat wallet/brain setup after first-time onboarding.
- Added deterministic coverage for truthful local readiness semantics (`connected` vs `skill import failed` vs `ready`) with failure/recovery assertions.
- Updated house backup coverage so the downloadable ZIP is OpenClaw-compatible (`openclaw-lite-export`) while preserving encrypted house save/restore continuity.

## Next Planned Expansions

1. Portal skill/worker parity:
- Add tests for `SKILL.md` vs `skill.md` workspace resolution.
- Add tests for real import/visit activation and truthful “agent active” state.

2. Moltbook multi-file package:
- Expand fixture coverage to a Moltbook-shaped package contract (naming + required action semantics).
- Add domain-scoped import assertions that validate compatibility with real Moltbook path conventions.

3. Multi-experience compatibility:
- Add experience contract tests that can be reused per domain.
- Add regression matrix so each new experience includes:
  - import test,
  - required-action test,
  - fallback-network test.

## Change Tracking Convention

When adding/changing skill behavior, update this document with:

- the capability row,
- source files touched,
- test file and test name,
- known gaps if partially implemented.
