# AgentTown Base Operators Scene Wiring Slice

Date: 2026-05-31
Repo: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Mode: bounded visual-only lane on dirty shared worktree

## Verdict

Wired the newly asset-ready base-building operators into Founders Plot scene projection only where existing scene descriptors already carry real server/read-model anchors.

This slice stays client-side in `scene_state.js`. No server projection, resource math, production timing, rewards, costs, routes/trade, scheduler behavior, work-order behavior, civic project behavior, Atlas execution, public sharing, or server authority changed.

## Changed Files

- `public/experiences/founders-plot/scene_state.js`
- `tests-founders-plot/fp-scene-state.test.js`
- `reports/agent-town-base-operators-scene-wiring-slice-2026-05-31.md`
- `reports/agent-town-base-operators-scene-wiring-proof-2026-05-31.json`

## Exact Behavior

Added `ACTOR_SPRITE_SHEETS` entries for:

- `farmer` -> `farmer-mira-seedhand-v1`
- `quarry_mason` -> `quarry-mason-bram-stonecalm-v1`
- `lumber_worker` -> `lumber-worker-jun-timberline-v1`
- `hq_civic_operator` -> `hq-civic-operator-vale-desk-7-v1`

Mapped existing visual descriptors by target building:

- `FARM_PLOT` `PRODUCE` / `OUTPUT_READY` actors now render as `farmer` with `tend` / `ready`.
- `QUARRY` `PRODUCE` / `OUTPUT_READY` actors now render as `quarry_mason` with `cut` / `ready`.
- `LUMBER_CAMP` `PRODUCE` / `OUTPUT_READY` actors now render as `lumber_worker` with `mill` / `ready`.
- Existing HQ-targeted `APPROVAL` and `REWARD` messenger descriptors now render as `hq_civic_operator` with `coordinate` / `ready`.

Preserved fallback behavior:

- `CONSTRUCT` and `UPGRADE` remain `builder`.
- Non-specialized production still falls back to `worker`.
- Non-specialized ready output still falls back to `hauler`.
- Ordinary HQ `QUEST` notices remain `messenger`, so this slice does not fabricate a general HQ operator presence.

## Proof

Machine-readable proof:

- `reports/agent-town-base-operators-scene-wiring-proof-2026-05-31.json`

The proof records the asset mappings, source anchors, tests, and the explicit boundary.

## Validation

Passed:

```sh
node --check public/experiences/founders-plot/scene_state.js
node --check tests-founders-plot/fp-scene-state.test.js
NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js
jq empty reports/agent-town-base-operators-scene-wiring-proof-2026-05-31.json
git diff --check -- public/experiences/founders-plot/scene_state.js tests-founders-plot/fp-scene-state.test.js reports/agent-town-base-operators-scene-wiring-slice-2026-05-31.md reports/agent-town-base-operators-scene-wiring-proof-2026-05-31.json
```

Focused scene-state test result: `9/9` passing.

## Boundary Statement

This is visual projection only. It consumes existing visual actor descriptors and existing scene target building context; it does not create new actors in server state, alter production outputs, change collection, change job timing, schedule work, execute work orders, activate civic behavior, grant Atlas execution, publish state, create routes/trade, or mutate server authority.
