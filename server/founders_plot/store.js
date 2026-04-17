const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

let db = null;
let statements = null;

function getFoundersPlotStorePath() {
  if (process.env.FOUNDERS_PLOT_STORE_PATH) return process.env.FOUNDERS_PLOT_STORE_PATH;

  const baseStorePath = process.env.STORE_PATH;
  if (baseStorePath) {
    const dir = path.dirname(baseStorePath);
    const base = path.basename(baseStorePath);
    const nextName = base.startsWith('store')
      ? base.replace(/^store/, 'founders-plot')
      : `founders-plot-${base}`;
    return path.join(dir, nextName.endsWith('.sqlite') ? nextName : `${nextName}.sqlite`);
  }

  const isTest = process.env.NODE_ENV === 'test';
  return path.join(process.cwd(), 'data', isTest ? 'founders-plot.test.sqlite' : 'founders-plot.sqlite');
}

function parseJson(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toJson(value, fallback = {}) {
  return JSON.stringify(value == null ? fallback : value);
}

function ensureDb() {
  if (db) return db;
  const filePath = getFoundersPlotStorePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  db = new DatabaseSync(filePath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS founder_plots (
      plot_id TEXT PRIMARY KEY,
      pair_id TEXT NOT NULL UNIQUE,
      house_id TEXT,
      status TEXT NOT NULL,
      hq_level INTEGER NOT NULL,
      town_xp INTEGER NOT NULL,
      inventory_json TEXT NOT NULL,
      storage_caps_json TEXT NOT NULL,
      construction_slots INTEGER NOT NULL,
      next_build_buff_pct REAL NOT NULL DEFAULT 0,
      claimed_rewards_json TEXT NOT NULL DEFAULT '[]',
      seen_building_types_json TEXT NOT NULL DEFAULT '[]',
      collected_building_types_json TEXT NOT NULL DEFAULT '[]',
      last_daily_bonus_day TEXT,
      daily_sold_coin INTEGER NOT NULL DEFAULT 0,
      daily_sell_day TEXT,
      last_viewed_at INTEGER,
      pending_recap_from INTEGER,
      pending_recap_to INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_simulated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS founder_buildings (
      building_id TEXT PRIMARY KEY,
      plot_id TEXT NOT NULL,
      object_instance_id TEXT,
      type TEXT NOT NULL,
      level INTEGER NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      state TEXT NOT NULL,
      output_buffer_json TEXT NOT NULL DEFAULT '{}',
      priority TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS founder_buildings_plot_idx ON founder_buildings (plot_id, x, y);

    CREATE TABLE IF NOT EXISTS founder_jobs (
      job_id TEXT PRIMARY KEY,
      plot_id TEXT NOT NULL,
      building_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      input_json TEXT NOT NULL,
      output_json TEXT NOT NULL,
      started_at INTEGER,
      ends_at INTEGER,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      created_by TEXT NOT NULL,
      explanation TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS founder_jobs_plot_idx ON founder_jobs (plot_id, status, ends_at, created_at);

    CREATE TABLE IF NOT EXISTS founder_event_log (
      event_seq INTEGER PRIMARY KEY AUTOINCREMENT,
      plot_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      building_id TEXT,
      job_id TEXT,
      summary TEXT NOT NULL,
      explanation TEXT,
      data_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS founder_event_plot_idx ON founder_event_log (plot_id, event_seq);

    CREATE TABLE IF NOT EXISTS founder_permissions (
      plot_id TEXT PRIMARY KEY,
      observe_and_suggest INTEGER NOT NULL,
      collect_outputs INTEGER NOT NULL,
      queue_production INTEGER NOT NULL,
      set_priority INTEGER NOT NULL,
      sell_surplus_food INTEGER NOT NULL,
      sell_daily_coin_cap INTEGER NOT NULL,
      max_autonomous_actions_per_hour INTEGER NOT NULL,
      emergency_pause INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS founder_idempotency (
      plot_id TEXT NOT NULL,
      action_name TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      request_hash TEXT NOT NULL,
      response_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (plot_id, action_name, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS founder_approvals (
      approval_id TEXT PRIMARY KEY,
      plot_id TEXT NOT NULL,
      action_name TEXT NOT NULL,
      action_hash TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      requested_params_json TEXT NOT NULL,
      status TEXT NOT NULL,
      created_by TEXT NOT NULL,
      resolution_note TEXT,
      used_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      resolved_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS founder_approvals_plot_idx ON founder_approvals (plot_id, status, updated_at);
  `);
  statements = buildStatements(db);
  return db;
}

function buildStatements(database) {
  return {
    plotByPair: database.prepare('SELECT * FROM founder_plots WHERE pair_id = ? LIMIT 1'),
    plotById: database.prepare('SELECT * FROM founder_plots WHERE plot_id = ? LIMIT 1'),
    upsertPlot: database.prepare(`
      INSERT INTO founder_plots (
        plot_id, pair_id, house_id, status, hq_level, town_xp, inventory_json, storage_caps_json,
        construction_slots, next_build_buff_pct, claimed_rewards_json, seen_building_types_json,
        collected_building_types_json, last_daily_bonus_day, daily_sold_coin, daily_sell_day,
        last_viewed_at, pending_recap_from, pending_recap_to, created_at, updated_at, last_simulated_at
      ) VALUES (
        @plot_id, @pair_id, @house_id, @status, @hq_level, @town_xp, @inventory_json, @storage_caps_json,
        @construction_slots, @next_build_buff_pct, @claimed_rewards_json, @seen_building_types_json,
        @collected_building_types_json, @last_daily_bonus_day, @daily_sold_coin, @daily_sell_day,
        @last_viewed_at, @pending_recap_from, @pending_recap_to, @created_at, @updated_at, @last_simulated_at
      )
      ON CONFLICT(plot_id) DO UPDATE SET
        pair_id = excluded.pair_id,
        house_id = excluded.house_id,
        status = excluded.status,
        hq_level = excluded.hq_level,
        town_xp = excluded.town_xp,
        inventory_json = excluded.inventory_json,
        storage_caps_json = excluded.storage_caps_json,
        construction_slots = excluded.construction_slots,
        next_build_buff_pct = excluded.next_build_buff_pct,
        claimed_rewards_json = excluded.claimed_rewards_json,
        seen_building_types_json = excluded.seen_building_types_json,
        collected_building_types_json = excluded.collected_building_types_json,
        last_daily_bonus_day = excluded.last_daily_bonus_day,
        daily_sold_coin = excluded.daily_sold_coin,
        daily_sell_day = excluded.daily_sell_day,
        last_viewed_at = excluded.last_viewed_at,
        pending_recap_from = excluded.pending_recap_from,
        pending_recap_to = excluded.pending_recap_to,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        last_simulated_at = excluded.last_simulated_at
    `),
    buildingsByPlot: database.prepare('SELECT * FROM founder_buildings WHERE plot_id = ? ORDER BY created_at ASC, building_id ASC'),
    buildingById: database.prepare('SELECT * FROM founder_buildings WHERE building_id = ? LIMIT 1'),
    upsertBuilding: database.prepare(`
      INSERT INTO founder_buildings (
        building_id, plot_id, object_instance_id, type, level, x, y, state, output_buffer_json, priority, created_at, updated_at
      ) VALUES (
        @building_id, @plot_id, @object_instance_id, @type, @level, @x, @y, @state, @output_buffer_json, @priority, @created_at, @updated_at
      )
      ON CONFLICT(building_id) DO UPDATE SET
        plot_id = excluded.plot_id,
        object_instance_id = excluded.object_instance_id,
        type = excluded.type,
        level = excluded.level,
        x = excluded.x,
        y = excluded.y,
        state = excluded.state,
        output_buffer_json = excluded.output_buffer_json,
        priority = excluded.priority,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
    `),
    deleteBuilding: database.prepare('DELETE FROM founder_buildings WHERE building_id = ?'),
    jobsByPlot: database.prepare('SELECT * FROM founder_jobs WHERE plot_id = ? ORDER BY created_at ASC, job_id ASC'),
    jobById: database.prepare('SELECT * FROM founder_jobs WHERE job_id = ? LIMIT 1'),
    upsertJob: database.prepare(`
      INSERT INTO founder_jobs (
        job_id, plot_id, building_id, kind, input_json, output_json, started_at, ends_at,
        duration_ms, status, created_by, explanation, created_at, updated_at
      ) VALUES (
        @job_id, @plot_id, @building_id, @kind, @input_json, @output_json, @started_at, @ends_at,
        @duration_ms, @status, @created_by, @explanation, @created_at, @updated_at
      )
      ON CONFLICT(job_id) DO UPDATE SET
        plot_id = excluded.plot_id,
        building_id = excluded.building_id,
        kind = excluded.kind,
        input_json = excluded.input_json,
        output_json = excluded.output_json,
        started_at = excluded.started_at,
        ends_at = excluded.ends_at,
        duration_ms = excluded.duration_ms,
        status = excluded.status,
        created_by = excluded.created_by,
        explanation = excluded.explanation,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
    `),
    policyByPlot: database.prepare('SELECT * FROM founder_permissions WHERE plot_id = ? LIMIT 1'),
    upsertPolicy: database.prepare(`
      INSERT INTO founder_permissions (
        plot_id, observe_and_suggest, collect_outputs, queue_production, set_priority,
        sell_surplus_food, sell_daily_coin_cap, max_autonomous_actions_per_hour, emergency_pause, updated_at
      ) VALUES (
        @plot_id, @observe_and_suggest, @collect_outputs, @queue_production, @set_priority,
        @sell_surplus_food, @sell_daily_coin_cap, @max_autonomous_actions_per_hour, @emergency_pause, @updated_at
      )
      ON CONFLICT(plot_id) DO UPDATE SET
        observe_and_suggest = excluded.observe_and_suggest,
        collect_outputs = excluded.collect_outputs,
        queue_production = excluded.queue_production,
        set_priority = excluded.set_priority,
        sell_surplus_food = excluded.sell_surplus_food,
        sell_daily_coin_cap = excluded.sell_daily_coin_cap,
        max_autonomous_actions_per_hour = excluded.max_autonomous_actions_per_hour,
        emergency_pause = excluded.emergency_pause,
        updated_at = excluded.updated_at
    `),
    eventsByPlot: database.prepare('SELECT * FROM founder_event_log WHERE plot_id = ? ORDER BY event_seq ASC'),
    eventsByPlotSince: database.prepare('SELECT * FROM founder_event_log WHERE plot_id = ? AND created_at >= ? ORDER BY event_seq ASC'),
    appendEvent: database.prepare(`
      INSERT INTO founder_event_log (
        plot_id, event_type, actor, building_id, job_id, summary, explanation, data_json, created_at
      ) VALUES (
        @plot_id, @event_type, @actor, @building_id, @job_id, @summary, @explanation, @data_json, @created_at
      )
    `),
    idempotencyByKey: database.prepare(`
      SELECT * FROM founder_idempotency WHERE plot_id = ? AND action_name = ? AND idempotency_key = ? LIMIT 1
    `),
    upsertIdempotency: database.prepare(`
      INSERT INTO founder_idempotency (
        plot_id, action_name, idempotency_key, request_hash, response_json, created_at
      ) VALUES (
        @plot_id, @action_name, @idempotency_key, @request_hash, @response_json, @created_at
      )
      ON CONFLICT(plot_id, action_name, idempotency_key) DO UPDATE SET
        request_hash = excluded.request_hash,
        response_json = excluded.response_json,
        created_at = excluded.created_at
    `),
    approvalsByPlot: database.prepare(`
      SELECT * FROM founder_approvals WHERE plot_id = ? ORDER BY updated_at DESC, created_at DESC, approval_id DESC
    `),
    approvalById: database.prepare('SELECT * FROM founder_approvals WHERE approval_id = ? LIMIT 1'),
    matchingApproval: database.prepare(`
      SELECT * FROM founder_approvals
      WHERE plot_id = ? AND action_name = ? AND action_hash = ? AND status IN ('PENDING', 'APPROVED')
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    `),
    approvedUnusedApproval: database.prepare(`
      SELECT * FROM founder_approvals
      WHERE plot_id = ? AND action_name = ? AND action_hash = ? AND status = 'APPROVED' AND used_at IS NULL
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    `),
    upsertApproval: database.prepare(`
      INSERT INTO founder_approvals (
        approval_id, plot_id, action_name, action_hash, title, body, requested_params_json, status,
        created_by, resolution_note, used_at, created_at, updated_at, resolved_at
      ) VALUES (
        @approval_id, @plot_id, @action_name, @action_hash, @title, @body, @requested_params_json, @status,
        @created_by, @resolution_note, @used_at, @created_at, @updated_at, @resolved_at
      )
      ON CONFLICT(approval_id) DO UPDATE SET
        plot_id = excluded.plot_id,
        action_name = excluded.action_name,
        action_hash = excluded.action_hash,
        title = excluded.title,
        body = excluded.body,
        requested_params_json = excluded.requested_params_json,
        status = excluded.status,
        created_by = excluded.created_by,
        resolution_note = excluded.resolution_note,
        used_at = excluded.used_at,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        resolved_at = excluded.resolved_at
    `),
    publicPlots: database.prepare(`
      SELECT plot_id, pair_id, house_id, hq_level, town_xp, updated_at, inventory_json
      FROM founder_plots
      WHERE status = 'ACTIVE'
      ORDER BY hq_level DESC, town_xp DESC, updated_at ASC, plot_id ASC
      LIMIT ?
    `),
    reset: {
      approvals: database.prepare('DELETE FROM founder_approvals'),
      idempotency: database.prepare('DELETE FROM founder_idempotency'),
      events: database.prepare('DELETE FROM founder_event_log'),
      jobs: database.prepare('DELETE FROM founder_jobs'),
      buildings: database.prepare('DELETE FROM founder_buildings'),
      permissions: database.prepare('DELETE FROM founder_permissions'),
      plots: database.prepare('DELETE FROM founder_plots')
    }
  };
}

function withTransaction(fn) {
  const database = ensureDb();
  database.exec('BEGIN');
  try {
    const result = fn(database);
    database.exec('COMMIT');
    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

function hydratePlot(row) {
  if (!row) return null;
  return {
    plotId: row.plot_id,
    pairId: row.pair_id,
    houseId: row.house_id || null,
    status: row.status,
    hqLevel: Number(row.hq_level),
    townXp: Number(row.town_xp),
    inventory: parseJson(row.inventory_json, { wood: 0, stone: 0, food: 0, coin: 0 }),
    storageCaps: parseJson(row.storage_caps_json, { wood: 100, stone: 100, food: 100 }),
    constructionSlots: Number(row.construction_slots),
    nextBuildBuffPct: Number(row.next_build_buff_pct || 0),
    claimedRewards: parseJson(row.claimed_rewards_json, []),
    seenBuildingTypes: parseJson(row.seen_building_types_json, []),
    collectedBuildingTypes: parseJson(row.collected_building_types_json, []),
    lastDailyBonusDay: row.last_daily_bonus_day || null,
    dailySoldCoin: Number(row.daily_sold_coin || 0),
    dailySellDay: row.daily_sell_day || null,
    lastViewedAt: row.last_viewed_at == null ? null : Number(row.last_viewed_at),
    pendingRecapFrom: row.pending_recap_from == null ? null : Number(row.pending_recap_from),
    pendingRecapTo: row.pending_recap_to == null ? null : Number(row.pending_recap_to),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    lastSimulatedAt: Number(row.last_simulated_at)
  };
}

function dehydratePlot(plot) {
  return {
    plot_id: plot.plotId,
    pair_id: plot.pairId,
    house_id: plot.houseId || null,
    status: plot.status,
    hq_level: Number(plot.hqLevel),
    town_xp: Number(plot.townXp),
    inventory_json: toJson(plot.inventory, { wood: 0, stone: 0, food: 0, coin: 0 }),
    storage_caps_json: toJson(plot.storageCaps, { wood: 100, stone: 100, food: 100 }),
    construction_slots: Number(plot.constructionSlots),
    next_build_buff_pct: Number(plot.nextBuildBuffPct || 0),
    claimed_rewards_json: toJson(plot.claimedRewards || [], []),
    seen_building_types_json: toJson(plot.seenBuildingTypes || [], []),
    collected_building_types_json: toJson(plot.collectedBuildingTypes || [], []),
    last_daily_bonus_day: plot.lastDailyBonusDay || null,
    daily_sold_coin: Number(plot.dailySoldCoin || 0),
    daily_sell_day: plot.dailySellDay || null,
    last_viewed_at: plot.lastViewedAt == null ? null : Number(plot.lastViewedAt),
    pending_recap_from: plot.pendingRecapFrom == null ? null : Number(plot.pendingRecapFrom),
    pending_recap_to: plot.pendingRecapTo == null ? null : Number(plot.pendingRecapTo),
    created_at: Number(plot.createdAt),
    updated_at: Number(plot.updatedAt),
    last_simulated_at: Number(plot.lastSimulatedAt)
  };
}

function hydrateBuilding(row) {
  if (!row) return null;
  return {
    buildingId: row.building_id,
    plotId: row.plot_id,
    objectInstanceId: row.object_instance_id || null,
    type: row.type,
    level: Number(row.level),
    x: Number(row.x),
    y: Number(row.y),
    state: row.state,
    outputBuffer: parseJson(row.output_buffer_json, {}),
    priority: row.priority || null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at)
  };
}

function dehydrateBuilding(building) {
  return {
    building_id: building.buildingId,
    plot_id: building.plotId,
    object_instance_id: building.objectInstanceId || null,
    type: building.type,
    level: Number(building.level),
    x: Number(building.x),
    y: Number(building.y),
    state: building.state,
    output_buffer_json: toJson(building.outputBuffer || {}, {}),
    priority: building.priority || null,
    created_at: Number(building.createdAt),
    updated_at: Number(building.updatedAt)
  };
}

function hydrateJob(row) {
  if (!row) return null;
  return {
    jobId: row.job_id,
    plotId: row.plot_id,
    buildingId: row.building_id,
    kind: row.kind,
    input: parseJson(row.input_json, {}),
    output: parseJson(row.output_json, {}),
    startedAt: row.started_at == null ? null : Number(row.started_at),
    endsAt: row.ends_at == null ? null : Number(row.ends_at),
    durationMs: Number(row.duration_ms || 0),
    status: row.status,
    createdBy: row.created_by,
    explanation: row.explanation || null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at)
  };
}

function dehydrateJob(job) {
  return {
    job_id: job.jobId,
    plot_id: job.plotId,
    building_id: job.buildingId,
    kind: job.kind,
    input_json: toJson(job.input || {}, {}),
    output_json: toJson(job.output || {}, {}),
    started_at: job.startedAt == null ? null : Number(job.startedAt),
    ends_at: job.endsAt == null ? null : Number(job.endsAt),
    duration_ms: Number(job.durationMs || 0),
    status: job.status,
    created_by: job.createdBy,
    explanation: job.explanation || null,
    created_at: Number(job.createdAt),
    updated_at: Number(job.updatedAt)
  };
}

function hydratePolicy(row) {
  if (!row) return null;
  return {
    plotId: row.plot_id,
    observeAndSuggest: !!row.observe_and_suggest,
    collectOutputs: !!row.collect_outputs,
    queueProduction: !!row.queue_production,
    setPriority: !!row.set_priority,
    sellSurplusFood: !!row.sell_surplus_food,
    sellDailyCoinCap: Number(row.sell_daily_coin_cap),
    maxAutonomousActionsPerHour: Number(row.max_autonomous_actions_per_hour),
    emergencyPause: !!row.emergency_pause,
    updatedAt: Number(row.updated_at)
  };
}

function dehydratePolicy(policy) {
  return {
    plot_id: policy.plotId,
    observe_and_suggest: policy.observeAndSuggest ? 1 : 0,
    collect_outputs: policy.collectOutputs ? 1 : 0,
    queue_production: policy.queueProduction ? 1 : 0,
    set_priority: policy.setPriority ? 1 : 0,
    sell_surplus_food: policy.sellSurplusFood ? 1 : 0,
    sell_daily_coin_cap: Number(policy.sellDailyCoinCap),
    max_autonomous_actions_per_hour: Number(policy.maxAutonomousActionsPerHour),
    emergency_pause: policy.emergencyPause ? 1 : 0,
    updated_at: Number(policy.updatedAt)
  };
}

function hydrateEvent(row) {
  if (!row) return null;
  return {
    eventSeq: Number(row.event_seq),
    plotId: row.plot_id,
    eventType: row.event_type,
    actor: row.actor,
    buildingId: row.building_id || null,
    jobId: row.job_id || null,
    summary: row.summary,
    explanation: row.explanation || null,
    data: parseJson(row.data_json, {}),
    createdAt: Number(row.created_at)
  };
}

function hydrateApproval(row) {
  if (!row) return null;
  return {
    approvalId: row.approval_id,
    plotId: row.plot_id,
    actionName: row.action_name,
    actionHash: row.action_hash,
    title: row.title,
    body: row.body,
    requestedParams: parseJson(row.requested_params_json, {}),
    status: row.status,
    createdBy: row.created_by,
    resolutionNote: row.resolution_note || null,
    usedAt: row.used_at == null ? null : Number(row.used_at),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    resolvedAt: row.resolved_at == null ? null : Number(row.resolved_at)
  };
}

function dehydrateApproval(approval) {
  return {
    approval_id: approval.approvalId,
    plot_id: approval.plotId,
    action_name: approval.actionName,
    action_hash: approval.actionHash,
    title: approval.title,
    body: approval.body,
    requested_params_json: toJson(approval.requestedParams || {}, {}),
    status: approval.status,
    created_by: approval.createdBy,
    resolution_note: approval.resolutionNote || null,
    used_at: approval.usedAt == null ? null : Number(approval.usedAt),
    created_at: Number(approval.createdAt),
    updated_at: Number(approval.updatedAt),
    resolved_at: approval.resolvedAt == null ? null : Number(approval.resolvedAt)
  };
}

function readPlotBundleByPairId(pairId) {
  ensureDb();
  const row = statements.plotByPair.get(pairId);
  if (!row) return null;
  return readPlotBundleById(row.plot_id);
}

function readPlotBundleById(plotId) {
  ensureDb();
  const plotRow = statements.plotById.get(plotId);
  if (!plotRow) return null;
  const plot = hydratePlot(plotRow);
  const buildings = statements.buildingsByPlot.all(plotId).map(hydrateBuilding);
  const jobs = statements.jobsByPlot.all(plotId).map(hydrateJob);
  const policy = hydratePolicy(statements.policyByPlot.get(plotId));
  return { plot, buildings, jobs, policy };
}

function writePlot(plot) {
  ensureDb();
  statements.upsertPlot.run(dehydratePlot(plot));
  return hydratePlot(statements.plotById.get(plot.plotId));
}

function writeBuildings(buildings) {
  ensureDb();
  const list = Array.isArray(buildings) ? buildings : [];
  for (const building of list) {
    statements.upsertBuilding.run(dehydrateBuilding(building));
  }
}

function writeJobs(jobs) {
  ensureDb();
  const list = Array.isArray(jobs) ? jobs : [];
  for (const job of list) {
    statements.upsertJob.run(dehydrateJob(job));
  }
}

function writePolicy(policy) {
  ensureDb();
  statements.upsertPolicy.run(dehydratePolicy(policy));
  return hydratePolicy(statements.policyByPlot.get(policy.plotId));
}

function appendEvents(events) {
  ensureDb();
  const out = [];
  for (const event of Array.isArray(events) ? events : []) {
    const payload = {
      plot_id: event.plotId,
      event_type: event.eventType,
      actor: event.actor,
      building_id: event.buildingId || null,
      job_id: event.jobId || null,
      summary: event.summary,
      explanation: event.explanation || null,
      data_json: toJson(event.data || {}, {}),
      created_at: Number(event.createdAt)
    };
    const result = statements.appendEvent.run(payload);
    out.push(hydrateEvent({
      event_seq: result.lastInsertRowid,
      plot_id: payload.plot_id,
      event_type: payload.event_type,
      actor: payload.actor,
      building_id: payload.building_id,
      job_id: payload.job_id,
      summary: payload.summary,
      explanation: payload.explanation,
      data_json: payload.data_json,
      created_at: payload.created_at
    }));
  }
  return out;
}

function listEvents(plotId, { sinceMs = null } = {}) {
  ensureDb();
  const rows = sinceMs == null
    ? statements.eventsByPlot.all(plotId)
    : statements.eventsByPlotSince.all(plotId, Number(sinceMs));
  return rows.map(hydrateEvent);
}

function getIdempotencyRecord(plotId, actionName, idempotencyKey) {
  ensureDb();
  const row = statements.idempotencyByKey.get(plotId, actionName, idempotencyKey);
  if (!row) return null;
  return {
    plotId: row.plot_id,
    actionName: row.action_name,
    idempotencyKey: row.idempotency_key,
    requestHash: row.request_hash,
    response: parseJson(row.response_json, null),
    createdAt: Number(row.created_at)
  };
}

function writeIdempotencyRecord(record) {
  ensureDb();
  statements.upsertIdempotency.run({
    plot_id: record.plotId,
    action_name: record.actionName,
    idempotency_key: record.idempotencyKey,
    request_hash: record.requestHash,
    response_json: toJson(record.response, {}),
    created_at: Number(record.createdAt)
  });
  return getIdempotencyRecord(record.plotId, record.actionName, record.idempotencyKey);
}

function listApprovals(plotId) {
  ensureDb();
  return statements.approvalsByPlot.all(plotId).map(hydrateApproval);
}

function getApproval(approvalId) {
  ensureDb();
  return hydrateApproval(statements.approvalById.get(approvalId));
}

function findMatchingApproval(plotId, actionName, actionHash) {
  ensureDb();
  return hydrateApproval(statements.matchingApproval.get(plotId, actionName, actionHash));
}

function findApprovedUnusedApproval(plotId, actionName, actionHash) {
  ensureDb();
  return hydrateApproval(statements.approvedUnusedApproval.get(plotId, actionName, actionHash));
}

function writeApproval(approval) {
  ensureDb();
  statements.upsertApproval.run(dehydrateApproval(approval));
  return getApproval(approval.approvalId);
}

function listPublicPlots(limit = 20) {
  ensureDb();
  return statements.publicPlots.all(Math.max(1, Math.min(100, Number(limit) || 20))).map((row) => ({
    plotId: row.plot_id,
    pairId: row.pair_id,
    houseId: row.house_id || null,
    hqLevel: Number(row.hq_level),
    townXp: Number(row.town_xp),
    updatedAt: Number(row.updated_at),
    inventory: parseJson(row.inventory_json, { wood: 0, stone: 0, food: 0, coin: 0 })
  }));
}

function resetFoundersPlotStore() {
  ensureDb();
  withTransaction(() => {
    statements.reset.approvals.run();
    statements.reset.idempotency.run();
    statements.reset.events.run();
    statements.reset.jobs.run();
    statements.reset.buildings.run();
    statements.reset.permissions.run();
    statements.reset.plots.run();
  });
}

module.exports = {
  getFoundersPlotStorePath,
  withTransaction,
  readPlotBundleByPairId,
  readPlotBundleById,
  writePlot,
  writeBuildings,
  writeJobs,
  writePolicy,
  appendEvents,
  listEvents,
  getIdempotencyRecord,
  writeIdempotencyRecord,
  listApprovals,
  getApproval,
  findMatchingApproval,
  findApprovedUnusedApproval,
  writeApproval,
  listPublicPlots,
  resetFoundersPlotStore
};
