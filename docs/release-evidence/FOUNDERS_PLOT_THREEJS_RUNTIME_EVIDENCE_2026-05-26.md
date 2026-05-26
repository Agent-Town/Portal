# Founders Plot Three.js Runtime Evidence — 2026-05-26

Branch: `codex/founders-plot-roadmap-v15-v45-completion`

## Required Checks

Recurring gate: `specs/release-gates/threejs_runtime_gate.md`.

| Check | Evidence |
| --- | --- |
| Mobile FPS smoke | `e2e/214_founders_plot_threejs_playable_slice.spec.js` verifies 390px scene info reports `performance.averageFps > 20`. |
| WebGL unavailable fallback | `scene_render.js` catches Three.js render failure and falls back to `data-renderer="dom-layered"` with `data-renderer-fallback-reason`; `e2e/214` monkeypatches `renderPlotScene()` to throw `WEBGL_UNAVAILABLE`. |
| Route-exit cleanup/disposal | `three_scene_entry.js` exposes `disposeStage`; `e2e/214` disposes the renderer and verifies `getThreeSceneInfo()` returns null. |
| Asset budget | `tests/founders_plot_threejs_runtime_evidence.test.js` verifies the Founders Plot asset manifest is <= 6 MiB and no individual asset is > 750 KiB. |
| Interactive picking proof | `e2e/214_founders_plot_threejs_playable_slice.spec.js` selects live scene objects through the rendered world and verifies the state-backed selected detail flow. |
| Keyboard/accessibility mirror proof | `scene_render.js` keeps semantic DOM hooks and fallback layers active while Three.js renders; V5+ slices must extend this with per-cell/object keyboard coverage. |
| Screenshot evidence | `artifacts/founders-plot-v15-second-contract-desktop.png`, `artifacts/founders-plot-v15-second-contract-mobile.png`, and `artifacts/founders-plot-v15-second-contract-scene-desktop.png`. |
| No canvas-only state | `scene_state.js` adapts server payloads into render objects and state coverage; future gameplay state must remain available through API/DOM/test hooks. |

## Release Stance

These checks are required before treating the Three.js world surface as a
production renderer for a future slice. They do not promote V1.6+ systems; those
remain feature-gated prototypes until their release gates are met.
