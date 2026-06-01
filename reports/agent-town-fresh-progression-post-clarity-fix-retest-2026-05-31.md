# Agent Town / Fresh Progression Post-Clarity Fix Retest

Date: 2026-05-31
Tester: Neo, focused QA lane
Verdict: **PASS_WITH_NOTES**

## Summary

I reran the fresh-player Founders Plot progression path in browser automation against an isolated test server/store after Sartre's Rewards panel and Foreman copy fix. The retest reached HQ6 from a fresh plot while using the visible `Rewards` panel and `Claim Reward` buttons for the coin/XP milestones that previously required hidden API calls.

The reward-claim clarity blocker is fixed for the HQ4/HQ5 continuation path. The Foreman panel now exposes the `+10 XP` delegated-action guidance clearly enough to bridge HQ5/HQ6 when the player enables and uses the relevant permission tiers.

## What Passed

- Fresh load showed Foreman guidance: `Enable a permission, then let the first delegated action resolve for +10 XP in that tier.`
- Visible Rewards panel exposed and claimed these existing server-owned rewards through the browser:
  - `quest.first-lumber`: `coin +5`
  - `hq.level-2`: `coin +6`
  - `hq.level-3`: `wood +8, stone +4`
  - `hq.level-4`: `coin +8`
  - `hq.level-5`: `coin +12, Town XP +10`
- The HQ4 Workshop coin stall is no longer hidden: `hq.level-4` appeared in the Rewards panel with grant copy and a `Claim Reward` button, then disappeared after claim.
- The HQ5 Market Stall coin/XP stall is no longer hidden: `hq.level-5` appeared with grant copy and a `Claim Reward` button, then disappeared after claim.
- Foreman XP guidance matched actual server behavior:
  - First delegated collection checkpoint moved XP from `135` to `155`.
  - Later delegated tiers moved XP from `210` to `220`, satisfying the HQ6 XP gate.
- Final state reached `hqLevel: 6`, `townXp: 240`, all rewards claimed, and no remaining claimable rewards.

## Notes

The retest respected actual server input costs. The harness had to restock before Scout, Workshop, and Market Stall jobs because those actions spend inputs (`SCOUT`, Workshop production, and `SELL`). That is healthy gameplay friction, not a clarity regression.

Remaining low note: browser console still emitted repeated Three.js warnings: `Texture marked for update but no image data found.` Screenshots rendered and the progression path completed, so I did not treat this as a blocker for the clarity retest.

## Proof Files

- Proof JSON: `reports/agent-town-fresh-progression-post-clarity-fix-retest-proof-2026-05-31.json`
- Contact sheet: `reports/agent-town-fresh-progression-post-clarity-fix-retest-2026-05-31-contact-sheet.png`
- Screenshots:
  - `reports/agent-town-fresh-progression-post-clarity-fix-retest-2026-05-31-01-fresh-load-foreman-guidance.png`
  - `reports/agent-town-fresh-progression-post-clarity-fix-retest-2026-05-31-02-first-lumber-reward-claim-visible.png`
  - `reports/agent-town-fresh-progression-post-clarity-fix-retest-2026-05-31-03-hq2-reward-claim-visible.png`
  - `reports/agent-town-fresh-progression-post-clarity-fix-retest-2026-05-31-04-hq3-reward-claim-visible.png`
  - `reports/agent-town-fresh-progression-post-clarity-fix-retest-2026-05-31-05-hq4-workshop-charter-reward-claim-visible.png`
  - `reports/agent-town-fresh-progression-post-clarity-fix-retest-2026-05-31-06-foreman-permissions-xp-guidance-active.png`
  - `reports/agent-town-fresh-progression-post-clarity-fix-retest-2026-05-31-07-hq5-founder-stipend-reward-claim-visible.png`
  - `reports/agent-town-fresh-progression-post-clarity-fix-retest-2026-05-31-08-hq6-continuation-after-visible-rewards-foreman.png`

## Commands / Checks

- Custom Playwright/browser harness with `NODE_ENV=test`, isolated `STORE_PATH` and `FOUNDERS_PLOT_STORE_PATH`, and browser-side calls to real Founders Plot APIs plus `/__test__/founders-plot/advance`.
- `identify reports/agent-town-fresh-progression-post-clarity-fix-retest-2026-05-31-*.png`
- `node -e "JSON.parse(require('fs').readFileSync('reports/agent-town-fresh-progression-post-clarity-fix-retest-proof-2026-05-31.json','utf8')); console.log('ok')"`
- `git diff --check -- reports/agent-town-fresh-progression-post-clarity-fix-retest-2026-05-31.md reports/agent-town-fresh-progression-post-clarity-fix-retest-proof-2026-05-31.json`

## Boundary Check

No source files were edited. Writes were limited to this report, proof JSON, screenshots/contact sheet, and isolated report-local SQLite stores for the browser retest. I did not add rewards/economy, scheduler behavior, Atlas execution, public sharing, route/trade/settlement/civic/overlay/generated-universe authority, or any gameplay authority changes.
