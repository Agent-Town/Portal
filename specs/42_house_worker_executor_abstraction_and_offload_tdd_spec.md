# Phase 42 Spec: House Worker Executor Abstraction And Offload (Contracts First, TDD)

Status: In progress
Version: 0.1
Audience: frontend engineers, backend engineers, runtime engineers, desktop engineers, mobile engineers, security engineers, QA automation engineers, infrastructure engineers, and AI-agent implementers
Depends on:
1. [specs/40_house_worker_backend_pool_and_offload_spec.md](./40_house_worker_backend_pool_and_offload_spec.md)
2. [specs/41_house_worker_runtime_topology_and_local_node_spec.md](./41_house_worker_runtime_topology_and_local_node_spec.md)
3. [specs/37_house_worker_runtime_reality_hardening_spec.md](./37_house_worker_runtime_reality_hardening_spec.md)
4. [specs/38_house_worker_runtime_reality_hardening_tdd_spec.md](./38_house_worker_runtime_reality_hardening_tdd_spec.md)
5. [specs/02_api_contract.md](./02_api_contract.md)
6. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
7. [public/skill.md](../public/skill.md)
8. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)
9. [AGENTS.md](../AGENTS.md)
Detailed execution runbook:
1. [specs/43_house_worker_executor_abstraction_and_offload_agent_runbook.md](./43_house_worker_executor_abstraction_and_offload_agent_runbook.md)

Goal: convert the proposed backend-pool and local-node architecture into one deterministic implementation path where House helpers can run under multiple executor kinds while Portal remains the only control plane.

Implementation baseline:

1. Current branch baseline is `1b5cace`.
2. The current product still records helper sessions with `supervisorSource = browser_supervisor`.
3. The current product still starts helper runtimes from the browser shell.
4. This phase must begin only after implementers rerun `npm test` and confirm the inherited baseline is green before any code changes.

Current proof state:

1. `T42.0` through `T42.6` are implemented on the current branch.
2. Desktop-local-node support currently covers registration, heartbeat, and provider-readiness truth only.

Implementation constraints:

1. Keep worker-first architecture.
2. Do not move helper decision-making into backend route handlers.
3. Keep browser as the primary cockpit.
4. Keep `/app` modal or in-shell continuity.
5. New routes stay under `/api/platform/house-workers/*`.
6. New storage must be additive.
7. Route handlers in [server/platform_read_routes.js](../server/platform_read_routes.js) must become thin HTTP shells around testable control-plane and executor modules.
8. Default tests remain deterministic and offline-safe unless explicitly marked as operator live-gate tests.
9. Runtime changes under `vendors/openclaw-lite-main/src/openclaw-lite/*` must rebuild browser artifacts.
10. Any new worker-tool behavior must update:
   A. [public/skill.md](../public/skill.md)
   B. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)
   C. `e2e/55_phase3_skill_contract_line.spec.js` or adjacent new tests.

## 1. Executive Summary

This phase adds executor abstraction in five stages:

1. introduce first-class runtime instances and an executor adapter boundary,
2. move browser execution onto the same control-plane contract as every other executor,
3. add durable messaging, lease, snapshot, and offload flow,
4. add backend-pool and desktop-local-node execution under the same session model,
5. add provider readiness, end-user-first offload UX, operator live confidence, and one unified smoke.

Reserved Playwright block:

1. `249` through `263`

Reserved tests:

1. `e2e/249_house_worker_runtime_instance_contract.spec.js`
2. `e2e/250_house_worker_browser_executor_adapter_contract.spec.js`
3. `e2e/251_house_worker_runtime_message_transport_contract.spec.js`
4. `e2e/252_house_worker_workspace_snapshot_contract.spec.js`
5. `e2e/253_house_worker_offload_browser_to_backend_contract.spec.js`
6. `e2e/254_house_worker_backend_pool_lease_truth_contract.spec.js`
7. `e2e/255_house_worker_local_node_registration_contract.spec.js`
8. `e2e/256_house_worker_local_node_transfer_contract.spec.js`
9. `e2e/257_house_worker_executor_options_and_readiness_contract.spec.js`
10. `e2e/258_house_worker_runtime_pause_resume_stop_contract.spec.js`
11. `e2e/259_house_worker_managed_runtime_adapter_contract.spec.js`
12. `e2e/260_house_worker_wallet_approval_boundary_offload.spec.js`
13. `e2e/261_house_worker_offload_default_user_guidance.spec.js`
14. `e2e/262_house_worker_executor_operator_live_gate.spec.js`
15. `e2e/263_house_worker_executor_unified_smoke.spec.js`

## 2. Global Measurable Metrics

### 2.1 Runtime-instance and control-plane metrics

1. `runtimeInstanceCoverage = 100%`
   Meaning: every active helper session has one authoritative runtime-instance record.
2. `executorKindTruthMismatchCount = 0`
   Meaning: UI, API, and durable records agree on `executorKind`.
3. `runtimeInstanceAuthorityGapCount = 0`
   Meaning: active-state truth no longer depends only on `house_worker_sessions.session_runtime_json`.

### 2.2 Browser-adapter baseline metrics

1. `browserAdapterParity = exact`
   Meaning: browser-run helpers still behave the same after moving onto the executor abstraction.
2. `browserLeaseCoverage = 100%`
   Meaning: every browser helper publishes runtime-instance lease evidence.
3. `browserRegressionFindingCount = 0`

### 2.3 Message-transport metrics

1. `messageAckCoverage = 100%`
   Meaning: every delivered helper message has durable send and receive evidence.
2. `undeliveredMessageLeakCount = 0`
3. `messageReplayMismatchCount = 0`

### 2.4 Snapshot and transfer metrics

1. `snapshotCaptureSuccessCount >= 1`
2. `snapshotRestoreParity = exact`
   Meaning: restored runtime state matches the captured workspace manifest and checkpoint evidence.
3. `snapshotSecretLeakCount = 0`

### 2.5 Offload and backend-pool metrics

1. `offloadContinuitySuccessCount >= 1`
2. `orphanedBrowserRuntimeCount = 0`
3. `backendLeaseHeartbeatCoverage = 100%`
4. `staleBackendRuntimeFalseGreenCount = 0`

### 2.6 Desktop-local-node metrics

1. `localNodeRegistrationSuccessCount >= 1`
2. `duplicateLocalNodeIdentityCount = 0`
3. `bringBackHereSuccessCount >= 1`
4. `transferRoundTripCount >= 1`

### 2.7 Provider-readiness metrics

1. `providerReadinessTruthCoverage = 100%`
2. `unavailableExecutorSelectableCount = 0`
3. `managedAdapterLifecycleCoverage = 100%`

### 2.8 Pause and stop metrics

1. `pausedRuntimeMessageAcceptCount = 0`
2. `stoppedRuntimeHeartbeatLeakCount = 0`
3. `resumeAfterPauseSuccessCount >= 1`

### 2.9 Security-boundary metrics

1. `walletSecretExportCount = 0`
2. `unapprovedRemoteWalletActionAcceptCount = 0`
3. `delegatedApprovalAuditCoverage = 100%`
4. `portableSecretTransferCount = 0`

### 2.10 End-user UX metrics

1. `defaultOffloadDecisionCount <= 2`
   Meaning: a normal user can choose where a helper runs in at most two obvious decisions.
2. `defaultRawInfraLabelVisibleCount = 0`
   Meaning: queue ids, pod ids, and provider machine ids stay hidden by default.
3. `resumeGuidanceCoverage = 100%`
4. `cloudStateLabelTruthCoverage = 100%`

### 2.11 Live-confidence metrics

1. `executorLiveReadinessCoverage = 100%`
2. `falseGreenLiveReadinessCount = 0`
3. `operatorLiveGatePassCount = 1`
   Meaning: one operator-assisted live lane can be executed successfully when prerequisites are present.

### 2.12 Determinism metrics

1. `unifiedReplayMismatchCount = 0`
2. `leaseReplayMismatchCount = 0`
3. `snapshotReplayMismatchCount = 0`

## 3. Test Harness Rules

1. All tests in this phase must remain offline and deterministic except the explicitly marked operator live gate.
2. Deterministic tests may use test executors, but those executors must speak the same runtime-instance and adapter contracts as production executors.
3. Route handlers may not fake executor success. A test executor must still:
   A. start a real helper runtime or compatibility-locked runtime process,
   B. emit lease evidence,
   C. emit runtime events,
   D. accept messages through the same durable control-plane path.
4. Browser-adapter tests must inspect both:
   A. runtime-instance durability,
   B. actual browser worker behavior.
5. Offload tests must inspect both:
   A. snapshot capture or restore evidence,
   B. user-visible state continuity.
6. Provider-readiness tests must fail closed for unavailable executors or providers.
7. Live-gate tests must not rely on `__test__` shortcuts or seeded fake-success payloads.
8. Unified smoke must replay the same run-here, offload, message, pause, bring-back, and stop journey twice and compare ordered checkpoints exactly.

Required new inspection families:

1. `inspectors.houseWorkerRuntimeInstances`
2. `inspectors.houseWorkerExecutorLeases`
3. `inspectors.houseWorkerMessageTransport`
4. `inspectors.houseWorkerWorkspaceSnapshots`
5. `inspectors.houseWorkerRuntimeTransfers`
6. `inspectors.houseWorkerExecutorProfiles`
7. `inspectors.houseWorkerProviderReadiness`
8. `inspectors.houseWorkerLocalNodes`

## 4. Delivery Roadmap

### 4.1 Stage A - Control-plane extraction

Stage A is complete when:

1. `249`, `250`, and `251` are green,
2. runtime instances exist as first-class records,
3. browser execution uses the same adapter contract as every future executor,
4. durable message transport exists independently of page memory.

### 4.2 Stage B - Snapshot and backend offload

Stage B is complete when:

1. `252`, `253`, and `254` are green,
2. workspace snapshots can be captured and restored safely,
3. browser-to-backend offload works,
4. backend-pool lease truth is durable and honest.

### 4.3 Stage C - Desktop-local-node execution

Stage C is complete when:

1. `255` and `256` are green,
2. a desktop-local node can register and accept work,
3. a helper can move out and back without losing control-plane truth.

### 4.4 Stage D - Provider readiness and user UX

Stage D is complete when:

1. `257` through `261` are green,
2. readiness is honest,
3. pause/resume/stop works across executor kinds,
4. managed-runtime compatibility is shaped,
5. wallet and approval boundaries remain safe,
6. offload UX stays standard-user first.

### 4.5 Stage E - Live confidence and integrated acceptance

Stage E is complete when:

1. `262` and `263` are green,
2. the live gate is operator-runnable and honest,
3. the unified smoke proves one coherent end-user journey across executor kinds.

## 5. Milestone Map

### M42.0 - Runtime instance contract

Primary test:

1. `e2e/249_house_worker_runtime_instance_contract.spec.js`

RED gate:

1. active helper state only exists inside `house_worker_sessions.session_runtime_json`,
2. helper sessions have no independent runtime-instance identity,
3. executor kind cannot be determined durably.

GREEN gate:

1. every active helper session has a runtime-instance record,
2. runtime-instance record stores executor kind, lease fields, and runtime profile evidence,
3. runtime-instance detail is readable without page-local memory,
4. `runtimeInstanceCoverage = 100%`.

### M42.1 - Browser executor adapter contract

Primary test:

1. `e2e/250_house_worker_browser_executor_adapter_contract.spec.js`

RED gate:

1. browser helpers bypass the executor adapter boundary,
2. browser helpers cannot publish runtime-instance lease truth,
3. moving to the adapter boundary regresses current browser helper behavior.

GREEN gate:

1. browser helpers start through the browser executor adapter,
2. browser helpers publish runtime-instance and lease evidence,
3. existing browser helper behavior remains intact,
4. `browserAdapterParity = exact`.

### M42.2 - Runtime message transport contract

Primary test:

1. `e2e/251_house_worker_runtime_message_transport_contract.spec.js`

RED gate:

1. messages exist only as UI writes or event log echoes,
2. delivery acknowledgement is missing,
3. helper replies cannot be replayed deterministically.

GREEN gate:

1. helper messages use durable transport state,
2. message send and receive cursors are inspectable,
3. replay order is stable,
4. `messageAckCoverage = 100%`.

### M42.3 - Workspace snapshot contract

Primary test:

1. `e2e/252_house_worker_workspace_snapshot_contract.spec.js`

RED gate:

1. helper runtime state cannot be captured or restored,
2. snapshots omit required workspace manifest evidence,
3. snapshot payloads leak secret-bearing material.

GREEN gate:

1. workspace snapshots are content-addressed,
2. snapshot capture and restore both work,
3. secrets are excluded or explicitly redacted,
4. `snapshotRestoreParity = exact`.

### M42.4 - Browser-to-backend offload contract

Primary test:

1. `e2e/253_house_worker_offload_browser_to_backend_contract.spec.js`

RED gate:

1. a helper cannot move from browser to backend pool,
2. offload creates duplicate active truth,
3. the user loses continuity after offload.

GREEN gate:

1. `Keep Running In Cloud` or equivalent offload path works,
2. browser runtime hands off through snapshot plus runtime-instance transfer,
3. the UI reflects the new executor truth,
4. `offloadContinuitySuccessCount >= 1`.

### M42.5 - Backend-pool lease truth contract

Primary test:

1. `e2e/254_house_worker_backend_pool_lease_truth_contract.spec.js`

RED gate:

1. backend-pool runtimes have no authoritative lease owner,
2. stale backend runtimes still appear active,
3. lease truth is only inferred from UI state.

GREEN gate:

1. backend runtimes publish heartbeat and lease evidence through runtime instances,
2. stale runtimes fail closed,
3. UI and API agree on active versus stale,
4. `backendLeaseHeartbeatCoverage = 100%`.

### M42.6 - Local-node registration contract

Primary test:

1. `e2e/255_house_worker_local_node_registration_contract.spec.js`

RED gate:

1. a desktop local node cannot register with Portal,
2. local-node identity is unstable,
3. capability or availability truth is missing.

GREEN gate:

1. a local node can register and heartbeat,
2. duplicate node identity is blocked,
3. readiness shows local-node capability truth,
4. `localNodeRegistrationSuccessCount >= 1`.

### M42.7 - Local-node transfer contract

Primary test:

1. `e2e/256_house_worker_local_node_transfer_contract.spec.js`

RED gate:

1. a helper cannot move between browser and desktop local node,
2. transfer loses workspace or status truth,
3. `Bring Back Here` is only cosmetic.

GREEN gate:

1. browser-to-local-node and local-node-to-browser transfer works,
2. runtime-instance authority follows the active executor,
3. the user can resume from plain-language controls,
4. `transferRoundTripCount >= 1`.

### M42.8 - Executor options and readiness contract

Primary test:

1. `e2e/257_house_worker_executor_options_and_readiness_contract.spec.js`

RED gate:

1. executor availability is hidden or inaccurate,
2. unavailable options still look selectable,
3. users cannot tell which mode keeps working after close.

GREEN gate:

1. executor options are listed with honest readiness state,
2. unavailable options fail closed before start,
3. default guidance stays non-technical,
4. `providerReadinessTruthCoverage = 100%`.

### M42.9 - Pause, resume, and stop contract

Primary test:

1. `e2e/258_house_worker_runtime_pause_resume_stop_contract.spec.js`

RED gate:

1. pause or resume does not affect runtime truth,
2. paused runtimes still accept normal work,
3. stopped runtimes still emit lease evidence.

GREEN gate:

1. pause, resume, and stop act on runtime instances,
2. lease truth matches paused and stopped state,
3. message send is blocked when it should be,
4. `pausedRuntimeMessageAcceptCount = 0`.

### M42.10 - Managed runtime adapter contract

Primary test:

1. `e2e/259_house_worker_managed_runtime_adapter_contract.spec.js`

RED gate:

1. managed runtime support bypasses the control plane,
2. provider adapter lifecycle is inconsistent with browser and backend pool,
3. managed runtime status cannot be recovered durably.

GREEN gate:

1. managed runtimes use the same runtime-instance contract,
2. provider adapter lifecycle is inspectable and durable,
3. provider-specific details stay behind readiness and advanced views,
4. `managedAdapterLifecycleCoverage = 100%`.

### M42.11 - Wallet approval boundary offload contract

Primary test:

1. `e2e/260_house_worker_wallet_approval_boundary_offload.spec.js`

RED gate:

1. offloaded helpers can receive exportable wallet secrets,
2. remote runtimes can take wallet actions without approval or delegated policy,
3. approval audit is incomplete.

GREEN gate:

1. wallet secrets never leave the local trust boundary,
2. remote wallet actions require delegated capability and audit evidence,
3. unapproved actions fail closed,
4. `walletSecretExportCount = 0`.

### M42.12 - Default-user offload guidance contract

Primary test:

1. `e2e/261_house_worker_offload_default_user_guidance.spec.js`

RED gate:

1. offload UI shows queue ids, machine ids, model ids, or raw paths by default,
2. users must understand infra terms to choose an executor,
3. resume guidance is unclear.

GREEN gate:

1. default offload UI stays plain-language first,
2. raw infra labels stay hidden by default,
3. users can tell what keeps running after they close the app,
4. `defaultOffloadDecisionCount <= 2`.

### M42.13 - Executor operator live gate

Primary test:

1. `e2e/262_house_worker_executor_operator_live_gate.spec.js`

RED gate:

1. readiness claims live capability without real prerequisites,
2. live gate depends on fake shortcuts,
3. operator cannot validate a real non-browser helper runtime.

GREEN gate:

1. one operator-assisted live lane can be run honestly,
2. readiness only turns green when real prerequisites are present,
3. real runtime evidence is captured,
4. `falseGreenLiveReadinessCount = 0`.

### M42.14 - Unified executor smoke

Primary test:

1. `e2e/263_house_worker_executor_unified_smoke.spec.js`

RED gate:

1. browser, backend, and local-node execution do not share one control-plane truth,
2. offload or bring-back breaks continuity,
3. end-user copy becomes inconsistent across executor kinds.

GREEN gate:

1. one helper can run here, move out, be messaged, pause, come back, and stop,
2. the same journey replays deterministically,
3. end-user guidance remains consistent throughout,
4. `unifiedReplayMismatchCount = 0`.
