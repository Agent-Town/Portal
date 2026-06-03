# AgentTown HQ17F Single-Owner Canvas HUD

Date: 2026-06-03
Verdict: PASS

## Summary

HQ17F makes the Founders Plot Expedition Map HUD a single visible-owner surface: the Three.js/canvas renderer now owns generated HUD chrome, unit portrait masks, short HUD labels, command glyphs, selected context, collapsed ledger hint, and status/objective framing. The DOM HUD remains present for selectors, click handlers, titles, and accessibility labels, but persistent HUD DOM paint/text is demoted to a transparent hit/a11y layer.

This preserves the HQ17C/D/E runtime stack:
- HQ17C generated HUD chrome pack remains provenance/style metadata.
- HQ17D Three.js masked profile and text sprites remain active.
- HQ17E clean canvas-frame compositor remains the painted chrome source; opaque source crops are not painted as live panels.

## Runtime Proof

Proof JSON: `reports/agent-town-hq17f-single-owner-canvas-hud-proof-2026-06-03.json`

Screenshots:
- Desktop: `reports/agent-town-hq17f-single-owner-canvas-hud-desktop-2026-06-03.png`
- Mobile: `reports/agent-town-hq17f-single-owner-canvas-hud-mobile-2026-06-03.png`

Key proof fields:
- `visibleHudOwner: "three_canvas"`
- `domVisibleHudDemoted: true`
- `noVisibleDomHudDuplication: true`
- `visibleDomHudPaintCount: 0`
- `visibleDomHudTextCount: 0`
- `generatedHudTextInThreeLayer: true`
- `generatedHudProfileMasksInThreeLayer: true`
- `generatedHudCommandGlyphsInThreeLayer: true`
- `sourceCropsNotPainted: true`
- `existingDomCommandHandlersRetained: true`
- `existingDomCommandPayloadShapeRetained: true`
- `noMobileHorizontalOverflow: true`

## Guardrails

No server route, API, schema, store, tool, scheduler, route/trade/economy/resource/reward/combat, Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, cross-plot mutation, deploy, commit, push, public share, or external effect was added.

Renderer command glyphs are derived from existing server-owned `expeditionMap.units.items[].commandHints` and are visual-only/read-only. Existing DOM command buttons remain the execution surface and continue to post to existing guarded endpoints.

## Validation

Passed:
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/212_founders_plot_hq17f_single_owner_canvas_hud.spec.js`
- `npm run build:founders-plot-threejs`
- `PW_PORT=4998 npx playwright test e2e/212_founders_plot_hq17f_single_owner_canvas_hud.spec.js --project=chromium --workers=1 --reporter=line`
- `PW_PORT=4999 npx playwright test e2e/209_founders_plot_hq17b_option1_runtime_hud_visual_proof.spec.js e2e/210_founders_plot_hq17c_generated_hud_chrome_runtime.spec.js e2e/211_founders_plot_hq17d_three_masked_hud_profiles.spec.js --project=chromium --workers=1 --reporter=line`
- HQ17F proof `jq` guardrail predicate
- HQ17F screenshot `file` checks
- `git diff --check`

Compatibility note: rerunning HQ17D refreshed its existing mobile screenshot and proof JSON with the current renderer metadata.

## Residual Risk

This is an ownership and duplication fix, not a full North Star art pass. The renderer now owns the visible HUD, but the underlying chrome is still clean procedural canvas-frame styling rather than a fully bespoke generated/native game HUD art system.
