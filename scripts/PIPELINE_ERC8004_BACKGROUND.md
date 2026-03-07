# ERC-8004 Background Refresh Pipeline

This runbook documents the end-to-end update flow for:
- refreshing ERC-8004 source data (EVM + Solana),
- downloading/caching profile images,
- importing preregistered houses into Portal store,
- generating prompt lists for new share-hero image creation,
- estimating generation costs.

## One-command runner

```bash
cd /Users/robin/.codex/worktrees/d83e/Portal
./scripts/run_erc8004_refresh_pipeline.sh
```

Default behavior:
1. `populate-erc8004-8004scan-sqlite.ts` -> temp SQLite (`/tmp/erc8004-refresh.sqlite3`)
2. `populate-erc8004-solana-devnet-sqlite.ts` -> same temp SQLite
3. checkpoints temp DB into `data/erc8004.sqlite3`
4. prefetches images to `data/erc8004-image-cache`
5. imports preregistered houses to `data/store.sqlite`
6. generates prompt list for `missing-share-hero`
7. generates prompt list for `all`

Logs:
- `data/ingest-runs/erc8004-refresh-<UTCSTAMP>.log`

## Environment overrides

```bash
UPSTREAM_SERVER_DIR=/path/to/packages/server \
TMP_SQLITE_PATH=/tmp/erc8004-refresh.sqlite3 \
TARGET_SQLITE_PATH=/Users/robin/.codex/worktrees/d83e/Portal/data/erc8004.sqlite3 \
STORE_PATH=/Users/robin/.codex/worktrees/d83e/Portal/data/store.sqlite \
IMAGE_CACHE_DIR=/Users/robin/.codex/worktrees/d83e/Portal/data/erc8004-image-cache \
SOLANA_PREFIX=solana-devnet \
STYLE_VERSION=v1 \
STYLE_ANCHOR_FILE=/Users/robin/.codex/worktrees/d83e/Portal/scripts/style_anchor_agent_town_wild_west.txt \
GEN_CANDIDATES_PER_AGENT=1 \
ESTIMATED_UNIT_COST_USD=0.042 \
./scripts/run_erc8004_refresh_pipeline.sh
```

## Output artifacts

Source and store:
- `data/erc8004.sqlite3`
- `data/store.sqlite`

Prompt lists:
- `data/erc8004-image-prompts-missing-share-hero.jsonl`
- `data/erc8004-image-prompts-missing-share-hero.csv`
- `data/erc8004-image-prompts-missing-share-hero-summary.json`
- `data/erc8004-image-prompts-all.jsonl`
- `data/erc8004-image-prompts-all.csv`
- `data/erc8004-image-prompts-all-summary.json`

Style anchor default:
- `scripts/style_anchor_agent_town_wild_west.txt`

Generated prompt records include:
- `erc8004Id`
- `houseId`
- `outputFileBase`
- `outputFilename`
- `prompt`

## Scheduling recommendation

Use a daily run at low-traffic hours (UTC) and keep the operation idempotent:
- refresh source DBs each run,
- prefetch images incrementally (cache reuses existing assets),
- reset + re-import preregistered rows for clean state.

Example cron (daily 02:10 UTC):

```bash
10 2 * * * cd /Users/robin/.codex/worktrees/d83e/Portal && ./scripts/run_erc8004_refresh_pipeline.sh
```

## Health checks (post-run)

1. Validate source counts in `data/erc8004.sqlite3`:
   - `erc8004_agents` > 0
   - `erc8004_solana_agents` > 0
2. Validate import counts in `data/store.sqlite`:
   - houses and anchors increased/updated.
3. Validate prompt artifacts exist and summary JSON has non-zero prompts.
4. Spot-check `/api/atlas/districts` and `/api/leaderboard`.

## Post-generation ingest (Nano Banana outputs)

Place generated images in a folder (example):
- `data/generated-share-heroes/`

Use filenames matching prompt manifest `outputFilename` (preferred), or `<outputFileBase>.<ext>`.

Dry-run:

```bash
node scripts/ingest_generated_share_heroes.js \
  --manifest ./data/erc8004-image-prompts-missing-share-hero.jsonl \
  --images-dir ./data/generated-share-heroes
```

Apply:

```bash
node scripts/ingest_generated_share_heroes.js \
  --manifest ./data/erc8004-image-prompts-missing-share-hero.jsonl \
  --images-dir ./data/generated-share-heroes \
  --apply
```

## Image generation auth paths (same pricing, different credential model)

API key path:

```bash
export GEMINI_API_KEY='...'
node scripts/generate_nano_banana_images_api_key.js \
  --manifest ./data/erc8004-image-prompts-missing-share-hero.jsonl \
  --images-dir ./data/generated-share-heroes \
  --max-spend-usd 25
```

OAuth path (refresh-token backend flow):

```bash
export GOOGLE_OAUTH_CLIENT_ID='...'
export GOOGLE_OAUTH_CLIENT_SECRET='...'
export GOOGLE_OAUTH_REFRESH_TOKEN='...'
export GOOGLE_CLOUD_PROJECT='your-gcp-project-id'
node scripts/generate_nano_banana_images_oauth.js \
  --manifest ./data/erc8004-image-prompts-missing-share-hero.jsonl \
  --images-dir ./data/generated-share-heroes \
  --max-spend-usd 25
```

Budget guardrails:
- `--unit-cost-usd <n>` planning price per image
- `--max-spend-usd <n>` hard stop for scheduled generations
- `--dry-run` estimate only

## Cost model

Prompt generation list includes deterministic cost estimates:
- `estimatedImages = promptCount * candidatesPerAgent`
- `estimatedCost = estimatedImages * unitCost`

Current script defaults:
- `ESTIMATED_UNIT_COST_USD=0.042` (GPT Image 1 medium, 1024x1024)

Summary files also include a low/medium/high bracket using:
- low: `0.011`
- medium: `0.042`
- high: `0.167`

Adjust `ESTIMATED_UNIT_COST_USD` to your actual provider contract.

## Current observed run snapshot (2026-02-21 UTC)

Source ingest:
- EVM agents imported (paged rows): `38890`
- EVM unique agents in DB: `38868`
- EVM chains: `43`
- Solana agents: `162`

Image prefetch:
- candidates: `39030`
- image targets: `19025`
- unique image URLs: `5100`
- fetched (new): `46`
- disk cache hits: `2378`
- failures: `2676`

Import:
- houses added: `39030`
- anchors added: `39030`
- houses with cached image: `3849`

Prompt inventory:
- missing-share-hero prompts: `35181`
- all prompts: `39030`

Cost at 1 candidate per agent (from summary files):
- missing-share-hero (35181):
  - low: `$386.99`
  - medium: `$1477.60`
  - high: `$5875.23`
- all (39030):
  - low: `$429.33`
  - medium: `$1639.26`
  - high: `$6518.01`

Multiply linearly for multi-candidate generation:
- 2 candidates: cost x2
- 3 candidates: cost x3
