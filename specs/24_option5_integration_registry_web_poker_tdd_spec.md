# Phase 24 Spec: Registry + Web + Poker Completion (Contracts First, TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, backend engineers, runtime engineers, security engineers, QA automation engineers, AI agent implementers
Depends on:
1. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
2. [specs/23_option5_integration_completion_backlog.md](./23_option5_integration_completion_backlog.md)
3. [specs/02_api_contract.md](./02_api_contract.md)
4. [specs/15_experience_os_intent_tools_tdd_spec.md](./15_experience_os_intent_tools_tdd_spec.md)
5. [specs/14_trainer_namespace_tdd_spec.md](./14_trainer_namespace_tdd_spec.md)
6. [AGENTS.md](../AGENTS.md)
Detailed execution runbook:
1. [specs/26_option5_integration_registry_web_poker_agent_runbook.md](./26_option5_integration_registry_web_poker_agent_runbook.md)
Goal: finish the missing Registry, Web, and Poker depth on top of the `codex/option5-integration` baseline using small deterministic milestones.

Implementation constraints:

1. Keep worker-first architecture.
2. Keep modal-first continuity for Atlas, Registry, Poker, and Trainer-adjacent surfaces.
3. Keep `trainer.*` reserved for runtime tools and `trainer_job.*` for durable jobs.
4. Do not widen scope to Werewolf.
5. Do not introduce live third-party dependencies into the default test gate.
6. Extend existing route families instead of inventing a competing architecture.
7. A milestone is not complete until its listed docs and tests are updated together.

## 1. Executive Summary

This phase closes the highest-value product gaps left after the option5 baseline:

1. Registry depth,
2. worker-visible Web and Registry tool/state gaps,
3. richer web pack compilation and Parse bridge,
4. first-class adapter packs,
5. deeper Poker product surfaces,
6. Registry proof linkage for Poker.

Reserved Playwright block for this phase:

1. `167` to `180`

Reserved files:

1. `e2e/167_joined_completion_harness.spec.js`
2. `e2e/168_registry_health_family_schema.spec.js`
3. `e2e/169_registry_grouped_search_storefront.spec.js`
4. `e2e/170_registry_claim_review_queue.spec.js`
5. `e2e/171_registry_proof_cards_loadouts.spec.js`
6. `e2e/172_web_tool_state_surface.spec.js`
7. `e2e/173_web_pack_compiler_manifest_contract.spec.js`
8. `e2e/174_web_parse_pipeline_contract.spec.js`
9. `e2e/175_web_adapter_threaded_feed.spec.js`
10. `e2e/176_web_adapter_deliberation.spec.js`
11. `e2e/177_web_adapter_repo_workbench.spec.js`
12. `e2e/178_poker_season_detail_bundle_hash.spec.js`
13. `e2e/179_poker_run_detail_snapshot_history.spec.js`
14. `e2e/180_poker_registry_proof_safety_smoke.spec.js`

## 2. Global Measurable Metrics

### 2.1 Registry metrics

Required for Registry completion milestones:

1. `GET /api/registry/health` returns a stable success payload.
2. Search returns grouped family-first results rather than a flat item list.
3. Entity and family endpoints return deterministic ids and slugs.
4. Claim and review queue failures return stable error codes.
5. Proof summaries attach deterministic evidence ids and source types.

### 2.2 Worker tool/state metrics

Required for worker-visible Web and Registry additions:

1. New tools appear in the runtime tool surface.
2. New tools are documented in `public/skill.md`.
3. Tool execution does not trigger full-page navigation when a modal flow exists.
4. State getters return durable ids rather than synthesized placeholders.

### 2.3 Pack compilation metrics

Required for richer Web pack work:

1. Compiled packs expose stable `packVersionId` and `contentHash`.
2. `fileHashes` contains the exact required file set for the milestone.
3. Recompiling unchanged sources under the same idempotent request returns the same pack identity.
4. External manuals remain non-authoritative; runtime trust comes from the internal compiled pack.

### 2.4 Parse metrics

Required for Parse import work:

1. Parse-originated candidates compile into the same internal pack format as other integrations.
2. Default tests use seeded Parse fixtures or stubs only.
3. Parse source-kind and provenance remain visible in compiled pack metadata.

### 2.5 Adapter metrics

Required for each adapter family:

1. Declared action inventory is explicit and deterministic.
2. Approval-gated actions fail closed without approval.
3. Evidence and trace outputs are emitted with stable ids and schemas.
4. Embedded and companion rendering modes remain deterministic.

### 2.6 Poker completion metrics

Required for Poker depth work:

1. Season detail exposes rules and submission-window state deterministically.
2. Portal computes stable bundle hashes rather than requiring manual human entry only.
3. Run detail and snapshot-history routes preserve stable ordering and ids.
4. Proof metadata is visible without rewriting operator truth.
5. Registry proof cards can reference poker-derived evidence.

## 3. Required Fixtures and Observability

### 3.1 Fixture families

This phase requires at least:

1. `registry_family_seed`
2. `registry_claim_review_seed`
3. `registry_proof_seed`
4. `web_parse_stub_seed`
5. `web_adapter_expected_actions`
6. `poker_season_detail_seed`
7. `poker_run_history_seed`
8. `poker_safety_evidence_seed`

### 3.2 Test-mode observability

At least one deterministic mechanism must exist to inspect:

1. grouped Registry search output,
2. proof-summary linkage by registry id,
3. compiled pack manifest and file hashes,
4. Parse-originated integration candidate metadata,
5. adapter action inventory and approval posture,
6. Poker run detail and leaderboard snapshot history,
7. poker-to-registry proof linkage.

## 4. Milestone Map

Milestones must be implemented in order.

### M24.0 - Harness and fixture alignment

Purpose:

1. reserve the Phase 24 test block,
2. add the required Registry/Web/Poker fixtures,
3. expose the observability needed for the later milestones.

Primary test:

1. `e2e/167_joined_completion_harness.spec.js`

GREEN gate:

1. All fixture families load deterministically.
2. Pack manifest, Registry grouping, and poker history are inspectable in test mode.

### M24.1 - Registry family schema and health contract

Purpose:

1. extend Registry beyond the flat entity table,
2. add health/readiness visibility,
3. preserve current Registry basics.

Primary test:

1. `e2e/168_registry_health_family_schema.spec.js`

GREEN gate:

1. Registry boots with family-aware schema additions.
2. `GET /api/registry/health` returns a stable success payload.
3. Existing import and entity lookup behavior remains backward compatible where documented.

### M24.2 - Grouped search and storefront payloads

Purpose:

1. make Registry search family-first,
2. add richer storefront payloads for entity and family views.

Primary test:

1. `e2e/169_registry_grouped_search_storefront.spec.js`

GREEN gate:

1. Search groups by family first.
2. Entity and family pages expose deterministic payloads.
3. Registry search does not mutate Atlas semantics.

### M24.3 - Claim flow and review queue

Purpose:

1. add claim-start,
2. add duplicate and validation review visibility,
3. keep wallet-first identity rules intact.

Primary test:

1. `e2e/170_registry_claim_review_queue.spec.js`

GREEN gate:

1. Claim-start accepts valid wallet-bound requests.
2. Invalid claim requests fail with stable codes.
3. Review queue returns deterministic duplicate and claim-review rows.

### M24.4 - Proof cards and loadouts

Purpose:

1. expose proof summaries,
2. add loadouts and bundles as first-class Registry objects,
3. make downstream poker proof linkage possible.

Primary test:

1. `e2e/171_registry_proof_cards_loadouts.spec.js`

GREEN gate:

1. Storefronts render proof-card sections deterministically.
2. Loadouts and bundles serialize as Registry objects.
3. Proof summaries expose stable evidence references.

### M24.5 - Worker-visible Web and Registry tool/state surface

Purpose:

1. add the missing worker-visible tools and getters,
2. keep existing skill compatibility intact.

Primary test:

1. `e2e/172_web_tool_state_surface.spec.js`

GREEN gate:

1. `agent_town_ui_web_open` exists and preserves modal continuity.
2. `agent_town_state_get_registry_entity` returns durable Registry state.
3. `agent_town_state_get_web_session` returns durable Web session state.

### M24.6 - Richer integration pack compiler contract

Purpose:

1. extend the current pack compiler to the required joined-spec file set,
2. keep the current pack identity rules deterministic.

Primary test:

1. `e2e/173_web_pack_compiler_manifest_contract.spec.js`

GREEN gate:

1. Required pack outputs are present for supported integrations.
2. `fileHashes` and `contentHash` remain stable under idempotent recompilation.
3. Manifest, overlay, policy, verification, and provenance outputs are present.

### M24.7 - Parse import pipeline contract

Purpose:

1. support Parse-derived metadata as a real integration source,
2. compile Parse output into the same internal pack model.

Primary test:

1. `e2e/174_web_parse_pipeline_contract.spec.js`

GREEN gate:

1. Parse-backed imports compile without live dependencies.
2. Parse provenance is visible in compiled pack metadata.
3. Runtime continues to consume only the internal compiled pack.

### M24.8 - `threaded_feed_v1` adapter pack

Primary test:

1. `e2e/175_web_adapter_threaded_feed.spec.js`

GREEN gate:

1. Adapter action inventory is explicit.
2. Approval-gated actions fail closed without approval.
3. Evidence and trace outputs are deterministic.

### M24.9 - `deliberation_v1` adapter pack

Primary test:

1. `e2e/176_web_adapter_deliberation.spec.js`

GREEN gate:

1. Deliberation actions and trace mappings are deterministic.
2. Approval/evidence semantics remain consistent with the joined spec.

### M24.10 - `repo_workbench_v1` adapter pack

Primary test:

1. `e2e/177_web_adapter_repo_workbench.spec.js`

GREEN gate:

1. Repository workbench actions and trace mappings are deterministic.
2. The implementation goes beyond the current GitHub-minimal surface.

### M24.11 - Poker season detail and bundle hash contract

Purpose:

1. enrich season detail,
2. move bundle hash computation into Portal UX.

Primary test:

1. `e2e/178_poker_season_detail_bundle_hash.spec.js`

GREEN gate:

1. Season detail exposes rules and submission-window state.
2. Portal computes stable bundle hashes.
3. Submission UX no longer depends solely on manual hash entry.

### M24.12 - Poker run detail and snapshot history

Primary test:

1. `e2e/179_poker_run_detail_snapshot_history.spec.js`

GREEN gate:

1. Run detail route exists.
2. Snapshot-history route exists.
3. Ordering and identity are deterministic.

### M24.13 - Poker Registry proof linkage and safety smoke

Primary test:

1. `e2e/180_poker_registry_proof_safety_smoke.spec.js`

GREEN gate:

1. Poker results link into Registry proof cards.
2. Browser Class and safety metadata are visible where applicable.
3. Operator truth remains authoritative.

## 5. Required Doc Sync

At minimum, this phase updates:

1. `specs/02_api_contract.md`
2. `public/skill.md`
3. `docs/internal-skill-testline.md`
4. `specs/11_district_map_storefront_spec.md`
5. `specs/14_trainer_namespace_tdd_spec.md` only if the runtime tool namespace changes
6. `specs/15_experience_os_intent_tools_tdd_spec.md`
7. `specs/22_option5_integration_unified_completion_spec.md`
8. `specs/23_option5_integration_completion_backlog.md`

## 6. Phase Exit

This phase is complete when:

1. Registry behaves as a real family-first proof surface,
2. the missing worker-visible Web and Registry tool/state contracts exist,
3. the Web pack model and Parse bridge are complete for the joined scope,
4. Poker has run detail, snapshot history, Portal-side hash computation, and Registry proof linkage,
5. the full Phase 24 reserved block is green.
