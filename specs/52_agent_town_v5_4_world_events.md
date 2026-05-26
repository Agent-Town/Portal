# Agent Town V5.4 World Events And Public Works

Status: `prototype_gated`

Feature flag: `FEATURE_WORLD_GRID_V54_WORLD_EVENTS`

## Goal

Create bounded shared events where towns can contribute to public works without
becoming a pay-to-win resource race.

## Scope

- One world event template.
- Contribution caps.
- Public progress.
- Personal recap.
- Cosmetic/status-first reward.
- Rollback-safe accounting.

## Required Tools

- `et.world.events.get_state`
- `et.world.events.preview_contribution`
- `et.world.events.contribute`
- `et.world.events.claim_reward`

## Definition Of Done

- Contribution caps are enforced.
- Resource conservation holds.
- Duplicate idempotency does not double-contribute.
- Wrong account cannot claim another account's reward.
- Reward is cosmetic/status-safe.
- Event resolution is deterministic and replayable.

## Prototype Implementation Evidence

- `server/world_grid/events.js`
- `server/world_grid/routes.js`
- `public/experiences/world-grid/app.js`
- `public/experiences/world-grid/tools.md`
- `tests/world_grid_region.test.js`
- `e2e/236_world_grid_v50_region_prototype.spec.js`
