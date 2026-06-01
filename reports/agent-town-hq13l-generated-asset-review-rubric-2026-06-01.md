# Agent Town HQ13L Generated Asset Review Rubric

Date: 2026-06-01
Lane: HQ13L generated candidate-02 asset review rubric
Verdict: READY_FOR_REPORT_ONLY_REVIEW

## Scope

This report defines the acceptance rubric for reviewing the eight candidate-02 generated Expedition Map visual assets before any runtime promotion.

Source context:

- HQ13E selected the smallest candidate-02 batch and wrote the prompt/dimension plan.
- HQ13G proved placeholder dimensions and filenames for the eight-asset batch.
- HQ13J reconciled all eight slot intents into the visual-pack v1 schema.

This lane is report/proof only. It does not approve, create, move, load, or render generated assets.

## Global Acceptance Gate

Accept an asset only if every relevant item passes:

- No readable text, labels, logos, watermarks, fake UI copy, numbers, quest badges, or brand marks are baked into the art.
- No hidden truth leakage: hinted and locked assets stay generic and do not reveal terrain, resources, rewards, routes, receipts, POIs, future actions, exact coordinates, or outpost outcomes.
- No mechanical implications: assets do not imply resource extraction, rewards, route creation, trade, economy, combat, conquest, pathfinding, travel time, timers, job queues, unlocks, permissions, or server actions.
- AgentTown identity fit: assets should read as Founders Plot frontier-tech civic UI, with warm timber/brass/canvas/parchment/worn-teal material language, scout-report or ledger/receipt provenance flavor, subtle agent-tech glow, and human-plus-agent settlement tone. Reject assets that feel like generic fantasy map art, sterile sci-fi chrome, or a pasted-on strategy-game skin with no AgentTown DNA.
- No Wild West drift: no cowboys, saloons, gold-rush prospecting, wanted posters, guns, forts, military towers, conquest flags, or frontier-town genre cliches. "Frontier" means only an unrevealed map edge.
- Same-origin future pack binding: any later manifest must bind only to the approved slot ID, use same-origin static paths, carry `presentationOnly: true`, `visualOnly: true`, `publicSharing: false`, `atlasExecution: false`, and `generatedUniverseRendering: false`, and include no external URLs or handler/action fields.
- Alpha/chroma-key readiness: PNG/WebP export must have clean transparency, no matte halo, no opaque colored background, no accidental chroma spill, and enough transparent padding for runtime placement. If a generator cannot provide true alpha, it must be flagged for cutout cleanup before acceptance.
- Mobile readability: markers and strokes must remain legible when reviewed at expected runtime size and at small mobile scale. If the silhouette collapses into noise, fake text, or ambiguous mechanics, reject or regenerate.
- Provenance and metadata: each reviewed asset needs filename, slot ID, intended dimensions, prompt brief, negative constraints, model/source note, generation date, reviewer verdict, SHA-256 digest, dimensions, alpha result, and any post-processing transforms.

## Slot Rubric

| Asset file | Slot binding | Expected dimensions | Usage | Reject if |
| --- | --- | --- | --- | --- |
| `fog-hinted-soft-veil-v1.png` | `expedition_map.fog.hinted` | 512x512 | Transparent mist overlay for server-owned `fogState == hinted`. It can soften and obscure only. | It contains identifiable buildings, terrain, resources, routes, POIs, coordinates, text, or symbols that imply what scouting will reveal. |
| `fog-locked-heavy-cloud-v1.png` | `expedition_map.fog.locked_unknown` | 512x512 | Heavy generic cloud overlay for locked unknown sectors. It must hide detail rather than tease it. | It reveals silhouettes specific enough to imply resources, ruins, buildings, paths, visit targets, rewards, or action availability. |
| `frontier-dotted-boundary-v1.png` | `expedition_map.fog.frontier_border` | 1024x128 | Transparent dotted/stitched boundary strip for the edge between visible cells and server-provided hinted/locked cells. | It reads as a road, route, arrow, movement instruction, conquest border, military line, trade path, or map-expansion promise. |
| `marker-known-site-plan-v1.png` | `expedition_map.marker.known_site_plan` | 128x192 | Pin for visible reviewed/known site-plan state. | It includes reward/resource icons, hidden outcome hints, text, numbers, quest badges, route language, or action affordances. |
| `marker-hinted-unknown-v1.png` | `expedition_map.marker.hinted_unknown` | 128x192 | Generic hinted unknown pin, preferably abstract compass/veil language rather than a question mark. | It leaks the hidden sector type, resource class, POI identity, danger/combat, exact scout result, or fake objective. |
| `marker-owned-outpost-v1.png` | `expedition_map.marker.owned_outpost` | 128x192 | Pin for a visible server-owned outpost state. | It implies production output, storage, trade, defense, military control, ownership mutation, harvestability, or conquest. |
| `survey-receipt-stroke-v1.png` | `expedition_map.stroke.scout_receipt_trace` | 1024x128 | Transparent decorative receipt/evidence trace. It is not route gameplay. | It has arrows, carts, vehicles, road signs, trade goods, patrol/military marks, pathfinding cues, travel-time cues, or hidden-result hints. |
| `hud-selected-sector-frame-v1.png` | `hud.frame.selected_sector_card` | 640x360 | Empty 16:9 selected-sector card frame with room for app-rendered read-model text. | It bakes in text, labels, icons, buttons, reward/resource bars, timers, formulas, route/trade signs, or fake Atlas/Generated Universe affordances. |

## Review Procedure

1. Confirm filename, slot ID, dimensions, and intended usage match the table above.
2. Inspect the asset at full size, 50 percent, 25 percent, and the expected mobile runtime size.
3. Inspect alpha on a dark checker, light checker, and in-context map/card background.
4. Confirm the asset carries no readable text, logo, watermark, fake UI, or hidden-truth clue.
5. Compare against candidate-02 style direction and the AgentTown style anchor: premium frontier-tech civic map language, human-plus-agent settlement tone, warm painterly materials, scout-report/ledger/receipt provenance flavor, and no literal Wild West genre drift.
6. Record SHA-256, dimensions, prompt/provenance, alpha status, small-size status, reviewer verdict, and any repair/regeneration request.

## Required Review Outcomes

- `ACCEPT_REVIEW_ONLY`: asset is ready to sit in a reviewed reports/media bundle, not runtime.
- `REPAIR_BEFORE_ACCEPT`: asset direction is right but needs cutout, alpha, crop, compression, or small-size cleanup.
- `REGENERATE`: asset violates hidden-truth, text/logo, gameplay-implication, genre, or slot-binding rules.
- `BLOCK_PROMOTION`: asset may be visually strong, but cannot enter a runtime pack until a later explicit runtime-pack lane exists.

## Explicit Guardrails

- No runtime asset promotion.
- No runtime pack directory.
- No runtime loader.
- No server, store, routes, tools, engine, schema, validator, or fixture edits in this lane.
- No Atlas execution.
- No public sharing.
- No real Generated Universe rendering.
- No route, trade, economy, resource, reward, combat, scheduler, hidden-autonomy, cross-plot, or external effect.
- Scout Sector remains the only current Expedition Map mutation path.

## Verification

Passed for this report/proof lane:

- `jq empty reports/agent-town-hq13l-generated-asset-review-rubric-proof-2026-06-01.json`
- `git diff --check -- reports/agent-town-hq13l-generated-asset-review-rubric-2026-06-01.md reports/agent-town-hq13l-generated-asset-review-rubric-proof-2026-06-01.json`

No app build, Playwright, or runtime checks were run because this lane creates only Markdown and JSON report artifacts.
