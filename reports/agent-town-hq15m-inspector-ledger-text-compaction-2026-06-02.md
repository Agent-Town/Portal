# AgentTown HQ15M - Inspector / Ledger Text Compaction

Date: 2026-06-02

## Verdict

PASS.

HQ15M keeps the Expedition Map gameplay-first by moving the remaining secondary fog and sector-alias text behind collapsed inspector drawers:

- Fog details now live under the collapsed `Fog ledger` drawer.
- The legacy sector-level Scout Sector alias button now lives under the collapsed `Sector action aliases` drawer.
- The unit command bar remains the primary action surface for Scout movement and Scout Sector.
- Selected-sector proof, Evidence Packet, objective ledger, and revealed-sector ledger remain collapsed/read-only.

## Scope

Changed:

- `public/experiences/founders-plot/founders-plot.js`
- `e2e/200_founders_plot.spec.js`

Generated:

- `reports/agent-town-hq15m-inspector-ledger-text-compaction-desktop-2026-06-02.png`
- `reports/agent-town-hq15m-inspector-ledger-text-compaction-mobile-2026-06-02.png`
- `reports/agent-town-hq15m-inspector-ledger-text-compaction-contact-sheet-2026-06-02.png`
- `reports/agent-town-hq15m-inspector-ledger-text-compaction-proof-2026-06-02.json`

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `git diff --check -- public/experiences/founders-plot/founders-plot.js e2e/200_founders_plot.spec.js`
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022"` -> 1/1 passed
- PNG proof images validated with `file`
- Legacy screenshot/proof side effects from the Playwright run were restored; only HQ15M screenshots were kept.

## Guardrails

- No new server mutation path.
- Scout Sector remains the only fog/reveal mutation.
- Scout movement remains bounded to existing HQ15 server-owned move-unit rules.
- No hidden truth leakage, Atlas execution, public sharing, deploy, merge, push, Generated Universe rendering, hidden autonomy, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation, external effects, or Wild West drift.
