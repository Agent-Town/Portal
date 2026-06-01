# AgentTown HQ6-HQ7 Production Asset Pack Prompt Spec

Date: 2026-05-30
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Mode: report-only production graphics/frontend spec
Source edits: none

## Objective

Produce one immediate asset pack that lets HQ6/HQ7 land without extending the current placeholder debt. The pack should cover:

1. HQ3 placeholder replacement: Expedition Board, scout/pathfinder sprite, Scout Report prop/icon, Site Plan dossier prop/icon.
2. HQ6 Settlement Charter: charter review board/table plus reviewed-plan stamp/receipt visuals.
3. HQ7 Settler Convoy: settler/convoy crew sprite story, convoy wagon/object, outpost marker/core, claim/founding receipt icons.

Gameplay authority stays server-owned. These assets should only make existing or planned canonical states legible; they must not imply extra mutation paths, territory simulation, autonomous expansion, or editor-owned gameplay.

## Current Facts To Preserve

- `EXPEDITION_BOARD` is already canonical at HQ3, but `public/experiences/founders-plot/scene_state.js` currently maps it to `workshop.webp`.
- `canonicalRoleId: "scout"` exists, but currently uses Rook's `rook-signalpost-messenger-v1` sheet.
- `building.expedition_board`, `action.scout`, `receipt.scout_report`, and `planning.site_plan` exist in both icon registries, but are symbol-only.
- `scene_state.js` sprite sheets use 4 columns x 4 rows, 512px frames, 2048px square PNG sheets, transparent corners, and JSON metadata beside the PNG.
- The Atlas only permits icon raster paths under `/assets/icons/agent-town/`.
- Existing source files in this worktree are dirty in the relevant areas (`public/agent-town-icons.js`, `server/agent_town_icons.js`, `public/experiences/founders-plot/scene_state.js`, `public/experiences/founders-plot/founders-plot.js`). Integrators should merge with those in-flight edits instead of overwriting them.

## Art Direction

Use the existing AgentTown visual target:

- Cozy frontier-tech, storybook/painted, practical inhabited objects.
- 70% frontier / 30% subtle sci-fi.
- 80% warm natural palette, 15% neutral, 5% cyan accent.
- Materials: sun-bleached wood, worn paint, brass, leather, canvas, sandstone, parchment, small circuit inlays, warm lantern light.
- No baked text, logos, readable labels, cyberpunk city, metropolis skyline, combat, weapons, military framing, surveillance wall, chrome sci-fi, fantasy mage/altar, or partisan/current-events imagery.
- Generate clean isolated assets with alpha where they are scene objects/sprites/icons; avoid UI mockup screenshots as production assets.

## Asset Pack A: Replace HQ3 Placeholders

### A1. Expedition Board Building

Purpose: replace Workshop art for canonical `EXPEDITION_BOARD`.

Suggested files:

- `public/experiences/founders-plot/assets/buildings/expedition-board.webp`
- Optional source/provenance:
  - `public/experiences/founders-plot/assets/buildings/expedition-board.source.png`
  - `public/experiences/founders-plot/assets/buildings/expedition-board.prompt.md`
- Icon:
  - `public/assets/icons/agent-town/expedition-board-gpt-image-2-v1.png`

Registry/icon IDs:

- Existing: `building.expedition_board`
- Add/patch `assetFile: "expedition-board-gpt-image-2-v1.png"` in both `server/agent_town_icons.js` and `public/agent-town-icons.js`.

Scene integration target:

- In `assetForBuilding`, map `EXPEDITION_BOARD: "expedition-board"` instead of `"workshop"`.
- Unit expectation: `buildingType === "EXPEDITION_BOARD"` should emit `assetSrc === "/experiences/founders-plot/assets/buildings/expedition-board.webp"`.

Prompt brief:

```text
Isolated cozy frontier-tech Expedition Board building for AgentTown Founders Plot, three-quarter game asset view, transparent background. A small outdoor expedition notice board and survey kiosk built from sun-bleached wood, brass brackets, canvas awning, pinned parchment maps with no readable text, route strings, sample jars, compass tools, lantern glow, and one subtle cyan rangefinder light. Warm natural palette, charming frontier workshop craft, 70% rustic frontier and 30% gentle sci-fi. No logos, no readable words, no combat, no cyberpunk, no metropolis, no dark chrome UI.
```

### A2. Scout / Pathfinder Sprite Sheet

Purpose: stop using Rook as `canonicalRoleId: "scout"`.

Suggested files:

- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.prompt.md`

Scene role IDs:

- `canonicalRoleId: "scout"` for current engine projection.
- Optional story alias in metadata: `roleAliases: ["pathfinder"]`.
- Do not use `generatedOverlayRoleId: "inhabitant.messenger"` once the scout sheet lands; use `generatedOverlayRoleId: "inhabitant.scout"` if the server emits one.

Sprite sheet row/action contract:

```json
{
  "id": "pathfinder-scout-v1",
  "role": "scout",
  "displayName": "Pathfinder Scout",
  "texture": {
    "path": "public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png",
    "format": "png",
    "colorSpace": "sRGB",
    "channels": "sRGBA",
    "width": 2048,
    "height": 2048,
    "alpha": true,
    "transparentCorners": true
  },
  "sheet": {
    "columns": 4,
    "rows": 4,
    "frameWidth": 512,
    "frameHeight": 512,
    "frameCount": 16,
    "rowOrder": ["idle", "walk", "scout", "ready"]
  },
  "actions": {
    "idle": { "row": 0, "frames": [0, 1, 2, 3], "fps": 3 },
    "walk": { "row": 1, "frames": [0, 1, 2, 3], "fps": 6 },
    "scout": { "row": 2, "frames": [0, 1, 2, 3], "fps": 6 },
    "ready": { "row": 3, "frames": [0, 1, 2, 3], "fps": 4 }
  },
  "actionMapping": {
    "SCOUT": "scout",
    "SCOUT_REPORT_READY": "ready",
    "OUTPUT_READY": "ready"
  }
}
```

Scene integration target:

- `ACTOR_SPRITE_SHEETS.scout.id = "pathfinder-scout-v1"`.
- `src = "/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png"`.
- `metadataSrc = "/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json"`.
- Consider adding default action metadata for `"scout"` row 2; current `actorSpriteSheet` only knows default `idle`, `walk`, `build`, `work`, and `ready`, so without a small code patch `SCOUT: "scout"` will fall back unless defaults are extended or `SCOUT` maps to `walk`.

Prompt brief:

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512, magenta or transparent background suitable for alpha cleanup. Adult-coded AgentTown pathfinder scout, frontier-tech field explorer, warm natural palette with tiny cyan rangefinder accent, hood or brimmed cap, compact survey pack, rolled map tube, compass staff, small sample pouch. Rows: row 1 idle alert stance, row 2 walking route stride, row 3 scouting terrain with compass/rangefinder/map gestures, row 4 report ready holding sealed map dossier. Charming cozy storybook game sprite, consistent scale with Clover/Rigger/Kettle/Oona/Rook. No readable text, no weapons, no combat, no cyberpunk, no child mascot, no Rook messenger satchel identity.
```

### A3. Scout Report Icon/Card Prop

Purpose: make collected `scout_report` feel like a real receipt/intel artifact.

Suggested files:

- `public/experiences/founders-plot/assets/objects/scout-report-dossier.webp`
- `public/experiences/founders-plot/assets/objects/scout-report-dossier.source.png`
- `public/assets/icons/agent-town/scout-report-gpt-image-2-v1.png`

Registry/icon IDs:

- Existing: `receipt.scout_report`
- Add/patch `assetFile: "scout-report-gpt-image-2-v1.png"` in both registries.

UI states to support:

- `no_reports`: empty panel can stay textual with helper copy.
- `one_report`: card uses small Scout Report prop/icon plus title, site, risk, traits.
- `multiple_reports`: compact stacked dossier treatment, no overflow on mobile.
- `report_ready`: report prop can appear with returning scout cue.

Prompt brief:

```text
Isolated AgentTown Scout Report dossier prop and matching square icon, transparent background. A parchment field report bundle with folded terrain sketch shapes but no readable text, brass clip, leather tab, cyan map pin glow, small compass mark as abstract symbol, warm lantern light, cozy frontier-tech. Looks like an earned gameplay receipt, not a modern document UI. No logos, no words, no QR codes, no city map, no cyberpunk, no combat.
```

### A4. Site Plan Dossier Icon/Prop

Purpose: separate "planning state" from Scout Report and later "claim/founding" state.

Suggested files:

- `public/experiences/founders-plot/assets/objects/site-plan-dossier.webp`
- `public/experiences/founders-plot/assets/objects/site-plan-dossier.source.png`
- `public/assets/icons/agent-town/site-plan-gpt-image-2-v1.png`

Registry/icon IDs:

- Existing: `planning.site_plan`
- Add/patch `assetFile: "site-plan-gpt-image-2-v1.png"` in both registries.

UI states to support:

- `draft`: dossier with loose notes/map tabs.
- `reviewable`: dossier clipped to charter board.
- `claim_ready`: stamped/approved version, still not a claim.
- `claimed`: later HQ7 can mark it linked to a claim/founded plot.

Prompt brief:

```text
Isolated AgentTown Site Plan dossier prop and square icon, transparent background. Rolled settlement layout parchment, plot grid sketched as abstract non-readable blocks, brass divider, ribbon tab, warm wood backing, tiny cyan alignment pin. It should feel more official than a scout report but not like a founded claim yet. Cozy frontier-tech, warm natural palette, subtle cyan accent. No readable text, no logos, no city blueprint, no cyberpunk, no combat.
```

## Asset Pack B: HQ6 Settlement Charter

### B1. Settlement Charter Board / Table

Purpose: make HQ6 reviewed Site Plan promotion visually official while preserving "planning, not territory".

Suggested files:

- `public/experiences/founders-plot/assets/buildings/settlement-charter-board.webp`
- `public/experiences/founders-plot/assets/objects/charter-table.webp`
- `public/assets/icons/agent-town/settlement-charter-gpt-image-2-v1.png`

Proposed icon IDs:

- `building.settlement_charter`
- `action.review_site_plan`
- `receipt.reviewed_plan`

Proposed scene role/object IDs:

- Building type if HQ6 creates a placeable/scene object: `SETTLEMENT_CHARTER`
- Scene object role if projected as prop only: `settlement_charter_board`
- Receipt/prop IDs:
  - `receipt.reviewed_plan`
  - `prop.charter_table`
  - `prop.review_stamp`

UI states to support:

- `locked_hq6`: icon and card disabled until HQ6/requirements.
- `no_site_plans`: charter board empty state.
- `review_available`: Site Plan card can be reviewed/promoted.
- `review_pending`: approval or review action in progress.
- `claim_ready`: reviewed stamp visible, but copy must say no second plot exists yet.
- `blocked_no_engine_promotion`: editor/Atlas variants remain advisory.

Prompt brief:

```text
Isolated cozy frontier-tech Settlement Charter board and table asset for AgentTown, transparent background, three-quarter game view. A civic notice board/table made of sun-bleached wood and brass, pinned site plan dossiers, sealed receipt clips, small stamp pad, map pins, warm lantern, subtle cyan verification diode. Looks official and hopeful, like careful settlement planning, not bureaucracy. No readable text, no logos, no modern office, no courthouse, no cyberpunk, no combat.
```

### B2. Reviewed Plan Stamp / Receipt Visuals

Suggested files:

- `public/experiences/founders-plot/assets/objects/reviewed-plan-stamp.webp`
- `public/assets/icons/agent-town/reviewed-plan-receipt-gpt-image-2-v1.png`

Icon IDs:

- `receipt.reviewed_site_plan`
- `status.claim_ready`

Prompt brief:

```text
Small isolated AgentTown reviewed Site Plan receipt icon, transparent background. A sealed parchment corner with brass stamp, ribbon, wax-like frontier seal shape, and tiny cyan check glow; no readable text. Communicates reviewed and claim-ready but not founded. Warm natural palette, cozy frontier-tech. No logos, no words, no modern checkmark app icon, no cyberpunk.
```

## Asset Pack C: HQ7 Settler Convoy

### C1. Settler / Convoy Crew Sprite Sheet

Purpose: make the first expansion unit feel inhabited and collective.

Suggested files:

- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.prompt.md`

Scene role IDs:

- `canonicalRoleId: "settler"` for a lead crew actor.
- Optional later aliases: `convoy`, `convoy_crew`.
- `generatedOverlayRoleId: "inhabitant.settler_convoy"` if server emits overlay IDs.

Sprite sheet row/action contract:

```json
{
  "id": "settler-convoy-crew-v1",
  "role": "settler",
  "displayName": "Settler Convoy Crew",
  "sheet": {
    "columns": 4,
    "rows": 4,
    "frameWidth": 512,
    "frameHeight": 512,
    "frameCount": 16,
    "rowOrder": ["idle", "walk", "prepare", "arrived"]
  },
  "actions": {
    "idle": { "row": 0, "frames": [0, 1, 2, 3], "fps": 3 },
    "walk": { "row": 1, "frames": [0, 1, 2, 3], "fps": 6 },
    "prepare": { "row": 2, "frames": [0, 1, 2, 3], "fps": 5 },
    "arrived": { "row": 3, "frames": [0, 1, 2, 3], "fps": 4 }
  },
  "actionMapping": {
    "SETTLER_CONVOY": "prepare",
    "CONVOY_PREPARING": "prepare",
    "CONVOY_ARRIVED": "arrived",
    "FOUND_SETTLEMENT": "arrived"
  }
}
```

Prompt brief:

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512. AgentTown settler convoy crew represented as a lead adult-coded frontier-tech settler with small packed team silhouettes/gear, warm practical clothing, canvas rolls, seed crate, survey rods, water barrel, stamped site plan tube, tiny cyan route beacon. Rows: idle with supplies, walking/departing stride, preparing convoy and checking plan, arrived/founding gesture. Cozy storybook game sprite, warm natural palette, subtle cyan accents, same scale as existing inhabitants. No weapons, no soldiers, no covered-wagon western cliche as the whole identity, no readable text, no logos, no cyberpunk.
```

### C2. Convoy Wagon / Route Object

Suggested files:

- `public/experiences/founders-plot/assets/objects/settler-convoy-wagon.webp`
- `public/experiences/founders-plot/assets/objects/settler-convoy-wagon.source.png`
- `public/assets/icons/agent-town/settler-convoy-gpt-image-2-v1.png`

Icon IDs:

- `unit.settler_convoy`
- `action.prepare_settler_convoy`
- `route.convoy`

Scene object IDs:

- `unit.settler_convoy`
- `prop.settler_convey_wagon` should be avoided due typo risk; use `prop.settler_convoy_wagon`.
- `route.settler_convoy`

Scene guidance:

- For the first HQ7 slice, show convoy route leaving the plot edge as `visualOnly: true`; do not squeeze a second plot into the 3x3 grid.
- If the convoy is a scene object, it should have `selectionKey` that opens claim/convoy UI only; no click-to-found mutation from the visual object.

Prompt brief:

```text
Isolated AgentTown settler convoy wagon/object, transparent background, three-quarter cozy game asset. Compact hand-built frontier-tech supply wagon or cart with canvas cover, seed crates, tool bundles, water barrel, rolled site plan tube, brass fittings, warm worn paint, and a small cyan route beacon. Optimistic first-expansion feeling. No readable text, no logos, no horses, no weapons, no military convoy, no cyberpunk vehicle, no metropolis.
```

### C3. Outpost Marker / Outpost Core

Suggested files:

- `public/experiences/founders-plot/assets/objects/outpost-marker.webp`
- `public/experiences/founders-plot/assets/buildings/outpost-core-lv1.webp`
- `public/assets/icons/agent-town/outpost-marker-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/outpost-core-gpt-image-2-v1.png`

Icon IDs:

- `building.outpost_core`
- `plot.second_settlement`
- `action.found_settlement`
- `status.founded`

Scene role/object IDs:

- `buildingType: "OUTPOST_CORE"` if/when second plot has a starter HQ-equivalent visual.
- `prop.outpost_marker` for pre-found/claim-arrived state.
- `plotKind: "OUTPOST"` in future state should map visually to `outpost-core-lv1.webp`, not `hq-lv1.webp`, if a distinct second-plot look is desired.

UI states to support:

- `claim_ready`: marker not yet physical.
- `convoy_preparing`: wagon in origin plot.
- `convoy_arrived`: outpost marker visible in claim/route card.
- `founded`: outpost core visible in plot switcher and second plot scene/card.
- `blocked_duplicate_claim`: receipt shown, action disabled, no duplicate plot.

Prompt brief:

```text
Two isolated AgentTown outpost assets, transparent background: 1) a small outpost marker claim stake with rope boundary pins, tripod beacon, canvas pennant with no symbol/text, brass tag, tiny cyan route light; 2) a humble level-1 outpost core building distinct from main HQ, wood-and-canvas shelter with beacon mast, supply crates, warm lantern, optimistic frontier-tech. Cozy natural palette, subtle cyan accent. No readable text, no flags with logos, no fort walls, no combat, no cyberpunk city.
```

### C4. Claim / Founding Receipt Icons

Suggested files:

- `public/assets/icons/agent-town/claim-approval-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/founding-receipt-gpt-image-2-v1.png`
- Optional prop: `public/experiences/founders-plot/assets/objects/founding-receipt.webp`

Icon IDs:

- `receipt.claim_approval`
- `receipt.founding`
- `claim.settlement`
- `action.found_settlement`

Prompt brief:

```text
Small square AgentTown founding receipt icon set, transparent background. Frontier parchment receipt, brass clip, map pin, tiny outpost marker silhouette, warm seal, subtle cyan confirmation glow. One variant for claim approval, one for settlement founded. No readable text, no logos, no legal document UI, no modern app checkmark, no cyberpunk, no combat.
```

## Icon Registry Patch List

When assets exist, add these to both `server/agent_town_icons.js` and `public/agent-town-icons.js`.

| Icon ID | Label | Symbol | Tone | Asset file |
| --- | --- | --- | --- | --- |
| `building.expedition_board` | Expedition Board | `EB` | `expedition` | `expedition-board-gpt-image-2-v1.png` |
| `action.scout` | Scout route | `SC` | `expedition` | `scout-route-gpt-image-2-v1.png` or reuse scout report/expedition icon if no separate raster |
| `receipt.scout_report` | Scout Report | `SR` | `expedition` | `scout-report-gpt-image-2-v1.png` |
| `planning.site_plan` | Site Plan | `SP` | `expedition` | `site-plan-gpt-image-2-v1.png` |
| `building.settlement_charter` | Settlement Charter | `CH` | `civic` | `settlement-charter-gpt-image-2-v1.png` |
| `action.review_site_plan` | Review Site Plan | `RV` | `civic` | `review-site-plan-gpt-image-2-v1.png` |
| `receipt.reviewed_site_plan` | Reviewed Site Plan | `RP` | `civic` | `reviewed-plan-receipt-gpt-image-2-v1.png` |
| `unit.settler_convoy` | Settler Convoy | `CV` | `expedition` | `settler-convoy-gpt-image-2-v1.png` |
| `action.prepare_settler_convoy` | Prepare Convoy | `PC` | `expedition` | `settler-convoy-gpt-image-2-v1.png` |
| `route.convoy` | Convoy Route | `RT` | `expedition` | `convoy-route-gpt-image-2-v1.png` |
| `building.outpost_core` | Outpost Core | `OP` | `civic` | `outpost-core-gpt-image-2-v1.png` |
| `plot.second_settlement` | Second Settlement | `P2` | `civic` | `outpost-marker-gpt-image-2-v1.png` |
| `receipt.claim_approval` | Claim Approval | `CA` | `civic` | `claim-approval-gpt-image-2-v1.png` |
| `receipt.founding` | Founding Receipt | `FR` | `civic` | `founding-receipt-gpt-image-2-v1.png` |

Important: `public/progression-atlas.js` currently only allows icon image paths under `/assets/icons/agent-town/`; do not place UI icon rasters under the Founders Plot experience asset tree.

## Frontend/UI State Checklist

Founders Plot panel states:

- Expedition Board: built, scouting, report ready, collect report.
- Scout Reports: none, one, many, selected report, report converted into Site Plan.
- Site Plans: draft, review available, review pending, claim ready, claimed.
- Settlement Charter: locked, empty, reviewable, claim-ready stamp visible.
- Settler Convoy: unavailable, can prepare, preparing, arrived, found settlement, founded, duplicate/blocked.

Atlas states:

- Current canonical HQ3 nodes use raster icons for Expedition Board, scout, Scout Report, Site Plan.
- HQ6 Settlement Charter nodes must remain server-owned when implemented; editor proposals stay advisory.
- HQ7 should show `Report -> Site Plan -> Reviewed Plan -> Prepare Convoy -> Found Settlement -> Second Plot`.
- Action refs in Atlas remain non-executable unless corresponding `et.plot.*` route/tool is real and guarded.

Scene projection states:

- `EXPEDITION_BOARD` building uses the new building asset.
- `scout` actor uses `pathfinder-scout-v1`.
- `settler` actor and/or convoy wagon project as `visualOnly: true`.
- Convoy route leaves origin plot edge; second plot should be a separate plot card/selector until multi-plot scene switching is real.

## Test Implications

Scene-state unit expectations:

- Update `FP-SCENE-004` expectations from Workshop/Rook placeholders to:
  - Expedition Board asset path: `/experiences/founders-plot/assets/buildings/expedition-board.webp`.
  - Scout asset path: `/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png`.
  - Scout metadata: `/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json`.
  - Scout sprite ID: `pathfinder-scout-v1`.
  - If `SCOUT` maps to row 2, assert `assetSprite.action === "scout"` and `row === 2`; otherwise explicitly document the temporary `walk` mapping.
- Add new scene unit coverage for `settler`/convoy projection when HQ7 code lands:
  - `visualOnly === true`
  - no `toolName`, `resourceDelta`, `mutatesResources`, or `autonomousAgent`
  - route/claim marker cannot mutate state by projection alone.

Playwright screenshot/canvas checks:

- `e2e/214_founders_plot_threejs_playable_slice.spec.js` should verify the new Expedition Board image loads and the scout sprite image is non-empty in canvas/screenshot.
- Add screenshot states for:
  - Expedition Board built.
  - Scout running/report-ready.
  - Site Plan review/claim-ready card.
  - Convoy preparing/arrived route once HQ7 exists.
- Include mobile checks for report/plan cards so dossier icons do not overflow side panels.

Icon registry checks:

- Extend `tests-founders-plot/fp-http.test.js` icon catalog assertions:
  - `building.expedition_board.assetPath === "/assets/icons/agent-town/expedition-board-gpt-image-2-v1.png"`
  - `receipt.scout_report.assetPath === "/assets/icons/agent-town/scout-report-gpt-image-2-v1.png"`
  - `planning.site_plan.assetPath === "/assets/icons/agent-town/site-plan-gpt-image-2-v1.png"`
  - HQ6/HQ7 new icons have non-null `assetPath` once registered.
- Add a small file existence/dimension check if the test suite has an asset utility available; otherwise keep it in Playwright through loaded image assertions.

Validation before merging the pack:

- PNG sprite sheets: 2048x2048, sRGBA, transparent corners, 4x4 grid.
- Sprite metadata JSON parses and matches paths/row names.
- WebP object/building assets load in browser and are not visually cropped on desktop/mobile.
- `node --check` for touched JS files.
- `node --test tests-founders-plot/fp-scene-state.test.js`.
- `node --test tests-founders-plot/fp-http.test.js` for icon catalog expectations.
- Relevant Playwright Founders Plot and Atlas specs after UI wiring.
- `git diff --check`.

## Production Priority

1. Generate and wire `expedition-board.webp`, `pathfinder-scout-v1`, `scout-report-gpt-image-2-v1.png`, and `site-plan-gpt-image-2-v1.png` first. These replace placeholders already visible in canonical HQ3 gameplay.
2. Generate Settlement Charter board/table plus reviewed-plan receipt before HQ6 UI is made prominent.
3. Generate Settler Convoy crew/wagon/outpost/receipt assets before HQ7 creates a second plot.
4. Keep HQ8-HQ10 asset generation queued behind this pack so the immediate expansion spine feels complete before broader civic/research visuals.

## Blockers / Risks

- The current worktree has in-flight modifications in the exact source files that would receive the future asset wiring. This report intentionally does not touch them.
- Current `actorSpriteSheet` defaults do not include a `"scout"` row action; wiring `SCOUT: "scout"` needs a small scene-state patch or it will need to keep using `walk` temporarily.
- There is no current `settler` role route lane/offset/action cue in `scene_state.js`; HQ7 wiring must add those alongside the asset pack.
- Second plot visualization is not a solved scene problem. The first asset pass should show route/convoy/outpost cards and avoid implying a live second 3x3 scene until plot switching is implemented.
