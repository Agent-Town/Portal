# Agent Town HQ14C Runtime Region Consistency Fix

Date: 2026-06-01
Lane: HQ14C runtime region consistency fix
Verdict: PASS

## Scope

HQ14C fixes the blocking HQ14B findings before Robin plays the Expedition Map again.

This lane changes the runtime Expedition Map presentation and focused proof harness only. It does not change server authority, routes, store, tools, Scout Sector behavior, Atlas behavior, gameplay resources, scheduler behavior, public sharing, Generated Universe rendering, or external effects.

Robin's product constraint is kept as a hard gate: the long-term game should be UI-driven, not text-driven. This pass moves the Expedition Map toward visual affordances for fog state, selected sector, receipt trace, Scout Sector eligibility, and party context while keeping longer authority copy behind audit details.

## Runtime Fixes

- Removed landmark leakage from `locked_unknown` cells. Locked cells now render as sealed fog/silhouette only, with no ruin cue and no signal cue.
- Gated river/water visuals to explicit server-owned water or river terrain text. The current proof fixture has no water cells, so `waterCueCells` is empty.
- Moved ruin/signal art behind explicit known/discovered `ruin_signal` terrain text.
- Replaced hinted-cell mast/landmark art with abstract fog-edge mist, dashed eligibility language, and non-specific scout affordance treatment.
- Added runtime `regionConsistency` proof metadata for locked-cell sealing, hinted abstract treatment, water cue gating, and per-cell terrain mapping.
- Improved map-first UI framing: full-width map surface, compact fog pips, selected-sector summary chips, receipt trace chips, party badges, zoom/reset controls, and authority copy moved into collapsible audit details.

## Review-Only GPT Image 2 Atlas

The HQ14A generated terrain/fog atlas was copied into the repo as review media only:

- `reports/media/agent-town-hq14a-region-faithful-terrain-fog-atlas-2026-06-01/agent-town-hq14a-region-faithful-terrain-fog-atlas-1024-review.png`

It is not wired into runtime, not promoted as a visual-pack asset, and not used by the renderer yet. Future asset-promotion work still needs slot manifests, provenance, crop checks, and region/fog-state binding before runtime use.

## Proof Artifacts

- Desktop screenshot: `reports/agent-town-hq14c-runtime-region-consistency-fix-desktop-2026-06-01.png`
- Mobile screenshot: `reports/agent-town-hq14c-runtime-region-consistency-fix-mobile-2026-06-01.png`
- Contact sheet: `reports/agent-town-hq14c-runtime-region-consistency-fix-contact-sheet-2026-06-01.png`
- Proof JSON: `reports/agent-town-hq14c-runtime-region-consistency-fix-proof-2026-06-01.json`
- Prior failing QA report: `reports/agent-town-hq14b-region-visual-consistency-qa-2026-06-01.md`

## Key Proof Results

- `visualShell`: `hq14c_runtime_region_consistency_v1`
- `lockedUnknownCellsSealed`: true
- `hintedCellsAbstract`: true
- `waterCuesRequireServerOwnedWater`: true
- `waterCueCells`: []
- `ruinSignalCueCells`: []
- `scoutSectorOnlyMutationPath`: true
- `clientAuthority`: false

Sampled tile colors now stay visually distinct at meaningful thresholds:

- Desktop known woodland to hinted fog: passes `> 18`
- Desktop hinted fog to locked unknown: passes `> 22`
- Mobile known woodland to hinted fog: passes `> 16`
- Mobile hinted fog to locked unknown: passes `> 20`

## Verification

Passed:

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium --reporter=line`
- `npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022" --reporter=line`
- `jq empty reports/agent-town-hq14b-region-visual-consistency-qa-proof-2026-06-01.json`
- `jq empty reports/agent-town-hq14c-runtime-region-consistency-fix-proof-2026-06-01.json`
- `magick identify` on HQ14A atlas and HQ14C screenshots
- `git diff --check`

Notes:

- Playwright emitted existing SQLite experimental and `NO_COLOR` / `FORCE_COLOR` warnings only.
- One failed proof run exposed the HUD pointer-interception bug; the runtime layout was adjusted so the canvas remains the primary clickable surface.

## Guardrails

- Scout Sector remains the only current Expedition Map mutation path.
- Event Packet, Expedition Party, Current focus, selected-sector receipts, and map HUD surfaces remain read-only except the existing eligible Scout Sector action.
- No hidden resources, routes, jobs, timers, rewards, packet actions, party actions, Atlas execution, public sharing, Generated Universe rendering, hidden autonomy, cross-plot mutation, external effects, route/trade/economy behavior, combat behavior, scheduler behavior, or Wild West genre drift were added.
