'use strict';

/**
 * Founders Plot — contract tests (FP-CT-*).
 *
 * These tests validate the argsSchema and resultSchema on each tool spec:
 *   - Every tool has valid schema shape (type: object, required arrays, etc.)
 *   - The engine's envelope shape satisfies each tool's resultSchema
 *   - A valid sample args payload is accepted by argsSchema
 *   - A deliberately invalid args payload is rejected
 *
 * We use a tiny hand-rolled JSON Schema checker (not ajv) so we don't pull a
 * new dev dependency. It covers object/array/string/integer/boolean/null
 * unions, required, additionalProperties=false, min/maxLength, minLength, and
 * simple nested objects — enough to fully validate the spec shapes here.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(os.tmpdir(), `fp-contract-${Date.now()}-${process.pid}.sqlite`);

const { FOUNDERS_PLOT_TOOL_SPECS } = require('../server/founders_plot/tools');
const engine = require('../server/founders_plot/engine');
const store = require('../server/founders_plot/store');

// ---------------------------------------------------------------------------
// Minimal JSON Schema validator — returns [] (no errors) when value conforms.
// ---------------------------------------------------------------------------

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;
}

function typesAllowed(schemaType) {
  if (Array.isArray(schemaType)) return schemaType;
  if (typeof schemaType === 'string') return [schemaType];
  return [];
}

function validate(value, schema, path = '$') {
  const errs = [];
  if (!schema) return errs;
  const allowed = typesAllowed(schema.type);
  if (allowed.length) {
    const actual = typeOf(value);
    // integer passes "number"; number does NOT pass "integer".
    const ok = allowed.includes(actual)
      || (allowed.includes('number') && (actual === 'integer'));
    if (!ok) {
      errs.push(`${path}: expected ${allowed.join('|')} got ${actual}`);
      return errs;
    }
  }
  const t = typeOf(value);
  if (t === 'object' && schema.properties) {
    const props = schema.properties;
    for (const [k, sub] of Object.entries(props)) {
      if (k in value) errs.push(...validate(value[k], sub, `${path}.${k}`));
    }
    for (const req of (schema.required || [])) {
      if (!(req in value)) errs.push(`${path}.${req}: required`);
    }
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(value)) {
        if (!(k in props)) errs.push(`${path}.${k}: not allowed (additionalProperties=false)`);
      }
    }
  }
  if (t === 'array' && schema.items) {
    for (let i = 0; i < value.length; i += 1) {
      errs.push(...validate(value[i], schema.items, `${path}[${i}]`));
    }
  }
  if (t === 'string') {
    if (Number.isFinite(schema.minLength) && value.length < schema.minLength) {
      errs.push(`${path}: shorter than minLength ${schema.minLength}`);
    }
    if (Number.isFinite(schema.maxLength) && value.length > schema.maxLength) {
      errs.push(`${path}: longer than maxLength ${schema.maxLength}`);
    }
  }
  return errs;
}

function expectValid(value, schema, label) {
  const errs = validate(value, schema, label);
  assert.deepEqual(errs, [], `${label} should be valid but got:\n${errs.join('\n')}`);
}

function expectInvalid(value, schema, label) {
  const errs = validate(value, schema, label);
  assert.ok(errs.length > 0, `${label} should have been invalid`);
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function fresh(pairId = `session:ct-${Math.random().toString(36).slice(2)}`) {
  store.resetFoundersPlotStore();
  return engine.getFoundersPlotState({ pairId, houseId: null, nowMs: 1700_000_000_000 });
}

function findSpec(name) {
  const spec = FOUNDERS_PLOT_TOOL_SPECS.find((s) => s.name === name);
  assert.ok(spec, `Missing tool spec: ${name}`);
  return spec;
}

// ---------------------------------------------------------------------------
// Schema shape invariants
// ---------------------------------------------------------------------------

test('FP-CT-001 every tool spec has name, description, argsSchema, resultSchema', () => {
  assert.ok(Array.isArray(FOUNDERS_PLOT_TOOL_SPECS) && FOUNDERS_PLOT_TOOL_SPECS.length >= 9);
  for (const spec of FOUNDERS_PLOT_TOOL_SPECS) {
    assert.equal(typeof spec.name, 'string', 'name is string');
    assert.ok(spec.name.startsWith('et.plot.'), `spec name must be namespaced: ${spec.name}`);
    assert.equal(typeof spec.description, 'string', `${spec.name} description is string`);
    assert.equal(spec.argsSchema.type, 'object', `${spec.name} argsSchema is object`);
    assert.equal(spec.resultSchema.type, 'object', `${spec.name} resultSchema is object`);
    // Envelope required fields present on every resultSchema
    const req = spec.resultSchema.required || [];
    for (const key of ['ok', 'plotId', 'worldDelta', 'error']) {
      assert.ok(req.includes(key), `${spec.name} resultSchema requires ${key}`);
    }
  }
});

test('FP-CT-002 argsSchema rejects requests missing idempotencyKey on mutations', () => {
  const mutators = ['et.plot.place_building', 'et.plot.queue_job', 'et.plot.collect_outputs',
    'et.plot.draft_site_plan', 'et.plot.draft_site_plan_from_packet', 'et.plot.review_site_plan', 'et.plot.select_doctrine',
    'et.plot.create_work_order_draft', 'et.plot.execute_work_order', 'et.plot.scout_sector', 'et.plot.move_expedition_unit', 'et.plot.create_civic_proposal',
    'et.plot.create_overlay_pack', 'et.plot.activate_civic_project', 'et.plot.inspect_civic_project',
    'et.plot.prepare_settler_convoy', 'et.plot.found_settlement',
    'et.plot.upgrade_building', 'et.plot.set_priority', 'et.plot.claim_reward',
    'et.plot.request_user_approval'];
  for (const name of mutators) {
    const spec = findSpec(name);
    assert.ok((spec.argsSchema.required || []).includes('idempotencyKey'),
      `${name} must require idempotencyKey`);
  }
});

// ---------------------------------------------------------------------------
// Args schema acceptance/rejection
// ---------------------------------------------------------------------------

test('FP-CT-003 place_building argsSchema validates', () => {
  const spec = findSpec('et.plot.place_building');
  expectValid({
    type: 'LUMBER_CAMP', x: 0, y: 1, idempotencyKey: 'ct-3-ok',
  }, spec.argsSchema, 'place_building valid');
  expectInvalid({ type: 'LUMBER_CAMP', x: 0, y: 1 /* missing idempotencyKey */ },
    spec.argsSchema, 'place_building missing idempotencyKey');
  expectInvalid({ type: 'LUMBER_CAMP', x: 'zero', y: 1, idempotencyKey: 'k' },
    spec.argsSchema, 'place_building bad x type');
});

test('FP-CT-004 queue_job argsSchema validates', () => {
  const spec = findSpec('et.plot.queue_job');
  expectValid({ buildingId: 'b-1', kind: 'PRODUCE', idempotencyKey: 'ct-4-ok' },
    spec.argsSchema, 'queue_job valid');
  expectInvalid({ buildingId: 'b-1', idempotencyKey: 'k' /* missing kind */ },
    spec.argsSchema, 'queue_job missing kind');
});

test('FP-CT-005 request_user_approval argsSchema requires action/params/title/body', () => {
  const spec = findSpec('et.plot.request_user_approval');
  expectValid({
    action: 'et.plot.upgrade_building',
    params: { buildingId: 'b-hq' },
    title: 'Upgrade HQ to Level 2',
    body: 'Costs 40 wood + 20 stone.',
    idempotencyKey: 'ct-5-ok',
  }, spec.argsSchema, 'request_user_approval valid');
  expectInvalid({
    action: 'et.plot.upgrade_building',
    title: 'x',
    body: 'y',
    idempotencyKey: 'k',
  }, spec.argsSchema, 'request_user_approval missing params');
});

test('FP-CT-006 HQ7 Settler Convoy argsSchemas validate', () => {
  expectValid({ sitePlanId: 'site_plan_1', idempotencyKey: 'ct-6-prepare' },
    findSpec('et.plot.prepare_settler_convoy').argsSchema, 'prepare_settler_convoy valid');
  expectInvalid({ idempotencyKey: 'ct-6-prepare' },
    findSpec('et.plot.prepare_settler_convoy').argsSchema, 'prepare_settler_convoy missing sitePlanId');
  expectValid({ claimId: 'claim_1', idempotencyKey: 'ct-6-found' },
    findSpec('et.plot.found_settlement').argsSchema, 'found_settlement valid');
  expectInvalid({ claimId: 'claim_1' },
    findSpec('et.plot.found_settlement').argsSchema, 'found_settlement missing idempotencyKey');
  expectValid({}, findSpec('et.plot.list_plots').argsSchema, 'list_plots valid');
});

test('FP-CT-006b HQ10A World Grid read-only argsSchema validates', () => {
  expectValid({}, findSpec('et.plot.get_world_grid_status').argsSchema, 'get_world_grid_status empty args valid');
  expectValid({ plotId: 'plot_1' }, findSpec('et.plot.get_world_grid_status').argsSchema, 'get_world_grid_status plot args valid');
  expectInvalid({ idempotencyKey: 'ct-6b-not-a-mutation' },
    findSpec('et.plot.get_world_grid_status').argsSchema, 'get_world_grid_status rejects mutation idempotency');
  expectValid({}, findSpec('et.plot.get_expedition_map').argsSchema, 'get_expedition_map empty args valid');
  expectValid({ plotId: 'plot_1' }, findSpec('et.plot.get_expedition_map').argsSchema, 'get_expedition_map plot args valid');
  expectInvalid({ idempotencyKey: 'ct-6b-expedition-map-not-a-mutation' },
    findSpec('et.plot.get_expedition_map').argsSchema, 'get_expedition_map rejects mutation idempotency');
  expectValid({ idempotencyKey: 'ct-6b-scout-sector' },
    findSpec('et.plot.scout_sector').argsSchema, 'scout_sector default target valid');
  expectValid({ cellId: 'cell_q1_r0', actorType: 'AGENT', idempotencyKey: 'ct-6b-scout-sector-agent' },
    findSpec('et.plot.scout_sector').argsSchema, 'scout_sector actorType valid');
  expectInvalid({ cellId: 'cell_q1_r0' },
    findSpec('et.plot.scout_sector').argsSchema, 'scout_sector missing idempotency');
  expectValid({ unitId: 'expedition_unit_pathfinder_scout_v1', targetCellId: 'cell_q1_r0', idempotencyKey: 'ct-6b-move-unit' },
    findSpec('et.plot.move_expedition_unit').argsSchema, 'move_expedition_unit valid');
  expectInvalid({ unitId: 'expedition_unit_pathfinder_scout_v1', targetCellId: 'cell_q1_r0' },
    findSpec('et.plot.move_expedition_unit').argsSchema, 'move_expedition_unit missing idempotency');
  expectValid({}, findSpec('et.plot.list_civic_proposals').argsSchema, 'list_civic_proposals empty args valid');
  expectInvalid({ idempotencyKey: 'ct-6b-list-not-a-mutation' },
    findSpec('et.plot.list_civic_proposals').argsSchema, 'list_civic_proposals rejects mutation idempotency');
  expectValid({}, findSpec('et.plot.list_overlay_packs').argsSchema, 'list_overlay_packs empty args valid');
  expectInvalid({ idempotencyKey: 'ct-6b-overlay-list-not-a-mutation' },
    findSpec('et.plot.list_overlay_packs').argsSchema, 'list_overlay_packs rejects mutation idempotency');
  expectValid({}, findSpec('et.plot.list_civic_projects').argsSchema, 'list_civic_projects empty args valid');
  expectInvalid({ idempotencyKey: 'ct-6b-project-list-not-a-mutation' },
    findSpec('et.plot.list_civic_projects').argsSchema, 'list_civic_projects rejects mutation idempotency');
});

test('FP-CT-007 HQ8B Research Lodge doctrine argsSchema validates', () => {
  expectValid({ doctrineId: 'survey_discipline', idempotencyKey: 'ct-7-doctrine' },
    findSpec('et.plot.select_doctrine').argsSchema, 'select_doctrine valid');
  expectInvalid({ idempotencyKey: 'ct-7-doctrine' },
    findSpec('et.plot.select_doctrine').argsSchema, 'select_doctrine missing doctrineId');
});

test('FP-CT-008 HQ9A work-order draft argsSchema validates', () => {
  expectValid({
    templateId: 'collect_ready_outputs_once',
    scope: { buildingIds: ['bldg_1'] },
    idempotencyKey: 'ct-8-work-order'
  }, findSpec('et.plot.create_work_order_draft').argsSchema, 'create_work_order_draft valid');
  expectInvalid({ idempotencyKey: 'ct-8-work-order' },
    findSpec('et.plot.create_work_order_draft').argsSchema, 'create_work_order_draft missing templateId');
});

test('FP-CT-009 HQ9B work-order executor argsSchema validates narrow explicit action', () => {
  expectValid({
    workOrderId: 'work_order_1',
    actor: 'HUMAN',
    idempotencyKey: 'ct-9-work-order-execute'
  }, findSpec('et.plot.execute_work_order').argsSchema, 'execute_work_order valid');
  expectInvalid({ idempotencyKey: 'ct-9-work-order-execute' },
    findSpec('et.plot.execute_work_order').argsSchema, 'execute_work_order missing workOrderId');
});

test('FP-CT-010 HQ10B civic proposal argsSchema validates narrow advisory records', () => {
  expectValid({
    title: 'Civic map table',
    category: 'coordination',
    summary: 'Review whether the outpost needs a shared civic map table.',
    status: 'DRAFT',
    relatedPlotIds: ['plot_1'],
    actor: 'HUMAN',
    idempotencyKey: 'ct-10-civic-proposal'
  }, findSpec('et.plot.create_civic_proposal').argsSchema, 'create_civic_proposal valid');
  expectInvalid({
    title: 'Missing summary',
    idempotencyKey: 'ct-10-civic-proposal'
  }, findSpec('et.plot.create_civic_proposal').argsSchema, 'create_civic_proposal missing summary');
});

test('FP-CT-011 HQ10C overlay pack argsSchema validates presentation-only records', () => {
  expectValid({
    sourceProposalId: 'civic_proposal_1',
    title: 'Civic lantern skin',
    theme: 'civic_lanterns',
    summary: 'Presentation-only labels and skins for World Grid nodes.',
    status: 'DRAFT',
    targetSurfaceIds: ['progression_atlas', 'world_grid'],
    targetNodeIds: ['world_grid.read_model'],
    displayHints: { labels: { world_grid: 'Lantern Grid' }, skins: ['lantern'] },
    prompt: 'Warm civic lantern overlay, no gameplay changes.',
    provenance: { source: 'test' },
    actor: 'HUMAN',
    idempotencyKey: 'ct-11-overlay-pack'
  }, findSpec('et.plot.create_overlay_pack').argsSchema, 'create_overlay_pack valid');
  expectInvalid({
    title: 'Missing source proposal',
    summary: 'No source.',
    idempotencyKey: 'ct-11-overlay-pack'
  }, findSpec('et.plot.create_overlay_pack').argsSchema, 'create_overlay_pack missing sourceProposalId');
});

test('FP-CT-012 HQ10D civic project activation argsSchema validates bounded project records', () => {
  expectValid({
    sourceProposalId: 'civic_proposal_1',
    projectType: 'civic_beacon',
    title: 'Civic Beacon',
    summary: 'Activate a local public-work beacon with a readiness marker.',
    actor: 'HUMAN',
    idempotencyKey: 'ct-12-civic-project'
  }, findSpec('et.plot.activate_civic_project').argsSchema, 'activate_civic_project valid');
  expectInvalid({
    title: 'Missing proposal',
    idempotencyKey: 'ct-12-civic-project'
  }, findSpec('et.plot.activate_civic_project').argsSchema, 'activate_civic_project missing sourceProposalId');
  expectValid({
    projectId: 'civic_project_1',
    inspectionType: 'baseline_readiness',
    note: 'Baseline readiness inspection.',
    actor: 'HUMAN',
    idempotencyKey: 'ct-12-civic-project-inspection'
  }, findSpec('et.plot.inspect_civic_project').argsSchema, 'inspect_civic_project valid');
  expectInvalid({
    note: 'Missing project id',
    idempotencyKey: 'ct-12-civic-project-inspection'
  }, findSpec('et.plot.inspect_civic_project').argsSchema, 'inspect_civic_project missing projectId');
});

// ---------------------------------------------------------------------------
// Engine envelope conforms to resultSchema
// ---------------------------------------------------------------------------

test('FP-CT-101 get_state envelope conforms to resultSchema', () => {
  const env = fresh();
  const spec = findSpec('et.plot.get_state');
  expectValid(env, spec.resultSchema, 'get_state envelope');
});

test('FP-CT-101b get_world_grid_status envelope conforms to resultSchema', () => {
  const env = fresh();
  const spec = findSpec('et.plot.get_world_grid_status');
  const out = engine.getWorldGridStatus({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    nowMs: 1700_000_000_000
  });
  expectValid(out, spec.resultSchema, 'get_world_grid_status envelope');
  assert.equal(out.worldDelta.length, 0);
  assert.equal(out.worldGrid.readOnly, true);
});

test('FP-CT-101b2 get_expedition_map envelope conforms to resultSchema', () => {
  const env = fresh();
  const bundle = store.readPlotBundleById(env.plotId);
  bundle.plot.scoutReports = [{
    reportId: 'scout_report_ct_units',
    originPlotId: env.plotId,
    sourceBuildingId: 'bldg_expedition_ct_units',
    title: 'Contract Unit Survey',
    siteType: 'forest_edge',
    risk: 'low',
    traits: ['safe'],
    resourceHints: {},
    summary: 'Known revealed cell for unit roster contract.',
    recommendedNext: 'Keep this as map truth.',
    sequence: 1,
    createdAt: 1700_000_000_000
  }];
  bundle.plot.sitePlans = [{
    planId: 'site_plan_ct_units',
    reportId: 'scout_report_ct_units',
    originPlotId: env.plotId,
    title: 'Contract Unit Site Plan',
    focus: 'safe',
    status: 'REVIEWED',
    promotionStatus: 'reviewed_claim_ready',
    reviewStatus: 'reviewed',
    source: 'scout_report',
    siteType: 'forest_edge',
    risk: 'low',
    traits: ['safe'],
    resourceHints: {},
    summary: 'Reviewed known cell.',
    recommendedNext: 'Show a Surveyor token.',
    sequence: 1,
    createdAt: 1700_000_000_000
  }];
  store.writePlot(bundle.plot);
  const spec = findSpec('et.plot.get_expedition_map');
  const out = engine.getExpeditionMapStatus({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    nowMs: 1700_000_000_000
  });
  expectValid(out, spec.resultSchema, 'get_expedition_map envelope');
  assert.equal(out.worldDelta.length, 0);
  assert.equal(out.expeditionMap.readOnly, true);
  assert.deepEqual(out.expeditionMap.executableActions, []);
  assert.equal(out.expeditionMap.surveyBridge.readOnly, true);
  assert.deepEqual(out.expeditionMap.surveyBridge.executableActions, []);
  assert.equal(out.expeditionMap.surveyBridge.authorityBoundary, engine.EXPEDITION_SURVEY_BRIDGE_AUTHORITY_BOUNDARY);
  assert.equal(out.expeditionMap.surveyBridge.status, 'WAITING_FOR_SCOUT_PACKET');
  assert.equal(out.expeditionMap.surveyBridge.boundaryFlags.addsMutationAuthority, false);
  assert.equal(out.expeditionMap.expeditionParty.readOnly, true);
  assert.deepEqual(out.expeditionMap.expeditionParty.executableActions, []);
  assert.deepEqual(out.expeditionMap.expeditionParty.members.map((member) => member.memberId), [
    'pathfinder-scout-v1',
    'rook-signalpost-messenger-v1',
    'hq-civic-operator-vale-desk-7-v1'
  ]);
  assert.equal(out.expeditionMap.expeditionParty.boundaryFlags.operatorAssignment, false);
  assert.equal(out.expeditionMap.expeditionParty.boundaryFlags.externalEffects, false);
  assert.equal(out.expeditionMap.units.authorityBoundary, engine.EXPEDITION_UNIT_ROSTER_AUTHORITY_BOUNDARY);
  assert.equal(out.expeditionMap.units.version, engine.EXPEDITION_UNIT_ROSTER_VERSION);
  assert.equal(out.expeditionMap.units.readOnly, true);
  assert.deepEqual(out.expeditionMap.units.executableActions, []);
  assert.equal(out.expeditionMap.units.interactionModel.mapTokens, true);
  assert.equal(out.expeditionMap.units.interactionModel.movementPreviewOnly, false);
  assert.equal(out.expeditionMap.units.interactionModel.movementCommandReady, true);
  assert.equal(out.expeditionMap.units.boundaryFlags.movementMutation, true);
  assert.equal(out.expeditionMap.units.boundaryFlags.movementRevealsFog, false);
  assert.equal(out.expeditionMap.units.boundaryFlags.autonomousMovement, false);
  assert.equal(out.expeditionMap.units.boundaryFlags.externalEffects, false);
  assert.ok(out.expeditionMap.units.items.some((unit) => unit.unitType === 'scout'));
  assert.ok(out.expeditionMap.units.items.some((unit) => unit.unitType === 'courier'));
  assert.ok(out.expeditionMap.units.items.some((unit) => unit.unitType === 'surveyor'));
  assert.ok(out.expeditionMap.units.items.some((unit) => unit.unitType === 'field_support'));
  assert.equal(out.expeditionMap.units.items.every((unit) => unit.readOnly === true), true);
  assert.equal(out.expeditionMap.units.items.some((unit) => unit.unitType === 'scout' && unit.movement.movementMutationImplemented === true), true);
  assert.equal(out.expeditionMap.cells.every((cell) => cell.terrainAssetContractVersion === engine.EXPEDITION_PUBLIC_TERRAIN_ASSET_CONTRACT_VERSION), true);
  assert.equal(out.expeditionMap.cells
    .filter((cell) => ['hinted', 'locked_unknown'].includes(cell.fogState))
    .every((cell) => cell.publicTerrainAssetSlot == null && ['hinted_frontier_fog', 'locked_unknown_fog'].includes(cell.fogAssetSlot)), true);
});

test('FP-CT-101b3 scout_sector envelope conforms to resultSchema', () => {
  const env = fresh();
  const target = env.state.expeditionMap.cells.find((cell) => cell.fogState === 'hinted');
  assert.ok(target, 'fresh map has an origin-adjacent hinted cell');
  const spec = findSpec('et.plot.scout_sector');
  const out = engine.scoutExpeditionSector({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    cellId: target.cellId,
    actor: 'HUMAN',
    idempotencyKey: 'ct-101b3-scout-sector',
    nowMs: 1700_000_000_000
  });
  expectValid(out, spec.resultSchema, 'scout_sector envelope');
  assert.equal(out.ok, true);
  assert.equal(out.proof.targetBeforeFogState, 'hinted');
  assert.equal(out.proof.targetAfterFogState, 'known');
  assert.equal(out.scoutSector.receipt.routeCreation, false);
  assert.equal(out.eventPacket.packetId, out.scoutSector.eventPacket.packetId);
  assert.equal(out.scoutSector.receipt.eventPacketId, out.eventPacket.packetId);
  assert.equal(out.eventPacket.readOnly, true);
  assert.deepEqual(out.eventPacket.executableActions, []);
  assert.equal(out.eventPacket.partyId, out.eventPacket.partySnapshot.partyId);
  assert.equal(out.eventPacket.partySnapshot.readOnly, true);
  assert.deepEqual(out.eventPacket.partySnapshot.executableActions, []);
  assert.deepEqual(out.eventPacket.partySnapshot.members.map((member) => member.displayName), [
    'Mira Trailmark',
    'Rook Signalpost',
    'Vale-Desk 7'
  ]);
  assert.equal(out.eventPacket.partySnapshot.boundaryFlags.operatorAssignment, false);
  assert.equal(out.eventPacket.partySnapshot.boundaryFlags.routeCreation, false);
  assert.equal(out.eventPacket.receiptLink.actionName, 'et.plot.scout_sector');
  assert.equal(out.eventPacket.boundaryFlags.routeCreation, false);
  assert.equal(out.expeditionMap.surveyBridge.readOnly, true);
  assert.deepEqual(out.expeditionMap.surveyBridge.executableActions, []);
  assert.equal(out.expeditionMap.surveyBridge.activePacketId, out.eventPacket.packetId);
  assert.equal(out.expeditionMap.surveyBridge.activeCandidate.commandState.commandId, 'draft_site_plan_from_packet');
  assert.equal(out.expeditionMap.surveyBridge.activeCandidate.commandState.actionName, 'et.plot.draft_site_plan_from_packet');
  assert.equal(out.expeditionMap.surveyBridge.activeCandidate.commandState.serverMutationImplemented, true);
  assert.equal(out.expeditionMap.surveyBridge.boundaryFlags.createsSitePlan, false);
  assert.equal(out.eventPacket.boundaryFlags.atlasExecution, false);
});

test('FP-CT-101b3i draft_site_plan_from_packet envelope conforms to resultSchema', () => {
  const env = fresh();
  const bundle = store.readPlotBundleById(env.plotId);
  bundle.plot.hqLevel = 3;
  bundle.plot.storageCaps = engine.HQ_LEVEL_RULES[3].storageCaps;
  bundle.plot.constructionSlots = engine.HQ_LEVEL_RULES[3].constructionSlots;
  store.writePlot(bundle.plot);
  const target = env.state.expeditionMap.cells.find((cell) => cell.fogState === 'hinted');
  const scouted = engine.scoutExpeditionSector({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    cellId: target.cellId,
    actor: 'HUMAN',
    idempotencyKey: 'ct-101b3i-scout-sector',
    nowMs: 1700_000_000_000
  });
  const spec = findSpec('et.plot.draft_site_plan_from_packet');
  const out = engine.draftSitePlanFromPacket({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    packetId: scouted.eventPacket.packetId,
    actor: 'HUMAN',
    idempotencyKey: 'ct-101b3i-packet-plan',
    nowMs: 1700_000_001_000
  });
  expectValid(out, spec.resultSchema, 'draft_site_plan_from_packet envelope');
  assert.equal(out.ok, true);
  assert.equal(out.packetId, scouted.eventPacket.packetId);
  assert.equal(out.cellId, target.cellId);
  assert.equal(out.sitePlan.source, 'scout_sector_event_packet');
  assert.equal(out.sitePlan.sourcePacketId, scouted.eventPacket.packetId);
  assert.equal(out.sitePlan.sourceCellId, target.cellId);
  assert.equal(out.proof.actionName, 'et.plot.draft_site_plan_from_packet');
  assert.equal(out.proof.boundaryFlags.createsSitePlan, true);
  assert.equal(out.proof.boundaryFlags.createsSurveyor, false);
  assert.equal(out.proof.boundaryFlags.routeCreation, false);
  assert.equal(out.proof.boundaryFlags.resourceHarvesting, false);
  assert.equal(out.proof.boundaryFlags.atlasExecution, false);
  assert.equal(out.expeditionMap.surveyBridge.status, 'SITE_PLAN_PRESENT');
});

test('FP-CT-101b4 move_expedition_unit envelope conforms to resultSchema', () => {
  const env = fresh();
  const bundle = store.readPlotBundleById(env.plotId);
  bundle.plot.scoutReports = [{
    reportId: 'scout_report_ct_move',
    originPlotId: env.plotId,
    sourceBuildingId: 'bldg_expedition_ct_move',
    title: 'Contract Move Survey',
    siteType: 'forest_edge',
    risk: 'low',
    traits: ['safe'],
    resourceHints: {},
    summary: 'Known revealed cell for movement contract.',
    recommendedNext: 'Move Scout for contract proof.',
    sequence: 1,
    createdAt: 1700_000_000_000
  }];
  bundle.plot.sitePlans = [{
    planId: 'site_plan_ct_move',
    reportId: 'scout_report_ct_move',
    originPlotId: env.plotId,
    title: 'Contract Move Site Plan',
    focus: 'safe',
    status: 'REVIEWED',
    promotionStatus: 'reviewed_claim_ready',
    reviewStatus: 'reviewed',
    source: 'scout_report',
    siteType: 'forest_edge',
    risk: 'low',
    traits: ['safe'],
    resourceHints: {},
    summary: 'Reviewed known cell.',
    recommendedNext: 'Move Scout for contract proof.',
    sequence: 1,
    createdAt: 1700_000_000_000
  }];
  store.writePlot(bundle.plot);
  const map = engine.getExpeditionMapStatus({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    nowMs: 1700_000_000_000
  }).expeditionMap;
  const scout = map.units.items.find((unit) => unit.unitType === 'scout');
  const targetCellId = scout.movement.allowedTargetCellIds[0];
  assert.ok(targetCellId, 'fresh scout has an adjacent revealed move target');
  const spec = findSpec('et.plot.move_expedition_unit');
  const out = engine.moveExpeditionUnit({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    unitId: scout.unitId,
    targetCellId,
    actor: 'HUMAN',
    idempotencyKey: 'ct-101b4-move-unit',
    nowMs: 1700_000_001_000
  });
  expectValid(out, spec.resultSchema, 'move_expedition_unit envelope');
  assert.equal(out.ok, true);
  assert.equal(out.movedUnitId, scout.unitId);
  assert.equal(out.targetCellId, targetCellId);
  assert.equal(out.move.receipt.actionName, 'et.plot.move_expedition_unit');
  assert.equal(out.move.receipt.movementRevealsFog, false);
  assert.equal(out.move.receipt.routeCreation, false);
  assert.equal(out.proof.fogCountsUnchanged, true);
  assert.equal(out.proof.boundaryFlags.autonomousMovement, false);
  assert.equal(out.proof.boundaryFlags.externalEffects, false);
});

test('FP-CT-101c list_civic_proposals envelope conforms to resultSchema', () => {
  const env = fresh();
  const spec = findSpec('et.plot.list_civic_proposals');
  const out = engine.listCivicProposalRecords({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    nowMs: 1700_000_000_000
  });
  expectValid(out, spec.resultSchema, 'list_civic_proposals envelope');
  assert.deepEqual(out.proposals, []);
  assert.equal(out.civicProposals.proposalOnly, true);
});

test('FP-CT-101d list_overlay_packs envelope conforms to resultSchema', () => {
  const env = fresh();
  const spec = findSpec('et.plot.list_overlay_packs');
  const out = engine.listOverlayPackRecords({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    nowMs: 1700_000_000_000
  });
  expectValid(out, spec.resultSchema, 'list_overlay_packs envelope');
  assert.deepEqual(out.packs, []);
  assert.equal(out.overlayPacks.presentationOnly, true);
  assert.deepEqual(out.overlayPacks.executableActions, []);
});

test('FP-CT-101e list_civic_projects envelope conforms to resultSchema', () => {
  const env = fresh();
  const spec = findSpec('et.plot.list_civic_projects');
  const out = engine.listCivicProjectRecords({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    nowMs: 1700_000_000_000
  });
  expectValid(out, spec.resultSchema, 'list_civic_projects envelope');
  assert.deepEqual(out.projects, []);
  assert.equal(out.civicProjects.publicWork, true);
});

test('FP-CT-101f inspect_civic_project error envelope conforms to resultSchema', () => {
  const env = fresh();
  const spec = findSpec('et.plot.inspect_civic_project');
  const out = engine.inspectCivicProject({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    projectId: 'missing_civic_project',
    actor: 'HUMAN',
    idempotencyKey: 'ct-101f-inspect',
    nowMs: 1700_000_000_000
  });
  assert.equal(out.ok, false);
  expectValid(out, spec.resultSchema, 'inspect_civic_project error envelope');
});

test('FP-CT-102 place_building envelope conforms to resultSchema', () => {
  const env = fresh();
  const spec = findSpec('et.plot.place_building');
  const out = engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ct-102', nowMs: 1700_000_000_000,
  });
  expectValid(out, spec.resultSchema, 'place_building envelope');
});

test('FP-CT-103 queue_job + collect_outputs envelopes conform', () => {
  const env = fresh();
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ct-103-place', nowMs: 1700_000_000_000,
  });
  engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: 5 * 60_000, nowMs: 1700_000_000_000,
  });
  const s1 = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_300_000 });
  const lc = s1.state.buildings.find((b) => b.type === 'LUMBER_CAMP');
  assert.ok(lc, 'lumber camp present');
  const queued = engine.queueJob({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    buildingId: lc.buildingId, kind: 'PRODUCE', actor: 'HUMAN',
    idempotencyKey: 'ct-103-queue', nowMs: 1700_000_300_000,
  });
  expectValid(queued, findSpec('et.plot.queue_job').resultSchema, 'queue_job envelope');
  engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: 10 * 60_000, nowMs: 1700_000_300_000,
  });
  const collected = engine.collectOutputs({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    buildingId: lc.buildingId, actor: 'HUMAN',
    idempotencyKey: 'ct-103-collect', nowMs: 1700_000_900_000,
  });
  expectValid(collected, findSpec('et.plot.collect_outputs').resultSchema, 'collect_outputs envelope');
});

test('FP-CT-104 error envelope also conforms to resultSchema', () => {
  const env = fresh();
  // Place a building then try to place over it (tiles are unique)
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ct-104-a', nowMs: 1700_000_000_000,
  });
  const out = engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'FARM_PLOT', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ct-104-b', nowMs: 1700_000_000_000,
  });
  assert.equal(out.ok, false, 'second placement should fail');
  expectValid(out, findSpec('et.plot.place_building').resultSchema, 'place_building error envelope');
  assert.ok(out.error && typeof out.error.code === 'string', 'error.code present');
});
