# Agent Town Sprite Cutout Repair Technique Pilot - 2026-05-31

## Scope

Recovery/review lane for Dalton's incomplete sprite cutout repair pilot. This report reviews candidate repaired copies only and does not apply any repair to runtime assets.

- Candidate directory: `reports/agent-town-sprite-cutout-repair-candidates-2026-05-31/`
- Existing proof JSON: `reports/agent-town-sprite-cutout-repair-technique-proof-2026-05-31.json`
- Existing proof contact sheet: `reports/agent-town-sprite-cutout-repair-technique-contact-sheet-2026-05-31.png`
- Source QA: `reports/agent-town-inhabitant-sprite-cutout-alpha-qa-2026-05-31.md` and `.json`
- Production assets under `public/` were not modified.

## Candidate Files

Six candidate PNGs exist. All are 2048x2048, 8-bit sRGB, `srgba 4.0`, `TrueColorAlpha`, matching their original runtime sheet dimensions/channels.

| Candidate | Original runtime asset | Feynman QA rank |
| --- | --- | --- |
| `workshop-specialist-v1.repaired.png` | `public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.png` | review |
| `market-trader-v1.repaired.png` | `public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.png` | review |
| `settler-convoy-crew-v1.repaired.png` | `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.png` | review |
| `pathfinder-scout-v1.repaired.png` | `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png` | review |
| `cohort-hall-coordinator-v1.repaired.png` | `public/experiences/founders-plot/assets/characters/inhabitants/cohort_hall_coordinator/cohort-hall-coordinator-v1.png` | review |
| `oracle-adjunct-v1.repaired.png` | `public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.png` | review |

Important mismatch: Dalton did not pilot the worst Feynman repair-recommended sheets (`builder-*`, `messenger-agentfolk-v1`, `worker-*`, `hauler-*`, `research-doctrine-keeper-v1`). The pilot instead covers six newer review-ranked assets, so it is not proof that the technique is ready for the highest-risk older sheets.

## Technique Evidence

Dalton's proof JSON describes the technique as "runtime-alpha-preserving edge residue removal plus guarded enclosed-hole fill from source". The JSON records large reductions in edge-adjacent artificial background pixels:

| Asset | Artificial-edge px before | after | removed edge px | filled hole px |
| --- | ---: | ---: | ---: | ---: |
| workshop-specialist-v1 | 18,239 | 1,362 | 21,015 | 372 |
| market-trader-v1 | 10,519 | 86 | 10,756 | 0 |
| settler-convoy-crew-v1 | 9,576 | 494 | 10,446 | 326 |
| pathfinder-scout-v1 | 248 | 198 | 378 | 27 |
| cohort-hall-coordinator-v1 | 5,895 | 450 | 6,595 | 3 |
| oracle-adjunct-v1 | 3,896 | 121 | 4,078 | 0 |

The contact sheet provides a before/after proof stack: original and candidate on transparency, plus original and candidate on a dark background. It shows obvious green/cyan edge cleanup on `workshop-specialist-v1`, `market-trader-v1`, `settler-convoy-crew-v1`, `cohort-hall-coordinator-v1`, and `oracle-adjunct-v1`. `pathfinder-scout-v1` has minimal visible benefit because the original already had low artificial-edge counts.

## Independent Checks

I independently decoded each candidate/original pair as RGBA and checked alpha, corners, borders, and visible-edge chroma classes. All six pairs keep hard alpha only (`alpha_min=0`, `alpha_max=255`, no semi-transparent visible pixels), and all six retain clean transparent corners and borders.

| Asset | Visible px before | after | visible delta | alpha changed | lost opaque px | gained opaque px | Main edge result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| workshop-specialist-v1 | 1,224,865 | 1,204,222 | -20,643 | 21,387 | 21,015 | 372 | green/cyan edge classes drop sharply |
| market-trader-v1 | 1,042,050 | 1,031,294 | -10,756 | 10,756 | 10,756 | 0 | green/cyan edge classes drop sharply |
| settler-convoy-crew-v1 | 1,355,663 | 1,345,543 | -10,120 | 10,772 | 10,446 | 326 | green/cyan edge classes drop sharply |
| pathfinder-scout-v1 | 952,659 | 952,308 | -351 | 405 | 378 | 27 | negligible improvement; magenta/green/cyan edge classes slightly increase |
| cohort-hall-coordinator-v1 | 1,534,136 | 1,527,544 | -6,592 | 6,598 | 6,595 | 3 | green drops, orange edge class increases |
| oracle-adjunct-v1 | 1,097,427 | 1,093,349 | -4,078 | 4,078 | 4,078 | 0 | green drops, orange edge class increases |

Visual review of the contact sheet does not show major silhouette collapse in the sampled first-frame proof. However, the repair changes opaque alpha on 4k to 21k pixels per sheet for five assets. Because these are opaque-pixel deletions rather than soft alpha refinements, the technique needs per-frame review before any runtime overwrite. The risk is especially clear for thin details: boots, straps, hair wisps, staff edges, cloak fringe, and tool outlines may be partially trimmed even when the dark-background preview looks cleaner.

## Asset-by-Asset Verdict

- `workshop-specialist-v1`: candidate is useful for parent visual review. It removes strong green/cyan fringing, but it also drops 20,643 visible pixels and fills 372 pixels of interior holes. Review all 16 frames before applying.
- `market-trader-v1`: candidate is one of the safer-looking outputs. It removes the green/cyan halo with no filled-hole additions, but still deletes 10,756 opaque pixels. Parent review recommended before runtime use.
- `settler-convoy-crew-v1`: candidate improves the edge halo, but 10,446 deleted opaque pixels plus 326 filled pixels require frame-by-frame checking, especially around hem/boots/hair.
- `pathfinder-scout-v1`: reject this candidate for application. The original had little measured residue, the visible benefit is minimal, and independent chroma classes slightly regress.
- `cohort-hall-coordinator-v1`: candidate is promising but not ready. Green drops, but orange-like edge pixels increase, so tuning or manual review is needed around warm clothing/gold trim.
- `oracle-adjunct-v1`: candidate is promising but not ready. Green drops substantially, but orange-like edge pixels increase; review cloak fringe, face/trim, and hand/document edges.

## Recommendation

Do not apply Dalton's candidates directly to production assets.

Recommendation: safe for parent visual review on `workshop-specialist-v1`, `market-trader-v1`, and `settler-convoy-crew-v1`; needs tuning for `cohort-hall-coordinator-v1` and `oracle-adjunct-v1`; reject `pathfinder-scout-v1` as not worth applying.

The technique itself is promising for green/cyan artificial-background cleanup, but this pilot is not sufficient for bulk repair. Before runtime asset replacement, run the technique on the actual Feynman repair-recommended worst offenders, generate full 16-frame before/after proof sheets, and require a small manual acceptance pass per sheet.

## Verification

- `magick identify reports/agent-town-sprite-cutout-repair-candidates-2026-05-31/*.png reports/agent-town-sprite-cutout-repair-technique-contact-sheet-2026-05-31.png`
- `magick identify -format '%f %m %[width]x%[height] channels=%[channels] type=%[type] depth=%z colorspace=%[colorspace]\n' ...`
- Independent RGBA alpha/edge script over six candidate/original pairs.
- `git diff --check -- reports/agent-town-sprite-cutout-repair-technique-pilot-2026-05-31.md reports/agent-town-sprite-cutout-repair-technique-proof-2026-05-31.json reports/agent-town-sprite-cutout-repair-technique-contact-sheet-2026-05-31.png reports/agent-town-sprite-cutout-repair-candidates-2026-05-31/`
