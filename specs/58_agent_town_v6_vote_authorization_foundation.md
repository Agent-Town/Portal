# Agent Town V6.0 Vote Authorization Foundation

Status: `research_only`

Milestone: `M8 Vote authorization and delegation`

Runtime module: `server/world_civilization/votes.js`

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

## Non-Execution Rule

Vote summaries may count approve/reject/abstain choices for auditability, but
they always report `executionStatus: not_executable`. Later milestones must add
moderation, proposal state transitions, quorum/threshold rules, execution
authority, rollback checks, and release-security controls before any civic
effect can apply.

## Delegation Boundary

The vote schema accepts a `server_attested_delegation` authorization kind, but
vote recording still requires server verification before persistence.

Delegation lifecycle storage starts in
`server/world_civilization/delegations.js`, but vote routes/tools must not trust
delegation references until M12 worker/tool enforcement, action-budget
consumption, expiry checks, revocation checks, and route-edge authorization are
implemented and tested.
