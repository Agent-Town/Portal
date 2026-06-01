# AgentTown Scout Report -> Site Plan Slice Implementation

Date: 2026-05-30
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Worktree: `/Users/robin/Projects/Portal-atlas-editor`

## Summary

Implemented the next post-HQ3 progression slice: collected Scout Reports can now be promoted into canonical Site Plan drafts.

This is intentionally not a second plot, territory claim, settlement founding, or editor-authored gameplay mutation. It is a small server-owned bridge between exploration receipts and future expansion work:

1. Expedition Board scouting creates a persisted `scout_report` receipt.
2. A human can draft one canonical Site Plan from that report.
3. Founders Plot and the Progression Atlas show the plan as planning truth.
4. Further variations, claim ideas, costs, generated icons, and alternate strategy content remain private Atlas/editor proposals until reviewed and implemented in engine code.

## Subagent Process

Two Codex subagents were used before implementation.

- Boundary audit: `reports/agent-town-next-slices-editor-vs-engine-boundary-2026-05-30.md`
  - Recommended next slices: Site Candidate/Scout Report triage, Settler Convoy, Research Lodge, Agent Cohort Work Orders.
  - Clarified that Codex-enabled users can author much richer private proposals, but canonical gameplay truth must still come from reviewed engine/server/tool implementation.
  - Flagged that the HQ10 horizon copy was stale because Expedition Board/scouting had become real HQ3 gameplay.
- Graphics/UX/test audit: `reports/agent-town-next-slices-graphics-ux-test-audit-2026-05-30.md`
  - Confirmed the Scout Report slice is canonical but still visually prototype-quality.
  - Recommended making reports useful through a site dossier/planning step before implementing second-plot claims.
  - Identified asset gaps for Expedition Board, scout, Scout Report, Site Plan, and Atlas icons.

## What Changed

### Engine and Store

- Added persisted `sitePlans` on Founders Plot records.
- Added `et.plot.draft_site_plan` gameplay tool and POST route `/api/founders-plot/draft-site-plan`.
- Added engine mutation `draftSitePlan`, with idempotency and policy boundaries:
  - Requires HQ3.
  - Requires a collected Scout Report.
  - Allows one canonical Site Plan per report.
  - Does not consume the report.
  - Does not create a claim, territory, route, or second plot.
  - Records `promotionStatus: "draft"` and `authorityBoundary: "requires_engine_promotion_for_settlement"`.

### Founders Plot UI

- Added a Site Plan count pill.
- Added a Site Plans panel.
- Scout Report cards now include a `Draft Site Plan` action when no plan exists for the report.
- Site Plan cards show focus, status, promotion state, source report, and boundary copy.

### Progression Atlas

- Added Site Plan count to the summary.
- Added canonical graph nodes for:
  - `planning.site_plan.<report>.draft`
  - `planning.site_plan.<plan>`
- Added `et.plot.draft_site_plan` action metadata to the canonical draft node. It remains non-executable from the Atlas.
- Updated the HQ10 horizon so HQ6 is no longer "Expedition Board"; it now points toward a future Settlement Charter lane.

### Docs and Tool Specs

- Updated Founders Plot tool docs and skill docs to include `et.plot.draft_site_plan`.
- Clarified that `queue_job` can run `SCOUT` jobs.
- Updated `public/skill.md` with the Scout Report -> Site Plan boundary.

## Editor vs Engine Boundary

| Surface | Users/Codex can author in editor | Requires implementation/promotion |
| --- | --- | --- |
| Scout Report notes | Strategy steps, generated copy, tags, comparisons, icons | Changing report facts, risk, traits, or rewards |
| Site Plans | Private variants, draft gates, proposal text, generated visuals | Canonical Site Plan creation route and store |
| Claims | Claim strategy, convoy proposal, cost draft, approval copy | Real claim state, territory ownership, second plot creation |
| Research | Doctrine proposals, icons, descriptions, tradeoff analysis | Real doctrine IDs, costs, effects, persistence |
| Work Orders | Work-order templates and safety copy | Any executor that mutates gameplay |

The editor can now be powerful because users have ChatGPT and Codex, but that power should express itself as better proposals and faster implementation scaffolds. It should not silently bypass server authority. Promotion still means adding engine rules, store schema, routes/tools, approval policy, canonical Atlas nodes, and tests.

## Promotion Workflow

1. User/Codex drafts strategy content, a draft resource gate, generated assets, or a canonical proposal in the Atlas/editor.
2. The server normalizes it as advisory/private and strips or disables unsafe action refs.
3. A human/team reviews mechanics, balance, privacy, reversibility, and story fit.
4. A reviewed model/spec defines state fields, costs, tool names, receipts, approvals, and tests.
5. Engine/store/routes/tool specs implement the model.
6. Progression Atlas canonical graph reads the implementation and exposes it as gameplay truth.

The Site Plan slice is an example of step 5: Site Plans are now engine-owned, while alternate plan variants remain editor-authored proposals.

## Verification

Passed:

- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/store.js`
- `node --check server/founders_plot/tools.js`
- `node --check server/founders_plot/routes.js`
- `node --check server/founders_plot/progression_atlas.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check public/progression-atlas.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `node --check tests-founders-plot/fp-contract.test.js`
- `node --check e2e/114_progression_atlas_openclaw_lite.spec.js`
- `node --check e2e/200_founders_plot.spec.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-scene-state.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` - 42 tests passed.
- `npx playwright test e2e/200_founders_plot.spec.js e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium` - 11 tests passed.
- `git diff --check`

## Remaining Gaps

- Production art is still needed for Expedition Board, scout, Scout Report, Site Plan, and related Atlas icons.
- Site Plans are not yet a dossier/comparison UI; they are a first canonical planning record.
- No second plot, claim, territory reservation, route, or settler convoy exists yet.
- No Codex auto-promotion path exists. Codex can help draft specs and code, but human review and tests should remain required.
- Some older editor/demo copy may still imply Expedition Board is future-only; the HQ10 horizon was updated, but teammate-facing docs should keep watching for stale language.

## Recommended Next Slice

Build a Site Dossier and Report Comparison layer before implementing claims:

- Compare multiple Scout Reports.
- Rank sites by player strategy.
- Link private Atlas strategy variants to specific reports/plans.
- Keep all claim/settlement actions blocked until the Settler Convoy model is implemented.
