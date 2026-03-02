const { createApp } = require("./app");
const { attachTestWs } = require("./test_ws");

const app = createApp();
const port = Number(process.env.PORT || 4173);
const server = app.listen(port, () => {
  console.log(`[openclaw-lite] http://localhost:${port}`);
});

attachTestWs(server);

module.exports = { app, server };
