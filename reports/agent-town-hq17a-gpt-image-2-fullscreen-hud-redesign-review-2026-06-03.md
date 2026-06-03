# AgentTown HQ17A GPT Image 2 Fullscreen HUD Redesign Review

Generated: 2026-06-03
Model: `openai/gpt-image-2`
Verdict: `REVIEW_MEDIA_READY_RUNTIME_PROMOTION_HELD`

## Summary

HQ17A produced three GPT Image 2 fullscreen HUD redesign concepts for the Expedition Map. The goal was to get unstuck from the current debug-like interface direction by exploring a game-native HUD where the map remains the primary play surface and large text/card spaces collapse into compact instruments, pips, rings, unit docks, and optional ledger tabs.

The concepts are review media only. They are not runtime assets, not cropped/alpha-ready UI chrome, and not bound to DOM/CSS.

## Deliverables

- Contact sheet: `reports/agent-town-hq17a-gpt-image-2-fullscreen-hud-redesign-review-contact-sheet-2026-06-03.png`
- Concept 01: `reports/media/agent-town-hq17a-gpt-image-2-fullscreen-hud-redesign-review-2026-06-03/agent-town-hq17a-fullscreen-hud-redesign-concept-01-2026-06-03.png`
- Concept 02: `reports/media/agent-town-hq17a-gpt-image-2-fullscreen-hud-redesign-review-2026-06-03/agent-town-hq17a-fullscreen-hud-redesign-concept-02-2026-06-03.png`
- Concept 03: `reports/media/agent-town-hq17a-gpt-image-2-fullscreen-hud-redesign-review-2026-06-03/agent-town-hq17a-fullscreen-hud-redesign-concept-03-2026-06-03.png`
- Proof JSON: `reports/agent-town-hq17a-gpt-image-2-fullscreen-hud-redesign-review-proof-2026-06-03.json`

## Prompt Intent

The prompt used the current HQ16P/HQ16Y Expedition Map screenshots for gameplay structure, the North Star image for visual ambition and full-bleed map readability, and the HQ16W generated chrome sheet for material cues only.

Requested direction:

- Fullscreen 16:9 game UI mockup.
- Map fills almost the whole screen.
- No giant blank cards or large debug text panels.
- Compact edge-anchored HUD instruments: objective crest, unit dock, command pucks/radials, ledger tab, pips, spatial target rings.
- Founded frontier outpost plus next Scout bridge/target visible on-map.
- Frontier-town Agent Town warmth with timber, brass, canvas, worn teal trim, warm lamps, and subtle agent-tech glow.
- Human-plus-agent collaboration through unit/portrait/token hints.
- No readable paragraphs, labels, logos, endpoints, proof copy, or paperwork-heavy text.

## Review Notes

- Concept 01 is the strongest immediate direction for replacing the current oversized text/card spaces: it keeps command pucks near the selected unit, uses a compact bottom unit rail, and makes the route/objective path readable without turning the UI into a dashboard.
- Concept 02 is the strongest strategic-map layout: it has the clearest fog-of-war spread and minimap/edge-tool layout, but the top/right resource rails lean more conventional strategy UI.
- Concept 03 is the strongest frontier-town flavor and visible play loop, but it carries more narrative/path content and would need tighter runtime simplification before implementation.

## Guardrails

- No runtime source edits.
- No server, store, route, tool, schema, package, or generated universe edits.
- No runtime asset promotion under `public/experiences/founders-plot/assets/`.
- No DOM/CSS binding, image hitboxes, command authority, map truth, hidden-truth leakage, movement, fog reveal, route/trade/economy/resource/reward/combat/scheduler behavior, Atlas execution, cross-plot mutation, deploy, merge, push, public share, or external effect.
- Existing server-owned gameplay authority remains unchanged.

## Verification

- `file` confirmed all three concepts are PNG images.
- `sips -g pixelWidth -g pixelHeight` confirmed all three concepts are `2048 x 1152`.
- `shasum -a 256` recorded source hashes.
- Contact sheet generated and validated as a PNG.

## Next

Use this as a design target for a bounded runtime HUD implementation lane: keep the current Expedition Map authority model, but move toward concept 01's full-screen composition, compact unit dock, command pucks near selected units, right-edge collapsed ledger, and map-first objective/route pips.
