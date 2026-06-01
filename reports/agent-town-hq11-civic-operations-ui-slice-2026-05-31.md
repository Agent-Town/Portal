# Agent Town HQ11 Civic Operations UI Slice - 2026-05-31

## Summary

Added a bounded Founders Plot `Civic Operations` / Living World board that reads current server state and does not mutate anything.

The board is useful with the current HQ10D backend because it surfaces:

- active civic project counts
- `civic_beacon` activation state
- local readiness delta
- morale markers such as `civic_beacon_lit`
- per-project public-work records and source proposal references

If a compatible HQ11 backend lane later exposes `state.civicOperations` or `worldGrid.civicOperations`, the same board also displays lifecycle, readiness, progress, allowed operation type metadata, and latest operation receipts.

## Changed Paths

- `public/experiences/founders-plot/index.html`
- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`
- `reports/agent-town-hq11-civic-operations-ui-proof-2026-05-31.png`
- `reports/agent-town-hq11-civic-operations-ui-mobile-proof-2026-05-31.png`
- `reports/agent-town-hq11-civic-operations-ui-slice-2026-05-31.md`

## Authority Boundary

This UI slice is read-only.

- no activate/run/execute/apply/share/public/schedule/route/trade buttons were added
- no POST civic operation call was added
- no server, Atlas, scene state, generated bundle, or gameplay authority files were edited
- existing server-owned `GET /api/founders-plot/civic-projects` is used only as a read fallback when the state summary says civic project records exist
- the board can show future backend-provided HQ11 operation metadata, but cannot create or advance operations itself

## Proofs

- Desktop: `reports/agent-town-hq11-civic-operations-ui-proof-2026-05-31.png`
- Mobile: `reports/agent-town-hq11-civic-operations-ui-mobile-proof-2026-05-31.png`

`identify`:

- desktop: `1280x9072`, 8-bit sRGB
- mobile: `390x10362`, 8-bit sRGB

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js` - passed
- `node --check e2e/200_founders_plot.spec.js` - passed
- `PW_PORT=4219 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-014|FP-E2E-015|FP-E2E-021"` - passed, 3/3
- `identify reports/agent-town-hq11-civic-operations-ui-proof-2026-05-31.png reports/agent-town-hq11-civic-operations-ui-mobile-proof-2026-05-31.png` - passed
- `git diff --check` - passed

## Notes

The branch was already dirty and shared. I left unrelated dirty files and generated bundles alone.
