# AgentTown HQ17D - Three Masked HUD Profiles

Status: `IMPLEMENTED_UNCOMMITTED`
Verdict: `PASS_WITH_VISUAL_NOTES`

## Scope

Respond to Robin's HQ17C review: combine generated HUD chrome more cleanly, move unit profile treatment into Three.js, and reduce reliance on visible HTML text in generated chrome slots.

This slice keeps the HQ17C generated chrome pack and adds a renderer-owned mask/text layer. It does not add gameplay authority.

## Implementation

- Added `hq17d_three_masked_profiles_and_text_v1` as the generated HUD mask/text layer id.
- Added Three.js canvas-texture circular profile medallions for Expedition Map units.
- Used loaded generated unit sprites inside circular alpha clips with procedural fallback while preserving read-model ownership.
- Added renderer-owned short HUD text sprites for crest/status, objective, unit dock, command tray, and selected context.
- Moved command text from the tiny puck bounds into the generated command tray area.
- Added subtle renderer-drawn label backing inside the Three.js text textures so visible text does not depend on DOM.
- Demoted overlapping DOM text in the generated chrome slots while retaining DOM as the accessible and clickable hit layer.
- Updated the generated HUD chrome manifest runtime policy to record the Three mask/text layer.
- Added focused proof `FP-E2E-022D`.

## Files

Edited:

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `public/experiences/founders-plot/assets/expedition-map/hq17c-generated-hud-chrome-v1/manifest.json`

Created:

- `e2e/211_founders_plot_hq17d_three_masked_hud_profiles.spec.js`
- `reports/agent-town-hq17d-three-masked-hud-profiles-proof-2026-06-03.json`
- `reports/agent-town-hq17d-three-masked-hud-profiles-desktop-2026-06-03.png`
- `reports/agent-town-hq17d-three-masked-hud-profiles-mobile-2026-06-03.png`
- `reports/agent-town-hq17d-three-masked-hud-profiles-contact-sheet-2026-06-03.png`

## Verification

Passed:

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/209_founders_plot_hq17b_option1_runtime_hud_visual_proof.spec.js`
- `node --check e2e/210_founders_plot_hq17c_generated_hud_chrome_runtime.spec.js`
- `node --check e2e/211_founders_plot_hq17d_three_masked_hud_profiles.spec.js`
- `jq empty public/experiences/founders-plot/assets/expedition-map/hq17c-generated-hud-chrome-v1/manifest.json`
- `jq empty reports/agent-town-hq17c-generated-hud-chrome-runtime-proof-2026-06-03.json`
- `jq empty reports/agent-town-hq17d-three-masked-hud-profiles-proof-2026-06-03.json`
- `npm run build:founders-plot-threejs`
- `PW_PORT=4993 npx playwright test e2e/211_founders_plot_hq17d_three_masked_hud_profiles.spec.js --project=chromium --reporter=line`
- `PW_PORT=4994 npx playwright test e2e/210_founders_plot_hq17c_generated_hud_chrome_runtime.spec.js --project=chromium --reporter=line`
- `PW_PORT=4995 npx playwright test e2e/209_founders_plot_hq17b_option1_runtime_hud_visual_proof.spec.js --project=chromium --reporter=line`
- PNG `file` checks for refreshed HQ17B/HQ17C/HQ17D screenshots and contact sheets
- `git diff --check`

Proof summary:

- Unit profile medallions are in the Three.js layer.
- Profile medallions use `circle_alpha_clip` canvas textures.
- Generated HUD text is mirrored in the Three.js layer as `three_canvas_texture`.
- DOM accessibility and click layer is retained.
- Generated masks/text are visual-only, read-only, not selectable, and carry no route/action authority.
- Primary HUD text still exposes no endpoint names or proof prose.
- Mobile proof has no horizontal overflow or clipped primary HUD surfaces.

## Guardrails

Held:

- No server, route, tool, store, schema, package, or gameplay authority changes.
- No new mutation path.
- No movement, route, trade, economy, resource, reward, combat, scheduler, or cross-plot behavior.
- No Atlas execution.
- No Generated Universe runtime expansion.
- No hidden autonomy or hidden-truth leakage.
- No push, merge, deploy, public share, external message, cleanup, or external effect.

## Visual Notes

This is cleaner than HQ17C: the unit dock now reads like generated HUD portrait medallions instead of DOM tokens sitting on top of art. Selected/context text is also visibly renderer-owned.

The text migration is still intentionally partial. Buttons and accessible labels remain DOM for click handling and testability, while Three.js mirrors the short visible HUD labels. The next stronger step should be either a proper transparent HUD component generation pass or a dedicated WebGL/CSS2D control strategy for which text/actions truly move fully into renderer space.
