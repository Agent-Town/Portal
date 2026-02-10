/**
 * Pony Express v0 ports (host-provided dependencies).
 *
 * This file is documentation (no runtime imports) so the module can be lifted
 * into other apps with minimal friction.
 */

/**
 * @typedef {Object} PonyStorePort
 * @property {(msg: any) => void} insertMsg
 * @property {(toHouseId: string) => any[]} listInbox
 * @property {(id: string) => any | null} getMsgById
 * @property {(id: string, status: 'request' | 'accepted' | 'rejected') => boolean} setMsgStatus
 */

/**
 * @typedef {Object} AddressBookPort
 * @property {(toHouseId: string) => boolean} destinationExists
 */

module.exports = {};

