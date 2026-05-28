# Agent Town Frontier Agentfolk Sprite Set - 2026-05-28

## Branch

- Branch: `neo/founders-plot-frontier-agentfolk-sprite-set-2026-05-28`
- Base: `neo/founders-plot-gpt-image-builder-sprite-2026-05-28`
- Status: local implementation complete; not pushed at report creation time

## Purpose

This slice corrects the inhabitant art direction away from childlike mascot
sprites and toward the baseline Agent Town story: adult compact frontier
agentfolk settling a wild frontier town at the boundary between old humanity
and human + AI agent collaboration.

The art direction is now documented in:

- `docs/specs/agent-town-frontier-agentfolk-style-playbook.md`

The playbook defines:

- story baseline: frontier settlement plus AI collaboration future;
- adult compact silhouettes, not children or plush mascots;
- role-by-role animation playbook for builder, worker, hauler, and messenger;
- generated-universe boundary: packs may style/skin/animate, but must not alter
  resources, formulas, timers, jobs, tools, permissions, actor counts, source
  object IDs, server facts, or mutation behavior.

## Generated Assets

All four role sheets were generated with `openai/gpt-image-2` using the
`v1_4_4` no-hole Clover references plus Founders Plot scene and Lumber Camp
references. Each source is a 2048x2048 PNG with a 4x4 sprite-sheet layout.

Final alpha PNGs:

- `public/experiences/founders-plot/assets/characters/inhabitants/builder/builder-agentfolk-v2.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/worker/worker-agentfolk-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/hauler/hauler-agentfolk-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/messenger/messenger-agentfolk-v1.png`

Source chroma-key PNGs are kept next to each alpha PNG as `.source.png`.
Metadata files are kept next to each alpha PNG as `.json`.

Contact sheet:

- `reports/agent-town-frontier-agentfolk-sprite-set-contact-sheet-2026-05-28.png`

## Transparency

Each generated sheet used a flat magenta chroma-key background. Local alpha
conversion used ImageMagick with a sampled key and fuzz threshold per sheet.

Validated:

- all four final PNGs are 2048x2048 RGBA;
- all four have transparent corners;
- all four have alpha range `0..1`.

## Integration

`public/experiences/founders-plot/scene_state.js` now maps authored sprite
sheets for:

- `builder` -> `builder-agentfolk-v2`
- `worker` -> `worker-agentfolk-v1`
- `hauler` -> `hauler-agentfolk-v1`
- `messenger` -> `messenger-agentfolk-v1`

The mapping remains deterministic and visual-only. Server-derived
`state.visualActors` still owns role, action kind, progress, source object,
selection key, and drawer key. The sprite layer only chooses an image sheet and
animation row.

No gameplay semantics were changed:

- no new economy;
- no new resources;
- no new tools;
- no autonomous actor simulation;
- no mutation endpoint changes;
- no V6 civic mechanics;
- no generated-universe gameplay rules.

## Animation Mapping

Every role uses the same 4x4 contract:

- row 0: `idle`
- row 1: `walk`
- row 2: `work`
- row 3: `ready`

Current mappings:

- builder `CONSTRUCT` / `UPGRADE` -> `work`
- worker `PRODUCE` / `SELL` -> `work`
- hauler `OUTPUT_READY` -> `ready`
- messenger `APPROVAL` / `REWARD` / `QUEST` -> `ready`

## Validation

Passed:

```bash
node --check public/experiences/founders-plot/scene_state.js
node --check e2e/214_founders_plot_threejs_playable_slice.spec.js
node --check tests-founders-plot/fp-scene-state.test.js
npm run build:founders-plot-threejs
node --test tests-founders-plot/fp-scene-state.test.js
npm run test:founders-plot
PW_PORT=4891 npx playwright test e2e/214_founders_plot_threejs_playable_slice.spec.js
PW_PORT=4892 npx playwright test e2e/200_founders_plot.spec.js
git diff --check
```

Results:

- Founders Plot unit/HTTP/perf/scene/integration/replay tests: `38/38`
- Three.js Founders Plot Playwright slice: `1/1`
- Founders Plot page loop Playwright suite: `9/9`

## Notes

- The chat media bridge failed to deliver generated sprite previews directly,
  but all generated files were available locally and were processed into the
  project.
- The old builder proof remains in the repo as a previous asset version:
  `builder-sprite-sheet-gpt2-v1.*`.
- Next polish pass should inspect the sheets visually in-game and decide
  whether to regenerate any one role before expanding this into generated-pack
  overlays.
