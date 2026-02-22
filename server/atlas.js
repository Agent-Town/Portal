const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ATLAS_FORMULA = Object.freeze({
  base: 1,
  scale: 2
});

const DEFAULT_SQLITE_PATH = path.join(process.cwd(), 'data', 'erc8004.sqlite3');

const CHAIN_FAMILY_BY_ID = new Map([
  [1, { key: 'ethereum', label: 'Ethereum' }],
  [11155111, { key: 'ethereum', label: 'Ethereum' }],
  [143, { key: 'monad', label: 'Monad' }],
  [10143, { key: 'monad', label: 'Monad' }],
  [8453, { key: 'base', label: 'Base' }],
  [84532, { key: 'base', label: 'Base' }],
  [100, { key: 'gnosis', label: 'Gnosis' }],
  [56, { key: 'bsc', label: 'BSC' }],
  [97, { key: 'bsc', label: 'BSC' }],
  [42161, { key: 'arbitrum', label: 'Arbitrum' }],
  [421614, { key: 'arbitrum', label: 'Arbitrum' }],
  [10, { key: 'optimism', label: 'Optimism' }],
  [137, { key: 'polygon', label: 'Polygon' }],
  [42220, { key: 'celo', label: 'Celo' }],
  [11142220, { key: 'celo', label: 'Celo' }],
  [43114, { key: 'avalanche', label: 'Avalanche' }],
  [43113, { key: 'avalanche', label: 'Avalanche' }],
  [4326, { key: 'megaeth', label: 'MegaETH' }],
  [6343, { key: 'megaeth', label: 'MegaETH' }],
  [1088, { key: 'metis', label: 'Metis' }],
  [59144, { key: 'linea', label: 'Linea' }],
  [534352, { key: 'scroll', label: 'Scroll' }],
  [5000, { key: 'mantle', label: 'Mantle' }],
  [196, { key: 'x-layer', label: 'X Layer' }],
  [2741, { key: 'abstract', label: 'Abstract' }],
  [167000, { key: 'taiko', label: 'Taiko' }]
]);

const TEST_CHAIN_ROWS = Object.freeze([
  { chainId: 1, chainName: 'Ethereum Mainnet', isTestnet: false, agents: 120 },
  { chainId: 11155111, chainName: 'Ethereum Sepolia', isTestnet: true, agents: 30 },
  { chainId: 143, chainName: 'Monad', isTestnet: false, agents: 90 },
  { chainId: 10143, chainName: 'Monad Testnet', isTestnet: true, agents: 20 },
  { chainId: 8453, chainName: 'Base', isTestnet: false, agents: 75 },
  { chainId: 84532, chainName: 'Base Sepolia', isTestnet: true, agents: 20 },
  { chainId: 100, chainName: 'Gnosis', isTestnet: false, agents: 60 }
]);

const TEST_AGENTS = Object.freeze([
  {
    erc8004Id: '1:1001',
    chainId: 1,
    name: 'Atlas Sentinel',
    description: 'Monitors Ethereum district integrity.',
    imageUrl: null,
    sharePath: '/s/sh_fixture_eth'
  },
  {
    erc8004Id: '143:2001',
    chainId: 143,
    name: 'Monad Courier',
    description: 'Handles Monad district routing.',
    imageUrl: null,
    sharePath: '/s/sh_fixture_monad'
  },
  {
    erc8004Id: '8453:3001',
    chainId: 8453,
    name: 'Base Quartermaster',
    description: 'Coordinates Base district storefronts.',
    imageUrl: null,
    sharePath: '/s/sh_fixture_base'
  },
  {
    erc8004Id: '100:4001',
    chainId: 100,
    name: 'Gnosis Archivist',
    description: 'Curates Gnosis district profiles.',
    imageUrl: null,
    sharePath: '/s/sh_fixture_gnosis'
  }
]);

function toSlug(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatFamilyLabel(rawName, chainId) {
  const cleaned = String(rawName || '')
    .replace(/\b(mainnet|testnet|sepolia|devnet|fuji)\b/ig, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned) return cleaned;
  return `Chain ${chainId}`;
}

function getFamilyForChain(row) {
  const byId = CHAIN_FAMILY_BY_ID.get(Number(row.chainId));
  if (byId) return byId;
  const label = formatFamilyLabel(row.chainName, row.chainId);
  const key = toSlug(label) || `chain-${row.chainId}`;
  return { key, label };
}

function computeDistrictSize(totalAgents, formula = ATLAS_FORMULA) {
  const total = Math.max(0, Number(totalAgents) || 0);
  const raw = formula.base + formula.scale * Math.log10(1 + total);
  return Number(raw.toFixed(4));
}

function buildDistricts(chainRows, formula = ATLAS_FORMULA) {
  const districtsByKey = new Map();

  for (const row of chainRows) {
    const chainId = Number(row.chainId);
    if (!Number.isFinite(chainId)) continue;
    const agents = Math.max(0, Number(row.agents) || 0);
    if (agents <= 0) continue;

    const isTestnet = Number(row.isTestnet) === 1 || row.isTestnet === true;
    const family = getFamilyForChain(row);
    const existing = districtsByKey.get(family.key) || {
      key: family.key,
      label: family.label,
      totalAgents: 0,
      districtSize: 0,
      mainnet: { agents: 0, chains: [] },
      testnets: { agents: 0, chains: [] }
    };

    const chainEntry = {
      chainId,
      name: String(row.chainName || `Chain ${chainId}`),
      agents
    };

    if (isTestnet) {
      existing.testnets.agents += agents;
      existing.testnets.chains.push(chainEntry);
    } else {
      existing.mainnet.agents += agents;
      existing.mainnet.chains.push(chainEntry);
    }

    existing.totalAgents += agents;
    districtsByKey.set(family.key, existing);
  }

  const districts = [...districtsByKey.values()].map((district) => {
    district.mainnet.chains.sort((a, b) => b.agents - a.agents || a.chainId - b.chainId);
    district.testnets.chains.sort((a, b) => b.agents - a.agents || a.chainId - b.chainId);
    district.districtSize = computeDistrictSize(district.totalAgents, formula);
    return district;
  });

  districts.sort((a, b) => b.totalAgents - a.totalAgents || a.label.localeCompare(b.label));
  return districts;
}

function buildAgents(agentRows) {
  const seen = new Set();
  const out = [];
  for (const row of agentRows) {
    const erc8004Id = String(row.erc8004Id || '').trim();
    if (!erc8004Id || seen.has(erc8004Id)) continue;
    seen.add(erc8004Id);
    const chainId = Number(row.chainId);
    const family = getFamilyForChain({ chainId, chainName: '' });
    const networkType = row.isTestnet === true ? 'testnet' : 'mainnet';
    out.push({
      erc8004Id,
      chainId,
      districtKey: family.key,
      name: String(row.name || '').trim() || `Agent ${erc8004Id}`,
      description: String(row.description || '').trim() || '',
      chainName: String(row.chainName || '').trim() || null,
      networkType,
      ownerAddress: String(row.ownerAddress || '').trim() || null,
      createdAt: row.createdAt ? String(row.createdAt) : null,
      updatedAt: row.updatedAt ? String(row.updatedAt) : null,
      source: String(row.source || '8004scan').trim() || '8004scan',
      imageUrl: row.imageUrl ? String(row.imageUrl) : null,
      sharePath: row.sharePath ? String(row.sharePath) : null
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name) || a.erc8004Id.localeCompare(b.erc8004Id));
  return out;
}

function attachDistrictAgentViews(districts, agents) {
  const agentsByDistrict = new Map();
  for (const agent of agents) {
    const key = String(agent.districtKey || '').trim();
    if (!key) continue;
    if (!agentsByDistrict.has(key)) agentsByDistrict.set(key, []);
    agentsByDistrict.get(key).push(agent);
  }

  for (const list of agentsByDistrict.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name) || a.erc8004Id.localeCompare(b.erc8004Id));
  }

  return districts.map((district) => {
    const list = agentsByDistrict.get(district.key) || [];
    return {
      ...district,
      agentCount: list.length,
      previewAgents: list.slice(0, 3).map((agent) => ({
        erc8004Id: agent.erc8004Id,
        name: agent.name,
        sharePath: agent.sharePath || null
      }))
    };
  });
}

function normalizeAtlasSearchText(value) {
  return String(value || '').trim().toLowerCase();
}

function scoreAtlasAgent(agent, district, queryText) {
  const q = normalizeAtlasSearchText(queryText);
  if (!q) return 0;

  const id = normalizeAtlasSearchText(agent?.erc8004Id);
  const name = normalizeAtlasSearchText(agent?.name);
  const description = normalizeAtlasSearchText(agent?.description);
  const districtKey = normalizeAtlasSearchText(agent?.districtKey);
  const districtLabel = normalizeAtlasSearchText(district?.label);
  const chainIdText = String(agent?.chainId || '');

  let score = 0;

  if (id === q) score += 1100;
  else if (id.startsWith(q)) score += 900;
  else if (id.includes(q)) score += 700;

  if (name === q) score += 1000;
  else if (name.startsWith(q)) score += 800;
  else if (name.includes(q)) score += 600;

  if (description.includes(q)) score += 220;
  if (districtLabel.includes(q)) score += 180;
  if (districtKey.includes(q)) score += 140;
  if (chainIdText === q) score += 500;

  const tokens = q.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (token.length < 2) continue;
    if (name.includes(token)) score += 35;
    if (description.includes(token)) score += 20;
    if (districtLabel.includes(token)) score += 15;
  }

  return score;
}

function searchAtlasAgents(snapshot, opts = {}) {
  const q = normalizeAtlasSearchText(opts.q);
  const family = normalizeAtlasSearchText(opts.family);
  const limitRaw = Number(opts.limit);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(100, Math.max(1, Math.trunc(limitRaw)))
    : 20;

  const districts = Array.isArray(snapshot?.districts) ? snapshot.districts : [];
  const agents = Array.isArray(snapshot?.agents) ? snapshot.agents : [];
  const districtsByKey = new Map(districts.map((d) => [d.key, d]));

  const ranked = [];
  for (const agent of agents) {
    const districtKey = normalizeAtlasSearchText(agent?.districtKey);
    if (family && districtKey !== family) continue;

    const district = districtsByKey.get(agent?.districtKey) || null;
    const lexicalScore = scoreAtlasAgent(agent, district, q);
    if (q && lexicalScore <= 0) continue;

    ranked.push({
      agent,
      district,
      lexicalScore,
      districtAgents: Number(district?.totalAgents || 0)
    });
  }

  ranked.sort((a, b) => {
    if (b.lexicalScore !== a.lexicalScore) return b.lexicalScore - a.lexicalScore;
    if (b.districtAgents !== a.districtAgents) return b.districtAgents - a.districtAgents;
    const aName = String(a.agent?.name || '');
    const bName = String(b.agent?.name || '');
    const byName = aName.localeCompare(bName);
    if (byName !== 0) return byName;
    return String(a.agent?.erc8004Id || '').localeCompare(String(b.agent?.erc8004Id || ''));
  });

  const total = ranked.length;
  const results = ranked.slice(0, limit).map((entry) => ({
    erc8004Id: entry.agent.erc8004Id,
    chainId: entry.agent.chainId,
    chainName: entry.agent.chainName || null,
    networkType: entry.agent.networkType || null,
    districtKey: entry.agent.districtKey,
    districtLabel: entry.district?.label || entry.agent.districtKey,
    name: entry.agent.name,
    description: entry.agent.description,
    ownerAddress: entry.agent.ownerAddress || null,
    updatedAt: entry.agent.updatedAt || null,
    source: entry.agent.source || '8004scan',
    imageUrl: entry.agent.imageUrl || null,
    sharePath: entry.agent.sharePath || null,
    lexicalScore: entry.lexicalScore
  }));

  return {
    query: q,
    family,
    limit,
    total,
    results
  };
}

function hasSqliteTable(db, tableName) {
  const table = String(tableName || '').trim();
  if (!table || !/^[a-zA-Z0-9_]+$/.test(table)) return false;
  try {
    const row = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1"
    ).get(table);
    return !!row;
  } catch {
    return false;
  }
}

function getSqliteTableColumns(db, tableName) {
  const table = String(tableName || '').trim();
  if (!table || !/^[a-zA-Z0-9_]+$/.test(table)) return new Set();
  try {
    const rows = db.prepare(`PRAGMA table_info(${table})`).all();
    return new Set(rows.map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function readChainRowsFromSqlite(sqlitePath = DEFAULT_SQLITE_PATH) {
  if (!fs.existsSync(sqlitePath)) return [];

  let db;
  try {
    db = new DatabaseSync(sqlitePath, { readOnly: true });
    const rows = db.prepare(
      [
        'SELECT',
        '  a.chain_id AS chainId,',
        '  COUNT(*) AS agents,',
        "  COALESCE(c.name, 'Chain ' || a.chain_id) AS chainName,",
        '  COALESCE(c.is_testnet, 0) AS isTestnet',
        'FROM erc8004_agents a',
        'LEFT JOIN erc8004_chains c ON c.chain_id = a.chain_id',
        'GROUP BY a.chain_id, c.name, c.is_testnet'
      ].join('\n')
    ).all();
    return rows.map((row) => ({
      chainId: Number(row.chainId),
      chainName: String(row.chainName || ''),
      isTestnet: Number(row.isTestnet) === 1,
      agents: Number(row.agents) || 0
    }));
  } catch {
    return [];
  } finally {
    try {
      db?.close();
    } catch {
      // ignore close errors
    }
  }
}

function readAgentsFromSqlite(sqlitePath = DEFAULT_SQLITE_PATH, limit = 1500) {
  if (!fs.existsSync(sqlitePath)) return [];

  let db;
  try {
    db = new DatabaseSync(sqlitePath, { readOnly: true });
    const cols = getSqliteTableColumns(db, 'erc8004_agents');
    const hasUpdatedAt = cols.has('updated_at');
    const hasCreatedAt = cols.has('created_at');
    const hasOwnerAddress = cols.has('owner_address');
    const hasChainsTable = hasSqliteTable(db, 'erc8004_chains');
    const orderBy = hasUpdatedAt ? 'a.updated_at DESC' : 'a.rowid DESC';

    const rows = db.prepare(
      [
        'SELECT',
        '  a.agent_id AS erc8004Id,',
        '  a.chain_id AS chainId,',
        "  COALESCE(a.name, '') AS name,",
        "  COALESCE(a.description, '') AS description,",
        "  COALESCE(a.image_url, '') AS imageUrl,",
        `  ${hasOwnerAddress ? "COALESCE(a.owner_address, '')" : "''"} AS ownerAddress,`,
        `  ${hasCreatedAt ? "COALESCE(a.created_at, '')" : "''"} AS createdAt,`,
        `  ${hasUpdatedAt ? "COALESCE(a.updated_at, '')" : "''"} AS updatedAt,`,
        `  ${hasChainsTable ? "COALESCE(c.name, '')" : "''"} AS chainName,`,
        `  ${hasChainsTable ? 'COALESCE(c.is_testnet, 0)' : '0'} AS isTestnet`,
        'FROM erc8004_agents a',
        ...(hasChainsTable ? ['LEFT JOIN erc8004_chains c ON c.chain_id = a.chain_id'] : []),
        "WHERE a.agent_id IS NOT NULL AND TRIM(a.agent_id) <> ''",
        `ORDER BY ${orderBy}`,
        'LIMIT ?'
      ].join('\n')
    ).all(limit);
    return rows.map((row) => ({
      erc8004Id: String(row.erc8004Id || ''),
      chainId: Number(row.chainId),
      name: String(row.name || ''),
      description: String(row.description || ''),
      chainName: String(row.chainName || ''),
      isTestnet: Number(row.isTestnet) === 1,
      ownerAddress: String(row.ownerAddress || ''),
      createdAt: String(row.createdAt || ''),
      updatedAt: String(row.updatedAt || ''),
      source: '8004scan',
      imageUrl: String(row.imageUrl || ''),
      sharePath: null
    }));
  } catch {
    return [];
  } finally {
    try {
      db?.close();
    } catch {
      // ignore close errors
    }
  }
}

function getAtlasSnapshot({ env = process.env.NODE_ENV, sqlitePath = DEFAULT_SQLITE_PATH } = {}) {
  const formula = { ...ATLAS_FORMULA };
  if (env === 'test') {
    const agents = buildAgents(TEST_AGENTS);
    const districts = attachDistrictAgentViews(buildDistricts(TEST_CHAIN_ROWS, formula), agents);
    return {
      meta: {
        source: 'fixture-test-v1',
        formula
      },
      districts,
      agents
    };
  }

  const chainRows = readChainRowsFromSqlite(sqlitePath);
  const agents = buildAgents(readAgentsFromSqlite(sqlitePath));
  const source = chainRows.length > 0
    ? `sqlite:${path.relative(process.cwd(), sqlitePath) || sqlitePath}`
    : 'empty';
  const districts = attachDistrictAgentViews(buildDistricts(chainRows, formula), agents);
  return {
    meta: {
      source,
      formula
    },
    districts,
    agents
  };
}

module.exports = {
  ATLAS_FORMULA,
  getAtlasSnapshot,
  computeDistrictSize,
  buildDistricts,
  searchAtlasAgents
};
