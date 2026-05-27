# Agent Town V6.0 Vote Authorization Foundation

Status: `research_only`

Milestone: `M8 Vote authorization and delegation`

Runtime module: `server/world_civilization/votes.js`

Voting templates: `server/world_civilization/voting_templates.js`

Governance preflight: `server/world_civilization/governance_preflight.js`

Contract tests: `tests/world_civilization_votes.test.js`

## Boundary

This foundation records authorized votes for existing internal V6 proposals. It
does not expose V6 to normal gameplay, decide civic outcomes, execute proposal
effects, or grant agents public mutation authority.

## Vote Recording Rules

- Vote payloads must pass `validateCivicVote`.
- The referenced proposal must already exist in the internal proposal store.
- The proposal must not be expired at vote-recording time.
- The authorization envelope must be server-verified and match the voter.
- The eligibility proof must mark the voter eligible under a named rule.
- A voter can record only one vote per proposal.
- The same voter/idempotency pair can be retried only with identical normalized
  vote content.
- Recording a vote appends exactly one `vote.recorded` audit ledger entry with
  a privacy-safe before/after summary that names the proposal, vote choice,
  receipt, and non-executing outcome boundary without exposing private wallet or
  session material.

## Approval Policy Rules

`server/world_civilization/votes.js` defines a non-executing vote approval
policy evaluator. The default research policy is
`policy_v6_simple_majority_v1`:

- `quorumMinVotes: 1`
- `minApproveVotes: 1`
- `approvalThresholdBps: 5001`
- `countAbstainForQuorum: true`

Internal callers can pass stricter policies with explicit quorum and approval
thresholds. Evaluation returns counts, quorum votes, decisive votes,
approval-basis-points, failure reasons, and `executionStatus:
not_executable`. It does not decide or apply proposal effects.

## Non-Execution Rule

Vote summaries may count approve/reject/abstain choices for auditability, but
they always report `executionStatus: not_executable`. Later milestones must add
moderation, proposal state transitions, release-reviewed voting templates,
execution authority, rollback checks, and release-security controls before any
civic effect can apply.

The current research-only governance preflight consumes vote summaries and vote
receipts before prepared effect persistence. It requires at least one approving
vote, more approvals than rejections, an explicit vote approval policy that
passes quorum/threshold checks, and an execution-authority receipt that matches
an approving vote.

## Route-Edge Authorization Envelope

`buildV6VoteRouteAuthorizationEnvelope()` is the current non-executing route-edge
guard for future V6 vote routes and worker tool surfaces. It does not record a
vote, publish a route, expose runtime tools, apply vote outcomes, or mutate world
state.

The envelope is available only with explicit V6 research opt-in plus
`FEATURE_WORLD_V60_AGENT_CIVILIZATION`. It composes:

- the M5 civic mutation-security envelope;
- supported route surfaces: `human_vote_route`, `delegated_agent_vote_route`,
  and `worker_tool_vote_surface`;
- `validateCivicVote`;
- an existing proposal that has reached `ready_for_vote`;
- proposal expiry denial;
- route-specific authorization kind checks;
- human actor binding for human vote routes;
- store-backed `vote_advice` delegation proof for delegated agent and worker
  tool vote surfaces;
- eligibility proof; and
- a hard non-recording, no-effect-application boundary.

`assertV6VoteRouteAuthorizationEnvelopeSafe()` fails closed if the envelope ever
claims runtime exposure, player visibility, vote recording, world mutation,
private-data exposure, outcome application, or executable behavior.

## Research Vote Route

`server/world_civilization/routes.js` mounts
`POST /api/world/civilization/votes/cast` as a disabled-by-default research
route. It is available only when `V6_CIVIC_VOTE_ROUTE_ENABLED=1`, the V6 feature
flag is enabled, and explicit vote stores are provided directly or through
`server/world_civilization/store_wiring.js` with
`V6_CIVIC_VOTE_STORE_WIRING_ENABLED=1`,
`V6_CIVIC_AUDIT_SQLITE_PATH`, `V6_CIVIC_PROPOSAL_SQLITE_PATH`, and
`V6_CIVIC_VOTE_SQLITE_PATH`.

The route builds the M5 civic mutation-security envelope, passes the vote
through `buildV6VoteRouteAuthorizationEnvelope()`, consumes `vote_advice`
delegated action budget idempotently for delegated-agent route receipts, and
records a vote receipt only after the route-edge envelope authorizes the
request. Vote receipt conflicts are rejected before delegated budget is
consumed. It supports the hidden human and delegated-agent vote route surfaces. The
`worker_tool_vote_surface` remains reserved for the OpenClaw Lite worker adapter
and is not HTTP-route callable. The route fails closed without
same-origin/CSRF-reviewed session and wallet evidence, and does not publish
runtime tools, apply vote outcomes, expose player-visible UI, mutate private
town state, or execute proposal effects.

## Worker Vote Adapter

`server/world_civilization/worker_vote_adapter.js` is the internal
research-only worker adapter for `et.world.civic.votes.cast`. It is disabled by
default behind `V6_CIVIC_WORKER_VOTE_ADAPTER_ENABLED=1` plus explicit V6
research opt-in and is not registered in runtime `/api/world/tools`.

`castVoteFromWorkerTool()` requires:

- OpenClaw Lite worker origin and no backend shortcut.
- Worker Tools, Skill Context, Worker Traffic, Brain, and Session Context
  observability.
- Same-origin/CSRF-reviewed M5 mutation-security evidence.
- Store-backed `vote_advice` delegation bound to the session owner and worker
  agent.
- A `ready_for_vote` proposal.
- Server-attested delegation vote authorization, eligibility proof, and
  idempotency key.
- `buildV6VoteRouteAuthorizationEnvelope()` authorization for
  `worker_tool_vote_surface`.
- Idempotent delegated action-budget consumption for successful vote receipts;
  exact replays return the existing vote and usage row, while a distinct vote
  is denied once the delegation budget is exhausted.

The worker adapter records only a vote receipt. It does not apply vote outcomes,
execute proposal effects, publish V6 civic tools, expose player-visible UI,
mutate private towns, or mutate another user's world. Denied envelopes preserve
the underlying mutation-security reason, such as `CSRF_REQUIRED`, for internal
debugging without exposing the tool to normal gameplay.

## Voting Template Review

`server/world_civilization/voting_templates.js` defines research-only
per-institution voting templates for:

- `public_world`
- `public_works`
- `sandbox_policy`
- `institution_charter`
- `service_policy`

Each template names proposal types, voting rule id, eligibility rule id,
moderation policy id, `vote_advice` delegation scope, supported vote route
surfaces, supported authorization kinds, and an explicit approval policy. The
templates remain `not_executable`, not player-visible, not runtime-exposed, and
marked `pending_release_review`.

`buildV6VotingTemplateReviewReport()` verifies scope coverage, template
contracts, route-surface coverage, public-audit text safety, no runtime
exposure, no effect application, and release-review-pending status. The M8 vote
authorization readiness gate consumes this report before it can consider
`votingTemplatesReviewed` true.

## M8 Readiness Gate

`buildV6VoteAuthorizationReadinessGate()` records the non-executing M8 vote
authorization readiness gate. It is available only with explicit V6 research
opt-in and remains hidden from runtime/player surfaces.

The gate requires signed evidence for server-verified voter authorization,
eligibility rule verification, one-vote accounting, idempotent receipt replay,
changed-vote replay rejection, proposal expiry denial, delegation policy
review, per-institution voting templates, route-edge vote auth,
quorum/threshold policy, governance-preflight integration, vote audit rows,
private-data exclusion, and no effect application.

The required route surfaces are `human_vote_route`,
`delegated_agent_vote_route`, and `worker_tool_vote_surface`. Missing any of
those keeps the report fail-closed. Even with complete evidence, the gate keeps
`releaseReady: false`, `appliesVoteOutcome: false`,
`mutatesWorldState: false`, and `executionStatus: not_executable` until V6
release review and controlled release complete.

## Delegation Boundary

The vote schema accepts a `server_attested_delegation` authorization kind, but
vote recording still requires server verification before persistence.

Delegation lifecycle storage starts in
`server/world_civilization/delegations.js`, but vote routes/tools must not trust
delegation references until M12 worker/tool enforcement, action-budget
consumption, expiry checks, revocation checks, and route-edge authorization are
implemented and tested. The current research vote route uses store-backed
`vote_advice` proof for delegated-agent vote receipts, and the internal worker
vote adapter uses the same store-backed `vote_advice` proof plus the
`worker_tool_vote_surface` route-edge envelope before recording any receipt.
