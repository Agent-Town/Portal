# Agent Town Post-HQ12J Expedition Map Legend/Card Regression QA

## Result

PASS. I found no HQ12J regressions in the bounded Expedition Map legend, selected-sector card, semantic zoom, Scout Sector, Event Packet, Expedition Party, or mobile bounds surfaces.

This was a report/proof QA pass. I did not edit app, server, route, store, engine, tool, spec, Atlas, scheduler, sharing, combat, economy, or cross-plot behavior.

## Artifacts Verified

- `reports/agent-town-hq12j-expedition-map-legend-sector-card-polish-2026-06-01.md`
- `reports/agent-town-hq12j-expedition-map-legend-sector-card-polish-proof-2026-06-01.json`
- `reports/agent-town-hq12j-expedition-map-legend-sector-card-polish-desktop-2026-06-01.png`
- `reports/agent-town-hq12j-expedition-map-legend-sector-card-polish-mobile-2026-06-01.png`

## Evidence

- HQ12J proof JSON is valid and `ok: true`.
- Fog legend exposes exactly four states: `discovered`, `known`, `hinted`, and `locked_unknown`.
- HQ12J selected-sector rule strips preserve truth boundaries:
  - hinted says no resources, routes, or actions are exposed, and only Scout Sector can reveal an eligible hinted edge.
  - known/discovered can show verified server truth only.
  - locked unknown says no resources, routes, actions, or receipts are exposed, and no Expedition Map action is available.
- Semantic zoom remains context-only: close zoom reports that it does not unlock extra truth, and the locked selected hint stays sealed.
- Scout Sector remains the only Expedition Map UI mutation path:
  - HQ12B proof shows one mutation button, `fp-btn-scout-sector-cell_q0_r1`.
  - HQ12B proof shows no Scout Sector buttons for known or locked cells.
- Event Packet and Expedition Party remain read-only/buttonless:
  - HQ12H proof shows `packetButtons: 0`, `partyButtons: 0`, `packetActions: 0`, `partyActions: 0`, and `readOnlyEventPacket: true`.
- Mobile layout remains bounded:
  - HQ12J mobile proof: viewport `390`, document/body scroll width `390`, Three.js host `313x188`.
  - HQ12B/HQ12H proof: no clipped mobile surfaces and no horizontal overflow.
- HQ12J screenshots identify successfully:
  - desktop: PNG `465x3384`, 785185 bytes.
  - mobile: PNG `366x2575`, 575517 bytes.

## Checks Run

- `node --check public/experiences/founders-plot/founders-plot.js` - passed.
- `node --check e2e/200_founders_plot.spec.js` - passed.
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js` - passed.
- `jq -e` HQ12J proof assertions for legend states, selected rules, semantic zoom, mobile bounds, pixel samples, and guardrails - passed.
- `jq -e` HQ12B/HQ12C Scout Sector guardrail assertions - passed.
- `jq -e` HQ12F/HQ12G/HQ12H Event Packet, Expedition Party, and mobile-polish assertions - passed.
- `identify` on the HQ12J desktop and mobile screenshots - passed.
- `PW_PORT=4932 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022"` - passed, 1 test.
- `PW_PORT=4933 npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium --grep "FP-E2E-023"` - passed, 1 test.
- `git diff --check` - passed.

Playwright emitted only existing environment warnings about experimental SQLite and `NO_COLOR` being ignored while `FORCE_COLOR` is set.

## Files Touched

Created:

- `reports/agent-town-post-hq12j-expedition-map-legend-card-regression-qa-2026-06-01.md`
- `reports/agent-town-post-hq12j-expedition-map-legend-card-regression-qa-proof-2026-06-01.json`

The focused Playwright reruns also refreshed existing untracked HQ12B/C/F/G/H/J report artifacts produced by those tests. No source files were edited.
