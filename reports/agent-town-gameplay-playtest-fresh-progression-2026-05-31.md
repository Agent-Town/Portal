# Agent Town / Founders Plot Fresh Progression Playtest

Date: 2026-05-31
Tester: Ada, gameplay QA subagent
Verdict: **PASS_WITH_NOTES**

## Summary

I ran a fresh-player Founders Plot progression playtest against the current dirty shared branch using Playwright/browser automation against a real local server. The run reached HQ6, collected a Scout Report, drafted and reviewed a Site Plan, prepared and founded a Settler Convoy outpost, selected Survey Discipline, created/executed a Work Order, and verified the World Grid/Atlas boundary stayed read-only.

The core mechanics worked. The fresh-player experience is not clean yet because two progression currencies are hidden or under-explained: reward claims are required for coin progression, and Foreman permission-tier XP is required for HQ5/HQ6 pacing but is not explained by the quest flow.

## Severity-Ordered Findings

### High: Reward claims are required for natural HQ4/HQ5 progression, but I could not find a visible reward-claim UI

Repro:
1. Start a clean Founders Plot.
2. Build/collect Lumber Camp, Farm Plot, Quarry, and Expedition Board.
3. Upgrade to HQ4 without using `/api/founders-plot/claim-reward`.
4. Click an empty pad and inspect Workshop.

Observed:
- At HQ4 before hidden reward claims, Workshop was visible but unaffordable.
- Inventory was `wood: 4, stone: 6, food: 2, coin: 2`.
- Workshop showed `coin: 2/12 need 10`.
- The player can restock wood/stone, but I found no visible UI to claim the available coin rewards needed to fix the coin bottleneck.

Proof:
- `reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31-09-hq4-workshop-blocked-without-reward-ui.png`
- `reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31-proof.json`

Impact:
Fresh players can understand “I need more coin,” but not how to get it. I had to use the reward endpoint to continue:
- `quest.first-lumber` -> `coin: 5`
- `hq.level-2` -> `coin: 6`
- `hq.level-3` -> `wood: 8, stone: 4`
- `hq.level-4` -> `coin: 8`
- `hq.level-5` -> `coin: 12, town_xp: 10`

### Medium: HQ5/HQ6 XP progression depends on Foreman permission-tier XP, but the quest flow does not make that path obvious

Repro:
1. Continue from HQ4 after Workshop is built.
2. Collect Workshop output.
3. Attempt to reach HQ5/HQ6 through the normal build/produce/collect loop.

Observed:
- After Workshop’s first collect, the plot sat below HQ5 XP (`135/140` during the run).
- Before HQ6, the plot sat at `190/220` XP after normal progression and the HQ5 reward.
- I used engine-backed Foreman actions to continue:
  - enabled `collectOutputs`, `queueProduction`, `setPriority`, and `sellSurplusFood`
  - ran first agent collect/queue/priority/sell actions
  - reached `220/220` XP, then upgraded to HQ6

Proof:
- `reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31-proof.json`
- Final state reached `townXp: 240`, `hqLevel: 6`.

Impact:
The mechanics exist, but a fresh player sees “Keep the loop moving” rather than “delegate a first Foreman action for XP.” This is likely to feel like a stall.

### Medium: Market Stall repeats the hidden reward/coin issue at HQ5

Repro:
1. Reach HQ5 after Workshop/HQ5 gate.
2. Do not claim the HQ5 reward.
3. Click an empty pad and inspect Market Stall.

Observed:
- Inventory at the checkpoint: `wood: 10, stone: 4, coin: 9`.
- Market Stall showed `coin: 9/14 need 5`.
- I used the hidden `hq.level-5` reward (`coin: 12, town_xp: 10`) to continue.

Proof:
- `reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31-10-hq5-market-stall-blocked-without-reward-ui.png`

## Product-Sense Notes

- The StarCraft-style HQ gates are conceptually strong. The HQ2 missing-building gate is visible and understandable.
- Expedition Board -> Dispatch scout -> Scout Report -> Draft Site Plan works well. The Scout Report card and “Draft Site Plan” action clearly tell the player what changed.
- Site Plan review is clear about “claim-ready planning only” and no territory creation.
- Settler Convoy and explicit second-plot founding worked and felt bounded.
- Survey Discipline is understandable once the outpost exists, but “Research Lodge” reads like a building even though doctrine selection currently appears as a panel/system.
- Work Orders are appropriately explicit: create draft, then execute. The boundary copy is good.
- World Grid stayed advisory/read-only. The final proof reports `atlasActionRefsExecutable: 0`.
- Mobile final layout at `390x844` had no horizontal overflow: body/document/root scroll width all `390`.

## Coverage / Reproduction Path

1. Loaded fresh Founders Plot and inspected initial HQ/resources.
2. Clicked HQ and verified HQ2 gate listed missing Lumber Camp/Farm Plot requirements.
3. Built Lumber Camp through the UI, queued/collected first wood through the UI.
4. Progressed Lumber/Farm/Quarry/HQ2/HQ3 with controlled same-session API timer/resource assists.
5. Built Expedition Board, dispatched scout through UI, advanced time, collected Scout Report through UI.
6. Drafted Site Plan from the Scout Report through UI.
7. Reached HQ4 naturally enough to observe Workshop coin/reward blocker.
8. Claimed hidden rewards through API to continue.
9. Built Workshop, reached HQ5, observed Market Stall coin/reward blocker.
10. Used hidden HQ5 reward and Foreman permission-tier actions to bridge XP to HQ6.
11. Reviewed Site Plan through Settlement Charter UI.
12. Prepared Settler Convoy, advanced time, founded second plot through UI.
13. Selected Survey Discipline.
14. Prepared ready outputs, created and executed Work Order.
15. Captured World Grid read-only panel and final mobile layout.

## Proof Files

- Contact sheet: `reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31-contact-sheet.png`
- Structured proof JSON: `reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31-proof.json`
- Screenshots: `reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31-01-initial-hq-resource-strip.png` through `reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31-20-mobile-390-final-layout.png`
- Isolated playtest stores: `reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31-app-store.sqlite` and `reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31-founders-plot-store.sqlite`

## Commands Run

- `git status --short`
- `node <<'NODE' ... NODE` custom Playwright harness, with `NODE_ENV=test`, isolated store paths under the report prefix, and fixed wallet headers for a clean player identity.
- `convert (...) +append` / `convert ... -append` to build the contact sheet.
- `identify reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31-contact-sheet.png reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31-[0-9][0-9]-*.png`
- `node -e "...proof summary..."`
- `git status --short -- reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31*`

## Boundary Check

No source files were edited. Writes were limited to `reports/agent-town-gameplay-playtest-fresh-progression-2026-05-31*` report/proof artifacts. I did not push, merge, deploy, alter Atlas execution, promote civic proposal/overlay records, change server authority, change routes/costs/tools, or touch Generated Universe rendering.
