# World Grid Mutation Security Plan

Status: release gate, not implemented as a public release control

The V5 world-grid prototype is feature-gated and must remain hidden from normal
gameplay. Mutating world-grid endpoints are not approved for public release
until the controls below are implemented and covered by deterministic tests.

## Current Baseline

- Production feature overrides are ignored unless the request is admin
  authorized by the existing feature-override guard.
- V5.1+ mutating world-grid routes require an existing Founders Plot
  prerequisite and return `WORLD_GRID_PLOT_REQUIRED` when missing.
- V5.0 region rendering and read-only tools may run without creating Founders
  Plot state.
- World-grid prototype stores are process-local and ephemeral; they are not
  release-grade persistence.

## Required Release Controls

- Same-origin enforcement for every mutating world endpoint and tool route.
- CSRF protection for browser-authenticated mutations, with tests for missing,
  stale, and cross-session tokens.
- Session-auth and wallet-continuity checks that bind mutations to the current
  owner, not just to a public id or request body field.
- Rate limits keyed by session and owner for public presence, claim planning,
  service requests, event contributions, and sandbox actions.
- Idempotency requirements for every resource-spending or externally visible
  mutation, not only world-event contribution.
- Durable audit records with actor, route/tool name, idempotency key, before and
  after summaries, and rollback handle when one exists.
- Restart persistence tests and replay tests before any public release flag is
  enabled.

## Out Of Scope For This Hardening Pass

This pass does not add a broad CSRF/session middleware or public free-play
security surface. Those controls remain release gates because the V5 world-grid
branch is still prototype-gated.
