# AgentTown HQ15K - Arrived Settler Unit Command Browser Proof

Generated: 2026-06-02 02:28 +07

## Verdict

PASS. The browser proof now exercises the `Found Outpost` command from an arrived Settler Convoy map unit, not only from the older settlement-claim panel.

## What Changed

- Expanded the existing Expedition Map UI proof fixture with an arrived `settler_convoy` map unit.
- Added a mocked existing `found-settlement` route assertion for the unit command path.
- The proof selects the Settler Convoy token, checks the command bar, clicks `Found Outpost`, and verifies the payload keeps using the existing claim endpoint shape.

## Guardrails

- No runtime source behavior changed in this lane; the implementation already existed from HQ15I.
- The browser proof asserts the unit command payload does not add `unitId` or route-creation fields.
- The command calls the existing `POST /api/founders-plot/found-settlement` endpoint.
- No new server mutation path, client authority, route/trade/economy/resource/reward/combat/scheduler behavior, Atlas execution, public sharing, Generated Universe runtime expansion, cross-plot mutation, hidden autonomy, hidden-truth leakage, or external effects were added.

## Verification

- `node --check e2e/200_founders_plot.spec.js`
- `git diff --check -- e2e/200_founders_plot.spec.js`
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022"` - 1/1

## Notes

The first rerun failed only because the proof still expected four unit tokens. The fixture intentionally has five after adding the arrived Settler Convoy, so the assertion now requires both `surveyor` and `settler_convoy` unit tokens.
