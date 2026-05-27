# V6.0 Agent Civilization Readiness Gate

Status: `research_only`

Milestone plan: `docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md`

V5 promotion gate: `specs/release-gates/v5_world_grid_release_promotion_gate.md`

Civic schema contracts: `specs/55_agent_town_v6_civic_schema_contracts.md`

Civic mutation security foundation:
`specs/70_agent_town_v6_civic_mutation_security_foundation.md`

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

Governance preflight foundation:
`specs/71_agent_town_v6_governance_preflight_foundation.md`

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
- The research-only civic tool exposure gate may exist in
  `server/world_civilization/tool_exposure_gate.js`, but it must keep
  `releaseReady: false`, require `/api/world/tools` as runtime source of truth,
  require OpenClaw Lite worker origin and Worker Tools, Skill Context, Worker
  Traffic, Brain, and Session Context observability, require civic mutation
  security evidence with store-backed delegated-agent proof, scope-mismatch
  coverage, and read-only delegation budget handling, and fail closed if any
  `et.world.civic.*` tool appears in the runtime manifest before M6/M17/M18
  close.
- The research-only civic mutation security envelope may exist in
  `server/world_civilization/mutation_security.js`, but it must stay
  fail-closed, route/tool-hidden, non-executing, and require explicit V6 opt-in,
  same-origin checks, session/wallet auth, actor/owner binding, store-backed
  delegated-agent proof with required scope and remaining budget evidence, CSRF
  verification, idempotency, and owner/surface rate limiting before any future
  civic store write.
- The research-only modal lab surface contract may exist in
  `server/world_civilization/lab_surface.js`, but it must stay route-neutral,
  modal-first, hidden from players, non-executing, fail closed for standalone
  V6 paths, require debug observability before launch, and be covered by
  contract tests.
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
  all replay probes must remain privacy-safe and non-executing. The M16
  research-only resilience readiness gate may also exist in
  `server/world_civilization/resilience.js`, but it must stay hidden,
  non-executing, fail closed, and require explicit restart/replay,
  hash-chain, migration upgrade/downgrade, backup/restore, load/rate,
  rollback, privacy, and no-effect-application evidence while keeping
  `appliesMigration: false`, `appliesRollback: false`,
  `mutatesWorldState: false`, and `executionStatus: "not_executable"`.
- The research-only release review gate may exist in
  `server/world_civilization/release_review.js`, but it must keep V6 hidden
  from runtime/player surfaces until threat model, privacy review, abuse-case
  review, store-backed delegated-agent proof evidence, data-retention policy,
  audit coverage, validation evidence, modal lab surface launch review, and
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
- Proposal lifecycle storage with validated moderation-review transitions,
  `ready_for_vote` and `rejected` terminal readiness states, and replayable
  `proposal.reviewed` audit entries before vote/effect preparation.
- Vote schema with voter authorization, delegation status, eligibility proof,
  one-vote accounting, receipt id, and explicit quorum/approval-threshold policy
  evaluation before effect preparation.
- Civic action schema with proposal reference, execution authority, before/after
  summary, audit ledger entry, and rollback id.
- Institution charter schema with human chartering actor, public scope,
  proposal types, membership and eligibility rules, moderation policy, voting
  rule, and redacted public audit summary.
- Public works contribution schema with institution, project, contributor,
  source reference, requested public resource bundle, idempotency key, and
  redacted public audit summary.

## Release Gates

- Mutating V6 civic routes and worker tools must use a fail-closed security
  envelope before touching civic stores. Current research-only coverage starts
  this in `server/world_civilization/mutation_security.js`; release still
  requires durable/session-bound CSRF, durable/shared rate limits, final
  session/wallet middleware, production browser coverage, audit integration,
  and security/product signoff.
- Worker-first V6 civic tools must pass the exposure gate before becoming
  runtime-callable. Current research-only coverage starts in
  `server/world_civilization/tool_exposure_gate.js`; release still requires
  real OpenClaw Lite worker routing, Worker Traffic evidence, production
  override safety, store-backed delegation proof evidence, delegation
  scope-mismatch coverage, read-only delegation budget handling, browser
  coverage, and release review signoff before any `et.world.civic.*` tool
  appears in `/api/world/tools`.
- Vote authorization cannot be forged, replayed, self-delegated without policy,
  or applied to ineligible owners. Current research-only coverage starts this
  in `server/world_civilization/votes.js` with non-executing
  `evaluateVoteApprovalPolicy()` checks for quorum, minimum approvals, approval
  threshold, abstain quorum handling, and governance-preflight integration;
  release still requires per-institution voting templates, route-edge vote
  authorization, and product/security review of quorum and threshold choices.
- Reputation cannot be self-awarded, transferred as currency, or used without an
  audit trail and dispute path. Current research-only storage starts this in
  `server/world_civilization/reputation.js` with durable reputation records,
  dispute/review records, human dispute requesters, optional required
  moderation-decision links that must match the reputation record source,
  and `reputation.disputed` audit rows; release still requires production
  eligibility/advice integration and privacy/product review.
- Moderation must cover proposal text, attached media, sandbox actions, civic
  effects, public profile surfaces, and agent-authored content. Current
  research-only storage starts this in
  `server/world_civilization/moderation.js` with durable decisions plus
  human review/appeal records, abuse-report source references, and
  `moderation.reviewed`/`moderation.appealed` audit rows; it can also serve as
  the required public-source review link for reputation disputes. Release still
  requires production review tooling, appeals operations, media review, and full
  public-surface integration.
- Rollback must exist for every public civic effect, with clear irreversible
  action exclusions. Current research-only storage starts this in
  `server/world_civilization/effects.js` with prepared-effect records and
  rollback handles only, while `server/world_civilization/schemas.js` enforces a
  schema-level typed effect handler registry that rejects effect/handler
  mismatches before persistence. Research-only governance preflight starts in
  `server/world_civilization/governance_preflight.js` and is called by
  `effects.js` before any prepared effect, rollback record, or audit row is
  written; it requires proposal, proposal review-ready state, vote approval
  policy, moderation, approval receipt, effect preview, rollback-plan,
  delegation proof, and delegation-policy prerequisites to pass. Delegated
  execution cannot be enabled by a loose boolean flag; it must carry matching
  active `civic_execution` delegation proof and still remains blocked until M12
  route/tool enforcement is release-ready.
  The M11 research-only execution gate in
  `server/world_civilization/effects.js` must also require typed apply handler
  evidence, typed rollback handler evidence, real before/after state,
  authorization enforcement, idempotent apply/rollback behavior,
  irreversible-action review, conservation tests,
  `civic_action.applied`/`rollback.applied` audit evidence, and worker/route
  security while keeping `releaseReady: false`, `appliesWorldState: false`, and
  `executionStatus: "not_executable"`.
  Research-only handle reconstruction starts in
  `server/world_civilization/rollback_recovery.js` and
  `tests/world_civilization_rollback_recovery.test.js`. Release still requires
  executable typed handlers, applied/failed states, real rollback execution,
  irreversible-action review, and conservation tests.
- Agent participation must never grant silent authority escalation. Current
  research-only delegation lifecycle storage starts this in
  `server/world_civilization/delegations.js` with scoped delegations,
  idempotent action-budget usage records, and `delegation.action_consumed`
  audit rows; governance preflight now validates delegation proof read-only
  while leaving budget unconsumed and delegated preparation blocked. Release
  still requires worker/tool enforcement, expiry, budget, and revocation checks
  at every route edge, and principal wallet/session authorization. The M12
  research-only enforcement gate in `server/world_civilization/delegations.js`
  must require worker-tool scope enforcement, route-edge scope/expiry/budget/
  revocation checks, principal wallet/session binding, idempotent budget
  consumption, store-backed delegation proof, delegation audit rows, no backend
  shortcuts, and no public autonomous mutation while keeping
  `delegatedExecutionEnabled: false`, `mutatesWorldState: false`, and
  `executionStatus: "not_executable"`.
- Civic institutions must have explicit charters, scopes, eligibility rules,
  voting rules, moderation policies, and public audit summaries before any
  player-visible institution appears. Current research-only storage starts this
  in `server/world_civilization/institutions.js` with public-safe charters plus
  proposal/vote/moderation-gated charter amendment records and
  `institution.charter_amendment.recorded` audit rows; release still requires
  worker/tool integration, applied charter-change execution/rollback,
  release-reviewed templates, and public text rendering review. The M13
  research-only institution readiness gate in
  `server/world_civilization/institutions.js` must require release-reviewed
  charter, membership, eligibility, voting, moderation, proposal-type, public
  audit, public-text, delegation-policy, charter-change execution/rollback,
  private-data exclusion, and institution-audit evidence across all civic
  institution template scopes while keeping `appliesCharterChange: false`,
  `mutatesWorldState: false`, and `executionStatus: "not_executable"`.
- Public works and shared resources must conserve accepted inputs, public
  progress, caps, rewards, and rollbacks across retries and restarts. Current
  research-only accounting starts this in
  `server/world_civilization/public_works.js` with proposal/vote/moderation-gated
  project records plus capped contributions; release still requires
  worker/tool enforcement, wallet/session route auth, explicit
  private-inventory spend, rollback execution, public surfaces, and reward
  conservation tests. The M14 research-only public works readiness gate in
  `server/world_civilization/public_works.js` must require governed project
  review, worker/tool enforcement, wallet/session route authorization, durable
  idempotency, explicit inventory-spend authorization, inventory restart replay,
  resource conservation tests, reward conservation, contribution caps under
  retry, rollback execution review, public text rendering, private-data
  exclusion, public-works audit rows, process restart replay, no private-town
  mutation, and no public free play while keeping
  `opensPublicContributionRoute: false`, `spendsPrivateInventory: false`,
  `grantsRewards: false`, and `executionStatus: "not_executable"`.
- Any internal V6 lab UI must launch from the town hub modal flow, preserve
  page-scoped OpenClaw Lite worker continuity, keep Worker Tools, Skill Context,
  Worker Traffic, Brain, and Session Context observable, and prove with
  Playwright visual coverage that it has no standalone route or normal gameplay
  exposure. Current contract-only coverage in
  `server/world_civilization/lab_surface.js` includes a fail-closed modal launch
  plan for `/v6`, `/v6-lab`, and `/civilization`. The M15 research-only lab
  readiness gate in `server/world_civilization/lab_surface.js` must require
  town-hub modal launch, standalone route denial, worker continuity, debug
  observability, non-executing panels, browser visual coverage at
  390/768/1280 widths, keyboard accessibility, focus trap review,
  screen-reader names, runtime tool absence, private debug-data exclusion, and
  normal gameplay exposure denial while keeping `standaloneRouteAllowed: false`,
  `civicEffectsEnabled: false`, and `executionStatus: "not_executable"`.
  Release still requires real modal UI checks before any player-visible V6 lab
  work.
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
  The M16 research-only resilience readiness gate in
  `server/world_civilization/resilience.js` must require all civic store
  restart probes, audit replay reconstruction, privacy-safe replay summaries,
  hash-chain integrity, migration upgrade/downgrade scripts, unsupported
  transition denial, backup/restore rehearsal, migration load replay rehearsal,
  production load/rate targets, multi-process write contention, duplicate retry
  bursts, rollback handle reconstruction, typed rollback execution recovery,
  private-data exclusion, and no effect application during replay while keeping
  `releaseReady: false`, `appliesMigration: false`,
  `appliesRollback: false`, `mutatesWorldState: false`, and
  `executionStatus: "not_executable"`.
  These current probes cover every current civic store at research scale.
  Release still requires release-grade process restart coverage, larger replay
  reconstruction, migration scripts with upgrade/downgrade proofs, load/rate,
  and rollback recovery tests.
- Security and product release review must be complete before normal gameplay
  exposure. Current gate tracking starts in
  `server/world_civilization/release_review.js` and
  `docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md`; release still
  requires approved threat model, privacy review, abuse-case review,
  store-backed delegation proof and scope-mismatch evidence, data-retention
  policy, audit coverage review, deterministic validation evidence, effect
  execution and rollback review, agent participation enforcement review, civic
  institution readiness review, public works readiness review, modal lab surface
  review, resilience readiness review, and product signoff.
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
