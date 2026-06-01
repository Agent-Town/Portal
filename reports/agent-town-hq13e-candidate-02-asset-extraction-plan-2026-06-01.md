# Agent Town HQ13E Candidate 02 Asset Extraction Plan

Date: 2026-06-01
Lane: HQ13E report/proof only
Primary reference: `reports/agent-town-hq13-expedition-map-north-star-visual-direction-02-2026-06-01.png`
Secondary references: HQ13B current desktop visual shell, HQ13A visual universe pack architecture
Verdict: READY_FOR_SCHEMA_THEN_TINY_ASSET_BATCH

## Scope

This plan converts the selected GPT Image 2 north-star candidate 02 into an implementation-ready asset extraction plan for AgentTown Expedition Map visual packs.

No production assets are generated here. No runtime code, CSS, server, tests, app assets, routes, tools, Atlas behavior, or gameplay state are changed.

Candidate 02 is art direction only. Runtime assets must bind to visual-pack slots and render from server-owned read-model facts. The client must not infer hidden truth from art.

## Reference Read

Candidate 02 should be treated as the primary visual target because it has the right structure for a private Expedition Map:

- premium illustrated terrain with woodland, river, bridge, cliffs, farms, ruins, crystals, outposts, and settlement detail;
- strong fog-of-war division between readable known land and desaturated hidden regions;
- route-like glowing dotted survey language without implying real movement authority;
- clear marker-pin vocabulary for known, hinted, unknown, outpost, and point-of-interest states;
- compact HUD and card frames that feel integrated but do not bury the map;
- small party/token silhouettes that sell expedition presence without creating autonomous actors.

HQ13B already proves the safe renderer shell: terrain texture, fog veils, survey strokes, pins, pan/zoom/select, hidden-truth suppression, and `clientAuthority: false`. HQ13E's job is to turn that procedural shell into packable asset slots after schema validation.

## Extraction Categories

### Terrain Tiles

Purpose: replace procedural terrain paint with authored, repeatable, semantic terrain looks while preserving server-owned cell truth.

| Runtime slot | Source truth field | Suggested dimensions | Pack module | Forbidden authority fields |
| --- | --- | --- | --- | --- |
| `expedition_map.terrain.home_settlement` | `expeditionMap.cells[*].status == OWNED_HOME`, visible `fogState` | 512x512 diamond/isometric tile, 1024x1024 source | `map_terrain_pack` | `fogState`, `resources`, `resourceDelta`, `scoutEligible`, `routes`, `adjacency`, `ownedPlots`, `jobs`, `timers` |
| `expedition_map.terrain.woodland_ridge` | visible cell `terrainKey` or status-derived terrain class from server read model | 512x512 tile plus 256x256 cluster decals | `map_terrain_pack` | hidden terrain for hinted/locked cells, resource class, risk score, route topology |
| `expedition_map.terrain.river_flat` | server-visible terrain/status, future explicit river field if added | 512x512 tile, optional 1024x256 river strip | `map_terrain_pack` | traversal rules, bridge availability, water cost, route creation |
| `expedition_map.terrain.farm_clearings` | discovered/known server cell status only | 512x512 tile with no yield icons | `map_terrain_pack` | farm output, resource amounts, harvest state, owner mutation |
| `expedition_map.terrain.ruin_signal` | visible receipt/status such as reviewed site plan, owned outpost, or explicit server POI class | 512x512 tile plus 256x256 ruin decal | `map_terrain_pack` | hidden POI identity, artifact/reward truth, risk/event outcomes |
| `expedition_map.terrain.locked_silhouette` | `fogState == locked_unknown` only | 512x512 grayscale silhouette tile | `map_terrain_pack` | any terrain, resources, receipts, routes, POI, scout path |

Notes:

- Use seamless edge-safe texture families, not one baked full-map image.
- Hidden and locked variants must be intentionally generic silhouettes.
- Candidate 02's farms, cliffs, river, waterfall, ruins, and crystals become visual families only after the server exposes a visible terrain/status class.

### Fog Overlays

Purpose: lift the candidate's smoky desaturated frontier into composable fog materials and borders.

| Runtime slot | Source truth field | Suggested dimensions | Pack module | Forbidden authority fields |
| --- | --- | --- | --- | --- |
| `expedition_map.fog.discovered` | `expeditionMap.cells[*].fogState == discovered` | 512x512 transparent soft edge overlay | `fog_marker_pack` | reveal history beyond visible receipts, hidden resources |
| `expedition_map.fog.known` | `fogState == known` | 512x512 transparent light veil or none | `fog_marker_pack` | scout eligibility, future visit enablement |
| `expedition_map.fog.hinted` | `fogState == hinted` | 512x512 mist veil, 1024x256 dotted frontier border strip | `fog_marker_pack` | hidden terrain, resources, routes, receipt ids, exact future sector contents |
| `expedition_map.fog.locked_unknown` | `fogState == locked_unknown` | 512x512 heavy grayscale cloud, 1024x1024 cloud atlas | `fog_marker_pack` | all hidden cell truth, action availability |
| `expedition_map.fog.frontier_border` | adjacency between visible and server-provided hinted/locked cells | 1024x256 dashed border strip, 256x256 corner pieces | `fog_marker_pack` | adjacency creation, scout target choice, border expansion |

Notes:

- Fog assets can obscure and tint; they cannot decide what is obscured.
- Reduced-motion fallback should be a static alpha overlay.
- Candidate 02's white dotted region borders are visual-only cell boundaries, not route paths.

### Marker Pins

Purpose: turn candidate 02 pins into a controlled vocabulary tied to visible server states.

| Runtime slot | Source truth field | Suggested dimensions | Pack module | Forbidden authority fields |
| --- | --- | --- | --- | --- |
| `expedition_map.marker.home_base` | `status == OWNED_HOME` | 128x192 PNG/WebP, source 512x768 | `fog_marker_pack` | home bonuses, resource state, permissions |
| `expedition_map.marker.known_site_plan` | visible `status == SITE_PLAN_REVIEWED` or linked receipt | 128x192 plus 64x64 minimap variant | `fog_marker_pack` | hidden site-plan outcomes, reward values |
| `expedition_map.marker.owned_outpost` | visible `status == OWNED_OUTPOST` | 128x192 plus 64x64 minimap variant | `fog_marker_pack` | outpost production, routes, trade, defense, ownership mutation |
| `expedition_map.marker.hinted_unknown` | `fogState == hinted` | 128x192 question-mark-free symbolic unknown pin | `fog_marker_pack` | hidden POI kind, scout result, resources |
| `expedition_map.marker.locked_unknown` | `fogState == locked_unknown` | 128x192 muted sealed pin | `fog_marker_pack` | action availability, unlock rule, hidden cell detail |
| `expedition_map.marker.current_focus` | server current-focus/read-model selection only | 160x220 highlighted pin, 64x64 badge | `fog_marker_pack` | objective completion, rewards, timers |

Notes:

- Avoid text, logos, numbers, and quest-like rewards in the art.
- Pins can show visual confidence state, not exact hidden gameplay truth.
- Unknown pins should avoid literal "?" if generation can keep it symbol-only; if not, use abstract compass/veil symbol.

### Route And Survey Strokes

Purpose: preserve candidate 02's glowing path readability while making clear it is survey/evidence language, not live route gameplay.

| Runtime slot | Source truth field | Suggested dimensions | Pack module | Forbidden authority fields |
| --- | --- | --- | --- | --- |
| `expedition_map.stroke.survey_visible_adjacency` | renderer adjacency between server-provided visible cells only | 1024x128 horizontal strip, 256x256 curve/corner pieces | `fog_marker_pack` | route creation, movement, trade, economy, traversal cost |
| `expedition_map.stroke.scout_receipt_trace` | visible scout receipt/event packet linkage | 1024x128 dotted glow strip | `fog_marker_pack` | future scout target, hidden result, travel time |
| `expedition_map.stroke.selected_cell_rim` | selected client UI state over visible read model cell | 512x512 ring overlay | `fog_marker_pack` | selection mutation, action availability, cell truth |
| `expedition_map.stroke.frontier_hint_boundary` | `fogState == hinted` and server-provided map edge hint | 1024x128 dashed soft border | `fog_marker_pack` | hidden adjacency, exact future cell contents |

Notes:

- Name these strokes `survey`, `receipt`, or `boundary`, not `route`, in implementation fixtures unless a later server read model exposes real route facts.
- Stroke art must not include arrows, carts, trade goods, military lines, or conquest markings.

### Settlement, Outpost, And Ruin Icons

Purpose: extract small map objects from candidate 02 as semantic visible-state icons.

| Runtime slot | Source truth field | Suggested dimensions | Pack module | Forbidden authority fields |
| --- | --- | --- | --- | --- |
| `expedition_map.icon.home_settlement_cluster` | `OWNED_HOME` visible cell | 256x256 transparent icon, source 1024x1024 | `map_terrain_pack` | building inventory, HQ level, resource state |
| `expedition_map.icon.outpost_camp` | `OWNED_OUTPOST` visible cell | 256x256 transparent icon | `map_terrain_pack` | outpost actions, production, storage, routes |
| `expedition_map.icon.reviewed_site_marker` | `SITE_PLAN_REVIEWED` visible cell | 256x256 transparent icon | `map_terrain_pack` | site-plan result not already visible, costs/rewards |
| `expedition_map.icon.ruin_silhouette_known` | explicit visible server POI/status | 256x256 transparent icon | `map_terrain_pack` | hidden event outcome, loot/reward, combat/risk |
| `expedition_map.icon.crystal_landmark_known` | explicit visible server POI/status | 256x256 transparent icon | `map_terrain_pack` | resource amount, harvest availability, economy hook |
| `expedition_map.icon.locked_ruin_shadow` | `locked_unknown` silhouette only | 256x256 desaturated generic shadow | `map_terrain_pack` | ruin identity, resources, receipts, actions |

Notes:

- The candidate's crystals and ruins are visually useful but risky. Only make them concrete for visible server facts; otherwise use generic shape language.
- No saloons, cowboy posts, wanted boards, guns, forts, mines, or gold-rush prospecting props.

### HUD And Card Frames

Purpose: extract the parchment/ivory/gold UI frame language without adding actions or mechanical text.

| Runtime slot | Source truth field | Suggested dimensions | Pack module | Forbidden authority fields |
| --- | --- | --- | --- | --- |
| `hud.frame.expedition_map_board` | page renders Expedition Map surface | 9-slice frame source 512x512 corners/edges | `hud_card_pack` | actions, tool ids, mutation routes |
| `hud.frame.selected_sector_card` | selected `expeditionMap.cells[*]` from server read model | 9-slice frame, 640x360 card background | `hud_card_pack` | hidden truth, rewards, formulas, timers |
| `hud.frame.event_packet` | server event packet read-only record | 640x360 card background, 128x128 icon well | `hud_card_pack` | packet actions, Atlas execution, public share |
| `hud.frame.expedition_party` | `expeditionMap.expeditionParty` and `partySnapshot` | 1024x256 strip, 192x192 portrait chip frame | `hud_card_pack` | party management, assignments, movement |
| `hud.frame.minimap` | same server map projection, scaled | 512x512 minimap frame | `hud_card_pack` | extra cells, hidden map truth |
| `hud.icon.legend_swatches` | fog counts and states | 64x64 swatches | `hud_card_pack` | reveal rules, scout eligibility |

Notes:

- Frames should be generated empty, with no text, labels, logos, numbers, badges that imply mechanics, or fake resource bars.
- Runtime text remains app-rendered and sourced from the read model.

### Party Tokens

Purpose: bring candidate 02's tiny party presence into map presentation without turning party members into autonomous map actors.

| Runtime slot | Source truth field | Suggested dimensions | Pack module | Forbidden authority fields |
| --- | --- | --- | --- | --- |
| `founders_plot.party.member.scout` | `expeditionMap.expeditionParty[*]` or event packet `partySnapshot` | 128x128 portrait chip, 96x128 map token | `inhabitant_operator_pack` | movement, assignment, inventory, hidden autonomy |
| `founders_plot.party.member.routekeeper` | server-owned party read model only | 128x128 portrait chip, 96x128 map token | `inhabitant_operator_pack` | route/trade behavior, pathfinding |
| `founders_plot.party.member.synthetic_assistant` | server-owned party read model only | 128x128 portrait chip, 96x128 map token | `inhabitant_operator_pack` | autonomous execution, surveillance, combat |
| `expedition_map.party_token.cluster` | selected visible receipt/current focus party snapshot | 192x128 small grouped token | `inhabitant_operator_pack` | live position, travel time, command queue |

Notes:

- Party tokens are badges over receipts/current focus, not live units.
- Include human-plus-agent balance: at least one neighborly synthetic/agentic token in batches of 3+ party roles.

### Semantic Zoom Variants

Purpose: make candidate 02's overview/detail richness usable across zoom tiers without unlocking extra truth.

| Runtime slot | Source truth field | Suggested dimensions | Pack module | Forbidden authority fields |
| --- | --- | --- | --- | --- |
| `expedition_map.zoom.survey.terrain` | server cells and fog counts at survey zoom | 256x256 simplified terrain/fog assets | `map_terrain_pack` | hidden cell detail, resources, routes |
| `expedition_map.zoom.region.terrain` | same visible cells at normal zoom | 512x512 terrain and overlay assets | `map_terrain_pack` | extra facts not shown in selected card |
| `expedition_map.zoom.detail.terrain` | selected visible cell at close zoom | 1024x1024 terrain source, downscaled runtime | `map_terrain_pack` | new receipts, resources, actions |
| `expedition_map.zoom.survey.marker` | server state compressed to marker class | 48x48 simplified marker | `fog_marker_pack` | hidden marker kind |
| `expedition_map.zoom.detail.marker` | same marker class at close zoom | 128x192 marker | `fog_marker_pack` | action availability, hidden result |
| `hud.semantic_zoom.badge` | current zoom tier client state plus selected read-model cell | 64x64 badges | `hud_card_pack` | unlock state, rewards, hidden data |

Notes:

- Close zoom clarifies art only. It must not reveal new resources, routes, receipts, actions, or hidden cell identity.
- Use the current HQ12I/HQ13B semantic-zoom rule as hard product law: zoom changes presentation, not truth.

## Smallest Next Implementable Asset Batch

Do this only after the visual-pack schema/validator lane exists and fails closed on forbidden fields.

Batch size: 8 assets max.

1. `fog-hinted-soft-veil-v1.png` - 512x512 transparent hinted fog overlay.
2. `fog-locked-heavy-cloud-v1.png` - 512x512 transparent locked-unknown cloud overlay.
3. `frontier-dotted-boundary-v1.png` - 1024x128 dotted/stitched frontier boundary strip.
4. `marker-known-site-plan-v1.png` - 128x192 known/reviewed site pin with no text.
5. `marker-hinted-unknown-v1.png` - 128x192 abstract hinted unknown pin with no question mark if possible.
6. `marker-owned-outpost-v1.png` - 128x192 owned outpost pin with civic/outpost silhouette.
7. `survey-receipt-stroke-v1.png` - 1024x128 glowing dotted survey trace, explicitly not route art.
8. `hud-selected-sector-frame-v1.png` - 640x360 empty selected-sector parchment frame.

Why this batch:

- It upgrades HQ13B's current procedural fog, pins, survey strokes, and selected card look without requiring terrain-class schema expansion.
- Every asset binds to existing visible read-model concepts: fog state, visible status, selection, and receipt context.
- It avoids crystals, ruins, farms, and detailed terrain until the server exposes explicit visible terrain/POI classes.

## AgentTown Map UI Style Anchor

The first HQ13 map prompts leaned too hard on "cozy civilization-builder" and
negative Wild West bans. Future map UI generation should start from AgentTown's
positive identity:

```text
AgentTown style anchor: Founders Plot is a hand-built frontier-tech civic
settlement at the threshold between old human systems and new human-plus-agent
collaboration. Visual language should feel warm, practical, neighborly,
tinkered-with, and civic: sun-bleached timber, brass, canvas, parchment,
worn teal, cream paper, scout reports, ledgers, receipts, plan wagons,
beacons, small signal/agent-tech glows, and Progression Atlas provenance.
This is frontier-founder mythology without cowboy genre cosplay.
```

Prompt rewrite rules:

- Say `AgentTown frontier-tech civic map UI`, not just `cozy civilization-builder map UI`.
- Say `Scout Report`, `site plan`, `ledger`, `receipt`, `beacon`, `plan wagon`, and `human-plus-agent settlement` when an asset needs brand flavor.
- Say `frontier edge` only for the edge of the unrevealed map, and keep it stitched, civic, and secondary.
- Keep no-cowboy/no-saloon/no-gold-rush as a hard negative, but do not strip out the AgentTown frontier-tech material language.
- Avoid generic fantasy-map, sterile sci-fi HUD, and literal American Western genre cues.

## GPT Image 2 Prompt Briefs

Prepend the AgentTown Map UI Style Anchor above to every prompt in this batch.

Global negative constraints for every prompt:

No readable text, labels, logos, numbers, UI copy, watermarks, cowboy, saloon, gold-rush, prospector, gun, military, combat, conquest, empire, public-world domination, hidden resource truth, hidden route truth, exact map coordinates, fake gameplay rewards, or secret objective symbols.

### Hinted Fog Overlay

Generate a transparent PNG-style game asset: soft luminous mist veil for an isometric private AgentTown expedition map hinted sector. The mist should be pale grey-green with warm dawn edge light, usable as an overlay over terrain, no text, no logos, no icons, no hidden objects inside the fog. AgentTown frontier-tech civic tone, not fantasy spell effect, not dark apocalypse.

### Locked Unknown Fog Overlay

Generate a transparent PNG-style game asset: heavier desaturated cloud bank for a locked unknown AgentTown map sector, painterly but readable, with generic silhouettes only and no identifiable resources, ruins, buildings, routes, or rewards. Private frontier-tech exploration map tone, no text, no logos, no combat, no military, no Wild West props.

### Frontier Dotted Boundary

Generate a horizontal transparent strip asset for a soft dotted frontier-edge boundary on an illustrated AgentTown strategy map. Warm ivory/brass scout-report dots with subtle glow and hand-painted softness, designed to tile or bend along unrevealed sector edges. Civic/cartographic, stitched, and secondary. No arrows, no road signs, no route claims, no readable text, no conquest or military map language.

### Known Site Marker Pin

Generate a transparent game-map pin asset for a reviewed known site on an AgentTown human-plus-agent frontier-tech expedition map. Shape language: small brass/civic compass pin with subtle blue/green enamel, ledger/site-plan motif, and scout-report provenance flavor, no text, no letters, no numbers, no resource symbols, no weapons, no cowboy or saloon cues.

### Hinted Unknown Marker Pin

Generate a transparent game-map pin asset for a hinted unknown AgentTown frontier-edge sector. It should feel mysterious but safe: muted brass frame, soft mist icon, abstract compass/veil symbol, tiny civic scout-report material cues, and no question mark if possible. No text, logos, numbers, hidden resource clues, ruins, skulls, weapons, or conquest signals.

### Owned Outpost Marker Pin

Generate a transparent game-map pin asset for an owned AgentTown civic outpost marker. Small frontier-tech civic outpost silhouette with worn teal/gold accents, beacon/ledger material language, and a brass pin frame, readable at small size, no flags of conquest, no fort, no guns, no military tower, no cowboy/saloon/gold-rush props, no text.

### Survey Receipt Stroke

Generate a transparent horizontal dotted stroke asset for an AgentTown expedition survey receipt trace. It should look like warm lantern-lit scout-report evidence marks on a frontier-tech strategy map, decorative and non-directional, with no arrows, vehicles, trade goods, roads, route labels, military markings, or hidden gameplay information.

### Selected Sector Frame

Generate an empty parchment/ivory selected-sector card frame for a premium AgentTown frontier-tech strategy UI. 16:9 card background, subtle brass corners, soft paper texture, scout-report/ledger material language, room for app-rendered text, no text baked in, no icons that imply actions/rewards/resources, no logos, no cowboy/saloon/gold-rush styling.

## Migration Plan From HQ13B Shell

### Phase 0 - Keep HQ13B As Fallback

- Preserve the current procedural canvas/Three.js shell as the default renderer.
- Do not delete generated terrain texture, fog veils, survey strokes, or marker logic.
- Keep proof metadata for `visualShell`, `visualLayers`, and `clientAuthority: false`.

### Phase 1 - Schema And Fixture Validation

- Add a draft `agent-town.visual-pack.v1` schema in docs/specs or reports.
- Validate one docs/reports-only fixture manifest that binds the 8-asset batch slots without production assets.
- Reject unknown slots, external URLs, public-sharing flags, Atlas execution flags, tool/action names, route/trade/economy fields, hidden truth fields, and mutation-looking fields.
- No runtime loading yet.

### Phase 2 - Report-Only Asset Generation And QA

- Generate the 8 tiny batch assets into reports-only review folders.
- Write prompt, metadata, provenance, and SHA records.
- Run visual QA contact sheets and alpha/bounds checks.
- Do not place assets under runtime directories yet.

### Phase 3 - Private Runtime Pack Directory

- After approval, copy reviewed assets into a `visual-packs` directory in a bounded asset-only lane.
- Add pack manifest and sidecars.
- Keep the pack disabled by default unless a later runtime loader lane explicitly promotes a private preview slot.

### Phase 4 - Read-Only Renderer Loader

- Add a loader that can read one local same-origin visual pack manifest.
- Fail closed to HQ13B procedural visuals if validation fails.
- Bind only approved slots: fog overlays, marker pins, survey stroke, selected-sector frame.
- Do not add terrain detail, visit scenes, route behavior, party movement, or actions.

### Phase 5 - Proof And Regression

- Prove desktop/mobile canvas is nonblank.
- Prove `fogState` counts remain server-owned.
- Prove hinted/locked selected cards still suppress resources, receipts, routes, and actions.
- Prove Scout Sector remains the only Expedition Map mutation path.
- Prove no public sharing, Atlas execution, Generated Universe rendering, route/trade/economy/resource/combat/scheduler behavior, hidden autonomy, cross-plot mutation, or external effects exist.

### Phase 6 - Terrain And Semantic Zoom Expansion

- Only after the first pack renders safely, add visible terrain-class fields or use existing visible status classes.
- Add terrain tile families and semantic zoom variants.
- Keep hinted/locked silhouettes generic.
- Add location scene extraction only through the HQ13C descriptor path, not from map art inference.

## Non-Negotiable Guardrails

- Server-owned fog remains the source of truth.
- Scout Sector remains the only current Expedition Map mutation path.
- Event Packet, Expedition Party, current focus, and selected-sector cards stay read-only unless a later server-backed slice changes them.
- Visual packs never own resources, routes, trade, economy, combat, schedules, rewards, timers, permissions, hidden cell data, Atlas execution, Generated Universe rendering, public sharing, cross-plot mutation, external effects, or autonomous behavior.
- No asset should imply Wild West genre drift: no cowboys, saloons, gold-rush prospecting, wanted posters, guns, frontier-town cliches, or conquest flags.

## Recommendation

Next lane: build the report/docs-only visual-pack schema validator fixture, then run the 8-asset reports-only generation batch. Do not start runtime rendering or production asset placement before the schema can reject forbidden authority fields.

## Verification

Passed:

- `jq empty reports/agent-town-hq13e-candidate-02-asset-extraction-plan-proof-2026-06-01.json`
- `git diff --check -- reports/agent-town-hq13e-candidate-02-asset-extraction-plan-2026-06-01.md reports/agent-town-hq13e-candidate-02-asset-extraction-plan-proof-2026-06-01.json`
- `rg -n "[ \t]+$|\t" reports/agent-town-hq13e-candidate-02-asset-extraction-plan-2026-06-01.md reports/agent-town-hq13e-candidate-02-asset-extraction-plan-proof-2026-06-01.json` returned no matches

No JS syntax, build, or Playwright checks are needed because this lane creates only Markdown and JSON report artifacts.
