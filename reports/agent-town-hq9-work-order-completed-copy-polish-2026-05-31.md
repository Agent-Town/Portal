# AgentTown HQ9 Work Order Completed Copy Polish - 2026-05-31

## Summary

Implemented the smallest safe UI polish fix for Curie's low-severity HQ9 Work Orders issue: completed work-order cards now show receipt-oriented copy even when their original `expiresAt` timestamp is in the past.

The DRAFT/expired draft path remains intact. A DRAFT work order with a past `expiresAt` still renders as `EXPIRED` and shows `Expired draft. Recreate it before execution.`

## Changes

- `public/experiences/founders-plot/founders-plot.js`
  - Made `workOrderExpiryText` status-aware.
  - Returns `Completed receipt. Child receipts are preserved for audit.` for `COMPLETED` cards before considering expiry timestamps.
  - Passes the already-computed effective status into the helper from the work-order card render path.

- `e2e/200_founders_plot.spec.js`
  - Extended `FP-E2E-013` so the completed fixture has a past `expiresAt`.
  - Asserts the completed card shows receipt copy and does not show expired/recreate copy.
  - Asserts the separate expired DRAFT card still shows the expired/recreate copy.
  - Writes the proof screenshot to `reports/agent-town-hq9-work-order-completed-copy-polish-proof-2026-05-31.png`.

No CSS, server, engine, store, route, tool, gameplay-authority, scheduler, Atlas-execution, spending, placement, scouting, founding, doctrine, HQ, civic, overlay, route/trade, public/share, or generated-rendering changes were made.

## Proof

- Screenshot: `reports/agent-town-hq9-work-order-completed-copy-polish-proof-2026-05-31.png`
- Image validation:

```bash
identify reports/agent-town-hq9-work-order-completed-copy-polish-proof-2026-05-31.png
# reports/agent-town-hq9-work-order-completed-copy-polish-proof-2026-05-31.png PNG 461x1308 461x1308+0+0 8-bit sRGB
```

The proof shows:

- `COMPLETED` work-order card: `Completed receipt. Child receipts are preserved for audit.`
- No execute button on the completed card.
- Separate `EXPIRED` draft card: `Expired draft. Recreate it before execution.`

## Verification

Passed:

```bash
node --check public/experiences/founders-plot/founders-plot.js
node --check e2e/200_founders_plot.spec.js
PW_PORT=4229 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-013"
# 1 passed
identify reports/agent-town-hq9-work-order-completed-copy-polish-proof-2026-05-31.png
git diff --check
```

## Residual Risk

- This was a focused UI-copy polish, not a full repository regression pass.
- The surrounding worktree remains heavily dirty from other completed AgentTown lanes; unrelated changes were left untouched.
