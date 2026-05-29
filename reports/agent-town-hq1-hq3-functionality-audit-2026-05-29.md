# Agent Town Founders Plot HQ1-HQ3 Functionality Audit

Date: 2026-05-29
Repo: `/Users/robin/Projects/Portal`
Branch: `neo/founders-plot-rigger-live-inhabitants-cleanup-2026-05-28`
HEAD: `566f622fec19d05e6126cde720cea3118130f4f1`

## Verdict

Founders Plot is currently playable as an HQ1 slice, but HQ1-HQ3 is not currently playable/reachable through normal fresh-player progression.

What works:

- A fresh plot loads with HQ Lv 1 and starter coin.
- The player can place a Lumber Camp.
- Construction runs server-side and resolves over time.
- The player can queue Lumber Camp production.
- Production resolves server-side to ready output.
- The player can collect wood output.
- Three.js renders Clover plus visual-only builder, worker, hauler, messenger, routes, ways, cues, and encounters from server state.

What does not work:

- A fresh player cannot reach HQ2, so cannot reach HQ3.
- The quest order can tell the player to build Farm Plot while Farm Plot is still locked behind HQ2.
- HQ2 requires `20 wood`, `10 food`, and `25 XP`; the reachable HQ1 loop can produce wood but no food.
- Existing focused tests prove the HQ1 playable slice and visual projections, not HQ2/HQ3 reachability.

Roster verdict:

- Builder is wired as Rigger Slate via `rigger-slate-builder-v2`.
- Worker is wired as Kettle-37 via `kettle-37-worker-v1`.
- Hauler is wired as Oona Tallpack via `oona-tallpack-hauler-v1`.
- Messenger is not wired as Rook/Rook Signalpost in this branch. It is still the generic/current `messenger-agentfolk-v1` asset. Reports mention Rook Signalpost as a likely/separate candidate, but current in-game scene state does not use Rook.

## Git State

Current branch and commit:

```text
neo/founders-plot-rigger-live-inhabitants-cleanup-2026-05-28
566f622fec19d05e6126cde720cea3118130f4f1
```

Tracking:

```text
## neo/founders-plot-rigger-live-inhabitants-cleanup-2026-05-28...origin/neo/founders-plot-rigger-live-inhabitants-cleanup-2026-05-28
```

Dirty state before writing this report consisted of untracked files only, including local OpenClaw identity files, design/spec artifacts, Mara/Vell draft assets, V6 step reports, and `tmp/`. No tracked file diffs were present after verification builds/tests.

This report adds one new untracked report file:

```text
reports/agent-town-hq1-hq3-functionality-audit-2026-05-29.md
```

## Static Evidence

Core economy/unlock facts live in `server/founders_plot/engine.js`:

- HQ Lv 1 unlocks only `LUMBER_CAMP`.
- HQ Lv 2 unlocks `FARM_PLOT`.
- HQ Lv 3 unlocks `QUARRY`.
- HQ1 -> HQ2 costs `{ wood: 20, food: 10 }` and requires `25` XP.
- Fresh plot inventory is `{ wood: 0, stone: 0, food: 0, coin: 20 }`.
- Lumber Camp construction costs `{ coin: 8 }`.
- Lumber Camp produces only wood: `6` at Lv 1, `8` at Lv 2.
- Farm Plot is the first food producer, but it unlocks at HQ2.

The quest ordering has a mismatch:

- `currentQuest()` checks `!hasType('FARM_PLOT')` before it checks `bundle.plot.hqLevel < 2`.
- After the first Lumber Camp output is collected, the quest becomes `Establish a Farm Plot`.
- At that moment Farm Plot is still locked because the plot is still HQ Lv 1.

The browser UI in `public/experiences/founders-plot/founders-plot.js` exposes real mutation buttons for:

- place building
- queue production
- collect outputs
- upgrade building/HQ
- set priority
- save Foreman policy

Those actions call `/api/founders-plot/*` endpoints. The UI does not currently surface exact missing-resource/missing-XP breakdowns for failed HQ upgrades; it shows the server error as a toast.

## Probe Evidence

I ran two independent temp-store engine probes without changing code.

Fresh HQ1 loop probe:

```text
initial: hqLevel=1, townXp=0, inventory={wood:0, stone:0, food:0, coin:20}, unlocked=["LUMBER_CAMP"]
place-lumber: ok=true
after first collect: hqLevel=1, townXp=15, inventory={wood:6, stone:0, food:0, coin:12}, unlocked=["LUMBER_CAMP"]
quest: Establish a Farm Plot
place-farm-before-hq2: ok=false, INVALID_STATE, "Farm Plot is not unlocked yet."
upgrade-hq2-after-first-collect: ok=false, OUT_OF_RESOURCES, "Not enough town XP for the next HQ upgrade."
after four Lumber Camp collect loops: hqLevel=1, townXp=15, inventory={wood:24, stone:0, food:0, coin:12}
upgrade-hq2-after-four-collects: ok=false, OUT_OF_RESOURCES, "Not enough town XP for the next HQ upgrade."
```

Daily-return XP plus first reward probe:

```text
beforeUpgrade:
  hqLevel=1
  townXp=25
  inventory={wood:24, stone:0, food:0, coin:17}
  unlocked=["LUMBER_CAMP"]
upgrade:
  ok=false
  error=OUT_OF_RESOURCES, "Not enough resources to start that upgrade."
```

That second probe shows that even if the player legally waits long enough for daily-return XP and claims the first reward, food remains unavailable before HQ2.

## Test Commands And Results

Passed:

```bash
npm run build:founders-plot-threejs
```

Passed:

```bash
npm run test:founders-plot
```

Result: `38/38` passed.

Passed:

```bash
PW_PORT=4314 npx playwright test e2e/214_founders_plot_threejs_playable_slice.spec.js
```

Result: `1/1` passed.

Passed:

```bash
PW_PORT=4315 npx playwright test e2e/200_founders_plot.spec.js
```

Result: `9/9` passed.

No requested focused verification command failed or was skipped. Full `npm test` was not run because the requested scope was Founders Plot-focused validation.

## What The Tests Prove

`npm run test:founders-plot` proves:

- tool contracts and envelopes exist;
- HTTP state/placement endpoints work;
- idempotency works;
- basic performance/catch-up constraints hold;
- visual actors are deterministic projections and visual-only;
- the full HQ1 loop can place, construct, produce, collect, and gain inventory.

`e2e/200_founders_plot.spec.js` proves:

- `/founders-plot` loads;
- API tools are exposed;
- state seeds HQ + starter coin;
- Lumber Camp placement works;
- API idempotency and policy rejection work;
- the API and UI can complete the first Lumber Camp construct -> produce -> collect loop.

`e2e/214_founders_plot_threejs_playable_slice.spec.js` proves:

- the Three.js canvas renders nonblank;
- Clover and messenger appear at initial state;
- builder appears during construction;
- worker appears during production;
- hauler appears when output is ready;
- actor picks do not mutate server event count;
- Rigger, Kettle, Oona, and current messenger assets render as sprite sheets with no fallback;
- ways/encounters are visual-only.

The tests do not prove:

- HQ2 reachability;
- HQ3 reachability;
- Farm Plot placement from fresh play;
- Quarry placement from fresh play;
- a milestone path from HQ1 to HQ3 through normal player actions.

## HQ1-HQ3 Status

### HQ1

Playable.

The player can:

- open the plot;
- see HQ Lv 1;
- place Lumber Camp;
- wait for construction;
- queue production;
- wait for production;
- collect wood;
- see visual-only inhabitants react to real server state.

### HQ2

Implemented as rules and assets, but not reachable from fresh play.

Implemented pieces:

- HQ2 unlock row exists.
- HQ2 building art exists.
- `FARM_PLOT` unlock is configured at HQ2.
- HQ upgrade mutation exists.
- HQ upgrade job simulation exists.

Blocker:

- HQ2 requires food, but the first food source is Farm Plot, and Farm Plot requires HQ2.

### HQ3

Implemented as rules and assets, but not reachable from fresh play.

Implemented pieces:

- HQ3 unlock row exists.
- HQ3 building art exists.
- `QUARRY` unlock is configured at HQ3.
- `queueProduction` Foreman permission unlocks at HQ3.

Blocker:

- HQ3 depends on reaching HQ2 first, and HQ2 is currently blocked.
- HQ2 -> HQ3 also requires stone, which comes from Quarry at HQ3 unless another stone source/reward path is introduced. The existing `hq.level-3` reward grants stone only after already reaching HQ3.

## Roster Status

Current scene wiring in `public/experiences/founders-plot/scene_state.js`:

```text
builder -> rigger-slate-builder-v2
worker -> kettle-37-worker-v1
hauler -> oona-tallpack-hauler-v1
messenger -> messenger-agentfolk-v1
```

Current asset metadata:

```text
rigger-slate-builder-v2: displayName="Rigger Slate", role="builder"
kettle-37-worker-v1: character="Kettle-37", role="worker"
oona-tallpack-hauler-v1: character="Oona Tallpack", role="hauler"
messenger-agentfolk-v1: role="messenger", no character/displayName
```

`Rook`/`Rook Signalpost` appears in reports as a likely messenger candidate, but not in the current runtime asset map. `rg` over the current Founders Plot runtime finds no Rook runtime asset or scene-state mapping.

## Visual Vs Gameplay Authority

Gameplay-authoritative:

- plot inventory;
- HQ level;
- buildings;
- jobs;
- construction and production timers;
- output buffers;
- rewards;
- policy/approvals;
- event log and replay audit.

Visual/projection-only:

- `state.visualActors`;
- Three.js actor sprites;
- action cues;
- routes;
- ways;
- encounters;
- hidden DOM actor hooks used for testability.

The visual inhabitants do not mutate resources, jobs, buildings, policy, or event count. They are readable receipts of server facts.

## Gaps And Risks

- Progression deadlock: HQ2 needs food before food is reachable.
- Progression deadlock continues into HQ3: HQ3 needs stone, but Quarry unlocks at HQ3 and the HQ3 reward arrives after HQ3.
- Quest bug: the quest asks for Farm Plot before HQ2 makes it legal.
- Existing test naming says "playable slice", but the covered slice is HQ1/Lumber Camp, not HQ1-HQ3.
- The current messenger is not Rook, so any teammate assuming "Rigger, Kettle, Oona, Rook" is ahead of the runtime branch.
- The UI has real buttons but weak blocked-state explanation; failed upgrade attempts do not tell the player exactly which resource/XP is missing.

## Recommended Next Step

Make "Reachable HQ1-HQ3" the next gameplay slice before adding more V6/civic mechanics.

Minimum acceptance criteria:

- A fresh player can reach HQ2 and HQ3 with normal UI/API actions and test time advancement only.
- Quest order never points to a locked/illegal primary action.
- HQ upgrade failures include exact missing resources and XP.
- Add a focused engine test and Playwright test that complete HQ1 -> HQ2 -> HQ3 without hidden grants.
- After that, wire the accepted Rook Signalpost messenger asset if Rook is the chosen roster member.
