# AgentTown HQ16F Guided Expedition Loop UI

Date: 2026-06-02
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Base checkpoint: `e57823d Add AgentTown command outcome feedback`

## Verdict

`IMPLEMENTED_AND_VERIFIED`

HQ16F turns the HQ16C report-only guided-loop plan into a compact, read-only rail inside the existing Expedition Map objective strip. It organizes the current map state into five phases:

`OBJ -> CMD -> RES -> RCP -> NXT`

The rail is derived only from existing server-owned Expedition Map cells, unit command hints, event packets, and the latest HQ16B command outcome feedback.

## What Changed

- Added a pure frontend guided-loop derivation helper in `founders-plot.js`.
- Added a compact five-step rail under the existing `fp-expedition-objective-strip`.
- Preserved the existing objective strip data contract for older HQ12/HQ15 proof surfaces.
- Added focused e2e assertions for:
  - read-only / zero-action rail attributes;
  - five fixed phases;
  - packet objective mode after Scout Sector;
  - next step derived from existing `found_settlement` command hint;
  - no buttons or new mutation affordances;
  - mobile overflow guard coverage.
- Added CSS for dense desktop/mobile presentation with ellipsis and narrow-screen overflow containment.

## Guardrails

- No server route, tool action, store, engine, schema, or API contract change.
- No new endpoint payload.
- No renderer-side mutation execution.
- No Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, cross-plot mutation, route/trade/economy/resource/reward/combat/scheduler expansion, public sharing, deploy, merge, or external effect.
- Scout Sector remains the only fog reveal path.
- Scout movement remains adjacent discovered/known same-plot only.
- Surveyor and Settler commands remain existing guarded endpoints only.

## Expected Artifacts

- Proof JSON: `reports/agent-town-hq16f-guided-expedition-loop-ui-proof-2026-06-02.json`
- Desktop screenshot: `reports/agent-town-hq16f-guided-expedition-loop-ui-desktop-2026-06-02.png`

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `git diff --check`
- Focused Playwright `FP-E2E-022` passed `1/1`
- Proof JSON `jq empty`
- Screenshot `file`
- `npm run build:founders-plot-threejs`
- `npm run test:founders-plot` passed `98/98`

Focused Playwright rewrote older tracked report artifacts as usual; those side effects were restored, leaving only the intended HQ16F source/e2e/CSS/report/proof/screenshot changes.
