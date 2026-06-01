# Agent Town HQ13O Candidate 02 Review Asset Visual Notes

Date: 2026-06-01
Lane: HQ13O parent visual review notes
Verdict: REVIEW_BUNDLE_USEFUL_NOT_PROMOTION_READY

## Scope

This is a parent visual review note for the HQ13K contact sheet:

`reports/agent-town-hq13k-candidate-02-gpt-image-2-review-assets-contact-sheet-2026-06-01.png`

No assets, runtime files, schemas, loaders, server/store/routes/tools, or app source files are changed by this lane.

## High-Level Read

The batch is directionally useful. It gives AgentTown a real GPT Image 2 visual vocabulary for fog, boundary/stroke language, map pins, and a selected-sector frame.

It is not promotion-ready. The contact sheet shows visible cleanup work before any asset-pack promotion: green edge artifacts, oversized source crops, and small-size readability checks still matter.

## Slot Notes

- `expedition_map.fog.hinted`: good soft private-map mist direction, but the green chroma edge is visible and needs cleanup before runtime review.
- `expedition_map.fog.locked_unknown`: useful heavier fog tone; still has green edge risk. It stays generic enough from the contact sheet and does not appear to leak specific hidden terrain.
- `expedition_map.fog.frontier_border`: readable as a boundary strip, but currently too thin/neon-green in review-alpha form. Needs warmer ivory treatment and cleanup.
- `expedition_map.marker.known_site_plan`: strongest marker candidate. It reads as civic/cartographic and does not show text or obvious reward/resource symbols in the contact sheet.
- `expedition_map.marker.hinted_unknown`: visually strong, but larger/rounder than expected for a map pin and should be checked at runtime marker scale. It does not appear to use a literal question mark.
- `expedition_map.marker.owned_outpost`: useful civic-outpost marker direction. Needs small-size review to ensure it does not read as a production/reward icon.
- `expedition_map.stroke.scout_receipt_trace`: conceptually right as dotted receipt language, but currently very thin and green. Needs stronger warm non-route treatment.
- `hud.frame.selected_sector_card`: strong empty card-frame candidate. It appears to leave room for app-rendered text and does not bake in buttons, labels, or resources.

## Promotion Blockers

- Assets are still review-source/alpha files, not final slot-sized files.
- HQ13M reports expected dimension warnings for all slots.
- Green-edge/chroma cleanup risk is visible on several alpha assets.
- Marker and stroke assets need small-size/mobile readability review.
- No visual pack manifest has been created for these assets.
- No runtime loader exists and no promotion approval has been given.

## Recommendation

Continue with HQ13N slot-sized review derivatives under `reports/media`, then run the HQ13M harness and a second visual contact-sheet review. Do not create runtime pack directories or loaders until the derived assets pass visual review and Robin explicitly approves promotion.

## Guardrails

- Report/proof only.
- No asset edits.
- No runtime asset promotion.
- No runtime pack directory.
- No runtime loader.
- No app source, server/store/routes/tools, schema, or validator edits.
- No Atlas execution.
- No public sharing.
- No real Generated Universe rendering.
- No hidden autonomy, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation, or external effects.
- Scout Sector remains the only current Expedition Map mutation path.
