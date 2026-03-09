import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const researchRoot = __dirname;
const repoRoot = path.resolve(researchRoot, "..", "..");
const artifactsDir = path.join(researchRoot, "artifacts");
const resultsPath = path.join(researchRoot, "results.tsv");
const header = "commit\tloss\tstatus\thard_failures\tconsole_errors\tpage_errors\trequest_failures\tdescription\n";

await fs.mkdir(artifactsDir, { recursive: true });

let createdResults = false;
try {
  await fs.access(resultsPath);
} catch {
  await fs.writeFile(resultsPath, header, "utf8");
  createdResults = true;
}

let playwrightInstalled = true;
let browserExecutable = "";
let browserReady = false;
let playwrightError = "";

try {
  const mod = await import("@playwright/test");
  browserExecutable = String(mod?.chromium?.executablePath?.() || "");
  if (browserExecutable) {
    await fs.access(browserExecutable);
    browserReady = true;
  }
} catch (error) {
  playwrightInstalled = false;
  playwrightError = error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

console.log("---");
console.log(`repo_root:            ${repoRoot}`);
console.log(`artifacts_dir:        research/portal/artifacts`);
console.log(`results_path:         research/portal/results.tsv`);
console.log(`results_initialized:  ${createdResults ? "yes" : "no"}`);
console.log(`playwright_installed: ${playwrightInstalled ? "yes" : "no"}`);
console.log(`browser_ready:        ${browserReady ? "yes" : "no"}`);
if (browserExecutable) {
  console.log(`browser_executable:   ${browserExecutable}`);
}
if (playwrightError) {
  console.log(`playwright_error:     ${playwrightError}`);
}
if (!playwrightInstalled || !browserReady) {
  console.log("next_step:            npm install && npx playwright install chromium");
} else {
  console.log("next_step:            npm run research:portal:eval");
}
