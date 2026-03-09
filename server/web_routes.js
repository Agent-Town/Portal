function registerWebRoutes(app, deps) {
  const {
    buildPortalRequestId,
    collectWalletSubjectsForSession,
    createApprovalRequest,
    createCredentialGrant,
    createEvidence,
    createImportJob,
    createInvocation,
    createWebSession,
    decideApproval,
    getActiveCredentialGrant,
    getApprovalById,
    getInvocationByIdempotency,
    getLatestCheckpointForSession,
    getWebActionPolicy,
    getWebSessionById,
    listApprovalsForSession,
    listCredentialStatusByOrigin,
    listEvidenceForSession,
    normalizePortalIdempotencyKey,
    normalizeWebAutonomyMode,
    normalizeWebRenderMode,
    proxyPolicyErrorCode,
    randomHex,
    requireBoundHumanSession,
    requireOwnedWebSession,
    resolveWebTarget,
    sendPortalApiError,
    sendPortalApiSuccess,
    sendProxyPolicyContractError,
    assertPortalContractTargetAllowed,
    setWebSessionRevisionAndState,
    touchCredentialGrant,
    writeCheckpoint,
  } = deps;

  app.post('/api/web/resolve', async (req, res) => {
    const requestId = buildPortalRequestId();
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    const preferredMode = typeof req.body?.preferredMode === 'string' ? req.body.preferredMode.trim() : 'auto';
    const sourceHints = req.body?.sourceHints && typeof req.body.sourceHints === 'object'
      ? req.body.sourceHints
      : {};
    if (!url) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'url is required.', { requestId });
    }
    try {
      assertPortalContractTargetAllowed(url);
      return sendPortalApiSuccess(
        res,
        resolveWebTarget(url, { preferredMode, sourceHints }),
        { requestId }
      );
    } catch (err) {
      if (err?.code === 'PROXY_TARGET_BLOCKED') {
        return sendProxyPolicyContractError(res, err, requestId);
      }
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'url must be a valid http(s) URL.', { requestId });
    }
  });

  app.post('/api/web/import', async (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    const requestKind = typeof req.body?.requestKind === 'string' ? req.body.requestKind.trim() : '';
    const parseFallbackAllowed = req.body?.parseFallbackAllowed === true;
    const sourceHints = req.body?.sourceHints && typeof req.body.sourceHints === 'object'
      ? req.body.sourceHints
      : {};
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!url || !requestKind || !idempotencyKey) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'url, requestKind, and idempotencyKey are required.', { requestId });
    }

    try {
      const parsed = new URL(url);
      assertPortalContractTargetAllowed(url);
      const job = createImportJob({
        surface: 'web',
        portalSessionId: session.sessionId,
        teamCode: session.teamCode || null,
        houseId: session?.houseCeremony?.houseId || null,
        walletSubjects: collectWalletSubjectsForSession(session, req),
        sourceUrl: parsed.toString(),
        sourceOrigin: parsed.origin,
        requestKind,
        parseFallbackAllowed,
        sourceHints,
        idempotencyKey,
        status: 'queued',
        result: {
          status: 'queued',
          sourceType: 'manual_import',
        },
      });
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
          surface: 'web',
          portalSessionId: session.sessionId,
          teamCode: session.teamCode || null,
          houseId: session?.houseCeremony?.houseId || null,
          walletSubjects: collectWalletSubjectsForSession(session, req),
          sourceUrl: parsed?.toString() || url,
          sourceOrigin: parsed?.origin || null,
          requestKind,
          parseFallbackAllowed,
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

  app.post('/api/web/sessions', async (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    if (!url) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'url is required.', { requestId });
    }
    try {
      assertPortalContractTargetAllowed(url);
      const resolved = resolveWebTarget(url, {
        preferredMode: typeof req.body?.renderMode === 'string' ? req.body.renderMode : 'auto',
        sourceHints: req.body?.sourceHints && typeof req.body.sourceHints === 'object'
          ? req.body.sourceHints
          : {},
      });
      const integration = resolved.integration || null;
      const created = createWebSession({
        portalSessionId: session.sessionId,
        teamCode: session.teamCode || null,
        houseId: session?.houseCeremony?.houseId || null,
        walletSubjects: collectWalletSubjectsForSession(session, req),
        url: new URL(url).toString(),
        origin: new URL(url).origin,
        websiteRegistryId: resolved.website?.registryId || null,
        integrationRegistryId: typeof req.body?.integrationRegistryId === 'string'
          ? req.body.integrationRegistryId.trim()
          : integration?.integrationRegistryId || null,
        versionId: typeof req.body?.versionId === 'string'
          ? req.body.versionId.trim()
          : integration?.versionId || null,
        renderMode: integration?.renderMode || normalizeWebRenderMode(req.body?.renderMode, 'companion'),
        autonomyMode: normalizeWebAutonomyMode(req.body?.autonomyMode, 'assist'),
        runtimeState: resolved.resolutionState === 'supported' ? 'ready' : 'error',
        pageClass: integration?.pageClass || resolved.website?.pageClass || null,
      });
      return sendPortalApiSuccess(res, {
        session: {
          webSessionId: created.webSessionId,
          teamCode: created.teamCode,
          houseId: created.houseId,
          renderMode: created.renderMode,
          autonomyMode: created.autonomyMode,
          runtimeState: created.runtimeState,
          activeRevision: created.activeRevision,
        },
        activeIntegration: {
          integrationRegistryId: created.integrationRegistryId,
          versionId: created.versionId,
        },
        policy: {
          sameOriginOnlyDefault: true,
          allowExternalCredentials: false,
        },
      }, { requestId });
    } catch (err) {
      if (err?.code === 'PROXY_TARGET_BLOCKED') {
        return sendProxyPolicyContractError(res, err, requestId);
      }
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'url must be a valid http(s) URL.', { requestId });
    }
  });

  app.get('/api/web/sessions/:id', (req, res) => {
    const requestId = buildPortalRequestId();
    const { session, webSession } = requireOwnedWebSession(req, res, requestId, req.params.id);
    if (!session || !webSession) return;
    const approvalQueue = listApprovalsForSession(webSession.webSessionId);
    const lastCheckpoint = webSession.checkpointRef
      ? getLatestCheckpointForSession(webSession.webSessionId)
      : null;
    return sendPortalApiSuccess(res, {
      session: webSession,
      activeIntegration: {
        integrationRegistryId: webSession.integrationRegistryId,
        versionId: webSession.versionId,
      },
      approvalQueue,
      lastCheckpoint,
      runtimeSnapshot: lastCheckpoint?.payload || null,
      credentialStatusByOrigin: listCredentialStatusByOrigin(session.sessionId, webSession.webSessionId),
    }, { requestId });
  });

  app.post('/api/web/sessions/:id/checkpoint', (req, res) => {
    const requestId = buildPortalRequestId();
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    const { webSession } = requireOwnedWebSession(req, res, requestId, req.params.id);
    if (!webSession) return;
    const checkpoint = req.body?.checkpoint && typeof req.body.checkpoint === 'object'
      ? req.body.checkpoint
      : null;
    const expectedRevision = Number(req.body?.expectedRevision);
    if (!checkpoint || !Number.isInteger(expectedRevision)) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'checkpoint and expectedRevision are required.', { requestId });
    }
    try {
      const written = writeCheckpoint({
        webSessionId: webSession.webSessionId,
        expectedRevision,
        idempotencyKey: idempotencyKey || null,
        checkpoint,
      });
      return sendPortalApiSuccess(res, {
        checkpointRef: written.checkpointRef,
        writtenRevision: written.revision,
        writtenAt: written.createdAt,
      }, { requestId });
    } catch (err) {
      if (err?.code === 'WEB_CHECKPOINT_CONFLICT') {
        return sendPortalApiError(
          res,
          409,
          'WEB_CHECKPOINT_CONFLICT',
          'The checkpoint was based on a stale revision.',
          {
            requestId,
            details: {
              currentRevision: Number(err.currentRevision || webSession.activeRevision),
            },
          }
        );
      }
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Web session not found.', { requestId });
    }
  });

  app.post('/api/web/sessions/:id/actions/:actionId/invoke', (req, res) => {
    const requestId = buildPortalRequestId();
    const { session, webSession } = requireOwnedWebSession(req, res, requestId, req.params.id);
    if (!session || !webSession) return;
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    const expectedRevision = Number(req.body?.expectedRevision);
    if (!idempotencyKey || !Number.isInteger(expectedRevision)) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'idempotencyKey and expectedRevision are required.', { requestId });
    }
    const cached = getInvocationByIdempotency(webSession.webSessionId, idempotencyKey);
    if (cached) {
      const evidence = listEvidenceForSession(webSession.webSessionId, { limit: 50 }).items
        .filter((item) => item.invocationId === cached.invocationId);
      return sendPortalApiSuccess(res, {
        invocation: {
          invocationId: cached.invocationId,
          actionId: cached.actionId,
          status: cached.status,
          verificationStatus: cached.verificationStatus,
          durationMs: Number(cached.response?.durationMs || 1),
          usedApprovalId: cached.approvalId,
          usedCredentialGrantId: cached.credentialGrantId,
        },
        evidence,
      }, { requestId });
    }

    if (expectedRevision !== webSession.activeRevision) {
      return sendPortalApiError(
        res,
        409,
        'WEB_CHECKPOINT_CONFLICT',
        'The requested action was based on a stale revision.',
        {
          requestId,
          details: {
            currentRevision: webSession.activeRevision,
          },
        }
      );
    }

    const actionPolicy = getWebActionPolicy(req.params.actionId, webSession);
    if (!actionPolicy) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Unknown web action.', { requestId });
    }

    let approval = null;
    if (actionPolicy.requiresApproval) {
      const approvalId = typeof req.body?.approvalId === 'string' ? req.body.approvalId.trim() : '';
      approval = approvalId ? getApprovalById(approvalId) : null;
      if (!approval) {
        const createdApproval = createApprovalRequest({
          webSessionId: webSession.webSessionId,
          actionId: actionPolicy.actionId,
          reason: actionPolicy.summary,
          requestedBy: 'agent',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });
        return sendPortalApiError(
          res,
          409,
          'WEB_APPROVAL_REQUIRED',
          'This action requires human approval.',
          {
            requestId,
            details: {
              approvalId: createdApproval.approvalId,
              status: createdApproval.status,
            },
          }
        );
      }
      if (approval.webSessionId !== webSession.webSessionId) {
        return sendPortalApiError(res, 403, 'FORBIDDEN', 'Approval does not belong to this web session.', { requestId });
      }
      if (Date.parse(approval.expiresAt) <= Date.now()) {
        return sendPortalApiError(res, 409, 'WEB_APPROVAL_EXPIRED', 'Approval has expired.', { requestId });
      }
      if (approval.status !== 'approved') {
        return sendPortalApiError(
          res,
          409,
          'WEB_APPROVAL_REQUIRED',
          'This action requires an approved human decision.',
          {
            requestId,
            details: {
              approvalId: approval.approvalId,
              status: approval.status,
            },
          }
        );
      }
    }

    let credentialGrant = null;
    if (actionPolicy.requiresCredential) {
      const credentialGrantId = typeof req.body?.credentialGrantId === 'string'
        ? req.body.credentialGrantId.trim()
        : '';
      credentialGrant = getActiveCredentialGrant({
        portalSessionId: session.sessionId,
        webSessionId: webSession.webSessionId,
        origin: webSession.origin,
        credentialGrantId: credentialGrantId || null,
      });
      if (!credentialGrant) {
        return sendPortalApiError(
          res,
          409,
          'WEB_CREDENTIAL_REQUIRED',
          'A valid credential grant is required for this origin.',
          { requestId }
        );
      }
      if (credentialGrant.origin !== webSession.origin) {
        return sendPortalApiError(
          res,
          409,
          'WEB_CREDENTIAL_SCOPE_MISMATCH',
          'The provided credential grant does not match this origin.',
          { requestId }
        );
      }
      if (credentialGrant.status !== 'active') {
        return sendPortalApiError(
          res,
          409,
          'WEB_CREDENTIAL_REQUIRED',
          'The provided credential grant is not active.',
          { requestId }
        );
      }
      touchCredentialGrant(credentialGrant.credentialGrantId);
    }

    const params = req.body?.params && typeof req.body.params === 'object'
      ? req.body.params
      : {};
    const requestPayload = {
      expectedRevision,
      params,
      approvalId: approval?.approvalId || null,
      credentialGrantId: credentialGrant?.credentialGrantId || null,
      dryRun: req.body?.dryRun === true,
    };
    const responsePayload = {
      durationMs: 1,
      targetOrigin: webSession.origin,
      renderMode: webSession.renderMode,
    };
    const invocation = createInvocation({
      webSessionId: webSession.webSessionId,
      actionId: actionPolicy.actionId,
      idempotencyKey,
      approvalId: approval?.approvalId || null,
      credentialGrantId: credentialGrant?.credentialGrantId || null,
      request: requestPayload,
      response: responsePayload,
    });
    createEvidence({
      webSessionId: webSession.webSessionId,
      invocationId: invocation.invocationId,
      category: 'tool_invoked',
      actor: 'server',
      status: 'success',
      summary: actionPolicy.actionId,
      targetUrl: webSession.url,
      pageClass: webSession.pageClass,
      freshnessTtlMs: 300000,
    });
    const refreshed = setWebSessionRevisionAndState(webSession.webSessionId, {
      nextRevision: webSession.activeRevision + 1,
      runtimeState: 'verifying',
      pageClass: webSession.pageClass,
    });
    const evidence = listEvidenceForSession(webSession.webSessionId, { limit: 50 }).items
      .filter((item) => item.invocationId === invocation.invocationId);
    return sendPortalApiSuccess(res, {
      invocation: {
        invocationId: invocation.invocationId,
        actionId: invocation.actionId,
        status: invocation.status,
        verificationStatus: invocation.verificationStatus,
        durationMs: Number(invocation.response?.durationMs || 1),
        usedApprovalId: invocation.approvalId,
        usedCredentialGrantId: invocation.credentialGrantId,
        writtenRevision: refreshed?.activeRevision || webSession.activeRevision + 1,
      },
      evidence,
    }, { requestId });
  });

  app.post('/api/web/approvals/:approvalId/decision', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const approval = getApprovalById(req.params.approvalId);
    if (!approval) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Approval not found.', { requestId });
    }
    const webSession = getWebSessionById(approval.webSessionId);
    if (!webSession) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Web session not found.', { requestId });
    }
    if (webSession.portalSessionId !== session.sessionId) {
      return sendPortalApiError(res, 403, 'FORBIDDEN', 'Approval belongs to a different Portal session.', { requestId });
    }
    const decision = typeof req.body?.decision === 'string' ? req.body.decision.trim().toLowerCase() : '';
    const expectedRevision = Number(req.body?.expectedRevision);
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if ((decision !== 'approved' && decision !== 'rejected') || !Number.isInteger(expectedRevision) || !idempotencyKey) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'decision, expectedRevision, and idempotencyKey are required.', { requestId });
    }
    try {
      const decided = decideApproval({
        approvalId: approval.approvalId,
        decision,
        decisionBy: 'human',
        reason,
        expectedRevision,
        idempotencyKey,
      });
      const nextSession = getWebSessionById(webSession.webSessionId);
      const evidence = listEvidenceForSession(webSession.webSessionId, { limit: 50 }).items
        .filter((item) => item.category === 'approval_decided' && item.summary === approval.approvalId)
        .slice(0, 1);
      return sendPortalApiSuccess(res, {
        approval: decided,
        writtenRevision: nextSession?.activeRevision || expectedRevision,
        evidence,
      }, { requestId });
    } catch (err) {
      if (err?.code === 'WEB_APPROVAL_EXPIRED') {
        return sendPortalApiError(res, 409, 'WEB_APPROVAL_EXPIRED', 'Approval has expired.', { requestId });
      }
      if (err?.code === 'WEB_CHECKPOINT_CONFLICT') {
        return sendPortalApiError(
          res,
          409,
          'WEB_CHECKPOINT_CONFLICT',
          'The approval decision was based on a stale revision.',
          { requestId, details: { currentRevision: Number(err.currentRevision || webSession.activeRevision) } }
        );
      }
      return sendPortalApiError(res, 500, 'INTERNAL_ERROR', 'Approval decision failed.', { requestId, retryable: true });
    }
  });

  app.get('/api/web/sessions/:id/evidence', (req, res) => {
    const requestId = buildPortalRequestId();
    const { webSession } = requireOwnedWebSession(req, res, requestId, req.params.id);
    if (!webSession) return;
    const limit = Number.parseInt(String(req.query?.limit || '50'), 10);
    const cursor = typeof req.query?.cursor === 'string' ? req.query.cursor.trim() : '';
    const freshOnly = String(req.query?.freshOnly || '').trim().toLowerCase() === 'true';
    const payload = listEvidenceForSession(webSession.webSessionId, {
      limit,
      cursor: cursor || null,
      freshOnly,
    });
    return sendPortalApiSuccess(res, payload, { requestId });
  });

  app.post('/api/web/credentials/start', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = requireBoundHumanSession(req, res, { requestId });
    if (!session) return;
    const webSessionId = typeof req.body?.webSessionId === 'string' ? req.body.webSessionId.trim() : '';
    const origin = typeof req.body?.origin === 'string' ? req.body.origin.trim() : '';
    const authClass = typeof req.body?.authClass === 'string' ? req.body.authClass.trim() : '';
    const scopes = Array.isArray(req.body?.scopes) ? req.body.scopes.filter((entry) => typeof entry === 'string' && entry.trim()) : [];
    if (!webSessionId || !origin || !authClass || scopes.length === 0) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'webSessionId, origin, authClass, and scopes are required.', { requestId });
    }
    const webSession = getWebSessionById(webSessionId);
    if (!webSession || webSession.portalSessionId !== session.sessionId) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Web session not found.', { requestId });
    }
    if (webSession.origin !== origin) {
      return sendPortalApiError(res, 409, 'WEB_ORIGIN_BLOCKED', 'Credential broker origin must match the web session origin.', { requestId });
    }
    const approval = createApprovalRequest({
      webSessionId,
      actionId: 'credential_grant',
      reason: `Grant ${authClass} access for ${origin}`,
      requestedBy: 'human',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    const brokerSessionId = `wcb_${randomHex(10)}`;
    createCredentialGrant({
      portalSessionId: session.sessionId,
      webSessionId,
      origin,
      authClass,
      scopes,
      status: 'pending',
      brokerSessionId,
      approvalId: approval.approvalId,
    });
    return sendPortalApiSuccess(res, {
      brokerSessionId,
      approvalId: approval.approvalId,
      authUrl: `/auth-broker/${encodeURIComponent(new URL(origin).hostname)}/start?brokerSessionId=${encodeURIComponent(brokerSessionId)}`,
    }, { requestId });
  });
}

module.exports = {
  registerWebRoutes,
};
