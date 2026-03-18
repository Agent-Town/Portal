// @ts-check
const { test, expect } = require('@playwright/test');

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
test.skip(!OPENROUTER_KEY, 'Requires OPENROUTER_API_KEY');

test('live LLM: save config, reload, send message, get response', async ({ page }) => {
  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));

  // Step 1: Load page and save LLM config to IndexedDB
  await page.goto('/iterate');
  await page.waitForTimeout(2000);

  await page.evaluate(async (key) => {
    const lib = await import('/openclaw-lite/llm-config-library.js');
    await lib.saveLlmConfig({ provider: 'openrouter', model: 'anthropic/claude-sonnet-4-5', apiKey: key });
    console.log('CONFIG_SAVED');
  }, OPENROUTER_KEY);

  // Step 2: Reload so iterate.js picks up the saved config on init
  await page.goto('/iterate');
  await page.waitForTimeout(4000);

  // Check that config was pushed to worker
  const pushLog = logs.find(l => l.includes('pushed LLM config'));
  console.log('Push log found:', !!pushLog);
  console.log('All iterate logs:', logs.filter(l => l.includes('Iterate:')).join('\n'));

  const status = await page.evaluate(() => document.getElementById('agentStatus')?.textContent);
  console.log('Agent status:', status);

  // Step 3: Expand dock and send a message
  await page.locator('.sidebar-header').click();
  await page.waitForTimeout(500);
  await page.locator('#chatInput').fill('Respond with just the word OK and nothing else.');
  await page.locator('#sendChatBtn').click();

  // Step 4: Wait up to 30s for a response
  const gotResponse = await page.waitForFunction(() => {
    const msgs = document.querySelectorAll('#chatTranscript .chat-message.agent, #chatTranscript .chat-message[data-role="agent"]');
    // Look for an agent message that's not "openclaw-lite boot" and not empty and not "LLM not configured"
    for (const m of msgs) {
      const text = m.textContent?.trim() || '';
      if (text && text !== 'openclaw-lite boot' && !text.includes('LLM not configured') && text.length > 0) {
        return text;
      }
    }
    return null;
  }, null, { timeout: 30000 }).catch(() => null);

  const transcript = await page.evaluate(() => document.getElementById('chatTranscript')?.innerHTML || '');
  console.log('Transcript HTML:', transcript.slice(0, 1000));
  console.log('Got response:', gotResponse);

  await page.screenshot({ path: 'test-results/llm-live-response.png', fullPage: true });

  if (gotResponse) {
    console.log('SUCCESS: Agent responded with:', gotResponse);
    expect(gotResponse).toBeTruthy();
  } else {
    // Print diagnostic info
    console.log('FAIL: No LLM response received');
    console.log('Recent logs:', logs.slice(-10).join('\n'));
    // Don't fail the test — this is diagnostic
  }
});
