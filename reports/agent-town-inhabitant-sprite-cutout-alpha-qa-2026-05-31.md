# Agent Town Inhabitant Sprite Cutout / Alpha QA - 2026-05-31

## Scope

- Runtime assets inspected: 23 inhabitant/object PNG/WebP files.
- Variant/source/generated images inventoried: 57.
- Metadata JSON files parsed: 22.
- Production assets were not modified.

## Method

- Decoded each runtime asset with ImageMagick as 8-bit RGBA and checked dimensions, channels, colorspace, alpha min/max, transparent corners, border alpha, and chroma-like visible-edge pixels.
- Visible-edge pixels are alpha > 16 pixels adjacent to alpha <= 16. Chroma-like classes include magenta/purple, green, cyan/blue, orange/tan, and white/light.
- Interior-hole telemetry scans each sprite frame bbox for transparent islands not connected to the bbox exterior. These can be legitimate negative space between limbs/tools, so they are review signals rather than automatic defects.

## Summary

- pass: 2
- review: 12
- repair recommended: 9

- JSON details: `reports/agent-town-inhabitant-sprite-cutout-alpha-qa-2026-05-31.json`
- Contact sheet: `reports/agent-town-inhabitant-sprite-cutout-alpha-contact-sheet-2026-05-31.png`
- Diagnostic checker thumbnails: `reports/agent-town-inhabitant-sprite-cutout-alpha-diagnostics-2026-05-31/`
- Contact sheet border colors: green pass, amber review, red repair recommended.

## Worst Offenders

- **repair recommended** `public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-sprite-sheet-gpt2-v1.png` - magenta/purple edge residue (4168 pixels, 13.53% of visible edge); non-magenta chroma-like edge residue (192 pixels); 7 large enclosed transparent islands across frames
- **repair recommended** `public/experiences/founders-plot/assets/characters/inhabitants/messenger/messenger-agentfolk-v1.png` - magenta/purple edge residue (592 pixels, 1.73% of visible edge); non-magenta chroma-like edge residue (308 pixels); 12 large enclosed transparent islands across frames
- **repair recommended** `public/experiences/founders-plot/assets/characters/inhabitants/research_doctrine_keeper/research-doctrine-keeper-v1.png` - 36 non-transparent border pixels; non-magenta chroma-like edge residue (706 pixels); 7 large enclosed transparent islands across frames
- **repair recommended** `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v1.png` - magenta/purple edge residue (6092 pixels, 20.69% of visible edge); 20 large enclosed transparent islands across frames
- **repair recommended** `public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-agentfolk-v2.png` - magenta/purple edge residue (2087 pixels, 6.34% of visible edge); 16 large enclosed transparent islands across frames
- **repair recommended** `public/experiences/founders-plot/assets/characters/inhabitants/worker/worker-agentfolk-v1.png` - magenta/purple edge residue (654 pixels, 2.09% of visible edge); 11 large enclosed transparent islands across frames
- **repair recommended** `public/experiences/founders-plot/assets/characters/inhabitants/hauler/hauler-agentfolk-v1.png` - magenta/purple edge residue (606 pixels, 1.93% of visible edge); 14 large enclosed transparent islands across frames
- **repair recommended** `public/experiences/founders-plot/assets/characters/inhabitants/hauler/oona-tallpack-hauler-v1.png` - magenta/purple edge residue (325 pixels, 0.97% of visible edge); 25 large enclosed transparent islands across frames
- **repair recommended** `public/experiences/founders-plot/assets/characters/inhabitants/worker/kettle-37-worker-v1.png` - magenta/purple edge residue (109 pixels, 0.37% of visible edge); 14 large enclosed transparent islands across frames
- **review** `public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.png` - non-magenta chroma-like edge residue (576 pixels); 20 large enclosed transparent islands across frames

## Runtime Asset Findings

### `public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-agentfolk-v2.png`
- Rank: **repair recommended**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1143787, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 32897; magenta/purple 2087 (6.34%); green 0; cyan/blue 0; orange/tan 29; white/light 0
- Interior alpha islands: frames with islands 16; components 40; large components 16
- Reason: magenta/purple edge residue (2087 pixels, 6.34% of visible edge); 16 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-sprite-sheet-gpt2-v1.png`
- Rank: **repair recommended**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1122086, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 30816; magenta/purple 4168 (13.53%); green 0; cyan/blue 0; orange/tan 192; white/light 2
- Interior alpha islands: frames with islands 14; components 38; large components 7
- Reason: magenta/purple edge residue (4168 pixels, 13.53% of visible edge); non-magenta chroma-like edge residue (192 pixels); 7 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v1.png`
- Rank: **repair recommended**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1243554, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 29449; magenta/purple 6092 (20.69%); green 0; cyan/blue 0; orange/tan 0; white/light 0
- Interior alpha islands: frames with islands 12; components 22; large components 20
- Reason: magenta/purple edge residue (6092 pixels, 20.69% of visible edge); 20 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.png`
- Rank: **review**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1196728, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 31244; magenta/purple 2 (0.01%); green 0; cyan/blue 0; orange/tan 1; white/light 0
- Interior alpha islands: frames with islands 14; components 25; large components 15
- Reason: 15 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/charter_clerk/charter-clerk-v1.png`
- Rank: **review**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1297294, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 30039; magenta/purple 0 (0.00%); green 274; cyan/blue 3; orange/tan 51; white/light 0
- Interior alpha islands: frames with islands 16; components 78; large components 6
- Reason: non-magenta chroma-like edge residue (328 pixels); 6 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.png`
- Rank: **review**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1363216, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 32189; magenta/purple 0 (0.00%); green 1942; cyan/blue 0; orange/tan 53; white/light 0
- Interior alpha islands: frames with islands 15; components 25; large components 4
- Reason: non-magenta chroma-like edge residue (1995 pixels); 4 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/cohort_hall_coordinator/cohort-hall-coordinator-v1.png`
- Rank: **review**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1534136, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 28876; magenta/purple 0 (0.00%); green 2914; cyan/blue 0; orange/tan 410; white/light 0
- Interior alpha islands: frames with islands 7; components 9; large components 6
- Reason: non-magenta chroma-like edge residue (3324 pixels); 6 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/hauler/hauler-agentfolk-v1.png`
- Rank: **repair recommended**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1031885, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 31444; magenta/purple 606 (1.93%); green 0; cyan/blue 0; orange/tan 95; white/light 0
- Interior alpha islands: frames with islands 12; components 31; large components 14
- Reason: magenta/purple edge residue (606 pixels, 1.93% of visible edge); 14 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/hauler/oona-tallpack-hauler-v1.png`
- Rank: **repair recommended**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1114941, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 33573; magenta/purple 325 (0.97%); green 0; cyan/blue 0; orange/tan 5; white/light 0
- Interior alpha islands: frames with islands 16; components 78; large components 25
- Reason: magenta/purple edge residue (325 pixels, 0.97% of visible edge); 25 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/market_trader/market-trader-v1.png`
- Rank: **review**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1042050, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 28979; magenta/purple 0 (0.00%); green 258; cyan/blue 96; orange/tan 7; white/light 0
- Interior alpha islands: frames with islands 16; components 83; large components 2
- Reason: non-magenta chroma-like edge residue (361 pixels); 2 large enclosed transparent island(s), likely negative space unless visually confirmed

### `public/experiences/founders-plot/assets/characters/inhabitants/messenger/messenger-agentfolk-v1.png`
- Rank: **repair recommended**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1221848, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 34256; magenta/purple 592 (1.73%); green 0; cyan/blue 63; orange/tan 245; white/light 0
- Interior alpha islands: frames with islands 16; components 48; large components 12
- Reason: magenta/purple edge residue (592 pixels, 1.73% of visible edge); non-magenta chroma-like edge residue (308 pixels); 12 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.png`
- Rank: **review**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 685673, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 30474; magenta/purple 0 (0.00%); green 0; cyan/blue 0; orange/tan 602; white/light 4
- Interior alpha islands: frames with islands 16; components 40; large components 9
- Reason: non-magenta chroma-like edge residue (602 pixels); 9 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.png`
- Rank: **review**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1097427, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 30382; magenta/purple 0 (0.00%); green 1425; cyan/blue 0; orange/tan 381; white/light 0
- Interior alpha islands: frames with islands 16; components 42; large components 13
- Reason: non-magenta chroma-like edge residue (1806 pixels); 13 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.png`
- Rank: **review**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1150024, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 33870; magenta/purple 0 (0.00%); green 417; cyan/blue 0; orange/tan 56; white/light 0
- Interior alpha islands: frames with islands 16; components 82; large components 15
- Reason: non-magenta chroma-like edge residue (473 pixels); 15 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/research_doctrine_keeper/research-doctrine-keeper-v1.png`
- Rank: **repair recommended**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1466138, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 36, semi-transparent border pixels 0
- Edge residue: visible-edge 31272; magenta/purple 0 (0.00%); green 547; cyan/blue 57; orange/tan 102; white/light 0
- Interior alpha islands: frames with islands 16; components 45; large components 7
- Reason: 36 non-transparent border pixels; non-magenta chroma-like edge residue (706 pixels); 7 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png`
- Rank: **review**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 952659, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 33025; magenta/purple 0 (0.00%); green 0; cyan/blue 1; orange/tan 36; white/light 0
- Interior alpha islands: frames with islands 14; components 25; large components 11
- Reason: 11 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.png`
- Rank: **review**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1355663, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 37451; magenta/purple 0 (0.00%); green 1449; cyan/blue 426; orange/tan 17; white/light 0
- Interior alpha islands: frames with islands 16; components 92; large components 7
- Reason: non-magenta chroma-like edge residue (1892 pixels); 7 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.png`
- Rank: **review**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1042050, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 28979; magenta/purple 0 (0.00%); green 258; cyan/blue 96; orange/tan 7; white/light 0
- Interior alpha islands: frames with islands 16; components 83; large components 2
- Reason: non-magenta chroma-like edge residue (361 pixels); 2 large enclosed transparent island(s), likely negative space unless visually confirmed

### `public/experiences/founders-plot/assets/characters/inhabitants/worker/kettle-37-worker-v1.png`
- Rank: **repair recommended**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1306624, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 29568; magenta/purple 109 (0.37%); green 0; cyan/blue 0; orange/tan 22; white/light 1
- Interior alpha islands: frames with islands 12; components 35; large components 14
- Reason: magenta/purple edge residue (109 pixels, 0.37% of visible edge); 14 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/worker/worker-agentfolk-v1.png`
- Rank: **repair recommended**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 989399, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 31353; magenta/purple 654 (2.09%); green 0; cyan/blue 2; orange/tan 90; white/light 2
- Interior alpha islands: frames with islands 15; components 32; large components 11
- Reason: magenta/purple edge residue (654 pixels, 2.09% of visible edge); 11 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.png`
- Rank: **review**
- Image: PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 4x4 frames, 512x512 px
- Alpha: min 0, max 255, visible 1224865, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 44454; magenta/purple 0 (0.00%); green 303; cyan/blue 239; orange/tan 34; white/light 0
- Interior alpha islands: frames with islands 16; components 216; large components 20
- Reason: non-magenta chroma-like edge residue (576 pixels); 20 large enclosed transparent islands across frames

### `public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.png`
- Rank: **pass**
- Image: PNG 1024x1024, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 1x1 frames, 1024x1024 px
- Alpha: min 0, max 255, visible 339017, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 2448; magenta/purple 0 (0.00%); green 0; cyan/blue 0; orange/tan 56; white/light 0
- Interior alpha islands: frames with islands 0; components 0; large components 0
- Reason: transparent corners/borders clean; no material chroma fringe detected by metrics

### `public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp`
- Rank: **pass**
- Image: WEBP 1024x1024, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- Frame model: 1x1 frames, 1024x1024 px
- Alpha: min 0, max 255, visible 339017, semi-transparent 0 (0.00% of visible)
- Corners/border: non-transparent corners 0, non-transparent border pixels 0, semi-transparent border pixels 0
- Edge residue: visible-edge 2448; magenta/purple 0 (0.00%); green 0; cyan/blue 0; orange/tan 14; white/light 0
- Interior alpha islands: frames with islands 0; components 0; large components 0
- Reason: transparent corners/borders clean; no material chroma fringe detected by metrics

## Variant Inventory

- `public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-agentfolk-v2.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-agentfolk-v2.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-sprite-sheet-gpt2-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-sprite-sheet-gpt2-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/charter_clerk/charter-clerk-v1.generated.png` - PNG 1254x1254, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/charter_clerk/charter-clerk-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/charter_clerk/charter-clerk-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.generated.png` - PNG 1254x1254, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/cohort_hall_coordinator/cohort-hall-coordinator-v1.generated.png` - PNG 1254x1254, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/cohort_hall_coordinator/cohort-hall-coordinator-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/cohort_hall_coordinator/cohort-hall-coordinator-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/hauler/hauler-agentfolk-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/hauler/hauler-agentfolk-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/hauler/oona-tallpack-hauler-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/hauler/oona-tallpack-hauler-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/market_trader/market-trader-v1.generated.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/market_trader/market-trader-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/market_trader/market-trader-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/messenger/messenger-agentfolk-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/messenger/messenger-agentfolk-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.generated.png` - PNG 1254x1254, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.generated.png` - PNG 1254x1254, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/research_doctrine_keeper/research-doctrine-keeper-v1.generated.png` - PNG 1254x1254, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/research_doctrine_keeper/research-doctrine-keeper-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/research_doctrine_keeper/research-doctrine-keeper-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.generated.png` - PNG 1254x1254, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.generated.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.generated.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/worker/kettle-37-worker-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/worker/kettle-37-worker-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/worker/worker-agentfolk-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/worker/worker-agentfolk-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.generated.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.png` - PNG 2048x2048, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.source.png` - PNG 2048x2048, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.generated.png` - PNG 1254x1254, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.png` - PNG 1024x1024, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`
- `public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.source.png` - PNG 1024x1024, channels `srgb  3.0`, colorspace `sRGB`, depth 8, type `TrueColor`
- `public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp` - WEBP 1024x1024, channels `srgba 4.0`, colorspace `sRGB`, depth 8, type `TrueColorAlpha`

## Recommendations

- Repair the high-magenta legacy/candidate sheets first: they have visible chroma fringe risk under texture filtering and should be re-cut from source or edge-decontaminated before integration.
- Review `research-doctrine-keeper-v1.png` specifically for non-transparent border pixels, which is a more concrete alpha export defect than ordinary interior negative space.
- Keep the world-grid civic beacon assets: both runtime PNG and WebP pass transparent-corner/border and chroma-fringe checks.
