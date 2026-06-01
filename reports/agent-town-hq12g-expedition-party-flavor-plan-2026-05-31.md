# AgentTown HQ12G Expedition Party Flavor Plan

Date: 2026-05-31

## Verdict

Proceed with a tiny server-owned metadata/read-model addition, not a UI-only slice.

The smallest safe HQ12G slice is an `expeditionParty` manifest attached to the existing Expedition Map read model and Scout Sector Event Packet projection. It should make the map feel more playable by naming who is reading, carrying, and filing the packet, while keeping every operator as visual/read-model flavor only.

Do not add autonomous movement, operator assignment, resource effects, scheduler behavior, route/trade economy, combat, Atlas execution, public sharing, Generated Universe rendering, cross-plot mutation, or hidden operator authority.

## Recommended Slice

Name: `HQ12G Expedition Party Manifest`

Add deterministic read-only party metadata projected by the server from existing named inhabitant/operator assets:

- Mira Trailmark, `pathfinder-scout-v1`, scout/read-the-edge flavor.
- Rook Signalpost, `rook-signalpost-messenger-v1`, packet courier flavor.
- Vale-Desk 7, `hq-civic-operator-vale-desk-7-v1`, HQ receipt/filing flavor.

Optional fourth member only if the UI has room without clutter:

- Oona Tallpack, `oona-tallpack-hauler-v1`, field kit/pack flavor.

These are not actors with authority. They do not move, decide, consume resources, reduce risk, change timers, or execute actions. They are names and portraits for the already server-owned Scout Sector receipt and packet.

## Why This Shape

UI-only would require the browser to invent party composition, which is the wrong authority boundary for a shared co-op map. A bigger server mutation would overreach because HQ12C already owns the only mutation path. A tiny server metadata projection is the safest middle: stable, testable, visible, and easy to remove or extend later.

## Proposed Data Shape

Add to `expeditionMap`:

```json
{
  "expeditionParty": {
    "partyId": "expedition_party_current_plot_v1",
    "kind": "expedition_party_manifest",
    "readOnly": true,
    "executableActions": [],
    "authorityBoundary": "server_owned_read_only_expedition_party_manifest_v1",
    "source": {
      "plotId": "plot_...",
      "projectionHash": "..."
    },
    "members": [
      {
        "memberId": "pathfinder-scout-v1",
        "displayName": "Mira Trailmark",
        "role": "scout",
        "assetSrc": "/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png",
        "metadataSrc": "/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json",
        "flavorDuty": "Reads the newly known edge.",
        "authority": "visual_read_model_only"
      }
    ],
    "boundaryFlags": {
      "autonomousMovement": false,
      "operatorAssignment": false,
      "resourceHarvesting": false,
      "resourceDelta": {},
      "routeCreation": false,
      "tradeRouteCreation": false,
      "backgroundScheduling": false,
      "combat": false,
      "publicSharing": false,
      "generatedUniverseRendering": false,
      "crossPlotMutation": false,
      "atlasExecution": false,
      "externalEffects": false
    }
  }
}
```

Add a lightweight link to each Scout Sector Event Packet:

```json
{
  "eventPacket": {
    "packetId": "expedition_event_packet_...",
    "partyId": "expedition_party_current_plot_v1",
    "partySnapshot": {
      "members": [
        { "memberId": "pathfinder-scout-v1", "displayName": "Mira Trailmark", "role": "scout" },
        { "memberId": "rook-signalpost-messenger-v1", "displayName": "Rook Signalpost", "role": "messenger" },
        { "memberId": "hq-civic-operator-vale-desk-7-v1", "displayName": "Vale-Desk 7", "role": "hq_civic_operator" }
      ],
      "readOnly": true,
      "executableActions": []
    }
  }
}
```

Keep `partySnapshot` denormalized and tiny so historical packets remain readable if the global manifest changes later. Do not persist separate party state unless the existing Scout Sector receipt needs a stable snapshot id.

## UI Placement

Use the existing Expedition Map panel; do not create a new navigation surface.

- Add a compact "Party" strip inside the selected sector details, directly below the Event Packet card when a packet exists.
- Show 3 small portraits/names with role labels and one sentence of duty flavor.
- For sectors without packets, show a quiet locked/empty line: "Party appears after Scout Sector issues a packet."
- Do not add buttons, menus, drag assignment, readiness toggles, route previews, timers, or operator stats.
- Keep the Three.js map surface unchanged except, optionally, a small noninteractive party marker/legend in the selected-sector detail area. No moving party pieces on the map in HQ12G.

## Future Implementation Surfaces

Likely files for a future implementation:

- `server/founders_plot/engine.js`: build the deterministic manifest, attach `expeditionMap.expeditionParty`, and add `eventPacket.partyId/partySnapshot`.
- `server/founders_plot/tools.js`: update `et.plot.get_expedition_map` and `et.plot.scout_sector` response schemas/descriptions.
- `server/founders_plot/routes.js`: no new route expected; existing responses carry the metadata.
- `specs/02_api_contract.md`: document the manifest and party snapshot boundary.
- `public/experiences/founders-plot/founders-plot.js`: render the compact read-only party strip.
- `public/experiences/founders-plot/founders-plot.css`: mobile-safe strip styling.
- `tests-founders-plot/fp-unit.test.js`, `fp-contract.test.js`, `fp-http.test.js`: API/read-model proof.
- `e2e/200_founders_plot.spec.js`: UI proof alongside `FP-E2E-022`.

No worker/runtime, Atlas, scheduler, store migration, asset creation, or external integration should be needed.

## Verification Plan

API/unit:

- `getExpeditionMapStatus` returns `expeditionParty.readOnly === true`.
- `expeditionParty.executableActions` is `[]`.
- Manifest contains only existing named assets and stable local asset paths.
- Manifest boundary flags are all false for movement, assignment, resources, routes, trade, scheduling, combat, sharing, Generated Universe rendering, Atlas, cross-plot, and external effects.
- Scout Sector response includes `eventPacket.partySnapshot` after a successful reveal.
- Repeated Scout Sector/idempotent calls return the same packet and same party snapshot.
- Inventory and world deltas remain unchanged except the existing `EXPEDITION_SECTOR_SCOUTED` delta.

Contract/http:

- `GET /api/founders-plot/expedition-map` documents and returns the party manifest.
- `POST /api/founders-plot/expedition-map/scout-sector` documents and returns the packet party snapshot.
- Agent callers still require the existing human approval for `scout_sector`; party metadata creates no new approval/action.

Playwright:

- Extend `FP-E2E-022` or add `FP-E2E-024`.
- Verify the Event Packet card shows the party strip after Scout Sector.
- Verify named members are visible: Mira Trailmark, Rook Signalpost, Vale-Desk 7.
- Verify the party strip has zero buttons and no assignment controls.
- Verify existing HQ12D Three.js map canvas remains nonblank and selectable.
- Produce desktop/mobile screenshots and proof JSON under `reports/`.

Suggested focused commands for the future implementation:

```bash
node --check server/founders_plot/engine.js
node --check server/founders_plot/tools.js
node --check public/experiences/founders-plot/founders-plot.js
NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js
PW_PORT=43xx npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-024|FP-E2E-022"
```

## Guardrails

- Party members are presentation metadata only.
- No party member can be selected, assigned, dispatched, scheduled, or moved.
- No hidden operator state should be added to the backend.
- Do not infer skill/worker authority from party labels.
- Do not expose new tool calls for party management.
- Do not create routes, roads, trade lanes, payouts, losses, injuries, combat outcomes, timers, or resource deltas.
- Use "frontier" only as unrevealed map-edge language. Avoid Wild West cues.
- Keep the UI compact; this should support the map, not become a roster system.

## Blockers

No implementation blocker found. The only preflight requirement is to treat the party manifest as server-owned read-only metadata and prove through tests that it creates no new action surface.
