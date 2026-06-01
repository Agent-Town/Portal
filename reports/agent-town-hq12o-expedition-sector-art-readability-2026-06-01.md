# Agent Town HQ12O Expedition Sector Art Readability

Status: PASS

## Summary

Completed a bounded frontend readability pass for the Expedition Map sector presentation after HQ12N. The changes are presentation-only: stronger fog-state art treatment for map cells and legend swatches, more scannable sector cards, a clearer selected-sector visual frame, and focused FP-E2E-022 proof for the HQ12O guardrails.

The worktree was already heavily dirty. No unrelated files were reverted or cleaned.

## Changed Files

- `public/experiences/founders-plot/founders-plot.css`
  - Added more game-like layered map backgrounds for the Three.js host and fallback board.
  - Strengthened discovered, known, hinted, and locked_unknown visual states for cells and legend swatches.
  - Added sector-card state markers, texture, shadow, and selected-card emphasis for faster scanning.
- `public/experiences/founders-plot/founders-plot.js`
  - Added `data-fog-state` and `data-cell-id` to revealed sector cards for proof/readability assertions.
- `e2e/200_founders_plot.spec.js`
  - Extended `FP-E2E-022` with HQ12O screenshots and proof JSON.
  - Added assertions for four fog states, hidden-cell redaction, Scout Sector-only mutation path, and buttonless Event Packet / Expedition Party / Objective surfaces.
- `reports/agent-town-hq12o-expedition-sector-art-readability-proof-2026-06-01.json`
- `reports/agent-town-hq12o-expedition-sector-art-readability-desktop-2026-06-01.png`
- `reports/agent-town-hq12o-expedition-sector-art-readability-mobile-2026-06-01.png`

## Proof Paths

- Proof JSON: `reports/agent-town-hq12o-expedition-sector-art-readability-proof-2026-06-01.json`
- Desktop screenshot: `reports/agent-town-hq12o-expedition-sector-art-readability-desktop-2026-06-01.png`
- Mobile screenshot: `reports/agent-town-hq12o-expedition-sector-art-readability-mobile-2026-06-01.png`

Screenshot dimensions:

- Desktop: `465x3821`
- Mobile: `366x2867`

## Commands And Results

- `node --check public/experiences/founders-plot/founders-plot.js` -> PASS
- `node --check e2e/200_founders_plot.spec.js` -> PASS
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022"` -> PASS, 1 test
- `jq -e '<HQ12O guardrail expression>' reports/agent-town-hq12o-expedition-sector-art-readability-proof-2026-06-01.json` -> PASS (`true`)
- `identify reports/agent-town-hq12o-expedition-sector-art-readability-desktop-2026-06-01.png reports/agent-town-hq12o-expedition-sector-art-readability-mobile-2026-06-01.png` -> PASS
- `git diff --check -- public/experiences/founders-plot/founders-plot.css public/experiences/founders-plot/founders-plot.js e2e/200_founders_plot.spec.js reports/agent-town-hq12o-expedition-sector-art-readability-proof-2026-06-01.json` -> PASS
- `git diff --check` -> PASS

## Guardrail Verdict

PASS:

- Four fog states are preserved and proved: `discovered`, `known`, `hinted`, `locked_unknown`.
- Hinted selected-sector proof stays read-only/buttonless and does not expose hidden resource amounts, outpost truth, or Scout Sector receipt metadata before reveal.
- Locked unknown remains a non-card, non-action hidden cell; no Scout Sector button is exposed for it.
- Scout Sector remains the only Expedition Map mutation path before reveal, and no Scout Sector buttons remain after the mocked reveal.
- Event Packet, Expedition Party, and Current focus / Objective strip remain read-only and buttonless.
- No server objectives, hidden truth, resources, routes, jobs, timers, rewards, Atlas execution, public sharing, Generated Universe rendering, route/trade/economy/combat/scheduler/cross-plot/external effects, or Wild West/cowboy/saloon/gold-rush drift were introduced.
