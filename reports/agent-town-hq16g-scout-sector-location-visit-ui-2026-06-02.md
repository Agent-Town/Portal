# AgentTown HQ16G Scout Sector Location Visit UI

Date: 2026-06-02
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Base checkpoint: `75b577b Add AgentTown guided expedition loop`

## Verdict

`IMPLEMENTED_AND_VERIFIED`

HQ16G implements the first safe location visit layer from the HQ16D preflight: a read-only map-local place card for a selected known Scout Sector cell with a read-only Event Packet receipt.

## What Changed

- Added a frontend-only `expedition_location_visit` model derived from existing Expedition Map cells and Event Packets.
- Added a compact visit card in the Expedition Map HUD for eligible selected Scout Sector cells.
- Added a scene-like packet overlook surface with cell, packet, receipt, and action-count chips.
- Added a collapsed Visit ledger with the packet and hidden-visit count proof.
- Added focused browser assertions and proof artifact generation.

## Visit Gate

The card appears only when:

- selected cell fog state is `known` or `discovered`;
- selected cell source truth is Scout Sector related;
- an Event Packet resolves for the selected cell;
- packet is `readOnly: true`;
- packet has zero executable actions;
- packet receipt link action is `et.plot.scout_sector`.

Hidden and hinted cells do not get visit cards.

## Guardrails

- No server route, tool action, store, engine, schema, or API contract change.
- No navigation route, POST payload, command ring, or mutation control.
- No hidden cell visit affordance.
- No Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, cross-plot mutation, route/trade/economy/resource/reward/combat/scheduler expansion, public sharing, deploy, merge, or external effect.
- Scout Sector remains the only fog reveal path.
- Visit is a read-only presentation surface over a server-owned receipt/event packet.

## Expected Artifacts

- Proof JSON: `reports/agent-town-hq16g-scout-sector-location-visit-ui-proof-2026-06-02.json`
- Desktop screenshot: `reports/agent-town-hq16g-scout-sector-location-visit-ui-desktop-2026-06-02.png`

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `git diff --check`
- Focused Playwright `FP-E2E-022` passed `1/1`
- Proof JSON `jq empty`
- Screenshot `file`
- `npm run build:founders-plot-threejs`
- `npm run test:founders-plot` passed `98/98`

Focused Playwright rewrote older tracked report artifacts as usual; those side effects were restored, leaving only the intended HQ16G source/e2e/CSS/report/proof/screenshot changes.
