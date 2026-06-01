# HQ12A Expedition Map Read Model Slice

Date: 2026-05-31

## Summary

Implemented the first server-owned Expedition Map / fog-of-war read model for Founders Plot. The slice adds read-only state that later UI work can render as an expedition map without inventing gameplay authority.

The model is derived from existing gameplay truth:

- origin Founders Plot and owned outpost memberships
- collected Scout Reports
- canonical Site Plans and reviewed claim-ready plans
- Settlement Claims and founded second-plot receipts
- World Grid / civic readiness metadata

## Server Surface

- Added `buildExpeditionMapReadModel(bundle)` in `server/founders_plot/engine.js`.
- Exposed `state.expeditionMap` and public summary counts/status.
- Added read-only envelope `getExpeditionMapStatus(...)`.
- Added `GET /api/founders-plot/expedition-map`.
- Added tool spec `et.plot.get_expedition_map`.

## Fog Semantics

The read model emits logical cells with these fog states:

- `discovered`: server-owned origin/outpost plot truth.
- `known`: collected Scout Reports, Site Plans, or Settlement Claims grounded in receipts.
- `hinted`: adjacent frontier hints derived from known/discovered cells; not claimable and not resource truth.
- `locked_unknown`: opaque fog placeholders with no gameplay truth.

Each model and cell carries `readOnly: true`, an authority boundary, and receipt metadata. The model exposes `executableActions: []`.

## Boundary

This slice deliberately does not add:

- autonomous movement
- resource gathering
- route or trade economy
- combat
- public sharing
- Generated Universe rendering
- Atlas execution
- mutation routes

## Tests

Added focused coverage:

- contract schema coverage for `et.plot.get_expedition_map`
- unit coverage for origin-only and full fog read-model semantics
- HTTP route coverage for read-only fog cells and no event mutation

Proof JSON: `reports/agent-town-hq12a-expedition-map-read-model-proof-2026-05-31.json`
