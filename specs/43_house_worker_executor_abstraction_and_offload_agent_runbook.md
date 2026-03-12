# Phase 43 Spec: Detailed AI-Agent Runbook For House Worker Executor Abstraction And Offload

Status: Proposed
Version: 0.1
Depends on:
1. [specs/40_house_worker_backend_pool_and_offload_spec.md](./40_house_worker_backend_pool_and_offload_spec.md)
2. [specs/41_house_worker_runtime_topology_and_local_node_spec.md](./41_house_worker_runtime_topology_and_local_node_spec.md)
3. [specs/42_house_worker_executor_abstraction_and_offload_tdd_spec.md](./42_house_worker_executor_abstraction_and_offload_tdd_spec.md)
4. [specs/02_api_contract.md](./02_api_contract.md)
5. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
6. [public/skill.md](../public/skill.md)
7. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)
8. [AGENTS.md](../AGENTS.md)

Purpose: convert Phase 42 into AI-agent-sized TDD work packets with explicit measurable verification and clear backend refactor boundaries.

Start gate:

1. Re-run `npm test` on the branch baseline before any implementation work.
2. Do not start this phase until the inherited baseline is green.
3. Record the baseline commit and proof state in the first implementation PR or branch note.

This is not a competing plan.
It is the execution layer for the executor-abstraction and offload architecture defined in:

1. [specs/40_house_worker_backend_pool_and_offload_spec.md](./40_house_worker_backend_pool_and_offload_spec.md)
2. [specs/41_house_worker_runtime_topology_and_local_node_spec.md](./41_house_worker_runtime_topology_and_local_node_spec.md)

## 1. How AI Agents Must Use This Runbook

1. Only take the next unlocked test in sequence.
2. Keep each implementation pass small:
   A. one control-plane concern,
   B. or one executor-adapter concern,
   C. or one transfer or snapshot concern,
   D. or one end-user UX concern,
   E. plus required docs and tests.
3. If a step would touch more than `10` production files or more than `3` durable domains, split it before coding.
4. Backend work in this phase must extract logic out of route handlers into testable modules.
5. Do not widen scope into:
   A. token marketplace economics,
   B. remote browser execution,
   C. public shared-office pages,
   D. desktop companion or desktop pet work,
   E. backend fake helper completion.
6. A step is only complete when:
   A. the named Playwright test is green,
   B. the measurable metrics below are visible,
   C. required docs are updated in the same change,
   D. previously green House Office and House worker tests remain green.
7. If a step changes vendor runtime files under `vendors/openclaw-lite-main/src/openclaw-lite/*`, rebuild browser artifacts before verification.

## 2. Global Verification Rules

### 2.1 Control-plane discipline

For this phase, `control plane complete` means:

1. runtime truth belongs to runtime instances,
2. route handlers delegate to services or adapters,
3. executor kind is a first-class durable field.

### 2.2 Executor discipline

For this phase, `executor abstraction complete` means:

1. browser, backend pool, and local node all use the same adapter contract,
2. executor-specific details stay behind the adapter boundary,
3. Portal remains the only control plane.

### 2.3 Snapshot discipline

For this phase, `transfer ready` means:

1. state can be captured,
2. state can be restored,
3. no secrets cross snapshot boundaries.

### 2.4 End-user discipline

For this phase, `end-user ready` means:

1. users see simple verbs such as `Run Here`, `Keep Running In Cloud`, `Bring Back Here`,
2. users are told what keeps working after they close the app,
3. advanced infra details stay hidden by default.

### 2.5 Security discipline

For this phase, `secret safe` means:

1. wallet secrets never leave the local trust boundary,
2. remote runtimes only get delegated or approval-scoped capabilities,
3. provider tokens and refresh tokens are never placed in share or snapshot payloads.

### 2.6 Live-confidence discipline

For this phase, `live confidence` means:

1. readiness tells the truth,
2. operator live gates require real prerequisites,
3. there are no fake-green shortcuts.

## 3. Test Sequence

### T42.0 - `e2e/249_house_worker_runtime_instance_contract.spec.js`

- Goal: introduce first-class runtime instances and remove session-only runtime truth.
- Scope cap: schema, read model, and control-plane route surface only.
- Dependencies: green baseline.
- Small-step order:
  1. add additive runtime-instance storage,
  2. add runtime-instance read model,
  3. connect active browser sessions to runtime-instance rows,
  4. keep old session reads compatible during migration.
- Measurable metrics:
  1. `runtimeInstanceCoverage = 100%`,
  2. `executorKindTruthMismatchCount = 0`,
  3. `runtimeInstanceAuthorityGapCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/40_house_worker_backend_pool_and_offload_spec.md](./40_house_worker_backend_pool_and_offload_spec.md)
- Verification:
  1. `npx playwright test e2e/249_house_worker_runtime_instance_contract.spec.js`

### T42.1 - `e2e/250_house_worker_browser_executor_adapter_contract.spec.js`

- Goal: migrate browser execution onto the executor adapter boundary without changing user-visible behavior.
- Scope cap: browser adapter only.
- Dependencies: `T42.0`
- Small-step order:
  1. define adapter interface,
  2. route current browser helper start through the browser adapter,
  3. publish lease evidence through runtime instances,
  4. keep current helper UX stable.
- Measurable metrics:
  1. `browserAdapterParity = exact`,
  2. `browserLeaseCoverage = 100%`,
  3. `browserRegressionFindingCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/40_house_worker_backend_pool_and_offload_spec.md](./40_house_worker_backend_pool_and_offload_spec.md)
- Verification:
  1. `npx playwright test e2e/250_house_worker_browser_executor_adapter_contract.spec.js`

### T42.2 - `e2e/251_house_worker_runtime_message_transport_contract.spec.js`

- Goal: give every executor one durable message transport.
- Scope cap: message transport plus ack cursor only.
- Dependencies: `T42.1`
- Small-step order:
  1. add durable outbox and inbox or equivalent transport state,
  2. deliver messages through executor adapters,
  3. persist helper replies with ordered acknowledgement,
  4. expose deterministic inspection.
- Measurable metrics:
  1. `messageAckCoverage = 100%`,
  2. `undeliveredMessageLeakCount = 0`,
  3. `messageReplayMismatchCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
- Verification:
  1. `npx playwright test e2e/251_house_worker_runtime_message_transport_contract.spec.js`

### T42.3 - `e2e/252_house_worker_workspace_snapshot_contract.spec.js`

- Goal: make helper state portable across executors.
- Scope cap: snapshot capture and restore only.
- Dependencies: `T42.2`
- Small-step order:
  1. define snapshot object and manifest,
  2. implement snapshot capture for browser executor,
  3. implement restore path,
  4. redact or exclude secret-bearing material.
- Measurable metrics:
  1. `snapshotCaptureSuccessCount >= 1`,
  2. `snapshotRestoreParity = exact`,
  3. `snapshotSecretLeakCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/40_house_worker_backend_pool_and_offload_spec.md](./40_house_worker_backend_pool_and_offload_spec.md)
- Verification:
  1. `npx playwright test e2e/252_house_worker_workspace_snapshot_contract.spec.js`

### T42.4 - `e2e/253_house_worker_offload_browser_to_backend_contract.spec.js`

- Goal: offload one helper from the browser into a backend executor without losing continuity.
- Scope cap: browser-to-backend offload path only.
- Dependencies: `T42.3`
- Small-step order:
  1. add offload route,
  2. capture browser snapshot,
  3. start backend runtime instance,
  4. mark browser runtime detached or stopped truthfully.
- Measurable metrics:
  1. `offloadContinuitySuccessCount >= 1`,
  2. `orphanedBrowserRuntimeCount = 0`,
  3. `cloudStateLabelTruthCoverage = 100%`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/40_house_worker_backend_pool_and_offload_spec.md](./40_house_worker_backend_pool_and_offload_spec.md)
- Verification:
  1. `npx playwright test e2e/253_house_worker_offload_browser_to_backend_contract.spec.js`

### T42.5 - `e2e/254_house_worker_backend_pool_lease_truth_contract.spec.js`

- Goal: make backend executor lease truth durable and honest.
- Scope cap: backend-pool lease and stale detection only.
- Dependencies: `T42.4`
- Small-step order:
  1. add backend-pool heartbeat path,
  2. store lease owner and expiry on runtime instances,
  3. fail closed when backend runtime is stale,
  4. reflect that truth in the UI.
- Measurable metrics:
  1. `backendLeaseHeartbeatCoverage = 100%`,
  2. `staleBackendRuntimeFalseGreenCount = 0`,
  3. `executorKindTruthMismatchCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
- Verification:
  1. `npx playwright test e2e/254_house_worker_backend_pool_lease_truth_contract.spec.js`

### T42.6 - `e2e/255_house_worker_local_node_registration_contract.spec.js`

- Goal: let a desktop local node register as a valid executor.
- Scope cap: registration, heartbeat, and capability truth only.
- Dependencies: `T42.0`
- Small-step order:
  1. define local-node registration contract,
  2. register node identity and capability set,
  3. heartbeat into provider-readiness truth,
  4. fail closed for duplicate or stale nodes.
- Measurable metrics:
  1. `localNodeRegistrationSuccessCount >= 1`,
  2. `duplicateLocalNodeIdentityCount = 0`,
  3. `providerReadinessTruthCoverage = 100%`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/41_house_worker_runtime_topology_and_local_node_spec.md](./41_house_worker_runtime_topology_and_local_node_spec.md)
- Verification:
  1. `npx playwright test e2e/255_house_worker_local_node_registration_contract.spec.js`

### T42.7 - `e2e/256_house_worker_local_node_transfer_contract.spec.js`

- Goal: move helpers between browser and desktop local node with the same control plane.
- Scope cap: transfer and bring-back path only.
- Dependencies: `T42.3`, `T42.6`
- Small-step order:
  1. implement browser-to-local-node transfer,
  2. implement bring-back path,
  3. keep message history continuous,
  4. keep UX plain-language first.
- Measurable metrics:
  1. `bringBackHereSuccessCount >= 1`,
  2. `transferRoundTripCount >= 1`,
  3. `resumeGuidanceCoverage = 100%`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/41_house_worker_runtime_topology_and_local_node_spec.md](./41_house_worker_runtime_topology_and_local_node_spec.md)
- Verification:
  1. `npx playwright test e2e/256_house_worker_local_node_transfer_contract.spec.js`

### T42.8 - `e2e/257_house_worker_executor_options_and_readiness_contract.spec.js`

- Goal: show honest executor choices and readiness in the UI.
- Scope cap: readiness and selection UI only.
- Dependencies: `T42.5`, `T42.6`
- Small-step order:
  1. add executor-options and provider-readiness routes,
  2. hide unavailable executors behind truthful blocked copy,
  3. expose plain-language differences between run-here, cloud, and local node,
  4. keep advanced details collapsed by default.
- Measurable metrics:
  1. `providerReadinessTruthCoverage = 100%`,
  2. `unavailableExecutorSelectableCount = 0`,
  3. `defaultOffloadDecisionCount <= 2`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
- Verification:
  1. `npx playwright test e2e/257_house_worker_executor_options_and_readiness_contract.spec.js`

### T42.9 - `e2e/258_house_worker_runtime_pause_resume_stop_contract.spec.js`

- Goal: make pause, resume, and stop real executor actions instead of browser-only status changes.
- Scope cap: lifecycle controls only.
- Dependencies: `T42.5`
- Small-step order:
  1. add runtime-instance lifecycle commands,
  2. block message send when paused or stopped,
  3. keep runtime-instance lease truth aligned,
  4. keep session-card copy non-technical.
- Measurable metrics:
  1. `pausedRuntimeMessageAcceptCount = 0`,
  2. `stoppedRuntimeHeartbeatLeakCount = 0`,
  3. `resumeAfterPauseSuccessCount >= 1`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
- Verification:
  1. `npx playwright test e2e/258_house_worker_runtime_pause_resume_stop_contract.spec.js`

### T42.10 - `e2e/259_house_worker_managed_runtime_adapter_contract.spec.js`

- Goal: prove managed runtime support fits the same executor contract.
- Scope cap: adapter contract and readiness only.
- Dependencies: `T42.8`
- Small-step order:
  1. define managed-runtime adapter boundary,
  2. add provider profile and executor profile mapping,
  3. keep managed runtime under Portal control-plane authority,
  4. expose truthful readiness and lifecycle evidence.
- Measurable metrics:
  1. `managedAdapterLifecycleCoverage = 100%`,
  2. `providerReadinessTruthCoverage = 100%`,
  3. `executorKindTruthMismatchCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/40_house_worker_backend_pool_and_offload_spec.md](./40_house_worker_backend_pool_and_offload_spec.md)
- Verification:
  1. `npx playwright test e2e/259_house_worker_managed_runtime_adapter_contract.spec.js`

### T42.11 - `e2e/260_house_worker_wallet_approval_boundary_offload.spec.js`

- Goal: keep wallet and approval boundaries safe for non-browser helpers.
- Scope cap: delegated approvals and secret boundaries only.
- Dependencies: `T42.4`, `T42.10`
- Small-step order:
  1. define remote wallet-action policy surface,
  2. block raw secret export in snapshots, shares, and runtime payloads,
  3. require delegated or approval-scoped capability,
  4. persist audit evidence.
- Measurable metrics:
  1. `walletSecretExportCount = 0`,
  2. `unapprovedRemoteWalletActionAcceptCount = 0`,
  3. `delegatedApprovalAuditCoverage = 100%`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
- Verification:
  1. `npx playwright test e2e/260_house_worker_wallet_approval_boundary_offload.spec.js`

### T42.12 - `e2e/261_house_worker_offload_default_user_guidance.spec.js`

- Goal: make executor choice and recovery understandable for normal users.
- Scope cap: copy and default layout only.
- Dependencies: `T42.8`, `T42.9`
- Small-step order:
  1. define required plain-language state labels,
  2. remove raw infra labels from default surfaces,
  3. add one-block guidance for run-here, cloud, and bring-back,
  4. keep advanced detail optional.
- Measurable metrics:
  1. `defaultOffloadDecisionCount <= 2`,
  2. `defaultRawInfraLabelVisibleCount = 0`,
  3. `resumeGuidanceCoverage = 100%`.
- Required doc sync:
  1. [specs/40_house_worker_backend_pool_and_offload_spec.md](./40_house_worker_backend_pool_and_offload_spec.md)
  2. [specs/41_house_worker_runtime_topology_and_local_node_spec.md](./41_house_worker_runtime_topology_and_local_node_spec.md)
- Verification:
  1. `npx playwright test e2e/261_house_worker_offload_default_user_guidance.spec.js`

### T42.13 - `e2e/262_house_worker_executor_operator_live_gate.spec.js`

- Goal: create one honest operator-assisted live gate for non-browser execution.
- Scope cap: readiness plus one live lane only.
- Dependencies: `T42.5`, `T42.6`, `T42.8`
- Small-step order:
  1. define live prerequisites,
  2. add operator capture or attach flow if needed,
  3. validate one real non-browser helper runtime,
  4. fail closed when prerequisites are missing.
- Measurable metrics:
  1. `executorLiveReadinessCoverage = 100%`,
  2. `falseGreenLiveReadinessCount = 0`,
  3. `operatorLiveGatePassCount = 1`.
- Required doc sync:
  1. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
  2. [README.md](../README.md)
  3. [specs/02_api_contract.md](./02_api_contract.md)
- Verification:
  1. `npx playwright test e2e/262_house_worker_executor_operator_live_gate.spec.js`

### T42.14 - `e2e/263_house_worker_executor_unified_smoke.spec.js`

- Goal: prove the full user journey across executor kinds.
- Scope cap: one end-to-end journey only.
- Dependencies: all prior `T42.*` milestones.
- Small-step order:
  1. install and start a helper locally,
  2. offload or cloud-copy it,
  3. exchange messages and verify status,
  4. pause and resume,
  5. bring it back here,
  6. stop and verify cleanup,
  7. replay the same ordered checkpoint list again.
- Measurable metrics:
  1. `unifiedReplayMismatchCount = 0`,
  2. `offloadContinuitySuccessCount >= 1`,
  3. `fullJourneyCheckpointCoverage = 100%`.
- Required doc sync:
  1. [specs/40_house_worker_backend_pool_and_offload_spec.md](./40_house_worker_backend_pool_and_offload_spec.md)
  2. [specs/41_house_worker_runtime_topology_and_local_node_spec.md](./41_house_worker_runtime_topology_and_local_node_spec.md)
  3. [specs/42_house_worker_executor_abstraction_and_offload_tdd_spec.md](./42_house_worker_executor_abstraction_and_offload_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/263_house_worker_executor_unified_smoke.spec.js`
