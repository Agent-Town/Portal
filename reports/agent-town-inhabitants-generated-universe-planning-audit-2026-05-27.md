# Agent Town Inhabitants + Generated Universe Planning Audit

Date: 2026-05-27
Repo: `/Users/robin/Projects/Portal`
Branches inspected read-only:
- `feature/founders-plot-phase1`
- `codex/generated-universe-style-pack-v02-schema-validation`
- `codex/v6-agent-civilization-milestones`

## Executive Answer

The Three.js/inhabitants direction is already mostly defined, but it is split across branches and not yet expressed as one small Founders Plot implementation contract.

The right next move is not a new simulation system. Start inhabitants as deterministic visual projections of existing Founders Plot/server state: construction, production, ready outputs, current goals, approvals, and Foreman/Clover state. Generated Universe/style packs may style, skin, rename, voice, and animate those visual actors, but must not own simulation truth, resources, permissions, tools, formulas, or server mutations.

## Most Relevant Existing Definitions

### Current Founders Plot truth

- `feature/founders-plot-phase1:docs/specs/agent-town-founders-plot-phase1-spec.md`
  - Defines Founders Plot as a deterministic personal city-builder where the human chooses layout/priorities, the agent automates bounded town tasks, and the server owns truth, timers, rules, and outcomes.
  - Explicit Phase 1 non-goals include open shared-city simulation, deep NPC life simulation, unrestricted agent autonomy, and fully procedural world generation.

- `feature/founders-plot-phase1:server/founders_plot/engine.js`
  - Current implementation source of truth for pads, building definitions, HQ levels/unlocks, resources, timers, production jobs, rewards, permissions, event logs, replay/state hashes, and bounded Foreman permission unlocks.
  - This is the state inhabitants should project from, not replace.

### Three.js renderer boundary

- `codex/v6-agent-civilization-milestones:specs/43_founders_plot_threejs_playable_slice.md`
  - Defines Three.js as a renderer change, not a game-logic rewrite.
  - Keeps `server/founders_plot/*` authoritative and `et.plot.*` as the only gameplay mutation path.
  - Names the intended scene adapter and renderer files: `scene_state.js`, `three_scene_entry.js`, `scene_render.js`, and generated `three_scene_bundle.js`.
  - Establishes pick/raycast identity, hidden semantic DOM hooks, visual parity records, and future asset replacement rules.

- `codex/v6-agent-civilization-milestones:specs/45_founders_plot_threejs_full_state_coverage.md`
  - Expands the renderer contract so the canvas represents the gameplay state players need: resources, caps, HQ progress, pads, buildings, jobs, goals, contracts, rewards, journal/recap, approvals, Foreman runtime, policy, scheduler, standing order, unlocks, and selected-object detail.
  - Repeats the critical rule: the adapter may summarize state, but must not decide outcomes.

- `codex/v6-agent-civilization-milestones:docs/technical/THREEJS_ROADMAP_ALIGNMENT.md`
  - Locks Three.js as the forward human-facing Founders Plot renderer path.
  - Assigns Three.js world rendering, raycasting, labels/rings/badges/timers, Clover presence, camera focus, and canvas state anchors.
  - Assigns server/tools plot state, economy rules, contracts, rewards, approvals, Foreman authority, and `et.plot.*` mutations.

### V6 civilization boundary

- `codex/v6-agent-civilization-milestones:docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md`
  - Defines V6 as bounded, auditable civic institutions, not "more autonomous agents everywhere."
  - Keeps V6 research-only until release gates close.
  - Explicitly blocks public autonomous agents from mutating another user's world, private Founders Plot leakage into public civic surfaces, and civic effects without human approval or explicit delegation.

- `codex/v6-agent-civilization-milestones:specs/54_agent_town_v6_agent_civilization_foundation.md`
  - Keeps `FEATURE_WORLD_V60_AGENT_CIVILIZATION` research-only.
  - Keeps civic tools non-executing and hidden from runtime `/api/world/tools` until worker-first exposure, mutation security, delegation, moderation, audit, rollback, and release review gates are complete.

### Generated Universe/style-pack boundary

- `codex/generated-universe-style-pack-v02-schema-validation:docs/product/GENERATED_UNIVERSE_STYLE_PACK_CHARTER.md`
  - Says generated packs provide visual style, names, lore, factions, culture, generated text, asset references, and later approved bounded modifiers.
  - States directly: "The pack never owns server truth."
  - Forbids packs from defining arbitrary tools, formulas, server mutation handlers, resource keys, permission rules, account identity, Brain settings, provider settings, API credentials, or wallet data.

- `codex/generated-universe-style-pack-v02-schema-validation:docs/technical/GENERATED_PACK_RUNTIME_BOUNDARY.md`
  - GU-16 defines the Town Life + Inhabitant Overlay slice.
  - Inhabitants are visual actors only. They read server-owned region/territory state and cannot mutate resources, own tools, change contracts, or act as autonomous agents.
  - Sprite prompts are scaffolded role candidates with no production image requirement.
  - Reduced-motion mode falls back to static markers.

- `codex/generated-universe-style-pack-v02-schema-validation:schemas/generated-packs/inhabitant_style_overlay.schema.json`
  - Defines canonical generated-pack roles: `inhabitant.worker`, `inhabitant.hauler`, `inhabitant.messenger`, and `inhabitant.farmer`.
  - Enforces `visualOnly: true`, `mutatesResources: false`, and `autonomousAgent: false`.
  - Enforces `externalModelUsed: false`, `productionImageAssetsRequired: false`, `hiddenSimulation: false`, `resourceMutationCount: 0`, and `serverStateAuthority: server-owned-state-only`.

- `codex/generated-universe-style-pack-v02-schema-validation:tests/generated_pack_inhabitant_overlay.test.js`
  - Proves generated inhabitant overlays are visual-only, cover the role budget, scaffold sprite prompts without production image generation, reject hidden simulation/resource mutation/unsafe text/unknown roles, and preserve first-loop playability.

## Is It Sufficiently Defined?

Mostly, but not quite.

What is sufficiently defined:
- Founders Plot/server remains authoritative for game state and mutation.
- Three.js is a renderer/picking/accessibility layer, not a simulation rewrite.
- V6 civilization is not the place to sneak in early NPC/inhabitant authority.
- Generated Universe/style packs can style inhabitants and must remain presentation-only.
- Generated-pack schemas already reject the dangerous cases: resource mutation, hidden simulation, unknown roles, autonomous-agent claims, tool authority, production asset requirements, and unsafe text.

What is missing:
- A narrow Founders Plot inhabitant projection contract that says exactly which Founders Plot state fields produce which visual actors.
- A mapping from Founders Plot roles (`builder`, `worker`, `hauler`, `messenger`, optional Clover/Foreman presence) to generated-pack role/style overlays.
- A clear fallback rule when no generated pack is active: default Agent Town inhabitant visuals and labels.
- A release/test contract proving generated pack styling changes appearance only and leaves Founders Plot state hash, resources, jobs, permissions, and `et.plot.*` behavior unchanged.

## Should We Extend It?

Yes, with a small docs/spec patch, not a broad implementation branch.

The current cross-branch direction is correct, but teammates will misread it unless the boundary is written in one place. The next spec patch should define inhabitants as:

- Derived from Founders Plot state, not persisted as canonical entities.
- Deterministic by state hash/actor projection version.
- Visual and inspectable, with stable IDs for tests and accessibility.
- Clickable only as selection/focus/inspection surfaces.
- Unable to call tools, spend resources, alter timers, create jobs, unlock permissions, or mutate server state.
- Styled by generated packs only after canonical projection is computed.

## Should Inhabitants Belong To Generated Universe/Style Packs?

They should belong to generated packs only as a styling overlay, not as simulation entities.

Recommended model:

1. Founders Plot computes or exposes canonical visual actor projections from server state:
   - `builder`: active construction or HQ upgrade.
   - `worker`: active production job.
   - `hauler`: ready output / collectable resource.
   - `messenger`: current goal, pending approval, Foreman receipt, or contract/reward anchor.
   - `clover`: Foreman/Clover presence and current target.

2. `scene_state.js` emits stable actor records:
   - `actorId`
   - `canonicalRoleId`
   - `sourceObjectId`
   - `sourceDomain`
   - `sourceStateHash`
   - `visualState`
   - `progress`
   - `selectionKey` / `drawerKey`
   - no mutation fields

3. Generated pack overlay is applied after that:
   - display name
   - role label
   - sprite/material/texture candidate
   - voice template
   - animation set name
   - motion/reduced-motion policy
   - palette and material hints

4. Generated pack overlay must never provide:
   - actor count that changes game meaning
   - resource deltas
   - formulas
   - timers
   - unlock rules
   - tool names
   - server handlers
   - permissions
   - autonomous-agent flags
   - hidden simulation
   - Brain/provider/session/wallet settings

This keeps generated universes useful and fun while preserving the server authority model.

## Conflicts And Guardrails

- The current branch `feature/founders-plot-phase1:AGENTS.md` is stale. It still describes the repo as a minimal landing page and says "Session-token identity - do not add external identity providers" while also later mentioning wallet identity and OpenAI Codex PKCE guardrails.
- The two inspected Codex branches have a newer `AGENTS.md` that reflects the current direction: Portal is now Agent Town/Founders Plot, normal gameplay must hide provider/runtime jargon, Privy/account-wallet continuity is the production identity contract, and OpenAI Codex OAuth must use the PKCE flow.
- This matters for generated packs and inhabitants because the generated-pack charter explicitly forbids packs from owning account identity, Brain settings, provider settings, API credentials, or wallet data. The newer OpenAI/Codex login direction should live in platform/Brain flows and debug surfaces only, not in generated universe content.
- V6 guardrails conflict with any proposal to make inhabitants real civic agents now. V6 agent participation is research-only and non-executing until explicit delegation, worker-tool enforcement, route-edge auth, audit, moderation, rollback, and release review are done.

## Smallest Next Docs/Spec Patch

Patch one new or existing spec, preferably on top of the Three.js line:

- Add `specs/46_founders_plot_threejs_inhabitant_projection.md`, or append a short "Inhabitant Projection Contract" section to `specs/45_founders_plot_threejs_full_state_coverage.md`.

Minimum contents:

- Actor projection source table from Founders Plot state to canonical actor roles.
- Stable actor record shape emitted by `scene_state.js`.
- Generated-pack overlay boundary: allowed display fields and forbidden authority fields.
- Default fallback styling when generated packs are disabled or invalid.
- Acceptance checks:
  - same server state produces same actor IDs and role assignments;
  - generated-pack overlay changes labels/skins/animations only;
  - state hash, inventory, jobs, permissions, event log, and `et.plot.*` mutation behavior are unchanged with or without a generated pack;
  - reduced motion renders static markers;
  - clicking inhabitants selects/focuses source objects but does not mutate state;
  - unsafe generated overlays fail closed to default Agent Town visuals.

This is the smallest patch that makes the branch directions teammate-passable and prevents accidental authority drift.

## Practical Recommendation

Build the first Three.js inhabitants slice as "work receipts with legs."

Do:
- derive inhabitants from `server/founders_plot` state through `scene_state.js`;
- keep actor budgets small;
- support default Agent Town visuals first;
- let generated packs reskin/rename/voice/animate canonical roles;
- keep all real actions on existing buttons/tools/routes;
- preserve semantic DOM hooks and Playwright projection info.

Do not:
- add persistent citizen rows yet;
- add NPC economies;
- add inhabitant tools;
- let generated packs define resources, timers, formulas, permissions, or mutation handlers;
- treat V6 civic agents as part of this Founders Plot visual slice;
- require production image generation for the first pass.

## Bottom Line

The direction is right and already guarded in pieces. Extend it with one explicit Founders Plot inhabitant projection spec so Three.js inhabitants, Generated Universe overlays, and V6 civilization do not blur together.
