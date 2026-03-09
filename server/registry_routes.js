function registerRegistryRoutes(app, deps) {
  const {
    assertPortalContractTargetAllowed,
    buildPortalRequestId,
    collectWalletSubjectsForSession,
    createImportJob,
    getRegistryEntityById,
    invalidateAtlasStoreCaches,
    normalizePortalIdempotencyKey,
    proxyPolicyErrorCode,
    requireBoundHumanSession,
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

  app.get('/api/registry/search', (req, res) => {
    const requestId = buildPortalRequestId();
    const items = searchRegistryEntities({
      query: typeof req.query?.q === 'string' ? req.query.q : '',
      family: typeof req.query?.family === 'string' ? req.query.family : '',
    });
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
}

module.exports = {
  registerRegistryRoutes,
};
