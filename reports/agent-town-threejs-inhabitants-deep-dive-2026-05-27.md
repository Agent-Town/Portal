# Agent Town Three.js Inhabitants Deep Dive

Date: 2026-05-27
Repo: `/Users/robin/Projects/Portal`
Scope: Founders Plot / Agent Town playable city-builder
Status: product and technical proposal only

## Executive Verdict

Agent Town should move the playable Founders Plot surface toward Three.js, but only as a renderer and interaction layer. The server-side Founders Plot engine should remain the authoritative source for resources, jobs, timers, building placement, permissions, approvals, rewards, state hashes, and replay.

The first inhabitant slice should make existing server facts visible through small workers, haulers, builders, messengers, and a Foreman/Clover presence. The inhabitants should not be real agents yet. They should be "work receipts with legs": readable, deterministic, ambient actors derived from the same state the UI already consumes.

This is worth doing because the current loop is structurally sound but waiting is mostly numeric. A small living town turns construction and production timers into anticipation, gives the player something to watch and inspect, and creates a bridge toward future Mirofish-backed agents without making the first version depend on LLM calls, image generation, agent autonomy, or new economic rules.

The recommended next branch should build a narrow Three.js playable surface plus visual-only inhabitants for the first Lumber Camp loop. Do not start with a generalized agent civilization system, a persistent citizen database, procedural world generation, or full generated asset pipelines.

## Current Ground Truth

### Existing Founders Plot Shape

The current Founders Plot implementation is a server-backed, deterministic city-builder loop:

- `server/founders_plot/engine.js` owns the game rules: resources, storage caps, approved build pads, HQ levels, building definitions, construction timers, production jobs, rewards, event logs, state hashes, idempotency, approvals, permissions, and agent policy checks.
- `server/founders_plot/routes.js` exposes state and mutation routes under `/api/founders-plot`.
- `server/founders_plot/tools.js` defines the `et.plot.*` tool contract.
- `public/experiences/founders-plot/founders-plot.js` is a dependency-free browser controller that fetches state, renders a DOM grid, and calls existing server endpoints.
- `public/experiences/founders-plot/index.html` and `founders-plot.css` provide the current frontier/storybook UI shell.
- `e2e/200_founders_plot.spec.js` proves the first browser and API loops through Playwright.
- `tests-founders-plot/*` cover engine, HTTP, contract, replay, and performance behavior.

The core loop is already the right one:

1. Place a building.
2. Wait for construction.
3. Queue production.
4. Wait for production.
5. Collect outputs.
6. Spend resources on upgrades.
7. Unlock more buildings and more Foreman permissions.

The weak point is not the economy. The weak point is that time passing is mostly expressed through UI text, progress state, and button availability. The player does not yet feel that a place is alive while timers run.

### Design Pack Direction

The current design pack says Agent Town should feel like entering and settling a warm frontier town with an AI helper. It explicitly pushes the public experience away from provider/debug/dashboard language and toward a playable town surface.

That matters here because inhabitants solve a product problem, not a rendering problem:

- They make "settling" visible.
- They make the Foreman feel like a participant in a town instead of a side-panel bot.
- They give the player ambient feedback while actions complete.
- They create the future shape of AI inhabitants without exposing internal agent machinery too early.

### Relevant Branch Planning

Read-only branch inspection supports this direction:

- `codex/v6-agent-civilization-milestones` already frames Three.js as a renderer, not a simulation rewrite. Its planning files describe `scene_state.js`, `three_scene_entry.js`, `scene_render.js`, object identity, raycast picking, accessibility hooks, and generated bundle boundaries.
- The same branch keeps the server, tools, approvals, policy, and mutation paths authoritative.
- `codex/generated-universe-style-pack-v02-schema-validation` introduces a generated-pack inhabitant overlay with canonical roles such as worker, hauler, messenger, and farmer. The important guardrail is that those inhabitants are visual-only, cannot mutate resources, cannot be autonomous agents, and cannot require production image generation.

Those branch ideas should be reused selectively. The current branch is still a DOM 3x3 Founders Plot surface. The next slice should adapt the Three.js architecture to the current implementation instead of assuming all branch files have already landed.

## Product Thesis

### Why Busy Inhabitants Create Pull

The best city-builder waiting loops do not feel like dead time. They show intent. Blue Byte's The Settlers is the useful reference point because little people make production chains legible: work starts somewhere, someone carries something, someone finishes something, and the settlement appears to have a life beyond the player's click.

Agent Town can use that pattern without copying the game. The product value is:

- **Comprehension:** A builder walking to a Lumber Camp explains construction better than a timer alone.
- **Anticipation:** A hauler waiting near completed output says "this is ready soon" before the button matters.
- **Continuity:** The town keeps moving after a player action, so returning feels like rejoining a living place.
- **Agency:** The player can inspect people and jobs, plan the next action, and understand what the Foreman is doing.
- **Identity:** A future Mirofish agent can grow out of a role the player already recognizes.

The important rule: inhabitants must explain and dramatize real state. They must not create fake economic outcomes.

### What Players Do While Waiting

During construction and production, the player should have lightweight things to do that are useful but not required:

- Watch workers move between HQ, pads, and active buildings.
- Click a worker or building to see what job it represents.
- Follow the current active job with a camera focus button.
- Ask the Foreman for the next best action.
- Approve a pending Foreman request when a higher-tier permission is locked.
- Change priority once that permission is unlocked.
- Inspect storage caps, output readiness, and blocked reasons through in-world markers.
- Plan the next placement on visible build pads.
- Collect completed outputs from the building or from the hauler cluster near HQ.

The first version should not add chores. It should turn existing state into visible affordances and let the player make the next meaningful decision sooner.

### First 10 Minutes

The first 10 minutes should feel like this:

1. The player opens Founders Plot and sees HQ, a few tiny inhabitants, and the Foreman/Clover figure already present.
2. The player places a Lumber Camp on an approved pad.
3. Builders walk from HQ to the pad, carry planks or tools, and work while the construction timer runs.
4. The player can click the building site or builder and see "Building Lumber Camp" with the same timer used by the server.
5. When construction finishes, the site changes into the building and a worker starts a production animation when the player queues lumber.
6. A hauler or worker returns toward HQ when wood is ready.
7. Collecting wood produces a visible handoff plus the existing inventory and XP changes.
8. The Foreman points to the next goal, such as upgrading HQ or placing a Farm Plot.

If the player waits, the town should stay gently busy. If the player acts quickly, the inhabitants should never slow down the core loop.

## Design Principles

1. **Renderer only:** Three.js renders and picks. It does not decide game outcomes.
2. **Server truth:** `server/founders_plot/*` remains authoritative for all rules and mutation effects.
3. **Derived inhabitants first:** MVP inhabitants are deterministic client-side projections of buildings, jobs, timers, quests, and approvals.
4. **No hidden economy:** Inhabitants do not gather unmodeled resources, complete jobs early, or unlock anything.
5. **Readable over realistic:** A few exaggerated worker roles beat a crowd of visually noisy particles.
6. **Accessible mirror:** Every interactive Three.js object needs a DOM or equivalent semantic hook for labels, keyboard focus, and Playwright stability.
7. **Test determinism:** Animation can be time-based, but object identity, actor count, role assignment, paths, and gameplay state must be testable deterministically.
8. **Cheap by default:** No live LLM calls, no image generation, no GLB loading requirement, no physics engine, and no generated pack dependency in the core loop.

## MVP Proposal

### Name

Founders Plot Three.js Inhabitants MVP.

### Scope

Build a Three.js world surface for the current Founders Plot loop and add visual-only inhabitants derived from current state.

The MVP should cover:

- HQ.
- Approved build pads.
- One placed Lumber Camp.
- Construction state.
- One queued production job.
- Output-ready state.
- Collect action feedback.
- Foreman/Clover presence.
- Four inhabitant roles: builder, worker, hauler, messenger.
- Reduced-motion static markers.
- WebGL fallback to the existing DOM grid or a DOM-only scene.

The MVP should not cover:

- Persistent citizens.
- Real autonomous micro-agents.
- Mirofish integration.
- Generated image assets.
- Full V6 civic systems.
- Complex pathfinding.
- Public multi-user inhabitants.
- New resources, formulas, or building rules.

### Actor Budget

Start with a small crowd:

- Mobile: 4 to 8 inhabitants.
- Desktop: 8 to 16 inhabitants.
- Test mode: fixed count, fixed IDs, fixed animation clock.
- Reduced motion: static role markers with progress pulses disabled.

Later, if the renderer is healthy, use instancing to support 30 to 60 tiny background inhabitants. Do not make that the first goal.

## Inhabitant Roles

### Builder

Source state:

- Building has active construction.
- Upgrade is in progress.

Visual behavior:

- Walks from HQ to construction pad.
- Loops a hammering/carrying animation near the site.
- Returns to HQ or idles nearby when complete.

Player meaning:

- "This timer is construction."
- "The building is not ready yet, but progress is happening."

### Worker

Source state:

- Building is complete and has an active production job.

Visual behavior:

- Works at the building.
- Uses a role-specific loop: chopping, tending, quarrying, crafting, selling.
- Shows a small progress ring tied to the server job timer.

Player meaning:

- "This building is producing something right now."

### Hauler

Source state:

- Job output is ready.
- Inventory has capacity for the output.
- Player can collect.

Visual behavior:

- Carries a small resource bundle from building toward HQ or waits at the output point.
- On collect, plays a short handoff and disappears into the normal ambient pool.

Player meaning:

- "There is output to collect."

### Messenger

Source state:

- Quest target exists.
- Reward is claimable.
- Approval is pending.
- Foreman has a suggestion or policy state worth surfacing.

Visual behavior:

- Walks between Foreman/Clover, HQ, and the target object.
- Holds or points to a small envelope/flag.

Player meaning:

- "There is a decision or goal here."

### Foreman/Clover

Source state:

- Current plot state, quest, permissions, approvals, standing order, policy.

Visual behavior:

- Stands in world near HQ or current goal.
- Points attention toward next target.
- Emits short in-world bubbles only from existing deterministic copy or approved local text.

Player meaning:

- "The AI helper belongs in the town, but still follows the same permission model."

## Interaction Loops

### Inspect Actor

Clicking an inhabitant should select the source job or object:

- Builder selects the construction site.
- Worker selects the producing building.
- Hauler selects the output-ready building.
- Messenger selects the quest, reward, approval, or Foreman state.

The selection panel should reuse existing action buttons and server endpoints.

### Follow Work

A small camera/focus command can center the current active job. This is useful during waiting and for screenshots, but it should not be required for gameplay.

### Plan Next Action

While a timer runs, build pads should remain visible and inspectable. If the player lacks resources or unlocks, the Three.js scene should show the blocked reason through a label or marker, but the server should still make the final decision on submit.

### Collect Through the World

Clicking a hauler or ready badge should lead to the same `collect_outputs` path as the DOM action. The player should feel like they collected from the town, but the request should still be the existing server mutation with idempotency.

### Foreman Suggestions

The Foreman should visually point to the suggested target. It should not silently act beyond current permissions. Existing approval and policy constraints remain the product's trust foundation.

## Technical Architecture

### Boundary

Use this boundary:

- Server owns: state, validation, timers, costs, resources, caps, rewards, jobs, approvals, permissions, idempotency, policy, event log, replay, state hash.
- Browser controller owns: state fetch/polling, user action routing, idempotency keys, DOM shell, selected state, action sheets.
- Scene adapter owns: transforming server state into renderable world objects and derived inhabitants.
- Three.js renderer owns: canvas drawing, camera, animation, picking, object highlights, and visual-only actor movement.

This keeps Three.js from becoming a second game engine.

### Proposed Files For The Implementation Branch

The next branch can add:

- `public/experiences/founders-plot/scene_state.js`
  - Pure adapter from `/api/founders-plot/state` to scene view model.
  - No network calls.
  - No mutation calls.
  - Deterministic actor projection.

- `public/experiences/founders-plot/three_scene_entry.js`
  - Three.js renderer entrypoint.
  - Owns renderer, scene, camera, raycaster, resize, animation loop, cleanup.

- `public/experiences/founders-plot/scene_render.js`
  - Bridge between existing app controller and Three.js.
  - Keeps semantic DOM hooks for accessibility and tests.
  - Emits or listens for `founders:three-pick`.

- `public/experiences/founders-plot/three_scene_bundle.js`
  - Generated bundle, built by a small esbuild script.

- `scripts/build_founders_plot_threejs_bundle.mjs`
  - Bundles Three.js and renderer code.

- `tests-founders-plot/fp-scene-state.test.js`
  - Node tests for deterministic scene and inhabitant projection.

- `e2e/214_founders_plot_threejs_inhabitants.spec.js`
  - Playwright coverage for the canvas, object identity, picking, and first loop.

This mirrors the V6 branch shape without requiring the whole branch to land first.

### Dependency Choice

Add `three` directly and bundle vanilla Three.js through esbuild. Avoid React Three Fiber, physics engines, navmesh libraries, and model pipelines for the first slice.

Useful Three.js primitives:

- `WebGLRenderer` for canvas rendering.
- `Raycaster` for object picking.
- `InstancedMesh` later for many repeated small actors or props.
- `AnimationMixer` later if GLB characters are introduced.

The MVP can use sprite planes, simple low-poly meshes, or textured quads before any GLB pipeline exists.

### Scene View Model

The scene adapter should emit a stable, serializable object. Example shape:

```js
{
  version: "founders-plot-scene-v1",
  stateHash: state.audit.stateHash,
  plot: {
    id: state.plot.id,
    grid: { version: "founders-plot-pads-v1", width: 3, height: 3 }
  },
  objects: [
    {
      objectId: "HQ",
      type: "building",
      buildingType: "hq",
      position: { x: 0, z: 0 },
      selectable: true,
      label: "HQ",
      badges: [],
      timer: null
    }
  ],
  inhabitants: [
    {
      actorId: "ACTOR:builder:building-123",
      role: "builder",
      state: "working",
      source: { kind: "building", id: "building-123" },
      targetObjectId: "BUILDING:building-123",
      path: ["HQ", "PAD:0,1"],
      startedAt: "2026-05-27T00:00:00.000Z",
      endsAt: "2026-05-27T00:01:00.000Z",
      visualOnly: true,
      mutatesResources: false,
      autonomousAgent: false
    }
  ],
  accessibility: {
    interactiveObjectIds: ["HQ", "PAD:0,1", "ACTOR:builder:building-123"]
  }
}
```

The exact object names can change, but these properties matter:

- Stable IDs.
- Source links back to real server state.
- Explicit `visualOnly`.
- No resource mutation fields.
- No autonomous capability fields.
- No hidden simulation.

### Determinism

Actor generation should be deterministic:

- Seed from `plot.id`, `state.audit.stateHash`, source IDs, role, and a fixed actor slot index.
- Use a tiny local PRNG only inside `scene_state.js`.
- Keep actor IDs stable while the source job/building exists.
- Do not use `Math.random()` in projection.
- In test mode, freeze animation time through `window.__foundersPlotTest`.

Animation can interpolate based on wall clock, but the underlying path and source mapping must not change nondeterministically.

### Pathing

Start with graph pathing, not navmesh:

- Define world coordinates for HQ and each approved build pad.
- Define a small lane graph between HQ, pad centers, and building entry points.
- Use Manhattan or A* over this graph.
- Add deterministic lane offsets per actor slot to reduce overlap.
- Recompute paths only when the scene state changes.
- Keep pathfinding client-side and visual-only.

The server does not need to know where a builder is standing in the MVP. The server only knows construction and production times.

### Animation State Machine

Use a simple actor state machine:

- `idle`: ambient movement around HQ or source building.
- `walking`: move along derived path.
- `working`: loop near construction or production source.
- `hauling`: carry resource marker between building and HQ.
- `waiting`: stand near ready output or pending approval.
- `celebrating`: short completion animation after collect or reward claim.
- `blocked`: static marker for missing resource, full storage, locked pad, or permission issue.
- `static`: reduced-motion fallback.

Map server state to actor state:

- Construction active -> builder `walking` or `working`.
- Production active -> worker `working`.
- Output ready -> hauler `waiting` or `hauling`.
- Reward claimable -> messenger `waiting`.
- Approval pending -> messenger `waiting`.
- Goal target selected -> messenger `walking`.

### Visual Language

The current Founders Plot style is warm frontier storybook. The inhabitant language should match it:

- Tiny readable silhouettes.
- Strong role color accents: builder, worker, hauler, messenger.
- Simple tools or bundles.
- Low animation frequency.
- Clear halos only for interactive state.
- Progress rings near buildings, not giant UI overlays.
- Avoid sci-fi dashboards, particle-heavy effects, and decorative clutter.

The first slice can use simple authored shapes and sprite planes. Generated universe packs can later reskin actors, but the default game should not depend on generated assets.

### Performance Constraints

Budgets for the first branch:

- No server payload growth from inhabitants if they are client-derived.
- Keep the existing Founders Plot observation budget intact.
- Initial desktop actor count: 8 to 16.
- Initial mobile actor count: 4 to 8.
- No per-frame object creation in the render loop.
- Reuse geometries, materials, sprites, and matrices.
- Pause animation on hidden tabs.
- Dispose renderer resources on route/modal teardown.
- Respect `prefers-reduced-motion`.
- Keep a DOM fallback if WebGL is unavailable.
- Track renderer stats in `window.__foundersPlotTest.getThreeSceneInfo()`.

If actor counts grow later, use `InstancedMesh` or a sprite atlas. Do not introduce instancing complexity until the simple version is measured.

### Accessibility

Three.js cannot be the only interface:

- Keep semantic DOM hooks for world objects and actors.
- Keyboard selection should still work through the DOM mirror or equivalent controller.
- Labels must exist in accessible text, not only in canvas pixels.
- Reduced motion should be first-class.
- Playwright should assert object identity through exposed test info, not only through visual screenshots.

## Integration With Existing Founders Plot Systems

### State Endpoint

The MVP can consume the existing state endpoint. No new server endpoint is required if `scene_state.js` derives objects and inhabitants from current state.

Later, if multiple clients or agents need identical scene projection, add a read-only server scene endpoint. That endpoint should still be derived from authoritative state and should not write anything.

### Existing Mutations

All gameplay actions must continue through existing paths:

- `place-building`
- `queue-job`
- `collect-outputs`
- `upgrade-building`
- `set-priority`
- `claim-reward`
- approval request and resolution routes
- policy routes

Canvas interactions should select objects and invoke the same controller methods the DOM UI uses. They should not call new shortcut endpoints.

### Agent Tools

Do not add `et.inhabitant.*` mutation tools for the MVP.

The current `et.plot.*` contract is enough. Inhabitants can visualize tool-relevant states, such as:

- Foreman can collect output only if permission allows.
- Foreman can queue jobs only if policy allows.
- Placement and HQ upgrades still require approval where the current policy requires it.

### Event Log

The MVP does not need new event types. It can read existing build, job, collect, upgrade, reward, and approval events if useful for recent visual effects.

If a later slice adds cosmetic-only events, they should be clearly marked as non-authoritative and excluded from economy replay decisions.

## Testing Strategy

### Unit Tests

Add `tests-founders-plot/fp-scene-state.test.js`:

- Same server state always produces the same scene object IDs.
- Same server state always produces the same inhabitant IDs and role assignments.
- Inhabitants are marked `visualOnly: true`.
- Inhabitants never expose mutation, resource, or autonomous-agent capability fields.
- Construction state yields a builder.
- Production state yields a worker.
- Ready output yields a hauler.
- Reward or approval state yields a messenger.
- Reduced-motion mode yields static markers.
- Path nodes are valid object or pad IDs.
- Scene projection does not exceed object and actor budgets.

### Browser Tests

Add `e2e/214_founders_plot_threejs_inhabitants.spec.js`:

- Founders Plot opens with a visible Three.js canvas.
- Canvas has nonblank pixels.
- `window.__foundersPlotTest.getThreeSceneInfo()` exposes renderer health, object IDs, actor IDs, pick targets, and current state hash.
- HQ and approved pads are represented in the scene.
- Canvas raycast picking selects HQ, a build pad, a placed building, and an actor.
- The first playable loop still places a Lumber Camp, completes construction through test time advance, queues production, advances time, and collects output through existing server actions.
- A construction job shows a builder actor.
- A production job shows a worker actor.
- Ready output shows a hauler actor.
- Clicking an actor selects the source object and does not mutate server state by itself.
- Reduced-motion mode shows static markers instead of moving actors.
- WebGL fallback still leaves the game playable.

### Regression Tests

Keep the existing Founders Plot engine, HTTP, contract, replay, and performance tests. The renderer must not require server changes that break:

- idempotency;
- state hashes;
- replay audit;
- policy enforcement;
- observation payload budget;
- offline catch-up clamp;
- current Playwright first-loop behavior.

### Performance Tests

Add a browser-side perf smoke test:

- Render loop starts under a fixed time budget on a local dev machine.
- Actor count stays under budget for mobile and desktop.
- No unbounded growth in scene children after repeated state refreshes.
- Route/modal teardown disposes renderer resources and stops animation.

## Mirofish Path Without Overbuilding

The right long-term path is staged:

1. **Visual actor:** deterministic inhabitant derived from server state.
2. **Named resident:** optional persistent profile with name, look, and role, but no tool authority.
3. **Local advisor:** can produce suggestions or short barks from bounded local templates or gated model calls.
4. **Delegated helper:** can use existing `et.plot.*` tools only through explicit permission, budget, and approval rules.
5. **Mirofish agent:** becomes a real agent with identity, memory, and scoped capabilities.
6. **Civic participant:** only after V6 delegation, moderation, audit, rollback, and public/private boundaries are proven.

The MVP should only build layer 1, with ID and source-link conventions that do not block later layers.

This keeps the product honest: players first care that the town feels alive. Real agent autonomy should arrive after the visible loop is fun and trusted.

## Risks

### Three.js Becomes A Tech Demo

Risk: The team spends time on camera polish, assets, shaders, and scene complexity while the first loop remains shallow.

Mitigation: The acceptance test must complete the Lumber Camp loop through existing game actions. The renderer only counts if it improves playable comprehension.

### Duplicate Simulation

Risk: The client starts making decisions that disagree with the server.

Mitigation: Inhabitants are state projection only. All resource, timer, completion, and permission decisions stay in `server/founders_plot/*`.

### Nondeterministic Tests

Risk: Animation, random actor placement, or variable timing creates flaky tests.

Mitigation: Seed actor projection, freeze test animation time, expose test info, and assert semantic state rather than only screenshots.

### Payload Creep

Risk: Adding every visual detail to server state breaks the observation budget.

Mitigation: Derive inhabitants client-side first. Only promote stable read-only scene data to server if needed.

### Costly Core Loop

Risk: Live LLM barks, image generation, or generated packs become required for ordinary play.

Mitigation: Keep core inhabitants authored and deterministic. Gate model/image generation behind explicit opt-in, cost awareness, and human approval.

### Mobile Performance

Risk: Many actors and labels make the game slow or visually cluttered.

Mitigation: Start with 4 to 8 actors on mobile, use simple geometry/sprites, pause offscreen, and reduce motion.

### Accessibility Regression

Risk: Canvas-only interaction excludes keyboard, screen reader, and deterministic test paths.

Mitigation: Maintain semantic DOM mirrors and controller-level selection actions.

### Product Confusion

Risk: Players think visual inhabitants are autonomous agents and expect them to act.

Mitigation: Copy should describe them as townsfolk/workers at first. Reserve "agent" language for Foreman/Clover and later Mirofish-backed capabilities.

## Non-Goals

- Do not change Founders Plot economics.
- Do not add new resources for inhabitants.
- Do not persist individual citizens in the MVP.
- Do not add a new backend simulation service.
- Do not let inhabitants mutate resources.
- Do not add live LLM/image generation to the core loop.
- Do not require generated universe packs for baseline play.
- Do not replace approval and permission policy with visual shortcuts.
- Do not remove deterministic Playwright and Node testability.
- Do not turn the first Three.js slice into a full public world or V6 civic system.

## Recommended Next Branch And Slice

Branch:

- `feature/founders-plot-threejs-inhabitants-mvp`

Build first:

1. Add vanilla Three.js bundled by esbuild.
2. Add `scene_state.js` as a pure adapter from existing Founders Plot state to world objects and visual-only inhabitants.
3. Add `three_scene_entry.js` for an orthographic 2.5D canvas with HQ, pads, buildings, labels, progress rings, and actor sprites.
4. Add `scene_render.js` to bridge the existing controller to the canvas while preserving DOM action sheets and accessibility hooks.
5. Support canvas raycast picking for HQ, pads, buildings, Foreman/Clover, and inhabitants.
6. Derive four actor roles from real state: builder, worker, hauler, messenger.
7. Keep the existing DOM shell, inventory strip, quest ribbon, action panels, drawers, and server endpoints.
8. Add reduced-motion and WebGL fallback.

Tests that prove it:

1. Node scene-state projection tests prove deterministic IDs, role derivation, visual-only flags, and path validity.
2. Playwright proves the canvas is visible and nonblank.
3. Playwright proves raycast picking selects server-backed objects and visual actors.
4. Playwright completes the first Lumber Camp loop through existing server actions.
5. Playwright proves clicking an inhabitant selects its source but does not mutate state by itself.
6. Existing Founders Plot engine, HTTP, contract, replay, and performance tests still pass.
7. Reduced-motion and WebGL fallback tests prove the game remains usable without animated canvas actors.

Can wait:

- More than 16 visible inhabitants.
- Persistent citizen names, moods, relationships, or homes.
- Mirofish identity and real agent capabilities.
- Generated universe pack skins.
- Live model barks.
- Image-generated sprites.
- GLB character rigs.
- Instanced crowd rendering.
- Complex pathfinding or collision.
- Full HQ level 5 state coverage in the canvas.
- Public civic agent participation.

## References

Local refs inspected:

- `AGENTS.md`
- `docs/specs/agent-town-founders-plot-phase1-spec.md`
- `docs/design/agent-town-design-pack/*`
- `public/experiences/founders-plot/*`
- `server/founders_plot/*`
- `e2e/200_founders_plot.spec.js`
- `tests-founders-plot/*`
- `codex/v6-agent-civilization-milestones:docs/technical/THREEJS_ROADMAP_ALIGNMENT.md`
- `codex/v6-agent-civilization-milestones:specs/43_founders_plot_threejs_playable_slice.md`
- `codex/v6-agent-civilization-milestones:specs/45_founders_plot_threejs_full_state_coverage.md`
- `codex/v6-agent-civilization-milestones:docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md`
- `codex/generated-universe-style-pack-v02-schema-validation:docs/product/GENERATED_UNIVERSE_STYLE_PACK_CHARTER.md`
- `codex/generated-universe-style-pack-v02-schema-validation:docs/technical/GENERATED_PACK_RUNTIME_BOUNDARY.md`
- `codex/generated-universe-style-pack-v02-schema-validation:schemas/generated-packs/inhabitant_style_overlay.schema.json`
- `codex/generated-universe-style-pack-v02-schema-validation:tests/generated_pack_inhabitant_overlay.test.js`

External technical refs:

- Three.js WebGLRenderer docs: https://threejs.org/docs/pages/WebGLRenderer.html
- Three.js Raycaster docs: https://threejs.org/docs/api/en/core/Raycaster.html
- Three.js InstancedMesh docs: https://threejs.org/docs/pages/InstancedMesh.html
- Three.js AnimationMixer docs: https://threejs.org/docs/pages/AnimationMixer.html
