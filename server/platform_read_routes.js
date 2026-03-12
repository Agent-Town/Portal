function registerPlatformReadRoutes(app, deps) {
  const {
    addLibraryShelfItem,
    express,
    buildDefaultCompiledSkillPack,
    buildHouseLibraryCompiledSkillPack,
    buildPlatformContextResponse,
    buildPlatformTrainerResultPayload,
    buildPortalRequestId,
    createConversationArtifact,
    createLibraryItem,
    createLibraryItemRevision,
    createLibraryLink,
    createLibraryPeerReceipt,
    createLibraryPeerRelay,
    createLibraryPublicStack,
    createLibraryPublicStackMember,
    createLibraryPublicStackReview,
    createLibraryPublicStackVerification,
    createLibraryPublicStackVerificationMember,
    createLibrarySatchelReceipt,
    createLibrarySatchelRelay,
    createLibraryShelf,
    createLibraryPublication,
    createSealedContextViolation,
    createScopeSet,
    createTrainerJob,
    createTrainerResult,
    getConfigVersion,
    getConfigVersionByIdempotency,
    getConversationArtifactByIdempotency,
    getLibraryItemById,
    getLibraryItemByIdempotency,
    getLibraryPeerRelayById,
    getLibraryPeerRelayByIdempotency,
    getLibraryPublicationById,
    getLibraryPublicStackById,
    getLibraryPublicStackByIdempotency,
    getLibraryPublicStackReview,
    getLibraryPublicStackReviewByIdempotency,
    getLibraryPublicStackVerificationById,
    getLibraryPublicStackVerificationByIdempotency,
    getLatestLibraryPublicStackVerification,
    getLibrarySatchelRelayById,
    getLibrarySatchelRelayByIdempotency,
    getLibraryShelfById,
    getLibraryShelfByIdempotency,
    getLibraryPublicationByIdempotency,
    getRegistryEntityById,
    getRegistryProofByRegistryId,
    getSealedContextById,
    getScopeSetById,
    getScopeSetByIdempotency,
    getUnifiedPlatformPromptPreview,
    getUnifiedPlatformRegistryPreviewSnapshot,
    getUnifiedPlatformTestFixture,
    listConversationArtifacts,
    getTeamConfigBinding,
    listLibraryItems,
    listLibraryItemRevisions,
    listLibraryLinks,
    listLibraryPeerReceipts,
    listLibraryPeerRelays,
    listLibraryPublicStackMembers,
    listLibraryPublicStackReviews,
    listLibraryPublicStacks,
    listLibraryPublicStackVerificationMembers,
    listLibraryPublicStackVerifications,
    listLibrarySatchelRelays,
    listLibrarySatchelReceipts,
    listLibraryPublications,
    listLibraryShelfItems,
    listLibraryShelves,
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
    removeLibraryShelfItem,
    replaceScopeSetItems,
    replaceConfigComponentVersions,
    dispatchLibraryPeerRelayEnvelope,
    dispatchLibrarySatchelRelayEnvelope,
    resolveApprovedLibraryPublicStackApproval,
    resolveApprovedLibraryPeerRelayApproval,
    resolveApprovedLibrarySatchelRelayApproval,
    resolveApprovedLibraryPublicationApproval,
    resolveApprovedTrainerPatchPromotion,
    resolveHumanSessionWithRecovery,
    resolvePlatformTrainerLinkedConfigVersionId,
    resolveSessionPlatformContext,
    resolveKnownHouseTarget,
    searchRegistryFamilyGroups,
    sendPortalApiError,
    sendPortalApiSuccess,
    setUnifiedPlatformBenchmarkSnapshot,
    setUnifiedPlatformRegistryPreviewSnapshot,
    setUnifiedPlatformPromptPreview,
    sha256PrefixedHex,
    stableJsonStringify,
    updateLibraryPublicStackReview,
    updateLibraryPublicStackVerification,
    updateLibraryPeerRelay,
    updateLibrarySatchelRelay,
    updateLibraryItem,
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

  function buildLibrarySummary(contentText = '', fallback = 'Saved in your Library.') {
    const compact = String(contentText || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!compact) return String(fallback || 'Saved in your Library.').trim() || 'Saved in your Library.';
    return compact.length > 140 ? `${compact.slice(0, 137).trimEnd()}...` : compact;
  }

  function buildDefaultLibraryLinks({
    sourceKind = '',
    sourceRef = '',
    links = [],
  } = {}) {
    if (Array.isArray(links) && links.length) {
      return links;
    }
    const normalizedSourceKind = String(sourceKind || '').trim();
    const normalizedSourceRef = String(sourceRef || '').trim();
    if (!normalizedSourceKind || !normalizedSourceRef) return [];
    if (normalizedSourceKind === 'user_note') {
      return [];
    }
    return [{
      linkKind: normalizedSourceKind === 'workspace_file'
        ? 'derived_from_workshop_config'
        : normalizedSourceKind === 'trainer_result'
          ? 'derived_from_trainer_result'
          : normalizedSourceKind === 'inbox_message'
            ? 'replies_to_inbox_message'
            : normalizedSourceKind === 'conversation_artifact'
              ? 'derived_from_conversation'
              : 'derived_from_trace',
      sourceKind: normalizedSourceKind,
      sourceRef: normalizedSourceRef,
    }];
  }

  function createLibraryItemRevisionSnapshot({
    item = null,
    createdBy = 'human',
    metadata = null,
    now = nowIso(),
  } = {}) {
    if (!item || typeof item !== 'object') return null;
    const revisions = listLibraryItemRevisions({
      houseId: item.houseId,
      teamId: item.teamId,
      libraryItemId: item.libraryItemId,
    });
    return createLibraryItemRevision({
      libraryItemRevisionId: `lrev_${randomHex(12)}`,
      libraryItemId: item.libraryItemId,
      houseId: item.houseId,
      teamId: item.teamId,
      revisionIndex: revisions.length + 1,
      title: item.title,
      summary: item.summary,
      contentText: item.contentText,
      contentHash: item.contentHash,
      metadata,
      createdBy,
      createdAt: now,
    });
  }

  function projectLibraryItemForRead(item) {
    const publications = listLibraryPublications({
      houseId: item?.houseId,
      teamId: item?.teamId,
    }).filter((entry) => String(entry?.libraryItemId || '').trim() === String(item?.libraryItemId || '').trim());
    const shelfMembership = listLibraryShelves({
      houseId: item?.houseId,
      teamId: item?.teamId,
    }).filter((shelf) => listLibraryShelfItems(shelf.libraryShelfId).some((entry) => entry.libraryItemId === item?.libraryItemId));
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
      shelfIds: shelfMembership.map((entry) => entry.libraryShelfId),
      shelfTitles: shelfMembership.map((entry) => entry.title),
      publicationCount: publications.length,
      published: publications.length > 0,
      publications: publications.map((entry) => ({
        libraryPublicationId: entry.libraryPublicationId,
        registryId: entry.registryId,
        visibility: entry.visibility,
        publicationState: entry.publicationState,
        contentHash: entry.contentHash,
      })),
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
        scopeKind: String(entry?.metadata?.scopeKind || 'reading_table').trim() || 'reading_table',
        sourceShelfId: typeof entry?.metadata?.sourceShelfId === 'string' && entry.metadata.sourceShelfId.trim()
          ? entry.metadata.sourceShelfId.trim()
          : null,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        orderedItemIds: listScopeSetItems(entry.scopeSetId).map((item) => item.libraryItemId),
      })),
      shelves: listLibraryShelves({ houseId: normalizedHouseId, teamId: normalizedTeamId }).map((shelf) => ({
        libraryShelfId: shelf.libraryShelfId,
        title: shelf.title,
        description: shelf.description,
        createdAt: shelf.createdAt,
        updatedAt: shelf.updatedAt,
        orderedItemIds: listLibraryShelfItems(shelf.libraryShelfId).map((item) => item.libraryItemId),
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
        shelves: [],
        items: [],
        incomingRelays: [],
        incomingSatchelRelays: [],
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
      shelves: selection.shelves,
      items: selection.items,
      incomingRelays: buildIncomingLibraryPeerRelayList({
        houseId: normalizedHouseId,
        teamId: normalizedTeamId,
      }),
      incomingSatchelRelays: buildIncomingLibrarySatchelRelayList({
        houseId: normalizedHouseId,
        teamId: normalizedTeamId,
      }),
      emptyStateText: 'No curated Library items yet.',
    };
  }

  function computeSafeRate(numerator = 0, denominator = 0, fallback = 1) {
    const safeDenominator = Number(denominator || 0);
    if (safeDenominator <= 0) return Number(fallback || 0);
    return Number((Number(numerator || 0) / safeDenominator).toFixed(4));
  }

  function buildHouseLibraryBenchmarkPayload({
    houseId = '',
    teamId = '',
    activeScopeSetId = '',
    copyAudit = null,
  } = {}) {
    const libraryPayload = buildLibraryReadPayload({
      houseId,
      teamId,
      activeScopeSetId,
      activeTeamId: teamId,
      availableTeamIds: teamId ? [teamId] : [],
    });
    const promptPreview = getUnifiedPlatformPromptPreview();
    const scopeIds = Array.isArray(libraryPayload?.selectedItemIds)
      ? libraryPayload.selectedItemIds.map((itemId) => String(itemId || '').trim()).filter(Boolean)
      : [];
    const promptIds = Array.isArray(promptPreview?.selectedItemIds) && promptPreview.selectedItemIds.length
      ? promptPreview.selectedItemIds.map((itemId) => String(itemId || '').trim()).filter(Boolean)
      : scopeIds;
    const scopeSet = new Set(scopeIds);
    const inScopePromptCount = promptIds.filter((itemId) => scopeSet.has(itemId)).length;
    const leakedPromptCount = promptIds.filter((itemId) => !scopeSet.has(itemId)).length;

    const sealedItems = Array.isArray(libraryPayload?.items)
      ? libraryPayload.items.filter((item) => String(item?.sealPolicy || '').trim() === 'blocked_publication')
      : [];
    const blockedSealedItems = sealedItems.filter((item) => Number(item?.publicationCount || 0) === 0);

    const provenanceCandidates = Array.isArray(libraryPayload?.items)
      ? libraryPayload.items.filter((item) => {
          if (!item || typeof item !== 'object') return false;
          return !!(
            String(item?.sourceKind || '').trim()
            || String(item?.registryId || '').trim()
            || Number(item?.publicationCount || 0) > 0
          );
        })
      : [];
    const visibleProvenanceCount = provenanceCandidates.filter((item) => {
      const hasSource = !!(String(item?.sourceKind || '').trim() && String(item?.sourceRef || '').trim());
      const importedVisible = String(item?.importedState || '').trim() !== 'imported_artifact' || !!String(item?.registryId || '').trim();
      const publishedVisible = Number(item?.publicationCount || 0) <= 0 || item?.published === true;
      return hasSource && importedVisible && publishedVisible;
    }).length;

    const copyFixture = getUnifiedPlatformTestFixture('library_copy_a11y_seed') || {};
    const requiredHeadings = Array.isArray(copyFixture?.requiredHeadings) ? copyFixture.requiredHeadings : [];
    const bannedTerms = Array.isArray(copyFixture?.bannedTerms) ? copyFixture.bannedTerms : [];
    const headingTexts = Array.isArray(copyAudit?.headingTexts) ? copyAudit.headingTexts.map((entry) => String(entry || '').trim()).filter(Boolean) : [];
    const normalizedHeadingTexts = headingTexts.map((entry) => entry.toLowerCase());
    const auditText = String(copyAudit?.panelText || '').toLowerCase();
    const bannedHits = bannedTerms.filter((term) => auditText.includes(String(term || '').toLowerCase()));
    const copyHeadingPass = requiredHeadings.every((heading) => normalizedHeadingTexts.includes(String(heading || '').toLowerCase()));
    const noviceCopyPassRate = copyHeadingPass && bannedHits.length === 0 ? 1 : 0;

    const metrics = {
      scopePrecision: computeSafeRate(inScopePromptCount, promptIds.length, scopeIds.length ? 0 : 1),
      scopeLeakRate: computeSafeRate(leakedPromptCount, promptIds.length, 0),
      unsafePublishBlockRate: computeSafeRate(blockedSealedItems.length, sealedItems.length, 1),
      provenanceVisibilityRate: computeSafeRate(visibleProvenanceCount, provenanceCandidates.length, 1),
      noviceCopyPassRate,
    };

    const scenarios = [
      {
        scenarioId: 'scope_precision',
        pass: metrics.scopePrecision === 1,
        actual: metrics.scopePrecision,
        expected: 1,
        scopeIds,
        promptIds,
      },
      {
        scenarioId: 'scope_leak_rate',
        pass: metrics.scopeLeakRate === 0,
        actual: metrics.scopeLeakRate,
        expected: 0,
        leakedPromptCount,
      },
      {
        scenarioId: 'unsafe_publish_block_rate',
        pass: metrics.unsafePublishBlockRate === 1,
        actual: metrics.unsafePublishBlockRate,
        expected: 1,
        sealedItemIds: sealedItems.map((item) => String(item?.libraryItemId || '').trim()).filter(Boolean),
      },
      {
        scenarioId: 'provenance_visibility_rate',
        pass: metrics.provenanceVisibilityRate === 1,
        actual: metrics.provenanceVisibilityRate,
        expected: 1,
        candidateItemIds: provenanceCandidates.map((item) => String(item?.libraryItemId || '').trim()).filter(Boolean),
      },
      {
        scenarioId: 'novice_copy_pass_rate',
        pass: metrics.noviceCopyPassRate === 1,
        actual: metrics.noviceCopyPassRate,
        expected: 1,
        requiredHeadings,
        bannedHits,
      },
    ];

    const benchmarkSeed = getUnifiedPlatformTestFixture('library_benchmark_seed') || {};
    const outputPayload = {
      fixtureFamily: String(benchmarkSeed?.family || 'library_benchmark_seed'),
      houseId: String(houseId || '').trim() || null,
      teamId: String(teamId || '').trim() || null,
      activeScopeSetId: String(activeScopeSetId || '').trim() || null,
      metrics,
      scenarios,
    };
    const outputHash = sha256PrefixedHex(stableJsonStringify(outputPayload));
    return {
      runId: `bench_${outputHash.slice('sha256:'.length, 'sha256:'.length + 16)}`,
      metrics,
      scenarios,
      outputHash,
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

  function findLibraryPeerRelayImportForTarget({
    houseId = '',
    teamId = '',
    libraryPeerRelayId = '',
    registryId = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    const normalizedRelayId = String(libraryPeerRelayId || '').trim();
    const normalizedRegistryId = String(registryId || '').trim();
    if (!normalizedHouseId || !normalizedTeamId || (!normalizedRelayId && !normalizedRegistryId)) {
      return null;
    }
    return listLibraryItems({
      houseId: normalizedHouseId,
      teamId: normalizedTeamId,
    }).find((item) => {
      if (!item || typeof item !== 'object') return false;
      if (String(item.importedState || '').trim() !== 'imported_artifact') return false;
      if (item.readOnly !== true) return false;
      if (String(item.sourceKind || '').trim() !== 'peer_relay_artifact') return false;
      const sourceRef = String(item.sourceRef || '').trim();
      const itemRegistryId = String(item.registryId || '').trim();
      if (normalizedRelayId && sourceRef === normalizedRelayId) return true;
      return !!(normalizedRegistryId && itemRegistryId === normalizedRegistryId);
    }) || null;
  }

  function resolveIncomingLibraryPeerRelay({
    houseId = '',
    teamId = '',
    libraryPeerRelayId = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    const normalizedRelayId = String(libraryPeerRelayId || '').trim();
    if (!normalizedHouseId || !normalizedRelayId) {
      return { ok: false, code: 'LIBRARY_PEER_RELAY_NOT_FOUND', message: 'The requested Library relay could not be found.' };
    }
    const relay = getLibraryPeerRelayById(normalizedRelayId);
    if (!relay || String(relay.targetHouseId || '').trim() !== normalizedHouseId) {
      return { ok: false, code: 'LIBRARY_PEER_RELAY_NOT_FOUND', message: 'The requested Library relay could not be found for this House.' };
    }
    const receipt = listLibraryPeerReceipts({
      libraryPeerRelayId: normalizedRelayId,
    }).find((entry) => String(entry?.targetHouseId || '').trim() === normalizedHouseId) || null;
    if (!receipt) {
      return { ok: false, code: 'LIBRARY_PEER_RELAY_NOT_DELIVERED', message: 'This Library relay has not been delivered to the target House yet.' };
    }
    const publication = relay.libraryPublicationId ? getLibraryPublicationById(relay.libraryPublicationId) : null;
    if (!publication) {
      return { ok: false, code: 'LIBRARY_PUBLICATION_NOT_FOUND', message: 'The source publication for this relay could not be found.' };
    }
    const item = publication.libraryItemId ? getLibraryItemById(publication.libraryItemId) : null;
    if (!item) {
      return { ok: false, code: 'LIBRARY_PUBLICATION_ITEM_REQUIRED', message: 'The published Library item for this relay could not be resolved.' };
    }
    const importedItem = normalizedTeamId
      ? findLibraryPeerRelayImportForTarget({
          houseId: normalizedHouseId,
          teamId: normalizedTeamId,
          libraryPeerRelayId: normalizedRelayId,
          registryId: String(relay.registryId || publication.registryId || '').trim(),
        })
      : null;
    return {
      ok: true,
      relay,
      receipt,
      publication,
      item,
      importedItem,
    };
  }

  function buildLibraryPeerRelayPreviewPayload({
    houseId = '',
    teamId = '',
    libraryPeerRelayId = '',
  } = {}) {
    const resolved = resolveIncomingLibraryPeerRelay({
      houseId,
      teamId,
      libraryPeerRelayId,
    });
    if (!resolved.ok) {
      return resolved;
    }
    const {
      relay,
      receipt,
      publication,
      item,
      importedItem,
    } = resolved;
    const sourceHouseId = String(relay?.houseId || '').trim() || null;
    const registryId = String(relay?.registryId || publication?.registryId || item?.registryId || '').trim() || null;
    return {
      ok: true,
      preview: {
        libraryPeerRelayId: relay.libraryPeerRelayId,
        libraryPublicationId: publication.libraryPublicationId,
        sourceHouseId,
        targetHouseId: String(relay?.targetHouseId || '').trim() || null,
        transportKind: String(relay?.transportKind || '').trim() || 'pony.relay.registry.v1',
        relayState: String(relay?.relayState || '').trim() || 'accepted',
        registryId,
        contentHash: String(publication?.contentHash || item?.contentHash || '').trim() || null,
        receiptRef: String(receipt?.receiptRef || '').trim() || null,
        receiptStatus: String(receipt?.status || '').trim() || 'accepted',
        displayName: String(item?.title || registryId || relay.libraryPeerRelayId).trim() || relay.libraryPeerRelayId,
        summary: String(item?.summary || '').trim() || `Relayed from ${sourceHouseId || 'another House'}`,
        contentText: String(item?.contentText || ''),
        contentRef: item?.contentRef ? String(item.contentRef) : null,
        provenance: {
          summary: `Relayed from ${sourceHouseId || 'another House'} via Pony and anchored to ${registryId || publication.libraryPublicationId}.`,
          sourceRef: String(item?.sourceRef || publication?.sourceRef || '').trim() || null,
          sourceKind: String(item?.sourceKind || '').trim() || null,
        },
        alreadyImported: !!importedItem,
        importedItem: importedItem ? projectLibraryItemForRead(importedItem) : null,
      },
    };
  }

  function buildIncomingLibraryPeerRelayList({
    houseId = '',
    teamId = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    if (!normalizedHouseId) return [];
    return listLibraryPeerRelays({
      targetHouseId: normalizedHouseId,
    }).map((relay) => {
      const previewPayload = buildLibraryPeerRelayPreviewPayload({
        houseId: normalizedHouseId,
        teamId: normalizedTeamId,
        libraryPeerRelayId: String(relay?.libraryPeerRelayId || '').trim(),
      });
      return previewPayload.ok ? previewPayload.preview : null;
    }).filter(Boolean);
  }

  function findLibrarySatchelRelayImportsForTarget({
    houseId = '',
    teamId = '',
    librarySatchelRelayId = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    const normalizedRelayId = String(librarySatchelRelayId || '').trim();
    if (!normalizedHouseId || !normalizedTeamId || !normalizedRelayId) {
      return new Map();
    }
    return listLibraryItems({
      houseId: normalizedHouseId,
      teamId: normalizedTeamId,
    }).reduce((acc, item) => {
      if (!item || typeof item !== 'object') return acc;
      if (String(item.importedState || '').trim() !== 'imported_artifact') return acc;
      if (item.readOnly !== true) return acc;
      if (String(item.sourceKind || '').trim() !== 'satchel_relay_artifact') return acc;
      const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
      if (String(metadata.librarySatchelRelayId || '').trim() !== normalizedRelayId) return acc;
      const libraryPublicationId = String(metadata.libraryPublicationId || '').trim();
      const registryId = String(item.registryId || metadata.registryId || '').trim();
      if (libraryPublicationId) {
        acc.set(libraryPublicationId, item);
      }
      if (registryId && !acc.has(registryId)) {
        acc.set(registryId, item);
      }
      return acc;
    }, new Map());
  }

  function findImportedSatchelScopeSetForRelay({
    houseId = '',
    teamId = '',
    librarySatchelRelayId = '',
    bundleHash = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    const normalizedRelayId = String(librarySatchelRelayId || '').trim();
    const normalizedBundleHash = String(bundleHash || '').trim();
    if (!normalizedHouseId || !normalizedTeamId || !normalizedRelayId) return null;
    return listScopeSets({
      houseId: normalizedHouseId,
      teamId: normalizedTeamId,
    }).find((scopeSet) => {
      const metadata = scopeSet?.metadata && typeof scopeSet.metadata === 'object'
        ? scopeSet.metadata
        : {};
      if (String(metadata.scopeKind || '').trim() !== 'satchel') return false;
      if (String(metadata.librarySatchelRelayId || '').trim() !== normalizedRelayId) return false;
      if (!normalizedBundleHash) return true;
      return String(metadata.bundleHash || '').trim() === normalizedBundleHash;
    }) || null;
  }

  function resolveIncomingLibrarySatchelRelay({
    houseId = '',
    teamId = '',
    librarySatchelRelayId = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    const normalizedRelayId = String(librarySatchelRelayId || '').trim();
    if (!normalizedHouseId || !normalizedRelayId) {
      return { ok: false, code: 'LIBRARY_SATCHEL_RELAY_NOT_FOUND', message: 'The requested Satchel relay could not be found.' };
    }
    const relay = getLibrarySatchelRelayById(normalizedRelayId);
    if (!relay || String(relay.targetHouseId || '').trim() !== normalizedHouseId) {
      return { ok: false, code: 'LIBRARY_SATCHEL_RELAY_NOT_FOUND', message: 'The requested Satchel relay could not be found for this House.' };
    }
    const receipt = listLibrarySatchelReceipts({
      librarySatchelRelayId: normalizedRelayId,
    }).find((entry) => String(entry?.targetHouseId || '').trim() === normalizedHouseId) || null;
    if (!receipt) {
      return { ok: false, code: 'LIBRARY_SATCHEL_RELAY_NOT_DELIVERED', message: 'This Satchel relay has not been delivered to the target House yet.' };
    }
    const bundleManifest = relay?.bundleManifest && typeof relay.bundleManifest === 'object'
      ? relay.bundleManifest
      : {};
    const members = Array.isArray(bundleManifest.members)
      ? bundleManifest.members.map((member, index) => ({
          position: Number(member?.position ?? index),
          libraryItemId: String(member?.libraryItemId || '').trim() || null,
          libraryPublicationId: String(member?.libraryPublicationId || '').trim() || null,
          registryId: String(member?.registryId || '').trim() || null,
          contentHash: String(member?.contentHash || '').trim() || null,
          itemType: String(member?.itemType || '').trim() || 'imported_artifact',
          title: String(member?.title || member?.registryId || `Bundle item ${index + 1}`).trim(),
          summary: String(member?.summary || '').trim() || null,
          contentText: String(member?.contentText || ''),
          contentRef: member?.contentRef ? String(member.contentRef) : null,
          sourceKind: String(member?.sourceKind || '').trim() || null,
          sourceRef: String(member?.sourceRef || '').trim() || null,
        }))
      : [];
    if (!members.length) {
      return { ok: false, code: 'LIBRARY_SATCHEL_MANIFEST_REQUIRED', message: 'The Satchel relay manifest could not be resolved.' };
    }
    const importedItems = normalizedTeamId
      ? findLibrarySatchelRelayImportsForTarget({
          houseId: normalizedHouseId,
          teamId: normalizedTeamId,
          librarySatchelRelayId: normalizedRelayId,
        })
      : new Map();
    const localScopeSet = normalizedTeamId
      ? findImportedSatchelScopeSetForRelay({
          houseId: normalizedHouseId,
          teamId: normalizedTeamId,
          librarySatchelRelayId: normalizedRelayId,
          bundleHash: String(bundleManifest.bundleHash || '').trim(),
        })
      : null;
    return {
      ok: true,
      relay,
      receipt,
      bundleManifest,
      members,
      importedItems,
      localScopeSet,
    };
  }

  function buildLibrarySatchelRelayPreviewPayload({
    houseId = '',
    teamId = '',
    librarySatchelRelayId = '',
  } = {}) {
    const resolved = resolveIncomingLibrarySatchelRelay({
      houseId,
      teamId,
      librarySatchelRelayId,
    });
    if (!resolved.ok) {
      return resolved;
    }
    const {
      relay,
      receipt,
      bundleManifest,
      members,
      importedItems,
      localScopeSet,
    } = resolved;
    const memberPreviews = members.map((member) => {
      const importedItem = importedItems instanceof Map
        ? (importedItems.get(member.libraryPublicationId) || importedItems.get(member.registryId) || null)
        : null;
      return {
        ...member,
        alreadyImported: !!importedItem,
        importedItem: importedItem ? projectLibraryItemForRead(importedItem) : null,
      };
    });
    const importedCount = memberPreviews.filter((member) => member.alreadyImported).length;
    const sourceHouseId = String(relay?.houseId || '').trim() || null;
    return {
      ok: true,
      preview: {
        librarySatchelRelayId: relay.librarySatchelRelayId,
        scopeSetId: String(relay?.scopeSetId || bundleManifest.scopeSetId || '').trim() || null,
        sourceHouseId,
        targetHouseId: String(relay?.targetHouseId || '').trim() || null,
        transportKind: String(bundleManifest.transportKind || relay?.metadata?.transportKind || '').trim() || 'pony.relay.registry.v1',
        relayState: String(relay?.relayState || '').trim() || 'accepted',
        receiptRef: String(receipt?.receiptRef || '').trim() || null,
        receiptStatus: String(receipt?.status || '').trim() || 'accepted',
        bundleHash: String(bundleManifest.bundleHash || '').trim() || null,
        title: String(bundleManifest.title || relay.librarySatchelRelayId).trim() || relay.librarySatchelRelayId,
        scopeKind: String(bundleManifest.scopeKind || 'reading_table').trim() || 'reading_table',
        summary: `Relayed from ${sourceHouseId || 'another House'} with ${memberPreviews.length} curated Library items.`,
        memberCount: memberPreviews.length,
        importedCount,
        alreadyImported: importedCount > 0,
        alreadyImportedAll: importedCount === memberPreviews.length,
        members: memberPreviews,
        localScopeSet: localScopeSet
          ? {
              scopeSetId: localScopeSet.scopeSetId,
              title: localScopeSet.title,
              orderedItemIds: listScopeSetItems(localScopeSet.scopeSetId).map((entry) => entry.libraryItemId),
            }
          : null,
        provenance: {
          summary: `Relayed from ${sourceHouseId || 'another House'} via Pony and anchored to ${memberPreviews.length} published Library artifacts.`,
          bundleHash: String(bundleManifest.bundleHash || '').trim() || null,
          orderedPublicationIds: Array.isArray(bundleManifest.orderedPublicationIds) ? bundleManifest.orderedPublicationIds : [],
          orderedRegistryIds: Array.isArray(bundleManifest.orderedRegistryIds) ? bundleManifest.orderedRegistryIds : [],
        },
      },
    };
  }

  function buildIncomingLibrarySatchelRelayList({
    houseId = '',
    teamId = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    if (!normalizedHouseId) return [];
    return listLibrarySatchelRelays({
      targetHouseId: normalizedHouseId,
    }).map((relay) => {
      const previewPayload = buildLibrarySatchelRelayPreviewPayload({
        houseId: normalizedHouseId,
        teamId: normalizedTeamId,
        librarySatchelRelayId: String(relay?.librarySatchelRelayId || '').trim(),
      });
      return previewPayload.ok ? previewPayload.preview : null;
    }).filter(Boolean);
  }

  function findLibraryPublicStackImportsForTarget({
    houseId = '',
    teamId = '',
    libraryPublicStackId = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    const normalizedPublicStackId = String(libraryPublicStackId || '').trim();
    if (!normalizedHouseId || !normalizedTeamId || !normalizedPublicStackId) {
      return new Map();
    }
    return listLibraryItems({
      houseId: normalizedHouseId,
      teamId: normalizedTeamId,
    }).reduce((acc, item) => {
      if (!item || typeof item !== 'object') return acc;
      if (String(item.importedState || '').trim() !== 'imported_artifact') return acc;
      if (item.readOnly !== true) return acc;
      if (String(item.sourceKind || '').trim() !== 'public_stack_artifact') return acc;
      const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
      if (String(metadata.libraryPublicStackId || '').trim() !== normalizedPublicStackId) return acc;
      const libraryPublicationId = String(metadata.libraryPublicationId || '').trim();
      const registryId = String(item.registryId || metadata.registryId || '').trim();
      if (libraryPublicationId) acc.set(libraryPublicationId, item);
      if (registryId) acc.set(registryId, item);
      return acc;
    }, new Map());
  }

  function findImportedPublicStackScopeSetForTarget({
    houseId = '',
    teamId = '',
    libraryPublicStackId = '',
    bundleHash = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    const normalizedPublicStackId = String(libraryPublicStackId || '').trim();
    const normalizedBundleHash = String(bundleHash || '').trim();
    if (!normalizedHouseId || !normalizedTeamId || !normalizedPublicStackId) return null;
    return listScopeSets({
      houseId: normalizedHouseId,
      teamId: normalizedTeamId,
    }).find((scopeSet) => {
      const metadata = scopeSet?.metadata && typeof scopeSet.metadata === 'object' ? scopeSet.metadata : {};
      if (String(metadata.importKind || '').trim() !== 'public_stack_bundle') return false;
      if (String(metadata.libraryPublicStackId || '').trim() !== normalizedPublicStackId) return false;
      if (normalizedBundleHash && String(metadata.bundleHash || '').trim() !== normalizedBundleHash) return false;
      return true;
    }) || null;
  }

  function getHouseLibraryPublicStackFamilyInfo(familySlug = 'house_library_stacks') {
    const normalizedFamilySlug = String(familySlug || 'house_library_stacks').trim() || 'house_library_stacks';
    if (normalizedFamilySlug === 'house_library_stacks') {
      return {
        familySlug: normalizedFamilySlug,
        displayName: 'House Library Stacks',
        description: 'Curated Satchels published from House Library.',
        status: 'published',
      };
    }
    return {
      familySlug: normalizedFamilySlug,
      displayName: normalizedFamilySlug,
      description: null,
      status: 'published',
    };
  }

  function normalizeLibraryPublicStackReviewTier(reviewTier = '') {
    const normalized = String(reviewTier || '').trim().toLowerCase();
    if (normalized === 'trusted_here') return 'trusted_here';
    if (normalized === 'review_later') return 'review_later';
    if (normalized === 'blocked_here') return 'blocked_here';
    return '';
  }

  function buildLibraryPublicStackReviewSummary({
    reviewTier = '',
    note = '',
  } = {}) {
    const normalizedReviewTier = normalizeLibraryPublicStackReviewTier(reviewTier);
    const normalizedNote = String(note || '').trim();
    let prefix = '';
    if (normalizedReviewTier === 'trusted_here') {
      prefix = 'Trusted here for this House.';
    } else if (normalizedReviewTier === 'blocked_here') {
      prefix = 'Blocked here for this House.';
    } else {
      prefix = 'Saved for later review in this House.';
    }
    return normalizedNote ? `${prefix} Note: ${normalizedNote}` : prefix;
  }

  function projectLibraryPublicStackLocalReview({
    houseId = '',
    teamId = '',
    libraryPublicStackId = '',
  } = {}) {
    const normalizedHouseId = String(houseId || '').trim();
    const normalizedTeamId = String(teamId || '').trim();
    const normalizedLibraryPublicStackId = String(libraryPublicStackId || '').trim();
    if (!normalizedHouseId || !normalizedTeamId || !normalizedLibraryPublicStackId) {
      return {
        reviewTier: '',
        review: null,
      };
    }
    const review = getLibraryPublicStackReview({
      houseId: normalizedHouseId,
      teamId: normalizedTeamId,
      libraryPublicStackId: normalizedLibraryPublicStackId,
    });
    return {
      reviewTier: String(review?.reviewTier || '').trim() || '',
      review,
    };
  }

  function searchLibraryPublicStackGroups({
    query = '',
    family = '',
    houseId = '',
    teamId = '',
    trust = '',
  } = {}) {
    const normalizedFamily = String(family || '').trim();
    if (normalizedFamily && normalizedFamily !== 'house_library_stacks') {
      return [];
    }
    const normalizedQuery = String(query || '').trim().toLowerCase();
    const normalizedTrust = normalizeLibraryPublicStackReviewTier(trust);
    const stacks = listLibraryPublicStacks({})
      .filter((entry) => String(entry?.publicationState || '').trim() === 'published')
      .filter((entry) => {
        if (!normalizedQuery) return true;
        const haystack = [
          String(entry?.title || ''),
          String(entry?.summary || ''),
          String(entry?.familySlug || ''),
          String(entry?.metadata?.manifest?.title || ''),
        ].join(' ').toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .map((entry) => {
        const localReview = projectLibraryPublicStackLocalReview({
          houseId,
          teamId,
          libraryPublicStackId: String(entry?.libraryPublicStackId || '').trim(),
        });
        return {
          entry,
          localReview,
        };
      })
      .filter(({ localReview }) => {
        if (!normalizedTrust) return true;
        return String(localReview?.reviewTier || '').trim() === normalizedTrust;
      });
    if (!stacks.length) return [];
    const familyInfo = getHouseLibraryPublicStackFamilyInfo('house_library_stacks');
    return [{
      family: familyInfo.familySlug,
      familySlug: familyInfo.familySlug,
      familyTitle: familyInfo.displayName,
      familyDescription: familyInfo.description || null,
      familyStatus: familyInfo.status || 'published',
      storefront: {
        title: familyInfo.displayName,
        summary: familyInfo.description || null,
      },
      memberCount: stacks.length,
      members: stacks.map(({ entry, localReview }) => {
        const members = listLibraryPublicStackMembers({
          libraryPublicStackId: String(entry?.libraryPublicStackId || '').trim(),
        });
        return {
          registryEntityId: String(entry?.libraryPublicStackId || '').trim(),
          registryId: String(entry?.libraryPublicStackId || '').trim(),
          entityKind: 'library_public_stack_bundle',
          slug: String(entry?.libraryPublicStackId || '').trim(),
          displayName: String(entry?.title || entry?.libraryPublicStackId || '').trim() || String(entry?.libraryPublicStackId || '').trim(),
          description: String(entry?.summary || '').trim() || null,
          reviewTier: String(localReview?.reviewTier || '').trim() || null,
          reviewSummary: String(localReview?.review?.summary || '').trim() || null,
          projection: {
            bundleHash: String(entry?.bundleHash || '').trim() || null,
            scopeSetId: String(entry?.scopeSetId || '').trim() || null,
            memberCount: members.length,
            sourceHouseId: String(entry?.houseId || '').trim() || null,
          },
          proofCards: [],
          loadouts: [],
          storefront: {
            title: String(entry?.title || entry?.libraryPublicStackId || '').trim() || String(entry?.libraryPublicStackId || '').trim(),
            summary: String(entry?.summary || '').trim() || null,
            proofCount: 0,
            loadoutCount: 0,
            memberCount: members.length,
          },
        };
      }).sort((a, b) => String(a?.displayName || '').localeCompare(String(b?.displayName || ''))),
    }];
  }

  function projectLibraryPublicStackBundleMember(member = null) {
    const metadata = member?.metadata && typeof member.metadata === 'object' ? member.metadata : {};
    return {
      position: Number.isFinite(Number(member?.sortIndex)) ? Number(member.sortIndex) : 0,
      libraryItemId: String(member?.libraryItemId || metadata.libraryItemId || '').trim() || null,
      libraryPublicationId: String(member?.libraryPublicationId || '').trim() || null,
      registryId: String(member?.registryId || metadata.registryId || '').trim() || null,
      contentHash: String(metadata.contentHash || '').trim() || null,
      itemType: String(metadata.itemType || '').trim() || 'library_note',
      title: String(metadata.title || member?.registryId || member?.libraryPublicationId || '').trim() || String(member?.libraryPublicationId || ''),
      summary: String(metadata.summary || '').trim() || null,
      contentText: String(metadata.contentText || ''),
      contentRef: metadata.contentRef ? String(metadata.contentRef) : null,
      sourceKind: String(metadata.sourceKind || '').trim() || null,
      sourceRef: String(metadata.sourceRef || '').trim() || null,
    };
  }

  function buildLibraryPublicStackBundleManifestCore({
    publicStack = null,
    members = [],
  } = {}) {
    const manifest = publicStack?.metadata?.manifest && typeof publicStack.metadata.manifest === 'object'
      ? publicStack.metadata.manifest
      : {};
    const projectedMembers = (Array.isArray(members) ? members : [])
      .map((member) => ({
        position: Number.isFinite(Number(member?.position)) ? Number(member.position) : 0,
        libraryItemId: String(member?.libraryItemId || '').trim() || null,
        libraryPublicationId: String(member?.libraryPublicationId || '').trim() || null,
        registryId: String(member?.registryId || '').trim() || null,
        contentHash: String(member?.contentHash || '').trim() || null,
        itemType: String(member?.itemType || '').trim() || 'library_note',
        title: String(member?.title || member?.registryId || member?.libraryPublicationId || '').trim() || String(member?.libraryPublicationId || ''),
        summary: String(member?.summary || '').trim() || null,
        contentText: String(member?.contentText || ''),
        contentRef: member?.contentRef ? String(member.contentRef) : null,
        sourceKind: String(member?.sourceKind || '').trim() || null,
        sourceRef: String(member?.sourceRef || '').trim() || null,
      }))
      .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
    return {
      kind: 'library_public_stack_bundle.v1',
      sourceHouseId: String(publicStack?.houseId || manifest?.sourceHouseId || '').trim() || null,
      sourceTeamId: String(publicStack?.teamId || manifest?.sourceTeamId || '').trim() || null,
      scopeSetId: String(publicStack?.scopeSetId || manifest?.scopeSetId || '').trim() || null,
      title: String(publicStack?.title || manifest?.title || 'Public Stack').trim() || 'Public Stack',
      scopeKind: String(manifest?.scopeKind || 'reading_table').trim() || 'reading_table',
      sourceShelfId: String(manifest?.sourceShelfId || '').trim() || null,
      familySlug: String(publicStack?.familySlug || manifest?.familySlug || 'house_library_stacks').trim() || 'house_library_stacks',
      memberCount: projectedMembers.length,
      orderedItemIds: projectedMembers.map((entry) => entry.libraryItemId),
      orderedPublicationIds: projectedMembers.map((entry) => entry.libraryPublicationId),
      orderedRegistryIds: projectedMembers.map((entry) => entry.registryId).filter(Boolean),
      members: projectedMembers,
    };
  }

  function buildLibraryPublicStackTrustOverlay({
    publicStack = null,
    memberPreviews = [],
    localScopeSet = null,
    verification = null,
    verificationMembers = [],
  } = {}) {
    const manifestCore = buildLibraryPublicStackBundleManifestCore({
      publicStack,
      members: memberPreviews,
    });
    const expectedBundleHash = String(publicStack?.bundleHash || '').trim() || null;
    const computedBundleHash = sha256PrefixedHex(stableJsonStringify(manifestCore));
    const bundleHashMatches = !!expectedBundleHash && expectedBundleHash === computedBundleHash;
    const proofRows = Array.isArray(verificationMembers) ? verificationMembers : [];
    const verifiedMemberCount = proofRows.length
      ? proofRows.filter((entry) => String(entry?.verificationState || '').trim() === 'verified').length
      : (Array.isArray(memberPreviews) ? memberPreviews.filter((entry) => {
          return !!(
            String(entry?.libraryPublicationId || '').trim()
            && String(entry?.registryId || '').trim()
            && String(entry?.contentHash || '').trim()
          );
        }).length : 0);
    const importedCount = Array.isArray(memberPreviews)
      ? memberPreviews.filter((entry) => entry?.alreadyImported === true).length
      : 0;
    const storedVerificationState = String(verification?.verificationState || '').trim();
    const verificationState = storedVerificationState || 'unverified';
    const bundleCardStatus = verificationState === 'unverified'
      ? 'pending'
      : bundleHashMatches && verifiedMemberCount === (Array.isArray(memberPreviews) ? memberPreviews.length : 0)
        ? 'verified'
        : 'warning';
    const bundleCardSummary = verificationState === 'unverified'
      ? `Run verification to check the bundle hash against ${Array.isArray(memberPreviews) ? memberPreviews.length : 0} published item${Array.isArray(memberPreviews) && memberPreviews.length === 1 ? '' : 's'}.`
      : bundleHashMatches
        ? `Bundle hash matches ${verifiedMemberCount} published item${verifiedMemberCount === 1 ? '' : 's'}.`
        : 'Bundle hash no longer matches the stored published members.';
    const localCardStatus = localScopeSet && importedCount === (Array.isArray(memberPreviews) ? memberPreviews.length : 0) && importedCount > 0
      ? 'verified'
      : importedCount > 0
        ? 'partial'
        : 'pending';
    const localCardSummary = localScopeSet && importedCount === (Array.isArray(memberPreviews) ? memberPreviews.length : 0) && importedCount > 0
      ? `Imported here as Satchel ${String(localScopeSet?.title || localScopeSet?.scopeSetId || 'Imported Public Stack').trim() || 'Imported Public Stack'}.`
      : importedCount > 0
        ? `${importedCount} of ${Array.isArray(memberPreviews) ? memberPreviews.length : 0} members are already in this House.`
        : 'Not yet imported into this House.';
    return {
      verificationState,
      verification: {
        libraryPublicStackVerificationId: verification?.libraryPublicStackVerificationId || null,
        libraryPublicStackId: String(publicStack?.libraryPublicStackId || '').trim() || null,
        verificationKind: String(verification?.verificationKind || 'bundle_integrity').trim() || 'bundle_integrity',
        verificationState,
        bundleHash: expectedBundleHash,
        computedBundleHash,
        bundleHashMatches,
        verifiedAt: verification?.updatedAt || verification?.createdAt || null,
        memberCount: Array.isArray(memberPreviews) ? memberPreviews.length : 0,
        verifiedMemberCount,
        importedCount,
        localScopeSetId: localScopeSet?.scopeSetId || null,
        summary: verificationState === 'unverified'
          ? 'Not yet verified in this House.'
          : bundleCardSummary,
      },
      proofCards: [
        {
          title: 'Bundle integrity',
          status: bundleCardStatus,
          summary: bundleCardSummary,
          evidence: {
            bundleHash: expectedBundleHash,
            computedBundleHash,
            memberCount: Array.isArray(memberPreviews) ? memberPreviews.length : 0,
            verifiedMemberCount,
          },
        },
        {
          title: 'Local import status',
          status: localCardStatus,
          summary: localCardSummary,
          evidence: {
            importedCount,
            memberCount: Array.isArray(memberPreviews) ? memberPreviews.length : 0,
            localScopeSetId: localScopeSet?.scopeSetId || null,
          },
        },
      ],
    };
  }

  function buildLibraryPublicStackPreviewPayload({
    houseId = '',
    teamId = '',
    libraryPublicStackId = '',
  } = {}) {
    const normalizedPublicStackId = String(libraryPublicStackId || '').trim();
    if (!normalizedPublicStackId) {
      return {
        ok: false,
        code: 'PUBLIC_STACK_NOT_FOUND',
        message: 'Public Stack not found.',
      };
    }
    const publicStack = getLibraryPublicStackById(normalizedPublicStackId);
    if (!publicStack || String(publicStack.publicationState || '').trim() !== 'published') {
      return {
        ok: false,
        code: 'PUBLIC_STACK_NOT_FOUND',
        message: 'Public Stack not found.',
      };
    }
    const manifest = publicStack?.metadata?.manifest && typeof publicStack.metadata.manifest === 'object'
      ? publicStack.metadata.manifest
      : {};
    const members = listLibraryPublicStackMembers({
      libraryPublicStackId: normalizedPublicStackId,
    }).map((member) => projectLibraryPublicStackBundleMember(member));
    const importedItems = (houseId && teamId)
      ? findLibraryPublicStackImportsForTarget({
          houseId,
          teamId,
          libraryPublicStackId: normalizedPublicStackId,
        })
      : new Map();
    const localScopeSet = (houseId && teamId)
      ? findImportedPublicStackScopeSetForTarget({
          houseId,
          teamId,
          libraryPublicStackId: normalizedPublicStackId,
          bundleHash: String(publicStack?.bundleHash || manifest?.bundleHash || '').trim(),
        })
      : null;
    const memberPreviews = members.map((member) => {
      const importedItem = importedItems instanceof Map
        ? (importedItems.get(member.libraryPublicationId) || importedItems.get(member.registryId) || null)
        : null;
      return {
        ...member,
        alreadyImported: !!importedItem,
        importedItem: importedItem ? projectLibraryItemForRead(importedItem) : null,
      };
    });
    const importedCount = memberPreviews.filter((member) => member.alreadyImported).length;
    const latestVerification = (houseId && teamId)
      ? getLatestLibraryPublicStackVerification({
          houseId,
          teamId,
          libraryPublicStackId: normalizedPublicStackId,
        })
      : null;
    const latestVerificationMembers = latestVerification
      ? listLibraryPublicStackVerificationMembers({
          libraryPublicStackVerificationId: String(latestVerification?.libraryPublicStackVerificationId || '').trim(),
        })
      : [];
    const localReview = projectLibraryPublicStackLocalReview({
      houseId,
      teamId,
      libraryPublicStackId: normalizedPublicStackId,
    });
    const trustOverlay = buildLibraryPublicStackTrustOverlay({
      publicStack,
      memberPreviews,
      localScopeSet,
      verification: latestVerification,
      verificationMembers: latestVerificationMembers,
    });
    const familyInfo = getHouseLibraryPublicStackFamilyInfo(String(publicStack?.familySlug || '').trim() || 'house_library_stacks');
    return {
      ok: true,
      preview: {
        registryId: normalizedPublicStackId,
        registryEntityId: normalizedPublicStackId,
        libraryPublicStackId: normalizedPublicStackId,
        displayName: String(publicStack?.title || normalizedPublicStackId).trim() || normalizedPublicStackId,
        description: String(publicStack?.summary || '').trim() || null,
        entityKind: 'library_public_stack_bundle',
        bundleKind: 'library_public_stack',
        family: familyInfo.familySlug,
        familyTitle: familyInfo.displayName,
        sourceHouseId: String(publicStack?.houseId || '').trim() || null,
        sourceTeamId: String(publicStack?.teamId || '').trim() || null,
        scopeSetId: String(publicStack?.scopeSetId || manifest?.scopeSetId || '').trim() || null,
        scopeKind: String(manifest?.scopeKind || 'reading_table').trim() || 'reading_table',
        bundleHash: String(publicStack?.bundleHash || manifest?.bundleHash || '').trim() || null,
        publicationState: String(publicStack?.publicationState || '').trim() || 'published',
        verificationState: String(trustOverlay?.verificationState || 'unverified').trim() || 'unverified',
        reviewTier: String(localReview?.reviewTier || '').trim() || null,
        review: localReview?.review || null,
        verification: trustOverlay?.verification || {
          verificationState: 'unverified',
        },
        memberCount: memberPreviews.length,
        importedCount,
        alreadyImported: importedCount > 0,
        alreadyImportedAll: importedCount === memberPreviews.length && memberPreviews.length > 0,
        members: memberPreviews,
        proofCards: Array.isArray(trustOverlay?.proofCards) ? trustOverlay.proofCards : [],
        localScopeSet: localScopeSet
          ? {
              scopeSetId: localScopeSet.scopeSetId,
              title: localScopeSet.title,
              orderedItemIds: listScopeSetItems(localScopeSet.scopeSetId).map((entry) => entry.libraryItemId),
            }
          : null,
        storefront: {
          memberCount: memberPreviews.length,
        },
        provenance: {
          summary: `Published from ${String(publicStack?.houseId || '').trim() || 'another House'} with ${memberPreviews.length} curated Library artifacts.`,
          bundleHash: String(publicStack?.bundleHash || manifest?.bundleHash || '').trim() || null,
          verificationSummary: String(trustOverlay?.verification?.summary || '').trim() || null,
          orderedPublicationIds: Array.isArray(manifest?.orderedPublicationIds) ? manifest.orderedPublicationIds : memberPreviews.map((member) => member.libraryPublicationId).filter(Boolean),
          orderedRegistryIds: Array.isArray(manifest?.orderedRegistryIds) ? manifest.orderedRegistryIds : memberPreviews.map((member) => member.registryId).filter(Boolean),
        },
      },
    };
  }

  function flattenPublicStackSearchGroups(groups = []) {
    const source = Array.isArray(groups) ? groups : [];
    return source.flatMap((group) => {
      const familySlug = String(group?.familySlug || group?.family || '').trim() || 'unscoped';
      const familyTitle = String(group?.familyTitle || familySlug).trim() || familySlug;
      const familyStatus = String(group?.familyStatus || 'unknown').trim() || 'unknown';
      const members = Array.isArray(group?.members) ? group.members : [];
      return members.map((member) => ({
        registryId: String(member?.registryEntityId || member?.registryId || '').trim(),
        registryEntityId: String(member?.registryEntityId || member?.registryId || '').trim(),
        familySlug,
        familyTitle,
        familyStatus,
        displayName: String(member?.displayName || member?.slug || member?.registryEntityId || '').trim(),
        description: String(member?.description || '').trim() || null,
        entityKind: String(member?.entityKind || '').trim() || null,
        reviewTier: String(member?.reviewTier || '').trim() || null,
        reviewSummary: String(member?.reviewSummary || '').trim() || null,
        storefront: member?.storefront && typeof member.storefront === 'object'
          ? member.storefront
          : {},
      })).filter((entry) => entry.registryEntityId);
    });
  }

  function buildPublicStackPreviewPayload({
    houseId = '',
    teamId = '',
    registryEntityId = '',
  } = {}) {
    const normalizedRegistryEntityId = String(registryEntityId || '').trim();
    const publicStackPreview = buildLibraryPublicStackPreviewPayload({
      houseId,
      teamId,
      libraryPublicStackId: normalizedRegistryEntityId,
    });
    if (publicStackPreview.ok) {
      return publicStackPreview;
    }
    const entity = getRegistryEntityById(normalizedRegistryEntityId);
    if (!entity) {
      return {
        ok: false,
        code: 'REGISTRY_ENTITY_NOT_FOUND',
        message: 'Registry artifact not found.',
      };
    }
    const proof = getRegistryProofByRegistryId(normalizedRegistryEntityId);
    const proofCards = Array.isArray(proof?.proofCards) ? proof.proofCards : [];
    const loadouts = Array.isArray(proof?.loadouts) ? proof.loadouts : [];
    const bundles = Array.isArray(proof?.bundles) ? proof.bundles : [];
    return {
      ok: true,
      preview: {
        registryId: String(entity.registryId || entity.registryEntityId || normalizedRegistryEntityId).trim() || normalizedRegistryEntityId,
        registryEntityId: String(entity.registryEntityId || entity.registryId || normalizedRegistryEntityId).trim() || normalizedRegistryEntityId,
        displayName: String(entity.displayName || entity.slug || normalizedRegistryEntityId).trim() || normalizedRegistryEntityId,
        description: String(entity.description || '').trim() || null,
        entityKind: String(entity.entityKind || '').trim() || null,
        family: String(entity.familySlug || entity.family || '').trim() || null,
        familyTitle: String(entity?.familyInfo?.displayName || entity.familySlug || entity.family || '').trim() || null,
        entityVersionId: String(entity.entityVersionId || '').trim() || null,
        versionLabel: String(entity.versionLabel || '').trim() || null,
        storefront: entity?.storefront && typeof entity.storefront === 'object'
          ? entity.storefront
          : {},
        provenance: {
          proofCardCount: proofCards.length,
          loadoutCount: loadouts.length,
          bundleCount: bundles.length,
          proofSourceKinds: Array.from(new Set(
            proofCards
              .map((card) => String(card?.sourceKind || card?.evidence?.sourceKind || '').trim())
              .filter(Boolean)
          )),
          summary: String(
            proofCards[0]?.summary
            || proofCards[0]?.evidence?.summary
            || ''
          ).trim() || `Proof cards ${proofCards.length}, loadouts ${loadouts.length}, bundles ${bundles.length}.`,
        },
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
    const normalizedLinks = buildDefaultLibraryLinks({
      sourceKind,
      sourceRef,
      links,
    });
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
    const revision = item ? createLibraryItemRevisionSnapshot({
      item,
      createdBy: 'human',
      metadata: {
        sourceKind,
        sourceRef,
        origin: metadata && typeof metadata === 'object' ? metadata.createdFrom || null : null,
      },
      now: createdAt,
    }) : null;
    return {
      status: 201,
      item: item || getLibraryItemById(libraryItemId),
      links: listLibraryLinks({ libraryItemId }),
      revision,
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

  function persistLibraryPublicStackRecord({
    houseId = '',
    teamId = '',
    scopeSetId = '',
    familySlug = 'house_library_stacks',
    title = '',
    summary = '',
    manifest = null,
    metadata = null,
    idempotencyKey = '',
  } = {}) {
    const existing = getLibraryPublicStackByIdempotency({
      houseId,
      teamId,
      idempotencyKey,
    });
    if (existing) {
      return {
        status: 200,
        publicStack: existing,
        members: listLibraryPublicStackMembers({
          libraryPublicStackId: existing.libraryPublicStackId,
        }),
      };
    }
    const publicStack = createLibraryPublicStack({
      libraryPublicStackId: `pstack_${randomHex(12)}`,
      houseId,
      teamId,
      scopeSetId,
      familySlug,
      title,
      summary,
      bundleHash: String(manifest?.bundleHash || '').trim(),
      publicationState: 'published',
      idempotencyKey,
      metadata: {
        ...(manifest && typeof manifest === 'object' ? { manifest } : {}),
        ...(metadata && typeof metadata === 'object' ? metadata : {}),
      },
      nowIso: nowIso(),
    });
    const members = Array.isArray(manifest?.members) ? manifest.members : [];
    members.forEach((member) => {
      createLibraryPublicStackMember({
        libraryPublicStackMemberId: `pstackm_${randomHex(12)}`,
        libraryPublicStackId: publicStack.libraryPublicStackId,
        libraryPublicationId: String(member?.libraryPublicationId || '').trim(),
        registryId: String(member?.registryId || '').trim(),
        libraryItemId: String(member?.libraryItemId || '').trim(),
        sortIndex: Number.isFinite(Number(member?.position)) ? Number(member.position) : 0,
        metadata: member && typeof member === 'object' ? member : {},
        nowIso: nowIso(),
      });
    });
    return {
      status: 201,
      publicStack,
      members: listLibraryPublicStackMembers({
        libraryPublicStackId: publicStack.libraryPublicStackId,
      }),
    };
  }

  function persistLibraryPublicStackVerificationRecord({
    houseId = '',
    teamId = '',
    libraryPublicStackId = '',
    idempotencyKey = '',
  } = {}) {
    const existing = getLibraryPublicStackVerificationByIdempotency({
      houseId,
      teamId,
      idempotencyKey,
    });
    if (existing) {
      return {
        status: 200,
        verification: existing,
        members: listLibraryPublicStackVerificationMembers({
          libraryPublicStackVerificationId: existing.libraryPublicStackVerificationId,
        }),
      };
    }
    const previewPayload = buildLibraryPublicStackPreviewPayload({
      houseId,
      teamId,
      libraryPublicStackId,
    });
    if (!previewPayload.ok) {
      const err = new Error(previewPayload.code || 'PUBLIC_STACK_NOT_FOUND');
      err.code = previewPayload.code || 'PUBLIC_STACK_NOT_FOUND';
      err.message = previewPayload.message || 'Public Stack not found.';
      throw err;
    }
    const publicStack = getLibraryPublicStackById(libraryPublicStackId);
    if (!publicStack) {
      const err = new Error('PUBLIC_STACK_NOT_FOUND');
      err.code = 'PUBLIC_STACK_NOT_FOUND';
      err.message = 'Public Stack not found.';
      throw err;
    }
    const manifestCore = buildLibraryPublicStackBundleManifestCore({
      publicStack,
      members: previewPayload.preview.members,
    });
    const computedBundleHash = sha256PrefixedHex(stableJsonStringify(manifestCore));
    const expectedBundleHash = String(publicStack?.bundleHash || '').trim() || computedBundleHash;
    const bundleHashMatches = computedBundleHash === expectedBundleHash;
    const verificationState = bundleHashMatches
      && previewPayload.preview.members.every((member) => {
        return !!(
          String(member?.libraryPublicationId || '').trim()
          && String(member?.registryId || '').trim()
          && String(member?.contentHash || '').trim()
        );
      })
      ? 'verified'
      : 'warning';
    const verification = createLibraryPublicStackVerification({
      libraryPublicStackVerificationId: `pstv_${randomHex(12)}`,
      libraryPublicStackId,
      houseId,
      teamId,
      verificationKind: 'bundle_integrity',
      verificationState,
      bundleHash: expectedBundleHash,
      idempotencyKey,
      metadata: {
        computedBundleHash,
        bundleHashMatches,
        memberCount: previewPayload.preview.memberCount,
        importedCount: previewPayload.preview.importedCount,
        localScopeSetId: previewPayload.preview.localScopeSet?.scopeSetId || null,
        sourceHouseId: String(previewPayload.preview.sourceHouseId || '').trim() || null,
        proofCards: Array.isArray(previewPayload.preview.proofCards) ? previewPayload.preview.proofCards : [],
      },
      nowIso: nowIso(),
    });
    previewPayload.preview.members.forEach((member) => {
      createLibraryPublicStackVerificationMember({
        libraryPublicStackVerificationMemberId: `pstvm_${randomHex(12)}`,
        libraryPublicStackVerificationId: verification.libraryPublicStackVerificationId,
        libraryPublicationId: String(member?.libraryPublicationId || '').trim(),
        registryId: String(member?.registryId || '').trim(),
        contentHash: String(member?.contentHash || '').trim() || null,
        sortIndex: Number.isFinite(Number(member?.position)) ? Number(member.position) : 0,
        verificationState: verificationState === 'verified'
          ? 'verified'
          : String(member?.libraryPublicationId || '').trim() && String(member?.registryId || '').trim() && String(member?.contentHash || '').trim()
            ? 'verified'
            : 'warning',
        metadata: {
          title: String(member?.title || '').trim() || null,
          itemType: String(member?.itemType || '').trim() || null,
          sourceKind: String(member?.sourceKind || '').trim() || null,
          sourceRef: String(member?.sourceRef || '').trim() || null,
        },
        nowIso: nowIso(),
      });
    });
    return {
      status: 201,
      verification,
      members: listLibraryPublicStackVerificationMembers({
        libraryPublicStackVerificationId: verification.libraryPublicStackVerificationId,
      }),
    };
  }

  function persistLibraryPublicStackReviewRecord({
    houseId = '',
    teamId = '',
    libraryPublicStackId = '',
    reviewTier = '',
    note = '',
    verificationRef = '',
    idempotencyKey = '',
  } = {}) {
    const existingReplay = getLibraryPublicStackReviewByIdempotency({
      houseId,
      teamId,
      idempotencyKey,
    });
    if (existingReplay) {
      return {
        status: 200,
        review: existingReplay,
      };
    }
    const summary = buildLibraryPublicStackReviewSummary({
      reviewTier,
      note,
    });
    const existing = getLibraryPublicStackReview({
      houseId,
      teamId,
      libraryPublicStackId,
    });
    if (existing) {
      return {
        status: 200,
        review: updateLibraryPublicStackReview({
          libraryPublicStackReviewId: existing.libraryPublicStackReviewId,
          reviewTier,
          summary,
          note,
          verificationRef,
          idempotencyKey,
          metadata: {
            updatedFrom: 'portal.house.library.public-stack.review',
          },
          nowIso: nowIso(),
        }),
      };
    }
    return {
      status: 201,
      review: createLibraryPublicStackReview({
        libraryPublicStackReviewId: `pstrev_${randomHex(12)}`,
        libraryPublicStackId,
        houseId,
        teamId,
        reviewTier,
        summary,
        note,
        verificationRef,
        idempotencyKey,
        metadata: {
          createdFrom: 'portal.house.library.public-stack.review',
        },
        nowIso: nowIso(),
      }),
    };
  }

  function ensureLibraryPublicStackVerification({
    houseId = '',
    teamId = '',
    libraryPublicStackId = '',
    idempotencyKey = '',
  } = {}) {
    const latestVerification = getLatestLibraryPublicStackVerification({
      houseId,
      teamId,
      libraryPublicStackId,
    });
    const previewPayload = buildLibraryPublicStackPreviewPayload({
      houseId,
      teamId,
      libraryPublicStackId,
    });
    if (!previewPayload.ok) {
      const err = new Error(previewPayload.code || 'PUBLIC_STACK_NOT_FOUND');
      err.code = previewPayload.code || 'PUBLIC_STACK_NOT_FOUND';
      err.message = previewPayload.message || 'Public Stack not found.';
      throw err;
    }
    if (
      latestVerification
      && String(latestVerification?.bundleHash || '').trim()
      && String(latestVerification?.bundleHash || '').trim() === String(previewPayload.preview?.bundleHash || '').trim()
      && String(latestVerification?.verificationState || '').trim() === 'verified'
    ) {
      return {
        status: 200,
        verification: latestVerification,
        members: listLibraryPublicStackVerificationMembers({
          libraryPublicStackVerificationId: latestVerification.libraryPublicStackVerificationId,
        }),
      };
    }
    return persistLibraryPublicStackVerificationRecord({
      houseId,
      teamId,
      libraryPublicStackId,
      idempotencyKey,
    });
  }

  function persistLibraryPeerRelayRecord({
    houseId = '',
    teamId = '',
    libraryPublicationId = '',
    registryId = '',
    targetHouseId = '',
    transportKind = 'pony.relay.registry.v1',
    relayState = 'queued',
    metadata = null,
    idempotencyKey = '',
  } = {}) {
    const existing = getLibraryPeerRelayByIdempotency({
      houseId,
      teamId,
      idempotencyKey,
    });
    if (existing) {
      return {
        status: 200,
        relay: existing,
      };
    }
    const relay = createLibraryPeerRelay({
      libraryPeerRelayId: `prelay_${randomHex(12)}`,
      houseId,
      teamId,
      libraryPublicationId,
      registryId,
      targetHouseId,
      transportKind,
      relayState,
      idempotencyKey,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      nowIso: nowIso(),
    });
    return {
      status: 201,
      relay,
    };
  }

  function persistLibraryPeerReceiptRecord({
    relay = null,
    receiptKind = 'pony_dispatch_receipt',
    receiptRef = '',
    status = 'accepted',
    metadata = null,
  } = {}) {
    const relayId = String(relay?.libraryPeerRelayId || '').trim();
    if (!relayId) {
      throw new Error('LIBRARY_PEER_RELAY_REQUIRED');
    }
    const existingReceipt = listLibraryPeerReceipts({
      libraryPeerRelayId: relayId,
    }).find((entry) => String(entry?.targetHouseId || '').trim() === String(relay?.targetHouseId || '').trim()) || null;
    if (existingReceipt) {
      return {
        status: 200,
        receipt: existingReceipt,
      };
    }
    const receipt = createLibraryPeerReceipt({
      libraryPeerReceiptId: `preceipt_${randomHex(12)}`,
      libraryPeerRelayId: relayId,
      targetHouseId: String(relay?.targetHouseId || '').trim(),
      receiptKind,
      receiptRef,
      status,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      nowIso: nowIso(),
    });
    return {
      status: 201,
      receipt,
    };
  }

  function persistLibrarySatchelRelayRecord({
    houseId = '',
    teamId = '',
    scopeSetId = '',
    targetHouseId = '',
    bundleManifest = null,
    relayState = 'queued',
    metadata = null,
    idempotencyKey = '',
  } = {}) {
    const existing = getLibrarySatchelRelayByIdempotency({
      houseId,
      teamId,
      idempotencyKey,
    });
    if (existing) {
      return {
        status: 200,
        relay: existing,
      };
    }
    const relay = createLibrarySatchelRelay({
      librarySatchelRelayId: `srelay_${randomHex(12)}`,
      houseId,
      teamId,
      scopeSetId,
      targetHouseId,
      bundleManifest,
      relayState,
      idempotencyKey,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      nowIso: nowIso(),
    });
    return {
      status: 201,
      relay,
    };
  }

  function persistLibrarySatchelReceiptRecord({
    relay = null,
    receiptKind = 'pony_dispatch_receipt',
    receiptRef = '',
    status = 'accepted',
    metadata = null,
  } = {}) {
    const relayId = String(relay?.librarySatchelRelayId || '').trim();
    if (!relayId) {
      throw new Error('LIBRARY_SATCHEL_RELAY_REQUIRED');
    }
    const existingReceipt = listLibrarySatchelReceipts({
      librarySatchelRelayId: relayId,
    }).find((entry) => String(entry?.targetHouseId || '').trim() === String(relay?.targetHouseId || '').trim()) || null;
    if (existingReceipt) {
      return {
        status: 200,
        receipt: existingReceipt,
      };
    }
    const receipt = createLibrarySatchelReceipt({
      librarySatchelReceiptId: `sreceipt_${randomHex(12)}`,
      librarySatchelRelayId: relayId,
      targetHouseId: String(relay?.targetHouseId || '').trim(),
      receiptKind,
      receiptRef,
      status,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      nowIso: nowIso(),
    });
    return {
      status: 201,
      receipt,
    };
  }

  function buildLibrarySatchelBundleManifest({
    scopeSet = null,
    scopeSetItems = [],
    itemsById = new Map(),
    publicationsByItemId = new Map(),
    targetHouseId = '',
    transportKind = 'pony.relay.registry.v1',
  } = {}) {
    const members = (Array.isArray(scopeSetItems) ? scopeSetItems : [])
      .map((scopeEntry, index) => {
        const libraryItemId = String(scopeEntry?.libraryItemId || '').trim();
        if (!libraryItemId) return null;
        const item = itemsById instanceof Map ? itemsById.get(libraryItemId) : null;
        const publication = publicationsByItemId instanceof Map ? publicationsByItemId.get(libraryItemId) : null;
        if (!item || !publication) return null;
        return {
          position: index,
          libraryItemId,
          libraryPublicationId: publication.libraryPublicationId,
          registryId: String(publication.registryId || item.registryId || '').trim(),
          contentHash: String(publication.contentHash || item.contentHash || '').trim() || null,
          itemType: String(item.itemType || '').trim() || 'library_note',
          title: String(item.title || publication.registryId || libraryItemId).trim() || libraryItemId,
          summary: String(item.summary || '').trim() || null,
          contentText: String(item.contentText || ''),
          contentRef: item.contentRef ? String(item.contentRef) : null,
          sourceKind: String(item.sourceKind || '').trim() || null,
          sourceRef: String(item.sourceRef || '').trim() || null,
        };
      })
      .filter(Boolean);
    const scopeMetadata = scopeSet?.metadata && typeof scopeSet.metadata === 'object'
      ? scopeSet.metadata
      : {};
    const manifestCore = {
      kind: 'library_satchel_bundle.v1',
      sourceHouseId: String(scopeSet?.houseId || '').trim() || null,
      sourceTeamId: String(scopeSet?.teamId || '').trim() || null,
      targetHouseId: String(targetHouseId || '').trim() || null,
      scopeSetId: String(scopeSet?.scopeSetId || '').trim() || null,
      title: String(scopeSet?.title || 'Satchel Bundle').trim() || 'Satchel Bundle',
      scopeKind: String(scopeMetadata.scopeKind || 'reading_table').trim() || 'reading_table',
      sourceShelfId: String(scopeMetadata.sourceShelfId || '').trim() || null,
      transportKind: String(transportKind || 'pony.relay.registry.v1').trim() || 'pony.relay.registry.v1',
      memberCount: members.length,
      orderedItemIds: members.map((entry) => entry.libraryItemId),
      orderedPublicationIds: members.map((entry) => entry.libraryPublicationId),
      orderedRegistryIds: members.map((entry) => entry.registryId).filter(Boolean),
      members,
    };
    return {
      ...manifestCore,
      bundleHash: sha256PrefixedHex(stableJsonStringify(manifestCore)),
    };
  }

  function buildLibraryPublicStackBundleManifest({
    scopeSet = null,
    scopeSetItems = [],
    itemsById = new Map(),
    publicationsByItemId = new Map(),
    familySlug = 'house_library_stacks',
  } = {}) {
    const satchelManifest = buildLibrarySatchelBundleManifest({
      scopeSet,
      scopeSetItems,
      itemsById,
      publicationsByItemId,
      targetHouseId: '',
      transportKind: 'registry.public_stack.v1',
    });
    const manifestCore = {
      kind: 'library_public_stack_bundle.v1',
      sourceHouseId: satchelManifest.sourceHouseId,
      sourceTeamId: satchelManifest.sourceTeamId,
      scopeSetId: satchelManifest.scopeSetId,
      title: satchelManifest.title,
      scopeKind: satchelManifest.scopeKind,
      sourceShelfId: satchelManifest.sourceShelfId,
      familySlug: String(familySlug || 'house_library_stacks').trim() || 'house_library_stacks',
      memberCount: satchelManifest.memberCount,
      orderedItemIds: satchelManifest.orderedItemIds,
      orderedPublicationIds: satchelManifest.orderedPublicationIds,
      orderedRegistryIds: satchelManifest.orderedRegistryIds,
      members: satchelManifest.members,
    };
    return {
      ...manifestCore,
      bundleHash: sha256PrefixedHex(stableJsonStringify(manifestCore)),
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

  app.get('/api/platform/library/public-stacks/search', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const query = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
    const family = typeof req.query?.family === 'string' ? req.query.family.trim() : '';
    const trust = normalizeLibraryPublicStackReviewTier(req.query?.trust);
    const groups = [
      ...(trust ? [] : searchRegistryFamilyGroups({ query, family })),
      ...searchLibraryPublicStackGroups({
        query,
        family,
        houseId: context.houseId,
        teamId: context.activeTeamId,
        trust,
      }),
    ];
    const results = flattenPublicStackSearchGroups(groups);
    setUnifiedPlatformRegistryPreviewSnapshot({
      query,
      family,
      resultCount: results.length,
      selectedRegistryId: null,
      preview: null,
    });
    return sendPortalApiSuccess(res, {
      query,
      family,
      trust,
      resultCount: results.length,
      groups,
      results,
    }, { requestId });
  });

  app.get('/api/platform/library/public-stacks/preview/:registryEntityId', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const registryEntityId = typeof req.params?.registryEntityId === 'string' ? req.params.registryEntityId.trim() : '';
    if (!registryEntityId) {
      return sendPortalApiError(res, 400, 'REGISTRY_ENTITY_REQUIRED', 'registryEntityId is required to preview a Public Stack.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const preview = buildPublicStackPreviewPayload({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      registryEntityId,
    });
    if (!preview.ok) {
      return sendPortalApiError(res, 404, preview.code || 'REGISTRY_ENTITY_NOT_FOUND', preview.message || 'Registry artifact not found.', { requestId });
    }
    const priorPreview = getUnifiedPlatformRegistryPreviewSnapshot();
    setUnifiedPlatformRegistryPreviewSnapshot({
      query: String(priorPreview?.query || '').trim(),
      family: String(priorPreview?.family || '').trim(),
      resultCount: Math.max(0, Number(priorPreview?.resultCount || 0)),
      selectedRegistryId: String(preview.preview?.registryId || preview.preview?.registryEntityId || registryEntityId).trim() || registryEntityId,
      preview: preview.preview,
    });
    return sendPortalApiSuccess(res, preview, { requestId });
  });

  app.post('/api/platform/library/public-stacks/:registryEntityId/verifications', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before verifying a Public Stack.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before verifying a Public Stack.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to verify a Public Stack.', { requestId });
    }
    const registryEntityId = typeof req.params?.registryEntityId === 'string' ? req.params.registryEntityId.trim() : '';
    if (!registryEntityId) {
      return sendPortalApiError(res, 400, 'REGISTRY_ENTITY_REQUIRED', 'registryEntityId is required to verify a Public Stack.', { requestId });
    }
    try {
      const persisted = persistLibraryPublicStackVerificationRecord({
        houseId: context.houseId,
        teamId: context.activeTeamId,
        libraryPublicStackId: registryEntityId,
        idempotencyKey,
      });
      const preview = buildLibraryPublicStackPreviewPayload({
        houseId: context.houseId,
        teamId: context.activeTeamId,
        libraryPublicStackId: registryEntityId,
      });
      return sendPortalApiSuccess(res, {
        verification: preview.ok ? preview.preview.verification : persisted.verification,
        members: persisted.members,
        proofCards: preview.ok ? preview.preview.proofCards : [],
      }, { requestId, status: persisted.status });
    } catch (err) {
      if (String(err?.code || '').trim() === 'PUBLIC_STACK_NOT_FOUND') {
        return sendPortalApiError(res, 404, 'PUBLIC_STACK_NOT_FOUND', 'Public Stack not found.', { requestId });
      }
      throw err;
    }
  });

  app.post('/api/platform/library/public-stacks/:registryEntityId/reviews', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before reviewing a Public Stack.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before reviewing a Public Stack.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to review a Public Stack.', { requestId });
    }
    const registryEntityId = typeof req.params?.registryEntityId === 'string' ? req.params.registryEntityId.trim() : '';
    if (!registryEntityId) {
      return sendPortalApiError(res, 400, 'REGISTRY_ENTITY_REQUIRED', 'registryEntityId is required to review a Public Stack.', { requestId });
    }
    const reviewTier = normalizeLibraryPublicStackReviewTier(req.body?.reviewTier);
    if (!reviewTier) {
      return sendPortalApiError(res, 400, 'LIBRARY_PUBLIC_STACK_REVIEW_TIER_REQUIRED', 'Choose one local review tier for this Public Stack.', { requestId });
    }
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
    const preview = buildLibraryPublicStackPreviewPayload({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      libraryPublicStackId: registryEntityId,
    });
    if (!preview.ok) {
      return sendPortalApiError(res, 404, preview.code || 'PUBLIC_STACK_NOT_FOUND', preview.message || 'Public Stack not found.', { requestId });
    }
    const latestVerification = getLatestLibraryPublicStackVerification({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      libraryPublicStackId: registryEntityId,
    });
    const persisted = persistLibraryPublicStackReviewRecord({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      libraryPublicStackId: registryEntityId,
      reviewTier,
      note,
      verificationRef: latestVerification?.libraryPublicStackVerificationId || '',
      idempotencyKey,
    });
    const previewAfterSave = buildLibraryPublicStackPreviewPayload({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      libraryPublicStackId: registryEntityId,
    });
    return sendPortalApiSuccess(res, {
      review: persisted.review,
      preview: previewAfterSave.ok ? previewAfterSave.preview : preview.preview,
    }, { requestId, status: persisted.status });
  });

  app.post('/api/platform/library/public-stacks/:registryEntityId/imports', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before importing a Public Stack.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before importing a Public Stack.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to import a Public Stack.', { requestId });
    }
    const registryEntityId = typeof req.params?.registryEntityId === 'string' ? req.params.registryEntityId.trim() : '';
    if (!registryEntityId) {
      return sendPortalApiError(res, 400, 'REGISTRY_ENTITY_REQUIRED', 'registryEntityId is required to import a Public Stack.', { requestId });
    }
    const resolved = buildLibraryPublicStackPreviewPayload({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      libraryPublicStackId: registryEntityId,
    });
    if (!resolved.ok) {
      return sendPortalApiError(res, 404, resolved.code || 'PUBLIC_STACK_NOT_FOUND', resolved.message || 'Public Stack not found.', { requestId });
    }
    const replayScopeSet = getScopeSetByIdempotency({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey: `${idempotencyKey}:scope`,
    });
    const replayImportedItem = Array.isArray(resolved.preview.members)
      ? resolved.preview.members.find((member) => {
          const publicationId = String(member?.libraryPublicationId || '').trim();
          if (!publicationId) return false;
          return !!getLibraryItemByIdempotency({
            houseId: context.houseId,
            teamId: context.activeTeamId,
            idempotencyKey: `${idempotencyKey}:${publicationId}`,
          });
        })
      : null;
    const importReplayDetected = !!(replayScopeSet || replayImportedItem);
    if (String(resolved.preview.reviewTier || '').trim() === 'blocked_here' && !importReplayDetected) {
      return sendPortalApiError(
        res,
        409,
        'LIBRARY_PUBLIC_STACK_BLOCKED_HERE',
        'This Public Stack is blocked here for this House. Change the local review before importing.',
        { requestId },
      );
    }
    const verificationPersisted = ensureLibraryPublicStackVerification({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      libraryPublicStackId: resolved.preview.libraryPublicStackId,
      idempotencyKey: `${idempotencyKey}:verify`,
    });
    const importedItems = [];
    const importedLinks = [];
    let createdSomething = false;
    resolved.preview.members.forEach((member) => {
      const existingImported = member.alreadyImported
        ? (member.importedItem || null)
        : null;
      if (existingImported) {
        importedItems.push(existingImported);
        importedLinks.push(...listLibraryLinks({ libraryItemId: existingImported.libraryItemId }));
        return;
      }
      const registryId = String(member.registryId || '').trim() || `regstack_${randomHex(8)}`;
      const persisted = persistLibraryItemRecord({
        houseId: context.houseId,
        teamId: context.activeTeamId,
        idempotencyKey: `${idempotencyKey}:${member.libraryPublicationId}`,
        itemType: 'imported_artifact',
        title: String(member.title || registryId).trim() || registryId,
        summary: `Imported from Public Stack · ${registryId}`,
        contentText: [
          `Public Stack: ${resolved.preview.displayName}`,
          `Public Stack ID: ${resolved.preview.libraryPublicStackId}`,
          `Source House: ${String(resolved.preview.sourceHouseId || '').trim() || 'unknown'}`,
          `Registry ID: ${registryId}`,
          `Publication ID: ${String(member.libraryPublicationId || '').trim() || '—'}`,
          `Item type: ${String(member.itemType || '').trim() || '—'}`,
          `Summary: ${String(member.summary || '').trim() || '—'}`,
          `Content hash: ${String(member.contentHash || '').trim() || '—'}`,
        ].join('\n'),
        contentRef: member.contentRef ? String(member.contentRef) : (registryId || resolved.preview.libraryPublicStackId),
        sourceKind: 'public_stack_artifact',
        sourceRef: `${resolved.preview.libraryPublicStackId}:${member.libraryPublicationId}`,
        visibility: 'house_private',
        importedState: 'imported_artifact',
        registryId,
        readOnly: true,
        metadata: {
          createdFrom: 'portal.house.library.public-stack.import',
          importKind: 'public_stack_artifact',
          sourceHouseId: String(resolved.preview.sourceHouseId || '').trim() || null,
          targetHouseId: context.houseId,
          libraryPublicStackId: resolved.preview.libraryPublicStackId,
          libraryPublicStackVerificationId: verificationPersisted.verification.libraryPublicStackVerificationId,
          verificationState: String(verificationPersisted.verification?.verificationState || '').trim() || 'verified',
          libraryPublicationId: member.libraryPublicationId,
          scopeSetId: resolved.preview.scopeSetId,
          contentHash: member.contentHash,
          bundleHash: String(resolved.preview.bundleHash || '').trim() || null,
          position: member.position,
          registryId,
        },
        links: [
          {
            linkKind: 'imported_from_public_stack',
            sourceKind: 'public_stack_artifact',
            sourceRef: resolved.preview.libraryPublicStackId,
            metadata: {
              sourceHouseId: String(resolved.preview.sourceHouseId || '').trim() || null,
              registryId,
              libraryPublicationId: member.libraryPublicationId,
              bundleHash: String(resolved.preview.bundleHash || '').trim() || null,
              libraryPublicStackVerificationId: verificationPersisted.verification.libraryPublicStackVerificationId,
            },
          },
          {
            linkKind: 'published_bundle_member',
            sourceKind: 'library_publication',
            sourceRef: member.libraryPublicationId,
            metadata: {
              registryId,
              sourceHouseId: String(resolved.preview.sourceHouseId || '').trim() || null,
              libraryPublicStackId: resolved.preview.libraryPublicStackId,
              bundleHash: String(resolved.preview.bundleHash || '').trim() || null,
              libraryPublicStackVerificationId: verificationPersisted.verification.libraryPublicStackVerificationId,
            },
          },
        ],
      });
      importedItems.push(persisted.item);
      importedLinks.push(...persisted.links);
      if (persisted.status === 201) {
        createdSomething = true;
      }
    });

    let scopeSet = resolved.preview.localScopeSet
      ? getScopeSetById(String(resolved.preview.localScopeSet.scopeSetId || '').trim())
      : findImportedPublicStackScopeSetForTarget({
          houseId: context.houseId,
          teamId: context.activeTeamId,
          libraryPublicStackId: resolved.preview.libraryPublicStackId,
          bundleHash: String(resolved.preview.bundleHash || '').trim(),
        });
    if (!scopeSet) {
      scopeSet = createScopeSet({
        scopeSetId: `scope_${randomHex(12)}`,
        houseId: context.houseId,
        teamId: context.activeTeamId,
        title: String(resolved.preview.displayName || 'Imported Public Stack').trim() || 'Imported Public Stack',
        createdBy: 'human',
        idempotencyKey: `${idempotencyKey}:scope`,
        metadata: {
          source: 'portal.house.library.public-stack.import',
          scopeKind: 'satchel',
          importKind: 'public_stack_bundle',
          libraryPublicStackId: resolved.preview.libraryPublicStackId,
          libraryPublicStackVerificationId: verificationPersisted.verification.libraryPublicStackVerificationId,
          sourceScopeSetId: resolved.preview.scopeSetId,
          bundleHash: String(resolved.preview.bundleHash || '').trim() || null,
          sourceHouseId: String(resolved.preview.sourceHouseId || '').trim() || null,
        },
        nowIso: nowIso(),
      });
      createdSomething = true;
    }
    const orderedImportedItemIds = resolved.preview.members.map((member) => {
      const directMatch = importedItems.find((item) => String(item?.sourceRef || '').trim() === `${resolved.preview.libraryPublicStackId}:${member.libraryPublicationId}`);
      if (directMatch) return directMatch.libraryItemId;
      return null;
    }).filter(Boolean);
    replaceScopeSetItems({
      scopeSetId: scopeSet.scopeSetId,
      itemIds: orderedImportedItemIds,
      nowIso: nowIso(),
    });
    updateLibraryPublicStackVerification({
      libraryPublicStackVerificationId: verificationPersisted.verification.libraryPublicStackVerificationId,
      metadata: {
        importedCount: orderedImportedItemIds.length,
        importedAll: orderedImportedItemIds.length === Number(resolved.preview.memberCount || 0),
        localScopeSetId: scopeSet.scopeSetId,
      },
      nowIso: nowIso(),
    });

    const previewAfterImport = buildLibraryPublicStackPreviewPayload({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      libraryPublicStackId: resolved.preview.libraryPublicStackId,
    });
    return sendPortalApiSuccess(res, {
      import: {
        libraryPublicStackId: resolved.preview.libraryPublicStackId,
        importedCount: importedItems.length,
        memberCount: resolved.preview.memberCount,
        createdSomething,
      },
      verification: previewAfterImport.ok ? previewAfterImport.preview.verification : verificationPersisted.verification,
      items: importedItems.map((item) => projectLibraryItemForRead(item)),
      links: importedLinks,
      scopeSet: previewAfterImport.ok ? previewAfterImport.preview.localScopeSet : {
        scopeSetId: scopeSet.scopeSetId,
        title: scopeSet.title,
        orderedItemIds: orderedImportedItemIds,
      },
    }, { requestId, status: createdSomething ? 201 : 200 });
  });

  app.post('/api/platform/library/benchmarks/run', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before running the Library benchmark.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before running the Library benchmark.', { requestId });
    }
    const benchmark = buildHouseLibraryBenchmarkPayload({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      activeScopeSetId: typeof session.activeScopeSetId === 'string' ? session.activeScopeSetId : '',
      copyAudit: req.body?.copyAudit && typeof req.body.copyAudit === 'object' ? req.body.copyAudit : {},
    });
    setUnifiedPlatformBenchmarkSnapshot(benchmark);
    return sendPortalApiSuccess(res, benchmark, { requestId });
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
    const normalizedSourceRef = sourceRef || (sourceKind === 'user_note' ? `user_note:${idempotencyKey}` : '');
    const effectiveSummary = summary || buildLibrarySummary(contentText, 'Saved in your Library.');
    if (!sourceKind || !normalizedSourceRef) {
      return sendPortalApiError(res, 400, 'LIBRARY_SOURCE_REQUIRED', 'sourceKind and sourceRef are required.', { requestId });
    }
    if (!itemType || !title || !effectiveSummary) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'itemType, title, and summary are required.', { requestId });
    }
    const persisted = persistLibraryItemRecord({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey,
      itemType,
      title,
      summary: effectiveSummary,
      contentText,
      contentRef,
      sourceKind,
      sourceRef: normalizedSourceRef,
      visibility,
      metadata: {
        createdFrom: 'portal.house.library',
      },
      links,
    });
    return sendPortalApiSuccess(res, {
      item: persisted.item,
      links: persisted.links,
      revision: persisted.revision || null,
    }, { requestId, status: persisted.status });
  });

  app.get('/api/platform/library/items/:libraryItemId/revisions', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const libraryItemId = typeof req.params?.libraryItemId === 'string' ? req.params.libraryItemId.trim() : '';
    if (!libraryItemId) {
      return sendPortalApiError(res, 400, 'LIBRARY_ITEM_REQUIRED', 'libraryItemId is required.', { requestId });
    }
    const item = getLibraryItemById(libraryItemId);
    if (!item || item.houseId !== context.houseId || item.teamId !== context.activeTeamId) {
      return sendPortalApiError(res, 404, 'LIBRARY_ITEM_NOT_FOUND', 'The requested Library item could not be found for this House team.', { requestId });
    }
    return sendPortalApiSuccess(res, {
      item: projectLibraryItemForRead(item),
      revisions: listLibraryItemRevisions({
        houseId: context.houseId,
        teamId: context.activeTeamId,
        libraryItemId,
      }),
    }, { requestId });
  });

  app.patch('/api/platform/library/items/:libraryItemId', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const libraryItemId = typeof req.params?.libraryItemId === 'string' ? req.params.libraryItemId.trim() : '';
    if (!libraryItemId) {
      return sendPortalApiError(res, 400, 'LIBRARY_ITEM_REQUIRED', 'libraryItemId is required.', { requestId });
    }
    const item = getLibraryItemById(libraryItemId);
    if (!item || item.houseId !== context.houseId || item.teamId !== context.activeTeamId) {
      return sendPortalApiError(res, 404, 'LIBRARY_ITEM_NOT_FOUND', 'The requested Library item could not be found for this House team.', { requestId });
    }
    if (item.readOnly === true || String(item.importedState || '').trim() === 'imported_artifact') {
      return sendPortalApiError(res, 409, 'LIBRARY_ITEM_READ_ONLY', 'This Library item is imported and read only.', {
        requestId,
        details: {
          libraryItemId,
          importedState: item.importedState,
          readOnly: item.readOnly === true,
        },
      });
    }
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const contentText = typeof req.body?.contentText === 'string' ? req.body.contentText : '';
    const summary = typeof req.body?.summary === 'string' ? req.body.summary.trim() : buildLibrarySummary(contentText, item.summary || 'Saved in your Library.');
    if (!title || !summary) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'title and summary are required.', { requestId });
    }
    const contentRef = typeof req.body?.contentRef === 'string' ? req.body.contentRef.trim() : (item.contentRef || '');
    const contentHash = sha256PrefixedHex(stableJsonStringify({
      itemType: item.itemType,
      title,
      summary,
      contentText,
      contentRef,
      sourceKind: item.sourceKind,
      sourceRef: item.sourceRef,
      visibility: item.visibility,
      links: listLibraryLinks({ libraryItemId }),
    }));
    const updatedAt = nowIso();
    const updated = updateLibraryItem({
      libraryItemId,
      title,
      summary,
      contentText,
      contentRef,
      contentHash,
      metadata: {
        updatedFrom: 'portal.house.library',
      },
      nowIso: updatedAt,
    });
    const revision = createLibraryItemRevisionSnapshot({
      item: updated,
      createdBy: 'human',
      metadata: {
        sourceKind: updated?.sourceKind || item.sourceKind,
        sourceRef: updated?.sourceRef || item.sourceRef,
        origin: 'portal.house.library.edit',
      },
      now: updatedAt,
    });
    return sendPortalApiSuccess(res, {
      item: projectLibraryItemForRead(updated),
      links: listLibraryLinks({ libraryItemId }),
      revision,
      revisions: listLibraryItemRevisions({
        houseId: context.houseId,
        teamId: context.activeTeamId,
        libraryItemId,
      }),
    }, { requestId });
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

  app.post('/api/platform/library/public-stacks', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before publishing a Public Stack.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before publishing a Public Stack.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to publish a Public Stack.', { requestId });
    }
    const existingPublicStack = getLibraryPublicStackByIdempotency({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey,
    });
    if (existingPublicStack) {
      return sendPortalApiSuccess(res, {
        publicStack: existingPublicStack,
        members: listLibraryPublicStackMembers({
          libraryPublicStackId: existingPublicStack.libraryPublicStackId,
        }),
      }, { requestId, status: 200 });
    }
    const scopeSetId = typeof req.body?.scopeSetId === 'string' ? req.body.scopeSetId.trim() : '';
    const familySlug = typeof req.body?.familySlug === 'string' ? req.body.familySlug.trim() : 'house_library_stacks';
    const approvalId = typeof req.body?.approvalId === 'string' ? req.body.approvalId.trim() : '';
    if (!scopeSetId) {
      return sendPortalApiError(res, 400, 'LIBRARY_SCOPE_SET_REQUIRED', 'scopeSetId is required to publish a Public Stack.', { requestId });
    }
    const scopeSet = getScopeSetById(scopeSetId);
    if (!scopeSet || scopeSet.houseId !== context.houseId || scopeSet.teamId !== context.activeTeamId) {
      return sendPortalApiError(res, 404, 'LIBRARY_SCOPE_SET_NOT_FOUND', 'The requested Reading Table or Satchel could not be found for this House team.', { requestId });
    }
    const scopeSetItems = listScopeSetItems(scopeSet.scopeSetId);
    if (!scopeSetItems.length) {
      return sendPortalApiError(res, 409, 'LIBRARY_PUBLIC_STACK_EMPTY', 'A Public Stack requires at least one Library item.', { requestId });
    }
    const itemsById = new Map(
      listLibraryItems({ houseId: context.houseId, teamId: context.activeTeamId })
        .map((item) => [item.libraryItemId, item])
    );
    const missingItemIds = scopeSetItems
      .map((entry) => String(entry?.libraryItemId || '').trim())
      .filter((libraryItemId) => libraryItemId && !itemsById.has(libraryItemId));
    if (missingItemIds.length) {
      return sendPortalApiError(res, 404, 'LIBRARY_ITEM_NOT_FOUND', 'One or more Public Stack members could not be found for this House team.', {
        requestId,
        details: {
          missingItemIds,
          scopeSetId: scopeSet.scopeSetId,
        },
      });
    }
    const blockedItemIds = scopeSetItems
      .map((entry) => String(entry?.libraryItemId || '').trim())
      .filter((libraryItemId) => {
        const item = itemsById.get(libraryItemId);
        return !!item && isLibraryItemSealActive(item);
      });
    if (blockedItemIds.length) {
      return sendPortalApiError(res, 409, 'LIBRARY_SEAL_BLOCKED', 'A sealed Library item cannot be included in a Public Stack.', {
        requestId,
        details: {
          blockedItemIds,
          scopeSetId: scopeSet.scopeSetId,
        },
      });
    }
    const publications = listLibraryPublications({
      houseId: context.houseId,
      teamId: context.activeTeamId,
    }).filter((entry) => String(entry?.publicationState || '').trim() === 'published');
    const publicationsByItemId = new Map();
    publications.forEach((publication) => {
      const libraryItemId = String(publication?.libraryItemId || '').trim();
      if (!libraryItemId || publicationsByItemId.has(libraryItemId)) return;
      publicationsByItemId.set(libraryItemId, publication);
    });
    const missingPublicationItemIds = scopeSetItems
      .map((entry) => String(entry?.libraryItemId || '').trim())
      .filter((libraryItemId) => libraryItemId && !publicationsByItemId.has(libraryItemId));
    if (missingPublicationItemIds.length) {
      return sendPortalApiError(res, 409, 'LIBRARY_PUBLIC_STACK_PUBLICATION_REQUIRED', 'Every Public Stack member must be published before bundle publication.', {
        requestId,
        details: {
          missingPublicationItemIds,
          scopeSetId: scopeSet.scopeSetId,
        },
      });
    }
    const approval = resolveApprovedLibraryPublicStackApproval(approvalId, {
      houseId: context.houseId,
      scopeSetId: scopeSet.scopeSetId,
      familySlug,
    });
    if (!approval) {
      return sendPortalApiError(res, 409, 'LIBRARY_PUBLIC_STACK_APPROVAL_REQUIRED', 'Publishing a Public Stack requires explicit approval.', {
        requestId,
        details: {
          approvalId: approvalId || null,
          approvalKind: 'library_public_stack',
          scopeSetId: scopeSet.scopeSetId,
          familySlug,
        },
      });
    }
    const manifest = buildLibraryPublicStackBundleManifest({
      scopeSet,
      scopeSetItems,
      itemsById,
      publicationsByItemId,
      familySlug,
    });
    const persisted = persistLibraryPublicStackRecord({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      scopeSetId: scopeSet.scopeSetId,
      familySlug,
      title: String(manifest?.title || scopeSet.title || 'Public Stack').trim() || 'Public Stack',
      summary: `Published from ${context.houseId} · ${manifest.memberCount} curated Library item${manifest.memberCount === 1 ? '' : 's'}.`,
      manifest,
      metadata: {
        approvalId: approval.approvalId,
        approvalKind: approval.approvalKind,
        sourceScopeKind: String(manifest?.scopeKind || 'reading_table').trim() || 'reading_table',
        memberCount: manifest.memberCount,
      },
      idempotencyKey,
    });
    return sendPortalApiSuccess(res, {
      publicStack: persisted.publicStack,
      members: persisted.members,
      bundleManifest: manifest,
      scopeSet: {
        scopeSetId: scopeSet.scopeSetId,
        title: scopeSet.title,
        scopeKind: String(scopeSet?.metadata?.scopeKind || 'reading_table').trim() || 'reading_table',
        orderedItemIds: manifest.orderedItemIds,
      },
    }, { requestId, status: persisted.status });
  });

  app.post('/api/platform/library/peer-relays', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before relaying a Library publication.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before relaying a Library publication.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to relay a Library publication.', { requestId });
    }
    const existingRelay = getLibraryPeerRelayByIdempotency({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey,
    });
    if (existingRelay) {
      return sendPortalApiSuccess(res, {
        relay: existingRelay,
      }, { requestId, status: 200 });
    }
    const libraryPublicationId = typeof req.body?.libraryPublicationId === 'string' ? req.body.libraryPublicationId.trim() : '';
    const targetHouseId = typeof req.body?.targetHouseId === 'string' ? req.body.targetHouseId.trim() : '';
    const transportKind = typeof req.body?.transportKind === 'string' ? req.body.transportKind.trim() : 'pony.relay.registry.v1';
    const approvalId = typeof req.body?.approvalId === 'string' ? req.body.approvalId.trim() : '';
    if (!libraryPublicationId) {
      return sendPortalApiError(res, 400, 'LIBRARY_PUBLICATION_REQUIRED', 'libraryPublicationId is required to relay a Library publication.', { requestId });
    }
    if (!targetHouseId) {
      return sendPortalApiError(res, 400, 'TARGET_HOUSE_REQUIRED', 'targetHouseId is required to relay a Library publication.', { requestId });
    }
    const publication = getLibraryPublicationById(libraryPublicationId);
    if (!publication || publication.houseId !== context.houseId || publication.teamId !== context.activeTeamId) {
      return sendPortalApiError(res, 404, 'LIBRARY_PUBLICATION_NOT_FOUND', 'The requested Library publication could not be found for this House team.', { requestId });
    }
    const item = publication.libraryItemId ? getLibraryItemById(publication.libraryItemId) : null;
    if (!item) {
      return sendPortalApiError(res, 409, 'LIBRARY_PUBLICATION_ITEM_REQUIRED', 'The published Library item could not be resolved for relay.', { requestId });
    }
    const target = resolveKnownHouseTarget(targetHouseId);
    if (!target) {
      return sendPortalApiError(res, 404, 'TARGET_HOUSE_NOT_FOUND', 'The requested target house could not be found.', { requestId });
    }
    const approval = resolveApprovedLibraryPeerRelayApproval(approvalId, {
      houseId: context.houseId,
      libraryPublicationId,
      targetHouseId: target.houseId,
      transportKind,
    });
    if (!approval) {
      return sendPortalApiError(res, 409, 'LIBRARY_PEER_RELAY_APPROVAL_REQUIRED', 'Relaying a Library publication requires explicit approval.', {
        requestId,
        details: {
          approvalId: approvalId || null,
          approvalKind: 'library_peer_relay',
          libraryPublicationId,
          targetHouseId: target.houseId,
          transportKind,
        },
      });
    }
    const persisted = persistLibraryPeerRelayRecord({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      libraryPublicationId,
      registryId: String(publication.registryId || item.registryId || '').trim() || `regrelay_${randomHex(8)}`,
      targetHouseId: target.houseId,
      transportKind,
      relayState: 'queued',
      idempotencyKey,
      metadata: {
        approvalId: approval.approvalId,
        approvalKind: approval.approvalKind,
        sourceLibraryItemId: item.libraryItemId,
        sourceContentHash: item.contentHash,
      },
    });
    return sendPortalApiSuccess(res, {
      relay: persisted.relay,
      publication: {
        libraryPublicationId: publication.libraryPublicationId,
        libraryItemId: publication.libraryItemId,
        registryId: publication.registryId,
        contentHash: publication.contentHash,
      },
      target: {
        houseId: target.houseId,
      },
    }, { requestId, status: persisted.status });
  });

  app.post('/api/platform/library/satchel-relays', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before relaying a Satchel bundle.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before relaying a Satchel bundle.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to relay a Satchel bundle.', { requestId });
    }
    const existingRelay = getLibrarySatchelRelayByIdempotency({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey,
    });
    if (existingRelay) {
      return sendPortalApiSuccess(res, {
        relay: existingRelay,
      }, { requestId, status: 200 });
    }
    const scopeSetId = typeof req.body?.scopeSetId === 'string' ? req.body.scopeSetId.trim() : '';
    const targetHouseId = typeof req.body?.targetHouseId === 'string' ? req.body.targetHouseId.trim() : '';
    const transportKind = typeof req.body?.transportKind === 'string' ? req.body.transportKind.trim() : 'pony.relay.registry.v1';
    const approvalId = typeof req.body?.approvalId === 'string' ? req.body.approvalId.trim() : '';
    if (!scopeSetId) {
      return sendPortalApiError(res, 400, 'LIBRARY_SCOPE_SET_REQUIRED', 'scopeSetId is required to relay a Satchel bundle.', { requestId });
    }
    if (!targetHouseId) {
      return sendPortalApiError(res, 400, 'TARGET_HOUSE_REQUIRED', 'targetHouseId is required to relay a Satchel bundle.', { requestId });
    }
    const scopeSet = getScopeSetById(scopeSetId);
    if (!scopeSet || scopeSet.houseId !== context.houseId || scopeSet.teamId !== context.activeTeamId) {
      return sendPortalApiError(res, 404, 'LIBRARY_SCOPE_SET_NOT_FOUND', 'The requested Reading Table or Satchel could not be found for this House team.', { requestId });
    }
    const scopeSetItems = listScopeSetItems(scopeSet.scopeSetId);
    if (!scopeSetItems.length) {
      return sendPortalApiError(res, 409, 'LIBRARY_SATCHEL_EMPTY', 'A Satchel bundle requires at least one Library item.', { requestId });
    }
    const itemsById = new Map(
      listLibraryItems({ houseId: context.houseId, teamId: context.activeTeamId })
        .map((item) => [item.libraryItemId, item])
    );
    const missingItemIds = scopeSetItems
      .map((entry) => String(entry?.libraryItemId || '').trim())
      .filter((libraryItemId) => libraryItemId && !itemsById.has(libraryItemId));
    if (missingItemIds.length) {
      return sendPortalApiError(res, 404, 'LIBRARY_ITEM_NOT_FOUND', 'One or more Satchel members could not be found for this House team.', {
        requestId,
        details: {
          missingItemIds,
          scopeSetId: scopeSet.scopeSetId,
        },
      });
    }
    const publications = listLibraryPublications({
      houseId: context.houseId,
      teamId: context.activeTeamId,
    }).filter((entry) => String(entry?.publicationState || '').trim() === 'published');
    const publicationsByItemId = new Map();
    publications.forEach((publication) => {
      const libraryItemId = String(publication?.libraryItemId || '').trim();
      if (!libraryItemId || publicationsByItemId.has(libraryItemId)) return;
      publicationsByItemId.set(libraryItemId, publication);
    });
    const missingPublicationItemIds = scopeSetItems
      .map((entry) => String(entry?.libraryItemId || '').trim())
      .filter((libraryItemId) => libraryItemId && !publicationsByItemId.has(libraryItemId));
    if (missingPublicationItemIds.length) {
      return sendPortalApiError(res, 409, 'LIBRARY_SATCHEL_PUBLICATION_REQUIRED', 'Every Satchel member must be published before relay.', {
        requestId,
        details: {
          missingPublicationItemIds,
          scopeSetId: scopeSet.scopeSetId,
        },
      });
    }
    const target = resolveKnownHouseTarget(targetHouseId);
    if (!target) {
      return sendPortalApiError(res, 404, 'TARGET_HOUSE_NOT_FOUND', 'The requested target house could not be found.', { requestId });
    }
    const approval = resolveApprovedLibrarySatchelRelayApproval(approvalId, {
      houseId: context.houseId,
      scopeSetId: scopeSet.scopeSetId,
      targetHouseId: target.houseId,
      transportKind,
    });
    if (!approval) {
      return sendPortalApiError(res, 409, 'LIBRARY_SATCHEL_RELAY_APPROVAL_REQUIRED', 'Relaying a Satchel bundle requires explicit approval.', {
        requestId,
        details: {
          approvalId: approvalId || null,
          approvalKind: 'library_satchel_relay',
          scopeSetId: scopeSet.scopeSetId,
          targetHouseId: target.houseId,
          transportKind,
        },
      });
    }
    const bundleManifest = buildLibrarySatchelBundleManifest({
      scopeSet,
      scopeSetItems,
      itemsById,
      publicationsByItemId,
      targetHouseId: target.houseId,
      transportKind,
    });
    const persisted = persistLibrarySatchelRelayRecord({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      scopeSetId: scopeSet.scopeSetId,
      targetHouseId: target.houseId,
      bundleManifest,
      relayState: 'queued',
      idempotencyKey,
      metadata: {
        approvalId: approval.approvalId,
        approvalKind: approval.approvalKind,
        memberCount: bundleManifest.memberCount,
        transportKind: bundleManifest.transportKind,
        bundleHash: bundleManifest.bundleHash,
      },
    });
    return sendPortalApiSuccess(res, {
      relay: persisted.relay,
      scopeSet: {
        scopeSetId: scopeSet.scopeSetId,
        title: scopeSet.title,
        scopeKind: String(scopeSet?.metadata?.scopeKind || 'reading_table').trim() || 'reading_table',
        orderedItemIds: bundleManifest.orderedItemIds,
      },
      bundleManifest,
      target: {
        houseId: target.houseId,
      },
    }, { requestId, status: persisted.status });
  });

  app.post('/api/platform/library/satchel-relays/:librarySatchelRelayId/deliver', express.json({ limit: '16kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before delivering a Satchel relay.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before delivering a Satchel relay.', { requestId });
    }
    const librarySatchelRelayId = typeof req.params?.librarySatchelRelayId === 'string' ? req.params.librarySatchelRelayId.trim() : '';
    if (!librarySatchelRelayId) {
      return sendPortalApiError(res, 400, 'LIBRARY_SATCHEL_RELAY_REQUIRED', 'librarySatchelRelayId is required.', { requestId });
    }
    const relay = getLibrarySatchelRelayById(librarySatchelRelayId);
    if (!relay || relay.houseId !== context.houseId || relay.teamId !== context.activeTeamId) {
      return sendPortalApiError(res, 404, 'LIBRARY_SATCHEL_RELAY_NOT_FOUND', 'The requested Satchel relay could not be found for this House team.', { requestId });
    }
    const existingReceipt = listLibrarySatchelReceipts({
      librarySatchelRelayId,
    }).find((entry) => String(entry?.targetHouseId || '').trim() === String(relay?.targetHouseId || '').trim()) || null;
    if (existingReceipt) {
      const existingRelay = updateLibrarySatchelRelay({
        librarySatchelRelayId,
        relayState: 'accepted',
        metadata: {
          deliveredReceiptId: existingReceipt.librarySatchelReceiptId,
          deliveredReceiptRef: existingReceipt.receiptRef,
        },
        nowIso: nowIso(),
      }) || relay;
      return sendPortalApiSuccess(res, {
        relay: existingRelay,
        receipt: existingReceipt,
      }, { requestId, status: 200 });
    }
    const target = resolveKnownHouseTarget(relay.targetHouseId);
    if (!target) {
      return sendPortalApiError(res, 404, 'TARGET_HOUSE_NOT_FOUND', 'The target house for this Satchel relay could not be found.', { requestId });
    }
    let delivery;
    try {
      delivery = dispatchLibrarySatchelRelayEnvelope({
        relay,
        targetHouseId: target.houseId,
      });
    } catch (error) {
      const message = String(error?.message || 'LIBRARY_SATCHEL_RELAY_DELIVERY_FAILED');
      if (message === 'TARGET_HOUSE_NOT_FOUND') {
        return sendPortalApiError(res, 404, message, 'The target house for this Satchel relay could not be found.', { requestId });
      }
      return sendPortalApiError(res, 502, 'LIBRARY_SATCHEL_RELAY_DELIVERY_FAILED', 'The Satchel relay could not be delivered to Pony inbox.', {
        requestId,
        details: {
          relayId: librarySatchelRelayId,
          cause: message,
        },
      });
    }
    const receiptPersisted = persistLibrarySatchelReceiptRecord({
      relay,
      receiptKind: 'pony_dispatch_receipt',
      receiptRef: String(delivery?.dispatch?.receiptId || '').trim(),
      status: 'accepted',
      metadata: {
        messageId: String(delivery?.message?.id || '').trim() || null,
        messageKind: String(delivery?.message?.kind || '').trim() || null,
        dispatchAdapter: String(delivery?.dispatch?.adapter || '').trim() || null,
        transportKind: String(delivery?.dispatch?.transportKind || relay?.bundleManifest?.transportKind || relay?.metadata?.transportKind || '').trim() || null,
        scopeSetId: relay.scopeSetId,
        bundleHash: String(relay?.bundleManifest?.bundleHash || '').trim() || null,
        memberCount: Math.max(0, Number(relay?.bundleManifest?.memberCount || 0)),
      },
    });
    const updatedRelay = updateLibrarySatchelRelay({
      librarySatchelRelayId,
      relayState: 'accepted',
      metadata: {
        deliveredReceiptId: receiptPersisted.receipt?.librarySatchelReceiptId || null,
        deliveredReceiptRef: receiptPersisted.receipt?.receiptRef || null,
        deliveredMessageId: String(delivery?.message?.id || '').trim() || null,
        targetInboxState: 'accepted',
      },
      nowIso: nowIso(),
    }) || relay;
    return sendPortalApiSuccess(res, {
      relay: updatedRelay,
      receipt: receiptPersisted.receipt,
      dispatch: delivery?.dispatch || null,
      target: {
        houseId: target.houseId,
      },
    }, { requestId, status: receiptPersisted.status });
  });

  app.get('/api/platform/library/satchel-relays/incoming', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before reading incoming Satchel relays.', { requestId });
    }
    return sendPortalApiSuccess(res, {
      incomingRelays: buildIncomingLibrarySatchelRelayList({
        houseId: context.houseId,
        teamId: context.activeTeamId,
      }),
    }, { requestId });
  });

  app.get('/api/platform/library/satchel-relays/:librarySatchelRelayId/preview', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before previewing a relayed Satchel bundle.', { requestId });
    }
    const librarySatchelRelayId = typeof req.params?.librarySatchelRelayId === 'string' ? req.params.librarySatchelRelayId.trim() : '';
    if (!librarySatchelRelayId) {
      return sendPortalApiError(res, 400, 'LIBRARY_SATCHEL_RELAY_REQUIRED', 'librarySatchelRelayId is required.', { requestId });
    }
    const previewPayload = buildLibrarySatchelRelayPreviewPayload({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      librarySatchelRelayId,
    });
    if (!previewPayload.ok) {
      const status = String(previewPayload?.code || '').trim() === 'LIBRARY_SATCHEL_RELAY_NOT_DELIVERED' ? 409 : 404;
      return sendPortalApiError(res, status, previewPayload.code || 'LIBRARY_SATCHEL_RELAY_NOT_FOUND', previewPayload.message || 'The requested Satchel relay could not be previewed.', {
        requestId,
      });
    }
    return sendPortalApiSuccess(res, {
      preview: previewPayload.preview,
    }, { requestId });
  });

  app.post('/api/platform/library/satchel-relays/:librarySatchelRelayId/imports', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before importing a relayed Satchel bundle.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before importing a relayed Satchel bundle.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to import a relayed Satchel bundle.', { requestId });
    }
    const librarySatchelRelayId = typeof req.params?.librarySatchelRelayId === 'string' ? req.params.librarySatchelRelayId.trim() : '';
    if (!librarySatchelRelayId) {
      return sendPortalApiError(res, 400, 'LIBRARY_SATCHEL_RELAY_REQUIRED', 'librarySatchelRelayId is required.', { requestId });
    }
    const resolved = resolveIncomingLibrarySatchelRelay({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      librarySatchelRelayId,
    });
    if (!resolved.ok) {
      const status = String(resolved?.code || '').trim() === 'LIBRARY_SATCHEL_RELAY_NOT_DELIVERED' ? 409 : 404;
      return sendPortalApiError(res, status, resolved.code || 'LIBRARY_SATCHEL_RELAY_NOT_FOUND', resolved.message || 'The requested Satchel relay could not be imported.', {
        requestId,
      });
    }
    const requestedPublicationIds = Array.isArray(req.body?.libraryPublicationIds)
      ? req.body.libraryPublicationIds.map((entry) => String(entry || '').trim()).filter(Boolean)
      : [];
    const requestedPublicationIdSet = new Set(requestedPublicationIds);
    const selectedMembers = requestedPublicationIds.length
      ? resolved.members.filter((member) => requestedPublicationIdSet.has(String(member?.libraryPublicationId || '').trim()))
      : [...resolved.members];
    const selectedPublicationIds = selectedMembers.map((member) => String(member?.libraryPublicationId || '').trim()).filter(Boolean);
    if (requestedPublicationIds.length && selectedMembers.length !== requestedPublicationIdSet.size) {
      const missingPublicationIds = requestedPublicationIds.filter((publicationId) => !selectedPublicationIds.includes(publicationId));
      return sendPortalApiError(res, 404, 'LIBRARY_SATCHEL_MEMBER_NOT_FOUND', 'One or more requested Satchel members could not be found in this bundle.', {
        requestId,
        details: {
          missingPublicationIds,
        },
      });
    }
    if (!selectedMembers.length) {
      return sendPortalApiError(res, 409, 'LIBRARY_SATCHEL_IMPORT_EMPTY', 'Select at least one Satchel member to import.', { requestId });
    }

    const importedItems = [];
    const importedLinks = [];
    let createdSomething = false;
    selectedMembers.forEach((member) => {
      const existingImported = resolved.importedItems instanceof Map
        ? (resolved.importedItems.get(member.libraryPublicationId) || resolved.importedItems.get(member.registryId) || null)
        : null;
      if (existingImported) {
        importedItems.push(existingImported);
        importedLinks.push(...listLibraryLinks({ libraryItemId: existingImported.libraryItemId }));
        return;
      }
      const registryId = String(member.registryId || '').trim() || `regrelay_${randomHex(8)}`;
      const persisted = persistLibraryItemRecord({
        houseId: context.houseId,
        teamId: context.activeTeamId,
        idempotencyKey: `${idempotencyKey}:${member.libraryPublicationId}`,
        itemType: 'imported_artifact',
        title: String(member.title || registryId).trim() || registryId,
        summary: `Relayed from ${String(resolved.relay?.houseId || '').trim() || 'another House'} · ${registryId}`,
        contentText: String(member.contentText || ''),
        contentRef: member.contentRef ? String(member.contentRef) : (registryId || resolved.relay.librarySatchelRelayId),
        sourceKind: 'satchel_relay_artifact',
        sourceRef: `${resolved.relay.librarySatchelRelayId}:${member.libraryPublicationId}`,
        visibility: 'house_private',
        importedState: 'imported_artifact',
        registryId,
        readOnly: true,
        metadata: {
          createdFrom: 'portal.house.library.satchel-relay.import',
          importKind: 'satchel_relay_artifact',
          sourceHouseId: String(resolved.relay?.houseId || '').trim() || null,
          targetHouseId: context.houseId,
          librarySatchelRelayId: resolved.relay.librarySatchelRelayId,
          libraryPublicationId: member.libraryPublicationId,
          receiptId: resolved.receipt.librarySatchelReceiptId,
          receiptRef: resolved.receipt.receiptRef,
          contentHash: member.contentHash,
          bundleHash: String(resolved.bundleManifest?.bundleHash || '').trim() || null,
          position: member.position,
          registryId,
        },
        links: [
          {
            linkKind: 'imported_from_satchel_relay',
            sourceKind: 'satchel_relay_artifact',
            sourceRef: resolved.relay.librarySatchelRelayId,
            metadata: {
              sourceHouseId: String(resolved.relay?.houseId || '').trim() || null,
              registryId,
              libraryPublicationId: member.libraryPublicationId,
              receiptRef: resolved.receipt.receiptRef,
              bundleHash: String(resolved.bundleManifest?.bundleHash || '').trim() || null,
            },
          },
          {
            linkKind: 'relayed_publication',
            sourceKind: 'library_publication',
            sourceRef: member.libraryPublicationId,
            metadata: {
              registryId,
              sourceHouseId: String(resolved.relay?.houseId || '').trim() || null,
              librarySatchelRelayId: resolved.relay.librarySatchelRelayId,
              bundleHash: String(resolved.bundleManifest?.bundleHash || '').trim() || null,
            },
          },
        ],
      });
      importedItems.push(persisted.item);
      importedLinks.push(...persisted.links);
      if (persisted.status === 201) {
        createdSomething = true;
      }
      if (resolved.importedItems instanceof Map) {
        resolved.importedItems.set(member.libraryPublicationId, persisted.item);
        if (registryId) {
          resolved.importedItems.set(registryId, persisted.item);
        }
      }
    });

    const isFullImport = selectedMembers.length === resolved.members.length;
    let scopeSet = null;
    if (isFullImport) {
      scopeSet = resolved.localScopeSet || findImportedSatchelScopeSetForRelay({
        houseId: context.houseId,
        teamId: context.activeTeamId,
        librarySatchelRelayId: resolved.relay.librarySatchelRelayId,
        bundleHash: String(resolved.bundleManifest?.bundleHash || '').trim(),
      });
      if (!scopeSet) {
        scopeSet = createScopeSet({
          scopeSetId: `scope_${randomHex(12)}`,
          houseId: context.houseId,
          teamId: context.activeTeamId,
          title: String(resolved.bundleManifest?.title || 'Imported Satchel').trim() || 'Imported Satchel',
          createdBy: 'human',
          idempotencyKey: `${idempotencyKey}:scope`,
          metadata: {
            source: 'portal.house.library.satchel-relay.import',
            scopeKind: 'satchel',
            librarySatchelRelayId: resolved.relay.librarySatchelRelayId,
            sourceScopeSetId: resolved.relay.scopeSetId,
            bundleHash: String(resolved.bundleManifest?.bundleHash || '').trim() || null,
            sourceHouseId: String(resolved.relay?.houseId || '').trim() || null,
          },
          nowIso: nowIso(),
        });
        createdSomething = true;
      }
      const orderedImportedItemIds = resolved.members.map((member) => {
        const importedItem = resolved.importedItems instanceof Map
          ? (resolved.importedItems.get(member.libraryPublicationId) || resolved.importedItems.get(member.registryId) || null)
          : null;
        return importedItem ? importedItem.libraryItemId : null;
      }).filter(Boolean);
      replaceScopeSetItems({
        scopeSetId: scopeSet.scopeSetId,
        itemIds: orderedImportedItemIds,
        nowIso: nowIso(),
      });
      resolved.localScopeSet = scopeSet;
    }

    return sendPortalApiSuccess(res, {
      import: {
        librarySatchelRelayId,
        selectionKind: isFullImport ? 'full' : 'subset',
        importedCount: importedItems.length,
        memberCount: resolved.members.length,
      },
      items: importedItems.map((item) => projectLibraryItemForRead(item)),
      links: importedLinks,
      scopeSet: scopeSet
        ? {
            scopeSetId: scopeSet.scopeSetId,
            title: scopeSet.title,
            scopeKind: 'satchel',
            orderedItemIds: listScopeSetItems(scopeSet.scopeSetId).map((entry) => entry.libraryItemId),
          }
        : null,
    }, { requestId, status: createdSomething ? 201 : 200 });
  });

  app.post('/api/platform/library/peer-relays/:libraryPeerRelayId/deliver', express.json({ limit: '16kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before delivering a Library relay.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before delivering a Library relay.', { requestId });
    }
    const libraryPeerRelayId = typeof req.params?.libraryPeerRelayId === 'string' ? req.params.libraryPeerRelayId.trim() : '';
    if (!libraryPeerRelayId) {
      return sendPortalApiError(res, 400, 'LIBRARY_PEER_RELAY_REQUIRED', 'libraryPeerRelayId is required.', { requestId });
    }
    const relay = getLibraryPeerRelayById(libraryPeerRelayId);
    if (!relay || relay.houseId !== context.houseId || relay.teamId !== context.activeTeamId) {
      return sendPortalApiError(res, 404, 'LIBRARY_PEER_RELAY_NOT_FOUND', 'The requested Library relay could not be found for this House team.', { requestId });
    }
    const existingReceipt = listLibraryPeerReceipts({
      libraryPeerRelayId,
    }).find((entry) => String(entry?.targetHouseId || '').trim() === String(relay?.targetHouseId || '').trim()) || null;
    if (existingReceipt) {
      const existingRelay = updateLibraryPeerRelay({
        libraryPeerRelayId,
        relayState: 'accepted',
        metadata: {
          deliveredReceiptId: existingReceipt.libraryPeerReceiptId,
          deliveredReceiptRef: existingReceipt.receiptRef,
        },
        nowIso: nowIso(),
      }) || relay;
      return sendPortalApiSuccess(res, {
        relay: existingRelay,
        receipt: existingReceipt,
      }, { requestId, status: 200 });
    }
    const publication = relay.libraryPublicationId ? getLibraryPublicationById(relay.libraryPublicationId) : null;
    if (!publication) {
      return sendPortalApiError(res, 404, 'LIBRARY_PUBLICATION_NOT_FOUND', 'The source publication for this relay could not be found.', { requestId });
    }
    const item = publication.libraryItemId ? getLibraryItemById(publication.libraryItemId) : null;
    if (!item) {
      return sendPortalApiError(res, 409, 'LIBRARY_PUBLICATION_ITEM_REQUIRED', 'The published Library item could not be resolved for delivery.', { requestId });
    }
    const target = resolveKnownHouseTarget(relay.targetHouseId);
    if (!target) {
      return sendPortalApiError(res, 404, 'TARGET_HOUSE_NOT_FOUND', 'The target house for this relay could not be found.', { requestId });
    }
    let delivery;
    try {
      delivery = dispatchLibraryPeerRelayEnvelope({
        relay,
        publication,
        item,
        targetHouseId: target.houseId,
      });
    } catch (error) {
      const message = String(error?.message || 'LIBRARY_PEER_RELAY_DELIVERY_FAILED');
      if (message === 'TARGET_HOUSE_NOT_FOUND') {
        return sendPortalApiError(res, 404, message, 'The target house for this relay could not be found.', { requestId });
      }
      return sendPortalApiError(res, 502, 'LIBRARY_PEER_RELAY_DELIVERY_FAILED', 'The Library relay could not be delivered to Pony inbox.', {
        requestId,
        details: {
          relayId: libraryPeerRelayId,
          cause: message,
        },
      });
    }
    const receiptPersisted = persistLibraryPeerReceiptRecord({
      relay,
      receiptKind: 'pony_dispatch_receipt',
      receiptRef: String(delivery?.dispatch?.receiptId || '').trim(),
      status: 'accepted',
      metadata: {
        messageId: String(delivery?.message?.id || '').trim() || null,
        messageKind: String(delivery?.message?.kind || '').trim() || null,
        dispatchAdapter: String(delivery?.dispatch?.adapter || '').trim() || null,
        transportKind: String(delivery?.dispatch?.transportKind || relay?.transportKind || '').trim() || null,
        registryId: String(relay?.registryId || publication?.registryId || '').trim() || null,
        libraryPublicationId: publication.libraryPublicationId,
      },
    });
    const updatedRelay = updateLibraryPeerRelay({
      libraryPeerRelayId,
      relayState: 'accepted',
      metadata: {
        deliveredReceiptId: receiptPersisted.receipt?.libraryPeerReceiptId || null,
        deliveredReceiptRef: receiptPersisted.receipt?.receiptRef || null,
        deliveredMessageId: String(delivery?.message?.id || '').trim() || null,
        targetInboxState: 'accepted',
      },
      nowIso: nowIso(),
    }) || relay;
    return sendPortalApiSuccess(res, {
      relay: updatedRelay,
      receipt: receiptPersisted.receipt,
      dispatch: delivery?.dispatch || null,
      target: {
        houseId: target.houseId,
      },
    }, { requestId, status: receiptPersisted.status });
  });

  app.get('/api/platform/library/peer-relays/incoming', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before reading incoming Library relays.', { requestId });
    }
    return sendPortalApiSuccess(res, {
      incomingRelays: buildIncomingLibraryPeerRelayList({
        houseId: context.houseId,
        teamId: context.activeTeamId,
      }),
    }, { requestId });
  });

  app.get('/api/platform/library/peer-relays/:libraryPeerRelayId/preview', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before previewing a relayed Library publication.', { requestId });
    }
    const libraryPeerRelayId = typeof req.params?.libraryPeerRelayId === 'string' ? req.params.libraryPeerRelayId.trim() : '';
    if (!libraryPeerRelayId) {
      return sendPortalApiError(res, 400, 'LIBRARY_PEER_RELAY_REQUIRED', 'libraryPeerRelayId is required.', { requestId });
    }
    const previewPayload = buildLibraryPeerRelayPreviewPayload({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      libraryPeerRelayId,
    });
    if (!previewPayload.ok) {
      const status = String(previewPayload?.code || '').trim() === 'LIBRARY_PEER_RELAY_NOT_DELIVERED' ? 409 : 404;
      return sendPortalApiError(res, status, previewPayload.code || 'LIBRARY_PEER_RELAY_NOT_FOUND', previewPayload.message || 'The requested Library relay could not be previewed.', {
        requestId,
      });
    }
    return sendPortalApiSuccess(res, {
      preview: previewPayload.preview,
    }, { requestId });
  });

  app.post('/api/platform/library/peer-relays/:libraryPeerRelayId/imports', express.json({ limit: '16kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before importing a relayed Library publication.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before importing a relayed Library publication.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to import a relayed Library publication.', { requestId });
    }
    const libraryPeerRelayId = typeof req.params?.libraryPeerRelayId === 'string' ? req.params.libraryPeerRelayId.trim() : '';
    if (!libraryPeerRelayId) {
      return sendPortalApiError(res, 400, 'LIBRARY_PEER_RELAY_REQUIRED', 'libraryPeerRelayId is required.', { requestId });
    }
    const resolved = resolveIncomingLibraryPeerRelay({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      libraryPeerRelayId,
    });
    if (!resolved.ok) {
      const status = String(resolved?.code || '').trim() === 'LIBRARY_PEER_RELAY_NOT_DELIVERED' ? 409 : 404;
      return sendPortalApiError(res, status, resolved.code || 'LIBRARY_PEER_RELAY_NOT_FOUND', resolved.message || 'The requested Library relay could not be imported.', {
        requestId,
      });
    }
    const existingReplay = getLibraryItemByIdempotency({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey,
    });
    if (existingReplay) {
      return sendPortalApiSuccess(res, {
        import: {
          libraryPeerRelayId,
          registryId: existingReplay.registryId,
        },
        item: projectLibraryItemForRead(existingReplay),
        links: listLibraryLinks({ libraryItemId: existingReplay.libraryItemId }),
      }, { requestId, status: 200 });
    }
    if (resolved.importedItem) {
      return sendPortalApiSuccess(res, {
        import: {
          libraryPeerRelayId,
          registryId: resolved.importedItem.registryId,
        },
        item: projectLibraryItemForRead(resolved.importedItem),
        links: listLibraryLinks({ libraryItemId: resolved.importedItem.libraryItemId }),
      }, { requestId, status: 200 });
    }
    const registryId = String(resolved.relay?.registryId || resolved.publication?.registryId || resolved.item?.registryId || '').trim()
      || `regrelay_${randomHex(8)}`;
    const sourceHouseId = String(resolved.relay?.houseId || '').trim() || null;
    const persisted = persistLibraryItemRecord({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey,
      itemType: 'imported_artifact',
      title: String(resolved.item?.title || registryId).trim() || registryId,
      summary: `Relayed from ${sourceHouseId || 'another House'} · ${registryId}`,
      contentText: String(resolved.item?.contentText || ''),
      contentRef: resolved.item?.contentRef ? String(resolved.item.contentRef) : (registryId || resolved.relay.libraryPeerRelayId),
      sourceKind: 'peer_relay_artifact',
      sourceRef: resolved.relay.libraryPeerRelayId,
      visibility: 'house_private',
      importedState: 'imported_artifact',
      registryId,
      readOnly: true,
      metadata: {
        createdFrom: 'portal.house.library.peer-relay.import',
        importKind: 'peer_relay_artifact',
        sourceHouseId,
        targetHouseId: context.houseId,
        libraryPeerRelayId: resolved.relay.libraryPeerRelayId,
        libraryPublicationId: resolved.publication.libraryPublicationId,
        receiptId: resolved.receipt.libraryPeerReceiptId,
        receiptRef: resolved.receipt.receiptRef,
        contentHash: String(resolved.publication?.contentHash || resolved.item?.contentHash || '').trim() || null,
      },
      links: [
        {
          linkKind: 'imported_from_peer_relay',
          sourceKind: 'peer_relay_artifact',
          sourceRef: resolved.relay.libraryPeerRelayId,
          metadata: {
            sourceHouseId,
            registryId,
            libraryPublicationId: resolved.publication.libraryPublicationId,
            receiptRef: resolved.receipt.receiptRef,
          },
        },
        {
          linkKind: 'relayed_publication',
          sourceKind: 'library_publication',
          sourceRef: resolved.publication.libraryPublicationId,
          metadata: {
            registryId,
            sourceHouseId,
            libraryPeerRelayId: resolved.relay.libraryPeerRelayId,
          },
        },
      ],
    });
    return sendPortalApiSuccess(res, {
      import: {
        libraryPeerRelayId,
        registryId,
      },
      item: projectLibraryItemForRead(persisted.item),
      links: persisted.links,
    }, { requestId, status: persisted.status });
  });

  app.post('/api/platform/library/conversation-artifacts', express.json({ limit: '64kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before saving a conversation capture.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before saving a conversation capture.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to save a conversation capture.', { requestId });
    }
    const existingArtifact = getConversationArtifactByIdempotency({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey,
    });
    if (existingArtifact) {
      const existingItem = listLibraryItems({ houseId: context.houseId, teamId: context.activeTeamId })
        .find((entry) => String(entry?.sourceKind || '') === 'conversation_artifact' && String(entry?.sourceRef || '') === existingArtifact.conversationArtifactId) || null;
      return sendPortalApiSuccess(res, {
        artifact: existingArtifact,
        item: existingItem ? projectLibraryItemForRead(existingItem) : null,
        links: existingItem ? listLibraryLinks({ libraryItemId: existingItem.libraryItemId }) : [],
      }, { requestId, status: 200 });
    }
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const messages = Array.isArray(req.body?.messages)
      ? req.body.messages.filter((entry) => entry && typeof entry === 'object')
      : [];
    const selectedMessageIds = normalizeLibraryItemIds(req.body?.messageIds || messages.map((entry) => entry.messageId));
    const selectedMessages = selectedMessageIds.map((messageId) => {
      return messages.find((entry) => String(entry?.messageId || '').trim() === messageId) || null;
    }).filter(Boolean).map((entry) => ({
      messageId: String(entry?.messageId || '').trim(),
      role: String(entry?.role || 'note').trim() || 'note',
      text: String(entry?.text || '').trim(),
    })).filter((entry) => entry.messageId && entry.text);
    if (!title || !selectedMessages.length) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'title and at least one selected message are required.', { requestId });
    }
    const conversationArtifactId = `convart_${randomHex(12)}`;
    const transcriptText = selectedMessages.map((entry) => `${entry.role}: ${entry.text}`).join('\n');
    const artifact = createConversationArtifact({
      conversationArtifactId,
      houseId: context.houseId,
      teamId: context.activeTeamId,
      title,
      transcriptText,
      messageIds: selectedMessages.map((entry) => entry.messageId),
      messages: selectedMessages,
      sourceScopeSetId: typeof session.activeScopeSetId === 'string' && session.activeScopeSetId.trim()
        ? session.activeScopeSetId.trim()
        : '',
      createdBy: 'human',
      metadata: {
        createdFrom: 'portal.house.library.capture',
      },
      idempotencyKey,
      nowIso: nowIso(),
    });
    const persisted = persistLibraryItemRecord({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey: `${idempotencyKey}_library_item`,
      itemType: 'conversation_note',
      title,
      summary: buildLibrarySummary(transcriptText, 'Conversation capture'),
      contentText: transcriptText,
      contentRef: artifact.conversationArtifactId,
      sourceKind: 'conversation_artifact',
      sourceRef: artifact.conversationArtifactId,
      visibility: 'house_private',
      metadata: {
        createdFrom: 'portal.house.library.capture',
        conversationArtifactId: artifact.conversationArtifactId,
      },
      links: [{
        linkKind: 'derived_from_conversation',
        sourceKind: 'conversation_artifact',
        sourceRef: artifact.conversationArtifactId,
        metadata: {
          messageIds: selectedMessages.map((entry) => entry.messageId),
        },
      }],
    });
    return sendPortalApiSuccess(res, {
      artifact,
      item: persisted.item,
      links: persisted.links,
      revision: persisted.revision || null,
    }, { requestId, status: 201 });
  });

  app.get('/api/platform/library/shelves', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    return sendPortalApiSuccess(res, {
      shelves: listLibraryShelves({
        houseId: context.houseId,
        teamId: context.activeTeamId,
      }).map((shelf) => ({
        ...shelf,
        orderedItemIds: listLibraryShelfItems(shelf.libraryShelfId).map((entry) => entry.libraryItemId),
      })),
    }, { requestId });
  });

  app.post('/api/platform/library/shelves', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    if (!context.houseId) {
      return sendPortalApiError(res, 409, 'HOUSE_REQUIRED', 'Attach a house before creating a shelf.', { requestId });
    }
    if (!context.activeTeamId) {
      return sendPortalApiError(res, 409, 'TEAM_REQUIRED', 'Select an active team before creating a shelf.', { requestId });
    }
    const idempotencyKey = normalizePortalIdempotencyKey(req);
    if (!idempotencyKey) {
      return sendPortalApiError(res, 400, 'LIBRARY_IDEMPOTENCY_REQUIRED', 'Idempotency-Key is required to create a shelf.', { requestId });
    }
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const itemIds = normalizeLibraryItemIds(req.body?.itemIds);
    if (!title) {
      return sendPortalApiError(res, 400, 'INVALID_ARGUMENT', 'title is required.', { requestId });
    }
    let shelf = getLibraryShelfByIdempotency({
      houseId: context.houseId,
      teamId: context.activeTeamId,
      idempotencyKey,
    });
    if (!shelf) {
      shelf = createLibraryShelf({
        libraryShelfId: `shelf_${randomHex(12)}`,
        houseId: context.houseId,
        teamId: context.activeTeamId,
        title,
        description,
        createdBy: 'human',
        metadata: {
          createdFrom: 'portal.house.library',
        },
        idempotencyKey,
        nowIso: nowIso(),
      });
    }
    const existingItems = new Set(listLibraryShelfItems(shelf.libraryShelfId).map((entry) => entry.libraryItemId));
    itemIds.forEach((libraryItemId, index) => {
      addLibraryShelfItem({
        libraryShelfItemId: `shelfitem_${randomHex(12)}`,
        libraryShelfId: shelf.libraryShelfId,
        libraryItemId,
        orderIndex: existingItems.size + index,
        metadata: {
          source: 'portal.house.library',
        },
        nowIso: nowIso(),
      });
    });
    return sendPortalApiSuccess(res, {
      shelf: {
        ...getLibraryShelfById(shelf.libraryShelfId),
        orderedItemIds: listLibraryShelfItems(shelf.libraryShelfId).map((entry) => entry.libraryItemId),
      },
    }, { requestId, status: 201 });
  });

  app.post('/api/platform/library/shelves/:libraryShelfId/items', express.json({ limit: '32kb' }), (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const libraryShelfId = typeof req.params?.libraryShelfId === 'string' ? req.params.libraryShelfId.trim() : '';
    const shelf = getLibraryShelfById(libraryShelfId);
    if (!shelf || shelf.houseId !== context.houseId || shelf.teamId !== context.activeTeamId) {
      return sendPortalApiError(res, 404, 'LIBRARY_SHELF_NOT_FOUND', 'The requested shelf could not be found for this House team.', { requestId });
    }
    const itemIds = normalizeLibraryItemIds(req.body?.itemIds);
    if (!itemIds.length) {
      return sendPortalApiError(res, 400, 'LIBRARY_ITEM_REQUIRED', 'At least one libraryItemId is required.', { requestId });
    }
    const existingRows = listLibraryShelfItems(libraryShelfId);
    const existingItemIds = new Set(existingRows.map((entry) => entry.libraryItemId));
    itemIds.forEach((libraryItemId, index) => {
      addLibraryShelfItem({
        libraryShelfItemId: `shelfitem_${randomHex(12)}`,
        libraryShelfId,
        libraryItemId,
        orderIndex: existingRows.length + index,
        metadata: {
          source: 'portal.house.library',
        },
        nowIso: nowIso(),
      });
      existingItemIds.add(libraryItemId);
    });
    return sendPortalApiSuccess(res, {
      shelf: {
        ...getLibraryShelfById(libraryShelfId),
        orderedItemIds: listLibraryShelfItems(libraryShelfId).map((entry) => entry.libraryItemId),
      },
    }, { requestId });
  });

  app.delete('/api/platform/library/shelves/:libraryShelfId/items/:libraryItemId', (req, res) => {
    const requestId = buildPortalRequestId();
    const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
    if (!session) {
      return sendPortalApiError(res, 401, 'SESSION_REQUIRED', 'A live Portal session is required for this route.', { requestId });
    }
    const context = resolveSessionPlatformContext(session);
    const libraryShelfId = typeof req.params?.libraryShelfId === 'string' ? req.params.libraryShelfId.trim() : '';
    const libraryItemId = typeof req.params?.libraryItemId === 'string' ? req.params.libraryItemId.trim() : '';
    const shelf = getLibraryShelfById(libraryShelfId);
    if (!shelf || shelf.houseId !== context.houseId || shelf.teamId !== context.activeTeamId) {
      return sendPortalApiError(res, 404, 'LIBRARY_SHELF_NOT_FOUND', 'The requested shelf could not be found for this House team.', { requestId });
    }
    removeLibraryShelfItem({ libraryShelfId, libraryItemId });
    return sendPortalApiSuccess(res, {
      shelf: {
        ...getLibraryShelfById(libraryShelfId),
        orderedItemIds: listLibraryShelfItems(libraryShelfId).map((entry) => entry.libraryItemId),
      },
    }, { requestId });
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
      selectedItemIds: payload.selectedItemIds,
      orderedItemIds: payload.selectedItemIds,
      selectedItems: payload.selectedItems,
      scopeSets: payload.scopeSets,
      shelves: payload.shelves,
      items: payload.items,
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
    const scopeKind = typeof req.body?.scopeKind === 'string' ? req.body.scopeKind.trim() : 'reading_table';
    const sourceShelfId = typeof req.body?.sourceShelfId === 'string' ? req.body.sourceShelfId.trim() : '';
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
          scopeKind: scopeKind || 'reading_table',
          sourceShelfId: sourceShelfId || null,
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
      selectedItemIds: payload.selectedItemIds,
      orderedItemIds: payload.selectedItemIds,
      selectedItems: payload.selectedItems,
      scopeSets: payload.scopeSets,
      shelves: payload.shelves,
      items: payload.items,
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
