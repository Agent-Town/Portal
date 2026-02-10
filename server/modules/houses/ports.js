/**
 * Houses module ports (host-provided dependencies).
 *
 * This file is documentation (no runtime imports).
 */

/**
 * @typedef {Object} HousesDeps
 * @property {(req: any, res: any) => any} ensureHumanSession
 * @property {(teamCode: string) => any | null} getSessionByTeamCode
 * @property {(houseId: string) => any | null} getSessionByHouseId
 * @property {(session: any, houseId: string) => void} indexHouseId
 * @property {() => any} readStore
 * @property {(store: any) => void} writeStore
 * @property {(address: string, message: string, signatureB64: string) => boolean} verifySolanaSignature
 * @property {(session: any, params?: any) => any} recordSignup
 * @property {(url: any) => string | null} sanitizeUrl
 * @property {(url: any) => string | null} extractXHandle
 * @property {number} MAX_HOUSE_ENTRIES
 * @property {number} MAX_HOUSES
 * @property {number} MAX_SHARES
 * @property {number} MAX_SIGNUPS
 * @property {number} MIN_AGENT_SOLO_PIXELS
 * @property {number} HOUSE_AUTH_SKEW_MS
 * @property {number} MAX_PUBLIC_IMAGE_BYTES
 * @property {number} MAX_PUBLIC_PROMPT_CHARS
 */

module.exports = {};

