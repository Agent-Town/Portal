# Agent Town V6.0 Agent Civilization Foundation

Status: `research_only`

Feature flag: `FEATURE_WORLD_V60_AGENT_CIVILIZATION`

V6.0 starts only after V5 proves world safety, public presence, rollback,
redaction, and retention.

Release gate: `specs/release-gates/v60_agent_civilization_readiness_gate.md`

Milestone plan: `docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md`

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

Modal lab surface foundation:
`specs/66_agent_town_v6_modal_lab_surface_foundation.md`

Governance preflight foundation:
`specs/71_agent_town_v6_governance_preflight_foundation.md`

Persistence replay resilience foundation:
`specs/67_agent_town_v6_persistence_replay_resilience_foundation.md`

Security product release review foundation:
`specs/68_agent_town_v6_security_product_release_review_foundation.md`

Controlled release completion foundation:
`specs/69_agent_town_v6_controlled_release_completion_foundation.md`

## Implementation Boundary

Do not add V6 civic mechanics to normal gameplay or the world-grid prototype
until V5 prototype evidence has been promoted through security, moderation,
retention, reputation, and governance release gates.

The V6 feature flag is explicit and research-only. Broad V5 prototype overrides
such as `WORLD_GRID_FEATURE_FLAGS=all`, `world`, or `prototype` enable V5.0-V5.5
only; they must not enable `FEATURE_WORLD_V60_AGENT_CIVILIZATION` by accident.
Internal V6 research may opt in with `v60` or the full flag name. The
research-only civic tool draft in `server/world_civilization/tools.js` is
non-executing and hidden from runtime `/api/world/tools`; runtime V6 civic
tools and routes remain absent or disabled until the worker-first V6 tool
surface and readiness gate are implemented.

The research-only civic tool exposure gate in
`server/world_civilization/tool_exposure_gate.js` keeps M6 fail-closed. It
requires `/api/world/tools` as the runtime source of truth, OpenClaw Lite worker
origin, Worker Tools/Skill Context/Worker Traffic/Brain/Session Context
observability, the civic mutation security envelope, non-executing draft
metadata, approval/idempotency-bound future mutations, and no public runtime
`et.world.civic.*` tools before any future exposure can proceed.

The research-only civic mutation security envelope in
`server/world_civilization/mutation_security.js` is fail-closed and
non-executing. It requires explicit V6 research opt-in, same-origin checks,
session/wallet auth, actor and owner binding, delegated-agent proof when an
agent actor is used, CSRF verification in production/security-required mode,
idempotency, and owner/surface rate limiting before future routes/tools may
touch civic stores.

The research-only governance preflight in
`server/world_civilization/governance_preflight.js` is called by
`server/world_civilization/effects.js` before prepared effect persistence. It
keeps the M7-M11 chain explicit by requiring an existing active proposal,
matching rollback plan, matching effect preview, approved moderation decision,
approval vote majority, non-delegated execution policy, and an approving vote
receipt before any `civic_action.prepared` row can be written.

The research-only modal lab surface contract in
`server/world_civilization/lab_surface.js` is route-neutral and non-executing.
It does not add a V6 route or normal gameplay surface; it only records the
modal-first, debug-observable constraints that any later internal V6 lab UI must
meet. Its launch-plan contract fails closed for standalone `/v6`, `/v6-lab`, or
`/civilization` paths, broad V5 feature overrides, missing debug tabs, and any
non-town-hub-modal launch surface.

The research-only resilience baseline in
`server/world_civilization/resilience.js` inspects the current SQLite civic
stores and keeps `releaseReady: false` until process restart, replay
reconstruction, migration, load/rate, and rollback recovery gates are proven.
The companion reconstruction helper in
`server/world_civilization/replay_reconstruction.js` rebuilds privacy-safe audit
summaries from replay rows without applying world state.

The research-only release review gate in
`server/world_civilization/release_review.js` names the threat model, privacy,
abuse-case, data-retention, audit coverage, validation, modal lab surface
review, and product signoff requirements that must be complete before normal
gameplay exposure.

The research-only controlled release gate in
`server/world_civilization/controlled_release.js` requires M0-M17 completion,
release-review readiness, production feature flag safety, rollback/disable
controls, observability, support runbooks, blocker clearance, and a controlled
release window before explicit production enablement.

## Goal

Move from many towns to civic systems where humans and agents participate in
auditable institutions.

## Scope

- Civic institutions.
- Public charters.
- Bounded proposals.
- Human approval or doctrine-based delegation.
- Reputation/attestation.
- World history ledger.

## Explicit Prerequisites

- V5.0 Region Grid proves deterministic rendering without creating Founders Plot
  state as a side effect, with optional `WORLD_GRID_REGION_PREFS_SQLITE_PATH`
  restart proof for owner-indexed camera/focus preferences.
- V5.1 Territory Claims and Settler Routes prove existing-plot prerequisites,
  owner checks, resource conservation, idempotency, and replayability.
- V5.2 Public Presence and Safe Player Discovery proves opt-in boundaries,
  XSS-safe rendering, privacy redaction, and reporting/moderation paths.
- V5.3 Civic Service Advice Prototype proves redacted inputs, output schemas,
  bounded reputation, and no hidden mutation.
- V5.4 World Events and Public Works proves contribution caps, audit records,
  reward safety, and rollback policy.
- V5.5 Controlled Free-Play Sandbox Districts proves typed moderation,
  rollback, rate limiting, privacy, no private-town mutation, and optional
  `WORLD_GRID_SANDBOX_SQLITE_PATH` restart proof for sandbox
  participant/action/snapshot/cell state.
- Release-grade world-grid persistence exists with owner indexes, migration
  versioning, audit/replay records, and restart persistence tests.

## Principles

- Agents may propose.
- Humans approve or explicitly delegate.
- Public systems are auditable.
- No agent can silently impose effects on another player's private town.
- Every world-level action has moderation and rollback paths.

## Definition Of Done

- Proposal schema validation passes.
- Vote authorization passes.
- Reputation cannot be self-awarded.
- Proposal effect preview cannot mutate state until accepted and applied through
  explicit rules.
- No private data leaks into public civic surfaces.
- The V6 readiness gate has signed-off coverage for proposal schemas, vote auth,
  reputation, moderation, rollback, privacy, and audit ledger behavior.
