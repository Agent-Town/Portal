const express = require('express');
const { makeInboxMsg, MAYOR_HOUSE_ID } = require('./service');

function createPonyRouter({ ponyStorePort, addressBookPort } = {}) {
  if (!ponyStorePort) throw new Error('PONY_STORE_PORT_REQUIRED');
  if (!addressBookPort) throw new Error('PONY_ADDRESS_BOOK_PORT_REQUIRED');

  const router = express.Router();

  router.post('/send', (req, res) => {
    const toHouseId = typeof req.body?.toHouseId === 'string' ? req.body.toHouseId.trim() : '';
    const fromHouseId = typeof req.body?.fromHouseId === 'string' ? req.body.fromHouseId.trim() : null;
    const body = typeof req.body?.body === 'string' ? req.body.body : '';

    if (!toHouseId) return res.status(400).json({ ok: false, error: 'MISSING_TO' });
    if (!addressBookPort.destinationExists(toHouseId)) {
      return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });
    }

    const status = fromHouseId === MAYOR_HOUSE_ID ? 'accepted' : 'request';
    const msg = makeInboxMsg({ toHouseId, fromHouseId, body, status });
    ponyStorePort.insertMsg(msg);

    res.json({ ok: true, id: msg.id });
  });

  router.get('/inbox', (req, res) => {
    const houseId = typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

    const items = ponyStorePort.listInbox(houseId);
    res.json({ ok: true, inbox: items });
  });

  router.post('/inbox/:id/accept', (req, res) => {
    const id = req.params.id;
    const msg = ponyStorePort.getMsgById(id);
    if (!msg) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    ponyStorePort.setMsgStatus(id, 'accepted');
    res.json({ ok: true });
  });

  router.post('/inbox/:id/reject', (req, res) => {
    const id = req.params.id;
    const msg = ponyStorePort.getMsgById(id);
    if (!msg) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    ponyStorePort.setMsgStatus(id, 'rejected');
    res.json({ ok: true });
  });

  return router;
}

module.exports = { createPonyRouter };

