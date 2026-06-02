# AgentTown HQ16H Scout-To-Survey Bridge

Date: 2026-06-02 15:16 +07
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Base checkpoint: `be884be Add AgentTown scout sector visit panel`
Verdict: `IMPLEMENTED`

## Summary

HQ16H adds the smallest safe bridge from a Scout Sector Event Packet toward Survey/Site Plan work: a server-owned `expeditionMap.surveyBridge` read model. It recognizes a packet-backed known sector as Site Plan preflight readiness, but it does not create a Site Plan, Surveyor, route, reward, resource delta, job, timer, Atlas execution, cross-plot mutation, or executable action.

The bridge renders map-first as `PKT -> SVY -> CMD`. Current state is `Packet -> Site plan preflight -> Wait / Contract`, because the packet-to-site-plan mutation is intentionally not implemented yet.

## Implementation

- Added `hq16h_scout_packet_to_site_plan_readiness_v1` and `server_owned_scout_packet_to_site_plan_readiness_v1` to the Expedition Map server read model.
- Derived bridge candidates from existing server truth only: Event Packets, discovered/known map cells, reviewed Site Plans, and current Surveyor command hints.
- Kept the bridge read-only with `executableActions: []`, `serverMutationImplemented: false` for the packet-to-plan gap, and boundary flags proving no Site Plan/Surveyor creation or gameplay side effects.
- Surfaced the bridge in the Expedition Map objective rail and selected map summary, with Ledger/Receipts preserving the authority details.
- Updated Founders Plot unit, contract, HTTP, and Playwright coverage for the new read model and UI proof.

## Artifacts

- `reports/agent-town-hq16h-scout-to-survey-bridge-proof-2026-06-02.json`
- `reports/agent-town-hq16h-scout-to-survey-bridge-ui-proof-2026-06-02.json`
- `reports/agent-town-hq16h-scout-to-survey-bridge-desktop-2026-06-02.png`
- `reports/agent-town-hq16h-scout-to-survey-bridge-mobile-2026-06-02.png`
- `e2e/202_founders_plot_hq16h_scout_to_survey_bridge.spec.js`

## Verification

Passed:

- `node --check server/founders_plot/engine.js && node --check server/founders_plot/tools.js && node --check public/experiences/founders-plot/founders-plot.js && node --check e2e/202_founders_plot_hq16h_scout_to_survey_bridge.spec.js`
- `node --check tests-founders-plot/fp-unit.test.js && node --check tests-founders-plot/fp-contract.test.js && node --check tests-founders-plot/fp-http.test.js`
- `NODE_ENV=test node --test --test-name-pattern="FP-UT-028" tests-founders-plot/fp-unit.test.js`
- `NODE_ENV=test node --test --test-name-pattern="FP-CT-101b" tests-founders-plot/fp-contract.test.js`
- `NODE_ENV=test node --test --test-name-pattern="FP-HT-011d" tests-founders-plot/fp-http.test.js`
- `npm run test:founders-plot` (98/98)
- `npx playwright test e2e/202_founders_plot_hq16h_scout_to_survey_bridge.spec.js --grep "FP-E2E-022H"` (1/1)
- `jq empty reports/agent-town-hq16h-scout-to-survey-bridge-ui-proof-2026-06-02.json`
- `jq empty reports/agent-town-hq16h-scout-to-survey-bridge-proof-2026-06-02.json`
- `file reports/agent-town-hq16h-scout-to-survey-bridge-desktop-2026-06-02.png reports/agent-town-hq16h-scout-to-survey-bridge-mobile-2026-06-02.png`
- `git diff --check`
- `git status --short --branch` captured the expected HQ16H modified/untracked files only.

## Guardrails

- Scout Sector remains the only fog reveal mutation path.
- Scout movement remains same-plot and adjacent discovered/known only.
- No new survey/site-plan mutation endpoint was added.
- No frontend-only Survey command was fabricated; the UI renders the server-owned bridge state.
- No resources, routes, trades, rewards, jobs, timers, combat, public sharing, Generated Universe runtime expansion, Atlas execution, hidden truth leakage, hidden autonomy, cross-plot mutation, external effects, deploy, merge, push, or external messages were introduced.

## Residual

The next lane is a guarded, idempotent packet-to-site-plan server mutation contract if gameplay should progress past readiness. It should be same-plot, human/approval guarded consistently with existing Surveyor/Settler mutations, and should create only a planning/site-plan record aligned with existing Site Plan mechanics.
