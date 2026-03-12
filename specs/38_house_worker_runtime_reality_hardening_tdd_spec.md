# Phase 38 Spec: House Worker Runtime Reality Hardening (Contracts First, TDD)

Status: Implemented
Version: 0.1
Audience: frontend engineers, backend engineers, runtime engineers, UX engineers, security engineers, QA automation engineers, and AI-agent implementers
Depends on:
1. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
2. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
3. [specs/35_house_worker_packages_and_spawn_tdd_spec.md](./35_house_worker_packages_and_spawn_tdd_spec.md)
4. [specs/02_api_contract.md](./02_api_contract.md)
5. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
6. [public/skill.md](../public/skill.md)
7. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)
8. [AGENTS.md](../AGENTS.md)
Detailed execution runbook:
1. [specs/39_house_worker_runtime_reality_hardening_agent_runbook.md](./39_house_worker_runtime_reality_hardening_agent_runbook.md)

Goal: convert the remaining House worker package and spawn gaps into one deterministic, end-user-first hardening path that makes helper runtime truth, sharing, lifecycle, and recovery genuinely trustworthy.

Implementation baseline:

1. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md) is implemented.
2. [specs/35_house_worker_packages_and_spawn_tdd_spec.md](./35_house_worker_packages_and_spawn_tdd_spec.md) is implemented.
3. [specs/36_house_worker_packages_and_spawn_agent_runbook.md](./36_house_worker_packages_and_spawn_agent_runbook.md) is completed.
4. Current branch baseline is `37da502`.
5. Current repo proof state is:
   A. `e2e/236` through `e2e/245` and `e2e/247` are green,
   B. `e2e/246_house_worker_operator_live_gate.spec.js` is implemented and intentionally skipped in the default deterministic suite until live prerequisites are present,
   C. follow-on contract `e2e/248_house_worker_live_state_capture_contract.spec.js` is green,
   D. full deterministic suite is green at `369 passed, 5 skipped`.

Implementation constraints:

1. Keep wallet-first and house-aware identity.
2. Keep `/app` modal or in-shell continuity.
3. Keep worker-first architecture.
4. Do not move helper decision-making into the backend.
5. New routes stay under `/api/platform/*`.
6. Default tests remain deterministic and offline-safe unless explicitly marked as live-gate tests.
7. Runtime changes under `vendors/openclaw-lite-main/src/openclaw-lite/*` must rebuild browser artifacts.
8. Any new worker-tool behavior must update:
   A. [public/skill.md](../public/skill.md)
   B. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)
   C. `e2e/55_phase3_skill_contract_line.spec.js` or adjacent new tests.

## 1. Executive Summary

This phase hardens House workers in five stages:

1. make runtime profile and lease truth real,
2. make sharing and deployment lifecycle manageable,
3. make multi-helper transfer and nested delegation safe,
4. make recovery and copy understandable for normal users,
5. add live confidence and a final integrated smoke.

Reserved Playwright block:

1. `236` through `247`

Reserved tests:

1. `e2e/236_house_worker_runtime_profile_execution_contract.spec.js`
2. `e2e/237_house_worker_runtime_lease_truth_contract.spec.js`
3. `e2e/238_house_worker_share_lifecycle_contract.spec.js`
4. `e2e/239_house_worker_deployment_lifecycle_contract.spec.js`
5. `e2e/240_house_worker_office_pack_share_contract.spec.js`
6. `e2e/241_house_worker_nested_delegation_contract.spec.js`
7. `e2e/242_house_worker_profile_reference_validation.spec.js`
8. `e2e/243_house_worker_recovery_summary_ux.spec.js`
9. `e2e/244_house_worker_default_user_language_guard.spec.js`
10. `e2e/245_house_worker_live_readiness_contract.spec.js`
11. `e2e/246_house_worker_operator_live_gate.spec.js`
12. `e2e/247_house_worker_runtime_reality_smoke.spec.js`

## 2. Global Measurable Metrics

### 2.1 Runtime profile truth metrics

1. `appliedProfileParity = exact`
   Meaning: `appliedRuntimeProfile` matches the actually bound child runtime profile.
2. `profilePlaceboCount = 0`
   Meaning: no visible runtime profile field exists without affecting runtime evidence or fail-closed validation.
3. `runtimeBindingEvidenceCoverage = 100%`
   Meaning: every active helper session exposes applied-profile binding evidence.

### 2.2 Runtime ownership and freshness metrics

1. `staleActiveSessionCount = 0`
   Meaning: helpers without current ownership evidence do not remain shown as active.
2. `leaseMismatchCount = 0`
   Meaning: UI session state and durable lease state agree.
3. `takeoverTruthMismatchCount = 0`
   Meaning: takeover messaging matches real restart or claim-transfer behavior.

### 2.3 Sharing lifecycle metrics

1. `revokedShareInstallAcceptCount = 0`
2. `expiredShareInstallAcceptCount = 0`
3. `shareAuditVisibility = 100%`
   Meaning: the sharer can see share status, expiry, and install count.
4. `secretTransferCount = 0`

### 2.4 Deployment lifecycle metrics

1. `uninstallResidualSessionCount = 0`
2. `archivedDeploymentSpawnAcceptCount = 0`
3. `pausedDeploymentSpawnAcceptCount = 0`
4. `updateAvailableTruthCoverage = 100%`
   Meaning: every update-eligible deployment tells the truth about update state.

### 2.5 Office pack metrics

1. `officePackParityMismatchCount = 0`
   Meaning: installed office packs reproduce the same member helper identities and office placement intent.
2. `multiHelperCopyCount >= 2`
   Meaning: one pack share can transfer at least two helper deployments in one path.
3. `packInstallDecisionCount <= 2`
   Meaning: default office-pack install stays non-technical.

### 2.6 Delegation metrics

1. `nestedDelegationAcceptedCount >= 1`
2. `maxDelegationDepthExceededAcceptCount = 0`
3. `delegatedChildProvenanceCoverage = 100%`
4. `delegationBudgetExceededAcceptCount = 0`

### 2.7 Semantic validation metrics

1. `unresolvedProfileAcceptCount = 0`
2. `invalidConfigReferenceAcceptCount = 0`
3. `invalidLoadoutReferenceAcceptCount = 0`
4. `invalidWorkspaceSeedAcceptCount = 0`

### 2.8 Recovery and language metrics

1. `recoverySummaryCoverage = 100%`
   Meaning: every visible helper card or session card exposes a plain-language resume summary.
2. `defaultRawIdVisibleCount = 0`
   Meaning: raw ids are hidden by default from end-user surfaces.
3. `safeResumeDecisionCount <= 1`
   Meaning: a normal user can decide the next action from one visible guidance block.
4. `defaultAdvancedFieldVisibleCount = 0`

### 2.9 Live confidence metrics

1. `houseWorkerLiveReadinessCoverage = 100%`
2. `fakeLiveShortcutCount = 0`
3. `headedOperatorGatePassCount = 1`
   Meaning: one operator-assisted live lane can be executed successfully when env and browser prerequisites are met.

### 2.10 Determinism metrics

1. `replayCheckpointMismatchCount = 0`
2. `runtimeLeaseReplayMismatchCount = 0`
3. `officePackReplayMismatchCount = 0`

## 3. Test Harness Rules

1. All tests in this phase must remain offline and deterministic except the explicitly marked live operator gate.
2. Runtime profile tests must inspect both:
   A. request payload and durable persistence,
   B. actual applied runtime evidence returned by the child runtime.
3. Lease-truth tests must inspect both:
   A. UI state,
   B. durable session lease state.
4. Share-lifecycle tests must inspect both:
   A. sharer-facing management surface,
   B. recipient preview or install behavior.
5. Default-user tests must assert plain-language copy and hidden advanced fields on the default path.
6. Live-gate tests must not rely on `__test__` routes or seeded fake success.
7. Unified smoke must replay the same install-share-delegate-recover journey twice and compare ordered checkpoints exactly.

Required new fixture families:

1. `worker_runtime_profile_seed`
2. `worker_runtime_lease_seed`
3. `worker_share_lifecycle_seed`
4. `worker_deployment_lifecycle_seed`
5. `worker_office_pack_seed`
6. `worker_nested_delegation_seed`
7. `worker_profile_validation_seed`
8. `worker_recovery_summary_seed`
9. `worker_default_user_language_seed`
10. `worker_live_readiness_seed`
11. `worker_runtime_reality_smoke_seed`

Required inspection additions:

1. `inspectors.houseWorkerRuntimeBindings`
2. `inspectors.houseWorkerRuntimeLeases`
3. `inspectors.houseWorkerShares`
4. `inspectors.houseWorkerDeploymentLifecycle`
5. `inspectors.houseWorkerOfficePacks`
6. `inspectors.houseWorkerDelegation`
7. `inspectors.houseWorkerRecovery`
8. `inspectors.houseWorkerLiveReadiness`

## 4. Delivery Roadmap

### 4.1 Stage A - Runtime truth

Stage A is complete when:

1. `236`, `237`, and `242` are green,
2. runtime profile fields are real,
3. runtime freshness and ownership are durable,
4. invalid runtime references fail before spawn.

### 4.2 Stage B - Managed sharing and deployment lifecycle

Stage B is complete when:

1. `238`, `239`, and `240` are green,
2. share lifecycle is manageable,
3. installed helpers have a real lifecycle,
4. multi-helper office packs are portable.

### 4.3 Stage C - Delegation and recovery UX

Stage C is complete when:

1. `241`, `243`, and `244` are green,
2. nested delegation works within visible guardrails,
3. recovery UX stays plain-language first.

### 4.4 Stage D - Live confidence

Stage D is complete when:

1. `245` and `246` are green,
2. House worker live-readiness is measurable,
3. the operator-assisted live lane is executable and honest.

### 4.5 Stage E - Integrated acceptance

Stage E is complete when:

1. `247` is green,
2. earlier House worker tests remain green,
3. full deterministic suite remains green.

## 5. Milestone Map

### M38.0 - Runtime profile execution contract

Primary test:

1. `e2e/236_house_worker_runtime_profile_execution_contract.spec.js`

RED gate:

1. requested runtime profile only echoes back from storage,
2. child runtime does not expose applied binding evidence,
3. profile fields can be changed with no observable runtime effect.

GREEN gate:

1. every active helper session exposes both `requestedRuntimeProfile` and `appliedRuntimeProfile`,
2. `appliedProfileParity = exact`,
3. the child runtime exposes binding evidence proving which profile actually applied,
4. unresolved requested profiles fail before active state is reached.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
3. [public/skill.md](../public/skill.md) if worker tools or runtime-exposed status semantics change
4. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md) if worker tools or runtime-exposed status semantics change

Verification:

1. `npx playwright test e2e/236_house_worker_runtime_profile_execution_contract.spec.js`

### M38.1 - Runtime lease truth contract

Primary test:

1. `e2e/237_house_worker_runtime_lease_truth_contract.spec.js`

RED gate:

1. active helpers can remain green without current ownership evidence,
2. takeover copy disagrees with durable session truth,
3. stale helpers remain presented as truly running.

GREEN gate:

1. active sessions expose lease and heartbeat evidence,
2. `staleActiveSessionCount = 0`,
3. stale helpers are shown as stale or recoverable rather than active,
4. takeover UI matches real restart or claim-transfer behavior.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/237_house_worker_runtime_lease_truth_contract.spec.js`

### M38.2 - Managed share lifecycle contract

Primary test:

1. `e2e/238_house_worker_share_lifecycle_contract.spec.js`

RED gate:

1. shares cannot be revoked or expired,
2. sharers cannot inspect prior shares,
3. revoked or expired shares still preview or install.

GREEN gate:

1. shares expose status, expiry, and install count,
2. revoked shares fail closed on preview and install,
3. expired shares fail closed on preview and install,
4. the sharer can inspect share lifecycle state in product UI,
5. `shareAuditVisibility = 100%`.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/238_house_worker_share_lifecycle_contract.spec.js`

### M38.3 - Deployment lifecycle contract

Primary test:

1. `e2e/239_house_worker_deployment_lifecycle_contract.spec.js`

RED gate:

1. helpers cannot be paused, archived, removed, or updated,
2. archived helpers can still spawn,
3. removing a helper leaves live runtime residue.

GREEN gate:

1. deployments support pause, archive, remove, and update or reinstall actions,
2. archived and paused helpers fail closed on spawn,
3. removed deployments stop residual sessions,
4. update state is visible with plain-language guidance,
5. `uninstallResidualSessionCount = 0`.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/239_house_worker_deployment_lifecycle_contract.spec.js`

### M38.4 - Office pack share contract

Primary test:

1. `e2e/240_house_worker_office_pack_share_contract.spec.js`

RED gate:

1. helper sharing remains one-helper-at-a-time only,
2. office placement intent is lost,
3. friend install requires manual repeated helper setup.

GREEN gate:

1. one pack share can carry at least two helpers,
2. friend install reproduces exact member helper identities and office placement intent,
3. `officePackParityMismatchCount = 0`,
4. `packInstallDecisionCount <= 2`,
5. no secrets cross the pack boundary.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/240_house_worker_office_pack_share_contract.spec.js`

### M38.5 - Nested delegation contract

Primary test:

1. `e2e/241_house_worker_nested_delegation_contract.spec.js`

RED gate:

1. delegated helpers cannot create one controlled child generation,
2. provenance for delegated children is missing,
3. depth or budget violations are not blocked.

GREEN gate:

1. controlled nested delegation is allowed through depth `2`,
2. every delegated child persists parent, root, depth, and reason,
3. `nestedDelegationAcceptedCount >= 1`,
4. `maxDelegationDepthExceededAcceptCount = 0`,
5. `delegationBudgetExceededAcceptCount = 0`.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
3. [public/skill.md](../public/skill.md)
4. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)

Verification:

1. `npx playwright test e2e/241_house_worker_nested_delegation_contract.spec.js`

### M38.6 - Semantic runtime reference validation contract

Primary test:

1. `e2e/242_house_worker_profile_reference_validation.spec.js`

RED gate:

1. nonexistent brain, config, loadout, or workspace references are accepted,
2. only safe-character validation exists,
3. invalid references fail late after helper start.

GREEN gate:

1. unresolved or incompatible references fail before spawn,
2. `unresolvedProfileAcceptCount = 0`,
3. `invalidConfigReferenceAcceptCount = 0`,
4. `invalidLoadoutReferenceAcceptCount = 0`,
5. `invalidWorkspaceSeedAcceptCount = 0`.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/242_house_worker_profile_reference_validation.spec.js`

### M38.7 - Recovery summary UX contract

Primary test:

1. `e2e/243_house_worker_recovery_summary_ux.spec.js`

RED gate:

1. users see only raw ids and low-level runtime state,
2. no plain-language resume guidance exists,
3. interrupted helpers give no safe next-step guidance.

GREEN gate:

1. every helper card or session card exposes `lastCompletedSummary`, `lastActiveAgoLabel`, `nextRecommendedAction`, and `resumeSafetyLabel`,
2. `recoverySummaryCoverage = 100%`,
3. `safeResumeDecisionCount <= 1`,
4. raw ids are absent from default recovery view.

Required doc sync:

1. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/243_house_worker_recovery_summary_ux.spec.js`

### M38.8 - Default-user language guard

Primary test:

1. `e2e/244_house_worker_default_user_language_guard.spec.js`

RED gate:

1. new lifecycle, sharing, or delegation surfaces expose raw ids by default,
2. advanced technical fields are visible on the default path,
3. copy uses unexplained AI-runtime jargon.

GREEN gate:

1. `defaultRawIdVisibleCount = 0`,
2. `defaultAdvancedFieldVisibleCount = 0`,
3. plain-language guidance explains what the helper does, what happened, and what the user can do next,
4. advanced data remains available only behind explicit disclosure.

Required doc sync:

1. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
2. [specs/02_api_contract.md](./02_api_contract.md) if visible contract fields change

Verification:

1. `npx playwright test e2e/244_house_worker_default_user_language_guard.spec.js`

### M38.9 - House worker live-readiness contract

Primary test:

1. `e2e/245_house_worker_live_readiness_contract.spec.js`

RED gate:

1. there is no explicit readiness contract for live House worker validation,
2. the product cannot tell an operator what is missing,
3. readiness can claim green without helper-specific prerequisites.

GREEN gate:

1. a live-readiness contract exists for House workers,
2. `houseWorkerLiveReadinessCoverage = 100%`,
3. the contract names missing browser, house, team, and local-brain prerequisites honestly,
4. no seeded fake success path is used.

Required doc sync:

1. [specs/02_api_contract.md](./02_api_contract.md)
2. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
3. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)

Verification:

1. `npx playwright test e2e/245_house_worker_live_readiness_contract.spec.js`

### M38.10 - Operator-assisted live gate

Primary test:

1. `e2e/246_house_worker_operator_live_gate.spec.js`

RED gate:

1. House worker live validation remains entirely manual,
2. the live path uses test-only shortcuts,
3. there is no scriptable release evidence for the real flow.

GREEN gate:

1. one operator-assisted live lane exists and is scriptable,
2. `fakeLiveShortcutCount = 0`,
3. `headedOperatorGatePassCount = 1` when env and browser prerequisites are satisfied,
4. failure output clearly names unmet prerequisites or operator steps.

Required doc sync:

1. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
2. [specs/02_api_contract.md](./02_api_contract.md) if readiness routes or live manifest routes change
3. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)

Verification:

1. `HOUSE_WORKER_LIVE_REQUIRED=1 playwright test -c playwright.house-worker.live.config.js e2e/246_house_worker_operator_live_gate.spec.js`

### M38.11 - Runtime reality integrated smoke

Primary test:

1. `e2e/247_house_worker_runtime_reality_smoke.spec.js`

RED gate:

1. runtime profile truth, lifecycle, packs, delegation, and recovery do not work together,
2. replayed checkpoint order drifts,
3. end-user path regresses into technical setup.

GREEN gate:

1. one user can install a helper, share an office pack, start delegated work, recover after interruption, and complete the same journey twice,
2. `replayCheckpointMismatchCount = 0`,
3. `runtimeLeaseReplayMismatchCount = 0`,
4. `officePackReplayMismatchCount = 0`,
5. earlier House worker and House Office suites remain green.

Required doc sync:

1. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
2. [specs/38_house_worker_runtime_reality_hardening_tdd_spec.md](./38_house_worker_runtime_reality_hardening_tdd_spec.md)

Verification:

1. `npx playwright test e2e/247_house_worker_runtime_reality_smoke.spec.js`
