# AgentTown HQ16N Paperwork-To-Play Primary Surface Sweep

Date: 2026-06-02
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Base checkpoint: `c5e823a Add AgentTown prepare-convoy map bridge`

## Verdict

PASS. This bounded sweep found remaining paperwork wording in the Expedition Map primary objective/guided-loop path, mostly around Scout-result packet/proof/receipt language, visible packet names on marker/detail cards, and a mocked `guarded endpoint` recommended-next string in the HQ16M bridge proof.

The implemented slice keeps the player-facing path map-native:

- Scout-result objective mode now renders as `marker` / `MRK`, not a packet task.
- Objective copy now says a map marker is ready and points the player to the next map step.
- Guided-loop visible labels use `Marker` and `FX` style outcome language instead of packet/receipt wording.
- Server event-packet names are adapted for display as map markers (`Ridge Lantern marker`) while packet ids, receipt ids, data attributes, aria/title audit context, and proof JSON remain intact.
- Scout-result visible copy now reads as a map outcome, with fog-count/audit detail tucked inside a collapsed `Details` drawer.
- Collapsed objective detail summary now says `Details`, while full audit provenance remains in hidden detail/title/aria/data/proof contexts.
- HQ16M focused proof now asserts the primary objective strip, selected unit command bar, and command outcome/preview surfaces do not visibly contain `guarded endpoint`, `approval`, `review`, `packet`, or `proof`.

## Changed Files

- `public/experiences/founders-plot/founders-plot.js`
- `e2e/200_founders_plot.spec.js`
- `e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js`
- `reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-proof-2026-06-02.json`
- `reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-2026-06-02-desktop.png`
- `reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-2026-06-02-mobile.png`
- `reports/agent-town-hq16n-paperwork-to-play-primary-surface-2026-06-02.md`
- `reports/agent-town-hq16n-paperwork-to-play-primary-surface-proof-2026-06-02.json`

## Proof

Focused Playwright proof:

```bash
npx playwright test e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js --project=chromium --grep "FP-E2E-022M"
```

Result: 1/1 passed.

Focused syntax/format proof:

```bash
node --check public/experiences/founders-plot/founders-plot.js
node --check e2e/200_founders_plot.spec.js
node --check e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js
jq . reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-proof-2026-06-02.json
jq . reports/agent-town-hq16n-paperwork-to-play-primary-surface-proof-2026-06-02.json
git diff --check
```

Result: all passed.

Primary surface captured by the proof after Prepare Convoy:

```text
FOCUS / CNV / ... / CMD Marker / FX Convoy / NXT Marker / DETAILS
▣ CNV / Inspect / 0 -> / WAIT
Rolling
```

Primary surface captured by the proof after convoy arrival:

```text
FOCUS / CNV / ... / CMD Found / FX Found / NXT Found / DETAILS
▣ CNV / Found / CLAIM / 0 -> / WAIT
Founded
```

The proof guardrail `primarySurfacePaperworkHidden` is `true`.

## Guardrails

Held. This slice changed frontend copy and focused e2e/report/proof only. No server route, API payload, tool action, mutation authority, Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, route/trade/economy/resource/reward/combat/scheduler/cross-plot behavior, external effect, deploy, merge, push, public share, or commit was added.

Existing guarded endpoints remain the only command execution path. Audit details are still preserved in collapsed detail/title/aria/data/proof contexts.
