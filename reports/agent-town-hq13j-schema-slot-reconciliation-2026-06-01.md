# HQ13J Schema Slot Reconciliation

Date: 2026-06-01
Lane: HQ13J visual-pack v1 schema-slot reconciliation
Verdict: PASS

## Scope

This reconciles the HQ13G candidate-02 eight-slot visual intent list against the HQ13D visual-pack v1 manifest schema and validator.

The change is intentionally limited to docs/specs/fixtures/validator/report/proof. No runtime visual pack directory, loader, generated images, public assets, server/store/routes/tools, Atlas execution path, public sharing path, or Expedition Map gameplay authority was changed.

## Changes

- Extended the `fog_marker_pack` slot allowlist to accept:
  - `expedition_map.fog.frontier_border`
  - `expedition_map.stroke.<lowercase_id>`
- Extended the `hud_card_pack` slot allowlist to accept:
  - `hud.frame.<lowercase_id>`
- Updated the tiny valid fixture to exercise:
  - `expedition_map.fog.frontier_border`
  - `expedition_map.stroke.scout_receipt_trace`
  - `hud.frame.selected_sector_card`
- Kept the existing invalid fixture unchanged so it still rejects `action`, `serverHandler`, `publicSharing: true`, `atlasExecution: true`, and an external `https://` asset URL.

## Slot QA

All eight HQ13G candidate-02 slot intents are now schema-allowed:

- `expedition_map.fog.hinted`
- `expedition_map.fog.locked_unknown`
- `expedition_map.fog.frontier_border`
- `expedition_map.marker.known_site_plan`
- `expedition_map.marker.hinted_unknown`
- `expedition_map.marker.owned_outpost`
- `expedition_map.stroke.scout_receipt_trace`
- `hud.frame.selected_sector_card`

This only opens visual presentation slots. It does not grant pack manifests any gameplay mutation fields, server handlers, Atlas execution, public sharing, external URLs, route/trade/economy hooks, hidden autonomy, or generated-universe rendering.

## Verification

- `jq empty` passed for the schema, touched fixtures, and HQ13J proof JSON.
- `node --check` passed for the validator harness.
- The validator harness accepted the expanded valid fixture and rejected the forbidden-field invalid fixture.
- `git diff --check` passed over the touched HQ13J/HQ13D schema lane files.

Proof JSON: `reports/agent-town-hq13j-schema-slot-reconciliation-proof-2026-06-01.json`

## Guardrails

- Docs/specs/fixtures/validator/report/proof only.
- No runtime pack loader.
- No runtime pack directory.
- No generated image or runtime asset promotion.
- No server/store/engine/routes/tools changes.
- No client or server gameplay authority expansion.
- Scout Sector remains the only current Expedition Map mutation path.
- No Atlas execution, public sharing, real Generated Universe rendering, hidden autonomy, route/trade/economy/resource/combat/scheduler behavior, cross-plot mutation, external effects, or Wild West drift.
