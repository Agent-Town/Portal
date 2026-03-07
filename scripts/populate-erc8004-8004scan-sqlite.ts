#!/usr/bin/env bun
/**
 * Populate a SQLite3 database with ERC-8004 metadata from 8004scan.
 *
 * This keeps max fidelity by storing:
 * - extracted query-friendly columns
 * - the full raw 8004scan payload in `data_json`
 *
 * Usage:
 *   bun scripts/populate-erc8004-8004scan-sqlite.ts
 *
 * Options:
 *   --sqlite-path <path>      SQLite file path (default: ./erc8004.sqlite3)
 *   --dry-run                 Fetch only (no DB writes)
 *   --reset                   Clear existing erc8004_* tables before import
 *   --start-offset <n>        Resume pagination at offset n (default: 0)
 *   --limit <n>               Page size (max 100; default: 100)
 *   --chain-id <id>           Only ingest one chain ID
 *   --testnet                 Only ingest testnet agents
 *   --mainnet                 Only ingest mainnet agents
 *   --max-agents <n>          Stop after importing n agents (debug)
 */

import { Database } from "bun:sqlite";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";

const IDENTITY_REGISTRY_MAINNET = "0x8004a169fb4a3325136eb29fa0ceb6d2e539a432";
const REPUTATION_REGISTRY_MAINNET = "0x8004baa17c55a88189ae136b182e5fda19de9b63";
const IDENTITY_REGISTRY_TESTNET = "0x8004a818bfb912233c491871b3d84c89a494bd9e";
const REPUTATION_REGISTRY_TESTNET = "0x8004b663056a597dffe9eccc1965a193b7388713";

type ChainsApiResponse = {
  success: boolean;
  data?: { chains?: Array<{ chain_id: number; name: string; is_testnet: boolean; enabled: boolean }> };
};

type AgentsApiResponse = {
  items: unknown[];
  total: number;
  limit: number;
  offset: number;
};

type ChainRow = {
  chainId: number;
  name: string;
  isTestnet: number;
  enabled: number;
  identityRegistryAddress: string;
  reputationRegistryAddress: string;
  sourceJson: string;
  fetchedAt: string;
  updatedAt: string;
};

type AgentRow = {
  agentId: string;
  chainId: number;
  contractAddress: string;
  tokenId: string;
  isTestnet: number;
  ownerAddress: string | null;
  creatorAddress: string | null;
  agentWallet: string | null;
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  agentUrl: string | null;
  ens: string | null;
  did: string | null;
  isActive: number | null;
  isVerified: number | null;
  isEndpointVerified: number | null;
  x402Supported: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  fetchedAt: string;
  dataJson: string;
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

function normalizeAddress(value: unknown): string | null {
  const v = nonEmptyString(value);
  return v ? v.toLowerCase() : null;
}

function boolToInt(value: unknown): number | null {
  if (typeof value === "boolean") return value ? 1 : 0;
  return null;
}

function ensureSchema(db: Database): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS erc8004_chains (
      chain_id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      is_testnet INTEGER NOT NULL,
      enabled INTEGER NOT NULL,
      identity_registry_address TEXT,
      reputation_registry_address TEXT,
      source_json TEXT NOT NULL DEFAULT '{}',
      fetched_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_erc8004_chains_enabled
      ON erc8004_chains(enabled);
    CREATE INDEX IF NOT EXISTS idx_erc8004_chains_is_testnet
      ON erc8004_chains(is_testnet);

    CREATE TABLE IF NOT EXISTS erc8004_agents (
      agent_id TEXT PRIMARY KEY NOT NULL,
      chain_id INTEGER NOT NULL,
      contract_address TEXT NOT NULL,
      token_id TEXT NOT NULL,
      is_testnet INTEGER NOT NULL,
      owner_address TEXT,
      creator_address TEXT,
      agent_wallet TEXT,
      name TEXT,
      description TEXT,
      image_url TEXT,
      agent_url TEXT,
      ens TEXT,
      did TEXT,
      is_active INTEGER,
      is_verified INTEGER,
      is_endpoint_verified INTEGER,
      x402_supported INTEGER,
      created_at TEXT,
      updated_at TEXT,
      fetched_at TEXT NOT NULL,
      data_json TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_erc8004_agents_chain_contract_token
      ON erc8004_agents(chain_id, contract_address, token_id);
    CREATE INDEX IF NOT EXISTS idx_erc8004_agents_chain_id
      ON erc8004_agents(chain_id);
    CREATE INDEX IF NOT EXISTS idx_erc8004_agents_contract_address
      ON erc8004_agents(contract_address);
    CREATE INDEX IF NOT EXISTS idx_erc8004_agents_is_testnet
      ON erc8004_agents(is_testnet);
    CREATE INDEX IF NOT EXISTS idx_erc8004_agents_updated_at
      ON erc8004_agents(updated_at);
    CREATE INDEX IF NOT EXISTS idx_erc8004_agents_owner_address
      ON erc8004_agents(owner_address);
  `);
}

function erc8004IdentityAddressForChain(isTestnet: boolean): string {
  return isTestnet ? IDENTITY_REGISTRY_TESTNET : IDENTITY_REGISTRY_MAINNET;
}

function erc8004ReputationAddressForChain(isTestnet: boolean): string {
  return isTestnet ? REPUTATION_REGISTRY_TESTNET : REPUTATION_REGISTRY_MAINNET;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      "user-agent": "hyperscapeai/erc8004-ingest-sqlite",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} for ${url}${body ? `: ${body.slice(0, 300)}` : ""}`);
  }
  return (await res.json()) as T;
}

async function fetchJsonWithRetry<T>(url: string, attempts = 5): Promise<T> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchJson<T>(url);
    } catch (err) {
      lastErr = err;
      const backoff = Math.min(10_000, 500 * 2 ** i);
      await sleep(backoff);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function buildAgentsUrl(params: {
  limit: number;
  offset: number;
  chainId?: number | null;
  isTestnet?: boolean | null;
}): string {
  const u = new URL("https://www.8004scan.io/api/v1/agents");
  u.searchParams.set("limit", String(params.limit));
  u.searchParams.set("offset", String(params.offset));
  if (typeof params.chainId === "number" && Number.isFinite(params.chainId)) {
    u.searchParams.set("chain_id", String(params.chainId));
  }
  if (typeof params.isTestnet === "boolean") {
    u.searchParams.set("is_testnet", params.isTestnet ? "true" : "false");
  }
  return u.toString();
}

function toAgentRow(item: any, fetchedAt: string): AgentRow | null {
  const agentId = nonEmptyString(item?.agent_id);
  if (!agentId) return null;

  const chainIdRaw = typeof item?.chain_id === "number" ? item.chain_id : Number(item?.chain_id);
  if (!Number.isFinite(chainIdRaw)) return null;

  const contractAddress = normalizeAddress(item?.contract_address);
  if (!contractAddress) return null;

  const tokenIdRaw = item?.token_id;
  const tokenId = tokenIdRaw === undefined || tokenIdRaw === null ? null : String(tokenIdRaw);
  if (!tokenId) return null;

  return {
    agentId,
    chainId: Math.floor(chainIdRaw),
    contractAddress,
    tokenId,
    isTestnet: item?.is_testnet ? 1 : 0,
    ownerAddress: normalizeAddress(item?.owner_address),
    creatorAddress: normalizeAddress(item?.creator_address),
    agentWallet: normalizeAddress(item?.agent_wallet),
    name: typeof item?.name === "string" ? item.name : null,
    description: typeof item?.description === "string" ? item.description : null,
    imageUrl: typeof item?.image_url === "string" ? item.image_url : null,
    agentUrl: typeof item?.agent_url === "string" ? item.agent_url : null,
    ens: typeof item?.ens === "string" ? item.ens : null,
    did: typeof item?.did === "string" ? item.did : null,
    isActive: boolToInt(item?.is_active),
    isVerified: boolToInt(item?.is_verified),
    isEndpointVerified: boolToInt(item?.is_endpoint_verified),
    x402Supported: boolToInt(item?.x402_supported),
    createdAt: typeof item?.created_at === "string" ? item.created_at : null,
    updatedAt: typeof item?.updated_at === "string" ? item.updated_at : null,
    fetchedAt,
    dataJson: JSON.stringify(item),
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
  const limit = Math.min(100, Math.max(1, parseIntArg(args, "--limit", 100)));
  const maxAgents = Math.max(0, parseIntArg(args, "--max-agents", 0));
  const chainId = parseIntArg(args, "--chain-id", 0) || null;

  const testnetOnly = args.includes("--testnet");
  const mainnetOnly = args.includes("--mainnet");
  const isTestnet =
    testnetOnly && !mainnetOnly ? true : !testnetOnly && mainnetOnly ? false : null;

  if (testnetOnly && mainnetOnly) {
    throw new Error("Pick only one: --testnet or --mainnet");
  }

  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const db = new Database(sqlitePath, { create: true, strict: true });

  try {
    ensureSchema(db);
    if (reset && !dryRun) {
      db.exec(`DELETE FROM erc8004_agents; DELETE FROM erc8004_chains;`);
    }

    const runAt = new Date().toISOString();

    // Upsert chain metadata first.
    const chainsUrl = "https://www.8004scan.io/api/v1/chains";
    const chainsPayload = await fetchJsonWithRetry<ChainsApiResponse>(chainsUrl);
    const chains = chainsPayload?.data?.chains || [];
    console.log(`[erc8004/sqlite] Chains: ${chains.length} (from ${chainsUrl})`);

    const chainRows: ChainRow[] = chains.map((c) => ({
      chainId: c.chain_id,
      name: c.name,
      isTestnet: c.is_testnet ? 1 : 0,
      enabled: c.enabled ? 1 : 0,
      identityRegistryAddress: erc8004IdentityAddressForChain(Boolean(c.is_testnet)),
      reputationRegistryAddress: erc8004ReputationAddressForChain(Boolean(c.is_testnet)),
      sourceJson: JSON.stringify({ source: "8004scan", fetchedAt: runAt, chain: c }),
      fetchedAt: runAt,
      updatedAt: runAt,
    }));

    if (!dryRun && chainRows.length > 0) {
      const upsertChainStmt = db.query(`
        INSERT INTO erc8004_chains (
          chain_id, name, is_testnet, enabled,
          identity_registry_address, reputation_registry_address,
          source_json, fetched_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(chain_id) DO UPDATE SET
          name = excluded.name,
          is_testnet = excluded.is_testnet,
          enabled = excluded.enabled,
          identity_registry_address = excluded.identity_registry_address,
          reputation_registry_address = excluded.reputation_registry_address,
          source_json = excluded.source_json,
          fetched_at = excluded.fetched_at,
          updated_at = excluded.updated_at
      `);
      const tx = db.transaction((rows: ChainRow[]) => {
        for (const row of rows) {
          upsertChainStmt.run(
            row.chainId,
            row.name,
            row.isTestnet,
            row.enabled,
            row.identityRegistryAddress,
            row.reputationRegistryAddress,
            row.sourceJson,
            row.fetchedAt,
            row.updatedAt,
          );
        }
      });
      tx(chainRows);
    }

    const upsertAgentStmt = db.query(`
      INSERT INTO erc8004_agents (
        agent_id, chain_id, contract_address, token_id, is_testnet,
        owner_address, creator_address, agent_wallet,
        name, description, image_url, agent_url, ens, did,
        is_active, is_verified, is_endpoint_verified, x402_supported,
        created_at, updated_at, fetched_at, data_json
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
      ON CONFLICT(agent_id) DO UPDATE SET
        chain_id = excluded.chain_id,
        contract_address = excluded.contract_address,
        token_id = excluded.token_id,
        is_testnet = excluded.is_testnet,
        owner_address = excluded.owner_address,
        creator_address = excluded.creator_address,
        agent_wallet = excluded.agent_wallet,
        name = excluded.name,
        description = excluded.description,
        image_url = excluded.image_url,
        agent_url = excluded.agent_url,
        ens = excluded.ens,
        did = excluded.did,
        is_active = excluded.is_active,
        is_verified = excluded.is_verified,
        is_endpoint_verified = excluded.is_endpoint_verified,
        x402_supported = excluded.x402_supported,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        fetched_at = excluded.fetched_at,
        data_json = excluded.data_json
    `);

    let offset = startOffset;
    let imported = 0;
    let total: number | null = null;

    console.log(`[erc8004/sqlite] Importing agents (limit=${limit}, offset=${offset}) -> ${sqlitePath}`);
    if (chainId) console.log(`[erc8004/sqlite] Filtering chain_id=${chainId}`);
    if (isTestnet !== null) console.log(`[erc8004/sqlite] Filtering is_testnet=${isTestnet}`);

    for (;;) {
      const url = buildAgentsUrl({ limit, offset, chainId, isTestnet });
      const page = await fetchJsonWithRetry<AgentsApiResponse>(url);
      if (total === null) total = page.total;

      const items = Array.isArray(page.items) ? page.items : [];
      if (items.length === 0) break;

      const fetchedAt = new Date().toISOString();
      const rows: AgentRow[] = [];
      for (const item of items) {
        const row = toAgentRow(item as any, fetchedAt);
        if (row) rows.push(row);
      }

      if (!dryRun && rows.length > 0) {
        const tx = db.transaction((batch: AgentRow[]) => {
          for (const row of batch) {
            upsertAgentStmt.run(
              row.agentId,
              row.chainId,
              row.contractAddress,
              row.tokenId,
              row.isTestnet,
              row.ownerAddress,
              row.creatorAddress,
              row.agentWallet,
              row.name,
              row.description,
              row.imageUrl,
              row.agentUrl,
              row.ens,
              row.did,
              row.isActive,
              row.isVerified,
              row.isEndpointVerified,
              row.x402Supported,
              row.createdAt,
              row.updatedAt,
              row.fetchedAt,
              row.dataJson,
            );
          }
        });
        tx(rows);
      }

      imported += rows.length;
      const progressTotal = total ?? page.total ?? 0;
      const pct =
        progressTotal > 0
          ? ((Math.min(offset + items.length, progressTotal) / progressTotal) * 100).toFixed(1)
          : "0.0";
      console.log(
        `[erc8004/sqlite] offset=${offset} +${items.length} wrote=${rows.length} imported=${imported} (${pct}%)`,
      );

      offset += items.length;
      if (progressTotal > 0 && offset >= progressTotal) break;
      if (maxAgents > 0 && imported >= maxAgents) break;
      await sleep(100);
    }

    console.log(`[erc8004/sqlite] Done. imported=${imported}${dryRun ? " (dry-run)" : ""}`);
    console.log(`[erc8004/sqlite] DB: ${sqlitePath}`);
  } finally {
    db.close(false);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

