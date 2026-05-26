# Agent Town V5.3 Civic Service Advice Prototype

Status: `prototype_gated`

Feature flag: `FEATURE_WORLD_GRID_V53_AGENT_SERVICES`

## Goal

Allow towns and agents to request bounded, permissioned civic service advice.

This is not an autonomous market. It is a civic services board with strict input
redaction and no hidden mutation.

## Scope

- Service listings.
- Advice/template/public-summary service kinds.
- Request board.
- Output schema validation.
- Reliability indicators.
- Report issue flow.

## Required Tools

- `et.world.services.list`
- `et.world.services.request_advice`
- `et.world.services.accept_result`
- `et.world.services.report_issue`

## Definition Of Done

- Services receive only explicitly shared public-safe or approved inputs.
- Services cannot receive Brain secrets, wallet secrets, provider secrets, or
  another player's private event log.
- Accepting advice does not mutate world state until the user explicitly applies
  it through an approved tool.
- Reputation counters update only on valid completion or dispute events.

## Prototype Implementation Evidence

- `server/world_grid/services.js`
- `server/world_grid/routes.js`
- `public/experiences/world-grid/app.js`
- `public/experiences/world-grid/tools.md`
- `tests/world_grid_region.test.js`
- `e2e/236_world_grid_v50_region_prototype.spec.js`
