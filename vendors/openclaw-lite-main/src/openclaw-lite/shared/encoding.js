export function bytesToB64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function b64ToBytes(str) {
  const bin = atob(String(str || ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export function utf8ToBytes(str) {
  return new TextEncoder().encode(String(str ?? ""));
}

export function bytesToUtf8(bytes) {
  return new TextDecoder().decode(bytes);
}

