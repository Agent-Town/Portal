---
schemaVersion: "agent-town-tdd-matrix-v1"
documentId: "specs/48_agent_town_v5_0_region_grid_tdd_matrix"
title: "Agent Town V5.0 Region Grid TDD Matrix"
status: "prototype_gated"
date: "2026-05-26"
owner: "Agent Town engineering"
---

# Agent Town V5.0 Region Grid TDD Matrix

## Unit/API

| Requirement | Test |
| --- | --- |
| Deterministic generation | `tests/world_grid_region.test.js` generates the same seed twice and compares cell IDs, terrain, states, and home node. |
| Stable IDs | Every cell ID uses `REGION:q,r`; route and settlement IDs are stable across reload. |
| Same account restore | Same owner account resolves the same `regionId` and seed. |
| Wrong account denial | Private region lookup for another owner returns 403/404 without metadata leakage. |
| Renderer cannot mutate town | Region focus/camera APIs do not change Founders Plot inventory, buildings, jobs, contracts, or events. |
| Restart-safe preferences | `tests/world_grid_region_preferences_persistence.test.js` proves selected-cell and camera preferences reopen across separate Node lifetimes when `WORLD_GRID_REGION_PREFS_SQLITE_PATH` is configured and do not leak to another owner. |
| Read-only agent tools | `et.world.region.get_state` and `et.world.region.explain_cell` return redacted observations only. |
| Accessibility mirror data | Every selectable cell has a label containing terrain and state. |

## Playwright

| Requirement | Test |
| --- | --- |
| Prototype gate | Normal player route does not show the world grid unless `FEATURE_WORLD_GRID_V50_REGION` is enabled by trusted dev/QA config. |
| Grid visible | Open Founders Plot with the V5.0 prototype flag and zoom out to the region grid. |
| Home node visible | The home settlement marker is visible and named. |
| Cell selection | Select a visible cell and verify the detail sheet opens. |
| Locked cell behavior | Locked cells are readable but not claimable. |
| Zoom return | Zoom back into the settlement and verify Founders Plot state is unchanged. |
| WebGL fallback | Force renderer failure and verify the DOM region grid remains usable. |
| Keyboard selection | Use keyboard controls to move between selectable cells. |
| Mobile FPS | 390px route meets the active Three.js runtime gate threshold. |

## Evidence

- Desktop region-grid screenshot.
- Mobile region-grid screenshot.
- Settlement-to-region zoom screenshot.
- Runtime evidence document under `docs/release-evidence/`.
- API/unit and Playwright summaries.
- Region preference restart proof summary.
