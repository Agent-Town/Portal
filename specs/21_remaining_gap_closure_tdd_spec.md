# Phase 20 Spec: Remaining Gap Closure (Contracts First, TDD)

Status: Draft
Version: 1.0
Audience: runtime engineers, backend engineers, frontend engineers, security engineers, QA automation engineers, DevOps engineers, AI agent implementers
Depends on: [specs/02_api_contract.md](./02_api_contract.md), [specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md](./19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md), [specs/20_unified_house_trace_trainer_platform_tdd_spec.md](./20_unified_house_trace_trainer_platform_tdd_spec.md), [AGENTS.md](../AGENTS.md)
Goal: close the remaining correctness, completeness, live-validation, and maintainability gaps after the unified platform landing without breaking the current passing behavior.

Implementation constraints:

1. Keep worker-first architecture. Agent planning and next-step selection remain in the browser worker.
2. Keep modal-first continuity for Trainer, Atlas, Registry, Pony, House Archive, and House Trainer.
3. Keep `trainer.*` reserved for runtime tools and `trainer_job.*` reserved for durable trainer jobs.
4. Do not reintroduce hidden team defaults such as hardcoded `team_main` in UI requests.
5. Do not require live secrets or live third-party services for the default `npm test` gate.
6. Live suites must remain explicit opt-in lanes, but their setup, skip behavior, and failure behavior must be deterministic.
7. Do not expand the product surface with new major experiences. This phase closes gaps in the surfaces already added.
8. Structural refactors are allowed only after the behavioral contract is locked by tests.
9. Durable-store tooling may be test-mode or admin-only first, but it must still be measurable and repeatable.
10. A milestone is not complete until its docs, commands, and tests are updated together.

## 1. Executive summary

This phase closes five concrete gaps left after the Phase 19 landing:

1. multi-team correctness in House Archive and House Trainer,
2. durable trainer operations from the UI,
3. explicit live-suite governance and automated email-OTP validation,
4. route ownership and server maintainability,
5. durable export/import verification for the new platform state.

Implementation order:

1. gap harness and observability,
2. active team context,
3. team switching in House Console,
4. durable trainer job creation,
5. durable patch promotion,
6. live-suite manifest and OTP adapter,
7. optional real email-OTP live smoke,
8. route modularization,
9. export/import roundtrip verification.

This phase must not become a broad rewrite.
Every milestone must be reviewable, revertible, and independently green.

Reserved Playwright block for this phase:

1. `156` to `165`

Reserved Playwright files:

1. `e2e/156_gap_closure_harness.spec.js`
2. `e2e/157_house_team_context_contract.spec.js`
3. `e2e/158_house_team_switch_surface.spec.js`
4. `e2e/159_house_trainer_job_submit.spec.js`
5. `e2e/160_house_trainer_patch_promote.spec.js`
6. `e2e/161_live_suite_manifest_contract.spec.js`
7. `e2e/162_privy_email_otp_adapter.spec.js`
8. `e2e/163_privy_live_email_wallet.spec.js`
9. `e2e/164_route_module_manifest.spec.js`
10. `e2e/165_unified_platform_export_import_roundtrip.spec.js`

Supplemental non-Playwright verification lanes allowed in this phase:

1. `npm run verify:route-modules`
2. `npm run verify:platform-export`
3. `npm run test:live`

## 2. Global measurable metrics

Every milestone must publish measurable proof using the metric classes below.

### 2.1 Team context metrics

Required for any route or UI surface that filters by House/team:

1. `activeTeamId` is non-empty and explicit in the resolved platform context.
2. Omitting `teamId` from a House-private read route resolves to the current team context, not a hidden string literal default.
3. Switching teams changes seeded Archive or Trainer rows exactly as expected.
4. Worker session id remains unchanged across team switching.
5. The request log for the production UI path contains no literal `team_main` unless the selected active team is actually `team_main`.

### 2.2 Durable trainer operation metrics

Required for House Trainer write paths:

1. Creating one compare job increments `trainer_jobs` by exactly `1`.
2. Replaying the same idempotent job request does not create a second durable job row.
3. Patch promotion increments `config_versions` by exactly `1`.
4. Patch promotion changes only the active binding and does not mutate older config rows.
5. Local trainer cache deletion leaves durable job/result rows unchanged.

### 2.3 Live suite governance metrics

Required for live-only test lanes:

1. A machine-readable live-suite manifest lists every live suite, its command, required env vars, and default skip policy.
2. Default `npm test` skips live suites deterministically rather than failing or silently omitting them.
3. Explicit `*_REQUIRED=1` or equivalent fails fast with one clear setup message when env is missing.
4. A live suite with all required env set does not rely on hidden manual steps.

### 2.4 OTP metrics

Required for automated email-code coverage:

1. The test harness can fetch exactly one valid OTP for the requested email address.
2. OTP fetch uses a provider-neutral adapter contract.
3. Reusing the same OTP after successful login fails deterministically.
4. Successful OTP login reaches `/app` and both wallet chains are available.

### 2.5 Structural modularization metrics

Required for route splitting and maintainability work:

1. Route ownership is exported as a deterministic manifest in test mode.
2. Web, Registry, Poker, Platform, and `/v1/*` route families are each owned by a module outside `server/index.js`.
3. `server/index.js` no longer directly registers those moved route families.
4. The route manifest stays stable between repeated boots of the same code.

### 2.6 Export/import metrics

Required for durable-store tooling:

1. Export row counts match live row counts at export time.
2. Importing the export into an empty store reproduces the same row counts.
3. Integrity hashes and ids remain stable where the contract says they are immutable.
4. Verification mode reports exact mismatches by table and id rather than a generic failure.

## 3. Test harness rules

1. Default `npm test` must remain deterministic and offline-safe.
2. Live suites must be discoverable through a manifest or command that exposes required env and skip policy.
3. Any live suite must have a local deterministic twin where that is technically possible.
4. Multi-team tests must use seeded data for at least two teams with different Archive and Trainer rows.
5. Team switching tests must assert worker continuity and modal continuity together.
6. Structural refactors must be validated by behavior tests first, then by a route-manifest test.
7. Export/import tests may use test-only admin helpers, but the stored objects under test must be the real durable rows.
8. If a milestone adds a command, the command must be documented in `README.md` and fail clearly when misconfigured.

## 4. Required fixtures and observability

### 4.1 Fixture families

This phase requires at least the following seeded fixture families:

1. `multi_team_archive_seed`
2. `multi_team_trainer_seed`
3. `privy_email_otp_stub_seed`
4. `live_suite_manifest_expected`
5. `route_module_manifest_expected`
6. `platform_export_roundtrip_seed`

### 4.2 Test-mode observability

At least one deterministic mechanism must exist to inspect:

1. current `activeTeamId`,
2. current worker session id,
3. House Archive row counts by team,
4. House Trainer durable job/result row counts by team,
5. route ownership manifest,
6. live-suite manifest,
7. OTP adapter activity for deterministic local tests,
8. export/import stats and verification mismatches.

Equivalent test-only mechanisms are allowed.

## 5. Milestone map

Milestones must be implemented in order.
Do not mix structural refactor work with earlier contract work.

### M20.0 - Gap harness and fixture alignment

Purpose:

1. reserve the Phase 20 block,
2. add multi-team, OTP-stub, manifest, and export/import fixtures,
3. add the observability needed for the later metrics.

Primary test:

1. `e2e/156_gap_closure_harness.spec.js`

RED gate:

1. There is no deterministic way to inspect active team context.
2. There is no route-manifest or live-suite-manifest source of truth.
3. Export/import verification has no seeded baseline.

GREEN gate:

1. All required fixture families load deterministically.
2. Active team, worker continuity, and route ownership are inspectable in test mode.
3. Live-suite manifest is present even before live suites are expanded.

Measurable metrics:

1. After `__test__/reset`, all new Phase 20 helper counts are exactly `0`.
2. Fixture loader returns non-empty data for all six required families.
3. Route manifest contains at least `web`, `registry`, `poker`, `platform`, and `v1`.
4. Live-suite manifest contains at least `privy-guest` and `sepolia-wallet`.

Required doc sync:

1. `specs/21_remaining_gap_closure_tdd_spec.md`

### M20.1 - Active team context contract

Purpose:

1. remove hidden `team_main` defaults from the House-private read path,
2. make active team resolution explicit and testable,
3. preserve current contracts while correcting the remaining multi-team gap.

Primary test:

1. `e2e/157_house_team_context_contract.spec.js`

RED gate:

1. House Archive or House Trainer reads still require the UI to inject a hardcoded team id.
2. Omitting `teamId` resolves to a hidden string constant instead of session/team context.
3. Different seeded teams cannot be distinguished through the same House surface.

GREEN gate:

1. Active team context is explicit in a route or state payload.
2. House-private read routes resolve to the active team when `teamId` is omitted.
3. Two seeded teams return different Archive and Trainer rows through the same House.

Measurable metrics:

1. `activeTeamId` is non-empty and stable across one reload.
2. `/api/platform/archive` without `teamId` returns `teamId == activeTeamId`.
3. `/api/platform/trainer` without `teamId` returns `teamId == activeTeamId`.
4. Seeded team A and team B return different `traceId` or `trainerJobId` sets.
5. A network trace of the production UI fetch path contains no literal `team_main` unless that is the active team.

Required doc sync:

1. `specs/02_api_contract.md`
2. `specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md`

### M20.2 - House team switch surface

Purpose:

1. add a minimal House Console team selector,
2. let the human switch between available team contexts,
3. preserve worker continuity and modal continuity while switching.

Primary test:

1. `e2e/158_house_team_switch_surface.spec.js`

RED gate:

1. House Console exposes no way to switch teams.
2. Switching teams reloads the page or restarts the worker.
3. Archive and Trainer panes stay stuck on the original team.

GREEN gate:

1. House Console shows a minimal team selector with deterministic options.
2. Switching teams updates both Archive and Trainer reads.
3. Worker session id and shell path remain unchanged.

Measurable metrics:

1. Selector shows exactly the seeded team ids in stable order.
2. Switching from team A to team B changes the visible Archive list within the documented polling window.
3. Switching from team A to team B changes the visible Trainer list within the documented polling window.
4. Worker session id before and after the switch is identical.
5. Current path remains the House/hub path with no full-page navigation.

Required doc sync:

1. `specs/02_api_contract.md`

### M20.3 - Durable trainer compare job submit from House UI

Purpose:

1. move House Trainer beyond read-only status,
2. allow the human to create one durable compare job from the House surface,
3. bind that job to the active House/team context.

Primary test:

1. `e2e/159_house_trainer_job_submit.spec.js`

RED gate:

1. House Trainer cannot create a durable job.
2. Clicking submit only mutates local trainer cache.
3. Repeating the same request creates duplicate durable jobs.

GREEN gate:

1. House Trainer can create one compare job through the production UI path.
2. The durable job is visible in the House Trainer list.
3. Idempotent replay returns the original job.

Measurable metrics:

1. `trainer_jobs` count increases by exactly `1`.
2. Created job has `jobKind == "trainer_job.compare"`.
3. Job `houseId` and `teamId` match the active House/team context.
4. Replaying the same idempotency key leaves `trainer_jobs` count unchanged.
5. Clearing local trainer traces does not change durable `trainer_jobs` or `trainer_results` counts.

Required doc sync:

1. `specs/02_api_contract.md`
2. `specs/20_unified_house_trace_trainer_platform_tdd_spec.md`

### M20.4 - Durable patch promotion from House Trainer UI

Purpose:

1. let the human approve and promote a durable trainer result from the House surface,
2. connect House Trainer to the existing config lineage contract,
3. keep approval and promotion deterministic.

Primary test:

1. `e2e/160_house_trainer_patch_promote.spec.js`

RED gate:

1. House Trainer cannot promote a durable result.
2. Promotion bypasses approval.
3. Promotion mutates the prior config row rather than creating a new one.

GREEN gate:

1. House Trainer exposes a minimal promote action for eligible durable results.
2. Missing approval yields a stable `APPROVAL_REQUIRED`.
3. Approved promotion creates one new config version and updates the active binding only.

Measurable metrics:

1. Promotion attempt without approval returns `APPROVAL_REQUIRED`.
2. Approved promotion increments `config_versions` by exactly `1`.
3. Approved promotion updates active binding to the new `configVersionId`.
4. Previous `configHash` remains unchanged after promotion.
5. House Trainer detail panel shows the new linked config id and candidate patch id.

Required doc sync:

1. `specs/02_api_contract.md`
2. `specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md`

### M20.5 - Live suite manifest and command contract

Purpose:

1. make live-suite coverage explicit and discoverable,
2. avoid hidden tribal knowledge around env setup,
3. keep live validation separate from the default deterministic gate.

Primary test:

1. `e2e/161_live_suite_manifest_contract.spec.js`

RED gate:

1. Live suites exist only as undocumented ad hoc commands.
2. Missing env causes opaque failures instead of clear setup messages.
3. There is no one-command way to list live suites and their required env.

GREEN gate:

1. A manifest lists each live suite, command, required env, and skip behavior.
2. A single command exposes the manifest deterministically.
3. Missing env fails clearly only when the live suite is explicitly required.

Measurable metrics:

1. Manifest contains entries for at least `privy-guest`, `privy-email-otp`, and `sepolia-wallet`.
2. Each manifest entry contains non-empty `suiteId`, `command`, `requiredEnv`, and `defaultMode`.
3. Default `npm test` shows the live suites as skipped rather than failed.
4. Explicit `PRIVY_LIVE_REQUIRED=1` or equivalent missing-env run fails with one stable message.

Required doc sync:

1. `README.md`
2. `.env.example`

### M20.6 - Deterministic email OTP adapter contract

Purpose:

1. add a provider-neutral OTP inbox adapter,
2. cover the real email-code login path locally without manual input,
3. keep the local deterministic test independent of any live mailbox vendor.

Primary test:

1. `e2e/162_privy_email_otp_adapter.spec.js`

RED gate:

1. Email OTP still requires manual user input.
2. OTP retrieval is tied to one vendor-specific implementation.
3. OTP codes can be replayed after successful use.

GREEN gate:

1. The deterministic test path can request, retrieve, and submit one OTP automatically.
2. The adapter contract is provider-neutral.
3. One-time code replay is rejected deterministically.

Measurable metrics:

1. OTP adapter records exactly one code issuance for the requested test email.
2. The code is retrievable within the documented timeout.
3. Login reaches `/app` without manual input.
4. Both Solana and EVM wallet connections succeed after login.
5. Reusing the consumed OTP fails with a stable code or message.

Required doc sync:

1. `README.md`
2. `.env.example`
3. `specs/02_api_contract.md`

### M20.7 - Optional real Privy email-OTP live smoke

Purpose:

1. verify the production-like email-code login path against a real Privy app,
2. keep the lane optional and explicit,
3. prove that guest-only validation is no longer the only live Privy signal.

Primary test:

1. `e2e/163_privy_live_email_wallet.spec.js`

RED gate:

1. Real email OTP still requires manual intervention.
2. Live email login does not expose both wallet chains.
3. Missing env produces a vague failure.

GREEN gate:

1. A configured live email-OTP suite can run without manual input.
2. Successful live email login reaches `/app`.
3. Real wallet availability and second `/start` re-entry are verified.

Measurable metrics:

1. The suite is skipped by default unless its env contract is satisfied.
2. With all required env present, OTP arrives within the configured timeout window.
3. Successful login exposes a valid Solana address and valid EVM address.
4. Visiting `/start` again re-enters `/app` without another OTP prompt.

Required doc sync:

1. `README.md`
2. `.env.example`

### M20.8 - Route modularization contract

Purpose:

1. split the expanded backend route surface into owner modules,
2. make route ownership explicit,
3. reduce future change risk in `server/index.js`.

Primary test:

1. `e2e/164_route_module_manifest.spec.js`

Supplemental verification:

1. `npm run verify:route-modules`

RED gate:

1. `server/index.js` still directly registers Web, Registry, Poker, Platform, or `/v1/*` families.
2. There is no route-owner manifest.
3. Refactor changes route behavior or envelope structure.

GREEN gate:

1. Route families are registered by dedicated modules.
2. Route-owner manifest is exposed deterministically in test mode.
3. Existing behavior tests remain green after the split.

Measurable metrics:

1. Route manifest lists an owner module for `web`, `registry`, `poker`, `platform`, and `v1`.
2. No manifest owner for those families is `server/index.js`.
3. `npm run verify:route-modules` returns success only when direct registrations are absent from `server/index.js`.
4. Repeated boots produce the same manifest for unchanged code.

Required doc sync:

1. `README.md`

### M20.9 - Unified platform export/import roundtrip

Purpose:

1. add deterministic export/import verification for the new durable platform state,
2. close the operational gap around backfill, recovery, and verification,
3. prove the new tables can survive reset and replay without silent drift.

Primary test:

1. `e2e/165_unified_platform_export_import_roundtrip.spec.js`

Supplemental verification:

1. `npm run verify:platform-export`

RED gate:

1. There is no deterministic export format for the new durable rows.
2. Importing into an empty store changes ids or counts unexpectedly.
3. Verification reports only generic failure instead of exact mismatches.

GREEN gate:

1. Export format is deterministic and documented.
2. Import into an empty store reproduces counts and immutable ids.
3. Verification mode reports exact mismatches by table and id.

Measurable metrics:

1. Export payload includes counts for `runs`, `trace_events`, `config_versions`, `trainer_jobs`, `trainer_results`, `sealed_contexts`, and poker mirror tables.
2. Reset plus import reproduces the same counts exactly.
3. Immutable ids and hashes match the exported values exactly.
4. A deliberately corrupted import produces a deterministic mismatch report naming the first failing table and id.

Required doc sync:

1. `README.md`
2. `specs/02_api_contract.md`

## 6. Final release gate

This phase is complete only when all of the following are true:

1. `npm test` passes.
2. `e2e/156` to `e2e/165` are present and passing in the default or documented live lane as specified.
3. `npm run test:live -- --list` or equivalent lists the live suites and env requirements deterministically.
4. `npm run verify:route-modules` passes.
5. `npm run verify:platform-export` passes.
6. The House Console no longer depends on a hardcoded `team_main` query for Archive or Trainer reads.
7. House Trainer can create a durable compare job and promote an approved patch through the UI.
8. There is one deterministic local email-OTP path and one optional real live email-OTP path.

## 7. Explicit non-goals

This phase does not:

1. add new experiences beyond the already-landed Portal, Registry, Poker, Archive, and Trainer surfaces,
2. make real live integrations mandatory for the default offline gate,
3. replace the current SQLite-backed persistence with a different database,
4. redesign the minimal Agent Town product into a larger navigation system.
