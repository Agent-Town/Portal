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

test('web_fetch falls back to proxy for cross-origin loopback alias', async ({ page }) => {
  await page.goto('/?liteDriver=phase1');
  await waitForLiteTestApi(page);

  const summary = await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    const current = new URL(window.location.origin);
    const altHost = current.hostname === '127.0.0.1' ? '[::1]' : '127.0.0.1';
    const aliasUrl = `${current.protocol}//${altHost}${current.port ? `:${current.port}` : ''}/skill.md`;
    const fetched = await api.webFetch({ url: aliasUrl, expectedMime: 'text/markdown' });
    const payload = fetched?.data && typeof fetched.data === 'object' ? fetched.data : fetched;
    return { aliasUrl, fetched, payload };
  });

  expect(summary?.aliasUrl || '').toContain('/skill.md');
  expect(summary?.fetched?.ok).toBe(true);
  expect(summary?.payload?.status).toBe(200);
  expect(summary?.payload?.finalUrl || '').toContain('/skill.md');
  expect(summary?.payload?.fromCache).toBe(false);
  expect(summary?.payload?.text || '').toContain('agent-town-playbook');
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

  await expect(page.getByTestId('approvals-panel')).toBeVisible({ timeout: 2500 });
  const rejectBtn = page.locator('#approvals button', { hasText: 'Reject' }).first();
  await expect(rejectBtn).toBeVisible({ timeout: 5000 });

  const pendingText = await page.locator('#approvals').innerText();
  expect(pendingText).toContain('Demo approval request');

  await rejectBtn.click();

  await page.waitForFunction(() => {
    return !document.querySelector('#approvals button');
  }, null, { timeout: 3000 });

  await expect(page.getByTestId('approvals-panel')).toHaveClass(/is-hidden/, { timeout: 3000 });

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

  await page.waitForFunction(() => {
    const lines = Array.from(document.querySelectorAll('#chatTranscript .chat-message.system'))
      .map((node) => String(node.textContent || '').trim());
    return lines.some((line) => line.includes('New session started.'));
  }, null, { timeout: 3000 });

  const summary = await page.evaluate(async () => {
    const dump = JSON.parse(await window.__openclawLiteTest.getTranscriptDump() || '[]');
    const messages = Array.from(document.querySelectorAll('#chatTranscript .chat-message.system'))
      .map((node) => String(node.textContent || '').trim())
      .filter(Boolean);
    return {
      transcriptLength: Array.isArray(dump) ? dump.length : -1,
      hasStartedLine: messages.some((line) => line.includes('New session started.'))
    };
  });

  expect(summary.transcriptLength).toBe(0);
  expect(summary.hasStartedLine).toBe(true);
});
