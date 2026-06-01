# AgentTown HQ6 Settlement Charter Core Slice

Date: 2026-05-30
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Summary

Implemented the bounded server-owned HQ6 Settlement Charter slice for Founders Plot. HQ6 is now real engine progression, and an existing canonical Site Plan can be reviewed into claim-ready planning state through `et.plot.review_site_plan`.

This slice deliberately stops before HQ7. It does not create territory, second plots, routes, convoys, or resource payouts.

## Changed files

- `server/founders_plot/engine.js`
- `server/founders_plot/routes.js`
- `server/founders_plot/tools.js`
- `server/founders_plot/progression_atlas.js`
- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-http.test.js`
- `tests-founders-plot/fp-contract.test.js`
- `public/experiences/founders-plot/tools.md`
- `public/experiences/founders-plot/skill.md`
- `public/skill.md`
- `reports/agent-town-hq6-settlement-charter-core-slice-2026-05-30.md`

## Model decisions

- HQ6 is now the current engine cap.
- HQ5 -> HQ6 upgrade rule:
  - cost: `{ wood: 90, stone: 80, food: 50 }`
  - XP required: `220`
  - duration: `180000ms`
- HQ6 grants larger storage caps and one extra construction slot:
  - storage: `{ wood: 220, stone: 220, food: 220 }`
  - construction slots: `3`
- HQ6 does not unlock a new building or new autonomous permission yet.
- HQ7+ remains advisory future horizon state only.

## Site Plan review

Added `et.plot.review_site_plan` and `POST /api/founders-plot/review-site-plan`.

The action requires:

- current plot at HQ6 or higher
- existing canonical Site Plan
- source Scout Report still present in collected receipt state
- idempotency key

On success it updates the persisted Site Plan:

- `status: "REVIEWED"`
- `reviewStatus: "reviewed"`
- `promotionStatus: "reviewed_claim_ready"`
- `authorityBoundary: "claim_ready_planning_only_no_territory"`
- `reviewedAt`
- `reviewNote`

Repeat review with a new key returns the existing reviewed plan without rewriting the review. Reusing the same idempotency key with different review text returns `IDEMPOTENCY_CONFLICT`.

## Authority boundaries

Canonical Site Plan draft/review state is engine-owned and persisted in `site_plans_json`.

Progression Atlas exposes the review path as canonical metadata and action refs, but Atlas action refs remain non-executable. Editor variants, generated icons, draft gates, and strategy proposal text remain advisory and cannot mutate gameplay.

The review action records claim-ready planning state only. It explicitly does not create:

- territory
- a second plot
- route state
- convoy state
- resource payout

## Progression Atlas

- Canonical graph now includes `hq.level.6`, `hq.upgrade.6`, and per-plan `planning.site_plan.*.review` nodes.
- Review nodes are locked before HQ6, available at HQ6, and done after review.
- Reviewed Site Plan count is included in Atlas summary.
- HQ10 Horizon now treats HQ1-HQ6 as current engine truth and HQ7-HQ10 as future placeholders.

## Tests run

- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/routes.js`
- `node --check server/founders_plot/tools.js`
- `node --check server/founders_plot/progression_atlas.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `node --check tests-founders-plot/fp-unit.test.js`
- `node --check tests-founders-plot/fp-contract.test.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js` - passed 18/18
- `NODE_ENV=test node --test tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-unit.test.js` - passed 40/40
- `git diff --check` - passed

## Remaining frontend/graphics gaps

- Founders Plot UI has no dedicated HQ6 Settlement Charter panel yet.
- Site Plan cards are not yet a full review/comparison dossier UI.
- No production art/icon pass exists for Settlement Charter, reviewed Site Plans, claim readiness, or HQ6-specific Atlas affordances.
- No player-facing copy has been tuned for explaining "claim-ready but not claimed" beyond server/docs/test language.

## Next lane recommendation

Frontend/graphics lane should add a small Site Plan Review affordance that appears only when:

- a canonical Site Plan exists
- the plot is HQ6+
- the plan is not already reviewed

That UI should call the existing server action and render the reviewed state, but it should not introduce claim/convoy/territory controls. The next server lane after this should be HQ7 Settler Convoy with explicit claim costs, approval gates, and second-plot creation rules.
