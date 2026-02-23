# Data Ingestion Scripts

This folder contains scripts to ingest project and agent metadata from external sources used by Hyperscape tooling.

## Prerequisites

- `bun` installed
- network access to APIs (`8004scan`, Agent0 Solana indexer, and Colosseum API)
- environment file in `packages/server/.env` when scripts need DB/API keys

Common variables (optional):
- `DATABASE_URL` or `POSTGRES_URL` (PostgreSQL scripts)
- `USE_LOCAL_POSTGRES` (set to `true` to auto-start local Postgres in Docker)
- `SOLANA_RPC_URL`, `INDEXER_URL`, `INDEXER_API_KEY` (Solana script)

## Scripts

### `pull-colosseum-agent-hackathon-projects.ts`

Pulls all entries from Colosseum hackathon projects API and optionally enriches each project with
`/projects/{slug}` details.

- Targets API base URL: `https://agents.colosseum.com/api`
- Outputs: JSON payload file with `source`, `query`, `stats`, and `projects`
- Optional SQLite upsert into `colosseum_agent_hackathon_projects`

Run:

```bash
cd /Users/robin/Projects/hyperscapeai/packages/server
bun scripts/pull-colosseum-agent-hackathon-projects.ts \
  --out colosseum-agent-hackathon-projects.json \
  --sqlite-path ./erc8004.sqlite3 \
  --limit 100
```

Options:
- `--out <path>` JSON output path
- `--sqlite-path <path>` optional SQLite upsert path
- `--dry-run` fetch only, no writes
- `--limit <n>` page size (max 100)
- `--start-offset <n>` start offset
- `--max-projects <n>` stop after N list rows (0 = unlimited)
- `--concurrency <n>` detail enrichment concurrency
- `--sort-by <human_upvotes|agent_upvotes|total|created_at>`
- `--order <asc|desc>`
- `--no-drafts` exclude draft projects
- `--skip-details` skip per-project detail fetch
- `--base-url <url>` override API base URL

Database output columns include:
- ids and slugs
- voting counts (`human_upvotes`, `agent_upvotes`, `total_upvotes`)
- owner/team metadata
- links/socials
- tags and timeline fields
- raw list/detail JSON snapshots and ingest timestamp

### `populate-erc8004-8004scan.ts`

Ingests ERC-8004 agent/chains metadata from `https://www.8004scan.io/api/v1` into Postgres.

```bash
cd /Users/robin/Projects/hyperscapeai/packages/server
bun scripts/populate-erc8004-8004scan.ts
```

Flags:
- `--dry-run`
- `--no-docker` skip Docker PostgreSQL auto-start flow
- `--database-url <url>` override database URL
- `--start-offset <n>`
- `--limit <n>` (max 100)
- `--chain-id <id>`
- `--testnet` or `--mainnet`
- `--max-agents <n>`

Writes to tables defined by server DB schema:
- `erc8004Chains`
- `erc8004Agents`

### `populate-erc8004-8004scan-sqlite.ts`

Same 8004scan source as above but writes to SQLite using `bun:sqlite`.

```bash
cd /Users/robin/Projects/hyperscapeai/packages/server
bun scripts/populate-erc8004-8004scan-sqlite.ts \
  --sqlite-path ./erc8004.sqlite3
```

Flags:
- `--sqlite-path <path>` (default `./erc8004.sqlite3`)
- `--dry-run`
- `--reset`
- `--start-offset <n>`
- `--limit <n>` (max 100)
- `--chain-id <id>`
- `--testnet` or `--mainnet`
- `--max-agents <n>`

Tables:
- `erc8004_chains`
- `erc8004_agents`

### `populate-erc8004-solana-devnet-sqlite.ts`

Ingests Solana ERC-8004 data via the official 8004 SDK (`8004-solana`) into SQLite.

```bash
cd /Users/robin/Projects/hyperscapeai/packages/server
bun scripts/populate-erc8004-solana-devnet-sqlite.ts \
  --sqlite-path ./erc8004.sqlite3
```

Notes:
- Cluster is fixed to `devnet` in this script.
- Uses `--skip-*` flags to control enrichment passes.
- Use `--sdk-logs` only if you need verbose SDK diagnostics.

Flags:
- `--sqlite-path <path>` (default `./erc8004.sqlite3`)
- `--dry-run`
- `--reset`
- `--start-offset <n>`
- `--limit <n>` (max 500)
- `--max-agents <n>`
- `--concurrency <n>`
- `--feedback-limit <n>` (0 = unlimited)
- `--agent-uri-timeout-ms <ms>`
- `--owner <pubkey>`
- `--collection <pubkey>`
- `--wallet <pubkey>`
- `--order-by <expr>` (default `created_at.desc`)
- `--rpc-url <url>`
- `--indexer-url <url>`
- `--indexer-api-key <key>`
- `--skip-onchain`
- `--skip-summary`
- `--skip-enriched`
- `--skip-reputation`
- `--skip-metadata`
- `--skip-feedbacks`
- `--skip-validations`
- `--skip-agent-uri`
- `--sdk-logs`

Tables:
- `erc8004_solana_network`
- `erc8004_solana_agents`
- `erc8004_solana_metadata`
- `erc8004_solana_feedbacks`
- `erc8004_solana_validations`
- `erc8004_solana_ingest_runs`

### `import_erc8004_preregister_houses.js`

Imports ERC-8004 identities into the app backend store as:
- preregistered houses
- anchor mappings (`erc8004Id -> houseId`)
- initial media slots (`media.shareHero`, `media.agentAvatar` when image data exists)
- respects `erc8004OptOut` tombstones (skips opted-out ERC-8004 IDs)

This is **not** part of the `populate-*` scripts.  
`populate-*` scripts only build cache/source databases (`erc8004.sqlite3`).  
`import_erc8004_preregister_houses.js` consumes those DBs and writes to backend store tables.

Run:

```bash
node scripts/import_erc8004_preregister_houses.js
```

Common flags:
- `--dry-run` (default behavior unless `--apply`)
- `--apply`
- `--source-sqlite <path>`
- `--store-path <path>`
- `--limit <n>`
- `--evm-only`
- `--solana-only`
- `--testnet-only`
- `--mainnet-only`
- `--solana-prefix <prefix>`
- `--reset-preregister`

Image flags:
- `--with-images`
- `--download-images-only` (prefetch/cache images only; no store writes)
- `--use-image-cache-only` (no network image fetches during import)
- `--image-cache-dir <path>`
- `--image-base-url <url>`
- `--image-timeout-ms <ms>`
- `--image-max-bytes <n>`
- `--image-concurrency <n>`
- `--image-retries <n>`
- `--dry-run` (explicit; default behavior unless `--apply`)

Recommended two-step image flow:

```bash
node scripts/import_erc8004_preregister_houses.js --download-images-only --with-images --image-cache-dir ./data/erc8004-image-cache
node scripts/import_erc8004_preregister_houses.js --with-images --use-image-cache-only --image-cache-dir ./data/erc8004-image-cache --apply
```

### `generate_erc8004_image_prompts.js`

Generates deterministic prompt inventories for storefront/share-hero image creation.

Outputs:
- JSONL records
- CSV table
- summary JSON with distribution + estimated cost brackets

Run:

```bash
node scripts/generate_erc8004_image_prompts.js \
  --scope missing-share-hero \
  --style-anchor-file ./scripts/style_anchor_agent_town_wild_west.txt \
  --out-basename ./data/erc8004-image-prompts-missing-share-hero
```

Common flags:
- `--sqlite-path <path>` source cache DB (default `./data/erc8004.sqlite3`)
- `--store-path <path>` backend store sqlite
- `--scope <all|missing-share-hero|missing-agent-avatar>`
- `--style-version <v>`
- `--style-anchor <text>`
- `--style-anchor-file <path>`
- `--solana-prefix <prefix>`
- `--candidates-per-agent <n>`
- `--estimated-unit-cost-usd <n>`
- `--out-basename <path>`

Prompt output includes stable mapping fields for post-generation ingest:
- `erc8004Id`
- `houseId`
- `outputFileBase`
- `outputFilename`
- `prompt`

### `export_auto_whisk_prompt_files.js`

Exports one-prompt-per-line `.txt` files tailored for Auto Whisk style/scene generation flows.

Worthy criteria:
- `x402_supported=true` OR `is_endpoint_verified=true` (from 8004scan API)

It joins those API rows against local pre-registered houses/anchors in the store and writes:
- worthy prompts (all, by-chain, and fixed-size batches)
- shared category prompts for non-worthy agents (one per chain family category)
- category mapping CSV for deterministic ingest later

Run:

```bash
node scripts/export_auto_whisk_prompt_files.js \
  --out-dir ./data/erc8004-whisk-prompts \
  --style-anchor-file ./scripts/style_anchor_agent_town_wild_west.txt \
  --batch-size 200
```

Common flags:
- `--store-path <path>`
- `--out-dir <path>`
- `--style-anchor-file <path>`
- `--style-anchor <text>`
- `--solana-prefix <prefix>`
- `--batch-size <n>`
- `--style-version <v>`
- `--api-base-url <url>`
- `--timeout-ms <n>`
- `--delay-ms <n>`
- `--include-existing-share-hero`
- `--max-worthy <n>`

Key outputs:
- `./data/erc8004-whisk-prompts/worthy/worthy-all.txt`
- `./data/erc8004-whisk-prompts/worthy/by-chain/*.txt`
- `./data/erc8004-whisk-prompts/worthy/by-chain/maps/*.map.jsonl` (line-number mapping for by-chain files)
- `./data/erc8004-whisk-prompts/worthy/batches/*.txt`
- `./data/erc8004-whisk-prompts/worthy/batches/*.map.jsonl` (line-number to output filename/house mapping)
- `./data/erc8004-whisk-prompts/worthy/worthy-manifest.jsonl`
- `./data/erc8004-whisk-prompts/shared/category-prompts.txt`
- `./data/erc8004-whisk-prompts/shared/by-category/*.txt`
- `./data/erc8004-whisk-prompts/shared/category-map.csv`
- `./data/erc8004-whisk-prompts/shared/shared-agent-manifest.jsonl` (expanded per-agent manifest for shared category images)
- `./data/erc8004-whisk-prompts/summary.json`

### `generate_nano_banana_images.js`

Generates image files from prompt manifests using Gemini image generation (Nano Banana compatible flow).

It supports two auth paths:
- `api-key` (Gemini API key)
- `oauth` (access token, refresh-token backend flow, or ADC command fallback)

Important:
- Auth mode does **not** change per-image API pricing.
- Use `--max-spend-usd` + `--unit-cost-usd` for budget guardrails.
- Default output is compatible with `ingest_generated_share_heroes.js`.

Run with API key:

```bash
export GEMINI_API_KEY='...'
node scripts/generate_nano_banana_images_api_key.js \
  --manifest ./data/erc8004-image-prompts-missing-share-hero.jsonl \
  --images-dir ./data/generated-share-heroes \
  --model gemini-2.5-flash-image \
  --concurrency 2 \
  --max-spend-usd 25
```

Run with OAuth refresh-token flow (backend-safe):

```bash
export GOOGLE_OAUTH_CLIENT_ID='...'
export GOOGLE_OAUTH_CLIENT_SECRET='...'
export GOOGLE_OAUTH_REFRESH_TOKEN='...'
export GOOGLE_CLOUD_PROJECT='your-gcp-project-id'
node scripts/generate_nano_banana_images_oauth.js \
  --manifest ./data/erc8004-image-prompts-missing-share-hero.jsonl \
  --images-dir ./data/generated-share-heroes \
  --model gemini-2.5-flash-image \
  --concurrency 2 \
  --max-spend-usd 25
```

OAuth fallback (ADC via gcloud command):

```bash
node scripts/generate_nano_banana_images_oauth.js \
  --oauth-token-command "gcloud auth application-default print-access-token" \
  --google-cloud-project your-gcp-project-id \
  --manifest ./data/erc8004-image-prompts-missing-share-hero.jsonl
```

Dry-run estimate:

```bash
node scripts/generate_nano_banana_images_oauth.js \
  --manifest ./data/erc8004-image-prompts-missing-share-hero.jsonl \
  --limit 100 \
  --unit-cost-usd 0.039 \
  --dry-run
```

Common flags:
- `--manifest <path>`
- `--images-dir <path>`
- `--reports-dir <path>`
- `--auth <api-key|oauth>`
- `--model <name>`
- `--aspect-ratio <1:1|3:4|4:3|9:16|16:9>`
- `--concurrency <n>`
- `--start-offset <n>`
- `--limit <n>`
- `--overwrite`
- `--dry-run`
- `--unit-cost-usd <n>`
- `--max-spend-usd <n>`
- `--timeout-ms <n>`
- `--max-retries <n>`
- `--retry-backoff-ms <n>`
- `--resolved-manifest <path>`

Auth-specific flags:
- API key: `--api-key <key>` (or `GEMINI_API_KEY`)
- OAuth direct token: `--oauth-access-token <token>`
- OAuth refresh flow: `--oauth-client-id`, `--oauth-client-secret`, `--oauth-refresh-token`
- OAuth command fallback: `--oauth-token-command <cmd>`
- OAuth quota project: `--google-cloud-project <id>`

Wrappers:
- `generate_nano_banana_images_api_key.js` (forces `--auth api-key`)
- `generate_nano_banana_images_oauth.js` (forces `--auth oauth`)

### `ingest_generated_share_heroes.js`

Applies generated images back into house media slots by mapping manifest `erc8004Id` -> house:
- writes `media.shareHero` (`source: generated`)
- mirrors legacy `publicMedia` for compatibility
- optional: `--set-agent-avatar-if-missing`

Run (dry-run):

```bash
node scripts/ingest_generated_share_heroes.js \
  --manifest ./data/erc8004-image-prompts-missing-share-hero.jsonl \
  --images-dir ./data/generated-share-heroes
```

Run (apply):

```bash
node scripts/ingest_generated_share_heroes.js \
  --manifest ./data/erc8004-image-prompts-missing-share-hero.jsonl \
  --images-dir ./data/generated-share-heroes \
  --apply
```

Image naming:
- preferred: exact `outputFilename` from manifest
- fallback: `<outputFileBase>.png|jpg|jpeg|webp`

### `remap_whisk_downloads.js`

Maps raw Auto Whisk download files into deterministic manifest filenames using batch/chain map files.

Run:

```bash
node scripts/remap_whisk_downloads.js \
  --map ./data/erc8004-whisk-prompts/worthy/batches/worthy-batch-0001.map.jsonl \
  --downloads-dir ~/Downloads/Whisk\ Downloads \
  --out-dir ./data/generated-share-heroes
```

Flags:
- `--order <mtime|name>` (default `mtime`)
- `--copy` (default is move)
- `--allow-partial`

### `run_erc8004_refresh_pipeline.sh`

Background-ready orchestration script for the full update loop:
1. refresh EVM source DB
2. refresh Solana source DB
3. checkpoint into `data/erc8004.sqlite3`
4. prefetch images
5. import preregistered houses
6. generate prompt lists (`missing-share-hero` + `all`)

Run:

```bash
./scripts/run_erc8004_refresh_pipeline.sh
```

Detailed runbook:
- `scripts/PIPELINE_ERC8004_BACKGROUND.md`

Default style anchor:
- `scripts/style_anchor_agent_town_wild_west.txt`
### `import-claimable-reservations.js`

Imports **claimable reservations** into the backend store from local cache DBs:
- Colosseum X-handle reservations (`kind: x`)
- ERC-8004 EVM owner-wallet reservations (`kind: erc8004`, `claimChain: evm`)
- ERC-8004 Solana owner-wallet reservations (`kind: erc8004`, `claimChain: solana`)

Designed for repeated runs (cron-safe):
- skips existing reservations
- skips IDs already known via existing reservations/claims/anchors
- skips already-claimed house IDs
- includes placeholder linked-house detection to avoid importing future platform-minted ERC-8004 entries already connected to a house

```bash
node scripts/import-claimable-reservations.js
```

Common flags:
- `--dry-run`
- `--store-path <path>` override backend store sqlite path
- `--include-drafts=true|false` include draft Colosseum entries (default true)
- `--skip-colosseum`
- `--skip-erc8004-evm`
- `--skip-erc8004-solana`
- `--colosseum-sqlite <path>`
- `--erc8004-evm-sqlite <path>`
- `--erc8004-solana-sqlite <path>`

## Common behavior

- Scripts emit progress logs and percent-style completion stats.
- All outputs are incremental upserts where possible; reruns can be used for refreshes.
- Use `--dry-run` to validate behavior before writing to files/DB.
- For large runs, keep default concurrency conservative and increase after a small smoke run.
