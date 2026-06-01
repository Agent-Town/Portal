# AgentTown HQ10 Slice Loop Coordination

Date: 2026-05-30
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Worktree: `/Users/robin/Projects/Portal-atlas-editor`

## Objective

Keep Agent Town moving toward HQ10 through small, report-backed slices while Robin is away.

The loop should advance the player experience, server-owned state, Progression Atlas canonical graph, Founders Plot frontend, scene-state projections, graphics, inhabitants, units, sprites, and stories.

## Guardrails

- Do not push, merge, deploy, post publicly, or clean unrelated files.
- Preserve server authority: canonical gameplay belongs in engine/store/routes/tools/tests.
- Keep editor-created strategy steps, resource gates, icons, and canonical proposals advisory until promoted through reviewed engine code.
- Every slice needs a teammate-readable markdown report.
- Every implemented slice needs targeted syntax checks, Founders Plot tests, relevant Playwright checks when UI is touched, and `git diff --check`.
- Visuals may be placeholders only when clearly marked. Player-facing canonical buildings/units should quickly get real assets.

## Current Baseline

Implemented on this branch before this loop:

- Progression Atlas embedded inside Founders Plot.
- Strategy Editor with canonical and draft `resourceGate`s.
- Engine Graph Studio with advisory `canonicalProposal` steps.
- HQ3 Expedition Board -> `SCOUT` job -> persisted Scout Report receipt.
- Scout Report -> canonical Site Plan draft via `et.plot.draft_site_plan`.

Latest verified baseline from memory:

- Founders Plot node tests: `42/42`.
- Playwright `e2e/200` + `e2e/114`: `11/11`.
- `git diff --check` passed.

## Active Subagent Lanes

### Curie - HQ6 Settlement Charter Core

Agent id: `019e7772-6f93-7d80-8759-ba0be4dfb153`

Status: complete and parent-verified.

Purpose: implement a bounded HQ6 core slice if feasible.

Owned files:

- `server/founders_plot/engine.js`
- `server/founders_plot/store.js`
- `server/founders_plot/routes.js`
- `server/founders_plot/tools.js`
- `server/founders_plot/progression_atlas.js`
- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-http.test.js`
- `tests-founders-plot/fp-contract.test.js`
- Founders Plot / Atlas docs
- `reports/agent-town-hq6-settlement-charter-core-slice-2026-05-30.md`

Target outcome:

- HQ6 becomes real engine truth if practical.
- Site Plans can be reviewed/promoted into claim-ready planning state.
- No second plot, territory claim, convoy, route, or resource payout yet.

Result:

- HQ6 is now server-owned engine truth with `hq.level.6`, `hq.upgrade.6`, storage caps `220/220/220`, 3 construction slots, and HQ5 -> HQ6 upgrade cost `{ wood: 90, stone: 80, food: 50 }`, XP 220, duration 180000ms.
- Added `et.plot.review_site_plan` and `POST /api/founders-plot/review-site-plan` for reviewing an existing canonical Site Plan into claim-ready planning state.
- Reviewed plans use `status: REVIEWED`, `reviewStatus: reviewed`, `promotionStatus: reviewed_claim_ready`, and `authorityBoundary: claim_ready_planning_only_no_territory`.
- Progression Atlas exposes HQ6 and Site Plan review nodes while keeping Atlas action refs non-executable.
- Parent verification passed: syntax checks for touched server/test files, `NODE_ENV=test node --test tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-unit.test.js` 40/40, and `git diff --check`.

### Mill - HQ7 Settler Convoy / Second Plot Plan

Agent id: `019e7772-9ac8-7d83-a446-7e523f6b2179`

Status: complete.

Purpose: produce an implementation-ready plan for the HQ7 second-plot slice.

Report:

- `reports/agent-town-hq7-settler-convoy-second-plot-implementation-plan-2026-05-30.md`

Target outcome:

- Exact model/tool/state/UI/test plan for moving from reviewed Site Plan to convoy/claim/second plot.

Result:

- Recommended HQ7 as one narrow playable flow: claim-ready Site Plan -> prepare Settler Convoy -> timed convoy route -> explicit found-settlement action -> second plot using the existing plot engine.
- Key model decisions: add `founder_settlement_claims` and `founder_plot_memberships`; reuse `founder_plots` for second plots with membership-based access checks rather than breaking the current `pair_id UNIQUE` constraint.
- Proposed only two HQ7 mutations for the first slice: `et.plot.prepare_settler_convoy` and `et.plot.found_settlement`, both idempotent and approval-gated for agent callers.
- Keep Atlas action refs non-executable and generate HQ7 canonical nodes from engine state, not editor proposals.
- Render convoy/routes/outpost markers as visual-only scene projections; all mutation stays in explicit Founders Plot UI/tool calls.

### Noether - HQ6-HQ10 Inhabitants / Units / Sprites / Story

Agent id: `019e7772-c590-76f3-8ca0-d3d9ee271c1f`

Status: complete.

Purpose: plan production-grade art/story needs for new buildings, units, sprites, icons, and frontend states.

Report:

- `reports/agent-town-hq6-hq10-inhabitants-units-sprites-story-plan-2026-05-30.md`

Target outcome:

- Prioritized art and narrative production plan for Settlement Charter, convoy, Research Lodge, cohorts, and World Grid.

Result:

- Highest-priority art debt is replacing current HQ3 placeholders: real Expedition Board art, a dedicated scout/pathfinder sprite, Scout Report icon/card prop, and Site Plan dossier icon.
- HQ7 needs the next production pack: settler convoy crew/unit sheet, outpost marker, outpost core, and claim/founding receipt icons.
- HQ8-HQ10 art should queue behind that: Research Lodge/researcher, Cohort Hall/cohort lead, World Grid/civic courier/oracle adjunct.

### Bacon - HQ6-HQ7 Production Asset Pack Prompt Spec

Agent id: `019e777c-1c4e-7820-9949-a239c6ac4c98`

Status: complete.

Purpose: convert Noether/Mill findings into an implementation-ready asset prompt and registry wiring spec before adding more player-facing buildings/units.

Report:

- `reports/agent-town-hq6-hq7-production-asset-pack-prompt-spec-2026-05-30.md`

Target outcome:

- Exact prompt briefs, suggested file paths, icon IDs, scene role IDs, sprite metadata, UI states, and test implications for Expedition Board/scout/report/site-plan assets plus HQ6/HQ7 Settlement Charter and Settler Convoy assets.

Result:

- Wrote `reports/agent-town-hq6-hq7-production-asset-pack-prompt-spec-2026-05-30.md`.
- Immediate production art pack should replace HQ3 placeholders first: `expedition-board.webp`, dedicated `pathfinder-scout-v1` sprite sheet/metadata, Scout Report dossier icon/prop, and Site Plan dossier icon/prop.
- HQ6 assets should cover Settlement Charter board/table plus reviewed-plan receipt/stamp visuals.
- HQ7 assets should cover settler/convoy crew sprite sheet, convoy wagon/object, outpost marker/core, and claim/founding receipt icons.
- Spec includes filenames, icon IDs, scene role IDs, sprite metadata contracts, UI states, prompt briefs, negative prompts, and test implications.

### Lovelace - HQ6 Site Plan Review UI

Agent id: `agent:main:subagent:46f56966-8b73-48b9-acd4-d93443013f29`

Status: complete and parent-verified.

Purpose: implement the smallest player-facing HQ6 Site Plan Review affordance on top of Curie's server-owned review action.

Report:

- `reports/agent-town-hq6-site-plan-review-ui-slice-2026-05-30.md`

Target outcome:

- Founders Plot Site Plan cards show a review action only when a canonical Site Plan exists, plot is HQ6+, and the plan is not reviewed.
- UI calls the existing `/api/founders-plot/review-site-plan` route with idempotency and renders reviewed/claim-ready planning state.
- No HQ7 territory, convoy, second plot, route, resource payout, or founding receipt behavior.

Result:

- Implemented the Site Plans panel review affordance on top of the existing server-owned HQ6 review route.
- UI states now show locked-before-HQ6 copy, review-available action, reviewing pending state, and reviewed `Claim-ready planning only` copy.
- Added Playwright coverage `FP-E2E-010` for the review action payload and post-review UI state.
- Parent verification passed: `node --check` for touched UI/test files, `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js` 13/13, `npx playwright test e2e/200_founders_plot.spec.js --project=chromium` 10/10, and `git diff --check`.

### Kuhn - HQ7 Settler Convoy Core

Agent id: `019e779e-8306-7233-8818-72b3255cbc36`

Status: complete and parent-verified.

Purpose: implement the first bounded HQ7 Settler Convoy / second plot core slice using Mill's plan as the source of truth.

Report:

- `reports/agent-town-hq7-settler-convoy-core-slice-2026-05-30.md`

Target outcome:

- Reviewed Site Plan can move into a narrow engine-owned Settler Convoy / settlement-founding flow.
- Use explicit server-owned actions, expected tools `et.plot.prepare_settler_convoy` and `et.plot.found_settlement`, with idempotency and approval/policy gates for agent callers.
- Keep Atlas action refs non-executable and keep editor proposals advisory.
- Avoid broad world-map mechanics, trade routes, doctrine effects, arbitrary editor execution, Generated Universe overlays, public cross-player mutation, or unbounded automation.

Result:

- Implemented server-owned HQ7 core state: `founder_settlement_claims`, `founder_plot_memberships`, membership-gated private plot reads, and outpost creation through existing `founder_plots` using synthetic `settlement:<claimId>` pair IDs.
- Added `et.plot.list_plots`, `et.plot.prepare_settler_convoy`, `et.plot.found_settlement`, plus matching routes and focused unit/http/contract coverage.
- Added Progression Atlas HQ7 canonical nodes/action refs/receipts while keeping action refs non-executable.
- Parent verification passed: touched server/test syntax checks, `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` 45/45, targeted Atlas Playwright `e2e/114` 2/2, and `git diff --check`.
- Parent found and fixed stale browser assertions plus a `gameplayStableHash` drift caused by hashing volatile owned-plot summary timestamps; owned plots are now compacted to gameplay-significant fields for the stable Atlas snapshot.

### Raman - HQ7 Settler Convoy UI

Agent id: `019e77b7-c387-7c52-a6c2-7120ea18a487`

Status: complete and parent-verified.

Purpose: implement the smallest player-facing HQ7 UI affordance on top of Kuhn's server-owned convoy/founding actions.

Report:

- `reports/agent-town-hq7-settler-convoy-ui-slice-2026-05-30.md`

Target outcome:

- Reviewed Site Plan cards expose a `Prepare Settler Convoy` action only when eligible and call `/api/founders-plot/prepare-settler-convoy`.
- Settlement Claim cards show `CONVOY_PREPARING`, `CONVOY_ARRIVED`, and `FOUNDED` states; arrived claims expose a `Found Settlement` action using `/api/founders-plot/found-settlement`.
- Add a minimal owned-plots read surface using `/api/founders-plot/plots` if it stays small; defer full plot switching if it grows.
- No new server routes/tools, no broad world map, no route/trade/doctrine/cohort/world-grid mechanics, and no Atlas executable action refs.

Result:

- Implemented claim-aware Site Plan actions, Settlement Claim cards, and a read-only Owned Plots panel on top of Kuhn's existing server routes.
- Added browser coverage `FP-E2E-011` for preparing a convoy, rendering claim state, founding an outpost, and showing the owned outpost summary.
- Parent verification passed: touched UI/test syntax checks, `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js` 14/14, `npx playwright test e2e/200_founders_plot.spec.js --project=chromium` 11/11, and `git diff --check`.

### Jason - HQ8 Research Lodge Advisory Doctrine

Agent id: `019e77c1-b84b-7150-ae08-9108f17adb9b`

Status: stalled/missing report as of 2026-05-30 14:31 +07; no active session found.

Purpose: implement the smallest HQ8A Research Lodge / doctrine stance slice after verified HQ7 server and UI work.

Report:

- `reports/agent-town-hq8-research-lodge-advisory-doctrine-slice-2026-05-30.md`

Target outcome:

- Introduce server-owned advisory doctrine state and/or Research Lodge framing without gameplay buffs in this slice.
- Add explicit engine/store/routes/tools/docs/tests ownership for any canonical doctrine truth.
- Keep Atlas action refs non-executable and keep editor proposals advisory.
- Avoid stacked doctrines, cross-plot effects, generated lore changing rules, cohorts, work orders, world-grid mechanics, and arbitrary editor execution.

### Lovelace - HQ8 Research Lodge Advisory Doctrine Replacement

Agent id: `019e77cc-3592-7471-9f0a-1cddd260921a`

Status: complete and parent-verified.

Purpose: replacement bounded worker for the same HQ8A Research Lodge / advisory doctrine stance lane after Jason's report/session was missing.

Report:

- `reports/agent-town-hq8-research-lodge-advisory-doctrine-slice-2026-05-30.md`

Target outcome:

- Introduce server-owned advisory doctrine stance state and/or Research Lodge framing without gameplay buffs in this slice.
- Add explicit engine/store/routes/tools/docs/tests ownership for any canonical doctrine truth.
- Keep Atlas action refs non-executable and keep editor proposals advisory.
- Avoid stacked doctrines, cross-plot effects, generated lore changing rules, cohorts, work orders, world-grid mechanics, and arbitrary editor execution.

Result:

- Implemented server-owned HQ8A Research Lodge advisory doctrine stance.
- Added `survey_discipline` doctrine catalog state, persisted selected doctrine state, `DOCTRINE_SELECTED` receipt events, `et.plot.select_doctrine`, and `/api/founders-plot/select-doctrine`.
- Added state exposure plus Progression Atlas canonical Research Lodge/doctrine nodes with non-executable action refs.
- Preserved boundaries: no gameplay buff, no resource math, no stacking, no cross-plot effect, no UI, no Research Lodge building, and agent callers require matching human approval.
- Parent verification passed: touched server/test syntax checks, Founders Plot unit tests 24/24, contract tests 11/11, HTTP tests 15/15, targeted Atlas Playwright `e2e/114` 2/2, and `git diff --check`.

### Rawls - HQ8B First Engine-Owned Doctrine Effect

Agent id: `019e77d1-b8b9-7922-bc4c-b07393ab0fa7`

Status: complete and parent-verified.

Purpose: implement the smallest safe engine-owned effect for the existing `survey_discipline` doctrine.

Report:

- `reports/agent-town-hq8-doctrine-first-effect-slice-2026-05-30.md`

Target outcome:

- Promote `survey_discipline` from advisory-only stance into a tiny operational doctrine effect, preferably a deterministic 5% SCOUT duration reduction.
- Keep the effect server-owned, explicit, reversible by server rule, and fully test-backed.
- Update engine/read-model/Atlas/tool docs/tests as needed while keeping Atlas action refs non-executable.
- Avoid physical Research Lodge building/art/UI, multiple doctrine slots, stacking, generated-lore rules, cross-plot effects, resource payouts, settlement/routes/cohorts/world-grid mechanics, or arbitrary editor execution.

Result:

- Promoted `survey_discipline` into the first tiny server-owned doctrine effect.
- Selected `survey_discipline` now applies only to Expedition Board `SCOUT` jobs with `durationMs = round(baseDurationMs * 0.95)`, so the current SCOUT duration changes from 90000ms to 85500ms.
- Preserved inputs, outputs, inventory, settlement, route, cohort, world-grid, and cross-plot math.
- Updated engine/read-model/Atlas/tool docs/tests while keeping Atlas action refs non-executable and Strategy Editor JSON unable to invent doctrine effects.
- Parent verification passed: touched server/test syntax checks, Founders Plot unit/contract/http tests 51/51, targeted Atlas Playwright `e2e/114` 2/2, and `git diff --check`.

### Tesla - HQ8 Research Lodge Doctrine UI

Agent id: `019e77e1-eab9-76d2-9f97-fa42074f19e8`

Status: active.

Purpose: implement the smallest player-facing Research Lodge doctrine UI on top of the verified HQ8A/HQ8B server truth.

Report:

- `reports/agent-town-hq8-research-lodge-doctrine-ui-slice-2026-05-30.md`

Target outcome:

- Add a compact Founders Plot Research Lodge / Doctrine panel or section using existing `research`, `doctrineCatalog`, and `doctrineState` state fields.
- Show locked, available, and selected states honestly.
- When available, expose a human `Select Doctrine` action for `survey_discipline` through the existing `/api/founders-plot/select-doctrine` route.
- After selection, show the exact effect: Expedition Board `SCOUT` duration reduced by 5%; claim no other effects.
- Do not add new server routes/tools, physical Research Lodge building/art, broad research tree, stacked doctrines, cohorts, work orders, world-grid mechanics, or Atlas executable action refs.

### Hegel - HQ8-HQ10 Systems Sequence

Agent id: `019e7772-fac7-7cb2-b187-ed1dd2dd1a73`

Status: complete.

Purpose: plan the Research Lodge, Agent Cohorts, and World Grid sequence after HQ7.

Report:

- `reports/agent-town-hq8-hq10-research-cohorts-worldgrid-slice-plan-2026-05-30.md`

Target outcome:

- Implementation order, authority boundaries, OpenClaw Lite boundaries, and pitfalls for HQ8-HQ10.

Result:

- Recommended post-HQ7 order: HQ8A Research Lodge advisory doctrine stance, HQ8B first engine-owned doctrine effect, HQ9A cohort/work-order planner, HQ9B single safe work-order executor, HQ9C scout work-order executor, HQ10A World Grid read model, HQ10B civic proposal records, HQ10C Generated Universe overlay packs.
- Keep all HQ8-HQ10 editor content advisory until engine/store/routes/tools own the relevant state and receipts.

## Next Loop Rules

1. If Tesla finishes successfully, review and verify the HQ8 doctrine UI patch first.
2. If Tesla only reports blockers, implement the smallest safe HQ8 doctrine UI checkpoint locally or spawn a narrower worker.
3. Use Noether's completed report and Bacon's asset prompt spec before adding new player-facing units/buildings to avoid another placeholder-heavy slice.
4. Use Hegel's completed report to keep HQ8-HQ10 coherent before coding Research Lodge or cohorts.
5. Update `memory/2026-05-30.md` after each completed slice or significant blocker.

## Current Preferred Slice Order

1. HQ6 Settlement Charter / reviewed Site Plan promotion.
2. HQ7 Settler Convoy / second plot claim/founding.
3. HQ8 Research Lodge / first doctrine.
4. HQ9 Agent Cohorts / scoped work orders.
5. HQ10 World Grid / civic and multi-plot projection layer.
