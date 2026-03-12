# Phase 34 Spec: Registry-Backed House Workers and Spawnable Helper Sessions

Status: Implemented
Version: 0.1
Audience: product, frontend, backend, runtime, UX, QA, security, benchmarking, store-and-growth, and AI-agent implementers
Implementation branch target: `codex/house-worker-packages-spawn-v0-1`
Implementation baseline: `9eb0842`
Latest proof state:
1. `e2e/215` through `e2e/235` are green.
2. Worker-skill contract sync is green in [e2e/55_phase3_skill_contract_line.spec.js](../e2e/55_phase3_skill_contract_line.spec.js).
3. Post-phase runtime-truth hardening is green in [e2e/229_house_worker_reload_truth.spec.js](../e2e/229_house_worker_reload_truth.spec.js) and [e2e/230_house_worker_local_brain_guard.spec.js](../e2e/230_house_worker_local_brain_guard.spec.js).
4. Shared-install exact-version hardening is green in [e2e/231_house_worker_share_exact_version_guard.spec.js](../e2e/231_house_worker_share_exact_version_guard.spec.js).
5. Share-create and share-preview truth hardening is green in [e2e/232_house_worker_share_preview_truth.spec.js](../e2e/232_house_worker_share_preview_truth.spec.js).
6. Release and compatibility visibility hardening is green in [e2e/233_house_worker_release_visibility.spec.js](../e2e/233_house_worker_release_visibility.spec.js).
7. Single-session-per-helper runtime truth is green in [e2e/234_house_worker_single_active_session_guard.spec.js](../e2e/234_house_worker_single_active_session_guard.spec.js).
8. Cross-tab helper takeover copy is green in [e2e/235_house_worker_cross_tab_takeover_copy.spec.js](../e2e/235_house_worker_cross_tab_takeover_copy.spec.js).
9. Full deterministic suite is green at `357 passed, 4 skipped` via `npm test`.
Depends on:
1. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
2. [specs/28_house_office_star_office_inspired_extension_spec.md](./28_house_office_star_office_inspired_extension_spec.md)
3. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
4. [specs/32_house_office_reality_hardening_tdd_spec.md](./32_house_office_reality_hardening_tdd_spec.md)
5. [specs/02_api_contract.md](./02_api_contract.md)
6. [public/app.js](../public/app.js)
7. [public/views/house.html](../public/views/house.html)
8. [server/platform_read_routes.js](../server/platform_read_routes.js)
9. [server/unified_platform_store.js](../server/unified_platform_store.js)
10. [server/web_poker_store.js](../server/web_poker_store.js)
11. [vendors/openclaw-lite-main/src/openclaw-lite/gateway.js](../vendors/openclaw-lite-main/src/openclaw-lite/gateway.js)
12. [vendors/openclaw-lite-main/src/openclaw-lite/worker.js](../vendors/openclaw-lite-main/src/openclaw-lite/worker.js)
13. [AGENTS.md](../AGENTS.md)

# 1. Purpose

House Office is now a real shell with real offices, staff records, assignments, exact citations, and honest readiness.
What it still does not have is a real reusable worker layer.

This phase defines two follow-on options as one ordered product path:

1. Option B: Registry-backed worker packages and House deployments.
2. Option C: spawnable child worker sessions with explicit runtime profiles.

The goal is not to turn House Office into a developer console.
The goal is to let a normal user:

1. browse useful helper agents in a storefront-like Registry experience,
2. install one into their house without understanding LLM internals,
3. share that same helper with a friend who has their own house,
4. let one helper delegate to other helpers when that actually improves the work,
5. still keep the system wallet-first, worker-first, modal-first, and deterministic.

This phase is a follow-on scope after House Office completion.
It is not a rewrite of House Office.

The executable companion docs for this phase are:

1. [specs/35_house_worker_packages_and_spawn_tdd_spec.md](./35_house_worker_packages_and_spawn_tdd_spec.md)
2. [specs/36_house_worker_packages_and_spawn_agent_runbook.md](./36_house_worker_packages_and_spawn_agent_runbook.md)

# 2. Current Platform Reality

The implementation baseline already provides important substrate pieces:

1. Registry already supports first-class entities, versions, proofs, bundles, and loadouts.
2. House Office already supports offices, staff agents, and assignments.
3. The current browser runtime still creates one worker per page or tab.
4. The current local brain model is effectively one page-scoped LLM configuration.
5. The current worker workspace is effectively one runtime workspace rooted at `workspace/`.
6. The vendored OpenClaw runtime references sub-agent concepts upstream, but Agent Town does not yet expose them as a working product surface.

Bluntly:

1. House staff records exist.
2. Shareable Registry loadouts exist.
3. Real multi-worker House execution does not exist yet.

# 3. Product Thesis

The clean product split is:

1. Registry is the publish, discovery, version, proof, and reuse layer for workers.
2. House is the install, deploy, assign, and supervise layer for workers.
3. Runtime is the active execution layer for one or more workers.

This split matters because it solves two separate user needs:

1. "I want a useful helper in my house."
2. "I want to give the same helper to my friend."

If the helper lives only as a House-local record, it is hard to share.
If the helper lives only as a Registry object, it is hard to deploy, customize, and supervise.

Therefore:

1. reusable worker definition belongs in Registry,
2. house-specific installation belongs in House,
3. live session state belongs in runtime.

# 4. Non-Negotiable Decisions

## 4.1 Registry is package truth, not live truth

Reusable worker definitions must be Registry-backed.

Normative rules:

1. A reusable worker package must be represented as a Registry entity.
2. The initial package kind is `worker_package`.
3. The Registry versioning model remains the truth for package version identity.
4. Registry bundles and loadouts remain the portable artifact layer for worker packages.
5. Registry does not become the live session truth for spawned workers.

## 4.2 House is deployment truth, not package truth

Installed workers must be House-scoped deployments.

Normative rules:

1. Installing a worker package into a house creates a House deployment record.
2. A House deployment may customize office placement, display label, and default runtime profile references.
3. A House deployment must not mutate the underlying Registry package version.
4. A House deployment is the object users assign to offices and supervise.

## 4.3 Runtime remains worker-first

Execution must remain worker-first and must not move agent thinking into the server.

Normative rules:

1. Spawned child workers must run as real worker runtimes, not as backend fake completion.
2. The server may store deployment state, spawn state, and message history.
3. The server must not invent agent decisions or simulate successful child work.
4. Parent-to-child delegation must go through real runtime messaging or tool calls.

## 4.4 Default UX must be non-technical

Default end users are not expected to know:

1. what an LLM is,
2. what a workspace seed is,
3. what a config version is,
4. what a loadout is.

Normative rules:

1. Default install must require at most:
   A. choose a house team,
   B. choose an office,
   C. optionally edit the helper display name.
2. Default install must not require raw model ids, API keys, workspace paths, or config ids.
3. Advanced runtime settings must be hidden behind an explicit advanced disclosure.
4. Every package card must explain:
   A. what the helper does,
   B. where it works best,
   C. whether it needs a local brain binding after install,
   D. whether it can delegate to other helpers.

## 4.5 Sharing to a friend must copy package identity, not secrets

Sharing must be based on Registry package identity, not raw local export.

Normative rules:

1. A friend-facing share path must carry:
   A. `registryEntityId`,
   B. `entityVersionId`,
   C. selected loadout or bundle ref if applicable.
2. The share path must not carry:
   A. API keys,
   B. OAuth tokens,
   C. callback URLs,
   D. local wallet secrets,
   E. local browser workspace contents,
   F. house-local session ids.
3. Installing the same package into a friend's house must reproduce the same package version and portable artifacts, but not the original house secrets.

## 4.6 Brain profiles are references, not portable secrets

Brains can be referenced, but credentials cannot be shipped.

Normative rules:

1. Package and deployment records may refer to a `brainProfileId` or equivalent local brain policy id.
2. Registry packages must not store secrets required to use that brain.
3. Friend installs may arrive in `brain_binding_required` state when the portable package is present but local credentials are not.
4. The UI must explain this in plain language.

# 5. Option B - Registry-Backed Worker Packages and House Deployments

## 5.1 Product summary

Option B introduces a normal-user flow:

1. browse helper agents in Registry,
2. install a helper into a house,
3. assign it to an office,
4. optionally share the same helper with a friend.

This is the package and deployment layer.
It does not require full multi-worker spawning to be useful.

## 5.2 Registry storefront requirements

Worker packages must feel like understandable digital products rather than raw AI configs.

Each package storefront must expose:

1. `displayName`
2. `oneLineBenefit`
3. `whatItDoes`
4. `bestFor`
5. `recommendedOffice`
6. `supportedSurfaces`
7. `proofCards`
8. `loadouts`
9. `bundleHash` or equivalent portable artifact identity
10. whether a local brain binding is required after install

Required copy rules:

1. Primary copy must stay plain-language.
2. Raw `modelRef`, `workspaceSeedId`, `configVersionId`, and `loadoutId` are advanced details only.
3. The install CTA must read like a standard app-store action, for example:
   A. `Install to House`
   B. `Send to Friend`
   C. `View Details`

## 5.3 House deployment requirements

Installing a package must create a House deployment object.

Required deployment fields:

1. `deploymentId`
2. `houseId`
3. `teamId`
4. `officeId`
5. `staffAgentId`
6. `registryEntityId`
7. `entityVersionId`
8. `loadoutId`
9. `bundleHash`
10. `displayName`
11. `runtimeDefaults`
12. `status`

Required runtime default fields:

1. optional `brainProfileId`
2. optional `workspaceSeedRef`
3. optional `configVersionId`
4. optional `loadoutId`
5. `delegationAllowed`

Deployment state must be visible in House Office as an installed helper, even before full multi-worker spawn exists.

## 5.4 Sharing to a friend

The friend-sharing story for standard users is:

1. open helper package,
2. click `Send to Friend`,
3. share a simple install link or share card,
4. friend opens the same helper in their own house,
5. friend clicks `Install to My House`,
6. friend binds a local brain only if required.

This phase must not require:

1. raw JSON export,
2. git operations,
3. filesystem copying,
4. secret transfer.

# 6. Option C - Spawnable Child Worker Sessions

## 6.1 Product summary

Option C introduces real multi-worker execution.

This means:

1. one visible primary worker may supervise several child helpers,
2. each child helper has its own active session identity,
3. each child helper can have explicit runtime profile choices,
4. users can still understand what is happening without AI jargon.

## 6.2 Runtime supervisor requirements

The product must introduce a worker supervisor layer inside the current shell runtime.

Normative rules:

1. It must be possible to run more than one worker in the same shell context.
2. The supervisor must track:
   A. worker session id,
   B. deployment id or package origin,
   C. office assignment,
   D. status,
   E. runtime profile,
   F. message timeline.
3. The supervisor must preserve current modal-first continuity.
4. Spawning child workers must not silently replace the primary worker.

## 6.3 Child spawn contract

Every child spawn must resolve through one explicit contract.

Required spawn inputs:

1. `deploymentId` or portable package ref
2. `task`
3. `reason`
4. optional `brainProfileId`
5. optional `workspaceSeedRef`
6. optional `configVersionId`
7. optional `loadoutId`
8. optional `officeId`
9. optional `parentWorkerSessionId`

Required spawn outputs:

1. `workerSessionId`
2. `deploymentId`
3. `status`
4. `runtimeProfile`
5. `spawnedAt`
6. `spawnSource`

## 6.4 Parent worker delegation

One worker must be able to delegate to other workers.

That requires new worker-facing tools, for example:

1. `agent_town_worker_list`
2. `agent_town_worker_spawn`
3. `agent_town_worker_message`
4. `agent_town_worker_status`

Normative rules:

1. These tools must remain real runtime tools.
2. The server may persist the spawn or message record, but it must not pretend the child finished a task it never ran.
3. Skill and worker contract docs must be updated when these tools land.

## 6.5 Explicit runtime profiles

The user asked for child workers to be spawnable with specified config, workspace, and brain.
That becomes a first-class runtime profile contract here.

Required semantics:

1. `brainProfileId` selects a local or house-bound brain reference, not raw credentials in a package.
2. `workspaceSeedRef` identifies the initial portable workspace bundle or seed files.
3. `configVersionId` identifies the active platform config binding to use.
4. `loadoutId` identifies the portable loadout or trainer/runtime preset to activate.
5. Default users do not need to see or edit these values unless they open advanced settings.

# 7. Data Model and Route Shape

## 7.1 Allowed additive tables

This phase may add up to `3` additive durable tables:

1. `house_staff_deployments`
2. `house_worker_sessions`
3. `house_worker_session_events`

Rationale:

1. Registry already owns package versioning, bundles, and loadouts.
2. House needs a durable installation layer.
3. Runtime needs a durable active-session and event layer.

## 7.2 Preferred route family

New routes stay under `/api/platform/*`.

Required route families:

1. `GET /api/platform/house-workers`
2. `POST /api/platform/house-workers/install`
3. `POST /api/platform/house-workers/remove`
4. `POST /api/platform/house-workers/share`
5. `GET /api/platform/house-workers/sessions`
6. `POST /api/platform/house-workers/spawn`
7. `POST /api/platform/house-workers/message`
8. `POST /api/platform/house-workers/stop`

The Registry side should reuse the existing Registry family and entity routes where possible rather than creating a second worker catalog route family.

# 8. UX Rules

## 8.1 Standard-user rules

Required default labels:

1. `Helper`
2. `Installed Helpers`
3. `Install to House`
4. `Send to Friend`
5. `Needs local brain setup`
6. `Ask Helper`
7. `Advanced runtime settings`

Required behavior:

1. A normal user can install a helper without touching advanced settings.
2. A normal user can share a helper without seeing raw JSON.
3. A normal user can see whether a helper is idle, working, waiting, blocked, or needs setup.
4. A normal user can ask a helper what it does and what it needs next.

## 8.2 Advanced-user rules

Advanced users may access:

1. brain profile selection,
2. workspace seed selection,
3. config version selection,
4. loadout selection,
5. delegation permissions,
6. concurrency and spawn budget settings.

These must never be required for the default path.

# 9. Security and Trust Rules

1. Registry packages must never export or publish live credentials.
2. House deployments must never reveal hidden credential payloads in overview APIs.
3. Share links must never copy house-local secrets.
4. Child workers must never escape the current house or team scope.
5. Spawn requests using unknown deployments, foreign teams, or unsupported overrides must fail closed.
6. Concurrency and spawn budget controls must exist before the product claims real multi-worker safety.

# 10. Delivery Shape

This phase is ordered and test-first.

Stage A:

1. define worker packages in Registry,
2. define package storefront and install semantics.

Stage B:

1. define House deployments and friend-sharing,
2. prove secret boundaries and non-technical install flow.

Stage C:

1. add multi-worker supervisor,
2. add child spawn contract,
3. add explicit runtime profile overrides.

Stage D:

1. add parent delegation tools,
2. add status and messaging,
3. add guardrails and replay proof,
4. prove one full package-to-spawn journey.

Reserved Playwright block:

1. `215` through `228`

Reserved tests:

1. `e2e/215_registry_worker_package_family_contract.spec.js`
2. `e2e/216_registry_worker_package_install_contract.spec.js`
3. `e2e/217_house_worker_deployments_surface.spec.js`
4. `e2e/218_house_worker_share_to_friend_contract.spec.js`
5. `e2e/219_house_worker_package_secret_boundary.spec.js`
6. `e2e/220_house_worker_default_user_guidance.spec.js`
7. `e2e/221_house_worker_runtime_supervisor_contract.spec.js`
8. `e2e/222_house_worker_spawn_contract.spec.js`
9. `e2e/223_house_worker_spawn_profile_contract.spec.js`
10. `e2e/224_parent_worker_delegation_tool_contract.spec.js`
11. `e2e/225_house_worker_status_and_message_contract.spec.js`
12. `e2e/226_house_worker_spawn_guardrails.spec.js`
13. `e2e/227_house_worker_replay_determinism.spec.js`
14. `e2e/228_house_worker_package_spawn_unified_smoke.spec.js`

# 11. Acceptance

This phase is complete only when:

1. a helper package can be discovered in Registry and understood by a non-technical user,
2. that package can be installed into a house as a deployment,
3. the same package version can be shared to a friend's house without copying secrets,
4. multiple worker sessions can run under the same shell or runtime supervisor,
5. child workers can be spawned with explicit brain, workspace, and config or loadout choices,
6. parent workers can delegate to child workers through real worker tools,
7. guardrails prevent unsafe or runaway spawning,
8. tests `215` through `228` are green,
9. previously green House Office tests `195` through `214` remain green,
10. the full deterministic suite remains green.

# 12. Explicit Non-Goals

This phase does not include:

1. public shared-office pages,
2. desktop companion or desktop pet scope,
3. server-side fake child-agent thinking,
4. copying raw workspaces or secrets between houses,
5. requiring standard users to understand model ids, prompts, or workspace paths,
6. introducing new external identity providers.
