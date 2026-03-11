# Phase 32 Spec: House Office Reality and Hardening (Contracts First, TDD)

Status: Implemented
Version: 0.1
Audience: frontend engineers, backend engineers, product engineers, security engineers, QA automation engineers, and AI-agent implementers
Verification state: `e2e/205` through `e2e/213` are green, and `npm test` passed with `331 passed, 4 skipped` on 2026-03-11.
Depends on:
1. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
2. [specs/28_house_office_star_office_inspired_extension_spec.md](./28_house_office_star_office_inspired_extension_spec.md)
3. [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md)
4. [specs/02_api_contract.md](./02_api_contract.md)
5. [AGENTS.md](../AGENTS.md)
Detailed execution runbook:
1. [specs/33_house_office_reality_hardening_agent_runbook.md](./33_house_office_reality_hardening_agent_runbook.md)

Goal: convert the House Office review findings into one deterministic hardening path that makes the existing House Office implementation more real, more exact, and more trustworthy without replacing the current shell.

Implementation baseline:

1. [specs/28_house_office_star_office_inspired_extension_spec.md](./28_house_office_star_office_inspired_extension_spec.md) is implemented.
2. [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md) and [specs/30_house_office_extension_agent_runbook.md](./30_house_office_extension_agent_runbook.md) are implemented.
3. This phase starts after `e2e/204_house_flow_readiness_contract.spec.js` and is now fully implemented through `e2e/213_house_office_reality_hardening_smoke.spec.js`.

Implementation constraints:

1. Keep wallet-first and house-aware identity.
2. Keep `/app` modal or in-shell continuity.
3. Keep House Office inside the existing House shell.
4. Do not adopt Star Office architecture.
5. The phase may add at most `2` new durable House Office structure tables.
6. Default tests must remain deterministic and offline-safe.
7. A milestone is not complete until docs, tests, and API contract updates land together.

## 1. Executive Summary

This phase hardens House Office in three stages:

1. remove structure and navigation stubs,
2. remove unsafe and misleading behavior,
3. prove the harder behavior in one integrated smoke.

Reserved Playwright block:

1. `205` through `213`

Reserved tests:

1. `e2e/205_house_office_structure_canonical_contract.spec.js`
2. `e2e/206_house_office_citation_selection_contract.spec.js`
3. `e2e/207_house_office_attention_assignment_selection.spec.js`
4. `e2e/208_house_office_readiness_truth_contract.spec.js`
5. `e2e/209_house_office_assignment_source_validation.spec.js`
6. `e2e/210_house_office_assignment_privacy_write_barrier.spec.js`
7. `e2e/211_house_office_ops_breadth_contract.spec.js`
8. `e2e/212_house_office_team_override_guard.spec.js`
9. `e2e/213_house_office_reality_hardening_smoke.spec.js`

## 2. Global Measurable Metrics

### 2.1 Structure truth metrics

1. `structureParityMismatchCount = 0`
   Meaning: `/api/platform/house-structure` and `/api/platform/house-office` expose the same `officeId` and `staffAgentId` sets for the same session and team.
2. `structureSourceKind = "durable_house_structure"`
   Meaning: House Office structure provenance identifies canonical durable truth rather than a runtime fixture file.
3. `splitFixtureTruthFindings = 0`
   Meaning: with an attached house, no read contract depends on a second structure fixture family as authoritative runtime truth.

### 2.2 Exact-link metrics

1. `targetSelectionMismatchCount = 0`
   Meaning: the selected record in the opened surface matches the cited or linked `sourceId`.
2. `genericPanelOpenWithoutSelectionCount = 0`
   Meaning: a citation or attention click cannot pass by merely opening the panel.
3. `shellContinuityLossCount = 0`
   Meaning: exact record selection still preserves `/app` continuity and worker session stability.

### 2.3 Readiness truth metrics

1. `falseReadySurfaceCount = 0`
   Meaning: no surface is marked ready unless route, data, and selection prerequisites have actually been checked.
2. `surfaceProbeCoverage = 100%`
   Meaning: all declared House surfaces are probed by `GET /api/platform/house-readiness`.
3. `manualValidationChecklistCount >= 1`
   Meaning: the operator checklist remains present, but it is downstream of route evidence.

### 2.4 Assignment safety metrics

1. `unresolvedSourceRefAcceptCount = 0`
2. `outOfScopeSourceRefAcceptCount = 0`
3. `unsupportedSourceKindAcceptCount = 0`
4. `unsafeAssignmentPersistCount = 0`
   Meaning: requests containing blocked secret-like markers create `0` assignment rows.

### 2.5 Operational breadth metrics

1. `opsFamilyCoverage >= 2`
   Meaning: seeded scenarios with eligible records produce both `experiences` and `poker_or_web` House Office signals.
2. `opsSignalSelectionCoverage = 100%`
   Meaning: every ops-family signal has an exact selection target, not just a generic panel link.

### 2.6 Team guard metrics

1. `foreignTeamReadAcceptCount = 0`
   Meaning: House Office read routes reject unavailable `teamId` overrides with `TEAM_NOT_FOUND`.

## 3. Test Harness Rules

1. All tests in this phase must remain offline and deterministic.
2. Test mode may seed canonical structure data, but runtime routes must expose that data as canonical structure truth, not as fixture truth.
3. Test mode must expose enough inspection to verify write-time privacy and source validation outcomes.
4. Exact-link tests must assert both:
   A. opened surface,
   B. exact selected record id.
5. Readiness tests must assert both:
   A. route evidence,
   B. rendered House readiness panel behavior.
6. Final smoke must replay the same reality-hardened journey twice and compare ordered checkpoints exactly.

## 4. Delivery Roadmap

### 4.1 Stage A - Canonical truth and exact navigation

Stage A is complete when:

1. `205`, `206`, and `207` are green,
2. House Office structure truth is canonical,
3. citations, attention items, and assignments select exact records in-shell.

### 4.2 Stage B - Honest readiness and safe writes

Stage B is complete when:

1. `208`, `209`, `210`, `211`, and `212` are green,
2. readiness is route-evidence-driven,
3. unsafe writes are blocked before persistence,
4. assignments are source-validated,
5. operations breadth and team guardrails are real.

### 4.3 Stage C - Integrated acceptance

Stage C is complete when:

1. `213` is green,
2. all earlier House Office tests remain green,
3. the full deterministic suite remains green.

## 5. Required Fixture and Inspection Families

1. `house_office_structure_seed`
2. `house_office_exact_link_seed`
3. `house_office_readiness_truth_seed`
4. `house_office_source_validation_seed`
5. `house_office_privacy_write_seed`
6. `house_office_ops_breadth_seed`
7. `house_office_team_guard_seed`
8. `house_office_reality_smoke_seed`

Required inspection additions:

1. `inspectors.houseOfficeStructure`
2. `inspectors.houseOfficeSelections`
3. `inspectors.houseOfficeReadiness`
4. `inspectors.houseOfficePrivacyStorage`

## 6. Milestone Map

### M32.0 - Canonical structure contract

Primary test:

1. `e2e/205_house_office_structure_canonical_contract.spec.js`

RED gate:

1. `/api/platform/house-structure` and `/api/platform/house-office` disagree on office or staff identity sets,
2. House Office structure still identifies a split fixture family as authoritative runtime truth,
3. House Office cannot prove canonical structure provenance.

GREEN gate:

1. `GET /api/platform/house-structure` and `GET /api/platform/house-office` expose the same ordered `officeId` set,
2. the same routes expose the same ordered `staffAgentId` set,
3. a new provenance field identifies canonical structure truth as durable or canonical structure,
4. `structureParityMismatchCount = 0`,
5. House Office UI still renders the same office map and selected-office card in-shell.

Implementation notes:

1. Introducing `house_offices` and `house_staff_agents` is allowed here.
2. If a migration/backfill is required, it must be deterministic and replayable.
3. Test fixture names may remain visible in test mode only as seed provenance, not as runtime truth labels.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/205_house_office_structure_canonical_contract.spec.js`

### M32.1 - Briefing citation exact-selection contract

Primary test:

1. `e2e/206_house_office_citation_selection_contract.spec.js`

RED gate:

1. briefing citations open only a generic panel,
2. the cited record does not become active,
3. exact record identity is absent from the link contract.

GREEN gate:

1. briefing citations expose a stable `selection` envelope,
2. clicking an archive citation selects the cited trace or run,
3. clicking a trainer citation selects the cited trainer result or trainer job,
4. clicking a workshop or tracks citation selects the exact cited record where applicable,
5. `targetSelectionMismatchCount = 0`,
6. worker session continuity remains intact.

Implementation notes:

1. The target surface may accept `selection` through House surface state rather than URL mutation.
2. Selection must not restart the worker or navigate away from `/app`.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/206_house_office_citation_selection_contract.spec.js`

### M32.2 - Attention and assignment exact-selection contract

Primary test:

1. `e2e/207_house_office_attention_assignment_selection.spec.js`

RED gate:

1. attention items or assignments still open only the generic surface,
2. record-level selection is absent or ignored.

GREEN gate:

1. attention deep links expose stable `selection`,
2. assignments expose stable `selection`,
3. clicking an attention item selects the expected trainer, workshop, tracks, archive, or experience record,
4. clicking an assignment item selects the exact record named by its validated source reference,
5. `genericPanelOpenWithoutSelectionCount = 0`,
6. `/app` continuity and team context remain stable.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/207_house_office_attention_assignment_selection.spec.js`

### M32.3 - Readiness truth contract

Primary test:

1. `e2e/208_house_office_readiness_truth_contract.spec.js`

RED gate:

1. readiness status becomes green merely because `houseId` and `activeTeamId` exist,
2. readiness does not expose route or target evidence,
3. surface summaries can claim ready while required data is absent.

GREEN gate:

1. each readiness surface exposes:
   A. `routeOk`
   B. `dataOk`
   C. `selectionOk`
   D. `browserValidationRequired`
   E. `blockedBy[]`
2. `status = ready_for_manual_validation` only when all required route probes are green,
3. partial seeded scenarios show mixed blocked and ready surfaces honestly,
4. the House readiness panel renders the same state the API reports,
5. `falseReadySurfaceCount = 0`.

Implementation notes:

1. Route probes must stay local and deterministic.
2. This route is not allowed to fabricate green states from checklists alone.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
3. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/208_house_office_readiness_truth_contract.spec.js`

### M32.4 - Assignment source validation contract

Primary test:

1. `e2e/209_house_office_assignment_source_validation.spec.js`

RED gate:

1. arbitrary `sourceKind/sourceId` pairs are accepted,
2. out-of-scope records can be bound to assignments,
3. source resolution is not typed or deterministic.

GREEN gate:

1. supported source kinds are explicitly validated,
2. unknown ids fail with `SOURCE_REF_NOT_FOUND`,
3. unsupported kinds fail with `SOURCE_REF_KIND_UNSUPPORTED`,
4. wrong-house or wrong-team records fail with `SOURCE_REF_SCOPE_MISMATCH`,
5. valid writes return a normalized source ref plus exact `selection`,
6. repeated identical valid writes still return the same `assignmentId`.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/209_house_office_assignment_source_validation.spec.js`

### M32.5 - Privacy write barrier contract

Primary test:

1. `e2e/210_house_office_assignment_privacy_write_barrier.spec.js`

RED gate:

1. unsafe prompt or callback or token-like strings are accepted at write-time,
2. rejected unsafe content can still create a row,
3. test storage inspection cannot prove raw secrets were blocked.

GREEN gate:

1. blocked unsafe writes fail with `SENSITIVE_CONTENT_BLOCKED`,
2. assignment count does not increase after a blocked unsafe write,
3. storage inspection proves no raw blocked markers were persisted,
4. normal safe assignment writes still succeed,
5. projection-time redaction remains stable for other derived content.

Implementation notes:

1. This phase prefers rejection over sanitizing and storing unsafe text.
2. The test harness must expose enough inspection to prove the raw DB row was not created.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/210_house_office_assignment_privacy_write_barrier.spec.js`

### M32.6 - Operational breadth contract

Primary test:

1. `e2e/211_house_office_ops_breadth_contract.spec.js`

RED gate:

1. House Office operational signals are still tracks-only or trainer-only,
2. seeded web or poker activity does not surface in briefing or attention.

GREEN gate:

1. eligible seeded scenarios produce `experiences` and `poker_or_web` briefing families,
2. eligible seeded scenarios produce at least one operational attention item sourced from experiences or poker or web activity,
3. these ops-family items expose exact-selection links,
4. `opsFamilyCoverage >= 2`,
5. `opsSignalSelectionCoverage = 100%`.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/211_house_office_ops_breadth_contract.spec.js`

### M32.7 - Team override guard contract

Primary test:

1. `e2e/212_house_office_team_override_guard.spec.js`

RED gate:

1. House Office read routes silently accept unavailable `teamId` overrides,
2. team override rules differ between write and read paths.

GREEN gate:

1. `GET /api/platform/house-office?teamId=...` rejects unavailable teams with `TEAM_NOT_FOUND`,
2. `GET /api/platform/house-structure?teamId=...` rejects unavailable teams with `TEAM_NOT_FOUND`,
3. `GET /api/platform/house-readiness?teamId=...` rejects unavailable teams with `TEAM_NOT_FOUND`,
4. valid available-team overrides still work,
5. `foreignTeamReadAcceptCount = 0`.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/212_house_office_team_override_guard.spec.js`

### M32.8 - Unified reality-hardening smoke

Primary test:

1. `e2e/213_house_office_reality_hardening_smoke.spec.js`

RED gate:

1. the fixes work in isolation but not as one coherent House Office journey,
2. exact selections regress continuity,
3. readiness evidence and exact links disagree.

GREEN gate:

1. one seeded journey proves:
   A. canonical structure parity,
   B. readiness truth,
   C. exact citation selection,
   D. exact attention or assignment selection,
   E. ops-family visibility,
   F. stable team context,
   G. worker continuity,
2. the ordered checkpoint list matches exactly across two replays,
3. previously green House Office tests `195` through `204` remain green,
4. the full deterministic suite remains green.

Required doc sync:

1. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
2. [specs/32_house_office_reality_hardening_tdd_spec.md](./32_house_office_reality_hardening_tdd_spec.md)

Verification:

1. `npx playwright test e2e/213_house_office_reality_hardening_smoke.spec.js`

## 7. Completion Rule

This phase is complete only when:

1. tests `205` through `213` are green,
2. Phase 31 metrics are observable,
3. docs and API contract are updated in lockstep,
4. House Office no longer relies on split structure truth, generic citations, or checklist-only readiness,
5. unsafe assignment text is blocked before persistence,
6. exact-source navigation works in-shell,
7. the full deterministic suite remains green.
