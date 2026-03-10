# Phase 16 Spec: Portal Web + Poker (Contracts First, TDD)

Status: Draft  
Version: 1.0  
Audience: runtime engineers, backend engineers, frontend engineers, security engineers, QA automation engineers, AI agent implementers  
Depends on: [specs/16_portal_web_poker_v0.4_implementation_pack.md](/Users/robin/Projects/Portal/specs/16_portal_web_poker_v0.4_implementation_pack.md), [specs/17_portal_web_poker_v0.4_backlog.md](/Users/robin/Projects/Portal/specs/17_portal_web_poker_v0.4_backlog.md)  
Goal: let AI agent developers implement the revised Web + Poker system in small, deterministic steps where every milestone is backed by measurable tests and explicit pass criteria.

Implementation constraints:

1. Keep worker-first architecture. Agent planning and next-step selection remain in the browser worker.
2. Keep Atlas modal-first and preserve worker continuity.
3. Do not batch multiple major behaviors into one milestone. One milestone should be reviewable and revertible on its own.
4. Do not add untestable behavior. Every new route, state transition, and UI intent must have deterministic assertions.
5. Do not ship speculative docs. Update `specs/02_api_contract.md`, `public/skill.md`, `e2e/55_phase3_skill_contract_line.spec.js`, `docs/internal-skill-testline.md`, and related TDD specs only when the corresponding implementation lands.
6. No live network dependencies in automated tests. Use seeded fixtures and mocked operator responses.
7. Poker remains operator-authoritative. Portal mirrors and displays; it never rewrites scores.

## 1. Executive summary

The implementation order is contracts first, state second, UX third.

Order:

1. Lock route envelopes and schema before UI work.
2. Persist shared state before trainer or agent bridges.
3. Add credential broker before authenticated external writes.
4. Mirror poker operator truth before poker UI surfaces.
5. Add doc-sync enforcement before calling the program done.

This spec intentionally decomposes the work into narrow milestones so AI agent developers can implement, verify, and recover from mistakes quickly.

## 2. Global measurable metrics

Every milestone must publish measurable proof. Use these metric classes.

### 2.1 Contract metrics

Required for every new route:

1. HTTP status matches expectation.
2. Response envelope contains exactly `ok`, `data|error`, and `meta` at top level.
3. `meta.requestId` is present and non-empty.
4. `error.code` matches the documented stable code for negative paths.

### 2.2 Persistence metrics

Required for every new durable object:

1. Row count changes by the expected amount.
2. Repeating the same idempotent request does not create a second row.
3. Foreign-key references are valid.
4. Newest-first ordering is preserved where specified.

### 2.3 Identity metrics

Required for session and recovery behavior:

1. `teamCode` is unchanged across expected recovery paths.
2. `houseId` is unchanged across expected recovery paths.
3. Wallet-bound recovery restores the stronger prior session instead of a blank cookie-only session.

### 2.4 UI continuity metrics

Required for modal-driven behavior:

1. Current page path remains `/app` or the current hub path during modal actions.
2. Worker connectivity is preserved.
3. Atlas, Registry, and Poker actions do not trigger full-page navigation.

### 2.5 Security metrics

Required for sensitive routes:

1. Unsafe targets are rejected with deterministic codes.
2. Rate-limited or unauthorized paths are rejected with deterministic codes.
3. Raw secrets never appear in tool output, evidence rows, trainer output, or debug panes.
4. One origin's credential grant cannot be used against another origin.

### 2.6 Mirror metrics

Required for poker and registry mirrors:

1. Mirrored row count equals fixture row count.
2. Snapshot hashes and replay hashes match fixture values exactly.
3. Portal display output matches mirrored operator data without mutation.

## 3. Test harness rules

1. All tests must run with seeded fixtures and zero live upstream dependencies.
2. Prefer Playwright for end-to-end behavior and stable JSON assertions.
3. Use unit tests or lightweight integration tests for schema validation, idempotency, and DB invariants when that is faster than Playwright.
4. Where a metric depends on persistence, expose it via a test helper, a deterministic fixture reader, or direct SQLite inspection in test mode.
5. Negative tests are mandatory for auth, unsafe target blocking, stale revision conflicts, and missing approvals/credentials.

## 4. Milestone map

Milestones must be implemented in order.

### M16.0 - Baseline alignment

Purpose:

- align docs and route expectations before code
- remove ambiguity around Atlas navigation and worker continuity

Scope:

- [specs/11_district_map_storefront_spec.md](/Users/robin/Projects/Portal/specs/11_district_map_storefront_spec.md)
- [specs/16_portal_web_poker_v0.4_implementation_pack.md](/Users/robin/Projects/Portal/specs/16_portal_web_poker_v0.4_implementation_pack.md)
- [specs/17_portal_web_poker_v0.4_backlog.md](/Users/robin/Projects/Portal/specs/17_portal_web_poker_v0.4_backlog.md)

RED gate:

1. Repo docs still describe Atlas as a required standalone page.
2. No reserved test block exists for the new program.

GREEN gate:

1. Atlas is documented as modal-first everywhere.
2. The revised pack and backlog are present and cross-linked.

Measurable metrics:

1. `rg "first-class page|full-screen route: /atlas" specs/11_district_map_storefront_spec.md` returns no unqualified conflicts.
2. Reserved test block `124` to `135` is documented exactly once in the backlog.

### M16.1 - Web resolve contract

Purpose:

- ship a deterministic `POST /api/web/resolve` before any runtime UI work

Primary test:

- `e2e/124_web_resolve_contract.spec.js`

RED gate:

1. Unsupported sites have no structured fallback payload.
2. Success and failure envelopes differ by endpoint.

GREEN gate:

1. Supported and unsupported sites return stable envelopes.
2. Unsafe targets fail closed.

Measurable metrics:

1. Supported-site response has `resolutionState == "supported"`.
2. Unsupported-site response has `resolutionState == "unsupported"` and `fallback.reasonCode == "WEB_UNSUPPORTED_SITE"`.
3. Top-level keys are exactly `ok`, `data`, `meta` for success and `ok`, `error`, `meta` for failure.
4. `meta.requestId` is non-empty.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M16.2 - Web import guardrails

Purpose:

- implement `POST /api/web/import` with auth, quotas, unsafe-target blocking, and idempotency

Primary test:

- `e2e/125_web_import_guardrails.spec.js`

RED gate:

1. Same request can enqueue duplicate jobs.
2. Loopback or private-network imports are accepted.
3. Rejected routes do not emit stable error codes.

GREEN gate:

1. Duplicate idempotency keys return the original job.
2. Unsafe targets are blocked.
3. Audit data is emitted for accepted and rejected imports.

Measurable metrics:

1. First request and replayed request return the same `importJobId`.
2. Import-job row count increases by exactly `1` after two identical requests.
3. Unsafe target returns `error.code == "UNSAFE_TARGET"` or `error.code == "PRIVATE_NETWORK_BLOCKED"`.
4. Unauthorized request returns `UNAUTHORIZED` or `FORBIDDEN`, not a generic `500`.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M16.3 - Web session creation

Purpose:

- create durable `web_sessions` with wallet/team/house continuity fields

Primary tests:

- first test block in `e2e/126_web_session_resume.spec.js`

RED gate:

1. Session rows are not durable.
2. `teamCode` or `houseId` is absent from session state.

GREEN gate:

1. Creating a session writes one durable row.
2. Response includes `webSessionId`, `teamCode`, `houseId`, `renderMode`, and `activeRevision`.

Measurable metrics:

1. Web-session row count increases by exactly `1`.
2. Response `data.session.activeRevision == 1`.
3. Response `teamCode` matches the current Portal session `teamCode`.
4. Response `houseId` matches the current Portal session `houseId` when present.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M16.4 - Checkpoint write and revision conflict

Purpose:

- persist checkpoints and reject stale writes deterministically

Primary tests:

- second test block in `e2e/126_web_session_resume.spec.js`

RED gate:

1. Checkpoints overwrite newer state silently.
2. Resume path loses draft or approval queue state.

GREEN gate:

1. Valid checkpoint writes increment session revision.
2. Stale `expectedRevision` returns `WEB_CHECKPOINT_CONFLICT`.

Measurable metrics:

1. Checkpoint row count increases by exactly `1` on a valid write.
2. Session `activeRevision` increments by exactly `1`.
3. Stale write produces `error.code == "WEB_CHECKPOINT_CONFLICT"`.
4. Resume returns the same draft buffer, approval queue ids, and evidence cursor values that were checkpointed.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M16.5 - Wallet-backed resume and continuity

Purpose:

- prove that session recovery restores the stronger wallet-bound session and preserves routing identity

Primary tests:

- final test block in `e2e/126_web_session_resume.spec.js`

RED gate:

1. Missing cookie creates a blank session instead of recovering the live wallet-bound session.
2. Recovery rotates `teamCode` or `houseId`.

GREEN gate:

1. Wallet plus recovery key restores the prior live session.
2. `x-team-code-hint` helps choose the correct session without changing identity.

Measurable metrics:

1. Recovered session `teamCode` equals pre-reset `teamCode`.
2. Recovered session `houseId` equals pre-reset `houseId`.
3. No second durable `web_sessions` row is created during successful recovery.

### M16.6 - Approval decision roundtrip

Purpose:

- implement durable approvals and human decision handling before action execution

Primary test:

- `e2e/127_web_approval_roundtrip.spec.js`

RED gate:

1. Approval-less writes succeed.
2. Expired approvals do not fail with deterministic codes.

GREEN gate:

1. Required approvals block writes until decided.
2. Approvals emit durable decision evidence.

Measurable metrics:

1. Invoke without approval returns `error.code == "WEB_APPROVAL_REQUIRED"`.
2. Approval row count increases by exactly `1` when an approval is created.
3. Approval decision changes stored status from `pending` to `approved` or `rejected`.
4. Decision creates exactly one evidence row with category `approval_decided`.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)
2. [public/skill.md](/Users/robin/Projects/Portal/public/skill.md)
3. [e2e/55_phase3_skill_contract_line.spec.js](/Users/robin/Projects/Portal/e2e/55_phase3_skill_contract_line.spec.js)
4. [docs/internal-skill-testline.md](/Users/robin/Projects/Portal/docs/internal-skill-testline.md)
5. [specs/14_trainer_namespace_tdd_spec.md](/Users/robin/Projects/Portal/specs/14_trainer_namespace_tdd_spec.md)

### M16.7 - Action invocation and evidence ledger

Purpose:

- make action invocations durable and observable through the shared ledger

Primary test:

- additional blocks in `e2e/127_web_approval_roundtrip.spec.js`

RED gate:

1. Successful invokes do not create persistent invocation rows.
2. Evidence order or cursoring is unstable.

GREEN gate:

1. Invocation row is written exactly once per idempotency key.
2. Evidence endpoint returns newest-first, cursorable rows.

Measurable metrics:

1. Repeating the same `idempotencyKey` does not change invocation row count.
2. Response `data.invocation.invocationId` matches the persisted row id.
3. `GET /api/web/sessions/:id/evidence?limit=2` returns rows ordered by descending `createdAt`.
4. `freshOnly=true` excludes expired rows.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M16.8 - Credential broker start and use

Purpose:

- add safe authenticated-site support without exposing raw secrets

Primary test:

- `e2e/128_web_credential_broker.spec.js`

RED gate:

1. Authenticated actions require raw tokens in tool parameters.
2. Credential grants can be reused across origins.

GREEN gate:

1. Missing grant returns `WEB_CREDENTIAL_REQUIRED`.
2. Completed grant can be referenced by `credentialGrantId`.
3. Cross-origin misuse fails closed.

Measurable metrics:

1. Missing grant returns `error.code == "WEB_CREDENTIAL_REQUIRED"`.
2. Completed broker flow creates exactly one active `origin_credential_grants` row.
3. Invocation response includes `usedCredentialGrantId` but no raw token fields.
4. Using a grant against a different origin returns `error.code == "WEB_CREDENTIAL_SCOPE_MISMATCH"` or `error.code == "WEB_ORIGIN_BLOCKED"`.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)
2. [public/skill.md](/Users/robin/Projects/Portal/public/skill.md)
3. [e2e/55_phase3_skill_contract_line.spec.js](/Users/robin/Projects/Portal/e2e/55_phase3_skill_contract_line.spec.js)
4. [docs/internal-skill-testline.md](/Users/robin/Projects/Portal/docs/internal-skill-testline.md)

### M16.9 - Registry tool and Atlas projection compatibility

Purpose:

- add Registry tools without changing Atlas semantics

Primary test:

- `e2e/130_registry_tool_projection_compat.spec.js`

RED gate:

1. Registry search mutates Atlas state model.
2. Atlas search stops working through the existing tool.

GREEN gate:

1. `agent_town_ui_atlas_search` remains Atlas-only.
2. Registry tools use separate projection and state getters.

Measurable metrics:

1. Atlas search snapshot still reports Atlas `query`, `family`, and modal title.
2. Registry search does not change the active Atlas district unless explicitly requested.
3. Current path remains modal-driven and worker-connected throughout both flows.

Required doc sync:

1. [public/skill.md](/Users/robin/Projects/Portal/public/skill.md)
2. [e2e/55_phase3_skill_contract_line.spec.js](/Users/robin/Projects/Portal/e2e/55_phase3_skill_contract_line.spec.js)
3. [docs/internal-skill-testline.md](/Users/robin/Projects/Portal/docs/internal-skill-testline.md)
4. [specs/15_experience_os_intent_tools_tdd_spec.md](/Users/robin/Projects/Portal/specs/15_experience_os_intent_tools_tdd_spec.md)
5. [specs/11_district_map_storefront_spec.md](/Users/robin/Projects/Portal/specs/11_district_map_storefront_spec.md)

### M16.10 - Poker operator client contract

Purpose:

- implement the stable operator client before any poker UI or submission flow

Primary test:

- `e2e/131_poker_operator_client_contract.spec.js`

RED gate:

1. Operator list and detail endpoints are parsed loosely.
2. Schema mismatches fail generically.

GREEN gate:

1. Client validates envelopes, pagination, auth failures, and replay schema version.
2. Mirror tables are populated from fixture responses.

Measurable metrics:

1. Mirrored seasons row count equals fixture season count exactly.
2. Protected mutation without bearer token returns `POKER_OPERATOR_AUTH_REQUIRED`.
3. Unknown schema version returns `POKER_OPERATOR_SCHEMA_MISMATCH`.
4. `GET /v1/seasons` fixture cursor behavior is preserved exactly.

### M16.11 - Poker submission proxy

Purpose:

- bind submissions to wallet identity and Portal session before forwarding to operator

Primary test:

- `e2e/132_poker_submission_proxy.spec.js`

RED gate:

1. Closed-season submissions do not fail deterministically.
2. Duplicate submissions create duplicate mirror rows.

GREEN gate:

1. Proxy stores wallet subject and Portal session id on each submission.
2. Duplicate idempotent submissions replay the original result.

Measurable metrics:

1. Closed season returns `error.code == "POKER_SEASON_CLOSED"`.
2. Submission row count increases by exactly `1` after two identical idempotent requests.
3. Persisted row `wallet_subject` equals the fixture wallet.
4. Persisted row `portal_session_id` equals the active Portal session id.

Required doc sync:

1. [specs/02_api_contract.md](/Users/robin/Projects/Portal/specs/02_api_contract.md)

### M16.12 - Poker leaderboard mirror

Purpose:

- prove that Portal displays mirrored operator truth without score rewriting

Primary test:

- `e2e/133_poker_leaderboard_mirror.spec.js`

RED gate:

1. Portal computes or rewrites leaderboard ranks locally.
2. Empty-state pages fail when operator data is missing.

GREEN gate:

1. Leaderboard UI reads directly from mirrored snapshots.
2. Empty-state rendering still works with zero snapshots.

Measurable metrics:

1. UI rank order equals the mirrored snapshot rank order exactly.
2. Displayed rating values equal fixture values exactly.
3. With zero snapshots, UI shows empty-state copy and no crash.

### M16.13 - Replay manifest validation

Purpose:

- make replay pages deterministic and hash-verifiable

Primary test:

- `e2e/134_poker_replay_manifest.spec.js`

RED gate:

1. Replay page accepts malformed manifest or mismatched hash.
2. Replay format version is ignored.

GREEN gate:

1. Replay page validates manifest version and artifact hash before render.
2. Invalid manifest fails with deterministic code and user-visible state.

Measurable metrics:

1. Valid manifest hash matches fixture `artifactSha256` exactly.
2. Invalid hash returns `error.code == "POKER_REPLAY_NOT_READY"` or `POKER_OPERATOR_SCHEMA_MISMATCH`, depending on failure type.
3. Replay page renders the same `winnerSeat`, `turns`, and `seed` values as the manifest summary.

### M16.14 - Trainer bridge parity for Web Experience sessions

Purpose:

- ensure trainer namespace reads and actions reflect the same durable web-session state

Primary tests:

- trainer parity block added to `e2e/127_web_approval_roundtrip.spec.js`
- final contract assertions in `e2e/135_docs_contract_sync.spec.js`

RED gate:

1. Trainer reads a separate local-only ledger for a `web_experiences` session.
2. Trainer action ids or evidence ids diverge from `/api/web/*`.

GREEN gate:

1. Trainer and `/api/web/*` report the same action ids, invocation ids, and evidence ids for the same session.

Measurable metrics:

1. `trainer.list_evidence` count equals `GET /api/web/sessions/:id/evidence` count for the same fixture session.
2. `trainer.invoke_action` returns the same `invocationId` as the backend route for the same idempotent request.

Required doc sync:

1. [public/skill.md](/Users/robin/Projects/Portal/public/skill.md)
2. [e2e/55_phase3_skill_contract_line.spec.js](/Users/robin/Projects/Portal/e2e/55_phase3_skill_contract_line.spec.js)
3. [docs/internal-skill-testline.md](/Users/robin/Projects/Portal/docs/internal-skill-testline.md)
4. [specs/14_trainer_namespace_tdd_spec.md](/Users/robin/Projects/Portal/specs/14_trainer_namespace_tdd_spec.md)

### M16.15 - Doc-sync enforcement gate

Purpose:

- make stale docs a test failure instead of a review surprise

Primary test:

- `e2e/135_docs_contract_sync.spec.js`

RED gate:

1. Worker-visible or HTTP-contract changes can merge without matching doc updates.

GREEN gate:

1. The program has a deterministic check that fails when required docs are stale or omitted.

Measurable metrics:

1. Missing required doc touch for a worker-visible tool change causes the gate to fail.
2. Missing required `specs/02_api_contract.md` update for a route-envelope change causes the gate to fail.
3. Atlas-contract change without `specs/11_district_map_storefront_spec.md` update causes the gate to fail.

## 5. Phase completion rules

Phase A is complete when:

1. M16.0 through M16.3 are green.
2. `e2e/124`, `125`, `129`, and `131` pass.

Phase B is complete when:

1. M16.4 through M16.8 are green.
2. `e2e/126`, `127`, and `128` pass.

Phase C is complete when:

1. M16.9 through M16.13 are green.
2. `e2e/130`, `132`, `133`, and `134` pass.

Phase D is complete when:

1. M16.14 and M16.15 are green.
2. `e2e/135` passes.

## 6. Definition of done

The TDD program is done only when:

1. Every milestone above has a corresponding passing automated test.
2. All measurable metrics are directly verifiable by AI agent developers from test output, fixture state, or deterministic API responses.
3. `npm test` is green.
4. The live implementation still obeys worker-first, wallet-first, modal-first, and operator-authoritative rules.
