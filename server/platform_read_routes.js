function registerPlatformReadRoutes(app, deps) {
  const {
    express,
    buildDefaultCompiledSkillPack,
    buildPlatformContextResponse,
    buildPlatformTrainerResultPayload,
    buildPortalRequestId,
    createHouseStaffAssignment,
    createHouseWorkerDeployment,
    createHouseWorkerShare,
    createTrainerJob,
    createTrainerResult,
    ensureHouseOfficeStructure,
    getConfigVersion,
    getConfigVersionByIdempotency,
    getHouseWorkerDeploymentById,
    getHouseWorkerShareById,
    getRegistryEntityById,
    getUnifiedPlatformTestFixture,
    getTeamConfigBinding,
    listTrackDefinitions,
    listTrackProgressEvents,
    getTrainerJobById,
    getTrainerJobByIdempotency,
    getTrainerResultById,
    getTrainerResultByJobId,
    listConfigComponentVersions,
    listHouseOffices,
    listHouseStaffAgents,
    listHouseStaffAssignments,
    listHouseWorkerDeployments,
    listPlatformExperienceDefinitions,
    listRuns,
    listTeamConfigBindings,
    listTraceEvents,
    listTrainerJobs,
    listTrainerResults,
    normalizePlatformTrainerBudget,
    normalizePortalIdempotencyKey,
    nowIso,
    randomHex,
    replaceConfigComponentVersions,
    resolveApprovedTrainerPatchPromotion,
    resolveHumanSessionWithRecovery,
    resolvePlatformTrainerLinkedConfigVersionId,
    resolveSessionPlatformContext,
    sendPortalApiError,
    sendPortalApiSuccess,
    sha256PrefixedHex,
    stableJsonStringify,
    updateTrainerJobStatus,
    updateTrainerResultLink,
    upsertConfigVersion,
    upsertTeamConfigBinding,
  } = deps;

  function buildHouseExperienceItems() {
    const fixture = getUnifiedPlatformTestFixture('house_experiences_seed') || {};
    const seededItems = Array.isArray(fixture?.experiences) ? fixture.experiences : [];
    const definitions = new Map(
      (Array.isArray(listPlatformExperienceDefinitions()) ? listPlatformExperienceDefinitions() : [])
        .map((entry) => [String(entry?.experienceId || '').trim(), entry])
        .filter(([experienceId]) => experienceId)
    );
    return seededItems.map((item) => {
      const experienceId = String(item?.experienceId || '').trim();
      if (!experienceId) return null;
      const definition = definitions.get(experienceId) || null;
      const title = String(item?.title || definition?.displayName || experienceId).trim() || experienceId;
      const entryPath = String(item?.entryPath || '').trim();
      const primaryLabel = experienceId === 'poker.season' ? 'Open Poker' : `Open ${title}`;
      const actions = [];
      if (entryPath) {
        actions.push({
          actionId: 'open_primary',
          label: primaryLabel,
          entryPath,
        });
      }
      if (experienceId === 'web.agent' || experienceId === 'poker.season') {
        actions.push({
          actionId: 'open_registry',
          label: 'Open Registry',
          entryPath: '/app?district=registry',
        });
      }
      return {
        experienceId,
        title,
        displayName: String(definition?.displayName || title).trim() || title,
        requiresConfigPinning: definition?.requiresConfigPinning === true,
        supportedEntryModes: Array.isArray(definition?.supportedEntryModes) ? definition.supportedEntryModes : [],
        aliases: Array.isArray(definition?.aliases) ? definition.aliases : [],
        entryPath,
        actions,
      };
    }).filter(Boolean);
  }

  function getTrackAntiFarmingPolicy() {
    const fixture = getUnifiedPlatformTestFixture('tracks_core_seed') || {};
    const threshold = Number(fixture?.antiFarming?.duplicateActionThreshold || 1);
    return {
      duplicateActionThreshold: Number.isFinite(threshold) && threshold > 0 ? Math.floor(threshold) : 1,
      mode: 'dedupe_key_cap',
    };
  }

  function buildTrackReadPayload({ houseId = '', teamId = '' } = {}) {
    const definitions = Array.isArray(listTrackDefinitions()) ? listTrackDefinitions() : [];
    const events = listTrackProgressEvents({ houseId, teamId }).map((event) => ({
      trackProgressEventId: event.trackProgressEventId,
      trackId: event.trackId,
      title: event.title,
      sourceKind: event.sourceKind,
      sourceId: event.sourceId,
      sourceTraceId: event.sourceTraceId,
      sourceEventId: event.sourceEventId,
      sourceRef: event.sourceRef,
      progressDelta: event.progressDelta,
      dedupeKey: event.dedupeKey,
      createdAt: event.createdAt,
    }));
    const eventsByTrackId = events.reduce((acc, event) => {
      if (!acc.has(event.trackId)) acc.set(event.trackId, []);
      acc.get(event.trackId).push(event);
      return acc;
    }, new Map());
    const tracks = definitions.map((definition) => {
      const trackEvents = eventsByTrackId.get(definition.trackId) || [];
      const progressCount = trackEvents.reduce((sum, event) => sum + Number(event.progressDelta || 0), 0);
      const targetCount = Math.max(1, Number(definition.targetCount || 1));
      const normalizedProgress = Math.min(targetCount, progressCount) / targetCount;
      return {
        trackId: definition.trackId,
        title: definition.title,
        progressCount,
        targetCount,
        progress: Number(normalizedProgress.toFixed(4)),
        sourceKinds: [...new Set(trackEvents.map((event) => String(event.sourceKind || '')).filter(Boolean))],
        latestSourceId: trackEvents.length ? trackEvents[trackEvents.length - 1].sourceId : null,
        latestSourceTraceId: trackEvents.length ? trackEvents[trackEvents.length - 1].sourceTraceId : null,
      };
    });
    return {
      tracks,
      events,
      antiFarming: getTrackAntiFarmingPolicy(),
      emptyStateText: 'No track progress recorded yet.',
    };
  }

  function buildHouseOfficeDeepLinks() {
    return {
      office: {
        kind: 'house_surface',
        surface: 'office',
        label: 'Open House Office',
      },
      experiences: {
        kind: 'house_surface',
        surface: 'experiences',
        label: 'Open Experiences',
      },
      workshop: {
        kind: 'house_surface',
        surface: 'workshop',
        label: 'Open Workshop',
      },
      tracks: {
        kind: 'house_surface',
        surface: 'tracks',
        label: 'Open Tracks',
      },
      archive: {
        kind: 'house_surface',
        surface: 'archive',
        label: 'Open Archive',
      },
      trainer: {
        kind: 'house_surface',
        surface: 'trainer',
        label: 'Open Trainer',
      },
    };
  }

  function buildHouseOfficeStructurePayload({
    context = {},
    houseId = '',
    teamId = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    if (!normalizedHouseId) {
      return {
        houseId: null,
        teamId: null,
        activeTeamId: context.activeTeamId,
        availableTeamIds: context.availableTeamIds,
        offices: [],
        staffAgents: [],
        modelVersion: 'house_canonical_structure_v1',
        structureSourceKind: 'unattached_preview',
        seedFixtures: ['house_office_structure_seed'],
      };
    }
    const ensuredStructure = ensureHouseOfficeStructure({
      houseId: normalizedHouseId,
      nowIso: nowIso(),
    });
    return {
      houseId: normalizedHouseId,
      teamId: normalizedTeamId || null,
      activeTeamId: context.activeTeamId,
      availableTeamIds: context.availableTeamIds,
      offices: listHouseOffices({ houseId: normalizedHouseId }),
      staffAgents: listHouseStaffAgents({ houseId: normalizedHouseId, teamId: normalizedTeamId }),
      modelVersion: 'house_canonical_structure_v1',
      structureSourceKind: String(ensuredStructure?.sourceKind || 'durable_house_structure').trim() || 'durable_house_structure',
      seedFixtures: ['house_office_structure_seed'],
    };
  }

  function getHouseOfficePrivacyFixture() {
    const fixture = getUnifiedPlatformTestFixture('house_office_privacy_seed');
    return fixture && typeof fixture === 'object' && !Array.isArray(fixture) ? fixture : {};
  }

  function getHouseOfficeForbiddenMarkers() {
    const fixture = getHouseOfficePrivacyFixture();
    const markers = Array.isArray(fixture?.forbiddenFields)
      ? fixture.forbiddenFields
      : ['prompt', 'callbackUrl', 'credential', 'accessToken', 'sealedPayload'];
    return markers
      .map((entry) => String(entry || '').trim().toLowerCase())
      .filter(Boolean);
  }

  function findHouseOfficeSensitiveMarkers(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return [];
    const lower = normalized.toLowerCase();
    const matches = new Set();
    const matcherByMarker = {
      prompt: /\bprompt\s*[:=]/i,
      callbackurl: /\bcallback(?:url)?\s*[:=]\s*https?:\/\/\S+/i,
      credential: /\bcredential\s*[:=]/i,
      accesstoken: /\baccess(?:[_ -]?token)?\s*[:=]/i,
      sealedpayload: /\bsealed(?:[_ -]?payload)?\s*[:=]/i,
    };
    for (const marker of getHouseOfficeForbiddenMarkers()) {
      const normalizedMarker = String(marker || '').trim().toLowerCase();
      if (!normalizedMarker) continue;
      const matcher = matcherByMarker[normalizedMarker];
      if (matcher && matcher.test(normalized)) {
        matches.add(normalizedMarker);
        continue;
      }
      if (lower.includes(normalizedMarker)) {
        matches.add(normalizedMarker);
      }
    }
    return Array.from(matches);
  }

  function houseOfficeTextHasForbiddenMarker(value) {
    return findHouseOfficeSensitiveMarkers(value).length > 0;
  }

  function sanitizeHouseOfficeText(value, fallback = 'Sensitive details redacted') {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    if (!houseOfficeTextHasForbiddenMarker(normalized)) return normalized;
    return String(fallback || 'Sensitive details redacted').trim() || 'Sensitive details redacted';
  }

  function isSafeHouseOfficeIdentifier(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return false;
    if (!/^[A-Za-z0-9._:-]{1,160}$/.test(normalized)) return false;
    return !houseOfficeTextHasForbiddenMarker(normalized);
  }

  function isSafeHouseWorkerReference(value, { allowEmpty = false, maxLen = 240 } = {}) {
    const normalized = String(value || '').trim();
    if (!normalized) return allowEmpty === true;
    if (normalized.length > Math.max(1, Number(maxLen) || 240)) return false;
    if (!/^[A-Za-z0-9._:/-]+$/.test(normalized)) return false;
    return !houseOfficeTextHasForbiddenMarker(normalized);
  }

  function resolveHouseWorkerPackage(entity = null) {
    const source = entity && typeof entity === 'object' ? entity : null;
    const workerPackage = source?.workerPackage && typeof source.workerPackage === 'object'
      ? source.workerPackage
      : null;
    if (!source || !workerPackage || String(source?.entityKind || '').trim() !== 'worker_package') return null;
    const portableArtifacts = workerPackage?.portableArtifacts && typeof workerPackage.portableArtifacts === 'object'
      ? workerPackage.portableArtifacts
      : {};
    const runtimeDefaults = workerPackage?.runtimeDefaults && typeof workerPackage.runtimeDefaults === 'object'
      ? workerPackage.runtimeDefaults
      : {};
    return {
      registryEntityId: String(source?.registryEntityId || source?.registryId || '').trim(),
      entityVersionId: String(source?.entityVersionId || '').trim(),
      displayName: String(workerPackage?.displayName || source?.displayName || '').trim() || String(source?.registryEntityId || '').trim(),
      oneLineBenefit: String(workerPackage?.oneLineBenefit || source?.description || '').trim(),
      whatItDoes: String(workerPackage?.whatItDoes || source?.description || '').trim(),
      bestFor: Array.isArray(workerPackage?.bestFor)
        ? workerPackage.bestFor.map((entry) => String(entry || '').trim()).filter(Boolean)
        : [],
      recommendedOfficeId: String(workerPackage?.recommendedOfficeId || '').trim(),
      recommendedOfficeLabel: String(workerPackage?.recommendedOfficeLabel || '').trim(),
      supportedSurfaces: Array.isArray(workerPackage?.supportedSurfaces)
        ? workerPackage.supportedSurfaces.map((entry) => String(entry || '').trim()).filter(Boolean)
        : [],
      defaultDisplayName: String(workerPackage?.defaultDisplayName || source?.displayName || '').trim() || String(source?.displayName || '').trim(),
      requiresLocalBrain: workerPackage?.requiresLocalBrain === true,
      brainBindingLabel: String(workerPackage?.brainBindingLabel || '').trim() || 'Needs local brain setup',
      delegationAllowed: workerPackage?.delegationAllowed === true,
      loadoutId: String(workerPackage?.portableArtifacts?.loadoutId || portableArtifacts?.loadoutId || runtimeDefaults?.loadoutId || '').trim(),
      bundleHash: String(workerPackage?.portableArtifacts?.bundleHash || portableArtifacts?.bundleHash || '').trim(),
      runtimeDefaults: {
        brainProfileId: String(runtimeDefaults?.brainProfileId || '').trim() || null,
        workspaceSeedRef: String(runtimeDefaults?.workspaceSeedRef || '').trim() || null,
        configVersionId: String(runtimeDefaults?.configVersionId || '').trim() || null,
        loadoutId: String(runtimeDefaults?.loadoutId || portableArtifacts?.loadoutId || '').trim() || null,
        delegationAllowed: runtimeDefaults?.delegationAllowed === true || workerPackage?.delegationAllowed === true,
      },
    };
  }

  function buildHouseWorkerStatusExplanation(packageInfo = null, status = '') {
    const normalizedStatus = String(status || '').trim();
    const source = packageInfo && typeof packageInfo === 'object' ? packageInfo : {};
    if (normalizedStatus === 'brain_binding_required') {
      return 'Connect a local brain before this helper can start working.';
    }
    if (normalizedStatus === 'ready') {
      return 'Installed and ready to start helping from this office.';
    }
    return String(source?.brainBindingLabel || 'Installed helper is waiting for setup.').trim();
  }

  function resolveHouseWorkerInstallTarget({
    houseId = '',
    teamId = '',
    requestedOfficeId = '',
    packageInfo = null,
    offices = [],
    staffAgents = [],
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    const normalizedRequestedOfficeId = String(requestedOfficeId || '').trim();
    if (!normalizedHouseId || !normalizedTeamId) {
      return {
        ok: false,
        status: 409,
        code: 'HOUSE_TEAM_REQUIRED',
        message: 'Attach a house and select an active team before installing a helper.',
      };
    }
    const officeList = Array.isArray(offices) ? offices : [];
    const staffList = Array.isArray(staffAgents) ? staffAgents : [];
    const preferredOfficeId = normalizedRequestedOfficeId
      || String(packageInfo?.recommendedOfficeId || '').trim();
    const targetOffice = officeList.find((entry) => String(entry?.officeId || '').trim() === preferredOfficeId)
      || officeList.find((entry) => String(entry?.officeId || '').trim() === String(packageInfo?.recommendedOfficeId || '').trim())
      || officeList[0]
      || null;
    if (!targetOffice) {
      return {
        ok: false,
        status: 409,
        code: 'HOUSE_OFFICE_REQUIRED',
        message: 'No House Office areas are available yet for helper installs.',
      };
    }
    const officeId = String(targetOffice?.officeId || '').trim();
    const preferredStaff = staffList.find((entry) => String(entry?.officeId || '').trim() === officeId) || staffList[0] || null;
    if (!preferredStaff) {
      return {
        ok: false,
        status: 409,
        code: 'HOUSE_STAFF_REQUIRED',
        message: 'No House staff member is available yet for that office.',
      };
    }
    return {
      ok: true,
      office: targetOffice,
      staffAgent: preferredStaff,
    };
  }

  function buildHouseWorkerPortableSharePayload({
    deployment = null,
    packageInfo = null,
  } = {}) {
    const sourceDeployment = deployment && typeof deployment === 'object' ? deployment : {};
    const sourcePackage = packageInfo && typeof packageInfo === 'object' ? packageInfo : {};
    return {
      schema: 'agent-town-house-worker-share/v1',
      registryEntityId: String(sourceDeployment?.registryEntityId || sourcePackage?.registryEntityId || '').trim(),
      entityVersionId: String(sourceDeployment?.entityVersionId || sourcePackage?.entityVersionId || '').trim(),
      loadoutId: String(sourceDeployment?.loadoutId || sourcePackage?.loadoutId || '').trim() || null,
      bundleHash: String(sourceDeployment?.bundleHash || sourcePackage?.bundleHash || '').trim() || null,
      displayName: String(sourceDeployment?.displayName || sourcePackage?.defaultDisplayName || sourcePackage?.displayName || '').trim(),
      oneLineBenefit: String(sourceDeployment?.summary?.oneLineBenefit || sourcePackage?.oneLineBenefit || '').trim(),
      whatItDoes: String(sourceDeployment?.summary?.whatItDoes || sourcePackage?.whatItDoes || '').trim(),
      bestFor: Array.isArray(sourceDeployment?.summary?.bestFor)
        ? sourceDeployment.summary.bestFor
        : (Array.isArray(sourcePackage?.bestFor) ? sourcePackage.bestFor : []),
      recommendedOfficeId: String(sourceDeployment?.summary?.recommendedOfficeId || sourcePackage?.recommendedOfficeId || '').trim() || null,
      recommendedOfficeLabel: String(sourceDeployment?.summary?.recommendedOfficeLabel || sourcePackage?.recommendedOfficeLabel || '').trim() || null,
      supportedSurfaces: Array.isArray(sourceDeployment?.summary?.supportedSurfaces)
        ? sourceDeployment.summary.supportedSurfaces
        : (Array.isArray(sourcePackage?.supportedSurfaces) ? sourcePackage.supportedSurfaces : []),
      requiresLocalBrain: sourceDeployment?.summary?.requiresLocalBrain === true || sourcePackage?.requiresLocalBrain === true,
      delegationAllowed: sourceDeployment?.runtimeDefaults?.delegationAllowed === true || sourcePackage?.delegationAllowed === true,
      runtimeDefaults: {
        brainProfileId: String(sourceDeployment?.runtimeDefaults?.brainProfileId || sourcePackage?.runtimeDefaults?.brainProfileId || '').trim() || null,
        workspaceSeedRef: String(sourceDeployment?.runtimeDefaults?.workspaceSeedRef || sourcePackage?.runtimeDefaults?.workspaceSeedRef || '').trim() || null,
        configVersionId: String(sourceDeployment?.runtimeDefaults?.configVersionId || sourcePackage?.runtimeDefaults?.configVersionId || '').trim() || null,
        loadoutId: String(sourceDeployment?.runtimeDefaults?.loadoutId || sourcePackage?.runtimeDefaults?.loadoutId || sourceDeployment?.loadoutId || sourcePackage?.loadoutId || '').trim() || null,
        delegationAllowed: sourceDeployment?.runtimeDefaults?.delegationAllowed === true || sourcePackage?.runtimeDefaults?.delegationAllowed === true,
      },
    };
  }

  function buildHouseWorkerDeploymentCards({
    houseId = '',
    teamId = '',
    offices = [],
    staffAgents = [],
  } = {}) {
    const officeMap = new Map(
      (Array.isArray(offices) ? offices : [])
        .map((entry) => [String(entry?.officeId || '').trim(), entry])
        .filter(([officeId]) => officeId)
    );
    const staffMap = new Map(
      (Array.isArray(staffAgents) ? staffAgents : [])
        .map((entry) => [String(entry?.staffAgentId || '').trim(), entry])
        .filter(([staffAgentId]) => staffAgentId)
    );
    return listHouseWorkerDeployments({ houseId, teamId })
      .map((deployment) => {
        const office = officeMap.get(String(deployment?.officeId || '').trim()) || null;
        const staffAgent = staffMap.get(String(deployment?.staffAgentId || '').trim()) || null;
        const summary = deployment?.summary && typeof deployment.summary === 'object'
          ? deployment.summary
          : {};
        const runtimeDefaults = deployment?.runtimeDefaults && typeof deployment.runtimeDefaults === 'object'
          ? deployment.runtimeDefaults
          : {};
        return {
          deploymentId: String(deployment?.deploymentId || '').trim(),
          houseId: String(deployment?.houseId || '').trim(),
          teamId: String(deployment?.teamId || '').trim(),
          officeId: String(deployment?.officeId || '').trim(),
          officeLabel: String(office?.displayName || summary?.recommendedOfficeLabel || deployment?.officeId || '').trim(),
          staffAgentId: String(deployment?.staffAgentId || '').trim(),
          staffAgentLabel: String(staffAgent?.displayName || deployment?.staffAgentId || '').trim(),
          registryEntityId: String(deployment?.registryEntityId || '').trim(),
          entityVersionId: String(deployment?.entityVersionId || '').trim(),
          loadoutId: String(deployment?.loadoutId || '').trim() || null,
          bundleHash: String(deployment?.bundleHash || '').trim() || null,
          displayName: String(deployment?.displayName || '').trim(),
          status: String(deployment?.status || '').trim(),
          statusLabel: buildHouseWorkerStatusExplanation(summary, deployment?.status),
          oneLineBenefit: String(summary?.oneLineBenefit || '').trim(),
          whatItDoes: String(summary?.whatItDoes || '').trim(),
          bestFor: Array.isArray(summary?.bestFor) ? summary.bestFor : [],
          supportedSurfaces: Array.isArray(summary?.supportedSurfaces) ? summary.supportedSurfaces : [],
          requiresLocalBrain: summary?.requiresLocalBrain === true,
          delegationAllowed: runtimeDefaults?.delegationAllowed === true,
          runtimeDefaults: {
            brainProfileId: String(runtimeDefaults?.brainProfileId || '').trim() || null,
            workspaceSeedRef: String(runtimeDefaults?.workspaceSeedRef || '').trim() || null,
            configVersionId: String(runtimeDefaults?.configVersionId || '').trim() || null,
            loadoutId: String(runtimeDefaults?.loadoutId || deployment?.loadoutId || '').trim() || null,
            delegationAllowed: runtimeDefaults?.delegationAllowed === true,
          },
          shareable: true,
          createdAt: String(deployment?.createdAt || '').trim(),
          updatedAt: String(deployment?.updatedAt || '').trim(),
        };
      })
      .filter((deployment) => deployment.deploymentId && deployment.displayName);
  }

  function normalizeHouseWorkerDisplayName(value, fallback = '') {
    const normalizedValue = String(value || '').trim();
    const normalizedFallback = String(fallback || '').trim();
    const candidate = normalizedValue || normalizedFallback;
    if (!candidate) return '';
    if (candidate.length > 80) return '';
    if (houseOfficeTextHasForbiddenMarker(candidate)) return '';
    return candidate;
  }

  function buildHouseWorkerSharePath(shareId = '') {
    const normalizedShareId = String(shareId || '').trim();
    if (!normalizedShareId) return '/registry.html?family=workers';
    return `/registry.html?workerShare=${encodeURIComponent(normalizedShareId)}`;
  }

  function buildHouseWorkerShareResponse(share = null) {
    const payload = share?.payload && typeof share.payload === 'object' ? share.payload : {};
    const shareId = String(share?.shareId || '').trim();
    return {
      shareId: shareId || null,
      sharePath: buildHouseWorkerSharePath(shareId),
      portable: payload,
      installActionLabel: 'Install to My House',
      summary: String(payload?.oneLineBenefit || '').trim()
        || 'Install this helper into another House without copying secrets.',
      secretBoundarySummary: 'Local brain setup stays local. Portable worker links do not carry live credentials, callbacks, or house session secrets.',
    };
  }

  function buildHouseWorkerDeploymentsPayload({
    context = {},
    houseId = '',
    teamId = '',
    sourceKind = 'durable_house_deployments',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    const structure = buildHouseOfficeStructurePayload({
      context,
      houseId: normalizedHouseId,
      teamId: normalizedTeamId,
    });
    const offices = Array.isArray(structure?.offices) ? structure.offices : [];
    const staffAgents = Array.isArray(structure?.staffAgents) ? structure.staffAgents : [];
    const deployments = normalizedHouseId && normalizedTeamId
      ? buildHouseWorkerDeploymentCards({
        houseId: normalizedHouseId,
        teamId: normalizedTeamId,
        offices,
        staffAgents,
      })
      : [];
    return {
      houseId: normalizedHouseId || null,
      teamId: normalizedTeamId || null,
      activeTeamId: context.activeTeamId,
      availableTeamIds: context.availableTeamIds,
      deployments,
      sourceManifest: {
        schema: 'agent-town-house-worker-deployments/v1',
        sourceKind: String(sourceKind || 'durable_house_deployments').trim() || 'durable_house_deployments',
        routes: [
          '/api/platform/house-workers/deployments',
          '/api/platform/house-workers/install',
          '/api/platform/house-workers/share',
          '/api/platform/house-workers/install-shared',
        ],
        fixtures: [
          'worker_package_registry_seed',
          'worker_package_install_seed',
          'worker_package_share_seed',
        ],
        counts: {
          deploymentCount: deployments.length,
        },
      },
      emptyStateText: normalizedHouseId && normalizedTeamId
        ? 'No installed helpers are available for this team yet.'
        : 'Attach a house and choose an active team to inspect installed helpers.',
    };
  }

  function buildHouseOfficeSelection({
    sourceKind = '',
    sourceId = '',
    entryPath = '',
    runId = '',
    traceId = '',
    trainerJobId = '',
    trackId = '',
    experienceId = '',
  } = {}) {
    const normalizedSourceKind = String(sourceKind || '').trim();
    const normalizedSourceId = String(sourceId || '').trim();
    const normalizedEntryPath = String(entryPath || '').trim();
    const normalizedRunId = String(runId || '').trim();
    const normalizedTraceId = String(traceId || '').trim();
    const normalizedTrainerJobId = String(trainerJobId || '').trim();
    const normalizedTrackId = String(trackId || '').trim();
    const normalizedExperienceId = String(experienceId || '').trim();
    if ((normalizedEntryPath === '/api/platform/archive' || normalizedSourceKind === 'run') && normalizedTraceId) {
      return {
        kind: 'trace',
        traceId: normalizedTraceId,
        runId: normalizedRunId || null,
      };
    }
    if (normalizedSourceKind === 'trainer_result' && normalizedSourceId) {
      return {
        kind: 'trainer_result',
        trainerResultId: normalizedSourceId,
        trainerJobId: normalizedTrainerJobId || null,
      };
    }
    if (normalizedSourceKind === 'trainer_job' && normalizedSourceId) {
      return {
        kind: 'trainer_job',
        trainerJobId: normalizedSourceId,
      };
    }
    if (normalizedSourceKind === 'team_config_binding' && normalizedSourceId) {
      return {
        kind: 'team_binding',
        teamBindingId: normalizedSourceId,
      };
    }
    if (normalizedSourceKind === 'config_version' && normalizedSourceId) {
      return {
        kind: 'config_version',
        configVersionId: normalizedSourceId,
      };
    }
    if (normalizedSourceKind === 'track_progress_event' && normalizedSourceId) {
      return {
        kind: 'track_event',
        trackProgressEventId: normalizedSourceId,
        trackId: normalizedTrackId || null,
      };
    }
    if (normalizedSourceKind === 'experience' && normalizedSourceId) {
      return {
        kind: 'experience',
        experienceId: normalizedSourceId,
      };
    }
    if (normalizedSourceKind === 'run' && normalizedSourceId) {
      return {
        kind: 'run',
        runId: normalizedSourceId,
        experienceId: normalizedExperienceId || null,
      };
    }
    return null;
  }

  function buildHouseOfficeSourceRef({
    sourceKind = '',
    sourceId = '',
    entryPath = '',
    selection = null,
  } = {}) {
    const normalizedSourceKind = String(sourceKind || '').trim();
    const normalizedSourceId = String(sourceId || '').trim();
    const normalizedEntryPath = String(entryPath || '').trim();
    if (!normalizedSourceKind || !normalizedSourceId || !normalizedEntryPath) return null;
    const sourceRef = {
      sourceKind: normalizedSourceKind,
      sourceId: normalizedSourceId,
      entryPath: normalizedEntryPath,
    };
    if (selection && typeof selection === 'object') {
      sourceRef.selection = selection;
    }
    return sourceRef;
  }

  function buildHouseOfficeDeepLinkWithSelection(deepLink, selection = null) {
    if (!deepLink || typeof deepLink !== 'object') return deepLink;
    if (!selection || typeof selection !== 'object') return deepLink;
    return {
      ...deepLink,
      selection,
    };
  }

  function buildHouseOfficeAssignmentEntryPath({
    sourceKind = '',
    office = null,
  } = {}) {
    const normalizedSourceKind = String(sourceKind || '').trim();
    if (normalizedSourceKind === 'trainer_job' || normalizedSourceKind === 'trainer_result') {
      return '/api/platform/trainer';
    }
    if (normalizedSourceKind === 'team_config_binding' || normalizedSourceKind === 'config_version') {
      return '/api/platform/workshop';
    }
    if (normalizedSourceKind === 'track_progress_event') {
      return '/api/platform/tracks';
    }
    if (normalizedSourceKind === 'experience') {
      return '/api/platform/experiences';
    }
    if (normalizedSourceKind === 'run') {
      return String(office?.surface || '').trim() === 'experiences'
        ? '/api/platform/experiences'
        : '/api/platform/archive';
    }
    const officeSurface = String(office?.surface || '').trim();
    if (officeSurface === 'trainer') return '/api/platform/trainer';
    if (officeSurface === 'workshop') return '/api/platform/workshop';
    if (officeSurface === 'tracks') return '/api/platform/tracks';
    if (officeSurface === 'archive') return '/api/platform/archive';
    if (officeSurface === 'experiences') return '/api/platform/experiences';
    return '/api/platform/house-office';
  }

  function buildHouseOfficeAssignmentDeepLink({
    sourceKind = '',
    office = null,
    deeplinks = {},
    selection = null,
  } = {}) {
    const normalizedSourceKind = String(sourceKind || '').trim();
    if (normalizedSourceKind === 'trainer_job' || normalizedSourceKind === 'trainer_result') {
      return buildHouseOfficeDeepLinkWithSelection(deeplinks.trainer || deeplinks.office, selection);
    }
    if (normalizedSourceKind === 'team_config_binding' || normalizedSourceKind === 'config_version') {
      return buildHouseOfficeDeepLinkWithSelection(deeplinks.workshop || deeplinks.office, selection);
    }
    if (normalizedSourceKind === 'track_progress_event') {
      return buildHouseOfficeDeepLinkWithSelection(deeplinks.tracks || deeplinks.office, selection);
    }
    if (normalizedSourceKind === 'experience') {
      return buildHouseOfficeDeepLinkWithSelection(deeplinks.experiences || deeplinks.office, selection);
    }
    if (normalizedSourceKind === 'run') {
      return buildHouseOfficeDeepLinkWithSelection(
        String(office?.surface || '').trim() === 'experiences'
          ? (deeplinks.experiences || deeplinks.office)
          : (deeplinks.archive || deeplinks.office),
        selection
      );
    }
    const officeSurface = String(office?.surface || '').trim();
    return buildHouseOfficeDeepLinkWithSelection(deeplinks[officeSurface] || office?.deepLink || deeplinks.office, selection);
  }

  function resolveHouseOfficeAssignmentSource({
    houseId = '',
    teamId = '',
    sourceKind = '',
    sourceId = '',
    office = null,
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    const normalizedSourceKind = String(sourceKind || '').trim();
    const normalizedSourceId = String(sourceId || '').trim();
    if (!normalizedSourceKind) {
      return {
        ok: false,
        status: 400,
        code: 'SOURCE_REF_KIND_UNSUPPORTED',
        message: 'sourceKind must be one of the supported House Office source kinds.',
      };
    }
    if (!normalizedSourceId) {
      return {
        ok: false,
        status: 404,
        code: 'SOURCE_REF_NOT_FOUND',
        message: 'House Office could not resolve that source record.',
      };
    }

    const buildResolved = (entryPath, selection) => ({
      ok: true,
      entryPath,
      selection,
      sourceRef: buildHouseOfficeSourceRef({
        sourceKind: normalizedSourceKind,
        sourceId: normalizedSourceId,
        entryPath,
        selection,
      }),
    });

    if (normalizedSourceKind === 'trainer_result') {
      const currentTeamResults = listTrainerResults({ houseId: normalizedHouseId, teamId: normalizedTeamId });
      const matchedCurrent = currentTeamResults.find((entry) => String(entry?.trainerResultId || '').trim() === normalizedSourceId) || null;
      if (matchedCurrent) {
        return buildResolved('/api/platform/trainer', buildHouseOfficeSelection({
          sourceKind: normalizedSourceKind,
          sourceId: normalizedSourceId,
          entryPath: '/api/platform/trainer',
          trainerJobId: String(matchedCurrent?.trainerJobId || '').trim(),
        }));
      }
      const inHouse = listTrainerResults({ houseId: normalizedHouseId }).some((entry) => String(entry?.trainerResultId || '').trim() === normalizedSourceId);
      return inHouse
        ? {
          ok: false,
          status: 409,
          code: 'SOURCE_REF_SCOPE_MISMATCH',
          message: 'The requested source record exists, but it is outside the active team scope.',
        }
        : {
          ok: false,
          status: 404,
          code: 'SOURCE_REF_NOT_FOUND',
          message: 'House Office could not resolve that trainer result.',
        };
    }

    if (normalizedSourceKind === 'trainer_job') {
      const currentTeamJobs = listTrainerJobs({ houseId: normalizedHouseId, teamId: normalizedTeamId });
      const matchedCurrent = currentTeamJobs.find((entry) => String(entry?.trainerJobId || '').trim() === normalizedSourceId) || null;
      if (matchedCurrent) {
        return buildResolved('/api/platform/trainer', buildHouseOfficeSelection({
          sourceKind: normalizedSourceKind,
          sourceId: normalizedSourceId,
          entryPath: '/api/platform/trainer',
        }));
      }
      const inHouse = listTrainerJobs({ houseId: normalizedHouseId }).some((entry) => String(entry?.trainerJobId || '').trim() === normalizedSourceId);
      return inHouse
        ? {
          ok: false,
          status: 409,
          code: 'SOURCE_REF_SCOPE_MISMATCH',
          message: 'The requested source record exists, but it is outside the active team scope.',
        }
        : {
          ok: false,
          status: 404,
          code: 'SOURCE_REF_NOT_FOUND',
          message: 'House Office could not resolve that trainer job.',
        };
    }

    if (normalizedSourceKind === 'team_config_binding') {
      const currentBinding = listTeamConfigBindings({ houseId: normalizedHouseId, teamId: normalizedTeamId })
        .find((entry) => String(entry?.teamBindingId || '').trim() === normalizedSourceId) || null;
      if (currentBinding) {
        return buildResolved('/api/platform/workshop', buildHouseOfficeSelection({
          sourceKind: normalizedSourceKind,
          sourceId: normalizedSourceId,
          entryPath: '/api/platform/workshop',
        }));
      }
      const inHouse = listTeamConfigBindings({ houseId: normalizedHouseId }).some((entry) => String(entry?.teamBindingId || '').trim() === normalizedSourceId);
      return inHouse
        ? {
          ok: false,
          status: 409,
          code: 'SOURCE_REF_SCOPE_MISMATCH',
          message: 'The requested source record exists, but it is outside the active team scope.',
        }
        : {
          ok: false,
          status: 404,
          code: 'SOURCE_REF_NOT_FOUND',
          message: 'House Office could not resolve that team binding.',
        };
    }

    if (normalizedSourceKind === 'config_version') {
      const configVersion = getConfigVersion(normalizedSourceId);
      if (!configVersion) {
        return {
          ok: false,
          status: 404,
          code: 'SOURCE_REF_NOT_FOUND',
          message: 'House Office could not resolve that config version.',
        };
      }
      if (String(configVersion?.houseId || '').trim() !== normalizedHouseId || String(configVersion?.teamId || '').trim() !== normalizedTeamId) {
        return {
          ok: false,
          status: 409,
          code: 'SOURCE_REF_SCOPE_MISMATCH',
          message: 'The requested source record exists, but it is outside the active team scope.',
        };
      }
      return buildResolved('/api/platform/workshop', buildHouseOfficeSelection({
        sourceKind: normalizedSourceKind,
        sourceId: normalizedSourceId,
        entryPath: '/api/platform/workshop',
      }));
    }

    if (normalizedSourceKind === 'track_progress_event') {
      const currentEvents = listTrackProgressEvents({ houseId: normalizedHouseId, teamId: normalizedTeamId });
      const matchedCurrent = currentEvents.find((entry) => String(entry?.trackProgressEventId || '').trim() === normalizedSourceId) || null;
      if (matchedCurrent) {
        return buildResolved('/api/platform/tracks', buildHouseOfficeSelection({
          sourceKind: normalizedSourceKind,
          sourceId: normalizedSourceId,
          entryPath: '/api/platform/tracks',
          trackId: String(matchedCurrent?.trackId || '').trim(),
        }));
      }
      const inHouse = listTrackProgressEvents({ houseId: normalizedHouseId }).some((entry) => String(entry?.trackProgressEventId || '').trim() === normalizedSourceId);
      return inHouse
        ? {
          ok: false,
          status: 409,
          code: 'SOURCE_REF_SCOPE_MISMATCH',
          message: 'The requested source record exists, but it is outside the active team scope.',
        }
        : {
          ok: false,
          status: 404,
          code: 'SOURCE_REF_NOT_FOUND',
          message: 'House Office could not resolve that track progress event.',
        };
    }

    if (normalizedSourceKind === 'run') {
      const currentRuns = listRuns({ houseId: normalizedHouseId, teamId: normalizedTeamId });
      const matchedCurrent = currentRuns.find((entry) => String(entry?.runId || '').trim() === normalizedSourceId) || null;
      if (matchedCurrent) {
        const entryPath = buildHouseOfficeAssignmentEntryPath({
          sourceKind: normalizedSourceKind,
          office,
        });
        return buildResolved(entryPath, buildHouseOfficeSelection({
          sourceKind: normalizedSourceKind,
          sourceId: normalizedSourceId,
          entryPath,
          runId: normalizedSourceId,
          traceId: String(matchedCurrent?.traceId || '').trim(),
          experienceId: String(matchedCurrent?.experienceId || '').trim(),
        }));
      }
      const inHouse = listRuns({ houseId: normalizedHouseId }).some((entry) => String(entry?.runId || '').trim() === normalizedSourceId);
      return inHouse
        ? {
          ok: false,
          status: 409,
          code: 'SOURCE_REF_SCOPE_MISMATCH',
          message: 'The requested source record exists, but it is outside the active team scope.',
        }
        : {
          ok: false,
          status: 404,
          code: 'SOURCE_REF_NOT_FOUND',
          message: 'House Office could not resolve that run.',
        };
    }

    if (normalizedSourceKind === 'experience') {
      const matchedExperience = buildHouseExperienceItems().find((entry) => String(entry?.experienceId || '').trim() === normalizedSourceId) || null;
      if (!matchedExperience) {
        return {
          ok: false,
          status: 404,
          code: 'SOURCE_REF_NOT_FOUND',
          message: 'House Office could not resolve that experience.',
        };
      }
      return buildResolved('/api/platform/experiences', buildHouseOfficeSelection({
        sourceKind: normalizedSourceKind,
        sourceId: normalizedSourceId,
        entryPath: '/api/platform/experiences',
      }));
    }

    return {
      ok: false,
      status: 400,
      code: 'SOURCE_REF_KIND_UNSUPPORTED',
      message: 'sourceKind must be one of the supported House Office source kinds.',
    };
  }

  function buildHouseOfficeAssignments({
    houseId = '',
    teamId = '',
    offices = [],
    staffAgents = [],
    deeplinks = {},
  } = {}) {
    if (!houseId || !teamId) return [];
    const officeList = Array.isArray(offices) ? offices : [];
    const staffList = Array.isArray(staffAgents) ? staffAgents : [];
    const officesById = new Map(
      officeList
        .map((office) => [String(office?.officeId || '').trim(), office])
        .filter(([officeId]) => officeId)
    );
    const staffById = new Map(
      staffList
        .map((staffAgent) => [String(staffAgent?.staffAgentId || '').trim(), staffAgent])
        .filter(([staffAgentId]) => staffAgentId)
    );
    return listHouseStaffAssignments({ houseId, teamId })
      .map((assignment) => {
        const officeId = String(assignment?.officeId || '').trim();
        const staffAgentId = String(assignment?.staffAgentId || '').trim();
        const office = officesById.get(officeId) || null;
        const staffAgent = staffById.get(staffAgentId) || null;
        if (!office || !staffAgent) return null;
        const sourceKind = String(assignment?.sourceKind || '').trim();
        const sourceId = String(assignment?.sourceId || '').trim();
        const sourceRefEntryPath = String(assignment?.sourceRef?.entryPath || '').trim();
        const entryPath = sourceRefEntryPath || buildHouseOfficeAssignmentEntryPath({
          sourceKind: assignment?.sourceKind,
          office,
        });
        const selection = assignment?.sourceRef?.selection && typeof assignment.sourceRef.selection === 'object'
          ? assignment.sourceRef.selection
          : buildHouseOfficeSelection({
            sourceKind,
            sourceId,
            entryPath,
          });
        return {
          assignmentId: String(assignment?.assignmentId || '').trim(),
          staffAgentId,
          officeId,
          focus: sanitizeHouseOfficeText(assignment?.focus, 'Sensitive assignment details redacted'),
          sourceKind,
          sourceId,
          startedAt: String(assignment?.startedAt || '').trim(),
          deepLink: buildHouseOfficeAssignmentDeepLink({
            sourceKind: assignment?.sourceKind,
            office,
            deeplinks,
            selection,
          }),
          sourceRefs: [
            buildHouseOfficeSourceRef({
              sourceKind,
              sourceId,
              entryPath,
              selection,
            }),
          ].filter(Boolean),
        };
      })
      .filter((assignment) => {
        return assignment
          && assignment.assignmentId
          && assignment.staffAgentId
          && assignment.officeId
          && assignment.focus
          && assignment.sourceKind
          && assignment.sourceId
          && assignment.startedAt;
      })
      .sort((left, right) => {
        const leftOrder = Number(officesById.get(left.officeId)?.order || 0);
        const rightOrder = Number(officesById.get(right.officeId)?.order || 0);
        const officeOrderDelta = leftOrder - rightOrder;
        if (officeOrderDelta !== 0) return officeOrderDelta;
        const startedAtDelta = parseHouseOfficeActivityTime(String(right.startedAt || ''))
          - parseHouseOfficeActivityTime(String(left.startedAt || ''));
        if (startedAtDelta !== 0) return startedAtDelta;
        return String(left.assignmentId || '').localeCompare(String(right.assignmentId || ''));
      });
  }

  function parseHouseOfficeActivityTime(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return 0;
    const parsed = Date.parse(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function buildHouseOfficePresence({
    offices = [],
    deeplinks = {},
    binding = null,
    trainerJobs = [],
    trainerResults = [],
    archiveRuns = [],
    trackPayload = null,
  } = {}) {
    const presenceFixture = getUnifiedPlatformTestFixture('house_office_presence_seed') || {};
    const allowedStatuses = new Set(
      (Array.isArray(presenceFixture?.allowedStatuses) ? presenceFixture.allowedStatuses : [])
        .map((entry) => String(entry || '').trim())
        .filter(Boolean)
    );
    const officeList = Array.isArray(offices) ? offices : [];
    const runs = Array.isArray(archiveRuns) ? archiveRuns : [];
    const jobs = Array.isArray(trainerJobs) ? trainerJobs : [];
    const results = Array.isArray(trainerResults) ? trainerResults : [];
    const trackEvents = Array.isArray(trackPayload?.events) ? trackPayload.events : [];
    const latestTrainerResult = results[0] || null;
    const latestTrainerJob = jobs[0] || null;
    const latestArchiveRun = runs[0] || null;
    const latestOpsTrackEvent = [...trackEvents].reverse().find((event) => {
      const trackId = String(event?.trackId || '').trim();
      return trackId === 'track_poker_mastery' || trackId === 'track_web_ops';
    }) || null;
    const latestOpsRun = runs.find((run) => {
      const experienceId = String(run?.experienceId || '').trim();
      return experienceId === 'poker.season' || experienceId === 'web.agent';
    }) || null;

    const presenceItems = officeList.map((office) => {
      const officeId = String(office?.officeId || '').trim();
      const officeLabel = String(office?.displayName || office?.slug || officeId).trim() || officeId;
      const officeSurface = String(office?.surface || '').trim();
      if (!officeId) return null;

      if (officeSurface === 'workshop' && binding?.activeConfigVersionId) {
        return {
          officeId,
          officeLabel,
          focus: sanitizeHouseOfficeText(`Config ${String(binding.activeConfigVersionId || '').trim()}`, 'Sensitive activity redacted'),
          status: allowedStatuses.has('building') ? 'building' : 'idle',
          lastActivityAt: String(binding.updatedAt || binding.createdAt || '').trim() || null,
          deepLink: deeplinks.workshop || deeplinks.office,
          sourceRefs: [
            {
              sourceKind: 'team_config_binding',
              sourceId: String(binding.teamBindingId || '').trim(),
              entryPath: '/api/platform/workshop',
            },
          ],
        };
      }

      if (officeSurface === 'trainer') {
        if (latestTrainerResult?.approvalNeeded === true) {
          return {
            officeId,
            officeLabel,
            focus: sanitizeHouseOfficeText(`Approval needed for ${String(latestTrainerResult.trainerResultId || '').trim()}`, 'Sensitive activity redacted'),
            status: allowedStatuses.has('alert') ? 'alert' : 'idle',
            lastActivityAt: String(latestTrainerResult.updatedAt || latestTrainerResult.createdAt || '').trim() || null,
            deepLink: deeplinks.trainer || deeplinks.office,
            sourceRefs: [
              {
                sourceKind: 'trainer_result',
                sourceId: String(latestTrainerResult.trainerResultId || '').trim(),
                entryPath: '/api/platform/trainer',
              },
              {
                sourceKind: 'trainer_job',
                sourceId: String(latestTrainerResult.trainerJobId || latestTrainerJob?.trainerJobId || '').trim(),
                entryPath: '/api/platform/trainer',
              },
            ].filter((entry) => entry.sourceId),
          };
        }
        if (latestTrainerResult || latestTrainerJob) {
          const trainerResultId = String(latestTrainerResult?.trainerResultId || '').trim();
          const trainerJobId = String(latestTrainerJob?.trainerJobId || latestTrainerResult?.trainerJobId || '').trim();
          return {
            officeId,
            officeLabel,
            focus: sanitizeHouseOfficeText(
              trainerResultId ? `Review ${trainerResultId}` : `Evaluate ${trainerJobId}`,
              'Sensitive activity redacted'
            ),
            status: allowedStatuses.has('evaluating') ? 'evaluating' : 'idle',
            lastActivityAt: String(
              latestTrainerResult?.updatedAt
              || latestTrainerResult?.createdAt
              || latestTrainerJob?.updatedAt
              || latestTrainerJob?.createdAt
              || ''
            ).trim() || null,
            deepLink: deeplinks.trainer || deeplinks.office,
            sourceRefs: [
              trainerResultId
                ? {
                  sourceKind: 'trainer_result',
                  sourceId: trainerResultId,
                  entryPath: '/api/platform/trainer',
                }
                : null,
              trainerJobId
                ? {
                  sourceKind: 'trainer_job',
                  sourceId: trainerJobId,
                  entryPath: '/api/platform/trainer',
                }
                : null,
            ].filter(Boolean),
          };
        }
        return null;
      }

      if (officeSurface === 'archive' && latestArchiveRun?.runId) {
        return {
          officeId,
          officeLabel,
          focus: sanitizeHouseOfficeText(`Run ${String(latestArchiveRun.runId || '').trim()}`, 'Sensitive activity redacted'),
          status: allowedStatuses.has('researching') ? 'researching' : 'idle',
          lastActivityAt: String(
            latestArchiveRun.completedAt
            || latestArchiveRun.updatedAt
            || latestArchiveRun.createdAt
            || ''
          ).trim() || null,
          deepLink: deeplinks.archive || deeplinks.office,
          sourceRefs: [
            {
              sourceKind: 'run',
              sourceId: String(latestArchiveRun.runId || '').trim(),
              entryPath: '/api/platform/archive',
            },
          ],
        };
      }

      if (officeSurface === 'experiences') {
        const trackId = String(latestOpsTrackEvent?.trackId || '').trim();
        const runExperienceId = String(latestOpsRun?.experienceId || '').trim();
        if (trackId === 'track_poker_mastery' || runExperienceId === 'poker.season') {
          return {
            officeId,
            officeLabel,
            focus: sanitizeHouseOfficeText('Poker Mastery progress', 'Sensitive activity redacted'),
            status: allowedStatuses.has('competing') ? 'competing' : 'idle',
            lastActivityAt: String(
              latestOpsTrackEvent?.createdAt
              || latestOpsRun?.updatedAt
              || latestOpsRun?.createdAt
              || ''
            ).trim() || null,
            deepLink: deeplinks.experiences || deeplinks.office,
            sourceRefs: [
              latestOpsTrackEvent
                ? {
                  sourceKind: 'track_progress_event',
                  sourceId: String(latestOpsTrackEvent.trackProgressEventId || '').trim(),
                  entryPath: '/api/platform/tracks',
                }
                : null,
              latestOpsRun
                ? {
                  sourceKind: 'run',
                  sourceId: String(latestOpsRun.runId || '').trim(),
                  entryPath: '/api/platform/experiences',
                }
                : null,
            ].filter(Boolean),
          };
        }
        if (trackId === 'track_web_ops' || runExperienceId === 'web.agent') {
          return {
            officeId,
            officeLabel,
            focus: sanitizeHouseOfficeText('Web Ops progress', 'Sensitive activity redacted'),
            status: allowedStatuses.has('researching') ? 'researching' : 'idle',
            lastActivityAt: String(
              latestOpsTrackEvent?.createdAt
              || latestOpsRun?.updatedAt
              || latestOpsRun?.createdAt
              || ''
            ).trim() || null,
            deepLink: deeplinks.experiences || deeplinks.office,
            sourceRefs: [
              latestOpsTrackEvent
                ? {
                  sourceKind: 'track_progress_event',
                  sourceId: String(latestOpsTrackEvent.trackProgressEventId || '').trim(),
                  entryPath: '/api/platform/tracks',
                }
                : null,
              latestOpsRun
                ? {
                  sourceKind: 'run',
                  sourceId: String(latestOpsRun.runId || '').trim(),
                  entryPath: '/api/platform/experiences',
                }
                : null,
            ].filter(Boolean),
          };
        }
      }

      return null;
    }).filter((item) => {
      return item
        && String(item.officeId || '').trim()
        && String(item.focus || '').trim()
        && String(item.status || '').trim()
        && Array.isArray(item.sourceRefs)
        && item.sourceRefs.length > 0;
    });

    return presenceItems.sort((left, right) => {
      const leftOfficeOrder = Number(officeList.find((office) => office.officeId === left.officeId)?.order || 0);
      const rightOfficeOrder = Number(officeList.find((office) => office.officeId === right.officeId)?.order || 0);
      const officeOrderDelta = leftOfficeOrder - rightOfficeOrder;
      if (officeOrderDelta !== 0) return officeOrderDelta;
      const lastActivityDelta = parseHouseOfficeActivityTime(String(right.lastActivityAt || '')) - parseHouseOfficeActivityTime(String(left.lastActivityAt || ''));
      if (lastActivityDelta !== 0) return lastActivityDelta;
      return String(left.officeId || '').localeCompare(String(right.officeId || ''));
    });
  }

  function countHouseOfficeBriefingItems(groups = []) {
    return (Array.isArray(groups) ? groups : []).reduce((sum, group) => {
      const items = Array.isArray(group?.items) ? group.items : [];
      return sum + items.length;
    }, 0);
  }

  function resolveValidatedHouseReadTeam({
    context = {},
    requestedTeamId = '',
  } = {}) {
    const normalizedRequestedTeamId = String(requestedTeamId || '').trim();
    const activeTeamId = typeof context?.activeTeamId === 'string' ? context.activeTeamId.trim() : '';
    const availableTeamIds = Array.isArray(context?.availableTeamIds) ? context.availableTeamIds : [];
    if (!normalizedRequestedTeamId) {
      return {
        ok: true,
        teamId: activeTeamId,
      };
    }
    if (!availableTeamIds.includes(normalizedRequestedTeamId)) {
      return {
        ok: false,
        status: 404,
        code: 'TEAM_NOT_FOUND',
        message: 'The requested team is not available for this house.',
        details: {
          availableTeamIds,
        },
      };
    }
    return {
      ok: true,
      teamId: normalizedRequestedTeamId,
    };
  }

  function isHouseOfficeOpsExperienceId(experienceId = '') {
    const normalizedExperienceId = String(experienceId || '').trim().toLowerCase();
    if (!normalizedExperienceId) return false;
    return normalizedExperienceId === 'web'
      || normalizedExperienceId === 'poker'
      || normalizedExperienceId.startsWith('web.')
      || normalizedExperienceId.startsWith('poker.');
  }

  function buildHouseOfficeBriefing({
    binding = null,
    trainerJobs = [],
    trainerResults = [],
    archiveRuns = [],
    trackPayload = null,
    experiences = [],
  } = {}) {
    const fixture = getUnifiedPlatformTestFixture('house_office_briefing_seed') || {};
    const rawWindowHours = Number(fixture?.defaultWindowHours || 24);
    const windowHours = Number.isFinite(rawWindowHours) && rawWindowHours > 0 ? rawWindowHours : 24;
    const groupOrder = Array.isArray(fixture?.groupOrder) && fixture.groupOrder.length
      ? fixture.groupOrder.map((entry) => String(entry || '').trim()).filter(Boolean)
      : ['archive', 'trainer', 'workshop', 'tracks', 'experiences', 'poker_or_web'];
    const groupLabels = {
      archive: 'Archive',
      trainer: 'Trainer',
      workshop: 'Workshop',
      tracks: 'Tracks',
      experiences: 'Experiences',
      poker_or_web: 'Poker / Web',
    };
    const referenceNowMs = parseHouseOfficeActivityTime(nowIso());
    const minimumTimestampMs = Math.max(0, referenceNowMs - (windowHours * 60 * 60 * 1000));
    const groups = new Map(groupOrder.map((family) => [family, []]));
    const trainerJobsById = new Map(
      (Array.isArray(trainerJobs) ? trainerJobs : [])
        .map((job) => [String(job?.trainerJobId || '').trim(), job])
        .filter(([trainerJobId]) => trainerJobId)
    );

    const addBriefingItem = (family, item) => {
      const normalizedFamily = String(family || '').trim();
      if (!groups.has(normalizedFamily)) return;
      const citations = (Array.isArray(item?.citations) ? item.citations : [])
        .map((citation) => buildHouseOfficeSourceRef({
          sourceKind: citation?.sourceKind,
          sourceId: citation?.sourceId,
          entryPath: citation?.entryPath,
          selection: citation?.selection,
        }))
        .filter(Boolean);
      const createdAt = String(item?.createdAt || '').trim();
      if (!createdAt || parseHouseOfficeActivityTime(createdAt) < minimumTimestampMs || !citations.length) {
        return;
      }
      const briefingId = String(item?.briefingId || '').trim();
      const title = sanitizeHouseOfficeText(item?.title, 'Sensitive briefing item');
      const summary = sanitizeHouseOfficeText(item?.summary, 'Sensitive briefing details redacted');
      if (!briefingId || !title || !summary) return;
      groups.get(normalizedFamily).push({
        briefingId,
        family: normalizedFamily,
        title,
        summary,
        createdAt,
        citations,
      });
    };

    (Array.isArray(archiveRuns) ? archiveRuns : []).forEach((run) => {
      const runId = String(run?.runId || '').trim();
      const experienceId = String(run?.experienceId || '').trim() || 'experience';
      if (!runId) return;
      addBriefingItem('archive', {
        briefingId: `archive:${runId}`,
        title: `Archive captured ${experienceId}`,
        summary: `Run ${runId} is recorded with status ${String(run?.status || 'recorded').trim() || 'recorded'}.`,
        createdAt: String(run?.completedAt || run?.updatedAt || run?.createdAt || '').trim(),
        citations: [
          {
            sourceKind: 'run',
            sourceId: runId,
            entryPath: '/api/platform/archive',
            selection: buildHouseOfficeSelection({
              sourceKind: 'run',
              sourceId: runId,
              entryPath: '/api/platform/archive',
              runId,
              traceId: String(run?.traceId || '').trim(),
            }),
          },
        ],
      });
    });

    (Array.isArray(trainerResults) ? trainerResults : []).forEach((result) => {
      const trainerResultId = String(result?.trainerResultId || '').trim();
      const trainerJobId = String(result?.trainerJobId || '').trim();
      if (!trainerResultId) return;
      const trainerJob = trainerJobsById.get(trainerJobId) || null;
      const jobKind = String(trainerJob?.jobKind || 'trainer_job.compare').trim() || 'trainer_job.compare';
      addBriefingItem('trainer', {
        briefingId: `trainer:${trainerResultId}`,
        title: result?.approvalNeeded ? 'Trainer patch approval ready' : 'Trainer result recorded',
        summary: `${jobKind} recorded result ${trainerResultId}.`,
        createdAt: String(result?.updatedAt || result?.createdAt || '').trim(),
        citations: [
          {
            sourceKind: 'trainer_result',
            sourceId: trainerResultId,
            entryPath: '/api/platform/trainer',
            selection: buildHouseOfficeSelection({
              sourceKind: 'trainer_result',
              sourceId: trainerResultId,
              entryPath: '/api/platform/trainer',
              trainerJobId,
            }),
          },
          trainerJobId
            ? {
              sourceKind: 'trainer_job',
              sourceId: trainerJobId,
              entryPath: '/api/platform/trainer',
              selection: buildHouseOfficeSelection({
                sourceKind: 'trainer_job',
                sourceId: trainerJobId,
                entryPath: '/api/platform/trainer',
              }),
            }
            : null,
        ].filter(Boolean),
      });
    });

    if (binding) {
      const teamBindingId = String(binding?.teamBindingId || '').trim();
      const activeConfigVersionId = String(binding?.activeConfigVersionId || '').trim();
      const configVersion = activeConfigVersionId ? getConfigVersion(activeConfigVersionId) : null;
      addBriefingItem('workshop', {
        briefingId: `workshop:${teamBindingId || activeConfigVersionId}`,
        title: 'Workshop active config updated',
        summary: `Team ${String(binding?.teamId || '').trim() || 'team'} now points to ${activeConfigVersionId || 'the active config'}.`,
        createdAt: String(binding?.updatedAt || binding?.createdAt || configVersion?.updatedAt || configVersion?.createdAt || '').trim(),
        citations: [
          teamBindingId
            ? {
              sourceKind: 'team_config_binding',
              sourceId: teamBindingId,
              entryPath: '/api/platform/workshop',
              selection: buildHouseOfficeSelection({
                sourceKind: 'team_config_binding',
                sourceId: teamBindingId,
                entryPath: '/api/platform/workshop',
              }),
            }
            : null,
          activeConfigVersionId
            ? {
              sourceKind: 'config_version',
              sourceId: activeConfigVersionId,
              entryPath: '/api/platform/workshop',
              selection: buildHouseOfficeSelection({
                sourceKind: 'config_version',
                sourceId: activeConfigVersionId,
                entryPath: '/api/platform/workshop',
              }),
            }
            : null,
        ].filter(Boolean),
      });
    }

    const trackEvents = Array.isArray(trackPayload?.events) ? trackPayload.events : [];
    trackEvents.forEach((event) => {
      const trackProgressEventId = String(event?.trackProgressEventId || '').trim();
      const title = String(event?.title || event?.trackId || 'track progress').trim() || 'track progress';
      if (!trackProgressEventId) return;
      addBriefingItem('tracks', {
        briefingId: `tracks:${trackProgressEventId}`,
        title: `${title} updated`,
        summary: `Progress delta ${Number(event?.progressDelta || 0)} was recorded from ${String(event?.sourceKind || 'track').trim() || 'track'}.`,
        createdAt: String(event?.createdAt || '').trim(),
        citations: [
          {
            sourceKind: 'track_progress_event',
            sourceId: trackProgressEventId,
            entryPath: '/api/platform/tracks',
            selection: buildHouseOfficeSelection({
              sourceKind: 'track_progress_event',
              sourceId: trackProgressEventId,
              entryPath: '/api/platform/tracks',
              trackId: String(event?.trackId || '').trim(),
            }),
          },
        ],
      });
    });

    const experienceItemsById = new Map(
      (Array.isArray(experiences) ? experiences : [])
        .map((item) => [String(item?.experienceId || '').trim(), item])
        .filter(([experienceId]) => experienceId)
    );
    const runsByExperienceId = new Map();
    (Array.isArray(archiveRuns) ? archiveRuns : []).forEach((run) => {
      const experienceId = String(run?.experienceId || '').trim();
      if (!experienceId) return;
      const entries = runsByExperienceId.get(experienceId) || [];
      entries.push(run);
      runsByExperienceId.set(experienceId, entries);
    });

    Array.from(runsByExperienceId.entries()).forEach(([experienceId, experienceRuns]) => {
      const latestRun = [...experienceRuns].sort((left, right) => {
        const createdAtDelta = parseHouseOfficeActivityTime(String(right?.completedAt || right?.updatedAt || right?.createdAt || ''))
          - parseHouseOfficeActivityTime(String(left?.completedAt || left?.updatedAt || left?.createdAt || ''));
        if (createdAtDelta !== 0) return createdAtDelta;
        return String(right?.runId || '').localeCompare(String(left?.runId || ''));
      })[0] || null;
      const displayName = String(
        experienceItemsById.get(experienceId)?.displayName
        || experienceItemsById.get(experienceId)?.title
        || experienceId
      ).trim() || experienceId;
      const latestRunId = String(latestRun?.runId || '').trim();
      const latestTraceId = String(latestRun?.traceId || '').trim();
      addBriefingItem('experiences', {
        briefingId: `experience:${experienceId}`,
        title: `${displayName} remains active`,
        summary: `${experienceRuns.length} recent House run${experienceRuns.length === 1 ? '' : 's'} are attached to ${displayName}.`,
        createdAt: String(latestRun?.completedAt || latestRun?.updatedAt || latestRun?.createdAt || '').trim(),
        citations: [
          {
            sourceKind: 'experience',
            sourceId: experienceId,
            entryPath: '/api/platform/experiences',
            selection: buildHouseOfficeSelection({
              sourceKind: 'experience',
              sourceId: experienceId,
              entryPath: '/api/platform/experiences',
            }),
          },
          latestRunId
            ? {
              sourceKind: 'run',
              sourceId: latestRunId,
              entryPath: '/api/platform/archive',
              selection: buildHouseOfficeSelection({
                sourceKind: 'run',
                sourceId: latestRunId,
                entryPath: '/api/platform/archive',
                runId: latestRunId,
                traceId: latestTraceId,
                experienceId,
              }),
            }
            : null,
        ].filter(Boolean),
      });
      if (!isHouseOfficeOpsExperienceId(experienceId) || !latestRunId) return;
      addBriefingItem('poker_or_web', {
        briefingId: `ops:${latestRunId}`,
        title: `${displayName} activity recorded`,
        summary: `Run ${latestRunId} is available for operations review in the archive.`,
        createdAt: String(latestRun?.completedAt || latestRun?.updatedAt || latestRun?.createdAt || '').trim(),
        citations: [
          {
            sourceKind: 'run',
            sourceId: latestRunId,
            entryPath: '/api/platform/archive',
            selection: buildHouseOfficeSelection({
              sourceKind: 'run',
              sourceId: latestRunId,
              entryPath: '/api/platform/archive',
              runId: latestRunId,
              traceId: latestTraceId,
              experienceId,
            }),
          },
        ],
      });
    });

    return groupOrder.map((family) => {
      const items = (groups.get(family) || []).sort((left, right) => {
        const createdAtDelta = parseHouseOfficeActivityTime(String(right.createdAt || '')) - parseHouseOfficeActivityTime(String(left.createdAt || ''));
        if (createdAtDelta !== 0) return createdAtDelta;
        return String(left.briefingId || '').localeCompare(String(right.briefingId || ''));
      });
      if (!items.length) return null;
      return {
        family,
        label: String(groupLabels[family] || family).trim() || family,
        items,
      };
    }).filter(Boolean);
  }

  function buildHouseOfficeAttention({
    binding = null,
    trainerJobs = [],
    trainerResults = [],
    trackPayload = null,
    archiveRuns = [],
    experiences = [],
    deeplinks = {},
  } = {}) {
    const fixture = getUnifiedPlatformTestFixture('house_office_attention_seed') || {};
    const severityOrder = Array.isArray(fixture?.severityOrder) && fixture.severityOrder.length
      ? fixture.severityOrder.map((entry) => String(entry || '').trim()).filter(Boolean)
      : ['critical', 'warn', 'info'];
    const severityRank = new Map(severityOrder.map((severity, index) => [severity, index]));
    const trainerJobsById = new Map(
      (Array.isArray(trainerJobs) ? trainerJobs : [])
        .map((job) => [String(job?.trainerJobId || '').trim(), job])
        .filter(([trainerJobId]) => trainerJobId)
    );
    const items = [];

    (Array.isArray(trainerResults) ? trainerResults : []).forEach((result) => {
      const trainerResultId = String(result?.trainerResultId || '').trim();
      if (!trainerResultId || result?.approvalNeeded !== true) return;
      const trainerJobId = String(result?.trainerJobId || '').trim();
      const trainerJob = trainerJobsById.get(trainerJobId) || null;
      items.push({
        attentionId: `trainer:${trainerResultId}`,
        severity: 'critical',
        title: sanitizeHouseOfficeText('Trainer approval required', 'Sensitive attention item'),
        summary: sanitizeHouseOfficeText(
          `${String(trainerJob?.jobKind || 'trainer_job.compare').trim() || 'trainer_job.compare'} result ${trainerResultId} is awaiting approval.`,
          'Sensitive attention details redacted'
        ),
        sourceKind: 'trainer_result',
        sourceId: trainerResultId,
        createdAt: String(result?.updatedAt || result?.createdAt || '').trim() || null,
        deepLink: buildHouseOfficeDeepLinkWithSelection(
          deeplinks.trainer || deeplinks.office,
          buildHouseOfficeSelection({
            sourceKind: 'trainer_result',
            sourceId: trainerResultId,
            entryPath: '/api/platform/trainer',
            trainerJobId,
          })
        ),
      });
    });

    if (binding) {
      const teamBindingId = String(binding?.teamBindingId || '').trim();
      if (teamBindingId) {
        items.push({
          attentionId: `workshop:${teamBindingId}`,
          severity: 'warn',
          title: sanitizeHouseOfficeText('Workshop binding changed', 'Sensitive attention item'),
          summary: sanitizeHouseOfficeText(
            `Team ${String(binding?.teamId || '').trim() || 'team'} points to ${String(binding?.activeConfigVersionId || 'the active config').trim() || 'the active config'}.`,
            'Sensitive attention details redacted'
          ),
          sourceKind: 'team_config_binding',
          sourceId: teamBindingId,
          createdAt: String(binding?.updatedAt || binding?.createdAt || '').trim() || null,
          deepLink: buildHouseOfficeDeepLinkWithSelection(
            deeplinks.workshop || deeplinks.office,
            buildHouseOfficeSelection({
              sourceKind: 'team_config_binding',
              sourceId: teamBindingId,
              entryPath: '/api/platform/workshop',
            })
          ),
        });
      }
    }

    const trackEvents = Array.isArray(trackPayload?.events) ? trackPayload.events : [];
    const latestTrackEvent = trackEvents.length ? trackEvents[trackEvents.length - 1] : null;
    const latestTrackEventId = String(latestTrackEvent?.trackProgressEventId || '').trim();
    if (latestTrackEventId) {
      items.push({
        attentionId: `tracks:${latestTrackEventId}`,
        severity: 'info',
        title: sanitizeHouseOfficeText('Track progress updated', 'Sensitive attention item'),
        summary: sanitizeHouseOfficeText(
          `${String(latestTrackEvent?.title || latestTrackEvent?.trackId || 'Track').trim() || 'Track'} recorded progress from ${String(latestTrackEvent?.sourceKind || 'track').trim() || 'track'}.`,
          'Sensitive attention details redacted'
        ),
        sourceKind: 'track_progress_event',
        sourceId: latestTrackEventId,
        createdAt: String(latestTrackEvent?.createdAt || '').trim() || null,
        deepLink: buildHouseOfficeDeepLinkWithSelection(
          deeplinks.tracks || deeplinks.office,
          buildHouseOfficeSelection({
            sourceKind: 'track_progress_event',
            sourceId: latestTrackEventId,
            entryPath: '/api/platform/tracks',
            trackId: String(latestTrackEvent?.trackId || '').trim(),
          })
        ),
      });
    }

    const experienceItemsById = new Map(
      (Array.isArray(experiences) ? experiences : [])
        .map((item) => [String(item?.experienceId || '').trim(), item])
        .filter(([experienceId]) => experienceId)
    );
    const latestOpsRun = [...(Array.isArray(archiveRuns) ? archiveRuns : [])]
      .filter((run) => isHouseOfficeOpsExperienceId(run?.experienceId))
      .sort((left, right) => {
        const createdAtDelta = parseHouseOfficeActivityTime(String(right?.completedAt || right?.updatedAt || right?.createdAt || ''))
          - parseHouseOfficeActivityTime(String(left?.completedAt || left?.updatedAt || left?.createdAt || ''));
        if (createdAtDelta !== 0) return createdAtDelta;
        return String(right?.runId || '').localeCompare(String(left?.runId || ''));
      })[0] || null;
    const latestOpsRunId = String(latestOpsRun?.runId || '').trim();
    if (latestOpsRunId) {
      const experienceId = String(latestOpsRun?.experienceId || '').trim();
      const displayName = String(
        experienceItemsById.get(experienceId)?.displayName
        || experienceItemsById.get(experienceId)?.title
        || experienceId
      ).trim() || experienceId;
      items.push({
        attentionId: `ops:${latestOpsRunId}`,
        severity: 'info',
        title: sanitizeHouseOfficeText(`${displayName} activity captured`, 'Sensitive attention item'),
        summary: sanitizeHouseOfficeText(
          `Run ${latestOpsRunId} is ready for operations review in the archive.`,
          'Sensitive attention details redacted'
        ),
        sourceKind: 'run',
        sourceId: latestOpsRunId,
        createdAt: '',
        deepLink: buildHouseOfficeDeepLinkWithSelection(
          deeplinks.archive || deeplinks.office,
          buildHouseOfficeSelection({
            sourceKind: 'run',
            sourceId: latestOpsRunId,
            entryPath: '/api/platform/archive',
            runId: latestOpsRunId,
            traceId: String(latestOpsRun?.traceId || '').trim(),
            experienceId,
          })
        ),
      });
    }

    return items.sort((left, right) => {
      const severityDelta = Number(severityRank.get(String(left?.severity || '')) ?? severityOrder.length)
        - Number(severityRank.get(String(right?.severity || '')) ?? severityOrder.length);
      if (severityDelta !== 0) return severityDelta;
      const createdAtDelta = parseHouseOfficeActivityTime(String(right?.createdAt || '')) - parseHouseOfficeActivityTime(String(left?.createdAt || ''));
      if (createdAtDelta !== 0) return createdAtDelta;
      return String(left?.attentionId || '').localeCompare(String(right?.attentionId || ''));
    });
  }

  function buildHouseOfficeOverviewPayload({
    context = {},
    houseId = '',
    teamId = '',
  } = {}) {
    const overviewFixture = getUnifiedPlatformTestFixture('house_office_overview_seed') || {};
    const deeplinks = buildHouseOfficeDeepLinks();
    const previewOffices = (Array.isArray(overviewFixture?.offices) ? overviewFixture.offices : [])
      .map((entry, index) => {
        const officeId = String(entry?.officeId || '').trim();
        const slug = String(entry?.slug || '').trim();
        const displayName = String(entry?.displayName || slug || officeId).trim() || officeId;
        const surface = String(entry?.surface || '').trim();
        const mapColumn = Number(entry?.mapColumn || ((index % 2) + 1));
        const mapRow = Number(entry?.mapRow || (Math.floor(index / 2) + 1));
        const order = Number(entry?.order || ((index + 1) * 10));
        if (!officeId || !slug) return null;
        return {
          officeId,
          slug,
          displayName,
          purpose: String(entry?.purpose || '').trim(),
          order: Number.isFinite(order) ? order : ((index + 1) * 10),
          mapColumn: Number.isFinite(mapColumn) && mapColumn > 0 ? Math.floor(mapColumn) : ((index % 2) + 1),
          mapRow: Number.isFinite(mapRow) && mapRow > 0 ? Math.floor(mapRow) : (Math.floor(index / 2) + 1),
          surface: surface || 'office',
          deepLink: deeplinks[surface] || deeplinks.office,
        };
      })
      .filter(Boolean)
      .sort((left, right) => {
        const orderDelta = Number(left?.order || 0) - Number(right?.order || 0);
        if (orderDelta !== 0) return orderDelta;
        return String(left?.slug || '').localeCompare(String(right?.slug || ''));
      });
    const structurePayload = buildHouseOfficeStructurePayload({
      context,
      houseId,
      teamId,
    });
    const structureSourceKind = String(structurePayload?.structureSourceKind || '').trim() || 'unattached_preview';
    const offices = houseId
      ? (Array.isArray(structurePayload?.offices) ? structurePayload.offices : [])
        .map((entry) => {
          const officeId = String(entry?.officeId || '').trim();
          const slug = String(entry?.slug || '').trim();
          if (!officeId || !slug) return null;
          const surface = String(entry?.surface || '').trim() || 'office';
          return {
            officeId,
            slug,
            displayName: String(entry?.displayName || slug || officeId).trim() || officeId,
            purpose: String(entry?.purpose || '').trim(),
            order: Number.isFinite(Number(entry?.order)) ? Math.floor(Number(entry.order)) : 0,
            mapColumn: Number.isFinite(Number(entry?.mapColumn)) ? Math.max(1, Math.floor(Number(entry.mapColumn))) : 1,
            mapRow: Number.isFinite(Number(entry?.mapRow)) ? Math.max(1, Math.floor(Number(entry.mapRow))) : 1,
            surface,
            deepLink: deeplinks[surface] || deeplinks.office,
          };
        })
        .filter(Boolean)
      : previewOffices;
    const staffAgents = houseId
      ? (Array.isArray(structurePayload?.staffAgents) ? structurePayload.staffAgents : [])
        .map((entry) => {
          const staffAgentId = String(entry?.staffAgentId || '').trim();
          const officeId = String(entry?.officeId || '').trim();
          if (!staffAgentId || !officeId) return null;
          const office = offices.find((item) => item.officeId === officeId) || null;
          const role = String(entry?.role || '').trim() || 'staff';
          return {
            staffAgentId,
            displayName: String(entry?.displayName || role || staffAgentId).trim() || staffAgentId,
            role,
            officeId,
            teamId: String(entry?.teamId || teamId || context.activeTeamId || '').trim() || null,
            deepLink: office?.deepLink || deeplinks.office,
          };
        })
        .filter(Boolean)
      : [];
    const experiences = buildHouseExperienceItems();
    const tracksPayload = houseId
      ? buildTrackReadPayload({ houseId, teamId })
      : {
        tracks: [],
        events: [],
        antiFarming: getTrackAntiFarmingPolicy(),
        emptyStateText: 'No track progress recorded yet.',
      };
    const trainerJobs = houseId ? listTrainerJobs({ houseId, teamId }) : [];
    const trainerResults = houseId ? listTrainerResults({ houseId, teamId }) : [];
    const archiveRuns = houseId ? listRuns({ houseId, teamId }) : [];
    const binding = houseId && teamId
      ? getTeamConfigBinding({ houseId, teamId })
      : null;
    const assignments = houseId
      ? buildHouseOfficeAssignments({
        houseId,
        teamId,
        offices,
        staffAgents,
        deeplinks,
      })
      : [];
    const presence = houseId
      ? buildHouseOfficePresence({
        offices,
        deeplinks,
        binding,
        trainerJobs,
        trainerResults,
        archiveRuns,
        trackPayload: tracksPayload,
      })
      : [];
    const briefing = houseId
      ? buildHouseOfficeBriefing({
        binding,
        trainerJobs,
        trainerResults,
        archiveRuns,
        trackPayload: tracksPayload,
        experiences,
      })
      : [];
    const attention = houseId
      ? buildHouseOfficeAttention({
        binding,
        trainerJobs,
        trainerResults,
        trackPayload: tracksPayload,
        archiveRuns,
        experiences,
        deeplinks,
      })
      : [];
    const deployments = houseId && teamId
      ? buildHouseWorkerDeploymentCards({
        houseId,
        teamId,
        offices,
        staffAgents,
      })
      : [];
    const briefingItemCount = countHouseOfficeBriefingItems(briefing);
    const activityCount = trainerJobs.length
      + trainerResults.length
      + archiveRuns.length
      + tracksPayload.events.length
      + assignments.length
      + deployments.length
      + briefingItemCount
      + attention.length;
    return {
      houseId: houseId || null,
      teamId: teamId || null,
      activeTeamId: context.activeTeamId,
      availableTeamIds: context.availableTeamIds,
      offices,
      staffAgents,
      assignments,
      deployments,
      presence,
      briefing,
      attention,
      deeplinks,
      sourceManifest: {
        schema: 'agent-town-house-office/v1',
        routes: [
          '/api/platform/context',
          '/api/platform/house-structure',
          '/api/platform/house-office/assignments',
          '/api/platform/house-workers/deployments',
          '/api/platform/house-workers/install',
          '/api/platform/house-workers/share',
          '/api/platform/house-workers/install-shared',
          '/api/platform/experiences',
          '/api/platform/workshop',
          '/api/platform/tracks',
          '/api/platform/archive',
          '/api/platform/trainer',
        ],
        fixtures: houseId
          ? [
            'house_office_structure_seed',
            'house_office_assignments_seed',
            'house_office_briefing_seed',
            'house_office_privacy_seed',
            'worker_package_registry_seed',
            'worker_package_install_seed',
          ]
          : [
            'house_office_overview_seed',
            'house_office_structure_seed',
            'worker_package_registry_seed',
          ],
        structureSourceKind,
        counts: {
          officeCount: offices.length,
          staffAgentCount: staffAgents.length,
          assignmentCount: assignments.length,
          deploymentCount: deployments.length,
          presenceCount: presence.length,
          briefingGroupCount: briefing.length,
          briefingItemCount,
          attentionCount: attention.length,
          experienceCount: experiences.length,
          trackCount: Array.isArray(tracksPayload?.tracks) ? tracksPayload.tracks.length : 0,
          trackEventCount: Array.isArray(tracksPayload?.events) ? tracksPayload.events.length : 0,
          trainerJobCount: trainerJobs.length,
          trainerResultCount: trainerResults.length,
          archiveRunCount: archiveRuns.length,
        },
        activeConfigVersionId: binding?.activeConfigVersionId || null,
      },
      summary: {
        officeCount: offices.length,
        staffAgentCount: staffAgents.length,
        assignmentCount: assignments.length,
        deploymentCount: deployments.length,
        presenceCount: presence.length,
        briefingGroupCount: briefing.length,
        briefingItemCount,
        attentionCount: attention.length,
        experienceCount: experiences.length,
        trackCount: Array.isArray(tracksPayload?.tracks) ? tracksPayload.tracks.length : 0,
        trainerJobCount: trainerJobs.length,
        trainerResultCount: trainerResults.length,
        archiveRunCount: archiveRuns.length,
      },
      emptyStateText: !houseId
        ? String(overviewFixture?.emptyStateText || 'Attach a house to inspect the House Office overview.')
        : activityCount > 0
          ? ''
          : 'No recent House Office activity is available yet.',
    };
  }

  function buildHouseFlowReadinessPayload({
    context = {},
  } = {}) {
    const houseId = typeof context.houseId === 'string' ? context.houseId.trim() : '';
    const teamId = typeof context.activeTeamId === 'string' ? context.activeTeamId.trim() : '';
    const availableTeamIds = Array.isArray(context?.availableTeamIds) ? context.availableTeamIds : [];
    const blockers = [];
    if (!houseId) {
      blockers.push({
        code: 'HOUSE_REQUIRED',
        message: 'Attach a house before validating House Office, Workshop, Tracks, Archive, and Trainer flows.',
      });
    }
    if (houseId && !teamId) {
      blockers.push({
        code: 'ACTIVE_TEAM_REQUIRED',
        message: 'Select an active team before validating team-specific House flows.',
      });
    }
    const districtSections = [
      { sectionId: 'front_desk', label: 'Front Desk', surface: 'office' },
      { sectionId: 'workshop_wing', label: 'Workshop Wing', surface: 'workshop' },
      { sectionId: 'analysis_wing', label: 'Analysis Wing', surface: 'trainer' },
      { sectionId: 'archive_wing', label: 'Archive Wing', surface: 'archive' },
      { sectionId: 'operations_wing', label: 'Operations Wing', surface: 'experiences' },
      { sectionId: 'tracks_board', label: 'Tracks Board', surface: 'tracks' },
    ];
    const blockedBy = blockers.map((entry) => String(entry?.code || '').trim()).filter(Boolean);
    const overview = buildHouseOfficeOverviewPayload({
      context,
      houseId,
      teamId,
    });
    const activeConfigVersionId = String(overview?.sourceManifest?.activeConfigVersionId || '').trim();
    const counts = overview?.sourceManifest?.counts && typeof overview.sourceManifest.counts === 'object'
      ? overview.sourceManifest.counts
      : {};
    const trackPayload = houseId && teamId
      ? buildTrackReadPayload({ houseId, teamId })
      : {
        tracks: [],
        events: [],
      };
    const archiveRuns = houseId && teamId ? listRuns({ houseId, teamId }) : [];
    const trainerJobs = houseId && teamId ? listTrainerJobs({ houseId, teamId }) : [];
    const trainerResults = houseId && teamId ? listTrainerResults({ houseId, teamId }) : [];
    const experienceItems = houseId ? buildHouseExperienceItems() : [];
    const selectionState = {
      officeId: String(overview?.offices?.[0]?.officeId || '').trim(),
      workshopKind: activeConfigVersionId ? 'config_version' : '',
      workshopId: activeConfigVersionId,
      trackId: String(trackPayload?.tracks?.[0]?.trackId || '').trim(),
      traceId: String(archiveRuns?.[0]?.traceId || '').trim(),
      runId: String(archiveRuns?.[0]?.runId || '').trim(),
      trainerResultId: String(trainerResults?.[0]?.trainerResultId || '').trim(),
      trainerJobId: String(trainerResults?.[0]?.trainerJobId || trainerJobs?.[0]?.trainerJobId || '').trim(),
      experienceId: String(experienceItems?.[0]?.experienceId || '').trim(),
    };

    function buildReadinessSurface({
      surface = '',
      label = '',
      route = '',
      routeOk = false,
      dataOk = false,
      selectionOk = false,
      browserValidationRequired = true,
      summaryReady = '',
      summaryBlocked = '',
      missingDataCode = 'DATA_REQUIRED',
      missingSelectionCode = 'SELECTION_REQUIRED',
    } = {}) {
      const surfaceBlockedBy = [...blockedBy];
      if (!routeOk && !surfaceBlockedBy.includes('ROUTE_PROBE_FAILED')) {
        surfaceBlockedBy.push('ROUTE_PROBE_FAILED');
      }
      if (routeOk && !dataOk && !surfaceBlockedBy.includes(missingDataCode)) {
        surfaceBlockedBy.push(missingDataCode);
      }
      if (routeOk && dataOk && !selectionOk && !surfaceBlockedBy.includes(missingSelectionCode)) {
        surfaceBlockedBy.push(missingSelectionCode);
      }
      const ready = surfaceBlockedBy.length === 0 && routeOk && dataOk && selectionOk;
      return {
        surface,
        label,
        route,
        ready,
        status: ready ? 'ready' : 'blocked',
        blockedBy: surfaceBlockedBy,
        summary: ready
          ? String(summaryReady || '').trim() || 'Ready for manual browser validation.'
          : String(summaryBlocked || '').trim() || 'Missing route evidence, data, or selection.',
        routeOk,
        dataOk,
        selectionOk,
        browserValidationRequired: browserValidationRequired === true,
      };
    }

    const surfaces = [
      buildReadinessSurface({
        surface: 'office',
        label: 'House Office',
        route: '/api/platform/house-office',
        routeOk: !!houseId,
        dataOk: Number(counts.officeCount || 0) > 0,
        selectionOk: !!selectionState.officeId,
        summaryReady: `${Number(counts.officeCount || 0)} offices · ${Number(counts.briefingItemCount || 0)} briefing items · selected ${selectionState.officeId}`,
        summaryBlocked: !houseId
          ? 'Requires an attached house.'
          : 'House Office structure is not available yet.',
        missingDataCode: 'OFFICE_STRUCTURE_REQUIRED',
        missingSelectionCode: 'OFFICE_SELECTION_REQUIRED',
      }),
      buildReadinessSurface({
        surface: 'workshop',
        label: 'House Workshop',
        route: '/api/platform/workshop',
        routeOk: !!houseId && !!teamId,
        dataOk: !!activeConfigVersionId,
        selectionOk: !!selectionState.workshopKind && !!selectionState.workshopId,
        summaryReady: `Active config ${activeConfigVersionId} is bound for the current team.`,
        summaryBlocked: !houseId
          ? 'Requires an attached house.'
          : !teamId
            ? 'Requires an active team.'
            : 'No active config is currently bound to the selected team.',
        missingDataCode: 'ACTIVE_CONFIG_REQUIRED',
        missingSelectionCode: 'WORKSHOP_SELECTION_REQUIRED',
      }),
      buildReadinessSurface({
        surface: 'tracks',
        label: 'House Tracks',
        route: '/api/platform/tracks',
        routeOk: !!houseId && !!teamId,
        dataOk: Number(trackPayload?.events?.length || 0) > 0,
        selectionOk: Number(trackPayload?.events?.length || 0) > 0 && !!selectionState.trackId,
        summaryReady: `${Number(trackPayload?.tracks?.length || 0)} tracks · ${Number(trackPayload?.events?.length || 0)} track events · selected ${selectionState.trackId}`,
        summaryBlocked: !houseId
          ? 'Requires an attached house.'
          : !teamId
            ? 'Requires an active team.'
            : 'No track progress events are recorded for the selected team yet.',
        missingDataCode: 'TRACK_ACTIVITY_REQUIRED',
        missingSelectionCode: 'TRACK_SELECTION_REQUIRED',
      }),
      buildReadinessSurface({
        surface: 'archive',
        label: 'House Archive',
        route: '/api/platform/archive',
        routeOk: !!houseId && !!teamId,
        dataOk: archiveRuns.length > 0,
        selectionOk: !!selectionState.traceId && !!selectionState.runId,
        summaryReady: `${archiveRuns.length} canonical archive runs · selected ${selectionState.traceId}`,
        summaryBlocked: !houseId
          ? 'Requires an attached house.'
          : !teamId
            ? 'Requires an active team.'
            : 'No canonical archive runs are available for the selected team yet.',
        missingDataCode: 'ARCHIVE_RUN_REQUIRED',
        missingSelectionCode: 'ARCHIVE_SELECTION_REQUIRED',
      }),
      buildReadinessSurface({
        surface: 'trainer',
        label: 'House Trainer',
        route: '/api/platform/trainer',
        routeOk: !!houseId && !!teamId,
        dataOk: trainerJobs.length > 0 || trainerResults.length > 0,
        selectionOk: !!selectionState.trainerResultId || !!selectionState.trainerJobId,
        summaryReady: `${trainerJobs.length} trainer jobs · ${trainerResults.length} trainer results · selected ${selectionState.trainerResultId || selectionState.trainerJobId}`,
        summaryBlocked: !houseId
          ? 'Requires an attached house.'
          : !teamId
            ? 'Requires an active team.'
            : 'No trainer jobs or trainer results are available for the selected team yet.',
        missingDataCode: 'TRAINER_RECORD_REQUIRED',
        missingSelectionCode: 'TRAINER_SELECTION_REQUIRED',
      }),
      buildReadinessSurface({
        surface: 'experiences',
        label: 'House Experiences',
        route: '/api/platform/experiences',
        routeOk: !!houseId,
        dataOk: experienceItems.length > 0,
        selectionOk: !!selectionState.experienceId,
        summaryReady: `${experienceItems.length} experience entries available from the current House shell · selected ${selectionState.experienceId}`,
        summaryBlocked: !houseId
          ? 'Requires an attached house.'
          : 'No House experiences are available yet.',
        missingDataCode: 'EXPERIENCE_ENTRY_REQUIRED',
        missingSelectionCode: 'EXPERIENCE_SELECTION_REQUIRED',
      }),
    ];
    const readySurfaceCount = surfaces.filter((surface) => surface.ready).length;
    const status = blockers.length === 0 && readySurfaceCount === surfaces.length
      ? 'ready_for_manual_validation'
      : 'action_required';
    const summary = blockers.length
      ? blockers.map((entry) => String(entry?.message || '').trim()).filter(Boolean).join(' ')
      : status === 'ready_for_manual_validation'
        ? 'House flows are ready for manual validation inside the current shell.'
        : `${readySurfaceCount} of ${surfaces.length} House surfaces have route evidence; ${surfaces.length - readySurfaceCount} still need data or exact selection before manual validation.`;
    const checklist = [
      {
        stepId: 'open_house_office',
        label: 'Open House Office',
        successMetric: 'The Office panel stays inside /app and shows a selected office card plus the current briefing, attention, and office map.',
      },
      {
        stepId: 'follow_briefing_citation',
        label: 'Follow one House Briefing citation',
        successMetric: 'A real House source surface opens in-shell and the worker session remains continuous.',
      },
      {
        stepId: 'open_workshop_and_tracks',
        label: 'Open Workshop and Tracks',
        successMetric: 'The selected team context stays stable while active config lineage and track progress remain readable.',
      },
      {
        stepId: 'open_archive_and_trainer',
        label: 'Open Archive and Trainer',
        successMetric: 'Canonical traces and durable trainer records remain reachable without leaving the House shell.',
      },
    ];
    return {
      schema: 'agent-town-house-readiness/v1',
      houseId: houseId || null,
      activeTeamId: teamId || null,
      availableTeamIds,
      status,
      summary,
      blockers,
      districtSections,
      surfaces,
      checklist,
      counts: {
        officeCount: Number(counts.officeCount || 0),
        staffAgentCount: Number(counts.staffAgentCount || 0),
        assignmentCount: Number(counts.assignmentCount || 0),
        presenceCount: Number(counts.presenceCount || 0),
        briefingItemCount: Number(counts.briefingItemCount || 0),
        attentionCount: Number(counts.attentionCount || 0),
        trackCount: Number(counts.trackCount || 0),
        trackEventCount: Number(counts.trackEventCount || 0),
        trainerJobCount: Number(counts.trainerJobCount || 0),
        trainerResultCount: Number(counts.trainerResultCount || 0),
        archiveRunCount: Number(counts.archiveRunCount || 0),
        readySurfaceCount,
      },
    };
  }

  function normalizePackFileMap(fileMap) {
    if (!fileMap || typeof fileMap !== 'object' || Array.isArray(fileMap)) return {};
    return Object.entries(fileMap).reduce((acc, [rawKey, rawValue]) => {
      const key = String(rawKey || '').trim();
      const value = String(rawValue || '').trim();
      if (!key || !value) return acc;
      acc[key] = value;
      return acc;
    }, {});
  }

  function buildCompatiblePackShape({
    manifest = null,
    fileMap = null,
    requiredFiles = [],
    optionalFiles = [],
  } = {}) {
    const normalizedManifest = manifest && typeof manifest === 'object' && !Array.isArray(manifest)
      ? manifest
      : {};
    const files = normalizePackFileMap(fileMap || normalizedManifest.files);
    const normalizedRequiredFiles = Array.isArray(requiredFiles)
      ? requiredFiles.map((entry) => String(entry || '').trim()).filter(Boolean)
      : [];
    const normalizedOptionalFiles = Array.isArray(optionalFiles)
      ? optionalFiles.map((entry) => String(entry || '').trim()).filter(Boolean)
      : [];
    return {
      schema: 'agent-town-compatible-pack/v1',
      manifestRoot: 'manifest.json',
      packVersionId: String(normalizedManifest.packVersionId || '').trim(),
      contentHash: String(normalizedManifest.contentHash || '').trim(),
      requiredFiles: normalizedRequiredFiles,
      optionalFiles: normalizedOptionalFiles,
      files,
    };
  }

  function buildPackCompatibilityContract() {
    const fixture = getUnifiedPlatformTestFixture('editor_pack_compat_seed') || {};
    const fixturePack = fixture?.pack && typeof fixture.pack === 'object' && !Array.isArray(fixture.pack)
      ? fixture.pack
      : {};
    const defaultPack = buildDefaultCompiledSkillPack();
    const defaultManifest = defaultPack?.manifest && typeof defaultPack.manifest === 'object'
      ? defaultPack.manifest
      : {};
    const requiredFiles = Array.isArray(fixturePack.requiredFiles)
      ? fixturePack.requiredFiles.map((entry) => String(entry || '').trim()).filter(Boolean)
      : ['manifest.json', 'overlay.json', 'policy.json'];
    const optionalFiles = Array.isArray(fixturePack.optionalFiles)
      ? fixturePack.optionalFiles.map((entry) => String(entry || '').trim()).filter(Boolean)
      : ['manual/skill.md', 'heartbeat.md', 'tools.md', 'trace_map.json', 'verification.json', 'provenance.json'];
    const fixtureFiles = normalizePackFileMap(fixturePack.files);
    const baseContentHash = String(fixturePack.contentHash || '').trim()
      || sha256PrefixedHex(stableJsonStringify({
        files: fixtureFiles,
        packVersionId: String(fixturePack.packVersionId || ''),
        requiredFiles,
      }));
    const compatiblePack = buildCompatiblePackShape({
      manifest: {
        packVersionId: String(fixturePack.packVersionId || '').trim(),
        contentHash: baseContentHash,
        files: fixtureFiles,
      },
      requiredFiles,
      optionalFiles,
    });
    const surfaceBindings = Array.isArray(fixturePack.surfaceBindings)
      ? fixturePack.surfaceBindings.map((entry) => ({
        surfaceKey: String(entry?.surfaceKey || '').trim(),
        surfaceId: String(entry?.surfaceId || '').trim(),
        route: String(entry?.route || '').trim(),
        consumes: Array.isArray(entry?.consumes)
          ? entry.consumes.map((item) => String(item || '').trim()).filter(Boolean)
          : [],
      })).filter((entry) => entry.surfaceKey && entry.surfaceId && entry.route)
      : [];
    const surfaces = surfaceBindings.reduce((acc, binding) => {
      acc[binding.surfaceKey] = {
        surfaceId: binding.surfaceId,
        route: binding.route,
        consumes: binding.consumes,
        compatiblePack,
      };
      return acc;
    }, {});
    return {
      schema: 'agent-town-pack-compatibility/v1',
      authoritativeManifestRoot: 'manifest.json',
      alternateManifestRootsAllowed: false,
      compatiblePackKeys: Object.keys(compatiblePack),
      requiredFiles,
      optionalFiles,
      compatiblePack,
      surfaces,
      verification: {
        route: '/api/platform/pack-compatibility/verify',
        accepts: ['manifestRoot', 'manifest', 'files'],
        stableErrorCodes: [
          'ALTERNATE_MANIFEST_ROOT',
          'PACK_VERSION_REQUIRED',
          'CONTENT_HASH_INVALID',
          'MANIFEST_FILE_MISSING',
        ],
      },
      internalPackExamples: {
        defaultSkillPack: {
          packVersionId: String(defaultManifest.packVersionId || '').trim(),
          contentHash: String(defaultManifest.contentHash || '').trim(),
          manifestRoot: 'manifest.json',
          files: normalizePackFileMap(defaultManifest.files),
        },
        editorFixture: compatiblePack,
      },
    };
  }

  function verifyPackCompatibilityPayload(payload) {
    const contract = buildPackCompatibilityContract();
    const manifestRoot = typeof payload?.manifestRoot === 'string' && payload.manifestRoot.trim()
      ? payload.manifestRoot.trim()
      : contract.authoritativeManifestRoot;
    const manifest = payload?.manifest && typeof payload.manifest === 'object' && !Array.isArray(payload.manifest)
      ? payload.manifest
      : {};
    const files = normalizePackFileMap(payload?.files || manifest.files);
    const errors = [];
    if (manifestRoot !== contract.authoritativeManifestRoot) {
      errors.push({
        code: 'ALTERNATE_MANIFEST_ROOT',
        path: 'manifestRoot',
        message: 'Compatible packs must keep manifest.json as the authoritative manifest root.',
      });
    }
    const packVersionId = String(manifest.packVersionId || payload?.packVersionId || '').trim();
    if (!packVersionId) {
      errors.push({
        code: 'PACK_VERSION_REQUIRED',
        path: 'manifest.packVersionId',
        message: 'packVersionId is required.',
      });
    }
    const contentHash = String(manifest.contentHash || payload?.contentHash || '').trim();
    if (!/^sha256:[a-f0-9]+$/i.test(contentHash)) {
      errors.push({
        code: 'CONTENT_HASH_INVALID',
        path: 'manifest.contentHash',
        message: 'contentHash must be a sha256-prefixed hex digest.',
      });
    }
    for (const filePath of contract.requiredFiles) {
      if (!files[filePath]) {
        errors.push({
          code: 'MANIFEST_FILE_MISSING',
          path: `files.${filePath}`,
          message: `${filePath} is required for editor-compatible packs.`,
        });
      }
    }
    const compatiblePack = buildCompatiblePackShape({
      manifest: {
        packVersionId,
        contentHash,
        files,
      },
      requiredFiles: contract.requiredFiles,
      optionalFiles: contract.optionalFiles,
    });
    const normalized = {
      manifestRoot: contract.authoritativeManifestRoot,
      compatiblePack,
      compatiblePackKeys: contract.compatiblePackKeys,
      surfaceBindings: Object.entries(contract.surfaces).map(([surfaceKey, surface]) => ({
        surfaceKey,
        surfaceId: surface.surfaceId,
        route: surface.route,
        consumes: surface.consumes,
      })),
    };
    return {
      compatible: errors.length === 0,
      verificationHash: sha256PrefixedHex(stableJsonStringify({
        compatible: errors.length === 0,
        normalized,
        errors,
      })),
      authoritativeManifestRoot: contract.authoritativeManifestRoot,
      normalized,
      errors,
    };
  }

  app.get('/api/platform/default-skill-pack', (_req, res) => {
    const requestId = buildPortalRequestId();
    const pack = buildDefaultCompiledSkillPack();
    return sendPortalApiSuccess(res, pack.manifest, { requestId });
  });

  app.get('/api/platform/pack-compatibility', (_req, res) => {
    const requestId = buildPortalRequestId();
    return sendPortalApiSuccess(res, buildPackCompatibilityContract(), { requestId });
  });

  app.post('/api/platform/pack-compatibility/verify', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    return sendPortalApiSuccess(res, verifyPackCompatibilityPayload(req.body || {}), { requestId });
  });

  app.get('/api/platform/context', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    return sendPortalApiSuccess(res, buildPlatformContextResponse(session), { requestId });
  });

  app.post('/api/platform/active-team', express.json({ limit: '16kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const teamId = typeof req.body?.teamId === 'string' ? req.body.teamId.trim() : '';
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before selecting an active team.', { requestId });
    }
    if (!teamId) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'teamId is required.', { requestId });
    }
    if (!context.availableTeamIds.includes(teamId)) {
      return sendPortalApiError(res, 404, 'TEAM_NOT_FOUND', 'The requested team is not available for this house.', {
        requestId,
        details: {
          availableTeamIds: context.availableTeamIds,
        },
      });
    }
    session.activeTeamId = teamId;
    return sendPortalApiSuccess(res, buildPlatformContextResponse(session), { requestId });
  });

  app.get('/api/platform/archive', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId : '';
    const requestedTeamId = typeof req.query?.teamId === 'string' ? req.query.teamId.trim() : '';
    const teamId = requestedTeamId || (typeof context.activeTeamId === 'string' ? context.activeTeamId : '');
    if (!houseId) {
      return sendPortalApiSuccess(res, {
        houseId: null,
        teamId: null,
        activeTeamId: context.activeTeamId,
        availableTeamIds: context.availableTeamIds,
        items: [],
        emptyStateText: 'No canonical traces archived yet.',
      }, { requestId });
    }
    const items = listRuns({ houseId, teamId }).map((run) => {
      const events = listTraceEvents(run.traceId);
      const archiveCounters = run?.metadata?.archiveCounters && typeof run.metadata.archiveCounters === 'object'
        ? run.metadata.archiveCounters
        : { accepted: events.length, ignored: 0, rejected: 0 };
      return {
        traceId: run.traceId,
        runId: run.runId,
        status: run.status,
        traceAuthorityType: run.traceAuthorityType,
        eventCount: events.length,
        archiveCounters,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
      };
    });
    return sendPortalApiSuccess(res, {
      houseId,
      teamId: teamId || null,
      activeTeamId: context.activeTeamId,
      availableTeamIds: context.availableTeamIds,
      items,
      emptyStateText: 'No canonical traces archived yet.',
    }, { requestId });
  });

  app.get('/api/platform/experiences', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId : '';
    const requestedTeamId = typeof req.query?.teamId === 'string' ? req.query.teamId.trim() : '';
    const teamId = requestedTeamId || (typeof context.activeTeamId === 'string' ? context.activeTeamId : '');
    if (!houseId) {
      return sendPortalApiSuccess(res, {
        houseId: null,
        teamId: null,
        activeTeamId: context.activeTeamId,
        availableTeamIds: context.availableTeamIds,
        items: [],
        emptyStateText: 'No House experiences available yet.',
      }, { requestId });
    }
    return sendPortalApiSuccess(res, {
      houseId,
      teamId: teamId || null,
      activeTeamId: context.activeTeamId,
      availableTeamIds: context.availableTeamIds,
      items: buildHouseExperienceItems(),
      emptyStateText: 'No House experiences available yet.',
    }, { requestId });
  });

  app.get('/api/platform/workshop', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId : '';
    const requestedTeamId = typeof req.query?.teamId === 'string' ? req.query.teamId.trim() : '';
    const teamId = requestedTeamId || (typeof context.activeTeamId === 'string' ? context.activeTeamId : '');
    if (!houseId) {
      return sendPortalApiSuccess(res, {
        houseId: null,
        teamId: null,
        activeTeamId: context.activeTeamId,
        availableTeamIds: context.availableTeamIds,
        activeConfigVersionId: null,
        activeConfigHash: null,
        lineage: {
          parentConfigVersionIds: [],
          createdBy: null,
          trainerJobId: null,
          trainerResultId: null,
          candidatePatchId: null,
        },
        inboxPath: null,
        emptyStateText: 'No active config is bound to this team yet.',
      }, { requestId });
    }
    const binding = teamId
      ? getTeamConfigBinding({ houseId, teamId })
      : null;
    const activeConfig = binding?.activeConfigVersionId
      ? getConfigVersion(binding.activeConfigVersionId)
      : null;
    const lineage = activeConfig?.lineage && typeof activeConfig.lineage === 'object'
      ? activeConfig.lineage
      : {};
    return sendPortalApiSuccess(res, {
      houseId,
      teamId: teamId || null,
      activeTeamId: context.activeTeamId,
      availableTeamIds: context.availableTeamIds,
      activeConfigVersionId: binding?.activeConfigVersionId || null,
      activeConfigHash: activeConfig?.configHash || null,
      lineage: {
        parentConfigVersionIds: Array.isArray(lineage.parentConfigVersionIds) ? lineage.parentConfigVersionIds : [],
        createdBy: typeof lineage.createdBy === 'string' ? lineage.createdBy : null,
        trainerJobId: typeof lineage.trainerJobId === 'string' ? lineage.trainerJobId : null,
        trainerResultId: typeof lineage.trainerResultId === 'string' ? lineage.trainerResultId : null,
        candidatePatchId: typeof lineage.candidatePatchId === 'string' ? lineage.candidatePatchId : null,
      },
      inboxPath: houseId ? `/inbox/${encodeURIComponent(houseId)}` : null,
      emptyStateText: 'No active config is bound to this team yet.',
    }, { requestId });
  });

  app.get('/api/platform/house-structure', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId : '';
    const requestedTeamId = typeof req.query?.teamId === 'string' ? req.query.teamId.trim() : '';
    const teamResolution = resolveValidatedHouseReadTeam({
      context,
      requestedTeamId,
    });
    if (!teamResolution?.ok) {
      return sendPortalApiError(
        res,
        Number(teamResolution?.status || 404),
        String(teamResolution?.code || 'TEAM_NOT_FOUND'),
        String(teamResolution?.message || 'The requested team is not available for this house.'),
        {
          requestId,
          details: teamResolution?.details || {},
        }
      );
    }
    const teamId = String(teamResolution?.teamId || '').trim();
    return sendPortalApiSuccess(res, buildHouseOfficeStructurePayload({
      context,
      houseId,
      teamId,
    }), { requestId });
  });

  app.get('/api/platform/house-office', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId : '';
    const requestedTeamId = typeof req.query?.teamId === 'string' ? req.query.teamId.trim() : '';
    const teamResolution = resolveValidatedHouseReadTeam({
      context,
      requestedTeamId,
    });
    if (!teamResolution?.ok) {
      return sendPortalApiError(
        res,
        Number(teamResolution?.status || 404),
        String(teamResolution?.code || 'TEAM_NOT_FOUND'),
        String(teamResolution?.message || 'The requested team is not available for this house.'),
        {
          requestId,
          details: teamResolution?.details || {},
        }
      );
    }
    const teamId = String(teamResolution?.teamId || '').trim();
    return sendPortalApiSuccess(res, buildHouseOfficeOverviewPayload({
      context,
      houseId,
      teamId,
    }), { requestId });
  });

  app.get('/api/platform/house-workers/deployments', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId : '';
    const requestedTeamId = typeof req.query?.teamId === 'string' ? req.query.teamId.trim() : '';
    const teamResolution = resolveValidatedHouseReadTeam({
      context,
      requestedTeamId,
    });
    if (!teamResolution?.ok) {
      return sendPortalApiError(
        res,
        Number(teamResolution?.status || 404),
        String(teamResolution?.code || 'TEAM_NOT_FOUND'),
        String(teamResolution?.message || 'The requested team is not available for this house.'),
        {
          requestId,
          details: teamResolution?.details || {},
        }
      );
    }
    return sendPortalApiSuccess(res, buildHouseWorkerDeploymentsPayload({
      context,
      houseId,
      teamId: String(teamResolution?.teamId || '').trim(),
    }), { requestId });
  });

  app.post('/api/platform/house-workers/install', express.json({ limit: '24kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId.trim() : '';
    const teamId = typeof context.activeTeamId === 'string' ? context.activeTeamId.trim() : '';
    if (!houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before installing a helper.', { requestId });
    }
    if (!teamId) {
      return sendPortalApiError(res, 409, 'ACTIVE_TEAM_REQUIRED', 'Select an active team before installing a helper.', { requestId });
    }
    const registryEntityId = typeof req.body?.registryEntityId === 'string' ? req.body.registryEntityId.trim() : '';
    const requestedOfficeId = typeof req.body?.officeId === 'string' ? req.body.officeId.trim() : '';
    const requestedDisplayName = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : '';
    if (!registryEntityId) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'registryEntityId is required.', { requestId });
    }
    if (requestedOfficeId && !isSafeHouseOfficeIdentifier(requestedOfficeId)) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'officeId must use safe identifier characters only.', { requestId });
    }
    if (requestedDisplayName && !normalizeHouseWorkerDisplayName(requestedDisplayName)) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'displayName must stay under 80 characters and cannot include secret-like markers.', { requestId });
    }
    const entity = getRegistryEntityById(registryEntityId);
    const packageInfo = resolveHouseWorkerPackage(entity);
    if (!entity || !packageInfo) {
      return sendPortalApiError(res, 404, 'WORKER_PACKAGE_NOT_FOUND', 'Registry does not know that worker package.', { requestId });
    }
    const structure = buildHouseOfficeStructurePayload({
      context,
      houseId,
      teamId,
    });
    const offices = Array.isArray(structure?.offices) ? structure.offices : [];
    const staffAgents = Array.isArray(structure?.staffAgents) ? structure.staffAgents : [];
    const installTarget = resolveHouseWorkerInstallTarget({
      houseId,
      teamId,
      requestedOfficeId,
      packageInfo,
      offices,
      staffAgents,
    });
    if (!installTarget?.ok) {
      return sendPortalApiError(
        res,
        Number(installTarget?.status || 409),
        String(installTarget?.code || 'HOUSE_WORKER_INSTALL_BLOCKED'),
        String(installTarget?.message || 'House helper install is blocked.'),
        { requestId }
      );
    }
    const office = installTarget.office;
    const staffAgent = installTarget.staffAgent;
    const deploymentDisplayName = normalizeHouseWorkerDisplayName(
      requestedDisplayName,
      packageInfo.defaultDisplayName || packageInfo.displayName
    );
    if (!deploymentDisplayName) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'displayName could not be resolved for this helper.', { requestId });
    }
    const deploymentStatus = packageInfo.requiresLocalBrain ? 'brain_binding_required' : 'ready';
    const deploymentIdentity = sha256PrefixedHex(stableJsonStringify({
      houseId,
      teamId,
      officeId: String(office?.officeId || '').trim(),
      registryEntityId: packageInfo.registryEntityId,
      entityVersionId: packageInfo.entityVersionId,
      loadoutId: packageInfo.loadoutId || '',
    }));
    const deploymentId = `hwd_${deploymentIdentity.replace(/^sha256:/i, '').slice(0, 24)}`;
    const now = nowIso();
    const deploymentRecord = createHouseWorkerDeployment({
      deploymentId,
      houseId,
      teamId,
      officeId: String(office?.officeId || '').trim(),
      staffAgentId: String(staffAgent?.staffAgentId || '').trim(),
      registryEntityId: packageInfo.registryEntityId,
      entityVersionId: packageInfo.entityVersionId,
      loadoutId: packageInfo.loadoutId || '',
      bundleHash: packageInfo.bundleHash || '',
      displayName: deploymentDisplayName,
      status: deploymentStatus,
      summary: {
        oneLineBenefit: packageInfo.oneLineBenefit,
        whatItDoes: packageInfo.whatItDoes,
        bestFor: packageInfo.bestFor,
        recommendedOfficeId: String(office?.officeId || packageInfo.recommendedOfficeId || '').trim() || null,
        recommendedOfficeLabel: String(office?.displayName || packageInfo.recommendedOfficeLabel || '').trim() || null,
        supportedSurfaces: packageInfo.supportedSurfaces,
        requiresLocalBrain: packageInfo.requiresLocalBrain === true,
        brainBindingLabel: packageInfo.brainBindingLabel,
      },
      runtimeDefaults: packageInfo.runtimeDefaults,
      installSource: {
        kind: 'registry_package',
        registryEntityId: packageInfo.registryEntityId,
        entityVersionId: packageInfo.entityVersionId,
        requestSource: 'api/platform/house-workers/install',
      },
      idempotencyKey: normalizePortalIdempotencyKey(req),
      nowIso: now,
    });
    const deploymentsPayload = buildHouseWorkerDeploymentsPayload({
      context,
      houseId,
      teamId,
    });
    const deploymentCard = (Array.isArray(deploymentsPayload?.deployments) ? deploymentsPayload.deployments : [])
      .find((entry) => String(entry?.deploymentId || '').trim() === String(deploymentRecord?.deploymentId || '').trim()) || null;
    return sendPortalApiSuccess(res, {
      deployment: deploymentCard || {
        deploymentId: String(deploymentRecord?.deploymentId || '').trim(),
        houseId: String(deploymentRecord?.houseId || '').trim(),
        teamId: String(deploymentRecord?.teamId || '').trim(),
        officeId: String(deploymentRecord?.officeId || '').trim(),
        officeLabel: String(office?.displayName || '').trim(),
        staffAgentId: String(deploymentRecord?.staffAgentId || '').trim(),
        staffAgentLabel: String(staffAgent?.displayName || '').trim(),
        registryEntityId: String(deploymentRecord?.registryEntityId || '').trim(),
        entityVersionId: String(deploymentRecord?.entityVersionId || '').trim(),
        loadoutId: String(deploymentRecord?.loadoutId || '').trim() || null,
        bundleHash: String(deploymentRecord?.bundleHash || '').trim() || null,
        displayName: String(deploymentRecord?.displayName || '').trim(),
        status: String(deploymentRecord?.status || '').trim(),
        statusLabel: buildHouseWorkerStatusExplanation(packageInfo, deploymentRecord?.status),
        oneLineBenefit: packageInfo.oneLineBenefit,
        whatItDoes: packageInfo.whatItDoes,
        bestFor: packageInfo.bestFor,
        supportedSurfaces: packageInfo.supportedSurfaces,
        requiresLocalBrain: packageInfo.requiresLocalBrain === true,
        delegationAllowed: packageInfo.runtimeDefaults?.delegationAllowed === true,
        runtimeDefaults: packageInfo.runtimeDefaults,
        shareable: true,
        createdAt: String(deploymentRecord?.createdAt || '').trim(),
        updatedAt: String(deploymentRecord?.updatedAt || '').trim(),
      },
      guidance: {
        title: packageInfo.requiresLocalBrain ? 'One more setup step is needed' : 'Helper installed',
        nextStep: buildHouseWorkerStatusExplanation(packageInfo, deploymentStatus),
        plainLanguageSummary: String(packageInfo.oneLineBenefit || '').trim()
          || 'This helper is now installed in your House Office.',
      },
      deploymentsPath: '/api/platform/house-workers/deployments',
      houseOfficePath: '/api/platform/house-office',
    }, { requestId });
  });

  app.post('/api/platform/house-workers/share', express.json({ limit: '24kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId.trim() : '';
    const teamId = typeof context.activeTeamId === 'string' ? context.activeTeamId.trim() : '';
    const deploymentId = typeof req.body?.deploymentId === 'string' ? req.body.deploymentId.trim() : '';
    const registryEntityId = typeof req.body?.registryEntityId === 'string' ? req.body.registryEntityId.trim() : '';
    let packageInfo = null;
    let deployment = null;
    if (deploymentId) {
      if (!houseId || !teamId) {
        return sendPortalApiError(res, 409, 'HOUSE_TEAM_REQUIRED', 'Attach a house and select an active team before sharing an installed helper.', { requestId });
      }
      deployment = getHouseWorkerDeploymentById(deploymentId);
      if (!deployment) {
        return sendPortalApiError(res, 404, 'DEPLOYMENT_NOT_FOUND', 'House helper deployment not found.', { requestId });
      }
      if (String(deployment?.houseId || '').trim() !== houseId || String(deployment?.teamId || '').trim() !== teamId) {
        return sendPortalApiError(res, 404, 'DEPLOYMENT_NOT_FOUND', 'House helper deployment not found for the active team.', { requestId });
      }
      const entity = getRegistryEntityById(String(deployment?.registryEntityId || '').trim());
      packageInfo = resolveHouseWorkerPackage(entity);
    } else if (registryEntityId) {
      const entity = getRegistryEntityById(registryEntityId);
      packageInfo = resolveHouseWorkerPackage(entity);
      if (!packageInfo) {
        return sendPortalApiError(res, 404, 'WORKER_PACKAGE_NOT_FOUND', 'Registry does not know that worker package.', { requestId });
      }
    } else {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'deploymentId or registryEntityId is required.', { requestId });
    }
    if (!packageInfo && !deployment) {
      return sendPortalApiError(res, 404, 'WORKER_PACKAGE_NOT_FOUND', 'Registry does not know that worker package.', { requestId });
    }
    const portablePayload = buildHouseWorkerPortableSharePayload({
      deployment,
      packageInfo,
    });
    const shareIdentity = sha256PrefixedHex(stableJsonStringify({
      registryEntityId: portablePayload.registryEntityId,
      entityVersionId: portablePayload.entityVersionId,
      loadoutId: portablePayload.loadoutId || '',
      bundleHash: portablePayload.bundleHash || '',
    }));
    const shareId = `hws_${shareIdentity.replace(/^sha256:/i, '').slice(0, 24)}`;
    const share = createHouseWorkerShare({
      shareId,
      registryEntityId: portablePayload.registryEntityId,
      entityVersionId: portablePayload.entityVersionId,
      loadoutId: portablePayload.loadoutId || '',
      bundleHash: portablePayload.bundleHash || '',
      payload: portablePayload,
      createdByHouseId: houseId || null,
      createdByTeamId: teamId || null,
      nowIso: nowIso(),
    });
    return sendPortalApiSuccess(res, buildHouseWorkerShareResponse(share), { requestId });
  });

  app.get('/api/platform/house-workers/shares/:shareId', (req, res) => {
    const requestId = buildPortalRequestId();
    const share = getHouseWorkerShareById(req.params.shareId);
    if (!share) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'House worker share not found.', { requestId });
    }
    return sendPortalApiSuccess(res, buildHouseWorkerShareResponse(share), { requestId });
  });

  app.post('/api/platform/house-workers/install-shared', express.json({ limit: '24kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId.trim() : '';
    const teamId = typeof context.activeTeamId === 'string' ? context.activeTeamId.trim() : '';
    if (!houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before installing a shared helper.', { requestId });
    }
    if (!teamId) {
      return sendPortalApiError(res, 409, 'ACTIVE_TEAM_REQUIRED', 'Select an active team before installing a shared helper.', { requestId });
    }
    const shareId = typeof req.body?.shareId === 'string' ? req.body.shareId.trim() : '';
    const requestedOfficeId = typeof req.body?.officeId === 'string' ? req.body.officeId.trim() : '';
    const requestedDisplayName = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : '';
    if (!shareId) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'shareId is required.', { requestId });
    }
    const share = getHouseWorkerShareById(shareId);
    if (!share) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'House worker share not found.', { requestId });
    }
    const portablePayload = share?.payload && typeof share.payload === 'object' ? share.payload : {};
    const entity = getRegistryEntityById(String(portablePayload?.registryEntityId || '').trim());
    const canonicalPackage = resolveHouseWorkerPackage(entity);
    if (!entity || !canonicalPackage) {
      return sendPortalApiError(res, 404, 'WORKER_PACKAGE_NOT_FOUND', 'The shared helper no longer resolves to a Registry worker package.', { requestId });
    }
    if (requestedOfficeId && !isSafeHouseOfficeIdentifier(requestedOfficeId)) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'officeId must use safe identifier characters only.', { requestId });
    }
    if (requestedDisplayName && !normalizeHouseWorkerDisplayName(requestedDisplayName)) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'displayName must stay under 80 characters and cannot include secret-like markers.', { requestId });
    }
    const packageInfo = {
      ...canonicalPackage,
      entityVersionId: String(portablePayload?.entityVersionId || canonicalPackage.entityVersionId || '').trim(),
      loadoutId: String(portablePayload?.loadoutId || portablePayload?.runtimeDefaults?.loadoutId || canonicalPackage.loadoutId || '').trim(),
      bundleHash: String(portablePayload?.bundleHash || canonicalPackage.bundleHash || '').trim(),
      defaultDisplayName: String(portablePayload?.displayName || canonicalPackage.defaultDisplayName || '').trim(),
      oneLineBenefit: String(portablePayload?.oneLineBenefit || canonicalPackage.oneLineBenefit || '').trim(),
      whatItDoes: String(portablePayload?.whatItDoes || canonicalPackage.whatItDoes || '').trim(),
      bestFor: Array.isArray(portablePayload?.bestFor) ? portablePayload.bestFor : canonicalPackage.bestFor,
      recommendedOfficeId: String(portablePayload?.recommendedOfficeId || canonicalPackage.recommendedOfficeId || '').trim(),
      recommendedOfficeLabel: String(portablePayload?.recommendedOfficeLabel || canonicalPackage.recommendedOfficeLabel || '').trim(),
      supportedSurfaces: Array.isArray(portablePayload?.supportedSurfaces) ? portablePayload.supportedSurfaces : canonicalPackage.supportedSurfaces,
      requiresLocalBrain: portablePayload?.requiresLocalBrain === true || canonicalPackage.requiresLocalBrain === true,
      delegationAllowed: portablePayload?.delegationAllowed === true || canonicalPackage.delegationAllowed === true,
      runtimeDefaults: {
        ...canonicalPackage.runtimeDefaults,
        ...(portablePayload?.runtimeDefaults && typeof portablePayload.runtimeDefaults === 'object'
          ? portablePayload.runtimeDefaults
          : {}),
        loadoutId: String(
          portablePayload?.runtimeDefaults?.loadoutId
          || portablePayload?.loadoutId
          || canonicalPackage.runtimeDefaults?.loadoutId
          || canonicalPackage.loadoutId
          || ''
        ).trim() || null,
      },
    };
    const structure = buildHouseOfficeStructurePayload({
      context,
      houseId,
      teamId,
    });
    const offices = Array.isArray(structure?.offices) ? structure.offices : [];
    const staffAgents = Array.isArray(structure?.staffAgents) ? structure.staffAgents : [];
    const installTarget = resolveHouseWorkerInstallTarget({
      houseId,
      teamId,
      requestedOfficeId,
      packageInfo,
      offices,
      staffAgents,
    });
    if (!installTarget?.ok) {
      return sendPortalApiError(
        res,
        Number(installTarget?.status || 409),
        String(installTarget?.code || 'HOUSE_WORKER_INSTALL_BLOCKED'),
        String(installTarget?.message || 'House helper install is blocked.'),
        { requestId }
      );
    }
    const office = installTarget.office;
    const staffAgent = installTarget.staffAgent;
    const deploymentDisplayName = normalizeHouseWorkerDisplayName(
      requestedDisplayName,
      packageInfo.defaultDisplayName || packageInfo.displayName
    );
    if (!deploymentDisplayName) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'displayName could not be resolved for this helper.', { requestId });
    }
    const deploymentStatus = packageInfo.requiresLocalBrain ? 'brain_binding_required' : 'ready';
    const deploymentIdentity = sha256PrefixedHex(stableJsonStringify({
      houseId,
      teamId,
      officeId: String(office?.officeId || '').trim(),
      registryEntityId: packageInfo.registryEntityId,
      entityVersionId: packageInfo.entityVersionId,
      loadoutId: packageInfo.loadoutId || '',
    }));
    const deploymentId = `hwd_${deploymentIdentity.replace(/^sha256:/i, '').slice(0, 24)}`;
    const deploymentRecord = createHouseWorkerDeployment({
      deploymentId,
      houseId,
      teamId,
      officeId: String(office?.officeId || '').trim(),
      staffAgentId: String(staffAgent?.staffAgentId || '').trim(),
      registryEntityId: packageInfo.registryEntityId,
      entityVersionId: packageInfo.entityVersionId,
      loadoutId: packageInfo.loadoutId || '',
      bundleHash: packageInfo.bundleHash || '',
      displayName: deploymentDisplayName,
      status: deploymentStatus,
      summary: {
        oneLineBenefit: packageInfo.oneLineBenefit,
        whatItDoes: packageInfo.whatItDoes,
        bestFor: packageInfo.bestFor,
        recommendedOfficeId: String(office?.officeId || packageInfo.recommendedOfficeId || '').trim() || null,
        recommendedOfficeLabel: String(office?.displayName || packageInfo.recommendedOfficeLabel || '').trim() || null,
        supportedSurfaces: packageInfo.supportedSurfaces,
        requiresLocalBrain: packageInfo.requiresLocalBrain === true,
        brainBindingLabel: packageInfo.brainBindingLabel,
      },
      runtimeDefaults: packageInfo.runtimeDefaults,
      installSource: {
        kind: 'worker_share',
        shareId,
        registryEntityId: packageInfo.registryEntityId,
        entityVersionId: packageInfo.entityVersionId,
        requestSource: 'api/platform/house-workers/install-shared',
      },
      idempotencyKey: normalizePortalIdempotencyKey(req),
      nowIso: nowIso(),
    });
    const deploymentsPayload = buildHouseWorkerDeploymentsPayload({
      context,
      houseId,
      teamId,
    });
    const deploymentCard = (Array.isArray(deploymentsPayload?.deployments) ? deploymentsPayload.deployments : [])
      .find((entry) => String(entry?.deploymentId || '').trim() === String(deploymentRecord?.deploymentId || '').trim()) || null;
    return sendPortalApiSuccess(res, {
      deployment: deploymentCard,
      share: buildHouseWorkerShareResponse(share),
      guidance: {
        title: 'Shared helper installed',
        nextStep: buildHouseWorkerStatusExplanation(packageInfo, deploymentStatus),
        plainLanguageSummary: String(packageInfo.oneLineBenefit || '').trim()
          || 'This shared helper is now installed in your House Office.',
      },
      deploymentsPath: '/api/platform/house-workers/deployments',
      houseOfficePath: '/api/platform/house-office',
    }, { requestId });
  });

  app.get('/api/platform/house-readiness', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const requestedTeamId = typeof req.query?.teamId === 'string' ? req.query.teamId.trim() : '';
    const teamResolution = resolveValidatedHouseReadTeam({
      context,
      requestedTeamId,
    });
    if (!teamResolution?.ok) {
      return sendPortalApiError(
        res,
        Number(teamResolution?.status || 404),
        String(teamResolution?.code || 'TEAM_NOT_FOUND'),
        String(teamResolution?.message || 'The requested team is not available for this house.'),
        {
          requestId,
          details: teamResolution?.details || {},
        }
      );
    }
    return sendPortalApiSuccess(res, buildHouseFlowReadinessPayload({
      context: {
        ...context,
        activeTeamId: String(teamResolution?.teamId || '').trim() || null,
      },
    }), { requestId });
  });

  app.post('/api/platform/house-office/assignments', express.json({ limit: '16kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId : '';
    const teamId = typeof context.activeTeamId === 'string' ? context.activeTeamId : '';
    if (!houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before assigning House Office staff.', { requestId });
    }
    if (!teamId) {
      return sendPortalApiError(res, 409, 'ACTIVE_TEAM_REQUIRED', 'Select an active team before assigning House Office staff.', { requestId });
    }

    const officeId = typeof req.body?.officeId === 'string' ? req.body.officeId.trim() : '';
    const staffAgentId = typeof req.body?.staffAgentId === 'string' ? req.body.staffAgentId.trim() : '';
    const focus = typeof req.body?.focus === 'string' ? req.body.focus.trim() : '';
    const sourceKind = typeof req.body?.sourceKind === 'string' ? req.body.sourceKind.trim() : '';
    const sourceId = typeof req.body?.sourceId === 'string' ? req.body.sourceId.trim() : '';
    if (!officeId || !staffAgentId || !focus || !sourceKind || !sourceId) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'officeId, staffAgentId, focus, sourceKind, and sourceId are required.', { requestId });
    }
    if (!isSafeHouseOfficeIdentifier(sourceKind) || !isSafeHouseOfficeIdentifier(sourceId)) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'sourceKind and sourceId must use safe identifier characters only.', { requestId });
    }

    const overview = buildHouseOfficeOverviewPayload({
      context,
      houseId,
      teamId,
    });
    const offices = Array.isArray(overview?.offices) ? overview.offices : [];
    const staffAgents = Array.isArray(overview?.staffAgents) ? overview.staffAgents : [];
    const office = offices.find((entry) => String(entry?.officeId || '').trim() === officeId) || null;
    if (!office) {
      return sendPortalApiError(res, 404, 'OFFICE_NOT_FOUND', 'House Office does not know that office.', { requestId });
    }
    const staffAgent = staffAgents.find((entry) => String(entry?.staffAgentId || '').trim() === staffAgentId) || null;
    if (!staffAgent) {
      return sendPortalApiError(res, 404, 'STAFF_AGENT_NOT_FOUND', 'House Office does not know that staff agent.', { requestId });
    }
    const blockedMarkers = findHouseOfficeSensitiveMarkers(focus);
    if (blockedMarkers.length) {
      return sendPortalApiError(
        res,
        400,
        'SENSITIVE_CONTENT_BLOCKED',
        'House Office focus cannot include secret-like markers or callback details.',
        {
          requestId,
          details: {
            blockedMarkers,
          },
        }
      );
    }
    const sourceResolution = resolveHouseOfficeAssignmentSource({
      houseId,
      teamId,
      sourceKind,
      sourceId,
      office,
    });
    if (!sourceResolution?.ok) {
      return sendPortalApiError(
        res,
        Number(sourceResolution?.status || 400),
        String(sourceResolution?.code || 'SOURCE_REF_NOT_FOUND'),
        String(sourceResolution?.message || 'House Office could not resolve that source record.'),
        { requestId }
      );
    }

    const createdAt = nowIso();
    const assignmentIdentity = sha256PrefixedHex(stableJsonStringify({
      houseId,
      teamId,
      officeId,
      staffAgentId,
      focus,
      sourceKind,
      sourceId,
    }));
    const assignmentId = `assign_${assignmentIdentity.replace(/^sha256:/i, '').slice(0, 24)}`;
    const assignmentRecord = createHouseStaffAssignment({
      assignmentId,
      houseId,
      teamId,
      officeId,
      staffAgentId,
      focus,
      sourceKind,
      sourceId,
      sourceRef: sourceResolution.sourceRef || {
        sourceKind,
        sourceId,
        entryPath: buildHouseOfficeAssignmentEntryPath({ sourceKind, office }),
      },
      idempotencyKey: normalizePortalIdempotencyKey(req),
      startedAt: createdAt,
      nowIso: createdAt,
    });
    const assignment = buildHouseOfficeAssignments({
      houseId,
      teamId,
      offices,
      staffAgents,
      deeplinks: overview?.deeplinks && typeof overview.deeplinks === 'object'
        ? overview.deeplinks
        : buildHouseOfficeDeepLinks(),
    }).find((entry) => String(entry?.assignmentId || '').trim() === String(assignmentRecord?.assignmentId || '').trim()) || null;
    return sendPortalApiSuccess(res, assignment || {
      assignmentId: String(assignmentRecord?.assignmentId || '').trim(),
      staffAgentId: String(assignmentRecord?.staffAgentId || '').trim(),
      officeId: String(assignmentRecord?.officeId || '').trim(),
      focus: sanitizeHouseOfficeText(assignmentRecord?.focus, 'Sensitive assignment details redacted'),
      sourceKind: String(assignmentRecord?.sourceKind || '').trim(),
      sourceId: String(assignmentRecord?.sourceId || '').trim(),
      startedAt: String(assignmentRecord?.startedAt || '').trim(),
      deepLink: buildHouseOfficeAssignmentDeepLink({
        sourceKind,
        office,
        deeplinks: overview?.deeplinks && typeof overview.deeplinks === 'object'
          ? overview.deeplinks
          : buildHouseOfficeDeepLinks(),
        selection: buildHouseOfficeSelection({
          sourceKind,
          sourceId,
          entryPath: String(sourceResolution?.entryPath || buildHouseOfficeAssignmentEntryPath({ sourceKind, office })).trim(),
        }),
      }),
      sourceRefs: [
        buildHouseOfficeSourceRef({
          sourceKind: String(assignmentRecord?.sourceKind || '').trim(),
          sourceId: String(assignmentRecord?.sourceId || '').trim(),
          entryPath: String(sourceResolution?.entryPath || buildHouseOfficeAssignmentEntryPath({ sourceKind, office })).trim(),
          selection: sourceResolution?.selection || buildHouseOfficeSelection({
            sourceKind,
            sourceId,
            entryPath: String(sourceResolution?.entryPath || buildHouseOfficeAssignmentEntryPath({ sourceKind, office })).trim(),
          }),
        }),
      ].filter(Boolean),
    }, { requestId });
  });

  app.get('/api/platform/tracks', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId : '';
    const requestedTeamId = typeof req.query?.teamId === 'string' ? req.query.teamId.trim() : '';
    const teamId = requestedTeamId || (typeof context.activeTeamId === 'string' ? context.activeTeamId : '');
    const basePayload = {
      houseId: houseId || null,
      teamId: teamId || null,
      activeTeamId: context.activeTeamId,
      availableTeamIds: context.availableTeamIds,
    };
    if (!houseId) {
      return sendPortalApiSuccess(res, {
        ...basePayload,
        tracks: [],
        events: [],
        antiFarming: getTrackAntiFarmingPolicy(),
        emptyStateText: 'No track progress recorded yet.',
      }, { requestId });
    }
    return sendPortalApiSuccess(res, {
      ...basePayload,
      ...buildTrackReadPayload({ houseId, teamId }),
    }, { requestId });
  });

  app.get('/api/platform/trainer', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId : '';
    const requestedTeamId = typeof req.query?.teamId === 'string' ? req.query.teamId.trim() : '';
    const teamId = requestedTeamId || (typeof context.activeTeamId === 'string' ? context.activeTeamId : '');
    if (!houseId) {
      return sendPortalApiSuccess(res, {
        houseId: null,
        teamId: null,
        activeTeamId: context.activeTeamId,
        availableTeamIds: context.availableTeamIds,
        jobs: [],
        results: [],
        emptyStateText: 'No durable trainer jobs yet.',
      }, { requestId });
    }
    const jobs = listTrainerJobs({ houseId, teamId }).map((job) => {
      const result = getTrainerResultByJobId(job.trainerJobId);
      return {
        trainerJobId: job.trainerJobId,
        teamId: job.teamId,
        jobKind: job.jobKind,
        status: job.status,
        targets: job.targets,
        budget: job.budget,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        result: result ? {
          trainerResultId: result.trainerResultId,
          status: result.status,
          approvalNeeded: result.approvalNeeded,
        } : null,
      };
    });
    const results = listTrainerResults({ houseId, teamId }).map((result) => ({
      trainerResultId: result.trainerResultId,
      trainerJobId: result.trainerJobId,
      status: result.status,
      summary: String(result?.result?.summary || ''),
      candidatePatchIds: result.candidatePatchIds,
      linkedConfigVersionId: result.linkedConfigVersionId,
      approvalNeeded: result.approvalNeeded,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));
    const binding = teamId
      ? getTeamConfigBinding({ houseId, teamId })
      : null;
    const activeConfig = binding?.activeConfigVersionId
      ? getConfigVersion(binding.activeConfigVersionId)
      : null;
    return sendPortalApiSuccess(res, {
      houseId,
      teamId: teamId || null,
      activeTeamId: context.activeTeamId,
      availableTeamIds: context.availableTeamIds,
      activeConfigVersionId: binding?.activeConfigVersionId || null,
      activeConfigHash: activeConfig?.configHash || null,
      jobs,
      results,
      emptyStateText: 'No durable trainer jobs yet.',
    }, { requestId });
  });

  app.post('/api/platform/trainer/jobs', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before creating a durable trainer job.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'ACTIVE_TEAM_REQUIRED', 'Select an active team before creating a durable trainer job.', { requestId });
    }

    const idempotencyKey = normalizePortalIdempotencyKey(req);
    const jobKind = typeof req.body?.jobKind === 'string' ? req.body.jobKind.trim() : 'trainer_job.compare';
    if (!idempotencyKey || jobKind !== 'trainer_job.compare') {
      return sendPortalApiError(
        res,
        400,
        'INVALID_ARGUMENT',
        'Idempotency-Key is required and House Trainer currently supports trainer_job.compare only.',
        { requestId }
      );
    }

    const binding = getTeamConfigBinding({
      houseId: context.houseId,
      teamId: context.activeTeamId,
    });
    const activeConfigVersionId = String(binding?.activeConfigVersionId || '').trim();
    if (!activeConfigVersionId) {
      return sendPortalApiError(res, 409, 'ACTIVE_CONFIG_REQUIRED', 'Promote one config for this team before running House Trainer.', { requestId });
    }

    let budget = {};
    try {
      budget = normalizePlatformTrainerBudget(req.body?.budget || { maxUsd: 5 });
    } catch {
      return sendPortalApiError(res, 400, 'TRAINER_BUDGET_INVALID', 'budget.maxUsd must be a positive number when provided.', { requestId });
    }

    const replayed = getTrainerJobByIdempotency({
      houseId: context.houseId,
      idempotencyKey,
    });
    if (replayed) {
      const replayedResult = getTrainerResultByJobId(replayed.trainerJobId);
      return sendPortalApiSuccess(res, {
        houseId: context.houseId,
        teamId: context.activeTeamId,
        activeConfigVersionId,
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

    const job = createTrainerJob({
      trainerJobId: `trainer_${randomHex(10)}`,
      houseId: context.houseId,
      teamId: context.activeTeamId,
      jobKind,
      status: 'queued',
      targets: {
        configVersionIds: [activeConfigVersionId],
      },
      budget,
      idempotencyKey,
      nowIso: nowIso(),
    });
    const linkedConfigVersionId = resolvePlatformTrainerLinkedConfigVersionId({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      targets: job.targets,
    });
    const resultSeed = buildPlatformTrainerResultPayload(job, { linkedConfigVersionId });
    const result = createTrainerResult({
      trainerResultId: resultSeed.trainerResultId,
      trainerJobId: job.trainerJobId,
      status: resultSeed.status,
      result: resultSeed.resultPayload,
      candidatePatchIds: resultSeed.candidatePatchIds,
      linkedConfigVersionId: resultSeed.linkedConfigVersionId,
      approvalNeeded: resultSeed.approvalNeeded,
      nowIso: nowIso(),
    });
    const completedJob = updateTrainerJobStatus({
      trainerJobId: job.trainerJobId,
      status: 'succeeded',
      nowIso: nowIso(),
    });

    return sendPortalApiSuccess(res, {
      houseId: context.houseId,
      teamId: context.activeTeamId,
      activeConfigVersionId,
      trainerJobId: completedJob.trainerJobId,
      status: completedJob.status,
      jobKind: completedJob.jobKind,
      result: {
        trainerResultId: result.trainerResultId,
        status: result.status,
        approvalNeeded: result.approvalNeeded,
      },
    }, { status: 201, requestId });
  });

  app.post('/api/platform/trainer/results/:trainerResultId/promote-patch', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before promoting a trainer patch.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'ACTIVE_TEAM_REQUIRED', 'Select an active team before promoting a trainer patch.', { requestId });
    }

    const trainerResultId = typeof req.params?.trainerResultId === 'string' ? req.params.trainerResultId.trim() : '';
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    const approvalId = typeof req.body?.approvalId === 'string' ? req.body.approvalId.trim() : '';
    if (!trainerResultId || !idempotencyKey) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'trainerResultId and Idempotency-Key are required.', { requestId });
    }

    const result = getTrainerResultById(trainerResultId);
    if (!result) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Trainer result not found.', { requestId });
    }
    const job = getTrainerJobById(result.trainerJobId);
    if (!job) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Trainer job not found.', { requestId });
    }
    if (job.houseId !== context.houseId || job.teamId !== context.activeTeamId) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'Trainer result does not belong to the active House team.', { requestId });
    }

    const candidatePatchId = typeof req.body?.candidatePatchId === 'string' && req.body.candidatePatchId.trim()
      ? req.body.candidatePatchId.trim()
      : String(result.candidatePatchIds?.[0] || '').trim();
    if (!candidatePatchId) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'candidatePatchId is required.', { requestId });
    }
    if (!result.candidatePatchIds.includes(candidatePatchId)) {
      return sendPortalApiError(res, 404, 'TRAINER_PATCH_NOT_FOUND', 'Candidate patch not found on this trainer result.', { requestId });
    }
    if (result.approvalNeeded) {
      const approval = resolveApprovedTrainerPatchPromotion(approvalId, {
        houseId: context.houseId,
        trainerResultId,
        candidatePatchId,
      });
      if (!approval) {
        return sendPortalApiError(res, 409, 'APPROVAL_REQUIRED', 'Patch promotion requires an approved decision.', { requestId });
      }
    }

    const replayedConfig = getConfigVersionByIdempotency({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey,
    });
    if (replayedConfig) {
      const replayedBinding = upsertTeamConfigBinding({
        teamBindingId: `tb_${randomHex(10)}`,
        houseId: context.houseId,
        teamId: context.activeTeamId,
        activeConfigVersionId: replayedConfig.configVersionId,
        nowIso: nowIso(),
      });
      return sendPortalApiSuccess(res, {
        houseId: context.houseId,
        teamId: context.activeTeamId,
        configVersionId: replayedConfig.configVersionId,
        activeConfigVersionId: replayedBinding.activeConfigVersionId,
        config: replayedConfig,
        binding: replayedBinding,
      }, { requestId });
    }

    const parentConfigVersionId = result.linkedConfigVersionId
      || resolvePlatformTrainerLinkedConfigVersionId({
        houseId: context.houseId,
        teamId: context.activeTeamId,
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
      houseId: context.houseId,
      teamId: context.activeTeamId,
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
      houseId: context.houseId,
      teamId: context.activeTeamId,
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
        createdBy: 'api.platform.trainer.promote-patch',
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
      houseId: context.houseId,
      teamId: context.activeTeamId,
      activeConfigVersionId: newConfigVersionId,
      nowIso: now,
    });
    updateTrainerResultLink({
      trainerResultId,
      linkedConfigVersionId: newConfigVersionId,
      nowIso: now,
    });
    return sendPortalApiSuccess(res, {
      houseId: context.houseId,
      teamId: context.activeTeamId,
      configVersionId: config.configVersionId,
      activeConfigVersionId: binding.activeConfigVersionId,
      config,
      binding,
    }, { status: 201, requestId });
  });
}

module.exports = {
  registerPlatformReadRoutes,
};
