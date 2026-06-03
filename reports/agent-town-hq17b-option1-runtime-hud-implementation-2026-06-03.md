# AgentTown HQ17B Option 1 Runtime HUD Implementation

Date: 2026-06-03
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Status: `IMPLEMENTED_UNCOMMITTED`

## Scope

Implemented the HQ17A option-1 runtime direction for the Founders Plot Expedition Map panel:

- Map remains the dominant full-screen surface.
- Current map status, fog counts, and guided loop are now top-left HUD instruments on the map.
- Selected unit roster is now a bottom unit dock.
- Selected-unit commands render as a compact command puck above the dock.
- Selected sector context stays as a lower/right map instrument.
- Packet Plan/Review and outpost Next Scout cues stay short, map-native command surfaces.
- Receipts, proof, selected details, fog ledger, aliases, and revealed-sector details remain in the right-edge collapsed ledger drawer instead of primary panels.

## Files Edited

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `reports/agent-town-hq17b-option1-runtime-hud-implementation-2026-06-03.md`

## Implementation Notes

- Added HQ17B composition markers:
  - `fp-expedition-map-body--hq17b-option1`
  - `fp-expedition-map-panel--hq17b-option1`
  - `data-hud-instrument` values for crest/status, objective loop, selected context, unit dock, command puck, collapsed ledger, outpost context, Next Scout cue, and site context.
- Re-mounted existing visible Expedition Map status/objective/site surfaces onto the map board rather than the inspector stack.
- Left existing `data-testid` hooks, ARIA labels, titles, command IDs, endpoint handlers, idempotency keys, and authority/proof text intact.
- Reduced visible debug/proof text by keeping it in titles, ARIA labels, `details`, datasets, or the collapsed ledger.
- CSS-only runtime composition:
  - top-left compass crest plus compact fog/status chip cluster
  - top-left guided objective loop/Plan/Review rail
  - bottom-left unit dock
  - command puck near selected unit dock
  - lower/right selected-sector instrument
  - right-edge ledger rail that expands on hover/focus
  - mobile constraints to avoid horizontal overflow and massive stacked text blocks

## Authority Guardrails

No server, route, tool, schema, store, API, package, renderer source, renderer bundle, asset, e2e, proof PNG/JSON, or existing HQ16/HQ17A report changes were made for this lane.

The existing frontend command handlers remain the only executable paths:

- Scout Sector still uses the existing guarded Scout Sector handler/endpoint.
- Packet Plan still uses the existing guarded packet Site Plan handler/endpoint.
- Review still uses the existing guarded Site Plan review handler/endpoint.
- Convoy/Found commands still use existing guarded handlers/endpoints.
- Outpost Next Scout remains visual-only/read-only and exposes zero actions.

No Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, route/trade/economy/resource/reward/combat/scheduler expansion, cross-plot mutation, deploy, merge, push, commit, public share, or external effect happened.

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `git diff --check -- public/experiences/founders-plot/founders-plot.js public/experiences/founders-plot/founders-plot.css`
- `npm run build:founders-plot-threejs`

Final report-inclusive `git diff --check` is expected after this file is written.

## Residual Risk

No Playwright screenshot proof was run for HQ17B in this pass because the worktree already contains intentional generated HQ16Y/HQ16Z/HQ17A artifacts and the explicit write scope forbids editing proof PNGs/JSON or e2e files. The implementation is syntax/build clean, but visual screenshot QA remains the main follow-up risk before commit readiness.
