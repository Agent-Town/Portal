# Pony Express v0 (server module)

This module implements the v0 inbox API:
- `POST /send`
- `GET /inbox?houseId=...`
- `POST /inbox/:id/accept`
- `POST /inbox/:id/reject`

The host app mounts it at `/api/pony`:
```js
app.use('/api/pony', createPonyRouter({ ponyStorePort, addressBookPort }));
```

## Dependencies (ports)

The host must provide:
- `ponyStorePort` (insert/list/get/setStatus)
- `addressBookPort` (destinationExists)

See `ports.js` for the exact shape.

