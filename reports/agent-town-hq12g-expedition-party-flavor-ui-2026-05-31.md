# AgentTown HQ12G Expedition Party Flavor UI

Date: 2026-05-31

## Verdict

Complete as a small read-only Founders Plot Expedition Map presentation polish.

HQ12G adds a deterministic "field party" flavor block to the selected sector and Event Packet surfaces. It derives from the existing Expedition Event Packet receipt fields (`operatorNote`, `scoutId`, `cellId`, `receiptLink`) plus existing named scout/operator presentation copy (`Mira Trailmark`, `Vale-Desk 7`). It adds no gameplay authority.

## Scope

- Added presentation-only Expedition Party helper logic in `public/experiences/founders-plot/founders-plot.js`.
- Added compact responsive styling in `public/experiences/founders-plot/founders-plot.css`.
- Extended the focused HQ12 Expedition Map Playwright proof in `e2e/200_founders_plot.spec.js`.
- Wrote proof screenshots:
  - `reports/agent-town-hq12g-expedition-party-flavor-ui-desktop-2026-05-31.png`
  - `reports/agent-town-hq12g-expedition-party-flavor-ui-mobile-2026-05-31.png`
- Wrote proof JSON:
  - `reports/agent-town-hq12g-expedition-party-flavor-ui-proof-2026-05-31.json`

## Boundary

- Scout Sector remains the only mutation path.
- Event packets and party flavor remain read-only receipt/read-model presentation.
- The party block has `data-actions="0"` and no buttons.
- No server, route, store, engine, scheduler, Atlas, Generated Universe rendering, public sharing, route/trade, resource, combat, cross-plot, or external-effect changes were made.
- Tone stays cozy-civilization unknown-world expedition; no Wild West/cowboy/saloon/gold-rush cues were added.

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `PW_PORT=4265 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022"`
- `node -e` JSON parse and guardrail assertion for `reports/agent-town-hq12g-expedition-party-flavor-ui-proof-2026-05-31.json`
- `git diff --check -- public/experiences/founders-plot/founders-plot.js public/experiences/founders-plot/founders-plot.css e2e/200_founders_plot.spec.js`
- `file` inspection of desktop/mobile screenshots

Proof JSON guardrails:

- `scoutSectorOnlyMutationPath: true`
- `packetActions: 0`
- `partyActions: 0`
- `packetPartyActions: 0`
- `atlasExecution: false`
- `publicSharing: false`
- `generatedUniverseRendering: false`
- `routeTrade: false`
- `resourceMutation: false`
- `combat: false`
- `hiddenAutonomy: false`
- `wildWestGenreDrift: false`
