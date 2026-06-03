# AgentTown HQ17G HUD Materiality

Date: 2026-06-03
Verdict: PASS

## Summary

HQ17G keeps the HQ17F single visible HUD owner intact and improves only the renderer-owned Expedition Map HUD materiality. Three.js/canvas still paints the visible HUD; DOM remains a transparent hit/accessibility/test-selector layer.

The renderer now uses `hq17g_renderer_owned_hud_materiality_v1` procedural canvas textures for stronger beveled metal/parchment chrome, darker bottom hardware, rivets, inset plates, portrait medallions, command medals, selected-context framing, and objective/status motifs. Existing server-owned unit data, command hints, and HQ15E unit sprites remain the content source.

## Artifacts

- Proof JSON: `reports/agent-town-hq17g-hud-materiality-proof-2026-06-03.json`
- Desktop screenshot: `reports/agent-town-hq17g-hud-materiality-desktop-2026-06-03.png`
- Mobile screenshot: `reports/agent-town-hq17g-hud-materiality-mobile-2026-06-03.png`
- Contact sheet: `reports/agent-town-hq17g-hud-materiality-contact-sheet-2026-06-03.png`
- Focused proof: `e2e/213_founders_plot_hq17g_hud_materiality.spec.js`

## Guardrails

Preserved:
- `visibleHudOwner: "three_canvas"`
- `visibleDomHudPaintCount: 0`
- `visibleDomHudTextCount: 0`
- `existingDomCommandHandlersRetained: true`
- `existingDomCommandPayloadShapeRetained: true`
- `noAuthorityExpansion: true`
- `noMobileHorizontalOverflow: true`
- no server route, API, schema, store, tool, scheduler, Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, route/trade/economy/resource/reward/combat expansion, cross-plot mutation, deploy, commit, push, public share, or external effect.

## Validation

Passed:
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check e2e/213_founders_plot_hq17g_hud_materiality.spec.js`
- `npm run build:founders-plot-threejs`
- `PW_PORT=5001 npx playwright test e2e/213_founders_plot_hq17g_hud_materiality.spec.js --project=chromium --workers=1 --reporter=line`
- `jq` proof guardrail inspection
- PNG `file` checks
- `git diff --check`

## Residual Risk

This is a materiality pass, not a complete North Star art rebuild. The HUD now reads more like renderer-owned game chrome, but the underlying terrain/world spectacle and full bespoke HUD art direction still need later dedicated work.
