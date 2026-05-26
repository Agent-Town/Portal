# World Grid Mutation Security Plan

Status: release gate, not implemented as a public release control

The V5 world-grid prototype is feature-gated and must remain hidden from normal
gameplay. Mutating world-grid endpoints are not approved for public release
until the controls below are implemented and covered by deterministic tests.

## Current Baseline

- Production feature overrides are ignored unless the request is admin
  authorized by the existing feature-override guard.
- Broad V5 prototype overrides enable V5.0-V5.5 only; the V6.0 Agent
  Civilization research flag requires an explicit `v60` or full flag opt-in and
  still exposes no V6 civic tools.
- Mutating V5.1+ world-grid routes and tool routes reject explicit
  cross-origin `Origin`, `Referer`, or Fetch Metadata. In production they also
  require positive same-origin context before any plot mutation or idempotency
  replay is allowed.
- Mutating V5.1+ world-grid routes and tool routes require an owner-bound
  world-grid CSRF token in production, issued by `/api/world/mutation-token`.
  The token store is process-local and prototype-only.
- V5.1+ mutating world-grid routes require an existing Founders Plot
  prerequisite and return `WORLD_GRID_PLOT_REQUIRED` when missing.
- V5.1+ externally visible mutating prototype routes now require an
  `idempotencyKey` shape at the router boundary and record a process-local
  request hash/success response. Exact retries replay the stored response;
  changed payload reuse returns `IDEMPOTENCY_CONFLICT`. This remains a
  prototype guard, not durable replay-safe persistence. Current Node coverage
  proves exact replay and changed-payload rejection across every externally
  visible V5.1-V5.5 mutating route surface.
- Mutating V5.1+ world-grid routes and tool routes use process-local rate
  buckets keyed by owner and mutation surface. This throttles prototype abuse
  paths but is not durable, distributed, or session-auth aware.
- When `WORLD_GRID_AUDIT_SQLITE_PATH` is configured, successful mutating V5.1+
  world-grid routes and tool routes append durable, hash-chained SQLite audit
  records with actor, surface, idempotency key, request/response hashes,
  redacted summaries, rollback handles when present, and replay indexes.
- V5.0 region rendering and read-only tools may run without creating Founders
  Plot state.
- World-grid prototype stores are process-local and ephemeral; they are not
  release-grade persistence.

## Required Release Controls

- Same-origin enforcement for every mutating world endpoint and tool route.
  Current coverage rejects cross-origin metadata and requires same-origin
  context in production; release promotion still needs integration with the
  final session-auth surface.
- CSRF token protection for browser-authenticated mutations. Current coverage
  verifies missing, invalid, and cross-owner tokens; release promotion still
  needs final session-bound token issuance, expiry/restart behavior, and
  cross-session browser coverage.
- Session-auth and wallet-continuity checks that bind mutations to the current
  owner, not just to a public id or request body field.
- Rate limits keyed by session and owner for public presence, claim planning,
  service requests, event contributions, and sandbox actions. Current coverage
  is owner/surface process-local only; release promotion needs durable or shared
  counters and final session binding.
- Idempotency requirements for every resource-spending or externally visible
  mutation, not only world-event contribution. Release-grade idempotency must
  persist request hashes/responses, reject conflicting retries after restart,
  and prove replay does not create duplicate claims, service requests,
  presence records, rewards, sandbox actions, or resource spends.
- Durable audit records with actor, route/tool name, idempotency key, before and
  after summaries, and rollback handle when one exists. Current coverage starts
  this with append-only SQLite audit records; release promotion still needs
  complete before-state snapshots and full restart replay coverage for each
  world-grid store.
- Restart persistence tests and replay tests before any public release flag is
  enabled.

## Out Of Scope For This Hardening Pass

This pass does not add final session-auth middleware, durable or distributed
rate limits, durable CSRF token storage, or a public free-play security surface.
Those controls remain release gates because the V5 world-grid branch is still
prototype-gated.
