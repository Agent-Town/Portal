const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..", "..", "..");
const DEFAULT_PORT = Number(process.env.PW_PORT || (process.env.CI ? 4173 : 4174));
const resetToken = process.env.TEST_RESET_TOKEN || "test-reset";

function absPath(...parts) {
  return path.join(ROOT_DIR, ...parts);
}

function fileExists(...parts) {
  return fs.existsSync(absPath(...parts));
}

function readUtf8(...parts) {
  return fs.readFileSync(absPath(...parts), "utf8");
}

function lineCount(...parts) {
  return readUtf8(...parts).split(/\r?\n/).length;
}

function resolveBaseUrl(testInfo) {
  return String(testInfo.project.use.baseURL || `http://[::1]:${DEFAULT_PORT}`);
}

async function resetServer(request) {
  await request.post("/__test__/reset", { headers: { "x-test-reset": resetToken } });
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

async function waitForHealth(origin, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  const url = `${origin}/api/health`;
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for ${url}`);
    await new Promise((r) => setTimeout(r, 120));
  }
}

async function startStandaloneServer(extraEnv = {}) {
  const port = Number(extraEnv.PORT || 0) || (await getFreePort());
  const storePath = path.join(os.tmpdir(), `openclaw-lite-mod-${process.pid}-${port}.sqlite`);
  let logs = "";

  const child = spawn(process.execPath, ["server/index.js"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "development",
      TEST_RESET_TOKEN: resetToken,
      STORE_PATH: storePath,
      ...extraEnv,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (buf) => {
    logs += buf.toString("utf8");
    if (logs.length > 16_000) logs = logs.slice(-16_000);
  });
  child.stderr.on("data", (buf) => {
    logs += buf.toString("utf8");
    if (logs.length > 16_000) logs = logs.slice(-16_000);
  });

  const origin = `http://127.0.0.1:${port}`;
  try {
    await waitForHealth(origin);
  } catch (err) {
    if (child.exitCode == null) child.kill("SIGKILL");
    throw new Error(`${err.message}\nServer logs:\n${logs}`);
  }

  async function stop() {
    if (child.exitCode != null) return;
    await new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      child.once("exit", finish);
      child.kill("SIGTERM");
      setTimeout(() => {
        if (child.exitCode == null) child.kill("SIGKILL");
      }, 1500);
      setTimeout(finish, 3000);
    });
  }

  return { origin, stop, logs: () => logs };
}

module.exports = {
  ROOT_DIR,
  absPath,
  fileExists,
  readUtf8,
  lineCount,
  resolveBaseUrl,
  resetServer,
  startStandaloneServer,
};
