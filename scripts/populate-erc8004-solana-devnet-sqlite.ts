#!/usr/bin/env bun
/**
 * Populate a SQLite3 database with Solana devnet ERC-8004 data via the official 8004 Solana SDK.
 *
 * This script ingests as much metadata as practical:
 * - agent listings from indexer-backed SDK search
 * - on-chain account enrichment (loadAgent / summary / enriched summary)
 * - metadata entries, feedback records, validations
 * - registry/ATOM program IDs and ingest run bookkeeping
 *
 * Usage:
 *   bun scripts/populate-erc8004-solana-devnet-sqlite.ts
 *
 * Options:
 *   --sqlite-path <path>      SQLite file path (default: ./erc8004.sqlite3)
 *   --dry-run                 Fetch only (no DB writes)
 *   --reset                   Clear existing erc8004_solana_* tables before import
 *   --start-offset <n>        Resume pagination at offset n (default: 0)
 *   --limit <n>               Page size (default: 100)
 *   --max-agents <n>          Stop after importing n agents (debug; 0 = unlimited)
 *   --concurrency <n>         Concurrent per-agent enrichment workers (default: 5)
 *   --feedback-limit <n>      Max feedback rows per agent (default: 2000; 0 = no limit)
 *   --owner <pubkey>          Filter by owner pubkey
 *   --collection <pubkey>     Filter by collection pubkey
 *   --wallet <pubkey>         Filter by agent wallet pubkey
 *   --order-by <expr>         Indexer sort (default: created_at.desc)
 *   --rpc-url <url>           Override Solana RPC URL
 *   --indexer-url <url>       Override indexer URL
 *   --indexer-api-key <key>   Override indexer API key
 *   --skip-onchain            Skip on-chain loadAgent enrichment
 *   --skip-summary            Skip getSummary enrichment
 *   --skip-enriched           Skip getEnrichedSummary enrichment
 *   --skip-reputation         Skip indexer reputation enrichment
 *   --skip-metadata           Skip metadata table ingestion
 *   --skip-feedbacks          Skip feedback table ingestion
 *   --skip-validations        Skip validations table ingestion
 *   --skip-agent-uri          Skip fetching/decoding agent URI JSON files
 *   --sdk-logs                Enable internal 8004 SDK logs
 */

import { Database } from "bun:sqlite";
import {
  ATOM_ENGINE_PROGRAM_ID,
  PROGRAM_ID,
  SolanaSDK,
  type AgentAccount,
  type IndexedAgent,
  type IndexedAgentReputation,
  type IndexedFeedback,
  type IndexedMetadata,
  type IndexedValidation,
} from "8004-solana";
import { configureLogger } from "8004-solana/dist/utils/logger.js";
import { PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";

type SolanaAgentSummaryLike = {
  averageScore: number;
  totalFeedbacks: number;
  nextFeedbackIndex: number;
  positiveCount: number;
  negativeCount: number;
};

type SolanaEnrichedSummaryLike = {
  trustTier: number;
  qualityScore: number;
  confidence: number;
  riskScore: number;
  diversityRatio: number;
  uniqueCallers: number;
  emaScoreFast: number;
  emaScoreSlow: number;
  volatility: number;
};

type IngestedAgentBundle = {
  listed: IndexedAgent;
  onchain: AgentAccount | null;
  summary: SolanaAgentSummaryLike | null;
  enrichedSummary: SolanaEnrichedSummaryLike | null;
  reputation: IndexedAgentReputation | null;
  metadata: IndexedMetadata[];
  feedbacks: IndexedFeedback[];
  validations: IndexedValidation[];
  registrationJson: unknown | null;
  registrationSourceUrl: string | null;
  errors: string[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v ? v : null;
}

function parseIntArg(args: string[], flag: string, fallback: number): number {
  const idx = args.indexOf(flag);
  if (idx < 0) return fallback;
  const raw = args[idx + 1];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function parseStringArg(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  if (idx < 0) return null;
  return nonEmptyString(args[idx + 1]);
}

function boolToInt(value: boolean | null | undefined): number | null {
  if (typeof value !== "boolean") return null;
  return value ? 1 : 0;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function stringOrNull(value: unknown): string | null {
  return nonEmptyString(value);
}

function bigintToString(value: bigint | null | undefined): string | null {
  if (typeof value !== "bigint") return null;
  return value.toString();
}

function toHex(value: Uint8Array | null | undefined): string | null {
  if (!value) return null;
  if (!(value instanceof Uint8Array)) return null;
  return Buffer.from(value).toString("hex");
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value, (_key, v) => {
    if (typeof v === "bigint") return v.toString();
    if (v instanceof PublicKey) return v.toBase58();
    if (v instanceof Uint8Array) return Buffer.from(v).toString("base64");
    if (Buffer.isBuffer(v)) return v.toString("base64");
    if (v instanceof Date) return v.toISOString();
    return v;
  });
}

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function parsePublicKeyOrNull(value: string | null): PublicKey | null {
  if (!value) return null;
  try {
    return new PublicKey(value);
  } catch {
    return null;
  }
}

async function retry<T>(fn: () => Promise<T>, attempts = 4, baseBackoffMs = 300): Promise<T> {
  let lastError: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const backoff = Math.min(8000, baseBackoffMs * 2 ** i);
      await sleep(backoff);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, () =>
    (async () => {
      for (;;) {
        const idx = cursor++;
        if (idx >= items.length) break;
        results[idx] = await worker(items[idx], idx);
      }
    })(),
  );
  await Promise.all(workers);
  return results;
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
        "user-agent": "hyperscapeai/erc8004-solana-ingest-sqlite",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function uriCandidates(uri: string): string[] {
  const trimmed = uri.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return [trimmed];
  if (trimmed.startsWith("ipfs://")) {
    const suffix = trimmed.slice("ipfs://".length).replace(/^ipfs\//, "");
    if (!suffix) return [];
    return [
      `https://ipfs.io/ipfs/${suffix}`,
      `https://gateway.pinata.cloud/ipfs/${suffix}`,
      `https://cloudflare-ipfs.com/ipfs/${suffix}`,
    ];
  }
  if (trimmed.startsWith("ar://")) {
    const suffix = trimmed.slice("ar://".length);
    if (!suffix) return [];
    return [`https://arweave.net/${suffix}`];
  }
  return [];
}

async function fetchRegistrationJson(
  uri: string | null,
  timeoutMs: number,
): Promise<{ json: unknown; sourceUrl: string } | null> {
  if (!uri) return null;
  const candidates = uriCandidates(uri);
  for (const candidate of candidates) {
    try {
      const json = await fetchJsonWithTimeout(candidate, timeoutMs);
      return { json, sourceUrl: candidate };
    } catch {
      // Try the next gateway/candidate.
    }
  }
  return null;
}

function ensureSchema(db: Database): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS erc8004_solana_network (
      cluster TEXT PRIMARY KEY NOT NULL,
      rpc_url TEXT,
      indexer_url TEXT,
      registry_program_id TEXT NOT NULL,
      atom_engine_program_id TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS erc8004_solana_agents (
      asset TEXT PRIMARY KEY NOT NULL,
      cluster TEXT NOT NULL,
      owner TEXT,
      collection TEXT,
      agent_uri TEXT,
      agent_wallet TEXT,
      nft_name TEXT,
      atom_enabled INTEGER,
      trust_tier INTEGER,
      quality_score REAL,
      confidence REAL,
      risk_score REAL,
      diversity_ratio REAL,
      feedback_count INTEGER,
      raw_avg_score REAL,
      sort_key TEXT,
      block_slot INTEGER,
      tx_signature TEXT,
      created_at TEXT,
      updated_at TEXT,
      onchain_owner TEXT,
      onchain_collection TEXT,
      onchain_agent_wallet TEXT,
      onchain_atom_enabled INTEGER,
      onchain_feedback_count TEXT,
      onchain_response_count TEXT,
      onchain_revoke_count TEXT,
      onchain_feedback_digest TEXT,
      onchain_response_digest TEXT,
      onchain_revoke_digest TEXT,
      summary_total_feedbacks INTEGER,
      summary_average_score REAL,
      summary_positive_count INTEGER,
      summary_negative_count INTEGER,
      summary_next_feedback_index INTEGER,
      enriched_trust_tier INTEGER,
      enriched_quality_score REAL,
      enriched_confidence REAL,
      enriched_risk_score REAL,
      enriched_diversity_ratio REAL,
      enriched_unique_callers INTEGER,
      enriched_ema_score_fast REAL,
      enriched_ema_score_slow REAL,
      enriched_volatility REAL,
      reputation_feedback_count INTEGER,
      reputation_avg_score REAL,
      reputation_positive_count INTEGER,
      reputation_negative_count INTEGER,
      reputation_validation_count INTEGER,
      metadata_count INTEGER NOT NULL DEFAULT 0,
      feedbacks_count INTEGER NOT NULL DEFAULT 0,
      validations_count INTEGER NOT NULL DEFAULT 0,
      registration_source_url TEXT,
      registration_json TEXT,
      indexed_json TEXT NOT NULL,
      onchain_json TEXT,
      summary_json TEXT,
      enriched_summary_json TEXT,
      reputation_json TEXT,
      errors_json TEXT NOT NULL DEFAULT '[]',
      fetched_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_erc8004_solana_agents_owner
      ON erc8004_solana_agents(owner);
    CREATE INDEX IF NOT EXISTS idx_erc8004_solana_agents_wallet
      ON erc8004_solana_agents(agent_wallet);
    CREATE INDEX IF NOT EXISTS idx_erc8004_solana_agents_collection
      ON erc8004_solana_agents(collection);
    CREATE INDEX IF NOT EXISTS idx_erc8004_solana_agents_updated_at
      ON erc8004_solana_agents(updated_at);
    CREATE INDEX IF NOT EXISTS idx_erc8004_solana_agents_trust_tier
      ON erc8004_solana_agents(trust_tier);

    CREATE TABLE IF NOT EXISTS erc8004_solana_metadata (
      id TEXT PRIMARY KEY NOT NULL,
      asset TEXT NOT NULL,
      key TEXT NOT NULL,
      key_hash TEXT,
      value TEXT,
      immutable INTEGER,
      block_slot INTEGER,
      tx_signature TEXT,
      created_at TEXT,
      updated_at TEXT,
      source_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_erc8004_solana_metadata_asset_key
      ON erc8004_solana_metadata(asset, key);
    CREATE INDEX IF NOT EXISTS idx_erc8004_solana_metadata_asset
      ON erc8004_solana_metadata(asset);

    CREATE TABLE IF NOT EXISTS erc8004_solana_feedbacks (
      id TEXT PRIMARY KEY NOT NULL,
      asset TEXT NOT NULL,
      client_address TEXT NOT NULL,
      feedback_index TEXT NOT NULL,
      value TEXT,
      value_decimals INTEGER,
      score INTEGER,
      tag1 TEXT,
      tag2 TEXT,
      endpoint TEXT,
      feedback_uri TEXT,
      running_digest TEXT,
      feedback_hash TEXT,
      is_revoked INTEGER NOT NULL DEFAULT 0,
      revoked_at TEXT,
      block_slot INTEGER,
      tx_signature TEXT,
      created_at TEXT,
      source_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_erc8004_solana_feedbacks_asset_client_index
      ON erc8004_solana_feedbacks(asset, client_address, feedback_index);
    CREATE INDEX IF NOT EXISTS idx_erc8004_solana_feedbacks_asset
      ON erc8004_solana_feedbacks(asset);
    CREATE INDEX IF NOT EXISTS idx_erc8004_solana_feedbacks_client
      ON erc8004_solana_feedbacks(client_address);

    CREATE TABLE IF NOT EXISTS erc8004_solana_validations (
      id TEXT PRIMARY KEY NOT NULL,
      asset TEXT NOT NULL,
      validator_address TEXT NOT NULL,
      nonce INTEGER NOT NULL,
      requester TEXT,
      request_uri TEXT,
      request_hash TEXT,
      response INTEGER,
      response_uri TEXT,
      response_hash TEXT,
      tag TEXT,
      status TEXT,
      block_slot INTEGER,
      tx_signature TEXT,
      created_at TEXT,
      updated_at TEXT,
      source_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_erc8004_solana_validations_asset_validator_nonce
      ON erc8004_solana_validations(asset, validator_address, nonce);
    CREATE INDEX IF NOT EXISTS idx_erc8004_solana_validations_asset
      ON erc8004_solana_validations(asset);
    CREATE INDEX IF NOT EXISTS idx_erc8004_solana_validations_validator
      ON erc8004_solana_validations(validator_address);

    CREATE TABLE IF NOT EXISTS erc8004_solana_ingest_runs (
      run_id TEXT PRIMARY KEY NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL,
      cluster TEXT NOT NULL,
      rpc_url TEXT,
      indexer_url TEXT,
      options_json TEXT NOT NULL,
      agents_seen INTEGER NOT NULL DEFAULT 0,
      agents_written INTEGER NOT NULL DEFAULT 0,
      metadata_written INTEGER NOT NULL DEFAULT 0,
      feedbacks_written INTEGER NOT NULL DEFAULT 0,
      validations_written INTEGER NOT NULL DEFAULT 0,
      error_text TEXT
    );
  `);
}

function onchainCoreFields(agent: AgentAccount | null): {
  onchainOwner: string | null;
  onchainCollection: string | null;
  onchainAgentWallet: string | null;
  onchainAtomEnabled: number | null;
  onchainFeedbackCount: string | null;
  onchainResponseCount: string | null;
  onchainRevokeCount: string | null;
  onchainFeedbackDigest: string | null;
  onchainResponseDigest: string | null;
  onchainRevokeDigest: string | null;
} {
  if (!agent) {
    return {
      onchainOwner: null,
      onchainCollection: null,
      onchainAgentWallet: null,
      onchainAtomEnabled: null,
      onchainFeedbackCount: null,
      onchainResponseCount: null,
      onchainRevokeCount: null,
      onchainFeedbackDigest: null,
      onchainResponseDigest: null,
      onchainRevokeDigest: null,
    };
  }

  return {
    onchainOwner: agent.getOwnerPublicKey().toBase58(),
    onchainCollection: agent.getCollectionPublicKey().toBase58(),
    onchainAgentWallet: agent.getAgentWalletPublicKey()?.toBase58() || null,
    onchainAtomEnabled: boolToInt(agent.isAtomEnabled()),
    onchainFeedbackCount: bigintToString(agent.feedback_count),
    onchainResponseCount: bigintToString(agent.response_count),
    onchainRevokeCount: bigintToString(agent.revoke_count),
    onchainFeedbackDigest: toHex(agent.feedback_digest),
    onchainResponseDigest: toHex(agent.response_digest),
    onchainRevokeDigest: toHex(agent.revoke_digest),
  };
}

async function enrichAgentBundle(
  sdk: SolanaSDK,
  listed: IndexedAgent,
  options: {
    includeOnchain: boolean;
    includeSummary: boolean;
    includeEnrichedSummary: boolean;
    includeReputation: boolean;
    includeMetadata: boolean;
    includeFeedbacks: boolean;
    includeValidations: boolean;
    includeAgentUriJson: boolean;
    feedbackLimit: number;
    agentUriTimeoutMs: number;
  },
): Promise<IngestedAgentBundle> {
  const errors: string[] = [];
  const asset = listed.asset;
  const assetPubkey = parsePublicKeyOrNull(asset);

  let onchain: AgentAccount | null = null;
  let summary: SolanaAgentSummaryLike | null = null;
  let enrichedSummary: SolanaEnrichedSummaryLike | null = null;
  let reputation: IndexedAgentReputation | null = null;
  let metadata: IndexedMetadata[] = [];
  let feedbacks: IndexedFeedback[] = [];
  let validations: IndexedValidation[] = [];
  let registrationJson: unknown | null = null;
  let registrationSourceUrl: string | null = null;

  const indexer = sdk.getIndexerClient();

  const promises: Array<Promise<void>> = [];

  if (options.includeOnchain && assetPubkey) {
    promises.push(
      retry(() => sdk.loadAgent(assetPubkey), 3)
        .then((v) => {
          onchain = v;
        })
        .catch((err) => errors.push(`loadAgent: ${formatError(err)}`)),
    );
  }

  if (options.includeSummary && assetPubkey) {
    promises.push(
      retry(() => sdk.getSummary(assetPubkey), 3)
        .then((v) => {
          summary = {
            averageScore: v.averageScore,
            totalFeedbacks: v.totalFeedbacks,
            nextFeedbackIndex: v.nextFeedbackIndex,
            positiveCount: v.positiveCount,
            negativeCount: v.negativeCount,
          };
        })
        .catch((err) => errors.push(`getSummary: ${formatError(err)}`)),
    );
  }

  if (options.includeEnrichedSummary && assetPubkey) {
    promises.push(
      retry(() => sdk.getEnrichedSummary(assetPubkey), 3)
        .then((v) => {
          if (!v) {
            enrichedSummary = null;
            return;
          }
          enrichedSummary = {
            trustTier: Number(v.trustTier),
            qualityScore: v.qualityScore,
            confidence: v.confidence,
            riskScore: v.riskScore,
            diversityRatio: v.diversityRatio,
            uniqueCallers: v.uniqueCallers,
            emaScoreFast: v.emaScoreFast,
            emaScoreSlow: v.emaScoreSlow,
            volatility: v.volatility,
          };
        })
        .catch((err) => errors.push(`getEnrichedSummary: ${formatError(err)}`)),
    );
  }

  if (options.includeReputation) {
    promises.push(
      retry(() => indexer.getAgentReputation(asset), 3)
        .then((v) => {
          reputation = v;
        })
        .catch((err) => errors.push(`getAgentReputation: ${formatError(err)}`)),
    );
  }

  if (options.includeMetadata) {
    promises.push(
      retry(() => indexer.getMetadata(asset), 3)
        .then((v) => {
          metadata = Array.isArray(v) ? v : [];
        })
        .catch((err) => errors.push(`getMetadata: ${formatError(err)}`)),
    );
  }

  if (options.includeFeedbacks) {
    promises.push(
      retry(
        () =>
          indexer.getFeedbacks(asset, {
            includeRevoked: true,
            ...(options.feedbackLimit > 0 ? { limit: options.feedbackLimit } : {}),
          }),
        3,
      )
        .then((v) => {
          feedbacks = Array.isArray(v) ? v : [];
        })
        .catch((err) => errors.push(`getFeedbacks: ${formatError(err)}`)),
    );
  }

  if (options.includeValidations) {
    promises.push(
      retry(() => indexer.getValidations(asset), 3)
        .then((v) => {
          validations = Array.isArray(v) ? v : [];
        })
        .catch((err) => errors.push(`getValidations: ${formatError(err)}`)),
    );
  }

  if (!assetPubkey) {
    errors.push(`invalid asset pubkey: ${asset}`);
  }

  await Promise.all(promises);

  if (options.includeAgentUriJson) {
    const uri = stringOrNull(onchain?.agent_uri) || stringOrNull(listed.agent_uri);
    if (uri) {
      const registration = await fetchRegistrationJson(uri, options.agentUriTimeoutMs).catch(
        (err: unknown) => {
          errors.push(`fetchRegistrationJson: ${formatError(err)}`);
          return null;
        },
      );
      if (registration) {
        registrationJson = registration.json;
        registrationSourceUrl = registration.sourceUrl;
      }
    }
  }

  return {
    listed,
    onchain,
    summary,
    enrichedSummary,
    reputation,
    metadata,
    feedbacks,
    validations,
    registrationJson,
    registrationSourceUrl,
    errors,
  };
}

async function main() {
  dotenv.config({ path: ".env" });
  dotenv.config({ path: "packages/server/.env" });

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const reset = args.includes("--reset");

  const sqlitePathArg = parseStringArg(args, "--sqlite-path") || "./erc8004.sqlite3";
  const sqlitePath = path.isAbsolute(sqlitePathArg)
    ? sqlitePathArg
    : path.resolve(process.cwd(), sqlitePathArg);

  const startOffset = Math.max(0, parseIntArg(args, "--start-offset", 0));
  const limit = Math.max(1, Math.min(500, parseIntArg(args, "--limit", 100)));
  const maxAgents = Math.max(0, parseIntArg(args, "--max-agents", 0));
  const concurrency = Math.max(1, Math.min(32, parseIntArg(args, "--concurrency", 5)));
  const feedbackLimit = Math.max(0, parseIntArg(args, "--feedback-limit", 2000));
  const agentUriTimeoutMs = Math.max(1000, Math.min(20000, parseIntArg(args, "--agent-uri-timeout-ms", 8000)));

  const owner = parseStringArg(args, "--owner");
  const collection = parseStringArg(args, "--collection");
  const wallet = parseStringArg(args, "--wallet");
  const orderBy = parseStringArg(args, "--order-by") || "created_at.desc";

  const rpcUrl = parseStringArg(args, "--rpc-url") || nonEmptyString(process.env.SOLANA_RPC_URL);
  const indexerUrl = parseStringArg(args, "--indexer-url") || nonEmptyString(process.env.INDEXER_URL);
  const indexerApiKey =
    parseStringArg(args, "--indexer-api-key") || nonEmptyString(process.env.INDEXER_API_KEY);

  const includeOnchain = !args.includes("--skip-onchain");
  const includeSummary = !args.includes("--skip-summary");
  const includeEnrichedSummary = !args.includes("--skip-enriched");
  const includeReputation = !args.includes("--skip-reputation");
  const includeMetadata = !args.includes("--skip-metadata");
  const includeFeedbacks = !args.includes("--skip-feedbacks");
  const includeValidations = !args.includes("--skip-validations");
  const includeAgentUriJson = !args.includes("--skip-agent-uri");
  const sdkLogs = args.includes("--sdk-logs");

  // SDK emits frequent non-fatal error logs on devnet (e.g. missing/legacy ATOM stats).
  // Keep output clean unless explicitly requested.
  if (!sdkLogs) {
    configureLogger({ enabled: false });
  }

  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const db = new Database(sqlitePath, { create: true, strict: true });

  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  const sdk = new SolanaSDK({
    cluster: "devnet",
    ...(rpcUrl ? { rpcUrl } : {}),
    ...(indexerUrl ? { indexerUrl } : {}),
    ...(indexerApiKey ? { indexerApiKey } : {}),
  });
  const indexer = sdk.getIndexerClient();
  const indexerBaseUrl = indexer.getBaseUrl();

  const optionsJson = serializeJson({
    dryRun,
    reset,
    startOffset,
    limit,
    maxAgents,
    concurrency,
    feedbackLimit,
    agentUriTimeoutMs,
    owner,
    collection,
    wallet,
    orderBy,
    rpcUrl,
    indexerUrl: indexerBaseUrl,
    includeOnchain,
    includeSummary,
    includeEnrichedSummary,
    includeReputation,
    includeMetadata,
    includeFeedbacks,
    includeValidations,
    includeAgentUriJson,
    sdkLogs,
  });

  let seenAgents = 0;
  let writtenAgents = 0;
  let writtenMetadata = 0;
  let writtenFeedbacks = 0;
  let writtenValidations = 0;

  let upsertRunStartedStmt: ReturnType<typeof db.query> | null = null;
  let finalizeRunStmt: ReturnType<typeof db.query> | null = null;

  try {
    ensureSchema(db);

    upsertRunStartedStmt = db.query(`
      INSERT INTO erc8004_solana_ingest_runs (
        run_id, started_at, status, cluster, rpc_url, indexer_url, options_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(run_id) DO UPDATE SET
        started_at = excluded.started_at,
        status = excluded.status,
        cluster = excluded.cluster,
        rpc_url = excluded.rpc_url,
        indexer_url = excluded.indexer_url,
        options_json = excluded.options_json
    `);
    finalizeRunStmt = db.query(`
      UPDATE erc8004_solana_ingest_runs
      SET finished_at = ?, status = ?, agents_seen = ?, agents_written = ?,
          metadata_written = ?, feedbacks_written = ?, validations_written = ?, error_text = ?
      WHERE run_id = ?
    `);

    if (!dryRun) {
      upsertRunStartedStmt.run(
        runId,
        startedAt,
        "running",
        "devnet",
        rpcUrl ?? null,
        indexerBaseUrl,
        optionsJson,
      );
    }

    if (reset && !dryRun) {
      db.exec(`
        DELETE FROM erc8004_solana_metadata;
        DELETE FROM erc8004_solana_feedbacks;
        DELETE FROM erc8004_solana_validations;
        DELETE FROM erc8004_solana_agents;
        DELETE FROM erc8004_solana_network;
      `);
    }

    const runAt = new Date().toISOString();
    const networkMetadata = {
      source: "8004-solana-sdk",
      cluster: "devnet",
      sdkIndexerUrl: indexerBaseUrl,
    };

    if (!dryRun) {
      const upsertNetworkStmt = db.query(`
        INSERT INTO erc8004_solana_network (
          cluster, rpc_url, indexer_url, registry_program_id, atom_engine_program_id,
          metadata_json, fetched_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(cluster) DO UPDATE SET
          rpc_url = excluded.rpc_url,
          indexer_url = excluded.indexer_url,
          registry_program_id = excluded.registry_program_id,
          atom_engine_program_id = excluded.atom_engine_program_id,
          metadata_json = excluded.metadata_json,
          fetched_at = excluded.fetched_at,
          updated_at = excluded.updated_at
      `);
      upsertNetworkStmt.run(
        "devnet",
        rpcUrl ?? null,
        indexerBaseUrl,
        PROGRAM_ID.toBase58(),
        ATOM_ENGINE_PROGRAM_ID.toBase58(),
        serializeJson(networkMetadata),
        runAt,
        runAt,
      );
    }

    const available = await retry(() => sdk.isIndexerAvailable(), 3).catch(() => false);
    if (!available) {
      throw new Error(
        `Indexer is not available at ${indexerBaseUrl}. Provide --indexer-url/--indexer-api-key if needed.`,
      );
    }

    let estimatedTotal: number | null = null;
    if (wallet) {
      estimatedTotal = 1;
    } else {
      try {
        const countFilters: Record<string, string> = {};
        if (owner) countFilters.owner = `eq.${owner}`;
        if (collection) countFilters.collection = `eq.${collection}`;
        estimatedTotal = await retry(() => indexer.getCount("agents", countFilters), 3);
      } catch {
        estimatedTotal = null;
      }
    }

    const upsertAgentStmt = db.query(`
      INSERT INTO erc8004_solana_agents (
        asset, cluster, owner, collection, agent_uri, agent_wallet, nft_name,
        atom_enabled, trust_tier, quality_score, confidence, risk_score, diversity_ratio,
        feedback_count, raw_avg_score, sort_key, block_slot, tx_signature, created_at, updated_at,
        onchain_owner, onchain_collection, onchain_agent_wallet, onchain_atom_enabled,
        onchain_feedback_count, onchain_response_count, onchain_revoke_count,
        onchain_feedback_digest, onchain_response_digest, onchain_revoke_digest,
        summary_total_feedbacks, summary_average_score, summary_positive_count, summary_negative_count,
        summary_next_feedback_index,
        enriched_trust_tier, enriched_quality_score, enriched_confidence, enriched_risk_score,
        enriched_diversity_ratio, enriched_unique_callers, enriched_ema_score_fast,
        enriched_ema_score_slow, enriched_volatility,
        reputation_feedback_count, reputation_avg_score, reputation_positive_count, reputation_negative_count,
        reputation_validation_count,
        metadata_count, feedbacks_count, validations_count,
        registration_source_url, registration_json,
        indexed_json, onchain_json, summary_json, enriched_summary_json, reputation_json,
        errors_json, fetched_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?
      )
      ON CONFLICT(asset) DO UPDATE SET
        cluster = excluded.cluster,
        owner = excluded.owner,
        collection = excluded.collection,
        agent_uri = excluded.agent_uri,
        agent_wallet = excluded.agent_wallet,
        nft_name = excluded.nft_name,
        atom_enabled = excluded.atom_enabled,
        trust_tier = excluded.trust_tier,
        quality_score = excluded.quality_score,
        confidence = excluded.confidence,
        risk_score = excluded.risk_score,
        diversity_ratio = excluded.diversity_ratio,
        feedback_count = excluded.feedback_count,
        raw_avg_score = excluded.raw_avg_score,
        sort_key = excluded.sort_key,
        block_slot = excluded.block_slot,
        tx_signature = excluded.tx_signature,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        onchain_owner = excluded.onchain_owner,
        onchain_collection = excluded.onchain_collection,
        onchain_agent_wallet = excluded.onchain_agent_wallet,
        onchain_atom_enabled = excluded.onchain_atom_enabled,
        onchain_feedback_count = excluded.onchain_feedback_count,
        onchain_response_count = excluded.onchain_response_count,
        onchain_revoke_count = excluded.onchain_revoke_count,
        onchain_feedback_digest = excluded.onchain_feedback_digest,
        onchain_response_digest = excluded.onchain_response_digest,
        onchain_revoke_digest = excluded.onchain_revoke_digest,
        summary_total_feedbacks = excluded.summary_total_feedbacks,
        summary_average_score = excluded.summary_average_score,
        summary_positive_count = excluded.summary_positive_count,
        summary_negative_count = excluded.summary_negative_count,
        summary_next_feedback_index = excluded.summary_next_feedback_index,
        enriched_trust_tier = excluded.enriched_trust_tier,
        enriched_quality_score = excluded.enriched_quality_score,
        enriched_confidence = excluded.enriched_confidence,
        enriched_risk_score = excluded.enriched_risk_score,
        enriched_diversity_ratio = excluded.enriched_diversity_ratio,
        enriched_unique_callers = excluded.enriched_unique_callers,
        enriched_ema_score_fast = excluded.enriched_ema_score_fast,
        enriched_ema_score_slow = excluded.enriched_ema_score_slow,
        enriched_volatility = excluded.enriched_volatility,
        reputation_feedback_count = excluded.reputation_feedback_count,
        reputation_avg_score = excluded.reputation_avg_score,
        reputation_positive_count = excluded.reputation_positive_count,
        reputation_negative_count = excluded.reputation_negative_count,
        reputation_validation_count = excluded.reputation_validation_count,
        metadata_count = excluded.metadata_count,
        feedbacks_count = excluded.feedbacks_count,
        validations_count = excluded.validations_count,
        registration_source_url = excluded.registration_source_url,
        registration_json = excluded.registration_json,
        indexed_json = excluded.indexed_json,
        onchain_json = excluded.onchain_json,
        summary_json = excluded.summary_json,
        enriched_summary_json = excluded.enriched_summary_json,
        reputation_json = excluded.reputation_json,
        errors_json = excluded.errors_json,
        fetched_at = excluded.fetched_at
    `);

    const upsertMetadataStmt = db.query(`
      INSERT INTO erc8004_solana_metadata (
        id, asset, key, key_hash, value, immutable, block_slot, tx_signature,
        created_at, updated_at, source_json, fetched_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        asset = excluded.asset,
        key = excluded.key,
        key_hash = excluded.key_hash,
        value = excluded.value,
        immutable = excluded.immutable,
        block_slot = excluded.block_slot,
        tx_signature = excluded.tx_signature,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        source_json = excluded.source_json,
        fetched_at = excluded.fetched_at
    `);

    const upsertFeedbackStmt = db.query(`
      INSERT INTO erc8004_solana_feedbacks (
        id, asset, client_address, feedback_index, value, value_decimals, score,
        tag1, tag2, endpoint, feedback_uri, running_digest, feedback_hash,
        is_revoked, revoked_at, block_slot, tx_signature, created_at, source_json, fetched_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        asset = excluded.asset,
        client_address = excluded.client_address,
        feedback_index = excluded.feedback_index,
        value = excluded.value,
        value_decimals = excluded.value_decimals,
        score = excluded.score,
        tag1 = excluded.tag1,
        tag2 = excluded.tag2,
        endpoint = excluded.endpoint,
        feedback_uri = excluded.feedback_uri,
        running_digest = excluded.running_digest,
        feedback_hash = excluded.feedback_hash,
        is_revoked = excluded.is_revoked,
        revoked_at = excluded.revoked_at,
        block_slot = excluded.block_slot,
        tx_signature = excluded.tx_signature,
        created_at = excluded.created_at,
        source_json = excluded.source_json,
        fetched_at = excluded.fetched_at
    `);

    const upsertValidationStmt = db.query(`
      INSERT INTO erc8004_solana_validations (
        id, asset, validator_address, nonce, requester, request_uri, request_hash,
        response, response_uri, response_hash, tag, status, block_slot, tx_signature,
        created_at, updated_at, source_json, fetched_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        asset = excluded.asset,
        validator_address = excluded.validator_address,
        nonce = excluded.nonce,
        requester = excluded.requester,
        request_uri = excluded.request_uri,
        request_hash = excluded.request_hash,
        response = excluded.response,
        response_uri = excluded.response_uri,
        response_hash = excluded.response_hash,
        tag = excluded.tag,
        status = excluded.status,
        block_slot = excluded.block_slot,
        tx_signature = excluded.tx_signature,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        source_json = excluded.source_json,
        fetched_at = excluded.fetched_at
    `);

    let offset = startOffset;
    let imported = 0;

    console.log(
      `[erc8004/solana/sqlite] Importing agents (cluster=devnet, limit=${limit}, offset=${offset}, concurrency=${concurrency}) -> ${sqlitePath}`,
    );
    console.log(
      `[erc8004/solana/sqlite] registry=${PROGRAM_ID.toBase58()} atom=${ATOM_ENGINE_PROGRAM_ID.toBase58()}`,
    );
    if (owner) console.log(`[erc8004/solana/sqlite] Filtering owner=${owner}`);
    if (collection) console.log(`[erc8004/solana/sqlite] Filtering collection=${collection}`);
    if (wallet) console.log(`[erc8004/solana/sqlite] Filtering wallet=${wallet}`);

    for (;;) {
      const page = await retry(
        () =>
          sdk.searchAgents({
            ...(owner ? { owner } : {}),
            ...(collection ? { collection } : {}),
            ...(wallet ? { wallet } : {}),
            limit,
            offset,
            orderBy,
          }),
        4,
      );

      if (!Array.isArray(page) || page.length === 0) break;

      let items = page;
      if (maxAgents > 0 && imported + items.length > maxAgents) {
        items = items.slice(0, maxAgents - imported);
      }
      if (items.length === 0) break;

      const fetchedAt = new Date().toISOString();
      const bundles = await mapWithConcurrency(items, concurrency, (listed) =>
        enrichAgentBundle(sdk, listed, {
          includeOnchain,
          includeSummary,
          includeEnrichedSummary,
          includeReputation,
          includeMetadata,
          includeFeedbacks,
          includeValidations,
          includeAgentUriJson,
          feedbackLimit,
          agentUriTimeoutMs,
        }),
      );

      seenAgents += items.length;

      if (!dryRun) {
        const tx = db.transaction((rows: IngestedAgentBundle[]) => {
          for (const row of rows) {
            const listed = row.listed;
            const onchain = row.onchain;
            const summary = row.summary;
            const enriched = row.enrichedSummary;
            const rep = row.reputation;
            const onchainFields = onchainCoreFields(onchain);

            upsertAgentStmt.run(
              listed.asset,
              "devnet",
              stringOrNull(listed.owner),
              stringOrNull(listed.collection),
              stringOrNull(listed.agent_uri),
              stringOrNull(listed.agent_wallet),
              stringOrNull(listed.nft_name),
              boolToInt(typeof listed.atom_enabled === "boolean" ? listed.atom_enabled : null),
              numberOrNull(listed.trust_tier),
              numberOrNull(listed.quality_score),
              numberOrNull(listed.confidence),
              numberOrNull(listed.risk_score),
              numberOrNull(listed.diversity_ratio),
              numberOrNull(listed.feedback_count),
              numberOrNull(listed.raw_avg_score),
              stringOrNull(listed.sort_key),
              numberOrNull(listed.block_slot),
              stringOrNull(listed.tx_signature),
              stringOrNull(listed.created_at),
              stringOrNull(listed.updated_at),
              onchainFields.onchainOwner,
              onchainFields.onchainCollection,
              onchainFields.onchainAgentWallet,
              onchainFields.onchainAtomEnabled,
              onchainFields.onchainFeedbackCount,
              onchainFields.onchainResponseCount,
              onchainFields.onchainRevokeCount,
              onchainFields.onchainFeedbackDigest,
              onchainFields.onchainResponseDigest,
              onchainFields.onchainRevokeDigest,
              numberOrNull(summary?.totalFeedbacks),
              numberOrNull(summary?.averageScore),
              numberOrNull(summary?.positiveCount),
              numberOrNull(summary?.negativeCount),
              numberOrNull(summary?.nextFeedbackIndex),
              numberOrNull(enriched?.trustTier),
              numberOrNull(enriched?.qualityScore),
              numberOrNull(enriched?.confidence),
              numberOrNull(enriched?.riskScore),
              numberOrNull(enriched?.diversityRatio),
              numberOrNull(enriched?.uniqueCallers),
              numberOrNull(enriched?.emaScoreFast),
              numberOrNull(enriched?.emaScoreSlow),
              numberOrNull(enriched?.volatility),
              numberOrNull(rep?.feedback_count),
              numberOrNull(rep?.avg_score),
              numberOrNull(rep?.positive_count),
              numberOrNull(rep?.negative_count),
              numberOrNull(rep?.validation_count),
              row.metadata.length,
              row.feedbacks.length,
              row.validations.length,
              row.registrationSourceUrl,
              row.registrationJson ? serializeJson(row.registrationJson) : null,
              serializeJson(listed),
              onchain ? serializeJson(onchain) : null,
              summary ? serializeJson(summary) : null,
              enriched ? serializeJson(enriched) : null,
              rep ? serializeJson(rep) : null,
              serializeJson(row.errors),
              fetchedAt,
            );
            writtenAgents += 1;

            for (const m of row.metadata) {
              const id = nonEmptyString(m.id) || `${m.asset}:${m.key}`;
              upsertMetadataStmt.run(
                id,
                m.asset,
                m.key,
                m.key_hash,
                m.value,
                boolToInt(m.immutable),
                numberOrNull(m.block_slot),
                stringOrNull(m.tx_signature),
                stringOrNull(m.created_at),
                stringOrNull(m.updated_at),
                serializeJson(m),
                fetchedAt,
              );
              writtenMetadata += 1;
            }

            for (const f of row.feedbacks) {
              const compositeId = `${f.asset}:${f.client_address}:${String(f.feedback_index)}`;
              const id = nonEmptyString(f.id) || compositeId;
              upsertFeedbackStmt.run(
                id,
                f.asset,
                f.client_address,
                String(f.feedback_index),
                f.value === null || f.value === undefined ? null : String(f.value),
                numberOrNull(f.value_decimals),
                numberOrNull(f.score),
                stringOrNull(f.tag1),
                stringOrNull(f.tag2),
                stringOrNull(f.endpoint),
                stringOrNull(f.feedback_uri),
                stringOrNull(f.running_digest),
                stringOrNull(f.feedback_hash),
                boolToInt(f.is_revoked) ?? 0,
                stringOrNull(f.revoked_at),
                numberOrNull(f.block_slot),
                stringOrNull(f.tx_signature),
                stringOrNull(f.created_at),
                serializeJson(f),
                fetchedAt,
              );
              writtenFeedbacks += 1;
            }

            for (const v of row.validations) {
              const compositeId = `${v.asset}:${v.validator_address}:${String(v.nonce)}`;
              const id = nonEmptyString(v.id) || compositeId;
              upsertValidationStmt.run(
                id,
                v.asset,
                v.validator_address,
                numberOrNull(v.nonce),
                stringOrNull(v.requester),
                stringOrNull(v.request_uri),
                stringOrNull(v.request_hash),
                numberOrNull(v.response),
                stringOrNull(v.response_uri),
                stringOrNull(v.response_hash),
                stringOrNull(v.tag),
                stringOrNull(v.status),
                numberOrNull(v.block_slot),
                stringOrNull(v.tx_signature),
                stringOrNull(v.created_at),
                stringOrNull(v.updated_at),
                serializeJson(v),
                fetchedAt,
              );
              writtenValidations += 1;
            }
          }
        });
        tx(bundles);
      }

      imported += items.length;
      const processed = offset + items.length;
      const total = estimatedTotal ?? 0;
      const pct = total > 0 ? ((Math.min(processed, total) / total) * 100).toFixed(1) : "n/a";
      console.log(
        `[erc8004/solana/sqlite] offset=${offset} +${items.length} imported=${imported} total≈${estimatedTotal ?? "?"} (${pct}%)`,
      );

      offset += page.length;
      if (maxAgents > 0 && imported >= maxAgents) break;
      if (wallet) break;
      await sleep(100);
    }

    const finishedAt = new Date().toISOString();
    if (!dryRun && finalizeRunStmt) {
      finalizeRunStmt.run(
        finishedAt,
        "success",
        seenAgents,
        writtenAgents,
        writtenMetadata,
        writtenFeedbacks,
        writtenValidations,
        null,
        runId,
      );
    }

    console.log(
      `[erc8004/solana/sqlite] Done. seen=${seenAgents} wrote_agents=${writtenAgents} wrote_metadata=${writtenMetadata} wrote_feedbacks=${writtenFeedbacks} wrote_validations=${writtenValidations}${dryRun ? " (dry-run)" : ""}`,
    );
    console.log(`[erc8004/solana/sqlite] DB: ${sqlitePath}`);
  } catch (err) {
    const finishedAt = new Date().toISOString();
    if (!dryRun && finalizeRunStmt) {
      finalizeRunStmt.run(
        finishedAt,
        "failed",
        seenAgents,
        writtenAgents,
        writtenMetadata,
        writtenFeedbacks,
        writtenValidations,
        formatError(err),
        runId,
      );
    }
    throw err;
  } finally {
    db.close(false);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
