# Internal: Skill Test Line

Status: Active  
Audience: Engineering only
Last updated: 2026-04-20

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
| Required-input + polling/backoff + curl-loop guidance stays explicit in contract text | `public/skill.md` | none | `e2e/55_phase3_skill_contract_line.spec.js` (`skill.md keeps the minimal external-agent contract`) |
| Preference-aware runtime guidance stays explicit in the external-agent contract | `public/skill.md`, `public/app.js`, `public/create.js` | runtime/session context carries `experiencePreference`; skill text requires locale-aware replies, no language-path re-ask, and blocked-service avoidance when policy hints say so | `e2e/55_phase3_skill_contract_line.spec.js` (`skill.md keeps the minimal external-agent contract`), `e2e/128_preference_session_context_visibility.spec.js` (`session context diagnostics expose the active experience preference`) |
| Portal external-agent API route wiring | `server/index.js` | HTTP route handlers | `e2e/55_phase3_skill_contract_line.spec.js` (`minimal skill endpoints are wired as JSON routes`) |
| Worker+LLM co-op loop executes connect/select/open skill actions end-to-end | `public/skill.md`, `server/index.js` | deterministic scripted LLM stream emits tool calls; worker executes `workspace_read_file` + `http_request` to drive `/api/agent/connect`, `/api/agent/state`, `/api/agent/select`, `/api/agent/open/press` | `e2e/58_phase3_skill_playbook_behavior.spec.js` (`worker+llm skill run drives connect/match/open co-op loop with no direct test-side agent API calls`) |
| Chat-triggered remote skill import + runtime-context injection | `vendors/openclaw-lite-main/src/openclaw-lite/worker.js` | `gateway.chat.send` preflights referenced `skill.md` URLs through worker `visit_import` and appends authoritative runtime context (`origin`/`teamCode`/`houseId`), runtime experience state, and active skill-path guidance before LLM turn | `e2e/58_phase3_skill_playbook_behavior.spec.js` (`chat auto-imports referenced skill.md URL and injects runtime context into llm turn`), `e2e/56_phase3_skill_visit_worker.spec.js` (`chat prompt carries runtime team context and active skill guidance after skill import`) |
| Chat runtime state stays aligned with page session context | `public/app.js`, `vendors/openclaw-lite-main/src/openclaw-lite/gateway.js`, `vendors/openclaw-lite-main/src/openclaw-lite/worker.js` | page chat sends include explicit `runtimeContext` + `runtimeState`; gateway forwards these in `gateway.chat.send`; worker uses supplied snapshot first (fallback to `/api/state` only when needed) before composing chat LLM context | `e2e/58_phase3_skill_playbook_behavior.spec.js` (`chat honors explicit runtime context/state payload from gateway sender`) |
| Co-op guard blocks solo-playbook drift in active co-op turns | `vendors/openclaw-lite-main/src/openclaw-lite/worker.js` | co-op prompt guidance marks `agent_town_coop_v1` as authoritative and explicitly disallows switching to `skill_agent_solo.md` while human co-op signals are present | `e2e/56_phase3_skill_visit_worker.spec.js` (`chat prompt carries runtime team context and active skill guidance after skill import`) |
| Experience-run runtime-context/state injection for worker-driven turns | `public/app.js`, `public/create.js`, `vendors/openclaw-lite-main/src/openclaw-lite/worker.js` | page loops pass `runtimeContext` + `runtimeState` into `experienceRun`; worker injects authoritative runtime context, experience state, active skill-path guidance, and co-op no-reask guidance into the LLM turn | `e2e/58_phase3_skill_playbook_behavior.spec.js` (`experience run injects runtime context/state hints and active skill guidance into llm turn`) |
| Background poll turns do not pollute worker transcript/session context | `public/app.js`, `public/create.js`, `vendors/openclaw-lite-main/src/openclaw-lite/worker.js` | loop-driven `experienceRun` accepts `recordToTranscript=false` + `emitChat=false`; worker executes turn and diagnostics without persisting periodic poll prompts/replies into transcript | `e2e/56_phase3_skill_visit_worker.spec.js` (`experience run can skip transcript persistence for polling turns`) |
| Worker+LLM canvas collaboration executes agent paint/snapshot actions | `public/skill.md`, `server/index.js` | deterministic scripted LLM stream executes `http_request` for `/api/agent/canvas/paint` + `/api/agent/canvas/image`; human canvas state confirms painted pixel | `e2e/58_phase3_skill_playbook_behavior.spec.js` (`worker+llm skill run supports collaborative canvas paint actions via agent API`) |
| Worker+LLM ceremony + reconnect flow executes commit/reveal/connect actions with a single polling endpoint | `public/skill.md`, `server/index.js` | deterministic scripted LLM stream drives `agent_town_ceremony_commit`, `agent_town_ceremony_reveal`, and `http_request` routes using `/api/agent/state` for step polling plus `/api/agent/house/connect` for reconnect | `e2e/58_phase3_skill_playbook_behavior.spec.js` (`worker+llm skill run drives ceremony commit/reveal and house reconnect checks`) |
| Worker+LLM share creation + helper flow reaches share-ready state | `public/skill.md`, `server/index.js` | deterministic scripted LLM stream executes `http_request` for `/api/share/create` and `/api/agent/share/instructions`; share persistence verified via `/api/agent/state` + leaderboard | `e2e/58_phase3_skill_playbook_behavior.spec.js` (`worker+llm skill run creates share and exposes helper instructions without direct test-side share API calls`) |
| Worker+LLM house vault note append uses runtime house recovery + encrypted append path | `public/skill.md`, `vendors/openclaw-lite-main/src/openclaw-lite/worker.js`, `server/index.js` | runtime tools `agent_town_house_recover` + `agent_town_house_append_note` recover house key context and append encrypted note via `/api/house/:id/append` | `e2e/58_phase3_skill_playbook_behavior.spec.js` (`worker+llm skill run recovers house context and appends encrypted vault note`) |
| Home-page co-op unlock/open contract without deterministic shims | `e2e/helpers/phase2.js`, `server/index.js` | helper attempts real `experienceRun` turns first, then uses explicit `/api/agent/select` + `/api/agent/open/press` actions for deterministic contract coverage when external LLM runs are unavailable | `e2e/02_match_unlock.spec.js` (`agent can connect and match the human sigil via co-op API`), `e2e/36_phase1_lite_agent_sigil_match.spec.js` (`human sigil choice is matched by co-op agent action and unlocks open button`), `e2e/37_phase1_lite_agent_open_press.spec.js` (`open press completes signup with co-op agent action and navigates to /create`), `e2e/43_phase2_vendor_sigil_match.spec.js` (`sigil unlock is driven by co-op agent-select action`), `e2e/44_phase2_vendor_open_press.spec.js` (`open transition is completed by co-op agent open-press action`) |
| Visit imports real skill package | `public/app.js`, `public/skill.md` | `gateway.command.visit` -> worker import pipeline | `e2e/56_phase3_skill_visit_worker.spec.js` (`visit imports portal skill and writes compatibility mirrors`) |
| Website-scoped skill workspace layout | worker visit importer | canonical storage under `workspace/skills/<site>/...` plus active-site resolution | `e2e/56_phase3_skill_visit_worker.spec.js` (`visit imports portal skill and writes compatibility mirrors`) |
| OpenClaw-style skills registry prompt contract | worker prompt builder + gateway/worker preview bridge | `runAgentTurn` prompt path emits `<available_skills>` metadata and no longer injects `SKILL.md` as workspace context; test API uses `gateway.command.systemPrompt.preview` | `e2e/56_phase3_skill_visit_worker.spec.js` (`system prompt exposes available_skills without inline SKILL context injection`) |
| Multi-skill selection ordering + single upfront read contract | worker prompt builder + skills registry candidate selection | `<available_skills>` entries are sorted most-specific-first and system prompt explicitly enforces one upfront `workspace_read_file` after selection | `e2e/56_phase3_skill_visit_worker.spec.js` (`multi-skill prompt preview prefers most-specific imported skill and keeps single upfront read constraint`) |
| Multi-skill prompt ordering determinism across repeat imports | worker prompt builder + `skillImportV1` metadata canonicalization | skills prompt de-duplicates compatibility mirrors by imported source metadata and keeps stable ordering across repeat `visit` imports | `e2e/56_phase3_skill_visit_worker.spec.js` (`repeat multi-skill prompt preview keeps deterministic available_skills ordering`) |
| `SKILL.md` / `skill.md` compatibility resolution | worker experience resolver | dry-run resolution path for uppercase/lowercase files | `e2e/56_phase3_skill_visit_worker.spec.js` (`experience dry-run resolves uppercase workspace files`) |
| Skill-only experience compatibility | worker experience resolver | `SKILL.md` is required, `HEARTBEAT/GOALS/TOOLS/PENALTY` are optional | `e2e/56_phase3_skill_visit_worker.spec.js` (`experience dry-run succeeds with SKILL-only workspace`) |
| Non-dry-run experience execution path | worker experience resolver | default run path is local `agent-turn` (not test websocket) | `e2e/56_phase3_skill_visit_worker.spec.js` (`experience run defaults to local agent-turn path (no test ws dependency)`) |
| Websocket experience workflow | worker `experience_engine_run` WS mode + server test websocket route | `transport: ws` runs `ws_open/ws_send/ws_recv/ws_close` against deterministic `__test__/experience/ws` endpoint | `e2e/56_phase3_skill_visit_worker.spec.js` (`experience run supports ws transport via local test websocket endpoint`) |
| `http_request` connect payload compatibility | worker `http_request` + server proxy `/api/tools/http_request` | supports typed body, raw JSON string body, and plain object body | `e2e/56_phase3_skill_visit_worker.spec.js` (`http_request accepts raw JSON string/object body for /api/agent/connect`) |
| Agent Town ceremony crypto tool flow | worker tools `agent_town_ceremony_commit` + `agent_town_ceremony_reveal` | local worker generates valid commit/reveal cryptographic payloads and submits `/api/agent/house/commit` + `/api/agent/house/reveal` without deterministic UI/runtime bridge shortcuts | `e2e/56_phase3_skill_visit_worker.spec.js` (`agent-town ceremony tools drive commit/reveal payloads without server-side shortcuts`) |
| Agent Town ceremony randomness + idempotency contract | worker ceremony state keyed by `teamCode` | repeated commit on same team is idempotent; session-rotated/new team commit yields fresh random entropy and key material | `e2e/56_phase3_skill_visit_worker.spec.js` (`agent-town ceremony commit is idempotent per team and random across team reset`) |
| Create-page ceremony completion under real co-op API routes | `public/create.js`, `server/index.js` | regression path drives human+agent commit/reveal through `/api/human/house/*` + `/api/agent/house/*` without deterministic runtime bridge shortcuts | `e2e/38_phase1_create_ceremony_regression.spec.js` (`create flow preserves ceremony + house generation and keeps house-auth meta access`) |
| Create-page worker polling reacts to human ceremony state changes | `public/create.js`, `server/index.js`, `public/openclaw-lite/gateway.js` | `/create` runs bounded polling/backoff loop over `/api/state` (single experience poll endpoint with `experience.step` + `nextAgentAction`) and executes skill turns (`experienceRun`) to publish agent commit/reveal while human actions progress | `e2e/03_create_share_leaderboard.spec.js` (`co-op open -> co-create -> generate house -> unlock with wallet signature`) |
| Create-page runtime worker contributes agent canvas paint after human paint | `public/create.js`, `public/openclaw-lite/runtime-bridge.js` | human paint triggers runtime bridge `contributeCanvas` call so worker-owned `/api/agent/canvas/paint` updates stay visible and attributable | `e2e/45_phase2_vendor_canvas.spec.js` (`create canvas shows runtime agent contribution through agent paint API`), `e2e/51_phase2_runtime_action_ownership.spec.js` (`vendor runtime bridge owns sigil, open, canvas, and ceremony agent actions`) |
| Same-origin multi-file companion import | worker visit importer (`collectSkillCompanionUrls`) | imports linked `.md`/`.json` files into `workspace/skills/<site>/...` and compatibility mirrors | `e2e/56_phase3_skill_visit_worker.spec.js` (`visit imports same-origin companion files for a skill package`) |
| Moltbook-shaped multi-file package compatibility | fixture package under `public/fixtures/moltbook.com/...` + worker visit importer | imports domain-like package paths and preserves required-action docs (`skill.md` + `heartbeat.md` + `messaging.md` + `rules.md` + `skill.json`) under site-scoped workspace layout | `e2e/56_phase3_skill_visit_worker.spec.js` (`visit imports Moltbook-shaped package files and preserves domain-like path conventions`) |
| Skill import refresh/version metadata normalization | worker visit importer + persisted `skillImportV1` snapshot | stores deterministic per-file metadata (`path`, `sourceUrl`, `finalUrl`, `etag`, `lastModified`, `sha256B64`) and stable ordering across repeat imports | `e2e/56_phase3_skill_visit_worker.spec.js` (`repeat visit keeps deterministic imported metadata ordering`) |
| `web_fetch` cross-origin proxy fallback | worker `runWebFetch` + server `/api/tools/web_fetch` | direct browser fetch failure falls back to session-gated proxy | `e2e/56_phase3_skill_visit_worker.spec.js` (`web_fetch falls back to proxy for cross-origin loopback alias`) |
| Skill run diagnostics (`lastRun*`) | worker `experience_engine_run` + persisted `skillImportV1` metadata | stores `lastRunMode`, `lastRunOk`, `lastRunErrorCode`, `lastRunErrorMessage`, timing metadata | `e2e/56_phase3_skill_visit_worker.spec.js` (`skill diagnostics persist last experience run failure details`) |
| Index approval UX compatibility | `public/index.html` + gateway approval bridge | index flow renders approval queue and allows deterministic approve/reject without worker deadlock | `e2e/56_phase3_skill_visit_worker.spec.js` (`approval requests render in index flow and can be rejected`) |
| Session-rotation runtime recovery | `public/app.js` local runtime bootstrap/connect flow + server `/api/session/reset` | local runtime bootstrap is tab-owned (no server runtime-ready dependency) and auto-reconnects when local LLM config exists | `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`session reset reboots runtime and reconnects OpenClaw Lite with local LLM config`) |
| One-time onboarding clarity + persisted return path | `public/index.html`, `public/app.js` | wallet+brain setup is explicitly one-time in copy; saved local brain auto-restores and auto-connects on return without repeating wallet check | `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`returning user auto-connects with saved brain without repeating wallet/brain setup`) |
| Home onboarding/town visibility remains stable when agent source label changes | `public/app.js` | vendor onboarding/town panel uses a sticky unlock latch after first successful local-brain + agent-connect state, and does not re-gate on transient source-label flips (`openclaw-lite`/`external`) until brain config is explicitly cleared | `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`onboarding visibility stays stable when agent source changes to external after local runtime connect`) |
| Home refresh preserves co-op session/panel/sigil continuity | `public/app.js`, `server/index.js` | panel gating follows persisted session progress (`human/agent/match/open/signup`) and non-initial `experience.step` values while keeping initial `connect_agent` in setup path | `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`refresh keeps team session, town panel visibility, and selected sigil`) |
| Agent panel runtime observability tabs expose worker tools + skill context + worker traffic + session context | `public/index.html`, `public/styles.css`, `public/app.js` | split panel keeps chat/actions on the left and renders live worker observability tabs on the right (tool registry, skill import/prompt extraction, worker send/recv traffic, transcript+runtime context) | `e2e/53_agent_panel_global_presence.spec.js` (`agent panel debug tabs expose tools, skill context, traffic, and session context`) |
| Agent panel Worker Traffic cards keep newest-first ordering and directional filtering | `public/index.html`, `public/styles.css`, `public/app.js` | worker traffic pane renders card-based entries with epoch metadata and filter controls (`all`/`in`/`out`) for live traceability | `e2e/53_agent_panel_global_presence.spec.js` (`agent panel debug tabs expose tools, skill context, traffic, and session context`) |
| Agent panel Brain tab uses the same local Brain setup pipeline as primary setup UI | `public/index.html`, `public/app.js` | mirrored brain controls sync provider/model/auth/thinking + save/clear into shared local LLM config path | `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`agent panel brain controls configure provider/model/thinking via the same setup pipeline`) |
| OpenAI Codex PKCE API contract (`start`/`status`/`exchange`) | `server/index.js`, `specs/02_api_contract.md` | in-memory OAuth attempt registry, localhost callback capture, PKCE code exchange, account-id extraction | `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`OpenAI Codex PKCE endpoints start, report status, and exchange code`) |
| PKCE exchange recovers from stale attempt IDs by resolving callback `state` | `server/index.js`, `public/app.js`, `public/house.js` | callback input (`code` + `state`) can bind exchange to the matching active attempt in-session, avoiding retry dead-ends | `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`OpenAI Codex exchange resolves callback state even when attemptId is stale`) |
| OpenAI `id_token` callback URLs are rejected with explicit guidance | `public/app.js`, `public/house.js` | OAuth/token parser blocks unsupported callback token type and surfaces corrective message | `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`agent panel brain rejects OpenAI id_token callback URLs with clear guidance`) |
| Session restore path works when cookie is missing but `x-team-code-hint` is available | `public/app.js`, `public/house.js`, `server/index.js` | client auto-sends team-code hint header and server rebinds same team session identity | `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`state endpoint restores session via team code hint when cookie is missing`) |
| Truthful local “agent active” readiness | `public/app.js` + worker `skillState` bridge | OpenClaw Lite suppresses “ready” when skill import state is failed; `/skill.md` auto-import is attempted after local connect and failures are surfaced | `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js` (`agent readiness status tracks skill import failure and recovery`) |
| House-page OpenClaw export compatibility | `public/house.js` | download delegates to local worker `gateway.command.exportZip` (`openclaw-lite-export.zip`); upload accepts OpenClaw export and legacy house backup zip formats | `e2e/54_agent_state_backup_restore.spec.js` (`house backup stores encrypted state and supports ZIP download/upload restore`) |
| Trainer namespace discovery + feature flag gating | `public/trainer_namespace_plugin.js`, `public/trainer.js`, `public/app.js`, `server/index.js` | plugin-constrained `trainer.*` registry is visible only when `featureFlags.trainerNamespace` resolves true | `e2e/98_trainer_namespace_contract_harness.spec.js` (`trainer namespace tools are discoverable when enabled and hidden when disabled`) |
| Trainer namespace read-only introspection tools | `public/trainer_namespace_plugin.js`, `public/trainer.js` | `trainer.list_runs`, `trainer.get_run`, `trainer.get_event`, `trainer.get_session_context` return deterministic payloads | `e2e/99_trainer_namespace_read_tools.spec.js` (`trainer namespace read tools return deterministic run, event, and session context payloads`) |
| Trainer namespace dynamic action catalog bridge | `public/trainer_namespace_plugin.js`, `public/trainer.js`, `public/skill_actions_plugin.js` | `trainer.list_actions` reflects active skill action extraction and switches atomically across skill changes | `e2e/100_trainer_namespace_action_catalog.spec.js` (`trainer.list_actions reflects active skill and updates after skill switch`) |
| Trainer namespace action invocation bridge | `public/trainer_namespace_plugin.js`, `public/trainer.js`, `public/skill_actions_plugin.js` | `trainer.invoke_action` executes skill action requests with provided params and deterministic failure codes | `e2e/101_trainer_namespace_invoke_action.spec.js` (`trainer.invoke_action validates inputs and executes action requests with provided params`) |
| Trainer namespace evidence freshness + expiry loop | `public/trainer_namespace_plugin.js`, `public/trainer.js` | `trainer.list_evidence` supports deterministic freshness filtering and expiry-window evaluation | `e2e/102_trainer_namespace_evidence_loop.spec.js` (`trainer.list_evidence supports deterministic freshness and expiry windows after invoke_action`) |
| Trainer namespace transcript integrity + not-used diagnostics | `public/trainer_namespace_plugin.js`, `public/trainer.js`, `public/app.js` | `trainer.get_transcript_integrity` and `trainer.explain_not_used` surface reason codes and align with Session Context diagnostics | `e2e/103_trainer_namespace_diagnostics.spec.js` (`trainer diagnostics tools expose transcript integrity + not-used reasons and align with Session Context diagnostics`) |
| Trainer namespace approval-gated destructive tools | `public/trainer_namespace_plugin.js`, `public/trainer.js` | `trainer.delete_trace` / `trainer.clear_traces` require one-time approval tokens with TTL and deterministic failure paths | `e2e/104_trainer_namespace_approval_gate.spec.js` (`trainer destructive tools require approval token, allow one operation, and expire deterministically`) |
| Trainer namespace budgets + recursion guards | `public/trainer_namespace_plugin.js` | per-turn/per-window budgets and recursion blocking enforce deterministic `TRAINER_RATE_LIMITED` and `TRAINER_RECURSION_BLOCKED` outcomes | `e2e/105_trainer_namespace_rate_limit_recursion.spec.js` (`trainer namespace enforces rate limits and blocks recursive dispatch attempts deterministically`) |
| Trainer namespace redaction in diagnostics and debug panes | `public/trainer_namespace_plugin.js`, `public/app.js` | secret-like values are masked in trainer namespace outputs/audit snapshots and agent debug surfaces | `e2e/106_trainer_namespace_redaction.spec.js` (`trainer namespace redacts secret-like values from diagnostics and avoids leaking raw secrets into debug panes`) |
| Trainer namespace human-agent coop verification loop | `public/trainer_namespace_plugin.js`, `public/trainer.js` | builder demonstration + repeat invocation + evidence-backed verification flow remains deterministic in trainer tooling | `e2e/107_trainer_namespace_coop_canvas.spec.js` (`trainer namespace supports a deterministic human-agent coop loop for canvas verification`) |
| Experience UI intent tools (modal open / Atlas search / Pony compose) | `public/skill.md`, `public/app.js`, `vendors/openclaw-lite-main/src/openclaw-lite/gateway.js`, `vendors/openclaw-lite-main/src/openclaw-lite/worker.js` | worker tools `agent_town_ui_open_modal`, `agent_town_ui_atlas_search`, `agent_town_ui_pony_compose` dispatch through strict browser intent whitelist; no route replacement, no arbitrary DOM access | `e2e/108_experience_intent_open_modal.spec.js`, `e2e/109_experience_intent_atlas_search.spec.js`, `e2e/110_experience_intent_pony_compose.spec.js` |
| Experience intent continuity + policy guards | `public/app.js`, `vendors/openclaw-lite-main/src/openclaw-lite/gateway.js` | deterministic intent envelope + trace, team/worker continuity under multi-intent flow, deterministic rejection codes (`UI_INTENT_UNKNOWN`, `UI_INTENT_INVALID_PARAM`, `CONFIRMATION_REQUIRED`) | `e2e/111_experience_intent_worker_continuity.spec.js`, `e2e/112_experience_intent_policy_negative.spec.js` |
| Founders Plot modal + foreman tool contract | `public/skill.md`, `public/app.js`, `server/founders_plot/*`, `vendors/openclaw-lite-main/src/openclaw-lite/gateway.js`, `vendors/openclaw-lite-main/src/openclaw-lite/worker.js` | Founders Plot stays modal-first in the town shell; worker exposes typed `et.plot.*`, contract, standing-order, and scheduler tools plus `founders-plot` modal open path; approvals remain explicit and deterministic | `e2e/132_founders_plot_registry_handoff.spec.js`, `e2e/133_founders_plot_runtime_contract.spec.js`, `e2e/134_founders_plot_resume_recap.spec.js`, `e2e/145_founders_plot_v11_ui_surfaces.spec.js` |
| Founders Plot V1.2 living-town + worker-owned foreman loop contract | `public/skill.md`, `public/experiences/founders-plot/tools.md`, `public/experiences/founders-plot/goals.md`, `public/app.js`, `server/founders_plot/*`, `vendors/openclaw-lite-main/src/openclaw-lite/gateway.js`, `vendors/openclaw-lite-main/src/openclaw-lite/worker.js` | skill/docs name the V1.2 tool family (`et.plot.town.get_signals`, `et.plot.town.upgrade_landmark`, `et.plot.journal.get_entries`), recurring requesters, soft-deadline `PREPARATION` contracts, and the requirement that `Run now` executes through the OpenClaw Lite worker command path | `e2e/146_founders_plot_v12_worker_owned_tick.spec.js`, `e2e/147_founders_plot_v12_living_contract_deck.spec.js`, `e2e/148_founders_plot_v12_town_signals_and_journal.spec.js`, `e2e/149_founders_plot_v12_public_square_coin_sink.spec.js`, `e2e/150_founders_plot_v12_recap_and_ui.spec.js`, `e2e/55_phase3_skill_contract_line.spec.js` |
| Founders Plot V1.2 hardening runtime-truth + in-session scheduler contract | `public/skill.md`, `public/experiences/founders-plot/manifest.json`, `public/experiences/founders-plot/heartbeat.md`, `public/experiences/founders-plot/tools.md`, `public/app.js`, `server/founders_plot/*`, `vendors/openclaw-lite-main/src/openclaw-lite/gateway.js`, `vendors/openclaw-lite-main/src/openclaw-lite/worker.js` | the only shipped scheduler preset is `COLLECT_READY_OUTPUTS`, it runs only through the in-session OpenClaw Lite worker loop, Foreman mutations require worker-origin metadata, and reloads require a fresh Clover start before any routine can run again | `e2e/151_founders_plot_v12_hardening_scheduler_interval.spec.js`, `e2e/152_founders_plot_v12_hardening_worker_origin.spec.js`, `e2e/153_founders_plot_v12_hardening_contract_scoring.spec.js`, `e2e/154_founders_plot_v12_hardening_pack_contract.spec.js`, `e2e/155_founders_plot_v12_hardening_reload_runtime_truth.spec.js`, `e2e/55_phase3_skill_contract_line.spec.js` |

## Progress Log

### 2026-04-20

- Added the V1.2 hardening contract for in-session Clover scheduling, worker-origin-only Foreman mutations, manifest/heartbeat parity, and truthful restart-after-reload behavior (`e2e/151` to `e2e/155`).
- Extended the Founders Plot skill/runtime contract to V1.2 living-town behavior: recurring requesters, town signals, Town Journal access, and the Public Square Welcome Sign.
- Closed the Foreman integrity gap by moving `Run now` onto an OpenClaw Lite worker-owned command path and covering the audit events end-to-end (`e2e/146_founders_plot_v12_worker_owned_tick.spec.js`).
- Added deterministic V1.2 coverage for the living contract deck, signal/journal mutations, the Public Square coin sink, and the updated UI surfaces (`e2e/147` to `e2e/150`).
- Extended the Founders Plot skill/runtime contract to include V1.1 contract, standing-order, and scheduler tools.
- Added browser-level V1.1 UI surface coverage for the Current Goal, Contract Board, Standing Order controls, Foreman status, Plan Card, and receipt corrections (`e2e/145_founders_plot_v11_ui_surfaces.spec.js`).
- Updated the worker contract baseline to schema version 2 and the refined V1.1 bounded tool family.

### 2026-04-18

- Added Founders Plot experience-pack + registry coverage, modal-only district entry, and reconnect/open CTA handoff into the first city-builder slice.
- Added deterministic worker/runtime coverage for the bounded `et.plot.*` foreman tool family, including approval requests and blocked-mutation behavior.
- Added persistence/resume coverage for Founders Plot recap, replay hash parity, and read-only public summary hooks.

### 2026-02-26

- Added Experience OS intent tool contract coverage (`e2e/108` to `e2e/112`) for modal-only UI actions, Atlas modal search execution, Pony compose prefill, continuity, and policy-negative guardrails.
- Added worker/gateway/app plumbing for `agent_town_state_*` + `agent_town_ui_*` tool families and documented modal-only UI intent policy in `public/skill.md`.

### 2026-02-22

- Added plugin-constrained `trainer.*` namespace coverage for discovery, read tools, dynamic action catalogs, and action invocation (`e2e/98` to `e2e/101`).
- Added deterministic trainer namespace evidence lifecycle coverage (`freshOnly` and expiry windows) via `e2e/102_trainer_namespace_evidence_loop.spec.js`.
- Added transcript-integrity and not-used diagnostics parity coverage between trainer tools and Session Context tab (`e2e/103_trainer_namespace_diagnostics.spec.js`).
- Added approval-gated destructive trainer tool coverage with one-time token + TTL semantics (`e2e/104_trainer_namespace_approval_gate.spec.js`).
- Added trainer namespace policy guard coverage for per-turn/window rate limits and recursion blocks (`e2e/105_trainer_namespace_rate_limit_recursion.spec.js`).
- Added redaction coverage for trainer diagnostics/debug panes and cooperative canvas verification loop coverage (`e2e/106_trainer_namespace_redaction.spec.js`, `e2e/107_trainer_namespace_coop_canvas.spec.js`).

### 2026-02-18

- Added deterministic PKCE OAuth contract coverage for OpenAI Codex (`start`/`status`/`exchange`) and state-rebind recovery when `attemptId` is stale.
- Added deterministic guard coverage for unsupported OpenAI `id_token` callback URLs.
- Documented and validated that the Agent panel `Brain` tab drives the same local Brain setup pipeline as primary setup controls.
- Expanded Agent panel traffic observability coverage to enforce newest-first card ordering and direction filters (`All`/`Incoming`/`Outgoing`).
- Added session continuity coverage for cookie-miss recovery via `x-team-code-hint`.

### 2026-02-17

- Strengthened line-level `skill.md` contract assertions for required-input exclusivity, runtime-context no-reask guidance, practical polling/backoff guidance, and minimal curl-loop semantics.
- Added deterministic worker+LLM scripted tool-call coverage for skill-driven co-op loop progression (connect -> mirror sigil -> open press -> signup complete) without direct test-side `/api/agent/*` calls.
- Added deterministic worker+LLM scripted tool-call coverage for collaborative canvas paint behavior (`/api/agent/canvas/paint` + `/api/agent/canvas/image`) with human-visible canvas-state verification.
- Added deterministic worker+LLM scripted tool-call coverage for ceremony commit/reveal + single-endpoint `/api/agent/state` progression + `/api/agent/house/connect` reconnect behavior.
- Added deterministic worker+LLM scripted tool-call coverage for `/api/share/create` + `/api/agent/share/instructions` flow persistence through `/api/agent/state` + leaderboard surfaces.
- Added deterministic worker+LLM scripted tool-call coverage for runtime house-vault note append (`agent_town_house_recover` + `agent_town_house_append_note` -> `/api/house/:id/append`).
- Added deterministic coverage for experience-turn prompt enrichment (`runtimeContext` + `runtimeState` + active skill guidance) so worker turns use authoritative session state without re-asking for teamCode/skill-path.
- Unified co-op polling contract around one experience endpoint (`/api/agent/state` / `/api/state`) that exposes `experience.step` + `experience.nextAgentAction` and ceremony booleans for step progression.
- Restored runtime gateway parity for page scripts by exposing `visitExperience`, `experienceRun`, `skillState`, and `systemPromptPreview` on the default gateway object (not test-only surface).
- Added `/create` worker polling/backoff loop so ceremony progression is state-driven (human action updates state, worker polls and acts via SKILL + tools).
- Restored runtime worker-owned canvas contribution on `/create` so human paint events trigger deterministic agent paint updates through `/api/agent/canvas/paint`.
- Fixed home-page setup/town flicker by decoupling vendor onboarding visibility from strict `agent.source === openclaw-lite`; visibility now remains stable through worker-driven source-label transitions.
- Added reload regression coverage for home co-op continuity so refresh keeps the same team session, town panel visibility, and sigil selection.
- Added a split agent panel observability surface so debugging data is visible in-app without devtools (`Worker Tools`, `Skill Context`, `Worker Traffic`, `Session Context` tabs).
- Expanded split agent panel observability with a `Worker Traffic` tab (outbound/inbound gateway/worker trace) and deterministic regression coverage.
- Added worker chat-prompt regression coverage to assert teamCode/runtime-state/active-skill guidance is present after skill import.
- Added runtime-context/state pass-through coverage for chat sends so worker chat turns honor page-provided co-op state without drifting to a separate worker-side session snapshot.
- Added polling-noise suppression coverage so loop-driven `experienceRun` turns can run without adding transcript/chat clutter.

### 2026-02-16

- Confirmed the in-browser worker does not require human copy/paste of `teamCode`.
- Kept `teamCode` hidden in UI to reduce onboarding confusion, while preserving internal session routing.
- Added regression coverage for agent-connect POST body compatibility through `http_request`.
- Added deterministic worker-tool coverage for ceremony commit/reveal crypto execution (`agent_town_ceremony_commit` / `agent_town_ceremony_reveal`) without deterministic UI bridge shortcuts.
- Added deterministic contract coverage for ceremony idempotency vs randomness boundaries (stable per team, fresh across team/session reset).
- Removed deterministic phase2 runtime monkeypatch helper (`e2e/helpers/phase2.js`) and completed the legacy regression rewrite onto explicit co-op API contracts (`e2e/02`, `e2e/36`, `e2e/37`, `e2e/38`, `e2e/43`, `e2e/44`).
- Added fixture-driven multi-file import coverage (`skill.md` + linked `heartbeat.md`, `rules.md`, `messaging.md`, `skill.json`).
- Added OpenClaw-style prompt contract coverage for `<available_skills>` with deterministic prompt-preview assertions (no inline `SKILL.md` context injection).
- Added multi-skill prompt coverage for most-specific-first ordering and single upfront skill-read constraints.
- Added deterministic prompt-ordering regression coverage for repeat multi-skill imports.
- Updated worker skills registry selection to canonicalize imported skill identities (using import metadata) and de-duplicate compatibility mirrors in prompt entries.
- Added Moltbook-shaped fixture coverage (`public/fixtures/moltbook.com/playbooks/agent-town/*`) for required-action docs and domain-like path conventions.
- Added repeat-import metadata normalization coverage for persisted `importedFiles` ordering/hash/header metadata (`etag`/`lastModified`/`sha256B64`).
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
- Add runtime-turn assertions for multi-skill conflicts (ensure only one skill file is read before first non-read tool action).
- Add coverage for tie-break behavior when multiple skills are equally specific but descriptions overlap.

2. Moltbook multi-file package:
- Add cross-origin Moltbook alias coverage to validate direct-fetch fallback-to-proxy behavior for package import.
- Add refresh/etag semantics tests for repeated Moltbook package imports.

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
