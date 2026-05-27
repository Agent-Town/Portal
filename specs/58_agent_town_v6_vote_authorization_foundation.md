# Agent Town V6.0 Vote Authorization Foundation

Status: `research_only`

Milestone: `M8 Vote authorization and delegation`

Runtime module: `server/world_civilization/votes.js`

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
- Recording a vote appends exactly one `vote.recorded` audit ledger entry.

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

## Delegation Boundary

The vote schema accepts a `server_attested_delegation` authorization kind, but
vote recording still requires server verification before persistence.

Delegation lifecycle storage starts in
`server/world_civilization/delegations.js`, but vote routes/tools must not trust
delegation references until M12 worker/tool enforcement, action-budget
consumption, expiry checks, revocation checks, and route-edge authorization are
implemented and tested.
