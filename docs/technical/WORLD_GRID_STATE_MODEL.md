# World Grid State Model

Status: implementation planning

## Boundary

The world grid is server-authoritative. Three.js renders cells, settlement
nodes, routes, and focus state; it does not own simulation or mutation.

## Core Entities

- `WorldRegion`: private region owned by one account/wallet identity.
- `WorldCell`: deterministic terrain/state cell.
- `SettlementNode`: visible settlement marker.
- `RouteEdge`: planned/open/blocked connection between settlements.
- `TerritoryClaim`: V5.1+ claim workflow record.
- `PublicTownPresence`: V5.2+ public-safe town summary.

## Identity

Private region APIs resolve owner identity from the same account/wallet
continuity model as Founders Plot. Public APIs use redacted public IDs and must
not leak private owner identifiers.

## Mutation Rules

- V5.0 has no region mutation beyond focus/camera preferences.
- V5.1 claims require adjacency and resource conservation.
- Public presence and world events are separate from private town simulation.
- Renderer actions must be idempotent or read-only unless routed through typed
  server tools.
