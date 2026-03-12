# Phase 41 - House Library Route Sync TDD Spec

Status: Draft for implementation

Owner intent: extend House Library beyond one-off peer relay by letting a House follow another House's public stack output through a simple, explicit sync flow in the same shell.

## 1. Goal

Phase 41 adds a new House Library `Route Desk`.

The user should be able to:

1. follow another House,
2. sync that House's published Public Stacks on demand,
3. scan the synced feed without leaving `/app`,
4. preview and import through the existing Public Stack flow.

This phase must stay deterministic, same-shell, and easy to understand. It must not introduce background jobs, hidden polling, or automatic imports.

## 2. Product rules

### 2.1 Route subscription

Each Route Desk entry represents one explicit target-side subscription to one source House:

- source `houseId`
- source `teamId`
- target `houseId`
- target `teamId`
- local `routeState`

Supported route states:

- `active`
- `paused`

### 2.2 Sync model

Sync is explicit.

The target House must press `Sync Route` to refresh the feed from the followed House.

Sync reads only published Public Stacks from the source House and creates durable target-side sync receipts.

Sync does not:

1. import anything automatically,
2. change local trust or safety,
3. rewrite source metadata,
4. bypass existing import, review, attestation, or seal rules.

### 2.3 Route feed

Each synced feed member must project:

- `libraryRouteSubscriptionId`
- `libraryPublicStackId`
- source House identity
- last synced timestamp
- imported-here boolean
- existing discovery lane and trust posture where applicable

The Route Desk is a reading and import surface, not a second Library.

### 2.4 Preview reuse

Route Desk preview must reuse the existing Public Stack preview contract.

That means:

1. one preview path,
2. one import path,
3. one trust/seal story,
4. no special route-only preview format.

### 2.5 UX behavior

The default end-user flow should be:

1. type House id,
2. follow House,
3. sync Route,
4. open synced stack,
5. import if desired.

No extra navigation, modal hops, or raw transport vocabulary should be required.

## 3. Data model

Phase 41 adds two durable ledgers:

1. `library_route_subscriptions`
2. `library_route_sync_receipts`

### 3.1 `library_route_subscriptions`

Required fields:

- `libraryRouteSubscriptionId`
- `houseId`
- `teamId`
- `sourceHouseId`
- `sourceTeamId`
- `routeState`
- `createdAt`
- `updatedAt`

### 3.2 `library_route_sync_receipts`

Required fields:

- `libraryRouteSyncReceiptId`
- `libraryRouteSubscriptionId`
- `houseId`
- `teamId`
- `libraryPublicStackId`
- `sourceHouseId`
- `sourceTeamId`
- `syncedAt`
- `importedAt`

Idempotency rule:

One target House keeps at most one sync receipt per `libraryRouteSubscriptionId + libraryPublicStackId`.

## 4. API surface

Phase 41 should add or extend these House-private routes:

1. `POST /api/platform/library/routes`
2. `GET /api/platform/library/routes`
3. `POST /api/platform/library/routes/:libraryRouteSubscriptionId/sync`
4. `GET /api/platform/library/routes/:libraryRouteSubscriptionId/feed`

Route feed members should be previewable with the existing:

1. `GET /api/platform/library/public-stacks/preview/:id`
2. `POST /api/platform/library/public-stacks/import`

## 5. Reserved Playwright block

Reserved tests:

1. `e2e/402_house_library_route_sync_harness.spec.js`
2. `e2e/403_house_library_route_subscription_create.spec.js`
3. `e2e/404_house_library_route_sync_feed.spec.js`
4. `e2e/405_house_library_route_sync_ui.spec.js`
5. `e2e/406_house_library_route_sync_import.spec.js`
6. `e2e/407_house_library_route_sync_full_smoke.spec.js`

## 6. Milestones

### M41.0 Harness

Outcome:

1. unified-platform harness exposes deterministic Route Desk fixtures and inspectors,
2. export/import roundtrip includes the new ledgers.

Success criteria:

1. fixture family `library_route_sync_seed` is listed,
2. Route Desk inspectors report deterministic row counts,
3. export/import reproduces both route ledgers.

### M41.1 Route subscription create

Outcome:

1. a target House can create one route subscription to a source House,
2. replay with the same idempotency key returns the same row.

Success criteria:

1. `POST /api/platform/library/routes` creates exactly one subscription row,
2. duplicate create replays idempotently,
3. invalid or same-house source targets are rejected deterministically.

### M41.2 Route sync feed

Outcome:

1. an active route can sync the source House's published Public Stacks,
2. synced members land as durable receipts without importing them.

Success criteria:

1. sync creates one receipt per published source Public Stack,
2. replay sync does not duplicate receipts,
3. feed includes imported-here posture and discovery lane.

### M41.3 Same-shell Route Desk

Outcome:

1. House Library exposes a Route Desk inside `/app`,
2. a user can follow a House and sync its feed without route changes.

Success criteria:

1. Route Desk opens inside the current shell,
2. follow and sync controls work without changing `window.location.pathname`,
3. worker session continuity is preserved.

### M41.4 Route feed import reuse

Outcome:

1. Route Desk members reuse the existing Public Stack preview and import contract.

Success criteria:

1. preview from the Route Desk exposes the normal Public Stack preview,
2. import from the Route Desk creates the normal imported Satchel outcome,
3. synced receipts record `importedAt` after successful import.

### M41.5 Full smoke

Outcome:

1. one joined smoke proves follow -> sync -> preview -> import in the same shell.

Success criteria:

1. source House publishes at least one Public Stack,
2. target House follows the source House,
3. target House syncs the route and sees the stack in Route Desk,
4. target House previews and imports it,
5. worker session id remains unchanged throughout.

## 7. Exit criteria

Phase 41 is complete when:

1. `e2e/402` through `e2e/407` pass,
2. full `npm test` passes,
3. Route Desk gives users a simple follow-and-sync model without hidden background behavior.
