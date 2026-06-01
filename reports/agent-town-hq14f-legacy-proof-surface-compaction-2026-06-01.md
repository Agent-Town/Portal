# AgentTown HQ14F Legacy Proof Surface Compaction

Date: 2026-06-01

## Verdict

PASS. This is a small UI-driven polish lane after HQ14E: the old sector ledger/proof surfaces now take less vertical space so the generated map and visual inspector remain the primary player read.

## What Changed

- Converted the revealed-sector ledger from a tall vertical stack into a responsive compact grid.
- Clamped legacy proof copy inside the map-first body to two lines.
- Bounded receipt/link groups so they remain available without pushing the primary map experience too far down the page.
- Kept all DOM/test identifiers intact for proof and accessibility coverage.

## Guardrails

- CSS-only polish; no server, store, route, tool, schema, renderer, or runtime asset changes.
- Scout Sector remains the only Expedition Map mutation path.
- Event Packet, Expedition Party, selected-sector, objective, and sector-ledger surfaces remain read-only/buttonless.
- No Atlas execution, public sharing, Generated Universe rendering, route/trade/economy/resource/combat/scheduler behavior, hidden autonomy, cross-plot mutation, external effects, or Wild West drift.

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js` passed.
- `npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022" --reporter=line` passed, 1/1.
- Screenshot checks passed for the copied HQ14F desktop/mobile proof captures:
  - `reports/agent-town-hq14f-legacy-proof-surface-compaction-desktop-2026-06-01.png`
  - `reports/agent-town-hq14f-legacy-proof-surface-compaction-mobile-2026-06-01.png`

## Residual

This does not fully solve the text-heavy problem. The next bigger UI lane should turn the selected-sector/card stack into a true visual map inspector with tabs or a drawer, leaving audit material one click deeper by default.
