# Agent Town Sprite Cutout Repair Acceptance Review - 2026-05-31

## Scope

Acceptance review for Dalton's sprite cutout repair pilot candidates. This pass compares current runtime sprite sheets against repaired candidate copies only; no production assets were overwritten.

- Candidate directory: `reports/agent-town-sprite-cutout-repair-candidates-2026-05-31/`
- Existing QA context: `reports/agent-town-sprite-cutout-repair-technique-pilot-2026-05-31.md`
- Existing proof JSON: `reports/agent-town-sprite-cutout-repair-technique-proof-2026-05-31.json`
- Existing proof contact sheet: `reports/agent-town-sprite-cutout-repair-technique-contact-sheet-2026-05-31.png`
- Acceptance proof sheet: `reports/agent-town-sprite-cutout-repair-acceptance-review-contact-sheet-2026-05-31.png`

The acceptance proof sheet rows are alphabetical by candidate id. Each row shows: original on checker, repaired on checker, original on dark, repaired on dark.

## Decisions

| Candidate | Decision | Rationale |
| --- | --- | --- |
| `workshop-specialist-v1.repaired.png` | Accept for later production promotion slice | Strong visible cleanup of green/cyan background residue on outlines and between close details. The repaired sheet keeps frame-to-frame posture and silhouette consistent in the proof. The 372 filled-hole pixels and 21,015 removed residue pixels make this worth a final per-frame zoom review before overwrite, but no obvious detail collapse appears in the acceptance sheet. |
| `market-trader-v1.repaired.png` | Accept for later production promotion slice | Best-looking candidate in the pilot. Edge halo is substantially reduced, no filled interior holes were recorded, and the repaired frames remain consistent across stance/walk/item poses. No obvious magenta/background residue remains on the dark proof. |
| `settler-convoy-crew-v1.repaired.png` | Accept for later production promotion slice | Clear improvement to pale/green edge residue while preserving the readable cloak, boots, packs, barrel, and kneeling frames. Because 326 enclosed-hole pixels were filled and over 10k opaque pixels were removed, promote only with the other accepted pilot sheets and keep a quick manual zoom check around hair, coat fringe, and cargo edges. |
| `pathfinder-scout-v1.repaired.png` | Reject | The original had very little measured residue and the repaired copy gives minimal visual benefit. Existing QA also recorded slight chroma-class regression, with 27 filled-hole pixels and 378 removed pixels. The promotion slice should not risk a low-gain overwrite for this sheet. |
| `cohort-hall-coordinator-v1.repaired.png` | Tune | The repair removes the green cutout halo, but the proof still reads slightly warm/ragged in places and existing QA recorded an orange-edge increase. The robot frames are broadly consistent, so this is close, but it should be tuned or manually touched up around gold trim, antenna/tool edges, and small gaps before production promotion. |
| `oracle-adjunct-v1.repaired.png` | Tune | The green residue cleanup is useful and frame consistency is mostly intact, but the repair can make cloak/trim edges look a little harsher on dark backgrounds. Existing QA recorded an orange-edge increase, so tune around cloak fringe, hands/document edges, and facial/hood trim before promotion. |

## Promotion Slice

Visually acceptable for a later bounded production promotion slice:

- `workshop-specialist-v1.repaired.png`
- `market-trader-v1.repaired.png`
- `settler-convoy-crew-v1.repaired.png`

Hold for tuning:

- `cohort-hall-coordinator-v1.repaired.png`
- `oracle-adjunct-v1.repaired.png`

Do not promote:

- `pathfinder-scout-v1.repaired.png`

## Notes

All six candidates match the 2048x2048 sheet contract from the earlier proof and keep hard alpha. The accepted set is visually better on dark backgrounds and does not show obvious holes, magenta/background residue, major edge chewing, detail loss, or inconsistent frame treatment in the acceptance proof. The accepted sheets still deserve a final zoomed visual signoff immediately before any runtime copy because the repair removes opaque pixels rather than softening alpha.

This pilot does not cover the older highest-risk repair-recommended sheets, so it should not be treated as approval for bulk automatic repair.

## Verification

- `identify reports/agent-town-sprite-cutout-repair-acceptance-review-contact-sheet-2026-05-31.png`
- `jq empty reports/agent-town-sprite-cutout-repair-technique-proof-2026-05-31.json`
- `git diff --check -- reports/agent-town-sprite-cutout-repair-acceptance-review-2026-05-31.md reports/agent-town-sprite-cutout-repair-acceptance-review-contact-sheet-2026-05-31.png`
