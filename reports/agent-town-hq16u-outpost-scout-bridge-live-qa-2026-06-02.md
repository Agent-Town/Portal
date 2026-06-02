# HQ16U Outpost Scout Bridge Live QA

## Verdict

`PASS`.

HQ16U replaced the timed-out worker handoff with parent-run live browser QA. The proof seeds the real Playwright test store, opens the Founders Plot page through the live server, selects a server-owned outpost crew, follows the read-only outpost beacon target to the existing Scout objective selection, and exercises the real `POST /api/founders-plot/expedition-map/scout-sector` route. No `page.route` API mocking is used.

## What Changed

- Added focused Playwright coverage in `e2e/206_founders_plot_hq16u_outpost_scout_bridge_live_qa.spec.js`.
- Seeded an HQ6 home plot, reviewed claim, founded outpost plot, owned outpost cell, outpost crew, and adjacent server-hinted `frontier_hint` target in the test SQLite store.
- Verified the outpost status bridge remains read-only:
  - `data-bridge-command-id="scout_sector"`
  - `data-bridge-read-only="true"`
  - `data-bridge-actions="0"`
- Used the existing Scout Sector browser handler to hit the live Scout Sector route.
- Proved the bridged target becomes a known `expedition_scout_sector` cell and emits exactly one Scout Sector world delta.

## Artifacts

- `reports/agent-town-hq16u-outpost-scout-bridge-live-qa-proof-2026-06-02.json`
- `reports/agent-town-hq16u-outpost-scout-bridge-live-qa-2026-06-02-before-scout.png`
- `reports/agent-town-hq16u-outpost-scout-bridge-live-qa-2026-06-02-after-scout.png`

## Verification

- `node --check e2e/206_founders_plot_hq16u_outpost_scout_bridge_live_qa.spec.js`
- `PW_PORT=4179 npx playwright test e2e/206_founders_plot_hq16u_outpost_scout_bridge_live_qa.spec.js --project=chromium --reporter=line`
- `jq empty reports/agent-town-hq16u-outpost-scout-bridge-live-qa-proof-2026-06-02.json`
- `file reports/agent-town-hq16u-outpost-scout-bridge-live-qa-2026-06-02-before-scout.png reports/agent-town-hq16u-outpost-scout-bridge-live-qa-2026-06-02-after-scout.png`
- `git diff --check`

## Guardrails

No source/runtime/server/store/schema/API/tool changes were made in this lane. Scout Sector remains the only fog reveal mutation. The bridge does not create outpost commands, movement authority, route authority, resource harvesting, rewards, combat, background scheduling, Atlas execution, Generated Universe runtime expansion, hidden-truth leakage, cross-plot mutation, external effects, push, deploy, merge, or public sharing.
