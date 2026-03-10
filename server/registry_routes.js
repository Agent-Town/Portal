function registerRegistryRoutes(app, deps) {
  const {
    assertPortalContractTargetAllowed,
    buildPortalRequestId,
    collectWalletSubjectsForSession,
    createRegistryClaimStart,
    createImportJob,
    getRegistryFamilyBySlug,
    getRegistryHealth,
    getRegistryEntityById,
    getRegistryProofByRegistryId,
    getRegistryReviewQueue,
    invalidateAtlasStoreCaches,
    normalizePortalIdempotencyKey,
    proxyPolicyErrorCode,
    requireBoundHumanSession,
    searchRegistryFamilyGroups,
    searchRegistryEntities,
    sendPortalApiError,
    sendPortalApiSuccess,
    sendProxyPolicyContractError,
  } = deps;

  app.post('/api/registry/import', async (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    const requestKind = typeof req.body?.requestKind === 'string' ? req.body.requestKind.trim() : 'site_origin';
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    const sourceHints = req.body?.sourceHints && typeof req.body.sourceHints === 'object'
      ? req.body.sourceHints
      : {};
    if (!url || !idempotencyKey) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'url and idempotencyKey are required.', { requestId });
    }
    try {
      const parsed = new URL(url);
      assertPortalContractTargetAllowed(url);
      const job = createImportJob({
        surface: 'registry',
        portalSessionId: session.sessionId,
        teamCode: session.teamCode || null,
        houseId: session?.houseCeremony?.houseId || null,
        walletSubjects: collectWalletSubjectsForSession(session, req),
        sourceUrl: parsed.toString(),
        sourceOrigin: parsed.origin,
        requestKind,
        parseFallbackAllowed: req.body?.parseFallbackAllowed === true,
        sourceHints,
        idempotencyKey,
        status: 'queued',
        result: {
          status: 'queued',
          importType: 'registry',
        },
      });
      invalidateAtlasStoreCaches();
      return sendPortalApiSuccess(res, {
        importJobId: job.importJobId,
        status: job.status,
        requestKind: job.requestKind,
      }, { requestId });
    } catch (err) {
      if (err?.code === 'PROXY_TARGET_BLOCKED') {
        let parsed = null;
        try {
          parsed = new URL(url);
        } catch {
          parsed = null;
        }
        createImportJob({
          surface: 'registry',
          portalSessionId: session.sessionId,
          teamCode: session.teamCode || null,
          houseId: session?.houseCeremony?.houseId || null,
          walletSubjects: collectWalletSubjectsForSession(session, req),
          sourceUrl: parsed?.toString() || url,
          sourceOrigin: parsed?.origin || null,
          requestKind,
          parseFallbackAllowed: req.body?.parseFallbackAllowed === true,
          sourceHints,
          idempotencyKey,
          status: 'rejected',
          decisionCode: proxyPolicyErrorCode(err),
          decisionReason: 'Blocked by unsafe target policy',
          result: {
            policy: 'blocked',
            details: err?.details || {},
          },
        });
        return sendProxyPolicyContractError(res, err, requestId);
      }
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'url must be a valid http(s) URL.', { requestId });
    }
  });

  app.post('/api/registry/claim/start', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const walletSubjects = collectWalletSubjectsForSession(session, req);
    const primaryWallet = Array.isArray(walletSubjects)
      ? walletSubjects.find((entry) => entry && typeof entry === 'object' && entry.chain && (entry.normalizedAddress || entry.address))
      : null;
    if (!primaryWallet) {
      return sendPortalApiError(
        res,
        400,
        'wallet_required',
        'A bound wallet is required to start a Registry claim.',
        { requestId }
      );
    }
    const registryEntityId = typeof req.body?.registryEntityId === 'string'
      ? req.body.registryEntityId.trim()
      : '';
    if (!registryEntityId) {
      return sendPortalApiError(
        res,
        400,
        'claim_target_missing',
        'registryEntityId is required.',
        { requestId }
      );
    }
    try {
      const normalizedAddress = typeof primaryWallet.normalizedAddress === 'string' && primaryWallet.normalizedAddress.trim()
        ? primaryWallet.normalizedAddress.trim()
        : String(primaryWallet.address || '').trim();
      const result = createRegistryClaimStart({
        registryEntityId,
        claimantWalletSubject: `${String(primaryWallet.chain || '').trim().toLowerCase()}:${normalizedAddress}`,
        claimantWallet: {
          chain: String(primaryWallet.chain || '').trim().toLowerCase(),
          address: normalizedAddress,
          boundAt: typeof primaryWallet.boundAt === 'string' ? primaryWallet.boundAt : null,
        },
        request: {
          note: typeof req.body?.note === 'string' ? req.body.note.trim() : '',
          source: 'api/registry/claim/start',
        },
      });
      return sendPortalApiSuccess(res, result, { status: 201, requestId });
    } catch (err) {
      if (err?.code === 'CLAIM_TARGET_MISSING') {
        return sendPortalApiError(
          res,
          400,
          'claim_target_missing',
          'Registry claim target was not found.',
          { requestId }
        );
      }
      if (err?.code === 'CLAIM_CONFLICT') {
        return sendPortalApiError(
          res,
          409,
          'claim_conflict',
          'An active claim already exists for this wallet and Registry entity.',
          {
            requestId,
            details: {
              claimId: err?.claim?.claimId || null,
              registryEntityId,
            },
          }
        );
      }
      return sendPortalApiError(res, 500, 'INTERNAL_ERROR', 'Registry claim creation failed.', {
        requestId,
        retryable: true,
      });
    }
  });

  app.get('/api/registry/review-queue', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    return sendPortalApiSuccess(res, getRegistryReviewQueue(), { requestId });
  });

  app.get('/api/registry/health', (_req, res) => {
    const requestId = buildPortalRequestId();
    return sendPortalApiSuccess(res, getRegistryHealth(), { requestId });
  });

  app.get('/api/registry/search', (req, res) => {
    const requestId = buildPortalRequestId();
    const search = {
      query: typeof req.query?.q === 'string' ? req.query.q : '',
      family: typeof req.query?.family === 'string' ? req.query.family : '',
    };
    const items = searchRegistryFamilyGroups(search);
    return sendPortalApiSuccess(res, { items }, { requestId });
  });

  app.get('/api/registry/entities/:id', (req, res) => {
    const requestId = buildPortalRequestId();
    const entity = getRegistryEntityById(req.params.id);
    if (!entity) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Registry entity not found.', { requestId });
    }
    return sendPortalApiSuccess(res, { entity }, { requestId });
  });

  app.get('/api/registry/proof/:registryId', (req, res) => {
    const requestId = buildPortalRequestId();
    const proof = getRegistryProofByRegistryId(req.params.registryId);
    if (!proof) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Registry proof target not found.', { requestId });
    }
    return sendPortalApiSuccess(res, proof, { requestId });
  });

  app.get('/api/registry/families/:familySlug', (req, res) => {
    const requestId = buildPortalRequestId();
    const family = getRegistryFamilyBySlug(req.params.familySlug);
    if (!family) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Registry family not found.', { requestId });
    }
    return sendPortalApiSuccess(res, { family }, { requestId });
  });

  app.get('/api/registry/family/:familySlug', (req, res) => {
    const requestId = buildPortalRequestId();
    const family = getRegistryFamilyBySlug(req.params.familySlug);
    if (!family) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Registry family not found.', { requestId });
    }
    return sendPortalApiSuccess(res, { family }, { requestId });
  });
}

module.exports = {
  registerRegistryRoutes,
};
