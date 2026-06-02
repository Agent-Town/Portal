# AgentTown HQ16C Guided Expedition Loop

Date: 2026-06-02
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Base checkpoint: `1f6773e Add AgentTown direct map command preview`

## Verdict

PLAN_READY. The smallest guided expedition loop can be implemented as a compact UI/read-surface over existing server-owned Expedition Map state and existing guarded endpoints. No new mutation is needed.

This HQ16C lane is report/proof only. No runtime, source, e2e, server, route, or test files were edited.

## Goal

Turn the current command pieces into one compact vertical loop the player can follow:

`objective -> command -> resolve -> receipt -> unlock/build/settle/survey -> next objective`

The loop should make the player feel a continuous expedition sequence without adding hidden autonomy, Atlas execution, new world simulation, route/trade/economy expansion, reward logic, combat, scheduler behavior, or hidden-truth leakage.

## Current Authority Map

The required pieces already exist:

| Surface | Existing source | Exact fields or route | Role in HQ16C loop |
| --- | --- | --- | --- |
| Expedition Map read model | `GET /api/founders-plot/expedition-map` and `state.expeditionMap` | `expeditionMap.status`, `fog.counts`, `cells[]`, `eventPackets[]`, `receipt`, `projectionHash`, `sourceSummary` | Source of visible objective, target, receipt, and next-step state. |
| Unit roster | `expeditionMap.units` | `readOnly`, `executableActions: []`, `interactionModel`, `items[]`, `byCellId`, `counts`, `boundaryFlags` | Source of selectable map units and command availability. |
| Unit fields | `expeditionMap.units.items[]` | `unitId`, `unitType`, `displayName`, `state`, `location.cellId/q/r/fogState`, `movement`, `commandHints`, `sourcePlanId`, `sourceClaimId`, `lastMove` | Drives loop row labels, selected unit, target, command button, and post-resolution receipt marker. |
| Scout move command hint | Scout unit `commandHints[]` | `commandId: "move_unit"`, `actionName: "et.plot.move_expedition_unit"`, `targetCellIds`, `serverMutationImplemented: true`, `revealsFog: false`, `routeCreation: false` | "Command" step when Scout must move across revealed cells. |
| Scout movement model | Scout unit `movement` | `movementMutationImplemented: true`, `allowedTargetCellIds`, `allowedFogStates: ["discovered","known"]`, `revealsFog: false`, `routeCreation: false` | Prevents hidden-cell movement and proves movement does not reveal fog. |
| Scout Sector command hint | Scout unit `commandHints[]` | `commandId: "scout_sector"`, `actionName: "et.plot.scout_sector"`, `targetCellIds`, `serverMutationImplemented: true` | "Objective" and "Command" step for revealing one hinted frontier cell. |
| Surveyor prepare convoy hint | Surveyor unit `commandHints[]` | `commandId: "prepare_settler_convoy"`, `actionName: "et.plot.prepare_settler_convoy"`, `sourcePlanId`, `targetCellIds`, `serverMutationImplemented: true`, `routeCreation: false` | Existing build/settle bridge when a reviewed unclaimed Site Plan exists. |
| Settler found outpost hint | Arrived Settler Convoy unit `commandHints[]` | `commandId: "found_settlement"`, `actionName: "et.plot.found_settlement"`, `claimId`, `targetCellIds`, `serverMutationImplemented: true`, `movementMutation: false`, `routeCreation: false` | Explicit settle step once the existing convoy claim has arrived. |
| Objective marker | Current frontend-derived map objective | `objective.mode`, `targetCellId`, `selectedCellId`, `packetId`, `partyId`, passed into Three.js as `model.objective` | Existing visual target marker. HQ16C should replace "current focus" prose with loop-stage semantics. |
| Event packet markers | Renderer from `expeditionMap.eventPackets[]` | `packetId`, `cellId`, `receiptLink.actionName: "et.plot.scout_sector"`, `readOnly`, `executableActions: []` | Receipt step after Scout Sector. |
| Command target rings | Three.js selected unit projection | `commandTargets[]` in renderer proof, `kind: "expedition_command_target"`, `visualOnly`, `readOnly`, `previewOnly`, `executableActions: 0` | Map-click preview trigger only; never direct execution. |
| Scout move endpoint | `POST /api/founders-plot/expedition-map/move-unit` | payload `plotId`, `unitId`, `targetCellId`, `actor`, `idempotencyKey`; response `move`, `movedUnitId`, `sourceCellId`, `targetCellId`, `proof`, `expeditionMap` | Resolve Scout movement and write a move receipt/event. |
| Scout Sector endpoint | `POST /api/founders-plot/expedition-map/scout-sector` | payload `plotId`, `cellId`, `actor`, `idempotencyKey`; response `scoutSector`, `eventPacket`, `revealedCellId`, `proof`, `expeditionMap` | Resolve reveal and create receipt-linked Event Packet. |
| Prepare convoy endpoint | `POST /api/founders-plot/prepare-settler-convoy` | payload `plotId`, `sitePlanId`, `actor`, `idempotencyKey`; response `settlementClaim`, `job`, `existing` | Existing resource-spending/timed claim step. Do not expand its economy semantics. |
| Found settlement endpoint | `POST /api/founders-plot/found-settlement` | payload `plotId`, `claimId`, `actor`, `idempotencyKey`; response `settlementClaim`, `foundedPlot`, `ownedPlots`, `existing` | Explicit outpost founding step. |

## Smallest Product Shape

Add one compact `Guided expedition` vertical rail in the Expedition Map HUD, replacing the current objective prose as the primary loop surface.

It should show five rows, each kept short:

1. `Objective`
   - Visible: one icon, one short verb, current target badge.
   - Examples: `Scout`, `Move`, `Convoy`, `Found`, `Packet`.
   - Source: derived from `expeditionMap.units.items[].commandHints`, current selected unit, existing frontend `objective` model, latest `eventPackets[]`, and refreshed `projectionHash`.

2. `Command`
   - Visible: the current command icon button or "tap target ring" hint.
   - Source: existing unit command bar buttons and HQ16A direct map preview.
   - Execution: only existing guarded frontend handlers:
     - `doMoveExpeditionUnit`
     - `doScoutExpeditionSector`
     - `doPrepareSettlerConvoy`
     - `doFoundSettlement`

3. `Resolve`
   - Visible: a tiny pending/completed indicator on the active loop row and, after HQ16B, the affected unit/cell pulse.
   - Source: local pending state plus endpoint response.
   - Important: the renderer still only shows visual feedback. It never executes a mutation.

4. `Receipt`
   - Visible: a receipt chip with compact type and target.
   - Sources:
     - Move: `move.receipt.kind: "expedition_unit_move_receipt"` and `move.receipt.actionName: "et.plot.move_expedition_unit"`.
     - Scout Sector: `scoutSector.receipt.kind: "scout_sector_receipt"`, `eventPacket.packetId`, and `eventPacket.receiptLink`.
     - Prepare Convoy: `settlementClaim.receipt.kind: "settler_convoy_prepared"` and, after time advances, `settler_convoy_arrived`.
     - Found Outpost: `settlementClaim.receipt.kind: "settlement_founded"` and `foundedPlot.plotId`.

5. `Next`
   - Visible: one next objective, not a menu of every possibility.
   - Source: refreshed server read model after every command.
   - Priority order should be:
     1. `found_settlement` if an arrived Settler Convoy unit has the command.
     2. `prepare_settler_convoy` if a Surveyor unit has the command.
     3. `scout_sector` if the Scout has an eligible hinted target.
     4. `move_unit` if the Scout has revealed adjacent movement targets but no adjacent Scout Sector target.
     5. latest Event Packet / receipts if there is no executable map command.
     6. plain map inspection if nothing else is available.

This priority keeps the loop player-readable without implying a hidden scheduler or autonomous planner.

## Concrete UI Plan

### Placement

Place the loop where the current `fp-expedition-objective-strip` lives, inside the Expedition Map HUD. It should be the first HUD item after the inspector chrome and before the status ledger.

Suggested stable test IDs:

- `fp-expedition-guided-loop`
- `fp-expedition-guided-loop-step-objective`
- `fp-expedition-guided-loop-step-command`
- `fp-expedition-guided-loop-step-resolve`
- `fp-expedition-guided-loop-step-receipt`
- `fp-expedition-guided-loop-step-next`
- `fp-expedition-guided-loop-primary-command`
- `fp-expedition-guided-loop-receipt-chip`
- `fp-expedition-guided-loop-ledger`

### Visible By Default

Visible UI should be compact and gameplay-native:

- Active unit sprite/glyph and role code: `SCT`, `SVY`, `CNV`, `OUT`.
- Active command icon and short verb:
  - Move: `Move`
  - Scout Sector: `Scout`
  - Prepare Convoy: `Convoy`
  - Found Outpost: `Found`
  - Receipt review: `Packet`
- Target badge:
  - `DISC`, `KNOWN`, `HINT`, or compact cell compass label from existing client helper.
  - Avoid raw `cell_*` text in default visible copy.
- Pending/resolve state:
  - `Pending`, `Done`, or a symbol-only pulse when HQ16B is present.
- Receipt chip:
  - `Move receipt`, `Scout receipt`, `Packet`, `Convoy receipt`, `Outpost receipt`.
- Next objective badge:
  - `Next: Scout`, `Next: Convoy`, `Next: Found`, `Next: Packet`, or equivalent short label.

### Hidden Behind Ledger / Receipts

Keep these out of default visible UI and preserve them in collapsed details, `title`, `aria-label`, or proof JSON:

- Full authority boundary strings.
- Full `proof` payloads.
- Full `sourceIds`, `projectionHash`, `beforeProjectionHash`, `afterProjectionHash`.
- Event Packet flavor prose and party snapshot detail.
- Full receipt metadata.
- Scout-sector hidden-resource redaction explanations.
- Raw `cell_*`, `site_plan_*`, `claim_*`, `expedition_unit_*`, and `plot_*` identifiers except in accessible labels/test data.
- Existing resource cost/duration details for Prepare Convoy unless a current existing panel already exposes them or a collapsed command ledger is opened. The loop should not invent cost truth beyond existing endpoint/read-model data.

## Loop Derivation Algorithm

Implement as a pure frontend helper first:

`expeditionGuidedLoopModel({ model, selectedCell, selectedUnit, lastReceipt })`

Inputs:

- `model`: current `expeditionMap`.
- `selectedCell`: current selected Expedition Map cell.
- `selectedUnit`: current selected Expedition Map unit.
- `lastReceipt`: optional local transient record from the most recent command response.

Steps:

1. Normalize units from `model.units.items`.
2. Build candidate actions from enabled `commandHints`:
   - Candidate fields: `stepId`, `commandId`, `actionName`, `unitId`, `unitType`, `targetCellId`, `sourcePlanId`, `claimId`, `packetId`, `serverMutationImplemented`.
3. Validate targets against public map cells:
   - `move_unit`: target must be in `unit.movement.allowedTargetCellIds` and target cell fog state is `discovered` or `known`.
   - `scout_sector`: target cell fog state is `hinted` and `kind` is `frontier_hint`.
   - `prepare_settler_convoy`: use `sourcePlanId` and the command's public `targetCellIds`.
   - `found_settlement`: use `claimId` and the command's public `targetCellIds`.
4. Choose one active candidate using the priority order above.
5. Create the five loop rows from that candidate plus the latest receipt/event packet.
6. If no candidate exists, fall back to a read-only receipt/map-inspection loop.

The helper should not create new endpoint names, action names, target IDs, resources, routes, rewards, or timings. It only arranges existing server-owned facts into a readable sequence.

## Command Resolution Rules

The primary command button and direct map preview Confirm must continue through the existing functions:

- `move_unit` -> `doMoveExpeditionUnit(unitId, targetCellId)`
- `scout_sector` -> `doScoutExpeditionSector(targetCellId)`
- `prepare_settler_convoy` -> `doPrepareSettlerConvoy(sourcePlanId)`
- `found_settlement` -> `doFoundSettlement(claimId)`

Payloads must remain the existing guarded endpoint shapes:

- Move: no `route`, no path array, no hidden target, no resource delta.
- Scout Sector: one hinted cell ID only.
- Prepare Convoy: `sitePlanId`, not `unitId`.
- Found Outpost: `claimId`, not `unitId`.

## Scout Sector To Survey Gap

The current Scout Sector endpoint creates known map truth plus an Event Packet receipt. It does not currently create a Site Plan, Surveyor unit, or "survey this packet" mutation.

HQ16C should not pretend that gap is closed. The loop should handle it this way:

- After Scout Sector, show `Receipt -> Packet` as the resolved step.
- If an existing reviewed Site Plan / Surveyor unit already exists, the next objective may become `Convoy`.
- If no Surveyor command exists, the next objective should be `Scout` or `Packet`, not a fabricated Survey command.

A later lane can define a separate guarded "turn packet into survey/site plan" action if Robin wants that bridge. That is not part of HQ16C.

## Optional Tiny Read-Model Extension

No server extension is required for the smallest HQ16C implementation. The frontend can safely derive the loop from existing `expeditionMap` state.

If the UI derivation becomes duplicated or brittle, the only safe extension I would accept is a read-model-only field:

```json
{
  "expeditionMap": {
    "guidedLoop": {
      "kind": "expedition_guided_loop",
      "version": "hq16c_guided_loop_v1",
      "readOnly": true,
      "executableActions": [],
      "authorityBoundary": "server_owned_read_only_expedition_map_guided_loop_v1",
      "sourceProjectionHash": "<expeditionMap.projectionHash>",
      "activeStepId": "scout_sector",
      "steps": [
        {
          "stepId": "objective",
          "phase": "objective",
          "commandId": "scout_sector",
          "actionName": "et.plot.scout_sector",
          "unitId": "expedition_unit_pathfinder_scout_v1",
          "unitType": "scout",
          "targetCellId": "cell_q0_r1",
          "enabled": true,
          "serverMutationImplemented": true,
          "readOnly": true,
          "executableActions": []
        }
      ],
      "derivedFrom": [
        "expeditionMap.units.items.commandHints",
        "expeditionMap.units.items.location",
        "expeditionMap.units.items.movement",
        "expeditionMap.cells",
        "expeditionMap.eventPackets",
        "expeditionMap.receipt"
      ],
      "boundaryFlags": {
        "readModelOnly": true,
        "addsMutationAuthority": false,
        "hiddenTruthLeakage": false,
        "routeCreation": false,
        "resourceHarvesting": false,
        "rewardCreation": false,
        "combat": false,
        "backgroundScheduling": false,
        "atlasExecution": false,
        "externalEffects": false
      }
    }
  }
}
```

Why this is safe:

- It only reorders already-public read-model fields.
- It does not add an endpoint, mutation, tool action, scheduler, or action authority.
- It keeps `readOnly: true` and `executableActions: []`.
- It can be covered by contract tests that assert every loop step maps back to an existing unit command hint or existing receipt/event packet.

Do not implement this extension unless the frontend-only helper proves too fragile.

## Focused Tests To Prove The Loop

### Frontend / Browser

- `FP-E2E-022-HQ16C-guided-loop-scout-receipt-next`
  - Start with a mocked server-owned Expedition Map with Scout move and Scout Sector command hints.
  - Assert the guided loop shows `Objective: Scout`, the target marker/ring is visible, and raw `cell_*` IDs are not visible in default loop text.
  - Confirm Scout Sector through the existing map preview or command button.
  - Assert the request hits only `/api/founders-plot/expedition-map/scout-sector` with `plotId`, `cellId`, `actor`, `idempotencyKey`.
  - After mocked refresh, assert loop shows receipt packet and next objective.

- `FP-E2E-022-HQ16C-guided-loop-surveyor-settler`
  - Use mocked Expedition Map state with an unclaimed reviewed Surveyor unit and an arrived Settler Convoy unit in separate phases.
  - Assert `prepare_settler_convoy` loop command posts only to `/api/founders-plot/prepare-settler-convoy` with `sitePlanId`.
  - Assert `found_settlement` loop command posts only to `/api/founders-plot/found-settlement` with `claimId`.
  - Assert neither payload contains `unitId`, route data, resource deltas, hidden target data, or Atlas actions.

- `FP-E2E-023-HQ16C-renderer-loop-target-proof`
  - Assert renderer `objectiveMarkers[]` and `commandTargets[]` remain `visualOnly`, `readOnly`, `previewOnly` for command targets, `routeAuthority: false`, `actionAuthority: false`, and `executableActions: 0`.
  - Assert command target click only emits preview detail and does not call a network route until Confirm.

- `FP-E2E-022-HQ16C-mobile-loop-ergonomics`
  - At mobile width, assert the loop is visible in the first viewport, command controls do not clip, ledger remains collapsed, and the map remains the dominant surface.

### Server / Contract

- `FP-HT-011d5-HQ16C-existing-endpoints-loop-smoke`
  - Sequentially exercise existing endpoints only: GET Expedition Map, move Scout to an allowed revealed target, Scout Sector an eligible hint, prepare convoy from an existing reviewed Site Plan, advance until arrival through existing test helper, found settlement.
  - Assert the expected receipts/events appear:
    - `EXPEDITION_UNIT_MOVED`
    - `EXPEDITION_SECTOR_SCOUTED`
    - `SETTLER_CONVOY_PREPARED`
    - `SETTLER_CONVOY_ARRIVED`
    - `SETTLEMENT_FOUNDED`
  - Assert no hidden fog movement, route/trade creation, combat, scheduler expansion beyond the existing convoy job, Atlas execution, or external effects.

- `FP-CT-101b5-HQ16C-guided-loop-contract` only if `expeditionMap.guidedLoop` is added.
  - Assert `guidedLoop.readOnly === true`.
  - Assert `guidedLoop.executableActions` is empty.
  - Assert every executable-looking step maps to an existing `units.items[].commandHints[]` entry with the same `commandId` and `actionName`.
  - Assert the extension exposes no hidden `resourceHints` for hinted/locked cells.

## Implementation Order

1. Add frontend helper `expeditionGuidedLoopModel` near the existing objective helper.
2. Replace or wrap `appendExpeditionObjectiveStrip` with `appendExpeditionGuidedLoop`, keeping the old test ID as a temporary alias only if needed for current tests.
3. Wire the active loop command to the same existing button/preview handlers, never a new fetch path.
4. Add transient local `lastReceipt` state after each successful command response so the receipt row can show immediate feedback before the refreshed map fully settles.
5. Refresh state using the existing `loadState()` path.
6. Add focused e2e assertions for Scout, Surveyor, and Settler phases.
7. If derivation is too coupled or duplicated, add the optional read-model-only `expeditionMap.guidedLoop` extension with contract tests.

## Guardrails

- No new mutation implementation.
- No new endpoint.
- No Atlas execution.
- No Generated Universe runtime expansion.
- No hidden autonomy.
- No hidden-truth leakage.
- No route/trade/economy/resource/reward/combat expansion.
- No scheduler/background behavior beyond the already existing Settler Convoy job.
- No external effects.
- No deploy, merge, commit, push, or public share.
- Scout Sector remains the only fog reveal path.
- Scout movement remains adjacent discovered/known same-plot only.
- Surveyor and Settler commands must continue using existing guarded endpoints.
- Renderer command rings remain preview triggers only; they must not execute mutations directly.

## Implementation Readiness

`implementationReady: true`

The smallest implementation is UI/read-surface work only. It is safe to start after HQ16B or alongside it with careful merge coordination, because it can derive from existing state and use existing command handlers. HQ16B outcome pulses would make the `Resolve` row better, but HQ16C does not require them.
