# Agent Town HQ10 Form Poll Stability Fix - 2026-05-31

## Summary

Implemented a frontend-only stability fix for HQ10B Civic Proposal and HQ10C Generated Universe Overlay Pack forms. Periodic `loadState()` polling still refreshes lists, statuses, world-grid read models, overlay previews, and panels, but in-progress form drafts are captured before panel re-render and restored after the refreshed form is rebuilt.

Also hardened overlay-pack rendering so invalid/null pack entries are ignored before sorting, previewing, or rendering cards. This keeps stored overlay records renderable and guards the previous `overlayPackId` null crash path without changing gameplay authority.

## Changed Files

- `public/experiences/founders-plot/founders-plot.js`
  - Added local draft capture/restore helpers for HQ10B and HQ10C form fields.
  - Preserved form drafts across state polling and pending button re-renders.
  - Reset local drafts after successful POST.
  - Filtered overlay packs to valid object records before sorting/lookup/rendering.
- `e2e/200_founders_plot.spec.js`
  - Extended FP-E2E-017 and FP-E2E-018 to fill forms, wait longer than the 5s poll interval, assert values survive, then submit successfully.
  - Added FP-E2E-020 for a focused poll-stability regression covering both HQ10B/HQ10C forms plus stored overlay-record rendering with a null record in the fixture.

## Proof Artifacts

- `reports/agent-town-hq10-form-poll-stability-fix-proof-2026-05-31.png`

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js` - passed
- `node --check e2e/200_founders_plot.spec.js` - passed
- `npx playwright test e2e/200_founders_plot.spec.js --grep "FP-E2E-017|FP-E2E-018|FP-E2E-020"` - passed, 3/3
- `npx playwright test e2e/200_founders_plot.spec.js --grep "FP-E2E-019"` - passed, 1/1
- `git diff --check` - passed

## Remaining Risks

- Full `npm test` was not run; verification was focused on the requested HQ10 poll/regression coverage.
- The branch already had extensive unrelated dirty work before this change; this fix only touched the requested frontend/test/report scope.
