# AgentTown Base Operators Scene Wiring Visual Smoke

Date: 2026-05-31
Repo: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Mode: bounded proof/report-only visual QA on dirty shared worktree

## Verdict

Passed. The Founders Plot scene projection resolves the dedicated base-operator sprite sheets for the existing visual descriptors that have real anchors, and the resulting actors remain visual-only.

This is a scene projection smoke proof, not gameplay truth. The fixture is a mocked client scene bundle shaped like the existing `tests-founders-plot/fp-scene-state.test.js` pattern so the proof can focus on `scene_state.js` role projection and asset resolution without creating server actors or changing server authority.

## Proof Artifacts

- Machine-readable proof: `reports/agent-town-base-operators-scene-wiring-visual-smoke-2026-05-31.json`
- Contact sheet: `reports/agent-town-base-operators-scene-wiring-visual-smoke-2026-05-31-contact-sheet.png`

The contact sheet order is:

1. `FARM_PLOT` -> `farmer-mira-seedhand-v1.png`
2. `QUARRY` -> `quarry-mason-bram-stonecalm-v1.png`
3. `LUMBER_CAMP` -> `lumber-worker-jun-timberline-v1.png`
4. `HQ` approval/reward notices -> `hq-civic-operator-vale-desk-7-v1.png`

## Scene Fixture

The smoke scene includes:

- `HQ`, `FARM_PLOT`, `QUARRY`, and `LUMBER_CAMP` buildings.
- Existing-style `worker` / `hauler` descriptors for `PRODUCE` and `OUTPUT_READY` on the farm, quarry, and lumber camp.
- Existing-style `messenger` descriptors for HQ `APPROVAL`, `REWARD`, and `QUEST`.

The fixture is explicitly labeled as mocked scene projection proof. It does not fabricate server gameplay actors.

## Projection Checks

- `FARM_PLOT` `PRODUCE` -> `farmer`, `farmer-mira-seedhand-v1`, sprite action `tend`, cue `farm_tending`, route mode `tend`.
- `FARM_PLOT` `OUTPUT_READY` -> `farmer`, `farmer-mira-seedhand-v1`, sprite action `ready`, cue `farm_output_ready`.
- `QUARRY` `PRODUCE` -> `quarry_mason`, `quarry-mason-bram-stonecalm-v1`, sprite action `cut`, cue `quarry_cutting`, route mode `cut`.
- `QUARRY` `OUTPUT_READY` -> `quarry_mason`, `quarry-mason-bram-stonecalm-v1`, sprite action `ready`, cue `quarry_output_ready`.
- `LUMBER_CAMP` `PRODUCE` -> `lumber_worker`, `lumber-worker-jun-timberline-v1`, sprite action `mill`, cue `lumber_milling`, route mode `mill`.
- `LUMBER_CAMP` `OUTPUT_READY` -> `lumber_worker`, `lumber-worker-jun-timberline-v1`, sprite action `ready`, cue `lumber_output_ready`.
- `HQ` `APPROVAL` -> `hq_civic_operator`, `hq-civic-operator-vale-desk-7-v1`, sprite action `coordinate`, cue `hq_approval_notice`, drawer `approvals`.
- `HQ` `REWARD` -> `hq_civic_operator`, `hq-civic-operator-vale-desk-7-v1`, sprite action `ready`, cue `hq_reward_receipt`, drawer `rewards`.
- `HQ` `QUEST` remains `messenger`, preserving the guard that Vale only appears for approval/reward notices.

All projected actors and routes are `visualOnly: true`. Building objects remain `visualOnly: false`, which preserves the renderer/state boundary.

## Validation

Passed:

```sh
jq empty reports/agent-town-base-operators-scene-wiring-visual-smoke-2026-05-31.json
identify reports/agent-town-base-operators-scene-wiring-visual-smoke-2026-05-31-contact-sheet.png
node --check public/experiences/founders-plot/scene_state.js
node --check tests-founders-plot/fp-scene-state.test.js
NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js
git diff --check -- public/experiences/founders-plot/scene_state.js tests-founders-plot/fp-scene-state.test.js
git diff --check --no-index -- /dev/null reports/agent-town-base-operators-scene-wiring-visual-smoke-2026-05-31.md
git diff --check --no-index -- /dev/null reports/agent-town-base-operators-scene-wiring-visual-smoke-2026-05-31.json
```

Focused scene-state result: `9/9` passing.

## Boundary

No source files were changed for this QA lane. No server gameplay authority, resource math, rewards/economy, scheduler/work-order behavior, Atlas execution, route/trade, public sharing, or Generated Universe behavior was changed.
