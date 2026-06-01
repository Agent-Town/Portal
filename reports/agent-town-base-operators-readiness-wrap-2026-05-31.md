# AgentTown Base Operators Readiness Wrap - 2026-05-31

## Scope

Closed the base-building operator asset-readiness loop for the four earliest Founders Plot surfaces that previously relied on generic builder/worker/hauler visuals:

- `FARM_PLOT` / `farmer` / Mira Seedhand
- `QUARRY` / `quarry_mason` / Bram Stonecalm
- `LUMBER_CAMP` / `lumber_worker` / Jun Timberline
- `HQ` / `hq_civic_operator` / Vale-Desk 7

This wrap is proof and status only. It does not wire the roles into scene projection and does not change gameplay authority.

## Verdict

All four base operators are asset-ready as repo-owned visual-only inhabitants.

Each operator now has:

- generated opaque source PNG
- copied source PNG
- alpha-cleaned runtime PNG
- JSON metadata sidecar
- prompt sidecar
- integration report
- proof image and row-strip proof

## Proofs

Combined contact sheet:

- `reports/agent-town-base-operators-readiness-contact-sheet-2026-05-31.png`

Machine-readable proof:

- `reports/agent-town-base-operators-readiness-wrap-2026-05-31.json`

Individual reports:

- `reports/agent-town-base-operator-farmer-sprite-integration-2026-05-31.md`
- `reports/agent-town-base-operator-quarry-mason-sprite-integration-2026-05-31.md`
- `reports/agent-town-base-operator-lumber-worker-sprite-integration-2026-05-31.md`
- `reports/agent-town-base-operator-hq-civic-operator-sprite-integration-2026-05-31.md`

## Checks

Passed in this wrap:

- `jq` metadata read across all four operators
- ImageMagick identify across all four runtime PNGs
- contact-sheet identify: `2048x1024 sRGB srgb 3.0 8`
- Jun focused validation: JSON parse, image identify, scene-state tests 8/8, focused `git diff --check`

## Boundary

All four operators remain asset-ready only. A later bounded scene-wiring slice can map real `FARM_PLOT`, `QUARRY`, `LUMBER_CAMP`, and `HQ` production/readiness/receipt state to these roles if Robin wants that runtime change.

This wrap intentionally does not add scene actors, change server projection, alter resource math, add scheduling, modify rewards, execute Atlas proposals, create public effects, or change route/trade/generated-universe behavior.
