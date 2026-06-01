# AgentTown Asset-Ready Operators Scene-Wiring Feasibility

Date: 2026-05-31
Repo: `/Users/robin/Projects/Portal-atlas-editor`
Branch observed: `neo/progression-atlas-editor-next-2026-05-29`
Mode: bounded feasibility / report-only

## Verdict

No runtime wiring was added.

The three requested roles are asset-ready, but none has both a real server/read-model state and a physical runtime scene anchor that can truthfully emit a visual actor today. Adding descriptors now would create proof actors around conceptual UI/read-model surfaces instead of actual scene buildings or established targets.

## Role Decisions

| Role | Server/read-model truth | Physical scene anchor | Decision |
| --- | --- | --- | --- |
| `charter_clerk` | Yes: Site Plan review / Settlement Charter state exists through HQ6 reviewed planning state. | No runtime `SETTLEMENT_CHARTER` building type in `BUILDING_DEFS`, no scene building label/asset mapping, no placed building instance. Charter board/document art exists, but it is not an engine building anchor. | Skip. Asset-ready, not gameplay-wired. |
| `research_doctrine_keeper` | Yes: Research Lodge doctrine state exists through `selectedDoctrineId`, doctrine catalog, and `researchReadModel`. | No runtime `RESEARCH_LODGE` building type in `BUILDING_DEFS`, no scene building label/asset mapping, no placed building instance. Existing UI copy explicitly says no physical Research Lodge building exists in this slice. | Skip. Asset-ready, not gameplay-wired. |
| `cohort_hall_coordinator` | Yes: Cohort work-order planner and persisted work orders exist. | No runtime `COHORT_HALL` building type in `BUILDING_DEFS`, no scene building label/asset mapping, no placed building instance, and Huygens already noted missing physical Cohort Hall building art. | Skip. Asset-ready, not gameplay-wired. |

## Why No Partial Wiring

Existing scene actors follow a conservative pattern:

- Engine `visualActorProjections` emits descriptors from concrete gameplay state such as jobs, output-ready buildings, settlement claims, founded outposts, active civic projects, and world-grid read-model state tied to an active civic beacon.
- Scene state maps those descriptors to sprite sheets, cues, routes, selections, and drawer keys.
- Dedicated Batch A/C actors are anchored to existing buildings or concrete server-owned targets: Workshop, Market, Settler Convoy, Outpost, Civic Beacon, and World Grid.

The requested operators would need a truthful target. The current target choices would all be misleading:

- Anchoring `charter_clerk` to HQ would imply HQ is the Settlement Charter.
- Anchoring `research_doctrine_keeper` to HQ or Expedition Board would imply a physical Research Lodge exists.
- Anchoring `cohort_hall_coordinator` to HQ or generic work orders would imply a Cohort Hall exists and could visually suggest execution authority.
- Anchoring any of them to object/card art would require new scene object semantics outside this lane.

## Implementation Boundary

Files changed:

- `reports/agent-town-asset-ready-operators-scene-wiring-2026-05-31.md`

Files intentionally not changed:

- `server/founders_plot/engine.js`
- `public/experiences/founders-plot/scene_state.js`
- `tests-founders-plot/fp-scene-state.test.js`

Authority boundary:

- No gameplay/resource/route/trade/scheduler/public/external effects.
- No new mechanics, costs, rewards, work-order execution authority, doctrine authority, civic authority, or Atlas execution.
- No fake actors or proof-path descriptors were created.
- These roles remain `asset-ready, not gameplay-wired` until a real engine surface or physical scene anchor exists.

## Recommended Next Slice

Before wiring these sprites, promote the underlying surfaces explicitly:

1. Add a real, server-owned physical scene anchor for Settlement Charter and/or Research Lodge if those are meant to appear on the plot.
2. Add a real Cohort Hall building asset and engine building type before emitting `cohort_hall_coordinator`.
3. Then add visual-only descriptors that point to those concrete building instances or to a deliberately modeled scene object type.

## Verification

Passed:

```sh
git diff --check
git diff --check -- reports/agent-town-asset-ready-operators-scene-wiring-2026-05-31.md
```

Not run because no JS or test files were changed:

```sh
node --check server/founders_plot/engine.js
node --check public/experiences/founders-plot/scene_state.js
node --check tests-founders-plot/fp-scene-state.test.js
NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js
```
