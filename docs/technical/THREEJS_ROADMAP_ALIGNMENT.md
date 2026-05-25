---
schemaVersion: "agent-town-threejs-roadmap-alignment-v1"
title: "Three.js Roadmap Alignment"
status: "locked direction"
date: "2026-05-24"
---

# Three.js Roadmap Alignment

## Locked Decision

Founders Plot V1.x now uses Three.js as the forward human-facing renderer path.

This is not a simulation rewrite. The renderer consumes scene-state output and presents it as a
playable 2.5D/orthographic town scene.

## Relevant Existing Specs

- `specs/43_founders_plot_threejs_playable_slice.md`
- `specs/44_founders_plot_2d_asset_pipeline.md`
- `specs/45_founders_plot_threejs_full_state_coverage.md`

## Renderer Boundary

Three.js owns:

- world surface rendering;
- object picking/raycasting;
- visual state labels/rings/badges/timers;
- Clover in-world presence;
- camera focus and scene highlights;
- canvas state anchors.

The server and tools own:

- plot state;
- economy rules;
- contracts;
- rewards;
- approvals;
- Foreman authority;
- mutations through `et.plot.*`.

DOM still owns for now:

- HUD/inventory shell;
- action sheets;
- drawer bodies;
- Brain setup;
- Foreman setup;
- debug/dev tools;
- forms and accessibility mirrors.

## Accessibility Contract

Every interactive Three.js object must have a semantic DOM/accessibility mirror with:

- stable object ID;
- accessible name;
- state summary;
- keyboard selection path;
- focus/selection parity;
- no reliance on color alone.

## Performance Contract

The Three.js renderer must have explicit budgets:

- mobile-friendly load;
- WebGL fallback;
- texture/asset size budgets;
- no unnecessary per-frame allocations;
- route-exit cleanup/disposal;
- screenshot and performance evidence before release.

## Roadmap Impact

V1.5 must build contract choice, requesters, and Morning Brief on top of Three.js state anchors.

V1.6 scenarios should use Three.js civic-project anchors and camera focus.

V1.7 pride/identity should use 3D/2.5D landmarks, plot cards, and camera postcards.

V2 persistent Foreman should use Three.js for action replay/focus, but not for backend authority.

V2.5 second settlement should use a new settlement scene/diorama rather than a manual duplicate UI.
