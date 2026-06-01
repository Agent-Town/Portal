# AgentTown Post Base-Operator Scene Wiring Live Smoke

Date: 2026-05-31

Repo: `/Users/robin/Projects/Portal-atlas-editor`

Branch/worktree: `neo/progression-atlas-editor-next-2026-05-29`, dirty shared worktree

Mode: bounded report/proof-only QA

## Verdict

Passed. The current Founders Plot runtime still resolves the dedicated base-operator sprite sheets for `farmer`, `quarry_mason`, `lumber_worker`, and `hq_civic_operator`, and the scene-state mappings remain visual-only.

No source, server, engine, route, store, tool, gameplay, Atlas, sharing, or production asset files were changed for this QA lane.

## Proof Artifacts

- Machine-readable proof: `reports/agent-town-post-base-operator-scene-wiring-live-smoke-2026-05-31.json`
- Browser projection screenshot: `reports/agent-town-post-base-operator-scene-wiring-live-smoke-2026-05-31-projection-fixture.png`
- Sprite contact sheet: `reports/agent-town-post-base-operator-scene-wiring-live-smoke-2026-05-31-contact-sheet.png`

The browser screenshot is a clearly labeled projection fixture. It renders through the live `/founders-plot` page runtime using `FoundersPlotSceneState.createSceneState(...)` and `FoundersPlotThreeRenderer.renderPlotScene(...)`, but the fixture is mocked client projection proof only. It is not gameplay truth and does not create server-owned actors.

## Sprite Asset Proof

The proof JSON confirms file presence, PNG headers, metadata, and HTTP loading through the local app server for:

- `farmer` -> `/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.png`
- `quarry_mason` -> `/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.png`
- `lumber_worker` -> `/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.png`
- `hq_civic_operator` -> `/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.png`

Each PNG was verified as `2048x2048`, with 4x4 metadata, 512px frames, and expected action rows (`tend`, `cut`, `mill`, `coordinate`, and `ready` as applicable). The local HTTP checks returned successful responses for each PNG and metadata JSON URL.

## Scene Projection Checks

The projection fixture verified:

- `FARM_PLOT` `PRODUCE` / `OUTPUT_READY` -> `farmer`, `tend` / `ready`
- `QUARRY` `PRODUCE` / `OUTPUT_READY` -> `quarry_mason`, `cut` / `ready`
- `LUMBER_CAMP` `PRODUCE` / `OUTPUT_READY` -> `lumber_worker`, `mill` / `ready`
- `HQ` `APPROVAL` / `REWARD` -> `hq_civic_operator`, `coordinate` / `ready`
- `HQ` `QUEST` stays `messenger`

All projected actors and routes are `visualOnly: true`. Building objects remain normal state-backed scene objects (`visualOnly: false`), preserving the boundary between renderer projection and gameplay authority.

## Browser Proof

The live browser proof loaded `/founders-plot` from a local test server on port `4197`, rendered the projection fixture with the production runtime, and captured:

- Canvas size: `954x724`
- Canvas pixel check: 5/5 visible samples, 5 unique samples
- Rendered sprite actors: 9 projected actors, all sprite-sheet backed, all `assetFallback: false`
- Fixture label visible in screenshot: mocked projection, visual-only actors/routes, no server authority

## Validation

Passed:

```sh
node --check public/experiences/founders-plot/scene_state.js
node --check tests-founders-plot/fp-scene-state.test.js
NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js
curl -fsS 'http://[::1]:4197/api/health'
jq empty reports/agent-town-post-base-operator-scene-wiring-live-smoke-2026-05-31.json
file reports/agent-town-post-base-operator-scene-wiring-live-smoke-2026-05-31-projection-fixture.png reports/agent-town-post-base-operator-scene-wiring-live-smoke-2026-05-31-contact-sheet.png
git diff --check -- public/experiences/founders-plot/scene_state.js tests-founders-plot/fp-scene-state.test.js
git diff --check --no-index -- /dev/null reports/agent-town-post-base-operator-scene-wiring-live-smoke-2026-05-31.md
git diff --check --no-index -- /dev/null reports/agent-town-post-base-operator-scene-wiring-live-smoke-2026-05-31.json
```

Focused scene-state result: `9/9` passing.

The `--no-index` checks for the new Markdown and JSON proof files produced no whitespace findings; the non-zero diff exit is expected because the files are new relative to `/dev/null`.

## Boundary

This was a live smoke QA pass over scene projection and asset loading only. It did not alter or assert resource math, rewards, costs, scheduling, work orders, civic behavior, Atlas execution, route/trade, public sharing, Generated Universe rendering, or any external effect.
