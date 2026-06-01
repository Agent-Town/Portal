# Agent Town HQ13M Generated Asset QA Harness

Date: 2026-06-01
Lane: HQ13M generated asset QA harness/report
Verdict: PASS_WITH_PARTIAL_CURRENT_INPUT

## Scope

This lane adds a reports-only helper harness for reviewing HQ13K candidate-02 generated asset batches under `reports/media`.

It does not approve, move, promote, load, render, or mutate generated assets. It does not inspect runtime asset directories. It reads a review folder, compares PNG files against the eight-slot HQ13L rubric, and emits JSON for follow-up visual review.

## Harness

Run from the repository root:

```sh
node reports/agent-town-hq13m-generated-asset-qa-harness-2026-06-01.mjs --pretty reports/media/agent-town-hq13k-candidate-02-gpt-image-2-review-assets-2026-06-01
```

If no directory argument is provided, the harness defaults to:

```text
reports/media/agent-town-hq13k-candidate-02-gpt-image-2-review-assets-2026-06-01
```

The harness refuses to inspect paths outside `reports/media`, which keeps it away from runtime asset directories and pack loaders.

## What It Checks

- Expected HQ13L slot IDs and dimensions for the eight candidate-02 review assets.
- File existence by canonical filename plus observed HQ13K source/review-alpha filename variants.
- PNG header dimensions, bit depth, color type, channel count, alpha-channel presence, and `tRNS` transparency marker presence.
- SHA-256 digest for each PNG it reads.
- Corner alpha for non-interlaced 8-bit RGBA or grayscale-alpha processed review PNGs, using only Node built-ins.
- Per-slot `pass` or `warn` status.

## What It Does Not Prove

- It does not judge visual taste, text/logo leakage, hidden-truth leakage, Wild West drift, gameplay implication, or mobile readability. Those still require human visual review against the HQ13L rubric.
- It does not validate a visual-pack manifest or runtime loader.
- It does not prove an image is runtime-ready; this is review-only QA.
- It does not resize, crop, alpha-clean, copy, delete, or rewrite any generated asset.

## Current Run

Command run:

```sh
node reports/agent-town-hq13m-generated-asset-qa-harness-2026-06-01.mjs --pretty reports/media/agent-town-hq13k-candidate-02-gpt-image-2-review-assets-2026-06-01
```

Observed summary at run time:

- Expected slots: 8
- PNG files found: 10
- Present slots: 5
- Missing slots: 3
- Processed alpha files found: 5
- Source files found: 5
- Unmatched PNG files: 0
- Harness status: `warn`
- Harness verdict: `PARTIAL_OR_WARN_REVIEW_INPUT`

The partial input is expected while HQ13K generation is still in progress. Present slots were:

- `expedition_map.fog.hinted`
- `expedition_map.fog.locked_unknown`
- `expedition_map.fog.frontier_border`
- `expedition_map.marker.known_site_plan`
- `expedition_map.marker.hinted_unknown`

For all five present slots, the processed alpha PNGs parsed as 8-bit RGBA and had transparent alpha on all four corners. The current files are still dimension warnings, because the observed generated/review-alpha PNG dimensions are larger than the final HQ13L slot dimensions.

## Guardrails

- Reports-only harness/report/proof.
- No runtime asset promotion.
- No runtime pack directory or loader.
- No HQ13K image edits, moves, or cleanup.
- No app/source/server/store/routes/tools/schema/validator edits.
- No Atlas execution.
- No public sharing.
- No real Generated Universe rendering.
- No hidden autonomy, route/trade/economy/resource/combat/scheduler/cross-plot/external effects.
- Scout Sector remains the only current Expedition Map mutation path.

## Verification

- `node --check reports/agent-town-hq13m-generated-asset-qa-harness-2026-06-01.mjs`
- `node reports/agent-town-hq13m-generated-asset-qa-harness-2026-06-01.mjs --pretty reports/media/agent-town-hq13k-candidate-02-gpt-image-2-review-assets-2026-06-01`
- `jq empty reports/agent-town-hq13m-generated-asset-qa-harness-proof-2026-06-01.json`
- `git diff --check -- reports/agent-town-hq13m-generated-asset-qa-harness-2026-06-01.mjs reports/agent-town-hq13m-generated-asset-qa-harness-2026-06-01.md reports/agent-town-hq13m-generated-asset-qa-harness-proof-2026-06-01.json`
