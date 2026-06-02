# AgentTown HQ16D Location Visit Layer Preflight

Date: 2026-06-02
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Base checkpoint: `1f6773e Add AgentTown direct map command preview`

## Verdict

`READY_FOR_READ_ONLY_EXISTING_READ_MODEL_SLICE`

The smallest safe first visit layer is a read-only visit panel for a selected `known` Expedition Map cell whose `sourceTruth` is `expedition_scout_sector` and whose server read model already links an `eventPacket`.

This should not be a pure frontend invention of arbitrary places. It can be implemented as a frontend scene/read panel composed only from the existing server-owned `expeditionMap.cells[]`, `expeditionMap.eventPackets[]`, cell receipts, party flavor, and public terrain asset slot. No new mutation, route, Atlas execution, Generated Universe runtime, resource, route, reward, combat, scheduler, or cross-plot behavior is needed for the first slice.

If the next lane wants reusable authored location scenes, thumbnails, asset packs, or designer-selected visitability beyond this one Scout Sector packet scene, add a tiny server read-model field first, such as `locationVisitRef` or `locationSceneRef`. For HQ16D's first safe layer, the existing Expedition Map event-packet read model is enough.

## First Safe Visitable Sector Type

Use the first `known` cell that was created by Scout Sector:

- `cell.fogState === "known"`
- `cell.sourceTruth === "expedition_scout_sector"`
- `cell.eventPacket.packetId` exists, or `expeditionPacketForCell(model, cell)` resolves one
- `eventPacket.readOnly === true`
- `eventPacket.executableActions.length === 0`
- `eventPacket.receiptLink.actionName === "et.plot.scout_sector"`
- `eventPacket.boundaryFlags.receiptMetadataOnly === true`

This is safer than starting with every `known` site plan or every `discovered` owned plot because the Scout Sector packet already gives the place a narrow receipt/event anchor. It also avoids turning resource-hinted site-plan cells into a resource-looking visit scene. Owned home/outpost scenes can be second, after the Scout Sector visit panel proves the map-to-place-to-receipt-to-map loop.

## Flow

1. Player selects a visible scouted sector on the Expedition Map.
2. The selected-sector proof or event marker shows a compact Visit affordance only when the server-backed packet gate above passes.
3. Visit opens a map-local overlay, drawer, or panel. It is not full-page navigation and should not tear down the page-scoped worker/runtime.
4. The scene/read panel shows a place-like backdrop from public presentation data only:
   - cell title, known fog state, public terrain asset slot, and generic scouted-sector visual shell
   - event packet title/flavor
   - read-only receipt anchor
   - party flavor from the existing expedition party snapshot
5. The player can inspect the event packet and receipt context in the panel.
6. Return to Map closes the panel, preserves or restores the selected cell, and may refresh `GET /api/founders-plot/expedition-map`.

Allowed UI verbs:

- `open_visit_panel`
- `inspect_event_packet`
- `inspect_receipt`
- `return_to_map`

All are UI/read-only verbs. They are not gameplay actions.

## Hidden Truth Protections

The visit layer must not create a visit affordance for `hinted` or `locked_unknown` cells.

Required protections:

- `hinted` cells show only abstract fog/Scout Sector eligibility. No Visit button, no concrete location title beyond existing hint copy, no scene art derived from possible terrain, no receipt links beyond sealed provenance counts.
- `locked_unknown` cells show no Visit button, no scene entry, no landmarks, no routes, no resources, no event packet, no asset slot except fog.
- If a future malformed or malicious fixture adds `locationSceneRef`, `eventPacket`, `publicTerrainAssetSlot`, resource hints, or scene metadata to hidden cells, the frontend must ignore it unless the cell is `known` or `discovered`.
- The first Scout Sector visit scene should avoid rendering `resourceHints` as scene props. Existing selected-sector ledgers may keep already-public resource chips, but the place layer should not make resources inspectable, harvestable, or reward-like.
- Return from a visit must not reveal adjacent cells, move units, create routes, create claims, schedule work, publish/share, execute Atlas, render Generated Universe content, or change inventory.

## Recommended UI Shape

Use a compact map-local scene overlay rather than a new page:

- Entry: an icon+short-label Visit affordance in selected-sector proof and/or event marker inspect state.
- Scene: a contained place-like panel with a public terrain backdrop, one receipt anchor, and one event packet anchor.
- Context rail: compact chips for cell, packet, receipt, read-only, and zero actions.
- Ledger drawer: existing event packet/receipt details, collapsed by default.
- Back control: returns to the Expedition Map with the same selected cell and packet marker highlighted.

The scene should feel like a place, but it should remain a read-only inspection surface. No local actor autonomy, no command ring, no "travel", no "gather", no "route", and no reward copy.

## Recommendation: Existing Server Read Model Backed

Recommended mode: frontend implementation backed by the existing server Expedition Map/event-packet read model.

Do not ship a frontend-only rule that treats all visible cells as visitable places. The first implementation can remain frontend-only in code scope if it is strictly a composition of current server-owned fields and if visitability is gated to scouted known cells with a receipt-linked event packet.

Do not block HQ16D on a new server route. Block only if the implementation tries to support reusable authored scenes, arbitrary known/discovered locations, generated scene descriptors, future mutation gates, or visitability that cannot be derived from current server map/event-packet truth.

## Suggested Test Coverage For Implementation Lane

Focused browser coverage:

- Select a scouted known cell with an event packet, open Visit, assert the visit panel appears with `data-read-only="true"` and `data-actions="0"`.
- Assert panel context includes the selected cell id, packet id, Scout Sector receipt link, and zero executable actions.
- Click Return to Map, assert the map is visible again and the same cell remains selected.
- Select a `hinted` cell and a `locked_unknown` cell, assert no Visit affordance exists and no concrete resource, route, receipt link, terrain scene, or location panel appears.
- Intercept network or inspect app state to prove open/close/inspect does not POST and does not change fog counts, unit location, inventory, routes, claims, or event count.

Renderer/source guard coverage:

- Add or extend proof metadata that visit anchors are read-only, inspectable, and `actionAuthority: false`.
- Add a malicious hidden-cell fixture with fake scene/event/terrain data and prove hidden cells normalize to fog-only/no-visit.

Server test coverage only if adding a tiny read-model field:

- `GET /api/founders-plot/expedition-map` exposes `locationVisitRef` only for known/discovered allowed cells.
- The first allowed ref points only to scouted known cells with read-only event packets.
- Hinted/locked cells never expose `locationVisitRef`, even if underlying malformed state contains scene metadata.
- The route stays read-only: `worldDelta` unchanged, `readOnly: true`, `executableActions: []`, no route/resource/combat/scheduler/Atlas/public/external effects.

## Implementation Lane Artifacts Needed

Minimum implementation-lane proof package:

- Markdown report under `reports/agent-town-hq16d-*`.
- Proof JSON with `ok`, `verdict`, chosen implementation mode, visible visit count, hidden visit count `0`, hidden-truth guard fields, authority fields, and files changed.
- Desktop screenshot showing map -> selected scouted sector -> visit panel.
- Mobile screenshot showing the same without clipped controls.
- If Playwright writes screenshots/proofs from old lanes as side effects, restore unrelated tracked side effects before final verification.

Expected verification for implementation lane:

- `node --check` for touched frontend/e2e files.
- Focused Playwright around the map visit flow.
- `jq empty` on the proof JSON.
- `git diff --check`.
- Server tests only if a server read-model field is added.

## Files Reviewed

- `reports/agent-town-hq16-next-lanes-register-2026-06-02.md`
- `reports/agent-town-hq13c-location-scene-visit-model-2026-06-01.md`
- `reports/agent-town-hq13c-location-scene-visit-model-proof-2026-06-01.json`
- `reports/agent-town-hq16a-direct-map-command-preview-2026-06-02.md`
- `reports/agent-town-hq16a-direct-map-command-preview-proof-2026-06-02.json`
- `reports/agent-town-hq15d-event-objective-map-markers-2026-06-02.md`
- `reports/agent-town-hq15g-scout-unit-move-and-payload-reconciliation-2026-06-02.md`
- `server/founders_plot/engine.js`
- `server/founders_plot/routes.js`
- `public/experiences/founders-plot/founders-plot.js`
- `tests-founders-plot/fp-http.test.js`
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`

## Guardrails Held In This Lane

This lane wrote report/proof only. It did not edit runtime/source/e2e/server files and did not add mutation implementation, Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, route/trade/economy/resource/reward/combat/scheduler/cross-plot behavior, external effects, deploy, merge, commit, push, or public share.
