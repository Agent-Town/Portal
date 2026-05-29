# AgentTown Progression Atlas Editor OpenClaw Lite Tools

Date: 2026-05-29
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Base commit: `a4dc9ac Add Progression Atlas strategy editor`

## Verdict

The Progression Atlas Strategy Editor is now operable by the in-browser OpenClaw Lite tool surface, not only by manual iframe UI controls.

This is intentionally advisory-only. The editor can draft prompt-backed icon metadata and save private strategy JSON with custom steps and before/after links, but it does not mutate Founders Plot gameplay. Canonical gameplay actions still require `et.plot.*` tools and server policy checks.

## What Changed

- Added OpenClaw Lite tool `agent_town_progression_generate_icon_draft`.
  - Calls `/api/founders-plot/progression-atlas/icons/generate`.
  - Produces prompt-backed icon metadata for private Strategy Editor steps.
  - Does not call external image generation yet.
- Added OpenClaw Lite tool `agent_town_progression_save_edited_strategy`.
  - Saves private Strategy Editor JSON with custom steps, `beforeStepId` / `afterStepId`, icon drafts, goal, summary, and focus metadata.
  - Forces `generatedBy: progression_atlas_strategy_editor_v1`.
  - Defaults to selecting the saved strategy unless `select: false`.
- Exposed both tools in the worker registry, `public/skill.md`, and Progression Atlas server surface metadata.
- Added a test-only gateway helper, `window.__openclawLiteTest.runTool`, so Playwright can exercise the same worker dispatch path.
- Extended browser tests to prove OpenClaw Lite can co-edit an Atlas strategy without changing gameplay state.

## Files Changed

- `vendors/openclaw-lite-main/src/openclaw-lite/worker.js`
- `vendors/openclaw-lite-main/src/openclaw-lite/gateway.js`
- `public/openclaw-lite/worker.js`
- `public/openclaw-lite/worker.js.map`
- `public/openclaw-lite/gateway.js`
- `public/openclaw-lite/gateway.js.map`
- `public/skill.md`
- `server/founders_plot/progression_atlas.js`
- `tests-founders-plot/fp-http.test.js`
- `e2e/113_experience_intent_tool_registry.spec.js`
- `e2e/114_progression_atlas_openclaw_lite.spec.js`

## Validation

Passed:

- `node --check vendors/openclaw-lite-main/src/openclaw-lite/worker.js`
- `node --check vendors/openclaw-lite-main/src/openclaw-lite/gateway.js`
- `node --check server/founders_plot/progression_atlas.js`
- `node --check e2e/114_progression_atlas_openclaw_lite.spec.js`
- `node --check e2e/113_experience_intent_tool_registry.spec.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `npm run build:openclaw-lite`
- `NODE_PATH=/Users/robin/Projects/Portal/node_modules node --test tests-founders-plot/fp-http.test.js`
- `NODE_PATH=/Users/robin/Projects/Portal/node_modules npm run test:founders-plot`
- `NODE_PATH=/Users/robin/Projects/Portal/node_modules /Users/robin/Projects/Portal/node_modules/.bin/playwright test e2e/113_experience_intent_tool_registry.spec.js e2e/114_progression_atlas_openclaw_lite.spec.js`
- `NODE_PATH=/Users/robin/Projects/Portal/node_modules /Users/robin/Projects/Portal/node_modules/.bin/playwright test e2e/108_experience_intent_open_modal.spec.js e2e/109_experience_intent_atlas_search.spec.js e2e/113_experience_intent_tool_registry.spec.js e2e/114_progression_atlas_openclaw_lite.spec.js e2e/200_founders_plot.spec.js e2e/214_founders_plot_threejs_playable_slice.spec.js`
- `git diff --check`

Results:

- HTTP Founders Plot tests: 11/11 passed.
- Founders Plot node test suite: 42/42 passed.
- Targeted Playwright Atlas/Lite tests: 3/3 passed.
- Broader relevant Playwright subset: 15/15 passed.

## Proof Case

New Playwright case `AC-64` runs the actual browser worker dispatch path:

1. Calls `agent_town_progression_get_state`.
2. Calls `agent_town_progression_generate_icon_draft` for `Survey Crossing`.
3. Calls `agent_town_progression_save_edited_strategy` for `Atlas Co-Edit Sketch`.
4. Verifies the saved private strategy is selected and contains the custom editor steps.
5. Verifies `gameplayStableHash`, audit event count, and inventory are unchanged.

## Caveats

- The icon tool is still a prompt/provenance draft, not a raster-generation pipeline.
- The new gateway `runTool` helper is test-facing and intentionally limited to the local OpenClaw Lite harness.
- This does not add public sharing, fork/remix, Generated Universe overlays, or expedition gameplay.

## Recommendation

Next Atlas slice should make Clover/Atlas Oracle use these tools conversationally: propose a private plan, ask before saving, save the edited strategy through OpenClaw Lite, and leave a clear receipt in the Atlas UI.
