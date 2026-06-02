# AgentTown HQ15S - Fog / Selected / Inspector Symbol Compaction

Date: 2026-06-02

## Result

PASS for the implemented frontend/test-harness slice. Playwright/browser proof was intentionally not run after Robin asked to stop extended test chasing.

## What Changed

- Converted primary fog pips to symbol/count counters. Visible text now uses short codes such as `DISC`, `KNOWN`, `HINT`, and `LOCK`; full fog meanings remain in `aria-label`, `title`, `data-label`, and the collapsed fog/status ledger.
- Compact selected-sector summary into a symbol tray:
  - visible compact cell label and fog code instead of raw `cell_*` prose,
  - scout eligibility glyph,
  - receipt count/seal,
  - party avatar initials only.
- Moved selected summary facts such as Scout eligibility, sealed provenance, receipt trace detail, and party role labels into `aria-label`, `title`, data attributes, or collapsed detail surfaces.
- Made receipt trace visible form compact (`⚿` plus receipt count) while keeping full receipt/provenance text in accessibility metadata.
- Made party badges avatar-only in the default selected tray; role names remain accessible through each badge `aria-label`/`title`.
- Replaced semantic zoom overlay prose with compact tier/count badges (`Survey`/`Sector`/`Detail`, `R# H#`, compact selected-cell/fog code). Full zoom explanations remain in accessibility labels and titles.
- Reduced objective strip visible text to compact focus/mode/fact codes and moved body/boundary/authority prose into the collapsed Receipts details.
- Reduced right inspector chrome to `VIS`, compact selected-cell/fog code, and short status chips (`SRV`, `R#`, `H#`, action glyph). Full status remains in the inspector `aria-label`.
- Collapsed the status card's visible metrics/fog legend/authority prose behind `fp-expedition-map-authority-details`; the visible status card now shows only title plus compact status symbols.
- Updated focused e2e assertions to prove data attributes/accessibility and absence of old primary prose instead of requiring visible long copy.
- Added HQ15S screenshot/proof output paths in `FP-E2E-022`, but did not run Playwright, so those screenshot files were not generated in this turn.

## Guardrails

- No server routes, payload shapes, command IDs, mutation authority, unit read model, renderer target rings, assets, or hidden-truth rules were changed.
- No new mutation paths were added.
- Scout Sector remains the only fog reveal path.
- Scout movement, Surveyor, and Settler command behavior from the existing HQ15 checkpoint was not changed.
- Hidden/hinted/locked sectors still do not expose resources, routes, rewards, or hidden truth in the visible primary surfaces.
- Fog ledger, selected-sector proof, evidence packet, objective receipts, status/fog ledger, and sector action aliases remain collapsed/non-primary.

## Verification

- PASS: `node --check public/experiences/founders-plot/founders-plot.js e2e/200_founders_plot.spec.js e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- PASS: `git diff --check -- public/experiences/founders-plot/founders-plot.js public/experiences/founders-plot/founders-plot.css e2e/200_founders_plot.spec.js e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- NOT RUN: `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --reporter=line`
- NOT RUN: `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js -g "FP-E2E-023" --reporter=line`
- NOT RUN: screenshot file checks, because Playwright was not run and no HQ15S screenshots were generated.

## Files Changed

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `reports/agent-town-hq15s-fog-selected-inspector-symbol-compaction-2026-06-02.md`
- `reports/agent-town-hq15s-fog-selected-inspector-symbol-compaction-proof-2026-06-02.json`
