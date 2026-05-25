# Founders Plot V1.5 Implementation Audit

Status: current branch implementation evidence
Branch: `codex/founders-plot-threejs-playable-slice`
Date: 2026-05-25

## Scope

This audit tracks the complete V1.5 First-Hour and Return-Loop Expansion against
`specs/46_agent_town_future_roadmap_v1_5_to_v4.md`.

V1.5 adds one player decision layer: contract choice. Three.js remains the renderer
boundary; server state and `et.plot.*` tools remain the gameplay authority.

## Milestone Status

| Milestone | Status | Evidence |
| --- | --- | --- |
| V1.5 gap audit | Done | This document plus roadmap comparison. |
| First-hour golden path | Done | `e2e/220_founders_plot_v15_first_hour_contract_loop.spec.js` covers fresh entry through Lumber Camp, HQ2, Farm Plot, first contract, HQ3, and second contract choice. |
| Contract choice layer | Done | Contract Board shows three named offers with requester/institution context and Clover recommendation. |
| Contract completion and second choice | Done | First contract turn-in refreshes the board; after HQ3/public-progress gate, the current goal becomes second contract choice. |
| Three.js V1.5 representation | Done | Contract and requester state appear through scene coverage anchors and Contract Board focus. |
| Clover contract-aware help | Done | Companion advice references active contract requester and bottleneck; no-Brain Foreman mutation remains blocked. |
| Lightweight teaching preference | Done | `PREFER_RESERVES` records a teaching preference and reranks future recommendations without unlocking autonomy. |
| Morning Brief return loop | Done | Recap/Morning Brief appears after meaningful events and survives route return. |
| QA/fix pass | Done for targeted V1.5 scope | Targeted unit/API and Playwright suites pass. |

## Issues Fixed In This Pass

- Added the missing second-contract milestone after the first contract and HQ3/public-progress moment.
- Extended the V1.5 browser test to reload/return, show Morning Brief, record teaching, reach HQ3, show second offers, and accept the second contract.
- Updated the V1.5 unit path so the post-HQ3 goal expects `choose_second_contract` before later Foreman permission expansion.

## Acceptance Evidence

### Unit/API

- `node --check server/founders_plot/engine.js`
- `node --test tests/founders_plot_v15_first_hour_contract.test.js tests/founders_plot_visual_state.test.js`
- `node --test tests/founders_plot_v15_first_hour_contract.test.js tests/founders_plot_visual_state.test.js tests/v1_4_4_brain_quality_policy.test.js tests/v1_4_4_foreman_brain_guard_behavior.test.js tests/founders_plot_foreman_context_assembler.test.js`

### Playwright

- `npx playwright test e2e/220_founders_plot_v15_first_hour_contract_loop.spec.js`
- `npx playwright test e2e/187_founders_plot_v1_4_2_mobile_calmness.spec.js e2e/210_founders_plot_brain_modes_and_real_clover_gate.spec.js e2e/214_founders_plot_threejs_playable_slice.spec.js e2e/216_founders_plot_scene_primary_controls.spec.js e2e/219_founders_plot_clover_companion_advice.spec.js e2e/220_founders_plot_v15_first_hour_contract_loop.spec.js e2e/221_founders_plot_hq_upgrade_collect_regression.spec.js e2e/222_founders_plot_hq2_build_catalog.spec.js`

### Screenshots

- `artifacts/founders-plot-v15-second-contract-scene-desktop.png`
- `artifacts/founders-plot-v15-second-contract-desktop.png`
- `artifacts/founders-plot-v15-second-contract-mobile.png`

## Deliberate Deferrals

- V1.6 civic scenarios remain out of scope.
- V2 persistent/off-session Foreman execution remains out of scope.
- Full-canvas HUD replacement remains out of scope; DOM still owns HUD, drawers, Brain setup, and forms.
- Account vault/Brain restore is V1.4.5/V2-prep work, not required for the V1.5 first-hour gameplay contract.
