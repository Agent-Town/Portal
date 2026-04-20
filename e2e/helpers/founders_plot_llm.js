const FOUNDERS_PLOT_FOREMAN_SELECTION_TOOL_NAME = 'founders_plot_foreman_select_candidate';

function ssePayload(chunks) {
  return chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n';
}

function makeToolChunks({ id, model, name, args = {}, callId }) {
  const created = Math.floor(Date.now() / 1000);
  return [
    {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{
        index: 0,
        delta: {
          role: 'assistant',
          tool_calls: [{
            index: 0,
            id: callId,
            type: 'function',
            function: {
              name: String(name || ''),
              arguments: JSON.stringify(args || {})
            }
          }]
        },
        finish_reason: null
      }]
    },
    {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }]
    }
  ];
}

function makeTextChunks({ id, model, text }) {
  const created = Math.floor(Date.now() / 1000);
  return [
    {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{
        index: 0,
        delta: { role: 'assistant', content: String(text || 'done') },
        finish_reason: null
      }]
    },
    {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
    }
  ];
}

async function mockFoundersPlotForemanSelection(page, { candidateId, reason = '' } = {}) {
  const llmRequests = [];
  const routeUrl = '**/api/llm/openai/v1/chat/completions';
  try {
    await page.unroute(routeUrl);
  } catch {
    // no-op
  }
  let requestCount = 0;
  await page.route(routeUrl, async (route, req) => {
    requestCount += 1;
    let parsed = null;
    try {
      parsed = JSON.parse(req.postData() || '{}');
    } catch {
      parsed = null;
    }
    llmRequests.push(parsed);
    const id = `chatcmpl_founders_foreman_${requestCount}`;
    const model = String(parsed?.model || 'deterministic');
    const isSelectionTurn = requestCount % 2 === 1;
    const chunks = isSelectionTurn
      ? makeToolChunks({
        id,
        model,
        name: FOUNDERS_PLOT_FOREMAN_SELECTION_TOOL_NAME,
        args: {
          candidateId: String(candidateId || ''),
          reason: String(reason || '')
        },
        callId: `call_foreman_select_${requestCount}`
      })
      : makeTextChunks({
        id,
        model,
        text: String(reason || 'Clover picked the safest available routine.')
      });
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream; charset=utf-8' },
      body: ssePayload(chunks)
    });
  });
  return { routeUrl, llmRequests };
}

module.exports = {
  FOUNDERS_PLOT_FOREMAN_SELECTION_TOOL_NAME,
  mockFoundersPlotForemanSelection
};
