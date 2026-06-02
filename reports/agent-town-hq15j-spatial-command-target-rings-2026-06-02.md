# AgentTown HQ15J - Spatial Command Target Rings

Generated: 2026-06-02 02:18 +07

## Verdict

PASS. Selected Expedition Map units now paint their available command targets directly on the Three.js map as visual-only action rings.

## What Changed

- Added renderer-side command target rings for the selected unit.
- Scout selection can show both a revealed-cell `Move` target and a hinted `Scout Sector` target.
- Surveyor and Settler command hints can now project spatial targets for existing server actions such as `Prepare Convoy` and `Found Outpost`.
- The renderer proof metadata exposes `commandTargets` plus visual-layer guardrails for command target rings.
- The stale semantic zoom overlay fix was strengthened to remove old overlays document-wide before appending the current overlay.

## Behavior

- Command rings are presentation-only: they explain where an existing command points, but they are not executable canvas buttons.
- Real command execution still goes through the existing command bar buttons and existing guarded endpoints.
- Hidden/locked cells are excluded from command target rings except the existing eligible hinted `frontier_hint` Scout Sector target.

## Guardrails

- No new server mutation path was added.
- No command target ring has route authority, action authority, executable actions, or client authority.
- Scout Sector remains the only fog/reveal mutation path.
- Scout movement remains bounded to adjacent discovered/known cells.
- Prepare Convoy and Found Outpost remain existing server-owned Settler/Outpost actions, not movement, route, trade, scheduler, or autonomous effects.
- No hidden autonomy, Atlas execution, public sharing, Generated Universe runtime expansion, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation, hidden-truth leakage, or external effects were added.

## Verification

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js -g "FP-E2E-023"` - 1/1
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022"` - 1/1
- `npm run test:founders-plot` - 98/98

## Notes

The first `FP-E2E-023` rerun exposed that a stale semantic zoom overlay could still be selected by `querySelector` even when the visible overlay was correct. The final fix removes semantic overlays at the document level before appending the fresh one.
