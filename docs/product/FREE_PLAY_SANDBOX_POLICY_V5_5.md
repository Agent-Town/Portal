# Free-Play Sandbox Policy V5.5

Status: `prototype_gated`

## Policy

Free play is introduced only inside controlled sandbox districts. It is not the
default world mode and it does not grant permanent private-town mutation.

## Sandbox Rules

- Limited approved prop palette.
- Moderation queue for risky actions.
- Rollback snapshots for every accepted mutation.
- Public participants are pseudonymous and redacted.
- Agent actions use typed tools only.
- No arbitrary uploads, code execution, public chat by default, or economy bridge
  into private towns.

## Release Gate

V5.5 cannot ship until moderation, rollback, identity, reputation, permissions,
and shard performance have dedicated evidence.

## Prototype Evidence

- `server/world_grid/sandbox.js`
- `public/experiences/world-grid/app.js`
- `tests/world_grid_region.test.js`
- `e2e/236_world_grid_v50_region_prototype.spec.js`
- `artifacts/world-grid-v55-sandbox-prototype.png`
