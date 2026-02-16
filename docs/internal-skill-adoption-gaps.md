# Internal: `skill.md` / `SKILL.md` Adoption Gap Tracker

Status: Active tracker  
Audience: Engineering only (not public docs)  
Goal: Track shortcomings, blockers, and missing pieces for OpenClaw-style skill adoption in Agent Town Portal.
Last updated: 2026-02-16

## Scope

This document covers:

- Compatibility with OpenClaw-style `SKILL.md` format.
- Compatibility with remote site skills (for example `https://moltbook.com/skill.md`).
- Reliable execution by the in-browser worker (including websocket/API workflows).

This document does not define final UX copy or marketing docs.

## Progress Update (2026-02-16)

- In-browser worker flow is now copy/paste-free for session matching:
  - `teamCode` is still used internally as the session key.
  - `teamCode` is intentionally hidden in UI to avoid user confusion.
  - Runtime context is injected automatically for experience runs.
- `http_request` compatibility improved for OpenClaw-style agent behavior:
  - Worker now accepts shorthand request bodies:
    - raw JSON string body
    - plain object body (auto-serialized as JSON)
    - existing typed `{ kind: ... }` body still supported
  - Server `/api/tools/http_request` proxy now accepts the same shorthand body forms.
  - This unblocks `POST /api/agent/connect` in cases where the model emits raw-string JSON.
- Test coverage added for the connect-body issue:
  - `e2e/56_phase3_skill_visit_worker.spec.js`
  - Test: `http_request accepts raw JSON string/object body for /api/agent/connect`
- Multi-file package import is now covered with deterministic same-origin fixtures:
  - `e2e/56_phase3_skill_visit_worker.spec.js`
  - Test: `visit imports same-origin companion files for a skill package`
- `web_fetch` direct-to-proxy fallback now has deterministic loopback coverage:
  - `e2e/56_phase3_skill_visit_worker.spec.js`
  - Test: `web_fetch falls back to proxy for cross-origin loopback alias`
- Skill diagnostics now capture and expose last run outcome:
  - persisted in worker `skillImportV1`
  - surfaced via worker state/test hook
  - Test: `skill diagnostics persist last experience run failure details`
- Websocket experience workflow now has deterministic test coverage:
  - server exposes `__test__/experience/ws` in `NODE_ENV=test`
  - Test: `experience run supports ws transport via local test websocket endpoint`
- Index flow now has approval UI surface with safe fallback:
  - `#approvals` queue rendered in agent panel sidebar
  - gateway auto-rejects when approval UI surface is missing (prevents deadlock)
  - Test: `approval requests render in index flow and can be rejected`
- Vendor runtime/connect is now local-runtime-authoritative after human session rotation:
  - `public/app.js` bootstrap/connect no longer depends on server `lite.runtimeReady` or server runtime boot/error endpoints.
  - concurrent bootstrap calls share one in-flight promise.
  - stale hatch status (`OpenClaw Lite runtime is starting…`) is cleared once local runtime bootstrap completes.
  - server `/api/agent/lite/connect` no longer blocks on server runtime boot flags.
  - Test: `session reset reboots runtime and reconnects OpenClaw Lite with local LLM config`
- Onboarding copy and state now explicitly describe one-time setup:
  - setup UI labels now call out one-time wallet verification and locally saved brain config.
  - welcome panel stays hidden once onboarding is complete, reducing repeat-flow confusion.
  - status messaging now reflects persisted-brain reconnect path (`Starting local runtime…` / `Brain saved. Connecting agent…` / `Agent ready.`).
  - Test: `returning user auto-connects with saved brain without repeating wallet/brain setup`
- House-page brain download is now OpenClaw-compatible for external portability:
  - `Download ZIP backup` now triggers local worker export (`gateway.command.exportZip`) and emits `openclaw-lite-export.zip`.
  - Upload parser accepts both legacy house backup ZIPs and OpenClaw export ZIPs.
  - `Store in house` / `Restore from house` remains the persisted encrypted path for full local-first continuity.
  - Test: `e2e/54_agent_state_backup_restore.spec.js` (`house backup stores encrypted state and supports ZIP download/upload restore`)
- Existing Phase 3 tests remain green after this update.

## Baseline Snapshot (Previous Analysis)

This section captures the earlier analysis verbatim in normalized form, then maps each point to tracker IDs.

1. `visit` is a no-op today.
- UI sends `visit`: `public/app.js:1805`
- Gateway ignores it: `vendors/openclaw-lite-main/src/openclaw-lite/gateway.js:1074`
- Mapping: `G-001`

2. No skill import pipeline exists.
- Worker has `skill_fetch` and `workspace_write_file`, but nothing wires them into startup/visit.
- Evidence: `vendors/openclaw-lite-main/src/openclaw-lite/worker.js:1337`, `vendors/openclaw-lite-main/src/openclaw-lite/worker.js:1415`
- Mapping: `G-002`

3. `SKILL.md` handling is inconsistent.
- Prompt injection expects uppercase `SKILL.md`.
- Experience runner expects lowercase `skill.md`.
- Core bootstrap does not create either file by default.
- Evidence: `vendors/openclaw-lite-main/src/openclaw-lite/worker.js:1741`, `vendors/openclaw-lite-main/src/openclaw-lite/worker.js:2731`, `vendors/openclaw-lite-main/src/openclaw-lite/worker.js:2319`
- Mapping: `G-003`

4. WebSocket experience path points to non-existent server endpoint.
- Default URL uses `.../__test__/experience/ws`.
- No matching WS route in server.
- Evidence: `vendors/openclaw-lite-main/src/openclaw-lite/worker.js:2757`, `server/index.js:3266` (test HTTP route exists, WS route absent)
- Mapping: `G-004`

5. Cross-origin grant UX was incomplete on index.
- Worker required cross-origin grant/approval for `web_fetch`/`ws_open`.
- Approval rendering depended on `#approvals`.
- Index lacked that surface.
- Evidence: `vendors/openclaw-lite-main/src/openclaw-lite/worker.js:131`, `vendors/openclaw-lite-main/src/openclaw-lite/gateway.js:104`, `vendors/openclaw-lite-main/src/openclaw-lite/gateway.js:638`
- Mapping: `G-007`

6. “Agent active” was not tied to skill readiness.
- Connection status came from session/runtime connect, not skill import + first successful skill action.
- Evidence: `server/index.js:1706`, `public/app.js:806`
- Mapping: `G-008`

7. Local providers still required non-empty credential in current UI/runtime flow.
- Evidence: `public/app.js:687`, `public/house.js:961`, `public/openclaw-lite/llm-config-library.js:60`
- Mapping: `G-011`

8. OpenClaw compatibility gap.
- OpenClaw behavior: compact available-skills metadata + on-demand `SKILL.md` read.
- Current Lite path: direct workspace file injection with no full skills registry/import lifecycle.
- Evidence: OpenClaw docs (`system-prompt` skills section) and current worker prompt pipeline.
- Mapping: `G-005`

9. External skills are multi-file in practice.
- Example: Moltbook uses `skill.md`, `heartbeat.md`, `messaging.md`, `rules.md`, `skill.json`.
- Therefore compatibility needs package-style import, not single-file fetch.
- Mapping: `G-006`

10. Recommended direction from prior analysis.
- Replace `visit` with import/connect flow.
- Normalize `SKILL.md`/`skill.md`.
- Align prompting with OpenClaw skills list behavior.
- Redefine “active” readiness semantics.
- Decide network mode tradeoff.
- Mapping: `Implementation-Readiness Checklist` + `Missing Decisions`

## Confirmed Gaps

## G-001: `visit` flow is a no-op

- Type: Functional blocker
- Severity: High
- Problem: UI sends a `visit` command, but gateway drops it, so no skill import/connection actually happens.
- Evidence:
  - `public/app.js:1805`
  - `public/openclaw-lite/gateway.js:961`
  - `vendors/openclaw-lite-main/src/openclaw-lite/gateway.js:1074`
- Impact: External experience flow appears available but does nothing.

## G-002: Skill package importer scope is still partial

- Type: Missing feature
- Severity: Medium
- Problem: A deterministic importer now exists for same-origin multi-file packages, but external-domain policy/refresh behavior still needs hardening.
- Evidence:
  - Visit import orchestration in worker (`runVisitImport`) persists `skill.md` + companion docs.
  - Deterministic fixture test validates package import + persistence (`e2e/56_phase3_skill_visit_worker.spec.js`).
- Impact: Core package import works; remaining work is policy parity for more external domains.

## G-003: File naming mismatch (`SKILL.md` vs `skill.md`)

- Type: Functional inconsistency
- Severity: High
- Problem: Different subsystems expect different casing/paths.
- Evidence:
  - Prompt context uses `workspace/SKILL.md`: `vendors/openclaw-lite-main/src/openclaw-lite/worker.js:1741`
  - Experience runner expects lowercase files: `vendors/openclaw-lite-main/src/openclaw-lite/worker.js:2731`
  - Core bootstrap does not create either skill file by default: `vendors/openclaw-lite-main/src/openclaw-lite/worker.js:2319`
- Impact: Non-deterministic behavior and missing-file failures.

## G-004: Experience websocket path is test-scoped

- Type: Scope/architecture gap
- Severity: Low
- Problem: `__test__/experience/ws` now exists for deterministic tests, but websocket experience execution remains intentionally test-scoped.
- Evidence:
  - Worker ws transport route in experience runner.
  - Test websocket endpoint served only under `NODE_ENV=test`.
- Impact: Production path remains `agent-turn` by design; ws mode is currently a harness-only compatibility lane.

## G-005: No OpenClaw-like skills registry prompt behavior

- Type: Behavioral drift
- Severity: Medium
- Problem: Current Lite prompt injects workspace files directly; it does not provide a compact skills list and on-demand read flow equivalent to OpenClaw.
- Evidence:
  - Lite context file injection path: `vendors/openclaw-lite-main/src/openclaw-lite/worker.js:1762`
  - OpenClaw docs expect available-skills metadata and read-on-demand behavior.
- Impact: Diverges from internet-standard OpenClaw skill behavior and scaling model.

## G-006: Remote skill multi-file conventions are not normalized

- Type: Missing feature
- Severity: Medium
- Problem: Discovery/import for linked `.md`/`.json` companions is implemented, but refresh/versioning and domain-specific conventions are not fully standardized yet.
- Evidence:
  - Companion parsing/import in worker (`collectSkillCompanionUrls`, `runVisitImport`).
  - Fixture-backed coverage for `skill.md`, `heartbeat.md`, `rules.md`, `messaging.md`, `skill.json`.
- Impact: Partial compatibility and brittle execution on third-party sites.

## G-007: Approval UI dependency addressed in index flow

- Type: UX hardening
- Severity: Low
- Problem: Previously, missing approval UI could stall approval-gated actions; index now renders approvals and gateway has a deadlock-safe fallback.
- Evidence:
  - `public/index.html` includes `#approvals` panel in agent sidebar.
  - Gateway auto-reject guard when no approvals node exists.
  - Deterministic Playwright coverage in `e2e/56_phase3_skill_visit_worker.spec.js`.
- Impact: Approval requests are now explicit and resolvable in index flow; missing-surface deadlock is removed.

## G-008: “Agent active” status is not tied to successful skill readiness

- Type: Observability gap
- Severity: Medium
- Problem: Connected/ready status can be true even if no skill has been imported/parsed/executed.
- Evidence:
  - Session connect gate is session/hatch based and no longer tied to server runtime boot state: `server/index.js` `/api/agent/lite/connect`
  - UI status derives from connection source/runtime state.
- Impact: False confidence for users; hard to debug “active but not working”.

## G-009: Browser panel/iframe path does not solve integration for most external sites

- Type: Architecture limitation
- Severity: Medium
- Problem: Many sites block embedding (`X-Frame-Options`, `frame-ancestors`) and same-origin policy blocks DOM control anyway.
- Evidence:
  - Runtime behavior and site headers observed during analysis (Moltbook, Google).
- Impact: iFrame strategy cannot be primary interoperability mechanism.

## G-010: Local-first + proxy fallback is implemented, but missing skill-specific validation coverage

- Type: Testing gap
- Severity: Low
- Problem: Network fallback behavior exists, but there are no explicit E2E tests for:
  - multi-domain websocket compatibility beyond the local harness endpoint
- Evidence:
  - `e2e/56_phase3_skill_visit_worker.spec.js` covers remote package import + proxy fallback + websocket workflow.
- Impact: Regressions likely during upcoming skill-adoption refactors.

## G-011: Local-provider credential handling still creates friction

- Type: UX/product gap
- Severity: Low
- Problem: Current setup still expects a non-empty credential in paths where local inference could be credential-free.
- Evidence:
  - Local config handling in UI/runtime paths.
- Impact: Adds onboarding friction and user confusion.

## G-012: Proxy hardening exists but policy surface is still broad

- Type: Security/ops gap
- Severity: Medium
- Problem: Relay is now session-gated and same-origin-context-gated, but upstream scope and observability are still coarse for long-term production.
- Evidence:
  - Guard middleware added on `/api/llm` and `/api/tools`.
- Impact: Acceptable for prototype, but future abuse/cost diagnostics will be harder.

## Missing Decisions

- D-001: Canonical workspace casing/path policy (`SKILL.md` vs `skill.md`) and migration behavior.
- D-002: Skill import destination structure (`workspace/skills/<host>/...`) and conflict rules.
- D-003: Minimal required file set for “skill ready” state.
- D-004: Whether to emulate OpenClaw prompt semantics exactly (skills list + mandatory on-demand read) or intentionally diverge.
- D-005: Exact definition of “agent active” for UX (connected vs skill-loaded vs first successful run).

## Implementation-Readiness Checklist

- [x] Replace dead `visit` command with real import-and-activate flow.
- [x] Implement remote skill package importer (single + multi-file).
- [x] Normalize `SKILL.md` path strategy and backward-compat shims.
- [x] Add index-page approval surface or remove approval dependency for relevant actions.
- [x] Add explicit state machine for `skill: not_loaded | loading | ready | failed`.
- [x] Add E2E coverage for remote import and fallback routing.
- [x] Add E2E coverage for websocket workflows.
- [x] Add diagnostics view/log lines for skill source, import time, and last parse/run failure.

## Notes

- This tracker is intentionally internal and can be edited aggressively as implementation evolves.
- Once stable, public-facing docs should be derived from the finalized behavior, not from this draft.
