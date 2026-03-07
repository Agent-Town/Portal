const { WebSocketServer } = require("ws");

function attachTestWs(server) {
  if (process.env.NODE_ENV !== "test") return;

  const wsEchoServer = new WebSocketServer({ noServer: true });

  wsEchoServer.on("connection", (ws, req) => {
    let pathname = "";
    try {
      const base = `http://${req?.headers?.host || "localhost"}`;
      pathname = new URL(req?.url || "/", base).pathname;
    } catch {
      pathname = "";
    }

    ws.on("message", (data, isBinary) => {
      if (isBinary) {
        ws.send(data, { binary: true });
        return;
      }
      const text = Buffer.isBuffer(data) ? data.toString("utf8") : String(data || "");
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      if (pathname === "/__test__/experience/ws") {
        const files = parsed && parsed.files && typeof parsed.files === "object" ? parsed.files : {};
        const required = ["skill", "heartbeat", "goals", "tools", "penalty"];
        const receivedFiles = required.filter((k) => typeof files[k] === "string" && files[k].length > 0);
        const ok = parsed && parsed.type === "experience.run" && receivedFiles.length === required.length;
        ws.send(JSON.stringify({ ok, receivedFiles }));
        return;
      }

      if (parsed && parsed.jsonrpc === "2.0" && parsed.method === "ping") {
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: parsed.id ?? null,
            result: "pong",
          }),
        );
        return;
      }
      ws.send(text);
    });
  });

  server.on("upgrade", (req, socket, head) => {
    let pathname = "";
    try {
      const base = `http://${req.headers.host || "localhost"}`;
      pathname = new URL(req.url || "/", base).pathname;
    } catch {
      pathname = "";
    }
    if (pathname !== "/__test__/ws/echo" && pathname !== "/__test__/experience/ws") {
      socket.destroy();
      return;
    }
    wsEchoServer.handleUpgrade(req, socket, head, (ws) => {
      wsEchoServer.emit("connection", ws, req);
    });
  });
}

module.exports = { attachTestWs };
