# Post-HQ12D Expedition Map Regression QA

Status: PASSED

## Boundary

- Report/proof-only lane. No production source, server, engine, store, route, tool, spec, Atlas execution, scheduler, or worker authority changes were made.
- Verified the HQ12D Three.js renderer against existing Founders Plot progression, Expedition Map read-only behavior, HQ12C Scout Sector affordance, and desktop/mobile layout.
- The Expedition Map remains cozy private unknown-world exploration: no autonomous movement, harvesting, route/trade economy, combat, public sharing, Generated Universe rendering, cross-plot mutation, or Atlas execution surfaced.

## Checks Run

- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-(009|009a|009b|010|011|012|013|014|015|016|022)" --reporter=line`
  - Result: 11 passed.
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --reporter=line`
  - Result: 1 passed.

## Regression Coverage

- Founders Plot progression stayed intact across queue/collect, claimable rewards, Foreman guidance, HQ6 Site Plan review, HQ7 Settler Convoy/outpost founding, HQ8 doctrine selection, HQ9 Work Order draft/execute, and HQ10 World Grid read-only readiness.
- Existing Expedition Map UI contract stayed intact: HQ12B read-only map projection renders discovered/known/hinted/locked sectors from `state.expeditionMap`, keeps `executableActions` empty, and preserves the hidden/known/locked Scout Sector button boundaries.
- HQ12C Scout Sector remained a one-sector, human-actor affordance: the hinted cell sends the expected request, updates to known after receipt, and does not expose repeat buttons for known/locked cells.
- HQ12D Three.js renderer stayed nonblank and bounded: 5 cells, fog counts `2/1/1/1`, known and locked sectors selectable, locked-sector resource text suppressed, wheel zoom capped at the renderer bound, desktop drag-pan works, and mobile synthetic touch-drag works after zoom.
- Mobile layout stayed within 390px in both the HQ12B/HQ12C contract test and the HQ12D renderer test. Proof recorded `documentScrollWidth: 390`, `bodyScrollWidth: 390`, and no clipped Expedition Map cards.

## Proof Artifacts

- Proof JSON: `reports/agent-town-post-hq12d-expedition-map-regression-qa-proof-2026-05-31.json`
- Desktop screenshot: `reports/agent-town-post-hq12d-expedition-map-regression-qa-desktop-2026-05-31.png` (`465x2473`)
- Mobile screenshot: `reports/agent-town-post-hq12d-expedition-map-regression-qa-mobile-2026-05-31.png` (`366x2669`)
- Upstream refreshed proof inputs:
  - `reports/agent-town-hq12d-threejs-zoomable-expedition-map-renderer-proof-2026-05-31.json`
  - `reports/agent-town-hq12b-expedition-map-ui-proof-2026-05-31.json`
  - `reports/agent-town-hq12c-scout-sector-ui-proof-2026-05-31.json`

## Notes

- No regressions were found.
- No lane-owned code fix was needed.
