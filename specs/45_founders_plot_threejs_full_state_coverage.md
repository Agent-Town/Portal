# Founders Plot Three.js Full-State Coverage

Status: implementation contract
Branch: `codex/founders-plot-threejs-playable-slice`
Date: 2026-05-24

## Goal

The Three.js scene must represent the complete current gameplay state players use to decide what to do next. The renderer is still a presentation layer: it must not duplicate simulation rules, mutate state directly, or bypass `et.plot.*` tools.

## State Coverage Matrix

| Gameplay domain | Source of truth | Three.js tier | Contract |
| --- | --- | --- | --- |
| Plot resources and caps | `state.plot.inventory`, `state.plot.storageCaps` | Canvas HUD overlay | Show compact current/cap stores for wood, stone, food, coin, and town XP. |
| HQ progress | `state.progress.next`, `state.plot.hqLevel` | Canvas HUD overlay | Show current HQ level and next XP requirement, or capped state. |
| Pads, buildings, jobs | `state.pads`, `state.buildings`, `state.jobs` | World objects | Every pad/building has a grid cell, pick target, visual state, timer, output badge, and selected-object summary. |
| Current goal | `state.currentGoal`, `state.quest` | Canvas HUD overlay + object marker | Show goal title/body and mark its target object when one exists. |
| Contracts | `state.contracts` | In-world marker at Contract Board | Show locked/offers/active/turn-in state, active requirements, and rewards summary. |
| Town signals and landmarks | `state.townSignals`, `state.landmarks` | In-world marker at Welcome Sign | Show signal band/value summary and raised/unraised landmark state. |
| Rewards | `state.rewards` | In-world marker at Welcome Sign | Show claimable count and first reward summary; clicks route to Rewards drawer. |
| Journal and recap | `state.journal`, `state.recap` | In-world marker at Journal | Show entry count and unseen recap count. |
| Approvals | `state.foreman.pendingApprovals` | In-world marker at Approval Bell | Show waiting count and first request title; clicks route to Approvals drawer. |
| Clover runtime | `state.foreman.runtime`, `state.foreman.receipt`, `state.foreman.recommendation` | In-world Clover/Hut marker | Show Clover status, recent receipt/recommendation, and existing Clover state sprite/bubble. |
| Policy permissions | `state.policy`, `state.unlocks.permissions` | Foreman selected-object detail | Show enabled/unlocked permission count and emergency pause state. |
| Scheduler | `state.foreman.scheduler` | Foreman selected-object detail | Show collect-ready scheduler enabled/paused/run count state. |
| Standing order | `state.foreman.standingOrder` | Foreman selected-object detail | Show Careful Steward vs Bold Founder. |
| Unlocks and blocked states | `state.unlocks`, `state.policy`, `state.currentGoal` | HQ selected-object detail | Show available building unlocks and blocked indicators such as emergency pause or locked contract board. |
| Selected object detail | Selected scene object + source state | Selected-object detail strip | Show rich details for the selected/goal object without opening raw debug dumps. |

## Data Contract

`public/experiences/founders-plot/scene_state.js` emits `scene.stateCoverage.version = founders-plot-state-coverage-v1` with:

- `domains`: deterministic matrix rows with `id`, `label`, `tier`, and `source`.
- `hud`: canvas HUD summaries for resources, HQ progress, and objective.
- `anchors`: clickable state anchors with stable `STATE:*` IDs, `domainId`, `objectId`, `drawerKey` or `selectionKey`, status, count, and summary value.
- `selectedDetail`: compact row-based detail for the selected object, or the current objective target when nothing is selected.
- `retainedDomControls`: explicit list of controls intentionally left in DOM.

The adapter may summarize state, but it must not decide outcomes. It reads existing state view fields only.

## Renderer Contract

`public/experiences/founders-plot/three_scene_entry.js` renders:

- HUD rows in the canvas.
- Anchor chips near their world owners.
- Click hit targets for `STATE:*` anchors that dispatch the same `founders:three-pick` event used by object raycasts.
- Selected/objective detail strip in the canvas.

`window.__foundersPlotTest.getThreeSceneInfo().coverage` exposes rendered coverage records:

- `domainIds`
- `hud`
- `anchors`
- `selectedDetail`

This is the Playwright proof surface for full-state parity.

## Retained DOM Boundary

The following remain DOM controls for now:

- drawer bodies;
- selection action buttons;
- Brain connection controls;
- Foreman setup controls.

They are not game-state blind spots. Their state must still be represented in the Three.js scene through HUD, anchors, or selected detail.

## Asset Policy

No new generated asset is required for this coverage pass. Existing world sprites plus text chips can represent every current state domain. GPT Image 2.0 remains the preferred path when a future domain needs a distinct world object, character, or imported 2D billboard asset.
