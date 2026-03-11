const { test, expect } = require('@playwright/test');

const {
  EMAIL_OTP_PROVIDER_REQUIREMENT,
  buildEmailOtpFetchUrl,
  extractLiveEmailOtpCodeFromSource,
  getLiveEmailOtpConfig,
  inspectLiveEmailOtpEnv,
} = require('../server/live_email_otp');

test('live email OTP provider contract supports http-json and IMAP-family env shapes deterministically', async () => {
  const missing = inspectLiveEmailOtpEnv({});
  expect(missing).toMatchObject({
    ok: false,
    provider: '',
    missing: ['PRIVY_EMAIL_OTP_PROVIDER', 'PRIVY_EMAIL_OTP_TEST_EMAIL'],
    mismatched: [],
  });

  const unsupported = inspectLiveEmailOtpEnv({
    PRIVY_EMAIL_OTP_PROVIDER: 'gmail-password',
    PRIVY_EMAIL_OTP_TEST_EMAIL: 'elizatown.mail@gmail.com',
  });
  expect(unsupported).toMatchObject({
    ok: false,
    provider: 'gmail-password',
    missing: [],
    mismatched: [EMAIL_OTP_PROVIDER_REQUIREMENT],
  });

  const httpJson = inspectLiveEmailOtpEnv({
    PRIVY_EMAIL_OTP_PROVIDER: 'http-json',
    PRIVY_EMAIL_OTP_TEST_EMAIL: 'elizatown.mail@gmail.com',
    PRIVY_EMAIL_OTP_FETCH_URL: 'http://127.0.0.1:9999/otp?email={email}',
  });
  expect(httpJson).toMatchObject({
    ok: true,
    provider: 'http-json',
    missing: [],
    mismatched: [],
  });

  const imap = inspectLiveEmailOtpEnv({
    PRIVY_EMAIL_OTP_PROVIDER: 'imap',
    PRIVY_EMAIL_OTP_TEST_EMAIL: 'ops@example.com',
    PRIVY_EMAIL_OTP_IMAP_HOST: 'imap.example.com',
    PRIVY_EMAIL_OTP_IMAP_PASSWORD: 'secret',
  });
  expect(imap).toMatchObject({
    ok: true,
    provider: 'imap',
    missing: [],
    mismatched: [],
  });

  const gmailImap = inspectLiveEmailOtpEnv({
    PRIVY_EMAIL_OTP_PROVIDER: 'gmail-imap',
    PRIVY_EMAIL_OTP_TEST_EMAIL: 'elizatown.mail@gmail.com',
    PRIVY_EMAIL_OTP_IMAP_PASSWORD: 'app-password',
  });
  expect(gmailImap).toMatchObject({
    ok: true,
    provider: 'gmail-imap',
    missing: [],
    mismatched: [],
  });
});

test('live email OTP helper resolves default Gmail IMAP config and extracts one-time codes from raw messages', async () => {
  const config = getLiveEmailOtpConfig({
    PRIVY_EMAIL_OTP_PROVIDER: 'gmail-imap',
    PRIVY_EMAIL_OTP_TEST_EMAIL: 'elizatown.mail@gmail.com',
    PRIVY_EMAIL_OTP_IMAP_PASSWORD: 'app-password',
  });
  expect(config.provider).toBe('gmail-imap');
  expect(config.imap).toMatchObject({
    host: 'imap.gmail.com',
    user: 'elizatown.mail@gmail.com',
    mailbox: 'INBOX',
    secure: true,
  });

  const rawMessage = [
    'From: no-reply@privy.io',
    'To: elizatown.mail@gmail.com',
    'Subject: Privy login code',
    '',
    'Use verification code 654321 to finish your Privy sign in.',
  ].join('\r\n');
  expect(extractLiveEmailOtpCodeFromSource(rawMessage, { subjectHint: 'Privy' })).toBe('654321');
  expect(extractLiveEmailOtpCodeFromSource(rawMessage, { subjectHint: 'Different sender' })).toBe('');

  const fetchUrl = buildEmailOtpFetchUrl('http://127.0.0.1:9999/otp?email={email}', 'elizatown.mail@gmail.com');
  expect(fetchUrl).toContain('elizatown.mail%40gmail.com');
});
