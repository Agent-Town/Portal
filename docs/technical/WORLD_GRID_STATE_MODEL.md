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
| Camera/focus preferences | Process-local `Map` in `server/world_grid/routes.js` | Prototype/ephemeral |
| Territory claims | Process-local `Map` in `server/world_grid/claims.js`; optional SQLite `world_grid_claims` table when `WORLD_GRID_CLAIMS_SQLITE_PATH` is configured | Durable foundation for planned/claimed V5.1 claim state, owner/status/cell indexes, schema/migration versions, and restart proof; release promotion still needs cancel/replay, cross-owner, and every V5.1-V5.5 store covered |
| Public presence/follows | Process-local `Map` values in `server/world_grid/public_presence.js` | Prototype/ephemeral |
| Civic service requests/reputation | Process-local `Map` values in `server/world_grid/services.js` | Prototype/ephemeral |
| World event contributions/rewards | Process-local `Map` values in `server/world_grid/events.js` | Prototype/ephemeral |
| Sandbox participants/actions/snapshots/cells | Process-local arrays/maps and mutable in-memory district cells in `server/world_grid/sandbox.js` | Prototype/ephemeral |
| Idempotency replay records | Process-local `Map` in `server/world_grid/idempotency.js`; optional SQLite `world_grid_idempotency_records` table when `WORLD_GRID_IDEMPOTENCY_SQLITE_PATH` is configured | Durable foundation for exact retry replay, changed payload rejection, schema/migration versions, and planned-claim restart proof; release promotion still needs every route/tool surface covered by restart replay |
| CSRF mutation tokens | Process-local `Map` in `server/world_grid/csrf.js` | Prototype/ephemeral; owner-bound only for the process lifetime |
| Mutation rate-limit buckets | Process-local `Map` in `server/world_grid/rate_limit.js` | Prototype/ephemeral; per-owner and per-surface only for the process lifetime |
| Mutation audit records | Optional SQLite `world_grid_audit_log` table in `server/world_grid/audit_log.js` when `WORLD_GRID_AUDIT_SQLITE_PATH` is configured | Durable foundation for append-only audit/replay; not yet complete release storage because before-state snapshots and store reconstruction are still release gates |

The mandatory durable dependency used by mutating V5.1+ routes is the existing
Founders Plot prerequisite check. Optional SQLite claim and idempotency stores
are release-storage foundations only. World-grid routes must not create Founders
Plot state as a side effect.

## Release-Grade Storage Requirements

Before any V5 world-grid slice can claim release-grade persistence, it needs:

- Durable owner indexes for private region, public presence, claims,
  contributions, rewards, services, follows, sandbox participation, and rollback
  records.
- Schema and migration versioning for every world-grid table/document.
- Append-only audit/replay records for every mutating route and tool, including
  actor identity, idempotency key, before/after summary, and rollback handle
  where applicable.
- Durable idempotency rows for every externally visible mutating route/tool,
  with request hashes, stored success responses, conflict detection, and replay
  coverage after restart. Current SQLite idempotency coverage starts this for
  route-level planned claims only; every remaining V5.1-V5.5 route/tool surface
  still needs restart replay proof before release promotion.
- Durable claim rows with owner/status/cell indexes and restart persistence for
  the full V5.1 lifecycle. Current SQLite claim coverage proves planned and
  claimed state reopens across separate Node lifetimes; cancel replay,
  cross-owner ownership, and release replay reconstruction remain gates.
- Restart persistence tests proving state survives server restart and cannot be
  silently recreated, lost, or reassigned across owners.
- Cross-owner and stale-session tests for every owner index.
- CSRF-token and same-origin integration tests bound to the final
  browser-authenticated session model.
- Durable/session-bound CSRF token issuance and invalidation with restart,
  expiry, and cross-session tests.
- Durable/shared rate-limit counters keyed by final session, wallet/owner, IP
  risk signal, and mutation surface, with replay-safe behavior for legitimate
  retries.
- Backfill and migration tests for older prototype rows before enabling a public
  release flag.
