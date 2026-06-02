# HQ16S Outpost Beacon Playtest Polish

## Verdict

`PASS_WITH_TINY_FIX`.

HQ16S replayed the selected outpost status and next-frontier beacon surface on desktop and mobile after HQ16R. The mobile proof found that the outpost status could crowd the unit dock, so the lane added a tiny CSS cap for the unit roster only when it contains the outpost status surface.

## What Changed

- Added a mobile-only unit dock height cap for outpost status selections:
  - `.fp-expedition-unit-roster:has(.fp-expedition-outpost-status)`
- Extended the focused HQ16Q/HQ16R browser proof to assert:
  - no horizontal clipping for the outpost status, unit roster, or command bar
  - no vertical clipping for the outpost status or command bar
  - the HQ16R outpost frontier beacon still emits no outpost commands
- Refreshed HQ16Q/HQ16R mobile screenshots and proof JSON through the focused browser replay.
- Captured dedicated HQ16S desktop/mobile proof screenshots.

## Files

- `public/experiences/founders-plot/founders-plot.css`
- `e2e/205_founders_plot_hq16q_outpost_status_map_surface.spec.js`
- `reports/agent-town-hq16s-outpost-beacon-playtest-polish-proof-2026-06-02.json`
- `reports/agent-town-hq16s-outpost-beacon-playtest-polish-2026-06-02-desktop.png`
- `reports/agent-town-hq16s-outpost-beacon-playtest-polish-2026-06-02-mobile.png`

## Verification

- `node --check e2e/205_founders_plot_hq16q_outpost_status_map_surface.spec.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/205_founders_plot_hq16q_outpost_status_map_surface.spec.js --project=chromium --reporter=line`
- `jq empty reports/agent-town-hq16q-outpost-status-map-surface-proof-2026-06-02.json reports/agent-town-hq16r-outpost-next-frontier-beacon-proof-2026-06-02.json`
- `file reports/agent-town-hq16s-outpost-beacon-playtest-polish-2026-06-02-desktop.png reports/agent-town-hq16s-outpost-beacon-playtest-polish-2026-06-02-mobile.png`
- `git diff --check`

## Guardrails

No server route, engine, store, tool, schema, renderer authority, outpost command, movement route, terrain truth, hidden-truth leakage, resource/economy/trade/combat/scheduler behavior, Atlas execution, Generated Universe runtime expansion, public sharing, deploy, merge, push, external effect, or Wild West genre drift.

Scout Sector remains the only fog reveal mutation. The outpost beacon remains read-only, visual-only, not selectable, not executable, and not route/action authority.
