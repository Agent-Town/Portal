# Poker Saloon Experience Spec

> Status: Implemented
> Date: 2026-03-19
> Branch: `poker-saloon-redesign`

## 1. Objective

Make Portal Poker a first-class experience reachable from the Saloon district in Agent Town. The Saloon serves as the thematic entry point — a Wild West saloon where players walk up to the poker table. Poker itself runs as an embedded iframe inside the district modal, preserving access to the parent `app.js` worker/agent runtime.

## 2. Product Intent

### 2.1 Core bet

If poker is discoverable from the main Agent Town map through the Saloon, players naturally find and engage with the game without needing a direct URL.

### 2.2 User outcomes

- Discover poker by clicking the Saloon on the town map.
- Understand what poker offers from a themed landing view before committing.
- Enter poker seamlessly within the same modal, no page navigation.
- Use the full poker experience (lobby, live table, schedule, rail, seasons, centaur) from inside the modal overlay.
- Agent/worker in `app.js` remains available because poker runs in an iframe child of the town hub.

## 3. Constraints

- Poker must remain embed-compatible (`?embed=1`) as it already is.
- No changes to poker route semantics or API contracts.
- The Saloon view must load fast (static HTML, no JS dependencies).
- Agent intent tools (`agent_town_ui_open_modal('poker')` and `agent_town_ui_open_modal('saloon')`) must continue to work.
- The experience must work on mobile (single-column layout).
- The Wild West saloon aesthetic must be consistent between the Saloon landing and the poker UI.

## 4. Architecture

### 4.1 Navigation flow

```
Town Map → Saloon hotspot (click)
  → showDistrict('saloon')
  → Loads /views/saloon.html (HTML fragment) into district modal
  → User sees Saloon landing with poker entry links
  → User clicks "Poker Table"
  → onDistrictModalLinkClick intercepts click
  → routeToPopupMode('/poker') returns { mode: 'frame', url: '/poker?embed=1' }
  → openRouteInModalFrame('/poker?embed=1', 'Portal Poker')
  → Modal transitions from HTML view → iframe view
  → Poker loads with embed mode, parent gateway accessible
```

### 4.2 Agent-driven flow

```
Agent calls agent_town_ui_open_modal({ modal: 'saloon' })
  → showDistrict('saloon')
  → Saloon view loads in modal

Agent calls agent_town_ui_open_modal({ modal: 'poker' })
  → showDistrict('poker')
  → Poker iframe loads directly (skips Saloon landing)
```

### 4.3 Key integration points

| Component | File | Role |
|-----------|------|------|
| Saloon view | `public/views/saloon.html` | Themed landing with poker links |
| District config | `public/app.js` `districtViews` | Registers saloon and poker |
| Link handler | `public/app.js` `onDistrictModalLinkClick` | Intercepts poker links in saloon |
| Route resolver | `public/app.js` `routeToPopupMode` | Returns `{ mode: 'frame' }` for poker paths |
| Poker embed | `public/poker.html` + `public/poker.js` | Poker UI with `?embed=1` support |
| Modal theme | `public/styles.css` `[data-theme="poker"]` | Visual theme for poker iframe modal |
| Agent intent | `public/app.js` `runExperienceUiOpenModal` | Programmatic modal opening |

### 4.4 Parent-child runtime

When poker runs inside the district modal iframe:
- `window.parent.AgentTownRuntimeGateway` is accessible from poker.js
- `getParentRuntimeGateway()` in poker.js detects and returns the parent gateway
- This enables the worker seat agent mode where the app.js agent can assist with poker decisions

## 5. Saloon View Design

### 5.1 Structure

The Saloon landing view (`/views/saloon.html`) contains:

1. **Header** — "Saloon" title with atmospheric Western copy
2. **Poker entry** — Primary CTA to enter the poker lobby
3. **Quick routes** — Secondary links to schedule, rail, and leaderboard
4. **Coming soon** — Placeholder pills for future saloon experiences

### 5.2 Link behavior

All `/poker/*` links in the Saloon view are intercepted by `onDistrictModalLinkClick`:
- `/poker` → Opens poker lobby iframe
- `/poker/play/schedule` → Opens tournament schedule iframe
- `/poker/play/rail` → Opens spectator rail iframe
- `/poker/play/seasons/native` → Opens season leaderboard iframe

The modal transitions seamlessly from the Saloon HTML view to the poker iframe view without closing and reopening.

## 6. Visual Design

### 6.1 Saloon landing (in district modal)

- Uses the `saloon` theme: warm brown border (`#8e5a36`), amber rivet accents
- Standard district modal UI components (`.panel`, `.btn`, `.pill`)
- Copy evokes Wild West saloon atmosphere

### 6.2 Poker iframe (in district modal)

- Uses a dedicated `poker` theme: deep brown border, whiskey-amber rivets
- Poker UI inside iframe uses the "Dusty Saloon" design system:
  - Dark wood-brown surfaces (`#120904` base)
  - Rye display font + Crimson Text body font
  - Oil-lamp glow, wood-plank grain overlay
  - Weathered leather card panels
  - Aged parchment playing cards with proper suit rendering

### 6.3 Aesthetic continuity

The Saloon landing and Poker iframe share the same Wild West visual language:
- Warm amber/brown color palette
- Western typography character
- Frontier-rough angular elements (small border radii)
- Oil-lamp warm lighting accents

## 7. Modal Theme

### 7.1 Poker theme definition

```css
body.town-hub-page .districtModal[data-theme="poker"] {
  border-color: #7a4420;
  --modal-rivet-core: #d4901a;
  --modal-rivet-mid: #7a4420;
  --modal-rivet-edge: #2e1608;
}
```

### 7.2 Theme mapping

In `app.js` `districtModalThemeByDistrict`:
- `poker` → `'poker'` (was `'leaderboard'`)

## 8. Files Changed

| File | Change |
|------|--------|
| `public/views/saloon.html` | Saloon experience landing with poker entry |
| `public/poker.html` | Wild West saloon CSS redesign |
| `public/poker.js` | Enhanced card rendering with suit symbols |
| `public/app.js` | Poker modal theme mapping |
| `public/styles.css` | Poker modal theme CSS |
| `specs/28_poker_saloon_experience_spec.md` | This spec |
| `design/APP_FLOW.md` | Updated with saloon-to-poker flow |

## 9. Agent Tool Reference

### Opening Saloon

```json
{
  "tool": "agent_town_ui_open_modal",
  "params": { "modal": "saloon" }
}
```

### Opening Poker directly

```json
{
  "tool": "agent_town_ui_open_modal",
  "params": { "modal": "poker" }
}
```

### Poker route intent

The `experienceIntentPokerState.route` field controls which poker route loads:
- Default: `/poker` (lobby)
- Can be set via URL param: `?pokerPath=/poker/play/schedule`

## 10. Testing

### Manual verification

1. Open Agent Town → click Saloon hotspot → see landing with poker links
2. Click "Poker Table" → modal transitions to poker iframe
3. Poker loads with `?embed=1`, shows lobby
4. Navigate within poker (join table, open schedule) — stays in iframe
5. Close modal → returns to town map

### Agent verification

1. Agent calls `agent_town_ui_open_modal({ modal: 'saloon' })` → Saloon opens
2. Agent calls `agent_town_ui_open_modal({ modal: 'poker' })` → Poker iframe opens
3. Verify `window.parent.AgentTownRuntimeGateway` is accessible from poker iframe

## 11. Future Extensions

- Mission board in Saloon (co-op quests)
- House workshop feed
- Live district events
- Voice controls for poker (reserved structural slot exists)
- Additional Saloon games beyond poker
