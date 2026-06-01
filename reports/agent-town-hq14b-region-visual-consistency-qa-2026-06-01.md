# Agent Town HQ14B Region Visual Consistency QA

Date: 2026-06-01
Lane: HQ14B region-to-visual consistency QA and asset acceptance
Verdict: FAIL_RUNTIME_REGION_CONSISTENCY_BEFORE_PLAY

## Scope

This report checks whether the upgraded Expedition Map visuals remain faithful to server-owned region truth instead of becoming generic pretty map art.

This lane is report/proof/screenshot only. It did not edit runtime, frontend, server, schema, fixture, or asset promotion files.

Robin's added product constraint is included here: the long-term game should be UI-driven, not text-driven. Visual affordances must communicate region/fog state, Scout Sector eligibility, selected cell, receipts, and party context at a glance. Text remains allowed for labels, accessibility, and receipt audit details, but a playable map should not depend on long explanatory paragraphs or proof-dashboard panels.

## Sources Read

- `server/founders_plot/engine.js`
- `e2e/200_founders_plot.spec.js`
- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/founders-plot.js`
- HQ13 visual-pack and style reports/proofs under `reports/`
- HQ13 review assets under `reports/media/`

No `public/experiences/founders-plot/assets/expedition-map/` files existed during this QA pass, so there are no promoted runtime expedition-map assets to accept yet.

Contact sheet:

- `reports/media/agent-town-hq14b-region-visual-consistency-qa-2026-06-01/contact-sheet.png`

## Server-Owned Truth Baseline

The server read model defines four fog states and their authority boundaries:

| Fog state | Server meaning | Allowed visual information |
| --- | --- | --- |
| `discovered` | Owned home/outpost plot truth. | Cell type, owned/home/outpost treatment, receipts, risk, terrain/site fields already present on the cell. |
| `known` | Scout reports, reviewed site plans, settlement claims, or Scout Sector receipts. | Cell terrain/site/resource hints/receipts that are already in cell fields. |
| `hinted` | Adjacency hints derived from known frontier cells. | Fog-edge or hint treatment only; no resource, route, landmark, biome, or destination truth. |
| `locked_unknown` | Opaque placeholder fog. | Sealed silhouette/fog only; no terrain, landmark, ruins, resources, route, or receipt specifics. |

Relevant server lines:

- `server/founders_plot/engine.js:1574` creates the home discovered cell with `siteType: home_plot`.
- `server/founders_plot/engine.js:1592` through `server/founders_plot/engine.js:1739` creates known cells from scout reports, site plans, settlement claims, and Scout Sector receipts with explicit `siteType`, `traits`, `risk`, `resourceHints`, and receipts.
- `server/founders_plot/engine.js:1742` through `server/founders_plot/engine.js:1763` creates hinted frontier cells with `siteType: unresolved_frontier`, empty traits, empty resource hints, and only adjacent-cell provenance.
- `server/founders_plot/engine.js:1766` through `server/founders_plot/engine.js:1787` creates locked unknown placeholders with `siteType: unknown`, empty traits, and empty resource hints.
- `server/founders_plot/engine.js:1814` through `server/founders_plot/engine.js:1818` states that hinted is not resource truth and locked unknown has no gameplay truth, resources, or actions.

## Current Runtime Mapping

Good:

- `expeditionCellTerrain` gates terrain specificity to `discovered` and `known`; hidden cells return their fog state instead of reading hidden fields (`three_scene_entry.js:1525`).
- Known/discovered terrain derives from public cell fields: `siteType`, `traits`, `kind`, and `status` (`three_scene_entry.js:1528` through `three_scene_entry.js:1537`).
- Survey strokes refuse to cross locked unknown cells (`three_scene_entry.js:2365` through `three_scene_entry.js:2369`).
- Selected-sector DOM copy hides resources/receipts for `hinted` and `locked_unknown` (`founders-plot.js` selected card rules).

Blocking issues:

1. `locked_unknown` cells draw a ruin cue.
   - Runtime code draws `drawRuinCue` for `terrain === 'locked_unknown'` at `three_scene_entry.js:1812` through `three_scene_entry.js:1818`.
   - This violates the locked unknown rule. A ruin is terrain/landmark truth, while the server only exposes `fog_placeholder`, `siteType: unknown`, empty traits, and empty resource hints.

2. Every discovered/known cell gets a river-like stroke, even when the server does not say water/river.
   - Runtime code draws a blue river-like bezier for all `discovered` and `known` cells at `three_scene_entry.js:1703` through `three_scene_entry.js:1714`.
   - This overstates water terrain for `cell_origin` (`home_plot`), `cell_q1_r0` (`forest_edge`), and `cell_q1_r-1` (`outpost`) in the e2e fixture.
   - Water should only appear for cells whose server-owned `siteType` or traits include water/river, such as the server template `river_flat`.

3. Hinted cells get a mast/landmark-ish motif.
   - Runtime code draws `drawSignalMast` for `terrain === 'hinted'` at `three_scene_entry.js:1794` through `three_scene_entry.js:1810`.
   - A generic fog-edge veil, dotted frontier boundary, or scout-eligible ring is acceptable. A mast can read as a known landmark and should be removed or abstracted unless the server hint model later exposes a public hint type that says "signal".

## Acceptance Matrix

| Region / cell | Fog state | Server-owned fields | Expected visual treatment | Must not leak | Status |
| --- | --- | --- | --- | --- | --- |
| `cell_origin` Founders Plot | `discovered` | `kind: origin_plot`, `status: OWNED_HOME`, `siteType: home_plot`, `traits: home`, no resources | Home/settled civic node, HQ marker, warm owned treatment, receipt-safe selected card | Water/river, resource hint, route/trade/conquest, unowned terrain | `NEEDS_FIX`: current shared visible-cell river stroke implies water. |
| `cell_q1_r0` Forest Ridge Survey Site Plan | `known` | `kind: planned_site`, `siteType: forest_edge`, `traits: wooded/sheltered`, `resourceHints: wood +2, food +1`, reviewed receipt | Forest/wooded ridge treatment, PLAN marker, read-only resource hints and receipts in selected card | River unless water field exists, route/trade, resource harvesting, new action | `PARTIAL`: forest mapping is valid; shared river stroke is not. |
| `cell_q1_r-1` Forest Ridge Outpost | `discovered` | `kind: owned_outpost`, `siteType: outpost`, `traits: owned-outpost`, no resources | Owned outpost marker/civic node tied to owned plot receipt | Water/river, production/resource claim, route/trade | `NEEDS_FIX`: settled/outpost mapping is valid; shared river stroke is not. |
| `cell_q0_r1` Unresolved Frontier Hint | `hinted` | `kind: frontier_hint`, `sourceTruth: derived_hint`, `sourceIds.adjacentCellId`, empty traits/resources, `siteType: unresolved_frontier` | Hinted fog veil, edge glow/ring, eligible Scout Sector affordance only | Resource, route, biome, landmark, settlement, outpost, river, ruin, destination | `NEEDS_FIX_BEFORE_PROMOTION`: ring/fog is okay; mast/landmark motif should be replaced with abstract fog-edge language. |
| `cell_q3_r0` Locked Unknown | `locked_unknown` | `kind: fog_placeholder`, `siteType: unknown`, empty traits/resources, placeholder receipt only | Opaque sealed fog/silhouette, question/locked marker, no terrain specificity | Ruins, water, forest, ridge, resources, route, landmark, receipt truth beyond placeholder | `FAIL`: current ruin cue leaks landmark/terrain specificity. |
| Future `river_flat` known cell | `known` | Server template exposes `siteType: river_flat`, water access trait, food/wood hints | Water/river-flat cue is allowed only for this known/discovered terrain class | Resource harvesting, route/trade, hidden cells borrowing the same water cue | `PASS_IF_GATED`: current renderer has a `water` terrain path but must gate the river stroke to water cells only. |
| Future `ruin_signal` known cell | `known` | Server template exposes `siteType: ruin_signal`, old road/signal marker traits, stone/coin hints | Ruin/signal cue is allowed only after this cell is known/discovered | Locked unknown showing ruins; route/conquest framing | `PASS_IF_GATED`: ruin/signal art is acceptable for known `ruin_signal`, not for locked unknown. |

## UI-Playability Acceptance

The current Expedition Map is closer to a proof surface than a finished playable map. It has useful state labels and guardrail copy, but the next implementation lane should move state comprehension into the visual layer and keep paragraph copy as secondary audit/detail.

| UI affordance | Expected playable treatment | Current evidence | Status |
| --- | --- | --- | --- |
| Region/fog state | Four states should be visually distinct through shape, opacity, material, and marker language before reading text. | Fog colors, marker labels, and veils exist; `locked_unknown` and `hinted` still rely on explanatory selected-card copy to prove hidden truth is sealed. | `PARTIAL`: strengthen icon/veil language after removing forbidden ruin/mast cues. |
| Scout Sector eligibility | Eligible hinted cells should have a clear non-action-looking Scout Sector affordance, distinct from locked cells and known cells. | Hinted cells get a scout ring, dashed treatment, and marker. The mast motif reads too much like a landmark. | `NEEDS_FIX`: replace mast with an abstract scout-eligible edge glyph or pulse. |
| Selected cell | Selection should be obvious through a frame/halo, focus state, and linked selected-card frame without causing other cells to read as selected. | Runtime has a selected halo and HQ13R has a selected-sector HUD frame candidate. | `PASS_FOR_PROTOTYPE`: keep, then bind HUD frame to selected card in a more game-like layout. |
| Receipts | Receipts should read as audit provenance through small stamps/traces/icons, with detailed text available on demand. | Survey/receipt strokes exist and selected-card receipts are text-heavy. | `PARTIAL`: keep traces visual-only, but move long receipt paragraphs into collapsible detail or compact receipt chips. |
| Party context | Party should feel like named operators accompanying the selected sector, not an extra proof paragraph. | Current party flavor is present in UI copy and HQ13W style target has named operator party tone. | `PARTIAL`: use compact operator portraits/badges/status chips; keep prose as accessible detail. |
| Overall screen composition | First read should be attractive playable map UI, not a QA dashboard. | HQ13Y screenshot remains inside a long Founders Plot page/proof flow; post-HQ13Y QA notes say it is still not a premium full-bleed world-map screen. | `NEEDS_PRODUCT_POLISH`: make the Expedition Map feel like the primary play surface before Robin plays. |

## Asset Acceptance Lane

No runtime `public/experiences/founders-plot/assets/expedition-map/` pack exists yet. Current asset acceptance therefore applies only to review assets under `reports/media`, not promoted runtime assets.

| Slot | Current best review source | Slot/schema fit | Identity fit | Acceptance |
| --- | --- | --- | --- | --- |
| `expedition_map.fog.hinted` | HQ13P/HQ13R hinted fog veil | Schema-allowed | Good frontier-tech fog direction | Accept for review mock only. Must stay non-terrain. |
| `expedition_map.fog.locked_unknown` | HQ13P/HQ13R locked fog | Schema-allowed | Good sealed fog direction | Accept for review mock only. Runtime should use this instead of ruin cue. |
| `expedition_map.fog.frontier_border` | HQ13T v3 stitched boundary | Schema-allowed | Better than generic boundary, secondary only | Accept as direction, but keep it lightweight and not road/trade/conquest. |
| `expedition_map.marker.known_site_plan` | HQ13P/HQ13R marker | Schema-allowed | Acceptable civic survey marker | Accept for known/site-plan cells only. |
| `expedition_map.marker.hinted_unknown` | HQ13P/HQ13R marker | Schema-allowed | Strong small-scale hint marker | Accept for hinted cells if paired with fog, no landmark detail. |
| `expedition_map.marker.owned_outpost` | HQ13P/HQ13R marker | Schema-allowed | Acceptable owned civic marker | Accept for discovered owned outposts only. |
| `expedition_map.stroke.scout_receipt_trace` | HQ13Q/HQ13R repaired trace | Schema-allowed | Good read-only receipt/ledger cue | Accept only for known/discovered or known/hinted adjacency already exposed by server coordinates. |
| `hud.frame.selected_sector_card` | HQ13P/HQ13R frame | Schema-allowed | Acceptable as UI frame | Accept for review mock only; text must remain app-rendered from server fields. |

GPT Image 2 identity gate:

- Pass direction: HQ13W/HQ13X course correction restored AgentTown frontier-tech civic identity: timber, brass, canvas, parchment, worn teal, scout ledger, receipt, beacon, plan-wagon, and human-plus-agent civic tone.
- Must continue to reject: generic cozy-civ, fantasy, sci-fi control-panel UI, cowboy, saloon, gold-rush, conquest, road/trade-route framing, military borders, and resource-extraction promise.

## Implementation Fixes Before Robin Plays

1. Remove `drawRuinCue` from the `locked_unknown` terrain branch. Use only sealed fog/silhouette/stripes/unknown marker. Save ruin/signal art for known/discovered cells whose server fields say `ruin_signal` or similar.
2. Gate the blue river stroke to `terrain === 'water'` or explicit server-owned water/river fields. Do not draw it for home, forest, outpost, field, hinted, or locked cells.
3. Replace the hinted-cell `drawSignalMast` motif with abstract fog-edge/hint styling. If a future public hint model adds hint categories, only then map categories to hint-safe icons.
4. Keep generated assets slot-bound through the visual-pack schema before promotion. Do not promote HQ13 review assets until each slot declares which fog states and `siteType` classes may use it.
5. Add a focused visual assertion or proof predicate that `locked_unknown` textures contain no ruin/landmark draw path and that water cues are gated by server-owned water/river truth.
6. Convert the Expedition Map from proof-dashboard presentation toward playable UI: compact legend, visual fog/eligibility/selection affordances, receipt chips/traces, and party badges should carry the state before explanatory paragraphs do.

## Verification

Ran:

- `file` and `magick identify` on inspected HQ13 screenshots/contact sheets.
- `magick identify reports/media/agent-town-hq14b-region-visual-consistency-qa-2026-06-01/contact-sheet.png`
- A node static predicate check confirming: hidden terrain gate present, locked ruin cue present, all-visible river stroke present, hinted mast present, and survey strokes skip locked cells.

Planned final checks after writing this report/proof:

- `jq empty reports/agent-town-hq14b-region-visual-consistency-qa-proof-2026-06-01.json`
- `git diff --check -- reports/agent-town-hq14b-region-visual-consistency-qa-2026-06-01.md reports/agent-town-hq14b-region-visual-consistency-qa-proof-2026-06-01.json reports/media/agent-town-hq14b-region-visual-consistency-qa-2026-06-01/contact-sheet.png`

## Guardrails

- No runtime/source/server/schema/e2e fixture edits.
- No runtime asset promotion.
- No visual-pack manifest or loader creation.
- No Scout Sector behavior change.
- No Atlas execution, public sharing, Generated Universe rendering, hidden autonomy, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation, or external effects.
