function registerPlatformReadRoutes(app, deps) {
  const {
    express,
    buildDefaultCompiledSkillPack,
    buildPlatformContextResponse,
    buildPlatformTrainerResultPayload,
    buildPortalRequestId,
    createHouseStaffAssignment,
    createHouseWorkerDeployment,
    createHouseWorkerSession,
    createHouseWorkerSessionEvent,
    createHouseWorkerShare,
    createHouseWorkerShareInvite,
    createTrainerJob,
    createTrainerResult,
    ensureHouseOfficeStructure,
    getConfigVersion,
    getConfigVersionByIdempotency,
    getHouseWorkerDeploymentById,
    getHouseWorkerShareById,
    getHouseWorkerShareInviteById,
    getHouseWorkerSessionById,
    getRegistryEntityById,
    getRegistryEntityByIdAtVersion,
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
    listHouseWorkerShareInvites,
    listHouseWorkerSessionEvents,
    listHouseWorkerSessions,
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
    updateHouseWorkerDeployment,
    updateHouseWorkerShareInvite,
    updateTrainerJobStatus,
    updateHouseWorkerSession,
    updateTrainerResultLink,
    upsertConfigVersion,
    upsertTeamConfigBinding,
    removeHouseWorkerDeployment,
  } = deps;

  const HOUSE_WORKER_ACTIVE_STATUSES = new Set(['starting', 'ready', 'idle', 'working', 'waiting', 'blocked']);
  const HOUSE_WORKER_SHARE_KINDS = new Set(['single_worker', 'office_pack']);
  const HOUSE_WORKER_DEPLOYMENT_LIFECYCLE_STATES = new Set(['active', 'paused', 'archived']);
  const HOUSE_WORKER_ALLOWED_SPAWN_KEYS = new Set([
    'deploymentId',
    'task',
    'reason',
    'brainProfileId',
    'workspaceSeedRef',
    'configVersionId',
    'loadoutId',
    'officeId',
    'parentWorkerSessionId',
    'spawnSource',
  ]);
  const HOUSE_WORKER_ALLOWED_STATUS_VALUES = new Set(['starting', 'ready', 'idle', 'working', 'waiting', 'blocked', 'stopped', 'failed']);
  const HOUSE_WORKER_ALLOWED_DEPLOYMENT_ACTIONS = new Set(['pause', 'resume', 'archive', 'remove', 'reinstall', 'update']);
  const HOUSE_WORKER_MAX_ACTIVE_SESSIONS = Math.max(
    1,
    Number(getUnifiedPlatformTestFixture('worker_spawn_guardrail_seed')?.maxActiveSessions || 3)
  );
  const HOUSE_WORKER_SHARE_DEFAULT_TTL_DAYS = Math.max(
    1,
    Number(getUnifiedPlatformTestFixture('worker_share_lifecycle_seed')?.defaultTtlDays || 7)
  );
  const HOUSE_WORKER_LEASE_HEARTBEAT_MS = Math.max(
    1000,
    Number(getUnifiedPlatformTestFixture('worker_runtime_lease_seed')?.heartbeatIntervalMs || 2500)
  );
  const HOUSE_WORKER_LEASE_TTL_MS = Math.max(
    HOUSE_WORKER_LEASE_HEARTBEAT_MS + 1000,
    Number(getUnifiedPlatformTestFixture('worker_runtime_lease_seed')?.leaseTtlMs || 9000)
  );
  const HOUSE_WORKER_MAX_DELEGATION_DEPTH = Math.max(
    1,
    Number(getUnifiedPlatformTestFixture('worker_nested_delegation_seed')?.maxDelegationDepth || 2)
  );
  const HOUSE_WORKER_DELEGATION_BUDGET = Math.max(
    1,
    Number(getUnifiedPlatformTestFixture('worker_nested_delegation_seed')?.delegationBudget || HOUSE_WORKER_MAX_ACTIVE_SESSIONS)
  );
  const HOUSE_WORKER_ALLOWED_BRAIN_PROFILE_IDS = new Set(['brain:current-runtime', 'local_default']);

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
    const resolvedPackage = {
      registryEntityId: String(source?.registryEntityId || source?.registryId || '').trim(),
      entityVersionId: String(source?.entityVersionId || '').trim(),
      versionLabel: String(workerPackage?.versionLabel || source?.versionLabel || '').trim() || null,
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
    resolvedPackage.compatibilityLabel = buildHouseWorkerCompatibilityLabel(resolvedPackage);
    return resolvedPackage;
  }

  function buildHouseWorkerReleaseLabel(packageInfo = null) {
    const source = packageInfo && typeof packageInfo === 'object' ? packageInfo : {};
    const versionLabel = String(source?.versionLabel || '').trim();
    if (versionLabel) return `Release ${versionLabel}`;
    const entityVersionId = String(source?.entityVersionId || '').trim();
    return entityVersionId ? `Release ${entityVersionId}` : 'Release unavailable';
  }

  function buildHouseWorkerCompatibilityLabel(packageInfo = null, {
    shared = false,
  } = {}) {
    const releaseLabel = buildHouseWorkerReleaseLabel(packageInfo).toLowerCase();
    const prefix = shared ? 'This link installs' : 'Install uses';
    const setupTail = packageInfo?.requiresLocalBrain === true
      ? ' Local brain setup stays local to the receiving House.'
      : '';
    return `${prefix} exactly ${releaseLabel} from Registry.${setupTail}`.trim();
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
    const compatibilitySource = {
      versionLabel: String(sourceDeployment?.summary?.versionLabel || sourcePackage?.versionLabel || '').trim() || null,
      entityVersionId: String(sourceDeployment?.entityVersionId || sourcePackage?.entityVersionId || '').trim() || null,
      requiresLocalBrain: sourceDeployment?.summary?.requiresLocalBrain === true || sourcePackage?.requiresLocalBrain === true,
    };
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
      versionLabel: String(sourceDeployment?.summary?.versionLabel || sourcePackage?.versionLabel || '').trim() || null,
      compatibilityLabel: buildHouseWorkerCompatibilityLabel(compatibilitySource, { shared: true }),
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

  function buildHouseWorkerOfficePackPortablePayload({
    deployments = [],
  } = {}) {
    const members = (Array.isArray(deployments) ? deployments : [])
      .map((deployment) => {
        const runtimeDefaults = deployment?.runtimeDefaults && typeof deployment.runtimeDefaults === 'object'
          ? deployment.runtimeDefaults
          : {};
        return {
          deploymentId: String(deployment?.deploymentId || '').trim() || null,
          displayName: String(deployment?.displayName || 'Helper').trim() || 'Helper',
          officeId: String(deployment?.officeId || '').trim() || null,
          officeLabel: String(deployment?.officeLabel || deployment?.officeId || 'Office').trim() || 'Office',
          registryEntityId: String(deployment?.registryEntityId || '').trim(),
          entityVersionId: String(deployment?.entityVersionId || '').trim(),
          versionLabel: String(deployment?.versionLabel || '').trim() || null,
          loadoutId: String(deployment?.loadoutId || '').trim() || null,
          bundleHash: String(deployment?.bundleHash || '').trim() || null,
          oneLineBenefit: String(deployment?.oneLineBenefit || '').trim() || null,
          whatItDoes: String(deployment?.whatItDoes || '').trim() || null,
          supportedSurfaces: Array.isArray(deployment?.supportedSurfaces)
            ? deployment.supportedSurfaces
            : [],
          requiresLocalBrain: deployment?.requiresLocalBrain === true,
          runtimeDefaults: {
            brainProfileId: String(runtimeDefaults?.brainProfileId || '').trim() || null,
            workspaceSeedRef: String(runtimeDefaults?.workspaceSeedRef || '').trim() || null,
            configVersionId: String(runtimeDefaults?.configVersionId || '').trim() || null,
            loadoutId: String(runtimeDefaults?.loadoutId || deployment?.loadoutId || '').trim() || null,
            delegationAllowed: runtimeDefaults?.delegationAllowed === true,
          },
        };
      })
      .filter((member) => member.registryEntityId && member.entityVersionId);
    const memberCount = members.length;
    const officeLabels = Array.from(new Set(members.map((member) => String(member?.officeLabel || '').trim()).filter(Boolean)));
    return {
      schema: 'agent-town-house-worker-office-pack-share/v1',
      shareKind: 'office_pack',
      displayName: memberCount > 1
        ? `Office Pack · ${memberCount} helpers`
        : 'Office Pack',
      oneLineBenefit: memberCount > 1
        ? `Install ${memberCount} helpers into matching House Office desks in one step.`
        : 'Install this House helper setup in one step.',
      whatItDoes: officeLabels.length
        ? `Recreates helper placement for ${officeLabels.join(', ')}.`
        : 'Recreates the shared helper placement plan in another House.',
      memberCount,
      officeLabels,
      members,
      requiresLocalBrain: members.some((member) => member.requiresLocalBrain === true),
      secretBoundarySummary: 'Portable office packs keep local brain setup, live sessions, and House-only secrets out of the share.',
    };
  }

  function resolveHouseWorkerDeploymentSharePackage(deployment = null) {
    const registryEntityId = String(deployment?.registryEntityId || '').trim();
    const entityVersionId = String(deployment?.entityVersionId || '').trim();
    const deploymentLoadoutId = String(deployment?.loadoutId || '').trim();
    const deploymentBundleHash = String(deployment?.bundleHash || '').trim();
    if (!registryEntityId || !entityVersionId) {
      return {
        ok: false,
        status: 409,
        code: 'DEPLOYMENT_PACKAGE_VERSION_INVALID',
        message: 'This installed helper is missing its exact Registry package version and cannot be shared safely.',
      };
    }

    const exactEntity = getRegistryEntityByIdAtVersion(registryEntityId, entityVersionId);
    const canonicalPackage = resolveHouseWorkerPackage(exactEntity);
    if (!exactEntity || !canonicalPackage) {
      return {
        ok: false,
        status: 409,
        code: 'DEPLOYMENT_PACKAGE_VERSION_INVALID',
        message: 'This installed helper is out of date and can no longer be shared safely. Reinstall it from Registry first.',
      };
    }

    const loadouts = Array.isArray(exactEntity?.loadouts) ? exactEntity.loadouts : [];
    const canonicalLoadoutId = String(canonicalPackage?.loadoutId || canonicalPackage?.runtimeDefaults?.loadoutId || '').trim();
    const desiredLoadoutId = deploymentLoadoutId || canonicalLoadoutId;
    const selectedLoadout = desiredLoadoutId
      ? (loadouts.find((entry) => String(entry?.loadoutId || '').trim() === desiredLoadoutId) || null)
      : null;
    if (desiredLoadoutId && !selectedLoadout) {
      return {
        ok: false,
        status: 409,
        code: 'DEPLOYMENT_PACKAGE_LOADOUT_INVALID',
        message: 'This installed helper points to a loadout that no longer exists. Reinstall it from Registry before sharing.',
      };
    }

    const candidateBundles = selectedLoadout
      ? (Array.isArray(selectedLoadout?.bundles) ? selectedLoadout.bundles : [])
      : loadouts.flatMap((entry) => (Array.isArray(entry?.bundles) ? entry.bundles : []));
    const canonicalBundleHash = String(canonicalPackage?.bundleHash || '').trim();
    const desiredBundleHash = deploymentBundleHash || canonicalBundleHash;
    const selectedBundle = desiredBundleHash
      ? (candidateBundles.find((entry) => String(entry?.contentHash || '').trim() === desiredBundleHash) || null)
      : (candidateBundles[0] || null);
    if (desiredBundleHash && !selectedBundle) {
      return {
        ok: false,
        status: 409,
        code: 'DEPLOYMENT_PACKAGE_BUNDLE_INVALID',
        message: 'This installed helper points to a portable bundle that no longer exists. Reinstall it from Registry before sharing.',
      };
    }

    return {
      ok: true,
      packageInfo: {
        ...canonicalPackage,
        loadoutId: desiredLoadoutId || null,
        bundleHash: String(selectedBundle?.contentHash || desiredBundleHash || canonicalPackage?.bundleHash || '').trim() || null,
        runtimeDefaults: {
          ...canonicalPackage.runtimeDefaults,
          loadoutId: desiredLoadoutId || null,
          delegationAllowed: canonicalPackage?.runtimeDefaults?.delegationAllowed === true,
        },
      },
    };
  }

  function resolveSharedHouseWorkerInstallPackage(share = null) {
    const portablePayload = share?.payload && typeof share.payload === 'object' ? share.payload : {};
    const canonicalPackageShare = share?.packageShareId
      ? getHouseWorkerShareById(share.packageShareId)
      : null;
    const sharedRegistryEntityId = String(
      share?.registryEntityId
      || canonicalPackageShare?.registryEntityId
      || portablePayload?.registryEntityId
      || ''
    ).trim();
    const sharedEntityVersionId = String(
      share?.entityVersionId
      || canonicalPackageShare?.entityVersionId
      || portablePayload?.entityVersionId
      || ''
    ).trim();
    const sharedLoadoutId = String(
      share?.loadoutId
      || canonicalPackageShare?.loadoutId
      || portablePayload?.loadoutId
      || portablePayload?.runtimeDefaults?.loadoutId
      || ''
    ).trim();
    const sharedBundleHash = String(
      share?.bundleHash
      || canonicalPackageShare?.bundleHash
      || portablePayload?.bundleHash
      || ''
    ).trim();
    const payloadRegistryEntityId = String(portablePayload?.registryEntityId || '').trim();
    const payloadEntityVersionId = String(portablePayload?.entityVersionId || '').trim();
    const payloadLoadoutId = String(portablePayload?.loadoutId || portablePayload?.runtimeDefaults?.loadoutId || '').trim();
    const payloadBundleHash = String(portablePayload?.bundleHash || '').trim();

    if (!sharedRegistryEntityId || !sharedEntityVersionId) {
      return {
        ok: false,
        status: 409,
        code: 'SHARED_WORKER_PAYLOAD_INVALID',
        message: 'This shared helper link is missing the exact helper package identity.',
      };
    }

    const parityChecks = [
      ['registryEntityId', sharedRegistryEntityId, payloadRegistryEntityId],
      ['entityVersionId', sharedEntityVersionId, payloadEntityVersionId],
      ['loadoutId', sharedLoadoutId, payloadLoadoutId],
      ['bundleHash', sharedBundleHash, payloadBundleHash],
    ];
    for (const [field, rowValue, payloadValue] of parityChecks) {
      if (rowValue && payloadValue && rowValue !== payloadValue) {
        return {
          ok: false,
          status: 409,
          code: 'SHARED_WORKER_PAYLOAD_MISMATCH',
          message: 'This shared helper link no longer matches its signed package details. Ask your friend to send a fresh link.',
          details: {
            field,
          },
        };
      }
    }

    const exactEntity = getRegistryEntityByIdAtVersion(sharedRegistryEntityId, sharedEntityVersionId);
    const canonicalPackage = resolveHouseWorkerPackage(exactEntity);
    if (!exactEntity || !canonicalPackage) {
      return {
        ok: false,
        status: 409,
        code: 'SHARED_WORKER_VERSION_INVALID',
        message: 'This shared helper link is out of date. Ask your friend to send a fresh link.',
      };
    }

    const loadouts = Array.isArray(exactEntity?.loadouts) ? exactEntity.loadouts : [];
    const canonicalLoadoutId = String(canonicalPackage?.loadoutId || canonicalPackage?.runtimeDefaults?.loadoutId || '').trim();
    const desiredLoadoutId = sharedLoadoutId || payloadLoadoutId || canonicalLoadoutId;
    const selectedLoadout = desiredLoadoutId
      ? (loadouts.find((entry) => String(entry?.loadoutId || '').trim() === desiredLoadoutId) || null)
      : null;
    if (desiredLoadoutId && !selectedLoadout) {
      return {
        ok: false,
        status: 409,
        code: 'SHARED_WORKER_LOADOUT_INVALID',
        message: 'This shared helper link points to a setup that is no longer available. Ask your friend to send a fresh link.',
      };
    }

    const candidateBundles = selectedLoadout
      ? (Array.isArray(selectedLoadout?.bundles) ? selectedLoadout.bundles : [])
      : loadouts.flatMap((entry) => (Array.isArray(entry?.bundles) ? entry.bundles : []));
    const canonicalBundleHash = String(canonicalPackage?.bundleHash || '').trim();
    const desiredBundleHash = sharedBundleHash || payloadBundleHash || canonicalBundleHash;
    const selectedBundle = desiredBundleHash
      ? (candidateBundles.find((entry) => String(entry?.contentHash || '').trim() === desiredBundleHash) || null)
      : (candidateBundles[0] || null);
    if (desiredBundleHash && !selectedBundle) {
      return {
        ok: false,
        status: 409,
        code: 'SHARED_WORKER_BUNDLE_INVALID',
        message: 'This shared helper link points to a portable bundle that is no longer available. Ask your friend to send a fresh link.',
      };
    }

    const portableRuntimeDefaults = portablePayload?.runtimeDefaults && typeof portablePayload.runtimeDefaults === 'object'
      ? portablePayload.runtimeDefaults
      : {};
    const portableBrainProfileId = String(portableRuntimeDefaults?.brainProfileId || '').trim() || null;
    const portableWorkspaceSeedRef = String(portableRuntimeDefaults?.workspaceSeedRef || '').trim() || null;
    const portableConfigVersionId = String(portableRuntimeDefaults?.configVersionId || '').trim() || null;
    for (const [field, value] of [
      ['brainProfileId', portableBrainProfileId],
      ['workspaceSeedRef', portableWorkspaceSeedRef],
      ['configVersionId', portableConfigVersionId],
    ]) {
      if (!value) continue;
      if (!isSafeHouseWorkerReference(value, {
        allowEmpty: true,
        maxLen: field === 'workspaceSeedRef' ? 260 : 180,
      })) {
        return {
          ok: false,
          status: 409,
          code: 'SHARED_WORKER_RUNTIME_DEFAULT_INVALID',
          message: `This shared helper link contains an invalid ${field} runtime default.`,
          details: {
            field,
          },
        };
      }
    }

    return {
      ok: true,
      packageInfo: {
        ...canonicalPackage,
        loadoutId: desiredLoadoutId || null,
        bundleHash: String(selectedBundle?.contentHash || desiredBundleHash || canonicalPackage?.bundleHash || '').trim() || null,
        compatibilityLabel: buildHouseWorkerCompatibilityLabel(canonicalPackage, { shared: true }),
        defaultDisplayName: String(portablePayload?.displayName || canonicalPackage?.defaultDisplayName || canonicalPackage?.displayName || '').trim(),
        runtimeDefaults: {
          ...canonicalPackage.runtimeDefaults,
          brainProfileId: portableBrainProfileId || canonicalPackage?.runtimeDefaults?.brainProfileId || null,
          workspaceSeedRef: portableWorkspaceSeedRef || canonicalPackage?.runtimeDefaults?.workspaceSeedRef || null,
          configVersionId: portableConfigVersionId || canonicalPackage?.runtimeDefaults?.configVersionId || null,
          loadoutId: desiredLoadoutId || null,
          delegationAllowed: canonicalPackage?.runtimeDefaults?.delegationAllowed === true,
        },
      },
      canonicalShare: buildHouseWorkerShareResponse({
        ...share,
        payload: {
          ...portablePayload,
          registryEntityId: sharedRegistryEntityId,
          entityVersionId: sharedEntityVersionId,
          loadoutId: desiredLoadoutId || null,
          bundleHash: String(selectedBundle?.contentHash || desiredBundleHash || canonicalPackage?.bundleHash || '').trim() || null,
          versionLabel: String(canonicalPackage?.versionLabel || '').trim() || null,
          compatibilityLabel: buildHouseWorkerCompatibilityLabel(canonicalPackage, { shared: true }),
          oneLineBenefit: String(canonicalPackage?.oneLineBenefit || '').trim(),
          whatItDoes: String(canonicalPackage?.whatItDoes || '').trim(),
          bestFor: Array.isArray(canonicalPackage?.bestFor) ? canonicalPackage.bestFor : [],
          recommendedOfficeId: String(canonicalPackage?.recommendedOfficeId || '').trim() || null,
          recommendedOfficeLabel: String(canonicalPackage?.recommendedOfficeLabel || '').trim() || null,
          supportedSurfaces: Array.isArray(canonicalPackage?.supportedSurfaces) ? canonicalPackage.supportedSurfaces : [],
          requiresLocalBrain: canonicalPackage?.requiresLocalBrain === true,
          delegationAllowed: canonicalPackage?.delegationAllowed === true,
          runtimeDefaults: {
            ...portableRuntimeDefaults,
            brainProfileId: portableBrainProfileId || canonicalPackage?.runtimeDefaults?.brainProfileId || null,
            workspaceSeedRef: portableWorkspaceSeedRef || canonicalPackage?.runtimeDefaults?.workspaceSeedRef || null,
            configVersionId: portableConfigVersionId || canonicalPackage?.runtimeDefaults?.configVersionId || null,
            loadoutId: desiredLoadoutId || null,
            delegationAllowed: canonicalPackage?.runtimeDefaults?.delegationAllowed === true,
          },
        },
      }),
    };
  }

  function resolveHouseWorkerOfficePackInstallPackage(invite = null) {
    const payload = invite?.payload && typeof invite.payload === 'object' ? invite.payload : {};
    const members = Array.isArray(payload?.members) ? payload.members : [];
    if (members.length < 2) {
      return {
        ok: false,
        status: 409,
        code: 'OFFICE_PACK_MEMBERS_INVALID',
        message: 'This office pack no longer contains enough helpers to install safely.',
      };
    }
    const resolvedMembers = [];
    for (const member of members) {
      const resolved = resolveSharedHouseWorkerInstallPackage({
        payload: member,
      });
      if (!resolved?.ok || !resolved?.packageInfo) {
        return resolved;
      }
      resolvedMembers.push({
        member,
        packageInfo: resolved.packageInfo,
      });
    }
    return {
      ok: true,
      members: resolvedMembers,
      canonicalShare: buildHouseWorkerShareInviteResponse(invite),
    };
  }

  function resolveHouseWorkerShareInviteForPreview(invite = null) {
    const shareKind = normalizeHouseWorkerShareKind(invite?.shareKind || invite?.payload?.shareKind);
    const status = normalizeHouseWorkerShareStatus(invite?.status, invite?.expiresAt);
    if (status === 'revoked') {
      return {
        ok: false,
        status: 409,
        code: 'SHARE_REVOKED',
        message: 'This helper link was revoked. Ask your friend to send a fresh link.',
      };
    }
    if (status === 'expired') {
      return {
        ok: false,
        status: 409,
        code: 'SHARE_EXPIRED',
        message: 'This helper link expired. Ask your friend to send a fresh link.',
      };
    }
    if (shareKind === 'office_pack') {
      return resolveHouseWorkerOfficePackInstallPackage(invite);
    }
    return resolveSharedHouseWorkerInstallPackage(invite);
  }

  function buildHouseWorkerShareCards({
    houseId = '',
    teamId = '',
  } = {}) {
    const shareScopeId = buildHouseWorkerShareScopeId({ houseId, teamId });
    return listHouseWorkerShareInvites({
      shareScopeId,
      createdByHouseId: houseId,
      createdByTeamId: teamId,
    }).map((invite) => {
      const response = buildHouseWorkerShareInviteResponse(invite);
      const payload = invite?.payload && typeof invite.payload === 'object' ? invite.payload : {};
      return {
        ...response,
        title: String(payload?.displayName || 'Helper Link').trim() || 'Helper Link',
        createdAt: invite?.createdAt || null,
        updatedAt: invite?.updatedAt || null,
        revokeAllowed: response.status === 'active',
      };
    });
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
        const lifecycleState = HOUSE_WORKER_DEPLOYMENT_LIFECYCLE_STATES.has(String(deployment?.lifecycleState || '').trim())
          ? String(deployment.lifecycleState).trim()
          : 'active';
        const latestRegistryEntity = getRegistryEntityById(String(deployment?.registryEntityId || '').trim());
        const latestVersionId = String(latestRegistryEntity?.entityVersionId || '').trim();
        const latestVersionLabel = String(latestRegistryEntity?.versionLabel || latestVersionId || '').trim() || null;
        const updateState = latestVersionId && latestVersionId !== String(deployment?.entityVersionId || '').trim()
          ? 'update_available'
          : 'current';
        const updateStateLabel = updateState === 'update_available'
          ? `Update available: install ${latestVersionLabel || 'the latest release'} when you are ready.`
          : 'Release is current and ready to reinstall if needed.';
        const lifecycleLabel = lifecycleState === 'paused'
          ? 'Paused. Resume when you want this helper available again.'
          : lifecycleState === 'archived'
            ? 'Archived. This helper is stored and cannot start until you reinstall it.'
            : buildHouseWorkerStatusExplanation(summary, deployment?.status);
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
          versionLabel: String(summary?.versionLabel || '').trim() || null,
          loadoutId: String(deployment?.loadoutId || '').trim() || null,
          bundleHash: String(deployment?.bundleHash || '').trim() || null,
          displayName: String(deployment?.displayName || '').trim(),
          status: String(deployment?.status || '').trim(),
          lifecycleState,
          lifecycleLabel,
          statusLabel: lifecycleLabel,
          oneLineBenefit: String(summary?.oneLineBenefit || '').trim(),
          whatItDoes: String(summary?.whatItDoes || '').trim(),
          bestFor: Array.isArray(summary?.bestFor) ? summary.bestFor : [],
          supportedSurfaces: Array.isArray(summary?.supportedSurfaces) ? summary.supportedSurfaces : [],
          requiresLocalBrain: summary?.requiresLocalBrain === true,
          compatibilityLabel: String(summary?.compatibilityLabel || '').trim() || null,
          updateState,
          updateStateLabel,
          latestVersionId: latestVersionId || null,
          latestVersionLabel,
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

  function buildHouseWorkerShareScopeId({
    houseId = '',
    teamId = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    if (normalizedHouseId && normalizedTeamId) {
      return `house:${normalizedHouseId}:team:${normalizedTeamId}`;
    }
    return 'public_registry_share';
  }

  function addDurationDaysToIso(baseIso = '', days = 0) {
    const base = new Date(String(baseIso || nowIso()));
    const durationDays = Math.max(0, Number(days || 0));
    if (!Number.isFinite(base.getTime())) return null;
    base.setUTCDate(base.getUTCDate() + durationDays);
    return base.toISOString();
  }

  function isExpiredIsoTimestamp(value = '', referenceIso = nowIso()) {
    const target = new Date(String(value || '').trim());
    const reference = new Date(String(referenceIso || nowIso()).trim());
    if (!Number.isFinite(target.getTime()) || !Number.isFinite(reference.getTime())) return false;
    return target.getTime() <= reference.getTime();
  }

  function normalizeHouseWorkerShareKind(value = '') {
    const normalized = String(value || '').trim();
    return HOUSE_WORKER_SHARE_KINDS.has(normalized) ? normalized : 'single_worker';
  }

  function normalizeHouseWorkerShareStatus(value = '', expiresAt = null) {
    const normalized = String(value || '').trim() || 'active';
    if (normalized === 'revoked') return 'revoked';
    if (expiresAt && isExpiredIsoTimestamp(expiresAt)) return 'expired';
    return 'active';
  }

  function buildHouseWorkerShareStatusLabel(invite = null) {
    const status = normalizeHouseWorkerShareStatus(invite?.status, invite?.expiresAt);
    if (status === 'revoked') return 'Revoked. This friend link no longer installs.';
    if (status === 'expired') return 'Expired. Create a fresh link before sharing again.';
    const expiresAt = String(invite?.expiresAt || '').trim();
    return expiresAt
      ? `Active until ${expiresAt}.`
      : 'Active and ready to share.';
  }

  function buildHouseWorkerShareIdentityKeySingle(payload = null) {
    const source = payload && typeof payload === 'object' ? payload : {};
    return sha256PrefixedHex(stableJsonStringify({
      shareKind: 'single_worker',
      registryEntityId: String(source?.registryEntityId || '').trim(),
      entityVersionId: String(source?.entityVersionId || '').trim(),
      loadoutId: String(source?.loadoutId || source?.runtimeDefaults?.loadoutId || '').trim(),
      bundleHash: String(source?.bundleHash || '').trim(),
    }));
  }

  function buildHouseWorkerShareIdentityKeyPack(payload = null) {
    const source = payload && typeof payload === 'object' ? payload : {};
    const members = Array.isArray(source?.members) ? source.members : [];
    return sha256PrefixedHex(stableJsonStringify({
      shareKind: 'office_pack',
      members: members.map((member) => ({
        officeId: String(member?.officeId || '').trim(),
        registryEntityId: String(member?.registryEntityId || '').trim(),
        entityVersionId: String(member?.entityVersionId || '').trim(),
        loadoutId: String(member?.loadoutId || member?.runtimeDefaults?.loadoutId || '').trim(),
        bundleHash: String(member?.bundleHash || '').trim(),
      })),
    }));
  }

  function buildHouseWorkerShareInviteResponse(invite = null) {
    const payload = invite?.payload && typeof invite.payload === 'object' ? invite.payload : {};
    const shareId = String(invite?.shareId || invite?.shareInviteId || '').trim();
    const shareKind = normalizeHouseWorkerShareKind(invite?.shareKind || payload?.shareKind);
    const memberCount = shareKind === 'office_pack'
      ? Math.max(0, Number(payload?.memberCount || (Array.isArray(payload?.members) ? payload.members.length : 0)))
      : 1;
    return {
      shareId: shareId || null,
      shareKind,
      sharePath: buildHouseWorkerSharePath(shareId),
      portable: payload,
      status: normalizeHouseWorkerShareStatus(invite?.status, invite?.expiresAt),
      statusLabel: buildHouseWorkerShareStatusLabel(invite),
      expiresAt: invite?.expiresAt || null,
      installCount: Math.max(0, Number(invite?.installCount || 0)),
      lastInstalledAt: invite?.lastInstalledAt || null,
      memberCount,
      installActionLabel: shareKind === 'office_pack' ? 'Install Office Pack' : 'Install to My House',
      summary: shareKind === 'office_pack'
        ? String(payload?.oneLineBenefit || '').trim() || 'Install this shared office pack into another House.'
        : String(payload?.oneLineBenefit || '').trim()
          || 'Install this helper into another House without copying secrets.',
      secretBoundarySummary: String(payload?.secretBoundarySummary || '').trim()
        || 'Local brain setup stays local. Portable worker links do not carry live credentials, callbacks, or house session secrets.',
    };
  }

  function buildHouseWorkerShareResponse(share = null) {
    if (share?.shareInviteId || share?.shareKind) {
      return buildHouseWorkerShareInviteResponse(share);
    }
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

  function normalizeHouseWorkerTaskText(value, fallback = '') {
    const candidate = String(value || fallback || '').trim();
    if (!candidate) return '';
    if (candidate.length > 280) return '';
    return candidate;
  }

  function normalizeHouseWorkerReason(value, fallback = 'house_office_start') {
    const normalized = String(value || fallback || '').trim().toLowerCase();
    if (!normalized) return 'house_office_start';
    if (!/^[a-z0-9._:-]{1,80}$/.test(normalized)) return '';
    return normalized;
  }

  function normalizeHouseWorkerSpawnSource(value, fallback = 'house_ui') {
    const normalized = String(value || fallback || '').trim().toLowerCase();
    if (!normalized) return 'house_ui';
    if (!/^[a-z0-9._:-]{1,80}$/.test(normalized)) return 'house_ui';
    return normalized;
  }

  function normalizeHouseWorkerStatus(value, fallback = 'starting') {
    const normalized = String(value || '').trim().toLowerCase();
    if (HOUSE_WORKER_ALLOWED_STATUS_VALUES.has(normalized)) return normalized;
    return String(fallback || 'starting').trim().toLowerCase();
  }

  function buildHouseWorkerSessionStatusLabel(status = '', leaseStatus = '') {
    if (String(leaseStatus || '').trim() === 'stale') return 'Needs restart here';
    const normalized = normalizeHouseWorkerStatus(status, 'starting');
    if (normalized === 'ready' || normalized === 'idle') return 'Ready to help';
    if (normalized === 'working') return 'Working now';
    if (normalized === 'waiting') return 'Waiting for the next step';
    if (normalized === 'blocked') return 'Blocked and needs attention';
    if (normalized === 'stopped') return 'Stopped';
    if (normalized === 'failed') return 'Needs attention';
    return 'Starting helper';
  }

  function buildHouseWorkerRuntimeProfile({
    deployment = null,
    overrides = null,
  } = {}) {
    const runtimeDefaults = deployment?.runtimeDefaults && typeof deployment.runtimeDefaults === 'object'
      ? deployment.runtimeDefaults
      : {};
    const overrideSource = overrides && typeof overrides === 'object' && !Array.isArray(overrides)
      ? overrides
      : {};
    const brainProfileId = String(
      overrideSource?.brainProfileId
      || runtimeDefaults?.brainProfileId
      || 'brain:current-runtime'
    ).trim() || 'brain:current-runtime';
    const workspaceSeedRef = String(
      overrideSource?.workspaceSeedRef
      || runtimeDefaults?.workspaceSeedRef
      || `workspace/house-workers/${String(deployment?.deploymentId || 'helper').trim() || 'helper'}`
    ).trim();
    const configVersionId = String(
      overrideSource?.configVersionId
      || runtimeDefaults?.configVersionId
      || ''
    ).trim() || null;
    const loadoutId = String(
      overrideSource?.loadoutId
      || runtimeDefaults?.loadoutId
      || deployment?.loadoutId
      || ''
    ).trim() || null;
    return {
      brainProfileId,
      workspaceSeedRef: workspaceSeedRef || null,
      configVersionId,
      loadoutId,
    };
  }

  function normalizeHouseWorkerRuntimeIso(value = '') {
    const normalized = String(value || '').trim();
    if (!normalized) return null;
    const ms = Date.parse(normalized);
    if (!Number.isFinite(ms)) return null;
    return new Date(ms).toISOString();
  }

  function buildHouseWorkerLeaseTimestamps(baseMs = Date.now()) {
    const startedMs = Number.isFinite(baseMs) ? baseMs : Date.now();
    return {
      lastHeartbeatAt: new Date(startedMs).toISOString(),
      leaseExpiresAt: new Date(startedMs + HOUSE_WORKER_LEASE_TTL_MS).toISOString(),
    };
  }

  function resolveHouseWorkerBrainProfile(brainProfileId = '') {
    const requestedBrainProfileId = String(brainProfileId || 'brain:current-runtime').trim() || 'brain:current-runtime';
    if (!HOUSE_WORKER_ALLOWED_BRAIN_PROFILE_IDS.has(requestedBrainProfileId)) {
      return {
        ok: false,
        code: 'INVALID_BRAIN_PROFILE',
        message: 'That helper setup cannot use the requested brain yet. Choose the default local brain path instead.',
      };
    }
    return {
      ok: true,
      requestedBrainProfileId,
      appliedBrainProfileId: requestedBrainProfileId === 'local_default'
        ? 'brain:current-runtime'
        : requestedBrainProfileId,
      bindingMode: 'inherit_current_browser_brain',
    };
  }

  function resolveHouseWorkerWorkspaceBinding(workspaceSeedRef = '', deploymentId = '') {
    const requestedWorkspaceSeedRef = String(workspaceSeedRef || '').trim();
    const fallbackPath = `workspace/house-workers/${String(deploymentId || 'helper').trim() || 'helper'}`;
    const candidate = requestedWorkspaceSeedRef || fallbackPath;
    if (candidate.startsWith('workspace/house-workers/')) {
      return {
        ok: true,
        requestedWorkspaceSeedRef: candidate,
        workspacePath: candidate,
        bindingMode: 'workspace_path',
      };
    }
    if (candidate.startsWith('seed://house-workers/')) {
      const suffix = candidate.slice('seed://house-workers/'.length).replace(/^\/+/, '');
      if (!suffix) {
        return {
          ok: false,
          code: 'INVALID_WORKSPACE_SEED_REF',
          message: 'That helper workspace location is not available. Use the default House helper workspace.',
        };
      }
      return {
        ok: true,
        requestedWorkspaceSeedRef: candidate,
        workspacePath: `workspace/house-workers/${suffix}`,
        bindingMode: 'seed_namespace',
      };
    }
    return {
      ok: false,
      code: 'INVALID_WORKSPACE_SEED_REF',
      message: 'That helper workspace location is not available. Use the default House helper workspace.',
    };
  }

  function resolveHouseWorkerRequestedRuntimeProfile({
    deployment = null,
    overrides = null,
  } = {}) {
    const requestedRuntimeProfile = buildHouseWorkerRuntimeProfile({
      deployment,
      overrides,
    });
    const brainResolution = resolveHouseWorkerBrainProfile(requestedRuntimeProfile?.brainProfileId);
    if (!brainResolution?.ok) return brainResolution;
    const workspaceBinding = resolveHouseWorkerWorkspaceBinding(
      requestedRuntimeProfile?.workspaceSeedRef,
      String(deployment?.deploymentId || '').trim()
    );
    if (!workspaceBinding?.ok) return workspaceBinding;
    if (requestedRuntimeProfile?.configVersionId) {
      const requestedConfigVersionId = String(requestedRuntimeProfile.configVersionId || '').trim();
      const configVersion = getConfigVersion(requestedConfigVersionId);
      const fixtureConfigVersionIds = new Set([
        String(getUnifiedPlatformTestFixture('house_workshop_seed')?.activeConfig?.configVersionId || '').trim(),
        String(getUnifiedPlatformTestFixture('worker_spawn_profile_seed')?.configVersionId || '').trim(),
        String(getUnifiedPlatformTestFixture('worker_runtime_profile_seed')?.configVersionId || '').trim(),
        String(getUnifiedPlatformTestFixture('worker_profile_validation_seed')?.valid?.configVersionId || '').trim(),
      ].filter(Boolean));
      if (!configVersion && !fixtureConfigVersionIds.has(requestedConfigVersionId)) {
        return {
          ok: false,
          code: 'INVALID_CONFIG_VERSION_ID',
          message: 'That helper setup points to a House config that does not exist anymore.',
        };
      }
    }
    if (requestedRuntimeProfile?.loadoutId) {
      const allowedLoadoutIds = new Set([
        String(deployment?.loadoutId || '').trim(),
        String(deployment?.runtimeDefaults?.loadoutId || '').trim(),
      ].filter(Boolean));
      const exactPackageResolution = resolveHouseWorkerDeploymentSharePackage(deployment);
      if (exactPackageResolution?.ok) {
        allowedLoadoutIds.add(String(exactPackageResolution?.packageInfo?.loadoutId || '').trim());
        allowedLoadoutIds.add(String(exactPackageResolution?.packageInfo?.runtimeDefaults?.loadoutId || '').trim());
      }
      if (!allowedLoadoutIds.has(String(requestedRuntimeProfile.loadoutId || '').trim())) {
        return {
          ok: false,
          code: 'INVALID_LOADOUT_ID',
          message: 'That helper setup points to a loadout that is not available for this helper package.',
        };
      }
    }
    return {
      ok: true,
      requestedRuntimeProfile,
      appliedRuntimeProfileSeed: {
        brainProfileId: brainResolution.appliedBrainProfileId,
        workspaceSeedRef: workspaceBinding.requestedWorkspaceSeedRef,
        configVersionId: requestedRuntimeProfile?.configVersionId || null,
        loadoutId: requestedRuntimeProfile?.loadoutId || null,
      },
      runtimeBindingSeed: {
        bindingMode: brainResolution.bindingMode,
        requestedWorkspaceSeedRef: workspaceBinding.requestedWorkspaceSeedRef,
        workspacePath: workspaceBinding.workspacePath,
        workspaceBindingMode: workspaceBinding.bindingMode,
        leaseHeartbeatMs: HOUSE_WORKER_LEASE_HEARTBEAT_MS,
        leaseTtlMs: HOUSE_WORKER_LEASE_TTL_MS,
      },
    };
  }

  function buildHouseWorkerLeaseState(session = null) {
    const source = session && typeof session === 'object' ? session : {};
    const runtime = source?.runtime && typeof source.runtime === 'object' ? source.runtime : {};
    const storedStatus = normalizeHouseWorkerStatus(source?.status, 'starting');
    const lastHeartbeatAt = normalizeHouseWorkerRuntimeIso(runtime?.lastHeartbeatAt || runtime?.appliedAt || source?.updatedAt || null);
    const leaseExpiresAt = normalizeHouseWorkerRuntimeIso(runtime?.leaseExpiresAt)
      || (lastHeartbeatAt
        ? normalizeHouseWorkerRuntimeIso(new Date(Date.parse(lastHeartbeatAt) + HOUSE_WORKER_LEASE_TTL_MS).toISOString())
        : null);
    const ownerKind = String(runtime?.ownerKind || '').trim() || null;
    const ownerLabel = String(runtime?.ownerLabel || '').trim() || null;
    const ownerId = String(runtime?.ownerId || '').trim() || null;
    const active = HOUSE_WORKER_ACTIVE_STATUSES.has(storedStatus);
    const stale = active
      && !!leaseExpiresAt
      && Number.isFinite(Date.parse(leaseExpiresAt))
      && Date.parse(leaseExpiresAt) <= Date.now();
    let leaseStatus = 'stopped';
    if (stale) {
      leaseStatus = 'stale';
    } else if (storedStatus === 'failed' || storedStatus === 'blocked') {
      leaseStatus = 'blocked';
    } else if (storedStatus === 'stopped') {
      leaseStatus = 'stopped';
    } else if (active) {
      leaseStatus = 'active_detached';
    }
    return {
      ownerKind,
      ownerLabel,
      ownerId,
      lastHeartbeatAt,
      leaseExpiresAt,
      leaseStatus,
      stale,
    };
  }

  function formatHouseWorkerRelativeAgoLabel(value = '') {
    const normalized = normalizeHouseWorkerRuntimeIso(value);
    if (!normalized) return 'No recent activity yet.';
    const deltaMs = Math.max(0, Date.now() - Date.parse(normalized));
    if (deltaMs < 60_000) return 'moments ago';
    if (deltaMs < 3_600_000) {
      const minutes = Math.max(1, Math.round(deltaMs / 60_000));
      return minutes === 1 ? 'about 1 minute ago' : `about ${minutes} minutes ago`;
    }
    const hours = Math.max(1, Math.round(deltaMs / 3_600_000));
    return hours === 1 ? 'about 1 hour ago' : `about ${hours} hours ago`;
  }

  function buildHouseWorkerRecoveryFields({
    session = null,
    leaseState = null,
    lastTaskEvent = null,
    lastReplyEvent = null,
  } = {}) {
    const source = session && typeof session === 'object' ? session : {};
    const runtime = source?.runtime && typeof source.runtime === 'object' ? source.runtime : {};
    const normalizedLeaseState = leaseState && typeof leaseState === 'object' ? leaseState : buildHouseWorkerLeaseState(source);
    const lastReply = String(lastReplyEvent?.payload?.message || runtime?.lastReply || '').trim();
    const lastTask = String(lastTaskEvent?.payload?.message || runtime?.lastTask || runtime?.task || '').trim();
    const lastCompletedSummary = lastReply
      ? `Last finished: ${lastReply}`
      : lastTask
        ? `Last finished: ${lastTask}`
        : 'Last finished: No completed helper work is recorded yet.';
    const lastActiveAgoLabel = `Last active ${formatHouseWorkerRelativeAgoLabel(
      normalizedLeaseState?.lastHeartbeatAt || source?.updatedAt || source?.createdAt || ''
    )}`;
    const normalizedStatus = normalizeHouseWorkerStatus(source?.status, 'starting');
    let nextRecommendedAction = 'Next step: Start this helper when you want it to help again.';
    let resumeSafetyLabel = 'Safe to do now: Start this helper when you are ready.';
    if (normalizedLeaseState?.stale === true) {
      nextRecommendedAction = 'Next step: Restart this helper here when you want it to continue.';
      resumeSafetyLabel = 'Safe to do now: Restarting here is safe because the earlier copy stopped reporting.';
    } else if (HOUSE_WORKER_ACTIVE_STATUSES.has(normalizedStatus)) {
      nextRecommendedAction = 'Next step: Take over this helper here if you want it to continue in this tab.';
      resumeSafetyLabel = 'Safe to do now: Taking over here restarts this helper in the current browser tab.';
    } else if (normalizedStatus === 'stopped') {
      nextRecommendedAction = 'Next step: Start this helper again when you want more work done.';
      resumeSafetyLabel = 'Safe to do now: Starting again creates a fresh helper run.';
    } else if (normalizedStatus === 'blocked' || normalizedStatus === 'failed') {
      nextRecommendedAction = 'Next step: Review the latest task, then restart or stop this helper.';
      resumeSafetyLabel = 'Safe to do now: Restart only after you understand why the helper stopped.';
    }
    return {
      lastCompletedSummary,
      lastActiveAgoLabel,
      nextRecommendedAction,
      resumeSafetyLabel,
    };
  }

  function buildHouseWorkerDelegationFields(session = null) {
    const source = session && typeof session === 'object' ? session : {};
    const runtime = source?.runtime && typeof source.runtime === 'object' ? source.runtime : {};
    const parentWorkerSessionId = String(source?.parentSessionId || runtime?.parentWorkerSessionId || '').trim() || null;
    const rootWorkerSessionId = String(runtime?.rootWorkerSessionId || source?.houseWorkerSessionId || '').trim() || null;
    const delegationDepth = Math.max(0, Number(runtime?.delegationDepth || 0) || 0);
    const delegationReason = String(runtime?.delegationReason || runtime?.reason || '').trim() || null;
    let delegationLineageLabel = '';
    if (parentWorkerSessionId) {
      delegationLineageLabel = delegationReason
        ? `Requested by another helper for: ${delegationReason}.`
        : 'Requested by another helper.';
    } else if (String(runtime?.spawnSource || '').trim() === 'parent_worker') {
      delegationLineageLabel = delegationReason
        ? `Requested by your main agent for: ${delegationReason}.`
        : 'Requested by your main agent.';
    }
    return {
      parentWorkerSessionId,
      rootWorkerSessionId,
      delegationDepth,
      delegationReason,
      delegationLineageLabel: delegationLineageLabel || null,
    };
  }

  function normalizeHouseWorkerRuntimeProfilePatch(value = null) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    if (!source) return null;
    const patch = {};
    for (const field of ['brainProfileId', 'workspaceSeedRef', 'configVersionId', 'loadoutId']) {
      const normalized = String(source?.[field] || '').trim();
      if (!normalized) {
        patch[field] = null;
        continue;
      }
      if (!isSafeHouseWorkerReference(normalized, {
        allowEmpty: field !== 'brainProfileId',
        maxLen: field === 'workspaceSeedRef' ? 260 : 180,
      })) {
        return null;
      }
      patch[field] = normalized;
    }
    return patch;
  }

  function normalizeHouseWorkerRuntimeBindingPatch(value = null) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    if (!source) return null;
    const patch = {
      bindingMode: String(source?.bindingMode || '').trim() || null,
      runtimeSessionId: String(source?.runtimeSessionId || '').trim() || null,
      requestedWorkspaceSeedRef: String(source?.requestedWorkspaceSeedRef || '').trim() || null,
      workspacePath: String(source?.workspacePath || '').trim() || null,
      workspaceBindingMode: String(source?.workspaceBindingMode || '').trim() || null,
      appliedAt: normalizeHouseWorkerRuntimeIso(source?.appliedAt || null),
      leaseHeartbeatMs: Number(source?.leaseHeartbeatMs || 0) || null,
      leaseTtlMs: Number(source?.leaseTtlMs || 0) || null,
      llmFingerprint: null,
    };
    const stringRefs = [
      ['bindingMode', patch.bindingMode, 80],
      ['runtimeSessionId', patch.runtimeSessionId, 180],
      ['requestedWorkspaceSeedRef', patch.requestedWorkspaceSeedRef, 260],
      ['workspacePath', patch.workspacePath, 260],
      ['workspaceBindingMode', patch.workspaceBindingMode, 80],
    ];
    for (const [, fieldValue, maxLen] of stringRefs) {
      if (!fieldValue) continue;
      if (!isSafeHouseWorkerReference(fieldValue, { allowEmpty: true, maxLen })) {
        return null;
      }
    }
    const llmSource = source?.llmFingerprint && typeof source.llmFingerprint === 'object' && !Array.isArray(source.llmFingerprint)
      ? source.llmFingerprint
      : null;
    if (llmSource) {
      const llmFingerprint = {
        provider: String(llmSource?.provider || '').trim() || null,
        modelId: String(llmSource?.modelId || '').trim() || null,
        modelRef: String(llmSource?.modelRef || '').trim() || null,
        api: String(llmSource?.api || '').trim() || null,
        reasoning: String(llmSource?.reasoning || '').trim() || null,
        useProxy: llmSource?.useProxy !== false,
      };
      for (const [, fieldValue] of Object.entries(llmFingerprint)) {
        if (typeof fieldValue !== 'string' || !fieldValue) continue;
        if (!isSafeHouseWorkerReference(fieldValue, { allowEmpty: true, maxLen: 180 })) {
          return null;
        }
      }
      patch.llmFingerprint = llmFingerprint;
    }
    return patch;
  }

  function mergeHouseWorkerRuntime(existingRuntime = null, patch = null) {
    const current = existingRuntime && typeof existingRuntime === 'object' && !Array.isArray(existingRuntime)
      ? existingRuntime
      : {};
    const nextPatch = patch && typeof patch === 'object' && !Array.isArray(patch)
      ? patch
      : {};
    return {
      ...current,
      ...nextPatch,
    };
  }

  function buildHouseWorkerSessionId({
    houseId = '',
    teamId = '',
    deploymentId = '',
    sequence = 1,
  } = {}) {
    const digest = sha256PrefixedHex(stableJsonStringify({
      houseId,
      teamId,
      deploymentId,
      sequence: Number(sequence || 0),
    })).replace(/^sha256:/i, '');
    return `hws_${digest.slice(0, 24)}`;
  }

  function buildHouseWorkerRuntimeAgentId({
    deploymentId = '',
    sequence = 1,
  } = {}) {
    const digest = sha256PrefixedHex(stableJsonStringify({
      deploymentId,
      sequence: Number(sequence || 0),
    })).replace(/^sha256:/i, '');
    return `helper_${digest.slice(0, 16)}`;
  }

  function buildHouseWorkerSessionEventId({
    houseWorkerSessionId = '',
    eventKind = '',
    sequence = 1,
  } = {}) {
    const digest = sha256PrefixedHex(stableJsonStringify({
      houseWorkerSessionId,
      eventKind,
      sequence: Number(sequence || 0),
    })).replace(/^sha256:/i, '');
    return `hwse_${digest.slice(0, 24)}`;
  }

  function buildHouseWorkerSessionCards({
    houseId = '',
    teamId = '',
    deployments = [],
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    if (!normalizedHouseId || !normalizedTeamId) return [];
    const deploymentList = Array.isArray(deployments) && deployments.length
      ? deployments
      : buildHouseWorkerDeploymentsPayload({
        context: {},
        houseId: normalizedHouseId,
        teamId: normalizedTeamId,
      }).deployments;
    const deploymentMap = new Map(
      deploymentList
        .map((entry) => [String(entry?.deploymentId || '').trim(), entry])
        .filter(([deploymentId]) => deploymentId)
    );
    return listHouseWorkerSessions({ houseId: normalizedHouseId, teamId: normalizedTeamId })
      .map((session) => {
        const deploymentId = String(session?.deploymentId || '').trim();
        if (!deploymentId) return null;
        const deployment = deploymentMap.get(deploymentId) || null;
        const events = listHouseWorkerSessionEvents({
          houseWorkerSessionId: String(session?.houseWorkerSessionId || '').trim(),
        });
        const lastTaskEvent = [...events].reverse().find((entry) => String(entry?.eventKind || '').trim() === 'task_message') || null;
        const lastReplyEvent = [...events].reverse().find((entry) => String(entry?.eventKind || '').trim() === 'assistant_reply') || null;
        const runtime = session?.runtime && typeof session.runtime === 'object' ? session.runtime : {};
        const requestedRuntimeProfile = runtime?.requestedRuntimeProfile && typeof runtime.requestedRuntimeProfile === 'object'
          ? runtime.requestedRuntimeProfile
          : {
            brainProfileId: String(session?.brainProfileId || runtime?.brainProfileId || '').trim() || null,
            workspaceSeedRef: String(session?.workspaceSeedRef || runtime?.workspaceSeedRef || '').trim() || null,
            configVersionId: String(session?.configVersionId || runtime?.configVersionId || '').trim() || null,
            loadoutId: String(session?.loadoutId || runtime?.loadoutId || '').trim() || null,
          };
        const appliedRuntimeProfile = runtime?.appliedRuntimeProfile && typeof runtime.appliedRuntimeProfile === 'object'
          ? runtime.appliedRuntimeProfile
          : requestedRuntimeProfile;
        const leaseState = buildHouseWorkerLeaseState(session);
        const delegation = buildHouseWorkerDelegationFields(session);
        const recovery = buildHouseWorkerRecoveryFields({
          session,
          leaseState,
          lastTaskEvent,
          lastReplyEvent,
        });
        const computedStatus = leaseState.stale
          ? 'stale'
          : normalizeHouseWorkerStatus(session?.status, 'starting');
        return {
          houseWorkerSessionId: String(session?.houseWorkerSessionId || '').trim(),
          deploymentId,
          deploymentLabel: String(deployment?.displayName || session?.label || 'Helper').trim() || 'Helper',
          displayName: String(session?.label || deployment?.displayName || 'Helper').trim() || 'Helper',
          officeId: String(deployment?.officeId || '').trim() || null,
          officeLabel: String(deployment?.officeLabel || '').trim() || null,
          status: computedStatus,
          statusLabel: buildHouseWorkerSessionStatusLabel(session?.status, leaseState.leaseStatus),
          runtimeAgentId: String(session?.runtimeAgentId || '').trim() || null,
          runtimeSessionId: String(runtime?.runtimeSessionId || '').trim() || null,
          parentSessionId: delegation.parentWorkerSessionId,
          rootWorkerSessionId: delegation.rootWorkerSessionId,
          delegationDepth: delegation.delegationDepth,
          delegationReason: delegation.delegationReason,
          delegationLineageLabel: delegation.delegationLineageLabel,
          spawnSource: String(runtime?.spawnSource || '').trim() || null,
          latestTask: String(lastTaskEvent?.payload?.message || runtime?.task || '').trim() || null,
          latestReply: String(lastReplyEvent?.payload?.message || runtime?.lastReply || '').trim() || null,
          lastCompletedSummary: recovery.lastCompletedSummary,
          lastActiveAgoLabel: recovery.lastActiveAgoLabel,
          nextRecommendedAction: recovery.nextRecommendedAction,
          resumeSafetyLabel: recovery.resumeSafetyLabel,
          runtimeProfile: appliedRuntimeProfile,
          requestedRuntimeProfile,
          appliedRuntimeProfile,
          runtimeBinding: runtime?.runtimeBinding && typeof runtime.runtimeBinding === 'object'
            ? runtime.runtimeBinding
            : null,
          ownerKind: leaseState.ownerKind,
          ownerLabel: leaseState.ownerLabel,
          ownerId: leaseState.ownerId,
          leaseStatus: leaseState.leaseStatus,
          lastHeartbeatAt: leaseState.lastHeartbeatAt,
          leaseExpiresAt: leaseState.leaseExpiresAt,
          eventCount: events.length,
          recentEvents: events.slice(-10).map((event) => ({
            houseWorkerSessionEventId: String(event?.houseWorkerSessionEventId || '').trim(),
            eventKind: String(event?.eventKind || '').trim(),
            actor: String(event?.actor || '').trim(),
            payload: event?.payload && typeof event.payload === 'object' ? event.payload : {},
            createdAt: String(event?.createdAt || '').trim(),
          })),
          createdAt: String(session?.createdAt || '').trim(),
          updatedAt: String(session?.updatedAt || '').trim(),
        };
      })
      .filter(Boolean);
  }

  function buildHouseWorkerCollectionsPayload({
    context = {},
    houseId = '',
    teamId = '',
    sourceKind = 'durable_house_workers',
  } = {}) {
    const deploymentsPayload = buildHouseWorkerDeploymentsPayload({
      context,
      houseId,
      teamId,
      sourceKind,
    });
    const sessions = buildHouseWorkerSessionCards({
      houseId,
      teamId,
      deployments: Array.isArray(deploymentsPayload?.deployments) ? deploymentsPayload.deployments : [],
    });
    return {
      houseId: deploymentsPayload.houseId,
      teamId: deploymentsPayload.teamId,
      activeTeamId: deploymentsPayload.activeTeamId,
      availableTeamIds: deploymentsPayload.availableTeamIds,
      deployments: Array.isArray(deploymentsPayload?.deployments) ? deploymentsPayload.deployments : [],
      sessions,
      concurrencyLimit: HOUSE_WORKER_MAX_ACTIVE_SESSIONS,
      sourceManifest: {
        ...(deploymentsPayload.sourceManifest && typeof deploymentsPayload.sourceManifest === 'object'
          ? deploymentsPayload.sourceManifest
          : {}),
        schema: 'agent-town-house-workers/v1',
        routes: [
          '/api/platform/house-workers',
          '/api/platform/house-workers/deployments',
          '/api/platform/house-workers/shares',
          '/api/platform/house-workers/sessions',
          '/api/platform/house-workers/live-readiness',
          '/api/platform/house-workers/install',
          '/api/platform/house-workers/share',
          '/api/platform/house-workers/shares/:shareId',
          '/api/platform/house-workers/shares/:shareId/revoke',
          '/api/platform/house-workers/install-shared',
          '/api/platform/house-workers/deployments/:deploymentId/lifecycle',
          '/api/platform/house-workers/spawn',
          '/api/platform/house-workers/message',
          '/api/platform/house-workers/status',
          '/api/platform/house-workers/stop',
        ],
        fixtures: [
          'worker_package_registry_seed',
          'worker_package_install_seed',
          'worker_package_share_seed',
          'worker_runtime_supervisor_seed',
          'worker_runtime_profile_seed',
          'worker_runtime_lease_seed',
          'worker_nested_delegation_seed',
          'worker_recovery_summary_seed',
          'worker_default_user_language_seed',
          'worker_live_readiness_seed',
          'worker_runtime_reality_smoke_seed',
          'worker_spawn_profile_seed',
          'worker_spawn_guardrail_seed',
          'worker_share_lifecycle_seed',
          'worker_deployment_lifecycle_seed',
          'worker_office_pack_seed',
        ],
        counts: {
          deploymentCount: Array.isArray(deploymentsPayload?.deployments) ? deploymentsPayload.deployments.length : 0,
          shareCount: buildHouseWorkerShareCards({ houseId, teamId }).length,
          sessionCount: sessions.length,
          activeSessionCount: sessions.filter((entry) => HOUSE_WORKER_ACTIVE_STATUSES.has(String(entry?.status || '').trim())).length,
        },
      },
      emptyStateText: deploymentsPayload.emptyStateText,
    };
  }

  function stopHouseWorkerSessionsForDeployment({
    houseId = '',
    teamId = '',
    deploymentId = '',
    actor = 'human',
    reason = 'deployment_lifecycle',
    now = nowIso(),
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    const normalizedDeploymentId = String(deploymentId || '').trim();
    if (!normalizedHouseId || !normalizedTeamId || !normalizedDeploymentId) return [];
    const sessions = listHouseWorkerSessions({
      houseId: normalizedHouseId,
      teamId: normalizedTeamId,
    }).filter((entry) => String(entry?.deploymentId || '').trim() === normalizedDeploymentId);
    const stopped = [];
    for (const session of sessions) {
      const status = normalizeHouseWorkerStatus(session?.status, '');
      if (!HOUSE_WORKER_ACTIVE_STATUSES.has(status)) continue;
      const houseWorkerSessionId = String(session?.houseWorkerSessionId || '').trim();
      const updatedSession = updateHouseWorkerSession({
        houseWorkerSessionId,
        status: 'stopped',
        runtime: mergeHouseWorkerRuntime(session?.runtime, {
          stopReason: reason || 'deployment_lifecycle',
        }),
        updatedAt: now,
      });
      const eventSequence = listHouseWorkerSessionEvents({ houseWorkerSessionId }).length + 1;
      createHouseWorkerSessionEvent({
        houseWorkerSessionEventId: buildHouseWorkerSessionEventId({
          houseWorkerSessionId,
          eventKind: 'stopped',
          sequence: eventSequence,
        }),
        houseWorkerSessionId,
        eventKind: 'stopped',
        actor: actor || 'human',
        payload: {
          reason: reason || 'deployment_lifecycle',
        },
        createdAt: now,
      });
      stopped.push(updatedSession);
    }
    return stopped;
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
    if (normalizedRequestedTeamId === activeTeamId) {
      return {
        ok: true,
        teamId: normalizedRequestedTeamId,
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
    const workerShares = houseId && teamId
      ? buildHouseWorkerShareCards({
        houseId,
        teamId,
      })
      : [];
    const workerSessions = houseId && teamId
      ? buildHouseWorkerSessionCards({
        houseId,
        teamId,
        deployments,
      })
      : [];
    const briefingItemCount = countHouseOfficeBriefingItems(briefing);
    const activityCount = trainerJobs.length
      + trainerResults.length
      + archiveRuns.length
      + tracksPayload.events.length
      + assignments.length
      + deployments.length
      + workerSessions.length
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
      workerShares,
      workerSessions,
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
          '/api/platform/house-workers/shares',
          '/api/platform/house-workers/sessions',
          '/api/platform/house-workers/install',
          '/api/platform/house-workers/share',
          '/api/platform/house-workers/install-shared',
          '/api/platform/house-workers/spawn',
          '/api/platform/house-workers/message',
          '/api/platform/house-workers/status',
          '/api/platform/house-workers/stop',
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
            'worker_runtime_supervisor_seed',
            'worker_spawn_profile_seed',
            'worker_spawn_guardrail_seed',
            'worker_share_lifecycle_seed',
            'worker_deployment_lifecycle_seed',
            'worker_office_pack_seed',
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
          workerShareCount: workerShares.length,
          workerSessionCount: workerSessions.length,
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
        workerShareCount: workerShares.length,
        workerSessionCount: workerSessions.length,
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

  function buildHouseWorkerLiveReadinessPayload({
    context = {},
  } = {}) {
    const houseId = typeof context.houseId === 'string' ? context.houseId.trim() : '';
    const teamId = typeof context.activeTeamId === 'string' ? context.activeTeamId.trim() : '';
    const availableTeamIds = Array.isArray(context?.availableTeamIds) ? context.availableTeamIds : [];
    const workerRegistryEntityId = String(
      getUnifiedPlatformTestFixture('worker_package_registry_seed')?.registryEntityId || ''
    ).trim();
    const workerCatalogAvailable = !!(workerRegistryEntityId && getRegistryEntityById(workerRegistryEntityId));
    const deployments = houseId && teamId ? listHouseWorkerDeployments({ houseId, teamId }) : [];
    const liveFixture = getUnifiedPlatformTestFixture('worker_live_readiness_seed') || {};
    const operatorSteps = Array.isArray(liveFixture?.operatorSteps) ? liveFixture.operatorSteps : [];
    const checks = [
      {
        checkId: 'house_attached',
        label: 'House attached',
        status: houseId ? 'ready' : 'blocked',
        blockedBy: houseId ? [] : ['HOUSE_REQUIRED'],
        summary: houseId
          ? `House ${houseId} is attached to this live browser session.`
          : 'Attach a house before validating live helper work.',
        browserValidationRequired: false,
      },
      {
        checkId: 'active_team_selected',
        label: 'Active team selected',
        status: houseId && teamId ? 'ready' : 'blocked',
        blockedBy: houseId && teamId ? [] : ['ACTIVE_TEAM_REQUIRED'],
        summary: houseId && teamId
          ? `Team ${teamId} is active for this House session.`
          : 'Select an active team before validating live helper work.',
        browserValidationRequired: false,
      },
      {
        checkId: 'worker_catalog_available',
        label: 'Helper catalog available',
        status: workerCatalogAvailable ? 'ready' : 'blocked',
        blockedBy: workerCatalogAvailable ? [] : ['WORKER_CATALOG_REQUIRED'],
        summary: workerCatalogAvailable
          ? 'At least one Registry helper package is available for install.'
          : 'No Registry helper package is available for live install yet.',
        browserValidationRequired: false,
      },
      {
        checkId: 'browser_local_brain_ready',
        label: 'Local brain ready in this browser',
        status: 'browser_validation_required',
        blockedBy: ['LOCAL_BRAIN_REQUIRED'],
        summary: 'Check in this browser that a local brain is configured before starting helpers.',
        browserValidationRequired: true,
      },
      {
        checkId: 'headed_operator_browser',
        label: 'Headed operator browser',
        status: 'browser_validation_required',
        blockedBy: ['HEADED_BROWSER_REQUIRED'],
        summary: 'Run the live helper gate in a visible browser window so the operator can confirm the helper response.',
        browserValidationRequired: true,
      },
    ];
    const blockingChecks = checks.filter((entry) => entry.status === 'blocked');
    return {
      schema: 'agent-town-house-worker-live-readiness/v1',
      houseId: houseId || null,
      activeTeamId: teamId || null,
      availableTeamIds,
      status: blockingChecks.length === 0 ? 'browser_validation_required' : 'action_required',
      summary: blockingChecks.length === 0
        ? 'Server-side House worker prerequisites are ready. Finish the browser checks, then run the headed operator gate.'
        : blockingChecks.map((entry) => String(entry?.summary || '').trim()).filter(Boolean).join(' '),
      checks,
      operatorSteps,
      liveGateCommand: 'npm run test:house-worker-live',
      liveGateConfig: 'playwright.house-worker.live.config.js',
      counts: {
        deploymentCount: deployments.length,
        workerCatalogCount: workerCatalogAvailable ? 1 : 0,
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

  app.get('/api/platform/house-workers', (req, res) => {
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
    return sendPortalApiSuccess(res, buildHouseWorkerCollectionsPayload({
      context,
      houseId,
      teamId: String(teamResolution?.teamId || '').trim(),
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

  app.get('/api/platform/house-workers/sessions', (req, res) => {
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
    const payload = buildHouseWorkerCollectionsPayload({
      context,
      houseId,
      teamId: String(teamResolution?.teamId || '').trim(),
      sourceKind: 'durable_house_worker_sessions',
    });
    return sendPortalApiSuccess(res, {
      houseId: payload.houseId,
      teamId: payload.teamId,
      activeTeamId: payload.activeTeamId,
      availableTeamIds: payload.availableTeamIds,
      sessions: payload.sessions,
      deployments: payload.deployments,
      concurrencyLimit: payload.concurrencyLimit,
      sourceManifest: payload.sourceManifest,
      emptyStateText: payload.emptyStateText,
    }, { requestId });
  });

  app.post('/api/platform/house-workers/spawn', express.json({ limit: '24kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId.trim() : '';
    const teamId = typeof context.activeTeamId === 'string' ? context.activeTeamId.trim() : '';
    if (!houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before starting a helper.', { requestId });
    }
    if (!teamId) {
      return sendPortalApiError(res, 409, 'ACTIVE_TEAM_REQUIRED', 'Select an active team before starting a helper.', { requestId });
    }
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const unsupportedKeys = Object.keys(body).filter((key) => !HOUSE_WORKER_ALLOWED_SPAWN_KEYS.has(String(key || '').trim()));
    if (unsupportedKeys.length) {
      return sendPortalApiError(res, 409, 'UNSUPPORTED_OVERRIDE', 'Only supported helper runtime overrides are allowed.', {
        requestId,
        details: {
          unsupportedKeys,
        },
      });
    }
    const deploymentId = typeof body?.deploymentId === 'string' ? body.deploymentId.trim() : '';
    const task = normalizeHouseWorkerTaskText(body?.task, 'Introduce yourself in one short sentence and confirm you are ready to help this House.');
    const reason = normalizeHouseWorkerReason(body?.reason, 'house_office_start');
    const requestedOfficeId = typeof body?.officeId === 'string' ? body.officeId.trim() : '';
    const parentWorkerSessionId = typeof body?.parentWorkerSessionId === 'string' ? body.parentWorkerSessionId.trim() : '';
    if (!deploymentId || !task || !reason) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'deploymentId, task, and reason are required.', { requestId });
    }
    if (requestedOfficeId && !isSafeHouseOfficeIdentifier(requestedOfficeId)) {
      return sendPortalApiError(res, 409, 'UNSUPPORTED_OVERRIDE', 'officeId must use safe identifier characters only.', { requestId });
    }
    const deployment = getHouseWorkerDeploymentById(deploymentId);
    if (!deployment) {
      return sendPortalApiError(res, 404, 'DEPLOYMENT_NOT_FOUND', 'House helper deployment not found.', { requestId });
    }
    if (String(deployment?.houseId || '').trim() !== houseId || String(deployment?.teamId || '').trim() !== teamId) {
      return sendPortalApiError(res, 404, 'DEPLOYMENT_NOT_FOUND', 'House helper deployment not found for the active team.', { requestId });
    }
    const lifecycleState = String(deployment?.lifecycleState || 'active').trim() || 'active';
    if (lifecycleState === 'paused') {
      return sendPortalApiError(res, 409, 'DEPLOYMENT_PAUSED', 'This helper is paused. Resume it before starting again.', { requestId });
    }
    if (lifecycleState === 'archived') {
      return sendPortalApiError(res, 409, 'DEPLOYMENT_ARCHIVED', 'This helper is archived. Reinstall it before starting again.', { requestId });
    }
    if (requestedOfficeId && requestedOfficeId !== String(deployment?.officeId || '').trim()) {
      return sendPortalApiError(res, 409, 'UNSUPPORTED_OVERRIDE', 'Helpers must stay inside their installed office scope.', { requestId });
    }
    let parentSession = null;
    let parentDeployment = null;
    let rootWorkerSessionId = '';
    let delegationDepth = String(body?.spawnSource || '').trim() === 'parent_worker' ? 1 : 0;
    if (parentWorkerSessionId) {
      parentSession = getHouseWorkerSessionById(parentWorkerSessionId);
      if (!parentSession) {
        return sendPortalApiError(res, 404, 'WORKER_SESSION_NOT_FOUND', 'Parent worker session not found for the active team.', { requestId });
      }
      if (String(parentSession?.houseId || '').trim() !== houseId || String(parentSession?.teamId || '').trim() !== teamId) {
        return sendPortalApiError(res, 404, 'WORKER_SESSION_NOT_FOUND', 'Parent worker session not found for the active team.', { requestId });
      }
      parentDeployment = getHouseWorkerDeploymentById(String(parentSession?.deploymentId || '').trim());
      if (
        parentDeployment
        && (
          parentDeployment?.houseId !== houseId
          || parentDeployment?.teamId !== teamId
        )
      ) {
        parentDeployment = null;
      }
      if (parentDeployment?.runtimeDefaults?.delegationAllowed !== true) {
        return sendPortalApiError(res, 409, 'DELEGATION_NOT_ALLOWED', 'This helper cannot ask another helper to start yet.', { requestId });
      }
      if (deployment?.runtimeDefaults?.delegationAllowed !== true) {
        return sendPortalApiError(res, 409, 'DELEGATION_NOT_ALLOWED', 'This target helper package is not available for delegated work yet.', { requestId });
      }
      rootWorkerSessionId = String(
        parentSession?.runtime?.rootWorkerSessionId
        || parentSession?.houseWorkerSessionId
        || ''
      ).trim();
      delegationDepth = Math.max(0, Number(parentSession?.runtime?.delegationDepth || 0) || 0) + 1;
      if (delegationDepth > HOUSE_WORKER_MAX_DELEGATION_DEPTH) {
        return sendPortalApiError(res, 409, 'RUNAWAY_SPAWN_BLOCKED', 'This helper already reached the safe delegation depth limit.', {
          requestId,
          details: {
            maxDelegationDepth: HOUSE_WORKER_MAX_DELEGATION_DEPTH,
          },
        });
      }
    }
    const activeSessions = listHouseWorkerSessions({ houseId, teamId })
      .filter((entry) => {
        const normalizedStatus = normalizeHouseWorkerStatus(entry?.status, '');
        if (!HOUSE_WORKER_ACTIVE_STATUSES.has(normalizedStatus)) return false;
        return buildHouseWorkerLeaseState(entry).stale !== true;
      });
    if (parentWorkerSessionId) {
      const activeDelegatedSessions = activeSessions.filter((entry) => {
        const activeRootWorkerSessionId = String(
          entry?.runtime?.rootWorkerSessionId
          || entry?.houseWorkerSessionId
          || ''
        ).trim();
        const activeDelegationDepth = Math.max(0, Number(entry?.runtime?.delegationDepth || 0) || 0);
        return !!activeRootWorkerSessionId && activeDelegationDepth > 0 && activeRootWorkerSessionId === rootWorkerSessionId;
      });
      if (activeDelegatedSessions.length >= HOUSE_WORKER_DELEGATION_BUDGET) {
        return sendPortalApiError(res, 409, 'DELEGATION_BUDGET_EXCEEDED', 'This helper already reached the safe number of parallel delegated workers.', {
          requestId,
          details: {
            delegationBudget: HOUSE_WORKER_DELEGATION_BUDGET,
          },
        });
      }
    }
    const activeSessionForDeployment = activeSessions.find((entry) =>
      String(entry?.deploymentId || '').trim() === deploymentId
    ) || null;
    if (activeSessionForDeployment) {
      const sessionCard = buildHouseWorkerSessionCards({ houseId, teamId })
        .find((entry) => String(entry?.houseWorkerSessionId || '').trim() === String(activeSessionForDeployment?.houseWorkerSessionId || '').trim())
        || null;
      return sendPortalApiSuccess(res, {
        workerSessionId: String(activeSessionForDeployment?.houseWorkerSessionId || '').trim(),
        houseWorkerSessionId: String(activeSessionForDeployment?.houseWorkerSessionId || '').trim(),
        deploymentId,
        status: normalizeHouseWorkerStatus(activeSessionForDeployment?.status, 'starting'),
        runtimeProfile: sessionCard?.runtimeProfile && typeof sessionCard.runtimeProfile === 'object'
          ? sessionCard.runtimeProfile
          : {
            brainProfileId: String(activeSessionForDeployment?.brainProfileId || '').trim() || null,
            workspaceSeedRef: String(activeSessionForDeployment?.workspaceSeedRef || '').trim() || null,
            configVersionId: String(activeSessionForDeployment?.configVersionId || '').trim() || null,
            loadoutId: String(activeSessionForDeployment?.loadoutId || '').trim() || null,
          },
        spawnedAt: String(activeSessionForDeployment?.createdAt || '').trim() || null,
        spawnSource: String(activeSessionForDeployment?.runtime?.spawnSource || '').trim() || 'house_ui',
        session: sessionCard,
        reused: true,
        nextStep: 'This helper is already running for this House. Use the existing helper card instead of starting another copy.',
        sessionsPath: '/api/platform/house-workers/sessions',
      }, { requestId });
    }
    if (activeSessions.length >= HOUSE_WORKER_MAX_ACTIVE_SESSIONS) {
      return sendPortalApiError(res, 409, parentWorkerSessionId ? 'DELEGATION_BUDGET_EXCEEDED' : 'OVER_CONCURRENCY_LIMIT', parentWorkerSessionId
        ? 'This House already has the maximum number of parallel helpers running for delegated work.'
        : 'This House already has the maximum number of active helpers running.', {
        requestId,
        details: {
          concurrencyLimit: HOUSE_WORKER_MAX_ACTIVE_SESSIONS,
          activeSessionCount: activeSessions.length,
        },
      });
    }
    const runtimeProfile = buildHouseWorkerRuntimeProfile({
      deployment,
      overrides: body,
    });
    const invalidProfileField = Object.entries(runtimeProfile).find(([key, value]) => {
      const allowEmpty = key !== 'brainProfileId';
      return !isSafeHouseWorkerReference(value, {
        allowEmpty,
        maxLen: key === 'workspaceSeedRef' ? 260 : 180,
      });
    });
    if (invalidProfileField) {
      return sendPortalApiError(res, 409, 'UNSUPPORTED_OVERRIDE', 'One or more helper runtime overrides are invalid.', {
        requestId,
        details: {
          field: invalidProfileField[0],
        },
      });
    }
    const runtimeProfileResolution = resolveHouseWorkerRequestedRuntimeProfile({
      deployment,
      overrides: body,
    });
    if (!runtimeProfileResolution?.ok) {
      return sendPortalApiError(
        res,
        409,
        String(runtimeProfileResolution?.code || 'INVALID_RUNTIME_PROFILE'),
        String(runtimeProfileResolution?.message || 'The requested helper runtime setup could not be applied.'),
        { requestId }
      );
    }
    const sequence = listHouseWorkerSessions({ houseId, teamId }).length + 1;
    const houseWorkerSessionId = buildHouseWorkerSessionId({
      houseId,
      teamId,
      deploymentId,
      sequence,
    });
    const runtimeAgentId = buildHouseWorkerRuntimeAgentId({
      deploymentId,
      sequence,
    });
    const now = nowIso();
    const spawnSource = normalizeHouseWorkerSpawnSource(body?.spawnSource, parentWorkerSessionId ? 'parent_worker' : 'house_ui');
    if (!rootWorkerSessionId) {
      rootWorkerSessionId = houseWorkerSessionId;
    }
    const sessionRecord = createHouseWorkerSession({
      houseWorkerSessionId,
      houseId,
      teamId,
      deploymentId,
      parentSessionId: parentWorkerSessionId || null,
      runtimeAgentId,
      label: String(deployment?.displayName || 'Helper').trim() || 'Helper',
      status: 'starting',
      brainProfileId: runtimeProfile.brainProfileId,
      workspaceSeedRef: runtimeProfile.workspaceSeedRef,
      configVersionId: runtimeProfile.configVersionId,
      loadoutId: runtimeProfile.loadoutId,
      runtime: {
        task,
        reason,
        requestedOfficeId: requestedOfficeId || null,
        spawnSource,
        spawnDepth: delegationDepth,
        parentWorkerSessionId: parentWorkerSessionId || null,
        rootWorkerSessionId,
        delegationDepth,
        delegationReason: reason,
        runtimeSessionId: null,
        supervisorSource: 'browser_supervisor',
        brainProfileId: runtimeProfile.brainProfileId,
        workspaceSeedRef: runtimeProfile.workspaceSeedRef,
        configVersionId: runtimeProfile.configVersionId,
        loadoutId: runtimeProfile.loadoutId,
        requestedRuntimeProfile: runtimeProfileResolution.requestedRuntimeProfile,
        appliedRuntimeProfile: null,
        runtimeBinding: runtimeProfileResolution.runtimeBindingSeed,
      },
      nowIso: now,
    });
    const spawnEventSequence = listHouseWorkerSessionEvents({
      houseWorkerSessionId,
    }).length + 1;
    createHouseWorkerSessionEvent({
      houseWorkerSessionEventId: buildHouseWorkerSessionEventId({
        houseWorkerSessionId,
        eventKind: 'spawn_requested',
        sequence: spawnEventSequence,
      }),
      houseWorkerSessionId,
      eventKind: 'spawn_requested',
      actor: parentWorkerSessionId ? 'parent_worker' : 'human',
      payload: {
        task,
        reason,
        runtimeProfile,
        spawnSource,
        parentWorkerSessionId: parentWorkerSessionId || null,
        rootWorkerSessionId,
        delegationDepth,
      },
      createdAt: now,
    });
    const sessionCard = buildHouseWorkerSessionCards({
      houseId,
      teamId,
    }).find((entry) => String(entry?.houseWorkerSessionId || '').trim() === houseWorkerSessionId) || null;
    return sendPortalApiSuccess(res, {
      workerSessionId: houseWorkerSessionId,
      houseWorkerSessionId,
      deploymentId,
      status: 'starting',
      runtimeProfile,
      spawnedAt: String(sessionRecord?.createdAt || now).trim(),
      spawnSource,
      session: sessionCard,
      sessionsPath: '/api/platform/house-workers/sessions',
    }, {
      requestId,
      status: 201,
    });
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
        versionLabel: String(packageInfo?.versionLabel || '').trim() || null,
        compatibilityLabel: buildHouseWorkerCompatibilityLabel(packageInfo),
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
        versionLabel: String(packageInfo?.versionLabel || '').trim() || null,
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
        compatibilityLabel: buildHouseWorkerCompatibilityLabel(packageInfo),
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

  app.get('/api/platform/house-workers/shares', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId.trim() : '';
    const teamId = typeof context.activeTeamId === 'string' ? context.activeTeamId.trim() : '';
    if (!houseId || !teamId) {
      return sendPortalApiError(res, 409, 'HOUSE_TEAM_REQUIRED', 'Attach a house and select an active team before inspecting helper links.', { requestId });
    }
    const shares = buildHouseWorkerShareCards({
      houseId,
      teamId,
    });
    return sendPortalApiSuccess(res, {
      houseId,
      teamId,
      shares,
      sourceManifest: {
        schema: 'agent-town-house-worker-shares/v1',
        routes: [
          '/api/platform/house-workers/shares',
          '/api/platform/house-workers/share',
          '/api/platform/house-workers/shares/:shareId',
          '/api/platform/house-workers/shares/:shareId/revoke',
          '/api/platform/house-workers/install-shared',
        ],
        counts: {
          shareCount: shares.length,
          activeShareCount: shares.filter((entry) => String(entry?.status || '').trim() === 'active').length,
        },
      },
      emptyStateText: shares.length
        ? ''
        : 'No helper links have been created for this House yet.',
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
    const deploymentIds = Array.isArray(req.body?.deploymentIds)
      ? req.body.deploymentIds.map((entry) => String(entry || '').trim()).filter(Boolean)
      : [];
    const registryEntityId = typeof req.body?.registryEntityId === 'string' ? req.body.registryEntityId.trim() : '';
    const shareScopeId = buildHouseWorkerShareScopeId({ houseId, teamId });
    const shareExpiresAt = addDurationDaysToIso(nowIso(), HOUSE_WORKER_SHARE_DEFAULT_TTL_DAYS);

    if (deploymentIds.length > 1) {
      if (!houseId || !teamId) {
        return sendPortalApiError(res, 409, 'HOUSE_TEAM_REQUIRED', 'Attach a house and select an active team before sharing an office pack.', { requestId });
      }
      const officeDeployments = buildHouseWorkerDeploymentCards({
        houseId,
        teamId,
        offices: buildHouseOfficeStructurePayload({ context, houseId, teamId }).offices || [],
        staffAgents: buildHouseOfficeStructurePayload({ context, houseId, teamId }).staffAgents || [],
      });
      const selectedDeployments = [];
      for (const targetDeploymentId of Array.from(new Set(deploymentIds))) {
        const targetDeployment = officeDeployments.find((entry) => String(entry?.deploymentId || '').trim() === targetDeploymentId) || null;
        if (!targetDeployment) {
          return sendPortalApiError(res, 404, 'DEPLOYMENT_NOT_FOUND', 'One or more helper deployments were not found for the active team.', { requestId });
        }
        const exactPackageResolution = resolveHouseWorkerDeploymentSharePackage(targetDeployment);
        if (!exactPackageResolution?.ok || !exactPackageResolution?.packageInfo) {
          return sendPortalApiError(
            res,
            Number(exactPackageResolution?.status || 409),
            String(exactPackageResolution?.code || 'DEPLOYMENT_PACKAGE_VERSION_INVALID'),
            String(exactPackageResolution?.message || 'One or more installed helpers can no longer be shared safely.'),
            { requestId }
          );
        }
        selectedDeployments.push({
          ...targetDeployment,
          runtimeDefaults: exactPackageResolution.packageInfo.runtimeDefaults,
        });
      }
      const portablePayload = buildHouseWorkerOfficePackPortablePayload({
        deployments: selectedDeployments,
      });
      const identityKey = buildHouseWorkerShareIdentityKeyPack(portablePayload);
      const shareInviteId = `hwp_${sha256PrefixedHex(stableJsonStringify({
        shareScopeId,
        identityKey,
      })).replace(/^sha256:/i, '').slice(0, 24)}`;
      const invite = createHouseWorkerShareInvite({
        shareInviteId,
        shareScopeId,
        shareKind: 'office_pack',
        identityKey,
        payload: portablePayload,
        status: 'active',
        expiresAt: shareExpiresAt,
        revokedAt: null,
        revokedReason: null,
        createdByHouseId: houseId || null,
        createdByTeamId: teamId || null,
        nowIso: nowIso(),
      });
      return sendPortalApiSuccess(res, buildHouseWorkerShareInviteResponse(invite), { requestId });
    }

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
      const resolvedDeploymentPackage = resolveHouseWorkerDeploymentSharePackage(deployment);
      if (!resolvedDeploymentPackage?.ok || !resolvedDeploymentPackage?.packageInfo) {
        return sendPortalApiError(
          res,
          Number(resolvedDeploymentPackage?.status || 409),
          String(resolvedDeploymentPackage?.code || 'DEPLOYMENT_PACKAGE_VERSION_INVALID'),
          String(resolvedDeploymentPackage?.message || 'This installed helper can no longer be shared safely.'),
          {
            requestId,
            details: resolvedDeploymentPackage?.details || {},
          }
        );
      }
      packageInfo = resolvedDeploymentPackage.packageInfo;
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
    const packageShareIdentity = sha256PrefixedHex(stableJsonStringify({
      registryEntityId: portablePayload.registryEntityId,
      entityVersionId: portablePayload.entityVersionId,
      loadoutId: portablePayload.loadoutId || '',
      bundleHash: portablePayload.bundleHash || '',
    }));
    const packageShareId = `hws_pkg_${packageShareIdentity.replace(/^sha256:/i, '').slice(0, 24)}`;
    const packageShare = createHouseWorkerShare({
      shareId: packageShareId,
      registryEntityId: portablePayload.registryEntityId,
      entityVersionId: portablePayload.entityVersionId,
      loadoutId: portablePayload.loadoutId || '',
      bundleHash: portablePayload.bundleHash || '',
      payload: portablePayload,
      createdByHouseId: houseId || null,
      createdByTeamId: teamId || null,
      nowIso: nowIso(),
    });
    const identityKey = buildHouseWorkerShareIdentityKeySingle(portablePayload);
    const shareInviteId = `hws_${sha256PrefixedHex(stableJsonStringify({
      shareScopeId,
      identityKey,
    })).replace(/^sha256:/i, '').slice(0, 24)}`;
    const invite = createHouseWorkerShareInvite({
      shareInviteId,
      shareScopeId,
      shareKind: 'single_worker',
      identityKey,
      packageShareId: packageShare?.shareId || packageShareId,
      payload: portablePayload,
      status: 'active',
      expiresAt: shareExpiresAt,
      revokedAt: null,
      revokedReason: null,
      createdByHouseId: houseId || null,
      createdByTeamId: teamId || null,
      nowIso: nowIso(),
    });
    return sendPortalApiSuccess(res, buildHouseWorkerShareInviteResponse(invite), { requestId });
  });

  app.get('/api/platform/house-workers/shares/:shareId', (req, res) => {
    const requestId = buildPortalRequestId();
    const invite = getHouseWorkerShareInviteById(req.params.shareId);
    if (!invite) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'House worker share not found.', { requestId });
    }
    const resolvedSharePackage = resolveHouseWorkerShareInviteForPreview(invite);
    if (!resolvedSharePackage?.ok || !resolvedSharePackage?.canonicalShare) {
      return sendPortalApiError(
        res,
        Number(resolvedSharePackage?.status || 409),
        String(resolvedSharePackage?.code || 'SHARED_WORKER_PAYLOAD_INVALID'),
        String(resolvedSharePackage?.message || 'The shared helper could not be resolved safely.'),
        {
          requestId,
          details: resolvedSharePackage?.details || {},
        }
      );
    }
    return sendPortalApiSuccess(res, resolvedSharePackage.canonicalShare, { requestId });
  });

  app.post('/api/platform/house-workers/shares/:shareId/revoke', express.json({ limit: '12kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId.trim() : '';
    const teamId = typeof context.activeTeamId === 'string' ? context.activeTeamId.trim() : '';
    if (!houseId || !teamId) {
      return sendPortalApiError(res, 409, 'HOUSE_TEAM_REQUIRED', 'Attach a house and select an active team before revoking a helper link.', { requestId });
    }
    const invite = getHouseWorkerShareInviteById(req.params.shareId);
    if (!invite) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'House worker share not found.', { requestId });
    }
    if (String(invite?.createdByHouseId || '').trim() !== houseId || String(invite?.createdByTeamId || '').trim() !== teamId) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'House worker share not found for the active team.', { requestId });
    }
    const revoked = updateHouseWorkerShareInvite(invite.shareInviteId, {
      status: 'revoked',
      revokedAt: nowIso(),
      revokedReason: 'owner_revoked',
    }, nowIso());
    return sendPortalApiSuccess(res, buildHouseWorkerShareInviteResponse(revoked), { requestId });
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
    const invite = getHouseWorkerShareInviteById(shareId);
    if (!invite) {
      return sendPortalApiError(res, 404, 'NOT_FOUND', 'House worker share not found.', { requestId });
    }
    if (requestedOfficeId && !isSafeHouseOfficeIdentifier(requestedOfficeId)) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'officeId must use safe identifier characters only.', { requestId });
    }
    if (requestedDisplayName && !normalizeHouseWorkerDisplayName(requestedDisplayName)) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'displayName must stay under 80 characters and cannot include secret-like markers.', { requestId });
    }
    const resolvedSharePackage = resolveHouseWorkerShareInviteForPreview(invite);
    if (!resolvedSharePackage?.ok) {
      return sendPortalApiError(
        res,
        Number(resolvedSharePackage?.status || 409),
        String(resolvedSharePackage?.code || 'SHARED_WORKER_PAYLOAD_INVALID'),
        String(resolvedSharePackage?.message || 'The shared helper could not be resolved safely.'),
        {
          requestId,
          details: resolvedSharePackage?.details || {},
        }
      );
    }

    const structure = buildHouseOfficeStructurePayload({
      context,
      houseId,
      teamId,
    });
    const offices = Array.isArray(structure?.offices) ? structure.offices : [];
    const staffAgents = Array.isArray(structure?.staffAgents) ? structure.staffAgents : [];

    const shareKind = normalizeHouseWorkerShareKind(invite?.shareKind || invite?.payload?.shareKind);
    const installedDeployments = [];
    const members = shareKind === 'office_pack'
      ? resolvedSharePackage.members
      : [{ member: invite?.payload || {}, packageInfo: resolvedSharePackage.packageInfo }];
    for (const entry of members) {
      const packageInfo = entry.packageInfo;
      const member = entry.member && typeof entry.member === 'object' ? entry.member : {};
      const installTarget = resolveHouseWorkerInstallTarget({
        houseId,
        teamId,
        requestedOfficeId: shareKind === 'office_pack'
          ? String(member?.officeId || '').trim()
          : requestedOfficeId,
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
        shareKind === 'office_pack' ? String(member?.displayName || '').trim() : requestedDisplayName,
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
          versionLabel: String(packageInfo?.versionLabel || '').trim() || null,
          compatibilityLabel: buildHouseWorkerCompatibilityLabel(packageInfo, { shared: true }),
        },
        runtimeDefaults: packageInfo.runtimeDefaults,
        installSource: {
          kind: shareKind === 'office_pack' ? 'worker_pack_share' : 'worker_share',
          shareId,
          registryEntityId: packageInfo.registryEntityId,
          entityVersionId: packageInfo.entityVersionId,
          requestSource: 'api/platform/house-workers/install-shared',
        },
        idempotencyKey: normalizePortalIdempotencyKey(req),
        nowIso: nowIso(),
      });
      installedDeployments.push(deploymentRecord);
    }

    const updatedInvite = updateHouseWorkerShareInvite(invite.shareInviteId, {
      installCount: Math.max(0, Number(invite?.installCount || 0)) + 1,
      lastInstalledAt: nowIso(),
    }, nowIso());
    const deploymentsPayload = buildHouseWorkerDeploymentsPayload({
      context,
      houseId,
      teamId,
    });
    const deploymentCardMap = new Map(
      (Array.isArray(deploymentsPayload?.deployments) ? deploymentsPayload.deployments : [])
        .map((entry) => [String(entry?.deploymentId || '').trim(), entry])
        .filter(([deploymentId]) => deploymentId)
    );
    const deploymentCards = installedDeployments
      .map((deploymentRecord) => deploymentCardMap.get(String(deploymentRecord?.deploymentId || '').trim()) || null)
      .filter(Boolean);
    return sendPortalApiSuccess(res, {
      deployment: deploymentCards[0] || null,
      deployments: deploymentCards,
      share: buildHouseWorkerShareInviteResponse(updatedInvite || invite),
      guidance: {
        title: shareKind === 'office_pack' ? 'Office pack installed' : 'Shared helper installed',
        nextStep: shareKind === 'office_pack'
          ? `Installed ${deploymentCards.length} helpers into matching House Office desks.`
          : String(deploymentCards[0]?.statusLabel || 'This shared helper is now installed in your House Office.').trim(),
        plainLanguageSummary: shareKind === 'office_pack'
          ? `Installed ${deploymentCards.length} helpers in one step.`
          : String(deploymentCards[0]?.oneLineBenefit || '').trim()
            || 'This shared helper is now installed in your House Office.',
      },
      deploymentsPath: '/api/platform/house-workers/deployments',
      houseOfficePath: '/api/platform/house-office',
    }, { requestId });
  });

  app.post('/api/platform/house-workers/deployments/:deploymentId/lifecycle', express.json({ limit: '16kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId.trim() : '';
    const teamId = typeof context.activeTeamId === 'string' ? context.activeTeamId.trim() : '';
    if (!houseId || !teamId) {
      return sendPortalApiError(res, 409, 'HOUSE_TEAM_REQUIRED', 'Attach a house and select an active team before managing a helper.', { requestId });
    }
    const deploymentId = String(req.params?.deploymentId || '').trim();
    const action = String(req.body?.action || '').trim();
    if (!deploymentId || !HOUSE_WORKER_ALLOWED_DEPLOYMENT_ACTIONS.has(action)) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'deploymentId and a supported lifecycle action are required.', { requestId });
    }
    const deployment = getHouseWorkerDeploymentById(deploymentId);
    if (!deployment || String(deployment?.houseId || '').trim() !== houseId || String(deployment?.teamId || '').trim() !== teamId) {
      return sendPortalApiError(res, 404, 'DEPLOYMENT_NOT_FOUND', 'House helper deployment not found for the active team.', { requestId });
    }
    const now = nowIso();
    let nextDeployment = deployment;
    let removed = false;
    if (action === 'pause') {
      stopHouseWorkerSessionsForDeployment({
        houseId,
        teamId,
        deploymentId,
        actor: 'human',
        reason: 'deployment_paused',
        now,
      });
      nextDeployment = updateHouseWorkerDeployment(deploymentId, {
        lifecycleState: 'paused',
        lifecycleNote: 'Paused by House operator.',
      }, now);
    } else if (action === 'resume') {
      nextDeployment = updateHouseWorkerDeployment(deploymentId, {
        lifecycleState: 'active',
        lifecycleNote: 'Ready to start again.',
      }, now);
    } else if (action === 'archive') {
      stopHouseWorkerSessionsForDeployment({
        houseId,
        teamId,
        deploymentId,
        actor: 'human',
        reason: 'deployment_archived',
        now,
      });
      nextDeployment = updateHouseWorkerDeployment(deploymentId, {
        lifecycleState: 'archived',
        lifecycleNote: 'Archived until you reinstall it.',
      }, now);
    } else if (action === 'remove') {
      stopHouseWorkerSessionsForDeployment({
        houseId,
        teamId,
        deploymentId,
        actor: 'human',
        reason: 'deployment_removed',
        now,
      });
      removed = removeHouseWorkerDeployment(deploymentId);
      nextDeployment = null;
    } else if (action === 'reinstall' || action === 'update') {
      const latestEntity = action === 'update'
        ? getRegistryEntityById(String(deployment?.registryEntityId || '').trim())
        : getRegistryEntityByIdAtVersion(
          String(deployment?.registryEntityId || '').trim(),
          String(deployment?.entityVersionId || '').trim(),
        );
      const packageInfo = resolveHouseWorkerPackage(latestEntity);
      if (!latestEntity || !packageInfo) {
        return sendPortalApiError(res, 409, 'WORKER_PACKAGE_NOT_FOUND', 'Registry no longer knows this helper package.', { requestId });
      }
      stopHouseWorkerSessionsForDeployment({
        houseId,
        teamId,
        deploymentId,
        actor: 'human',
        reason: action === 'update' ? 'deployment_updated' : 'deployment_reinstalled',
        now,
      });
      const office = buildHouseOfficeStructurePayload({ context, houseId, teamId }).offices
        ?.find((entry) => String(entry?.officeId || '').trim() === String(deployment?.officeId || '').trim()) || null;
      nextDeployment = updateHouseWorkerDeployment(deploymentId, {
        registryEntityId: packageInfo.registryEntityId,
        entityVersionId: packageInfo.entityVersionId,
        loadoutId: packageInfo.loadoutId || '',
        bundleHash: packageInfo.bundleHash || '',
        status: packageInfo.requiresLocalBrain ? 'brain_binding_required' : 'ready',
        lifecycleState: 'active',
        lifecycleNote: action === 'update'
          ? 'Updated to the latest Registry release.'
          : 'Reinstalled from the current Registry release.',
        summary: {
          oneLineBenefit: packageInfo.oneLineBenefit,
          whatItDoes: packageInfo.whatItDoes,
          bestFor: packageInfo.bestFor,
          recommendedOfficeId: String(deployment?.officeId || packageInfo.recommendedOfficeId || '').trim() || null,
          recommendedOfficeLabel: String(office?.displayName || packageInfo.recommendedOfficeLabel || '').trim() || null,
          supportedSurfaces: packageInfo.supportedSurfaces,
          requiresLocalBrain: packageInfo.requiresLocalBrain === true,
          brainBindingLabel: packageInfo.brainBindingLabel,
          versionLabel: String(packageInfo?.versionLabel || '').trim() || null,
          compatibilityLabel: buildHouseWorkerCompatibilityLabel(packageInfo),
        },
        runtimeDefaults: packageInfo.runtimeDefaults,
        updateState: 'current',
      }, now);
    }
    const deploymentsPayload = buildHouseWorkerDeploymentsPayload({
      context,
      houseId,
      teamId,
    });
    const deploymentCard = removed
      ? null
      : (Array.isArray(deploymentsPayload?.deployments) ? deploymentsPayload.deployments : [])
        .find((entry) => String(entry?.deploymentId || '').trim() === deploymentId) || null;
    const sessionsPayload = buildHouseWorkerCollectionsPayload({
      context,
      houseId,
      teamId,
    });
    const residualActiveSessions = (Array.isArray(sessionsPayload?.sessions) ? sessionsPayload.sessions : [])
      .filter((entry) => String(entry?.deploymentId || '').trim() === deploymentId)
      .filter((entry) => HOUSE_WORKER_ACTIVE_STATUSES.has(String(entry?.status || '').trim()));
    return sendPortalApiSuccess(res, {
      deployment: deploymentCard,
      removed,
      residualActiveSessionCount: residualActiveSessions.length,
      deploymentsPath: '/api/platform/house-workers/deployments',
      sessionsPath: '/api/platform/house-workers/sessions',
    }, { requestId });
  });

  app.post('/api/platform/house-workers/message', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId.trim() : '';
    const teamId = typeof context.activeTeamId === 'string' ? context.activeTeamId.trim() : '';
    if (!houseId || !teamId) {
      return sendPortalApiError(res, 409, 'HOUSE_TEAM_REQUIRED', 'Attach a house and select an active team before messaging a helper.', { requestId });
    }
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const houseWorkerSessionId = typeof body?.houseWorkerSessionId === 'string' && body.houseWorkerSessionId.trim()
      ? body.houseWorkerSessionId.trim()
      : typeof body?.workerSessionId === 'string'
        ? body.workerSessionId.trim()
        : '';
    const message = String(body?.message || '').trim();
    const actor = String(body?.actor || 'human').trim().toLowerCase();
    if (!houseWorkerSessionId || !message) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'houseWorkerSessionId and message are required.', { requestId });
    }
    if (!['human', 'parent_worker', 'helper', 'system'].includes(actor)) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'actor must be human, parent_worker, helper, or system.', { requestId });
    }
    const workerSession = getHouseWorkerSessionById(houseWorkerSessionId);
    if (!workerSession || String(workerSession?.houseId || '').trim() !== houseId || String(workerSession?.teamId || '').trim() !== teamId) {
      return sendPortalApiError(res, 404, 'WORKER_SESSION_NOT_FOUND', 'Helper session not found for the active team.', { requestId });
    }
    const eventKind = actor === 'helper' ? 'assistant_reply' : 'task_message';
    const nextStatus = actor === 'helper' ? 'idle' : 'working';
    const runtimePatch = actor === 'helper'
      ? {
        lastReply: message,
        lastReplyAt: nowIso(),
      }
      : {
        task: message,
        lastTask: message,
        lastTaskAt: nowIso(),
      };
    const updatedSession = updateHouseWorkerSession({
      houseWorkerSessionId,
      status: nextStatus,
      runtime: mergeHouseWorkerRuntime(workerSession?.runtime, runtimePatch),
      updatedAt: nowIso(),
    });
    const eventSequence = listHouseWorkerSessionEvents({ houseWorkerSessionId }).length + 1;
    const event = createHouseWorkerSessionEvent({
      houseWorkerSessionEventId: buildHouseWorkerSessionEventId({
        houseWorkerSessionId,
        eventKind,
        sequence: eventSequence,
      }),
      houseWorkerSessionId,
      eventKind,
      actor,
      payload: {
        message,
      },
      createdAt: nowIso(),
    });
    const sessionCard = buildHouseWorkerSessionCards({ houseId, teamId })
      .find((entry) => String(entry?.houseWorkerSessionId || '').trim() === houseWorkerSessionId) || updatedSession;
    return sendPortalApiSuccess(res, {
      session: sessionCard,
      event,
    }, { requestId });
  });

  app.post('/api/platform/house-workers/status', express.json({ limit: '24kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId.trim() : '';
    const teamId = typeof context.activeTeamId === 'string' ? context.activeTeamId.trim() : '';
    if (!houseId || !teamId) {
      return sendPortalApiError(res, 409, 'HOUSE_TEAM_REQUIRED', 'Attach a house and select an active team before updating helper status.', { requestId });
    }
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const houseWorkerSessionId = typeof body?.houseWorkerSessionId === 'string' && body.houseWorkerSessionId.trim()
      ? body.houseWorkerSessionId.trim()
      : typeof body?.workerSessionId === 'string'
        ? body.workerSessionId.trim()
        : '';
    const status = normalizeHouseWorkerStatus(body?.status, '');
    const actor = String(body?.actor || 'runtime').trim().toLowerCase();
    const reason = String(body?.reason || '').trim();
    const runtimeSessionId = String(body?.runtimeSessionId || '').trim();
    const ownerKind = String(body?.ownerKind || '').trim();
    const ownerLabel = String(body?.ownerLabel || '').trim();
    const ownerId = String(body?.ownerId || '').trim();
    const lastHeartbeatAt = normalizeHouseWorkerRuntimeIso(body?.lastHeartbeatAt || null);
    const leaseExpiresAt = normalizeHouseWorkerRuntimeIso(body?.leaseExpiresAt || null);
    const requestedRuntimeProfilePatch = normalizeHouseWorkerRuntimeProfilePatch(body?.requestedRuntimeProfile || null);
    const appliedRuntimeProfilePatch = normalizeHouseWorkerRuntimeProfilePatch(body?.appliedRuntimeProfile || null);
    const runtimeBindingPatch = normalizeHouseWorkerRuntimeBindingPatch(body?.runtimeBinding || null);
    const heartbeatOnly = body?.heartbeatOnly === true;
    if (!houseWorkerSessionId || !status) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'houseWorkerSessionId and status are required.', { requestId });
    }
    if (!['runtime', 'human', 'parent_worker', 'system'].includes(actor)) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'actor must be runtime, human, parent_worker, or system.', { requestId });
    }
    if (reason && houseOfficeTextHasForbiddenMarker(reason)) {
      return sendPortalApiError(res, 409, 'UNSUPPORTED_OVERRIDE', 'status reason cannot include secret-like markers.', { requestId });
    }
    if (runtimeSessionId && !isSafeHouseWorkerReference(runtimeSessionId, { allowEmpty: true, maxLen: 180 })) {
      return sendPortalApiError(res, 409, 'UNSUPPORTED_OVERRIDE', 'runtimeSessionId must use safe reference characters only.', { requestId });
    }
    if (ownerKind && !isSafeHouseWorkerReference(ownerKind, { allowEmpty: true, maxLen: 80 })) {
      return sendPortalApiError(res, 409, 'UNSUPPORTED_OVERRIDE', 'ownerKind must use safe reference characters only.', { requestId });
    }
    if (ownerLabel && houseOfficeTextHasForbiddenMarker(ownerLabel)) {
      return sendPortalApiError(res, 409, 'UNSUPPORTED_OVERRIDE', 'ownerLabel cannot include secret-like markers.', { requestId });
    }
    if (ownerId && !isSafeHouseWorkerReference(ownerId, { allowEmpty: true, maxLen: 120 })) {
      return sendPortalApiError(res, 409, 'UNSUPPORTED_OVERRIDE', 'ownerId must use safe reference characters only.', { requestId });
    }
    if (body?.requestedRuntimeProfile && !requestedRuntimeProfilePatch) {
      return sendPortalApiError(res, 409, 'INVALID_RUNTIME_PROFILE', 'The requested helper runtime profile evidence is invalid.', { requestId });
    }
    if (body?.appliedRuntimeProfile && !appliedRuntimeProfilePatch) {
      return sendPortalApiError(res, 409, 'INVALID_RUNTIME_PROFILE', 'The applied helper runtime profile evidence is invalid.', { requestId });
    }
    if (body?.runtimeBinding && !runtimeBindingPatch) {
      return sendPortalApiError(res, 409, 'INVALID_RUNTIME_PROFILE', 'The helper runtime binding evidence is invalid.', { requestId });
    }
    const workerSession = getHouseWorkerSessionById(houseWorkerSessionId);
    if (!workerSession || String(workerSession?.houseId || '').trim() !== houseId || String(workerSession?.teamId || '').trim() !== teamId) {
      return sendPortalApiError(res, 404, 'WORKER_SESSION_NOT_FOUND', 'Helper session not found for the active team.', { requestId });
    }
    const runtimePatch = {
      statusReason: reason || null,
      runtimeSessionId: runtimeSessionId || String(workerSession?.runtime?.runtimeSessionId || '').trim() || null,
    };
    if (ownerKind) runtimePatch.ownerKind = ownerKind;
    if (ownerLabel) runtimePatch.ownerLabel = ownerLabel;
    if (ownerId) runtimePatch.ownerId = ownerId;
    if (lastHeartbeatAt) runtimePatch.lastHeartbeatAt = lastHeartbeatAt;
    if (leaseExpiresAt) runtimePatch.leaseExpiresAt = leaseExpiresAt;
    if (requestedRuntimeProfilePatch) runtimePatch.requestedRuntimeProfile = requestedRuntimeProfilePatch;
    if (appliedRuntimeProfilePatch) runtimePatch.appliedRuntimeProfile = appliedRuntimeProfilePatch;
    if (runtimeBindingPatch) runtimePatch.runtimeBinding = runtimeBindingPatch;
    const updatedSession = updateHouseWorkerSession({
      houseWorkerSessionId,
      status,
      runtime: mergeHouseWorkerRuntime(workerSession?.runtime, runtimePatch),
      updatedAt: nowIso(),
    });
    if (heartbeatOnly) {
      const sessionCard = buildHouseWorkerSessionCards({ houseId, teamId })
        .find((entry) => String(entry?.houseWorkerSessionId || '').trim() === houseWorkerSessionId) || updatedSession;
      return sendPortalApiSuccess(res, {
        session: sessionCard,
        heartbeatOnly: true,
      }, { requestId });
    }
    const eventSequence = listHouseWorkerSessionEvents({ houseWorkerSessionId }).length + 1;
    const event = createHouseWorkerSessionEvent({
      houseWorkerSessionEventId: buildHouseWorkerSessionEventId({
        houseWorkerSessionId,
        eventKind: 'status_changed',
        sequence: eventSequence,
      }),
      houseWorkerSessionId,
      eventKind: 'status_changed',
      actor,
      payload: {
        status,
        reason: reason || null,
        runtimeSessionId: runtimeSessionId || null,
        ownerKind: ownerKind || null,
        ownerId: ownerId || null,
        lastHeartbeatAt: lastHeartbeatAt || null,
        leaseExpiresAt: leaseExpiresAt || null,
      },
      createdAt: nowIso(),
    });
    const sessionCard = buildHouseWorkerSessionCards({ houseId, teamId })
      .find((entry) => String(entry?.houseWorkerSessionId || '').trim() === houseWorkerSessionId) || updatedSession;
    return sendPortalApiSuccess(res, {
      session: sessionCard,
      event,
    }, { requestId });
  });

  app.post('/api/platform/house-workers/stop', express.json({ limit: '24kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId.trim() : '';
    const teamId = typeof context.activeTeamId === 'string' ? context.activeTeamId.trim() : '';
    if (!houseId || !teamId) {
      return sendPortalApiError(res, 409, 'HOUSE_TEAM_REQUIRED', 'Attach a house and select an active team before stopping a helper.', { requestId });
    }
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const houseWorkerSessionId = typeof body?.houseWorkerSessionId === 'string' && body.houseWorkerSessionId.trim()
      ? body.houseWorkerSessionId.trim()
      : typeof body?.workerSessionId === 'string'
        ? body.workerSessionId.trim()
        : '';
    const actor = String(body?.actor || 'human').trim().toLowerCase();
    const reason = String(body?.reason || 'user_stop').trim();
    if (!houseWorkerSessionId) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'houseWorkerSessionId is required.', { requestId });
    }
    const workerSession = getHouseWorkerSessionById(houseWorkerSessionId);
    if (!workerSession || String(workerSession?.houseId || '').trim() !== houseId || String(workerSession?.teamId || '').trim() !== teamId) {
      return sendPortalApiError(res, 404, 'WORKER_SESSION_NOT_FOUND', 'Helper session not found for the active team.', { requestId });
    }
    const updatedSession = updateHouseWorkerSession({
      houseWorkerSessionId,
      status: 'stopped',
      runtime: mergeHouseWorkerRuntime(workerSession?.runtime, {
        stopReason: reason || 'user_stop',
      }),
      updatedAt: nowIso(),
    });
    const eventSequence = listHouseWorkerSessionEvents({ houseWorkerSessionId }).length + 1;
    const event = createHouseWorkerSessionEvent({
      houseWorkerSessionEventId: buildHouseWorkerSessionEventId({
        houseWorkerSessionId,
        eventKind: 'stopped',
        sequence: eventSequence,
      }),
      houseWorkerSessionId,
      eventKind: 'stopped',
      actor: actor || 'human',
      payload: {
        reason: reason || 'user_stop',
      },
      createdAt: nowIso(),
    });
    const sessionCard = buildHouseWorkerSessionCards({ houseId, teamId })
      .find((entry) => String(entry?.houseWorkerSessionId || '').trim() === houseWorkerSessionId) || updatedSession;
    return sendPortalApiSuccess(res, {
      session: sessionCard,
      event,
    }, { requestId });
  });

  app.get('/api/platform/house-workers/live-readiness', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    return sendPortalApiSuccess(res, buildHouseWorkerLiveReadinessPayload({ context }), { requestId });
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
