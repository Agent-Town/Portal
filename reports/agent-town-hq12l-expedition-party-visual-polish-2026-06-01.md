# Agent Town HQ12L Expedition Party Visual Polish

Date: 2026-06-01

## Scope

Polished the Founders Plot Expedition Party presentation inside the Expedition Map / Event Packet UI without adding any party actions or mutation paths.

## Changes

- Updated the party presentation to render only from server-owned `expeditionMap.expeditionParty` and `eventPacket.partySnapshot` data.
- Removed the frontend-invented static party fallback from the rendered model.
- Added a compact read-only roster strip showing party member names and roles as receipt/evidence flavor.
- Kept Event Packet and Expedition Party surfaces buttonless and read-only.
- Extended FP-E2E-022 coverage for party names, roles, zero packet buttons, zero party buttons, and mobile no-overflow proof.

## Artifacts

- Proof JSON: `reports/agent-town-hq12l-expedition-party-visual-polish-proof-2026-06-01.json`
- Desktop screenshot: `reports/agent-town-hq12l-expedition-party-visual-polish-desktop-2026-06-01.png`
- Mobile screenshot: `reports/agent-town-hq12l-expedition-party-visual-polish-mobile-2026-06-01.png`

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js` passed.
- `node --check e2e/200_founders_plot.spec.js` passed.
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022"` passed.
- `jq empty reports/agent-town-hq12l-expedition-party-visual-polish-proof-2026-06-01.json` passed.
- `magick identify` passed for both HQ12L screenshots.
- `git diff --check -- public/experiences/founders-plot/founders-plot.js public/experiences/founders-plot/founders-plot.css e2e/200_founders_plot.spec.js reports/agent-town-hq12l-expedition-party-visual-polish-2026-06-01.md reports/agent-town-hq12l-expedition-party-visual-polish-proof-2026-06-01.json reports/agent-town-hq12l-expedition-party-visual-polish-desktop-2026-06-01.png reports/agent-town-hq12l-expedition-party-visual-polish-mobile-2026-06-01.png` passed.

## Guardrails

- No server, store, engine, route, tool, or spec changes.
- No party management, assignments, movement, resources, route/trade hooks, combat, scheduler/background behavior, public sharing, Generated Universe rendering, Atlas execution, cross-plot mutation, hidden autonomy, or external effects.
- Scout Sector remains the only Expedition Map mutation path.
