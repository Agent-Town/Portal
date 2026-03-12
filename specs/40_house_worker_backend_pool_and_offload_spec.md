# 40. House Worker Backend Pool And Offload Spec

Status: In progress  
Branch target: `codex/backend-worker-pool-spec-v0-1`  
Audience: product, runtime, backend, frontend, UX, QA, security, benchmarking, platform-partnership, and AI-agent implementation teams
Detailed execution docs:
1. [specs/42_house_worker_executor_abstraction_and_offload_tdd_spec.md](./42_house_worker_executor_abstraction_and_offload_tdd_spec.md)
2. [specs/43_house_worker_executor_abstraction_and_offload_agent_runbook.md](./43_house_worker_executor_abstraction_and_offload_agent_runbook.md)

## 1. Purpose

This spec defines the next architecture step after House worker packages, spawn, and runtime-reality hardening.

The goal is to make House helpers able to:

1. start locally in the browser,
2. continue running persistently outside the current tab,
3. be duplicated into a durable remote runtime,
4. keep their own state while away from the browser,
5. remain messageable and observable from House Office,
6. be shareable to another House without copying secrets,
7. use managed execution and inference platforms when that reduces infrastructure burden.

This phase is not a retreat from the worker-first rule. It is the execution-plane extension required to make multi-helper House Office behavior genuinely durable.

## 2. Why This Phase Exists

The current product truth is:

1. House helpers are real browser workers.
2. The server durably records deployments, sessions, shares, and events.
3. The browser remains the actual runtime host for helper execution.

That delivered a truthful and testable first version, but it leaves these structural gaps:

1. helpers stop when the owning browser tab dies,
2. per-helper brain and workspace isolation is still limited,
3. a friend can install the same helper package, but cannot inherit a running helper process,
4. long-running work is still tied to one browser session,
5. managed compute platforms cannot yet be used as first-class helper hosts,
6. inference providers and runtime hosts are not cleanly separated.

The original platform direction already pointed toward durable runners and optional execution services. This spec turns that into one concrete House-worker architecture without moving agent planning into backend request handlers.

## 3. Non-Negotiable Decisions

Current implementation note:

1. `browser_tab` is now implemented as the first concrete executor kind.
2. Browser helper startup is required to pass through the executor adapter boundary, not direct helper-specific boot wiring.
3. Runtime-instance records remain the durable source of executor and lease truth for that browser path.
4. Browser-to-backend offload is now implemented for the first `backend_pool` path through snapshot capture plus runtime-instance transfer.
5. The backend pool now provides real child-process lease ownership for offloaded helpers, even though full backend message execution parity is still a later milestone.

## 3.1 Worker-first still holds

The backend pool must run real worker runtimes, not fake completions.

Normative rules:

1. The server must not invent agent decisions in route handlers.
2. Offloaded helpers must execute the same worker runtime family as browser helpers, or a compatibility-locked server-runtime variant of it.
3. Runtime hosts may differ, but runtime behavior must remain observable and auditable.
4. A successful offload must mean a real helper process started and owns a durable lease.

## 3.2 Browser remains the cockpit

The browser remains the user-facing control plane.

Normative rules:

1. House Office remains the place where users start, message, pause, resume, offload, and review helpers.
2. The UI must not force end users to understand queues, pods, VMs, model ids, or job runners.
3. The user-facing verbs must stay simple:
   A. `Run Here`
   B. `Keep Running In Cloud`
   C. `Make Cloud Copy`
   D. `Bring Back Here`
   E. `Pause`
   F. `Share With Friend`
4. Advanced execution details remain behind an explicit advanced disclosure.

## 3.3 Runtime host and inference provider are different layers

Runtime hosting and LLM inference must be modeled separately.

Normative rules:

1. A runtime host may be:
   A. current browser tab,
   B. self-hosted backend pool,
   C. managed runtime platform.
2. An inference provider may be:
   A. local browser-configured model,
   B. self-hosted inference proxy,
   C. managed router such as OpenRouter,
   D. provider-native API through the existing gateway.
3. The product must not assume that a runtime host also provides LLM tokens.
4. The product must not assume that an inference provider also hosts worker state.

## 3.4 No secret copying across houses

Sharing to another House must remain package-identity based.

Normative rules:

1. Sharing a helper package or office pack must never copy:
   A. API keys,
   B. OAuth tokens,
   C. browser local-storage secrets,
   D. wallet private keys,
   E. provider refresh tokens.
2. Offload credentials must remain deployment-local and house-scoped.
3. Wallet-backed actions must use explicit delegated signer or approval policy, not raw key export.

## 3.5 Default UX is standard-user first

Most users do not know AI-agent or LLM terms.

Normative rules:

1. The default install-and-run path must require at most:
   A. choose a helper,
   B. choose where it works,
   C. click `Run Here` or `Keep Running In Cloud`.
2. The default path must not require users to pick a model, VM, workspace path, or config id.
3. Cost communication must use plain language such as:
   A. `uses local browser`
   B. `uses cloud credits`
   C. `free shared model tier`
   D. `may ask for approval before paid usage`
4. The UI must clearly explain what keeps running after the user closes the tab.

## 4. Execution Options

## 4.1 Option A - Self-hosted backend worker pool

The product runs its own persistent helper executors.

Shape:

1. Portal remains the control plane.
2. A backend executor pool runs helper runtimes as server workers.
3. Postgres or durable SQLite-plus-lease layer stores execution state.
4. CAS/blob storage holds workspace snapshots and artifacts.
5. An inference gateway fronts model providers.

Benefits:

1. strongest control,
2. portable,
3. predictable compliance story,
4. easiest to reason about for sealed or high-trust workloads.

Costs:

1. infrastructure ownership,
2. autoscaling burden,
3. browser-execution support still needs another service for web-heavy tasks.

## 4.2 Option B - Managed runtime platform adapter

The product offloads helpers to a third-party agent/runtime platform.

Shape:

1. Portal remains the control plane and durable source of truth.
2. A managed runtime platform hosts persistent helper processes.
3. Portal keeps deployment, lease, messaging, and audit truth.
4. A provider adapter translates House worker sessions into provider-specific jobs or agents.

Benefits:

1. lowest infrastructure burden,
2. fastest path to persistent helpers,
3. scalable without buying base capacity first.

Costs:

1. provider compatibility work,
2. vendor lifecycle differences,
3. stricter secret and state-boundary design required.

## 4.3 Option C - Hybrid pool (recommended)

This spec recommends a hybrid model:

1. browser runtime for quick local helpers and privacy-first work,
2. self-hosted backend pool as the canonical portable executor,
3. managed runtime adapters for burst capacity or zero-infra rollout,
4. optional remote browser execution adapter for website-heavy helpers later.

Why this is the best fit:

1. it matches the existing worker-first shell,
2. it keeps Portal as the cockpit,
3. it preserves portability,
4. it supports rapid scaling through external platforms,
5. it avoids binding the whole product to one external runtime vendor.

## 4.4 Provider roles

This phase defines four provider roles:

1. `runtime_host`
2. `inference_provider`
3. `identity_provider`
4. `browser_execution_provider`

Examples:

1. ElizaCloud fits `runtime_host`
2. OpenRouter fits `inference_provider`
3. Privy fits `identity_provider`
4. a remote browser platform fits `browser_execution_provider`

## 5. External Platform Compatibility Model

## 5.1 ElizaCloud-style managed runtime host

Use when the goal is to keep helpers running without self-hosted worker infrastructure.

Required compatibility contract:

1. Portal can create a remote helper runtime with:
   A. stable external runtime id,
   B. deployment metadata,
   C. runtime profile,
   D. callback or polling endpoint,
   E. status and logs surface.
2. Portal can send messages to that runtime.
3. Portal can stop, pause, or resume it.
4. Portal can recover runtime truth after browser refresh.
5. Portal can receive or poll heartbeat, status, and last-activity evidence.
6. Remote runtime secrets remain provider-side or Portal-side, never inside share payloads.

Normative rule:

Portal must treat the managed host as an executor adapter, not as the product control plane.

## 5.2 OpenRouter-style inference provider

Use when the goal is cheap or free bootstrap inference, not persistent execution.

Required compatibility contract:

1. Helpers can request inference through the existing LLM gateway using a provider profile.
2. Free-tier or promotional models may be used for:
   A. onboarding,
   B. lightweight helpers,
   C. demos,
   D. fallback operation.
3. The runtime host remains separate.
4. Provider rate limits and free-tier exhaustion must surface as user-visible availability or approval messages, not opaque helper failure.

Normative rule:

OpenRouter-like services must never be modeled as the worker pool itself.

## 5.3 Privy-style identity and delegated-wallet support

Use when the goal is secure user identity continuity and optional delegated wallet actions.

Required compatibility contract:

1. House identity still belongs to the authenticated user and house context.
2. Remote helpers may receive:
   A. scoped user identity claims,
   B. delegated signer/session capability,
   C. house and team scope,
   D. approval rules.
3. Remote helpers must not receive exportable wallet secrets.
4. All delegated wallet actions must be:
   A. policy-scoped,
   B. auditable,
   C. revocable,
   D. optionally approval-gated.

## 5.4 Remote browser execution platforms

Use later for structured web tasks that need durable browsing after the user closes the tab.

Required compatibility contract:

1. runtime host and browser host can be separate,
2. helper owns a durable browser session reference,
3. screenshots, logs, approvals, and evidence return to Portal,
4. browser session lifecycle is auditable and stoppable from House Office.

This is a later subphase, not a first dependency for backend helper offload.

## 6. Recommended Target Architecture

## 6.1 Layers

```text
House Office / Hub UI
├─ House worker control plane (Portal)
│  ├─ deployments
│  ├─ sessions
│  ├─ shares
│  ├─ leases
│  ├─ approvals
│  └─ observability
│
├─ executor abstraction
│  ├─ browser_tab
│  ├─ backend_pool
│  ├─ managed_runtime
│  └─ remote_browser (later)
│
├─ inference abstraction
│  ├─ local_browser_brain
│  ├─ inference_gateway
│  └─ managed_router
│
├─ durable state
│  ├─ platform DB
│  ├─ workspace snapshots
│  ├─ message timeline
│  ├─ event log
│  └─ artifact store
│
└─ provider adapters
   ├─ ElizaCloud adapter
   ├─ OpenRouter adapter
   ├─ Privy auth/signer adapter
   └─ browser execution adapter
```

## 6.2 Control-plane authority

Portal remains authoritative for:

1. deployments,
2. package identity,
3. runtime intent,
4. lease truth,
5. approval policy,
6. message history,
7. audit events,
8. sharing and installation.

Current implementation note:

1. `browser_tab` is now routed through the executor adapter boundary,
2. runtime instances are durable first-class records,
3. helper message delivery already uses durable ordered transport with inspectable inbox and outbox cursors,
4. browser helpers can already capture and restore sanitized workspace snapshots through the same control plane,
5. later executor kinds must conform to the same runtime-instance, transport, and snapshot contracts instead of inventing their own session truth.

The executor host becomes authoritative only for:

1. process liveness,
2. runtime-local state,
3. local workspace mutations between snapshots,
4. runtime logs and transient metrics.

## 6.3 Durable runtime instance model

Add a first-class runtime instance object, distinct from deployment and session.

Minimum fields:

1. `runtimeInstanceId`
2. `deploymentId`
3. `houseWorkerSessionId`
4. `executorKind`
5. `executorProvider`
6. `executorRef`
7. `leaseStatus`
8. `leaseOwnerKind`
9. `lastHeartbeatAt`
10. `leaseExpiresAt`
11. `requestedRuntimeProfile`
12. `appliedRuntimeProfile`
13. `workspaceSnapshotRef`
14. `messageCursor`
15. `startedAt`
16. `stoppedAt`

## 6.4 Executor kinds

Supported kinds in this phase:

1. `browser_tab`
2. `backend_pool`
3. `managed_runtime`

Reserved for later:

4. `remote_browser`
5. `distributed_node`

## 6.5 Offload modes

The product must support these user-facing modes:

1. `Run Here`
   Meaning: start in current browser tab.
2. `Keep Running In Cloud`
   Meaning: start directly in non-browser executor.
3. `Make Cloud Copy`
   Meaning: keep the local helper and start a second helper from the same deployment or template.
4. `Move To Cloud`
   Meaning: checkpoint local state, stop local runtime, resume remotely.
5. `Bring Back Here`
   Meaning: checkpoint remote state, start a new local attached runtime, optionally pause or stop remote.

## 7. Required Domain Additions

## 7.1 New durable tables or equivalent route-owned stores

Minimum additions:

1. `house_worker_runtime_instances`
2. `house_worker_runtime_leases`
3. `house_worker_workspace_snapshots`
4. `house_worker_executor_profiles`
5. `house_worker_provider_bindings`
6. `house_worker_runtime_transfers`

## 7.2 Executor profile object

This captures where and how a helper may run.

Minimum fields:

1. `executorProfileId`
2. `executorKind`
3. `providerId`
4. `defaultInferenceProfileId`
5. `supportsPersistence`
6. `supportsWebExecution`
7. `supportsDelegation`
8. `supportsWalletActions`
9. `maxRuntimeMinutes`
10. `costModel`
11. `availabilityState`

## 7.3 Workspace snapshot object

This allows a helper to move between hosts.

Minimum fields:

1. `workspaceSnapshotRef`
2. `houseWorkerSessionId`
3. `contentHash`
4. `storageKind`
5. `createdAt`
6. `createdByExecutorKind`
7. `workspaceManifest`
8. `restorePolicy`

Normative rules:

1. Snapshots must be content-addressed.
2. Snapshots must never include raw provider secrets.
3. Sensitive local-only material may be excluded with explicit restore warnings.

## 8. Required API Surface

## 8.1 Control-plane routes

Add or extend:

1. `GET /api/platform/house-workers/executor-options`
2. `POST /api/platform/house-workers/offload`
3. `POST /api/platform/house-workers/runtime-instances/:runtimeInstanceId/message`
4. `POST /api/platform/house-workers/runtime-instances/:runtimeInstanceId/transfer`
5. `POST /api/platform/house-workers/runtime-instances/:runtimeInstanceId/pause`
6. `POST /api/platform/house-workers/runtime-instances/:runtimeInstanceId/resume`
7. `POST /api/platform/house-workers/runtime-instances/:runtimeInstanceId/stop`
8. `GET /api/platform/house-workers/runtime-instances`
9. `GET /api/platform/house-workers/runtime-instances/:runtimeInstanceId`
10. `GET /api/platform/house-workers/provider-readiness`

## 8.2 Adapter interface

Every executor adapter must support:

1. `startRuntime`
2. `resumeRuntime`
3. `stopRuntime`
4. `sendMessage`
5. `captureLease`
6. `captureWorkspaceSnapshot`
7. `restoreWorkspaceSnapshot`
8. `listRuntimeEvents`
9. `describeRuntime`

## 8.3 Inference provider interface

Every inference adapter must support:

1. `resolveAvailability`
2. `buildRuntimeLlmConfig`
3. `describeCostTier`
4. `describeRateLimitState`

## 9. End-User UX Requirements

## 9.1 Default user journey

A normal user should be able to:

1. install a helper,
2. click `Keep Running In Cloud`,
3. close the browser,
4. return later,
5. open House Office,
6. see that the helper is still running or waiting,
7. send another message,
8. receive a plain-language summary of what the helper finished.

## 9.2 Required plain-language states

Users should see states like:

1. `Ready here`
2. `Running in cloud`
3. `Waiting for reply`
4. `Needs local setup`
5. `Needs approval`
6. `Cloud credits unavailable`
7. `Stopped`
8. `Paused`
9. `Move failed`
10. `Resume here`

Users should not see as primary labels:

1. queue ids,
2. pod ids,
3. provider-specific machine ids,
4. model slugs,
5. raw workspace paths.

## 9.3 Friendly provider presentation

Provider language must stay user-safe.

Examples:

1. `Runs in your browser`
2. `Runs on our cloud helper service`
3. `Uses free shared model capacity when available`
4. `May ask before using paid compute`
5. `Can keep working after you close this page`

## 10. Security And Trust Boundaries

## 10.1 Runtime host trust

Every runtime host must be classified:

1. `local_user_browser`
2. `trusted_house_backend`
3. `managed_partner_runtime`
4. `remote_browser_service`

The product must expose that trust classification in advanced details and audit logs.

## 10.2 Secret handling

Normative rules:

1. Browser-only secrets stay browser-only unless the user explicitly promotes a provider binding to backend use.
2. Managed runtime credentials must be stored in backend secret storage, not in helper packages.
3. Workspace snapshots must redact or exclude secret-bearing files.
4. Provider tokens must never appear in Registry entities, shares, or exported office packs.

## 10.3 Wallet and signer safety

Normative rules:

1. No remote helper may receive a raw wallet private key.
2. Delegated wallet actions require:
   A. scoped signer capability,
   B. approval policy,
   C. audit event logging.
3. Remote helpers without signer capability must fail closed on wallet-required actions.

## 10.4 Egress and sandboxing

Backend and managed executors must support:

1. allowlisted outbound domains where required,
2. per-helper network policy,
3. per-runtime filesystem boundary,
4. resource limits,
5. stop and revoke semantics.

## 11. Scaling Strategy

## 11.1 Zero-infra-first rollout

Recommended early commercial path:

1. Privy for onboarding and identity continuity,
2. managed runtime host for persistent helper execution,
3. OpenRouter-style inference routing for low-cost or free-tier inference where acceptable,
4. Portal as the durable control plane.

This path allows user onboarding before buying a full worker fleet.

## 11.2 Hybrid scaling path

As usage grows:

1. keep managed runtime for burst,
2. introduce self-hosted backend pool for core workloads,
3. route sensitive or high-volume helpers to self-hosted pool,
4. reserve managed platforms for overflow, onboarding, and lightweight users.

## 11.3 Self-hosted maturity path

Later, the system can move toward:

1. self-hosted executor pool,
2. self-hosted inference gateway,
3. optional remote browser execution fleet,
4. provider abstraction retained for portability.

## 12. Recommended Delivery Plan

## 12.1 Phase A - Executor abstraction and durable runtime instances

Deliver:

1. executor kind model,
2. runtime instance model,
3. lease truth for browser and backend executors,
4. offload API contracts,
5. UI wording for local vs cloud runtime.

## 12.2 Phase B - Self-hosted backend pool

Deliver:

1. backend executor worker host,
2. message transport,
3. workspace snapshot capture and restore,
4. persistent run/stop/resume flow,
5. one end-to-end local-to-backend transfer.

## 12.3 Phase C - Managed runtime adapter

Deliver:

1. adapter contract,
2. provider readiness checks,
3. one managed runtime integration path,
4. one install-to-cloud-to-message-to-stop user flow.

## 12.4 Phase D - Inference provider routing

Deliver:

1. inference provider profiles,
2. free-tier-safe onboarding path,
3. rate-limit and credit-aware UX,
4. explicit failover or approval behavior.

## 12.5 Phase E - Friend sharing and office-pack continuity

Deliver:

1. share install to another house,
2. provider compatibility visibility,
3. local-vs-cloud defaults transfer,
4. no-secret validation.

## 12.6 Phase F - Live release evidence

Deliver:

1. operator-assisted live lane for backend pool,
2. operator-assisted live lane for managed runtime adapter,
3. measurable release evidence for persistent helper execution.

## 13. Acceptance Metrics

This phase is acceptable only when all of the following are true:

1. `persistentRuntimeStartSuccess >= 1`
   Meaning: at least one helper can start outside the browser and remain active after the originating tab closes.
2. `persistentResumeSuccessRate = 100%` for deterministic seeded replay
   Meaning: the same helper state can be resumed from a durable snapshot without divergence in the replayed contract path.
3. `leaseTruthMismatchCount = 0`
   Meaning: UI state, runtime instance state, and executor lease evidence agree.
4. `secretLeakCount = 0`
   Meaning: shares, snapshots, and exports contain no forbidden secrets.
5. `friendInstallSecretCarryover = 0`
   Meaning: a friend can install the same helper package or office pack without inheriting secrets.
6. `defaultSetupStepCount <= 3`
   Meaning: a standard user can install and run a persistent helper in at most three required choices.
7. `backgroundContinuityProof = pass`
   Meaning: a helper continues to run after browser close and can be messaged later.
8. `providerAbstractionCoverage = 100%`
   Meaning: runtime host and inference provider are independently selectable in the contract layer.
9. `fullDeterministicSuite = green`
10. `persistentLiveGate = pass` when live prerequisites are present

## 14. Explicit Non-Goals

This phase does not include:

1. moving planning into backend route handlers,
2. making one external platform the only supported execution path,
3. requiring users to understand model ids or VM details,
4. exporting raw wallet keys or browser secrets,
5. public marketplace monetization or billing UX,
6. unlimited distributed worker meshes,
7. replacing House Office with a separate admin console.

## 15. Recommendation

The recommended implementation path is:

1. build the executor abstraction first,
2. ship one self-hosted backend pool path second,
3. add one managed runtime adapter third,
4. keep inference routing separate from execution,
5. preserve browser workers as the fast local path,
6. treat managed runtimes as optional scale and onboarding capacity, not the product control plane.

This gives Agent Town the missing persistent-helper layer without breaking the worker-first and end-user-first principles already established.
