# AgentTown HQ17H HUD/World Cohesion

## Verdict

`PASS`: HQ17H keeps the HQ17F/G renderer-owned HUD contract intact and adds a visual-only HUD/world cohesion pass for the Expedition Map.

The pass makes the current HUD feel less like separate overlay panels by adding renderer-owned foreground/background treatment and selected-context world connection:

- A procedural map-depth veil darkens edges and pushes the map behind the HUD without hiding server-owned fog/terrain truth.
- A bottom foreground bridge sits under the unit dock and command tray, visually balancing the bottom HUD hardware.
- The selected cell gains a soft world aura and a Three.js tether into the selected-context frame.
- Unit dock, command tray, and selected-context canvas frames got small connector/socket details and tighter width/height balance.

## Scope

Touched only the HQ17H allowed surface:

- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `e2e/214_founders_plot_hq17h_hud_world_cohesion.spec.js`
- `reports/agent-town-hq17h-hud-world-cohesion-2026-06-03.md`
- `reports/agent-town-hq17h-hud-world-cohesion-proof-2026-06-03.json`
- `reports/agent-town-hq17h-hud-world-cohesion-desktop-2026-06-03.png`
- `reports/agent-town-hq17h-hud-world-cohesion-post-scout-2026-06-03.png`
- `reports/agent-town-hq17h-hud-world-cohesion-mobile-2026-06-03.png`
- `reports/agent-town-hq17h-hud-world-cohesion-contact-sheet-2026-06-03.png`

No `founders-plot.js` change was needed. CSS changes only demote dynamic post-Scout DOM bridge/visit/result panels into the same transparent hit/accessibility layer, so the later-loop screenshot does not leak visible DOM chrome over the renderer-owned HUD.

## Guardrails

- Visible HUD owner remains `three_canvas`.
- DOM HUD remains transparent hit/accessibility/test-selector layer.
- Existing DOM command handlers and Scout Sector payload shape are retained.
- No renderer network authority or mutation authority was added.
- HQ17H cohesion sprites/lines are visual-only, read-only, non-selectable, and zero-action.
- No server/API/schema/store/tool/package changes.
- No new gameplay mutation path.
- No Atlas execution.
- No Generated Universe runtime expansion.
- No hidden autonomy or hidden-truth leakage.
- No route/trade/economy/resource/reward/combat/scheduler/cross-plot behavior.
- No image generation, deploy, merge, push, public share, or external action.

## Proof

Focused browser proof:

- `PW_PORT=5001 npx playwright test e2e/214_founders_plot_hq17h_hud_world_cohesion.spec.js --project=chromium --workers=1 --reporter=line`
- Result: `1 passed`

Proof JSON highlights:

- `rendererOwnedWorldCohesion: true`
- `selectedContextWorldConnection: true`
- `foregroundBridgePresent: true`
- `depthSeparationPresent: true`
- `noAuthorityExpansion: true`
- `noMobileHorizontalOverflow: true`

Artifacts:

- Desktop: `reports/agent-town-hq17h-hud-world-cohesion-desktop-2026-06-03.png`
- Post-Scout: `reports/agent-town-hq17h-hud-world-cohesion-post-scout-2026-06-03.png`
- Mobile: `reports/agent-town-hq17h-hud-world-cohesion-mobile-2026-06-03.png`
- Contact: `reports/agent-town-hq17h-hud-world-cohesion-contact-sheet-2026-06-03.png`
- Proof JSON: `reports/agent-town-hq17h-hud-world-cohesion-proof-2026-06-03.json`

## Validation Run

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/209_founders_plot_hq17b_option1_runtime_hud_visual_proof.spec.js`
- `node --check e2e/212_founders_plot_hq17f_single_owner_canvas_hud.spec.js`
- `node --check e2e/213_founders_plot_hq17g_hud_materiality.spec.js`
- `node --check e2e/214_founders_plot_hq17h_hud_world_cohesion.spec.js`
- `npm run build:founders-plot-threejs`
- `PW_PORT=5001 npx playwright test e2e/214_founders_plot_hq17h_hud_world_cohesion.spec.js --project=chromium --workers=1 --reporter=line`
- `PW_PORT=5002 npx playwright test e2e/209_founders_plot_hq17b_option1_runtime_hud_visual_proof.spec.js --project=chromium --workers=1 --reporter=line`
- `PW_PORT=5002 npx playwright test e2e/212_founders_plot_hq17f_single_owner_canvas_hud.spec.js e2e/213_founders_plot_hq17g_hud_materiality.spec.js --project=chromium --workers=1 --reporter=line`
- `magick ... +append reports/agent-town-hq17h-hud-world-cohesion-contact-sheet-2026-06-03.png`
- PNG `file`/`sips` checks for desktop, mobile, and contact sheet
- Guardrail `jq` checks for renderer-owned HUD, zero visible persistent DOM HUD paint/text, later-loop post-Scout capture, no authority expansion, and mobile no-overflow

Compatibility note: the legacy HQ17B full-loop proof needed its local timeout raised from 120s to 180s under the current renderer. It then passed without changing its behavioral assertions. Rerunning HQ17B/F/G refreshes their screenshots/proof JSON with current renderer metadata, so their refreshed hashes are not a pre-HQ17H visual baseline.

## Visual Risk

This is a cohesion pass, not a full North Star art rebuild. The screen now has better depth separation and selected-context connection, but the underlying map art and mobile layout still limit how close it can get to the generated concept direction without a larger terrain/world-art pass.
