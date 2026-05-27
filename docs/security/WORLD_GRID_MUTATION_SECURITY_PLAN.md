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
  By default the token store is process-local. When
  `WORLD_GRID_CSRF_SQLITE_PATH` is configured, the guard writes durable SQLite
  `world_grid_csrf_tokens` rows with owner-bound token hashes, hashed
  `session_binding_hash` metadata when the runtime identity includes a session
  id, expiry, schema/migration metadata, and restart replay. Current coverage
  proves hashed token rows survive reopen, cross-owner, cross-session, and
  expired tokens fail closed, and a production mutating route accepts a valid
  token after a separate Node process restart. `WORLD_GRID_CSRF_REQUIRED=1`
  Playwright coverage in
  `e2e/243_world_grid_csrf_session_binding.spec.js` now proves a token issued
  to one browser session cannot mutate the same wallet region from another
  browser session while a same-session token succeeds. Release promotion still
  needs wallet/session continuity review.
- CSRF token issuance now rotates old tokens for the same owner/session binding,
  and `invalidateWorldGridCsrfTokens()` supports explicit session-token
  invalidation for session lifecycle cleanup. `/api/session/reset` now calls
  the invalidation hook before rotating the human session cookie.
  `/api/session/world-grid-csrf/invalidate` lets wallet/provider disconnect
  cleanup invalidate the current owner/session token without resetting the
  whole session through the same explicit cross-origin rejection guard, and
  `public/app.js` calls it before clearing local wallet identity. Current
  coverage proves rotation and explicit invalidation for both process-local and
  optional SQLite stores, browser coverage proves a pre-reset same-wallet token
  is rejected after session reset, and Playwright coverage proves the disconnect
  invalidation endpoint and mocked provider disconnect callback path reject the
  old token before a new same-session token succeeds.
- V5.1+ mutating world-grid routes require an existing Founders Plot
  prerequisite and return `WORLD_GRID_PLOT_REQUIRED` when missing.
- V5.1+ externally visible mutating prototype routes now require an
  `idempotencyKey` shape at the router boundary and record a process-local
  request hash/success response. Exact retries replay the stored response;
  changed payload reuse returns `IDEMPOTENCY_CONFLICT`. This remains a
  prototype guard, not durable replay-safe persistence. Current Node coverage
  proves exact replay and changed-payload rejection across every externally
  visible V5.1-V5.5 mutating route surface.
- When `WORLD_GRID_IDEMPOTENCY_SQLITE_PATH` is configured, the same router-level
  guard writes durable SQLite idempotency rows with request hashes, stored
  success responses, schema/migration versions, and conflict detection. Current
  restart coverage proves a planned-claim retry replays after a separate Node
  process restart without recreating process-local claim state, then proves
  exact replay and changed-payload conflict rejection across every externally
  visible V5.1-V5.5 mutating route and tool surface after separate Node process
  restarts.
- When `WORLD_GRID_CLAIMS_SQLITE_PATH` is configured, V5.1 claim state writes
  durable SQLite `world_grid_claims` rows with owner, status, cell, schema, and
  migration metadata. Current restart coverage proves a planned claim reopens
  after a separate Node process restart, completes from durable claim state,
  reopens again as a claimed route, rejects a different owner mutating the
  persisted claim region, and removes durable rows on cancel after restart.
- When `WORLD_GRID_PUBLIC_PRESENCE_SQLITE_PATH` is configured, V5.2 public
  presence, follow, and abuse-report state writes durable SQLite rows with
  owner, reporter, public-town, status, schema, and migration metadata. Current
  restart coverage proves opt-in, listing, lookup, follow, summary, report, and
  opt-out behavior across separate Node process lifetimes, including inbound
  follow cleanup when a town opts out, one abuse report per reporter/town,
  self-report rejection, and private-looking report text redaction.
- When `WORLD_GRID_SERVICES_SQLITE_PATH` is configured, V5.3 civic service
  request and reputation state writes durable SQLite rows with owner, service,
  status, schema, and migration metadata. Current restart coverage proves
  redacted advice requests, accepted/reported request state, reputation counter
  replay, and duplicate accept/report safety across separate Node process
  lifetimes without leaking forbidden service inputs.
- When `WORLD_GRID_EVENTS_SQLITE_PATH` is configured, V5.4 world-event
  contribution and reward state writes durable SQLite rows with owner, event,
  day, settlement, schema, and migration metadata. Current restart coverage
  proves contribution totals, reward claims, cap replay, and duplicate
  contribution/reward safety across separate Node process lifetimes.
- When `WORLD_GRID_SANDBOX_SQLITE_PATH` is configured, V5.5 controlled sandbox
  state writes durable SQLite rows with participant, action, rollback snapshot,
  cell, schema, and migration metadata. Current restart coverage proves
  redacted participants, moderated actions, rejected actions, rollback
  snapshots, cell props, leave state, and private-town isolation across separate
  Node process lifetimes.
- Mutating V5.1+ world-grid routes and tool routes use rate buckets keyed by
  owner and mutation surface. By default those buckets are process-local. When
  `WORLD_GRID_RATE_LIMIT_SQLITE_PATH` is configured, the same guard writes
  durable SQLite `world_grid_rate_limit_buckets` rows with owner/surface keys,
  count, reset timestamp, schema/migration metadata, and restart replay. Current
  restart coverage proves the durable counter blocks mutating routes across
  separate Node process restarts. Release promotion still needs final session
  binding plus IP/risk-aware production sharing.
- When `WORLD_GRID_AUDIT_SQLITE_PATH` is configured, successful mutating V5.1+
  world-grid routes and tool routes append durable, hash-chained SQLite audit
  records with actor, surface, idempotency key, request/response hashes,
  redacted summaries, rollback handles when present, and replay indexes. Current
  restart coverage proves every externally visible V5.1-V5.5 mutating route and
  tool surface writes a durable audit row after separate Node process restarts,
  exact idempotent replays do not add duplicate audit rows, changed-payload
  conflicts add no audit rows, and private-looking service secrets stay out of
  audit entries.
- V5.0 region rendering and read-only tools may run without creating Founders
  Plot state.
- When `WORLD_GRID_REGION_PREFS_SQLITE_PATH` is configured, V5.0 camera/focus
  preferences write durable SQLite `world_grid_region_preferences` rows with
  owner, region, selected-cell, camera, schema, and migration metadata. Current
  restart coverage proves selected-cell and camera preferences reopen across
  separate Node process lifetimes and do not leak to another owner.
- World-grid prototype stores are process-local and ephemeral unless an
  explicit optional SQLite foundation path is configured; none are release-grade
  persistence yet.

## Required Release Controls

- Same-origin enforcement for every mutating world endpoint and tool route.
  Current coverage rejects cross-origin metadata and requires same-origin
  context in production; release promotion still needs integration with the
  final session-auth surface.
- CSRF token protection for browser-authenticated mutations. Current coverage
  verifies missing, invalid, cross-owner, cross-session, expired, and durable
  restart tokens plus browser same-wallet cross-session denial, same-session
  token rotation, explicit invalidation, and session-reset invalidation wiring;
  wallet/provider disconnect cleanup now has an explicit invalidation endpoint
  and client disconnect hook with mocked provider disconnect callback coverage;
  release promotion still needs final session-auth integration, live
  Privy/provider logout signoff, and wallet/session continuity review.
- Session-auth and wallet-continuity checks that bind mutations to the current
  owner, not just to a public id or request body field.
- Rate limits keyed by session and owner for public presence, claim planning,
  service requests, event contributions, and sandbox actions. Current coverage
  is owner/surface process-local only; release promotion needs durable or shared
  counters and final session binding.
- Idempotency requirements for every resource-spending or externally visible
  mutation, not only world-event contribution. Current durable idempotency
  coverage starts this with SQLite-backed planned-claim replay after restart and
  now covers every externally visible V5.1-V5.5 mutating route and tool surface
  after restart. Release-grade idempotency must also be bound to the final
  session/wallet-auth model and production same-origin/CSRF controls.
- Durable audit records with actor, route/tool name, idempotency key, before and
  after summaries, and rollback handle when one exists. Current coverage starts
  this with append-only SQLite audit records and route/tool-surface restart
  matrix proof; release promotion still needs complete before-state snapshots
  and release replay reconstruction for each world-grid store.
- Restart persistence tests and replay tests before any public release flag is
  enabled.
- Current `WORLD_GRID_REGION_PREFS_SQLITE_PATH` coverage is a V5.0 storage
  foundation only; release promotion still needs final browser-session
  continuity, stale-session coverage, and production replay coverage.
- Current `WORLD_GRID_CLAIMS_SQLITE_PATH` coverage is a V5.1 storage foundation
  only; release promotion still needs stale-session handling, final production
  session-auth coverage, release replay reconstruction, and public-surface store
  persistence coverage.
- Current `WORLD_GRID_PUBLIC_PRESENCE_SQLITE_PATH` coverage is a V5.2 storage
  foundation only; release promotion still needs stale-session handling,
  retention policy, moderation workflow integration, and final public-privacy
  review coverage.
- Current `WORLD_GRID_SERVICES_SQLITE_PATH` coverage is a V5.3 storage
  foundation only; release promotion still needs stale-session, dispute workflow,
  retention, and final service privacy review coverage.
- Current `WORLD_GRID_EVENTS_SQLITE_PATH` coverage is a V5.4 storage foundation
  only; release promotion still needs rollback policy, multi-event migration,
  final public-ledger review, and larger contribution-load coverage.
- Current `WORLD_GRID_CSRF_SQLITE_PATH` coverage is a mutation security
  foundation only; the current browser session-binding proof covers
  same-wallet cross-session token reuse denial, and the current store coverage
  proves same-session token rotation plus explicit invalidation. Session reset
  and wallet/provider disconnect cleanup now invalidate current-session
  world-grid tokens, including the mocked provider callback path. Release
  promotion still needs final session-auth integration, live Privy/provider
  logout signoff, and wallet/session continuity review.
- Current `WORLD_GRID_RATE_LIMIT_SQLITE_PATH` coverage is a mutation security
  foundation only; release promotion still needs final browser-session binding,
  wallet/session continuity, IP/risk-aware production sharing, and operational
  tuning for public traffic.
- Current `WORLD_GRID_SANDBOX_SQLITE_PATH` coverage is a V5.5 storage
  foundation only; release promotion still needs abuse reports, stale-session
  cleanup, cross-owner moderation review, and final sandbox privacy coverage.

## Out Of Scope For This Hardening Pass

This pass does not add final session-auth middleware, IP/risk-aware distributed
rate limits, live Privy/provider logout signoff, or a public free-play security
surface. Those controls remain release gates because the V5 world-grid branch
is still prototype-gated.
