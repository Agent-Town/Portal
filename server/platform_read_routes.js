function registerPlatformReadRoutes(app, deps) {
  const {
    express,
    buildDefaultCompiledSkillPack,
    buildHouseLibraryCompiledSkillPack,
    buildPlatformContextResponse,
    buildPlatformTrainerResultPayload,
    buildPortalRequestId,
    createLibraryItem,
    createLibraryLink,
    createLibraryPublication,
    createSealedContextViolation,
    createScopeSet,
    createTrainerJob,
    createTrainerResult,
    getConfigVersion,
    getConfigVersionByIdempotency,
    getLibraryItemById,
    getLibraryItemByIdempotency,
    getLibraryPublicationByIdempotency,
    getRegistryEntityById,
    getSealedContextById,
    getScopeSetById,
    getScopeSetByIdempotency,
    getUnifiedPlatformTestFixture,
    getTeamConfigBinding,
    listLibraryItems,
    listLibraryLinks,
    listScopeSetItems,
    listScopeSets,
    listTrackDefinitions,
    listTrackProgressEvents,
    getTrainerJobById,
    getTrainerJobByIdempotency,
    getTrainerResultById,
    getTrainerResultByJobId,
    listConfigComponentVersions,
    listPlatformExperienceDefinitions,
    listRuns,
    listTraceEvents,
    listTrainerJobs,
    listTrainerResults,
    normalizePlatformTrainerBudget,
    normalizePortalIdempotencyKey,
    nowIso,
    randomHex,
    replaceScopeSetItems,
    replaceConfigComponentVersions,
    resolveApprovedLibraryPublicationApproval,
    resolveApprovedTrainerPatchPromotion,
    resolveHumanSessionWithRecovery,
    resolvePlatformTrainerLinkedConfigVersionId,
    resolveSessionPlatformContext,
    sendPortalApiError,
    sendPortalApiSuccess,
    setUnifiedPlatformPromptPreview,
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

  function normalizeLibraryItemIds(itemIds) {
    const source = Array.isArray(itemIds) ? itemIds : [];
    const seen = new Set();
    return source.map((itemId) => String(itemId || '').trim()).filter((itemId) => {
      if (!itemId || seen.has(itemId)) return false;
      seen.add(itemId);
      return true;
    });
  }

  function resolveLibraryItemSealedContextId(item) {
    const metadata = item?.metadata && typeof item.metadata === 'object' ? item.metadata : {};
    return typeof metadata?.sealedContextId === 'string' && metadata.sealedContextId.trim()
      ? metadata.sealedContextId.trim()
      : '';
  }

  function isLibraryItemSealActive(item) {
    if (String(item?.sealPolicy || '').trim() !== 'blocked_publication') return false;
    const sealedContextId = resolveLibraryItemSealedContextId(item);
    if (!sealedContextId) return true;
    const sealedContext = getSealedContextById(sealedContextId);
    if (!sealedContext) return true;
    return String(sealedContext.status || '').trim() !== 'released';
  }

  function projectLibraryItemForRead(item) {
    const projected = {
      libraryItemId: item?.libraryItemId,
      itemType: item?.itemType,
      title: item?.title,
      summary: item?.summary,
      contentText: item?.contentText,
      contentRef: item?.contentRef,
      sourceKind: item?.sourceKind,
      sourceRef: item?.sourceRef,
      visibility: item?.visibility,
      sealPolicy: item?.sealPolicy,
      registryId: item?.registryId,
      contentHash: item?.contentHash,
      readOnly: item?.readOnly,
      importedState: item?.importedState,
      createdAt: item?.createdAt,
      updatedAt: item?.updatedAt,
    };
    if (!isLibraryItemSealActive(item)) {
      return {
        ...projected,
        redacted: false,
      };
    }
    return {
      ...projected,
      summary: 'Sealed library item. Release required for full summary.',
      contentText: '[redacted by seal policy]',
      contentRef: null,
      redacted: true,
    };
  }

  function buildLibrarySelectionPayload({
    houseId = '',
    teamId = '',
    activeScopeSetId = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    const normalizedActiveScopeSetId = String(activeScopeSetId || '').trim();
    const items = listLibraryItems({ houseId: normalizedHouseId, teamId: normalizedTeamId }).map((item) => projectLibraryItemForRead(item));
    const itemsById = new Map(items.map((item) => [item.libraryItemId, item]));
    let scopeSet = normalizedActiveScopeSetId ? getScopeSetById(normalizedActiveScopeSetId) : null;
    if (scopeSet && (scopeSet.houseId !== normalizedHouseId || scopeSet.teamId !== normalizedTeamId)) {
      scopeSet = null;
    }
    const selectedItemIds = scopeSet
      ? listScopeSetItems(scopeSet.scopeSetId).map((entry) => entry.libraryItemId)
      : [];
    const selectedItems = selectedItemIds.map((itemId) => itemsById.get(itemId)).filter(Boolean);
    return {
      activeScopeSetId: scopeSet?.scopeSetId || null,
      selectedItemIds,
      selectedItems,
      items,
      scopeSets: listScopeSets({ houseId: normalizedHouseId, teamId: normalizedTeamId }).map((entry) => ({
        scopeSetId: entry.scopeSetId,
        title: entry.title,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        orderedItemIds: listScopeSetItems(entry.scopeSetId).map((item) => item.libraryItemId),
      })),
    };
  }

  function buildLibraryReadPayload({
    houseId = '',
    teamId = '',
    activeTeamId = '',
    availableTeamIds = [],
    activeScopeSetId = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    if (!normalizedHouseId) {
      return {
        houseId: null,
        teamId: null,
        activeTeamId: activeTeamId || null,
        availableTeamIds,
        activeScopeSetId: null,
        selectedItemIds: [],
        selectedItems: [],
        scopeSets: [],
        items: [],
        emptyStateText: 'No curated Library items yet.',
      };
    }
    const selection = buildLibrarySelectionPayload({
      houseId: normalizedHouseId,
      teamId: normalizedTeamId,
      activeScopeSetId,
    });
    return {
      houseId: normalizedHouseId,
      teamId: normalizedTeamId || null,
      activeTeamId: activeTeamId || null,
      availableTeamIds,
      activeScopeSetId: selection.activeScopeSetId,
      selectedItemIds: selection.selectedItemIds,
      selectedItems: selection.selectedItems,
      scopeSets: selection.scopeSets,
      items: selection.items,
      emptyStateText: 'No curated Library items yet.',
    };
  }

  function describePromotedTraceEvent(event) {
    const payload = event?.payload && typeof event.payload === 'object' ? event.payload : {};
    const eventKind = String(event?.eventKind || event?.eventType || 'event').trim() || 'event';
    const sourceType = String(event?.sourceType || 'unknown').trim() || 'unknown';
    const payloadHint = String(
      payload.kind
      || payload.url
      || payload.selector
      || payload.target
      || payload.action
      || ''
    ).trim();
    return payloadHint
      ? `${eventKind} (${sourceType}) ${payloadHint}`
      : `${eventKind} (${sourceType})`;
  }

  function buildTracePromotionPayload({
    houseId = '',
    teamId = '',
    traceId = '',
  } = {}) {
    const normalizedTraceId = String(traceId || '').trim();
    const run = listRuns({ houseId, teamId }).find((entry) => String(entry?.traceId || '').trim() === normalizedTraceId) || null;
    if (!run) {
      return {
        ok: false,
        code: 'TRACE_NOT_FOUND',
        message: 'Trace could not be found for this House team.',
      };
    }
    const events = listTraceEvents(normalizedTraceId);
    const firstEvent = events[0] || null;
    const lastEvent = events.length ? events[events.length - 1] : null;
    const eventKinds = Array.from(new Set(
      events
        .map((event) => String(event?.eventKind || event?.eventType || '').trim())
        .filter(Boolean)
    ));
    const eventCount = events.length;
    const sealedContextIds = Array.from(new Set(
      events
        .map((event) => String(event?.sealedContextId || event?.seal?.sealedContextId || '').trim())
        .filter(Boolean)
    ));
    const sealPolicy = sealedContextIds.length ? 'blocked_publication' : 'inherit';
    return {
      ok: true,
      itemType: 'episodic_note',
      title: `Archive Promotion · ${normalizedTraceId}`,
      summary: `Archived ${eventCount} canonical event${eventCount === 1 ? '' : 's'} from ${run.experienceId || 'unknown experience'} (${run.status || 'unknown status'}).`,
      contentText: [
        `Trace ID: ${normalizedTraceId}`,
        `Run ID: ${String(run.runId || '').trim() || '—'}`,
        `Experience: ${String(run.experienceId || '').trim() || '—'}`,
        `Status: ${String(run.status || '').trim() || '—'}`,
        `Event count: ${eventCount}`,
        `First event: ${firstEvent ? describePromotedTraceEvent(firstEvent) : '—'}`,
        `Last event: ${lastEvent ? describePromotedTraceEvent(lastEvent) : '—'}`,
        `Event kinds: ${eventKinds.join(', ') || '—'}`,
      ].join('\n'),
      contentRef: normalizedTraceId,
      sourceKind: 'trace',
      sourceRef: normalizedTraceId,
      sealPolicy,
      links: [{
        linkKind: 'derived_from_trace',
        sourceKind: 'trace',
        sourceRef: normalizedTraceId,
        metadata: {
          runId: String(run.runId || '').trim(),
          eventCount,
        },
      }],
      metadata: {
        createdFrom: 'portal.house.library.promotion',
        promotionKind: 'trace',
        runId: String(run.runId || '').trim(),
        sealedContextId: sealedContextIds[0] || null,
        sealedContextIds,
      },
    };
  }

  function buildTrainerResultPromotionPayload({
    houseId = '',
    teamId = '',
    trainerResultId = '',
  } = {}) {
    const normalizedTrainerResultId = String(trainerResultId || '').trim();
    const result = getTrainerResultById(normalizedTrainerResultId);
    const job = result ? getTrainerJobById(result.trainerJobId) : null;
    if (!result || !job || job.houseId !== houseId || job.teamId !== teamId) {
      return {
        ok: false,
        code: 'TRAINER_RESULT_NOT_FOUND',
        message: 'Trainer result could not be found for this House team.',
      };
    }
    const resultPayload = result.result && typeof result.result === 'object' ? result.result : {};
    const summaryText = String(resultPayload.summary || '').trim()
      || `Trainer result ${normalizedTrainerResultId} completed with ${Array.isArray(result.candidatePatchIds) ? result.candidatePatchIds.length : 0} candidate patch recommendation${Array.isArray(result.candidatePatchIds) && result.candidatePatchIds.length === 1 ? '' : 's'}.`;
    const artifactKinds = Array.isArray(resultPayload.artifactRefs)
      ? resultPayload.artifactRefs.map((entry) => String(entry?.artifactKind || '').trim()).filter(Boolean)
      : [];
    return {
      ok: true,
      itemType: 'semantic_note',
      title: `Trainer Promotion · ${normalizedTrainerResultId}`,
      summary: `Promoted trainer result ${normalizedTrainerResultId}: ${summaryText}`,
      contentText: [
        `Trainer result ID: ${normalizedTrainerResultId}`,
        `Trainer job ID: ${String(result.trainerJobId || '').trim() || '—'}`,
        `Job kind: ${String(job.jobKind || '').trim() || '—'}`,
        `Status: ${String(result.status || '').trim() || '—'}`,
        `Summary: ${summaryText}`,
        `Linked config: ${String(result.linkedConfigVersionId || '').trim() || '—'}`,
        `Candidate patches: ${Array.isArray(result.candidatePatchIds) && result.candidatePatchIds.length ? result.candidatePatchIds.join(', ') : '—'}`,
        `Artifact kinds: ${artifactKinds.join(', ') || '—'}`,
      ].join('\n'),
      contentRef: normalizedTrainerResultId,
      sourceKind: 'trainer_result',
      sourceRef: normalizedTrainerResultId,
      links: [{
        linkKind: 'derived_from_trainer_result',
        sourceKind: 'trainer_result',
        sourceRef: normalizedTrainerResultId,
        metadata: {
          trainerJobId: String(result.trainerJobId || '').trim(),
        },
      }],
      metadata: {
        createdFrom: 'portal.house.library.promotion',
        promotionKind: 'trainer_result',
        trainerJobId: String(result.trainerJobId || '').trim(),
      },
    };
  }

  function buildRegistryImportPayload({
    registryEntityId = '',
  } = {}) {
    const normalizedRegistryEntityId = String(registryEntityId || '').trim();
    const entity = getRegistryEntityById(normalizedRegistryEntityId);
    if (!entity) {
      return {
        ok: false,
        code: 'REGISTRY_ENTITY_NOT_FOUND',
        message: 'Registry artifact could not be found.',
      };
    }
    const projection = entity?.versionProjection && typeof entity.versionProjection === 'object' && Object.keys(entity.versionProjection).length
      ? entity.versionProjection
      : (entity?.projection && typeof entity.projection === 'object' ? entity.projection : {});
    return {
      ok: true,
      itemType: 'imported_artifact',
      title: String(entity.displayName || normalizedRegistryEntityId).trim() || normalizedRegistryEntityId,
      summary: `Imported from Registry · ${String(entity.description || entity.entityKind || 'artifact').trim() || 'artifact'}`,
      contentText: [
        `Registry ID: ${String(entity.registryId || normalizedRegistryEntityId).trim() || '—'}`,
        `Entity kind: ${String(entity.entityKind || '').trim() || '—'}`,
        `Family: ${String(entity.familySlug || entity.family || '').trim() || '—'}`,
        `Version: ${String(entity.versionLabel || '').trim() || '—'}`,
        `Description: ${String(entity.description || '').trim() || '—'}`,
        `Projection: ${stableJsonStringify(projection)}`,
      ].join('\n'),
      contentRef: String(entity.registryId || normalizedRegistryEntityId).trim() || normalizedRegistryEntityId,
      sourceKind: 'registry_artifact',
      sourceRef: String(entity.registryEntityId || entity.registryId || normalizedRegistryEntityId).trim() || normalizedRegistryEntityId,
      visibility: 'house_private',
      registryId: String(entity.registryId || entity.registryEntityId || normalizedRegistryEntityId).trim() || normalizedRegistryEntityId,
      importedState: 'imported_artifact',
      readOnly: true,
      links: [{
        linkKind: 'imported_from_registry',
        sourceKind: 'registry_artifact',
        sourceRef: String(entity.registryEntityId || entity.registryId || normalizedRegistryEntityId).trim() || normalizedRegistryEntityId,
        metadata: {
          registryId: String(entity.registryId || entity.registryEntityId || normalizedRegistryEntityId).trim() || normalizedRegistryEntityId,
          entityVersionId: String(entity.entityVersionId || '').trim() || null,
        },
      }],
      metadata: {
        createdFrom: 'portal.house.library.import',
        importKind: 'registry_artifact',
        registryId: String(entity.registryId || entity.registryEntityId || normalizedRegistryEntityId).trim() || normalizedRegistryEntityId,
        entityVersionId: String(entity.entityVersionId || '').trim() || null,
        versionLabel: String(entity.versionLabel || '').trim() || null,
        family: String(entity.familySlug || entity.family || '').trim() || null,
      },
    };
  }

  function persistLibraryItemRecord({
    houseId = '',
    teamId = '',
    idempotencyKey = '',
    itemType = '',
    title = '',
    summary = '',
    contentText = '',
    contentRef = '',
    sourceKind = '',
    sourceRef = '',
    visibility = 'house_private',
    sealPolicy = 'inherit',
    importedState = 'local',
    registryId = '',
    readOnly = false,
    metadata = null,
    links = [],
  } = {}) {
    const existing = getLibraryItemByIdempotency({
      houseId,
      teamId,
      idempotencyKey,
    });
    if (existing) {
      return {
        status: 200,
        item: existing,
        links: listLibraryLinks({ libraryItemId: existing.libraryItemId }),
      };
    }
    const contentHash = sha256PrefixedHex(stableJsonStringify({
      itemType,
      title,
      summary,
      contentText,
      contentRef,
      sourceKind,
      sourceRef,
      visibility,
      sealPolicy,
      importedState,
      registryId,
      readOnly,
      links: Array.isArray(links) ? links : [],
    }));
    const libraryItemId = `lib_${randomHex(12)}`;
    const createdAt = nowIso();
    let item;
    try {
      item = createLibraryItem({
        libraryItemId,
        houseId,
        teamId,
        itemType,
        title,
        summary,
        contentText,
        contentRef,
        sourceKind,
        sourceRef,
        visibility,
        sealPolicy,
        importedState,
        registryId,
        readOnly,
        contentHash,
        idempotencyKey,
        metadata: metadata && typeof metadata === 'object' ? metadata : {},
        nowIso: createdAt,
      });
    } catch (err) {
      const replayed = getLibraryItemByIdempotency({
        houseId,
        teamId,
        idempotencyKey,
      });
      if (replayed) {
        return {
          status: 200,
          item: replayed,
          links: listLibraryLinks({ libraryItemId: replayed.libraryItemId }),
        };
      }
      throw err;
    }
    const normalizedLinks = Array.isArray(links) && links.length
      ? links
      : [{
        linkKind: sourceKind === 'trainer_result' ? 'derived_from_trainer_result' : 'derived_from_trace',
        sourceKind,
        sourceRef,
      }];
    normalizedLinks.forEach((entry) => {
      const linkKind = typeof entry?.linkKind === 'string' ? entry.linkKind.trim() : '';
      const linkSourceKind = typeof entry?.sourceKind === 'string' ? entry.sourceKind.trim() : sourceKind;
      const linkSourceRef = typeof entry?.sourceRef === 'string' ? entry.sourceRef.trim() : sourceRef;
      if (!linkKind || !linkSourceKind || !linkSourceRef) return;
      createLibraryLink({
        libraryLinkId: `link_${randomHex(12)}`,
        libraryItemId,
        linkKind,
        sourceKind: linkSourceKind,
        sourceRef: linkSourceRef,
        targetLibraryItemId: typeof entry?.targetLibraryItemId === 'string' ? entry.targetLibraryItemId.trim() : '',
        metadata: entry?.metadata && typeof entry.metadata === 'object' ? entry.metadata : {},
        nowIso: createdAt,
      });
    });
    return {
      status: 201,
      item: item || getLibraryItemById(libraryItemId),
      links: listLibraryLinks({ libraryItemId }),
    };
  }

  function persistLibraryPublicationRecord({
    houseId = '',
    teamId = '',
    libraryItemId = '',
    visibility = 'registry_public',
    contentHash = '',
    sourceRef = '',
    registryId = '',
    metadata = null,
    idempotencyKey = '',
  } = {}) {
    const existing = getLibraryPublicationByIdempotency({
      houseId,
      teamId,
      idempotencyKey,
    });
    if (existing) {
      return {
        status: 200,
        publication: existing,
      };
    }
    const publication = createLibraryPublication({
      libraryPublicationId: `pub_${randomHex(12)}`,
      houseId,
      teamId,
      libraryItemId,
      publicationState: 'published',
      registryId,
      visibility,
      contentHash,
      sourceRef,
      idempotencyKey,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      nowIso: nowIso(),
    });
    return {
      status: 201,
      publication,
    };
  }

  function recordBlockedLibraryPublicationViolation({
    item = null,
    session = null,
    idempotencyKey = '',
    visibility = '',
    libraryItemId = '',
  } = {}) {
    const sealedContextId = resolveLibraryItemSealedContextId(item);
    if (!sealedContextId) return null;
    const sealedContextViolationId = `sealvio_${sha256PrefixedHex(stableJsonStringify({
      sealedContextId,
      libraryItemId,
      idempotencyKey,
      visibility,
      auditKind: 'library_publish_blocked',
    })).slice('sha256:'.length, 'sha256:'.length + 20)}`;
    try {
      return createSealedContextViolation({
        sealedContextViolationId,
        sealedContextId,
        actor: {
          actorType: 'human',
          actorId: String(session?.sessionId || '').trim() || 'portal_session',
        },
        details: {
          auditKind: 'library_publish_blocked',
          libraryItemId,
          visibility,
          idempotencyKey,
          sourceRef: String(item?.sourceRef || '').trim() || null,
        },
        nowIso: nowIso(),
      });
    } catch {
      return null;
    }
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

  app.get('/api/platform/library/skill-pack', (_req, res) => {
    const requestId = buildPortalRequestId();
    const pack = buildHouseLibraryCompiledSkillPack();
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
    session.activeScopeSetId = '';
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

  app.get('/api/platform/library', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId : '';
    const requestedTeamId = typeof req.query?.teamId === 'string' ? req.query.teamId.trim() : '';
    const teamId = requestedTeamId || (typeof context.activeTeamId === 'string' ? context.activeTeamId : '');
    const payload = buildLibraryReadPayload({
      houseId,
      teamId,
      activeTeamId: context.activeTeamId,
      availableTeamIds: context.availableTeamIds,
      activeScopeSetId: typeof session.activeScopeSetId === 'string' ? session.activeScopeSetId : '',
    });
    if (houseId && !payload.activeScopeSetId && session.activeScopeSetId) {
      session.activeScopeSetId = '';
    }
    return sendPortalApiSuccess(res, payload, { requestId });
  });

  app.post('/api/platform/library/items', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before creating a Library item.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before creating a Library item.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to create a Library item.', { requestId });
    }
    const itemType = typeof req.body?.itemType === 'string' ? req.body.itemType.trim() : '';
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const summary = typeof req.body?.summary === 'string' ? req.body.summary.trim() : '';
    const contentText = typeof req.body?.contentText === 'string' ? req.body.contentText : '';
    const contentRef = typeof req.body?.contentRef === 'string' ? req.body.contentRef.trim() : '';
    const sourceKind = typeof req.body?.sourceKind === 'string' ? req.body.sourceKind.trim() : '';
    const sourceRef = typeof req.body?.sourceRef === 'string' ? req.body.sourceRef.trim() : '';
    const visibility = typeof req.body?.visibility === 'string' ? req.body.visibility.trim() : 'house_private';
    const links = Array.isArray(req.body?.links) ? req.body.links : [];
    if (!sourceKind || !sourceRef) {
      return sendPortalApiError(res, 400, 'LIBRARY_SOURCE_REQUIRED', 'sourceKind and sourceRef are required.', { requestId });
    }
    if (!itemType || !title || !summary) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'itemType, title, and summary are required.', { requestId });
    }
    const existing = getLibraryItemByIdempotency({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey,
    });
    if (existing) {
      return sendPortalApiSuccess(res, {
        item: existing,
        links: listLibraryLinks({ libraryItemId: existing.libraryItemId }),
      }, { requestId, status: 200 });
    }
    const contentHash = sha256PrefixedHex(stableJsonStringify({
      itemType,
      title,
      summary,
      contentText,
      contentRef,
      sourceKind,
      sourceRef,
      visibility,
      links: Array.isArray(links) ? links : [],
    }));
    const libraryItemId = `lib_${randomHex(12)}`;
    const createdAt = nowIso();
    let item;
    try {
      item = createLibraryItem({
        libraryItemId,
        houseId: context.houseId,
        teamId: context.activeTeamId,
        itemType,
        title,
        summary,
        contentText,
        contentRef,
        sourceKind,
        sourceRef,
        visibility,
        contentHash,
        idempotencyKey,
        metadata: {
          createdFrom: 'portal.house.library',
        },
        nowIso: createdAt,
      });
    } catch (err) {
      const replayed = getLibraryItemByIdempotency({
        houseId: context.houseId,
        teamId: context.activeTeamId,
        idempotencyKey,
      });
      if (replayed) {
        return sendPortalApiSuccess(res, {
          item: replayed,
          links: listLibraryLinks({ libraryItemId: replayed.libraryItemId }),
        }, { requestId, status: 200 });
      }
      throw err;
    }
    const normalizedLinks = links.length
      ? links
      : [{
        linkKind: sourceKind === 'workspace_file'
          ? 'derived_from_workshop_config'
          : sourceKind === 'trainer_result'
            ? 'derived_from_trainer_result'
            : sourceKind === 'inbox_message'
              ? 'replies_to_inbox_message'
              : 'derived_from_trace',
        sourceKind,
        sourceRef,
      }];
    normalizedLinks.forEach((entry) => {
      const linkKind = typeof entry?.linkKind === 'string' ? entry.linkKind.trim() : '';
      const linkSourceKind = typeof entry?.sourceKind === 'string' ? entry.sourceKind.trim() : sourceKind;
      const linkSourceRef = typeof entry?.sourceRef === 'string' ? entry.sourceRef.trim() : sourceRef;
      if (!linkKind || !linkSourceKind || !linkSourceRef) return;
      createLibraryLink({
        libraryLinkId: `link_${randomHex(12)}`,
        libraryItemId,
        linkKind,
        sourceKind: linkSourceKind,
        sourceRef: linkSourceRef,
        targetLibraryItemId: typeof entry?.targetLibraryItemId === 'string' ? entry.targetLibraryItemId.trim() : '',
        metadata: entry?.metadata && typeof entry.metadata === 'object' ? entry.metadata : {},
        nowIso: createdAt,
      });
    });
    return sendPortalApiSuccess(res, {
      item: getLibraryItemById(libraryItemId),
      links: listLibraryLinks({ libraryItemId }),
    }, { requestId, status: 201 });
  });

  app.post('/api/platform/library/promotions', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before promoting a Library item.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before promoting a Library item.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to promote a Library item.', { requestId });
    }
    const sourceKind = typeof req.body?.sourceKind === 'string' ? req.body.sourceKind.trim() : '';
    const sourceRef = typeof req.body?.sourceRef === 'string' ? req.body.sourceRef.trim() : '';
    if (!sourceKind || !sourceRef) {
      return sendPortalApiError(res, 400, 'LIBRARY_PROMOTION_SOURCE_REQUIRED', 'sourceKind and sourceRef are required.', { requestId });
    }
    let promotion;
    if (sourceKind === 'trace') {
      promotion = buildTracePromotionPayload({
        houseId: context.houseId,
        teamId: context.activeTeamId,
        traceId: sourceRef,
      });
    } else if (sourceKind === 'trainer_result') {
      promotion = buildTrainerResultPromotionPayload({
        houseId: context.houseId,
        teamId: context.activeTeamId,
        trainerResultId: sourceRef,
      });
    } else {
      return sendPortalApiError(res, 400, 'LIBRARY_PROMOTION_SOURCE_UNSUPPORTED', 'Supported promotion sources are trace and trainer_result.', { requestId });
    }
    if (!promotion || promotion.ok !== true) {
      const code = String(promotion?.code || 'LIBRARY_PROMOTION_SOURCE_NOT_FOUND');
      const message = String(promotion?.message || 'Promotion source could not be found.');
      return sendPortalApiError(res, 404, code, message, { requestId });
    }
    const persisted = persistLibraryItemRecord({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey,
      itemType: promotion.itemType,
      title: promotion.title,
      summary: promotion.summary,
      contentText: promotion.contentText,
      contentRef: promotion.contentRef,
      sourceKind: promotion.sourceKind,
      sourceRef: promotion.sourceRef,
      visibility: 'house_private',
      sealPolicy: promotion.sealPolicy || 'inherit',
      metadata: promotion.metadata,
      links: promotion.links,
    });
    return sendPortalApiSuccess(res, {
      promotion: {
        sourceKind,
        sourceRef,
      },
      item: persisted.item,
      links: persisted.links,
    }, { requestId, status: persisted.status });
  });

  app.post('/api/platform/library/imports', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before importing a Registry artifact.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before importing a Registry artifact.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to import a Registry artifact.', { requestId });
    }
    const registryEntityId = typeof req.body?.registryEntityId === 'string'
      ? req.body.registryEntityId.trim()
      : (typeof req.body?.registryId === 'string' ? req.body.registryId.trim() : '');
    if (!registryEntityId) {
      return sendPortalApiError(res, 400, 'REGISTRY_ENTITY_REQUIRED', 'registryEntityId is required to import a Registry artifact.', { requestId });
    }
    const imported = buildRegistryImportPayload({ registryEntityId });
    if (!imported.ok) {
      return sendPortalApiError(res, 404, imported.code || 'REGISTRY_ENTITY_NOT_FOUND', imported.message || 'Registry artifact not found.', { requestId });
    }
    const persisted = persistLibraryItemRecord({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey,
      itemType: imported.itemType,
      title: imported.title,
      summary: imported.summary,
      contentText: imported.contentText,
      contentRef: imported.contentRef,
      sourceKind: imported.sourceKind,
      sourceRef: imported.sourceRef,
      visibility: imported.visibility,
      importedState: imported.importedState,
      registryId: imported.registryId,
      readOnly: imported.readOnly,
      metadata: imported.metadata,
      links: imported.links,
    });
    return sendPortalApiSuccess(res, {
      import: {
        registryEntityId,
        registryId: imported.registryId,
      },
      item: persisted.item,
      links: persisted.links,
    }, { requestId, status: persisted.status });
  });

  app.post('/api/platform/library/publications', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before publishing a Library item.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before publishing a Library item.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to publish a Library item.', { requestId });
    }
    const existingPublication = getLibraryPublicationByIdempotency({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey,
    });
    if (existingPublication) {
      return sendPortalApiSuccess(res, {
        publication: existingPublication,
      }, { requestId, status: 200 });
    }
    const libraryItemId = typeof req.body?.libraryItemId === 'string' ? req.body.libraryItemId.trim() : '';
    const visibility = typeof req.body?.visibility === 'string' ? req.body.visibility.trim() : 'registry_public';
    const approvalId = typeof req.body?.approvalId === 'string' ? req.body.approvalId.trim() : '';
    if (!libraryItemId) {
      return sendPortalApiError(res, 400, 'LIBRARY_ITEM_REQUIRED', 'libraryItemId is required to publish a Library item.', { requestId });
    }
    const item = getLibraryItemById(libraryItemId);
    if (!item || item.houseId !== context.houseId || item.teamId !== context.activeTeamId) {
      return sendPortalApiError(res, 404, 'LIBRARY_ITEM_NOT_FOUND', 'The requested Library item could not be found for this House team.', { requestId });
    }
    if (isLibraryItemSealActive(item)) {
      recordBlockedLibraryPublicationViolation({
        item,
        session,
        idempotencyKey,
        visibility,
        libraryItemId,
      });
      return sendPortalApiError(res, 409, 'LIBRARY_SEAL_BLOCKED', 'This Library item cannot be published while its seal policy is active.', {
        requestId,
        details: {
          libraryItemId,
          visibility,
          sealedContextId: resolveLibraryItemSealedContextId(item) || null,
          sealPolicy: String(item.sealPolicy || '').trim() || 'inherit',
        },
      });
    }
    const approval = resolveApprovedLibraryPublicationApproval(approvalId, {
      houseId: context.houseId,
      libraryItemId,
      visibility,
    });
    if (!approval) {
      return sendPortalApiError(res, 409, 'LIBRARY_PUBLISH_APPROVAL_REQUIRED', 'Publishing a Library item requires explicit approval.', {
        requestId,
        details: {
          approvalId: approvalId || null,
          approvalKind: 'library_publication',
          libraryItemId,
          visibility,
        },
      });
    }
    const registryId = `regpub_${String(item.contentHash || '').replace(/^sha256:/, '').slice(0, 16) || randomHex(8)}`;
    const persisted = persistLibraryPublicationRecord({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      libraryItemId,
      visibility,
      contentHash: item.contentHash,
      sourceRef: item.sourceRef || item.libraryItemId,
      registryId,
      metadata: {
        approvalId: approval.approvalId,
        approvalKind: approval.approvalKind,
        publishedFrom: 'portal.house.library',
      },
      idempotencyKey,
    });
    return sendPortalApiSuccess(res, {
      publication: persisted.publication,
      item: {
        libraryItemId: item.libraryItemId,
        contentHash: item.contentHash,
        sourceRef: item.sourceRef,
      },
    }, { requestId, status: persisted.status });
  });

  app.get('/api/platform/library/scope', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const houseId = typeof context.houseId === 'string' ? context.houseId : '';
    const requestedTeamId = typeof req.query?.teamId === 'string' ? req.query.teamId.trim() : '';
    const teamId = requestedTeamId || (typeof context.activeTeamId === 'string' ? context.activeTeamId : '');
    const payload = buildLibraryReadPayload({
      houseId,
      teamId,
      activeTeamId: context.activeTeamId,
      availableTeamIds: context.availableTeamIds,
      activeScopeSetId: typeof session.activeScopeSetId === 'string' ? session.activeScopeSetId : '',
    });
    return sendPortalApiSuccess(res, {
      houseId: payload.houseId,
      teamId: payload.teamId,
      activeTeamId: payload.activeTeamId,
      availableTeamIds: payload.availableTeamIds,
      activeScopeSetId: payload.activeScopeSetId,
      orderedItemIds: payload.selectedItemIds,
      selectedItems: payload.selectedItems,
      scopeSets: payload.scopeSets,
      emptyStateText: 'No Library items are selected for this chat.',
    }, { requestId });
  });

  app.post('/api/platform/library/scope', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before setting Library scope.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before setting Library scope.', { requestId });
    }
    const itemIds = normalizeLibraryItemIds(req.body?.itemIds);
    const existingItems = new Map(
      listLibraryItems({ houseId: context.houseId, teamId: context.activeTeamId })
        .map((item) => [item.libraryItemId, item])
    );
    const missingItemIds = itemIds.filter((itemId) => !existingItems.has(itemId));
    if (missingItemIds.length) {
      return sendPortalApiError(res, 404, 'LIBRARY_ITEM_NOT_FOUND', 'One or more Library items could not be found for this team.', {
        requestId,
        details: {
          missingItemIds,
        },
      });
    }
    const requestedScopeSetId = typeof req.body?.scopeSetId === 'string' ? req.body.scopeSetId.trim() : '';
    let scopeSet = requestedScopeSetId ? getScopeSetById(requestedScopeSetId) : null;
    if (scopeSet && (scopeSet.houseId !== context.houseId || scopeSet.teamId !== context.activeTeamId)) {
      scopeSet = null;
    }
    if (!scopeSet) {
      scopeSet = createScopeSet({
        scopeSetId: requestedScopeSetId || `scope_${randomHex(12)}`,
        houseId: context.houseId,
        teamId: context.activeTeamId,
        title: typeof req.body?.title === 'string' && req.body.title.trim()
          ? req.body.title.trim()
          : 'Reading Table',
        createdBy: 'human',
        idempotencyKey: typeof req.body?.idempotencyKey === 'string' ? req.body.idempotencyKey.trim() : '',
        metadata: {
          source: 'portal.house.library.scope',
        },
        nowIso: nowIso(),
      });
    }
    replaceScopeSetItems({
      scopeSetId: scopeSet.scopeSetId,
      itemIds,
      nowIso: nowIso(),
    });
    session.activeScopeSetId = scopeSet.scopeSetId;
    setUnifiedPlatformPromptPreview({
      activeScopeSetId: scopeSet.scopeSetId,
      selectedItemIds: itemIds,
      itemRefs: itemIds.map((itemId) => {
        const item = existingItems.get(itemId);
        return item
          ? {
            libraryItemId: item.libraryItemId,
            title: item.title,
            itemType: item.itemType,
            sourceKind: item.sourceKind,
            sourceRef: item.sourceRef,
          }
          : null;
      }).filter(Boolean),
      promptText: itemIds.length
        ? `House Library scope: ${itemIds.join(', ')}`
        : '',
    });
    const payload = buildLibraryReadPayload({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      activeTeamId: context.activeTeamId,
      availableTeamIds: context.availableTeamIds,
      activeScopeSetId: scopeSet.scopeSetId,
    });
    return sendPortalApiSuccess(res, {
      houseId: payload.houseId,
      teamId: payload.teamId,
      activeTeamId: payload.activeTeamId,
      availableTeamIds: payload.availableTeamIds,
      activeScopeSetId: payload.activeScopeSetId,
      orderedItemIds: payload.selectedItemIds,
      selectedItems: payload.selectedItems,
      scopeSets: payload.scopeSets,
      emptyStateText: 'No Library items are selected for this chat.',
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
    const teamId = requestedTeamId || (typeof context.activeTeamId === 'string' ? context.activeTeamId : '');
    const fixture = getUnifiedPlatformTestFixture('house_office_staff_seed') || {};
    if (!houseId) {
      return sendPortalApiSuccess(res, {
        houseId: null,
        teamId: null,
        activeTeamId: context.activeTeamId,
        availableTeamIds: context.availableTeamIds,
        offices: [],
        staffAgents: [],
        modelVersion: 'house_scaffold_v1',
      }, { requestId });
    }
    return sendPortalApiSuccess(res, {
      houseId,
      teamId: teamId || null,
      activeTeamId: context.activeTeamId,
      availableTeamIds: context.availableTeamIds,
      offices: Array.isArray(fixture?.offices) ? fixture.offices : [],
      staffAgents: Array.isArray(fixture?.staffAgents) ? fixture.staffAgents : [],
      modelVersion: 'house_scaffold_v1',
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
