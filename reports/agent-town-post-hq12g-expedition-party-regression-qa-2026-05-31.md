# AgentTown Post-HQ12G Expedition Party Regression QA

Date: 2026-05-31

## Verdict

Passed. The focused post-HQ12G regression lane found no guardrail regressions.

The server-owned Expedition Party manifest and Event Packet party snapshot remain read-only presentation/read-model metadata. FP-E2E-022 still passes and presents Expedition Party/Event Packet flavor without adding packet/party buttons or new mutation paths. Scout Sector remains the only Expedition Map UI mutation path.

## Scope

Reviewed and exercised:

- Server tests around Expedition Map, Scout Sector, Event Packets, and Expedition Party metadata.
- Focused Founders Plot UI proof for `FP-E2E-022`.
- Prior HQ12G backend and UI proof JSONs.
- Relevant source/test/spec surfaces for read-only boundaries and forbidden genre drift.

No source files were edited. The focused Playwright proof refreshed its existing report artifacts for HQ12B/HQ12C/HQ12F/HQ12G under `reports/`; this QA pass added only this report and its proof JSON.

## Evidence

Server-focused tests passed:

```bash
NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js
```

Result: 83 tests passed, 0 failed.

Focused UI proof passed:

```bash
PW_PORT=4278 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022"
```

Result: 1 test passed.

Fresh proof observations from `FP-E2E-022`:

- Initial Expedition Map proof has exactly one mutation button: `fp-btn-scout-sector-cell_q0_r1`.
- Known and locked cells have no Scout Sector buttons.
- After Scout Sector reveal, the target is known and no Scout Sector buttons remain.
- Event Packet mutation buttons: `0`.
- Expedition Party action count: `0`.
- Packet plus party action count: `0`.
- `wildWestGenreDrift: false`.

## Guardrails

Confirmed:

- `expeditionMap.expeditionParty.readOnly === true`.
- `expeditionMap.expeditionParty.executableActions === []`.
- `eventPacket.partySnapshot.readOnly === true`.
- `eventPacket.partySnapshot.executableActions === []`.
- No operator assignment.
- No autonomous movement.
- No resource harvesting or resource deltas.
- No route/trade/economy creation.
- No combat.
- No background scheduler work.
- No public sharing.
- No Generated Universe rendering.
- No Atlas execution.
- No cross-plot mutation.
- No hidden autonomy or external effects.
- No Wild West/cowboy/saloon/gold-rush genre drift in the focused source/proof scan, aside from the test's forbidden-term regex.

## Additional Checks

Passed:

- `jq` parse and guardrail assertions for HQ12G backend/UI proof JSONs.
- `jq` parse for refreshed HQ12B/HQ12C/HQ12F/HQ12G UI proof JSONs.
- `node --check` for `server/founders_plot/engine.js`, `server/founders_plot/tools.js`, `public/experiences/founders-plot/founders-plot.js`, `e2e/200_founders_plot.spec.js`, and focused Founders Plot test files.
- `git diff --check` focused and workspace-wide.
- PNG inspection for refreshed HQ12G desktop/mobile screenshots.

Screenshots refreshed by the focused UI proof:

- `reports/agent-town-hq12g-expedition-party-flavor-ui-desktop-2026-05-31.png`
- `reports/agent-town-hq12g-expedition-party-flavor-ui-mobile-2026-05-31.png`

## Residual Risk

The full `npm test` suite was not run in this bounded lane. The shared branch was already dirty with many unrelated modified/untracked files; this pass did not clean or revert them.

Proof JSON:

- `reports/agent-town-post-hq12g-expedition-party-regression-qa-proof-2026-05-31.json`
