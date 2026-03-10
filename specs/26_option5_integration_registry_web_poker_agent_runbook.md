# Phase 26 Spec: Detailed AI-Agent Runbook for Registry, Web, and Poker

Status: Draft
Version: 1.0
Depends on:
1. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
2. [specs/23_option5_integration_completion_backlog.md](./23_option5_integration_completion_backlog.md)
3. [specs/24_option5_integration_registry_web_poker_tdd_spec.md](./24_option5_integration_registry_web_poker_tdd_spec.md)
4. [specs/02_api_contract.md](./02_api_contract.md)
5. [specs/15_experience_os_intent_tools_tdd_spec.md](./15_experience_os_intent_tools_tdd_spec.md)
6. [AGENTS.md](../AGENTS.md)

Purpose: convert the Phase 24 milestones into AI-agent-sized TDD work packets with explicit measurable verification.

This document is not a second plan. It is the detailed execution layer for [specs/24_option5_integration_registry_web_poker_tdd_spec.md](./24_option5_integration_registry_web_poker_tdd_spec.md).

## 1. How AI Agents Must Use This Runbook

1. Only take the next unlocked test in sequence.
2. Make the named Playwright test fail for the intended reason before implementing the fix.
3. Keep each implementation pass small:
   - at most one storage concern,
   - at most one route family,
   - at most one UI surface,
   - plus the required docs and test updates.
4. If a step needs more than `6` production files or more than `3` distinct domains, split the work before coding.
5. A step is only done when:
   - the named Playwright test is green,
   - the measurable metrics below are observable,
   - required docs are updated in the same change,
   - previously green reserved tests remain green.

## 2. Global Verification Rules

### 2.1 Determinism

For this phase, `deterministic` means:

1. after the same reset/seed flow, ids, ordering, and content hashes are stable,
2. no live third-party dependency is required for the default test path,
3. repeated test execution produces the same structured payload shape.

### 2.2 Stable ordering

Unless a stronger rule is declared in a milestone:

1. families sort by `familySlug` ascending,
2. members inside a family sort by canonical entity slug ascending,
3. snapshot history sorts newest-first by snapshot timestamp,
4. replay or run events sort by stable turn or emitted-at order.

### 2.3 Modal continuity

`modal continuity` is satisfied only when:

1. the town hub shell remains the page root,
2. the worker runtime is not restarted by full-page navigation,
3. deep links reopen the intended modal or embed route rather than leaving the hub.

### 2.4 Allowed spillover

Tests `181` and `182` are reserved buffer only if:

1. one Phase 24 milestone cannot stay under the small-step scope cap, and
2. the Phase 24 spec and this runbook are updated first to explain the split.

## 3. Test Sequence

### T24.0 - `e2e/167_joined_completion_harness.spec.js`

- Goal: establish fixtures and observability for the rest of the phase.
- Scope cap: harness, fixtures, debug visibility only.
- Dependencies: none.
- Small-step order:
  1. register all Phase 24 fixture families,
  2. expose deterministic test-mode inspection for grouped registry output, compiled pack metadata, and poker history,
  3. document fixture reset expectations.
- Measurable metrics:
  1. all `8` required fixture families load in test mode,
  2. a single reset call returns the same fixture manifest hash twice in a row,
  3. test mode exposes inspection for `registry`, `pack`, and `poker` without network calls.
- Required doc sync:
  1. [specs/24_option5_integration_registry_web_poker_tdd_spec.md](./24_option5_integration_registry_web_poker_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/167_joined_completion_harness.spec.js`

### T24.1 - `e2e/168_registry_health_family_schema.spec.js`

- Goal: move Registry from a flat entity-only base to a family-aware durable shape.
- Scope cap: Registry storage plus Registry routes only.
- Dependencies: `T24.0`
- Small-step order:
  1. add family-aware schema primitives,
  2. seed one deterministic family fixture,
  3. add `GET /api/registry/health`,
  4. preserve existing import/entity compatibility.
- Measurable metrics:
  1. `GET /api/registry/health` returns `200`,
  2. payload contains stable `ok`, `schemaVersion`, and `familyModelReady` fields,
  3. repeating the same reset and health request returns the same `schemaVersion`,
  4. existing import and entity lookup tests still pass.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/24_option5_integration_registry_web_poker_tdd_spec.md](./24_option5_integration_registry_web_poker_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/168_registry_health_family_schema.spec.js`

### T24.2 - `e2e/169_registry_grouped_search_storefront.spec.js`

- Goal: make Registry search family-first and return storefront-ready payloads.
- Scope cap: Registry search serialization plus Registry storefront read payloads.
- Dependencies: `T24.1`
- Small-step order:
  1. switch search results from flat items to grouped family envelopes,
  2. add storefront-safe entity payload shape,
  3. add family page payload shape,
  4. keep Atlas semantics unchanged.
- Measurable metrics:
  1. search result top-level items are family groups, not flat projections,
  2. each group includes `familySlug`, `familyTitle`, and `members`,
  3. groups sort by `familySlug` ascending,
  4. entity and family payloads return stable ids and slugs across repeated resets,
  5. Registry queries do not change current hub district state.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/11_district_map_storefront_spec.md](./11_district_map_storefront_spec.md)
- Verification:
  1. `npx playwright test e2e/169_registry_grouped_search_storefront.spec.js`

### T24.3 - `e2e/170_registry_claim_review_queue.spec.js`

- Goal: add claim-start and deterministic review-state visibility.
- Scope cap: Registry claim routes, review storage, and no more than one minimal UI entry point.
- Dependencies: `T24.2`
- Small-step order:
  1. add claim-start durable records,
  2. add duplicate and review status transitions,
  3. expose review queue read route,
  4. expose minimal claim action in Registry UI if needed by the test.
- Measurable metrics:
  1. invalid claim requests fail with stable error codes such as `wallet_required`, `claim_target_missing`, or `claim_conflict`,
  2. valid wallet-bound claim requests create deterministic review rows,
  3. review queue returns duplicate and validation items in stable order,
  4. the same seed produces the same queue counts twice in a row.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/24_option5_integration_registry_web_poker_tdd_spec.md](./24_option5_integration_registry_web_poker_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/170_registry_claim_review_queue.spec.js`

### T24.4 - `e2e/171_registry_proof_cards_loadouts.spec.js`

- Goal: make Registry proof and loadouts first-class.
- Scope cap: Registry proof routes plus Registry storefront proof rendering.
- Dependencies: `T24.3`
- Small-step order:
  1. add proof summary storage shape,
  2. add loadout and bundle object serialization,
  3. expose `GET /api/registry/proof/:registryId`,
  4. render deterministic proof cards and loadout sections.
- Measurable metrics:
  1. proof summary payload contains stable `evidenceId`, `sourceKind`, and `linkedAt`,
  2. loadouts serialize with stable `loadoutId` and ordered component refs,
  3. storefront renders at least one proof card and one loadout section for seeded data,
  4. repeated resets produce the same proof card count and same evidence ids.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/11_district_map_storefront_spec.md](./11_district_map_storefront_spec.md)
- Verification:
  1. `npx playwright test e2e/171_registry_proof_cards_loadouts.spec.js`

### T24.5 - `e2e/172_web_tool_state_surface.spec.js`

- Goal: expose missing worker-visible web and registry tools without breaking continuity.
- Scope cap: worker tool surface, skill docs, and minimal routing glue only.
- Dependencies: `T24.0`
- Small-step order:
  1. add `agent_town_ui_web_open`,
  2. add `agent_town_state_get_registry_entity`,
  3. add `agent_town_state_get_web_session`,
  4. update skill docs and internal testline.
- Measurable metrics:
  1. all `3` new tool ids appear in the worker tool surface,
  2. invoking them from the hub does not change the root page path away from the hub shell,
  3. registry state getter returns durable `registryId` and `entityVersionId`,
  4. web session getter returns durable `sessionId` and last checkpoint identity.
- Required doc sync:
  1. [public/skill.md](../public/skill.md)
  2. `docs/internal-skill-testline.md`
  3. [specs/15_experience_os_intent_tools_tdd_spec.md](./15_experience_os_intent_tools_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/172_web_tool_state_surface.spec.js`

### T24.6 - `e2e/173_web_pack_compiler_manifest_contract.spec.js`

- Goal: upgrade the internal web pack compiler to a richer deterministic file set.
- Scope cap: compiler outputs and compile/read serialization only.
- Dependencies: `T24.5`
- Small-step order:
  1. add required internal pack files,
  2. expose stable `fileHashes`,
  3. expose stable `contentHash`,
  4. keep raw external manuals non-authoritative.
- Measurable metrics:
  1. compiled packs contain `manifest.json`, `overlay.json`, `policy.json`, `verification.json`, and `provenance.json`,
  2. `fileHashes` includes every required file exactly once,
  3. recompiling unchanged input under the same idempotent request returns the same `packVersionId` and `contentHash`,
  4. missing or unsupported inputs fail with stable compiler errors.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/24_option5_integration_registry_web_poker_tdd_spec.md](./24_option5_integration_registry_web_poker_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/173_web_pack_compiler_manifest_contract.spec.js`

### T24.7 - `e2e/174_web_parse_pipeline_contract.spec.js`

- Goal: make Parse a real deterministic import source.
- Scope cap: Parse stub ingestion and compile bridge only.
- Dependencies: `T24.6`
- Small-step order:
  1. define Parse-originated candidate metadata,
  2. seed Parse fixtures or stubs,
  3. compile Parse sources into the same internal pack model,
  4. expose Parse provenance in compiled output.
- Measurable metrics:
  1. Parse-backed imports compile without live network access,
  2. compiled candidate metadata exposes `sourceKind: "parse"`,
  3. compiled provenance contains a stable Parse provenance block,
  4. the resulting pack follows the same manifest and hash rules as non-Parse packs.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/24_option5_integration_registry_web_poker_tdd_spec.md](./24_option5_integration_registry_web_poker_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/174_web_parse_pipeline_contract.spec.js`

### T24.8 - `e2e/175_web_adapter_threaded_feed.spec.js`

- Goal: land the first real adapter family.
- Scope cap: one adapter family only.
- Dependencies: `T24.6`
- Small-step order:
  1. declare the adapter manifest,
  2. declare the action inventory,
  3. wire approval posture,
  4. emit stable trace and evidence shape.
- Measurable metrics:
  1. adapter manifest declares at least `read_feed`, `read_thread`, `draft_reply`, and `send_reply`,
  2. approval-gated write actions fail closed without approval,
  3. successful actions emit stable trace event names and evidence ids,
  4. embedded and companion render modes both stay deterministic.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/15_experience_os_intent_tools_tdd_spec.md](./15_experience_os_intent_tools_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/175_web_adapter_threaded_feed.spec.js`

### T24.9 - `e2e/176_web_adapter_deliberation.spec.js`

- Goal: add structured deliberation/work-item support.
- Scope cap: one adapter family only.
- Dependencies: `T24.6`
- Small-step order:
  1. declare deliberation manifest,
  2. declare action inventory,
  3. wire approval and evidence behavior,
  4. map stable traces.
- Measurable metrics:
  1. adapter declares at least `list_boards`, `read_item`, `comment_item`, and `change_status`,
  2. approval-gated actions reject cleanly when approval is absent,
  3. trace mappings are stable across repeated seeded runs,
  4. evidence payloads carry stable ids and action names.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
- Verification:
  1. `npx playwright test e2e/176_web_adapter_deliberation.spec.js`

### T24.10 - `e2e/177_web_adapter_repo_workbench.spec.js`

- Goal: go beyond the current GitHub-minimal path with a repo-workbench family.
- Scope cap: one adapter family only.
- Dependencies: `T24.6`
- Small-step order:
  1. define repo-workbench manifest,
  2. define read and write-capable action inventory,
  3. wire trace, approval, and evidence behavior,
  4. expose companion render mode if required.
- Measurable metrics:
  1. adapter declares at least `list_repo`, `read_file`, `search_code`, `stage_patch`, and `draft_pr`,
  2. write-capable actions fail closed without approval,
  3. action inventory and file-hash outputs are deterministic,
  4. resulting surface is not limited to a hardcoded GitHub-only UI assumption.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
- Verification:
  1. `npx playwright test e2e/177_web_adapter_repo_workbench.spec.js`

### T24.11 - `e2e/178_poker_season_detail_bundle_hash.spec.js`

- Goal: make the season page richer and remove manual hash-only submission flow.
- Scope cap: poker season detail route plus submission UI only.
- Dependencies: `T24.0`
- Small-step order:
  1. extend season detail payload with rules and submission-window fields,
  2. compute bundle hash in Portal,
  3. render the computed hash in the submission flow,
  4. keep operator truth authoritative.
- Measurable metrics:
  1. season detail payload contains stable `rulesSummary` and `submissionWindow`,
  2. Portal computes a bundle hash that matches the expected seeded hash,
  3. the submission form can populate a hash without requiring manual human entry,
  4. division or season labels remain mirrored from operator data rather than rewritten locally.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/24_option5_integration_registry_web_poker_tdd_spec.md](./24_option5_integration_registry_web_poker_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/178_poker_season_detail_bundle_hash.spec.js`

### T24.12 - `e2e/179_poker_run_detail_snapshot_history.spec.js`

- Goal: expose poker run detail and leaderboard history as first-class Portal surfaces.
- Scope cap: poker read routes and poker UI only.
- Dependencies: `T24.11`
- Small-step order:
  1. add run detail route,
  2. add snapshot history route,
  3. render deterministic run and history views,
  4. keep replay linkage stable.
- Measurable metrics:
  1. run detail route returns stable `runId`, `submissionId`, and seat-result summary,
  2. snapshot history returns newest-first rows with stable snapshot ids,
  3. the same seeded season produces the same snapshot count twice in a row,
  4. replay links continue to resolve from run detail without leaving the modal/embed shell.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
- Verification:
  1. `npx playwright test e2e/179_poker_run_detail_snapshot_history.spec.js`

### T24.13 - `e2e/180_poker_registry_proof_safety_smoke.spec.js`

- Goal: connect poker outputs into Registry proof while exposing safety metadata cleanly.
- Scope cap: poker proof linkage plus Registry proof rendering only.
- Dependencies: `T24.4`, `T24.12`
- Small-step order:
  1. attach poker evidence refs to Registry proof model,
  2. expose Browser Class and safety metadata where present,
  3. render poker-linked proof in Registry storefronts,
  4. verify operator truth is mirrored, not rewritten.
- Measurable metrics:
  1. Registry proof cards can show at least one poker-derived evidence reference,
  2. safety metadata includes stable `sourceKind` and policy or flag labels,
  3. Browser Class metadata is structured when present and absent cleanly when not present,
  4. displayed scores and ranks match the seeded operator truth exactly.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/11_district_map_storefront_spec.md](./11_district_map_storefront_spec.md)
- Verification:
  1. `npx playwright test e2e/180_poker_registry_proof_safety_smoke.spec.js`

## 4. Phase Exit Rules

Phase 24 is complete only when:

1. tests `167` through `180` are green,
2. tests `181` and `182` remain unused or are formally introduced by a spec edit,
3. every reserved test has a measurable verification path captured above,
4. no step required a second architecture path or a non-deterministic live dependency.
