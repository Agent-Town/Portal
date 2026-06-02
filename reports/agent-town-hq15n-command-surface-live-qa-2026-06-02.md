# AgentTown HQ15N - Command Surface Live QA

Generated: 2026-06-02

## Verdict

PASS. The current Founders Plot Expedition Map command surface remains map-first, readable, and bounded after HQ15M.

## What Was Verified

- Selectable unit roster/tokens render five server-owned units: Scout, Courier, Surveyor, Outpost Crew, and Settler Convoy.
- Scout command bar paths are reachable:
  - `Move` uses the existing `/api/founders-plot/expedition-map/move-unit` route for adjacent discovered/known same-plot cells.
  - `Scout Sector` remains the only fog reveal path and targets `cell_q0_r1`.
- Surveyor `Prepare Convoy` and arrived Settler `Found Outpost` affordances are present and call existing guarded endpoints only.
- Command target rings are visual-only/read-only, with no route authority, action authority, or executable client actions.
- `Fog ledger` and `Sector action aliases` inspector drawers stay collapsed; the sector alias is hidden before reveal and gone after reveal.
- Desktop and 390px mobile command layouts have no horizontal overflow or clipped command chips.

## Artifacts

- `reports/agent-town-hq15n-command-surface-live-qa-proof-2026-06-02.json`
- `reports/agent-town-hq15n-command-surface-live-qa-desktop-2026-06-02.png`
- `reports/agent-town-hq15n-command-surface-live-qa-mobile-2026-06-02.png`
- `reports/agent-town-hq15n-command-surface-live-qa-contact-sheet-2026-06-02.png`

## Verification

- `node --check e2e/200_founders_plot.spec.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `PW_PORT=5188 npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --reporter=line` - 1/1 passed
- `PW_PORT=5189 npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js -g "FP-E2E-023" --reporter=line` - 1/1 passed
- `jq` proof checks for command-surface and authority assertions
- `file` validation for HQ15N screenshots/contact sheet
- `git diff --check`

## Notes

- No frontend, CSS, server, renderer, route/tool/schema, package metadata, or asset-pack fix was needed in HQ15N.
- `FP-E2E-022` rewrites existing HQ12B/HQ12O/HQ14D/HQ15C/HQ15L/HQ15M screenshots and several HQ12/HQ14 proof JSON files by design.
- `FP-E2E-023` rewrites existing HQ14T and HQ15D screenshots/proof JSON by design.
- The HQ15N evidence files are separate and intentionally kept.

## Guardrails

- Scout Sector remains the only fog/reveal mutation.
- Scout movement remains bounded to adjacent discovered/known same-plot cells and does not reveal fog.
- Surveyor/Settler commands use existing guarded endpoints only.
- No hidden truth leakage, hidden autonomy, Atlas execution, Generated Universe runtime expansion, public sharing, deploy, merge, push, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation, external effects, or genre drift was introduced.
