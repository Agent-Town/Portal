# Roadmap Branch Test Evidence — 2026-05-26

Branch: `codex/founders-plot-roadmap-v15-v45-completion`

Base committed roadmap implementation: `54764c9 Complete Founders Plot roadmap implementation`

Purpose: respond to QA review by proving the branch is V1.5 product work plus
gated future prototypes, not an accidental V1.6-V4.5 shipped claim.

## QA Response Changes Under Test

- Added feature-flag defaults for all V1.6-V4.5 future slices.
- Future tools, mutation endpoints, state payloads, scene coverage, scene
  objects, and drawers are hidden/blocked in V1.5-only mode.
- Fixed V2.1 Doctrine Lite roadmap evidence to reference doctrine tests.
- Added release gates for V2.0, V2.5, V3.0, V3.1, V3.5, V4.0, V4.5, and Brain Vault.
- Added local/dev analytics events for the V1.5 first-hour loop.
- Added Three.js fallback, disposal, FPS, and asset-budget evidence checks.

## Screenshots

- `artifacts/founders-plot-v15-second-contract-desktop.png`
- `artifacts/founders-plot-v15-second-contract-mobile.png`
- `artifacts/founders-plot-v15-second-contract-scene-desktop.png`

## Commands

- PASS: `node --check server/founders_plot/feature_flags.js server/founders_plot/routes.js public/experiences/founders-plot/app.js public/experiences/founders-plot/scene_state.js public/experiences/founders-plot/scene_render.js public/experiences/founders-plot/three_scene_entry.js public/app.js e2e/214_founders_plot_threejs_playable_slice.spec.js e2e/220_founders_plot_v15_first_hour_contract_loop.spec.js e2e/235_founders_plot_future_feature_flags.spec.js`
- PASS: `node --test tests/founders_plot_feature_flags.test.js tests/founders_plot_threejs_runtime_evidence.test.js` — 4 passed.
- PASS: `node --test tests/founders_plot_feature_flags.test.js tests/founders_plot_threejs_runtime_evidence.test.js tests/founders_plot_v15_first_hour_contract.test.js tests/founders_plot_v16_civic_scenarios.test.js tests/founders_plot_v17_town_identity.test.js tests/founders_plot_v20_persistent_foreman.test.js tests/founders_plot_v21_doctrine_lite.test.js tests/founders_plot_v25_second_settlement.test.js tests/founders_plot_v30_operating_model.test.js tests/founders_plot_v31_specialist_foremen.test.js tests/founders_plot_v35_regional_governance.test.js tests/founders_plot_v40_operating_style_card.test.js tests/founders_plot_v45_creator_buildings.test.js` — 48 passed.
- PASS: `npm run build:founders-plot-threejs`.
- PASS: `npx playwright test e2e/214_founders_plot_threejs_playable_slice.spec.js e2e/220_founders_plot_v15_first_hour_contract_loop.spec.js e2e/227_founders_plot_v21_doctrine_lite.spec.js e2e/232_founders_plot_v35_regional_governance.spec.js e2e/234_founders_plot_v45_creator_buildings.spec.js e2e/235_founders_plot_future_feature_flags.spec.js` — 13 passed.
- PASS: `git diff --check`.

## Browser Sanity

In-app Browser opened:

```text
http://localhost:4175/app?district=founders-plot&entry=play-first&foundersFeatureFlags=none
```

Observed:

- Founders Plot modal iframe propagated `foundersFeatureFlags=none`.
- Founders game shell and Three.js stage were visible.
- Future labels checked in the iframe (`Creator Buildings`, `Governor Ledger`) were not visibly exposed.
- `Civic project` text was absent in the V1.5-only route.

## Known Caveats

- The worktree has an unrelated uncommitted vendor submodule pointer at
  `vendors/openclaw-lite-main/vendor/openclaw-main`. It is not part of this QA
  response and is not staged.
- Untracked ad-hoc screenshot artifacts under `artifacts/` are local evidence
  from previous browser checks and are intentionally not part of this patch
  unless explicitly promoted.
