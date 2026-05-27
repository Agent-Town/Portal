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
- Abuse-report metadata with no private town, wallet, provider, brain,
  credential, token, or runtime data.

## APIs

- `GET /api/world/public-towns`
- `GET /api/world/public-town/:publicTownId`
- `POST /api/world/public-presence/opt-in`
- `POST /api/world/public-presence/opt-out`
- `POST /api/world/follow-town`
- `POST /api/world/public-town/report-abuse`

## Definition Of Done

- Private towns do not appear.
- Public lookup works without auth only for public-safe fields.
- Visits cannot mutate another town.
- Brain, provider, wallet, runtime, logs, and private event data are redacted.
- Opt-out removes the town from discovery within the release target.
- Abuse reports reject self-reports, suppress duplicate reporter/town reports,
  redact private-looking note text, and return `mutationApplied: false`.

## Prototype Implementation Evidence

- `server/world_grid/public_presence.js`
- `server/world_grid/routes.js`
- `public/experiences/world-grid/app.js`
- `tests/world_grid_region.test.js`
- `tests/world_grid_public_presence_persistence.test.js`
- `e2e/236_world_grid_v50_region_prototype.spec.js`

## Durable Prototype Storage Evidence

When `WORLD_GRID_PUBLIC_PRESENCE_SQLITE_PATH` is configured,
`server/world_grid/public_presence.js` writes prototype SQLite rows for
`world_grid_public_presence`, `world_grid_public_follows`, and
`world_grid_public_abuse_reports`. Current restart coverage proves
opt-in/list/lookup/follow/summary/opt-out/report replay across separate Node
process lifetimes, inbound follow cleanup on opt-out, duplicate reporter/town
report suppression, self-report rejection, and private-looking report text
redaction.
