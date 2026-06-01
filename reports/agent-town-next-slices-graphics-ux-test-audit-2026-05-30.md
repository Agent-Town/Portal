# Agent Town Next Slices Graphics, UX, Scene-State, Asset, and Test Audit

Date: 2026-05-30
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Mode: report-only audit after the current HQ3 Expedition Board -> Scout Report slice.
Change made: this markdown report only.

## Executive Verdict

The current Scout Report slice is technically canonical now, but visually it is still a prototype.

Implemented gameplay truth:

- HQ3 unlocks `EXPEDITION_BOARD`.
- `EXPEDITION_BOARD` costs wood/stone/food, queues a real `SCOUT` job, and collects a persisted `scout_report` receipt.
- Progression Atlas exposes Expedition Board, scout dispatch, scout report collection, receipt refs, and collected report nodes in the canonical graph.
- Founders Plot UI shows report count and Scout Report cards.
- Scene projection emits visual-only scout actors for active and report-ready scout state.

Current visual shortcuts:

- Expedition Board uses `workshop.webp`.
- Scout uses Rook Signalpost messenger sprite sheet.
- `building.expedition_board`, `action.scout`, and `receipt.scout_report` exist in the global icon registry, but they are symbol-only (`EB`, `SC`, `SR`) with no raster assets.
- Scout Report cards are CSS parchment cards, not a produced report/receipt visual.

Recommendation: before shipping another post-Scout slice as "real", make a small Expedition/Settlement art pack and update Atlas horizon semantics. It is okay for the Strategy Editor to keep using generated/advisory icons, but canonical gameplay buildings, units, and receipt roles need proper production assets as soon as they are player-facing.

## Current Reusable Assets

### Founders Plot scene and buildings

Reusable as production-ish current assets:

- Backgrounds:
  - `public/experiences/founders-plot/assets/scenes/founders-plot-desktop.webp`
  - `public/experiences/founders-plot/assets/scenes/founders-plot-mobile.webp`
- Buildings:
  - `hq-lv1.webp` through `hq-lv5.webp`
  - `lumber-camp.webp`
  - `farm-plot.webp`
  - `quarry.webp`
  - `workshop.webp`
  - `market-stall.webp`
- Lots:
  - `empty-lot.webp`
  - `locked-lot.webp`

Current placeholder:

- `scene_state.js` maps `EXPEDITION_BOARD` to the Workshop asset. This is functional but visually misleading once Expedition Board becomes a core building.

### Inhabitants and visual-only actors

Reusable current role assets:

- Clover state portraits/sprites under `public/experiences/founders-plot/assets/characters/`.
- Rigger Slate builder: canonical builder/construction visual.
- Kettle-37 worker: canonical production/sell visual.
- Oona Tallpack hauler: canonical output-ready visual.
- Rook Signalpost messenger: canonical approval/reward/quest messenger.

Current placeholder:

- `scene_state.js` defines a `scout` role, but it points to `rook-signalpost-messenger-v1.png` and metadata. It is acceptable for a single Scout Report slice as "Rook carrying the report", but it blurs messenger and scout identities.

### Progression Atlas/global icons

Raster-backed global icons exist for:

- `building.hq`
- `building.lumber_camp`
- `building.farm_plot`
- `building.quarry`
- `resource.wood`
- `resource.food`
- `resource.stone`
- `hq.upgrade`
- `permission.queueProduction`

Symbol-only global icons exist for:

- `building.expedition_board`
- `building.workshop`
- `building.market_stall`
- `resource.coin`
- `resource.xp`
- `action.construct`
- `action.produce`
- `action.scout`
- `action.collect`
- `receipt.scout_report`

Implication: the canonical graph can render all nodes, but the post-HQ3 expansion lane looks less finished than the HQ1-HQ3 core path.

## Current Placeholder Inventory

| Surface | Current behavior | Placeholder risk |
| --- | --- | --- |
| Founders Plot scene | Expedition Board renders with Workshop art | Players may think Workshop and Expedition Board are the same system |
| Scout actor | Rook messenger sprite used for `canonicalRoleId: scout` | Messenger/report delivery identity gets confused with scouting/exploration |
| Scout Report receipt | CSS card in side panel and Atlas receipt node | No strong "I earned a new map/intel artifact" moment |
| Atlas icons | Expedition/scout/report are symbol fallbacks | Current graph looks uneven and less canonical than earlier buildings |
| HQ10 Horizon | Still says HQ6 is "Expedition Board" as future placeholder | Now conflicts with current HQ3 canonical Expedition Board |
| Founders Plot skill docs | `queueProduction` says `et.plot.queue_job` is for `PRODUCE` only | Browser/OpenClaw agent docs lag behind real `SCOUT` support |
| e2e visual coverage | Three.js e2e covers builder/worker/hauler/messenger, not scout | Browser can regress scout projection without current e2e catching it |

## Current Scene-State and UI Facts

### Engine and state

Primary files inspected:

- `server/founders_plot/engine.js`
- `server/founders_plot/store.js`
- `server/founders_plot/progression_atlas.js`
- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/scene_state.js`

Important current facts:

- `EXPEDITION_BOARD` is now in `BUILDING_DEFS`, unlocked at HQ3.
- `SCOUT` spends `{ food: 6, wood: 4 }`, takes `90_000ms`, and outputs `{ scout_report: 1 }`.
- `SCOUT_REPORT_TEMPLATES` currently produce deterministic nearby-site reports:
  - Forest Ridge Survey
  - River Flat Survey
  - Old Trail Signal
- `scoutReports` persist on the plot and store `reportId`, origin/source IDs, title, site type, risk, traits, resource hints, summary, recommended next step, sequence, and creation time.
- Scout reports intentionally do not contain `claimId` or `claimedAt`; claiming is deferred.

### Founders Plot UI

Current UI support:

- Header pill: `Reports N`.
- Building palette receives `EXPEDITION_BOARD` automatically from server `buildingDefs`.
- Building panel can show `Dispatch scout`.
- Jobs panel can show `Scouting`.
- Report-ready state uses `Report ready`.
- Side panel renders up to four Scout Report cards with site/risk/trait chips and recommended next copy.

UI gap:

- There is no dedicated "site dossier" view, report compare state, map preview, "plan from this report" action, or report-to-Atlas deep link.

### Progression Atlas UI

Current support:

- Summary includes report count.
- Canonical Coverage includes Expedition Board in "Current Buildings" and `SCOUT`/collect in "Loops + Effects".
- Engine Graph Studio groups receipt-like nodes under "Receipts".
- Once a report is collected, `receipt.scout_report.<id>` appears as a canonical receipt node.
- `receiptRefs['production.EXPEDITION_BOARD.collect']` links to collected report nodes.

Atlas gaps:

- Canonical Coverage lanes are still hard-coded. They include `production.EXPEDITION_BOARD.collect`, but not collected report receipt nodes as first-class lane items.
- HQ10 Horizon still labels HQ6 as "Expedition Board" even though Expedition Board has moved into HQ3 engine truth.
- Future milestone icons are generic HQ icons, not system-specific icons.
- Strategy Editor can draft gates and generated icon metadata, but cannot create real site/claim/research/cohort schemas.

## Next 2-4 Slices After Scout Report

### Slice 1: Site Dossier and Report Comparison

Goal: make collected Scout Reports useful without creating territory yet.

Canonical gameplay scope:

- Keep `scoutReports` as receipts/site intelligence.
- Add a player-facing site dossier/details view derived from collected reports.
- Let Atlas compare report traits, risk, and resource hints as planning state only.
- Do not create a second plot or claim record yet unless that is explicitly the slice.

Required graphics/icons/UI states:

- Scout Report receipt card art or a reusable parchment/report asset with no baked-in text.
- Icons:
  - `receipt.scout_report` raster
  - `site.woodland_ridge`
  - `site.river_flat`
  - `site.ruin_signal`
  - `trait.wood_rich`, `trait.food_rich`, `trait.stone_outcrop`, `trait.approval_needed`
  - `risk.low`, `risk.medium`, `risk.high`
- UI states:
  - no reports
  - one report
  - multiple reports
  - selected report details
  - report usable only for planning
  - report blocked from claim because claim rules do not exist

Safe as editor/generated/advisory:

- Report thumbnails.
- Site-type icons.
- Atlas comparison copy.
- Generated strategy icons for "Scout Ridge", "River Flat", etc.

Needs production art before canonical feel:

- Core `receipt.scout_report` icon.
- A clean Scout Report card/receipt visual if report collection is now a repeated reward loop.

Scene-state implications:

- No new actor required beyond current report-ready scout.
- Optional visual-only map pin/trail marker can project from `scoutReports`, but it must be non-pick-mutating and should open report UI only.
- Do not place site markers on the 3x3 build grid as if they are build pads.

Tests needed:

- HTTP: collected reports appear in state and Atlas without changing gameplay on read.
- Atlas: collected receipt nodes render and can be explained.
- UI: no-report, one-report, and multi-report card states.
- Mobile/desktop: report cards do not overflow the side panel or Atlas modal.

### Slice 2: Settler Convoy / Second Plot Claim

Goal: turn one collected report into an explicit claim/founding decision.

Canonical gameplay scope:

- Add a claimable site model separate from `scoutReports`.
- Add a `SETTLER_CONVOY` or `CLAIM_SITE` job/action only after explicit approval.
- Create a second plot record only after claim completion.
- Keep public/world-grid discovery out of this slice.

Required graphics/icons/UI states:

- Building or unit asset:
  - Settler Convoy wagon/camp team.
  - Optional "claim stake" prop.
- Icons:
  - `unit.settler_convoy`
  - `action.claim_site`
  - `building.outpost_hq` or `plot.second_settlement`
  - `receipt.claim_approval`
  - `route.convoy`
- UI states:
  - report eligible for claim
  - report ineligible because no claim rules/costs
  - claim approval pending
  - convoy preparing/departing
  - claim in progress
  - second plot created
  - second plot blocked or failed safely
- Atlas states:
  - "Report -> Claim Plan -> Approval -> Convoy -> Second Plot"
  - show cost/risk/reversibility clearly
  - action refs must remain non-executable in Atlas unless the gameplay route exists

Safe as editor/generated/advisory:

- Claim strategy drafts.
- Alternate site thumbnails.
- Generated "second plot candidate" icons before claim is canonical.
- Atlas copy comparing sites.

Needs production art before canonical gameplay:

- Settler/convoy actor or vehicle.
- Claim stake/second plot marker.
- Second-plot shell/background if the player can enter it.
- Distinct second-plot UI chrome if switching plots becomes a real workflow.

Scene-state/Three.js implications:

- Current `scene_state.js` is a single 3x3 Founders Plot projection. A second plot should not be squeezed into the same grid.
- Minimum safe projection:
  - current plot remains primary
  - convoy/claim marker is visual-only on a route leaving the plot edge
  - second plot appears as a separate card/map node until a real second plot scene exists
- If the second plot becomes enterable:
  - add plot selector/state scope
  - add per-plot scene state
  - decide whether each plot has its own pads/buildings/jobs or a shared world view
  - update pick targets so clicking a visual-only convoy cannot mutate claim state

Tests needed:

- Engine: cannot claim without a collected Scout Report and approval.
- Engine: claim idempotency and no duplicate second plot creation.
- HTTP: second plot appears only after canonical claim completion.
- Scene-state: convoy visual actor/route is visual-only.
- E2E: claim approval path, blocked states, mobile plot switcher, desktop Atlas graph.
- Regression: Atlas read and report comparison remain non-mutating.

### Slice 3: Research Lodge / Doctrines

Goal: introduce strategic divergence without adding too much world simulation.

Canonical gameplay scope:

- Add `RESEARCH_LODGE` or a doctrine panel only when the server owns doctrine state.
- Start with one reversible doctrine or planning-only doctrine, not a sprawling tech tree.
- Doctrines should affect recommendations first; only later should they modify costs/timers/outputs.

Required graphics/icons/UI states:

- Building asset:
  - Research Lodge / Field Lab / Doctrine Table.
- Icons:
  - `building.research_lodge`
  - `action.research`
  - `doctrine.logistics`
  - `doctrine.stewardship`
  - `doctrine.automation_limits`
  - `receipt.research_note`
- UI states:
  - locked
  - available to build
  - research in progress
  - doctrine ready
  - selected doctrine
  - doctrine pending confirmation
  - doctrine reversible vs locked-in
- Atlas states:
  - doctrine branch nodes
  - comparison cards that show tradeoffs, not only "best path"
  - explanation of whether a doctrine is advisory-only or engine-mutating

Safe as editor/generated/advisory:

- Doctrine icons and descriptions in strategy drafts.
- Atlas "future research" branches.
- Generated concept art for several doctrine lanes.

Needs production art before canonical gameplay:

- Research Lodge building if placeable.
- Doctrine/tech icons for any choices presented as permanent or semi-permanent.
- Receipt visuals for research notes if they become durable records.

Scene-state/Three.js implications:

- Add a researcher/scholar visual-only actor only if a research job exists.
- Otherwise, show building state and Atlas cards, not fake inhabitants.
- If doctrine selection changes future visuals, keep that reskin separate from gameplay truth.

Tests needed:

- Engine/HTTP: doctrine state is server-owned, explicit, and reversible/irreversible as specified.
- Atlas: branch nodes and compare cards show doctrine tradeoffs.
- UI: doctrine cards fit mobile, selected state is unambiguous.
- Non-mutation: advisory doctrine drafts do not alter engine outputs.

### Slice 4: Agent Cohorts / Scoped Work Orders

Goal: group Foreman/inhabitant behavior into bounded work orders while keeping authority clear.

Canonical gameplay scope:

- Define private work-order/cohort schemas that reference existing `et.plot.*` tools.
- Keep each work order scoped by permissions, caps, and receipts.
- Do not introduce a new agent runtime; use the existing browser OpenClaw Lite surface and visible tools.

Required graphics/icons/UI states:

- Icons:
  - `cohort.builder`
  - `cohort.worker`
  - `cohort.scout`
  - `cohort.research`
  - `work_order.collect`
  - `work_order.build`
  - `work_order.scout`
  - `approval.work_order`
  - `receipt.work_order`
- UI states:
  - draft work order
  - awaiting approval
  - active
  - paused
  - blocked by policy
  - blocked by missing resources
  - completed with receipts
  - emergency pause active
- Atlas/OpenClaw Lite states:
  - visible tool palette for cohort scope
  - explanation of allowed tools
  - receipt ledger attached to work-order completion

Safe as editor/generated/advisory:

- Cohort planning cards.
- Generated cohort icons.
- Atlas strategy notes describing a future work order.

Needs production art before canonical gameplay:

- Not necessarily a new actor for v1 if cohorts are UI/control constructs.
- Production art is needed only when cohorts become visible teams in the scene.
- If shown in-scene, use distinct team badges and avoid duplicating existing individual inhabitants in a misleading way.

Scene-state/Three.js implications:

- Do not spawn many fake actors for a cohort unless each actor corresponds to real server-owned work.
- Prefer a single visual-only cohort badge/marker attached to the target building or route.
- Actor pick behavior should inspect the work order, not execute it.
- Existing actor roles may need `cohortId`, `workOrderId`, and receipt refs in `visualActors`.

Tests needed:

- Contract: work-order schema cannot call tools outside its scope.
- Policy: emergency pause and hourly caps override work orders.
- E2E: visible work-order card, approval, blocked state, completion receipts.
- Scene-state: cohort badge/actor remains visual-only and click-safe.

## What Can Stay Advisory vs What Needs Production Art

### Safe as editor/generated/advisory

Use generated or editor-only assets for:

- Strategy Editor custom steps.
- Draft resource gates.
- Future horizon nodes.
- Site comparison thumbnails before claim/founding is canonical.
- Doctrine concepts before doctrine choice mutates engine state.
- Cohort/work-order planning cards before cohorts appear in the scene.
- Generated Universe/reskin previews.
- One-off Atlas explanation visuals.

Rules:

- Mark generated/advisory assets in metadata.
- Keep them out of engine truth.
- Do not let an image imply a cost, unlock, claim, or action that the server does not enforce.
- Prefer global icon IDs even for draft assets so later production art can replace them cleanly.

### Needs production art to become canonical gameplay

Production art should exist before a feature is shipped as canonical, repeated gameplay for:

- Placeable buildings:
  - Expedition Board
  - Research Lodge
  - any second-plot HQ/outpost shell
- Canonical units/actors:
  - scout/pathfinder
  - settler convoy
  - researcher/cohort only if in-scene
- Durable receipts:
  - Scout Report
  - claim receipt
  - research note
  - work-order receipt
- Core UI icons used in canonical Atlas graph nodes and Founders Plot controls.
- New playable scene surfaces, especially second plot or world map views.

Production asset acceptance checklist:

- Brand fit: cozy frontier-tech, warm natural materials, subtle sci-fi, no cyberpunk/metropolis/combat.
- Transparent PNG sprite sheets for actors: 2048x2048, 4x4, metadata JSON, prompt/provenance.
- Building/object assets in the Founders Plot building/object folders with no baked-in text.
- Global icon registry entries in both server and browser registries.
- Mobile and desktop screenshot proof.

## Scene-State and Three.js Projection Requirements

Current projection strengths:

- Server emits `visualActors`.
- Client `scene_state.js` derives objects, actors, ways, routes, encounters, action cues, sprite sheet actions, and pick targets.
- Visual actors are explicitly `visualOnly: true`.
- Existing e2e asserts actor clicks do not change event count.

Requirements for new buildings:

- Add a real asset mapping in `assetForBuilding`.
- Add labels, icon mapping, and Atlas node icon mapping.
- Confirm pad placement, z-depth, and mobile framing.
- Update tests that currently expect Expedition Board to use Workshop art.

Requirements for new actors:

- Add a distinct `canonicalRoleId` only when the engine emits a real visual fact.
- Add sprite sheet metadata and action mapping.
- Keep `generatedOverlayRoleId` honest; do not label a settler as a messenger or worker unless it is explicitly a placeholder.
- Add action cues and animation modes that match role semantics.
- Preserve non-mutating pick behavior.

Requirements for receipts:

- Receipts should be data-first (`scoutReports`, claim records, research notes, work-order receipts).
- Scene objects can show receipt markers, but clicking should inspect the receipt.
- Atlas should link receipt nodes through `receiptRefs`.
- Receipt visuals must not create implied actions that do not exist.

Requirements for second plot/world view:

- Current scene is a single 3x3 Founders Plot. Multi-plot should introduce a plot selector, map/dossier layer, or separate scene state per plot.
- Do not overload the current pad grid with off-map sites.
- Three.js pixel/canvas checks should run on both desktop and mobile once a new scene surface exists.

## Test Coverage Needed

### Current coverage present

- `tests-founders-plot/fp-unit.test.js`
  - HQ3 unlocks `EXPEDITION_BOARD`.
- `tests-founders-plot/fp-http.test.js`
  - canonical graph includes Expedition Board and Scout Report nodes.
  - `FP-HT-013` covers building Expedition Board, dispatching scout, collecting report, persisted report state, Atlas receipt nodes, and `receiptRefs`.
- `tests-founders-plot/fp-scene-state.test.js`
  - `FP-SCENE-004` covers Expedition Board scene object, scout actor, report-ready cue, and current placeholder asset mapping.
- `e2e/114_progression_atlas_openclaw_lite.spec.js`
  - asserts Atlas canonical Expedition Board/scout nodes, Engine Graph node, custom Scout Ridge draft, proposal flow, and non-mutation for strategy saves.
- `e2e/200_founders_plot.spec.js`
  - general Founders Plot page/API/UI loop, but only through early Lumber Camp.
- `e2e/214_founders_plot_threejs_playable_slice.spec.js`
  - Three.js canvas pixel proof and visual-only builder/worker/hauler/messenger behavior, but not scout.

### Add before the next slice ships

Visual-only inhabitants:

- Extend `e2e/214` or add a focused post-HQ3 visual spec that reaches Expedition Board, queues `SCOUT`, waits for active scout, verifies canvas/pick targets, and confirms clicking the scout does not mutate event count.
- Verify report-ready scout cue uses `scout_report_ready`.
- When production scout art lands, assert `assetSrc` and sprite sheet ID point to scout assets, not Rook.

UI cards:

- Browser test for Founders Plot Scout Reports panel:
  - no reports
  - first report card
  - multiple reports
  - long trait/summary text does not overflow mobile
- For Site Dossier, add selected report and compare states.

Atlas graph nodes:

- Add e2e assertions that collected report receipt nodes are visible or inspectable, not only present in API.
- Add tests for updated HQ10 Horizon semantics after Expedition Board is no longer future HQ6.
- Ensure `receiptRefs` remains populated after multiple reports.
- If new lanes become data-driven, test lane grouping does not hide receipt/research/cohort nodes.

Mobile/desktop checks:

- Capture desktop and mobile screenshots for:
  - Founders Plot with active scout
  - report-ready state
  - report card panel
  - Atlas receipt node/report explanation
  - any second-plot or doctrine view
- Keep existing canvas pixel checks for Three.js nonblank rendering.

OpenClaw Lite/tool docs:

- Update Founders Plot skill docs to include `SCOUT` under `queueProduction` or explicitly say queueable job kinds depend on building definitions.
- Add tool/harness coverage that the visible browser agent can read Expedition Board/scout state without inventing unavailable claims.
- If agents can dispatch scouts autonomously, test permission/cap/approval behavior for `SCOUT`.

## Highest-Risk Visual and UX Gaps

1. Horizon mismatch: Atlas still presents "HQ6: Expedition Board" as future, while Expedition Board is now current HQ3 gameplay. This should be fixed before another horizon slice, or players and teammates will see conflicting progression truth.

2. Asset identity blur: Workshop-as-Expedition-Board and Rook-as-scout are acceptable temporary placeholders, but a second post-scout slice will make the world feel borrowed unless proper Expedition Board and scout assets exist.

3. Report-to-claim ambiguity: Scout Reports are currently receipts, not claimable sites. The next slice must clearly separate "site intelligence" from "territory claim" or the player will think a report already owns land.

4. Single-plot scene limits: second settlements cannot be safely represented by stuffing more things into the current 3x3 grid. The product needs a map/dossier layer or a real multi-plot scene contract.

5. Hard-coded Atlas lanes: canonical coverage can miss new receipt/research/cohort nodes unless lane rendering becomes more data-driven or explicitly expanded each slice.

6. Browser-agent docs lag: the in-experience skill still describes `queueProduction` as `PRODUCE` only. That is now stale for Scout Report gameplay.

7. Test placeholders are too specific: `fp-scene-state.test.js` currently asserts Expedition Board uses Workshop and scout uses Rook. That is useful while placeholders are intentional, but those assertions must flip when production art lands.

## Recommended Next Implementation Order

1. Clean up current Scout Report visual debt:
   - real Expedition Board building asset
   - real scout/pathfinder sprite sheet
   - raster icons for Expedition Board, Scout, Scout Report
   - update skill docs for `SCOUT`
   - update e2e/214 to include scout visual-only behavior

2. Ship Site Dossier / Report Comparison:
   - no new territory mutation
   - report details and compare UI
   - Atlas visible receipt nodes
   - generated site thumbnails allowed

3. Promote Settler Convoy / Second Plot Claim:
   - only after claim schema, approval, idempotency, second-plot model, and production convoy/claim assets are ready
   - keep scene projection conservative until second plot has its own surface

4. Add Research Lodge / Doctrines:
   - start with one reversible or advisory doctrine
   - use generated doctrine icons for planning, but production art for any permanent gameplay choice

5. Defer Agent Cohorts / World Grid until the work-order and multi-plot truth boundaries are strong:
   - cohorts can be UI/control first
   - World Grid needs public-safe projection contracts and should not be rushed behind generated visuals

## Bottom Line

The next slice should not be "more mechanics with borrowed art." The Scout Report loop is a good canonical foothold, but it created a new standard: every gameplay slice now needs a graphics and projection plan before implementation. Use generated/editor assets for planning and draft strategy work; use production-quality assets for anything the player can build, dispatch, collect, claim, or treat as durable game truth.
