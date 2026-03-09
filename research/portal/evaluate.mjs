import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const researchRoot = __dirname;
const repoRoot = path.resolve(researchRoot, "..", "..");
const artifactsDir = path.join(researchRoot, "artifacts");
const artifactPath = path.join(artifactsDir, "last-run.json");

const HOST = process.env.PORTAL_RESEARCH_HOST || "::1";
const PORT = Number(process.env.PORTAL_RESEARCH_PORT || process.env.PW_PORT || 4178);
const BASE_URL = process.env.PORTAL_RESEARCH_BASE_URL || `http://[${HOST}]:${PORT}`;
const RESET_TOKEN = process.env.TEST_RESET_TOKEN || "test-reset";
const STORE_PATH = path.join(repoRoot, "data", "store.portal-research.sqlite");

const LOSS_VERSION = "portal-loss-v1";
const SOFT_WEIGHTS = Object.freeze({
  consoleErrors: 35,
  pageErrors: 120,
  requestFailures: 60,
  teamCodeLeaks: 80,
  landingClutter: 8,
  appShellMs: 1 / 200,
  agentPanelMs: 1 / 250,
  debugReadyMs: 1 / 250,
  trainerOpenMs: 1 / 150,
  ceremonyModalMs: 1 / 200,
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function ringBuffer(limit = 120) {
  const rows = [];
  return {
    push(prefix, chunk) {
      const text = String(chunk || "");
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trimEnd();
        if (!trimmed) continue;
        rows.push(`${prefix}${trimmed}`);
        if (rows.length > limit) rows.shift();
      }
    },
    list() {
      return rows.slice();
    },
  };
}

function gitValue(args) {
  const out = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (out.status !== 0) return "";
  return String(out.stdout || "").trim();
}

function requestJson(method, requestPath, { body = null, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        host: HOST,
        family: HOST.includes(":") ? 6 : 4,
        port: PORT,
        path: requestPath,
        method,
        headers: {
          accept: "application/json",
          ...(payload
            ? {
                "content-type": "application/json",
                "content-length": Buffer.byteLength(payload),
              }
            : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            parsed = null;
          }
          resolve({
            statusCode: res.statusCode || 0,
            body: parsed,
            text: raw,
          });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function waitForHealth(timeoutMs = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const resp = await requestJson("GET", "/api/health");
      if (resp.statusCode === 200 && resp.body?.ok === true) return;
    } catch {
      // wait and retry
    }
    await delay(150);
  }
  throw new Error(`SERVER_HEALTH_TIMEOUT:${timeoutMs}`);
}

function startServer() {
  const lines = ringBuffer();
  const child = spawn(process.execPath, ["server/index.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(PORT),
      TEST_RESET_TOKEN: RESET_TOKEN,
      ADMIN_TOKEN: "test-admin",
      ENABLE_PRIVY_IN_TEST: "0",
      PRIVY_APP_ID: "",
      PRIVY_CLIENT_ID: "",
      PRIVY_APP_SECRET: "",
      PRIVY_PUBLIC_CONFIG_JSON: "{}",
      START_PAGE_ENABLED: "0",
      STORE_PATH,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => lines.push("[server] ", chunk));
  child.stderr.on("data", (chunk) => lines.push("[server] ", chunk));
  return { child, lines };
}

async function stopServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(5000),
  ]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
  }
}

async function resetState() {
  const resp = await requestJson("POST", "/__test__/reset", {
    headers: {
      "x-test-reset": RESET_TOKEN,
    },
  });
  if (resp.statusCode !== 200) {
    throw new Error(`RESET_FAILED:${resp.statusCode}`);
  }
}

async function locatorVisible(locator) {
  const count = await locator.count();
  if (!count) return false;
  try {
    return await locator.first().isVisible();
  } catch {
    return false;
  }
}

async function assertHiddenOrAbsent(locator, message, failures) {
  if (await locatorVisible(locator)) failures.push(message);
}

async function waitForText(locator, matcher, timeoutMs = 5000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const text = await locator.textContent().catch(() => "");
    if (matcher.test(String(text || ""))) return String(text || "");
    await delay(50);
  }
  throw new Error(`TEXT_TIMEOUT:${matcher}`);
}

function attachPageDiagnostics(page, metrics) {
  page.on("console", (msg) => {
    if (msg.type() === "error") metrics.consoleErrors += 1;
  });
  page.on("pageerror", () => {
    metrics.pageErrors += 1;
  });
  page.on("requestfailed", (request) => {
    const url = String(request.url() || "");
    const failure = String(request.failure()?.errorText || "");
    if (!url.startsWith(BASE_URL)) return;
    if (/ERR_ABORTED/i.test(failure)) return;
    metrics.requestFailures += 1;
  });
}

function combineScenario(result, aggregate) {
  aggregate.consoleErrors += result.metrics.consoleErrors || 0;
  aggregate.pageErrors += result.metrics.pageErrors || 0;
  aggregate.requestFailures += result.metrics.requestFailures || 0;
  aggregate.failureMessages.push(...result.failures);
  aggregate.scenarios.push(result);
}

async function runScenario(browser, name, runner) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  const metrics = {
    consoleErrors: 0,
    pageErrors: 0,
    requestFailures: 0,
  };
  const failures = [];
  attachPageDiagnostics(page, metrics);
  const startedAt = Date.now();
  try {
    const extra = await runner(page, failures);
    Object.assign(metrics, extra || {});
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR")}`);
  } finally {
    await context.close();
  }
  return {
    name,
    durationMs: Date.now() - startedAt,
    metrics,
    failures,
  };
}

async function countLandingClutter(page) {
  return await page.evaluate(() => {
    const isVisible = (node) => {
      if (!(node instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const selectors = [
      "button",
      "[role=\"button\"]",
      "a[href]",
      "input:not([type=\"hidden\"])",
      "select",
      "textarea",
    ];
    const nodes = Array.from(document.querySelectorAll(selectors.join(",")));
    return nodes.filter((node) => {
      if (!isVisible(node)) return false;
      if (node.closest("#agentSidebar")) return false;
      if (node.closest("[data-testid=\"agent-panel\"]")) return false;
      if (node.closest("#districtModalBackdrop")) return false;
      if (node.closest("[data-testid=\"trainer-modal\"]")) return false;
      if (node.closest(".townDistrictHotspot")) return false;
      return true;
    }).length;
  });
}

async function countTeamCodeLeaks(page) {
  return await page.evaluate(() => {
    const isVisible = (node) => {
      if (!(node instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let count = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!(node instanceof HTMLElement)) continue;
      if (!isVisible(node)) continue;
      if (node.closest("#agentSidebar")) continue;
      if (node.closest("[data-testid=\"agent-panel\"]")) continue;
      const text = String(node.textContent || "");
      if (!/TEAM-[A-Z2-9]{4}-[A-Z2-9]{4}/.test(text)) continue;
      const childHasMatch = Array.from(node.children || []).some((child) => {
        return child instanceof HTMLElement && /TEAM-[A-Z2-9]{4}-[A-Z2-9]{4}/.test(String(child.textContent || ""));
      });
      if (!childHasMatch) count += 1;
    }
    return count;
  });
}

async function postJsonWithPage(page, targetPath, payload = {}) {
  return await page.evaluate(async ({ path, body }) => {
    const resp = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    const data = await resp.json().catch(() => ({}));
    return {
      ok: resp.ok,
      status: resp.status,
      body: data,
    };
  }, { path: targetPath, body: payload });
}

async function getJsonWithPage(page, targetPath) {
  return await page.evaluate(async (path) => {
    const resp = await fetch(path, { credentials: "include" });
    const data = await resp.json().catch(() => ({}));
    return {
      ok: resp.ok,
      status: resp.status,
      body: data,
    };
  }, targetPath);
}

async function ensureTownhallVisible(page) {
  const panel = page.locator("#townhallRegisterPanel");
  if (await locatorVisible(panel)) return;
  const modal = page.locator("#districtModalBackdrop");
  if (!(await locatorVisible(modal))) {
    await page.getByRole("button", { name: "Open Town Hall" }).click();
  }
  await panel.waitFor({ state: "visible", timeout: 5000 });
}

async function completeSignupForCreateRoute(page) {
  const sessionResp = await getJsonWithPage(page, "/api/session");
  const teamCode = String(sessionResp?.body?.teamCode || "");
  if (!teamCode || !/^TEAM-/.test(teamCode)) {
    throw new Error("MISSING_TEAM_CODE");
  }

  const calls = [
    ["/api/agent/connect", { teamCode, agentName: "PortalResearch" }],
    ["/api/human/select", { elementId: "wolf" }],
    ["/api/agent/select", { teamCode, elementId: "wolf" }],
    ["/api/human/open/press", {}],
    ["/api/agent/open/press", { teamCode }],
  ];

  for (const [targetPath, payload] of calls) {
    const resp = await postJsonWithPage(page, targetPath, payload);
    if (!resp?.ok || resp?.body?.ok !== true) {
      throw new Error(`SIGNUP_STEP_FAILED:${targetPath}:${resp?.body?.error || resp?.status || "UNKNOWN"}`);
    }
  }

  const stateResp = await getJsonWithPage(page, "/api/state");
  if (stateResp?.body?.signup?.complete !== true) {
    throw new Error("SIGNUP_NOT_COMPLETE");
  }
}

async function evaluateLanding(page, failures) {
  const startedAt = Date.now();
  await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });
  await page.locator("#districtMap").waitFor({ state: "visible", timeout: 5000 });
  await page.locator('.townDistrictHotspot[data-district="house"]').waitFor({ state: "visible", timeout: 5000 });
  await assertHiddenOrAbsent(page.getByTestId("auth-signin"), "landing: auth-signin should stay hidden", failures);
  await assertHiddenOrAbsent(page.getByTestId("auth-signup"), "landing: auth-signup should stay hidden", failures);
  await assertHiddenOrAbsent(page.getByTestId("path-human"), "landing: path-human should stay hidden", failures);
  await assertHiddenOrAbsent(page.getByTestId("path-coop"), "landing: path-coop should stay hidden", failures);
  await assertHiddenOrAbsent(page.getByTestId("path-agent"), "landing: path-agent should stay hidden", failures);
  await assertHiddenOrAbsent(page.getByTestId("sigil-grid"), "landing: sigil-grid should stay hidden", failures);
  await assertHiddenOrAbsent(page.getByTestId("sigil-key"), "landing: sigil-key should stay hidden", failures);
  await assertHiddenOrAbsent(page.getByTestId("open-btn"), "landing: open-btn should stay hidden", failures);
  const landingClutter = await countLandingClutter(page);
  const teamCodeLeaks = await countTeamCodeLeaks(page);
  if (teamCodeLeaks > 0) {
    failures.push(`landing: visible Team Code leaks detected (${teamCodeLeaks})`);
  }
  return {
    appShellMs: Date.now() - startedAt,
    landingClutter,
    teamCodeLeaks,
  };
}

async function evaluateAgentPanel(page, failures) {
  await page.addInitScript(() => {
    localStorage.setItem("agentTown:panel:minimized", "0");
    localStorage.setItem("agentTown:panel:debugVisible", "1");
  });
  const startedAt = Date.now();
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("agent-panel").waitFor({ state: "visible", timeout: 4000 });
  const agentPanelMs = Date.now() - startedAt;

  const debugPane = page.getByTestId("agent-debug-pane");
  if (!(await locatorVisible(debugPane))) {
    await page.getByTestId("agent-debug-toggle").click();
  }
  await page.getByTestId("agent-debug-pane").waitFor({ state: "visible", timeout: 4000 });

  const debugStartedAt = Date.now();
  await waitForText(page.getByTestId("agent-debug-tools"), /Worker tools count/i, 8000);
  await page.locator("#chatInput").fill("portal research probe");
  await page.locator("#sendChatBtn").click();
  await page.locator("#chatTranscript .chat-message.user").last().waitFor({ state: "visible", timeout: 4000 });

  await page.getByTestId("agent-debug-tab-skill").click();
  const skillPanel = page.getByTestId("agent-debug-panel-skill");
  if ((await skillPanel.count()) === 0 || (await skillPanel.getAttribute("class"))?.includes("is-hidden")) {
    failures.push("agent panel: skill debug panel stayed hidden");
  }

  await page.getByTestId("agent-debug-tab-traffic").click();
  const trafficPanel = page.getByTestId("agent-debug-panel-traffic");
  if ((await trafficPanel.count()) === 0 || (await trafficPanel.getAttribute("class"))?.includes("is-hidden")) {
    failures.push("agent panel: traffic debug panel stayed hidden");
  }

  await page.getByTestId("agent-debug-tab-session").click();
  const sessionPanel = page.getByTestId("agent-debug-panel-session");
  if ((await sessionPanel.count()) === 0 || (await sessionPanel.getAttribute("class"))?.includes("is-hidden")) {
    failures.push("agent panel: session debug panel stayed hidden");
  }
  await waitForText(page.getByTestId("agent-debug-session"), /"runtimeState"/, 8000);

  return {
    agentPanelMs,
    debugReadyMs: Date.now() - debugStartedAt,
  };
}

async function evaluateTrainer(page, failures) {
  await page.addInitScript(() => {
    localStorage.setItem("agentTown:panel:minimized", "0");
  });
  await page.goto(`${BASE_URL}/app?liteDriver=phase1`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("agent-open-trainer").waitFor({ state: "visible", timeout: 5000 });
  const startedAt = Date.now();
  await page.getByTestId("agent-open-trainer").click();
  await page.getByTestId("trainer-modal").waitFor({ state: "visible", timeout: 5000 });
  await page.getByTestId("trainer-root").waitFor({ state: "visible", timeout: 5000 });
  const currentPath = new URL(page.url()).pathname;
  if (/\/trainer(?:$|\/)/.test(currentPath)) {
    failures.push("trainer: full-page navigation regression");
  }
  return {
    trainerOpenMs: Date.now() - startedAt,
  };
}

async function evaluateCeremonyModal(page, failures) {
  await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });
  await completeSignupForCreateRoute(page);
  await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });
  await ensureTownhallVisible(page);

  const startedAt = Date.now();
  await page.evaluate(() => {
    const link = document.querySelector('#openReady a[href="/create"]');
    if (!(link instanceof HTMLElement)) throw new Error("MISSING_CREATE_LINK");
    link.click();
  });
  await page.locator("#districtModalTitle").waitFor({ state: "visible", timeout: 5000 });
  const frame = page.locator("#districtModalBody iframe.districtFrame");
  await frame.waitFor({ state: "visible", timeout: 5000 });
  const ceremonyFrame = page.frameLocator("#districtModalBody iframe.districtFrame");
  await ceremonyFrame.locator("#canvas").waitFor({ state: "visible", timeout: 5000 });

  const currentPath = new URL(page.url()).pathname;
  if (currentPath !== "/app") {
    failures.push(`ceremony: expected modal flow to stay on /app, got ${currentPath}`);
  }
  const titleText = String(await page.locator("#districtModalTitle").textContent().catch(() => ""));
  if (titleText.trim() !== "Ceremony") {
    failures.push(`ceremony: expected modal title Ceremony, got ${titleText.trim() || "empty"}`);
  }
  const frameSrc = String(await frame.getAttribute("src").catch(() => ""));
  if (!/\/create\?embed=1/.test(frameSrc)) {
    failures.push(`ceremony: expected embed frame src, got ${frameSrc || "empty"}`);
  }
  if (await locatorVisible(ceremonyFrame.locator(".topbar"))) {
    failures.push("ceremony: embedded create topbar should stay hidden");
  }
  if (await locatorVisible(ceremonyFrame.locator("footer"))) {
    failures.push("ceremony: embedded create footer should stay hidden");
  }
  if ((await ceremonyFrame.locator('[data-testid="agent-panel"]').count()) > 0) {
    failures.push("ceremony: embedded create frame should not render the agent panel");
  }
  return {
    ceremonyModalMs: Date.now() - startedAt,
  };
}

async function evaluateLoopbackProxyGuard(page, failures) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  const result = await page.evaluate(async () => {
    const encodedBase = encodeURIComponent(window.location.origin);
    const res = await fetch(`/api/llm/proxy/${encodedBase}/api/health`, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });
    const body = await res.json().catch(() => null);
    return {
      status: res.status,
      body,
    };
  });
  const ok = (
    result?.status === 403
    && result?.body?.ok === false
    && result?.body?.error === "UPSTREAM_HOST_BLOCKED"
  );
  if (!ok) {
    failures.push(`server: expected loopback proxy block, got ${result?.status || "unknown"} / ${result?.body?.error || "no-error"}`);
  }
  return {
    loopbackProxyGuardOk: ok,
  };
}

async function evaluateTeamCodeHintRestore() {
  const first = await requestJson("GET", "/api/state", {
    headers: {
      cookie: "et_session=missing",
    },
  });
  if (first.statusCode !== 200) return false;
  const hintedTeamCode = String(first.body?.teamCode || "");
  if (!/^TEAM-/.test(hintedTeamCode)) return false;

  const second = await requestJson("GET", "/api/state", {
    headers: {
      cookie: "et_session=missing",
      "x-team-code-hint": hintedTeamCode,
    },
  });
  if (second.statusCode !== 200) return false;
  if (String(second.body?.teamCode || "") !== hintedTeamCode) return false;

  const third = await requestJson("GET", "/api/state", {
    headers: {
      cookie: "et_session=missing",
      "x-team-code-hint": hintedTeamCode,
    },
  });
  return third.statusCode === 200 && String(third.body?.teamCode || "") === hintedTeamCode;
}

function computeLoss(metrics, hardFailures) {
  return hardFailures * 1000
    + metrics.consoleErrors * SOFT_WEIGHTS.consoleErrors
    + metrics.pageErrors * SOFT_WEIGHTS.pageErrors
    + metrics.requestFailures * SOFT_WEIGHTS.requestFailures
    + metrics.teamCodeLeaks * SOFT_WEIGHTS.teamCodeLeaks
    + Math.max(0, metrics.landingClutter - 2) * SOFT_WEIGHTS.landingClutter
    + metrics.appShellMs * SOFT_WEIGHTS.appShellMs
    + metrics.agentPanelMs * SOFT_WEIGHTS.agentPanelMs
    + metrics.debugReadyMs * SOFT_WEIGHTS.debugReadyMs
    + metrics.trainerOpenMs * SOFT_WEIGHTS.trainerOpenMs
    + metrics.ceremonyModalMs * SOFT_WEIGHTS.ceremonyModalMs;
}

await fs.mkdir(artifactsDir, { recursive: true });

let browser = null;
let server = null;
let serverLogs = [];
let exitCode = 0;

try {
  const { chromium } = await import("@playwright/test");
  server = startServer();
  await waitForHealth();
  browser = await chromium.launch({ headless: true });

  const aggregate = {
    consoleErrors: 0,
    pageErrors: 0,
    requestFailures: 0,
    landingClutter: 0,
    teamCodeLeaks: 0,
    appShellMs: 0,
    agentPanelMs: 0,
    debugReadyMs: 0,
    trainerOpenMs: 0,
    ceremonyModalMs: 0,
    loopbackProxyGuardOk: false,
    teamCodeHintRestoreOk: false,
    failureMessages: [],
    scenarios: [],
  };

  const overallStartedAt = Date.now();

  await resetState();
  combineScenario(await runScenario(browser, "landing", evaluateLanding), aggregate);

  await resetState();
  combineScenario(await runScenario(browser, "agent_panel", evaluateAgentPanel), aggregate);

  await resetState();
  combineScenario(await runScenario(browser, "trainer", evaluateTrainer), aggregate);

  await resetState();
  combineScenario(await runScenario(browser, "ceremony_modal", evaluateCeremonyModal), aggregate);

  await resetState();
  combineScenario(await runScenario(browser, "loopback_proxy_guard", evaluateLoopbackProxyGuard), aggregate);

  await resetState();
  aggregate.teamCodeHintRestoreOk = await evaluateTeamCodeHintRestore();
  if (!aggregate.teamCodeHintRestoreOk) {
    aggregate.failureMessages.push("server: /api/state must restore a live session from x-team-code-hint when cookie is missing");
  }

  for (const scenario of aggregate.scenarios) {
    aggregate.landingClutter += Number(scenario.metrics.landingClutter || 0);
    aggregate.teamCodeLeaks += Number(scenario.metrics.teamCodeLeaks || 0);
    aggregate.appShellMs += Number(scenario.metrics.appShellMs || 0);
    aggregate.agentPanelMs += Number(scenario.metrics.agentPanelMs || 0);
    aggregate.debugReadyMs += Number(scenario.metrics.debugReadyMs || 0);
    aggregate.trainerOpenMs += Number(scenario.metrics.trainerOpenMs || 0);
    aggregate.ceremonyModalMs += Number(scenario.metrics.ceremonyModalMs || 0);
  }
  aggregate.loopbackProxyGuardOk = aggregate.scenarios.every((scenario) => {
    if (scenario.name !== "loopback_proxy_guard") return true;
    return scenario.metrics.loopbackProxyGuardOk === true;
  });

  const hardFailures = aggregate.failureMessages.length;
  const playwrightSeconds = (Date.now() - overallStartedAt) / 1000;
  const loss = computeLoss(aggregate, hardFailures);

  const artifact = {
    lossVersion: LOSS_VERSION,
    repo: {
      root: repoRoot,
      branch: gitValue(["branch", "--show-current"]),
      commit: gitValue(["rev-parse", "--short", "HEAD"]),
    },
    run: {
      baseUrl: BASE_URL,
      startedAt: new Date(overallStartedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      playwrightSeconds: round(playwrightSeconds, 3),
      hardFailures,
      loss: round(loss, 3),
    },
    metrics: {
      consoleErrors: aggregate.consoleErrors,
      pageErrors: aggregate.pageErrors,
      requestFailures: aggregate.requestFailures,
      landingClutter: aggregate.landingClutter,
      teamCodeLeaks: aggregate.teamCodeLeaks,
      appShellMs: round(aggregate.appShellMs, 1),
      agentPanelMs: round(aggregate.agentPanelMs, 1),
      debugReadyMs: round(aggregate.debugReadyMs, 1),
      trainerOpenMs: round(aggregate.trainerOpenMs, 1),
      ceremonyModalMs: round(aggregate.ceremonyModalMs, 1),
      loopbackProxyGuardOk: aggregate.loopbackProxyGuardOk,
      teamCodeHintRestoreOk: aggregate.teamCodeHintRestoreOk,
    },
    failures: aggregate.failureMessages,
    scenarios: aggregate.scenarios,
    serverLogs: server.lines.list(),
  };

  await fs.writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

  console.log("---");
  console.log(`loss:                ${round(loss, 3).toFixed(3)}`);
  console.log(`hard_failures:       ${hardFailures}`);
  console.log(`console_errors:      ${aggregate.consoleErrors}`);
  console.log(`page_errors:         ${aggregate.pageErrors}`);
  console.log(`request_failures:    ${aggregate.requestFailures}`);
  console.log(`landing_clutter:     ${aggregate.landingClutter}`);
  console.log(`team_code_leaks:     ${aggregate.teamCodeLeaks}`);
  console.log(`app_shell_ms:        ${round(aggregate.appShellMs, 1).toFixed(1)}`);
  console.log(`agent_panel_ms:      ${round(aggregate.agentPanelMs, 1).toFixed(1)}`);
  console.log(`debug_ready_ms:      ${round(aggregate.debugReadyMs, 1).toFixed(1)}`);
  console.log(`trainer_open_ms:     ${round(aggregate.trainerOpenMs, 1).toFixed(1)}`);
  console.log(`ceremony_modal_ms:   ${round(aggregate.ceremonyModalMs, 1).toFixed(1)}`);
  console.log(`proxy_loopback_ok:   ${aggregate.loopbackProxyGuardOk ? "yes" : "no"}`);
  console.log(`team_hint_restore:   ${aggregate.teamCodeHintRestoreOk ? "yes" : "no"}`);
  console.log(`playwright_seconds:  ${round(playwrightSeconds, 1).toFixed(1)}`);
  console.log("artifact:            research/portal/artifacts/last-run.json");

  if (hardFailures > 0) exitCode = 1;
} catch (error) {
  exitCode = 1;
  serverLogs = server?.lines?.list?.() || [];
  const artifact = {
    lossVersion: LOSS_VERSION,
    fatal: error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR"),
    serverLogs,
  };
  await fs.writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.error(error);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server?.child) await stopServer(server.child);
}

process.exit(exitCode);
