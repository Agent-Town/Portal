# AgentTown HQ17E - Clean HUD Compositor

Status: `IMPLEMENTED_UNCOMMITTED`
Verdict: `PASS_WITH_VISUAL_NOTES`

## Scope

Respond to Robin's review that the generated HUD still looked weird: some elements were stretched, overlapping, or duplicated because concept-image crops contained baked HUD contents.

This pass keeps the HQ17C generated HUD chrome pack as the source/provenance style pack, but stops painting those opaque source crops directly into runtime HUD slots.

## Implementation

- Added `hq17e_clean_hud_chrome_compositor_v1`.
- Replaced painted GPT concept crop sprites with clean Three.js canvas-frame textures for the same HUD slots.
- Retained each source crop path in proof metadata as the style/provenance source.
- Kept worker/unit portraits as renderer-owned circular medallions sourced from the HQ15E generated unit sprite pack.
- Removed crop-image backgrounds and backdrop blur from the DOM hit layer when the Three mask/text HUD is active.
- Repositioned compact/mobile unit-dock text and profile medallions so the label no longer clips into the viewport edge.
- Added proof assertions that the generated source pack is retained, but source crops are not painted as the live HUD surface.

## Result

The HUD can now use server-owned workers/units plus generated unit sprites cleanly:

- Unit portraits come from `expeditionMap.units.items` and the HQ15E sprite pack.
- The generated HUD pack remains a swappable style/provenance source.
- The runtime HUD no longer duplicates baked concept portraits, fake status marks, or stretched opaque panels.
- DOM remains the accessible/clickable hit layer.

## Verification

Passed:

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/209_founders_plot_hq17b_option1_runtime_hud_visual_proof.spec.js`
- `node --check e2e/210_founders_plot_hq17c_generated_hud_chrome_runtime.spec.js`
- `node --check e2e/211_founders_plot_hq17d_three_masked_hud_profiles.spec.js`
- `npm run build:founders-plot-threejs`
- `PW_PORT=4998 npx playwright test e2e/209_founders_plot_hq17b_option1_runtime_hud_visual_proof.spec.js e2e/210_founders_plot_hq17c_generated_hud_chrome_runtime.spec.js e2e/211_founders_plot_hq17d_three_masked_hud_profiles.spec.js --project=chromium --workers=1 --reporter=line`
- `jq empty` for refreshed HQ17B/HQ17C/HQ17D proof JSONs and the generated HUD manifest
- PNG `file` checks for refreshed HQ17B/HQ17C/HQ17D desktop/mobile/contact-sheet artifacts
- `git diff --check`

Proof summary:

- `generatedHudChromeCleanComposite` is true.
- `generatedHudChromePaintedSourceCrops` is false.
- `sourceCropsNotPainted` is true in refreshed HQ17C/HQ17D proof guardrails.
- Unit profile medallions remain `three_canvas_texture` circle alpha clips.
- HUD text mirror remains `three_canvas_texture`.
- Primary HUD text contains no endpoint names or proof prose.
- Mobile proof has no horizontal overflow.

## Guardrails

Held:

- No server, route, tool, store, schema, package, or gameplay authority changes.
- No new mutation path.
- No movement, route, trade, economy, resource, reward, combat, scheduler, or cross-plot behavior.
- No Atlas execution.
- No Generated Universe runtime expansion.
- No hidden autonomy or hidden-truth leakage.
- No commit, push, merge, deploy, public share, external message, cleanup, or external effect.

## Visual Notes

This fixes the duplication/stretching problem caused by using opaque concept crops as live panels. It is still not the final art direction: the best next visual step is a real transparent HUD component generation pass, but this version is now structurally clean enough to keep iterating on the gameplay HUD without fighting baked-in fake UI.
