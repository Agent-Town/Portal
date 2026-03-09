const { resetToken } = require('./portal_web');

async function getStubEmailOtp(request, {
  email = '',
  provider = 'stub',
} = {}) {
  const response = await request.get(`/__test__/otp/email/latest?provider=${encodeURIComponent(String(provider || 'stub'))}&email=${encodeURIComponent(String(email || ''))}`, {
    headers: { 'x-test-reset': resetToken },
    failOnStatusCode: false,
  });
  const body = await response.json().catch(() => ({}));
  return {
    status: response.status(),
    body,
  };
}

async function consumeStubEmailOtp(request, {
  email = '',
  code = '',
  provider = 'stub',
} = {}) {
  const response = await request.post('/__test__/otp/email/consume', {
    headers: {
      'content-type': 'application/json',
      'x-test-reset': resetToken,
    },
    data: JSON.stringify({
      provider,
      email,
      code,
    }),
    failOnStatusCode: false,
  });
  const body = await response.json().catch(() => ({}));
  return {
    status: response.status(),
    body,
  };
}

async function getStubEmailOtpActivity(request, {
  email = '',
  provider = '',
} = {}) {
  const query = new URLSearchParams();
  if (provider) query.set('provider', String(provider));
  if (email) query.set('email', String(email));
  const response = await request.get(`/__test__/otp/email/activity?${query.toString()}`, {
    headers: { 'x-test-reset': resetToken },
    failOnStatusCode: false,
  });
  const body = await response.json().catch(() => ({}));
  return {
    status: response.status(),
    body,
  };
}

async function readWalletSnapshot(page) {
  return await page.evaluate(async () => {
    const client = typeof window.initWalletClient === 'function' ? window.initWalletClient() : null;
    if (!client || typeof client.connect !== 'function') {
      return {
        hasWalletClient: false,
        solana: null,
        evm: null,
      };
    }
    const connect = async (chain) => {
      try {
        const result = await client.connect({ chain, silent: false });
        return {
          ok: true,
          address: typeof result?.address === 'string' ? result.address : '',
        };
      } catch (err) {
        return {
          ok: false,
          error: String(err?.message || 'UNKNOWN_ERROR'),
        };
      }
    };
    return {
      hasWalletClient: true,
      solana: await connect('solana'),
      evm: await connect('evm'),
    };
  });
}

module.exports = {
  consumeStubEmailOtp,
  getStubEmailOtp,
  getStubEmailOtpActivity,
  readWalletSnapshot,
};
