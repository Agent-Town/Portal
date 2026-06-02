# HQ16P Expedition Map Game HUD Shell

Date: 2026-06-02
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Base checkpoint: `9d9741f Add AgentTown found-outpost map result`
Verdict: PASS

## Summary

The primary Expedition Map frame now reads more like game UI and less like an audit/debug panel. Visible fog, objective, command, unit, result, and status markers use compact map glyphs and pips while preserving authority/proof text in titles, aria labels, data attributes, tests, proof JSON, and collapsed Details/Debug drawers.

No server authority moved into the renderer. Existing guarded endpoints remain the only command execution path.

## Changed Files

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`
- `e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js`
- `reports/agent-town-hq16p-expedition-map-game-hud-shell-proof-2026-06-02.json`
- `reports/agent-town-hq16p-expedition-map-game-hud-shell-2026-06-02-desktop.png`
- `reports/agent-town-hq16p-expedition-map-game-hud-shell-2026-06-02-mobile.png`
- `reports/agent-town-hq16p-expedition-map-game-hud-shell-2026-06-02.md`
- Regenerated HQ16M/HQ16O bridge proof screenshots and proof JSONs from the same focused browser flow.

## Implementation

- Replaced primary visible state-machine abbreviations with icon-first tokens for fog, objectives, command affordances, movement boundaries, cell kinds, selected-map summary, guided-loop phases, unit dock meta, and outcome/status pips.
- Kept authority and proof details available through non-primary surfaces: `title`, `aria-label`, `data-*` attributes, JSON proof, and collapsed Debug/Details drawers.
- Tightened the Expedition Map unit dock styling into a compact game-HUD surface with smaller unit tokens, command chips, ready pips, and denser responsive layout.
- Updated focused Playwright expectations so primary visible HUD surfaces reject old debug strings like `OBJ/CMD/RES/FX/NXT`, `DISC/KNOWN/HINT/LOCK`, paperwork/endpoint/proof wording, and claim/status debug labels.
- Extended the HQ16M/HQ16O bridge proof path with HQ16P desktop/mobile screenshots and guardrails for symbol-first HUD text, collapsed details, preserved authority datasets, and no added client authority.

## Proof

Focused browser proof:

- `npx playwright test e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js --project=chromium --grep "FP-E2E-022M" --reporter=line`
- Result: `1 passed`
- `npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022" --reporter=line`
- Result: `1 passed`

Integrity checks:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `node --check e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js`
- `jq empty reports/agent-town-hq16p-expedition-map-game-hud-shell-proof-2026-06-02.json`
- `file reports/agent-town-hq16p-expedition-map-game-hud-shell-2026-06-02-desktop.png reports/agent-town-hq16p-expedition-map-game-hud-shell-2026-06-02-mobile.png`
- `git diff --check`

Screenshot file proof:

- Desktop: `PNG image data, 1232 x 789, 8-bit/color RGB, non-interlaced`
- Mobile: `PNG image data, 366 x 757, 8-bit/color RGB, non-interlaced`

HQ16P proof guardrails:

- `primaryDebugTextHidden: true`
- `oldPhaseCodesHidden: true`
- `oldFogCodesHidden: true`
- `unitDockIconFirst: true`
- `detailsDrawerAvailable: true`
- `detailsDrawerCollapsedByDefault: true`
- `authorityDataPreserved: true`
- `serverAuthorityUnchanged: true`

## Guardrails

No server routes, tool actions, API payloads, store/engine authority, Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation beyond the existing Found Settlement contract, external effects, push, deploy, merge, public share, or history rewrite.

## Residual Risks

- This is a presentation/HUD shell slice over the existing Expedition Map controls. It does not expand gameplay systems.
- Focused browser proof covers the main HQ12B Expedition Map path and the HQ16M-to-HQ16O map path on desktop/mobile, but it does not exhaustively assert every glyph replacement in every possible progression state.
