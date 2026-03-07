const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function waitForLiteTestApi(page) {
  await page.waitForFunction(() => {
    return !!(window.__openclawLiteTest && typeof window.__openclawLiteTest === 'object');
  });
}

function sortSkillImportPaths(paths = []) {
  return [...(Array.isArray(paths) ? paths : [])].sort((a, b) => {
    const left = String(a || '');
    const right = String(b || '');
    const leftFolded = left.toLowerCase();
    const rightFolded = right.toLowerCase();
    if (leftFolded < rightFolded) return -1;
    if (leftFolded > rightFolded) return 1;
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  });
}

function decodePromptXmlEntities(value = '') {
  return String(value || '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}

function parseAvailableSkills(skillsPrompt = '') {
  const text = String(skillsPrompt || '');
  const entries = [];
  const blockRe = /<skill>\s*<name>([\s\S]*?)<\/name>\s*<description>([\s\S]*?)<\/description>\s*<location>([\s\S]*?)<\/location>\s*<\/skill>/g;
  for (const match of text.matchAll(blockRe)) {
    entries.push({
      name: decodePromptXmlEntities(match?.[1] || '').trim(),
      description: decodePromptXmlEntities(match?.[2] || '').trim(),
      location: decodePromptXmlEntities(match?.[3] || '').trim(),
    });
  }
  return entries;
}

test('gateway default exposes skill runtime methods for page integrations', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const mod = await import('/openclaw-lite/gateway.js');
    let gateway = mod?.default || mod;
    if (gateway && typeof gateway.then === 'function') gateway = await gateway;
    const hasMethods = {
      visitExperience: !!(gateway && typeof gateway.visitExperience === 'function'),
      experienceRun: !!(gateway && typeof gateway.experienceRun === 'function'),
      skillState: !!(gateway && typeof gateway.skillState === 'function'),
      systemPromptPreview: !!(gateway && typeof gateway.systemPromptPreview === 'function')
    };
    let visitOk = false;
    if (hasMethods.visitExperience) {
      const visit = await gateway.visitExperience({ url: '/skill.md' });
      visitOk = visit?.ok === true;
    }
    return { hasMethods, visitOk };
  });

  expect(summary?.hasMethods?.visitExperience).toBe(true);
  expect(summary?.hasMethods?.experienceRun).toBe(true);
  expect(summary?.hasMethods?.skillState).toBe(true);
  expect(summary?.hasMethods?.systemPromptPreview).toBe(true);
  expect(summary?.visitOk).toBe(true);
});

test('visit imports portal skill and writes compatibility mirrors', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const visit = await page.evaluate(async () => {
    return await window.__openclawLiteTest.visitExperience({ url: '/skill.md' });
  });

  expect(visit?.ok).toBe(true);
  expect(Array.isArray(visit?.data?.importedPaths)).toBeTruthy();
  expect(visit.data.importedPaths).toContain('workspace/SKILL.md');
  expect(visit.data.importedPaths).toContain('workspace/skill.md');
  expect(visit?.data?.siteRoot || '').toMatch(/^workspace\/skills\/[a-z0-9._-]+\/$/);
  expect(visit?.data?.activeSkillPath || '').toMatch(/^workspace\/skills\/[a-z0-9._-]+\/SKILL\.md$/);

  const files = await page.evaluate(async () => {
    const upper = await window.__openclawLiteTest.workspaceReadFile({ path: 'workspace/SKILL.md' });
    const lower = await window.__openclawLiteTest.workspaceReadFile({ path: 'workspace/skill.md' });
    const siteKey = String(window.location.host || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');
    const siteUpper = await window.__openclawLiteTest.workspaceReadFile({ path: `workspace/skills/${siteKey}/SKILL.md` });
    const siteLower = await window.__openclawLiteTest.workspaceReadFile({ path: `workspace/skills/${siteKey}/skill.md` });
    const dryRun = await window.__openclawLiteTest.experienceRun({ dryRun: true });
    return { upper, lower, siteUpper, siteLower, dryRun };
  });

  expect(files.upper?.ok).toBe(true);
  expect(files.lower?.ok).toBe(true);
  expect(files.siteUpper?.ok).toBe(true);
  expect(files.siteLower?.ok).toBe(true);
  expect(files.dryRun?.ok).toBe(true);
  expect(files.dryRun?.data?.mode).toBe('dry-run');
  expect(files.dryRun?.data?.resolvedPaths?.skill || '').toMatch(/^workspace\/skills\/[a-z0-9._-]+\/SKILL\.md$/);
  expect(files.dryRun?.data?.siteRoot || '').toMatch(/^workspace\/skills\/[a-z0-9._-]+\/$/);
  expect(Array.isArray(files.dryRun?.data?.missingRequiredPaths)).toBeTruthy();
  expect(files.dryRun?.data?.missingRequiredPaths?.length || 0).toBe(0);
  expect(Array.isArray(files.dryRun?.data?.missingOptionalPaths)).toBeTruthy();
  expect(files.upper.data?.content || '').toContain('agent-town-playbook');
  expect(files.lower.data?.content || '').toBe(files.upper.data?.content || '');
  expect(files.siteUpper.data?.content || '').toBe(files.upper.data?.content || '');
  expect(files.siteLower.data?.content || '').toBe(files.upper.data?.content || '');
});

test('system prompt exposes available_skills without inline SKILL context injection', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const preview = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.visitExperience({ url: '/skill.md' });
    return await api.systemPromptPreview();
  });

  expect(preview?.ok).toBe(true);
  const systemPrompt = String(preview?.data?.systemPrompt || '');
  const skillsPrompt = String(preview?.data?.skillsPrompt || '');
  const contextFilePaths = Array.isArray(preview?.data?.contextFilePaths)
    ? preview.data.contextFilePaths.map((path) => String(path || '').toLowerCase())
    : [];

  expect(systemPrompt).toContain('## Skills (mandatory)');
  expect(systemPrompt).toContain('<available_skills>');
  expect(skillsPrompt).toContain('<available_skills>');
  expect(skillsPrompt).toContain('<location>');
  expect(systemPrompt).not.toContain('## SKILL.md');
  expect(systemPrompt).not.toContain('## skill.md');
  expect(contextFilePaths).not.toContain('skill.md');
});

test('chat prompt carries runtime team context and active skill guidance after skill import', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.visitExperience({ url: '/skill.md' });
    await api.clearTranscript({ rotateSession: false, keepBootMessage: false });

    const stateResp = await fetch('/api/state', { credentials: 'include' });
    const appState = await stateResp.json().catch(() => ({}));
    const teamCode = String(appState?.teamCode || '');
    const experienceStep = String(appState?.experience?.step || '');

    const skillState = await api.skillState();
    const activeSkillPath = String(skillState?.data?.activeSkillPath || '');

    const mod = await import('/openclaw-lite/gateway.js');
    let gateway = mod?.default || mod;
    if (gateway && typeof gateway.then === 'function') gateway = await gateway;
    await gateway.send({ type: 'chat', text: 'Can you check which sigil I picked?' });

    let dumpRaw = '[]';
    let dump = [];
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline) {
      dumpRaw = await api.getTranscriptDump();
      try {
        dump = JSON.parse(String(dumpRaw || '[]'));
      } catch {
        dump = [];
      }
      const hasUserPrompt = dump.some((msg) => msg && msg.role === 'user');
      if (hasUserPrompt) break;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    const lastUserMessage = [...dump].reverse().find((msg) => msg && msg.role === 'user') || null;
    let lastUserText = '';
    if (typeof lastUserMessage?.content === 'string') {
      lastUserText = lastUserMessage.content;
    } else if (lastUserMessage?.content && typeof lastUserMessage.content === 'object' && !Array.isArray(lastUserMessage.content)) {
      if (typeof lastUserMessage.content.text === 'string') {
        lastUserText = lastUserMessage.content.text;
      } else if (typeof lastUserMessage.content.value === 'string') {
        lastUserText = lastUserMessage.content.value;
      } else if (typeof lastUserMessage.content.content === 'string') {
        lastUserText = lastUserMessage.content.content;
      }
    } else if (Array.isArray(lastUserMessage?.content)) {
      lastUserText = lastUserMessage.content.map((entry) => {
        if (!entry) return '';
        if (typeof entry === 'string') return entry;
        if (typeof entry?.text === 'string') return entry.text;
        if (typeof entry?.content === 'string') return entry.content;
        if (typeof entry?.value === 'string') return entry.value;
        return '';
      }).filter(Boolean).join('\n');
    }

    return {
      teamCode,
      activeSkillPath,
      experienceStep,
      lastUserText
    };
  });

  expect(summary?.teamCode || '').toMatch(/^TEAM-/);
  expect(summary?.activeSkillPath || '').toMatch(/^workspace\/skills\/[a-z0-9._-]+\/SKILL\.md$/);
  expect(summary?.lastUserText || '').toContain('Runtime session context (authoritative):');
  expect(summary?.lastUserText || '').toContain(`- teamCode: ${summary.teamCode}`);
  expect(summary?.lastUserText || '').toContain('Runtime experience state (authoritative):');
  expect(summary?.lastUserText || '').toContain(`- experience.step: ${summary.experienceStep}`);
  expect(summary?.lastUserText || '').toContain('Active imported skill package (authoritative for this experience):');
  expect(summary?.lastUserText || '').toContain(`- activeSkillPath: ${summary.activeSkillPath}`);
  expect(summary?.lastUserText || '').toContain('This is an active co-op session (`agent_town_coop_v1`): follow the co-op playbook at activeSkillPath (skill.md).');
  expect(summary?.lastUserText || '').toContain('Only use `skill_agent_solo.md` when the user explicitly asks for solo mode and co-op runtime signals are absent.');
  expect(summary?.lastUserText || '').toContain('Do not ask the human for teamCode/houseId/skill-path');
});

test('multi-skill prompt preview prefers most-specific imported skill and keeps single upfront read constraint', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    const visit = await api.visitExperience({ url: '/fixtures/multi-skill-pack/skill.md' });
    const preview = await api.systemPromptPreview();
    const siteKey = String(window.location.host || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');
    const base = `workspace/skills/${siteKey}/fixtures/multi-skill-pack`;
    return {
      visit,
      preview,
      expectedLocations: {
        ceremony: `${base}/skills/co-op/ceremony/skill.md`,
        coop: `${base}/skills/co-op/skill.md`,
        router: `${base}/skill.md`,
      },
    };
  });

  expect(summary?.visit?.ok).toBe(true);
  expect(summary?.preview?.ok).toBe(true);

  const systemPrompt = String(summary?.preview?.data?.systemPrompt || '');
  const skillsPrompt = String(summary?.preview?.data?.skillsPrompt || '');
  const skills = parseAvailableSkills(skillsPrompt);
  const locations = skills.map((entry) => String(entry?.location || ''));

  const ceremonyIdx = locations.indexOf(summary?.expectedLocations?.ceremony || '');
  const coopIdx = locations.indexOf(summary?.expectedLocations?.coop || '');
  const routerIdx = locations.indexOf(summary?.expectedLocations?.router || '');
  expect(ceremonyIdx).toBeGreaterThanOrEqual(0);
  expect(coopIdx).toBeGreaterThanOrEqual(0);
  expect(routerIdx).toBeGreaterThanOrEqual(0);
  expect(ceremonyIdx).toBeLessThan(coopIdx);
  expect(coopIdx).toBeLessThan(routerIdx);

  expect(systemPrompt).toContain('Before replying: scan <available_skills> <description> entries.');
  expect(systemPrompt).toContain('- If multiple could apply: choose the most specific one, then read/follow it.');
  expect(systemPrompt).toContain('Constraints: never read more than one skill up front; only read after selecting.');
});

test('repeat multi-skill prompt preview keeps deterministic available_skills ordering', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.visitExperience({ url: '/fixtures/multi-skill-pack/skill.md' });
    const firstPreview = await api.systemPromptPreview();
    await api.visitExperience({ url: '/fixtures/multi-skill-pack/skill.md' });
    const secondPreview = await api.systemPromptPreview();
    return {
      firstSkillsPrompt: String(firstPreview?.data?.skillsPrompt || ''),
      secondSkillsPrompt: String(secondPreview?.data?.skillsPrompt || ''),
    };
  });

  const first = parseAvailableSkills(summary?.firstSkillsPrompt || '').map((entry) => entry.location);
  const second = parseAvailableSkills(summary?.secondSkillsPrompt || '').map((entry) => entry.location);
  expect(first.length).toBeGreaterThan(0);
  expect(second).toEqual(first);
});

test('visit imports same-origin companion files for a skill package', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    const visit = await api.visitExperience({ url: '/fixtures/skill-pack/skill.md' });
    const siteKey = String(window.location.host || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');
    const base = `workspace/skills/${siteKey}/fixtures/skill-pack`;
    const expectedSitePaths = {
      skill: `${base}/skill.md`,
      heartbeat: `${base}/heartbeat.md`,
      rules: `${base}/rules.md`,
      messaging: `${base}/messaging.md`,
      skillJson: `${base}/skill.json`
    };
    const files = {
      skill: await api.workspaceReadFile({ path: expectedSitePaths.skill }),
      heartbeat: await api.workspaceReadFile({ path: expectedSitePaths.heartbeat }),
      rules: await api.workspaceReadFile({ path: expectedSitePaths.rules }),
      messaging: await api.workspaceReadFile({ path: expectedSitePaths.messaging }),
      skillJson: await api.workspaceReadFile({ path: expectedSitePaths.skillJson }),
      heartbeatCompat: await api.workspaceReadFile({ path: 'workspace/HEARTBEAT.md' })
    };
    const skillState = await api.skillState();
    return { visit, expectedSitePaths, files, skillState };
  });

  expect(summary?.visit?.ok).toBe(true);
  expect(Array.isArray(summary?.visit?.data?.failedUrls)).toBeTruthy();
  expect(summary?.visit?.data?.failedUrls || []).toEqual([]);
  expect(summary?.visit?.data?.importedPaths || []).toContain(summary.expectedSitePaths.skill);
  expect(summary?.visit?.data?.importedPaths || []).toContain(summary.expectedSitePaths.heartbeat);
  expect(summary?.visit?.data?.importedPaths || []).toContain(summary.expectedSitePaths.rules);
  expect(summary?.visit?.data?.importedPaths || []).toContain(summary.expectedSitePaths.messaging);
  expect(summary?.visit?.data?.importedPaths || []).toContain(summary.expectedSitePaths.skillJson);

  expect(summary?.files?.skill?.ok).toBe(true);
  expect(summary?.files?.heartbeat?.ok).toBe(true);
  expect(summary?.files?.rules?.ok).toBe(true);
  expect(summary?.files?.messaging?.ok).toBe(true);
  expect(summary?.files?.skillJson?.ok).toBe(true);
  expect(summary?.files?.heartbeatCompat?.ok).toBe(true);

  expect(summary?.files?.skill?.data?.content || '').toContain('Fixture Skill Pack');
  expect(summary?.files?.heartbeat?.data?.content || '').toContain('Pulse every turn');
  expect(summary?.files?.rules?.data?.content || '').toContain('Prefer deterministic routes');
  expect(summary?.files?.messaging?.data?.content || '').toContain('focused follow-up question');
  expect(summary?.files?.skillJson?.data?.content || '').toContain('"kind": "test-fixture"');
  expect(summary?.files?.heartbeatCompat?.data?.content || '').toContain('Pulse every turn');

  expect(summary?.skillState?.ok).toBe(true);
  expect(summary?.skillState?.data?.status).toBe('ready');
  expect(summary?.skillState?.data?.sourceUrl || '').toContain('/fixtures/skill-pack/skill.md');
  expect(Number(summary?.skillState?.data?.lastImportedAtMs || 0)).toBeGreaterThan(0);
});

test('repeat visit keeps deterministic imported metadata ordering', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    const first = await api.visitExperience({ url: '/fixtures/skill-pack/skill.md' });
    const second = await api.visitExperience({ url: '/fixtures/skill-pack/skill.md' });
    const skillState = await api.skillState();
    const siteKey = String(window.location.host || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');
    const expectedSkillPath = `workspace/skills/${siteKey}/fixtures/skill-pack/skill.md`;
    return { first, second, skillState, expectedSkillPath };
  });

  expect(summary?.first?.ok).toBe(true);
  expect(summary?.second?.ok).toBe(true);
  expect(summary?.skillState?.ok).toBe(true);

  const firstPaths = Array.isArray(summary?.first?.data?.importedPaths) ? summary.first.data.importedPaths : [];
  const secondPaths = Array.isArray(summary?.second?.data?.importedPaths) ? summary.second.data.importedPaths : [];
  const sortedSecondPaths = sortSkillImportPaths(secondPaths);
  expect(secondPaths).toEqual(firstPaths);
  expect(secondPaths).toEqual(sortedSecondPaths);

  const stateFiles = Array.isArray(summary?.skillState?.data?.importedFiles) ? summary.skillState.data.importedFiles : [];
  const secondFiles = Array.isArray(summary?.second?.data?.importedFiles) ? summary.second.data.importedFiles : [];
  expect(stateFiles.length).toBeGreaterThan(0);
  expect(secondFiles.map((entry) => String(entry?.path || ''))).toEqual(
    stateFiles.map((entry) => String(entry?.path || ''))
  );

  const statePaths = stateFiles.map((entry) => String(entry?.path || ''));
  const sortedStatePaths = sortSkillImportPaths(statePaths);
  expect(statePaths).toEqual(sortedStatePaths);
  expect(stateFiles.every((entry) => Object.prototype.hasOwnProperty.call(entry || {}, 'etag'))).toBe(true);
  expect(stateFiles.every((entry) => Object.prototype.hasOwnProperty.call(entry || {}, 'lastModified'))).toBe(true);
  expect(stateFiles.every((entry) => typeof entry?.sha256B64 === 'string' && entry.sha256B64.length > 0)).toBe(true);

  const skillEntry = stateFiles.find((entry) => String(entry?.path || '') === String(summary?.expectedSkillPath || ''));
  expect(skillEntry).toBeTruthy();
  expect(String(skillEntry?.finalUrl || '')).toContain('/fixtures/skill-pack/skill.md');
  expect(String(skillEntry?.sha256B64 || '')).toMatch(/^[A-Za-z0-9+/=]+$/);
});

test('visit imports Moltbook-shaped package files and preserves domain-like path conventions', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    const fixtureUrl = '/fixtures/moltbook.com/playbooks/agent-town/skill.md';
    const visit = await api.visitExperience({ url: fixtureUrl });
    const preview = await api.systemPromptPreview();
    const skillState = await api.skillState();
    const siteKey = String(window.location.host || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');
    const base = `workspace/skills/${siteKey}/fixtures/moltbook.com/playbooks/agent-town`;
    const files = {
      skill: await api.workspaceReadFile({ path: `${base}/skill.md` }),
      heartbeat: await api.workspaceReadFile({ path: `${base}/heartbeat.md` }),
      messaging: await api.workspaceReadFile({ path: `${base}/messaging.md` }),
      rules: await api.workspaceReadFile({ path: `${base}/rules.md` }),
      skillJson: await api.workspaceReadFile({ path: `${base}/skill.json` }),
    };
    return { visit, preview, skillState, files, base, fixtureUrl };
  });

  expect(summary?.visit?.ok).toBe(true);
  expect(summary?.preview?.ok).toBe(true);
  expect(summary?.skillState?.ok).toBe(true);
  expect(summary?.visit?.data?.failedUrls || []).toEqual([]);
  expect(summary?.visit?.data?.importedPaths || []).toContain(`${summary.base}/skill.md`);
  expect(summary?.visit?.data?.importedPaths || []).toContain(`${summary.base}/heartbeat.md`);
  expect(summary?.visit?.data?.importedPaths || []).toContain(`${summary.base}/messaging.md`);
  expect(summary?.visit?.data?.importedPaths || []).toContain(`${summary.base}/rules.md`);
  expect(summary?.visit?.data?.importedPaths || []).toContain(`${summary.base}/skill.json`);

  expect(summary?.files?.skill?.ok).toBe(true);
  expect(summary?.files?.heartbeat?.ok).toBe(true);
  expect(summary?.files?.messaging?.ok).toBe(true);
  expect(summary?.files?.rules?.ok).toBe(true);
  expect(summary?.files?.skillJson?.ok).toBe(true);
  expect(summary?.files?.skill?.data?.content || '').toContain('Required actions');
  expect(summary?.files?.skill?.data?.content || '').toContain('send_thread_reply');
  expect(summary?.files?.skillJson?.data?.content || '').toContain('"requiredActions"');
  expect(summary?.files?.skillJson?.data?.content || '').toContain('"sync_thread_state"');

  const previewLocations = parseAvailableSkills(String(summary?.preview?.data?.skillsPrompt || ''))
    .map((entry) => String(entry?.location || ''));
  expect(previewLocations).toContain(`${summary.base}/skill.md`);

  expect(summary?.skillState?.data?.sourceUrl || '').toContain(summary?.fixtureUrl || '');
  expect(summary?.skillState?.data?.status).toBe('ready');
});

test('experience dry-run resolves uppercase workspace files', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const run = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.workspaceWriteFile({ path: 'workspace/SKILL.md', content: '# Skill\n\nok\n' });
    await api.workspaceWriteFile({ path: 'workspace/HEARTBEAT.md', content: '# Heartbeat\n\nok\n' });
    await api.workspaceWriteFile({ path: 'workspace/GOALS.md', content: '# Goals\n\nok\n' });
    await api.workspaceWriteFile({ path: 'workspace/TOOLS.md', content: '# Tools\n\nok\n' });
    await api.workspaceWriteFile({ path: 'workspace/PENALTY.md', content: '# Penalty\n\nok\n' });
    await api.workspaceDelete({ path: 'workspace/skill.md' });
    return await api.experienceRun({ dryRun: true });
  });

  expect(run?.ok).toBe(true);
  expect(run?.data?.mode).toBe('dry-run');
  expect(run?.data?.resolvedPaths?.skill).toBe('workspace/SKILL.md');
  expect(run?.data?.resolvedPaths?.heartbeat).toBe('workspace/HEARTBEAT.md');
  expect(run?.data?.resolvedPaths?.goals).toBe('workspace/GOALS.md');
  expect(run?.data?.resolvedPaths?.tools).toBe('workspace/TOOLS.md');
  expect(run?.data?.resolvedPaths?.penalty).toBe('workspace/PENALTY.md');
});

test('experience dry-run succeeds with SKILL-only workspace', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const run = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.workspaceWriteFile({ path: 'workspace/SKILL.md', content: '# Skill\n\nonly\n' });
    await api.workspaceDelete({ path: 'workspace/skill.md' });
    await api.workspaceDelete({ path: 'workspace/HEARTBEAT.md' });
    await api.workspaceDelete({ path: 'workspace/heartbeat.md' });
    await api.workspaceDelete({ path: 'workspace/GOALS.md' });
    await api.workspaceDelete({ path: 'workspace/goals.md' });
    await api.workspaceDelete({ path: 'workspace/TOOLS.md' });
    await api.workspaceDelete({ path: 'workspace/tools.md' });
    await api.workspaceDelete({ path: 'workspace/PENALTY.md' });
    await api.workspaceDelete({ path: 'workspace/penalty.md' });
    return await api.experienceRun({ dryRun: true });
  });

  expect(run?.ok).toBe(true);
  expect(run?.data?.mode).toBe('dry-run');
  expect(run?.data?.resolvedPaths?.skill).toBe('workspace/SKILL.md');
  expect(run?.data?.resolvedPaths?.heartbeat).toBeUndefined();
  expect(run?.data?.resolvedPaths?.goals).toBeUndefined();
  expect(run?.data?.resolvedPaths?.penalty).toBeUndefined();
  expect(Array.isArray(run?.data?.fileKeys)).toBeTruthy();
  expect(run?.data?.fileKeys || []).toContain('skill');
  expect(run?.data?.missingRequiredPaths || []).toEqual([]);
  expect(run?.data?.missingOptionalPaths || []).toContain('workspace/HEARTBEAT.md');
  expect(run?.data?.missingOptionalPaths || []).toContain('workspace/GOALS.md');
  expect(run?.data?.missingOptionalPaths || []).toContain('workspace/PENALTY.md');
});

test('experience run defaults to local agent-turn path (no test ws dependency)', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const run = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.workspaceWriteFile({ path: 'workspace/SKILL.md', content: '# Skill\n\nRun the portal loop.\n' });
    return await api.experienceRun({ prompt: 'Run the experience once.' });
  });

  expect(run?.ok).toBe(false);
  expect(run?.error?.code).toBe('LLM_NOT_CONFIGURED');
  expect(run?.error?.message || '').toContain('LLM not configured');
  expect(run?.error?.details?.mode).toBe('agent-turn');
  expect((run?.error?.details?.runtimeContext?.teamCode || '')).toMatch(/^TEAM-/);
  expect(run?.error?.details?.resolvedPaths?.skill).toBe('workspace/SKILL.md');
});

test('experience run can skip transcript persistence for polling turns', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.clearTranscript({ rotateSession: false, keepBootMessage: false });
    const beforeRaw = await api.getTranscriptDump();
    let before = [];
    try {
      before = JSON.parse(beforeRaw || '[]');
    } catch {
      before = [];
    }
    await api.workspaceWriteFile({ path: 'workspace/SKILL.md', content: '# Skill\n\nPoll once.\n' });
    const run = await api.experienceRun({
      prompt: 'Run the experience once.',
      recordToTranscript: false,
      emitChat: false
    });
    const dumpRaw = await api.getTranscriptDump();
    let dump = [];
    try {
      dump = JSON.parse(dumpRaw || '[]');
    } catch {
      dump = [];
    }
    const hasPollPrompt = (Array.isArray(dump) ? dump : []).some((msg) => {
      if (!msg || msg.role !== 'user') return false;
      return JSON.stringify(msg?.content || '').includes('Run the experience once.');
    });
    const hasLlmConfigErrorReply = (Array.isArray(dump) ? dump : []).some((msg) => {
      if (!msg || msg.role !== 'assistant') return false;
      return JSON.stringify(msg?.content || '').includes('LLM not configured');
    });
    return {
      run,
      transcriptLengthBefore: Array.isArray(before) ? before.length : -1,
      transcriptLengthAfter: Array.isArray(dump) ? dump.length : -1,
      hasPollPrompt,
      hasLlmConfigErrorReply
    };
  });

  expect(summary?.run?.ok).toBe(false);
  expect(summary?.run?.error?.code).toBe('LLM_NOT_CONFIGURED');
  expect(summary?.hasPollPrompt).toBe(false);
  expect(summary?.hasLlmConfigErrorReply).toBe(false);
});

test('experience run supports ws transport via local test websocket endpoint', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const run = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.workspaceWriteFile({ path: 'workspace/SKILL.md', content: '# Skill\n\nws mode\n' });
    return await api.experienceRun({ transport: 'ws' });
  });

  expect(run?.ok).toBe(true);
  expect(run?.data?.mode).toBe('ws');
  expect(run?.data?.ack?.ok).toBe(true);
  expect(run?.data?.ack?.receivedType).toBe('experience.run');
  expect(run?.data?.ack?.mode).toBe('ws-test');
  expect(run?.data?.ack?.skillPresent).toBe(true);
  expect(Array.isArray(run?.data?.ack?.fileKeys)).toBeTruthy();
  expect(run?.data?.ack?.fileKeys || []).toContain('skill');
  expect(run?.data?.resolvedPaths?.skill).toBe('workspace/SKILL.md');
});

test('web_fetch blocks proxy access for cross-origin loopback alias', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    const current = new URL(window.location.origin);
    const altHost = current.hostname === '127.0.0.1' ? '[::1]' : '127.0.0.1';
    const aliasUrl = `${current.protocol}//${altHost}${current.port ? `:${current.port}` : ''}/skill.md`;
    const fetched = await api.webFetch({ url: aliasUrl, expectedMime: 'text/markdown' });
    const payload = fetched?.data && typeof fetched.data === 'object' ? fetched.data : fetched;
    const errorCode = String(
      fetched?.error?.code
      || payload?.error?.code
      || payload?.code
      || ''
    );
    return { aliasUrl, fetched, payload, errorCode };
  });

  expect(summary?.aliasUrl || '').toContain('/skill.md');
  expect(summary?.fetched?.ok).toBe(false);
  expect(summary?.errorCode).toBe('PROXY_TARGET_BLOCKED');
});

test('permission manifest denies cross-origin web_fetch when network.fetch is missing', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    const applied = await api.setPermissionPolicy({
      manifest: {
        type: 'https://agent.town/schemas/permission-manifest-v1',
        version: '1.0.0',
        permissions: [],
        risk: {
          level: 'high',
          rationale: 'Cross-origin access must be explicitly declared.'
        }
      }
    });
    const policy = await api.getPermissionPolicy();
    const fetched = await api.webFetch({ url: 'https://example.com/perm-check', expectedMime: 'text/plain' });
    return {
      applied,
      policy,
      fetched,
      errorCode: String(fetched?.error?.code || ''),
      details: fetched?.error?.details || null
    };
  });

  expect(summary?.applied?.ok).toBe(true);
  expect(summary?.policy?.ok).toBe(true);
  expect(summary?.policy?.data?.mode).toBe('manifest-enforced');
  expect(summary?.policy?.data?.risk?.level).toBe('high');
  expect(summary?.fetched?.ok).toBe(false);
  expect(summary?.errorCode).toBe('PERMISSION_DENIED');
  expect(String(summary?.details?.reason || '')).toBe('missing_permission');
  expect(String(summary?.details?.missing_permission || '')).toBe('network.fetch');
});

test('visit import resolves ERC-8004 registration permission manifest into active policy', async ({ page }) => {
  await page.route('**/perm-registration.json', async (route) => {
    const requestUrl = new URL(route.request().url());
    const origin = `${requestUrl.protocol}//${requestUrl.host}`;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
        name: 'Policy Test Experience',
        description: 'registration wrapper for skill import',
        image: '',
        services: [{ name: 'web', endpoint: `${origin}/skill.md` }],
        x402Support: false,
        active: true,
        registrations: [],
        supportedTrust: [],
        permissionManifest: {
          type: 'https://agent.town/schemas/permission-manifest-v1',
          version: '1.0.0',
          permissions: [
            {
              id: 'network.fetch',
              constraints: { origins: ['https://example.com'] }
            }
          ],
          risk: {
            level: 'medium',
            rationale: 'Cross-origin fetch is limited to one origin.'
          }
        }
      })
    });
  });

  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    const entryUrl = `${window.location.origin}/perm-registration.json`;
    const visit = await api.visitExperience({ url: entryUrl });
    const policy = await api.getPermissionPolicy();
    return { entryUrl, visit, policy };
  });

  expect(summary?.visit?.ok).toBe(true);
  expect(String(summary?.visit?.data?.sourceUrl || '')).toContain('/skill.md');
  expect(summary?.visit?.data?.registration?.registrationUrl || '').toContain('/perm-registration.json');
  expect(summary?.visit?.data?.registration?.hasPermissionManifest).toBe(true);

  expect(summary?.policy?.ok).toBe(true);
  expect(summary?.policy?.data?.mode).toBe('manifest-enforced');
  expect(summary?.policy?.data?.risk?.level).toBe('medium');
  expect(String(summary?.policy?.data?.risk?.rationale || '')).toContain('Cross-origin fetch');
  const permissionIds = Array.isArray(summary?.policy?.data?.permissions)
    ? summary.policy.data.permissions.map((entry) => String(entry?.id || ''))
    : [];
  expect(permissionIds).toContain('network.fetch');
});

test('permission manifest requires origin approval before allowed cross-origin web_fetch', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });
  await page.route('https://example.com/perm-check*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/plain',
      headers: {
        'access-control-allow-origin': '*'
      },
      body: 'policy-ok'
    });
  });

  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const firstAttempt = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.setPermissionPolicy({
      manifest: {
        type: 'https://agent.town/schemas/permission-manifest-v1',
        version: '1.0.0',
        permissions: [
          {
            id: 'network.fetch',
            constraints: {
              origins: ['https://example.com']
            }
          }
        ],
        risk: {
          level: 'medium',
          rationale: 'Network access is scoped to one origin.'
        }
      }
    });
    const fetched = await api.webFetch({ url: 'https://example.com/perm-check', expectedMime: 'text/plain' });
    return {
      fetched,
      errorCode: String(fetched?.error?.code || ''),
      details: fetched?.error?.details || null
    };
  });

  expect(firstAttempt?.fetched?.ok).toBe(false);
  expect(firstAttempt?.errorCode).toBe('PERMISSION_DENIED');
  expect(String(firstAttempt?.details?.reason || '')).toBe('approval_required');
  expect(firstAttempt?.details?.approval_required).toBe(true);

  await page.evaluate(() => {
    window.__originGrantPromise = window.__openclawLiteTest.requestOriginGrant({
      url: 'https://example.com/perm-check',
      capability: 'web_fetch',
      scope: 'session',
      methods: ['GET']
    });
  });

  await expect(page.getByTestId('approvals-panel')).toBeVisible({ timeout: 3000 });
  const approveBtn = page.locator('#approvals button', { hasText: 'Approve' }).first();
  await expect(approveBtn).toBeVisible({ timeout: 3000 });
  await approveBtn.click();

  const grantResult = await page.evaluate(async () => {
    return await window.__originGrantPromise;
  });
  expect(grantResult?.ok).toBe(true);

  const afterGrant = await page.evaluate(async () => {
    const access = await window.__openclawLiteTest.checkOriginAccess({
      url: 'https://example.com/perm-check',
      capability: 'web_fetch',
      method: 'GET',
      consume: false
    });
    const fetched = await window.__openclawLiteTest.webFetch({
      url: 'https://example.com/perm-check',
      expectedMime: 'text/plain'
    });
    return {
      access,
      fetched,
      errorCode: String(fetched?.error?.code || ''),
      reason: String(fetched?.error?.details?.reason || '')
    };
  });

  expect(afterGrant?.access?.allowed).toBe(true);
  if (afterGrant?.fetched?.ok === true) {
    expect(String(afterGrant?.fetched?.data?.text || '')).toContain('policy-ok');
  } else {
    expect(afterGrant?.errorCode).not.toBe('PERMISSION_DENIED');
    expect(afterGrant?.reason).not.toBe('approval_required');
  }
});

test('permission manifest denies persistent workspace writes when storage.local.persistent is missing', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.setPermissionPolicy({
      manifest: {
        type: 'https://agent.town/schemas/permission-manifest-v1',
        version: '1.0.0',
        permissions: []
      }
    });
    const write = await api.workspaceWriteFile({ path: 'workspace/perm-storage.txt', content: 'blocked' });
    return {
      write,
      errorCode: String(write?.error?.code || ''),
      details: write?.error?.details || null
    };
  });

  expect(summary?.write?.ok).toBe(false);
  expect(summary?.errorCode).toBe('PERMISSION_DENIED');
  expect(String(summary?.details?.reason || '')).toBe('missing_permission');
  expect(String(summary?.details?.missing_permission || '')).toBe('storage.local.persistent');
});

test('permission manifest requires approval before persistent workspace write when declared', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  await page.evaluate(() => {
    window.__storageWritePromise = (async () => {
      const api = window.__openclawLiteTest;
      await api.setPermissionPolicy({
        manifest: {
          type: 'https://agent.town/schemas/permission-manifest-v1',
          version: '1.0.0',
          permissions: [
            { id: 'storage.local.persistent' }
          ]
        }
      });
      return api.workspaceWriteFile({ path: 'workspace/perm-storage-approved.txt', content: 'allowed' });
    })();
  });

  await expect(page.getByTestId('approvals-panel')).toBeVisible({ timeout: 3000 });
  const approveBtn = page.locator('#approvals button', { hasText: 'Approve' }).first();
  await expect(approveBtn).toBeVisible({ timeout: 3000 });
  await approveBtn.click();

  const writeResult = await page.evaluate(async () => {
    return await window.__storageWritePromise;
  });
  expect(writeResult?.ok).toBe(true);

  const verifyRead = await page.evaluate(async () => {
    return await window.__openclawLiteTest.workspaceReadFile({ path: 'workspace/perm-storage-approved.txt' });
  });
  expect(verifyRead?.ok).toBe(true);
  expect(String(verifyRead?.data?.content || '')).toContain('allowed');
});

test('permission manifest denies secret access when secrets.read is missing', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.setPermissionPolicy({
      manifest: {
        type: 'https://agent.town/schemas/permission-manifest-v1',
        version: '1.0.0',
        permissions: []
      }
    });
    const listed = await api.listSecrets();
    return {
      listed,
      errorCode: String(listed?.error?.code || ''),
      details: listed?.error?.details || null
    };
  });

  expect(summary?.listed?.ok).toBe(false);
  expect(summary?.errorCode).toBe('PERMISSION_DENIED');
  expect(String(summary?.details?.reason || '')).toBe('missing_permission');
  expect(String(summary?.details?.missing_permission || '')).toBe('secrets.read');
});

test('permission manifest denies wallet_sign_message when wallet.eip1193.sign is missing', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.setPermissionPolicy({
      manifest: {
        type: 'https://agent.town/schemas/permission-manifest-v1',
        version: '1.0.0',
        permissions: []
      }
    });
    const signed = await api.walletSignMessageTool({ chain: 'evm', message: 'blocked-sign' });
    return {
      signed,
      errorCode: String(signed?.error?.code || ''),
      details: signed?.error?.details || null
    };
  });

  expect(summary?.signed?.ok).toBe(false);
  expect(summary?.errorCode).toBe('PERMISSION_DENIED');
  expect(String(summary?.details?.reason || '')).toBe('missing_permission');
  expect(String(summary?.details?.missing_permission || '')).toBe('wallet.eip1193.sign');
});

test('permission manifest enforces wallet.eip1193.tx permission + tx constraints', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;

    await api.setPermissionPolicy({
      manifest: {
        type: 'https://agent.town/schemas/permission-manifest-v1',
        version: '1.0.0',
        permissions: []
      }
    });
    const missingPermission = await api.walletSendTransactionTool({
      chain: 'evm',
      to: '0x000000000000000000000000000000000000dEaD',
      valueWei: '1',
      chainId: 11155111
    });

    await api.setPermissionPolicy({
      manifest: {
        type: 'https://agent.town/schemas/permission-manifest-v1',
        version: '1.0.0',
        permissions: [
          {
            id: 'wallet.eip1193.tx',
            constraints: {
              chainIds: [11155111],
              to: '0x000000000000000000000000000000000000dEaD',
              maxValueWei: '1'
            }
          }
        ]
      }
    });
    const constraintDenied = await api.walletSendTransactionTool({
      chain: 'evm',
      to: '0x000000000000000000000000000000000000dEaD',
      valueWei: '2',
      chainId: 11155111
    });

    return {
      missingPermission,
      missingPermissionCode: String(missingPermission?.error?.code || ''),
      missingPermissionDetails: missingPermission?.error?.details || null,
      constraintDenied,
      constraintDeniedCode: String(constraintDenied?.error?.code || ''),
      constraintDeniedDetails: constraintDenied?.error?.details || null
    };
  });

  expect(summary?.missingPermission?.ok).toBe(false);
  expect(summary?.missingPermissionCode).toBe('PERMISSION_DENIED');
  expect(String(summary?.missingPermissionDetails?.reason || '')).toBe('missing_permission');
  expect(String(summary?.missingPermissionDetails?.missing_permission || '')).toBe('wallet.eip1193.tx');

  expect(summary?.constraintDenied?.ok).toBe(false);
  expect(summary?.constraintDeniedCode).toBe('PERMISSION_DENIED');
  expect(String(summary?.constraintDeniedDetails?.reason || '')).toBe('constraint_violation');
  expect(String(summary?.constraintDeniedDetails?.constraint_violation || '')).toBe('value_exceeds_max');
});

test('skill diagnostics persist last experience run failure details', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    const visit = await api.visitExperience({ url: '/skill.md' });
    const run = await api.experienceRun({ prompt: 'Run the experience once for diagnostics.' });
    const skillState = await api.skillState();
    return { visit, run, skillState };
  });

  expect(summary?.visit?.ok).toBe(true);
  expect(summary?.run?.ok).toBe(false);
  expect(summary?.run?.error?.code).toBe('LLM_NOT_CONFIGURED');

  expect(summary?.skillState?.ok).toBe(true);
  expect(summary?.skillState?.data?.status).toBe('ready');
  expect(summary?.skillState?.data?.sourceUrl || '').toContain('/skill.md');
  expect(Number(summary?.skillState?.data?.lastImportedAtMs || 0)).toBeGreaterThan(0);
  expect(Number(summary?.skillState?.data?.lastRunAtMs || 0)).toBeGreaterThan(0);
  expect(summary?.skillState?.data?.lastRunMode).toBe('agent-turn');
  expect(summary?.skillState?.data?.lastRunOk).toBe(false);
  expect(summary?.skillState?.data?.lastRunErrorCode).toBe('LLM_NOT_CONFIGURED');
  expect(summary?.skillState?.data?.lastRunErrorMessage || '').toContain('LLM not configured');
  expect(Number(summary?.skillState?.data?.lastRunDurationMs || 0)).toBeGreaterThanOrEqual(0);
});

test('http_request accepts raw JSON string/object body for /api/agent/connect', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const result = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    const origin = window.location.origin;
    const create = await api.httpRequest({
      method: 'POST',
      url: `${origin}/api/agent/session`,
      headers: { 'content-type': 'application/json' },
      body: { kind: 'json', json: { agentName: 'OpenClaw' } },
      responseMode: 'json'
    });
    const teamCode = String(create?.data?.bodyJson?.teamCode || '').trim();
    const connectWithString = await api.httpRequest({
      method: 'POST',
      url: `${origin}/api/agent/connect`,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ teamCode, agentName: 'OpenClaw' }),
      responseMode: 'json'
    });
    const connectWithObject = await api.httpRequest({
      method: 'POST',
      url: `${origin}/api/agent/connect`,
      headers: { 'content-type': 'application/json' },
      body: { teamCode, agentName: 'OpenClaw' },
      responseMode: 'json'
    });
    return { create, teamCode, connectWithString, connectWithObject };
  });

  expect(result?.create?.ok).toBe(true);
  expect(result?.teamCode).toMatch(/^TEAM-/);
  expect(result?.connectWithString?.ok).toBe(true);
  expect(result?.connectWithObject?.ok).toBe(true);
});

test('agent-town ceremony tools drive commit/reveal payloads without server-side shortcuts', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    const stateResp = await fetch('/api/state', { credentials: 'include' });
    const state = await stateResp.json().catch(() => ({}));
    const teamCode = String(state?.teamCode || '').trim();

    const revealBeforeCommit = await api.agentTownCeremonyReveal({ teamCode });
    const commitTool = await api.agentTownCeremonyCommit({ teamCode });

    const bytesToB64 = (bytes) => {
      let binary = '';
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    };

    const humanReveal = crypto.getRandomValues(new Uint8Array(32));
    const humanCommitBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', humanReveal));
    const humanCommit = bytesToB64(humanCommitBytes);
    const revealPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );
    const humanRevealPub = bytesToB64(new Uint8Array(await crypto.subtle.exportKey('spki', revealPair.publicKey)));
    const humanCommitResp = await fetch('/api/human/house/commit', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ commit: humanCommit, revealPub: humanRevealPub })
    });
    const humanCommitBody = await humanCommitResp.json().catch(() => ({}));

    const revealTool = await api.agentTownCeremonyReveal({ teamCode });
    const materialResp = await fetch(`/api/agent/house/material?teamCode=${encodeURIComponent(teamCode)}`, {
      credentials: 'include'
    });
    const agentMaterial = await materialResp.json().catch(() => ({}));
    const humanMaterialResp = await fetch('/api/human/house/material', {
      credentials: 'include'
    });
    const humanMaterial = await humanMaterialResp.json().catch(() => ({}));

    return {
      teamCode,
      revealBeforeCommit,
      commitTool,
      humanCommitBody,
      revealTool,
      agentMaterial,
      humanMaterial
    };
  });

  expect(summary?.teamCode).toMatch(/^TEAM-/);
  expect(summary?.revealBeforeCommit?.ok).toBe(false);
  expect(summary?.revealBeforeCommit?.error?.code).toBe('CEREMONY_NOT_COMMITTED');

  expect(summary?.commitTool?.ok).toBe(true);
  expect(summary?.commitTool?.data?.commit || '').toMatch(/^[A-Za-z0-9+/=]+$/);
  expect(summary?.commitTool?.data?.revealPub || '').toMatch(/^[A-Za-z0-9+/=]+$/);

  expect(summary?.humanCommitBody?.ok).toBe(true);
  expect(summary?.revealTool?.ok).toBe(true);
  expect(summary?.agentMaterial?.ok).toBe(true);
  expect(summary?.agentMaterial?.agentCommit).toBe(summary?.commitTool?.data?.commit);
  expect(summary?.humanMaterial?.ok).toBe(true);
  expect(summary?.humanMaterial?.agentRevealSealed?.alg).toBe('CEREMONY_E2EE_P256_AESGCM_V1');
});

test('agent-town ceremony commit is idempotent per team and random across team reset', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    const stateAResp = await fetch('/api/state', { credentials: 'include' });
    const stateA = await stateAResp.json().catch(() => ({}));
    const teamA = String(stateA?.teamCode || '').trim();

    const first = await api.agentTownCeremonyCommit({ teamCode: teamA });
    const second = await api.agentTownCeremonyCommit({ teamCode: teamA });

    const resetResp = await fetch('/api/session/reset', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    const reset = await resetResp.json().catch(() => ({}));
    const teamB = String(reset?.teamCode || '').trim();

    const third = await api.agentTownCeremonyCommit({ teamCode: teamB });
    return { teamA, teamB, first, second, third };
  });

  expect(summary?.teamA).toMatch(/^TEAM-/);
  expect(summary?.teamB).toMatch(/^TEAM-/);
  expect(summary?.teamB).not.toBe(summary?.teamA);

  expect(summary?.first?.ok).toBe(true);
  expect(summary?.second?.ok).toBe(true);
  expect(summary?.third?.ok).toBe(true);

  const firstCommit = summary?.first?.data?.commit || '';
  const secondCommit = summary?.second?.data?.commit || '';
  const thirdCommit = summary?.third?.data?.commit || '';
  const firstRevealPub = summary?.first?.data?.revealPub || '';
  const secondRevealPub = summary?.second?.data?.revealPub || '';
  const thirdRevealPub = summary?.third?.data?.revealPub || '';

  expect(firstCommit).toMatch(/^[A-Za-z0-9+/=]+$/);
  expect(firstRevealPub).toMatch(/^[A-Za-z0-9+/=]+$/);

  // Same team: idempotent commit/reveal identity.
  expect(secondCommit).toBe(firstCommit);
  expect(secondRevealPub).toBe(firstRevealPub);

  // New team: fresh random ceremony material.
  expect(thirdCommit).not.toBe(firstCommit);
  expect(thirdRevealPub).not.toBe(firstRevealPub);
});

test('approval requests render in index flow and can be rejected', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  await expect(page.getByTestId('approvals-panel')).toHaveClass(/is-hidden/, { timeout: 2500 });

  await page.evaluate(() => {
    window.__approvalProbePromise = window.__openclawLiteTest.setSecret({
      name: 'approval_probe',
      value: 'demo-value'
    });
  });

  await expect(page.getByTestId('approvals-panel')).toBeVisible({ timeout: 2500 });
  const rejectBtn = page.locator('#approvals button', { hasText: 'Reject' }).first();
  await expect(rejectBtn).toBeVisible({ timeout: 5000 });

  const pendingText = await page.locator('#approvals').innerText();
  expect(pendingText).toContain('Secret set: approval_probe');

  await rejectBtn.click();

  await page.waitForFunction(() => {
    return !document.querySelector('#approvals button');
  }, null, { timeout: 3000 });

  await expect(page.getByTestId('approvals-panel')).toHaveClass(/is-hidden/, { timeout: 3000 });

  const approvalResult = await page.evaluate(async () => {
    return await window.__approvalProbePromise;
  });
  expect(approvalResult?.ok).toBe(false);
  expect(approvalResult?.error?.code).toBe('APPROVAL_REJECTED');

  const workspace = await page.evaluate(async () => {
    return await window.__openclawLiteTest.workspaceList({ path: 'workspace/' });
  });
  expect(workspace?.ok).toBe(true);
});

test('transcript can be reset to avoid stale context pollution', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    const seeded = await api.clearTranscript({ rotateSession: true, keepBootMessage: true });
    const seededDumpRaw = await api.getTranscriptDump();
    const seededDump = JSON.parse(seededDumpRaw || '[]');
    const rotatedReset = await api.clearTranscript({ rotateSession: true, keepBootMessage: false });
    const afterDumpRaw = await api.getTranscriptDump();
    const after = JSON.parse(afterDumpRaw || '[]');
    const digestQueue = await api.getTranscriptDigestQueue();
    return {
      seededLength: Array.isArray(seededDump) ? seededDump.length : -1,
      seeded,
      rotatedReset,
      afterLength: Array.isArray(after) ? after.length : -1,
      digestQueueLength: Array.isArray(digestQueue) ? digestQueue.length : -1,
      digestQueueFirst: Array.isArray(digestQueue) && digestQueue.length > 0 ? digestQueue[0] : null,
    };
  });

  expect(summary.seededLength).toBe(1);
  expect(summary.seeded?.rotatedSession).toBe(true);
  expect(summary.seeded?.currentLength).toBe(1);
  expect(summary.afterLength).toBe(0);
  expect(summary.rotatedReset?.rotatedSession).toBe(true);
  expect(summary.rotatedReset?.currentLength).toBe(0);
  expect(summary.rotatedReset?.queuedForMemoryDigest).toBe(true);
  expect(summary.rotatedReset?.archivedTranscriptPath || '').toContain('.openclaw/agents/main/sessions/');
  expect(summary.rotatedReset?.archivedTranscriptPath || '').toContain('.new-session.');
  expect(summary.digestQueueLength).toBeGreaterThan(0);
  expect(summary.digestQueueFirst?.status).toBe('pending');
});

test('agent panel New session button rotates and clears worker context', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  await page.evaluate(async () => {
    await window.__openclawLiteTest.clearTranscript({ rotateSession: true, keepBootMessage: true });
  });

  await expect(page.getByTestId('agent-new-session')).toBeVisible({ timeout: 1500 });
  await page.getByTestId('agent-new-session').click();

  await page.waitForFunction(async () => {
    try {
      const raw = await window.__openclawLiteTest.getTranscriptDump();
      const dump = JSON.parse(raw || '[]');
      return Array.isArray(dump) && dump.length === 0;
    } catch {
      return false;
    }
  }, null, { timeout: 5000 });

  const summary = await page.evaluate(async () => {
    const dump = JSON.parse(await window.__openclawLiteTest.getTranscriptDump() || '[]');
    return {
      transcriptLength: Array.isArray(dump) ? dump.length : -1
    };
  });

  expect(Number(summary.transcriptLength)).toBeLessThanOrEqual(1);
});
