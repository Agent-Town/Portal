# Agent Town V6.0 Agent Civilization Foundation

Status: `research_only`

Feature flag: `FEATURE_WORLD_V60_AGENT_CIVILIZATION`

V6.0 starts only after V5 proves world safety, public presence, rollback,
redaction, and retention.

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
