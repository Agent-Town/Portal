# Agent Town / Founders Plot Adversarial Boundary Playtest - 2026-05-31

Subagent: Noether
Scope: adversarial gameplay QA against the current dirty shared branch in `/Users/robin/Projects/Portal-atlas-editor`
Write scope honored: report/proof artifacts only under `reports/agent-town-gameplay-playtest-adversarial-boundaries-*`

## Verdict

PASS_WITH_NOTES

No exploitable high-severity authority-boundary bug was found. The tested server routes rejected early HQ upgrades, locked building placement, expired/completed work-order execution, AGENT civic/overlay creation without matching approval, foreign plot reads/execution, and foreign reviewed proposal use. Progression Atlas action refs remained metadata-only with `executableByAtlas: false`.

Proof JSON: `reports/agent-town-gameplay-playtest-adversarial-boundaries-proof-2026-05-31.json`

## Method

- Ran a local isolated Express harness with `NODE_ENV=test` and `FOUNDERS_PLOT_STORE_PATH=:memory:`.
- Exercised real HTTP routes from `server/founders_plot/routes.js`.
- Seeded only disposable in-memory QA states to simulate high-resource/late-game states.
- Ran a headless Playwright DOM scan against local Founders Plot and Progression Atlas pages.
- Did not edit source, push, merge, deploy, or clean the shared worktree.

## Findings

### High

None.

The high-risk attempts all failed closed:

- HQ upgrade bypasses against new building gates returned `400 MISSING_HQ_BUILDING_PREREQUISITES`.
- AGENT HQ upgrade without approval returned `403 FORBIDDEN_POLICY`.
- Completed work orders could not be executed with a new idempotency key.
- Expired work orders could not be executed.
- Foreign-pair work-order execution and private state reads returned `401 UNAUTHORIZED`.
- Civic proposal creation before World Grid readiness returned `400 INVALID_STATE`.
- AGENT civic proposal creation without matching approval returned `403 FORBIDDEN_POLICY`.
- AGENT civic proposal creation with a mismatched approval also returned `403 FORBIDDEN_POLICY`.
- Overlay-pack creation before readiness, from an unreviewed proposal, by AGENT without approval, or from a foreign reviewed proposal was rejected.
- Atlas exposed no executable action refs; all sensitive refs tested were `executableByAtlas: false`.

### Medium

None.

### Low / Notes

1. Overlay pack records preserve arbitrary `targetNodeIds` metadata, including foreign-looking values.

Repro payload:

```http
POST /api/founders-plot/overlay-packs
```

```json
{
  "plotId": "plot_e1e14f2b3a5ca494",
  "sourceProposalId": "civic_proposal_509f1b22003818ca",
  "title": "Public share and render payload attempt",
  "theme": "public_share_attempt",
  "summary": "Try to smuggle public sharing/render semantics into a presentation-only record.",
  "status": "REVIEWED",
  "targetSurfaceIds": ["world_grid", "founders_plot", "external_public_site"],
  "targetNodeIds": [
    "generated_universe.overlay_pack_records",
    "world_grid.read_model",
    "foreign.plot.plot_1bf4c335a2f56c13"
  ],
  "provenance": {
    "provider": "qa",
    "publicSharing": true,
    "externalEffects": true,
    "source": "adversarial_payload"
  },
  "actor": "HUMAN",
  "idempotencyKey": "overlay-human-sanitized"
}
```

Actual: accepted as a presentation-only record. `publicSharing` and `externalEffects` were forced to `false`, `rawPromptStored` was `false`, and invalid `targetSurfaceIds` were filtered. The foreign-looking `targetNodeIds` value was preserved as metadata.

Risk: not exploitable today because overlay packs are visual-only/presentation-only and have no renderer/share/execution path. It could become misleading if future renderers treat `targetNodeIds` as selectors instead of inert metadata.

2. Progression Atlas renders user-authored overlay-pack titles inside inspect-only graph node buttons.

The adversarial title above produced an inspect-only graph node button labeled:

```text
OV Public share and render payload attempt overlay_pack.overlay_pack_bc161b9ec3f2eece
```

Actual: no render/share/publish route or button was exposed, and API action refs remained non-executable. This is label hygiene, not an authority bypass. Tighten later if the product wants literal absence of prohibited verbs from graph node labels.

## Exact Repro Coverage

### HQ / Building Gates

For each HQ level 1 through 5, I seeded a plot with enough resources and XP but without the required prerequisite building, then called:

```http
POST /api/founders-plot/upgrade-building
```

```json
{
  "plotId": "<qa plot id>",
  "buildingId": "<HQ building id>",
  "actor": "HUMAN",
  "idempotencyKey": "hqgate-<level>"
}
```

Expected: reject despite sufficient resources/XP.
Actual:

- HQ1 -> HQ2 blocked by missing `LUMBER_CAMP` and `FARM_PLOT`.
- HQ2 -> HQ3 blocked by missing `QUARRY`.
- HQ3 -> HQ4 blocked by missing `EXPEDITION_BOARD`.
- HQ4 -> HQ5 blocked by missing `WORKSHOP`.
- HQ5 -> HQ6 blocked by missing `MARKET_STALL`.

Early locked building placement:

```http
POST /api/founders-plot/place-building
```

```json
{
  "plotId": "plot_449589b6c74e0ff5",
  "type": "MARKET_STALL",
  "x": 0,
  "y": 1,
  "actor": "HUMAN",
  "idempotencyKey": "early-market-stall"
}
```

Actual: `400 INVALID_STATE`, message `Market Stall is not unlocked yet.`

### Work Orders

Valid draft idempotency:

```http
POST /api/founders-plot/work-orders/draft
```

```json
{
  "plotId": "plot_1590e98ea7dadbe6",
  "templateId": "collect_ready_outputs_once",
  "scope": {
    "buildingIds": [
      "bldg_work_orders_farm_plot_0",
      "bldg_work_orders_lumber_camp_1"
    ]
  },
  "actor": "HUMAN",
  "idempotencyKey": "wo-draft-idem"
}
```

Actual: repeated same payload returned the same `work_order_e971c46151bc680d`; reusing the same key with different scope returned `409 IDEMPOTENCY_CONFLICT`.

Completed execution:

```json
{
  "plotId": "plot_1590e98ea7dadbe6",
  "workOrderId": "work_order_e971c46151bc680d",
  "actor": "HUMAN",
  "idempotencyKey": "wo-execute-idem"
}
```

Actual: first call completed with two child receipts; same key returned cached completion; new key returned `400 INVALID_STATE`, message `Only DRAFT work orders can be executed once.`

Expired execution:

```json
{
  "plotId": "plot_1590e98ea7dadbe6",
  "workOrderId": "work_order_3cf5e8fa194fe5bd",
  "actor": "HUMAN",
  "idempotencyKey": "wo-execute-expired"
}
```

Actual after advancing the QA clock 25h: `400 INVALID_STATE`, details status `EXPIRED`.

### Civic Proposals

Before readiness:

```json
{
  "plotId": "plot_9873e4e1e468200b",
  "title": "Too early civic proposal",
  "category": "route_study",
  "summary": "Attempt before World Grid readiness.",
  "status": "DRAFT",
  "actor": "HUMAN",
  "idempotencyKey": "civic-too-early"
}
```

Actual: `400 INVALID_STATE`, reason `world_grid_not_ready`.

AGENT without approval:

```json
{
  "plotId": "plot_07cce843b49aa7b7",
  "title": "Agent civic proposal without approval",
  "category": "civic_memory",
  "summary": "Agent tries to record without a matching human approval.",
  "status": "DRAFT",
  "actor": "AGENT",
  "idempotencyKey": "civic-agent-no-approval"
}
```

Actual: `403 FORBIDDEN_POLICY`, `requiresApproval: true`.

Mismatched approval:

```json
{
  "plotId": "plot_07cce843b49aa7b7",
  "title": "Different title should not match",
  "category": "civic_memory",
  "summary": "Different summary should not match.",
  "status": "DRAFT",
  "actor": "AGENT",
  "idempotencyKey": "civic-agent-mismatch-approval"
}
```

Actual: `403 FORBIDDEN_POLICY`; the earlier approval with different title/summary was not consumed.

Foreign related plot IDs:

```json
{
  "plotId": "plot_07cce843b49aa7b7",
  "title": "Foreign related plot filter attempt",
  "category": "route_study",
  "summary": "A human tries to attach a foreign plot id as related metadata.",
  "status": "DRAFT",
  "relatedPlotIds": ["plot_1bf4c335a2f56c13", "plot_not_known"],
  "actor": "HUMAN",
  "idempotencyKey": "civic-related-foreign-filter"
}
```

Actual: accepted, but persisted `scope.relatedPlotIds: []`.

### Overlay Packs

Before readiness:

```json
{
  "plotId": "plot_e21f09268bdf9b08",
  "sourceProposalId": "civic_proposal_missing",
  "title": "Too early overlay",
  "theme": "public_share_attempt",
  "summary": "Try to create overlay before readiness.",
  "status": "DRAFT",
  "actor": "HUMAN",
  "idempotencyKey": "overlay-too-early"
}
```

Actual: `400 INVALID_STATE`, reason `overlay_pack_records_not_ready`.

Unreviewed proposal source:

```json
{
  "plotId": "plot_e1e14f2b3a5ca494",
  "sourceProposalId": "civic_proposal_acd619fe0f75514f",
  "title": "Overlay from unreviewed proposal",
  "theme": "draft_only",
  "summary": "Attempt from DRAFT proposal.",
  "status": "DRAFT",
  "actor": "HUMAN",
  "idempotencyKey": "overlay-from-draft-proposal"
}
```

Actual: `400 INVALID_STATE`, reason `overlay_pack_records_not_ready`.

AGENT without approval:

```json
{
  "plotId": "plot_e1e14f2b3a5ca494",
  "sourceProposalId": "civic_proposal_509f1b22003818ca",
  "title": "Agent overlay without approval",
  "theme": "agent_attempt",
  "summary": "Agent tries overlay record without approval.",
  "status": "DRAFT",
  "actor": "AGENT",
  "idempotencyKey": "overlay-agent-no-approval"
}
```

Actual: `403 FORBIDDEN_POLICY`, `requiresApproval: true`.

Foreign reviewed proposal:

```json
{
  "plotId": "plot_b303905704614eda",
  "sourceProposalId": "civic_proposal_509f1b22003818ca",
  "title": "Foreign source proposal attempt",
  "theme": "foreign_source",
  "summary": "Use reviewed proposal ID from another plot.",
  "status": "DRAFT",
  "actor": "HUMAN",
  "idempotencyKey": "overlay-foreign-source"
}
```

Actual: `400 INVALID_STATE`, reason `reviewed_civic_proposal_required`.

### Foreign Plot Access

Foreign pair read:

```http
GET /api/founders-plot/state?plotId=plot_e1e14f2b3a5ca494
```

Actual: `401 UNAUTHORIZED`.

Foreign pair work-order execution:

```json
{
  "plotId": "plot_1590e98ea7dadbe6",
  "workOrderId": "work_order_e971c46151bc680d",
  "actor": "HUMAN",
  "idempotencyKey": "wo-foreign-execute"
}
```

Actual: `401 UNAUTHORIZED`.

## Progression Atlas / UI Affordance Check

Atlas API check:

- `actionRefCount`: 14
- `executableRefs`: 0
- Sensitive refs were present only as metadata:
  - `work_order.template.collect_ready_outputs_once` -> `et.plot.create_work_order_draft`, `executableByAtlas: false`
  - `world_grid.civic_proposal_records` -> `et.plot.create_civic_proposal`, `executableByAtlas: false`
  - `generated_universe.overlay_pack_records` -> `et.plot.create_overlay_pack`, `executableByAtlas: false`

Founders Plot UI:

- Showed allowed record-creation affordances when server read models were ready.
- Did not expose render/share/publish buttons.
- Did not expose overlay apply buttons.
- Work-order execution button is scoped to DRAFT work orders and calls the explicit server endpoint only.

Progression Atlas UI:

- DOM scan found no functional execute/render/share/publish buttons.
- The raw scanner did flag the user-authored overlay title noted above because it appeared inside an inspect-only graph node button.
- Boundary panel reported `0 Atlas executable actions`.

## Verification Commands

```bash
NODE_ENV=test FOUNDERS_PLOT_STORE_PATH=':memory:' node <adversarial harness>
jq '{verdict, summary}' reports/agent-town-gameplay-playtest-adversarial-boundaries-proof-2026-05-31.json
rg -n "overlay.*(apply|render|share|publish)|generated.*(render|share|publish)|publicSharing\\s*:\\s*true|externalEffects\\s*:\\s*true|executableByAtlas\\s*:\\s*true|executable\\s*:\\s*true" server/founders_plot public/experiences/founders-plot public/progression-atlas.js public/progression-atlas.html tests-founders-plot e2e/114_progression_atlas_openclaw_lite.spec.js e2e/200_founders_plot.spec.js
```

The `rg` scan found only negative guardrail copy / tests and `executableByAtlas: false` definitions, plus Three.js bundle internals unrelated to game authority.
