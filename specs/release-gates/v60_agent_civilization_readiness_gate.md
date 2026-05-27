# V6.0 Agent Civilization Readiness Gate

Status: `research_only`

Milestone plan: `docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md`

V5 promotion gate: `specs/release-gates/v5_world_grid_release_promotion_gate.md`

Runtime readiness gate: `server/world_civilization/readiness_gate.js`

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

`buildV6ReadinessGateReport()` is the research-only aggregate readiness report
for this document. It remains hidden, non-executing, non-mutating, and
`productionEnabled: false`; it can close only with complete approved evidence
for V5 promotion, feature flag safety, civic schemas, audit replay, mutation
security, worker tools, proposal/vote governance, reputation/moderation privacy,
rollback, agent participation, institutions/public works, modal lab,
persistence resilience, and security/product release review.

## Runtime Feature Flag Gate

- `FEATURE_WORLD_V60_AGENT_CIVILIZATION` defaults off.
- Broad V5 prototype overrides such as `all`, `world`, `world_grid`,
  `prototype`, or `prototypes` enable V5.0-V5.5 only and must not enable V6.0.
- Internal V6 research requires an explicit `v60` or
  `FEATURE_WORLD_V60_AGENT_CIVILIZATION` opt-in.
- Production player query/header overrides must not enable V6.0.
- Route-level production coverage proves player `worldGridFeatureFlags=all,v60`
  query/header overrides leave V6.0 disabled when V5 is server-enabled, and a
  server-side V6 flag still does not publish `et.world.civic.*` tools through
  runtime `/api/world/tools`.
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
- The research-only worker runtime registration target may exist in
  `server/world_civilization/worker_runtime_registration.js`, but it must keep
  `releaseReady: false`, register no runtime civic tools, forbid backend
  shortcuts, and require release evidence for browser OpenClaw Lite worker boot,
  runtime manifest sync, civic-tool absence, debug observability, skill context,
  worker traffic, session context, modal lifetime continuity, shared-state route
  adapter traces, and production override denial before M6 can close.
- The research-only worker proposal adapter may exist in
  `server/world_civilization/worker_tool_adapter.js`, but it must stay disabled
  by default behind `V6_CIVIC_WORKER_TOOL_ADAPTER_ENABLED`, require OpenClaw
  Lite origin and Worker Tools/Skill Context/Worker Traffic/Brain/Session
  Context observability, require store-backed `proposal_drafting` delegation and
  M5 mutation security, consume delegated action budget idempotently for
  successful proposal receipts, write only to the internal proposal review
  queue, expose no runtime civic tools, and execute no civic effects.
- The research-only worker vote adapter may exist in
  `server/world_civilization/worker_vote_adapter.js`, but it must stay disabled
  by default behind `V6_CIVIC_WORKER_VOTE_ADAPTER_ENABLED`, require OpenClaw
  Lite origin and Worker Tools/Skill Context/Worker Traffic/Brain/Session
  Context observability, require store-backed `vote_advice` delegation, M5
  mutation security, `worker_tool_vote_surface` route-edge authorization,
  server-attested vote authorization, idempotency, and delegated action-budget
  consumption, record only vote receipts, expose no runtime civic tools, and
  apply no vote outcomes.
- The research-only civic mutation security envelope may exist in
  `server/world_civilization/mutation_security.js`, but it must stay
  fail-closed, route/tool-hidden, non-executing, and require explicit V6 opt-in,
  same-origin checks, session/wallet auth, actor/owner binding, store-backed
  delegated-agent proof with required scope and remaining budget evidence,
  exact same-idempotency delegated-action replay allowance, CSRF verification,
  idempotency, and owner/surface rate limiting before any future civic store
  write.
- The research-only session-auth target report may exist in
  `server/world_civilization/session_auth_targets.js`, but it must keep
  `releaseReady: false`, expose no runtime/player surface, apply no world
  state, and require final evidence for session/wallet continuity,
  session-bound CSRF, delegated-principal binding, provider-disconnect
  invalidation, session-reset invalidation, route/tool middleware integration,
  production browser session coverage, risk-aware rate-limit identity, audit actor continuity,
  and private-data exclusion before M5/M17 can close.
- The research-only proposal submission route may exist in
  `server/world_civilization/routes.js`, but
  `POST /api/world/civilization/proposals/submit` must stay disabled by default
  behind `V6_CIVIC_PROPOSAL_SUBMISSION_ROUTE_ENABLED`, require explicit V6
  feature opt-in, require same-origin and CSRF-reviewed M5 mutation-security
  evidence, consume `proposal_drafting` delegated action budget idempotently
  for hidden worker-tool route receipts, persist no proposal rows on denial,
  reject proposal receipt conflicts before delegated budget consumption,
  expose no runtime civic tools, and fail closed when the default app mount lacks release-grade store wiring. Any
  proposal/audit/delegation SQLite store wiring through
  `server/world_civilization/store_wiring.js` must also stay disabled by default
  behind `V6_CIVIC_PROPOSAL_STORE_WIRING_ENABLED`, require explicit SQLite paths,
  remain `releaseReady: false`, and prove restart persistence without changing
  normal gameplay visibility.
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
  all replay probes must remain privacy-safe and non-executing. The V6 civic
  audit ledger now requires privacy-safe before/after summaries and replay
  reconstruction fails closed when rows are missing them; the resilience
  baseline now aggregates store-specific zero hash-only fallback proof for
  current civic store replay, while manual audit-ledger hash-only fallbacks
  remain research evidence until release replay reconstruction is complete. The M16
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
  review, abuse-case target gate evidence, threat model target gate evidence,
  privacy review target gate evidence, M5 session-auth target evidence,
  store-backed delegated-agent proof evidence, data-retention policy with
  data-retention target gate evidence,
  blocker/exception register evidence,
  release observability handoff,
  audit coverage, CI validation matrix target gate evidence,
  release-candidate target gate evidence, validation target gate evidence,
  validation evidence, modal lab surface launch review, product signoff target
  gate evidence, and product signoff are complete.
- The research-only controlled release gate may exist in
  `server/world_civilization/controlled_release.js` with
  `server/world_civilization/controlled_release_targets.js`, but it must keep
  `productionEnabled: false` until M0-M17 are done, the release-review report is
  ready, an explicit V6 readiness-gate report is closed and hidden until
  controlled release, controlled release target gate evidence,
  readiness audit-summary proof, production-safe flags,
  rollback/disable controls, observability, release observability handoff,
  support runbooks,
  blocker/exception register clearance with no open P0/P1 blockers or expired
  exceptions, blocker clearance, and a controlled release window have approved
  evidence.

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
- Shared V5 audit evidence includes `WORLD_GRID_AUDIT_SQLITE_PATH`
  route/tool-surface restart proof and privacy-safe before/after route
  snapshots with public presence, services, events, and sandbox aggregate
  summaries. V6 readiness still requires complete exact per-record before-state
  reconstruction and release replay reconstruction before public civic effects
  can depend on V5 world state.

## Required V6 Schemas

- Proposal schema with proposer identity, scope, affected public state, effect
  preview, moderation class, expiry, idempotency key, and rollback plan.
- Proposal lifecycle storage with validated moderation-review transitions,
  `ready_for_vote` and `rejected` terminal readiness states, and replayable
  `proposal.reviewed` audit entries before vote/effect preparation.
- Proposal intake cannot become route/tool-callable until
  `buildV6ProposalIntakeReadinessGate()` proves human route submission,
  worker-tool submission, OpenClaw Lite worker origin, Skill Context and Worker
  Traffic observability, mutation-security envelope, same-origin/CSRF/session
  auth, idempotent submission replay, accepted submission-envelope coverage,
  approval-receipt binding, proposal-submission mutation-security binding,
  worker-tool origin enforcement, review-queue index, research-only queue
  snapshot coverage, reviewed/expired proposal queue exclusion,
  moderation-decision link, proposal audit rows, public text privacy review,
  private-data exclusion, no backend shortcuts, no civic tool exposure, and no
  effect execution while keeping `releaseReady: false` and
  `executionStatus: "not_executable"`.
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
  requires applying the durable/session-bound CSRF foundation and current V5
  browser same-wallet cross-session denial plus token rotation/invalidation
  proof plus wallet/provider disconnect invalidation endpoint and mocked
  provider callback evidence to V6 route/tool integration. The M5 session-auth
  target report in `server/world_civilization/session_auth_targets.js` tracks
  final session/wallet middleware, route/tool middleware integration,
  production browser session coverage, risk-aware rate-limit identity, audit actor continuity,
  live Privy/provider logout signoff, durable/shared rate limits, audit
  integration, and security/product signoff.
- Worker-first V6 civic tools must pass the exposure gate before becoming
  runtime-callable. Current research-only coverage starts in
  `server/world_civilization/tool_exposure_gate.js`, with route-level production
  override safety in `tests/world_grid_region.test.js`. Worker runtime
  registration target coverage starts in
  `server/world_civilization/worker_runtime_registration.js` and
  `tests/world_civilization_worker_runtime_registration.test.js`; release still requires
  real OpenClaw Lite worker routing, Worker Traffic evidence, production browser
  coverage, shared-state route traces, store-backed delegation proof evidence, delegation scope-mismatch
  coverage, read-only delegation budget handling, and release review signoff
  before any `et.world.civic.*` tool appears in `/api/world/tools`.
- Vote authorization cannot be forged, replayed, self-delegated without policy,
  or applied to ineligible owners. Current research-only coverage starts this
  in `server/world_civilization/votes.js` with non-executing
  `evaluateVoteApprovalPolicy()` checks for quorum, minimum approvals, approval
  threshold, abstain quorum handling, governance-preflight integration, and
  store-specific privacy-safe audit summaries for proposal/vote records; it now
  includes a non-recording `buildV6VoteRouteAuthorizationEnvelope()` route-edge
  guard that composes the V6 feature gate, explicit research opt-in, M5 mutation
  security, `ready_for_vote` proposal state, human/delegated surface binding,
  eligibility, and no effect application; `server/world_civilization/routes.js`
  mounts a disabled-by-default research-only
  `POST /api/world/civilization/votes/cast` route behind
  `V6_CIVIC_VOTE_ROUTE_ENABLED`, with optional SQLite wiring in
  `server/world_civilization/store_wiring.js` behind
  `V6_CIVIC_VOTE_STORE_WIRING_ENABLED` and `V6_CIVIC_VOTE_SQLITE_PATH`, and it
  consumes `vote_advice` delegated action budget idempotently for hidden
  delegated-agent route receipts and records only vote receipts after the
  route-edge envelope authorizes the request; vote receipt conflicts must be
  rejected before delegated budget consumption; `server/world_civilization/voting_templates.js`
  adds research-only per-institution voting templates plus a
  `buildV6VotingTemplateReviewReport()` that verifies scope coverage,
  route-surface coverage, public-audit text safety, no runtime exposure, no
  effect application, and pending release review before the M8 readiness gate can
  consider template evidence complete;
  the M8 research-only vote authorization readiness gate in
  `server/world_civilization/votes.js` must require server-verified voter
  authorization, eligibility rule verification, one-vote accounting,
  idempotent receipt replay, changed-vote replay rejection, proposal expiry
  denial, delegation policy review, per-institution voting templates,
  route-edge vote auth, quorum/threshold policy, governance-preflight
  integration, vote audit rows, private-data exclusion, and no effect
  application while keeping `releaseReady: false`,
  `appliesVoteOutcome: false`, `mutatesWorldState: false`, and
  `executionStatus: "not_executable"`;
  `server/world_civilization/worker_vote_adapter.js` now provides worker-tool
  vote registration through the route-edge authorization envelope for
  `worker_tool_vote_surface` while staying disabled by default, hidden from
  runtime tools, same-origin/CSRF guarded, store-backed-delegation guarded, and
  receipt-only; release still requires browser worker/runtime registration,
  production browser coverage, release signoff for voting templates, and
  product/security review of quorum and threshold choices.
- Reputation cannot be self-awarded, transferred as currency, or used without an
  audit trail and dispute path. Current research-only storage starts this in
  `server/world_civilization/reputation.js` with durable reputation records,
  dispute/review records, human dispute requesters, optional required
  moderation-decision links that must match the reputation record source,
  privacy-safe before/after audit summaries, and `reputation.disputed` audit
  rows. `buildV6ReputationEligibilityAdviceGate()` adds the M9 research-only
  reputation eligibility advice gate over reviewed eligibility policy, advice
  policy, source-policy coverage for all current reputation kinds, moderation
  dispute linkage, privacy/product review, public-text rendering review,
  private-data exclusion, non-transferability, anti-self-award, bounded deltas,
  duplicate-source protection, human dispute requesters, reputation/dispute
  audit rows, no score mutation, no agent authority grant, no farmable currency,
  no player-visible reputation, and no world mutation while keeping
  `releaseReady: false` and `executionStatus: "not_executable"`; release still
  requires real production eligibility/advice integration and privacy/product
  signoff.
- Moderation must cover proposal text, attached media, sandbox actions, civic
  effects, public profile surfaces, and agent-authored content. Current
  research-only storage starts this in
  `server/world_civilization/moderation.js` with durable decisions plus
  human review/appeal records, abuse-report source references, and
  privacy-safe before/after audit summaries on
  `moderation.reviewed`/`moderation.appealed` audit rows; it can also serve as
  the required public-source review link for reputation disputes.
  `buildV6ModerationPrivacyReadinessGate()` adds the M10 research-only
  moderation privacy readiness gate over proposal text, agent-authored content,
  public profile, attached media, sandbox artifact, public works effect,
  abuse-report triage, appeal operations, human review tooling, redaction,
  public-text rendering, public-presence privacy, private-data exclusion, review
  replay, moderation/appeal audit rows, surface-policy coverage, no moderation
  effect application, no content publication, no runtime exposure, and no
  player-visible moderation while keeping `releaseReady: false` and
  `executionStatus: "not_executable"`. Release still requires production review
  tooling, appeals operations, media review, and full public-surface integration.
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
  route/tool enforcement is release-ready. Prepared-effect audit rows must carry
  privacy-safe before/after summaries with rollback id and no-world-state-applied
  evidence before effect replay can count as release-grade.
  The M11 research-only execution gate in
  `server/world_civilization/effects.js` must also require typed apply handler
  evidence, typed rollback handler evidence, real before/after state,
  authorization enforcement, idempotent apply/rollback behavior,
  irreversible-action review, conservation tests,
  `civic_action.applied`/`rollback.applied` audit evidence, and worker/route
  security while keeping `releaseReady: false`, `appliesWorldState: false`, and
  `executionStatus: "not_executable"`.
  Typed rollback execution target coverage starts in
  `server/world_civilization/rollback_execution_targets.js` and
  `tests/world_civilization_rollback_execution_targets.test.js`; every current
  effect type maps to a future apply handler and required rollback handler, and
  the report rejects executable handlers, execution drills, private row
  payloads, fake release readiness, and world-state application.
  Research-only handle reconstruction starts in
  `server/world_civilization/rollback_recovery.js` and
  `tests/world_civilization_rollback_recovery.test.js`. Release still requires
  executable typed handlers, applied/failed states, real rollback execution,
  irreversible-action review, and conservation tests.
- Agent participation must never grant silent authority escalation. Current
  research-only delegation lifecycle storage starts this in
  `server/world_civilization/delegations.js` with scoped delegations,
  idempotent action-budget usage records, and `delegation.action_consumed`
  audit rows carrying privacy-safe before/after lifecycle summaries; governance
  preflight now validates delegation proof read-only
  while leaving budget unconsumed and delegated preparation blocked, and the
  hidden research proposal/vote routes plus internal worker proposal/vote
  adapters now consume scoped delegated budget idempotently for successful
  receipts. Release
  still requires delegated effect execution integration, browser worker/runtime
  signoff, and principal wallet/session authorization. The M12
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
  `institution.charter_amendment.recorded` audit rows carrying privacy-safe
  before/after charter summaries; release still requires
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
  project records plus capped contributions and privacy-safe before/after
  bundle summaries with no private-inventory/reward execution evidence; release still requires
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
  exposure. Current coverage in `server/world_civilization/lab_surface.js`,
  `server/world_civilization/routes.js`, and `public/app.js` includes a
  fail-closed modal launch plan, a disabled-by-default launch-plan API that
  requires explicit `v6Lab=1`, V6 flag enablement, `/app` route context, debug
  observability, and production admin/QA override authorization, plus a
  DOM-rendered non-executing modal. Current route coverage in
  `e2e/244_v6_lab_modal_boundary.spec.js` proves `/v6`, `/v6-lab`, and
  `/civilization` redirect to `/app` without rendering V6 lab content, normal
  `/app` exposes no `et.world.civic.*` tools by default, and the internal modal
  renders with keyboard containment and screenshots at 390/768/1280 widths. The
  M15 research-only lab
  readiness gate in `server/world_civilization/lab_surface.js` must require
  town-hub modal launch, standalone route denial, worker continuity, debug
  observability, non-executing panels, browser visual coverage at
  390/768/1280 widths, keyboard accessibility, focus trap review,
  screen-reader names, runtime tool absence, private debug-data exclusion, and
  normal gameplay exposure denial while keeping `standaloneRouteAllowed: false`,
  `civicEffectsEnabled: false`, and `executionStatus: "not_executable"`.
  Release still requires product/security signoff before any player-visible V6
  lab work.
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
  `tests/world_civilization_effect_process_restart.test.js` and now proves zero
  hash-only summary fallbacks for prepared-effect replay.
  Delegation process restart coverage starts in
  `tests/world_civilization_delegation_process_restart.test.js` and now proves
  zero hash-only summary fallbacks for delegation lifecycle replay.
  Institution process restart coverage starts in
  `tests/world_civilization_institution_process_restart.test.js` and now proves
  zero hash-only summary fallbacks for institution replay.
  Public-works process restart coverage starts in
  `tests/world_civilization_public_works_process_restart.test.js` and now proves
  zero hash-only summary fallbacks for shared-resource replay.
  Schema metadata coverage starts in
  `tests/world_civilization_schema_metadata.test.js`; current stores stamp
  v1 on-disk metadata and fail closed on unsupported SQLite `user_version` or
  mismatched migration markers.
  Load-rate target coverage starts in
  `server/world_civilization/load_rate_targets.js` and
  `tests/world_civilization_load_rate_targets.test.js`; the release SLO surfaces
  for audit replay, retry bursts, conflict rejection, migration replay,
  write-contention, and future civic route rate limits are explicit while the
  report remains calibration-only and `releaseReady: false`.
  Load/rate research coverage starts in
  `tests/world_civilization_load_rate.test.js`; the audit ledger now has a
  deterministic larger replay pagination and duplicate retry burst check.
  Rollback recovery research coverage starts in
  `tests/world_civilization_rollback_recovery.test.js`; prepared rollback
  handles can be reconstructed from reopened effect/audit stores without
  executing state.
  Rollback execution target coverage starts in
  `server/world_civilization/rollback_execution_targets.js` and
  `tests/world_civilization_rollback_execution_targets.test.js`; the typed
  target matrix is explicit, non-executing, private-row-free, and
  `releaseReady: false`.
  Migration rehearsal coverage starts in
  `server/world_civilization/migration_rehearsal.js` and
  `tests/world_civilization_migration_rehearsal.test.js`; current v1 metadata can
  be inventoried and unsupported upgrade/downgrade targets fail closed without
  executing migration scripts.
  Migration-load replay coverage starts in
  `server/world_civilization/migration_load_replay.js` and
  `tests/world_civilization_migration_load_replay.test.js`; current v1 schema
  inventory is paired with bounded privacy-safe audit replay, row payloads stay
  excluded, no migration scripts execute, and no world state is applied.
  Backup/restore research coverage starts in
  `server/world_civilization/backup_restore.js` and
  `tests/world_civilization_backup_restore.test.js`; closed SQLite civic store
  files are copied into a restore rehearsal directory, source/restored hashes
  and restored schema metadata are verified, report payloads exclude row
  contents, and no world state is applied.
  multi-process write-contention research coverage starts in
  `server/world_civilization/write_contention.js` and
  `tests/world_civilization_write_contention.test.js`; concurrent audit-ledger
  writers serialize before reading the latest hash-chain head, exact duplicate
  retries are suppressed, replay remains privacy-safe, report payloads exclude
  row contents, and no world state is applied.
  The M16 research-only resilience readiness gate in
  `server/world_civilization/resilience.js` must require all civic store
  restart probes, audit replay reconstruction, privacy-safe replay summaries,
  store-specific zero hash-only fallback proof, hash-chain integrity,
  migration upgrade/downgrade scripts, unsupported
  transition denial, backup/restore rehearsal, migration-load replay rehearsal,
  production load-rate target surfaces, multi-process write contention, duplicate retry
  bursts, rollback handle reconstruction, typed rollback execution target
  coverage, typed rollback execution recovery,
  private-data exclusion, and no effect application during replay while keeping
  `releaseReady: false`, `appliesMigration: false`,
  `appliesRollback: false`, `mutatesWorldState: false`, and
  `executionStatus: "not_executable"`.
  These current probes cover every current civic store at research scale.
  Release still requires release-grade process restart coverage, larger replay
  reconstruction, migration scripts with upgrade/downgrade proofs, encrypted
  and point-in-time backup restore drills, route/store load/rate and
  write-contention SLO tests, and rollback recovery tests.
- Security and product release review must be complete before normal gameplay
  exposure. Current gate tracking starts in
  `server/world_civilization/release_review.js` and
  `docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md`; release still
  requires approved threat model, privacy review, abuse-case review,
  abuse-case target gate evidence, store-backed delegation proof and scope-mismatch evidence,
  data-retention policy, audit coverage review,
  deterministic validation evidence with blocker/exception register evidence,
  release observability handoff, CI validation matrix target gate evidence, release-candidate target gate
  evidence, and validation target gate evidence, effect execution and rollback review, agent participation enforcement review,
  civic institution readiness review, public works readiness review,
  modal lab surface review, resilience readiness review with store-specific zero hash-only
  fallback proof, product signoff target gate evidence, and product signoff.
- Controlled release completion must remain a final go/no-go gate, not an
  automatic enablement path. Current gate tracking starts in
  `server/world_civilization/controlled_release.js` and
  `docs/ops/V6_AGENT_CIVILIZATION_CONTROLLED_RELEASE_RUNBOOK.md`; release still
  requires closed M0-M17 milestones, a closed V6 readiness gate, a controlled
  release target gate, an explicit closed readiness-gate report that stays
  hidden until controlled release,
  readiness audit-summary proof, production feature flag safety,
  rollback/disable rehearsals, privacy-safe observability, release observability
  handoff, support readiness,
  blocker/exception register clearance with no open P0/P1 blockers or expired
  exceptions, blocker clearance, and an explicit release window.
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
