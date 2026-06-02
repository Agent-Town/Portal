# AgentTown HQ16L - Review To Convoy Map Bridge

Date: 2026-06-02

Verdict: PASS

## Summary

HQ16L makes the reviewed packet-derived Site Plan -> Surveyor -> Prepare Convoy transition spatially legible on the Expedition Map. When the server-owned `expeditionMap.surveyBridge` exposes a reviewed Site Plan with `prepare_settler_convoy`, the objective strip now promotes the map focus to `CNV`, points at the reviewed cell, keeps the compact bridge rail visible, and lets the player select the Surveyor token to see the preview-only Prepare Convoy command target.

The browser proof uses a mocked server-owned HQ16K/HQ16L read model. It does not create a Surveyor manually; it renders the Surveyor and command from `expeditionMap.units.items` and `surveyBridge.commandState`, then confirms through the existing guarded Prepare Convoy endpoint.

## What Changed

- Added a frontend objective branch for reviewed Surveyor bridge state: `prepare_settler_convoy` now wins over the older packet-review fallback.
- Added the compact `CNV` objective mode and fact labels for Plan / Surveyor / Command.
- Added a small visual style hook for the convoy objective state.
- Added dedicated browser proof for the reviewed bridge state.

## Guardrails

- No server routes, tools, store behavior, or mutation authority were added.
- Site Plan review remains planning-only.
- The browser proof does not create Surveyors manually.
- Prepare Convoy is invoked only through the existing guarded endpoint.
- No Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, route/trade/economy/resource/reward/combat/scheduler/cross-plot behavior, external effects, deploy, merge, push, or public share.

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/203_founders_plot_hq16l_review_to_convoy_map_bridge.spec.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/203_founders_plot_hq16l_review_to_convoy_map_bridge.spec.js --reporter=line`
- `jq empty reports/agent-town-hq16l-review-to-convoy-map-bridge-2026-06-02-proof.json`
- `file reports/agent-town-hq16l-review-to-convoy-map-bridge-2026-06-02-desktop.png reports/agent-town-hq16l-review-to-convoy-map-bridge-2026-06-02-mobile.png`
- `git diff --check`

## Artifacts

- `reports/agent-town-hq16l-review-to-convoy-map-bridge-2026-06-02-proof.json`
- `reports/agent-town-hq16l-review-to-convoy-map-bridge-2026-06-02-desktop.png`
- `reports/agent-town-hq16l-review-to-convoy-map-bridge-2026-06-02-mobile.png`
