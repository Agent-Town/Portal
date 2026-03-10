# Phase 23 Backlog: Option5 Integration Completion Program

Status: Draft
Date: 2026-03-10
Depends on: [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
Companion TDD specs:
1. [specs/24_option5_integration_registry_web_poker_tdd_spec.md](./24_option5_integration_registry_web_poker_tdd_spec.md)
2. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
Detailed AI-agent runbooks:
1. [specs/26_option5_integration_registry_web_poker_agent_runbook.md](./26_option5_integration_registry_web_poker_agent_runbook.md)
2. [specs/27_option5_integration_platform_house_tracks_agent_runbook.md](./27_option5_integration_platform_house_tracks_agent_runbook.md)

This backlog turns the Phase 22 completion spec into executable workstreams.
It assumes the current implementation baseline is `codex/option5-integration`.
Werewolf is out of scope for this backlog.

## 1. Delivery Rules

These rules apply to every ticket below.

1. No ticket is complete until the affected contracts, docs, and deterministic tests are updated in the same change set.
2. Worker-first architecture remains binding. No ticket may move agent planning into backend handlers.
3. Modal-first continuity remains binding for Atlas, Registry, Poker, Trainer, House Archive, and House Trainer.
4. `trainer.*` remains runtime-only and `trainer_job.*` remains durable-job-only.
5. Wallet-first identity remains binding. No ticket may introduce external identity providers.
6. Default `npm test` must remain deterministic and offline-safe.
7. No ticket may create a second architecture path beside the existing `/v1/*` platform spine.
8. No ticket may widen scope to Werewolf.

## 2. Mandatory Doc Sync Matrix

| Changed surface | Required docs/tests |
|---|---|
| HTTP route or JSON envelope | `specs/02_api_contract.md` |
| Worker-visible tool, state getter, or skill behavior | `public/skill.md`, `e2e/55_phase3_skill_contract_line.spec.js`, `docs/internal-skill-testline.md` |
| Atlas, Registry, Poker, or House modal/deep-link behavior | `specs/11_district_map_storefront_spec.md`, `specs/15_experience_os_intent_tools_tdd_spec.md`, `specs/22_option5_integration_unified_completion_spec.md` |
| Platform model, trainer, trace, seal, or config behavior | `specs/22_option5_integration_unified_completion_spec.md`, companion TDD spec for the active phase |
| Tracks model or progression UI | `specs/22_option5_integration_unified_completion_spec.md`, `specs/25_option5_integration_platform_house_tracks_tdd_spec.md` |

## 3. Reserved Test Blocks

The completion program reserves these new Playwright ranges:

1. `167` through `180` for Registry/Web/Poker completion
2. `181` and `182` remain intentional overflow buffer for the Registry/Web/Poker phase if needed
3. `183` through `194` for platform hardening, House expansion, tracks, editor compatibility, and final smoke

The exact milestone mapping is owned by the companion TDD specs.

## 4. Phase Bundles

Implementation proceeds in five bundles.

### Bundle A - Registry completion

Goal:

1. turn Registry into the real shared capability and proof layer,
2. preserve Atlas semantics,
3. unlock proof linkage for Poker and Web surfaces.

### Bundle B - Web completion

Goal:

1. finish the integration pack and adapter path,
2. expose the missing worker-visible tools and state getters,
3. preserve approval, evidence, and checkpoint semantics.

### Bundle C - Poker completion

Goal:

1. finish Portal-side season, run, replay, proof, and safety depth,
2. keep operator truth authoritative,
3. complete config pinning and Registry linkage.

### Bundle D - Platform hardening and House expansion

Goal:

1. replace scaffolded trainer/seal behavior with materially real behavior,
2. expand House beyond Archive and Trainer without rewriting the spine.

### Bundle E - Tracks and final completion gate

Goal:

1. land the deferred track/progression layer from the unified product vision,
2. prove the joined implementation path is complete without widening scope.

## 5. Tickets

## Epic REG - Registry completion

### REG-201 - Replace flat Registry storage with full Registry core

- Priority: P0
- Bundle: A
- Goal: add versions, facets, families, memberships, validation, proof, and health storage on top of the current Registry basics.
- Likely files:
  - `server/web_poker_store.js` or extracted Registry storage module
  - `server/registry_routes.js`
  - `public/registry.js`
- Deliverables:
  - durable schema additions
  - `GET /api/registry/health`
  - deterministic serialization for family-aware entities
- Acceptance:
  - Registry boots with empty durable tables
  - health endpoint returns a stable success payload
  - existing import/search/entity behavior remains backward compatible where documented
- Suggested tests:
  - `e2e/168_registry_health_family_schema.spec.js`

### REG-202 - Implement family-first search and storefront payloads

- Priority: P0
- Bundle: A
- Depends on: `REG-201`
- Goal: return grouped family-first search results and richer entity storefront payloads.
- Deliverables:
  - grouped `GET /api/registry/search`
  - `GET /api/registry/entity/:registryId`
  - `GET /api/registry/family/:familySlug`
- Acceptance:
  - results group by family first and implementations second
  - family and entity payloads are deterministic and pagination-safe
  - Atlas district state remains unchanged by Registry queries
- Suggested tests:
  - `e2e/169_registry_grouped_search_storefront.spec.js`

### REG-203 - Add claim flow and review queue

- Priority: P0
- Bundle: A
- Depends on: `REG-201`
- Goal: support claim-start, duplicate review, and validation review workflows.
- Deliverables:
  - `POST /api/registry/claim/start`
  - `GET /api/registry/review-queue`
  - deterministic review-state transitions
- Acceptance:
  - missing or invalid claim input fails with stable error codes
  - review queue exposes duplicate and claim-review rows deterministically
  - wallet-first identity remains the verification anchor
- Suggested tests:
  - `e2e/170_registry_claim_review_queue.spec.js`

### REG-204 - Add proof cards, proof summaries, and loadouts

- Priority: P1
- Bundle: A
- Depends on: `REG-202`, `REG-203`
- Goal: make proof visible and make loadouts/bundles first-class Registry objects.
- Deliverables:
  - `GET /api/registry/proof/:registryId`
  - proof-card UI in Registry storefronts
  - loadout and bundle object kinds
- Acceptance:
  - proof summaries can attach poker and web evidence
  - loadouts and bundles serialize as stable Registry objects
  - storefronts render proof and loadout sections deterministically
- Suggested tests:
  - `e2e/171_registry_proof_cards_loadouts.spec.js`

## Epic WEB - Web completion

### WEB-201 - Add missing worker-visible web and Registry tools

- Priority: P0
- Bundle: B
- Goal: expose the missing worker-visible intent and state tools without breaking existing skill compatibility.
- Deliverables:
  - `agent_town_ui_web_open`
  - `agent_town_state_get_registry_entity`
  - `agent_town_state_get_web_session`
  - skill and testline updates
- Acceptance:
  - tools appear in the runtime tool surface
  - tool calls preserve modal continuity and worker continuity
  - existing skill behavior remains compatible
- Suggested tests:
  - `e2e/172_web_tool_state_surface.spec.js`

### WEB-202 - Expand compiled integration pack outputs

- Priority: P0
- Bundle: B
- Goal: extend the current compiler to emit the richer internal pack set required by the joined spec.
- Deliverables:
  - manifest, overlay, policy, verification, and provenance outputs
  - deterministic file hashes
  - stable content-hash semantics
- Acceptance:
  - unchanged source recompiles to the same pack identity under the same idempotent request
  - required file set is present for supported integrations
  - raw external manuals remain non-authoritative
- Suggested tests:
  - `e2e/173_web_pack_compiler_manifest_contract.spec.js`

### WEB-203 - Implement Parse pipeline and import-to-pack bridge

- Priority: P0
- Bundle: B
- Depends on: `WEB-202`
- Goal: support Parse-derived metadata as a first-class compilation source.
- Deliverables:
  - Parse pipeline contract
  - Parse-originated integration candidate metadata
  - deterministic compile bridge into the internal pack format
- Acceptance:
  - Parse-backed imports compile without live dependencies in default tests
  - resulting pack is indistinguishable from other internal execution packs at runtime
- Suggested tests:
  - `e2e/174_web_parse_pipeline_contract.spec.js`

### WEB-204 - Implement `threaded_feed_v1` adapter pack

- Priority: P1
- Bundle: B
- Depends on: `WEB-202`
- Goal: add the first concrete adapter family for threaded feeds and reply flows.
- Deliverables:
  - adapter definition
  - action inventory
  - trace mapping
  - approval/evidence semantics
- Acceptance:
  - read and write-capable actions expose stable policy
  - adapter emits expected trace and evidence shape
- Suggested tests:
  - `e2e/175_web_adapter_threaded_feed.spec.js`

### WEB-205 - Implement `deliberation_v1` adapter pack

- Priority: P1
- Bundle: B
- Depends on: `WEB-202`
- Goal: support structured deliberation/work item flows.
- Suggested tests:
  - `e2e/176_web_adapter_deliberation.spec.js`

### WEB-206 - Implement `repo_workbench_v1` adapter pack

- Priority: P1
- Bundle: B
- Depends on: `WEB-202`
- Goal: support repository workbench flows beyond the current GitHub-minimal path.
- Suggested tests:
  - `e2e/177_web_adapter_repo_workbench.spec.js`

### WEB-207 - Add trust labels and provenance UX

- Priority: P1
- Bundle: B
- Depends on: `WEB-202`
- Goal: expose source trust, verification, provenance, and execution posture to the human.
- Acceptance:
  - UI distinguishes native pack, API, Parse, and fallback sources
  - approval/evidence states remain understandable and deterministic
- Suggested tests:
  - covered by `173`, `174`, `175`, `176`, and `177`

## Epic POKER - Poker completion

### POKER-201 - Enrich season detail and setup submission UX

- Priority: P0
- Bundle: C
- Goal: complete the season detail model and stop relying on manual hash entry for Portal setup submissions.
- Deliverables:
  - richer season detail payload
  - rules/submission-window presentation
  - Portal-side setup bundle hash computation and display
- Acceptance:
  - season detail exposes operator truth without score rewriting
  - Portal computes and displays stable bundle hashes before or during submit
- Suggested tests:
  - `e2e/178_poker_season_detail_bundle_hash.spec.js`

### POKER-202 - Add run detail and leaderboard snapshot history

- Priority: P0
- Bundle: C
- Depends on: `POKER-201`
- Goal: expose Portal-side run detail and historical leaderboard snapshots.
- Deliverables:
  - run detail route
  - snapshot-history route
  - replay detail enrichment
- Acceptance:
  - users can inspect a season from season page to run page to replay page
  - snapshot history preserves deterministic ordering and selection
- Suggested tests:
  - `e2e/179_poker_run_detail_snapshot_history.spec.js`

### POKER-203 - Link poker proof into Registry

- Priority: P0
- Bundle: C
- Depends on: `REG-204`, `POKER-202`
- Goal: make poker results visible through Registry proof summaries and cards.
- Deliverables:
  - proof linkage model
  - Registry storefront proof rendering for poker-linked evidence
- Acceptance:
  - poker season/submission/run outcomes can attach proof to the relevant Registry entity
  - proof linkage does not require duplicating operator truth in Registry
- Suggested tests:
  - `e2e/180_poker_registry_proof_safety_smoke.spec.js`

### POKER-204 - Add Browser Class division wiring

- Priority: P1
- Bundle: C
- Depends on: `POKER-201`
- Goal: support browser-compatible division wiring where the operator exposes it.
- Acceptance:
  - division metadata is surfaced as structured data, not just labels
  - Portal submission rules respect division capabilities
- Suggested tests:
  - covered by `178` and `180`

### POKER-205 - Add anti-collusion and safety evidence ingest

- Priority: P1
- Bundle: C
- Depends on: `POKER-203`
- Goal: ingest and expose operator-side safety and anti-collusion evidence without rewriting scores.
- Acceptance:
  - evidence appears in proof metadata
  - safety evidence remains audit-safe and deterministic in tests
- Suggested tests:
  - covered by `180`

## Epic PLATFORM - Trace, trainer, and config hardening

### PLATFORM-201 - Replace fixture-style trainer outputs with real result artifacts

- Priority: P0
- Bundle: D
- Goal: make trainer results materially real and artifact-bearing.
- Deliverables:
  - stable artifact refs
  - non-empty result payloads beyond the current scaffold
  - deterministic compare/replay/recommendation semantics as implemented
- Suggested tests:
  - `e2e/184_trainer_real_result_artifacts.spec.js`

### PLATFORM-202 - Enforce seal-aware arena reads

- Priority: P0
- Bundle: D
- Depends on: `PLATFORM-201`
- Goal: make trace reads and trainer analysis respect seal policy for arena-sensitive data.
- Deliverables:
  - seal-aware read filtering
  - stable policy errors or filtered payload rules
- Suggested tests:
  - `e2e/185_seal_enforcement_read_filter.spec.js`

### PLATFORM-203 - Close config pinning gaps across experience entry

- Priority: P0
- Bundle: D
- Depends on: `POKER-202`
- Goal: ensure all run entry paths requiring immutable config pinning enforce it, including poker operator ingests.
- Suggested tests:
  - `e2e/187_platform_experience_registration.spec.js`

### PLATFORM-204 - Finish experience-pack and editor compatibility contract

- Priority: P1
- Bundle: E
- Depends on: `WEB-202`, `HOUSE-202`, `TRACK-201`
- Goal: keep future editor compatibility grounded in the same internal pack model used by the completed product.
- Deliverables:
  - compatible pack primitive contract
  - deterministic verification path for editor-generated packs
- Acceptance:
  - editor compatibility does not create a second pack standard
  - compatible packs remain consumable by House, Registry, Web, and trainer surfaces
- Suggested tests:
  - `e2e/193_experience_pack_editor_compat_contract.spec.js`

## Epic HOUSE - House expansion

### HOUSE-201 - Add House Experiences surface

- Priority: P1
- Bundle: D
- Goal: expand House beyond Archive and Trainer with a minimal Experiences surface.
- Deliverables:
  - read surface for current experiences
  - stable modal and team-context behavior
- Suggested tests:
  - `e2e/188_house_experiences_surface.spec.js`

### HOUSE-202 - Add House Workshop/config surface

- Priority: P1
- Bundle: D
- Depends on: `HOUSE-201`, `PLATFORM-203`
- Goal: expose config lineage and Workshop-oriented controls through a minimal House shell.
- Suggested tests:
  - `e2e/189_house_workshop_inbox_surface.spec.js`

### HOUSE-203 - Add office and staff scaffolding

- Priority: P2
- Bundle: D
- Depends on: `HOUSE-201`, `HOUSE-202`
- Goal: preserve forward compatibility with the broader House object model without forcing a rewrite now.
- Deliverables:
  - minimal office and staff-agent scaffolding
  - compatibility serializers
- Acceptance:
  - current team and House flows remain intact
  - scaffolding is deterministic and forward-compatible
- Suggested tests:
  - `e2e/190_house_office_staff_scaffold.spec.js`

## Epic TRACK - Tracks and progression

### TRACK-201 - Add durable track model and progression hooks

- Priority: P1
- Bundle: E
- Goal: add the minimal durable model for cross-experience tracks without introducing engagement-farming mechanics.
- Deliverables:
  - track definitions
  - progress events/hooks from poker, web, and trainer flows where appropriate
- Suggested tests:
  - `e2e/191_tracks_core_reward_hooks.spec.js`

### TRACK-202 - Add track progression read surface

- Priority: P1
- Bundle: E
- Depends on: `TRACK-201`, `HOUSE-201`
- Goal: render track progress in a minimal House-compatible surface.
- Acceptance:
  - progress is legible and deterministic
  - no point-farming or gamified clutter is introduced
- Suggested tests:
  - `e2e/192_tracks_progression_surface.spec.js`

## Epic X - Final gate

### X-201 - Unified completion smoke and release gate

- Priority: P0
- Bundle: E
- Depends on: all prior P0 tickets
- Goal: prove the joined implementation path is complete as scoped by Phase 22.
- Deliverables:
  - final smoke coverage
  - docs synchronization pass
  - release gate checklist
- Acceptance:
  - all reserved completion specs are green
  - the implementation matches the scope and non-goals in Phase 22
  - there is still one implementation path, not several conflicting ones
- Suggested tests:
  - `e2e/194_unified_completion_full_smoke.spec.js`

## 6. First Execution Bundle

The first bundle to execute is:

1. `REG-201`
2. `REG-202`
3. `REG-203`
4. `WEB-201`
5. `WEB-202`
6. `POKER-201`

That sequence closes the highest-value missing product depth while preserving the current spine.

## 7. Final Backlog Note

This backlog is intentionally completion-oriented.
It assumes the current codebase is valuable and must be extended, not replaced.
Any proposed ticket that implies a second architecture, a full rewrite, or Werewolf scope expansion should be rejected as out of plan.
