# D1 Debug Panel Demotion Capture Set

This capture set documents the second town-shell design slice: making the minimized Agent Comms dock feel secondary to the main town action.

## Captures

- `before-town-shell-desktop.png`
- `before-town-shell-mobile.png`
- `after-town-shell-desktop.png`
- `after-town-shell-mobile.png`

## What changed

- the minimized dock moved out of the main focal center and became a quieter secondary surface
- heavy wood and parchment styling was reduced in the at-rest dock
- header typography became calmer and more readable
- extra controls were hidden while minimized so the shell shows fewer competing actions

## Expected reading order after the change

1. town focus card
2. primary action
3. support text
4. minimized Agent Comms dock

## Verification

- `e2e/269_debug_panel_visual_priority.spec.js`
- `e2e/265_town_hub_primary_action_hierarchy.spec.js`
- `e2e/266_mobile_town_hub_clutter_guard.spec.js`
