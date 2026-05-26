---
schemaVersion: "agent-town-tdd-matrix-v1"
documentId: "specs/56_agent_town_generated_universe_style_pack_tdd_matrix"
title: "Generated Universe + Style Pack TDD Matrix"
status: "prototype_gated"
date: "2026-05-26"
owner: "Agent Town product"
---

# Generated Universe + Style Pack TDD Matrix

| ID | Layer | Acceptance | Evidence |
| --- | --- | --- | --- |
| GPACK-001 | Schema | Required schema files exist and fixture JSON is parseable | `tests/generated_pack_contract.test.js` |
| GPACK-002 | Security | Invalid pack with arbitrary formula/tool authority fails validation | `tests/generated_pack_contract.test.js` |
| GPACK-003 | Security | Invalid pack with secret-like fields fails validation | `tests/generated_pack_contract.test.js` |
| GPACK-004 | Mapping | Valid pack covers every required canonical gameplay mapping | `tests/generated_pack_contract.test.js` |
| GPACK-005 | API | Generated-pack APIs are hidden unless feature flag is enabled | `tests/generated_pack_contract.test.js` |
| GPACK-006 | API | Prompt-to-pack stores prompt hash, not raw prompt | `tests/generated_pack_contract.test.js` |
| GPACK-007 | Runtime | Generated palette reaches the Three.js scene info | `e2e/237_world_grid_generated_pack_demo.spec.js` |
| GPACK-008 | Runtime | Generated text appears in the playable route | `e2e/237_world_grid_generated_pack_demo.spec.js` |
| GPACK-009 | Gameplay | First claim loop completes with canonical server mutation | `e2e/237_world_grid_generated_pack_demo.spec.js` |
| GPACK-010 | Playtest | First-loop playtest report is recorded and passes | `e2e/237_world_grid_generated_pack_demo.spec.js` |

