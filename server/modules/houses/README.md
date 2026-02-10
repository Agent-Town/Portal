# Houses (server module)

Implements the server-side house APIs:

- House init: `POST /house/init`, `POST /agent/house/init`
- House nonce: `GET /house/nonce`
- Wallet recovery lookup: `GET /wallet/nonce`, `POST /wallet/lookup`
- House-authenticated endpoints: `GET /house/:id/meta`, `GET /house/:id/log`, `POST /house/:id/append`, etc.
- House-auth share endpoints: `POST /house/:id/share`, `POST /house/:id/posts`

Mount in the host app:
```js
app.use('/api', createHousesRouter(deps));
```

See `ports.js` for dependency requirements.

