# AgentTown HQ15I - Unit Command Surface

Generated: 2026-06-02 02:03 +07

## Verdict

PASS. Existing Settler Convoy and Found Outpost server actions now appear as selectable map-unit commands where the Expedition Map already has matching server-owned unit/read-model truth.

## What Changed

- Surveyor units for reviewed, unclaimed Site Plans now expose a server-backed `prepare_settler_convoy` command hint.
- Arrived Settler Convoy units now expose a server-backed `found_settlement` command hint.
- The Founders Plot `Map units` command bar renders `Prepare Convoy` and `Found Outpost` buttons from those hints.
- The buttons call the existing guarded endpoints only:
  - `POST /api/founders-plot/prepare-settler-convoy`
  - `POST /api/founders-plot/found-settlement`
- `applyExpeditionUnitMoves` now preserves custom non-Scout command hints instead of replacing them with generic party-unit hints.
- The semantic zoom overlay was deduped and locked-unknown selected copy stays sealed across all zoom tiers.

## Guardrails

- No new server mutation endpoint was introduced for Surveyor or Settler commands.
- No unit movement is attached to `prepare_settler_convoy` or `found_settlement`.
- No unit ID is smuggled into the existing prepare-convoy payload.
- Scout Sector remains the only Expedition Map fog/reveal mutation.
- Existing human approval gates for agent callers remain on prepare-convoy and found-settlement.
- No hidden autonomy, Atlas execution, public sharing, Generated Universe runtime expansion, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation, hidden-truth leakage, or external effects were added.

## Verification

- `node --check server/founders_plot/engine.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js` - 36/36
- `NODE_ENV=test node --test tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` - 50/50
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022"` - 1/1
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js -g "FP-E2E-023"` - 1/1 after fixing stale semantic overlay copy
- `npm run test:founders-plot` - 98/98

## Notes

`FP-E2E-023` caught a real stale-overlay issue: multiple semantic zoom overlays could survive rerender and a locked unknown cell could inherit survey-tier copy. The fix removes any existing overlay before appending a new one and returns sealed locked-unknown copy regardless of zoom tier.
