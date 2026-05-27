# V6.0 Agent Civilization Readiness Gate

Status: `research_only`

Milestone plan: `docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md`

V5 promotion gate: `specs/release-gates/v5_world_grid_release_promotion_gate.md`

Civic schema contracts: `specs/55_agent_town_v6_civic_schema_contracts.md`

Civic audit ledger foundation: `specs/56_agent_town_v6_audit_ledger_foundation.md`

Internal proposal lifecycle: `specs/57_agent_town_v6_internal_proposal_lifecycle.md`

Vote authorization foundation: `specs/58_agent_town_v6_vote_authorization_foundation.md`

Worker-first civic tool draft:
`specs/59_agent_town_v6_worker_tool_surface_draft.md`

Reputation accountability foundation:
`specs/60_agent_town_v6_reputation_accountability_foundation.md`

Moderation privacy foundation:
`specs/61_agent_town_v6_moderation_privacy_foundation.md`

Civic effect rollback foundation:
`specs/62_agent_town_v6_civic_effect_rollback_foundation.md`

Agent participation delegation foundation:
`specs/63_agent_town_v6_agent_participation_delegation_foundation.md`

Civic institution charter foundation:
`specs/64_agent_town_v6_civic_institution_charter_foundation.md`

Public works shared resources foundation:
`specs/65_agent_town_v6_public_works_shared_resources_foundation.md`

Modal lab surface foundation:
`specs/66_agent_town_v6_modal_lab_surface_foundation.md`

Persistence replay resilience foundation:
`specs/67_agent_town_v6_persistence_replay_resilience_foundation.md`

Security product release review foundation:
`specs/68_agent_town_v6_security_product_release_review_foundation.md`

Controlled release completion foundation:
`specs/69_agent_town_v6_controlled_release_completion_foundation.md`

V6.0 Agent Civilization Foundation must not become player-visible until every
gate below has implementation, deterministic tests, and security/product signoff.

## Runtime Feature Flag Gate

- `FEATURE_WORLD_V60_AGENT_CIVILIZATION` defaults off.
- Broad V5 prototype overrides such as `all`, `world`, `world_grid`,
  `prototype`, or `prototypes` enable V5.0-V5.5 only and must not enable V6.0.
- Internal V6 research requires an explicit `v60` or
  `FEATURE_WORLD_V60_AGENT_CIVILIZATION` opt-in.
- Production player query/header overrides must not enable V6.0.
- Runtime V6 civic routes and tools must be absent or return
  `FEATURE_DISABLED` until the M6 worker-first tool surface is intentionally
  implemented and tested.
- Research-only civic tool drafts may exist in
  `server/world_civilization/tools.js`, but they must be non-executing,
  hidden from runtime `/api/world/tools`, and covered by contract tests.
- The research-only modal lab surface contract may exist in
  `server/world_civilization/lab_surface.js`, but it must stay route-neutral,
  modal-first, hidden from players, non-executing, and covered by contract
  tests.
- The research-only resilience baseline may exist in
  `server/world_civilization/resilience.js`, but it must keep
  `releaseReady: false` until release-grade process restart coverage,
  replay reconstruction, migration upgrade/downgrade, load/rate, and rollback
  recovery gates have deterministic evidence. Current audit replay
  reconstruction starts in `server/world_civilization/replay_reconstruction.js`,
  migration rehearsal starts in
  `server/world_civilization/migration_rehearsal.js`, and unsupported
  upgrade/downgrade targets fail closed in
  `tests/world_civilization_migration_rehearsal.test.js`. Real migration scripts
  remain a release requirement. Current audit-ledger process restart probe
  starts in `tests/world_civilization_process_restart.test.js`. Proposal/vote
  process restart coverage starts in
  `tests/world_civilization_proposal_vote_process_restart.test.js`.
  Reputation/moderation process restart coverage starts in
  `tests/world_civilization_reputation_moderation_process_restart.test.js`;
  effect/rollback process restart coverage starts in
  `tests/world_civilization_effect_process_restart.test.js`;
  delegation process restart coverage starts in
  `tests/world_civilization_delegation_process_restart.test.js`;
  institution process restart coverage starts in
  `tests/world_civilization_institution_process_restart.test.js`;
  public-works process restart coverage starts in
  `tests/world_civilization_public_works_process_restart.test.js`;
  all replay probes must remain privacy-safe and non-executing.
- The research-only release review gate may exist in
  `server/world_civilization/release_review.js`, but it must keep V6 hidden
  from runtime/player surfaces until threat model, privacy review, abuse-case
  review, data-retention policy, audit coverage, validation evidence, and
  product signoff are complete.
- The research-only controlled release gate may exist in
  `server/world_civilization/controlled_release.js`, but it must keep
  `productionEnabled: false` until M0-M17 are done, the release-review report is
  ready, production-safe flags, rollback/disable controls, observability,
  support runbooks, blocker clearance, and a controlled release window have
  approved evidence.

## Prerequisites

- V5.0 Region Grid remains gated and deterministic without hidden state
  creation. Current V5.0 storage evidence includes the
  `WORLD_GRID_REGION_PREFS_SQLITE_PATH` foundation for owner-indexed camera/focus
  preference restart proof, but release promotion still requires final
  browser-session preference continuity and production replay coverage in the
  V5 gate.
- V5.1 Territory Claims and Settler Routes require existing settlement state,
  owner checks, resource conservation, idempotency, and replay evidence. Current
  V5.1 storage evidence includes the `WORLD_GRID_CLAIMS_SQLITE_PATH` foundation
  for planned/claimed/cancel restart proof and cross-owner route-mutation
  denial, but release promotion still requires stale-session handling, final
  production session-auth coverage, and release replay reconstruction in the V5
  gate.
- V5.2 Public Presence and Safe Player Discovery has XSS-safe rendering,
  opt-in/out, redaction, abuse reporting, and privacy review. Current V5.2
  storage evidence includes the `WORLD_GRID_PUBLIC_PRESENCE_SQLITE_PATH`
  foundation for public presence/follow/report restart proof, duplicate
  reporter/town report suppression, self-report rejection, and private-looking
  abuse-report text redaction, but release promotion still requires retention,
  stale-session, moderation workflow integration, and final privacy coverage in
  the V5 gate.
- V5.3 Civic Service Advice Prototype proves input redaction, output schemas,
  reputation bounds, dispute handling, and no hidden mutation. Current V5.3
  storage evidence includes the `WORLD_GRID_SERVICES_SQLITE_PATH` foundation for
  service request/reputation restart proof, but release promotion still requires
  stale-session, full dispute workflow, retention, and final service privacy
  coverage in the V5 gate.
- V5.4 World Events and Public Works proves contribution caps, idempotency,
  conservation, reward safety, audit records, and rollback policy. Current V5.4
  storage evidence includes the `WORLD_GRID_EVENTS_SQLITE_PATH` foundation for
  event contribution/reward restart proof, but release promotion still requires
  rollback policy, multi-event migration, final public-ledger review, and larger
  contribution-load coverage in the V5 gate.
- V5.5 Controlled Free-Play Sandbox Districts proves typed action moderation,
  rollback, rate limits, privacy boundaries, and no private-town mutation.
  Current V5.5 storage evidence includes the `WORLD_GRID_SANDBOX_SQLITE_PATH`
  foundation for sandbox participant/action/snapshot/cell restart proof, but
  release promotion still requires abuse reports, stale-session cleanup,
  cross-owner moderation review, and final sandbox privacy coverage in the V5
  gate.

## Required V6 Schemas

- Proposal schema with proposer identity, scope, affected public state, effect
  preview, moderation class, expiry, idempotency key, and rollback plan.
- Vote schema with voter authorization, delegation status, eligibility proof,
  one-vote accounting, and receipt id.
- Civic action schema with proposal reference, execution authority, before/after
  summary, audit ledger entry, and rollback id.
- Institution charter schema with human chartering actor, public scope,
  proposal types, membership and eligibility rules, moderation policy, voting
  rule, and redacted public audit summary.
- Public works contribution schema with institution, project, contributor,
  source reference, requested public resource bundle, idempotency key, and
  redacted public audit summary.

## Release Gates

- Vote authorization cannot be forged, replayed, self-delegated without policy,
  or applied to ineligible owners.
- Reputation cannot be self-awarded, transferred as currency, or used without an
  audit trail and dispute path. Current research-only storage starts this in
  `server/world_civilization/reputation.js` with durable reputation records,
  dispute/review records, human dispute requesters, moderation-decision source
  references, and `reputation.disputed` audit rows; release still requires
  production eligibility/advice integration and privacy/product review.
- Moderation must cover proposal text, attached media, sandbox actions, civic
  effects, public profile surfaces, and agent-authored content. Current
  research-only storage starts this in
  `server/world_civilization/moderation.js` with durable decisions plus
  human review/appeal records, abuse-report source references, and
  `moderation.reviewed`/`moderation.appealed` audit rows; release still requires
  production review tooling, appeals operations, media review, and full
  public-surface integration.
- Rollback must exist for every public civic effect, with clear irreversible
  action exclusions. Current research-only storage starts this in
  `server/world_civilization/effects.js` with prepared-effect records and
  rollback handles only, while `server/world_civilization/schemas.js` enforces a
  schema-level typed effect handler registry that rejects effect/handler
  mismatches before persistence; research-only handle reconstruction starts in
  `server/world_civilization/rollback_recovery.js` and
  `tests/world_civilization_rollback_recovery.test.js`. Release still requires
  executable typed handlers, applied/failed states, real rollback execution,
  irreversible-action review, and conservation tests.
- Agent participation must never grant silent authority escalation. Current
  research-only delegation lifecycle storage starts this in
  `server/world_civilization/delegations.js` with scoped delegations,
  idempotent action-budget usage records, and `delegation.action_consumed`
  audit rows; release still requires worker/tool enforcement, expiry,
  budget, and revocation checks at every route edge, and principal
  wallet/session authorization.
- Civic institutions must have explicit charters, scopes, eligibility rules,
  voting rules, moderation policies, and public audit summaries before any
  player-visible institution appears. Current research-only storage starts this
  in `server/world_civilization/institutions.js`; release still requires
  proposal/vote-governed charter changes, worker/tool integration, and public
  text rendering review.
- Public works and shared resources must conserve accepted inputs, public
  progress, caps, rewards, and rollbacks across retries and restarts. Current
  research-only accounting starts this in
  `server/world_civilization/public_works.js`; release still requires governed
  project creation, wallet/session route auth, explicit private-inventory spend,
  rollback execution, and reward conservation tests.
- Any internal V6 lab UI must launch from the town hub modal flow, preserve
  page-scoped OpenClaw Lite worker continuity, keep Worker Tools, Skill Context,
  Worker Traffic, Brain, and Session Context observable, and prove with
  Playwright visual coverage that it has no standalone route or normal gameplay
  exposure. Current contract-only coverage starts in
  `server/world_civilization/lab_surface.js`; release still requires real modal
  UI checks before any player-visible V6 lab work.
- Persistence and replay resilience must prove every V6 civic store survives
  process restarts, reconstructs summaries from audit replay, rejects duplicate
  retries under load, migrates forward and backward through schema versions, and
  recovers rollback handles after failures. Current research-only baseline
  tracking starts in `server/world_civilization/resilience.js`, and privacy-safe
  audit replay reconstruction starts in
  `server/world_civilization/replay_reconstruction.js`; audit-ledger process
  restart coverage starts in `tests/world_civilization_process_restart.test.js`.
  Proposal/vote process restart coverage starts in
  `tests/world_civilization_proposal_vote_process_restart.test.js`.
  Reputation/moderation process restart coverage starts in
  `tests/world_civilization_reputation_moderation_process_restart.test.js`.
  Effect/rollback process restart coverage starts in
  `tests/world_civilization_effect_process_restart.test.js`.
  Delegation process restart coverage starts in
  `tests/world_civilization_delegation_process_restart.test.js`.
  Institution process restart coverage starts in
  `tests/world_civilization_institution_process_restart.test.js`.
  Public-works process restart coverage starts in
  `tests/world_civilization_public_works_process_restart.test.js`.
  Schema metadata coverage starts in
  `tests/world_civilization_schema_metadata.test.js`; current stores stamp
  v1 on-disk metadata and fail closed on unsupported SQLite `user_version` or
  mismatched migration markers.
  Load/rate research coverage starts in
  `tests/world_civilization_load_rate.test.js`; the audit ledger now has a
  deterministic larger replay pagination and duplicate retry burst check.
  Rollback recovery research coverage starts in
  `tests/world_civilization_rollback_recovery.test.js`; prepared rollback
  handles can be reconstructed from reopened effect/audit stores without
  executing state.
  Migration rehearsal coverage starts in
  `server/world_civilization/migration_rehearsal.js` and
  `tests/world_civilization_migration_rehearsal.test.js`; current v1 metadata can
  be inventoried and unsupported upgrade/downgrade targets fail closed without
  executing migration scripts.
  These current probes cover every current civic store at research scale.
  Release still requires release-grade process restart coverage, larger replay
  reconstruction, migration scripts with upgrade/downgrade proofs, load/rate,
  and rollback recovery tests.
- Security and product release review must be complete before normal gameplay
  exposure. Current gate tracking starts in
  `server/world_civilization/release_review.js` and
  `docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md`; release still
  requires approved threat model, privacy review, abuse-case review,
  data-retention policy, audit coverage review, deterministic validation
  evidence, and product signoff.
- Controlled release completion must remain a final go/no-go gate, not an
  automatic enablement path. Current gate tracking starts in
  `server/world_civilization/controlled_release.js` and
  `docs/ops/V6_AGENT_CIVILIZATION_CONTROLLED_RELEASE_RUNBOOK.md`; release still
  requires closed M0-M17 milestones, a closed V6 readiness gate, production
  feature flag safety, rollback/disable rehearsals, privacy-safe observability,
  support readiness, blocker clearance, and an explicit release window.
- Privacy review must prove no private town state, wallet secret, Brain secret,
  provider credential, debug trace, or unapproved transcript enters civic
  surfaces.
- Audit ledger must be durable, replayable, owner-indexed, migration-versioned,
  and covered by restart persistence tests.

## Non-Goals For V5 Hardening

- No thousands of agents.
- No MiroFish/OASIS integration.
- No real public free play.
- No public autonomous agents mutating other users' worlds.
- No player-visible civic mechanics.
