# AgentTown HQ15T - Symbol-First Command Surface QA

Date: 2026-06-02

## Result

PASS. The HQ15Q/R/S text-replacement pass is integrated, browser-verified, and screenshot-reviewed.

The Expedition Map now reads much less like a transcript:

- unit roster: compact sprite/icon rail with role/location badges;
- command bar: short command controls plus compact target/count/authority chips;
- fog pips: symbol/count counters instead of long state explanations;
- selected sector: compact symbol tray with receipt and party avatars;
- inspector/status/objective surfaces: short visible labels with full facts preserved in accessibility metadata and collapsed ledgers.

## Parent QA Fix

The first refreshed HQ15S desktop screenshot exposed one concrete regression: the right inspector's collapsed drawer summaries were cramped and overlapping after the text compaction.

Parent fixed it by:

- shortening visible drawer labels and metadata in `appendExpeditionInspectorSection`;
- preserving full drawer label/meta in `title` and `aria-label`;
- adding CSS ellipsis/no-wrap constraints for inspector summaries.

The refreshed desktop screenshot no longer shows overlapping drawer summary text.

## Screenshots

- `reports/agent-town-hq15t-symbol-first-command-surface-qa-desktop-2026-06-02.png`
- `reports/agent-town-hq15t-symbol-first-command-surface-qa-mobile-2026-06-02.png`
- `reports/agent-town-hq15t-symbol-first-command-surface-qa-contact-sheet-2026-06-02.png`

The HQ15T desktop/mobile screenshots are generated from the refreshed post-fix HQ15S browser screenshots and packaged as the final QA evidence set.

## Verification

- PASS: `node --check public/experiences/founders-plot/founders-plot.js e2e/200_founders_plot.spec.js e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- PASS: `jq empty` for HQ15Q, HQ15R, and HQ15S proof JSON
- PASS: `git diff --check`
- PASS: `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --reporter=line`
- PASS: `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js -g "FP-E2E-023" --reporter=line`
- PASS: `npm run build:founders-plot-threejs`
- PASS: `npm run test:founders-plot` (`98/98`)
- PASS: final HQ15S/HQ15T screenshot file checks

## Guardrails

- No commit, push, deploy, merge, public share, or external action happened.
- No server route, payload shape, command ID, command authority, unit read model, renderer target-ring authority, asset authority, or hidden-truth rule was changed by HQ15Q/R/S/T.
- Scout Sector remains the only fog reveal mutation path.
- Scout movement remains adjacent discovered/known same-plot movement only.
- Surveyor and Settler commands still use existing guarded endpoints.
- Hidden/hinted/locked sectors still do not expose resources, routes, rewards, actions, or private truth.
- Proof/authority details remain available through accessibility metadata and collapsed ledger/receipt surfaces.

## Files Added By This QA Layer

- `reports/agent-town-hq15t-symbol-first-command-surface-qa-2026-06-02.md`
- `reports/agent-town-hq15t-symbol-first-command-surface-qa-proof-2026-06-02.json`
- `reports/agent-town-hq15t-symbol-first-command-surface-qa-desktop-2026-06-02.png`
- `reports/agent-town-hq15t-symbol-first-command-surface-qa-mobile-2026-06-02.png`
- `reports/agent-town-hq15t-symbol-first-command-surface-qa-contact-sheet-2026-06-02.png`
