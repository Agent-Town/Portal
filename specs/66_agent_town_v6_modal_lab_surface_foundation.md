# Agent Town V6 Modal Lab Surface Foundation

Status: `research_only`

Milestone: M15 Modal-first V6 lab surface

Runtime contract: `server/world_civilization/lab_surface.js`

Launch-plan route: `GET /api/world/civilization/lab/launch-plan`

Test coverage: `tests/world_civilization_lab_surface.test.js`,
`e2e/244_v6_lab_modal_boundary.spec.js`

## Boundary

This foundation describes the internal V6 lab surface and modal launch plan as
research-only infrastructure. It includes a disabled-by-default launch-plan API
and a hidden town-hub modal renderer, but it does not add page navigation,
normal player-visible UI, autonomous civic agents, runtime civic tools, or
executable civic mechanics.

The lab surface remains route-neutral so later UI work must mount from the town
hub modal flow instead of a standalone V6 page. Standalone routes such as `/v6`,
`/v6-lab`, or `/civilization` are not valid release paths and must fail closed
to the town hub path instead of rendering V6 content directly.
The current Express route layer explicitly redirects those standalone paths to
`/app`; Playwright coverage proves the redirect does not render V6 lab content
or civic runtime details.

The launch-plan API is available only when `V6_CIVIC_LAB_MODAL_ENABLED` is set,
the request explicitly opts in with `v6Lab=1`, the V6 feature flag is enabled,
the requested launch path is `/app`, all required debug tabs are present, and
production requests carry authorized admin/QA override context. The client may
render the lab only after that launch plan returns `allowed: true`.

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
- The client modal must be DOM-rendered from the launch-plan response; it must
  not inject launch-plan strings as HTML.
- The modal may expose readiness and release-gate status only in this internal
  research flow, and it must avoid runtime civic tool names in visible text.
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

Before any V6 lab UI can be released beyond the internal research flow, the
release branch must prove:

- The UI launches only through the town hub modal flow.
- The launch-plan route is disabled by default and production requests require
  authorized override context.
- Direct standalone hits redirect or fail closed.
- `e2e/244_v6_lab_modal_boundary.spec.js` proves `/v6`, `/v6-lab`, and
  `/civilization` redirect to `/app` and that normal `/app` gameplay does not
  expose V6 lab markers or `et.world.civic.*` tools by default.
- Browser/Playwright visual coverage proves the modal renders without
  overlapping normal gameplay controls at 390/768/1280 widths.
- Worker Tools, Skill Context, Worker Traffic, Brain, and Session Context remain
  visible and current while the modal is open.
- Keyboard focus stays contained in the modal until the modal closes.
- V6 routes and worker tools are still absent or disabled unless separately
  released through the V6 readiness gate.
- No V6 panel can apply civic effects, mutate private towns, mutate another
  user's world, or expose private/debug data.
