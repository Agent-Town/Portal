const crypto = require("crypto");
const { test, expect } = require("@playwright/test");

const { fileExists, lineCount, readUtf8, resetServer } = require("./helpers/backend_modularity");

function sha256Base64(input) {
  return crypto.createHash("sha256").update(input).digest("base64");
}

function makeHouseAuth({ houseId, authKeyB64, method, path, body = "" }) {
  const ts = String(Date.now());
  const key = Buffer.from(authKeyB64, "base64");
  const bodyHash = sha256Base64(body);
  const msg = `${houseId}.${ts}.${String(method).toUpperCase()}.${path}.${bodyHash}`;
  const sig = crypto.createHmac("sha256", key).update(msg).digest("base64");
  return { ts, sig };
}

test.describe("M28: house/wallet route extraction", () => {
  test("house router exists, index is slim, house/wallet behavior parity is preserved", async ({ request }) => {
    await resetServer(request);

    expect(fileExists("server", "routes", "house.js")).toBeTruthy();
    expect(lineCount("server", "index.js")).toBeLessThanOrEqual(700);

    const indexSource = readUtf8("server", "index.js");
    expect(indexSource.includes("verifyHouseAuth")).toBeFalsy();
    expect(indexSource.includes("/api/wallet/lookup")).toBeFalsy();

    const nonceRes = await request.get("/api/house/nonce");
    expect(nonceRes.status()).toBe(200);
    const nonce = (await nonceRes.json()).nonce;
    expect(typeof nonce).toBe("string");

    const houseId = "house_test_modularity";
    const houseAuthKey = Buffer.from("0123456789abcdef", "utf8").toString("base64");
    const initRes = await request.post("/api/house/init", {
      data: {
        houseId,
        housePubKey: houseId,
        nonce,
        keyMode: "ceremony",
        houseAuthKey,
      },
    });
    expect(initRes.status()).toBe(200);
    const initBody = await initRes.json();
    expect(initBody?.ok).toBe(true);
    expect(initBody?.houseId).toBe(houseId);

    const metaPath = `/api/house/${houseId}/meta`;
    const auth = makeHouseAuth({
      houseId,
      authKeyB64: houseAuthKey,
      method: "GET",
      path: metaPath,
      body: "",
    });
    const metaRes = await request.get(metaPath, {
      headers: {
        "x-house-ts": auth.ts,
        "x-house-auth": auth.sig,
      },
    });
    expect(metaRes.status()).toBe(200);
    const meta = await metaRes.json();
    expect(meta?.ok).toBe(true);
    expect(meta?.houseId).toBe(houseId);

    const walletNonce = await request.get("/api/wallet/nonce");
    expect(walletNonce.status()).toBe(200);

    const badLookup = await request.post("/api/wallet/lookup", { data: {} });
    expect(badLookup.status()).toBe(400);
    const badLookupBody = await badLookup.json();
    expect(badLookupBody?.error).toBe("MISSING_ADDRESS");
  });
});
