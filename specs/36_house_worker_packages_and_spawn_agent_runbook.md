# Phase 36 Spec: Detailed AI-Agent Runbook for Registry-Backed House Workers and Spawnable Helper Sessions

Status: Completed
Version: 0.1
Depends on:
1. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
2. [specs/35_house_worker_packages_and_spawn_tdd_spec.md](./35_house_worker_packages_and_spawn_tdd_spec.md)
3. [specs/02_api_contract.md](./02_api_contract.md)
4. [public/skill.md](../public/skill.md)
5. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)
6. [AGENTS.md](../AGENTS.md)

Purpose: convert Phase 35 into AI-agent-sized TDD work packets with explicit measurable verification.

Current proof state:

1. `T35.0` through `T35.13` are implemented.
2. `e2e/215` through `e2e/231` are green.
3. Post-phase runtime-truth hardening is green in `e2e/229` and `e2e/230`.
4. Shared-install exact-version hardening is green in `e2e/231`.
5. Full deterministic suite is green at `352 passed, 4 skipped`.

This is not a competing plan.
It is the detailed execution layer for:

1. Option B: Registry-backed worker packages and House deployments.
2. Option C: spawnable child worker sessions with explicit runtime profiles.

## 1. How AI Agents Must Use This Runbook

1. Do not start this phase until House Office phases `195` through `214` are green.
2. Only take the next unlocked test in sequence.
3. Keep each implementation pass small:
   A. at most one package-storefront concern,
   B. or one deployment concern,
   C. or one runtime-supervisor concern,
   D. or one safety concern,
   E. plus required docs and tests.
4. If a step would touch more than `9` production files or more than `3` durable domains, split it before coding.
5. If a step changes vendor runtime code under `vendors/openclaw-lite-main/src/openclaw-lite/*`, rebuild browser artifacts before verification.
6. A step is only complete when:
   A. the named Playwright test is green,
   B. the measurable metrics below are visible,
   C. required docs are updated in the same change,
   D. previously green worker-package and House Office tests remain green.
7. Do not widen scope into:
   A. public shared-office pages,
   B. desktop companion or desktop pet work,
   C. backend fake child-agent decisions,
   D. portable secret export.

## 2. Global Verification Rules

### 2.1 Package-truth discipline

For this phase, `package truth` is complete only when:

1. the portable helper identity comes from Registry,
2. a House deployment references a Registry package version exactly,
3. sharing to a friend reuses Registry identity rather than a local raw export.

### 2.2 Default-user discipline

For this phase, `default-user ready` means:

1. the default install path requires no model or workspace knowledge,
2. advanced settings are hidden by default,
3. helper cards explain what the helper does in plain language,
4. setup blockers are explained without AI jargon.

### 2.3 Runtime-truth discipline

For this phase, `runtime truth` means:

1. spawned helpers are real child runtimes,
2. their status and events are inspectable,
3. the server is not inventing completion.

### 2.4 Secret-boundary discipline

For this phase, `secret safe` means:

1. Registry payloads contain no live credentials,
2. share payloads contain no live credentials,
3. friend installs contain no copied secrets,
4. local brain binding remains local.

### 2.5 Delegation discipline

For this phase, `delegation` is complete only when:

1. a parent worker uses exposed worker tools,
2. a child worker session is actually created,
3. parent-to-child messaging is visible and stable,
4. skill and worker contract docs are updated.

## 3. Test Sequence

### T35.0 - `e2e/215_registry_worker_package_family_contract.spec.js`

- Goal: create the first real worker-package storefront contract inside Registry.
- Scope cap: Registry entity shaping plus storefront rendering only.
- Dependencies: current Registry family grouping is green.
- Small-step order:
  1. define `worker_package` Registry semantics,
  2. seed at least one worker package fixture,
  3. expose plain-language storefront fields,
  4. keep advanced runtime details hidden by default.
- Measurable metrics:
  1. `workerPackageFamilyVisible = true`,
  2. `plainLanguageStorefrontCoverage = 100%`,
  3. `defaultAdvancedFieldVisibleCount = 0`,
  4. package contract exposes exact version identity and install metadata.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
- Verification:
  1. `npx playwright test e2e/215_registry_worker_package_family_contract.spec.js`

### T35.1 - `e2e/216_registry_worker_package_install_contract.spec.js`

- Goal: turn a worker package into a House deployment.
- Scope cap: install route plus one deterministic install panel only.
- Dependencies: `T35.0`
- Small-step order:
  1. define House deployment storage,
  2. add install route,
  3. preserve exact Registry version identity,
  4. keep the default path non-technical.
- Measurable metrics:
  1. `deploymentCreateSuccessCount = 1`,
  2. `deploymentPayloadParity = exact`,
  3. `defaultInstallDecisionCount <= 2`,
  4. local brain-binding requirement is explained in plain language when applicable.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
- Verification:
  1. `npx playwright test e2e/216_registry_worker_package_install_contract.spec.js`

### T35.2 - `e2e/217_house_worker_deployments_surface.spec.js`

- Goal: make installed helpers visible and legible in House Office.
- Scope cap: one deployment read plus one House surface section.
- Dependencies: `T35.1`
- Small-step order:
  1. add deployed-helper read contract,
  2. render helper cards in House Office,
  3. show office, role, package name, and setup state,
  4. keep advanced runtime details collapsed by default.
- Measurable metrics:
  1. helper card count matches deployment payload,
  2. every helper card shows plain-language role and purpose,
  3. office placement is visible,
  4. raw model and workspace identifiers stay hidden by default.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
- Verification:
  1. `npx playwright test e2e/217_house_worker_deployments_surface.spec.js`

### T35.3 - `e2e/218_house_worker_share_to_friend_contract.spec.js`

- Goal: make a helper package portable to another user's house.
- Scope cap: share reference plus friend install path only.
- Dependencies: `T35.1`
- Small-step order:
  1. define share reference contract,
  2. ensure share reference carries exact package identity,
  3. let a second house install from that reference,
  4. keep secret transfer out of the path.
- Measurable metrics:
  1. `shareParityMismatchCount = 0`,
  2. friend install resolves the same `entityVersionId`,
  3. friend install does not require raw export files,
  4. `secretTransferCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
- Verification:
  1. `npx playwright test e2e/218_house_worker_share_to_friend_contract.spec.js`

### T35.4 - `e2e/219_house_worker_package_secret_boundary.spec.js`

- Goal: prove the package and share path is portable without leaking secrets.
- Scope cap: secret filtering and inspection only.
- Dependencies: `T35.3`
- Small-step order:
  1. define forbidden secret-bearing fields,
  2. block them from Registry package payloads,
  3. block them from share payloads,
  4. prove friend install uses safe local rebinding instead.
- Measurable metrics:
  1. `secretLeakageCount = 0`,
  2. helpers needing credentials arrive in a clear setup-needed state,
  3. no live secret is present in portable payloads,
  4. friend install still succeeds on portable identity alone.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
- Verification:
  1. `npx playwright test e2e/219_house_worker_package_secret_boundary.spec.js`

### T35.5 - `e2e/220_house_worker_default_user_guidance.spec.js`

- Goal: keep the default install and setup path understandable for non-technical users.
- Scope cap: copy, layout, and setup guidance only.
- Dependencies: `T35.2`
- Small-step order:
  1. define required plain-language fields,
  2. add helper guidance copy,
  3. keep advanced runtime settings collapsed by default,
  4. make setup blockers understandable in user language.
- Measurable metrics:
  1. `defaultInstallDecisionCount <= 2`,
  2. `defaultAdvancedFieldVisibleCount = 0`,
  3. setup-needed state explains what the user must do next,
  4. a normal user can identify what the helper does without technical docs.
- Required doc sync:
  1. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
- Verification:
  1. `npx playwright test e2e/220_house_worker_default_user_guidance.spec.js`

### T35.6 - `e2e/221_house_worker_runtime_supervisor_contract.spec.js`

- Goal: introduce a real multi-worker supervisor inside the shell.
- Scope cap: supervisor state plus child-runtime lifecycle only.
- Dependencies: `T35.2`
- Small-step order:
  1. define supervisor state model,
  2. add child worker creation path,
  3. keep the primary worker alive,
  4. expose deterministic worker-session inspection.
- Measurable metrics:
  1. `activeWorkerCount >= 2`,
  2. `workerIdentityCollisionCount = 0`,
  3. `supervisorStatusCoverage = 100%`,
  4. `shellContinuityLossCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
- Verification:
  1. `npx playwright test e2e/221_house_worker_runtime_supervisor_contract.spec.js`

### T35.7 - `e2e/222_house_worker_spawn_contract.spec.js`

- Goal: spawn a live child worker from an installed deployment.
- Scope cap: spawn API plus one status rendering path only.
- Dependencies: `T35.6`
- Small-step order:
  1. define spawn request contract,
  2. create child worker session from a deployment,
  3. persist spawn metadata,
  4. expose visible child status.
- Measurable metrics:
  1. `spawnSuccessCount >= 1`,
  2. child spawn is linked to a deployment id,
  3. child worker status becomes visible,
  4. `backendShortcutFindingCount = 0`.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
- Verification:
  1. `npx playwright test e2e/222_house_worker_spawn_contract.spec.js`

### T35.8 - `e2e/223_house_worker_spawn_profile_contract.spec.js`

- Goal: support explicit brain, workspace, and config or loadout choices for child workers.
- Scope cap: runtime profile modeling only.
- Dependencies: `T35.7`
- Small-step order:
  1. define runtime profile schema,
  2. add default inherited-profile path,
  3. add advanced overrides,
  4. persist and expose exact chosen values.
- Measurable metrics:
  1. `spawnProfilePersistence = exact`,
  2. `advancedOverrideRoundTripCount = 1`,
  3. `defaultSpawnAdvancedDecisionCount = 0`,
  4. child runtime displays the chosen profile in a deterministic inspector.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
- Verification:
  1. `npx playwright test e2e/223_house_worker_spawn_profile_contract.spec.js`

### T35.9 - `e2e/224_parent_worker_delegation_tool_contract.spec.js`

- Goal: let one worker spawn and delegate to another worker using real worker tools.
- Scope cap: worker-tool surface plus one delegation path only.
- Dependencies: `T35.8`
- Small-step order:
  1. add worker helper tools,
  2. expose them in the runtime tool surface,
  3. update skill and contract docs,
  4. prove one parent-driven spawn plus task delegation path.
- Measurable metrics:
  1. `workerSpawnToolVisible = true`,
  2. `workerStatusToolVisible = true`,
  3. `workerMessageToolVisible = true`,
  4. `delegationAcceptedCount >= 1`,
  5. `backendShortcutFindingCount = 0`.
- Required doc sync:
  1. [public/skill.md](../public/skill.md)
  2. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)
  3. [specs/02_api_contract.md](./02_api_contract.md)
- Verification:
  1. `npx playwright test e2e/224_parent_worker_delegation_tool_contract.spec.js`

### T35.10 - `e2e/225_house_worker_status_and_message_contract.spec.js`

- Goal: make helper status and messaging understandable and targetable by users.
- Scope cap: helper status list plus message targeting only.
- Dependencies: `T35.9`
- Small-step order:
  1. render per-helper status list,
  2. allow targeting one helper,
  3. persist and display message events,
  4. keep copy non-technical.
- Measurable metrics:
  1. `messageRoundTripCount >= 1`,
  2. every active helper shows status and deployment label,
  3. the targeted helper receives the message deterministically,
  4. visible state matches persisted event history.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
- Verification:
  1. `npx playwright test e2e/225_house_worker_status_and_message_contract.spec.js`

### T35.11 - `e2e/226_house_worker_spawn_guardrails.spec.js`

- Goal: block unsafe or runaway spawn behavior before it becomes product debt.
- Scope cap: guardrail enforcement only.
- Dependencies: `T35.8`
- Small-step order:
  1. define concurrency limit and scope rules,
  2. reject foreign or unsupported deployment references,
  3. reject unsupported override payloads,
  4. reject runaway spawn attempts.
- Measurable metrics:
  1. `foreignDeploymentSpawnAcceptCount = 0`,
  2. `unsupportedOverrideAcceptCount = 0`,
  3. `overConcurrencyAcceptCount = 0`,
  4. `runawaySpawnAcceptCount = 0`,
  5. stable error codes are returned and no partial session rows survive.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
- Verification:
  1. `npx playwright test e2e/226_house_worker_spawn_guardrails.spec.js`

### T35.12 - `e2e/227_house_worker_replay_determinism.spec.js`

- Goal: prove install plus spawn replay is deterministic for the same seed.
- Scope cap: replay checkpoints and inspector ordering only.
- Dependencies: `T35.11`
- Small-step order:
  1. define deterministic checkpoint list,
  2. replay the same install plus spawn path,
  3. compare ordered checkpoints and worker events exactly.
- Measurable metrics:
  1. `replayCheckpointMismatchCount = 0`,
  2. `packageInstallReplayMismatchCount = 0`,
  3. `stableOrderedWorkerEventCount >= 1`.
- Required doc sync:
  1. [specs/35_house_worker_packages_and_spawn_tdd_spec.md](./35_house_worker_packages_and_spawn_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/227_house_worker_replay_determinism.spec.js`

### T35.13 - `e2e/228_house_worker_package_spawn_unified_smoke.spec.js`

- Goal: prove the whole package-to-deployment-to-share-to-spawn journey works as one coherent user flow.
- Scope cap: smoke orchestration only.
- Dependencies: `T35.12`
- Small-step order:
  1. browse worker package,
  2. install into one house,
  3. share to friend house,
  4. install there,
  5. spawn helper,
  6. optionally use advanced profile override,
  7. delegate one task,
  8. replay and compare checkpoints exactly.
- Measurable metrics:
  1. all earlier metrics stay green in one composed flow,
  2. `replayCheckpointMismatchCount = 0`,
  3. `secretLeakageCount = 0`,
  4. `shellContinuityLossCount = 0`.
- Required doc sync:
  1. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
  2. [specs/35_house_worker_packages_and_spawn_tdd_spec.md](./35_house_worker_packages_and_spawn_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/228_house_worker_package_spawn_unified_smoke.spec.js`

## 4. Recommended Verification Ladder

After each milestone:

1. run the named Playwright file,
2. run immediately adjacent new worker-package tests,
3. run House Office adjacency tests that could regress:
   A. `e2e/195` through `e2e/214`,
4. run `npm run build:openclaw-lite` before verification if runtime vendor code changed,
5. run `npm test` before merging milestones that affect:
   A. worker continuity,
   B. skill contract,
   C. runtime supervisor state,
   D. guardrails.

## 5. Completion Rule

This runbook is complete only when:

1. `T35.0` through `T35.13` are implemented,
2. tests `215` through `228` are green,
3. skill and API contract docs are synced,
4. House Office baseline remains green,
5. the full deterministic suite remains green.
