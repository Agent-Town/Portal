# Agent Town HQ13Y Runtime Composition Port Plan

Date: 2026-06-01
Lane: HQ13Y runtime composition port plan
Verdict: `READY_FOR_BOUNDED_RUNTIME_PROTOTYPE`

## Summary

HQ13W is the current visual target for AgentTown's Expedition Map style:
frontier-tech civic materials, scout ledger/receipt language, beacon/plan-wagon
cues, and named human-plus-agent party flavor. HQ13F is the current runtime
renderer spine: it already consumes the server-owned `expeditionMap.cells` read
model, exposes visual-layer proof metadata, supports pan/zoom/select, and keeps
`clientAuthority: false`.

The safe production-facing next step is a bounded runtime prototype that ports
HQ13W's composition into the existing Three.js renderer and surrounding
Founders Plot Expedition Map shell. This should not promote the HQ13K/P/Q/T/W
review assets into a runtime visual pack yet. It should first recreate the
style direction with same-origin procedural renderer primitives and CSS/HUD
composition so the project can test visual quality without changing gameplay
authority.

## Current Runtime Anchors

- `public/experiences/founders-plot/three_scene_entry.js`
  - `EXPEDITION_VISUAL_SHELL_VERSION` records the current visual pass.
  - `expeditionFogStyle`, `makeExpeditionCellTexture`,
    `makeExpeditionMarkerTexture`, `makeExpeditionFogTexture`,
    `makeExpeditionEdgeFogTexture`, and `makeExpeditionMapTexture` are the
    main procedural visual seams for a no-asset-promotion prototype.
  - `ExpeditionMapRenderer.sync()` and `rebuild()` already take `model.cells`,
    selected cell id, camera bounds, visual layers, pick targets, and proof
    metadata from read-only state.
- `public/experiences/founders-plot/founders-plot.js`
  - `renderExpeditionMapThreeSurface()` mounts the Three.js map.
  - `appendExpeditionSemanticZoomOverlay()` is the right place to carry the
    scout-ledger/receipt/header treatment around the canvas.
  - `renderExpeditionMap()` already owns the selected-sector card, Event
    Packet, Expedition Party, Current focus strip, fog legend, and Scout Sector
    affordance.
- `public/experiences/founders-plot/founders-plot.css`
  - `.fp-expedition-three-host`, `.fp-expedition-semantic-zoom`,
    `.fp-expedition-objective-strip`, `.fp-expedition-party`, fog legend, and
    selected-sector card styles are the first CSS targets for the HQ13W shell.
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
  - Already proves nonblank canvas, visual-layer metadata, fog-state color
    separation, selected-cell hidden-truth suppression, semantic zoom, pan/zoom,
    and mobile bounded layout.

## Port Plan

1. Create a new runtime visual shell id, for example
   `hq13y_agenttown_runtime_composition_prototype_v1`.
2. Keep the renderer input exactly the existing `expeditionMap.cells` read
   model. No new read-model fields are required for the prototype.
3. Update procedural map base texture to match HQ13W:
   timber/brass/parchment/worn teal, civic map-paper grain, beacon glows, plan
   wagon camp/ledger cues, and lighter stitched frontier boundary language.
4. Update cell/fog/marker primitives procedurally:
   - discovered/owned: warm civic settlement node, no production claims.
   - known: reviewed/scouted receipt node, no extra resource truth beyond the
     server-selected card.
   - hinted: soft scout-mist edge, Scout Sector eligible only when server says
     so.
   - locked unknown: sealed cloud bank with no object/resource/route clues.
5. Update survey strokes to read as receipt traces, not roads:
   keep `routeAuthority: false`, `visualOnly: true`, and avoid arrows, trade
   goods, direction cues, or route labels.
6. Update the surrounding HUD composition to borrow HQ13W's scout-ledger layout:
   compact header, Current focus receipt strip, named party roster, selected
   sector card, and fog legend with the same AgentTown identity anchor.
7. Extend proof metadata without creating authority:
   add fields such as `agentTownIdentityCues`, `scoutLedgerHud`,
   `beaconPlanWagonCues`, `receiptTraceVisualOnly`,
   `frontierBoundaryVisualOnly`, and keep `clientAuthority: false`.
8. Extend the focused Playwright proof, not the server:
   assert the new visual shell id, nonblank canvas, color separation, mobile
   no-overflow, no hidden truth leakage, and existing Scout Sector-only mutation
   path.

## Non-Goals

- No runtime asset pack directory.
- No runtime pack loader.
- No visual-pack manifest promotion.
- No copying HQ13K/P/Q/T/W report-media assets into production paths.
- No server/store/routes/tools/engine/schema changes.
- No new Expedition Map mutation path.
- No Atlas execution, Generated Universe rendering, public sharing, scheduler,
  route/trade/economy/resource/reward/combat behavior, cross-plot mutation, or
  external effects.

## Acceptance Gates For The Next Prototype

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `npm run build:founders-plot-threejs`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- Focused Playwright `FP-E2E-023`
- Existing Expedition Map UI proof `FP-E2E-022`
- Screenshot proof at desktop and mobile sizes
- Proof JSON with:
  - new visual shell id
  - nonblank canvas samples
  - visual-layer flags
  - `clientAuthority: false`
  - `surveyStrokesVisualOnly: true`
  - no route creation
  - no hidden truth leakage
  - Scout Sector remains the only current mutation path
- Focused `git diff --check`

## Recommendation

Do HQ13Y as a source-changing runtime prototype only after this plan. Keep it
bounded to `three_scene_entry.js`, rebuilt `three_scene_bundle.js`, focused CSS
for the Expedition Map shell if needed, the focused e2e proof, report/proof
artifacts, and screenshots. Do not move any report-media PNGs into runtime
paths until Robin explicitly approves an asset-promotion lane.

## Guardrails

- Report/proof-only in this lane.
- No app/source edits in this lane.
- No runtime asset promotion.
- No runtime visual-pack manifest, directory, or loader.
- No server/store/routes/tools/engine/schema edits.
- No Atlas execution.
- No public sharing.
- No Generated Universe rendering.
- No hidden autonomy.
- No route, trade, economy, resource, reward, combat, scheduler, cross-plot, or
  external effect.
- No road, route, trade, conquest, cowboy, saloon, or gold-rush drift.
- Scout Sector remains the only current Expedition Map mutation path.
