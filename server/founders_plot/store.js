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
  if (db && statements) return db;
  // Guard against a prior partial init (db opened but schema/statements setup
  // threw). Reset and retry cleanly so the next call either succeeds fully or
  // surfaces the underlying error every time, rather than serving null-statement
  // crashes forever.
  if (db) {
    try { db.close(); } catch { /* ignore */ }
    db = null;
    statements = null;
  }
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
	      agent_tiers_xp_awarded_json TEXT NOT NULL DEFAULT '[]',
	      scout_reports_json TEXT NOT NULL DEFAULT '[]',
	      site_plans_json TEXT NOT NULL DEFAULT '[]',
	      doctrine_state_json TEXT NOT NULL DEFAULT '{}',
	      expedition_scouts_json TEXT NOT NULL DEFAULT '[]',
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

    CREATE TABLE IF NOT EXISTS founder_progression_strategies (
      strategy_id TEXT PRIMARY KEY,
      plot_id TEXT NOT NULL,
      strategy_key TEXT NOT NULL,
      title TEXT NOT NULL,
      selected INTEGER NOT NULL DEFAULT 0,
      strategy_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS founder_progression_strategies_plot_idx
      ON founder_progression_strategies (plot_id, selected, updated_at DESC);

    CREATE TABLE IF NOT EXISTS founder_plot_memberships (
      pair_id TEXT NOT NULL,
      plot_id TEXT NOT NULL,
      role TEXT NOT NULL,
      origin_claim_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (pair_id, plot_id)
    );
    CREATE INDEX IF NOT EXISTS founder_plot_memberships_plot_idx
      ON founder_plot_memberships (plot_id, pair_id);

    CREATE TABLE IF NOT EXISTS founder_settlement_claims (
      claim_id TEXT PRIMARY KEY,
      owner_pair_id TEXT NOT NULL,
      origin_plot_id TEXT NOT NULL,
      site_plan_id TEXT NOT NULL,
      report_id TEXT NOT NULL,
      founded_plot_id TEXT,
      convoy_job_id TEXT,
      approval_id TEXT,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      focus TEXT NOT NULL,
      site_type TEXT NOT NULL,
      risk TEXT NOT NULL,
      traits_json TEXT NOT NULL DEFAULT '[]',
      resource_hints_json TEXT NOT NULL DEFAULT '{}',
      route_json TEXT NOT NULL DEFAULT '{}',
      cost_json TEXT NOT NULL DEFAULT '{}',
      receipt_json TEXT NOT NULL DEFAULT '{}',
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      convoy_started_at INTEGER,
      convoy_ends_at INTEGER,
      founded_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS founder_settlement_claims_owner_idx
      ON founder_settlement_claims (owner_pair_id, status, updated_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS founder_settlement_claims_plan_unique_idx
      ON founder_settlement_claims (origin_plot_id, site_plan_id)
      WHERE status IN ('CLAIM_READY', 'CONVOY_PREPARING', 'CONVOY_ARRIVED', 'FOUNDED');

    CREATE TABLE IF NOT EXISTS founder_work_orders (
      work_order_id TEXT PRIMARY KEY,
      plot_id TEXT NOT NULL,
      template_id TEXT NOT NULL,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      scope_json TEXT NOT NULL DEFAULT '{}',
      allowed_actions_json TEXT NOT NULL DEFAULT '[]',
      caps_json TEXT NOT NULL DEFAULT '{}',
      policy_snapshot_json TEXT NOT NULL DEFAULT '{}',
      child_receipts_json TEXT NOT NULL DEFAULT '[]',
      created_by TEXT NOT NULL,
      approved_by TEXT,
      failure_reason TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      expires_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS founder_work_orders_plot_idx
      ON founder_work_orders (plot_id, status, updated_at DESC);

    CREATE TABLE IF NOT EXISTS founder_civic_proposals (
      proposal_id TEXT PRIMARY KEY,
      plot_id TEXT NOT NULL,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      scope_json TEXT NOT NULL DEFAULT '{}',
      review_json TEXT NOT NULL DEFAULT '{}',
      authority_boundary TEXT NOT NULL,
      created_by TEXT NOT NULL,
      approved_by TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      reviewed_at INTEGER,
      archived_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS founder_civic_proposals_plot_idx
      ON founder_civic_proposals (plot_id, status, updated_at DESC);

    CREATE TABLE IF NOT EXISTS founder_overlay_packs (
      overlay_pack_id TEXT PRIMARY KEY,
      plot_id TEXT NOT NULL,
      source_proposal_id TEXT NOT NULL,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      theme TEXT NOT NULL,
      summary TEXT NOT NULL,
      target_surface_ids_json TEXT NOT NULL DEFAULT '[]',
      target_node_ids_json TEXT NOT NULL DEFAULT '[]',
      display_hints_json TEXT NOT NULL DEFAULT '{}',
      prompt_json TEXT NOT NULL DEFAULT '{}',
      provenance_json TEXT NOT NULL DEFAULT '{}',
      visual_only INTEGER NOT NULL DEFAULT 1,
      authority_boundary TEXT NOT NULL,
      created_by TEXT NOT NULL,
      approved_by TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      reviewed_at INTEGER,
      archived_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS founder_overlay_packs_plot_idx
      ON founder_overlay_packs (plot_id, status, updated_at DESC);

    CREATE TABLE IF NOT EXISTS founder_civic_projects (
      project_id TEXT PRIMARY KEY,
      plot_id TEXT NOT NULL,
      source_proposal_id TEXT NOT NULL,
      status TEXT NOT NULL,
      project_type TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      effect_json TEXT NOT NULL DEFAULT '{}',
      receipt_json TEXT NOT NULL DEFAULT '{}',
      authority_boundary TEXT NOT NULL,
      created_by TEXT NOT NULL,
      approved_by TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      activated_at INTEGER,
      archived_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS founder_civic_projects_plot_idx
      ON founder_civic_projects (plot_id, status, updated_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS founder_civic_projects_source_unique_idx
      ON founder_civic_projects (plot_id, source_proposal_id);
  `);
	  // Lightweight migrations for pre-existing local/test DBs.
	  try {
	    const cols = db.prepare("PRAGMA table_info(founder_plots)").all();
	    const hasAgentTiers = cols.some((c) => c.name === 'agent_tiers_xp_awarded_json');
	    if (!hasAgentTiers) {
	      db.exec("ALTER TABLE founder_plots ADD COLUMN agent_tiers_xp_awarded_json TEXT NOT NULL DEFAULT '[]';");
	    }
	    const hasScoutReports = cols.some((c) => c.name === 'scout_reports_json');
	    if (!hasScoutReports) {
	      db.exec("ALTER TABLE founder_plots ADD COLUMN scout_reports_json TEXT NOT NULL DEFAULT '[]';");
	    }
	    const hasSitePlans = cols.some((c) => c.name === 'site_plans_json');
	    if (!hasSitePlans) {
	      db.exec("ALTER TABLE founder_plots ADD COLUMN site_plans_json TEXT NOT NULL DEFAULT '[]';");
	    }
	    const hasDoctrineState = cols.some((c) => c.name === 'doctrine_state_json');
	    if (!hasDoctrineState) {
	      db.exec("ALTER TABLE founder_plots ADD COLUMN doctrine_state_json TEXT NOT NULL DEFAULT '{}';");
	    }
	    const hasExpeditionScouts = cols.some((c) => c.name === 'expedition_scouts_json');
	    if (!hasExpeditionScouts) {
	      db.exec("ALTER TABLE founder_plots ADD COLUMN expedition_scouts_json TEXT NOT NULL DEFAULT '[]';");
	    }
	  } catch {
	    /* ignore migration check errors; fresh DBs created above already have the columns */
	  }
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
        collected_building_types_json, agent_tiers_xp_awarded_json, scout_reports_json, site_plans_json, doctrine_state_json, expedition_scouts_json, last_daily_bonus_day, daily_sold_coin, daily_sell_day,
	        last_viewed_at, pending_recap_from, pending_recap_to, created_at, updated_at, last_simulated_at
	      ) VALUES (
	        @plot_id, @pair_id, @house_id, @status, @hq_level, @town_xp, @inventory_json, @storage_caps_json,
	        @construction_slots, @next_build_buff_pct, @claimed_rewards_json, @seen_building_types_json,
        @collected_building_types_json, @agent_tiers_xp_awarded_json, @scout_reports_json, @site_plans_json, @doctrine_state_json, @expedition_scouts_json, @last_daily_bonus_day, @daily_sold_coin, @daily_sell_day,
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
	        agent_tiers_xp_awarded_json = excluded.agent_tiers_xp_awarded_json,
	        scout_reports_json = excluded.scout_reports_json,
	        site_plans_json = excluded.site_plans_json,
	        doctrine_state_json = excluded.doctrine_state_json,
	        expedition_scouts_json = excluded.expedition_scouts_json,
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
    progressionStrategiesByPlot: database.prepare(`
      SELECT * FROM founder_progression_strategies
      WHERE plot_id = ?
      ORDER BY selected DESC, updated_at DESC, created_at DESC, strategy_id ASC
    `),
    progressionStrategyById: database.prepare(`
      SELECT * FROM founder_progression_strategies WHERE strategy_id = ? LIMIT 1
    `),
    upsertProgressionStrategy: database.prepare(`
      INSERT INTO founder_progression_strategies (
        strategy_id, plot_id, strategy_key, title, selected, strategy_json, created_at, updated_at
      ) VALUES (
        @strategy_id, @plot_id, @strategy_key, @title, @selected, @strategy_json, @created_at, @updated_at
      )
      ON CONFLICT(strategy_id) DO UPDATE SET
        plot_id = excluded.plot_id,
        strategy_key = excluded.strategy_key,
        title = excluded.title,
        selected = excluded.selected,
        strategy_json = excluded.strategy_json,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
    `),
    clearSelectedProgressionStrategies: database.prepare(`
      UPDATE founder_progression_strategies SET selected = 0, updated_at = ? WHERE plot_id = ?
    `),
    selectProgressionStrategy: database.prepare(`
      UPDATE founder_progression_strategies SET selected = 1, updated_at = ? WHERE plot_id = ? AND strategy_id = ?
    `),
    membershipsByPair: database.prepare(`
      SELECT * FROM founder_plot_memberships WHERE pair_id = ? ORDER BY role ASC, created_at ASC, plot_id ASC
    `),
    membershipByPairPlot: database.prepare(`
      SELECT * FROM founder_plot_memberships WHERE pair_id = ? AND plot_id = ? LIMIT 1
    `),
    upsertPlotMembership: database.prepare(`
      INSERT INTO founder_plot_memberships (
        pair_id, plot_id, role, origin_claim_id, created_at, updated_at
      ) VALUES (
        @pair_id, @plot_id, @role, @origin_claim_id, @created_at, @updated_at
      )
      ON CONFLICT(pair_id, plot_id) DO UPDATE SET
        role = excluded.role,
        origin_claim_id = excluded.origin_claim_id,
        updated_at = excluded.updated_at
    `),
    settlementClaimsByOwner: database.prepare(`
      SELECT * FROM founder_settlement_claims
      WHERE owner_pair_id = ?
      ORDER BY created_at ASC, claim_id ASC
    `),
    settlementClaimsByOrigin: database.prepare(`
      SELECT * FROM founder_settlement_claims
      WHERE origin_plot_id = ?
      ORDER BY created_at ASC, claim_id ASC
    `),
    settlementClaimById: database.prepare(`
      SELECT * FROM founder_settlement_claims WHERE claim_id = ? LIMIT 1
    `),
    settlementClaimByPlan: database.prepare(`
      SELECT * FROM founder_settlement_claims
      WHERE origin_plot_id = ? AND site_plan_id = ? AND status IN ('CLAIM_READY', 'CONVOY_PREPARING', 'CONVOY_ARRIVED', 'FOUNDED')
      ORDER BY created_at ASC, claim_id ASC
      LIMIT 1
    `),
    upsertSettlementClaim: database.prepare(`
      INSERT INTO founder_settlement_claims (
        claim_id, owner_pair_id, origin_plot_id, site_plan_id, report_id, founded_plot_id,
        convoy_job_id, approval_id, status, title, focus, site_type, risk, traits_json,
        resource_hints_json, route_json, cost_json, receipt_json, created_by, created_at,
        updated_at, convoy_started_at, convoy_ends_at, founded_at
      ) VALUES (
        @claim_id, @owner_pair_id, @origin_plot_id, @site_plan_id, @report_id, @founded_plot_id,
        @convoy_job_id, @approval_id, @status, @title, @focus, @site_type, @risk, @traits_json,
        @resource_hints_json, @route_json, @cost_json, @receipt_json, @created_by, @created_at,
        @updated_at, @convoy_started_at, @convoy_ends_at, @founded_at
      )
      ON CONFLICT(claim_id) DO UPDATE SET
        owner_pair_id = excluded.owner_pair_id,
        origin_plot_id = excluded.origin_plot_id,
        site_plan_id = excluded.site_plan_id,
        report_id = excluded.report_id,
        founded_plot_id = excluded.founded_plot_id,
        convoy_job_id = excluded.convoy_job_id,
        approval_id = excluded.approval_id,
        status = excluded.status,
        title = excluded.title,
        focus = excluded.focus,
        site_type = excluded.site_type,
        risk = excluded.risk,
        traits_json = excluded.traits_json,
        resource_hints_json = excluded.resource_hints_json,
        route_json = excluded.route_json,
        cost_json = excluded.cost_json,
        receipt_json = excluded.receipt_json,
        created_by = excluded.created_by,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        convoy_started_at = excluded.convoy_started_at,
        convoy_ends_at = excluded.convoy_ends_at,
        founded_at = excluded.founded_at
    `),
    workOrdersByPlot: database.prepare(`
      SELECT * FROM founder_work_orders
      WHERE plot_id = ?
      ORDER BY created_at ASC, work_order_id ASC
    `),
    workOrderById: database.prepare('SELECT * FROM founder_work_orders WHERE work_order_id = ? LIMIT 1'),
    upsertWorkOrder: database.prepare(`
      INSERT INTO founder_work_orders (
        work_order_id, plot_id, template_id, status, title, scope_json,
        allowed_actions_json, caps_json, policy_snapshot_json, child_receipts_json,
        created_by, approved_by, failure_reason, created_at, updated_at, expires_at
      ) VALUES (
        @work_order_id, @plot_id, @template_id, @status, @title, @scope_json,
        @allowed_actions_json, @caps_json, @policy_snapshot_json, @child_receipts_json,
        @created_by, @approved_by, @failure_reason, @created_at, @updated_at, @expires_at
      )
      ON CONFLICT(work_order_id) DO UPDATE SET
        plot_id = excluded.plot_id,
        template_id = excluded.template_id,
        status = excluded.status,
        title = excluded.title,
        scope_json = excluded.scope_json,
        allowed_actions_json = excluded.allowed_actions_json,
        caps_json = excluded.caps_json,
        policy_snapshot_json = excluded.policy_snapshot_json,
        child_receipts_json = excluded.child_receipts_json,
        created_by = excluded.created_by,
        approved_by = excluded.approved_by,
        failure_reason = excluded.failure_reason,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        expires_at = excluded.expires_at
    `),
    civicProposalsByPlot: database.prepare(`
      SELECT * FROM founder_civic_proposals
      WHERE plot_id = ?
      ORDER BY created_at ASC, proposal_id ASC
    `),
    civicProposalById: database.prepare('SELECT * FROM founder_civic_proposals WHERE proposal_id = ? LIMIT 1'),
    upsertCivicProposal: database.prepare(`
      INSERT INTO founder_civic_proposals (
        proposal_id, plot_id, status, title, category, summary, scope_json,
        review_json, authority_boundary, created_by, approved_by, created_at,
        updated_at, reviewed_at, archived_at
      ) VALUES (
        @proposal_id, @plot_id, @status, @title, @category, @summary, @scope_json,
        @review_json, @authority_boundary, @created_by, @approved_by, @created_at,
        @updated_at, @reviewed_at, @archived_at
      )
      ON CONFLICT(proposal_id) DO UPDATE SET
        plot_id = excluded.plot_id,
        status = excluded.status,
        title = excluded.title,
        category = excluded.category,
        summary = excluded.summary,
        scope_json = excluded.scope_json,
        review_json = excluded.review_json,
        authority_boundary = excluded.authority_boundary,
        created_by = excluded.created_by,
        approved_by = excluded.approved_by,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        reviewed_at = excluded.reviewed_at,
        archived_at = excluded.archived_at
    `),
    overlayPacksByPlot: database.prepare(`
      SELECT * FROM founder_overlay_packs
      WHERE plot_id = ?
      ORDER BY created_at ASC, overlay_pack_id ASC
    `),
    overlayPackById: database.prepare('SELECT * FROM founder_overlay_packs WHERE overlay_pack_id = ? LIMIT 1'),
    upsertOverlayPack: database.prepare(`
      INSERT INTO founder_overlay_packs (
        overlay_pack_id, plot_id, source_proposal_id, status, title, theme, summary,
        target_surface_ids_json, target_node_ids_json, display_hints_json, prompt_json,
        provenance_json, visual_only, authority_boundary, created_by, approved_by,
        created_at, updated_at, reviewed_at, archived_at
      ) VALUES (
        @overlay_pack_id, @plot_id, @source_proposal_id, @status, @title, @theme, @summary,
        @target_surface_ids_json, @target_node_ids_json, @display_hints_json, @prompt_json,
        @provenance_json, @visual_only, @authority_boundary, @created_by, @approved_by,
        @created_at, @updated_at, @reviewed_at, @archived_at
      )
      ON CONFLICT(overlay_pack_id) DO UPDATE SET
        plot_id = excluded.plot_id,
        source_proposal_id = excluded.source_proposal_id,
        status = excluded.status,
        title = excluded.title,
        theme = excluded.theme,
        summary = excluded.summary,
        target_surface_ids_json = excluded.target_surface_ids_json,
        target_node_ids_json = excluded.target_node_ids_json,
        display_hints_json = excluded.display_hints_json,
        prompt_json = excluded.prompt_json,
        provenance_json = excluded.provenance_json,
        visual_only = excluded.visual_only,
        authority_boundary = excluded.authority_boundary,
        created_by = excluded.created_by,
        approved_by = excluded.approved_by,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        reviewed_at = excluded.reviewed_at,
        archived_at = excluded.archived_at
    `),
    civicProjectsByPlot: database.prepare(`
      SELECT * FROM founder_civic_projects
      WHERE plot_id = ?
      ORDER BY created_at ASC, project_id ASC
    `),
    civicProjectById: database.prepare('SELECT * FROM founder_civic_projects WHERE project_id = ? LIMIT 1'),
    civicProjectBySourceProposal: database.prepare(`
      SELECT * FROM founder_civic_projects
      WHERE plot_id = ? AND source_proposal_id = ?
      LIMIT 1
    `),
    upsertCivicProject: database.prepare(`
      INSERT INTO founder_civic_projects (
        project_id, plot_id, source_proposal_id, status, project_type, title, summary,
        effect_json, receipt_json, authority_boundary, created_by, approved_by,
        created_at, updated_at, activated_at, archived_at
      ) VALUES (
        @project_id, @plot_id, @source_proposal_id, @status, @project_type, @title, @summary,
        @effect_json, @receipt_json, @authority_boundary, @created_by, @approved_by,
        @created_at, @updated_at, @activated_at, @archived_at
      )
      ON CONFLICT(project_id) DO UPDATE SET
        plot_id = excluded.plot_id,
        source_proposal_id = excluded.source_proposal_id,
        status = excluded.status,
        project_type = excluded.project_type,
        title = excluded.title,
        summary = excluded.summary,
        effect_json = excluded.effect_json,
        receipt_json = excluded.receipt_json,
        authority_boundary = excluded.authority_boundary,
        created_by = excluded.created_by,
        approved_by = excluded.approved_by,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        activated_at = excluded.activated_at,
        archived_at = excluded.archived_at
    `),
    reset: {
      civicProjects: database.prepare('DELETE FROM founder_civic_projects'),
      overlayPacks: database.prepare('DELETE FROM founder_overlay_packs'),
      civicProposals: database.prepare('DELETE FROM founder_civic_proposals'),
      workOrders: database.prepare('DELETE FROM founder_work_orders'),
      settlementClaims: database.prepare('DELETE FROM founder_settlement_claims'),
      plotMemberships: database.prepare('DELETE FROM founder_plot_memberships'),
      progressionStrategies: database.prepare('DELETE FROM founder_progression_strategies'),
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
	    agentTiersXpAwarded: parseJson(row.agent_tiers_xp_awarded_json, []),
	    scoutReports: parseJson(row.scout_reports_json, []),
	    sitePlans: parseJson(row.site_plans_json, []),
	    doctrineState: parseJson(row.doctrine_state_json, {}),
	    expeditionScouts: parseJson(row.expedition_scouts_json, []),
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
	    agent_tiers_xp_awarded_json: toJson(plot.agentTiersXpAwarded || [], []),
	    scout_reports_json: toJson(plot.scoutReports || [], []),
	    site_plans_json: toJson(plot.sitePlans || [], []),
	    doctrine_state_json: toJson(plot.doctrineState || {}, {}),
	    expedition_scouts_json: toJson(plot.expeditionScouts || [], []),
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

function hydrateProgressionStrategy(row) {
  if (!row) return null;
  const strategy = parseJson(row.strategy_json, {});
  return {
    strategyId: row.strategy_id,
    plotId: row.plot_id,
    strategyKey: row.strategy_key,
    title: row.title,
    selected: !!row.selected,
    strategy,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at)
  };
}

function dehydrateProgressionStrategy(record) {
  return {
    strategy_id: record.strategyId,
    plot_id: record.plotId,
    strategy_key: record.strategyKey,
    title: record.title,
    selected: record.selected ? 1 : 0,
    strategy_json: toJson(record.strategy || {}, {}),
    created_at: Number(record.createdAt),
    updated_at: Number(record.updatedAt)
  };
}

function hydratePlotMembership(row) {
  if (!row) return null;
  return {
    pairId: row.pair_id,
    plotId: row.plot_id,
    role: row.role,
    originClaimId: row.origin_claim_id || null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at)
  };
}

function dehydratePlotMembership(membership) {
  return {
    pair_id: membership.pairId,
    plot_id: membership.plotId,
    role: membership.role,
    origin_claim_id: membership.originClaimId || null,
    created_at: Number(membership.createdAt),
    updated_at: Number(membership.updatedAt)
  };
}

function hydrateSettlementClaim(row) {
  if (!row) return null;
  return {
    claimId: row.claim_id,
    ownerPairId: row.owner_pair_id,
    originPlotId: row.origin_plot_id,
    sitePlanId: row.site_plan_id,
    reportId: row.report_id,
    foundedPlotId: row.founded_plot_id || null,
    convoyJobId: row.convoy_job_id || null,
    approvalId: row.approval_id || null,
    status: row.status,
    title: row.title,
    focus: row.focus,
    siteType: row.site_type,
    risk: row.risk,
    traits: parseJson(row.traits_json, []),
    resourceHints: parseJson(row.resource_hints_json, {}),
    route: parseJson(row.route_json, {}),
    cost: parseJson(row.cost_json, {}),
    receipt: parseJson(row.receipt_json, {}),
    createdBy: row.created_by,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    convoyStartedAt: row.convoy_started_at == null ? null : Number(row.convoy_started_at),
    convoyEndsAt: row.convoy_ends_at == null ? null : Number(row.convoy_ends_at),
    foundedAt: row.founded_at == null ? null : Number(row.founded_at)
  };
}

function dehydrateSettlementClaim(claim) {
  return {
    claim_id: claim.claimId,
    owner_pair_id: claim.ownerPairId,
    origin_plot_id: claim.originPlotId,
    site_plan_id: claim.sitePlanId,
    report_id: claim.reportId,
    founded_plot_id: claim.foundedPlotId || null,
    convoy_job_id: claim.convoyJobId || null,
    approval_id: claim.approvalId || null,
    status: claim.status,
    title: claim.title,
    focus: claim.focus,
    site_type: claim.siteType,
    risk: claim.risk,
    traits_json: toJson(claim.traits || [], []),
    resource_hints_json: toJson(claim.resourceHints || {}, {}),
    route_json: toJson(claim.route || {}, {}),
    cost_json: toJson(claim.cost || {}, {}),
    receipt_json: toJson(claim.receipt || {}, {}),
    created_by: claim.createdBy,
    created_at: Number(claim.createdAt),
    updated_at: Number(claim.updatedAt),
    convoy_started_at: claim.convoyStartedAt == null ? null : Number(claim.convoyStartedAt),
    convoy_ends_at: claim.convoyEndsAt == null ? null : Number(claim.convoyEndsAt),
    founded_at: claim.foundedAt == null ? null : Number(claim.foundedAt)
  };
}

function hydrateWorkOrder(row) {
  if (!row) return null;
  return {
    workOrderId: row.work_order_id,
    plotId: row.plot_id,
    templateId: row.template_id,
    status: row.status,
    title: row.title,
    scope: parseJson(row.scope_json, {}),
    allowedActions: parseJson(row.allowed_actions_json, []),
    caps: parseJson(row.caps_json, {}),
    policySnapshot: parseJson(row.policy_snapshot_json, {}),
    childReceipts: parseJson(row.child_receipts_json, []),
    createdBy: row.created_by,
    approvedBy: row.approved_by || null,
    failureReason: row.failure_reason || null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    expiresAt: row.expires_at == null ? null : Number(row.expires_at)
  };
}

function dehydrateWorkOrder(workOrder) {
  return {
    work_order_id: workOrder.workOrderId,
    plot_id: workOrder.plotId,
    template_id: workOrder.templateId,
    status: workOrder.status,
    title: workOrder.title,
    scope_json: toJson(workOrder.scope || {}, {}),
    allowed_actions_json: toJson(workOrder.allowedActions || [], []),
    caps_json: toJson(workOrder.caps || {}, {}),
    policy_snapshot_json: toJson(workOrder.policySnapshot || {}, {}),
    child_receipts_json: toJson(workOrder.childReceipts || [], []),
    created_by: workOrder.createdBy,
    approved_by: workOrder.approvedBy || null,
    failure_reason: workOrder.failureReason || null,
    created_at: Number(workOrder.createdAt),
    updated_at: Number(workOrder.updatedAt),
    expires_at: workOrder.expiresAt == null ? null : Number(workOrder.expiresAt)
  };
}

function hydrateCivicProposal(row) {
  if (!row) return null;
  return {
    proposalId: row.proposal_id,
    plotId: row.plot_id,
    status: row.status,
    title: row.title,
    category: row.category,
    summary: row.summary,
    scope: parseJson(row.scope_json, {}),
    review: parseJson(row.review_json, {}),
    authorityBoundary: row.authority_boundary,
    createdBy: row.created_by,
    approvedBy: row.approved_by || null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    reviewedAt: row.reviewed_at == null ? null : Number(row.reviewed_at),
    archivedAt: row.archived_at == null ? null : Number(row.archived_at)
  };
}

function dehydrateCivicProposal(proposal) {
  return {
    proposal_id: proposal.proposalId,
    plot_id: proposal.plotId,
    status: proposal.status,
    title: proposal.title,
    category: proposal.category,
    summary: proposal.summary,
    scope_json: toJson(proposal.scope || {}, {}),
    review_json: toJson(proposal.review || {}, {}),
    authority_boundary: proposal.authorityBoundary,
    created_by: proposal.createdBy,
    approved_by: proposal.approvedBy || null,
    created_at: Number(proposal.createdAt),
    updated_at: Number(proposal.updatedAt),
    reviewed_at: proposal.reviewedAt == null ? null : Number(proposal.reviewedAt),
    archived_at: proposal.archivedAt == null ? null : Number(proposal.archivedAt)
  };
}

function hydrateOverlayPack(row) {
  if (!row) return null;
  return {
    overlayPackId: row.overlay_pack_id,
    plotId: row.plot_id,
    sourceProposalId: row.source_proposal_id,
    status: row.status,
    title: row.title,
    theme: row.theme,
    summary: row.summary,
    targetSurfaceIds: parseJson(row.target_surface_ids_json, []),
    targetNodeIds: parseJson(row.target_node_ids_json, []),
    displayHints: parseJson(row.display_hints_json, {}),
    prompt: parseJson(row.prompt_json, {}),
    provenance: parseJson(row.provenance_json, {}),
    visualOnly: row.visual_only !== 0,
    presentationOnly: true,
    gameplayMutationPolicy: 'presentation_only',
    authorityBoundary: row.authority_boundary,
    createdBy: row.created_by,
    approvedBy: row.approved_by || null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    reviewedAt: row.reviewed_at == null ? null : Number(row.reviewed_at),
    archivedAt: row.archived_at == null ? null : Number(row.archived_at)
  };
}

function dehydrateOverlayPack(pack) {
  return {
    overlay_pack_id: pack.overlayPackId,
    plot_id: pack.plotId,
    source_proposal_id: pack.sourceProposalId,
    status: pack.status,
    title: pack.title,
    theme: pack.theme,
    summary: pack.summary,
    target_surface_ids_json: toJson(pack.targetSurfaceIds || [], []),
    target_node_ids_json: toJson(pack.targetNodeIds || [], []),
    display_hints_json: toJson(pack.displayHints || {}, {}),
    prompt_json: toJson(pack.prompt || {}, {}),
    provenance_json: toJson(pack.provenance || {}, {}),
    visual_only: pack.visualOnly === false ? 0 : 1,
    authority_boundary: pack.authorityBoundary,
    created_by: pack.createdBy,
    approved_by: pack.approvedBy || null,
    created_at: Number(pack.createdAt),
    updated_at: Number(pack.updatedAt),
    reviewed_at: pack.reviewedAt == null ? null : Number(pack.reviewedAt),
    archived_at: pack.archivedAt == null ? null : Number(pack.archivedAt)
  };
}

function hydrateCivicProject(row) {
  if (!row) return null;
  return {
    projectId: row.project_id,
    plotId: row.plot_id,
    sourceProposalId: row.source_proposal_id,
    status: row.status,
    projectType: row.project_type,
    title: row.title,
    summary: row.summary,
    effect: parseJson(row.effect_json, {}),
    receipt: parseJson(row.receipt_json, {}),
    authorityBoundary: row.authority_boundary,
    createdBy: row.created_by,
    approvedBy: row.approved_by || null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    activatedAt: row.activated_at == null ? null : Number(row.activated_at),
    archivedAt: row.archived_at == null ? null : Number(row.archived_at)
  };
}

function dehydrateCivicProject(project) {
  return {
    project_id: project.projectId,
    plot_id: project.plotId,
    source_proposal_id: project.sourceProposalId,
    status: project.status,
    project_type: project.projectType,
    title: project.title,
    summary: project.summary,
    effect_json: toJson(project.effect || {}, {}),
    receipt_json: toJson(project.receipt || {}, {}),
    authority_boundary: project.authorityBoundary,
    created_by: project.createdBy,
    approved_by: project.approvedBy || null,
    created_at: Number(project.createdAt),
    updated_at: Number(project.updatedAt),
    activated_at: project.activatedAt == null ? null : Number(project.activatedAt),
    archived_at: project.archivedAt == null ? null : Number(project.archivedAt)
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

function listProgressionStrategies(plotId) {
  ensureDb();
  return statements.progressionStrategiesByPlot.all(plotId).map(hydrateProgressionStrategy);
}

function getProgressionStrategy(strategyId) {
  ensureDb();
  return hydrateProgressionStrategy(statements.progressionStrategyById.get(strategyId));
}

function writeProgressionStrategy(record) {
  ensureDb();
  statements.upsertProgressionStrategy.run(dehydrateProgressionStrategy(record));
  return getProgressionStrategy(record.strategyId);
}

function selectProgressionStrategy(plotId, strategyId, updatedAt) {
  ensureDb();
  return withTransaction(() => {
    statements.clearSelectedProgressionStrategies.run(Number(updatedAt), plotId);
    statements.selectProgressionStrategy.run(Number(updatedAt), plotId, strategyId);
    return getProgressionStrategy(strategyId);
  });
}

function listPlotMemberships(pairId) {
  ensureDb();
  return statements.membershipsByPair.all(pairId).map(hydratePlotMembership);
}

function getPlotMembership(pairId, plotId) {
  ensureDb();
  return hydratePlotMembership(statements.membershipByPairPlot.get(pairId, plotId));
}

function writePlotMembership(membership) {
  ensureDb();
  statements.upsertPlotMembership.run(dehydratePlotMembership(membership));
  return getPlotMembership(membership.pairId, membership.plotId);
}

function listSettlementClaimsByOwner(pairId) {
  ensureDb();
  return statements.settlementClaimsByOwner.all(pairId).map(hydrateSettlementClaim);
}

function listSettlementClaimsByOrigin(originPlotId) {
  ensureDb();
  return statements.settlementClaimsByOrigin.all(originPlotId).map(hydrateSettlementClaim);
}

function getSettlementClaim(claimId) {
  ensureDb();
  return hydrateSettlementClaim(statements.settlementClaimById.get(claimId));
}

function findSettlementClaimForPlan(originPlotId, sitePlanId) {
  ensureDb();
  return hydrateSettlementClaim(statements.settlementClaimByPlan.get(originPlotId, sitePlanId));
}

function writeSettlementClaim(claim) {
  ensureDb();
  statements.upsertSettlementClaim.run(dehydrateSettlementClaim(claim));
  return getSettlementClaim(claim.claimId);
}

function listWorkOrdersByPlot(plotId) {
  ensureDb();
  return statements.workOrdersByPlot.all(plotId).map(hydrateWorkOrder);
}

function getWorkOrder(workOrderId) {
  ensureDb();
  return hydrateWorkOrder(statements.workOrderById.get(workOrderId));
}

function writeWorkOrder(workOrder) {
  ensureDb();
  statements.upsertWorkOrder.run(dehydrateWorkOrder(workOrder));
  return getWorkOrder(workOrder.workOrderId);
}

function listCivicProposalsByPlot(plotId) {
  ensureDb();
  return statements.civicProposalsByPlot.all(plotId).map(hydrateCivicProposal);
}

function getCivicProposal(proposalId) {
  ensureDb();
  return hydrateCivicProposal(statements.civicProposalById.get(proposalId));
}

function writeCivicProposal(proposal) {
  ensureDb();
  statements.upsertCivicProposal.run(dehydrateCivicProposal(proposal));
  return getCivicProposal(proposal.proposalId);
}

function listOverlayPacksByPlot(plotId) {
  ensureDb();
  return statements.overlayPacksByPlot.all(plotId).map(hydrateOverlayPack);
}

function getOverlayPack(overlayPackId) {
  ensureDb();
  return hydrateOverlayPack(statements.overlayPackById.get(overlayPackId));
}

function writeOverlayPack(pack) {
  ensureDb();
  statements.upsertOverlayPack.run(dehydrateOverlayPack(pack));
  return getOverlayPack(pack.overlayPackId);
}

function listCivicProjectsByPlot(plotId) {
  ensureDb();
  return statements.civicProjectsByPlot.all(plotId).map(hydrateCivicProject);
}

function getCivicProject(projectId) {
  ensureDb();
  return hydrateCivicProject(statements.civicProjectById.get(projectId));
}

function getCivicProjectForProposal(plotId, sourceProposalId) {
  ensureDb();
  return hydrateCivicProject(statements.civicProjectBySourceProposal.get(plotId, sourceProposalId));
}

function writeCivicProject(project) {
  ensureDb();
  statements.upsertCivicProject.run(dehydrateCivicProject(project));
  return getCivicProject(project.projectId);
}

function resetFoundersPlotStore() {
  ensureDb();
  withTransaction(() => {
    statements.reset.civicProjects.run();
    statements.reset.overlayPacks.run();
    statements.reset.civicProposals.run();
    statements.reset.workOrders.run();
    statements.reset.settlementClaims.run();
    statements.reset.plotMemberships.run();
    statements.reset.progressionStrategies.run();
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
  listProgressionStrategies,
  getProgressionStrategy,
  writeProgressionStrategy,
  selectProgressionStrategy,
  listPlotMemberships,
  getPlotMembership,
  writePlotMembership,
  listSettlementClaimsByOwner,
  listSettlementClaimsByOrigin,
  getSettlementClaim,
  findSettlementClaimForPlan,
  writeSettlementClaim,
  listWorkOrdersByPlot,
  getWorkOrder,
  writeWorkOrder,
  listCivicProposalsByPlot,
  getCivicProposal,
  writeCivicProposal,
  listOverlayPacksByPlot,
  getOverlayPack,
  writeOverlayPack,
  listCivicProjectsByPlot,
  getCivicProject,
  getCivicProjectForProposal,
  writeCivicProject,
  resetFoundersPlotStore
};
