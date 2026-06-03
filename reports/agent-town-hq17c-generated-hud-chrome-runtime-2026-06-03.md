# AgentTown HQ17C - Generated HUD Chrome Runtime

Status: `IMPLEMENTED_UNCOMMITTED`
Verdict: `PASS_WITH_VISUAL_NOTES`

## Scope

Promote HQ17A concept 01 from review media into a bounded runtime HUD chrome layer for the Founders Plot Expedition Map.

This is not a new GPT Image generation pass. The lane uses the existing `openai/gpt-image-2` concept 01 review image as source material, crops presentation-only HUD chrome assets, renders those assets in the Three.js map layer, and binds live DOM labels/buttons to the matching chrome slots.

## Source Art

- Source concept: `reports/media/agent-town-hq17a-gpt-image-2-fullscreen-hud-redesign-review-2026-06-03/agent-town-hq17a-fullscreen-hud-redesign-concept-01-2026-06-03.png`
- Runtime pack: `public/experiences/founders-plot/assets/expedition-map/hq17c-generated-hud-chrome-v1/`
- Manifest: `public/experiences/founders-plot/assets/expedition-map/hq17c-generated-hud-chrome-v1/manifest.json`

Runtime slots:

- `crest-status`
- `objective-loop`
- `unit-dock`
- `command-tray`
- `collapsed-ledger`
- `selected-context`
- `command-puck`

## Implementation

- Cropped concept 01 into RGBA runtime chrome assets with rounded/circular alpha masks.
- Added `data-generated-chrome-slot`, `data-generated-chrome-src`, `data-generated-chrome-pack`, and `data-generated-chrome-live-text="dom"` bindings to live HUD surfaces.
- Passed the generated chrome pack into the Expedition Map Three.js renderer.
- Added visual-only, read-only screen-space Three.js sprites for the generated chrome layer.
- Kept the live labels/buttons in DOM/CSS so text remains accessible, testable, and server-data-driven.
- Kept existing guarded command handlers for Scout, Plan, Review, Convoy, and Found.
- Updated the existing HQ17B proof expectation to accept the new `hq17c_generated_chrome_runtime` composition.
- Added focused browser proof `FP-E2E-022C`.

## Files

Edited:

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `e2e/209_founders_plot_hq17b_option1_runtime_hud_visual_proof.spec.js`

Created:

- `e2e/210_founders_plot_hq17c_generated_hud_chrome_runtime.spec.js`
- `public/experiences/founders-plot/assets/expedition-map/hq17c-generated-hud-chrome-v1/`
- `reports/agent-town-hq17c-generated-hud-chrome-runtime-proof-2026-06-03.json`
- `reports/agent-town-hq17c-generated-hud-chrome-runtime-desktop-2026-06-03.png`
- `reports/agent-town-hq17c-generated-hud-chrome-runtime-mobile-2026-06-03.png`
- `reports/agent-town-hq17c-generated-hud-chrome-runtime-contact-sheet-2026-06-03.png`

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check e2e/209_founders_plot_hq17b_option1_runtime_hud_visual_proof.spec.js`
- `node --check e2e/210_founders_plot_hq17c_generated_hud_chrome_runtime.spec.js`
- `npm run build:founders-plot-threejs`
- `PW_PORT=4991 npx playwright test e2e/210_founders_plot_hq17c_generated_hud_chrome_runtime.spec.js --project=chromium --reporter=line`
- `jq empty reports/agent-town-hq17c-generated-hud-chrome-runtime-proof-2026-06-03.json`
- `jq empty public/experiences/founders-plot/assets/expedition-map/hq17c-generated-hud-chrome-v1/manifest.json`
- HQ17C guardrail predicate over proof JSON
- PNG `file` checks for desktop, mobile, contact sheet, and runtime chrome assets
- Focused `git diff --check`

Proof summary:

- Generated chrome exists in the Three.js renderer layer.
- Generated chrome is also bound to live DOM slots by source path and slot id.
- Live text source remains `dom`.
- Generated chrome sprites are visual-only, read-only, not selectable, and have zero executable actions.
- Primary HUD text contains no `et.plot.*` endpoint names or proof prose.
- Mobile proof has no horizontal overflow.

## Guardrails

Held:

- No server, route, tool, store, schema, package, or gameplay authority changes.
- No new mutation path.
- No movement, route, trade, economy, resource, reward, combat, scheduler, or cross-plot behavior.
- No Atlas execution.
- No Generated Universe runtime expansion.
- No hidden autonomy or hidden-truth leakage.
- No push, merge, deploy, public share, external message, or external effect.

## Visual Notes

This is the first runtime pass that makes the generated image chrome real. It is visibly closer to Robin's requested direction than HQ17B, but it is still a crop-and-bind implementation:

- Some cropped frames retain concept-background pixels because the source image was a full opaque concept sheet, not isolated transparent UI parts.
- The next art pass should generate or extract cleaner standalone transparent HUD components for these same slots.
- The current version preserves accessibility and testability by keeping live text/buttons in DOM rather than rasterizing text into WebGL.
