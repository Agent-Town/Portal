# AgentTown Functional Building Inhabitants Production Matrix

Date: 2026-05-31
Repo: `/Users/robin/Projects/Portal-atlas-editor`
Branch observed: `neo/progression-atlas-editor-next-2026-05-29`
Mode: report-only audit and production lane contract
Source edits: none

## Decision To Encode

Every AgentTown building or surface that provides gameplay functionality should have an associated inhabitant, crew, or operator. The role does not need to own gameplay authority. It should follow the Founders Plot visual-only production process already used for:

- Construction: Rigger Slate builder.
- Production: Kettle-37 worker.
- Output-ready collection: Oona Tallpack hauler.
- Notifications, approvals, rewards, and quests: Rook Signalpost messenger.
- Expedition Board scouting: Pathfinder Scout.

The inhabitant/crew/operator lane is a visual and story contract layered over server-owned gameplay truth. It must not add hidden mechanics, autonomy, mutation paths, or authority.

## Agent / Robot Mix Rule

Robin explicitly wants the character mix to include a sufficient amount of agents and robots, not only human-coded frontier townsfolk. Default production rule:

- Any new multi-character batch of three or more roles should include at least one visibly agentic, robotic, synthetic, or construct-like character unless there is a clear story reason not to.
- The long-term Founders Plot roster should trend toward roughly one-third agent/robot/synthetic characters, while still feeling cozy, civic, and inhabited.
- Agent/robot characters should read as neighbors, operators, assistants, couriers, coordinators, researchers, or civic machine-people, not as sterile drones, weapons, surveillance devices, or faceless automation.
- Their presence should reinforce the main AgentTown theme: humans and agents building together under receipts, consent, memory, and bounded authority.

## Audit Sources

Inspected:

- `server/founders_plot/engine.js`
- `server/founders_plot/progression_atlas.js`
- `public/experiences/founders-plot/scene_state.js`
- `public/experiences/founders-plot/founders-plot.js`
- `public/agent-town-icons.js`
- `server/agent_town_icons.js`
- `public/experiences/founders-plot/assets/`
- `public/assets/icons/agent-town/`
- `reports/agent-town-hq6-hq10-inhabitants-units-sprites-story-plan-2026-05-30.md`
- `reports/agent-town-hq6-hq7-production-asset-pack-prompt-spec-2026-05-30.md`
- `reports/agent-town-pathfinder-scout-sprite-integration-2026-05-31.md`
- `reports/agent-town-hq3-hq10-image-assets-integration-2026-05-31.md`

## Current Code Facts

Engine functional buildings in `BUILDING_DEFS`:

| Building type | Unlock | Function | Current visual operator |
| --- | ---: | --- | --- |
| `LUMBER_CAMP` | HQ1 | Produces wood; upgradeable | Generic construction/production/output roles: Rigger, Kettle, Oona |
| `FARM_PLOT` | HQ1 | Produces food; upgradeable | Generic Kettle/Oona roles, no farm-specific inhabitant |
| `QUARRY` | HQ2 | Produces stone; upgradeable | Generic Kettle/Oona roles, no quarry-specific inhabitant |
| `EXPEDITION_BOARD` | HQ3 | Queues `SCOUT`, creates Scout Report receipt | Dedicated `scout` role now uses `pathfinder-scout-v1` |
| `WORKSHOP` | HQ4 | Produces next-build buff effect | Generic Kettle/Oona roles, no workshop specialist |
| `MARKET_STALL` | HQ5 | Sells food for coin | Generic worker path, no trader |

Functional non-placeable or near-placeable surfaces:

- Settlement Charter / Site Plan Review: implemented through Site Plan review and claim-ready planning state. It has board/document art, but no clerk/cartographer role.
- Settler Convoy / Outpost: implemented as server-owned settlement claims, convoy jobs, and founded outpost records. The engine emits `canonicalRoleId: "settler"` for active claims, but `scene_state.js` does not yet define a `settler` sprite sheet, offsets, cues, or action mapping.
- Research Lodge: implemented as an HQ6+founded-outpost doctrine read model and `survey_discipline` effect. No physical building requirement, but Research Lodge building art exists and UI card art uses it. No researcher role.
- Cohort Hall / Work Orders: implemented as server-owned work-order templates, drafts, and the `collect_ready_outputs_once` executor. Cohort Hall is an Atlas/icon surface, not a physical scene building. No coordinator role.
- World Grid: horizon/canonical strategy layer only. No mutation tools, physical scene object, icon set, or inhabitant yet.

Existing inhabitant sheets:

| Role | Asset | Status |
| --- | --- | --- |
| `builder` | `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.png` | Integrated |
| `worker` | `public/experiences/founders-plot/assets/characters/inhabitants/worker/kettle-37-worker-v1.png` | Integrated |
| `hauler` | `public/experiences/founders-plot/assets/characters/inhabitants/hauler/oona-tallpack-hauler-v1.png` | Integrated |
| `messenger` | `public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.png` | Integrated |
| `scout` | `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png` | Integrated |

Existing scene/card/icon assets relevant to this lane:

- Building assets: `lumber-camp.webp`, `farm-plot.webp`, `quarry.webp`, `expedition-board.webp`, `workshop.webp`, `market-stall.webp`, `settlement-charter-board.webp`, `research-lodge.webp`, `outpost-core-lv1.webp`.
- Object assets: `scout-report-dossier.webp`, `site-plan-dossier.webp`, `claim-ready-plan.webp`, `reviewed-plan-stamp.webp`, `settler-convoy-wagon.webp`, `convoy-route-map.webp`, `outpost-marker.webp`, `settlement-claim-manifest.webp`, `second-plot-founded-receipt.webp`, `cohort-work-order-dossier.webp`.
- Icon gaps still visible in current registries: `building.workshop`, `building.market_stall`, `resource.coin`, `action.construct`, `action.produce`, and `action.collect` are symbol-only. This report focuses on inhabitants, but those should be captured in a later icon polish pass.

## Production Matrix

| Functional surface | Gameplay function | Role ID | Existing asset | Missing sprite sheet | Prompt brief | Integration path | Tests/proof required |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `LUMBER_CAMP` | Wood production and first collection loop | `lumber_worker` / keep current `worker`, `hauler`, `builder` aliases | Building/icon exist; Rigger, Kettle, Oona integrated | Optional dedicated lumber worker; not required for current baseline | Adult-coded frontier lumber camp hand, sawbuck/wood apron, safe tools, warm frontier-tech, no readable text | If produced, add `inhabitants/lumber_worker/`, `ACTOR_SPRITE_SHEETS.lumber_worker`, map Lumber Camp `PRODUCE` to role in engine projection or metadata contract | Sprite alpha/contact sheet; scene proof for construction, produce, output-ready; `fp-scene-state` role mapping test |
| `FARM_PLOT` | Food production loop | `farmer` / `grower` | Farm building/icon exists; generic Kettle/Oona currently cover action | `farmer-grovehand-v1` | Cozy frontier-tech farm operator with seed satchel, watering can/tool belt, tiny cyan soil sensor; rows idle/walk/tend/harvest-ready | Add `ACTOR_SPRITE_SHEETS.farmer`; add engine/scene contract mapping `FARM_PLOT` `PRODUCE` to farmer and `OUTPUT_READY` to hauler or farmer-ready | Contact sheet; farm produce screenshot; scene-state unit test asserting `FARM_PLOT` active job can choose farmer |
| `QUARRY` | Stone production loop | `quarry_mason` / `stonecutter` | Quarry building/icon exists; generic Kettle/Oona currently cover action | `quarry-mason-v1` | Practical stonecutter with sample chisel, measuring cord, dust apron, small cyan fracture scanner; no weapons or mining danger focus | Add `ACTOR_SPRITE_SHEETS.quarry_mason`; map `QUARRY` `PRODUCE` to mason; keep Oona for output-ready haul | Contact sheet; quarry produce screenshot; unit test for role, assetSrc, action rows |
| `EXPEDITION_BOARD` | Scout job and Scout Report receipt | `scout` / `pathfinder` | `expedition-board.webp`, Scout Report/Site Plan assets, `pathfinder-scout-v1` integrated | None for current scout baseline | Already satisfied; future variants can include advanced surveyor | Current path: `ACTOR_SPRITE_SHEETS.scout` maps `SCOUT` to row `scout`, report-ready to row `ready` | Existing proof: pathfinder checker and integration proof. Maintain `fp-scene-state` tests |
| `WORKSHOP` | Produces next-build buff effect | `workshop_specialist` / `tinkerer` | `workshop.webp`; generic worker/hauler currently cover action; icon is symbol-only | `workshop-specialist-v1` | Frontier-tech tinkerer with brass calipers, compact tool roll, wood/stone sample jig, small cyan tuning light; rows idle/walk/tune/buff-ready | Add `inhabitants/workshop_specialist/`; add sheet mapping `PRODUCE` or `WORKSHOP_TUNE` to work row, `OUTPUT_READY`/`BUFF_READY` to ready row; update visual projection to pick role by building type | Contact sheet; Workshop active job scene proof; output-ready buff scene proof; icon follow-up for `building.workshop` recommended |
| `MARKET_STALL` | Sells food for coin | `trader` / `market_trader` | `market-stall.webp`; generic worker currently covers `SELL`; icon is symbol-only | `market-trader-v1` | Friendly frontier-tech trader with ledger beads, produce crate, coin tray, awning colors, tiny cyan tally light; no readable prices/text | Add `inhabitants/trader/`; map `MARKET_STALL` `SELL` to trader, coin-ready to trader-ready or Oona handoff | Contact sheet; Market `SELL` screenshot; test `SELL` role and row mapping; optional icon pass for `building.market_stall` and `resource.coin` |
| Settlement Charter / Site Plan Review | Review Site Plan into claim-ready planning state | `charter_clerk` / `cartographer_clerk` | `settlement-charter-board.webp`, `settlement-charter-document.webp`, `site-plan-dossier.webp`, `claim-ready-plan.webp` | `charter-clerk-v1` | Clerk/cartographer with rolled maps, stamp pad, brass divider, ledger ribbon, small cyan map pin; rows idle/walk/review/stamp-ready | Add role sheet; project visual actor from review pending/ready Site Plan UI or a visual-only charter surface. Do not add new engine building unless gameplay requires it | Contact sheet; UI proof for unreviewed/reviewed Site Plan card; scene proof only if projected into Three.js; test no new mutation path |
| Settler Convoy | Prepare convoy and timed settlement claim | `settler` / `convoy_crew` | `settler-convoy-wagon.webp`, `convoy-route-map.webp`, `settlement-claim-manifest.webp`; engine already emits `settler` actor | `settler-convoy-crew-v1` | Lead adult-coded settler crew with packed team gear, seed crate, survey rods, water barrel, stamped plan tube, tiny cyan route beacon; rows idle/depart/prepare/arrived-ready | Add `ACTOR_SPRITE_SHEETS.settler`, offsets, cues, action mappings `SETTLER_CONVOY`, `SETTLEMENT_READY`. This closes current invisible-actor risk | Contact sheet; active convoy scene proof; arrived/founded card proof; `fp-scene-state` test for `canonicalRoleId: "settler"` assetSrc and sprite row |
| Outpost / Second Plot | Founded outpost plot and second-settlement receipt | `outpost_keeper` | `outpost-core-lv1.webp`, `outpost-marker.webp`, `second-plot-founded-receipt.webp` | `outpost-keeper-v1` | Frontier outpost keeper with beacon lantern, boundary pins, repair pouch, receipt satchel; humble founding caretaker, not military guard | Add role after plot switching or outpost scene projection exists; map founded outpost visual-only presence to `outpost_keeper` | Outpost card/scene proof; ensure no world map/trade simulation implied; tests for founded outpost visual if scene emits actor |
| Research Lodge | Doctrine selection and `survey_discipline` scout duration effect | `researcher` / `doctrine_keeper` | `research-lodge.webp`; doctrine card currently uses Research Lodge art; doctrine icon currently reuses cohort dossier | `research-librarian-v1` | Researcher/librarian with field notebooks, sample drawers, brass lens, doctrine slate, tiny cyan analysis lamp; rows idle/walk/study/doctrine-ready | Add role sheet; project from Research Lodge doctrine card or future physical surface; optional later `unit.researcher` icon | Contact sheet; doctrine selected UI proof; no-general-research test boundary remains unchanged |
| Cohort Hall / Work Orders | Draft/execute bounded work orders | `cohort_coordinator` / `quartermaster` | `cohort-work-order-dossier.webp`; `building.cohort_hall` icon uses dossier crop; no building asset | `cohort-coordinator-v1` | Prefer an agentic/robotic coordinator: warm civic machine-person with assignment tokens for builder/worker/hauler/scout/researcher, approval ledger, bounded work-order board, and visible receipt slots; not a command-center drone | Add `cohort-hall.webp` later; add role sheet; project from work-order draft/completed states only, not autonomous scheduling | Contact sheet; draft and executed work-order proof; test that Atlas action refs remain metadata-only and executor remains explicit |
| World Grid | Future cross-plot civic/public works layer | `civic_routekeeper` / `oracle_adjunct` | None beyond horizon nodes | `civic-routekeeper-v1` plus World Grid props | Strongly agent/robot-coded civic courier-oracle adjunct with route scrolls, public-works seals, receipt packets, route lantern, and subtle cyan civic lattice; neighborly public-service machine, not a surveillance dashboard | Defer until read model/projection contract exists. Add icons/props first: `world-grid-spire`, `civic-map-table`, `route-beacon`, `oracle-kiosk` | Concept contact sheet first; then read-model proof, routekeeper sprite sheet, scene proof; public-safe projection test required |

## Role Metadata Contract Recommendation

Do not patch source in this shared dirty worktree right now. A small code-only metadata contract is useful, but the relevant files are actively dirty and already carry large gameplay/UI changes:

- `server/founders_plot/engine.js`
- `server/founders_plot/progression_atlas.js`
- `public/experiences/founders-plot/scene_state.js`
- `public/agent-town-icons.js`
- `server/agent_town_icons.js`

Recommended future contract once active UI/UX work stabilizes:

```js
const FUNCTIONAL_SURFACE_ROLES = {
  LUMBER_CAMP: {
    constructionRole: 'builder',
    activeRole: 'worker',
    readyRole: 'hauler',
    productionRoleId: 'wood_worker'
  },
  FARM_PLOT: {
    constructionRole: 'builder',
    activeRole: 'farmer',
    readyRole: 'hauler'
  },
  QUARRY: {
    constructionRole: 'builder',
    activeRole: 'quarry_mason',
    readyRole: 'hauler'
  },
  EXPEDITION_BOARD: {
    constructionRole: 'builder',
    activeRole: 'scout',
    readyRole: 'scout'
  },
  WORKSHOP: {
    constructionRole: 'builder',
    activeRole: 'workshop_specialist',
    readyRole: 'workshop_specialist'
  },
  MARKET_STALL: {
    constructionRole: 'builder',
    activeRole: 'trader',
    readyRole: 'trader'
  },
  SETTLEMENT_CHARTER: {
    surfaceRole: 'charter_clerk'
  },
  SETTLER_CONVOY: {
    activeRole: 'settler',
    readyRole: 'settler'
  },
  OUTPOST: {
    surfaceRole: 'outpost_keeper'
  },
  RESEARCH_LODGE: {
    surfaceRole: 'researcher'
  },
  COHORT_HALL: {
    surfaceRole: 'cohort_coordinator'
  },
  WORLD_GRID: {
    surfaceRole: 'civic_routekeeper'
  }
};
```

This contract should live close to scene projection, not gameplay math. It should be test-covered by `tests-founders-plot/fp-scene-state.test.js` and should not let editor-authored Atlas nodes invent roles or mechanics.

## Prompt Snippets

Use one 2048x2048 4x4 sprite sheet per role unless a role is a prop-only surface. Existing sheet contract is 4 columns x 4 rows, 512px frames, transparent/alpha-cleaned PNG, JSON metadata beside the PNG.

### Workshop Specialist

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512. Adult-coded AgentTown workshop specialist, cozy frontier-tech tinkerer, warm natural palette with tiny cyan tuning light. Brass calipers, compact tool roll, wood and stone sample jig, leather apron, practical goggles pushed up, friendly focused posture. Rows: idle at workbench, walking with tools, tuning/crafting next-build buff with small safe sparks, buff-ready presenting a sealed improvement token. Same scale and style as Rigger/Kettle/Oona/Rook/Pathfinder Scout. No readable text, no weapons, no cyberpunk, no chrome lab, no modern factory.
```

### Market Stall Trader

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512. Adult-coded AgentTown market stall trader, warm frontier-tech merchant with produce crate, coin tray, small ledger beads, canvas apron, subtle cyan tally lamp. Rows: idle welcoming stance, walking with crate, selling/bartering food for coins, coin-ready holding a small receipt pouch. Cozy storybook game sprite, practical and kind. No readable prices or words, no logos, no casino feeling, no cyberpunk, no weapon or military framing.
```

### Settlement Charter Clerk / Cartographer

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512. AgentTown charter clerk and cartographer, adult-coded, warm civic frontier-tech style. Rolled site maps, brass divider, stamp pad, ledger ribbon, parchment tabs, tiny cyan map pin light. Rows: idle reviewing documents, walking with map tube, comparing/stamping Site Plan, claim-ready plan receipt pose. Looks official and careful, not bureaucratic or modern office. No readable text, no logos, no city blueprint, no combat, no cyberpunk.
```

### Research Lodge Researcher

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512. Adult-coded AgentTown research librarian / doctrine keeper, warm lodge-library frontier-tech. Field notebooks, sample drawers, brass magnifier, doctrine slate with abstract marks, tiny cyan analysis lamp. Rows: idle reading field notes, walking with sample tray, studying/comparing doctrine materials, doctrine-ready presenting a sealed insight card. Cozy stewardship mood, not sterile laboratory. No readable text, no mystical wizard, no surveillance screen, no cyberpunk, no combat.
```

### Cohort Hall Coordinator

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512. AgentTown cohort coordinator / quartermaster as a friendly agentic machine-person, warm civic dispatch-room style. Soft mechanical silhouette, expressive face/visor, assignment tokens for builder, worker, hauler, scout, researcher; approval ledger; bounded work-order board; small cyan status bead. Rows: idle at assignment board, walking with token tray, drafting bounded work order, completed receipt-ready pose. Communicates careful delegation with limits, not automation takeover. No readable text, no command center, no military uniform, no cyberpunk.
```

### Settler Convoy Crew

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512. AgentTown settler convoy crew represented by a lead adult-coded frontier-tech settler with small packed team gear. Canvas rolls, seed crate, survey rods, water barrel, stamped site-plan tube, tiny cyan route beacon. Rows: idle with supplies, departing/walking stride, preparing convoy and checking route plan, arrived/founding-ready gesture. Optimistic first-expansion feeling. No weapons, no soldiers, no horses as main identity, no readable text, no logos, no cyberpunk vehicle.
```

### Outpost Keeper

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512. Adult-coded AgentTown outpost keeper, humble frontier-tech caretaker of a new settlement. Beacon lantern, boundary pins, repair pouch, receipt satchel, warm practical clothing, small cyan outpost signal. Rows: idle watchful caretaker, walking patrol with marker pins, maintaining outpost beacon, founded-ready receipt pose. Safe, optimistic, civic. No weapons, no guard/military framing, no fantasy tower, no readable text, no cyberpunk.
```

### Civic Routekeeper / Oracle Adjunct

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512. AgentTown civic routekeeper / oracle adjunct courier as a clearly robotic or synthetic public-service character, keeper of cross-plot receipts and public works memory. Route scrolls, town seals, receipt packets, lantern-lit route staff, subtle cyan civic lattice charm. Rows: idle with route ledger, walking route courier stride, relaying civic receipt/memory packet, public-works ready pose. Hopeful civic intelligence, not surveillance or model dashboard. No readable text, no mystical altar, no chrome sci-fi, no military or combat.
```

## Recommended Generation Batch Order

Default production priority, with one operational caveat: `settler` should be treated as a current visual bug risk because the engine already emits that role and the scene has no sheet for it. If a demo includes HQ7 convoy state, move Settler Convoy Crew into the first batch.

1. `workshop_specialist` - closes the HQ4 Workshop buff identity gap and gives a clear pattern for building-specific operators.
2. `market_trader` - closes HQ5 coin economy identity and avoids generic worker reuse for selling.
3. `charter_clerk` / `cartographer_clerk` - makes HQ6 review/claim-ready planning feel official and supports Settlement Charter as a functional surface.
4. `researcher` / `doctrine_keeper` - makes HQ8 doctrine selection feel inhabited instead of card-only.
5. `cohort_coordinator` - supports HQ9 Work Orders and bounded delegation.
6. `settler` / `convoy_crew` - should jump earlier if HQ7 scene proof is actively required, because current engine projection can emit `settler`.
7. `outpost_keeper` - after the second-plot/outpost view has a stable projection contract.
8. `civic_routekeeper` / `oracle_adjunct` - defer until World Grid read-model and public-safe projection boundaries are specified.

Suggested practical batching:

| Batch | Assets | Why |
| --- | --- | --- |
| Batch A | Workshop Specialist, Market Trader, Settler Convoy Crew | Covers current functional buildings plus the current emitted-but-unwired `settler` role |
| Batch B | Charter Clerk, Researcher, robotic Cohort Coordinator | Covers HQ6-HQ9 functional surfaces already present in UI/Atlas/read models and starts the explicit agent/robot mix |
| Batch C | Outpost Keeper, robotic Civic Routekeeper / Oracle Adjunct, World Grid props | Waits for stable outpost/world-grid projection contracts and makes the agent/robot society legible |

## Image Proof Requirements

For each generated sprite:

1. Persist source and alpha-cleaned output under `public/experiences/founders-plot/assets/characters/inhabitants/<role>/`.
2. Add JSON metadata beside the PNG with id, role, displayName, 4x4 sheet contract, row order, and actionMapping.
3. Save a checkerboard preview under `reports/`.
4. Save a row-strip or contact sheet under `reports/`.
5. Save at least one scene/UI proof screenshot under `reports/` after wiring.
6. Update `tests-founders-plot/fp-scene-state.test.js` for role, `assetSrc`, metadata path, and action row mapping.
7. Run relevant validation:
   - `node --check public/experiences/founders-plot/scene_state.js`
   - `jq empty <new metadata json>`
   - `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js`
   - ImageMagick or equivalent dimension/channel check: 2048x2048 sRGBA, transparent corners after cleanup
   - `git diff --check`

For functional surfaces without scene actors yet:

- Do not fabricate scene proof. Use card/UI proof, Atlas proof, and contact sheets.
- State explicitly that the role is "asset-ready, not gameplay-wired" until the engine/read-model projection exists.

## Integration Guardrails

- All roles are visual-only unless a later gameplay slice explicitly creates server-owned mechanics.
- Role names should not imply abilities the engine does not expose.
- Atlas action refs remain metadata-only unless Founders Plot owns the route and tests.
- Do not let generated art introduce unimplemented actions such as trade routes, territory simulation, automation scheduling, public world-grid mutations, or arbitrary tool execution.
- Keep sprites adult-coded, practical, and consistent with the existing AgentTown frontier-tech style.
- Do not use readable text in generated assets.

## Final Recommendation

Proceed report-first, then generate Batch A. The most useful immediate implementation target after Batch A generation is a small scene-state role mapping pass for:

- `WORKSHOP` active job -> `workshop_specialist`
- `MARKET_STALL` `SELL` job -> `trader`
- settlement claim convoy actor -> `settler`

That pass should be separate from image generation and should include scene-state tests plus proof screenshots. It should not touch engine gameplay math beyond selecting visual roles from already-authoritative building/job/claim state.
