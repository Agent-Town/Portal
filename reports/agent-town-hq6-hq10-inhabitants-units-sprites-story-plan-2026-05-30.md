# AgentTown HQ6-HQ10 Inhabitants, Units, Sprites, and Story Production Plan

Date: 2026-05-30
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Mode: report-only graphics/story/inhabitant exploration
Source edits: none

## Executive Verdict

HQ10 should feel like the town has grown from a single Founders Plot into a small civilization without losing the cozy frontier-tech center. The implementation lanes need a production asset spine that runs beside engine work:

- HQ6 needs the Settlement Charter lane to make Scout Reports and Site Plans feel official.
- HQ7 needs the first true expansion unit family: settler convoy crew, wagon/pack gear, and a second plot/outpost visual kit.
- HQ8 needs a Research Lodge and a researcher/librarian inhabitant to turn "strategy" into in-world doctrine work.
- HQ9 needs Cohort Hall / work-order visuals and a cohort lead who makes bounded delegation legible.
- HQ10 needs World Grid / civic-layer visuals and a courier-oracle adjunct that connects routes, receipts, and long-memory strategy.

Do not ship the next two gameplay slices with only symbol icons and role reuse. Current placeholders are acceptable for internal proof, but the HQ10 path Robin wants depends on graphics/frontend, new inhabitants, new units, sprites, and story.

## Current Asset and Code Facts

Inspected surfaces:

- `public/experiences/founders-plot/assets/buildings/`
- `public/experiences/founders-plot/assets/characters/`
- `public/experiences/founders-plot/scene_state.js`
- `public/experiences/founders-plot/founders-plot.js`
- `server/agent_town_icons.js`
- `public/agent-town-icons.js`
- `server/founders_plot/progression_atlas.js`
- recent reports under `reports/`

Current reusable production-ish building assets:

- `hq-lv1.webp` through `hq-lv5.webp`
- `lumber-camp.webp`
- `farm-plot.webp`
- `quarry.webp`
- `workshop.webp`
- `market-stall.webp`
- `empty-lot.webp`
- `locked-lot.webp`

Current reusable inhabitants:

- Clover: guide/foreman/oracle-adjacent UI presence with state portraits.
- Rigger Slate: builder/construction visual.
- Kettle-37: worker/production/sell visual.
- Oona Tallpack: hauler/output-ready visual.
- Rook Signalpost: messenger/approval/reward/quest visual.

Current important placeholders:

- `EXPEDITION_BOARD` maps to `workshop.webp` in `scene_state.js`.
- `scout` maps to Rook's messenger sprite sheet.
- `building.expedition_board`, `action.scout`, `receipt.scout_report`, and `planning.site_plan` exist in the global icon registry, but are symbol-only.
- HQ6-HQ10 are advisory `future_placeholder` Atlas milestones, while current canonical gameplay truth is HQ1-HQ5 plus the HQ3 Expedition Board / Scout Report / Site Plan bridge.

## Required Building Assets, HQ6-HQ10

### HQ6: Settlement Charter

System meaning: Scout Reports and Site Plans become reviewed settlement candidates, still without accidentally creating territory.

Production building/prop assets:

- `settlement-charter-board.webp`: civic notice board with parchment maps, stamped site-plan clips, brass receipt pins, and a small cyan readout.
- `charter-table.webp` or scene prop: roll-out map table for report comparison and plan review.
- `site-plan-dossier.webp`: reusable no-text visual for Site Plan cards and Atlas detail panels.

Placeholder status:

- Site Plans are currently CSS cards and `planning.site_plan` symbol icons.
- Rook can surface plan-review approvals, but there is no charter visual.

Production need:

- Treat this as the first "civic paperwork is gameplay" art moment. It should look tangible and official: stamps, ribbons, map pins, ledger tabs, and warm lamp light, not a plain admin UI.

Suggested paths:

- `public/experiences/founders-plot/assets/buildings/settlement-charter-board.webp`
- `public/experiences/founders-plot/assets/objects/site-plan-dossier.webp`
- `public/assets/icons/agent-town/settlement-charter-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/site-plan-gpt-image-2-v1.png`

### HQ7: Second Plot / Outpost

System meaning: player explicitly founds or claims a second plot from a reviewed site.

Production building/prop assets:

- `outpost-marker.webp`: claim stake, small flag, tripod beacon, rope boundary markers.
- `second-plot-hq-lv1.webp`: small outpost core distinct from main HQ, less developed, with a frontier-tech beacon.
- `settler-convoy-wagon.webp`: wagon/cart visual for Founders Plot scene and transition cards.
- Site-type thumbnails: woodland ridge, river flat, stone outcrop, old trail signal, fertile plain.

Placeholder status:

- No second plot, claim, territory reservation, route, or settler convoy exists yet.
- Current Site Plans explicitly say they are not claims.

Production need:

- Make "claim" visually separate from "plan." A Site Plan is parchment; a claim is a physical stake/marker and convoy arrival. The outpost should be humble, optimistic, and visibly founded by the player, not a duplicate HQ.

Suggested paths:

- `public/experiences/founders-plot/assets/buildings/outpost-core-lv1.webp`
- `public/experiences/founders-plot/assets/objects/outpost-marker.webp`
- `public/experiences/founders-plot/assets/objects/settler-convoy-wagon.webp`
- `public/assets/icons/agent-town/unit.settler_convoy-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/building.outpost_core-gpt-image-2-v1.png`

### HQ8: Research Lodge

System meaning: doctrines and tech choices make towns diverge strategically.

Production building/prop assets:

- `research-lodge.webp`: frontier lodge/library with brass observatory tubes, warm shelves, map drawers, and subtle cyan analytical instruments.
- `doctrine-slate.webp`: reusable no-text doctrine card backing.
- `research-table.webp`: table prop with samples from wood/stone/food routes and a small assistant terminal.

Placeholder status:

- Research/doctrines are future placeholder nodes only.
- Workshop buff currently carries the closest "technology" feel, but it is not doctrine identity.

Production need:

- Research should look like careful stewardship, not sterile lab tech. The Research Lodge is where the player learns to choose what kind of civilization they are building.

Suggested paths:

- `public/experiences/founders-plot/assets/buildings/research-lodge.webp`
- `public/experiences/founders-plot/assets/objects/doctrine-slate.webp`
- `public/assets/icons/agent-town/building.research_lodge-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/doctrine.logistics-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/doctrine.stewardship-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/doctrine.automation_care-gpt-image-2-v1.png`

### HQ9: Cohort Hall / Work Orders

System meaning: scoped agent teams and inhabitants execute bounded work orders with receipts, caps, approvals, and idempotency.

Production building/prop assets:

- `cohort-hall.webp`: guildhall / dispatch room with assignment board, tokens for Rigger/Kettle/Oona/Rook/scout/researcher, and a visible approval ledger.
- `work-order-board.webp`: modular board with slots, tags, resource chips, and receipt clips.
- `cohort-token-set.webp`: small tokens/badges for cohort membership.

Placeholder status:

- Foreman permissions exist, but no cohort/work-order UI or building visual exists.
- Current global icon `permission.queueProduction` covers the first Foreman delegation gate only.

Production need:

- This lane must visually distinguish "delegation with boundaries" from "automation runs everything." Cohort Hall should look like a staffed planning room, not a control panel.

Suggested paths:

- `public/experiences/founders-plot/assets/buildings/cohort-hall.webp`
- `public/experiences/founders-plot/assets/objects/work-order-board.webp`
- `public/assets/icons/agent-town/building.cohort_hall-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/work_order.collect-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/work_order.build-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/work_order.scout-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/work_order.research-gpt-image-2-v1.png`

### HQ10: World Grid / Civic Layer

System meaning: multiple settlements connect into public works, civic projects, long-term Oracle memory, and generated visual overlays while gameplay truth remains server-owned.

Production building/prop assets:

- `world-grid-spire.webp`: civic beacon/spire with warm wood/brass base and subtle cyan route lattice.
- `civic-map-table.webp`: wide map table for cross-plot routes, public works, and receipts.
- `route-beacon.webp`: small prop for connected plots.
- `oracle-kiosk.webp`: compact civic-oracle adjunct station, not a mystical altar and not a model dashboard.

Placeholder status:

- World Grid exists only as the HQ10 horizon milestone.
- No civic mutation tools, world-grid projection contracts, or public-safe visuals exist yet.

Production need:

- The World Grid is the first glimpse of the larger AGI story. It should feel civic, careful, and hopeful: lantern-lit routes, town seals, public works, receipts, and quiet intelligence. Avoid cyberpunk cities, combat maps, surveillance walls, or chrome sci-fi.

Suggested paths:

- `public/experiences/founders-plot/assets/buildings/world-grid-spire.webp`
- `public/experiences/founders-plot/assets/objects/civic-map-table.webp`
- `public/experiences/founders-plot/assets/objects/route-beacon.webp`
- `public/assets/icons/agent-town/world_grid.route-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/civic.project-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/oracle.memory-gpt-image-2-v1.png`

## New Units, Inhabitants, and Stories

### Settler / Convoy Crew

Role IDs:

- `settler`
- `convoy`
- `convoy_crew`

Story:

- The convoy crew are the first inhabitants who leave the original safety of Founders Plot to found another place. They are practical, hopeful, and visibly prepared: rolled site plans, packed seed crates, survey rods, water barrels, and a little cyan route beacon.

Relationship to existing cast:

- Clover reviews the risk and asks for approval before the convoy leaves.
- Rigger helps brace the wagon and mark the outpost frame.
- Kettle prepares tools, replacement parts, and simple food-processing gear.
- Oona loads supplies and becomes the emotional bridge between hauling and settlement logistics.
- Rook carries the signed charter and return receipt.

Production notes:

- This should read as a small team or wagon unit, not one hero character. Sprite can focus on a lead settler plus wagon silhouette if the renderer only supports one actor sprite.
- Avoid "covered wagon western cliche" as the whole identity; add subtle route beacon, stamped Site Plan tube, and frontier-tech signal pennant.

### Scout / Pathfinder

Role IDs:

- `scout`
- `pathfinder`

Story:

- The pathfinder is the first person/agentfolk who goes beyond the plot edge and returns with site intelligence. They are not Rook. Rook handles official messages; the pathfinder reads terrain.

Relationship to existing cast:

- Clover asks the pathfinder what the site means for strategy.
- Rigger trusts their survey markers for build feasibility.
- Kettle reads mineral/soil samples they bring back.
- Oona coordinates return loads.
- Rook receives the final report and posts it at the Settlement Charter board.

Production notes:

- Highest-priority new character. Current scout role already exists in `scene_state.js`, but points to Rook. Replace the placeholder with a dedicated scout sheet once generated.
- Silhouette anchors: hood/hat brim, compass staff, rolled map, small cyan rangefinder, light pack.

### Researcher / Librarian

Role IDs:

- `researcher`
- `librarian`
- `doctrine_keeper`

Story:

- The researcher/librarian is the caretaker of memory, doctrine, and long-horizon choices. They turn Scout Reports, Site Plans, Workshop prep, and player goals into named doctrines.

Relationship to existing cast:

- Clover frames tradeoffs in plain language.
- Rigger brings construction constraints.
- Kettle brings experiments and samples.
- Oona brings lived logistics: what is heavy, far, or fragile.
- Rook archives doctrine approvals and revision receipts.

Production notes:

- Should be adult-coded and competent; avoid wizard/mage language. Think frontier librarian-engineer with field notebooks, sample drawers, and a small analytical lens.

### Cohort Lead

Role IDs:

- `cohort_lead`
- `work_order_lead`
- `dispatch_lead`

Story:

- The cohort lead makes delegation legible. They assign bounded crews, check caps, make sure every work order has a receipt, and stop the line when approval is missing.

Relationship to existing cast:

- Clover remains the player's trusted guide; the cohort lead handles team execution.
- Rigger/Kettle/Oona/Rook become assignable cohort members instead of isolated visual roles.
- The pathfinder and researcher become specialized cohort members.

Production notes:

- Visual identity: calm clipboard/ledger captain, token board, brass whistle or signal wand, no military officer/combat framing.

### Civic Courier / Oracle Adjunct

Role IDs:

- `civic_courier`
- `oracle_adjunct`
- `grid_courier`

Story:

- This is the HQ10 connective tissue: a civic courier who carries cross-plot receipts and also helps the Oracle remember why decisions were made. It is not the main Oracle, and it is not replacing Clover. It is the keeper of routes, public works notes, and long-memory handoffs.

Relationship to existing cast:

- Clover explains meaning and trust.
- Rook handles local notices; the civic courier handles inter-settlement routes and public receipts.
- The researcher/librarian depends on the courier's memory packets.
- The cohort lead depends on the courier for cross-plot work-order boundaries.

Production notes:

- Keep subtle sci-fi: route-lattice satchel, glowing civic seal, brass/canvas relay pole. Avoid cyberpunk courier, black ops, drone swarm, or AI priest.

## Sprite Sheet Requirements

Current `scene_state.js` compatibility facts:

- Sprite sheets are PNG, 2048x2048, 4 columns x 4 rows.
- Each frame is 512x512.
- Runtime expects metadata with `id`, `role`, source/image paths, `layout`, `frame`, `actions`, and `actionMapping`.
- `scene_state.js` currently emits `assetSprite` with `columns: 4`, `rows: 4`, `frameWidth: 512`, `frameHeight: 512`.
- Default action rows are:
  - `idle`: row 0, frames `[0,1,2,3]`, 3 fps
  - `walk`: row 1, frames `[0,1,2,3]`, 6 fps
  - `work`: row 2, frames `[0,1,2,3]`, 6 fps
  - `ready`: row 3, frames `[0,1,2,3]`, 4 fps

Required naming convention:

- Character/unit sheet: `{slug}-{role}-v1.png`
- Source sheet: `{slug}-{role}-v1.source.png`
- Metadata: `{slug}-{role}-v1.json`
- Prompt/provenance: `{slug}-{role}-v1.prompt.md`

Suggested paths:

- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/researcher/research-librarian-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/cohort/cohort-lead-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/civic/oracle-adjunct-courier-v1.png`

Recommended role action mappings:

| Role | Row 0 | Row 1 | Row 2 | Row 3 | Action mapping |
| --- | --- | --- | --- | --- | --- |
| `scout` / `pathfinder` | idle | depart/walk | survey | report-ready | `SCOUT: walk`, `SURVEY: work`, `SCOUT_REPORT_READY: ready`, `OUTPUT_READY: ready` |
| `settler` / `convoy` | idle | travel | found/claim | settled-ready | `SETTLER_CONVOY: walk`, `CLAIM_SITE: work`, `FOUND_OUTPOST: work`, `OUTPUT_READY: ready` |
| `researcher` | idle | walk | study/research | doctrine-ready | `RESEARCH: work`, `DRAFT_DOCTRINE: work`, `DOCTRINE_READY: ready` |
| `cohort_lead` | idle | patrol/walk | assign/work-order | blocked/ready | `WORK_ORDER: work`, `ASSIGN_COHORT: work`, `APPROVAL: ready`, `BLOCKED: ready` |
| `civic_courier` / `oracle_adjunct` | idle | route/walk | relay/civic-work | receipt-ready | `CIVIC_ROUTE: walk`, `RELAY_RECEIPT: work`, `ORACLE_MEMORY: work`, `CIVIC_RECEIPT_READY: ready` |

Metadata requirements:

- Include `role`, `character` or `displayName`, `sourceImage`, `image`, `sourceSize`, `frame`, `layout`, `actions`, `actionMapping`, `origin`, `promptFile`, `styleReference`, and `transparency`.
- Keep `role` aligned with `canonicalRoleId` values that `scene_state.js` will map.
- Keep `actionMapping` uppercase for engine job/action names.
- Use transparent PNG output after chroma-key cleanup; current assets use magenta key source and alpha final.
- Validate dimensions and alpha corners before integration.

Scene-state integration requirement:

- Add new roles only when the engine emits corresponding `visualActors`.
- Until then, sprite sheets can be generated and reported as asset-ready, but should not imply gameplay authority.
- When replacing placeholders, the first low-risk integration is:
  - map `scout` from Rook to `pathfinder-scout-v1`
  - keep `generatedOverlayRoleId` unchanged if needed for backward compatibility
  - preserve visual-only status for all scene actors

## Atlas and Global Icon IDs Needed

Already present in global registry:

- `building.hq`
- `building.lumber_camp`
- `building.farm_plot`
- `building.quarry`
- `building.expedition_board` (symbol-only)
- `building.workshop` (symbol-only)
- `building.market_stall` (symbol-only)
- `resource.wood`
- `resource.food`
- `resource.stone`
- `resource.coin` (symbol-only)
- `resource.xp` (symbol-only)
- `hq.upgrade`
- `permission.queueProduction`
- `action.construct`
- `action.produce`
- `action.scout` (symbol-only)
- `action.collect`
- `receipt.scout_report` (symbol-only)
- `planning.site_plan` (symbol-only)

Add raster assets or new IDs for near-term HQ6-HQ10:

Buildings:

- `building.settlement_charter`
- `building.outpost_core`
- `building.research_lodge`
- `building.cohort_hall`
- `building.world_grid_spire`

Units:

- `unit.scout`
- `unit.pathfinder`
- `unit.settler_convoy`
- `unit.researcher`
- `unit.cohort_lead`
- `unit.civic_courier`
- `unit.oracle_adjunct`

Actions:

- `action.review_site_plan`
- `action.promote_charter`
- `action.claim_site`
- `action.found_outpost`
- `action.research`
- `action.draft_doctrine`
- `action.assign_cohort`
- `action.run_work_order`
- `action.route_world_grid`
- `action.start_civic_project`

Receipts and planning records:

- `receipt.charter_review`
- `receipt.site_claim`
- `receipt.outpost_founded`
- `receipt.doctrine`
- `receipt.work_order`
- `receipt.civic_project`
- `receipt.world_grid_route`
- `planning.site_dossier`
- `planning.claim_candidate`

Doctrines:

- `doctrine.logistics`
- `doctrine.stewardship`
- `doctrine.craft_efficiency`
- `doctrine.food_security`
- `doctrine.quarry_survey`
- `doctrine.bounded_automation`

Work orders:

- `work_order.collect`
- `work_order.build`
- `work_order.scout`
- `work_order.research`
- `work_order.sell`
- `work_order.route`

World Grid / civic:

- `world_grid.route`
- `world_grid.node`
- `world_grid.public_work`
- `world_grid.civic_layer`
- `civic.project`
- `civic.receipt`
- `oracle.memory`
- `oracle.strategy_revision`

Site and risk icons:

- `site.woodland_ridge`
- `site.river_flat`
- `site.stone_outcrop`
- `site.old_trail_signal`
- `site.fertile_plain`
- `trait.wood_rich`
- `trait.food_rich`
- `trait.stone_rich`
- `trait.low_risk`
- `trait.requires_approval`
- `risk.low`
- `risk.medium`
- `risk.high`

Implementation note:

- Add IDs to both `server/agent_town_icons.js` and `public/agent-town-icons.js` when implementing. Keep IDs stable and lowercase dot-separated. Attach `assetFile` only after the PNG exists.

## Frontend States That Need Visuals

Founders Plot side panels:

- Scout Reports: empty, loading, one report, multiple reports, selected report, report already has Site Plan, report blocked from claim.
- Site Plans: empty, draft available, drafted, ready for charter review, blocked because claim rules do not exist, promoted to claim candidate.
- Settlement Charter: no reviewed plans, review pending, approval needed, approved, rejected/revise, blocked by missing scout/site-plan state.
- Convoy: not available, requirements missing, ready to dispatch, awaiting approval, traveling, arrived, failed/blocked, second plot created.
- Research Lodge: no doctrines, doctrine available, researching, doctrine ready, doctrine active, doctrine conflict, doctrine revert/replace.
- Cohort Hall: no cohorts, draft work order, missing members, approval required, running, paused, complete, receipt ready, blocked by policy cap.
- World Grid: no second plot, routes unavailable, route draft, civic project draft, public-safe projection loading, generated overlay disabled, civic receipt ready.

Progression Atlas states:

- HQ6-HQ10 future milestone locked by current canonical cap.
- Future placeholder vs canonical implemented state.
- Strategy proposal vs engine-owned node.
- Icon raster loaded vs symbol fallback.
- Empty icon/asset missing state that does not create blank tiles.
- Loading/error state for Atlas iframe and state fetch.
- Blocked action refs with clear boundary copy.
- Work-order graph with pending/approved/running/receipt statuses.
- World Grid map projection: empty, loading, no routes, one route, multi-route, public-safe redacted.

Scene states:

- Dedicated scout leaving, surveying, returning with report.
- Settlement Charter review cue at board.
- Convoy at HQ, convoy on route, convoy arrived at outpost.
- Researcher studying at Research Lodge, doctrine ready.
- Cohort Lead assigning tokens at Cohort Hall, blocked/approval cue.
- Civic courier moving between route beacons, civic receipt ready.

Blocked/empty visual rule:

- Empty states should still show a tangible object: blank report rack, empty charter board, covered wagon still in camp, closed research ledger, unassigned work-order board, dim World Grid table.
- Blocked states should use warm amber/rust signals and receipt/approval language, not danger alarms unless an action is destructive.

## GPT-Image Prompt Guidance

Global brand direction:

- Cozy frontier-tech.
- Warm natural palette: sun-bleached wood, cream parchment, sandstone, brass, leather, canvas, worn paint.
- Subtle sci-fi: small cyan/teal readouts, route beacons, circuit inlays, soft analytical glows.
- 70% frontier / 30% subtle sci-fi.
- Friendly, adult-coded, storybook strategy game, not mascot-childlike.
- No logos, no readable text, no brand marks, no modern UI screenshots.
- No cyberpunk, chrome megacity, neon noir, combat, guns, soldiers, war rooms, surveillance walls, dystopia, fantasy magic, or model-provider dashboard aesthetics.

Building prompt template:

```text
Agent Town cozy frontier-tech building asset, [BUILDING NAME AND FUNCTION], warm storybook city-builder style, sun-bleached wood, brass fittings, canvas, parchment, sandstone, worn teal accents, subtle cyan agent-tech inlays, golden-hour lighting, 3/4 isometric-ish front view, transparent or clean cutout-friendly background, no readable text, no logos, no combat, no cyberpunk, no chrome sci-fi, no fantasy magic, no people in foreground, matches Founders Plot warm frontier settlement art.
```

Sprite prompt template:

```text
Agent Town inhabitant sprite sheet, [CHARACTER NAME], adult-coded [ROLE], cozy frontier-tech storybook style, compact readable game silhouette, 4 columns by 4 rows, exact rows: idle, walk/travel, role work action, ready/receipt action, full body centered in every 512x512 frame, consistent character design across all 16 frames, warm natural palette with brass/leather/canvas/wood and subtle cyan agent-tech detail, flat magenta #ff00ff chroma-key background, no text, no logos, no weapons, no combat, no childlike mascot proportions, no cyberpunk.
```

Icon prompt template:

```text
Agent Town global game icon, [ICON SUBJECT], square framed strategy icon, warm frontier-tech, parchment/wood/brass material language, subtle teal/cyan intelligent-system accent, readable at small size, centered object silhouette, no letters, no readable text, no logos, no cyberpunk, no combat, no photorealism, matches existing Agent Town global icon pack.
```

Receipt/card prompt template:

```text
Agent Town reusable receipt/card asset, [SCOUT REPORT / SITE PLAN / DOCTRINE / WORK ORDER / CIVIC RECEIPT], blank no-text parchment object with brass clip, map pins or ledger tabs, warm frontier-tech storybook game UI prop, subtle cyan validation seal, clean edges, no readable text, no logos, no modern app UI, no cyberpunk.
```

## Immediate Asset Priorities for Next Two Slices

### Slice A: Site Dossier / Settlement Charter Foundation

Highest-priority assets:

1. Dedicated Scout/Pathfinder sprite sheet.
2. Expedition Board building asset to replace Workshop reuse.
3. Scout Report receipt raster icon and no-text report card prop.
4. Site Plan dossier icon/prop.
5. Settlement Charter board/prop for HQ6 review framing.

Why first:

- These fix the current visible prototype debt: Expedition Board and scout are already canonical, but still use Workshop and Rook placeholders.
- Site Plans are now canonical planning truth, so they need a stronger visual identity before claims make the lane busier.

Implementation lane fed by these assets:

- Replace `EXPEDITION_BOARD` building art.
- Replace `scout` sprite mapping from Rook to pathfinder.
- Add raster-backed global icons for `building.expedition_board`, `action.scout`, `receipt.scout_report`, and `planning.site_plan`.
- Add report/dossier empty, selected, and blocked visuals in Founders Plot and Atlas.

### Slice B: Settler Convoy / Second Plot Claim

Highest-priority assets:

1. Settler Convoy crew sprite sheet or wagon/unit sheet.
2. Outpost marker prop.
3. Outpost core level 1 building.
4. Claim Site / Found Outpost / Settler Convoy global icons.
5. Claim receipt / charter review receipt icon.

Why second:

- The moment the engine can create a second plot, the player needs a clear story beat and visual proof that something irreversible happened.
- A convoy unit gives frontend, scene_state, Atlas, and story teams one shared object to build around.

Implementation lane fed by these assets:

- Add `unit.settler_convoy` and eventual `canonicalRoleId: settler` / `convoy`.
- Add explicit UI states for ready, awaiting approval, traveling, arrived, blocked, and outpost created.
- Add Atlas claim/founding nodes with stable icon IDs and receipt visuals.

## Production Checklist

- Keep gameplay authority separate from visuals: assets can exist before engine promotion, but UI copy must not imply unimplemented powers.
- Every new canonical role should have a sprite sheet, JSON metadata, prompt provenance, and dimension/alpha validation.
- Every new canonical building/action/receipt should have a global icon ID before Atlas UI work.
- Every placeholder replacement should include a regression check for `scene_state.js` actor role, `assetSrc`, `assetSprite.id`, and action mapping.
- Every new frontend panel should include empty, loading, blocked, running, complete, and receipt-ready states.

## Recommended Hand-Off

For the next production meeting, split work into four lanes:

- Graphics lane: generate and validate Expedition Board, scout, Scout Report, Site Plan, Charter Board.
- Frontend lane: add report/dossier/charter visual states without adding claim gameplay.
- Scene-state lane: prepare role mappings for `scout`, then later `settler`, `researcher`, `cohort_lead`, `civic_courier`.
- Story lane: write short in-world intros for Pathfinder, Convoy Crew, Research Librarian, Cohort Lead, and Civic Courier, each tied to Clover/Rigger/Kettle/Oona/Rook.

The clean next move is not more abstraction. It is finishing the expedition/charter art spine so HQ6-HQ10 can stop feeling like a planning document and start feeling like the town is actually growing.
