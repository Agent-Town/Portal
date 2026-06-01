# Post-HQ11 Civic Operations Regression QA - 2026-05-31

## Verdict

PASS.

The current dirty shared AgentTown worktree passes the targeted post-HQ11 Civic Operations regression matrix. The server-owned HQ10D/HQ11 inspection path, read-only Founders Plot Civic Operations board, non-executable Progression Atlas civic operations surface, real-state visual-only civic actors, 390px mobile layout, and authority boundaries all held in the focused checks below.

No source files were edited for this QA pass. New/updated QA artifacts are under `reports/agent-town-post-hq11-civic-operations-regression-*`.

## Findings

None found.

Residual note, not a defect: the Progression Atlas still has private Strategy Editor UI that uses words like "Apply Step" and saves private plan metadata through POST routes. The checked civic operations surface and Atlas action refs remain non-executable for gameplay; the Atlas E2E re-verified gameplay hash/inventory stability across private edits.

## Proof Artifacts

- `reports/agent-town-post-hq11-civic-operations-regression-proof-2026-05-31.json`
- `reports/agent-town-post-hq11-civic-operations-regression-civic-operations-board-desktop-2026-05-31.png`
- `reports/agent-town-post-hq11-civic-operations-regression-civic-operations-board-mobile-390-2026-05-31.png`
- `reports/agent-town-post-hq11-civic-operations-regression-progression-atlas-desktop-2026-05-31.png`

Screenshot dimensions verified:

- Civic Operations desktop: `1280x9072`
- Civic Operations mobile: `390x10362`
- Progression Atlas desktop: `1440x5549`

## Targeted Coverage

### Server-Owned HQ10D/HQ11 Path

Direct engine proof created a reviewed civic proposal, activated a `civic_beacon` project, then inspected it with `inspectionType: baseline_readiness`.

Observed:

- `CIVIC_PROJECT_INSPECTED` world delta emitted exactly for the first inspection.
- Repeating baseline inspection with a different idempotency key returned `alreadyInspected: true`, `inspectionApplied: false`, and `worldDelta.length: 0`.
- Civic readiness moved from `1` to `2`.
- Inventory, jobs, and settlement claims stayed unchanged.
- Inspection receipt boundary fields held:
  - `resourceDelta` empty
  - `routeCreation: false`
  - `tradeRouteCreation: false`
  - `backgroundScheduling: false`
  - `externalEffects: false`
  - `atlasExecution: false`
  - `crossPlotMutation: false`

### Founders Plot Civic Operations Board

Focused Playwright coverage verified the Founders Plot `Civic Operations` / Living World board:

- Shows HQ10D active project state and compatible HQ11 lifecycle/readiness/progress fields.
- Shows progress/readiness/project/receipt rows.
- Has no buttons inside the Civic Operations panel.
- Mobile `390x844` layout has no document/body horizontal overflow and no clipped key panels.

### Progression Atlas Civic Operations Surface

Progression Atlas E2E passed through the main app modal path.

Observed:

- HQ11 Civic Operations panel is present.
- Atlas reports `Atlas executable actions: 0`.
- Civic operation/action refs are metadata only.
- Private editor changes did not mutate gameplay state, inventory, or event count.

Direct proof also confirmed the pre-inspection civic project action ref is:

- `tool: et.plot.inspect_civic_project`
- `http: POST /api/founders-plot/civic-projects/inspect`
- `executable: false`
- `executableByAtlas: false`

After inspection, the civic project node action ref disappears and the receipt remains visible.

### Visual-Only Civic Actors

Direct scene proof built the actor state through real server-owned mutations, not injected `visualActors`.

Observed:

- `civic_routekeeper` present from `sourceDomain: civic_project`.
- `oracle_adjunct` present from `sourceDomain: world_grid`.
- `outpost_keeper` present from `sourceDomain: settlement_claim`.
- All three server descriptors have `visualOnly: true`.
- All three scene routes have `visualOnly: true`.
- Asset mappings point to the Batch C sprite sheets.

No fake scene actors were needed for the proof path.

## Commands Run

- `node --check server/founders_plot/engine.js && node --check server/founders_plot/routes.js && node --check server/founders_plot/tools.js && node --check server/founders_plot/progression_atlas.js && node --check public/experiences/founders-plot/founders-plot.js && node --check public/experiences/founders-plot/scene_state.js && node --check public/progression-atlas.js && node --check e2e/200_founders_plot.spec.js && node --check e2e/114_progression_atlas_openclaw_lite.spec.js` - passed
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-scene-state.test.js` - passed, `85/85`
- `PW_PORT=4311 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-014|FP-E2E-015|FP-E2E-021"` - passed, `3/3`
- `PW_PORT=4312 npx playwright test e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium` - passed, `2/2`
- Direct proof generation script for engine/Atlas/scene-state boundaries - passed
- `identify reports/agent-town-post-hq11-civic-operations-regression-*.png` - passed
- `git diff --check` - passed

## Authority Boundary Confirmation

Confirmed by tests and proof JSON:

- No Atlas execution.
- No scheduler/background work.
- No new route/trade behavior from civic inspection.
- No resource spend.
- No public sharing or external effects.
- No cross-plot mutation.
- No fake civic scene actors.
