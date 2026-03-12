# 41. House Worker Runtime Topology And Local Node Spec

Status: Proposed  
Branch target: `codex/backend-worker-pool-spec-v0-1`  
Depends on: [specs/40_house_worker_backend_pool_and_offload_spec.md](./40_house_worker_backend_pool_and_offload_spec.md)  
Audience: product, runtime, backend, mobile, desktop, UX, QA, security, economics, and AI-agent implementation teams

## 1. Purpose

This spec exists because the backend-pool direction is still too abstract unless the product makes explicit:

1. where helpers can actually run,
2. which hosts can persist after the browser closes,
3. what mobile and desktop platforms really allow,
4. whether a separate service or repository is required,
5. how local device contribution can join the global worker pool,
6. how inference supply and execution supply are priced and matched,
7. how a database-backed `$OIL` intelligence-credit economy can work without copying secrets.

This document is the topology and execution-host spec that must be settled before implementation.

## 2. Current Runtime Truth

The current codebase uses one execution topology:

1. the main Agent Town runtime is a browser `Worker`,
2. House helpers are additional browser `Worker`s,
3. the server records durable session and lease state,
4. the browser is still the real executor.

That is visible in the current implementation:

1. primary runtime starts in `/openclaw-lite/worker.js`,
2. helper runtimes start via `new Worker(...)` in the current tab,
3. helper status heartbeats are pushed to the server,
4. session runtime records currently use `supervisorSource: browser_supervisor`.

The product therefore has:

1. a durable control plane,
2. a browser runtime plane,
3. no persistent non-browser executor plane yet.

## 3. Non-Negotiable Decisions

## 3.1 Persistence requires a non-browser executor

If a helper must continue running after the browser closes, the runtime must move outside the browser.

Normative rules:

1. Browser-only workers are acceptable for local quick execution.
2. Browser-only workers are not sufficient for persistent cloud or local-node execution.
3. Shared workers and service workers may be used for UX continuity or small background assist flows, but not as the canonical persistent helper pool.

## 3.2 Runtime host types are product primitives

The product must explicitly model runtime host type.

Required runtime host kinds:

1. `browser_tab`
2. `desktop_local_node`
3. `backend_pool`
4. `managed_runtime`
5. `remote_browser`

Reserved later:

6. `mobile_opportunistic_node`
7. `distributed_house_node`

## 3.3 Desktop and mobile are not equivalent

Desktop and mobile clients must not be treated as equally persistent worker hosts.

Normative rules:

1. Desktop native apps may host durable local executors.
2. Mobile apps may host foreground execution and limited OS-scheduled background work.
3. Mobile apps must not be marketed as always-on worker hosts unless a platform-specific path truly guarantees it.
4. Matching and pricing must reflect the weaker persistence guarantees of mobile hosts.

## 3.4 Inference budget and execution budget are separate markets

The product must not collapse all supply into one token bucket.

Normative rules:

1. A user can contribute execution capacity without contributing LLM usage.
2. A user can contribute LLM budget without contributing execution capacity.
3. A job can consume one, both, or neither depending on mode.
4. `$OIL` settlement must meter execution supply and inference supply separately.

## 3.5 Standard-user UX remains primary

The product must not expose market or runtime jargon as the primary experience.

Normative rules:

1. Default users should see:
   A. what a helper can do,
   B. whether it runs here or in cloud,
   C. whether it can keep working after closing the app,
   D. whether it uses shared or personal credits.
2. Default users should not have to understand:
   A. VM placement,
   B. queue ids,
   C. pod lifecycle,
   D. token routing,
   E. background scheduler limitations.

## 4. Browser Capability Reality

## 4.1 Dedicated worker

Current state:

1. supported and already used,
2. good for local multi-worker execution,
3. tied to a single page or tab.

Conclusion:

1. keep for `Run Here`,
2. not sufficient for persistent offload.

## 4.2 Shared worker

Properties:

1. can be shared across same-origin windows or tabs,
2. remains alive only while its owner set is non-empty,
3. browser support is not universal enough to be the primary architecture.

Conclusion:

1. may be used later for cross-tab continuity on desktop web,
2. not sufficient for persistent helper execution,
3. not reliable enough for the canonical worker pool.

## 4.3 Service worker

Properties:

1. can wake for events,
2. can run background tasks in short, event-driven windows,
3. can be terminated when idle,
4. does not preserve in-memory runtime state across termination.

Conclusion:

1. useful for sync, inbox refresh, deferred upload, and light background reconciliation,
2. not suitable as the long-lived helper pool,
3. may support control-plane wakeups, not agent persistence.

## 4.4 Browser conclusion

The browser can support:

1. local helper execution,
2. transient parallelism,
3. cross-tab or wakeup improvements later.

The browser cannot be the only answer for:

1. durable long-running helpers,
2. true background execution after app close,
3. reliable node participation in a global compute market.

## 5. Native App Strategy

## 5.1 Software options

### Option A - Tauri 2

Pros:

1. supports desktop and mobile targets,
2. fits the existing web UI and JS or TS stack,
3. keeps one web frontend and native shell,
4. supports native capability boundaries,
5. is the strongest single-framework fit for this repo.

Cons:

1. requires Rust shell work,
2. desktop sidecar and process patterns do not automatically carry to mobile,
3. mobile background restrictions still apply.

### Option B - Capacitor

Pros:

1. good mobile wrapper for existing web app,
2. straightforward JS bridge,
3. low friction for iOS and Android packaging.

Cons:

1. desktop story is not the strongest unified path,
2. persistent local-node execution would still need extra native layering,
3. less clean as one framework for all targets than Tauri.

### Option C - Electron plus mobile wrapper split

Pros:

1. easy desktop JS process model,
2. strong desktop sidecar and local process options.

Cons:

1. no unified iOS and Android path,
2. would force a split shell strategy,
3. increases architecture divergence.

### Option D - Flutter

Pros:

1. strong multiplatform support,
2. desktop and mobile both work.

Cons:

1. not a JS or TS codebase,
2. large mismatch with the current product,
3. would amount to a UI rewrite.

## 5.2 Native app recommendation

Recommended product shell strategy:

1. Tauri 2 as the unified native shell target,
2. same web frontend reused where possible,
3. desktop-specific local-node sidecar support added under the Tauri shell,
4. mobile foreground and limited background execution added as a constrained contributor mode,
5. browser web app remains supported for no-install use.

## 5.3 Native app host classes

The product must distinguish:

1. `desktop_shell_client`
2. `desktop_local_node`
3. `mobile_shell_client`
4. `mobile_opportunistic_node`

Default behavior:

1. desktop app may offer `Contribute compute from this device`,
2. mobile app may offer `Help while app is open` or `Help while charging`, but not a false always-on promise.

## 6. Where Workers Should Run

## 6.1 Browser tab

Use for:

1. immediate onboarding,
2. privacy-first helpers,
3. lightweight short tasks,
4. developer and preview flows.

State:

1. runtime VFS in browser storage,
2. lease owner is current tab,
3. no persistence after browser close.

## 6.2 Desktop local node

Use for:

1. user-contributed persistent helper hosting,
2. long-running local tasks,
3. high-trust or privacy-sensitive helpers,
4. local marketplace supply.

Required properties:

1. local executor process separate from UI webview,
2. durable local workspace storage,
3. background or tray survival on desktop,
4. CPU, memory, and network quotas,
5. explicit user opt-in and pause controls.

## 6.3 Backend pool

Use for:

1. first-party persistent helpers,
2. trusted infrastructure tasks,
3. strong lease truth,
4. portability and auditability.

Required properties:

1. first-class executor scheduler,
2. snapshot restore and capture,
3. lease and heartbeat reporting,
4. durable logs and metrics.

## 6.4 Managed runtime

Use for:

1. rapid scaling,
2. onboarding without buying much infrastructure,
3. overflow capacity,
4. external execution partnerships.

Required properties:

1. external runtime id,
2. status and lifecycle APIs,
3. message or command transport,
4. lease or heartbeat evidence,
5. clear secret and state boundaries.

## 6.5 Remote browser

Use for:

1. helpers that must keep operating on live websites while the user is away,
2. framed or companion-style web tasks with evidence and approvals.

This is not the same as the main helper pool. It is a specialized execution host for browser-bound helpers.

## 7. Process Model

## 7.1 Repository and service layout recommendation

Do not create a separate repository first.

Recommended first layout:

```text
Portal/
├─ public/
├─ server/
├─ services/
│  ├─ house-worker-executor/
│  ├─ house-worker-scheduler/
│  └─ provider-adapters/
├─ packages/
│  ├─ house-worker-runtime-contract/
│  ├─ workspace-snapshot-format/
│  └─ provider-profile-schema/
└─ native/
   ├─ tauri-shell/
   └─ desktop-local-node/
```

Why:

1. shared contracts stay close to the product,
2. TDD remains easier,
3. branch coordination stays simpler,
4. a later split to another repo remains possible.

## 7.2 Separate process requirements

Persistent execution must happen in a separate process from the browser tab.

Allowed executor implementations:

1. Node child process per runtime,
2. container per runtime,
3. pooled long-lived worker process with isolated runtime sandboxes,
4. managed platform runtime instance,
5. remote browser session plus controller process.

## 7.3 Recommended local-node process layout on desktop

```text
Tauri shell
├─ UI webview
├─ local-node supervisor
│  ├─ helper process A
│  ├─ helper process B
│  └─ helper process C
└─ local storage
   ├─ workspace snapshots
   ├─ leases
   ├─ logs
   └─ provider bindings
```

Normative rules:

1. UI crash must not necessarily kill the local-node supervisor.
2. The user must be able to stop local contribution without uninstalling the app.
3. The app must show CPU, memory, network, and power impact in plain language.

## 7.4 Recommended backend-pool process layout

```text
Portal API / control plane
├─ scheduler
├─ runtime instance registry
├─ snapshot store
├─ message bus
├─ inference gateway
└─ executor workers
   ├─ runtime process 1
   ├─ runtime process 2
   └─ runtime process N
```

## 8. Runtime Compatibility Strategy

## 8.1 Two possible execution strategies

### Strategy A - Server-compatible runtime variant

Build a runtime variant that speaks the same House worker contract but swaps:

1. browser storage for filesystem or DB-backed storage,
2. browser messaging for process transport,
3. browser environment calls for server-compatible adapters.

Pros:

1. efficient,
2. portable,
3. good for backend pools.

Cons:

1. requires explicit compatibility work.

### Strategy B - Headless browser host

Run the current browser-flavored runtime inside a headless browser session.

Pros:

1. high compatibility with existing browser worker behavior,
2. lower initial rewrite cost.

Cons:

1. heavier,
2. more expensive,
3. worse for large-scale generic helper hosting.

## 8.2 Recommended compatibility plan

Recommended:

1. Strategy A for general helper execution,
2. Strategy B only for browser-bound helpers or early bridge compatibility.

## 9. Local Resource Contribution Model

## 9.1 Product concept

Users may opt in to contribute local device resources to the global helper network.

Two contribution types:

1. `execution supply`
   Meaning: device hosts helper runtimes.
2. `inference supply`
   Meaning: device or account contributes model access or intelligence budget.

## 9.2 Intelligence token concept

This phase assumes a backend-ledger currency named `$OIL`.

Important design choice:

`$OIL` is not assumed to be on-chain in this phase.

It is:

1. a platform settlement unit,
2. stored in the backend database,
3. earned for contributed supply,
4. spent for consumed intelligence capacity.

## 9.3 Supply roles

There are three supplier roles:

1. `executor_supplier`
   Provides compute and runtime persistence.
2. `inference_supplier`
   Provides model access or intelligence budget.
3. `hybrid_supplier`
   Provides both.

Examples:

1. desktop local node on a user machine = executor supplier,
2. user with free OpenRouter calls or sponsored provider budget = inference supplier,
3. managed runtime with bundled inference = hybrid supplier.

## 9.4 Demand roles

There are two main demand inputs:

1. `worker configuration`
   The helper template, deployment, and runtime profile.
2. `task demand`
   The actual work request, limits, urgency, and trust requirements.

The user who wants to consume intelligence tokens contributes:

1. helper choice,
2. task,
3. trust and budget policy,
4. optional local or cloud preference.

## 10. Market And Matching Model

## 10.1 Matching primitives

The scheduler must match demand against supply using:

1. runtime host capability,
2. inference capability,
3. trust tier,
4. cost,
5. latency,
6. persistence strength,
7. browser requirement,
8. wallet-action capability,
9. user policy.

## 10.2 First pricing model

Do not start with a fully dynamic market.

Recommended first model:

1. fixed price bands,
2. tiered supply classes,
3. explicit user approval for crossing price bands,
4. optional zero-cost or sponsored tiers for onboarding,
5. later bid or market features only after stable metering exists.

Example supply classes:

1. `free_shared_inference`
2. `sponsored_cloud_helper`
3. `desktop_peer_compute`
4. `trusted_backend_compute`
5. `premium_browser_execution`

## 10.3 Metering objects

Minimum metering records:

1. `executionUsage`
   A. wall-clock active time
   B. CPU seconds or normalized compute units
   C. memory tier
   D. storage footprint
2. `inferenceUsage`
   A. input tokens
   B. output tokens
   C. model/provider tier
   D. rate-limit events
3. `transferUsage`
   A. snapshot bytes
   B. restore count
4. `approvalUsage`
   A. user approvals consumed

## 10.4 Settlement flow

Recommended settlement flow:

1. reserve `$OIL` budget when a job starts,
2. meter usage in chunks,
3. release unused reserved budget at completion,
4. pay suppliers after successful chunk or completion confirmation,
5. hold disputed or failed chunks for reconciliation.

## 10.5 Sponsored capacity

The product must support:

1. first-party sponsored inference,
2. partner-sponsored helper execution,
3. referral or onboarding credit grants,
4. free-tier routing with hard caps.

This allows offers like:

1. `$5 cloud helper credits on signup`,
2. `free shared model tier while capacity lasts`.

## 11. Platform And House Reuse

## 11.1 Existing platform building blocks that already help

The current platform already has strong reusable pieces:

1. House and team scope,
2. deployment and session objects,
3. Registry identity and loadouts,
4. House Office supervision UI,
5. share/install flows,
6. runtime profile fields,
7. lease model,
8. live readiness concepts,
9. approval and audit surfaces.

## 11.2 What must be added

The missing building blocks are:

1. runtime host selection,
2. provider bindings,
3. snapshot transfer,
4. supplier registration,
5. metering and settlement,
6. matching and queueing,
7. non-browser runtime instance lifecycle,
8. local-node supervision.

## 11.3 Registry role

Registry should be reused for:

1. helper templates,
2. package versions,
3. compatibility metadata,
4. public capability descriptions,
5. release and trust signals.

Registry should not be the live market or live runtime truth.

## 11.4 House role

House remains:

1. where helpers are installed,
2. where runtime preferences are chosen,
3. where live helpers are supervised,
4. where friend sharing is initiated,
5. where costs and `$OIL` usage are shown.

## 12. Communication Model

## 12.1 Message paths

There are four communication paths:

1. human ↔ helper,
2. helper ↔ helper,
3. control plane ↔ executor,
4. scheduler ↔ market supply.

## 12.2 Messaging requirement

Every runtime instance must support:

1. send command,
2. receive status,
3. receive last reply,
4. receive structured progress update,
5. heartbeat lease update,
6. request approval,
7. request helper delegation.

## 12.3 End-user communication

Users must get plain-language updates like:

1. `Your helper is still working in cloud`
2. `This helper is waiting for shared model capacity`
3. `This helper used sponsored credits`
4. `This helper moved back to your device`
5. `This helper paused because it needs approval`

## 13. Mobile Reality And Policy

## 13.1 iOS

iOS should be treated as:

1. a strong shell client,
2. a weak persistent local node,
3. a good identity and approval device,
4. a poor always-on worker host.

Recommended mobile node policy:

1. allow foreground helper execution,
2. allow short background continuation where platform-permitted,
3. allow upload, sync, and lease reconciliation,
4. do not promise always-on contribution.

## 13.2 Android

Android is stronger than iOS for long-running visible work, but still constrained.

Recommended Android policy:

1. foreground helper execution supported,
2. optional user-visible foreground contribution mode later,
3. work scheduling and resumable local node support may exist,
4. still not treated as the same persistence class as desktop.

## 13.3 Mobile host class

For the first worker-market phase, mobile devices must be treated as:

1. `interactive contributors`,
2. `approval devices`,
3. `occasional opportunistic nodes`,
4. not the primary persistent worker fleet.

## 14. Recommended Implementation Order

## 14.1 Stage A - Runtime topology contract

Deliver:

1. explicit runtime host kinds,
2. runtime instance object,
3. host capability matrix,
4. UI language for local vs cloud vs local-node.

## 14.2 Stage B - Desktop local node

Deliver:

1. native shell selection,
2. desktop local-node supervisor,
3. helper process host,
4. local snapshot store,
5. local resource controls.

## 14.3 Stage C - Backend pool

Deliver:

1. executor scheduler,
2. process host,
3. snapshot restore and transfer,
4. message bridge,
5. durable non-browser leases.

## 14.4 Stage D - Managed runtime adapter

Deliver:

1. provider adapter interface,
2. one managed runtime integration,
3. provider readiness and lifecycle proof.

## 14.5 Stage E - Supply and demand ledger

Deliver:

1. supplier registration,
2. `$OIL` balance ledger,
3. pricing bands,
4. budget reservation,
5. chunk settlement.

## 14.6 Stage F - Mobile contributor mode

Deliver:

1. mobile shell,
2. foreground helper mode,
3. limited background sync or continuation,
4. clear user messaging about device impact and constraints.

## 15. Acceptance

This topology phase is acceptable only when:

1. one runtime can move from browser to non-browser executor and continue,
2. one local desktop node can host at least one helper durably,
3. the UI truthfully distinguishes browser, local node, backend pool, and managed runtime hosts,
4. a user can tell whether a helper will keep running after closing the app,
5. inference-provider supply and execution-host supply are modeled separately,
6. `$OIL` can reserve and settle usage without copying secrets,
7. mobile clients do not falsely claim desktop-style persistence,
8. the architecture can support a managed provider such as ElizaCloud without making it the whole product,
9. the architecture can support inference routing such as OpenRouter without making it the runtime host,
10. the resulting implementation remains end-user-first.

## 16. Explicit Non-Goals

This phase does not include:

1. on-chain settlement,
2. public token trading,
3. background mobile compute promises the OS cannot guarantee,
4. treating service workers as a real persistent helper fleet,
5. collapsing runtime host and inference provider into one abstraction,
6. rewriting the product UI in a new frontend framework,
7. creating a second control plane outside Portal.

## 17. Recommendation

The recommended path is:

1. keep the current browser worker path,
2. add a desktop local-node path using a native shell,
3. add a self-hosted backend pool,
4. add a managed runtime adapter,
5. keep OpenRouter-style services in the inference layer only,
6. treat mobile as shell-first and opportunistic-contribution second,
7. use `$OIL` as a backend-ledger settlement unit first,
8. delay public market complexity until metering and leases are proven.

That path gives Agent Town a real persistent-helper architecture and a realistic resource-sharing economy without pretending the browser or mobile OS can do more than they actually can.
