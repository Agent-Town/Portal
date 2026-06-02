# AgentTown HQ16E Runtime Visual Pack Backlog

Date: 2026-06-02
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Base checkpoint: `1f6773e Add AgentTown direct map command preview`
Lane: HQ16E Runtime Visual Pack Backlog
Verdict: `PASS_REPORT_ONLY_BACKLOG_NO_RUNTIME_PROMOTION`

## Scope

This lane defines the next generated/runtime visual asset slots that should move
the Expedition Map toward the GPT Image 2 north-star while staying packable,
provenance-rich, same-origin, server-slot-bound, and presentation-only.

No images were generated. No runtime assets were promoted. No source, e2e,
server, renderer, CSS, Atlas, Generated Universe, deployment, commit, push, or
public-sharing path was changed.

## Source Reports Reviewed

- `reports/agent-town-hq16-next-lanes-register-2026-06-02.md`
- `reports/agent-town-hq16a-direct-map-command-preview-2026-06-02.md`
- `reports/agent-town-hq16c-guided-expedition-loop-2026-06-02.md`
- `reports/agent-town-hq16d-location-visit-layer-preflight-2026-06-02.md`
- `reports/agent-town-hq15e-runtime-sprite-pack-2026-06-02.md`
- `reports/agent-town-hq15e-expedition-unit-marker-asset-sheet-review-2026-06-02.md`
- `reports/agent-town-hq15d-event-objective-map-markers-2026-06-02.md`
- `reports/agent-town-hq14t-server-bound-terrain-underlay-runtime-2026-06-01.md`
- `reports/agent-town-hq14s-runtime-promotion-implementation-plan-2026-06-01.md`
- `reports/agent-town-hq14r-runtime-promotion-gate-2026-06-01.md`
- `reports/agent-town-hq14q-terrain-pack-review-samples-2026-06-01.md`
- `reports/agent-town-hq14p-north-star-terrain-world-underlay-review-candidates-2026-06-01.md`
- `reports/agent-town-hq14o-north-star-terrain-asset-preflight-2026-06-01.md`
- `reports/agent-town-hq13a-visual-universe-pack-architecture-2026-06-01.md`
- `reports/agent-town-hq13d-visual-pack-schema-validator-2026-06-01.md`
- `reports/agent-town-hq13e-candidate-02-asset-extraction-plan-2026-06-01.md`
- `reports/agent-town-hq13c-location-scene-visit-model-2026-06-01.md`
- `reports/agent-town-hq13l-generated-asset-review-rubric-2026-06-01.md`
- `reports/agent-town-hq13m-generated-asset-qa-harness-2026-06-01.md`
- `reports/agent-town-hq13r-runtime-scale-review-2026-06-01.md`
- `reports/agent-town-hq13y-runtime-composition-port-plan-2026-06-01.md`
- `docs/specs/agent-town-visual-universe-pack-architecture.md`
- `public/experiences/founders-plot/assets/expedition-map/hq14s-public-terrain-underlay-v1/manifest.json`
- `public/experiences/founders-plot/assets/expedition-map/hq15e-expedition-unit-marker-sprites-v1/manifest.json`

## Current Asset Baseline

Already promoted runtime packs:

- `hq14s_public_terrain_underlay_v1`: same-origin terrain/fog underlay pack.
  Concrete visible terrain slots are limited to `field`, `forest`, `ridge`, and
  `settled`; hidden cells use fog-only slots.
- `hq15e_expedition_unit_marker_sprites_v1`: same-origin 512x512 sprites for
  Scout, Settler Convoy, Surveyor, Courier, Outpost Crew, Objective Beacon,
  Event Packet, and Receipt Ledger.

Still review-only or planning inputs:

- HQ13 candidate-02 fog/marker/HUD visual assets and runtime-scale review.
- HQ14 north-star terrain/world underlay candidates.
- HQ13C location visit model and asset-pack descriptor plan.

HQ16E should therefore focus on slots that are not already covered by HQ14/HQ15:
command outcome effects, state variants for receipts/events/objectives, first
location visit thumbnails, and UI frames that support HQ16A/HQ16B command
preview/outcome feedback.

## Runtime Law For Every Slot

Every slot below must follow this rule:

1. Review generation may produce files only under `reports/media/...` with
   prompt, model, dimensions, SHA-256, reviewer verdict, and negative constraints.
2. Runtime promotion is a later explicit lane. It requires a same-origin asset
   directory under `public/experiences/founders-plot/assets/...`, a manifest,
   proof metadata, focused e2e gates, and `jq`/image checks.
3. The renderer may bind an asset only to a server-owned read-model fact or a
   validated client UI state over a server-owned fact. It may not infer hidden
   terrain, routes, resources, rewards, risks, future outcomes, or actions from
   art.
4. Hidden, hinted, and locked cells stay sealed. Art can obscure or decorate
   their current public state; it cannot hint at what will be revealed.
5. Visual packs remain `presentationOnly`, `visualOnly`, same-origin, and
   blocked from Atlas execution, Generated Universe runtime expansion, public
   sharing, hidden autonomy, route/trade/economy/resource/reward/combat/scheduler
   behavior, cross-plot mutation, and external effects.

## Prioritized Backlog

### P0 - Command Outcome Effects

These should be generated/reviewed first because HQ16B is about making confirmed
commands visible on the map before the player reads drawers or toasts.

| Slot | Purpose | Dimensions / format | Manifest and provenance needs | Runtime binding rule | Hidden-truth / authority guardrail |
| --- | --- | --- | --- | --- | --- |
| `expedition_map.effect.scout_sector_reveal_pulse.v1` | A short civic glow/veil-peel effect on the cell that was just revealed by Scout Sector. | Review source 1024x1024; runtime 512x512 RGBA PNG or 4-frame 1024x256 PNG strip plus reduced-motion still. | Prompt record, source image, runtime crop, frame count, alpha check, SHA-256, slot id, `effectKind: scout_sector_confirmed`. | Play only after the existing Scout Sector endpoint returns a server read model where the target cell is now `known` or `discovered`, and proof identifies the changed cell id. | Never preview a reveal outcome before server confirmation. Do not show terrain/resources/routes inside the effect; the new server cell state decides what appears beneath it. |
| `expedition_map.effect.scout_move_arrival_ripple.v1` | Arrival ripple/footstep focus for bounded Scout movement so the unit relocation feels immediate. | Review source 1024x1024; runtime 512x512 RGBA PNG or 4-frame 1024x256 strip. | Prompt, source/runtime files, `sourceCommand: move_unit`, same-origin path, digest, reduced-motion fallback. | Play only after the existing move endpoint returns the Scout unit on the destination cell from server state. | No path line, route arrow, travel time, terrain cost, or future move hint. It marks the server-confirmed destination only. |
| `expedition_map.effect.prepare_convoy_ready_stamp.v1` | Stamp/plan-paper flourish when Surveyor `prepare_settler_convoy` succeeds and a convoy/outpost-ready state becomes visible. | Review source 1024x1024; runtime 512x512 RGBA still or 3-frame 768x256 strip. | Prompt, crop, alpha result, `slotIds`, `reviewedBy`, no readable text, no fake seal labels. | Bind to the existing guarded prepare-convoy response plus the visible server command/result state for the reviewed site/convoy. | Must not imply route creation, production, trade, resource costs, or an unreviewed hidden site result. |
| `expedition_map.effect.found_outpost_civic_beacon.v1` | Small beacon burst on the visible cell when Settler `found_settlement` succeeds. | Review source 1024x1024; runtime 512x512 RGBA PNG or 4-frame 1024x256 strip. | Prompt/provenance, digest, `effectKind: found_settlement_confirmed`, alpha and mobile-size checks. | Play only after the existing Found Outpost endpoint returns a visible owned outpost/settled state for that cell. | No production icons, defense/combat signs, trade routes, reward coins, ownership mutation beyond server-owned status. |
| `hud.frame.command_preview_panel.v1` | Empty 9-slice frame for HQ16A direct command preview and future HQ16B result confirmation panel. | 512x512 9-slice source, optional 640x360 empty panel PNG/WebP, 48x48 corner slices. | Prompt, slice guide, no baked labels/buttons, digest, `hudSurface: command_preview`. | Bind only to validated command preview UI state derived from current server command hints; it cannot create or enable commands. | No action IDs, route names, costs, timers, rewards, or fake confirmation text baked into the art. |

### P1 - Event, Receipt, And Objective State Markers

These extend the HQ15E marker pack from "object exists" to "result state is
legible" without adding actions.

| Slot | Purpose | Dimensions / format | Manifest and provenance needs | Runtime binding rule | Hidden-truth / authority guardrail |
| --- | --- | --- | --- | --- | --- |
| `expedition_map.marker.event_packet.new.v1` | Make a newly created visible Event Packet stand out after command resolution. | 256x256 RGBA source and 128x128 runtime PNG/WebP; optional 64x64 mobile. | Prompt, digest, `markerKind: event_packet`, state variant, alpha check, small-size review. | Bind only to server `eventPackets[]` records that already target a visible/known cell. | No unread-count invention unless the server exposes that state. No hidden packet targets or future event outcomes. |
| `expedition_map.marker.receipt.confirmed.v1` | Confirmed receipt badge for ledger/receipt markers after a command resolves. | 256x256 source; runtime 128x128 PNG/WebP. | Prompt/provenance, no text, no numbers, `receiptState: confirmed`, digest. | Bind to visible server receipt/event record ids or command result receipts only. | Does not imply reward, unlock, resource, or route completion beyond the visible receipt existence. |
| `expedition_map.marker.objective.just_completed.v1` | Brief objective completion marker over the server-known objective target. | 256x256 source; runtime 128x128 PNG/WebP or 3-frame strip. | Prompt, digest, `objectiveState: just_completed`, reduced-motion fallback. | Bind only when the UI can compare prior/current server read models and a current-focus target is satisfied. | No reward/unlock art. Do not fabricate objective completion if server state has not changed. |
| `hud.icon.command_result_set.v1` | Compact icon set for result categories: moved, revealed, convoy-ready, outpost-founded. | 4 icons at 128x128 source, 64x64 runtime PNG/WebP. | Per-icon prompt/provenance or sheet crop manifest, slot ids, digests. | Bind to command result category reported by existing frontend handlers over server responses. | Icons are receipt labels only; they do not define command availability, costs, or server actions. |

### P1 - Location Visit Thumbnails And First Scene References

Generate these as review-only assets alongside HQ16D, but do not promote them
until a server-owned `locationSceneRef` or equivalent descriptor exists.

| Slot | Purpose | Dimensions / format | Manifest and provenance needs | Runtime binding rule | Hidden-truth / authority guardrail |
| --- | --- | --- | --- | --- | --- |
| `location_scene.thumbnail.scout_sector_packet_overlook.v1` | First review thumbnail for the HQ16D-safe visit layer: a known Scout Sector cell with a read-only Event Packet/receipt anchor. | Review source 2048x1152; runtime candidate 1024x576 WebP/PNG and 512x288 thumbnail. | Prompt, model, source, crop, digest, `sceneKind: scout_sector_packet`, `reviewOnly: true`, event/receipt anchor-safe zones. | Runtime only for a server-known/discovered cell whose `sourceTruth` or event linkage comes from Scout Sector and whose visible `eventPacket` is read-only with zero executable actions. | Must not show resources, rewards, route exits, combat, hidden POIs, neighboring hidden-cell truth, or visit affordances for hinted/locked cells. |
| `location_scene.thumbnail.known_site_plan_clearing.v1` | Later review thumbnail for a known/discovered reviewed site-plan place. | Review source 2048x1152; runtime candidate 1024x576 WebP/PNG and 512x288 thumbnail. | Prompt, model, source, crop, digest, `sceneKind: known_site_plan`, `reviewOnly: true`. | Wait for server `locationSceneRef` or an explicit reviewed-site visit gate. Do not make every visible site plan visitable by client rule. | Must not show resources, rewards, route exits, combat, hidden POIs, or unapproved build outcomes. |
| `location_scene.thumbnail.owned_outpost_arrival.v1` | Review thumbnail for the first owned outpost arrival/receipt scene. | Review source 2048x1152; runtime 1024x576 plus 512x288. | Prompt/provenance, outpost visual constraints, digest, mobile crop note. | Runtime only for visible `OWNED_OUTPOST` or equivalent server-owned outpost state with reviewed descriptor. | No production/storage/trade/defense claims, no extra buildings beyond server-visible status. |
| `location_scene.thumbnail.scout_receipt_overlook.v1` | A read-only scout report / overlook scene thumbnail for a just-revealed sector. | Review source 2048x1152; runtime 1024x576 plus 512x288. | Prompt/provenance, receipt linkage note, digest, hidden-truth checklist. | Runtime only for a visible scout receipt/event packet linked to a known/discovered target cell. | Shows the public mood of a revealed sector only. It cannot foreshadow hidden neighboring cells or exact future Scout Sector outcomes. |
| `location_scene.background.known_site_plan_desktop_mobile.v1` | Full visit-layer backdrop pair for a contained known-site scene. | Desktop 1600x900 or 1920x1080 WebP; mobile 900x1600 WebP; source 2048x1152 and/or portrait source. | Full location scene asset-pack manifest, prompt, generated/source/runtime images, anchor-safe zones, digests. | Wait for HQ16D descriptor contract and server linkage before runtime. | No visit button or scene truth for hinted/locked cells. Props and anchors must be visual-only/read-only. |

### P2 - Terrain And Fog State Refinements

HQ14T already promoted a safe first terrain pack. The next terrain work should
be state refinements, not broad new geography, unless the server exposes new
public terrain slots.

| Slot | Purpose | Dimensions / format | Manifest and provenance needs | Runtime binding rule | Hidden-truth / authority guardrail |
| --- | --- | --- | --- | --- | --- |
| `expedition_map.fog.hinted_frontier_veil.v2` | Higher-quality hinted overlay that matches the north-star map while staying generic. | 512x512 transparent PNG/WebP, 1024x1024 source. | Prompt, alpha QA, digest, `fogState: hinted`, no object silhouettes. | Bind only to server `fogAssetSlot: hinted_frontier_fog` or `fogState == hinted`. | Must hide detail and avoid terrain/resource/route silhouettes. |
| `expedition_map.fog.locked_unknown_cloud.v2` | Stronger locked-unknown cloud bank for sealed cells. | 512x512 transparent PNG/WebP, 1024x1024 source. | Prompt, alpha QA, digest, `fogState: locked_unknown`. | Bind only to server `fogAssetSlot: locked_unknown_fog` or `fogState == locked_unknown`. | No identifiable terrain, buildings, ruins, water, routes, rewards, or action hints. |
| `expedition_map.terrain.reviewed_site_clearing.v1` | Visible terrain accent for reviewed site-plan cells. | 512x512 PNG/WebP, 1024x1024 source. | Prompt, digest, allowed server slot, no resource icons. | Wait until the server exposes a normalized public terrain/status slot such as `reviewed_site` or maps reviewed-site status into an allowed visual slot. | Do not infer site state from text or hidden cell template. No costs/rewards/outcomes. |
| `expedition_map.terrain.owned_outpost_camp.v1` | Visible outpost terrain accent with civic camp tone. | 512x512 PNG/WebP, 1024x1024 source. | Prompt/provenance, digest, same-origin path, `requiresPublicTerrainAssetSlot`. | Bind only to visible server-owned outpost/settled terrain slot. | No production, storage, route, defense, trade, combat, or upgrade-state implication. |
| `expedition_map.terrain.water_edge_public.v1` | Water/river edge tile for future richer geography. | 512x512 tile plus 1024x256 strip. | Prompt/provenance, explicit blocked-until-server-truth note. | Wait until server exposes explicit public water/river/coast truth; currently blocked by HQ14R/HQ14T precedent. | Must not be generated for runtime promotion now. No hidden coastline/world shape leakage. |

### P2 - UI Frames, Swatches, And Controls

These are low-risk if generated empty, but they should follow actual UI needs
instead of becoming a decorative skin dump.

| Slot | Purpose | Dimensions / format | Manifest and provenance needs | Runtime binding rule | Hidden-truth / authority guardrail |
| --- | --- | --- | --- | --- | --- |
| `hud.frame.receipt_ledger_drawer.v1` | Empty frame for collapsed/expanded receipt and proof drawers. | 512x512 9-slice source, 640x360 panel background. | Prompt, slice guide, digest, no baked labels/buttons. | Bind to existing ledger/drawer surfaces only. | Cannot add proof text, routes, public share, Atlas, costs, or executable controls. |
| `hud.swatch.fog_state_set.v1` | Four visual swatches for discovered, known, hinted, locked. | 4x 64x64 PNG/WebP or 256x64 sheet. | Prompt/sheet crop manifest, per-swatch slot ids, digest. | Bind to server fog states and counts already present in the read model. | Swatches represent state categories only; they do not explain reveal rules or eligibility. |
| `hud.icon.command_type_set.v1` | Icon-only controls for move, scout, prepare convoy, found outpost. | 4x 128x128 source, 64x64 runtime. | Prompt/provenance, icon ids, no text, digest. | Bind only to server command hints already rendered by the command bar/preview. | Icons cannot create hidden commands, target cells, costs, routes, or disabled future actions. |
| `hud.frame.map_control_cluster.v1` | Small frame/chrome around zoom/reset/pan controls. | 256x128 strip, 48x48 button frame slices. | Prompt, slice notes, no embedded labels, digest. | Bind only to existing camera controls; controls remain client presentation state. | No gameplay implication, no map reveal, no Scout action, no hidden state. |

## First Asset Batch Recommendation

Generate/review this batch first, under `reports/media/...` only:

1. `expedition_map.effect.scout_sector_reveal_pulse.v1`
2. `expedition_map.effect.scout_move_arrival_ripple.v1`
3. `expedition_map.effect.prepare_convoy_ready_stamp.v1`
4. `expedition_map.effect.found_outpost_civic_beacon.v1`
5. `hud.frame.command_preview_panel.v1`

Why this batch:

- It directly supports HQ16B's "confirmed command feels visible on the map"
  goal.
- It requires no new terrain taxonomy, no location scene descriptor, no new
  command route, and no new hidden-world facts.
- Every effect can bind to an existing server-confirmed command outcome:
  Scout Sector, Scout move, Prepare Convoy, and Found Outpost.
- The preview frame improves HQ16A/HQ16B without defining actions or mechanics.

If capacity is only three assets, start with Scout Sector reveal, Scout move
arrival, and Found Outpost beacon. Those cover the most player-visible command
outcomes.

## Assets That Should Wait

- `location_scene.background.known_site_plan_desktop_mobile.v1` should wait for
  a descriptor/linkage contract beyond HQ16D's first Scout Sector packet visit
  panel. Review thumbnails are fine; runtime backdrops are not.
- `expedition_map.terrain.water_edge_public.v1` should wait for explicit
  server-owned public water/river/coast truth.
- Any route/path/trade road art should wait until a server-owned route read model
  exists. Current survey/receipt strokes are not routes.
- Reward, resource, economy, production, storage, combat, timer, job, or unlock
  markers should wait because those mechanics are not part of the current
  Expedition Map authority.
- Alternate full-world underlays should wait until the current HQ14T terrain
  pack's server-slot proof needs a versioned replacement; broad underlays can
  otherwise make hidden geography look more specific than the read model.

## Review-Only Generation vs Runtime Promotion

Review-only generation is allowed in a later explicit art lane when it:

- writes to `reports/media/...` only;
- records prompt, model, source image, runtime target dimensions, SHA-256,
  reviewer verdict, alpha/small-size checks, and hidden-truth review notes;
- keeps `runtimePromotion: false`;
- does not add runtime loaders, manifests, source code, server fields, e2e tests,
  public asset directories, or generated images to the app runtime.

Runtime promotion is a separate gate. It requires:

- a same-origin runtime asset directory and manifest;
- explicit `presentationOnly`, `visualOnly`, `serverOwnedReadModelRequired`, and
  authority guardrail fields;
- slot ids that already exist in the slot registry or are added by an explicit
  schema/spec lane;
- renderer binding to server-owned fields or validated UI state over server
  fields;
- proof metadata reporting slot id, asset path, source server fact, visual-only
  flags, and hidden-cell/fog handling;
- focused Playwright coverage for visible outcome and hidden-truth suppression;
- `jq empty` on manifest/proofs, image file checks, build/syntax checks, and
  `git diff --check`.

HQ16E performs neither generation nor promotion. It is the backlog and gate map.

## Guardrails Held

- No image generation.
- No runtime promotion.
- No source, e2e, server, renderer, CSS, Atlas, Generated Universe, or asset
  directory edits.
- No Scout Sector authority change.
- No hidden-truth leakage, hidden autonomy, route/trade/economy/resource/reward/
  combat/scheduler/cross-plot behavior, external effects, deploy, merge, commit,
  push, or public share.

## Verification

Expected for this report-only lane:

- `jq empty reports/agent-town-hq16e-runtime-visual-pack-backlog-proof-2026-06-02.json`
- `git diff --check` on the HQ16E report/proof files
