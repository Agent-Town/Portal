# AgentTown Pathfinder Scout Sprite Integration

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Summary

Integrated the GPT Image 2.0 pathfinder scout sprite sheet into Founders Plot and replaced the temporary Rook messenger sprite for visual-only scout projections.

This closes the main HQ3 visual placeholder gap left after the Expedition Board slice: Scout jobs now project a dedicated scout inhabitant asset instead of reusing the messenger.

## Source

Generated source:

`/Users/robin/.openclaw/media/tool-image-generation/agent-town-pathfinder-scout-sprite-sheet-v1-opaque---225baa41-0639-4e34-aaae-2ce0b1e10b2c.png`

Project source copy:

`/Users/robin/Projects/Portal-atlas-editor/public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.source.png`

Integrated transparent sheet:

`/Users/robin/Projects/Portal-atlas-editor/public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png`

Metadata:

`/Users/robin/Projects/Portal-atlas-editor/public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json`

## Asset Contract

- 2048x2048 PNG sprite sheet.
- 4 columns x 4 rows.
- 512x512 frame cells.
- Row 1: `idle`.
- Row 2: `walk`.
- Row 3: `scout`.
- Row 4: `ready`.
- Chroma mint background removed locally into alpha.
- The actor remains visual-only and does not change server gameplay truth.

## Wiring

- `ACTOR_SPRITE_SHEETS.scout` now points to `pathfinder-scout-v1`.
- `SCOUT` maps to the dedicated `scout` action row.
- `SCOUT_REPORT_READY` and `OUTPUT_READY` map to `ready`.
- Scene tests now assert the dedicated scout asset, metadata path, and row mapping.

Changed files:

- `public/experiences/founders-plot/scene_state.js`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json`
- `tests-founders-plot/fp-scene-state.test.js`

## Proof Images

Alpha/checker preview:

`/Users/robin/Projects/Portal-atlas-editor/reports/agent-town-pathfinder-scout-v1-checker-preview-2026-05-31.png`

Before/after integration proof:

`/Users/robin/Projects/Portal-atlas-editor/reports/agent-town-pathfinder-scout-v1-integration-proof-2026-05-31.png`

## Verification

Passed:

- `node --check public/experiences/founders-plot/scene_state.js`
- `node --check tests-founders-plot/fp-scene-state.test.js`
- `jq empty public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json`
- `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js` (`4/4`)
- ImageMagick channel/dimension check: integrated sheet is `2048x2048`, `srgba`, transparent corners.

## Remaining Notes

This slice only changes the scout projection art. It does not add new scout mechanics, new SCOUT outputs, pathfinding behavior, or autonomous agent authority.
