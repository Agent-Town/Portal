# Agent Town HQ15F Playtest / Replay / Fix

Date: 2026-06-02

## Goal

Replay the current Founders Plot Expedition Map on desktop and mobile and verify the new text-to-gameplay layer reads as playable map objects: units, Scout-unit command flow, Event Packet markers, Current Focus/objective markers, generated sprites, and collapsed Ledger/receipt proof.

## Artifacts

- Desktop screenshot: `reports/agent-town-hq15f-playtest-replay-fix-desktop-2026-06-02.png`
- Mobile screenshot: `reports/agent-town-hq15f-playtest-replay-fix-mobile-2026-06-02.png`
- Contact sheet: `reports/agent-town-hq15f-playtest-replay-fix-contact-sheet-2026-06-02.png`
- Proof JSON: `reports/agent-town-hq15f-playtest-replay-fix-proof-2026-06-02.json`

## Findings

- Desktop now reads map-first. The terrain board takes the main viewport, unit sprites sit on their cells, Event Packet and objective sprites are selectable map markers, and the right-side proof drawer is secondary.
- Mobile was close, but the Scout command bar was partially clipped because the Map units rail wrapped into two rows inside a capped roster.
- Ledger/receipt proof is correctly collapsed. The objective ledger and revealed-sector ledger are present, read-only, and zero-action, but they do not dominate first-pass play.
- Generated unit/marker sprites load from `hq15e_expedition_unit_marker_sprites_v1`; the runtime reports 8 generated sprites ready, read-only, visual-only.
- Scout Sector remains the only current mutation path. The Scout command button targets `cell_q0_r1`; movement, route, trade, resource, combat, Atlas, sharing, and external-effect paths remain disabled.

## Fix

Applied the smallest frontend/test fix:

- `public/experiences/founders-plot/founders-plot.css`
  - On narrow mobile, the unit rail now scrolls horizontally instead of wrapping into a clipped second row.
  - Scout command chips are tightened so `Scout Sector`, `Target cell_q0_r1`, `Move locked`, and the movement-boundary chip remain visible.
  - Mobile semantic zoom copy is hidden under 520px so text does not sit behind the unit roster.
- `e2e/200_founders_plot.spec.js`
  - FP-E2E-022 now records mobile command-bar geometry and asserts no Scout command item is vertically clipped.

## Verification

- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022"`
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js -g "FP-E2E-023"`
- `node --check e2e/200_founders_plot.spec.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `jq empty reports/agent-town-hq15f-playtest-replay-fix-proof-2026-06-02.json`
- `git diff --check`

## Residual Risk

Full `npm test` was not run in this bounded pass. The known broad FP-PERF-001 observation-payload failure remains outside this focused Expedition Map playtest/replay loop.
