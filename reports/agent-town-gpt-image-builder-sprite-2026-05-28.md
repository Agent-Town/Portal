# Agent Town GPT Image Builder Sprite Report - 2026-05-28

## Branch and Commit

- Branch: `neo/founders-plot-gpt-image-builder-sprite-2026-05-28`
- Base branch: `neo/founders-plot-animated-inhabitant-characters-2026-05-28`
- Implementation commit: `8cf077e008c2f78ddbb8c5a26e0834e30715f0b6`
- Remote: `origin` (`git@github.com:Agent-Town/Portal.git`)
- PR: not opened in this lane

## Final Assets

- Source chroma-key sheet: `public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-sprite-sheet-gpt2-v1.source.png`
- Transparent sprite sheet: `public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-sprite-sheet-gpt2-v1.png`
- Sprite metadata: `public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-sprite-sheet-gpt2-v1.json`
- Scene evidence screenshot: `reports/agent-town-gpt-image-builder-sprite-scene-2026-05-28.png`

## Generation

- Tool/model: OpenClaw image generation with `openai/gpt-image-2`
- Output size: 2048x2048 PNG source, 4 columns by 4 rows
- Frame size: 512x512
- Source background requested: flat `#ff00ff` chroma-key

Final prompt:

```text
Use case: illustration-story Asset type: 2D game sprite sheet for Agent Town Founders Plot inhabitants. Input images: use the attached Clover character images as style references for the warm frontier storybook character language; use the Founders Plot scene and lumber camp image only as palette and setting references. Primary request: Create a production-style builder inhabitant sprite sheet on a perfectly flat solid #ff00ff chroma-key background for local background removal. Sprite sheet layout: exact 4 columns by 4 rows, 16 animation frames total, no labels, no numbers, no text, no grid lines. Each frame should have the same centered character scale and consistent feet position, with generous padding in every cell. Keep the sheet orthographic/front three-quarter view, readable as a tiny gameplay sprite. Rows and actions: Row 1 idle frames with subtle breathing and friendly expression. Row 2 walk/trot frames with playful short steps. Row 3 hammer/work frames with a small hammer and construction motion. Row 4 carry/celebrate/ready frames with tiny rolled plans or a small bundle, ending in a warm ready gesture. Subject: A cute animated builder inhabitant with exaggerated friendly proportions, large expressive eyes, rounded face, tiny hardhat or frontier cap, tool belt, small hammer or rolled plans. Funny, warm, hardworking, non-threatening. No weapons, no logos, no visible text anywhere. Style: match the existing Clover / Agent Town frontier storybook look: handcrafted storybook-game art, soft painterly shapes, clear ink-like silhouettes, warm earthy orange/yellow/brown accents, creamy highlights, readable at gameplay scale, polished but not photorealistic. Small lovable worker in a frontier settlement, not a mascot logo. Chroma-key requirements: background must be one uniform #ff00ff color with no shadows, gradients, texture, floor plane, reflections, lighting variation, or cast/contact shadow. Do not use #ff00ff anywhere in the character, props, outlines, highlights, or antialiasing if avoidable. Crisp edges for background removal. Transparent output is not required in this generation; chroma key is intentional.
```

## Transparency

The generated source background was magenta but not exact `#ff00ff` at the corners. The bundled chroma-key helper was present, but the active Python did not have Pillow installed, so the alpha sheet was produced with ImageMagick:

```bash
magick public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-sprite-sheet-gpt2-v1.source.png \
  -alpha set -fuzz 22% -transparent '#f207f4' \
  public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-sprite-sheet-gpt2-v1.png
```

Validation showed `PNG 2048x2048 srgba`, transparent corner pixels, and alpha range `0..1`.

## Integration

- `scene_state.js` now assigns the generated builder sheet to `builder` visual actors only.
- The sheet metadata maps builder construction/upgrade actors to row 3 (`work`) and keeps idle/ready rows available for later states.
- `three_scene_entry.js` now crops sprite-sheet textures with `repeat/offset`, animates the frame column in the render loop, and reports `renderedActors` debug data for tests.
- If the builder asset fails to load, the renderer replaces it with the existing procedural builder texture and marks `assetFallback`.
- Existing visual-only actor semantics are unchanged; actor clicks still dispatch non-mutating picks only.

## Validation

Passed:

```bash
node --check public/experiences/founders-plot/scene_state.js
node --check public/experiences/founders-plot/three_scene_entry.js
node --check e2e/214_founders_plot_threejs_playable_slice.spec.js
node --check tests-founders-plot/fp-scene-state.test.js
npm run build:founders-plot-threejs
npm run test:founders-plot
PW_PORT=4874 npx playwright test e2e/214_founders_plot_threejs_playable_slice.spec.js
PW_PORT=4875 npx playwright test e2e/200_founders_plot.spec.js
node --check public/experiences/founders-plot/three_scene_bundle.js
git diff --check
```

Full suite:

```bash
npm test
```

Result: `269 passed`, `2 skipped`, `8 failed`. The failures were in existing onboarding/localization coverage outside this builder sprite lane:

- `e2e/120_onboarding_privy_required.spec.js` had 7 failures around missing stepper/townhall/ceremony elements and sigil icon sizing.
- `e2e/131_experience_preference_runtime_copy.spec.js` had 1 mainland localization expectation failure for a deep house runtime error.

Founders Plot coverage passed within the full suite, including `e2e/200_founders_plot.spec.js` and `e2e/214_founders_plot_threejs_playable_slice.spec.js`.

## Known Risks

- The source sheet is production-style but still a first proof; frame scale and feet positions are usable, not yet animation-polished to a strict rig.
- The alpha conversion used ImageMagick instead of the Pillow helper because Pillow was unavailable in the active Python.
- The PNG sprite/source pair adds about 9.6 MB before future optimization.

## Recommended Next Roles

1. Worker: production/tool handling row set.
2. Hauler: carry/bundle row set.
3. Messenger: notice/attention row set.
4. Clover overlay/action variants only after inhabitant roles settle.
