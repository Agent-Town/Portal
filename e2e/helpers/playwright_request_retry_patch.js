const path = require('path');

const { APIRequestContext } = require(path.join(
  __dirname,
  '..',
  '..',
  'node_modules',
  'playwright-core',
  'lib',
  'client',
  'fetch.js'
));

if (!global.__agentTownPlaywrightRequestRetryPatchApplied) {
  global.__agentTownPlaywrightRequestRetryPatchApplied = true;

  const originalFetch = APIRequestContext.prototype.fetch;

  APIRequestContext.prototype.fetch = async function patchedFetch(urlOrRequest, options) {
    const maxAttempts = 4;
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await originalFetch.call(this, urlOrRequest, options);
      } catch (err) {
        lastError = err;
        const message = String(err && err.message ? err.message : err || '');
        const transientRefusal = (
          message.includes('ECONNREFUSED')
          || message.includes('ECONNRESET')
        );
        if (!transientRefusal || attempt >= maxAttempts) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 75 * attempt));
      }
    }
    throw lastError || new Error('PLAYWRIGHT_REQUEST_RETRY_FAILED');
  };
}
