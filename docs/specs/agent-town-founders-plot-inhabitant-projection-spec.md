# Agent Town - Founders Plot Inhabitant Projection Contract

Status: draft implementation contract  
Owner surface: Founders Plot / Generated Universe style packs / V6 renderer research

## Decision

Founders Plot owns canonical town state and emits deterministic `visualActors`.
Generated Universe/style packs may style those actors, but they do not create game
truth. V6/Three.js work may render and pick those actors, but it does not mutate
resources, jobs, timers, permissions, or approvals.

This keeps the three long-running lines aligned:

- Founders Plot remains the server-authoritative city-builder loop.
- Generated Universe packs become presentation overlays.
- V6 civilization remains a later civic/world-simulation backbone, not the first
  source of personal plot actors.

## Actor Source Table

`state.visualActors` is derived from the existing `/api/founders-plot/state`
payload after the server computes `state.audit.stateHash`.

| Role | Source state | Purpose | Generated overlay role |
| --- | --- | --- | --- |
| `clover` | Plot + Foreman policy state | Persistent guide/presence | `inhabitant.messenger` |
| `builder` | Active `CONSTRUCT` or `UPGRADE` job | Show construction/upgrade work | `inhabitant.worker` |
| `worker` | Active `PRODUCE` or `SELL` job | Show production/sell work | `inhabitant.worker` |
| `hauler` | Building with `OUTPUT_READY` | Show collectable output | `inhabitant.hauler` |
| `messenger` | Pending approval, available reward, or current quest | Show attention target | `inhabitant.messenger` |

## Required Actor Fields

Each actor must have:

- `actorId`
- `canonicalRoleId`
- `generatedOverlayRoleId`
- `sourceDomain`
- `sourceObjectId`
- `sourceStateHash`
- `visualState`
- `progress`
- `target`
- `selectionKey`
- `drawerKey`
- `visualOnly: true`

Actors must not include tool names, resource deltas, autonomous-agent flags, or
server mutation instructions.

## Generated Universe Boundary

A generated pack may provide:

- display name
- label text
- sprite/material/texture candidate
- animation set name
- palette/material hints
- voice/copy template
- reduced-motion policy

A generated pack must not provide:

- resource deltas
- timers
- job creation
- formulas
- building unlock rules
- permission rules
- tool names or handlers
- actor counts that change game meaning
- autonomous-agent behavior

## Test Contract

Founders Plot tests should prove:

1. Actors are deterministic for the same state.
2. Actor `sourceStateHash` matches `state.audit.stateHash`.
3. Construction projects a `builder`.
4. Ready output projects a `hauler`.
5. Actors remain visual-only and contain no mutation fields.

Generated Universe tests should prove style-pack overlays change appearance only
and leave Founders Plot state hashes, tools, jobs, resources, permissions, and
approvals unchanged.
