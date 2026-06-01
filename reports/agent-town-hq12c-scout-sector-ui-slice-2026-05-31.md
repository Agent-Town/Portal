# AgentTown HQ12C Scout Sector UI Slice - 2026-05-31

Status: `COMPLETE_PARENT_VERIFIED`

## Summary

Added the first explicit Founders Plot Scout Sector UI affordance on top of the verified HQ12C backend route.

The Expedition Map panel now:

- Shows `Scout Sector` only for server-provided `hinted` cells whose kind is `frontier_hint`.
- Sends `POST /api/founders-plot/expedition-map/scout-sector` with `actor: HUMAN`, current plot id, target cell id, and a deterministic UI idempotency key.
- Shows a receipt card after a successful reveal.
- Refreshes the Expedition Map so the selected cell becomes `known`.
- Keeps known, discovered, and locked unknown cells non-mutating in the panel.

## Files

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`

## Proof

- Desktop proof: `reports/agent-town-hq12c-scout-sector-ui-desktop-2026-05-31.png`
- Mobile proof: `reports/agent-town-hq12c-scout-sector-ui-mobile-2026-05-31.png`
- Proof JSON: `reports/agent-town-hq12c-scout-sector-ui-proof-2026-05-31.json`

Proof JSON records:

- Request payload used `plotId`, `cellId: cell_q0_r1`, `actor: HUMAN`, and the `fp-scout-sector-*` idempotency key.
- Fog counts moved from `known: 1, hinted: 1` to `known: 2, hinted: 0`.
- After reveal, the selected cell was `known` and no Scout Sector button remained for it.
- Locked unknown cells still had no Scout Sector affordance.

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `PW_PORT=4260 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022"` - 1/1 passed
- `jq` inspection of `reports/agent-town-hq12c-scout-sector-ui-proof-2026-05-31.json`
- `magick identify` on both HQ12C proof screenshots
- Focused `git diff --check`

## Boundary

This is a UI slice over the already-verified server-owned HQ12C route. It adds no server, engine, store, tool, or Progression Atlas authority.

No autonomous movement, resource harvesting, route/trade economy, combat, public sharing, Generated Universe rendering, scheduler behavior, Atlas execution, hidden operator autonomy, or Wild West genre drift was added.

## Residual

The proof uses a Playwright route fixture shaped like the verified HQ12A/HQ12C server read model and route contract. It proves the browser UI behavior and guardrails, not a full HQ1-to-HQ12 live progression run.
