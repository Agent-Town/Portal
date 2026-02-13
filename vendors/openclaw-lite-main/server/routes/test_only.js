const crypto = require("crypto");
const { ethers } = require("ethers");

const { randomHex } = require("../util");
const { writeStore } = require("../store");

// --- Test wallet helpers (no mocks) ---
//
// E2E runs in isolated browser contexts that can't share extension wallets.
// Instead of injecting "mock wallets", we provision a deterministic Ed25519
// keypair from a test seed so that signatures are real and verifiable.
function base58Encode(bytes) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let x = BigInt("0x" + Buffer.from(bytes).toString("hex"));
  let out = "";
  while (x > 0n) {
    const mod = x % 58n;
    out = alphabet[Number(mod)] + out;
    x = x / 58n;
  }
  // leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out = "1" + out;
  return out || "1";
}

function deriveEd25519PublicKeyBytesFromSeed(seedBytes) {
  // PKCS8: 302e020100300506032b657004220420 || seed(32)
  const pkcs8 = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(seedBytes)]);
  const priv = crypto.createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const pub = crypto.createPublicKey(priv);
  const spki = pub.export({ format: "der", type: "spki" });
  // SPKI: 302a300506032b6570032100 || pubKey(32)
  return new Uint8Array(Buffer.from(spki).slice(-32));
}

function registerTestOnlyRoutes(app, { resetAllSessions, getLlmStats, resetLlmStats }) {
  if (process.env.NODE_ENV !== "test") return;

  let agentTownTrace = [];
  let moltbookTrace = [];
  let moltbookApiKey = null;
  let soloTrace = [];
  let testWalletSeedHex = null;
  let testWalletAddress = null;
  let testEvmWallet = null;

  function getTestWalletSeedHex() {
    if (testWalletSeedHex) return testWalletSeedHex;
    const envHex = typeof process.env.TEST_WALLET_SEED_HEX === "string" ? process.env.TEST_WALLET_SEED_HEX.trim() : "";
    if (envHex && /^[0-9a-fA-F]{64}$/.test(envHex)) {
      testWalletSeedHex = envHex.toLowerCase();
      return testWalletSeedHex;
    }
    // Fallback: random but stable for the lifetime of the test server process.
    testWalletSeedHex = crypto.randomBytes(32).toString("hex");
    return testWalletSeedHex;
  }

  function getTestWalletAddress() {
    if (testWalletAddress) return testWalletAddress;
    const seedHex = getTestWalletSeedHex();
    const seedBytes = Buffer.from(seedHex, "hex");
    const pubKeyBytes = deriveEd25519PublicKeyBytesFromSeed(seedBytes);
    testWalletAddress = base58Encode(pubKeyBytes);
    return testWalletAddress;
  }

  function getTestEvmWallet() {
    if (testEvmWallet) return testEvmWallet;
    const envPk = typeof process.env.TEST_EVM_PRIVATE_KEY === "string" ? process.env.TEST_EVM_PRIVATE_KEY.trim() : "";
    let pk = envPk;
    if (!pk || !/^(0x)?[0-9a-fA-F]{64}$/.test(pk)) {
      pk = "0x59c6995e998f97a5a0044966f0945381d1d0e6f94f7f8f6fe1d9a8f8a9f2f9d3";
    }
    if (!pk.startsWith("0x")) pk = `0x${pk}`;
    testEvmWallet = new ethers.Wallet(pk);
    return testEvmWallet;
  }

  function getTestEvmAddress() {
    const wallet = getTestEvmWallet();
    return wallet ? wallet.address : null;
  }

  app.get("/__test__/env", (_req, res) => {
    res.json({ ok: true, env: "test" });
  });

  app.get("/__test__/web-fetch/doc/:name", (req, res) => {
    const name = typeof req.params?.name === "string" ? req.params.name.trim().toLowerCase() : "";
    if (!name) return res.status(400).type("text/plain").send("missing name");
    if (name === "same") {
      return res
        .status(200)
        .set("content-type", "text/plain; charset=utf-8")
        .set("etag", '"same-doc-v1"')
        .set("last-modified", "Mon, 01 Jan 2024 00:00:00 GMT")
        .send("Same Origin Fixture: OpenClaw Lite web_fetch deterministic doc.");
    }
    if (name === "blocked") {
      return res
        .status(200)
        .set("content-type", "text/plain; charset=utf-8")
        .send("Localhost fixture document (should be blocked when fetched via proxy).");
    }
    return res.status(404).type("text/plain").send("not found");
  });

  app.post("/__test__/http/echo-json", (req, res) => {
    res.status(200).json({
      ok: true,
      method: "POST",
      echo: req.body || {},
      contentType: req.header("content-type") || "",
    });
  });

  app.get("/__test__/http/large-text", (_req, res) => {
    const text = [
      "OpenClaw Lite http_request large fixture.",
      "This response is intentionally long for truncation checks.",
      "abcdefghijklmnopqrstuvwxyz0123456789",
    ].join(" ");
    res.status(200).type("text/plain; charset=utf-8").send(text);
  });

  app.get("/__test__/http/auth-echo", (req, res) => {
    const auth = req.header("authorization") || null;
    res.status(200).json({
      ok: true,
      receivedAuthorization: auth,
    });
  });

  app.get("/__test__/agenttown/connect", (_req, res) => {
    agentTownTrace.push("connect");
    res.json({ ok: true, sessionId: "at_session_1" });
  });

  app.get("/__test__/agenttown/poll", (_req, res) => {
    agentTownTrace.push("poll");
    res.json({ ok: true, lobbies: [{ id: "lobby-1", name: "Main Lobby" }] });
  });

  app.post("/__test__/agenttown/select", (req, res) => {
    agentTownTrace.push("select");
    const target = typeof req.body?.target === "string" ? req.body.target : "lobby-1";
    res.json({ ok: true, selected: target });
  });

  app.post("/__test__/agenttown/open", (req, res) => {
    agentTownTrace.push("open");
    const target = typeof req.body?.target === "string" ? req.body.target : "lobby-1";
    res.json({ ok: true, opened: target });
  });

  app.get("/__test__/agenttown/trace", (_req, res) => {
    res.json({ ok: true, trace: agentTownTrace.slice() });
  });

  app.post("/__test__/moltbook/register", (_req, res) => {
    const token = `mb_tok_${randomHex(8)}`;
    moltbookApiKey = token;
    moltbookTrace.push("register");
    res.json({ ok: true, apiKey: token, userId: "mb_user_1" });
  });

  app.get("/__test__/moltbook/feed", (req, res) => {
    const auth = req.header("authorization") || "";
    if (!moltbookApiKey || auth !== `Bearer ${moltbookApiKey}`) {
      return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    }
    moltbookTrace.push("feed");
    res.json({ ok: true, items: [{ id: "post_1", text: "Welcome to Moltbook" }] });
  });

  app.post("/__test__/moltbook/post", (req, res) => {
    const auth = req.header("authorization") || "";
    if (!moltbookApiKey || auth !== `Bearer ${moltbookApiKey}`) {
      return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    }
    const text = typeof req.body?.text === "string" ? req.body.text : "";
    moltbookTrace.push("post");
    res.json({ ok: true, postId: `post_${randomHex(4)}`, text });
  });

  app.get("/__test__/moltbook/trace", (_req, res) => {
    res.json({ ok: true, trace: moltbookTrace.slice() });
  });

  app.post("/__test__/solo/session/create", (_req, res) => {
    soloTrace.push("session.create");
    res.json({ ok: true, sessionId: `solo_${randomHex(6)}` });
  });

  app.post("/__test__/solo/paint", (req, res) => {
    soloTrace.push("paint");
    const confidence = typeof req.body?.confidence === "number" ? req.body.confidence : 0;
    res.json({ ok: true, accepted: confidence >= 0.8 });
  });

  app.post("/__test__/solo/commit", (req, res) => {
    soloTrace.push("commit");
    const commit = typeof req.body?.commit === "string" ? req.body.commit : "";
    res.json({ ok: true, commit });
  });

  app.post("/__test__/solo/reveal", (req, res) => {
    soloTrace.push("reveal");
    const reveal = typeof req.body?.reveal === "string" ? req.body.reveal : "";
    res.json({ ok: true, reveal });
  });

  app.get("/__test__/solo/trace", (_req, res) => {
    res.json({ ok: true, trace: soloTrace.slice() });
  });

  app.get("/__test__/webmcp/discover", (_req, res) => {
    res.json({
      ok: true,
      tools: [
        {
          name: "fixture.echo",
          description: "Echoes text input.",
          inputSchema: {
            type: "object",
            properties: { text: { type: "string" } },
            required: ["text"],
          },
        },
      ],
    });
  });

  app.post("/__test__/webmcp/call", (req, res) => {
    const tool = typeof req.body?.tool === "string" ? req.body.tool.trim() : "";
    const args = req.body?.args && typeof req.body.args === "object" ? req.body.args : {};
    if (tool !== "fixture.echo") return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    const text = typeof args.text === "string" ? args.text : "";
    res.json({ ok: true, result: { text } });
  });

  app.get("/__test__/wallet/seed", (_req, res) => {
    const seedHex = getTestWalletSeedHex();
    const address = getTestWalletAddress();
    if (!seedHex || !address) return res.status(500).json({ ok: false, error: "TEST_WALLET_NOT_AVAILABLE" });
    res.json({ ok: true, seedHex, address });
  });

  app.get("/__test__/evm/wallet", (_req, res) => {
    const address = getTestEvmAddress();
    if (!address) return res.status(500).json({ ok: false, error: "TEST_EVM_WALLET_NOT_AVAILABLE" });
    res.json({ ok: true, address });
  });

  app.post("/__test__/evm/sign", async (req, res) => {
    const wallet = getTestEvmWallet();
    if (!wallet) return res.status(500).json({ ok: false, error: "TEST_EVM_WALLET_NOT_AVAILABLE" });
    const message = typeof req.body?.message === "string" ? req.body.message : "";
    if (!message) return res.status(400).json({ ok: false, error: "MISSING_MESSAGE" });
    try {
      const signatureHex = await wallet.signMessage(message);
      res.json({ ok: true, address: wallet.address, signatureHex });
    } catch {
      res.status(500).json({ ok: false, error: "EVM_SIGN_FAILED" });
    }
  });

  app.get("/__test__/llm/stats", (_req, res) => {
    res.json({ ok: true, ...getLlmStats() });
  });

  app.post("/__test__/reset", (_req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    const header = _req.header("x-test-reset");
    if (header !== token) return res.status(403).json({ ok: false, error: "FORBIDDEN" });

    writeStore({
      signups: [],
      shares: [],
      publicTeams: [],
      houses: [],
      anchors: [],
      inbox: [],
      vaultBackups: [],
      vaultPointers: [],
      publicProfiles: [],
    });
    resetAllSessions();
    resetLlmStats();
    agentTownTrace = [];
    moltbookTrace = [];
    moltbookApiKey = null;
    soloTrace = [];
    res.json({ ok: true });
  });
}

module.exports = { registerTestOnlyRoutes };
