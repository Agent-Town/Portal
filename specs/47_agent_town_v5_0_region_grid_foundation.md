---
schemaVersion: "agent-town-spec-v1"
documentId: "specs/47_agent_town_v5_0_region_grid_foundation"
title: "Agent Town V5.0 Region Grid Foundation"
status: "prototype_gated"
date: "2026-05-26"
owner: "Agent Town product"
featureFlag: "FEATURE_WORLD_GRID_V50_REGION"
releaseGate:
  - "specs/release-gates/threejs_runtime_gate.md"
---

# Agent Town V5.0 Region Grid Foundation

V5.0 creates a gated prototype region grid above the Founders Plot settlement
view. It must not affect the normal V1.5 player route unless explicitly enabled
for prototype/dev/QA review.

## Product Goal

The player learns: "My town is part of a larger territory."

V5.0 adds territory awareness only. It does not add unrestricted free play,
multiplayer, public economy, combat, creator uploads, or cross-town mutation.

## Scope

- Deterministic `WorldRegion` generation for an account/wallet owner.
- Stable `WorldCell`, `SettlementNode`, and `RouteEdge` identifiers.
- Z1 settlement view to Z2 territory grid zoom model.
- Home settlement node.
- Locked, visible, claimable, and claimed cell states.
- Terrain states: prairie, ridge, river, forest, mesa.
- Cell detail sheet with terrain/state/future-use copy.
- DOM/accessibility mirror for selectable cells.
- Read-only agent tools:
  - `et.world.region.get_state`
  - `et.world.region.explain_cell`

## Non-Goals

- No claim mutation in V5.0.
- No second settlement unlock.
- No public player presence.
- No public chat.
- No direct resource transfer.
- No open building anywhere on the map.

## Server Authority

The server owns the region. Three.js renders it.

Renderer state must derive from:

- `GET /api/world/region`
- `POST /api/world/region/focus-cell`
- `POST /api/world/region/set-camera`

Prototype implementation evidence:

- `server/world_grid/region.js`
- `server/world_grid/routes.js`
- `public/experiences/world-grid/`
- `tests/world_grid_region.test.js`
- `e2e/236_world_grid_v50_region_prototype.spec.js`

The renderer may never mutate town inventory, building state, contracts,
Foreman authority, Brain state, or region ownership.

## Data Model

```ts
type WorldRegion = {
  regionId: string;
  ownerAccountId: string;
  seed: string;
  createdAtMs: number;
  updatedAtMs: number;
  activeSettlementId: string;
  cells: WorldCell[];
  settlements: SettlementNode[];
  routes: RouteEdge[];
};

type WorldCell = {
  cellId: string;
  q: number;
  r: number;
  terrain: "prairie" | "ridge" | "river" | "forest" | "mesa";
  state: "locked" | "visible" | "claimable" | "claimed";
  ownerSettlementId?: string;
  feature?: "spring" | "old-road" | "ruin" | "trade-post" | null;
  risk?: "calm" | "storm" | "bandit-rumor" | "supply-shortage" | null;
};
```

## Definition Of Done

- Region generation is deterministic under seed.
- Same account/wallet restores the same region.
- Wrong account cannot read another private region.
- Region view does not mutate Founders Plot state.
- Home settlement node is visible in the Three.js region scene.
- Selecting a cell opens a state-backed detail sheet.
- Keyboard navigation can select cells through the DOM/accessibility mirror.
- WebGL failure falls back to a readable DOM grid.
- `specs/release-gates/threejs_runtime_gate.md` is satisfied before any
  `release_candidate` claim.
