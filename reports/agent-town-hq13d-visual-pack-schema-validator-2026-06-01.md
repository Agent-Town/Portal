# Agent Town HQ13D Visual Pack Schema Validator

Date: 2026-06-01
Lane: HQ13D visual-pack schema/validator fixture
Verdict: PASS_PARENT_VERIFIED

## Scope

This lane adds the first read-only schema and validator fixture for Agent Town visual universe packs.

It is docs/specs and report/proof only. It does not add runtime pack loading, pack selection UI, server authority, gameplay promotion, Generated Universe rendering, public sharing, Atlas execution, or any Expedition Map mutation path.

## Artifacts

- `docs/specs/agent-town.visual-pack.v1.schema.json`
- `docs/specs/fixtures/agent-town.visual-pack.v1.valid-tiny.manifest.json`
- `docs/specs/fixtures/agent-town.visual-pack.v1.invalid-forbidden-field-path-action.manifest.json`
- `reports/agent-town-hq13d-visual-pack-schema-validator-2026-06-01-validator.mjs`
- `reports/agent-town-hq13d-visual-pack-schema-validator-proof-2026-06-01.json`

## What The Schema Covers

- Top-level pack identity, version, status, private scope, presentation-only flags, authority boundary, and module map.
- Typed modules for map terrain, fog/markers, HUD/cards, inhabitants/operators, and location scenes.
- Slot allow-lists such as `expedition_map.fog.known`, `hud.card.*`, `founders_plot.actor.*`, and `founders_plot.stage.background.desktop`.
- Same-origin asset paths only.
- Fail-closed guardrails for public sharing, Atlas execution, Generated Universe rendering, tool/action/server-handler fields, routes, mutations, costs, outputs, timers, permissions, webhooks, external URLs, and resource deltas.

## Verification

Passed:

- `jq empty docs/specs/agent-town.visual-pack.v1.schema.json docs/specs/fixtures/agent-town.visual-pack.v1.valid-tiny.manifest.json docs/specs/fixtures/agent-town.visual-pack.v1.invalid-forbidden-field-path-action.manifest.json`
- `node --check reports/agent-town-hq13d-visual-pack-schema-validator-2026-06-01-validator.mjs`
- `node reports/agent-town-hq13d-visual-pack-schema-validator-2026-06-01-validator.mjs docs/specs/agent-town.visual-pack.v1.schema.json docs/specs/fixtures/agent-town.visual-pack.v1.valid-tiny.manifest.json docs/specs/fixtures/agent-town.visual-pack.v1.invalid-forbidden-field-path-action.manifest.json`
- `git diff --check -- docs/specs/agent-town.visual-pack.v1.schema.json docs/specs/fixtures/agent-town.visual-pack.v1.valid-tiny.manifest.json docs/specs/fixtures/agent-town.visual-pack.v1.invalid-forbidden-field-path-action.manifest.json reports/agent-town-hq13d-visual-pack-schema-validator-2026-06-01-validator.mjs`

The tiny valid fixture passed. The invalid fixture failed for the expected reasons: forbidden `action`, forbidden `serverHandler`, `publicSharing: true`, `atlasExecution: true`, and external `https://` asset path.

## Guardrails

- No runtime loader was added.
- No server/store/engine/routes/tools/spec authority was expanded.
- No asset pack was promoted into gameplay.
- Scout Sector remains the only current Expedition Map mutation path.
- Event Packet, Expedition Party, and Current focus surfaces remain read-only/buttonless.
- No Atlas execution, public sharing, real Generated Universe rendering, hidden autonomy, route/trade/economy/resource/combat/scheduler/cross-plot/external effects, or Wild West drift.

## Next

The next safe lanes remain:

- HQ13E candidate-02 asset extraction plan, report/proof only.
- HQ13F candidate-02 runtime Expedition Map visual pass, frontend renderer/CSS/e2e/report only.
- After schema and asset extraction are both verified, a tiny terrain/fog/marker pack fixture can be introduced without runtime gameplay authority.
