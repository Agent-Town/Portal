# Agent Town V5.2 Public Presence And Safe Player Discovery

Status: `prototype_gated`

Feature flag: `FEATURE_WORLD_GRID_V52_PUBLIC_PRESENCE`

## Goal

Let players notice other towns without exposing private state or creating early
social pressure.

## Scope

- Opt-in public town cards.
- Read-only visit preview.
- Follow/bookmark town.
- Neighbor sighting feed.
- Strict public-safe redaction.

## APIs

- `GET /api/world/public-towns`
- `GET /api/world/public-town/:publicTownId`
- `POST /api/world/public-presence/opt-in`
- `POST /api/world/public-presence/opt-out`
- `POST /api/world/follow-town`

## Definition Of Done

- Private towns do not appear.
- Public lookup works without auth only for public-safe fields.
- Visits cannot mutate another town.
- Brain, provider, wallet, runtime, logs, and private event data are redacted.
- Opt-out removes the town from discovery within the release target.

## Prototype Implementation Evidence

- `server/world_grid/public_presence.js`
- `server/world_grid/routes.js`
- `public/experiences/world-grid/app.js`
- `tests/world_grid_region.test.js`
- `e2e/236_world_grid_v50_region_prototype.spec.js`
