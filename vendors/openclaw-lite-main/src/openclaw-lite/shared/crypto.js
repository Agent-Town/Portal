import { bytesToB64, utf8ToBytes } from "./encoding.js";

export function randomBytes(len) {
  const out = new Uint8Array(len);
  crypto.getRandomValues(out);
  return out;
}

export async function sha256(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(digest);
}

export async function hkdfSha256(ikmBytes, infoStr, lenBytes = 32) {
  const info = utf8ToBytes(infoStr);
  const salt = new Uint8Array([]);
  const baseKey = await crypto.subtle.importKey("raw", ikmBytes, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    baseKey,
    lenBytes * 8,
  );
  return new Uint8Array(bits);
}

export async function aesGcmEncryptRaw(keyBytes32, plaintextBytes, aadBytes) {
  const iv = randomBytes(12);
  const key = await crypto.subtle.importKey("raw", keyBytes32, { name: "AES-GCM" }, false, ["encrypt"]);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aadBytes || new Uint8Array([]) },
    key,
    plaintextBytes,
  );
  return { iv, ct: new Uint8Array(ct) };
}

export async function aesGcmDecryptRaw(keyBytes32, ivBytes, ctBytes, aadBytes) {
  const key = await crypto.subtle.importKey("raw", keyBytes32, { name: "AES-GCM" }, false, ["decrypt"]);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes, additionalData: aadBytes || new Uint8Array([]) },
    key,
    ctBytes,
  );
  return new Uint8Array(pt);
}

export async function importAesGcmKey(keyBytes32, usage) {
  return await crypto.subtle.importKey("raw", keyBytes32, { name: "AES-GCM" }, false, usage);
}

export async function importHmacSha256Key(keyBytes, usage) {
  return await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, usage);
}

export async function hmacSha256B64(key, messageStr) {
  const sig = await crypto.subtle.sign("HMAC", key, utf8ToBytes(messageStr));
  return bytesToB64(new Uint8Array(sig));
}

export async function sha256B64FromUtf8(str) {
  const digest = await sha256(utf8ToBytes(str || ""));
  return bytesToB64(digest);
}

