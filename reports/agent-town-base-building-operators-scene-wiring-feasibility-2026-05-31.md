# AgentTown Base-Building Operators Scene-Wiring Feasibility

Date: 2026-05-31
Repo: `/Users/robin/Projects/Portal-atlas-editor`
Mode: bounded heartbeat lane / report-only
Production code edited: no

## Verdict

Do not wire dedicated base-building operators yet.

The server already provides truthful runtime anchors for `HQ`, `LUMBER_CAMP`, `FARM_PLOT`, and `QUARRY`: they are real `BUILDING_DEFS`, real placed `founder_buildings`, real scene buildings, and production/ready states already emit visual-only actors. However, those actors currently and truthfully resolve to generic roles:

- construction or upgrade: `builder`
- base production on `LUMBER_CAMP`, `FARM_PLOT`, and `QUARRY`: `worker`
- ready output on those buildings: `hauler`
- HQ presence: `clover` plus notification `messenger` when relevant

Dedicated `lumber_worker`, `farmer`, `quarry_mason`, and `hq_civic_operator` are only specified as future asset prompt/wiring targets in `reports/agent-town-base-building-operators-asset-prompt-spec-2026-05-31.md`. Their runtime sprite files, metadata files, `ACTOR_SPRITE_SHEETS` entries, action cues, offsets, route modes, and tested server role descriptors do not exist in the current codebase.

Adding them now would be a fabricated projection, even though the building anchors are real.

## Inspected Evidence

`server/founders_plot/engine.js`

- `BUILDING_DEFS` includes real server-owned definitions for `HQ`, `LUMBER_CAMP`, `FARM_PLOT`, and `QUARRY`.
- `LUMBER_CAMP`, `FARM_PLOT`, and `QUARRY` all expose `produces()` with `kind: "PRODUCE"` and typed outputs (`wood`, `food`, `stone`).
- `visualActorProjections()` emits:
  - `builder` for `CONSTRUCT` and `UPGRADE` jobs.
  - `worker` for `PRODUCE` jobs except `WORKSHOP`, which becomes `workshop_specialist`.
  - `hauler` for `OUTPUT_READY` buildings except `EXPEDITION_BOARD`, `WORKSHOP`, and `MARKET_STALL`, which have dedicated readouts.
  - `clover` anchored to HQ as foreman presence.

`public/experiences/founders-plot/scene_state.js`

- `BUILDING_LABELS` and `assetForBuilding()` include physical scene support for `HQ`, `LUMBER_CAMP`, `FARM_PLOT`, and `QUARRY`.
- `ACTOR_SPRITE_SHEETS` includes current integrated sheets for `builder`, `worker`, `hauler`, `messenger`, `scout`, `workshop_specialist`, `trader`, `settler`, `civic_routekeeper`, `oracle_adjunct`, and `outpost_keeper`.
- It does not include `lumber_worker`, `farmer`, `quarry_mason`, or `hq_civic_operator`.
- `visualRoleForActor()` only specializes `WORKSHOP` and `MARKET_STALL`; it does not specialize base production buildings.

`tests-founders-plot/fp-scene-state.test.js`

- Existing tests assert the current truth:
  - `FP-SCENE-001` expects a `builder` actor for construction.
  - `FP-SCENE-002` expects `worker` for active `LUMBER_CAMP` production and `hauler` for ready output.
  - Later tests cover dedicated Workshop, Market, Settler, Civic, Oracle, and Outpost mappings, but no dedicated base-building operator mapping exists.

Asset inventory

- Building assets exist:
  - `public/experiences/founders-plot/assets/buildings/hq-lv1.webp` through `hq-lv5.webp`
  - `public/experiences/founders-plot/assets/buildings/lumber-camp.webp`
  - `public/experiences/founders-plot/assets/buildings/farm-plot.webp`
  - `public/experiences/founders-plot/assets/buildings/quarry.webp`
- Current generic inhabitant assets exist for `builder`, `worker`, and `hauler`.
- No runtime asset directory/files were found for `farmer`, `quarry_mason`, `lumber_worker`, or `hq_civic_operator`.

## Building-by-Building Decision

| Surface | Safe runtime anchor exists? | Dedicated operator asset/descriptor exists? | Current truthful projection | Decision |
| --- | --- | --- | --- | --- |
| `HQ` | Yes. HQ is always a real building anchor and scene object. | No `hq_civic_operator` asset, sprite sheet, cue, or server descriptor. | `clover` foreman presence; `messenger` for quest/reward/approval attention. | Wait for generated asset and explicit descriptor contract. |
| `LUMBER_CAMP` | Yes. Real building, physical scene asset, `PRODUCE` job, and `OUTPUT_READY` state. | No `lumber_worker` runtime asset/metadata/sheet mapping. | `worker` during production, `hauler` when output is ready. | Wait for generated asset, then map this existing anchor. |
| `FARM_PLOT` | Yes. Real building, physical scene asset, `PRODUCE` job, and `OUTPUT_READY` state. | No `farmer` runtime asset/metadata/sheet mapping. | `worker` during production, `hauler` when output is ready. | Wait for generated asset, then map this existing anchor. |
| `QUARRY` | Yes. Real building, physical scene asset, `PRODUCE` job, and `OUTPUT_READY` state. | No `quarry_mason` runtime asset/metadata/sheet mapping. | `worker` during production, `hauler` when output is ready. | Wait for generated asset, then map this existing anchor. |

## Smallest Safe Future Implementation

After the asset production lane lands real sprite sheets and metadata, the smallest safe implementation is visual-only and local:

1. Add `ACTOR_SPRITE_SHEETS` entries in `public/experiences/founders-plot/scene_state.js` for:
   - `lumber_worker`
   - `farmer`
   - `quarry_mason`
   - optionally `hq_civic_operator`
2. Add offsets, action cues, and animation modes for those role ids.
3. Extend server visual descriptors in `server/founders_plot/engine.js` only where existing server state already proves the surface:
   - active `PRODUCE` job on `LUMBER_CAMP` -> `lumber_worker`
   - active `PRODUCE` job on `FARM_PLOT` -> `farmer`
   - active `PRODUCE` job on `QUARRY` -> `quarry_mason`
   - ready output can either remain `hauler` or use the surface-specific `ready` pose if the asset contract explicitly says so.
4. Add focused tests in `tests-founders-plot/fp-scene-state.test.js` proving role id, `assetSrc`, `assetSprite.action`, cue, route target, and `visualOnly: true`.
5. Produce focused proof JSON similar to existing scene-state proof reports, with no gameplay/resource/cost/routing/trade/scheduler changes.

This can be done without creating fake card actors or conceptual surface actors because the base buildings already have concrete server and Three.js anchors.

## Blockers

- Dedicated runtime sprite assets for the four base-building roles are absent.
- `scene_state.js` has no sheet/cue/offset/action contract for those roles.
- `engine.js` has no explicit server visual descriptors for those role ids.
- Existing tests assert generic `worker` and `hauler` behavior for base production; changing that before assets land would be an unbacked behavioral expectation change.

## Non-Changes

No code changes were made.

No generated bundles, gameplay systems, resource math, costs, routing/trade logic, scheduler behavior, Atlas execution, server mutations, public messages, deploys, merges, or cleanup were touched.

## Verification

Report-only task. No JS tests were run because no production or test source was changed.
