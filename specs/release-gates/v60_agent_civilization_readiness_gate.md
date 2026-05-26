# V6.0 Agent Civilization Readiness Gate

Status: `research_only`

V6.0 Agent Civilization Foundation must not become player-visible until every
gate below has implementation, deterministic tests, and security/product signoff.

## Prerequisites

- V5.0 Region Grid remains gated and deterministic without hidden state creation.
- V5.1 Territory Claims and Settler Routes require existing settlement state,
  owner checks, resource conservation, idempotency, and replay evidence.
- V5.2 Public Presence and Safe Player Discovery has XSS-safe rendering,
  opt-in/out, redaction, abuse reporting, and privacy review.
- V5.3 Civic Service Advice Prototype proves input redaction, output schemas,
  reputation bounds, dispute handling, and no hidden mutation.
- V5.4 World Events and Public Works proves contribution caps, idempotency,
  conservation, reward safety, audit records, and rollback policy.
- V5.5 Controlled Free-Play Sandbox Districts proves typed action moderation,
  rollback, rate limits, privacy boundaries, and no private-town mutation.

## Required V6 Schemas

- Proposal schema with proposer identity, scope, affected public state, effect
  preview, moderation class, expiry, and rollback plan.
- Vote schema with voter authorization, delegation status, eligibility proof,
  one-vote accounting, and receipt id.
- Civic action schema with proposal reference, execution authority, before/after
  summary, audit ledger entry, and rollback id.

## Release Gates

- Vote authorization cannot be forged, replayed, self-delegated without policy,
  or applied to ineligible owners.
- Reputation cannot be self-awarded, transferred as currency, or used without an
  audit trail and dispute path.
- Moderation must cover proposal text, attached media, sandbox actions, civic
  effects, public profile surfaces, and agent-authored content.
- Rollback must exist for every public civic effect, with clear irreversible
  action exclusions.
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
