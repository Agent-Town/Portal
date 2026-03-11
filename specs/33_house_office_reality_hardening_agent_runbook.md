# Phase 33 Spec: Detailed AI-Agent Runbook for House Office Reality and Hardening

Status: Proposed
Version: 0.1
Depends on:
1. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
2. [specs/32_house_office_reality_hardening_tdd_spec.md](./32_house_office_reality_hardening_tdd_spec.md)
3. [specs/02_api_contract.md](./02_api_contract.md)
4. [AGENTS.md](../AGENTS.md)

Purpose: convert the Phase 32 remediation milestones into AI-agent-sized TDD work packets with explicit measurable verification.

This is not a competing House Office plan.
It is the execution layer for the follow-on hardening phase that closes the implementation review findings.

## 1. How AI Agents Must Use This Runbook

1. Do not start this phase until the current House Office baseline `195` through `204` is green.
2. Only take the next unlocked test in sequence.
3. Keep each implementation pass small:
   A. at most one canonical truth concern,
   B. at most one navigation concern,
   C. at most one safety concern,
   D. plus required docs and tests.
4. If a step would touch more than `8` production files or more than `3` durable domains, split it before coding.
5. A step is only complete when:
   A. the named Playwright test is green,
   B. the measurable metrics below are visible,
   C. required docs are updated in the same change,
   D. previously green House Office tests remain green.
6. Do not widen scope into desktop companion, public shared-office, or unrelated House redesign work during this phase.

## 2. Global Verification Rules

### 2.1 Canonical-truth discipline

For this phase, `canonical truth` is complete only when:

1. House Office structure comes from one canonical source,
2. `/api/platform/house-structure` and `/api/platform/house-office` agree on office and staff identity sets,
3. structure provenance is explicit and not misleading.

### 2.2 Exact-selection discipline

For this phase, `exact selection` is complete only when:

1. a click opens the target panel,
2. the cited record becomes active,
3. worker continuity is preserved.

### 2.3 Safety discipline

For this phase, `safe` means:

1. unsafe assignment text is rejected before persistence,
2. source references are real and scoped,
3. output redaction still works for derived projections,
4. read routes reject invalid team overrides.

### 2.4 Readiness discipline

For this phase, `honest readiness` means:

1. readiness is based on route evidence,
2. readiness is based on data and selection evidence,
3. checklists alone cannot produce a green state.

## 3. Test Sequence

### T32.0 - `e2e/205_house_office_structure_canonical_contract.spec.js`

- Goal: eliminate split structure truth and make House Office structure canonical.
- Scope cap: canonical structure source plus parity verification only.
- Dependencies: current House Office baseline is green.
- Small-step order:
  1. define canonical House structure storage or canonical structure read model,
  2. route both `/api/platform/house-structure` and `/api/platform/house-office` through that source,
  3. expose structure provenance,
  4. keep the current Office Map rendering stable.
- Measurable metrics:
  1. `structureParityMismatchCount = 0`,
  2. `structureSourceKind = "durable_house_structure"`,
  3. attached-house office and staff identity sets match exactly across both routes,
  4. current House Office UI still renders the office map and selected-office card.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/205_house_office_structure_canonical_contract.spec.js`

### T32.1 - `e2e/206_house_office_citation_selection_contract.spec.js`

- Goal: make briefing citations open exact records, not generic surfaces.
- Scope cap: citation link contract plus target-panel selection only.
- Dependencies: `T32.0`
- Small-step order:
  1. extend briefing citations with stable selection metadata,
  2. teach target House surfaces to consume selection state,
  3. verify archive and trainer exact selection first,
  4. expand to workshop or tracks if the fixture requires it.
- Measurable metrics:
  1. `targetSelectionMismatchCount = 0`,
  2. archive citation opens Archive with the cited trace or run active,
  3. trainer citation opens Trainer with the cited result or job active,
  4. `/app` continuity and worker session identity remain stable.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/206_house_office_citation_selection_contract.spec.js`

### T32.2 - `e2e/207_house_office_attention_assignment_selection.spec.js`

- Goal: give attention items and assignments the same exact-record standard as citations.
- Scope cap: attention selection plus assignment selection only.
- Dependencies: `T32.1`
- Small-step order:
  1. extend attention deep links with selection,
  2. extend assignment deep links with selection,
  3. verify one trainer or workshop target,
  4. verify one assignment target,
  5. keep office selection state stable in the panel.
- Measurable metrics:
  1. `genericPanelOpenWithoutSelectionCount = 0`,
  2. clicking attention opens the expected record as active,
  3. clicking assignment opens the expected record as active,
  4. team context and worker session remain unchanged.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/207_house_office_attention_assignment_selection.spec.js`

### T32.3 - `e2e/208_house_office_readiness_truth_contract.spec.js`

- Goal: make House readiness reflect actual route and data evidence.
- Scope cap: readiness payload and readiness panel only.
- Dependencies: `T32.0`
- Small-step order:
  1. define per-surface readiness evidence fields,
  2. probe the actual House Office route family,
  3. compute honest blocked or ready states,
  4. keep the checklist as manual follow-up guidance,
  5. render the same evidence in the House shell.
- Measurable metrics:
  1. `surfaceProbeCoverage = 100%`,
  2. `falseReadySurfaceCount = 0`,
  3. partial seeded scenarios produce mixed blocked and ready surfaces where expected,
  4. the readiness panel text matches the route evidence.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
  3. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/208_house_office_readiness_truth_contract.spec.js`

### T32.4 - `e2e/209_house_office_assignment_source_validation.spec.js`

- Goal: prevent synthetic or out-of-scope source references from entering assignments.
- Scope cap: source validation only.
- Dependencies: `T32.0`
- Small-step order:
  1. define supported source kinds,
  2. resolve each supported source kind to a real record,
  3. enforce current house and team scope,
  4. return normalized source refs and exact selection on success.
- Measurable metrics:
  1. `unresolvedSourceRefAcceptCount = 0`,
  2. `outOfScopeSourceRefAcceptCount = 0`,
  3. `unsupportedSourceKindAcceptCount = 0`,
  4. valid repeated writes remain idempotent.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/209_house_office_assignment_source_validation.spec.js`

### T32.5 - `e2e/210_house_office_assignment_privacy_write_barrier.spec.js`

- Goal: block secret-like assignment focus text before persistence.
- Scope cap: write-time privacy barrier plus storage inspection only.
- Dependencies: `T32.4`
- Small-step order:
  1. define blocked markers and stable error code,
  2. reject unsafe assignment writes,
  3. expose test inspection proving unsafe rows were not stored,
  4. confirm safe writes still succeed.
- Measurable metrics:
  1. `unsafeAssignmentPersistCount = 0`,
  2. blocked writes fail with `SENSITIVE_CONTENT_BLOCKED`,
  3. assignment count stays unchanged after a blocked unsafe write,
  4. storage inspection contains no forbidden marker for the blocked attempt.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/210_house_office_assignment_privacy_write_barrier.spec.js`

### T32.6 - `e2e/211_house_office_ops_breadth_contract.spec.js`

- Goal: reflect real operations breadth in House Office.
- Scope cap: ops-family briefing and attention only.
- Dependencies: `T32.2`, `T32.3`
- Small-step order:
  1. define eligible ops-family signal rules,
  2. add experiences-family briefing items,
  3. add poker or web-family briefing or attention items,
  4. attach exact selections to each new ops item.
- Measurable metrics:
  1. `opsFamilyCoverage >= 2`,
  2. `opsSignalSelectionCoverage = 100%`,
  3. seeded web or poker activity becomes visible in House Office,
  4. existing archive, trainer, workshop, and tracks families remain deterministic.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/211_house_office_ops_breadth_contract.spec.js`

### T32.7 - `e2e/212_house_office_team_override_guard.spec.js`

- Goal: make read-route team overrides obey the same access discipline as the write flow.
- Scope cap: team override guard only.
- Dependencies: `T32.0`
- Small-step order:
  1. define shared team-override validation,
  2. apply it to `house-office`, `house-structure`, and `house-readiness`,
  3. keep valid available-team reads working.
- Measurable metrics:
  1. `foreignTeamReadAcceptCount = 0`,
  2. invalid team overrides fail with `TEAM_NOT_FOUND`,
  3. valid available-team overrides still return `200`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/212_house_office_team_override_guard.spec.js`

### T32.8 - `e2e/213_house_office_reality_hardening_smoke.spec.js`

- Goal: prove the hardening changes work together as one coherent House Office upgrade.
- Scope cap: smoke orchestration only.
- Dependencies: `T32.7`
- Small-step order:
  1. define one seeded hardening journey,
  2. prove structure parity,
  3. prove readiness truth,
  4. prove exact citation or attention selection,
  5. prove ops breadth,
  6. replay and compare checkpoints exactly.
- Measurable metrics:
  1. `targetSelectionMismatchCount = 0`,
  2. `falseReadySurfaceCount = 0`,
  3. `unsafeAssignmentPersistCount = 0`,
  4. replayed checkpoint list matches exactly,
  5. current House Office baseline tests remain green.
- Required doc sync:
  1. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
  2. [specs/32_house_office_reality_hardening_tdd_spec.md](./32_house_office_reality_hardening_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/213_house_office_reality_hardening_smoke.spec.js`

## 4. Recommended Verification Ladder

After each milestone:

1. run the named Playwright file,
2. run the immediately adjacent House Office tests that could regress,
3. run `npm test` before merging milestones that affect continuity, privacy, or route semantics.

Minimum adjacent regression slices:

1. House Office baseline tests `195` through `204`,
2. House shell and team continuity tests around `188`, `189`, `190`, and `199`,
3. worker continuity tests around `57`, `58`, `60`, and `72`.

## 5. Completion Rule

This runbook is complete only when:

1. tests `205` through `213` are green,
2. Phase 32 metrics are observable,
3. docs and API contract are updated in lockstep,
4. the House Office hardening phase closes the review findings without creating a new shell or a second data model,
5. the full deterministic suite remains green.
