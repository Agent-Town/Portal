# Agent Town Visual Universe Pack Architecture

Status: HQ13A architecture draft
Date: 2026-06-01
Owner surface: Founders Plot, Expedition Map, Generated Universe records, future in-game editor

## Decision

Agent Town should lean into GPT Image 2.0-quality visuals through packable visual universe systems, not one-off decorations.

A visual universe pack is a presentation bundle that can provide terrain art, fog styling, marker/icon skins, HUD/card art, inhabitant/operator sheets, location scene backdrops, prompt/provenance sidecars, and runtime slot bindings. It does not own gameplay truth. The server still owns map cells, fog state, receipts, actors, jobs, resources, permissions, tools, routes, Atlas graph truth, and every mutation.

The first implementation should be boring on purpose: record, validate, preview, and slot visual packs. Rendering or promotion can happen only after a later explicit slice adds server authority for that specific surface.

## Existing Patterns To Preserve

The current codebase already has most of the safety shape.

- `public/experiences/founders-plot/manifest.json` defines the experience package metadata, route/API prefixes, theme, tools, and metrics. It has no visual pack registry today.
- `public/experiences/founders-plot/scene_state.js` maps canonical server state into renderer objects. Buildings resolve to fixed asset paths, actors resolve through `ACTOR_SPRITE_SHEETS`, actor sprites carry `metadataSrc`, and the returned scene includes fixed runtime slots like `stageBackgrounds`, `objects`, `actors`, `ways`, and `encounters`.
- `server/founders_plot/engine.js` already treats Generated Universe overlay packs as server-owned records with `presentationOnly: true`, `visualOnly: true`, `gameplayMutationPolicy: 'presentation_only'`, `publicSharing: false`, `renderingImplemented: false`, and `authorityBoundary: server_owned_generated_universe_overlay_pack_presentation_only_v1`.
- `engine.js` also emits `expeditionMap` with server-owned fog states and explicit guardrail flags for Event Packets and Expedition Party: read-only, no Atlas execution, no public sharing, no Generated Universe rendering, no route/trade/scheduler/combat/cross-plot/external effects.
- Inhabitant sidecars under `public/experiences/founders-plot/assets/characters/inhabitants/**` contain stable IDs, display names, role facts, `visualOnly`/authority text, sprite frame contracts, action mappings, prompt paths, generation model, provenance, post-processing notes, transparency method, known issues, and constraints.
- Object/card sidecars under `public/experiences/founders-plot/assets/objects/**` use the same pattern for GPT Image 2 art: generated source copy, runtime PNG/WebP, prompt, native size, texture metadata, and constraints.
- `public/assets/icons/agent-town/*manifest.json` proves a sheet-level manifest pattern: one generated source sheet, crop records, stable icon IDs, and scene asset references.
- Reports consistently record scope, changed paths, proof paths, commands, guardrails, residual risks, and no-authority boundaries.

## Pack Types

Use one common manifest shape with typed modules. A pack can include one or more modules.

### `visual_universe_pack`

Top-level pack identity and compatibility.

Required fields:

```json
{
  "packId": "agent-town.founders-plot.baseline-v1",
  "packVersion": "1.0.0",
  "schemaVersion": "agent-town.visual-pack.v1",
  "title": "Founders Plot Baseline",
  "status": "draft",
  "scope": "private_owner_scoped",
  "presentationOnly": true,
  "visualOnly": true,
  "gameplayMutationPolicy": "presentation_only",
  "authorityBoundary": "requires_engine_promotion_for_any_gameplay_effect",
  "publicSharing": false,
  "atlasExecution": false,
  "generatedUniverseRendering": false,
  "modules": {}
}
```

Allowed `status` values:

- `draft`: saved but not approved for runtime preview.
- `previewable`: validated for local/private preview slots.
- `reviewed`: human/team reviewed as presentation content.
- `promoted_visual`: server-authorized for a specific presentation slot only.
- `archived`: retained for audit; not selectable.

No status means gameplay authority. `promoted_visual` still means presentation-only.

### `map_terrain_pack`

Skins Expedition Map terrain and sector surfaces.

Allowed contents:

- terrain tile images keyed by semantic terrain categories such as `woodland_ridge`, `river_flat`, `ruin_signal`, `civic_outpost`, `unknown_edge`;
- close/mid/far semantic zoom variants;
- sector-card background art;
- optional normal/roughness maps for Three.js, if same-origin static assets;
- palette and contrast hints.

Forbidden contents:

- fog state values;
- resource amounts;
- scout eligibility;
- risk truth;
- route connectivity;
- adjacency;
- owned/outpost status.

Runtime input remains `expeditionMap.cells[*]` from the server. The pack can only map an already visible server field to a look.

### `fog_marker_pack`

Skins fog, reveal, scout, receipt, and outpost markers.

Allowed contents:

- `discovered`, `known`, `hinted`, `locked_unknown` visual treatments;
- marker icon assets for `scout_receipt`, `event_packet`, `party_snapshot`, `outpost_owned`, `current_focus`;
- legend swatches;
- animation hints such as pulse speed or reduced-motion fallback.

Forbidden contents:

- hidden cell details;
- client-side reveal rules;
- Scout Sector mutation buttons;
- route or trade markers unless a server read model already exposes them in a later promoted slice.

### `hud_card_pack`

Skins HUD, status cards, receipts, and Atlas-adjacent presentation.

Allowed contents:

- card art for Expedition Board, Scout Report, Site Plan, Event Packet, Expedition Party, Work Order, World Grid, Civic Proposal, and Overlay Pack records;
- icon IDs and same-origin asset paths;
- copy variants for flavor labels that do not explain new mechanics;
- layout density hints for desktop/mobile.

Forbidden contents:

- button/action definitions;
- costs, outputs, timers, gate requirements, formulas, or tool names;
- Atlas node authority;
- public sharing copy unless a later public-pack review lane exists.

### `inhabitant_operator_pack`

Skins canonical visual actors and read-only party/operator members.

Allowed contents:

- sprite sheets and metadata for canonical roles such as `builder`, `worker`, `hauler`, `messenger`, `scout`, `workshop_specialist`, `market_trader`, `settler`, `civic_routekeeper`, `oracle_adjunct`, `outpost_keeper`, `farmer`, `quarry_mason`, `lumber_worker`, and `hq_civic_operator`;
- display names, titles, backstory, voice/copy templates, and animation-set names;
- action mappings from existing server facts to sprite rows;
- portrait/card variants for read-only Expedition Party members.

Forbidden contents:

- persistent citizen rows;
- actor counts that change gameplay meaning;
- autonomous-agent flags;
- tools or handlers;
- permissions;
- job creation;
- resource deltas;
- hidden simulation.

The pack applies after `engine.js` emits canonical `visualActors` and after `scene_state.js` has a stable source object. The pack can replace `assetSrc`, `assetSprite`, label, and animation hints for an existing actor slot only.

### `location_scene_pack`

Skins location-level backdrops and building/object surfaces.

Allowed contents:

- Founders Plot desktop/mobile stage backgrounds;
- building skins for already canonical building types;
- pad, lot, prop, and receipt object skins;
- location mood lighting and material hints.

Forbidden contents:

- pad layout;
- buildability;
- building definitions;
- unlocks;
- HQ levels;
- object selection actions;
- route topology.

## Runtime Slots

Packs bind to named slots, not arbitrary DOM selectors or engine fields.

Initial slot registry:

| Slot | Source truth | Pack module | Example binding |
| --- | --- | --- | --- |
| `founders_plot.stage.background.desktop` | scene adapter | `location_scene_pack` | `stageBackgrounds.desktop` |
| `founders_plot.stage.background.mobile` | scene adapter | `location_scene_pack` | `stageBackgrounds.mobile` |
| `founders_plot.building.<TYPE>` | server building type | `location_scene_pack` | `assetForBuilding()` replacement |
| `founders_plot.pad.empty` | server pad state | `location_scene_pack` | empty-lot skin |
| `founders_plot.actor.<canonicalRoleId>` | `visualActors` | `inhabitant_operator_pack` | actor sprite sheet |
| `founders_plot.party.member.<role>` | `expeditionMap.expeditionParty` | `inhabitant_operator_pack` | party portrait/sheet |
| `expedition_map.terrain.<terrainKey>` | server cell terrain/status | `map_terrain_pack` | sector tile |
| `expedition_map.fog.<fogState>` | server fog state | `fog_marker_pack` | fog material/swatches |
| `expedition_map.marker.<markerKind>` | server receipt/read model | `fog_marker_pack` | marker icon |
| `hud.card.<surfaceId>` | server read model | `hud_card_pack` | card art |
| `atlas.node_icon.<nodeKind>` | canonical Atlas graph | `hud_card_pack` | icon only, non-executable |

Runtime loaders must fail closed:

1. Validate pack manifest.
2. Resolve only same-origin static asset URLs.
3. Check every requested slot against the slot registry.
4. Reject unknown slots, unknown canonical roles, mutation-looking fields, external URLs, tool/action names, and public-sharing flags.
5. If validation fails, keep default Agent Town visuals.

## Manifest Layout

Suggested repo layout when implementation begins:

```text
public/experiences/founders-plot/visual-packs/
  founders-plot-baseline/
    pack.manifest.json
    map/
    fog/
    hud/
    inhabitants/
    locations/
    prompts/
    provenance/
```

This HQ13A lane does not create that directory. It only defines the contract.

Manifest module example:

```json
{
  "modules": {
    "inhabitants": {
      "type": "inhabitant_operator_pack",
      "slotBindings": {
        "founders_plot.actor.scout": {
          "assetSrc": "/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png",
          "metadataSrc": "/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json",
          "actionMapping": {
            "SCOUT": "scout",
            "SCOUT_REPORT_READY": "ready"
          }
        }
      }
    }
  }
}
```

## Prompt And Provenance Sidecars

Every generated asset should have a sidecar set, even if the runtime only loads the optimized image.

Required sidecars per generated asset:

- `<asset>.prompt.md`: private prompt brief, redacted if needed.
- `<asset>.json`: machine-readable metadata.
- `<asset>.generated.png`: original generated output copy when available.
- `<asset>.source.png`: post-processed source when applicable.
- runtime asset: `.png` and/or `.webp`.

Required metadata fields:

```json
{
  "id": "pathfinder-scout-v1",
  "packId": "agent-town.founders-plot.baseline-v1",
  "slotIds": ["founders_plot.actor.scout"],
  "visualOnly": true,
  "presentationOnly": true,
  "authorityBoundary": "visual_only_projection_of_server_state",
  "model": "openai/gpt-image-2",
  "prompt": "pathfinder-scout-v1.prompt.md",
  "sourceImage": "pathfinder-scout-v1.source.png",
  "generatedImage": "pathfinder-scout-v1.generated.png",
  "image": "pathfinder-scout-v1.png",
  "webp": null,
  "nativeGeneratedSize": { "width": 2048, "height": 2048 },
  "runtimeSize": { "width": 2048, "height": 2048 },
  "generationNotes": {
    "sourceProvenance": "local-openclaw-media-or-generated-images-path",
    "postProcessing": [],
    "knownIssues": [],
    "constraints": [
      "visual-only",
      "no gameplay authority",
      "no public sharing",
      "no Atlas execution"
    ]
  }
}
```

Prompt sidecars should be private by default. Public prompt sharing needs a later explicit review lane.

## Versioning

Use three version layers:

- `schemaVersion`: validation contract, for example `agent-town.visual-pack.v1`.
- `packVersion`: semver for the content pack.
- `assetRevision`: per-asset revision, for example `pathfinder-scout-v1.0.2`.

Compatibility rules:

- Patch versions can fix metadata, compression, alpha cleanup, and proof references without changing slot semantics.
- Minor versions can add assets or optional slots.
- Major versions can change style direction or replace slot families, but must keep the same authority boundary unless a separate server promotion spec exists.
- Runtime should record the selected `packId`, `packVersion`, manifest digest, and slot binding digest in preview/proof records.

## Promotion Model

Promotion is two-stage and intentionally asymmetric.

1. **Content promotion:** a pack moves from `draft` to `reviewed` or `promoted_visual`. This only authorizes presentation slot use.
2. **Gameplay promotion:** a separate engine/server/store/tool slice introduces a new canonical feature. Visual packs cannot do this.

The pack manifest must never be the source of:

- costs;
- unlocks;
- resources;
- fog transitions;
- scout eligibility;
- route/trade/economy behavior;
- combat;
- schedules;
- work-order execution;
- Atlas executable actions;
- cross-plot mutation;
- public sharing.

If a future pack wants a mechanical effect, it must be treated as a proposal. The engine implementation, tests, route/tool contract, and canonical Atlas graph come first; the pack can then skin the new server-owned slots.

## Future In-Game Editor Hooks

The eventual player flow should happen inside the game through an agent-assisted editor, but not by making Atlas or genAI executable today.

Future flow:

1. **Propose**
   - A player asks an in-game agent for a visual variant.
   - The agent creates a `visual_pack_proposal` record with target slots, prompt briefs, safety constraints, and no runtime writes.
   - Required flags: `status: draft`, `presentationOnly: true`, `authorityBoundary: requires_human_review`, `atlasExecution: false`.
2. **Generate**
   - A bounded generation worker may create candidate images and sidecars in a private staging area.
   - The worker receives only prompt briefs and allowed slot IDs, not server credentials, tools, Atlas executors, or mutation authority.
3. **Preview**
   - The editor mounts the pack in a local/private preview renderer.
   - Preview compares before/after visuals and records a proof digest.
   - Preview cannot POST gameplay routes, reveal fog, run Atlas actions, or publish assets.
4. **Approve**
   - Human approval changes proposal status to `reviewed` or `promoted_visual` for specified slots.
   - Approval records reviewer, timestamp, manifest digest, assets, prompt redaction level, and guardrail checklist.
5. **Commit**
   - Commit writes only pack records/assets/slot binding preferences.
   - Server stable gameplay hash, inventory, jobs, resources, event count, fog truth, and Atlas executable state must remain unchanged.

Editor tools can summarize, rank, tag, rewrite, and generate presentation proposals. They cannot claim land, create routes, change resources, alter fog, grant permissions, run work orders, or make generated universes real shared rendering.

## Validation Checks

Future implementation should add focused tests before any runtime pack loading:

- manifest schema rejects unknown modules, slots, external URLs, action/tool fields, public sharing, Atlas execution, and gameplay mutation fields;
- enabling a pack leaves gameplay stable hash unchanged;
- enabling a pack leaves inventory, buildings, jobs, permissions, approvals, event count, expedition fog, Event Packets, Expedition Party, and Atlas executable flags unchanged;
- hidden/locked Expedition Map cells do not reveal truth through terrain art, labels, marker art, prompt metadata, alt text, or sidecar text surfaced in UI;
- reduced motion can render static markers/sprites;
- invalid packs fail closed to default Agent Town assets;
- prompt/provenance sidecars are stored privately and not embedded into public UI;
- same pack digest produces deterministic slot bindings.

## Guardrails

This architecture explicitly preserves:

- no new gameplay authority;
- no Atlas execution;
- no public sharing;
- no real Generated Universe rendering;
- no autonomous operations;
- no route/trade/economy/combat/scheduler behavior;
- no resource harvest/gain/loss from packs;
- no hidden fog leakage;
- no cross-plot mutation;
- no external effects;
- no generated pack ownership of account identity, Brain/provider settings, API credentials, wallet data, tools, or server handlers.

## HQ13A Verdict

Proceed with visual universe packs as a manifest-and-slot architecture. The next safe slice is a schema/report/proof or read-only manifest validator lane. Do not wire runtime rendering, pack selection UI, generation workers, or editor commits until a separate bounded task owns that surface.
