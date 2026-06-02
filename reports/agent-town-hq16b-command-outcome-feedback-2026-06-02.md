# AgentTown HQ16B Command Outcome Feedback

Date: 2026-06-02
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Base checkpoint: `1f6773e Add AgentTown direct map command preview`

## Summary

Implemented map-first outcome feedback after direct Expedition Map command preview Confirm flows.

Confirmed commands now leave a short, server-result-backed receipt on the map surface:

- A compact outcome chip inside the Three.js map host.
- A visual-only renderer pulse on the affected target cell.
- Renderer proof metadata for the pulse: visual-only, read-only, non-selectable, zero executable actions, no route/action authority.

Covered commands:

- `move_unit`
- `scout_sector`
- `prepare_settler_convoy`
- `found_settlement`

## Implementation Notes

- Existing guarded frontend handlers still execute the mutations:
  - `doMoveExpeditionUnit`
  - `doScoutExpeditionSector`
  - `doPrepareSettlerConvoy`
  - `doFoundSettlement`
- Existing endpoints and payload shapes are unchanged.
- Outcome feedback is set only after a successful server response and is then rendered against the refreshed server-owned read model.
- The renderer receives `outcomeFeedback` as a presentation hint only. Outcome sprites are not added to the pickable list.
- The outcome chip is short-lived and map-attached, so the player can see what changed before reading drawers or relying on toast text.

## Browser Proof

`FP-E2E-022` now exercises direct map target preview Confirm for all four covered commands and writes:

- `reports/agent-town-hq16b-command-outcome-feedback-proof-2026-06-02.json`
- `reports/agent-town-hq16b-command-outcome-feedback-desktop-2026-06-02.png`

Proof highlights:

- All four direct map preview Confirm flows were covered.
- The chip appeared with `data-server-owned-result="true"`, `data-visual-only="true"`, `data-read-only="true"`, and `data-executable-actions="0"`.
- Renderer metadata recorded one command outcome pulse for each checked command.
- Guardrails show no renderer mutation authority and no added route/unit payload fields for Surveyor/Settler commands.

## Guardrails

Preserved:

- Server-owned authority model.
- Existing guarded frontend handlers and existing endpoints.
- Scout Sector as the only fog reveal path.
- Scout movement limited to existing server-owned movement route and rules.
- Surveyor/Settler commands still use existing `prepare-settler-convoy` and `found-settlement` endpoints with existing payload shape.

Not added:

- Renderer-side mutations.
- Hidden autonomy.
- Atlas execution.
- Generated Universe runtime expansion.
- Hidden-truth leakage.
- Route/trade/economy/resource/reward/combat/scheduler/cross-plot behavior.
- External effects, deploy, merge, commit, push, or public share.

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check e2e/200_founders_plot.spec.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --reporter=line` - 1/1 passed
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --reporter=line` - 1/1 passed
- `npm run test:founders-plot` - 98/98 passed
- `jq -e '.ok == true and .directMapPreviewConfirmCovered.move_unit == true and .directMapPreviewConfirmCovered.scout_sector == true and .directMapPreviewConfirmCovered.prepare_settler_convoy == true and .directMapPreviewConfirmCovered.found_settlement == true and .guardrails.outcomeFeedbackExecutableActions == 0 and .guardrails.outcomeFeedbackAuthority == false and .guardrails.rendererExecutesMutations == false' reports/agent-town-hq16b-command-outcome-feedback-proof-2026-06-02.json`
- `file reports/agent-town-hq16b-command-outcome-feedback-desktop-2026-06-02.png`
- `git diff --check`
