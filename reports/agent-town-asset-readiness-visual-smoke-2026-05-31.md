# Agent Town Asset Readiness / Visual Smoke

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Verdict

PASS_WITH_KNOWN_ART_GAPS.

The current game-facing Founders Plot assets are present, filesystem-loadable, HTTP-loadable through the local static server, and visually proofed in a contact sheet plus a focused Founders Plot Playwright screenshot.

No production files were edited for this pass. Writes were limited to this report and the assigned proof outputs.

## Outputs

- JSON proof: `reports/agent-town-asset-readiness-visual-smoke-2026-05-31.json`
- Contact sheet: `reports/agent-town-asset-readiness-visual-smoke-contact-sheet-2026-05-31.png`
- Founders Plot smoke screenshot: `reports/agent-town-asset-readiness-visual-smoke-founders-plot-2026-05-31.png`

## What Was Checked

Scanned source references from:

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/index.html`
- `public/experiences/founders-plot/scene_state.js`
- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `public/agent-town-icons.js`
- `server/agent_town_icons.js`
- `public/progression-atlas.*`
- asset metadata JSON under `public/experiences/founders-plot/assets/**`
- icon metadata under `public/assets/icons/agent-town/**`

Runtime asset inventory found:

- 27 icon assets
- 14 building contact-sheet assets, 18 building files including source PNGs
- 9 Clover/foreman state assets in the contact sheet
- 21 inhabitant sprite-sheet assets in the contact sheet, 53 inhabitant image files including source/generated copies
- 14 object/card props in the contact sheet, 28 object files including source/generated copies
- 2 scene backgrounds

## Load Results

- Missing runtime URL references from JS/CSS/HTML/metadata: **0**
- Dynamic scene templates resolved manually:
  - HQ levels `hq-lv1` through `hq-lv5`
  - `lumber-camp`, `farm-plot`, `quarry`, `expedition-board`, `workshop`, `market-stall`
  - `empty-lot`, `locked-lot`
  - Clover states `acting`, `blocked`, `celebrating`, `idle`, `observing`, `paused`, `restart-needed`, `thinking`, `waiting-approval`
- HTTP static-server check: **166 / 166 URLs loaded**
- Playwright smoke:
  - `/founders-plot` loaded
  - seeded a Lumber Camp production scene
  - WebGL canvas was present and nonblank
  - no page errors
  - no failed image/static asset requests

Two stale local provenance references are missing outside the runtime/static path:

- `/Users/robin/.openclaw/media/agent-town-references/founders-plot-desktop.webp`
- `/Users/robin/.openclaw/media/agent-town-references/lumber-camp.webp`

These appear only in older character metadata as source/reference provenance for builder/messenger assets. They are not `/public` runtime URLs and did not affect game asset loading.

## Readiness Notes

Buildings:

- Current runtime building files are present and loadable, including the newer `expedition-board.webp`, `settlement-charter-board.webp`, `research-lodge.webp`, and `outpost-core-lv1.webp`.
- Older base scene buildings remain provenance-thin: `hq-lv1` through `hq-lv5`, `lumber-camp`, `farm-plot`, `quarry`, `workshop`, and `market-stall` have runtime WebPs but no adjacent prompt/source/generated/json sidecars.

Inhabitants:

- Runtime scene-wired inhabitant sheets are present for builder, worker, hauler, messenger, scout, workshop specialist, trader, settler, civic routekeeper, oracle adjunct, and outpost keeper.
- HQ11 civic actors are wired through server-owned state per `agent-town-hq11-civic-actors-scene-wiring-2026-05-31.md`.
- Batch B assets are present and visually proofed, but remain asset-ready only: `charter_clerk`, `research_doctrine_keeper`, and `cohort_hall_coordinator` are not emitted by current scene state.

Card/object art:

- Scout Report, Site Plan, reviewed/claim-ready plan, settlement/convoy/outpost props, Research Lodge, Work Order dossier, and World Grid Civic Beacon assets are present and loadable.
- HQ10 World Grid / Civic Proposal / Overlay Pack status cards currently use `world-grid-civic-beacon.webp` as the safe shared civic visual anchor.

## Visual Gaps

Known gaps still standing from the HQ10/HQ11 asset reports:

- Dedicated Civic Proposal dossier card art is still missing.
- Dedicated Generated Universe overlay-pack card art is still missing.
- HQ10/Atlas node icons are still missing for `world-grid-read-model-gpt-image-2-v1.png`, `civic-readiness-gpt-image-2-v1.png`, and `generated-universe-node-gpt-image-2-v1.png`.
- Icon registry still falls back to symbols for `building.workshop`, `building.market_stall`, `resource.coin`, `resource.xp`, `action.construct`, `action.produce`, and `action.collect`.
- Older base building and lot assets should not be described as GPT Image 2.0-derived until provenance is recovered or they are regenerated.

## Verification

Passed:

- `jq empty reports/agent-town-asset-readiness-visual-smoke-2026-05-31.json`
- `magick identify reports/agent-town-asset-readiness-visual-smoke-contact-sheet-2026-05-31.png reports/agent-town-asset-readiness-visual-smoke-founders-plot-2026-05-31.png`
- HTTP load sweep against temporary `NODE_ENV=test` server on port `4199`
- Focused Playwright browser smoke with nonblank canvas check
- `git diff --check -- reports/agent-town-asset-readiness-visual-smoke-2026-05-31.md reports/agent-town-asset-readiness-visual-smoke-2026-05-31.json reports/agent-town-asset-readiness-visual-smoke-contact-sheet-2026-05-31.png reports/agent-town-asset-readiness-visual-smoke-founders-plot-2026-05-31.png`

Not run:

- No JS syntax checks were needed because no JS source files were changed.
- No broad gameplay regression suite was run; this pass was asset readiness and visual smoke only.
