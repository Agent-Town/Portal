# AgentTown HQ3-HQ10 Image Assets Integration

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Summary

Integrated the recovered GPT Image 2 opaque HQ3-HQ10 icon sheet into the AgentTown repo as named, alpha-cleaned gameplay assets.

This resolves the earlier image-lane hiccup where the generation succeeded locally but stayed only in OpenClaw media and was not cropped, copied, registered, or wired into the game UI.

## Source

Raw generated source:

`/Users/robin/.openclaw/media/tool-image-generation/agent-town-hq3-hq10-icon-sheet-v1-opaque---b3dd520b-5e46-4304-9545-b52722766947.png`

Repo source copy:

`/Users/robin/Projects/Portal-atlas-editor/public/assets/icons/agent-town/agent-town-hq3-hq10-icon-sheet-v1-opaque.source.png`

Manifest:

`/Users/robin/Projects/Portal-atlas-editor/public/assets/icons/agent-town/agent-town-hq3-hq10-icon-sheet-v1-opaque.manifest.json`

## Integrated Assets

Icon crops were exported as 256x256 alpha PNGs under:

`/Users/robin/Projects/Portal-atlas-editor/public/assets/icons/agent-town/`

New icon IDs wired through both browser and server registries include:

- `building.expedition_board`
- `action.scout`
- `receipt.scout_report`
- `planning.site_plan`
- `action.review_site_plan`
- `action.prepare_settler_convoy`
- `action.found_settlement`
- `unit.settler_convoy`
- `route.convoy`
- `receipt.settlement_claim`
- `receipt.second_plot_founded`
- `plot.second_settlement`
- `building.research_lodge`
- `building.cohort_hall`
- `doctrine.survey_discipline`
- `work_order.collect_ready_outputs_once`

Founders Plot scene/card assets were exported as 512x512 alpha WebP files under:

- `/Users/robin/Projects/Portal-atlas-editor/public/experiences/founders-plot/assets/buildings/`
- `/Users/robin/Projects/Portal-atlas-editor/public/experiences/founders-plot/assets/objects/`

Key runtime paths:

- `/experiences/founders-plot/assets/buildings/expedition-board.webp`
- `/experiences/founders-plot/assets/objects/scout-report-dossier.webp`
- `/experiences/founders-plot/assets/objects/site-plan-dossier.webp`
- `/experiences/founders-plot/assets/objects/reviewed-plan-stamp.webp`
- `/experiences/founders-plot/assets/objects/settler-convoy-wagon.webp`
- `/experiences/founders-plot/assets/objects/outpost-marker.webp`
- `/experiences/founders-plot/assets/buildings/research-lodge.webp`
- `/experiences/founders-plot/assets/objects/cohort-work-order-dossier.webp`

## Wiring

- Replaced the Expedition Board scene projection from `workshop.webp` to `expedition-board.webp`.
- Added visual card art to Scout Report, Site Plan, Settlement Claim, and Research Lodge doctrine cards.
- Extended `public/agent-town-icons.js` and `server/agent_town_icons.js` so Atlas/canonical nodes resolve actual asset paths instead of symbol-only placeholders.
- Updated tests to assert the Expedition Board scene asset and core HQ3 icon asset paths.

## Proof Images

Icon contact sheet:

`/Users/robin/Projects/Portal-atlas-editor/reports/agent-town-hq3-hq10-image-assets-contact-sheet-2026-05-31.png`

Scene/card asset contact sheet:

`/Users/robin/Projects/Portal-atlas-editor/reports/agent-town-hq3-hq10-scene-assets-contact-sheet-2026-05-31.png`

Founders Plot UI proof screenshot:

`/Users/robin/Projects/Portal-atlas-editor/reports/agent-town-hq3-hq10-image-assets-ui-proof-2026-05-31.png`

## Verification

Passed:

- `node --check public/agent-town-icons.js`
- `node --check server/agent_town_icons.js`
- `node --check public/experiences/founders-plot/scene_state.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check tests-founders-plot/fp-scene-state.test.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js tests-founders-plot/fp-http.test.js` (`20/20`)
- `npx playwright test e2e/200_founders_plot.spec.js e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium` (`14/14`)
- `git diff --check`
- Image dimension/channel checks for new PNG/WebP assets and proof screenshots

## Remaining Caveat

This integrates the recovered HQ3-HQ10 sheet as high-quality icons, props, card art, and building/object assets.

It does not create a dedicated pathfinder scout character sprite sheet. The current scout projection still intentionally reuses Rook's messenger sprite until a separate 4x4 scout sprite sheet is generated and verified.
