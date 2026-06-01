# HQ13I Placeholder Slot QA Backfill

Date: 2026-06-01
Lane: HQ13I visual-pack placeholder slot QA
Verdict: BLOCKED_SCHEMA_SLOT_RECONCILIATION_REQUIRED

## Scope

HQ13I was intended to compare the HQ13G candidate-02 placeholder asset intents against the HQ13D visual-pack v1 schema. The worker timed out before leaving a report/proof artifact, so this parent backfill records the narrow slot QA result.

No app source, server, store, routes, tools, Atlas behavior, generated assets, runtime pack loader, runtime pack directory, or Expedition Map mutation path was changed by this backfill.

## Result

The HQ13G preflight batch is still safe as report-only placeholder work, but it is not ready for real GPT Image batch generation under the current schema as-is.

Five slot intents are allowed by the HQ13D schema patterns:

- `expedition_map.fog.hinted`
- `expedition_map.fog.locked_unknown`
- `expedition_map.marker.known_site_plan`
- `expedition_map.marker.hinted_unknown`
- `expedition_map.marker.owned_outpost`

Three slot intents are blocked by the current v1 schema allowlist:

- `expedition_map.fog.frontier_border`
- `expedition_map.stroke.scout_receipt_trace`
- `hud.frame.selected_sector_card`

This is a good blocker. It means the fail-closed manifest boundary is doing its job before real assets are generated or promoted.

## Recommendation

Run a narrow HQ13J schema-slot reconciliation lane before real asset generation:

- either extend the visual-pack v1 schema and validator harness to allow visual-only `expedition_map.stroke.*`, `expedition_map.fog.frontier_border`, and `hud.frame.*` slots;
- or rename/reduce the first generated batch to only the five currently allowed slots;
- keep the change docs/specs/report/proof-only unless Robin explicitly approves runtime pack promotion.

Do not generate or promote the real 8-asset GPT Image batch until this slot mismatch is resolved.

## Proof

- Backfill proof JSON: `reports/agent-town-hq13i-placeholder-slot-qa-proof-2026-06-01.json`
- Source placeholder proof: `reports/agent-town-hq13g-candidate-02-tiny-asset-batch-preflight-proof-2026-06-01.json`
- Source schema: `docs/specs/agent-town.visual-pack.v1.schema.json`
- Source validator harness: `reports/agent-town-hq13d-visual-pack-schema-validator-2026-06-01-validator.mjs`

## Guardrails

- QA/report/proof only.
- No runtime pack loader.
- No runtime visual-pack directory.
- No generated asset promotion.
- No server/store/engine/routes/tools authority changes.
- No Atlas execution, public sharing, real Generated Universe rendering, hidden autonomy, route/trade/economy/resource/combat/scheduler behavior, cross-plot mutation, or external effects.
- Scout Sector remains the only current Expedition Map mutation path.
