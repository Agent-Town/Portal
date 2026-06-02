# AgentTown HQ16K - Review Plan Map Bridge

Date: 2026-06-02

Verdict: PASS

## Summary

HQ16K finishes the next step in the Scout Packet -> Site Plan -> Surveyor loop. Packet-derived Site Plans can now surface a map-local Review command through the existing guarded `et.plot.review_site_plan` contract when HQ6 review rules are satisfied. After review, the same server-owned Expedition Map read model advances the bridge to `SURVEYOR_COMMAND_READY` and exposes the existing `prepare_settler_convoy` command hint.

The bridge remains a read-model and command-surface projection. It does not create a Surveyor in the browser, invent a new endpoint, or bypass existing Site Plan review/convoy rules.

## What Changed

- Added review availability into `expeditionMap.surveyBridge.activeCandidate.commandState`.
- Kept HQ3 packet-derived Site Plans honest: the Review command is visible as the next contract but locked until existing HQ6 review rules are satisfied.
- When HQ6 review rules are satisfied, `commandState` points to the existing guarded `et.plot.review_site_plan` action with `serverMutationImplemented: true`.
- After Site Plan review, the bridge projects `SURVEYOR_COMMAND_READY` and the existing Surveyor `prepare_settler_convoy` command hint.
- Added map UI handling for bridge Review and Prepare Convoy buttons using existing frontend handlers and endpoints.
- Updated API contract docs and focused unit/contract/http assertions.

## Guardrails

- No new server route was added.
- No Atlas execution.
- No Generated Universe runtime expansion.
- No hidden autonomy or hidden-truth leakage.
- No route/trade/economy/resource/reward/combat/scheduler/cross-plot behavior.
- No public share, deploy, merge, or push.
- Browser actions call existing guarded endpoints only.

## Verification

Passed:

- `node --check server/founders_plot/engine.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check tests-founders-plot/fp-contract.test.js`
- `node --check tests-founders-plot/fp-unit.test.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `NODE_ENV=test node --test --test-name-pattern="FP-CT-101b3i" tests-founders-plot/fp-contract.test.js`
- `NODE_ENV=test node --test --test-name-pattern="FP-UT-028b" tests-founders-plot/fp-unit.test.js`
- `NODE_ENV=test node --test --test-name-pattern="FP-HT-011d3b" tests-founders-plot/fp-http.test.js`
- `npm run build:founders-plot-threejs`
- `npm run test:founders-plot` (`101/101`)
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --reporter=line`
- `git diff --check`

Notes:

- Focused Playwright rewrote older tracked report screenshots/proofs as a known side effect. Those legacy report artifacts were restored after verification.
- No new screenshot artifact was retained for HQ16K because the browser proof used the existing focused Expedition Map regression fixture.

## Next

The next strongest North Star slice is to make the reviewed packet-derived Surveyor path feel spatial: after Review, the map should make the Surveyor/objective/Prepare Convoy transition visible as a compact, playable objective state without adding any new authority.
