# AgentTown Functional Buildings and HQ Gate Handoff

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Trigger

Robin clarified two product rules:

- Functional buildings need visible inhabitants, crews, or operators.
- HQ progression should use StarCraft-style prerequisites, not only resources and XP.

## Product Rule

Every building or civic surface that provides a gameplay function should have a visible role attached to it. The player should understand who does the work:

- Lumber Camp: worker/hauler loop.
- Farm Plot: farmer/grower role.
- Quarry: miner/stonecutter role.
- Expedition Board: pathfinder scout.
- Workshop: mechanic/crafter role.
- Market Stall: trader/merchant role.
- Settlement Charter: clerk/cartographer role.
- Research Lodge: researcher/librarian role.
- Cohort Hall / Work Orders: coordinator/foreman lead role.
- Settler Convoy / Outpost: convoy crew and outpost keeper.
- World Grid: civic routekeeper/oracle adjunct.

The role can be a full sprite sheet, crew unit, or card/scene projection depending on the surface, but it should be explicit in the production plan.

## Progression Rule

HQ upgrades should not be only resource and XP checks. Current recommended HQ1-HQ6 gate model:

- HQ1 -> HQ2: requires `LUMBER_CAMP` and `FARM_PLOT` built/ready.
- HQ2 -> HQ3: requires `QUARRY` built/ready.
- HQ3 -> HQ4: requires `EXPEDITION_BOARD` built/ready.
- HQ4 -> HQ5: requires `WORKSHOP` built/ready.
- HQ5 -> HQ6: requires `MARKET_STALL` built/ready.

Progression Atlas should display these requirements, but server engine/store/routes/tests must own enforcement.

## Active Subagent Lanes

### McClintock

ID: `019e7bf3-dc5d-7982-96c8-8341aa57a35b`

Task: functional-building inhabitants / character production matrix.

Expected report:

`/Users/robin/Projects/Portal-atlas-editor/reports/agent-town-functional-building-inhabitants-production-matrix-2026-05-31.md`

Scope:

- Audit current functional building -> role mappings.
- Define missing inhabitant/crew role IDs.
- Produce sprite/prompt/integration/test matrix.
- Keep asset generation order aligned with implemented gameplay truth.

### Epicurus

ID: `019e7bf4-126c-7eb1-9130-ad6331739de9`

Task: HQ building prerequisite gates + Progression Atlas requirements.

Expected report:

`/Users/robin/Projects/Portal-atlas-editor/reports/agent-town-hq-building-prerequisite-gates-2026-05-31.md`

Scope:

- Add engine-owned building prerequisite metadata/enforcement for HQ1-HQ6 upgrades.
- Expose prerequisites in state/read model.
- Render building prerequisites in Progression Atlas canonical requirements.
- Keep future HQ7-HQ10 upgrade rules advisory until engine-owned.

## Guardrails

- No pushes, merges, deployments, branch rewrites, public posts, or unrelated cleanup.
- Atlas explains requirements; engine enforces requirements.
- Image/asset work must persist assets into the repo and include proof images.
- Every milestone needs a Markdown report and focused verification.
