# AgentTown HQ7 Settler Convoy UI Slice

Date: 2026-05-30
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Worktree: `/Users/robin/Projects/Portal-atlas-editor`

## Summary

Implemented the smallest player-facing Founders Plot UI affordance for the already-implemented server-owned HQ7 Settler Convoy core.

Reviewed/claim-ready Site Plan cards now show `Prepare Settler Convoy` only when no active or founded claim exists for that plan. The action posts to `/api/founders-plot/prepare-settler-convoy` with `plotId`, `sitePlanId`, `actor: "HUMAN"`, and a fresh idempotency key, and shows a disabled `Preparing...` state while pending.

Added a Settlement Claims panel that renders `CONVOY_PREPARING`, `CONVOY_ARRIVED`, and `FOUNDED` status, source plan, cost, duration, site/risk, and founding result. `CONVOY_ARRIVED` claims show `Found Settlement`, which posts to `/api/founders-plot/found-settlement` with `plotId`, `claimId`, `actor: "HUMAN"`, and a fresh idempotency key, with a disabled `Founding...` state while pending.

Added a minimal Owned Plots read surface. The page now calls `GET /api/founders-plot/plots` and renders home/outpost summaries. Full plot switching is intentionally left deferred.

## Changed Files

- `public/experiences/founders-plot/founders-plot.js`
  - Added HQ7 API bindings for plots, prepare convoy, and found settlement.
  - Added claim-aware Site Plan convoy action gating.
  - Added Settlement Claims and Owned Plots renderers.
  - Added pending states for convoy preparation and settlement founding.
- `public/experiences/founders-plot/index.html`
  - Added Owned Plots and Settlement Claims panels.
- `public/experiences/founders-plot/founders-plot.css`
  - Added compact card styling for owned plot and claim cards.
- `e2e/200_founders_plot.spec.js`
  - Updated tool-surface expectation to include HQ7 tools.
  - Added route-stubbed UI coverage for preparing a convoy, rendering the claim, founding an outpost, and showing the owned outpost summary.
- `reports/agent-town-hq7-settler-convoy-ui-slice-2026-05-30.md`
  - This teammate-readable report.

## Boundaries Preserved

- No new server routes or tools were added.
- UI calls only the existing explicit Founders Plot endpoints:
  - `GET /api/founders-plot/plots`
  - `POST /api/founders-plot/prepare-settler-convoy`
  - `POST /api/founders-plot/found-settlement`
- No Atlas action refs were made executable.
- No world map, public territory grid, generated universe overlay, trade routes, research, doctrine, cohorts, work orders, or autonomous expansion behavior was added.
- No gameplay costs, unlocks, engine state rules, or server mutation semantics were changed.
- No new production art or generated assets were added.
- Plot switching was not implemented; the owned-plots panel is a read-only summary.
- No push, commit, merge, deploy, cleanup, broad formatting, or unrelated revert was performed.

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js` - passed.
- `node --check e2e/200_founders_plot.spec.js` - passed.
- `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js` - passed, 14/14.
- `npx playwright test e2e/200_founders_plot.spec.js --project=chromium` - passed, 11/11.
- `git diff --check` - passed.

## Follow-Up Gaps

- Full plot switching remains deferred; the UI only summarizes owned plots.
- Convoy route/outpost visuals remain placeholder/read-model driven; production assets should follow Bacon/Noether guidance in a dedicated asset lane.
- Claim cards do not add cancellation/rejection UX because no such explicit server mutation is in this slice.
