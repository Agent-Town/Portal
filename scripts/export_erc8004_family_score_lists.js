#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DEFAULT_SQLITE_PATH = './data/erc8004.sqlite3';
const DEFAULT_OUT_DIR = './data/erc8004-family-score-lists';
const DEFAULT_MIN_HIGH_SCORE = 80;
const DEFAULT_FILL_MIN_SCORE = 60;
const DEFAULT_TARGET_PER_FAMILY = 50;
const DEFAULT_MIN_PER_CHAIN = 10;
const DEFAULT_INCLUDE_TESTNETS = false;
const DEFAULT_EXCLUDE_AGENT_FILE = null;

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

function nonEmpty(value) {
  if (typeof value !== 'string') return null;
  const out = value.trim();
  return out ? out : null;
}

function safeFileId(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'family';
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (!text.includes(',') && !text.includes('"') && !text.includes('\n')) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function printHelp() {
  process.stdout.write(
    [
      'Export per-family ERC-8004 generation lists with score and chain coverage rules.',
      '',
      'Rules:',
      '  1) Include all agents with score >= min-high-score (default 80)',
      '  2) If selected count < target-per-family (default 50), fill from [fill-min-score, min-high-score) (default 60-79)',
      '  3) Ensure at least min-per-chain (default 10) selected per chain, or all chain agents if fewer',
      '',
      'Usage:',
      '  node scripts/export_erc8004_family_score_lists.js [options]',
      '',
      'Options:',
      `  --sqlite-path <path>          SQLite source (default: ${DEFAULT_SQLITE_PATH})`,
      `  --out-dir <path>              Output dir (default: ${DEFAULT_OUT_DIR})`,
      `  --min-high-score <n>          High score threshold (default: ${DEFAULT_MIN_HIGH_SCORE})`,
      `  --fill-min-score <n>          Fill band minimum score (default: ${DEFAULT_FILL_MIN_SCORE})`,
      `  --target-per-family <n>       Target selected count before chain fill (default: ${DEFAULT_TARGET_PER_FAMILY})`,
      `  --min-per-chain <n>           Minimum selected per chain (default: ${DEFAULT_MIN_PER_CHAIN})`,
      '  --exclude-agent-file <path>   Optional list of ERC-8004 IDs to remove from selection',
      '  --exclude-agent-id <id>       Repeatable ERC-8004 ID to remove from selection',
      `  --include-testnets            Include testnet agents in family lists (default: ${DEFAULT_INCLUDE_TESTNETS})`,
      '  --help',
      '',
      'Outputs:',
      '  <out-dir>/families/<family>.txt',
      '  <out-dir>/families/<family>.csv',
      '  <out-dir>/summary.csv',
      '  <out-dir>/summary.json'
    ].join('\n') + '\n'
  );
}

function parseArgs(argv) {
  const opts = {
    sqlitePath: DEFAULT_SQLITE_PATH,
    outDir: DEFAULT_OUT_DIR,
    minHighScore: DEFAULT_MIN_HIGH_SCORE,
    fillMinScore: DEFAULT_FILL_MIN_SCORE,
    targetPerFamily: DEFAULT_TARGET_PER_FAMILY,
    minPerChain: DEFAULT_MIN_PER_CHAIN,
    excludeAgentFile: DEFAULT_EXCLUDE_AGENT_FILE,
    excludeAgentIds: [],
    includeTestnets: DEFAULT_INCLUDE_TESTNETS,
    help: false
  };

  function nextValue(i, flag) {
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`MISSING_VALUE:${flag}`);
    return value;
  }

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help') {
      opts.help = true;
      continue;
    }
    if (token === '--sqlite-path') {
      opts.sqlitePath = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--sqlite-path=')) {
      opts.sqlitePath = token.slice('--sqlite-path='.length);
      continue;
    }
    if (token === '--out-dir') {
      opts.outDir = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--out-dir=')) {
      opts.outDir = token.slice('--out-dir='.length);
      continue;
    }
    if (token === '--min-high-score') {
      opts.minHighScore = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--min-high-score=')) {
      opts.minHighScore = Number(token.slice('--min-high-score='.length));
      continue;
    }
    if (token === '--fill-min-score') {
      opts.fillMinScore = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--fill-min-score=')) {
      opts.fillMinScore = Number(token.slice('--fill-min-score='.length));
      continue;
    }
    if (token === '--target-per-family') {
      opts.targetPerFamily = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--target-per-family=')) {
      opts.targetPerFamily = Number(token.slice('--target-per-family='.length));
      continue;
    }
    if (token === '--min-per-chain') {
      opts.minPerChain = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--min-per-chain=')) {
      opts.minPerChain = Number(token.slice('--min-per-chain='.length));
      continue;
    }
    if (token === '--exclude-agent-file') {
      opts.excludeAgentFile = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--exclude-agent-file=')) {
      opts.excludeAgentFile = token.slice('--exclude-agent-file='.length);
      continue;
    }
    if (token === '--exclude-agent-id') {
      opts.excludeAgentIds.push(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--exclude-agent-id=')) {
      opts.excludeAgentIds.push(token.slice('--exclude-agent-id='.length));
      continue;
    }
    if (token === '--include-testnets') {
      opts.includeTestnets = true;
      continue;
    }
    throw new Error(`UNKNOWN_ARG:${token}`);
  }

  opts.sqlitePath = path.resolve(opts.sqlitePath);
  opts.outDir = path.resolve(opts.outDir);
  opts.excludeAgentFile = opts.excludeAgentFile ? path.resolve(opts.excludeAgentFile) : null;
  opts.excludeAgentIds = opts.excludeAgentIds.map((value) => nonEmpty(value)).filter(Boolean);
  opts.minHighScore = Number.isFinite(opts.minHighScore) ? opts.minHighScore : DEFAULT_MIN_HIGH_SCORE;
  opts.fillMinScore = Number.isFinite(opts.fillMinScore) ? opts.fillMinScore : DEFAULT_FILL_MIN_SCORE;
  opts.targetPerFamily = Number.isFinite(opts.targetPerFamily) ? Math.max(1, Math.floor(opts.targetPerFamily)) : DEFAULT_TARGET_PER_FAMILY;
  opts.minPerChain = Number.isFinite(opts.minPerChain) ? Math.max(1, Math.floor(opts.minPerChain)) : DEFAULT_MIN_PER_CHAIN;
  if (opts.fillMinScore > opts.minHighScore) throw new Error('INVALID_SCORE_BAND:fill-min-score > min-high-score');
  return opts;
}

function extractAgentIdFromRecord(value) {
  if (typeof value === 'string') return nonEmpty(value);
  if (!value || typeof value !== 'object') return null;
  return nonEmpty(value.erc8004Id) || nonEmpty(value.agentId) || nonEmpty(value.id);
}

function collectAgentIdFromLine(line, out) {
  const text = nonEmpty(line);
  if (!text || text.startsWith('#')) return;

  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const id = extractAgentIdFromRecord(item);
          if (id) out.add(id);
        }
        return;
      }
      const id = extractAgentIdFromRecord(parsed);
      if (id) out.add(id);
      return;
    } catch {
      // fall through to delimited parsing
    }
  }

  const first = nonEmpty(text.split(/[,\t\s]/)[0]);
  if (!first) return;
  const lowered = first.toLowerCase();
  if (lowered === 'erc8004id' || lowered === 'agentid' || lowered === 'agent_id' || lowered === 'id') return;
  out.add(first);
}

function loadExcludedAgentIds(opts) {
  const out = new Set(opts.excludeAgentIds || []);
  if (!opts.excludeAgentFile) return out;
  if (!fs.existsSync(opts.excludeAgentFile)) {
    throw new Error(`EXCLUDE_AGENT_FILE_NOT_FOUND:${opts.excludeAgentFile}`);
  }

  const raw = fs.readFileSync(opts.excludeAgentFile, 'utf8');
  const ext = path.extname(opts.excludeAgentFile).toLowerCase();

  if (ext === '.json') {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const id = extractAgentIdFromRecord(item);
        if (id) out.add(id);
      }
      return out;
    }
    const ids = Array.isArray(parsed?.ids) ? parsed.ids : [];
    for (const item of ids) {
      const id = extractAgentIdFromRecord(item);
      if (id) out.add(id);
    }
    return out;
  }

  const lines = raw.split(/\r?\n/);
  for (const line of lines) collectAgentIdFromLine(line, out);
  return out;
}

function resolveFamily(chainId, chainName) {
  const known = CHAIN_FAMILY_BY_ID.get(Number(chainId));
  if (known) return known;
  const label = nonEmpty(chainName) || `Chain ${chainId}`;
  const key = safeFileId(label);
  return { key, label };
}

function compareAgents(a, b) {
  const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
  if (scoreDiff !== 0) return scoreDiff;
  const chainDiff = Number(a.chainId || 0) - Number(b.chainId || 0);
  if (chainDiff !== 0) return chainDiff;
  return String(a.erc8004Id || '').localeCompare(String(b.erc8004Id || ''));
}

function loadAgents(sqlitePath) {
  if (!fs.existsSync(sqlitePath)) throw new Error(`SQLITE_NOT_FOUND:${sqlitePath}`);
  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    const rows = db.prepare(
      [
        'SELECT',
        '  a.agent_id AS erc8004Id,',
        '  a.chain_id AS chainId,',
        "  COALESCE(c.name, 'Chain ' || a.chain_id) AS chainName,",
        '  COALESCE(c.is_testnet, a.is_testnet, 0) AS isTestnet,',
        "  COALESCE(a.name, '') AS name,",
        "  COALESCE(a.description, '') AS description,",
        "  CAST(json_extract(a.data_json, '$.total_score') AS REAL) AS totalScore",
        'FROM erc8004_agents a',
        'LEFT JOIN erc8004_chains c ON c.chain_id = a.chain_id',
        "WHERE a.agent_id IS NOT NULL AND TRIM(a.agent_id) <> ''",
        'ORDER BY a.chain_id ASC, a.agent_id ASC'
      ].join('\n')
    ).all();

    const out = [];
    for (const row of rows) {
      const family = resolveFamily(row.chainId, row.chainName);
      const scoreRaw = Number(row.totalScore);
      const score = Number.isFinite(scoreRaw) ? scoreRaw : 0;
      out.push({
        erc8004Id: String(row.erc8004Id),
        chainId: Number(row.chainId),
        chainName: String(row.chainName || ''),
        networkType: Number(row.isTestnet) === 1 ? 'testnet' : 'mainnet',
        familyKey: family.key,
        familyLabel: family.label,
        score: Number(score.toFixed(2)),
        name: nonEmpty(row.name),
        description: nonEmpty(row.description)
      });
    }
    return out;
  } finally {
    db.close();
  }
}

function writeFamilyCsv(filePath, rows) {
  const columns = [
    'erc8004Id',
    'score',
    'chainId',
    'chainName',
    'networkType',
    'familyKey',
    'selectedBy'
  ];
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((key) => csvEscape(row[key])).join(','));
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function selectForFamily(familyRows, opts) {
  const sorted = familyRows.slice().sort(compareAgents);
  const byChain = new Map();
  for (const row of sorted) {
    const key = String(row.chainId);
    if (!byChain.has(key)) byChain.set(key, []);
    byChain.get(key).push(row);
  }

  const selected = new Map();

  function addAgent(agent, reason) {
    if (!selected.has(agent.erc8004Id)) {
      selected.set(agent.erc8004Id, {
        ...agent,
        _reasons: new Set([reason])
      });
      return;
    }
    selected.get(agent.erc8004Id)._reasons.add(reason);
  }

  for (const agent of sorted) {
    if (agent.score >= opts.minHighScore) addAgent(agent, `score>=${opts.minHighScore}`);
  }

  if (selected.size < opts.targetPerFamily) {
    for (const agent of sorted) {
      if (agent.score >= opts.fillMinScore && agent.score < opts.minHighScore) {
        addAgent(agent, `${opts.fillMinScore}-${opts.minHighScore - 1} fill`);
      }
      if (selected.size >= opts.targetPerFamily) break;
    }
  }

  for (const chainRows of byChain.values()) {
    const needed = Math.min(opts.minPerChain, chainRows.length);
    for (let i = 0; i < needed; i += 1) {
      addAgent(chainRows[i], `chain minimum ${opts.minPerChain}`);
    }
  }

  const out = [...selected.values()].map((row) => ({
    ...row,
    selectedBy: [...row._reasons].sort().join(' | ')
  }));
  out.sort(compareAgents);
  return out;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  const agents = loadAgents(opts.sqlitePath);
  const networkScopedAgents = opts.includeTestnets
    ? agents.slice()
    : agents.filter((row) => row.networkType !== 'testnet');
  const excludedTestnetAgents = Math.max(0, agents.length - networkScopedAgents.length);
  const excludedIds = loadExcludedAgentIds(opts);
  const planningAgents = networkScopedAgents.filter((row) => !excludedIds.has(row.erc8004Id));
  const excludedByPolicy = Math.max(0, networkScopedAgents.length - planningAgents.length);
  const byFamily = new Map();
  for (const agent of planningAgents) {
    if (!byFamily.has(agent.familyKey)) byFamily.set(agent.familyKey, []);
    byFamily.get(agent.familyKey).push(agent);
  }

  fs.rmSync(opts.outDir, { recursive: true, force: true });
  ensureDir(opts.outDir);
  const familyDir = path.join(opts.outDir, 'families');
  ensureDir(familyDir);

  const summaryRows = [];

  const familyKeys = [...byFamily.keys()].sort((a, b) => a.localeCompare(b));
  for (const familyKey of familyKeys) {
    const familyRows = byFamily.get(familyKey) || [];
    const selected = selectForFamily(familyRows, opts);
    const label = familyRows[0]?.familyLabel || familyKey;

    const txtPath = path.join(familyDir, `${safeFileId(familyKey)}.txt`);
    const csvPath = path.join(familyDir, `${safeFileId(familyKey)}.csv`);

    fs.writeFileSync(txtPath, `${selected.map((row) => row.erc8004Id).join('\n')}${selected.length ? '\n' : ''}`, 'utf8');
    writeFamilyCsv(csvPath, selected);

    const chainCounts = {};
    for (const row of selected) {
      const key = `${row.chainId}`;
      chainCounts[key] = (chainCounts[key] || 0) + 1;
    }

    const totalHigh = familyRows.filter((row) => row.score >= opts.minHighScore).length;
    const totalBand = familyRows.filter((row) => row.score >= opts.fillMinScore && row.score < opts.minHighScore).length;

    summaryRows.push({
      familyKey,
      familyLabel: label,
      totalAgents: familyRows.length,
      selectedAgents: selected.length,
      highScoreAgents: totalHigh,
      fillBandAgents: totalBand,
      chainsInFamily: new Set(familyRows.map((row) => String(row.chainId))).size,
      minSelectedAcrossChains: Object.keys(chainCounts).length ? Math.min(...Object.values(chainCounts)) : 0,
      listPath: txtPath
    });
  }

  summaryRows.sort((a, b) => b.selectedAgents - a.selectedAgents || a.familyKey.localeCompare(b.familyKey));

  const summaryJson = {
    generatedAt: new Date().toISOString(),
    rules: {
      highScoreAtLeast: opts.minHighScore,
      fillBandMin: opts.fillMinScore,
      targetPerFamily: opts.targetPerFamily,
      minPerChain: opts.minPerChain,
      planningNetwork: opts.includeTestnets ? 'all' : 'mainnet-only',
      excludedAgents: {
        file: opts.excludeAgentFile || null,
        explicitIds: opts.excludeAgentIds.length,
        totalLoaded: excludedIds.size
      }
    },
    counts: {
      agentsInSqlite: agents.length,
      networkScopedAgents: networkScopedAgents.length,
      planningAgents: planningAgents.length,
      excludedTestnetAgents,
      excludedByPolicy
    },
    families: summaryRows
  };
  fs.writeFileSync(path.join(opts.outDir, 'summary.json'), `${JSON.stringify(summaryJson, null, 2)}\n`, 'utf8');

  const summaryCsvCols = [
    'familyKey',
    'familyLabel',
    'totalAgents',
    'selectedAgents',
    'highScoreAgents',
    'fillBandAgents',
    'chainsInFamily',
    'minSelectedAcrossChains',
    'listPath'
  ];
  const summaryCsvLines = [summaryCsvCols.join(',')];
  for (const row of summaryRows) {
    summaryCsvLines.push(summaryCsvCols.map((col) => csvEscape(row[col])).join(','));
  }
  fs.writeFileSync(path.join(opts.outDir, 'summary.csv'), `${summaryCsvLines.join('\n')}\n`, 'utf8');

  process.stdout.write(`[family-score-lists] families=${summaryRows.length} agents=${planningAgents.length} excluded_testnet=${excludedTestnetAgents} excluded_policy=${excludedByPolicy} out_dir=${opts.outDir}\n`);
  for (const row of summaryRows) {
    process.stdout.write(`[family-score-lists] ${row.familyKey}: selected=${row.selectedAgents} total=${row.totalAgents} high>=${opts.minHighScore}:${row.highScoreAgents}\n`);
  }
}

main();
