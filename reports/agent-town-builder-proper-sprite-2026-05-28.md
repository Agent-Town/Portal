# Agent Town Builder Proper Sprite Candidate - 2026-05-28

## Verdict

**Candidate, with edge-quality caveat.** This is a much stronger builder direction than the rejected Mara/Clover-like path: the character reads as an adult frontier construction rigger/surveyor-carpenter, with a broad square silhouette, big gloves, AI survey harness, folding tripod-measure, tool satchel, and red scarf anchor. It does not look like Clover, Kettle, Oona, or Vell.

I would accept it for character-direction review and reject/defer it for final production if the visible magenta edge fringe is considered unacceptable. The sheet is technically usable as 2048x2048 sRGBA with transparent corners, but it will likely need either better native generation edges or a cleaner matte pass before final integration.

## Saved Paths

- Source chroma sheet: `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v1.source.png`
- Alpha PNG: `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v1.png`
- Metadata: `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v1.json`
- Full prompt: `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v1.prompt.md`
- Checker preview: `reports/rigger-slate-builder-v1-checker-preview.png`

## Prompt And Model

- Mode: built-in `image_gen`
- Model/path: available built-in image generation path
- Requested output: exact 2048x2048, 4 columns x 4 rows, flat `#ff00ff` chroma background, no labels/grid/text/watermark
- Prompt stored in full at `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v1.prompt.md`

Reference direction used:

- `/Users/robin/.openclaw/media/agent-town-references/v1_4_4/clover-idle-v1_4_4-no-holes.png`
- `/Users/robin/.openclaw/media/agent-town-references/v1_4_4/clover-acting-v1_4_4-no-holes.png`
- `/Users/robin/.openclaw/media/agent-town-references/v1_4_4/clover-observing-v1_4_4-no-holes.png`
- `/Users/robin/.openclaw/media/agent-town-references/v1_4_4/clover-celebrating-v1_4_4-no-holes.png`
- `/Users/robin/.openclaw/media/agent-town-references/founders-plot-desktop.webp`
- `/Users/robin/.openclaw/media/agent-town-references/lumber-camp.webp`

## Processing Notes

- The built-in generator returned a 1254x1254 PNG despite the prompt requesting 2048x2048.
- I copied that output into the project, then normalized the saved source to exact 2048x2048 with ImageMagick.
- I chroma-keyed the `#ff00ff-ish` background to alpha with ImageMagick using `-fuzz 26% -transparent '#ff00ff'`.
- I did not touch `scene_state.js`, tests, generated bundles, Kettle, Oona, gameplay, server state, economy, or shared scene wiring.

## Validation

ImageMagick identify:

```text
rigger-slate-builder-v1.source.png PNG 2048x2048 sRGB channels=srgb  3.0
rigger-slate-builder-v1.png PNG 2048x2048 sRGB channels=srgba 4.0 alpha-min=0 alpha-max=1
```

Transparent corner checks:

```text
0,0 srgba(0,0,0,0)
2047,0 srgba(0,0,0,0)
0,2047 srgba(0,0,0,0)
2047,2047 srgba(0,0,0,0)
```

SHA-256:

```text
53fbc17fb255236573e7e306fdba281d31cb4810ff28681eea1f07a21aa72049  public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v1.source.png
718d33b539fbcb3bb985fcbf07df8d6471264c32e73d2fbcf2959150abcf33f8  public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v1.png
18450545c3138cea7a369936f8b65d6a663aee5b689d323c6a90e9d307ffafe7  reports/rigger-slate-builder-v1-checker-preview.png
```

## Known Issues

- Thin magenta fringe remains around parts of the character and tripod/tool edges.
- The source is a normalized 2048x2048 copy, not a native 2048x2048 generation result.
- Bottom-row frames are close to the bottom cell edge but still remain inside the 2048x2048 sheet.
- No integration wiring was done by design; this branch is builder asset production only.
