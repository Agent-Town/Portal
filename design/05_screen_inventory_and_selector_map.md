# Screen Inventory And Selector Map

Status: Active reference

This file gives future design agents a route-by-route map of the main product surfaces, the files that render them, and the most important selector clusters to inspect.

## 1. Start

### Files

- [public/start.html](/Users/robin/.codex/worktrees/3e47/Portal/public/start.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Key selectors

- `.startWrap`
- `.startCard`
- `.startHero`
- `.startVideo`
- `.startTitle`
- `.startEntryActions`
- `.startEnterBtn`
- `.startStatus`
- `.startWarning`

### Current issues

- video competes with CTA
- warning banner damages tone
- card composition could breathe more

## 2. Town Hub And District Modal

### Files

- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Key selectors

- `.townWrap`
- `.townOverview`
- `.townScene`
- `.townDistrictHotspot`
- `#townSceneStatus`
- `.districtBackdrop`
- `.districtModal`
- `.districtModalHeader`
- `.districtModalBody`

### Current issues

- modal chrome is too heavy
- content panels inside modal compete with each other
- primary task is not visually obvious fast enough

## 3. House Flow And House Console

### Files

- [public/views/house.html](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Key sections

- `#pathPanel`
- `#step1Panel`
- `#step2Panel`
- `#houseConsolePanel`
- `#houseOfficePanel`
- `#houseExperiencesPanel`
- `#houseWorkshopPanel`
- `#houseTracksPanel`
- `#houseArchivePanel`
- `#houseTrainerPanel`

### Current issues

- many inline styles
- repeated section-label treatment
- readiness and status prose overpower action hierarchy
- too many equal-weight buttons in the console header

### Inline-style hotspots

- headings with manual margins
- repeated `margin-top` and `margin-bottom`
- district grid shell
- secondary stack spacing

## 4. Agent Dock

### Files

- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Key selectors

- `#agentSidebar.agent-sidebar`
- `.sidebar-header`
- `.status-indicator`
- `.agent-split`
- `.agent-pane-left`
- `.agent-pane-right`
- `.agent-debug-toggle`
- `.agent-panel-zoom-toggle`
- `.agent-minimize-toggle`
- `.chat-box.sidebar-chat`
- `.agent-debug-tab`

### Current issues

- dock is visually louder than necessary
- control language is mixed
- minimized state still claims too much attention
- advanced/debug surfaces feel denser than the main product

## 5. Leaderboard

### Files

- [public/leaderboard.html](/Users/robin/.codex/worktrees/3e47/Portal/public/leaderboard.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Key selectors

- `.topbar`
- `.panel`
- `.pill`
- `#list`
- `#empty`

### Current issues

- empty state lacks intentional structure
- too much dead space
- support metrics are too visually prominent relative to the core content

## 6. Registry

### Files

- [public/registry.html](/Users/robin/.codex/worktrees/3e47/Portal/public/registry.html)
- [public/registry.js](/Users/robin/.codex/worktrees/3e47/Portal/public/registry.js)

### Key selectors

- `.registryShell`
- `.registryFrame`
- `.registryHero`
- `.registrySearch`
- `.registryStatus`
- `.registryList`
- `.registryCard`
- `.registryProjection`
- `.registryActionRow`

### Current issues

- local style system instead of shared system
- title weight too strong
- data-heavy cards read closer to debug UI
- nested box treatments are excessive

## 7. Create

### Files

- [public/create.html](/Users/robin/.codex/worktrees/3e47/Portal/public/create.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Key selectors

- `.topbar`
- `.panel`
- `#createIntro`
- `#shareBtn`
- `#shareStatus`
- `#createNextNote`

### Current issues

- functionally clear, visually older than the strongest surfaces
- topbar and panel chrome are heavier than needed

## 8. Trainer / Brain / Advanced Surface Hotspots

### Files

- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Key selectors

- `.trainerModal`
- `.trainerPanel`
- `.trainerTabs`
- `.trainerTab`
- `.trainerToolLabRow`
- `.agent-mind-panel`
- `#llmOauthProfileInput`
- advanced settings `<details>` block inside the brain panel

### Current issues

- too many nested panels
- inline layout styling in advanced sections
- insufficient distinction between primary actions and utility controls

## 9. Token And Consistency Hotspots

### Files to watch

- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)
- [public/registry.html](/Users/robin/.codex/worktrees/3e47/Portal/public/registry.html)
- [public/views/house.html](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html)
- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)

### Current debt patterns

- inline `style=` usage in templates
- one-off page-local styles
- heavy default panel and button treatments
- insufficient semantic token separation

## 10. Priority Order For Visual Improvement

1. Start
2. Town modal shell
3. House Console
4. House Office
5. Agent Dock
6. Leaderboard
7. Registry
8. Trainer / Brain / advanced surfaces

This order is based on:

- user impact
- information hierarchy risk
- cross-surface consistency leverage
- responsiveness risk
