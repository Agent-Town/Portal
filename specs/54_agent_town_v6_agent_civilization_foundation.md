# Agent Town V6.0 Agent Civilization Foundation

Status: `research_only`

Feature flag: `FEATURE_WORLD_V60_AGENT_CIVILIZATION`

V6.0 starts only after V5 proves world safety, public presence, rollback,
redaction, and retention.

Release gate: `specs/release-gates/v60_agent_civilization_readiness_gate.md`

Milestone plan: `docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md`

Civic schema contracts: `specs/55_agent_town_v6_civic_schema_contracts.md`

Civic audit ledger foundation: `specs/56_agent_town_v6_audit_ledger_foundation.md`

## Implementation Boundary

Do not add V6 civic mechanics to normal gameplay or the world-grid prototype
until V5 prototype evidence has been promoted through security, moderation,
retention, reputation, and governance release gates.

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
  state as a side effect.
- V5.1 Territory Claims and Settler Routes prove existing-plot prerequisites,
  owner checks, resource conservation, idempotency, and replayability.
- V5.2 Public Presence and Safe Player Discovery proves opt-in boundaries,
  XSS-safe rendering, privacy redaction, and reporting/moderation paths.
- V5.3 Civic Service Advice Prototype proves redacted inputs, output schemas,
  bounded reputation, and no hidden mutation.
- V5.4 World Events and Public Works proves contribution caps, audit records,
  reward safety, and rollback policy.
- V5.5 Controlled Free-Play Sandbox Districts proves typed moderation,
  rollback, rate limiting, privacy, and no private-town mutation.
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
