#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const { loadDotEnv } = require('../server/env');
const { readStore, writeStore, getStorePath } = require('../server/store');

loadDotEnv();

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || '');
    if (!token.startsWith('--')) continue;
    const eq = token.indexOf('=');
    if (eq >= 0) {
      out[token.slice(2, eq)] = token.slice(eq + 1);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || String(next).startsWith('--')) {
      out[key] = true;
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function boolArg(args, key, fallback = false) {
  if (!Object.prototype.hasOwnProperty.call(args, key)) return fallback;
  const raw = args[key];
  if (raw === true) return true;
  const v = String(raw).trim().toLowerCase();
  if (!v) return true;
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return fallback;
}

function resolvePath(baseDir, inputPath) {
  if (!inputPath) return null;
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(baseDir, inputPath);
}

function base58Encode(bytes) {
  let x = BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
  let out = '';
  while (x > 0n) {
    const mod = x % 58n;
    out = B58[Number(mod)] + out;
    x /= 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i += 1) out = `1${out}`;
  return out || '1';
}

function reservedHouseId(kind, key) {
  const seed = `agenttown:reserved:${kind}:${key}`;
  const bytes = crypto.createHash('sha256').update(seed).digest();
  return base58Encode(bytes);
}

function normalizeXHandle(input) {
  if (typeof input !== 'string') return null;
  const handle = input.trim().replace(/^@/, '').toLowerCase();
  if (!handle) return null;
  if (!/^[a-z0-9_]{1,15}$/.test(handle)) return null;
  return handle;
}

function normalizeEvmAddress(input) {
  if (typeof input !== 'string') return null;
  const v = input.trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(v)) return null;
  return v;
}

function normalizeSolanaAddress(input) {
  if (typeof input !== 'string') return null;
  const v = input.trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(v)) return null;
  return v;
}

function guessClaimChain(id) {
  const raw = typeof id === 'string' ? id.trim() : '';
  if (!raw) return null;
  if (/^solana:/i.test(raw)) return 'solana';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(raw)) return 'solana';
  return 'evm';
}

function addKnownClaimId(sets, value, chainHint = null) {
  if (typeof value !== 'string') return;
  const v = value.trim();
  if (!v) return;
  const chain = chainHint || guessClaimChain(v);
  if (chain === 'solana') {
    sets.solana.add(v);
    return;
  }
  sets.evm.add(v.toLowerCase());
}

function hasKnownClaimId(sets, chain, values) {
  if (!Array.isArray(values) || values.length === 0) return false;
  if (chain === 'solana') {
    return values.some((v) => typeof v === 'string' && sets.solana.has(v.trim()));
  }
  return values.some((v) => typeof v === 'string' && sets.evm.has(v.trim().toLowerCase()));
}

function hasLinkedHouseHint(rawJson) {
  if (typeof rawJson !== 'string' || !rawJson) return false;
  const lowered = rawJson.toLowerCase();
  if (!lowered.includes('house')) return false;

  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return false;
  }

  // Future reminder:
  // The platform will eventually mint ERC-8004 records already connected to a house.
  // When those fields become official, include them here so cron imports skip them.
  const linkKeys = new Set([
    'houseid',
    'house_id',
    'connectedhouseid',
    'connected_house_id',
    'linkedhouseid',
    'linked_house_id',
    'agenttownhouseid',
    'agent_town_house_id'
  ]);

  const queue = [parsed];
  let scanned = 0;
  while (queue.length > 0 && scanned < 200) {
    const node = queue.shift();
    scanned += 1;
    if (!node || typeof node !== 'object') continue;
    for (const [k, value] of Object.entries(node)) {
      const key = String(k || '').trim().toLowerCase();
      if (linkKeys.has(key)) {
        if (typeof value === 'string' && value.trim()) return true;
        if (typeof value === 'number' && Number.isFinite(value)) return true;
      }
      if (value && typeof value === 'object') queue.push(value);
    }
  }
  return false;
}

function tableExists(db, table) {
  const row = db.prepare(
    "SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1",
  ).get(table);
  return !!row;
}

function createReservation({ kind, key, houseId, meta }) {
  return {
    id: `rv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    kind,
    key,
    houseId,
    status: 'reserved',
    verifiedAt: null,
    claimedAt: null,
    meta: meta || {}
  };
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const args = parseArgs(process.argv.slice(2));

  const dryRun = boolArg(args, 'dry-run', false);
  const includeDrafts = boolArg(args, 'include-drafts', true);
  const skipColosseum = boolArg(args, 'skip-colosseum', false);
  const skipEvm = boolArg(args, 'skip-erc8004-evm', false);
  const skipSolana = boolArg(args, 'skip-erc8004-solana', false);
  const verbose = boolArg(args, 'verbose', false);

  const storePath = resolvePath(repoRoot, args['store-path'] || process.env.STORE_PATH || null);
  if (storePath) process.env.STORE_PATH = storePath;

  const colosseumDbPath = resolvePath(
    repoRoot,
    args['colosseum-sqlite'] || 'scripts/data/colosseum-agent-hackathon-projects.sqlite3',
  );
  const evmDbPath = resolvePath(
    repoRoot,
    args['erc8004-evm-sqlite'] || 'scripts/data/erc8004_EVM.sqlite3',
  );
  const solanaDbPath = resolvePath(
    repoRoot,
    args['erc8004-solana-sqlite'] || 'scripts/data/erc8004_solana.sqlite3',
  );

  const store = readStore();
  store.reservations = Array.isArray(store.reservations) ? store.reservations : [];
  store.claims = Array.isArray(store.claims) ? store.claims : [];
  store.anchors = Array.isArray(store.anchors) ? store.anchors : [];
  store.houses = Array.isArray(store.houses) ? store.houses : [];

  const reservationKeys = new Set(
    store.reservations
      .filter((r) => r && typeof r.kind === 'string' && typeof r.key === 'string')
      .map((r) => `${r.kind}|${r.key}`),
  );
  const houseIds = new Set(
    store.houses
      .filter((h) => h && typeof h.id === 'string')
      .map((h) => h.id),
  );
  const claimedXHandles = new Set(
    store.claims
      .filter((c) => c && c.kind === 'x' && typeof c.handle === 'string')
      .map((c) => c.handle.trim().toLowerCase()),
  );
  const knownClaimIds = { evm: new Set(), solana: new Set() };

  for (const reservation of store.reservations) {
    if (!reservation || reservation.kind !== 'erc8004') continue;
    const chain = reservation.meta?.claimChain || guessClaimChain(reservation.key);
    addKnownClaimId(knownClaimIds, reservation.key, chain);
    addKnownClaimId(knownClaimIds, reservation.meta?.agentId, chain);
    if (Array.isArray(reservation.meta?.claimAliases)) {
      for (const alias of reservation.meta.claimAliases) addKnownClaimId(knownClaimIds, alias, chain);
    }
  }

  for (const claim of store.claims) {
    if (!claim || claim.kind !== 'erc8004') continue;
    const chain = claim.claimChain || guessClaimChain(claim.agentId);
    addKnownClaimId(knownClaimIds, claim.agentId, chain);
    if (Array.isArray(claim.claimAliases)) {
      for (const alias of claim.claimAliases) addKnownClaimId(knownClaimIds, alias, chain);
    }
  }

  for (const anchor of store.anchors) {
    if (!anchor || typeof anchor.erc8004Id !== 'string') continue;
    addKnownClaimId(knownClaimIds, anchor.erc8004Id, null);
  }

  const stats = {
    colosseum: {
      seen: 0,
      added: 0,
      skipped_invalid_handle: 0,
      skipped_existing_reservation: 0,
      skipped_claimed: 0,
      skipped_house_exists: 0
    },
    erc8004_evm: {
      seen: 0,
      added: 0,
      skipped_missing_owner: 0,
      skipped_existing_reservation: 0,
      skipped_known_claim_id: 0,
      skipped_house_exists: 0,
      skipped_linked_in_source: 0
    },
    erc8004_solana: {
      seen: 0,
      added: 0,
      skipped_missing_owner: 0,
      skipped_existing_reservation: 0,
      skipped_known_claim_id: 0,
      skipped_house_exists: 0,
      skipped_linked_in_source: 0,
      skipped_table_missing: 0
    }
  };

  const newReservations = [];

  if (!skipColosseum) {
    if (!colosseumDbPath || !fs.existsSync(colosseumDbPath)) {
      throw new Error(`Missing Colosseum DB at ${colosseumDbPath}`);
    }
    const db = new DatabaseSync(colosseumDbPath);
    try {
      const where = includeDrafts
        ? "owner_x_username IS NOT NULL AND TRIM(owner_x_username) <> ''"
        : "owner_x_username IS NOT NULL AND TRIM(owner_x_username) <> '' AND status = 'submitted'";
      const rows = db.prepare(`
        SELECT id, slug, name, status, owner_x_username, owner_agent_name, team_name, updated_at, fetched_at
        FROM colosseum_agent_hackathon_projects
        WHERE ${where}
      `).all();
      stats.colosseum.seen = rows.length;

      for (const row of rows) {
        const handle = normalizeXHandle(row.owner_x_username || '');
        if (!handle) {
          stats.colosseum.skipped_invalid_handle += 1;
          continue;
        }
        const key = `@${handle}`;
        const reservationKey = `x|${key}`;
        if (reservationKeys.has(reservationKey)) {
          stats.colosseum.skipped_existing_reservation += 1;
          continue;
        }
        if (claimedXHandles.has(handle)) {
          stats.colosseum.skipped_claimed += 1;
          continue;
        }
        const houseId = reservedHouseId('x', key);
        if (houseIds.has(houseId)) {
          stats.colosseum.skipped_house_exists += 1;
          continue;
        }

        const reservation = createReservation({
          kind: 'x',
          key,
          houseId,
          meta: {
            source: 'colosseum',
            colosseumProjectId: Number(row.id),
            slug: typeof row.slug === 'string' ? row.slug : null,
            name: typeof row.name === 'string' ? row.name : null,
            status: typeof row.status === 'string' ? row.status : null,
            ownerAgentName: typeof row.owner_agent_name === 'string' ? row.owner_agent_name : null,
            teamName: typeof row.team_name === 'string' ? row.team_name : null,
            importedAt: new Date().toISOString(),
            sourceUpdatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
            sourceFetchedAt: typeof row.fetched_at === 'string' ? row.fetched_at : null
          }
        });
        newReservations.push(reservation);
        reservationKeys.add(reservationKey);
        houseIds.add(houseId);
        stats.colosseum.added += 1;
      }
    } finally {
      db.close();
    }
  }

  if (!skipEvm) {
    if (!evmDbPath || !fs.existsSync(evmDbPath)) {
      throw new Error(`Missing ERC8004 EVM DB at ${evmDbPath}`);
    }
    const db = new DatabaseSync(evmDbPath);
    try {
      const rows = db.prepare(`
        SELECT agent_id, chain_id, contract_address, token_id, owner_address, agent_wallet,
               is_testnet, name, created_at, updated_at, fetched_at, data_json
        FROM erc8004_agents
      `).all();
      stats.erc8004_evm.seen = rows.length;

      for (const row of rows) {
        const ownerAddress = normalizeEvmAddress(row.owner_address || '');
        if (!ownerAddress) {
          stats.erc8004_evm.skipped_missing_owner += 1;
          continue;
        }

        const chainId = Number(row.chain_id);
        const tokenId = String(row.token_id);
        const contractAddress = normalizeEvmAddress(row.contract_address || '');
        if (!Number.isFinite(chainId) || !tokenId || !contractAddress) {
          stats.erc8004_evm.skipped_missing_owner += 1;
          continue;
        }

        const canonicalAgentId = `${chainId}:${contractAddress}:${tokenId}`;
        const shortAgentId = `${chainId}:${tokenId}`;
        const aliases = [canonicalAgentId, shortAgentId, String(row.agent_id || '').trim()].filter(Boolean);

        const reservationKey = `erc8004|${canonicalAgentId}`;
        if (reservationKeys.has(reservationKey)) {
          stats.erc8004_evm.skipped_existing_reservation += 1;
          continue;
        }
        if (hasKnownClaimId(knownClaimIds, 'evm', aliases)) {
          stats.erc8004_evm.skipped_known_claim_id += 1;
          continue;
        }
        if (hasLinkedHouseHint(row.data_json)) {
          stats.erc8004_evm.skipped_linked_in_source += 1;
          continue;
        }

        const houseId = reservedHouseId('erc8004', canonicalAgentId);
        if (houseIds.has(houseId)) {
          stats.erc8004_evm.skipped_house_exists += 1;
          continue;
        }

        const reservation = createReservation({
          kind: 'erc8004',
          key: canonicalAgentId,
          houseId,
          meta: {
            source: 'erc8004scan',
            claimChain: 'evm',
            agentId: canonicalAgentId,
            claimAliases: [...new Set(aliases)],
            ownerAddress,
            agentWallet: normalizeEvmAddress(row.agent_wallet || ''),
            chainId,
            contractAddress,
            tokenId,
            isTestnet: Number(row.is_testnet || 0) === 1,
            name: typeof row.name === 'string' ? row.name : null,
            importedAt: new Date().toISOString(),
            sourceCreatedAt: typeof row.created_at === 'string' ? row.created_at : null,
            sourceUpdatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
            sourceFetchedAt: typeof row.fetched_at === 'string' ? row.fetched_at : null
          }
        });
        newReservations.push(reservation);
        reservationKeys.add(reservationKey);
        houseIds.add(houseId);
        for (const alias of aliases) addKnownClaimId(knownClaimIds, alias, 'evm');
        stats.erc8004_evm.added += 1;
      }
    } finally {
      db.close();
    }
  }

  if (!skipSolana) {
    if (!solanaDbPath || !fs.existsSync(solanaDbPath)) {
      if (verbose) {
        console.log(`[claimable-import] Solana DB missing, skipping: ${solanaDbPath}`);
      }
      stats.erc8004_solana.skipped_table_missing += 1;
    } else {
      const db = new DatabaseSync(solanaDbPath);
      try {
        if (!tableExists(db, 'erc8004_solana_agents')) {
          stats.erc8004_solana.skipped_table_missing += 1;
        } else {
          const rows = db.prepare(`
            SELECT asset, owner, agent_wallet, collection, cluster, created_at, updated_at, fetched_at, registration_json
            FROM erc8004_solana_agents
          `).all();
          stats.erc8004_solana.seen = rows.length;

          for (const row of rows) {
            const asset = typeof row.asset === 'string' ? row.asset.trim() : '';
            const ownerAddress = normalizeSolanaAddress(row.owner || '');
            if (!asset || !ownerAddress) {
              stats.erc8004_solana.skipped_missing_owner += 1;
              continue;
            }

            const canonicalAgentId = `solana:${asset}`;
            const aliases = [canonicalAgentId, asset];

            const reservationKey = `erc8004|${canonicalAgentId}`;
            if (reservationKeys.has(reservationKey)) {
              stats.erc8004_solana.skipped_existing_reservation += 1;
              continue;
            }
            if (hasKnownClaimId(knownClaimIds, 'solana', aliases)) {
              stats.erc8004_solana.skipped_known_claim_id += 1;
              continue;
            }
            if (hasLinkedHouseHint(row.registration_json)) {
              stats.erc8004_solana.skipped_linked_in_source += 1;
              continue;
            }

            const houseId = reservedHouseId('erc8004', canonicalAgentId);
            if (houseIds.has(houseId)) {
              stats.erc8004_solana.skipped_house_exists += 1;
              continue;
            }

            const reservation = createReservation({
              kind: 'erc8004',
              key: canonicalAgentId,
              houseId,
              meta: {
                source: 'erc8004_solana',
                claimChain: 'solana',
                agentId: canonicalAgentId,
                claimAliases: aliases,
                ownerAddress,
                agentWallet: normalizeSolanaAddress(row.agent_wallet || ''),
                collection: typeof row.collection === 'string' ? row.collection : null,
                cluster: typeof row.cluster === 'string' ? row.cluster : null,
                importedAt: new Date().toISOString(),
                sourceCreatedAt: typeof row.created_at === 'string' ? row.created_at : null,
                sourceUpdatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
                sourceFetchedAt: typeof row.fetched_at === 'string' ? row.fetched_at : null
              }
            });
            newReservations.push(reservation);
            reservationKeys.add(reservationKey);
            houseIds.add(houseId);
            for (const alias of aliases) addKnownClaimId(knownClaimIds, alias, 'solana');
            stats.erc8004_solana.added += 1;
          }
        }
      } finally {
        db.close();
      }
    }
  }

  const nextCount = store.reservations.length + newReservations.length;
  if (!dryRun && newReservations.length > 0) {
    store.reservations.push(...newReservations);
    writeStore(store);
  }

  const summary = {
    dryRun,
    storePath: getStorePath(),
    added: newReservations.length,
    reservationsBefore: store.reservations.length,
    reservationsAfter: nextCount,
    stats
  };
  console.log(JSON.stringify(summary, null, 2));
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.stack || err.message : String(err));
  process.exit(1);
}
