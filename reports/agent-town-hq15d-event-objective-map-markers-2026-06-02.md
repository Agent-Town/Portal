# Agent Town HQ15D Event/Objective Map Markers

Date: 2026-06-02

## Summary

Implemented the smallest safe HQ15D slice for Expedition Map presentation:

- Event Packet read-model entries now render as visible, selectable, inspectable map markers.
- Current Focus/objective targets now render as visible, selectable, inspectable objective markers.
- Marker metadata remains read-only and visual-only with zero executable actions and no route/action authority.
- Long focus authority copy is collapsed into an optional Ledger / receipts details layer; the primary surface keeps a compact no-new-actions boundary.

## Scope

Frontend/runtime only for HQ15D marker behavior:

- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`

No new server mutation, movement, route/trade/economy/resource/reward/combat/scheduler, Atlas execution, public sharing, Generated Universe runtime, cross-plot mutation, external effect, or hidden-truth leakage was added.

## Proof

- Proof JSON: `reports/agent-town-hq15d-event-objective-map-markers-proof-2026-06-02.json`
- Desktop screenshot: `reports/agent-town-hq15d-event-objective-map-markers-desktop-2026-06-02.png`
- Mobile screenshot: `reports/agent-town-hq15d-event-objective-map-markers-mobile-2026-06-02.png`

Canonical artifact note: this `event-objective-map-markers` prefix is the canonical HQ15D package because it includes the fuller report plus desktop/mobile screenshots. The narrower `agent-town-hq15d-expedition-event-objective-markers-*` files are retained as supplemental renderer-focused evidence from the same lane.

Marker proof highlights:

- `eventPacketMarkerCount: 1`
- `objectiveMarkerCount: 1`
- `eventObjectiveMarkersVisualOnly: true`
- `eventObjectiveMarkersReadOnly: true`
- `eventObjectiveMarkersInspectable: true`
- `eventObjectiveMarkerAuthority: false`
- event/objective marker executable action counts: `0`
- Scout Sector remains the only visible Expedition Map mutation path, via the existing Scout-unit command.

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check e2e/200_founders_plot.spec.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --reporter=line`
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js -g "FP-E2E-023" --reporter=line`
- `jq empty reports/agent-town-hq15d-event-objective-map-markers-proof-2026-06-02.json`
- `git diff --check`

Attempted:

- At the original HQ15D checkpoint, broad `npm run test:founders-plot` exposed the then-existing `FP-PERF-001` compact-observation payload issue from the expanded HQ15 read model. That note is now superseded by HQ15G/HQ15O: compact observations were reconciled and the later full Founders Plot suite passed `98/98`.

Note: focused Playwright reruns rewrote older HQ12/HQ14 report screenshots and proof JSONs as expected. Later HQ15N/HQ15O reconciliation restored those tracked side effects before commit-readiness review.
