# Frontier Ledger Map System Report

Date: 2026-06-05

North Star reference: `/Users/robin/Downloads/Frontier_Ledger.png`

## Summary

This slice turns the current Frontier Ledger HUD work from a one-screen visual pass into a reusable Three.js map/HUD system contract.

The renderer now exposes `hq18a_frontier_ledger_map_system_v1`, with a slot manifest split into three layers:

- `hud`: viewport-anchored board frame, top tabs, right ledger tab, bottom medallion rail, and parcel rangefinder backplate.
- `world`: selected ring and unit token slots that move with cells/units.
- `bridge`: route arc, dotted target trail, and target callout slots derived from server-owned command hints.

The system remains visual-only/read-only. It does not add network requests, mutation handlers, renderer authority, or hidden-truth leakage.

The follow-up visual pass `hq18b_frontier_ledger_visual_parity_pass_v1` moves the screen closer to the reference by warming the map base, reducing the green continuous underlay, replacing the dark parcel/rangefinder plate with a parchment parcel card, and suppressing legacy generated HUD chrome that competed with the Frontier Ledger parcel area.

After review, the center map overlay was still too strong over the actual cell tiles. The pass now treats the board center as a clear play window: visible discovered/known tiles render nearly opaque, non-hidden tile fog tint is removed, the full-screen board wash is removed in favor of a transparent-center outer matte, the continuous underlay is lowered to `0.44`, `map-depth-veil` stays at `0.10`, the old bottom bridge is demoted to `0.12`, selected aura is lowered to `0.64`, command targets render as ring-first overlays with no filled interior, normal `MAP`/`SITE` stamps are hidden until hover/selection, and non-selected public tile borders use sepia map lines instead of teal-heavy action lines.

The latest pass follows the corrected art direction: keep the center map dynamic, but cut the outer HUD chrome from the North Star image and draw those cutouts above the Three.js map. The new static chrome atlas is `frontier-ledger-north-star-hud-v1`, sourced from `/Users/robin/Downloads/Frontier_Ledger.png`, and it currently owns these slots:

- `frontier-ledger-top-tabs-shadow` -> `top-tabs.png`
- `frontier-ledger-right-tab-shadow` -> `right-ledger-tab.png`
- `frontier-ledger-bottom-medallion-rail` -> `bottom-rail.png`
- `frontier-ledger-parcel-rangefinder-backplate` -> `parcel-rangefinder.png`

The source-chrome composition is now guarded as `hq18d_frontier_ledger_outer_source_chrome_cutout_v1`. The board center, selected rings, command paths, units, terrain cells, building markers, and future actions remain dynamic Three.js layers. The cutout atlas is viewport chrome only.

The old generated unit dock chrome and its text are suppressed. Dynamic unit portraits are projected into the source bottom-rail medallion apertures instead of drawing a second dock on top of the North Star rail. Existing DOM controls and semantic zoom labels remain as transparent hit/accessibility layers, but the visible HUD owner remains the Three.js canvas.

The responsive pass now gives source HUD slots explicit compact/mobile bounds. The top tabs, right Ledger tab, bottom medallion rail, and parcel/rangefinder cutout no longer use the desktop source ratios directly on tall mobile viewports. Renderer proof telemetry records each source slot's world bounds, rendered pixel aspect ratio, source aspect ratio, and whether the mobile override was active.

## North Star Comparison

Matched structure:

- Full-viewport parchment/leather map frame.
- Top-left Expedition/Scout tabs cut from the North Star reference.
- Right-side vertical Ledger tab cut from the North Star reference.
- Bottom rail and medallion chrome cut from the North Star reference.
- Bottom-right parcel/rangefinder card cut from the North Star reference.
- Map-native selected/target rings and route preview.
- Parchment parcel card with map hex and scouted state.
- Legacy command tray, command puck, and selected-context chrome no longer visibly compete with the Frontier Ledger parcel area.
- Actual discovered/known tiles are materially more legible under the HUD frame.
- The center board frame is now transparent; only outer matte/shadow remains from the procedural board-frame sprite.
- Dynamic unit portraits now sit inside the source bottom rail's medallion apertures.
- Mobile uses source-chrome-specific slot overrides so the top tabs and parcel card stay legible on a tall viewport.
- Target previews are ring-first instead of filled plaques/glyphs over the target tile.
- Generic `MAP` and normal scouted `SITE` stamps no longer sit over every public tile by default.
- Non-selected public tile borders now read as parchment/sepia map lines; teal is reserved for selected/action affordances.

Still visually short of the North Star:

- The atlas pieces now match the source art directly, but the crop masks and responsive placement still need a visual tuning pass. The unit portrait inserts need scale/crop tuning inside the source medallion apertures.
- The top and parcel cutouts are source-faithful and responsive, but still need seam/edge tuning against the generated map body, especially where the right Ledger tab and parcel card meet on mobile.
- The base terrain is warmer than before but still has more existing Founders Plot greenery than the illustrated desert/frontier ledger target.
- Unit tokens need a dedicated Frontier Ledger medallion art pass rather than relying on the older generated profile treatment.
- Active command/selection affordances still sit over the selected/target tile by design; the command-target interior fill is now removed, but the final art pass should tune ring readability against each terrain asset.
- Fog and tile art need more authored biome/building variety before the screen reaches the reference image's density.

## Playability Proof

Focused Playwright coverage passes:

- `e2e/216_founders_plot_frontier_ledger_scratch_visual_hud.spec.js`
  - Verifies desktop, target-preview, and mobile views.
  - Confirms `three_canvas` is the single visible HUD owner.
  - Confirms DOM HUD layers are transparent hit/accessibility layers only.
  - Confirms system slots, route arc, target callout, trail pips, no authority expansion, and no hidden-truth leakage.
  - Confirms `hq18b_frontier_ledger_visual_parity_pass_v1`, warm parchment base map, and legacy chrome/content conflict suppression.
  - Confirms the tile-legibility pass, including `underlay === 0.44`, transparent-center board frame, `bottom bridge === 0.12`, `map-depth-veil === 0.10`, lower selected aura, ring-first target overlays, hidden normal public cell markers, and sepia public borders.
  - Confirms the North Star cutout atlas is enabled, all four source HUD slots load, and no generated fallback texture is used for those slots.
  - Confirms the source-chrome composition suppresses the old unit dock and projects unit portraits into the North Star bottom rail.
  - Confirms mobile source-chrome overrides are active for top tabs, right Ledger tab, bottom rail, and parcel/rangefinder card, using rendered pixel aspect rather than world-space scale.

- `e2e/217_founders_plot_frontier_ledger_map_system_scalability.spec.js`
  - Mounts the renderer with a synthetic 37-cell server-read-model map.
  - Verifies multiple units, command targets, pan, zoom, and command-target preview selection.
  - Confirms the same HUD/world/bridge contract still holds beyond the current one-screen map.
  - Confirms the same visual parity pass, tile-first overlays, North Star cutout chrome, source-rail unit portrait projection, and legacy chrome suppression on a 37-cell map.

Generated evidence:

- `reports/agent-town-frontier-ledger-scratch-visual-hud-desktop-2026-06-05.png`
- `reports/agent-town-frontier-ledger-scratch-visual-hud-target-preview-2026-06-05.png`
- `reports/agent-town-frontier-ledger-scratch-visual-hud-mobile-2026-06-05.png`
- `reports/agent-town-frontier-ledger-scratch-visual-hud-proof-2026-06-05.json`
- `reports/agent-town-frontier-ledger-map-system-scalability-desktop-2026-06-05.png`
- `reports/agent-town-frontier-ledger-map-system-scalability-proof-2026-06-05.json`

## Guardrails

The proofs assert:

- `visibleHudOwner === "three_canvas"`
- `frontierLedgerMapSystemVersion === "hq18a_frontier_ledger_map_system_v1"`
- `frontierLedgerMapSystemNotOneScreen === true`
- `frontierLedgerMapSystemScalableWorld === true`
- `frontierLedgerMapSystemHudLayer === true`
- `frontierLedgerMapSystemWorldLayer === true`
- `frontierLedgerMapSystemBridgeLayer === true`
- `frontierLedgerVisualParityVersion === "hq18b_frontier_ledger_visual_parity_pass_v1"`
- `frontierLedgerVisualParityBaseMap === "warm_parchment_cartographic_map"`
- `frontierLedgerVisualParityTileLegibilityPass === true`
- `frontierLedgerVisualParitySourceChromeCompositionVersion === "hq18d_frontier_ledger_outer_source_chrome_cutout_v1"`
- `frontierLedgerVisualParitySourceChromeUnitDockMode === "dynamic_unit_portraits_projected_into_north_star_bottom_rail"`
- `frontierLedgerVisualParitySourceChromeLegacyUnitDockSuppressed === true`
- `frontierLedgerVisualParitySourceChromeLegacyUnitTextSuppressed === true`
- `frontierLedgerVisualParitySourceChromeResponsiveAspectPass === true`
- Mobile proof: `frontierLedgerVisualParitySourceChromeResponsiveMobileOverrides` includes the four source cutout slots.
- `generatedHudProfileSourceRailProjection === true`
- `frontierLedgerVisualParityUnderlayOpacity === 0.44`
- `frontierLedgerVisualParityMapDepthVeilOpacity === 0.10`
- `frontierLedgerVisualParityBottomBridgeOpacity === 0.12`
- `frontierLedgerVisualParityBottomBridgeDemotedBySourceChrome === true`
- `frontierLedgerVisualParitySelectedAuraOpacity === 0.64`
- `frontierLedgerVisualParityBoardFrameOpacity === 0.28`
- `frontierLedgerVisualParityBoardFrameOuterChromeCutout === true`
- `frontierLedgerVisualParityBoardFrameCenterWash === "transparent_center_outer_hud_cutout"`
- `frontierLedgerVisualParityTargetOverlayMode === "ring_first_tile_legible"`
- `frontierLedgerVisualParityCommandTargetInteriorFillAlpha === 0`
- `frontierLedgerVisualParityGenericCellMarkerMode === "hidden_until_hover_or_selection"`
- `frontierLedgerVisualParityPublicCellMarkerMode === "normal_map_and_site_hidden_until_hover_or_selection"`
- `frontierLedgerVisualParityPublicBorderTone === "sepia_non_selected_teal_reserved_for_active"`
- `commandTargetRingsRingFirstOverlay === true`
- `commandTargetRingInteriorFillAlpha === 0`
- `frontierLedgerVisualParityLegacyChromeConflict === false`
- `frontierLedgerVisualParityLegacyContentConflict === false`
- `frontierLedgerVisualParityNorthStarHudAtlas === true`
- `frontierLedgerVisualParityNorthStarHudAtlasPackId === "frontier-ledger-north-star-hud-v1"`
- `frontierLedgerVisualParityNorthStarHudAtlasLoaded === true`
- `frontierLedgerVisualParityNorthStarHudAtlasFallback === false`
- Atlas slots include top tabs, right ledger tab, bottom rail, and parcel/rangefinder backplate.
- `rendererNetworkRequests === 0`
- `rendererMutationHandlers.length === 0`
- `frontierLedgerMapSystemAuthority === false`
- `frontierLedgerMapSystemHiddenTruthLeakage === false`

## Extension Points

Future tiles/buildings/units/actions should plug into the system through the slot manifest and server read model:

- Add tile art by extending public terrain slots and keeping hidden cells fog-only.
- Add buildings as world-anchored public markers derived from server-owned cell/building data.
- Add units as world-anchored tokens with separate roster medallion projections.
- Add action previews as bridge slots sourced from `commandHints` and movement targets.
- Add future HUD chrome by extending the source-cutout atlas manifest, not by baking gameplay state into a single static image.
- Keep mutation execution in existing server/API flows; renderer previews stay read-only.

## Validation

Passed:

```bash
node --check public/experiences/founders-plot/founders-plot.js
node --check public/experiences/founders-plot/three_scene_entry.js
node --check public/experiences/founders-plot/three_scene_bundle.js
node --check e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js
node --check e2e/207_founders_plot_hq16y_continuous_expedition_loop.spec.js
node --check e2e/216_founders_plot_frontier_ledger_scratch_visual_hud.spec.js
node --check e2e/217_founders_plot_frontier_ledger_map_system_scalability.spec.js
npm run build:founders-plot-threejs
npm run build:openclaw-lite
npx playwright test e2e/216_founders_plot_frontier_ledger_scratch_visual_hud.spec.js e2e/217_founders_plot_frontier_ledger_map_system_scalability.spec.js --project=chromium --workers=1
npx playwright test e2e/212_founders_plot_hq17f_single_owner_canvas_hud.spec.js --project=chromium --workers=1
npx playwright test e2e/200_founders_plot.spec.js e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js e2e/205_founders_plot_hq16q_outpost_status_map_surface.spec.js e2e/207_founders_plot_hq16y_continuous_expedition_loop.spec.js e2e/211_founders_plot_hq17d_three_masked_hud_profiles.spec.js e2e/214_founders_plot_threejs_playable_slice.spec.js e2e/216_founders_plot_frontier_ledger_scratch_visual_hud.spec.js e2e/217_founders_plot_frontier_ledger_map_system_scalability.spec.js --project=chromium --workers=1 -g "FP-E2E-009 UI loop|FP-E2E-022 UI shows HQ12B|HQ14T Expedition Map|FP-E2E-022M|FP-E2E-022Q|FP-E2E-022Y|FP-E2E-022D|Three.js Founders Plot renders|Frontier Ledger"
```

Latest focused batch result:

- `10 passed (9.1m)`.
- Covered production loop, server read-model Expedition Map, HQ14T semantic zoom/terrain authority, Prepare Convoy bridge, outpost status surface, continuous expedition loop, visual-only masked HUD profiles, Three.js actor slice, hq18 North Star source chrome, and hq19 37-cell scalability.

Code/test fixes made after the earlier full-suite run:

- Three picking now prioritizes unit/actor hits over tile/grid hits, so source-chrome canvas clicks select playable map actors first.
- Outpost frontier beacons now align to server-owned Scout command targets when those targets exist.
- Semantic zoom state now mirrors renderer view-change telemetry into app state before updating the overlay, avoiding stale survey-tier fallbacks after zoom.
- Prepare Convoy and continuous-loop guardrails now select/click through the current Three renderer surface instead of visible DOM unit tokens that are intentionally demoted under source chrome.
- Stale assertions that expected visible DOM HUD/status controls were updated to assert existence, authority, and state while leaving the source-chrome canvas as the visible HUD owner.

Full-suite status:

```bash
npm test
```

- Earlier in this pass, `npm test` reached Playwright and ran the full 312-test Chromium suite.
- Earlier full-suite result before the final map/HUD stale-test and state-sync fixes: `295 passed`, `2 skipped`, `15 failed`.
- The new hq18 Frontier Ledger proofs passed inside the full run:
  - `e2e/216_founders_plot_frontier_ledger_scratch_visual_hud.spec.js`
  - `e2e/217_founders_plot_frontier_ledger_map_system_scalability.spec.js`
- The full suite was not rerun after the final focused fixes because the remaining known full-suite cluster includes unrelated onboarding coverage in `e2e/120_onboarding_privy_required.spec.js`.
