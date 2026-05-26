# Three.js World Zoom Renderer

Status: implementation planning

## Renderer Contract

The world renderer supports a zoom ladder from object focus to region/world
views. It receives state from APIs and produces visuals, picking events, focus
state, and semantic DOM mirrors.

## Zoom Levels

- Z0 object focus: selected building/cell/requester detail.
- Z1 settlement: Founders Plot town diorama.
- Z2 territory grid: V5.0 region cells.
- Z3 regional map: multiple towns and route edges.
- Z4 world layer: public districts and world events.
- Z5 sandbox district: controlled co-presence instance.

## Required Mirrors

Every selectable object family needs:

- stable object ID;
- accessible name;
- terrain/status/progress text where relevant;
- keyboard focus path;
- Playwright selector/test hook;
- matching server state reference.

## Runtime Gate

Every renderer/world change must satisfy
`specs/release-gates/threejs_runtime_gate.md`.
