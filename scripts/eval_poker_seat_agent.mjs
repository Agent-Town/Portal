import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { scorePokerSeatAgentCorpus } from "../vendors/openclaw-lite-main/src/openclaw-lite/shared/poker-seat-agent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const corpusPath = path.join(__dirname, "poker_seat_agent_benchmark.json");

const raw = await fs.readFile(corpusPath, "utf8");
const corpus = JSON.parse(raw);
const summary = scorePokerSeatAgentCorpus(corpus);

const result = {
  evalVersion: "poker-seat-agent-eval-v1",
  corpusId: "poker_worker_agent_eval_seed",
  generatedAt: new Date().toISOString(),
  metrics: {
    legalActionCompliance: summary.legalActionCompliance,
    amountLegalityCompliance: summary.amountLegalityCompliance,
    schemaValidity: summary.schemaValidity,
    easySpotAgreement: summary.easySpotAgreement,
    mediumSpotNonBlunderRate: summary.mediumSpotNonBlunderRate,
    medianLatencyMs: summary.medianLatencyMs,
  },
  cases: summary.cases,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

if (
  summary.legalActionCompliance < 1
  || summary.amountLegalityCompliance < 1
  || summary.schemaValidity < 1
  || summary.easySpotAgreement < 0.8
  || summary.mediumSpotNonBlunderRate < 0.9
) {
  process.exitCode = 1;
}
