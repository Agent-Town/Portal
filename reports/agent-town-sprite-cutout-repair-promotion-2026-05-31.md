# Agent Town Sprite Cutout Repair Promotion - 2026-05-31

## Scope

Promoted only the three sprite cutout repairs accepted in Hopper's acceptance review. This was a visual alpha cleanup promotion only; no gameplay, server, scene authority, metadata, or wiring files were intentionally changed.

Acceptance source:

- `reports/agent-town-sprite-cutout-repair-acceptance-review-2026-05-31.md`
- `reports/agent-town-sprite-cutout-repair-technique-pilot-2026-05-31.md`

Accepted candidate sources promoted:

- `reports/agent-town-sprite-cutout-repair-candidates-2026-05-31/workshop-specialist-v1.repaired.png`
- `reports/agent-town-sprite-cutout-repair-candidates-2026-05-31/market-trader-v1.repaired.png`
- `reports/agent-town-sprite-cutout-repair-candidates-2026-05-31/settler-convoy-crew-v1.repaired.png`

Explicitly not promoted:

- `reports/agent-town-sprite-cutout-repair-candidates-2026-05-31/pathfinder-scout-v1.repaired.png`
- `reports/agent-town-sprite-cutout-repair-candidates-2026-05-31/cohort-hall-coordinator-v1.repaired.png`
- `reports/agent-town-sprite-cutout-repair-candidates-2026-05-31/oracle-adjunct-v1.repaired.png`

## Runtime Promotions

| Accepted repair | Runtime target |
| --- | --- |
| `workshop-specialist-v1.repaired.png` | `public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.png` |
| `market-trader-v1.repaired.png` | `public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.png` |
| `market-trader-v1.repaired.png` | `public/experiences/founders-plot/assets/characters/inhabitants/market_trader/market-trader-v1.png` |
| `settler-convoy-crew-v1.repaired.png` | `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.png` |

The `market_trader` alias existed at promotion time, so it was kept in sync with the canonical `trader` runtime sheet.

## Rollback Copies

Before overwriting runtime PNGs, original report-only copies were created under:

- `reports/agent-town-sprite-cutout-repair-promotion-originals-2026-05-31/workshop-specialist-v1.original.png`
- `reports/agent-town-sprite-cutout-repair-promotion-originals-2026-05-31/market-trader-v1.original.png`
- `reports/agent-town-sprite-cutout-repair-promotion-originals-2026-05-31/market-trader-v1.market_trader-alias.original.png`
- `reports/agent-town-sprite-cutout-repair-promotion-originals-2026-05-31/settler-convoy-crew-v1.original.png`

Rollback is a straight PNG copy from the matching original file back to the runtime path.

## Proof Artifacts

- Before/after checker and dark contact proof: `reports/agent-town-sprite-cutout-repair-promotion-contact-sheet-2026-05-31.png`
- Dimension, checksum, and corner-alpha proof JSON: `reports/agent-town-sprite-cutout-repair-promotion-proof-2026-05-31.json`

The proof JSON records SHA-256 equality between every promoted runtime PNG and its accepted repaired candidate:

| Runtime id | Runtime matches accepted candidate |
| --- | --- |
| `workshop_runtime` | yes |
| `market_trader_runtime` | yes |
| `market_trader_alias_runtime` | yes |
| `settler_runtime` | yes |

Transparent-corner samples for all promoted runtime PNGs read `srgb(0,0,0)` from an alpha-extracted image at all four corners, meaning alpha value 0 at each sampled corner.

## Validation

Commands run:

- `magick identify public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.png public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.png public/experiences/founders-plot/assets/characters/inhabitants/market_trader/market-trader-v1.png public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.png reports/agent-town-sprite-cutout-repair-promotion-contact-sheet-2026-05-31.png`
- `jq '.promoted_pairs, [.records[] | {id, path, identify, corner_alpha_samples}]' reports/agent-town-sprite-cutout-repair-promotion-proof-2026-05-31.json`
- `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js`
- `git diff --check -- public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.png public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.png public/experiences/founders-plot/assets/characters/inhabitants/market_trader/market-trader-v1.png public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.png reports/agent-town-sprite-cutout-repair-promotion-2026-05-31.md reports/agent-town-sprite-cutout-repair-promotion-proof-2026-05-31.json reports/agent-town-sprite-cutout-repair-promotion-contact-sheet-2026-05-31.png reports/agent-town-sprite-cutout-repair-promotion-originals-2026-05-31/`

Results:

- All promoted runtime PNGs identify as 2048x2048 PNG, 8-bit sRGB.
- Contact proof identifies as PNG, 1024x864.
- Proof JSON is valid and records candidate/runtime SHA-256 matches for all four runtime files.
- `fp-scene-state.test.js` passed: 8 tests, 0 failures.
- `git diff --check` passed on the touched promotion files.

## Boundary Note

This promotion only replaces accepted sprite PNG alpha-cleanup outputs at existing runtime paths. It does not alter gameplay behavior, server authority, scene-state projection, Atlas data, or metadata.
