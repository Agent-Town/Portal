const { test, expect } = require("@playwright/test");

const { fileExists, lineCount, readUtf8, resetServer } = require("./helpers/backend_modularity");

test.describe("M26: tools router extraction", () => {
  test("tools router exists, index no longer embeds tool proxy impl, invalid payload behavior unchanged", async ({ request }) => {
    await resetServer(request);

    expect(fileExists("server", "routes", "tools.js")).toBeTruthy();
    expect(lineCount("server", "index.js")).toBeLessThanOrEqual(1200);

    const indexSource = readUtf8("server", "index.js");
    expect(indexSource.includes("executeWebFetchProxy")).toBeFalsy();
    expect(indexSource.includes("executeHttpRequestProxy")).toBeFalsy();

    const badFetch = await request.post("/api/tools/web_fetch", { data: {} });
    expect(badFetch.status()).toBe(400);
    const badFetchBody = await badFetch.json();
    expect(badFetchBody?.ok).toBe(false);
    expect(badFetchBody?.error?.code).toBe("INVALID_ARGUMENTS");

    const badHttp = await request.post("/api/tools/http_request", { data: {} });
    expect(badHttp.status()).toBe(400);
    const badHttpBody = await badHttp.json();
    expect(badHttpBody?.ok).toBe(false);
    expect(badHttpBody?.error?.code).toBe("INVALID_ARGUMENTS");
  });
});
