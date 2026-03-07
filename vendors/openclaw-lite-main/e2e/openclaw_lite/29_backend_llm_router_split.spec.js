const { test, expect } = require("@playwright/test");

const { fileExists, lineCount, readUtf8, resetServer } = require("./helpers/backend_modularity");

test.describe("M27: llm router extraction", () => {
  test("llm router exists, index no longer embeds openai proxy, test-mode behavior is preserved", async ({ request }) => {
    await resetServer(request);

    expect(fileExists("server", "routes", "llm.js")).toBeTruthy();
    expect(lineCount("server", "index.js")).toBeLessThanOrEqual(950);

    const indexSource = readUtf8("server", "index.js");
    expect(indexSource.includes("proxyToOpenAI")).toBeFalsy();

    const chatRes = await request.post("/api/llm/openai/v1/chat/completions", {
      data: {
        model: "test-model",
        stream: true,
        messages: [{ role: "user", content: "hello" }],
      },
    });
    expect(chatRes.status()).toBe(200);
    expect((chatRes.headers()["content-type"] || "").includes("text/event-stream")).toBeTruthy();
    const sseText = await chatRes.text();
    expect(sseText.includes("data: [DONE]")).toBeTruthy();

    const responsesRes = await request.post("/api/llm/openai/v1/responses", {
      data: { model: "test-model", input: "hello" },
    });
    expect(responsesRes.status()).toBe(501);
    const responsesBody = await responsesRes.json();
    expect(responsesBody?.error).toBe("TEST_RESPONSES_NOT_IMPLEMENTED");
  });
});
