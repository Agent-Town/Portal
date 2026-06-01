# Agent Town HQ12H Expedition Map Mobile Polish

Date: 2026-05-31

## Summary

Completed a bounded mobile polish pass for the Founders Plot Expedition Map surfaces at 390px width.

- Kept the server-owned Expedition Map, Scout Sector mutation route, Event Packet read model, and Expedition Party read-only manifest unchanged.
- Tightened compact Expedition Map spacing, metrics, map renderer height, selected-sector cards, Event Packet facts, and Expedition Party flavor blocks.
- Kept Event Packet and Expedition Party blocks read-only with zero action buttons.
- Added focused FP-E2E-022 proof output for the HQ12H mobile polish lane.

## Files Changed

- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`
- `reports/agent-town-hq12h-expedition-map-mobile-polish-2026-05-31.md`
- Generated proof artifacts:
  - `reports/agent-town-hq12h-expedition-map-mobile-polish-proof-2026-05-31.json`
  - `reports/agent-town-hq12h-expedition-map-mobile-polish-desktop-2026-05-31.png`
  - `reports/agent-town-hq12h-expedition-map-mobile-polish-mobile-2026-05-31.png`

## Proof Paths

- Desktop panel screenshot: `reports/agent-town-hq12h-expedition-map-mobile-polish-desktop-2026-05-31.png`
- Mobile panel screenshot: `reports/agent-town-hq12h-expedition-map-mobile-polish-mobile-2026-05-31.png`
- Machine proof JSON: `reports/agent-town-hq12h-expedition-map-mobile-polish-proof-2026-05-31.json`

## Commands And Results

- `node --check e2e/200_founders_plot.spec.js` - passed.
- `node --check public/experiences/founders-plot/founders-plot.js` - passed.
- `PW_PORT=4198 npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --project=chromium` - passed, 1 test.
- `jq '{ok, selectedCellId, eventPacketId, widths: {viewport: .mobilePolishProof.viewport, documentScrollWidth: .mobilePolishProof.documentScrollWidth, bodyScrollWidth: .mobilePolishProof.bodyScrollWidth}, clipped: .mobilePolishProof.clipped, gridColumns: .mobilePolishProof.gridColumns, buttons: .mobilePolishProof.buttons, guardrails}' reports/agent-town-hq12h-expedition-map-mobile-polish-proof-2026-05-31.json` - passed; viewport/body/document widths are 390, clipped list is empty, metrics/packet/party facts are two-column, packet and party buttons are 0.
- `identify reports/agent-town-hq12h-expedition-map-mobile-polish-desktop-2026-05-31.png reports/agent-town-hq12h-expedition-map-mobile-polish-mobile-2026-05-31.png` - passed; desktop image is 465x4440 PNG, mobile image is 366x3055 PNG.
- `git diff --check -- public/experiences/founders-plot/founders-plot.css e2e/200_founders_plot.spec.js reports/agent-town-hq12h-expedition-map-mobile-polish-2026-05-31.md reports/agent-town-hq12h-expedition-map-mobile-polish-proof-2026-05-31.json` - passed.
- `git diff --check` - passed.

## Result

PASS. At 390px, the focused proof shows no horizontal overflow or clipped Expedition Map controls. The map renderer is capped to a compact height, Expedition metrics stay two-column, Event Packet facts stay two-column, and Expedition Party facts stay two-column. The post-Scout Sector state still exposes zero packet action buttons, zero party action buttons, and no remaining Scout Sector button for the now-known sector.

## Residual Risk

This lane is CSS/UI-proof focused and only runs FP-E2E-022, not the full suite. The repo was already dirty with many unrelated tracked and untracked changes; this pass did not clean or revert them.

## Boundary Statement

No server, store, engine, route, tool, spec, worker, scheduler, Atlas, public-sharing, resource, route/trade/economy, combat, or cross-plot mutation behavior was changed. Scout Sector remains the only Expedition Map UI mutation path. Event Packet and Expedition Party surfaces remain read-only presentation with zero action buttons.
