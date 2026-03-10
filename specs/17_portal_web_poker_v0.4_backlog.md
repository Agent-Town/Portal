# Portal Web + Poker Backlog v0.4

Status: Revised implementation backlog  
Date: 2026-03-09  
Depends on: [specs/16_portal_web_poker_v0.4_implementation_pack.md](/Users/robin/Projects/Portal/specs/16_portal_web_poker_v0.4_implementation_pack.md)
Companion TDD spec: [specs/18_portal_web_poker_tdd_spec.md](/Users/robin/Projects/Portal/specs/18_portal_web_poker_tdd_spec.md)

This backlog replaces the external v0.3 backlog for implementation planning. It fixes the previously accepted gaps by making the rollout explicitly phased, binding each workstream to concrete contracts, and encoding the repo's mandatory doc-sync and deterministic-test workflow.

## 1. Cross-cutting delivery rules

These rules apply to every ticket below.

1. No ticket is done until its API contract, tests, and affected docs are updated in the same change set.
2. No ticket may introduce a second authority for worker behavior. Worker-first rules in `AGENTS.md` remain binding.
3. Atlas remains modal-first. Registry and Poker must preserve hub-page worker continuity and must not replace Atlas district semantics.
4. Town Hall and Town Board semantics remain unchanged. Poker ships as a separate module.
5. Sensitive mutation or remote-fetch routes must ship with auth, quotas, audit visibility, and idempotency on day one.

## 2. Mandatory doc-sync matrix

When a ticket changes one of the following surfaces, these updates are required in the same branch before merge.

| Changed surface | Required docs and tests |
|---|---|
| HTTP route or JSON envelope | `specs/02_api_contract.md` |
| Worker-visible skill or tool behavior | `public/skill.md`, `e2e/55_phase3_skill_contract_line.spec.js`, `docs/internal-skill-testline.md` |
| Trainer namespace or skill-action bridge | `public/skill.md`, `e2e/55_phase3_skill_contract_line.spec.js`, `docs/internal-skill-testline.md`, `specs/14_trainer_namespace_tdd_spec.md` |
| Atlas, Registry, or Poker modal/deep-link contract | `specs/11_district_map_storefront_spec.md`, `specs/15_experience_os_intent_tools_tdd_spec.md`, `specs/16_portal_web_poker_v0.4_implementation_pack.md` |
| Poker operator wire contract | this backlog, `specs/16_portal_web_poker_v0.4_implementation_pack.md`, operator-side contract docs |

## 3. Reserved deterministic test block

To avoid file-number collisions, this program reserves the following new Playwright files:

- `e2e/124_web_resolve_contract.spec.js`
- `e2e/125_web_import_guardrails.spec.js`
- `e2e/126_web_session_resume.spec.js`
- `e2e/127_web_approval_roundtrip.spec.js`
- `e2e/128_web_credential_broker.spec.js`
- `e2e/129_registry_import_idempotency.spec.js`
- `e2e/130_registry_tool_projection_compat.spec.js`
- `e2e/131_poker_operator_client_contract.spec.js`
- `e2e/132_poker_submission_proxy.spec.js`
- `e2e/133_poker_leaderboard_mirror.spec.js`
- `e2e/134_poker_replay_manifest.spec.js`
- `e2e/135_docs_contract_sync.spec.js`
- `e2e/136_poker_modal_embed_policy.spec.js`

## 4. Phase plan

Implementation proceeds in four phases. Each later phase depends on the earlier phase gates being green.

### Phase A - Contracts, schemas, and guardrails

Goal:

- land implementation-ready contracts
- resolve live Atlas doc conflict
- add durable schema for web and poker state
- enforce auth/idempotency/audit rules on sensitive routes before feature rollout

Bundle gate:

- `npm test` stays green
- new contract tests `124`, `125`, `129`, and `131` pass

### Phase B - Secure Web Experience runtime

Goal:

- make `web_experiences` real without breaking worker authority
- bridge trainer namespace to server-backed session state
- ship checkpoint/recovery and credential broker flows

Bundle gate:

- `npm test` stays green
- new tests `126`, `127`, and `128` pass

### Phase C - Poker mirror and Portal surfaces

Goal:

- mirror operator truth into Portal
- ship season, submission, leaderboard, and replay surfaces as a separate module

Bundle gate:

- `npm test` stays green
- new tests `132`, `133`, and `134` pass

### Phase D - Docs, fixtures, and regression hardening

Goal:

- complete doc sync
- lock deterministic fixtures and auditability
- ensure all agent-facing surfaces remain readable and test-backed

Bundle gate:

- `npm test` stays green
- `e2e/135_docs_contract_sync.spec.js` passes

## 5. Tickets

## DOC-001 - Resolve Atlas contract conflict

- Priority: P0
- Phase: A
- Depends on: none
- Goal: make Atlas modal-first everywhere in repo docs and acceptance criteria.
- Deliverables:
- align `specs/11_district_map_storefront_spec.md` with `AGENTS.md`
- preserve `/atlas?embed=1` render route and modal entry behavior
- keep `agent_town_ui_atlas_search` compatible with current intent tests
- Acceptance criteria:
- no repo doc says Atlas is a required standalone first-class page
- direct Atlas hits are documented as redirect entry points
- existing Atlas intent tests continue to describe modal-first behavior
- Required doc sync:
- `specs/11_district_map_storefront_spec.md`
- `specs/15_experience_os_intent_tools_tdd_spec.md`

## REG-101 - Harden registry import route before rollout

- Priority: P0
- Phase: A
- Depends on: DOC-001
- Goal: implement `POST /api/registry/import` with auth, idempotency, quotas, unsafe-target blocking, and audit rows.
- Deliverables:
- route-level auth policy
- `Idempotency-Key` handling
- loopback and private-network blocking
- audit log rows for accepted and rejected imports
- Acceptance criteria:
- duplicate idempotency key returns the original import job
- unauthenticated or over-budget callers get deterministic error codes
- unsafe targets fail with `UNSAFE_TARGET` or `PRIVATE_NETWORK_BLOCKED`
- import actor and source URL are visible in audit logs
- Suggested tests:
- `e2e/129_registry_import_idempotency.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## WEB-101 - Implement web resolve/import/session contract and migrations

- Priority: P0
- Phase: A
- Depends on: DOC-001
- Goal: ship concrete `resolve`, `import`, and `session` routes plus durable SQLite schema.
- Deliverables:
- `POST /api/web/resolve`
- `POST /api/web/import`
- `POST /api/web/sessions`
- `GET /api/web/sessions/:id`
- migrations for `web_sessions`, `web_import_jobs`, `web_checkpoints`, `web_action_invocations`, `web_evidence_items`
- `PRAGMA foreign_keys = ON` on every DB connection
- required indexes from the implementation pack
- Acceptance criteria:
- unsupported sites return structured fallback payloads
- sessions persist `teamCode`, `houseId`, wallet subjects, and revision
- restart and refresh can reload the last durable session state
- all new routes use the shared `{ ok, data|error, meta }` envelope
- Suggested tests:
- `e2e/124_web_resolve_contract.spec.js`
- `e2e/125_web_import_guardrails.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## WEB-102 - Server-backed approvals, invocations, and evidence

- Priority: P0
- Phase: B
- Depends on: WEB-101
- Goal: make approvals, invocations, and evidence durable without moving agent decision logic into the backend.
- Deliverables:
- `POST /api/web/sessions/:id/actions/:actionId/invoke`
- `POST /api/web/approvals/:approvalId/decision`
- `GET /api/web/sessions/:id/evidence`
- durable `web_approval_requests` rows
- durable `web_action_invocations` rows keyed by idempotency
- durable `web_evidence_items` rows with TTL metadata
- Acceptance criteria:
- invoke returns stable success and failure envelopes
- stale or missing approvals produce deterministic error codes
- evidence ledger is newest-first and cursor-paginatable
- trainer namespace can observe the same backing data for Web Experience sessions
- Suggested tests:
- `e2e/127_web_approval_roundtrip.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`
- `public/skill.md`
- `e2e/55_phase3_skill_contract_line.spec.js`
- `docs/internal-skill-testline.md`
- `specs/14_trainer_namespace_tdd_spec.md`

## WEB-103 - Checkpoint, resume, and identity continuity

- Priority: P0
- Phase: B
- Depends on: WEB-101
- Goal: preserve web-session continuity across refresh, tab death, and wallet-backed recovery.
- Deliverables:
- `POST /api/web/sessions/:id/checkpoint`
- resume path that rebinds by `et_session`, wallet subject, `x-wallet-recovery-key`, and `x-team-code-hint`
- revision conflict handling
- Acceptance criteria:
- recovery does not rotate live `teamCode` or `houseId`
- checkpoint resume restores drafts, approval queue state, and evidence cursor
- stale revisions fail with deterministic conflict codes
- Suggested tests:
- `e2e/126_web_session_resume.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## WEB-104 - Origin-scoped credential broker

- Priority: P0
- Phase: B
- Depends on: WEB-102
- Goal: ship a safe credential acquisition and use path for authenticated external actions.
- Deliverables:
- `POST /api/web/credentials/start`
- encrypted origin-scoped credential grant storage
- action invocation support for `credentialGrantId`
- revocation and expiry handling
- Acceptance criteria:
- raw third-party tokens never appear in tool output, debug panes, or evidence rows
- one origin's credentials cannot be reused for another origin
- missing grant returns `WEB_CREDENTIAL_REQUIRED`
- scope mismatch returns `WEB_CREDENTIAL_SCOPE_MISMATCH`
- Suggested tests:
- `e2e/128_web_credential_broker.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`
- `public/skill.md`
- `e2e/55_phase3_skill_contract_line.spec.js`
- `docs/internal-skill-testline.md`

## WEB-105 - Trainer namespace bridge for Web Experience sessions

- Priority: P1
- Phase: B
- Depends on: WEB-102
- Goal: make `trainer.*` tools reflect server-backed Web Experience actions, approvals, and evidence without breaking existing trainer contracts.
- Deliverables:
- `trainer.list_actions` bridge for compiled web packs
- `trainer.invoke_action` bridge for web sessions
- `trainer.list_evidence` reading server-backed ledger rows
- Acceptance criteria:
- trainer outputs match the same evidence and invocation ids returned by `/api/web/*`
- no duplicate local-only ledger exists for the same Web Experience session
- Suggested tests:
- `e2e/127_web_approval_roundtrip.spec.js`
- `e2e/135_docs_contract_sync.spec.js`
- Required doc sync:
- `public/skill.md`
- `e2e/55_phase3_skill_contract_line.spec.js`
- `docs/internal-skill-testline.md`
- `specs/14_trainer_namespace_tdd_spec.md`

## REG-102 - Registry tools and Atlas compatibility wrapper

- Priority: P1
- Phase: C
- Depends on: WEB-101
- Goal: add registry agent tools while preserving Atlas intent compatibility.
- Deliverables:
- `agent_town_ui_registry_search`
- `agent_town_state_get_registry_entity`
- `agent_town_ui_atlas_search` compatibility wrapper
- Acceptance criteria:
- Atlas tool remains limited to Atlas query and family state
- Registry search does not mutate Atlas semantics
- modal continuity remains intact
- Suggested tests:
- `e2e/130_registry_tool_projection_compat.spec.js`
- Required doc sync:
- `public/skill.md`
- `e2e/55_phase3_skill_contract_line.spec.js`
- `docs/internal-skill-testline.md`
- `specs/15_experience_os_intent_tools_tdd_spec.md`
- `specs/11_district_map_storefront_spec.md`

## POKER-101 - Operator client contract and mirror schema

- Priority: P0
- Phase: A
- Depends on: REG-101
- Goal: implement the stable Portal-facing poker operator client and durable mirror tables.
- Deliverables:
- versioned operator client with public read and protected mutation endpoints
- durable tables for seasons, divisions, submissions, batches, runs, replay artifacts, and leaderboard snapshots
- replay manifest validation
- Acceptance criteria:
- client validates response envelopes and schema version
- operator auth failures are deterministic
- mirrored tables are queryable without live operator dependence
- Suggested tests:
- `e2e/131_poker_operator_client_contract.spec.js`
- Required doc sync:
- `specs/16_portal_web_poker_v0.4_implementation_pack.md`

## POKER-102 - Poker season, leaderboard, and replay pages

- Priority: P1
- Phase: C
- Depends on: POKER-101
- Goal: ship read-only Portal poker pages as a separate module.
- Deliverables:
- poker index
- season page
- leaderboard page
- replay page
- Acceptance criteria:
- Town Hall and Town Board remain unchanged
- season pages read only from mirrored operator data
- replay page renders operator manifest metadata without score rewriting
- Suggested tests:
- `e2e/133_poker_leaderboard_mirror.spec.js`
- `e2e/134_poker_replay_manifest.spec.js`

## POKER-103 - Setup submission proxy and ownership binding

- Priority: P0
- Phase: C
- Depends on: POKER-101, WEB-103
- Goal: let users submit bundles through Portal with wallet-bound ownership and deterministic operator responses.
- Deliverables:
- submission form and proxy route
- wallet subject binding on each submission
- idempotent operator forwarding
- submission status page
- Acceptance criteria:
- closed seasons fail with `POKER_SEASON_CLOSED`
- duplicate submissions replay the original accepted result
- submission rows record wallet subject, Portal session, and operator submission id
- Suggested tests:
- `e2e/132_poker_submission_proxy.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## SEC-101 - Request budgets, rate limits, and audit logs

- Priority: P0
- Phase: A
- Depends on: REG-101, WEB-101, POKER-101
- Goal: secure all new import, session, approval, credential, and poker proxy endpoints from day one.
- Deliverables:
- per-route rate limiting
- per-session action budgets
- append-only audit log rows
- deterministic blocked-action codes
- Acceptance criteria:
- sensitive routes reject budget overruns deterministically
- blocked decisions are visible in logs with actor, target, action, and result
- Suggested tests:
- `e2e/125_web_import_guardrails.spec.js`
- `e2e/128_web_credential_broker.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## QA-101 - Deterministic fixtures and regression lock

- Priority: P0
- Phase: D
- Depends on: WEB-102, POKER-101
- Goal: provide stable fixtures for imports, credential broker flows, and operator outputs.
- Deliverables:
- fixed unsupported-site resolve fixtures
- mocked Parse import fixtures
- mocked operator outputs, replay manifests, and leaderboard snapshots
- Acceptance criteria:
- all new e2e files run without live external dependencies
- replay manifest and evidence TTL assertions are stable under CI timing
- Suggested tests:
- `e2e/124_web_resolve_contract.spec.js`
- `e2e/131_poker_operator_client_contract.spec.js`
- `e2e/134_poker_replay_manifest.spec.js`

## DOC-002 - Contract sync gate

- Priority: P0
- Phase: D
- Depends on: REG-102, WEB-105, POKER-103
- Goal: enforce that agent-facing docs and tests are updated before merge.
- Deliverables:
- CI check or review checklist that fails when required docs are omitted
- docs sync across HTTP contract, skill contract, trainer contract, and Atlas contract
- Acceptance criteria:
- changes touching worker-visible tools fail review if `public/skill.md`, `e2e/55_phase3_skill_contract_line.spec.js`, or `docs/internal-skill-testline.md` are not updated when required
- changes touching HTTP envelopes fail review if `specs/02_api_contract.md` is stale
- Atlas-contract changes fail review if `specs/11_district_map_storefront_spec.md` is stale
- Suggested tests:
- `e2e/135_docs_contract_sync.spec.js`

## 6. First executable bundle

The first implementation bundle is intentionally narrow.

1. DOC-001
2. REG-101
3. WEB-101
4. POKER-101
5. SEC-101

This bundle does not attempt live poker UI, credential brokerage, or trainer bridging. It produces:

- stable route contracts
- durable schemas
- Atlas contract alignment
- operator client shape
- auth, idempotency, and audit baselines

## 7. Definition of done for the program

The revised docs are only considered successfully implemented when:

1. `npm test` passes.
2. The new routes in `specs/02_api_contract.md` match the implementation.
3. Atlas remains modal-first and documented consistently.
4. Worker-visible tool changes are synced through `public/skill.md`, `e2e/55_phase3_skill_contract_line.spec.js`, and `docs/internal-skill-testline.md`.
5. Poker remains operator-authoritative and Portal never rewrites scores.
