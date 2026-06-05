# Agent Town Frontier Ledger Scratch Visual HUD

Date: 2026-06-05
Branch: `neo/founders-plot-visual-hud-scratch-2026-06-05`
Base: `c69efd112870ba5e296c76ec6bc1c193a2558411` (`origin/neo/progression-atlas-editor-next-2026-05-29`)
North Star: `frontier-ledger-north-star-upload-2026-06-05`

## Summary

Implemented a renderer-owned scratch visual composition for the Expedition Map HUD: `hq18_frontier_ledger_scratch_visual_hud_v1`.

This is intentionally more than an accent pass. The map now gets a Frontier Ledger board treatment with a parchment/leather tabletop frame, stronger bottom unit medallion rail, bottom-right parcel/rangefinder device, right-edge ledger tab, top-left Expedition/Scout tabs, larger target ring language, and dotted trail pips from the selected unit to the active target preview.

## Changed files

- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js` (rebuilt)
- `e2e/216_founders_plot_frontier_ledger_scratch_visual_hud.spec.js`
- `reports/agent-town-frontier-ledger-scratch-visual-hud-desktop-2026-06-05.png`
- `reports/agent-town-frontier-ledger-scratch-visual-hud-target-preview-2026-06-05.png`
- `reports/agent-town-frontier-ledger-scratch-visual-hud-mobile-2026-06-05.png`
- `reports/agent-town-frontier-ledger-scratch-visual-hud-proof-2026-06-05.json`
- `reports/agent-town-frontier-ledger-scratch-visual-hud-2026-06-05.md`

## What is visually new

- Full-screen procedural Frontier Ledger board/frame layer over the map: darker leather corners/edges, parchment wash, brass stitch/dash accents, and stronger vignette.
- Re-laid HUD chrome toward the uploaded Frontier Ledger reference:
  - compact top-left Expedition + Scout tabs,
  - stronger right-edge collapsed `LEDGER` tab,
  - heavy bottom unit rail with circular medallion sockets,
  - bottom-right rangefinder/parcel instrument with glass scope and parchment slip.
- Added map-native dotted target trail pips using only existing selected-unit and command-target preview data.
- Enlarged/repainted target rings with target/scout plaque language; no confirm-heavy flow was added.
- Kept legacy DOM HUD chrome demoted as transparent hit/a11y layer; visible HUD owner remains `three_canvas`.

## Guardrails

Confirmed in proof JSON:

- Renderer-owned visual layer only; no renderer network requests.
- No renderer mutation handlers and no new gameplay authority.
- Existing guarded DOM/frontend handlers remain the command path.
- Scratch sprites are `visualOnly`, `readOnly`, non-selectable, and have `executableActions: 0`.
- No hidden truth leakage: dotted pips derive from selected unit + already exposed command target hints.
- Movement UX is documented as `direct_double_click_existing_handler_no_confirm_added`.
- No server/API/store/schema/tool/package/scheduler/autonomy/Atlas execution changes.

## Proof artifacts

- Desktop: `reports/agent-town-frontier-ledger-scratch-visual-hud-desktop-2026-06-05.png`
- Selected/target preview: `reports/agent-town-frontier-ledger-scratch-visual-hud-target-preview-2026-06-05.png`
- Mobile: `reports/agent-town-frontier-ledger-scratch-visual-hud-mobile-2026-06-05.png`
- Proof JSON: `reports/agent-town-frontier-ledger-scratch-visual-hud-proof-2026-06-05.json`

Proof highlights:

- `frontierLedgerScratchVersion`: `hq18_frontier_ledger_scratch_visual_hud_v1`
- `frontierLedgerScratchSpriteCount`: `9`
- `frontierLedgerScratchTrailPipCount`: `4`
- `frontierLedgerScratchAuthority`: `false`
- `frontierLedgerScratchHiddenTruthLeakage`: `false`

## Verification

Passed:

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check e2e/216_founders_plot_frontier_ledger_scratch_visual_hud.spec.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/216_founders_plot_frontier_ledger_scratch_visual_hud.spec.js --project=chromium` — 1/1 passed
- `npx playwright test e2e/214_founders_plot_hq17h_hud_world_cohesion.spec.js --project=chromium` — 1/1 passed
- `git diff --check`

Attempted but not completed:

- `npm run build:openclaw-lite`
  - Output reached: `[openclaw-lite] missing openclaw-main, attempting submodule update...`
  - The command stalled until SIGTERM under the run timeout.
  - Its temporary submodule side effects were restored (`vendors/agent0-ts` and `vendors/openclaw-lite-main/vendor/openclaw-main` reset back to recorded commits).

Setup note:

- Ran `npm ci` because this clean worktree had no `node_modules` and the Three.js build initially failed with missing `esbuild`. No package files were changed.

## Honest risks / follow-ups

- The scratch layer is procedural, not hand-painted source art; it gets much closer compositionally but still has some generated-text/chrome density that a final art pass should clean up.
- Existing small map controls/chips are still visible outside the demoted HUD selectors; I did not rewrite non-map app controls.
- The bottom-right rangefinder is intentionally bold, but command glyph placement may need a final spacing pass once Robin picks the preferred visual direction.
