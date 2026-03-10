function registerRegistryWebPokerTestRoutes(app, deps) {
  const {
    getRegistryWebPokerTestFixture,
    getRegistryWebPokerTestStats,
    listRegistryWebPokerFixtureFamilies,
  } = deps;

  app.get('/__test__/registry-web-poker/stats', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    return res.json({
      ok: true,
      stats: getRegistryWebPokerTestStats(),
    });
  });

  app.get('/__test__/registry-web-poker/fixtures', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    return res.json({
      ok: true,
      families: listRegistryWebPokerFixtureFamilies(),
    });
  });

  app.get('/__test__/registry-web-poker/fixtures/:family', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const fixture = getRegistryWebPokerTestFixture(req.params.family);
    if (!fixture) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.json({
      ok: true,
      family: String(req.params.family || '').trim(),
      fixture,
    });
  });
}

module.exports = {
  registerRegistryWebPokerTestRoutes,
};
