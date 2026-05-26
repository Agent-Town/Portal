const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const { validateCivicVote } = require('./schemas');

const MIGRATION_VERSION = 'v1';

function parseVoteRow(row) {
  if (!row) return null;
  return {
    voteId: row.vote_id,
    proposalId: row.proposal_id,
    voterAccountId: row.voter_account_id,
    choice: row.choice,
    authorizationKind: row.authorization_kind,
    eligibilityRuleId: row.eligibility_rule_id,
    receiptId: row.receipt_id,
    idempotencyKey: row.idempotency_key,
    createdAtMs: Number(row.created_at),
    auditEntryId: row.audit_entry_id,
    vote: JSON.parse(row.vote_json)
  };
}

function ensureSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_civic_votes (
      vote_id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      voter_account_id TEXT NOT NULL,
      choice TEXT NOT NULL,
      authorization_kind TEXT NOT NULL,
      eligibility_rule_id TEXT NOT NULL,
      receipt_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      audit_entry_id TEXT NOT NULL,
      vote_json TEXT NOT NULL,
      UNIQUE(voter_account_id, idempotency_key),
      UNIQUE(proposal_id, voter_account_id)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_votes_proposal_choice
      ON world_civic_votes(proposal_id, choice, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_votes_voter_created
      ON world_civic_votes(voter_account_id, created_at);
  `);
}

function buildStatements(db) {
  return {
    byVoteId: db.prepare(`
      SELECT *
      FROM world_civic_votes
      WHERE vote_id = ?
      LIMIT 1
    `),
    byVoterIdempotency: db.prepare(`
      SELECT *
      FROM world_civic_votes
      WHERE voter_account_id = ? AND idempotency_key = ?
      LIMIT 1
    `),
    byProposalVoter: db.prepare(`
      SELECT *
      FROM world_civic_votes
      WHERE proposal_id = ? AND voter_account_id = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT INTO world_civic_votes (
        vote_id, proposal_id, voter_account_id, choice, authorization_kind,
        eligibility_rule_id, receipt_id, idempotency_key, created_at,
        audit_entry_id, vote_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    list: db.prepare(`
      SELECT *
      FROM world_civic_votes
      WHERE (? = '' OR proposal_id = ?)
        AND (? = '' OR voter_account_id = ?)
      ORDER BY created_at ASC, vote_id ASC
      LIMIT ?
    `),
    summary: db.prepare(`
      SELECT choice, COUNT(1) AS count
      FROM world_civic_votes
      WHERE proposal_id = ?
      GROUP BY choice
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_civic_votes')
  };
}

function createVoteAuditEntry(vote, nowMs) {
  return {
    schemaVersion: vote.schemaVersion,
    entryId: `audit_${vote.voteId.replace(/^vote_/, 'vote_')}`,
    actor: vote.voter,
    actionType: 'vote.recorded',
    objectRef: vote.voteId,
    idempotencyKey: vote.idempotencyKey,
    beforeHash: sha256(`agent-town.v6.civic.vote.absent:${vote.proposalId}:${vote.voter.accountId}`),
    afterHash: sha256(stableJson(vote)),
    createdAtMs: nowMs,
    migrationVersion: MIGRATION_VERSION,
    replayable: true,
    rollbackId: '',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    }
  };
}

function createCivicVoteStore({ sqlitePath, proposalStore, auditLedger = null, auditSqlitePath = '' }) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('CIVIC_VOTE_SQLITE_PATH_REQUIRED');
  }
  if (!proposalStore || typeof proposalStore.getProposal !== 'function') {
    throw new Error('CIVIC_VOTE_PROPOSAL_STORE_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const db = new DatabaseSync(sqlitePath);
  ensureSchema(db);
  const statements = buildStatements(db);
  const ownsLedger = !auditLedger;
  const ledger = auditLedger || createCivicAuditLedger({ sqlitePath: auditSqlitePath || sqlitePath });
  let closed = false;

  function recordVote(rawVote = {}, { nowMs = Date.now() } = {}) {
    const validation = validateCivicVote(rawVote);
    if (!validation.ok) {
      const err = new Error('CIVIC_VOTE_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const vote = validation.value;
    const normalizedJson = stableJson(vote);
    const proposal = proposalStore.getProposal(vote.proposalId);
    if (!proposal) {
      const err = new Error('CIVIC_VOTE_PROPOSAL_REQUIRED');
      err.details = { proposalId: vote.proposalId };
      throw err;
    }
    if (proposal.expiresAtMs <= nowMs) {
      const err = new Error('CIVIC_VOTE_PROPOSAL_EXPIRED');
      err.details = { proposalId: vote.proposalId, expiresAtMs: proposal.expiresAtMs, nowMs };
      throw err;
    }

    const existingByIdempotency = parseVoteRow(
      statements.byVoterIdempotency.get(vote.voter.accountId, vote.idempotencyKey)
    );
    if (existingByIdempotency) {
      if (stableJson(existingByIdempotency.vote) !== normalizedJson) {
        const err = new Error('CIVIC_VOTE_IDEMPOTENCY_CONFLICT');
        err.details = {
          voterAccountId: vote.voter.accountId,
          idempotencyKey: vote.idempotencyKey,
          existingVoteId: existingByIdempotency.voteId
        };
        throw err;
      }
      return { ...existingByIdempotency, duplicate: true };
    }

    const existingByProposalVoter = parseVoteRow(
      statements.byProposalVoter.get(vote.proposalId, vote.voter.accountId)
    );
    if (existingByProposalVoter) {
      const err = new Error('CIVIC_VOTE_ALREADY_RECORDED');
      err.details = {
        proposalId: vote.proposalId,
        voterAccountId: vote.voter.accountId,
        existingVoteId: existingByProposalVoter.voteId
      };
      throw err;
    }

    const existingByVoteId = parseVoteRow(statements.byVoteId.get(vote.voteId));
    if (existingByVoteId) {
      const err = new Error('CIVIC_VOTE_ID_CONFLICT');
      err.details = { voteId: vote.voteId };
      throw err;
    }

    const auditRow = ledger.append(createVoteAuditEntry(vote, nowMs));
    statements.insert.run(
      vote.voteId,
      vote.proposalId,
      vote.voter.accountId,
      vote.choice,
      vote.authorization.kind,
      vote.eligibilityProof.ruleId,
      vote.receiptId,
      vote.idempotencyKey,
      nowMs,
      auditRow.entry.entryId,
      normalizedJson
    );
    return parseVoteRow(statements.byVoteId.get(vote.voteId));
  }

  function getVote(voteId = '') {
    return parseVoteRow(statements.byVoteId.get(String(voteId || '')));
  }

  function listVotes({ proposalId = '', voterAccountId = '', limit = 100 } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.list.all(
      String(proposalId || ''),
      String(proposalId || ''),
      String(voterAccountId || ''),
      String(voterAccountId || ''),
      safeLimit
    ).map(parseVoteRow);
  }

  function summarizeProposalVotes(proposalId = '') {
    const rows = statements.summary.all(String(proposalId || ''));
    const counts = { approve: 0, reject: 0, abstain: 0 };
    for (const row of rows) counts[row.choice] = Number(row.count || 0);
    return {
      proposalId: String(proposalId || ''),
      counts,
      total: counts.approve + counts.reject + counts.abstain,
      executionStatus: 'not_executable'
    };
  }

  function count() {
    return Number(statements.count.get().count || 0);
  }

  function close() {
    if (closed) return;
    closed = true;
    if (ownsLedger && ledger?.close) ledger.close();
    db.close();
  }

  return {
    close,
    count,
    getVote,
    listVotes,
    recordVote,
    sqlitePath,
    summarizeProposalVotes
  };
}

module.exports = {
  createCivicVoteStore
};
