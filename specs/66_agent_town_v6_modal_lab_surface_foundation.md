# Agent Town V6 Modal Lab Surface Foundation

Status: `research_only`

Milestone: M15 Modal-first V6 lab surface

Runtime contract: `server/world_civilization/lab_surface.js`

Test coverage: `tests/world_civilization_lab_surface.test.js`

## Boundary

This foundation describes the internal V6 lab surface and modal launch plan as
contracts only. It does not add routes, page navigation, player-visible UI,
autonomous civic agents, or executable civic mechanics.

The lab surface remains route-neutral so later UI work must mount from the town
hub modal flow instead of a standalone V6 page. Standalone routes such as `/v6`,
`/v6-lab`, or `/civilization` are not valid release paths and must fail closed
to the town hub path instead of rendering V6 content directly.

## Contract Rules

- `FEATURE_WORLD_V60_AGENT_CIVILIZATION` must be explicitly enabled.
- The caller must also pass an internal `includeResearchLab` opt-in.
- Broad V5 prototype overrides such as `WORLD_GRID_FEATURE_FLAGS=all` must not
  enable the lab.
- The lab contract must stay `research_only`, `runtimeExposed: false`,
  `playerVisible: false`, and `executionStatus: not_executable`.
- The mount mode must be `modal` with `launchSurface: town_hub_modal`.
- Worker continuity is required because full-page navigation tears down the
  page-scoped OpenClaw Lite worker runtime.
- Observability requires the existing debug tabs: Worker Tools, Skill Context,
  Worker Traffic, Brain, and Session Context.
- Panels may describe readiness, schemas, proposals, votes, moderation,
  reputation, effects, delegations, institutions, public works, and audit
  evidence, but each panel must remain non-executing.
- `buildV6LabModalLaunchPlan` may allow launch only from `/app` through
  `town_hub_modal` when the V6 feature flag, research opt-in, and required
  debug tabs are present.
- Missing debug tabs, broad V5 feature overrides, direct standalone paths, or
  non-modal launch surfaces must return a fail-closed non-executing plan.

## M15 Readiness Gate

`buildV6LabReadinessGate()` records non-executing readiness evidence for the
eventual internal V6 lab UI. It requires explicit research opt-in and
`FEATURE_WORLD_V60_AGENT_CIVILIZATION`; broad V5 prototype overrides must not
enable it.

The gate remains `research_only`, `releaseReady: false`, `playerVisible:
false`, `normalGameplayExposure: false`, `standaloneRouteAllowed: false`,
`civicEffectsEnabled: false`, `mutatesPrivateTown: false`,
`mutatesOtherUserWorld: false`, `exposesPrivateDebugData: false`, and
`executionStatus: "not_executable"`. It only passes research readiness when
evidence covers town-hub modal launch, standalone route denial, worker
continuity, debug observability, non-executing panels, browser visual coverage
at 390/768/1280 widths, keyboard accessibility, focus trap review,
screen-reader names, runtime tool absence, private debug-data exclusion, and
normal gameplay exposure denial.

The corresponding assertion rejects fake readiness that exposes runtime/player
surfaces, allows standalone routes, enables civic effects, mutates private town
or other-user world state, exposes private debug data, or marks the gate
release-ready.

## Release Gate

Before any real V6 lab UI is added, the release branch must prove:

- The UI launches only through the town hub modal flow.
- Direct standalone hits redirect or fail closed.
- Browser/Playwright visual coverage proves the modal renders without
  overlapping normal gameplay controls.
- Worker Tools, Skill Context, Worker Traffic, Brain, and Session Context remain
  visible and current while the modal is open.
- V6 routes and worker tools are still absent or disabled unless separately
  released through the V6 readiness gate.
- No V6 panel can apply civic effects, mutate private towns, mutate another
  user's world, or expose private/debug data.
