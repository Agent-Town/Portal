# Agent Town Post-HQ10C + Feynman Regression QA - 2026-05-31

Branch: `neo/progression-atlas-editor-next-2026-05-29`
Worktree: dirty shared branch; no source edits made.
Report/proof prefix: `reports/agent-town-post-hq10c-feynman-regression-*`

## Verdict

PASS with one low product-sense copy note.

The post-HQ10C and post-Feynman surfaces held in focused regression checks:

- HQ9 completed work-order cards with past `expiresAt` show completed receipt/audit copy.
- Expired DRAFT work-order cards still show recreate-before-execution copy.
- HQ10C Generated Universe overlay-pack UI lists and creates presentation-only records over existing APIs.
- HQ10B civic proposal UI and HQ10A World Grid panel still read as advisory/proposal-only/read-only beside HQ10C.
- 390px mobile layout remained usable with no horizontal overflow in the proof probe.
- Progression Atlas checks still pass and remain advisory/non-executable in the touched HQ9/HQ10 flows.
- No gameplay mutation, server rule change, public sharing, generated rendering, trade/route/spend/scheduler behavior, or Atlas-owned execution was observed.

## Findings

### High

None.

### Medium

None.

### Low / Product Sense

1. HQ10C copy still names prohibited capabilities in negative guardrail language.

   The overlay-pack panel has no apply/render/share/execute behavior or action buttons, and the create payload remains record-only. However, the UI does contain negative explanatory copy such as "does not apply, render, publish, share..." and "rendering not implemented." If the product requirement means literally no `apply/render/share/execution` words anywhere in the panel, this should get a narrow copy cleanup. If it means no positive affordance or behavior, current UI passes.

## Proofs

- `reports/agent-town-post-hq10c-feynman-regression-hq9-work-orders-proof-2026-05-31.png`
- `reports/agent-town-post-hq10c-feynman-regression-hq10-panels-proof-2026-05-31.png`
- `reports/agent-town-post-hq10c-feynman-regression-mobile-390-proof-2026-05-31.png`
- `reports/agent-town-post-hq10c-feynman-regression-ui-proof-2026-05-31.json`

Important JSON proof values:

```json
{
  "hq9": {
    "completedExpiry": "Completed receipt. Child receipts are preserved for audit.",
    "expiredExpiry": "Expired draft. Recreate it before execution."
  },
  "hq10": {
    "overlayButtons": ["Create Overlay Record"],
    "civicButtons": ["Create civic proposal"],
    "forbiddenActionButtons": []
  },
  "mobileLayout": {
    "viewport": 390,
    "documentScrollWidth": 390,
    "bodyScrollWidth": 390,
    "clipped": []
  }
}
```

Captured overlay-create payload stayed presentation-record scoped:

- `actor`: `HUMAN`
- `targetSurfaceIds`: `progression_atlas`, `world_grid`
- `targetNodeIds`: `generated_universe.overlay_pack_records`, `world_grid.read_model`
- `provenance.provider`: `none`
- `provenance.model`: `none`
- no route/trade/spend/schedule/share/render/apply action was invoked

## Commands Run

| Command | Result |
| --- | --- |
| `node --check public/experiences/founders-plot/founders-plot.js` | PASS |
| `node --check e2e/200_founders_plot.spec.js` | PASS |
| `node --check e2e/114_progression_atlas_openclaw_lite.spec.js` | PASS |
| `git diff --check` | PASS |
| `rg -n "execute\|apply\|render\|publish\|share\|trade\|spend\|schedule\|scheduler\|route" ...` | PASS audit: found expected explicit guardrail language plus existing intentional HQ9 execute-work-order endpoint |
| `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-scene-state.test.js` | PASS, 79/79 |
| `PW_PORT=4197 npx playwright test e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium` | PASS, 2/2 |
| Local direct Playwright proof probe against `PORT=4198` | PASS; wrote QA-prefixed screenshots/JSON |
| `jq . reports/agent-town-post-hq10c-feynman-regression-ui-proof-2026-05-31.json >/dev/null` | PASS |
| `identify reports/agent-town-post-hq10c-feynman-regression-*.png` | PASS |

I did not run the existing focused `FP-E2E-013|015|018` tests directly because their screenshots are hardcoded to non-QA-prefix report paths. Instead, the direct Playwright proof probe covered the same requested behaviors while keeping new proof writes under the allowed prefix.

## Screenshot Identify

```text
reports/agent-town-post-hq10c-feynman-regression-hq9-work-orders-proof-2026-05-31.png PNG 1280x6537
reports/agent-town-post-hq10c-feynman-regression-hq10-panels-proof-2026-05-31.png PNG 1280x6537
reports/agent-town-post-hq10c-feynman-regression-mobile-390-proof-2026-05-31.png PNG 390x7337
```

## Scope Notes

- HQ9: completed cards use receipt/audit text before expiry logic; expired DRAFT cards still use recreate copy.
- HQ10A: World Grid remains read-only advisory status with prohibited-capability display.
- HQ10B: civic proposal records remain proposal-only and no execution behavior is exposed.
- HQ10C: overlay packs remain server-owned presentation-only records, not rendered/applied/public/shared overlays.
- Mobile: proof probe at `390x844` found document/body scroll width exactly `390` and no clipped target panels/cards.
- Progression Atlas: e2e coverage passed; Founders Plot tests passed HQ9/HQ10 API/contract/unit assertions including advisory/non-executable boundaries.

## Files Written

Only QA report/proof files under the requested prefix:

- `reports/agent-town-post-hq10c-feynman-regression-qa-2026-05-31.md`
- `reports/agent-town-post-hq10c-feynman-regression-ui-proof-2026-05-31.json`
- `reports/agent-town-post-hq10c-feynman-regression-hq9-work-orders-proof-2026-05-31.png`
- `reports/agent-town-post-hq10c-feynman-regression-hq10-panels-proof-2026-05-31.png`
- `reports/agent-town-post-hq10c-feynman-regression-mobile-390-proof-2026-05-31.png`
