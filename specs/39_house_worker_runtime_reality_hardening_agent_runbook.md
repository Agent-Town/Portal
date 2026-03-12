# Phase 39 Spec: Detailed AI-Agent Runbook for House Worker Runtime Reality Hardening

Status: Proposed
Version: 0.1
Depends on:
1. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
2. [specs/38_house_worker_runtime_reality_hardening_tdd_spec.md](./38_house_worker_runtime_reality_hardening_tdd_spec.md)
3. [specs/02_api_contract.md](./02_api_contract.md)
4. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
5. [public/skill.md](../public/skill.md)
6. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)
7. [AGENTS.md](../AGENTS.md)

Purpose: convert Phase 38 into AI-agent-sized TDD work packets with explicit measurable verification and strict end-user-first UX discipline.

Current proof state:

1. `T35.0` through `T35.13` are implemented.
2. `e2e/215` through `e2e/235` are green.
3. Full deterministic suite is green at `357 passed, 4 skipped`.

This is not a competing plan.
It is the execution layer for the follow-on phase that closes the remaining House worker runtime, sharing, lifecycle, and live-confidence gaps.

## 1. How AI Agents Must Use This Runbook

1. Do not start this phase until `e2e/215` through `e2e/235` are green.
2. Only take the next unlocked test in sequence.
3. Keep each implementation pass small:
   A. at most one runtime-truth concern,
   B. or one sharing or lifecycle concern,
   C. or one recovery UX concern,
   D. plus required docs and tests.
4. If a step would touch more than `9` production files or more than `3` durable domains, split it before coding.
5. If a step changes vendor runtime files under `vendors/openclaw-lite-main/src/openclaw-lite/*`, rebuild browser artifacts before verification.
6. A step is only complete when:
   A. the named Playwright test is green,
   B. the measurable metrics below are visible,
   C. required docs are updated in the same change,
   D. previously green House worker and House Office tests remain green.
7. Do not widen scope into:
   A. public marketplace monetization,
   B. public shared-office pages,
   C. desktop companion or desktop pet work,
   D. backend fake helper completion,
   E. secret export.

## 2. Global Verification Rules

### 2.1 Runtime-truth discipline

For this phase, `runtime truth` is complete only when:

1. helper runtime profile evidence is real,
2. session ownership is durable,
3. stale sessions are not shown as truly active.

### 2.2 End-user discipline

For this phase, `end-user ready` means:

1. default copy avoids AI-runtime jargon,
2. users can understand helper status and next action without raw ids,
3. advanced technical fields stay hidden by default.

### 2.3 Portable-sharing discipline

For this phase, `portable sharing` is complete only when:

1. helpers and office packs can be shared without secrets,
2. shares can be revoked or expire,
3. the sender can inspect share lifecycle state.

### 2.4 Lifecycle discipline

For this phase, `lifecycle complete` means:

1. helpers can be paused, archived, updated, and removed,
2. removed helpers leave no live residue,
3. archived or paused helpers do not start.

### 2.5 Delegation discipline

For this phase, `delegation complete` means:

1. nested delegation works only inside explicit depth and budget guardrails,
2. provenance is visible and durable,
3. failure states stay understandable for normal users.

### 2.6 Live-confidence discipline

For this phase, `live confidence` means:

1. there is a helper-specific live-readiness contract,
2. there is an operator-assisted live gate,
3. neither relies on fake-live shortcuts.

## 3. Test Sequence

### T38.0 - `e2e/236_house_worker_runtime_profile_execution_contract.spec.js`

- Goal: make helper runtime profile fields real rather than decorative.
- Scope cap: applied-profile evidence plus one child-runtime binding path only.
- Dependencies: current worker package baseline is green.
- Small-step order:
  1. define `requestedRuntimeProfile` and `appliedRuntimeProfile`,
  2. bind child runtime to actual profile evidence,
  3. fail closed when the requested profile cannot apply,
  4. expose applied-profile evidence through deterministic inspection.
- Measurable metrics:
  1. `appliedProfileParity = exact`,
  2. `profilePlaceboCount = 0`,
  3. `runtimeBindingEvidenceCoverage = 100%`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
  3. [public/skill.md](../public/skill.md) if runtime-visible tools or semantics change
  4. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md) if runtime-visible tools or semantics change
- Verification:
  1. `npx playwright test e2e/236_house_worker_runtime_profile_execution_contract.spec.js`

### T38.1 - `e2e/237_house_worker_runtime_lease_truth_contract.spec.js`

- Goal: make helper active-state truth durable instead of tab-local optimism.
- Scope cap: lease state, heartbeat, and takeover truth only.
- Dependencies: `T38.0`
- Small-step order:
  1. define durable lease evidence,
  2. add stale detection,
  3. align takeover messaging with real restart or claim-transfer semantics,
  4. surface lease truth in default UI copy.
- Measurable metrics:
  1. `staleActiveSessionCount = 0`,
  2. `leaseMismatchCount = 0`,
  3. `takeoverTruthMismatchCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/237_house_worker_runtime_lease_truth_contract.spec.js`

### T38.2 - `e2e/238_house_worker_share_lifecycle_contract.spec.js`

- Goal: turn helper shares into managed invitations.
- Scope cap: share status, expiry, revoke, and sender-facing visibility only.
- Dependencies: `T38.1`
- Small-step order:
  1. add additive share lifecycle fields,
  2. expose sharer-facing lifecycle UI,
  3. fail closed for revoked or expired shares,
  4. keep exact-version portability intact.
- Measurable metrics:
  1. `revokedShareInstallAcceptCount = 0`,
  2. `expiredShareInstallAcceptCount = 0`,
  3. `shareAuditVisibility = 100%`,
  4. `secretTransferCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/238_house_worker_share_lifecycle_contract.spec.js`

### T38.3 - `e2e/239_house_worker_deployment_lifecycle_contract.spec.js`

- Goal: give installed helpers a real lifecycle.
- Scope cap: pause, archive, remove, update, and spawn guards only.
- Dependencies: `T38.2`
- Small-step order:
  1. define lifecycle states,
  2. add lifecycle routes or actions,
  3. block spawn for archived or paused helpers,
  4. ensure remove also clears active runtime residue.
- Measurable metrics:
  1. `uninstallResidualSessionCount = 0`,
  2. `archivedDeploymentSpawnAcceptCount = 0`,
  3. `pausedDeploymentSpawnAcceptCount = 0`,
  4. `updateAvailableTruthCoverage = 100%`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/239_house_worker_deployment_lifecycle_contract.spec.js`

### T38.4 - `e2e/240_house_worker_office_pack_share_contract.spec.js`

- Goal: make multi-helper sharing usable for normal users.
- Scope cap: pack creation, preview, and install only.
- Dependencies: `T38.3`
- Small-step order:
  1. define a portable office-pack object,
  2. capture exact helper identities and placement intent,
  3. install the same pack into a second house,
  4. keep default decisions minimal.
- Measurable metrics:
  1. `officePackParityMismatchCount = 0`,
  2. `multiHelperCopyCount >= 2`,
  3. `packInstallDecisionCount <= 2`,
  4. `secretTransferCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/240_house_worker_office_pack_share_contract.spec.js`

### T38.5 - `e2e/241_house_worker_nested_delegation_contract.spec.js`

- Goal: allow one controlled extra generation of helper delegation.
- Scope cap: depth `2` delegation with provenance and budget guardrails only.
- Dependencies: `T38.1`, `T38.4`
- Small-step order:
  1. define delegation depth and budget policy,
  2. persist root, parent, depth, and reason,
  3. allow one nested delegated child path,
  4. block deeper or over-budget delegation with stable errors.
- Measurable metrics:
  1. `nestedDelegationAcceptedCount >= 1`,
  2. `maxDelegationDepthExceededAcceptCount = 0`,
  3. `delegatedChildProvenanceCoverage = 100%`,
  4. `delegationBudgetExceededAcceptCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
  3. [public/skill.md](../public/skill.md)
  4. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)
- Verification:
  1. `npx playwright test e2e/241_house_worker_nested_delegation_contract.spec.js`

### T38.6 - `e2e/242_house_worker_profile_reference_validation.spec.js`

- Goal: turn profile validation from syntactic to semantic.
- Scope cap: reference validation only.
- Dependencies: `T38.0`
- Small-step order:
  1. resolve valid brain, config, loadout, and workspace refs,
  2. reject unresolved or incompatible refs before spawn,
  3. keep inherited-default path working,
  4. expose user-readable blocked reasons.
- Measurable metrics:
  1. `unresolvedProfileAcceptCount = 0`,
  2. `invalidConfigReferenceAcceptCount = 0`,
  3. `invalidLoadoutReferenceAcceptCount = 0`,
  4. `invalidWorkspaceSeedAcceptCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/242_house_worker_profile_reference_validation.spec.js`

### T38.7 - `e2e/243_house_worker_recovery_summary_ux.spec.js`

- Goal: make helper recovery understandable to non-technical users.
- Scope cap: recovery summary and next-action copy only.
- Dependencies: `T38.1`
- Small-step order:
  1. define recovery summary fields,
  2. add plain-language last-work and next-step copy,
  3. keep advanced runtime details collapsed,
  4. verify interrupted helper recovery decisions.
- Measurable metrics:
  1. `recoverySummaryCoverage = 100%`,
  2. `safeResumeDecisionCount <= 1`,
  3. default view contains no raw ids.
- Required doc sync:
  1. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/243_house_worker_recovery_summary_ux.spec.js`

### T38.8 - `e2e/244_house_worker_default_user_language_guard.spec.js`

- Goal: keep the expanded helper surface end-user first.
- Scope cap: default copy, advanced-hide behavior, and jargon guard only.
- Dependencies: `T38.7`
- Small-step order:
  1. define plain-language copy rules,
  2. keep advanced fields hidden by default,
  3. ensure lifecycle and sharing states stay readable,
  4. verify no new default runtime jargon leaks into the main path.
- Measurable metrics:
  1. `defaultRawIdVisibleCount = 0`,
  2. `defaultAdvancedFieldVisibleCount = 0`,
  3. users can understand what happened and what to do next from visible copy alone.
- Required doc sync:
  1. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
  2. [specs/02_api_contract.md](./02_api_contract.md) if visible contract fields change
- Verification:
  1. `npx playwright test e2e/244_house_worker_default_user_language_guard.spec.js`

### T38.9 - `e2e/245_house_worker_live_readiness_contract.spec.js`

- Goal: make House worker live validation measurable before a release.
- Scope cap: live-readiness contract and UI surface only.
- Dependencies: `T38.8`
- Small-step order:
  1. define helper-specific readiness requirements,
  2. expose them through an API contract and UI summary,
  3. keep missing prerequisites explicit,
  4. document exact operator next steps.
- Measurable metrics:
  1. `houseWorkerLiveReadinessCoverage = 100%`,
  2. `fakeLiveShortcutCount = 0`,
  3. readiness output names missing browser, house, team, and local-brain prerequisites.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
  3. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
- Verification:
  1. `npx playwright test e2e/245_house_worker_live_readiness_contract.spec.js`

### T38.10 - `e2e/246_house_worker_operator_live_gate.spec.js`

- Goal: add one honest, scriptable live release gate for House workers.
- Scope cap: operator-assisted live gate only.
- Dependencies: `T38.9`
- Small-step order:
  1. define live gate prerequisites,
  2. add headed operator steps and measurable checkpoints,
  3. ensure the gate uses real session and browser state,
  4. fail clearly when prerequisites are missing.
- Measurable metrics:
  1. `headedOperatorGatePassCount = 1`,
  2. `fakeLiveShortcutCount = 0`,
  3. failure output clearly names missing prerequisites or blocked steps.
- Required doc sync:
  1. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
  2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
  3. [specs/02_api_contract.md](./02_api_contract.md) if manifest or readiness routes change
- Verification:
  1. `HOUSE_WORKER_LIVE_REQUIRED=1 playwright test -c playwright.house-worker.live.config.js e2e/246_house_worker_operator_live_gate.spec.js`

### T38.11 - `e2e/247_house_worker_runtime_reality_smoke.spec.js`

- Goal: prove the entire hardening phase works as one coherent user path.
- Scope cap: smoke orchestration only.
- Dependencies: `T38.10`
- Small-step order:
  1. install a helper,
  2. create and inspect a managed share,
  3. install one office pack,
  4. start delegated work with guarded depth,
  5. interrupt and recover using plain-language guidance,
  6. replay the same journey and compare checkpoints exactly.
- Measurable metrics:
  1. `replayCheckpointMismatchCount = 0`,
  2. `runtimeLeaseReplayMismatchCount = 0`,
  3. `officePackReplayMismatchCount = 0`,
  4. earlier House worker and House Office suites remain green.
- Required doc sync:
  1. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
  2. [specs/38_house_worker_runtime_reality_hardening_tdd_spec.md](./38_house_worker_runtime_reality_hardening_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/247_house_worker_runtime_reality_smoke.spec.js`

## 4. Final Acceptance Gate

Before this phase is called complete, the implementing agent must prove:

1. `e2e/236` through `e2e/245` are green in deterministic mode,
2. `e2e/246` is green when live prerequisites are available,
3. `e2e/247` is green,
4. earlier worker-package, House Office, and skill-contract suites remain green,
5. full deterministic suite remains green.
