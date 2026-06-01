# AgentTown HQ10B Civic Proposal UI Slice - 2026-05-31

## Summary

Added a bounded Founders Plot UI surface for the server-owned HQ10B civic proposal records.

The panel lists proposal-only records, shows DRAFT / REVIEWED / ARCHIVED counts and record metadata, and exposes a careful Create civic proposal affordance only when the local civic proposal read model reports `RECORDING_READY` with `proposalOnly: true`.

Creation calls `POST /api/founders-plot/civic-proposals` from Founders Plot UI with a human actor. It does not use Progression Atlas and does not add server behavior.

## Changed Paths

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/index.html`
- `e2e/200_founders_plot.spec.js`
- `reports/agent-town-hq10b-civic-proposal-ui-slice-2026-05-31.md`
- `reports/agent-town-hq10b-civic-proposal-ui-proof-2026-05-31.png`
- `reports/agent-town-hq10b-civic-proposal-ui-mobile-proof-2026-05-31.png`

## Behavior

- Added a `Civic Proposals` Founders Plot panel.
- Shows civic proposal read-model status, allowed statuses, categories, counts, proposal-only metadata, and authority boundary.
- Shows locked copy and no create form until HQ10B recording is available in the API/state read model.
- Shows a create form only for server-reported `RECORDING_READY` proposal records.
- Records title, summary, category, status, review note, scope, review metadata, created/approved metadata, and the non-execution boundary.
- Keeps mobile cards/forms within the existing Parfit no-overflow constraints.

## Authority Boundary

HQ10B UI is advisory and record-only. Records are for review and memory; execution is not implemented.

No server, engine, store, tool, Progression Atlas, scene-state, bundle, scheduler, route, trade, resource-spend, public/share, or external-effect authority changed in this lane.

No execute/apply/route/trade/spend/public/share/schedule buttons were added.

## Proof

- `reports/agent-town-hq10b-civic-proposal-ui-proof-2026-05-31.png` - 527x1206
- `reports/agent-town-hq10b-civic-proposal-ui-mobile-proof-2026-05-31.png` - 366x1301

## Tests Run

- `node --check public/experiences/founders-plot/founders-plot.js` - passed
- `node --check e2e/200_founders_plot.spec.js` - passed
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-017" --project=chromium` - initially failed on locked requirement label copy, then passed after adding the friendly token label
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-015|FP-E2E-017" --project=chromium` - 2/2 passed
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-002|FP-E2E-015|FP-E2E-017" --project=chromium` - 3/3 passed
- `identify reports/agent-town-hq10b-civic-proposal-ui-proof-2026-05-31.png` - passed
- `identify reports/agent-town-hq10b-civic-proposal-ui-mobile-proof-2026-05-31.png` - passed

## Blockers

None.
