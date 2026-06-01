# Agent Town HQ12B Expedition Map UI Slice - 2026-05-31

## Verdict

Implemented.

## Preflight

HQ12A is present in source, so this lane was unblocked even though the expected Carver handoff files were not present at implementation start:

- `server/founders_plot/engine.js` exposes `state.expeditionMap` with `status`, `readOnly`, `executableActions`, `fog.counts`, `scope`, `cells`, `projectionHash`, and read-only receipts.
- `server/founders_plot/routes.js` exposes `GET /api/founders-plot/expedition-map`.
- `server/founders_plot/tools.js` exposes `et.plot.get_expedition_map`.
- `tests-founders-plot/fp-unit.test.js` and `tests-founders-plot/fp-http.test.js` already cover the HQ12A read model.

Required cell fields used by the UI:

- `cellId`, `q`, `r`, `fogState`, `kind`, `title`, `status`
- `siteType`, `risk`, `resourceHints`, `traits`
- `summary`, `recommendedNext`
- `sourceIds`, `receipts`

## Implementation

Added a private Founders Plot Expedition Map panel in `public/experiences/founders-plot/founders-plot.js`.

Because `public/experiences/founders-plot/index.html` was outside this lane's write scope, the panel is inserted dynamically before the World Grid panel.

The UI:

- Reads only `state.expeditionMap`, or `GET /api/founders-plot/expedition-map` when public summary fields advertise a map but the full model is absent.
- Renders server-provided fog cells as a compact frontier map.
- Shows hidden silhouettes for `hinted` and `locked_unknown` cells without revealing resources or actions.
- Shows revealed sector cards for `discovered` and `known` cells.
- Surfaces terrain, risk, resource hints, status, receipt rows, source links, and owned-outpost links when present.
- Adds no mutation buttons in the Expedition Map panel.

No server authority, gameplay mutations, autonomous movement, resource gathering, routes, trade, combat, public sharing, Generated Universe rendering, scheduler behavior, or Atlas execution were added.

## Proof

- Desktop screenshot: `reports/agent-town-hq12b-expedition-map-ui-desktop-2026-05-31.png`
- Mobile screenshot: `reports/agent-town-hq12b-expedition-map-ui-mobile-2026-05-31.png`
- Proof JSON: `reports/agent-town-hq12b-expedition-map-ui-proof-2026-05-31.json`

Proof highlights:

- `status: FOG_READ_MODEL_READY`
- counts: `discovered 2`, `known 1`, `hinted 1`, `locked_unknown 1`
- mobile width proof: `documentScrollWidth 390`, `bodyScrollWidth 390`, no clipped Expedition Map elements
- mutation buttons inside panel: `0`
- executable actions: `[]`
- read-only guardrails: `routeCreation false`, `atlasExecution false`

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --project=chromium`
- `magick identify reports/agent-town-hq12b-expedition-map-ui-desktop-2026-05-31.png reports/agent-town-hq12b-expedition-map-ui-mobile-2026-05-31.png`
- `jq empty reports/agent-town-hq12b-expedition-map-ui-proof-2026-05-31.json`
- `git diff --check -- public/experiences/founders-plot/founders-plot.js public/experiences/founders-plot/founders-plot.css e2e/200_founders_plot.spec.js reports/agent-town-hq12b-expedition-map-ui-slice-2026-05-31.md reports/agent-town-hq12b-expedition-map-ui-proof-2026-05-31.json`
- `git diff --check`

## Residual Risks

- The focused Playwright proof uses a route fixture carrying the HQ12A server read-model shape to exercise a dense revealed/hidden map. It proves the UI consumes `expeditionMap` fields and adds no local map authority, but it is not a full live progression seed from HQ1 to an outpost.
- The expected HQ12A handoff report/proof files were absent, so the unblocked decision was based on source/read-model presence rather than Carver's report artifacts.
