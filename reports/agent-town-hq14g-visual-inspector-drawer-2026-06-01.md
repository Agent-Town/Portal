# AgentTown HQ14G Visual Inspector Drawer

Date: 2026-06-01

## Verdict

PASS. The Expedition Map is now more map-first in the narrow Founders Plot panel: the visual map stays first, the current selected sector stays on the map surface, and proof-heavy selected-sector/ledger material is tucked into a compact read-only inspector drawer.

## What Changed

- Added a read-only `Visual inspector` drawer chrome for the Expedition Map HUD.
- Moved existing status, current focus, selected sector, event packet, hidden frontier, scout receipt, and sector ledger surfaces into the inspector area without changing their data source.
- Collapsed selected-sector proof/details and the revealed-sector ledger behind native read-only drawer sections.
- Made the map layout container-aware so narrow panels stack map first instead of squeezing the map beside the drawer.
- Added HQ14G Playwright assertions, proof JSON, and desktop/mobile screenshots.

## Proof Paths

- `reports/agent-town-hq14g-visual-inspector-drawer-proof-2026-06-01.json`
- `reports/agent-town-hq14g-visual-inspector-drawer-desktop-2026-06-01.png`
- `reports/agent-town-hq14g-visual-inspector-drawer-mobile-2026-06-01.png`

## Guardrails

- Frontend/CSS/e2e/report-only lane.
- Scout Sector remains the only Expedition Map mutation path.
- Event Packet, Expedition Party, Current focus, receipts, selected-sector proof, and inspector details remain read-only/buttonless.
- No server/store/route/tool/schema authority, renderer bundle, mutation route, hidden truth, resources, routes, jobs, timers, rewards, travel, combat, scheduler/background behavior, external effect, cross-plot mutation, Atlas execution, public sharing, or Generated Universe rendering changes.
- No Wild West/cowboy/saloon/gold-rush genre drift.

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js` passed.
- `node --check e2e/200_founders_plot.spec.js` passed.
- `PW_PORT=4971 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022" --reporter=line` passed, 1/1.
- `jq` guardrail check passed for the HQ14G proof JSON.
- `file` identified both HQ14G screenshots as PNG images.
- Focused `git diff --check` passed.

## Residual

The Event Packet card remains visible because it is the current playable read-model artifact after Scout Sector. A later lane could give that packet its own richer visual card art, but this lane intentionally did not add new gameplay authority or renderer behavior.
