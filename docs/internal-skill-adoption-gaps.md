# Internal: `skill.md` / `SKILL.md` Adoption Gap Tracker

Status: Active tracker  
Audience: Engineering only (not public docs)  
Goal: Track shortcomings, blockers, and missing pieces for OpenClaw-style skill adoption in Agent Town Portal.
Last updated: 2026-02-18

## Scope

This document covers:

- Compatibility with OpenClaw-style `SKILL.md` format.
- Compatibility with remote site skills (for example `https://moltbook.com/skill.md`).
- Reliable execution by the in-browser worker (including websocket/API workflows).

This document does not define final UX copy or marketing docs.

## Progress Update (2026-02-18)

- OAuth brain setup is now fully PKCE-based for OpenAI Codex on both `/` and `/house`:
  - API contract: `POST /api/agent/lite/llm/oauth/openai-codex/start`, `GET .../status`, `POST .../exchange`.
  - Callback capture server on `http://localhost:1455/auth/callback` remains active for local flow.
  - `id_token` callback URLs remain explicitly unsupported for model calls.
- OAuth retry reliability is improved:
  - Exchange now resolves attempts by callback `state` when callback input is provided, even if UI sends a stale `attemptId`.
  - This fixes repeated `STATE_MISMATCH` failures after multiple OAuth starts/retries.
  - Deterministic regression added: `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`OpenAI Codex exchange resolves callback state even when attemptId is stale`).
- Agent panel observability and control surface is now split and stable:
  - Left panel: chat + actions.
  - Right tabs: `Worker Tools`, `Skill Context`, `Worker Traffic`, `Brain`, `Session Context`.
  - `Brain` tab uses the same pipeline as the primary Brain form (no backend shortcut path).
- Worker Traffic UX is now easier to follow for live debugging:
  - traffic entries render as cards instead of one long text block,
  - newest entries appear first,
  - filter controls allow `All`, `Incoming`, `Outgoing`.
  - Deterministic regression coverage in `e2e/53_agent_panel_global_presence.spec.js`.
- Session continuity hardening is now part of baseline:
  - clients send `x-team-code-hint` automatically when available,
  - server can restore session identity when cookie is missing.
  - Deterministic coverage in `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js`.

## Progress Update (2026-02-17)

- In-browser worker flow is now copy/paste-free for session matching:
  - `teamCode` is still used internally as the session key.
  - `teamCode` is intentionally hidden in UI to avoid user confusion.
  - Runtime context is injected automatically for experience runs.
- Skill playbook route behavior coverage is now expanded beyond JSON route-shape checks:
  - New suite: `e2e/58_phase3_skill_playbook_behavior.spec.js`
  - Coverage now runs worker-first (skill + LLM + tool calls), not direct test-side `/api/agent/*` route driving.
  - Added deterministic worker+LLM co-op loop assertions for repeated `/api/agent/state` semantics (`connect` -> `select` -> `open` -> signup done).
  - Added deterministic worker+LLM canvas collaboration assertions for `/api/agent/canvas/paint` + `/api/agent/canvas/image` with human-visible `/api/canvas/state` verification.
  - Added deterministic worker+LLM single-endpoint `/api/agent/state` progression coverage and `/api/agent/house/connect` reconnect coverage.
  - Added deterministic worker+LLM `/api/agent/share/instructions` readiness/actionable payload coverage.
  - Added deterministic worker+LLM share-create readiness coverage (`/api/share/create` + `/api/agent/share/instructions`) with session + leaderboard propagation checks.
  - Deferred Moltbook post persistence as optional follow-up; current required baseline is share creation only.
  - Worker chat path now auto-imports referenced remote `skill.md` URLs before LLM execution (via worker `visit_import`) and appends authoritative runtime session context (`origin`/`teamCode`/`houseId`) so the model does not re-ask for known values.
  - Worker chat path now also appends authoritative runtime experience state (`experience.step` / selected sigils / open flags) and active imported skill-path guidance to prevent false "missing SKILL.md" or repeated teamCode prompts.
  - Chat runtime alignment is now page-authoritative:
    - page chat sends pass explicit `runtimeContext` + `runtimeState` through gateway to worker (`gateway.chat.send`) so co-op turns do not depend on a separate worker-side `/api/state` snapshot.
  - Worker `experienceRun` path now appends the same authoritative runtime context + runtime experience state + active-skill guidance as chat turns, and accepts page-provided runtime context/state hints for deterministic same-session execution.
  - Poll-turn noise reduction is now active for background loops:
    - home `/` and `/create` loops call `experienceRun` with `recordToTranscript=false` + `emitChat=false`, so periodic poll turns do not bloat session transcript/context.
  - Worker co-op guidance now hard-blocks solo playbook drift:
    - in active `agent_town_coop_v1` turns with human co-op signals present, prompt guidance explicitly prevents switching to `skill_agent_solo.md`.
  - Home-page co-op loop scheduling now prioritizes human-action/team-change nudges (without timer starvation), so mirror/open actions trigger promptly from the worker+LLM path.
  - `/create` ceremony turns now pass runtime context/state into `experienceRun` so commit/reveal actions stay aligned to the active session.
  - Added deterministic regression:
    - `e2e/58_phase3_skill_playbook_behavior.spec.js`
    - Test: `chat auto-imports referenced skill.md URL and injects runtime context into llm turn`
  - Added deterministic regression:
    - `e2e/58_phase3_skill_playbook_behavior.spec.js`
    - Test: `experience run injects runtime context/state hints and active skill guidance into llm turn`
  - Added deterministic regression:
    - `e2e/56_phase3_skill_visit_worker.spec.js`
    - Test: `chat prompt carries runtime team context and active skill guidance after skill import`
  - Added deterministic regression:
    - `e2e/58_phase3_skill_playbook_behavior.spec.js`
    - Test: `chat honors explicit runtime context/state payload from gateway sender`
  - Added deterministic regression:
    - `e2e/56_phase3_skill_visit_worker.spec.js`
    - Test: `experience run can skip transcript persistence for polling turns`
  - Added in-app observability panel split for debugging worker/skill behavior:
    - Left: chat + action controls.
    - Right tabs: `Worker Tools`, `Skill Context`, `Worker Traffic`, `Session Context`.
    - Tabs are hydrated from runtime APIs (`getToolRegistryInfo`, `skillState`, `systemPromptPreview`, transcript dump) so worker behavior is inspectable without manual devtools tracing.
  - Added deterministic UI regression:
    - `e2e/53_agent_panel_global_presence.spec.js`
    - Test: `agent panel debug tabs expose tools, skill context, and session context`
  - Fixed home-page panel flicker (`Setup Station` <-> sigil town panel) by adding a sticky town unlock latch after successful local-brain + agent connect, preventing re-gating on transient agent source-label transitions (`openclaw-lite`/`external`) until brain config is explicitly cleared.
  - Added deterministic regression:
    - `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js`
    - Test: `onboarding visibility stays stable when agent source changes to external after local runtime connect`
  - Hardened refresh-state gating on the home screen:
    - Panel unlock now treats `experience.step=connect_agent` as initial setup (not progress), while preserving unlock for later persisted flow steps.
    - Added deterministic regression:
      - `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js`
      - Test: `refresh keeps team session, town panel visibility, and selected sigil`
  - Added stricter `public/skill.md` line checks for:
    - required-input exclusivity (`teamCode` vs `houseId`),
    - canvas collaboration endpoint guidance (`/api/agent/canvas/paint` + `/api/agent/canvas/image`),
    - runtime-context no-reask wording,
    - practical polling/backoff guidance,
    - minimal curl-loop semantics.
- Gateway runtime surface now matches page integration needs:
  - Default `import('/openclaw-lite/gateway.js')` object now exposes `visitExperience`, `experienceRun`, `skillState`, and `systemPromptPreview` (previously only test helper surface exposed these).
  - This unblocks real `/create` page skill orchestration without falling back to deterministic runtime bridge shortcuts.
- `/create` ceremony flow now follows state-machine polling semantics:
  - Worker loop continuously polls one experience state endpoint (`/api/state`) with bounded delay/backoff.
  - Human actions update state (`/api/human/house/commit`, `/api/human/house/reveal`), worker observes and reacts via SKILL-driven `experienceRun` turns.
  - Deterministic coverage updated in `e2e/03_create_share_leaderboard.spec.js` with scripted LLM tool-call responses for `agent_town_ceremony_commit` / `agent_town_ceremony_reveal`.
- `/create` canvas contribution is again worker-owned on human paint:
  - Human pixel paint now triggers runtime bridge `contributeCanvas`, preserving `/api/agent/canvas/paint` attribution in vendor-runtime ownership checks.
  - Coverage: `e2e/45_phase2_vendor_canvas.spec.js` and `e2e/51_phase2_runtime_action_ownership.spec.js`.
- `http_request` compatibility improved for OpenClaw-style agent behavior:
  - Worker now accepts shorthand request bodies:
    - raw JSON string body
    - plain object body (auto-serialized as JSON)
    - existing typed `{ kind: ... }` body still supported
  - Server `/api/tools/http_request` proxy now accepts the same shorthand body forms.
  - This unblocks `POST /api/agent/connect` in cases where the model emits raw-string JSON.
- Ceremony crypto execution is now tool-addressable in the worker (no server shortcuts):
  - Added `agent_town_ceremony_commit` tool:
    - generates agent reveal entropy + ECDH keypair
    - posts valid `/api/agent/house/commit` payload
  - Added `agent_town_ceremony_reveal` tool:
    - encrypts `sealedForHuman` envelope (`CEREMONY_E2EE_P256_AESGCM_V1`)
    - posts valid `/api/agent/house/reveal` payload
  - Added deterministic worker-tool coverage:
    - `e2e/56_phase3_skill_visit_worker.spec.js`
    - Test: `agent-town ceremony tools drive commit/reveal payloads without server-side shortcuts`
    - Test: `agent-town ceremony commit is idempotent per team and random across team reset`
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
- OpenClaw-style skills registry prompting is now wired in the Lite worker:
  - Workspace context injection no longer inlines `workspace/SKILL.md` / `workspace/skill.md`.
  - Worker builds `<available_skills>` prompt metadata from imported/default skill files.
  - Added deterministic prompt preview bridge:
    - `gateway.command.systemPrompt.preview` -> `worker.systemPrompt.preview`
  - Test: `e2e/56_phase3_skill_visit_worker.spec.js` (`system prompt exposes available_skills without inline SKILL context injection`)
- Multi-skill prompt selection baselines are now covered:
  - Worker canonicalizes skills registry candidates by import metadata (`finalUrl` / `sourceUrl`) so compatibility mirrors do not duplicate prompt entries.
  - Skills prompt ordering is now most-specific-first for imported skill paths.
  - System prompt keeps explicit single-upfront-read constraint language for skill selection.
  - Tests:
    - `multi-skill prompt preview prefers most-specific imported skill and keeps single upfront read constraint`
    - `repeat multi-skill prompt preview keeps deterministic available_skills ordering`
- Skill import refresh/version metadata is now normalized and persisted:
  - `skillImportV1` now stores deterministic `importedFiles` entries (`path`, `sourceUrl`, `finalUrl`, `etag`, `lastModified`, `sha256B64`) alongside `importedPaths`.
  - Repeat visit imports produce stable path ordering and metadata snapshots.
  - Test: `e2e/56_phase3_skill_visit_worker.spec.js` (`repeat visit keeps deterministic imported metadata ordering`)
- Moltbook-shaped multi-file fixture compatibility now has deterministic coverage:
  - Added fixture package under `public/fixtures/moltbook.com/playbooks/agent-town/` (`skill.md`, `heartbeat.md`, `messaging.md`, `rules.md`, `skill.json`).
  - Test: `e2e/56_phase3_skill_visit_worker.spec.js` (`visit imports Moltbook-shaped package files and preserves domain-like path conventions`)
- Agent-active readiness is now tied to skill import state:
  - Index status now treats OpenClaw Lite as not-ready when worker skill state is explicitly `failed`.
  - App auto-imports `/skill.md` after local connect (one-shot per team session) so users do not need a manual visit step.
  - Import failures now surface explicitly in UI status (`skill import failed`) until recovery.
  - Test: `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`agent readiness status tracks skill import failure and recovery`)
- Deterministic phase2 test shims were removed from helper flow (`e2e/helpers/phase2.js`):
  - no runtime monkeypatch that auto-selects/auto-opens/auto-ceremony via test bridge
  - helper loops now try real `experienceRun` turns first, then fall back to explicit co-op `/api/agent/*` actions for deterministic coverage when external LLM execution is unavailable
- Legacy phase unlock/open/create regressions were rewritten to the non-shimmed co-op contract:
  - updated tests: `e2e/02_match_unlock.spec.js`, `e2e/36_phase1_lite_agent_sigil_match.spec.js`, `e2e/37_phase1_lite_agent_open_press.spec.js`, `e2e/38_phase1_create_ceremony_regression.spec.js`, `e2e/43_phase2_vendor_sigil_match.spec.js`, `e2e/44_phase2_vendor_open_press.spec.js`
  - create flow regression now drives agent ceremony commit/reveal with valid browser-crypto payloads through real API routes (no deterministic bridge shortcut)
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

## G-005: OpenClaw-like skills registry prompt behavior (baseline addressed)

- Type: Behavioral drift
- Severity: Medium
- Problem: Historical behavior injected workspace files directly; baseline parity now uses `<available_skills>` metadata with on-demand skill reads.
- Evidence:
  - Lite prompt builder now emits `## Skills (mandatory)` with `<available_skills>` entries.
  - Deterministic preview route exposes final prompt (`gateway.command.systemPrompt.preview`).
  - Registry candidate selection de-duplicates compatibility mirrors using persisted import metadata and sorts skill entries by specificity.
  - Coverage: `e2e/56_phase3_skill_visit_worker.spec.js` (`system prompt exposes available_skills without inline SKILL context injection`).
  - Coverage: `e2e/56_phase3_skill_visit_worker.spec.js` (`multi-skill prompt preview prefers most-specific imported skill and keeps single upfront read constraint`).
  - Coverage: `e2e/56_phase3_skill_visit_worker.spec.js` (`repeat multi-skill prompt preview keeps deterministic available_skills ordering`).
- Impact: Baseline OpenClaw prompting model is aligned for multi-skill imports; remaining work is runtime tie-break behavior when descriptions are equally specific.

## G-006: Remote skill multi-file conventions normalization (partially addressed)

- Type: Missing feature
- Severity: Medium
- Problem: Discovery/import for linked `.md`/`.json` companions is implemented and refresh metadata is now normalized, but domain-specific conventions are still evolving.
- Evidence:
  - Companion parsing/import in worker (`collectSkillCompanionUrls`, `runVisitImport`).
  - Persisted `skillImportV1` now includes deterministic `importedFiles` metadata (`etag`/`lastModified`/`sha256B64`) and stable ordering across repeat imports.
  - Coverage: `e2e/56_phase3_skill_visit_worker.spec.js` (`repeat visit keeps deterministic imported metadata ordering`).
  - Coverage: `e2e/56_phase3_skill_visit_worker.spec.js` (`visit imports Moltbook-shaped package files and preserves domain-like path conventions`).
- Impact: Refresh/version normalization and Moltbook-shaped package baseline are in place; remaining compatibility risk is mainly cross-origin/domain policy variance.

## G-007: Approval UI dependency addressed in index flow

- Type: UX hardening
- Severity: Low
- Problem: Previously, missing approval UI could stall approval-gated actions; index now renders approvals and gateway has a deadlock-safe fallback.
- Evidence:
  - `public/index.html` includes `#approvals` panel in agent sidebar.
  - Gateway auto-reject guard when no approvals node exists.
  - Deterministic Playwright coverage in `e2e/56_phase3_skill_visit_worker.spec.js`.
- Impact: Approval requests are now explicit and resolvable in index flow; missing-surface deadlock is removed.

## G-008: “Agent active” status now reflects skill readiness (addressed)

- Type: Observability hardening
- Severity: Low
- Problem: Previously, connected/ready status could be true even when no skill was imported.
- Evidence:
  - Index readiness now reads worker skill state and blocks “ready” while skill state is failed.
  - Automatic default import uses `/skill.md` after local connection and surfaces failure state.
- Impact: UI now avoids false “ready” when skill import is broken and exposes clear recovery feedback.

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
