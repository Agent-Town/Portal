# AgentTown Newest Build Playtest Follow-Up Fixes - 2026-05-31

## Verdict

Franklin's two follow-up blockers are resolved in this bounded lane.

- High mobile overflow/occlusion: fixed for a 390x844 mobile viewport. The dense final surface now captures at 390px wide with `documentScrollWidth: 390` and `bodyScrollWidth: 390`.
- Medium Expedition Board selection flakiness: hardened so HTML tile buttons win over Three.js scene raycasts. A dense 3x3 UI test now clicks the Expedition Board tile and surfaces the intended `Dispatch scout` affordance.

## Changes

- `public/experiences/founders-plot/founders-plot.css`
  - Added mobile containment for the Founders Plot shell, panels, cards, buttons, palette items, and header text.
  - Converted the recap drawer from offscreen `right` positioning to transform-based hiding with `max-width: 100vw`, preventing hidden or open drawer state from widening mobile full-page captures.
  - Tightened small-screen panel/card spacing and art columns so late-game cards stay inside the 390px surface.
- `public/experiences/founders-plot/three_scene_entry.js`
  - Added a tile-click guard in the Three.js stage capture handler. Clicks that originate on `.fp-tile` now flow directly to the HTML tile button instead of being intercepted by visual-only scene pick targets.
- `public/experiences/founders-plot/three_scene_bundle.js`
  - Rebuilt from `three_scene_entry.js` with `node scripts/build_founders_plot_threejs_bundle.mjs`.
- `e2e/200_founders_plot.spec.js`
  - Added `FP-E2E-015` for 390px dense mobile no-overflow/no-clipped-card assertions.
  - Added `FP-E2E-016` for dense 3x3 Expedition Board tile selection and scout affordance visibility.
  - The dense fixture is UI-only and does not execute gameplay through backend shortcuts.

No gameplay authority, engine rules, costs, routes/tools, settlement/doctrine/work-order semantics, Atlas execution behavior, or server endpoints were changed.

## Proof

- Mobile 390x844 after-fix proof: `reports/agent-town-newest-build-followup-mobile-390x844-after-fix-2026-05-31.png`
- Expedition Board selected proof: `reports/agent-town-newest-build-followup-expedition-board-selected-2026-05-31.png`

ImageMagick:

```bash
identify reports/agent-town-newest-build-followup-mobile-390x844-after-fix-2026-05-31.png reports/agent-town-newest-build-followup-expedition-board-selected-2026-05-31.png
# reports/agent-town-newest-build-followup-mobile-390x844-after-fix-2026-05-31.png PNG 390x4525 ...
# reports/agent-town-newest-build-followup-expedition-board-selected-2026-05-31.png PNG 390x4751 ...
```

Captured layout metric:

```json
{"viewport":390,"documentScrollWidth":390,"bodyScrollWidth":390}
```

## Verification

```bash
node --check public/experiences/founders-plot/founders-plot.js
# passed
```

```bash
node --check e2e/200_founders_plot.spec.js
# passed
```

```bash
node --check public/experiences/founders-plot/three_scene_entry.js
node --check public/experiences/founders-plot/three_scene_bundle.js
# passed
```

```bash
PW_PORT=4205 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-015|FP-E2E-016"
# 2 passed
```

```bash
PW_PORT=4207 npx playwright test e2e/200_founders_plot.spec.js --project=chromium
# 16 passed
```

```bash
git diff --check
# passed
```

## Remaining Risk

- The mobile proof uses a dense mocked read model to stress the UI surface. It verifies the exact 390px layout and UI affordances but does not replay the full natural gameplay path.
- The Three.js bundle is generated output; future renderer edits should continue to patch `three_scene_entry.js` and rebuild the bundle.
