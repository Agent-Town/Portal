# Agent Town HQ14M Soft Region Seams - 2026-06-01

## Verdict

PASS

HQ14M softens the Expedition Map's visible hex seams so the HQ14L continuous terrain/fog underlay carries more of the world read. This is a narrow Three.js renderer polish pass: no server authority, gameplay state, routes, resources, Atlas execution, or mutation paths changed.

## Changes

- Updated the Expedition Map visual shell to `hq14m_soft_region_seams_v1`.
- Reduced non-selected region plate opacity and line contrast.
- Muted the smaller center tile layer so terrain texture reads as part of the continuous world rather than isolated proof thumbnails.
- Preserved clear selected-sector, hover, home, and Scout Sector affordances.
- Added runtime proof flags for soft seams, reduced plate-edge contrast, and muted center tiles.
- Rebuilt `public/experiences/founders-plot/three_scene_bundle.js`.
- Updated focused `FP-E2E-023` proof expectations and artifact names for HQ14M.

Source files changed:

- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`

## Proof Artifacts

- Desktop screenshot: `reports/agent-town-hq14m-soft-region-seams-desktop-2026-06-01.png`
- Mobile screenshot: `reports/agent-town-hq14m-soft-region-seams-mobile-2026-06-01.png`
- Contact sheet: `reports/agent-town-hq14m-soft-region-seams-contact-sheet-2026-06-01.png`
- Proof JSON: `reports/agent-town-hq14m-soft-region-seams-proof-2026-06-01.json`

Proof JSON confirms:

- `visualShell: hq14m_soft_region_seams_v1`
- `softRegionSeams: true`
- `reducedPlateEdgeContrast: true`
- `centerTileMutedForUnderlay: true`
- hidden underlay cells remain fog-only
- continuous underlay has no action authority
- Scout Sector remains the only mutation path

## Verification

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `PW_PORT=4976 npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium --grep "FP-E2E-023" --reporter=line`
- `jq empty reports/agent-town-hq14m-soft-region-seams-proof-2026-06-01.json`
- `file` on HQ14M desktop, mobile, and contact-sheet PNGs
- `git diff --check`

## Guardrails Held

- No server/store/routes/tools/schema authority changes.
- No new Expedition Map mutation path.
- Scout Sector remains the only current map reveal action.
- Hidden/locked cells stay fog-only and do not expose resources, routes, jobs, action data, receipts, or specific hidden terrain truth.
- Event Packet, Expedition Party, receipt, selected-sector, objective/current-focus, and ledger surfaces remain read-only/buttonless except the existing eligible Scout Sector UI.
- No Atlas execution, public sharing, deploy, Generated Universe rendering, hidden autonomy, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation, or external effects.

## Residual Visual Gaps

This makes the current runtime map less tiled and more world-like, but it is still fundamentally a hex-sector strategy map. The next best visual slice is either a richer generated terrain underlay composition or a deliberate sector-boundary style that feels like authored cartography rather than UI outlines.
