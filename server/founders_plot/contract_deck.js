const REQUESTERS_V12 = [
  {
    requesterId: 'jasper_depot_clerk',
    displayName: 'Jasper at the Depot',
    institution: 'Atlas Depot',
    roleTitle: 'Depot Clerk',
    portraitEmoji: '🧰',
    personalityTag: 'practical',
    signalAffinity: 'depotReadiness',
    completedContracts: 0,
    missedContracts: 0,
    lastContractId: '',
    lastSeenAtMs: 0
  },
  {
    requesterId: 'mara_market_host',
    displayName: 'Mara from Market Circle',
    institution: 'Market Circle',
    roleTitle: 'Market Host',
    portraitEmoji: '🥘',
    personalityTag: 'warm',
    signalAffinity: 'marketConfidence',
    completedContracts: 0,
    missedContracts: 0,
    lastContractId: '',
    lastSeenAtMs: 0
  },
  {
    requesterId: 'nell_neighbor_lead',
    displayName: 'Nell from Neighbor Row',
    institution: 'Neighbor Row',
    roleTitle: 'Neighbor Lead',
    portraitEmoji: '🏡',
    personalityTag: 'careful',
    signalAffinity: 'neighborGoodwill',
    completedContracts: 0,
    missedContracts: 0,
    lastContractId: '',
    lastSeenAtMs: 0
  },
  {
    requesterId: 'clara_town_scribe',
    displayName: 'Clara at Town Hall',
    institution: 'Town Hall',
    roleTitle: 'Town Scribe',
    portraitEmoji: '📜',
    personalityTag: 'ambitious',
    signalAffinity: 'publicCharm',
    completedContracts: 0,
    missedContracts: 0,
    lastContractId: '',
    lastSeenAtMs: 0
  }
];

function copyJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeCount(value) {
  const numeric = Math.max(0, Math.floor(Number(value) || 0));
  return Number.isFinite(numeric) ? numeric : 0;
}

function requesterById() {
  return new Map(REQUESTERS_V12.map((requester) => [requester.requesterId, requester]));
}

function defaultRequesterState() {
  return REQUESTERS_V12.map((requester) => copyJson(requester));
}

function normalizeRequester(raw = {}) {
  return {
    requesterId: String(raw.requesterId || ''),
    displayName: String(raw.displayName || ''),
    institution: String(raw.institution || ''),
    roleTitle: String(raw.roleTitle || ''),
    portraitEmoji: String(raw.portraitEmoji || ''),
    personalityTag: String(raw.personalityTag || ''),
    signalAffinity: String(raw.signalAffinity || ''),
    completedContracts: normalizeCount(raw.completedContracts),
    missedContracts: normalizeCount(raw.missedContracts),
    lastContractId: String(raw.lastContractId || ''),
    lastSeenAtMs: normalizeCount(raw.lastSeenAtMs)
  };
}

function normalizeRequesterList(raw) {
  const baseline = requesterById();
  const incoming = Array.isArray(raw) ? raw.map((requester) => normalizeRequester(requester)).filter((requester) => requester.requesterId) : [];
  const merged = [];
  for (const expected of REQUESTERS_V12) {
    const found = incoming.find((requester) => requester.requesterId === expected.requesterId) || expected;
    merged.push(normalizeRequester({ ...expected, ...found }));
  }
  for (const requester of incoming) {
    if (baseline.has(requester.requesterId)) continue;
    merged.push(requester);
  }
  return merged;
}

function createRequesterSnapshot(requester) {
  return {
    displayName: String(requester?.displayName || ''),
    institution: String(requester?.institution || ''),
    roleTitle: String(requester?.roleTitle || ''),
    portraitEmoji: String(requester?.portraitEmoji || '')
  };
}

function findRequester(requesters = [], requesterId = '') {
  return requesters.find((requester) => requester.requesterId === requesterId) || null;
}

function hasBuilding(state, buildingType, minCount = 1) {
  return (Array.isArray(state?.buildings) ? state.buildings : []).filter((building) => (
    String(building?.type || '') === String(buildingType || '')
    && String(building?.state || '') !== 'UNDER_CONSTRUCTION'
  )).length >= minCount;
}

function inventoryCount(state, key) {
  return normalizeCount(state?.plot?.inventory?.[key]);
}

function makeResources(resources = {}) {
  const next = {};
  for (const key of ['wood', 'stone', 'food', 'coin']) {
    const numeric = normalizeCount(resources[key]);
    if (numeric > 0) next[key] = numeric;
  }
  return next;
}

function makeRequirements({ resources = null, buildings = null } = {}) {
  return {
    resources: makeResources(resources || {}),
    buildings: Array.isArray(buildings)
      ? buildings.map((entry) => ({
        buildingType: String(entry?.buildingType || ''),
        minCount: Math.max(1, normalizeCount(entry?.minCount || 1))
      })).filter((entry) => entry.buildingType)
      : []
  };
}

function makeRewards({ resources = null, townXp = 0, signalDelta = null } = {}) {
  return {
    resources: makeResources(resources || {}),
    townXp: normalizeCount(townXp),
    signalDelta: signalDelta && typeof signalDelta === 'object' ? copyJson(signalDelta) : {}
  };
}

const CONTRACT_TEMPLATES_V12 = {
  SUPPLY: [
    {
      deckKey: 'supply_stock_depot',
      requesterId: 'jasper_depot_clerk',
      isValid: (state) => normalizeCount(state?.plot?.hqLevel) >= 2,
      build: () => ({
        title: 'Stock the Depot',
        whyNow: 'The first wagons are lining up and Jasper needs dry timber for repairs.',
        townBenefit: 'The depot looks more reliable to incoming travelers.',
        philosophyHint: 'This favors stability and logistics.',
        requirements: makeRequirements({ resources: { wood: 12 } }),
        rewards: makeRewards({
          resources: { coin: 5 },
          townXp: 8,
          signalDelta: { depotReadiness: 6 }
        })
      })
    },
    {
      deckKey: 'supply_neighbor_crates',
      requesterId: 'nell_neighbor_lead',
      isValid: (state) => normalizeCount(state?.plot?.hqLevel) >= 2,
      build: () => ({
        title: 'Porch Crates for Neighbor Row',
        whyNow: 'Nell wants sturdy crates stacked before more families drift in.',
        townBenefit: 'Neighbor Row feels like people can settle instead of merely pass through.',
        philosophyHint: 'This favors calm local trust.',
        requirements: makeRequirements({ resources: { wood: 8 } }),
        rewards: makeRewards({
          resources: { coin: 4 },
          townXp: 7,
          signalDelta: { neighborGoodwill: 5 }
        })
      })
    },
    {
      deckKey: 'supply_notice_materials',
      requesterId: 'clara_town_scribe',
      isValid: (state) => normalizeCount(state?.plot?.hqLevel) >= 2,
      build: () => ({
        title: 'Materials for the Town Notice',
        whyNow: 'Clara needs fresh timber and a few coins to make the first square notice look proper.',
        townBenefit: 'Town Hall looks prepared instead of provisional.',
        philosophyHint: 'This favors civic identity over pure throughput.',
        requirements: makeRequirements({ resources: { wood: 6, coin: 2 } }),
        rewards: makeRewards({
          resources: { coin: 3 },
          townXp: 7,
          signalDelta: { publicCharm: 5 }
        })
      })
    }
  ],
  BUILD: [
    {
      deckKey: 'build_breakfast_before_market',
      requesterId: 'mara_market_host',
      isValid: (state) => normalizeCount(state?.plot?.hqLevel) >= 2,
      build: () => ({
        title: 'Breakfast Before Market',
        whyNow: 'Mara wants the morning crowd fed before trading starts.',
        townBenefit: 'Market Circle feels ready for regular trade.',
        philosophyHint: 'This favors growth and public activity.',
        requirements: makeRequirements({ buildings: [{ buildingType: 'FARM_PLOT', minCount: 1 }] }),
        rewards: makeRewards({
          resources: { coin: 4 },
          townXp: 8,
          signalDelta: { marketConfidence: 6 }
        })
      })
    },
    {
      deckKey: 'build_neighbor_garden',
      requesterId: 'nell_neighbor_lead',
      isValid: (state) => normalizeCount(state?.plot?.hqLevel) >= 2,
      build: () => ({
        title: 'Garden Row Starter',
        whyNow: 'Nell wants one proper patch planted so the row feels lived in.',
        townBenefit: 'Neighbor Row begins to feel rooted.',
        philosophyHint: 'This favors attachment before expansion.',
        requirements: makeRequirements({ buildings: [{ buildingType: 'FARM_PLOT', minCount: 1 }] }),
        rewards: makeRewards({
          resources: { coin: 4 },
          townXp: 8,
          signalDelta: { neighborGoodwill: 6 }
        })
      })
    },
    {
      deckKey: 'build_quarry_marker',
      requesterId: 'jasper_depot_clerk',
      isValid: (state) => normalizeCount(state?.plot?.hqLevel) >= 3,
      build: () => ({
        title: 'Mark the Quarry Route',
        whyNow: 'Jasper wants the stone lane opened before heavier freight arrives.',
        townBenefit: 'The depot can promise sturdier repairs.',
        philosophyHint: 'This favors hardening the town’s supply spine.',
        requirements: makeRequirements({ buildings: [{ buildingType: 'QUARRY', minCount: 1 }] }),
        rewards: makeRewards({
          resources: { coin: 5 },
          townXp: 9,
          signalDelta: { depotReadiness: 7 }
        })
      })
    }
  ],
  PREPARATION: [
    {
      deckKey: 'prep_neighbor_supper',
      requesterId: 'nell_neighbor_lead',
      priority: 10,
      isValid: (state) => normalizeCount(state?.plot?.hqLevel) >= 2 && hasBuilding(state, 'FARM_PLOT', 1),
      build: ({ acceptedAtMs = 0 } = {}) => ({
        title: 'Neighbor Supper',
        whyNow: 'Nell is gathering the nearby families tonight and wants a small food reserve ready.',
        townBenefit: 'The neighbors start to treat the plot as a shared settlement.',
        philosophyHint: 'This favors goodwill over fast expansion.',
        townMoment: {
          momentId: 'neighbor_supper',
          label: 'Supper at dusk',
          dueAtMs: acceptedAtMs ? acceptedAtMs + (10 * 60 * 1000) : 0,
          softDeadline: true
        },
        requirements: makeRequirements({ resources: { food: 6 } }),
        rewards: makeRewards({
          resources: { coin: 3 },
          townXp: 10,
          signalDelta: { neighborGoodwill: 8 }
        }),
        missEffect: {
          signalDelta: { neighborGoodwill: -3 },
          recapLine: 'Nell held the supper smaller than planned. No harm done, but Neighbor Row is still waiting to be won over.'
        }
      })
    },
    {
      deckKey: 'prep_wagon_arrival',
      requesterId: 'jasper_depot_clerk',
      priority: 5,
      isValid: (state) => normalizeCount(state?.plot?.hqLevel) >= 2 && hasBuilding(state, 'LUMBER_CAMP', 1),
      build: ({ acceptedAtMs = 0 } = {}) => ({
        title: 'Wagon Arrival Readiness',
        whyNow: 'Jasper wants spare timber stacked before the next wagon rolls in.',
        townBenefit: 'Travelers see a depot that can actually absorb new traffic.',
        philosophyHint: 'This favors readiness over last-minute scrambling.',
        townMoment: {
          momentId: 'wagon_arrival',
          label: 'Wagon arrival at dusk',
          dueAtMs: acceptedAtMs ? acceptedAtMs + (10 * 60 * 1000) : 0,
          softDeadline: true
        },
        requirements: makeRequirements({ resources: { wood: 8 } }),
        rewards: makeRewards({
          resources: { coin: 3 },
          townXp: 9,
          signalDelta: { depotReadiness: 7 }
        }),
        missEffect: {
          signalDelta: { depotReadiness: -3 },
          recapLine: 'Jasper kept the wagons moving, but the depot still feels improvised.'
        }
      })
    },
    {
      deckKey: 'prep_town_notice',
      requesterId: 'clara_town_scribe',
      priority: 1,
      isValid: (state) => normalizeCount(state?.plot?.hqLevel) >= 2,
      build: ({ acceptedAtMs = 0 } = {}) => ({
        title: 'Town Notice Before Dawn',
        whyNow: 'Clara wants the square tidy before she posts the first official notice.',
        townBenefit: 'The settlement feels intentional instead of temporary.',
        philosophyHint: 'This favors shared identity over raw throughput.',
        townMoment: {
          momentId: 'town_notice',
          label: 'Notice at first light',
          dueAtMs: acceptedAtMs ? acceptedAtMs + (10 * 60 * 1000) : 0,
          softDeadline: true
        },
        requirements: makeRequirements({ resources: { wood: 4, coin: 2 } }),
        rewards: makeRewards({
          resources: { coin: 3 },
          townXp: 8,
          signalDelta: { publicCharm: 6 }
        }),
        missEffect: {
          signalDelta: { publicCharm: -2 },
          recapLine: 'Clara posted the notice anyway, but the square still looks half-finished.'
        }
      })
    }
  ]
};

function chooseTemplate(templates = [], { state, refreshCount = 0, recentContractKeys = [] } = {}) {
  const valid = templates.filter((template) => typeof template?.isValid === 'function' && template.isValid(state) === true);
  if (valid.length === 0) return null;
  const recent = Array.isArray(recentContractKeys) ? recentContractKeys.slice(-6) : [];
  const unrepeated = valid.filter((template) => !recent.includes(template.deckKey));
  const pool = unrepeated.length > 0 ? unrepeated : valid;
  const prioritized = pool.slice().sort((left, right) => (
    (Number(right?.priority || 0) - Number(left?.priority || 0))
    || String(left?.deckKey || '').localeCompare(String(right?.deckKey || ''))
  ));
  if (Number(prioritized[0]?.priority || 0) > 0) {
    return prioritized[0] || null;
  }
  return pool[Math.abs(Number(refreshCount) || 0) % pool.length] || null;
}

function generateContractFromTemplate(template, { state, nowMs = Date.now(), refreshCount = 0, idFactory = null, acceptedAtMs = 0, generationSalt = '' } = {}) {
  if (!template) return null;
  const requesters = normalizeRequesterList(state?.meta?.requesters || REQUESTERS_V12);
  const requester = findRequester(requesters, template.requesterId) || findRequester(REQUESTERS_V12, template.requesterId) || REQUESTERS_V12[0];
  const built = template.build({ state, nowMs, refreshCount, requester, acceptedAtMs });
  const contractId = typeof idFactory === 'function'
    ? String(idFactory(template.deckKey) || '')
    : `${template.deckKey}:${Math.floor(nowMs)}:${String(generationSalt || refreshCount)}`;
  return {
    contractId,
    plotId: String(state?.plot?.plotId || ''),
    version: 'v1.2',
    kind: String(template.kind || built.kind || '').toUpperCase(),
    status: 'OFFERED',
    title: String(built.title || ''),
    requesterId: requester.requesterId,
    requesterSnapshot: createRequesterSnapshot(requester),
    whyNow: String(built.whyNow || ''),
    townBenefit: String(built.townBenefit || ''),
    philosophyHint: String(built.philosophyHint || ''),
    townMoment: built.townMoment ? copyJson(built.townMoment) : null,
    requirements: copyJson(built.requirements || makeRequirements()),
    rewards: copyJson(built.rewards || makeRewards()),
    missEffect: built.missEffect ? copyJson(built.missEffect) : null,
    deckKey: String(template.deckKey || ''),
    generationSeed: `${String(state?.plot?.plotId || 'plot')}:${Math.floor(nowMs)}:${String(refreshCount || 0)}:${String(template.deckKey || '')}`,
    offeredAtMs: normalizeCount(nowMs),
    acceptedAtMs: acceptedAtMs ? normalizeCount(acceptedAtMs) : 0,
    completedAtMs: 0,
    missedAtMs: 0
  };
}

function generateContractBoardOffers({ state, nowMs = Date.now(), refreshCount = 0, recentContractKeys = [], idFactory = null } = {}) {
  const offers = [];
  const byKind = [
    ['SUPPLY', CONTRACT_TEMPLATES_V12.SUPPLY],
    ['BUILD', CONTRACT_TEMPLATES_V12.BUILD],
    ['PREPARATION', CONTRACT_TEMPLATES_V12.PREPARATION]
  ];
  for (const [kind, templates] of byKind) {
    const chosen = chooseTemplate(templates.map((template) => ({ ...template, kind })), {
      state,
      refreshCount,
      recentContractKeys
    });
    if (!chosen) continue;
    offers.push(generateContractFromTemplate(chosen, {
      state,
      nowMs,
      refreshCount,
      idFactory,
      generationSalt: kind
    }));
  }
  return offers.filter(Boolean);
}

function markRequesterSeen(requesters = [], requesterId, nowMs = Date.now()) {
  const next = normalizeRequesterList(requesters);
  const requester = findRequester(next, requesterId);
  if (requester) requester.lastSeenAtMs = normalizeCount(nowMs);
  return next;
}

function applyRequesterContractOutcome(requesters = [], { requesterId = '', status = '', contractId = '', nowMs = Date.now() } = {}) {
  const next = normalizeRequesterList(requesters);
  const requester = findRequester(next, requesterId);
  if (!requester) return next;
  requester.lastContractId = String(contractId || '');
  requester.lastSeenAtMs = normalizeCount(nowMs);
  if (String(status || '').toUpperCase() === 'COMPLETED') requester.completedContracts += 1;
  if (String(status || '').toUpperCase() === 'MISSED') requester.missedContracts += 1;
  return next;
}

module.exports = {
  CONTRACT_TEMPLATES_V12,
  REQUESTERS_V12,
  applyRequesterContractOutcome,
  createRequesterSnapshot,
  defaultRequesterState,
  findRequester,
  generateContractBoardOffers,
  generateContractFromTemplate,
  markRequesterSeen,
  normalizeRequester,
  normalizeRequesterList
};
