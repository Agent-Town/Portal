# AgentTown Image/UI/UX Progression Atlas Polish

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Summary

Polished the Progression Atlas and Founders Plot visual lane without taking ownership of server gameplay files.

The Atlas now opens with a denser operational workbench: live plot snapshot, current resource gates, and the Oracle note sit above the canonical map. Mobile Atlas views no longer depend on a single wide horizontal lane for the canonical map. Founders Plot mobile layout no longer blows out the page width, and the Recap control no longer floats over Foreman panel content on small screens.

Generated and integrated the dedicated Pathfinder Scout sprite sheet so the existing `scout` scene role can render `pathfinder-scout-v1` instead of borrowing Rook's messenger identity.

## Files Changed In This Lane

- `public/progression-atlas.html`
- `public/progression-atlas.css`
- `public/progression-atlas.js`
- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.prompt.md`

The worktree was already dirty. I did not revert or clean unrelated edits, and I did not touch gameplay engine/store/routes/tool implementation files.

## Image Generation

Mode: built-in `image_gen` using the GPT Image 2 path.

Generated source:

`/Users/robin/.openclaw/agents/main/agent/codex-home/generated_images/019e7be0-6db3-72e1-9eef-f04981d4eec2/ig_067e65cae1df0ec4016a1b9f7ff8788191982ba2426f5b81bf.png`

Repo asset outputs:

- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png`

Post-processing:

- Copied the generated 1254x1254 source into the repo.
- Resized to the existing 2048x2048 / 4x4 / 512px-cell sprite contract.
- Removed the flat magenta chroma key with ImageMagick.
- Added JSON metadata and prompt provenance.

## Proof Images

- `reports/agent-town-image-ui-ux-proof-atlas-iframe-desktop-2026-05-31.png`
- `reports/agent-town-image-ui-ux-proof-atlas-iframe-mobile-2026-05-31.png`
- `reports/agent-town-image-ui-ux-proof-founders-plot-desktop-2026-05-31.png`
- `reports/agent-town-image-ui-ux-proof-founders-plot-mobile-2026-05-31.png`
- `reports/agent-town-image-ui-ux-proof-founders-plot-atlas-modal-desktop-2026-05-31.png`
- `reports/agent-town-image-ui-ux-proof-founders-plot-atlas-modal-mobile-2026-05-31.png`
- `reports/agent-town-image-ui-ux-proof-pathfinder-scout-in-scene-2026-05-31.png`
- `reports/agent-town-pathfinder-scout-v1-checker-preview-2026-05-31.png`
- `reports/agent-town-pathfinder-scout-v1-row-strip-2026-05-31.png`
- `reports/agent-town-image-ui-ux-proof-contact-sheet-2026-05-31.png`

## Validation

Passed:

- `node --check public/progression-atlas.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check public/experiences/founders-plot/scene_state.js`
- `node -e "JSON.parse(... pathfinder-scout-v1.json ...)"` metadata parse check
- `magick identify` dimension/channel/alpha checks for `pathfinder-scout-v1.png`
- `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js` (4/4)
- `npx playwright test e2e/114_progression_atlas_openclaw_lite.spec.js e2e/200_founders_plot.spec.js --project=chromium` (14/14)
- `git diff --check`

## Residual Risks / Next Gaps

- The generated scout sheet has a faint magenta edge on a few narrow staff/cloak pixels after chroma-key cleanup. It is acceptable at current billboard scale, but final art should eventually use a cleaner source or native alpha pass.
- The Atlas canonical map is now more mobile-friendly, but a future pass should add true lane filters/search once the canonical graph grows past HQ10.
- The current visual proof uses a mocked scout scene state for the in-scene screenshot; gameplay authority remains server-owned and unchanged.
