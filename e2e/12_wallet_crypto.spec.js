const { test, expect } = require('@playwright/test');

const {
  addressFromPrivateKey,
  generateEvmWallet,
  isValidAddress,
  isValidPrivateKey
} = require('./helpers/sepolia_wallet');

test('derives known EVM address from private key', () => {
  // Hardhat default account #0
  const key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const expected = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
  expect(addressFromPrivateKey(key)).toBe(expected);
});

test('generated wallet has valid private key and address', () => {
  const wallet = generateEvmWallet();
  expect(isValidPrivateKey(wallet.privateKey)).toBeTruthy();
  expect(isValidAddress(wallet.address)).toBeTruthy();
  expect(addressFromPrivateKey(wallet.privateKey)).toBe(wallet.address);
});
