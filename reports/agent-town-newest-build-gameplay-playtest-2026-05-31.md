# AgentTown Newest Build Gameplay Playtest - 2026-05-31

## Summary Verdict

**Partially works.** The Founders Plot gameplay core works end to end through the newest HQ3-HQ10A path: early construction, scout report, site-plan draft/review, Settler Convoy, second plot, Survey Discipline, HQ9 Work Orders, and HQ10A World Grid read model all completed through current server-owned routes. Authority boundaries held.

The main blockers before calling it clean are UI/UX: mobile has serious horizontal overflow/occlusion, and the dense scene made the Expedition Board tile unreliable to select in the seeded late-game layout. Product-wise, the game loop is coherent, but the late-game panels are getting too dense for scanning.

## What I Played

Environment:
- Workspace: `/Users/robin/Projects/Portal-atlas-editor`
- Branch: `neo/progression-atlas-editor-next-2026-05-29`
- Local server: `PORT=4197 NODE_ENV=test STORE_PATH=/tmp/agent-town-gameplay-qa-20260531.sqlite node server/index.js`
- The early plot was played naturally through the UI. For the late-game path, I seeded an isolated test-mode HQ6 fixture in the same SQLite test store, then exercised the real UI buttons and server endpoints.

Screens/routes/buttons exercised:
- `/founders-plot`
- Fresh plot view, resource strip, grid, scene, Foreman, panels.
- UI basic loop:
  - Clicked `fp-tile-0-1`
  - Clicked `fp-palette-LUMBER_CAMP`
  - Advanced test clock through construction
  - Clicked `fp-btn-queue`
  - Advanced test clock through production
  - Clicked `fp-btn-collect`
- HQ6 gated core screen with HQ/building prerequisites present: HQ, Lumber Camp, Farm Plot, Quarry, Expedition Board, Workshop, Market Stall.
- Expedition/scouting path:
  - `POST /api/founders-plot/queue-job` with `kind: SCOUT`
  - `POST /api/founders-plot/collect-outputs`
  - Scout Report panel/card rendered with art and chips.
- Site-plan path:
  - Clicked `fp-btn-draft-site-plan-<reportId>`
  - Clicked `fp-btn-review-site-plan-<planId>`
- Settlement path:
  - Clicked `fp-btn-prepare-settler-convoy-<planId>`
  - Clicked `fp-btn-found-settlement-<claimId>`
  - Confirmed Owned Plots shows Home + Outpost.
- Doctrine path:
  - Clicked `fp-btn-select-doctrine-survey_discipline`
  - Confirmed selected effect text: Expedition Board SCOUT duration reduced by 5%, with costs/outputs/inventory/settlement/cross-plot unchanged.
- HQ9 Work Orders:
  - Produced two ready outputs through server route/test clock.
  - Clicked `fp-btn-create-work-order-collect_ready_outputs_once`
  - Clicked `fp-btn-execute-work-order-<workOrderId>`
  - Confirmed completed work order has 2 child receipts.
- HQ10A World Grid:
  - `GET /api/founders-plot/world-grid?plotId=...`
  - Opened Atlas with `fp-open-progression-atlas`
  - Confirmed Atlas world-grid brief shows advisory/read-only status.

## Product Sense

What makes sense:
- The loop now has a real city-builder spine: build production, collect, unlock gates, scout outward, turn reports into plans, review them, send a convoy, found a second plot, then use that civic state for doctrine/work-order/world-grid readiness.
- The Progression Atlas feels like it belongs inside Founders Plot now. It explains gates and future systems without pretending to operate the game.
- The Work Orders copy is very clear about the boundary: draft first, explicit execute, no scheduler, no spending, no placement, no scouting/founding/Atlas mutation.
- The World Grid read model is a good next-horizon surface. It communicates readiness without over-promising mutation.

What feels confusing:
- The Research Lodge panel says no physical Research Lodge building exists in this slice, while the product language and art imply a Research Lodge. This may be technically true, but it reads like an implementation caveat in the game UI.
- Late-game right-column panels are dense. They are accurate, but not yet comfortably scannable once Reports, Plans, Claims, Doctrine, Work Orders, and World Grid are all live.
- After a work order completes, the template card still offers `Create Draft` above the completed receipt. That may be intended, but visually it can read like the first order did not resolve.

## Findings

### High - Mobile layout overflows and occludes content

Proof: `reports/agent-town-newest-build-playtest-12-final-mobile-2026-05-31.png`

On a 390x844 mobile viewport, the page overflows horizontally and a blank/right-side column occludes content. Cards are clipped, long text is cut off, and the viewport no longer reads as a single usable mobile surface. The relevant responsive rules start around `public/experiences/founders-plot/founders-plot.css:692`, but this needs an actual layout pass rather than a tiny patch.

### Medium - Expedition Board tile selection was unreliable in the dense HQ6 scene

In the seeded late-game scene, Playwright could not reliably surface `fp-btn-queue` by clicking the Expedition Board tile even though the backend route and building state were valid. A separate isolation check showed the panel can open, so this looks like a hit-target/scene-overlap fragility rather than a server issue. I exercised scouting through the real `/api/founders-plot/queue-job` and `/collect-outputs` routes to continue the pass.

Recommended smallest follow-up: add a targeted e2e for clicking the Expedition Board in a full 3x3 late-game scene, then tune tile/actor overlay hit areas.

### Low - Visual actor proof under-represents the new functional inhabitants in the final state

Final scene facts found a nonblank canvas and visual hooks for Clover, Settler, and Messenger, but not Workshop Specialist / Market Trader in the final steady state:
`reports/agent-town-newest-build-playtest-scene-facts-2026-05-31.json`

This is probably state-dependent because those inhabitants appear during active/ready building states, and the final proof was after work-order collection. Not a gameplay blocker, but future QA should capture active Workshop/Market states explicitly.

## Authority Boundary Check

Passed.

- Atlas exposed metadata/advisory surfaces and did not execute actions.
- World Grid returned `readOnly: true`, `executableActions: []`, and `worldDelta: []`.
- Reading World Grid did not change the audit event count.
- Work Orders executed only through the explicit Founders Plot endpoint and collected exactly two ready outputs once.
- No scheduler, background execution, arbitrary tool runner, spending by Atlas, placement by Atlas, scouting by Atlas, settlement mutation by Atlas, or public/external effect surfaced.

## Proof

Contact sheet:
- `reports/agent-town-newest-build-playtest-contact-sheet-2026-05-31.png`

High-value screenshots:
- `reports/agent-town-newest-build-playtest-01-fresh-plot-desktop-2026-05-31.png`
- `reports/agent-town-newest-build-playtest-02-basic-loop-after-collect-2026-05-31.png`
- `reports/agent-town-newest-build-playtest-03-hq6-gated-core-2026-05-31.png`
- `reports/agent-town-newest-build-playtest-04-scout-report-collected-2026-05-31.png`
- `reports/agent-town-newest-build-playtest-05-site-plan-reviewed-2026-05-31.png`
- `reports/agent-town-newest-build-playtest-06-settler-convoy-preparing-2026-05-31.png`
- `reports/agent-town-newest-build-playtest-07-second-plot-founded-2026-05-31.png`
- `reports/agent-town-newest-build-playtest-08-research-doctrine-selected-2026-05-31.png`
- `reports/agent-town-newest-build-playtest-09-work-order-draft-2026-05-31.png`
- `reports/agent-town-newest-build-playtest-10-work-order-completed-2026-05-31.png`
- `reports/agent-town-newest-build-playtest-11-atlas-world-grid-boundary-2026-05-31.png`
- `reports/agent-town-newest-build-playtest-12-final-mobile-2026-05-31.png`

Read-model proof:
- `reports/agent-town-newest-build-playtest-world-grid-read-model-2026-05-31.json`
- `reports/agent-town-newest-build-playtest-scene-facts-2026-05-31.json`

## Verification Commands

Passed:

```bash
node --check public/experiences/founders-plot/founders-plot.js
node --check public/experiences/founders-plot/scene_state.js
node --check public/progression-atlas.js
node --check server/founders_plot/engine.js
node --check server/founders_plot/routes.js
node --check server/founders_plot/store.js
node --check server/founders_plot/progression_atlas.js
```

```bash
NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-scene-state.test.js
# 75/75 passed
```

```bash
PW_PORT=4198 npx playwright test e2e/200_founders_plot.spec.js e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium
# 16/16 passed
```

```bash
git diff --check
# passed
```

## Residual Risk

This was a gameplay QA pass, not a full regression suite. I did not run the entire repository Playwright suite. The late-game playtest used an isolated test fixture seed after the early loop to avoid spending the lane on repeated resource grinding; the focused server and e2e suites still cover the canonical progression and authority contracts.
