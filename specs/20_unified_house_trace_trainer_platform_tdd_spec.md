# Phase 19 Spec: Unified House + Canonical Trace + Trainer Platform (Contracts First, TDD)

Status: Draft
Version: 1.0
Audience: runtime engineers, backend engineers, frontend engineers, security engineers, QA automation engineers, AI agent implementers
Depends on: [specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md](/Users/robin/Projects/Portal/specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md), [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md), [specs/14_trainer_namespace_tdd_spec.md](/Users/robin/Projects/Portal/specs/14_trainer_namespace_tdd_spec.md), [AGENTS.md](/Users/robin/Projects/Portal/AGENTS.md)
Goal: let AI agent developers implement the revised unified House + trace + trainer platform in small, deterministic steps where every milestone is backed by measurable tests and exact pass criteria.

Implementation constraints:

1. Keep worker-first architecture. Agent planning and next-step selection remain in the browser worker.
2. Keep `trainer.*` reserved for runtime tools. Durable jobs must use `trainer_job.*`.
3. Keep `public/skill.md` reachable and externally compatible while adding the internal pack compiler.
4. Keep Atlas modal-first and make Trainer modal-first from the town hub.
5. Do not break current `/api/*` behavior while introducing `/v1/*`.
6. Do not add untestable behavior. Every route, status transition, and UI continuity rule must have deterministic assertions.
7. Prefer Portal-side implementation first. Do not modify vendor runtime sources unless the milestone explicitly requires it and no Portal-side integration path exists.
8. No live upstream dependencies in automated tests. Use seeded fixtures and test doubles for operator and integration behavior.
9. Each milestone must be small enough to review and revert independently.
10. A milestone is not complete until its listed docs and tests are updated together.

## 1. Executive summary

Implementation order for this program is:

1. compatibility hardening,
2. canonical archive core,
3. config immutability,
4. integration resolution and execution records,
5. durable trainer jobs and results,
6. sealed contexts and poker ingest,
7. minimal House read surfaces,
8. full-cycle smoke.

This spec intentionally does not allow a "platform rewrite" milestone.
Every step must leave the repo in a passing, explainable state.

Reserved Playwright block for this program:

1. `131` to `150`

Reserved test files:

1. `e2e/131_unified_platform_harness.spec.js`
2. `e2e/132_trainer_modal_continuity_redirect.spec.js`
3. `e2e/133_default_skill_pack_compile_bridge.spec.js`
4. `e2e/134_v1_run_creation_contract.spec.js`
5. `e2e/135_v1_trace_ingestion_accept_dedupe.spec.js`
6. `e2e/136_v1_trace_late_arrival_policy.spec.js`
7. `e2e/137_v1_trace_archive_read.spec.js`
8. `e2e/138_local_trace_cache_boundary.spec.js`
9. `e2e/139_config_component_version_pinning.spec.js`
10. `e2e/140_config_promotion_lineage.spec.js`
11. `e2e/141_integration_resolve_contract.spec.js`
12. `e2e/142_integration_compilation_contract.spec.js`
13. `e2e/143_integration_execution_approval_gate.spec.js`
14. `e2e/144_trainer_job_contract.spec.js`
15. `e2e/145_trainer_result_patch_promotion.spec.js`
16. `e2e/146_sealed_context_contract.spec.js`
17. `e2e/147_poker_operator_canonical_ingest.spec.js`
18. `e2e/148_house_archive_minimal_view.spec.js`
19. `e2e/149_house_trainer_minimal_view.spec.js`
20. `e2e/150_unified_platform_full_cycle_smoke.spec.js`

## 2. Global measurable metrics

Every milestone must publish measurable proof using the metric classes below.

### 2.1 Contract metrics

Required for every new `/v1/*` route:

1. Success envelope contains exactly `ok`, `data`, `requestId`, `version`.
2. Error envelope contains exactly `ok`, `error`, `requestId`, `version`.
3. `requestId` is present and non-empty.
4. `version == "v1"`.
5. Negative-path `error.code` exactly matches the documented stable code.

### 2.2 Identity and auth metrics

Required for any flow that touches session continuity or protected routes:

1. `teamCode` remains stable across allowed recovery paths.
2. `houseId` remains stable across allowed recovery paths.
3. House-private `/v1/*` routes reject missing `x-house-ts` or `x-house-auth` with `HOUSE_AUTH_REQUIRED`.
4. Expired or invalid house-auth fails with `HOUSE_AUTH_EXPIRED` or `HOUSE_AUTH_INVALID`, never a generic `500`.

### 2.3 Modal continuity metrics

Required for `/trainer`, House archive, and House trainer surfaces:

1. Current shell path remains the hub path during modal open/close flows.
2. Active worker session id remains unchanged across modal open/close.
3. Direct route hits resolve to the documented modal-preserving deep link when the hub shell is available.
4. No full-page reload occurs during modal open/close assertions.

### 2.4 Pack compilation metrics

Required for the internal pack bridge:

1. A compiled pack exposes non-empty `packVersionId` and `contentHash`.
2. `fileHashes` contains exactly the required keys for that milestone.
3. `sourceRefs` include `/skill.md` for the default Portal skill bridge.
4. Recompiling the same unchanged source under the same idempotency key returns the same `packVersionId`.

### 2.5 Trace metrics

Required for canonical trace work:

1. `trace_intake_records` row count changes by the expected amount.
2. `trace_events` row count changes by the expected amount.
3. `seq` is strictly monotonic by `1` within a trace.
4. `prevEventHash` on event `n` equals `eventHash` on event `n - 1`.
5. Duplicate `ingestKey` records do not create additional canonical events.
6. Completed traces reject historical fact changes with `TRACE_LATE_EVENT_REJECTED`.
7. Post-run annotations append without mutating earlier rows.

### 2.6 Config metrics

Required for config version work:

1. Publish attempts using mutable refs fail with `CONFIG_COMPONENT_MUTABLE_REF`.
2. Accepted config versions store immutable component version ids.
3. Accepted config versions store deterministic component hashes.
4. Any meaningful config change creates a new `configHash`.
5. Promoting a prior version for rollback does not mutate historical config rows.

### 2.7 Execution and approval metrics

Required for integration execution and patch promotion:

1. Requests missing `actionId` fail instead of being silently defaulted server-side.
2. Write-capable actions fail with `APPROVAL_REQUIRED` without approval.
3. Approved requests create exactly one durable execution or promotion record.
4. Idempotent replay does not create a second durable row.

### 2.8 Archive boundary metrics

Required for local cache vs canonical archive separation:

1. Clearing local trainer traces reduces only local cache counts.
2. Canonical archive row counts remain unchanged.
3. Canonical trace read endpoints still return the same trace after local cache deletion.
4. UI copy distinguishes "local cache" from "archive".

### 2.9 UI read-surface metrics

Required for minimal House Archive and House Trainer views:

1. Surface opens without breaking worker continuity.
2. Table/list data matches seeded archive/job fixtures exactly.
3. Filters are deterministic.
4. Empty states and error states are deterministic and testable.

## 3. Test harness rules

1. Every milestone must have at least one Playwright spec in the reserved block.
2. Use seeded fixtures only. No live Parse calls, no live operator services, no live website dependencies.
3. Negative tests are mandatory for auth, idempotency, invalid parameters, stale revision conflicts, and missing approvals.
4. A test may use test-only helpers, but the product behavior under test must remain the production path.
5. Do not require sleeps longer than deterministic polling windows already used by the repo. Prefer explicit status polling.
6. If a metric depends on durable storage, expose it through one of:
   - SQLite inspection in test mode,
   - a test-only stats helper,
   - or a fixture comparison helper.
7. Test-only helpers must never expose secrets, raw auth material, or unredacted private payloads.

## 4. Required fixtures and test-only observability

The implementation may choose exact filenames, but the following seeded fixture families are required.

### 4.1 Fixture families

1. `portal_default_skill_manual`
2. `portal_default_compiled_pack_expected`
3. `trace_web_run_seed`
4. `trace_web_run_expected_archive`
5. `trainer_compare_seed`
6. `sealed_context_seed`
7. `poker_operator_seed_jsonl`
8. `poker_operator_expected_canonical_trace`

### 4.2 Test-only observability capabilities

At least one deterministic way must exist in test mode to verify:

1. row counts for `runs`, `trace_intake_records`, `trace_events`, `trace_artifacts`, `config_versions`, `config_component_versions`, `integration_pack_versions`, `integration_executions`, `trainer_jobs`, `trainer_results`, `sealed_contexts`, `approvals`,
2. the active worker session id,
3. the compiled default pack manifest and file hashes,
4. canonical event sequences and integrity hashes for a trace,
5. the currently active config version for a House/team,
6. whether a trainer delete action affected only local cache or also affected canonical rows.

Equivalent mechanisms are allowed.

## 5. Milestone map

Milestones must be implemented in order.
Do not start GREEN work on a milestone until the immediately prior milestone is passing.

### M19.0 - Harness and reserved-block alignment

Purpose:

1. reserve the test block,
2. add required seeded fixtures,
3. add test-only observability helpers needed for later metrics.

Primary test:

1. `e2e/131_unified_platform_harness.spec.js`

RED gate:

1. Reserved tests are undocumented or missing.
2. Fixture loading is not deterministic.
3. There is no reliable way to inspect counts or worker continuity in test mode.

GREEN gate:

1. Fixture families load deterministically.
2. Test-mode stats helper or equivalent is present.
3. Worker continuity helper is present.

Measurable metrics:

1. After `__test__/reset`, all new platform table counts are exactly `0`.
2. Fixture loader returns non-empty data for all required fixture families.
3. Worker continuity helper returns one stable non-empty worker session id after initial boot.

Required doc sync:

1. [specs/20_unified_house_trace_trainer_platform_tdd_spec.md](/Users/robin/Projects/Portal/specs/20_unified_house_trace_trainer_platform_tdd_spec.md)

### M19.1 - Trainer modal continuity and direct-route redirect

Purpose:

1. make Trainer modal-first from the town hub,
2. preserve worker continuity during trainer open/close,
3. redirect direct `/trainer` hits into the documented modal entry path when hub continuity is available.

Primary test:

1. `e2e/132_trainer_modal_continuity_redirect.spec.js`

RED gate:

1. Opening Trainer from the hub leaves the page.
2. Direct `/trainer` renders a standalone full page under normal hub availability.
3. Worker runtime restarts across open/close.

GREEN gate:

1. Trainer opens as a modal from the hub.
2. Direct `/trainer` resolves to `/?modal=trainer` or an equivalent documented modal-preserving route.
3. Worker continuity is preserved.

Measurable metrics:

1. Before and after opening Trainer, the active worker session id is identical.
2. Opening Trainer from the hub does not change the current hub path.
3. `GET /trainer` returns a redirect to the documented modal-preserving target when hub continuity is available.
4. Closing Trainer returns to the same hub state without a page reload.

Required doc sync:

1. [specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md](/Users/robin/Projects/Portal/specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md)

### M19.2 - Default skill to internal pack bridge

Purpose:

1. preserve `public/skill.md`,
2. compile the same-origin default skill into an internal pack before execution,
3. expose compiled-pack metadata in test mode.

Primary test:

1. `e2e/133_default_skill_pack_compile_bridge.spec.js`

RED gate:

1. Worker executes directly from raw `/skill.md` without a compiled pack.
2. Compiled pack manifest is missing required file hashes.
3. Public skill contract regresses.

GREEN gate:

1. Same-origin default skill is compiled into an internal pack before `experienceRun`.
2. Manifest contains required fields and hashes.
3. `public/skill.md` remains contract-compatible.

Measurable metrics:

1. Compiled pack manifest contains non-empty `packVersionId`, `contentHash`, and `sourceRefs[0].path == "/skill.md"`.
2. `fileHashes` contains exactly `manual/skill.md`, `heartbeat.md`, `tools.md`, and `trace_map.json` for the default bridge.
3. Recompiling unchanged skill content with the same idempotency key returns the same `packVersionId`.
4. Existing `e2e/55_phase3_skill_contract_line.spec.js` still passes.

Required doc sync:

1. [public/skill.md](/Users/robin/Projects/Portal/public/skill.md)
2. [e2e/55_phase3_skill_contract_line.spec.js](/Users/robin/Projects/Portal/e2e/55_phase3_skill_contract_line.spec.js)
3. `docs/internal-skill-testline.md`

### M19.3 - Run creation contract

Purpose:

1. introduce `POST /v1/experiences/:experienceId/runs`,
2. persist one durable run row,
3. bind the run to one declared trace authority,
4. enforce House auth and idempotency.

Primary test:

1. `e2e/134_v1_run_creation_contract.spec.js`

RED gate:

1. Run creation is not durable.
2. Idempotent replay creates duplicate rows.
3. Protected route accepts missing House auth.

GREEN gate:

1. Valid request creates exactly one durable run row.
2. Replay under the same idempotency key returns the same `runId`.
3. Response includes `traceAuthorityType`.

Measurable metrics:

1. `runs` row count increases by exactly `1` after the first valid request.
2. Replaying the same request with the same `Idempotency-Key` does not increase `runs` row count.
3. Success response contains non-empty `runId`, `status`, and `traceAuthorityType`.
4. Missing or invalid House auth returns `HOUSE_AUTH_REQUIRED` or `HOUSE_AUTH_INVALID`.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M19.4 - Trace ingestion accept and dedupe

Purpose:

1. introduce `POST /v1/traces/ingestions`,
2. persist raw intake records,
3. emit canonical events through the run authority,
4. ignore duplicate `ingestKey` values.

Primary test:

1. `e2e/135_v1_trace_ingestion_accept_dedupe.spec.js`

RED gate:

1. Duplicate intake creates duplicate canonical events.
2. Ingestion response does not report accepted/ignored/rejected counts.
3. Canonical `seq` ordering is not deterministic.

GREEN gate:

1. First intake creates one intake row and one canonical event.
2. Duplicate replay is ignored without creating a second canonical event.
3. Canonical event `seq` starts at `1` and increments deterministically.

Measurable metrics:

1. First request returns `accepted == 1`, `ignored == 0`, `rejected == 0`.
2. Replay with the same `ingestKey` returns `accepted == 0`, `ignored == 1`, `rejected == 0`.
3. `trace_intake_records` row count increases by exactly `1` across both requests.
4. `trace_events` row count increases by exactly `1` across both requests.
5. First canonical event has `seq == 1`.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M19.5 - Trace completion and late-arrival policy

Purpose:

1. define what happens after run completion,
2. reject late fact-changing records,
3. allow post-run annotations without history mutation.

Primary test:

1. `e2e/136_v1_trace_late_arrival_policy.spec.js`

RED gate:

1. Completed runs still accept fact-changing intake as normal events.
2. Post-run annotations require history mutation.

GREEN gate:

1. Historical fact changes after completion are rejected with `TRACE_LATE_EVENT_REJECTED`.
2. Allowed post-run annotations append as new events or artifacts.

Measurable metrics:

1. Late fact-changing intake returns `error.code == "TRACE_LATE_EVENT_REJECTED"`.
2. Fact-changing late intake does not increase `trace_events` row count.
3. Allowed post-run annotation increases `trace_events` row count by exactly `1`.
4. Post-run annotation `seq` is exactly prior max `seq + 1`.
5. Earlier canonical event hashes remain unchanged after annotation append.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)
2. [specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md](/Users/robin/Projects/Portal/specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md)

### M19.6 - Trace archive read contract

Purpose:

1. add `GET /v1/traces/:traceId`,
2. add `GET /v1/traces/:traceId/events`,
3. define deterministic ordering and pagination.

Primary test:

1. `e2e/137_v1_trace_archive_read.spec.js`

RED gate:

1. Events cannot be paged deterministically.
2. Trace metadata and event read paths use inconsistent envelopes.
3. Protected trace reads bypass auth.

GREEN gate:

1. Trace metadata route returns stable summary fields.
2. Event route pages in ascending `seq` order by default.
3. Cursor pagination is deterministic.

Measurable metrics:

1. `GET /v1/traces/:traceId` returns non-empty `traceId`, `runId`, `eventCount`, and `completedAt|status`.
2. First page of `GET /v1/traces/:traceId/events?limit=2` returns exactly `2` events ordered by ascending `seq`.
3. Second page begins at prior max `seq + 1`.
4. Missing House auth returns `HOUSE_AUTH_REQUIRED`.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M19.7 - Local trace cache boundary

Purpose:

1. keep current local trainer delete actions,
2. guarantee they do not remove canonical archive data,
3. make the UI wording explicit about local cache deletion.

Primary test:

1. `e2e/138_local_trace_cache_boundary.spec.js`

RED gate:

1. Clearing trainer traces removes canonical archive rows.
2. UI still labels local deletion as archive deletion.

GREEN gate:

1. Local deletion only clears browser-local trainer cache.
2. Canonical archive remains intact and readable.
3. UI wording clearly says local or cache.

Measurable metrics:

1. Local attempt-cache count decreases after deletion.
2. `trace_events` and `trace_artifacts` canonical row counts remain unchanged after local deletion.
3. `GET /v1/traces/:traceId/events` still returns the same canonical events after local deletion.
4. Status text or control label contains `local` or `cache`.

Required doc sync:

1. [specs/14_trainer_namespace_tdd_spec.md](/Users/robin/Projects/Portal/specs/14_trainer_namespace_tdd_spec.md)
2. [specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md](/Users/robin/Projects/Portal/specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md)

### M19.8 - Config component version pinning

Purpose:

1. add immutable component pinning for config versions,
2. reject mutable alias refs at publish time,
3. store deterministic component hashes.

Primary test:

1. `e2e/139_config_component_version_pinning.spec.js`

RED gate:

1. `stable` or `latest` can publish directly.
2. Config rows are stored without resolved component ids or hashes.

GREEN gate:

1. Mutable refs are rejected.
2. Valid publication stores resolved immutable component ids and hashes.
3. New config hash is deterministic for the published manifest.

Measurable metrics:

1. Mutable-ref publish returns `error.code == "CONFIG_COMPONENT_MUTABLE_REF"`.
2. Accepted publish increases `config_versions` row count by exactly `1`.
3. Accepted publish increases `config_component_versions` row count by the number of resolved components.
4. Accepted config row contains non-empty `configHash`.
5. Accepted config row contains only immutable component version ids, not alias labels.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M19.9 - Config promotion and rollback lineage

Purpose:

1. promote candidate configs explicitly,
2. expose active config binding,
3. allow rollback by activating a prior immutable version without history mutation.

Primary test:

1. `e2e/140_config_promotion_lineage.spec.js`

RED gate:

1. Promotion mutates an existing config row in place.
2. Effective active config cannot be queried.
3. Rollback rewrites historical hashes or lineage.

GREEN gate:

1. Promotion changes the active binding explicitly.
2. Re-promoting a prior version acts as rollback without mutating historical rows.
3. Lineage is queryable.

Measurable metrics:

1. Promoting config B changes effective `activeConfigVersionId` from A to B.
2. Re-promoting config A changes effective `activeConfigVersionId` from B to A.
3. Historical `configHash` values for A and B remain unchanged before and after rollback.
4. `GET /v1/houses/:houseId/team` or equivalent active-binding read shows the current promoted config version id.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M19.10 - Integration resolve contract

Purpose:

1. introduce `POST /v1/integrations/resolve`,
2. produce a deterministic integration candidate,
3. block unsafe targets.

Primary test:

1. `e2e/141_integration_resolve_contract.spec.js`

RED gate:

1. Resolve behavior depends on live upstream services.
2. Unsafe targets are accepted.
3. Resolve result does not include a stable candidate id.

GREEN gate:

1. Seeded supported targets resolve deterministically.
2. Unsafe targets fail closed.
3. Resolve result identifies source kind and whether compilation is required.

Measurable metrics:

1. Supported target returns non-empty `integrationCandidateId`.
2. Supported target returns one of `sourceKind == "public_manual" | "native_api" | "mcp" | "parse" | "native_pack"`.
3. Unsupported or unsafe target returns a stable blocking code.
4. Replaying the same request with the same idempotency key returns the same candidate id.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M19.11 - Integration compilation contract

Purpose:

1. introduce `POST /v1/integrations/:integrationId/compilations`,
2. persist compiled integration pack versions,
3. require manifest and file hashes.

Primary test:

1. `e2e/142_integration_compilation_contract.spec.js`

RED gate:

1. Compilation does not persist a pack version.
2. Manifest omits required hashes.
3. Replaying the same compilation request creates duplicate pack versions.

GREEN gate:

1. Compilation creates one durable integration pack version.
2. Manifest contains required hashes and compatibility info.
3. Idempotent replay returns the original pack version.

Measurable metrics:

1. `integration_pack_versions` row count increases by exactly `1` on first compile.
2. Replaying with the same `Idempotency-Key` does not increase `integration_pack_versions` row count.
3. Returned manifest contains non-empty `packVersionId`, `contentHash`, and `fileHashes`.
4. Manifest includes `trace_map.json`.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M19.12 - Integration execution records and approval gate

Purpose:

1. introduce `POST /v1/integrations/:integrationId/executions`,
2. keep execution worker-selected,
3. enforce approval gates for write actions.

Primary test:

1. `e2e/143_integration_execution_approval_gate.spec.js`

RED gate:

1. Missing `actionId` is silently defaulted server-side.
2. Write-capable action runs without approval.
3. Duplicate request creates duplicate execution rows.

GREEN gate:

1. Missing `actionId` fails deterministically.
2. Read action can create an execution record without approval when policy allows.
3. Write action requires approval.
4. Idempotent replay does not create duplicates.

Measurable metrics:

1. Missing `actionId` returns `EXECUTION_NOT_ALLOWED` or a stable parameter code, not a synthesized action.
2. Read action request creates exactly one `integration_executions` row.
3. Write action without approval returns `APPROVAL_REQUIRED`.
4. Approved write action creates exactly one `integration_executions` row.
5. Stored execution record preserves the submitted `requestedBy.actorType` and `actionId` exactly.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M19.13 - Trainer job contract

Purpose:

1. introduce `POST /v1/trainer/jobs`,
2. persist durable trainer jobs,
3. enforce job-kind validation, idempotency, and stable job states.

Primary test:

1. `e2e/144_trainer_job_contract.spec.js`

RED gate:

1. Invalid job kinds are accepted.
2. Idempotent replay creates duplicate jobs.
3. GET job route does not return a stable status.

GREEN gate:

1. Valid trainer job creates exactly one durable row.
2. Invalid kind is rejected.
3. Replay returns the same `trainerJobId`.
4. `GET /v1/trainer/jobs/:trainerJobId` returns a stable status from the allowed set.

Measurable metrics:

1. `trainer_jobs` row count increases by exactly `1` on first valid request.
2. Replay with the same `Idempotency-Key` does not increase `trainer_jobs` row count.
3. Invalid request returns `TRAINER_JOB_KIND_INVALID` or `TRAINER_TARGET_INVALID`.
4. Returned `status` is one of `queued`, `running`, `blocked`, `failed`, `succeeded`, `canceled`.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)
2. [specs/14_trainer_namespace_tdd_spec.md](/Users/robin/Projects/Portal/specs/14_trainer_namespace_tdd_spec.md) only if runtime `trainer.*` behavior changes

### M19.14 - Trainer result and patch promotion

Purpose:

1. persist trainer results,
2. attach candidate patch ids,
3. enforce approval-gated patch promotion to config versions.

Primary test:

1. `e2e/145_trainer_result_patch_promotion.spec.js`

RED gate:

1. Successful jobs do not emit durable results.
2. Patch promotion bypasses approval.
3. Promoting a patch does not create a new config version.

GREEN gate:

1. Successful seeded compare job emits one trainer result.
2. Unapproved patch promotion fails closed.
3. Approved patch promotion creates a new config version with lineage back to the trainer result.

Measurable metrics:

1. `trainer_results` row count increases by exactly `1` when the seeded job completes.
2. Result payload contains non-empty `trainerResultId` and at least one `candidatePatchId`.
3. Unapproved promotion returns `APPROVAL_REQUIRED`.
4. Approved promotion increases `config_versions` row count by exactly `1`.
5. New config version stores lineage back to `trainerJobId` and `trainerResultId`.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M19.15 - Sealed context contract

Purpose:

1. introduce sealed-context storage and read routes,
2. preserve explicit entrant identity,
3. enforce release and violation behavior.

Primary test:

1. `e2e/146_sealed_context_contract.spec.js`

RED gate:

1. Sealed contexts omit `entrantId`.
2. Release and violation routes bypass auth.
3. Release changes state without respecting policy.

GREEN gate:

1. Sealed context objects contain `entrantId`, `scopeType`, `scopeKey`, `allowedReaders`, and `forbiddenSources`.
2. Release route changes state only when policy allows.
3. Violation route writes one durable violation record.

Measurable metrics:

1. `GET /v1/seals/:sealedContextId` returns non-empty `entrantId`.
2. `allowedReaders` count matches the seeded fixture count exactly.
3. Release changes `status` from `active` to `released` only for an allowed test fixture.
4. Violation submission increases `sealed_context_violations` or equivalent durable count by exactly `1`.
5. Missing House auth returns `HOUSE_AUTH_REQUIRED`.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M19.16 - Poker operator canonical ingest

Purpose:

1. ingest seeded operator JSONL,
2. map it into canonical events,
3. enforce poker trace authority and entrant-private audience/seal fields.

Primary test:

1. `e2e/147_poker_operator_canonical_ingest.spec.js`

RED gate:

1. Operator ingest depends on a live service.
2. Canonical event count diverges from fixture expectation.
3. Entrant-private events omit audience or seal fields.
4. Hash chain or seq ordering is not deterministic.

GREEN gate:

1. Seeded operator JSONL ingests into one canonical poker trace.
2. Canonical events match the expected mapped count.
3. Entrant-private events include explicit audience and seal data.
4. Integrity chain is valid.

Measurable metrics:

1. Canonical event count exactly equals the expected fixture count.
2. All event `seq` values are contiguous from `1..N`.
3. For every event after the first, `prevEventHash` equals the previous event's `eventHash`.
4. Every entrant-private event has non-empty `audience.entrantId` and `seal.sealedContextId`.
5. Trace metadata reports `authority.type == "poker_operator"`.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)
2. [specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md](/Users/robin/Projects/Portal/specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md)

### M19.17 - House Archive minimal view

Purpose:

1. add a minimal read-only House Archive surface,
2. show canonical traces and archive counters,
3. keep modal continuity.

Primary test:

1. `e2e/148_house_archive_minimal_view.spec.js`

RED gate:

1. Archive requires full-page navigation from the hub when a modal flow is available.
2. Archive data does not match canonical stored data.
3. Duplicate, ignored, and rejected counters are invisible.

GREEN gate:

1. Archive opens in the documented modal-preserving shell.
2. Archive list matches seeded trace data exactly.
3. Trace detail shows deterministic archive counters.

Measurable metrics:

1. Opening Archive preserves worker session id.
2. Archive list count equals seeded canonical trace count exactly.
3. Selecting a trace reveals deterministic `accepted`, `ignored`, and `rejected` counts matching stored values.
4. Empty-state fixture shows a stable empty-state string.

Required doc sync:

1. [specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md](/Users/robin/Projects/Portal/specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md)

### M19.18 - House Trainer minimal view

Purpose:

1. add a minimal read-only House Trainer surface,
2. show durable trainer jobs and results,
3. expose approval-needed state and linked config refs.

Primary test:

1. `e2e/149_house_trainer_minimal_view.spec.js`

RED gate:

1. Trainer list shows runtime `trainer.*` tools instead of durable jobs/results.
2. Result summaries or approval-needed states are missing.
3. View breaks worker continuity.

GREEN gate:

1. House Trainer lists durable `trainer_job.*` jobs and results separately from runtime tools.
2. Result summary, status, and approval-needed state are visible.
3. Linked config refs are visible.

Measurable metrics:

1. Opening House Trainer preserves worker session id.
2. Visible job count equals seeded `trainer_jobs` count exactly.
3. Visible result count equals seeded `trainer_results` count exactly.
4. At least one seeded approval-gated result shows a deterministic approval-needed indicator.
5. Selecting a result exposes linked `configVersionId` or `candidatePatchId` values exactly matching the seed fixture.

Required doc sync:

1. [specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md](/Users/robin/Projects/Portal/specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md)

### M19.19 - Full-cycle smoke

Purpose:

1. prove the system works as one connected loop,
2. prove compatibility with current Portal surfaces,
3. prove no confirmed gap regressed during implementation.

Primary test:

1. `e2e/150_unified_platform_full_cycle_smoke.spec.js`

Required scenario:

1. boot current Portal hub,
2. preserve `public/skill.md` compatibility,
3. compile default skill to internal pack,
4. create run,
5. ingest web trace records,
6. create trainer compare job,
7. emit trainer result,
8. promote approved patch,
9. verify new active config,
10. verify Archive and House Trainer surfaces show the new data,
11. verify local trainer cache deletion does not remove the canonical archive.

RED gate:

1. One or more individual milestones pass in isolation but the full loop fails.
2. Current skill-contract or continuity behavior regresses.
3. Archive and trainer surfaces diverge from stored data.

GREEN gate:

1. The full seeded loop completes end to end.
2. Existing core compatibility tests still pass.
3. Canonical archive remains intact after local cache deletion.

Measurable metrics:

1. End-to-end scenario yields non-empty `packVersionId`, `runId`, `traceId`, `trainerJobId`, `trainerResultId`, and promoted `configVersionId`.
2. Effective active config equals the promoted config version at the end of the scenario.
3. Archive view shows the same `traceId` produced during the scenario.
4. House Trainer view shows the same `trainerJobId` and `trainerResultId` produced during the scenario.
5. Running the compatibility slice `55`, `57`, `73`, `82`, `98`, and `111` still passes.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)
2. [specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md](/Users/robin/Projects/Portal/specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md)
3. [public/skill.md](/Users/robin/Projects/Portal/public/skill.md) only if external skill behavior changed
4. [e2e/55_phase3_skill_contract_line.spec.js](/Users/robin/Projects/Portal/e2e/55_phase3_skill_contract_line.spec.js) and `docs/internal-skill-testline.md` if external skill behavior changed

## 6. Definition of done for this program

This program is done only when:

1. all milestone Playwright specs in the reserved block pass,
2. all measurable metrics in every completed milestone are programmatically verifiable,
3. the compatibility slice in `M19.19` passes,
4. worker-first behavior is preserved,
5. modal continuity is preserved for Atlas and Trainer,
6. `public/skill.md` compatibility is preserved,
7. canonical traces, trainer jobs, and config versions are durable and replayable,
8. local cache deletion is provably separate from canonical archive deletion.

## 7. Prohibited shortcuts

The following are explicitly prohibited:

1. server-side code that invents the worker's next action,
2. server-side success fabrication for execution or trainer outcomes,
3. mutable alias refs in published config versions,
4. direct execution from raw external skill text without compiled-pack validation,
5. using local trainer cache deletion as a substitute for canonical retention policy,
6. qualitative acceptance text without measurable assertions,
7. bundling multiple unrelated features into one milestone to skip RED/GREEN discipline.

## 8. Final implementation advice for AI agent developers

1. Start with the smallest route or surface that can satisfy the milestone's RED test.
2. Add only enough schema and persistence to pass that milestone.
3. Expose deterministic observability before debugging blind.
4. Keep old and new surfaces running side by side until the new one is proven.
5. When a milestone touches identity, trainer, or skill behavior, re-run the existing compatibility slice immediately.
