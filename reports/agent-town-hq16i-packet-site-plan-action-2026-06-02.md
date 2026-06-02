# AgentTown HQ16I Packet Site Plan Action

Date: 2026-06-02 17:20 +07
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Base checkpoint: `c6d2f57 Add AgentTown scout survey bridge`
Verdict: `IMPLEMENTED`

## Summary

HQ16I turns the HQ16H Scout Sector -> Survey readiness bridge into the smallest real server-owned planning action: a Scout Sector Event Packet can now draft exactly one packet-grounded Site Plan.

This is intentionally planning-only. It creates no Surveyor, convoy, settlement, route, resource delta, reward, timer, job, combat state, Atlas execution, Generated Universe runtime behavior, cross-plot effect, public share, or external effect.

## Implementation

- Added `draftSitePlanFromPacket` as a guarded, idempotent server mutation backed by Scout Sector Event Packets.
- Added `POST /api/founders-plot/expedition-map/draft-site-plan` and MCP/tool spec `et.plot.draft_site_plan_from_packet`.
- Kept existing Scout Report `draft_site_plan` behavior intact; packet-backed plans use packet provenance instead of pretending to be collected Scout Reports.
- Preserved packet provenance on Site Plans: source packet, scout, cell, receipt kind, action name, and bridge version.
- Updated Site Plan review grounding so packet-derived plans are reviewable only when the same plot still has the exact Scout Sector Event Packet.
- Updated the Expedition Map bridge UI with a compact server-backed `Plan` command when the server read model exposes the packet planning action.
- Added focused unit, contract, HTTP, docs, and exposed-tool coverage for the new action.

## Artifacts

- `reports/agent-town-hq16i-packet-site-plan-action-proof-2026-06-02.json`

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/routes.js`
- `node --check server/founders_plot/tools.js`
- `node --check server/founders_plot/progression_atlas.js`
- `node --check tests-founders-plot/fp-contract.test.js`
- `node --check tests-founders-plot/fp-unit.test.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `node --check e2e/200_founders_plot.spec.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-contract.test.js --test-name-pattern "FP-CT-101b3|FP-CT-101b3i|FP-CT-002"`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js --test-name-pattern "FP-UT-028|FP-UT-028b"`
- `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js --test-name-pattern "FP-HT-011d3|FP-HT-011d3b"`
- `npm run build:founders-plot-threejs`
- `npm run test:founders-plot` (101/101)
- `git diff --check`

Playwright was not rerun for HQ16I because the existing HQ16H bridge proof fixture intentionally represents the pre-HQ16I read-only contract gap and rewrites committed HQ16H screenshot/proof artifacts. HQ16I is covered here by server, HTTP, contract, full Founders Plot suite, docs, and UI wiring checks.

## Guardrails

- Scout Sector remains the only fog reveal mutation path.
- Scout movement remains same-plot and adjacent discovered/known only.
- The new action creates one draft Site Plan only.
- No Surveyor, convoy, settlement, route, trade, economy, resource, reward, timer, job, scheduler, combat, Generated Universe runtime, Atlas execution, hidden autonomy, hidden truth leakage, cross-plot mutation, public share, deploy, merge, or external effect was introduced.
- Agent callers require the same explicit human approval pattern used by other guarded planning actions.

## Residual

The next natural slice is to make the packet-derived Site Plan more visible as a map/ledger object and then decide whether the review-to-Surveyor step should become a similarly narrow server-owned action.
