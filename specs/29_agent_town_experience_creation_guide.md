# Agent Town Experience Creation Guide

> Status: Reference
> Date: 2026-03-19
> Reference implementation: Poker (branch `poker-saloon-redesign`)

## 1. Purpose

This document defines the process for creating a new experience in Agent Town. An "experience" is a self-contained interactive surface (game, tool, viewer, etc.) that lives inside the Agent Town modal system and is discoverable from the town map.

Experiences use a **manifest-based plugin system**. Adding a new experience requires:
- Dropping a `manifest.json` in `public/experiences/<name>/`
- Creating your frontend and backend files
- One small edit to `server/index.js` to mount routes (because dependency injection is app-specific)

**Zero edits to `app.js`, `styles.css`, or `saloon.html` are needed.** The plugin system handles district registration, modal themes, and parent-district links automatically.

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

## 3. Plugin System

### 3.1 How it works

1. Server scans `public/experiences/*/manifest.json` at startup
2. `GET /api/experiences` serves the registry to the client
3. Client auto-registers each experience:
   - Adds to `districtViews` (modal config)
   - Adds to `EXPERIENCE_UI_MODAL_NAMES` (agent tool whitelist)
   - Adds to `districtModalThemeByDistrict` (visual theme)
   - Injects theme CSS into `<head>` dynamically
4. When a parent district view loads (e.g., Saloon), child experiences auto-populate as links
5. `routeToPopupMode` auto-routes experience URL prefixes to iframe mode

### 3.2 Manifest schema

Create `public/experiences/<name>/manifest.json`:

```json
{
  "name": "<name>",
  "title": "Human-readable Title",
  "parentDistrict": "saloon",
  "entryLabel": "Button label for the primary CTA",
  "entryPrimary": true,
  "secondaryLinks": [
    { "href": "/<name>/sub-route", "label": "Secondary link" }
  ],
  "embedPath": "/<name>?embed=1",
  "routePrefix": "/<name>",
  "theme": {
    "borderColor": "#hex",
    "rivetCore": "#hex",
    "rivetMid": "#hex",
    "rivetEdge": "#hex"
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Must match directory name. Lowercase, no hyphens. |
| `title` | Yes | Shown in modal header and saloon links. |
| `embedPath` | Yes | URL loaded in iframe. Must include `?embed=1`. |
| `routePrefix` | Yes | URL prefix for route detection (e.g., `/poker`). |
| `parentDistrict` | No | Which district shows entry links (e.g., `saloon`). |
| `entryLabel` | No | Primary CTA text. Defaults to `title`. |
| `entryPrimary` | No | If true, renders as primary button in parent. |
| `secondaryLinks` | No | Additional navigation links shown in parent. |
| `theme` | No | Modal border and rivet colors. Injected as CSS. |

### 3.3 What the manifest automates

| Previously manual | Now automatic |
|---|---|
| `app.js` districtViews entry | Auto from manifest `name` + `embedPath` |
| `app.js` EXPERIENCE_UI_MODAL_NAMES entry | Auto from manifest `name` |
| `app.js` districtModalThemeByDistrict entry | Auto from manifest `name` |
| `styles.css` `[data-theme]` rule | Injected from manifest `theme` |
| `saloon.html` links | Auto-populated from `parentDistrict` + `secondaryLinks` |
| `routeToPopupMode` route matching | Auto from manifest `routePrefix` |

### 3.4 What still requires manual wiring

| File | Why |
|------|-----|
| `server/index.js` | Route mounting needs app-specific dependency injection (~5 lines) |
| `public/skill.md` | Agent tool documentation needs human-written context |

## 4. Anatomy of an Experience

### 4.1 Experience-specific files (your code)

| Layer | Files | Purpose |
|-------|-------|---------|
| Manifest | `public/experiences/<name>/manifest.json` | Plugin config |
| Frontend shell | `public/<name>.html` | HTML shell with inline CSS |
| Frontend logic | `public/<name>.js` | Vanilla JS rendering |
| Backend routes | `server/<name>_routes.js` | Express API endpoints |
| Backend service | `server/<name>_service.js` | Business logic (optional) |
| Backend store | `server/<name>_store.js` | Data persistence (optional) |

### 4.2 Manual integration (server only)

In `server/index.js`:

```javascript
// Require
const { register<Name>Routes } = require('./<name>_routes');

// Mount (after other routes)
register<Name>Routes(app, { /* deps */ });
```

## 5. Step-by-Step Process

### Step 1: Create the manifest

```bash
mkdir -p public/experiences/<name>
```

Create `public/experiences/<name>/manifest.json` per the schema above.

### Step 2: Create the frontend shell

Create `public/<name>.html` — HTML shell with inline CSS design tokens. Must work in `?embed=1` mode.

**Rules:**
- No framework dependencies. Vanilla HTML/CSS/JS only.
- Define visual tokens as CSS custom properties.
- Mobile-first responsive design.

### Step 3: Create the frontend logic

Create `public/<name>.js` — self-contained IIFE with API calls and HTML rendering.

**Rules:**
- All rendering via HTML string composition.
- Use `escapeHtml()` for all user data.
- Keep human UI crisp — minimal text, essential metrics only.
- Agent gets data through backend APIs, not the DOM.

### Step 4: Create backend routes

Create `server/<name>_routes.js` with state and action endpoints.

**Rules:**
- State endpoints return the complete state object (agents consume this).
- Follow the standard response envelope: `{ ok: true/false, data: {...} }`.
- HTML route must redirect non-embed requests to modal entry path.

### Step 5: Mount routes in server/index.js

This is the only shared file you edit.

### Step 6: Document agent tools in skill.md

Add a section to `public/skill.md` with worker tools and agent policy.

### Step 7: Write the spec

Create `specs/<N>_<name>_spec.md` covering architecture, flows, agent tools, and testing.

### Step 8: Write tests

Create Playwright tests in `e2e/` for API contracts and UI behavior.

## 6. Integration Checklist

- [ ] `public/experiences/<name>/manifest.json` exists and is valid
- [ ] Experience works standalone at `/<name>?embed=1`
- [ ] Experience opens from parent district via auto-populated link
- [ ] Agent can open it via `agent_town_ui_open_modal({ modal: '<name>' })`
- [ ] Agent can read state and take actions via documented APIs
- [ ] `skill.md` documents agent tools and policy
- [ ] Spec file exists
- [ ] Human UI is crisp — no text walls
- [ ] Mobile responsive
- [ ] No framework dependencies
- [ ] `server/index.js` mounts routes
- [ ] All existing tests still pass

## 7. Reference Implementation

The poker experience is the canonical reference:

| Component | File |
|-----------|------|
| Manifest | `public/experiences/poker/manifest.json` |
| Frontend shell | `public/poker.html` |
| Frontend logic | `public/poker.js` |
| Backend routes | `server/poker_routes.js` |
| Backend service | `server/poker_play_service.js` |
| Spec | `specs/28_poker_saloon_experience_spec.md` |

## 8. How it works end-to-end

```
1. Server starts
   → experience_loader scans public/experiences/*/manifest.json
   → Registers GET /api/experiences endpoint
   → Logs "Discovered 1 experience(s): poker"

2. Browser loads Agent Town
   → app.js calls loadExperienceRegistry()
   → Fetches GET /api/experiences
   → For each experience:
     - Adds to districtViews, EXPERIENCE_UI_MODAL_NAMES, theme mapping
     - Injects theme CSS into document head

3. User clicks Saloon
   → showDistrict('saloon') loads saloon.html
   → bindTownDistrictControls() calls populateSaloonExperiences()
   → Finds experiences with parentDistrict='saloon'
   → Renders entry links (primary CTA + secondary links)

4. User clicks "Sit down at the table"
   → onDistrictModalLinkClick intercepts click
   → routeToPopupMode('/poker') matches isPokerRoutePath
   → Returns { mode: 'frame', url: '/poker?embed=1' }
   → Modal transitions to poker iframe

5. Agent calls agent_town_ui_open_modal({ modal: 'poker' })
   → 'poker' is in EXPERIENCE_UI_MODAL_NAMES (added by loader)
   → showDistrict('poker') finds it in registeredExperiences
   → Opens iframe directly
```

## 9. Design Conventions

- **No frameworks.** Vanilla HTML/CSS/JS only.
- **Modal-first.** Experiences run inside the district modal iframe.
- **Agent uses APIs, not DOM.** Documented in `skill.md`.
- **Crisp human UI.** Essential info only. Details in advanced panels.
- **Manifest-driven.** No shared-file edits except `server/index.js`.
- **Responsive.** Mobile-first, single column → desktop.
- **Accessible.** 44px touch targets, visible focus states, 4.5:1 contrast.
- **Deterministic tests.** Playwright coverage required.
