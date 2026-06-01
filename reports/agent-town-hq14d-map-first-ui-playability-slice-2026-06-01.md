# Agent Town HQ14D Map-First UI/UX Playability Slice

Date: 2026-06-01

## Verdict

PASS. The Expedition Map is now more UI-driven without changing gameplay authority. The Three.js map remains the primary surface, with compact visual HUD affordances for fog state, selected sector, Scout Sector eligibility, receipt provenance, and expedition party context.

## Changed Files

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`
- `reports/agent-town-hq14d-map-first-ui-playability-slice-proof-2026-06-01.json`
- `reports/agent-town-hq14d-map-first-ui-playability-slice-desktop-2026-06-01.png`
- `reports/agent-town-hq14d-map-first-ui-playability-slice-mobile-2026-06-01.png`

## Slice Summary

- Added a compact map-first visual HUD over/near the Expedition Map surface:
  - Four fog-state pips/swatches with counts and selected-state emphasis.
  - Selected-sector mini summary with fog state, Scout Sector eligibility, and post-scout packet state.
  - Receipt trace chips that keep hinted/locked provenance sealed and show scout receipt provenance only after the server Scout Sector response.
  - Expedition Party badges/initials sourced from `expeditionMap.expeditionParty` or packet snapshots.
- Preserved the working server-owned gameplay spine:
  - Scout Sector is still the only Expedition Map mutation path.
  - Zoom/reset controls are presentation-only map controls and are separated from mutation-button proof.
  - Event Packet, Expedition Party, selected-sector, and objective surfaces remain read-only/buttonless.
- Kept audit/proof copy secondary:
  - Authority guardrails are still present and test-visible, but moved into compact details styling.
  - Long map text remains available for accessibility/proof while the default read is visual chips and badges.
- Mobile stays bounded:
  - FP-E2E-022 proof reports zero horizontal overflow.
  - Mobile map remains a 300px-tall primary interaction surface before the compact HUD and audit cards.

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js` passed.
- `node --check e2e/200_founders_plot.spec.js` passed.
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --reporter=line` passed, 1/1.
- `jq empty reports/agent-town-hq14d-map-first-ui-playability-slice-proof-2026-06-01.json` passed.
- `file reports/agent-town-hq14d-map-first-ui-playability-slice-desktop-2026-06-01.png reports/agent-town-hq14d-map-first-ui-playability-slice-mobile-2026-06-01.png` passed:
  - Desktop: PNG, 465 x 4033.
  - Mobile: PNG, 366 x 3358.

## Guardrails Confirmed

- No server, store, route, tool, schema, renderer, asset-pack loader, or manifest changes.
- No changes to `public/experiences/founders-plot/three_scene_entry.js`; HQ14C scope left untouched.
- No Atlas execution, public sharing, Generated Universe rendering, route/trade/economy/resource/combat/scheduler behavior, hidden autonomy, cross-plot mutation, or external effects.
- No hidden/locked truth leakage: hinted selected HUD reports sealed provenance and does not expose known-cell resources, outpost IDs, or scout receipt IDs before Scout Sector.
- No Wild West/cowboy/saloon/gold-rush drift detected in the FP-E2E-022 guardrail proof.

## Residual Risks

- The right-side HUD remains dense because legacy proof surfaces are still present. This slice makes the first read more playable, but a later pass should move more audit sections behind a single explicit inspector.
- Mobile screenshots are tall because the panel still contains the legacy sector list and proof cards beneath the map-first surface.
