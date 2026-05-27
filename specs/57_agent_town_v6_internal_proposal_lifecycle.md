# Agent Town V6.0 Internal Proposal Lifecycle

Status: `research_only`

Milestone: `M7 Internal proposal lifecycle`

Runtime module: `server/world_civilization/proposals.js`

Governance preflight: `server/world_civilization/governance_preflight.js`

Contract tests: `tests/world_civilization_proposals.test.js`

## Boundary

This lifecycle drafts and stores bounded civic proposals. It does not expose V6
to normal gameplay, render player-visible civic institutions, execute civic
effects, count votes, or authorize autonomous public agent action.

## Drafting Rules

- Proposal payloads must pass `validateCivicProposal`.
- Proposal effects must remain `preview_only`.
- Proposal creation requires an idempotency key.
- Expired proposals are rejected before persistence.
- Private data, Brain/debug traces, provider credentials, wallet secrets, and
  secret-like text are rejected before persistence.
- Drafted proposals start with status `drafted`.
- Drafted proposals start with moderation status `needs_review`.
- Drafting appends exactly one `proposal.created` audit ledger entry.

## Idempotency Rule

Repeating the same proposer account and idempotency key with the same normalized
proposal returns the existing draft and does not append another audit record.
Changing content with the same proposer/idempotency pair fails with
`CIVIC_PROPOSAL_IDEMPOTENCY_CONFLICT`.

## Non-Execution Rule

The proposal store intentionally has no apply or execute method. Later V6
milestones must add vote authorization, moderation decisions, execution
authority, rollback, and audit checks before any civic effect can be applied.

The current research-only governance preflight consumes proposal records before
prepared effect persistence. It requires an existing, non-expired proposal whose
effect preview and rollback plan match the proposed civic action.

## Worker-First Rule

Agent-authored proposals may be stored only after a later worker/tool integration
routes them through OpenClaw Lite and preserves Worker Tools, Skill Context,
Worker Traffic, Brain, and Session Context observability.
