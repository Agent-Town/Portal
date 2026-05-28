# Agent Town Rigger Slate AI Builder Sprite v2 - 2026-05-28

## Verdict

Rigger Slate v2 is the strongest builder candidate so far.

The prior Rigger v1 moved away from Clover, but still read mostly like a broad human surveyor. V2 reads as an AI construction agent: brass-and-teal machinefolk body, cyan lens/display face, antenna beacon, jointed tool arms, weighted boots, survey tools, and construction gestures. It is still friendly and painterly enough for Founders Plot, but it no longer looks like Clover in a different outfit.

## Saved Paths

- `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.prompt.md`
- `reports/rigger-slate-builder-v2-checker-preview.png`

## Integration

`scene_state.js` now maps builder visual actors to `rigger-slate-builder-v2`.

The generated sheet's second row is the construction/action row, so the builder action mapping uses a dedicated `build` sprite action:

- `CONSTRUCT -> build`
- `UPGRADE -> build`
- `OUTPUT_READY -> ready`

This keeps worker/hauler/messenger sprite-row behavior unchanged while showing Rigger's actual measuring/bracing/building frames during construction jobs.

## Prompt And Model

- Path: built-in `image_gen` using the default OpenClaw/Codex image generation path.
- Final prompt: `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.prompt.md`
- Selected generated source provenance: `/Users/robin/.openclaw/agents/main/agent/codex-home/generated_images/019e6db6-c0b0-7470-85b1-e8163787ea71/ig_0679144cc451e09d016a1801745b588191989e60093ebe2359.png`
- Reference intent: no-hole Clover v1_4_4 sheets for polish and finish only; Founders Plot scene and Lumber Camp materials for world context.

## Processing

The built-in image generation output was 1254x1254 even though the prompt requested 2048x2048. The selected source was resized to 2048x2048 as `rigger-slate-builder-v2.source.png`, then chroma-keyed locally with ImageMagick:

```bash
magick rigger-slate-builder-v2.source.png \
  -alpha set \
  -fuzz 28% \
  -transparent '#e80ae5' \
  -define png:color-type=6 \
  rigger-slate-builder-v2.png
```

The bundled `remove_chroma_key.py` helper could not run because Pillow is not installed in this environment, so ImageMagick was used instead.

## Validation

- Source PNG: 2048x2048, sRGB, 3 channels.
- Final PNG: 2048x2048, sRGBA, alpha channel present.
- Alpha range: `0..1`.
- Transparent corners verified at all four corners.
- `rigger-slate-builder-v2.json` parses.
- `scene_state.js` syntax passes.
- `fp-scene-state` passes with the new `build` sprite-row mapping.
- `npm run build:founders-plot-threejs` passes.
- `npm run test:founders-plot` passes 38/38.
- `PW_PORT=4190 npx playwright test e2e/214_founders_plot_threejs_playable_slice.spec.js` passes 1/1 and confirms the Three.js scene reports `rigger-slate-builder-v2` with `spriteSheetAction: build`.
- `PW_PORT=4191 npx playwright test e2e/200_founders_plot.spec.js` passes 9/9.
- `git diff --check` passes.

Final identify line:

```text
rigger-slate-builder-v2.png 2048x2048 sRGB srgba 4.0 alpha=0..1
```

## Known Issues

- A faint purple/magenta edge color remains in a few antialiased edge pixels. It is much less important in-scene than the old human/Clover-read problem, but it is still worth reviewing against the live background before calling the asset final-production clean.
- The source image is a local 2048x2048 upscale from the generator's native 1254x1254 output.
