# AgentTown HQ15A Expedition Units Read Model

Date: 2026-06-02

## Verdict

PASS - HQ15A adds a server-owned, read-only Expedition Map unit roster that can be rendered as selectable map tokens in the next UI slice.

## What changed

- Added `expeditionMap.units` to the server Expedition Map read model.
- The roster projects existing named Expedition Party members into map-token units:
  - `scout` for Mira Trailmark.
  - `courier` for Rook Signalpost.
  - `field_support` for Vale-Desk 7.
- Settlement claims that already exist in server truth can project as `settler_convoy` or `outpost_crew` tokens.
- Each unit has a server-owned `location`, `unitType`, `state`, visual asset references where available, `commandHints`, and boundary flags.
- Scout units expose a `scout_sector` command hint tied to the existing `et.plot.scout_sector` mutation. Other command hints are inspect/ledger previews only.
- Movement is intentionally not implemented in this slice. Every unit reports `movementMutationImplemented: false` and `canMove: false`.

## Authority Boundary

This is read-model groundwork for gameplay UI, not new autonomy.

- No new movement route or movement mutation.
- No autonomous movement.
- No operator assignment.
- No resource harvesting or resource deltas.
- No route, trade, economy, reward, combat, scheduler, or background behavior.
- No Atlas execution, public sharing, Generated Universe rendering, cross-plot mutation, external effects, deploy, merge, commit, or push.
- Scout Sector remains the only current Expedition Map mutation path.

## Files

- `server/founders_plot/engine.js`
- `server/founders_plot/tools.js`
- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-contract.test.js`
- `specs/02_api_contract.md`

## Verification

- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/tools.js`
- `node --check tests-founders-plot/fp-unit.test.js`
- `node --check tests-founders-plot/fp-contract.test.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js`
- `git diff --check`

## Next Slice

HQ15B should consume `expeditionMap.units` in the Three.js renderer and Founders Plot UI:

- draw unit tokens on the map from server `location`;
- allow selecting units;
- show a compact unit command bar;
- keep movement as preview/disabled until a later server-authoritative movement slice exists.
