# World Grid V5.0 Region Prototype Evidence - 2026-05-26

Branch: `codex/v5-v6-world-grid-feedback`

Status: `prototype_gated` for V5.0-V5.5 starter workflow

## Evidence

| Area | Evidence |
| --- | --- |
| Feature gate | `FEATURE_WORLD_GRID_V50_REGION` defaults off; `/api/world/region` returns `FEATURE_DISABLED` unless server/dev/QA enables it. |
| Production override safety | `server/world_grid/feature_flags.js` reuses the production admin/QA override guard before honoring `worldGridFeatureFlags` or `x-world-grid-feature-flags`. |
| Server-authoritative region | `server/world_grid/region.js` deterministically generates `WorldRegion`, `WorldCell`, `SettlementNode`, and `RouteEdge` data from owner identity. |
| Read-only V5.0 APIs | `server/world_grid/routes.js` exposes region, focus, camera, and read-only tool endpoints without claim/build/resource mutation. |
| V5.1 claim workflow | `server/world_grid/claims.js` adds gated adjacent claim options, plan/complete/cancel tools, exact resource spend, route preview, and terrain tradeoff copy. |
| Browser prototype | `public/experiences/world-grid/` renders a Three.js territory grid and DOM cell mirror when the prototype flag is enabled. |
| Tests | `tests/world_grid_region.test.js` and `e2e/236_world_grid_v50_region_prototype.spec.js`. |
| V5.2 public presence | `server/world_grid/public_presence.js` adds opt-in public cards, redacted list/lookup, follow-town, summarize-neighbor, and opt-out removal. |
| V5.3 civic services | `server/world_grid/services.js` adds bounded service listings, redacted service requests, schema-shaped recommendations, accept-as-advice only, report flow, and reputation bookkeeping. |
| V5.4 world event | `server/world_grid/events.js` adds one capped public-works event, preview-before-contribute, idempotent contribution accounting, exact resource spend, public progress, personal recap, and cosmetic reward claim. |
| V5.5 sandbox district | `server/world_grid/sandbox.js` adds one typed sandbox district with redacted public presence, allowed prop placement, rejected forbidden props, typed agent demo, and rollback snapshots. |
| Screenshots | `artifacts/world-grid-v50-region-prototype.png`, `artifacts/world-grid-v51-territory-claim-prototype.png`, `artifacts/world-grid-v53-agent-services-prototype.png`, `artifacts/world-grid-v54-world-event-prototype.png`, and `artifacts/world-grid-v55-sandbox-prototype.png`. |
| Live sanity | Local route reported `renderer: "three"`, `payloadCells: 19`, a claimed route after V5.1 completion, V5.2 opt-in/out, V5.3 civic service request/accept, V5.4 preview/contribute/reward, V5.5 enter/place/reject/agent-demo/rollback/leave, no horizontal overflow at 291px, and no console/page errors. |

## Release Stance

This is not a public release claim. V5.0 remains hidden from the normal player
route and requires the recurring Three.js runtime gate before promotion beyond
prototype review.
