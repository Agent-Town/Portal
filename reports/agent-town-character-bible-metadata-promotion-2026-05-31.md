# AgentTown Character Bible Metadata Promotion

Date: 2026-05-31
Workspace: `/Users/robin/Projects/Portal-atlas-editor`
Lane: bounded JSON/prompt/report metadata only

## Summary

Promoted runtime inhabitant character-bible material from prompt sidecars into canonical JSON sidecars for the older runtime-wired roles whose metadata was sparse. No PNGs, gameplay, server authority, Atlas logic, routes, scene wiring, or generated bundles were changed.

## Files Touched

- `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.json`
  - Added `title`, `backstory`, `personality`, `authorityBoundary`, and `relationships`.
  - Promoted Rigger Slate from a display-name/description-only builder into a named frontier machinefolk field-builder with explicit visual-only construction authority.

- `public/experiences/founders-plot/assets/characters/inhabitants/worker/kettle-37-worker-v1.json`
  - Added `displayName`, `title`, `backstory`, `personality`, `authorityBoundary`, and `relationships`.
  - Promoted the prompt origin story about the old assay-office service automaton rewired by the rescued AI agent to learn workshop recipes.

- `public/experiences/founders-plot/assets/characters/inhabitants/hauler/oona-tallpack-hauler-v1.json`
  - Added `displayName`, `title`, `backstory`, `personality`, `authorityBoundary`, and `relationships`.
  - Promoted the Dust Comet caravan freight-runner story and tied Oona's hauling role to finished server-side output, without granting resource authority.

- `public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.json`
  - Added `displayName`, `title`, `backstory`, `personality`, `authorityBoundary`, and `relationships`.
  - Promoted Rook Signalpost as the current named messenger for approval, reward, and quest facts, distinct from the older generic messenger sheet.

- `public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json`
  - Added `displayName`, `title`, `backstory`, `personality`, `authorityBoundary`, and `relationships`.
  - Promoted Mira Trailmark as the named Expedition Board pathfinder scout, with visual-only boundaries for `SCOUT` and `SCOUT_REPORT_READY`.

- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.prompt.md`
  - Reconciled the prompt-side character name from `Tava Ridgekit` to `Luma Reedbarrel`.
  - This follows the current runtime metadata truth in `settler-convoy-crew-v1.json`, where `displayName` is already `Luma Reedbarrel`.

- `reports/agent-town-character-bible-metadata-promotion-2026-05-31.md`
  - Added this bounded lane report.

## Conflict Decisions

- `settler` naming conflict: resolved in the prompt sidecar by using `Luma Reedbarrel`, matching the current JSON sidecar and runtime role identity. `Tava Ridgekit` no longer appears in the settler prompt sidecar.

- `trader` versus `market_trader` namespace conflict: left for product decision. Current runtime truth is the `trader` namespace with `Maro Tallyseed`; `trader/market-trader-v1.json` already carries `canonicalRoleId: "trader"` and `aliases: ["market_trader"]`. The older duplicate `market_trader/market-trader-v1` remains a Pip Vale asset-ready duplicate, not the preferred runtime market role. I did not rewrite Pip into Maro because that would collapse a distinct character asset without a product decision.

## Validation

Commands run:

```sh
jq empty public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.json public/experiences/founders-plot/assets/characters/inhabitants/worker/kettle-37-worker-v1.json public/experiences/founders-plot/assets/characters/inhabitants/hauler/oona-tallpack-hauler-v1.json public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.json public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json
git diff --check -- public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.json public/experiences/founders-plot/assets/characters/inhabitants/worker/kettle-37-worker-v1.json public/experiences/founders-plot/assets/characters/inhabitants/hauler/oona-tallpack-hauler-v1.json public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.json public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.prompt.md public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.json public/experiences/founders-plot/assets/characters/inhabitants/market_trader/market-trader-v1.json reports/agent-town-character-bible-metadata-promotion-2026-05-31.md
```

Result: both passed with no output. For untracked sidecars/report, I also ran `git diff --no-index --check /dev/null <file>` to catch whitespace errors before Git has an index baseline; those checks also produced no output.
