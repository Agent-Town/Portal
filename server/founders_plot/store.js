const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { getStorePath } = require('../store');
const { normalizeLoadedState } = require('./engine');

let db = null;
let statements = null;

function ensureDb() {
  if (db) return db;
  const dbPath = getStorePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(
    [
      `CREATE TABLE IF NOT EXISTS founder_plots (
        plot_id TEXT PRIMARY KEY,
        pair_id TEXT NOT NULL UNIQUE,
        house_id TEXT,
        world_id TEXT,
        status TEXT NOT NULL,
        hq_level INTEGER NOT NULL,
        town_xp INTEGER NOT NULL,
        wood INTEGER NOT NULL,
        stone INTEGER NOT NULL,
        food INTEGER NOT NULL,
        coin INTEGER NOT NULL,
        cap_wood INTEGER NOT NULL,
        cap_stone INTEGER NOT NULL,
        cap_food INTEGER NOT NULL,
        construction_slots INTEGER NOT NULL,
        meta_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_simulated_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS founder_buildings (
        building_id TEXT PRIMARY KEY,
        plot_id TEXT NOT NULL,
        type TEXT NOT NULL,
        level INTEGER NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        state TEXT NOT NULL,
        output_buffer_json TEXT NOT NULL,
        priority TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );`,
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_founder_buildings_plot_xy ON founder_buildings(plot_id, x, y);',
      `CREATE TABLE IF NOT EXISTS founder_jobs (
        job_id TEXT PRIMARY KEY,
        plot_id TEXT NOT NULL,
        building_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        input_json TEXT NOT NULL,
        output_json TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ends_at INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_by TEXT NOT NULL,
        explanation TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        claimed_at INTEGER NOT NULL
      );`,
      'CREATE INDEX IF NOT EXISTS idx_founder_jobs_plot_status ON founder_jobs(plot_id, status, ends_at);',
      `CREATE TABLE IF NOT EXISTS founder_permissions (
        plot_id TEXT PRIMARY KEY,
        observe_and_suggest INTEGER NOT NULL,
        collect_outputs INTEGER NOT NULL,
        queue_production INTEGER NOT NULL,
        set_priority INTEGER NOT NULL,
        sell_surplus_food INTEGER NOT NULL,
        sell_daily_coin_cap INTEGER NOT NULL,
        sell_daily_coin_day TEXT NOT NULL,
        sell_daily_coin_sold INTEGER NOT NULL,
        max_autonomous_actions_per_hour INTEGER NOT NULL,
        autonomy_bucket TEXT NOT NULL,
        autonomy_used INTEGER NOT NULL,
        emergency_pause INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS founder_event_log (
        plot_id TEXT NOT NULL,
        seq INTEGER NOT NULL,
        type TEXT NOT NULL,
        actor TEXT NOT NULL,
        explanation TEXT NOT NULL,
        recap_line TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (plot_id, seq)
      );`,
      'CREATE INDEX IF NOT EXISTS idx_founder_event_log_plot_created ON founder_event_log(plot_id, created_at);',
      `CREATE TABLE IF NOT EXISTS founder_idempotency (
        plot_id TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        tool TEXT NOT NULL,
        args_sha TEXT NOT NULL,
        response_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (plot_id, idempotency_key)
      );`,
      `CREATE TABLE IF NOT EXISTS founder_approvals (
        approval_id TEXT PRIMARY KEY,
        plot_id TEXT NOT NULL,
        requested_by TEXT NOT NULL,
        tool TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        status TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        resolved_at INTEGER NOT NULL,
        resolution_note TEXT NOT NULL
      );`,
      'CREATE INDEX IF NOT EXISTS idx_founder_approvals_plot_status ON founder_approvals(plot_id, status, created_at);'
    ].join('\n')
  );
  statements = buildStatements(db);
  return db;
}

function buildStatements(database) {
  return {
    plotByPairId: database.prepare('SELECT * FROM founder_plots WHERE pair_id = ? LIMIT 1'),
    plotById: database.prepare('SELECT * FROM founder_plots WHERE plot_id = ? LIMIT 1'),
    listPlots: database.prepare('SELECT * FROM founder_plots ORDER BY updated_at DESC LIMIT ?'),
    upsertPlot: database.prepare(`
      INSERT INTO founder_plots (
        plot_id, pair_id, house_id, world_id, status, hq_level, town_xp,
        wood, stone, food, coin, cap_wood, cap_stone, cap_food,
        construction_slots, meta_json, created_at, updated_at, last_simulated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(plot_id) DO UPDATE SET
        pair_id=excluded.pair_id,
        house_id=excluded.house_id,
        world_id=excluded.world_id,
        status=excluded.status,
        hq_level=excluded.hq_level,
        town_xp=excluded.town_xp,
        wood=excluded.wood,
        stone=excluded.stone,
        food=excluded.food,
        coin=excluded.coin,
        cap_wood=excluded.cap_wood,
        cap_stone=excluded.cap_stone,
        cap_food=excluded.cap_food,
        construction_slots=excluded.construction_slots,
        meta_json=excluded.meta_json,
        created_at=excluded.created_at,
        updated_at=excluded.updated_at,
        last_simulated_at=excluded.last_simulated_at
    `),
    deleteBuildingsForPlot: database.prepare('DELETE FROM founder_buildings WHERE plot_id = ?'),
    insertBuilding: database.prepare(`
      INSERT INTO founder_buildings (
        building_id, plot_id, type, level, x, y, state,
        output_buffer_json, priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    listBuildingsForPlot: database.prepare('SELECT * FROM founder_buildings WHERE plot_id = ? ORDER BY created_at ASC, building_id ASC'),
    deleteJobsForPlot: database.prepare('DELETE FROM founder_jobs WHERE plot_id = ?'),
    insertJob: database.prepare(`
      INSERT INTO founder_jobs (
        job_id, plot_id, building_id, kind, input_json, output_json,
        started_at, ends_at, status, created_by, explanation, created_at, claimed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    listJobsForPlot: database.prepare('SELECT * FROM founder_jobs WHERE plot_id = ? ORDER BY created_at ASC, job_id ASC'),
    upsertPolicy: database.prepare(`
      INSERT INTO founder_permissions (
        plot_id, observe_and_suggest, collect_outputs, queue_production, set_priority,
        sell_surplus_food, sell_daily_coin_cap, sell_daily_coin_day, sell_daily_coin_sold,
        max_autonomous_actions_per_hour, autonomy_bucket, autonomy_used, emergency_pause, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(plot_id) DO UPDATE SET
        observe_and_suggest=excluded.observe_and_suggest,
        collect_outputs=excluded.collect_outputs,
        queue_production=excluded.queue_production,
        set_priority=excluded.set_priority,
        sell_surplus_food=excluded.sell_surplus_food,
        sell_daily_coin_cap=excluded.sell_daily_coin_cap,
        sell_daily_coin_day=excluded.sell_daily_coin_day,
        sell_daily_coin_sold=excluded.sell_daily_coin_sold,
        max_autonomous_actions_per_hour=excluded.max_autonomous_actions_per_hour,
        autonomy_bucket=excluded.autonomy_bucket,
        autonomy_used=excluded.autonomy_used,
        emergency_pause=excluded.emergency_pause,
        updated_at=excluded.updated_at
    `),
    policyByPlot: database.prepare('SELECT * FROM founder_permissions WHERE plot_id = ? LIMIT 1'),
    deleteApprovalsForPlot: database.prepare('DELETE FROM founder_approvals WHERE plot_id = ?'),
    insertApproval: database.prepare(`
      INSERT INTO founder_approvals (
        approval_id, plot_id, requested_by, tool, title, body, status,
        payload_json, created_at, resolved_at, resolution_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    listApprovalsForPlot: database.prepare('SELECT * FROM founder_approvals WHERE plot_id = ? ORDER BY created_at ASC'),
    maxSeqForPlot: database.prepare('SELECT COALESCE(MAX(seq), 0) AS max_seq FROM founder_event_log WHERE plot_id = ?'),
    insertEvent: database.prepare(`
      INSERT INTO founder_event_log (
        plot_id, seq, type, actor, explanation, recap_line, data_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `),
    listEventsForPlot: database.prepare(`
      SELECT * FROM founder_event_log
      WHERE plot_id = ? AND seq > ?
      ORDER BY seq ASC
      LIMIT ?
    `),
    listRecentEventsForPlot: database.prepare(`
      SELECT * FROM founder_event_log
      WHERE plot_id = ?
      ORDER BY seq DESC
      LIMIT ?
    `),
    getIdempotency: database.prepare(`
      SELECT * FROM founder_idempotency
      WHERE plot_id = ? AND idempotency_key = ?
      LIMIT 1
    `),
    upsertIdempotency: database.prepare(`
      INSERT INTO founder_idempotency (
        plot_id, idempotency_key, tool, args_sha, response_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(plot_id, idempotency_key) DO UPDATE SET
        tool=excluded.tool,
        args_sha=excluded.args_sha,
        response_json=excluded.response_json,
        created_at=excluded.created_at
    `),
    clearPlots: database.prepare('DELETE FROM founder_plots'),
    clearBuildings: database.prepare('DELETE FROM founder_buildings'),
    clearJobs: database.prepare('DELETE FROM founder_jobs'),
    clearPolicies: database.prepare('DELETE FROM founder_permissions'),
    clearEvents: database.prepare('DELETE FROM founder_event_log'),
    clearIdempotency: database.prepare('DELETE FROM founder_idempotency'),
    clearApprovals: database.prepare('DELETE FROM founder_approvals')
  };
}

function withTransaction(fn) {
  const database = ensureDb();
  database.exec('BEGIN');
  try {
    fn();
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

function parseJsonObject(raw, fallback) {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function mapPlotRow(row) {
  if (!row) return null;
  return {
    plotId: row.plot_id,
    pairId: row.pair_id,
    houseId: row.house_id || null,
    worldId: row.world_id || null,
    status: row.status,
    hqLevel: Number(row.hq_level || 1),
    townXp: Number(row.town_xp || 0),
    inventory: {
      wood: Number(row.wood || 0),
      stone: Number(row.stone || 0),
      food: Number(row.food || 0),
      coin: Number(row.coin || 0)
    },
    storageCaps: {
      wood: Number(row.cap_wood || 0),
      stone: Number(row.cap_stone || 0),
      food: Number(row.cap_food || 0)
    },
    constructionSlots: Number(row.construction_slots || 1),
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0),
    lastSimulatedAt: Number(row.last_simulated_at || 0)
  };
}

function mapBuildingRow(row) {
  return {
    buildingId: row.building_id,
    plotId: row.plot_id,
    type: row.type,
    level: Number(row.level || 1),
    x: Number(row.x || 0),
    y: Number(row.y || 0),
    state: row.state,
    outputBuffer: parseJsonObject(row.output_buffer_json, {}),
    priority: row.priority,
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0)
  };
}

function mapJobRow(row) {
  return {
    jobId: row.job_id,
    plotId: row.plot_id,
    buildingId: row.building_id,
    kind: row.kind,
    input: parseJsonObject(row.input_json, {}),
    output: parseJsonObject(row.output_json, {}),
    startedAt: Number(row.started_at || 0),
    endsAt: Number(row.ends_at || 0),
    status: row.status,
    createdBy: row.created_by,
    explanation: row.explanation || '',
    createdAt: Number(row.created_at || 0),
    claimedAt: Number(row.claimed_at || 0)
  };
}

function mapPolicyRow(row) {
  if (!row) return {};
  return {
    observeAndSuggest: !!row.observe_and_suggest,
    collectOutputs: !!row.collect_outputs,
    queueProduction: !!row.queue_production,
    setPriority: !!row.set_priority,
    sellSurplusFood: !!row.sell_surplus_food,
    sellDailyCoinCap: Number(row.sell_daily_coin_cap || 0),
    sellDailyCoinDay: row.sell_daily_coin_day || '',
    sellDailyCoinSold: Number(row.sell_daily_coin_sold || 0),
    maxAutonomousActionsPerHour: Number(row.max_autonomous_actions_per_hour || 0),
    autonomyBucket: row.autonomy_bucket || '',
    autonomyUsed: Number(row.autonomy_used || 0),
    emergencyPause: !!row.emergency_pause,
    updatedAt: Number(row.updated_at || 0)
  };
}

function mapApprovalRow(row) {
  return {
    approvalId: row.approval_id,
    plotId: row.plot_id,
    requestedBy: row.requested_by,
    tool: row.tool,
    title: row.title,
    body: row.body,
    status: row.status,
    payload: parseJsonObject(row.payload_json, {}),
    createdAt: Number(row.created_at || 0),
    resolvedAt: Number(row.resolved_at || 0),
    resolutionNote: row.resolution_note || ''
  };
}

function mapEventRow(row) {
  return {
    plotId: row.plot_id,
    seq: Number(row.seq || 0),
    type: row.type,
    actor: row.actor,
    explanation: row.explanation || '',
    recapLine: row.recap_line || '',
    data: parseJsonObject(row.data_json, {}),
    createdAt: Number(row.created_at || 0)
  };
}

function loadPlotByPairId(pairId) {
  ensureDb();
  const plotRow = statements.plotByPairId.get(pairId);
  if (!plotRow) return null;
  return loadPlotGraphById(plotRow.plot_id);
}

function loadPlotGraphById(plotId) {
  ensureDb();
  const plotRow = statements.plotById.get(plotId);
  if (!plotRow) return null;
  const plot = mapPlotRow(plotRow);
  const state = normalizeLoadedState({
    plot,
    buildings: statements.listBuildingsForPlot.all(plotId).map(mapBuildingRow),
    jobs: statements.listJobsForPlot.all(plotId).map(mapJobRow),
    policy: mapPolicyRow(statements.policyByPlot.get(plotId)),
    approvals: statements.listApprovalsForPlot.all(plotId).map(mapApprovalRow),
    meta: parseJsonObject(plotRow.meta_json, {})
  });
  return state;
}

function savePlotGraph(state) {
  ensureDb();
  withTransaction(() => {
    const plot = state.plot;
    statements.upsertPlot.run(
      plot.plotId,
      plot.pairId,
      plot.houseId || null,
      plot.worldId || null,
      plot.status,
      plot.hqLevel,
      plot.townXp,
      plot.inventory.wood,
      plot.inventory.stone,
      plot.inventory.food,
      plot.inventory.coin,
      plot.storageCaps.wood,
      plot.storageCaps.stone,
      plot.storageCaps.food,
      plot.constructionSlots,
      JSON.stringify(state.meta || {}),
      plot.createdAt,
      plot.updatedAt,
      plot.lastSimulatedAt
    );

    statements.deleteBuildingsForPlot.run(plot.plotId);
    for (const building of state.buildings || []) {
      statements.insertBuilding.run(
        building.buildingId,
        plot.plotId,
        building.type,
        building.level,
        building.x,
        building.y,
        building.state,
        JSON.stringify(building.outputBuffer || {}),
        building.priority || 'BALANCED',
        building.createdAt,
        building.updatedAt
      );
    }

    statements.deleteJobsForPlot.run(plot.plotId);
    for (const job of state.jobs || []) {
      statements.insertJob.run(
        job.jobId,
        plot.plotId,
        job.buildingId,
        job.kind,
        JSON.stringify(job.input || {}),
        JSON.stringify(job.output || {}),
        job.startedAt,
        job.endsAt,
        job.status,
        job.createdBy,
        job.explanation || '',
        job.createdAt,
        job.claimedAt || 0
      );
    }

    const policy = state.policy || {};
    statements.upsertPolicy.run(
      plot.plotId,
      policy.observeAndSuggest ? 1 : 0,
      policy.collectOutputs ? 1 : 0,
      policy.queueProduction ? 1 : 0,
      policy.setPriority ? 1 : 0,
      policy.sellSurplusFood ? 1 : 0,
      policy.sellDailyCoinCap || 0,
      policy.sellDailyCoinDay || '',
      policy.sellDailyCoinSold || 0,
      policy.maxAutonomousActionsPerHour || 1,
      policy.autonomyBucket || '',
      policy.autonomyUsed || 0,
      policy.emergencyPause ? 1 : 0,
      policy.updatedAt || 0
    );

    statements.deleteApprovalsForPlot.run(plot.plotId);
    for (const approval of state.approvals || []) {
      statements.insertApproval.run(
        approval.approvalId,
        plot.plotId,
        approval.requestedBy,
        approval.tool,
        approval.title,
        approval.body,
        approval.status,
        JSON.stringify(approval.payload || {}),
        approval.createdAt,
        approval.resolvedAt || 0,
        approval.resolutionNote || ''
      );
    }
  });
}

function appendEvents(plotId, events = []) {
  ensureDb();
  if (!Array.isArray(events) || events.length === 0) return [];
  const inserted = [];
  withTransaction(() => {
    let nextSeq = Number(statements.maxSeqForPlot.get(plotId)?.max_seq || 0);
    for (const event of events) {
      nextSeq += 1;
      const row = {
        plotId,
        seq: nextSeq,
        type: String(event.type || ''),
        actor: String(event.actor || 'SYSTEM'),
        explanation: String(event.explanation || ''),
        recapLine: String(event.recapLine || ''),
        data: event.data && typeof event.data === 'object' ? event.data : {},
        createdAt: Number(event.createdAt || Date.now())
      };
      statements.insertEvent.run(
        row.plotId,
        row.seq,
        row.type,
        row.actor,
        row.explanation,
        row.recapLine,
        JSON.stringify(row.data),
        row.createdAt
      );
      inserted.push(row);
    }
  });
  return inserted;
}

function listEvents(plotId, { afterSeq = 0, limit = 200 } = {}) {
  ensureDb();
  return statements.listEventsForPlot.all(plotId, afterSeq, limit).map(mapEventRow);
}

function listRecentEvents(plotId, limit = 50) {
  ensureDb();
  return statements.listRecentEventsForPlot.all(plotId, limit).map(mapEventRow).reverse();
}

function getIdempotency(plotId, idempotencyKey) {
  ensureDb();
  const row = statements.getIdempotency.get(plotId, idempotencyKey);
  if (!row) return null;
  return {
    plotId: row.plot_id,
    idempotencyKey: row.idempotency_key,
    tool: row.tool,
    argsSha: row.args_sha,
    response: parseJsonObject(row.response_json, null),
    createdAt: Number(row.created_at || 0)
  };
}

function saveIdempotency(plotId, idempotencyKey, { tool, argsSha, response, createdAt = Date.now() }) {
  ensureDb();
  statements.upsertIdempotency.run(
    plotId,
    idempotencyKey,
    tool,
    argsSha,
    JSON.stringify(response),
    createdAt
  );
}

function listPlots(limit = 100) {
  ensureDb();
  const max = Math.max(1, Math.min(500, Math.floor(Number(limit) || 100)));
  return statements.listPlots.all(max).map((row) => loadPlotGraphById(row.plot_id)).filter(Boolean);
}

function resetFoundersPlotStore() {
  ensureDb();
  withTransaction(() => {
    statements.clearApprovals.run();
    statements.clearIdempotency.run();
    statements.clearEvents.run();
    statements.clearPolicies.run();
    statements.clearJobs.run();
    statements.clearBuildings.run();
    statements.clearPlots.run();
  });
}

module.exports = {
  appendEvents,
  getIdempotency,
  listEvents,
  listPlots,
  listRecentEvents,
  loadPlotByPairId,
  loadPlotGraphById,
  resetFoundersPlotStore,
  saveIdempotency,
  savePlotGraph
};
