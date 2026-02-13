const { test, expect } = require("@playwright/test");

const { fileExists, lineCount, readUtf8, resetServer } = require("./helpers/backend_modularity");

test.describe("M25: session isolation", () => {
  test("session module exists and cookie-backed session behavior is preserved", async ({ request }) => {
    await resetServer(request);

    expect(fileExists("server", "session.js")).toBeTruthy();
    expect(lineCount("server", "index.js")).toBeLessThanOrEqual(1450);

    const indexSource = readUtf8("server", "index.js");
    expect(indexSource.includes("sessionsById")).toBeFalsy();

    const nonceRes = await request.get("/api/wallet/nonce");
    expect(nonceRes.status()).toBe(200);
    const nonceBody = await nonceRes.json();
    expect(nonceBody?.ok).toBe(true);
    expect(typeof nonceBody?.nonce).toBe("string");

    const setCookieHeader = nonceRes.headers()["set-cookie"] || "";
    expect(setCookieHeader.includes("et_session=")).toBeTruthy();

    const walletRes = await request.get("/__test__/wallet/seed");
    expect(walletRes.status()).toBe(200);
    const wallet = await walletRes.json();
    expect(wallet?.ok).toBe(true);

    const lookupRes = await request.post("/api/wallet/lookup", {
      data: {
        address: wallet.address,
        chain: "solana",
        nonce: nonceBody.nonce,
        signature: "ZmFrZQ==", // invalid, but should hit signature verification not nonce mismatch
      },
    });
    expect(lookupRes.status()).toBe(401);
    const lookupBody = await lookupRes.json();
    expect(lookupBody?.error).toBe("BAD_SIGNATURE");
  });
});
