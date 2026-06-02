# AgentTown HQ16A Direct Map Command Preview

Date: 2026-06-02

## Verdict

PASS. The Expedition Map command target rings now open a compact local command preview from the map itself, and Confirm dispatches through the same existing guarded command paths.

## What changed

- Three.js command target rings are now selectable preview targets, while staying renderer-level `visualOnly`, `readOnly`, `previewOnly`, `routeAuthority: false`, `actionAuthority: false`, and `executableActions: 0`.
- The Founders Plot UI listens for `founders-plot-expedition-command-target-preview`, validates the target against the current server-owned Expedition Map read model, and renders a compact preview panel.
- Confirm supports only existing server-backed commands:
  - `move_unit` -> existing Scout movement endpoint through `doMoveExpeditionUnit`.
  - `scout_sector` -> existing Scout Sector endpoint through `doScoutExpeditionSector`.
  - `prepare_settler_convoy` -> existing Site Plan convoy endpoint through `doPrepareSettlerConvoy`.
  - `found_settlement` -> existing Settlement endpoint through `doFoundSettlement`.
- Cancel clears the preview without mutation.
- Ordinary map/unit selection clears stale previews.
- The preview panel stops pointer/click propagation so map drag/pick handlers cannot swallow Confirm/Cancel clicks.

## Files touched

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `e2e/200_founders_plot.spec.js`
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check e2e/200_founders_plot.spec.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --reporter=line` passed 1/1.
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js -g "FP-E2E-023" --reporter=line` passed 1/1.
- `npm run test:founders-plot` passed 98/98.
- `file reports/agent-town-hq16a-direct-map-command-preview-desktop-2026-06-02.png` confirmed a valid `1232 x 625` PNG.
- `git diff --check`

## Guardrails

- No new server route, tool action, or server authority surface was added.
- Scout Sector remains the only fog reveal mutation.
- Scout movement remains bounded to adjacent discovered/known cells on the same plot.
- Surveyor and Settler commands continue to use existing guarded endpoints and payloads.
- Command target rings do not execute directly from the renderer.
- No Atlas execution, Generated Universe runtime expansion, route/trade/economy/resource/reward/combat/scheduler/cross-plot behavior, hidden autonomy, hidden-truth leakage, deploy, merge, public sharing, or external effects.

## Artifacts

- Screenshot: `reports/agent-town-hq16a-direct-map-command-preview-desktop-2026-06-02.png`
- Proof: `reports/agent-town-hq16a-direct-map-command-preview-proof-2026-06-02.json`
