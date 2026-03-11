# Phase 35 Spec: Registry-Backed House Workers and Spawnable Helper Sessions (Contracts First, TDD)

Status: Planned
Version: 0.1
Audience: frontend engineers, backend engineers, runtime engineers, UX engineers, security engineers, QA automation engineers, and AI-agent implementers
Depends on:
1. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
2. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
3. [specs/32_house_office_reality_hardening_tdd_spec.md](./32_house_office_reality_hardening_tdd_spec.md)
4. [specs/02_api_contract.md](./02_api_contract.md)
5. [public/skill.md](../public/skill.md)
6. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)
7. [AGENTS.md](../AGENTS.md)
Detailed execution runbook:
1. [specs/36_house_worker_packages_and_spawn_agent_runbook.md](./36_house_worker_packages_and_spawn_agent_runbook.md)

Goal: convert Option B and Option C into one deterministic implementation path:

1. Registry-backed worker packages first,
2. House deployment and sharing second,
3. real multi-worker supervision and spawn third,
4. parent-worker delegation and guardrails last.

Implementation baseline:

1. House Office phases `28` through `33` are implemented.
2. Current branch baseline is `c7ca3ac`.
3. Current repo already has:
   A. Registry entities, versions, bundles, and loadouts,
   B. House offices, staff agents, and assignments,
   C. one page-scoped worker runtime,
   D. no finished multi-worker product path.

Implementation constraints:

1. Keep wallet-first and house-aware identity.
2. Keep `/app` modal or in-shell continuity.
3. Keep worker-first architecture.
4. Do not move child-agent thinking into the backend.
5. New routes stay under `/api/platform/*`.
6. Default tests remain deterministic and offline-safe.
7. Runtime changes under `vendors/openclaw-lite-main/src/openclaw-lite/*` must rebuild browser artifacts.
8. New worker-tool behavior must sync:
   A. [public/skill.md](../public/skill.md)
   B. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)
   C. `e2e/55_phase3_skill_contract_line.spec.js` or adjacent new tests.

## 1. Executive Summary

This phase adds a true reusable worker layer in four stages:

1. publish helpers as Registry packages,
2. install them into a House as deployments,
3. run more than one worker at once,
4. let workers delegate to workers with explicit runtime profiles and guardrails.

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

## 2. Global Measurable Metrics

### 2.1 Package and storefront metrics

1. `workerPackageFamilyVisible = true`
   Meaning: Registry exposes a discoverable worker package family or equivalent grouped result.
2. `plainLanguageStorefrontCoverage = 100%`
   Meaning: every worker package card exposes non-technical summary fields.
3. `defaultAdvancedFieldVisibleCount = 0`
   Meaning: raw model ids, workspace ids, config ids, and loadout ids are hidden by default.
4. `packageVersionParityCount = 1`
   Meaning: installs and shares resolve to one exact Registry version identity.

### 2.2 Install and deployment metrics

1. `defaultInstallDecisionCount <= 2`
   Meaning: standard users can install with at most office plus optional label selection.
2. `deploymentCreateSuccessCount = 1`
3. `deploymentPayloadParity = exact`
   Meaning: House deployment records preserve exact package identity and chosen office.
4. `brainBindingRequiredExplained = true`
   Meaning: if a helper needs local credentials, the UI says so in plain language.

### 2.3 Share-to-friend metrics

1. `shareParityMismatchCount = 0`
   Meaning: friend installs the same Registry package version and loadout identity.
2. `secretTransferCount = 0`
   Meaning: no secret credential or local token crosses the share boundary.
3. `friendInstallRequiresRawExport = false`
   Meaning: no JSON or filesystem export is required for normal users.

### 2.4 Runtime supervisor metrics

1. `activeWorkerCount >= 2`
   Meaning: at least primary plus one child worker can exist at once.
2. `workerIdentityCollisionCount = 0`
3. `supervisorStatusCoverage = 100%`
   Meaning: every active worker has visible session id, deployment origin, and status.
4. `shellContinuityLossCount = 0`

### 2.5 Spawn-profile metrics

1. `spawnSuccessCount >= 1`
2. `spawnProfilePersistence = exact`
   Meaning: chosen `brainProfileId`, `workspaceSeedRef`, `configVersionId`, and `loadoutId` persist exactly in spawn state.
3. `defaultSpawnAdvancedDecisionCount = 0`
   Meaning: default child spawn requires no advanced field edits.
4. `advancedOverrideRoundTripCount = 1`

### 2.6 Delegation and messaging metrics

1. `workerSpawnToolVisible = true`
2. `workerStatusToolVisible = true`
3. `workerMessageToolVisible = true`
4. `delegationAcceptedCount >= 1`
5. `messageRoundTripCount >= 1`
6. `backendShortcutFindingCount = 0`
   Meaning: child completion is not fabricated by a server-only path.

### 2.7 Guardrail and safety metrics

1. `secretLeakageCount = 0`
2. `foreignDeploymentSpawnAcceptCount = 0`
3. `unsupportedOverrideAcceptCount = 0`
4. `overConcurrencyAcceptCount = 0`
5. `runawaySpawnAcceptCount = 0`

### 2.8 Determinism metrics

1. `replayCheckpointMismatchCount = 0`
2. `stableOrderedWorkerEventCount >= 1`
3. `packageInstallReplayMismatchCount = 0`

## 3. Test Harness Rules

1. All tests in this phase must remain offline and deterministic.
2. Registry worker packages may be seeded in test fixtures, but their version and bundle identities must be stable across resets.
3. House deployment tests must inspect both:
   A. API payload shape,
   B. House Office rendering.
4. Runtime supervisor tests must inspect both:
   A. visible UI state,
   B. deterministic internal inspector state.
5. Spawn tests must assert:
   A. child worker session creation,
   B. persisted spawn profile,
   C. visible status changes.
6. Worker-tool milestones must update the skill contract and prove the exposed tool surface.
7. Unified smoke must replay the same package-install-share-spawn journey twice and compare ordered checkpoints exactly.

Required new inspection families:

1. `inspectors.workerPackages`
2. `inspectors.houseWorkerDeployments`
3. `inspectors.houseWorkerShares`
4. `inspectors.houseWorkerSupervisor`
5. `inspectors.houseWorkerSessions`
6. `inspectors.houseWorkerEvents`

## 4. Delivery Roadmap

### 4.1 Stage A - Registry worker package foundation

Stage A is complete when:

1. `215` and `216` are green,
2. Registry has a worker package family or equivalent grouped result,
3. a package can be installed into a House deployment.

### 4.2 Stage B - Deployment, sharing, and non-technical UX

Stage B is complete when:

1. `217` through `220` are green,
2. deployed helpers appear clearly in House Office,
3. same-version friend install works without secret transfer,
4. default UX stays non-technical.

### 4.3 Stage C - Multi-worker runtime and explicit spawn profiles

Stage C is complete when:

1. `221` through `223` are green,
2. the shell can run more than one worker at once,
3. spawned child workers record exact runtime profiles.

### 4.4 Stage D - Delegation, guardrails, and acceptance

Stage D is complete when:

1. `224` through `228` are green,
2. workers can delegate to workers through real tools,
3. guardrails block unsafe spawn patterns,
4. unified smoke proves one coherent end-user journey.

## 5. Milestone Map

### M35.0 - Registry worker package family contract

Primary test:

1. `e2e/215_registry_worker_package_family_contract.spec.js`

RED gate:

1. Registry has no discoverable worker package family,
2. package cards expose only technical fields,
3. install actions are absent from the storefront contract.

GREEN gate:

1. Registry exposes at least one worker package result,
2. every package card exposes plain-language summary fields,
3. advanced technical fields are hidden by default,
4. package contract includes exact version identity and install metadata.

Implementation notes:

1. Reuse Registry entities plus versions plus bundles plus loadouts rather than introducing a second package catalog model.
2. The first package family may be implemented as `family = workers` or equivalent grouped family semantics.

### M35.1 - Worker package install contract

Primary test:

1. `e2e/216_registry_worker_package_install_contract.spec.js`

RED gate:

1. a package cannot create a House deployment,
2. install requires raw model or workspace knowledge,
3. install loses exact package version identity.

GREEN gate:

1. package install creates one deterministic House deployment,
2. install preserves exact `registryEntityId`, `entityVersionId`, and portable artifact identity,
3. default install requires no advanced runtime field edits,
4. install result explains any required local brain binding in plain language.

### M35.2 - House deployed-helper surface

Primary test:

1. `e2e/217_house_worker_deployments_surface.spec.js`

RED gate:

1. installed helpers are invisible in House Office,
2. deployed-helper cards are jargon-heavy,
3. office association is unclear.

GREEN gate:

1. House Office exposes a deployed-helper list or section,
2. each helper card shows display name, what it does, office, and setup state,
3. default helper cards keep advanced runtime details collapsed,
4. helper card count matches the deployment payload exactly.

### M35.3 - Share-to-friend contract

Primary test:

1. `e2e/218_house_worker_share_to_friend_contract.spec.js`

RED gate:

1. user must export raw JSON or copy filesystem data,
2. friend cannot install the same helper package version,
3. share path leaks house-local ids or secrets.

GREEN gate:

1. share action produces a portable install reference,
2. friend installs the same package version into a different house,
3. share parity matches on package identity and portable artifacts,
4. no secrets cross the boundary.

### M35.4 - Secret-boundary contract

Primary test:

1. `e2e/219_house_worker_package_secret_boundary.spec.js`

RED gate:

1. package payloads leak API keys, OAuth tokens, callback URLs, wallet secrets, or house-local session ids,
2. friend install can only work by copying a live secret.

GREEN gate:

1. `secretLeakageCount = 0`,
2. friend install path contains only portable package refs and safe metadata,
3. helpers that need local credentials enter a clear `brain_binding_required` or equivalent state,
4. secret-bearing fields remain absent from Registry, share, and deployment overview payloads.

### M35.5 - Non-technical default guidance contract

Primary test:

1. `e2e/220_house_worker_default_user_guidance.spec.js`

RED gate:

1. normal users must edit technical runtime fields,
2. helper cards or install panels assume LLM knowledge,
3. setup requirements are ambiguous.

GREEN gate:

1. `defaultInstallDecisionCount <= 2`,
2. `defaultAdvancedFieldVisibleCount = 0`,
3. helper surfaces explain setup in plain language,
4. the user can identify what a helper does and what it needs next without reading technical docs.

### M35.6 - Runtime supervisor contract

Primary test:

1. `e2e/221_house_worker_runtime_supervisor_contract.spec.js`

RED gate:

1. the shell still supports only one effective worker,
2. child workers replace the primary worker,
3. active worker identities are not inspectable.

GREEN gate:

1. `activeWorkerCount >= 2`,
2. supervisor state exposes stable worker ids and statuses,
3. primary worker remains present after child spawn,
4. shell continuity remains intact.

Implementation notes:

1. Runtime execution must remain worker-first.
2. If runtime support requires vendor changes, rebuild browser artifacts and keep them in sync.

### M35.7 - Child spawn contract

Primary test:

1. `e2e/222_house_worker_spawn_contract.spec.js`

RED gate:

1. a deployed helper cannot be spawned,
2. spawn does not create a real child session,
3. spawn success is only simulated server-side.

GREEN gate:

1. child spawn creates one real child worker session,
2. spawned child is linked to a deployment or portable package origin,
3. child status becomes visible in House or debug state,
4. spawned session remains inside current house and team scope.

### M35.8 - Spawn-profile contract

Primary test:

1. `e2e/223_house_worker_spawn_profile_contract.spec.js`

RED gate:

1. user cannot specify runtime profile overrides,
2. overrides are ignored,
3. default spawn path exposes technical fields unnecessarily.

GREEN gate:

1. spawn supports explicit `brainProfileId`, `workspaceSeedRef`, `configVersionId`, and `loadoutId`,
2. chosen values round-trip exactly in spawn state,
3. default spawn path still requires no advanced edits,
4. advanced overrides remain opt-in.

### M35.9 - Parent worker delegation tool contract

Primary test:

1. `e2e/224_parent_worker_delegation_tool_contract.spec.js`

RED gate:

1. parent workers cannot enumerate helpers,
2. parent workers cannot spawn or message helpers,
3. backend shortcuts bypass worker tools.

GREEN gate:

1. required worker tools are visible on the runtime tool surface,
2. parent worker can trigger one child spawn through a real tool path,
3. parent worker can send one task message to the child,
4. skill and tool docs are updated with deterministic coverage.

### M35.10 - Status and message contract

Primary test:

1. `e2e/225_house_worker_status_and_message_contract.spec.js`

RED gate:

1. users cannot tell which helper is working on what,
2. helper status updates are invisible,
3. targeting a specific helper is unreliable.

GREEN gate:

1. per-helper status is visible and stable,
2. user can target a specific helper for a message,
3. one deterministic message round trip succeeds,
4. visible state matches persisted event history.

### M35.11 - Spawn guardrail contract

Primary test:

1. `e2e/226_house_worker_spawn_guardrails.spec.js`

RED gate:

1. foreign deployment spawns are accepted,
2. unsupported overrides are accepted,
3. runaway concurrency is accepted,
4. secret-like override payloads are accepted.

GREEN gate:

1. `foreignDeploymentSpawnAcceptCount = 0`,
2. `unsupportedOverrideAcceptCount = 0`,
3. `overConcurrencyAcceptCount = 0`,
4. `runawaySpawnAcceptCount = 0`,
5. failures return stable error codes and leave no partial session state.

### M35.12 - Replay determinism contract

Primary test:

1. `e2e/227_house_worker_replay_determinism.spec.js`

RED gate:

1. repeated seeded install plus spawn runs produce divergent ordered checkpoints,
2. worker event order is unstable for the same seed.

GREEN gate:

1. `replayCheckpointMismatchCount = 0`,
2. install plus spawn journey replays with the same ordered checkpoints,
3. stable worker event ordering is visible through test inspection.

### M35.13 - Unified smoke

Primary test:

1. `e2e/228_house_worker_package_spawn_unified_smoke.spec.js`

RED gate:

1. package catalog, install, share, and spawn do not compose into one real user flow,
2. standard-user and advanced-user paths cannot coexist,
3. one regression breaks House Office continuity.

GREEN gate:

1. a user can discover a helper package,
2. install it into a House,
3. share the same package version to a friend's House,
4. spawn the helper as a live child worker,
5. optionally use advanced runtime settings,
6. observe status and messaging,
7. replay the same journey exactly.

## 6. Required Fixture Families

1. `worker_package_registry_seed`
2. `worker_package_install_seed`
3. `worker_package_share_seed`
4. `worker_package_secret_boundary_seed`
5. `worker_package_guidance_seed`
6. `worker_runtime_supervisor_seed`
7. `worker_spawn_profile_seed`
8. `worker_delegation_seed`
9. `worker_guardrail_seed`
10. `worker_spawn_smoke_seed`

## 7. Completion Rule

This phase is complete only when:

1. tests `215` through `228` are green,
2. House Office tests `195` through `214` remain green,
3. new worker tool docs are synced,
4. the full deterministic suite remains green.
