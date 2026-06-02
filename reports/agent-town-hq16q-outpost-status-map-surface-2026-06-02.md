# HQ16Q Outpost Status Map Surface

## Verdict

`PASS`.

HQ16Q makes the newly founded outpost feel like a selected playable map object without adding new authority. When the existing guarded Found Outpost flow reloads the server read model, the selected `outpost_crew` unit now exposes a compact read-only outpost status surface in the Expedition Map unit dock.

## What Changed

- Added an icon-first outpost status surface for selected `outpost_crew` units and owned-outpost cells.
- The surface shows compact status, owned-cell, next-frontier, and no-command chips.
- Full authority/provenance detail stays behind a collapsed `Details` drawer and data/aria attributes.
- The surface is explicitly read-only with `data-actions="0"` and does not add an outpost command path.

## Files

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js`
- `reports/agent-town-hq16q-outpost-status-map-surface-proof-2026-06-02.json`
- `reports/agent-town-hq16q-outpost-status-map-surface-2026-06-02-desktop.png`
- `reports/agent-town-hq16q-outpost-status-map-surface-2026-06-02-mobile.png`

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js --project=chromium --grep "FP-E2E-022M" --reporter=line`
- `jq empty reports/agent-town-hq16q-outpost-status-map-surface-proof-2026-06-02.json`
- `file reports/agent-town-hq16q-outpost-status-map-surface-2026-06-02-desktop.png reports/agent-town-hq16q-outpost-status-map-surface-2026-06-02-mobile.png`
- `git diff --check`

## Guardrails

No server route, tool action, API payload, store/engine authority, Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, route/trade/economy/resource/reward/combat/scheduler behavior, new cross-plot mutation beyond the existing Found Settlement contract, external effect, push, deploy, merge, public share, or history rewrite.

## Residual Risk

This is a small status surface over the current outpost read model. It does not yet add outpost operations, production, staffing, routes, or upgrades.
