# Phase 25 Spec: Platform, House, and Tracks Completion (Contracts First, TDD)

Status: Draft
Version: 1.0
Depends on:
1. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
2. [specs/23_option5_integration_completion_backlog.md](./23_option5_integration_completion_backlog.md)
3. [specs/24_option5_integration_registry_web_poker_tdd_spec.md](./24_option5_integration_registry_web_poker_tdd_spec.md)
4. [specs/02_api_contract.md](./02_api_contract.md)
5. [specs/14_trainer_namespace_tdd_spec.md](./14_trainer_namespace_tdd_spec.md)
6. [AGENTS.md](../AGENTS.md)
Detailed execution runbook:
1. [specs/27_option5_integration_platform_house_tracks_agent_runbook.md](./27_option5_integration_platform_house_tracks_agent_runbook.md)

Goal: finish the remaining platform depth after Registry, Web, and Poker completion by making trainer, seals, House, and tracks materially real.

Implementation constraints:

1. Do not reopen earlier completed contracts.
2. Keep worker-first and modal-first continuity.
3. Keep `trainer.*` runtime-only and `trainer_job.*` durable-job-only.
4. Do not introduce a second House, pack, or progression model.
5. Keep default tests deterministic and offline-safe.
6. Werewolf remains out of scope.

## 1. Executive Summary

This program closes the remaining gap between the current option5 spine and the fuller non-Werewolf product goal:

1. real trainer outputs with artifact refs,
2. real seal-aware fairness boundaries,
3. broader experience and pack compatibility on the shared platform,
4. fuller House surfaces,
5. track and reward foundations,
6. final end-to-end joined completion proof.

Reserved Playwright block:

1. `183` to `194`

Reserved tests:

1. `e2e/183_completion_harness_platform_house_tracks.spec.js`
2. `e2e/184_trainer_real_result_artifacts.spec.js`
3. `e2e/185_seal_enforcement_read_filter.spec.js`
4. `e2e/186_trainer_extended_job_kinds.spec.js`
5. `e2e/187_platform_experience_registration.spec.js`
6. `e2e/188_house_experiences_surface.spec.js`
7. `e2e/189_house_workshop_inbox_surface.spec.js`
8. `e2e/190_house_office_staff_scaffold.spec.js`
9. `e2e/191_tracks_core_reward_hooks.spec.js`
10. `e2e/192_tracks_progression_surface.spec.js`
11. `e2e/193_experience_pack_editor_compat_contract.spec.js`
12. `e2e/194_unified_completion_full_smoke.spec.js`

## 2. Global Measurable Metrics

### 2.1 Trainer metrics

1. compare results are not fixture-only,
2. trainer results expose non-empty artifact refs when derived data exists,
3. added durable job kinds have stable request and result envelopes,
4. promotion and lineage remain deterministic after richer trainer output lands.

### 2.2 Seal metrics

1. sensitive reads either redact, filter, or reject according to seal policy,
2. seal violations remain auditable,
3. post-release behavior is distinguishable from live-window behavior,
4. trainer jobs respect sealed-context boundaries where required.

### 2.3 Platform compatibility metrics

1. supported experience registration is explicit and deterministic,
2. new experience compatibility rules do not rely on hidden hardcoded literals,
3. all experience entry paths that require immutable config pinning enforce it,
4. pack and editor compatibility extends the existing internal pack model rather than replacing it.

### 2.4 House metrics

1. new House surfaces preserve worker continuity,
2. new House surfaces preserve modal continuity where required,
3. House surfaces reflect the same durable state as the platform routes,
4. added object-model scaffolding does not break current team flows.

### 2.5 Track metrics

1. track progress updates are deterministic,
2. reward hooks are trace-backed,
3. anti-farming rules suppress trivial repeated actions,
4. user-facing terminology uses `track`,
5. fair-play or seal violations can influence relevant track progress.

## 3. Test Harness Rules

1. All new late-phase tests must run offline with seeded fixtures.
2. Track and reward fixtures must be resettable through the existing test reset path.
3. Trainer-result fixtures may seed inputs, but the output under test must use the production path.
4. Final smoke must cover Registry, Web, Poker, trainer, House, and tracks from one coherent shell.
5. `/__test__/unified-platform/stats` must expose deterministic `fixtureManifest`, `fixtureManifestHash`, and `inspectors.artifacts|seals|house|tracks` for the late-phase harness.

## 4. Required Fixture Families

1. `trainer_real_result_seed`
2. `sealed_read_policy_seed`
3. `platform_experience_registration_seed`
4. `house_experiences_seed`
5. `house_workshop_seed`
6. `house_office_staff_seed`
7. `tracks_core_seed`
8. `tracks_progress_seed`
9. `editor_pack_compat_seed`
10. `joined_completion_smoke_seed`

## 5. Milestone Map

### M25.0 - Late-phase harness alignment

Primary test:

1. `e2e/183_completion_harness_platform_house_tracks.spec.js`

RED gate:

1. late-phase fixture families are missing,
2. test mode cannot inspect artifact refs or track updates.

GREEN gate:

1. required fixtures load deterministically,
2. observability exists for artifacts, seals, House surfaces, and tracks.

### M25.1 - Real trainer result artifacts

Primary test:

1. `e2e/184_trainer_real_result_artifacts.spec.js`

RED gate:

1. trainer compare remains fixture-only,
2. artifact refs remain empty despite derived output.

GREEN gate:

1. trainer compare produces materially real result content,
2. artifact refs are persisted when derived output exists,
3. artifact refs expose stable `traceArtifactId`, `artifactKind`, and `contentHash`,
4. lineage and promotion remain stable.

### M25.2 - Seal-aware read filtering

Primary test:

1. `e2e/185_seal_enforcement_read_filter.spec.js`

RED gate:

1. entrant-private or sealed data is still returned raw on sensitive reads,
2. seal policy does not affect arena-sensitive analysis paths.

GREEN gate:

1. seal-sensitive reads filter, redact, or reject deterministically,
2. violations remain auditable,
3. post-release reads behave differently from live-window reads where policy requires it.

Implementation notes:

1. `GET /v1/traces/:traceId/events` is the first mandatory seal-aware read surface.
2. Active sealed reads must support deterministic policy evaluation from `readerId` and `readerSource`.
3. Protected reads create at most one durable `sealed_context_violations` row per sealed context per request.
4. Redacted payloads must preserve the event envelope and expose `auditKind = sealed_read_attempt`.

### M25.3 - Extended trainer job kinds

Primary test:

1. `e2e/186_trainer_extended_job_kinds.spec.js`

RED gate:

1. durable trainer support remains compare-only,
2. replay, recommend, or guardrails jobs are informal or non-durable.

GREEN gate:

1. `trainer_job.replay`, `trainer_job.recommend`, and `trainer_job.guardrails` have stable durable contracts,
2. results are non-empty and meaningful,
3. job/result persistence is deterministic.

Implementation notes:

1. All three job kinds may complete synchronously for seeded deterministic inputs.
2. Each job kind must emit one non-empty durable result row plus one artifact ref.
3. Idempotent replay must return the same `trainerJobId` and `trainerResultId`.

### M25.4 - Broader experience registration and config-pinning closure

Primary test:

1. `e2e/187_platform_experience_registration.spec.js`

RED gate:

1. platform experience support still depends on a narrow hardcoded allowlist,
2. Registry and House cannot reference broader supported experience surfaces cleanly,
3. some experience entry paths still avoid immutable config pinning.

GREEN gate:

1. supported experience registration is explicit and extensible,
2. invalid experience ids still fail deterministically,
3. broader experience compatibility does not require a rewrite,
4. all experience entry paths that require immutable config pinning enforce it.

Implementation notes:

1. `/v1/experiences` is the canonical registration surface for this milestone.
2. Canonical experience ids may accept compatibility aliases, but stored runs must persist the canonical id.
3. `poker_operator` ingest must stop creating `season_lock` runs with empty `configVersionId`.

### M25.5 - House Experiences surface

Primary test:

1. `e2e/188_house_experiences_surface.spec.js`

RED gate:

1. House still exposes only Archive and Trainer,
2. experiences remain invisible from the House shell.

GREEN gate:

1. House exposes a minimal Experiences surface,
2. experience entries link cleanly into current Registry, Web, and Poker surfaces,
3. continuity rules are preserved.

Implementation notes:

1. `GET /api/platform/experiences` is the read route for this milestone.
2. House Experiences stays a read-only shell surface in this slice.
3. The seeded order from `house_experiences_seed` is the deterministic rendering order.

### M25.6 - House Workshop and Inbox linkage

Primary test:

1. `e2e/189_house_workshop_inbox_surface.spec.js`

RED gate:

1. config lineage is not legible from House,
2. Inbox linkage breaks continuity or identity assumptions.

GREEN gate:

1. House exposes a minimal Workshop/config surface with active config visibility,
2. House can open Inbox cleanly from the same shell,
3. the Workshop reflects durable config lineage truth.

Implementation notes:

1. `GET /api/platform/workshop` is the read route for this milestone.
2. Workshop reads the current active team binding and config lineage rather than a parallel House cache.
3. Inbox linkage must reuse the same modal/frame continuity path as the rest of the hub shell.

### M25.7 - Office and staff scaffolding contract

Primary test:

1. `e2e/190_house_office_staff_scaffold.spec.js`

RED gate:

1. House object-model expansion requires a rewrite,
2. office or staff scaffolding breaks current team flows.

GREEN gate:

1. minimal office and staff-agent scaffolding exists,
2. current team behavior remains intact,
3. serialization is deterministic and forward-compatible.

### M25.8 - Tracks core and reward hooks

Primary test:

1. `e2e/191_tracks_core_reward_hooks.spec.js`

RED gate:

1. tracks still have no durable model,
2. reward-related events are not trace-backed,
3. anti-farming rules are absent.

GREEN gate:

1. tracks have a durable core model,
2. reward hooks are trace-backed,
3. anti-farming and fair-play rules are enforceable.

### M25.9 - Tracks progression surface

Primary test:

1. `e2e/192_tracks_progression_surface.spec.js`

RED gate:

1. track progress is not visible to the user,
2. UI uses unstable or confusing progression terminology.

GREEN gate:

1. at least Poker Mastery, Web Ops, Builder, and Analyst tracks are visible,
2. UI terminology uses `track`,
3. progress changes deterministically from seeded actions.

### M25.10 - Experience-pack and editor compatibility contract

Primary test:

1. `e2e/193_experience_pack_editor_compat_contract.spec.js`

RED gate:

1. editor compatibility would require a second pack standard,
2. compatible pack primitives are not explicit.

GREEN gate:

1. editor compatibility is defined in terms of the existing internal pack model,
2. verification remains deterministic,
3. House, Registry, Web, and trainer surfaces can all consume the same compatible pack shape.

### M25.11 - Final joined completion smoke

Primary test:

1. `e2e/194_unified_completion_full_smoke.spec.js`

RED gate:

1. completed subsystems still behave like separate products,
2. the final product path depends on hidden manual steps,
3. docs still describe competing implementation paths.

GREEN gate:

1. Registry, Web, Poker, trainer, House, and tracks operate from one coherent shell and durable state model,
2. final smoke is deterministic and offline-safe,
3. the Phase 22 through Phase 25 doc set is internally consistent.

## 6. Bundle Gate

This Phase 25 program is complete only when:

1. tests `183` through `194` are green,
2. trainer outputs are materially real,
3. seals are meaningfully enforced,
4. House exposes the planned additional surfaces without breaking continuity,
5. tracks are real and user-facing,
6. editor compatibility is defined without reopening pack semantics,
7. final full smoke proves one coherent non-Werewolf product path.
