# Agent Town V6 Civic Mutation Security Foundation

Status: `research_only`

Milestone: M5 Mutation security controls

Runtime contract: `server/world_civilization/mutation_security.js`

Security plan: `docs/security/V6_CIVIC_MUTATION_SECURITY_PLAN.md`

Test coverage: `tests/world_civilization_mutation_security.test.js`

## Boundary

This foundation defines the fail-closed security envelope that future V6 civic
mutation routes or worker tools must satisfy before they call civic stores. It
does not add routes, expose V6 tools, create player-visible civic mechanics, or
apply civic effects.

The envelope is research-only and non-executing. It records whether a future
mutation request would be allowed to reach a store, but the current contract
still returns `mutationApplied: false` and keeps V6 hidden from runtime/player
surfaces.

## Required Checks

- Explicit `FEATURE_WORLD_V60_AGENT_CIVILIZATION` enablement.
- Explicit internal research mutation opt-in.
- same-origin checks for request context, reusing the V5 world-grid
  mutation-origin guard.
- Authenticated session account.
- Server-verified wallet/session binding.
- Actor binding to the authenticated account, or store-backed delegated-agent
  proof for an agent actor.
- Delegated-agent proof requires a matching active delegation id, principal,
  delegate agent, approval receipt, route/tool-required scope, and remaining
  action budget. The envelope reads proof but does not consume budget.
- CSRF verification in production/security-required mode.
- Route/tool idempotency key with the V6 civic mutation format.
- owner/surface rate limiting using the existing world-grid prototype bucket
  shape.
- Runtime-hidden, player-hidden, production-disabled, non-executing status.

## Release Gate

M5 cannot move to `done` until:

- every mutating V6 civic route and worker tool calls this envelope or a
  release-reviewed successor before touching civic stores;
- CSRF verification is backed by durable/session-bound token issuance;
- rate limiting is durable or shared across production instances;
- idempotency is bound to the final session/wallet authorization model;
- security coverage includes browser same-origin, stale-session, cross-wallet,
  delegated-agent proof, scope mismatch, retry, and rate-limit cases;
- audit/replay records are written after successful authorized mutations;
- the M17 release review approves the final route/tool security surface.
