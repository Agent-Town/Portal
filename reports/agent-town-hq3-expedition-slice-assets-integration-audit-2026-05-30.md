# Agent Town HQ3 -> Expedition Slice Assets + Integration Audit

Date: 2026-05-30
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Scope: read-only audit of Founders Plot, Progression Atlas / Engine Graph Studio, tests, and available Founders Plot art/assets.
Change made by this worker: this report only.

## Executive Verdict

The slice can be made to feel real in v1 without a full world map if it is framed as:

**HQ3 reached -> Workshop prep as the last current-game bridge -> Expedition Board proposal/placement -> Scout Report receipt shown in Atlas.**

The current code already has strong foundations:

- Founders Plot engine truth through HQ5, including Workshop at HQ4 and Market at HQ5 (`server/founders_plot/engine.js:29-152`).
- A canonical Atlas read model with nodes, edges, availability, action refs, receipt refs, and future HQ6-HQ10 placeholders (`server/founders_plot/progression_atlas.js:2003-2048`, `2793-2825`).
- HQ6 already named as **Expedition Board** with the desired scout-report direction, but only as advisory future state (`server/founders_plot/progression_atlas.js:73-87`, `2050-2095`).
- Founders Plot already embeds Progression Atlas inside the district modal, not as a standalone town menu (`public/experiences/founders-plot/index.html:30-32`, `92-102`).
- The tests already assert the HQ10/HQ6 horizon and an Engine Graph Studio proposal path for "Expedition Board Proposal" (`e2e/114_progression_atlas_openclaw_lite.spec.js:68-70`, `145-154`).

The main gap is that Expedition Board/scouting has no canonical engine model, no production/job/receipt schema, no building asset, no scout actor, no report visuals, and no specific Atlas icon assets yet. The current v1 should promote only a narrow canonical slice and keep settlement claiming / second plot / world grid advisory.

## Current Gameplay Truth

### HQ and building progression

The current engine truth stops at HQ5:

- HQ1 unlocks Lumber Camp + Farm Plot.
- HQ2 unlocks Quarry.
- HQ3 unlocks `queueProduction`.
- HQ4 unlocks Workshop + `setPriority`.
- HQ5 unlocks Market Stall + `sellSurplusFood`.

Source: `server/founders_plot/engine.js:29-60`.

The current HQ upgrade chain stops at HQ5 (`HQ_UPGRADE_RULES` only has 1->2, 2->3, 3->4, 4->5). Source: `server/founders_plot/engine.js:62-67`.

Existing building model:

- `LUMBER_CAMP`, `FARM_PLOT`, `QUARRY`: normal production loops.
- `WORKSHOP`: consumes wood + stone and yields a next-build buff, not inventory.
- `MARKET_STALL`: sells food for coin.

Source: `server/founders_plot/engine.js:69-152`.

Implication for this requested slice: calling it "after HQ3" is product-correct, but the current actual Workshop prep bridge lives at HQ4. If the parent wants literal **HQ3 -> Workshop prep -> Expedition Board**, the engine rules need either:

- an earlier `WORKSHOP_PREP` / planning-only step unlocked at HQ3, or
- a product copy adjustment: **HQ3 Foreman unlock -> HQ4 Workshop prep -> HQ6 Expedition Board**.

My recommendation for v1: keep canonical engine truth honest and make "Workshop prep" the bridge node after HQ4, while allowing the Atlas to show an HQ3-authored Expedition Board proposal as advisory until promoted.

### Atlas truth boundary

The Atlas currently makes the right distinction:

- Current canonical graph is engine-owned (`canonicalNodes`, `canonicalEdges`, `availabilityByNode`, `actionRefsByNode`, `receiptRefs`).
- HQ6-HQ10 are `future_placeholder` planning nodes, not executable gameplay.
- Atlas action refs are explicitly not executable by Atlas.

Sources:

- `server/founders_plot/progression_atlas.js:16-28` for future systems.
- `server/founders_plot/progression_atlas.js:1026-1128` for future placeholder steps.
- `server/founders_plot/progression_atlas.js:2003-2048` for canonical graph output.
- `tests-founders-plot/fp-http.test.js:483-541` for contract assertions.

For the next slice, Expedition Board should move from `future_placeholder` into canonical graph only when there is server-owned Founders Plot state for it.

## Available Assets

### Can reuse immediately

Founders Plot scene/background:

- `public/experiences/founders-plot/assets/scenes/founders-plot-desktop.webp`
- `public/experiences/founders-plot/assets/scenes/founders-plot-mobile.webp`

Existing building cards:

- HQ levels 1-5.
- Lumber Camp.
- Farm Plot.
- Quarry.
- Workshop.
- Market Stall.
- Empty/locked lot objects.

Paths live under `public/experiences/founders-plot/assets/buildings/` and `public/experiences/founders-plot/assets/objects/`.

Existing characters:

- Clover state portraits/sprites.
- Rigger Slate builder.
- Kettle-37 worker.
- Oona Tallpack hauler.
- Rook Signalpost messenger.

Paths live under `public/experiences/founders-plot/assets/characters/`. The scene adapter already maps actor assets, sprite sheets, routes, encounters, and visual-only flags (`public/experiences/founders-plot/scene_state.js:162-196`, `509-546`, `564-629`).

Existing Atlas icons:

- HQ command.
- HQ upgrade.
- Lumber.
- Farm.
- Quarry.
- Wood/food/stone resources.
- Foreman queue.

Registry: `server/agent_town_icons.js:8-114`. Assets: `public/assets/icons/agent-town/`.

### Missing for this slice

Required to make Expedition Board feel first-class:

- `expedition-board.webp` building asset.
- `scout` or `pathfinder` inhabitant sprite sheet with idle / depart / survey / return-report rows.
- Scout Report UI illustration or parchment receipt visual.
- Atlas icon: `building.expedition_board`.
- Atlas icon: `action.scout`.
- Atlas icon: `receipt.scout_report`.
- Atlas icon: `resource.intel` or `site_report` if the system creates a non-inventory planning output.
- Scene object props: trail marker, map stakes, survey flags, ridge marker, route line.
- Empty state: "No reports yet".
- Active state: "Scout away".
- Ready state: "Scout report returned".
- Blocked state: "Needs Workshop prep / HQ / resources / approval".

Optional but valuable:

- Small scout-report card image variants for site types: woodland, stone ridge, fertile plain, unknown ruin, river crossing.
- Mini map tile placeholders for nearby sites.
- Report stamp/seal overlays for `safe`, `risky`, `requires approval`, `claimed later`.

## Recommended V1 Placeholder Plan

Use existing assets for the first functional pass:

1. **Building placeholder**
   - Reuse `workshop.webp` for Expedition Board placement/proposal, but tint/label it in UI as "Expedition Board".
   - Reason: Workshop already communicates planning/craft prep and is thematically closer than Market Stall.

2. **Scout actor placeholder**
   - Reuse Rook Signalpost messenger as the scout/recon courier for "report returned".
   - Reuse Clover observing/thinking for planning state.
   - Do not reuse Rigger/Kettle/Oona as the primary scout; their job identities are already construction/production/hauling.

3. **Atlas icon placeholders**
   - Use `progression.generic` with symbol `EB` for Expedition Board.
   - Use `progression.generic` with symbol `SR` for Scout Report.
   - Use existing `foreman-queue` only for delegation/approval, not scouting.

4. **Scout report visual**
   - Use an unframed parchment-style card in the Atlas panel, with resource chips and status stamps.
   - Avoid introducing a full world-map UI in v1. A "nearby site report" list is enough.

5. **Scene feedback**
   - During scouting, project a visual-only messenger/scout actor moving from HQ/Expedition Board toward the edge of the plot.
   - When report is ready, show the actor returning to HQ/board and a report card in the side panel/Atlas.

This gives the player a visible loop without pretending a multi-settlement world exists.

## Future Proper Generated Assets

Generate these as a coherent "Founders Plot Expedition Pack v1":

- `public/experiences/founders-plot/assets/buildings/expedition-board.webp`
  - Board with maps, brass pins, canvas awning, frontier-tech signal mast, no text/logos.

- `public/experiences/founders-plot/assets/characters/inhabitants/scout/scout-agentfolk-v1.png`
  - 4x4 sprite sheet matching current inhabitant sheet conventions.
  - Rows: idle, walk/depart, survey, report-ready.
  - Matching `.json`, `.source.png`, `.prompt.md`.

- `public/experiences/founders-plot/assets/objects/scout-report-parchment.webp`
  - Clean parchment/report bitmap, no embedded text, enough empty space for HTML text overlay.

- `public/experiences/founders-plot/assets/objects/trail-marker.webp`
  - Small reusable plot prop.

- `public/assets/icons/agent-town/expedition-board-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/scout-report-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/scout-action-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/intel-resource-gpt-image-2-v1.png`

Style target should match the existing approved direction: cozy frontier-tech, warm natural materials, subtle cyan accent, brass/leather/canvas/sandstone, no cyberpunk, no heavy UI text baked into images.

## Integration Points

### Engine/API

New canonical model should live in `server/founders_plot/engine.js`, not only Atlas:

- Add `EXPEDITION_BOARD` to `BUILDING_LABELS`.
- Add an `EXPEDITION_BOARD` building definition.
- Decide unlock:
  - conservative: HQ4 or HQ5 if it depends on Workshop prep;
  - product-fast: HQ3 if Expedition Board is the immediate post-HQ3 vertical slice.
- Add a job kind, likely `SCOUT`, if scouting is a timed building job.
- Add scout report state as a receipt-like record, not as inventory, unless it later becomes a resource.
- Keep settlement claiming out of v1.

Existing tool/API pattern:

- `GET /api/founders-plot/state` is the source for playable state.
- mutations route through `/api/founders-plot/place-building`, `/queue-job`, `/collect-outputs`, `/upgrade-building`, etc.
- tool specs expose `et.plot.place_building`, `et.plot.queue_job`, `et.plot.collect_outputs`, and friends.

Sources: `server/founders_plot/routes.js:61-170`, `server/founders_plot/tools.js:52-145`.

Recommended v1 API/state shape:

```js
scoutReports: [
  {
    reportId,
    originPlotId,
    sourceBuildingId,
    status: 'READY',
    site: {
      siteId,
      title,
      biome,
      distance,
      resourceHints: { wood: 'medium', stone: 'high', food: 'low' },
      risk: 'low'
    },
    generatedAt,
    receiptHash
  }
]
```

If modeled as a building job, `EXPEDITION_BOARD.produces()` should return something like:

```js
{
  kind: 'SCOUT',
  input: { food: 4, coin: 2 },
  output: {},
  durationMs: 90_000,
  reportKind: 'nearby_site'
}
```

Do not overload Workshop's `buffPct` or Market's `SELL` path. Scouting is not a resource production loop; it is a report/receipt loop.

### Progression Atlas / Engine Graph Studio

Current Atlas surfaces to extend:

- Add canonical nodes for `building.EXPEDITION_BOARD.unlock`, `.place`, `production.EXPEDITION_BOARD.SCOUT`, and `receipt.scout_report.ready`.
- Add an `expedition` lane in canonical coverage and/or Engine Graph Studio grouping.
- Populate `receiptRefs` for scout report nodes instead of leaving every node as `[]`.
- Add `building.expedition_board`, `action.scout`, and `receipt.scout_report` to `server/agent_town_icons.js`.
- Keep `future.hq.6.expedition_board` as the horizon milestone until the canonical node exists, then have HQ6 point at the canonical Expedition Board chain.

Current Atlas UI hard-codes coverage lanes around HQ, current buildings, loops/effects, permissions, rewards/caps (`public/progression-atlas.js:415-449`). It will need a new lane or a replacement "Expansion" lane. Future horizon rendering already shows HQ6 Expedition Board (`public/progression-atlas.js:608-642`).

The Engine Graph Studio proposal form already supports an "Expedition Board Proposal" draft with advisory wood/stone/HQ gates (`e2e/114_progression_atlas_openclaw_lite.spec.js:145-154`). That is a good authoring bridge, but not gameplay truth.

### Founders Plot UI/Scene

Current Founders Plot UI integration points:

- Header Atlas button: `public/experiences/founders-plot/index.html:30-32`.
- Atlas modal iframe: `public/experiences/founders-plot/index.html:92-102`.
- Building palette is generated from `buildingDefs`, sorted by unlock HQ level (`public/experiences/founders-plot/founders-plot.js:632-670`).
- Client bundle already normalizes server state into `buildingDefs`, buildings, visual actors, pads, permissions, rewards, and quest (`public/experiences/founders-plot/founders-plot.js:700-721`).
- Scene asset routing for building type lives in `scene_state.js:162-176`.

Needed UI states:

- Palette card for Expedition Board with exact HQ/resource requirements.
- Building panel action for `Scout nearby site`.
- Active job row: "Scout away" with timer.
- Ready output/report state: "Scout report ready" rather than "output ready".
- Report card panel with site hints, risk, and "Plan in Atlas" action.
- Atlas explanation for blocked state: missing HQ, missing Workshop prep, missing resources, active job, or pending approval.

### Tests

Existing tests cover:

- HQ1-HQ3 reachability (`tests-founders-plot/fp-unit.test.js:360-393`).
- Progression Atlas strategy templates, canonical graph, Workshop buff, Market sell, HQ10 future placeholders (`tests-founders-plot/fp-http.test.js:420-610`).
- Visual-only scene actors for builder/worker/hauler/messenger (`tests-founders-plot/fp-scene-state.test.js:20-180`).
- Browser Atlas embedding and Engine Graph proposal path (`e2e/114_progression_atlas_openclaw_lite.spec.js:44-154`).

Add focused tests for the slice:

- Engine unit: `EXPEDITION_BOARD` unlock, build, scout job, report ready, collect/report receipt.
- HTTP: `/api/founders-plot/state` includes `scoutReports`; `/progression-atlas` includes canonical expedition/report nodes once promoted.
- Contract: `et.plot.queue_job` supports `kind: 'SCOUT'` only for Expedition Board and preserves idempotency/policy checks.
- Scene state: scout visual actor is visual-only; report-ready cue does not mutate state.
- Playwright: reach HQ3/HQ4 as chosen, build Expedition Board, queue scout, advance/collect report, open Atlas, see Scout Report receipt and Expedition Board canonical node.
- Regression: Atlas read endpoint remains non-mutating by checking event count and stable hash, matching the existing pattern in `fp-http.test.js:543-551` and `603-610`.

## Practical v1 Slice Recommendation

Smallest end-to-end version that feels correct:

1. Promote a single `EXPEDITION_BOARD` building into engine truth.
2. Add a single `SCOUT` job kind on that building.
3. On completion, create one deterministic scout report receipt.
4. Show the report in Founders Plot side panel and Progression Atlas.
5. Add canonical Atlas nodes/edges for board placement, scout job, and report receipt.
6. Use existing Workshop/Rook/generic Atlas icon placeholders until the proper Expedition Pack assets land.
7. Keep "claim second plot" and "settler convoy" as advisory future nodes only.

Recommended initial costs if the parent needs a concrete placeholder:

- Unlock: HQ3 if the requested vertical slice must start immediately after HQ3; otherwise HQ4 after Workshop prep.
- Construction: `{ wood: 32, stone: 12, coin: 8 }`
- Scout job input: `{ food: 4, coin: 2 }`
- Duration: `90_000`
- Output: report receipt only, no inventory.

## Top Risks

- **Truth boundary drift:** If Expedition Board exists only in Atlas, players will see a fake system. Promote it into engine state before calling it playable.
- **Workshop sequencing mismatch:** Current Workshop is HQ4, not HQ3. Either adjust product copy or add a lightweight HQ3 prep step.
- **Report as resource confusion:** Scout reports should be receipts/site records, not wood/stone/food inventory.
- **Atlas lane hard-coding:** current coverage lanes are static. Expedition needs an expansion lane or data-driven lane rendering.
- **Asset identity blur:** Rook can temporarily carry scout/report visuals, but a proper scout character is needed soon or messenger/scout roles will feel muddled.

## Files Most Likely To Change Later

- `server/founders_plot/engine.js`
- `server/founders_plot/progression_atlas.js`
- `server/founders_plot/tools.js`
- `server/founders_plot/routes.js`
- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/scene_state.js`
- `public/experiences/founders-plot/assets/buildings/*`
- `public/experiences/founders-plot/assets/characters/inhabitants/scout/*`
- `server/agent_town_icons.js`
- `public/assets/icons/agent-town/*`
- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-http.test.js`
- `tests-founders-plot/fp-scene-state.test.js`
- `e2e/114_progression_atlas_openclaw_lite.spec.js`

## Bottom Line

Build the v1 around a **report receipt loop**, not settlement claiming. The Expedition Board should be the first expansion-facing building, the scout report should be the first new non-inventory output, and the Atlas should explain the report and next choices while keeping all future territory/second-plot actions locked behind explicit later engine models.
