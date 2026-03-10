# Phase 22 Spec: Unified Completion from `codex/option5-integration`

Status: Draft
Version: 1.0
Audience: product, frontend, backend, runtime, AI-agent, benchmarking, security, QA, and AI coding agents
Implementation baseline: `codex/option5-integration` at commit `06187dc`
Sources:
1. `/Users/robin/Downloads/agent-town-implementation-pack-portal-web-poker-v0.3 (1).md`
2. `/Users/robin/Downloads/agent-town-ticket-backlog-portal-web-poker-v0.3 (1).md`
3. `/Users/robin/Downloads/agent-town-unified-experiences-trace-trainer-spec-v0.2.md`
Grounding docs:
1. [specs/16_portal_web_poker_v0.4_implementation_pack.md](./16_portal_web_poker_v0.4_implementation_pack.md)
2. [specs/17_portal_web_poker_v0.4_backlog.md](./17_portal_web_poker_v0.4_backlog.md)
3. [specs/18_portal_web_poker_tdd_spec.md](./18_portal_web_poker_tdd_spec.md)
4. [specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md](./19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md)
5. [specs/20_unified_house_trace_trainer_platform_tdd_spec.md](./20_unified_house_trace_trainer_platform_tdd_spec.md)
6. [specs/21_remaining_gap_closure_tdd_spec.md](./21_remaining_gap_closure_tdd_spec.md)
7. [specs/23_option5_integration_completion_backlog.md](./23_option5_integration_completion_backlog.md)
8. [specs/24_option5_integration_registry_web_poker_tdd_spec.md](./24_option5_integration_registry_web_poker_tdd_spec.md)
9. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
10. [specs/02_api_contract.md](./02_api_contract.md)
11. [AGENTS.md](../AGENTS.md)

# 1. Purpose

This document creates one implementation path from the existing `codex/option5-integration` branch to the combined product goals described in the three external source documents.

It does four things:

1. records the actual implementation baseline already present in `codex/option5-integration`,
2. preserves the important product goals from the external Registry/Web/Poker and unified House/Trace/Trainer documents,
3. resolves the conflicts between older external planning and the current repo semantics,
4. sequences the remaining work into one deterministic delivery plan.

This document is the canonical forward plan from the `codex/option5-integration` baseline.
The three external source documents remain design input, but they are no longer separate implementation plans.
The executable companion docs for this program are:

1. [specs/23_option5_integration_completion_backlog.md](./23_option5_integration_completion_backlog.md)
2. [specs/24_option5_integration_registry_web_poker_tdd_spec.md](./24_option5_integration_registry_web_poker_tdd_spec.md)
3. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
4. [specs/26_option5_integration_registry_web_poker_agent_runbook.md](./26_option5_integration_registry_web_poker_agent_runbook.md)
5. [specs/27_option5_integration_platform_house_tracks_agent_runbook.md](./27_option5_integration_platform_house_tracks_agent_runbook.md)

# 2. Baseline Summary

## 2.1 What is already real in `codex/option5-integration`

The baseline branch already includes substantial implemented behavior:

1. Portal Web routes for resolve, import, session creation, checkpointing, approvals, credentials, and evidence.
2. Registry basics: import, flat search, and entity lookup.
3. Poker basics: operator passthrough, mirror sync, season list/detail, submission proxy, latest leaderboard, and replay manifest.
4. Modal-first Trainer, Registry, Atlas, Pony, House Archive, and House Trainer continuity.
5. `/v1/*` platform routes for runs, trace ingestion, trace reads, config versions, config promotion, integration candidates, integration pack versions, executions, trainer jobs, trainer results, and seals.
6. Minimal House Console surfaces for team selection, Archive, and House Trainer.
7. Active-team context, team switching, durable compare-job creation, and durable patch promotion.
8. Route-family modularization for `web`, `registry`, `poker`, `platform`, and `v1`.
9. Live-suite manifest, deterministic OTP adapter path, and export/import verification.

## 2.2 What is only partial

The baseline is not feature-complete relative to the external docs:

1. Registry is still a thin flat-table search/import surface, not a family-first capability registry.
2. Web integration resolution is effectively GitHub-first and minimal; Parse, richer pack compilation, and adapter breadth are not complete.
3. Poker is functional but thin; proof linkage, run detail, snapshot history, Browser Class wiring, and anti-collusion evidence are not complete.
4. Trainer exists as a contract and UI flow, but result generation is still mostly scaffolded and artifact-light.
5. Sealed contexts are stored and auditable, but seal-aware read filtering and fairness enforcement are not complete.
6. House is still a minimal console, not the full House HQ described in the unified platform vision.

## 2.3 What is still absent

1. Tracks and rewards as a first-class cross-experience system.
2. First-class offices, staff agents, and richer House object-model surfaces.
3. Full internal pack file sets and provenance/policy outputs for web integrations.

# 3. Resolved Decisions

The source documents are not fully compatible with the current codebase. The following decisions are normative and must not be reopened unless this document is revised.

## 3.1 Runtime and trainer naming

1. `trainer.*` remains reserved for agent-facing runtime tools.
2. Durable platform jobs use `trainer_job.*`.
3. Older external wording that used `trainer.*` for durable jobs is superseded.

## 3.2 Navigation and continuity

1. Atlas, Registry, Poker, Trainer, House Archive, and House Trainer remain modal-first from the hub.
2. Direct standalone routes may exist only as redirect entry points or same-origin embed routes.
3. No new plan may depend on full-page navigation for agent-driven surfaces when a modal flow exists.

## 3.3 Worker-first architecture

1. The browser worker remains authoritative for planning and next-step selection.
2. The server remains authoritative for durable state, auth, policy, persistence, and externally visible contracts.
3. No remaining gap may be closed by moving agent decision logic into backend handlers.

## 3.4 Platform route shape

1. The current `/v1/*` platform spine remains the canonical durable route family.
2. Missing behavior must extend the existing route families rather than inventing a competing API surface.
3. Route ownership stays modular; new work must not collapse route families back into `server/index.js`.

## 3.5 External manuals and internal packs

1. External `skill.md` files remain stable public manuals.
2. Internal compiled packs remain the authoritative execution artifacts.
3. The current pack compiler is extended in place; it is not replaced by a second pack system.

## 3.6 Registry and Atlas

1. Registry remains separate from Atlas.
2. Atlas district semantics remain intact.
3. Registry becomes the shared capability, storefront, proof, and family surface, but it does not replace Atlas state semantics.

## 3.7 Poker authority

1. The poker operator remains authoritative for seasons, evaluation batches, runs, leaderboards, and replay truth.
2. Portal mirrors, enriches, verifies, and links that truth into House, Registry, and Trainer flows.
3. Portal does not become the poker engine.

## 3.8 Scope phasing

1. The first completion target is not "all of v0.2 at once."
2. First completion means finishing the shared Registry/Web/Poker and trace/trainer gaps on top of the existing baseline.
3. Tracks and the fuller House HQ remain explicit later phases, not hidden blockers for the first completion gate.
4. Werewolf is out of scope for this program and requires its own future planning document if it is revived.

# 4. Target Product State from the Combined Sources

This section states the intended target after the remaining work is complete.

## 4.1 Shared Registry core

The completed Registry must provide:

1. first-class entity, version, facet, family, membership, validation, proof, and health models,
2. grouped family-first search results with implementations nested below family groupings,
3. entity storefront pages,
4. family pages,
5. claim/ownership flow,
6. review queue for duplicate handling and claim validation,
7. proof summaries that can absorb poker and gym/arena evidence,
8. loadouts and bundles as first-class registry objects,
9. Atlas compatibility through separate tools and state getters.

## 4.2 Web Experience runtime

The completed web runtime must provide:

1. resolution hierarchy:
   A. native Agent Town-compatible pack
   B. native API, MCP, or OpenAPI surface
   C. Parse-generated API
   D. browser automation fallback
2. compiled internal integration packs with richer file outputs,
3. deterministic desktop and mobile shell behavior,
4. embedded and companion rendering modes,
5. approval-gated high-impact actions,
6. evidence generation and verification loops,
7. checkpointing and recovery,
8. first adapter families:
   A. `threaded_feed_v1`
   B. `deliberation_v1`
   C. `repo_workbench_v1`
9. worker-visible tool and state contracts for Registry and Web sessions.

## 4.3 Poker integration

The completed poker surface must provide:

1. season, division, submission, batch, run, seat-result, leaderboard-snapshot, and replay models in Portal,
2. Portal-side bundle hash computation and display,
3. run detail and snapshot-history surfaces,
4. replay verification and proof metadata,
5. Browser Class division wiring where applicable,
6. anti-collusion and safety evidence ingest,
7. linkage from poker results into Registry proof cards,
8. immutable config pinning for season-entry runs on the shared platform substrate.

## 4.4 Shared trace and trainer substrate

The completed shared substrate must provide:

1. one canonical trace authority per run,
2. immutable archived traces with typed events and artifact refs,
3. real trainer results with stable artifact references,
4. config lineage and promotion tied to trainer output,
5. meaningful seal enforcement on arena-sensitive reads and analyses,
6. poker and web experiences both mapped onto the same durable run, trace, trainer, and config system.

## 4.5 House progression model

The completed product must still be compatible with the broader House vision:

1. House remains the long-term root object.
2. Team remains the main progression object.
3. Archive and Trainer remain core House functions.
4. Experiences, Workshop, Inbox, and later tracks must be able to attach without rewriting the shared substrate.

# 5. Implementation Gaps by Subsystem

## 5.1 Registry gaps

The baseline still lacks:

1. a real Registry schema for versions, facets, families, memberships, review state, proof, and health,
2. grouped family-first search,
3. entity storefront payloads richer than flat projection blobs,
4. family pages,
5. claim flow,
6. review queue,
7. proof-summary endpoints,
8. proof-card UI,
9. loadout and bundle objects,
10. `agent_town_state_get_registry_entity`.

## 5.2 Web gaps

The baseline still lacks:

1. broader resolution sources beyond the current GitHub-oriented path,
2. richer pack file outputs such as manifest, overlay, policy, verification, and provenance documents,
3. a real Parse import pipeline,
4. full adapter-family coverage,
5. worker-visible `agent_town_ui_web_open`,
6. worker-visible `agent_town_state_get_web_session`,
7. stronger trust labels and source-state UX,
8. more complete integration-entity and website-entity Registry linkage.

## 5.3 Poker gaps

The baseline still lacks:

1. richer season detail payloads and rules summary presentation,
2. Portal-side setup bundle hash computation,
3. run detail routes and UI,
4. leaderboard snapshot history routes and UI,
5. proof metadata exposure,
6. Registry proof linkage,
7. Browser Class division wiring,
8. anti-collusion and safety evidence ingest,
9. shared-platform config pinning for operator-ingested poker runs.

## 5.4 Trace, trainer, and seals gaps

The baseline still lacks:

1. real trainer result generation beyond fixture-style compare output,
2. richer artifact references for trainer outputs,
3. stronger seal-aware filtering on sensitive trace reads,
4. stronger seal-aware trainer behavior for arena traces,
5. complete config pinning for all experience entry paths,
6. broader experience coverage on the platform route set.

## 5.5 House and long-tail platform gaps

The baseline still lacks:

1. fuller House HQ surfaces,
2. first-class offices and staff-agent models,
3. tracks and rewards,
4. fuller experience-pack/editor compatibility layers.

# 6. Delivery Plan

The remaining work is delivered in seven phases. Existing passing behavior from the baseline branch is the regression floor and must remain green.

## 6.1 Phase 0 - Contract lock and doc unification

Purpose:

1. freeze the `codex/option5-integration` baseline as the starting point,
2. adopt this document as the only forward plan,
3. treat the external source docs as archived inputs,
4. preserve the existing green TDD blocks as regression coverage.

Required outputs:

1. this joined spec,
2. doc references updated as needed in later phases,
3. no duplicate implementation path documents for the same work.

## 6.2 Phase 1 - Registry completion

Purpose:

1. turn the thin Registry into the actual shared capability and proof core,
2. preserve Atlas semantics while expanding Registry depth,
3. make poker and web proof linkage possible.

Required outputs:

1. schema additions for versions, facets, families, memberships, validation, proof, and health,
2. `GET /api/registry/health`,
3. family-first `GET /api/registry/search`,
4. `GET /api/registry/entity/:registryId`,
5. `GET /api/registry/family/:familySlug`,
6. `POST /api/registry/claim/start`,
7. `GET /api/registry/review-queue`,
8. `GET /api/registry/proof/:registryId`,
9. grouped storefront UI and proof cards,
10. worker-visible Registry state getter.

Exit criteria:

1. Registry search groups results by family first.
2. Entity and family pages render deterministic payloads.
3. Claim and review queue flows work with stable error codes.
4. Poker results can attach proof summaries to Registry entities.

## 6.3 Phase 2 - Web runtime completion

Purpose:

1. finish the web surface from substrate to usable experience families,
2. keep worker-first behavior and approval/evidence rules intact.

Required outputs:

1. richer compiled integration pack outputs,
2. Parse import pipeline,
3. desktop and mobile shell polish where contractually missing,
4. `agent_town_ui_web_open`,
5. `agent_town_state_get_web_session`,
6. adapter packs for `threaded_feed_v1`, `deliberation_v1`, and `repo_workbench_v1`,
7. trust labels, verification, and provenance UI states.

Exit criteria:

1. At least three adapter families are supported end to end.
2. The pack compiler emits the required internal file set for supported integrations.
3. Parse imports can compile into a deterministic internal pack.
4. Web session state is accessible through explicit worker-facing tools.

## 6.4 Phase 3 - Poker completion

Purpose:

1. finish Portal-side poker product depth without taking authority from the operator,
2. connect poker to Registry and the shared platform substrate cleanly.

Required outputs:

1. richer season detail and rules presentation,
2. Portal-side bundle hash computation and display,
3. run detail routes and replay detail surface,
4. leaderboard snapshot-history route and UI,
5. proof metadata exposure,
6. Registry proof-card linkage,
7. Browser Class division wiring,
8. anti-collusion and safety evidence ingest,
9. config-version pinning for operator-ingested platform runs.

Exit criteria:

1. A poker submission can be inspected from season, submission, run, replay, and Registry proof surfaces.
2. Portal computes and displays stable bundle hashes before or during submission.
3. Operator-ingested runs are pinned to immutable config lineage.
4. Proof and safety metadata are visible without score rewriting in Portal.

## 6.5 Phase 4 - Trace, trainer, and seal hardening

Purpose:

1. convert the shared substrate from "good contract skeleton" into real improvement machinery,
2. close the main fairness gap in arena traces.

Required outputs:

1. trainer result generation with stable artifact refs,
2. meaningful replay and compare result payloads,
3. seal-aware read filtering where the visibility contract requires it,
4. seal-aware trainer behavior for arena-sensitive traces,
5. stronger config pinning rules for all run-creation paths,
6. broader experience registration on the shared platform.

Exit criteria:

1. Trainer results are no longer fixture-only.
2. Artifact refs are non-empty where trainer output produces derived data.
3. Poker-sensitive trace reads respect seal policy.
4. All run entry paths that require config pinning enforce it.

## 6.6 Phase 5 - House expansion

Purpose:

1. grow the minimal House Console into a clearer House product shell,
2. do this without destabilizing the already-landed platform core.

Required outputs:

1. minimal Experiences surface,
2. minimal Workshop/config surface,
3. minimal Inbox linkage where relevant,
4. object-model scaffolding for offices and staff agents if needed for future compatibility.

Exit criteria:

1. House can expose Archive, Trainer, and at least one additional House-level surface without route or state fragmentation.
2. The new surfaces do not break modal continuity or worker continuity.
3. The minimal Experiences surface links into current Registry, Web, and Poker surfaces from the same shell.
4. The minimal Workshop surface reflects active config lineage truth and can open Inbox from the same shell.

## 6.7 Phase 6 - Later platform surfaces

Purpose:

1. land the broader v0.2 long-tail goals only after the shared completion path above is stable.

Scope:

1. tracks and rewards,
2. fuller experience-editor compatibility,
3. broader House HQ object model expansion.

Future new competitive experiences are outside the scope of this document.
These are explicit later phases, not hidden requirements for Phases 1 through 5.

# 7. Test Plan and Reserved Coverage

The existing baseline test ranges stay locked as regression coverage:

1. existing Portal Web and Poker coverage,
2. Phase 19 block `131` through `150`,
3. Phase 20 block `156` through `165`,
4. poker modal coverage in `166`.

The remaining joined-completion work is reserved in two companion blocks:

1. [specs/24_option5_integration_registry_web_poker_tdd_spec.md](./24_option5_integration_registry_web_poker_tdd_spec.md) reserves `167` through `180`.
2. `181` and `182` remain intentional buffer for spillover if Phase 24 expands.
3. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md) reserves `183` through `194`.

# 8. Immediate Non-Goals

The following are explicitly out of scope for the first joined-completion gate:

1. a platform rewrite,
2. moving agent planning into the backend,
3. replacing wallet-first identity with external identity providers,
4. introducing live-only dependencies into default `npm test`,
5. replacing Atlas with Registry,
6. turning Portal into the poker engine,
7. shipping tracks before the shared Registry/Web/Poker/platform gaps are closed,
8. adding Werewolf to this program.

# 9. Definition of Done

The joined-completion program is done when all of the following are true:

1. the baseline regression suites remain green,
2. Registry has family-first search, storefronts, proof summaries, claim flow, and review queue,
3. Web runtime has richer internal packs, explicit worker-facing session tools, Parse support, and at least three real adapter families,
4. Poker has run detail, snapshot history, Portal-side hash computation, Registry proof linkage, Browser Class wiring where applicable, and config pinning on shared-platform runs,
5. trainer results and seal behavior are materially real rather than mostly scaffold,
6. House can expose the completed shared surfaces without breaking modal or worker continuity,
7. there is still only one forward implementation plan.

# 10. Final Direction

The correct implementation posture from `codex/option5-integration` is:

1. keep the already-landed platform spine,
2. finish Registry depth,
3. finish Web depth,
4. finish Poker depth,
5. harden trainer and seals,
6. then expand House and later experiences.

Do not restart from the external docs as if the current branch were empty.
Do not treat the current branch as "done" because many of the broader product goals are still missing.

The path forward is completion, not rewrite.
