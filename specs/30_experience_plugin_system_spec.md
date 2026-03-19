# Experience Plugin System Spec

> Status: Implemented
> Date: 2026-03-19
> Branch: `poker-saloon-redesign`

## 1. Objective

Provide a manifest-based plugin system so new experiences can be added to Agent Town without editing shared application files (`app.js`, `styles.css`, `saloon.html`). Experiences declare their configuration in a JSON manifest. The platform discovers, validates, and registers them automatically at startup.

## 2. Problem Statement

Before this system, adding an experience required manual edits to 5 shared files:

| File | Edit |
|------|------|
| `public/app.js` | Add to `districtViews` object |
| `public/app.js` | Add to `EXPERIENCE_UI_MODAL_NAMES` set |
| `public/app.js` | Add to `districtModalThemeByDistrict` mapping |
| `public/styles.css` | Add `[data-theme="<name>"]` CSS rule |
| `public/views/saloon.html` | Add entry links |

This creates merge conflicts, requires knowledge of the platform internals, and prevents AI agents from creating experiences autonomously.

## 3. Solution

### 3.1 Manifest file

Each experience provides `public/experiences/<name>/manifest.json`:

```json
{
  "name": "poker",
  "title": "Portal Poker",
  "parentDistrict": "saloon",
  "entryLabel": "Sit down at the table",
  "entryPrimary": true,
  "secondaryLinks": [
    { "href": "/poker/play/schedule", "label": "Tournament schedule" }
  ],
  "embedPath": "/poker?embed=1",
  "routePrefix": "/poker",
  "theme": {
    "borderColor": "#7a4420",
    "rivetCore": "#d4901a",
    "rivetMid": "#7a4420",
    "rivetEdge": "#2e1608"
  }
}
```

### 3.2 Manifest schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique identifier. Must match directory name. Lowercase, no hyphens. |
| `title` | string | Yes | Human-readable title. Shown in modal header and parent district. |
| `embedPath` | string | Yes | URL loaded in iframe when experience opens. Must include `?embed=1`. |
| `routePrefix` | string | Yes | URL prefix for route detection. Used by `routeToPopupMode` to identify links belonging to this experience. |
| `parentDistrict` | string | No | Name of the district that shows entry links (e.g., `"saloon"`). If omitted, experience has no auto-generated entry point. |
| `entryLabel` | string | No | Text for the primary entry button. Defaults to `title`. |
| `entryPrimary` | boolean | No | If `true`, renders as a primary (highlighted) button. Default `false`. |
| `secondaryLinks` | array | No | Additional links shown in the parent district. Each: `{ "href": string, "label": string }`. |
| `theme` | object | No | Modal border and rivet colors. If omitted, inherits default modal styling. |
| `theme.borderColor` | string | No | CSS color for the modal border. |
| `theme.rivetCore` | string | No | CSS color for the bright rivet center. |
| `theme.rivetMid` | string | No | CSS color for the rivet middle ring. |
| `theme.rivetEdge` | string | No | CSS color for the rivet outer edge. |

### 3.3 Validation rules

- `name` must match the directory name under `public/experiences/`
- All required fields must be present and non-empty
- If validation fails, the experience is skipped with a warning log

## 4. Architecture

### 4.1 Server side

**File:** `server/experience_loader.js`

```
Server starts
  → discoverExperiences() scans public/experiences/*/manifest.json
  → Validates each manifest (required fields, name match)
  → Logs: "Discovered N experience(s): poker, ..."
  → registerExperienceRoutes(app) mounts GET /api/experiences
  → Returns array of validated experience configs
```

**API endpoint:**

```
GET /api/experiences
Response: { ok: true, data: [ { name, title, embedPath, routePrefix, theme, ... } ] }
```

This endpoint is public and cacheable. It returns only client-safe config (no server paths or secrets).

**Route mounting** remains manual in `server/index.js` because each experience has unique dependency injection needs. The experience loader does not auto-mount backend routes.

### 4.2 Client side

**File:** `public/app.js` — `loadExperienceRegistry()` function

```
Browser loads Agent Town
  → loadExperienceRegistry() fetches GET /api/experiences
  → For each experience:
    1. districtViews[name] = { title, viewPath: embedPath }
    2. EXPERIENCE_UI_MODAL_NAMES.add(name)
    3. districtModalThemeByDistrict[name] = name
    4. If theme defined: inject <style> element into document.head
  → registeredExperiences array stored for runtime access
```

**Parent district population:**

**File:** `public/app.js` — `populateSaloonExperiences()` function

```
Saloon view loads
  → bindTownDistrictControls() calls populateSaloonExperiences()
  → Filters registeredExperiences by parentDistrict === 'saloon'
  → For each child experience:
    - Renders a .panel with h2 title
    - Primary CTA button (if entryPrimary)
    - Secondary links from secondaryLinks array
    - Descriptive note about agent connectivity
  → Injects HTML into #saloonExperiences container
```

**Route interception:**

**File:** `public/app.js` — `routeToPopupMode()` function

After checking built-in routes (atlas, poker, etc.), checks registered experiences:

```javascript
const matchedExperience = registeredExperiences.find((e) => {
  const prefix = String(e.routePrefix || '');
  return prefix && path !== prefix && path.startsWith(prefix + '/');
});
if (matchedExperience) {
  return { mode: 'frame', url: `${path}?embed=1`, title: matchedExperience.title };
}
```

**District opening:**

**File:** `public/app.js` — `showDistrict()` function

After checking built-in frame districts (atlas, registry, poker), checks registered experiences:

```javascript
const registeredExp = registeredExperiences.find((e) => e.name === safeDistrict);
if (registeredExp) {
  openRouteInModalFrame(registeredExp.embedPath, registeredExp.title);
  return;
}
```

## 5. Data flow diagram

```
                     ┌─────────────────────────────┐
                     │  public/experiences/poker/   │
                     │       manifest.json          │
                     └─────────────┬───────────────┘
                                   │
                          Server startup
                                   │
                     ┌─────────────▼───────────────┐
                     │   server/experience_loader   │
                     │     discoverExperiences()    │
                     │     GET /api/experiences      │
                     └─────────────┬───────────────┘
                                   │
                          Client fetch
                                   │
                     ┌─────────────▼───────────────┐
                     │   app.js                     │
                     │   loadExperienceRegistry()   │
                     │                              │
                     │   ┌─ districtViews           │
                     │   ├─ MODAL_NAMES             │
                     │   ├─ themeByDistrict         │
                     │   └─ <style> injection       │
                     └─────────────┬───────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
            showDistrict    routeToPopup   populateSaloon
            (open modal)    (link click)   (render links)
```

## 6. Backward compatibility

### 6.1 Built-in districts are unaffected

The following districts are hardcoded and do not use the plugin system:
- `house`, `atlas`, `registry`, `townhall`, `saloon`, `pony`, `leaderboard`, `brain`, `sigil`

They continue to work exactly as before. The plugin system only adds to the existing district infrastructure.

### 6.2 Poker backward compatibility

Poker has both:
- A manifest (`public/experiences/poker/manifest.json`) for automatic registration
- Special handling in `showDistrict` and `routeToPopupMode` for its advanced URL routing (`normalizePokerEmbedUrl`, `inferPokerModalTitle`, `experienceIntentPokerState`)

The special handling takes precedence. The manifest ensures poker appears in the agent tool whitelist and parent district links even if the special handling were removed.

### 6.3 Graceful degradation

If `GET /api/experiences` fails (network error, server issue), the catch block silently continues. All built-in districts still work. Only plugin-registered experiences are unavailable.

## 7. Security considerations

- The manifest is read from the filesystem at startup, not uploaded at runtime
- `GET /api/experiences` returns only client-safe config (title, embed path, theme colors)
- No server paths, secrets, or dependency injection config is exposed
- Experience names are validated against directory names to prevent injection
- Theme CSS values are injected as literal strings in a controlled template

## 8. Testing

### 8.1 Server-side

```javascript
const { discoverExperiences } = require('./server/experience_loader');
const experiences = discoverExperiences();
// Should find poker manifest
assert(experiences.length >= 1);
assert(experiences[0].name === 'poker');
```

### 8.2 Client-side

```javascript
// GET /api/experiences returns valid data
const resp = await fetch('/api/experiences');
const { data } = await resp.json();
assert(data.some(e => e.name === 'poker'));

// After loadExperienceRegistry(), poker is registered
assert(districtViews.poker);
assert(EXPERIENCE_UI_MODAL_NAMES.has('poker'));
```

### 8.3 Integration

1. Open Agent Town → Saloon → verify poker links auto-populate
2. Click poker link → verify modal transitions to poker iframe
3. `agent_town_ui_open_modal({ modal: 'poker' })` → verify it works
4. Remove `public/experiences/poker/manifest.json` → verify poker disappears from Saloon but built-in districts still work

## 9. Files

| File | Role |
|------|------|
| `server/experience_loader.js` | Server-side discovery and API endpoint |
| `public/experiences/poker/manifest.json` | Poker experience manifest (reference impl) |
| `public/app.js` | Client-side registry loader and dynamic registration |
| `public/views/saloon.html` | Template with `#saloonExperiences` placeholder |
| `specs/30_experience_plugin_system_spec.md` | This spec |
| `specs/29_agent_town_experience_creation_guide.md` | Step-by-step creation guide |

## 10. Future extensions

- **Manifest versioning:** Add a `version` field for backward-compatible schema evolution
- **Experience dependencies:** Allow experiences to declare dependencies on other experiences
- **Hot reload:** Watch manifest files for changes and re-register without server restart
- **Experience marketplace:** Remote manifest discovery from a registry URL
- **Capability declarations:** Manifest declares required platform capabilities (wallet, worker, etc.)
- **Server route auto-mounting:** If dependency injection can be standardized, auto-mount backend routes from manifest
