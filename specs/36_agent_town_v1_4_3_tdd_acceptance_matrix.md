# Agent Town V1.4.3 — App-Wide GPT Image 2 Asset Refresh TDD Acceptance Matrix

This file defines measurable tests for the app-wide asset refresh. The implementation team must update exact filenames if existing test numbering differs.

---

## 1. Node tests

| ID | Test file | Goal | Metric / assertion |
|---|---|---|---|
| V143-N01 | `tests/v1_4_3_app_wide_asset_inventory.test.js` | Every public non-game asset is inventoried | Inventory covers `public/assets`, `public/images`, `public/brand-kit`, `public/agenttown.jpeg`, `public/logo.jpg`, `public/background.webp`, favicon assets, and route-used visual assets. |
| V143-N02 | `tests/v1_4_3_platform_asset_manifest_schema.test.js` | Platform manifest is valid | `public/assets/platform/asset-manifest.json` parses, uses schemaVersion `v1.4.3`, and every asset has id/path/surface/role/model/promptFile/promptHash/approval fields. |
| V143-N03 | `tests/v1_4_3_platform_prompt_coverage.test.js` | Every generated asset has a prompt | For each production asset with `model: gpt-image-2`, prompt file exists and prompt hash matches. |
| V143-N04 | `tests/v1_4_3_platform_asset_files_exist.test.js` | No broken asset references | Every manifest path exists and has non-zero bytes. |
| V143-N05 | `tests/v1_4_3_platform_asset_budget.test.js` | Asset budget protection | Total production platform bytes <= configured budget or signoff sheet records exception. |
| V143-N06 | `tests/v1_4_3_design_doc_update.test.js` | Design docs mention app-wide asset refresh | `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, `REGISTRY.md`, and `AGENTS.md` contain V1.4.3 app-wide asset guidance. |
| V143-N07 | `tests/v1_4_3_no_orphan_platform_assets.test.js` | Avoid asset dumps | Every production asset is used by app code/routes or marked `future_use`. |
| V143-N08 | `tests/v1_4_3_prompt_frontmatter.test.js` | Prompts are machine-readable | All `specs/prompts/v1_4_3/*.md` files have valid YAML front matter delimited by `---`. |

---

## 2. Playwright tests

| ID | Test file | Goal | Metric / assertion |
|---|---|---|---|
| V143-E01 | `e2e/191_agent_town_v1_4_3_start_gate_visual.spec.js` | Start Gate visual refresh | Desktop and mobile screenshots exist; Start Gate uses V1.4.3 asset; CTA visible; AI SLOP copy visible and not clipped. |
| V143-E02 | `e2e/192_agent_town_v1_4_3_town_shell_visual.spec.js` | Town shell refresh | District hub uses V1.4.3 background/icons; no debug panels visible by default; modal-first navigation preserved. |
| V143-E03 | `e2e/193_agent_town_v1_4_3_townhall_brain_visual.spec.js` | Town Hall + Brain visuals | Onboarding and Brain connect surfaces use V1.4.3 platform assets; no provider/runtime jargon above primary fold unless in advanced panel. |
| V143-E04 | `e2e/194_agent_town_v1_4_3_secondary_surfaces_visual.spec.js` | House/Pony/Saloon/Sigil/Atlas/Leaderboard refresh | Each route/modal contains the intended asset or explicitly accepted no-image state. |
| V143-E05 | `e2e/195_agent_town_v1_4_3_mobile_platform_visual.spec.js` | Mobile platform coherence | 390px screenshots show no clipped hero copy, no horizontal overflow, and readable primary CTA. |
| V143-E06 | `e2e/196_agent_town_v1_4_3_asset_usage_and_budget.spec.js` | Route-level asset proof | Captured network/resource URLs include V1.4.3 assets and exclude retired assets unless fallback is intentional. |
| V143-E07 | `e2e/197_agent_town_v1_4_3_debug_boundary.spec.js` | Normal routes remain game-first | Agent Comms/Worker Tools/Brain debug surfaces remain hidden on normal routes; debug route still works if explicitly enabled. |
| V143-E08 | `e2e/198_agent_town_v1_4_3_founders_plot_non_regression.spec.js` | Founders Plot not reopened | Founders Plot default route still passes latest accepted visual tests. |
| V143-E09 | `e2e/162_founders_plot_full_route_player_surface.spec.js` | Full-route mobile calmness parity | The full `/app?district=founders-plot` route at 390px inherits the embedded frame mobile calmness law: no non-objective scene labels, no clipped labels, and no excess primary-attention overlays after desktop-to-mobile resize. |

---

## 3. Manual / human signoff gates

| Gate | Owner | Required evidence |
|---|---|---|
| G1 Inventory signoff | Robin or delegated reviewer | `APP_WIDE_ASSET_INVENTORY_V1_4_3.md` marks P0 assets and replacement plan. |
| G2 Candidate review | Robin | Candidate grid for P0 assets with selected candidate IDs. |
| G3 Route screenshot review | Robin | Start Gate, town shell, Town Hall, Brain, and secondary surfaces screenshots linked in signoff sheet. |
| G4 Final art signoff | Robin | `APP_WIDE_VISUAL_SIGNOFF_SHEET_V1_4_3.md` completed with approval or caveats. |

---

## 4. Release gates

The sprint cannot be accepted unless:

```yaml
nodeTestsPass: true
playwrightTestsPass: true
appWideInventoryComplete: true
platformManifestValid: true
promptCoverage: 100%
humanSignoffComplete: true
normalRouteDebugLeakage: 0
foundersPlotRegression: 0
noOutOfScopeGameplay: true
```
