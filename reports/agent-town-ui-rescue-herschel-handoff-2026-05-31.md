# AgentTown Herschel UI/UX Rescue Handoff

Date: 2026-05-31
Workspace: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Scope

Bounded UI/UX rescue pass for Founders Plot and the Progression Atlas modal surface. No server gameplay truth, authority boundaries, routes, or worker behavior were changed.

Inspected current proof/report inputs:

- `reports/agent-town-hq3-hq10-image-assets-integration-2026-05-31.md`
- `reports/agent-town-pathfinder-scout-sprite-integration-2026-05-31.md`
- `reports/agent-town-ui-rescue-baseline-founders-plot-desktop-2026-05-31.png`
- `reports/agent-town-ui-rescue-baseline-founders-plot-mobile-2026-05-31.png`
- `reports/agent-town-ui-rescue-baseline-founders-plot-atlas-modal-desktop-2026-05-31.png`
- `reports/agent-town-ui-rescue-baseline-founders-plot-atlas-modal-mobile-2026-05-31.png`
- `reports/agent-town-ui-rescue-baseline-atlas-iframe-desktop-2026-05-31.png`
- `reports/agent-town-ui-rescue-baseline-atlas-iframe-mobile-2026-05-31.png`

## Changes

- Tightened Founders Plot responsive layout:
  - Header now spans/wraps cleanly on mobile and tablet widths.
  - Resource strip reuses existing GPT Image 2 resource assets for wood, stone, and food instead of emoji-only presentation.
  - Main plot scene now uses a landscape aspect ratio, reducing the large empty top/bottom bands while preserving the 3x3 interaction grid.
  - Mobile Recap control no longer floats over primary Foreman controls.

- Polished Founders Plot generated-asset card usage:
  - Scout Report, Site Plan, Settlement Claim, and Research Lodge cards now lay out generated card art beside copy on wider surfaces and scale down on mobile.
  - Card text is constrained with `minmax(0, 1fr)` patterns to avoid overflow.

- Improved Progression Atlas inside the Founders Plot modal:
  - Modal height now uses the viewport instead of leaving excess unused backdrop.
  - Embedded Atlas gets an explicit body class for tighter iframe padding.
  - Atlas panels use `min-width: 0` so grid children cannot force page-wide horizontal overflow.
  - Canonical Progression Map wraps into a readable 3-column mobile grid instead of clipping long lanes offscreen.

No new image generation was needed; this pass reused already-integrated repo assets.

## Proof Images

- `reports/agent-town-ui-rescue-after-founders-plot-desktop-2026-05-31.png`
- `reports/agent-town-ui-rescue-after-founders-plot-mobile-2026-05-31.png`
- `reports/agent-town-ui-rescue-after-founders-plot-atlas-modal-desktop-2026-05-31.png`
- `reports/agent-town-ui-rescue-after-founders-plot-atlas-modal-mobile-2026-05-31.png`
- `reports/agent-town-ui-rescue-after-founders-plot-atlas-map-desktop-2026-05-31.png`
- `reports/agent-town-ui-rescue-after-founders-plot-atlas-map-mobile-2026-05-31.png`
- `reports/agent-town-ui-rescue-proof-contact-sheet-2026-05-31.png`

Note: direct `/progression-atlas` access redirects back to the Founders Plot modal entry path by design, so Atlas proof was captured through the modal iframe.

## Validation

Passed:

- `node --check public/progression-atlas.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `git diff --check`
- `PW_PORT=4181 npx playwright test e2e/200_founders_plot.spec.js e2e/214_founders_plot_threejs_playable_slice.spec.js e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium`

Playwright result: `15 passed (1.9m)`.

## Residual Risk

The full `npm test` suite was not run for this bounded UI/UX lane. Targeted Founders Plot, Three.js scene, and Progression Atlas/OpenClaw Lite coverage passed.
