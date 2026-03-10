# Phase 27 Spec: Detailed AI-Agent Runbook for Platform, House, and Tracks

Status: Draft
Version: 1.0
Depends on:
1. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
2. [specs/23_option5_integration_completion_backlog.md](./23_option5_integration_completion_backlog.md)
3. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
4. [specs/02_api_contract.md](./02_api_contract.md)
5. [specs/14_trainer_namespace_tdd_spec.md](./14_trainer_namespace_tdd_spec.md)
6. [AGENTS.md](../AGENTS.md)

Purpose: convert the Phase 25 milestones into AI-agent-sized TDD work packets with explicit measurable verification.

This document is not a competing plan. It is the detailed execution layer for [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md).

## 1. How AI Agents Must Use This Runbook

1. Do not start this phase until Phase 24 is green or formally waived.
2. Only take the next unlocked test in sequence.
3. Keep each implementation pass small:
   - at most one platform concern,
   - at most one House surface,
   - at most one track surface,
   - plus required docs and tests.
4. If a step would touch more than `7` production files or more than `3` durable domains, split the implementation before coding.
5. A step is only complete when the named Playwright test is green and the measurable metrics below are visible.

## 2. Global Verification Rules

### 2.1 Real trainer output

For this phase, `real` trainer output means:

1. result bodies are derived from current production logic rather than static fixture payloads,
2. artifact refs are persisted when derived content exists,
3. promotion and lineage remain deterministic after result generation.

### 2.2 Seal enforcement

Seal behavior is complete for a milestone only when:

1. sensitive reads either redact, filter, or reject according to policy,
2. the choice is deterministic for the same seal state,
3. rejected or filtered reads leave an auditable trail.

### 2.3 House continuity

House continuity is preserved only when:

1. House remains reachable from the shared hub shell,
2. modal or in-shell navigation does not restart the worker unnecessarily,
3. team context survives House surface changes.

### 2.4 Tracks discipline

Tracks remain in scope only if:

1. they are trace-backed,
2. they do not introduce point-farming clutter,
3. anti-farming or fair-play suppression is deterministic.

## 3. Test Sequence

### T25.0 - `e2e/183_completion_harness_platform_house_tracks.spec.js`

- Goal: establish fixtures and observability for the late phase.
- Scope cap: fixtures, reset paths, and test-mode observability only.
- Dependencies: complete Phase 24 harness.
- Small-step order:
  1. register all Phase 25 fixture families,
  2. expose deterministic inspection for artifacts, seals, House surfaces, and tracks,
  3. document reset expectations.
- Measurable metrics:
  1. all `10` required fixture families load in test mode,
  2. a repeated reset returns the same fixture manifest summary twice,
  3. artifact refs, seal state, House surfaces, and track progress are inspectable offline.
- Required doc sync:
  1. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/183_completion_harness_platform_house_tracks.spec.js`

### T25.1 - `e2e/184_trainer_real_result_artifacts.spec.js`

- Goal: replace scaffolded trainer compare output with materially real results.
- Scope cap: trainer result generation and artifact persistence only.
- Dependencies: `T25.0`
- Small-step order:
  1. route compare jobs through real result generation,
  2. persist non-empty artifact refs,
  3. preserve config promotion and lineage compatibility.
- Measurable metrics:
  1. compare results are not byte-identical to the old static fixture payload,
  2. seeded derived outputs create at least one artifact ref,
  3. artifact refs remain stable across repeated seeded runs,
  4. patch promotion still resolves to the same target config lineage.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/184_trainer_real_result_artifacts.spec.js`

### T25.2 - `e2e/185_seal_enforcement_read_filter.spec.js`

- Goal: make sealed-context reads materially enforce policy.
- Scope cap: read filtering plus audit trail only.
- Dependencies: `T25.1`
- Small-step order:
  1. define seal-sensitive read policy,
  2. filter, redact, or reject according to policy,
  3. persist audit or violation visibility,
  4. keep post-release behavior distinct where required.
- Measurable metrics:
  1. sealed entrant-private fields are absent or redacted on protected reads,
  2. identical sealed requests produce the same filtered outcome twice in a row,
  3. audit records increment deterministically when a protected read is attempted,
  4. release-window state changes the visibility outcome only where explicitly documented.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/185_seal_enforcement_read_filter.spec.js`

### T25.3 - `e2e/186_trainer_extended_job_kinds.spec.js`

- Goal: make durable trainer support broader than compare-only.
- Scope cap: durable trainer jobs only.
- Dependencies: `T25.1`
- Small-step order:
  1. define `trainer_job.replay`,
  2. define `trainer_job.recommend`,
  3. define `trainer_job.guardrails`,
  4. persist stable request/result envelopes.
- Measurable metrics:
  1. all `3` new durable job kinds accept stable request payloads,
  2. each job kind returns a non-empty result body,
  3. each job kind persists a durable job row and durable result row,
  4. repeated seeded runs preserve result schema and status transitions.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/14_trainer_namespace_tdd_spec.md](./14_trainer_namespace_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/186_trainer_extended_job_kinds.spec.js`

### T25.4 - `e2e/187_platform_experience_registration.spec.js`

- Goal: replace narrow hardcoded experience support with explicit registration and config-pinning closure.
- Scope cap: platform experience registration plus config-pinning rules only.
- Dependencies: `T25.2`, `T25.3`
- Small-step order:
  1. add explicit supported-experience registration,
  2. move validation to registered experience metadata,
  3. enforce config pinning on all required run-creation paths,
  4. preserve deterministic failure for unknown experience ids.
- Measurable metrics:
  1. supported experiences are visible in one deterministic registration surface,
  2. invalid experience ids fail with stable errors,
  3. run-creation paths that require config pinning persist non-empty `configVersionId`,
  4. poker operator ingest no longer creates pinned runs with empty config lineage.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/187_platform_experience_registration.spec.js`

### T25.5 - `e2e/188_house_experiences_surface.spec.js`

- Goal: expose a minimal but real House Experiences surface.
- Scope cap: House read surface only.
- Dependencies: `T25.4`
- Small-step order:
  1. add a House experiences index,
  2. render deterministic experience entries,
  3. link entries into current Registry, Web, and Poker surfaces without breaking continuity.
- Measurable metrics:
  1. House exposes an Experiences surface in the same shell as Archive and Trainer,
  2. seeded experience entries render in stable order,
  3. opening an experience preserves team context and shell continuity,
  4. experience entries point to real existing surfaces rather than placeholder links.
- Required doc sync:
  1. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
  2. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/188_house_experiences_surface.spec.js`

### T25.6 - `e2e/189_house_workshop_inbox_surface.spec.js`

- Goal: expose Workshop/config lineage and Inbox linkage from the House shell.
- Scope cap: House Workshop plus House Inbox linkage only.
- Dependencies: `T25.5`
- Small-step order:
  1. render active config lineage in House,
  2. expose a minimal Workshop surface,
  3. link to Inbox from the same shell,
  4. preserve wallet-first and team context.
- Measurable metrics:
  1. House shows the active config version id or lineage summary deterministically,
  2. Workshop reflects the same durable config lineage as the platform routes,
  3. Inbox opens without leaving the shared shell,
  4. repeated seeded loads show the same active config summary.
- Required doc sync:
  1. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
  2. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/189_house_workshop_inbox_surface.spec.js`

### T25.7 - `e2e/190_house_office_staff_scaffold.spec.js`

- Goal: add forward-compatible office and staff scaffolding without rewriting House.
- Scope cap: serialization and minimal read surfaces only.
- Dependencies: `T25.5`
- Small-step order:
  1. define office scaffolding,
  2. define staff-agent scaffolding,
  3. expose deterministic serializers or minimal reads,
  4. keep current team flows unchanged.
- Measurable metrics:
  1. at least one office scaffold and one staff-agent scaffold serialize deterministically,
  2. current team selection and House access still work unchanged,
  3. scaffold objects are absent cleanly when unseeded and stable when seeded.
- Required doc sync:
  1. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
- Verification:
  1. `npx playwright test e2e/190_house_office_staff_scaffold.spec.js`

### T25.8 - `e2e/191_tracks_core_reward_hooks.spec.js`

- Goal: add a minimal durable track model with trace-backed progression hooks.
- Scope cap: track model plus reward hooks only.
- Dependencies: `T25.4`
- Small-step order:
  1. define durable track records,
  2. emit progress hooks from existing traces,
  3. add anti-farming suppression,
  4. keep UX terminology neutral and minimal.
- Measurable metrics:
  1. seeded actions create deterministic track progress deltas,
  2. reward hooks are trace-backed and reference stable source ids,
  3. repeated trivial duplicate actions do not increment progress past the anti-farming threshold,
  4. no points, token-farming, or gamified clutter is introduced.
- Required doc sync:
  1. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
  2. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/191_tracks_core_reward_hooks.spec.js`

### T25.9 - `e2e/192_tracks_progression_surface.spec.js`

- Goal: render track progress in a clear minimal surface.
- Scope cap: one track read surface only.
- Dependencies: `T25.8`
- Small-step order:
  1. add a track progression read view,
  2. expose deterministic progress summaries,
  3. ensure naming stays `track`,
  4. keep UI minimal.
- Measurable metrics:
  1. at least `Poker Mastery`, `Web Ops`, `Builder`, and `Analyst` render for seeded users,
  2. progress values are deterministic after seeded actions,
  3. UI uses `track` terminology consistently,
  4. no full-page navigation is required to inspect progress from the House shell.
- Required doc sync:
  1. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
- Verification:
  1. `npx playwright test e2e/192_tracks_progression_surface.spec.js`

### T25.10 - `e2e/193_experience_pack_editor_compat_contract.spec.js`

- Goal: define editor compatibility without inventing a second pack standard.
- Scope cap: compatibility contract only.
- Dependencies: `T25.4`
- Small-step order:
  1. define compatible editor-facing pack primitives,
  2. map them onto the existing internal pack model,
  3. expose deterministic verification rules,
  4. prove shared consumption by House, Registry, Web, and trainer surfaces.
- Measurable metrics:
  1. compatible editor packs validate against the same internal pack contract,
  2. verification produces stable pass or fail output for seeded fixtures,
  3. no alternate pack standard or alternate manifest root is introduced,
  4. the same compatible pack shape is consumable by multiple product surfaces.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/193_experience_pack_editor_compat_contract.spec.js`

### T25.11 - `e2e/194_unified_completion_full_smoke.spec.js`

- Goal: prove one coherent non-Werewolf product path across the whole joined program.
- Scope cap: final integration and release gating only.
- Dependencies: all earlier Phase 25 tests.
- Small-step order:
  1. script one coherent seeded user journey,
  2. cover Registry, Web, Poker, trainer, House, and tracks in one shell,
  3. assert no hidden manual step is needed,
  4. lock final docs.
- Measurable metrics:
  1. final smoke exercises all six major surfaces in one deterministic flow,
  2. the flow stays inside the intended shell or modal rules,
  3. artifact, proof, and track state are all visible by the end of the flow,
  4. the same seeded run produces the same ordered checkpoints twice in a row.
- Required doc sync:
  1. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
  2. [specs/23_option5_integration_completion_backlog.md](./23_option5_integration_completion_backlog.md)
  3. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/194_unified_completion_full_smoke.spec.js`

## 4. Phase Exit Rules

Phase 25 is complete only when:

1. tests `183` through `194` are green,
2. every reserved test has a measurable verification path captured above,
3. trainer, seal, House, and track behavior are materially real rather than placeholder-only,
4. the final smoke proves one coherent non-Werewolf implementation path.
