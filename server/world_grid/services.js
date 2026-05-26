const SERVICE_LISTINGS = [
  {
    serviceId: 'service_route_advisor',
    providerAccountId: 'civic_service_route_office',
    agentId: 'agent_route_advisor',
    title: 'Route Advisor',
    description: 'Suggests safe route priorities from public territory summaries.',
    serviceKind: 'advice',
    allowedInputs: ['regionSummary', 'selectedCell', 'publicTownCard'],
    forbiddenInputs: ['brainSecrets', 'walletSecrets', 'providerConfig', 'privateEventLog', 'workerTraffic'],
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'rationale', 'nextStep']
    },
    reputation: {
      completedJobs: 0,
      disputeCount: 0,
      reliabilityBand: 'new'
    }
  },
  {
    serviceId: 'service_public_works_planner',
    providerAccountId: 'civic_service_public_works',
    agentId: 'agent_public_works_planner',
    title: 'Public Works Planner',
    description: 'Turns public-safe town goals into a small civic works suggestion.',
    serviceKind: 'template',
    allowedInputs: ['regionSummary', 'claimSummary', 'publicTownCard'],
    forbiddenInputs: ['brainSecrets', 'walletSecrets', 'providerConfig', 'privateEventLog', 'workerTraffic'],
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'rationale', 'nextStep']
    },
    reputation: {
      completedJobs: 0,
      disputeCount: 0,
      reliabilityBand: 'new'
    }
  },
  {
    serviceId: 'service_town_recap_narrator',
    providerAccountId: 'civic_service_recaps',
    agentId: 'agent_town_recap_narrator',
    title: 'Town Recap Narrator',
    description: 'Produces a public-safe recap draft from approved summary fields.',
    serviceKind: 'public-summary',
    allowedInputs: ['publicTownCard', 'regionSummary'],
    forbiddenInputs: ['brainSecrets', 'walletSecrets', 'providerConfig', 'privateEventLog', 'workerTraffic'],
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'rationale', 'nextStep']
    },
    reputation: {
      completedJobs: 0,
      disputeCount: 0,
      reliabilityBand: 'new'
    }
  }
];

const serviceRequestsByOwner = new Map();
const reputationByService = new Map();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value = '', fallback = '') {
  return String(value || fallback).trim().replace(/\s+/g, ' ').slice(0, 280);
}

function serviceListings() {
  return SERVICE_LISTINGS.map((listing) => {
    const reputation = reputationByService.get(listing.serviceId) || listing.reputation;
    return {
      ...clone(listing),
      reputation: { ...listing.reputation, ...clone(reputation) }
    };
  });
}

function getService(serviceId = '') {
  const target = String(serviceId || '').trim();
  return serviceListings().find((service) => service.serviceId === target) || null;
}

function redactedInputs(service, rawInput = {}) {
  const input = rawInput && typeof rawInput === 'object' ? rawInput : {};
  const allowed = new Set(service.allowedInputs || []);
  const forbidden = new Set(service.forbiddenInputs || []);
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (forbidden.has(key)) continue;
    if (!allowed.has(key)) continue;
    if (value && typeof value === 'object') {
      out[key] = clone(value);
    } else {
      out[key] = normalizeText(value);
    }
  }
  return out;
}

function validateServiceOutput(output = {}) {
  const valid = output
    && typeof output === 'object'
    && typeof output.recommendation === 'string'
    && typeof output.rationale === 'string'
    && typeof output.nextStep === 'string';
  if (!valid) {
    const error = new Error('INVALID_SERVICE_OUTPUT');
    error.details = { reason: 'SCHEMA_VALIDATION_FAILED' };
    throw error;
  }
  return output;
}

function recommendationFor(service, input = {}) {
  const selected = input.selectedCell?.terrain || input.claimSummary?.terrain || 'nearby territory';
  if (service.serviceId === 'service_route_advisor') {
    return validateServiceOutput({
      recommendation: `Prioritize a simple route check around ${selected}.`,
      rationale: 'The service received only public-safe region and cell summary data.',
      nextStep: 'Review the suggestion and apply any actual route work through normal world tools later.'
    });
  }
  if (service.serviceId === 'service_public_works_planner') {
    return validateServiceOutput({
      recommendation: `Draft a small public works plan around ${selected}.`,
      rationale: 'The suggestion is a template only and cannot spend resources or mutate the town.',
      nextStep: 'Keep it as a plan until a future explicit public-works tool applies it.'
    });
  }
  return validateServiceOutput({
    recommendation: 'Draft a short public-safe town recap.',
    rationale: 'The recap is based on approved public card and region fields only.',
    nextStep: 'Review before sharing it anywhere public.'
  });
}

function ownerRequests(owner) {
  return serviceRequestsByOwner.get(owner.ownerAccountId) || [];
}

function saveOwnerRequests(owner, requests) {
  serviceRequestsByOwner.set(owner.ownerAccountId, requests.map((request) => clone(request)));
}

function requestAdvice(owner, serviceId = '', rawInput = {}) {
  const service = getService(serviceId);
  if (!service) {
    const error = new Error('NOT_FOUND');
    error.details = { serviceId };
    throw error;
  }
  const input = redactedInputs(service, rawInput);
  const output = recommendationFor(service, input);
  const requests = ownerRequests(owner);
  const request = {
    requestId: `svc_req_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    serviceId: service.serviceId,
    providerAccountId: service.providerAccountId,
    requesterAccountId: owner.ownerAccountId,
    status: 'recommended',
    input,
    output,
    createdAtMs: Date.now(),
    acceptedAtMs: null,
    reportedAtMs: null
  };
  saveOwnerRequests(owner, [...requests, request]);
  return clone(request);
}

function findRequest(owner, requestId = '') {
  const target = String(requestId || '').trim();
  const requests = ownerRequests(owner);
  const index = requests.findIndex((request) => request.requestId === target);
  return { requests, index, request: index >= 0 ? requests[index] : null };
}

function updateReputation(serviceId = '', patch = {}) {
  const service = getService(serviceId);
  if (!service) return null;
  const current = reputationByService.get(serviceId) || service.reputation;
  const next = {
    completedJobs: current.completedJobs + (patch.completedJobs || 0),
    disputeCount: current.disputeCount + (patch.disputeCount || 0),
    reliabilityBand: 'new'
  };
  if (next.completedJobs >= 3 && next.disputeCount === 0) next.reliabilityBand = 'trusted';
  else if (next.completedJobs >= 1) next.reliabilityBand = 'steady';
  reputationByService.set(serviceId, next);
  return clone(next);
}

function acceptResult(owner, requestId = '') {
  const { requests, index, request } = findRequest(owner, requestId);
  if (!request) {
    const error = new Error('NOT_FOUND');
    error.details = { requestId };
    throw error;
  }
  if (request.requesterAccountId !== owner.ownerAccountId) {
    const error = new Error('FORBIDDEN');
    error.details = { reason: 'SERVICE_REQUEST_OWNER_MISMATCH' };
    throw error;
  }
  if (request.status === 'reported') {
    const error = new Error('INVALID_SERVICE_REQUEST_STATE');
    error.details = { requestId, status: request.status };
    throw error;
  }
  if (request.status === 'accepted') return clone(request);
  requests[index] = {
    ...request,
    status: 'accepted',
    acceptedAtMs: Date.now(),
    mutationApplied: false
  };
  updateReputation(request.serviceId, { completedJobs: 1 });
  saveOwnerRequests(owner, requests);
  return clone(requests[index]);
}

function reportIssue(owner, requestId = '', reason = '') {
  const { requests, index, request } = findRequest(owner, requestId);
  if (!request) {
    const error = new Error('NOT_FOUND');
    error.details = { requestId };
    throw error;
  }
  if (request.requesterAccountId !== owner.ownerAccountId) {
    const error = new Error('FORBIDDEN');
    error.details = { reason: 'SERVICE_REQUEST_OWNER_MISMATCH' };
    throw error;
  }
  if (request.status === 'reported') return clone(request);
  requests[index] = {
    ...request,
    status: 'reported',
    reportReason: normalizeText(reason, 'Issue reported'),
    reportedAtMs: Date.now()
  };
  updateReputation(request.serviceId, { disputeCount: 1 });
  saveOwnerRequests(owner, requests);
  return clone(requests[index]);
}

function listRequests(owner) {
  return ownerRequests(owner).map((request) => clone(request));
}

module.exports = {
  acceptResult,
  listRequests,
  reportIssue,
  requestAdvice,
  serviceListings
};
