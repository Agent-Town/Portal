# API contract (HTTP)

> MVP store + deterministic endpoints for **agent friendliness** and **Playwright testability**.

## Session identity

- Human identity is a session cookie: `et_session`.
- Agent identity is a **Team Code** shown to the human.

---

## Health

### GET `/api/health`
Returns `{ ok: true, time: ISO8601 }`.

---

## Home / state

### GET `/api/session` (human)
Returns the Team Code, the sigil list, and global counts.

Response shape:
```json
{
  "ok": true,
  "teamCode": "TEAM-ABCD-EFGH",
  "elements": [{"id": "cookie", "label": "Cookie"}],
  "stats": { "signups": 0, "publicTeams": 0 }
}
```

### GET `/api/state` (human)
Returns the full state needed for the UI.

---

## Match mechanic

### POST `/api/human/select`
Body:
```json
{ "elementId": "cookie" }
```

### POST `/api/agent/select`
Body:
```json
{ "teamCode": "TEAM-ABCD-EFGH", "elementId": "cookie" }
```

### POST `/api/agent/connect`
Body:
```json
{ "teamCode": "TEAM-ABCD-EFGH", "agentName": "OpenClaw" }
```

### GET `/api/agent/state?teamCode=TEAM-ABCD-EFGH`
Agent-friendly state snapshot.

---

## Beta press

### POST `/api/human/beta/press`
Body:
```json
{ "email": "you@domain.com" }
```

### POST `/api/agent/beta/press`
Body:
```json
{ "teamCode": "TEAM-ABCD-EFGH" }
```

Signup is recorded only when:
- `match.matched === true`
- **both** betaPressed are true
- email is valid

---

## Canvas

### GET `/api/canvas/state` (human)
Returns:
- `canvas: { w, h, pixels[] }`
- `palette: string[]` hex colors

### POST `/api/human/canvas/paint`
Body:
```json
{ "x": 0, "y": 0, "color": 1 }
```

### POST `/api/agent/canvas/paint`
Body:
```json
{ "teamCode": "TEAM-ABCD-EFGH", "x": 1, "y": 0, "color": 2 }
```

---

## Share

### POST `/api/share/create` (human)
Requires signup complete.
Requires non-empty canvas and both post links (human + agent).
Creates a locked share snapshot (canvas + links are frozen).
Returns `EMPTY_CANVAS` if no pixels are painted.
Returns `POSTS_REQUIRED` if either post link is missing.

Response:
```json
{ "ok": true, "shareId": "sh_...", "sharePath": "/s/sh_...", "managePath": "/share/sh_..." }
```

### GET `/api/share/:id`
Returns share snapshot + palette.
Share includes `locked` boolean.

### GET `/api/agent/share/instructions?teamCode=...`
Returns suggested post text and the `sharePath`.

---

## Posts

### POST `/api/human/posts`
Body:
```json
{ "xPostUrl": "https://x.com/..." }
```
Optional (when calling from a fresh session on `/s/:id`):
```json
{ "shareId": "sh_...", "xPostUrl": "https://x.com/..." }
```
Can be called before a share is created; values are stored on the session and applied when the share is created.
Returns `HANDLE_TAKEN` if the X handle is already used by another team.
Returns `LOCKED` if the share is already locked.

### POST `/api/agent/posts`
Body:
```json
{ "teamCode": "TEAM-ABCD-EFGH", "moltbookUrl": "https://...", "moltXUrl": "https://..." }
```
Can be called before a share is created; values are stored on the session and applied when the share is created.
Returns `LOCKED` if the share is already locked.

---

## Wall opt-in

### POST `/api/human/optin`
Body:
```json
{ "appear": true }
```
Optional (when calling from a fresh session on `/s/:id`):
```json
{ "shareId": "sh_...", "appear": true }
```

### POST `/api/agent/optin`
Body:
```json
{ "teamCode": "TEAM-ABCD-EFGH", "appear": true }
```

Only if both are `true` is a record added to the wall.

### GET `/api/wall`
Returns:
- `signups` count
- `teams[]` (public teams)
