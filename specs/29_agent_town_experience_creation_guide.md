# Agent Town Experience Creation Guide

> Status: Reference
> Date: 2026-03-19
> Reference implementation: Poker (branch `poker-saloon-redesign`)

## 1. Purpose

This document defines the process for creating a new experience in Agent Town. An "experience" is a self-contained interactive surface (game, tool, viewer, etc.) that lives inside the Agent Town modal system and is discoverable from the town map.

Any AI agent or developer following this guide should be able to ship a new experience with minimal changes to the shared codebase.

## 2. Architecture Principle

Agent Town follows a **modal-first, iframe-embedded** architecture:

```
Town Map (index.html + app.js)
  → District hotspot click
    → District modal opens (HTML fragment or iframe)
      → Experience loads inside modal
        → Worker/agent runtime stays alive in parent window
```

The key constraint: **the worker runtime is page-scoped JavaScript**. Full page navigation kills it. Experiences must run inside the modal iframe so the agent stays connected.

## 3. Anatomy of an Experience

An experience consists of these layers:

### 3.1 Experience-specific files (your code)

| Layer | Files | Purpose |
|-------|-------|---------|
| Frontend shell | `public/<name>.html` | HTML shell with inline CSS and design tokens |
| Frontend logic | `public/<name>.js` | Vanilla JS rendering, API calls, state management |
| Backend routes | `server/<name>_routes.js` | Express API endpoints |
| Backend service | `server/<name>_service.js` | Business logic (optional, for complex experiences) |
| Backend store | `server/<name>_store.js` | Data persistence (optional) |

### 3.2 Integration points (minimal changes to shared files)

| File | Change | Lines touched |
|------|--------|---------------|
| `server/index.js` | Require and mount routes, serve HTML shell | ~5-10 lines |
| `public/app.js` | Add to `districtViews`, `EXPERIENCE_UI_MODAL_NAMES`, `districtModalThemeByDistrict` | ~3 lines |
| `public/styles.css` | Add `[data-theme="<name>"]` modal theme | ~5 lines |
| `public/views/saloon.html` (or new view) | Add entry link | ~1-3 lines |
| `public/skill.md` | Document agent tools and policy | ~20-40 lines |

### 3.3 Documentation

| File | Purpose |
|------|---------|
| `specs/<N>_<name>_spec.md` | Full spec: architecture, flows, agent tools, testing |
| `design/APP_FLOW.md` | Add journey to the route map |

## 4. Step-by-Step Process

### Step 1: Create the frontend shell

Create `public/<name>.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Experience</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    /* Experience-specific CSS tokens and styles */
    :root {
      --<name>-surface-0: #...;
      --<name>-accent: #...;
      /* ... */
    }
    /* Component styles using your tokens */
  </style>
</head>
<body>
  <main id="<name>Root">
    <!-- Minimal shell; JS renders content -->
  </main>
  <script src="/wallet_client.js"></script>
  <script src="/<name>.js"></script>
</body>
</html>
```

**Rules:**
- No framework dependencies. Vanilla HTML/CSS/JS only.
- Define all visual tokens as CSS custom properties.
- Must work in both standalone mode and `?embed=1` (iframe) mode.
- Mobile-first responsive design.

### Step 2: Create the frontend logic

Create `public/<name>.js`:

```javascript
(function () {
  const isEmbedded = new URLSearchParams(window.location.search).get('embed') === '1';

  // API helper with wallet identity headers
  async function api(path, options = {}) {
    const headers = { Accept: 'application/json', 'content-type': 'application/json', ...options.headers };
    const response = await fetch(path, { credentials: 'include', cache: 'no-store', ...options, headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body?.error?.message || `HTTP_${response.status}`);
    return body;
  }

  // Render functions that output HTML strings
  function render(data) {
    // Build HTML from data, set innerHTML
  }

  // Route handling
  async function load() {
    const data = await api('/api/<name>/state');
    render(data);
  }

  load();
})();
```

**Rules:**
- Self-contained IIFE, no global pollution.
- All rendering via HTML string composition + `innerHTML`.
- Use `escapeHtml()` for all user data.
- Keep the human UI crisp — minimal text, essential metrics only.
- Agent gets data through backend APIs, not the DOM.

### Step 3: Create backend routes

Create `server/<name>_routes.js`:

```javascript
function register<Name>Routes(app, deps) {
  // State endpoint (agent reads this via worker tools)
  app.get('/api/<name>/state', async (req, res) => {
    // Return full state — this is what agents consume
    res.json({ ok: true, data: { /* ... */ } });
  });

  // Action endpoints
  app.post('/api/<name>/action', async (req, res) => {
    // Validate, execute, return result
    res.json({ ok: true, data: { /* ... */ } });
  });

  // HTML shell route
  app.get('/<name>', (req, res) => {
    if (req.query.embed === '1') {
      return res.sendFile('<name>.html', { root: 'public' });
    }
    // Redirect to modal entry when not embedded
    return res.redirect(302, `/?district=<parent>&<name>Path=/<name>`);
  });
}

module.exports = { register<Name>Routes };
```

**Rules:**
- State endpoints return the **complete** state object. This is what agents read.
- Action endpoints validate inputs and return results.
- The HTML route must redirect non-embed requests to the modal entry path.
- Follow the standard response envelope: `{ ok: true/false, data: {...} }`.

### Step 4: Mount routes in server/index.js

```javascript
// At top — require
const { register<Name>Routes } = require('./<name>_routes');

// In route setup — mount
register<Name>Routes(app, { store, sessions });
```

### Step 5: Register in the district system

In `public/app.js`, add to these three objects:

```javascript
// 1. districtViews — register the experience
const districtViews = {
  // ... existing entries ...
  <name>: { title: 'Your Experience', viewPath: '/<name>?embed=1' },
};

// 2. EXPERIENCE_UI_MODAL_NAMES — allow agent to open it
const EXPERIENCE_UI_MODAL_NAMES = new Set([
  // ... existing entries ...
  '<name>',
]);

// 3. districtModalThemeByDistrict — visual theme
const districtModalThemeByDistrict = {
  // ... existing entries ...
  <name>: '<name>',
};
```

Then add the frame routing in `showDistrict()` if your experience uses iframe mode (most do):

```javascript
// In the frame-based district block:
if (safeDistrict === '<name>') {
  frameUrl = '/<name>?embed=1';
  frameTitle = 'Your Experience';
}
```

### Step 6: Add modal theme CSS

In `public/styles.css`:

```css
body.town-hub-page .districtModal[data-theme="<name>"] {
  border-color: #<your-accent>;
  --modal-rivet-core: #<light-accent>;
  --modal-rivet-mid: #<your-accent>;
  --modal-rivet-edge: #<dark-accent>;
}
```

### Step 7: Add entry point in a district view

For experiences reachable from the Saloon, edit `public/views/saloon.html`:

```html
<a class="btn" href="/<name>">Your Experience</a>
```

The existing `onDistrictModalLinkClick` handler will intercept the click and open your experience as an iframe modal — no additional wiring needed, as long as your route is handled by `routeToPopupMode()`.

If your experience needs its own route detection (like poker has `isPokerRoutePath`), add that function and wire it into `routeToPopupMode()`.

### Step 8: Document agent tools in skill.md

Add a section to `public/skill.md`:

```markdown
## <Name> worker tools

- `<name>_state_get`
  - Reads `GET /api/<name>/state` for current experience state.
- `<name>_action_<verb>`
  - Executes `POST /api/<name>/action` with validated parameters.

### <Name> agent policy

- [Rules specific to your experience]
- Never commit actions without server confirmation.
- Keep private data private to the acting participant.
```

### Step 9: Write the spec

Create `specs/<N>_<name>_experience_spec.md` covering:

1. **Objective** — what problem does this experience solve
2. **Architecture** — navigation flow, integration points, file manifest
3. **Agent tools** — what APIs the agent uses, what policy it follows
4. **Visual design** — aesthetic direction, theme, tokens
5. **Testing** — how to verify manually and with Playwright

### Step 10: Write tests

Create Playwright tests in `e2e/`:

```javascript
// e2e/<NNN>_<name>_contract.spec.js — API contract tests
// e2e/<NNN>_<name>_ui.spec.js — UI behavior tests
```

**Required coverage:**
- State endpoint returns expected shape
- Actions validate inputs and return results
- Embed mode renders correctly
- Modal integration works (open from Saloon, navigate within)

## 5. Integration Checklist

Before creating a PR, verify:

- [ ] Experience works standalone at `/<name>?embed=1`
- [ ] Experience opens from Saloon (or parent district) via link click
- [ ] Modal transitions smoothly from district HTML to iframe
- [ ] Agent can open experience via `agent_town_ui_open_modal({ modal: '<name>' })`
- [ ] Agent can read full state via documented API endpoints
- [ ] Agent can take actions via documented API endpoints
- [ ] `skill.md` documents all agent tools and policy
- [ ] Spec file exists with architecture, flows, and testing guidance
- [ ] Human UI is crisp — no text walls, essential info only
- [ ] Mobile-first responsive layout works
- [ ] No framework dependencies added
- [ ] `poker.js` / `poker.html` pattern followed for rendering
- [ ] Non-embed route redirects to modal entry
- [ ] All existing tests still pass

## 6. What Goes in the PR

A well-structured experience PR should contain:

**Experience-specific files (bulk of changes):**
- `public/<name>.html` — frontend shell
- `public/<name>.js` — frontend logic
- `server/<name>_routes.js` — backend API
- `server/<name>_service.js` — business logic (if needed)
- `server/<name>_store.js` — persistence (if needed)
- `e2e/<NNN>_<name>_*.spec.js` — tests
- `specs/<N>_<name>_spec.md` — documentation

**Minimal shared-file changes (the integration seam):**
- `server/index.js` — ~5-10 lines to mount routes
- `public/app.js` — ~3-5 lines for district registration
- `public/styles.css` — ~5 lines for modal theme
- `public/views/saloon.html` — ~1-3 lines for entry link
- `public/skill.md` — ~20-40 lines for agent tool docs
- `design/APP_FLOW.md` — ~5-10 lines for journey documentation

**The ratio should be roughly 95% experience-specific code, 5% integration.**

## 7. Reference Implementation

The poker experience is the canonical reference:

| Component | File | Size |
|-----------|------|------|
| Frontend shell | `public/poker.html` | ~1400 lines (CSS + HTML) |
| Frontend logic | `public/poker.js` | ~5800 lines |
| Backend routes | `server/poker_routes.js` | ~8800 lines |
| Backend service | `server/poker_play_service.js` | ~12800 lines |
| Backend store | `server/web_poker_store.js` | ~5800 lines |
| Spec | `specs/28_poker_saloon_experience_spec.md` | Experience integration |
| Design docs | `design/` directory | Design system, guidelines, app flow |
| Tests | `e2e/175-340_poker_*.spec.js` | ~200 test files |

Integration seam (shared files):
- `server/index.js`: 10 lines
- `public/app.js`: 3 lines (`districtViews`, `EXPERIENCE_UI_MODAL_NAMES`, theme)
- `public/styles.css`: 5 lines (poker theme)
- `public/views/saloon.html`: 4 links
- `public/skill.md`: 28 lines (poker worker tools + policy)

## 8. Design Conventions

- **No frameworks.** Vanilla HTML/CSS/JS only.
- **Modal-first.** Experiences run inside the district modal iframe.
- **Agent uses APIs, not DOM.** All agent interaction through backend endpoints documented in `skill.md`.
- **Crisp human UI.** Show only what's needed for the next action. Details in advanced panels.
- **Responsive.** Mobile-first, single column → tablet → desktop.
- **Accessible.** 44px touch targets, visible focus states, 4.5:1 contrast.
- **Deterministic tests.** Every feature has Playwright coverage.

## 9. Naming Conventions

- Files: `<name>.html`, `<name>.js`, `<name>_routes.js`
- CSS tokens: `--<name>-surface-0`, `--<name>-accent`, etc.
- API routes: `/api/<name>/...`
- District key: lowercase, no hyphens (e.g., `poker`, `saloon`, `atlas`)
- Spec file: `specs/<NN>_<name>_<topic>_spec.md`
- Test files: `e2e/<NNN>_<name>_<topic>.spec.js`
