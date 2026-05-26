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
  preview, moderation class, expiry, idempotency key, and rollback plan.
- Vote schema with voter authorization, delegation status, eligibility proof,
  one-vote accounting, and receipt id.
- Civic action schema with proposal reference, execution authority, before/after
  summary, audit ledger entry, and rollback id.

## Release Gates

- Vote authorization cannot be forged, replayed, self-delegated without policy,
  or applied to ineligible owners.
- Reputation cannot be self-awarded, transferred as currency, or used without an
  audit trail and dispute path. Current research-only storage starts this in
  `server/world_civilization/reputation.js`; release still requires full
  dispute/review workflows and documented civic eligibility/advice use.
- Moderation must cover proposal text, attached media, sandbox actions, civic
  effects, public profile surfaces, and agent-authored content. Current
  research-only storage starts this in
  `server/world_civilization/moderation.js`; release still requires appeals,
  human-review workflow, abuse-report handling, media review, and full
  public-surface integration.
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
