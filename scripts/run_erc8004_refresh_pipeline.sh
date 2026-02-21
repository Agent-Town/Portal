#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
UPSTREAM_SERVER_DIR="${UPSTREAM_SERVER_DIR:-/Users/robin/Projects/hyperscapeai/packages/server}"
TMP_SQLITE_PATH="${TMP_SQLITE_PATH:-/tmp/erc8004-refresh.sqlite3}"
TARGET_SQLITE_PATH="${TARGET_SQLITE_PATH:-$ROOT_DIR/data/erc8004.sqlite3}"
STORE_PATH="${STORE_PATH:-$ROOT_DIR/data/store.sqlite}"
IMAGE_CACHE_DIR="${IMAGE_CACHE_DIR:-$ROOT_DIR/data/erc8004-image-cache}"
SOLANA_PREFIX="${SOLANA_PREFIX:-solana-devnet}"
STYLE_VERSION="${STYLE_VERSION:-v1}"
STYLE_ANCHOR_FILE="${STYLE_ANCHOR_FILE:-$ROOT_DIR/scripts/style_anchor_agent_town_wild_west.txt}"
GEN_CANDIDATES_PER_AGENT="${GEN_CANDIDATES_PER_AGENT:-1}"
ESTIMATED_UNIT_COST_USD="${ESTIMATED_UNIT_COST_USD:-0.042}"
RUN_STAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
LOG_DIR="${LOG_DIR:-$ROOT_DIR/data/ingest-runs}"
LOG_FILE="$LOG_DIR/erc8004-refresh-$RUN_STAMP.log"

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*" | tee -a "$LOG_FILE"
}

log "START run_stamp=$RUN_STAMP"
log "UPSTREAM_SERVER_DIR=$UPSTREAM_SERVER_DIR"
log "TMP_SQLITE_PATH=$TMP_SQLITE_PATH"
log "TARGET_SQLITE_PATH=$TARGET_SQLITE_PATH"
log "STORE_PATH=$STORE_PATH"
log "IMAGE_CACHE_DIR=$IMAGE_CACHE_DIR"
log "SOLANA_PREFIX=$SOLANA_PREFIX"
log "STYLE_ANCHOR_FILE=$STYLE_ANCHOR_FILE"

if [[ ! -d "$UPSTREAM_SERVER_DIR" ]]; then
  log "ERROR upstream server dir missing: $UPSTREAM_SERVER_DIR"
  exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
  log "ERROR bun not found in PATH"
  exit 1
fi

log "STEP 1/7 refresh EVM into temp sqlite"
(
  cd "$UPSTREAM_SERVER_DIR"
  bun scripts/populate-erc8004-8004scan-sqlite.ts --sqlite-path "$TMP_SQLITE_PATH" --reset
) | tee -a "$LOG_FILE"

log "STEP 2/7 refresh Solana into temp sqlite"
(
  cd "$UPSTREAM_SERVER_DIR"
  bun scripts/populate-erc8004-solana-devnet-sqlite.ts --sqlite-path "$TMP_SQLITE_PATH" --reset
) | tee -a "$LOG_FILE"

log "STEP 3/7 checkpoint temp sqlite into Portal source sqlite"
node <<'JS' "$TMP_SQLITE_PATH" "$TARGET_SQLITE_PATH"
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const src = process.argv[2];
const dst = process.argv[3];
if (!fs.existsSync(src)) throw new Error(`TMP_SQLITE_NOT_FOUND:${src}`);
fs.mkdirSync(require('path').dirname(dst), { recursive: true });
try { fs.rmSync(dst, { force: true }); } catch {}
const esc = (s) => s.replace(/'/g, "''");
const db = new DatabaseSync(src);
db.exec(`VACUUM INTO '${esc(dst)}'`);
db.close();
console.log(`VACUUM_INTO_OK src=${src} dst=${dst}`);
JS

log "STEP 4/7 prefetch images (download-only)"
(
  cd "$ROOT_DIR"
  node scripts/import_erc8004_preregister_houses.js \
    --download-images-only \
    --with-images \
    --image-cache-dir "$IMAGE_CACHE_DIR"
) | tee -a "$LOG_FILE"

log "STEP 5/7 import preregistered houses from cache"
(
  cd "$ROOT_DIR"
  STORE_PATH="$STORE_PATH" node scripts/import_erc8004_preregister_houses.js \
    --with-images \
    --use-image-cache-only \
    --image-cache-dir "$IMAGE_CACHE_DIR" \
    --reset-preregister \
    --apply
) | tee -a "$LOG_FILE"

log "STEP 6/7 generate prompts for missing share-hero images"
(
  cd "$ROOT_DIR"
  STORE_PATH="$STORE_PATH" node scripts/generate_erc8004_image_prompts.js \
    --scope missing-share-hero \
    --solana-prefix "$SOLANA_PREFIX" \
    --style-version "$STYLE_VERSION" \
    --style-anchor-file "$STYLE_ANCHOR_FILE" \
    --candidates-per-agent "$GEN_CANDIDATES_PER_AGENT" \
    --estimated-unit-cost-usd "$ESTIMATED_UNIT_COST_USD" \
    --out-basename "$ROOT_DIR/data/erc8004-image-prompts-missing-share-hero"
) | tee -a "$LOG_FILE"

log "STEP 7/7 generate prompts for all agents"
(
  cd "$ROOT_DIR"
  STORE_PATH="$STORE_PATH" node scripts/generate_erc8004_image_prompts.js \
    --scope all \
    --solana-prefix "$SOLANA_PREFIX" \
    --style-version "$STYLE_VERSION" \
    --style-anchor-file "$STYLE_ANCHOR_FILE" \
    --candidates-per-agent "$GEN_CANDIDATES_PER_AGENT" \
    --estimated-unit-cost-usd "$ESTIMATED_UNIT_COST_USD" \
    --out-basename "$ROOT_DIR/data/erc8004-image-prompts-all"
) | tee -a "$LOG_FILE"

log "COMPLETE run_stamp=$RUN_STAMP log_file=$LOG_FILE"
