# Agent Town HQ13C Location Scene Visit Model

Date: 2026-06-01
Lane: HQ13C Location Scene Visit Model
Verdict: RECOMMEND_SCENE_BASED_LOCATION_VISITS

## Scope

This is a report/proof-only architecture lane. It inspected the current Founders Plot scene model, Expedition Map read model, Three.js renderer boundaries, and visual-only actor projection patterns, then proposes the next scene-based world architecture.

No app JavaScript, CSS, server code, tests, assets, routes, tools, Atlas execution, public sharing, or Generated Universe rendering were changed.

## Current Model Observed

Founders Plot already has the right boundary shape for location visits:

- `public/experiences/founders-plot/scene_state.js:1094` builds a `renderer: 'three.js'` scene payload from current server/UI bundle data, not from free-running client simulation.
- Buildings and pads become scene objects with concrete anchors; buildings are not visual-only, while ways, actor routes, encounters, and actor projections are explicitly visual-only (`scene_state.js:511`, `scene_state.js:604`, `scene_state.js:969`, `scene_state.js:1060`).
- Visual actors carry `sourceDomain`, `sourceObjectId`, `sourceStateHash`, `target`, `actionKind`, and `visualOnly: true` so sprites remain a presentation layer over server-owned facts (`server/founders_plot/engine.js:3133`, `server/founders_plot/engine.js:3164`).
- Building-specific sprites are selected through local visual mapping, including farm/quarry/lumber/HQ operators over existing anchors, rather than fabricating gameplay actors (`scene_state.js:467`, `tests-founders-plot/fp-scene-state.test.js:860`).
- The Three.js Founders Plot renderer consumes the scene payload, exposes pick details, and stops visual-only picks from becoming direct gameplay actions (`three_scene_entry.js:1060`, `three_scene_entry.js:1136`, `three_scene_entry.js:1158`).

The HQ12 Expedition Map is also already aligned:

- The server publishes `EXPEDITION_MAP_AUTHORITY_BOUNDARY = server_owned_read_only_expedition_map_fog_of_war_projection_v1` plus read-only party/event packet boundaries (`server/founders_plot/engine.js:19`).
- `buildExpeditionMapReadModel` derives cells from origin plot, scout reports, site plans, settlement claims, owned outposts, scouted sectors, adjacent hints, and locked unknown placeholders (`server/founders_plot/engine.js:1563`).
- The map returns `readOnly: true`, `executableActions: []`, fog semantics/counts, `sourceSummary`, `expeditionParty`, `cells`, `eventPackets`, and a projection receipt (`server/founders_plot/engine.js:1803`).
- The only current Expedition Map mutation is `POST /api/founders-plot/expedition-map/scout-sector`, which reveals one hinted cell and emits a receipt/event packet without route, trade, resource, combat, scheduler, Atlas, cross-plot, public, or external effects (`server/founders_plot/routes.js:96`, `server/founders_plot/engine.js:5209`).
- The frontend suppresses hidden truth for hinted/locked cells and limits the action button to eligible hinted `frontier_hint` cells (`founders-plot.js:1754`, `founders-plot.js:1814`, `founders-plot.js:1562`).
- The Expedition Map Three.js renderer is a bounded renderer over server-owned cells, with pan/zoom/select and no client-fabricated sectors (`three_scene_entry.js:1358`, `three_scene_entry.js:1577`, `three_scene_entry.js:1919`).

## Recommendation

Use a scene-based visit model, not one giant continuous 3D world.

The architecture should be:

1. **Overview Map** - The existing private Expedition Map remains the canonical world overview and fog authority.
2. **Selectable Sector** - A visible `discovered` or `known` sector can expose a visit affordance if the server read model links it to a location scene descriptor.
3. **Visitable Authored Location Scene** - The player opens a contained scene for that sector: authored backdrop, props, local visual-only actors, and inspectable receipts/evidence.
4. **Event/Receipt View** - Selecting scene props or event markers opens read-only event packet, scout receipt, site plan, outpost, or future approved receipt detail.
5. **Return To Map/Town** - The player can return to the Expedition Map or Founders Plot without preserving a global 3D simulation.

This gives Agent Town high-quality authored/generated visuals now, supports future generated packs, and keeps gameplay authority narrow.

## Proposed Data Contracts

### Location Scene Descriptor

`LocationSceneDescriptor.v1` should be server-owned or server-linked, never purely client-invented:

```json
{
  "sceneId": "location_scene_cell_q1_r0_v1",
  "version": "location_scene_descriptor.v1",
  "kind": "authored_location_scene",
  "status": "reviewed",
  "sector": {
    "cellId": "cell_q1_r0",
    "plotId": "plot_current",
    "fogStateRequired": ["known", "discovered"],
    "mapProjectionHash": "..."
  },
  "authorityBoundary": "server_owned_location_scene_descriptor_read_only_v1",
  "readOnly": true,
  "executableActions": [],
  "assetPackRef": {
    "packId": "forest_ridge_location_pack_v1",
    "version": "1.0.0",
    "contentHash": "sha256:..."
  },
  "entryReceipts": [
    { "kind": "scout_sector_receipt", "id": "expedition_scout_...", "readOnly": true }
  ],
  "anchors": [
    { "anchorId": "notice_board", "kind": "receipt_anchor", "x": 0.42, "y": 0.58, "visualOnly": true }
  ],
  "props": [],
  "localActors": [],
  "allowedReadOnlyActions": ["select_anchor", "inspect_receipt", "view_event_packet", "return_to_map", "return_to_town"],
  "mutationGates": []
}
```

Rules:

- `sceneId` must be stable and scoped to a visible sector.
- Hinted and locked sectors may expose only a silhouette/locked preview descriptor, not a visitable scene.
- Scene descriptors must not introduce resources, routes, jobs, timers, rewards, combat state, scheduler work, or cross-plot truth.
- `allowedReadOnlyActions` are UI verbs only; they are not server gameplay actions.

### Asset Pack Manifest

`LocationSceneAssetPack.v1` packages generated art without making it authority:

```json
{
  "packId": "forest_ridge_location_pack_v1",
  "version": "1.0.0",
  "source": "gpt_image_2_generated_private_pack",
  "provenance": {
    "promptRecord": "assets/location-scenes/forest-ridge/prompt.md",
    "generatedAt": "2026-06-01T00:00:00.000Z",
    "reviewedBy": "human"
  },
  "runtimeSlots": {
    "backgroundDesktop": "/experiences/founders-plot/assets/location-scenes/forest-ridge/desktop.webp",
    "backgroundMobile": "/experiences/founders-plot/assets/location-scenes/forest-ridge/mobile.webp",
    "props": [],
    "actors": []
  },
  "presentationOnly": true,
  "stableGameplayHashExcluded": true,
  "contentHash": "sha256:..."
}
```

Rules:

- Asset packs may swap visuals, layout anchors, prop art, and flavor copy.
- They must not set fog state, create sectors, define costs, add rewards, run actions, or alter stable gameplay hash.
- Provenance, prompt records, review status, and content hashes should be first-class because HQ13 wants generated art as swappable content packs rather than one-off decorations.

### Server-Owned Sector Linkage

The future read model can add a field like:

```json
{
  "cellId": "cell_q1_r0",
  "fogState": "known",
  "locationSceneRef": {
    "sceneId": "location_scene_cell_q1_r0_v1",
    "status": "reviewed",
    "visitEnabled": true,
    "readOnly": true
  }
}
```

Rules:

- Linkage belongs beside `expeditionMap.cells[]` or a parallel server read model derived from it.
- `visitEnabled` is true only for `known` / `discovered` cells with enough reviewed descriptor data.
- The client can render a Visit button from this ref, but cannot synthesize the ref for hidden cells.
- Returning from a scene refreshes the authoritative map read model.

### Visual-Only Local Scene Props

Scene props should mirror the current actor projection pattern:

```json
{
  "propId": "prop_scout_notice",
  "kind": "local_scene_prop",
  "sourceDomain": "event_packet",
  "sourceObjectId": "expedition_event_packet_...",
  "sourceStateHash": "...",
  "anchorId": "notice_board",
  "visualState": "inspectable",
  "inspectTarget": {
    "kind": "event_packet",
    "packetId": "expedition_event_packet_..."
  },
  "visualOnly": true,
  "stableGameplayHashExcluded": true
}
```

Rules:

- Props can be selected, highlighted, animated, and inspected.
- Props cannot mutate the map, resources, actors, schedules, routes, claims, or Atlas state.
- Any prop that suggests a future action must point to a disabled `mutationGate`, not silently perform it.

### Allowed Read-Only Actions

Initial location scenes should allow only:

- Select prop/actor/anchor.
- Inspect linked receipt, event packet, site plan, scout report, outpost record, or World Grid read model.
- Toggle local presentation layer or zoom/camera.
- Return to Expedition Map.
- Return to Founders Plot.

These actions must be client/UI state only or GET/read-model refreshes. No new POST action is part of HQ13C.

### Future Explicit Mutation Gates

When a location scene eventually wants gameplay verbs, every verb needs a gate:

```json
{
  "gateId": "gate_mark_site_candidate_v1",
  "label": "Mark Site Candidate",
  "status": "disabled_future",
  "requiredServerAction": "et.plot.mark_site_candidate",
  "requiredRoute": null,
  "requiresHumanApproval": true,
  "requiresIdempotency": true,
  "requiredReceiptKind": "site_candidate_receipt",
  "allowedActorTypes": ["HUMAN", "AGENT_WITH_APPROVAL"],
  "forbiddenEffects": ["routeCreation", "tradeRouteCreation", "resourceHarvesting", "combat", "backgroundScheduling", "atlasExecution", "publicSharing", "crossPlotMutation", "externalEffects"]
}
```

Rules:

- Default status is disabled.
- A gate becomes enabled only after server/store/route/tool/spec implementation, tests, approval policy, idempotency, receipt shape, UI copy, and proof artifacts exist.
- Editor-authored gates are proposals until promoted by source changes.

### In-Game Editor Preview And Approval Flow

Future extension through an in-game agent/editor should follow this promotion path:

1. Agent/player drafts a `LocationSceneDescriptor` and `LocationSceneAssetPack` in the editor.
2. Browser renders a local preview marked `presentationOnly`, `visualOnly`, and `stableGameplayHashExcluded`.
3. Validator checks schema, fog gating, provenance, hidden-truth suppression, and forbidden-effect flags.
4. Human approves a reviewed proposal record.
5. Source/test promotion happens outside the live scene preview path.
6. Server publishes the descriptor/linkage in a read model.
7. Any future mutation gate remains disabled until its explicit server action is implemented and verified.

This is the right pressure for HQ13 without making the editor a hidden engine.

## Tradeoffs

### Scene-Based Visits

Pros:

- Supports GPT Image 2-quality authored scenes and pack swaps without loading an impossible whole-world asset set.
- Keeps mobile performance and QA bounded.
- Matches the current server-owned map/read-model and visual-only projection patterns.
- Makes hidden-truth suppression easier: hidden sectors simply do not have visitable scene truth.
- Creates natural receipt/event views after Scout Sector without inventing travel simulation.
- Lets future in-game editor work draft and preview contained scenes safely.

Cons:

- Less seamless than walking continuously across the entire world.
- Requires good transition UX so map -> scene -> receipt -> return feels intentional.
- Global route continuity has to be represented as receipts/read models, not as uninterrupted physical traversal.

### One Continuous 3D World

Pros:

- Strong fantasy of a single explorable world.
- Easier to sell visually if every part is already authored and optimized.
- Route continuity can be spatially obvious.

Cons:

- Much larger performance, asset, camera, streaming, collision, and QA burden.
- Encourages accidental hidden-truth leaks because faraway cells need some representation.
- Blurs server authority: players and agents may expect movement, routes, harvesting, encounters, and background simulation.
- Harder to make generated packs modular and reviewable.
- Worse fit for current Expedition Map contracts, Scout Sector receipts, Event Packets, and visual-only actors.

## Clear Recommendation

Build HQ13 around scene-based location visits.

Keep the Expedition Map as the authoritative overview and fog gate. Let known/discovered sectors link to contained authored scenes. Let those scenes be rich, inspectable, and generated-art friendly, but keep them read-only until explicit server mutation gates exist. This is the fastest path to the visual quality Robin wants without accidentally turning HQ13 into a continuous-world simulation, route/trade economy, hidden scheduler, or Generated Universe renderer.

## Next Bounded Lanes

1. Draft a formal `LocationSceneDescriptor.v1` schema/report with examples for one known sector and one locked silhouette.
2. Add a report-only asset-pack manifest checklist for generated location scenes and provenance.
3. Later, implement a read-only scene visit proof for one already-known sector, with no new mutation route.

## Guardrails Preserved

- Report/proof only.
- No runtime source edits.
- No new server action.
- No Atlas execution.
- No public sharing.
- No Generated Universe real rendering.
- No hidden autonomy.
- No route/trade/economy/combat/scheduler behavior.
- No packet/party/objective actions.
- No cross-plot mutation or external effects.
- No unrelated dirty-worktree cleanup.
