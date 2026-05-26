# Agent Town V5.1 Territory Claims And Settler Routes

Status: `prototype_gated`

Feature flag: `FEATURE_WORLD_GRID_V51_CLAIMS`

V5.1 starts only after V5.0 proves that the region grid improves orientation
without adding chores.

## Goal

Let players choose where the town expands next.

## Scope

- Adjacent claimable cells.
- Claim cost preview.
- One terrain benefit and one terrain drawback.
- Route preview from the home settlement.
- Clover tradeoff advice.
- Explicit player approval before any claim starts.

## Required Tools

- `et.world.territory.get_claim_options`
- `et.world.territory.plan_claim`
- `et.world.territory.complete_claim`
- `et.world.territory.cancel_claim`

## Definition Of Done

- Claim requires adjacency.
- Claim consumes resources exactly once.
- Claim cannot target another account's region.
- Claim persists across reload.
- Terrain benefits are visible but do not bypass Founders Plot economy rules.
- Clover can recommend but cannot auto-claim without explicit approval.

## Prototype Implementation Evidence

- `server/world_grid/claims.js`
- `server/world_grid/routes.js`
- `public/experiences/world-grid/app.js`
- `tests/world_grid_region.test.js`
- `e2e/236_world_grid_v50_region_prototype.spec.js`
