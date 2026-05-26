# Agent Town V5.5 Controlled Free-Play Sandbox Districts

Status: `prototype_gated`

Feature flag: `FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS`

## Goal

Introduce free play as a controlled public sandbox, not as the whole world.

## Scope

- One sandbox district.
- Limited building/prop palette.
- Moderation queue.
- Rollback snapshots.
- Session-based public presence.
- Safe agent demo actions.
- No permanent private-town mutation without approval.

## Definition Of Done

- Approved prop placement works.
- Forbidden content is rejected by moderation policy.
- Rollback restores prior sandbox state.
- Sandbox actions cannot mutate private settlement state.
- Public participant data is redacted.
- Agents use typed tools only.

## Prototype Implementation Evidence

- `server/world_grid/sandbox.js`
- `server/world_grid/routes.js`
- `public/experiences/world-grid/app.js`
- `public/experiences/world-grid/tools.md`
- `tests/world_grid_region.test.js`
- `e2e/236_world_grid_v50_region_prototype.spec.js`
