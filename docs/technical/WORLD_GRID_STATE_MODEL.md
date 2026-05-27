# World Grid State Model

Status: prototype persistence model, not release-grade storage

## Boundary

The world grid is server-authoritative. Three.js renders cells, settlement
nodes, routes, and focus state; it does not own simulation or mutation.

## Core Entities

- `WorldRegion`: private region owned by one account/wallet identity.
- `WorldCell`: deterministic terrain/state cell.
- `SettlementNode`: visible settlement marker.
- `RouteEdge`: planned/open/blocked connection between settlements.
- `TerritoryClaim`: V5.1+ claim workflow record.
- `PublicTownPresence`: V5.2+ public-safe town summary.

## Identity

Private region APIs resolve owner identity from the same account/wallet
continuity model as Founders Plot. Public APIs use redacted public IDs and must
not leak private owner identifiers.

## Mutation Rules

- V5.0 has no region mutation beyond focus/camera preferences.
- V5.1 claims require adjacency, an existing Founders Plot prerequisite, and
  resource conservation.
- Public presence and world events are separate from private town simulation.
- Renderer actions must be idempotent or read-only unless routed through typed
  server tools.
- Mutating routes/tools require same-origin mutation context in production and
  reject explicit cross-origin metadata before plot or world state changes.
- Mutating routes/tools require an owner-bound world-grid CSRF token in
  production.
- Mutating routes/tools consume prototype rate-limit buckets keyed by owner and
  mutation surface.

## Prototype Persistence Boundary

The V5 world-grid implementation is intentionally prototype/ephemeral unless a
release-grade store is explicitly implemented and tested. Current stores are:

| Store | Current implementation | Release status |
| --- | --- | --- |
| Region generation | Deterministic synthesis from owner identity in `server/world_grid/region.js` | Prototype, recomputed on demand |
| Camera/focus preferences | Process-local `Map` in `server/world_grid/preferences.js`; optional SQLite `world_grid_region_preferences` table when `WORLD_GRID_REGION_PREFS_SQLITE_PATH` is configured | Durable foundation for V5.0 camera/focus state, owner/region indexes, schema/migration versions, and restart proof; release promotion still needs final browser-session preference continuity and production replay coverage |
| Territory claims | Process-local `Map` in `server/world_grid/claims.js`; optional SQLite `world_grid_claims` table when `WORLD_GRID_CLAIMS_SQLITE_PATH` is configured | Durable foundation for planned/claimed V5.1 claim state, cancel cleanup, owner/status/cell indexes, schema/migration versions, restart proof, and cross-owner route-mutation denial; release promotion still needs final replay reconstruction, stale-session coverage, and production session-auth coverage |
| Public presence/follows/reports | Process-local `Map` values in `server/world_grid/public_presence.js`; optional SQLite `world_grid_public_presence`, `world_grid_public_follows`, and `world_grid_public_abuse_reports` tables when `WORLD_GRID_PUBLIC_PRESENCE_SQLITE_PATH` is configured | Durable foundation for V5.2 opt-in/list/lookup/follow/opt-out/report state, owner/town/reporter indexes, schema/migration versions, restart proof, inbound follow cleanup on opt-out, and private-text redaction in abuse reports; release promotion still needs stale-session coverage, retention policy, and final public privacy review |
| Civic service requests/reputation | Process-local `Map` values in `server/world_grid/services.js`; optional SQLite `world_grid_service_requests` and `world_grid_service_reputation` tables when `WORLD_GRID_SERVICES_SQLITE_PATH` is configured | Durable foundation for V5.3 request/accept/report state, owner/service/status indexes, service reputation counters, schema/migration versions, restart proof, and duplicate accept/report safety after reopen; release promotion still needs dispute workflow, stale-session coverage, and final privacy review |
| World event contributions/rewards | Process-local `Map` values in `server/world_grid/events.js`; optional SQLite `world_grid_event_contributions` and `world_grid_event_rewards` tables when `WORLD_GRID_EVENTS_SQLITE_PATH` is configured | Durable foundation for V5.4 contribution/reward state, owner/event/day/settlement indexes, cap replay, schema/migration versions, restart proof, and duplicate contribution/reward safety after reopen; release promotion still needs rollback policy, multi-event migration coverage, and final public ledger review |
| Sandbox participants/actions/snapshots/cells | Process-local arrays/maps and mutable in-memory district cells in `server/world_grid/sandbox.js`; optional SQLite `world_grid_sandbox_participants`, `world_grid_sandbox_actions`, `world_grid_sandbox_snapshots`, and `world_grid_sandbox_cells` tables when `WORLD_GRID_SANDBOX_SQLITE_PATH` is configured | Durable foundation for V5.5 participant/action/snapshot/cell state, participant owner key plus action/cell indexes, schema/migration versions, restart proof, moderation rejection replay, rollback replay, and private-town isolation; release promotion still needs abuse reports, cross-owner moderation review, stale-session cleanup, and final sandbox privacy review |
| Idempotency replay records | Process-local `Map` in `server/world_grid/idempotency.js`; optional SQLite `world_grid_idempotency_records` table when `WORLD_GRID_IDEMPOTENCY_SQLITE_PATH` is configured | Durable foundation for exact retry replay, changed payload rejection, schema/migration versions, planned-claim restart proof, and V5.1-V5.5 mutating route/tool-surface restart proof; release promotion still needs final session-auth integration and production replay coverage |
| CSRF mutation tokens | Process-local `Map` in `server/world_grid/csrf.js`; optional SQLite `world_grid_csrf_tokens` table when `WORLD_GRID_CSRF_SQLITE_PATH` is configured | Durable foundation for owner-bound hashed tokens, expiry pruning, schema/migration versions, and production route restart proof; release promotion still needs final browser-session binding and cross-session coverage |
| Mutation rate-limit buckets | Process-local `Map` in `server/world_grid/rate_limit.js`; optional SQLite `world_grid_rate_limit_buckets` table when `WORLD_GRID_RATE_LIMIT_SQLITE_PATH` is configured | Durable foundation for owner/surface mutation counters, schema/migration versions, window reset metadata, and restart proof; release promotion still needs final session binding plus IP/risk-aware shared production enforcement |
| Mutation audit records | Optional SQLite `world_grid_audit_log` table in `server/world_grid/audit_log.js` when `WORLD_GRID_AUDIT_SQLITE_PATH` is configured | Durable foundation for append-only audit/replay, route/tool-surface restart matrix coverage, and duplicate-replay suppression; not yet complete release storage because complete before-state snapshots and store reconstruction are still release gates |

The mandatory durable dependency used by mutating V5.1+ routes is the existing
Founders Plot prerequisite check. Optional SQLite world-grid stores are
release-storage foundations only. World-grid routes must not create Founders
Plot state as a side effect.

## Release-Grade Storage Requirements

Before any V5 world-grid slice can claim release-grade persistence, it needs:

- Durable owner indexes for private region preferences, public presence,
  claims, contributions, rewards, services, follows, sandbox participation, and
  rollback records.
- Schema and migration versioning for every world-grid table/document.
- Append-only audit/replay records for every mutating route and tool, including
  actor identity, idempotency key, before/after summary, and rollback handle
  where applicable.
- Durable audit rows for every V5.1-V5.5 mutating route and tool surface with
  replay indexes, schema/migration metadata, privacy-safe summaries, restart
  matrix coverage, and duplicate-replay suppression. Current
  `WORLD_GRID_AUDIT_SQLITE_PATH` coverage proves route/tool audit rows reopen
  after separate Node process restarts and exact idempotent replays do not add
  duplicate audit rows; complete before-state snapshots and release replay
  reconstruction remain gates.
- Durable camera/focus preference rows with owner/region indexes and restart
  persistence for the V5.0 region lifecycle. Current SQLite preference coverage
  proves selected-cell and camera state reopens across separate Node lifetimes
  without leaking preferences to another owner; final browser-session
  continuity and production replay coverage remain gates.
- Durable idempotency rows for every externally visible mutating route/tool,
  with request hashes, stored success responses, conflict detection, and replay
  coverage after restart. Current SQLite idempotency coverage proves planned
  claim replay plus exact replay and changed-payload conflict rejection across
  the externally visible V5.1-V5.5 mutating route and tool surfaces after
  separate Node process restarts; final session-auth integration and production
  replay coverage remain release gates.
- Durable claim rows with owner/status/cell indexes and restart persistence for
  the full V5.1 lifecycle. Current SQLite claim coverage proves planned and
  claimed state reopens across separate Node lifetimes, cancel removes durable
  rows after restart, and a different owner cannot mutate a persisted claim
  region through route parameters; stale-session handling, final production
  session-auth coverage, and release replay reconstruction remain gates.
- Durable public presence, follow, and abuse-report rows with owner/town/reporter
  indexes and restart persistence for the V5.2 public discovery lifecycle.
  Current SQLite public presence coverage proves opt-in/list/lookup/follow/
  opt-out across separate Node lifetimes, clears inbound follows on opt-out,
  stores one abuse report per reporter/town, rejects self-reports, and redacts
  private-looking report text; stale-session handling, retention policy, and
  final privacy-review coverage remain gates.
- Durable service request and reputation rows with owner/service/status indexes
  and restart persistence for the V5.3 advice lifecycle. Current SQLite service
  coverage proves redacted request inputs, accepted/reported request state,
  reputation counters, and duplicate accept/report safety across separate Node
  lifetimes; dispute workflow, stale-session, and final privacy-review coverage
  remain gates.
- Durable event contribution and reward rows with owner/event/day/settlement
  indexes and restart persistence for the V5.4 public-works lifecycle. Current
  SQLite event coverage proves contribution totals, reward state, duplicate
  contribution/reward safety, and cap replay across separate Node lifetimes;
  rollback policy, multi-event migration, and final public-ledger review remain
  gates.
- Durable sandbox participant, action, rollback snapshot, and cell rows with a
  participant owner key plus action/cell indexes and restart persistence for the
  V5.5 controlled sandbox lifecycle. Current SQLite sandbox coverage proves participants,
  moderated action records, rejected action records, rollback snapshots, cell
  props, leave state, and private-town isolation across separate Node
  lifetimes; abuse reports, stale-session cleanup, cross-owner moderation
  review, and final sandbox privacy review remain gates.
- Restart persistence tests proving state survives server restart and cannot be
  silently recreated, lost, or reassigned across owners.
- Cross-owner and stale-session tests for every owner index.
- CSRF-token and same-origin integration tests bound to the final
  browser-authenticated session model. Current `WORLD_GRID_CSRF_SQLITE_PATH`
  coverage proves owner-bound hashed token rows, expiry fail-closed behavior,
  cross-owner denial, and production mutating-route authorization across
  separate Node process restarts; final browser-session binding and
  cross-session browser coverage remain gates.
- Durable/shared rate-limit counters keyed by final session, wallet/owner, IP
  risk signal, and mutation surface, with replay-safe behavior for legitimate
  retries. Current `WORLD_GRID_RATE_LIMIT_SQLITE_PATH` coverage proves
  owner/surface buckets reopen across separate Node process lifetimes and block
  mutating routes after restart; final session binding and IP/risk-aware
  production sharing remain gates.
- Backfill and migration tests for older prototype rows before enabling a public
  release flag.
