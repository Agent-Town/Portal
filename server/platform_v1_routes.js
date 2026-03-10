function registerPlatformV1Routes(app, deps) {
  const {
    PLATFORM_CONFIG_STATUSES,
    PLATFORM_IMMUTABLE_CONFIG_STATUSES,
    PLATFORM_RUN_ELIGIBLE_CONFIG_STATUSES,
    PLATFORM_RUN_ENTRY_MODES,
    PLATFORM_TRACE_AUTHORITY_TYPE,
    PLATFORM_TRAINER_JOB_KINDS,
    SUPPORTED_PLATFORM_EXPERIENCE_IDS,
    allowedReaderIdsFromSealedContext,
    assertPortalContractTargetAllowed,
    buildCompiledIntegrationPack,
    buildPlatformTrainerResultPayload,
    buildPortalRequestId,
    buildSeededSealedContextRecord,
    createIntegrationCandidate,
    createIntegrationExecution,
    createIntegrationPackVersion,
    createRun,
    createSealedContextViolation,
    createTraceEvent,
    createTraceIntakeRecord,
    createTrainerJob,
    createTrainerResult,
    decodeTraceCursor,
    deriveDeterministicSealId,
    encodeTraceCursor,
    express,
    getConfigVersion,
    getConfigVersionByIdempotency,
    getIntegrationCandidateById,
    getIntegrationCandidateByIdempotency,
    getIntegrationExecutionByIdempotency,
    getIntegrationPackVersionByIdempotency,
    getLatestTraceEvent,
    getRunById,
    getRunByIdempotency,
    getRunByTraceId,
    getSealedContextById,
    getTeamConfigBinding,
    getTraceIntakeRecord,
    getTrainerJobById,
    getTrainerJobByIdempotency,
    getTrainerResultById,
    getTrainerResultByJobId,
    hasPlatformTrainerTargets,
    listConfigComponentVersions,
    listTraceEvents,
    normalizePlatformTrainerBudget,
    normalizePortalIdempotencyKey,
    nowIso,
    parsePokerOperatorFixtureRecords,
    randomHex,
    readStore,
    replaceConfigComponentVersions,
    resolveApprovedTrainerPatchPromotion,
    resolveHouseAddress,
    resolveHumanSessionWithRecovery,
    resolvePlatformConfigComponents,
    resolvePlatformTrainerLinkedConfigVersionId,
    resolveSessionPlatformContext,
    resolveWebTarget,
    sendPortalApiError,
    sendPortalApiSuccess,
    sendProxyPolicyContractError,
    sha256PrefixedHex,
    stableJsonStringify,
    updateRunMetadata,
    updateRunStatus,
    updateSealedContextStatus,
    updateTrainerJobStatus,
    updateTrainerResultLink,
    upsertConfigVersion,
    upsertSealedContext,
    upsertTeamConfigBinding,
    verifyHouseAuth,
  } = deps;

  app.get('/v1/houses/:houseId/team', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }

    const requestedHouseId = typeof req.params?.houseId === 'string' ? req.params.houseId.trim() : '';
    const context = resolveSessionPlatformContext(session);
    const requestedTeamId = typeof req.query?.teamId === 'string' ? req.query.teamId.trim() : '';
    const teamId = requestedTeamId || (typeof context.activeTeamId === 'string' ? context.activeTeamId : '');
    if (!requestedHouseId || !teamId) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'houseId and teamId are required.', { requestId });
    }

    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, requestedHouseId);
    if (!resolvedHouse?.house || resolvedHouse.houseId !== requestedHouseId) {
      return sendPortalApiError(res, 404, 'HOUSE_NOT_FOUND', 'House not found.', { requestId });
    }
    const auth = verifyHouseAuth(req, resolvedHouse.house);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'House authorization failed.', { requestId });
    }

    const binding = getTeamConfigBinding({
      houseId: resolvedHouse.houseId,
      teamId,
    });
    const activeConfig = binding
      ? getConfigVersion(binding.activeConfigVersionId)
      : null;
    return sendPortalApiSuccess(res, {
      houseId: resolvedHouse.houseId,
      teamId,
      activeTeamId: context.activeTeamId,
      availableTeamIds: context.availableTeamIds,
      activeConfigVersionId: binding?.activeConfigVersionId || null,
      activeConfigHash: activeConfig?.configHash || null,
      binding,
      config: activeConfig,
    }, { requestId });
  });

  app.post('/v1/houses/:houseId/configs', express.json({ limit: '96kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }

    const requestedHouseId = typeof req.params?.houseId === 'string' ? req.params.houseId.trim() : '';
    if (!requestedHouseId) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'houseId is required.', { requestId });
    }

    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, requestedHouseId);
    if (!resolvedHouse?.house || resolvedHouse.houseId !== requestedHouseId) {
      return sendPortalApiError(res, 404, 'HOUSE_NOT_FOUND', 'House not found.', { requestId });
    }
    const auth = verifyHouseAuth(req, resolvedHouse.house);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'House authorization failed.', { requestId });
    }

    const idempotencyKey = normalizePortalIdempotencyKey(req);
    const teamId = typeof req.body?.teamId === 'string' ? req.body.teamId.trim() : '';
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : 'draft';
    const branch = typeof req.body?.branch === 'string' ? req.body.branch.trim() : '';
    const displayVersion = typeof req.body?.displayVersion === 'string' ? req.body.displayVersion.trim() : '';
    const providedConfigVersionId = typeof req.body?.configVersionId === 'string' ? req.body.configVersionId.trim() : '';
    const experienceId = typeof req.body?.experienceId === 'string' ? req.body.experienceId.trim() : '';
    const parentConfigVersionIds = Array.isArray(req.body?.parentConfigVersionIds)
      ? req.body.parentConfigVersionIds.map((item) => String(item || '').trim()).filter(Boolean)
      : [];
    const componentRefs = req.body?.componentRefs && typeof req.body.componentRefs === 'object' && !Array.isArray(req.body.componentRefs)
      ? req.body.componentRefs
      : null;
    if (!idempotencyKey || !teamId || !branch || !displayVersion || !componentRefs || !PLATFORM_CONFIG_STATUSES.has(status)) {
      return sendPortalApiError(
        res,
        400,
        'INVALID_ARGUMENT',
        'teamId, branch, displayVersion, componentRefs, status, and Idempotency-Key are required.',
        { requestId }
      );
    }

    const replayed = getConfigVersionByIdempotency({
      houseId: resolvedHouse.houseId,
      teamId,
      idempotencyKey,
    });
    if (replayed) {
      return sendPortalApiSuccess(res, {
        configVersionId: replayed.configVersionId,
        status: replayed.status,
        configHash: replayed.configHash,
        config: replayed,
        componentVersions: listConfigComponentVersions(replayed.configVersionId),
      }, { requestId });
    }

    let resolvedComponentsPayload = null;
    try {
      resolvedComponentsPayload = resolvePlatformConfigComponents(componentRefs, {
        requireImmutable: PLATFORM_IMMUTABLE_CONFIG_STATUSES.has(status),
      });
    } catch (err) {
      if (err?.code === 'CONFIG_COMPONENT_MUTABLE_REF') {
        return sendPortalApiError(
          res,
          409,
          'CONFIG_COMPONENT_MUTABLE_REF',
          'Config publication requires immutable component version ids.',
          {
            requestId,
            details: {
              componentKey: String(err?.componentKey || ''),
              ref: String(err?.ref || ''),
            },
          }
        );
      }
      return sendPortalApiError(
        res,
        400,
        'INVALID_ARGUMENT',
        `Invalid config component reference${err?.componentKey ? ` for ${String(err.componentKey)}` : ''}.`,
        { requestId }
      );
    }

    const configVersionId = providedConfigVersionId || `cfg_${randomHex(10)}`;
    if (getConfigVersion(configVersionId)) {
      return sendPortalApiError(res, 409, 'CONFIG_ALREADY_EXISTS', 'Config version already exists.', { requestId });
    }

    const manifestBase = {
      configVersionId,
      displayVersion,
      houseId: resolvedHouse.houseId,
      teamId,
      branch,
      status,
      parentConfigVersionIds,
      resolvedComponents: resolvedComponentsPayload.resolvedComponents,
      resolvedComponentHashes: resolvedComponentsPayload.resolvedComponentHashes,
    };
    if (experienceId) manifestBase.experienceId = experienceId;
    const configHash = sha256PrefixedHex(stableJsonStringify(manifestBase));
    const manifest = {
      ...manifestBase,
      integrity: {
        configHash,
      },
    };
    const now = nowIso();
    const config = upsertConfigVersion({
      configVersionId,
      houseId: resolvedHouse.houseId,
      teamId,
      experienceId,
      status,
      configHash,
      idempotencyKey,
      manifest,
      lineage: {
        parentConfigVersionIds,
        createdBy: 'v1.house.configs',
        requestId,
      },
      nowIso: now,
    });
    const componentVersions = replaceConfigComponentVersions({
      configVersionId,
      components: resolvedComponentsPayload.componentVersions.map((component, index) => ({
        configComponentVersionId: `ccv_${randomHex(10)}`,
        componentKind: component.componentKind,
        componentKey: component.componentKey,
        immutableVersionId: component.immutableVersionId,
        componentHash: component.componentHash,
        metadata: {
          ...component.metadata,
          ordinal: index,
        },
      })),
      nowIso: now,
    });
    return sendPortalApiSuccess(res, {
      configVersionId: config.configVersionId,
      status: config.status,
      configHash: config.configHash,
      config,
      componentVersions,
    }, { status: 201, requestId });
  });

  app.post('/v1/houses/:houseId/configs/:configVersionId/promote', express.json({ limit: '48kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }

    const requestedHouseId = typeof req.params?.houseId === 'string' ? req.params.houseId.trim() : '';
    const configVersionId = typeof req.params?.configVersionId === 'string' ? req.params.configVersionId.trim() : '';
    const teamId = typeof req.body?.teamId === 'string' ? req.body.teamId.trim() : '';
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!requestedHouseId || !configVersionId || !teamId || !idempotencyKey) {
      return sendPortalApiError(
        res,
        400,
        'INVALID_ARGUMENT',
        'houseId, configVersionId, teamId, and Idempotency-Key are required.',
        { requestId }
      );
    }

    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, requestedHouseId);
    if (!resolvedHouse?.house || resolvedHouse.houseId !== requestedHouseId) {
      return sendPortalApiError(res, 404, 'HOUSE_NOT_FOUND', 'House not found.', { requestId });
    }
    const auth = verifyHouseAuth(req, resolvedHouse.house);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'House authorization failed.', { requestId });
    }

    const config = getConfigVersion(configVersionId);
    if (!config || config.houseId !== resolvedHouse.houseId || config.teamId !== teamId) {
      return sendPortalApiError(res, 404, 'CONFIG_NOT_FOUND', 'Config version not found.', { requestId });
    }
    if (!PLATFORM_RUN_ELIGIBLE_CONFIG_STATUSES.has(String(config.status || '').trim())) {
      return sendPortalApiError(
        res,
        409,
        'CONFIG_PROMOTION_BLOCKED',
        'Only candidate or active config versions may be promoted.',
        { requestId }
      );
    }

    const binding = upsertTeamConfigBinding({
      teamBindingId: `tb_${randomHex(10)}`,
      houseId: resolvedHouse.houseId,
      teamId,
      activeConfigVersionId: configVersionId,
      nowIso: nowIso(),
    });
    return sendPortalApiSuccess(res, {
      houseId: resolvedHouse.houseId,
      teamId,
      activeConfigVersionId: binding.activeConfigVersionId,
      binding,
      config,
    }, { requestId });
  });

  app.post('/v1/integrations/resolve', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }

    const idempotencyKey = normalizePortalIdempotencyKey(req);
    const targetUrl = typeof req.body?.targetUrl === 'string'
      ? req.body.targetUrl.trim()
      : (typeof req.body?.url === 'string' ? req.body.url.trim() : '');
    const preferredMode = typeof req.body?.preferredMode === 'string' ? req.body.preferredMode.trim() : 'auto';
    const sourceHints = req.body?.sourceHints && typeof req.body.sourceHints === 'object' && !Array.isArray(req.body.sourceHints)
      ? req.body.sourceHints
      : {};
    if (!idempotencyKey || !targetUrl) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'targetUrl and Idempotency-Key are required.', { requestId });
    }

    const sessionHouseId = typeof session?.houseCeremony?.houseId === 'string' ? session.houseCeremony.houseId.trim() : '';
    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, sessionHouseId);
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'House authorization failed.', { requestId });
    }

    const replayed = getIntegrationCandidateByIdempotency(idempotencyKey);
    if (replayed) {
      return sendPortalApiSuccess(res, {
        integrationCandidateId: replayed.integrationCandidateId,
        sourceKind: replayed.sourceKind,
        requiresCompilation: replayed.requiresCompilation,
        ...((replayed.candidate && typeof replayed.candidate === 'object') ? replayed.candidate : {}),
      }, { requestId });
    }

    try {
      assertPortalContractTargetAllowed(targetUrl);
      const resolved = resolveWebTarget(targetUrl, { preferredMode, sourceHints });
      if (!resolved?.integration) {
        return sendPortalApiError(
          res,
          409,
          'INTEGRATION_TARGET_UNSUPPORTED',
          'No supported integration candidate was found for this target.',
          { requestId }
        );
      }
      const sourceKind = String(resolved.integration?.sourceType || 'parse').trim() || 'parse';
      const requiresCompilation = sourceKind !== 'native_pack';
      const candidate = {
        resolutionState: String(resolved.resolutionState || 'supported'),
        sourceKind,
        requiresCompilation,
        website: resolved.website || null,
        integration: resolved.integration || null,
        parse: resolved.parse || null,
        alternatives: Array.isArray(resolved.alternatives) ? resolved.alternatives : [],
        fallback: resolved.fallback || null,
        targetUrl: new URL(targetUrl).toString(),
      };
      const created = createIntegrationCandidate({
        integrationCandidateId: `intcand_${randomHex(10)}`,
        idempotencyKey,
        targetUrl: candidate.targetUrl,
        sourceKind,
        requiresCompilation,
        candidate,
        nowIso: nowIso(),
      });
      return sendPortalApiSuccess(res, {
        integrationCandidateId: created.integrationCandidateId,
        sourceKind: created.sourceKind,
        requiresCompilation: created.requiresCompilation,
        ...candidate,
      }, { status: 201, requestId });
    } catch (err) {
      if (err?.code === 'PROXY_TARGET_BLOCKED') {
        return sendProxyPolicyContractError(res, err, requestId);
      }
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'targetUrl must be a valid http(s) URL.', { requestId });
    }
  });

  app.post('/v1/integrations/:integrationId/compilations', express.json({ limit: '48kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }

    const integrationId = typeof req.params?.integrationId === 'string' ? req.params.integrationId.trim() : '';
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!integrationId || !idempotencyKey) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'integrationId and Idempotency-Key are required.', { requestId });
    }

    const sessionHouseId = typeof session?.houseCeremony?.houseId === 'string' ? session.houseCeremony.houseId.trim() : '';
    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, sessionHouseId);
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'House authorization failed.', { requestId });
    }

    const candidate = getIntegrationCandidateById(integrationId);
    if (!candidate) {
      return sendPortalApiError(res, 404, 'INTEGRATION_NOT_FOUND', 'Integration candidate not found.', { requestId });
    }

    const replayed = getIntegrationPackVersionByIdempotency({
      integrationId,
      idempotencyKey,
    });
    if (replayed) {
      return sendPortalApiSuccess(res, {
        packVersionId: replayed.packVersionId,
        contentHash: replayed.contentHash,
        fileHashes: replayed.fileHashes,
        manifest: replayed.manifest,
      }, { requestId });
    }

    const compiled = buildCompiledIntegrationPack({
      ...candidate.candidate,
      integrationCandidateId: candidate.integrationCandidateId,
      sourceKind: candidate.sourceKind,
      targetUrl: candidate.targetUrl,
    });
    const created = createIntegrationPackVersion({
      packVersionId: compiled.packVersionId,
      integrationId,
      sourceKind: candidate.sourceKind,
      contentHash: compiled.contentHash,
      manifest: compiled.manifest,
      fileHashes: compiled.fileHashes,
      idempotencyKey,
      nowIso: nowIso(),
    });
    return sendPortalApiSuccess(res, {
      packVersionId: created.packVersionId,
      contentHash: created.contentHash,
      fileHashes: created.fileHashes,
      manifest: created.manifest,
    }, { status: 201, requestId });
  });

  app.post('/v1/integrations/:integrationId/executions', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }

    const integrationId = typeof req.params?.integrationId === 'string' ? req.params.integrationId.trim() : '';
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    const actionId = typeof req.body?.actionId === 'string' ? req.body.actionId.trim() : '';
    const requestedBy = req.body?.requestedBy && typeof req.body.requestedBy === 'object' && !Array.isArray(req.body.requestedBy)
      ? req.body.requestedBy
      : {};
    const executionRequest = req.body?.request && typeof req.body.request === 'object' && !Array.isArray(req.body.request)
      ? req.body.request
      : {};
    if (!integrationId || !idempotencyKey || !actionId) {
      return sendPortalApiError(
        res,
        400,
        actionId ? 'INVALID_ARGUMENT' : 'EXECUTION_NOT_ALLOWED',
        'integrationId, actionId, and Idempotency-Key are required.',
        { requestId }
      );
    }

    const sessionHouseId = typeof session?.houseCeremony?.houseId === 'string' ? session.houseCeremony.houseId.trim() : '';
    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, sessionHouseId);
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'House authorization failed.', { requestId });
    }

    const candidate = getIntegrationCandidateById(integrationId);
    if (!candidate) {
      return sendPortalApiError(res, 404, 'INTEGRATION_NOT_FOUND', 'Integration candidate not found.', { requestId });
    }

    const replayed = getIntegrationExecutionByIdempotency({
      integrationId,
      idempotencyKey,
    });
    if (replayed) {
      return sendPortalApiSuccess(res, {
        executionId: replayed.integrationExecutionId,
        status: replayed.status,
        actionId: replayed.actionId,
        requestedBy: replayed.requestedBy,
      }, { requestId });
    }

    const policy = deps.getPlatformIntegrationActionPolicy({
      ...candidate.candidate,
      sourceKind: candidate.sourceKind,
      website: candidate.candidate?.website || null,
    }, actionId);
    if (!policy) {
      return sendPortalApiError(res, 400, 'EXECUTION_NOT_ALLOWED', 'actionId is not allowed for this integration.', { requestId });
    }
    const approvalId = typeof executionRequest?.approvalId === 'string' ? executionRequest.approvalId.trim() : '';
    if (policy.requiresApproval && !approvalId) {
      return sendPortalApiError(res, 409, 'APPROVAL_REQUIRED', 'This action requires explicit approval.', { requestId });
    }

    const execution = createIntegrationExecution({
      integrationExecutionId: `exec_${randomHex(10)}`,
      integrationId,
      actionId,
      requestedBy,
      approvalId,
      status: policy.status,
      request: executionRequest,
      result: {
        policy: {
          requiresApproval: policy.requiresApproval,
        },
      },
      idempotencyKey,
      nowIso: nowIso(),
    });
    return sendPortalApiSuccess(res, {
      executionId: execution.integrationExecutionId,
      status: execution.status,
      actionId: execution.actionId,
      requestedBy: execution.requestedBy,
    }, { status: 201, requestId });
  });

  app.post('/v1/experiences/:experienceId/runs', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }

    const experienceId = typeof req.params?.experienceId === 'string' ? req.params.experienceId.trim() : '';
    if (!SUPPORTED_PLATFORM_EXPERIENCE_IDS.has(experienceId)) {
      return sendPortalApiError(res, 404, 'EXPERIENCE_NOT_FOUND', 'Experience not found.', { requestId });
    }

    const sessionHouseId = typeof session?.houseCeremony?.houseId === 'string' ? session.houseCeremony.houseId.trim() : '';
    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, sessionHouseId);
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'House authorization failed.', { requestId });
    }

    const idempotencyKey = normalizePortalIdempotencyKey(req);
    const teamId = typeof req.body?.teamId === 'string' ? req.body.teamId.trim() : '';
    const configVersionId = typeof req.body?.configVersionId === 'string' ? req.body.configVersionId.trim() : '';
    const entryMode = typeof req.body?.entryMode === 'string' ? req.body.entryMode.trim() : '';
    const metadata = req.body?.metadata && typeof req.body.metadata === 'object' && !Array.isArray(req.body.metadata)
      ? req.body.metadata
      : {};
    if (!idempotencyKey || !teamId || !configVersionId || !PLATFORM_RUN_ENTRY_MODES.has(entryMode)) {
      return sendPortalApiError(
        res,
        400,
        'INVALID_ARGUMENT',
        'teamId, configVersionId, entryMode, and Idempotency-Key are required.',
        { requestId }
      );
    }

    const configVersion = getConfigVersion(configVersionId);
    if (!configVersion) {
      return sendPortalApiError(res, 404, 'CONFIG_NOT_FOUND', 'Config version not found.', { requestId });
    }

    const configStatus = typeof configVersion?.manifest?.status === 'string' ? configVersion.manifest.status.trim() : '';
    if (
      configVersion.houseId !== resolvedHouse.houseId
      || configVersion.teamId !== teamId
      || (configStatus && !PLATFORM_RUN_ELIGIBLE_CONFIG_STATUSES.has(configStatus))
    ) {
      return sendPortalApiError(res, 409, 'CONFIG_NOT_ELIGIBLE', 'Config version is not eligible for this run.', { requestId });
    }

    const replayed = getRunByIdempotency({
      houseId: resolvedHouse.houseId,
      idempotencyKey,
    });
    if (replayed) {
      return sendPortalApiSuccess(res, {
        runId: replayed.runId,
        status: replayed.status,
        traceAuthorityType: replayed.traceAuthorityType,
      }, { requestId });
    }

    const run = createRun({
      runId: `run_${randomHex(10)}`,
      traceId: `trace_${randomHex(10)}`,
      experienceId,
      houseId: resolvedHouse.houseId,
      teamId,
      configVersionId,
      entryMode,
      status: 'queued',
      traceAuthorityType: PLATFORM_TRACE_AUTHORITY_TYPE,
      metadata: {
        ...metadata,
        requestId,
        sessionId: session.sessionId,
        traceAuthorityRef: `house:${resolvedHouse.houseId}`,
      },
      idempotencyKey,
      nowIso: nowIso(),
    });
    return sendPortalApiSuccess(res, {
      runId: run.runId,
      status: run.status,
      traceAuthorityType: run.traceAuthorityType,
    }, { status: 201, requestId });
  });

  app.post('/v1/traces/ingestions', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    const runId = typeof req.body?.runId === 'string' ? req.body.runId.trim() : '';
    const records = Array.isArray(req.body?.records) ? req.body.records : [];
    if (!idempotencyKey || !runId || records.length === 0) {
      return sendPortalApiError(
        res,
        400,
        'TRACE_INTAKE_INVALID',
        'runId, records, and Idempotency-Key are required.',
        { requestId }
      );
    }

    const run = getRunById(runId);
    if (!run) {
      return sendPortalApiError(res, 404, 'RUN_NOT_FOUND', 'Run not found.', { requestId });
    }

    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, run.houseId || '');
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'Trace intake authorization failed.', { requestId });
    }

    let accepted = 0;
    let ignored = 0;
    let rejected = 0;
    let latestEvent = getLatestTraceEvent(run.traceId);
    const runStatus = String(run.status || '').trim().toLowerCase();
    for (const record of records) {
      const ingestKey = typeof record?.ingestKey === 'string' ? record.ingestKey.trim() : '';
      const sourceType = typeof record?.sourceType === 'string' ? record.sourceType.trim() : '';
      const payloadSchema = typeof record?.payloadSchema === 'string' ? record.payloadSchema.trim() : '';
      const recordKind = typeof record?.recordKind === 'string' && record.recordKind.trim()
        ? record.recordKind.trim()
        : (typeof record?.payload?.kind === 'string' && record.payload.kind.trim() === 'annotation' ? 'annotation' : 'fact');
      const payload = record?.payload && typeof record.payload === 'object' && !Array.isArray(record.payload)
        ? record.payload
        : {};
      if (!ingestKey || !sourceType || !payloadSchema) {
        rejected += 1;
        continue;
      }
      const duplicate = getTraceIntakeRecord({ runId, ingestKey });
      if (duplicate) {
        ignored += 1;
        continue;
      }
      if (runStatus === 'completed' && recordKind !== 'annotation') {
        return sendPortalApiError(
          res,
          409,
          'TRACE_LATE_EVENT_REJECTED',
          'Completed runs reject fact-changing late intake records.',
          { requestId }
        );
      }

      createTraceIntakeRecord({
        traceIntakeRecordId: `intk_${randomHex(10)}`,
        traceId: run.traceId,
        runId,
        ingestKey,
        sourceType,
        payloadSchema,
        recordKind,
        payload: {
          recordKind,
          payloadSchema,
          payload,
        },
        createdAt: nowIso(),
      });

      const seq = latestEvent ? Number(latestEvent.seq || 0) + 1 : 1;
      const eventKind = typeof payload?.kind === 'string' && payload.kind.trim()
        ? payload.kind.trim()
        : payloadSchema;
      const eventHash = sha256PrefixedHex(JSON.stringify({
        traceId: run.traceId,
        runId,
        seq,
        eventKind,
        sourceType,
        payloadSchema,
        recordKind,
        payload,
        prevEventHash: latestEvent?.eventHash || null,
      }));
      latestEvent = createTraceEvent({
        eventId: `evt_${randomHex(10)}`,
        traceId: run.traceId,
        runId,
        seq,
        eventKind,
        sourceType,
        eventHash,
        prevEventHash: latestEvent?.eventHash || null,
        audience: {
          class: 'TEAM',
          houseId: run.houseId,
          teamId: run.teamId,
          entrantId: null,
          readerIds: [],
        },
        seal: {
          active: false,
          sealedContextId: null,
          releasePolicy: null,
        },
        actorKind: sourceType,
        actorId: 'trace_ingestion',
        payload: {
          payloadSchema,
          payload,
        },
        createdAt: nowIso(),
      });
      accepted += 1;
    }

    const currentRun = getRunById(runId);
    const priorCounters = currentRun?.metadata?.archiveCounters && typeof currentRun.metadata.archiveCounters === 'object'
      ? currentRun.metadata.archiveCounters
      : {};
    updateRunMetadata({
      runId,
      metadata: {
        ...(currentRun?.metadata && typeof currentRun.metadata === 'object' ? currentRun.metadata : {}),
        archiveCounters: {
          accepted: Number(priorCounters.accepted || 0) + accepted,
          ignored: Number(priorCounters.ignored || 0) + ignored,
          rejected: Number(priorCounters.rejected || 0) + rejected,
        },
      },
      nowIso: nowIso(),
    });

    return sendPortalApiSuccess(res, {
      runId,
      accepted,
      ignored,
      rejected,
      traceId: run.traceId,
    }, { requestId });
  });

  app.get('/v1/traces/:traceId', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const traceId = typeof req.params?.traceId === 'string' ? req.params.traceId.trim() : '';
    const run = getRunByTraceId(traceId);
    if (!run) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Trace not found.', { requestId });
    }
    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, run.houseId || '');
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'Trace read authorization failed.', { requestId });
    }
    const events = listTraceEvents(traceId);
    return sendPortalApiSuccess(res, {
      traceId,
      runId: run.runId,
      eventCount: events.length,
      status: run.status,
      completedAt: run.completedAt,
      traceAuthorityType: run.traceAuthorityType,
      authority: {
        type: run.traceAuthorityType,
        ref: run.traceAuthorityType === 'poker_operator'
          ? 'svc_poker_operator'
          : `house:${run.houseId || ''}`,
      },
      archiveCounters: run?.metadata?.archiveCounters && typeof run.metadata.archiveCounters === 'object'
        ? run.metadata.archiveCounters
        : { accepted: events.length, ignored: 0, rejected: 0 },
    }, { requestId });
  });

  app.get('/v1/traces/:traceId/events', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const traceId = typeof req.params?.traceId === 'string' ? req.params.traceId.trim() : '';
    const run = getRunByTraceId(traceId);
    if (!run) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Trace not found.', { requestId });
    }
    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, run.houseId || '');
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'Trace read authorization failed.', { requestId });
    }
    const requestedLimit = Number(req.query?.limit || 50);
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(100, Math.floor(requestedLimit)) : 50;
    const afterSeq = decodeTraceCursor(typeof req.query?.cursor === 'string' ? req.query.cursor : '');
    const allEvents = listTraceEvents(traceId);
    const filtered = allEvents.filter((event) => Number(event?.seq || 0) > afterSeq);
    const items = filtered.slice(0, limit);
    const nextCursor = filtered.length > items.length
      ? encodeTraceCursor(items[items.length - 1]?.seq || 0)
      : null;
    return sendPortalApiSuccess(res, {
      traceId,
      items,
      nextCursor,
    }, { requestId });
  });

  app.post('/v1/trainer/jobs', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }

    const sessionHouseId = typeof session?.houseCeremony?.houseId === 'string' ? session.houseCeremony.houseId.trim() : '';
    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, sessionHouseId);
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'House authorization failed.', { requestId });
    }

    const idempotencyKey = normalizePortalIdempotencyKey(req);
    const teamId = typeof req.body?.teamId === 'string' ? req.body.teamId.trim() : '';
    const jobKind = typeof req.body?.jobKind === 'string' ? req.body.jobKind.trim() : '';
    const targets = req.body?.targets && typeof req.body.targets === 'object' && !Array.isArray(req.body.targets)
      ? req.body.targets
      : {};
    let budget = {};
    if (!idempotencyKey || !teamId || !jobKind) {
      return sendPortalApiError(
        res,
        400,
        'INVALID_ARGUMENT',
        'teamId, jobKind, and Idempotency-Key are required.',
        { requestId }
      );
    }
    if (!PLATFORM_TRAINER_JOB_KINDS.has(jobKind)) {
      return sendPortalApiError(res, 400, 'TRAINER_JOB_KIND_INVALID', 'jobKind is not supported.', { requestId });
    }
    if (!hasPlatformTrainerTargets(targets)) {
      return sendPortalApiError(res, 400, 'TRAINER_TARGET_INVALID', 'targets must identify at least one trace, run, or config.', { requestId });
    }
    try {
      budget = normalizePlatformTrainerBudget(req.body?.budget);
    } catch (_err) {
      return sendPortalApiError(res, 400, 'TRAINER_BUDGET_INVALID', 'budget.maxUsd must be a positive number when provided.', { requestId });
    }

    const replayed = getTrainerJobByIdempotency({
      houseId: resolvedHouse.houseId,
      idempotencyKey,
    });
    if (replayed) {
      const replayedResult = getTrainerResultByJobId(replayed.trainerJobId);
      return sendPortalApiSuccess(res, {
        trainerJobId: replayed.trainerJobId,
        status: replayed.status,
        jobKind: replayed.jobKind,
        result: replayedResult ? {
          trainerResultId: replayedResult.trainerResultId,
          status: replayedResult.status,
          approvalNeeded: replayedResult.approvalNeeded,
        } : null,
      }, { requestId });
    }

    const createdJob = createTrainerJob({
      trainerJobId: `trainer_${randomHex(10)}`,
      houseId: resolvedHouse.houseId,
      teamId,
      jobKind,
      status: 'queued',
      targets,
      budget,
      idempotencyKey,
      nowIso: nowIso(),
    });

    let job = createdJob;
    let result = null;
    if (jobKind === 'trainer_job.compare') {
      const linkedConfigVersionId = resolvePlatformTrainerLinkedConfigVersionId({
        houseId: resolvedHouse.houseId,
        teamId,
        targets,
      });
      const resultSeed = buildPlatformTrainerResultPayload(job, { linkedConfigVersionId });
      result = createTrainerResult({
        trainerResultId: resultSeed.trainerResultId,
        trainerJobId: job.trainerJobId,
        status: resultSeed.status,
        result: resultSeed.resultPayload,
        candidatePatchIds: resultSeed.candidatePatchIds,
        linkedConfigVersionId: resultSeed.linkedConfigVersionId,
        approvalNeeded: resultSeed.approvalNeeded,
        nowIso: nowIso(),
      });
      job = updateTrainerJobStatus({
        trainerJobId: job.trainerJobId,
        status: 'succeeded',
        nowIso: nowIso(),
      });
    }

    return sendPortalApiSuccess(res, {
      trainerJobId: job.trainerJobId,
      status: job.status,
      jobKind: job.jobKind,
      result: result ? {
        trainerResultId: result.trainerResultId,
        status: result.status,
        approvalNeeded: result.approvalNeeded,
      } : null,
    }, { status: 201, requestId });
  });

  app.get('/v1/trainer/jobs/:trainerJobId', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const trainerJobId = typeof req.params?.trainerJobId === 'string' ? req.params.trainerJobId.trim() : '';
    const job = getTrainerJobById(trainerJobId);
    if (!job) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Trainer job not found.', { requestId });
    }
    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, job.houseId || '');
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'Trainer read authorization failed.', { requestId });
    }
    const result = getTrainerResultByJobId(job.trainerJobId);
    return sendPortalApiSuccess(res, {
      trainerJobId: job.trainerJobId,
      status: job.status,
      jobKind: job.jobKind,
      targets: job.targets,
      budget: job.budget,
      result: result ? {
        trainerResultId: result.trainerResultId,
        status: result.status,
        candidatePatchIds: result.candidatePatchIds,
        linkedConfigVersionId: result.linkedConfigVersionId,
        approvalNeeded: result.approvalNeeded,
      } : null,
    }, { requestId });
  });

  app.get('/v1/trainer/results/:trainerResultId', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const trainerResultId = typeof req.params?.trainerResultId === 'string' ? req.params.trainerResultId.trim() : '';
    const result = getTrainerResultById(trainerResultId);
    if (!result) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Trainer result not found.', { requestId });
    }
    const job = getTrainerJobById(result.trainerJobId);
    if (!job) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Trainer job not found.', { requestId });
    }
    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, job.houseId || '');
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'Trainer read authorization failed.', { requestId });
    }
    return sendPortalApiSuccess(res, {
      trainerResultId: result.trainerResultId,
      trainerJobId: result.trainerJobId,
      status: result.status,
      linkedConfigVersionId: result.linkedConfigVersionId,
      approvalNeeded: result.approvalNeeded,
      ...((result.result && typeof result.result === 'object') ? result.result : {}),
    }, { requestId });
  });

  app.post('/v1/trainer/results/:trainerResultId/promote-patch', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }

    const trainerResultId = typeof req.params?.trainerResultId === 'string' ? req.params.trainerResultId.trim() : '';
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    const teamId = typeof req.body?.teamId === 'string' ? req.body.teamId.trim() : '';
    const candidatePatchId = typeof req.body?.candidatePatchId === 'string' ? req.body.candidatePatchId.trim() : '';
    const approvalId = typeof req.body?.approvalId === 'string' ? req.body.approvalId.trim() : '';
    if (!trainerResultId || !idempotencyKey || !teamId || !candidatePatchId) {
      return sendPortalApiError(
        res,
        400,
        'INVALID_ARGUMENT',
        'trainerResultId, teamId, candidatePatchId, and Idempotency-Key are required.',
        { requestId }
      );
    }

    const result = getTrainerResultById(trainerResultId);
    if (!result) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Trainer result not found.', { requestId });
    }
    const job = getTrainerJobById(result.trainerJobId);
    if (!job) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Trainer job not found.', { requestId });
    }
    if (job.teamId !== teamId) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Trainer result does not belong to this team.', { requestId });
    }

    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, job.houseId || '');
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'House authorization failed.', { requestId });
    }
    if (!result.candidatePatchIds.includes(candidatePatchId)) {
      return sendPortalApiError(res, 404, 'TRAINER_PATCH_NOT_FOUND', 'Candidate patch not found on this trainer result.', { requestId });
    }
    if (result.approvalNeeded) {
      const approval = resolveApprovedTrainerPatchPromotion(approvalId, {
        houseId: resolvedHouse.houseId,
        trainerResultId,
        candidatePatchId,
      });
      if (!approval) {
        return sendPortalApiError(res, 409, 'APPROVAL_REQUIRED', 'Patch promotion requires an approved decision.', { requestId });
      }
    }

    const replayedConfig = getConfigVersionByIdempotency({
      houseId: resolvedHouse.houseId,
      teamId,
      idempotencyKey,
    });
    if (replayedConfig) {
      const binding = upsertTeamConfigBinding({
        teamBindingId: `tb_${randomHex(10)}`,
        houseId: resolvedHouse.houseId,
        teamId,
        activeConfigVersionId: replayedConfig.configVersionId,
        nowIso: nowIso(),
      });
      return sendPortalApiSuccess(res, {
        configVersionId: replayedConfig.configVersionId,
        activeConfigVersionId: binding.activeConfigVersionId,
        config: replayedConfig,
        binding,
      }, { requestId });
    }

    const parentConfigVersionId = result.linkedConfigVersionId
      || resolvePlatformTrainerLinkedConfigVersionId({
        houseId: resolvedHouse.houseId,
        teamId,
        targets: job.targets,
      });
    const parentConfig = getConfigVersion(parentConfigVersionId);
    if (!parentConfig) {
      return sendPortalApiError(res, 404, 'CONFIG_NOT_FOUND', 'A base config version is required before promotion.', { requestId });
    }

    const newConfigVersionId = `cfg_${randomHex(10)}`;
    const parentManifest = parentConfig.manifest && typeof parentConfig.manifest === 'object' ? parentConfig.manifest : {};
    const manifestBase = {
      ...parentManifest,
      configVersionId: newConfigVersionId,
      houseId: resolvedHouse.houseId,
      teamId,
      displayVersion: `${newConfigVersionId}@trainer-patch`,
      status: 'active',
      parentConfigVersionIds: [parentConfig.configVersionId],
      trainerPromotion: {
        trainerJobId: job.trainerJobId,
        trainerResultId,
        candidatePatchId,
        approvalId: approvalId || null,
      },
    };
    delete manifestBase.integrity;
    const configHash = sha256PrefixedHex(stableJsonStringify(manifestBase));
    const manifest = {
      ...manifestBase,
      integrity: {
        configHash,
      },
    };
    const now = nowIso();
    const config = upsertConfigVersion({
      configVersionId: newConfigVersionId,
      houseId: resolvedHouse.houseId,
      teamId,
      experienceId: typeof parentConfig.experienceId === 'string' ? parentConfig.experienceId : '',
      status: 'active',
      configHash,
      idempotencyKey,
      manifest,
      lineage: {
        parentConfigVersionIds: [parentConfig.configVersionId],
        trainerJobId: job.trainerJobId,
        trainerResultId,
        candidatePatchId,
        approvalId: approvalId || null,
        createdBy: 'v1.trainer.results.promote-patch',
        requestId,
      },
      nowIso: now,
    });
    const parentComponents = listConfigComponentVersions(parentConfig.configVersionId);
    replaceConfigComponentVersions({
      configVersionId: newConfigVersionId,
      components: parentComponents.map((component, index) => ({
        configComponentVersionId: `ccv_${randomHex(10)}`,
        componentKind: component.componentKind,
        componentKey: component.componentKey,
        immutableVersionId: component.immutableVersionId,
        componentHash: component.componentHash,
        metadata: {
          ...(component.metadata && typeof component.metadata === 'object' ? component.metadata : {}),
          ordinal: index,
          promotedFromConfigVersionId: parentConfig.configVersionId,
          candidatePatchId,
        },
      })),
      nowIso: now,
    });
    const binding = upsertTeamConfigBinding({
      teamBindingId: `tb_${randomHex(10)}`,
      houseId: resolvedHouse.houseId,
      teamId,
      activeConfigVersionId: newConfigVersionId,
      nowIso: now,
    });
    updateTrainerResultLink({
      trainerResultId,
      linkedConfigVersionId: newConfigVersionId,
      nowIso: now,
    });
    return sendPortalApiSuccess(res, {
      configVersionId: config.configVersionId,
      activeConfigVersionId: binding.activeConfigVersionId,
      config,
      binding,
    }, { status: 201, requestId });
  });

  app.get('/v1/seals/:sealedContextId', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const sealedContextId = typeof req.params?.sealedContextId === 'string' ? req.params.sealedContextId.trim() : '';
    const sealedContext = getSealedContextById(sealedContextId);
    if (!sealedContext) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Sealed context not found.', { requestId });
    }
    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, sealedContext.houseId || '');
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'Seal read authorization failed.', { requestId });
    }
    return sendPortalApiSuccess(res, {
      sealedContextId: sealedContext.sealedContextId,
      entrantId: sealedContext.entrantId,
      scopeType: sealedContext.scopeType,
      scopeKey: sealedContext.scopeKey,
      allowedReaders: sealedContext.allowedReaders,
      forbiddenSources: sealedContext.forbiddenSources,
      releasePolicy: sealedContext.releasePolicy,
      status: sealedContext.status,
    }, { requestId });
  });

  app.post('/v1/seals/:sealedContextId/release', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const sealedContextId = typeof req.params?.sealedContextId === 'string' ? req.params.sealedContextId.trim() : '';
    const sealedContext = getSealedContextById(sealedContextId);
    if (!sealedContext) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Sealed context not found.', { requestId });
    }
    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, sealedContext.houseId || '');
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'Seal release authorization failed.', { requestId });
    }
    if (sealedContext.status === 'released') {
      return sendPortalApiSuccess(res, sealedContext, { requestId });
    }
    if (sealedContext.releasePolicy !== 'manual') {
      return sendPortalApiError(res, 409, 'SEAL_RELEASE_BLOCKED', 'This sealed context cannot be manually released.', { requestId });
    }
    const updated = updateSealedContextStatus({
      sealedContextId,
      status: 'released',
      nowIso: nowIso(),
    });
    return sendPortalApiSuccess(res, updated, { requestId });
  });

  app.post('/v1/seals/:sealedContextId/violation', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const sealedContextId = typeof req.params?.sealedContextId === 'string' ? req.params.sealedContextId.trim() : '';
    const sealedContext = getSealedContextById(sealedContextId);
    if (!sealedContext) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Sealed context not found.', { requestId });
    }
    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, sealedContext.houseId || '');
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'Seal violation authorization failed.', { requestId });
    }
    const actor = req.body?.actor && typeof req.body.actor === 'object' && !Array.isArray(req.body.actor)
      ? req.body.actor
      : {
        actorType: 'human',
        actorId: session.sessionId,
      };
    const details = req.body?.details && typeof req.body.details === 'object' && !Array.isArray(req.body.details)
      ? req.body.details
      : {};
    const violation = createSealedContextViolation({
      sealedContextViolationId: `sealvio_${randomHex(10)}`,
      sealedContextId,
      actor,
      details,
      nowIso: nowIso(),
    });
    return sendPortalApiSuccess(res, {
      sealedContextId,
      violation,
    }, { status: 201, requestId });
  });

  app.post('/v1/traces/poker-operator-ingestions', express.json({ limit: '128kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }

    const sessionHouseId = typeof session?.houseCeremony?.houseId === 'string' ? session.houseCeremony.houseId.trim() : '';
    const store = readStore();
    const resolvedHouse = resolveHouseAddress(store, sessionHouseId);
    const auth = verifyHouseAuth(req, resolvedHouse?.house || null);
    if (!auth.ok) {
      return sendPortalApiError(res, 401, auth.error, 'House authorization failed.', { requestId });
    }

    const idempotencyKey = normalizePortalIdempotencyKey(req);
    const teamId = typeof req.body?.teamId === 'string' ? req.body.teamId.trim() : '';
    const records = parsePokerOperatorFixtureRecords(req.body?.records);
    if (!idempotencyKey || !teamId || records.length === 0) {
      return sendPortalApiError(
        res,
        400,
        'INVALID_ARGUMENT',
        'teamId, records, and Idempotency-Key are required.',
        { requestId }
      );
    }

    const replayedRun = getRunByIdempotency({
      houseId: resolvedHouse.houseId,
      idempotencyKey,
    });
    if (replayedRun && replayedRun.traceAuthorityType === 'poker_operator') {
      return sendPortalApiSuccess(res, {
        runId: replayedRun.runId,
        traceId: replayedRun.traceId,
        eventCount: listTraceEvents(replayedRun.traceId).length,
        authority: {
          type: 'poker_operator',
        },
      }, { requestId });
    }

    const run = createRun({
      runId: `run_${randomHex(10)}`,
      traceId: `trace_${randomHex(10)}`,
      experienceId: 'arena.poker.season0',
      houseId: resolvedHouse.houseId,
      teamId,
      configVersionId: '',
      entryMode: 'season_lock',
      status: 'queued',
      traceAuthorityType: 'poker_operator',
      metadata: {
        authority: {
          type: 'poker_operator',
          ref: 'svc_poker_operator',
        },
        requestId,
      },
      idempotencyKey,
      nowIso: nowIso(),
    });

    let latestEvent = null;
    for (const record of records) {
      const ingestKey = typeof record?.ingestKey === 'string' ? record.ingestKey.trim() : '';
      const eventType = typeof record?.type === 'string' ? record.type.trim() : '';
      const entrantId = typeof record?.entrantId === 'string' ? record.entrantId.trim() : '';
      if (!ingestKey || !eventType || !entrantId) {
        continue;
      }
      createTraceIntakeRecord({
        traceIntakeRecordId: `intk_${randomHex(10)}`,
        traceId: run.traceId,
        runId: run.runId,
        ingestKey,
        sourceType: 'poker_operator',
        payloadSchema: `raw.poker.operator.${eventType}/v1`,
        payload: record,
        createdAt: nowIso(),
      });

      const fixtureSealed = buildSeededSealedContextRecord({
        houseId: resolvedHouse.houseId,
        traceId: run.traceId,
        runId: run.runId,
        releasePolicy: 'post_match',
        status: 'active',
      });
      const sealedContext = upsertSealedContext({
        houseId: resolvedHouse.houseId,
        sealedContextId: entrantId === fixtureSealed.entrantId
          ? fixtureSealed.sealedContextId
          : deriveDeterministicSealId(entrantId),
        traceId: run.traceId,
        runId: run.runId,
        entrantId,
        scopeType: 'entrant_private',
        scopeKey: `poker:${entrantId}`,
        allowedReaders: entrantId === fixtureSealed.entrantId
          ? fixtureSealed.allowedReaders
          : [entrantId, 'arbiter_fixture'],
        forbiddenSources: fixtureSealed.forbiddenSources,
        releasePolicy: 'post_match',
        status: 'active',
        nowIso: nowIso(),
      });
      const seq = latestEvent ? Number(latestEvent.seq || 0) + 1 : 1;
      const payloadSchema = `et.trace.poker.${eventType}/v1`;
      const eventHash = sha256PrefixedHex(JSON.stringify({
        traceId: run.traceId,
        runId: run.runId,
        seq,
        eventType,
        entrantId,
        prevEventHash: latestEvent?.eventHash || null,
        payloadSchema,
        payload: record,
      }));
      latestEvent = createTraceEvent({
        eventId: `evt_${randomHex(10)}`,
        traceId: run.traceId,
        runId: run.runId,
        seq,
        eventKind: `poker.${eventType}`,
        sourceType: 'poker_operator',
        eventHash,
        prevEventHash: latestEvent?.eventHash || null,
        audience: {
          class: 'ENTRANT',
          houseId: resolvedHouse.houseId,
          teamId,
          entrantId,
          readerIds: allowedReaderIdsFromSealedContext(sealedContext),
        },
        seal: {
          active: true,
          sealedContextId: sealedContext.sealedContextId,
          releasePolicy: 'post_match',
        },
        actorKind: 'service',
        actorId: 'svc_poker_operator',
        sealedContextId: sealedContext.sealedContextId,
        payload: {
          payloadSchema,
          payload: record,
        },
        createdAt: nowIso(),
      });
    }
    const eventCount = listTraceEvents(run.traceId).length;
    const runWithCounters = updateRunMetadata({
      runId: run.runId,
      metadata: {
        ...(run.metadata && typeof run.metadata === 'object' ? run.metadata : {}),
        authority: {
          type: 'poker_operator',
          ref: 'svc_poker_operator',
        },
        archiveCounters: {
          accepted: eventCount,
          ignored: 0,
          rejected: 0,
        },
      },
      nowIso: nowIso(),
    });
    const completedRun = updateRunStatus({
      runId: run.runId,
      status: 'completed',
      completedAt: nowIso(),
      nowIso: nowIso(),
    });
    return sendPortalApiSuccess(res, {
      runId: completedRun.runId,
      traceId: completedRun.traceId,
      eventCount: runWithCounters?.metadata?.archiveCounters?.accepted || eventCount,
      authority: {
        type: 'poker_operator',
      },
    }, { status: 201, requestId });
  });
}

module.exports = {
  registerPlatformV1Routes,
};
