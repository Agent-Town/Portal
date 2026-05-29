# AgentTown Progression Atlas HQ10 Horizon

Date: 2026-05-29
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Mode: implementation slice, advisory-only Atlas planning

## Summary

Added an `HQ10 Horizon` path to the Founders Plot Progression Atlas. The path uses current server-owned Founders Plot truth through HQ5, then marks HQ6-HQ10 as future/advisory milestones rather than pretending they are implemented gameplay.

The new horizon answers: "what becomes possible by HQ10?"

- HQ6: Expedition Board, scout reports, nearby site discovery, Rook receipts.
- HQ7: Settler Convoy, second plot claim/founding, territory/resource specialization.
- HQ8: Research Lodge, doctrines, technology boosts, strategic divergence.
- HQ9: Agent Cohorts, scoped work orders, bounded delegation, receipt-backed teams.
- HQ10: World Grid Civilization, cross-plot civic projects, Generated Universe visual overlays, long-term Atlas/Oracle memory.

## Guardrails

- HQ1-HQ5 remain the only current canonical engine truth.
- HQ6-HQ10 are explicitly `future_placeholder` strategy steps.
- Atlas action refs remain non-executable; actual gameplay mutation still goes through `et.plot.*` tools and approvals.
- Generated visuals and future packs remain presentation-only unless a later canonical model promotes them.

## Implementation

- Added `hq10-horizon` to strategy templates and OpenClaw Lite-facing tool docs.
- Added `atlas.futureHorizon` to the server read model with HQ6-HQ10 milestone metadata, possibility notes, risks, guardrails, and next implementable slices.
- Added a visible `HQ10 Horizon` panel and draft button in the Progression Atlas UI.
- Extended strategy compare and tree rendering to display future milestones.
- Rebuilt OpenClaw Lite browser worker artifacts so the registry describes the HQ10 horizon strategy.

## Evidence

Screenshot:

- `reports/progression-atlas-hq10-horizon-panel-2026-05-29.png`

Validation:

- `node --check server/founders_plot/progression_atlas.js`
- `node --check public/progression-atlas.js`
- `node --check e2e/114_progression_atlas_openclaw_lite.spec.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `node --check vendors/openclaw-lite-main/src/openclaw-lite/worker.js`
- `npm run build:openclaw-lite`
- `NODE_PATH=/Users/robin/Projects/Portal/node_modules node --test tests-founders-plot/fp-http.test.js` passed 12/12
- `NODE_PATH=/Users/robin/Projects/Portal/node_modules npm run test:founders-plot` passed 43/43
- `NODE_PATH=/Users/robin/Projects/Portal/node_modules /Users/robin/Projects/Portal/node_modules/.bin/playwright test e2e/113_experience_intent_tool_registry.spec.js e2e/114_progression_atlas_openclaw_lite.spec.js` passed 3/3
- Broader relevant Playwright subset `108`, `109`, `113`, `114`, `200`, `214` passed 15/15
- `git diff --check` passed

Local preview:

- `http://localhost:4365/app`
- screen session: `progression-atlas-ui-4365`
