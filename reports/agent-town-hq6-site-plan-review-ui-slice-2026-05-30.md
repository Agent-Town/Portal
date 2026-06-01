# AgentTown HQ6 Site Plan Review UI Slice

Date: 2026-05-30
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Summary

Implemented the smallest player-facing Founders Plot affordance for HQ6 Site Plan Review on top of the existing server-owned Settlement Charter core.

The Site Plans panel now shows review state per canonical Site Plan:

- before HQ6: "Settlement Charter unlocks at HQ Lv 6"
- at HQ6 for unreviewed plans: "Settlement Charter review available" plus a `Review Site Plan` action
- after review: "Claim-ready planning only" with explicit no-territory copy

The action calls the existing `POST /api/founders-plot/review-site-plan` route only. It sends:

- `plotId`
- `planId`
- `actor: "HUMAN"`
- generated `idempotencyKey`
- concise `reviewNote`: `HQ6 Settlement Charter review: claim-ready planning only; no territory claimed.`

## Changed Files

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`
- `reports/agent-town-hq6-site-plan-review-ui-slice-2026-05-30.md`

## Boundaries Preserved

- No HQ7 implementation.
- No second plot, territory claim, convoy, route state, resource payout, or founding receipt.
- Gameplay authority stays in the server route. The UI only calls the existing review endpoint.
- Reviewed state is presented as claim-ready planning only, not as a completed claim.
- Existing dirty worktree content was preserved; unrelated files were not cleaned or reverted.

## Test Coverage

Added `FP-E2E-010` in `e2e/200_founders_plot.spec.js` to verify:

- an HQ6 canonical Site Plan exposes the review affordance
- the UI posts to `/api/founders-plot/review-site-plan`
- the payload includes `planId`, `plotId`, `actor`, `idempotencyKey`, and the no-territory review note
- pending UI shows `Reviewing...`
- reviewed UI renders `Claim-ready planning only`
- the review button disappears after success

Also updated the tools smoke assertion to include `et.plot.review_site_plan`.

## Verification Run

- `node --check public/experiences/founders-plot/founders-plot.js` - passed
- `node --check e2e/200_founders_plot.spec.js` - passed
- `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js` - passed 13/13
- `npx playwright test e2e/200_founders_plot.spec.js --project=chromium` - passed 10/10
- `git diff --check` - passed

## Gaps

- No new production art was added for Settlement Charter or reviewed-plan stamps.
- The new Playwright UI test uses route stubbing for the page state so it stays fast and focused; the real server review path remains covered by `tests-founders-plot/fp-http.test.js`.
