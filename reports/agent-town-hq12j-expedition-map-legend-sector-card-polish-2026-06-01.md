# Agent Town HQ12J - Expedition Map Legend And Sector Card Polish

## Result

Implemented a bounded frontend-only polish pass for the Founders Plot Expedition Map.

Changed files:

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`

No server, engine, store, route, tool, spec, Atlas, scheduler, sharing, combat, economy, route/trade, or cross-plot behavior was changed.

## UI Changes

- Added a compact four-state fog legend for `discovered`, `known`, `hinted`, and `locked_unknown`.
- Added selected-sector visibility rules for each selected cell:
  - visible known/discovered cells can show verified server read-model facts
  - hinted cells say no resources/routes/actions are exposed and only Scout Sector can reveal eligible hints
  - locked unknown cells say no resources/routes/actions/receipts are exposed and no Expedition Map action is available
  - semantic zoom is called out as context-only, not extra truth
- Bounded the desktop Three.js Expedition Map host height so the zoom surface stays framed and does not vertically expand in full-panel captures.

## Guardrails

- Hidden cells remain hidden. The focused proof asserts locked unknown selection does not expose known resource text or known-cell receipt links.
- Scout Sector remains the only Expedition Map UI mutation path.
- Event Packet and Expedition Party surfaces remain read-only and buttonless.
- HQ12I semantic zoom overlay remains visible and verified on desktop and mobile.

## Proof

- Proof JSON: `reports/agent-town-hq12j-expedition-map-legend-sector-card-polish-proof-2026-06-01.json`
- Desktop screenshot: `reports/agent-town-hq12j-expedition-map-legend-sector-card-polish-desktop-2026-06-01.png`
- Mobile screenshot: `reports/agent-town-hq12j-expedition-map-legend-sector-card-polish-mobile-2026-06-01.png`

## Checks Run

- `node --check public/experiences/founders-plot/founders-plot.js` - passed.
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js` - passed.
- `node --check e2e/200_founders_plot.spec.js` - passed.
- `PW_PORT=4923 npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium --grep "FP-E2E-023"` - passed, 1 test.
- `PW_PORT=4922 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022"` - passed, 1 test.
- `jq empty reports/agent-town-hq12j-expedition-map-legend-sector-card-polish-proof-2026-06-01.json` - passed.
- `git diff --check -- public/experiences/founders-plot/founders-plot.js public/experiences/founders-plot/founders-plot.css e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js` - passed.
- `git diff --check` - passed.
