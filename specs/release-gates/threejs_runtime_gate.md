# Three.js Runtime Release Gate

Status: required for every future Founders Plot or world-grid renderer change.

Release status: this gate does not promote a feature by itself. It proves that a
renderer-backed slice is safe to evaluate for `release_candidate`.

## Required Evidence

- Mobile FPS smoke: target viewport 390px wide and a representative gameplay
  scene reports a playable frame rate.
- WebGL unavailable fallback: the route degrades to a semantic DOM/layered
  fallback with a visible non-crashing state.
- Route-exit cleanup: renderer, resize listeners, animation loops, and GPU
  resources are disposed when leaving or re-rendering the route.
- Asset budget: total and largest production asset sizes stay inside the active
  sprint budget.
- Interactive picking proof: at least one world object or grid cell can be
  selected through the Three.js surface and opens the same state-backed detail
  flow as the DOM mirror.
- Keyboard/accessibility mirror: selectable world objects or cells exist in a
  semantic DOM mirror with names, roles, and state text.
- Screenshot evidence: desktop and mobile screenshots show the live route, not
  only an isolated canvas or asset.
- No canvas-only state: gameplay state that matters for progress, tools, or
  agent context is available through server state and semantic DOM/test hooks.

## Required Tests

- Playwright renderer smoke for desktop and 390px mobile.
- WebGL fallback test that forces renderer failure.
- Disposal test that proves `getThreeSceneInfo()` or the equivalent world-grid
  runtime probe is cleared after disposal.
- API/unit test proving renderer state does not mutate server-authoritative
  world state.
- Accessibility mirror test for every selectable object family introduced by
  the slice.

## Signoff

- Runtime evidence document is added under `docs/release-evidence/`.
- Screenshots are either committed as approved baseline artifacts or explicitly
  referenced from CI artifacts.
- The relevant roadmap/spec entry links to this gate before the slice can be
  called `release_candidate`.
