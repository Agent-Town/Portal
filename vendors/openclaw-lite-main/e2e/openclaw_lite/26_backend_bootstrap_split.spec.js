const { test, expect } = require("@playwright/test");

const { fileExists, lineCount } = require("./helpers/backend_modularity");

test.describe("M24: backend bootstrap split", () => {
  test("app factory exists, index budget is reduced, health endpoint parity holds", async ({ request }) => {
    expect(fileExists("server", "app.js")).toBeTruthy();
    expect(lineCount("server", "index.js")).toBeLessThanOrEqual(1700);

    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json?.ok).toBe(true);
  });
});
