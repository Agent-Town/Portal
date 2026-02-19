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
