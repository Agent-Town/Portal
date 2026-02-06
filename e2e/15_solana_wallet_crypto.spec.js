const { test, expect } = require('@playwright/test');

const {
  addressFromSecretKey,
  generateSolanaWallet,
  isValidAddress,
  isValidSecretKey
} = require('./helpers/solana_wallet');

test('derives known Solana address from secret key', () => {
  const key = '2Ana1pUpv2ZbMVkwF5FXapYeBEjdxDatLn7nvJkhgTSdZd8hbDHTd21as7EAsg7ypityqfsw2pMQKJcVDVcAEsd';
  const expected = '9C6hybhQ6Aycep9jaUnP6uL9ZYvDjUp1aSkFWPUFJtpj';
  expect(addressFromSecretKey(key)).toBe(expected);
});

test('generated Solana wallet has valid secret key and address', () => {
  const wallet = generateSolanaWallet();
  expect(isValidSecretKey(wallet.secretKey)).toBeTruthy();
  expect(isValidAddress(wallet.address)).toBeTruthy();
  expect(addressFromSecretKey(wallet.secretKey)).toBe(wallet.address);
});
